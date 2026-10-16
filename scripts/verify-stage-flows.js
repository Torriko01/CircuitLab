async (page) => {
 await page.evaluate(()=>localStorage.removeItem('circuit-intuition-lab-v1'));await page.reload();
 const results=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const snapshot=()=>page.locator('body').ariaSnapshot();
 const ready=async()=>{await page.locator('.run-actions span').filter({hasText:'已捕获'}).waitFor();if(await page.locator('.engine-error').count())throw new Error(await page.locator('.engine-error').innerText());};
 const select=(name,value)=>page.getByRole('combobox',{name,exact:true}).selectOption(value);
 const save=()=>page.getByRole('button',{name:'＋ 测量并保存证据',exact:true}).click();
 const voltage=async(positive,negative='GND')=>{await select('测量类型','voltage');await select('红表笔（正端）',positive);await select('黑表笔（参考端）',negative);await save();};
 const cases=await page.evaluate(()=>import('/src/stageContent.ts').then(m=>m.stageLessons));
 for(const c of cases){
  await snapshot();await page.getByRole('button',{name:new RegExp(c.title+' '+c.time)}).click();await snapshot();await page.getByRole('button',{name:'↺ 重新学习',exact:true}).click();await snapshot();
  await page.getByRole('button',{name:'开始，先做预测 →',exact:true}).click();await snapshot();await page.getByRole('radio',{name:c.predictions.find(o=>o.id===c.predictionAnswer).text,exact:true}).check();await page.getByRole('button',{name:'提交预测，开始实验 →',exact:true}).click();await ready();await snapshot();
  const metrics=await page.locator('.metrics').innerText();await select('测量目的','distinguish');await save();
  if(c.id==='pcb'){await select('传感器回流接法','1');await ready();await snapshot();await page.screenshot({path:'output/playwright/PCB独立回流-v0.3.png',fullPage:true});await select('传感器回流接法','0');await ready();}
  if(c.id==='flyback')await page.screenshot({path:'output/playwright/感性负载预览-v0.3.png',fullPage:true});
  if(c.id==='mosfet')await page.screenshot({path:'output/playwright/MOSFET预览-v0.3.png',fullPage:true});
  await page.getByRole('button',{name:'进入故障诊断 →',exact:true}).click();await ready();await snapshot();
  for(const variant of [0,1]){
   if(variant){await page.getByRole('button',{name:'B',exact:true}).click();await ready();await snapshot();}
   await select('测量类型','voltage');await save();
   const judgment=async()=>{for(const [key,answer] of [['causes',c.answers[variant]],['explanations',c.interpretationAnswers[variant]],['remedies',c.answers[variant]]])await page.getByRole('radio',{name:c[key].find(o=>o.id===answer).text,exact:true}).check();await page.getByRole('button',{name:'提交判断',exact:true}).click();};
   await page.getByRole('button',{name:'整理证据，提交判断 →',exact:true}).click();await snapshot();await judgment();if(!(await page.locator('.feedback').innerText()).includes('继续完善证据链'))throw new Error(c.id+' accepted incomplete evidence');
   await page.getByRole('button',{name:'← 返回补充证据',exact:true}).click();await snapshot();
   if(c.id==='mosfet'){await voltage('GATE','SOURCE');await voltage('DRAIN','SOURCE');await voltage('VIN','VLOAD');}
   else if(c.id==='pcb'){await voltage('SIG','SGND');await voltage('SGND');await voltage('SIG');}
   else{await voltage('VIN');await select('测量类型','peak');await select('峰值节点','SW');await save();await select('测量类型','decay');await save();}
   await page.getByRole('button',{name:'整理证据，提交判断 →',exact:true}).click();await snapshot();await judgment();const feedback=await page.locator('.feedback').innerText();if(!feedback.includes('8 / 8 · 已形成有效分析'))throw new Error(c.id+' did not accept complete evidence: '+feedback);
   results.push({lesson:c.id,variant,insufficientRejected:true,score:8,metrics});if(variant===0){await page.getByRole('button',{name:'← 返回补充证据',exact:true}).click();await snapshot();}
  }
  await page.getByRole('button',{name:'进入迁移检查 →',exact:true}).click();await snapshot();for(const q of c.transfers)await page.getByRole('radio',{name:q.options.find(o=>o.id===q.answer).text,exact:true}).check();await page.getByRole('button',{name:'提交迁移检查',exact:true}).click();if(await page.locator('.answer-note.correct').count()!==2)throw new Error(c.id+' transfer failed');
  await page.getByRole('button',{name:'整理复盘 →',exact:true}).click();await snapshot();await page.getByRole('textbox').fill('先明确参考点与闭合路径，再联合电压和电流取证，改动后复测。');await page.getByRole('button',{name:'保存复盘，完成本次学习',exact:true}).click();await page.reload();await snapshot();if(!await page.getByRole('button',{name:'✓ 复盘已保存',exact:true}).isVisible())throw new Error(c.id+' persistence failed');
 }
 const report={version:'0.3',at:new Date().toISOString(),browser:await page.evaluate(()=>navigator.userAgent),results,pageErrors:errors};
 const pending=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)]));a.download='stage-flows.json';a.click();},report);await(await pending).saveAs(report.browser.includes('Chrome')?'docs/驱动与回流流程核验-v0.3.json':'docs/驱动与回流WebKit核验-v0.3.json');
 return {variants:results.length,insufficientRejected:results.every(r=>r.insufficientRejected),pageErrors:errors};
}
