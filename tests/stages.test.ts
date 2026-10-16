import { describe,it,expect } from 'vitest';
import { coilDecay } from '../src/measurement';
import { evaluate,freshStore,MAX_RECORD_BYTES,parseStore } from '../src/store';
import { defaultParams,makeCircuit } from '../src/simulation/templates';
import { lessons } from '../src/content';
import { extraControls } from '../src/lessonConfig';
import { lessonIds,type Evidence,type LessonId,type RunResult } from '../src/types';
const ev=(id:LessonId,label:string,kind:Evidence['kind']='voltage'):Evidence=>({id:crypto.randomUUID(),runId:'same',lesson:id,variant:0,diagnostic:true,kind,label,value:1,unit:'V',status:'有效',purpose:'distinguish',simTime:.00025,conditions:'captured',createdAt:'2026-10-15',parameters:defaultParams(id)});
const grade=(id:LessonId,items:Evidence[])=>{const p=freshStore().lessons[id];Object.assign(p,{evidence:items,evidenceIds:items.map(e=>e.id),cause:'cause',remedy:'cause',explanation:'explanation'});return evaluate(p,{cause:'cause',explanation:'explanation'});};
describe('new engineering evidence chains',()=>{
 it('requires three MOSFET voltage differences from the same loaded run',()=>{
  const items=['V(GATE) − V(SOURCE)','V(DRAIN) − V(SOURCE)','V(VIN) − V(VLOAD)'].map(label=>ev('mosfet',label));
  expect(grade('mosfet',items.slice(0,2))[1]).toBe(1);expect(grade('mosfet',items)).toEqual([2,2,2,2]);items[2].runId='different';expect(grade('mosfet',items)[1]).toBe(1);
 });
 it('requires peak AND current decay plus normal supply for flyback',()=>{
  const supply=ev('flyback','V(VIN) − V(GND)');supply.value=12;
  const items=[supply,ev('flyback','峰值 SW','peak'),ev('flyback','线圈电流降至 10% 时间','decay')];
  expect(grade('flyback',items.slice(0,2))[1]).toBe(1);expect(grade('flyback',items)).toEqual([2,2,2,2]);items[2].status='窗口不足';expect(grade('flyback',items)[1]).toBe(1);
 });
 it('requires simultaneous PCB voltages during a connected load plateau',()=>{
  const items=['V(SIG) − V(SGND)','V(SGND) − V(GND)','V(SIG) − V(GND)'].map(label=>ev('pcb',label));
  expect(grade('pcb',items)).toEqual([2,2,2,2]);items[2].simTime+=2e-7;expect(grade('pcb',items)[1]).toBe(1);items[2].simTime=.00025;
  items[2].parameters!.connected=false;expect(grade('pcb',items)[1]).toBe(1);items[2].parameters!.connected=true;items.forEach(e=>e.simTime=.0007);expect(grade('pcb',items)[1]).toBe(1);
 });
 it('does not join evidence across challenges or award full credit for the wrong purpose',()=>{
  const items=['V(GATE) − V(SOURCE)','V(DRAIN) − V(SOURCE)','V(VIN) − V(VLOAD)'].map(label=>ev('mosfet',label));items[1].variant=1;expect(grade('mosfet',items)[1]).toBe(1);items[1].variant=0;items[1].purpose='locate';expect(grade('mosfet',items)[1]).toBe(1);
 });
});
describe('coil event windows',()=>{
 const make=(i:number[],ctrl:number[]):RunResult=>({id:'r',config:{lesson:'flyback',params:defaultParams('flyback'),diagnostic:false,variant:0},step:1e-6,duration:i.length*1e-6,status:'complete',elapsed:1,samples:i.map((value,j)=>({t:j*1e-6,nodes:{CTRL:ctrl[j]},currents:{LCOIL:value}}))});
 it('uses the fully off step and interpolates the 10% crossing',()=>{const d=coilDecay(make([1,1,1,.8,.2,0],[5,5,0,0,0,0]));expect(d.start).toBeCloseTo(3e-6,12);expect(d.end).toBeCloseTo(4.5e-6,12);expect(d.value).toBeCloseTo(1.5e-6,12);});
 it('reports incomplete capture rather than inventing a release time',()=>{expect(coilDecay(make([1,1,1,.8],[5,5,0,0])).value).toBeNull();expect(coilDecay(make([1,1],[5,5])).value).toBeNull();});
});
describe('course compatibility and bounded presets',()=>{
 it('migrates v0.2 without modifying original evidence meaning',()=>{
  const now=freshStore(),p=now.lessons.adc;p.completed=true;p.reflection='核对参考';const e=ev('adc','采样结束 HOLD','held');e.lessonVersion='0.2';p.evidence=[e];p.evidenceIds=[e.id];
  const old={schemaVersion:2,lessonVersion:'0.2',selected:'adc',lessons:Object.fromEntries(lessonIds.slice(0,6).map(id=>[id,now.lessons[id]]))};
  for(const p of Object.values(old.lessons))for(const key of Object.keys(p.params).slice(12))delete (p.params as unknown as Record<string,unknown>)[key];
  const migrated=parseStore(JSON.stringify(old));expect(migrated.schemaVersion).toBe(4);expect(migrated.lessons.adc.completed).toBe(true);expect(migrated.lessons.adc.evidence[0].lessonVersion).toBe('0.2');expect(migrated.lessons.adc.evidenceIds).toEqual([e.id]);expect(migrated.lessons.pcb.phase).toBe('intro');expect(parseStore(JSON.stringify(migrated))).toEqual(migrated);
 });
 it('rejects missing current-schema fields and oversized UTF-8 records',()=>{const s=freshStore();delete (s.lessons.mosfet.params as Partial<typeof s.lessons.mosfet.params>).gate;expect(()=>parseStore(JSON.stringify(s))).toThrow();expect(()=>parseStore('中'.repeat(Math.floor(MAX_RECORD_BYTES/3)+1))).toThrow('4 MB');});
 it('keeps all visible presets valid and resolves the fastest coil within the capture budget',()=>{
  expect(lessons.map(l=>l.id)).toEqual([...lessonIds]);
  for(const id of ['mosfet','flyback','pcb'] as const)for(const c of extraControls[id]!)for(const [v] of c.options)expect(()=>makeCircuit({lesson:id,params:{...defaultParams(id),[c.key]:v},diagnostic:false,variant:0})).not.toThrow();
  const m=makeCircuit({lesson:'flyback',params:{...defaultParams('flyback'),inductance:.01,load:220,pulse:.002},diagnostic:false,variant:0,halfStep:true});expect(m.duration/m.step).toBeLessThan(100000);
 });
});
