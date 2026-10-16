import type { Params, RunConfig } from '../types';
export const stageDefaults={gate:3.3,sourceOffset:0,pathResistance:1,inductance:.02,protection:0,layout:0,signalNoise:0};
export const isStage=(id:string)=>['mosfet','flyback','pcb'].includes(id);
export function validateStageParams(p:Params) {
 const presets:{[K in keyof typeof stageDefaults]:number[]}={gate:[0,1.8,3.3,5],sourceOffset:[0,1.5],pathResistance:[.1,.5,1,10,47],inductance:[.01,.02,.05],protection:[0,12,24],layout:[0,1],signalNoise:[0,.1]};
 for(const [key,values] of Object.entries(presets))if(!values.includes(p[key as keyof typeof stageDefaults]))throw new Error('驱动与回流参数不在已验证预设中');
}
export type StageModel={text:string;branches:Record<string,number>;branchTypes:Record<string,string>;nodes:string[];step:number;duration:number};
export function makeStage(c:RunConfig):StageModel {
 const p=c.params;
 const label=(x:number,y:number,n:string)=>`207 ${x} ${y} ${x-48} ${y} 4 ${n}`;
 let lines:string[],branches:Record<string,number>,nodes:string[],step:number,duration:number;
 const branchTypes:Record<string,string>={};
 if(c.lesson==='mosfet'){
  const gate=c.diagnostic?(c.variant===0?1.8:3.3):p.gate,path=c.diagnostic?(c.variant===0?1:47):p.pathResistance,offset=c.diagnostic?0:p.sourceOffset;
  step=1e-5;duration=.001;
  lines=['v 128 352 128 96 0 0 40 12 0 0 0.5',`r 128 96 416 96 0 ${path}`,`r 416 96 416 192 0 ${p.load}`,'f 320 208 416 208 16 1.5 0.5',`v 416 352 416 224 0 0 40 ${offset} 0 0 0.5`,`v 224 352 224 208 0 0 40 ${gate} 0 0 0.5`,'w 224 208 320 208 0','w 128 352 224 352 0','w 224 352 416 352 0','g 128 352 128 384 0',label(128,96,'VIN'),label(416,96,'VLOAD'),label(416,192,'DRAIN'),label(224,208,'GATE'),label(416,224,'SOURCE'),label(128,352,'GND'),'x 230 65 230 65 0 14 PATH','x 458 175 458 175 0 14 LOAD','x 470 267 470 267 0 14 SOURCE_OFFSET'];
  branches={PATH:1,LOAD:2};nodes=['VIN','VLOAD','DRAIN','GATE','SOURCE','GND'];
 }else if(c.lesson==='flyback'){
  const clamp=c.diagnostic?(c.variant===0?24:0):p.protection,load=c.diagnostic?100:p.load,inductance=c.diagnostic?.02:p.inductance;
  duration=p.pulse+.004;step=Math.min(5e-7,inductance/(load+1)/200);
  const period=duration*4;
  // A bounded diode + ideal absorption-voltage equivalent. Never an open ideal inductor.
  lines=['v 128 384 128 96 0 0 40 12 0 0 0.5',`r 128 96 320 96 0 ${load}`,`l 320 96 480 96 0 ${inductance} 0 0`,'w 480 96 480 192 0','159 480 192 544 192 0 1 1000000000000 2.5','w 544 192 544 384 0',`v 224 384 224 288 0 2 ${1/period} 2.5 2.5 0 ${p.pulse/period}`,'w 224 288 512 288 0','w 512 288 512 208 0','d 480 96 640 96 1 0.7',`v 128 16 640 16 0 0 40 ${clamp} 0 0 0.5`,'w 128 96 128 16 0','w 640 16 640 96 0','w 128 384 224 384 0','w 224 384 544 384 0','g 128 384 128 416 0',label(128,96,'VIN'),label(320,96,'COIL'),label(480,96,'SW'),label(640,96,'CLREF'),label(224,288,'CTRL'),label(128,384,'GND'),'x 210 65 210 65 0 14 RCOIL','x 360 65 360 65 0 14 LCOIL','x 550 145 550 145 0 14 D_CLAMP','x 250 340 250 340 0 14 IDEAL_CLAMP_EQ'];
  branches={RCOIL:1,LCOIL:2,DCLAMP:9};branchTypes.LCOIL='InductorElm';branchTypes.DCLAMP='DiodeElm';nodes=['VIN','COIL','SW','CLREF','CTRL','GND'];
 }else{
  const layout=c.diagnostic?0:p.layout,path=c.diagnostic?(c.variant===0?1:.001):p.pathResistance,noise=c.diagnostic?(c.variant===0?0:.1):p.signalNoise;
  step=2e-7;duration=.0008;
  const period=.008,phase=2*Math.PI*(1-.0001/period);
  lines=['v 128 384 128 96 0 0 40 5 0 0 0.5',`r 128 96 320 96 0 ${p.load}`,'159 320 96 384 96 0 1 1000000000000 2.5','w 384 96 480 96 0',`r 480 96 480 384 0 ${path}`,`v 192 384 192 240 0 2 ${1/period} ${p.connected?2.5:0} ${p.connected?2.5:0} ${phase} ${.0003/period}`,'w 192 240 352 240 0','w 352 240 352 112 0',`v 640 288 640 160 0 2 ${1/period} ${noise/2} ${1.65+noise/2} ${phase} ${.0003/period}`,'r 640 160 768 160 0 1000000000','w 768 160 768 384 0',`w 640 288 ${layout===0?480:640} ${layout===0?96:384} 0`,'w 128 384 192 384 0','w 192 384 480 384 0','w 480 384 640 384 0','w 640 384 768 384 0','g 128 384 128 416 0',label(128,96,'VPOWER'),label(480,96,'GLOAD'),label(640,288,'SGND'),label(640,160,'SIG'),label(192,240,'CTRL'),label(128,384,'GND'),'x 210 65 210 65 0 14 LOAD','x 496 340 496 340 0 14 SHARED_R','x 675 280 675 280 0 14 SENSOR'];
  branches={LOAD:1,RETURN:4,INPUT:9};nodes=['VPOWER','GLOAD','SGND','SIG','CTRL','GND'];
 }
 if(c.halfStep)step/=2;
 return {text:[`$ ${c.diagnostic?17:1} ${step} 1000 50 ${c.lesson==='pcb'?5:c.lesson==='mosfet'?14:40} 50 ${step/16}`,...lines].join('\n'),branches,branchTypes,nodes,step,duration};
}
