import type { RunResult, Sample } from './types';
export function crossing(samples: Sample[], node: string, threshold: number, start = 0, end = Infinity): number | null {
  for(let i=1;i<samples.length;i++) {
    const a=samples[i-1], b=samples[i];
    if(a.t < start || b.t>end) continue;
    const va=a.nodes[node], vb=b.nodes[node];
    if(va<threshold && vb>=threshold && vb>va) return a.t+(b.t-a.t)*(threshold-va)/(vb-va);
  }
  return null;
}
export function riseTime(run: RunResult) {
  const s=run.samples;
  let start=-1, end=Infinity;
  for(let i=1;i<s.length;i++) if(s[i-1].nodes.CTRL>2.5 && s[i].nodes.CTRL<2.5) {start=s[i-1].t;break;}
  if(start<0) return { value:null, t30:null, t70:null, start:0, status:'未捕获释放事件' };
  for(const a of s) if(a.t>start+run.step*2 && a.nodes.CTRL>2.5) {end=a.t;break;}
  const t30=crossing(s,'BUS',.99,start,end), t70=crossing(s,'BUS',2.31,start,end);
  return {value:t30!==null && t70!==null ? t70-t30 : null, t30,t70,start,status:t30!==null && t70!==null ? '有效' : '本次窗口未形成完整边沿'};
}
export function lowState(run: RunResult) {
  const valid=run.samples.filter(s=>s.nodes.CTRL>2.5 && s.t>.3/run.config.params.frequency && s.t<.49/run.config.params.frequency);
  if(!valid.length) return null;
  const s=valid[valid.length-1];return {v:s.nodes.BUS,i:s.currents.RP,t:s.t};
}
export const peak = (run: RunResult, node: string) => run.samples.reduce((p,s)=>Math.max(p,s.nodes[node]), -Infinity);
export function minimumSample(run:RunResult,node:string) { return run.samples.reduce((a,b)=>a.nodes[node]<=b.nodes[node]?a:b); }
export function heldSample(run:RunResult) {
  // The fixed engine updates the analog switch from the preceding node state.
  // Read the first complete step after the control edge, not its transitional step.
  for(let i=1;i<run.samples.length;i++) if(run.samples[i-1].nodes.CTRL>2.5 && run.samples[i].nodes.CTRL<2.5) {
    const held=run.samples[i+1];return held&&held.nodes.CTRL<2.5?held:null;
  }
  return null;
}
// Explicit ideal quantizer: floor(4096*VHOLD/VREF), clipped to 0..4095.
export function adcCode(v:number,reference:number):number|null {
  if(!Number.isFinite(v)||!Number.isFinite(reference)||reference<=0)return null;
  return Math.max(0,Math.min(4095,Math.floor(v/reference*4096)));
}
export function belowDuration(run:RunResult,node:string,threshold:number) {
  let total=0;
  for(let i=1;i<run.samples.length;i++) {
    const a=run.samples[i-1],b=run.samples[i],va=a.nodes[node],vb=b.nodes[node],dt=b.t-a.t;
    if(va<threshold&&vb<threshold)total+=dt;
    else if((va<threshold)!==(vb<threshold)){const frac=(threshold-va)/(vb-va);total+=dt*(va<threshold?frac:1-frac);}
  }
  return total;
}
export const format = (value: number|null, unit: string) => value===null ? '—' : `${(value*(unit==='mA'?1e3:unit==='ns'?1e9:unit==='ms'?1e3:unit==='µs'?1e6:1)).toLocaleString('zh-CN',{maximumFractionDigits:unit==='code'?0:unit==='V'?4:unit==='mA'||unit==='W'||unit==='mJ'?4:2})} ${unit}`;

export function coilDecay(run:RunResult) {
 const samples=run.samples;
 for(let i=1;i<samples.length-1;i++)if(samples[i-1].nodes.CTRL>2.5&&samples[i].nodes.CTRL<2.5){
  const start=samples[i+1],initial=samples[i-1].currents.LCOIL;
  if(!(initial>0)||start.nodes.CTRL>=2.5)break;
  const threshold=.1*initial;
  if(start.currents.LCOIL<=threshold)return {value:0,start:start.t,end:start.t,initial,status:'有效'};
  for(let j=i+2;j<samples.length;j++){
   const a=samples[j-1],b=samples[j];if(b.nodes.CTRL>2.5)break;
   if(a.currents.LCOIL>threshold&&b.currents.LCOIL<=threshold){const end=a.t+(b.t-a.t)*(a.currents.LCOIL-threshold)/(a.currents.LCOIL-b.currents.LCOIL);return {value:end-start.t,start:start.t,end,initial,status:'有效'};}
  }
  return {value:null,start:start.t,end:null,initial,status:'窗口内未降至初始电流的 10%'};
 }
 return {value:null,start:0,end:null,initial:null,status:'未捕获完整关断事件'};
}
export const atTime=(run:RunResult,t:number)=>run.samples.reduce((a,b)=>Math.abs(a.t-t)<=Math.abs(b.t-t)?a:b);
