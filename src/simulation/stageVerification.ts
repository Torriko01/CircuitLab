import { CircuitAdapter, ENGINE_REVISION } from './adapter';
import { defaultParams } from './templates';
import { atTime, coilDecay, peak } from '../measurement';
import type { LessonId, Params, RunResult } from '../types';

// References are independent of the solver. They never supply UI observations.
function mosCurrent(gate:number,source:number,path:number,load:number){
 const vgs=gate-source,available=12-source;
 const channel=(vds:number)=>vgs<1.5?vds*1e-8:vds<vgs-1.5?.5*((vgs-1.5)*vds-vds*vds/2):.25*(vgs-1.5)**2+(vds-(vgs-1.5))*1e-8;
 let lo=0,hi=available;
 for(let i=0;i<90;i++){const mid=(lo+hi)/2;if(channel(mid)>(available-mid)/(path+load))hi=mid;else lo=mid;}
 const vds=(lo+hi)/2;return {i:(available-vds)/(path+load),vds};
}
const leakage=1/Math.expm1(.7/(2*.025865));
const vf=(i:number)=>2*.025865*Math.log1p(Math.max(0,i)/leakage);
function decayReference(i0:number,r:number,l:number,clamp:number){
 // Integral dt = L dI / (R I + Vclamp + Vf(I)), evaluated by midpoint quadrature.
 const count=10000,di=.9*i0/count;let t=0;
 for(let i=0;i<count;i++){const current=.1*i0+(i+.5)*di;t+=l*di/(r*current+clamp+vf(current));}
 return t;
}
export async function verifyStages(host:HTMLElement,progress?:(captures:number,checks:number)=>void){
 const rows:{name:string;actual:number|null;expected:number;tolerance:number;passed:boolean}[]=[];
 let engine:CircuitAdapter|null=null,captures=0;
 const check=(name:string,actual:number|null,expected:number,tolerance:number)=>rows.push({name,actual,expected,tolerance,passed:actual!==null&&Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance});
 const run=async(lesson:LessonId,params:Partial<Params>={},diagnostic=false,variant=0,halfStep=false)=>{
  engine?.dispose();engine=new CircuitAdapter(host);await engine.load({lesson,params:{...defaultParams(lesson),...params},diagnostic,variant,halfStep});
  const r=await engine.capture();captures++;progress?.(captures,rows.length);return r;
 };
 const mosCheck=(run:RunResult,gate:number,source:number,path:number,load:number,tag:string)=>{
  const s=run.samples.at(-1)!,ref=mosCurrent(gate,source,path,load);
  check(tag+' I',s.currents.LOAD,ref.i,2e-6);check(tag+' VDS',s.nodes.DRAIN-s.nodes.SOURCE,ref.vds,.0002);
  check(tag+' VGS',s.nodes.GATE-s.nodes.SOURCE,gate-source,1e-9);
  check(tag+' KVL',path*s.currents.PATH+load*s.currents.LOAD+s.nodes.DRAIN-s.nodes.SOURCE+source,12,1e-7);
  check(tag+' KCL',s.currents.PATH-s.currents.LOAD,0,1e-9);
 };
 const coilCheck=(run:RunResult,r:number,l:number,clamp:number,tag:string)=>{
  const d=coilDecay(run),initial=12/(r+1)*(1-Math.exp(-run.config.params.pulse*(r+1)/l));
  check(tag+' 导通电流',d.initial,initial,.0003);
  check(tag+' SW峰值',peak(run,'SW'),12+clamp+vf(initial),.025);
  check(tag+' 10%时间',d.value,decayReference(initial,r,l,clamp),3e-6);
  const start=atTime(run,d.start),i0=start.currents.LCOIL,e0=.5*l*i0*i0;let dissipated=0;
  // Coil power is R*I² + (SW−VIN)*I. This includes diode and ideal clamp absorption.
  const power=(s:RunResult['samples'][number])=>r*s.currents.LCOIL**2+(s.nodes.SW-s.nodes.VIN)*s.currents.LCOIL;
  const samples=run.samples.filter(s=>s.t>=start.t&&s.t<d.start+.0015);
  for(let j=1;j<samples.length;j++){const a=samples[j-1],b=samples[j];dissipated+=(b.t-a.t)*(power(a)+power(b))/2;}
  const end=samples.at(-1)!;
  check(tag+' 能量相对残差',(dissipated+.5*l*end.currents.LCOIL**2-e0)/e0,0,.008);
  const s=atTime(run,d.start+(d.value??.0001)/2);
  check(tag+' 关断KCL',s.currents.LCOIL-s.currents.DCLAMP-s.nodes.SW/1e12,0,5e-5);
 };
 const pcbCheck=(run:RunResult,layout:number,path:number,noise:number,tag:string)=>{
  const p=run.config.params,s=atTime(run,.00025),local=1.65+noise;
  // Solve high-impedance sensor leakage together with the shared return, not just I*R approximation.
  const gload=1/(p.connected?p.load+1:p.load+1e12),input=layout===0?1e-9:0;
  const ground=(5*gload-local*input)/(gload+1/path+input),sgnd=layout===0?ground:0;
  check(tag+' GLOAD',s.nodes.GLOAD,ground,1e-7);check(tag+' SGND',s.nodes.SGND,sgnd,1e-7);
  check(tag+' 本地信号',s.nodes.SIG-s.nodes.SGND,local,1e-9);
  check(tag+' MCU电压',s.nodes.SIG,local+sgnd,1e-7);
  check(tag+' KCL',s.currents.LOAD-s.currents.RETURN-(layout===0?s.currents.INPUT:0),0,1e-8);
  check(tag+' 三电压叠加',(s.nodes.SIG-s.nodes.SGND)+(s.nodes.SGND-s.nodes.GND),s.nodes.SIG-s.nodes.GND,1e-12);
 };
 try{
  for(const gate of [0,1.8,3.3,5])for(const sourceOffset of [0,1.5])for(const pathResistance of [1,10,47])for(const load of [40,100,330]){
   const r=await run('mosfet',{gate,sourceOffset,pathResistance,load});mosCheck(r,gate,sourceOffset,pathResistance,load,`MOS ${gate}/${sourceOffset}/${pathResistance}/${load}`);
  }
  for(const variant of [0,1])for(const load of [40,100,330]){const r=await run('mosfet',{load},true,variant);mosCheck(r,variant===0?1.8:3.3,0,variant===0?1:47,load,`MOS诊断 ${variant}/${load}`);}
  for(const load of [47,100,220])for(const inductance of [.01,.02,.05])for(const protection of [0,12,24])for(const pulse of [.001,.002]){
   const r=await run('flyback',{load,inductance,protection,pulse});coilCheck(r,load,inductance,protection,`续流 ${load}/${inductance}/${protection}/${pulse}`);
  }
  for(const variant of [0,1])for(const pulse of [.001,.002]){const r=await run('flyback',{pulse},true,variant);coilCheck(r,100,.02,variant===0?24:0,`续流诊断 ${variant}/${pulse}`);}
  for(const layout of [0,1])for(const pathResistance of [.1,.5,1])for(const load of [40,100,330])for(const connected of [true,false])for(const signalNoise of [0,.1]){
   const r=await run('pcb',{layout,pathResistance,load,connected,signalNoise});pcbCheck(r,layout,pathResistance,signalNoise,`回流 ${layout}/${pathResistance}/${load}/${connected}/${signalNoise}`);
  }
  for(const variant of [0,1])for(const connected of [true,false]){const r=await run('pcb',{connected},true,variant);pcbCheck(r,0,variant===0?1:.001,variant===0?0:.1,`回流诊断 ${variant}/${connected}`);}
  for(const [id,params,diagnostic,variant] of [
   ['mosfet',{gate:1.8},false,0],['mosfet',{},true,1],
   ['flyback',{load:220,inductance:.01,protection:24,pulse:.002},false,0],['flyback',{},true,0],['flyback',{},true,1],
   ['pcb',{},true,0],['pcb',{},true,1]
  ] as [LessonId,Partial<Params>,boolean,number][]){
   const a=await run(id,params,diagnostic,variant),b=await run(id,params,diagnostic,variant,true),tag=`步长减半 ${id}/${variant}`;
   if(id==='flyback'){check(tag+' 峰值',peak(b,'SW'),peak(a,'SW'),.02);check(tag+' 10%时间',coilDecay(b).value,coilDecay(a).value!,2e-6);}
   else {const sa=id==='pcb'?atTime(a,.00025):a.samples.at(-1)!,sb=id==='pcb'?atTime(b,.00025):b.samples.at(-1)!;check(tag,sb.nodes[id==='pcb'?'SIG':'DRAIN'],sa.nodes[id==='pcb'?'SIG':'DRAIN'],1e-5);}
  }
  return {version:'0.3',engineRevision:ENGINE_REVISION,browser:navigator.userAgent,captures,checks:rows.length,passed:rows.filter(r=>r.passed).length,rows,at:new Date().toISOString()};
 }finally{(engine as CircuitAdapter|null)?.dispose();}
}
