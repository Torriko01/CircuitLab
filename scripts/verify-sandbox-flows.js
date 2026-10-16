async(page)=>{
 await page.bringToFront();const checks=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw new Error(name+' '+JSON.stringify(detail));};
 const snap=()=>page.locator('body').ariaSnapshot();
 const ready=()=>page.waitForFunction(()=>document.querySelector('.sandbox-engine')?.getAttribute('aria-busy')==='false'&&document.querySelector('iframe.sandbox-frame:not(.pending)')?.contentWindow.CircuitSandbox);
 const frame=()=>page.frameLocator('iframe.sandbox-frame:not(.pending)');
 const status=()=>page.locator('iframe.sandbox-frame:not(.pending)').evaluate(f=>f.contentWindow.CircuitSandbox.status());
 const saved=()=>page.locator('.sandbox-save-state').filter({hasText:'已保存到本机'}).waitFor();
 const save=async()=>{await page.getByRole('button',{name:'保存到本机',exact:true}).click();await saved();};
 const create=async(name)=>{await snap();await page.getByRole('button',{name:new RegExp('＋ '+name)}).click();await ready();await snap();};
 const drag=async(tool,from,to,value)=>{
  await snap();await frame().locator(`[title="${tool}"]:visible`).click();const box=await page.locator('iframe.sandbox-frame:not(.pending)').boundingBox();
  await page.mouse.move(box.x+from[0],box.y+from[1]);await page.mouse.down();await page.mouse.move(box.x+to[0],box.y+to[1],{steps:10});await page.mouse.up();await snap();
  if(value!==undefined){await frame().getByRole('dialog').getByRole('textbox').first().fill(value);await frame().getByRole('button',{name:'确定',exact:true}).click();await snap();}
  await page.keyboard.press('Escape');
 };
 await snap();if(!await page.getByRole('heading',{name:'自由实验室',exact:true}).count())await page.getByRole('button',{name:'⌘ 自由实验室',exact:true}).click();
 await create('空白电路');await page.getByLabel('项目名称',{exact:true}).fill('手绘分压 · 浏览器验收');
 await page.locator('.sandbox-engine').scrollIntoViewIfNeeded();
 await drag('添加直流电压源(二端口)',[192,320],[192,144],'3.3');
 await drag('添加电阻器',[192,144],[400,144],'10k');
 await drag('添加电阻器',[400,144],[400,320],'10k');
 await drag('添加导线',[400,320],[192,320]);
 await drag('添加接地',[192,320],[192,352]);
 check('mouse draws complete circuit',(await status()).elements===5,await status());
 await page.getByRole('button',{name:'↻ 重新开始',exact:true}).click();await page.waitForFunction(()=>document.querySelector('iframe.sandbox-frame:not(.pending)').contentWindow.CircuitSandbox.status().time>.001);
 await page.getByRole('button',{name:'Ⅱ 暂停',exact:true}).click();
 let measured=await page.locator('iframe.sandbox-frame:not(.pending)').evaluate(f=>{const a=f.contentWindow.CircuitJS1;return a.getElements().map(e=>({type:e.getType(),voltage:e.getVoltageDiff(),current:e.getCurrent()}));});
 check('hand-wired divider voltage and current',Math.abs(measured[2].voltage-1.65)<1e-8&&Math.abs(measured[2].current-.000165)<1e-10,measured);
 await page.getByLabel('分析的问题',{exact:true}).fill('一个回路中，两只相同电阻如何分压？');await page.getByLabel('我的预测',{exact:true}).fill('3.3 V 输入，输出应为 1.65 V');await save();
 const before=await status();await page.getByRole('button',{name:'▶ 运行 / 继续',exact:true}).click();await page.waitForFunction(t=>document.querySelector('iframe.sandbox-frame:not(.pending)').contentWindow.CircuitSandbox.status().time>t,before.time);await page.getByRole('button',{name:'Ⅱ 暂停',exact:true}).click();
 check('pause continue keeps run identity and time',(await status()).runId===before.runId&&(await status()).time>before.time,{before,after:await status()});
 await page.locator('.sandbox-engine').scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/沙盒手绘分压-v0.5.png'});
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'↓ 下载项目',exact:true}).click();await(await pending).saveAs('output/playwright/sandbox-project-roundtrip.json');
 await save();await page.reload();await ready();await snap();check('refresh restores design and notes paused',(await status()).elements===5&&(await status()).time===0&&!(await status()).running&&await page.getByLabel('我的预测',{exact:true}).inputValue()==='3.3 V 输入，输出应为 1.65 V',await status());
 await page.getByLabel('导入沙盒项目文件',{exact:true}).setInputFiles('output/playwright/sandbox-project-roundtrip.json');await ready();await page.waitForFunction(()=>document.querySelector('input[aria-label="项目名称"]').value.includes('导入副本'));await snap();check('import creates copy without replacing original',await page.locator('.sandbox-project-list li').count()>=2&&await page.getByLabel('项目名称',{exact:true}).inputValue()==='手绘分压 · 浏览器验收 · 导入副本');
 const originalName=await page.getByLabel('项目名称',{exact:true}).inputValue();await page.getByLabel('导入沙盒项目文件',{exact:true}).setInputFiles({name:'invalid.xml',mimeType:'application/xml',buffer:Buffer.from('<cir><unknown x="0 0 64 0"/></cir>')});await page.getByRole('alert').filter({hasText:'载入失败'}).waitFor();check('bad import preserves active design',await page.getByLabel('项目名称',{exact:true}).inputValue()===originalName&&(await status()).elements===5);
 await create('分压与负载');await page.locator('.sandbox-engine').scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/sandbox-divider-template.png'});
 const report={version:'0.5',at:new Date().toISOString(),browser:await page.evaluate(()=>navigator.userAgent),checks,pageErrors:errors};
 const download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)]));a.download='sandbox-flows.json';a.click();},report);await(await download).saveAs(report.browser.includes('Chrome')?'docs/沙盒流程核验-v0.5.json':'docs/沙盒WebKit流程核验-v0.5.json');return {checks:checks.length,passed:checks.every(c=>c.pass),errors};
}
