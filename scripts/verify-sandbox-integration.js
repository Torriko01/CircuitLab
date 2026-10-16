async(page)=>{
 const checks=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw new Error(name+' '+JSON.stringify(detail));};
 const snap=()=>page.locator('body').ariaSnapshot();
 const frame=()=>page.frameLocator('iframe.sandbox-frame:not(.pending)');
 const native=()=>page.locator('iframe.sandbox-frame:not(.pending)');
 const status=()=>native().evaluate(f=>f.contentWindow.CircuitSandbox.status());
 const ready=()=>page.waitForFunction(()=>document.querySelector('.sandbox-engine')?.getAttribute('aria-busy')==='false'&&document.querySelector('iframe.sandbox-frame:not(.pending)')?.contentWindow.CircuitSandbox);
 const save=async()=>{await page.getByRole('button',{name:'保存到本机',exact:true}).click();await page.locator('.sandbox-save-state').filter({hasText:'已保存到本机'}).waitFor();};
 const menu=async text=>{await frame().locator('body').ariaSnapshot();await frame().getByRole('menuitem',{name:/^文件/}).click();await frame().locator('body').ariaSnapshot();await frame().getByRole('listitem').filter({hasText:text}).click();await snap();};
 const xml=()=>native().evaluate(f=>f.contentWindow.CircuitSandbox.snapshot());
 await snap();if(!await page.getByRole('heading',{name:'自由实验室',exact:true}).count())await page.getByRole('button',{name:'⌘ 自由实验室',exact:true}).click();
 await page.getByRole('button',{name:/＋ 分压与负载/}).click();await ready();await snap();await page.locator('.sandbox-engine').scrollIntoViewIfNeeded();
 let box=await native().boundingBox();await page.mouse.click(box.x+449,box.y+311,{button:'right'});await frame().locator('body').ariaSnapshot();await frame().getByText('在新示波器中查看',{exact:true}).click();await save();
 const scopesBefore=await native().evaluate(f=>[...new DOMParser().parseFromString(f.contentWindow.CircuitSandbox.snapshot(),'text/xml').querySelectorAll('o')].map(e=>e.outerHTML));
 await page.reload();await ready();await snap();const scopesAfter=await native().evaluate(f=>[...new DOMParser().parseFromString(f.contentWindow.CircuitSandbox.snapshot(),'text/xml').querySelectorAll('o')].map(e=>e.outerHTML));
 check('native added scope configuration survives reopen',scopesBefore.length===2&&JSON.stringify(scopesBefore)===JSON.stringify(scopesAfter),{scopesBefore,scopesAfter});
 const name=await page.getByLabel('项目名称',{exact:true}).inputValue();await menu('从文本导入');await page.getByRole('dialog',{name:'粘贴电路文本'}).waitFor();await page.getByRole('button',{name:'取消',exact:true}).click();check('native text import delegates to host and cancel keeps project',await page.getByLabel('项目名称',{exact:true}).inputValue()===name&&(await status()).elements===19);
 let download=page.waitForEvent('download');await menu('另存为');let file=await download;check('native save exports project JSON',file.suggestedFilename().endsWith('.circuit.json'));await file.saveAs('output/playwright/native-menu-project.json');
 download=page.waitForEvent('download');await menu('作为文本导出');file=await download;check('native text export provides design XML',file.suggestedFilename().endsWith('.xml'));await file.saveAs('output/playwright/native-menu-design.xml');
 await menu('创建新的空白电路');await page.waitForFunction(()=>document.querySelector('iframe.sandbox-frame:not(.pending)')?.contentWindow.CircuitSandbox.status().elements===0);await ready();check('native new creates independent blank project',(await status()).elements===0&&await page.locator('.sandbox-project-list li').count()>=2);
 for(const lesson of [{menu:/01 分压与负载/,label:'R1 = R2',value:'100000'},{menu:/02 RC 与时间/,label:'电阻 R',value:'22000'},{menu:/03 I²C 的电气边界/,label:'上拉 RP',value:'10000'}]){
  await snap();await page.getByRole('button',{name:lesson.menu}).click();await page.getByRole('button',{name:'↺ 重新学习',exact:true}).click();await snap();await page.getByRole('button',{name:'开始，先做预测 →',exact:true}).click();await snap();await page.getByRole('radio').first().check();await page.getByRole('button',{name:'提交预测，开始实验 →',exact:true}).click();await page.locator('.run-actions span').filter({hasText:'已捕获'}).waitFor();await snap();
  await page.getByRole('combobox',{name:lesson.label,exact:true}).selectOption(lesson.value);await page.locator('.run-actions span').filter({hasText:'已捕获'}).waitFor();const before=await page.evaluate(()=>localStorage.getItem('circuit-intuition-lab-v1'));
  await page.getByRole('button',{name:'复制当前正常实验到自由实验室 →',exact:true}).click();await ready();await snap();
  const r=await native().evaluate(f=>new DOMParser().parseFromString(f.contentWindow.CircuitSandbox.snapshot(),'text/xml').querySelector('r').getAttribute('r'));
  check('course parameter copy '+lesson.label,r===lesson.value&&!(await status()).running&&(await status()).time===0,{r,status:await status()});
  await page.getByLabel('观察与下一步',{exact:true}).fill('沙盒编辑不改变课程记录');await save();check('sandbox copy and edits preserve course record '+lesson.label,await page.evaluate(raw=>localStorage.getItem('circuit-intuition-lab-v1')===raw,before));
 }
 await page.getByRole('button',{name:/01 分压与负载/}).click();await page.locator('.run-actions span').filter({hasText:'已捕获'}).waitFor();await snap();await page.getByRole('button',{name:'＋ 测量并保存证据',exact:true}).click();await page.getByRole('button',{name:'进入故障诊断 →',exact:true}).click();await page.locator('.run-actions span').filter({hasText:'已捕获'}).waitFor();check('diagnostic mode does not expose normal parameter copy',await page.getByRole('button',{name:'复制当前正常实验到自由实验室 →',exact:true}).count()===0);
 await page.getByRole('button',{name:'⌘ 自由实验室',exact:true}).click();await page.getByRole('button',{name:/＋ RC 与时间/}).click();await ready();await page.getByRole('button',{name:'▶ 运行 / 继续',exact:true}).click();await page.waitForFunction(()=>document.querySelector('iframe.sandbox-frame:not(.pending)').contentWindow.CircuitSandbox.status().time>.001);
 await page.getByRole('button',{name:'▦ 实验总览',exact:true}).click();await snap();await page.getByRole('button',{name:'⌘ 自由实验室',exact:true}).click();await ready();check('leave and reopen pauses at initial conditions',!(await status()).running&&(await status()).time===0,await status());
 check('zero uncaught page errors',errors.length===0,errors);
 const report={version:'0.5',at:new Date().toISOString(),url:page.url(),browser:await page.evaluate(()=>navigator.userAgent),checks,pageErrors:errors};download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)]));a.download='integration.json';a.click();},report);await(await download).saveAs('docs/沙盒菜单与课程集成核验-v0.5.json');return {checks:checks.length,passed:checks.every(c=>c.pass),errors};
}
