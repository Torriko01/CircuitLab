import { describe,it,expect } from 'vitest';
import { adcCode,belowDuration,heldSample,minimumSample } from '../src/measurement';
import { defaultParams,makeCircuit,validateParams } from '../src/simulation/templates';
import { evaluate,freshStore,parseStore } from '../src/store';
import type { Evidence,LessonId,RunResult,Sample } from '../src/types';
const run=(samples:Sample[]):RunResult=>({id:'r',config:{lesson:'adc',params:defaultParams('adc'),diagnostic:false,variant:0},samples,step:1e-9,duration:4e-6,status:'complete',elapsed:1});
const evidence=(lesson:LessonId,label:string,kind:Evidence['kind'],value:number,params={})=>({id:crypto.randomUUID(),runId:'r',lesson,label,kind,value,unit:'V',variant:0,diagnostic:true,status:'有效',purpose:'distinguish',simTime:1e-4,conditions:'实际捕获',createdAt:'2026-10-15',parameters:{...defaultParams(lesson),...params}} as Evidence);
function grade(lesson:LessonId,items:Evidence[]) {const p=freshStore().lessons[lesson];Object.assign(p,{cause:'right',explanation:'why',remedy:'right',evidence:items,evidenceIds:items.map(e=>e.id)});return evaluate(p,{cause:'right',explanation:'why'});}
describe('event measurements and quantization',()=>{
 it('only holds at a captured falling control edge',()=>{
  const s=[{t:0,nodes:{CTRL:5,HOLD:1,VREF:3.3},currents:{}},{t:1e-6,nodes:{CTRL:5,HOLD:1.4,VREF:3.3},currents:{}},{t:2e-6,nodes:{CTRL:0,HOLD:1.5,VREF:3.3},currents:{}},{t:3e-6,nodes:{CTRL:0,HOLD:1.501,VREF:3.3},currents:{}}];
  expect(heldSample(run(s))?.t).toBe(3e-6);expect(heldSample(run(s.slice(0,3)))).toBeNull();
 });
 it('uses the declared 4096-bin rule and rejects invalid references',()=>{
  expect(adcCode(1.65,3.3)).toBe(2048);expect(adcCode(3.3,3.3)).toBe(4095);expect(adcCode(-.01,3.3)).toBe(0);expect(adcCode(1,0)).toBeNull();expect(adcCode(NaN,3.3)).toBeNull();expect(adcCode(1.65,3.6)).toBe(1877);
 });
 it('interpolates both threshold crossings rather than counting display samples',()=>{
  const r=run([{t:0,nodes:{VMCU:4},currents:{}},{t:1,nodes:{VMCU:2},currents:{}},{t:3,nodes:{VMCU:4},currents:{}}]);
  expect(belowDuration(r,'VMCU',3)).toBe(1.5);expect(minimumSample(r,'VMCU').t).toBe(1);
 });
});
describe('engineering evidence requirements',()=>{
 it('does not award full GPIO credit without checking supply and isolated pin',()=>{
  const pin=evidence('gpio','V(PIN) − V(GND)','voltage',.000007,{connected:false});
  expect(grade('gpio',[pin])[1]).toBe(1);
  const source=evidence('gpio','V(VDD) − V(GND)','voltage',3.3);
  expect(grade('gpio',[pin,source])).toEqual([2,2,2,2]);
  pin.parameters!.connected=true;expect(grade('gpio',[pin,source])[1]).toBe(1);
 });
 it('requires sustained-load evidence for power diagnosis',()=>{
  const source=evidence('power','V(VIN) − V(GND)','voltage',3.3),min=evidence('power','最低值 VMCU','minimum',2.65);
  expect(grade('power',[source,min])[1]).toBe(1);min.parameters!.pulse=0;expect(grade('power',[source,min])).toEqual([2,2,2,2]);
 });
 it('requires ADC input, reference and two distinct sampling windows',()=>{
  const items=[evidence('adc','V(VIN) − V(GND)','voltage',1.65),evidence('adc','V(VREF) − V(GND)','voltage',3.3),evidence('adc','采样结束 HOLD','held',1.51,{sampleTime:5e-6})];
  expect(grade('adc',items)[1]).toBe(1);items.push(evidence('adc','采样结束 HOLD','held',1.65,{sampleTime:20e-6}));expect(grade('adc',items)).toEqual([2,2,2,2]);
  items[3].variant=1;expect(grade('adc',items)[1]).toBe(1);
 });
});
describe('migration and capture bounds',()=>{
 it('preserves v1 progress and evidence while adding the three lessons',()=>{
  const now=freshStore(),p=now.lessons.divider;p.reflection='先移除负载';p.completed=true;
  const oldEvidence=evidence('divider','V(VOUT) − V(GND)','voltage',1.1);oldEvidence.lessonVersion='0.1';p.evidence=[oldEvidence];p.evidenceIds=[oldEvidence.id];
  const legacy={schemaVersion:1,lessonVersion:'0.1',selected:'divider',lessons:{divider:p,rc:now.lessons.rc,i2c:now.lessons.i2c}};
  for(const p of Object.values(legacy.lessons))for(const key of ['drive','probe','probeCap','sampleTime','reference','initial']){delete (p.params as unknown as Record<string,unknown>)[key];for(const e of p.evidence)delete (e.parameters as unknown as Record<string,unknown>)[key];}
  const migrated=parseStore(JSON.stringify(legacy));expect(migrated.schemaVersion).toBe(4);expect(migrated.lessons.divider.reflection).toBe('先移除负载');expect(migrated.lessons.divider.completed).toBe(true);expect(migrated.lessons.divider.evidence[0].value).toBe(1.1);expect(migrated.lessons.divider.evidenceIds).toEqual([oldEvidence.id]);expect(migrated.lessons.divider.evidence[0].lessonVersion).toBe('0.1');expect(migrated.lessons.adc.phase).toBe('intro');expect(parseStore(JSON.stringify(migrated))).toEqual(migrated);
 });
 it('does not silently replace missing legacy parameters with defaults',()=>{const now=freshStore();const legacy={schemaVersion:1,lessonVersion:'0.1',selected:null,lessons:{divider:{...now.lessons.divider,params:null},rc:now.lessons.rc,i2c:now.lessons.i2c}};expect(()=>parseStore(JSON.stringify(legacy))).toThrow();});
 it('rejects invalid new-course conditions and unknown lessons',()=>{
  expect(()=>validateParams('power',{...defaultParams('power'),capacitance:0})).toThrow();expect(()=>validateParams('adc',{...defaultParams('adc'),sampleTime:NaN})).toThrow();expect(()=>validateParams('unknown',defaultParams('rc'))).toThrow();
 });
 it('keeps worst small time constants within the capture budget, even at half step',()=>{
  for(const sampleTime of [.2e-6,1e-6,5e-6,20e-6]){const m=makeCircuit({lesson:'adc',params:{...defaultParams('adc'),resistance:10000,sampleTime},diagnostic:false,variant:0,halfStep:true});expect(m.duration/m.step).toBeLessThan(100000);}
  const m=makeCircuit({lesson:'power',params:{...defaultParams('power'),resistance:1,capacitance:1e-6},diagnostic:false,variant:0,halfStep:true});expect(m.duration/m.step).toBeLessThan(100000);
 });
});
