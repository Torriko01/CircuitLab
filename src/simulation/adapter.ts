import type { CircuitAPI, EngineWindow, JSComponent, RunConfig, RunResult, Sample } from '../types';
import { makeCircuit } from './templates';

export const ENGINE_REVISION='8ee04b18a6c9241675f1c4f766617806c2fe148d';
export class CircuitAdapter {
  private generation=0;
  private frame: HTMLIFrameElement|null=null;
  private api: CircuitAPI|null=null;
  private cancel: (()=>void)|null=null;
  private finish: (()=>void)|null=null;
  private active: RunResult|null=null;
  constructor(private host: HTMLElement) {}
  async load(config: RunConfig, update?: (s: Sample)=>void): Promise<RunResult> {
    this.dispose();const generation=++this.generation;
    const model=makeCircuit(config), frame=document.createElement('iframe');
    this.frame=frame; frame.title='CircuitJS 实时电路';frame.tabIndex=-1;frame.style.pointerEvents='none';
    const params=new URLSearchParams({cct:model.text,running:'false',hideSidebar:'true',hideMenu:'true',hideInfoBox:'true',editable:'false',whiteBackground:'true',conventionalCurrent:'true',positiveColor:'#16836d',negativeColor:'#db705e',currentColor:'#b58a21',lang:'en'});
    frame.src='/vendor/circuitjs/circuitjs.html?'+params;
    this.host.replaceChildren(frame);
    const api=await new Promise<CircuitAPI>((resolve,reject)=>{
      const timer=window.setTimeout(()=>{clearInterval(poll);reject(new Error('仿真器加载超时，请重试'));},10000);
      const poll=window.setInterval(()=>{
        if(generation!==this.generation){clearInterval(poll);clearTimeout(timer);reject(new Error('已切换实验'));return;}
        const api=(frame.contentWindow as EngineWindow|null)?.CircuitJS1;
        if(api){clearInterval(poll);clearTimeout(timer);resolve(api);}
      },20);
    });
    if(generation!==this.generation) throw new Error('已切换实验');
    this.api=api;api.setSimRunning(false);api.setMaxTimeStep(model.step);
    const elements=api.getElements();
    const labels=elements.filter(e=>e.getLabelName).map(e=>e.getLabelName!());
    for(const n of model.nodes) if(labels.filter(x=>x===n).length!==1) throw new Error(`节点 ${n} 缺失或重复，停止测量`);
    const branches:Record<string,JSComponent>={};
    for(const [name,index] of Object.entries(model.branches)) {
      const e=elements[index],expected=model.branchTypes[name]??'ResistorElm';if(!['ResistorElm','CapacitorElm','InductorElm','DiodeElm'].includes(expected)||!e || e.getType()!==expected) throw new Error(`支路 ${name} 映射失败`);branches[name]=e;
    }
    const run:RunResult={id:crypto.randomUUID(),config:structuredClone(config),samples:[],step:model.step,duration:model.duration,status:'paused',elapsed:0};
    this.active=run;
    api.ontimestep=()=>{
      if(generation!==this.generation) return;
      const sample:Sample={t:api.getTime(),nodes:{},currents:{}};
      for(const n of model.nodes) sample.nodes[n]=api.getNodeVoltage(n);
      for(const [n,e] of Object.entries(branches)) sample.currents[n]=e.getCurrent();
      if(!Object.values({...sample.nodes,...sample.currents}).every(Number.isFinite)) {this.cancel?.();return;}
      run.samples.push(sample);
      if(run.samples.length%200===0) update?.(sample);
      if(sample.t>=model.duration || run.samples.length>=100000){api.setSimRunning(false);this.finish?.();}
    };
    return run;
  }
  capture(): Promise<RunResult> {
    if(!this.api || !this.active) return Promise.reject(new Error('仿真器尚未就绪'));
    const api=this.api,run=this.active,start=performance.now();
    return new Promise((resolve,reject)=>{
      const timeout=window.setTimeout(()=>{api.setSimRunning(false);clean();reject(new Error('捕获超时，请缩小窗口并重试'));},15000);
      const clean=()=>{clearTimeout(timeout);this.cancel=null;this.finish=null;};
      this.cancel=()=>{clean();reject(new Error('实验已切换或数据无效'));};
      this.finish=()=>{clean();run.elapsed=performance.now()-start;run.status=run.samples.at(-1)!.t>=run.duration?'complete':'paused';
        if(run.status!=='complete')reject(new Error('样本超出上限，未完成捕获'));else resolve(run);};
      api.setSimRunning(true);
    });
  }
  pause(){this.api?.setSimRunning(false);}
  dispose(){this.generation++;this.api?.setSimRunning(false);if(this.api)this.api.ontimestep=undefined;this.cancel?.();this.api=null;this.frame?.remove();this.frame=null;this.active=null;}
}
