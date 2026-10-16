import type { LessonId, MeasurementKind, Params } from './types';
export const COURSE_VERSION = '0.4';
export type Control = { key: keyof Params; label: string; options: [number, string][] };
export const views: Record<LessonId, { nodes: string[]; branches: string[]; chart: string[]; thresholds: number[]; cursor: number; tags: string[]; extra: [MeasurementKind, string][] }> = {
  debounce:{nodes:['RAW','FILTER','OUT','GND'],branches:['FILTER_R','C','LOAD'],chart:['RAW','FILTER','OUT'],thresholds:[.99,2.31],cursor:12.5,tags:['接点弹跳','迟滞','响应延迟'],extra:[['edges','窗口上升沿计数'],['peak','捕获峰值']]},
  opamp:{nodes:['VIN','PLUS','FB','VOUT','GND'],branches:['SOURCE','RF','RG','LOAD'],chart:['VIN','VOUT','FB'],thresholds:[],cursor:100,tags:['负反馈','增益','输出饱和'],extra:[]},
  spi:{nodes:['TX','DATA','CLK','SAMPLE','GND'],branches:['SERIES_R','CLINE','INPUT'],chart:['TX','DATA','CLK'],thresholds:[.99,2.31],cursor:50,tags:['采样沿','建立与保持','边沿负载'],extra:[['rise','DATA 30%–70% 上升时间'],['aperture','改变沿至采样沿最短间隔'],['violations','不保证的采样事件数']]},
  mosfet:{nodes:['VIN','VLOAD','DRAIN','GATE','SOURCE','GND'],branches:['PATH','LOAD'],chart:['VIN','DRAIN','GATE'],thresholds:[],cursor:100,tags:['栅源电压','带载压降','功耗'],extra:[]},
  flyback:{nodes:['VIN','COIL','SW','CLREF','CTRL','GND'],branches:['RCOIL','LCOIL','DCLAMP'],chart:['VIN','SW'],thresholds:[],cursor:15,tags:['电流连续','关断钳位','释放时间'],extra:[['peak','捕获峰值'],['decay','线圈电流降至 10% 时间']]},
  pcb:{nodes:['VPOWER','GLOAD','SGND','SIG','CTRL','GND'],branches:['LOAD','RETURN','INPUT'],chart:['SIG','SGND'],thresholds:[],cursor:31.25,tags:['参考地','共用阻抗','回流路径'],extra:[]},
  divider:{nodes:['VIN','VOUT','GND'],branches:['R1','R2','RL'],chart:['VIN','VOUT'],thresholds:[],cursor:100,tags:['电压差','带载','仪表负载'],extra:[]},
  rc:{nodes:['VIN','VC','GND'],branches:['R'],chart:['VIN','VC'],thresholds:[.99,2.31],cursor:25,tags:['充放电','时间常数','门限'],extra:[['peak','捕获峰值']]},
  i2c:{nodes:['VDD','BUS','CTRL','GND'],branches:['RP'],chart:['BUS'],thresholds:[.99,2.31],cursor:25,tags:['开漏','边沿','探头电容'],extra:[['rise','30%–70% 上升时间']]},
  gpio:{nodes:['VDD','PIN','GND'],branches:['HIGH','LOW','PULL','LOAD','LEAK'],chart:['VDD','PIN'],thresholds:[.99,2.31],cursor:100,tags:['推挽与高阻','上下拉','驱动能力'],extra:[]},
  power:{nodes:['VIN','VMCU','CTRL','GND'],branches:['PATH','CLOCAL','LOAD'],chart:['VIN','VMCU'],thresholds:[3.15],cursor:15,tags:['负载瞬态','局部储能','测量窗口'],extra:[['minimum','VMCU 窗口最低值']]},
  adc:{nodes:['VIN','A_PIN','HOLD','CTRL','VREF','GND'],branches:['SOURCE','CHOLD'],chart:['VIN','HOLD','VREF'],thresholds:[],cursor:100,tags:['采样保持','源阻抗','参考电压'],extra:[['held','采样结束电压'],['code','理想 12 位数字码']]}
};
export const extraControls: Partial<Record<LessonId, Control[]>> = {
 debounce:[{key:'inputMode',label:'输入情境',options:[[0,'单次按键 + 两次反跳'],[1,'慢正弦 + 阈值附近扰动']]},{key:'resistance',label:'滤波电阻',options:[[1000,'1 kΩ'],[10000,'10 kΩ'],[47000,'47 kΩ']]},{key:'capacitance',label:'滤波电容',options:[[.1e-6,'0.1 µF'],[1e-6,'1 µF'],[2.2e-6,'2.2 µF']]},{key:'hysteresis',label:'接收门限',options:[[1,'迟滞：0.99 / 2.31 V'],[0,'单门限：1.65 V']]},{key:'pressTime',label:'按住时间',options:[[.003,'3 ms'],[.008,'8 ms'],[.015,'15 ms']]}],
 opamp:[{key:'signalVoltage',label:'已知输入电压',options:[[.4,'0.4 V'],[1,'1.0 V'],[1.65,'1.65 V']]},{key:'closedGain',label:'反馈设置的理想增益',options:[[1,'1 倍（缓冲）'],[2,'2 倍'],[3,'3 倍']]},{key:'outputLimit',label:'教学输出上限',options:[[1.6,'1.6 V'],[2.8,'2.8 V'],[3.2,'3.2 V']]},{key:'load',label:'输出负载',options:[[1000,'1 kΩ'],[10000,'10 kΩ'],[100000,'100 kΩ']]}],
 spi:[{key:'clockFrequency',label:'时钟频率',options:[[500000,'500 kHz'],[1000000,'1 MHz'],[2000000,'2 MHz']]},{key:'resistance',label:'数据路径电阻',options:[[100,'100 Ω'],[1000,'1 kΩ'],[2200,'2.2 kΩ']]},{key:'capacitance',label:'数据端电容',options:[[100e-12,'100 pF'],[200e-12,'200 pF']]},{key:'sampleEdge',label:'接收采样沿',options:[[0,'CLK 上升沿'],[1,'CLK 下降沿（与改变沿同侧）']]}],
 mosfet:[{key:'gate',label:'栅极对 GND 电压',options:[[0,'0 V'],[1.8,'1.8 V'],[3.3,'3.3 V'],[5,'5 V']]},{key:'sourceOffset',label:'源极对 GND 电压',options:[[0,'0 V'],[1.5,'1.5 V（参考抬升）']]},{key:'pathResistance',label:'供电路径电阻',options:[[1,'1 Ω'],[10,'10 Ω'],[47,'47 Ω']]},{key:'load',label:'电阻负载',options:[[40,'40 Ω'],[100,'100 Ω'],[330,'330 Ω']]}],
 flyback:[{key:'load',label:'线圈等效电阻',options:[[47,'47 Ω'],[100,'100 Ω'],[220,'220 Ω']]},{key:'inductance',label:'线圈等效电感',options:[[.01,'10 mH'],[.02,'20 mH'],[.05,'50 mH']]},{key:'protection',label:'续流吸收等效',options:[[0,'普通续流（二极管）'],[12,'二极管 + 12 V 理想吸收'],[24,'二极管 + 24 V 理想吸收']]},{key:'pulse',label:'关断前导通时间',options:[[.001,'1 ms'],[.002,'2 ms']]}],
 pcb:[{key:'layout',label:'传感器回流接法',options:[[0,'共用负载回流段'],[1,'独立返回参考点']]},{key:'pathResistance',label:'负载回流段电阻',options:[[.1,'0.1 Ω'],[.5,'0.5 Ω'],[1,'1 Ω（教学放大）']]},{key:'load',label:'脉冲负载',options:[[40,'40 Ω'],[100,'100 Ω'],[330,'330 Ω']]},{key:'signalNoise',label:'传感器自身同步变化',options:[[0,'无变化：1.65 V'],[.1,'+0.1 V（独立注入）']]}],
 gpio:[{key:'drive',label:'引脚配置',options:[[1,'推挽高'],[2,'推挽低'],[3,'开漏释放'],[4,'开漏拉低'],[0,'输入高阻']]},{key:'resistance',label:'外部上拉',options:[[0,'无上拉'],[4700,'4.7 kΩ'],[40000,'40 kΩ 教学弱上拉']]},{key:'load',label:'外部负载',options:[[25,'25 Ω（仅仿真）'],[1000,'1 kΩ'],[10000,'10 kΩ']]}],
 power:[{key:'resistance',label:'供电路径电阻',options:[[1,'1 Ω'],[2,'2 Ω'],[10,'10 Ω']]},{key:'capacitance',label:'局部电容',options:[[1e-6,'1 µF'],[10e-6,'10 µF'],[47e-6,'47 µF']]},{key:'load',label:'脉冲电阻负载',options:[[40,'40 Ω'],[100,'100 Ω'],[330,'330 Ω']]},{key:'pulse',label:'负载导通时间',options:[[50e-6,'50 µs'],[300e-6,'300 µs'],[0,'持续导通']]}],
 adc:[{key:'resistance',label:'信号源电阻',options:[[10000,'10 kΩ'],[47000,'47 kΩ'],[100000,'100 kΩ']]},{key:'capacitance',label:'采样电容（教学）',options:[[20e-12,'20 pF'],[100e-12,'100 pF']]},{key:'sampleTime',label:'采样窗口',options:[[.2e-6,'0.2 µs'],[1e-6,'1 µs'],[5e-6,'5 µs'],[20e-6,'20 µs']]},{key:'reference',label:'实际参考电压',options:[[3,'3.0 V'],[3.3,'3.3 V'],[3.6,'3.6 V（教学）']]},{key:'initial',label:'前次保持电压',options:[[0,'0 V'],[3.3,'3.3 V']]}]
};
export const measurementNotes: Record<LessonId,string> = {
 debounce:'上升沿计数以 1.65 V 为观察线，不把初始状态算作边沿。RAW 是预制输入；OUT 来自原生接收元件。迟滞是电压记忆，不能保证消除完整幅度反跳。诊断请在 8 ms 按住条件下取证。',
 opamp:'PLUS 是同相输入，FB 是反相输入。负反馈在线性范围内才使两者接近；饱和后不能直接使用“虚短”。教学上限是输出模型参数，并非真实电源脚。输入共模范围、带宽、输出限流和热均未建模。',
 spi:'TX 在 CLK 下降沿改变；DATA 经 R-C 到达接收端。SAMPLE 是教学采样标记，不是额外 SPI 信号线。以实际波形核对 50 ns 建立 + 50 ns 保持窗口，只观察 3 个稳态事件，不解码协议帧。',
 mosfet:'测 VGS 时红表笔接 GATE、黑表笔接 SOURCE。PATH/LOAD 电流沿 VIN → VLOAD → DRAIN。功耗为求解得到的 VDS×I；模型不计算温升或安全工作区。',
 flyback:'RCOIL/LCOIL 正向为 VIN → SW；DCLAMP 为 SW → CLREF。峰值请选择 SW。10% 时间从开关断开的首个完整求解步起算，是电气电流衰减时间，不是机械释放时间。',
 pcb:'在 150–350 µs 平台上，用同一次捕获、同一游标分别保存 SIG−SGND、SGND−GND、SIG−GND。GND 是 MCU 参考点；地符号并不消除路径阻抗。负载开关与传感器同步变化为两个独立激励。',
 divider:'测量练习：改用 1 MΩ 分压，比较理想、1 MΩ 和 10 MΩ 仪表输入。表笔也是负载。',
 rc:'测量练习：先选择时间窗口再解释峰值。游标是历史样本，原理图显示捕获结束状态。',
 i2c:'测量练习：接入 10/100 pF 探头模型，比较上升时间；探头电容会加入总线负载，图中 CB_TOTAL 显示两者之和。',
 gpio:'HIGH：VDD→PIN；LOW/LOAD/LEAK：PIN→GND。高阻模型有显式 1 MΩ 对地漏电，并不预测真实悬空噪声。',
 power:'PATH：VIN→VMCU；CLOCAL：VMCU→GND。负电容电流表示向节点供电。负载在 100 µs 接通，开关导通电阻 1 Ω。',
  adc:'SOURCE：VIN→A_PIN；CHOLD：HOLD→GND。CTRL 下降后取开关断开的首个完整求解步，实际时刻见读数。数字码由保持电压和实际 VREF 推导。'
};
export const diagnosticControls:Partial<Record<LessonId,(keyof Params)[]>>={gpio:['resistance'],power:['pulse'],adc:['sampleTime'],mosfet:['load'],flyback:['pulse'],pcb:[],debounce:['pressTime'],opamp:['signalVoltage'],spi:['clockFrequency']};
