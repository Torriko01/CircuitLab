import type { RunResult, Params } from './types';
import { atTime, coilDecay, format, peak } from './measurement';

export function StageMetrics({run}:{run:RunResult}){
 const last=run.samples.at(-1)!,id=run.config.lesson;
 const items=id==='mosfet'?[
  ['实际 VGS',format(last.nodes.GATE-last.nodes.SOURCE,'V'),'GATE − SOURCE'],
  ['MOSFET 漏源压降',format(last.nodes.DRAIN-last.nodes.SOURCE,'V'),'与路径压降一起定位'],
  ['沟道直流功耗',format((last.nodes.DRAIN-last.nodes.SOURCE)*last.currents.LOAD,'W'),'VDS × ILOAD；不推导温升']
 ]:id==='flyback'?[
  ['SW 窗口峰值',format(peak(run,'SW'),'V'),'相对 GND 的开关电压'],
  ['电流降至 10% 时间',format(coilDecay(run).value,'µs'),'自首个完整断开步起算'],
  ['关断前储能',format(.5*run.config.params.inductance*(coilDecay(run).initial??0)**2*1000,'mJ'),'½LI²；不代表器件允许能量']
 ]:(()=>{const s=atTime(run,.00025);return [
  ['本地传感器信号',format(s.nodes.SIG-s.nodes.SGND,'V'),'SIG − SGND @250 µs'],
  ['参考地偏移',format(s.nodes.SGND-s.nodes.GND,'V'),'SGND − GND @250 µs'],
  ['MCU 端看到的电压',format(s.nodes.SIG-s.nodes.GND,'V'),'两项电压差相加 @250 µs']
 ];})();
 return <div className="metrics">{items.map(([label,value,note])=><div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>;
}

export function CurrentTrace({run,cursor}:{run:RunResult;cursor:number}){
 const coil=run.config.lesson==='flyback',branch=coil?'LCOIL':'LOAD',max=coil?280:140;
 const left=48,right=744,top=20,bottom=135,x=(t:number)=>left+t/run.duration*(right-left),y=(i:number)=>bottom-i*1000/max*(bottom-top);
 // Preserve extrema and their ordering so switch edges survive decimation.
 const out:typeof run.samples=[];
 const stride=Math.max(1,Math.floor(run.samples.length/500));
 for(let i=0;i<run.samples.length;i+=stride){const bucket=run.samples.slice(i,i+stride);let lo=bucket[0],hi=bucket[0];for(const s of bucket){if(s.currents[branch]<lo.currents[branch])lo=s;if(s.currents[branch]>hi.currents[branch])hi=s;}out.push(...(lo.t<hi.t?[lo,hi]:[hi,lo]));}
 const d=out.map((s,i)=>`${i?'L':'M'}${x(s.t).toFixed(2)},${y(s.currents[branch]).toFixed(2)}`).join(' '),s=run.samples[Math.round((run.samples.length-1)*cursor/100)];
 return <div className="waveform current-trace"><div className="section-head"><span>支路电流 · {branch}</span><span className="muted">独立 mA 轴 · {format(s.currents[branch],'mA')}</span></div><svg viewBox="0 0 760 170" role="img" aria-label={`${branch} 电流随时间变化的波形`}>
 {[0,max/2,max].map(v=><g key={v}><line x1={left} x2={right} y1={y(v/1000)} y2={y(v/1000)} stroke="#e6ebe6"/><text x={left-9} y={y(v/1000)+4} textAnchor="end">{v}</text></g>)}
 <text x="10" y="13">mA</text><path d={d} fill="none" stroke="#b27f30" strokeWidth="2"/><line x1={x(s.t)} x2={x(s.t)} y1={top} y2={bottom} stroke="#536d63" strokeDasharray="3 3"/>
 {[0,.25,.5,.75,1].map(f=><text key={f} x={x(f*run.duration)} y="157" textAnchor="middle">{(f*run.duration*(coil?1000:1e6)).toFixed(coil?2:0)}</text>)}<text x="744" y="169" textAnchor="end">{coil?'ms':'µs'}</text></svg>
 <p className="muted">{coil?'关断后线圈电流仍沿原方向，经保护支路衰减。电压与电流来自同一次求解。':'负载在 100–400 µs 导通。回流段电流与传感器参考电位应对照观察。'}</p></div>;
}

export function ReturnLayout({params,diagnostic}:{params:Params;diagnostic:boolean}){
 const shared=diagnostic||params.layout===0;
 return <section className="panel return-layout"><div className="section-head"><span>预制回流接法 · {shared?'共用路径':'独立返回'}</span><span className="source-tag">集中参数示意</span></div>
 <svg viewBox="0 0 760 240" role="img" aria-label="负载、传感器与 MCU 的回流连接示意">
 <g fill="#f4f7f2" stroke="#b9c8bd"><rect x="40" y="35" width="140" height="66" rx="8"/><rect x="310" y="35" width="150" height="66" rx="8"/><rect x="580" y="35" width="140" height="66" rx="8"/></g>
 <g fill="#354f44" fontSize="15" textAnchor="middle"><text x="110" y="61">脉冲负载</text><text x="110" y="84">GLOAD</text><text x="385" y="61">传感器</text><text x="385" y="84">SGND</text><text x="650" y="61">MCU 输入</text><text x="650" y="84">GND 参考点</text></g>
 <path d="M460 53H580" stroke="#367f9d" strokeWidth="3"/><text x="490" y="42" fill="#367f9d" fontSize="13">SIG</text>
 <path d="M110 101V150H530v40h120V101" fill="none" stroke="#b27f30" strokeWidth="4"/>
 <path d={shared?'M385 101V150':'M385 101V210H650V190'} fill="none" stroke="#197b62" strokeWidth="3"/>
 <rect x="450" y="139" width="80" height="22" fill="#fff" stroke="#b27f30" strokeWidth="2"/>
 <text x="490" y="131" textAnchor="middle" fill="#765e33" fontSize="13">{diagnostic?'实际阻抗隐藏':`${params.pathResistance} Ω 等效段`}</text>
 <text x="650" y="231" textAnchor="middle" fill="#5b7165" fontSize="13">理想参考点</text>
 <text x="88" y="179" fill="#765e33" fontSize="13">负载回流 →</text>
 <text x={shared?210:400} y={shared?210:230} fill="#197b62" fontSize="13">{shared?'敏感参考共用该阻抗段':'敏感参考独立返回'}</text>
 </svg><p className="muted">预制连接映射到上方电路的 SHARED_R。线条展示接法；不表示电流密度、PCB 尺寸或电磁场分布。高频回流需另查参考平面的连续性。</p></section>;
}
