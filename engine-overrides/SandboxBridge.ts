/* GPL-2.0-or-later. Host integration only; the upstream numerical solver is unchanged. */
import { CirSim } from './CirSim';
import { CircuitXMLSerializer } from './CircuitXMLSerializer';
import { CircuitXMLDeserializer } from './CircuitXMLDeserializer';
import { DiodeModel } from './DiodeModel';

export function installSandboxBridge(app: any) {
  if (new URLSearchParams(location.search).get('sandbox') !== '1') return;
  const api = (window as any).CircuitJS1;
  let busy = 0, undoing = 0, dirty = false, needsReset = false, message = '';
  let lastDesign = '', lastElectric = '', lastStimulus = '', started = 0, sequence = 0, hostError='';
  let runId=crypto.randomUUID(),designRevision=0,stimulusCount=0;
  const ids = new WeakMap<object, number>();
  const id = (e: object) => { if (!ids.has(e)) ids.set(e, ++sequence); return ids.get(e)!; };
  const run = app.ui.setSimRunning.bind(app.ui);
  const load = app.loader.readCircuit.bind(app.loader);
  const reset = app.ui.resetAction.bind(app.ui);
  const request = (action: string, text?: string) => bridge.onrequest?.({action, text});
  const notice = (text: string) => { message = text; app.ui.showToast(text); };

  // Retain scope configuration, while invoking no dumpXmlState methods.
  function documentText() {
    const doc = new DOMParser().parseFromString(app.dumpCircuit(false), 'text/xml');
    for (let i=0; i<app.scopeManager.scopeCount; i++) app.scopeManager.scopes[i].dumpXml(doc, doc.documentElement);
    return CircuitXMLSerializer.prettyPrint(doc);
  }

  // Connectivity uses stable, session-local component/port identities, not absolute
  // coordinates. Moving a connected group is a layout change; disconnecting it is not.
  function signatures() {
    const doc = document.implementation.createDocument(null, 'cir', null);
    const parent = new Map<string,string>();
    const find = (s: string): string => { if (!parent.has(s)) parent.set(s,s); const p=parent.get(s)!; if(p!==s) parent.set(s,find(p)); return parent.get(s)!; };
    const join = (a:string,b:string) => { a=find(a); b=find(b); if(a!==b) parent.set(a,b); };
    const point = (e:any,n:number) => { const p=e.getPost(n); return `${p.x},${p.y}`; };
    const elements: any[] = app.elmList;
    const records: {key:string; params:string; ports:string[]}[] = [];
    const stimuli: string[] = [];
    for (const e of elements) {
      const type = e.getXmlDumpType();
      const ports = Array.from({length:e.getPostCount()}, (_,i)=>point(e,i));
      ports.forEach(find);
      if (['w','rw'].includes(type) && ports.length===2) { join(ports[0],ports[1]); continue; }
      if (e.isGroundElm?.()) { if(ports[0]) join(ports[0],'@ground'); continue; }
      if (type==='ln') { if(ports[0]) join(ports[0],`@label:${e.getName()}`); continue; }
      if (!ports.length) continue;
      const node=doc.createElement(type); e.dumpXml(doc,node); node.removeAttribute('x');
      if (e.isSwitchElm?.()) { node.removeAttribute('p'); stimuli.push(`${id(e)}:${e.position}`); }
      records.push({key:String(id(e)),params:new XMLSerializer().serializeToString(node),ports});
    }
    const groups = new Map<string,string[]>();
    for (const r of records) r.ports.forEach((p,i)=>{ const root=find(p); const list=groups.get(root)??[];list.push(`${r.key}:${i}`);groups.set(root,list); });
    const electric = records.map(r=>[r.key,r.params,r.ports.map(p=>(find(p)===find('@ground')?'G:':'')+groups.get(find(p))!.slice().sort().join('|'))]);
    const designDoc=new DOMParser().parseFromString(app.dumpCircuit(false),'text/xml');
    const models=Array.from(designDoc.documentElement.children).filter(e=>['dm','tm','mm','rlm','clm','ccm'].includes(e.tagName)).map(e=>new XMLSerializer().serializeToString(e));
    const root=designDoc.documentElement;
    const options=[root.getAttribute('ts'),root.getAttribute('mts'),Number(root.getAttribute('f'))&128,root.getAttribute('st')];
    return {electric:JSON.stringify({electric,models,options}),stimulus:stimuli.join(';')};
  }

  function baseline() { const s=signatures();lastElectric=s.electric;lastStimulus=s.stimulus;lastDesign=app.dumpCircuit(false); }
  function check(forceView=false) {
    if(busy) return;
    const design=app.dumpCircuit(false);
    if(design!==lastDesign) {
      const s=signatures();
      const changed=s.electric!==lastElectric;
      const stimulus=s.stimulus!==lastStimulus;
      if(changed) { designRevision++;needsReset=true;hostError='';run(false);message='电气设计已修改 · 请重新开始';app.scopeManager.resetGraphs(); }
      else if(stimulus) {stimulusCount++;message='输入已切换 · 正在观察本次运行中的激励';}
      lastDesign=design;lastElectric=s.electric;lastStimulus=s.stimulus;dirty=true;
    }
    if(forceView) dirty=true;
    if(dirty && !app.mouse.dragging && !app.dialogIsShowing()) {
      dirty=false;bridge.onchange?.({circuit:documentText(),needsReset});
    }
  }
  function status() {
    const error=hostError || app.stopMessage || (app.consoleExceptionOccurred ? '内核出现异常，请检查元件和参数后重新开始。' : '');
    return {running:app.simIsRunning(),time:app.sim.t,error,needsReset,message,elements:app.elmList.length,scopes:app.scopeManager.scopeCount,runId,designRevision,stimulusCount};
  }
  function inspect(text: string) {
    if (typeof text!=='string' || new TextEncoder().encode(text).length>1_000_000) throw new Error('电路文件超过 1 MB 限制');
    text=text.trim();
    let count=0;
    if(text.startsWith('<')) {
      if(/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('不支持带外部声明的 XML');
      const doc=new DOMParser().parseFromString(text,'text/xml'),root=doc.documentElement;
      if(doc.querySelector('parsererror') || root.tagName!=='cir' || root.hasAttribute('sublib')) throw new Error('需要完整的 CircuitJS 电路，不支持子电路库文件');
      const metadata=new Set(['o','dm','rlm','tm','mm','clm','ccm','h','adj']);
      DiodeModel.createModelMap();
      const declaredDiodes=new Set<string|null>();
      for(const e of Array.from(root.children)) {
        if(e.tagName==='dm')declaredDiodes.add(e.getAttribute('nm'));
        if(metadata.has(e.tagName)) continue;
        if(!CirSim.xmlDumpTypeMap.has(e.tagName) || !e.hasAttribute('x')) throw new Error(`未知或不完整的元件：${e.tagName}`);
        const coords=e.getAttribute('x')!.trim().split(/\s+/).map(Number);
        if(coords.length!==4 || coords.some(v=>!Number.isFinite(v)||!Number.isInteger(v)||Math.abs(v)>100000)) throw new Error('元件坐标无效');
        const model=e.getAttribute('mo'),className=CirSim.xmlDumpTypeMap.get(e.tagName)!;
        if(model&&['DiodeElm','ZenerElm','LEDElm','VaractorElm'].includes(className)&&!DiodeModel.modelMap.has(model)&&!declaredDiodes.has(model))throw new Error(`二极管模型缺失：${model}`);
        count++;
      }
      if(doc.getElementsByTagName('*').length>3000) throw new Error('文件中的模型或配置过多');
    } else {
      for(const line of text.split(/\r?\n/).filter(x=>x.trim())) {
        const token=line.trim().split(/\s+/)[0];
        if(['$','o','h','!','"',' ','&'].includes(token)) continue;
        if(token==='.') throw new Error('首版不支持旧文本子电路库，请使用完整 XML 电路');
        const code=/^\d+$/.test(token)?Number(token):token.charCodeAt(0);
        if(!CirSim.dumpTypeMap.has(code)) throw new Error(`未知或不支持的旧文本记录：${token}`);
        count++;
      }
    }
    if(count>500) throw new Error('导入超过 500 个图元，请缩小为局部电路');
    return {text,count};
  }

  // Public parsing helpers silently default malformed values upstream. Be strict
  // inside the opted-in sandbox, so partial loads cannot be reported as success.
  for(const key of ['parseDoubleAttr','parseIntAttr']) {
    const original=(CircuitXMLDeserializer.prototype as any)[key];
    (CircuitXMLDeserializer.prototype as any)[key]=function(attr:string,def:number) {
      const raw=this.currentXmlElement.getAttribute(attr);
      if(raw!==null && (raw.trim()==='' || !Number.isFinite(Number(raw)) || (key==='parseIntAttr'&&!Number.isInteger(Number(raw))))) throw new Error(`数值无效：${attr}=${raw}`);
      return original.call(this,attr,def);
    };
  }

  const bridge:any = {
    version:1,onchange:null,onrequest:null,
    status,
    snapshot:documentText,
    flush() {check();return documentText();},
    load(text:string) {
      const input=inspect(text);busy++;
      try {
        run(false);hostError='';app.consoleExceptionOccurred=false;app.resetEditingContext();
        const diagnostics:string[]=[],log=console.log;
        console.log=(...args:any[])=>{const text=args.map(String).join(' ');if(/unrecognized|model not found|exception|failed to create|invalid value/i.test(text))diagnostics.push(text);log(...args);};
        try{load(input.text);}finally{console.log=log;}
        if(diagnostics.length)throw new Error(diagnostics[0]);
        if(app.consoleExceptionOccurred || app.elmList.length!==input.count) throw new Error('电路未完整载入，原项目未替换');
        if(!Number.isFinite(app.sim.maxTimeStep)||app.sim.maxTimeStep<=0||app.sim.maxTimeStep>1||!Number.isFinite(app.sim.minTimeStep)||app.sim.minTimeStep<=0) throw new Error('仿真步长无效');
        reset();run(false);app.sim.analyzeCircuit();app.analyzeFlag=false;needsReset=false;runId=crypto.randomUUID();stimulusCount=0;message='已载入设计 · 从显式初始条件开始';
        app.undoManager.undoStack=[];app.undoManager.redoStack=[];app.undoManager.enableUndoRedo();
        baseline();dirty=false;
        return {circuit:documentText(),...status()};
      } finally {busy--;}
    },
    pause() {run(false);},
    run() {check(); if(needsReset) throw new Error('设计已修改，请点击“重新开始”'); app.ui.setSimRunning(true);return status();},
    restart() {busy++;try{run(false);hostError='';reset();run(false);app.sim.analyzeCircuit();app.analyzeFlag=false;needsReset=false;runId=crypto.randomUUID();stimulusCount=0;message='已按初始条件重新开始';baseline();}finally{busy--;}app.ui.setSimRunning(true);return status();},
  };
  (window as any).CircuitSandbox=bridge;
  // Reject ideal-source-only loops before the upstream convenience regularizer
  // inserts 1 mΩ into sources. Do not silently turn an impossible drawing into a
  // different, apparently successful circuit. This is host validation, not a solver change.
  function sourceLoop():boolean {
    const parents=new Map<string,string>();
    const root=(p:string):string=>{if(!parents.has(p))parents.set(p,p);const q=parents.get(p)!;if(q!==p)parents.set(p,root(q));return parents.get(p)!;};
    const join=(a:string,b:string)=>parents.set(root(a),root(b));
    const port=(e:any,i:number)=>{const p=e.getPost(i);return `${p.x},${p.y}`;};
    for(const e of app.elmList){const type=e.getXmlDumpType();if((['w','rw'].includes(type)||(type==='s'&&e.position===0&&e.resistance===0))&&e.getPostCount()===2)join(port(e,0),port(e,1));else if(e.isGroundElm?.())join(port(e,0),'@ground');else if(type==='ln')join(port(e,0),`@label:${e.getName()}`);}
    for(const e of app.elmList)if(e.internalResistance===0&&typeof e.waveform==='number'&&e.getPostCount()>0){const a=port(e,0),b=e.getPostCount()===1?'@ground':port(e,1);if(root(a)===root(b))return true;join(a,b);}
    return false;
  }
  app.ui.setSimRunning=(value:boolean)=>{
    if(busy){run(false);return;}
    check();
    if(value && (needsReset || app.elmList.length>200 || app.elmList.length===0)) {notice(needsReset?'设计已修改，请点击工作台“重新开始”': '运行范围为 1–200 个图元，请调整电路');return;}
    if(value && sourceLoop()){hostError='理想电压源形成闭环或被导线短接。请检查连接，并在需要时显式加入真实内阻。';run(false);return;}
    if(value && !app.simIsRunning())started=performance.now();
    run(value);
  };
  app.ui.resetAction=()=>bridge.restart();
  const analyze=app.needAnalyze.bind(app);
  app.needAnalyze=()=>{analyze();check();};
  const update=app.ui.updateCircuit.bind(app.ui);
  app.ui.updateCircuit=()=>{check();if(app.simIsRunning()&&sourceLoop()){hostError='理想电压源形成闭环或被导线短接。请检查连接，并显式加入需要的真实内阻。';run(false);}if(app.simIsRunning() && performance.now()-started>60000){run(false);message='本次运行已满 60 秒 · 已暂停，可继续';}update();};
  app.loader.readCircuit=(text:string,flags=0)=>{
    if(!busy && !undoing && !(flags&1)) {notice('请通过中文工作台新建或导入项目');return;}
    inspect(text);load(text,flags);check();
  };
  const undoSignatures=new WeakMap<object,string>();
  const pushUndo=app.undoManager.pushUndo.bind(app.undoManager);
  app.undoManager.pushUndo=()=>{pushUndo();const item=app.undoManager.undoStack.at(-1);if(item)undoSignatures.set(item,signatures().electric);};
  const loadUndo=app.undoManager.loadUndoItem.bind(app.undoManager);
  app.undoManager.loadUndoItem=(item:any)=>{
    if(undoSignatures.get(item)===signatures().electric){
      const doc=new DOMParser().parseFromString(item.dump,'text/xml');
      const nodes=Array.from(doc.documentElement.children).filter(e=>CirSim.xmlDumpTypeMap.has(e.tagName)&&e.hasAttribute('x'));
      if(nodes.length===app.elmList.length&&nodes.every((e,i)=>e.tagName===app.elmList[i].getXmlDumpType())){
        nodes.forEach((node,i)=>{const e=app.elmList[i];if(!e.getPostCount()){const reader=new CircuitXMLDeserializer(app);reader.currentXmlElement=node;e.undumpXml(reader);}if(e.isSwitchElm?.())e.position=Number(node.getAttribute('p')??0);e.setPositionFromXml(node);});
        app.transform[0]=app.transform[3]=item.scale;app.transform[4]=item.transform4;app.transform[5]=item.transform5;
        app.needAnalyze();return;
      }
    }
    loadUndo(item);
  };
  for(const key of ['doUndo','doRedo']) {
    const original=app.undoManager[key].bind(app.undoManager);
    app.undoManager[key]=()=>{const before=signatures().electric,oldIds=app.elmList.map((e:any)=>id(e));undoing++;busy++;try{original();app.elmList.forEach((e:any,i:number)=>{if(oldIds[i])ids.set(e,oldIds[i]);});const item=app.undoManager[key==='doUndo'?'redoStack':'undoStack'].at(-1);if(item)undoSignatures.set(item,before);}finally{undoing--;busy--;}check();};
  }
  app.undoManager.writeRecoveryToStorage=()=>{};
  // The parent tracks successful IndexedDB commits and owns beforeunload protection.
  // Native file-save flags must not produce a second prompt after a host save.
  app.isModified=()=>false;
  app.menus.readSetupFile=()=>request('templates');
  const command=app.commands.menuPerformed.bind(app.commands);
  app.commands.menuPerformed=(menu:string,item:string)=>{
    if(['newblankcircuit','newwindow'].includes(item)){request('new');return;}
    if(item==='importfromdropbox'){notice('首版支持本机项目文件，请使用工作台导入');return;}
    if(item==='exportasurl'){notice('请下载项目文件分享；首版不提供在线链接');return;}
    if(['importfromlocalfile','importfromtext'].includes(item)){request(item==='importfromtext'?'importText':'import');return;}
    if(item==='exportastext'){request('exportCircuit');return;}
    if(['save','saveas','exportaslocalfile'].includes(item)){request('export');return;}
    if(['recover','createsubcircuit','subcircuits','dcanalysis'].includes(item)){notice('此高级操作暂不纳入沙盒项目管理，请使用工作台项目与初始条件');return;}
    command(menu,item);check(true);
  };
  api.importCircuit=(text:string)=>request('importText',text);
  if(app.ui.loadFileInput) app.ui.loadFileInput.element.style.display='none';
  app.ui.iFrame?.remove();
  app.menus.toolbarCheckItem.setState(true);
  app.menus.showPropsOnClickCheckItem.setState(true);
  app.ui.setToolbar();
  const highlight=app.ui.toolbar.highlightButton.bind(app.ui.toolbar);
  app.ui.toolbar.highlightButton=(key:string)=>{highlight(key);if(!app.ui.toolbar.highlightableButtons.has(key))app.ui.toolbar.activeButton=null;};
  const events=['mouseup','keyup','change','wheel'];
  for(const event of events) document.addEventListener(event,()=>setTimeout(()=>check(true),0));
  baseline();run(false);
}
