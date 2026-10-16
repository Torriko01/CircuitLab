import { CircuitAdapter,ENGINE_REVISION } from './adapter';
import { defaultParams } from './templates';
import { atTime,peak } from '../measurement';
import { edges,risingCount,spiTiming } from '../signalMeasurement';
import type { LessonId,Params,RunResult } from '../types';

// Independent continuous-time references. Never used as UI observations.
function buttonVoltage(t:number,tau:number,press:number,mode:number){
 if(mode===1){
  const response=(a:number,w:number,phase:number)=>a/(1+(w*tau)**2)*(Math.sin(w*t+phase)-w*tau*Math.cos(w*t+phase)-(Math.sin(phase)-w*tau*Math.cos(phase))*Math.exp(-t/tau));
  return 1.65*(1-Math.exp(-t/tau))+response(1.3,2*Math.PI*50,-Math.PI/2)+response(.3,2*Math.PI*1000,0);
 }
 const events:[[number,number],...([number,number])[]]=[[.001,3.3],[.0012,0],[.0014,3.3],[.0016,0],[.0018,3.3],[.001+press,0]];
 let u=0,v=0,last=0;
 for(const [time,next] of events){if(t<time)break;v=u+(v-u)*Math.exp(-(time-last)/tau);u=next;last=time;}
 return u+(v-u)*Math.exp(-(t-last)/tau);
}
function opampReference(input:number,gain:number,upper:number){
 const a=100000,lower=.1,mid=(upper+lower)/2,linear=(a*input+mid)/(1+a/gain),difference=input-linear/gain;
 if(difference>(upper-mid)/a)return (upper+1e-4*(input-(upper-mid)/a))/(1+1e-4/gain);
 if(difference<(lower-mid)/a)return (lower+1e-4*(input-(lower-mid)/a))/(1+1e-4/gain);
 return linear;
}
function dataReference(t:number,period:number,r:number,c:number){
 const steady=3.3*1e9/(1e9+r),tau=r*1e9/(1e9+r)*c;
 let v=0,last=0,u=steady;
 for(let k=1;k*period<=t;k++){v=u+(v-u)*Math.exp(-(k*period-last)/tau);last=k*period;u=k%2===0?steady:0;}
 return u+(v-u)*Math.exp(-(t-last)/tau);
}
export async function verifySignals(host:HTMLElement,progress?:(captures:number,checks:number)=>void){
 const rows:{name:string;actual:number|null;expected:number;tolerance:number;passed:boolean}[]=[];
 const engine:{current:CircuitAdapter|null}={current:null};let captures=0;
 const check=(name:string,actual:number|null,expected:number,tolerance=0)=>rows.push({name,actual,expected,tolerance,passed:actual!==null&&Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance});
 const run=async(lesson:LessonId,params:Partial<Params>={},diagnostic=false,variant=0,halfStep=false)=>{
  engine.current?.dispose();engine.current=new CircuitAdapter(host);await engine.current.load({lesson,params:{...defaultParams(lesson),...params},diagnostic,variant,halfStep});const r=await engine.current.capture();captures++;progress?.(captures,rows.length);return r;
 };
 const buttonCheck=(r:RunResult,resistance:number,cap:number,mode:number,hyst:number,tag:string)=>{
  const tau=resistance*cap,press=r.config.params.pressTime;
  let previous=false,count=0,maximum=0;
  for(const s of r.samples){const v=buttonVoltage(Math.max(0,s.t-r.step/2),tau,press,mode);maximum=Math.max(maximum,v);const next:boolean=previous?v>=(hyst?.99:1.65):v>(hyst?2.31:1.65);if(next&&!previous)count++;previous=next;}
  check(tag+' OUT计数',risingCount(r,'OUT'),count);
  if(mode===0)check(tag+' RAW计数',risingCount(r,'RAW'),3);
  check(tag+' FILTER峰值',peak(r,'FILTER'),maximum,.02);
  for(const time of [.0025,.005,.0085,.012,.0195]){const s=atTime(r,time);check(tag+` FILTER@${time}`,s.nodes.FILTER,buttonVoltage(Math.max(0,s.t-r.step/2),tau,press,mode),.02);}
  const s=atTime(r,.005);check(tag+' RC电流',s.currents.FILTER_R-s.currents.C,0,1e-8);check(tag+' 输出负载',s.currents.LOAD,s.nodes.OUT/1e6,1e-10);
 };
 const ampCheck=(r:RunResult,gain:number,limit:number,tag:string)=>{
  const s=r.samples.at(-1)!,input=r.config.params.signalVoltage,ref=opampReference(input,gain,limit);
  check(tag+' VOUT',s.nodes.VOUT,ref,2e-5);check(tag+' VIN',s.nodes.VIN,input,1e-9);
  check(tag+' FB',s.nodes.FB,ref/gain,2e-5);check(tag+' 差分',s.nodes.PLUS-s.nodes.FB,input-ref/gain,2e-5);
  check(tag+' 反馈KCL',s.currents.RF-s.currents.RG,0,1e-9);check(tag+' 负载电流',s.currents.LOAD,ref/r.config.params.load,2e-8);
 };
 const spiCheck=(r:RunResult,resistance:number,cap:number,edge:number,tag:string)=>{
  const period=1/r.config.params.clockFrequency,tau=resistance*1e9/(1e9+resistance)*cap,t=spiTiming(r);
  check(tag+' 上升时间',t.rise,Math.log(7/3)*tau,2*r.step+1e-10);
  check(tag+' 改变采样间隔',t.minGap,edge===0?period/2:0,2*r.step+1e-12);check(tag+' 事件数',t.events.length,3);
  let bad=0;
  for(let k=2;k<=4;k++){
   const time=(k+(edge===0?.5:0))*period,high=k%2===0;
   const values=[dataReference(time-50e-9,period,resistance,cap),dataReference(time+50e-9,period,resistance,cap)];
   if(edge===1||!values.every(v=>high?v>=2.31:v<=.99))bad++;
  }
  check(tag+' 不保证事件',t.violations,bad);
  for(const phase of [2.25,2.5,2.75,3.5,4.5]){const s=atTime(r,phase*period);check(tag+` DATA@${phase}T`,s.nodes.DATA,dataReference(Math.max(0,s.t-r.step/2),period,resistance,cap),.02);}
  const s=atTime(r,2.5*period);check(tag+' KCL',s.currents.SERIES_R-s.currents.CLINE-s.currents.INPUT,0,1e-8);
 };
 try{
  for(const resistance of [1000,10000,47000])for(const capacitance of [.1e-6,1e-6,2.2e-6])for(const hysteresis of [0,1])for(const pressTime of [.003,.008,.015])for(const inputMode of [0,1]){
   const r=await run('debounce',{resistance,capacitance,hysteresis,pressTime,inputMode});buttonCheck(r,resistance,capacitance,inputMode,hysteresis,`去抖 ${resistance}/${capacitance}/${hysteresis}/${pressTime}/${inputMode}`);
  }
  for(const variant of [0,1])for(const pressTime of [.003,.008,.015]){const r=await run('debounce',{pressTime},true,variant);buttonCheck(r,variant===0?1000:10000,variant===0?.1e-6:1e-6,0,1,`去抖诊断 ${variant}/${pressTime}`);}
  for(const signalVoltage of [.4,1,1.65])for(const closedGain of [1,2,3])for(const outputLimit of [1.6,2.8,3.2])for(const load of [1000,10000,100000]){
   const r=await run('opamp',{signalVoltage,closedGain,outputLimit,load});ampCheck(r,closedGain,outputLimit,`运放 ${signalVoltage}/${closedGain}/${outputLimit}/${load}`);
  }
  for(const variant of [0,1])for(const signalVoltage of [.4,1,1.65]){const r=await run('opamp',{signalVoltage},true,variant);ampCheck(r,variant===0?2:1.6,variant===0?1.6:2.8,`运放诊断 ${variant}/${signalVoltage}`);}
  for(const resistance of [100,1000,2200])for(const capacitance of [100e-12,200e-12])for(const clockFrequency of [500000,1000000,2000000])for(const sampleEdge of [0,1]){
   const r=await run('spi',{resistance,capacitance,clockFrequency,sampleEdge});spiCheck(r,resistance,capacitance,sampleEdge,`SPI ${resistance}/${capacitance}/${clockFrequency}/${sampleEdge}`);
  }
  for(const variant of [0,1])for(const clockFrequency of [500000,1000000,2000000]){const r=await run('spi',{clockFrequency},true,variant);spiCheck(r,variant===0?2200:100,200e-12,variant===0?0:1,`SPI诊断 ${variant}/${clockFrequency}`);}
  for(const [id,params,diagnostic,variant] of [
   ['debounce',{resistance:1000,capacitance:.1e-6,inputMode:1,hysteresis:0},false,0],['debounce',{},true,0],['debounce',{},true,1],
   ['opamp',{},true,0],['opamp',{},true,1],
   ['spi',{resistance:100,capacitance:100e-12,clockFrequency:500000},false,0],['spi',{},true,0],['spi',{},true,1]
  ] as [LessonId,Partial<Params>,boolean,number][]){
   const a=await run(id,params,diagnostic,variant),b=await run(id,params,diagnostic,variant,true),tag=`减半步长 ${id}/${variant}`;
   if(id==='debounce'){check(tag+' 计数',risingCount(b,'OUT'),risingCount(a,'OUT'));check(tag+' 峰值',peak(b,'FILTER'),peak(a,'FILTER'),.01);const ea=edges(a,'OUT').find(e=>e.rising),eb=edges(b,'OUT').find(e=>e.rising);if(ea&&eb)check(tag+' 首沿',eb.t,ea.t,3*a.step);}
   else if(id==='opamp')check(tag,b.samples.at(-1)!.nodes.VOUT,a.samples.at(-1)!.nodes.VOUT,1e-5);
   else{const ta=spiTiming(a),tb=spiTiming(b);check(tag+' 上升时间',tb.rise,ta.rise!,2*a.step);check(tag+' 采样结论',tb.violations,ta.violations!);}
  }
  return {version:'0.4',engineRevision:ENGINE_REVISION,browser:navigator.userAgent,captures,checks:rows.length,passed:rows.filter(r=>r.passed).length,rows,at:new Date().toISOString()};
 }finally{engine.current?.dispose();}
}
