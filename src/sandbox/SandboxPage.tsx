import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Params } from '../types';
import { SandboxSession, type SandboxRequest, type SandboxStatus } from './adapter';
import { importProject, MAX_PROJECT_BYTES, newProject, sandboxTemplates, templateCircuit, type SandboxProject, type TemplateId } from './model';
import { ProjectConflict, ProjectStore } from './projectStore';
import './sandbox.css';

export type SandboxHandle={prepareLeave():Promise<boolean>};
export type SandboxSeed={id:Exclude<TemplateId,'blank'>;params:Params;token:string};
const initialStatus:SandboxStatus={running:false,time:0,error:'',needsReset:false,message:'等待打开电路',elements:0,scopes:0};
const lastProjectKey='circuit-intuition-sandbox-active';
function download(project:SandboxProject,kind:'project'|'circuit') {
  const text=kind==='project'?JSON.stringify(project,null,2):project.circuit;
  const url=URL.createObjectURL(new Blob([text],{type:kind==='project'?'application/json':'application/xml'}));
  const a=document.createElement('a');a.href=url;a.download=(project.name||'电路项目').replace(/[\\/:*?"<>|]/g,'_')+(kind==='project'?'.circuit.json':'.xml');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const SandboxPage=forwardRef<SandboxHandle,{seed?:SandboxSeed}>(function SandboxPage({seed},ref) {
  const [projects,setProjects]=useState<SandboxProject[]>([]),[project,setProject]=useState<SandboxProject|null>(null);
  const [status,setStatus]=useState(initialStatus),[saving,setSaving]=useState('打开或新建一个电路项目'),[notice,setNotice]=useState(''),[loading,setLoading]=useState(false);
  const [textImport,setTextImport]=useState<string|null>(null),[conflict,setConflict]=useState(false);
  const host=useRef<HTMLDivElement>(null),file=useRef<HTMLInputElement>(null),session=useRef<SandboxSession|null>(null),staging=useRef<SandboxSession|null>(null);
  const current=useRef<SandboxProject|null>(null),database=useRef(new ProjectStore()),generation=useRef(0),mounted=useRef(true),loadingRef=useRef(false);
  const editVersion=useRef(0),savedVersion=useRef(0),saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null),inflight=useRef<Promise<boolean>|null>(null),conflicted=useRef(false);

  function refreshList(){return database.current.list().then(list=>{if(mounted.current)setProjects(list);return list;});}
  function schedule(){if(saveTimer.current)clearTimeout(saveTimer.current);saveTimer.current=setTimeout(()=>{if(!conflicted.current)void persist();},500);}
  function change(update:Partial<SandboxProject>) {
    if(!current.current)return;
    current.current={...current.current,...update};setProject(current.current);editVersion.current++;setSaving('有修改 · 等待保存');schedule();
  }
  function capture() {
    if(!current.current||!session.current)return;
    const circuit=session.current.bridge.flush();
    if(circuit!==current.current.circuit)change({circuit});
  }
  async function persist():Promise<boolean> {
    if(saveTimer.current){clearTimeout(saveTimer.current);saveTimer.current=null;}
    if(inflight.current){const ok=await inflight.current;return ok&&savedVersion.current<editVersion.current?persist():ok;}
    if(!current.current||savedVersion.current===editVersion.current)return true;
    if(conflicted.current)return false;
    const snapshot=structuredClone(current.current),version=editVersion.current;
    setSaving('正在保存到本机…');
    const task=(async()=>{
      try {
        const stored=await database.current.save(snapshot);
        if(current.current?.id===snapshot.id){current.current={...current.current,revision:stored.revision,updatedAt:stored.updatedAt};savedVersion.current=version;if(mounted.current){setProject(current.current);setSaving(editVersion.current===version?'已保存到本机':'有修改 · 等待保存');}}
        if(mounted.current)setProjects(list=>[stored,...list.filter(p=>p.id!==stored.id)].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));
        return true;
      }catch(e){
        if(mounted.current){setSaving('仅暂存内存 · 请下载项目备份');setNotice(e instanceof Error?e.message:'本机保存失败');}
        if(e instanceof ProjectConflict){conflicted.current=true;setConflict(true);session.current?.bridge.pause();}
        return false;
      }finally{inflight.current=null;}
    })();
    inflight.current=task;const ok=await task;
    if(ok&&savedVersion.current<editVersion.current)schedule();return ok;
  }
  async function prepareLeave(){capture();session.current?.bridge.pause();return persist();}
  useImperativeHandle(ref,()=>({prepareLeave}));

  async function open(p:SandboxProject,discard=false):Promise<boolean> {
    if(!host.current||loadingRef.current)return false;
    loadingRef.current=true;setLoading(true);session.current?.bridge.pause();if(session.current)session.current.frame.inert=true;
    if(!discard){capture();if(!await persist()){setNotice('当前编辑尚未写入本机，请先下载项目、另存副本，或载入磁盘版本。');loadingRef.current=false;setLoading(false);if(session.current)session.current.frame.inert=false;return false;}}
    const token=++generation.current,next=new SandboxSession(host.current);staging.current=next;
    try {
      const loaded=await next.load(p.circuit);
      if(token!==generation.current||!mounted.current){next.dispose();return false;}
      const old=session.current;session.current=next;staging.current=null;next.show();old?.dispose();
      const normalized={...p,circuit:loaded.circuit};current.current=normalized;setProject(normalized);setStatus(loaded);setNotice('');
      editVersion.current=p.revision===0||p.circuit!==loaded.circuit?1:0;savedVersion.current=0;conflicted.current=false;setConflict(false);
      setSaving(editVersion.current?'有修改 · 等待保存':'已保存到本机');
      try{sessionStorage.setItem(lastProjectKey,p.id);}catch{/* memory use remains available */}
      next.bridge.onchange=({circuit})=>{if(session.current===next&&circuit!==current.current?.circuit)change({circuit});};
      next.bridge.onrequest=(request:SandboxRequest)=>{
        if(request.action==='new')void create('blank');
        else if(request.action==='import')file.current?.click();
        else if(request.action==='importText')setTextImport(request.text??'');
        else if(request.action==='export')exportCurrent('project');
        else if(request.action==='exportCircuit')exportCurrent('circuit');
        else document.querySelector('#sandbox-projects')?.scrollIntoView({behavior:'smooth'});
      };
      if(editVersion.current)await persist();return true;
    }catch(e){next.dispose();if(mounted.current)setNotice(`载入失败，原项目已保留：${e instanceof Error?e.message:'未知错误'}`);return false;}
    finally{if(token===generation.current){loadingRef.current=false;staging.current=null;if(session.current)session.current.frame.inert=false;if(mounted.current)setLoading(false);}}
  }
  async function create(id:TemplateId,params?:Params){const template=sandboxTemplates.find(t=>t.id===id)!;return open(newProject(template.name,templateCircuit(id,params),params?`课程 ${id} · 正常实验参数副本`:id==='blank'?'自主绘制':`起步模板 ${id}`));}
  function exportCurrent(kind:'project'|'circuit') {capture();if(current.current)download({...current.current,name:current.current.name.trim()||'未命名电路'},kind);}
  async function copy(){capture();if(!current.current)return;const p=current.current,next=newProject((p.name+' · 副本').slice(0,100),p.circuit,p.source);next.notes={...p.notes};await open(next,conflicted.current);}
  async function importText(raw:string,name?:string){try{if(await open(importProject(raw,name))){setTextImport(null);}}catch(e){setNotice(`导入失败，原项目已保留：${e instanceof Error?e.message:'格式无效'}`);}}
  async function importFile(f?:File){if(!f)return;try{if(f.size>MAX_PROJECT_BYTES)throw new Error('文件超过 1 MB 限制');await importText(await f.text(),f.name);}catch(e){setNotice(e instanceof Error?e.message:'文件读取失败');}if(file.current)file.current.value='';}
  async function remove(p:SandboxProject) {
    if(!confirm(`删除“${p.name}”？文件备份不会删除。`))return;
    try {
      if(current.current?.id===p.id){capture();if(!await persist())return;p=current.current!;}
      await database.current.remove(p);
      if(current.current?.id===p.id){session.current?.dispose();session.current=null;current.current=null;setProject(null);setStatus(initialStatus);editVersion.current=savedVersion.current=0;setSaving('项目已删除');try{sessionStorage.removeItem(lastProjectKey);}catch{}}
      await refreshList();
    }catch(e){setNotice(e instanceof Error?e.message:'删除失败');}
  }
  function operate(action:'run'|'pause'|'restart'){try{session.current?.bridge[action]();if(session.current)setStatus(session.current.bridge.status());}catch(e){setNotice(e instanceof Error?e.message:'运行失败');}}

  useEffect(()=>{
    mounted.current=true;
    void (async()=>{
      if(seed){await create(seed.id,seed.params);void refreshList().catch(()=>{});return;}
      try{const list=await refreshList();let id:string|null=null;try{id=sessionStorage.getItem(lastProjectKey);}catch{}if(mounted.current){const p=list.find(x=>x.id===id);if(p)await open(p);}}
      catch(e){setNotice(`本机项目库不可用：${e instanceof Error?e.message:'未知错误'}。可新建并下载文件备份。`);}
    })();
    const poll=setInterval(()=>{if(session.current&&mounted.current)setStatus(session.current.bridge.status());},200);
    const hide=()=>{if(document.hidden){capture();session.current?.bridge.pause();void persist();}};
    const unload=(e:BeforeUnloadEvent)=>{if(editVersion.current!==savedVersion.current){e.preventDefault();}};
    document.addEventListener('visibilitychange',hide);window.addEventListener('beforeunload',unload);
    return()=>{mounted.current=false;generation.current++;clearInterval(poll);if(saveTimer.current)clearTimeout(saveTimer.current);session.current?.dispose();staging.current?.dispose();document.removeEventListener('visibilitychange',hide);window.removeEventListener('beforeunload',unload);};
    // Each mount opens one independent workspace; callbacks read refs, not stale state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  return <div className="sandbox-page">
    <div className="sandbox-heading"><div><div className="eyebrow">FREE LAB / 将问题画成电路</div><h1>自由实验室</h1><p>画一个局部回路，改一个条件，用读数检验判断。</p></div><span className="tag">原生编辑器 · 本机项目</span></div>
    {notice&&<div className="sandbox-notice" role="alert">{notice}<button onClick={()=>setNotice('')} aria-label="关闭沙盒提示">×</button></div>}
    {conflict&&<div className="sandbox-conflict"><p>当前编辑已保护在内存中。下载备份或另存副本后，再继续。</p><button className="secondary" onClick={()=>void copy()}>另存为新项目</button><button className="secondary" onClick={()=>{if(confirm('丢弃当前内存编辑，载入本机已保存版本？'))void refreshList().then(list=>{const p=list.find(p=>p.id===current.current?.id);if(p)return open(p,true);setNotice('项目已被其他窗口删除，请另存副本。');}).catch(e=>setNotice(String(e)));}}>载入磁盘版本</button></div>}
    <section className="panel sandbox-controls">
      <label>项目名称<input aria-label="项目名称" value={project?.name??''} disabled={!project||loading} maxLength={100} placeholder="先从下方选择起步电路" onChange={e=>change({name:e.target.value})}/></label>
      <div className="sandbox-buttons"><button className="secondary small" disabled={!project||loading} onClick={()=>{capture();void persist();}}>保存到本机</button><button className="secondary small" disabled={!project||loading} onClick={()=>void copy()}>另存副本</button><button className="secondary small" disabled={!project||loading} onClick={()=>exportCurrent('project')}>↓ 下载项目</button><button className="text-button" disabled={!project||loading} onClick={()=>exportCurrent('circuit')}>导出原生 XML</button></div>
      <small className="sandbox-save-state" role="status">{saving}</small>
    </section>
    <section className="panel sandbox-editor">
      <div className="sandbox-runbar"><div className="sandbox-buttons"><button className="primary small" disabled={!project||loading||status.running||status.needsReset} onClick={()=>operate('run')}>▶ 运行 / 继续</button><button className="secondary small" disabled={!project||loading||!status.running} onClick={()=>operate('pause')}>Ⅱ 暂停</button><button className="secondary small" disabled={!project||loading} onClick={()=>operate('restart')}>↻ 重新开始</button></div><span className="sandbox-state" data-running={status.running}>{loading?'正在校验并载入…':status.error?'求解错误':status.needsReset?'设计已修改 · 请重新开始':status.running?'运行中':'已暂停'} · t={status.time.toPrecision(4)} s · {status.elements} 个图元</span></div>
      {status.error&&<div className="sandbox-engine-error" role="alert">内核提示：{status.error}<p>先检查连接、参考地和参数。修图后重新开始；当前草稿仍可保存。</p></div>}
      <div ref={host} className={`sandbox-engine ${!project?'empty':''}`} aria-busy={loading}>{!project&&<div className="sandbox-placeholder"><b>从一个小回路开始</b><p>选择空白画布，或打开下方的起步模板。</p></div>}</div>
      <div className="sandbox-caption"><span>{status.message}</span><span>{status.scopes} 个示波器 · 改连接/参数后重新开始；开关可运行中切换</span></div>
    </section>
    <div className="sandbox-lower"><section className="panel" id="sandbox-projects"><div className="section-head"><h2>电路与项目</h2><button className="text-button" onClick={()=>file.current?.click()} disabled={loading}>↑ 导入文件</button></div><div className="sandbox-templates">{sandboxTemplates.map(t=><button key={t.id} onClick={()=>void create(t.id)} disabled={loading}><b>＋ {t.name}</b><small>{t.description}</small></button>)}</div><div className="sandbox-project-title"><h3>本机项目</h3><button className="text-button" onClick={()=>void refreshList().catch(e=>setNotice(String(e)))}>刷新列表</button><button className="text-button" onClick={()=>setTextImport('')}>粘贴电路文本</button></div>{!projects.length?<p className="small-note">保存后的项目出现在这里。浏览器地址和端口改变后，请用文件导入。</p>:<ul className="sandbox-project-list">{projects.map(p=><li key={p.id}><button disabled={loading} onClick={()=>{if(current.current?.id!==p.id)void open(p);}} className={p.id===project?.id?'active':''}><b>{p.name}</b><small>{new Date(p.updatedAt).toLocaleString()}</small></button><button className="text-button" disabled={loading} onClick={()=>void remove(p)} aria-label={`删除项目 ${p.name}`}>删除</button></li>)}</ul>}</section>
      <section className="panel sandbox-notes"><h2>这次要验证什么？</h2><p>笔记可选。先写预期，再改变一个条件。</p>{(['question','prediction','observation'] as const).map((key,i)=><label key={key}>{['分析的问题','我的预测 / 只改变的条件','观察与下一步'][i]}<textarea aria-label={['分析的问题','我的预测','观察与下一步'][i]} disabled={!project} maxLength={4000} value={project?.notes[key]??''} onChange={e=>{if(current.current)change({notes:{...current.current.notes,[key]:e.target.value}});}}/></label>)}</section></div>
    <details className="panel sandbox-help" open><summary>绘图、测量与模型边界</summary><div className="sandbox-help-grid"><div><b>从回路到波形</b><p>用“绘制”菜单或工具栏放置元件，拖出两端，按 Esc 返回选择；添加导线时让端点落在同一个网格点。右键元件选择编辑。</p><p>右键元件，选择在示波器中查看。元件两端电压是首端减末端，电流方向按原生元件约定；节点电压需要参考地。同名节点标签会电气连接，不能当作无副作用的便签。</p><p>电容和电感的初始值需在属性中确认。暂停后继续保留本次状态；重新开始按显式初始条件运行。</p></div><div><b>保存与验证范围</b><p>项目保存设计、当前开关设置、示波器配置和笔记。重新打开会暂停，不恢复历史曲线或运行断点。下载项目文件用于跨浏览器和端口备份。</p><p>首版重点验证基础 R/C/L、电源、开关、二极管和受控开关。MOSFET、BJT、运放与其他原生器件可探索，具体模型和画法需单独核验。课程固定模型的验证不代表任意电路已验证。</p><p>运行预算 1–200 个图元；每段连续运行 60 秒后暂停，可继续。不做整板、PCB 或真实固件联合仿真。颜色与动画速度是显示设置，工程结论仍需读数、模型假设和器件手册。</p></div></div></details>
    <input ref={file} aria-label="导入沙盒项目文件" type="file" accept=".json,.xml,.txt,application/json,text/plain,application/xml" hidden onChange={e=>void importFile(e.target.files?.[0])}/>
    {textImport!==null&&<div className="sandbox-modal-backdrop"><section role="dialog" aria-modal="true" aria-labelledby="sandbox-import-title" className="panel sandbox-modal"><h2 id="sandbox-import-title">粘贴电路文本</h2><p>支持项目 JSON、CircuitJS XML 或带 $ 选项头的旧文本；校验通过后新建项目副本。</p><textarea aria-label="电路导入文本" value={textImport} onChange={e=>setTextImport(e.target.value)} autoFocus/><div className="sandbox-buttons"><button className="primary" disabled={loading||!textImport.trim()} onClick={()=>void importText(textImport)}>校验并导入</button><button className="secondary" onClick={()=>setTextImport(null)}>取消</button></div></section></div>}
  </div>;
});
