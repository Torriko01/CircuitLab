import { useEffect, useState } from 'react';
import type { RunResult, Sample } from './types';
import { riseTime } from './measurement';
import { views } from './lessonConfig';

function reduce(samples: Sample[], node: string) {
  const stride=Math.max(1,Math.floor(samples.length/500));const out: Sample[]=[];
  for(let i=0;i<samples.length;i+=stride){const bucket=samples.slice(i,i+stride);let low=bucket[0],high=bucket[0];for(const s of bucket){if(s.nodes[node]<low.nodes[node])low=s;if(s.nodes[node]>high.nodes[node])high=s;}out.push(...(low.t<=high.t?[low,high]:[high,low]));}return out;
}
export function Chart({run,previous,cursor,onCursor}:{run:RunResult|null;previous:RunResult|null;cursor:number;onCursor:(n:number)=>void}) {
  const [playing,setPlaying]=useState(false);
  useEffect(()=>{setPlaying(false);},[run?.id]);
  useEffect(()=>{
    if(!playing||!run)return;
    let frame=0;const start=performance.now(),from=cursor>=100?0:cursor;
    const tick=(time:number)=>{const next=Math.min(100,from+(time-start)/40);onCursor(next);if(next<100)frame=requestAnimationFrame(tick);else setPlaying(false);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
    // Playback follows stored samples, independent from the solver's time step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[playing,run?.id]);
  const id=run?.config.lesson;
  const nodes=id?views[id].chart:['VIN','VOUT'];
  const colors=['#367f9d','#197b62','#b27f30'];
  const width=760,height=220,left=48,right=744,top=18,bottom=178;
  const range=id==='mosfet'?14:id==='flyback'?42:id==='pcb'?2.2:id==='adc'?3.9:3.6;
  const grid=id==='mosfet'?[0,3.3,6,9,12]:id==='flyback'?[0,12,24,36,40]:id==='pcb'?[0,.5,1,1.65,2]:[0,1,2,3,3.3,...(id==='adc'?[3.6]:[])];
  const duration=run?.duration||1,x=(t:number)=>left+t/duration*(right-left),y=(v:number)=>bottom-v/range*(bottom-top);
  const path=(r:RunResult,node:string)=>reduce(r.samples,node).map((s,i)=>`${i?'L':'M'}${x(s.t).toFixed(2)},${y(s.nodes[node]).toFixed(2)}`).join(' ');
  const micro=id==='i2c'||id==='power'||id==='adc'||id==='pcb'||id==='spi',unit=micro?'µs':'ms',scale=micro?1e6:1e3;
  const event=run?(id==='power'||id==='pcb'?100e-6:id==='adc'?run.config.params.sampleTime:id==='flyback'?run.config.params.pulse:null):null;
  const rise=id==='i2c'&&run?riseTime(run):null;
  const sample=run?.samples[Math.round((run.samples.length-1)*cursor/100)];
  return <div className="waveform">
    <div className="section-head"><span><span className="tiny-square"/> 捕获波形</span><span className="muted">{run?`${run.samples.length.toLocaleString()} 个仿真步 · 固定电压尺度`:'运行后显示'}</span></div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="电压随仿真时间变化的波形">
      <defs><clipPath id="plot"><rect x={left} y={top} width={right-left} height={bottom-top}/></clipPath></defs>
      {grid.map(v=><g key={v}><line x1={left} x2={right} y1={y(v)} y2={y(v)} stroke="#e6ebe6"/><text x={left-10} y={y(v)+4} textAnchor="end">{v}</text></g>)}
      {[0,.25,.5,.75,1].map(f=><g key={f}><line x1={x(f*duration)} x2={x(f*duration)} y1={top} y2={bottom} stroke="#edf0ea"/><text x={x(f*duration)} y={bottom+24} textAnchor="middle">{run?(f*duration*scale).toFixed(id==='i2c'||duration*scale<=2?2:0):'—'}</text></g>)}
      <text x="14" y="14">V</text><text x={right} y={height-2} textAnchor="end">仿真时间 / {unit}</text>
      <g clipPath="url(#plot)">
        {(id?views[id].thresholds:[]).map(v=><g key={v}><line x1={left} x2={right} y1={y(v)} y2={y(v)} stroke="#c19c6d" strokeDasharray="5 5"/><text x={right-5} y={y(v)-5} textAnchor="end" fill="#907343">{id==='power'?'教学观察线 ':''}{v} V</text></g>)}
        {previous && previous.config.lesson===id && <path d={path(previous,nodes[1]??nodes[0])} fill="none" stroke="#a7afa7" strokeWidth="1.8" strokeDasharray="5 4"/>}
        {run&&nodes.map((n,i)=><path key={n} d={path(run,n)} fill="none" stroke={colors[i]} strokeWidth="2.2"/>)}
        {rise?.t30&&rise.t70&&<><line x1={x(rise.t30)} x2={x(rise.t70)} y1={30} y2={30} stroke="#b27f30" strokeWidth="3"/><text x={x(rise.t70)+6} y={34} fill="#9e702a">tr</text></>}
        {event!==null&&<><line x1={x(event)} x2={x(event)} y1={top} y2={bottom} stroke="#b27f30" strokeDasharray="5 4"/><text x={x(event)+5} y={top+13}>{id==='flyback'?'关断':id==='adc'?'采样结束':'负载接通'}</text></>}
        {sample&&<><line x1={x(sample.t)} x2={x(sample.t)} y1={top} y2={bottom} stroke="#536d63" strokeDasharray="3 3"/>{nodes.map((n,i)=><circle key={n} cx={x(sample.t)} cy={y(sample.nodes[n])} r="4" fill={colors[i]}/>)}</>}
      </g>
      {!run&&<text x="396" y="100" textAnchor="middle" fill="#7c8a81">先运行一次实验，建立你的第一条观测。</text>}
    </svg>
    <div className="chart-footer"><div className="legend">{nodes.map((n,i)=><span key={n}><i style={{background:colors[i]}}/>{n}</span>)}{previous&&<span>┄ 上次 {nodes[1]??nodes[0]}</span>}</div><span>{sample?`游标 ${(sample.t*scale).toFixed(2)} ${unit}`:'游标'}</span></div>
    <input aria-label="波形时间游标" type="range" min="0" max="100" step=".1" value={cursor} onChange={e=>{setPlaying(false);onCursor(+e.target.value);}} disabled={!run}/>
    <button className="text-button playback" disabled={!run} onClick={()=>setPlaying(!playing)}>{playing?'Ⅱ 暂停回放':'▷ 慢放已捕获波形'}</button>
  </div>;
}
