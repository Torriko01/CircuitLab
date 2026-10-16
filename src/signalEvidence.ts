import type { Evidence } from './types';
export function signalDistinguishing(e:Evidence){
 if(e.lesson==='debounce')return e.parameters?.pressTime===.008&&((e.kind==='edges'&&['上升沿 RAW','上升沿 OUT'].includes(e.label))||(e.kind==='peak'&&e.label==='峰值 FILTER'));
 if(e.lesson==='opamp')return e.kind==='voltage'&&['V(VIN) − V(GND)','V(VOUT) − V(GND)','V(PLUS) − V(FB)'].includes(e.label);
 if(e.lesson==='spi')return e.parameters?.clockFrequency===1000000&&((e.kind==='rise'&&e.label==='DATA 30%–70% 上升时间')||(e.kind==='aperture'&&e.label==='改变沿至采样沿最短间隔')||(e.kind==='violations'&&e.label==='不保证的采样事件数'));
 return false;
}
export function signalProof(items:Evidence[]){
 const id=items[0]?.lesson,valid=items.filter(e=>e.purpose==='distinguish'&&signalDistinguishing(e));
 if(id==='debounce'||id==='spi'){
  const labels=id==='debounce'?['上升沿 RAW','上升沿 OUT','峰值 FILTER']:['DATA 30%–70% 上升时间','改变沿至采样沿最短间隔','不保证的采样事件数'];
  return valid.some(base=>labels.every(label=>valid.some(e=>e.runId===base.runId&&e.label===label)));
 }
 if(id==='opamp')return valid.some(base=>base.parameters?.signalVoltage===1&&['V(VIN) − V(GND)','V(VOUT) − V(GND)','V(PLUS) − V(FB)'].every(label=>valid.some(e=>e.runId===base.runId&&e.parameters?.signalVoltage===1&&e.label===label))&&valid.some(e=>e.label==='V(VOUT) − V(GND)'&&e.parameters?.signalVoltage===.4));
 return false;
}
