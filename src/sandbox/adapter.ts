export type SandboxStatus={running:boolean;time:number;error:string;needsReset:boolean;message:string;elements:number;scopes:number};
export type SandboxRequest={action:string;text?:string};
export type SandboxBridge={version:1;status():SandboxStatus;snapshot():string;flush():string;load(text:string):SandboxStatus&{circuit:string};pause():void;run():SandboxStatus;restart():SandboxStatus;onchange:((value:{circuit:string;needsReset:boolean})=>void)|null;onrequest:((value:SandboxRequest)=>void)|null};
export class SandboxSession {
  readonly frame:HTMLIFrameElement;
  bridge!:SandboxBridge;
  private disposed=false;
  constructor(private host:HTMLElement) {
    this.frame=document.createElement('iframe');this.frame.title='自由电路编辑器';this.frame.className='sandbox-frame pending';
  }
  async load(text:string) {
    const query=new URLSearchParams({sandbox:'1',editable:'true',running:'false',hideSidebar:'false',hideMenu:'false',lang:'zh',whiteBackground:'true',conventionalCurrent:'true',cct:'$ 1 0.00001 10 50 3.3 50 0.000000625'});
    this.frame.src='/vendor/circuitjs/circuitjs.html?'+query;this.host.appendChild(this.frame);
    await new Promise<void>((resolve,reject)=>{
      const started=performance.now();const timer=setInterval(()=>{
        if(this.disposed){clearInterval(timer);reject(new Error('载入已取消'));return;}
        const bridge=(this.frame.contentWindow as (Window&{CircuitSandbox?:SandboxBridge})|null)?.CircuitSandbox;
        if(bridge?.version===1){clearInterval(timer);this.bridge=bridge;resolve();}
        else if(performance.now()-started>10000){clearInterval(timer);reject(new Error('编辑器载入超时，请重试'));}
      },25);
    });
    return this.bridge.load(text);
  }
  show(){this.frame.classList.remove('pending');}
  dispose(){this.disposed=true;if(this.bridge){this.bridge.onchange=null;this.bridge.onrequest=null;this.bridge.pause();}this.frame.remove();}
}
