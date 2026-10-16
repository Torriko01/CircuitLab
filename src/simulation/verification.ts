import { CircuitAdapter } from './adapter';
import { defaultParams } from './templates';
import { crossing, lowState, peak, riseTime } from '../measurement';
import type { LessonId, Params, RunResult } from '../types';

export async function verifyEngine(host:HTMLElement) {
  const engine:{current:CircuitAdapter|null}={current:null};
  const rows:{name:string;actual:number|null;expected:number|null;passed:boolean}[]=[];
  let captures=0;
  const check=(name:string,actual:number|null,expected:number|null,tolerance=0)=>{const passed=expected===null?actual===null:actual!==null&&Math.abs(actual-expected)<=tolerance;rows.push({name,actual,expected,passed});};
  const run=async(lesson:LessonId,params:Partial<Params>={},diagnostic=false,variant=0,halfStep=false)=>{
    engine.current?.dispose();engine.current=new CircuitAdapter(host);
    await engine.current.load({lesson,params:{...defaultParams(lesson),...params},diagnostic,variant,halfStep});
    captures++;return engine.current.capture();
  };
  try {
    let r=await run('divider');check('分压空载 VOUT',r.samples.at(-1)!.nodes.VOUT,1.65,.005);
    r=await run('divider',{connected:true});const s=r.samples.at(-1)!;check('分压带载 VOUT',s.nodes.VOUT,1.1,.005);check('分压支路收支',s.currents.R1-s.currents.R2-s.currents.RL,0,1e-6);
    for(const variant of [0,1])for(const connected of [false,true]){r=await run('divider',{connected},true,variant);check(`分压诊断 ${variant}/${connected}`,r.samples.at(-1)!.nodes.VOUT,variant===1&&!connected?1.65:1.1,.005);}
    r=await run('rc');const at=(r:RunResult,t:number)=>r.samples.reduce((a,b)=>Math.abs(a.t-t)<Math.abs(b.t-t)?a:b);
    check('RC 在 τ 处',at(r,.01).nodes.VC,3.3*(1-Math.exp(-1)),.02);check('RC 在 5τ 处',r.samples.at(-1)!.nodes.VC,3.3*(1-Math.exp(-5)),.02);check('RC 高门限时间',crossing(r.samples,'VC',2.31),-.01*Math.log(.3),.000121);
    for(const resistance of [4700,10000,22000])for(const capacitance of [.47e-6,1e-6,2.2e-6])for(const pulse of [.002,.01,.03]){
      r=await run('rc',{resistance,capacitance,pulse});check(`RC 脉冲 ${resistance}/${capacitance}/${pulse}`,peak(r,'VC'),3.3*(1-Math.exp(-pulse/(resistance*capacitance))),.02);
    }
    let normalRise=0;
    for(const resistance of [470,1000,2200,4700,10000])for(const capacitance of [50e-12,100e-12,200e-12])for(const frequency of [100000,400000]){
      r=await run('i2c',{resistance,capacitance,frequency});const low=lowState(r)!;const expected=.8472978604*resistance*capacitance;
      const t70=resistance*capacitance*Math.log((3.3-low.v)/.99),valid=t70<.5/frequency-r.step*3;
      const actual=riseTime(r).value;check(`I²C tr ${resistance}/${capacitance}/${frequency}`,actual,valid?expected:null,expected*.03);
      check(`I²C 低态 ${resistance}/${capacitance}/${frequency}`,low.v,3.3*100/(resistance+100),.001);
      if(resistance===4700&&capacitance===100e-12&&frequency===400000)normalRise=actual!;
    }
    r=await run('i2c',{},false,0,true);check('I²C 步长减半收敛',riseTime(r).value,normalRise,normalRise*.01);
    for(const variant of [0,1]){r=await run('i2c',{},true,variant);check(`I²C 诊断 ${variant} tr`,riseTime(r).value,.8472978604*.94e-6,.8472978604*.94e-6*.03);check(`I²C 诊断 ${variant} 电流`,lowState(r)!.i,3.3/(variant===0?9500:4800),1e-6);}
    return {browser:navigator.userAgent,captures,checks:rows.length,passed:rows.filter(r=>r.passed).length,rows,at:new Date().toISOString()};
  }finally{engine.current?.dispose();}
}
