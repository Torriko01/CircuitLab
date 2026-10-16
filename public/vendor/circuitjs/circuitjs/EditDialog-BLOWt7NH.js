import { c as CircuitElm, p as parseIntStrict, r as parseFloatStrict, b as CircuitXMLSerializer, f as Color, L as Locale, E as EditInfo, d as Choice, e as Checkbox, F as FindPathInfo, g as Dialog, a as CirSim } from './CircuitElm-D0NL-LPP.js';
import { U as UIManager } from './UIManager-Bxtki72o.js';

class VoltageElm extends CircuitElm {
  static FLAG_COS = 2;
  static FLAG_PULSE_DUTY = 4;
  static FLAG_CIRCLE_SYMBOL = 8;
  static FLAG_SHOW_VOLTAGE = 16;
  static FLAG_TIME_SPEC = 32;
  // this is separate because old RailElms may have FLAG_SHOW_VOLTAGE set even though it didn't do anything
  static FLAG_SHOW_VOLTAGE_RAIL = 64;
  waveform;
  static WF_DC = 0;
  static WF_AC = 1;
  static WF_SQUARE = 2;
  static WF_TRIANGLE = 3;
  static WF_SAWTOOTH = 4;
  static WF_PULSE = 5;
  static WF_NOISE = 6;
  static WF_VAR = 7;
  frequency;
  maxVoltage;
  freqTimeZero;
  bias;
  phaseShift;
  dutyCycle;
  noiseValue;
  riseTime;
  internalResistance = 0;
  getInternalNodeCount() {
    return this.internalResistance > 0 ? 1 : 0;
  }
  static defaultPulseDuty = 1 / (2 * Math.PI);
  constructor(xa, ya, xbOrWf, yb, f, st) {
    if (yb === void 0) {
      super(xa, ya);
      this.waveform = xbOrWf;
      this.maxVoltage = 5;
      this.frequency = 60;
      this.dutyCycle = 0.5;
      this.bias = 0;
      this.phaseShift = 0;
      this.noiseValue = 0;
      this.riseTime = 0;
      this.freqTimeZero = 0;
      this.flags |= VoltageElm.FLAG_SHOW_VOLTAGE;
      this.reset();
    } else {
      super(xa, ya, xbOrWf, yb, f);
      this.maxVoltage = 5;
      this.frequency = 40;
      this.waveform = VoltageElm.WF_DC;
      this.dutyCycle = 0.5;
      this.bias = 0;
      this.phaseShift = 0;
      this.noiseValue = 0;
      this.riseTime = 0;
      this.freqTimeZero = 0;
      try {
        this.waveform = parseIntStrict(st.nextToken());
        this.frequency = parseFloatStrict(st.nextToken());
        this.maxVoltage = parseFloatStrict(st.nextToken());
        this.bias = parseFloatStrict(st.nextToken());
        this.phaseShift = parseFloatStrict(st.nextToken());
        this.dutyCycle = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
      if ((this.flags & VoltageElm.FLAG_COS) != 0) {
        this.flags &= ~VoltageElm.FLAG_COS;
        this.phaseShift = VoltageElm.pi / 2;
      }
      if ((this.flags & VoltageElm.FLAG_PULSE_DUTY) == 0 && this.waveform == VoltageElm.WF_PULSE) {
        this.dutyCycle = VoltageElm.defaultPulseDuty;
      }
      this.reset();
    }
  }
  getDumpType() {
    return "v".charCodeAt(0);
  }
  getDragVertical(requestedVertical) {
    return true;
  }
  // point 2, not point 1, should track the mouse during toolbar drag-and-drop
  dragPlace(xa, ya, vertical) {
    super.dragPlace(xa, ya, vertical);
    this.swapDragEndpoints();
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "wf", this.waveform);
    if (this.waveform != VoltageElm.WF_DC)
      CircuitXMLSerializer.dumpAttr(elem, "fr", this.frequency);
    CircuitXMLSerializer.dumpAttr(elem, "maxv", this.maxVoltage);
    if (this.bias != 0)
      CircuitXMLSerializer.dumpAttr(elem, "bias", this.bias);
    if (this.phaseShift != 0)
      CircuitXMLSerializer.dumpAttr(elem, "phaseShift", this.phaseShift);
    if (this.dutyCycle != 0.5)
      CircuitXMLSerializer.dumpAttr(elem, "dutyCycle", this.dutyCycle);
    if (this.riseTime != 0)
      CircuitXMLSerializer.dumpAttr(elem, "riseTime", this.riseTime);
    if (this.internalResistance != 0)
      CircuitXMLSerializer.dumpAttr(elem, "ir", this.internalResistance);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.waveform = xml.parseIntAttr("wf", this.waveform);
    this.frequency = xml.parseDoubleAttr("fr", this.frequency);
    this.maxVoltage = xml.parseDoubleAttr("maxv", this.maxVoltage);
    this.bias = xml.parseDoubleAttr("bias", this.bias);
    this.phaseShift = xml.parseDoubleAttr("phaseShift", this.phaseShift);
    this.dutyCycle = xml.parseDoubleAttr("dutyCycle", this.dutyCycle);
    this.riseTime = xml.parseDoubleAttr("riseTime", this.riseTime);
    this.internalResistance = xml.parseDoubleAttr("ir", 0);
  }
  reset() {
    this.freqTimeZero = 0;
    this.curcount = 0;
  }
  triangleFunc(x) {
    if (x < VoltageElm.pi)
      return x * (2 / VoltageElm.pi) - 1;
    return 1 - (x - VoltageElm.pi) * (2 / VoltageElm.pi);
  }
  getVoltageSource() {
    return this.voltSource;
  }
  setVoltageSource(n, v) {
    super.setVoltageSource(n, v);
    if (this.internalResistance > 0)
      v.setNodes(this.nodes[0], this.nodes[2]);
    else
      v.setNodes(this.nodes[0], this.nodes[1]);
  }
  stamp() {
    const vsNode2 = this.internalResistance > 0 ? this.nodes[2] : this.nodes[1];
    if (this.waveform == VoltageElm.WF_DC)
      CircuitElm.sim.stampVoltageSource(this.nodes[0], vsNode2, this.voltSource, this.getVoltage());
    else
      CircuitElm.sim.stampVoltageSource(this.nodes[0], vsNode2, this.voltSource);
    if (this.internalResistance > 0)
      CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[1], this.internalResistance);
  }
  doStep() {
    const vsNode2 = this.internalResistance > 0 ? this.nodes[2] : this.nodes[1];
    if (this.waveform != VoltageElm.WF_DC)
      CircuitElm.sim.updateVoltageSource(this.nodes[0], vsNode2, this.voltSource, this.getVoltage());
  }
  stepFinished() {
    if (this.waveform == VoltageElm.WF_NOISE)
      this.noiseValue = (CircuitElm.app.random.nextDouble() * 2 - 1) * this.maxVoltage + this.bias;
  }
  getVoltage() {
    if (this.waveform != VoltageElm.WF_DC && this.doDcAnalysis())
      return this.bias;
    const w = 2 * VoltageElm.pi * (CircuitElm.sim.t - this.freqTimeZero) * this.frequency + this.phaseShift;
    switch (this.waveform) {
      case VoltageElm.WF_DC:
        return this.maxVoltage + this.bias;
      case VoltageElm.WF_AC:
        return Math.sin(w) * this.maxVoltage + this.bias;
      case VoltageElm.WF_SQUARE: {
        const wm = w % (2 * VoltageElm.pi);
        const dutyPhase = 2 * VoltageElm.pi * this.dutyCycle;
        if (this.riseTime > 0) {
          const risePhase = this.riseTime * this.frequency * 2 * VoltageElm.pi;
          const halfRise = risePhase / 2;
          if (wm < halfRise) {
            const t = (wm + halfRise) / risePhase;
            return this.bias + this.maxVoltage * (2 * t - 1);
          } else if (wm < dutyPhase - halfRise)
            return this.bias + this.maxVoltage;
          else if (wm < dutyPhase + halfRise) {
            const t = (wm - dutyPhase + halfRise) / risePhase;
            return this.bias + this.maxVoltage * (1 - 2 * t);
          } else if (wm < 2 * VoltageElm.pi - halfRise)
            return this.bias - this.maxVoltage;
          else {
            const t = (wm - (2 * VoltageElm.pi - halfRise)) / risePhase;
            return this.bias + this.maxVoltage * (2 * t - 1);
          }
        }
        return this.bias + (wm > dutyPhase ? -this.maxVoltage : this.maxVoltage);
      }
      case VoltageElm.WF_TRIANGLE:
        return this.bias + this.triangleFunc(w % (2 * VoltageElm.pi)) * this.maxVoltage;
      case VoltageElm.WF_SAWTOOTH:
        return this.bias + w % (2 * VoltageElm.pi) * (this.maxVoltage / VoltageElm.pi) - this.maxVoltage;
      case VoltageElm.WF_PULSE: {
        const wm = w % (2 * VoltageElm.pi);
        const dutyPhase = 2 * VoltageElm.pi * this.dutyCycle;
        if (this.riseTime > 0) {
          const risePhase = this.riseTime * this.frequency * 2 * VoltageElm.pi;
          const halfRise = risePhase / 2;
          if (wm < halfRise) {
            const t = (wm + halfRise) / risePhase;
            return this.bias + this.maxVoltage * t;
          } else if (wm < dutyPhase - halfRise)
            return this.bias + this.maxVoltage;
          else if (wm < dutyPhase + halfRise) {
            const t = (wm - dutyPhase + halfRise) / risePhase;
            return this.bias + this.maxVoltage * (1 - t);
          } else if (wm < 2 * VoltageElm.pi - halfRise)
            return this.bias;
          else {
            const t = (wm - (2 * VoltageElm.pi - halfRise)) / risePhase;
            return this.bias + this.maxVoltage * t;
          }
        }
        return wm < dutyPhase ? this.maxVoltage + this.bias : this.bias;
      }
      case VoltageElm.WF_NOISE:
        return this.noiseValue;
      default:
        return 0;
    }
  }
  circleSize = 17;
  setPoints() {
    super.setPoints();
    if (this.waveform == VoltageElm.WF_DC && (this.flags & VoltageElm.FLAG_CIRCLE_SYMBOL) != 0)
      this.calcLeads(this.circleSize * 2);
    else
      this.calcLeads(this.waveform == VoltageElm.WF_DC || this.waveform == VoltageElm.WF_VAR ? 8 : this.circleSize * 2);
  }
  draw(g) {
    this.setBbox(this.x, this.y, this.x2, this.y2);
    this.draw2Leads(g);
    if (this.waveform == VoltageElm.WF_DC && (this.flags & VoltageElm.FLAG_CIRCLE_SYMBOL) != 0) {
      this.setBbox(this.point1, this.point2, this.circleSize);
      this.interpPoint(this.lead1, this.lead2, CircuitElm.ps1, 0.5);
      const xc = CircuitElm.ps1.x;
      const yc = CircuitElm.ps1.y;
      g.setColor(this.needsHighlight() ? VoltageElm.selectColor : Color.gray);
      this.setPowerColor(g, false);
      CircuitElm.drawThickCircle(g, xc, yc, this.circleSize);
      this.adjustBbox(
        xc - this.circleSize,
        yc - this.circleSize,
        xc + this.circleSize,
        yc + this.circleSize
      );
      const signSize = 4;
      const plusPos = 0.74;
      const minusPos = 0.26;
      this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, plusPos, signSize);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
      const delta = signSize / (this.circleSize * 2);
      const pA = this.interpPoint(this.lead1, this.lead2, plusPos - delta);
      const pB = this.interpPoint(this.lead1, this.lead2, plusPos + delta);
      CircuitElm.drawThickLine(g, pA, pB);
      this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, minusPos, signSize);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
    } else if (this.waveform == VoltageElm.WF_DC) {
      this.setVoltageColor(g, this.nodes[0].v);
      this.setPowerColor(g, false);
      this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, 0, 10);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
      this.setVoltageColor(g, this.nodes[1].v);
      this.setPowerColor(g, false);
      const hs = 16;
      this.setBbox(this.point1, this.point2, hs);
      this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, 1, hs);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
    } else {
      this.setBbox(this.point1, this.point2, this.circleSize);
      this.interpPoint(this.lead1, this.lead2, CircuitElm.ps1, 0.5);
      this.drawWaveform(g, CircuitElm.ps1);
      let inds;
      if (this.bias > 0 || this.bias == 0 && this.waveform == VoltageElm.WF_PULSE)
        inds = "+";
      else
        inds = "*";
      g.setColor(VoltageElm.whiteColor);
      g.setFont(VoltageElm.unitsFont);
      const plusPoint = this.interpPoint(this.point1, this.point2, (this.dn / 2 + this.circleSize + 4) / this.dn, 10 * this.dsign);
      plusPoint.y += 4;
      const w = Math.round(g.context.measureText(inds).width);
      g.drawString(inds, plusPoint.x - w / 2, plusPoint.y);
    }
    if (this.dx == 0 || this.dy == 0) {
      const showV = (this.flags & VoltageElm.FLAG_SHOW_VOLTAGE) != 0;
      const showF = this.showValues() && this.waveform != VoltageElm.WF_DC && this.waveform != VoltageElm.WF_NOISE;
      let s = null;
      if (showV && showF)
        s = this.getShortVoltageText() + " " + VoltageElm.getShortUnitText(this.frequency, "Hz");
      else if (showV)
        s = this.getShortVoltageText();
      else if (showF)
        s = VoltageElm.getShortUnitText(this.frequency, "Hz");
      if (s != null) {
        const hs = this.waveform == VoltageElm.WF_DC && (this.flags & VoltageElm.FLAG_CIRCLE_SYMBOL) == 0 ? 16 : this.circleSize;
        this.drawValues(g, s, hs);
      }
    }
    this.updateDotCount();
    if (!this.isCreating()) {
      if (this.waveform == VoltageElm.WF_DC && (this.flags & VoltageElm.FLAG_CIRCLE_SYMBOL) == 0)
        this.drawDots(g, this.point1, this.point2, this.curcount);
      else {
        this.drawDots(g, this.point1, this.lead1, this.curcount);
        this.drawDots(g, this.point2, this.lead2, -this.curcount);
      }
    }
    this.drawPosts(g);
  }
  drawWaveform(g, center) {
    g.setColor(this.needsHighlight() ? VoltageElm.selectColor : Color.gray);
    this.setPowerColor(g, false);
    const xc = center.x;
    const yc = center.y;
    if (this.waveform != VoltageElm.WF_NOISE)
      CircuitElm.drawThickCircle(g, xc, yc, this.circleSize);
    const wl = 8;
    this.adjustBbox(
      xc - this.circleSize,
      yc - this.circleSize,
      xc + this.circleSize,
      yc + this.circleSize
    );
    let xc2;
    switch (this.waveform) {
      case VoltageElm.WF_DC: {
        break;
      }
      case VoltageElm.WF_SQUARE:
        xc2 = Math.round(wl * 2 * this.dutyCycle - wl + xc);
        xc2 = VoltageElm.max(xc - wl + 3, VoltageElm.min(xc + wl - 3, xc2));
        CircuitElm.drawThickLine(g, xc - wl, yc - wl, xc - wl, yc);
        CircuitElm.drawThickLine(g, xc - wl, yc - wl, xc2, yc - wl);
        CircuitElm.drawThickLine(g, xc2, yc - wl, xc2, yc + wl);
        CircuitElm.drawThickLine(g, xc + wl, yc + wl, xc2, yc + wl);
        CircuitElm.drawThickLine(g, xc + wl, yc, xc + wl, yc + wl);
        break;
      case VoltageElm.WF_PULSE: {
        const ycp = yc + wl / 2;
        CircuitElm.drawThickLine(g, xc - wl, ycp - wl, xc - wl, ycp);
        CircuitElm.drawThickLine(g, xc - wl, ycp - wl, xc - wl / 2, ycp - wl);
        CircuitElm.drawThickLine(g, xc - wl / 2, ycp - wl, xc - wl / 2, ycp);
        CircuitElm.drawThickLine(g, xc - wl / 2, ycp, xc + wl, ycp);
        break;
      }
      case VoltageElm.WF_SAWTOOTH:
        CircuitElm.drawThickLine(g, xc, yc - wl, xc - wl, yc);
        CircuitElm.drawThickLine(g, xc, yc - wl, xc, yc + wl);
        CircuitElm.drawThickLine(g, xc, yc + wl, xc + wl, yc);
        break;
      case VoltageElm.WF_TRIANGLE: {
        const xl = 5;
        CircuitElm.drawThickLine(g, xc - xl * 2, yc, xc - xl, yc - wl);
        CircuitElm.drawThickLine(g, xc - xl, yc - wl, xc, yc);
        CircuitElm.drawThickLine(g, xc, yc, xc + xl, yc + wl);
        CircuitElm.drawThickLine(g, xc + xl, yc + wl, xc + xl * 2, yc);
        break;
      }
      case VoltageElm.WF_NOISE: {
        g.setColor(this.needsHighlight() ? VoltageElm.selectColor : VoltageElm.whiteColor);
        this.setPowerColor(g, false);
        this.drawLabeledNode(g, Locale.LS("Noise"), this.point1, this.lead1);
        break;
      }
      case VoltageElm.WF_AC: {
        const xl = 10;
        g.context.beginPath();
        g.context.lineWidth = 3;
        for (let i = -xl; i <= xl; i++) {
          const yy = yc + Math.round(0.95 * Math.sin(i * VoltageElm.pi / xl) * wl);
          if (i == -xl)
            g.context.moveTo(xc + i, yy);
          else
            g.context.lineTo(xc + i, yy);
        }
        g.context.stroke();
        g.context.lineWidth = 1;
        break;
      }
    }
    if (this.isRailElm() && (this.dx == 0 || this.dy == 0)) {
      const showV = (this.flags & VoltageElm.FLAG_SHOW_VOLTAGE_RAIL) != 0;
      const showF = this.showValues() && this.waveform != VoltageElm.WF_NOISE;
      let s = null;
      if (showV && showF)
        s = this.getShortVoltageText() + " " + VoltageElm.getShortUnitText(this.frequency, "Hz");
      else if (showV)
        s = this.getShortVoltageText();
      else if (showF)
        s = VoltageElm.getShortUnitText(this.frequency, "Hz");
      if (s != null)
        this.drawValues(g, s, this.circleSize);
    }
  }
  addRoutingObstacle(wr) {
    this.addRoutingObstacleWithLeads(wr, 16);
  }
  static diffFromInteger(x) {
    return Math.abs(x - Math.round(x));
  }
  // check if RMS would be a rounder number to display than peak
  useRmsDisplay(peakValue) {
    const rmsMult = this.getRmsMultiplier();
    const rmsVal = peakValue * rmsMult;
    return rmsMult != 1 && Math.abs(peakValue) > 1e-4 && VoltageElm.diffFromInteger(rmsVal * 1e4) < VoltageElm.diffFromInteger(peakValue * 1e4);
  }
  // return a short voltage string, using RMS if that's a rounder number
  getShortVoltageText() {
    if (this.bias != 0)
      return VoltageElm.getShortUnitText(this.bias + this.maxVoltage, "V");
    if (this.useRmsDisplay(this.maxVoltage))
      return VoltageElm.getShortUnitText(this.maxVoltage * this.getRmsMultiplier(), "V") + "rms";
    return VoltageElm.getShortUnitText(this.maxVoltage, "V");
  }
  // return the RMS-to-peak multiplier for the current waveform.
  // RMS = amplitude * getRmsMultiplier(), so multiplier = 1/sqrt(2) for sine, etc.
  getRmsMultiplier() {
    switch (this.waveform) {
      case VoltageElm.WF_DC:
        return 1;
      case VoltageElm.WF_AC:
        return 1 / Math.sqrt(2);
      // sine: Vpk/sqrt(2)
      case VoltageElm.WF_SQUARE:
        return 1;
      // square swings +A/-A, RMS=A
      case VoltageElm.WF_TRIANGLE:
        return 1 / Math.sqrt(3);
      // triangle: Vpk/sqrt(3)
      case VoltageElm.WF_SAWTOOTH:
        return 1 / Math.sqrt(3);
      // sawtooth: Vpk/sqrt(3)
      case VoltageElm.WF_PULSE:
        return Math.sqrt(this.dutyCycle);
      // pulse: Vpk*sqrt(d)
      default:
        return 1;
    }
  }
  isVoltageElm() {
    return true;
  }
  getVoltageSourceCount() {
    return 1;
  }
  getPower() {
    return -this.getVoltageDiff() * this.current;
  }
  getVoltageDiff() {
    return this.nodes[1].v - this.nodes[0].v;
  }
  getInfo(arr) {
    switch (this.waveform) {
      case VoltageElm.WF_DC:
      case VoltageElm.WF_VAR:
        arr[0] = "voltage source";
        break;
      case VoltageElm.WF_AC:
        arr[0] = "A/C source";
        break;
      case VoltageElm.WF_SQUARE:
        arr[0] = "square wave gen";
        break;
      case VoltageElm.WF_PULSE:
        arr[0] = "pulse gen";
        break;
      case VoltageElm.WF_SAWTOOTH:
        arr[0] = "sawtooth gen";
        break;
      case VoltageElm.WF_TRIANGLE:
        arr[0] = "triangle gen";
        break;
      case VoltageElm.WF_NOISE:
        arr[0] = "noise gen";
        break;
    }
    arr[1] = "I = " + VoltageElm.getCurrentText(this.getCurrent());
    arr[2] = (this.isRailElm() ? "V = " : "Vd = ") + VoltageElm.getVoltageText(this.getVoltageDiff());
    let i = 3;
    if (this.waveform != VoltageElm.WF_DC && this.waveform != VoltageElm.WF_VAR && this.waveform != VoltageElm.WF_NOISE) {
      arr[i++] = "f = " + VoltageElm.getUnitText(this.frequency, "Hz");
      arr[i++] = "Vmax = " + VoltageElm.getVoltageText(this.maxVoltage);
      if (this.bias == 0)
        arr[i++] = "V(rms) = " + VoltageElm.getVoltageText(this.maxVoltage * this.getRmsMultiplier());
      if (this.bias != 0)
        arr[i++] = "Voff = " + VoltageElm.getVoltageText(this.bias);
      else if (this.frequency > 500)
        arr[i++] = "wavelength = " + VoltageElm.getUnitText(29979e4 / this.frequency, "m");
    }
    if (this.waveform == VoltageElm.WF_DC && this.current != 0 && CircuitElm.app.showResistanceInVoltageSources)
      arr[i++] = "(R = " + VoltageElm.getUnitText(this.maxVoltage / this.current, Locale.ohmString) + ")";
    arr[i++] = "P = " + VoltageElm.getUnitText(this.getPower(), "W");
  }
  getFrequencyOffset() {
    return 5;
  }
  hasTimingOptions() {
    return this.waveform == VoltageElm.WF_PULSE || this.waveform == VoltageElm.WF_SQUARE;
  }
  timeSpec() {
    return this.hasFlag(VoltageElm.FLAG_TIME_SPEC) && this.hasTimingOptions();
  }
  setFrequency(newFreq) {
    const oldfreq = this.frequency;
    this.frequency = newFreq;
    const maxfreq = 1 / (8 * CircuitElm.sim.maxTimeStep);
    if (this.frequency > maxfreq) {
      if (window.confirm(Locale.LS("Adjust timestep to allow for higher frequencies?")))
        CircuitElm.sim.maxTimeStep = 1 / (32 * this.frequency);
      else
        this.frequency = maxfreq;
    }
    this.freqTimeZero = this.frequency == 0 ? 0 : CircuitElm.sim.t - oldfreq * (CircuitElm.sim.t - this.freqTimeZero) / this.frequency;
  }
  setFrequencyFromTimes(highTime, lowTime) {
    const newFreq = 1 / (highTime + lowTime);
    const newDuty = highTime / (highTime + lowTime);
    this.setFrequency(newFreq);
    this.dutyCycle = newDuty;
  }
  getEditInfo(n) {
    if (n == 0)
      return new EditInfo(this.waveform == VoltageElm.WF_DC ? "Voltage" : "Max Voltage", this.maxVoltage, -20, 20).setUnitStep();
    if (n == 1) {
      const ei = new EditInfo("Waveform", this.waveform, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("D/C");
      ei.choice.add("A/C");
      ei.choice.add("Square Wave");
      ei.choice.add("Triangle");
      ei.choice.add("Sawtooth");
      ei.choice.add("Pulse");
      ei.choice.add("Noise");
      ei.choice.select(this.waveform);
      return ei;
    }
    if (n == 2)
      return new EditInfo("DC Offset (V)", this.bias, -20, 20).setUnitStep();
    if (n == 3) {
      const ei = new EditInfo("Internal Resistance (ohms)", this.internalResistance);
      ei.setNonNegative();
      return ei;
    }
    if (n == 4 && !(this.isRailElm() && (this.waveform == VoltageElm.WF_DC || this.waveform == VoltageElm.WF_VAR))) {
      const ei = new EditInfo("", 0, -1, -1);
      const svFlag = this.isRailElm() ? VoltageElm.FLAG_SHOW_VOLTAGE_RAIL : VoltageElm.FLAG_SHOW_VOLTAGE;
      ei.checkbox = new Checkbox("Show Voltage", (this.flags & svFlag) != 0);
      return ei;
    }
    if (n == 5 && this.waveform == VoltageElm.WF_DC && !this.isRailElm()) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Circle Symbol", (this.flags & VoltageElm.FLAG_CIRCLE_SYMBOL) != 0);
      return ei;
    }
    const fo = this.getFrequencyOffset();
    if (this.waveform == VoltageElm.WF_DC || this.waveform == VoltageElm.WF_NOISE)
      return null;
    const n2 = n - fo;
    if (this.hasTimingOptions()) {
      if (n2 == 0) {
        const ei = new EditInfo("Specify As", 0, -1, -1);
        ei.choice = new Choice();
        ei.choice.add("Frequency/Duty Cycle");
        ei.choice.add("High Time/Low Time");
        ei.choice.select(this.timeSpec() ? 1 : 0);
        ei.newColumn = true;
        return ei;
      }
      if (n2 == 1) {
        if (this.timeSpec())
          return new EditInfo("High Time (s)", this.dutyCycle / this.frequency, 0, 0);
        return new EditInfo("Frequency (Hz)", this.frequency, 4, 500);
      }
      if (n2 == 2)
        return new EditInfo(
          "Phase Offset (degrees)",
          this.phaseShift * 180 / VoltageElm.pi,
          -180,
          180
        ).setDimensionless();
      if (n2 == 3) {
        if (this.timeSpec())
          return new EditInfo("Low Time (s)", (1 - this.dutyCycle) / this.frequency, 0, 0);
        return new EditInfo("Duty Cycle", this.dutyCycle * 100, 0, 100).setDimensionless();
      }
      if (n2 == 4)
        return new EditInfo("Rise/Fall Time (s)", this.riseTime, 0, 0);
    } else {
      if (n2 == 0)
        return new EditInfo("Frequency (Hz)", this.frequency, 4, 500);
      if (n2 == 1)
        return new EditInfo(
          "Phase Offset (degrees)",
          this.phaseShift * 180 / VoltageElm.pi,
          -180,
          180
        ).setDimensionless();
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n == 0)
      this.maxVoltage = ei.value;
    if (n == 2)
      this.bias = ei.value;
    if (n == 3)
      this.internalResistance = ei.value;
    if (n == 4 && ei.checkbox != null) {
      const svFlag = this.isRailElm() ? VoltageElm.FLAG_SHOW_VOLTAGE_RAIL : VoltageElm.FLAG_SHOW_VOLTAGE;
      this.flags = ei.changeFlag(this.flags, svFlag);
    }
    if (n == 5 && this.waveform == VoltageElm.WF_DC && ei.checkbox != null && !this.isRailElm()) {
      this.flags = ei.changeFlag(this.flags, VoltageElm.FLAG_CIRCLE_SYMBOL);
      this.setPoints();
    }
    if (n == 1) {
      const ow = this.waveform;
      this.waveform = ei.choice.getSelectedIndex();
      if (this.waveform == VoltageElm.WF_DC && ow != VoltageElm.WF_DC) {
        ei.newDialog = true;
        this.bias = 0;
      } else if (this.waveform != ow)
        ei.newDialog = true;
      if (this.waveform == VoltageElm.WF_PULSE && ow != VoltageElm.WF_PULSE)
        this.dutyCycle = VoltageElm.defaultPulseDuty;
      else if (ow == VoltageElm.WF_PULSE && this.waveform != VoltageElm.WF_PULSE)
        this.dutyCycle = 0.5;
      this.setPoints();
    }
    const fo = this.getFrequencyOffset();
    const n2 = n - fo;
    if (this.hasTimingOptions()) {
      if (n2 == 0 && ei.choice != null) {
        const oldFlags = this.flags;
        this.flags = ei.choice.getSelectedIndex() == 1 ? this.flags | VoltageElm.FLAG_TIME_SPEC : this.flags & ~VoltageElm.FLAG_TIME_SPEC;
        if (this.flags != oldFlags)
          ei.newDialog = true;
      }
      if (n2 == 1) {
        if (this.timeSpec()) {
          const highTime = ei.value;
          const lowTime = (1 - this.dutyCycle) / this.frequency;
          if (highTime > 0 && lowTime > 0) {
            this.setFrequencyFromTimes(highTime, lowTime);
          }
        } else if (ei.value != 0) {
          this.setFrequency(ei.value);
        }
      }
      if (n2 == 2) {
        this.phaseShift = ei.value * VoltageElm.pi / 180;
        this.phaseShift = (this.phaseShift % (2 * VoltageElm.pi) + 2 * VoltageElm.pi) % (2 * VoltageElm.pi);
      }
      if (n2 == 3) {
        if (this.timeSpec()) {
          const highTime = this.dutyCycle / this.frequency;
          const lowTime = ei.value;
          if (highTime > 0 && lowTime > 0) {
            this.setFrequencyFromTimes(highTime, lowTime);
          }
        } else {
          this.dutyCycle = ei.value * 0.01;
        }
      }
      if (n2 == 4)
        this.riseTime = ei.value;
    } else {
      if (n2 == 0 && this.waveform != VoltageElm.WF_DC && ei.value != 0)
        this.setFrequency(ei.value);
      if (n2 == 1) {
        this.phaseShift = ei.value * VoltageElm.pi / 180;
        this.phaseShift = (this.phaseShift % (2 * VoltageElm.pi) + 2 * VoltageElm.pi) % (2 * VoltageElm.pi);
      }
    }
  }
  validate() {
    if (this.internalResistance > 0)
      return true;
    if (this.getPostCount() == 2) {
      const fpi = new FindPathInfo(FindPathInfo.VOLTAGE, this, this.getNode(1), CircuitElm.sim);
      if (fpi.findPath(this.getNode(0))) {
        this.internalResistance = 1e-3;
        return false;
      }
    }
    return true;
  }
}

const ROOT2 = 1.4142135623730951;
function noCommaFormat(v) {
  let s = v.toPrecision(10).replace(/\.?0+$/, "");
  if (s.includes("e") || s.includes("E"))
    s = String(v);
  return s;
}
class EditDialog extends Dialog {
  elm;
  cframe;
  einfos;
  einfocount = 0;
  mainPanel;
  errorLabel;
  colsRow;
  // holds the column panels
  activeCol;
  // current column being filled
  activeColCount = 0;
  firstInput = null;
  applyButton;
  constructor(ce, f) {
    super();
    this.elm = ce;
    this.cframe = f;
    this.einfos = new Array(20).fill(null);
    let title = "Edit Component";
    if (ce instanceof CircuitElm) {
      const name = ce.getElmType();
      if (name)
        title = "Edit " + name.charAt(0).toUpperCase() + name.slice(1);
    }
    this.dialogEl.innerHTML = "";
    const titleEl = document.createElement("h3");
    titleEl.textContent = Locale.LS(title);
    titleEl.style.margin = "0 0 8px 0";
    this.dialogEl.appendChild(titleEl);
    this.mainPanel = document.createElement("div");
    this.dialogEl.appendChild(this.mainPanel);
    this.errorLabel = document.createElement("div");
    this.errorLabel.style.color = "red";
    this.errorLabel.style.display = "none";
    this.mainPanel.appendChild(this.errorLabel);
    this.colsRow = document.createElement("div");
    this.colsRow.style.display = "flex";
    this.colsRow.style.alignItems = "flex-start";
    this.colsRow.style.gap = "10px";
    this.mainPanel.appendChild(this.colsRow);
    this.activeCol = this.addColumn();
    this.buildDialog();
    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex;justify-content:space-between;margin-top:10px;gap:6px;";
    this.mainPanel.appendChild(btnRow);
    const applyBtn = document.createElement("button");
    applyBtn.textContent = Locale.LS("Apply");
    applyBtn.onclick = () => this.apply();
    btnRow.appendChild(applyBtn);
    this.applyButton = applyBtn;
    const okBtn = document.createElement("button");
    okBtn.textContent = Locale.LS("OK");
    okBtn.onclick = () => {
      if (this.apply()) this.closeDialog();
    };
    btnRow.appendChild(okBtn);
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = Locale.LS("Cancel");
    cancelBtn.onclick = () => this.closeDialog();
    btnRow.appendChild(cancelBtn);
    if (this.firstInput !== null) {
      const inp = this.firstInput;
      requestAnimationFrame(() => {
        inp.focus();
        inp.select();
      });
    }
  }
  addColumn() {
    const col = document.createElement("div");
    col.style.cssText = "display:flex;flex-direction:column;gap:4px;min-width:180px;";
    this.colsRow.appendChild(col);
    this.activeColCount = 0;
    return col;
  }
  buildDialog() {
    let i = 0;
    for (; ; i++) {
      this.einfos[i] = this.elm.getEditInfo(i);
      if (this.einfos[i] === null) break;
      const ei = this.einfos[i];
      if (this.activeColCount > 15 || ei.newColumn) {
        this.activeCol = this.addColumn();
      }
      const name = Locale.LS(ei.name);
      const label = document.createElement("label");
      if (ei.name.startsWith("<"))
        label.innerHTML = name;
      else
        label.textContent = name;
      if (this.activeColCount > 0)
        label.style.marginTop = "6px";
      this.activeCol.appendChild(label);
      this.activeColCount++;
      const idx = i;
      if (ei.choice !== null) {
        const sel = document.createElement("select");
        for (let j = 0; j < ei.choice.items.length; j++) {
          const opt = document.createElement("option");
          opt.textContent = ei.choice.items[j];
          sel.appendChild(opt);
        }
        sel.selectedIndex = ei.choice.selectedIndex;
        ei.choice.element = sel;
        sel.onchange = () => this.itemStateChanged(idx);
        this.activeCol.appendChild(sel);
      } else if (ei.checkbox !== null) {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = ei.checkbox.state;
        ei.checkbox.element = cb;
        const cbLabel = document.createElement("label");
        cbLabel.style.cssText = "display:flex;align-items:center;gap:4px;";
        cbLabel.appendChild(cb);
        cbLabel.appendChild(document.createTextNode(ei.checkbox.name));
        cb.onchange = () => this.itemStateChanged(idx);
        this.activeCol.appendChild(cbLabel);
      } else if (ei.button !== null) {
        const btn = document.createElement("button");
        btn.textContent = ei.button.label ?? ei.button.textContent ?? String(ei.button);
        btn.onclick = () => this.itemStateChanged(idx);
        this.activeCol.appendChild(btn);
      } else if (ei.textArea !== null) {
        const ta = document.createElement("textarea");
        ta.value = ei.textArea.value ?? "";
        ta.rows = 4;
        ta.cols = 40;
        ei.textArea.element = ta;
        if (this.firstInput === null)
          this.firstInput = ta;
        this.activeCol.appendChild(ta);
        this.closeOnEnter = false;
      } else if (ei.widget !== null) {
        this.activeCol.appendChild(ei.widget);
      } else {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.style.width = "180px";
        ei.textf = inp;
        if (this.firstInput === null)
          this.firstInput = inp;
        if (ei.text !== null) {
          inp.value = ei.text;
          if (ei.isColor)
            inp.type = "color";
          this.activeCol.appendChild(inp);
        } else {
          inp.value = this.unitString(ei);
          this.activeCol.appendChild(this.makeValueStepperRow(ei));
        }
      }
    }
    this.einfocount = i;
  }
  // preferred-value series used by stepE12(), repeating every decade (reused from the E12
  // table circuitjs1's ScrollValuePopup uses for its scroll-to-adjust popup)
  static E12 = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  // A text field with "-"/"+" buttons that step the value, so it can be tweaked without
  // having to type on a mobile keyboard. Component values (R/L/C, etc.) step through the
  // E12 preferred-value series (reusing the same table ScrollValuePopup uses for its
  // scroll-to-adjust popup); dimensionless fields and voltage sources, which don't really
  // have a "preferred value" series, just step by 1. Holding a button down repeats the step.
  makeValueStepperRow(ei) {
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:center;gap:2px;";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    minus.style.width = "2em";
    plus.style.width = "2em";
    EditDialog.disableTouchCallout(minus);
    EditDialog.disableTouchCallout(plus);
    this.addRepeatingStepHandler(minus, ei, -1);
    this.addRepeatingStepHandler(plus, ei, 1);
    row.appendChild(minus);
    row.appendChild(ei.textf);
    row.appendChild(plus);
    return row;
  }
  static disableTouchCallout(button) {
    const style = button.style;
    style.webkitTouchCallout = "none";
    style.webkitUserSelect = "none";
    style.userSelect = "none";
    style.touchAction = "manipulation";
  }
  // step once immediately on mouse/touch-down, then keep stepping at a fixed rate for as
  // long as the button is held, like a native stepper control
  addRepeatingStepHandler(button, ei, dir) {
    let repeatTimer = null;
    let startRepeatTimer = null;
    const stop = () => {
      if (startRepeatTimer !== null) {
        clearTimeout(startRepeatTimer);
        startRepeatTimer = null;
      }
      if (repeatTimer !== null) {
        clearInterval(repeatTimer);
        repeatTimer = null;
      }
    };
    button.addEventListener("mousedown", () => {
      this.stepValue(ei, dir);
      startRepeatTimer = setTimeout(() => {
        repeatTimer = setInterval(() => this.stepValue(ei, dir), 120);
      }, 400);
    });
    button.addEventListener("mouseup", stop);
    button.addEventListener("mouseout", stop);
    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.stepValue(ei, dir);
      startRepeatTimer = setTimeout(() => {
        repeatTimer = setInterval(() => this.stepValue(ei, dir), 120);
      }, 400);
    }, { passive: false });
    button.addEventListener("touchend", stop);
    button.addEventListener("touchcancel", stop);
  }
  stepValue(ei, dir) {
    let cur;
    try {
      cur = this.parseUnitsEi(ei);
    } catch (ex) {
      cur = ei.value;
    }
    const linearStep = ei.dimensionless || ei.unitStep;
    const next = linearStep ? cur + dir : EditDialog.stepE12(cur, dir);
    ei.textf.value = EditDialog.unitStringVal(ei, next);
  }
  // step to the next/previous value (in direction dir) in the E12 preferred-value series,
  // which repeats every decade; preserves sign, and treats 0 as just below the first step
  static stepE12(value, dir) {
    const e12 = EditDialog.E12;
    if (value === 0)
      return dir > 0 ? e12[0] : -1;
    const sign = value < 0 ? -1 : 1;
    const av = Math.abs(value);
    let decade = Math.floor(Math.log10(av));
    let idx = 0;
    for (let i = 0; i < e12.length; i++) {
      if (e12[i] * Math.pow(10, decade) <= av * 1.0000001)
        idx = i;
    }
    idx += dir;
    if (idx < 0) {
      idx = e12.length - 1;
      decade--;
    } else if (idx >= e12.length) {
      idx = 0;
      decade++;
    }
    return sign * e12[idx] * Math.pow(10, decade);
  }
  unitString(ei) {
    if (this.elm instanceof VoltageElm) {
      const ve = this.elm;
      if (ve.useRmsDisplay(ei.value))
        return EditDialog.unitStringVal(ei, ei.value * ve.getRmsMultiplier()) + "rms";
    }
    return EditDialog.unitStringVal(ei, ei.value);
  }
  static unitStringVal(ei, v) {
    const va = Math.abs(v);
    if (ei !== null && ei.dimensionless) return noCommaFormat(v);
    if (!isFinite(va)) return noCommaFormat(v);
    if (v === 0) return "0";
    if (va < 1e-12) return noCommaFormat(v * 1e15) + "f";
    if (va < 1e-9) return noCommaFormat(v * 1e12) + "p";
    if (va < 1e-6) return noCommaFormat(v * 1e9) + "n";
    if (va < 1e-3) return noCommaFormat(v * 1e6) + "u";
    if (va < 1) return noCommaFormat(v * 1e3) + "m";
    if (va < 1e3) return noCommaFormat(v);
    if (va < 1e6) return noCommaFormat(v * 1e-3) + "k";
    if (va < 1e9) return noCommaFormat(v * 1e-6) + "M";
    return noCommaFormat(v * 1e-9) + "G";
  }
  parseUnitsEi(ei) {
    let s = ei.textf.value.trim();
    if (this.elm instanceof VoltageElm && s.endsWith("rms")) {
      s = s.slice(0, -3).trim();
      const rmsMult = this.elm.getRmsMultiplier();
      if (rmsMult > 0)
        return EditDialog.parseUnits(s) / rmsMult;
    }
    return EditDialog.parseUnits(s);
  }
  static parseUnits(s) {
    s = s.trim();
    let rmsMult = 1;
    if (s.endsWith("rms")) {
      s = s.slice(0, -3).trim();
      rmsMult = ROOT2;
    }
    s = s.replace(/([0-9]+)([pPnNuUmMkKgG])([0-9]+)/, "$1.$3$2");
    s = s.replace(/[mM][eE][gG]$/, "M");
    if (/^-?[0-9]*\.?[0-9]+[eE][+-]?[0-9]+$/.test(s))
      return parseFloatStrict(s) * rmsMult;
    const uc = s.charAt(s.length - 1);
    let mult = 1;
    switch (uc) {
      case "f":
      case "F":
        mult = 1e-15;
        break;
      case "p":
      case "P":
        mult = 1e-12;
        break;
      case "n":
      case "N":
        mult = 1e-9;
        break;
      case "u":
      case "U":
        mult = 1e-6;
        break;
      case "m":
        mult = 1e-3;
        break;
      case "k":
      case "K":
        mult = 1e3;
        break;
      case "M":
        mult = 1e6;
        break;
      case "G":
      case "g":
        mult = 1e9;
        break;
    }
    if (mult !== 1)
      s = s.slice(0, -1).trim();
    return parseFloatStrict(s) * mult * rmsMult;
  }
  apply() {
    for (let i = 0; i !== this.einfocount; i++) {
      const ei = this.einfos[i];
      ei.error = null;
      if (ei.textf !== null && ei.text === null) {
        try {
          ei.value = this.parseUnitsEi(ei);
        } catch (ex) {
        }
      }
      if (ei.positive && ei.value <= 0)
        ei.setError("must be > 0");
      if (ei.nonNegative && ei.value < 0)
        ei.setError("must be >= 0");
      if (ei.button !== null || ei.choice !== null)
        continue;
      if (ei.error === null)
        this.elm.setEditValue(i, ei);
      if (ei.error !== null) {
        const field = ei.errorFieldName ?? ei.name;
        const msg = field && field.length > 0 ? field + ": " + ei.error : ei.error;
        this.errorLabel.textContent = msg;
        this.errorLabel.style.display = "";
        return false;
      }
      if (this.elm instanceof CircuitElm) {
        const adj = this.cframe.findAdjustable(this.elm, i);
        if (adj !== null)
          adj.setSliderValue(ei.value);
      }
    }
    this.errorLabel.style.display = "none";
    this.cframe.needAnalyze();
    return true;
  }
  itemStateChanged(idx) {
    const ei = this.einfos[idx];
    let changed = false;
    let applied = false;
    if ((ei.button !== null || ei.choice !== null) && !ei.newDialog) {
      this.apply();
      applied = true;
    }
    this.elm.setEditValue(idx, ei);
    if (ei.newDialog)
      changed = true;
    this.cframe.needAnalyze();
    if (changed) {
      if (!applied) this.apply();
      this.clearDialog();
      this.buildDialog();
    }
  }
  resetDialog() {
    this.clearDialog();
    this.buildDialog();
  }
  clearDialog() {
    this.colsRow.innerHTML = "";
    this.activeCol = this.addColumn();
    this.firstInput = null;
    this.einfos.fill(null);
    this.einfocount = 0;
  }
  // Non-modal and docked to the side: unlike other dialogs, this one pops up automatically
  // whenever an element is created or clicked on, so it must not block interacting with the
  // rest of the circuit (clicking other elements re-targets this same dialog instead of
  // opening a second one; see CommandManager.doEdit).
  show(topOffset = 70) {
    this.dialogEl.style.position = "fixed";
    this.dialogEl.style.margin = "0";
    this.dialogEl.style.top = topOffset + "px";
    this.dialogEl.style.left = "auto";
    this.dialogEl.style.right = UIManager.VERTICALPANELWIDTH + 16 + "px";
    this.dialogEl.show();
  }
  closeDialog() {
    super.closeDialog();
    if (CirSim.editDialog === this)
      CirSim.editDialog = null;
    if (CirSim.customLogicEditDialog === this)
      CirSim.customLogicEditDialog = null;
  }
}

export { EditDialog as E, VoltageElm as V };
