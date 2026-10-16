import type { Params,RunConfig } from '../types';
import type { StageModel } from './stages';
export const signalDefaults={pressTime:.008,inputMode:0,hysteresis:1,signalVoltage:1,closedGain:2,outputLimit:2.8,clockFrequency:1000000,sampleEdge:0};
export const isSignal=(id:string)=>['debounce','opamp','spi'].includes(id);
export function validateSignalParams(p:Params){
 const presets:{[K in keyof typeof signalDefaults]:number[]}={pressTime:[.003,.008,.015],inputMode:[0,1],hysteresis:[0,1],signalVoltage:[.4,1,1.65],closedGain:[1,2,3],outputLimit:[1.6,2.8,3.2],clockFrequency:[500000,1000000,2000000],sampleEdge:[0,1]};
 for(const [key,values] of Object.entries(presets))if(!values.includes(p[key as keyof typeof signalDefaults]))throw new Error('信号实验参数不在已验证预设中');
}
export function makeSignal(c:RunConfig):StageModel{
 const p=c.params,label=(x:number,y:number,name:string)=>`207 ${x} ${y} ${x-48} ${y} 4 ${name}`;
 let lines:string[],nodes:string[],branches:Record<string,number>,step:number,duration:number;
 const branchTypes:Record<string,string>={};
 if(c.lesson==='debounce'){
  const r=c.diagnostic?(c.variant===0?1000:10000):p.resistance,cap=c.diagnostic?(c.variant===0?.1e-6:1e-6):p.capacitance;
  const mode=c.diagnostic?0:p.inputMode,hyst=c.diagnostic?1:p.hysteresis;
  duration=.02;step=Math.min(5e-6,r*cap/100);
  const period=.1;
  const pulse=(xa:number,ya:number,xb:number,yb:number,start:number,width:number,amplitude:number)=>`v ${xa} ${ya} ${xb} ${yb} 0 2 ${1/period} ${amplitude/2} ${amplitude/2} ${2*Math.PI*(1-start/period)} ${width/period}`;
  lines=[mode===0?pulse(128,352,128,256,.001,p.pressTime,3.3):'v 128 352 128 256 0 1 50 1.3 1.65 -1.5707963267948966 0.5',mode===0?pulse(128,256,128,160,.0012,.0002,-3.3):'v 128 256 128 160 0 1 1000 0.3 0 0 0.5',mode===0?pulse(128,160,128,96,.0016,.0002,-3.3):'v 128 160 128 96 0 0 40 0 0 0 0.5',`r 128 96 384 96 0 ${r}`,`c 384 96 384 352 0 ${cap} 0 0`,`182 384 96 608 96 0 0.5 ${hyst?.99:1.65} ${hyst?2.31:1.65} 3.3 0`,'r 608 96 608 352 0 1000000','w 128 352 384 352 0','w 384 352 608 352 0','g 128 352 128 384 0',label(128,96,'RAW'),label(384,96,'FILTER'),label(608,96,'OUT'),label(128,352,'GND'),'x 245 65 245 65 0 14 FILTER_R','x 407 270 407 270 0 14 C','x 480 145 480 145 0 14 RECEIVER'];
  nodes=['RAW','FILTER','OUT','GND'];branches={FILTER_R:3,C:4,LOAD:6};branchTypes.C='CapacitorElm';
 }else if(c.lesson==='opamp'){
  const gain=c.diagnostic?(c.variant===0?2:1.6):p.closedGain,limit=c.diagnostic?(c.variant===0?1.6:2.8):p.outputLimit;
  step=1e-5;duration=.001;
  // The native op-amp has an ideal output driver, finite open-loop gain and soft output limits.
  lines=[`v 128 352 128 224 0 0 40 ${p.signalVoltage} 0 0 0.5`,'r 128 224 320 224 0 10000',`a 320 208 512 208 8 ${limit} 0.1 1000000 0 0 100000`,`r 512 128 320 128 0 ${gain===1?1:(gain-1)*10000}`,`r 320 128 320 32 0 ${gain===1?1e12:10000}`,`r 640 208 640 352 0 ${p.load}`,'w 512 208 512 128 0','w 320 128 320 192 0','w 512 208 640 208 0','w 128 352 320 352 0','w 320 352 640 352 0','g 128 352 128 384 0','g 320 32 320 0 0',label(128,224,'VIN'),label(320,224,'PLUS'),label(320,192,'FB'),label(640,208,'VOUT'),label(128,352,'GND'),'x 405 100 405 100 0 14 RF','x 260 80 260 80 0 14 RG','x 660 300 660 300 0 14 LOAD'];
  nodes=['VIN','PLUS','FB','VOUT','GND'];branches={SOURCE:1,RF:3,RG:4,LOAD:5};
 }else{
  const r=c.diagnostic?(c.variant===0?2200:100):p.resistance,cap=c.diagnostic?200e-12:p.capacitance,edge=c.diagnostic?(c.variant===0?0:1):p.sampleEdge;
  const f=p.clockFrequency;
  duration=5/f;step=Math.min(5e-9,r*cap/40,1/f/500);
  lines=[`v 128 352 128 96 0 2 ${f/2} 1.65 1.65 0 0.5`,`r 128 96 416 96 0 ${r}`,`c 416 96 416 352 0 ${cap} 0 0`,'r 608 96 608 352 0 1000000000','w 416 96 608 96 0',`v 224 352 224 224 0 2 ${f} 1.65 1.65 ${Math.PI} 0.5`,`v 736 352 736 224 0 2 ${f} 1.65 1.65 ${edge===0?Math.PI:0} 0.5`,'w 128 352 224 352 0','w 224 352 416 352 0','w 416 352 608 352 0','w 608 352 736 352 0','g 128 352 128 384 0',label(128,96,'TX'),label(416,96,'DATA'),label(224,224,'CLK'),label(736,224,'SAMPLE'),label(128,352,'GND'),'x 250 65 250 65 0 14 SERIES_R','x 440 290 440 290 0 14 CLINE','x 675 190 675 190 0 14 SAMPLE_MARKER'];
  nodes=['TX','DATA','CLK','SAMPLE','GND'];branches={SERIES_R:1,CLINE:2,INPUT:3};branchTypes.CLINE='CapacitorElm';
 }
 if(c.halfStep)step/=2;
 return {text:[`$ ${c.diagnostic?17:1} ${step} 1000 50 3.3 50 ${step/16}`,...lines].join('\n'),nodes,branches,branchTypes,step,duration};
}
