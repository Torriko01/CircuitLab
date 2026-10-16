import type { Lesson } from './content';
export const stageLessons:Lesson[]=[
 {
  id:'mosfet',number:'07',title:'MOSFET 低侧驱动',subtitle:'栅极有电压，负载为什么没力？',time:'30 分钟',
  question:'栅极测到 3.3 V，就表示 MOSFET 已充分导通吗？',context:'12 V 经供电路径和电阻负载，再由 N 沟道 MOSFET 返回。观察栅源压差、漏源压降和负载电流。这里使用真实非线性求解元件，但参数是教学模型，与商品器件没有一一对应关系。',goal:'以 SOURCE 为栅极的参考，沿电流路径定位压降，再查实际器件在目标栅压下的保证参数。',
  prediction:'栅极对 GND 保持 3.3 V，源极由 0 V 抬升至 1.5 V，负载电流可能怎样？',predictions:[{id:'down',text:'下降，因为实际 VGS 降为 1.8 V'},{id:'same',text:'不变，栅极对地仍为 3.3 V'},{id:'threshold',text:'超过阈值后一定与理想开关相同'},{id:'unknown',text:'暂时不确定'}],predictionAnswer:'down',predictionExplanation:'控制沟道的是 GATE 相对 SOURCE 的电压。刚超过阈值只说明开始导电；能否承受目标电流，还要看对应 VGS 下的导通参数、损耗和裕量。',
  causes:[{id:'gate',text:'实际 VGS 仅 1.8 V，驱动不足'},{id:'path',text:'实际供电路径电阻偏大'},{id:'code',text:'只凭电流小即可确定软件没有输出'}],answers:['gate','path'],
  explanations:[{id:'channel',text:'VGS 偏低、VDS 较大，而供电路径压降较小，支持沟道驱动不足'},{id:'upstream',text:'VGS 正常、VDS 较小，明显压降集中在供电路径'},{id:'single',text:'只凭栅极对地的一个电压就断定 MOSFET 完全导通'}],interpretationAnswers:['channel','upstream'],
  remedies:[{id:'gate',text:'检查驱动参考和波形，选目标 VGS 下有保证导通参数的器件，复核损耗'},{id:'path',text:'检查线缆、连接器与供电路径，降低压降后复测负载电流'},{id:'code',text:'无限提高栅压，不看 VGS 绝对最大额定'}],
  diagnosis:'标称 VIN=12 V、路径 1 Ω、VGS=3.3 V、负载 100 Ω。负载电流偏低；实际驱动或供电路径未知。请在同一次捕获中保存 V(GATE)−V(SOURCE)、V(DRAIN)−V(SOURCE)、V(VIN)−V(VLOAD)。可以改负载，不能直接查看隐藏参数。',
  hints:['电流偏小，需要找到压降发生在哪一段。','VGS 用 SOURCE 作黑表笔；再测 VDS 与供电路径两端压差，三项都选“区分候选原因”。','VGS 约 1.8 V、VDS 约 9.7 V 支持驱动不足；VGS 3.3 V、VDS 较小、路径压降约 3.8 V 支持路径异常。'],
  tasks:['固定源极 0 V，将栅极从 0 → 1.8 → 3.3 V，比较 LOAD 电流与 VDS；导通不是瞬间变成零电阻。','栅极保持 3.3 V，将源极抬升到 1.5 V。分别测栅极对地和栅源压差，解释负载电流。','恢复源极 0 V，增大供电路径电阻，观察损失从沟道移到路径；改变负载，核对整条路径电压之和。'],
  boundary:'原生 MOSFET 平方律模型：阈值 1.5 V、β=0.5 A/V²、沟道长度调制为 0；关闭支路约 1e-8 S。无体二极管、栅电荷、寄生电容、热、击穿或 SOA。源极偏置为独立理想源，教学用途。仅讨论直流工作点；不能预测 PWM 开关损耗。',
  engineering:['查真实器件 RDS(on) 的 VGS、温度和电流条件；VGS(th) 的微小测试电流不能代替负载导通能力。','驱动与示波器测量均应关注 GATE−SOURCE。实际接线需核对源极回路及测量仪器的接地方式。','直流 VDS×ID 只是部分损耗；PWM 还需检查驱动能力、栅电荷、开关时间、热与安全工作区。'],
  transfers:[{question:'某器件 VGS(th) 典型 1.5 V，只在 VGS=10 V 给出 RDS(on) 保证值。能认定 3.3 V 驱动合格吗？',options:[{id:'no',text:'不能，应查 3.3 V 附近的保证参数或选择合适器件'},{id:'yes',text:'能，3.3 V 已超过阈值'},{id:'typical',text:'典型曲线看起来有电流就足够'}],answer:'no',explanation:'阈值通常定义在很小漏极电流下，不能代表目标负载下的低损耗导通。'},
  {question:'测得负载电流低、VGS 正常、VDS 很小，但线缆两端压降很大。下一步？',options:[{id:'path',text:'检查线缆/连接器与回路，复测负载下的压降'},{id:'replace',text:'直接认定 MOSFET 损坏'},{id:'gate',text:'继续增加栅压，忽略供电路径'}],answer:'path',explanation:'按压降分配定位问题，比只看负载现象更有区分力。'}]
 },
 {
  id:'flyback',number:'08',title:'感性负载与续流',subtitle:'关掉开关，电流去了哪里？',time:'30 分钟',
  question:'线圈断电时，为什么开关节点会高于电源？',context:'12 V 电源驱动电阻与电感串联的线圈等效模型。关断后，电流经二极管和吸收支路继续流动。比较普通续流与更高吸收电压，观察电压应力和电流衰减之间的取舍。',goal:'画出导通与关断两条闭合路径，用同一次捕获解释峰值电压、连续电流和衰减时间。',
  prediction:'保持线圈和初始电流相同，将普通续流换成更高电压的吸收支路，会怎样？',predictions:[{id:'tradeoff',text:'电流衰减更快，开关节点承受更高电压'},{id:'both',text:'电压更低，电流也更快消失'},{id:'zero',text:'电感电流在关断瞬间直接变成零'},{id:'unknown',text:'暂时不确定'}],predictionAnswer:'tradeoff',predictionExplanation:'电感电流不能在有限电压下瞬间跳变。更高的反向线圈电压加快衰减，同时提高开关承受的电压。普通续流常降低应力，却延长电气释放过程。',
  causes:[{id:'clamp',text:'普通续流路径失效，转由高压备用吸收支路承担'},{id:'slow',text:'普通续流限制电压，但电流衰减比快速释放要求慢'},{id:'supply',text:'VIN 电源幅度异常'}],answers:['clamp','slow'],
  explanations:[{id:'high',text:'VIN 正常，SW 峰值约 36.6 V，电流快速衰减，支持高压备用吸收介入'},{id:'long',text:'VIN 正常，SW 只略高于 12 V，但电流尾部较长，支持普通续流的释放取舍'},{id:'instant',text:'控制信号变低即代表线圈电流立即为零'}],interpretationAnswers:['high','long'],
  remedies:[{id:'clamp',text:'检查普通续流路径、极性与连接，按能量及开关额定验证保护方案'},{id:'slow',text:'按允许关断应力与释放需求设计吸收方案，验证器件能量和温升'},{id:'supply',text:'移除一切保护，认为越高尖峰越好'}],
  diagnosis:'标称 12 V、100 Ω、20 mH，导通 1 ms 后关断。可能是普通续流失效后备用高压吸收介入，也可能普通续流工作但释放太慢。本课始终保留有界吸收路径。用同一次捕获保存 VIN 对 GND、SW 峰值、线圈电流降至 10% 时间。峰值测点必须选 SW。',
  hints:['先找关断后的闭合电流路径，不能把开关断开等同于线圈无电流。','保存 VIN，然后选择峰值测量并将红测点设为 SW，再保存专用 10% 时间。','普通续流 SW 约 12.6 V，10% 约 0.4 ms；高压备用吸收 SW 约 36.6 V，10% 约 0.07 ms。两种现象都必须结合电压和电流判断。'],
  tasks:['运行后观察 1 ms 关断：SW 升高时，LCOIL 电流仍沿原方向。电压图与电流图使用独立单位。','只改变续流吸收等效，保存 SW 峰值和 10% 时间，比较电压应力与衰减速度。','改变 L、线圈电阻或导通时间，观察关断前电流与储能；电流越大并不表示保护容量自动足够。'],
  boundary:'R-L 线圈、1 Ω/1 TΩ 理想受控开关；原生二极管在 1 A 时正向压降参数为 0.7 V，实际压降随电流变。额外 0/12/24 V 用理想吸收电压源表示，非真实 TVS/雪崩模型。无开路无限尖峰、寄生振铃、热或机械运动；10% 时间只描述电气衰减。',
  engineering:['核对二极管极性、回路、峰值/平均电流、反向额定和重复能量；保护位置与寄生路径也影响实物尖峰。','钳位设计同时核对最坏电源、吸收电压容差、开关耐压及裕量，不能直接照抄本课数值。','继电器机械释放时间还受磁路、弹簧和机械过程影响。用示波器验证电流和电压，再按实际数据手册验收。'],
  transfers:[{question:'普通续流二极管加入后，开关尖峰降低，但继电器释放变慢。这是否矛盾？',options:[{id:'no',text:'不矛盾，低吸收电压可能延长电流衰减'},{id:'yes',text:'矛盾，二极管总应加快释放'},{id:'zero',text:'关断时电流必然立即归零'}],answer:'no',explanation:'保护电压与电流衰减存在取舍；机械时间仍需实测。'},
  {question:'20 mH 线圈，关断电流从 0.1 A 增为 0.2 A，储能如何变化？',options:[{id:'four',text:'从 0.1 mJ 增为 0.4 mJ，变为 4 倍'},{id:'two',text:'只增为 2 倍'},{id:'none',text:'L 不变，储能不变'}],answer:'four',explanation:'储能为 ½LI²。增加电流会更快增加每次关断需要处理的能量。'}]
 },
 {
  id:'pcb',number:'09',title:'PCB 回流与参考地',subtitle:'传感器没变，MCU 为什么读偏？',time:'30 分钟',
  question:'电路图里都叫 GND，就一定处处同电位吗？',context:'5 V 脉冲负载在 100–400 µs 导通，其回流经过一段显式电阻。1.65 V 传感器相对自身 SGND 输出，MCU 则相对 GND 观察信号。预制接法图展示这段路径如何被共用，实际节点由集中参数电路求解。',goal:'区分信号本身改变与参考点移动，练习在同一时刻测三个电压差。',
  prediction:'传感器相对 SGND 始终输出 1.65 V，但 SGND 相对 MCU 的 GND 抬高 0.1 V，MCU 看到多少？',predictions:[{id:'up',text:'约 1.75 V'},{id:'same',text:'仍为 1.65 V，所有地绝对相同'},{id:'zero',text:'0 V，因为地线电压抵消一切信号'},{id:'unknown',text:'暂时不确定'}],predictionAnswer:'up',predictionExplanation:'MCU 看到的 SIG−GND = (SIG−SGND) + (SGND−GND)。需要同时确认信号源与参考点；共用回流段的电流可改变参考电位。',
  causes:[{id:'return',text:'传感器本地信号稳定，共用回流段使参考地抬升'},{id:'sensor',text:'回流压降很小，传感器相对自身地的输出同步变化'},{id:'adc',text:'只凭 MCU 读数变化就能断言 ADC 损坏'}],answers:['return','sensor'],
  explanations:[{id:'reference',text:'本地 SIG−SGND 不变，SGND−GND 抬升，三电压满足参考叠加'},{id:'local',text:'SGND−GND 接近零，本地 SIG−SGND 已上升，变化来自信号本身'},{id:'ground',text:'原理图画了地符号，就不可能有地电位差'}],interpretationAnswers:['reference','local'],
  remedies:[{id:'return',text:'检查大电流回路与敏感参考路径，改进回流后同步复测；高频另查平面连续性'},{id:'sensor',text:'沿传感器本地信号与供电继续排查，结合真实干扰源验证'},{id:'adc',text:'直接在软件中固定减去一个常数'}],
  diagnosis:'负载动作时 SIG 对 MCU 地上升约 0.1 V。实际可能是共用回流压降，也可能是传感器本地信号变化。保持负载接入，在默认 250 µs 游标处、同一次捕获中保存 SIG−SGND、SGND−GND、SIG−GND。可以移除负载辅助观察，再接回取完整证据。',
  hints:['不要先把一切读数变化归因于 ADC。参考点也是测量的一部分。','在负载导通平台上锁定同一游标，依次更换红黑表笔。三次都选“区分候选原因”。','本地 1.65 V、地抬升约 0.12 V 支持回流问题；本地 1.75 V、地差接近零支持传感器自身变化。'],
  tasks:['默认共用接法，先测 SGND 对 GND，再测 SIG 对 SGND 与 SIG 对 GND，核对同一时刻的加法关系。','仅改为独立返回参考点，比较 SGND 与负载回流节点 GLOAD：负载路径压降仍在，但不再叠加到敏感参考。','恢复共用接法，将“传感器自身同步变化”改为 +0.1 V。移除负载时该独立注入仍在，说明不同源可能产生相似表象。'],
  boundary:'预制接法＋集中参数电阻；1 Ω 用于放大教学现象，不表示常规 PCB 地平面阻值。开关 1 Ω、MCU 输入等效 1 GΩ；传感器可独立注入同步 0.1 V。无走线场求解、寄生电感、平面电容、串扰、ADC 采样或 EMC 验证。接法图不表示电流密度。',
  engineering:['先标出负载的完整供电与回流环路，再看敏感参考是否与它共用有阻抗的路径。','“独立返回”只解释本课低频电阻耦合；高速设计应保持合适连续参考平面，不能据此随意割地。','实物差分测量要核对仪器接地和共模范围；比较本地信号、地差与 MCU 端波形，避免探头引入额外回路。'],
  transfers:[{question:'本地信号 1.65 V，地抬升 80 mV，MCU 相对自身地看到多少？',options:[{id:'sum',text:'约 1.73 V'},{id:'same',text:'1.65 V'},{id:'subtract',text:'1.57 V'}],answer:'sum',explanation:'按实际测量端点相加，先明确电压相对哪个参考点。'},
  {question:'高速信号下方的参考平面被切开，能用“模拟数字一律割地”解决吗？',options:[{id:'no',text:'不能，应检查回流连续性、跨分割路径与实际频率'},{id:'yes',text:'能，分割越多越好'},{id:'symbol',text:'只要都标 GND 就没有影响'}],answer:'no',explanation:'高频回流由阻抗与场分布决定。本课电阻模型不涵盖高频路径，不能推导通用割地规则。'}]
 }
];
