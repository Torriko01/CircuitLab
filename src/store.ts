import { lessonIds, type Evidence, type LessonId, type Progress, type Store } from './types';
import { defaultParams, validateParams } from './simulation/templates';
import { signalDistinguishing,signalProof } from './signalEvidence';
export const STORAGE_KEY='circuit-intuition-lab-v1';
export const MAX_RECORD_BYTES=4000000;
export function freshProgress(id: LessonId): Progress { return {phase:'intro',variant:0,params:defaultParams(id),prediction:'',confidence:50,hints:0,evidence:[],cause:'',explanation:'',remedy:'',evidenceIds:[],score:null,transfer:['',''],transferred:false,reflection:'',completed:false}; }
export function freshStore(): Store {return {schemaVersion:4,lessonVersion:'0.4',selected:null,lessons:Object.fromEntries(lessonIds.map(id=>[id,freshProgress(id)])) as Record<LessonId,Progress>};}
const ids=lessonIds;
const text=(v: unknown, max=2000): v is string => typeof v==='string' && v.length<=max;
export function parseStore(raw: string): Store {
  if(new TextEncoder().encode(raw).length>MAX_RECORD_BYTES) throw new Error('记录超过 4 MB 限制');
  const s=JSON.parse(raw);
  const legacy=s?.schemaVersion===1 && s?.lessonVersion==='0.1';
  const v2=s?.schemaVersion===2&&s?.lessonVersion==='0.2';
  const v3=s?.schemaVersion===3&&s?.lessonVersion==='0.3';
  const prior=legacy||v2||v3;
  const sourceIds=legacy?ids.slice(0,3):v2?ids.slice(0,6):v3?ids.slice(0,9):ids;
  if(!s || (!prior&&(s.schemaVersion!==4 || s.lessonVersion!=='0.4')) || (s.selected!==null && !sourceIds.includes(s.selected)) || !s.lessons) throw new Error('记录格式或课程版本不兼容');
  for(const id of sourceIds) {
    const p=s.lessons[id];
    if(!p || !['intro','predict','explore','diagnose','judge','transfer','review'].includes(p.phase) || ![0,1].includes(p.variant)) throw new Error('学习阶段无效');
    const required=legacy?['resistance','load','connected','capacitance','pulse','frequency']:v2?['resistance','load','connected','capacitance','pulse','frequency','drive','probe','probeCap','sampleTime','reference','initial']:v3?['resistance','load','connected','capacitance','pulse','frequency','drive','probe','probeCap','sampleTime','reference','initial','gate','sourceOffset','pathResistance','inductance','protection','layout','signalNoise']:Object.keys(defaultParams(id));
    if(!p.params||!required.every(k=>Object.hasOwn(p.params,k)))throw new Error('记录缺少电路参数');
    if(prior)p.params={...defaultParams(id),...p.params};
    validateParams(id,p.params);
    if(![p.prediction,p.cause,p.explanation,p.remedy,p.reflection].every(x=>text(x)) || !Number.isFinite(p.confidence) || p.confidence<0 || p.confidence>100 || ![0,1,2,3].includes(p.hints) || typeof p.completed!=='boolean' || typeof p.transferred!=='boolean') throw new Error('答案字段无效');
    if(!Array.isArray(p.transfer) || p.transfer.length!==2 || !p.transfer.every((v:unknown)=>text(v,100)) || !Array.isArray(p.evidenceIds) || !p.evidenceIds.every((v:unknown)=>text(v,100))) throw new Error('答题记录无效');
    if(p.score!==null && (!Array.isArray(p.score) || p.score.length!==4 || !p.score.every((n:unknown)=>n===0 || n===1 || n===2))) throw new Error('评分无效');
    if(!Array.isArray(p.evidence) || p.evidence.length>200) throw new Error('证据记录数量无效');
    for(const e of p.evidence) if(!e || e.lesson!==id || ![0,1].includes(e.variant) || typeof e.diagnostic!=='boolean' || !['voltage','current','rise','peak',...(!legacy?['minimum','held','code']:[]),...(!legacy&&!v2?['decay']:[]),...(!prior?['edges','aperture','violations']:[])].includes(e.kind) || ![e.id,e.runId,e.label,e.unit,e.status,e.purpose,e.conditions,e.createdAt].every(x=>text(x)) || (e.value!==null && !Number.isFinite(e.value)) || !Number.isFinite(e.simTime)) throw new Error('测量记录无效');
    for(const e of p.evidence){if(e.parameters){if(prior)e.parameters={...defaultParams(id),...e.parameters};validateParams(id,e.parameters);}if(e.engineRevision!==undefined&&!text(e.engineRevision,100))throw new Error('内核版本无效');if(e.stepSeconds!==undefined&&(!Number.isFinite(e.stepSeconds)||e.stepSeconds<=0))throw new Error('步长无效');}
  }
  if(prior){for(const id of ids.slice(sourceIds.length))s.lessons[id]=freshProgress(id);s.schemaVersion=4;s.lessonVersion='0.4';}
  return s as Store;
}
export function distinguishing(e: Evidence) {
  if(!e.diagnostic || e.value===null || e.status!=='有效') return false;
  if(e.lesson==='divider') return (e.kind==='current' && e.label==='I(R1)') || (e.kind==='voltage' && e.label==='V(VOUT) − V(GND)' && e.conditions.includes('模块已移除'));
  if(e.lesson==='rc') return (e.kind==='peak' && e.label==='峰值 VIN') || (e.kind==='voltage' && e.label==='V(VIN) − V(GND)' && e.simTime<.03 && e.simTime>0);
  if(e.lesson==='i2c')return e.kind==='current' && e.label==='I(RP) · 稳定低态';
  if(e.lesson==='gpio')return e.kind==='voltage'&&e.label==='V(PIN) − V(GND)'&&e.parameters?.connected===false&&e.parameters.resistance===0;
  if(e.lesson==='power')return e.kind==='minimum'&&e.label==='最低值 VMCU'&&(e.parameters?.pulse===0||e.parameters?.pulse===300e-6);
  if(e.lesson==='mosfet')return e.kind==='voltage'&&['V(GATE) − V(SOURCE)','V(DRAIN) − V(SOURCE)','V(VIN) − V(VLOAD)'].includes(e.label);
  if(e.lesson==='flyback')return (e.kind==='peak'&&e.label==='峰值 SW')||(e.kind==='decay'&&e.label==='线圈电流降至 10% 时间');
  if(e.lesson==='pcb')return e.kind==='voltage'&&['V(SIG) − V(SGND)','V(SGND) − V(GND)','V(SIG) − V(GND)'].includes(e.label)&&e.parameters?.connected===true&&e.simTime>=150e-6&&e.simTime<=350e-6;
  if(['debounce','opamp','spi'].includes(e.lesson))return signalDistinguishing(e);
  return e.kind==='held'&&e.label==='采样结束 HOLD';
}
export function completeProof(evidence:Evidence[]) {
  const id=evidence[0]?.lesson;
  const hasVoltage=(node:string,v?:number)=>evidence.some(e=>e.kind==='voltage'&&e.label===`V(${node}) − V(GND)`&&e.value!==null&&(v===undefined||Math.abs(e.value-v)<.01)&&e.status==='有效'&&e.purpose==='distinguish');
  const valid=evidence.filter(e=>distinguishing(e)&&e.purpose==='distinguish');
  if(id==='gpio')return hasVoltage('VDD',3.3)&&valid.length>0;
  if(id==='power')return hasVoltage('VIN',3.3)&&valid.length>0;
  if(id==='adc')return hasVoltage('VIN',1.65)&&hasVoltage('VREF')&&[5e-6,20e-6].every(t=>valid.some(e=>e.parameters?.sampleTime===t));
  if(id==='mosfet'||id==='pcb'){
    const labels=id==='mosfet'?['V(GATE) − V(SOURCE)','V(DRAIN) − V(SOURCE)','V(VIN) − V(VLOAD)']:['V(SIG) − V(SGND)','V(SGND) − V(GND)','V(SIG) − V(GND)'];
    return valid.some(base=>labels.every(label=>valid.some(e=>e.runId===base.runId&&e.label===label&&(id!=='pcb'||Math.abs(e.simTime-base.simTime)<1e-12))));
  }
  if(id==='flyback')return valid.some(base=>['peak','decay'].every(kind=>valid.some(e=>e.runId===base.runId&&e.kind===kind))&&evidence.some(e=>e.runId===base.runId&&e.kind==='voltage'&&e.label==='V(VIN) − V(GND)'&&e.value!==null&&Math.abs(e.value-12)<.01&&e.purpose==='distinguish'));
  if(['debounce','opamp','spi'].includes(id))return signalProof(evidence);
  return valid.length>0;
}
export function evaluate(p: Progress, answers: {cause:string;explanation:string}) {
  const evidence=p.evidence.filter(e=>p.evidenceIds.includes(e.id) && e.diagnostic && e.variant===p.variant && e.value!==null && e.status==='有效');
  const valid=evidence.filter(distinguishing);
  const purpose=completeProof(evidence);
  const full= ['gpio','power','adc','mosfet','flyback','pcb','debounce','opamp','spi'].includes(evidence[0]?.lesson)?purpose:valid.length>0;
  return [p.cause===answers.cause?2:0, purpose?2:evidence.length?1:0, p.explanation===answers.explanation && full?2:p.explanation===answers.explanation?1:0, p.remedy===answers.cause?2:0];
}
