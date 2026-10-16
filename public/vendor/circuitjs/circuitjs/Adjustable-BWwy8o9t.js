import { c as CircuitElm, p as parseIntStrict, r as parseFloatStrict, j as CustomLogicModel, a as CirSim, b as CircuitXMLSerializer } from './CircuitElm-D0NL-LPP.js';
import { S as Scrollbar } from './UIManager-Bxtki72o.js';
import './EditSubcircuitModelDialog-C5vUSIFP.js';
import './KeyNames-CtQ8ZgWT.js';

class Adjustable {
  elm;
  minValue;
  maxValue;
  sliderStep;
  // step increment; 0 = continuous (no stepping)
  flags;
  sliderText;
  logarithmic;
  // null if this Adjustable has its own slider, non-null if it's sharing another one.
  sharedSlider;
  FLAG_SHARED = 1;
  FLAG_LOG = 2;
  // index of value in getEditInfo() list that this slider controls
  editItem;
  label;
  slider;
  settingValue;
  constructor(ceOrSt, itemOrSim) {
    if (ceOrSt instanceof CircuitElm) {
      const ce = ceOrSt;
      const item = itemOrSim;
      this.minValue = 1;
      this.maxValue = 1e3;
      this.flags = 0;
      this.elm = ce;
      this.editItem = item;
      this.sliderText = "";
      this.sliderStep = 0;
      this.logarithmic = false;
      this.sharedSlider = null;
      this.label = null;
      this.slider = null;
      this.settingValue = false;
      const ei = ce.getEditInfo(item);
      if (ei != null && ei.maxVal > 0) {
        this.minValue = ei.minVal;
        this.maxValue = ei.maxVal;
      }
    } else {
      const st = ceOrSt;
      const sim = itemOrSim;
      this.minValue = 1;
      this.maxValue = 1e3;
      this.flags = 0;
      this.elm = null;
      this.editItem = 0;
      this.sliderText = "";
      this.sliderStep = 0;
      this.logarithmic = false;
      this.sharedSlider = null;
      this.label = null;
      this.slider = null;
      this.settingValue = false;
      const e = parseIntStrict(st.nextToken());
      if (e === -1)
        return;
      try {
        let ei = st.nextToken();
        if (ei.startsWith("F")) {
          this.flags = parseIntStrict(ei.substring(1));
          ei = st.nextToken();
        }
        this.editItem = parseIntStrict(ei);
        this.minValue = parseFloatStrict(st.nextToken());
        this.maxValue = parseFloatStrict(st.nextToken());
        if ((this.flags & this.FLAG_SHARED) !== 0) {
          const ano = parseIntStrict(st.nextToken());
          this.sharedSlider = ano === -1 ? null : sim.adjustables[ano];
        }
        this.sliderText = CustomLogicModel.unescape(st.nextToken());
      } catch (ex) {
      }
      this.logarithmic = (this.flags & this.FLAG_LOG) !== 0;
      try {
        this.sliderStep = parseFloatStrict(st.nextToken());
      } catch (ex) {
      }
      try {
        this.elm = sim.getElm(e);
      } catch (ex) {
      }
    }
  }
  createSlider(sim) {
    if (this.elm == null)
      return false;
    const ei = this.elm.getEditInfo(this.editItem);
    if (ei == null)
      return false;
    if (this.sharedSlider != null)
      return true;
    if (this.sliderText.length === 0)
      return false;
    const value = ei.value;
    this.createSliderWithValue(sim, value);
    return true;
  }
  createSliderWithValue(sim, value) {
    const lbl = document.createElement("label");
    lbl.textContent = this.sliderText;
    lbl.classList.add("topSpace");
    this.label = lbl;
    sim.addWidgetToVerticalPanel(lbl);
    const intValue = this.valueToSliderPosition(value);
    this.slider = new Scrollbar(Scrollbar.HORIZONTAL, intValue, 1, 0, 100);
    if (this.sliderStep > 0 && this.maxValue !== this.minValue)
      this.slider.setStepSize(this.sliderStep * 100 / (this.maxValue - this.minValue));
    this.slider.addChangeHandler(() => this.execute());
    sim.addWidgetToVerticalPanel(this.slider.element);
  }
  setSliderValue(value) {
    if (this.sharedSlider != null) {
      this.sharedSlider.setSliderValue(value);
      return;
    }
    if (this.slider == null)
      return;
    const intValue = this.valueToSliderPosition(value);
    this.settingValue = true;
    this.slider.setValue(intValue);
    this.settingValue = false;
  }
  execute() {
    if (this.settingValue)
      return;
    const sim = CirSim.theApp;
    for (let i = 0; i !== sim.adjustables.length; i++) {
      const adj = sim.adjustables[i];
      if (adj === this || adj.sharedSlider === this)
        adj.executeSlider();
    }
  }
  executeSlider() {
    CirSim.theApp.analyzeFlag = true;
    if (this.elm == null) return;
    const ei = this.elm.getEditInfo(this.editItem);
    if (ei == null) return;
    ei.value = this.getSliderValue();
    this.elm.setEditValue(this.editItem, ei);
    CirSim.theApp.repaint();
  }
  getSliderValue() {
    const val = this.sharedSlider == null ? this.slider ? this.slider.getValue() : 0 : this.sharedSlider.slider ? this.sharedSlider.slider.getValue() : 0;
    let result = this.sliderPositionToValue(val);
    const step = this.sharedSlider != null ? this.sharedSlider.sliderStep : this.sliderStep;
    if (step > 0)
      result = this.minValue + Math.round((result - this.minValue) / step) * step;
    return result;
  }
  // convert a value to a slider position (0-100)
  valueToSliderPosition(value) {
    if (this.logarithmic && this.minValue > 0) {
      const logMin = Math.log(this.minValue);
      const logMax = Math.log(this.maxValue);
      return Math.floor((Math.log(value) - logMin) / (logMax - logMin) * 100);
    }
    return Math.floor((value - this.minValue) * 100 / (this.maxValue - this.minValue));
  }
  // convert a slider position (0-100) to a value
  sliderPositionToValue(pos) {
    if (this.logarithmic && this.minValue > 0) {
      const logMin = Math.log(this.minValue);
      const logMax = Math.log(this.maxValue);
      return Math.exp(logMin + (logMax - logMin) * pos / 100);
    }
    return this.minValue + (this.maxValue - this.minValue) * pos / 100;
  }
  deleteSlider(sim) {
    try {
      if (this.label) sim.removeWidgetFromVerticalPanel(this.label);
      if (this.slider) sim.removeWidgetFromVerticalPanel(this.slider.element);
    } catch (e) {
    }
    this.label = null;
    this.slider = null;
  }
  setMouseElm(e) {
    if (this.slider != null)
      this.slider.draw();
  }
  sliderBeingShared() {
    for (let i = 0; i !== CirSim.theApp.adjustables.length; i++) {
      const adj = CirSim.theApp.adjustables[i];
      if (adj.sharedSlider === this)
        return true;
    }
    return false;
  }
  dump() {
    let ano = -1;
    if (this.sharedSlider != null)
      ano = CirSim.theApp.adjustables.indexOf(this.sharedSlider);
    let dumpFlags = 0;
    if (this.sharedSlider != null)
      dumpFlags |= this.FLAG_SHARED;
    if (this.logarithmic)
      dumpFlags |= this.FLAG_LOG;
    return CirSim.theApp.locateElm(this.elm) + " F" + dumpFlags + " " + this.editItem + " " + this.minValue + " " + this.maxValue + " " + ano + " " + CustomLogicModel.escape(this.sliderText) + " " + this.sliderStep;
  }
  // get the unlocalized name of the edit item this adjustable controls
  getEditItemName() {
    if (this.elm == null) return "";
    const ei = this.elm.getEditInfo(this.editItem);
    return ei != null ? ei.name : "";
  }
  // find the edit item index by name, falling back to the given index
  static findEditItemByName(elm, name, fallbackIndex) {
    if (elm != null && name != null && name.length > 0) {
      for (let i = 0; ; i++) {
        const ei = elm.getEditInfo(i);
        if (ei == null)
          break;
        if (name === ei.name)
          return i;
      }
    }
    return fallbackIndex;
  }
  dumpXml(doc, root, app) {
    const ae = doc.createElement("adj");
    CircuitXMLSerializer.dumpAttr(ae, "e", app.locateElm(this.elm));
    CircuitXMLSerializer.dumpAttr(ae, "ei", this.editItem);
    CircuitXMLSerializer.dumpAttr(ae, "en", this.getEditItemName());
    CircuitXMLSerializer.dumpAttr(ae, "mn", this.minValue);
    CircuitXMLSerializer.dumpAttr(ae, "mx", this.maxValue);
    CircuitXMLSerializer.dumpAttr(ae, "st", this.sliderText);
    if (this.sliderStep > 0)
      CircuitXMLSerializer.dumpAttr(ae, "stp", this.sliderStep);
    if (this.sharedSlider != null)
      CircuitXMLSerializer.dumpAttr(ae, "ss", app.adjustables.indexOf(this.sharedSlider));
    if (this.logarithmic)
      CircuitXMLSerializer.dumpAttr(ae, "log", 1);
    root.appendChild(ae);
  }
  static undumpXml(xml, app) {
    const e = xml.parseIntAttr("e", -1);
    if (e === -1)
      return;
    const ei = xml.parseIntAttr("ei", 0);
    const en = xml.parseStringAttr("en", null);
    const elm = app.getElm(e);
    const item = Adjustable.findEditItemByName(elm, en, ei);
    const adj = new Adjustable(elm, item);
    adj.minValue = xml.parseDoubleAttr("mn", 1);
    adj.maxValue = xml.parseDoubleAttr("mx", 1e3);
    adj.sliderText = xml.parseStringAttr("st", "") ?? "";
    adj.sliderStep = xml.parseDoubleAttr("stp", 0);
    const ss = xml.parseIntAttr("ss", -1);
    if (ss !== -1)
      adj.sharedSlider = app.adjustables[ss];
    adj.logarithmic = xml.parseIntAttr("log", 0) !== 0;
    app.adjustables.push(adj);
  }
  // reorder adjustables so that items with sliders come first in the list, followed by items that reference them.
  // this simplifies the UI code, and also makes it much easier to dump/undump the adjustables list, since we will
  // always be undumping the adjustables with sliders first, then the adjustables that reference them.
  static reorderAdjustables() {
    const newList = [];
    const oldList = CirSim.theApp.adjustables;
    for (let i = 0; i !== oldList.length; i++) {
      if (oldList[i].sharedSlider == null)
        newList.push(oldList[i]);
    }
    for (let i = 0; i !== oldList.length; i++) {
      if (oldList[i].sharedSlider != null)
        newList.push(oldList[i]);
    }
    CirSim.theApp.adjustables = newList;
  }
}
window.Adjustable = Adjustable;

export { Adjustable };
