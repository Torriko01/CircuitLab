import type { RunResult } from './types';
import { crossing } from './measurement';
export type Edge={t:number;rising:boolean;index:number};
export function edges(run:RunResult,node:string,threshold=1.65):Edge[]{
 const out:Edge[]=[];
 for(let i=1;i<run.samples.length;i++){
  const a=run.samples[i-1],b=run.samples[i],va=a.nodes[node],vb=b.nodes[node];
  if((va<threshold&&vb>=threshold)||(va>=threshold&&vb<threshold))out.push({t:a.t+(b.t-a.t)*(threshold-va)/(vb-va),rising:vb>va,index:i});
 }
 return out;
}
export const risingCount=(run:RunResult,node:string)=>edges(run,node).filter(e=>e.rising).length;
export function nodeAt(run:RunResult,node:string,t:number){
 const s=run.samples;if(!s.length||t<s[0].t||t>s.at(-1)!.t)return null;
 let lo=0,hi=s.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(s[mid].t<=t)lo=mid;else hi=mid;}
 const a=s[lo],b=s[hi];return a.nodes[node]+(b.nodes[node]-a.nodes[node])*(t-a.t)/(b.t-a.t);
}
export function spiTiming(run:RunResult){
 const period=1/run.config.params.clockFrequency,launches=edges(run,'TX'),sampleEdges=edges(run,'SAMPLE').filter(e=>e.rising&&e.t>1.8*period&&e.t<4.9*period);
 const setup=50e-9,hold=50e-9;
 const events=sampleEdges.map(e=>{
  const previous=launches.filter(a=>a.t<=e.t+run.step*.1).at(-1);
  const high=previous?previous.rising:true;
  const value=nodeAt(run,'DATA',e.t);
  const window=run.samples.filter(s=>s.t>=e.t-setup&&s.t<=e.t+hold).map(s=>s.nodes.DATA);
  const a=nodeAt(run,'DATA',e.t-setup),b=nodeAt(run,'DATA',e.t+hold);
  if(a!==null)window.push(a);if(b!==null)window.push(b);
  const stableSource=!launches.some(a=>a.t>e.t-setup&&a.t<e.t+hold);
  const valid=stableSource&&a!==null&&b!==null&&window.length>0&&window.every(v=>high?v>=2.31:v<=.99);
  return {t:e.t,high,value,gap:previous?Math.max(0,e.t-previous.t):null,valid,reason:!stableSource?'源改变沿进入采样窗口':valid?'满足本课窗口':'DATA 未在整个窗口保持保证电平'};
 });
 const rise=launches.find(e=>e.rising&&e.t>1.8*period),next=rise?launches.find(e=>e.t>rise.t+run.step):null;
 const start=rise?run.samples[Math.max(0,rise.index-1)].t:0,end=next?run.samples[next.index].t:0;
 const t30=rise?crossing(run.samples,'DATA',.99,start,end):null,t70=rise?crossing(run.samples,'DATA',2.31,start,end):null;
 const riseValue=t30!==null&&t70!==null?t70-t30:null;
 const gaps=events.map(e=>e.gap).filter((v):v is number=>v!==null);
 return {events,setup,hold,rise:riseValue,t70,minGap:gaps.length?Math.min(...gaps):null,violations:events.length?events.filter(e=>!e.valid).length:null};
}
