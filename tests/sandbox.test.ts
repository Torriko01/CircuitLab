import { describe,it,expect } from 'vitest';
import { importProject,newProject,parseProject,MAX_PROJECT_BYTES,templateCircuit } from '../src/sandbox/model';

describe('sandbox project boundaries',()=>{
  it('imports a project as an independent copy, preserving design and notes',()=>{
    const original=newProject('中文 & 电路',templateCircuit('rc'),'正常课程');original.revision=7;original.notes.prediction='先预测初始电压，再测建立时间';
    const raw=JSON.stringify(original),copy=importProject(raw);
    expect(copy.id).not.toBe(original.id);expect(copy.revision).toBe(0);expect(copy.circuit).toBe(original.circuit);expect(copy.notes).toEqual(original.notes);expect(JSON.stringify(original)).toBe(raw);
  });
  it('keeps course records out of the project store',()=>{expect(()=>parseProject('{"schemaVersion":4,"lessonVersion":"0.4"}')).toThrow('不是受支持');});
  it('rejects incompatible engines and invalid revision or note fields',()=>{
    const project=newProject('草稿',templateCircuit('blank'));
    expect(()=>parseProject(JSON.stringify({...project,engineRevision:'other'}))).toThrow('内核版本');
    expect(()=>parseProject(JSON.stringify({...project,revision:-1}))).toThrow('字段');
    expect(()=>parseProject(JSON.stringify({...project,notes:{question:'',prediction:'',observation:5}}))).toThrow('字段');
  });
  it('measures import size as UTF-8 bytes, not character count',()=>{expect(()=>importProject('中'.repeat(Math.ceil(MAX_PROJECT_BYTES/3)))).toThrow('1 MB');});
  it('does not mistake unsupported text for a native circuit',()=>{expect(()=>importProject('R1 in out 10k')).toThrow('CircuitJS');});
  it('copies normal lesson parameters without a diagnostic configuration',()=>{const text=templateCircuit('divider');expect(text).toContain('3.3');expect(text).toContain('o 2');expect(text).not.toContain('20000');});
});
