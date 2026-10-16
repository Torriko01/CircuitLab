import { useEffect, useRef, useState } from 'react';
import { lessons, type Lesson, type Option } from './content';
import { evaluate, freshProgress, freshStore, parseStore, MAX_RECORD_BYTES, STORAGE_KEY } from './store';
import { defaultParams } from './simulation/templates';
import { COURSE_VERSION, diagnosticControls, extraControls, measurementNotes, views } from './lessonConfig';
import { CircuitAdapter, ENGINE_REVISION } from './simulation/adapter';
import { adcCode, coilDecay, belowDuration, crossing, format, heldSample, lowState, minimumSample, peak, riseTime } from './measurement';
import { SignalMetrics,SamplingWindows } from './SignalPanels';
import { risingCount,spiTiming } from './signalMeasurement';
import { StageMetrics, CurrentTrace, ReturnLayout } from './StagePanels';
import { Chart } from './Chart';
import { references } from './engineering';
import type { Evidence, LessonId, MeasurementKind, Params, Phase, Progress, RunResult, Store } from './types';
import { SandboxPage, type SandboxHandle, type SandboxSeed } from './sandbox/SandboxPage';

const phaseNames:Record<Phase,string>={intro:'认识任务',predict:'先做预测',explore:'动手实验',diagnose:'诊断取证',judge:'提交判断',transfer:'迁移检查',review:'学习复盘'};
const phases=Object.keys(phaseNames) as Phase[];
function Choice({label,options,value,onChange}:{label:string;options:Option[];value:string;onChange:(s:string)=>void}) {
  return <fieldset><legend>{label}</legend><div className="choices">{options.map(o=><label key={o.id} className={`choice ${value===o.id?'selected':''}`}><input type="radio" name={label} checked={value===o.id} onChange={()=>onChange(o.id)}/><span>{o.text}</span></label>)}</div></fieldset>;
}
function Select({label,value,options,onChange,disabled=false}:{label:string;value:string|number;options:[string|number,string][];onChange:(v:string)=>void;disabled?:boolean}) {
  return <label className="field">{label}<select aria-label={label} value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}>{options.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>;
}
let initialWarning='';
let blockStorageWrite=false;
function loadInitial(){
  try {
    const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return freshStore();
    let data:Store;
    try{data=parseStore(raw);}catch{
      try{localStorage.setItem(STORAGE_KEY+'-recovery',raw);initialWarning='先前记录无法读取，已保留恢复副本。当前从新的学习记录开始。';}
      catch{blockStorageWrite=true;initialWarning='先前记录无法读取且无法备份，原记录已保留；本次学习请使用导出保存。';}
      return freshStore();
    }
    if(JSON.parse(raw).schemaVersion<4){
      try{localStorage.setItem(STORAGE_KEY+'-v'+JSON.parse(raw).schemaVersion+'-backup',raw);initialWarning='旧版记录已保留备份并迁移；原有进度保留，新课程已添加。';}
      catch{blockStorageWrite=true;initialWarning='旧版进度已在内存恢复，无法写入备份，已保护原记录；请导出本次记录保存。';}
    }
    return data;
  }catch{initialWarning='本机存储不可用，本次学习可继续，请导出记录保存。';return freshStore();}
}

export default function App(){
  const [freeLab,setFreeLab]=useState(()=>{try{return sessionStorage.getItem('circuit-intuition-workspace')==='sandbox';}catch{return false;}}),[sandboxSeed,setSandboxSeed]=useState<SandboxSeed>();
  const sandboxHandle=useRef<SandboxHandle>(null);
  const [store,setStore]=useState<Store>(loadInitial),[notice,setNotice]=useState(initialWarning),[storage,setStorage]=useState('已保存到本机');
  const [rawRun,setRun]=useState<RunResult|null>(null),[previous,setPrevious]=useState<RunResult|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [cursor,setCursor]=useState(25),[kind,setKind]=useState<MeasurementKind>('voltage'),[positive,setPositive]=useState('VOUT'),[negative,setNegative]=useState('GND'),[branch,setBranch]=useState('R1'),[purpose,setPurpose]=useState('locate');
  const host=useRef<HTMLDivElement>(null),adapter=useRef<CircuitAdapter|null>(null),request=useRef(0),importFile=useRef<HTMLInputElement>(null),last=useRef<RunResult|null>(null);
  const selected=store.selected,lesson=lessons.find(l=>l.id===selected),p=selected?store.lessons[selected]:null;
  const mode=freeLab?'none':p?.phase==='explore'?'guided':p&&['diagnose','judge'].includes(p.phase)?'diagnostic':'none';
  function showSandbox(){if(freeLab)return;setSandboxSeed(undefined);setFreeLab(true);try{sessionStorage.setItem('circuit-intuition-workspace','sandbox');}catch{}}
  async function navigate(id:LessonId|null){if(freeLab&&sandboxHandle.current&&!await sandboxHandle.current.prepareLeave()&&!confirm('项目尚未保存到本机。离开会丢失当前内存编辑，建议先下载项目。仍然离开？'))return;setFreeLab(false);try{sessionStorage.setItem('circuit-intuition-workspace','course');}catch{}setStore(s=>({...s,selected:id}));}
  function copyLesson(){if(p&&(selected==='divider'||selected==='rc'||selected==='i2c')){setSandboxSeed({id:selected,params:structuredClone(p.params),token:crypto.randomUUID()});setFreeLab(true);try{sessionStorage.setItem('circuit-intuition-workspace','sandbox');}catch{}}}
  const paramsKey=JSON.stringify(p?.params),variant=p?.variant;
  const run=rawRun && rawRun.config.lesson===selected && rawRun.config.diagnostic===(mode==='diagnostic') && rawRun.config.variant===variant && JSON.stringify(rawRun.config.params)===paramsKey ? rawRun : null;
  function update(changes:Partial<Progress>){if(selected)setStore(s=>({...s,lessons:{...s.lessons,[selected]:{...s.lessons[selected],...changes}}}));}
  useEffect(()=>{if(blockStorageWrite){setStorage('原记录已保护 · 请导出本次记录');return;}try{localStorage.setItem(STORAGE_KEY,JSON.stringify(store));setStorage('已保存到本机');}catch{setStorage('仅暂存内存 · 请导出记录');}},[store]);
  useEffect(()=>{setPrevious(null);last.current=null;setKind('voltage');setNegative('GND');setPositive(selected?(views[selected].chart[1]??views[selected].chart[0]):'VOUT');setBranch(selected?views[selected].branches[0]:'R1');},[selected]);
  useEffect(()=>{
    if(mode==='none'){request.current++;adapter.current?.dispose();adapter.current=null;setRun(null);setBusy(false);return;}
    void execute();
    return ()=>{request.current++;adapter.current?.dispose();};
    // Only electrical conditions change the run; answers never restart the solver.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selected,mode,paramsKey,variant]);
  useEffect(()=>{const hide=()=>{if(document.hidden&&adapter.current){request.current++;adapter.current.dispose();setBusy(false);setRun(null);setNotice('页面隐藏后已停止仿真，返回后可重新运行。');}};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
  async function execute(){
    if(!selected||!p||!host.current)return;
    const token=++request.current;setRun(null);setBusy(true);setError('');
    adapter.current?.dispose();const engine=new CircuitAdapter(host.current);adapter.current=engine;
    try{
      await engine.load({lesson:selected,params:p.params,diagnostic:mode==='diagnostic',variant:p.variant});
      const result=await engine.capture();
      if(request.current!==token)return;
      if(last.current?.config.lesson===selected && last.current.config.diagnostic===result.config.diagnostic)setPrevious(last.current);else setPrevious(null);
      last.current=result;setRun(result);setCursor(views[selected].cursor);
    }catch(e){if(request.current===token)setError(e instanceof Error?e.message:'仿真失败，请重试');}
    finally{if(request.current===token)setBusy(false);}
  }
  function stop(){request.current++;adapter.current?.dispose();adapter.current=null;setRun(null);setBusy(false);setNotice('捕获已停止；重新运行将从初始条件开始。');}
  function transition(phase:Phase){setNotice('');update({phase});}
  function startDiagnosis(v=0){setRun(null);setBusy(true);setPrevious(null);last.current=null;update({phase:'diagnose',variant:v,params:{...defaultParams(selected!),connected:true,...(selected==='adc'?{sampleTime:5e-6}:{})},cause:'',explanation:'',remedy:'',evidenceIds:[],score:null,hints:0,transfer:['',''],transferred:false,reflection:'',completed:false});}
  function changeParam(key:keyof Params,value:number|boolean){setRun(null);setBusy(true);if(p)update({params:{...p.params,[key]:value}});}
  const sample=run?.samples[Math.round((run.samples.length-1)*cursor/100)]??null;
  const diagnostic=mode==='diagnostic';
  const nodeNames=selected?views[selected].nodes:[];
  const branchNames=selected?views[selected].branches:[];
  function saveEvidence(){
    if(!run||!p||!selected||!sample){setNotice('请先完成一次有效捕获。');return;}
    if(p.evidence.length>=200){setNotice('当前案例已保存 200 条证据，请先导出记录。');return;}
    let value:number|null=null,label='',unit='V',status='有效',simTime=sample.t;
    if(kind==='voltage'){value=sample.nodes[positive]-sample.nodes[negative];label=`V(${positive}) − V(${negative})`;}
    else if(kind==='current'){
      if(selected==='i2c'){const low=lowState(run);value=low?.i??null;label='I(RP) · 稳定低态';simTime=low?.t??sample.t;}
      else{value=sample.currents[branch];label=`I(${branch})`;}
      unit='mA';
    }else if(kind==='rise'&&selected==='spi'){const t=spiTiming(run);value=t.rise;label='DATA 30%–70% 上升时间';unit='ns';status=value===null?'窗口内未形成完整边沿':'有效';simTime=t.t70??sample.t;}
    else if(kind==='edges'){value=risingCount(run,positive);label='上升沿 '+positive;unit='次';simTime=run.duration;}
    else if(kind==='aperture'||kind==='violations'){const t=spiTiming(run);value=kind==='aperture'?t.minGap:t.violations;label=kind==='aperture'?'改变沿至采样沿最短间隔':'不保证的采样事件数';unit=kind==='aperture'?'ns':'次';simTime=t.events.at(-1)?.t??sample.t;status=value===null?'未捕获完整事件':'有效';}
    else if(kind==='rise'){const r=riseTime(run);value=r.value;label='BUS 30%–70% 上升时间';unit='ns';status=r.status;simTime=r.t70??r.start;}
    else if(kind==='minimum'){const low=minimumSample(run,'VMCU');value=low.nodes.VMCU;simTime=low.t;label='最低值 VMCU';}
    else if(kind==='decay'){const d=coilDecay(run);value=d.value;simTime=d.end??sample.t;label='\u7ebf\u5708\u7535\u6d41\u964d\u81f3 10% \u65f6\u95f4';unit='\u00b5s';status=d.status;}
    else if(kind==='held'||kind==='code'){const held=heldSample(run);value=held?(kind==='held'?held.nodes.HOLD:adcCode(held.nodes.HOLD,held.nodes.VREF)):null;simTime=held?.t??sample.t;label=kind==='held'?'采样结束 HOLD':'理想 12 位码';unit=kind==='held'?'V':'code';status=held?'有效':'未捕获采样结束事件';}
    else {const maxSample=run.samples.reduce((a,b)=>a.nodes[positive]>=b.nodes[positive]?a:b);value=maxSample.nodes[positive];simTime=maxSample.t;label=`峰值 ${positive}`;}
    if(value!==null&&!Number.isFinite(value)){setNotice('测点不存在或读数无效，请重新选择。');return;}
    const conditions=selected==='debounce'?`按住 ${run.config.params.pressTime*1000} ms · 整段捕获`:selected==='opamp'?`已知输入 ${run.config.params.signalVoltage} V · 稳态`:selected==='spi'?`${run.config.params.clockFrequency/1e6} MHz · 建立/保持各 50 ns`:selected==='mosfet'?`负载 ${run.config.params.load} Ω · 稳态压降定位`:selected==='flyback'?`导通 ${run.config.params.pulse*1000} ms 后关断 · ${kind==='decay'?'10% 电流事件':'捕获内测量'}`:selected==='pcb'?`${run.config.params.connected?'负载已接入':'负载已移除'} · 游标 ${(sample.t*1e6).toFixed(2)} µs`:selected==='divider'?(run.config.params.connected?'模块已接入':'模块已移除'):selected==='i2c'?`${run.config.params.frequency/1000} kHz · ${kind==='current'?'稳定低态取样':kind==='rise'?'释放段':'游标时刻'}`:selected==='rc'?'同一次捕获 · 初始 VC=0 V':selected==='gpio'?`${run.config.params.connected?'负载已接入':'负载已移除'} · 测试上拉 ${run.config.params.resistance||'无'} Ω`:selected==='power'?`100 µs 接通 · ${run.config.params.pulse?run.config.params.pulse*1e6+' µs':'持续'}负载`:`采样窗口 ${run.config.params.sampleTime*1e6} µs · ${kind==='held'||kind==='code'?'采样结束事件':'游标时刻'}`;
    const e:Evidence={id:crypto.randomUUID(),runId:run.id,lesson:selected,variant:p.variant,diagnostic,kind,label,value,unit,status,purpose,simTime,conditions,createdAt:new Date().toISOString(),parameters:structuredClone(run.config.params),engineRevision:ENGINE_REVISION,stepSeconds:run.step,lessonVersion:COURSE_VERSION};
    update({evidence:[...p.evidence,e],evidenceIds:diagnostic?[...p.evidenceIds,e.id]:p.evidenceIds});setNotice(`已记录：${label} = ${format(value,unit)}`);
  }
  function grade(){if(!p||!lesson)return;if(!p.cause||!p.explanation||!p.remedy||!p.evidenceIds.length){setNotice('请完成判断、解释、修复建议，并关联至少一条证据。');return;}update({score:evaluate(p,{cause:lesson.answers[p.variant],explanation:lesson.interpretationAnswers[p.variant]})});}
  function download(){const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='电路学习记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function importRecords(file?:File){if(!file)return;try{if(file.size>MAX_RECORD_BYTES)throw new Error('记录超过 4 MB 限制');const data=parseStore(await file.text());blockStorageWrite=false;setStore(data);setNotice('已导入学习记录；仿真将从初始条件重新开始。');}catch(e){setNotice(`导入失败，原记录已保留：${e instanceof Error?e.message:'未知错误'}`);}if(importFile.current)importFile.current.value='';}
  const completed=Object.values(store.lessons).filter(p=>p.completed).length;
  const relevant=p?.evidence.filter(e=>e.diagnostic && e.variant===p.variant)??[];
  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" onClick={()=>void navigate(null)}><span className="brand-icon">⌁</span><span>电路直觉<span className="brand-sub">CIRCUIT LAB</span></span></button>
      <div className="sidebar-label">学习工作台</div>
      <button className={`nav-item ${!freeLab&&!selected?'active':''}`} onClick={()=>void navigate(null)}><span>▦</span> 实验总览</button>
      <button className={`nav-item ${freeLab?'active':''}`} onClick={showSandbox}><span>⌘</span> 自由实验室</button>
      <div className="sidebar-label space">工程实验 / 12</div>
      {lessons.map(l=><button key={l.id} className={`lesson-nav ${!freeLab&&selected===l.id?'active':''}`} onClick={()=>void navigate(l.id)}><span className="nav-number">{store.lessons[l.id].completed?'✓':l.number}</span><span>{l.title}<small>{l.time}</small></span><span className="nav-arrow">›</span></button>)}
      <div className="sidebar-bottom"><div className="progress-label"><span>学习进度</span><b>{completed} / {lessons.length}</b></div><div className="progress-bar"><i style={{width:`${completed/lessons.length*100}%`}}/></div><p>先预测，再测量。<br/>每次实验，带走一个判断方法。</p><button className="text-button" onClick={download}>↓ 导出学习记录</button><button className="text-button" onClick={()=>importFile.current?.click()}>↑ 导入学习记录</button><small className="storage-status">● {storage}</small></div>
    </aside>
    <main>
      <header className="topbar"><div><span className="muted">学习空间</span><span className="slash">/</span>{freeLab?'自由实验室':lesson?.title??'实验总览'}</div><span className="local-badge"><i/> 本地实验室 <span>MVP 0.5</span></span></header>
      {notice&&<div className="toast" role="status">{notice}<button aria-label="关闭通知" onClick={()=>setNotice('')}>×</button></div>}
      {freeLab?<SandboxPage key={sandboxSeed?.token??'library'} ref={sandboxHandle} seed={sandboxSeed}/>:!lesson||!p?<div className="home">
        <section className="hero"><div className="eyebrow">从软件经验，走向电路直觉</div><h1>让抽象的电路，<br/><span>成为可验证的判断。</span></h1><p>改一个变量，看一次波形，验证一个假设。<br/>用十二个工程实验，练习读图、测量和定位问题。</p><div className="hero-footer"><span>01 预测</span><i>→</i><span>02 实验</span><i>→</i><span>03 诊断</span><i>→</i><span>04 迁移</span></div><div className="hero-art" aria-hidden="true"><svg viewBox="0 0 260 190"><path d="M20 110H60l8-16 12 32 12-32 12 32 12-32 8 16h40V40h60M164 110v50H60v-30" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="164" cy="110" r="5" fill="currentColor"/><path d="M190 136c14-50 24-72 55-72" stroke="#9ac0aa" strokeWidth="3" fill="none"/><path d="M190 160V55m0 105h60" stroke="currentColor" fill="none"/><text x="161" y="98" fill="currentColor" fontSize="11">VOUT</text></svg></div></section>
        <div className="home-section-title"><div><h2>从基础直觉，到 MCU 工程问题</h2><p>按顺序建立静态、时间和接口直觉，也可以从感兴趣的问题开始。</p></div><span className="tag">12 个案例 · 24 个诊断挑战</span></div>
        <div className="lesson-cards">{lessons.map(l=><article key={l.id} className="lesson-card"><div className="card-top"><span className="case-number">EXPERIMENT {l.number}</span><span>{store.lessons[l.id].completed?'✓ 已完成':l.time}</span></div><CircuitMini id={l.id}/><h3>{l.title}</h3><p>{l.subtitle}</p><div className="card-tags">{views[l.id].tags.map(t=><span key={t}>{t}</span>)}</div><button className="card-action" onClick={()=>setStore(s=>({...s,selected:l.id}))}>{store.lessons[l.id].phase==='intro'?'开始实验':'继续学习'}<span>↗</span></button></article>)}</div>
        <section className="panel capstone"><div className="eyebrow">综合排查 / 将六个子实验的方法连接起来</div><h3>负载动作后，传感器读数异常。</h3><p>分别验证供电压降、驱动、感性关断、回流参考、采样建立和 GPIO 配置。先列候选原因，再选择测点与受控操作；这是使用独立模型的排查练习，不是完整板级联合仿真。</p><div className="capstone-actions">{(['power','mosfet','flyback','pcb','adc','gpio'] as LessonId[]).map(id=><button className="secondary" key={id} onClick={()=>setStore(s=>({...s,selected:id}))}>打开{lessons.find(l=>l.id===id)!.title} →</button>)}</div><p>产出一张表：候选原因 → 预期读数 → 测点 → 改变一个条件 → 修复后复测。</p></section><section className="method-note"><span className="note-icon">◎</span><div><h3>每个结论，都要有一个测点。</h3><p>先说出你预期看到什么，再用读数修正判断。这里的目标是解释现象、选择证据，并把方法带回实际工作。</p></div><span className="tag">面向 MCU 工程实践</span></section>
      </div>:<div className="workspace">
        <div className="workspace-heading"><div className="eyebrow">EXPERIMENT {lesson.number} / {lesson.time}</div><h1>{lesson.title}<span>{lesson.subtitle}</span></h1><button className="text-button restart" onClick={()=>{last.current=null;setPrevious(null);update({...freshProgress(lesson.id),evidence:p.evidence});}}>↺ 重新学习</button></div>
        <nav className="steps" aria-label="学习步骤">{phases.map((phase,i)=><div key={phase} className={p.phase===phase?'current':phases.indexOf(p.phase)>i?'done':''}><span>{phases.indexOf(p.phase)>i?'✓':i+1}</span>{phaseNames[phase]}</div>)}</nav>
        {mode==='guided'&&['divider','rc','i2c'].includes(lesson.id)&&<button className="secondary small sandbox-copy" disabled={busy} onClick={copyLesson}>复制当前正常实验到自由实验室 →</button>}
        {mode==='none'?<div className="focused-grid"><section className="panel task-panel"><LessonPanel lesson={lesson} p={p} update={update} transition={transition}/></section><section className="panel supporting"><div className="eyebrow">LEARNING NOTES</div><h2>带着问题观察</h2><CircuitMini id={lesson.id}/><p>{lesson.goal}</p><div className="rule"/><h3>回到真实工程</h3>{lesson.engineering.map((text,i)=><p key={text}><span className="checkmark">0{i+1}</span> {text}</p>)}<details><summary>模型与边界</summary><p>{lesson.boundary}</p></details></section></div>:<>
          <div className="lab-grid"><div className="lab-main"><section className="panel schematic-panel"><div className="section-head"><span><span className="tiny-square"/> {diagnostic?'未知原因诊断':'交互电路'}</span><span className="source-tag">CircuitJS · 实际求解</span></div><div className="circuit-host" ref={host}/>{busy&&<div className="engine-overlay"><span className="spinner"/> 正在求解与捕获…</div>}{error&&<div className="engine-error" role="alert">{error}<button onClick={()=>void execute()}>重试</button></div>}<div className="circuit-caption"><span>电位颜色：<i className="voltage-scale"/> 0 → {lesson.id==='flyback'?40:lesson.id==='mosfet'?14:lesson.id==='pcb'?5:3.3} V</span><span>捕获结束状态 · 电流采用约定方向</span></div></section>
            <section className="panel controls-panel"><ParameterControls id={lesson.id} p={p} diagnostic={diagnostic} busy={busy} change={changeParam}/><div className="run-actions"><button className="primary small" disabled={busy} onClick={()=>void execute()}>↻ 重新运行</button>{busy&&<button className="secondary small" onClick={stop}>停止捕获</button>}<span>{busy?'求解中':run?`已捕获 · ${(run.elapsed).toFixed(0)} ms`:'等待运行'}</span></div></section>
            {lesson.id==='pcb'&&<ReturnLayout params={p.params} diagnostic={diagnostic}/>}
            {run&&!diagnostic&&<ResultMetrics run={run}/>}<section className="panel instrument-note"><b>测量与工程实践</b><p>{measurementNotes[lesson.id]}</p></section><section className="panel"><Chart run={run} previous={previous} cursor={cursor} onCursor={setCursor}/>{run&&lesson.id==='spi'&&<SamplingWindows run={run}/>}
            {run&&(lesson.id==='flyback'||lesson.id==='pcb')&&<CurrentTrace run={run} cursor={cursor}/>}</section>
          </div><aside className="lab-right"><section className="panel task-panel">
            <div className="eyebrow">{diagnostic?'DIAGNOSE / 取证再判断':'EXPLORE / 观察与验证'}</div>
            {p.phase==='explore'?<><h2>让预测接受检验</h2><div className="prediction-note">你的预测：{lesson.predictions.find(o=>o.id===p.prediction)?.text}<small>信心 {p.confidence}% · {p.prediction===lesson.predictionAnswer?'方向正确，继续找证据。':'先观察，再修正自己的判断。'}</small></div>{lesson.tasks.map((t,i)=><p className="task-line" key={t}><span>{i+1}</span>{t}</p>)}<div className="insight">{lesson.predictionExplanation}</div><button className="primary full" disabled={!run||!p.evidence.some(e=>!e.diagnostic)} onClick={()=>startDiagnosis()}>进入故障诊断 →</button><small className="muted">先在下方测量面板保存一条观测。</small></>:p.phase==='diagnose'?<><h2>同一种现象，<br/>不止一种原因。</h2><p>{lesson.diagnosis}</p><div className="variant-picker"><span>挑战</span>{[0,1].map(v=><button key={v} className={p.variant===v?'selected':''} onClick={()=>startDiagnosis(v)}>{v===0?'A':'B'}</button>)}</div><p className="small-note">当前只展示标称条件；真实故障参数在判断后揭晓。</p><button className="primary full" disabled={!relevant.length} onClick={()=>transition('judge')}>整理证据，提交判断 →</button><Hint lesson={lesson} p={p} update={update}/></>:<><h2>你的证据支持什么？</h2><Choice label="主要原因" options={lesson.causes} value={p.cause} onChange={cause=>update({cause,score:null})}/><Choice label="如何解释证据" options={lesson.explanations} value={p.explanation} onChange={explanation=>update({explanation,score:null})}/><Choice label="下一步行动" options={lesson.remedies} value={p.remedy} onChange={remedy=>update({remedy,score:null})}/><div className="evidence-choices"><b>关联证据</b>{relevant.map(e=><label key={e.id}><input type="checkbox" checked={p.evidenceIds.includes(e.id)} onChange={ev=>update({evidenceIds:ev.target.checked?[...p.evidenceIds,e.id]:p.evidenceIds.filter(id=>id!==e.id),score:null})}/>{e.label} · {format(e.value,e.unit)}</label>)}</div><button className="primary full" onClick={grade}>提交判断</button>{p.score&&<div className="feedback"><h3>{p.score.reduce((a,b)=>a+b,0)} / 8 · {p.score.reduce((a,b)=>a+b,0)>=6&&p.score[0]===2&&p.score[1]===2&&p.score[2]===2?(p.hints<3?'已形成有效分析':'提示辅助完成'):'继续完善证据链'}</h3><div className="score-grid">{p.score.map((s,i)=><span key={i}>{['判断','测点','解释','行动'][i]}<b>{s}/2</b></span>)}</div><p>本题原因：{lesson.causes.find(o=>o.id===lesson.answers[p.variant])?.text}。</p><p>{p.score[1]<2||p.score[2]<2?'当前证据还不足以区分原因；可返回取证，选择有区分力的测量。':'测量目的与解释已构成一条证据链。'}</p><button className="secondary full" onClick={()=>transition('transfer')}>进入迁移检查 →</button></div>}<button className="text-button" onClick={()=>transition('diagnose')}>← 返回补充证据</button><Hint lesson={lesson} p={p} update={update}/></>}
          </section>
          <section className="panel measurement-panel"><div className="eyebrow">VIRTUAL INSTRUMENT / 虚拟测量</div><h3>选择测点，再收集证据</h3><Select label="测量目的" value={purpose} options={[["locate","确认异常位置"],["distinguish","区分候选原因"],["quantify","量化变化与裕量"]]} onChange={setPurpose}/><Select label="测量类型" value={kind} options={[["voltage","两端电压"],["current","支路电流"],...views[lesson.id].extra]} onChange={v=>setKind(v as MeasurementKind)}/>{(kind==='voltage'||kind==='peak'||kind==='edges')&&<><Select label={kind==='voltage'?'红表笔（正端）':kind==='edges'?'计数节点':'峰值节点'} value={positive} options={nodeNames.map(n=>[n,n])} onChange={setPositive}/>{kind==='voltage'&&<><Select label="黑表笔（参考端）" value={negative} options={nodeNames.map(n=>[n,n])} onChange={setNegative}/><button className="text-button" onClick={()=>{setPositive(negative);setNegative(positive);}}>⇄ 交换表笔</button></>}</>}{kind==='current'&&<Select label="支路（按图中首端→末端）" value={branch} options={branchNames.map(n=>[n,n])} onChange={setBranch}/>}<button className="secondary full" disabled={!run||busy} onClick={saveEvidence}>＋ 测量并保存证据</button><small>电压/电流取波形游标时刻；I²C 电流取稳定低态；采样测量取结束事件，最低值取整段捕获。数字码为透明派生量。</small></section></aside></div>
          <section className="panel evidence-panel"><div className="section-head"><span>观测与证据</span><span className="muted">{p.evidence.length} 条 · 参数变化后保留原始快照</span></div>{!p.evidence.length?<div className="empty-evidence">先问“这次测量能区分什么”，再记录第一条证据。</div>:<div className="table-scroll"><table><thead><tr><th>测量</th><th>读数</th><th>条件与目的</th><th>来源</th></tr></thead><tbody>{[...p.evidence].reverse().slice(0,12).map(e=><tr key={e.id}><td>{e.label}</td><td className="reading">{format(e.value,e.unit)}{e.status!=='有效'&&<small>{e.status}</small>}</td><td>{e.conditions}<small>{e.purpose==='distinguish'?'区分候选原因':e.purpose==='locate'?'确认异常位置':'量化变化'}</small></td><td><span className="tag">{e.diagnostic?`诊断 ${e.variant?'B':'A'}`:'引导实验'}</span><small>run {e.runId.slice(0,8)}</small></td></tr>)}</tbody></table></div>}</section>
          <details className="boundary"><summary>模型边界与真实工程检查</summary><p>{lesson.boundary}</p>{lesson.engineering.map(t=><p key={t}>• {t}</p>)}{references[lesson.id]?.map(([name,url])=><p key={url}><a href={url} target="_blank" rel="noreferrer">{name} ↗</a></p>)}</details>
        </>}
      </div>}
      <footer>电路直觉实验室 <span>预测 · 测量 · 证据 · 判断</span><a href="/vendor/circuitjs/provenance.json" target="_blank" rel="noreferrer">CircuitJS 来源</a></footer>
    </main>
    <input ref={importFile} aria-label="导入学习记录文件" type="file" accept="application/json,.json" hidden onChange={e=>void importRecords(e.target.files?.[0])}/>
  </div>;
}

function ResultMetrics({run}:{run:RunResult}){
  const id=run.config.lesson,last=run.samples.at(-1)!;
  let items:{label:string;value:string;note:string;warn?:boolean}[];
  if(id==='divider')items=[{label:'输出电压 VOUT',value:format(last.nodes.VOUT,'V'),note:'相对 GND'},{label:'上臂电流 I(R1)',value:format(last.currents.R1,'mA'),note:'VIN → VOUT'},{label:'电源提供的功率',value:`${(last.nodes.VIN*last.currents.R1*1e3).toFixed(3)} mW`,note:'由同一仿真状态计算'}];
  else if(id==='rc')items=[{label:'电容峰值',value:format(peak(run,'VC'),'V'),note:'当前捕获窗口'},{label:'进入高门限',value:format(crossing(run.samples,'VC',2.31),'ms'),note:'未跨过时显示 —'},{label:'输入峰值',value:format(peak(run,'VIN'),'V'),note:'相对 GND'}];
  else if(id==='i2c'){const r=riseTime(run),low=lowState(run),limit=run.config.params.frequency===400000?300e-9:1000e-9;const uncertainty=2*run.step;const edge=r.value===null?'未形成完整边沿':Math.abs(r.value-limit)<=uncertainty?'接近边界，需提高精度':r.value<limit?'满足本模式边沿约束':'超过本模式边沿约束';items=[{label:'30%–70% 上升时间',value:format(r.value,'ns'),note:`${edge} · ${limit*1e9} ns`,warn:r.value===null||r.value+uncertainty>=limit},{label:'稳定低态电压',value:format(low?.v??null,'V'),note:'教学约束 ≤ 0.4 V',warn:!!low&&low.v>.4},{label:'稳定低态电流',value:format(low?.i??null,'mA'),note:'教学能力 ≤ 3 mA',warn:!!low&&low.i>.003}];}
  else if(id==='gpio'){const v=last.nodes.PIN;items=[{label:'PIN 对 GND',value:format(v,'V'),note:v>=2.31?'进入教学高区域':v<=.99?'进入教学低区域':'中间区域，不保证判定',warn:v>.99&&v<2.31},{label:'高侧驱动 HIGH',value:format(last.currents.HIGH,'mA'),note:'VDD → PIN；不是外部上拉电流'},{label:'外部上拉 PULL',value:format(last.currents.PULL,'mA'),note:'对照负载及 LOW 支路'}];}
  else if(id==='power'){const low=minimumSample(run,'VMCU');items=[{label:'芯片端最低值',value:format(low.nodes.VMCU,'V'),note:`发生于 ${(low.t*1e6).toFixed(2)} µs`},{label:'低于教学线 3.15 V',value:format(belowDuration(run,'VMCU',3.15),'µs'),note:'累计时间；不等于真实 BOR 判定'},{label:'捕获结束 VMCU',value:format(last.nodes.VMCU,'V'),note:'短脉冲已恢复时不能代替最低值'}];}
  else if(id==='adc'){const h=heldSample(run),code=h?adcCode(h.nodes.HOLD,h.nodes.VREF):null;items=[{label:'采样结束 HOLD',value:format(h?.nodes.HOLD??null,'V'),note:h?`实际取样 ${(h.t*1e6).toFixed(3)} µs`:'未形成完整事件'},{label:'理想 12 位数字码',value:format(code,'code'),note:'floor(4096×VHOLD/VREF)，限幅'},{label:'软件按 3.3 V 换算',value:format(code===null?null:code/4096*3.3,'V'),note:'用于展示参考假设导致的偏差'}];}
  else if(['debounce','opamp','spi'].includes(id))return <SignalMetrics run={run}/>;
  else return <StageMetrics run={run}/>;
  return <div className="metrics">{items.map(m=><div className={m.warn?'warning':''} key={m.label}><span>{m.label}</span><strong>{m.value}</strong><small>{m.note}</small></div>)}</div>;
}
function Hint({lesson,p,update}:{lesson:Lesson;p:Progress;update:(p:Partial<Progress>)=>void}){return <div className="hint"><button className="text-button" disabled={p.hints>=3} onClick={()=>update({hints:p.hints+1})}>◉ {p.hints>=3?'已显示完整提示':`需要一点提示？（${p.hints}/3）`}</button>{p.hints>0&&<p>{lesson.hints[p.hints-1]}</p>}</div>;}
function ParameterControls({id,p,diagnostic,busy,change}:{id:LessonId;p:Progress;diagnostic:boolean;busy:boolean;change:(key:keyof Params,value:number|boolean)=>void}){
  const vals=p.params;
  if(extraControls[id])return <div className="parameter-controls">{diagnostic&&<div className="nominal">实际故障参数隐藏，只允许以下受控操作。</div>}{extraControls[id]!.filter(c=>(diagnostic||id!=='debounce'||vals.inputMode===0||c.key!=='pressTime')&&(!diagnostic||diagnosticControls[id]?.includes(c.key))).map(c=><Select key={c.key} label={diagnostic&&id==='gpio'?'已知测试上拉':c.label} value={vals[c.key] as number} options={diagnostic&&id==='gpio'?[[0,'无测试上拉'],[4700,'加已知 4.7 kΩ']]:c.options} onChange={v=>change(c.key,+v)} disabled={busy}/>)}{(id==='gpio'||id==='pcb')&&<label className="toggle"><input type="checkbox" checked={vals.connected} disabled={busy} onChange={e=>change('connected',e.target.checked)}/><span>接入外部负载</span></label>}</div>;
  return <div className="parameter-controls">{diagnostic?<><div className="nominal">标称条件已固定，实际偏差未知。</div>{id==='divider'&&<button className="secondary" disabled={busy} onClick={()=>change('connected',!vals.connected)}>{vals.connected?'移除外部模块':'接回外部模块'}</button>}</>:<>
    <Select label={id==='i2c'?'上拉 RP':id==='divider'?'R1 = R2':'电阻 R'} value={vals.resistance} options={(id==='i2c'?[470,1000,2200,4700,10000]:id==='rc'?[4700,10000,22000]:[1000,10000,100000,1000000]).map(v=>[v,v>=1000?`${v/1000} kΩ`:`${v} Ω`])} onChange={v=>change('resistance',+v)} disabled={busy}/>
    {id==='divider'?<><Select label="仪表输入电阻" value={vals.probe} options={[[0,'理想高阻'],[1000000,'1 MΩ'],[10000000,'10 MΩ']]} onChange={v=>change('probe',+v)} disabled={busy}/><Select label="模块负载 RL" value={vals.load} options={[[10000,'10 kΩ'],[47000,'47 kΩ'],[100000,'100 kΩ']]} onChange={v=>change('load',+v)} disabled={busy}/><label className="toggle"><input type="checkbox" checked={vals.connected} disabled={busy} onChange={e=>change('connected',e.target.checked)}/><span>接入模块</span></label></>:<><Select label={id==='i2c'?'总线电容 CB':'电容 C'} value={vals.capacitance} options={(id==='i2c'?[50e-12,100e-12,200e-12]:[.47e-6,1e-6,2.2e-6]).map(v=>[v,`${+(v*(id==='i2c'?1e12:1e6)).toFixed(2)} ${id==='i2c'?'pF':'µF'}`])} onChange={v=>change('capacitance',+v)} disabled={busy}/>{id==='rc'?<Select label="输入类型 / 脉宽" value={vals.pulse} options={[[0,'持续阶跃'],[.002,'2 ms 脉冲'],[.01,'10 ms 脉冲'],[.03,'30 ms 脉冲']]} onChange={v=>change('pulse',+v)} disabled={busy}/>:<><Select label="探头附加电容" value={vals.probeCap} options={[[0,'理想探头'],[10e-12,'10 pF'],[100e-12,'100 pF']]} onChange={v=>change('probeCap',+v)} disabled={busy}/><Select label="通信模式约束" value={vals.frequency} options={[[100000,'100 kHz · Standard'],[400000,'400 kHz · Fast']]} onChange={v=>change('frequency',+v)} disabled={busy}/></>}</>}
  </>}</div>;
}
function LessonPanel({lesson,p,update,transition}:{lesson:Lesson;p:Progress;update:(p:Partial<Progress>)=>void;transition:(p:Phase)=>void}){
  if(p.phase==='intro')return <><div className="eyebrow">THE QUESTION / 工程问题</div><h2 className="large-question">{lesson.question}</h2><p>{lesson.context}</p><div className="goal-box"><b>这次带走的能力</b><p>{lesson.goal}</p></div><p className="muted">先做一个预测。答错不会影响进度，判断会在实验中被验证。</p><button className="primary" onClick={()=>transition('predict')}>开始，先做预测 →</button></>;
  if(p.phase==='predict')return <><div className="eyebrow">PREDICT / 在看到结果之前</div><h2>先给出你的判断。</h2><Choice label={lesson.prediction} options={lesson.predictions} value={p.prediction} onChange={prediction=>update({prediction})}/><label className="field confidence">你有多确定？ <b>{p.confidence}%</b><input aria-label="预测信心" type="range" min="0" max="100" value={p.confidence} onChange={e=>update({confidence:+e.target.value})}/></label><button className="primary" disabled={!p.prediction} onClick={()=>transition('explore')}>提交预测，开始实验 →</button></>;
  if(p.phase==='transfer')return <><div className="eyebrow">TRANSFER / 换一个问题</div><h2>把方法用到新情境。</h2><p>先独立回答，再查看解释。这里检查的是判断方法，不是熟记某个读数。</p>{lesson.transfers.map((q,i)=><div className="transfer-question" key={i}><Choice label={`${i+1}. ${q.question}`} options={q.options} value={p.transfer[i]} onChange={v=>{const answers=[...p.transfer];answers[i]=v;update({transfer:answers,transferred:false});}}/>{p.transferred&&<div className={`answer-note ${p.transfer[i]===q.answer?'correct':''}`}>{p.transfer[i]===q.answer?'✓ 判断正确':'需要再想一想'} · {q.explanation}</div>}</div>)}<button className="primary" disabled={p.transfer.some(v=>!v)} onClick={()=>update({transferred:true})}>提交迁移检查</button>{p.transferred&&<button className="secondary beside" onClick={()=>transition('review')}>整理复盘 →</button>}</>;
  const total=p.score?.reduce((a,b)=>a+b,0)??0;
  return <><div className="eyebrow">REFLECT / 留下你的分析方法</div><h2>从一个电路，带走一套方法。</h2><div className="review-stats"><div><strong>{total}<small>/ 8</small></strong><span>诊断分析</span></div><div><strong>{lesson.transfers.filter((q,i)=>q.answer===p.transfer[i]).length}<small>/ 2</small></strong><span>迁移检查</span></div><div><strong>H{p.hints}</strong><span>提示使用</span></div></div><p>你的初始预测：{lesson.predictions.find(o=>o.id===p.prediction)?.text??'未记录'}。{lesson.predictionExplanation}</p><label className="field">下次遇到相似问题，你会先检查什么？<textarea value={p.reflection} maxLength={1000} onChange={e=>update({reflection:e.target.value})} placeholder="例如：先验证输入，再通过移除负载区分分压比与带载问题。"/></label><button className="primary" disabled={!p.reflection.trim()} onClick={()=>update({completed:true})}>{p.completed?'✓ 复盘已保存':'保存复盘，完成本次学习'}</button>{p.completed&&<p className="answer-note correct">已完成本次闭环。建议一周后用新参数再检验，观察自己能否独立选择测点。</p>}</>;
}
function CircuitMini({id}:{id:LessonId}){if(['gpio','power','adc','mosfet','flyback','pcb','debounce','opamp','spi'].includes(id))return <svg className="circuit-mini" viewBox="0 0 280 120" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M22 30h55m80 0h100v65H22V30m55 0v25h80V5H77v25"/><path d="M196 30v28m-15 0h30m-30 8h30m-15 0v29"/><circle cx="196" cy="30" r="3"/></g><text x="117" y="35" textAnchor="middle" fill="currentColor" fontSize="14">{id==='gpio'?'I/O':id==='power'?'R PATH':id==='mosfet'?'MOS':id==='flyback'?'R + L':id==='pcb'?'RETURN':id==='debounce'?'RC + H':id==='opamp'?'AMP':id==='spi'?'CLK / D':'S/H'}</text><text x="222" y="55" fill="currentColor" fontSize="10">{id==='gpio'?'PIN':id==='power'?'VMCU':id==='mosfet'?'VGS':id==='flyback'?'SW':id==='pcb'?'SGND':id==='debounce'?'OUT':id==='opamp'?'VOUT':id==='spi'?'DATA':'HOLD'}</text></svg>;return <svg className="circuit-mini" viewBox="0 0 280 120" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{id==='divider'?<><path d="M34 70V30h45l7-9 10 18 10-18 10 18 8-9h40v24l-9 7 18 10-18 10 18 10-9 8v11H34V90"/><path d="M164 30h70v75h-70" strokeDasharray="4 5"/><circle cx="164" cy="30" r="4" fill="currentColor"/><path d="M25 76h18m-15 7h12m-8 7h4"/></>:id==='rc'?<><path d="M22 65V28h40l7-9 10 18 10-18 10 18 8-9h45v32m-17 0h34m-34 7h34m-17 0v32H22V85"/><path d="M195 96V25m0 71h65m-62-5c12-49 24-52 54-53"/><circle cx="152" cy="28" r="4" fill="currentColor"/></>:<><path d="M24 20h55v10l-9 7 18 10-18 10 18 10-9 7v12h68m-68 0v19m68-19h26m0-16v16m-26 18h50m0-18v18"/><path d="M213 96V25m0 71h50m-47-5c12-50 16-53 42-53"/><circle cx="79" cy="86" r="4" fill="currentColor"/></>}</g></svg>;}
