async(page)=>{
 await page.goto(new URL('/vendor/circuitjs/circuitjs.html?sandbox=1&editable=true&running=false&lang=zh',page.url()).href);await page.waitForFunction(()=>window.CircuitSandbox);await page.locator('body').ariaSnapshot();
 const start=Date.now();await page.evaluate(()=>{window.CircuitSandbox.load('$ 1 .00001 10 50 3.3 50 .000000625\nv 0 64 0 0 0 0 40 3.3 0 0 .5\nr 0 0 128 0 0 10000\nr 128 0 128 64 0 10000\nw 128 64 0 64 0\ng 0 64 0 96 0');window.CircuitSandbox.run();});
 await page.waitForFunction(()=>!window.CircuitSandbox.status().running&&window.CircuitSandbox.status().message.includes('60 秒'),null,{timeout:66000});
 const state=await page.evaluate(()=>window.CircuitSandbox.status()),elapsed=Date.now()-start;if(elapsed<60000||elapsed>66000)throw new Error('wall budget '+elapsed);
 const resumed=await page.evaluate(()=>{window.CircuitSandbox.run();const s=window.CircuitSandbox.status();window.CircuitSandbox.pause();return s;});if(!resumed.running||resumed.runId!==state.runId)throw new Error('resume');
 const report={version:'0.5',at:new Date().toISOString(),elapsedMs:elapsed,state,resumed,passed:true};const d=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)]));a.download='budget.json';a.click();},report);await(await d).saveAs('docs/沙盒连续运行预算核验-v0.5.json');return report;
}
