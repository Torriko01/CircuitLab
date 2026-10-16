async(page)=>{
 const checks=[],errors=[],outside=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname==='127.0.0.1')return route.continue();outside.push(u.href);return route.abort();});
 const assert=(name,passed)=>{checks.push({name,passed});if(!passed)throw new Error(name);};
 const snap=()=>page.locator('body').ariaSnapshot();
 const ready=()=>page.locator('.run-actions span').filter({hasText:'已捕获'}).waitFor();
 const select=(name,value)=>page.getByRole('combobox',{name,exact:true}).selectOption(value);
 const old=await page.evaluate(()=>{
  const key='circuit-intuition-lab-v1',s=JSON.parse(localStorage.getItem(key));
  const oldKeys=['resistance','load','connected','capacitance','pulse','frequency','drive','probe','probeCap','sampleTime','reference','initial'];
  const legacy={schemaVersion:2,lessonVersion:'0.2',selected:'adc',lessons:Object.fromEntries(['divider','rc','i2c','gpio','power','adc'].map(id=>[id,s.lessons[id]]))};
  for(const p of Object.values(legacy.lessons)){p.params=Object.fromEntries(oldKeys.map(k=>[k,p.params[k]]));p.evidence=[];p.evidenceIds=[];}
  Object.assign(legacy.lessons.adc,{phase:'review',completed:true,reflection:'先核对输入、采样时间和参考电压'});
  const raw=JSON.stringify(legacy);localStorage.setItem(key,raw);return raw;
 });
 await page.reload();await snap();
 const migrated=await page.evaluate(()=>({raw:localStorage.getItem('circuit-intuition-lab-v1'),backup:localStorage.getItem('circuit-intuition-lab-v1-v2-backup')}));
 const record=JSON.parse(migrated.raw);assert('schema-2 migration preserves old progress and backup',migrated.backup===old&&record.schemaVersion===3&&Object.keys(record.lessons).length===9&&record.lessons.adc.completed&&record.lessons.adc.reflection==='先核对输入、采样时间和参考电压');
 const exported=page.waitForEvent('download');await page.getByRole('button',{name:'↓ 导出学习记录',exact:true}).click();await(await exported).saveAs('output/playwright/record-v03.json');
 await page.getByLabel('导入学习记录文件',{exact:true}).setInputFiles('output/playwright/invalid-record.json');await page.getByRole('status').filter({hasText:'导入失败'}).waitFor();assert('invalid import preserves data',await page.evaluate(raw=>localStorage.getItem('circuit-intuition-lab-v1')===raw,migrated.raw));
 await page.getByLabel('导入学习记录文件',{exact:true}).setInputFiles('output/playwright/record-v03.json');await page.getByRole('status').filter({hasText:'已导入'}).waitFor();assert('schema-3 roundtrip',await page.evaluate(raw=>localStorage.getItem('circuit-intuition-lab-v1')===raw,migrated.raw));
 const enter=async(menu,prediction)=>{await snap();await page.getByRole('button',{name:menu}).click();await snap();await page.getByRole('button',{name:'↺ 重新学习',exact:true}).click();await snap();await page.getByRole('button',{name:'开始，先做预测 →',exact:true}).click();await snap();await page.getByRole('radio',{name:prediction,exact:true}).check();await page.getByRole('button',{name:'提交预测，开始实验 →',exact:true}).click();await ready();await snap();};
 await enter(/MOSFET 低侧驱动 30 分钟/,'下降，因为实际 VGS 降为 1.8 V');
 assert('MOSFET default VDS', (await page.locator('.metrics').innerText()).includes('0.1356 V'));await select('源极对 GND 电压','1.5');await ready();assert('MOSFET source reference changes VGS',(await page.locator('.metrics').innerText()).includes('1.8 V'));
 await enter(/感性负载与续流 30 分钟/,'电流衰减更快，开关节点承受更高电压');await select('续流吸收等效','24');await ready();assert('high clamp peak',(await page.locator('.metrics').innerText()).includes('36.5903 V'));assert('separate current trace',await page.getByRole('img',{name:'LCOIL 电流随时间变化的波形',exact:true}).isVisible());
 await enter(/PCB 回流与参考地 30 分钟/,'约 1.75 V');assert('shared return offset',(await page.locator('.metrics').innerText()).includes('0.119 V'));await select('传感器回流接法','1');await ready();assert('dedicated reference removes model offset',(await page.locator('.metrics').innerText()).includes('0 V'));await select('传感器自身同步变化','0.1');await ready();await page.getByRole('checkbox',{name:'接入外部负载',exact:true}).uncheck();await ready();assert('independent local sensor injection remains',(await page.locator('.metrics').innerText()).includes('1.75 V'));
 for(const width of [1280,1440]){await page.setViewportSize({width,height:1100});assert('no horizontal overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.getByRole('button',{name:'▷ 慢放已捕获波形',exact:true}).click();assert('playback works',await page.getByRole('button',{name:'Ⅱ 暂停回放',exact:true}).isVisible());await page.getByRole('button',{name:'Ⅱ 暂停回放',exact:true}).click();
 await select('传感器自身同步变化','0');await ready();await select('传感器回流接法','0');await ready();await page.getByRole('checkbox',{name:'接入外部负载',exact:true}).check();await ready();await snap();
 if(await page.getByRole('button',{name:'关闭通知',exact:true}).isVisible())await page.getByRole('button',{name:'关闭通知',exact:true}).click();
 await page.screenshot({path:'docs/PCB回流实验预览-v0.3.png',fullPage:true});
 await page.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='circuit-intuition-lab-v1')throw new DOMException('quota','QuotaExceededError');return window.originalSetItem.call(this,key,value);};});
 await page.getByRole('button',{name:/GPIO 的真实引脚 25 分钟/}).click();await snap();await page.locator('.storage-status').filter({hasText:'仅暂存内存'}).waitFor();assert('storage failure stays usable',await page.getByRole('button',{name:'↺ 重新学习',exact:true}).isVisible());
 const failExport=page.waitForEvent('download');await page.getByRole('button',{name:'↓ 导出学习记录',exact:true}).click();await(await failExport).saveAs('output/playwright/record-memory-v03.json');assert('memory export available',true);
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalSetItem;});await page.getByRole('button',{name:'▦ 实验总览',exact:true}).click();await snap();await page.locator('.storage-status').filter({hasText:'已保存到本机'}).waitFor();assert('storage recovers',true);assert('nine course cards',await page.locator('.lesson-card').count()===9);assert('no external runtime requests',outside.length===0);assert('no page errors',errors.length===0);
 const report={version:'0.3',at:new Date().toISOString(),url:page.url(),browser:await page.evaluate(()=>navigator.userAgent),checks,outside,pageErrors:errors};
 const pending=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)]));a.download='stage-production.json';a.click();},report);await(await pending).saveAs('docs/驱动与回流生产核验-v0.3.json');return {checks:checks.length,passed:checks.filter(c=>c.passed).length,pageErrors:errors};
}
