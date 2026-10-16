import { build } from 'vite';
import { mkdirSync, existsSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, '.engine-source');
const archive = resolve(root, 'vendor/circuitjs/source.tar.gz');
mkdirSync(source, { recursive: true });
execFileSync('tar', ['-xzf', archive, '-C', source, '--strip-components=1']);
const bridgeSource=resolve(root,'engine-overrides/SandboxBridge.ts');
cpSync(bridgeSource,resolve(source,'ts/SandboxBridge.ts'));
const entry=resolve(source,'ts/main.ts');
writeFileSync(entry,readFileSync(entry,'utf8')+'\nimport { installSandboxBridge } from "./SandboxBridge";\ninstallSandboxBridge(app);\n');
// Unijunction's bootstrap model deserializes VCCS records. Register its prototype
// after VCCS has a dump-type mapping; no numerical or device equations change.
const registry=resolve(source,'ts/registerElements.ts');
const ujt='    CirSim.theApp.register("UnijunctionElm", new UnijunctionElm(0, 0));\n';
const registration=readFileSync(registry,'utf8');
if(!registration.includes(ujt))throw new Error('Fixed-source registration anchor missing');
writeFileSync(registry,registration.replace(ujt,'').replace('    // registered last',ujt+'\n    // registered last'));
const output = resolve(root, 'public/vendor/circuitjs');
await build({
  configFile: false, root: resolve(source, 'ts'), base: './',
  resolve: { alias: { 'lz-string': resolve(root, 'node_modules/lz-string/libs/lz-string.js') } },
  // Local-only embedding has no service worker. Numerical engine is unchanged.
  define: { 'import.meta.env.PROD': 'false' },
  build: { outDir: output, emptyOutDir: true, copyPublicDir: false, target: 'esnext',
    minify: false, assetsDir: 'circuitjs',
    rollupOptions: { input: resolve(source, 'ts/circuitjs.html'), onwarn(w, warn) { if(w.code !== 'CIRCULAR_DEPENDENCY') warn(w); } }
  }
});
for (const name of ['circuits', 'locale', 'images', 'setuplist.txt']) {
  const from = resolve(source, 'ts/public', name);
  if (existsSync(from)) cpSync(from, resolve(output, 'circuitjs', name), { recursive: true });
}
cpSync(resolve(source, 'ts/public/circuitjs/font'), resolve(output, 'circuitjs/font'), { recursive: true });
cpSync(resolve(source, 'COPYING.txt'), resolve(output, 'COPYING.txt'));
const html = resolve(output, 'circuitjs.html');
writeFileSync(html, readFileSync(html, 'utf8').replace('<title>CircuitJS</title>', '<title>CircuitJS · 电路直觉实验室</title><link rel="icon" href="data:,">'));
writeFileSync(resolve(output,'iframe.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>本地电路</title><body></body></html>');
const locale=resolve(output,'circuitjs/locale/locale_zh.txt');
const validLocale=readFileSync(locale,'utf8').split(/\r?\n/).filter(line=>!line || /^"[^"\n]*"=".*"$/.test(line));
validLocale.push('"Edit Resistor"="编辑电阻"','"Edit Capacitor"="编辑电容"','"Edit Inductor"="编辑电感"','"Edit Voltage Source"="编辑电压源"','"Edit Switch"="编辑开关"','"Find Component/Command..."="查找元件或命令…"','"Load Model Circuit"="载入模型电路"','"wire loop detected"="导线形成闭环，请检查连接"');
writeFileSync(locale,validLocale.join('\n'));
const provenance = {
  repository: 'https://github.com/pfalstad/circuitjs1',
  revision: '8ee04b18a6c9241675f1c4f766617806c2fe148d',
  archiveSHA256: createHash('sha256').update(readFileSync(archive)).digest('hex'),
  license: 'GPL-2.0-or-later',
  builtFrom: 'vendored source archive, ts/; Vite; unminified to preserve class names',
  changes: ['Disable production service-worker registration via build define', 'Local title and embedded favicon', 'Local empty sidebar resource', 'Filter malformed Chinese locale entries and add common labels', 'Register Unijunction bootstrap model after VCCS dump mapping', 'Opt-in sandbox host bridge; numerical solver unchanged'],
  sandboxBridgeSHA256:createHash('sha256').update(readFileSync(bridgeSource)).digest('hex'),
};
writeFileSync(resolve(output, 'provenance.json'), JSON.stringify(provenance, null, 2));
console.log('Built fixed CircuitJS source:', provenance.revision);
