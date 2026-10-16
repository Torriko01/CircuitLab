import { parseProject, type SandboxProject } from './model';

const DB='circuit-intuition-sandbox-v1',TABLE='projects';
export class ProjectConflict extends Error {constructor(){super('此项目已在另一个窗口修改或删除。当前编辑仍在内存，请另存副本或载入磁盘版本。');}}
export class ProjectStore {
  private connection:Promise<IDBDatabase>|null=null;
  private open():Promise<IDBDatabase> {
    if(this.connection)return this.connection;
    this.connection=new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB,1);
      const timeout=setTimeout(()=>reject(new Error('本机项目库打开超时，请关闭其他旧页面后重试')),5000);
      request.onupgradeneeded=()=>request.result.createObjectStore(TABLE,{keyPath:'id'});
      request.onsuccess=()=>{clearTimeout(timeout);const db=request.result;db.onversionchange=()=>{db.close();this.connection=null;};resolve(db);};
      request.onerror=()=>{clearTimeout(timeout);reject(request.error??new Error('本机项目库不可用'));};
      request.onblocked=()=>{clearTimeout(timeout);reject(new Error('项目库升级被其他页面阻止，请关闭旧页面后重试'));};
    });
    this.connection.catch(()=>{this.connection=null;});return this.connection;
  }
  async list():Promise<SandboxProject[]> {
    const db=await this.open();
    return new Promise((resolve,reject)=>{const tx=db.transaction(TABLE,'readonly'),r=tx.objectStore(TABLE).getAll();r.onsuccess=()=>{try{resolve(r.result.map(x=>parseProject(JSON.stringify(x))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));}catch(e){reject(e);}};r.onerror=()=>reject(r.error);});
  }
  async save(project:SandboxProject):Promise<SandboxProject> {
    const snapshot=parseProject(JSON.stringify(project));
    const db=await this.open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(TABLE,'readwrite'),store=tx.objectStore(TABLE);let conflict=false;let failure:unknown;
      const read=store.get(snapshot.id);
      read.onsuccess=()=>{
        const current=read.result as SandboxProject|undefined;
        if((current?.revision??0)!==snapshot.revision || (!current&&snapshot.revision!==0)){conflict=true;tx.abort();return;}
        snapshot.revision++;snapshot.updatedAt=new Date().toISOString();try{store.put(snapshot);}catch(e){failure=e;tx.abort();}
      };
      tx.oncomplete=()=>resolve(snapshot);
      tx.onabort=()=>reject(conflict?new ProjectConflict():failure??tx.error??new Error('项目未写入本机，请导出备份'));
      tx.onerror=()=>{};
    });
  }
  async remove(project:SandboxProject):Promise<void> {
    const db=await this.open();
    return new Promise((resolve,reject)=>{const tx=db.transaction(TABLE,'readwrite'),s=tx.objectStore(TABLE);let conflict=false;const r=s.get(project.id);r.onsuccess=()=>{if(r.result&&r.result.revision!==project.revision){conflict=true;tx.abort();}else s.delete(project.id);};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(conflict?new ProjectConflict():tx.error);tx.onerror=()=>{};});
  }
}
