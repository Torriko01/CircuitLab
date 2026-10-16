import { format,peak } from './measurement';
import { edges,risingCount,spiTiming } from './signalMeasurement';
import type { RunResult } from './types';
export function SignalMetrics({run}:{run:RunResult}){
 const id=run.config.lesson,last=run.samples.at(-1)!;
 const items=id==='debounce'?(()=>{const raw=edges(run,'RAW').find(e=>e.rising),out=edges(run,'OUT').find(e=>e.rising);return [
  ['RAW 上升沿',format(risingCount(run,'RAW'),'次'),'输入中的实际电压变化'],['OUT 上升沿',format(risingCount(run,'OUT'),'次'),raw&&out?`首沿延迟 ${format(out.t-raw.t,'ms')}`:'本窗口未形成输出上升沿'],['FILTER 峰值',format(peak(run,'FILTER'),'V'),'对照上门限与有效按住时间']
 ];})():id==='opamp'?[
  ['放大器输出',format(last.nodes.VOUT,'V'),'相对 GND；检查输出范围'],['输入差分 PLUS−FB',format(last.nodes.PLUS-last.nodes.FB,'V'),'饱和后不再直接使用虚短'],['负载电流',format(last.currents.LOAD,'mA'),'理想输出驱动；不表示实物带载保证']
 ]:(()=>{const t=spiTiming(run);return [
  ['DATA 上升时间',format(t.rise,'ns'),'实际 30%–70% 交点'],['改变至采样最短间隔',format(t.minGap,'ns'),'从实际 TX 与 SAMPLE 交点推导'],['不保证的采样事件',format(t.violations,'次'),`${t.events.length} 个观察事件；不是协议判定`]
 ];})();
 return <div className="metrics">{items.map(([label,value,note])=><div key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>;
}
export function SamplingWindows({run}:{run:RunResult}){
 const timing=spiTiming(run),left=48,right=744,x=(t:number)=>left+t/run.duration*(right-left);
 return <div className="sampling-windows"><div className="section-head"><span>实际采样窗口</span><span className="muted">前 50 ns + 后 50 ns</span></div>
 <svg viewBox="0 0 760 72" role="img" aria-label="三个实际采样事件及其建立保持窗口"><line x1={left} x2={right} y1="30" y2="30" stroke="#cad6c9"/>{timing.events.map((e,i)=><g key={i}><rect x={x(e.t-timing.setup)} y="15" width={x(e.t+timing.hold)-x(e.t-timing.setup)} height="30" fill={e.valid?'#dceadd':'#f3ded4'}/><line x1={x(e.t)} x2={x(e.t)} y1="10" y2="48" stroke={e.valid?'#197b62':'#b16745'}/><text x={x(e.t)} y="65" textAnchor="middle">{(e.t*1e6).toFixed(3)} µs</text></g>)}</svg>
 <div className="table-scroll"><table><thead><tr><th>事件</th><th>期望电平</th><th>采样时 DATA</th><th>窗口检查</th></tr></thead><tbody>{timing.events.map((e,i)=><tr key={i}><td>{i+1}</td><td>{e.high?'高':'低'}</td><td>{format(e.value,'V')}</td><td>{e.reason}</td></tr>)}</tbody></table></div>
 <p>检查目标电平在整个窗口内是否成立，并检查 TX 改变沿是否进入窗口。瞬时电压正确，也可能不满足保持条件。当前步长 {format(run.step,'ns')}，相对交点比较按约 {format(2*run.step,'ns')} 分辨；不把重合的教学标记当作实物零延时。SAMPLE 不代表额外信号线。</p></div>;
}
