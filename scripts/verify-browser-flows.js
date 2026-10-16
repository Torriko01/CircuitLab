async (page) => {
  const results=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const snapshot=async()=>page.locator('body').ariaSnapshot();
  const ready=async()=>{await page.locator('.run-actions span').filter({hasText:'已捕获'}).waitFor();if(await page.locator('.engine-error').count())throw new Error(await page.locator('.engine-error').innerText());};
  const select=async(name,value)=>{await page.getByRole('combobox',{name,exact:true}).selectOption(value);};
  const save=async()=>page.getByRole('button',{name:'＋ 测量并保存证据',exact:true}).click();
  const voltage=async(node)=>{await select('测量类型','voltage');await select('红表笔（正端）',node);await select('黑表笔（参考端）','GND');await save();};
  const selectJudgment=async(c)=>{for(const text of c)await page.getByRole('radio',{name:text,exact:true}).check();};
  const cases=[
    {id:'gpio',menu:/GPIO 的真实引脚 25 分钟/,prediction:'不能，释放不等于主动驱高',
     answers:[['实际为开漏释放，缺少外部上拉','VDD 正常，移除负载且不加测试上拉后 PIN 仍低，支持未主动驱高','核对引脚模式和上拉，查接收门限，再验证高低态电流'],['实际为推挽高，但外部负载过重','VDD 正常，移除负载后 PIN 恢复，支持带载压降','减轻负载或增加合适驱动级，核对 VOH/VOL 与电流条件']],
     transfers:['不能，保证值没有足够裕量，应查全工作条件','输入钳位/反灌路径、掉电容忍及允许电流']},
    {id:'power',menu:/供电瞬态与去耦 30 分钟/,prediction:'短时跌落变慢，但长期稳态压降不会因此消失',
     answers:[['供电路径电阻偏大','入口正常，持续负载下芯片端压降仍明显偏大，支持路径阻抗问题','检查供电线缆/连接器及回路，减小路径压降后复测负载瞬态'],['局部电容比标称小，负载边沿跌落更快','入口正常，持续负载稳态符合标称路径，但短脉冲下跌更快，支持电容量偏小','核对电容量与连接路径，再按目标器件启动/稳定性要求验证']],
     transfers:['不能；最终 VMCU≈3.3×41/43≈3.147 V','核对探头参考和触发，检查芯片端瞬态及真实 BOR 条件']},
    {id:'adc',menu:/ADC 的采样与参考 30 分钟/,prediction:'可能未充分建立，保持电压与数字码偏低',
     answers:[['源阻抗偏高，采样窗口内未充分建立','输入正常、参考 3.3 V；由 5 µs 延长至 20 µs，保持电压明显恢复','按目标 ADC 手册增加采样时间或降低源阻抗，复测通道切换与误差'],['实际参考为 3.6 V，软件却按 3.3 V 换算','输入与保持电压正常；延长采样仍有比例偏差，测得实际 VREF 为 3.6 V','核对参考源与软件换算，检查参考去耦和工作范围']],
     transfers:['约 41 LSB，不能因为曲线接近终值就认为足够','保持值来不及下降而偏高；应查通道顺序与建立时间']}
  ];
  for(const c of cases){
    await snapshot();await page.getByRole('button',{name:c.menu}).click();await snapshot();
    await page.getByRole('button',{name:'↺ 重新学习',exact:true}).click();await snapshot();
    await page.getByRole('button',{name:'开始，先做预测 →',exact:true}).click();await snapshot();
    await page.getByRole('radio',{name:c.prediction,exact:true}).check();await page.getByRole('button',{name:'提交预测，开始实验 →',exact:true}).click();await ready();await snapshot();
    const metrics=await page.locator('.metrics').innerText();
    await select('测量目的','distinguish');await save();await page.getByRole('button',{name:'进入故障诊断 →',exact:true}).click();await ready();await snapshot();
    for(const variant of [0,1]){
      if(variant){await page.getByRole('button',{name:'B',exact:true}).click();await ready();await snapshot();}
      // Deliberately incomplete evidence must not receive full analysis credit.
      if(c.id==='gpio')await voltage('PIN');
      if(c.id==='power'){await select('测量类型','minimum');await save();}
      if(c.id==='adc'){await select('测量类型','held');await save();}
      await page.getByRole('button',{name:'整理证据，提交判断 →',exact:true}).click();await snapshot();
      await selectJudgment(c.answers[variant]);await page.getByRole('button',{name:'提交判断',exact:true}).click();
      const insufficient=await page.locator('.feedback').innerText();if(!insufficient.includes('继续完善证据链'))throw new Error(c.id+' accepted insufficient evidence');
      await page.getByRole('button',{name:'← 返回补充证据',exact:true}).click();await snapshot();
      if(c.id==='gpio'){
        await voltage('VDD');await page.getByRole('checkbox',{name:'接入外部负载',exact:true}).uncheck();await ready();await voltage('PIN');
      } else if(c.id==='power'){
        await voltage('VIN');await select('负载导通时间','0');await ready();await select('测量类型','minimum');await save();
      }else{
        await voltage('VIN');await voltage('VREF');await select('采样窗口','0.00002');await ready();await select('测量类型','held');await save();
      }
      await page.getByRole('button',{name:'整理证据，提交判断 →',exact:true}).click();await snapshot();
      await selectJudgment(c.answers[variant]);await page.getByRole('button',{name:'提交判断',exact:true}).click();
      const feedback=await page.locator('.feedback').innerText();if(!feedback.includes('8 / 8 · 已形成有效分析'))throw new Error(c.id+' did not grade full proof: '+feedback);
      results.push({lesson:c.id,variant,insufficientRejected:true,feedback,metrics});
      if(variant===0){await page.getByRole('button',{name:'← 返回补充证据',exact:true}).click();await snapshot();}
    }
    await page.getByRole('button',{name:'进入迁移检查 →',exact:true}).click();await snapshot();
    for(const t of c.transfers)await page.getByRole('radio',{name:t,exact:true}).check();
    await page.getByRole('button',{name:'提交迁移检查',exact:true}).click();if(await page.locator('.answer-note.correct').count()!==2)throw new Error(c.id+' transfer failed');
    await page.getByRole('button',{name:'整理复盘 →',exact:true}).click();await snapshot();await page.getByRole('textbox').fill('先验证参考与输入，再用受控操作区分原因，修复后复测。');
    await page.getByRole('button',{name:'保存复盘，完成本次学习',exact:true}).click();
    await page.reload();await snapshot();if(!await page.getByRole('button',{name:'✓ 复盘已保存',exact:true}).isVisible())throw new Error(c.id+' reload persistence failed');
  }
  const report={at:new Date().toISOString(),url:page.url(),browser:await page.evaluate(()=>navigator.userAgent),results,pageErrors:errors};
  const pending=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.download='flows.json';a.click();},report);await(await pending).saveAs('docs/扩展实验流程核验-v0.2.json');
  return {variants:results.length,insufficientRejected:results.every(r=>r.insufficientRejected),pageErrors:errors};
}
