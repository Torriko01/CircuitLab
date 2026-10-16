import { isStage, makeStage, stageDefaults, validateStageParams } from './stages';
import { isSignal, makeSignal, signalDefaults, validateSignalParams } from './signals';
import { lessonIds, type LessonId, type Params, type RunConfig } from '../types';

export const defaultParams = (id: string): Params => {
 const base:Params={resistance:id==='gpio'?0:id==='power'?2:id==='adc'?47000:id==='i2c'?4700:10000,load:id==='power'?40:10000,connected:false,capacitance:id==='power'?10e-6:id==='adc'?20e-12:id==='i2c'?100e-12:1e-6,pulse:id==='power'?50e-6:0,frequency:400000,drive:1,probe:0,probeCap:0,sampleTime:1e-6,reference:3.3,initial:0,...stageDefaults,...signalDefaults};
 return {...base,...(id==='mosfet'?{load:100}:id==='flyback'?{load:100,pulse:.001}:id==='pcb'?{load:40,connected:true}:id==='debounce'?{capacitance:.1e-6}:id==='spi'?{resistance:100,capacitance:200e-12}:{})};
};
const allowed = (v: number, list: number[]) => list.includes(v);
export function validateParams(id: string, p: Params) {
  if(!lessonIds.includes(id as LessonId) || !p || typeof p.connected!=='boolean') throw new Error('未知课程或无效参数');
  if(!Object.keys(defaultParams(id)).every(key=>key==='connected'||Number.isFinite(p[key as keyof Params])))throw new Error('参数缺失或不是有限数值');
  validateStageParams(p);
  validateSignalParams(p);
  if(isSignal(id)){
    if(id==='debounce'&&(!allowed(p.resistance,[1000,10000,47000])||!allowed(p.capacitance,[.1e-6,1e-6,2.2e-6])))throw new Error('去抖参数不在课程预设中');
    if(id==='opamp'&&!allowed(p.load,[1000,10000,100000]))throw new Error('运放负载不在课程预设中');
    if(id==='spi'&&(!allowed(p.resistance,[100,1000,2200])||!allowed(p.capacitance,[100e-12,200e-12])))throw new Error('接口参数不在课程预设中');
    return;
  }
  if(isStage(id)){
    if((id==='mosfet'&&!allowed(p.pathResistance,[1,10,47]))||(id==='pcb'&&!allowed(p.pathResistance,[.1,.5,1])))throw new Error('路径电阻不在课程预设中');
    if(!allowed(p.load,id==='mosfet'?[40,100,330]:id==='flyback'?[47,100,220]:[40,100,330])||!allowed(p.pulse,id==='flyback'?[.001,.002]:[0]))throw new Error('课程参数不在已验证预设中');
    return;
  }
  if(!allowed(p.drive,[0,1,2,3,4]) || !allowed(p.probe,[0,1e6,10e6]) || !allowed(p.probeCap,[0,10e-12,100e-12]) || !allowed(p.sampleTime,[.2e-6,1e-6,5e-6,20e-6]) || !allowed(p.reference,[3,3.3,3.6]) || !allowed(p.initial,[0,3.3])) throw new Error('扩展参数不在已验证预设中');
  if(id==='gpio' || id==='power' || id==='adc') {
    const r=id==='gpio'?[0,4700,40000]:id==='power'?[1,2,10]:[10000,47000,100000];
    const cap=id==='power'?[1e-6,10e-6,47e-6]:id==='adc'?[20e-12,100e-12]:[1e-6];
    const loads=id==='gpio'?[25,1000,10000]:id==='power'?[40,100,330]:[10000];
    if(!allowed(p.resistance,r)||!allowed(p.capacitance,cap)||!allowed(p.load,loads)||!allowed(p.pulse,id==='power'?[0,50e-6,300e-6]:[0])||p.frequency!==400000)throw new Error('课程参数不在已验证预设中');
    return;
  }
  if (!p || typeof p.connected !== 'boolean' || !allowed(p.load, [10000, 47000, 100000]) || !allowed(p.pulse, [0, .002, .01, .03]) || !allowed(p.frequency, [100000, 400000])) throw new Error('参数不在已验证的教学预设中');
  if (!allowed(p.resistance, id === 'i2c' ? [470, 1000, 2200, 4700, 10000] : id === 'rc' ? [4700, 10000, 22000] : [1000, 10000, 100000,1000000])) throw new Error('电阻预设无效');
  if (!allowed(p.capacitance, id === 'i2c' ? [50e-12, 100e-12, 200e-12] : [.47e-6, 1e-6, 2.2e-6])) throw new Error('电容预设无效');
}
export function makeCircuit(c: RunConfig) {
  validateParams(c.lesson, c.params);
  const p = c.params;
  if (c.variant !== 0 && c.variant !== 1) throw new Error('未知题目版本');
  if(isStage(c.lesson))return makeStage(c);
  if(isSignal(c.lesson))return makeSignal(c);
  const label = (x: number, y: number, name: string) => ['VOUT','VC','BUS','PIN','VMCU','A_PIN','HOLD'].includes(name) ? `207 ${x} ${y} ${x} ${y-48} 4 ${name}` : `207 ${x} ${y} ${x-48} ${y} 4 ${name}`;
  let lines: string[], branches: Record<string, number>, nodes: string[], step: number, duration: number;
  const branchTypes:Record<string,string>={};
  if(c.lesson === 'divider') {
    const r1 = c.diagnostic ? c.variant === 0 ? 20000 : 10000 : p.resistance;
    const r2 = c.diagnostic ? 10000 : p.resistance;
    const rl = c.diagnostic && c.variant === 0 ? 1e12 : c.diagnostic ? 10000 : p.load;
    step=1e-5; duration=1e-3;
    lines = ['v 128 288 128 128 0 0 40 3.3 0 0 0.5', `r 128 128 320 128 0 ${r1}`, `r 320 128 320 288 0 ${r2}`, `r 480 176 480 288 0 ${rl}`, 'w 320 128 480 128 0', 'w 128 288 320 288 0', 'w 320 288 480 288 0', 'g 128 288 128 320 0', `s 480 128 480 176 0 ${p.connected?0:1} false`, 'x 208 96 208 96 0 14 R1', 'x 340 204 340 204 0 14 R2', 'x 500 230 500 230 0 14 RL', label(128,128,'VIN'), label(320,128,'VOUT'), label(128,288,'GND')];
    branches={ R1:1, R2:2, RL:3 }; nodes=['VIN','VOUT','GND'];
    lines.push('w 480 128 608 128 0',`r 608 128 608 288 0 ${p.probe || 1e12}`,'w 480 288 608 288 0','x 625 225 625 225 0 14 METER');
  } else if(c.lesson === 'rc') {
    const r = c.diagnostic ? c.variant === 0 ? 22000 : 10000 : p.resistance;
    const cap = c.diagnostic ? 1e-6 : p.capacitance;
    const pulse = c.diagnostic ? .03 : p.pulse;
    const amplitude = c.diagnostic && c.variant === 1 ? 1.8 : 3.3;
    const tau=r*cap;
    duration=(pulse || 0)+5*tau;
    step=Math.min(tau/300, pulse ? pulse/150 : tau/300);
    const period=duration*4;
    lines=[`v 128 288 128 128 0 2 ${1/period} ${amplitude/2} ${amplitude/2} 0 ${pulse ? pulse/period : .5}`, `r 128 128 384 128 0 ${r}`, `c 384 128 384 288 0 ${cap} 0 0`, 'w 128 288 384 288 0','g 128 288 128 320 0', label(128,128,'VIN'),label(384,128,'VC'),label(128,288,'GND')];
    lines.push('x 240 96 240 96 0 14 R','x 405 205 405 205 0 14 C'); branches={R:1}; nodes=['VIN','VC','GND'];
  } else if(c.lesson==='i2c') {
    const r=c.diagnostic ? c.variant===0 ? 9400 : 4700 : p.resistance;
    const cap=(c.diagnostic ? c.variant===0 ? 100e-12 : 200e-12 : p.capacitance)+p.probeCap;
    const period=1/p.frequency;
    step=Math.min(5e-9,.8473*r*cap/60,period/500);
    duration=period*2;
    lines=['v 128 288 128 128 0 0 40 3.3 0 0 0.5',`r 128 128 320 128 0 ${r}`,`c 320 128 320 288 0 ${cap} 0 0`,'w 320 128 384 128 0','w 384 128 384 240 0','159 384 240 448 240 0 100 1000000000000 2.5','w 448 240 448 288 0',`v 240 288 240 256 0 2 ${p.frequency} 2.5 2.5 0 0.5`,'w 240 256 416 256 0','w 128 288 240 288 0','w 240 288 320 288 0','w 320 288 448 288 0','g 128 288 128 320 0',label(128,128,'VDD'),label(320,128,'BUS'),label(240,256,'CTRL'),label(128,288,'GND')];
    lines.push('x 210 96 210 96 0 14 RP','x 340 260 340 260 0 14 CB_TOTAL'); branches={RP:1}; nodes=['VDD','BUS','CTRL','GND'];
  } else if(c.lesson==='gpio') {
    const drive=c.diagnostic?(c.variant===0?3:1):p.drive;
    const pull=p.resistance || 1e12, load=c.diagnostic?25:p.load;
    step=1e-5;duration=1e-3;
    lines=['v 128 288 128 128 0 0 40 3.3 0 0 0.5',`r 128 128 320 128 0 ${drive===1?25:1e12}`,`r 320 128 320 288 0 ${drive===2||drive===4?25:1e12}`,`r 480 64 480 128 0 ${pull}`,`r 640 176 640 288 0 ${load}`,'r 544 128 544 288 0 1000000','w 128 128 128 64 0','w 128 64 480 64 0','w 320 128 480 128 0','w 480 128 544 128 0','w 544 128 640 128 0',`s 640 128 640 176 0 ${p.connected?0:1} false`,'w 128 288 320 288 0','w 320 288 544 288 0','w 544 288 640 288 0','g 128 288 128 320 0',label(128,128,'VDD'),label(320,128,'PIN'),label(128,288,'GND'),'x 210 105 210 105 0 14 HIGH','x 340 252 340 252 0 14 LOW','x 488 55 488 55 0 14 PULL','x 550 266 550 266 0 14 LEAK','x 652 270 652 270 0 14 LOAD'];
    branches={HIGH:1,LOW:2,PULL:3,LOAD:4,LEAK:5};nodes=['VDD','PIN','GND'];
  } else if(c.lesson==='power') {
    const r=c.diagnostic?(c.variant===0?10:2):p.resistance;
    const cap=c.diagnostic?(c.variant===0?10e-6:1e-6):p.capacitance;
    const load=c.diagnostic?40:p.load, on=p.pulse||.004, period=.008;
    step=Math.min(2e-7,(r*(load+1)/(r+load+1))*cap/50);duration=.0008;
    lines=['v 128 320 128 128 0 0 40 3.3 0 0 0.5',`r 128 128 320 128 0 ${r}`,`c 320 128 320 320 0 ${cap} 3.3 3.3`,`r 480 128 480 208 0 ${load}`,'w 320 128 480 128 0','w 480 208 512 208 0','159 512 208 576 208 0 1 1000000000000 2.5','w 576 208 576 320 0',`v 192 320 192 256 0 2 ${1/period} 2.5 2.5 ${2*Math.PI*(1-.0001/period)} ${on/period}`,'w 192 256 544 256 0','w 544 256 544 224 0','w 128 320 192 320 0','w 192 320 320 320 0','w 320 320 576 320 0','g 128 320 128 352 0',label(128,128,'VIN'),label(320,128,'VMCU'),label(192,256,'CTRL'),label(128,320,'GND'),'x 205 100 205 100 0 14 PATH','x 333 270 333 270 0 14 CLOCAL','x 492 195 492 195 0 14 LOAD'];
    branches={PATH:1,CLOCAL:2,LOAD:3};branchTypes.CLOCAL='CapacitorElm';nodes=['VIN','VMCU','CTRL','GND'];
  } else {
    const r=c.diagnostic?(c.variant===0?100000:10000):p.resistance;
    const ref=c.diagnostic?(c.variant===0?3.3:3.6):p.reference;
    const cap=c.diagnostic?20e-12:p.capacitance, initial=c.diagnostic?0:p.initial;
    duration=Math.max(5e-6,p.sampleTime*1.5);const period=duration*4;
    step=Math.min(5e-9,(r+100)*cap/300,p.sampleTime/300);
    lines=['v 128 320 128 128 0 0 40 1.65 0 0 0.5',`r 128 128 288 128 0 ${r}`,'159 288 128 352 128 0 100 1000000000000 2.5','w 352 128 480 128 0',`c 480 128 480 320 0 ${cap} ${initial} ${initial}`,'r 624 128 624 320 0 1000000000000','w 480 128 624 128 0',`v 192 320 192 208 0 2 ${1/period} 2.5 2.5 0 ${p.sampleTime/period}`,'w 192 208 320 208 0','w 320 208 320 144 0',`v 736 320 736 128 0 0 40 ${ref} 0 0 0.5`,'w 128 320 192 320 0','w 192 320 480 320 0','w 480 320 624 320 0','w 624 320 736 320 0','g 128 320 128 352 0',label(128,128,'VIN'),label(288,128,'A_PIN'),label(480,128,'HOLD'),label(192,208,'CTRL'),label(736,128,'VREF'),label(128,320,'GND'),'x 185 100 185 100 0 14 SOURCE','x 500 270 500 270 0 14 CHOLD'];
    branches={SOURCE:1,CHOLD:4};branchTypes.CHOLD='CapacitorElm';nodes=['VIN','A_PIN','HOLD','CTRL','VREF','GND'];
  }
  if(c.halfStep) step/=2;
  // Dots, voltage colors; hide actual component values in diagnostic mode.
  return { text:[`$ ${c.diagnostic ? 17 : 1} ${step} 1000 50 3.3 50 ${step/16}`, ...lines].join('\n'), branches, branchTypes, nodes, step, duration };
}
