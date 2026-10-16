async(page)=>{
 await page.goto(new URL('/probe.html',page.url()).href);await page.locator('body').ariaSnapshot();
 const results=[];
 for(const name of ['verifyEngine','verifyExtensions','verifyStages','verifySignals']){
  const report=await page.evaluate(async name=>{window.currentSuite=name;return window[name]();},name);
  const download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)]));a.download='course-regression.json';a.click();},report);
  await(await download).saveAs(`docs/课程回归-${name}-v0.5.json`);
  results.push({name,captures:report.captures,checks:report.checks,passed:report.passed});
  if(report.checks!==report.passed)throw new Error(name+' failed '+JSON.stringify(report.rows.filter(r=>!r.passed)));
 }
 return results;
}
