import type { Params } from '../types';
import { ENGINE_REVISION } from '../simulation/adapter';
import { defaultParams, makeCircuit } from '../simulation/templates';

export const PROJECT_FORMAT='circuit-intuition-project';
export const MAX_PROJECT_BYTES=1_000_000;
export type TemplateId='blank'|'divider'|'rc'|'i2c';
export type SandboxProject={
  format:typeof PROJECT_FORMAT;schemaVersion:1;engineRevision:string;id:string;revision:number;
  name:string;circuit:string;notes:{question:string;prediction:string;observation:string};
  source:string;createdAt:string;updatedAt:string;
};
export const sandboxTemplates:{id:TemplateId;name:string;description:string}[]=[
  {id:'blank',name:'空白电路',description:'从电源、参考地和一个回路开始。'},
  {id:'divider',name:'分压与负载',description:'接入负载，观察输出电压和各支路电流。'},
  {id:'rc',name:'RC 与时间',description:'改变时间尺度，观察建立过程和初始条件。'},
  {id:'i2c',name:'开漏上拉',description:'观察拉低电流、释放边沿与上拉电阻的取舍。'},
];
export function templateCircuit(id:TemplateId,params?:Params) {
  if(id==='blank')return '$ 1 0.00001 10 50 3.3 50 0.000000625';
  const model=makeCircuit({lesson:id,params:params??defaultParams(id),diagnostic:false,variant:0});
  return model.text+'\no 2 64 0 3 3.3 0.001';
}
export function newProject(name:string,circuit:string,source='自主绘制'):SandboxProject {
  const now=new Date().toISOString();
  return {format:PROJECT_FORMAT,schemaVersion:1,engineRevision:ENGINE_REVISION,id:crypto.randomUUID(),revision:0,name,circuit,source,notes:{question:'',prediction:'',observation:''},createdAt:now,updatedAt:now};
}
export function parseProject(raw:string):SandboxProject {
  if(new TextEncoder().encode(raw).length>MAX_PROJECT_BYTES)throw new Error('项目超过 1 MB 限制');
  const p=JSON.parse(raw);
  const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
  if(p?.format!==PROJECT_FORMAT||p.schemaVersion!==1)throw new Error('不是受支持的沙盒项目文件；学习记录请使用课程导入');
  if(p.engineRevision!==ENGINE_REVISION)throw new Error('项目内核版本不同，请先导出原生电路再检查兼容性');
  if(!text(p.id,100)||!p.id||!Number.isSafeInteger(p.revision)||p.revision<0||!text(p.name,100)||!p.name.trim()||!text(p.circuit,MAX_PROJECT_BYTES)||!p.circuit.trim()||!text(p.source,300)||!text(p.createdAt,50)||!text(p.updatedAt,50)||!p.notes||!['question','prediction','observation'].every(k=>text(p.notes[k],4000)))throw new Error('项目字段缺失或无效');
  return {format:PROJECT_FORMAT,schemaVersion:1,engineRevision:p.engineRevision,id:p.id,revision:p.revision,name:p.name,circuit:p.circuit,source:p.source,createdAt:p.createdAt,updatedAt:p.updatedAt,notes:{...p.notes}};
}
export function importProject(raw:string,fileName='导入电路'):SandboxProject {
  if(new TextEncoder().encode(raw).length>MAX_PROJECT_BYTES)throw new Error('文件超过 1 MB 限制');
  const text=raw.trim();
  if(text.startsWith('{')) {
    const imported=parseProject(text),copy=newProject(imported.name+' · 导入副本',imported.circuit,imported.source);
    copy.name=copy.name.slice(0,100);copy.notes=imported.notes;return copy;
  }
  if(!text.startsWith('<')&&!text.startsWith('$'))throw new Error('请选择项目 JSON、CircuitJS XML 或带选项头的旧文本电路');
  return newProject(fileName.replace(/\.[^.]+$/,'').slice(0,100)||'导入电路',text,'原生电路文件导入');
}
