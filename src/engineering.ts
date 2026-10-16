import type { LessonId } from './types';
export const references:Partial<Record<LessonId,[string,string][]>>={
 debounce:[['TI：施密特迟滞、慢边沿与去抖','https://www.ti.com/lit/ab/scea046b/scea046b.pdf']],
 opamp:[['ADI：单电源运放的输入共模与输出范围','https://www.analog.com/en/resources/technical-articles/design-tradeoffs-for-singlesupply-op-amps.html']],
 spi:[['ST AN5543：SPI 时序、引脚负载和通信条件','https://www.st.com/resource/en/application_note/an5543-guidelines-for-enhanced-spi-communication-on-stm32-mcus-and-mpus-stmicroelectronics.pdf']],
 mosfet:[['TI MOSFET 数据手册：阈值测试与导通条件（示例器件，非本课模型）','https://www.ti.com/lit/ds/symlink/csd19537q3.pdf']],
 flyback:[['TI：感性负载关断、续流与快速消磁','https://www.ti.com/document-viewer/lit/html/SNVAA45']],
 pcb:[['ADI：参考地与共用阻抗','https://www.analog.com/en/resources/analog-dialogue/articles/staying-well-grounded.html'],['TI：高速布局与回流路径','https://www.ti.com/lit/an/scaa082a/scaa082a.pdf']],
 gpio:[['ST GPIO 硬件与电气指南','https://www.st.com/resource/en/application_note/an4899-stm32-microcontroller-gpio-hardware-settings-and-lowpower-consumption-stmicroelectronics.pdf']],
 power:[['ADI MT-101：实际去耦与连接路径','https://www.analog.com/media/en/training-seminars/tutorials/mt-101.pdf'],['ST：MCU 供电与复位','https://wiki.st.com/stm32mcu/wiki/Basics_of_power_supply_design_for_MCU']],
 adc:[['ST AN2834：ADC 源阻抗、采样与参考','https://www.st.com/resource/en/application_note/an2834-how-to-get-the-best-adc-accuracy-in-stm32-microcontrollers-stmicroelectronics.pdf']],
 divider:[['Tektronix：探头与仪表负载','https://www.tek.com/en/documents/whitepaper/abcs-probes-primer']],
 i2c:[['TI：I²C 上拉计算','https://www.ti.com/lit/an/slva689/slva689.pdf'],['Tektronix：探头影响','https://www.tek.com/en/documents/whitepaper/abcs-probes-primer']]
};
