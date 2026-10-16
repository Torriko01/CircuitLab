import { createServer } from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { spawn } from 'node:child_process';
const root=resolve(import.meta.dirname,'../dist');
if(!existsSync(resolve(root,'index.html'))){console.error('未找到运行包，请先执行 npm run build');process.exit(1);}
const port=Number(process.env.CIRCUIT_LAB_PORT||4173);
if(!Number.isInteger(port)||port<1024||port>65535){console.error('CIRCUIT_LAB_PORT 必须为 1024–65535');process.exit(1);}
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.eot':'application/vnd.ms-fontobject'};
const server=createServer((req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  let path;try{path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  const file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  try{if(!statSync(file).isFile())throw new Error();res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-cache');if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);}catch{res.writeHead(404);res.end('Not found');}
});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`端口 ${port} 已被占用；可设置 CIRCUIT_LAB_PORT 选择其他端口。`:e.message);process.exit(1);});
server.listen(port,'127.0.0.1',()=>{const url=`http://127.0.0.1:${port}`;console.log(`\n电路直觉实验室\n${url}\n仅本机访问 · Ctrl+C 停止\n`);if(process.argv.includes('--open')&&process.platform==='darwin')spawn('open',[url],{stdio:'ignore'});});
