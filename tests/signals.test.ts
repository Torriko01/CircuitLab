import { describe,it,expect } from 'vitest';
import { edges,nodeAt,risingCount,spiTiming } from '../src/signalMeasurement';
import { defaultParams,makeCircuit,validateParams } from '../src/simulation/templates';
import { evaluate,freshStore,parseStore } from '../src/store';
import { lessonIds,type Evidence,type LessonId,type RunResult } from '../src/types';
import { extraControls } from '../src/lessonConfig';
const spiRun=(wrong=false,glitch=false):RunResult=>({id:'r',config:{lesson:'spi',params:defaultParams('spi'),diagnostic:false,variant:0},step:25e-9,duration:5e-6,status:'complete',elapsed:1,samples:Array.from({length:201},(_,i)=>{const t=i*25e-9,phase=(i%40)/40,tx=Math.floor(i/40)%2===0?3.3:0;return {t,nodes:{TX:tx,DATA:glitch&&i===101?0:tx,CLK:phase>=.5?3.3:0,SAMPLE:wrong?(phase<.5?3.3:0):(phase>=.5?3.3:0)},currents:{}};})});
const ev=(id:LessonId,label:string,kind:Evidence['kind'],params={}):Evidence=>({id:crypto.randomUUID(),runId:'same',lesson:id,label,kind,value:1,unit:'V',variant:0,diagnostic:true,status:'有效',purpose:'distinguish',simTime:.001,conditions:'captured',createdAt:'2026-10-15',parameters:{...defaultParams(id),...params}});
const grade=(id:LessonId,items:Evidence[])=>{const p=freshStore().lessons[id];Object.assign(p,{evidence:items,evidenceIds:items.map(e=>e.id),cause:'yes',remedy:'yes',explanation:'why'});return evaluate(p,{cause:'yes',explanation:'why'});};
describe('edge and aperture semantics',()=>{
 it('does not count initial high as a new rising edge',()=>{const r=spiRun();expect(risingCount(r,'TX')).toBe(2);expect(edges(r,'TX')[0].rising).toBe(false);});
 it('interpolates stored samples and rejects out-of-capture times',()=>{const r=spiRun();expect(nodeAt(r,'TX',987.5e-9)).toBeCloseTo(1.65,8);expect(nodeAt(r,'TX',-1)).toBeNull();expect(nodeAt(r,'TX',6e-6)).toBeNull();});
 it('checks three settled sampling events with a full pre/post window',()=>{const t=spiTiming(spiRun());expect(t.events).toHaveLength(3);expect(t.violations).toBe(0);expect(t.minGap).toBeCloseTo(.5e-6,9);});
 it('rejects an edge-coincident sample even with ideal fast data',()=>{const t=spiTiming(spiRun(true));expect(t.violations).toBe(3);expect(t.minGap).toBe(0);expect(t.events.every(e=>e.reason.includes('源改变沿'))).toBe(true);});
 it('checks every interior sample, not only the value at the sample instant',()=>{const t=spiTiming(spiRun(false,true));expect(t.events[0].value).toBe(3.3);expect(t.violations).toBe(1);});
 it('does not turn an empty event window into a zero-failure pass',()=>{const r=spiRun();r.samples=r.samples.slice(0,40);expect(spiTiming(r).violations).toBeNull();expect(spiTiming(r).minGap).toBeNull();});
});
describe('third-batch evidence chains',()=>{
 it('requires raw count, output count and filter peak under the same 8 ms conditions',()=>{const a=[ev('debounce','上升沿 RAW','edges'),ev('debounce','上升沿 OUT','edges'),ev('debounce','峰值 FILTER','peak')];expect(grade('debounce',a.slice(0,2))[1]).toBe(1);expect(grade('debounce',a)).toEqual([2,2,2,2]);a[2].parameters!.pressTime=.015;expect(grade('debounce',a)[1]).toBe(1);});
 it('requires a second known input to distinguish clipping and feedback ratio',()=>{const a=[ev('opamp','V(VIN) − V(GND)','voltage'),ev('opamp','V(VOUT) − V(GND)','voltage'),ev('opamp','V(PLUS) − V(FB)','voltage')];expect(grade('opamp',a)[1]).toBe(1);a.push(ev('opamp','V(VOUT) − V(GND)','voltage',{signalVoltage:.4}));expect(grade('opamp',a)).toEqual([2,2,2,2]);a[1].runId='other';expect(grade('opamp',a)[1]).toBe(1);});
 it('requires all three SPI metrics from a 1 MHz run with matching measurement kinds',()=>{const a=[ev('spi','DATA 30%–70% 上升时间','rise'),ev('spi','改变沿至采样沿最短间隔','aperture'),ev('spi','不保证的采样事件数','violations')];expect(grade('spi',a)).toEqual([2,2,2,2]);a[1].kind='rise';expect(grade('spi',a)[1]).toBe(1);a[1].kind='aperture';a[2].parameters!.clockFrequency=500000;expect(grade('spi',a)[1]).toBe(1);});
 it('does not mix variants, invalid events or observation purposes',()=>{const a=[ev('debounce','上升沿 RAW','edges'),ev('debounce','上升沿 OUT','edges'),ev('debounce','峰值 FILTER','peak')];a[1].variant=1;expect(grade('debounce',a)[1]).toBe(1);a[1].variant=0;a[1].purpose='locate';expect(grade('debounce',a)[1]).toBe(1);a[1].purpose='distinguish';a[1].value=null;expect(grade('debounce',a)[1]).toBe(1);});
});
describe('v0.3 compatibility and bounded models',()=>{
 it('migrates all nine old lessons, keeping original evidence provenance and backup-compatible data',()=>{
  const now=freshStore(),p=now.lessons.flyback;p.completed=true;p.reflection='核对电流路径';const e=ev('flyback','线圈电流降至 10% 时间','decay');e.lessonVersion='0.3';p.evidence=[e];p.evidenceIds=[e.id];
  const old={schemaVersion:3,lessonVersion:'0.3',selected:'flyback',lessons:Object.fromEntries(lessonIds.slice(0,9).map(id=>[id,now.lessons[id]]))};
  for(const p of Object.values(old.lessons)){for(const key of Object.keys(p.params).slice(19))delete(p.params as unknown as Record<string,unknown>)[key];for(const e of p.evidence)for(const key of Object.keys(e.parameters!).slice(19))delete(e.parameters as unknown as Record<string,unknown>)[key];}
  const next=parseStore(JSON.stringify(old));expect(next.schemaVersion).toBe(4);expect(next.lessons.flyback.completed).toBe(true);expect(next.lessons.flyback.evidence[0].lessonVersion).toBe('0.3');expect(next.lessons.flyback.evidenceIds).toEqual([e.id]);expect(next.lessons.spi.phase).toBe('intro');expect(parseStore(JSON.stringify(next))).toEqual(next);
 });
 it('rejects missing v0.3 fields and invalid new presets',()=>{const now=freshStore();const old={schemaVersion:3,lessonVersion:'0.3',selected:null,lessons:Object.fromEntries(lessonIds.slice(0,9).map(id=>[id,now.lessons[id]]))};delete(old.lessons.pcb.params as Partial<typeof old.lessons.pcb.params>).signalNoise;expect(()=>parseStore(JSON.stringify(old))).toThrow();for(const [id,params] of [['debounce',{pressTime:Infinity}],['opamp',{outputLimit:0}],['spi',{sampleEdge:2}]] as const)expect(()=>validateParams(id,{...defaultParams(id),...params})).toThrow();});
 it('keeps every visible preset within the model and half-step budget',()=>{for(const id of ['debounce','opamp','spi'] as const)for(const c of extraControls[id]!)for(const [value] of c.options){const m=makeCircuit({lesson:id,params:{...defaultParams(id),[c.key]:value},diagnostic:false,variant:0,halfStep:true});expect(m.duration/m.step).toBeLessThan(100000);}const m=makeCircuit({lesson:'spi',params:{...defaultParams('spi'),capacitance:100e-12,clockFrequency:500000},diagnostic:false,variant:0,halfStep:true});expect(m.duration/m.step).toBeLessThan(100000);});
});
