import { CircuitAdapter, ENGINE_REVISION } from './adapter';
import { defaultParams } from './templates';
import { adcCode, heldSample, minimumSample, riseTime } from '../measurement';
import type { LessonId, Params, RunResult } from '../types';

// Independent closed-form references, never used to generate UI observations.
export async function verifyExtensions(host:HTMLElement, progress?:(captures:number,checks:number)=>void) {
  const rows:{name:string;actual:number|null;expected:number|null;tolerance:number;passed:boolean}[]=[];
  const engine:{current:CircuitAdapter|null}={current:null};let captures=0;
  const check=(name:string,actual:number|null,expected:number|null,tolerance=0)=>rows.push({name,actual,expected,tolerance,passed:actual!==null&&expected!==null&&Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance});
  const run=async(lesson:LessonId,params:Partial<Params>={},diagnostic=false,variant=0,halfStep=false)=>{
    engine.current?.dispose();engine.current=new CircuitAdapter(host);
    await engine.current.load({lesson,params:{...defaultParams(lesson),...params},diagnostic,variant,halfStep});
    const result=await engine.current.capture();captures++;progress?.(captures,rows.length);return result;
  };
  const at=(r:RunResult,t:number)=>r.samples.reduce((a,b)=>Math.abs(a.t-t)<Math.abs(b.t-t)?a:b);
  try {
    for(const drive of [0,1,2,3,4])for(const resistance of [0,4700,40000])for(const load of [25,1000,10000])for(const connected of [false,true]) {
      const r=await run('gpio',{drive,resistance,load,connected}),s=r.samples.at(-1)!;
      const gh=1/(drive===1?25:1e12),gl=1/(drive===2||drive===4?25:1e12),gp=1/(resistance||1e12),gd=1e-6+(connected?1/load:0);
      const expected=3.3*(gh+gp)/(gh+gp+gl+gd),tag=`GPIO ${drive}/${resistance}/${load}/${connected}`;
      check(tag+' 电位',s.nodes.PIN,expected,1e-6);
      check(tag+' KCL',s.currents.HIGH+s.currents.PULL-s.currents.LOW-s.currents.LOAD-s.currents.LEAK,0,1e-8);
    }
    for(const variant of [0,1])for(const connected of [true,false]) {
      const r=await run('gpio',{connected},true,variant),v=r.samples.at(-1)!.nodes.PIN;
      const gh=variant===0?1e-12:.04,gp=1e-12,gl=1e-12,gd=1e-6+(connected ? .04 : 0);
      check(`GPIO 诊断 ${variant}/${connected}`,v,3.3*(gh+gp)/(gh+gp+gl+gd),1e-8);
    }
    for(const resistance of [1,2,10])for(const capacitance of [1e-6,10e-6,47e-6])for(const load of [40,100,330])for(const pulse of [0,50e-6,300e-6]) {
      const r=await run('power',{resistance,capacitance,load,pulse}),on=pulse||.004,z=load+1;
      const ss=3.3*z/(resistance+z),tau=resistance*z/(resistance+z)*capacitance;
      const reference=(t:number)=>t<.0001?3.3:t<.0001+on?ss+(3.3-ss)*Math.exp(-(t-.0001)/tau):3.3+(ss+(3.3-ss)*Math.exp(-on/tau)-3.3)*Math.exp(-(t-.0001-on)/(resistance*capacitance));
      const tag=`供电 ${resistance}/${capacitance}/${load}/${pulse}`;
      const low=minimumSample(r,'VMCU');
      check(tag+' 最低值',low.nodes.VMCU,reference(pulse ? .0001+pulse : r.duration),.006);
      for(const t of [.00012,.0003,.00079]) {const s=at(r,t);check(tag+` V@${t}`,s.nodes.VMCU,reference(s.t),.006);}
      const s=at(r,.00012);check(tag+' KCL',s.currents.PATH-s.currents.CLOCAL-s.currents.LOAD,0,2e-6);
    }
    for(const variant of [0,1])for(const pulse of [50e-6,0]){
      const r=await run('power',{pulse},true,variant),resistance=variant===0?10:2,cap=variant===0?10e-6:1e-6,ss=3.3*41/(41+resistance),tau=resistance*41/(resistance+41)*cap;
      check(`供电诊断 ${variant}/${pulse}`,minimumSample(r,'VMCU').nodes.VMCU,ss+(3.3-ss)*Math.exp(-(pulse||.0007)/tau),.006);
    }
    for(const resistance of [10000,47000,100000])for(const capacitance of [20e-12,100e-12])for(const sampleTime of [.2e-6,1e-6,5e-6,20e-6])for(const reference of [3,3.3,3.6])for(const initial of [0,3.3]) {
      const r=await run('adc',{resistance,capacitance,sampleTime,reference,initial}),s=heldSample(r);
      const expected=1.65+(initial-1.65)*Math.exp(-sampleTime/((resistance+100)*capacitance)),tag=`ADC ${resistance}/${capacitance}/${sampleTime}/${reference}/${initial}`;
      check(tag+' 保持电压',s?.nodes.HOLD??null,expected,.004);
      check(tag+' 参考',s?.nodes.VREF??null,reference,1e-8);
      check(tag+' 保持稳定',s?r.samples.at(-1)!.nodes.HOLD-s.nodes.HOLD:null,0,1e-5);
      check(tag+' 量化',s?adcCode(s.nodes.HOLD,s.nodes.VREF):null,Math.min(4095,Math.max(0,Math.floor(expected/reference*4096))),Math.ceil(.004/reference*4096)+1);
    }
    for(const variant of [0,1])for(const sampleTime of [5e-6,20e-6]) {
      const r=await run('adc',{sampleTime},true,variant),s=heldSample(r),resistance=variant===0?100000:10000,expected=1.65*(1-Math.exp(-sampleTime/((resistance+100)*20e-12)));
      check(`ADC 诊断 ${variant}/${sampleTime} HOLD`,s?.nodes.HOLD??null,expected,.004);
      check(`ADC 诊断 ${variant}/${sampleTime} VREF`,s?.nodes.VREF??null,variant===0?3.3:3.6,1e-8);
    }
    for(const [lesson,params,diagnostic,variant] of [
      ['power',{resistance:1,capacitance:1e-6,pulse:50e-6},false,0],
      ['power',{pulse:0},true,0],
      ['power',{pulse:50e-6},true,1],
      ['adc',{resistance:10000,capacitance:20e-12,sampleTime:.2e-6},false,0],
      ['adc',{sampleTime:5e-6},true,0],
      ['adc',{sampleTime:5e-6},true,1]
    ] as [LessonId,Partial<Params>,boolean,number][]) {
      const a=await run(lesson,params,diagnostic,variant),b=await run(lesson,params,diagnostic,variant,true);
      const value=(r:RunResult)=>lesson==='power'?minimumSample(r,'VMCU').nodes.VMCU:heldSample(r)!.nodes.HOLD;
      check(`减半步长 ${lesson}/${diagnostic}/${variant}/${JSON.stringify(params)}`,value(b),value(a),lesson==='adc'?.002:.006);
    }
    for(const probe of [0,1e6,10e6]){
      const r=await run('divider',{resistance:1e6,probe});const lower=1/(1/1e6+(probe?1/probe:0));
      check(`仪表负载 ${probe}`,r.samples.at(-1)!.nodes.VOUT,3.3*lower/(1e6+lower),1e-5);
    }
    for(const probeCap of [0,10e-12,100e-12]){
      const r=await run('i2c',{frequency:100000,probeCap});
      check(`探头电容 ${probeCap}`,riseTime(r).value,Math.log(7/3)*4700*(100e-12+probeCap),1e-8);
    }
    return {version:'0.2',engineRevision:ENGINE_REVISION,browser:navigator.userAgent,captures,checks:rows.length,passed:rows.filter(r=>r.passed).length,rows,at:new Date().toISOString()};
  }finally{engine.current?.dispose();}
}
