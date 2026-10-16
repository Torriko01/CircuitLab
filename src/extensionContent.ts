import type { Lesson } from './content';
export const extensionLessons:Lesson[]=[
 {
  id:'gpio',number:'04',title:'GPIO 的真实引脚',subtitle:'写了 1，为什么引脚还不高？',time:'25 分钟',
  question:'高电平是一个命令，还是一个电气结果？',context:'固件写入 1，不代表引脚一定主动向外供电。推挽、开漏与输入高阻具有不同的电流路径，外部负载也会改变读数。先用受限等效电路观察，再回到目标芯片手册。',goal:'将引脚模式、外部路径、带载压降和接收门限放在一起判断。',
  prediction:'开漏输出写 1（释放）后，没有上拉，能保证引脚为高吗？',predictions:[{id:'no',text:'不能，释放不等于主动驱高'},{id:'yes',text:'能，寄存器的 1 就是 3.3 V'},{id:'zero',text:'高阻就表示始终为 0 V'},{id:'unknown',text:'暂时不确定'}],predictionAnswer:'no',predictionExplanation:'开漏释放和输入高阻都不主动驱高。本模型显式包含 1 MΩ 对地漏电；无上拉时趋向低电位，不代表所有真实浮空引脚都会为 0 V。',
  causes:[{id:'mode',text:'实际为开漏释放，缺少外部上拉'},{id:'overload',text:'实际为推挽高，但外部负载过重'},{id:'supply',text:'VDD 电源异常'}],answers:['mode','overload'],
  explanations:[{id:'released',text:'VDD 正常，移除负载且不加测试上拉后 PIN 仍低，支持未主动驱高'},{id:'loaded',text:'VDD 正常，移除负载后 PIN 恢复，支持带载压降'},{id:'guess',text:'只凭 PIN 的一次低电压就确定原因'}],interpretationAnswers:['released','loaded'],
  remedies:[{id:'mode',text:'核对引脚模式和上拉，查接收门限，再验证高低态电流'},{id:'overload',text:'减轻负载或增加合适驱动级，核对 VOH/VOL 与电流条件'},{id:'supply',text:'直接把寄存器反复写 1'}],
  diagnosis:'标称目标是输出高；引脚未进入教学高电平保证区域。候选为开漏缺上拉或推挽带载过重。负载参数与实际模式隐藏。请测 VDD，然后在“无测试上拉”条件下移除负载并测 PIN。',
  hints:['写入值、实际模式和引脚电压是三件事。','先测 VDD，再移除外部负载，保持测试上拉为无，比较 PIN。','VDD 正常、移除负载仍接近 0 V 支持开漏缺上拉；移除后接近 3.3 V 支持负载过重。两项证据都要保存。'],
  tasks:['默认推挽高，接入负载，再改成 25 Ω，观察带载压降与 HIGH 电流（仅仿真，不在实物短接）。','移除负载，切到开漏释放或输入高阻；分别用无上拉、4.7 kΩ、40 kΩ 观察 PIN。','切到开漏拉低，观察 PULL 与 LOW 电流。高、低态都要检查，而非只求一个高电压。'],
  boundary:'上下驱动导通时等效 25 Ω、关闭时 1 TΩ，显式 1 MΩ 对地漏电。0.99/2.31 V 是教学接收门限，不代表所有 MCU。无钳位、噪声、热或损坏模型；高电流预设仅供仿真。',
  engineering:['查目标引脚的 VOH/VOL 测试电流、VIH/VIL、引脚类型和端口总电流限制。','5 V 容忍不代表模拟模式或掉电状态也允许 5 V；逐项核对手册。','实物先断电核对接线，再从已知高阻负载验证；不要复制 25 Ω 演示去拉重 MCU 引脚。'],
  transfers:[{question:'接收端要求 VIH≥2.4 V，发送端只保证 VOH≥2.2 V，典型实测为 3.1 V。能保证兼容吗？',options:[{id:'no',text:'不能，保证值没有足够裕量，应查全工作条件'},{id:'yes',text:'能，典型读数高于 2.4 V'},{id:'register',text:'只要软件写 1 就兼容'}],answer:'no',explanation:'工程判断使用保证边界及对应负载、供电和温度条件，典型值不能替代。'},
  {question:'一个外设掉电，但信号仍为高，电源轨被抬升。优先检查？',options:[{id:'path',text:'输入钳位/反灌路径、掉电容忍及允许电流'},{id:'zero',text:'认定高阻一定隔离一切电流'},{id:'resistor',text:'任意加电阻就认为已经保护合格'}],answer:'path',explanation:'是否存在路径和允许注入电流取决于器件；必要时选择具备掉电保护的接口，不用本模型预测可靠性。'}]
 },
 {
  id:'power',number:'05',title:'供电瞬态与去耦',subtitle:'平均电压正常，动作时为什么异常？',time:'30 分钟',
  question:'3.3 V 电源入口正常，芯片脚旁也一定正常吗？',context:'电源经过线缆与走线的等效电阻到达芯片。本课以可独立核算的 R+C 模型切入：100 µs 时接入电阻负载，观察供电支路和局部电容如何共同承担电流。',goal:'用同步电压、负载窗口和持续负载区分供电路径压降与储能不足。',
  prediction:'保持供电路径和负载不变，局部电容从 1 µF 增大为 10 µF，会怎样？',predictions:[{id:'transient',text:'短时跌落变慢，但长期稳态压降不会因此消失'},{id:'always',text:'所有时间的电压都会恢复到理想 3.3 V'},{id:'none',text:'电容不会影响负载瞬态'},{id:'unknown',text:'暂时不确定'}],predictionAnswer:'transient',predictionExplanation:'电容暂时供给电荷；持续负载最终仍由供电路径承担。增大电容改变动态时间尺度，不能消除路径电阻的稳态压降。',
  causes:[{id:'path',text:'供电路径电阻偏大'},{id:'decouple',text:'局部电容比标称小，负载边沿跌落更快'},{id:'input',text:'入口电源本身低于 3.3 V'}],answers:['path','decouple'],
  explanations:[{id:'drop',text:'入口正常，持续负载下芯片端压降仍明显偏大，支持路径阻抗问题'},{id:'fast',text:'入口正常，持续负载稳态符合标称路径，但短脉冲下跌更快，支持电容量偏小'},{id:'reset',text:'电压低于教学线，就能断言任何 MCU 必然复位'}],interpretationAnswers:['drop','fast'],
  remedies:[{id:'path',text:'检查供电线缆/连接器及回路，减小路径压降后复测负载瞬态'},{id:'decouple',text:'核对电容量与连接路径，再按目标器件启动/稳定性要求验证'},{id:'input',text:'不测硬件，直接屏蔽所有复位'}],
  diagnosis:'标称路径 2 Ω、局部电容 10 µF、负载 40 Ω（另有 1 Ω 开关）。短脉冲时 VMCU 下降。入口与两类内部偏差未知。先测 VIN，再把负载改成持续导通，保存 VMCU 最低值；比较原来的短脉冲，避免只凭边沿猜原因。',
  hints:['同样的电压下降可能来自路径，也可能来自建立过程。','在 100 µs 接通后同时看 VIN 与 VMCU。把 50 µs 改为持续导通，再保存最低值。','入口正常、长负载 VMCU 约 2.65 V 支持路径偏大；长负载约 3.15 V 而短脉冲跌落更快，支持电容偏小。'],
  tasks:['观察 100 µs 接通瞬间：CLOCAL 为负时，表示电容向节点供给电流；改变电容比较最低电压。','把 50 µs 改为持续导通，拖动游标到后段；增大 C 只延缓跌落，不消除最终压降。','保存 VIN 电压、VMCU 最低值；换回短窗口比较。3.15 V 虚线只供风险观察，不是芯片复位规格。'],
  boundary:'理想入口 3.3 V，路径纯电阻，负载为电阻加 1 Ω 开关；电容初始 3.3 V。未模拟 ESR/ESL、稳压器控制环路、启动和真实 BOR。3.15 V 为教学观察线，跨线不表示实际 MCU 必然复位。',
  engineering:['在芯片供电脚附近和入口同步测量，触发在负载动作；平均读数不足以排除瞬态。','查芯片供电/复位与稳压器输出电容要求；布局需缩小局部回路，不能仅增加标称电容。','短地回路测纹波；本课没有 ESL 模型，不能据此预测去耦布线或 EMC 合格。'],
  transfers:[{question:'同一电阻负载持续很久，路径 2 Ω、开关与负载共 41 Ω。增大 C 能消除稳态压降吗？',options:[{id:'no',text:'不能；最终 VMCU≈3.3×41/43≈3.147 V'},{id:'yes',text:'能，电容会持续提供额外能量'},{id:'zero',text:'电容最终把电压降到 0 V'}],answer:'no',explanation:'电容稳态不提供持续直流。理想本课模型最终等效为电阻分压。'},
  {question:'长时间平均为 3.3 V，但示波器在芯片供电脚看到短跌落。先做什么？',options:[{id:'verify',text:'核对探头参考和触发，检查芯片端瞬态及真实 BOR 条件'},{id:'ok',text:'平均正确就排除供电问题'},{id:'reset',text:'只要跨过 3.15 V，所有 MCU 都必然复位'}],answer:'verify',explanation:'测量系统、时刻和器件条件共同决定结论；教学观察线不是通用复位门限。'}]
 },
 {
  id:'adc',number:'06',title:'ADC 的采样与参考',subtitle:'表测电压正确，数字为什么偏低？',time:'30 分钟',
  question:'ADC 的输入，真的是一直不取电流吗？',context:'1.65 V 信号经过源电阻与 100 Ω 采样开关，给保持电容充电。开关断开时记录保持电压，再按实际 VREF 推导理想 12 位码。数字码是透明的派生量，模拟节点由内核求解。',goal:'区分源阻抗/采样建立问题和参考电压比例问题，将软件设置连接到电气过程。',
  prediction:'信号源不变，采样电容从 0 V 开始，缩短采样窗口可能怎样？',predictions:[{id:'low',text:'可能未充分建立，保持电压与数字码偏低'},{id:'same',text:'只要万用表测得正确，ADC 一定正确'},{id:'average',text:'采样时间只是软件平均次数'},{id:'unknown',text:'暂时不确定'}],predictionAnswer:'low',predictionExplanation:'采样电容在有限时间内通过源阻抗充电，保持值依赖采样结束时刻。前次电压高于新输入时也可能偏高；这不等同于平均次数或调用间隔。',
  causes:[{id:'settling',text:'源阻抗偏高，采样窗口内未充分建立'},{id:'reference',text:'实际参考为 3.6 V，软件却按 3.3 V 换算'},{id:'voltage',text:'信号源本身低于 1.65 V'}],answers:['settling','reference'],
  explanations:[{id:'time',text:'输入正常、参考 3.3 V；由 5 µs 延长至 20 µs，保持电压明显恢复'},{id:'ratio',text:'输入与保持电压正常；延长采样仍有比例偏差，测得实际 VREF 为 3.6 V'},{id:'single',text:'只凭数字码偏低就证明信号源电压偏低'}],interpretationAnswers:['time','ratio'],
  remedies:[{id:'settling',text:'按目标 ADC 手册增加采样时间或降低源阻抗，复测通道切换与误差'},{id:'reference',text:'核对参考源与软件换算，检查参考去耦和工作范围'},{id:'voltage',text:'直接用平均次数掩盖所有误差'}],
  diagnosis:'标称信号源 1.65 V、保持电容 20 pF、初始 0 V，软件按 3.3 V 参考换算。实际源阻抗或参考可能异常，5 µs 采样时换算电压约 1.51 V。保存 VIN、VREF，并分别记录 5 µs 和 20 µs 的“采样结束电压”，建立完整证据。',
  hints:['低码可能来自保持电压，也可能来自参考比例。','测 VIN 和 VREF；用专用采样结束测量分别保存 5 µs、20 µs 保持电压。','延长后保持电压明显恢复且 VREF=3.3 V，支持建立不足；HOLD 始终约 1.65 V 而 VREF=3.6 V，支持参考换算问题。'],
  tasks:['从 1 µs 开始，比较 10/47/100 kΩ；使用“采样结束电压”，不要把游标任意时刻当成采样结果。','固定其他条件，把窗口延长到 20 µs，再改参考电压，分别观察 HOLD 和数字码。','将前次保持电压改为 3.3 V，再用短窗口观察：建立不足也可能使结果偏高。'],
  boundary:'显式源电阻＋100 Ω 开关＋20/100 pF 教学保持电容，保持端有 1 TΩ 漏电；不对应特定 MCU。保持电压数值验收容差 4 mV，不用于亚 LSB 精度验证。码规则 floor(4096×VHOLD/VREF)，限幅 0…4095。不含完整 SAR、INL/DNL、噪声或校准。3.6 V 参考仅为独立教学模型，不代表实物允许。',
  engineering:['查实际 ADC 源阻抗/采样周期、输入范围、VREF 范围和上电时序；本模型参数不可直接复制。','万用表高阻静态读数不代表动态建立充分；示波器探头也可能加载输入。','如果传感器输出与参考同源，先判断是否为比率测量；参考变化不一定带来相同比例误差。'],
  transfers:[{question:'12 位、3.3 V 满量程，满量程阶跃只建立到 99%，误差大约多大？',options:[{id:'large',text:'约 41 LSB，不能因为曲线接近终值就认为足够'},{id:'zero',text:'不足 1 LSB，可以忽略'},{id:'bits',text:'12 位 ADC 总能得到 12 位有效精度'}],answer:'large',explanation:'理想 1 LSB=3.3/4096≈0.806 mV；满量程的 1% 约 41 LSB。实际精度还受其他误差影响。'},
  {question:'下一通道电压低，前次保持电压高，采样很短。可能出现什么？',options:[{id:'high',text:'保持值来不及下降而偏高；应查通道顺序与建立时间'},{id:'low',text:'建立不足必然偏低'},{id:'delay',text:'只延长两次调用间隔就一定改善采样窗口'}],answer:'high',explanation:'建立误差方向取决于初始状态与新输入。延长调用间隔不一定延长实际采样开关接通时间。'}]
 }
];
