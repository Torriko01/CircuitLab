async(page)=>{
 const engine=await page.context().newPage();
 await engine.addInitScript(()=>{const log=console.log;window.startupDiagnostics=[];console.log=(...args)=>{if(String(args[0]).includes('failed to create'))window.startupDiagnostics.push({message:String(args[0]),stack:new Error().stack});log(...args);};});
 await engine.goto(new URL('/vendor/circuitjs/circuitjs.html?sandbox=1&editable=true&running=false&lang=zh&cct=%24%201%200.00001%2010%2050%203.3%2050%200.000000625',page.url()).href);
 await engine.waitForFunction(()=>!!window.CircuitSandbox);
 const result=await engine.evaluate(async()=>{
  const b=window.CircuitSandbox,api=window.CircuitJS1,checks=[],runs=[];
  const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw new Error(name+' '+JSON.stringify(detail));};
  const header=dt=>`$ 1 ${dt} 10 50 3.3 50 ${dt/16}`;
  const base=(kind='r',value='10000',extra='',dt=1e-5)=>[header(dt),'v 128 288 128 128 0 0 40 3.3 0 0 0.5','r 128 128 320 128 0 10000',`${kind} 320 128 320 288 0 ${value}`,'w 128 288 320 288 0','g 128 288 128 320 0','207 128 128 80 128 4 VIN','207 320 128 320 80 4 VOUT',extra].filter(Boolean).join('\n');
  async function capture(text,end){b.load(text);const started=performance.now();return await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{api.setSimRunning(false);api.ontimestep=null;reject(new Error('capture timeout '+JSON.stringify(b.status())));},6000);api.ontimestep=()=>{if(api.getTime()>=end){api.setSimRunning(false);api.ontimestep=null;clearTimeout(timeout);const sample={t:api.getTime(),vin:api.getNodeVoltage('VIN'),vout:api.getNodeVoltage('VOUT'),currents:api.getElements().map(e=>e.getCurrent()),elapsedMs:performance.now()-started,document:b.snapshot()};runs.push(sample);resolve(sample);}};b.run();});}
  let sample=await capture(base(),.001);
  check('divider voltage',Math.abs(sample.vout-1.65)<1e-9,sample.vout);
  check('divider currents',Math.abs(sample.currents[1]-.000165)<1e-12&&Math.abs(sample.currents[2]-.000165)<1e-12,sample.currents.slice(0,3));
  const xml=sample.document;b.load(xml);check('reopen paused at time zero',!b.status().running&&b.status().time===0,b.status());sample=await capture(xml,.001);check('XML divider roundtrip',Math.abs(sample.vout-1.65)<1e-9,sample.vout);
  sample=await capture(base('r','10000','r 320 128 320 288 0 10000'),.001);check('loaded divider',Math.abs(sample.vout-1.1)<1e-9,sample.vout);
  const rc=base('c','0.000001 0 0','o 2 64 0 3 3.3 0.001');
  sample=await capture(rc,.01);const expected=3.3*(1-Math.exp(-sample.t/.01));check('RC at tau',Math.abs(sample.vout-expected)<.003,{actual:sample.vout,expected,t:sample.t});const rcVoltage=sample.vout;
  const saved=sample.document,doc=new DOMParser().parseFromString(saved,'text/xml');
  check('save excludes capacitor running voltage',!doc.querySelector('c').hasAttribute('vd')&&doc.querySelector('c').getAttribute('iv')==='0',saved);
  check('scope settings retained',doc.querySelectorAll('o').length===1,saved);
  const reopened=b.load(saved);check('RC reopen clears time and preserves scope',reopened.time===0&&!reopened.running&&reopened.scopes===1,reopened);
  sample=await capture(saved,.01);check('RC rerun reproducible',Math.abs(sample.vout-rcVoltage)<1e-9,{a:sample.vout,b:rcVoltage});
  sample=await capture(base('c','0.000001 0 0','',5e-6),.01);check('RC half-step stability',Math.abs(sample.vout-rcVoltage)<.002,{full:rcVoltage,half:sample.vout});
  sample=await capture(base('c','0.000001 1.2 1.2'),.01);check('explicit nonzero capacitor initial condition',Math.abs(sample.vout-(3.3+(1.2-3.3)*Math.exp(-sample.t/.01)))<.003,sample.vout);
  const rl=[header(1e-6),'v 128 288 128 128 0 0 40 3.3 0 0 0.5','r 128 128 320 128 0 100','l 320 128 320 288 0 .1 .002 .002','w 128 288 320 288 0','g 128 288 128 320 0','207 320 128 320 80 4 VOUT','207 128 128 80 128 4 VIN'].join('\n');
  sample=await capture(rl,.001);const currentExpected=.033+(.002-.033)*Math.exp(-sample.t/.001);check('RL explicit initial current',Math.abs(sample.currents[2]-currentExpected)<.00004,{actual:sample.currents[2],expected:currentExpected});
  const inductor=new DOMParser().parseFromString(sample.document,'text/xml').querySelector('l');check('save excludes inductor runtime state',!inductor.hasAttribute('i')&&inductor.getAttribute('ic')==='0.002',sample.document);
  const forward=await capture(base('d','.805904783','',1e-6),.0001);
  // Independently solve the declared generic model: Is=1.7143528192808883e-7 A,
  // n=2, Vt=.025865 V. A generic silicon "0.7 V" rule is not this model.
  let lo=0,hi=3.3;for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(1.7143528192808883e-7*Math.expm1(mid/(2*.025865))>(3.3-mid)/10000)hi=mid;else lo=mid;}
  const diodeExpected=(lo+hi)/2;
  check('diode forward model and KCL',Math.abs(forward.vout-diodeExpected)<1e-6&&Math.abs(forward.currents[2]-(3.3-forward.vout)/10000)<1e-9,{voltage:forward.vout,expected:diodeExpected,current:forward.currents[2]});
  const customDoc=new DOMParser().parseFromString(forward.document,'text/xml'),custom=customDoc.createElement('dm');
  for(const [key,value] of Object.entries({nm:'验收模型',is:'1e-9',n:'1.8',rs:'0',bv:'0',f:'0'}))custom.setAttribute(key,value);
  customDoc.documentElement.insertBefore(custom,customDoc.documentElement.firstChild);customDoc.querySelector('d').setAttribute('mo','验收模型');
  sample=await capture(new XMLSerializer().serializeToString(customDoc),.0001);lo=0;hi=3.3;for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(1e-9*Math.expm1(mid/(1.8*.025865))>(3.3-mid)/10000)hi=mid;else lo=mid;}
  check('custom diode model numerical reference',Math.abs(sample.vout-(lo+hi)/2)<1e-6,{actual:sample.vout,expected:(lo+hi)/2});
  const modelDoc=new DOMParser().parseFromString(sample.document,'text/xml');check('custom model definition and reference saved',modelDoc.querySelector('dm').getAttribute('nm')==='验收模型'&&modelDoc.querySelector('d').getAttribute('mo')==='验收模型');
  const customVoltage=sample.vout;sample=await capture(sample.document,.0001);check('custom model roundtrip keeps working point',Math.abs(sample.vout-customVoltage)<1e-9,{before:customVoltage,after:sample.vout});
  sample=await capture(base('d','.805904783','',1e-6).replace('40 3.3','40 -3.3'),.0001);check('diode reverse qualitative behavior',sample.vout< -3.2&&Math.abs(sample.currents[2])<1e-6,{voltage:sample.vout,current:sample.currents[2]});
  const bus=[header(5e-9),'v 128 288 128 128 0 0 40 3.3 0 0 .5','r 128 128 320 128 0 4700','c 320 128 320 288 0 1e-10 0 0','w 320 128 384 128 0','w 384 128 384 240 0','159 384 240 448 240 0 100 1000000000000 2.5','w 448 240 448 288 0','v 240 288 240 256 0 2 400000 2.5 2.5 0 .5','w 240 256 416 256 0','w 128 288 240 288 0','w 240 288 320 288 0','w 320 288 448 288 0','g 128 288 128 320 0','207 128 128 80 128 4 VIN','207 320 128 320 80 4 VOUT'].join('\n');
  sample=await capture(bus,.5e-6);check('open drain low level and sink current',Math.abs(sample.vout-.06875)<1e-5&&Math.abs(sample.currents[1]-.0006875)<1e-8,{voltage:sample.vout,current:sample.currents[1]});
  sample=await capture(bus,2.4e-6);const busExpected=3.3+(.06875-3.3)*Math.exp(-(sample.t-1.25e-6)/(4700*1e-10));check('open drain release',Math.abs(sample.vout-busExpected)<.01,{voltage:sample.vout,expected:busExpected,time:sample.t});
  const invalids=['<cir><r x="0 0 64 0" r="bad"/></cir>','<cir><unknown x="0 0 64 0"/></cir>','<cir><d x="0 0 64 0" mo="missing-model"/></cir>','<cir sublib="1"/>','<cir><r','garbage',header(0)+'\nr 0 0 64 0 0 10'];
  for(const text of invalids){let rejected=false;try{b.load(text);}catch{rejected=true;}check('invalid document rejected '+text.slice(0,45),rejected);}
  for(const size of [50,200]){const text=[header(1e-5),'g 0 0 0 32 0',...Array.from({length:size-1},(_,i)=>`r 0 0 ${(i+1)*16} 64 0 10000`)].join('\n');const started=performance.now();b.load(text);b.run();await new Promise(resolve=>setTimeout(resolve,100));b.pause();check('bounded graph '+size,b.status().elements===size&&!b.status().error,{size,elapsedMs:performance.now()-started});}
  b.load([header(1e-5),...Array.from({length:201},(_,i)=>`r ${i*16} 0 ${i*16} 64 0 10000`)].join('\n'));b.run();check('over-budget run refused',!b.status().running,b.status());
  b.load([header(1e-5),'v 0 64 0 0 0 0 40 3.3 0 0 .5','v 0 64 0 0 0 0 40 5 0 0 .5','g 0 64 0 96 0'].join('\n'));b.run();await new Promise(resolve=>setTimeout(resolve,100));check('ideal source preflight prevents hidden resistance',!!b.status().error&&!b.status().running&&!b.snapshot().includes('ir='),b.status());
  b.load([header(1e-5),'w 0 0 64 0 0','w 64 0 64 64 0','w 64 64 0 0 0','g 0 0 0 32 0'].join('\n'));b.run();await new Promise(resolve=>setTimeout(resolve,100));check('native wire loop error is exposed',!!b.status().error&&!b.status().running,b.status());
  return {version:'0.5',at:new Date().toISOString(),browser:navigator.userAgent,checks,runs:runs.map(({document,...s})=>s),startupDiagnostics:window.startupDiagnostics};
 });
 const pending=engine.waitForEvent('download');await engine.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)]));a.download='sandbox-engine.json';a.click();},result);await(await pending).saveAs(result.browser.includes('Chrome')?'docs/沙盒内核核验-v0.5.json':'docs/沙盒WebKit内核核验-v0.5.json');await engine.close();return {checks:result.checks.length,passed:result.checks.every(c=>c.pass),startupDiagnostics:result.startupDiagnostics};
}
