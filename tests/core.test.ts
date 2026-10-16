import { describe, expect, it } from 'vitest';
import { crossing, lowState, riseTime } from '../src/measurement';
import { defaultParams, makeCircuit, validateParams } from '../src/simulation/templates';
import { evaluate, freshStore, parseStore } from '../src/store';
import type { Evidence, Sample } from '../src/types';

describe('measurement correctness',()=>{
  it('interpolates a threshold using simulation time',()=>{
    const samples:Sample[]=[{t:1e-6,nodes:{BUS:0},currents:{}},{t:2e-6,nodes:{BUS:3.3},currents:{}}];
    expect(crossing(samples,'BUS',.99)).toBeCloseTo(1.3e-6,12);
    expect(crossing(samples,'BUS',4)).toBeNull();
  });
  it('never completes a rise measurement using the next release',()=>{
    const samples=[{t:0,nodes:{BUS:0,CTRL:5},currents:{}},{t:1,nodes:{BUS:.5,CTRL:0},currents:{}},{t:2,nodes:{BUS:1.5,CTRL:0},currents:{}},{t:3,nodes:{BUS:0,CTRL:5},currents:{}},{t:4,nodes:{BUS:3,CTRL:0},currents:{}}];
    const r=riseTime({id:'test',config:{lesson:'i2c',params:defaultParams('i2c'),diagnostic:false,variant:0},duration:5,status:'complete',elapsed:1,samples,step:.01});expect(r.value).toBeNull();expect(r.t70).toBeNull();
  });
  it('records the actual stable-low sample time',()=>{
    const r={id:'low',config:{lesson:'i2c' as const,params:defaultParams('i2c'),diagnostic:false,variant:0},duration:5e-6,status:'complete' as const,elapsed:1,step:5e-9,samples:[{t:1e-6,nodes:{BUS:.069,CTRL:5},currents:{RP:.0006875}}]};
    expect(lowState(r)?.t).toBe(1e-6);
  });
});
describe('bounded circuit inputs',()=>{
  it('rejects unsupported or nonfinite values',()=>{
    expect(()=>validateParams('i2c',{...defaultParams('i2c'),resistance:NaN})).toThrow();
    expect(()=>validateParams('rc',{...defaultParams('rc'),capacitance:1})).toThrow();
  });
  it('controls I²C resolution in seconds and preserves hidden values',()=>{
    const c=makeCircuit({lesson:'i2c',params:defaultParams('i2c'),diagnostic:true,variant:0});
    expect(c.step).toBeLessThanOrEqual(5e-9);expect(c.duration/c.step).toBeLessThan(100000);
    expect(c.text).toContain('0 9400');expect(c.text).toMatch(/^\$ 17 /);
  });
});
describe('learning records and evidence',()=>{
  it('roundtrips valid data and rejects damaged imports',()=>{
    const store=freshStore();expect(parseStore(JSON.stringify(store))).toEqual(store);
    expect(()=>parseStore('{')).toThrow();
    expect(()=>parseStore(JSON.stringify({...store,schemaVersion:999}))).toThrow();
    store.lessons.rc.params.resistance=-1;expect(()=>parseStore(JSON.stringify(store))).toThrow();
    expect(()=>parseStore(' '.repeat(1000001))).toThrow();
  });
  it('requires discriminating diagnostic evidence for full credit',()=>{
    const p=freshStore().lessons.divider;
    Object.assign(p,{cause:'r1',explanation:'ratio',remedy:'r1'});
    const evidence:Evidence={id:'e',runId:'r',lesson:'divider',variant:0,diagnostic:true,kind:'voltage',label:'V(VOUT) − V(GND)',value:1.1,unit:'V',status:'有效',purpose:'distinguish',simTime:.001,conditions:'模块已接入',createdAt:'2026-10-14'};
    p.evidence=[evidence];p.evidenceIds=['e'];expect(evaluate(p,{cause:'r1',explanation:'ratio'})[1]).toBe(1);
    evidence.conditions='模块已移除';expect(evaluate(p,{cause:'r1',explanation:'ratio'})).toEqual([2,2,2,2]);
    evidence.diagnostic=false;expect(evaluate(p,{cause:'r1',explanation:'ratio'})[1]).toBe(0);
  });
  it('does not grade evidence from a different variant',()=>{
    const p=freshStore().lessons.rc;
    p.evidence=[{id:'e',lesson:'rc',variant:1,diagnostic:true,kind:'peak',label:'峰值 VIN',value:1.8,status:'有效',purpose:'distinguish'} as Evidence];p.evidenceIds=['e'];
    expect(evaluate(p,{cause:'slow',explanation:'delay'})[1]).toBe(0);
  });
});
