async(page)=>{
 await page.evaluate(()=>localStorage.removeItem('circuit-intuition-lab-v1'));await page.reload();
 const results=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const snap=()=>page.locator('body').ariaSnapshot();
 const ready=async()=>{await page.locator('.run-actions span').filter({hasText:'已捕获'}).waitFor();if(await page.locator('.engine-error').count())throw new Error(await page.locator('.engine-error').innerText());};
 const select=(name,value)=>page.getByRole('combobox',{name,exact:true}).selectOption(value);
 const save=()=>page.getByRole('button',{name:'＋ 测量并保存证据',exact:true}).click();
 const voltage=async(a,b='GND')=>{await select('测量类型','voltage');await select('红表笔（正端）',a);await select('黑表笔（参考端）',b);await save();};
 const cases=await page.evaluate(()=>import('/src/signalContent.ts').then(m=>m.signalLessons));
 for(const c of cases){
  await snap();await page.getByRole('button',{name:new RegExp(c.title+' '+c.time)}).click();await snap();await page.getByRole('button',{name:'开始，先做预测 →',exact:true}).click();await snap();await page.getByRole('radio',{name:c.predictions.find(o=>o.id===c.predictionAnswer).text,exact:true}).check();await page.getByRole('button',{name:'提交预测，开始实验 →',exact:true}).click();await ready();await snap();
  const metrics=await page.locator('.metrics').innerText();await select('测量目的','distinguish');await save();
  if(c.id==='debounce'){await select('输入情境','1');await ready();await select('接收门限','0');await ready();await snap();await select('输入情境','0');await ready();await select('接收门限','1');await ready();}
  await page.getByRole('button',{name:'进入故障诊断 →',exact:true}).click();await ready();await snap();
  for(const variant of [0,1]){
   if(variant){await page.getByRole('button',{name:'B',exact:true}).click();await ready();await snap();}
   await select('测量类型','voltage');await save();
   const judge=async()=>{for(const [key,answer] of [['causes',c.answers[variant]],['explanations',c.interpretationAnswers[variant]],['remedies',c.answers[variant]]])await page.getByRole('radio',{name:c[key].find(o=>o.id===answer).text,exact:true}).check();await page.getByRole('button',{name:'提交判断',exact:true}).click();};
   await page.getByRole('button',{name:'整理证据，提交判断 →',exact:true}).click();await snap();await judge();if(!(await page.locator('.feedback').innerText()).includes('继续完善证据链'))throw new Error(c.id+' accepted insufficient proof');
   await page.getByRole('button',{name:'← 返回补充证据',exact:true}).click();await snap();
   if(c.id==='debounce'){await select('测量类型','edges');for(const n of ['RAW','OUT']){await select('计数节点',n);await save();}await select('测量类型','peak');await select('峰值节点','FILTER');await save();}
   else if(c.id==='opamp'){await voltage('VIN');await voltage('VOUT');await voltage('PLUS','FB');await select('已知输入电压','0.4');await ready();await voltage('VOUT');}
   else for(const kind of ['rise','aperture','violations']){await select('测量类型',kind);await save();}
   await page.getByRole('button',{name:'整理证据，提交判断 →',exact:true}).click();await snap();await judge();const feedback=await page.locator('.feedback').innerText();if(!feedback.includes('8 / 8 · 已形成有效分析'))throw new Error(c.id+' rejected full proof: '+feedback);
   results.push({lesson:c.id,variant,insufficientRejected:true,score:8,metrics});
   if(variant===0){await page.getByRole('button',{name:'← 返回补充证据',exact:true}).click();await snap();}
  }
  await page.getByRole('button',{name:'进入迁移检查 →',exact:true}).click();await snap();for(const q of c.transfers)await page.getByRole('radio',{name:q.options.find(o=>o.id===q.answer).text,exact:true}).check();await page.getByRole('button',{name:'提交迁移检查',exact:true}).click();if(await page.locator('.answer-note.correct').count()!==2)throw new Error(c.id+' transfer failed');
  await page.getByRole('button',{name:'整理复盘 →',exact:true}).click();await snap();await page.getByRole('textbox').fill('先测输入与参考，再核对时间窗口和线性条件，用两组受控条件验证原因，修复后复测。');await page.getByRole('button',{name:'保存复盘，完成本次学习',exact:true}).click();await page.reload();await snap();if(!await page.getByRole('button',{name:'✓ 复盘已保存',exact:true}).isVisible())throw new Error(c.id+' persistence failed');
 }
 const report={version:'0.4',at:new Date().toISOString(),browser:await page.evaluate(()=>navigator.userAgent),results,pageErrors:errors};
 const pending=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)]));a.download='signal-flows.json';a.click();},report);await(await pending).saveAs(report.browser.includes('Chrome')?'docs/信号调理与采样流程核验-v0.4.json':'docs/信号调理与采样WebKit核验-v0.4.json');return {variants:results.length,insufficientRejected:results.every(r=>r.insufficientRejected),pageErrors:errors};
}
