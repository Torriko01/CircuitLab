import type { LessonId } from './types';
import { extensionLessons } from './extensionContent';
import { stageLessons } from './stageContent';
import { signalLessons } from './signalContent';
export type Option = { id: string; text: string };
export type Lesson = {
  id: LessonId; number: string; title: string; subtitle: string; time: string; question: string; context: string; goal: string;
  prediction: string; predictions: Option[]; predictionAnswer: string; predictionExplanation: string;
  causes: Option[]; answers: string[]; explanations: Option[]; interpretationAnswers: string[]; remedies: Option[];
  hints: string[]; diagnosis: string; tasks: string[]; boundary: string; engineering: string[];
  transfers: {question:string;options:Option[];answer:string;explanation:string}[];
};
export const lessons: Lesson[] = [
  {
    id:'divider',number:'01',title:'分压与负载',subtitle:'接上模块，电压为什么变了？',time:'20 分钟',
    question:'空载时是 1.65 V，接上模块后还是吗？',
    context:'你用两只 10 kΩ 电阻把 3.3 V 分成一半，准备用它给另一个模块提供输入信号。模块输入不是理想开路，它也会取走电流。',
    goal:'把电压读数与闭合路径、支路电流和负载联系起来。',
    prediction:'给分压输出并接一个 10 kΩ 负载，输出电压会怎样？',
    predictions:[{id:'down',text:'下降'},{id:'same',text:'不变'},{id:'up',text:'上升'},{id:'unknown',text:'暂时不确定'}],
    predictionAnswer:'down',predictionExplanation:'负载与下臂并联，输出节点的电流分配发生变化。分压比不能脱离下游负载讨论。',
    causes:[{id:'r1',text:'上臂电阻错装，分压比改变'},{id:'load',text:'模块输入阻抗较低，产生带载效应'},{id:'supply',text:'3.3 V 输入电源偏低'}],answers:['r1','load'],
    explanations:[{id:'ratio',text:'输入正常，移除模块后输出仍偏低，或上臂电流支持分压比异常'},{id:'loading',text:'输入正常，移除模块后输出恢复，或上臂电流支持额外支路取流'},{id:'low',text:'只要输出偏低，就能证明输入电源异常'}],interpretationAnswers:['ratio','loading'],
    remedies:[{id:'r1',text:'核对电阻实装值，并重新验证空载/带载表现'},{id:'load',text:'评估下游输入阻抗，选择合适分压电阻或缓冲，再检查功耗'},{id:'supply',text:'直接在软件里乘一个补偿系数'}],
    diagnosis:'标称 R1=R2=10 kΩ，3.3 V 供电，已接入一个输入特性待确认的模块。输出偏低。请区分电阻错装、模块负载和电源异常。',
    hints:['电压是两个点之间的差。先想清楚偏低的是哪个节点、相对哪里。','测输入，再测上臂电流；或者移除模块，比较输出是否恢复。','若移除模块仍低、输入正常，检查分压比；若移除模块恢复正常，检查负载。上臂电流也能区分两种情况。'],
    tasks:['先测 VOUT 对 GND，再交换表笔，看数值如何变化。','接入 10 kΩ 负载，观察 R1、R2、RL 三条支路。','保持分压比，改用 1 kΩ 或 100 kΩ，比较带载表现。'],
    boundary:'理想 3.3 V 电源、固定电阻、理想高阻电压探针。断开模块用 1 TΩ 近似；不包含 ADC 采样。电流动画表示约定方向，不表示电子实际速度。',
    engineering:['查下游输入阻抗和输入漏电。','ADC 的动态采样负载需要另外检查。','先确认电源和负载状态，再讨论软件补偿。'],
    transfers:[
      {question:'5 V 电源，上下臂各 22 kΩ，输出并接 22 kΩ 负载。输出约为多少？',options:[{id:'1.67',text:'1.67 V'},{id:'2.5',text:'2.50 V'},{id:'3.33',text:'3.33 V'}],answer:'1.67',explanation:'下臂与负载并联后为 11 kΩ，输出约为 5×11/(22+11)=1.67 V。'},
      {question:'保持上下臂比例不变，同时减小电阻，会带来什么取舍？',options:[{id:'tradeoff',text:'负载影响减小，静态电流与功耗增大'},{id:'always',text:'只有好处，越小越好'},{id:'none',text:'比例不变，任何表现都不会变'}],answer:'tradeoff',explanation:'比例决定理想空载分压；电阻量级还决定输出能力与静态消耗。'}
    ]
  },
  {
    id:'rc',number:'02',title:'RC 与时间',subtitle:'滤掉毛刺，也可能丢掉有效信号',time:'25 分钟',
    question:'你想滤掉毛刺，输入响应会付出什么代价？',context:'GPIO 前加了一个 RC 滤波，输入干净了，却偶尔漏掉短脉冲。接下来将同时观察输入、输出和逻辑门限。',goal:'用波形与门限理解建立时间，分清稳态值和瞬态过程。',
    prediction:'保持 C 不变，增大 R，电容电压进入高电平区域的时间会怎样？',predictions:[{id:'slower',text:'更晚'},{id:'faster',text:'更早'},{id:'same',text:'不变'},{id:'unknown',text:'暂时不确定'}],predictionAnswer:'slower',predictionExplanation:'RC 增大，充放电更慢。它能抑制短毛刺，也会使有效短脉冲难以跨过门限。',
    causes:[{id:'slow',text:'RC 时间常数偏大，建立太慢'},{id:'amplitude',text:'输入幅度不足'},{id:'software',text:'仅凭现象可确定为软件漏采样'}],answers:['slow','amplitude'],
    explanations:[{id:'delay',text:'输入幅度正常，VC 建立较慢，支持 RC 偏大'},{id:'input',text:'输入峰值本身低于高门限，支持幅度不足'},{id:'final',text:'只要最终电压正常，短脉冲就一定能检测到'}],interpretationAnswers:['delay','input'],
    remedies:[{id:'slow',text:'根据有效脉宽和门限调整 RC，并查芯片输入要求'},{id:'amplitude',text:'核对信号源电压范围和电平兼容，再验证波形'},{id:'software',text:'不测输入，直接放宽软件判断'}],
    diagnosis:'标称 R=10 kΩ、C=1 µF，3.3 V、30 ms 输入脉冲。在 15 ms 时，VC 仍没有进入 2.31 V 以上区域。请区分输入幅度不足与 RC 偏大。',
    hints:['输出尚未到门限，可能是速度问题，也可能是输入根本不够高。','观察 VIN 的峰值，再与 VC 的过程比较。只看 VC 的某一个时刻不足以下结论。','VIN 约 3.3 V 而 VC 慢，支持 RC 偏大；VIN 只有约 1.8 V，支持输入幅度不足。'],
    tasks:['使用阶跃输入，在 10 ms 附近观察 VC。','切换到 2 ms 脉冲，比较输入峰值与 VC 峰值。','增大 R 或 C，观察门限跨越时刻和短脉冲峰值。'],
    boundary:'初始电容电压为 0 V，理想电压源和高阻输出。0.99/2.31 V 是教学门限，不能代替具体 MCU 手册；没有模拟施密特迟滞。',engineering:['查 MCU 的 VIL/VIH、最小脉宽和输入特性。','用示波器同时看输入与输出。','复位电路需按目标芯片要求设计。'],
    transfers:[{question:'R=22 kΩ、C=1 µF，输入 3.3 V、10 ms 脉冲，VC 峰值约 1.205 V。能保证识别为高电平吗？',options:[{id:'no',text:'不能，未达到教学高门限 2.31 V'},{id:'yes',text:'能，因为输入达到 3.3 V'},{id:'always',text:'只要等待，脉冲结束后还会继续上升'}],answer:'no',explanation:'脉冲结束后电容开始放电，不能用长期阶跃的稳态值判断短脉冲。'},
      {question:'排查短脉冲漏检，优先观察什么？',options:[{id:'both',text:'VIN、VC 的过程与门限/采样时刻'},{id:'dc',text:'只用万用表看长期平均电压'},{id:'code',text:'只检查 GPIO 寄存器'}],answer:'both',explanation:'动态波形才能区分输入幅度、建立时间与采样窗口的问题。'}]
  },
  {
    id:'i2c',number:'03',title:'I²C 的电气边界',subtitle:'开漏总线为何不能只看 0 和 1',time:'25 分钟',
    question:'速率提高后不稳定，先看什么证据？',context:'总线释放后，电压靠上拉电阻给总线电容充电。上拉越强，边沿越快，但拉低时也需要更大的灌电流。',goal:'同时检查上升时间、低电平和驱动能力，不凭慢边沿直接判定某一原因。',
    prediction:'在总线电容不变时，减小上拉电阻 RP，会怎样？',predictions:[{id:'tradeoff',text:'上升更快，低态所需灌电流更大'},{id:'always',text:'只有好处，可以无限减小'},{id:'slower',text:'上升更慢'},{id:'unknown',text:'暂时不确定'}],predictionAnswer:'tradeoff',predictionExplanation:'上拉电阻和总线电容共同影响边沿；阻值更小也会增加低态电流，需要检查输出能力。',
    causes:[{id:'pullup',text:'上拉阻值偏大'},{id:'cap',text:'总线电容偏大'},{id:'protocol',text:'慢边沿足以证明地址配置错误'}],answers:['pullup','cap'],
    explanations:[{id:'weak',text:'同样慢的边沿下，低态电流较小，支持上拉阻值偏大'},{id:'capacitance',text:'低态电流接近标称，边沿仍慢，支持总线电容偏大'},{id:'riseonly',text:'只量上升时间，就能唯一确定是电阻问题'}],interpretationAnswers:['weak','capacitance'],
    remedies:[{id:'pullup',text:'核对上拉等效阻值，兼顾上升时间与灌电流能力'},{id:'cap',text:'检查布线/器件/探头电容，评估上拉与模式要求'},{id:'protocol',text:'只降低速率，不再检查低态电流'}],
    diagnosis:'标称 RP=4.7 kΩ、CB=100 pF、3.3 V，工作于 Fast-mode。实测边沿偏慢。两种元件偏差都可能导致相近边沿，请寻找能区分的证据。',
    hints:['慢边沿与 RC 相关。只知道乘积，不能唯一确定 R 或 C。','拉低稳定时的电流主要受上拉与导通电阻影响，可用来区分假设。','模型低态电流约 0.347 mA 支持 RP 偏大；约 0.688 mA 且边沿慢，支持 CB 偏大。'],
    tasks:['默认 4.7 kΩ、100 pF，捕获 30%–70% 上升时间。','切换 100/400 kHz，分别对照模式要求。','把 RP 改为 470 Ω，同时检查低态电压与电流。'],
    boundary:'单根开漏线、100 Ω 教学导通电阻；能力假设为 3 mA、0.4 V。超限后不模拟真实限流或损坏。只检查边沿与电平，不执行 I²C 协议帧，也不保证真实通信成功。',engineering:['查目标器件的 VOL/IOL 与输入门限。','估计板线、器件及探头的总电容。','协议报错需要结合时序、地址等其他证据。'],
    transfers:[{question:'RP=2.2 kΩ、CB=150 pF，估算 tr≈279.6 ns、低态电流≈1.435 mA。在本实验假设下？',options:[{id:'pass',text:'满足 300 ns 与 3 mA 约束，但不能据此保证协议通信'},{id:'fail',text:'不满足 300 ns'},{id:'guaranteed',text:'可以保证任何 I²C 器件通信成功'}],answer:'pass',explanation:'边沿与驱动能力检查通过，协议与具体器件条件仍需另外验证。'},
      {question:'降低通信速率，是否自动解决低态灌电流超限？',options:[{id:'no',text:'不会，必须分别检查上拉与输出能力'},{id:'yes',text:'会，低速下一切电气约束都放宽'},{id:'zero',text:'会，因为低速时电流为零'}],answer:'no',explanation:'速率会改变时序要求，但稳定拉低时的电流仍由电源、上拉和输出路径决定。'}]
  }
  ,...extensionLessons,...stageLessons,...signalLessons
];
