import { D as DiodeModel, a as CirSim, t as ScrollValuePopup, L as Locale, c as CircuitElm, r as parseFloatStrict, M as MosfetModel, b as CircuitXMLSerializer, P as Point, f as Color, d as Choice, E as EditInfo, e as Checkbox, l as SimulationManager, p as parseIntStrict, j as CustomLogicModel, T as TransistorModel, m as Scope, u as CircuitNode, F as FindPathInfo, v as Font, w as Rectangle, H as HookRegistry, x as StringTokenizer, V as VAL_R, U as UNITS_OHMS, R as RelayModel, y as ElementFactory } from './CircuitElm-D0NL-LPP.js';
import { E as EditDialog, V as VoltageElm } from './EditDialog-BLOWt7NH.js';
import { C as ChipElm, P as Pin, a as CompositeElm, S as SubcircuitElm } from './EditSubcircuitModelDialog-C5vUSIFP.js';
import { a as SwitchElm, S as Scrollbar } from './UIManager-Bxtki72o.js';
import { L as LabeledNodeElm, R as RoutedWireElm, S as ScopeElm, W as WireElm } from './ScopeElm-D-xJz0et.js';
import './KeyNames-CtQ8ZgWT.js';

class Diode {
  nodes;
  sim;
  constructor(s) {
    this.sim = s;
    this.nodes = new Array(2);
  }
  setup(model) {
    this.leakage = model.saturationCurrent;
    this.zvoltage = model.breakdownVoltage;
    this.vscale = model.vscale;
    this.vdcoef = model.vdcoef;
    this.vcrit = this.vscale * Math.log(this.vscale / (Math.sqrt(2) * this.leakage));
    this.vzcrit = Diode.vt * Math.log(Diode.vt / (Math.sqrt(2) * this.leakage));
    if (this.zvoltage === 0)
      this.zoffset = 0;
    else {
      const i = -5e-3;
      this.zoffset = this.zvoltage - Math.log(-(1 + i / this.leakage)) / Diode.vzcoef;
    }
  }
  setupForDefaultModel() {
    this.setup(DiodeModel.getDefaultModel());
  }
  reset() {
    this.lastvoltdiff = 0;
  }
  // Electron thermal voltage at SPICE's default temperature of 27 C (300.15 K):
  static vt = 0.025865;
  // The diode's "scale voltage", the voltage increase which will raise current by a factor of e.
  vscale;
  // The multiplicative equivalent of dividing by vscale (for speed).
  vdcoef;
  // The Zener breakdown curve is represented by a steeper exponential, one like the ideal
  // Shockley curve, but flipped and translated. This curve removes the moderating influence
  // of emcoef, replacing vscale and vdcoef with vt and vzcoef.
  // vzcoef is the multiplicative equivalent of dividing by vt (for speed).
  static vzcoef = 1 / Diode.vt;
  // User-specified diode parameters for forward voltage drop and Zener voltage.
  fwdrop;
  zvoltage;
  // The diode current's scale factor, calculated from the user-specified forward voltage drop.
  leakage;
  // Voltage offset for Zener breakdown exponential, calculated from user-specified Zener voltage.
  zoffset;
  // Critical voltages for limiting the normal diode and Zener breakdown exponentials.
  vcrit;
  vzcrit;
  lastvoltdiff = 0;
  limitStep(vnew, vold) {
    let arg;
    if (vnew > this.vcrit && Math.abs(vnew - vold) > this.vscale + this.vscale) {
      if (vold > 0) {
        arg = 1 + (vnew - vold) / this.vscale;
        if (arg > 0) {
          vnew = vold + this.vscale * Math.log(arg);
        } else {
          vnew = this.vcrit;
        }
      } else {
        vnew = this.vscale * Math.log(vnew / this.vscale);
      }
      this.sim.converged = false;
    } else if (vnew < 0 && this.zoffset !== 0) {
      vnew = -vnew - this.zoffset;
      vold = -vold - this.zoffset;
      if (vnew > this.vzcrit && Math.abs(vnew - vold) > Diode.vt + Diode.vt) {
        if (vold > 0) {
          arg = 1 + (vnew - vold) / Diode.vt;
          if (arg > 0) {
            vnew = vold + Diode.vt * Math.log(arg);
          } else {
            vnew = this.vzcrit;
          }
        } else {
          vnew = Diode.vt * Math.log(vnew / Diode.vt);
        }
        this.sim.converged = false;
      }
      vnew = -(vnew + this.zoffset);
    }
    return vnew;
  }
  stamp(n0, n1) {
    this.nodes[0] = n0;
    this.nodes[1] = n1;
    this.sim.stampNonLinear(this.nodes[0]);
    this.sim.stampNonLinear(this.nodes[1]);
  }
  doStep(voltdiff) {
    if (Math.abs(voltdiff - this.lastvoltdiff) > 0.01)
      this.sim.converged = false;
    voltdiff = this.limitStep(voltdiff, this.lastvoltdiff);
    this.lastvoltdiff = voltdiff;
    let gmin = this.leakage * 0.01;
    if (this.sim.subIterations > 100) {
      gmin = Math.exp(-9 * Math.log(10) * (1 - this.sim.subIterations / 3e3));
      if (gmin > 0.1)
        gmin = 0.1;
    }
    if (voltdiff >= 0 || this.zvoltage === 0) {
      const eval_ = Math.exp(voltdiff * this.vdcoef);
      const geq = this.vdcoef * this.leakage * eval_ + gmin;
      const nc = (eval_ - 1) * this.leakage - geq * voltdiff;
      this.sim.stampConductance(this.nodes[0], this.nodes[1], geq);
      this.sim.stampCurrentSource(this.nodes[0], this.nodes[1], nc);
    } else {
      const geq = this.leakage * (this.vdcoef * Math.exp(voltdiff * this.vdcoef) + Diode.vzcoef * Math.exp((-voltdiff - this.zoffset) * Diode.vzcoef)) + gmin;
      const nc = this.leakage * (Math.exp(voltdiff * this.vdcoef) - Math.exp((-voltdiff - this.zoffset) * Diode.vzcoef) - 1) + geq * -voltdiff;
      this.sim.stampConductance(this.nodes[0], this.nodes[1], geq);
      this.sim.stampCurrentSource(this.nodes[0], this.nodes[1], nc);
    }
  }
  calculateCurrent(voltdiff) {
    if (voltdiff >= 0 || this.zvoltage === 0)
      return this.leakage * (Math.exp(voltdiff * this.vdcoef) - 1);
    return this.leakage * (Math.exp(voltdiff * this.vdcoef) - Math.exp((-voltdiff - this.zoffset) * Diode.vzcoef) - 1);
  }
}

class EditMosfetModelDialog extends EditDialog {
  model;
  mosfetElm;
  constructor(mm, f, me) {
    super(mm, f);
    this.model = mm;
    this.mosfetElm = me;
    this.applyButton.remove();
  }
  apply() {
    const ok = super.apply();
    if (this.model.name === null || this.model.name.length === 0)
      this.model.pickName();
    if (this.mosfetElm !== null)
      this.mosfetElm.newModelCreated(this.model);
    return ok;
  }
  closeDialog() {
    super.closeDialog();
    const edlg = CirSim.editDialog;
    CirSim.console("resetting dialog " + edlg);
    if (edlg !== null)
      edlg.resetDialog();
    CirSim.mosfetModelEditDialog = null;
  }
}

class TypeScrollPopup {
  myElm;
  sim;
  originalPnp;
  currentPnp;
  typeLabel;
  deltaY = 0;
  panel;
  closed = false;
  onWheel = (e) => {
    e.preventDefault();
    this.doDeltaY(ScrollValuePopup.normalizeWheelDelta(e));
  };
  onMouseOut = () => this.close(true);
  onMouseDown = (e) => {
    if (e.button === 0 || e.button === 1)
      this.close(true);
    else
      this.close(false);
  };
  constructor(x, y, dy, elm, sim) {
    this.myElm = elm;
    this.sim = sim;
    this.sim.undoManager.pushUndo();
    this.originalPnp = this.myElm.pnp;
    this.currentPnp = this.originalPnp;
    this.panel = document.createElement("div");
    this.panel.className = "scrollValuePopup";
    const header = document.createElement("div");
    header.className = "scrollValuePopup-label off2";
    header.textContent = this.getHeaderText();
    this.panel.appendChild(header);
    this.typeLabel = document.createElement("div");
    this.typeLabel.className = "scrollValuePopup-label selected";
    this.panel.appendChild(this.typeLabel);
    this.updateLabel();
    this.panel.addEventListener("wheel", this.onWheel, { passive: false });
    this.panel.addEventListener("mouseout", this.onMouseOut);
    this.panel.addEventListener("mousedown", this.onMouseDown);
    this.doDeltaY(dy);
    this.panel.style.visibility = "hidden";
    document.body.appendChild(this.panel);
    const w = this.panel.offsetWidth;
    const h = this.panel.offsetHeight;
    const left = Math.max(0, x - w / 4);
    const top = Math.max(0, y - h / 2);
    this.panel.style.left = left + "px";
    this.panel.style.top = top + "px";
    this.panel.style.visibility = "";
  }
  getHeaderText() {
    if (this.myElm.isJfetElm())
      return Locale.LS("JFET Type");
    if (this.myElm.isMosfetElm())
      return Locale.LS("MOSFET Type");
    return Locale.LS("Transistor Type");
  }
  doDeltaY(dy) {
    this.deltaY += dy;
    while (this.deltaY >= 30) {
      this.deltaY -= 30;
      this.toggle();
    }
    while (this.deltaY <= -30) {
      this.deltaY += 30;
      this.toggle();
    }
  }
  toggle() {
    const e = this.myElm;
    if (e.isMosfetElm()) {
      e.pnp = -e.pnp;
      e.flags ^= e.FLAG_PNP;
      e.setPoints();
      this.currentPnp = e.pnp;
    } else if (e.isTransistorElm()) {
      e.pnp = -e.pnp;
      e.setPoints();
      this.currentPnp = e.pnp;
    }
    this.sim.needAnalyze();
    this.updateLabel();
  }
  updateLabel() {
    let text;
    if (this.myElm.isMosfetElm()) {
      text = this.myElm.isJfetElm() ? this.currentPnp === -1 ? Locale.LS("P-Channel JFET") : Locale.LS("N-Channel JFET") : this.currentPnp === -1 ? Locale.LS("P-Channel") : Locale.LS("N-Channel");
    } else {
      text = this.currentPnp === -1 ? "PNP" : "NPN";
    }
    this.typeLabel.textContent = text;
  }
  close(keepChanges) {
    if (this.closed)
      return;
    this.closed = true;
    if (!keepChanges) {
      while (this.currentPnp !== this.originalPnp)
        this.toggle();
    }
    this.panel.remove();
    CirSim.typeScrollPopup = null;
  }
  isShowing() {
    return !this.closed;
  }
}

class MosfetElm extends CircuitElm {
  pnp;
  FLAG_PNP = 1;
  FLAG_SHOWVT = 2;
  FLAG_FLIP = 8;
  // these bits are no longer set on new elements (the settings they controlled now live on
  // MosfetModel), but the values are still needed to decode old circuit files that have them
  // packed into the element's own flags.
  FLAG_DIGITAL_LEGACY = 4;
  FLAG_HIDE_BULK_LEGACY = 16;
  FLAG_BODY_DIODE_LEGACY = 32;
  FLAG_BODY_TERMINAL_LEGACY = 64;
  FLAG_SHOW_BODY_DIODE_LEGACY = 128;
  bodyTerminal = 0;
  vt;
  // beta = 1/(RdsON*(Vgs-Vt))
  beta;
  // junction capacitance state (backward euler companion model)
  capVoltGS = 0;
  capVoltGD = 0;
  capCurGS = 0;
  capCurGD = 0;
  geqGS = 0;
  geqGD = 0;
  ceqGS = 0;
  ceqGD = 0;
  diodeB1;
  diodeB2;
  diodeCurrent1 = 0;
  diodeCurrent2 = 0;
  bodyCurrent = 0;
  curcount_body1 = 0;
  curcount_body2 = 0;
  curcount_gate = 0;
  curcount_source = 0;
  curcount_drain = 0;
  modelName;
  model;
  static lastModelName = "default";
  // cached copies of the model's drawing/behavior settings, refreshed in setup().  Cached
  // (rather than read from model directly) because getPostCount() is called from the base
  // CircuitElm constructor before our own "model" field is assigned; see DiodeElm.hasResistance
  // for the same pattern.
  bulkShown;
  digitalSymbolShown;
  bodyDiodeSimulated;
  bodyTerminalShown;
  bodyDiodeSymbolShown;
  hs = 16;
  // points for source and drain (swapped on PNP)
  src;
  drn;
  // points for gate, body, and circle on PNP digital
  gate;
  body;
  pcircle;
  pcircler;
  arrowPoly;
  bodyDiodePoly;
  bodyDiodePoly2;
  bodyDiodeCathode;
  bodyDiodeCathode2;
  bodyDiodeLeads;
  constructor(xa, ya, xbOrPnp, yb, f, st) {
    if (typeof xbOrPnp === "boolean") {
      super(xa, ya);
      this.pnp = xbOrPnp ? -1 : 1;
      this.flags = xbOrPnp ? this.FLAG_PNP : 0;
      this.noDiagonal = true;
      this.setupDiodes();
      this.modelName = this.getLastModelName();
      this.setup();
    } else {
      super(xa, ya, xbOrPnp, yb, f);
      this.pnp = (f & this.FLAG_PNP) !== 0 ? -1 : 1;
      this.noDiagonal = true;
      this.setupDiodes();
      let vt0 = this.getDefaultThreshold();
      let beta0 = this.getBackwardCompatibilityBeta();
      try {
        vt0 = parseFloatStrict(st.nextToken());
        beta0 = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
      this.model = this.legacyModel(vt0, beta0, this.flags);
      this.modelName = this.model.name;
      this.setup();
      this.allocNodes();
    }
  }
  // is this a JFET (vs. a MOSFET)?  Both share MosfetModel; this only affects
  // which default model is used and which UI options are shown.
  isJfet() {
    return false;
  }
  getLastModelName() {
    return MosfetElm.lastModelName;
  }
  setLastModelName(n) {
    MosfetElm.lastModelName = n;
  }
  // build (or find) a model matching the drawing/behavior bits from a pre-model circuit
  // file, where they were packed into the element's own flags instead of into a model.
  // Used for both the old plain-text format (StringTokenizer constructor) and old XML saves
  // (undumpXml, when there's no "mo" model-name attribute).  Also strips those bits out of
  // our own flags field, since they're no longer meaningful there.
  legacyModel(vt0, beta0, legacyFlags) {
    const legacyShowBulk = !this.isJfet() && (legacyFlags & (this.FLAG_DIGITAL_LEGACY | this.FLAG_HIDE_BULK_LEGACY)) === 0;
    const legacyDigital = (legacyFlags & this.FLAG_DIGITAL_LEGACY) !== 0;
    const legacyBodyDiode = (legacyFlags & this.FLAG_BODY_DIODE_LEGACY) !== 0;
    const legacyBodyTerminal = (legacyFlags & this.FLAG_BODY_TERMINAL_LEGACY) !== 0;
    const legacyShowBodyDiode = (legacyFlags & this.FLAG_SHOW_BODY_DIODE_LEGACY) !== 0;
    this.flags &= ~(this.FLAG_DIGITAL_LEGACY | this.FLAG_HIDE_BULK_LEGACY | this.FLAG_BODY_DIODE_LEGACY | this.FLAG_BODY_TERMINAL_LEGACY | this.FLAG_SHOW_BODY_DIODE_LEGACY);
    return MosfetModel.getModelWithParameters(
      vt0,
      beta0,
      this.isJfet(),
      legacyShowBulk,
      legacyBodyDiode,
      legacyBodyTerminal,
      legacyDigital,
      legacyShowBodyDiode
    );
  }
  setup() {
    this.model = MosfetModel.getModelWithNameOrCopy(this.modelName, this.model ?? null, this.isJfet());
    this.modelName = this.model.name;
    this.vt = this.model.threshold;
    this.beta = this.model.beta;
    this.bulkShown = this.model.showBulk;
    this.digitalSymbolShown = !this.bulkShown && this.model.digitalSymbol;
    this.bodyDiodeSimulated = this.bulkShown && this.model.bodyDiode;
    this.bodyTerminalShown = this.bodyDiodeSimulated && this.model.bodyTerminal;
    this.bodyDiodeSymbolShown = this.bodyDiodeSimulated && this.model.showBodyDiodeSymbol;
    this.allocNodes();
  }
  hasGateCaps() {
    return this.model.capGS > 0 || this.model.capGD > 0;
  }
  updateModels() {
    this.setup();
    this.setPoints();
  }
  // set up body diodes
  setupDiodes() {
    this.diodeB1 = new Diode(CircuitElm.sim);
    this.diodeB1.setupForDefaultModel();
    this.diodeB2 = new Diode(CircuitElm.sim);
    this.diodeB2.setupForDefaultModel();
  }
  // fallback vt/beta for old files with no configurable beta.  JfetElm overrides these.
  getDefaultThreshold() {
    return 1.5;
  }
  // default for elements in old files with no configurable beta.  JfetElm overrides this.
  // Not sure where this value came from, but the ZVP3306A has a beta of about .027.  Power MOSFETs have much higher betas (like 80 or more)
  getBackwardCompatibilityBeta() {
    return 0.02;
  }
  nonLinear() {
    return true;
  }
  onMouseWheel(e) {
    if (CirSim.typeScrollPopup != null && CirSim.typeScrollPopup.isShowing()) {
      CirSim.typeScrollPopup.doDeltaY(ScrollValuePopup.normalizeWheelDelta(e));
      return;
    }
    CirSim.typeScrollPopup = new TypeScrollPopup(e.clientX, e.clientY, ScrollValuePopup.normalizeWheelDelta(e), this, CircuitElm.app);
  }
  drawDigital() {
    return this.digitalSymbolShown;
  }
  showBulk() {
    return this.bulkShown;
  }
  hasBodyTerminal() {
    return this.bodyTerminalShown;
  }
  doBodyDiode() {
    return this.bodyDiodeSimulated;
  }
  showBodyDiode() {
    return this.bodyDiodeSymbolShown;
  }
  reset() {
    this.lastv1 = this.lastv2 = this.curcount = 0;
    this.curcount_body1 = this.curcount_body2 = this.curcount_gate = this.curcount_source = this.curcount_drain = 0;
    this.capVoltGS = this.capVoltGD = this.capCurGS = this.capCurGD = 0;
    this.geqGS = this.geqGD = this.ceqGS = this.ceqGD = 0;
    this.diodeB1.reset();
    this.diodeB2.reset();
  }
  getDumpType() {
    return "f".charCodeAt(0);
  }
  isMosfetElm() {
    return true;
  }
  dumpXml(doc, elem) {
    if (!(this.model.builtIn || this.model.dumped))
      this.model.dumpXml(doc);
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "mo", this.modelName);
  }
  dumpXmlModel(doc) {
    if (!(this.model.builtIn || this.model.dumped))
      this.model.dumpXml(doc);
  }
  undumpXml(xml) {
    this.flags = 0;
    super.undumpXml(xml);
    this.modelName = xml.parseStringAttr("mo", null);
    if (this.modelName == null) {
      const vt0 = xml.parseDoubleAttr("vt", this.getDefaultThreshold());
      const beta0 = xml.parseDoubleAttr("be", this.getBackwardCompatibilityBeta());
      this.model = this.legacyModel(vt0, beta0, this.flags);
      this.modelName = this.model.name;
    }
    this.setup();
    this.pnp = (this.flags & this.FLAG_PNP) !== 0 ? -1 : 1;
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.hs);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.src[0], this.src[1]);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.drn[0], this.drn[1]);
    const segments = 6;
    this.setPowerColor(g, true);
    const power = this.showPower();
    const segf = 1 / segments;
    const enhancement = this.vt > 0 && this.showBulk();
    const ps1 = new Point(0, 0);
    const ps2 = new Point(0, 0);
    for (let i = 0; i !== segments; i++) {
      if ((i === 1 || i === 4) && enhancement) continue;
      const v = this.nodes[1].v + (this.nodes[2].v - this.nodes[1].v) * i / segments;
      if (!power)
        this.setVoltageColor(g, v);
      this.interpPoint(this.src[1], this.drn[1], ps1, i * segf);
      this.interpPoint(this.src[1], this.drn[1], ps2, (i + 1) * segf);
      CircuitElm.drawThickLine(g, ps1, ps2);
    }
    if (!power)
      this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.src[1], this.src[2]);
    if (!power)
      this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.drn[1], this.drn[2]);
    if (this.showBulk()) {
      this.setVoltageColor(g, this.nodes[this.bodyTerminal].v);
      if (!this.hasBodyTerminal())
        CircuitElm.drawThickLine(g, this.pnp === -1 ? this.drn[0] : this.src[0], this.body[0]);
      CircuitElm.drawThickLine(g, this.body[0], this.body[1]);
    }
    if (this.showBodyDiode()) {
      if (!this.hasBodyTerminal()) {
        this.setVoltageColor(g, this.nodes[1].v);
        g.fillPolygon(this.bodyDiodePoly);
        CircuitElm.drawThickLine(g, this.src[0], this.bodyDiodeLeads[0]);
        CircuitElm.drawThickLine(g, this.bodyDiodeLeads[0], this.bodyDiodeLeads[1]);
        this.setVoltageColor(g, this.nodes[2].v);
        CircuitElm.drawThickLine(g, this.bodyDiodeCathode[0], this.bodyDiodeCathode[1]);
        CircuitElm.drawThickLine(g, this.bodyDiodeLeads[2], this.bodyDiodeLeads[3]);
        CircuitElm.drawThickLine(g, this.drn[0], this.bodyDiodeLeads[3]);
        this.adjustBbox(this.bodyDiodeLeads[0], this.bodyDiodeLeads[3]);
      } else {
        const anode1 = this.pnp === 1 ? this.bodyTerminal : 1;
        const cathode1 = this.pnp === 1 ? 1 : this.bodyTerminal;
        this.setVoltageColor(g, this.nodes[anode1].v);
        g.fillPolygon(this.bodyDiodePoly);
        this.setVoltageColor(g, this.nodes[cathode1].v);
        g.drawLine(this.bodyDiodeCathode[0], this.bodyDiodeCathode[1]);
        const anode2 = this.pnp === 1 ? this.bodyTerminal : 2;
        const cathode2 = this.pnp === 1 ? 2 : this.bodyTerminal;
        this.setVoltageColor(g, this.nodes[anode2].v);
        g.fillPolygon(this.bodyDiodePoly2);
        this.setVoltageColor(g, this.nodes[cathode2].v);
        g.drawLine(this.bodyDiodeCathode2[0], this.bodyDiodeCathode2[1]);
      }
    }
    if (!this.drawDigital()) {
      this.setVoltageColor(g, this.nodes[this.bodyTerminal].v);
      g.fillPolygon(this.arrowPoly);
    }
    if (power)
      g.setColor(Color.gray);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.gate[1]);
    CircuitElm.drawThickLine(g, this.gate[0], this.gate[2]);
    if (this.drawDigital() && this.pnp === -1)
      CircuitElm.drawThickCircle(g, this.pcircle.x, this.pcircle.y, this.pcircler);
    if ((this.flags & this.FLAG_SHOWVT) !== 0) {
      const s = "" + this.vt * this.pnp;
      g.setColor(CircuitElm.whiteColor);
      g.setFont(CircuitElm.unitsFont);
      this.drawCenteredText(g, s, this.x2 + 2, this.y2, false);
    }
    this.curcount_source = this.updateDotCountImpl(-(this.ids + this.capCurGS), this.curcount_source);
    this.curcount_drain = this.updateDotCountImpl(-this.ids + this.capCurGD, this.curcount_drain);
    this.drawDots(g, this.src[0], this.src[1], this.curcount_source);
    this.drawDots(g, this.src[1], this.drn[1], this.curcount_source);
    this.drawDots(g, this.drn[1], this.drn[0], this.curcount_drain);
    if (this.model.capGS > 0 || this.model.capGD > 0) {
      this.curcount_gate = this.updateDotCountImpl(this.capCurGS + this.capCurGD, this.curcount_gate);
      this.drawDots(g, this.point1, this.gate[1], this.curcount_gate);
    }
    if (this.showBulk()) {
      this.curcount_body1 = this.updateDotCountImpl(this.diodeCurrent1, this.curcount_body1);
      this.curcount_body2 = this.updateDotCountImpl(this.diodeCurrent2, this.curcount_body2);
      if (this.showBodyDiode() && !this.hasBodyTerminal()) {
        const cur = -this.curcount_body1 + this.curcount_body2;
        this.drawDots(g, this.src[0], this.bodyDiodeLeads[0], cur);
        this.drawDots(g, this.bodyDiodeLeads[0], this.bodyDiodeLeads[3], cur);
        this.drawDots(g, this.bodyDiodeLeads[3], this.drn[0], cur);
      } else {
        this.drawDots(g, this.src[0], this.body[0], -this.curcount_body1);
        this.drawDots(g, this.body[0], this.drn[0], this.curcount_body2);
      }
    }
    if (this.needsHighlight() || this.isCreating()) {
      g.setColor(CircuitElm.whiteColor);
      g.setFont(CircuitElm.unitsFont);
      const dsx = CircuitElm.sign(this.dx);
      CircuitElm.sign(this.dy);
      const dsyn = this.dy === 0 ? 0 : 1;
      g.drawString("G", this.gate[1].x - (this.dx < 0 ? -2 : 12), this.gate[1].y + (this.dy > 0 ? -5 : 12));
      const extra = this.showBodyDiode() && !this.hasBodyTerminal() && this.dy === 0 ? 16 * this.dsign : 0;
      g.drawString(this.pnp === -1 ? "D" : "S", this.src[0].x - 3 + 9 * (dsx - dsyn * this.pnp) + extra, this.src[0].y + 4);
      g.drawString(this.pnp === -1 ? "S" : "D", this.drn[0].x - 3 + 9 * (dsx - dsyn * this.pnp) + extra, this.drn[0].y + 4);
      if (this.hasBodyTerminal())
        g.drawString("B", this.body[0].x - 3 + 9 * (dsx - dsyn * this.pnp), this.body[0].y + 4);
    }
    this.drawPosts(g);
  }
  // post 0 = gate, 1 = source for NPN, 2 = drain for NPN, 3 = body (if present)
  // for PNP, 1 is drain, 2 is source
  getPost(n) {
    return n === 0 ? this.point1 : n === 1 ? this.src[0] : n === 2 ? this.drn[0] : this.body[0];
  }
  getCurrent() {
    return this.ids;
  }
  getPower() {
    return this.ids * (this.nodes[2].v - this.nodes[1].v) - this.diodeCurrent1 * (this.nodes[1].v - this.nodes[this.bodyTerminal].v) - this.diodeCurrent2 * (this.nodes[2].v - this.nodes[this.bodyTerminal].v);
  }
  getPostCount() {
    return this.hasBodyTerminal() ? 4 : 3;
  }
  addRoutingObstacle(router) {
    router.addObstacle([this.gate[0], this.gate[2], this.src[0], this.drn[0], this.src[2], this.drn[2]]);
    router.addWire(this.point1.x, this.point1.y, this.gate[1].x, this.gate[1].y);
  }
  setPoints() {
    super.setPoints();
    let hs2 = this.hs * this.dsign;
    if ((this.flags & this.FLAG_FLIP) !== 0)
      hs2 = -hs2;
    this.src = this.newPointArray(3);
    this.drn = this.newPointArray(3);
    this.interpPoint2(this.point1, this.point2, this.src[0], this.drn[0], 1, -hs2);
    this.interpPoint2(this.point1, this.point2, this.src[1], this.drn[1], 1 - 22 / this.dn, -hs2);
    this.interpPoint2(this.point1, this.point2, this.src[2], this.drn[2], 1 - 22 / this.dn, -hs2 * 4 / 3);
    this.gate = this.newPointArray(3);
    this.interpPoint2(this.point1, this.point2, this.gate[0], this.gate[2], 1 - 28 / this.dn, hs2 / 2);
    this.interpPoint(this.gate[0], this.gate[2], this.gate[1], 0.5);
    if (this.showBulk()) {
      this.body = this.newPointArray(2);
      this.interpPoint(this.src[0], this.drn[0], this.body[0], 0.5);
      this.interpPoint(this.src[1], this.drn[1], this.body[1], 0.5);
    }
    if (!this.drawDigital()) {
      if (this.pnp === 1) {
        if (!this.showBulk())
          this.arrowPoly = this.calcArrow(this.src[1], this.src[0], 10, 4);
        else
          this.arrowPoly = this.calcArrow(this.body[0], this.body[1], 12, 5);
      } else {
        if (!this.showBulk())
          this.arrowPoly = this.calcArrow(this.drn[0], this.drn[1], 12, 5);
        else
          this.arrowPoly = this.calcArrow(this.body[1], this.body[0], 12, 5);
      }
    } else if (this.pnp === -1) {
      this.interpPoint(this.point1, this.point2, this.gate[1], 1 - 36 / this.dn);
      const dist = this.dsign < 0 ? 32 : 31;
      this.pcircle = this.interpPoint(this.point1, this.point2, 1 - dist / this.dn);
      this.pcircler = 3;
    }
    if (this.showBodyDiode()) {
      let pa = this.newPointArray(2);
      if (!this.hasBodyTerminal()) {
        const diodeHs = 6;
        this.bodyDiodeCathode = this.newPointArray(2);
        this.bodyDiodeLeads = this.newPointArray(4);
        const dp1 = this.interpPoint(this.src[0], this.drn[0], 0.5 - diodeHs / 2 / this.hs, -hs2);
        const dp2 = this.interpPoint(this.src[0], this.drn[0], 0.5 + diodeHs / 2 / this.hs, -hs2);
        this.interpPoint2(dp1, dp2, pa[0], pa[1], 0, diodeHs);
        this.interpPoint2(dp1, dp2, this.bodyDiodeCathode[0], this.bodyDiodeCathode[1], 1, diodeHs);
        this.bodyDiodePoly = this.createPolygon(pa[0], pa[1], dp2);
        this.bodyDiodeLeads[0] = this.interpPoint(this.src[0], this.drn[0], 0, -hs2);
        this.bodyDiodeLeads[1] = dp1;
        this.bodyDiodeLeads[2] = dp2;
        this.bodyDiodeLeads[3] = this.interpPoint(this.src[0], this.drn[0], 1, -hs2);
      } else {
        const diodeHs = 3;
        this.bodyDiodeCathode = this.newPointArray(2);
        this.bodyDiodeCathode2 = this.newPointArray(2);
        const a1 = this.pnp === 1 ? this.body[0] : this.src[0];
        const b1 = this.pnp === 1 ? this.src[0] : this.body[0];
        let dp1 = this.interpPoint(a1, b1, 0.3);
        let dp2 = this.interpPoint(a1, b1, 0.7);
        this.interpPoint2(dp1, dp2, pa[0], pa[1], 0, diodeHs);
        this.interpPoint2(dp1, dp2, this.bodyDiodeCathode[0], this.bodyDiodeCathode[1], 1, diodeHs);
        this.bodyDiodePoly = this.createPolygon(pa[0], pa[1], dp2);
        pa = this.newPointArray(2);
        const a2 = this.pnp === 1 ? this.body[0] : this.drn[0];
        const b2 = this.pnp === 1 ? this.drn[0] : this.body[0];
        dp1 = this.interpPoint(a2, b2, 0.3);
        dp2 = this.interpPoint(a2, b2, 0.7);
        this.interpPoint2(dp1, dp2, pa[0], pa[1], 0, diodeHs);
        this.interpPoint2(dp1, dp2, this.bodyDiodeCathode2[0], this.bodyDiodeCathode2[1], 1, diodeHs);
        this.bodyDiodePoly2 = this.createPolygon(pa[0], pa[1], dp2);
      }
    }
  }
  lastv1 = 0;
  lastv2 = 0;
  ids = 0;
  mode = 0;
  gm = 0;
  startIteration() {
    if (CircuitElm.sim.timeStep <= 0)
      return;
    if (this.model.capGS > 0) {
      this.geqGS = this.model.capGS / CircuitElm.sim.timeStep;
      this.ceqGS = -this.geqGS * this.capVoltGS;
    }
    if (this.model.capGD > 0) {
      this.geqGD = this.model.capGD / CircuitElm.sim.timeStep;
      this.ceqGD = -this.geqGD * this.capVoltGD;
    }
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[1]);
    CircuitElm.sim.stampNonLinear(this.nodes[2]);
    if (this.hasGateCaps())
      CircuitElm.sim.stampNonLinear(this.nodes[0]);
    if (this.hasBodyTerminal())
      this.bodyTerminal = 3;
    else
      this.bodyTerminal = this.pnp === -1 ? 2 : 1;
    if (this.doBodyDiode()) {
      if (this.pnp === -1) {
        this.diodeB1.stamp(this.nodes[1], this.nodes[this.bodyTerminal]);
        this.diodeB2.stamp(this.nodes[2], this.nodes[this.bodyTerminal]);
      } else {
        this.diodeB1.stamp(this.nodes[this.bodyTerminal], this.nodes[1]);
        this.diodeB2.stamp(this.nodes[this.bodyTerminal], this.nodes[2]);
      }
    }
  }
  nonConvergence(last, now) {
    let diff = Math.abs(last - now);
    if (this.beta > 1)
      diff *= 100;
    if (diff < 0.01)
      return false;
    if (CircuitElm.sim.subIterations > 10 && diff < Math.abs(now) * 1e-3)
      return false;
    if (CircuitElm.sim.subIterations > 100 && diff < 0.01 + (CircuitElm.sim.subIterations - 100) * 1e-4)
      return false;
    return true;
  }
  stepFinished() {
    this.calculate(true);
    if (this.bodyTerminal === 1)
      this.diodeCurrent1 = -this.diodeCurrent2;
    if (this.bodyTerminal === 2)
      this.diodeCurrent2 = -this.diodeCurrent1;
    if (this.model.capGS > 0 && this.geqGS > 0) {
      this.capVoltGS = this.nodes[0].v - this.nodes[1].v;
      this.capCurGS = this.geqGS * this.capVoltGS + this.ceqGS;
    }
    if (this.model.capGD > 0 && this.geqGD > 0) {
      this.capVoltGD = this.nodes[0].v - this.nodes[2].v;
      this.capCurGD = this.geqGD * this.capVoltGD + this.ceqGD;
    }
  }
  doStep() {
    this.calculate(false);
  }
  lastv0 = 0;
  // this is called in doStep to stamp the matrix, and also called in stepFinished() to calculate the current
  calculate(finished) {
    let vs;
    if (finished)
      vs = [this.nodes[0].v, this.nodes[1].v, this.nodes[2].v];
    else {
      vs = [this.nodes[0].v, this.nodes[1].v, this.nodes[2].v];
      if (vs[1] > this.lastv1 + 0.5)
        vs[1] = this.lastv1 + 0.5;
      if (vs[1] < this.lastv1 - 0.5)
        vs[1] = this.lastv1 - 0.5;
      if (vs[2] > this.lastv2 + 0.5)
        vs[2] = this.lastv2 + 0.5;
      if (vs[2] < this.lastv2 - 0.5)
        vs[2] = this.lastv2 - 0.5;
    }
    let source = 1;
    let drain = 2;
    if (this.pnp * vs[1] > this.pnp * vs[2]) {
      source = 2;
      drain = 1;
    }
    const gateIdx = 0;
    let vgs = vs[gateIdx] - vs[source];
    let vds = vs[drain] - vs[source];
    if (!finished && (this.nonConvergence(this.lastv1, vs[1]) || this.nonConvergence(this.lastv2, vs[2]) || this.nonConvergence(this.lastv0, vs[0])))
      CircuitElm.sim.converged = false;
    this.lastv0 = vs[0];
    this.lastv1 = vs[1];
    this.lastv2 = vs[2];
    const realvgs = vgs;
    const realvds = vds;
    vgs *= this.pnp;
    vds *= this.pnp;
    this.ids = 0;
    this.gm = 0;
    let Gds = 0;
    if (vgs < this.vt) {
      Gds = 1e-8;
      this.ids = vds * Gds;
      this.mode = 0;
    } else if (vds < vgs - this.vt) {
      const lambda = this.model.lambda;
      this.ids = this.beta * ((vgs - this.vt) * vds - vds * vds * 0.5) * (1 + lambda * vds);
      this.gm = this.beta * vds * (1 + lambda * vds);
      Gds = this.beta * ((vgs - vds - this.vt) * (1 + lambda * vds) + lambda * ((vgs - this.vt) * vds - vds * vds * 0.5));
      this.mode = 1;
    } else {
      const lambda = this.model.lambda;
      const vgs_vt = vgs - this.vt;
      this.gm = this.beta * vgs_vt * (1 + lambda * vds);
      Gds = 0.5 * this.beta * vgs_vt * vgs_vt * lambda;
      let gdsMin = 0;
      if (Gds < 1e-8) {
        gdsMin = 1e-8 - Gds;
        Gds = 1e-8;
      }
      this.ids = 0.5 * this.beta * vgs_vt * vgs_vt * (1 + lambda * vds) + (vds - vgs_vt) * gdsMin;
      this.mode = 2;
    }
    if (this.doBodyDiode()) {
      this.diodeB1.doStep(this.pnp * (this.nodes[this.bodyTerminal].v - this.nodes[1].v));
      this.diodeCurrent1 = this.diodeB1.calculateCurrent(this.pnp * (this.nodes[this.bodyTerminal].v - this.nodes[1].v)) * this.pnp;
      this.diodeB2.doStep(this.pnp * (this.nodes[this.bodyTerminal].v - this.nodes[2].v));
      this.diodeCurrent2 = this.diodeB2.calculateCurrent(this.pnp * (this.nodes[this.bodyTerminal].v - this.nodes[2].v)) * this.pnp;
    } else
      this.diodeCurrent1 = this.diodeCurrent2 = 0;
    const ids0 = this.ids;
    if (source === 2 && this.pnp === 1 || source === 1 && this.pnp === -1)
      this.ids = -this.ids;
    if (finished)
      return;
    const rs = -this.pnp * ids0 + Gds * realvds + this.gm * realvgs;
    CircuitElm.sim.stampMatrix(this.nodes[drain], this.nodes[drain], Gds);
    CircuitElm.sim.stampMatrix(this.nodes[drain], this.nodes[source], -Gds - this.gm);
    CircuitElm.sim.stampMatrix(this.nodes[drain], this.nodes[gateIdx], this.gm);
    CircuitElm.sim.stampMatrix(this.nodes[source], this.nodes[drain], -Gds);
    CircuitElm.sim.stampMatrix(this.nodes[source], this.nodes[source], Gds + this.gm);
    CircuitElm.sim.stampMatrix(this.nodes[source], this.nodes[gateIdx], -this.gm);
    CircuitElm.sim.stampRightSide(this.nodes[drain], rs);
    CircuitElm.sim.stampRightSide(this.nodes[source], -rs);
    if (this.model.capGS > 0 && this.geqGS > 0) {
      CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[0], this.geqGS);
      CircuitElm.sim.stampMatrix(this.nodes[1], this.nodes[1], this.geqGS);
      CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[1], -this.geqGS);
      CircuitElm.sim.stampMatrix(this.nodes[1], this.nodes[0], -this.geqGS);
      CircuitElm.sim.stampRightSide(this.nodes[0], -this.ceqGS);
      CircuitElm.sim.stampRightSide(this.nodes[1], this.ceqGS);
    }
    if (this.model.capGD > 0 && this.geqGD > 0) {
      CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[0], this.geqGD);
      CircuitElm.sim.stampMatrix(this.nodes[2], this.nodes[2], this.geqGD);
      CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[2], -this.geqGD);
      CircuitElm.sim.stampMatrix(this.nodes[2], this.nodes[0], -this.geqGD);
      CircuitElm.sim.stampRightSide(this.nodes[0], -this.ceqGD);
      CircuitElm.sim.stampRightSide(this.nodes[2], this.ceqGD);
    }
  }
  getFetInfo(arr, n) {
    arr[0] = Locale.LS((this.pnp === -1 ? "p-" : "n-") + n) + " (" + this.modelName + ")";
    arr[1] = "Vt=" + CircuitElm.getVoltageText(this.pnp * this.vt) + ", β=" + this.beta;
    arr[2] = (this.pnp === 1 ? "Ids = " : "Isd = ") + CircuitElm.getCurrentText(this.ids);
    arr[3] = "Vgs = " + CircuitElm.getVoltageText(this.nodes[0].v - this.nodes[this.pnp === -1 ? 2 : 1].v);
    arr[4] = (this.pnp === 1 ? "Vds = " : "Vsd = ") + CircuitElm.getVoltageText(this.nodes[2].v - this.nodes[1].v);
    arr[5] = Locale.LS(this.mode === 0 ? "off" : this.mode === 1 ? "linear" : "saturation");
    arr[6] = "gm = " + CircuitElm.getUnitText(this.gm, "A/V");
    arr[7] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
    let idx = 8;
    if (this.showBulk())
      arr[idx++] = "Ib = " + CircuitElm.getUnitText(this.bodyTerminal === 1 ? -this.diodeCurrent1 : this.bodyTerminal === 2 ? this.diodeCurrent2 : -this.pnp * (this.diodeCurrent1 + this.diodeCurrent2), "A");
    if (this.model.capGS > 0)
      arr[idx++] = "Cgs = " + CircuitElm.getUnitText(this.model.capGS, "F");
    if (this.model.capGD > 0)
      arr[idx] = "Cgd = " + CircuitElm.getUnitText(this.model.capGD, "F");
  }
  getElmType() {
    return "MOSFET";
  }
  getInfo(arr) {
    this.getFetInfo(arr, "MOSFET");
  }
  getScopeText(v) {
    return Locale.LS((this.pnp === -1 ? "p-" : "n-") + "MOSFET");
  }
  canViewInScope() {
    return true;
  }
  getVoltageDiff() {
    return this.nodes[2].v - this.nodes[1].v;
  }
  getConnection(n1, n2) {
    if (this.hasGateCaps())
      return true;
    return !(n1 === 0 || n2 === 0);
  }
  getMatrixConnection(n1, n2) {
    return true;
  }
  models;
  // does this element support D/S swapping?  JfetElm overrides this to false since its
  // setPoints() doesn't honor FLAG_FLIP.  (The rest of the mosfet-only options - bulk
  // terminal, digital symbol, body diode - now live on MosfetModel, not here.)
  hasSwapDS() {
    return true;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Model", 0, -1, -1);
      this.models = MosfetModel.getModelList(this.isJfet());
      ei.choice = new Choice();
      for (let i = 0; i !== this.models.length; i++) {
        const mm = this.models[i];
        ei.choice.add(mm.getDescription());
        if (mm === this.model)
          ei.choice.select(i);
      }
      return ei;
    }
    let idx = 1;
    if (this.hasSwapDS()) {
      if (n === idx++) {
        const ei = new EditInfo("", 0, -1, -1);
        ei.checkbox = new Checkbox("Swap D/S", (this.flags & this.FLAG_FLIP) !== 0);
        return ei;
      }
    }
    if (n === idx) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Create New Model") };
      return ei;
    }
    if (n === idx + 1) {
      if (this.model.readOnly)
        return null;
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Edit Model") };
      return ei;
    }
    return null;
  }
  newModelCreated(mm) {
    this.model = mm;
    this.modelName = this.model.name;
    this.setup();
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.model = this.models[ei.choice.getSelectedIndex()];
      this.modelName = this.model.name;
      this.setLastModelName(this.modelName);
      this.setup();
      ei.newDialog = true;
    } else {
      let idx = 1;
      if (this.hasSwapDS() && n === idx++) {
        this.flags = ei.checkbox.getState() ? this.flags | this.FLAG_FLIP : this.flags & ~this.FLAG_FLIP;
      } else if (n === idx) {
        const newModel = new MosfetModel(this.model);
        const editDialog = new EditMosfetModelDialog(newModel, CirSim.theApp, this);
        CirSim.mosfetModelEditDialog = editDialog;
        editDialog.show();
        return;
      } else if (n === idx + 1) {
        if (this.model.readOnly) {
          window.alert(Locale.LS("This model cannot be modified.  Change the model name to allow customization."));
          return;
        }
        const editDialog = new EditMosfetModelDialog(this.model, CirSim.theApp, null);
        CirSim.mosfetModelEditDialog = editDialog;
        editDialog.show();
        return;
      }
    }
    this.allocNodes();
    this.setPoints();
  }
  getCurrentIntoNode(n) {
    if (n === 0) {
      let gateCur = 0;
      if (this.model.capGS > 0 && this.geqGS > 0)
        gateCur -= this.geqGS * (this.nodes[0].v - this.nodes[1].v) + this.ceqGS;
      if (this.model.capGD > 0 && this.geqGD > 0)
        gateCur -= this.geqGD * (this.nodes[0].v - this.nodes[2].v) + this.ceqGD;
      return gateCur;
    }
    if (n === 3)
      return -this.diodeCurrent1 - this.diodeCurrent2;
    if (n === 1) {
      const capCur2 = this.model.capGS > 0 && this.geqGS > 0 ? this.geqGS * (this.nodes[0].v - this.nodes[1].v) + this.ceqGS : 0;
      return this.ids + this.diodeCurrent1 + capCur2;
    }
    const capCur = this.model.capGD > 0 && this.geqGD > 0 ? this.geqGD * (this.nodes[0].v - this.nodes[2].v) + this.ceqGD : 0;
    return -this.ids + this.diodeCurrent2 + capCur;
  }
  flipX(c2, count) {
    if (this.x === this.x2)
      this.flags ^= this.FLAG_FLIP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    if (this.y === this.y2)
      this.flags ^= this.FLAG_FLIP;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    this.flags ^= this.FLAG_FLIP;
    super.flipXY(xmy, count);
  }
}
class NMosfetElm extends MosfetElm {
  constructor(xx, yy) {
    super(xx, yy, false);
  }
  getDumpClass() {
    return MosfetElm;
  }
  getShortcut() {
    return "N".charCodeAt(0);
  }
}
class PMosfetElm extends MosfetElm {
  constructor(xx, yy) {
    super(xx, yy, true);
  }
  getDumpClass() {
    return MosfetElm;
  }
  getShortcut() {
    return "P".charCodeAt(0);
  }
}

class JfetElm extends MosfetElm {
  diode;
  gateCurrent = 0;
  gatePoly;
  gatePt;
  curcountg = 0;
  curcounts = 0;
  curcountd = 0;
  constructor(xa, ya, xbOrPnp, yb, f, st) {
    if (typeof xbOrPnp === "boolean") {
      super(xa, ya, xbOrPnp);
    } else if (xbOrPnp !== void 0) {
      super(xa, ya, xbOrPnp, yb, f, st);
    } else {
      super(xa, ya, false);
    }
    this.noDiagonal = true;
    this.diode = new Diode(SimulationManager.theSim);
    this.diode.setupForDefaultModel();
  }
  reset() {
    super.reset();
    this.diode.reset();
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.hs);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.src[0], this.src[1]);
    CircuitElm.drawThickLine(g, this.src[1], this.src[2]);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.drn[0], this.drn[1]);
    CircuitElm.drawThickLine(g, this.drn[1], this.drn[2]);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.gatePt);
    g.fillPolygon(this.arrowPoly);
    this.setPowerColor(g, true);
    g.fillPolygon(this.gatePoly);
    this.curcountd = this.updateDotCountImpl(-this.ids, this.curcountd);
    this.curcountg = this.updateDotCountImpl(this.gateCurrent, this.curcountg);
    this.curcounts = this.updateDotCountImpl(-this.gateCurrent - this.ids, this.curcounts);
    if (this.curcountd !== 0 || this.curcounts !== 0) {
      this.drawDots(g, this.src[0], this.src[1], this.curcounts);
      this.drawDots(g, this.src[1], this.src[2], this.addCurCount(this.curcounts, 8));
      this.drawDots(g, this.drn[0], this.drn[1], -this.curcountd);
      this.drawDots(g, this.drn[1], this.drn[2], -this.addCurCount(this.curcountd, 8));
      this.drawDots(g, this.point1, this.gatePt, this.curcountg);
    }
    if (this.needsHighlight()) {
      g.setColor(CircuitElm.whiteColor);
      g.setFont(CircuitElm.unitsFont);
      const dsx = CircuitElm.sign(this.dx);
      const dsyn = this.dy === 0 ? 0 : 1;
      if (this.dy === 0) {
        g.drawString("G", this.gate[1].x - (this.dx < 0 ? -2 : 12), this.gate[1].y + (this.dy > 0 ? -5 : 12));
        g.drawString(this.pnp === -1 ? "D" : "S", this.src[0].x - 3 + 9 * (dsx - dsyn * this.pnp), this.src[0].y + 4);
        g.drawString(this.pnp === -1 ? "S" : "D", this.drn[0].x - 3 + 9 * (dsx - dsyn * this.pnp), this.drn[0].y + 4);
      } else if (this.dx === 0) {
        g.drawString("G", this.gate[1].x - (this.dx < 0 ? -2 : 12), this.gate[1].y + (this.dy > 0 ? -5 : 12));
        g.drawString(this.pnp === -1 ? "D" : "S", this.src[0].x - 4, this.src[0].y - (this.dy < 0 ? 7 : -14));
        g.drawString(this.pnp === -1 ? "S" : "D", this.drn[0].x - 4, this.drn[0].y - (this.dy < 0 ? 7 : -14));
      }
    }
    this.drawPosts(g);
  }
  getCurrentIntoNode(n) {
    if (n === 0)
      return -this.gateCurrent;
    if (n === 1)
      return this.gateCurrent + this.ids;
    return -this.ids;
  }
  setPoints() {
    super.setPoints();
    let hs2 = this.hs * this.dsign;
    if ((this.flags & this.FLAG_FLIP) !== 0)
      hs2 = -hs2;
    this.src = this.newPointArray(3);
    this.drn = this.newPointArray(3);
    this.interpPoint2(this.point1, this.point2, this.src[0], this.drn[0], 1, -hs2);
    this.interpPoint2(this.point1, this.point2, this.src[1], this.drn[1], 1, -hs2 / 2);
    this.interpPoint2(this.point1, this.point2, this.src[2], this.drn[2], 1 - 10 / this.dn, -hs2 / 2);
    this.gatePt = this.interpPoint(this.point1, this.point2, 1 - 14 / this.dn);
    const ra = this.newPointArray(4);
    this.interpPoint2(this.point1, this.point2, ra[0], ra[1], 1 - 13 / this.dn, this.hs);
    this.interpPoint2(this.point1, this.point2, ra[2], ra[3], 1 - 10 / this.dn, this.hs);
    this.gatePoly = this.createPolygon(ra[0], ra[1], ra[3], ra[2]);
    if (this.pnp === -1) {
      const x = this.interpPoint(this.gatePt, this.point1, 18 / this.dn);
      this.arrowPoly = this.calcArrow(this.gatePt, x, 12, 5);
    } else
      this.arrowPoly = this.calcArrow(this.point1, this.gatePt, 12, 5);
  }
  stamp() {
    super.stamp();
    if (this.pnp < 0)
      this.diode.stamp(this.nodes[1], this.nodes[0]);
    else
      this.diode.stamp(this.nodes[0], this.nodes[1]);
  }
  doStep() {
    super.doStep();
    this.diode.doStep(this.pnp * (this.nodes[0].v - this.nodes[1].v));
  }
  calculateCurrent() {
    this.gateCurrent = this.pnp * this.diode.calculateCurrent(this.pnp * (this.nodes[0].v - this.nodes[1].v));
  }
  showBulk() {
    return false;
  }
  isJfet() {
    return true;
  }
  hasSwapDS() {
    return true;
  }
  static lastJfetModelName = "default-jfet";
  getLastModelName() {
    return JfetElm.lastJfetModelName;
  }
  setLastModelName(n) {
    JfetElm.lastJfetModelName = n;
  }
  getDumpType() {
    return "j".charCodeAt(0);
  }
  isJfetElm() {
    return true;
  }
  // these values are taken from Hayes+Horowitz p155
  getDefaultThreshold() {
    return -4;
  }
  getBackwardCompatibilityBeta() {
    return 125e-5;
  }
  getElmType() {
    return "JFET";
  }
  getInfo(arr) {
    this.getFetInfo(arr, "JFET");
  }
  getEditInfo(n) {
    if (n < 3)
      return super.getEditInfo(n);
    return null;
  }
  getConnection(n1, n2) {
    return true;
  }
  getScopeText(v) {
    return Locale.LS((this.pnp === -1 ? "p-" : "n-") + "JFET");
  }
}
class NJfetElm extends JfetElm {
  constructor(xx, yy) {
    super(xx, yy, false);
  }
  getDumpClass() {
    return JfetElm;
  }
}
class PJfetElm extends JfetElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb !== void 0)
      super(xa, ya, xb, yb, f, st);
    else
      super(xa, ya, true);
  }
  getDumpClass() {
    return JfetElm;
  }
}

class EditTransistorModelDialog extends EditDialog {
  model;
  transistorElm;
  constructor(dm, f, te) {
    super(dm, f);
    this.model = dm;
    this.transistorElm = te;
    this.applyButton.remove();
  }
  apply() {
    if (!super.apply())
      return false;
    if (this.model.name === null || this.model.name.length === 0)
      this.model.pickName();
    if (this.transistorElm !== null)
      this.transistorElm.newModelCreated(this.model);
    return true;
  }
  closeDialog() {
    super.closeDialog();
    const edlg = CirSim.editDialog;
    CirSim.console("resetting dialog " + edlg);
    if (edlg !== null)
      edlg.resetDialog();
    CirSim.diodeModelEditDialog = null;
  }
}

class TransistorElm extends CircuitElm {
  // node 0 = base
  // node 1 = collector
  // node 2 = emitter
  pnp;
  beta;
  gmin = 0;
  modelName;
  model;
  static lastModelName = "default";
  // never changes??
  static FLAG_FLIP = 1;
  static FLAG_CIRCLE = 2;
  static FLAGS_GLOBAL = TransistorElm.FLAG_CIRCLE;
  static globalFlags = 0;
  badIters = 0;
  localSubIters = 0;
  constructor(xa, ya, xbOrPnp, yb, f, st) {
    if (typeof xbOrPnp !== "number") {
      super(xa, ya);
      this.pnp = xbOrPnp ? -1 : 1;
      this.beta = 100;
      this.modelName = TransistorElm.lastModelName;
      this.setup();
    } else {
      super(xa, ya, xbOrPnp, yb, f);
      this.pnp = parseIntStrict(st.nextToken());
      this.beta = 100;
      try {
        this.lastvbc = parseFloatStrict(st.nextToken());
        this.lastvbe = parseFloatStrict(st.nextToken());
        this.justLoaded = true;
        this.beta = parseFloatStrict(st.nextToken());
        this.modelName = CustomLogicModel.unescape(st.nextToken());
      } catch (e) {
        this.modelName = "default";
      }
      TransistorElm.globalFlags = f & TransistorElm.FLAGS_GLOBAL;
      this.setup();
    }
  }
  setup() {
    this.model = TransistorModel.getModelWithNameOrCopy(this.modelName, this.model ?? null);
    this.modelName = this.model.name;
    this.vcrit = TransistorElm.vt * Math.log(TransistorElm.vt / (Math.sqrt(2) * this.model.satCur));
    this.noDiagonal = true;
  }
  nonLinear() {
    return true;
  }
  onMouseWheel(e) {
    if (CirSim.typeScrollPopup != null && CirSim.typeScrollPopup.isShowing()) {
      CirSim.typeScrollPopup.doDeltaY(ScrollValuePopup.normalizeWheelDelta(e));
      return;
    }
    CirSim.typeScrollPopup = new TypeScrollPopup(e.clientX, e.clientY, ScrollValuePopup.normalizeWheelDelta(e), this, CircuitElm.app);
  }
  reset() {
    this.lastvbc = this.lastvbe = this.curcount_c = this.curcount_e = this.curcount_b = 0;
    this.capVoltBE = this.capVoltBC = this.capCurBE = this.capCurBC = 0;
    this.geqBE = this.geqBC = this.ceqBE = this.ceqBC = 0;
    this.badIters = 0;
    this.localSubIters = 0;
  }
  getDumpType() {
    return "t".charCodeAt(0);
  }
  dumpXml(doc, elem) {
    if (!(this.model.builtIn || this.model.dumped))
      this.model.dumpXml(doc);
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "pn", this.pnp);
    CircuitXMLSerializer.dumpAttr(elem, "be", this.beta);
    CircuitXMLSerializer.dumpAttr(elem, "mo", this.modelName);
  }
  dumpXmlState(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "vBE", this.nodes[0].v - this.nodes[2].v);
    CircuitXMLSerializer.dumpAttr(elem, "vBC", this.nodes[0].v - this.nodes[1].v);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.pnp = xml.parseIntAttr("pn", this.pnp);
    this.beta = xml.parseDoubleAttr("be", this.beta);
    this.modelName = xml.parseStringAttr("mo", this.modelName);
    if (xml.currentXmlElement.getAttribute("vBE") != null || xml.currentXmlElement.getAttribute("vBC") != null) {
      this.lastvbe = xml.parseDoubleAttr("vBE", 0);
      this.lastvbc = xml.parseDoubleAttr("vBC", 0);
    } else {
      this.lastvbc = xml.parseDoubleAttr("vbe", 0);
      this.lastvbe = xml.parseDoubleAttr("vbc", 0);
    }
    this.justLoaded = true;
    TransistorElm.globalFlags = this.flags & TransistorElm.FLAGS_GLOBAL;
    this.setup();
  }
  updateModels() {
    this.setup();
  }
  dumpXmlModel(doc) {
    if (!(this.model.builtIn || this.model.dumped))
      this.model.dumpXml(doc);
  }
  ic = 0;
  ie = 0;
  ib = 0;
  curcount_c = 0;
  curcount_e = 0;
  curcount_b = 0;
  // Junction capacitance state (trapezoidal companion model)
  capVoltBE = 0;
  // junction voltages from end of previous time step
  capVoltBC = 0;
  capCurBE = 0;
  // junction cap currents from end of previous time step
  capCurBC = 0;
  geqBE = 0;
  // companion conductances (computed in startIteration)
  geqBC = 0;
  ceqBE = 0;
  // companion current sources (computed in startIteration)
  ceqBC = 0;
  rectPoly;
  arrowPoly;
  circleCenter;
  hasCircle() {
    return (TransistorElm.globalFlags & TransistorElm.FLAG_CIRCLE) !== 0;
  }
  draw(g) {
    if ((this.flags & TransistorElm.FLAGS_GLOBAL) !== TransistorElm.globalFlags)
      this.setPoints();
    this.setBbox(this.point1, this.point2, 16);
    if (this.hasCircle()) {
      g.setColor(Color.gray);
      CircuitElm.drawThickCircle(g, this.circleCenter.x, this.circleCenter.y, 20);
    }
    this.setPowerColor(g, true);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.coll[0], this.coll[1]);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.emit[0], this.emit[1]);
    g.fillPolygon(this.arrowPoly);
    this.setVoltageColor(g, this.nodes[0].v);
    if (this.showPower())
      g.setColor(Color.gray);
    CircuitElm.drawThickLine(g, this.point1, this.base);
    this.curcount_b = this.updateDotCountImpl(-this.ib, this.curcount_b);
    this.drawDots(g, this.base, this.point1, this.curcount_b);
    this.curcount_c = this.updateDotCountImpl(-this.ic, this.curcount_c);
    this.drawDots(g, this.coll[1], this.coll[0], this.curcount_c);
    this.curcount_e = this.updateDotCountImpl(-this.ie, this.curcount_e);
    this.drawDots(g, this.emit[1], this.emit[0], this.curcount_e);
    this.setVoltageColor(g, this.nodes[0].v);
    this.setPowerColor(g, true);
    g.fillPolygon(this.rectPoly);
    if (this.needsHighlight() || this.isCreating()) {
      g.setColor(CircuitElm.whiteColor);
      if (this.dy === 0) {
        g.drawString("B", this.base.x - (this.dx < 0 ? -2 : 10), this.base.y - 4);
        g.drawString("C", this.coll[0].x - (this.dx < 0 ? 13 : -6), this.coll[0].y + 4);
        g.drawString("E", this.emit[0].x - (this.dx < 0 ? 13 : -6), this.emit[0].y + 4);
      } else if (this.dx === 0) {
        g.drawString("B", this.base.x + 3, this.base.y - (this.dy < 0 ? -11 : 3));
        g.drawString("C", this.coll[0].x - 4, this.coll[0].y - (this.dy < 0 ? 7 : -14));
        g.drawString("E", this.emit[0].x - 4, this.emit[0].y - (this.dy < 0 ? 7 : -14));
      }
    }
    this.drawPosts(g);
  }
  getPost(n) {
    return n === 0 ? this.point1 : n === 1 ? this.coll[0] : this.emit[0];
  }
  getPostCount() {
    return 3;
  }
  getPower() {
    return (this.nodes[0].v - this.nodes[2].v) * this.ib + (this.nodes[1].v - this.nodes[2].v) * this.ic;
  }
  rect;
  coll;
  emit;
  base;
  setPoints() {
    this.flags &= ~TransistorElm.FLAGS_GLOBAL;
    this.flags |= TransistorElm.globalFlags;
    super.setPoints();
    const hs = 16;
    if ((this.flags & TransistorElm.FLAG_FLIP) !== 0)
      this.dsign = -this.dsign;
    const hs2 = hs * this.dsign * this.pnp;
    this.coll = this.newPointArray(2);
    this.emit = this.newPointArray(2);
    this.interpPoint2(this.point1, this.point2, this.coll[0], this.emit[0], 1, hs2);
    this.rect = this.newPointArray(4);
    this.interpPoint2(this.point1, this.point2, this.rect[0], this.rect[1], 1 - 16 / this.dn, hs);
    this.interpPoint2(this.point1, this.point2, this.rect[2], this.rect[3], 1 - 13 / this.dn, hs);
    this.interpPoint2(this.point1, this.point2, this.coll[1], this.emit[1], 1 - 13 / this.dn, 6 * this.dsign * this.pnp);
    this.base = this.interpPoint(this.point1, this.point2, 1 - 16 / this.dn);
    this.rectPoly = this.createPolygon(this.rect[0], this.rect[2], this.rect[3], this.rect[1]);
    if (this.pnp === 1)
      this.arrowPoly = this.calcArrow(this.emit[1], this.emit[0], 8, 4);
    else
      this.arrowPoly = this.calcArrow(this.emit[0], this.emit[1], 8, 4);
    this.circleCenter = this.interpPoint(this.base, this.point2, 0.5);
  }
  addRoutingObstacle(router) {
    router.addObstacle([this.rect[0], this.rect[1], this.rect[2], this.rect[3], this.coll[0], this.emit[0]]);
    router.addWire(this.point1.x, this.point1.y, this.base.x, this.base.y);
  }
  static leakage = 1e-13;
  // 1e-6;
  // Electron thermal voltage at SPICE's default temperature of 27 C (300.15 K):
  static vt = 0.025865;
  vcrit = 0;
  lastvbc = 0;
  lastvbe = 0;
  justLoaded = false;
  limitStep(vnew, vold) {
    let arg;
    if (vnew > this.vcrit && Math.abs(vnew - vold) > TransistorElm.vt + TransistorElm.vt) {
      if (vold > 0) {
        arg = 1 + (vnew - vold) / TransistorElm.vt;
        if (arg > 0) {
          vnew = vold + TransistorElm.vt * Math.log(arg);
        } else {
          vnew = this.vcrit;
        }
      } else {
        vnew = TransistorElm.vt * Math.log(vnew / TransistorElm.vt);
      }
      CircuitElm.sim.converged = false;
    }
    return vnew;
  }
  // Calculate voltage-dependent junction depletion capacitance.
  // This is the SPICE standard formula: the PN junction's depletion
  // layer acts as a parallel-plate capacitor whose plate spacing
  // changes with applied voltage.
  //   vj  = voltage across the junction (positive = forward bias)
  //   cj0 = zero-bias capacitance (the value when no voltage is applied)
  //   vj0 = built-in junction potential (typically 0.6-0.8V for silicon)
  //   mj  = grading coefficient (0.33 for linearly graded, 0.5 for abrupt)
  static calcJunctionCap(vj, cj0, vj0, mj) {
    if (cj0 <= 0)
      return 0;
    const fc = 0.5;
    if (vj < fc * vj0) {
      return cj0 / Math.pow(1 - vj / vj0, mj);
    } else {
      return cj0 / Math.pow(1 - fc, 1 + mj) * (1 - fc * (1 + mj) + mj * vj / vj0);
    }
  }
  startIteration() {
    const hasBEcap = this.model.junctionCapBE > 0 || this.model.transitTimeF > 0;
    const hasBCcap = this.model.junctionCapBC > 0 || this.model.transitTimeR > 0;
    if (hasBEcap && CircuitElm.sim.timeStep > 0) {
      const vjBE = this.pnp * this.capVoltBE;
      let cje = TransistorElm.calcJunctionCap(vjBE, this.model.junctionCapBE, this.model.junctionPotBE, this.model.junctionExpBE);
      if (this.model.transitTimeF > 0 && vjBE > 0) {
        const vtn = TransistorElm.vt * this.model.emissionCoeffF;
        cje += this.model.transitTimeF * this.model.satCur * Math.exp(vjBE / vtn) / vtn;
      }
      this.geqBE = 2 * cje / CircuitElm.sim.timeStep;
      if (this.geqBE < 1e-20) {
        this.geqBE = this.ceqBE = this.capCurBE = 0;
      } else this.ceqBE = -this.geqBE * this.capVoltBE - this.capCurBE;
    }
    if (hasBCcap && CircuitElm.sim.timeStep > 0) {
      const vjBC = this.pnp * this.capVoltBC;
      let cjc = TransistorElm.calcJunctionCap(vjBC, this.model.junctionCapBC, this.model.junctionPotBC, this.model.junctionExpBC);
      if (this.model.transitTimeR > 0 && vjBC > 0) {
        cjc += this.model.transitTimeR * this.model.satCur * Math.exp(vjBC / (TransistorElm.vt * this.model.emissionCoeffR)) / (TransistorElm.vt * this.model.emissionCoeffR);
      }
      this.geqBC = 2 * cjc / CircuitElm.sim.timeStep;
      if (this.geqBC < 1e-20) {
        this.geqBC = this.ceqBC = this.capCurBC = 0;
      } else this.ceqBC = -this.geqBC * this.capVoltBC - this.capCurBC;
    }
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[0]);
    CircuitElm.sim.stampNonLinear(this.nodes[1]);
    CircuitElm.sim.stampNonLinear(this.nodes[2]);
  }
  doStep() {
    let vbc = this.justLoaded ? this.pnp * this.lastvbc : this.pnp * (this.nodes[0].v - this.nodes[1].v);
    let vbe = this.justLoaded ? this.pnp * this.lastvbe : this.pnp * (this.nodes[0].v - this.nodes[2].v);
    this.justLoaded = false;
    const notConverged = Math.abs(vbc - this.lastvbc) > 0.01 || Math.abs(vbe - this.lastvbe) > 0.01;
    if (notConverged)
      CircuitElm.sim.converged = false;
    if (notConverged)
      this.localSubIters++;
    else
      this.localSubIters = 0;
    this.gmin = 1e-12;
    if (this.localSubIters > 100 && this.badIters < 5) {
      this.gmin = Math.exp(-9 * Math.log(10) * (1 - this.localSubIters / 300));
      if (this.gmin > 0.1)
        this.gmin = 0.1;
    }
    vbc = this.limitStep(vbc, this.lastvbc);
    vbe = this.limitStep(vbe, this.lastvbe);
    this.lastvbc = vbc;
    this.lastvbe = vbe;
    const csat = this.model.satCur;
    const oik = this.model.invRollOffF;
    const c2 = this.model.BEleakCur;
    const vte = this.model.leakBEemissionCoeff * TransistorElm.vt;
    const oikr = this.model.invRollOffR;
    const c4 = this.model.BCleakCur;
    const vtc = this.model.leakBCemissionCoeff * TransistorElm.vt;
    let vtn = TransistorElm.vt * this.model.emissionCoeffF;
    let evbe, cbe, gbe, cben, gben, evben, evbc, cbc, gbc, cbcn, gbcn, evbcn;
    let qb, dqbdve, dqbdvc, q2, sqarg, arg;
    if (vbe > -5 * vtn) {
      evbe = Math.exp(vbe / vtn);
      cbe = csat * (evbe - 1) + this.gmin * vbe;
      gbe = csat * evbe / vtn + this.gmin;
      if (c2 === 0) {
        cben = 0;
        gben = 0;
      } else {
        evben = Math.exp(vbe / vte);
        cben = c2 * (evben - 1);
        gben = c2 * evben / vte;
      }
    } else {
      gbe = -csat / vbe + this.gmin;
      cbe = gbe * vbe;
      gben = -c2 / vbe;
      cben = gben * vbe;
    }
    vtn = TransistorElm.vt * this.model.emissionCoeffR;
    if (vbc > -5 * vtn) {
      evbc = Math.exp(vbc / vtn);
      cbc = csat * (evbc - 1) + this.gmin * vbc;
      gbc = csat * evbc / vtn + this.gmin;
      if (c4 === 0) {
        cbcn = 0;
        gbcn = 0;
      } else {
        evbcn = Math.exp(vbc / vtc);
        cbcn = c4 * (evbcn - 1);
        gbcn = c4 * evbcn / vtc;
      }
    } else {
      gbc = -csat / vbc + this.gmin;
      cbc = gbc * vbc;
      gbcn = -c4 / vbc;
      cbcn = gbcn * vbc;
    }
    const q1 = 1 / (1 - this.model.invEarlyVoltF * vbc - this.model.invEarlyVoltR * vbe);
    if (oik === 0 && oikr === 0) {
      qb = q1;
      dqbdve = q1 * qb * this.model.invEarlyVoltR;
      dqbdvc = q1 * qb * this.model.invEarlyVoltF;
    } else {
      q2 = oik * cbe + oikr * cbc;
      arg = Math.max(0, 1 + 4 * q2);
      sqarg = 1;
      if (arg !== 0) sqarg = Math.sqrt(arg);
      qb = q1 * (1 + sqarg) / 2;
      dqbdve = q1 * (qb * this.model.invEarlyVoltR + oik * gbe / sqarg);
      dqbdvc = q1 * (qb * this.model.invEarlyVoltF + oikr * gbc / sqarg);
    }
    let cc = 0;
    const cex = cbe;
    const gex = gbe;
    cc = cc + (cex - cbc) / qb - cbc / this.model.betaR - cbcn;
    const cb = cbe / this.beta + cben + cbc / this.model.betaR + cbcn;
    this.ic = this.pnp * cc;
    this.ib = this.pnp * cb;
    this.ie = this.pnp * (-cc - cb);
    const gpi = gbe / this.beta + gben;
    const gmu = gbc / this.model.betaR + gbcn;
    const go = (gbc + (cex - cbc) * dqbdvc / qb) / qb;
    const gm = (gex - (cex - cbc) * dqbdve / qb) / qb - go;
    const ceqbe = this.pnp * (cc + cb - vbe * (gm + go + gpi) + vbc * go);
    const ceqbc = this.pnp * (-cc + vbe * (gm + go) - vbc * (gmu + go));
    if (!isFinite(this.ib) || isNaN(this.ic))
      CircuitElm.sim.stop("infinite transistor current", this);
    CircuitElm.sim.stampMatrix(this.nodes[1], this.nodes[1], gmu + go);
    CircuitElm.sim.stampMatrix(this.nodes[1], this.nodes[0], -gmu + gm);
    CircuitElm.sim.stampMatrix(this.nodes[1], this.nodes[2], -gm - go);
    CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[0], gpi + gmu);
    CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[2], -gpi);
    CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[1], -gmu);
    CircuitElm.sim.stampMatrix(this.nodes[2], this.nodes[0], -gpi - gm);
    CircuitElm.sim.stampMatrix(this.nodes[2], this.nodes[1], -go);
    CircuitElm.sim.stampMatrix(this.nodes[2], this.nodes[2], gpi + gm + go);
    CircuitElm.sim.stampRightSide(this.nodes[0], -ceqbe - ceqbc);
    CircuitElm.sim.stampRightSide(this.nodes[1], ceqbc);
    CircuitElm.sim.stampRightSide(this.nodes[2], ceqbe);
    if (this.geqBE > 0) {
      CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[0], this.geqBE);
      CircuitElm.sim.stampMatrix(this.nodes[2], this.nodes[2], this.geqBE);
      CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[2], -this.geqBE);
      CircuitElm.sim.stampMatrix(this.nodes[2], this.nodes[0], -this.geqBE);
      CircuitElm.sim.stampRightSide(this.nodes[0], -this.ceqBE);
      CircuitElm.sim.stampRightSide(this.nodes[2], this.ceqBE);
    }
    if (this.geqBC > 0) {
      CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[0], this.geqBC);
      CircuitElm.sim.stampMatrix(this.nodes[1], this.nodes[1], this.geqBC);
      CircuitElm.sim.stampMatrix(this.nodes[0], this.nodes[1], -this.geqBC);
      CircuitElm.sim.stampMatrix(this.nodes[1], this.nodes[0], -this.geqBC);
      CircuitElm.sim.stampRightSide(this.nodes[0], -this.ceqBC);
      CircuitElm.sim.stampRightSide(this.nodes[1], this.ceqBC);
    }
  }
  isTransistorElm() {
    return true;
  }
  getScopeText(x) {
    let t = "";
    switch (x) {
      case Scope.VAL_IB:
        t = "Ib";
        break;
      case Scope.VAL_IC:
        t = "Ic";
        break;
      case Scope.VAL_IE:
        t = "Ie";
        break;
      case Scope.VAL_VBE:
        t = "Vbe";
        break;
      case Scope.VAL_VBC:
        t = "Vbc";
        break;
      case Scope.VAL_VCE:
        t = "Vce";
        break;
      case Scope.VAL_POWER:
        t = "P";
        break;
    }
    return Locale.LS("transistor") + ", " + t;
  }
  getElmType() {
    return "transistor";
  }
  getInfo(arr) {
    arr[0] = Locale.LS("transistor") + (this.pnp === -1 ? " (PNP)" : " (NPN)");
    arr[1] = this.model.name + ", β=" + CircuitElm.showFormat.format(this.beta);
    const vbc = this.nodes[0].v - this.nodes[1].v;
    const vbe = this.nodes[0].v - this.nodes[2].v;
    const vce = this.nodes[1].v - this.nodes[2].v;
    if (vbc * this.pnp > 0.2)
      arr[2] = vbe * this.pnp > 0.2 ? "saturation" : "reverse active";
    else
      arr[2] = vbe * this.pnp > 0.2 ? "fwd active" : "cutoff";
    arr[2] = Locale.LS(arr[2]);
    arr[3] = "Ic = " + CircuitElm.getCurrentText(this.ic);
    arr[4] = "Ib = " + CircuitElm.getCurrentText(this.ib);
    arr[5] = "Vbe = " + CircuitElm.getVoltageText(vbe);
    arr[6] = "Vbc = " + CircuitElm.getVoltageText(vbc);
    arr[7] = "Vce = " + CircuitElm.getVoltageText(vce);
    arr[8] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  getScopeValue(x) {
    switch (x) {
      case Scope.VAL_IB:
        return this.ib;
      case Scope.VAL_IC:
        return this.ic;
      case Scope.VAL_IE:
        return this.ie;
      case Scope.VAL_VBE:
        return this.nodes[0].v - this.nodes[2].v;
      case Scope.VAL_VBC:
        return this.nodes[0].v - this.nodes[1].v;
      case Scope.VAL_VCE:
        return this.nodes[1].v - this.nodes[2].v;
      case Scope.VAL_POWER:
        return this.getPower();
    }
    return 0;
  }
  getScopeUnits(x) {
    switch (x) {
      case Scope.VAL_IB:
      case Scope.VAL_IC:
      case Scope.VAL_IE:
        return Scope.UNITS_A;
      case Scope.VAL_POWER:
        return Scope.UNITS_W;
      default:
        return Scope.UNITS_V;
    }
  }
  models;
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Beta/hFE", this.beta, 10, 1e3).setDimensionless();
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      const state = (this.flags & TransistorElm.FLAG_FLIP) !== 0;
      ei.checkbox = new Checkbox("Swap E/C", state);
      return ei;
    }
    if (n === 2)
      return EditInfo.createCheckbox("Draw Circle", this.hasCircle());
    if (n === 3) {
      const ei = new EditInfo("Model", 0, -1, -1);
      this.models = TransistorModel.getModelList();
      ei.choice = new Choice();
      for (let i = 0; i !== this.models.length; i++) {
        const dm = this.models[i];
        ei.choice.add(dm.getDescription());
        if (dm === this.model)
          ei.choice.select(i);
      }
      return ei;
    }
    if (n === 4) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Create New Model") };
      return ei;
    }
    if (n === 5) {
      if (this.model.readOnly)
        return null;
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Edit Model") };
      return ei;
    }
    return null;
  }
  newModelCreated(tm) {
    this.model = tm;
    this.modelName = this.model.name;
    this.setup();
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.beta = ei.value;
      this.setup();
    }
    if (n === 1) {
      if (ei.checkbox.getState())
        this.flags |= TransistorElm.FLAG_FLIP;
      else
        this.flags &= ~TransistorElm.FLAG_FLIP;
      this.setPoints();
    }
    if (n === 2) {
      TransistorElm.globalFlags = ei.changeFlag(TransistorElm.globalFlags, TransistorElm.FLAG_CIRCLE);
      return;
    }
    if (n === 3) {
      this.model = this.models[ei.choice.getSelectedIndex()];
      this.modelName = this.model.name;
      this.setup();
      ei.newDialog = true;
      return;
    }
    if (n === 4) {
      const newModel = new TransistorModel(this.model);
      const editDialog = new EditTransistorModelDialog(newModel, CirSim.theApp, this);
      CirSim.diodeModelEditDialog = editDialog;
      editDialog.show();
      return;
    }
    if (n === 5) {
      if (this.model.readOnly) {
        window.alert(Locale.LS("This model cannot be modified.  Change the model name to allow customization."));
        return;
      }
      const editDialog = new EditTransistorModelDialog(this.model, CirSim.theApp, null);
      CirSim.diodeModelEditDialog = editDialog;
      editDialog.show();
      return;
    }
  }
  setBeta(b) {
    this.beta = b;
    this.setup();
  }
  stepFinished() {
    if (Math.abs(this.ic) > 1e12 || Math.abs(this.ib) > 1e12)
      CircuitElm.sim.stop("max current exceeded", this);
    if (this.localSubIters > 100)
      this.badIters++;
    else
      this.badIters = 0;
    if (this.geqBE > 0) {
      this.capVoltBE = this.nodes[0].v - this.nodes[2].v;
      this.capCurBE = this.geqBE * this.capVoltBE + this.ceqBE;
    }
    if (this.geqBC > 0) {
      this.capVoltBC = this.nodes[0].v - this.nodes[1].v;
      this.capCurBC = this.geqBC * this.capVoltBC + this.ceqBC;
    }
    if (this.geqBE > 0) {
      const icapBE = this.geqBE * (this.nodes[0].v - this.nodes[2].v) + this.ceqBE;
      this.ib += icapBE;
      this.ie -= icapBE;
    }
    if (this.geqBC > 0) {
      const icapBC = this.geqBC * (this.nodes[0].v - this.nodes[1].v) + this.ceqBC;
      this.ib += icapBC;
      this.ic -= icapBC;
    }
    this.localSubIters = 0;
  }
  flipX(c2, count) {
    if (this.x === this.x2)
      this.flags ^= TransistorElm.FLAG_FLIP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    if (this.y === this.y2)
      this.flags ^= TransistorElm.FLAG_FLIP;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    this.flags ^= TransistorElm.FLAG_FLIP;
    super.flipXY(xmy, count);
  }
  setFlipped(flip) {
    if ((this.flags & TransistorElm.FLAG_FLIP) !== 0 !== flip)
      this.flags ^= TransistorElm.FLAG_FLIP;
  }
  canViewInScope() {
    return true;
  }
  getCurrentIntoNode(n) {
    if (n === 0) return -this.ib;
    if (n === 1) return -this.ic;
    return -this.ie;
  }
}
class NTransistorElm extends TransistorElm {
  constructor(xx, yy) {
    super(xx, yy, false);
  }
  getDumpClass() {
    return TransistorElm;
  }
  getShortcut() {
    return "n".charCodeAt(0);
  }
}
class PTransistorElm extends TransistorElm {
  constructor(xx, yy) {
    super(xx, yy, true);
  }
  getDumpClass() {
    return TransistorElm;
  }
  getShortcut() {
    return "p".charCodeAt(0);
  }
}

class RailElm extends VoltageElm {
  constructor(xa, ya, xbOrWf, yb, f, st) {
    if (yb === void 0) {
      super(xa, ya, xbOrWf ?? VoltageElm.WF_DC);
    } else {
      super(xa, ya, xbOrWf, yb, f, st);
    }
  }
  isRailElm() {
    return true;
  }
  // unlike other VoltageElm subclasses, RailElm can be placed either horizontally or
  // vertically via toolbar drag-and-drop, so this undoes VoltageElm's forced-vertical override
  getDragVertical(requestedVertical) {
    return requestedVertical;
  }
  FLAG_CLOCK = 1;
  getDumpType() {
    return "R".charCodeAt(0);
  }
  getPostCount() {
    return 1;
  }
  setPoints() {
    super.setPoints();
    this.lead1 = this.interpPoint(this.point1, this.point2, 1 - this.circleSize / this.dn);
  }
  getRailText() {
    return null;
  }
  draw(g) {
    const rt = this.getRailText();
    let w = rt == null ? this.circleSize : g.context.measureText(rt).width / 2;
    if (w > this.dn * 0.8)
      w = this.dn * 0.8;
    this.lead1 = this.interpPoint(this.point1, this.point2, 1 - w / this.dn);
    this.setBbox(this.point1, this.point2, this.circleSize);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.drawRail(g);
    this.drawPosts(g);
    this.curcount = this.updateDotCountImpl(-this.current, this.curcount);
    if (!this.isCreating())
      this.drawDots(g, this.point1, this.lead1, this.curcount);
  }
  drawRail(g) {
    if (this.waveform == VoltageElm.WF_SQUARE && (this.flags & this.FLAG_CLOCK) != 0)
      this.drawRailText(g, "CLK");
    else if (this.waveform == VoltageElm.WF_DC || this.waveform == VoltageElm.WF_VAR) {
      g.setColor(this.needsHighlight() ? RailElm.selectColor : RailElm.whiteColor);
      this.setPowerColor(g, false);
      const v = this.getVoltage();
      let s;
      if (Math.abs(v) < 1)
        s = CircuitElm.showFormat.format(v) + " V";
      else
        s = CircuitElm.getShortUnitText(v, "V");
      if (this.getVoltage() > 0)
        s = "+" + s;
      this.drawLabeledNode(g, s, this.point1, this.lead1);
    } else {
      this.drawWaveform(g, this.point2);
    }
  }
  drawRailText(g, s) {
    g.setColor(this.needsHighlight() ? RailElm.selectColor : RailElm.whiteColor);
    this.setPowerColor(g, false);
    this.drawLabeledNode(g, s, this.point1, this.lead1);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  setVoltageSource(n, v) {
    super.setVoltageSource(n, v);
    if (this.internalResistance > 0)
      v.setNodes(CircuitNode.ground, this.nodes[1]);
    else
      v.setNodes(CircuitNode.ground, this.nodes[0]);
  }
  stamp() {
    const vsNode = this.internalResistance > 0 ? this.nodes[1] : this.nodes[0];
    if (this.waveform == VoltageElm.WF_DC)
      CircuitElm.sim.stampVoltageSource(CircuitNode.ground, vsNode, this.voltSource, this.getVoltage());
    else
      CircuitElm.sim.stampVoltageSource(CircuitNode.ground, vsNode, this.voltSource);
    if (this.internalResistance > 0)
      CircuitElm.sim.stampResistor(this.nodes[1], this.nodes[0], this.internalResistance);
  }
  doStep() {
    const vsNode = this.internalResistance > 0 ? this.nodes[1] : this.nodes[0];
    if (this.waveform != VoltageElm.WF_DC)
      CircuitElm.sim.updateVoltageSource(CircuitNode.ground, vsNode, this.voltSource, this.getVoltage());
  }
  hasGroundConnection(n1) {
    return true;
  }
  addRoutingObstacle(router) {
    router.addWire(this.point1.x, this.point1.y, this.point2.x, this.point2.y);
    router.addObstacle(
      this.point2.x - this.circleSize,
      this.point2.y - this.circleSize,
      this.point2.x + this.circleSize,
      this.point2.y + this.circleSize
    );
  }
  getShortcut() {
    return "V".charCodeAt(0);
  }
  validateRailNode(n) {
    const fpi = new FindPathInfo(FindPathInfo.VOLTAGE, this, this.getNode(n), CircuitElm.sim);
    if (fpi.findPath(CircuitNode.ground)) {
      this.internalResistance = 1e-3;
      return false;
    }
    return true;
  }
  validate() {
    return this.internalResistance > 0 || this.validateRailNode(0);
  }
  //    void drawHandles(Graphics g, Color c) {
  //    	g.setColor(c);
  //		g.fillRect(x-3, y-3, 7, 7);
  //    }
}

class ACRailElm extends RailElm {
  constructor(xx, yy) {
    super(xx, yy, VoltageElm.WF_AC);
    this.maxVoltage = 120 * Math.sqrt(2);
  }
  getDumpClass() {
    return RailElm;
  }
  getShortcut() {
    return 0;
  }
}

class ACVoltageElm extends VoltageElm {
  constructor(xx, yy) {
    super(xx, yy, VoltageElm.WF_AC);
    this.maxVoltage = 120 * Math.sqrt(2);
  }
  getDumpClass() {
    return VoltageElm;
  }
}

class ADCElm extends ChipElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
    } else {
      super(xa, ya, xb, yb, f, st);
    }
  }
  getChipName() {
    return "ADC";
  }
  needsBits() {
    return true;
  }
  allowBus() {
    return true;
  }
  setupPins() {
    if (!this.bits)
      return;
    this.sizeX = 2;
    const bitsY = this.useBus() ? 1 : this.bits > 2 ? this.bits : 2;
    this.sizeY = bitsY > 2 ? bitsY : 2;
    this.pins = new Array(this.getPostCount());
    this.makeBitPins(this.bits, 0, ChipElm.SIDE_E, 0, "D", true, false, false);
    this.pins[this.bits] = new Pin(this, 0, ChipElm.SIDE_W, "In");
    this.pins[this.bits + 1] = new Pin(this, this.sizeY - 1, ChipElm.SIDE_W, "V+");
    this.allocNodes();
  }
  execute() {
    const imax = (1 << this.bits) - 1;
    const val = imax * this.nodes[this.bits].v / this.nodes[this.bits + 1].v;
    let ival = Math.trunc(val);
    ival = Math.min(imax, Math.max(0, ival));
    for (let i = 0; i !== this.bits; i++)
      this.pins[i].value = (ival & 1 << i) !== 0;
  }
  getVoltageSourceCount() {
    return this.bits;
  }
  getPostCount() {
    return this.bits + 2;
  }
  getDumpType() {
    return 167;
  }
  // there's already a V+ pin, how does that relate to high logic voltage?  figure out later
  isDigitalChip() {
    return false;
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 2) {
        this.bits = Math.trunc(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be >= 2");
    }
  }
}

class AMElm extends CircuitElm {
  static FLAG_COS = 2;
  carrierfreq;
  signalfreq;
  maxVoltage;
  freqTimeZero = 0;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.carrierfreq = parseFloatStrict(st.nextToken());
      this.signalfreq = parseFloatStrict(st.nextToken());
      this.maxVoltage = parseFloatStrict(st.nextToken());
      if ((this.flags & AMElm.FLAG_COS) !== 0)
        this.flags &= ~AMElm.FLAG_COS;
    } else {
      this.maxVoltage = 5;
      this.carrierfreq = 1e3;
      this.signalfreq = 40;
    }
    this.reset();
  }
  getDumpType() {
    return 200;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "cf", this.carrierfreq);
    CircuitXMLSerializer.dumpAttr(elem, "sf", this.signalfreq);
    CircuitXMLSerializer.dumpAttr(elem, "mv", this.maxVoltage);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.carrierfreq = xml.parseDoubleAttr("cf", this.carrierfreq);
    this.signalfreq = xml.parseDoubleAttr("sf", this.signalfreq);
    this.maxVoltage = xml.parseDoubleAttr("mv", this.maxVoltage);
    this.reset();
  }
  reset() {
    this.freqTimeZero = 0;
    this.curcount = 0;
  }
  getPostCount() {
    return 1;
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[0], this.voltSource);
  }
  doStep() {
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[0], this.voltSource, this.getVoltage());
  }
  getVoltage() {
    const w = 2 * CircuitElm.pi * (CircuitElm.sim.t - this.freqTimeZero);
    return (Math.sin(w * this.signalfreq) + 1) / 2 * Math.sin(w * this.carrierfreq) * this.maxVoltage;
  }
  circleSize = 17;
  draw(g) {
    this.setBbox(this.point1, this.point2, this.circleSize);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    g.setFont(new Font("SansSerif", 0, 12));
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
    this.setPowerColor(g, false);
    this.drawCenteredText(g, "AM", this.x2, this.y2, true);
    this.drawWaveform(g, this.point2);
    this.drawPosts(g);
    this.curcount = this.updateDotCountImpl(-this.current, this.curcount);
    if (!this.isCreating())
      this.drawDots(g, this.point1, this.lead1, this.curcount);
  }
  drawWaveform(g, center) {
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.gray);
    this.setPowerColor(g, false);
    CircuitElm.drawThickCircle(g, center.x, center.y, this.circleSize);
    this.adjustBbox(
      center.x - this.circleSize,
      center.y - this.circleSize,
      center.x + this.circleSize,
      center.y + this.circleSize
    );
  }
  setPoints() {
    super.setPoints();
    this.lead1 = this.interpPoint(this.point1, this.point2, 1 - this.circleSize / this.dn);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  validate() {
    return this.validateRailNode(0);
  }
  hasGroundConnection(n1) {
    return true;
  }
  getVoltageSourceCount() {
    return 1;
  }
  getPower() {
    return -this.getVoltageDiff() * this.current;
  }
  getInfo(arr) {
    arr[0] = "AM Source";
    arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
    arr[2] = "V = " + CircuitElm.getVoltageText(this.getVoltageDiff());
    arr[3] = "cf = " + CircuitElm.getUnitText(this.carrierfreq, "Hz");
    arr[4] = "sf = " + CircuitElm.getUnitText(this.signalfreq, "Hz");
    arr[5] = "Vmax = " + CircuitElm.getVoltageText(this.maxVoltage);
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("Max Voltage", this.maxVoltage, -20, 20).setUnitStep();
    if (n === 1) return new EditInfo("Carrier Frequency (Hz)", this.carrierfreq, 4, 500);
    if (n === 2) return new EditInfo("Signal Frequency (Hz)", this.signalfreq, 4, 500);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.maxVoltage = ei.value;
    if (n === 1) this.carrierfreq = ei.value;
    if (n === 2) this.signalfreq = ei.value;
  }
}

class AmmeterElm extends CircuitElm {
  meter = 0;
  scale;
  static AM_VOL = 0;
  static AM_RMS = 1;
  static FLAG_SHOWCURRENT = 1;
  static FLAG_CIRCLE = 2;
  // optional name, drawn next to the reading and usable as i(label) in an expression
  label = "";
  zerocount = 0;
  rmsI = 0;
  total = 0;
  count = 0;
  maxI = 0;
  lastMaxI = 0;
  minI = 0;
  lastMinI = 0;
  selectedValue = 0;
  increasingI = true;
  decreasingI = true;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.flags = AmmeterElm.FLAG_SHOWCURRENT | AmmeterElm.FLAG_CIRCLE;
      this.scale = CircuitElm.SCALE_AUTO;
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.scale = CircuitElm.SCALE_AUTO;
      this.meter = parseIntStrict(st.nextToken());
      try {
        this.scale = parseIntStrict(st.nextToken());
      } catch (e) {
      }
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "me", this.meter);
    CircuitXMLSerializer.dumpAttr(elem, "sc", this.scale);
    if (this.label.length > 0)
      CircuitXMLSerializer.dumpAttr(elem, "lb", this.label);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.meter = xml.parseIntAttr("me", this.meter);
    this.scale = xml.parseIntAttr("sc", this.scale);
    this.label = xml.parseStringAttr("lb", "") ?? "";
  }
  getMeter() {
    switch (this.meter) {
      case AmmeterElm.AM_VOL:
        return "I";
      case AmmeterElm.AM_RMS:
        return "Irms";
    }
    return "";
  }
  center;
  mid;
  arrowPoly;
  setPoints() {
    super.setPoints();
    this.mid = this.interpPoint(this.point1, this.point2, 0.6);
    this.center = this.interpPoint(this.point1, this.point2, 0.5);
    this.arrowPoly = this.calcArrow(this.point1, this.mid, 14, 7);
  }
  stepFinished() {
    this.count++;
    this.total += this.current * this.current;
    if (this.current > this.maxI && this.increasingI) {
      this.maxI = this.current;
      this.increasingI = true;
      this.decreasingI = false;
    }
    if (this.current < this.maxI && this.increasingI) {
      this.lastMaxI = this.maxI;
      this.minI = this.current;
      this.increasingI = false;
      this.decreasingI = true;
      this.total = this.total / this.count;
      this.rmsI = Math.sqrt(this.total);
      if (isNaN(this.rmsI)) this.rmsI = 0;
      this.count = 0;
      this.total = 0;
    }
    if (this.current < this.minI && this.decreasingI) {
      this.minI = this.current;
      this.increasingI = false;
      this.decreasingI = true;
    }
    if (this.current > this.minI && this.decreasingI) {
      this.lastMinI = this.minI;
      this.maxI = this.current;
      this.increasingI = true;
      this.decreasingI = false;
      this.total = this.total / this.count;
      this.rmsI = Math.sqrt(this.total);
      if (isNaN(this.rmsI)) this.rmsI = 0;
      this.count = 0;
      this.total = 0;
    }
    if (this.current === 0) {
      this.zerocount++;
      if (this.zerocount > 5) {
        this.total = 0;
        this.rmsI = 0;
        this.maxI = 0;
        this.minI = 0;
      }
    } else {
      this.zerocount = 0;
    }
    switch (this.meter) {
      case AmmeterElm.AM_VOL:
        this.selectedValue = this.current;
        break;
      case AmmeterElm.AM_RMS:
        this.selectedValue = this.rmsI;
        break;
    }
  }
  circleSize = 12;
  draw(g) {
    super.draw(g);
    this.setVoltageColor(g, this.nodes[0].v);
    let width = 4;
    if (!this.drawAsCircle()) {
      CircuitElm.drawThickLine(g, this.point1, this.point2);
      g.fillPolygon(this.arrowPoly);
    } else {
      this.calcLeads(this.circleSize * 2);
      this.setVoltageColor(g, this.nodes[0].v);
      CircuitElm.drawThickLine(g, this.point1, this.lead1);
      CircuitElm.drawThickLine(g, this.lead2, this.point2);
      g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
      CircuitElm.drawThickCircle(g, this.center.x, this.center.y, this.circleSize);
      this.drawCenteredText(g, "A", this.center.x, this.center.y, true);
      g.setColor(CircuitElm.whiteColor);
      g.setFont(CircuitElm.unitsFont);
      const len = this.circleSize * 2;
      const plusPoint = this.interpPoint(this.point1, this.point2, (this.dn / 2 - len / 2 - 4) / this.dn, -10 * this.dsign);
      if (this.y2 > this.y) plusPoint.y += 4;
      if (this.y > this.y2) plusPoint.y += 3;
      const w = Math.floor(g.context.measureText("+").width);
      g.drawString("+", plusPoint.x - w / 2, plusPoint.y);
      width = this.circleSize;
    }
    this.doDots(g);
    this.setBbox(this.point1, this.point2, width);
    let s = "A";
    switch (this.meter) {
      case AmmeterElm.AM_VOL:
        s = CircuitElm.getUnitTextWithScale(this.getCurrent(), "A", this.scale);
        break;
      case AmmeterElm.AM_RMS:
        s = CircuitElm.getUnitTextWithScale(this.rmsI, "A(rms)", this.scale);
        break;
    }
    if (this.label.length > 0)
      s = this.label + " " + s;
    this.drawValues(g, s, width);
    this.drawPosts(g);
  }
  getDumpType() {
    return 370;
  }
  setVoltageSource(n, v) {
    super.setVoltageSource(n, v);
    v.setNodes(this.nodes[0], this.nodes[1]);
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[1], this.voltSource, 0);
  }
  mustShowCurrent() {
    return (this.flags & AmmeterElm.FLAG_SHOWCURRENT) !== 0;
  }
  getVoltageSourceCount() {
    return 1;
  }
  getInfo(arr) {
    arr[0] = "Ammeter";
    switch (this.meter) {
      case AmmeterElm.AM_VOL:
        arr[1] = "I = " + CircuitElm.getUnitText(this.current, "A");
        break;
      case AmmeterElm.AM_RMS:
        arr[1] = "Irms = " + CircuitElm.getUnitText(this.rmsI, "A");
        break;
    }
  }
  getPower() {
    return 0;
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  // do not optimize out, even though isWireEquivalent() is true
  // (because we need current calculated every timestep)
  isWireEquivalent() {
    return true;
  }
  drawAsCircle() {
    return (this.flags & AmmeterElm.FLAG_CIRCLE) !== 0;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Value", this.selectedValue, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("Current");
      ei.choice.add("RMS Current");
      ei.choice.select(this.meter);
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("Scale", 0);
      ei.choice = new Choice();
      ei.choice.add("Auto");
      ei.choice.add("A");
      ei.choice.add("mA");
      ei.choice.add(Locale.muString + "A");
      ei.choice.select(this.scale);
      return ei;
    }
    if (n === 2) {
      return EditInfo.createCheckbox("Circular Symbol", this.drawAsCircle());
    }
    if (n === 3) {
      const ei = new EditInfo("Label", 0, -1, -1);
      ei.text = this.label;
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.meter = ei.choice.getSelectedIndex();
    if (n === 1) this.scale = ei.choice.getSelectedIndex();
    if (n === 2) this.flags = ei.changeFlag(this.flags, AmmeterElm.FLAG_CIRCLE);
    if (n === 3) this.label = ei.textf ? ei.textf.value : ei.text ?? "";
  }
  getExprRefName() {
    return this.label.length > 0 ? this.label : null;
  }
}

class AnalogMuxElm extends ChipElm {
  static FLAG_PULLDOWN = 2;
  selectBitCount = 2;
  inputCount = 0;
  outputPin = 0;
  r_on = 20;
  r_off = 1e10;
  threshold = 2.5;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f, st);
    if (st !== void 0) {
      try {
        this.selectBitCount = parseIntStrict(st.nextToken());
        this.r_on = parseFloatStrict(st.nextToken());
        this.r_off = parseFloatStrict(st.nextToken());
        this.threshold = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
    } else {
      this.flags |= AnalogMuxElm.FLAG_PULLDOWN;
    }
    this.setupPins();
  }
  hasReset() {
    return false;
  }
  getChipName() {
    return "Analog Mux";
  }
  nonLinear() {
    return true;
  }
  getDumpType() {
    return 432;
  }
  dump() {
    return super.dump() + " " + this.selectBitCount + " " + this.r_on + " " + this.r_off + " " + this.threshold;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "sb", this.selectBitCount);
    CircuitXMLSerializer.dumpAttr(elem, "ron", this.r_on);
    CircuitXMLSerializer.dumpAttr(elem, "rof", this.r_off);
    CircuitXMLSerializer.dumpAttr(elem, "thr", this.threshold);
  }
  undumpXml(xml) {
    this.selectBitCount = xml.parseIntAttr("sb", this.selectBitCount);
    super.undumpXml(xml);
    this.r_on = xml.parseDoubleAttr("ron", this.r_on);
    this.r_off = xml.parseDoubleAttr("rof", this.r_off);
    this.threshold = xml.parseDoubleAttr("thr", this.threshold);
  }
  setupPins() {
    if (!this.selectBitCount) return;
    this.inputCount = 1 << this.selectBitCount;
    this.sizeX = this.selectBitCount + 1;
    this.sizeY = this.inputCount + 1;
    this.pins = new Array(this.getPostCount());
    for (let i = 0; i !== this.inputCount; i++)
      this.pins[i] = new Pin(this, i, ChipElm.SIDE_W, "I" + i);
    for (let i = 0; i !== this.selectBitCount; i++)
      this.pins[this.inputCount + i] = new Pin(this, i + 1, ChipElm.SIDE_S, "S" + i);
    this.outputPin = this.inputCount + this.selectBitCount;
    this.pins[this.outputPin] = new Pin(this, 0, ChipElm.SIDE_E, "Z");
    this.allocNodes();
  }
  getPostCount() {
    if (!this.selectBitCount) return 0;
    return this.inputCount + this.selectBitCount + 1;
  }
  getVoltageSourceCount() {
    return 0;
  }
  needsPulldown() {
    return this.hasFlag(AnalogMuxElm.FLAG_PULLDOWN);
  }
  stamp() {
    for (let i = 0; i !== this.inputCount; i++)
      CircuitElm.sim.stampNonLinear(this.nodes[i]);
    CircuitElm.sim.stampNonLinear(this.nodes[this.outputPin]);
  }
  // stamp r_on between output and selected input.  For the others, if
  // the pulldown flag is set, pull them to ground with r_off instead of
  // connecting them to the output with r_off (better conditioned, and
  // avoids leaving unselected inputs floating).
  doStep() {
    let selectedInput = 0;
    for (let i = 0; i !== this.selectBitCount; i++)
      if (this.nodes[this.inputCount + i].v > this.threshold)
        selectedInput |= 1 << i;
    for (let i = 0; i !== this.inputCount; i++) {
      if (i === selectedInput)
        CircuitElm.sim.stampResistor(this.nodes[i], this.nodes[this.outputPin], this.r_on);
      else if (this.needsPulldown())
        CircuitElm.sim.stampResistor(this.nodes[i], CircuitNode.ground, this.r_off);
      else
        CircuitElm.sim.stampResistor(this.nodes[i], this.nodes[this.outputPin], this.r_off);
    }
  }
  calculateCurrent() {
    let selectedInput = 0;
    for (let i = 0; i !== this.selectBitCount; i++)
      if (this.nodes[this.inputCount + i].v > this.threshold)
        selectedInput |= 1 << i;
    let outputCurrent = 0;
    for (let i = 0; i !== this.inputCount; i++) {
      if (i === selectedInput) {
        const c = (this.nodes[i].v - this.nodes[this.outputPin].v) / this.r_on;
        this.pins[i].current = -c;
        outputCurrent += c;
      } else if (this.needsPulldown()) {
        this.pins[i].current = -this.nodes[i].v / this.r_off;
      } else {
        const c = (this.nodes[i].v - this.nodes[this.outputPin].v) / this.r_off;
        this.pins[i].current = -c;
        outputCurrent += c;
      }
    }
    this.pins[this.outputPin].current = outputCurrent;
    for (let i = 0; i !== this.selectBitCount; i++)
      this.pins[this.inputCount + i].current = 0;
  }
  getConnection(n1, n2) {
    if (n1 >= this.inputCount && n1 < this.outputPin) return false;
    if (n2 >= this.inputCount && n2 < this.outputPin) return false;
    return true;
  }
  hasGroundConnection(n1) {
    return this.needsPulldown() && n1 < this.inputCount;
  }
  getInfo(arr) {
    arr[0] = "analog multiplexer";
    let selectedInput = 0;
    for (let i = 0; i !== this.selectBitCount; i++)
      if (this.nodes[this.inputCount + i].v > this.threshold)
        selectedInput |= 1 << i;
    arr[1] = "selected: I" + selectedInput;
    arr[2] = "Vout = " + CircuitElm.getVoltageText(this.nodes[this.outputPin].v);
  }
  getChipEditInfo(n) {
    if (n === 0) return new EditInfo("# of Select Bits", this.selectBitCount, 1, 8).setDimensionless();
    if (n === 1) return new EditInfo("On Resistance (ohms)", this.r_on, 0, 0).setPositive();
    if (n === 2) return new EditInfo("Off Resistance (ohms)", this.r_off, 0, 0).setPositive();
    if (n === 3) return new EditInfo("Threshold Voltage", this.threshold, 0, 0);
    if (n === 4) return EditInfo.createCheckbox("Pulldown Resistor", this.needsPulldown());
    return super.getChipEditInfo(n);
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 1 && ei.value <= 6) {
        this.selectBitCount = Math.trunc(ei.value);
        this.setupPins();
        this.setPoints();
      } else ei.setError("must be between 1 and 6");
      return;
    }
    if (n === 1 && ei.value > 0) this.r_on = ei.value;
    if (n === 2 && ei.value > 0) this.r_off = ei.value;
    if (n === 3) this.threshold = ei.value;
    if (n === 4) this.flags = ei.changeFlag(this.flags, AnalogMuxElm.FLAG_PULLDOWN);
    super.setChipEditValue(n, ei);
  }
}

class AnalogSwitchElm extends CircuitElm {
  FLAG_INVERT = 1;
  FLAG_PULLDOWN = 2;
  FLAG_FLIPPED_X = 4;
  FLAG_FLIPPED_Y = 8;
  FLAG_FLIPPED = 16;
  resistance = 0;
  r_on = 20;
  r_off = 1e10;
  threshold = 2.5;
  open = false;
  openhs = 16;
  ps = new Point();
  ps1 = new Point();
  point3 = new Point();
  lead3 = new Point();
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.r_on = 20;
      this.r_off = 1e10;
      this.threshold = 2.5;
      this.noDiagonal = true;
      this.flags |= this.FLAG_PULLDOWN;
    } else {
      super(xa, ya, xb, yb, f);
      this.r_on = 20;
      this.r_off = 1e10;
      this.threshold = 2.5;
      this.noDiagonal = true;
      try {
        this.r_on = parseFloatStrict(st.nextToken());
        this.r_off = parseFloatStrict(st.nextToken());
        this.threshold = parseFloatStrict(st.nextToken());
      } catch (_e) {
      }
    }
  }
  dump() {
    return super.dump() + " " + this.r_on + " " + this.r_off + " " + this.threshold;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ron", this.r_on);
    CircuitXMLSerializer.dumpAttr(elem, "roff", this.r_off);
    CircuitXMLSerializer.dumpAttr(elem, "th", this.threshold);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.r_on = xml.parseDoubleAttr("ron", this.r_on);
    this.r_off = xml.parseDoubleAttr("roff", this.r_off);
    this.threshold = xml.parseDoubleAttr("th", this.threshold);
  }
  getDumpType() {
    return 159;
  }
  getXmlDumpType() {
    return "as";
  }
  isFlippedX() {
    return this.hasFlag(this.FLAG_FLIPPED_X);
  }
  isFlippedY() {
    return this.hasFlag(this.FLAG_FLIPPED_Y);
  }
  isFlipped() {
    return this.hasFlag(this.FLAG_FLIPPED);
  }
  flipX(c2, count) {
    this.flags ^= this.FLAG_FLIPPED_X;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    this.flags ^= this.FLAG_FLIPPED_Y;
    super.flipY(c2, count);
  }
  flipXY(c2, count) {
    this.flags ^= this.FLAG_FLIPPED;
    super.flipXY(c2, count);
  }
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    this.adjustLeadsToGrid(this.isFlippedX(), this.isFlippedY());
    this.ps = new Point();
    this.ps1 = new Point();
    this.openhs = this.isFlippedX() !== this.isFlippedY() !== this.isFlipped() ? -16 : 16;
    this.point3 = this.interpPoint(this.lead1, this.lead2, 0.5, -this.openhs);
    this.lead3 = this.interpPoint(this.lead1, this.lead2, 0.5, -this.openhs / 2);
  }
  draw(g) {
    const hs1 = this.open ? 0 : 2;
    const hs2 = this.open ? this.openhs : 2;
    this.setBbox(this.point1, this.point2, this.openhs);
    this.draw2Leads(g);
    g.setColor(CircuitElm.lightGrayColor);
    this.interpPoint(this.lead1, this.lead2, this.ps1, 0, hs1);
    this.interpPoint(this.lead1, this.lead2, this.ps, 1, hs2);
    CircuitElm.drawThickLine(g, this.ps1, this.ps);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.point3, this.lead3);
    if (!this.open)
      this.doDots(g);
    this.drawPosts(g);
  }
  calculateCurrent() {
    if (this.resistance === 0)
      return;
    if (this.needsPulldown() && this.open)
      this.current = 0;
    else
      this.current = (this.nodes[0].v - this.nodes[1].v) / this.resistance;
  }
  nonLinear() {
    return true;
  }
  needsPulldown() {
    return this.hasFlag(this.FLAG_PULLDOWN);
  }
  stamp() {
    const sim = SimulationManager.theSim;
    sim.stampNonLinear(this.nodes[0]);
    sim.stampNonLinear(this.nodes[1]);
    if (this.needsPulldown()) {
      sim.stampResistor(this.nodes[0], CircuitNode.ground, this.r_off);
      sim.stampResistor(this.nodes[1], CircuitNode.ground, this.r_off);
    }
  }
  doStep() {
    const sim = SimulationManager.theSim;
    this.open = this.nodes[2].v < this.threshold;
    if (this.hasFlag(this.FLAG_INVERT))
      this.open = !this.open;
    if (!(this.needsPulldown() && this.open)) {
      this.resistance = this.open ? this.r_off : this.r_on;
      sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
    }
  }
  getPostCount() {
    return 3;
  }
  getPost(n) {
    return n === 0 ? this.point1 : n === 1 ? this.point2 : this.point3;
  }
  getInfo(arr) {
    arr[0] = "analog switch";
    arr[1] = this.open ? "open" : "closed";
    arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
    arr[3] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
    arr[4] = "Vc = " + CircuitElm.getVoltageText(this.nodes[2].v);
  }
  getConnection(n1, n2) {
    if (n1 === 2 || n2 === 2) return false;
    return true;
  }
  hasGroundConnection(n1) {
    return this.needsPulldown() && n1 < 2;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Normally closed", this.hasFlag(this.FLAG_INVERT));
      return ei;
    }
    if (n === 1) return new EditInfo("On Resistance (ohms)", this.r_on, 0, 0).setPositive();
    if (n === 2) return new EditInfo("Off Resistance (ohms)", this.r_off, 0, 0).setPositive();
    if (n === 3) return EditInfo.createCheckbox("Pulldown Resistor", this.needsPulldown());
    if (n === 4) return new EditInfo("Threshold", this.threshold, 10, -10);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.flags = ei.checkbox.getState() ? this.flags | this.FLAG_INVERT : this.flags & ~this.FLAG_INVERT;
    if (n === 1 && ei.value > 0) this.r_on = ei.value;
    if (n === 2 && ei.value > 0) this.r_off = ei.value;
    if (n === 3) this.flags = ei.changeFlag(this.flags, this.FLAG_PULLDOWN);
    if (n === 4) this.threshold = ei.value;
  }
  getCurrentIntoNode(n) {
    if (n === 2) return 0;
    if (n === 0) return -this.current;
    return this.current;
  }
}

class AnalogSwitch2Elm extends AnalogSwitchElm {
  swposts = [];
  swpoles = [];
  ctlPoint = new Point(0, 0);
  labelPts = [];
  constructor(xa, ya, xb, yb, f, st) {
    if (xb !== void 0) {
      super(xa, ya, xb, yb, f, st);
    } else {
      super(xa, ya);
    }
  }
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    this.adjustLeadsToGrid(this.isFlippedX(), this.isFlippedY());
    this.swposts = this.newPointArray(2);
    this.swpoles = this.newPointArray(2);
    this.labelPts = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, this.swpoles[0], this.swpoles[1], 1, this.openhs);
    this.interpPoint2(this.point1, this.point2, this.swposts[0], this.swposts[1], 1, this.openhs);
    this.interpPoint2(
      this.point1,
      this.point2,
      this.labelPts[0],
      this.labelPts[1],
      1 - 10 / this.dn,
      this.openhs + (this.openhs > 0 ? 10 : -10)
    );
    this.ctlPoint = this.interpPoint(this.lead1, this.lead2, 0.5, this.openhs);
  }
  getPostCount() {
    return 4;
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.openhs);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.swpoles[0], this.swposts[0]);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.swpoles[1], this.swposts[1]);
    g.setColor(CircuitElm.lightGrayColor);
    const position = this.open ? 1 : 0;
    CircuitElm.drawThickLine(g, this.lead1, this.swpoles[position]);
    this.updateDotCount();
    this.drawDots(g, this.point1, this.lead1, this.curcount);
    this.drawDots(g, this.swpoles[position], this.swposts[position], this.curcount);
    this.drawPosts(g);
    if (this.needsHighlight()) {
      const inverted = this.hasFlag(this.FLAG_INVERT);
      g.setColor(CircuitElm.selectColor);
      this.drawCenteredText(g, inverted ? "NC" : "NO", this.labelPts[0].x, this.labelPts[0].y, true);
      this.drawCenteredText(g, inverted ? "NO" : "NC", this.labelPts[1].x, this.labelPts[1].y, true);
    }
  }
  getPost(n) {
    if (n === 0) return this.point1;
    if (n === 3) return this.ctlPoint;
    return this.swposts[n - 1];
  }
  getDumpType() {
    return 160;
  }
  getXmlDumpType() {
    return "as2";
  }
  calculateCurrent() {
    this.current = this.open ? (this.nodes[0].v - this.nodes[2].v) / this.r_on : (this.nodes[0].v - this.nodes[1].v) / this.r_on;
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[0]);
    CircuitElm.sim.stampNonLinear(this.nodes[1]);
    CircuitElm.sim.stampNonLinear(this.nodes[2]);
    if (this.needsPulldown()) {
      CircuitElm.sim.stampResistor(this.nodes[1], CircuitNode.ground, this.r_off);
      CircuitElm.sim.stampResistor(this.nodes[2], CircuitNode.ground, this.r_off);
    }
  }
  doStep() {
    this.open = this.nodes[3].v < this.threshold;
    if (this.hasFlag(this.FLAG_INVERT))
      this.open = !this.open;
    if (this.open) {
      CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[2], this.r_on);
      if (!this.needsPulldown())
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.r_off);
    } else {
      CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.r_on);
      if (!this.needsPulldown())
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[2], this.r_off);
    }
  }
  // we have to just assume current will flow either way (regardless of
  // switch position), since getConnection() is used to determine the
  // matrix closures, and that can't depend on "open," which changes
  // every step -- see comment in AnalogSwitchElm.getConnection()
  getConnection(n1, n2) {
    return n1 !== 3 && n2 !== 3;
  }
  hasGroundConnection(n) {
    return this.needsPulldown() && (n === 1 || n === 2);
  }
  getInfo(arr) {
    arr[0] = "analog switch (SPDT)";
    arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
  }
  // for SPDT the switch is never fully open, so "Normally closed" doesn't
  // apply; the flag instead swaps which throw terminal is NO vs NC
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Swap NO/NC", this.hasFlag(this.FLAG_INVERT));
      return ei;
    }
    return super.getEditInfo(n);
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.flags = ei.checkbox.getState() ? this.flags | this.FLAG_INVERT : this.flags & ~this.FLAG_INVERT;
      return;
    }
    super.setEditValue(n, ei);
  }
  getCurrentIntoNode(n) {
    if (n === 0) return -this.current;
    const position = this.open ? 1 : 0;
    if (n === position + 1) return this.current;
    return 0;
  }
}

class GateElm extends CircuitElm {
  static FLAG_SMALL = 1 << 0;
  static FLAG_SCHMITT = 1 << 1;
  static FLAG_INVERT_INPUTS = 1 << 2;
  static FLAG_DEMORGAN = 1 << 3;
  inputCount = 2;
  lastOutput = false;
  justLoaded = false;
  highVoltage;
  propagationDelay = 0;
  // seconds; 0 = instant (default)
  delayEndTime = 0;
  // time at which pending output change takes effect
  static lastHighVoltage = 5;
  static lastSchmitt = false;
  getDragLength() {
    return 96;
  }
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.noDiagonal = true;
      this.inputCount = 2;
      this.allocNodes();
      this.setupVolts();
      this.highVoltage = GateElm.lastHighVoltage;
      if (GateElm.lastSchmitt)
        this.flags |= GateElm.FLAG_SCHMITT;
      this.setSize(this.useSmallGrid() ? 1 : 2);
    } else {
      super(xa, ya, xb, yb, f);
      this.inputCount = parseIntStrict(st.nextToken());
      const lastOutputVoltage = parseFloatStrict(st.nextToken());
      this.noDiagonal = true;
      this.highVoltage = 5;
      try {
        this.highVoltage = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
      this.lastOutput = lastOutputVoltage > this.highVoltage * 0.5;
      this.setSize((f & GateElm.FLAG_SMALL) !== 0 ? 1 : 2);
      this.allocNodes();
      this.setupVolts();
    }
  }
  isInverting() {
    return false;
  }
  isXorGateElm() {
    return false;
  }
  gsize = 0;
  gwidth = 0;
  gwidth2 = 0;
  gheight = 0;
  hs2 = 0;
  setSize(s) {
    this.gsize = s;
    this.gwidth = 7 * s;
    this.gwidth2 = 14 * s;
    this.gheight = 8 * s;
    this.flags &= -2;
    this.flags |= s === 1 ? GateElm.FLAG_SMALL : 0;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    if (this.highVoltage !== 5)
      CircuitXMLSerializer.dumpAttr(elem, "hi", this.highVoltage);
    if (this.inputCount !== 2)
      CircuitXMLSerializer.dumpAttr(elem, "in", this.inputCount);
    if (this.propagationDelay !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "pd", this.propagationDelay);
  }
  dumpXmlState(doc, elem) {
    if (this.nodes[this.inputCount].v !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "o", this.nodes[this.inputCount].v);
  }
  undumpXml(xml) {
    const stateRestore = xml.parseStringAttr("ix", null) != null;
    if (!stateRestore)
      this.flags = 0;
    super.undumpXml(xml);
    this.highVoltage = xml.parseDoubleAttr("hi", this.highVoltage);
    this.inputCount = xml.parseIntAttr("in", this.inputCount);
    this.propagationDelay = xml.parseDoubleAttr("pd", this.propagationDelay);
    const lastOutputVoltage = xml.parseDoubleAttr("o", 0);
    this.lastOutput = lastOutputVoltage > this.highVoltage * 0.5;
    this.setSize((this.flags & GateElm.FLAG_SMALL) !== 0 ? 1 : 2);
    this.allocNodes();
    this.setupVolts();
  }
  addRoutingObstacle(router) {
    for (let i = 0; i < this.inputCount; i++)
      router.addWire(this.inPosts[i].x, this.inPosts[i].y, this.inGates[i].x, this.inGates[i].y);
    router.addWire(this.lead2.x, this.lead2.y, this.point2.x, this.point2.y);
    const leadDist = CircuitElm.distance(this.lead1, this.lead2);
    const hs2 = this.gwidth * (this.inputCount / 2 + 1);
    const pa = this.interpPoint(this.lead1, this.lead2, -8 / leadDist, hs2);
    const pb = this.interpPoint(this.lead1, this.lead2, 1, -hs2);
    router.addObstacle(pa.x, pa.y, pb.x, pb.y);
  }
  getXmlDumpType() {
    return this.getClassName().replace("GateElm", "");
  }
  inPosts;
  inGates;
  inputStates;
  ww = 0;
  setPoints() {
    super.setPoints();
    this.inputStates = new Array(this.inputCount).fill(false);
    if (this.dn > 150 && this.isCreating())
      this.setSize(2);
    const hs = this.gheight;
    this.ww = this.gwidth2;
    if (this.ww > this.dn / 2)
      this.ww = Math.trunc(this.dn / 2);
    if (this.isInverting() && this.ww + 8 > this.dn / 2)
      this.ww = Math.trunc(this.dn / 2 - 8);
    this.calcLeads(this.ww * 2);
    this.inPosts = this.newPointArray(this.inputCount);
    this.inGates = this.newPointArray(this.inputCount);
    let i0 = -Math.trunc(this.inputCount / 2);
    if (this.hasFlag(GateElm.FLAG_INVERT_INPUTS) || this.hasFlag(GateElm.FLAG_DEMORGAN))
      this.icircles = this.newPointArray(this.inputCount);
    else
      this.icircles = null;
    this.hs2 = this.gwidth * (Math.trunc(this.inputCount / 2) + 1);
    const andShaped = this.drawAsAndGate();
    for (let i = 0; i !== this.inputCount; i++, i0++) {
      if (i0 === 0 && (this.inputCount & 1) === 0)
        i0++;
      const adj = this.getLeadAdjustment(i);
      this.interpPoint(this.point1, this.point2, this.inPosts[i], 0, hs * i0);
      const bx = andShaped ? 0 : GateElm.backCurveX(hs * i0, this.hs2, this.ww * 2);
      const inGateOff = this.icircles !== null ? bx - 8 : bx;
      this.interpPoint(
        this.lead1,
        this.lead2,
        this.inGates[i],
        inGateOff / (this.ww * 2) + adj,
        hs * i0
      );
      if (this.icircles !== null)
        this.interpPoint(this.lead1, this.lead2, this.icircles[i], (bx - 4) / (this.ww * 2), hs * i0);
    }
    this.setBbox(this.point1, this.point2, this.hs2);
    if (this.hasSchmittInputs())
      this.schmittPoly = this.getSchmittPolygon(this.gsize, 0.47);
    if (GateElm.useEuroGates()) {
      this.createEuroGatePolygon();
      this.linePoints = null;
    } else {
      const triPoints = this.newPointArray(11);
      if (this.drawAsAndGate()) {
        this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[6], 0, this.hs2);
        this.interpPoint2(this.lead1, this.lead2, triPoints[1], triPoints[5], 0.5, this.hs2);
        this.interpPoint2(this.lead1, this.lead2, triPoints[2], triPoints[4], 1, this.hs2);
        this.interpPoint(this.lead1, this.lead2, triPoints[3], 1);
      } else {
        this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[6], 0, this.hs2);
        this.interpPoint2(this.lead1, this.lead2, triPoints[1], triPoints[5], 0.134, this.hs2);
        triPoints[3] = this.lead2;
        this.interpPoint2(this.lead1, this.lead2, triPoints[2], triPoints[4], 0.664, this.hs2 * 0.8372);
        this.interpPoint(this.lead1, this.lead2, triPoints[7], GateElm.orBackCtrlFrac);
      }
      if (this.isXorGateElm()) {
        const ww2 = this.ww === 0 ? this.dn * 2 : this.ww * 2;
        this.interpPoint2(this.lead1, this.lead2, triPoints[8], triPoints[9], -0.05 - 8 / ww2, this.hs2);
        this.interpPoint(this.lead1, this.lead2, triPoints[10], 0.1 - 8 / ww2);
      }
      this.gatePoly = this.createPolygon(triPoints);
    }
    if (this.isInverting() !== this.hasFlag(GateElm.FLAG_DEMORGAN)) {
      this.pcircle = this.interpPoint(this.point1, this.point2, 0.5 + (this.ww + 4) / this.dn);
      this.lead2 = this.interpPoint(this.point1, this.point2, 0.5 + (this.ww + 8) / this.dn);
    }
  }
  setupVolts() {
    this.justLoaded = true;
  }
  getLeadAdjustment(ix) {
    return 0;
  }
  // Back-control fraction for the OR gate's concave back curve (the
  // triPoints[6]->[7]->[0] bezierCurveTo built in setPoints() / drawn in
  // drawGatePolygon()) -- named so backCurveX() below always matches
  // whatever the body curve actually draws.
  static orBackCtrlFrac = 0.195;
  // Real (signed) cube root. Math.pow of a negative base to a non-integer
  // exponent is NaN, so we do the sign handling ourselves.
  static cbrt(x) {
    return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3);
  }
  // True x-offset (from lead1, same units as ww/len) of the OR gate's
  // concave back curve at a given height "target" (same units as hs2).
  // That curve is a bezierCurveTo with a repeated control point --
  // P0=(0,-hs2), P1=P2=(orBackCtrlFrac*len,0), P3=(0,+hs2) -- which reduces
  // to x(t) = 3t(1-t)*orBackCtrlFrac*len, y(t) = hs2*(t^3-(1-t)^3).
  // Solving y(t)=target for t is a depressed cubic in s=2t-1
  // (s^3+3s-4k=0, k=target/hs2), solved here in closed form (Cardano) --
  // y(t) is monotonic in t over [0,1], so there's always exactly one real
  // solution.
  static backCurveX(target, hs2, len) {
    const k = target / hs2;
    const disc = Math.sqrt(4 * k * k + 1);
    const s = GateElm.cbrt(2 * k + disc) + GateElm.cbrt(2 * k - disc);
    const t = (s + 1) / 2;
    return 3 * t * (1 - t) * GateElm.orBackCtrlFrac * len;
  }
  createEuroGatePolygon() {
    const pts = this.newPointArray(4);
    this.interpPoint2(this.lead1, this.lead2, pts[0], pts[1], 0, this.hs2);
    this.interpPoint2(this.lead1, this.lead2, pts[3], pts[2], 1, this.hs2);
    this.gatePoly = this.createPolygon(pts);
  }
  getGateText() {
    return null;
  }
  static useEuroGates() {
    return CircuitElm.app.menus.euroGatesCheckItem.getState();
  }
  drawGatePolygon(g) {
    g.setLineWidth(3);
    g.context.beginPath();
    if (this.drawAsAndGate()) {
      g.context.moveTo(this.gatePoly.xpoints[0], this.gatePoly.ypoints[0]);
      g.context.lineTo(this.gatePoly.xpoints[1], this.gatePoly.ypoints[1]);
      g.context.bezierCurveTo(
        this.gatePoly.xpoints[1],
        this.gatePoly.ypoints[1],
        this.gatePoly.xpoints[2],
        this.gatePoly.ypoints[2],
        this.gatePoly.xpoints[3],
        this.gatePoly.ypoints[3]
      );
      g.context.bezierCurveTo(
        this.gatePoly.xpoints[3],
        this.gatePoly.ypoints[3],
        this.gatePoly.xpoints[4],
        this.gatePoly.ypoints[4],
        this.gatePoly.xpoints[5],
        this.gatePoly.ypoints[5]
      );
      g.context.lineTo(this.gatePoly.xpoints[6], this.gatePoly.ypoints[6]);
    } else {
      g.context.moveTo(this.gatePoly.xpoints[0], this.gatePoly.ypoints[0]);
      g.context.lineTo(this.gatePoly.xpoints[1], this.gatePoly.ypoints[1]);
      g.context.bezierCurveTo(
        this.gatePoly.xpoints[2],
        this.gatePoly.ypoints[2],
        this.gatePoly.xpoints[2],
        this.gatePoly.ypoints[2],
        this.gatePoly.xpoints[3],
        this.gatePoly.ypoints[3]
      );
      g.context.bezierCurveTo(
        this.gatePoly.xpoints[4],
        this.gatePoly.ypoints[4],
        this.gatePoly.xpoints[4],
        this.gatePoly.ypoints[4],
        this.gatePoly.xpoints[5],
        this.gatePoly.ypoints[5]
      );
      g.context.lineTo(this.gatePoly.xpoints[6], this.gatePoly.ypoints[6]);
      g.context.bezierCurveTo(
        this.gatePoly.xpoints[7],
        this.gatePoly.ypoints[7],
        this.gatePoly.xpoints[7],
        this.gatePoly.ypoints[7],
        this.gatePoly.xpoints[0],
        this.gatePoly.ypoints[0]
      );
    }
    g.context.closePath();
    if (this.isXorGateElm()) {
      g.context.moveTo(this.gatePoly.xpoints[8], this.gatePoly.ypoints[8]);
      g.context.bezierCurveTo(
        this.gatePoly.xpoints[10],
        this.gatePoly.ypoints[10],
        this.gatePoly.xpoints[10],
        this.gatePoly.ypoints[10],
        this.gatePoly.xpoints[9],
        this.gatePoly.ypoints[9]
      );
    }
    g.context.stroke();
    g.setLineWidth(1);
  }
  draw(g) {
    for (let i = 0; i !== this.inputCount; i++) {
      this.setVoltageColor(g, this.nodes[i].v);
      CircuitElm.drawThickLine(g, this.inPosts[i], this.inGates[i]);
    }
    this.setVoltageColor(g, this.nodes[this.inputCount].v);
    CircuitElm.drawThickLine(g, this.lead2, this.point2);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    if (GateElm.useEuroGates()) {
      CircuitElm.drawThickPolygon(g, this.gatePoly);
      const center = this.interpPoint(this.point1, this.point2, 0.5);
      this.drawCenteredText(g, this.getGateText(), center.x, center.y - 6 * this.gsize, true);
    } else
      this.drawGatePolygon(g);
    g.setLineWidth(2);
    if (this.hasSchmittInputs())
      CircuitElm.drawPolygon(g, this.schmittPoly);
    g.setLineWidth(1);
    if (this.linePoints !== null)
      for (let i = 0; i !== this.linePoints.length - 1; i++)
        CircuitElm.drawThickLine(g, this.linePoints[i], this.linePoints[i + 1]);
    if (this.pcircle !== null && this.isInverting() !== this.hasFlag(GateElm.FLAG_DEMORGAN))
      CircuitElm.drawThickCircle(g, this.pcircle.x, this.pcircle.y, 3);
    if (this.icircles !== null)
      for (let i = 0; i !== this.inputCount; i++)
        CircuitElm.drawThickCircle(g, this.icircles[i].x, this.icircles[i].y, 3);
    this.curcount = this.updateDotCountImpl(this.current, this.curcount);
    this.drawDots(g, this.lead2, this.point2, this.curcount);
    this.drawPosts(g);
  }
  gatePoly;
  schmittPoly;
  pcircle = null;
  linePoints = null;
  icircles = null;
  getPostCount() {
    return this.inputCount + 1;
  }
  getPost(n) {
    if (n === this.inputCount)
      return this.point2;
    return this.inPosts[n];
  }
  getVoltageSourceCount() {
    return 1;
  }
  getInfo(arr) {
    arr[0] = this.getGateName();
    arr[1] = "Vout = " + CircuitElm.getVoltageText(this.nodes[this.inputCount].v);
    arr[2] = "Iout = " + CircuitElm.getCurrentText(this.getCurrent());
    if (this.propagationDelay > 0)
      arr[3] = "delay = " + CircuitElm.getUnitText(this.propagationDelay, "s");
  }
  setHighVoltage(hv) {
    this.highVoltage = hv;
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[this.inputCount], this.voltSource);
  }
  hasSchmittInputs() {
    return (this.flags & GateElm.FLAG_SCHMITT) !== 0;
  }
  getInput(x) {
    const high = !this.hasFlag(GateElm.FLAG_INVERT_INPUTS);
    if (!this.hasSchmittInputs())
      return this.nodes[x].v > this.highVoltage * 0.5 ? high : !high;
    if (this.inputStates == null || this.inputStates.length !== this.inputCount)
      this.inputStates = new Array(this.inputCount).fill(false);
    const res = this.nodes[x].v > this.highVoltage * (this.inputStates[x] ? 0.35 : 0.55);
    this.inputStates[x] = res;
    return res ? high : !high;
  }
  oscillationCount = 0;
  lastTime = 0;
  doStep() {
    if (this.justLoaded) {
      this.justLoaded = false;
      CircuitElm.sim.updateVoltageSource(
        CircuitNode.ground,
        this.nodes[this.inputCount],
        this.voltSource,
        this.lastOutput ? this.highVoltage : 0
      );
      return;
    }
    let f = this.calcFunction();
    if (this.isInverting())
      f = !f;
    if (this.propagationDelay === 0 && this.lastTime !== CircuitElm.sim.t) {
      if (this.lastOutput === !f) {
        if (this.oscillationCount++ > 50) {
          this.oscillationCount = 0;
          if (CircuitElm.app.getrand(10) > 5)
            f = this.lastOutput;
        }
      } else
        this.oscillationCount = 0;
      this.lastTime = CircuitElm.sim.t;
    }
    if (this.propagationDelay > 0) {
      if (f !== this.lastOutput) {
        if (this.delayEndTime === 0)
          this.delayEndTime = CircuitElm.sim.t + this.propagationDelay;
        else if (CircuitElm.sim.t >= this.delayEndTime) {
          this.lastOutput = f;
          this.delayEndTime = 0;
        }
      } else {
        this.delayEndTime = 0;
      }
    } else {
      this.lastOutput = f;
    }
    const res = this.lastOutput ? this.highVoltage : 0;
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[this.inputCount], this.voltSource, res);
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Inputs", this.inputCount, 1, 8).setDimensionless();
    if (n === 1)
      return new EditInfo("High Logic Voltage", this.highVoltage, 1, 10).setUnitStep();
    if (n === 2)
      return EditInfo.createCheckbox("Schmitt Inputs", this.hasSchmittInputs());
    if (n === 3)
      return EditInfo.createCheckbox("Invert Inputs", this.hasFlag(GateElm.FLAG_INVERT_INPUTS));
    if (n === 4)
      return new EditInfo("Propagation Delay (s)", this.propagationDelay, 0, 0);
    if (n === 5)
      return EditInfo.createCheckbox("DeMorgan's Symbol", this.hasFlag(GateElm.FLAG_DEMORGAN));
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 1) {
        this.inputCount = Math.trunc(ei.value);
        this.allocNodes();
        this.setupVolts();
        this.setPoints();
      } else
        ei.setError("must be >= 1");
    }
    if (n === 1)
      this.highVoltage = GateElm.lastHighVoltage = ei.value;
    if (n === 2) {
      if (ei.checkbox.getState())
        this.flags |= GateElm.FLAG_SCHMITT;
      else
        this.flags &= -3;
      GateElm.lastSchmitt = this.hasSchmittInputs();
      this.setPoints();
    }
    if (n === 3) {
      if (ei.checkbox.getState()) {
        this.flags |= GateElm.FLAG_INVERT_INPUTS;
        this.flags &= -9;
      } else
        this.flags &= -5;
      this.setPoints();
      if (CirSim.editDialog != null)
        CirSim.editDialog.resetDialog();
    }
    if (n === 4)
      this.propagationDelay = ei.value;
    if (n === 5) {
      if (ei.checkbox.getState()) {
        this.flags |= GateElm.FLAG_DEMORGAN;
        this.flags &= -5;
      } else
        this.flags &= -9;
      this.setPoints();
      if (CirSim.editDialog != null)
        CirSim.editDialog.resetDialog();
    }
  }
  validate() {
    return this.validateRailNode(this.inputCount);
  }
  getConnection(n1, n2) {
    return false;
  }
  hasGroundConnection(n1) {
    return n1 === this.inputCount;
  }
  getCurrentIntoNode(n) {
    if (n === this.inputCount)
      return this.current;
    return 0;
  }
}
class AndGateElm extends GateElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) super(xa, ya);
    else super(xa, ya, xb, yb, f, st);
  }
  getGateText() {
    return "&";
  }
  getGateName() {
    if (this.hasFlag(GateElm.FLAG_INVERT_INPUTS))
      return "NOR gate";
    return "AND gate";
  }
  calcFunction() {
    let f = true;
    for (let i = 0; i !== this.inputCount; i++)
      f = f && this.getInput(i);
    return f;
  }
  getDumpType() {
    return 150;
  }
  getShortcut() {
    return "2".charCodeAt(0);
  }
  // false = drawn as OR, true = drawn as AND; FLAG_DEMORGAN and FLAG_INVERT_INPUTS
  // cannot be set at the same time from the Edit popup
  drawAsAndGate() {
    return !this.hasFlag(GateElm.FLAG_DEMORGAN);
  }
}
class NandGateElm extends AndGateElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) super(xa, ya);
    else super(xa, ya, xb, yb, f, st);
  }
  isInverting() {
    return true;
  }
  getGateName() {
    if (this.hasFlag(GateElm.FLAG_INVERT_INPUTS))
      return "OR gate";
    return "NAND gate";
  }
  getDumpType() {
    return 151;
  }
  getShortcut() {
    return "@".charCodeAt(0);
  }
  drawAsAndGate() {
    return !this.hasFlag(GateElm.FLAG_DEMORGAN);
  }
}
class OrGateElm extends GateElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) super(xa, ya);
    else super(xa, ya, xb, yb, f, st);
  }
  getGateName() {
    if (this.hasFlag(GateElm.FLAG_INVERT_INPUTS))
      return "NAND gate";
    return "OR gate";
  }
  // Used to fan the two outermost leads back on large (>3-input) gates,
  // against a flat back reference. It only ever applied to the wire's
  // fraction (inGates), never to the bubble's (icircles), so on any
  // bubbled/DeMorgan large gate the two outer leads' wires pulled back
  // from their bubbles, leaving a visible gap -- and once GateElm's
  // backCurveX() started tracking the OR body's true (curved) back
  // surface, the same pull-back opened an identical gap to the body
  // itself on plain (non-bubbled) large OR/NOR gates. The curve already
  // tapers naturally toward the corners, making this manual fan
  // redundant on top of it, so it's removed rather than patched to also
  // move the bubble -- large gates now touch flush, same as small ones.
  getGateText() {
    return "≥1";
  }
  calcFunction() {
    let f = false;
    for (let i = 0; i !== this.inputCount; i++)
      f = f || this.getInput(i);
    return f;
  }
  getDumpType() {
    return 152;
  }
  getShortcut() {
    return "3".charCodeAt(0);
  }
  // false = drawn as OR, true = drawn as AND; FLAG_DEMORGAN and FLAG_INVERT_INPUTS
  // cannot be set at the same time from the Edit popup
  drawAsAndGate() {
    return this.hasFlag(GateElm.FLAG_DEMORGAN);
  }
}
class NorGateElm extends OrGateElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) super(xa, ya);
    else super(xa, ya, xb, yb, f, st);
  }
  getGateName() {
    if (this.hasFlag(GateElm.FLAG_INVERT_INPUTS))
      return "AND gate";
    return "NOR gate";
  }
  isInverting() {
    return true;
  }
  getDumpType() {
    return 153;
  }
  getShortcut() {
    return "#".charCodeAt(0);
  }
  drawAsAndGate() {
    return this.hasFlag(GateElm.FLAG_DEMORGAN);
  }
}
class XorGateElm extends OrGateElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) super(xa, ya);
    else super(xa, ya, xb, yb, f, st);
  }
  getGateName() {
    return "XOR gate";
  }
  getGateText() {
    return "=1";
  }
  isXorGateElm() {
    return true;
  }
  calcFunction() {
    let f = false;
    for (let i = 0; i !== this.inputCount; i++)
      f = f !== this.getInput(i);
    return f;
  }
  // skip "Invert Inputs" (index 3 in GateElm); shift higher indices down
  getEditInfo(n) {
    if (n >= 3) return super.getEditInfo(n + 1);
    return super.getEditInfo(n);
  }
  setEditValue(n, ei) {
    if (n >= 3) super.setEditValue(n + 1, ei);
    else super.setEditValue(n, ei);
  }
  getDumpType() {
    return 154;
  }
  getShortcut() {
    return "4".charCodeAt(0);
  }
  drawAsAndGate() {
    return false;
  }
}
class XnorGateElm extends XorGateElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) super(xa, ya);
    else super(xa, ya, xb, yb, f, st);
  }
  getGateName() {
    return "XNOR gate";
  }
  isInverting() {
    return true;
  }
  getDumpType() {
    return 431;
  }
  getShortcut() {
    return "$".charCodeAt(0);
  }
  drawAsAndGate() {
    return false;
  }
}

class AntennaElm extends RailElm {
  fmphase = 0;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa, VoltageElm.WF_AC);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
      this.waveform = VoltageElm.WF_AC;
    }
  }
  drawRail(g) {
    this.drawRailText(g, "Ant");
  }
  getVoltage() {
    const fm = 3 * Math.sin(this.fmphase);
    return Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 3e3) * (1.3 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 12)) * 3 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 2710) * (1.3 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 13)) * 3 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 2433) * (1.3 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 14)) * 3 + fm;
  }
  stepFinished() {
    this.fmphase += 2 * CircuitElm.pi * (2200 + Math.sin(2 * CircuitElm.pi * CircuitElm.sim.t * 13) * 100) * CircuitElm.sim.timeStep;
  }
  getDumpType() {
    return "A".charCodeAt(0);
  }
  getShortcut() {
    return 0;
  }
  getInfo(arr) {
    super.getInfo(arr);
    arr[0] = "Antenna (amplified)";
  }
  getEditInfo(n) {
    return null;
  }
}

class AudioOutputElm extends CircuitElm {
  dataCount = 0;
  dataPtr = 0;
  data = [];
  dataFull = false;
  button = null;
  samplingRate = 0;
  labelNum = 0;
  duration = 0;
  sampleStep = 0;
  dataStart = 0;
  static lastSamplingRate = 8e3;
  static okToChangeTimeStep = false;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.duration = 1;
      this.samplingRate = AudioOutputElm.lastSamplingRate;
      this.labelNum = this.getNextLabelNum();
      this.setDataCount();
      this.createButton();
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.duration = parseFloatStrict(st.nextToken());
      this.samplingRate = parseIntStrict(st.nextToken());
      this.labelNum = parseIntStrict(st.nextToken());
      this.setDataCount();
      this.createButton();
    }
  }
  dump() {
    return super.dump() + " " + this.duration + " " + this.samplingRate + " " + this.labelNum;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "du", this.duration);
    CircuitXMLSerializer.dumpAttr(elem, "sa", this.samplingRate);
    CircuitXMLSerializer.dumpAttr(elem, "la", this.labelNum);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.duration = xml.parseDoubleAttr("du", this.duration);
    this.samplingRate = xml.parseIntAttr("sa", this.samplingRate);
    this.labelNum = xml.parseIntAttr("la", this.labelNum);
    this.setDataCount();
    this.setButtonLabel();
  }
  draggingDone() {
    this.setTimeStep();
  }
  // get next unused labelNum value
  getNextLabelNum() {
    let num = 1;
    if (CircuitElm.sim.elmList == null)
      return 0;
    for (const ce of CircuitElm.sim.elmList) {
      if (!(ce instanceof AudioOutputElm))
        continue;
      const ln = ce.labelNum;
      if (ln >= num)
        num = ln + 1;
    }
    return num;
  }
  getDumpType() {
    return 211;
  }
  getXmlDumpType() {
    return "aout";
  }
  isAudioOutputElm() {
    return true;
  }
  getPostCount() {
    return 1;
  }
  reset() {
    this.dataPtr = 0;
    this.dataFull = false;
    this.dataSampleCount = 0;
    this.nextDataSample = 0;
    this.dataSample = 0;
  }
  setPoints() {
    super.setPoints();
    this.lead1 = new Point();
  }
  draw(g) {
    g.save();
    const selected = this.needsHighlight();
    const fontSize = 14;
    const s = this.labelNum > 1 ? "Audio " + this.labelNum : "Audio Out";
    g.context.font = (selected ? "bold " : "") + fontSize + "px SansSerif";
    const textWidth = Math.floor(g.context.measureText(s).width);
    g.setColor(Color.darkGray);
    const pct = this.dataFull ? textWidth : Math.floor(textWidth * this.dataPtr / this.dataCount);
    g.fillRect(this.x2 - Math.floor(textWidth / 2), this.y2 - 10, pct, 20);
    g.setColor(selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
    this.interpPoint(this.point1, this.point2, this.lead1, 1 - (textWidth / 2 + 8) / this.dn);
    this.setBbox(this.point1, this.lead1, 0);
    this.drawCenteredText(g, s, this.x2, this.y2, true);
    this.setVoltageColor(g, this.nodes[0].v);
    if (selected)
      g.setColor(CircuitElm.selectColor);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.drawPosts(g);
    g.restore();
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getInfo(arr) {
    arr[0] = "audio output";
    arr[1] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
    const ct = this.dataFull ? this.dataCount : this.dataPtr;
    const dur = this.sampleStep * ct;
    arr[2] = "start = " + CircuitElm.getUnitText(this.dataFull ? CircuitElm.sim.t - this.duration : this.dataStart, "s");
    arr[3] = "dur = " + CircuitElm.getUnitText(dur, "s");
    arr[4] = "samples = " + ct + (this.dataFull ? "" : "/" + this.dataCount);
  }
  dataSampleCount = 0;
  nextDataSample = 0;
  dataSample = 0;
  stepFinished() {
    this.dataSample += this.nodes[0].v;
    this.dataSampleCount++;
    if (CircuitElm.sim.t >= this.nextDataSample) {
      this.nextDataSample += this.sampleStep;
      this.data[this.dataPtr++] = this.dataSample / this.dataSampleCount;
      this.dataSampleCount = 0;
      this.dataSample = 0;
      if (this.dataPtr >= this.dataCount) {
        this.dataPtr = 0;
        this.dataFull = true;
      }
    }
  }
  setDataCount() {
    this.dataCount = Math.floor(this.samplingRate * this.duration);
    this.data = new Array(this.dataCount).fill(0);
    this.dataStart = CircuitElm.sim.t;
    this.dataPtr = 0;
    this.dataFull = false;
    this.sampleStep = 1 / this.samplingRate;
    this.nextDataSample = CircuitElm.sim.t + this.sampleStep;
  }
  samplingRateChoices = [8e3, 11025, 16e3, 22050, 44100, 48e3];
  getEditInfo(n) {
    if (n === 0) {
      return new EditInfo("Duration (s)", this.duration, 0, 5).setPositive();
    }
    if (n === 1) {
      const ei = new EditInfo("Sampling Rate", 0, -1, -1);
      ei.choice = new Choice();
      for (let i = 0; i !== this.samplingRateChoices.length; i++) {
        ei.choice.add(this.samplingRateChoices[i] + "");
        if (this.samplingRateChoices[i] === this.samplingRate)
          ei.choice.select(i);
      }
      return ei;
    }
    if (n === 2) {
      const ei = new EditInfo("", 0, -1, -1);
      const url = AudioOutputElm.getLastBlob();
      if (url === null)
        return null;
      const now = /* @__PURE__ */ new Date();
      const pad = (x) => x.toString().padStart(2, "0");
      const fname = "audio-" + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes()) + ".circuitjs.wav";
      const a = document.createElement("a");
      a.textContent = Locale.LS("Download last played audio");
      a.href = url;
      a.setAttribute("download", fname);
      ei.widget = a;
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0) {
      this.duration = ei.value;
      this.setDataCount();
    }
    if (n === 1) {
      const nsr = this.samplingRateChoices[ei.choice.getSelectedIndex()];
      if (nsr !== this.samplingRate) {
        this.samplingRate = nsr;
        AudioOutputElm.lastSamplingRate = nsr;
        this.setDataCount();
        this.setTimeStep();
      }
    }
  }
  setTimeStep() {
    const target = this.sampleStep / 8;
    if (CircuitElm.sim.maxTimeStep !== target) {
      if (AudioOutputElm.okToChangeTimeStep || window.confirm(Locale.LS("Adjust timestep for best audio quality and performance?"))) {
        CircuitElm.sim.maxTimeStep = target;
        AudioOutputElm.okToChangeTimeStep = true;
      }
    }
  }
  createButton() {
    const btn = document.createElement("button");
    btn.className = "topButton";
    CircuitElm.app.addWidgetToVerticalPanel(btn);
    this.button = btn;
    this.setButtonLabel();
    btn.addEventListener("click", () => {
      this.play();
    });
  }
  setButtonLabel() {
    let label = "&#9654; " + Locale.LS("Play Audio");
    if (this.labelNum > 1)
      label += " " + this.labelNum;
    if (this.button)
      this.button.innerHTML = label;
  }
  delete() {
    if (this.button)
      CircuitElm.app.removeWidgetFromVerticalPanel(this.button);
    super.delete();
  }
  static playAudio(samples, sampleRate) {
    const intSamples = new Int16Array(samples);
    const numSamples = intSamples.length;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    const writeStr = (off, s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, numSamples * 2, true);
    for (let i = 0; i < numSamples; i++)
      view.setInt16(44 + i * 2, intSamples[i], true);
    const d = document;
    if (d.audioBlob) {
      if (d.audioObject) d.audioObject.parentNode?.removeChild(d.audioObject);
      URL.revokeObjectURL(d.audioBlob);
    }
    const blob = new Blob([buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    d.audioBlob = url;
    const audio = document.createElement("audio");
    d.audioObject = audio;
    audio.src = url;
    document.body.appendChild(audio);
    audio.play();
  }
  static getLastBlob() {
    return document.audioBlob ?? null;
  }
  play() {
    let ct = this.dataPtr;
    let base = 0;
    if (this.dataFull) {
      ct = this.dataCount;
      base = this.dataPtr;
    }
    if (ct * this.sampleStep < 0.05) {
      window.alert(Locale.LS("Audio data is not ready yet.  Increase simulation speed to make data ready sooner."));
      return;
    }
    let max = -1e8;
    let min = 1e8;
    for (let i = 0; i !== ct; i++) {
      if (this.data[i] > max) max = this.data[i];
      if (this.data[i] < min) min = this.data[i];
    }
    const adj = -(max + min) / 2;
    const mult = 0.25 * 32766 / (max + adj);
    const fadeLen = Math.floor(this.samplingRate / 20);
    const fadeOut = ct - fadeLen;
    const fadeMult = mult / fadeLen;
    const arr = [];
    for (let i = 0; i !== ct; i++) {
      const fade = i < fadeLen ? i * fadeMult : i > fadeOut ? (ct - i) * fadeMult : mult;
      const s = Math.floor((this.data[(i + base) % this.dataCount] + adj) * fade);
      arr.push(s);
    }
    AudioOutputElm.playAudio(arr, this.samplingRate);
  }
}

class AudioFileEntry {
  fileName;
  data;
}
class AudioInputElm extends RailElm {
  data = null;
  timeOffset = 0;
  samplingRate = 0;
  fileNum = 0;
  fileName = null;
  startPosition = 0;
  static lastSamplingRate = 0;
  // cache to preserve audio data when doing cut/paste, or undo/redo
  static fileNumCounter = 1;
  static audioFileMap = /* @__PURE__ */ new Map();
  constructor(xa, ya, xb, yb, f, st) {
    if (st !== void 0) {
      super(xa, ya, xb, yb, f, st);
      this.waveform = VoltageElm.WF_AC;
      this.maxVoltage = parseFloatStrict(st.nextToken());
      this.startPosition = parseFloatStrict(st.nextToken());
      this.fileNum = parseIntStrict(st.nextToken());
      this.lookupFileNumber();
      this.samplingRate = AudioInputElm.lastSamplingRate;
    } else {
      super(xa, ya, VoltageElm.WF_AC);
      this.maxVoltage = 5;
    }
  }
  dump() {
    this.genFileNumber();
    return super.dump() + " " + this.maxVoltage + " " + this.startPosition + " " + this.fileNum;
  }
  genFileNumber() {
    if (this.data !== null) {
      if (this.fileNum === 0)
        this.fileNum = AudioInputElm.fileNumCounter++;
      const ent = new AudioFileEntry();
      ent.fileName = this.fileName;
      ent.data = this.data;
      AudioInputElm.audioFileMap.set(this.fileNum, ent);
    }
  }
  lookupFileNumber() {
    const ent = AudioInputElm.audioFileMap.get(this.fileNum);
    if (ent !== void 0) {
      this.fileName = ent.fileName;
      this.data = ent.data;
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ma", this.maxVoltage);
    CircuitXMLSerializer.dumpAttr(elem, "st", this.startPosition);
    this.genFileNumber();
    CircuitXMLSerializer.dumpAttr(elem, "fi", this.fileNum);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.maxVoltage = xml.parseDoubleAttr("ma", this.maxVoltage);
    this.startPosition = xml.parseDoubleAttr("st", this.startPosition);
    this.fileNum = xml.parseIntAttr("fi", this.fileNum);
    this.lookupFileNumber();
    this.samplingRate = AudioInputElm.lastSamplingRate;
  }
  reset() {
    this.timeOffset = this.startPosition;
  }
  drawRail(g) {
    this.drawRailText(g, this.fileName === null ? Locale.LS("No file") : this.fileName);
  }
  getRailText() {
    return this.fileName === null ? Locale.LS("No file") : this.fileName;
  }
  setSamplingRate(sr) {
    this.samplingRate = sr;
  }
  getVoltage() {
    if (this.data === null)
      return 0;
    if (this.timeOffset < this.startPosition)
      this.timeOffset = this.startPosition;
    const dptr = this.timeOffset * this.samplingRate;
    const iptr = Math.trunc(dptr);
    const frac = dptr - iptr;
    if (iptr >= this.data.length)
      return 0;
    const value1 = this.data[iptr];
    const value2 = iptr + 1 < this.data.length ? this.data[iptr + 1] : 0;
    return (value1 * (1 - frac) + value2 * frac) * this.maxVoltage;
  }
  stepFinished() {
    this.timeOffset += CircuitElm.sim.timeStep;
  }
  getDumpType() {
    return 411;
  }
  getXmlDumpType() {
    return "ain";
  }
  getShortcut() {
    return 0;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "audio/*";
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (file) {
          this.fileName = file.name.replace(/\.[^.]*$/, "");
          AudioInputElm.fetchLoadFileData(this, file);
        }
      });
      ei.widget = input;
      return ei;
    }
    if (n === 1)
      return new EditInfo("Max Voltage", this.maxVoltage).setUnitStep();
    if (n === 2)
      return new EditInfo("Start Position (s)", this.startPosition);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 1)
      this.maxVoltage = ei.value;
    if (n === 2)
      this.startPosition = ei.value;
  }
  // fetch audio data for a selected file
  static fetchLoadFileData(elm, file) {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    elm.setSamplingRate(context.sampleRate);
    const reader = new FileReader();
    reader.onload = (e) => {
      context.decodeAudioData(
        e.target.result,
        (buffer) => {
          elm.gotAudioData(buffer.getChannelData(0));
        },
        (err) => {
          console.log("Error decoding audio data", err);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  }
  gotAudioData(d) {
    this.data = d;
    AudioInputElm.lastSamplingRate = this.samplingRate;
    AudioOutputElm.lastSamplingRate = this.samplingRate;
  }
  getInfo(arr) {
    arr[0] = "audio input";
    if (this.data === null) {
      arr[1] = "no file loaded";
      return;
    }
    arr[1] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[2] = "pos = " + CircuitElm.getUnitText(this.timeOffset, "s");
    const dur = this.data.length / this.samplingRate;
    arr[3] = "dur = " + CircuitElm.getUnitText(dur, "s");
  }
  static clearCache() {
    AudioInputElm.audioFileMap.clear();
  }
}

class BatteryElm extends CircuitElm {
  static FLAG_SHOW_VOLTAGE = 1;
  static FLAG_SHOW_SOC = 2;
  // BT_CUSTOM is -1 (not an index into batteryTypeNames/batteryTypeTables) so that
  // new preset types can be appended below without renumbering it.
  static BT_ALKALINE = 0;
  static BT_LITHIUM = 1;
  static BT_NIMH = 2;
  static BT_NICD = 3;
  static BT_LEAD_ACID = 4;
  static BT_CUSTOM = -1;
  static batteryTypeNames = ["Alkaline 1.5V", "Lithium-Ion", "NiMH 1.2V", "NiCd 1.2V", "Lead-Acid"];
  static batteryTypeTables = [
    "0=0.8\n10=0.95\n20=1.05\n40=1.18\n60=1.28\n80=1.38\n90=1.43\n100=1.55\n",
    // alkaline
    "0=3.00\n5=3.30\n10=3.45\n20=3.55\n30=3.62\n40=3.68\n50=3.73\n60=3.79\n70=3.87\n80=3.97\n90=4.08\n95=4.15\n100=4.20\n",
    // lithium-ion
    "0=1.00\n10=1.15\n20=1.20\n50=1.25\n80=1.30\n90=1.33\n100=1.40\n",
    // NiMH
    "0=1.00\n10=1.15\n20=1.20\n50=1.22\n80=1.25\n90=1.28\n100=1.35\n",
    // NiCd
    "0=1.75\n10=1.90\n20=1.95\n50=2.05\n80=2.10\n90=2.12\n100=2.15\n"
    // lead-acid
  ];
  // default capacity (Ah), R0 (ohms), R1 (ohms), C1 (F) for each preset battery type,
  // applied when the user switches to that type in the edit dialog
  static batteryTypeDefaults = [
    [2.5, 0.15, 0.25, 1500],
    // alkaline (AA)
    [3, 0.025, 0.02, 2e3],
    // lithium-ion (18650)
    [2, 0.03, 0.04, 1800],
    // NiMH (AA)
    [1, 0.02, 0.025, 1200],
    // NiCd (AA)
    [10, 8e-3, 0.012, 5e3]
    // lead-acid (2V)
  ];
  batteryType;
  r0;
  r1;
  c1;
  capacityAh;
  initialSoc;
  // 0 to 1, used when resetting
  soc = 0;
  // 0 to 1, current state of charge
  // internal node indices: nodes[0] = (-) terminal, nodes[1] = (+) terminal,
  // nodes[2] = node between Vsrc and R0, nodes[3] = node between R0 and R1/C1
  compResistance = 0;
  capVoltDiff = 0;
  capCurrent = 0;
  curSourceValue = 0;
  socVoltageTable;
  socTable = [];
  // each entry is [socPercent, voltage], sorted ascending
  constructor(xx, yy) {
    super(xx, yy);
    this.r0 = 0.01;
    this.r1 = 0.02;
    this.c1 = 2e3;
    this.capacityAh = 2;
    this.initialSoc = 1;
    this.flags |= BatteryElm.FLAG_SHOW_VOLTAGE | BatteryElm.FLAG_SHOW_SOC;
    this.batteryType = BatteryElm.BT_LITHIUM;
    this.socVoltageTable = BatteryElm.batteryTypeTables[this.batteryType];
    this.parseSocTable(null);
    this.reset();
  }
  getInternalNodeCount() {
    return 2;
  }
  getVoltageSourceCount() {
    return 1;
  }
  getDragVertical(requestedVertical) {
    return true;
  }
  isBatteryElm() {
    return true;
  }
  // point 2, not point 1, should track the mouse during toolbar drag-and-drop
  dragPlace(xa, ya, vertical) {
    super.dragPlace(xa, ya, vertical);
    this.swapDragEndpoints();
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "r0", this.r0);
    CircuitXMLSerializer.dumpAttr(elem, "r1", this.r1);
    CircuitXMLSerializer.dumpAttr(elem, "c1", this.c1);
    CircuitXMLSerializer.dumpAttr(elem, "cap", this.capacityAh);
    CircuitXMLSerializer.dumpAttr(elem, "isoc", this.initialSoc);
    CircuitXMLSerializer.dumpAttr(elem, "bt", this.batteryType);
    if (this.batteryType === BatteryElm.BT_CUSTOM && this.socVoltageTable != null && this.socVoltageTable.length > 0)
      elem.appendChild(doc.createTextNode(this.socVoltageTable));
  }
  dumpXmlState(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "soc", this.soc);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.r0 = xml.parseDoubleAttr("r0", 0.01);
    this.r1 = xml.parseDoubleAttr("r1", 0.02);
    this.c1 = xml.parseDoubleAttr("c1", 2e3);
    this.capacityAh = xml.parseDoubleAttr("cap", 2);
    this.initialSoc = BatteryElm.clampSoc(xml.parseDoubleAttr("isoc", 1));
    this.soc = Math.min(1, xml.parseDoubleAttr("soc", this.initialSoc));
    this.batteryType = xml.parseIntAttr("bt", BatteryElm.BT_LITHIUM);
    if (this.batteryType === BatteryElm.BT_CUSTOM) {
      this.socVoltageTable = "";
      try {
        this.socVoltageTable = xml.parseContents() ?? "";
      } catch (e) {
        CirSim.console("exception in undump " + e);
      }
      if (this.socVoltageTable == null || this.socVoltageTable.length === 0)
        this.socVoltageTable = BatteryElm.batteryTypeTables[BatteryElm.BT_LITHIUM];
    } else
      this.socVoltageTable = this.batteryType >= 0 && this.batteryType < BatteryElm.batteryTypeTables.length ? BatteryElm.batteryTypeTables[this.batteryType] : BatteryElm.batteryTypeTables[BatteryElm.BT_LITHIUM];
    this.parseSocTable(null);
  }
  reset() {
    this.soc = BatteryElm.clampSoc(this.initialSoc);
    this.capVoltDiff = this.capCurrent = this.curSourceValue = 0;
    this.curcount = 0;
  }
  static clampSoc(s) {
    if (s < 0) return 0;
    if (s > 1) return 1;
    return s;
  }
  parseSocTable(ei) {
    this.socTable = [];
    if (this.socVoltageTable == null || this.socVoltageTable.length === 0)
      return;
    const lines = this.socVoltageTable.split("\n");
    for (let i = 0; i !== lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0)
        continue;
      const eq = line.indexOf("=");
      if (eq < 0) {
        if (ei != null)
          ei.setError("missing =: " + line);
        continue;
      }
      try {
        const socPct = parseFloatStrict(line.substring(0, eq).trim());
        const v = parseFloatStrict(line.substring(eq + 1).trim());
        if (isNaN(socPct) || isNaN(v))
          throw new Error("bad number");
        this.socTable.push([socPct, v]);
      } catch (e) {
        if (ei != null)
          ei.setError("bad line: " + line);
      }
    }
    for (let i = 1; i < this.socTable.length; i++) {
      const cur = this.socTable[i];
      let j = i - 1;
      while (j >= 0 && this.socTable[j][0] > cur[0]) {
        this.socTable[j + 1] = this.socTable[j];
        j--;
      }
      this.socTable[j + 1] = cur;
    }
  }
  getVoltageForSoc(socFrac) {
    const socPct = socFrac * 100;
    if (socPct < 0) {
      const v0 = this.interpSocTable(0);
      const v10 = this.interpSocTable(10);
      const slope = (v10 - v0) / 10;
      return v0 + slope * 3 * socPct;
    }
    return this.interpSocTable(socPct);
  }
  interpSocTable(socPct) {
    if (this.socTable == null || this.socTable.length === 0)
      return 3.7;
    if (this.socTable.length === 1)
      return this.socTable[0][1];
    if (socPct <= this.socTable[0][0])
      return this.socTable[0][1];
    const n = this.socTable.length;
    if (socPct >= this.socTable[n - 1][0])
      return this.socTable[n - 1][1];
    for (let i = 0; i < n - 1; i++) {
      const a = this.socTable[i];
      const b = this.socTable[i + 1];
      if (socPct >= a[0] && socPct <= b[0]) {
        if (b[0] === a[0])
          return a[1];
        const frac = (socPct - a[0]) / (b[0] - a[0]);
        return a[1] + frac * (b[1] - a[1]);
      }
    }
    return this.socTable[n - 1][1];
  }
  setVoltageSource(n, v) {
    super.setVoltageSource(n, v);
    v.setNodes(this.nodes[0], this.nodes[2]);
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[2], this.voltSource);
    CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[3], this.r0);
    CircuitElm.sim.stampResistor(this.nodes[3], this.nodes[1], this.r1);
    if (this.doDcAnalysis()) {
      this.compResistance = 1e8;
    } else {
      this.compResistance = CircuitElm.sim.timeStep / (2 * this.c1);
    }
    CircuitElm.sim.stampResistor(this.nodes[3], this.nodes[1], this.compResistance);
    CircuitElm.sim.stampRightSide(this.nodes[3]);
    CircuitElm.sim.stampRightSide(this.nodes[1]);
  }
  startIteration() {
    if (this.doDcAnalysis())
      this.curSourceValue = 0;
    else
      this.curSourceValue = -this.capVoltDiff / this.compResistance - this.capCurrent;
  }
  doStep() {
    CircuitElm.sim.updateVoltageSource(this.nodes[0], this.nodes[2], this.voltSource, this.getVoltageForSoc(this.soc));
    CircuitElm.sim.stampCurrentSource(this.nodes[3], this.nodes[1], this.curSourceValue);
  }
  stepFinished() {
    this.capVoltDiff = this.nodes[3].v - this.nodes[1].v;
    if (this.compResistance > 0)
      this.capCurrent = this.capVoltDiff / this.compResistance + this.curSourceValue;
    if (this.capacityAh > 0 && !this.doDcAnalysis()) {
      this.soc -= this.current * CircuitElm.sim.timeStep / (3600 * this.capacityAh);
      if (this.soc > 1)
        this.soc = 1;
    }
  }
  circleSize = 17;
  setPoints() {
    super.setPoints();
    this.calcLeads(8);
  }
  draw(g) {
    this.setBbox(this.x, this.y, this.x2, this.y2);
    this.draw2Leads(g);
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
    if (this.dx === 0 || this.dy === 0) {
      const showV = (this.flags & BatteryElm.FLAG_SHOW_VOLTAGE) !== 0;
      const showSoc = (this.flags & BatteryElm.FLAG_SHOW_SOC) !== 0;
      let s = null;
      if (showV && showSoc)
        s = CircuitElm.getShortUnitText(this.getVoltageForSoc(this.soc), "V") + " " + this.getSocText();
      else if (showV)
        s = CircuitElm.getShortUnitText(this.getVoltageForSoc(this.soc), "V");
      else if (showSoc)
        s = this.getSocText();
      if (s != null)
        this.drawValues(g, s, hs);
    }
    this.updateDotCount();
    if (!this.isCreating())
      this.drawDots(g, this.point1, this.point2, this.curcount);
    this.drawPosts(g);
  }
  addRoutingObstacle(wr) {
    this.addRoutingObstacleWithLeads(wr, 16);
  }
  getPower() {
    return -this.getVoltageDiff() * this.current;
  }
  getVoltageDiff() {
    return this.nodes[1].v - this.nodes[0].v;
  }
  // SOC is always shown as a whole percentage; getShortUnitText()/getUnitText() would
  // apply metric prefixes or decimal places that don't make sense for a percentage.
  getSocText() {
    return Math.round(this.soc * 100) + "%";
  }
  getBatteryTypeName() {
    return this.batteryType >= 0 && this.batteryType < BatteryElm.batteryTypeNames.length ? BatteryElm.batteryTypeNames[this.batteryType] : "Custom";
  }
  getInfo(arr) {
    arr[0] = Locale.LS("battery") + " (" + Locale.LS(this.getBatteryTypeName()) + ")";
    arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
    arr[2] = "Vd = " + CircuitElm.getVoltageText(this.getVoltageDiff());
    arr[3] = "SOC = " + this.getSocText();
    arr[4] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Battery Type", this.batteryType, -1, -1);
      ei.choice = new Choice();
      for (let i = 0; i !== BatteryElm.batteryTypeNames.length; i++)
        ei.choice.add(BatteryElm.batteryTypeNames[i]);
      ei.choice.add("Custom");
      ei.choice.select(this.batteryType === BatteryElm.BT_CUSTOM ? BatteryElm.batteryTypeNames.length : this.batteryType);
      return ei;
    }
    if (n === 1)
      return new EditInfo("Capacity (Ah)", this.capacityAh).setPositive();
    if (n === 2)
      return new EditInfo("Initial State of Charge (%)", this.initialSoc * 100, 0, 100).setDimensionless();
    if (n === 3)
      return new EditInfo("R0, Ohmic Resistance (ohms)", this.r0).setPositive();
    if (n === 4)
      return new EditInfo("R1, Polarization Resistance (ohms)", this.r1).setPositive();
    if (n === 5)
      return new EditInfo("C1, Polarization Capacitance (F)", this.c1).setPositive();
    if (n === 6) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Show Voltage", (this.flags & BatteryElm.FLAG_SHOW_VOLTAGE) !== 0);
      return ei;
    }
    if (n === 7) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Show State of Charge", (this.flags & BatteryElm.FLAG_SHOW_SOC) !== 0);
      return ei;
    }
    if (n === 8 && this.batteryType === BatteryElm.BT_CUSTOM) {
      const ei = new EditInfo("SOC(%) = Voltage Table", 0);
      ei.textArea = { value: this.socVoltageTable };
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.choice != null) {
      const oldType = this.batteryType;
      const sel = ei.choice.getSelectedIndex();
      this.batteryType = sel >= BatteryElm.batteryTypeNames.length ? BatteryElm.BT_CUSTOM : sel;
      if (this.batteryType !== BatteryElm.BT_CUSTOM) {
        this.socVoltageTable = BatteryElm.batteryTypeTables[this.batteryType];
        if (this.batteryType !== oldType) {
          const d = BatteryElm.batteryTypeDefaults[this.batteryType];
          this.capacityAh = d[0];
          this.r0 = d[1];
          this.r1 = d[2];
          this.c1 = d[3];
        }
      } else if (oldType !== BatteryElm.BT_CUSTOM)
        this.socVoltageTable = BatteryElm.batteryTypeTables[oldType];
      this.parseSocTable(null);
      if (this.batteryType !== oldType)
        ei.newDialog = true;
    }
    if (n === 1)
      this.capacityAh = ei.value;
    if (n === 2) {
      let v = ei.value;
      if (v < 0) v = 0;
      if (v > 100) v = 100;
      this.initialSoc = v * 0.01;
    }
    if (n === 3)
      this.r0 = ei.value;
    if (n === 4)
      this.r1 = ei.value;
    if (n === 5)
      this.c1 = ei.value;
    if (n === 6 && ei.checkbox != null)
      this.flags = ei.changeFlag(this.flags, BatteryElm.FLAG_SHOW_VOLTAGE);
    if (n === 7 && ei.checkbox != null)
      this.flags = ei.changeFlag(this.flags, BatteryElm.FLAG_SHOW_SOC);
    if (n === 8) {
      this.socVoltageTable = ei.textArea.element ? ei.textArea.element.value : ei.textArea.value;
      this.parseSocTable(ei);
    }
  }
}

class GraphicElm extends CircuitElm {
  isGraphicElm() {
    return true;
  }
  constructor(xa, ya, xb, yb, flags) {
    if (xb === void 0) {
      super(xa, ya);
    } else {
      super(xa, ya, xb, yb, flags);
    }
  }
  getPostCount() {
    return 0;
  }
}

class BoxElm extends GraphicElm {
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.x2 = xxOrXa;
      this.y2 = yyOrYa;
      this.setBbox(this.x, this.y, this.x2, this.y2);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.x2 = xb;
      this.y2 = yb;
      this.setBbox(this.x, this.y, this.x2, this.y2);
    }
  }
  getDumpType() {
    return "b".charCodeAt(0);
  }
  drag(xx, yy) {
    this.x2 = xx;
    this.y2 = yy;
  }
  creationFailed() {
    return Math.abs(this.x2 - this.x) < 32 || Math.abs(this.y2 - this.y) < 32;
  }
  draw(g) {
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.GRAY);
    this.setBbox(this.x, this.y, this.x2, this.y2);
    g.setLineDash(16, 6);
    if (this.x < this.x2 && this.y < this.y2)
      g.drawRect(this.x, this.y, this.x2 - this.x, this.y2 - this.y);
    else if (this.x > this.x2 && this.y < this.y2)
      g.drawRect(this.x2, this.y, this.x - this.x2, this.y2 - this.y);
    else if (this.x < this.x2 && this.y > this.y2)
      g.drawRect(this.x, this.y2, this.x2 - this.x, this.y - this.y2);
    else
      g.drawRect(this.x2, this.y2, this.x - this.x2, this.y - this.y2);
    g.setLineDash(0, 0);
  }
  getEditInfo(n) {
    return null;
  }
  setEditValue(n, ei) {
  }
  getInfo(arr) {
  }
  getShortcut() {
    return 0;
  }
  getMouseDistance(gx, gy) {
    const thresh = 10;
    const dx1 = Math.abs(gx - this.x);
    const dy1 = Math.abs(gy - this.y);
    const dx2 = Math.abs(gx - this.x2);
    const dy2 = Math.abs(gy - this.y2);
    if (Math.abs(dx1) < thresh)
      return dx1 * dx1;
    if (Math.abs(dx2) < thresh)
      return dx2 * dx2;
    if (Math.abs(dy1) < thresh)
      return dy1 * dy1;
    if (Math.abs(dy2) < thresh)
      return dy2 * dy2;
    return -1;
  }
  selectRect(r, add) {
    if (r.contains(this.boundingBox))
      this.selected = true;
    else if (!add)
      this.selected = false;
  }
}

class BusLogicInputElm extends SwitchElm {
  busWidth = 4;
  value = 0;
  hiV = 5;
  loV = 0;
  voltageSources = null;
  currents = null;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "bw", this.busWidth);
    if (this.value !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "va", this.value);
    if (this.hiV !== 5)
      CircuitXMLSerializer.dumpAttr(elem, "hi", this.hiV);
    if (this.loV !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "lo", this.loV);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.busWidth = xml.parseIntAttr("bw", this.busWidth);
    this.value = xml.parseIntAttr("va", 0);
    this.hiV = xml.parseDoubleAttr("hi", this.hiV);
    this.loV = xml.parseDoubleAttr("lo", this.loV);
  }
  getDumpType() {
    return 0;
  }
  getPostCount() {
    return this.busWidth;
  }
  getNumHandles() {
    return 1;
  }
  getPostWidth(n) {
    return this.busWidth;
  }
  getVoltageSourceCount() {
    return this.busWidth;
  }
  getPost(n) {
    return new Point(this.x, this.y, n);
  }
  setVoltageSource(n, v) {
    if (this.voltageSources === null || this.voltageSources.length !== this.busWidth) {
      this.voltageSources = new Array(this.busWidth);
      this.currents = new Array(this.busWidth).fill(0);
    }
    this.voltageSources[n] = v;
  }
  setCurrent(vs, c) {
    for (let i = 0; i < this.busWidth; i++)
      if (this.voltageSources[i] === vs) {
        this.currents[i] = this.current = c;
        break;
      }
  }
  getCurrentIntoNode(n) {
    return this.currents ? this.currents[n] : 0;
  }
  setPoints() {
    super.setPoints();
    this.lead1 = new Point();
  }
  draw(g) {
    g.save();
    const fontSize = 20;
    g.context.font = "bold " + fontSize + "px SansSerif";
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
    const s = "" + this.value;
    this.interpPoint(
      this.point1,
      this.point2,
      this.lead1,
      1 - (Math.floor(g.context.measureText(s).width) / 2 + 8) / this.dn
    );
    this.setBbox(this.point1, this.lead1, 0);
    this.drawCenteredText(g, s, this.x2, this.y2, true);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1, 5);
    if (this.currents !== null) {
      this.current = 0;
      for (let i = 0; i < this.currents.length; i++)
        this.current += this.currents[i];
    }
    this.updateDotCount();
    this.drawDots(g, this.point1, this.lead1, -this.curcount);
    this.drawPosts(g);
    g.restore();
  }
  getSwitchRect() {
    return new Rectangle(this.x2 - 10, this.y2 - 10, 20, 20);
  }
  toggle() {
    this.value++;
    if (this.value >= 1 << this.busWidth)
      this.value = 0;
  }
  stamp() {
    for (let i = 0; i < this.busWidth; i++) {
      const v = (this.value & 1 << i) !== 0 ? this.hiV : this.loV;
      CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[i], this.voltageSources[i], v);
    }
  }
  calculateCurrent() {
  }
  hasGroundConnection(n) {
    return true;
  }
  isWireEquivalent() {
    return false;
  }
  isRemovableWire() {
    return false;
  }
  getXmlDumpType() {
    return "bli";
  }
  getInfo(arr) {
    arr[0] = "bus input (" + this.busWidth + ")";
    arr[1] = "value = " + this.value;
    arr[2] = "hex = 0x" + this.value.toString(16).toUpperCase();
  }
  getShortcut() {
    return 0;
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Bus Width", this.busWidth, 2, 32).setDimensionless();
    if (n === 1)
      return new EditInfo("Value", this.value).setDimensionless();
    if (n === 2)
      return new EditInfo("High Voltage", this.hiV).setUnitStep();
    if (n === 3)
      return new EditInfo("Low Voltage", this.loV).setUnitStep();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 2) {
        this.busWidth = Math.floor(ei.value);
        this.allocNodes();
      } else
        ei.setError("must be >= 2");
    }
    if (n === 1)
      this.value = Math.floor(ei.value);
    if (n === 2)
      this.hiV = ei.value;
    if (n === 3)
      this.loV = ei.value;
  }
}

class BusSplitterElm extends ChipElm {
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
    }
  }
  getChipName() {
    return "Bus Splitter";
  }
  needsBits() {
    return true;
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = this.bits;
    this.currents = new Array(this.bits).fill(0);
    this.pins = new Array(this.getPostCount());
    for (let i = 0; i !== this.bits; i++) {
      this.pins[i] = new Pin(this, 0, ChipElm.SIDE_W, "Bus");
      this.pins[i].busWidth = this.bits;
      this.pins[i].busZ = i;
    }
    for (let i = 0; i !== this.bits; i++) {
      this.pins[i + this.bits] = new Pin(this, this.bits - 1 - i, ChipElm.SIDE_E, "" + i);
    }
  }
  currents = [];
  getPostCount() {
    return this.bits * 2;
  }
  getBusWidth() {
    return this.bits;
  }
  getVoltageSourceCount() {
    return 0;
  }
  getConnection(n1, n2) {
    return Math.abs(n1 - n2) === this.bits;
  }
  isBusSplitterElm() {
    return true;
  }
  isWireEquivalent() {
    return true;
  }
  isRemovableWire() {
    return true;
  }
  getConnectedPost(n) {
    return this.getPost((n ?? 0) + this.bits);
  }
  getCurrentIntoNode(n) {
    if (n < this.bits)
      return -this.currents[n];
    return this.currents[n - this.bits];
  }
  setWireCurrent(bit, c) {
    this.currents[bit] = c;
    this.pins[bit + this.bits].current = c;
    let total = 0;
    for (let i = 0; i < this.bits; i++)
      total += this.currents[i];
    this.pins[0].current = -total;
  }
  getDumpType() {
    return 433;
  }
  getXmlDumpType() {
    return "bs";
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 2) {
        this.bits = Math.floor(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be >= 2");
    }
  }
}

class BusTransceiverElm extends ChipElm {
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f, st);
    if (st === void 0) {
      this.dataBits = 4;
      this.setupPins();
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "db", this.dataBits);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.dataBits = xml.parseIntAttr("db", this.dataBits);
    this.setupPins();
  }
  nonLinear() {
    return true;
  }
  allowBus() {
    return true;
  }
  getChipName() {
    return "Bus Transceiver";
  }
  defaultBitCount() {
    return 4;
  }
  setupPins() {
    if (!this.dataBits) this.dataBits = 4;
    this.sizeX = 2;
    const dataY = this.useBus() ? 1 : this.dataBits;
    this.sizeY = dataY + 2;
    this.bits = this.dataBits;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "OE");
    this.pins[0].lineOver = true;
    this.pins[1] = new Pin(this, 0, ChipElm.SIDE_E, "DIR");
    this.aNodes = 2;
    this.bNodes = 2 + this.dataBits;
    this.intNodes = 2 + 2 * this.dataBits;
    this.makeBitPins(this.dataBits, this.sizeY - dataY, ChipElm.SIDE_W, this.aNodes, "A", false, false, true);
    this.makeBitPins(this.dataBits, this.sizeY - dataY, ChipElm.SIDE_E, this.bNodes, "B", false, false, true);
    this.allocNodes();
  }
  getPostCount() {
    return 2 + 2 * this.dataBits;
  }
  getVoltageSourceCount() {
    return this.dataBits;
  }
  getInternalNodeCount() {
    return this.dataBits;
  }
  setVoltageSource(j, vs) {
    if (!this.vSources || this.vSources.length !== this.dataBits)
      this.vSources = new Array(this.dataBits);
    this.vSources[j] = vs;
    vs.setNodes(CircuitNode.ground, this.nodes[this.intNodes + j]);
  }
  getMatrixConnection(n1, n2) {
    for (let i = 0; i < this.dataBits; i++) {
      if (this.comparePair(n1, n2, this.intNodes + i, this.aNodes + i)) return true;
      if (this.comparePair(n1, n2, this.intNodes + i, this.bNodes + i)) return true;
    }
    return false;
  }
  stamp() {
    for (let i = 0; i < this.dataBits; i++) {
      CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[this.intNodes + i], this.vSources[i]);
      CircuitElm.sim.stampNonLinear(this.nodes[this.intNodes + i]);
      CircuitElm.sim.stampNonLinear(this.nodes[this.aNodes + i]);
      CircuitElm.sim.stampNonLinear(this.nodes[this.bNodes + i]);
    }
  }
  doStep() {
    const outputEnabled = this.nodes[0].v < this.getThreshold();
    const dirAtoB = this.nodes[1].v > this.getThreshold();
    for (let i = 0; i < this.dataBits; i++) {
      const srcVal = dirAtoB ? this.nodes[this.aNodes + i].v > this.getThreshold() : this.nodes[this.bNodes + i].v > this.getThreshold();
      CircuitElm.sim.updateVoltageSource(
        CircuitNode.ground,
        this.nodes[this.intNodes + i],
        this.vSources[i],
        srcVal ? this.highVoltage : 0
      );
      const rDst = outputEnabled ? 1 : 1e10;
      if (dirAtoB) {
        CircuitElm.sim.stampResistor(this.nodes[this.intNodes + i], this.nodes[this.aNodes + i], 1e8);
        CircuitElm.sim.stampResistor(this.nodes[this.intNodes + i], this.nodes[this.bNodes + i], rDst);
      } else {
        CircuitElm.sim.stampResistor(this.nodes[this.intNodes + i], this.nodes[this.aNodes + i], rDst);
        CircuitElm.sim.stampResistor(this.nodes[this.intNodes + i], this.nodes[this.bNodes + i], 1e8);
      }
    }
  }
  getInfo(arr) {
    arr[0] = "bus transceiver";
    const outputEnabled = this.nodes[0].v < this.getThreshold();
    const dirAtoB = this.nodes[1].v > this.getThreshold();
    arr[1] = outputEnabled ? dirAtoB ? "A→B" : "B→A" : "hi-Z";
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Bits", this.dataBits, 1, 1).setDimensionless();
    return super.getChipEditInfo(n);
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 1 && ei.value <= 16) {
        this.dataBits = Math.trunc(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be between 1 and 16");
    }
  }
}

class CC2Elm extends ChipElm {
  gain;
  constructor(xa, ya, xbOrG, yb, f, st) {
    if (st !== void 0) {
      super(xa, ya, xbOrG, yb, f, st);
      this.gain = parseFloatStrict(st.nextToken());
    } else {
      super(xa, ya);
      this.gain = xbOrG !== void 0 ? xbOrG : 1;
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ga", this.gain);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.gain = xml.parseDoubleAttr("ga", this.gain);
  }
  getChipName() {
    return "CC2";
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = 3;
    this.pins = new Array(3);
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "X");
    this.pins[0].output = true;
    this.pins[1] = new Pin(this, 2, ChipElm.SIDE_W, "Y");
    this.pins[2] = new Pin(this, 1, ChipElm.SIDE_E, "Z");
  }
  getElmType() {
    return "CCII";
  }
  getInfo(arr) {
    arr[0] = this.gain === 1 ? "CCII+~" : "CCII-~";
    arr[1] = "X,Y = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[2] = "Z = " + CircuitElm.getVoltageText(this.nodes[2].v);
    arr[3] = "I = " + CircuitElm.getCurrentText(this.pins[0].current);
  }
  isDigitalChip() {
    return false;
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[0], this.pins[0].voltSource);
    CircuitElm.sim.stampVCVS(CircuitNode.ground, this.nodes[1], 1, this.pins[0].voltSource);
    CircuitElm.sim.stampCCCS(CircuitNode.ground, this.nodes[2], this.pins[0].voltSource, this.gain);
  }
  calculateCurrent() {
    super.calculateCurrent();
    this.pins[2].current = this.pins[0].current * this.gain;
  }
  draw(g) {
    this.drawChip(g);
  }
  getPostCount() {
    return 3;
  }
  getVoltageSourceCount() {
    return 1;
  }
  getDumpType() {
    return 179;
  }
  getMatrixConnection(n1, n2) {
    return true;
  }
}

class CC2NegElm extends CC2Elm {
  constructor(xx, yy) {
    super(xx, yy, -1);
  }
  getDumpClass() {
    return CC2Elm;
  }
}

class ExprNodeRef {
  name;
  current;
  // true for i(name), false for v(name)
  constructor(name, current) {
    this.name = name;
    this.current = current;
  }
}
class ExprState {
  values;
  lastValues;
  // values of the quantities referenced by v(name)/i(name), one slot per reference, in
  // the order ExprParser.getNodeRefs() returned them.  sized by the element after parsing.
  nodeValues = [];
  // the same quantities one timestep ago, for dvdt()/didt()
  lastNodeValues = [];
  lastOutput = 0;
  t = 0;
  constructor(_xx) {
    this.values = new Array(9).fill(0);
    this.lastValues = new Array(9).fill(0);
    this.values[4] = Math.E;
  }
  updateLastValues(lastOut) {
    this.lastOutput = lastOut;
    for (let i = 0; i !== this.values.length; i++)
      this.lastValues[i] = this.values[i];
    for (let i = 0; i !== this.nodeValues.length; i++)
      this.lastNodeValues[i] = this.nodeValues[i];
  }
  reset() {
    for (let i = 0; i !== this.values.length; i++)
      this.lastValues[i] = 0;
    for (let i = 0; i !== this.lastNodeValues.length; i++)
      this.lastNodeValues[i] = 0;
    this.lastOutput = 0;
  }
}
class Expr {
  children = null;
  value = 0;
  type;
  // for E_NODEV, the referenced name (value holds its index into ExprState.nodeValues)
  name = "";
  static E_ADD = 1;
  static E_SUB = 2;
  static E_T = 3;
  // v(name)/i(name): a quantity referenced by name.  must be below E_A, since eval()'s
  // default branch resolves anything >= E_A by range subtraction.
  static E_NODEV = 4;
  // dvdt(name)/didt(name): rate of change of the same quantity.  shares the reference
  // slot with E_NODEV, since the slot holds the raw quantity either way.
  static E_NODEDVDT = 5;
  static E_VAL = 6;
  static E_MUL = 7;
  static E_DIV = 8;
  static E_POW = 9;
  static E_UMINUS = 10;
  static E_SIN = 11;
  static E_COS = 12;
  static E_ABS = 13;
  static E_EXP = 14;
  static E_LOG = 15;
  static E_SQRT = 16;
  static E_TAN = 17;
  static E_R = 18;
  static E_MAX = 19;
  static E_MIN = 20;
  static E_CLAMP = 21;
  static E_PWL = 22;
  static E_TRIANGLE = 23;
  static E_SAWTOOTH = 24;
  static E_MOD = 25;
  static E_STEP = 26;
  static E_SELECT = 27;
  static E_PWR = 28;
  static E_PWRS = 29;
  static E_LASTOUTPUT = 30;
  static E_TIMESTEP = 31;
  static E_TERNARY = 32;
  static E_OR = 33;
  static E_AND = 34;
  static E_EQUALS = 35;
  static E_LEQ = 36;
  static E_GEQ = 37;
  static E_LESS = 38;
  static E_GREATER = 39;
  static E_NEQ = 40;
  static E_NOT = 41;
  static E_FLOOR = 42;
  static E_CEIL = 43;
  static E_ASIN = 44;
  static E_ACOS = 45;
  static E_ATAN = 46;
  static E_SINH = 47;
  static E_COSH = 48;
  static E_TANH = 49;
  static E_BITAND = 50;
  static E_BITOR = 51;
  static E_RSHIFT = 52;
  static E_A = 53;
  static E_DADT = 53 + 10;
  // E_A + 10
  static E_LASTA = 53 + 20;
  // E_DADT + 10
  constructor(e1OrV, e2OrVv, v) {
    if (typeof e1OrV === "number" && e2OrVv === void 0) {
      this.type = e1OrV;
    } else if (typeof e1OrV === "number" && typeof e2OrVv === "number") {
      this.type = e1OrV;
      this.value = e2OrVv;
    } else {
      this.type = v;
      this.children = [e1OrV];
      if (e2OrVv != null)
        this.children.push(e2OrVv);
    }
  }
  eval(es) {
    let left = null;
    let right = null;
    if (this.children != null && this.children.length > 0) {
      left = this.children[0];
      if (this.children.length >= 2)
        right = this.children[this.children.length - 1];
    }
    switch (this.type) {
      case Expr.E_ADD:
        return left.eval(es) + right.eval(es);
      case Expr.E_SUB:
        return left.eval(es) - right.eval(es);
      case Expr.E_MUL:
        return left.eval(es) * right.eval(es);
      case Expr.E_DIV:
        return left.eval(es) / right.eval(es);
      case Expr.E_POW:
        return Math.pow(left.eval(es), right.eval(es));
      case Expr.E_OR:
        return left.eval(es) !== 0 || right.eval(es) !== 0 ? 1 : 0;
      case Expr.E_AND:
        return left.eval(es) !== 0 && right.eval(es) !== 0 ? 1 : 0;
      case Expr.E_EQUALS:
        return left.eval(es) === right.eval(es) ? 1 : 0;
      case Expr.E_NEQ:
        return left.eval(es) !== right.eval(es) ? 1 : 0;
      case Expr.E_LEQ:
        return left.eval(es) <= right.eval(es) ? 1 : 0;
      case Expr.E_GEQ:
        return left.eval(es) >= right.eval(es) ? 1 : 0;
      case Expr.E_LESS:
        return left.eval(es) < right.eval(es) ? 1 : 0;
      case Expr.E_GREATER:
        return left.eval(es) > right.eval(es) ? 1 : 0;
      case Expr.E_TERNARY:
        return this.children[left.eval(es) !== 0 ? 1 : 2].eval(es);
      case Expr.E_UMINUS:
        return -left.eval(es);
      case Expr.E_NOT:
        return left.eval(es) === 0 ? 1 : 0;
      case Expr.E_VAL:
        return this.value;
      case Expr.E_T:
        return es.t;
      case Expr.E_NODEV:
        return es.nodeValues[this.value];
      case Expr.E_NODEDVDT:
        return (es.nodeValues[this.value] - es.lastNodeValues[this.value]) / SimulationManager.theSim.timeStep;
      case Expr.E_SIN:
        return Math.sin(left.eval(es));
      case Expr.E_COS:
        return Math.cos(left.eval(es));
      case Expr.E_ABS:
        return Math.abs(left.eval(es));
      case Expr.E_EXP:
        return Math.exp(left.eval(es));
      case Expr.E_LOG:
        return Math.log(left.eval(es));
      case Expr.E_SQRT:
        return Math.sqrt(left.eval(es));
      case Expr.E_TAN:
        return Math.tan(left.eval(es));
      case Expr.E_ASIN:
        return Math.asin(left.eval(es));
      case Expr.E_ACOS:
        return Math.acos(left.eval(es));
      case Expr.E_ATAN:
        return Math.atan(left.eval(es));
      case Expr.E_SINH:
        return Math.sinh(left.eval(es));
      case Expr.E_COSH:
        return Math.cosh(left.eval(es));
      case Expr.E_TANH:
        return Math.tanh(left.eval(es));
      case Expr.E_BITAND:
        return (left.eval(es) | 0) & (right.eval(es) | 0);
      case Expr.E_BITOR:
        return left.eval(es) | 0 | (right.eval(es) | 0);
      case Expr.E_RSHIFT:
        return (left.eval(es) | 0) >> (right.eval(es) | 0);
      case Expr.E_FLOOR:
        return Math.floor(left.eval(es));
      case Expr.E_CEIL:
        return Math.ceil(left.eval(es));
      case Expr.E_MIN: {
        let x = left.eval(es);
        for (let i = 1; i < this.children.length; i++)
          x = Math.min(x, this.children[i].eval(es));
        return x;
      }
      case Expr.E_MAX: {
        let x = left.eval(es);
        for (let i = 1; i < this.children.length; i++)
          x = Math.max(x, this.children[i].eval(es));
        return x;
      }
      case Expr.E_CLAMP:
        return Math.min(Math.max(left.eval(es), this.children[1].eval(es)), this.children[2].eval(es));
      case Expr.E_STEP: {
        const x = left.eval(es);
        if (right == null)
          return x < 0 ? 0 : 1;
        return x > right.eval(es) ? 0 : x < 0 ? 0 : 1;
      }
      case Expr.E_SELECT: {
        const x = left.eval(es);
        return this.children[x > 0 ? 2 : 1].eval(es);
      }
      case Expr.E_TRIANGLE: {
        const x = this.posmod(left.eval(es), Math.PI * 2) / Math.PI;
        return x < 1 ? -1 + x * 2 : 3 - x * 2;
      }
      case Expr.E_SAWTOOTH: {
        const x = this.posmod(left.eval(es), Math.PI * 2) / Math.PI;
        return x - 1;
      }
      case Expr.E_MOD:
        return left.eval(es) % right.eval(es);
      case Expr.E_PWL:
        return this.pwl(es, this.children);
      case Expr.E_PWR:
        return Math.pow(Math.abs(left.eval(es)), right.eval(es));
      case Expr.E_PWRS: {
        const x = left.eval(es);
        if (x < 0)
          return -Math.pow(-x, right.eval(es));
        return Math.pow(x, right.eval(es));
      }
      case Expr.E_LASTOUTPUT:
        return es.lastOutput;
      case Expr.E_TIMESTEP:
        return SimulationManager.theSim.timeStep;
      default:
        if (this.type >= Expr.E_LASTA)
          return es.lastValues[this.type - Expr.E_LASTA];
        if (this.type >= Expr.E_DADT)
          return (es.values[this.type - Expr.E_DADT] - es.lastValues[this.type - Expr.E_DADT]) / SimulationManager.theSim.timeStep;
        if (this.type >= Expr.E_A)
          return es.values[this.type - Expr.E_A];
        console.error("unknown Expr type");
    }
    return 0;
  }
  pwl(es, args) {
    const x = args[0].eval(es);
    let x0 = args[1].eval(es);
    let y0 = args[2].eval(es);
    if (x < x0)
      return y0;
    let x1 = args[3].eval(es);
    let y1 = args[4].eval(es);
    let i = 5;
    while (true) {
      if (x < x1)
        return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
      if (i + 1 >= args.length)
        break;
      x0 = x1;
      y0 = y1;
      x1 = args[i].eval(es);
      y1 = args[i + 1].eval(es);
      i += 2;
    }
    return y1;
  }
  posmod(x, y) {
    x %= y;
    return x >= 0 ? x : x + y;
  }
}
class ExprParser {
  text;
  // original text with case preserved.  node labels are case-sensitive, so v(name)
  // arguments are scanned out of this rather than out of the lowercased text.
  origText;
  token = "";
  pos = 0;
  tlen;
  err = null;
  nodeRefs = [];
  constructor(s) {
    this.origText = s;
    this.text = s.toLowerCase();
    this.tlen = this.text.length;
    this.getToken();
  }
  // quantities referenced by v()/i() in this expression, in slot order
  getNodeRefs() {
    return this.nodeRefs;
  }
  getToken() {
    while (this.pos < this.tlen && this.text.charAt(this.pos) === " ")
      this.pos++;
    if (this.pos === this.tlen) {
      this.token = "";
      return;
    }
    let i = this.pos;
    const c = this.text.charCodeAt(i);
    if (c >= 48 && c <= 57 || this.text.charAt(i) === ".") {
      for (i = this.pos; i !== this.tlen; i++) {
        if (this.text.charAt(i) === "e" || this.text.charAt(i) === "E") {
          i++;
          if (i < this.tlen && (this.text.charAt(i) === "+" || this.text.charAt(i) === "-"))
            i++;
        }
        const ch = this.text.charCodeAt(i);
        if (!(ch >= 48 && ch <= 57 || this.text.charAt(i) === "."))
          break;
      }
    } else if (c >= 97 && c <= 122) {
      for (i = this.pos; i !== this.tlen; i++) {
        const ch = this.text.charCodeAt(i);
        if (!(ch >= 97 && ch <= 122))
          break;
      }
    } else {
      i++;
      if (i < this.tlen) {
        const ch = this.text.charAt(i);
        const cc = this.text.charAt(i - 1);
        if (ch === cc && (cc === "|" || cc === "&" || cc === "<" || cc === ">" || cc === "="))
          i++;
        else if ((cc === "<" || cc === ">" || cc === "!") && ch === "=")
          i++;
      }
    }
    this.token = this.text.substring(this.pos, i);
    this.pos = i;
  }
  skip(s) {
    if (this.token !== s)
      return false;
    this.getToken();
    return true;
  }
  setError(s) {
    if (this.err == null)
      this.err = s;
  }
  skipOrError(s) {
    if (!this.skip(s))
      this.setError("expected " + s + ", got " + this.token);
  }
  parseExpression() {
    if (this.token.length === 0)
      return new Expr(Expr.E_VAL, 0);
    const e = this.parse();
    if (this.token.length > 0)
      this.setError("unexpected token: " + this.token);
    return e;
  }
  parse() {
    const e = this.parseOr();
    if (this.skip("?")) {
      const e2 = this.parseOr();
      this.skipOrError(":");
      const e3 = this.parse();
      const ret = new Expr(e, e2, Expr.E_TERNARY);
      ret.children.push(e3);
      return ret;
    }
    return e;
  }
  parseOr() {
    let e = this.parseAnd();
    while (this.skip("||"))
      e = new Expr(e, this.parseAnd(), Expr.E_OR);
    return e;
  }
  parseAnd() {
    let e = this.parseBitOr();
    while (this.skip("&&"))
      e = new Expr(e, this.parseBitOr(), Expr.E_AND);
    return e;
  }
  parseBitOr() {
    let e = this.parseBitAnd();
    while (this.skip("|"))
      e = new Expr(e, this.parseBitAnd(), Expr.E_BITOR);
    return e;
  }
  parseBitAnd() {
    let e = this.parseEquals();
    while (this.skip("&"))
      e = new Expr(e, this.parseEquals(), Expr.E_BITAND);
    return e;
  }
  parseEquals() {
    const e = this.parseCompare();
    if (this.skip("=="))
      return new Expr(e, this.parseCompare(), Expr.E_EQUALS);
    return e;
  }
  parseCompare() {
    const e = this.parseShift();
    if (this.skip("<=")) return new Expr(e, this.parseShift(), Expr.E_LEQ);
    if (this.skip(">=")) return new Expr(e, this.parseShift(), Expr.E_GEQ);
    if (this.skip("!=")) return new Expr(e, this.parseShift(), Expr.E_NEQ);
    if (this.skip("<")) return new Expr(e, this.parseShift(), Expr.E_LESS);
    if (this.skip(">")) return new Expr(e, this.parseShift(), Expr.E_GREATER);
    return e;
  }
  parseShift() {
    let e = this.parseAdd();
    while (this.skip(">>"))
      e = new Expr(e, this.parseAdd(), Expr.E_RSHIFT);
    return e;
  }
  parseAdd() {
    let e = this.parseMult();
    while (true) {
      if (this.skip("+"))
        e = new Expr(e, this.parseMult(), Expr.E_ADD);
      else if (this.skip("-"))
        e = new Expr(e, this.parseMult(), Expr.E_SUB);
      else
        break;
    }
    return e;
  }
  parseMult() {
    let e = this.parseUminus();
    while (true) {
      if (this.skip("*"))
        e = new Expr(e, this.parseUminus(), Expr.E_MUL);
      else if (this.skip("/"))
        e = new Expr(e, this.parseUminus(), Expr.E_DIV);
      else
        break;
    }
    return e;
  }
  parseUminus() {
    this.skip("+");
    if (this.skip("!"))
      return new Expr(this.parseUminus(), null, Expr.E_NOT);
    if (this.skip("-"))
      return new Expr(this.parseUminus(), null, Expr.E_UMINUS);
    return this.parsePow();
  }
  parsePow() {
    let e = this.parseTerm();
    while (this.skip("^"))
      e = new Expr(e, this.parseTerm(), Expr.E_POW);
    return e;
  }
  parseFunc(t) {
    this.skipOrError("(");
    const e = this.parse();
    this.skipOrError(")");
    return new Expr(e, null, t);
  }
  parseFuncMulti(t, minArgs, maxArgs) {
    let args = 1;
    this.skipOrError("(");
    const e1 = this.parse();
    const e = new Expr(e1, null, t);
    while (this.skip(",")) {
      e.children.push(this.parse());
      args++;
    }
    this.skipOrError(")");
    if (args < minArgs || args > maxArgs)
      this.setError("bad number of function args: " + args);
    return e;
  }
  // is the next non-space character of the raw text an open paren?  used to tell the
  // input letter "i" apart from the function "i(".
  nextCharIsOpenParen() {
    let i = this.pos;
    while (i < this.tlen && this.origText.charAt(i) === " ")
      i++;
    return i < this.tlen && this.origText.charAt(i) === "(";
  }
  // parse v(name), v(name1,name2) or i(name).  called just after the function letter was
  // skipped, so token is "(" and pos points at the first character after the "(".
  parseNodeRefFunc(current, deriv = false) {
    const fn = (deriv ? "d" : "") + (current ? "i" : "v") + (deriv ? "dt" : "");
    if (this.token !== "(") {
      this.setError("expected ( after " + fn + ", got " + this.token);
      return new Expr(Expr.E_VAL, 0);
    }
    let e = this.makeNodeRef(this.scanNodeName(), current, deriv);
    if (this.pos < this.tlen && this.origText.charAt(this.pos) === ",") {
      this.pos++;
      const e2 = this.makeNodeRef(this.scanNodeName(), current, deriv);
      if (current)
        this.setError(fn + "() takes one name");
      else
        e = new Expr(e, e2, Expr.E_SUB);
    }
    if (this.pos < this.tlen && this.origText.charAt(this.pos) === ")")
      this.pos++;
    else
      this.setError("expected ) in " + fn + "()");
    this.getToken();
    return e;
  }
  // scan a node name out of the raw text, stopping at ',' or ')'.  a double-quoted
  // name may contain those characters.
  scanNodeName() {
    while (this.pos < this.tlen && this.origText.charAt(this.pos) === " ")
      this.pos++;
    let s;
    if (this.pos < this.tlen && this.origText.charAt(this.pos) === '"') {
      this.pos++;
      const start = this.pos;
      while (this.pos < this.tlen && this.origText.charAt(this.pos) !== '"')
        this.pos++;
      s = this.origText.substring(start, this.pos);
      if (this.pos < this.tlen)
        this.pos++;
      while (this.pos < this.tlen && this.origText.charAt(this.pos) === " ")
        this.pos++;
    } else {
      const start = this.pos;
      while (this.pos < this.tlen) {
        const c = this.origText.charAt(this.pos);
        if (c === "," || c === ")")
          break;
        this.pos++;
      }
      s = this.origText.substring(start, this.pos).trim();
    }
    if (s.length === 0)
      this.setError("missing name in a v()/i() reference");
    return s;
  }
  // get an E_NODEV node for the given reference, allocating a slot for it if we haven't
  // seen it before (so repeated references to the same thing share one slot)
  // deriv picks E_NODEDVDT over E_NODEV; both read the same slot, which holds the raw
  // quantity, so v(x) and dvdt(x) share one reference and one pair of nodes
  makeNodeRef(name, current, deriv) {
    let ix = -1;
    for (let i = 0; i !== this.nodeRefs.length; i++)
      if (this.nodeRefs[i].name === name && this.nodeRefs[i].current === current)
        ix = i;
    if (ix < 0) {
      ix = this.nodeRefs.length;
      this.nodeRefs.push(new ExprNodeRef(name, current));
    }
    const e = new Expr(deriv ? Expr.E_NODEDVDT : Expr.E_NODEV, ix);
    e.name = name;
    return e;
  }
  parseTerm() {
    if (this.skip("(")) {
      const e = this.parse();
      this.skipOrError(")");
      return e;
    }
    if (this.skip("t"))
      return new Expr(Expr.E_T);
    if (this.token === "i" && this.nextCharIsOpenParen()) {
      this.getToken();
      return this.parseNodeRefFunc(true, false);
    }
    if (this.token.length === 1) {
      const c = this.token.charCodeAt(0);
      if (c >= 97 && c <= 105) {
        this.getToken();
        return new Expr(Expr.E_A + (c - 97));
      }
    }
    if (this.token.startsWith("last") && this.token.length === 5) {
      const c = this.token.charCodeAt(4);
      if (c >= 97 && c <= 105) {
        this.getToken();
        return new Expr(Expr.E_LASTA + (c - 97));
      }
    }
    if ((this.token === "dvdt" || this.token === "didt") && this.nextCharIsOpenParen()) {
      const current = this.token === "didt";
      this.getToken();
      return this.parseNodeRefFunc(current, true);
    }
    if (this.token.endsWith("dt") && this.token.startsWith("d") && this.token.length === 4) {
      const c = this.token.charCodeAt(1);
      if (c >= 97 && c <= 105) {
        this.getToken();
        return new Expr(Expr.E_DADT + (c - 97));
      }
    }
    if (this.skip("lastoutput")) return new Expr(Expr.E_LASTOUTPUT);
    if (this.skip("timestep")) return new Expr(Expr.E_TIMESTEP);
    if (this.skip("pi")) return new Expr(Expr.E_VAL, 3.141592653589793);
    if (this.skip("v")) return this.parseNodeRefFunc(false, false);
    if (this.skip("sin")) return this.parseFunc(Expr.E_SIN);
    if (this.skip("cos")) return this.parseFunc(Expr.E_COS);
    if (this.skip("asin")) return this.parseFunc(Expr.E_ASIN);
    if (this.skip("acos")) return this.parseFunc(Expr.E_ACOS);
    if (this.skip("atan")) return this.parseFunc(Expr.E_ATAN);
    if (this.skip("sinh")) return this.parseFunc(Expr.E_SINH);
    if (this.skip("cosh")) return this.parseFunc(Expr.E_COSH);
    if (this.skip("tanh")) return this.parseFunc(Expr.E_TANH);
    if (this.skip("abs")) return this.parseFunc(Expr.E_ABS);
    if (this.skip("exp")) return this.parseFunc(Expr.E_EXP);
    if (this.skip("log")) return this.parseFunc(Expr.E_LOG);
    if (this.skip("sqrt")) return this.parseFunc(Expr.E_SQRT);
    if (this.skip("tan")) return this.parseFunc(Expr.E_TAN);
    if (this.skip("tri")) return this.parseFunc(Expr.E_TRIANGLE);
    if (this.skip("saw")) return this.parseFunc(Expr.E_SAWTOOTH);
    if (this.skip("floor")) return this.parseFunc(Expr.E_FLOOR);
    if (this.skip("ceil")) return this.parseFunc(Expr.E_CEIL);
    if (this.skip("min")) return this.parseFuncMulti(Expr.E_MIN, 2, 1e3);
    if (this.skip("max")) return this.parseFuncMulti(Expr.E_MAX, 2, 1e3);
    if (this.skip("pwl")) return this.parseFuncMulti(Expr.E_PWL, 2, 1e3);
    if (this.skip("mod")) return this.parseFuncMulti(Expr.E_MOD, 2, 2);
    if (this.skip("step")) return this.parseFuncMulti(Expr.E_STEP, 1, 2);
    if (this.skip("select")) return this.parseFuncMulti(Expr.E_SELECT, 3, 3);
    if (this.skip("clamp")) return this.parseFuncMulti(Expr.E_CLAMP, 3, 3);
    if (this.skip("pwr")) return this.parseFuncMulti(Expr.E_PWR, 2, 2);
    if (this.skip("pwrs")) return this.parseFuncMulti(Expr.E_PWRS, 2, 2);
    try {
      const v = parseFloatStrict(this.token);
      if (isNaN(v)) throw new Error("NaN");
      this.getToken();
      return new Expr(Expr.E_VAL, v);
    } catch (_e) {
      if (this.token.length === 0)
        this.setError("unexpected end of input");
      else
        this.setError("unrecognized token: " + this.token);
      return new Expr(Expr.E_VAL, 0);
    }
  }
  gotError() {
    return this.err;
  }
}

class ExprEngine {
  owner;
  // how many expression inputs come from the owner's pins, ahead of the references
  pinInputCount = 0;
  exprString = "";
  expr = null;
  state = new ExprState(0);
  refs = [];
  // what each reference resolved to: the meter element for a v()/i() on a named meter,
  // null for a labeled node (whose node we hold directly) or an unresolved name
  refElms = [];
  // previous value of each expression input, used for the numeric derivative
  lastInputs = [];
  // value of the expression at the last evalAndStamp()
  value = 0;
  // roll the current values into the previous-timestep slots that lasta..lasti,
  // lastoutput and dvdt()/didt() read.  called once per timestep, from stepFinished().
  stepFinished(output) {
    this.state.updateLastValues(output);
  }
  constructor(owner) {
    this.owner = owner;
  }
  // parse a new expression, returning a parse error message or null.  the caller must
  // call alloc() afterwards, and the circuit must be re-analyzed: the reference count
  // may have changed, and with it the owner's node count.
  parse(exprString) {
    this.exprString = exprString;
    const parser = new ExprParser(exprString);
    this.expr = parser.parseExpression();
    this.refs = parser.getNodeRefs();
    return parser.gotError();
  }
  getRefCount() {
    return this.refs.length;
  }
  // two nodes per reference: the positive and negative end of the referenced quantity
  getRefNodeCount() {
    return 2 * this.refs.length;
  }
  // index in the owner's nodes[] of the positive node of reference k
  refNodeIndex(k) {
    return this.owner.getRefNodeBase() + 2 * k;
  }
  // size the arrays that depend on the input count.  call after parse(), and whenever
  // the owner's pin input count changes.
  alloc(pinInputCount) {
    this.pinInputCount = pinInputCount;
    this.state.nodeValues = new Array(this.getRefCount()).fill(0);
    this.state.lastNodeValues = new Array(this.getRefCount()).fill(0);
    this.lastInputs = new Array(this.getInputCount()).fill(0);
    this.refElms = new Array(this.getRefCount()).fill(null);
  }
  reset() {
    this.state.reset();
    this.lastInputs.fill(0);
  }
  resolveRefs(elmList) {
    this.refElms = new Array(this.getRefCount()).fill(null);
    for (let k = 0; k !== this.getRefCount(); k++) {
      const ref = this.refs[k];
      const ix = this.refNodeIndex(k);
      this.owner.setNode(ix, CircuitNode.ground);
      this.owner.setNode(ix + 1, CircuitNode.ground);
      if (!ref.current) {
        const cn = HookRegistry.getLabeledNode?.(ref.name);
        if (cn != null) {
          this.owner.setNode(ix, cn);
          continue;
        }
      }
      let elm = null;
      for (let j = 0; j !== elmList.length; j++)
        if (elmList[j].getExprRefName() === ref.name) {
          elm = elmList[j];
          break;
        }
      if (elm == null || elm.getPostCount() < 2)
        continue;
      this.refElms[k] = elm;
      this.owner.setNode(ix, elm.getNode(0));
      this.owner.setNode(ix + 1, elm.getNode(1));
    }
  }
  // Inside a subcircuit a reference arrives as node numbers rather than a name, because
  // the name was resolved when the model was built (see GetCircuitAsSubcircuit's "rn").
  // That's enough for v(), but i() also needs the element itself, for its current and
  // its voltage source row -- so find the sibling whose voltage source spans the two
  // nodes we recorded.  This is how CCCSElm/CCVSElm already locate their sense elements.
  // Only fills gaps: a name resolved at the top level keeps the element it found.
  resolveRefElmsByNode(elmList) {
    for (let k = 0; k !== this.getRefCount(); k++) {
      if (!this.refs[k].current || this.refElms[k] != null)
        continue;
      const ix = this.refNodeIndex(k);
      const n0 = this.owner.nodes[ix];
      const n1 = this.owner.nodes[ix + 1];
      if (n0 === n1)
        continue;
      for (let j = 0; j !== elmList.length; j++) {
        const ce = elmList[j];
        if (ce === this.owner || ce.voltSource == null || ce.getPostCount() < 2)
          continue;
        if (ce.getNode(0) === n0 && ce.getNode(1) === n1 || ce.getNode(0) === n1 && ce.getNode(1) === n0) {
          this.refElms[k] = ce;
          break;
        }
      }
    }
  }
  // total number of expression inputs we take a derivative against
  getInputCount() {
    return this.pinInputCount + this.refs.length;
  }
  getInputValue(i) {
    if (i < this.pinInputCount)
      return this.owner.nodes[i].v;
    const k = i - this.pinInputCount;
    const elm = this.refElms[k];
    if (this.refs[k].current)
      return elm == null ? 0 : elm.getCurrent();
    const ix = this.refNodeIndex(k);
    return this.owner.nodes[ix].v - this.owner.nodes[ix + 1].v;
  }
  setInputValue(i, v) {
    if (i < this.pinInputCount)
      this.state.values[i] = v;
    else
      this.state.nodeValues[i - this.pinInputCount] = v;
  }
  // the node pair input i is a voltage across.  ground/ground for a current reference,
  // which stamps against a voltage source row instead.
  getInputNodePos(i) {
    if (i < this.pinInputCount)
      return this.owner.nodes[i];
    const k = i - this.pinInputCount;
    return this.refs[k].current ? CircuitNode.ground : this.owner.nodes[this.refNodeIndex(k)];
  }
  getInputNodeNeg(i) {
    if (i < this.pinInputCount)
      return CircuitNode.ground;
    const k = i - this.pinInputCount;
    return this.refs[k].current ? CircuitNode.ground : this.owner.nodes[this.refNodeIndex(k) + 1];
  }
  // the voltage source input i is the current through, or null if it's a voltage
  getInputVS(i) {
    if (i < this.pinInputCount)
      return null;
    const k = i - this.pinInputCount;
    if (!this.refs[k].current)
      return null;
    const elm = this.refElms[k];
    return elm == null ? null : elm.voltSource;
  }
  // have all our inputs settled?  currents get a tighter window than voltages, matching
  // what CCCSElm/CCVSElm already do for their current inputs.
  checkConvergence(baseLimit) {
    for (let i = 0; i !== this.getInputCount(); i++) {
      const lim = this.getInputVS(i) != null ? baseLimit * 0.1 : baseLimit;
      if (Math.abs(this.getInputValue(i) - this.lastInputs[i]) > lim)
        return false;
    }
    return true;
  }
  saveInputs() {
    for (let i = 0; i !== this.getInputCount(); i++)
      this.lastInputs[i] = this.getInputValue(i);
  }
  // evaluate the expression and stamp the linearization of each input's contribution,
  // through the owner's stampInputDerivative*() methods.  negate is for the elements
  // whose output is the negated expression value.  leaves the value in this.value and
  // returns the right-side residual for the caller to stamp.
  evalAndStamp(negate) {
    const sgn = negate ? -1 : 1;
    const n = this.getInputCount();
    const e = this.expr;
    for (let i = 0; i !== n; i++)
      this.setInputValue(i, this.getInputValue(i));
    this.state.t = SimulationManager.theSim.t;
    const v0 = sgn * e.eval(this.state);
    this.value = v0;
    let rs = v0;
    for (let i = 0; i !== n; i++) {
      const x0 = this.getInputValue(i);
      let dv = x0 - this.lastInputs[i];
      if (Math.abs(dv) < 1e-6) dv = 1e-6;
      this.setInputValue(i, x0);
      const v = sgn * e.eval(this.state);
      this.setInputValue(i, x0 - dv);
      const v2 = sgn * e.eval(this.state);
      let dx = (v - v2) / dv;
      if (Math.abs(dx) < 1e-6)
        dx = dx > 0 ? 1e-6 : -1e-6;
      const vs = this.getInputVS(i);
      if (vs != null)
        this.owner.stampInputDerivativeVS(vs, dx);
      else
        this.owner.stampInputDerivative(this.getInputNodePos(i), this.getInputNodeNeg(i), dx);
      rs -= dx * x0;
      this.setInputValue(i, x0);
    }
    return rs;
  }
  // describe any v()/i() reference we couldn't resolve, appending to arr from index i
  // and returning the next free index
  addUnresolvedInfo(arr, i) {
    for (let k = 0; k !== this.getRefCount(); k++) {
      const ref = this.refs[k];
      const resolved = this.refElms[k] != null || !ref.current && HookRegistry.getLabeledNode?.(ref.name) != null;
      if (!resolved)
        arr[i++] = "unknown name: " + (ref.current ? "i(" : "v(") + ref.name + ")";
      else if (ref.current && this.getInputVS(k + this.pinInputCount) == null)
        arr[i++] = "not a current meter: " + ref.name;
    }
    return i;
  }
}

class VCCSElm extends ChipElm {
  gain = 0;
  inputCount;
  broken = false;
  // the expression, its v()/i() references and the numeric Jacobian all live here
  engine = new ExprEngine(this);
  get expr() {
    return this.engine.expr;
  }
  get exprState() {
    return this.engine.state;
  }
  get exprString() {
    return this.engine.exprString;
  }
  set exprString(s) {
    this.engine.exprString = s;
  }
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.inputCount = 2;
      this.exprString = ".1*(a-b)";
      this.parseExpr();
      this.setupPins();
    } else {
      super(xa, ya, xb, yb, f, st);
      this.inputCount = parseIntStrict(st.nextToken());
      this.exprString = CustomLogicModel.unescape(st.nextToken());
      this.parseExpr();
      this.setupPins();
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ic", this.inputCount);
    CircuitXMLSerializer.dumpAttr(elem, "ex", this.exprString);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.inputCount = xml.parseIntAttr("ic", this.inputCount);
    this.exprString = xml.parseStringAttr("ex", this.exprString);
    this.parseExpr();
    this.setupPins();
  }
  setupPins() {
    if (!this.inputCount)
      this.inputCount = 0;
    this.sizeX = 2;
    this.sizeY = this.inputCount > 2 ? this.inputCount : 2;
    this.pins = new Array(this.inputCount + 2);
    for (let i = 0; i !== this.inputCount; i++)
      this.pins[i] = new Pin(this, i, ChipElm.SIDE_W, String.fromCharCode(65 + i));
    this.pins[this.inputCount] = new Pin(this, 0, ChipElm.SIDE_E, "C+");
    this.pins[this.inputCount + 1] = new Pin(this, 1, ChipElm.SIDE_E, "C-");
    this.allocExprArrays();
    this.allocNodes();
  }
  // (re)size the engine's arrays for our current pin input count.  called from
  // setupPins() and parseExpr(), since either can change the input count.
  // ChipElm's constructor calls setupPins() before our field initializers have run,
  // so the engine may not exist yet; our own constructor calls parseExpr() afterwards.
  allocExprArrays() {
    if (this.engine != null)
      this.engine.alloc(this.getPinExprInputCount());
  }
  getRefNodeCount() {
    return this.engine ? this.engine.getRefNodeCount() : 0;
  }
  resolveExprRefs(elmList) {
    this.engine.resolveRefs(elmList);
  }
  setParentList(elmList) {
    super.setParentList(elmList);
    this.engine.resolveRefElmsByNode(elmList);
  }
  // number of expression inputs driven by pin voltages.  0 for the current-controlled
  // subclasses, whose pin inputs are currents they load into the state themselves.
  getPinExprInputCount() {
    return this.inputCount ? this.inputCount : 0;
  }
  getChipName() {
    return "VCCS~";
  }
  nonLinear() {
    return true;
  }
  isDigitalChip() {
    return false;
  }
  stamp() {
    const sim = SimulationManager.theSim;
    sim.stampNonLinear(this.nodes[this.inputCount]);
    sim.stampNonLinear(this.nodes[this.inputCount + 1]);
  }
  sign(a, b) {
    return a > 0 ? b : -b;
  }
  getConvergeLimit() {
    const sim = SimulationManager.theSim;
    if (sim.subIterations < 10) return 1e-3;
    if (sim.subIterations < 200) return 0.01;
    return 0.1;
  }
  hasCurrentOutput() {
    return true;
  }
  getOutputNode(n) {
    return this.nodes[n + this.inputCount];
  }
  doStep() {
    const sim = SimulationManager.theSim;
    if (this.broken) {
      this.pins[this.inputCount].current = 0;
      this.pins[this.inputCount + 1].current = 0;
      sim.stampResistor(this.nodes[this.inputCount], this.nodes[this.inputCount + 1], 1e8);
      return;
    }
    if (!this.engine.checkConvergence(this.getConvergeLimit()))
      sim.converged = false;
    if (this.expr != null) {
      const rs = this.engine.evalAndStamp(true);
      const v0 = this.engine.value;
      sim.stampCurrentSource(this.nodes[this.inputCount], this.nodes[this.inputCount + 1], rs);
      this.pins[this.inputCount].current = -v0;
      this.pins[this.inputCount + 1].current = v0;
    }
    this.engine.saveInputs();
  }
  // our output is a current source from C+ to C-
  stampInputDerivative(pos, neg, dx) {
    SimulationManager.theSim.stampVCCurrentSource(
      this.nodes[this.inputCount],
      this.nodes[this.inputCount + 1],
      pos,
      neg,
      dx
    );
  }
  stampInputDerivativeVS(vs, dx) {
    SimulationManager.theSim.stampCCCS(
      this.nodes[this.inputCount],
      this.nodes[this.inputCount + 1],
      vs,
      dx
    );
  }
  stepFinished() {
    this.exprState.updateLastValues(this.pins[this.inputCount].current);
  }
  draw(g) {
    this.drawChip(g);
  }
  getPostCount() {
    return this.inputCount + 2;
  }
  getVoltageSourceCount() {
    return 0;
  }
  getDumpType() {
    return 213;
  }
  getConnection(n1, n2) {
    return this.comparePair(this.inputCount, this.inputCount + 1, n1, n2);
  }
  getMatrixConnection(_n1, _n2) {
    return true;
  }
  hasGroundConnection(_n1) {
    return false;
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo(EditInfo.makeLink("customfunction.html", "Output Function"), 0, -1, -1);
      ei.text = this.exprString;
      ei.disallowSliders();
      return ei;
    }
    if (n === 1)
      return new EditInfo("# of Inputs", this.inputCount, 1, 8).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      this.exprString = ei.textf.value;
      this.parseExpr(ei);
      return;
    }
    if (n === 1) {
      if (ei.value < 0 || ei.value > 8) return;
      this.inputCount = Math.round(ei.value);
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    }
  }
  setExpr(exprStr) {
    this.exprString = exprStr;
    this.parseExpr();
  }
  parseExpr(ei) {
    const err = this.engine.parse(this.exprString);
    this.allocExprArrays();
    this.allocNodes();
    if (err != null && ei != null) {
      ei.setErrorFieldName("Output Function");
      ei.setError(Locale.LS("Parse error in expression") + ": " + this.exprString + ": " + err);
    }
  }
  getInfo(arr) {
    super.getInfo(arr);
    let i = 0;
    while (arr[i] != null) i++;
    arr[i] = "I = " + VCCSElm.getCurrentText(this.pins[this.inputCount].current);
    this.addRefNodeInfo(arr, i + 1);
  }
  // report any v()/i() reference we couldn't resolve
  addRefNodeInfo(arr, i) {
    this.engine.addUnresolvedInfo(arr, i);
  }
  reset() {
    super.reset();
    this.engine.reset();
  }
  validate() {
    const fpi = new FindPathInfo(FindPathInfo.INDUCT, this, this.getOutputNode(0), SimulationManager.theSim);
    if (this.hasCurrentOutput() && !fpi.findPath(this.getOutputNode(1)))
      this.broken = true;
    else
      this.broken = false;
    return true;
  }
}

class CCCSElm extends VCCSElm {
  static FLAG_SPICE = 2;
  voltageSources = [];
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.exprString = "2*a";
      this.parseExpr();
    } else {
      super(xa, ya, xb, yb, f, st);
      this.setupPins();
    }
  }
  setupPins() {
    if (!this.inputCount)
      this.inputCount = 0;
    this.sizeX = 2;
    this.sizeY = this.inputCount > 2 ? this.inputCount : 2;
    this.inputPairCount = Math.floor(this.inputCount / 2);
    this.pins = new Array(this.inputCount + 2);
    for (let i2 = 0; i2 !== this.inputPairCount; i2++) {
      this.pins[i2 * 2] = new Pin(this, i2 * 2, ChipElm.SIDE_W, String.fromCharCode(65 + i2) + "+");
      this.pins[i2 * 2 + 1] = new Pin(this, i2 * 2 + 1, ChipElm.SIDE_W, String.fromCharCode(65 + i2) + "-");
      this.pins[i2 * 2 + 1].output = true;
    }
    const i = this.inputPairCount;
    this.pins[i * 2] = new Pin(this, 0, ChipElm.SIDE_E, "O+");
    this.pins[i * 2].output = true;
    this.pins[i * 2 + 1] = new Pin(this, 1, ChipElm.SIDE_E, "O-");
    this.lastCurrents = new Array(this.inputPairCount + 1).fill(0);
    this.allocExprArrays();
    this.allocNodes();
  }
  // our pin inputs are currents, handled by their own loop below, so the generic
  // expression-input machinery only covers the v()/i() references
  getPinExprInputCount() {
    return 0;
  }
  getChipName() {
    return "CCCS";
  }
  stamp() {
    const sim = SimulationManager.theSim;
    if (this.isSpiceStyle()) {
      for (let i = 0; i !== this.inputCount; i += 2)
        this.pins[i + 1].voltSource = this.voltageSources[i / 2].getVoltageSource();
    } else {
      for (let i = 0; i !== this.inputCount; i += 2) {
        const vn1 = this.pins[i + 1].voltSource;
        sim.stampVoltageSource(this.nodes[i], this.nodes[i + 1], vn1, 0);
      }
    }
    sim.stampNonLinear(this.nodes[this.inputCount]);
    sim.stampNonLinear(this.nodes[this.inputCount + 1]);
  }
  doStep() {
    const sim = SimulationManager.theSim;
    if (this.broken) {
      this.pins[this.inputCount].current = 0;
      this.pins[this.inputCount + 1].current = 0;
      sim.stampResistor(this.nodes[this.inputCount], this.nodes[this.inputCount + 1], 1e8);
      return;
    }
    if (this.isSpiceStyle()) {
      for (let i = 0; i !== this.inputPairCount; i++)
        this.pins[i * 2 + 1].current = this.voltageSources[i].getCurrent();
    }
    const convergeLimit = this.getConvergeLimit() * 0.1;
    for (let i = 0; i <= this.inputPairCount; i++) {
      const cur = this.pins[i * 2 + 1].current;
      if (Math.abs(cur - this.lastCurrents[i]) > convergeLimit)
        sim.converged = false;
    }
    for (let i = 0; i <= this.inputPairCount; i++)
      this.lastCurrents[i] = this.pins[i * 2 + 1].current;
    if (!this.engine.checkConvergence(this.getConvergeLimit()))
      sim.converged = false;
    if (this.expr != null) {
      for (let i = 0; i !== this.inputPairCount; i++)
        this.setCurrentExprValue(i, this.pins[i * 2 + 1].current);
      this.exprState.t = sim.t;
      const v0 = this.expr.eval(this.exprState);
      let rs = v0;
      this.pins[this.inputCount].current = v0;
      this.pins[this.inputCount + 1].current = -v0;
      for (let i = 0; i !== this.inputPairCount; i++) {
        const cur = this.pins[i * 2 + 1].current;
        let dv = cur - this.lastCurrents[i];
        if (Math.abs(dv) < 1e-6) dv = 1e-6;
        this.setCurrentExprValue(i, cur);
        const v = this.expr.eval(this.exprState);
        this.setCurrentExprValue(i, cur - dv);
        const v2 = this.expr.eval(this.exprState);
        let dx = (v - v2) / dv;
        if (Math.abs(dx) < 1e-6)
          dx = this.sign(dx, 1e-6);
        sim.stampCCCS(
          this.nodes[this.inputCount + 1],
          this.nodes[this.inputCount],
          this.pins[i * 2 + 1].voltSource,
          dx
        );
        rs -= dx * cur;
        this.setCurrentExprValue(i, cur);
      }
      if (this.engine.getRefCount() > 0)
        rs += this.engine.evalAndStamp(false) - v0;
      sim.stampCurrentSource(this.nodes[this.inputCount + 1], this.nodes[this.inputCount], rs);
    }
    this.engine.saveInputs();
  }
  // our output is a current source from O- to O+ (v0 isn't negated as it is in VCCSElm)
  stampInputDerivative(pos, neg, dx) {
    SimulationManager.theSim.stampVCCurrentSource(
      this.nodes[this.inputCount + 1],
      this.nodes[this.inputCount],
      pos,
      neg,
      dx
    );
  }
  stampInputDerivativeVS(ivs, dx) {
    SimulationManager.theSim.stampCCCS(
      this.nodes[this.inputCount + 1],
      this.nodes[this.inputCount],
      ivs,
      dx
    );
  }
  stepFinished() {
    this.exprState.updateLastValues(this.pins[this.inputCount].current);
  }
  setCurrentExprValue(n, cur) {
    if (n === 0 && this.inputPairCount < 9)
      this.exprState.values[8] = cur;
    this.exprState.values[n] = cur;
  }
  getPostCount() {
    return (this.inputCount ?? 0) + 2;
  }
  getVoltageSourceCount() {
    return this.isSpiceStyle() ? 0 : this.inputPairCount;
  }
  getDumpType() {
    return 215;
  }
  getConnection(n1, n2) {
    return Math.floor(n1 / 2) === Math.floor(n2 / 2);
  }
  hasCurrentOutput() {
    return true;
  }
  isSpiceStyle() {
    return (this.flags & CCCSElm.FLAG_SPICE) !== 0;
  }
  setCurrent(vs, c) {
    for (let i = 0; i !== this.inputCount; i += 2) {
      if (this.pins[i + 1].voltSource === vs) {
        this.pins[i].current = -c;
        this.pins[i + 1].current = c;
        return;
      }
    }
  }
  setChipEditValue(n, ei) {
    if (n === 1) {
      if (ei.value < 0 || ei.value > 8 || ei.value % 2 === 1)
        return;
      this.inputCount = Math.round(ei.value);
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    } else {
      super.setChipEditValue(n, ei);
    }
  }
  setParentList(elmList) {
    super.setParentList(elmList);
    if (!this.isSpiceStyle())
      return;
    this.voltageSources = new Array(this.inputPairCount).fill(null);
    for (let i = 0; i !== this.inputCount; i += 2) {
      for (let j = 0; j !== elmList.length; j++) {
        const ce = elmList[j];
        if (!ce.isVoltageElm()) continue;
        if (ce.getNode(0) === this.nodes[i] && ce.getNode(1) === this.nodes[i + 1])
          this.voltageSources[i / 2] = ce;
      }
    }
  }
  setVoltageSource(j, vs) {
    if (this.isSpiceStyle()) {
      this.pins[this.inputCount].voltSource = vs;
    } else {
      super.setVoltageSource(j, vs);
      vs.setNodes(this.nodes[j * 2], this.nodes[j * 2 + 1]);
    }
  }
  getInfo(arr) {
    super.getInfo(arr);
    let i = 1;
    let j = 0;
    for (j = 0; j !== this.inputCount; j += 2)
      arr[i++] = this.pins[j].text + " = " + CCCSElm.getCurrentText(-this.pins[j].current);
    arr[i++] = this.pins[j].text + " = " + CCCSElm.getVoltageText(this.nodes[j].v) + "; " + this.pins[j + 1].text + " = " + CCCSElm.getVoltageText(this.nodes[j + 1].v);
    arr[i++] = "I = " + CCCSElm.getCurrentText(this.pins[j].current);
    arr[i] = null;
  }
}

class CCVSElm extends VCCSElm {
  static FLAG_SPICE = 2;
  voltageSources = [];
  outputVS = null;
  lastOutput = 0;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.exprString = "2*a";
      this.parseExpr();
    } else {
      super(xa, ya, xb, yb, f, st);
      this.setupPins();
    }
  }
  setupPins() {
    if (!this.inputCount)
      this.inputCount = 0;
    this.sizeX = 2;
    this.sizeY = this.inputCount > 2 ? this.inputCount : 2;
    this.inputPairCount = Math.floor(this.inputCount / 2);
    this.pins = new Array(this.inputCount + 2);
    for (let i2 = 0; i2 !== this.inputPairCount; i2++) {
      this.pins[i2 * 2] = new Pin(this, i2 * 2, ChipElm.SIDE_W, String.fromCharCode(65 + i2) + "+");
      this.pins[i2 * 2 + 1] = new Pin(this, i2 * 2 + 1, ChipElm.SIDE_W, String.fromCharCode(65 + i2) + "-");
      this.pins[i2 * 2 + 1].output = true;
    }
    const i = this.inputPairCount;
    this.pins[i * 2] = new Pin(this, 0, ChipElm.SIDE_E, "V+");
    this.pins[i * 2].output = true;
    this.pins[i * 2 + 1] = new Pin(this, 1, ChipElm.SIDE_E, "V-");
    this.lastCurrents = new Array(this.inputPairCount).fill(0);
    this.allocExprArrays();
    this.allocNodes();
  }
  // our pin inputs are currents, handled by their own loop below, so the generic
  // expression-input machinery only covers the v()/i() references
  getPinExprInputCount() {
    return 0;
  }
  getChipName() {
    return "CCVS";
  }
  stamp() {
    const sim = SimulationManager.theSim;
    if (this.isSpiceStyle()) {
      for (let i = 0; i !== this.inputCount; i += 2)
        this.pins[i + 1].voltSource = this.voltageSources[i / 2].getVoltageSource();
    } else {
      for (let i = 0; i !== this.inputCount; i += 2) {
        const vn1 = this.pins[i + 1].voltSource;
        sim.stampVoltageSource(this.nodes[i], this.nodes[i + 1], vn1, 0);
      }
    }
    const vn2 = this.pins[this.inputCount].voltSource;
    this.outputVS = vn2;
    sim.stampNonLinearVS(vn2);
    sim.stampVoltageSource(this.nodes[this.inputCount + 1], this.nodes[this.inputCount], vn2);
  }
  doStep() {
    const sim = SimulationManager.theSim;
    if (this.isSpiceStyle()) {
      for (let i = 0; i !== this.inputPairCount; i++)
        this.pins[i * 2 + 1].current = this.voltageSources[i].getCurrent();
    }
    const convergeLimitCurrent = this.getConvergeLimit() * 0.1;
    for (let i = 0; i !== this.inputPairCount; i++) {
      const cur = this.pins[i * 2 + 1].current;
      if (Math.abs(cur - this.lastCurrents[i]) > convergeLimitCurrent)
        sim.converged = false;
    }
    const convergeLimitVoltage = this.getConvergeLimit();
    if (Math.abs(this.nodes[this.inputCount].v - this.nodes[this.inputCount + 1].v - this.lastOutput) > convergeLimitVoltage)
      sim.converged = false;
    if (!this.engine.checkConvergence(this.getConvergeLimit()))
      sim.converged = false;
    const vno = this.outputVS;
    if (this.expr != null) {
      for (let i = 0; i !== this.inputPairCount; i++)
        this.setCurrentExprValue(i, this.pins[i * 2 + 1].current);
      this.exprState.t = sim.t;
      const v0 = this.expr.eval(this.exprState);
      let rs = v0;
      for (let i = 0; i !== this.inputPairCount; i++) {
        const cur = this.pins[i * 2 + 1].current;
        const vni = this.pins[i * 2 + 1].voltSource;
        const dv = 1e-9;
        this.setCurrentExprValue(i, cur);
        const v = this.expr.eval(this.exprState);
        this.setCurrentExprValue(i, cur - dv);
        const v2 = this.expr.eval(this.exprState);
        let dx = (v - v2) / dv;
        if (Math.abs(dx) < 1e-6)
          dx = this.sign(dx, 1e-6);
        sim.stampMatrixVV(vno, vni, -dx);
        rs -= dx * cur;
        this.setCurrentExprValue(i, cur);
      }
      if (this.engine.getRefCount() > 0)
        rs += this.engine.evalAndStamp(false) - v0;
      sim.stampRightSideVS(vno, rs);
    }
    this.engine.saveInputs();
    for (let i = 0; i !== this.inputPairCount; i++)
      this.lastCurrents[i] = this.pins[i * 2 + 1].current;
    this.lastOutput = this.nodes[this.inputCount].v - this.nodes[this.inputCount + 1].v;
  }
  // our output is a voltage source, so derivatives go into its matrix row
  stampInputDerivative(pos, neg, dx) {
    const sim = SimulationManager.theSim;
    sim.stampMatrixNV(this.outputVS, pos, -dx);
    sim.stampMatrixNV(this.outputVS, neg, dx);
  }
  stampInputDerivativeVS(ivs, dx) {
    SimulationManager.theSim.stampMatrixVV(this.outputVS, ivs, -dx);
  }
  stepFinished() {
    this.exprState.updateLastValues(this.nodes[this.inputCount].v - this.nodes[this.inputCount + 1].v);
    for (let i = 0; i !== this.inputPairCount; i++)
      this.exprState.lastValues[i] = this.pins[i * 2 + 1].current;
  }
  setCurrentExprValue(n, cur) {
    if (n === 0 && this.inputPairCount < 9)
      this.exprState.values[8] = cur;
    this.exprState.values[n] = cur;
  }
  getPostCount() {
    return this.inputCount + 2;
  }
  getVoltageSourceCount() {
    return this.isSpiceStyle() ? 1 : 1 + this.inputPairCount;
  }
  getDumpType() {
    return 214;
  }
  getConnection(n1, n2) {
    return Math.floor(n1 / 2) === Math.floor(n2 / 2);
  }
  hasCurrentOutput() {
    return false;
  }
  isSpiceStyle() {
    return (this.flags & CCVSElm.FLAG_SPICE) !== 0;
  }
  setCurrent(vs, c) {
    let i = 0;
    if (!this.isSpiceStyle()) {
      for (i = 0; i !== this.inputCount; i += 2) {
        if (this.pins[i + 1].voltSource === vs) {
          this.pins[i].current = -c;
          this.pins[i + 1].current = c;
          return;
        }
      }
    } else {
      i = this.inputCount;
    }
    if (this.pins[i].voltSource === vs) {
      this.pins[i].current = c;
      this.pins[i + 1].current = -c;
    }
  }
  setChipEditValue(n, ei) {
    if (n === 1) {
      if (ei.value < 0 || ei.value > 8 || ei.value % 2 === 1)
        return;
      this.inputCount = Math.round(ei.value);
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    } else {
      super.setChipEditValue(n, ei);
    }
  }
  setParentList(elmList) {
    super.setParentList(elmList);
    if (!this.isSpiceStyle())
      return;
    this.voltageSources = new Array(this.inputPairCount).fill(null);
    for (let i = 0; i !== this.inputCount; i += 2) {
      for (let j = 0; j !== elmList.length; j++) {
        const ce = elmList[j];
        if (!ce.isVoltageElm())
          continue;
        if (ce.getNode(0) === this.nodes[i] && ce.getNode(1) === this.nodes[i + 1])
          this.voltageSources[i / 2] = ce;
      }
    }
  }
  setVoltageSource(j, vs) {
    if (this.isSpiceStyle()) {
      this.pins[this.inputCount].voltSource = vs;
      vs.setNodes(this.nodes[this.inputCount + 1], this.nodes[this.inputCount]);
    } else {
      super.setVoltageSource(j, vs);
      if (j < this.inputPairCount)
        vs.setNodes(this.nodes[j * 2], this.nodes[j * 2 + 1]);
      else
        vs.setNodes(this.nodes[this.inputCount + 1], this.nodes[this.inputCount]);
    }
  }
  getInfo(arr) {
    super.getInfo(arr);
    let i = 1;
    let j = 0;
    for (j = 0; j !== this.inputCount; j += 2)
      arr[i++] = this.pins[j].text + " = " + CCVSElm.getCurrentText(-this.pins[j].current);
    arr[i++] = this.pins[j].text + " = " + CCVSElm.getVoltageText(this.nodes[j].v) + "; " + this.pins[j + 1].text + " = " + CCVSElm.getVoltageText(this.nodes[j + 1].v);
    arr[i++] = "I = " + CCVSElm.getCurrentText(this.pins[j].current);
    arr[i] = null;
  }
}

class CapacitorElm extends CircuitElm {
  capacitance;
  compResistance;
  voltdiff;
  seriesResistance;
  initialVoltage;
  capNode2;
  curSourceValue;
  plate1;
  plate2;
  static FLAG_BACK_EULER = 2;
  static FLAG_RESISTANCE = 4;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.capacitance = 1e-5;
      this.initialVoltage = 1e-3;
      this.compResistance = 0;
      this.voltdiff = 0;
      this.seriesResistance = 0;
      this.capNode2 = 0;
      this.curSourceValue = 0;
    } else {
      super(xa, ya, xb, yb, f);
      this.capacitance = parseFloatStrict(st.nextToken());
      this.voltdiff = parseFloatStrict(st.nextToken());
      this.initialVoltage = 1e-3;
      this.compResistance = 0;
      this.capNode2 = 0;
      this.seriesResistance = 0;
      this.curSourceValue = 0;
      try {
        this.initialVoltage = parseFloatStrict(st.nextToken());
        if ((this.flags & CapacitorElm.FLAG_RESISTANCE) !== 0)
          this.seriesResistance = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
      this.allocNodes();
    }
  }
  isTrapezoidal() {
    return (this.flags & CapacitorElm.FLAG_BACK_EULER) === 0;
  }
  reset() {
    super.reset();
    this.current = this.curcount = this.curSourceValue = 0;
    this.voltdiff = this.initialVoltage;
  }
  shorted() {
    super.reset();
    this.voltdiff = this.current = this.curcount = this.curSourceValue = 0;
  }
  isCapacitorElm() {
    return true;
  }
  getDumpType() {
    return "c".charCodeAt(0);
  }
  dump() {
    this.flags |= CapacitorElm.FLAG_RESISTANCE;
    return super.dump() + " " + this.capacitance + " " + this.voltdiff + " " + this.initialVoltage + " " + this.seriesResistance;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "c", this.capacitance);
    CircuitXMLSerializer.dumpAttr(elem, "iv", this.initialVoltage);
    CircuitXMLSerializer.dumpAttr(elem, "sr", this.seriesResistance);
  }
  dumpXmlState(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "vd", this.voltdiff);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.capacitance = xml.parseDoubleAttr("c", this.capacitance);
    this.initialVoltage = xml.parseDoubleAttr("iv", this.initialVoltage);
    this.seriesResistance = xml.parseDoubleAttr("sr", this.seriesResistance);
    this.voltdiff = xml.parseDoubleAttr("vd", this.voltdiff);
    this.allocNodes();
  }
  // used for PolarCapacitorElm
  platePoints;
  setPoints() {
    super.setPoints();
    const f = (this.dn / 2 - 4) / this.dn;
    this.lead1 = this.interpPoint(this.point1, this.point2, f);
    this.lead2 = this.interpPoint(this.point1, this.point2, 1 - f);
    this.plate1 = this.newPointArray(2);
    this.plate2 = this.newPointArray(2);
    this.interpPoint2(this.point1, this.point2, this.plate1[0], this.plate1[1], f, 12);
    this.interpPoint2(this.point1, this.point2, this.plate2[0], this.plate2[1], 1 - f, 12);
  }
  draw(g) {
    const hs = 12;
    this.setBbox(this.point1, this.point2, hs);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.setPowerColor(g, false);
    CircuitElm.drawThickLine(g, this.plate1[0], this.plate1[1]);
    if (this.showPower())
      g.setColor(Color.gray);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.point2, this.lead2);
    this.setPowerColor(g, false);
    if (this.platePoints == null)
      CircuitElm.drawThickLine(g, this.plate2[0], this.plate2[1]);
    else {
      let i;
      for (i = 0; i !== this.platePoints.length - 1; i++)
        CircuitElm.drawThickLine(g, this.platePoints[i], this.platePoints[i + 1]);
    }
    this.updateDotCount();
    if (!this.isCreating()) {
      this.drawDots(g, this.point1, this.lead1, this.curcount);
      this.drawDots(g, this.point2, this.lead2, -this.curcount);
    }
    this.drawPosts(g);
    if (this.showValues()) {
      const s = CircuitElm.getShortUnitText(this.capacitance, "F");
      this.drawValues(g, s, hs);
    }
  }
  stamp() {
    if (this.doDcAnalysis()) {
      CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], 1e8);
      this.curSourceValue = 0;
      this.capNode2 = 1;
      return;
    }
    this.capNode2 = this.seriesResistance > 0 ? 2 : 1;
    if (this.isTrapezoidal())
      this.compResistance = CircuitElm.sim.timeStep / (2 * this.capacitance);
    else
      this.compResistance = CircuitElm.sim.timeStep / this.capacitance;
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[this.capNode2], this.compResistance);
    if (this.seriesResistance > 0)
      CircuitElm.sim.stampResistor(this.nodes[1], this.nodes[2], this.seriesResistance);
  }
  startIteration() {
    if (this.isTrapezoidal())
      this.curSourceValue = -this.voltdiff / this.compResistance - this.current;
    else
      this.curSourceValue = -this.voltdiff / this.compResistance;
  }
  stepFinished() {
    this.voltdiff = this.nodes[0].v - this.nodes[this.capNode2].v;
    this.calculateCurrent();
  }
  calculateCurrent() {
    const voltdiff = this.nodes[0].v - this.nodes[this.capNode2].v;
    if (this.doDcAnalysis()) {
      this.current = voltdiff / 1e8;
      return;
    }
    if (this.compResistance > 0)
      this.current = voltdiff / this.compResistance + this.curSourceValue;
  }
  doStep() {
    if (this.doDcAnalysis())
      return;
    CircuitElm.sim.stampCurrentSource(this.nodes[0], this.nodes[this.capNode2], this.curSourceValue);
  }
  getInternalNodeCount() {
    return !this.doDcAnalysis() && this.seriesResistance > 0 ? 1 : 0;
  }
  getInfo(arr) {
    arr[0] = "capacitor";
    this.getBasicInfo(arr);
    arr[3] = "C = " + CircuitElm.getUnitText(this.capacitance, "F");
    arr[4] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
    arr[5] = "Q = " + CircuitElm.getUnitText(this.capacitance * this.voltdiff, "C");
  }
  getScopeText(v) {
    return Locale.LS("capacitor") + ", " + CircuitElm.getUnitText(this.capacitance, "F");
  }
  getScopeValue(x) {
    if (x === Scope.VAL_CHARGE)
      return this.capacitance * this.voltdiff;
    return super.getScopeValue(x);
  }
  getScopeUnits(x) {
    if (x === Scope.VAL_CHARGE)
      return Scope.UNITS_C;
    return super.getScopeUnits(x);
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Capacitance (F)", this.capacitance, 1e-6, 1e-3);
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Trapezoidal Approximation", this.isTrapezoidal());
      return ei;
    }
    if (n === 2)
      return new EditInfo("Initial Voltage (on Reset)", this.initialVoltage);
    if (n === 3)
      return new EditInfo("Series Resistance", this.seriesResistance);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.capacitance = ei.value > 0 ? ei.value : 1e-12;
    if (n === 1) {
      if (ei.checkbox.getState())
        this.flags &= ~CapacitorElm.FLAG_BACK_EULER;
      else
        this.flags |= CapacitorElm.FLAG_BACK_EULER;
    }
    if (n === 2)
      this.initialVoltage = ei.value;
    if (n === 3) {
      this.seriesResistance = ei.value;
      this.allocNodes();
    }
  }
  getShortcut() {
    return "c".charCodeAt(0);
  }
  getCapacitance() {
    return this.capacitance;
  }
  getSeriesResistance() {
    return this.seriesResistance;
  }
  setCapacitance(c) {
    this.capacitance = c;
  }
  setSeriesResistance(c) {
    this.seriesResistance = c;
  }
  isIdealCapacitor() {
    return this.seriesResistance === 0;
  }
  addRoutingObstacle(wr) {
    this.addRoutingObstacleWithLeads(wr, 12);
  }
  validate() {
    if (this.isIdealCapacitor()) {
      let fpi = new FindPathInfo(FindPathInfo.SHORT, this, this.getNode(1), CircuitElm.sim);
      if (fpi.findPath(this.getNode(0))) {
        CirSim.console(this + " shorted");
        this.shorted();
      } else {
        fpi = new FindPathInfo(FindPathInfo.CAP_V, this, this.getNode(1), CircuitElm.sim);
        if (fpi.findPath(this.getNode(0))) {
          this.setSeriesResistance(0.1);
          return false;
        }
      }
    }
    return true;
  }
}

class ClockElm extends RailElm {
  constructor(xx, yy) {
    super(xx, yy, VoltageElm.WF_SQUARE);
    this.maxVoltage = 2.5;
    this.bias = 2.5;
    this.frequency = 100;
    this.flags |= this.FLAG_CLOCK;
  }
  getDumpClass() {
    return RailElm;
  }
  getShortcut() {
    return 0;
  }
}

class ComparatorElm extends CompositeElm {
  static modelString = "OpAmpElm 1 2 3\rAnalogSwitchElm 4 5 3\rGroundElm 5";
  static modelExternalNodes = [2, 1, 4];
  FLAG_SMALL = 2;
  FLAG_SWAP = 4;
  opsize;
  opheight;
  opwidth;
  in1p;
  in2p;
  textp;
  triangle;
  plusFont;
  constructor(xa, ya, xb, yb, f, st) {
    if (st !== void 0) {
      super(xa, ya, xb, yb, f);
      this.loadComposite(st, ComparatorElm.modelString, ComparatorElm.modelExternalNodes);
      this.noDiagonal = true;
      this.setSize((f & this.FLAG_SMALL) !== 0 ? 1 : 2);
    } else {
      super(xa, ya);
      this.loadComposite(null, ComparatorElm.modelString, ComparatorElm.modelExternalNodes);
      this.noDiagonal = true;
      this.setSize(this.useSmallGrid() ? 1 : 2);
    }
  }
  getDumpType() {
    return 401;
  }
  setSize(s) {
    this.opsize = s;
    this.opheight = 8 * s;
    this.opwidth = 13 * s;
    this.flags = this.flags & ~this.FLAG_SMALL | (s === 1 ? this.FLAG_SMALL : 0);
  }
  getConnection(n1, n2) {
    return false;
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.opheight * 2);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.in1p[0], this.in1p[1]);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.in2p[0], this.in2p[1]);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    this.setPowerColor(g, true);
    CircuitElm.drawThickPolygon(g, this.triangle);
    g.setFont(this.plusFont);
    this.drawCenteredText(g, "-", this.textp[0].x, this.textp[0].y - 2, true);
    this.drawCenteredText(g, "+", this.textp[1].x, this.textp[1].y, true);
    this.drawCenteredText(g, "≥?", this.textp[2].x, this.textp[2].y, true);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.lead2, this.point2);
    this.curcount = this.updateDotCountImpl(-this.getCurrentIntoNode(2), this.curcount);
    this.drawDots(g, this.point2, this.lead2, this.curcount);
    this.drawPosts(g);
  }
  setPoints() {
    super.setPoints();
    if (this.dn > 150 && this.isCreating())
      this.setSize(2);
    let ww = this.opwidth;
    if (ww > this.dn / 2)
      ww = Math.trunc(this.dn / 2);
    this.calcLeads(ww * 2);
    const hs = this.opheight * this.dsign;
    this.in1p = this.newPointArray(2);
    this.in2p = this.newPointArray(2);
    this.textp = this.newPointArray(3);
    const sgn = this.hasFlag(this.FLAG_SWAP) ? -1 : 1;
    this.interpPoint2(this.point1, this.point2, this.in1p[0], this.in2p[0], 0, hs * sgn);
    this.interpPoint2(this.lead1, this.lead2, this.in1p[1], this.in2p[1], 0, hs * sgn);
    this.interpPoint2(this.lead1, this.lead2, this.textp[0], this.textp[1], 0.2, hs * sgn);
    this.interpPoint(this.lead1, this.lead2, this.textp[2], 0.5, 0);
    const tris = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, tris[0], tris[1], 0, hs * 2);
    this.triangle = this.createPolygon(tris[0], tris[1], this.lead2);
    this.plusFont = new Font("SansSerif", 0, this.opsize === 2 ? 14 : 10);
    this.setPost(0, this.in1p[0]);
    this.setPost(1, this.in2p[0]);
    this.setPost(2, this.point2);
  }
  getInfo(arr) {
    arr[0] = "Comparator";
    arr[1] = "V+ = " + CircuitElm.getVoltageText(this.nodes[1].v);
    arr[2] = "V- = " + CircuitElm.getVoltageText(this.nodes[0].v);
  }
  flipX(c2, count) {
    if (this.dx === 0)
      this.flags ^= this.FLAG_SWAP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    if (this.dy === 0)
      this.flags ^= this.FLAG_SWAP;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    this.flags ^= this.FLAG_SWAP;
    super.flipXY(xmy, count);
  }
}

class Counter2Elm extends ChipElm {
  modulus = 0;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
      try {
        this.modulus = parseIntStrict(st.nextToken());
      } catch (e) {
      }
    }
  }
  dump() {
    return super.dump() + " " + this.modulus;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "mo", this.modulus);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.modulus = xml.parseIntAttr("mo", this.modulus);
  }
  needsBits() {
    return true;
  }
  allowBus() {
    return true;
  }
  getChipName() {
    if (this.modulus === 0)
      return "Counter";
    return Locale.LS("Counter") + Locale.LS(" (mod ") + this.modulus + ")";
  }
  setupPins() {
    this.sizeX = 2;
    const bitsY = this.useBus() ? 1 : this.bits;
    this.sizeY = bitsY + 3;
    this.pins = new Array(this.getPostCount());
    this.makeBitPins(this.bits, 1, ChipElm.SIDE_E, 0, "Q", true, true, true);
    this.makeBitPins(this.bits, 1, ChipElm.SIDE_W, this.bits, "I", false, false, true);
    const p = this.bits * 2;
    this.clk = p;
    this.clr = p + 1;
    this.enp = p + 2;
    this.rco = p + 3;
    this.load = p + 4;
    this.ent = p + 5;
    this.pins[this.clk] = new Pin(this, 0, ChipElm.SIDE_W, "");
    this.pins[this.clk].clock = true;
    this.pins[this.clr] = new Pin(this, bitsY + 1, ChipElm.SIDE_W, "CLR");
    this.pins[this.clr].bubble = true;
    this.pins[this.enp] = new Pin(this, bitsY + 2, ChipElm.SIDE_W, "EnP");
    this.pins[this.rco] = new Pin(this, 0, ChipElm.SIDE_E, "RCO");
    this.pins[this.rco].output = true;
    this.pins[this.load] = new Pin(this, bitsY + 1, ChipElm.SIDE_E, "LOAD");
    this.pins[this.load].bubble = true;
    this.pins[this.ent] = new Pin(this, bitsY + 2, ChipElm.SIDE_E, "EnT");
  }
  getPostCount() {
    return this.bits * 2 + 6;
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
    if (n === 1)
      return new EditInfo("Modulus", this.modulus, 1, 1).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 2) {
        this.bits = Math.floor(ei.value);
        this.setupPins();
        this.setPoints();
        this.allocNodes();
      } else
        ei.setError("must be >= 2");
    }
    if (n === 1)
      this.modulus = Math.floor(ei.value);
  }
  getVoltageSourceCount() {
    return this.bits + 1;
  }
  carry = false;
  execute() {
    if (this.pins[this.clk].value && !this.lastClock) {
      if (this.pins[this.enp].value && this.pins[this.ent].value) {
        let value = 0;
        const lastBit = this.bits - 1;
        for (let i = 0; i !== this.bits; i++)
          if (this.pins[lastBit - i].value)
            value |= 1 << i;
        value++;
        const realmod = this.modulus === 0 ? 1 << this.bits : this.modulus;
        value %= realmod;
        for (let i = 0; i !== this.bits; i++)
          this.writeOutput(lastBit - i, (value & 1 << i) !== 0);
        this.carry = value === realmod - 1;
      }
      if (!this.pins[this.load].value) {
        for (let i = 0; i !== this.bits; i++)
          this.writeOutput(i, this.pins[i + this.bits].value);
        let value = 0;
        const lastBit = this.bits - 1;
        for (let i = 0; i !== this.bits; i++)
          if (this.pins[lastBit - i].value)
            value |= 1 << i;
        const realmod = this.modulus === 0 ? 1 << this.bits : this.modulus;
        this.carry = value === realmod - 1;
      }
    }
    if (!this.pins[this.clr].value) {
      for (let i = 0; i !== this.bits; i++)
        this.writeOutput(i, false);
      this.carry = false;
    }
    this.lastClock = this.pins[this.clk].value;
    this.writeOutput(this.rco, this.carry && this.pins[this.ent].value);
  }
  getDumpType() {
    return 421;
  }
  getXmlDumpType() {
    return "ctr2";
  }
}

class CounterElm extends ChipElm {
  invertreset = false;
  modulus = 0;
  static FLAG_UP_DOWN = 4;
  static FLAG_NEGATIVE_EDGE = 8;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
    } else {
      super(xa, ya, xb, yb, f, st);
      this.invertreset = true;
      try {
        this.invertreset = st.nextToken() === "true";
        this.modulus = parseIntStrict(st.nextToken());
      } catch (e) {
      }
      this.pins[1].bubble = this.invertreset;
    }
  }
  dump() {
    return super.dump() + " " + this.invertreset + " " + this.modulus;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "in", this.invertreset);
    CircuitXMLSerializer.dumpAttr(elem, "mo", this.modulus);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.invertreset = xml.parseBooleanAttr("in", this.invertreset);
    this.modulus = xml.parseIntAttr("mo", this.modulus);
    this.pins[1].bubble = this.invertreset;
  }
  needsBits() {
    return true;
  }
  allowBus() {
    return true;
  }
  getChipName() {
    if (this.modulus === 0)
      return "Counter";
    return Locale.LS("Counter") + Locale.LS(" (mod ") + this.modulus + ")";
  }
  setupPins() {
    if (!this.bits) return;
    this.sizeX = 2;
    this.sizeY = this.useBus() ? 3 : this.bits;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "");
    this.pins[0].clock = true;
    this.pins[0].bubble = this.negativeEdgeTriggered();
    this.pins[1] = new Pin(this, this.sizeY - 1, ChipElm.SIDE_W, "R");
    this.pins[1].bubble = this.invertreset;
    this.makeBitPins(this.bits, 0, ChipElm.SIDE_E, 2, "Q", true, true, true);
    if (this.hasUpDown())
      this.pins[this.bits + 2] = new Pin(this, this.sizeY - 2, ChipElm.SIDE_W, "U/D");
    this.allocNodes();
  }
  getPostCount() {
    return this.hasUpDown() ? this.bits + 3 : this.bits + 2;
  }
  getVoltageSourceCount() {
    return this.bits;
  }
  hasUpDown() {
    return this.hasFlag(CounterElm.FLAG_UP_DOWN);
  }
  negativeEdgeTriggered() {
    return this.hasFlag(CounterElm.FLAG_NEGATIVE_EDGE);
  }
  execute() {
    const neg = this.negativeEdgeTriggered();
    if (this.pins[0].value !== neg && this.lastClock === neg) {
      let value = 0;
      let dir = 1;
      if (this.hasUpDown() && this.pins[this.bits + 2].value)
        dir = -1;
      const lastBit = 2 + this.bits - 1;
      for (let i = 0; i !== this.bits; i++)
        if (this.pins[lastBit - i].value)
          value |= 1 << i;
      value += dir;
      if (this.modulus !== 0)
        value = (value % this.modulus + this.modulus) % this.modulus;
      for (let i = 0; i !== this.bits; i++)
        this.pins[lastBit - i].value = (value & 1 << i) !== 0;
    }
    if (!this.pins[1].value === this.invertreset) {
      for (let i = 0; i !== this.bits; i++)
        this.pins[i + 2].value = false;
    }
    this.lastClock = this.pins[0].value;
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Invert reset pin", this.invertreset);
      return ei;
    }
    if (n === 1)
      return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
    if (n === 2)
      return new EditInfo("Modulus", this.modulus, 1, 1).setDimensionless();
    if (n === 3) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Up/Down Pin", this.hasUpDown());
      return ei;
    }
    if (n === 4) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Negative Edge Triggered", this.negativeEdgeTriggered());
      return ei;
    }
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      this.invertreset = ei.checkbox.getState();
      this.setupPins();
      this.setPoints();
    }
    if (n === 1) {
      if (ei.value >= 3) {
        this.bits = Math.trunc(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be >= 3");
    }
    if (n === 2)
      this.modulus = Math.trunc(ei.value);
    if (n === 3) {
      this.flags = ei.changeFlag(this.flags, CounterElm.FLAG_UP_DOWN);
      this.setupPins();
      this.setPoints();
    }
    if (n === 4) {
      this.flags = ei.changeFlag(this.flags, CounterElm.FLAG_NEGATIVE_EDGE);
      this.setupPins();
      this.setPoints();
    }
  }
  getDumpType() {
    return 164;
  }
  getXmlDumpType() {
    return "ctr";
  }
}

class CrossSwitchElm extends SwitchElm {
  poleCount = 2;
  constructor(xa, ya, xbOrMm, yb, f, st) {
    if (st !== void 0) {
      super(xa, ya, xbOrMm, yb, f, st);
    } else if (typeof xbOrMm === "boolean") {
      super(xa, ya, xbOrMm);
    } else {
      super(xa, ya, false);
    }
    this.noDiagonal = true;
    this.allocNodes();
  }
  getDumpType() {
    return 430;
  }
  openhs = 16;
  posCount = 2;
  poleLeads;
  throwLeads;
  polePosts;
  throwPosts;
  linePoints;
  crossPoints;
  voltageSources;
  currents;
  curcounts;
  // voltageSources/currents/curcounts are normally (re)allocated in setPoints(), but elements
  // inside a CompositeElm/subcircuit never get setPoints() called, so allocate lazily here too.
  ensureArrays() {
    if (this.voltageSources == null) {
      this.voltageSources = new Array(this.poleCount);
      this.currents = new Array(this.poleCount).fill(0);
      this.curcounts = new Array(this.poleCount).fill(0);
    }
  }
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    this.ensureArrays();
    this.throwPosts = this.newPointArray(2 * this.poleCount);
    this.throwLeads = this.newPointArray(4 * this.poleCount);
    this.poleLeads = this.newPointArray(this.poleCount);
    this.polePosts = this.newPointArray(this.poleCount);
    this.linePoints = this.newPointArray(2);
    this.crossPoints = this.newPointArray(6);
    for (let i = 0; i !== this.poleCount; i++) {
      const offset = -i * this.openhs * 3;
      this.interpPoint(this.point1, this.point2, this.polePosts[i], 0, offset);
      this.interpPoint(this.lead1, this.lead2, this.poleLeads[i], 0, offset);
      this.interpPoint(this.point1, this.point2, this.throwPosts[i * 2], 1, offset - this.openhs);
      this.interpPoint(this.lead1, this.lead2, this.throwLeads[i * 4], 1, offset - this.openhs);
      this.interpPoint(this.point1, this.point2, this.throwPosts[i * 2 + 1], 1, offset + this.openhs);
      this.interpPoint(this.lead1, this.lead2, this.throwLeads[i * 4 + 1], 1, offset + this.openhs);
      this.interpPoint(this.lead1, this.lead2, this.throwLeads[i * 4 + 2], 1, offset + this.openhs * 0.33);
      if (this.useIECSymbol())
        this.interpPoint(this.lead1, this.lead2, this.throwLeads[i * 4 + 3], 1.2, offset - this.openhs * 0.33);
      else
        this.interpPoint(this.lead1, this.lead2, this.throwLeads[i * 4 + 3], 1, offset - this.openhs);
    }
    const dp = 16 / this.dn;
    this.interpPoint(this.point1, this.point2, this.crossPoints[0], 1 + dp, this.openhs);
    this.interpPoint(this.point1, this.point2, this.crossPoints[1], 1 + dp * 2, this.openhs);
    this.interpPoint(this.point1, this.point2, this.crossPoints[2], 1 + dp * 3, this.openhs);
    this.interpPoint(this.point1, this.point2, this.crossPoints[3], 1 + dp * 2, -this.openhs);
    this.interpPoint(this.point1, this.point2, this.crossPoints[4], 1 + dp, -this.openhs * 4);
    this.interpPoint(this.point1, this.point2, this.crossPoints[5], 1 + dp * 3, -this.openhs * 4);
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, 1);
    this.adjustBbox(this.crossPoints[2], this.crossPoints[5]);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.crossPoints[1], this.crossPoints[2]);
    CircuitElm.drawThickLine(g, this.crossPoints[1], this.crossPoints[3]);
    CircuitElm.drawThickLine(g, this.crossPoints[3], this.throwPosts[0]);
    CircuitElm.drawThickLine(g, this.throwPosts[0], this.throwPosts[3]);
    this.setVoltageColor(g, this.nodes[3].v);
    CircuitElm.drawThickLine(g, this.throwPosts[2], this.crossPoints[5]);
    CircuitElm.drawThickLine(g, this.throwPosts[1], this.crossPoints[0]);
    CircuitElm.drawThickLine(g, this.crossPoints[0], this.crossPoints[4]);
    for (let i = 0; i !== this.poleCount; i++) {
      this.setVoltageColor(g, this.nodes[i * 2].v);
      CircuitElm.drawThickLine(g, this.polePosts[i], this.poleLeads[i]);
      this.setVoltageColor(g, this.nodes[i * 2 + 1].v);
      if (this.useIECSymbol())
        CircuitElm.drawThickLine(g, this.throwLeads[i * 4], this.throwLeads[i * 4 + 2]);
      CircuitElm.drawThickLine(g, this.throwPosts[i * 2], this.throwLeads[i * 4]);
      this.setVoltageColor(g, this.nodes[3 - i * 2].v);
      CircuitElm.drawThickLine(g, this.throwPosts[i * 2 + 1], this.throwLeads[i * 4 + 1]);
      if (!this.needsHighlight())
        g.setColor(CircuitElm.lightGrayColor);
      if (i < this.poleCount - 1) {
        const offset = -i * this.openhs * 3;
        const adj = this.position * -3;
        this.interpPoint(this.point1, this.point2, this.linePoints[0], 0.5, offset - this.openhs * (0.5 - this.position) + adj);
        this.interpPoint(this.point1, this.point2, this.linePoints[1], 0.5, offset - this.openhs * 3 - this.openhs * (0.5 - this.position) + 7 + adj);
        g.setLineDash(4, 4);
        g.drawLine(this.linePoints[0], this.linePoints[1]);
        g.setLineDash(0, 0);
      }
      if (!this.needsHighlight())
        g.setColor(CircuitElm.whiteColor);
      CircuitElm.drawThickLine(g, this.poleLeads[i], this.throwLeads[i * 4 + 3 - this.position * 2]);
      this.curcounts[i] = this.updateDotCountImpl(this.currents[i], this.curcounts[i]);
      this.drawDots(g, this.polePosts[i], this.poleLeads[i], this.curcounts[i]);
      this.drawDots(g, this.throwLeads[i * 4 + this.position], this.throwPosts[i * 2 + this.position], this.curcounts[i]);
      if (i === 1 && this.position === 0)
        this.drawDots(g, this.throwPosts[2], this.crossPoints[5], this.curcounts[1]);
      if (i === 0 && this.position === 1) {
        this.drawDots(g, this.throwPosts[1], this.crossPoints[0], this.curcounts[0]);
        this.drawDots(g, this.crossPoints[0], this.crossPoints[4], this.curcounts[0]);
        this.drawDots(g, this.crossPoints[4], this.crossPoints[5], this.curcounts[0]);
      }
      if (i === 1 && this.position === 1)
        this.drawDots(g, this.throwPosts[3], this.throwPosts[0], this.curcounts[1]);
      this.drawDots(g, this.throwPosts[0], this.crossPoints[3], this.curcounts[this.position]);
      this.drawDots(g, this.crossPoints[3], this.crossPoints[1], this.curcounts[this.position]);
      this.drawDots(g, this.crossPoints[1], this.crossPoints[2], this.curcounts[this.position]);
    }
    this.drawPosts(g);
    CircuitElm.drawPost(g, this.throwPosts[0]);
    CircuitElm.drawPost(g, this.crossPoints[4]);
  }
  getCurrentIntoNode(n) {
    if (n === 0 || n === 2) return -this.currents[Math.trunc(n / 2)];
    if (this.position === 0) return this.currents[Math.trunc(n / 2)];
    return this.currents[1 - Math.trunc(n / 2)];
  }
  setCurrent(vs, c) {
    if (vs === this.voltageSources[0]) this.currents[0] = c;
    else this.currents[1] = c;
  }
  getSwitchRect() {
    return new Rectangle(this.poleLeads[0].x, this.poleLeads[0].y, 0, 0).union(new Rectangle(this.throwLeads[1].x, this.throwLeads[1].y, 0, 0)).union(new Rectangle(this.throwLeads[this.poleCount * 4 - 4].x, this.throwLeads[this.poleCount * 4 - 4].y, 0, 0));
  }
  getPost(n) {
    if (n === 0 || n === 2) return this.polePosts[Math.trunc(n / 2)];
    if (n === 1) return this.crossPoints[2];
    return this.crossPoints[5];
  }
  getPostCount() {
    return 2 * this.poleCount;
  }
  calculateCurrent() {
    if (this.resistance > 0) {
      for (let i = 0; i !== this.poleCount; i++) {
        const dst = this.position === 0 ? i * 2 + 1 : 3 - i * 2;
        this.currents[i] = (this.nodes[i * 2].v - this.nodes[dst].v) / this.resistance;
      }
    }
  }
  setVoltageSource(j, vs) {
    this.ensureArrays();
    this.voltageSources[j] = vs;
    vs.setNodes(this.nodes[j * 2], this.nodes[j * 2 + 1]);
  }
  stamp() {
    this.ensureArrays();
    if (this.position === 0) {
      for (let i = 0; i !== this.poleCount; i++) {
        if (this.resistance > 0)
          CircuitElm.sim.stampResistor(this.nodes[i * 2], this.nodes[i * 2 + 1], this.resistance);
        else
          CircuitElm.sim.stampVoltageSource(this.nodes[i * 2], this.nodes[i * 2 + 1], this.voltageSources[i], 0);
      }
    } else {
      for (let i = 0; i !== this.poleCount; i++) {
        if (this.resistance > 0)
          CircuitElm.sim.stampResistor(this.nodes[i * 2], this.nodes[3 - i * 2], this.resistance);
        else
          CircuitElm.sim.stampVoltageSource(this.nodes[i * 2], this.nodes[3 - i * 2], this.voltageSources[i], 0);
      }
    }
  }
  getVoltageSourceCount() {
    return this.resistance > 0 ? 0 : this.poleCount;
  }
  getConnection(n1, n2) {
    if (this.position === 0)
      return this.comparePair(n1, n2, 0, 1) || this.comparePair(n1, n2, 2, 3);
    else
      return this.comparePair(n1, n2, 0, 3) || this.comparePair(n1, n2, 2, 1);
  }
  isWireEquivalent() {
    return this.resistance === 0;
  }
  // optimizing out this element is too complicated to be worth it (see #646)
  isRemovableWire() {
    return false;
  }
  getElmType() {
    return "cross switch";
  }
  getInfo(arr) {
    arr[0] = "cross switch";
    for (let i = 0; i !== this.poleCount; i++)
      arr[i + 1] = "I" + (i + 1) + " = " + CircuitElm.getCurrentDText(this.currents[i]);
  }
  validate() {
    if (this.resistance > 0)
      return true;
    for (let i = 0; i !== this.poleCount; i++) {
      const dst = this.position === 0 ? i * 2 + 1 : 3 - i * 2;
      const fpi = new FindPathInfo(FindPathInfo.VOLTAGE, this, this.getNode(i * 2), CircuitElm.sim);
      if (fpi.findPath(this.getNode(dst))) {
        this.resistance = 1e-3;
        return false;
      }
    }
    return true;
  }
  getShortcut() {
    return 0;
  }
  getEditInfo(n) {
    if (n === 0) return EditInfo.createCheckbox("IEC Symbol", this.useIECSymbol());
    if (n === 1) return this.getKeyShortcutEditInfo();
    if (n === 2) {
      const ei = new EditInfo("On Resistance (ohms)", this.resistance);
      ei.setNonNegative();
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.flags = ei.changeFlag(this.flags, SwitchElm.FLAG_IEC);
      this.setPoints();
    }
    if (n === 1) this.setKeyShortcutEditValue(ei);
    if (n === 2) this.resistance = ei.value;
  }
}

class Inductor {
  static FLAG_BACK_EULER = 2;
  nodes;
  flags;
  sim;
  inductance;
  compResistance;
  current;
  curSourceValue;
  saturationCurrent;
  // 0 = disabled (linear), >0 = saturation onset current (A)
  constructor(s) {
    this.sim = s;
    this.nodes = new Array(2);
  }
  setup(ic, cr, f, isat) {
    this.inductance = ic;
    this.current = cr;
    this.flags = f;
    if (isat !== void 0)
      this.saturationCurrent = isat;
  }
  isTrapezoidal() {
    return (this.flags & Inductor.FLAG_BACK_EULER) === 0;
  }
  reset() {
    this.resetTo(0);
  }
  resetTo(c) {
    this.curSourceValue = this.current = c;
  }
  // compute effective inductance with saturation: L(I) = L0 / (1 + (I/Isat)^2)
  // smooth rolloff: at |I|=Isat, L=L0/2; at |I|=3*Isat, L=L0/10
  calcEffectiveInductance(i) {
    if (this.saturationCurrent <= 0) return this.inductance;
    const ratio = i / this.saturationCurrent;
    return this.inductance / (1 + ratio * ratio);
  }
  stamp(n0, n1) {
    this.nodes[0] = n0;
    this.nodes[1] = n1;
    if (this.saturationCurrent > 0) {
      this.sim.stampNonLinear(this.nodes[0]);
      this.sim.stampNonLinear(this.nodes[1]);
    } else {
      if (this.isTrapezoidal())
        this.compResistance = 2 * this.inductance / this.sim.timeStep;
      else
        this.compResistance = this.inductance / this.sim.timeStep;
      this.sim.stampResistor(this.nodes[0], this.nodes[1], this.compResistance);
    }
  }
  nonLinear() {
    return this.saturationCurrent > 0;
  }
  startIteration(voltdiff) {
    if (this.saturationCurrent > 0) {
      const lEff = this.calcEffectiveInductance(this.current);
      if (this.isTrapezoidal())
        this.compResistance = 2 * lEff / this.sim.timeStep;
      else
        this.compResistance = lEff / this.sim.timeStep;
    }
    if (this.isTrapezoidal())
      this.curSourceValue = voltdiff / this.compResistance + this.current;
    else
      this.curSourceValue = this.current;
  }
  calculateCurrent(voltdiff) {
    if (this.compResistance > 0)
      this.current = voltdiff / this.compResistance + this.curSourceValue;
    return this.current;
  }
  doStep(voltdiff) {
    if (this.saturationCurrent > 0) {
      this.sim.stampConductance(this.nodes[0], this.nodes[1], 1 / this.compResistance);
    }
    this.sim.stampCurrentSource(this.nodes[0], this.nodes[1], this.curSourceValue);
  }
}

class InductorElm extends CircuitElm {
  ind;
  inductance;
  initialCurrent;
  saturationCurrent;
  // 0 = disabled (linear)
  seriesResistance;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.ind = new Inductor(CircuitElm.sim);
      this.inductance = 1;
      this.initialCurrent = 0;
      this.saturationCurrent = 0;
      this.seriesResistance = 1;
      this.ind.setup(this.inductance, this.current, this.flags, this.saturationCurrent);
    } else {
      super(xa, ya, xb, yb, f);
      this.ind = new Inductor(CircuitElm.sim);
      this.inductance = parseFloatStrict(st.nextToken());
      this.current = parseFloatStrict(st.nextToken());
      this.initialCurrent = 0;
      this.saturationCurrent = 0;
      this.seriesResistance = 0;
      try {
        this.initialCurrent = parseFloatStrict(st.nextToken());
        this.saturationCurrent = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
      this.ind.setup(this.inductance, this.current, this.flags, this.saturationCurrent);
      this.allocNodes();
    }
  }
  getDumpType() {
    return "l".charCodeAt(0);
  }
  isInductorElm() {
    return true;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "l", this.inductance);
    CircuitXMLSerializer.dumpAttr(elem, "ic", this.initialCurrent);
    if (this.saturationCurrent !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "isat", this.saturationCurrent);
    if (this.seriesResistance !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "sr", this.seriesResistance);
  }
  dumpXmlState(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "i", this.current);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.inductance = xml.parseDoubleAttr("l", this.inductance);
    this.initialCurrent = xml.parseDoubleAttr("ic", this.initialCurrent);
    this.current = xml.parseDoubleAttr("i", this.current);
    this.saturationCurrent = xml.parseDoubleAttr("isat", this.saturationCurrent);
    const stateRestore = xml.parseStringAttr("ix", null) != null;
    this.seriesResistance = xml.parseDoubleAttr("sr", stateRestore ? this.seriesResistance : 0);
    this.ind.setup(this.inductance, this.current, this.flags, this.saturationCurrent);
    this.allocNodes();
  }
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
  }
  draw(g) {
    const v1 = this.nodes[0].v;
    const v2 = this.nodes[1].v;
    const hs = 8;
    this.setBbox(this.point1, this.point2, hs);
    this.draw2Leads(g);
    this.setPowerColor(g, false);
    this.drawCoil(g, 8, this.lead1, this.lead2, v1, v2);
    if (this.showValues()) {
      const s = CircuitElm.getShortUnitText(this.inductance, "H");
      this.drawValues(g, s, hs);
    }
    this.doDots(g);
    this.drawPosts(g);
  }
  reset() {
    this.curcount = 0;
    this.current = this.initialCurrent;
    this.ind.resetTo(this.initialCurrent);
  }
  // The inductor companion model is stamped between nodes 0 and getIndNode2().
  // For an ideal inductor, that's node 1.  If a series resistance is set,
  // it's an internal node 2, and a resistor is placed between nodes 2 and 1,
  // modeled on CapacitorElm's seriesResistance handling.  This is derived
  // from seriesResistance rather than cached at stamp() time, because
  // calculateCurrent() can run (from setNodeVoltage()) after the resistance
  // is edited but before the circuit is re-stamped.
  getIndNode2() {
    return this.seriesResistance > 0 ? 2 : 1;
  }
  stamp() {
    this.ind.stamp(this.nodes[0], this.nodes[this.getIndNode2()]);
    if (this.seriesResistance > 0)
      CircuitElm.sim.stampResistor(this.nodes[1], this.nodes[2], this.seriesResistance);
  }
  startIteration() {
    this.ind.startIteration(this.nodes[0].v - this.nodes[this.getIndNode2()].v);
  }
  nonLinear() {
    return this.ind.nonLinear();
  }
  calculateCurrent() {
    const voltdiff = this.nodes[0].v - this.nodes[this.getIndNode2()].v;
    this.current = this.ind.calculateCurrent(voltdiff);
  }
  doStep() {
    const voltdiff = this.nodes[0].v - this.nodes[this.getIndNode2()].v;
    this.ind.doStep(voltdiff);
  }
  getInternalNodeCount() {
    return this.seriesResistance > 0 ? 1 : 0;
  }
  getInfo(arr) {
    arr[0] = this.saturationCurrent > 0 ? "inductor (sat)" : "inductor";
    this.getBasicInfo(arr);
    arr[3] = "L = " + CircuitElm.getUnitText(this.inductance, "H");
    arr[4] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
    if (this.saturationCurrent > 0) {
      const lEff = this.ind.calcEffectiveInductance(this.current);
      arr[5] = "Leff = " + CircuitElm.getUnitText(lEff, "H");
      arr[6] = "Isat = " + CircuitElm.getUnitText(this.saturationCurrent, "A");
    }
  }
  getScopeText(v) {
    return Locale.LS("inductor") + ", " + CircuitElm.getUnitText(this.inductance, "H");
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Inductance (H)", this.inductance, 0.01, 10).setPositive();
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox(
        "Trapezoidal Approximation",
        this.ind.isTrapezoidal()
      );
      return ei;
    }
    if (n === 2)
      return new EditInfo("Initial Current (on Reset) (A)", this.initialCurrent);
    if (n === 3)
      return new EditInfo("Saturation Current (A) (0=none)", this.saturationCurrent);
    if (n === 4)
      return new EditInfo("Series Resistance", this.seriesResistance);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.inductance = ei.value;
    if (n === 1) {
      if (ei.checkbox.getState())
        this.flags &= -3;
      else
        this.flags |= Inductor.FLAG_BACK_EULER;
    }
    if (n === 2)
      this.initialCurrent = ei.value;
    if (n === 3) {
      if (ei.value >= 0)
        this.saturationCurrent = ei.value;
      else
        ei.setError("must be >= 0");
    }
    if (n === 4) {
      if (ei.value >= 0) {
        this.seriesResistance = ei.value;
        this.allocNodes();
      } else
        ei.setError("must be >= 0");
    }
    this.ind.setup(this.inductance, this.current, this.flags, this.saturationCurrent);
  }
  getShortcut() {
    return "L".charCodeAt(0);
  }
  getInductance() {
    return this.inductance;
  }
  setInductance(l) {
    this.inductance = l;
    this.ind.setup(this.inductance, this.current, this.flags, this.saturationCurrent);
  }
  setSaturationCurrent(isat) {
    this.saturationCurrent = isat;
    this.ind.setup(this.inductance, this.current, this.flags, this.saturationCurrent);
  }
  getSaturationCurrent() {
    return this.saturationCurrent;
  }
  getSeriesResistance() {
    return this.seriesResistance;
  }
  setSeriesResistance(r) {
    this.seriesResistance = r;
    this.allocNodes();
  }
  isIdealInductor() {
    return this.seriesResistance === 0;
  }
  validate() {
    const fpi = new FindPathInfo(FindPathInfo.INDUCT, this, this.getNode(1), CircuitElm.sim);
    if (!fpi.findPath(this.getNode(0)))
      this.reset();
    return true;
  }
}

class ResistorElm extends CircuitElm {
  resistance;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.resistance = 1e3;
    } else {
      super(xa, ya, xb, yb, f);
      this.resistance = parseFloatStrict(st.nextToken());
    }
  }
  isResistorElm() {
    return true;
  }
  getDumpType() {
    return "r".charCodeAt(0);
  }
  dump() {
    return super.dump() + " " + this.resistance;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "r", this.resistance);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.resistance = xml.parseDoubleAttr("r", this.resistance);
  }
  ps3 = new Point();
  ps4 = new Point();
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    this.ps3 = new Point();
    this.ps4 = new Point();
  }
  draw(g) {
    let i;
    let hs = 6;
    const v1 = this.nodes[0].v;
    const v2 = this.nodes[1].v;
    this.setBbox(this.point1, this.point2, hs);
    this.draw2Leads(g);
    const len = CircuitElm.distance(this.lead1, this.lead2);
    g.context.save();
    g.context.lineWidth = 3;
    g.context.transform(
      (this.lead2.x - this.lead1.x) / len,
      (this.lead2.y - this.lead1.y) / len,
      -(this.lead2.y - this.lead1.y) / len,
      (this.lead2.x - this.lead1.x) / len,
      this.lead1.x,
      this.lead1.y
    );
    if (CircuitElm.app.menus.voltsCheckItem.getState()) {
      const grad = g.context.createLinearGradient(0, 0, len, 0);
      grad.addColorStop(0, this.getVoltageColor(g, v1).getHexValue());
      grad.addColorStop(1, this.getVoltageColor(g, v2).getHexValue());
      g.context.strokeStyle = grad;
    } else
      this.setPowerColor(g, true);
    if (this.dn < 30)
      hs = 2;
    if (!this.showEuroResistors()) {
      g.context.beginPath();
      g.context.moveTo(0, 0);
      for (i = 0; i < 4; i++) {
        g.context.lineTo((1 + 4 * i) * len / 16, hs);
        g.context.lineTo((3 + 4 * i) * len / 16, -hs);
      }
      g.context.lineTo(len, 0);
      g.context.stroke();
    } else {
      g.context.strokeRect(0, -hs, len, 2 * hs);
    }
    g.context.restore();
    if (this.showValues()) {
      const s = CircuitElm.getShortUnitText(this.resistance, this.showOhmSymbol() ? Locale.ohmString : "");
      this.drawValues(g, s, hs + 2);
    }
    this.doDots(g);
    this.drawPosts(g);
  }
  addRoutingObstacle(wr) {
    this.addRoutingObstacleWithLeads(wr, 6);
  }
  calculateCurrent() {
    this.current = (this.nodes[0].v - this.nodes[1].v) / this.resistance;
  }
  stamp() {
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
  }
  getInfo(arr) {
    arr[0] = "resistor";
    this.getBasicInfo(arr);
    arr[3] = "R = " + CircuitElm.getUnitText(this.resistance, Locale.ohmString);
    arr[4] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  getScopeText(v) {
    return Locale.LS("resistor") + ", " + CircuitElm.getUnitText(this.resistance, Locale.ohmString);
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Resistance (ohms)", this.resistance, 0, 0);
    return null;
  }
  setEditValue(n, ei) {
    this.resistance = ei.value <= 0 ? 1e-9 : ei.value;
  }
  getShortcut() {
    return "r".charCodeAt(0);
  }
  getResistance() {
    return this.resistance;
  }
  setResistance(r) {
    this.resistance = r;
  }
}

class CrystalElm extends CompositeElm {
  static FLAG_SHOW_FREQ = 2;
  seriesCapacitance = 0;
  parallelCapacitance = 0;
  inductance = 0;
  resistance = 0;
  plate1 = [];
  plate2 = [];
  sandwichPoints = [];
  static modelString = "CapacitorElm 1 2\rCapacitorElm 1 3\rInductorElm 3 4\rResistorElm 4 2";
  static modelExternalNodes = [1, 2];
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.loadComposite(null, CrystalElm.modelString, CrystalElm.modelExternalNodes);
      this.buildCompNodeList();
      this.allocNodes();
      this.flags = CrystalElm.FLAG_SHOW_FREQ;
      this.parallelCapacitance = 287e-13;
      this.seriesCapacitance = 1e-13;
      this.inductance = 25e-4;
      this.resistance = 6.4;
      this.initCrystal();
    } else {
      super(xa, ya, xb, yb, f);
      this.loadComposite(st, CrystalElm.modelString, CrystalElm.modelExternalNodes);
      this.buildCompNodeList();
      this.allocNodes();
      const c1 = this.compElmList[0];
      this.parallelCapacitance = c1.getCapacitance();
      const c2 = this.compElmList[1];
      this.seriesCapacitance = c2.getCapacitance();
      const i1 = this.compElmList[2];
      this.inductance = i1.getInductance();
      const r1 = this.compElmList[3];
      this.resistance = r1.getResistance();
      this.initCrystal();
    }
  }
  initCrystal() {
    this.compElmList[0].setCapacitance(this.parallelCapacitance);
    this.compElmList[1].setCapacitance(this.seriesCapacitance);
    this.compElmList[2].setInductance(this.inductance);
    this.compElmList[3].setResistance(this.resistance);
  }
  getDumpType() {
    return 412;
  }
  getXmlDumpType() {
    return "cr";
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "pc", this.parallelCapacitance);
    CircuitXMLSerializer.dumpAttr(elem, "sc", this.seriesCapacitance);
    CircuitXMLSerializer.dumpAttr(elem, "in", this.inductance);
    CircuitXMLSerializer.dumpAttr(elem, "r", this.resistance);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.resistance = xml.parseDoubleAttr("r", this.resistance);
    this.inductance = xml.parseDoubleAttr("in", this.inductance);
    this.parallelCapacitance = xml.parseDoubleAttr("pc", this.parallelCapacitance);
    this.seriesCapacitance = xml.parseDoubleAttr("sc", this.seriesCapacitance);
    this.initCrystal();
  }
  setPoints() {
    super.setPoints();
    const f = (this.dn / 2 - 10) / this.dn;
    this.lead1 = this.interpPoint(this.point1, this.point2, f);
    this.lead2 = this.interpPoint(this.point1, this.point2, 1 - f);
    this.plate1 = this.newPointArray(2);
    this.plate2 = this.newPointArray(2);
    this.interpPoint2(this.point1, this.point2, this.plate1[0], this.plate1[1], f, 8);
    this.interpPoint2(this.point1, this.point2, this.plate2[0], this.plate2[1], 1 - f, 8);
    this.sandwichPoints = this.newPointArray(4);
    const f2 = (this.dn / 2 - 5) / this.dn;
    this.interpPoint2(this.point1, this.point2, this.sandwichPoints[0], this.sandwichPoints[1], f2, 10);
    this.interpPoint2(this.point1, this.point2, this.sandwichPoints[3], this.sandwichPoints[2], 1 - f2, 10);
    this.setPost(0, this.point1);
    this.setPost(1, this.point2);
  }
  draw(g) {
    const hs = 12;
    this.setBbox(this.point1, this.point2, hs);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.setPowerColor(g, false);
    CircuitElm.drawThickLine(g, this.plate1[0], this.plate1[1]);
    if (this.showPower())
      g.setColor(Color.gray);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.point2, this.lead2);
    this.setPowerColor(g, false);
    CircuitElm.drawThickLine(g, this.plate2[0], this.plate2[1]);
    this.setVoltageColor(g, 0.5 * (this.nodes[0].v + this.nodes[1].v));
    for (let i = 0; i !== 4; i++)
      CircuitElm.drawThickLine(g, this.sandwichPoints[i], this.sandwichPoints[(i + 1) % 4]);
    this.updateDotCount();
    if (!this.isCreating()) {
      this.drawDots(g, this.point1, this.lead1, this.curcount);
      this.drawDots(g, this.point2, this.lead2, -this.curcount);
    }
    this.drawPosts(g);
    if (this.hasFlag(CrystalElm.FLAG_SHOW_FREQ)) {
      const fs = 1 / (Math.sqrt(this.inductance * this.seriesCapacitance) * Math.PI * 2);
      const s = CircuitElm.getShortUnitText(fs, "Hz");
      this.drawValues(g, s, hs);
    }
  }
  stepFinished() {
    super.stepFinished();
    this.current = this.getCurrentIntoNode(1);
  }
  getInfo(arr) {
    arr[0] = "crystal";
    this.getBasicInfo(arr);
    const fs = 1 / (Math.sqrt(this.inductance * this.seriesCapacitance) * Math.PI * 2);
    const cSer = this.parallelCapacitance * this.seriesCapacitance / (this.parallelCapacitance + this.seriesCapacitance);
    const fp = 1 / (Math.sqrt(this.inductance * cSer) * Math.PI * 2);
    const q = 2 * Math.PI * fs * this.inductance / this.resistance;
    arr[3] = "fs = " + CircuitElm.getUnitText(fs, "Hz");
    arr[4] = "fp = " + CircuitElm.getUnitText(fp, "Hz");
    arr[5] = "Q = " + CircuitElm.getUnitText(q, "");
    arr[6] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  canViewInScope() {
    return true;
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo(EditInfo.makeLink("crystal.html", "Parallel Capacitance"), this.parallelCapacitance).setPositive();
    if (n === 1)
      return new EditInfo("Series Capacitance (F)", this.seriesCapacitance).setPositive();
    if (n === 2)
      return new EditInfo("Inductance (H)", this.inductance, 0, 0).setPositive();
    if (n === 3)
      return new EditInfo("Resistance (" + Locale.ohmString + ")", this.resistance, 0, 0).setPositive();
    if (n === 4) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Show Frequency", this.hasFlag(CrystalElm.FLAG_SHOW_FREQ));
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0) this.parallelCapacitance = ei.value;
    if (n === 1 && ei.value > 0) this.seriesCapacitance = ei.value;
    if (n === 2 && ei.value > 0) this.inductance = ei.value;
    if (n === 3 && ei.value > 0) this.resistance = ei.value;
    if (n === 4)
      this.flags = ei.changeFlag(this.flags, CrystalElm.FLAG_SHOW_FREQ);
    this.initCrystal();
  }
}

class CurrentElm extends CircuitElm {
  currentValue = 0.01;
  // Compliance voltage. 0 = unlimited (ideal current source).
  maxVoltage = 0;
  lastVoltDiff = 0;
  broken = false;
  arrow = null;
  ashaft1 = null;
  ashaft2 = null;
  center = null;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.currentValue = 0.01;
      this.maxVoltage = 0;
    } else {
      super(xa, ya, xb, yb, f);
      try {
        this.currentValue = parseFloatStrict(st.nextToken());
        this.maxVoltage = parseFloatStrict(st.nextToken());
      } catch (_e) {
      }
      if (this.currentValue === 0)
        this.currentValue = 0.01;
    }
  }
  isVoltageLimited() {
    return this.maxVoltage > 0;
  }
  nonLinear() {
    return this.isVoltageLimited();
  }
  reset() {
    super.reset();
    this.lastVoltDiff = 0;
  }
  dump() {
    return super.dump() + " " + this.currentValue + " " + this.maxVoltage;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "cu", this.currentValue);
    if (this.maxVoltage > 0)
      CircuitXMLSerializer.dumpAttr(elem, "mv", this.maxVoltage);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.currentValue = xml.parseDoubleAttr("cu", this.currentValue);
    this.maxVoltage = xml.parseDoubleAttr("mv", 0);
  }
  getDumpType() {
    return "i".charCodeAt(0);
  }
  isCurrentElm() {
    return true;
  }
  setPoints() {
    super.setPoints();
    this.calcLeads(26);
    this.ashaft1 = this.interpPoint(this.lead1, this.lead2, 0.25);
    this.ashaft2 = this.interpPoint(this.lead1, this.lead2, 0.6);
    this.center = this.interpPoint(this.lead1, this.lead2, 0.5);
    const p2 = this.interpPoint(this.lead1, this.lead2, 0.75);
    this.arrow = this.calcArrow(this.center, p2, 4, 4);
  }
  draw(g) {
    const cr = 12;
    this.draw2Leads(g);
    this.setVoltageColor(g, (this.nodes[0].v + this.nodes[1].v) / 2);
    this.setPowerColor(g, false);
    CircuitElm.drawThickCircle(g, this.center.x, this.center.y, cr);
    CircuitElm.drawThickLine(g, this.ashaft1, this.ashaft2);
    g.fillPolygon(this.arrow);
    this.setBbox(this.point1, this.point2, cr);
    this.doDots(g);
    if (this.showValues() && this.current !== 0) {
      const s = CircuitElm.getShortUnitText(this.current, "A");
      if (this.dx === 0 || this.dy === 0)
        this.drawValues(g, s, cr);
    }
    this.drawPosts(g);
  }
  // analyzeCircuit determines if current source has a path or if it's broken
  setBroken(b) {
    this.broken = b && !this.isVoltageLimited();
  }
  // we defer stamping current sources until we can tell if they have a current path or not
  stamp() {
    const sim = SimulationManager.theSim;
    if (this.broken) {
      sim.stampResistor(this.nodes[0], this.nodes[1], 1e8);
      this.current = 0;
    } else if (this.isVoltageLimited()) {
      sim.stampNonLinear(this.nodes[0]);
      sim.stampNonLinear(this.nodes[1]);
    } else {
      sim.stampCurrentSource(this.nodes[0], this.nodes[1], this.currentValue);
      this.current = this.currentValue;
    }
  }
  // Smooth voltage compliance via tanh-shaped saturation.
  // Transition starts at 0.95*maxVoltage and ends at maxVoltage:
  //   vd < 0.95*Vmax  ->  i ~= currentValue  (tanh arg ~= -2.5)
  //   vd > Vmax       ->  i ~= 0              (tanh arg ~= +2.5)
  // tanh is centered at 0.975*Vmax with scale vt = vWidth/5.
  doStep() {
    if (this.broken || !this.isVoltageLimited())
      return;
    const sim = SimulationManager.theSim;
    let vd = this.nodes[1].v - this.nodes[0].v;
    const vStart = 0.95 * this.maxVoltage;
    const vWidth = this.maxVoltage - vStart;
    const vMid = (vStart + this.maxVoltage) / 2;
    const vt = Math.max(vWidth / 5, 1e-3);
    if (this.lastVoltDiff < vStart && vd > vStart) {
      vd = vStart;
      sim.converged = false;
    } else if (this.lastVoltDiff > this.maxVoltage && vd < this.maxVoltage) {
      vd = this.maxVoltage;
      sim.converged = false;
    } else if (this.lastVoltDiff >= vStart && this.lastVoltDiff <= this.maxVoltage) {
      const maxStep = Math.max(vWidth / 4, 0.01);
      if (vd > this.lastVoltDiff + maxStep) {
        vd = this.lastVoltDiff + maxStep;
        sim.converged = false;
      } else if (vd < this.lastVoltDiff - maxStep) {
        vd = this.lastVoltDiff - maxStep;
        sim.converged = false;
      }
    }
    this.lastVoltDiff = vd;
    const arg = (vd - vMid) / vt;
    const tanhArg = Math.tanh(arg);
    const i = this.currentValue * 0.5 * (1 - tanhArg);
    const sech2 = 1 - tanhArg * tanhArg;
    const g = -this.currentValue * 0.5 * sech2 / vt * vd;
    const absG = Math.abs(g) + 1e-6;
    sim.stampResistor(this.nodes[0], this.nodes[1], 1 / absG);
    sim.stampCurrentSource(this.nodes[0], this.nodes[1], i - g * vd);
    this.current = i;
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Current (A)", this.currentValue, 0, 0.1);
    if (n === 1)
      return new EditInfo("Max Voltage (V, 0=unlimited)", this.maxVoltage, 0, 0).setUnitStep();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.currentValue = ei.value;
    if (n === 1 && ei.value >= 0)
      this.maxVoltage = ei.value;
  }
  getInfo(arr) {
    arr[0] = "current source";
    let i = this.getBasicInfo(arr);
    arr[i++] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
    if (this.isVoltageLimited())
      arr[i++] = "Vmax = " + CircuitElm.getVoltageText(this.maxVoltage);
  }
  getVoltageDiff() {
    return this.nodes[1].v - this.nodes[0].v;
  }
  getPower() {
    return -this.getVoltageDiff() * this.current;
  }
  validate() {
    const fpi = new FindPathInfo(FindPathInfo.INDUCT, this, this.getNode(1), SimulationManager.theSim);
    this.setBroken(!fpi.findPath(this.getNode(0)));
    return true;
  }
}

class CustomLogicElm extends ChipElm {
  modelName;
  postCount = 0;
  inputCount = 0;
  outputCount = 0;
  model;
  lastValues = [];
  patternValues = new Array(26).fill(false);
  highImpedance = [];
  static lastModelName = "default";
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.modelName = CustomLogicElm.lastModelName;
      this.setupPins();
    } else {
      super(xa, ya, xb, yb, f, st);
      this.modelName = CustomLogicModel.unescape(st.nextToken());
      this.updateModels();
      for (let i = 0; i !== this.getPostCount(); i++) {
        if (this.pins[i].output) {
          const v = parseFloatStrict(st.nextToken());
          this.pins[i].value = v > this.getThreshold();
        }
      }
    }
  }
  dumpXml(doc, elem) {
    if (!this.model.dumped)
      this.model.dumpXml(doc);
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "mo", this.modelName);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.modelName = xml.parseStringAttr("mo", null) ?? this.modelName;
    this.updateModels();
  }
  updateModels() {
    this.model = CustomLogicModel.getModelWithNameOrCopy(this.modelName, this.model ?? null);
    this.setupPins();
    this.allocNodes();
    this.setPoints();
  }
  setupPins() {
    if (this.modelName == null) {
      this.postCount = this.bits;
      this.allocNodes();
      return;
    }
    this.model = CustomLogicModel.getModelWithName(this.modelName);
    this.inputCount = this.model.inputs.length;
    this.outputCount = this.model.outputs.length;
    this.sizeY = this.inputCount > this.outputCount ? this.inputCount : this.outputCount;
    if (this.sizeY === 0)
      this.sizeY = 1;
    this.sizeX = 2;
    this.postCount = this.inputCount + this.outputCount;
    this.pins = new Array(this.postCount);
    for (let i = 0; i !== this.inputCount; i++) {
      this.pins[i] = new Pin(this, i, ChipElm.SIDE_W, this.model.inputs[i]);
      this.pins[i].fixName();
    }
    for (let i = 0; i !== this.outputCount; i++) {
      this.pins[i + this.inputCount] = new Pin(this, i, ChipElm.SIDE_E, this.model.outputs[i]);
      this.pins[i + this.inputCount].output = true;
      this.pins[i + this.inputCount].fixName();
    }
    this.lastValues = new Array(this.postCount).fill(false);
    this.patternValues = new Array(26).fill(false);
    this.highImpedance = new Array(this.postCount).fill(false);
  }
  getPostCount() {
    return this.postCount;
  }
  getVoltageSourceCount() {
    return this.outputCount;
  }
  // keep track of whether we have any tri-state outputs.  if not, then we can simplify things quite a bit, making the simulation faster
  hasTriState() {
    return this.model == null ? false : this.model.triState;
  }
  nonLinear() {
    return this.hasTriState();
  }
  getInternalNodeCount() {
    return this.hasTriState() ? this.outputCount : 0;
  }
  // a tri-state output's voltage source drives an internal node, which connects to the
  // output pin through a resistor, so they have to be in the same matrix
  getMatrixConnection(n1, n2) {
    if (this.hasTriState()) {
      for (let i = this.inputCount; i !== this.postCount; i++)
        if (this.comparePair(n1, n2, i, i + this.outputCount))
          return true;
    }
    return false;
  }
  stamp() {
    const add = this.hasTriState() ? this.outputCount : 0;
    for (let i = 0; i !== this.getPostCount(); i++) {
      const p = this.pins[i];
      if (p.output) {
        CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[i + add], p.voltSource);
        if (this.hasTriState()) {
          CircuitElm.sim.stampNonLinear(this.nodes[i + add]);
          CircuitElm.sim.stampNonLinear(this.nodes[i]);
        }
      }
    }
  }
  doStep() {
    const add = this.hasTriState() ? this.outputCount : 0;
    for (let i = 0; i !== this.getPostCount(); i++) {
      const p = this.pins[i];
      if (p.output) {
        CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[i + add], p.voltSource, p.value ? this.highVoltage : 0);
        if (this.hasTriState())
          CircuitElm.sim.stampResistor(this.nodes[i + add], this.nodes[i], this.highImpedance[i] ? 1e8 : 1e-3);
      }
    }
  }
  execute() {
    for (let i = 0; i !== this.model.rulesLeft.length; i++) {
      const rl = this.model.rulesLeft[i];
      let j;
      for (j = 0; j !== rl.length; j++) {
        const x = rl.charAt(j);
        if (x === "0" || x === "1") {
          if (this.pins[j].value === (x === "1"))
            continue;
          break;
        }
        if (x === "?")
          continue;
        if (x === "+") {
          if (this.pins[j].value && !this.lastValues[j])
            continue;
          break;
        }
        if (x === "-") {
          if (!this.pins[j].value && this.lastValues[j])
            continue;
          break;
        }
        if (x >= "a" && x <= "z") {
          this.patternValues[x.charCodeAt(0) - "a".charCodeAt(0)] = this.pins[j].value;
          continue;
        }
        if (x >= "A" && x <= "Z") {
          if (this.patternValues[x.charCodeAt(0) - "A".charCodeAt(0)] !== this.pins[j].value)
            break;
          continue;
        }
      }
      if (j !== rl.length)
        continue;
      const rr = this.model.rulesRight[i];
      for (j = 0; j !== rr.length; j++) {
        const x = rr.charAt(j);
        this.highImpedance[j + this.inputCount] = false;
        if (x >= "a" && x <= "z")
          this.pins[j + this.inputCount].value = this.patternValues[x.charCodeAt(0) - "a".charCodeAt(0)];
        else if (x === "_")
          this.highImpedance[j + this.inputCount] = true;
        else
          this.pins[j + this.inputCount].value = x === "1";
      }
      break;
    }
    for (let j = 0; j !== this.postCount; j++)
      this.lastValues[j] = this.pins[j].value;
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Model Name", 0, -1, -1);
      ei.text = this.modelName;
      ei.disallowSliders();
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Edit Model") };
      return ei;
    }
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      const newModelName = ei.textf.value;
      if (this.modelName === newModelName)
        return;
      this.modelName = CustomLogicElm.lastModelName = ei.textf.value;
      this.model = CustomLogicModel.getModelWithNameOrCopy(this.modelName, this.model);
      this.setupPins();
      this.allocNodes();
      this.setPoints();
      return;
    }
    if (n === 1) {
      const editDialog = new EditDialog(this.model, CirSim.theApp);
      CirSim.customLogicEditDialog = editDialog;
      editDialog.show(320);
      return;
    }
  }
  getDumpType() {
    return 208;
  }
  getXmlDumpType() {
    return "cl";
  }
  getElmType() {
    return "custom logic";
  }
  getInfo(arr) {
    super.getInfo(arr);
    arr[0] = this.model.infoText;
  }
}

class CustomTransformerElm extends CircuitElm {
  coilCurrents;
  coilInductances;
  coilCurCounts;
  coilCurSourceValues;
  coilPolarities;
  nodeCurrents;
  nodeCurCounts;
  static FLAG_FLIP = 1;
  flip;
  // node number n of first node of each coil (second node = n+1)
  coilNodes;
  coilCount = 0;
  nodeCount = 0;
  // number of primary coils
  primaryCoils = 0;
  nodePoints;
  nodeTaps;
  ptCore;
  description;
  inductance;
  couplingCoef;
  needDots = false;
  dots = null;
  width;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.width = 32;
      this.inductance = parseFloatStrict(st.nextToken());
      this.couplingCoef = parseFloatStrict(st.nextToken());
      this.description = CustomLogicModel.unescape(st.nextToken());
      this.coilCount = parseIntStrict(st.nextToken());
      this.coilCurrents = new Array(this.coilCount).fill(0);
      for (let i = 0; i !== this.coilCount; i++)
        this.coilCurrents[i] = parseFloatStrict(st.nextToken());
      this.noDiagonal = true;
      this.parseDescription(this.description);
    } else {
      this.inductance = 4;
      this.width = 32;
      this.noDiagonal = true;
      this.couplingCoef = 0.999;
      this.description = "1,1:1";
      this.parseDescription(this.description);
    }
  }
  drag(xx, yy) {
    xx = this.snapGrid(xx);
    yy = this.snapGrid(yy);
    if (xx === this.x)
      yy = this.y;
    this.x2 = xx;
    this.y2 = yy;
    this.setPoints();
  }
  getDumpType() {
    return 406;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "in", this.inductance);
    CircuitXMLSerializer.dumpAttr(elem, "cc", this.couplingCoef);
    CircuitXMLSerializer.dumpAttr(elem, "ds", this.description);
    CircuitXMLSerializer.dumpAttr(elem, "nc", this.coilCount);
  }
  dumpXmlState(doc, elem) {
    let s = "";
    for (let i = 0; i !== this.coilCount; i++) {
      if (i > 0) s += " ";
      s += this.coilCurrents[i];
    }
    CircuitXMLSerializer.dumpAttr(elem, "ci", s);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.inductance = xml.parseDoubleAttr("in", this.inductance);
    this.couplingCoef = xml.parseDoubleAttr("cc", this.couplingCoef);
    this.description = xml.parseStringAttr("ds", this.description) ?? this.description;
    this.coilCount = xml.parseIntAttr("nc", this.coilCount);
    this.coilCurrents = new Array(this.coilCount).fill(0);
    const ci = xml.parseStringAttr("ci", null);
    if (ci !== null) {
      const st = new StringTokenizer(ci, " ");
      for (let i = 0; i !== this.coilCount && st.hasMoreTokens(); i++)
        this.coilCurrents[i] = parseFloatStrict(st.nextToken());
    }
    this.parseDescription(this.description);
  }
  parseDescription(desc, ei) {
    if (desc === void 0)
      desc = this.description;
    const tokens = this.tokenizeDesc(desc);
    this.coilCount = this.nodeCount = 0;
    for (const s of tokens) {
      if (s === "+")
        this.nodeCount--;
      if (s === "," || s === "+" || s === ":")
        continue;
      this.nodeCount += 2;
      this.coilCount++;
    }
    if (this.coilCount === 0) {
      if (ei !== void 0)
        ei.setError("no coils defined");
      return false;
    }
    this.coilNodes = new Array(this.coilCount).fill(0);
    this.coilInductances = new Array(this.coilCount).fill(0);
    if (this.coilCurrents == null || this.coilCurrents.length !== this.coilCount)
      this.coilCurrents = new Array(this.coilCount).fill(0);
    this.coilCurCounts = new Array(this.coilCount).fill(0);
    this.coilCurSourceValues = new Array(this.coilCount).fill(0);
    this.coilPolarities = new Array(this.coilCount).fill(0);
    this.nodePoints = this.newPointArray(this.nodeCount);
    this.nodeTaps = this.newPointArray(this.nodeCount);
    this.nodeCurrents = new Array(this.nodeCount).fill(0);
    this.nodeCurCounts = new Array(this.nodeCount).fill(0);
    let nodeNum = 0;
    let coilNum = 0;
    this.primaryCoils = 0;
    let secondary = false;
    this.needDots = false;
    let ti = 0;
    while (true) {
      const tok = tokens[ti++];
      let n = 0;
      const parsed = parseFloatStrict(tok);
      if (isNaN(parsed)) {
        if (ei !== void 0)
          ei.setError("expected number, got '" + tok + "'");
        return false;
      }
      n = parsed;
      if (n === 0) {
        if (ei !== void 0)
          ei.setError("turns ratio cannot be zero");
        return false;
      }
      this.coilNodes[coilNum] = nodeNum;
      this.coilInductances[coilNum] = n * n * this.inductance;
      this.coilPolarities[coilNum] = 1;
      if (n < 0) {
        this.coilPolarities[coilNum] = -1;
        this.needDots = true;
      }
      nodeNum += 2;
      coilNum++;
      if (!secondary)
        this.primaryCoils = coilNum;
      if (ti >= tokens.length)
        break;
      const sep = tokens[ti++];
      if (sep === ",")
        continue;
      if (sep === "+") {
        nodeNum--;
        continue;
      }
      if (sep === ":") {
        if (secondary) {
          if (ei !== void 0)
            ei.setError("only one ':' separator allowed");
          return false;
        }
        secondary = true;
        continue;
      }
      if (ei !== void 0)
        ei.setError("unexpected '" + sep + "'");
      return false;
    }
    this.allocNodes();
    this.setPoints();
    this.xformMatrix = null;
    return true;
  }
  // Split description string on delimiters, keeping the delimiters as tokens
  tokenizeDesc(desc) {
    const result = [];
    let cur = "";
    for (const ch of desc) {
      if (ch === "," || ch === ":" || ch === "+") {
        if (cur.length > 0) {
          result.push(cur);
          cur = "";
        }
        result.push(ch);
      } else {
        cur += ch;
      }
    }
    if (cur.length > 0) result.push(cur);
    return result;
  }
  isTrapezoidal() {
    return (this.flags & Inductor.FLAG_BACK_EULER) === 0;
  }
  draw(g) {
    for (let i = 0; i !== this.getPostCount(); i++) {
      this.setVoltageColor(g, this.nodes[i].v);
      CircuitElm.drawThickLine(g, this.nodePoints[i], this.nodeTaps[i]);
    }
    for (let i = 0; i !== this.coilCount; i++) {
      const n = this.coilNodes[i];
      this.setVoltageColor(g, this.nodes[n].v);
      this.setPowerColor(g, this.coilCurrents[i] * (this.nodes[n].v - this.nodes[n + 1].v));
      this.drawCoil(
        g,
        i >= this.primaryCoils ? -6 * this.flip : 6 * this.flip,
        this.nodeTaps[n],
        this.nodeTaps[n + 1],
        this.nodes[n].v,
        this.nodes[n + 1].v
      );
      if (this.dots !== null) {
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
        g.fillOval(this.dots[i].x - 2, this.dots[i].y - 2, 5, 5);
      }
    }
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    for (let i = 0; i !== 2; i++) {
      CircuitElm.drawThickLine(g, this.ptCore[i], this.ptCore[i + 2]);
    }
    for (let i = 0; i !== this.coilCount; i++) {
      this.coilCurCounts[i] = this.updateDotCountImpl(this.coilCurrents[i], this.coilCurCounts[i]);
      const ni = this.coilNodes[i];
      this.drawDots(g, this.nodeTaps[ni], this.nodeTaps[ni + 1], this.coilCurCounts[i]);
    }
    for (let i = 0; i !== this.nodeCount; i++) {
      this.nodeCurCounts[i] = this.updateDotCountImpl(this.nodeCurrents[i], this.nodeCurCounts[i]);
      this.drawDots(g, this.nodePoints[i], this.nodeTaps[i], this.nodeCurCounts[i]);
    }
    this.drawPosts(g);
    this.setBbox(this.nodePoints[0], this.nodePoints[this.nodeCount - 1], 0);
    this.adjustBbox(this.ptCore[0], this.ptCore[3]);
  }
  setPoints() {
    super.setPoints();
    this.point2.y = this.point1.y;
    this.flip = this.hasFlag(CustomTransformerElm.FLAG_FLIP) ? -1 : 1;
    const primaryNodes = this.primaryCoils === this.coilCount ? this.nodeCount : this.coilNodes[this.primaryCoils];
    this.dn = Math.abs(this.point1.x - this.point2.x);
    const ce = 0.5 - 12 / this.dn;
    const cd = 0.5 - 2 / this.dn;
    let maxWidth = 0;
    for (let step = 0; step !== 2; step++) {
      let c = 0;
      let offset = 0;
      for (let i = 0; i !== this.nodeCount; i++) {
        if (i === primaryNodes)
          offset = 0;
        if (step === 1) {
          if (i === primaryNodes - 1 || i === this.nodeCount - 1)
            offset = maxWidth;
          this.interpPoint(this.point1, this.point2, this.nodePoints[i], i < primaryNodes ? 0 : 1, -offset * this.flip);
          this.interpPoint(this.point1, this.point2, this.nodeTaps[i], i < primaryNodes ? ce : 1 - ce, -offset * this.flip);
        }
        maxWidth = Math.max(maxWidth, offset);
        const nn = c < this.coilCount ? this.coilNodes[c] : -1;
        if (nn === i) {
          c++;
          offset += this.width;
        } else {
          offset += 16;
        }
      }
    }
    this.ptCore = this.newPointArray(4);
    for (let i = 0; i !== 4; i += 2) {
      const h = i === 2 ? -maxWidth * this.flip : 0;
      this.interpPoint(this.point1, this.point2, this.ptCore[i], cd, h);
      this.interpPoint(this.point1, this.point2, this.ptCore[i + 1], 1 - cd, h);
    }
    if (this.needDots) {
      this.dots = new Array(this.coilCount);
      const dotp = Math.abs(7 / this.width);
      for (let i = 0; i !== this.coilCount; i++) {
        const n = this.coilNodes[i];
        this.dots[i] = this.interpPoint(
          this.nodeTaps[n],
          this.nodeTaps[n + 1],
          this.coilPolarities[i] > 0 ? dotp : 1 - dotp,
          i < this.primaryCoils ? -7 : 7
        );
      }
    } else {
      this.dots = null;
    }
  }
  getPost(n) {
    return this.nodePoints[n];
  }
  getPostCount() {
    return this.nodeCount;
  }
  reset() {
    for (let i = 0; i !== this.coilCount; i++)
      this.coilCurrents[i] = this.coilCurSourceValues[i] = this.coilCurCounts[i] = 0;
    for (let i = 0; i !== this.nodeCount; i++)
      this.nodes[i].v = this.nodeCurrents[i] = this.nodeCurCounts[i] = 0;
  }
  xformMatrix = null;
  stamp() {
    this.xformMatrix = [];
    for (let i = 0; i !== this.coilCount; i++) {
      this.xformMatrix[i] = new Array(this.coilCount).fill(0);
    }
    for (let i = 0; i !== this.coilCount; i++)
      this.xformMatrix[i][i] = this.coilInductances[i];
    for (let i = 0; i !== this.coilCount; i++)
      for (let j = 0; j !== i; j++)
        this.xformMatrix[i][j] = this.xformMatrix[j][i] = this.couplingCoef * Math.sqrt(this.coilInductances[i] * this.coilInductances[j]) * this.coilPolarities[i] * this.coilPolarities[j];
    SimulationManager.invertMatrix(this.xformMatrix, this.coilCount);
    const ts = this.isTrapezoidal() ? CircuitElm.sim.timeStep / 2 : CircuitElm.sim.timeStep;
    for (let i = 0; i !== this.coilCount; i++)
      for (let j = 0; j !== this.coilCount; j++) {
        this.xformMatrix[i][j] *= ts;
        const ni = this.coilNodes[i];
        const nj = this.coilNodes[j];
        if (i === j)
          CircuitElm.sim.stampConductance(this.nodes[ni], this.nodes[ni + 1], this.xformMatrix[i][i]);
        else
          CircuitElm.sim.stampVCCurrentSource(this.nodes[ni], this.nodes[ni + 1], this.nodes[nj], this.nodes[nj + 1], this.xformMatrix[i][j]);
      }
    for (let i = 0; i !== this.nodeCount; i++)
      CircuitElm.sim.stampRightSide(this.nodes[i]);
  }
  startIteration() {
    for (let i = 0; i !== this.coilCount; i++) {
      let val = this.coilCurrents[i];
      if (this.isTrapezoidal()) {
        for (let j = 0; j !== this.coilCount; j++) {
          const n = this.coilNodes[j];
          const voltdiff = this.nodes[n].v - this.nodes[n + 1].v;
          val += voltdiff * this.xformMatrix[i][j];
        }
      }
      this.coilCurSourceValues[i] = val;
    }
  }
  doStep() {
    for (let i = 0; i !== this.coilCount; i++) {
      const n = this.coilNodes[i];
      CircuitElm.sim.stampCurrentSource(this.nodes[n], this.nodes[n + 1], this.coilCurSourceValues[i]);
    }
  }
  calculateCurrent() {
    for (let i = 0; i !== this.nodeCount; i++)
      this.nodeCurrents[i] = 0;
    for (let i = 0; i !== this.coilCount; i++) {
      let val = this.coilCurSourceValues[i];
      if (this.xformMatrix !== null) {
        for (let j = 0; j !== this.coilCount; j++) {
          const n = this.coilNodes[j];
          const voltdiff = this.nodes[n].v - this.nodes[n + 1].v;
          val += voltdiff * this.xformMatrix[i][j];
        }
      }
      this.coilCurrents[i] = val;
      const ni = this.coilNodes[i];
      this.nodeCurrents[ni] += val;
      this.nodeCurrents[ni + 1] -= val;
    }
  }
  getCurrentIntoNode(n) {
    return -this.nodeCurrents[n];
  }
  getInfo(arr) {
    arr[0] = "transformer (custom)";
    arr[1] = "L = " + CircuitElm.getUnitText(this.inductance, "H");
    for (let i = 0; i !== this.coilCount; i++) {
      if (2 + i * 2 >= arr.length)
        break;
      const ni = this.coilNodes[i];
      arr[2 + i * 2] = "Vd" + (i + 1) + " = " + CircuitElm.getVoltageText(this.nodes[ni].v - this.nodes[ni + 1].v);
      arr[3 + i * 2] = "I" + (i + 1) + " = " + CircuitElm.getCurrentText(this.coilCurrents[i]);
    }
  }
  getConnection(n1, n2) {
    for (let i = 0; i !== this.coilCount; i++)
      if (this.comparePair(n1, n2, this.coilNodes[i], this.coilNodes[i] + 1))
        return true;
    return false;
  }
  // VCCS stamps couple all nodes, so they must all be in the same matrix
  getMatrixConnection(n1, n2) {
    return true;
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Base Inductance (H)", this.inductance, 0.01, 5).setPositive();
    if (n === 1) {
      const ei = new EditInfo(EditInfo.makeLink("customtransformer.html", "Description"), 0, -1, -1);
      ei.setErrorFieldName("Description");
      ei.text = this.description;
      ei.disallowSliders();
      return ei;
    }
    if (n === 2)
      return new EditInfo("Coupling Coefficient", this.couplingCoef, 0, 1).setDimensionless().setPositive();
    if (n === 3) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Trapezoidal Approximation", this.isTrapezoidal());
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0) {
      this.inductance = ei.value;
      this.parseDescription();
    }
    if (n === 1) {
      const s = ei.textf.value;
      if (s !== this.description) {
        if (!this.parseDescription(s, ei)) {
          this.parseDescription(this.description);
        } else {
          this.description = s;
        }
        this.setPoints();
      }
    }
    if (n === 2) {
      if (ei.value > 0 && ei.value < 1) {
        this.couplingCoef = ei.value;
        this.parseDescription();
      } else {
        ei.setError("must be > 0 and < 1");
      }
    }
    if (n === 3) {
      if (ei.checkbox.getState())
        this.flags &= -3;
      else
        this.flags |= Inductor.FLAG_BACK_EULER;
      this.parseDescription();
    }
  }
  flipX(c2, count) {
    this.flags ^= CustomTransformerElm.FLAG_FLIP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    this.flags ^= CustomTransformerElm.FLAG_FLIP;
    super.flipY(c2, count);
  }
  // vertical not supported
  canFlipXY() {
    return false;
  }
}

class DACElm extends ChipElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
    } else {
      super(xa, ya, xb, yb, f, st);
    }
  }
  getChipName() {
    return "DAC";
  }
  needsBits() {
    return true;
  }
  allowBus() {
    return true;
  }
  setupPins() {
    if (!this.bits)
      return;
    this.sizeX = 2;
    const bitsY = this.useBus() ? 1 : this.bits > 2 ? this.bits : 2;
    this.sizeY = bitsY > 2 ? bitsY : 2;
    this.pins = new Array(this.getPostCount());
    this.makeBitPins(this.bits, 0, ChipElm.SIDE_W, 0, "D", false, false, false);
    this.pins[this.bits] = new Pin(this, 0, ChipElm.SIDE_E, "O");
    this.pins[this.bits].output = true;
    this.pins[this.bits + 1] = new Pin(this, this.sizeY - 1, ChipElm.SIDE_E, "V+");
    this.allocNodes();
  }
  doStep() {
    let ival = 0;
    for (let i = 0; i !== this.bits; i++)
      if (this.nodes[i].v > this.getThreshold())
        ival |= 1 << i;
    const ivalmax = (1 << this.bits) - 1;
    const v = ival * this.nodes[this.bits + 1].v / ivalmax;
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[this.bits], this.pins[this.bits].voltSource, v);
  }
  getVoltageSourceCount() {
    return 1;
  }
  getPostCount() {
    return this.bits + 2;
  }
  getDumpType() {
    return 166;
  }
  // there's already a V+ pin, how does that relate to high logic voltage?  figure out later
  isDigitalChip() {
    return false;
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 2) {
        this.bits = Math.trunc(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be >= 2");
    }
  }
}

class DCMotorElm extends CircuitElm {
  ind;
  indInertia;
  resistance;
  inductance;
  K;
  Kb;
  J;
  b;
  gearRatio;
  tau;
  angle;
  speed = 0;
  coilCurrent = 0;
  inertiaCurrent = 0;
  voltSources = new Array(2);
  motorCenter;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.angle = CircuitElm.pi / 2;
      this.inductance = parseFloatStrict(st.nextToken());
      this.resistance = parseFloatStrict(st.nextToken());
      this.K = parseFloatStrict(st.nextToken());
      this.Kb = parseFloatStrict(st.nextToken());
      this.J = parseFloatStrict(st.nextToken());
      this.b = parseFloatStrict(st.nextToken());
      this.gearRatio = parseFloatStrict(st.nextToken());
      this.tau = parseFloatStrict(st.nextToken());
    } else {
      this.inductance = 0.5;
      this.resistance = 1;
      this.angle = CircuitElm.pi / 2;
      this.K = 0.15;
      this.b = 0.05;
      this.J = 0.02;
      this.Kb = 0.15;
      this.gearRatio = 1;
      this.tau = 0;
    }
    this.ind = new Inductor(CircuitElm.sim);
    this.indInertia = new Inductor(CircuitElm.sim);
    this.ind.setup(this.inductance, 0, Inductor.FLAG_BACK_EULER);
    this.indInertia.setup(this.J, 0, Inductor.FLAG_BACK_EULER);
  }
  getDumpType() {
    return 415;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "in", this.inductance);
    CircuitXMLSerializer.dumpAttr(elem, "rs", this.resistance);
    CircuitXMLSerializer.dumpAttr(elem, "k", this.K);
    CircuitXMLSerializer.dumpAttr(elem, "kb", this.Kb);
    CircuitXMLSerializer.dumpAttr(elem, "j", this.J);
    CircuitXMLSerializer.dumpAttr(elem, "b", this.b);
    CircuitXMLSerializer.dumpAttr(elem, "gr", this.gearRatio);
    CircuitXMLSerializer.dumpAttr(elem, "ta", this.tau);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.inductance = xml.parseDoubleAttr("in", this.inductance);
    this.resistance = xml.parseDoubleAttr("rs", this.resistance);
    this.K = xml.parseDoubleAttr("k", this.K);
    this.Kb = xml.parseDoubleAttr("kb", this.Kb);
    this.J = xml.parseDoubleAttr("j", this.J);
    this.b = xml.parseDoubleAttr("b", this.b);
    this.gearRatio = xml.parseDoubleAttr("gr", this.gearRatio);
    this.tau = xml.parseDoubleAttr("ta", this.tau);
    this.ind = new Inductor(CircuitElm.sim);
    this.indInertia = new Inductor(CircuitElm.sim);
    this.ind.setup(this.inductance, 0, Inductor.FLAG_BACK_EULER);
    this.indInertia.setup(this.J, 0, Inductor.FLAG_BACK_EULER);
  }
  getAngle() {
    return this.angle;
  }
  setPoints() {
    super.setPoints();
    this.calcLeads(36);
    this.motorCenter = this.interpPoint(this.point1, this.point2, 0.5);
    this.allocNodes();
  }
  getPostCount() {
    return 2;
  }
  getInternalNodeCount() {
    return 4;
  }
  getVoltageSourceCount() {
    return 2;
  }
  setVoltageSource(n, v) {
    this.voltSources[n] = v;
    if (n === 0) v.setNodes(this.nodes[3], this.nodes[1]);
    else v.setNodes(this.nodes[4], CircuitNode.ground);
  }
  reset() {
    super.reset();
    this.ind.reset();
    this.indInertia.reset();
    this.coilCurrent = 0;
    this.inertiaCurrent = 0;
  }
  stamp() {
    this.ind.stamp(this.nodes[0], this.nodes[2]);
    CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[3], this.resistance);
    CircuitElm.sim.stampVoltageSource(this.nodes[3], this.nodes[1], this.voltSources[0]);
    this.indInertia.stamp(this.nodes[4], this.nodes[5]);
    CircuitElm.sim.stampResistor(this.nodes[5], CircuitNode.ground, this.b);
    CircuitElm.sim.stampVoltageSource(this.nodes[4], CircuitNode.ground, this.voltSources[1]);
  }
  startIteration() {
    this.ind.startIteration(this.nodes[0].v - this.nodes[2].v);
    this.indInertia.startIteration(this.nodes[4].v - this.nodes[5].v);
    this.angle = this.angle + this.speed * CircuitElm.sim.timeStep;
  }
  doStep() {
    CircuitElm.sim.updateVoltageSource(this.nodes[4], CircuitNode.ground, this.voltSources[1], this.coilCurrent * this.K);
    CircuitElm.sim.updateVoltageSource(this.nodes[3], this.nodes[1], this.voltSources[0], this.inertiaCurrent * this.Kb);
    this.ind.doStep(this.nodes[0].v - this.nodes[2].v);
    this.indInertia.doStep(this.nodes[4].v - this.nodes[5].v);
  }
  calculateCurrent() {
    this.coilCurrent = this.ind.calculateCurrent(this.nodes[0].v - this.nodes[2].v);
    this.inertiaCurrent = this.indInertia.calculateCurrent(this.nodes[4].v - this.nodes[5].v);
    this.speed = this.inertiaCurrent;
  }
  setCurrent(vs, c) {
    if (vs === this.voltSources[0]) this.current = c;
  }
  draw(g) {
    const cr = 18;
    this.setBbox(this.point1, this.point2, cr);
    this.draw2Leads(g);
    this.doDots(g);
    this.setPowerColor(g, true);
    g.setColor(new Color(165, 165, 165));
    g.fillOval(this.motorCenter.x - cr, this.motorCenter.y - cr, cr * 2, cr * 2);
    g.setColor(new Color(10, 10, 10));
    const angleAux = Math.round(this.angle * 300) / 300;
    g.fillOval(
      this.motorCenter.x - Math.trunc(cr / 2.2),
      this.motorCenter.y - Math.trunc(cr / 2.2),
      Math.trunc(2 * cr / 2.2),
      Math.trunc(2 * cr / 2.2)
    );
    for (let k = 0; k < 3; k++) {
      const a = angleAux * this.gearRatio + k * CircuitElm.pi / 3;
      this.interpPointFix(this.lead1, this.lead2, CircuitElm.ps1, 0.5 + 0.28 * Math.cos(a), 0.28 * Math.sin(a));
      this.interpPointFix(this.lead1, this.lead2, CircuitElm.ps2, 0.5 - 0.28 * Math.cos(a), -0.28 * Math.sin(a));
      DCMotorElm.drawThickerLine(g, CircuitElm.ps1, CircuitElm.ps2);
    }
    this.drawPosts(g);
  }
  static drawThickerLine(g, pa, pb) {
    g.setLineWidth(6);
    g.drawLine(pa.x, pa.y, pb.x, pb.y);
    g.setLineWidth(1);
  }
  interpPointFix(a, b, c, f, gg) {
    const gx = b.y - a.y;
    const gy = a.x - b.x;
    c.x = Math.round(a.x * (1 - f) + b.x * f + gg * gx);
    c.y = Math.round(a.y * (1 - f) + b.y * f + gg * gy);
  }
  getInfo(arr) {
    arr[0] = "DC Motor";
    this.getBasicInfo(arr);
    arr[3] = Locale.LS("speed") + " = " + CircuitElm.getUnitText(60 * Math.abs(this.speed) / (2 * CircuitElm.pi), Locale.LS("RPM"));
    arr[4] = "L = " + CircuitElm.getUnitText(this.inductance, "H");
    arr[5] = "R = " + CircuitElm.getUnitText(this.resistance, Locale.ohmString);
    arr[6] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("Armature inductance (H)", this.inductance, 0, 0).setPositive();
    if (n === 1) return new EditInfo("Armature Resistance (ohms)", this.resistance, 0, 0).setPositive();
    if (n === 2) return new EditInfo("Torque constant (Nm/A)", this.K, 0, 0).setPositive();
    if (n === 3) return new EditInfo("Moment of inertia (Kg.m^2)", this.J, 0, 0).setPositive();
    if (n === 4) return new EditInfo("Friction coefficient (Nms/rad)", this.b, 0, 0).setPositive();
    if (n === 5) return new EditInfo("Gear Ratio", this.gearRatio, 0, 0).setPositive();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0) {
      this.inductance = ei.value;
      this.ind.setup(this.inductance, this.current, Inductor.FLAG_BACK_EULER);
    }
    if (n === 1 && ei.value > 0) this.resistance = ei.value;
    if (n === 2 && ei.value > 0) {
      this.K = ei.value;
      this.Kb = this.K;
    }
    if (n === 3 && ei.value > 0) {
      this.J = ei.value;
      this.indInertia.setup(this.J, this.inertiaCurrent, Inductor.FLAG_BACK_EULER);
    }
    if (n === 4 && ei.value > 0) this.b = ei.value;
    if (n === 5 && ei.value > 0) this.gearRatio = ei.value;
  }
}

class DCVoltageElm extends VoltageElm {
  constructor(xx, yy) {
    super(xx, yy, VoltageElm.WF_DC);
  }
  getDumpClass() {
    return VoltageElm;
  }
  getShortcut() {
    return "v".charCodeAt(0);
  }
}

class DFlipFlopElm extends ChipElm {
  static FLAG_RESET = 2;
  static FLAG_SET = 4;
  static FLAG_INVERT_SET_RESET = 8;
  hasReset() {
    return (this.flags & DFlipFlopElm.FLAG_RESET) !== 0 || this.hasSet();
  }
  hasSet() {
    return (this.flags & DFlipFlopElm.FLAG_SET) !== 0;
  }
  invertSetReset() {
    return (this.flags & DFlipFlopElm.FLAG_INVERT_SET_RESET) !== 0;
  }
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.pins[2].value = !this.pins[1].value;
    } else {
      super(xa, ya, xb, yb, f, st);
      this.pins[2].value = !this.pins[1].value;
    }
  }
  getChipName() {
    return "D flip-flop";
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = 3;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "D");
    this.pins[1] = new Pin(this, 0, ChipElm.SIDE_E, "Q");
    this.pins[1].output = this.pins[1].state = true;
    this.pins[2] = new Pin(this, this.hasSet() ? 1 : 2, ChipElm.SIDE_E, "Q");
    this.pins[2].output = true;
    this.pins[2].lineOver = true;
    this.pins[3] = new Pin(this, 1, ChipElm.SIDE_W, "");
    this.pins[3].clock = true;
    if (!this.hasSet()) {
      if (this.hasReset()) {
        this.pins[4] = new Pin(this, 2, ChipElm.SIDE_W, "R");
        this.pins[4].bubble = this.invertSetReset();
      }
    } else {
      this.pins[5] = new Pin(this, 2, ChipElm.SIDE_W, "S");
      this.pins[4] = new Pin(this, 2, ChipElm.SIDE_E, "R");
      this.pins[4].bubble = this.pins[5].bubble = this.invertSetReset();
    }
  }
  getPostCount() {
    return 4 + (this.hasReset() ? 1 : 0) + (this.hasSet() ? 1 : 0);
  }
  getVoltageSourceCount() {
    return 2;
  }
  execute() {
    let isSet = false;
    let isReset = false;
    if (this.hasSet() && this.pins[5].value !== this.invertSetReset()) isSet = true;
    if (this.hasReset() && this.pins[4].value !== this.invertSetReset()) isReset = true;
    if (isSet || isReset) {
      this.writeOutput(1, false);
      this.writeOutput(2, false);
      if (isSet) this.writeOutput(1, true);
      if (isReset) this.writeOutput(2, true);
    } else {
      if (this.pins[3].value && !this.lastClock)
        this.writeOutput(1, this.pins[0].value);
      this.writeOutput(2, !this.pins[1].value);
    }
    this.lastClock = this.pins[3].value;
  }
  getDumpType() {
    return 155;
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Reset Pin", this.hasReset());
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Set Pin", this.hasSet());
      return ei;
    }
    if (n === 2) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Invert Set/Reset", this.invertSetReset());
      return ei;
    }
    return super.getChipEditInfo(n);
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.checkbox.getState())
        this.flags |= DFlipFlopElm.FLAG_RESET;
      else
        this.flags &= ~DFlipFlopElm.FLAG_RESET | DFlipFlopElm.FLAG_SET;
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    }
    if (n === 1) {
      if (ei.checkbox.getState())
        this.flags |= DFlipFlopElm.FLAG_SET;
      else
        this.flags &= ~DFlipFlopElm.FLAG_SET;
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    }
    if (n === 2) {
      this.flags = ei.changeFlag(this.flags, DFlipFlopElm.FLAG_INVERT_SET_RESET);
      this.setupPins();
      this.setPoints();
    }
    super.setChipEditValue(n, ei);
  }
}

class DPDTSwitchElm extends SwitchElm {
  poleCount;
  constructor(xa, ya, xbOrMm, yb, f, st) {
    if (st !== void 0) {
      super(xa, ya, xbOrMm, yb, f, st);
      try {
        this.poleCount = parseIntStrict(st.nextToken());
      } catch (e) {
        this.poleCount = 2;
      }
    } else if (typeof xbOrMm === "boolean") {
      super(xa, ya, xbOrMm);
      this.poleCount = 2;
    } else {
      super(xa, ya, false);
      this.poleCount = 2;
    }
    this.noDiagonal = true;
    this.allocNodes();
  }
  getDumpType() {
    return 429;
  }
  getXmlDumpType() {
    return "dpdt";
  }
  dump() {
    return super.dump() + " " + this.poleCount;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "po", this.poleCount);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.poleCount = xml.parseIntAttr("po", this.poleCount);
  }
  openhs = 16;
  posCount = 2;
  poleLeads;
  throwLeads;
  polePosts;
  throwPosts;
  linePoints;
  voltageSources;
  currents;
  curcounts;
  // voltageSources/currents/curcounts are normally (re)allocated in setPoints(), but elements
  // inside a CompositeElm/subcircuit never get setPoints() called, so allocate lazily here too.
  ensureArrays() {
    if (this.voltageSources == null || this.voltageSources.length !== this.poleCount) {
      this.voltageSources = new Array(this.poleCount);
      this.currents = new Array(this.poleCount).fill(0);
      this.curcounts = new Array(this.poleCount).fill(0);
    }
  }
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    this.ensureArrays();
    this.throwPosts = this.newPointArray(2 * this.poleCount);
    this.throwLeads = this.newPointArray(4 * this.poleCount);
    this.poleLeads = this.newPointArray(this.poleCount);
    this.polePosts = this.newPointArray(this.poleCount);
    this.linePoints = this.newPointArray(2);
    for (let i = 0; i !== this.poleCount; i++) {
      const offset = -i * this.openhs * 3;
      this.interpPoint(this.point1, this.point2, this.polePosts[i], 0, offset);
      this.interpPoint(this.lead1, this.lead2, this.poleLeads[i], 0, offset);
      this.interpPoint(this.point1, this.point2, this.throwPosts[i * 2], 1, offset - this.openhs);
      this.interpPoint(this.lead1, this.lead2, this.throwLeads[i * 4], 1, offset - this.openhs);
      this.interpPoint(this.point1, this.point2, this.throwPosts[i * 2 + 1], 1, offset + this.openhs);
      this.interpPoint(this.lead1, this.lead2, this.throwLeads[i * 4 + 1], 1, offset + this.openhs);
      this.interpPoint(this.lead1, this.lead2, this.throwLeads[i * 4 + 2], 1, offset + this.openhs * 0.33);
      if (this.useIECSymbol())
        this.interpPoint(this.lead1, this.lead2, this.throwLeads[i * 4 + 3], 1.2, offset - this.openhs * 0.33);
      else
        this.interpPoint(this.lead1, this.lead2, this.throwLeads[i * 4 + 3], 1, offset - this.openhs);
    }
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, 1);
    this.adjustBbox(this.throwPosts[1], this.throwPosts[this.poleCount * 2 - 2]);
    for (let i = 0; i !== this.poleCount; i++) {
      this.setVoltageColor(g, this.nodes[i * 3].v);
      CircuitElm.drawThickLine(g, this.polePosts[i], this.poleLeads[i]);
      this.setVoltageColor(g, this.nodes[i * 3 + 1].v);
      CircuitElm.drawThickLine(g, this.throwPosts[i * 2], this.throwLeads[i * 4]);
      if (this.useIECSymbol())
        CircuitElm.drawThickLine(g, this.throwLeads[i * 4], this.throwLeads[i * 4 + 2]);
      this.setVoltageColor(g, this.nodes[i * 3 + 2].v);
      CircuitElm.drawThickLine(g, this.throwPosts[i * 2 + 1], this.throwLeads[i * 4 + 1]);
      if (!this.needsHighlight())
        g.setColor(CircuitElm.lightGrayColor);
      if (i < this.poleCount - 1) {
        const offset = -i * this.openhs * 3;
        this.interpPoint(this.point1, this.point2, this.linePoints[0], 0.5, offset - this.openhs * (0.5 - this.position) - 4 * this.position);
        this.interpPoint(this.point1, this.point2, this.linePoints[1], 0.5, offset - this.openhs * 3 - this.openhs * (0.5 - this.position) + 3 + 8 * (1 - this.position));
        g.setLineDash(4, 4);
        g.drawLine(this.linePoints[0], this.linePoints[1]);
        g.setLineDash(0, 0);
      }
      if (!this.needsHighlight())
        g.setColor(CircuitElm.whiteColor);
      CircuitElm.drawThickLine(g, this.poleLeads[i], this.throwLeads[i * 4 + 3 - this.position * 2]);
      this.curcounts[i] = this.updateDotCountImpl(this.currents[i], this.curcounts[i]);
      this.drawDots(g, this.polePosts[i], this.poleLeads[i], this.curcounts[i]);
      this.drawDots(g, this.throwLeads[i * 4 + this.position], this.throwPosts[i * 2 + this.position], this.curcounts[i]);
    }
    this.drawPosts(g);
  }
  getCurrentIntoNode(n) {
    const t = Math.trunc(n / 3);
    const n3 = n % 3;
    if (n3 === 0)
      return -this.currents[t];
    if (n3 === this.position + 1)
      return this.currents[t];
    return 0;
  }
  setCurrent(vs, c) {
    for (let i = 0; i !== this.poleCount; i++)
      if (vs === this.voltageSources[i])
        this.currents[i] = c;
  }
  getSwitchRect() {
    return new Rectangle(this.poleLeads[0].x, this.poleLeads[0].y, 0, 0).union(new Rectangle(this.throwLeads[1].x, this.throwLeads[1].y, 0, 0)).union(new Rectangle(this.throwLeads[this.poleCount * 4 - 4].x, this.throwLeads[this.poleCount * 4 - 4].y, 0, 0));
  }
  getPost(n) {
    const t = Math.trunc(n / 3);
    const n3 = n % 3;
    if (n3 === 0)
      return this.polePosts[t];
    return this.throwPosts[t * 2 + n3 - 1];
  }
  getPostCount() {
    return 3 * this.poleCount;
  }
  calculateCurrent() {
    if (this.resistance > 0)
      for (let i = 0; i !== this.poleCount; i++)
        this.currents[i] = (this.nodes[i * 3].v - this.nodes[i * 3 + 1 + this.position].v) / this.resistance;
  }
  setVoltageSource(j, vs) {
    this.ensureArrays();
    this.voltageSources[j] = vs;
    vs.setNodes(this.nodes[j * 3], this.nodes[this.position + 1 + j * 3]);
  }
  stamp() {
    this.ensureArrays();
    for (let i = 0; i !== this.poleCount; i++) {
      if (this.resistance > 0)
        CircuitElm.sim.stampResistor(this.nodes[i * 3], this.nodes[this.position + 1 + i * 3], this.resistance);
      else
        CircuitElm.sim.stampVoltageSourceVS(this.voltageSources[i], 0);
    }
  }
  getVoltageSourceCount() {
    return this.resistance > 0 ? 0 : this.poleCount;
  }
  getConnection(n1, n2) {
    for (let i = 0; i !== this.poleCount; i++)
      if (this.comparePair(n1, n2, i * 3, i * 3 + 1 + this.position))
        return true;
    return false;
  }
  isWireEquivalent() {
    return this.resistance === 0;
  }
  // optimizing out this element is too complicated to be worth it (see #646)
  isRemovableWire() {
    return false;
  }
  getElmType() {
    return "switch (DPDT)";
  }
  getInfo(arr) {
    arr[0] = this.poleCount === 2 ? "switch (DPDT)" : "switch (" + this.poleCount + "PDT)";
    for (let i = 0; i !== this.poleCount; i++)
      arr[i + 1] = "I" + (i + 1) + " = " + CircuitElm.getCurrentDText(this.currents[i]);
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Poles", this.poleCount, 2, 10).setDimensionless();
    if (n === 1)
      return EditInfo.createCheckbox("IEC Symbol", this.useIECSymbol());
    if (n === 2)
      return this.getKeyShortcutEditInfo();
    if (n === 3) {
      const ei = new EditInfo("On Resistance (ohms)", this.resistance);
      ei.setNonNegative();
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 2) {
        this.poleCount = Math.trunc(ei.value);
        this.allocNodes();
        this.setPoints();
      } else
        ei.setError("must be >= 2");
    }
    if (n === 1) {
      this.flags = ei.changeFlag(this.flags, SwitchElm.FLAG_IEC);
      this.setPoints();
    }
    if (n === 2)
      this.setKeyShortcutEditValue(ei);
    if (n === 3)
      this.resistance = ei.value;
  }
  getShortcut() {
    return 0;
  }
  flip() {
    if (this.dx === 0)
      this.x = this.x2 = this.x - Math.trunc(this.dpx1 * this.openhs * 3);
    if (this.dy === 0)
      this.y = this.y2 = this.y - Math.trunc(this.dpy1 * this.openhs * 3);
    this.position = 1 - this.position;
  }
  flipX(c2, count) {
    this.flip();
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    this.flip();
    super.flipY(c2, count);
  }
  flipXY(c2, count) {
    this.flip();
    super.flipXY(c2, count);
  }
  validate() {
    if (this.resistance > 0)
      return true;
    for (let i = 0; i !== this.poleCount; i++) {
      const fpi = new FindPathInfo(FindPathInfo.VOLTAGE, this, this.getNode(i * 3), CircuitElm.sim);
      if (fpi.findPath(this.getNode(i * 3 + 1 + this.position))) {
        this.resistance = 1e-3;
        return false;
      }
    }
    return true;
  }
}

class DarlingtonElm extends CompositeElm {
  rectPoly;
  arrowPoly;
  rect;
  coll;
  emit;
  base;
  coll2;
  pnp;
  // +1 for NPN, -1 for PNP
  curcount_c = 0;
  curcount_e = 0;
  curcount_b = 0;
  static modelString = "NTransistorElm 1 2 4\rNTransistorElm 4 2 3";
  static modelExternalNodes = [1, 2, 3];
  constructor(xa, ya, xbOrPnp, yb, f, st) {
    if (st !== void 0) {
      super(xa, ya, xbOrPnp, yb, f);
      this.loadComposite(st, DarlingtonElm.modelString, DarlingtonElm.modelExternalNodes);
      this.pnp = parseIntStrict(st.nextToken());
      this.noDiagonal = true;
    } else {
      super(xa, ya);
      this.loadComposite(null, DarlingtonElm.modelString, DarlingtonElm.modelExternalNodes);
      this.pnp = xbOrPnp === true ? -1 : 1;
      this.noDiagonal = true;
    }
    this.compElmList[0].pnp = this.pnp;
    this.compElmList[1].pnp = this.pnp;
  }
  reset() {
    super.reset();
    this.curcount_c = this.curcount_e = this.curcount_b = 0;
  }
  getDumpType() {
    return 400;
  }
  dump() {
    return super.dump() + " " + this.pnp;
  }
  getXmlDumpType() {
    return "dar";
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "pnp", this.pnp);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.pnp = xml.parseIntAttr("pnp", this.pnp);
    this.compElmList[0].pnp = this.pnp;
    this.compElmList[1].pnp = this.pnp;
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, 16);
    this.setPowerColor(g, true);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.coll[0], this.coll[1]);
    CircuitElm.drawThickLine(g, this.coll2[0], this.coll2[1]);
    CircuitElm.drawThickLine(g, this.coll[0], this.coll2[0]);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.emit[0], this.emit[1]);
    g.setColor(CircuitElm.lightGrayColor);
    g.fillPolygon(this.arrowPoly);
    this.setVoltageColor(g, this.nodes[0].v);
    if (this.showPower())
      g.setColor(CircuitElm.lightGrayColor);
    CircuitElm.drawThickLine(g, this.point1, this.base);
    this.curcount_b = this.updateDotCountImpl(this.getCurrentIntoNode(0), this.curcount_b);
    this.drawDots(g, this.base, this.point1, this.curcount_b);
    this.curcount_c = this.updateDotCountImpl(this.getCurrentIntoNode(1), this.curcount_c);
    this.drawDots(g, this.coll[1], this.coll[0], this.curcount_c);
    this.curcount_e = this.updateDotCountImpl(this.getCurrentIntoNode(2), this.curcount_e);
    this.drawDots(g, this.emit[1], this.emit[0], this.curcount_e);
    this.setVoltageColor(g, this.nodes[0].v);
    this.setPowerColor(g, true);
    g.fillPolygon(this.rectPoly);
    if ((this.needsHighlight() || this.isCreating()) && this.dy === 0) {
      g.setColor(CircuitElm.whiteColor);
      const ds = CircuitElm.sign(this.dx);
      g.drawString("B", this.base.x - 10 * ds, this.base.y - 5);
      g.drawString("C", this.coll[0].x - 3 + 9 * ds, this.coll[0].y + 4);
      g.drawString("E", this.emit[0].x - 3 + 9 * ds, this.emit[0].y + 4);
    }
    this.drawPosts(g);
  }
  getElmType() {
    return "darlington pair";
  }
  getInfo(arr) {
    arr[0] = Locale.LS("darlington pair") + " (" + (this.pnp === -1 ? "PNP)" : "NPN)");
    const vbc = this.nodes[0].v - this.nodes[1].v;
    const vbe = this.nodes[0].v - this.nodes[2].v;
    const vce = this.nodes[1].v - this.nodes[2].v;
    arr[1] = "Ic = " + CircuitElm.getCurrentText(-this.getCurrentIntoNode(1));
    arr[2] = "Ib = " + CircuitElm.getCurrentText(-this.getCurrentIntoNode(0));
    arr[3] = "Vbe = " + CircuitElm.getVoltageText(vbe);
    arr[4] = "Vbc = " + CircuitElm.getVoltageText(vbc);
    arr[5] = "Vce = " + CircuitElm.getVoltageText(vce);
  }
  setPoints() {
    super.setPoints();
    const hs = 16;
    const hs2 = hs * this.dsign * this.pnp;
    this.coll = this.newPointArray(2);
    this.coll2 = this.newPointArray(2);
    this.emit = this.newPointArray(2);
    this.interpPoint2(this.point1, this.point2, this.coll[0], this.emit[0], 1, hs2);
    this.coll2[0] = this.interpPoint(this.point1, this.point2, 1, hs2 - 5 * this.dsign * this.pnp);
    this.rect = this.newPointArray(4);
    this.interpPoint2(this.point1, this.point2, this.rect[0], this.rect[1], 1 - 16 / this.dn, hs);
    this.interpPoint2(this.point1, this.point2, this.rect[2], this.rect[3], 1 - 13 / this.dn, hs);
    this.interpPoint2(this.point1, this.point2, this.coll[1], this.emit[1], 1 - 13 / this.dn, 6 * this.dsign * this.pnp);
    this.coll2[1] = this.interpPoint(this.point1, this.point2, 1 - 13 / this.dn, this.dsign * this.pnp);
    this.base = new Point();
    this.interpPoint(this.point1, this.point2, this.base, 1 - 16 / this.dn);
    this.rectPoly = this.createPolygon(this.rect[0], this.rect[2], this.rect[3], this.rect[1]);
    if (this.pnp === 1)
      this.arrowPoly = this.calcArrow(this.emit[1], this.emit[0], 8, 4);
    else {
      const pt = this.interpPoint(this.point1, this.point2, 1 - 11 / this.dn, -5 * this.dsign * this.pnp);
      this.arrowPoly = this.calcArrow(this.emit[0], pt, 8, 4);
    }
    this.setPost(0, this.point1);
    this.setPost(1, this.coll[0]);
    this.setPost(2, this.emit[0]);
  }
  canFlipY() {
    return false;
  }
}

class DataFileEntry {
  fileName = "";
  data = [];
}
class DataInputElm extends RailElm {
  data = null;
  sampleLength = 1e-3;
  scaleFactor = 1;
  timeOffset = 0;
  fileNum = 0;
  fileName = null;
  FLAG_REPEAT = 1 << 8;
  static fileNumCounter = 1;
  static dataFileMap = /* @__PURE__ */ new Map();
  constructor(xa, ya, xb, yb, f, st) {
    if (st !== void 0) {
      super(xa, ya, xb, yb, f, st);
      this.waveform = VoltageElm.WF_AC;
      this.sampleLength = parseFloatStrict(st.nextToken());
      this.scaleFactor = parseFloatStrict(st.nextToken());
      this.fileNum = parseIntStrict(st.nextToken());
      const ent = DataInputElm.dataFileMap.get(this.fileNum);
      if (ent) {
        this.fileName = ent.fileName;
        this.data = ent.data;
      }
    } else {
      super(xa, ya, VoltageElm.WF_AC);
      this.scaleFactor = 1;
      this.sampleLength = 1e-3;
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "sl", this.sampleLength);
    CircuitXMLSerializer.dumpAttr(elem, "sf", this.scaleFactor);
  }
  dumpXmlState(doc, elem) {
    if (this.data !== null) {
      if (this.fileNum === 0)
        this.fileNum = DataInputElm.fileNumCounter++;
      const ent = new DataFileEntry();
      ent.fileName = this.fileName ?? "";
      ent.data = this.data;
      DataInputElm.dataFileMap.set(this.fileNum, ent);
      CircuitXMLSerializer.dumpAttr(elem, "fn", this.fileNum);
    }
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.sampleLength = xml.parseDoubleAttr("sl", this.sampleLength);
    this.scaleFactor = xml.parseDoubleAttr("sf", this.scaleFactor);
    this.fileNum = xml.parseIntAttr("fn", 0);
    const ent = DataInputElm.dataFileMap.get(this.fileNum);
    if (ent) {
      this.fileName = ent.fileName;
      this.data = ent.data;
    }
  }
  reset() {
    this.timeOffset = 0;
  }
  drawRail(g) {
    this.drawRailText(g, this.fileName === null ? Locale.LS("No file") : this.fileName);
  }
  getRailText() {
    return this.fileName === null ? Locale.LS("No file") : this.fileName;
  }
  doesRepeat() {
    return (this.flags & this.FLAG_REPEAT) !== 0;
  }
  getVoltage() {
    if (this.data === null || this.data.length === 0) return 0;
    let ptr = Math.trunc(this.timeOffset / this.sampleLength);
    if (ptr < 0)
      ptr = 0;
    if (ptr >= this.data.length) {
      if (this.doesRepeat()) {
        ptr = 0;
        this.timeOffset = 0;
      } else ptr = this.data.length - 1;
    }
    return this.data[ptr] * this.scaleFactor;
  }
  stepFinished() {
    this.timeOffset += CircuitElm.sim.timeStep;
  }
  getDumpType() {
    return 424;
  }
  getShortcut() {
    return 0;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      const input = document.createElement("input");
      input.type = "file";
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (file) {
          this.fileName = file.name.replace(/\.[^.]*$/, "");
          DataInputElm.fetchLoadFileData(this, file);
        }
      });
      ei.widget = input;
      return ei;
    }
    if (n === 1) return new EditInfo("Scale Factor", this.scaleFactor);
    if (n === 2) return new EditInfo("Sample Length (s)", this.sampleLength);
    if (n === 3) return EditInfo.createCheckbox("Repeat", this.doesRepeat());
    return null;
  }
  setEditValue(n, ei) {
    if (n === 1) this.scaleFactor = ei.value;
    if (n === 2) this.sampleLength = ei.value;
    if (n === 3) this.flags = ei.changeFlag(this.flags, this.FLAG_REPEAT);
  }
  static fetchLoadFileData(elm, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      elm.doLoadCallback(e.target.result, file.name);
    };
    reader.readAsText(file);
  }
  doLoadCallback(s, name) {
    this.fileName = name.replace(/\.[^.]*$/, "");
    const arr = s.split(/\r?\n/);
    this.data = [];
    let parseError = false;
    for (let i = 0; i !== arr.length; i++) {
      if (arr[i].length === 0) continue;
      if (arr[i].charAt(0) === "#") continue;
      const d = parseFloatStrict(arr[i]);
      if (isNaN(d)) {
        CirSim.console("parse error on line " + i);
        parseError = true;
      } else {
        this.data.push(d);
      }
    }
    if (this.data.length === 0 || parseError) {
      let msg = parseError ? "Error parsing data file.\n\n" : "No data found in file.\n\n";
      msg += "Expected format:\n- One numeric voltage value per line\n- Lines starting with # are treated as comments\n- Blank lines are ignored\n\nExample:\n# my data\n1.5\n2.3\n-0.5";
      window.alert(msg);
    }
  }
  getInfo(arr) {
    arr[0] = "data input";
    if (this.data === null) {
      arr[1] = "no file loaded";
      return;
    }
    arr[1] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[2] = "pos = " + CircuitElm.getUnitText(this.timeOffset, "s");
    arr[3] = "dur = " + CircuitElm.getUnitText(this.data.length * this.sampleLength, "s");
  }
  static clearCache() {
    DataInputElm.dataFileMap.clear();
  }
}

class DataRecorderElm extends CircuitElm {
  dataCount;
  dataPtr = 0;
  lastTimeStepCount = 0;
  data;
  dataFull = false;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.setDataCount(parseIntStrict(st.nextToken()));
    } else {
      this.setDataCount(10240);
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "dc", this.dataCount);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.setDataCount(xml.parseIntAttr("dc", this.dataCount));
  }
  getDumpType() {
    return 210;
  }
  getPostCount() {
    return 1;
  }
  reset() {
    this.dataPtr = 0;
    this.dataFull = false;
    this.lastTimeStepCount = 0;
  }
  setPoints() {
    super.setPoints();
    this.lead1 = this.interpPoint(this.point1, this.point2, 1 - 8 / this.dn);
  }
  draw(g) {
    g.save();
    const selected = this.needsHighlight();
    const f = new Font("SansSerif", selected ? Font.BOLD : 0, 14);
    g.setFont(f);
    g.setColor(selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
    this.setBbox(this.point1, this.lead1, 0);
    const s = Locale.LS("export");
    this.drawLabeledNode(g, s, this.point1, this.lead1);
    this.setVoltageColor(g, this.nodes[0].v);
    if (selected)
      g.setColor(CircuitElm.selectColor);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.drawPosts(g);
    g.restore();
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getInfo(arr) {
    arr[0] = "data export";
    arr[1] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[2] = (this.dataFull ? this.dataCount : this.dataPtr) + "/" + this.dataCount;
  }
  stepFinished() {
    if (this.lastTimeStepCount === CircuitElm.sim.timeStepCount)
      return;
    this.data[this.dataPtr++] = this.nodes[0].v;
    this.lastTimeStepCount = CircuitElm.sim.timeStepCount;
    if (this.dataPtr >= this.dataCount) {
      this.dataPtr = 0;
      this.dataFull = true;
    }
  }
  setDataCount(ct) {
    this.dataCount = ct;
    this.data = new Array(ct).fill(0);
    this.dataPtr = 0;
    this.dataFull = false;
  }
  static getBlobUrl(data) {
    const blob = new Blob([data], { type: "text/plain" });
    const win = window;
    if (win.recorderBlob)
      URL.revokeObjectURL(win.recorderBlob);
    const url = URL.createObjectURL(blob);
    win.recorderBlob = url;
    return url;
  }
  getEditInfo(n) {
    if (n === 0) {
      return new EditInfo("# of Data Points", this.dataCount, -1, -1).setDimensionless().setPositive();
    }
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      let dataStr = "# time step = " + CircuitElm.sim.timeStep + " sec\n";
      if (this.dataFull) {
        for (let i = 0; i !== this.dataCount; i++)
          dataStr += this.data[(i + this.dataPtr) % this.dataCount] + "\n";
      } else {
        for (let i = 0; i !== this.dataPtr; i++)
          dataStr += this.data[i] + "\n";
      }
      const now = /* @__PURE__ */ new Date();
      const pad = (n2) => String(n2).padStart(2, "0");
      const fname = "data-" + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes()) + ".circuitjs.txt";
      const url = DataRecorderElm.getBlobUrl(dataStr);
      const a = document.createElement("a");
      a.textContent = fname;
      a.href = url;
      a.setAttribute("download", fname);
      ei.widget = a;
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0)
      this.setDataCount(Math.trunc(ei.value));
  }
}

class DeMultiplexerElm extends ChipElm {
  static FLAG_BUS_SELECT = 1 << 3;
  static FLAG_INVERT_OUTPUTS = 1 << 4;
  // outputMode: 0 = single input, individual outputs (original)
  //             1 = single input, bus output (bit distributor)
  //             2 = bus input, bus outputs
  static OUTPUT_MODE_INDIVIDUAL = 0;
  static OUTPUT_MODE_BUS_BIT = 1;
  static OUTPUT_MODE_BUS_BUS = 2;
  selectBitCount = 2;
  outputCount = 0;
  outputMode = 0;
  dataBusWidth = 4;
  inputPin = 0;
  selectPin = 0;
  outputPin = 0;
  hasReset() {
    return false;
  }
  busSelect() {
    return this.hasFlag(DeMultiplexerElm.FLAG_BUS_SELECT);
  }
  invertOutputs() {
    return this.hasFlag(DeMultiplexerElm.FLAG_INVERT_OUTPUTS);
  }
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.setupPins();
    } else {
      super(xa, ya, xb, yb, f, st);
      try {
        this.selectBitCount = parseIntStrict(st.nextToken());
      } catch (e) {
      }
      this.setupPins();
      this.allocNodes();
    }
  }
  getChipName() {
    return "Demultiplexer";
  }
  dump() {
    return super.dump() + " " + this.selectBitCount;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "se", this.selectBitCount);
    if (this.outputMode !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "om", this.outputMode);
    if (this.dataBusWidth !== 4)
      CircuitXMLSerializer.dumpAttr(elem, "dw", this.dataBusWidth);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.selectBitCount = xml.parseIntAttr("se", this.selectBitCount);
    this.outputMode = xml.parseIntAttr("om", 0);
    this.dataBusWidth = xml.parseIntAttr("dw", 4);
    this.setupPins();
    this.allocNodes();
  }
  setupPins() {
    if (!this.selectBitCount)
      this.selectBitCount = 2;
    this.outputCount = 1 << this.selectBitCount;
    const D = DeMultiplexerElm;
    let i, n;
    if (this.outputMode === D.OUTPUT_MODE_BUS_BUS) {
      const inputPinCount = this.dataBusWidth;
      const outputPinCount = this.outputCount * this.dataBusWidth;
      this.sizeX = this.selectBitCount + 1;
      this.sizeY = this.outputCount + 1;
      this.pins = new Array(inputPinCount + this.selectBitCount + outputPinCount);
      this.inputPin = 0;
      for (i = 0; i < this.dataBusWidth; i++) {
        this.pins[i] = new Pin(this, 0, ChipElm.SIDE_W, "Q");
        this.pins[i].busWidth = this.dataBusWidth;
        this.pins[i].busZ = i;
      }
      this.selectPin = inputPinCount;
      for (i = 0; i < this.selectBitCount; i++) {
        n = this.selectPin + i;
        if (this.busSelect()) {
          this.pins[n] = new Pin(this, 0, ChipElm.SIDE_S, "S");
          this.pins[n].busWidth = this.selectBitCount;
          this.pins[n].busZ = i;
        } else {
          this.pins[n] = new Pin(this, i + 1, ChipElm.SIDE_S, "S" + i);
        }
      }
      this.outputPin = this.selectPin + this.selectBitCount;
      for (let g = 0; g < this.outputCount; g++) {
        for (i = 0; i < this.dataBusWidth; i++) {
          n = this.outputPin + g * this.dataBusWidth + i;
          this.pins[n] = new Pin(this, g, ChipElm.SIDE_E, "Q" + g);
          this.pins[n].output = true;
          this.pins[n].busWidth = this.dataBusWidth;
          this.pins[n].busZ = i;
        }
      }
    } else if (this.outputMode === D.OUTPUT_MODE_BUS_BIT) {
      this.sizeX = this.selectBitCount + 1;
      this.sizeY = 3;
      this.pins = new Array(1 + this.selectBitCount + this.outputCount);
      this.inputPin = 0;
      this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "Q");
      this.selectPin = 1;
      for (i = 0; i < this.selectBitCount; i++) {
        n = this.selectPin + i;
        if (this.busSelect()) {
          this.pins[n] = new Pin(this, 0, ChipElm.SIDE_S, "S");
          this.pins[n].busWidth = this.selectBitCount;
          this.pins[n].busZ = i;
        } else {
          this.pins[n] = new Pin(this, i + 1, ChipElm.SIDE_S, "S" + i);
        }
      }
      this.outputPin = this.selectPin + this.selectBitCount;
      for (i = 0; i < this.outputCount; i++) {
        n = this.outputPin + i;
        this.pins[n] = new Pin(this, 1, ChipElm.SIDE_E, "Q");
        this.pins[n].output = true;
        this.pins[n].busWidth = this.outputCount;
        this.pins[n].busZ = i;
      }
    } else {
      this.sizeX = 1 + this.selectBitCount;
      this.sizeY = 1 + this.outputCount;
      this.pins = new Array(1 + this.selectBitCount + this.outputCount);
      this.outputPin = 0;
      for (i = 0; i < this.outputCount; i++) {
        this.pins[i] = new Pin(this, i, ChipElm.SIDE_E, "Q" + i);
        this.pins[i].output = true;
      }
      this.selectPin = this.outputCount;
      for (i = 0; i < this.selectBitCount; i++) {
        n = this.selectPin + i;
        if (this.busSelect()) {
          this.pins[n] = new Pin(this, 0, ChipElm.SIDE_S, "S");
          this.pins[n].busWidth = this.selectBitCount;
          this.pins[n].busZ = i;
        } else {
          this.pins[n] = new Pin(this, i, ChipElm.SIDE_S, "S" + i);
        }
      }
      this.inputPin = this.outputCount + this.selectBitCount;
      this.pins[this.inputPin] = new Pin(this, 0, ChipElm.SIDE_W, "Q");
    }
    this.allocNodes();
  }
  getPostCount() {
    const D = DeMultiplexerElm;
    if (!this.dataBusWidth || !this.selectBitCount || !this.outputCount)
      return 0;
    if (this.outputMode === D.OUTPUT_MODE_BUS_BUS)
      return this.dataBusWidth + this.selectBitCount + this.outputCount * this.dataBusWidth;
    return 1 + this.selectBitCount + this.outputCount;
  }
  getVoltageSourceCount() {
    if (this.outputMode === DeMultiplexerElm.OUTPUT_MODE_BUS_BUS)
      return this.outputCount * this.dataBusWidth;
    return this.outputCount;
  }
  readSelectValue() {
    let sel = 0;
    for (let i = 0; i < this.selectBitCount; i++)
      if (this.pins[this.selectPin + i].value)
        sel |= 1 << i;
    return sel;
  }
  execute() {
    const D = DeMultiplexerElm;
    const selectedValue = this.readSelectValue();
    const width = this.outputMode === D.OUTPUT_MODE_BUS_BUS ? this.dataBusWidth : 1;
    const idle = this.invertOutputs();
    for (let i = 0; i < this.outputCount * width; i++)
      this.pins[this.outputPin + i].value = idle;
    for (let i = 0; i < width; i++)
      this.pins[this.outputPin + selectedValue * width + i].value = this.pins[this.inputPin + i].value;
  }
  getDumpType() {
    return 185;
  }
  getXmlDumpType() {
    return "dmux";
  }
  getChipEditInfo(n) {
    const D = DeMultiplexerElm;
    if (n === 0)
      return new EditInfo("# of Select Bits", this.selectBitCount).setDimensionless();
    if (n === 1) {
      const ei = new EditInfo("Output Mode", 0, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("Individual Outputs");
      ei.choice.add("Bus Output (Bit Distribute)");
      ei.choice.add("Bus Input/Output");
      ei.choice.select(this.outputMode);
      return ei;
    }
    if (n === 2)
      return EditInfo.createCheckbox("Bus Select", this.busSelect());
    if (n === 3)
      return EditInfo.createCheckbox("Keep Inactive Outputs High (74139)", this.invertOutputs());
    if (n === 4 && this.outputMode === D.OUTPUT_MODE_BUS_BUS)
      return new EditInfo("Data Bus Width", this.dataBusWidth, 2, 32).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    const D = DeMultiplexerElm;
    if (n === 0) {
      if (ei.value >= 1 && ei.value <= 6) {
        this.selectBitCount = Math.trunc(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be between 1 and 6");
    }
    if (n === 1) {
      this.outputMode = ei.choice.getSelectedIndex();
      this.setupPins();
      this.setPoints();
    }
    if (n === 2) {
      this.flags = ei.changeFlag(this.flags, D.FLAG_BUS_SELECT);
      this.setupPins();
      this.setPoints();
    }
    if (n === 3) {
      this.flags = ei.changeFlag(this.flags, D.FLAG_INVERT_OUTPUTS);
    }
    if (n === 4) {
      if (ei.value >= 2) {
        this.dataBusWidth = Math.trunc(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be >= 2");
    }
  }
}

class DecimalDisplayElm extends ChipElm {
  bitCount;
  displayMode = 0;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.bitCount = 4;
      this.setupPins();
    } else {
      super(xa, ya, xb, yb, f, st);
      this.bitCount = 4;
      try {
        this.bitCount = parseIntStrict(st.nextToken());
        this.displayMode = parseIntStrict(st.nextToken());
      } catch (e) {
      }
      this.setupPins();
    }
  }
  getChipName() {
    switch (this.displayMode) {
      case 1:
        return "hex display";
      case 2:
        return "octal display";
      default:
        return "decimal display";
    }
  }
  draw(g) {
    this.drawChip(g);
    const xl = this.x + this.cspc + this.flippedSizeX * this.cspc;
    let yl = this.y - this.cspc + this.flippedSizeY * this.cspc;
    if (this.isFlippedXY())
      yl += (this.flags & ChipElm.FLAG_FLIP_Y) !== 0 ? -this.cspc / 2 : this.cspc / 2;
    g.save();
    g.setFont(new Font("SansSerif", 0, 15 * this.csize));
    g.setColor(CircuitElm.whiteColor);
    g.context.textBaseline = "middle";
    let value = 0;
    for (let i = 0; i !== this.bitCount; i++)
      if (this.pins[i].value)
        value |= 1 << i;
    let str;
    switch (this.displayMode) {
      case 1:
        str = value.toString(16).toUpperCase();
        break;
      case 2:
        str = value.toString(8);
        break;
      default:
        str = String(value);
        break;
    }
    const w = g.context.measureText(str).width;
    g.drawString(str, xl + 5 * this.csize - w / 2, yl);
    g.restore();
  }
  dump() {
    return super.dump() + " " + this.bitCount + " " + this.displayMode;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "bc", this.bitCount);
    CircuitXMLSerializer.dumpAttr(elem, "dm", this.displayMode);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.bitCount = xml.parseIntAttr("bc", this.bitCount);
    this.displayMode = xml.parseIntAttr("dm", this.displayMode);
    this.setupPins();
  }
  getXmlDumpType() {
    return "dd";
  }
  allowBus() {
    return true;
  }
  setupPins() {
    if (!this.bitCount)
      return;
    this.sizeX = 3;
    this.sizeY = this.useBus() ? 2 : this.bitCount;
    this.pins = new Array(this.bitCount);
    this.makeBitPins(this.bitCount, 0, ChipElm.SIDE_W, 0, "I", false, false, false);
    this.allocNodes();
  }
  getPostCount() {
    return this.bitCount ?? 0;
  }
  getDumpType() {
    return 419;
  }
  getVoltageSourceCount() {
    return 0;
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Bits", this.bitCount, 1, 8).setDimensionless();
    if (n === 1) {
      const ei = new EditInfo("Display Mode", 0, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("Decimal");
      ei.choice.add("Hexadecimal");
      ei.choice.add("Octal");
      ei.choice.select(this.displayMode);
      return ei;
    }
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 1 && ei.value <= 16) {
        const newBitCount = Math.trunc(ei.value);
        if (newBitCount !== this.bitCount) {
          this.bitCount = newBitCount;
          this.setupPins();
          this.setPoints();
        }
      } else
        ei.setError("must be between 1 and 16");
      return;
    }
    if (n === 1)
      this.displayMode = ei.choice.getSelectedIndex();
  }
}

class DelayBufferElm extends CircuitElm {
  delay = 0;
  threshold = 2.5;
  highVoltage = 5;
  center;
  gatePoly;
  delayEndTime;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.noDiagonal = true;
      this.threshold = 2.5;
      this.highVoltage = 5;
    } else {
      super(xa, ya, xb, yb, f);
      this.noDiagonal = true;
      this.delay = parseFloatStrict(st.nextToken());
      this.threshold = 2.5;
      this.highVoltage = 5;
      try {
        this.threshold = parseFloatStrict(st.nextToken());
        this.highVoltage = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "dl", this.delay);
    CircuitXMLSerializer.dumpAttr(elem, "th", this.threshold);
    CircuitXMLSerializer.dumpAttr(elem, "hv", this.highVoltage);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.delay = xml.parseDoubleAttr("dl", this.delay);
    this.threshold = xml.parseDoubleAttr("th", this.threshold);
    this.highVoltage = xml.parseDoubleAttr("hv", this.highVoltage);
  }
  getDumpType() {
    return 422;
  }
  setHighVoltage(hv) {
    this.highVoltage = hv;
  }
  draw(g) {
    this.drawPosts(g);
    this.draw2Leads(g);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    CircuitElm.drawThickPolygon(g, this.gatePoly);
    if (GateElm.useEuroGates())
      this.drawCenteredText(g, "1", this.center.x, this.center.y - 6, true);
    this.curcount = this.updateDotCountImpl(this.current, this.curcount);
    this.drawDots(g, this.lead2, this.point2, this.curcount);
  }
  setPoints() {
    super.setPoints();
    const hs = 16;
    let ww = 16 - 2;
    if (ww > this.dn / 2)
      ww = Math.floor(this.dn / 2);
    this.lead1 = this.interpPoint(this.point1, this.point2, 0.5 - ww / this.dn);
    this.lead2 = this.interpPoint(this.point1, this.point2, 0.5 + ww / this.dn);
    if (GateElm.useEuroGates()) {
      const pts = this.newPointArray(4);
      const l2 = this.interpPoint(this.point1, this.point2, 0.5 + (ww - 5) / this.dn);
      this.interpPoint2(this.lead1, l2, pts[0], pts[1], 0, hs);
      this.interpPoint2(this.lead1, l2, pts[3], pts[2], 1, hs);
      this.gatePoly = this.createPolygon(pts);
      this.center = this.interpPoint(this.lead1, l2, 0.5);
    } else {
      const triPoints = this.newPointArray(3);
      this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[1], 0, hs);
      triPoints[2] = this.interpPoint(this.point1, this.point2, 0.5 + ww / this.dn);
      this.gatePoly = this.createPolygon(triPoints);
    }
    this.setBbox(this.point1, this.point2, hs);
  }
  getVoltageSourceCount() {
    return 1;
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[1], this.voltSource);
  }
  doStep() {
    let inState = this.nodes[0].v > this.threshold;
    let outState = this.nodes[1].v > this.threshold;
    if (inState !== outState) {
      if (CircuitElm.sim.t >= this.delayEndTime)
        outState = inState;
    } else
      this.delayEndTime = CircuitElm.sim.t + this.delay;
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[1], this.voltSource, outState ? this.highVoltage : 0);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getInfo(arr) {
    arr[0] = Locale.LS("buffer");
    arr[1] = Locale.LS("delay = ") + CircuitElm.getUnitText(this.delay, "s");
    arr[2] = "Vi = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[3] = "Vo = " + CircuitElm.getVoltageText(this.nodes[1].v);
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Delay (s)", this.delay, 0, 0);
    if (n === 1)
      return new EditInfo("Threshold (V)", this.threshold, 0, 0);
    if (n === 2)
      return new EditInfo("High Logic Voltage", this.highVoltage, 0, 0).setUnitStep();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.delay = ei.value;
    if (n === 1)
      this.threshold = ei.value;
    if (n === 2)
      this.highVoltage = ei.value;
  }
  // there is no current path through the inverter input, but there
  // is an indirect path through the output to ground.
  getConnection(n1, n2) {
    return false;
  }
  hasGroundConnection(n1) {
    return n1 === 1;
  }
  getCurrentIntoNode(n) {
    if (n === 1)
      return this.current;
    return 0;
  }
}

class DiacElm extends CircuitElm {
  // resistor from 0 to 2, 3
  // diodes from 2, 3 to 1
  onresistance;
  offresistance;
  breakdown;
  holdcurrent;
  state = false;
  diode1;
  diode2;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.offresistance = 1e8;
      this.onresistance = 500;
      this.breakdown = 30;
      this.holdcurrent = 0.01;
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.onresistance = parseFloatStrict(st.nextToken());
      this.offresistance = parseFloatStrict(st.nextToken());
      this.breakdown = parseFloatStrict(st.nextToken());
      this.holdcurrent = parseFloatStrict(st.nextToken());
    }
    this.createDiodes();
  }
  createDiodes() {
    this.diode1 = new Diode(CircuitElm.sim);
    this.diode2 = new Diode(CircuitElm.sim);
    this.diode1.setupForDefaultModel();
    this.diode2.setupForDefaultModel();
  }
  nonLinear() {
    return true;
  }
  getDumpType() {
    return 203;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ron", this.onresistance);
    CircuitXMLSerializer.dumpAttr(elem, "roff", this.offresistance);
    CircuitXMLSerializer.dumpAttr(elem, "bd", this.breakdown);
    CircuitXMLSerializer.dumpAttr(elem, "hc", this.holdcurrent);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.onresistance = xml.parseDoubleAttr("ron", this.onresistance);
    this.offresistance = xml.parseDoubleAttr("roff", this.offresistance);
    this.breakdown = xml.parseDoubleAttr("bd", this.breakdown);
    this.holdcurrent = xml.parseDoubleAttr("hc", this.holdcurrent);
  }
  arrows;
  plate1;
  plate2;
  setPoints() {
    super.setPoints();
    this.calcLeads(16);
    this.plate1 = this.newPointArray(2);
    this.plate2 = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, this.plate1[0], this.plate1[1], 0, 16);
    this.interpPoint2(this.lead1, this.lead2, this.plate2[0], this.plate2[1], 1, 16);
    this.arrows = new Array(2);
    for (let i = 0; i !== 2; i++) {
      const sgn = -1 + i * 2;
      const p1 = this.interpPoint(this.lead1, this.lead2, i, 8 * sgn);
      const p2 = this.interpPoint(this.lead1, this.lead2, 1 - i, 16 * sgn);
      const p3 = this.interpPoint(this.lead1, this.lead2, 1 - i, 0 * sgn);
      this.arrows[i] = this.createPolygon(p1, p2, p3);
    }
  }
  draw(g) {
    const v1 = this.nodes[0].v;
    const v2 = this.nodes[1].v;
    this.setBbox(this.point1, this.point2, 6);
    this.draw2Leads(g);
    this.setVoltageColor(g, v1);
    this.setPowerColor(g, true);
    CircuitElm.drawThickLine(g, this.plate1[0], this.plate1[1]);
    this.setVoltageColor(g, v2);
    this.setPowerColor(g, true);
    CircuitElm.drawThickLine(g, this.plate2[0], this.plate2[1]);
    g.fillPolygon(this.arrows[0]);
    this.setVoltageColor(g, v1);
    this.setPowerColor(g, true);
    g.fillPolygon(this.arrows[1]);
    this.setPowerColor(g, true);
    this.doDots(g);
    this.drawPosts(g);
  }
  calculateCurrent() {
    const r = this.state ? this.onresistance : this.offresistance;
    this.current = (this.nodes[0].v - this.nodes[2].v) / r + (this.nodes[0].v - this.nodes[3].v) / r;
  }
  startIteration() {
    const vd = this.nodes[0].v - this.nodes[1].v;
    if (Math.abs(this.current) < this.holdcurrent) this.state = false;
    if (Math.abs(vd) > this.breakdown) this.state = true;
  }
  doStep() {
    const r = this.state ? this.onresistance : this.offresistance;
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[2], r);
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[3], r);
    this.diode1.doStep(this.nodes[2].v - this.nodes[1].v);
    this.diode2.doStep(this.nodes[1].v - this.nodes[3].v);
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[0]);
    CircuitElm.sim.stampNonLinear(this.nodes[1]);
    this.diode1.stamp(this.nodes[2], this.nodes[1]);
    this.diode2.stamp(this.nodes[1], this.nodes[3]);
  }
  getInternalNodeCount() {
    return 2;
  }
  getInfo(arr) {
    arr[0] = "DIAC";
    this.getBasicInfo(arr);
    arr[3] = this.state ? "on" : "off";
    arr[4] = "Ron = " + CircuitElm.getUnitText(this.onresistance, Locale.ohmString);
    arr[5] = "Roff = " + CircuitElm.getUnitText(this.offresistance, Locale.ohmString);
    arr[6] = "Vbrkdn = " + CircuitElm.getUnitText(this.breakdown, "V");
    arr[7] = "Ihold = " + CircuitElm.getUnitText(this.holdcurrent, "A");
    arr[8] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("On resistance (ohms)", this.onresistance, 0, 0);
    if (n === 1) return new EditInfo("Off resistance (ohms)", this.offresistance, 0, 0);
    if (n === 2) return new EditInfo("Breakdown voltage (volts)", this.breakdown, 0, 0);
    if (n === 3) return new EditInfo("Hold current (amps)", this.holdcurrent, 0, 0);
    return null;
  }
  setEditValue(n, ei) {
    if (ei.value > 0 && n === 0) this.onresistance = ei.value;
    if (ei.value > 0 && n === 1) this.offresistance = ei.value;
    if (ei.value > 0 && n === 2) this.breakdown = ei.value;
    if (ei.value > 0 && n === 3) this.holdcurrent = ei.value;
  }
}

class EditDiodeModelDialog extends EditDialog {
  model;
  diodeElm;
  constructor(dm, f, de) {
    super(dm, f);
    this.model = dm;
    this.diodeElm = de;
    this.applyButton.remove();
  }
  apply() {
    if (!super.apply())
      return false;
    if (this.model.name === null || this.model.name.length === 0)
      this.model.pickName();
    if (this.diodeElm !== null)
      this.diodeElm.newModelCreated(this.model);
    return true;
  }
  closeDialog() {
    super.closeDialog();
    const edlg = CirSim.editDialog;
    CirSim.console("resetting dialog " + edlg);
    if (edlg !== null)
      edlg.resetDialog();
    CirSim.diodeModelEditDialog = null;
  }
}

class DiodeElm extends CircuitElm {
  diode;
  static FLAG_FWDROP = 1;
  static FLAG_MODEL = 2;
  modelName;
  model;
  static lastModelName = "default";
  hasResistance;
  diodeEndNode;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.modelName = DiodeElm.lastModelName;
      this.diode = new Diode(CircuitElm.sim);
      this.setup();
    } else {
      super(xa, ya, xb, yb, f);
      const defaultdrop = 0.805904783;
      this.diode = new Diode(CircuitElm.sim);
      let fwdrop = defaultdrop;
      const zvoltage = 0;
      if ((f & DiodeElm.FLAG_MODEL) !== 0) {
        this.modelName = CustomLogicModel.unescape(st.nextToken());
      } else {
        if ((f & DiodeElm.FLAG_FWDROP) > 0) {
          try {
            fwdrop = parseFloatStrict(st.nextToken());
          } catch (e) {
          }
        }
        this.model = DiodeModel.getModelWithParameters(fwdrop, zvoltage);
        this.modelName = this.model.name;
      }
      this.setup();
    }
  }
  nonLinear() {
    return true;
  }
  setup() {
    this.model = DiodeModel.getModelWithNameOrCopy(this.modelName, this.model ?? null);
    this.modelName = this.model.name;
    this.diode.setup(this.model);
    this.hasResistance = this.model.seriesResistance > 0;
    this.diodeEndNode = this.hasResistance ? 2 : 1;
    this.allocNodes();
  }
  getInternalNodeCount() {
    return this.hasResistance ? 1 : 0;
  }
  updateModels() {
    this.setup();
  }
  getDumpType() {
    return "d".charCodeAt(0);
  }
  dump() {
    this.flags |= DiodeElm.FLAG_MODEL;
    return super.dump() + " " + CustomLogicModel.escape(this.modelName);
  }
  dumpModel() {
    if (this.model.builtIn || this.model.dumped)
      return null;
    return this.model.dump();
  }
  dumpXmlModel(doc) {
    if (!(this.model.builtIn || this.model.dumped))
      this.model.dumpXml(doc);
  }
  dumpXml(doc, elem) {
    if (!(this.model.builtIn || this.model.dumped))
      this.model.dumpXml(doc);
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "mo", this.modelName);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.modelName = xml.parseStringAttr("mo", this.modelName);
    this.setup();
  }
  hs = 8;
  poly;
  cathode;
  setPoints() {
    super.setPoints();
    this.calcLeads(16);
    this.cathode = this.newPointArray(2);
    const pa = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, pa[0], pa[1], 0, this.hs);
    this.interpPoint2(this.lead1, this.lead2, this.cathode[0], this.cathode[1], 1, this.hs);
    this.poly = this.createPolygon(pa[0], pa[1], this.lead2);
  }
  addRoutingObstacle(router) {
    this.addRoutingObstacleWithLeads(router, this.hs);
  }
  draw(g) {
    this.drawDiode(g);
    this.doDots(g);
    this.drawPosts(g);
  }
  reset() {
    this.diode.reset();
    this.curcount = 0;
  }
  drawDiode(g) {
    this.setBbox(this.point1, this.point2, this.hs);
    const v1 = this.nodes[0].v;
    const v2 = this.nodes[1].v;
    this.draw2Leads(g);
    this.setVoltageColor(g, v1);
    this.setPowerColor(g, true);
    g.fillPolygon(this.poly);
    this.setVoltageColor(g, v2);
    this.setPowerColor(g, true);
    CircuitElm.drawThickLine(g, this.cathode[0], this.cathode[1]);
  }
  stamp() {
    if (this.hasResistance) {
      this.diode.stamp(this.nodes[0], this.nodes[2]);
      CircuitElm.sim.stampResistor(this.nodes[1], this.nodes[2], this.model.seriesResistance);
    } else
      this.diode.stamp(this.nodes[0], this.nodes[1]);
  }
  doStep() {
    this.diode.doStep(this.nodes[0].v - this.nodes[this.diodeEndNode].v);
  }
  calculateCurrent() {
    this.current = this.diode.calculateCurrent(this.nodes[0].v - this.nodes[this.diodeEndNode].v);
  }
  getElmType() {
    return "diode";
  }
  getInfo(arr) {
    if (this.model.oldStyle)
      arr[0] = "diode";
    else
      arr[0] = Locale.LS("diode") + " (" + this.modelName + ")";
    arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
    arr[2] = "Vd = " + CircuitElm.getVoltageText(this.getVoltageDiff());
    arr[3] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
    if (this.model.oldStyle)
      arr[4] = "Vf = " + CircuitElm.getVoltageText(this.model.fwdrop);
  }
  models;
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Model", 0, -1, -1);
      this.models = DiodeModel.getModelList(this.isZenerElm());
      ei.choice = new Choice();
      for (let i = 0; i !== this.models.length; i++) {
        const dm = this.models[i];
        ei.choice.add(dm.getDescription());
        if (dm === this.model)
          ei.choice.select(i);
      }
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Create New Simple Model") };
      return ei;
    }
    if (n === 2) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Create New Advanced Model") };
      return ei;
    }
    if (n === 3) {
      if (this.model.readOnly)
        return null;
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Edit Model") };
      return ei;
    }
    return null;
  }
  newModelCreated(dm) {
    this.model = dm;
    this.modelName = this.model.name;
    this.setup();
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.model = this.models[ei.choice.getSelectedIndex()];
      this.modelName = this.model.name;
      this.setup();
      ei.newDialog = true;
      return;
    }
    if (n === 1 || n === 2) {
      const newModel = new DiodeModel(this.model);
      newModel.setSimple(n === 1);
      if (newModel.isSimple())
        newModel.setForwardVoltage();
      const editDialog = new EditDiodeModelDialog(newModel, CirSim.theApp, this);
      CirSim.diodeModelEditDialog = editDialog;
      editDialog.show();
      return;
    }
    if (n === 3) {
      if (this.model.readOnly) {
        window.alert(Locale.LS("This model cannot be modified.  Change the model name to allow customization."));
        return;
      }
      if (this.model.isSimple())
        this.model.setForwardVoltage();
      const editDialog = new EditDiodeModelDialog(this.model, CirSim.theApp, null);
      CirSim.diodeModelEditDialog = editDialog;
      editDialog.show();
      return;
    }
  }
  isZenerElm() {
    return false;
  }
  getShortcut() {
    return "d".charCodeAt(0);
  }
  setLastModelName(n) {
    DiodeElm.lastModelName = n;
  }
  stepFinished() {
    if (Math.abs(this.current) > 1e12)
      CircuitElm.sim.stop("max current exceeded", this);
  }
}

class ExtVoltageElm extends RailElm {
  name;
  voltage = 0;
  constructor(xa, ya, xb, yb, f, st) {
    if (st !== void 0) {
      super(xa, ya, xb, yb, f, st);
      this.name = CustomLogicModel.unescape(st.nextToken());
      this.waveform = VoltageElm.WF_AC;
    } else {
      super(xa, ya, VoltageElm.WF_AC);
      this.name = "ext";
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "nm", this.name);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.name = xml.parseStringAttr("nm", this.name) ?? this.name;
  }
  drawRail(g) {
    this.drawRailText(g, this.name);
  }
  setVoltage(v) {
    if (!isNaN(v)) this.voltage = v;
  }
  getName() {
    return this.name;
  }
  getVoltage() {
    return this.voltage;
  }
  getDumpType() {
    return 418;
  }
  getShortcut() {
    return 0;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Name", 0, -1, -1);
      ei.text = this.name;
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.name = ei.textf.value;
  }
  isExtVoltageElm() {
    return true;
  }
  getElmType() {
    return "ext. voltage";
  }
  getInfo(arr) {
    super.getInfo(arr);
    arr[0] = Locale.LS("ext. voltage") + " (" + this.name + ")";
  }
}

class FMElm extends CircuitElm {
  static FLAG_COS = 2;
  carrierfreq;
  signalfreq;
  maxVoltage;
  freqTimeZero = 0;
  deviation;
  lasttime = 0;
  funcx = 0;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.carrierfreq = parseFloatStrict(st.nextToken());
      this.signalfreq = parseFloatStrict(st.nextToken());
      this.maxVoltage = parseFloatStrict(st.nextToken());
      this.deviation = parseFloatStrict(st.nextToken());
      if ((this.flags & FMElm.FLAG_COS) !== 0)
        this.flags &= ~FMElm.FLAG_COS;
    } else {
      this.deviation = 200;
      this.maxVoltage = 5;
      this.carrierfreq = 800;
      this.signalfreq = 40;
    }
    this.reset();
  }
  getDumpType() {
    return 201;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "cf", this.carrierfreq);
    CircuitXMLSerializer.dumpAttr(elem, "sf", this.signalfreq);
    CircuitXMLSerializer.dumpAttr(elem, "mv", this.maxVoltage);
    CircuitXMLSerializer.dumpAttr(elem, "dv", this.deviation);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.carrierfreq = xml.parseDoubleAttr("cf", this.carrierfreq);
    this.signalfreq = xml.parseDoubleAttr("sf", this.signalfreq);
    this.maxVoltage = xml.parseDoubleAttr("mv", this.maxVoltage);
    this.deviation = xml.parseDoubleAttr("dv", this.deviation);
    this.reset();
  }
  reset() {
    this.freqTimeZero = 0;
    this.curcount = 0;
  }
  getPostCount() {
    return 1;
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[0], this.voltSource);
  }
  doStep() {
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[0], this.voltSource, this.getVoltage());
  }
  getVoltage() {
    const deltaT = CircuitElm.sim.t - this.lasttime;
    this.lasttime = CircuitElm.sim.t;
    const signalamplitude = Math.sin(2 * CircuitElm.pi * (CircuitElm.sim.t - this.freqTimeZero) * this.signalfreq);
    this.funcx += deltaT * (this.carrierfreq + signalamplitude * this.deviation);
    return Math.sin(2 * CircuitElm.pi * this.funcx) * this.maxVoltage;
  }
  circleSize = 17;
  draw(g) {
    this.setBbox(this.point1, this.point2, this.circleSize);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    g.setFont(new Font("SansSerif", 0, 12));
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
    this.setPowerColor(g, false);
    this.drawCenteredText(g, "FM", this.x2, this.y2, true);
    this.drawWaveform(g, this.point2);
    this.drawPosts(g);
    this.curcount = this.updateDotCountImpl(-this.current, this.curcount);
    if (!this.isCreating())
      this.drawDots(g, this.point1, this.lead1, this.curcount);
  }
  drawWaveform(g, center) {
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.gray);
    this.setPowerColor(g, false);
    CircuitElm.drawThickCircle(g, center.x, center.y, this.circleSize);
    this.adjustBbox(
      center.x - this.circleSize,
      center.y - this.circleSize,
      center.x + this.circleSize,
      center.y + this.circleSize
    );
  }
  setPoints() {
    super.setPoints();
    this.lead1 = this.interpPoint(this.point1, this.point2, 1 - this.circleSize / this.dn);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  validate() {
    return this.validateRailNode(0);
  }
  hasGroundConnection(n1) {
    return true;
  }
  getVoltageSourceCount() {
    return 1;
  }
  getPower() {
    return -this.getVoltageDiff() * this.current;
  }
  getInfo(arr) {
    arr[0] = "FM Source";
    arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
    arr[2] = "V = " + CircuitElm.getVoltageText(this.getVoltageDiff());
    arr[3] = "cf = " + CircuitElm.getUnitText(this.carrierfreq, "Hz");
    arr[4] = "sf = " + CircuitElm.getUnitText(this.signalfreq, "Hz");
    arr[5] = "dev = " + CircuitElm.getUnitText(this.deviation, "Hz");
    arr[6] = "Vmax = " + CircuitElm.getVoltageText(this.maxVoltage);
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("Max Voltage", this.maxVoltage, -20, 20).setUnitStep();
    if (n === 1) return new EditInfo("Carrier Frequency (Hz)", this.carrierfreq, 4, 500);
    if (n === 2) return new EditInfo("Signal Frequency (Hz)", this.signalfreq, 4, 500);
    if (n === 3) return new EditInfo("Deviation (Hz)", this.deviation, 4, 500);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.maxVoltage = ei.value;
    if (n === 1) this.carrierfreq = ei.value;
    if (n === 2) this.signalfreq = ei.value;
    if (n === 3) this.deviation = ei.value;
  }
}

class FullAdderElm extends ChipElm {
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.flags |= FullAdderElm.FLAG_BITS;
      this.bits = 4;
      this.setupPins();
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
      if (!this.needsBits())
        this.bits = 1;
      this.setupPins();
    }
  }
  static FLAG_BITS = 2;
  getChipName() {
    return "Adder";
  }
  carryIn = 0;
  carryOut = 0;
  setupPins() {
    this.sizeX = 2;
    const bitsY = this.useBus() ? 1 : this.bits;
    this.sizeY = bitsY * 2 + 1;
    this.pins = new Array(this.getPostCount());
    this.makeBitPins(this.bits, 0, ChipElm.SIDE_W, 0, "A", false, false, false);
    this.makeBitPins(this.bits, bitsY, ChipElm.SIDE_W, this.bits, "B", false, false, false);
    this.makeBitPins(this.bits, 2, ChipElm.SIDE_E, this.bits * 2, "S", true, false, false);
    this.carryIn = this.bits * 3;
    this.carryOut = this.bits * 3 + 1;
    this.pins[this.carryOut] = new Pin(this, 0, ChipElm.SIDE_E, "C");
    this.pins[this.carryOut].output = true;
    this.pins[this.carryIn] = new Pin(this, bitsY * 2, ChipElm.SIDE_W, "Cin");
    this.allocNodes();
  }
  getPostCount() {
    return this.bits * 3 + 2;
  }
  getVoltageSourceCount() {
    return this.bits + 1;
  }
  execute() {
    let c = this.pins[this.carryIn].value ? 1 : 0;
    for (let i = 0; i !== this.bits; i++) {
      const v = (this.pins[i].value ? 1 : 0) + (this.pins[i + this.bits].value ? 1 : 0) + c;
      c = v > 1 ? 1 : 0;
      this.writeOutput(i + this.bits * 2, (v & 1) === 1);
    }
    this.writeOutput(this.carryOut, c === 1);
  }
  getDumpType() {
    return 196;
  }
  needsBits() {
    return (this.flags & FullAdderElm.FLAG_BITS) !== 0;
  }
  allowBus() {
    return this.needsBits();
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless().setPositive();
    return super.getChipEditInfo(n);
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      this.bits = Math.floor(ei.value);
      this.flags |= FullAdderElm.FLAG_BITS;
      this.setupPins();
      this.setPoints();
      this.allocNodes();
      return;
    }
    super.setChipEditValue(n, ei);
  }
}

class FuseElm extends CircuitElm {
  resistance;
  heat = 0;
  i2t;
  blown = false;
  FLAG_IEC_SYMBOL = 1;
  blownResistance = 1e9;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.resistance = parseFloatStrict(st.nextToken());
      this.i2t = parseFloatStrict(st.nextToken());
      this.heat = parseFloatStrict(st.nextToken());
      this.blown = st.nextToken() === "true";
    } else {
      this.i2t = 6.73;
      this.resistance = 0.0613;
    }
  }
  dump() {
    return super.dump() + " " + this.resistance + " " + this.i2t + " " + this.heat + " " + this.blown;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "re", this.resistance);
    CircuitXMLSerializer.dumpAttr(elem, "i2", this.i2t);
    CircuitXMLSerializer.dumpAttr(elem, "he", this.heat);
    CircuitXMLSerializer.dumpAttr(elem, "bl", this.blown);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.resistance = xml.parseDoubleAttr("re", this.resistance);
    this.i2t = xml.parseDoubleAttr("i2", this.i2t);
    this.heat = xml.parseDoubleAttr("he", this.heat);
    this.blown = xml.parseBooleanAttr("bl", this.blown);
  }
  getDumpType() {
    return 404;
  }
  isIECSymbol() {
    return (this.flags & this.FLAG_IEC_SYMBOL) !== 0;
  }
  reset() {
    super.reset();
    this.heat = 0;
    this.blown = false;
  }
  setPoints() {
    super.setPoints();
    const llen = this.isIECSymbol() ? 32 : 16;
    this.calcLeads(llen);
  }
  getTempColor(g) {
    const c = this.getVoltageColor(g, this.nodes[0].v);
    const temp = this.heat / this.i2t;
    if (temp < 0.3333) {
      const val = temp * 3;
      const x = Math.max(0, Math.trunc(255 * val));
      return new Color(x + (255 - x) * c.getRed() / 255, (255 - x) * c.getGreen() / 255, (255 - x) * c.getBlue() / 255);
    }
    if (temp < 0.6667) {
      const x = Math.max(0, Math.trunc((temp - 0.3333) * 3 * 255));
      return new Color(255, x, 0);
    }
    if (temp < 1) {
      const x = Math.max(0, Math.trunc((temp - 0.6666) * 3 * 255));
      return new Color(255, 255, x);
    }
    return Color.white;
  }
  draw(g) {
    const hs = 6;
    this.setBbox(this.point1, this.point2, hs);
    this.draw2Leads(g);
    const len = CircuitElm.distance(this.lead1, this.lead2);
    const ctx = g.context;
    ctx.save();
    ctx.lineWidth = 3;
    ctx.transform(
      (this.lead2.x - this.lead1.x) / len,
      (this.lead2.y - this.lead1.y) / len,
      -(this.lead2.y - this.lead1.y) / len,
      (this.lead2.x - this.lead1.x) / len,
      this.lead1.x,
      this.lead1.y
    );
    ctx.strokeStyle = this.getTempColor(g).getHexValue();
    if (!this.isIECSymbol()) {
      if (!this.blown) {
        const segments = 16;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let i = 0; i <= segments; i++)
          ctx.lineTo(i * len / segments, hs * Math.sin(i * Math.PI * 2 / segments));
        ctx.stroke();
      }
    } else {
      if (!this.blown) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(len, 0);
        ctx.stroke();
        ctx.strokeRect(0, -hs, len, 2 * hs);
      }
    }
    ctx.restore();
    this.doDots(g);
    this.drawPosts(g);
  }
  calculateCurrent() {
    this.current = (this.nodes[0].v - this.nodes[1].v) / (this.blown ? this.blownResistance : this.resistance);
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[0]);
    CircuitElm.sim.stampNonLinear(this.nodes[1]);
  }
  nonLinear() {
    return true;
  }
  startIteration() {
    const i = this.getCurrent();
    this.heat += i * i * CircuitElm.sim.timeStep;
    this.heat -= CircuitElm.sim.timeStep * this.i2t / 3;
    if (this.heat < 0)
      this.heat = 0;
    if (this.heat > this.i2t)
      this.blown = true;
  }
  doStep() {
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.blown ? this.blownResistance : this.resistance);
  }
  getElmType() {
    return "fuse";
  }
  getInfo(arr) {
    arr[0] = this.blown ? "fuse (blown)" : "fuse";
    this.getBasicInfo(arr);
    arr[3] = "R = " + CircuitElm.getUnitText(this.resistance, Locale.ohmString);
    arr[4] = "I2t = " + this.i2t;
    if (!this.blown)
      arr[5] = Math.trunc(this.heat * 100 / this.i2t) + "% " + Locale.LS("melted");
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("I2t", this.i2t, 0, 0).setPositive();
    if (n === 1)
      return new EditInfo("Resistance", this.resistance, 0, 0).setPositive();
    if (n === 2)
      return EditInfo.createCheckbox("IEC Symbol", this.isIECSymbol());
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.i2t = ei.value;
    if (n === 1)
      this.resistance = ei.value;
    if (n === 2) {
      this.flags = ei.changeFlag(this.flags, this.FLAG_IEC_SYMBOL);
      this.setPoints();
    }
  }
}

class GroundElm extends CircuitElm {
  static lastSymbolType = 0;
  symbolType;
  // this is needed for old subcircuits which have GroundElm dumped
  FLAG_OLD_STYLE = 1;
  getDragVertical(requestedVertical) {
    return true;
  }
  getDragLength() {
    return 32;
  }
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.symbolType = GroundElm.lastSymbolType;
    } else {
      super(xa, ya, xb, yb, f);
      this.symbolType = 0;
      if (st.hasMoreTokens()) {
        try {
          this.symbolType = parseIntStrict(st.nextToken());
        } catch (e) {
        }
      }
    }
  }
  dump() {
    return super.dump() + " " + this.symbolType;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    if (this.symbolType != 0)
      CircuitXMLSerializer.dumpAttr(elem, "sy", this.symbolType);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.symbolType = xml.parseIntAttr("sy", 0);
  }
  isGroundElm() {
    return true;
  }
  getDumpType() {
    return "g".charCodeAt(0);
  }
  getPostCount() {
    return 1;
  }
  draw(g) {
    this.setVoltageColor(g, 0);
    CircuitElm.drawThickLine(g, this.point1, this.point2);
    if (this.symbolType == 0) {
      let i;
      for (i = 0; i != 3; i++) {
        const a = 10 - i * 4;
        const b = i * 5;
        this.interpPoint2(this.point1, this.point2, CircuitElm.ps1, CircuitElm.ps2, 1 + b / this.dn, a);
        CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
      }
    } else if (this.symbolType == 1) {
      this.interpPoint2(this.point1, this.point2, CircuitElm.ps1, CircuitElm.ps2, 1, 10);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
      let i;
      for (i = 0; i <= 2; i++) {
        const p = this.interpPoint(CircuitElm.ps1, CircuitElm.ps2, i / 2);
        CircuitElm.drawThickLine(g, p.x, p.y, Math.trunc(p.x - 5 * this.dpx1 + 8 * this.dx / this.dn), Math.trunc(p.y + 8 * this.dy / this.dn - 5 * this.dpy1));
      }
    } else if (this.symbolType == 2) {
      this.interpPoint2(this.point1, this.point2, CircuitElm.ps1, CircuitElm.ps2, 1, 10);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
      const ps3x = Math.trunc(this.point2.x + 10 * this.dx / this.dn);
      const ps3y = Math.trunc(this.point2.y + 10 * this.dy / this.dn);
      CircuitElm.drawThickLine(g, CircuitElm.ps1.x, CircuitElm.ps1.y, ps3x, ps3y);
      CircuitElm.drawThickLine(g, CircuitElm.ps2.x, CircuitElm.ps2.y, ps3x, ps3y);
    } else {
      this.interpPoint2(this.point1, this.point2, CircuitElm.ps1, CircuitElm.ps2, 1, 10);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
    }
    this.interpPoint(this.point1, this.point2, CircuitElm.ps2, 1 + 11 / this.dn);
    this.doDots(g);
    this.setBbox(this.point1, CircuitElm.ps2, 11);
    this.drawPosts(g);
  }
  setOldStyle() {
    this.flags |= this.FLAG_OLD_STYLE;
  }
  isOldStyle() {
    return (this.flags & this.FLAG_OLD_STYLE) != 0;
  }
  getVoltageSourceCount() {
    return this.isOldStyle() ? 1 : 0;
  }
  stamp() {
    if (this.isOldStyle())
      CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[0], this.voltSource, 0);
  }
  setCurrent(vs, c) {
    this.current = this.isOldStyle() ? -c : c;
  }
  isWireEquivalent() {
    return true;
  }
  isRemovableWire() {
    return true;
  }
  static firstGround = null;
  static resetNodeList() {
    GroundElm.firstGround = null;
  }
  getConnectedPost(n) {
    if (GroundElm.firstGround != null)
      return GroundElm.firstGround;
    GroundElm.firstGround = this.point1;
    return null;
  }
  //	void setCurrent(int x, double c) { current = -c; }
  getVoltageDiff() {
    return 0;
  }
  getInfo(arr) {
    arr[0] = "ground";
    arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
  }
  hasGroundConnection(n1) {
    return true;
  }
  addRoutingObstacle(router) {
    router.addWire(this.point1.x, this.point1.y, this.point2.x, this.point2.y);
    const pa = new Point(), pb = new Point();
    this.interpPoint2(this.point1, this.point2, pa, pb, 1 + 11 / this.dn, 10);
    router.addObstacle(pa.x, pa.y, pb.x, pb.y);
  }
  getShortcut() {
    return "g".charCodeAt(0);
  }
  getEditInfo(n) {
    if (n == 0) {
      const ei = new EditInfo("Symbol", 0);
      ei.choice = new Choice();
      ei.choice.add("Earth");
      ei.choice.add("Chassis");
      ei.choice.add("Signal");
      ei.choice.add("Common");
      ei.choice.select(this.symbolType);
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n == 0)
      GroundElm.lastSymbolType = this.symbolType = ei.choice.getSelectedIndex();
  }
  getCurrentIntoNode(n) {
    return -this.current;
  }
}
HookRegistry.resetGroundNodeList = () => GroundElm.resetNodeList();

class GyratorElm extends CircuitElm {
  gyrResistance;
  ptEnds;
  ptStub;
  boxTL;
  boxTR;
  boxBL;
  boxBR;
  arrowTail;
  arrowHead;
  arrowPoly;
  currents;
  curcounts;
  width;
  flip;
  static FLAG_VERTICAL = 8;
  static FLAG_FLIP = 16;
  constructor(xx, yy) {
    super(xx, yy);
    this.gyrResistance = 1e3;
    this.width = 32;
    this.noDiagonal = true;
    this.currents = [0, 0];
    this.curcounts = [0, 0];
  }
  drag(xx, yy) {
    xx = this.snapGrid(xx);
    yy = this.snapGrid(yy);
    if (Math.abs(xx - this.x) > Math.abs(yy - this.y))
      this.flags &= ~GyratorElm.FLAG_VERTICAL;
    else
      this.flags |= GyratorElm.FLAG_VERTICAL;
    if (this.hasFlag(GyratorElm.FLAG_VERTICAL))
      this.width = -Math.max(32, Math.abs(xx - this.x));
    else
      this.width = Math.max(32, Math.abs(yy - this.y));
    if (xx === this.x)
      yy = this.y;
    this.x2 = xx;
    this.y2 = yy;
    this.setPoints();
  }
  // Wikipedia gyrator symbol: rectangular box with the Greek letter pi
  // (denoting the 180-degree phase shift in the gyration direction)
  // and an arrow showing the gyration direction.
  draw(g) {
    for (let i = 0; i !== 4; i++) {
      this.setVoltageColor(g, this.nodes[i].v);
      CircuitElm.drawThickLine(g, this.ptEnds[i], this.ptStub[i]);
    }
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    CircuitElm.drawThickLine(g, this.boxTL, this.boxTR);
    CircuitElm.drawThickLine(g, this.boxTR, this.boxBR);
    CircuitElm.drawThickLine(g, this.boxBR, this.boxBL);
    CircuitElm.drawThickLine(g, this.boxBL, this.boxTL);
    const cx = Math.floor((this.boxTL.x + this.boxBR.x) / 2);
    const cy = Math.floor((this.boxTL.y + this.boxBR.y) / 2);
    g.setFont(CircuitElm.unitsFont);
    g.drawString("π", cx - 4, cy - 1);
    g.drawLine(this.arrowTail, this.arrowHead);
    g.fillPolygon(this.arrowPoly);
    for (let i = 0; i !== 2; i++) {
      this.curcounts[i] = this.updateDotCountImpl(this.currents[i], this.curcounts[i]);
      this.drawDots(g, this.ptEnds[i], this.ptStub[i], this.curcounts[i]);
      this.drawDots(g, this.ptEnds[i + 2], this.ptStub[i + 2], -this.curcounts[i]);
    }
    this.drawPosts(g);
    this.setBbox(this.ptEnds[0], this.ptEnds[3], 0);
  }
  setPoints() {
    super.setPoints();
    if (this.hasFlag(GyratorElm.FLAG_VERTICAL))
      this.point2.x = this.point1.x;
    else
      this.point2.y = this.point1.y;
    this.ptEnds = this.newPointArray(4);
    this.ptStub = this.newPointArray(4);
    this.ptEnds[0] = this.point1;
    this.ptEnds[1] = this.point2;
    this.flip = this.hasFlag(GyratorElm.FLAG_FLIP) ? -1 : 1;
    this.interpPoint(this.point1, this.point2, this.ptEnds[2], 0, -this.dsign * this.width * this.flip);
    this.interpPoint(this.point1, this.point2, this.ptEnds[3], 1, -this.dsign * this.width * this.flip);
    const cs = 0.5 - 12 / this.dn;
    for (let i = 0; i !== 4; i += 2) {
      this.interpPoint(this.ptEnds[i], this.ptEnds[i + 1], this.ptStub[i], cs);
      this.interpPoint(this.ptEnds[i + 1], this.ptEnds[i], this.ptStub[i + 1], cs);
    }
    this.boxTL = this.ptStub[0];
    this.boxTR = this.ptStub[1];
    this.boxBL = this.ptStub[2];
    this.boxBR = this.ptStub[3];
    const cx = Math.floor((this.boxTL.x + this.boxBR.x) / 2);
    const cy = Math.floor((this.boxTL.y + this.boxBR.y) / 2);
    if (this.hasFlag(GyratorElm.FLAG_VERTICAL)) {
      this.arrowTail = new Point(cx, cy + 6);
      this.arrowHead = new Point(cx, cy + 14);
    } else {
      this.arrowTail = new Point(cx - 8, cy + 8);
      this.arrowHead = new Point(cx + 8, cy + 8);
    }
    this.arrowPoly = this.calcArrow(this.arrowTail, this.arrowHead, 4, 3);
  }
  getPost(n) {
    return this.ptEnds[n];
  }
  getPostCount() {
    return 4;
  }
  reset() {
    this.currents[0] = this.currents[1] = 0;
    this.nodes[0].v = this.nodes[1].v = this.nodes[2].v = this.nodes[3].v = 0;
    this.curcounts[0] = this.curcounts[1] = 0;
  }
  // Gyrator equations (admittance form):
  //   I1 =  G * V2
  //   I2 = -G * V1
  // where G = 1/R is the gyration conductance.  Linear, memoryless: the
  // entire behavior is captured by stamping two voltage-controlled current
  // sources -- no doStep().
  stamp() {
    const g = 1 / this.gyrResistance;
    CircuitElm.sim.stampVCCurrentSource(this.nodes[0], this.nodes[2], this.nodes[1], this.nodes[3], g);
    CircuitElm.sim.stampVCCurrentSource(this.nodes[1], this.nodes[3], this.nodes[0], this.nodes[2], -g);
  }
  calculateCurrent() {
    const g = 1 / this.gyrResistance;
    const v1 = this.nodes[0].v - this.nodes[2].v;
    const v2 = this.nodes[1].v - this.nodes[3].v;
    this.currents[0] = g * v2;
    this.currents[1] = -g * v1;
  }
  getCurrent() {
    return this.currents[0];
  }
  // for scope
  getCurrentIntoNode(n) {
    if (n < 2)
      return -this.currents[n];
    return this.currents[n - 2];
  }
  // VCCS stamps couple all nodes, so they must all be in the same matrix
  getMatrixConnection(n1, n2) {
    return true;
  }
  getConnection(n1, n2) {
    if (this.comparePair(n1, n2, 0, 2))
      return true;
    if (this.comparePair(n1, n2, 1, 3))
      return true;
    return false;
  }
  getInfo(arr) {
    arr[0] = "gyrator";
    arr[1] = "R = " + CircuitElm.getUnitText(this.gyrResistance, "Ω");
    arr[2] = "Vd1 = " + CircuitElm.getVoltageText(this.nodes[0].v - this.nodes[2].v);
    arr[3] = "Vd2 = " + CircuitElm.getVoltageText(this.nodes[1].v - this.nodes[3].v);
    arr[4] = "I1 = " + CircuitElm.getCurrentText(this.currents[0]);
    arr[5] = "I2 = " + CircuitElm.getCurrentText(this.currents[1]);
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Gyration Resistance (Ω)", this.gyrResistance, 1, 0);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0)
      this.gyrResistance = ei.value;
  }
  flipX(c2, count) {
    if (this.hasFlag(GyratorElm.FLAG_VERTICAL))
      this.flags ^= GyratorElm.FLAG_FLIP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    if (!this.hasFlag(GyratorElm.FLAG_VERTICAL))
      this.flags ^= GyratorElm.FLAG_FLIP;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    this.flags ^= GyratorElm.FLAG_VERTICAL;
    this.width *= -1;
    super.flipXY(xmy, count);
  }
}

class HalfAdderElm extends ChipElm {
  hasReset() {
    return false;
  }
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
    }
  }
  getChipName() {
    return "Half Adder";
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = 2;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_E, "S");
    this.pins[0].output = true;
    this.pins[1] = new Pin(this, 1, ChipElm.SIDE_E, "C");
    this.pins[1].output = true;
    this.pins[2] = new Pin(this, 0, ChipElm.SIDE_W, "A");
    this.pins[3] = new Pin(this, 1, ChipElm.SIDE_W, "B");
  }
  getPostCount() {
    return 4;
  }
  getVoltageSourceCount() {
    return 2;
  }
  execute() {
    this.pins[0].value = this.pins[2].value !== this.pins[3].value;
    this.pins[1].value = this.pins[2].value && this.pins[3].value;
  }
  getDumpType() {
    return 195;
  }
}

class LookupEntry {
  lo;
  hi;
  template;
  constructor(lo, hi, template) {
    this.lo = lo;
    this.hi = hi;
    this.template = template;
  }
  getText(value) {
    let result = "";
    let pos = 0;
    while (pos < this.template.length) {
      const open = this.template.indexOf("{", pos);
      if (open < 0) {
        result += this.template.substring(pos);
        break;
      }
      result += this.template.substring(pos, open);
      const close = this.template.indexOf("}", open);
      if (close < 0) {
        result += this.template.substring(open);
        break;
      }
      const exprStr = this.template.substring(open + 1, close);
      try {
        const ep = new ExprParser(exprStr);
        const expr = ep.parseExpression();
        if (ep.gotError() === null) {
          const es = new ExprState(1);
          es.values[0] = value;
          const res = expr.eval(es);
          const intRes = Math.floor(res);
          if (res === intRes)
            result += intRes;
          else
            result += res;
        } else {
          CirSim.console("ep.got error: " + exprStr);
          result += "{" + exprStr + "}";
        }
      } catch (e) {
        result += "{" + exprStr + "}";
      }
      pos = close + 1;
    }
    return result;
  }
}
class InstructionDisplayElm extends CircuitElm {
  busWidth = 4;
  threshold = 2.5;
  lookupText = "";
  entries = [];
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.lookupText = "0=text0\n1=text1\n0x2-0xF=other ({a})\n";
      this.parseEntries(null);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
    }
  }
  getXmlDumpType() {
    return "ins";
  }
  getPostCount() {
    return this.busWidth;
  }
  getPostWidth(n) {
    return this.busWidth;
  }
  getNumHandles() {
    return 1;
  }
  getVoltageSourceCount() {
    return 0;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "bw", this.busWidth);
    if (this.threshold !== 2.5)
      CircuitXMLSerializer.dumpAttr(elem, "th", this.threshold);
    if (this.lookupText != null && this.lookupText.length > 0)
      elem.appendChild(doc.createTextNode(this.lookupText));
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.busWidth = xml.parseIntAttr("bw", this.busWidth);
    this.threshold = xml.parseDoubleAttr("th", this.threshold);
    this.lookupText = "";
    try {
      const s = xml.parseContents();
      CirSim.console("lookupText: " + s);
      this.lookupText = s ?? "";
    } catch (e) {
      CirSim.console("exception in undump " + e);
    }
    if (this.lookupText === null)
      this.lookupText = "";
    this.parseEntries(null);
  }
  getPost(n) {
    return new Point(this.x, this.y, n);
  }
  setPoints() {
    super.setPoints();
    this.lead1 = new Point();
  }
  readInputValue() {
    let value = 0;
    for (let i = 0; i !== this.busWidth; i++)
      if (this.nodes[i].v > this.threshold)
        value |= 1 << i;
    return value;
  }
  getDisplayText() {
    const value = this.readInputValue();
    for (let i = 0; i !== this.entries.length; i++) {
      const entry = this.entries[i];
      if (value >= entry.lo && value <= entry.hi)
        return entry.getText(value);
    }
    return String(value);
  }
  draw(g) {
    g.save();
    const selected = this.needsHighlight();
    const fontSize = 14;
    g.context.font = (selected ? "bold " : "") + fontSize + "px SansSerif";
    g.setColor(selected ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    const s = this.getDisplayText();
    this.interpPoint(
      this.point1,
      this.point2,
      this.lead1,
      1 - (Math.floor(g.context.measureText(s).width) / 2 + 8) / this.dn
    );
    this.setBbox(this.point1, this.lead1, 0);
    this.drawCenteredText(g, s, this.x2, this.y2, true);
    this.setVoltageColor(g, this.nodes[0].v);
    if (selected)
      g.setColor(CircuitElm.selectColor);
    CircuitElm.drawThickLine(g, this.point1, this.lead1, 5);
    this.drawPosts(g);
    g.restore();
  }
  addRoutingObstacle(router) {
    router.addWire(this.point1.x, this.point1.y, this.x2, this.y2);
    router.addObstacle(this.x2 - 10, this.y2 - 10, this.x2 + 10, this.y2 + 10);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getInfo(arr) {
    arr[0] = "instruction display";
    const value = this.readInputValue();
    arr[1] = "in = " + value + " (0x" + value.toString(16).toUpperCase() + ")";
    arr[2] = "text = " + this.getDisplayText();
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Bus Width", this.busWidth, 2, 32).setDimensionless();
    if (n === 1)
      return new EditInfo("Threshold Voltage", this.threshold);
    if (n === 2) {
      const ei = new EditInfo("Lookup Table", 0);
      ei.textArea = { value: this.lookupText, element: null };
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 1 && ei.value <= 32) {
        this.busWidth = Math.floor(ei.value);
        this.allocNodes();
      } else
        ei.setError("must be between 1 and 32");
    }
    if (n === 1)
      this.threshold = ei.value;
    if (n === 2) {
      this.lookupText = ei.textArea.element ? ei.textArea.element.value : ei.textArea.value;
      this.parseEntries(ei);
    }
  }
  parseEntries(ei) {
    this.entries = [];
    if (this.lookupText === null || this.lookupText.length === 0)
      return;
    const lines = this.lookupText.split("\n");
    for (let i = 0; i !== lines.length; i++) {
      const line = lines[i].trim();
      if (line.length === 0)
        continue;
      const eq = line.indexOf("=");
      if (eq < 0) {
        if (ei !== null)
          ei.setError("missing =: " + line);
        continue;
      }
      const key = line.substring(0, eq).trim();
      const val = line.substring(eq + 1);
      try {
        const dash = this.findDash(key);
        if (dash >= 0) {
          const lo = this.parseNumber(key.substring(0, dash));
          const hi = this.parseNumber(key.substring(dash + 1));
          this.entries.push(new LookupEntry(lo, hi, val));
        } else {
          const k = this.parseNumber(key);
          this.entries.push(new LookupEntry(k, k, val));
        }
      } catch (e) {
      }
    }
  }
  findDash(s) {
    let start = 0;
    if (s.startsWith("0x") || s.startsWith("0X"))
      start = 2;
    else if (s.startsWith("0b") || s.startsWith("0B"))
      start = 2;
    return s.indexOf("-", start);
  }
  parseNumber(s) {
    s = s.trim();
    if (s.startsWith("0x") || s.startsWith("0X"))
      return parseIntStrict(s.substring(2), 16);
    if (s.startsWith("0b") || s.startsWith("0B"))
      return parseIntStrict(s.substring(2), 2);
    return parseIntStrict(s);
  }
  getConnection(n1, n2) {
    return false;
  }
}

class InverterElm extends CircuitElm {
  static FLAG_DEMORGAN = 1 << 3;
  slewRate;
  // V/ns
  highVoltage;
  gatePoly;
  pcircle;
  center;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.noDiagonal = true;
      this.slewRate = 0.5;
      this.highVoltage = GateElm.lastHighVoltage;
    } else {
      super(xa, ya, xb, yb, f);
      this.noDiagonal = true;
      this.slewRate = 0.5;
      this.highVoltage = 5;
      try {
        this.slewRate = parseFloatStrict(st.nextToken());
        this.highVoltage = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
    }
  }
  dump() {
    return super.dump() + " " + this.slewRate + " " + this.highVoltage;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "sl", this.slewRate);
    CircuitXMLSerializer.dumpAttr(elem, "hi", this.highVoltage);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.slewRate = xml.parseDoubleAttr("sl", this.slewRate);
    this.highVoltage = xml.parseDoubleAttr("hi", this.highVoltage);
  }
  getDumpType() {
    return "I".charCodeAt(0);
  }
  draw(g) {
    this.drawPosts(g);
    this.draw2Leads(g);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    CircuitElm.drawThickPolygon(g, this.gatePoly);
    if (GateElm.useEuroGates())
      this.drawCenteredText(g, "1", this.center.x, this.center.y - 6, true);
    CircuitElm.drawThickCircle(g, this.pcircle.x, this.pcircle.y, 3);
    this.curcount = this.updateDotCountImpl(this.current, this.curcount);
    this.drawDots(g, this.lead2, this.point2, this.curcount);
  }
  addRoutingObstacle(router) {
    this.addRoutingObstacleWithLeads(router, 16);
  }
  setPoints() {
    super.setPoints();
    const hs = 16;
    let ww = 16;
    if (ww > this.dn / 2)
      ww = Math.floor(this.dn / 2);
    this.lead1 = this.interpPoint(this.point1, this.point2, 0.5 - ww / this.dn);
    this.lead2 = this.interpPoint(this.point1, this.point2, 0.5 + (ww + 2) / this.dn);
    let start;
    let end;
    if (this.hasFlag(InverterElm.FLAG_DEMORGAN)) {
      this.pcircle = this.interpPoint(this.point1, this.point2, 0.5 - (ww - 4) / this.dn);
      start = this.interpPoint(this.point1, this.point2, 0.5 - (ww - 8) / this.dn);
      end = 0.5 + (ww + 2) / this.dn;
    } else {
      this.pcircle = this.interpPoint(this.point1, this.point2, 0.5 + (ww - 1) / this.dn);
      start = this.lead1;
      end = 0.5 + (ww - 5) / this.dn;
    }
    if (GateElm.useEuroGates()) {
      const pts = this.newPointArray(4);
      const l2 = this.interpPoint(this.point1, this.point2, 0.5 + (ww - 5) / this.dn);
      this.interpPoint2(this.lead1, l2, pts[0], pts[1], 0, hs);
      this.interpPoint2(this.lead1, l2, pts[3], pts[2], 1, hs);
      this.gatePoly = this.createPolygon(pts);
      this.center = this.interpPoint(this.lead1, l2, 0.5);
    } else {
      const triPoints = this.newPointArray(3);
      this.interpPoint2(start, this.lead2, triPoints[0], triPoints[1], 0, hs);
      triPoints[2] = this.interpPoint(this.point1, this.point2, end);
      this.gatePoly = this.createPolygon(triPoints);
    }
    this.setBbox(this.point1, this.point2, hs);
  }
  getVoltageSourceCount() {
    return 1;
  }
  setHighVoltage(hv) {
    this.highVoltage = hv;
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[1], this.voltSource);
  }
  lastOutputVoltage = 0;
  startIteration() {
    this.lastOutputVoltage = this.nodes[1].v;
  }
  doStep() {
    let out = this.nodes[0].v > this.highVoltage * 0.5 ? 0 : this.highVoltage;
    const maxStep = this.slewRate * CircuitElm.sim.timeStep * 1e9;
    out = Math.max(Math.min(this.lastOutputVoltage + maxStep, out), this.lastOutputVoltage - maxStep);
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[1], this.voltSource, out);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getInfo(arr) {
    arr[0] = "inverter";
    arr[1] = "Vi = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[2] = "Vo = " + CircuitElm.getVoltageText(this.nodes[1].v);
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Slew Rate (V/ns)", this.slewRate, 0, 0);
    if (n === 1)
      return new EditInfo("High Logic Voltage", this.highVoltage, 1, 10).setUnitStep();
    if (n === 2)
      return EditInfo.createCheckbox("DeMorgan's Symbol", this.hasFlag(InverterElm.FLAG_DEMORGAN));
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.slewRate = ei.value;
    if (n === 1)
      this.highVoltage = GateElm.lastHighVoltage = ei.value;
    if (n === 2) {
      if (ei.checkbox.getState())
        this.flags |= InverterElm.FLAG_DEMORGAN;
      else
        this.flags &= ~InverterElm.FLAG_DEMORGAN;
      this.setPoints();
    }
  }
  // no current path through inverter input, but indirect path through output to ground
  validate() {
    return this.validateRailNode(1);
  }
  getConnection(n1, n2) {
    return false;
  }
  hasGroundConnection(n1) {
    return n1 === 1;
  }
  getShortcut() {
    return "1".charCodeAt(0);
  }
  getCurrentIntoNode(n) {
    if (n === 1)
      return this.current;
    return 0;
  }
}

class InvertingSchmittElm extends CircuitElm {
  slewRate;
  // V/ns
  lowerTrigger;
  upperTrigger;
  state;
  logicOnLevel;
  logicOffLevel;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.noDiagonal = true;
      this.slewRate = 0.5;
      this.state = false;
      this.lowerTrigger = 1.66;
      this.upperTrigger = 3.33;
      this.logicOnLevel = 5;
      this.logicOffLevel = 0;
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.noDiagonal = true;
      this.slewRate = 0.5;
      this.lowerTrigger = 1.66;
      this.upperTrigger = 3.33;
      this.logicOnLevel = 5;
      this.logicOffLevel = 0;
      try {
        this.slewRate = parseFloatStrict(st.nextToken());
        this.lowerTrigger = parseFloatStrict(st.nextToken());
        this.upperTrigger = parseFloatStrict(st.nextToken());
        this.logicOnLevel = parseFloatStrict(st.nextToken());
        this.logicOffLevel = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "slr", this.slewRate);
    CircuitXMLSerializer.dumpAttr(elem, "lt", this.lowerTrigger);
    CircuitXMLSerializer.dumpAttr(elem, "ut", this.upperTrigger);
    CircuitXMLSerializer.dumpAttr(elem, "lon", this.logicOnLevel);
    CircuitXMLSerializer.dumpAttr(elem, "loff", this.logicOffLevel);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.slewRate = xml.parseDoubleAttr("slr", this.slewRate);
    this.lowerTrigger = xml.parseDoubleAttr("lt", this.lowerTrigger);
    this.upperTrigger = xml.parseDoubleAttr("ut", this.upperTrigger);
    this.logicOnLevel = xml.parseDoubleAttr("lon", this.logicOnLevel);
    this.logicOffLevel = xml.parseDoubleAttr("loff", this.logicOffLevel);
  }
  getDumpType() {
    return 183;
  }
  draw(g) {
    this.drawPosts(g);
    this.draw2Leads(g);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    CircuitElm.drawThickPolygon(g, this.gatePoly);
    g.setLineWidth(2);
    CircuitElm.drawPolygon(g, this.symbolPoly);
    g.setLineWidth(1);
    CircuitElm.drawThickCircle(g, this.pcircle.x, this.pcircle.y, 3);
    this.curcount = this.updateDotCountImpl(this.current, this.curcount);
    this.drawDots(g, this.lead2, this.point2, this.curcount);
  }
  gatePoly = null;
  symbolPoly = null;
  pcircle = null;
  setPoints() {
    super.setPoints();
    const hs = 16;
    let ww = 16;
    if (ww > this.dn / 2)
      ww = Math.floor(this.dn / 2);
    this.lead1 = this.interpPoint(this.point1, this.point2, 0.5 - ww / this.dn);
    this.lead2 = this.interpPoint(this.point1, this.point2, 0.5 + (ww + 2) / this.dn);
    this.pcircle = this.interpPoint(this.point1, this.point2, 0.5 + (ww - 2) / this.dn);
    const triPoints = this.newPointArray(3);
    this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[1], 0, hs);
    triPoints[2] = this.interpPoint(this.point1, this.point2, 0.5 + (ww - 5) / this.dn);
    this.gatePoly = this.createPolygon(triPoints);
    this.symbolPoly = this.getSchmittPolygon(1, 0.3);
    this.setBbox(this.point1, this.point2, hs);
  }
  getVoltageSourceCount() {
    return 1;
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[1], this.voltSource);
  }
  doStep() {
    const v0 = this.nodes[1].v;
    let out;
    if (this.state) {
      if (this.nodes[0].v > this.upperTrigger) {
        this.state = false;
        out = this.logicOffLevel;
      } else {
        out = this.logicOnLevel;
      }
    } else {
      if (this.nodes[0].v < this.lowerTrigger) {
        this.state = true;
        out = this.logicOnLevel;
      } else {
        out = this.logicOffLevel;
      }
    }
    const maxStep = this.slewRate * CircuitElm.sim.timeStep * 1e9;
    out = Math.max(Math.min(v0 + maxStep, out), v0 - maxStep);
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[1], this.voltSource, out);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getInfo(arr) {
    arr[0] = "inverting Schmitt trigger";
    arr[1] = "Vi = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[2] = "Vo = " + CircuitElm.getVoltageText(this.nodes[1].v);
  }
  dlt = 0;
  dut = 0;
  getEditInfo(n) {
    if (n === 0) {
      this.dlt = this.lowerTrigger;
      return new EditInfo("Lower threshold (V)", this.lowerTrigger, 0.01, 5);
    }
    if (n === 1) {
      this.dut = this.upperTrigger;
      return new EditInfo("Upper threshold (V)", this.upperTrigger, 0.01, 5);
    }
    if (n === 2)
      return new EditInfo("Slew Rate (V/ns)", this.slewRate, 0, 0);
    if (n === 3)
      return new EditInfo("High Logic Voltage", this.logicOnLevel, 0, 0).setUnitStep();
    if (n === 4)
      return new EditInfo("Low Voltage (V)", this.logicOffLevel, 0, 0).setUnitStep();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.dlt = ei.value;
    if (n === 1)
      this.dut = ei.value;
    if (n === 2)
      this.slewRate = ei.value;
    if (n === 3)
      this.logicOnLevel = ei.value;
    if (n === 4)
      this.logicOffLevel = ei.value;
    if (this.dlt > this.dut) {
      this.upperTrigger = this.dlt;
      this.lowerTrigger = this.dut;
    } else {
      this.upperTrigger = this.dut;
      this.lowerTrigger = this.dlt;
    }
  }
  // there is no current path through the InvertingSchmitt input, but there
  // is an indirect path through the output to ground.
  getConnection(n1, n2) {
    return false;
  }
  hasGroundConnection(n1) {
    return n1 === 1;
  }
  getCurrentIntoNode(n) {
    if (n === 1)
      return this.current;
    return 0;
  }
}

class JKFlipFlopElm extends ChipElm {
  static FLAG_RESET = 2;
  static FLAG_POSITIVE_EDGE = 4;
  static FLAG_INVERT_RESET = 8;
  hasReset() {
    return (this.flags & JKFlipFlopElm.FLAG_RESET) !== 0;
  }
  positiveEdgeTriggered() {
    return (this.flags & JKFlipFlopElm.FLAG_POSITIVE_EDGE) !== 0;
  }
  invertReset() {
    return (this.flags & JKFlipFlopElm.FLAG_INVERT_RESET) !== 0;
  }
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
    } else {
      super(xa, ya, xb, yb, f, st);
      this.pins[4].value = !this.pins[3].value;
    }
  }
  getChipName() {
    return "JK flip-flop";
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = 3;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "J");
    this.pins[1] = new Pin(this, 1, ChipElm.SIDE_W, "");
    this.pins[1].clock = true;
    this.pins[1].bubble = !this.positiveEdgeTriggered();
    this.pins[2] = new Pin(this, 2, ChipElm.SIDE_W, "K");
    this.pins[3] = new Pin(this, 0, ChipElm.SIDE_E, "Q");
    this.pins[3].output = this.pins[3].state = true;
    this.pins[4] = new Pin(this, 2, ChipElm.SIDE_E, "Q");
    this.pins[4].output = true;
    this.pins[4].lineOver = true;
    if (this.hasReset()) {
      this.pins[5] = new Pin(this, 1, ChipElm.SIDE_E, "R");
      this.pins[5].bubble = this.invertReset();
    }
  }
  getPostCount() {
    return 5 + (this.hasReset() ? 1 : 0);
  }
  getVoltageSourceCount() {
    return 2;
  }
  execute() {
    const transition = this.positiveEdgeTriggered() ? this.pins[1].value && !this.lastClock : !this.pins[1].value && this.lastClock;
    if (transition) {
      let q = this.pins[3].value;
      if (this.pins[0].value) {
        if (this.pins[2].value) q = !q;
        else q = true;
      } else if (this.pins[2].value)
        q = false;
      this.writeOutput(3, q);
    }
    this.lastClock = this.pins[1].value;
    if (this.hasReset() && this.pins[5].value !== this.invertReset())
      this.writeOutput(3, false);
    this.writeOutput(4, !this.pins[3].value);
  }
  getDumpType() {
    return 156;
  }
  getChipEditInfo(n) {
    if (n === 0)
      return EditInfo.createCheckbox("Reset Pin", this.hasReset());
    if (n === 1)
      return EditInfo.createCheckbox("Positive Edge Triggered", this.positiveEdgeTriggered());
    if (n === 2)
      return EditInfo.createCheckbox("Invert Reset", this.invertReset());
    return super.getChipEditInfo(n);
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      this.flags = ei.changeFlag(this.flags, JKFlipFlopElm.FLAG_RESET);
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    }
    if (n === 1) {
      this.flags = ei.changeFlag(this.flags, JKFlipFlopElm.FLAG_POSITIVE_EDGE);
      this.pins[1].bubble = !this.positiveEdgeTriggered();
    }
    if (n === 2) {
      this.flags = ei.changeFlag(this.flags, JKFlipFlopElm.FLAG_INVERT_RESET);
      this.setupPins();
      this.setPoints();
    }
    super.setChipEditValue(n, ei);
  }
}

class LDRElm extends CircuitElm {
  position;
  resistance = 0;
  minLux = 0.1;
  maxLux = 1e4;
  lux = 0;
  slider = null;
  labelEl = null;
  sliderText;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.position = parseFloatStrict(st.nextToken());
      this.sliderText = CustomLogicModel.unescape(st.nextToken());
    } else {
      this.position = 0.34;
      this.sliderText = Locale.LS("Light Brightness");
    }
    this.lux = this.luxFromSliderPos();
    this.resistance = this.calcResistance(this.lux);
    this.createSlider();
  }
  getPostCount() {
    return 2;
  }
  getDumpType() {
    return 374;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ps", this.position);
    CircuitXMLSerializer.dumpAttr(elem, "st", this.sliderText);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.position = xml.parseDoubleAttr("ps", this.position);
    this.sliderText = xml.parseStringAttr("st", this.sliderText) ?? this.sliderText;
    this.lux = this.luxFromSliderPos();
    this.resistance = this.calcResistance(this.lux);
    if (this.slider) {
      this.slider.setValue(Math.trunc(this.position * 100));
      if (this.labelEl) this.labelEl.textContent = this.sliderText;
    } else {
      this.createSlider();
    }
  }
  createSlider() {
    const lbl = document.createElement("div");
    lbl.textContent = this.sliderText;
    lbl.className = "topSpace";
    this.labelEl = lbl;
    CircuitElm.app.addWidgetToVerticalPanel(lbl);
    this.slider = new Scrollbar(Scrollbar.HORIZONTAL, Math.trunc(this.position * 100), 1, 0, 101);
    this.slider.addChangeHandler(() => {
      CircuitElm.app.analyzeFlag = true;
      this.setPoints();
    });
    CircuitElm.app.addWidgetToVerticalPanel(this.slider.element);
  }
  delete() {
    if (this.labelEl) CircuitElm.app.removeWidgetFromVerticalPanel(this.labelEl);
    if (this.slider) CircuitElm.app.removeWidgetFromVerticalPanel(this.slider.element);
    super.delete();
  }
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    if (this.slider) {
      this.position = this.slider.getValue() * 99e-4 + 1e-4;
      this.lux = this.luxFromSliderPos();
      this.resistance = this.calcResistance(this.lux);
    }
  }
  draw(g) {
    const hs = 6;
    this.setBbox(this.point1, this.point2, hs);
    this.draw2Leads(g);
    this.setPowerColor(g, true);
    const len = CircuitElm.distance(this.lead1, this.lead2);
    const ctx = g.context;
    ctx.save();
    ctx.lineWidth = 3;
    ctx.transform(
      (this.lead2.x - this.lead1.x) / len,
      (this.lead2.y - this.lead1.y) / len,
      -(this.lead2.y - this.lead1.y) / len,
      (this.lead2.x - this.lead1.x) / len,
      this.lead1.x,
      this.lead1.y
    );
    const grad = ctx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, this.getVoltageColor(g, this.nodes[0].v).getHexValue());
    grad.addColorStop(1, this.getVoltageColor(g, this.nodes[1].v).getHexValue());
    ctx.strokeStyle = grad;
    if (!this.showEuroResistors()) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 0; i < 4; i++) {
        ctx.lineTo((1 + 4 * i) * len / 16, hs);
        ctx.lineTo((3 + 4 * i) * len / 16, -hs);
      }
      ctx.lineTo(len, 0);
      ctx.stroke();
    } else {
      ctx.strokeRect(0, -hs, len, 2 * hs);
    }
    ctx.beginPath();
    ctx.moveTo(-8, 26);
    ctx.lineTo(8, 12);
    ctx.moveTo(2, 12);
    ctx.lineTo(8, 12);
    ctx.lineTo(8, 18);
    ctx.moveTo(12, 26);
    ctx.lineTo(26, 12);
    ctx.moveTo(20, 12);
    ctx.lineTo(26, 12);
    ctx.lineTo(26, 18);
    ctx.stroke();
    ctx.restore();
    if (this.showValues()) {
      this.lux = this.luxFromSliderPos();
      this.resistance = this.calcResistance(this.lux);
      this.drawValues(g, CircuitElm.getShortUnitText(this.resistance, "") + "Ω", hs);
    }
    this.doDots(g);
    this.drawPosts(g);
  }
  calculateCurrent() {
    this.current = (this.nodes[0].v - this.nodes[1].v) / this.resistance;
  }
  stamp() {
    this.lux = this.luxFromSliderPos();
    this.resistance = this.calcResistance(this.lux);
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
  }
  getInfo(arr) {
    arr[0] = "photoresistor";
    arr[1] = "I = " + CircuitElm.getCurrentDText(this.current);
    arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
    arr[3] = "R = " + CircuitElm.getUnitText(this.resistance, Locale.ohmString);
    arr[4] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Slider Text", 0, -1, -1);
      ei.text = this.sliderText;
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.sliderText = ei.textf.value;
      if (this.labelEl) this.labelEl.textContent = this.sliderText;
      CircuitElm.app.setiFrameHeight();
    }
    this.lux = this.luxFromSliderPos();
    this.resistance = this.calcResistance(this.lux);
  }
  calcResistance(lux) {
    return Math.round((this.maxLux - lux + 1) * 10);
  }
  luxFromSliderPos() {
    return this.maxLux * this.position + this.minLux;
  }
}

class LEDArrayElm extends ChipElm {
  diodes = null;
  currents = [];
  lastDrawTime = 0;
  decayMultiplier = 1;
  // time constant for exponential brightness decay (30ms persistence of vision)
  static brightnessTau = 0.03;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
    } else {
      super(xa, ya, xb, yb, f, st);
      try {
        this.sizeX = parseIntStrict(st.nextToken());
        this.sizeY = parseIntStrict(st.nextToken());
      } catch (e) {
      }
      this.allocNodes();
      this.setupPins();
      this.setPoints();
    }
  }
  dump() {
    return super.dump() + " " + this.sizeX + " " + this.sizeY;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "sx", this.sizeX);
    CircuitXMLSerializer.dumpAttr(elem, "sy", this.sizeY);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.sizeX = xml.parseIntAttr("sx", this.sizeX);
    this.sizeY = xml.parseIntAttr("sy", this.sizeY);
    this.allocNodes();
    this.setupPins();
    this.setPoints();
  }
  getChipName() {
    return "LED array";
  }
  setupPins() {
    if (this.sizeX === 0 || this.sizeY === 0) {
      this.sizeX = this.sizeY = 8;
      this.allocNodes();
    }
    this.pins = new Array(this.sizeX + this.sizeY);
    for (let i = 0; i !== this.sizeX; i++)
      this.pins[i] = new Pin(this, i, ChipElm.SIDE_S, "");
    for (let i = 0; i !== this.sizeY; i++)
      this.pins[i + this.sizeX] = new Pin(this, i, ChipElm.SIDE_W, "");
    this.brightness = new Array(this.sizeX * this.sizeY).fill(0);
  }
  reset() {
    this.brightness = new Array(this.sizeX * this.sizeY).fill(0);
  }
  stamp() {
    super.stamp();
    this.diodes = new Array(this.sizeX * this.sizeY);
    const model = DiodeModel.getModelWithName("default-led");
    for (let i = 0; i !== this.diodes.length; i++) {
      this.diodes[i] = new Diode(CircuitElm.sim);
      this.diodes[i].setup(model);
      this.diodes[i].stamp(this.nodes[this.sizeX + Math.trunc(i / this.sizeX)], this.nodes[i % this.sizeX]);
    }
    this.currents = new Array(this.diodes.length).fill(0);
  }
  doStep() {
    super.doStep();
    let i = 0;
    for (let iy = 0; iy !== this.sizeY; iy++)
      for (let ix = 0; ix !== this.sizeX; ix++, i++)
        this.diodes[i].doStep(this.nodes[this.sizeX + iy].v - this.nodes[ix].v);
  }
  nonLinear() {
    return true;
  }
  isDigitalChip() {
    return false;
  }
  draw(g) {
    const elapsed = CircuitElm.sim.t - this.lastDrawTime;
    this.lastDrawTime = CircuitElm.sim.t;
    this.decayMultiplier = elapsed > 0 ? Math.exp(-elapsed / LEDArrayElm.brightnessTau) : 1;
    this.drawChip(g);
    for (let ix = 0; ix !== this.sizeX; ix++) {
      for (let iy = 0; iy !== this.sizeY; iy++) {
        const i = ix + iy * this.sizeX;
        this.setLEDColor(g, i);
        if (this.isFlippedXY())
          g.fillOval(
            this.pins[iy + this.sizeX].post.x - this.cspc / 2,
            this.pins[ix].post.y - this.cspc / 2,
            this.cspc,
            this.cspc
          );
        else
          g.fillOval(
            this.pins[ix].post.x - this.cspc / 2,
            this.pins[iy + this.sizeX].post.y - this.cspc / 2,
            this.cspc,
            this.cspc
          );
      }
    }
  }
  calculateCurrent() {
    for (let ix = 0; ix !== this.sizeX; ix++)
      this.pins[ix].current = 0;
    if (this.diodes == null)
      return;
    let i = 0;
    for (let iy = 0; iy !== this.sizeY; iy++) {
      let cur = 0;
      for (let ix = 0; ix !== this.sizeX; ix++, i++) {
        this.currents[i] = this.diodes[i].calculateCurrent(this.nodes[this.sizeX + iy].v - this.nodes[ix].v);
        cur += this.currents[i];
        this.pins[ix].current += this.currents[i];
      }
      this.pins[iy + this.sizeX].current = -cur;
    }
  }
  stepFinished() {
    for (let i = 0; i !== this.currents.length; i++)
      if (Math.abs(this.currents[i]) > 1e12)
        CircuitElm.sim.stop("max current exceeded", this);
  }
  setLEDColor(g, p) {
    if (!this.currents || this.currents.length === 0) {
      g.setColor(new Color(20, 0, 0));
      return;
    }
    let w = this.currents[p] / 0.01;
    if (w > 0)
      w = 255 * (1 + 0.2 * Math.log(w));
    if (w > 255)
      w = 255;
    if (w < 20)
      w = 20;
    w = Math.max(w, this.brightness[p]);
    this.brightness[p] = w * this.decayMultiplier;
    g.setColor(new Color(Math.trunc(w), 0, 0));
  }
  getPostCount() {
    return this.sizeX + this.sizeY;
  }
  getVoltageSourceCount() {
    return 0;
  }
  getMatrixConnection(n1, n2) {
    return true;
  }
  getDumpType() {
    return 405;
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("Grid Width", this.sizeX).setDimensionless();
    if (n === 1)
      return new EditInfo("Grid Height", this.sizeY).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 2 && ei.value <= 16) {
        this.sizeX = Math.trunc(ei.value);
        this.allocNodes();
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be between 2 and 16");
      return;
    }
    if (n === 1) {
      if (ei.value >= 2 && ei.value <= 16) {
        this.sizeY = Math.trunc(ei.value);
        this.allocNodes();
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be between 2 and 16");
      return;
    }
  }
  getInfo(arr) {
    arr[0] = this.getChipName();
  }
}

class LEDElm extends DiodeElm {
  colorR;
  colorG;
  colorB;
  maxBrightnessCurrent;
  static lastLEDModelName = "default-led";
  ledLead1;
  ledLead2;
  ledCenter;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.modelName = LEDElm.lastLEDModelName;
      this.setup();
      this.maxBrightnessCurrent = 0.01;
      this.colorR = 1;
      this.colorG = this.colorB = 0;
    } else {
      super(xa, ya, xb, yb, f, st);
      if ((f & (DiodeElm.FLAG_MODEL | DiodeElm.FLAG_FWDROP)) === 0) {
        const fwdrop = 2.1024259;
        this.model = DiodeModel.getModelWithParameters(fwdrop, 0);
        this.modelName = this.model.name;
        this.setup();
      }
      this.colorR = parseFloatStrict(st.nextToken());
      this.colorG = parseFloatStrict(st.nextToken());
      this.colorB = parseFloatStrict(st.nextToken());
      this.maxBrightnessCurrent = 0.01;
      try {
        this.maxBrightnessCurrent = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
    }
  }
  getDumpType() {
    return 162;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "cr", this.colorR);
    CircuitXMLSerializer.dumpAttr(elem, "cg", this.colorG);
    CircuitXMLSerializer.dumpAttr(elem, "cb", this.colorB);
    CircuitXMLSerializer.dumpAttr(elem, "mbc", this.maxBrightnessCurrent);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.colorR = xml.parseDoubleAttr("cr", this.colorR);
    this.colorG = xml.parseDoubleAttr("cg", this.colorG);
    this.colorB = xml.parseDoubleAttr("cb", this.colorB);
    this.maxBrightnessCurrent = xml.parseDoubleAttr("mbc", this.maxBrightnessCurrent);
  }
  setPoints() {
    super.setPoints();
    const cr = 12;
    this.ledLead1 = this.interpPoint(this.point1, this.point2, 0.5 - cr / this.dn);
    this.ledLead2 = this.interpPoint(this.point1, this.point2, 0.5 + cr / this.dn);
    this.ledCenter = this.interpPoint(this.point1, this.point2, 0.5);
  }
  draw(g) {
    if (this.needsHighlight() || this.isCreating()) {
      super.draw(g);
      return;
    }
    this.setVoltageColor(g, this.nodes[0].v);
    DiodeElm.drawThickLine(g, this.point1, this.ledLead1);
    this.setVoltageColor(g, this.nodes[1].v);
    DiodeElm.drawThickLine(g, this.ledLead2, this.point2);
    g.setColor(Color.gray);
    const cr = 12;
    DiodeElm.drawThickCircle(g, this.ledCenter.x, this.ledCenter.y, cr);
    const cr2 = cr - 4;
    let w = this.current / this.maxBrightnessCurrent;
    if (w > 0)
      w = 255 * (1 + 0.2 * Math.log(w));
    if (w > 255) w = 255;
    if (w < 0) w = 0;
    const cc = new Color(Math.trunc(this.colorR * w), Math.trunc(this.colorG * w), Math.trunc(this.colorB * w));
    g.setColor(cc);
    g.fillOval(this.ledCenter.x - cr2, this.ledCenter.y - cr2, cr2 * 2, cr2 * 2);
    this.setBbox(this.point1, this.point2, cr2);
    this.updateDotCount();
    this.drawDots(g, this.point1, this.ledLead1, this.curcount);
    this.drawDots(g, this.point2, this.ledLead2, -this.curcount);
    this.drawPosts(g);
  }
  getElmType() {
    return "LED";
  }
  getInfo(arr) {
    super.getInfo(arr);
    if (this.model.oldStyle)
      arr[0] = "LED";
    else
      arr[0] = Locale.LS("LED") + " (" + this.modelName + ")";
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("Red Value (0-1)", this.colorR, 0, 1).setDimensionless();
    if (n === 1) return new EditInfo("Green Value (0-1)", this.colorG, 0, 1).setDimensionless();
    if (n === 2) return new EditInfo("Blue Value (0-1)", this.colorB, 0, 1).setDimensionless();
    if (n === 3) return new EditInfo("Max Brightness Current (A)", this.maxBrightnessCurrent, 0, 0.1);
    return super.getEditInfo(n - 4);
  }
  setEditValue(n, ei) {
    if (n === 0) this.colorR = ei.value;
    if (n === 1) this.colorG = ei.value;
    if (n === 2) this.colorB = ei.value;
    if (n === 3) this.maxBrightnessCurrent = ei.value;
    super.setEditValue(n - 4, ei);
  }
  getShortcut() {
    return "l".charCodeAt(0);
  }
  setLastModelName(n) {
    LEDElm.lastLEDModelName = n;
  }
}

class LampElm extends CircuitElm {
  resistance = 0;
  roomTemp = 300;
  temp;
  nom_pow;
  nom_v;
  warmTime;
  coolTime;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.temp = this.roomTemp;
      this.nom_pow = 100;
      this.nom_v = 120;
      this.warmTime = 0.4;
      this.coolTime = 0.4;
      this.updateResistance();
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.temp = parseFloatStrict(st.nextToken());
      if (isNaN(this.temp))
        this.temp = this.roomTemp;
      this.nom_pow = parseFloatStrict(st.nextToken());
      this.nom_v = parseFloatStrict(st.nextToken());
      this.warmTime = parseFloatStrict(st.nextToken());
      this.coolTime = parseFloatStrict(st.nextToken());
      this.updateResistance();
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "te", this.temp);
    CircuitXMLSerializer.dumpAttr(elem, "np", this.nom_pow);
    CircuitXMLSerializer.dumpAttr(elem, "nv", this.nom_v);
    CircuitXMLSerializer.dumpAttr(elem, "wa", this.warmTime);
    CircuitXMLSerializer.dumpAttr(elem, "co", this.coolTime);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.temp = xml.parseDoubleAttr("te", this.temp);
    this.nom_pow = xml.parseDoubleAttr("np", this.nom_pow);
    this.nom_v = xml.parseDoubleAttr("nv", this.nom_v);
    this.warmTime = xml.parseDoubleAttr("wa", this.warmTime);
    this.coolTime = xml.parseDoubleAttr("co", this.coolTime);
  }
  getDumpType() {
    return 181;
  }
  bulbLead;
  filament;
  bulb;
  bulbR = 0;
  reset() {
    super.reset();
    this.temp = this.roomTemp;
    this.startIteration();
  }
  filament_len = 24;
  setPoints() {
    super.setPoints();
    const llen = 16;
    this.calcLeads(llen);
    this.bulbLead = this.newPointArray(2);
    this.filament = this.newPointArray(2);
    this.bulbR = 20;
    this.filament[0] = this.interpPoint(this.lead1, this.lead2, 0, this.filament_len);
    this.filament[1] = this.interpPoint(this.lead1, this.lead2, 1, this.filament_len);
    const br = this.filament_len - Math.sqrt(this.bulbR * this.bulbR - llen * llen);
    this.bulbLead[0] = this.interpPoint(this.lead1, this.lead2, 0, br);
    this.bulbLead[1] = this.interpPoint(this.lead1, this.lead2, 1, br);
    this.bulb = this.interpPoint(this.filament[0], this.filament[1], 0.5);
  }
  getTempColor() {
    const t = this.temp;
    if (t < 1200) {
      let x = Math.floor(255 * (t - 800) / 400);
      if (x < 0) x = 0;
      return `rgb(${x},0,0)`;
    }
    if (t < 1700) {
      let x = Math.floor(255 * (t - 1200) / 500);
      if (x < 0) x = 0;
      return `rgb(255,${x},0)`;
    }
    if (t < 2400) {
      let x = Math.floor(255 * (t - 1700) / 700);
      if (x < 0) x = 0;
      return `rgb(255,255,${x})`;
    }
    return "#ffffff";
  }
  draw(g) {
    const v1 = this.nodes[0].v;
    const v2 = this.nodes[1].v;
    this.setBbox(this.point1, this.point2, 4);
    this.adjustBbox(
      this.bulb.x - this.bulbR,
      this.bulb.y - this.bulbR,
      this.bulb.x + this.bulbR,
      this.bulb.y + this.bulbR
    );
    this.draw2Leads(g);
    this.setPowerColor(g, true);
    g.setColor(this.getTempColor());
    g.fillOval(this.bulb.x - this.bulbR, this.bulb.y - this.bulbR, this.bulbR * 2, this.bulbR * 2);
    g.setColor(CircuitElm.whiteColor);
    CircuitElm.drawThickCircle(g, this.bulb.x, this.bulb.y, this.bulbR);
    this.setVoltageColor(g, v1);
    CircuitElm.drawThickLine(g, this.lead1, this.filament[0]);
    this.setVoltageColor(g, v2);
    CircuitElm.drawThickLine(g, this.lead2, this.filament[1]);
    this.setVoltageColor(g, (v1 + v2) * 0.5);
    CircuitElm.drawThickLine(g, this.filament[0], this.filament[1]);
    this.updateDotCount();
    if (!this.isCreating()) {
      this.drawDots(g, this.point1, this.lead1, this.curcount);
      let cc = this.addCurCount(this.curcount, (this.dn - 16) / 2);
      this.drawDots(g, this.lead1, this.filament[0], cc);
      cc = this.addCurCount(cc, this.filament_len);
      this.drawDots(g, this.filament[0], this.filament[1], cc);
      cc = this.addCurCount(cc, 16);
      this.drawDots(g, this.filament[1], this.lead2, cc);
      cc = this.addCurCount(cc, this.filament_len);
      this.drawDots(g, this.lead2, this.point2, this.curcount);
    }
    this.drawPosts(g);
  }
  calculateCurrent() {
    this.current = (this.nodes[0].v - this.nodes[1].v) / this.resistance;
    if (this.resistance === 0)
      this.current = 0;
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[0]);
    CircuitElm.sim.stampNonLinear(this.nodes[1]);
  }
  nonLinear() {
    return true;
  }
  updateResistance() {
    const nom_r = this.nom_v * this.nom_v / this.nom_pow;
    const tp = this.temp > 5390 ? 5390 : this.temp;
    this.resistance = nom_r * (1.26104 - 4.90662 * Math.sqrt(17.1839 / tp - 318794e-8) - 7.8569 / (tp - 187.56));
  }
  startIteration() {
    this.updateResistance();
    const cap = 157e-6 * this.nom_pow;
    const capw = cap * this.warmTime / 0.4;
    const capc = cap * this.coolTime / 0.4;
    this.temp += this.getPower() * CircuitElm.sim.timeStep / capw;
    const cr = 2600 / this.nom_pow;
    this.temp -= CircuitElm.sim.timeStep * (this.temp - this.roomTemp) / (capc * cr);
  }
  doStep() {
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
  }
  getInfo(arr) {
    arr[0] = "lamp";
    this.getBasicInfo(arr);
    arr[3] = "R = " + CircuitElm.getUnitText(this.resistance, Locale.ohmString);
    arr[4] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
    arr[5] = "T = " + Math.trunc(this.temp) + " K";
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("Nominal Power", this.nom_pow, 0, 0).setPositive();
    if (n === 1) return new EditInfo("Nominal Voltage", this.nom_v, 0, 0).setPositive().setUnitStep();
    if (n === 2) return new EditInfo("Warmup Time (s)", this.warmTime, 0, 0).setPositive();
    if (n === 3) return new EditInfo("Cooldown Time (s)", this.coolTime, 0, 0).setPositive();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0) this.nom_pow = ei.value;
    if (n === 1 && ei.value > 0) this.nom_v = ei.value;
    if (n === 2 && ei.value > 0) this.warmTime = ei.value;
    if (n === 3 && ei.value > 0) this.coolTime = ei.value;
  }
  getScopeValue(x) {
    return x === VAL_R ? this.resistance : super.getScopeValue(x);
  }
  getScopeUnits(x) {
    return x === VAL_R ? UNITS_OHMS : super.getScopeUnits(x);
  }
  canShowValueInScope(x) {
    return x === VAL_R;
  }
}

class LatchElm extends ChipElm {
  static FLAG_STATE = 2;
  static FLAG_NO_EDGE = 4;
  static FLAG_RESET = 8;
  static FLAG_SET = 16;
  // enable mode stored in bits 5-6: 0=none, 1=one each, 2=two each
  static FLAG_ENABLE_MASK = 32 | 64;
  static FLAG_ENABLE_SHIFT = 5;
  static FLAG_RESET_INVERT = 128;
  hasReset() {
    return (this.flags & LatchElm.FLAG_RESET) !== 0;
  }
  hasSet() {
    return (this.flags & LatchElm.FLAG_SET) !== 0;
  }
  resetActiveLow() {
    return (this.flags & LatchElm.FLAG_RESET_INVERT) !== 0;
  }
  enableMode() {
    return (this.flags & LatchElm.FLAG_ENABLE_MASK) >> LatchElm.FLAG_ENABLE_SHIFT;
  }
  inputEnableCount() {
    return this.enableMode();
  }
  outputEnableCount() {
    return this.enableMode();
  }
  hasOutputEnable() {
    return this.enableMode() > 0;
  }
  vSources = null;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.flags |= LatchElm.FLAG_STATE;
      this.setupPins();
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
      if ((this.flags & LatchElm.FLAG_STATE) === 0) {
        this.flags |= LatchElm.FLAG_STATE;
        this.setupPins();
      }
      this.restoreOutputValues();
    }
  }
  getChipName() {
    return this.isEdgeTriggered() ? "Register" : "Latch";
  }
  needsBits() {
    return true;
  }
  allowBus() {
    return true;
  }
  isEdgeTriggered() {
    return (this.flags & LatchElm.FLAG_NO_EDGE) === 0;
  }
  nonLinear() {
    return this.hasOutputEnable();
  }
  setupPins() {
    this.sizeX = 2;
    const ieCount = this.inputEnableCount();
    const oeCount = this.outputEnableCount();
    const extraLeftPins = (this.hasReset() ? 1 : 0) + (this.hasSet() ? 1 : 0) + ieCount;
    const extraRightPins = oeCount;
    const bitsY = this.useBus() ? 1 : this.bits;
    this.sizeY = Math.max(bitsY + 1 + extraLeftPins, bitsY + extraRightPins);
    this.pins = new Array(this.getPostCount());
    this.makeBitPins(this.bits, 0, ChipElm.SIDE_W, 0, "I", false, false, false);
    this.makeBitPins(this.bits, 0, ChipElm.SIDE_E, this.bits, "O", !this.hasOutputEnable(), (this.flags & LatchElm.FLAG_STATE) !== 0, false);
    let pinIndex = this.bits * 2;
    let leftPos = bitsY;
    let rightPos = bitsY;
    this.pins[this.loadPin = pinIndex++] = new Pin(this, leftPos++, ChipElm.SIDE_W, this.isEdgeTriggered() ? "" : "Ld");
    this.pins[this.loadPin].clock = this.isEdgeTriggered();
    if (this.hasReset()) {
      this.pins[this.resetPin = pinIndex++] = new Pin(this, leftPos++, ChipElm.SIDE_W, "R");
      this.pins[this.resetPin].lineOver = this.resetActiveLow();
    }
    if (this.hasSet())
      this.pins[this.setPin = pinIndex++] = new Pin(this, leftPos++, ChipElm.SIDE_W, "S");
    rightPos = leftPos;
    if (ieCount >= 1) {
      this.pins[this.ie1Pin = pinIndex++] = new Pin(this, leftPos++, ChipElm.SIDE_W, "IE");
      this.pins[this.ie1Pin].lineOver = true;
    }
    if (ieCount >= 2) {
      this.pins[this.ie2Pin = pinIndex++] = new Pin(this, leftPos++, ChipElm.SIDE_W, "IE");
      this.pins[this.ie2Pin].lineOver = true;
    }
    if (oeCount >= 1) {
      this.pins[this.oe1Pin = pinIndex++] = new Pin(this, rightPos++, ChipElm.SIDE_E, "OE");
      this.pins[this.oe1Pin].lineOver = true;
    }
    if (oeCount >= 2) {
      this.pins[this.oe2Pin = pinIndex++] = new Pin(this, rightPos++, ChipElm.SIDE_E, "OE");
      this.pins[this.oe2Pin].lineOver = true;
    }
    this.intNodes = pinIndex;
    this.allocNodes();
  }
  lastLoad = false;
  outputValues = null;
  lastOutputValues() {
    if (this.outputValues === null)
      this.outputValues = new Array(this.bits).fill(false);
    return this.outputValues;
  }
  restoreOutputValues() {
    const ov = this.lastOutputValues();
    for (let i = 0; i !== this.bits; i++)
      ov[i] = this.pins[i + this.bits].value;
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.restoreOutputValues();
  }
  reset() {
    super.reset();
    this.outputValues = null;
  }
  // execute() is used by ChipElm.doStep() when there's no output enable.
  // when output enable is present, we override doStep() entirely.
  execute() {
    this.doLoad();
    for (let i = 0; i !== this.bits; i++)
      this.pins[i + this.bits].value = this.lastOutputValues()[i];
  }
  // shared load logic
  doLoad() {
    const ov = this.lastOutputValues();
    if (this.hasSet() && this.pins[this.setPin].value) {
      for (let i = 0; i !== this.bits; i++)
        ov[i] = true;
      this.lastLoad = this.pins[this.loadPin].value;
      return;
    }
    if (this.hasReset() && this.pins[this.resetPin].value !== this.resetActiveLow()) {
      for (let i = 0; i !== this.bits; i++)
        ov[i] = false;
      this.lastLoad = this.pins[this.loadPin].value;
      return;
    }
    let inputEnabled = true;
    if (this.inputEnableCount() >= 1 && this.pins[this.ie1Pin].value)
      inputEnabled = false;
    if (this.inputEnableCount() >= 2 && this.pins[this.ie2Pin].value)
      inputEnabled = false;
    if (inputEnabled && this.pins[this.loadPin].value && (!this.isEdgeTriggered() || !this.lastLoad))
      for (let i = 0; i !== this.bits; i++)
        ov[i] = this.pins[i].value;
    this.lastLoad = this.pins[this.loadPin].value;
  }
  startIteration() {
    if (!this.hasOutputEnable()) {
      super.startIteration();
      return;
    }
    for (let i = 0; i < this.getPostCount(); i++) {
      const p = this.pins[i];
      if (!p.output)
        p.value = this.nodes[i].v > this.getThreshold();
    }
    this.doLoad();
  }
  doStep() {
    if (!this.hasOutputEnable()) {
      super.doStep();
      return;
    }
    let outputEnabled = true;
    if (this.outputEnableCount() >= 1 && this.pins[this.oe1Pin].value)
      outputEnabled = false;
    if (this.outputEnableCount() >= 2 && this.pins[this.oe2Pin].value)
      outputEnabled = false;
    for (let i = 0; i < this.bits; i++) {
      const v = this.lastOutputValues()[i] ? this.highVoltage : 0;
      CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[this.intNodes + i], this.vSources[i], v);
      if (outputEnabled)
        CircuitElm.sim.stampResistor(this.nodes[this.intNodes + i], this.nodes[this.bits + i], 1);
      else
        CircuitElm.sim.stampResistor(this.nodes[this.bits + i], CircuitNode.ground, 1e8);
    }
  }
  stamp() {
    if (!this.hasOutputEnable()) {
      super.stamp();
      return;
    }
    for (let i = 0; i < this.bits; i++) {
      CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[this.intNodes + i], this.vSources[i]);
      CircuitElm.sim.stampNonLinear(this.nodes[this.intNodes + i]);
      CircuitElm.sim.stampNonLinear(this.nodes[this.bits + i]);
    }
  }
  getVoltageSourceCount() {
    return this.bits;
  }
  getInternalNodeCount() {
    return this.hasOutputEnable() ? this.bits : 0;
  }
  setVoltageSource(j, vs) {
    if (this.hasOutputEnable()) {
      if (this.vSources === null || this.vSources.length !== this.bits)
        this.vSources = new Array(this.bits);
      this.vSources[j] = vs;
      vs.setNodes(CircuitNode.ground, this.nodes[this.intNodes + j]);
    } else {
      super.setVoltageSource(j, vs);
    }
  }
  getMatrixConnection(n1, n2) {
    if (this.hasOutputEnable()) {
      for (let i = 0; i < this.bits; i++)
        if (this.comparePair(n1, n2, this.intNodes + i, this.bits + i))
          return true;
    }
    return false;
  }
  getConnection(n1, n2) {
    return false;
  }
  hasGroundConnection(n1) {
    if (this.hasOutputEnable())
      return n1 >= this.bits && n1 < this.bits * 2;
    return this.pins[n1].output;
  }
  getPostCount() {
    return this.bits * 2 + 1 + (this.hasReset() ? 1 : 0) + (this.hasSet() ? 1 : 0) + this.inputEnableCount() + this.outputEnableCount();
  }
  getDumpType() {
    return 168;
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
    if (n === 1)
      return EditInfo.createCheckbox("Edge Triggered", this.isEdgeTriggered());
    if (n === 2)
      return EditInfo.createCheckbox("Reset Pin", this.hasReset());
    if (n === 3)
      return EditInfo.createCheckbox("Set Pin", this.hasSet());
    if (n === 4) {
      const ei = new EditInfo("Enable Pins", 0);
      ei.choice = new Choice();
      ei.choice.add("None");
      ei.choice.add("1 Input/Output Enable");
      ei.choice.add("2 Input/Output Enables");
      ei.choice.select(this.enableMode());
      return ei;
    }
    if (n === 5 && this.hasReset())
      return EditInfo.createCheckbox("Invert Reset", this.resetActiveLow());
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 2 && this.bits !== Math.floor(ei.value)) {
        this.bits = Math.floor(ei.value);
        this.setupPins();
        this.setPoints();
      } else if (ei.value < 2)
        ei.setError("must be >= 2");
    }
    if (n === 1) {
      this.flags = ei.changeFlagInverted(this.flags, LatchElm.FLAG_NO_EDGE);
      this.setupPins();
      this.setPoints();
      ei.newDialog = true;
    }
    if (n === 2) {
      this.flags = ei.changeFlag(this.flags, LatchElm.FLAG_RESET);
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    }
    if (n === 3) {
      this.flags = ei.changeFlag(this.flags, LatchElm.FLAG_SET);
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    }
    if (n === 4) {
      const mode = ei.choice.getSelectedIndex();
      this.flags = this.flags & ~LatchElm.FLAG_ENABLE_MASK | mode << LatchElm.FLAG_ENABLE_SHIFT;
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    }
    if (n === 5) {
      this.flags = ei.changeFlag(this.flags, LatchElm.FLAG_RESET_INVERT);
      this.setupPins();
      this.setPoints();
    }
  }
}

class LineElm extends GraphicElm {
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.x2 = xxOrXa;
      this.y2 = yyOrYa;
      this.setBbox(this.x, this.y, this.x2, this.y2);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.x2 = xb;
      this.y2 = yb;
      this.setBbox(this.x, this.y, this.x2, this.y2);
    }
  }
  getDumpType() {
    return 423;
  }
  drag(xx, yy) {
    this.x2 = xx;
    this.y2 = yy;
  }
  creationFailed() {
    return Math.hypot(this.x - this.x2, this.y - this.y2) < 16;
  }
  draw(g) {
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.GRAY);
    this.setBbox(this.x, this.y, this.x2, this.y2);
    g.drawLine(this.x, this.y, this.x2, this.y2);
  }
  getEditInfo(n) {
    return null;
  }
  setEditValue(n, ei) {
  }
  getInfo(arr) {
  }
  getShortcut() {
    return 0;
  }
  getMouseDistance(gx, gy) {
    const thresh = 10;
    const d2 = this.lineDistanceSq(this.x, this.y, this.x2, this.y2, gx, gy);
    if (d2 <= thresh * thresh)
      return d2;
    return -1;
  }
}

class LogicInputElm extends SwitchElm {
  static FLAG_TERNARY = 1;
  static FLAG_NUMERIC = 2;
  hiV;
  loV;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya, false);
      this.hiV = 5;
      this.loV = 0;
    } else {
      super(xa, ya, xb, yb, f, st);
      try {
        this.hiV = parseFloatStrict(st.nextToken());
        this.loV = parseFloatStrict(st.nextToken());
      } catch (e) {
        this.hiV = 5;
        this.loV = 0;
      }
      if (this.isTernary())
        this.posCount = 3;
    }
  }
  isTernary() {
    return (this.flags & LogicInputElm.FLAG_TERNARY) !== 0;
  }
  isNumeric() {
    return (this.flags & (LogicInputElm.FLAG_TERNARY | LogicInputElm.FLAG_NUMERIC)) !== 0;
  }
  getDumpType() {
    return "L".charCodeAt(0);
  }
  showPropertiesOnCreate() {
    return false;
  }
  dump() {
    return super.dump() + " " + this.hiV + " " + this.loV;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    if (this.hiV !== 5)
      CircuitXMLSerializer.dumpAttr(elem, "hi", this.hiV);
    if (this.loV !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "lo", this.loV);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.hiV = xml.parseDoubleAttr("hi", this.hiV);
    this.loV = xml.parseDoubleAttr("lo", this.loV);
  }
  getPostCount() {
    return 1;
  }
  setPoints() {
    super.setPoints();
    this.lead1 = this.interpPoint(this.point1, this.point2, 1 - 12 / this.dn);
  }
  draw(g) {
    g.save();
    const f = new Font("SansSerif", Font.BOLD, 20);
    g.setFont(f);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
    let s = this.position === 0 ? "L" : "H";
    if (this.isNumeric())
      s = "" + this.position;
    this.setBbox(this.point1, this.lead1, 0);
    this.drawCenteredText(g, s, this.x2, this.y2, true);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.updateDotCount();
    this.drawDots(g, this.point1, this.lead1, -this.curcount);
    this.drawPosts(g);
    g.restore();
  }
  getSwitchRect() {
    return new Rectangle(this.x2 - 10, this.y2 - 10, 20, 20);
  }
  setCurrent(vs, c) {
    this.current = c;
  }
  calculateCurrent() {
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[0], this.voltSource);
  }
  isLogicInputElm() {
    return true;
  }
  isWireEquivalent() {
    return false;
  }
  isRemovableWire() {
    return false;
  }
  doStep() {
    let v = this.position === 0 ? this.loV : this.hiV;
    if (this.isTernary())
      v = this.loV + this.position * (this.hiV - this.loV) * 0.5;
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[0], this.voltSource, v);
  }
  getVoltageSourceCount() {
    return 1;
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getElmType() {
    return "logic input";
  }
  getInfo(arr) {
    arr[0] = "logic input";
    arr[1] = this.position === 0 ? "low" : "high";
    if (this.isNumeric())
      arr[1] = "" + this.position;
    arr[1] += " (" + CircuitElm.getVoltageText(this.nodes[0].v) + ")";
    arr[2] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
  }
  hasGroundConnection(n1) {
    return true;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, 0, 0);
      ei.checkbox = new Checkbox("Momentary Switch", this.momentary);
      return ei;
    }
    if (n === 1)
      return new EditInfo("High Logic Voltage", this.hiV, 10, -10).setUnitStep();
    if (n === 2)
      return new EditInfo("Low Voltage", this.loV, 10, -10).setUnitStep();
    if (n === 3) {
      const ei = new EditInfo("", 0, 0, 0);
      ei.checkbox = new Checkbox("Numeric", this.isNumeric());
      return ei;
    }
    if (n === 4) {
      const ei = new EditInfo("", 0, 0, 0);
      ei.checkbox = new Checkbox("Ternary", this.isTernary());
      return ei;
    }
    if (n === 5)
      return this.getKeyShortcutEditInfo();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.momentary = ei.checkbox.getState();
    if (n === 1)
      this.hiV = ei.value;
    if (n === 2)
      this.loV = ei.value;
    if (n === 3) {
      if (ei.checkbox.getState())
        this.flags |= LogicInputElm.FLAG_NUMERIC;
      else
        this.flags &= ~LogicInputElm.FLAG_NUMERIC;
    }
    if (n === 4) {
      if (ei.checkbox.getState())
        this.flags |= LogicInputElm.FLAG_TERNARY;
      else
        this.flags &= ~LogicInputElm.FLAG_TERNARY;
      this.posCount = this.isTernary() ? 3 : 2;
    }
    if (n === 5)
      this.setKeyShortcutEditValue(ei);
  }
  addRoutingObstacle(router) {
    router.addWire(this.point1.x, this.point1.y, this.lead1.x, this.lead1.y);
    router.addObstacle(this.x2 - 10, this.y2 - 10, this.x2 + 10, this.y2 + 10);
  }
  getShortcut() {
    return "i".charCodeAt(0);
  }
  getCurrentIntoNode(n) {
    return this.current;
  }
  validate() {
    return this.validateRailNode(0);
  }
}

class LogicOutputElm extends CircuitElm {
  static FLAG_TERNARY = 1;
  static FLAG_NUMERIC = 2;
  static FLAG_PULLDOWN = 4;
  threshold;
  value;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.threshold = 2.5;
    } else {
      super(xa, ya, xb, yb, f);
      try {
        this.threshold = parseFloatStrict(st.nextToken());
      } catch (e) {
        this.threshold = 2.5;
      }
    }
  }
  dump() {
    return super.dump() + " " + this.threshold;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    if (this.threshold !== 2.5)
      CircuitXMLSerializer.dumpAttr(elem, "th", this.threshold);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.threshold = xml.parseDoubleAttr("th", this.threshold);
  }
  isLogicOutputElm() {
    return true;
  }
  getDumpType() {
    return "M".charCodeAt(0);
  }
  getPostCount() {
    return 1;
  }
  isTernary() {
    return (this.flags & LogicOutputElm.FLAG_TERNARY) !== 0;
  }
  isNumeric() {
    return (this.flags & (LogicOutputElm.FLAG_TERNARY | LogicOutputElm.FLAG_NUMERIC)) !== 0;
  }
  needsPullDown() {
    return (this.flags & LogicOutputElm.FLAG_PULLDOWN) !== 0;
  }
  setPoints() {
    super.setPoints();
    this.lead1 = this.interpPoint(this.point1, this.point2, 1 - 12 / this.dn);
  }
  draw(g) {
    g.save();
    const f = new Font("SansSerif", Font.BOLD, 20);
    g.setFont(f);
    g.setColor(CircuitElm.lightGrayColor);
    let s = this.nodes[0].v < this.threshold ? "L" : "H";
    if (this.isTernary()) {
      if (this.nodes[0].v > this.threshold * 1.5)
        s = "2";
      else if (this.nodes[0].v > this.threshold * 0.5)
        s = "1";
      else
        s = "0";
    } else if (this.isNumeric())
      s = this.nodes[0].v < this.threshold ? "0" : "1";
    this.value = s;
    this.setBbox(this.point1, this.lead1, 0);
    this.drawCenteredText(g, s, this.x2, this.y2, true);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.drawPosts(g);
    g.restore();
  }
  stamp() {
    if (this.needsPullDown())
      CircuitElm.sim.stampResistor(this.nodes[0], CircuitNode.ground, 1e6);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getInfo(arr) {
    arr[0] = "logic output";
    arr[1] = this.nodes[0].v < this.threshold ? "low" : "high";
    if (this.isNumeric())
      arr[1] = this.value;
    arr[2] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Threshold", this.threshold, 10, -10);
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Current Required", this.needsPullDown());
      return ei;
    }
    if (n === 2) {
      const ei = new EditInfo("", 0, 0, 0);
      ei.checkbox = new Checkbox("Numeric", this.isNumeric());
      return ei;
    }
    if (n === 3) {
      const ei = new EditInfo("", 0, 0, 0);
      ei.checkbox = new Checkbox("Ternary", this.isTernary());
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.threshold = ei.value;
    if (n === 1) {
      if (ei.checkbox.getState())
        this.flags |= LogicOutputElm.FLAG_PULLDOWN;
      else
        this.flags &= ~LogicOutputElm.FLAG_PULLDOWN;
    }
    if (n === 2) {
      if (ei.checkbox.getState())
        this.flags |= LogicOutputElm.FLAG_NUMERIC;
      else
        this.flags &= ~LogicOutputElm.FLAG_NUMERIC;
    }
    if (n === 3) {
      if (ei.checkbox.getState())
        this.flags |= LogicOutputElm.FLAG_TERNARY;
      else
        this.flags &= ~LogicOutputElm.FLAG_TERNARY;
    }
  }
  addRoutingObstacle(router) {
    router.addWire(this.point1.x, this.point1.y, this.lead1.x, this.lead1.y);
    router.addObstacle(this.x2 - 10, this.y2 - 10, this.x2 + 10, this.y2 + 10);
  }
  getShortcut() {
    return "o".charCodeAt(0);
  }
}

class MBBSwitchElm extends SwitchElm {
  link = 0;
  voltSources;
  currents;
  curcounts;
  both = false;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f, st);
    if (st !== void 0) {
      this.link = parseIntStrict(st.nextToken());
    }
    this.setup();
  }
  setup() {
    this.noDiagonal = true;
    this.voltSources = new Array(2);
    this.currents = [0, 0];
    this.curcounts = [0, 0, 0];
    this.allocNodes();
  }
  getDumpType() {
    return 416;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "li", this.link);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.link = xml.parseIntAttr("li", this.link);
  }
  openhs = 16;
  swposts;
  swpoles;
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    this.swposts = this.newPointArray(2);
    this.swpoles = this.newPointArray(4);
    for (let i = 0; i !== 2; i++) {
      const hs = i === 0 ? this.openhs : -this.openhs;
      this.interpPoint(this.lead1, this.lead2, this.swpoles[i], 1, hs);
      this.interpPoint(this.point1, this.point2, this.swposts[i], 1, hs);
    }
    this.posCount = 4;
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.openhs);
    this.adjustBbox(this.swposts[0], this.swposts[1]);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    for (let i = 0; i !== 2; i++) {
      this.setVoltageColor(g, this.nodes[i + 1].v);
      CircuitElm.drawThickLine(g, this.swpoles[i], this.swposts[i]);
    }
    if (!this.needsHighlight())
      g.setColor(CircuitElm.whiteColor);
    if (this.both || this.position === 0)
      CircuitElm.drawThickLine(g, this.lead1, this.swpoles[0]);
    if (this.both || this.position === 2)
      CircuitElm.drawThickLine(g, this.lead1, this.swpoles[1]);
    for (let i = 0; i !== 2; i++) {
      this.curcounts[i] = this.updateDotCountImpl(this.currents[i], this.curcounts[i]);
      this.drawDots(g, this.swpoles[i], this.swposts[i], this.curcounts[i]);
    }
    this.curcounts[2] = this.updateDotCountImpl(this.currents[0] + this.currents[1], this.curcounts[2]);
    this.drawDots(g, this.point1, this.lead1, this.curcounts[2]);
    this.drawPosts(g);
  }
  getCurrentIntoNode(n) {
    if (n === 0) return -this.currents[0] - this.currents[1];
    return this.currents[n - 1];
  }
  getSwitchRect() {
    return new Rectangle(this.lead1.x, this.lead1.y, 0, 0).union(new Rectangle(this.swpoles[0].x, this.swpoles[0].y, 0, 0)).union(new Rectangle(this.swpoles[1].x, this.swpoles[1].y, 0, 0));
  }
  getPost(n) {
    return n === 0 ? this.point1 : this.swposts[n - 1];
  }
  getPostCount() {
    return 3;
  }
  setCurrent(vs, c) {
    if (vs === this.voltSources[0])
      this.currents[this.both ? 0 : Math.trunc(this.position / 2)] = c;
    else if (vs === this.voltSources[1])
      this.currents[1] = c;
  }
  calculateCurrent() {
    if (this.resistance > 0) {
      this.currents[0] = this.both || this.position === 0 ? (this.nodes[0].v - this.nodes[1].v) / this.resistance : 0;
      this.currents[1] = this.both || this.position === 2 ? (this.nodes[0].v - this.nodes[2].v) / this.resistance : 0;
      return;
    }
    if (!this.both)
      this.currents[1 - Math.trunc(this.position / 2)] = 0;
  }
  setVoltageSource(n, v) {
    this.voltSources[n] = v;
    if (this.both)
      v.setNodes(this.nodes[0], this.nodes[n + 1]);
    else if (this.position === 0)
      v.setNodes(this.nodes[0], this.nodes[1]);
    else
      v.setNodes(this.nodes[0], this.nodes[2]);
  }
  stamp() {
    if (this.resistance > 0) {
      if (this.both || this.position === 0)
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
      if (this.both || this.position === 2)
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[2], this.resistance);
      return;
    }
    let vs = 0;
    if (this.both || this.position === 0)
      CircuitElm.sim.stampVoltageSourceVS(this.voltSources[vs++], 0);
    if (this.both || this.position === 2)
      CircuitElm.sim.stampVoltageSourceVS(this.voltSources[vs++], 0);
  }
  // connection is implemented by voltage source with voltage = 0.
  // need two for both loads connected, otherwise one.
  getVoltageSourceCount() {
    this.both = this.position === 1 || this.position === 3;
    if (this.resistance > 0)
      return 0;
    return this.both ? 2 : 1;
  }
  toggle() {
    super.toggle();
    if (this.link !== 0) {
      for (const ce of CircuitElm.app.elmList) {
        if (ce instanceof MBBSwitchElm && ce.link === this.link)
          ce.position = this.position;
      }
    }
  }
  getConnection(n1, n2) {
    if (this.both) return true;
    return this.comparePair(n1, n2, 0, 1 + Math.trunc(this.position / 2));
  }
  // do not optimize out, even though isWireEquivalent() is true (because it may have 3 nodes to merge
  // and calcWireClosure() doesn't handle that case)
  isRemovableWire() {
    return false;
  }
  isWireEquivalent() {
    return this.resistance === 0;
  }
  getElmType() {
    return "switch (SPDT, MBB)";
  }
  getInfo(arr) {
    arr[0] = "switch (" + (this.link === 0 ? "S" : "D") + "PDT, MBB)";
    arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
  }
  getEditInfo(n) {
    if (n === 0) return super.getEditInfo(0);
    if (n === 1) return new EditInfo("Switch Group", this.link, 0, 100).setDimensionless();
    if (n === 2) return this.getKeyShortcutEditInfo();
    if (n === 3) {
      const ei = new EditInfo("On Resistance (ohms)", this.resistance);
      ei.setNonNegative();
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 1) this.link = Math.trunc(ei.value);
    else if (n === 2) this.setKeyShortcutEditValue(ei);
    else if (n === 3) this.resistance = ei.value;
    else super.setEditValue(n, ei);
  }
  validate() {
    if (this.resistance > 0)
      return true;
    const b = this.position === 1 || this.position === 3;
    if (b || this.position === 0) {
      const fpi = new FindPathInfo(FindPathInfo.VOLTAGE, this, this.getNode(0), CircuitElm.sim);
      if (fpi.findPath(this.getNode(1))) {
        this.resistance = 1e-3;
        return false;
      }
    }
    if (b || this.position === 2) {
      const fpi = new FindPathInfo(FindPathInfo.VOLTAGE, this, this.getNode(0), CircuitElm.sim);
      if (fpi.findPath(this.getNode(2))) {
        this.resistance = 1e-3;
        return false;
      }
    }
    return true;
  }
  getShortcut() {
    return 0;
  }
}

class MemristorElm extends CircuitElm {
  r_on;
  r_off;
  dopeWidth;
  totalWidth;
  mobility;
  resistance;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.r_on = parseFloatStrict(st.nextToken());
      this.r_off = parseFloatStrict(st.nextToken());
      this.dopeWidth = parseFloatStrict(st.nextToken());
      this.totalWidth = parseFloatStrict(st.nextToken());
      this.mobility = parseFloatStrict(st.nextToken());
      try {
        this.current = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
    } else {
      this.r_on = 100;
      this.r_off = 160 * this.r_on;
      this.dopeWidth = 0;
      this.totalWidth = 1e-8;
      this.mobility = 1e-10;
    }
    this.resistance = 100;
  }
  getDumpType() {
    return "m".charCodeAt(0);
  }
  dump() {
    return super.dump() + " " + this.r_on + " " + this.r_off + " " + this.dopeWidth + " " + this.totalWidth + " " + this.mobility;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ron", this.r_on);
    CircuitXMLSerializer.dumpAttr(elem, "rof", this.r_off);
    CircuitXMLSerializer.dumpAttr(elem, "do", this.dopeWidth);
    CircuitXMLSerializer.dumpAttr(elem, "to", this.totalWidth);
    CircuitXMLSerializer.dumpAttr(elem, "mo", this.mobility);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.r_on = xml.parseDoubleAttr("ron", this.r_on);
    this.r_off = xml.parseDoubleAttr("rof", this.r_off);
    this.dopeWidth = xml.parseDoubleAttr("do", this.dopeWidth);
    this.totalWidth = xml.parseDoubleAttr("to", this.totalWidth);
    this.mobility = xml.parseDoubleAttr("mo", this.mobility);
  }
  ps3;
  ps4;
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    this.ps3 = new Point();
    this.ps4 = new Point();
  }
  draw(g) {
    const segments = 6;
    let ox = 0;
    const hs = 2 + Math.floor(8 * (1 - this.dopeWidth / this.totalWidth));
    this.setBbox(this.point1, this.point2, hs);
    this.draw2Leads(g);
    this.setPowerColor(g, true);
    const segf = 1 / segments;
    for (let i = 0; i <= segments; i++) {
      let nx = (i & 1) === 0 ? 1 : -1;
      if (i === segments)
        nx = 0;
      const v = this.nodes[0].v + (this.nodes[1].v - this.nodes[0].v) * i / segments;
      this.setVoltageColor(g, v);
      this.interpPoint(this.lead1, this.lead2, CircuitElm.ps1, i * segf, hs * ox);
      this.interpPoint(this.lead1, this.lead2, CircuitElm.ps2, i * segf, hs * nx);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
      if (i === segments)
        break;
      this.interpPoint(this.lead1, this.lead2, CircuitElm.ps1, (i + 1) * segf, hs * nx);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
      ox = nx;
    }
    this.doDots(g);
    this.drawPosts(g);
  }
  nonLinear() {
    return true;
  }
  calculateCurrent() {
    this.current = (this.nodes[0].v - this.nodes[1].v) / this.resistance;
  }
  reset() {
    this.dopeWidth = 0;
  }
  startIteration() {
    const wd = this.dopeWidth / this.totalWidth;
    this.dopeWidth += CircuitElm.sim.timeStep * this.mobility * this.r_on * this.current / this.totalWidth;
    if (this.dopeWidth < 0)
      this.dopeWidth = 0;
    if (this.dopeWidth > this.totalWidth)
      this.dopeWidth = this.totalWidth;
    this.resistance = this.r_on * wd + this.r_off * (1 - wd);
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[0]);
    CircuitElm.sim.stampNonLinear(this.nodes[1]);
  }
  doStep() {
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
  }
  getInfo(arr) {
    arr[0] = "memristor";
    this.getBasicInfo(arr);
    arr[3] = "R = " + CircuitElm.getUnitText(this.resistance, Locale.ohmString);
    arr[4] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  getScopeValue(x) {
    return x === VAL_R ? this.resistance : super.getScopeValue(x);
  }
  getScopeUnits(x) {
    return x === VAL_R ? UNITS_OHMS : super.getScopeUnits(x);
  }
  canShowValueInScope(x) {
    return x === VAL_R;
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Min Resistance (ohms)", this.r_on, 0, 0);
    if (n === 1)
      return new EditInfo("Max Resistance (ohms)", this.r_off, 0, 0);
    if (n === 2)
      return new EditInfo("Width of Doped Region (nm)", this.dopeWidth * 1e9, 0, 0);
    if (n === 3)
      return new EditInfo("Total Width (nm)", this.totalWidth * 1e9, 0, 0);
    if (n === 4)
      return new EditInfo("Mobility (um^2/(s*V))", this.mobility * 1e12, 0, 0);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.r_on = ei.value;
    if (n === 1)
      this.r_off = ei.value;
    if (n === 2)
      this.dopeWidth = ei.value * 1e-9;
    if (n === 3)
      this.totalWidth = ei.value * 1e-9;
    if (n === 4)
      this.mobility = ei.value * 1e-12;
  }
}

class MonostableElm extends ChipElm {
  static FLAG_INVERT_TRIGGER = 2;
  prevInputValue = false;
  retriggerable = false;
  triggered = false;
  lastRisingEdge = 0;
  delay = 0.01;
  invertTrigger() {
    return (this.flags & MonostableElm.FLAG_INVERT_TRIGGER) !== 0;
  }
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f, st);
    if (st !== void 0) {
      this.retriggerable = st.nextToken() === "true";
      this.delay = parseFloatStrict(st.nextToken());
    }
    this.reset();
  }
  getChipName() {
    return "Monostable";
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = 2;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "");
    this.pins[0].clock = true;
    this.pins[0].bubble = this.invertTrigger();
    this.pins[1] = new Pin(this, 0, ChipElm.SIDE_E, "Q");
    this.pins[1].output = true;
    this.pins[2] = new Pin(this, 1, ChipElm.SIDE_E, "Q");
    this.pins[2].output = true;
    this.pins[2].lineOver = true;
  }
  reset() {
    super.reset();
    this.pins[2].value = true;
    this.triggered = this.prevInputValue = false;
  }
  getPostCount() {
    return 3;
  }
  getVoltageSourceCount() {
    return 2;
  }
  execute() {
    const trigValue = this.pins[0].value !== this.invertTrigger();
    if (trigValue && this.prevInputValue !== trigValue && (this.retriggerable || !this.triggered)) {
      this.lastRisingEdge = CircuitElm.sim.t;
      this.pins[1].value = true;
      this.pins[2].value = false;
      this.triggered = true;
    }
    if (this.triggered && CircuitElm.sim.t > this.lastRisingEdge + this.delay) {
      this.pins[1].value = false;
      this.pins[2].value = true;
      this.triggered = false;
    }
    this.prevInputValue = trigValue;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "rt", this.retriggerable);
    CircuitXMLSerializer.dumpAttr(elem, "dl", this.delay);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.retriggerable = xml.parseBooleanAttr("rt", this.retriggerable);
    this.delay = xml.parseDoubleAttr("dl", this.delay);
    this.reset();
  }
  getDumpType() {
    return 194;
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Retriggerable", this.retriggerable);
      return ei;
    }
    if (n === 1)
      return new EditInfo("Period (s)", this.delay, 1e-3, 0.1);
    if (n === 2)
      return EditInfo.createCheckbox("Invert Trigger", this.invertTrigger());
    return super.getChipEditInfo(n);
  }
  setChipEditValue(n, ei) {
    if (n === 0)
      this.retriggerable = ei.checkbox.getState();
    if (n === 1)
      this.delay = ei.value;
    if (n === 2) {
      this.flags = ei.changeFlag(this.flags, MonostableElm.FLAG_INVERT_TRIGGER);
      this.setupPins();
      this.setPoints();
    }
    super.setChipEditValue(n, ei);
  }
  addJSMethods() {
    super.addJSMethods();
    const p = this._jsProxy;
    p["getPeriod"] = () => this.delay;
    p["setPeriod"] = (v) => {
      this.delay = v;
    };
  }
}

class RelayContactElm extends CircuitElm {
  r_on;
  r_off;
  swposts;
  swpoles;
  ptSwitch;
  switchCurrent = 0;
  switchCurCount = 0;
  label;
  FLAG_NORMALLY_CLOSED = 2;
  FLAG_IEC = 4;
  type = 0;
  i_position = 0;
  openhs = 0;
  nSwitch0 = 0;
  nSwitch1 = 1;
  extraPoints;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.label = CustomLogicModel.unescape(st.nextToken());
      this.r_on = parseFloatStrict(st.nextToken());
      this.r_off = parseFloatStrict(st.nextToken());
      try {
        this.i_position = parseIntStrict(st.nextToken());
      } catch (e) {
      }
      this.noDiagonal = true;
      this.allocNodes();
    } else {
      this.noDiagonal = true;
      this.r_on = 0.05;
      this.r_off = 1e6;
      this.label = "label";
      this.flags |= this.FLAG_IEC;
    }
  }
  getDumpType() {
    return 426;
  }
  useIECSymbol() {
    return (this.flags & this.FLAG_IEC) !== 0;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "lb", this.label);
    CircuitXMLSerializer.dumpAttr(elem, "ron", this.r_on);
    CircuitXMLSerializer.dumpAttr(elem, "roff", this.r_off);
    CircuitXMLSerializer.dumpAttr(elem, "ip", this.i_position);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.label = xml.parseStringAttr("lb", this.label) ?? this.label;
    this.r_on = xml.parseDoubleAttr("ron", this.r_on);
    this.r_off = xml.parseDoubleAttr("roff", this.r_off);
    this.i_position = xml.parseIntAttr("ip", this.i_position);
    this.noDiagonal = true;
    this.allocNodes();
  }
  draw(g) {
    for (let i = 0; i !== 2; i++) {
      this.setVoltageColor(g, this.nodes[this.nSwitch0 + i].v);
      CircuitElm.drawThickLine(g, this.swposts[i], this.swpoles[i]);
    }
    this.interpPoint(this.swpoles[1], this.swpoles[2], this.ptSwitch, this.i_position);
    g.setColor(Color.lightGray);
    CircuitElm.drawThickLine(g, this.swpoles[0], this.ptSwitch);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
    if (this.x === this.x2)
      g.drawString(this.label, this.x + 10, this.swpoles[this.y < this.y2 ? 0 : 1].y - 5);
    else {
      g.save();
      g.context.textAlign = "center";
      g.drawString(this.label, Math.trunc((this.x + this.x2) / 2), this.y + 15);
      g.restore();
    }
    if (this.useIECSymbol() && (this.type === RelayCoilElm.TYPE_ON_DELAY || this.type === RelayCoilElm.TYPE_OFF_DELAY)) {
      g.setColor(Color.lightGray);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[0], 0.5 - 2 / 32, this.i_position === 1 ? this.openhs / 2 : 0);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[1], 0.5 + 2 / 32, this.i_position === 1 ? this.openhs / 2 : 0);
      g.drawLine(this.extraPoints[0], this.extraPoints[2]);
      g.drawLine(this.extraPoints[1], this.extraPoints[3]);
      g.context.beginPath();
      const ang = -Math.atan2(-this.dy * this.dsign, this.dx * this.dsign);
      const ds = 22 * this.dsign;
      if (this.type === RelayCoilElm.TYPE_OFF_DELAY) {
        this.interpPoint(this.lead1, this.lead2, this.extraPoints[4], 0.5, ds + 6 * this.dsign);
        g.context.arc(this.extraPoints[4].x, this.extraPoints[4].y, 6, -Math.PI / 8 + ang + Math.PI, Math.PI * 9 / 8 + ang + Math.PI, true);
      } else {
        this.interpPoint(this.lead1, this.lead2, this.extraPoints[4], 0.5, ds - 5 * this.dsign);
        g.context.arc(this.extraPoints[4].x, this.extraPoints[4].y, 6, -Math.PI / 8 + ang, Math.PI * 9 / 8 + ang, true);
      }
      g.context.stroke();
    }
    this.switchCurCount = this.updateDotCountImpl(this.switchCurrent, this.switchCurCount);
    this.drawDots(g, this.swposts[0], this.swpoles[0], this.switchCurCount);
    if (this.i_position === 0)
      this.drawDots(g, this.swpoles[this.i_position + 1], this.swposts[this.i_position + 1], this.switchCurCount);
    this.drawPosts(g);
    this.setBbox(this.point1, this.point2, this.openhs);
  }
  getCurrentIntoNode(n) {
    if (n === 0) return -this.switchCurrent;
    if (n === 1 + this.i_position) return this.switchCurrent;
    return 0;
  }
  setPoints() {
    super.setPoints();
    this.allocNodes();
    this.openhs = this.dsign * 16;
    this.calcLeads(32);
    this.swposts = [new Point(), new Point(), new Point()];
    this.swpoles = [new Point(), new Point(), new Point()];
    this.interpPoint(this.lead1, this.lead2, this.swpoles[0], 0, 0);
    this.interpPoint(this.lead1, this.lead2, this.swpoles[1], 1, 0);
    this.interpPoint(this.lead1, this.lead2, this.swpoles[2], 1, this.openhs);
    this.interpPoint(this.point1, this.point2, this.swposts[0], 0, 0);
    this.interpPoint(this.point1, this.point2, this.swposts[1], 1, 0);
    this.interpPoint(this.point1, this.point2, this.swposts[2], 1, this.openhs);
    this.ptSwitch = new Point();
    if (this.useIECSymbol()) {
      this.extraPoints = this.newPointArray(5);
      const ds = 22 * this.dsign;
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[2], 0.5 - 2 / 32, ds);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[3], 0.5 + 2 / 32, ds);
    }
  }
  // (not setPosition(), which would replace CircuitElm.setPosition(x, y, x2, y2) and break
  // loading XML files)
  setContactPosition(i_position_, type_) {
    this.i_position = this.isNormallyClosed() ? 1 - i_position_ : i_position_;
    this.type = type_;
  }
  isNormallyClosed() {
    return (this.flags & this.FLAG_NORMALLY_CLOSED) !== 0;
  }
  getPost(n) {
    return this.swposts[n];
  }
  getPostCount() {
    return 2;
  }
  reset() {
    super.reset();
    this.switchCurrent = this.switchCurCount = 0;
    this.i_position = 0;
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[this.nSwitch0]);
    CircuitElm.sim.stampNonLinear(this.nodes[this.nSwitch1]);
  }
  nonLinear() {
    return true;
  }
  doStep() {
    CircuitElm.sim.stampResistor(this.nodes[this.nSwitch0], this.nodes[this.nSwitch1], this.i_position === 0 ? this.r_on : this.r_off);
  }
  calculateCurrent() {
    if (this.i_position === 1)
      this.switchCurrent = 0;
    else
      this.switchCurrent = (this.nodes[this.nSwitch0].v - this.nodes[this.nSwitch1 + this.i_position].v) / this.r_on;
  }
  getElmType() {
    return "relay";
  }
  getInfo(arr) {
    arr[0] = Locale.LS("relay");
    if (this.i_position === 0) arr[0] += " (" + Locale.LS("off") + ")";
    else if (this.i_position === 1) arr[0] += " (" + Locale.LS("on") + ")";
    arr[1] = "I = " + CircuitElm.getCurrentDText(this.switchCurrent);
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("On Resistance (ohms)", this.r_on, 0, 0).setPositive();
    if (n === 1) return new EditInfo("Off Resistance (ohms)", this.r_off, 0, 0).setPositive();
    if (n === 2) return new EditInfo("Label (for linking)", this.label);
    if (n === 3) return EditInfo.createCheckbox("Normally Closed", this.isNormallyClosed());
    if (n === 4) return EditInfo.createCheckbox("IEC Symbol", this.useIECSymbol());
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0) this.r_on = ei.value;
    if (n === 1 && ei.value > 0) this.r_off = ei.value;
    if (n === 2) this.label = ei.textf.value;
    if (n === 3) this.flags = ei.changeFlag(this.flags, this.FLAG_NORMALLY_CLOSED);
    if (n === 4) {
      this.flags = ei.changeFlag(this.flags, this.FLAG_IEC);
      this.setPoints();
    }
  }
  getConnection(n1, n2) {
    return true;
  }
}

class RelayCoilElm extends CircuitElm {
  inductance;
  ind;
  label;
  onCurrent;
  offCurrent;
  coilPosts;
  coilLeads;
  outline;
  extraPoints;
  coilCurrent = 0;
  coilCurCount = 0;
  avgCurrent = 0;
  d_position = 0;
  i_position = 0;
  coilR;
  switchingTime;
  switchingTimeOn = 0;
  switchingTimeOff = 0;
  lastTransition = 0;
  openhs = 0;
  state = 0;
  switchPosition = 0;
  static TYPE_NORMAL = 0;
  static TYPE_ON_DELAY = 1;
  static TYPE_OFF_DELAY = 2;
  static TYPE_LATCHING = 3;
  static TYPE_LATCHING_ON = 4;
  static TYPE_LATCHING_OFF = 5;
  type = 0;
  static isLatchingType(t) {
    return t === RelayCoilElm.TYPE_LATCHING || t === RelayCoilElm.TYPE_LATCHING_ON || t === RelayCoilElm.TYPE_LATCHING_OFF;
  }
  nCoil1 = 0;
  nCoil2 = 1;
  currentOffset1 = 0;
  currentOffset2 = 0;
  elmList = [];
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.label = CustomLogicModel.unescape(st.nextToken());
      this.inductance = parseFloatStrict(st.nextToken());
      this.coilCurrent = parseFloatStrict(st.nextToken());
      this.onCurrent = parseFloatStrict(st.nextToken());
      this.coilR = parseFloatStrict(st.nextToken());
      this.offCurrent = parseFloatStrict(st.nextToken());
      this.switchingTime = parseFloatStrict(st.nextToken());
      this.type = parseIntStrict(st.nextToken());
      this.state = parseIntStrict(st.nextToken());
      this.switchPosition = parseIntStrict(st.nextToken());
      this.noDiagonal = true;
      this.ind = new Inductor(CircuitElm.sim);
      this.ind.setup(this.inductance, this.coilCurrent, Inductor.FLAG_BACK_EULER);
      this.allocNodes();
    } else {
      this.ind = new Inductor(CircuitElm.sim);
      this.inductance = 0.2;
      this.ind.setup(this.inductance, 0, Inductor.FLAG_BACK_EULER);
      this.noDiagonal = true;
      this.onCurrent = 0.02;
      this.offCurrent = 0.015;
      this.state = 0;
      this.label = "label";
      this.coilR = 20;
      this.switchingTime = 5e-3;
    }
    this.outline = this.newPointArray(4);
  }
  getDumpType() {
    return 425;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "lb", this.label);
    CircuitXMLSerializer.dumpAttr(elem, "in", this.inductance);
    CircuitXMLSerializer.dumpAttr(elem, "oc", this.onCurrent);
    CircuitXMLSerializer.dumpAttr(elem, "cr", this.coilR);
    CircuitXMLSerializer.dumpAttr(elem, "ofc", this.offCurrent);
    CircuitXMLSerializer.dumpAttr(elem, "swt", this.switchingTime);
    CircuitXMLSerializer.dumpAttr(elem, "tp", this.type);
  }
  dumpXmlState(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "ci", this.coilCurrent);
    CircuitXMLSerializer.dumpAttr(elem, "st", this.state);
    CircuitXMLSerializer.dumpAttr(elem, "sp", this.switchPosition);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.label = xml.parseStringAttr("lb", this.label) ?? this.label;
    this.inductance = xml.parseDoubleAttr("in", this.inductance);
    this.onCurrent = xml.parseDoubleAttr("oc", this.onCurrent);
    this.coilR = xml.parseDoubleAttr("cr", this.coilR);
    this.offCurrent = xml.parseDoubleAttr("ofc", this.offCurrent);
    this.switchingTime = xml.parseDoubleAttr("swt", this.switchingTime);
    this.type = xml.parseIntAttr("tp", this.type);
    this.coilCurrent = xml.parseDoubleAttr("ci", this.coilCurrent);
    this.state = xml.parseIntAttr("st", this.state);
    this.switchPosition = xml.parseIntAttr("sp", this.switchPosition);
    this.noDiagonal = true;
    this.ind = new Inductor(CircuitElm.sim);
    this.ind.setup(this.inductance, this.coilCurrent, Inductor.FLAG_BACK_EULER);
    this.allocNodes();
  }
  draw(g) {
    for (let i = 0; i !== 2; i++) {
      this.setVoltageColor(g, this.nodes[this.nCoil1 + i].v);
      CircuitElm.drawThickLine(g, this.coilLeads[i], this.coilPosts[i]);
    }
    this.setPowerColor(g, this.coilCurrent * (this.nodes[this.nCoil1].v - this.nodes[this.nCoil2].v));
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    CircuitElm.drawThickLine(g, this.outline[0], this.outline[1]);
    CircuitElm.drawThickLine(g, this.outline[1], this.outline[2]);
    CircuitElm.drawThickLine(g, this.outline[2], this.outline[3]);
    CircuitElm.drawThickLine(g, this.outline[3], this.outline[0]);
    if (RelayCoilElm.isLatchingType(this.type)) {
      for (let i = 0; i !== 3; i++)
        CircuitElm.drawThickLine(g, this.extraPoints[i], this.extraPoints[i + 1]);
      if (this.type === RelayCoilElm.TYPE_LATCHING_ON || this.type === RelayCoilElm.TYPE_LATCHING_OFF) {
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
        g.drawString(this.type === RelayCoilElm.TYPE_LATCHING_ON ? "S" : "R", this.extraPoints[0].x + 3, this.extraPoints[0].y + 9);
      }
    } else if (this.type === RelayCoilElm.TYPE_ON_DELAY) {
      CircuitElm.drawThickLine(g, this.extraPoints[1], this.extraPoints[2]);
      CircuitElm.drawThickLine(g, this.extraPoints[0], this.extraPoints[2]);
      CircuitElm.drawThickLine(g, this.extraPoints[1], this.extraPoints[3]);
    } else if (this.type === RelayCoilElm.TYPE_OFF_DELAY) {
      g.fillRect(
        this.extraPoints[0].x,
        this.extraPoints[0].y,
        this.extraPoints[2].x - this.extraPoints[0].x,
        this.extraPoints[2].y - this.extraPoints[0].y
      );
    }
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
    if (this.x === this.x2)
      g.drawString(this.label, this.outline[2].x + 10, Math.trunc((this.y + this.y2) / 2) + 4);
    else {
      g.save();
      g.context.textAlign = "center";
      g.drawString(this.label, Math.trunc((this.x + this.x2) / 2), this.outline[1].y + 15);
      g.restore();
    }
    this.coilCurCount = this.updateDotCountImpl(this.coilCurrent, this.coilCurCount);
    if (this.coilCurCount !== 0) {
      this.drawDots(g, this.coilPosts[0], this.coilLeads[0], this.coilCurCount);
      this.drawDots(g, this.coilLeads[1], this.coilPosts[1], this.addCurCount(this.coilCurCount, this.currentOffset2));
    }
    this.drawPosts(g);
    this.setBbox(this.outline[0], this.outline[2], 0);
    this.adjustBbox(this.coilPosts[0], this.coilPosts[1]);
  }
  getCurrentIntoNode(n) {
    return n === 0 ? -this.coilCurrent : this.coilCurrent;
  }
  setPoints() {
    super.setPoints();
    this.allocNodes();
    this.openhs = -this.dsign * 16;
    this.coilPosts = this.newPointArray(2);
    this.coilLeads = this.newPointArray(2);
    this.coilPosts[0] = this.point1;
    this.coilPosts[1] = this.point2;
    const boxWScale = Math.min(0.4, 12 / this.dn);
    this.interpPoint(this.point1, this.point2, this.coilLeads[0], 0.5 - boxWScale);
    this.interpPoint(this.point1, this.point2, this.coilLeads[1], 0.5 + boxWScale);
    this.interpPoint(this.point1, this.point2, this.outline[0], 0.5 - boxWScale, -32 * this.dsign);
    this.interpPoint(this.point1, this.point2, this.outline[1], 0.5 + boxWScale, -32 * this.dsign);
    this.interpPoint(this.point1, this.point2, this.outline[3], 0.5 - boxWScale, 32 * this.dsign);
    this.interpPoint(this.point1, this.point2, this.outline[2], 0.5 + boxWScale, 32 * this.dsign);
    this.currentOffset1 = CircuitElm.distance(this.coilPosts[0], this.coilLeads[0]);
    this.currentOffset2 = this.currentOffset1 + CircuitElm.distance(this.coilLeads[0], this.coilLeads[1]);
    this.extraPoints = this.newPointArray(4);
    if (RelayCoilElm.isLatchingType(this.type)) {
      this.interpPoint(this.coilLeads[0], this.coilLeads[1], this.extraPoints[0], 0.3, 8);
      this.interpPoint(this.coilLeads[0], this.coilLeads[1], this.extraPoints[1], 0.3, 0);
      this.interpPoint(this.coilLeads[0], this.coilLeads[1], this.extraPoints[2], 0.7, 0);
      this.interpPoint(this.coilLeads[0], this.coilLeads[1], this.extraPoints[3], 0.7, -8);
    } else {
      this.extraPoints[0] = this.outline[0];
      this.extraPoints[3] = this.outline[1];
      this.interpPoint(this.coilLeads[0], this.coilLeads[1], this.extraPoints[1], 0, -32 + 12);
      this.interpPoint(this.coilLeads[0], this.coilLeads[1], this.extraPoints[2], 1, -32 + 12);
    }
  }
  getPost(n) {
    return this.coilPosts[n];
  }
  getPostCount() {
    return 2;
  }
  getInternalNodeCount() {
    return 1;
  }
  reset() {
    super.reset();
    this.ind.reset();
    this.coilCurrent = this.coilCurCount = 0;
    this.d_position = this.i_position = 0;
    this.avgCurrent = 0;
  }
  stamp() {
    this.ind.stamp(this.nodes[this.nCoil1], this.nodes[this.nCoil3]);
    CircuitElm.sim.stampResistor(this.nodes[this.nCoil3], this.nodes[this.nCoil2], this.coilR);
    if (this.type === RelayCoilElm.TYPE_ON_DELAY) {
      this.switchingTimeOn = this.switchingTime;
      this.switchingTimeOff = 0;
    } else if (this.type === RelayCoilElm.TYPE_OFF_DELAY) {
      this.switchingTimeOff = this.switchingTime;
      this.switchingTimeOn = 0;
    } else {
      this.switchingTimeOff = this.switchingTimeOn = this.switchingTime;
    }
    if (this.type !== RelayCoilElm.TYPE_LATCHING_ON && this.type !== RelayCoilElm.TYPE_LATCHING_OFF)
      this.toggleSwitchPositions();
  }
  get nCoil3() {
    return 2;
  }
  startIteration() {
    this.ind.startIteration(this.nodes[this.nCoil1].v - this.nodes[this.nCoil3].v);
    const absCurrent = Math.abs(this.coilCurrent);
    const a = Math.exp(-CircuitElm.sim.timeStep * 1e3);
    this.avgCurrent = a * this.avgCurrent + (1 - a) * absCurrent;
    const oldSwitchPosition = this.switchPosition;
    if (this.state === 0) {
      if (this.avgCurrent > this.onCurrent) {
        this.lastTransition = CircuitElm.sim.t;
        this.state = 1;
      }
    } else if (this.state === 1) {
      if (this.avgCurrent < this.offCurrent) this.state = 0;
      else if (CircuitElm.sim.t - this.lastTransition > this.switchingTimeOn) {
        this.state = 2;
        if (this.type === RelayCoilElm.TYPE_LATCHING) {
          this.switchPosition = 1 - this.switchPosition;
        } else if (this.type === RelayCoilElm.TYPE_LATCHING_ON) {
          this.switchPosition = 1;
          this.setSwitchPositions(0);
        } else if (this.type === RelayCoilElm.TYPE_LATCHING_OFF) {
          this.switchPosition = 0;
          this.setSwitchPositions(1);
        } else {
          this.switchPosition = 1;
        }
      }
    } else if (this.state === 2) {
      if (this.avgCurrent < this.offCurrent) {
        this.lastTransition = CircuitElm.sim.t;
        this.state = 3;
      }
    } else if (this.state === 3) {
      if (this.avgCurrent > this.onCurrent) this.state = 2;
      else if (CircuitElm.sim.t - this.lastTransition > this.switchingTimeOff) {
        this.state = 0;
        if (!RelayCoilElm.isLatchingType(this.type)) this.switchPosition = 0;
      }
    }
    if (this.type !== RelayCoilElm.TYPE_LATCHING_ON && this.type !== RelayCoilElm.TYPE_LATCHING_OFF && oldSwitchPosition !== this.switchPosition)
      this.toggleSwitchPositions();
  }
  setParentList(list) {
    this.elmList = list;
  }
  toggleSwitchPositions() {
    for (const ce of this.elmList) {
      if (ce instanceof RelayContactElm && ce.label === this.label)
        ce.setContactPosition(1 - this.switchPosition, this.type);
    }
  }
  // for set/reset coils: unconditionally drive matching contacts to an
  // explicit position, since a set/reset coil may fire without its own
  // switchPosition value actually changing
  setSwitchPositions(position) {
    for (const ce of this.elmList) {
      if (ce instanceof RelayContactElm && ce.label === this.label)
        ce.setContactPosition(position, this.type);
    }
  }
  doStep() {
    this.ind.doStep(this.nodes[this.nCoil1].v - this.nodes[this.nCoil3].v);
  }
  calculateCurrent() {
    this.coilCurrent = this.ind.calculateCurrent(this.nodes[this.nCoil1].v - this.nodes[this.nCoil3].v);
  }
  getElmType() {
    return "relay";
  }
  getInfo(arr) {
    arr[0] = Locale.LS("relay");
    if (this.i_position === 0) arr[0] += " (" + Locale.LS("off") + ")";
    else if (this.i_position === 1) arr[0] += " (" + Locale.LS("on") + ")";
    arr[1] = Locale.LS("coil I") + " = " + CircuitElm.getCurrentDText(this.coilCurrent);
    arr[2] = Locale.LS("coil Vd") + " = " + CircuitElm.getVoltageDText(this.nodes[this.nCoil1].v - this.nodes[this.nCoil2].v);
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Type", 0);
      ei.choice = new Choice();
      ei.choice.add("Normal");
      ei.choice.add("On Delay");
      ei.choice.add("Off Delay");
      ei.choice.add("Latching");
      ei.choice.add("Latching (Set Coil)");
      ei.choice.add("Latching (Reset Coil)");
      ei.choice.select(this.type);
      return ei;
    }
    if (n === 1) return new EditInfo("Inductance (H)", this.inductance, 0, 0).setPositive();
    if (n === 2) return new EditInfo("On Current (A)", this.onCurrent, 0, 0).setPositive();
    if (n === 3) return new EditInfo("Off Current (A)", this.offCurrent, 0, 0).setPositive();
    if (n === 4) return new EditInfo("Coil Resistance (ohms)", this.coilR, 0, 0).setPositive();
    if (n === 5) return new EditInfo("Switching Time (s)", this.switchingTime, 0, 0).setPositive();
    if (n === 6) return new EditInfo("Label (for linking)", this.label);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.type = ei.choice.getSelectedIndex();
      this.setPoints();
    }
    if (n === 1 && ei.value > 0) {
      this.inductance = ei.value;
      this.ind.setup(this.inductance, this.coilCurrent, Inductor.FLAG_BACK_EULER);
    }
    if (n === 2 && ei.value > 0) this.onCurrent = ei.value;
    if (n === 3 && ei.value > 0) this.offCurrent = ei.value;
    if (n === 4 && ei.value > 0) this.coilR = ei.value;
    if (n === 5 && ei.value > 0) this.switchingTime = ei.value;
    if (n === 6) this.label = ei.textf.value;
  }
  getConnection(n1, n2) {
    return true;
  }
}

class MotorProtectionSwitchElm extends CircuitElm {
  resistance;
  heats;
  i2t;
  posts;
  leads;
  currents;
  curcounts;
  blown = false;
  label;
  blownResistance = 1e9;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.resistance = parseFloatStrict(st.nextToken());
      this.i2t = parseFloatStrict(st.nextToken());
      this.blown = st.nextToken() === "true";
      this.label = "";
      try {
        this.label = CustomLogicModel.unescape(st.nextToken());
      } catch (e) {
      }
    } else {
      this.i2t = 6.73;
      this.resistance = 0.0613;
      this.label = "";
    }
    this.heats = [0, 0, 0];
    this.currents = [0, 0, 0];
    this.curcounts = [0, 0, 0];
  }
  dump() {
    return super.dump() + " " + this.resistance + " " + this.i2t + " " + this.blown + " " + CustomLogicModel.escape(this.label);
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "re", this.resistance);
    CircuitXMLSerializer.dumpAttr(elem, "i2", this.i2t);
    CircuitXMLSerializer.dumpAttr(elem, "bl", this.blown);
    CircuitXMLSerializer.dumpAttr(elem, "la", this.label);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.resistance = xml.parseDoubleAttr("re", this.resistance);
    this.i2t = xml.parseDoubleAttr("i2", this.i2t);
    this.blown = xml.parseBooleanAttr("bl", this.blown);
    this.label = xml.parseStringAttr("la", this.label) ?? this.label;
  }
  getDumpType() {
    return 428;
  }
  reset() {
    super.reset();
    this.heats = [0, 0, 0];
    this.currents = [0, 0, 0];
    this.blown = false;
    this.setSwitchPositions();
  }
  setPoints() {
    super.setPoints();
    this.posts = new Array(6);
    this.leads = new Array(6);
    for (let i = 0; i !== 3; i++) {
      this.posts[i * 2] = new Point(this.x + i * 48, this.y);
      this.posts[i * 2 + 1] = new Point(this.x + i * 48, this.y + 192);
      this.leads[i * 2] = new Point(this.x + i * 48, this.y + 80);
      this.leads[i * 2 + 1] = new Point(this.x + i * 48, this.y + 176);
    }
  }
  getPostCount() {
    return 6;
  }
  getPost(n) {
    return this.posts[n];
  }
  getTempColor(g, num) {
    const c = this.getVoltageColor(g, this.nodes[num * 2].v);
    const temp = this.heats[num] / this.i2t;
    if (temp < 0.3333) {
      const val = temp * 3;
      const x = Math.max(0, Math.trunc(255 * val));
      return new Color(x + (255 - x) * c.getRed() / 255, (255 - x) * c.getGreen() / 255, (255 - x) * c.getBlue() / 255);
    }
    if (temp < 0.6667) {
      const x = Math.max(0, Math.trunc((temp - 0.3333) * 3 * 255));
      return new Color(255, x, 0);
    }
    if (temp < 1) {
      const x = Math.max(0, Math.trunc((temp - 0.6666) * 3 * 255));
      return new Color(255, 255, x);
    }
    return Color.white;
  }
  draw(g) {
    const ctx = g.context;
    this.setBbox(this.posts[0], this.posts[5], 6);
    ctx.save();
    ctx.translate(this.x, this.y);
    const spx = 48;
    g.setLineDash(4, 4);
    const squareX = -spx - 12;
    const squareY = 48 - 12;
    g.setColor(Color.lightGray);
    g.drawLine(squareX + 24 + 4, squareY + 12, 48 * 2 - (this.blown ? 8 : 0), squareY + 12);
    g.drawLine(squareX + 12, squareY + 24 + 4, squareX + 12, 80 + 48 + 48 / 2);
    g.drawLine(squareX + 12, 80 + 48 + 48 / 2, -spx / 2, 80 + 48 + 48 / 2);
    g.drawLine(squareX + 12, 80 + 48 / 2, -spx / 2, 80 + 48 / 2);
    g.setLineDash(0, 0);
    for (let i = 0; i !== 3; i++) {
      this.setVoltageColor(g, this.nodes[i * 2].v);
      g.drawLine(i * spx, 0, i * spx, 32);
      if (this.blown) g.drawLine(i * spx - 4, 32, i * spx + 4, 32);
      const sw = this.blown ? 16 : 0;
      g.drawLine(i * spx - sw, 32, i * spx, 64);
      ctx.lineCap = "butt";
      g.drawLine(i * spx, 64, i * spx, 80);
      g.drawLine(i * spx - 4, 16 - 4, i * spx + 4, 16 + 4);
      g.drawLine(i * spx + 4, 16 - 4, i * spx - 4, 16 + 4);
      this.setVoltageColor(g, this.nodes[i * 2 + 1].v);
      g.drawLine(i * spx, 176, i * spx, 192);
      ctx.lineCap = "round";
      g.setColor(this.getTempColor(g, i));
      g.drawLine(i * spx, 80, i * spx, 96);
      const q = 12;
      g.drawLine(i * spx - q, 96, i * spx, 96);
      g.drawLine(i * spx - q, 96, i * spx - q, 112);
      g.drawLine(i * spx - q, 112, i * spx, 112);
      g.drawLine(i * spx, 112, i * spx, 128);
      g.setColor(Color.lightGray);
      ctx.font = "italic 30px serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      g.drawString("I >", i * spx, 80 + 48 + 48 / 2);
    }
    g.setColor(Color.lightGray);
    for (let i = 0; i !== 3; i++)
      g.drawLine(-spx / 2, 80 + 48 * i, 2 * spx + spx / 2, 80 + 48 * i);
    for (let i = 0; i !== 4; i++)
      g.drawLine(i * spx - spx / 2, 80, i * spx - spx / 2, 80 + 48 * 2);
    for (let i = 0; i !== 3; i++)
      g.drawLine(squareX + 12 * i, squareY, squareX + 12 * i, squareY + 24);
    for (let i = 0; i !== 3; i++)
      g.drawLine(squareX, squareY + 12 * i, squareX + 24, squareY + 12 * i);
    g.drawLine(squareX - spx / 2, squareY + 12, squareX, squareY + 12);
    g.drawLine(squareX - spx / 2, squareY, squareX - spx / 2, squareY + 24);
    ctx.font = "normal 12px sans-serif";
    g.setColor(Color.white);
    g.drawString(this.label, 120, squareY + 12);
    ctx.restore();
    if (!this.blown) {
      for (let i = 0; i !== 3; i++) {
        this.curcounts[i] = this.updateDotCountImpl(this.currents[i], this.curcounts[i]);
        this.drawDots(g, this.posts[i * 2], this.leads[i * 2], this.curcounts[i]);
        this.drawDots(g, this.posts[i * 2 + 1], this.leads[i * 2 + 1], -this.curcounts[i]);
      }
    }
    this.setSwitchPositions();
    this.drawPosts(g);
  }
  calculateCurrent() {
    for (let i = 0; i !== 3; i++)
      this.currents[i] = (this.nodes[i * 2].v - this.nodes[i * 2 + 1].v) / (this.blown ? this.blownResistance : this.resistance);
  }
  stamp() {
    for (let i = 0; i !== 6; i++)
      CircuitElm.sim.stampNonLinear(this.nodes[i]);
  }
  nonLinear() {
    return true;
  }
  getConnection(n1, n2) {
    return Math.trunc(n1 / 2) === Math.trunc(n2 / 2);
  }
  startIteration() {
    const wasBlown = this.blown;
    for (let j = 0; j !== 3; j++) {
      const i = this.currents[j];
      let heat = this.heats[j];
      heat += i * i * CircuitElm.sim.timeStep;
      heat -= CircuitElm.sim.timeStep * this.i2t / 3;
      if (heat < 0) heat = 0;
      if (heat > this.i2t) this.blown = true;
      this.heats[j] = heat;
    }
    if (this.blown !== wasBlown)
      this.setSwitchPositions();
  }
  setSwitchPositions() {
    const switchPosition = this.blown ? 0 : 1;
    for (const ce of CircuitElm.sim.elmList) {
      if (ce instanceof RelayContactElm && ce.label === this.label)
        ce.setContactPosition(switchPosition, RelayCoilElm.TYPE_NORMAL);
    }
  }
  doStep() {
    for (let i = 0; i !== 3; i++)
      CircuitElm.sim.stampResistor(this.nodes[i * 2], this.nodes[i * 2 + 1], this.blown ? this.blownResistance : this.resistance);
  }
  getInfo(arr) {
    arr[0] = "motor protection switch";
    this.getBasicInfo(arr);
    arr[3] = "R = " + CircuitElm.getUnitText(this.resistance, Locale.ohmString);
    arr[4] = "I2t = " + this.i2t;
  }
  getCurrentIntoNode(n) {
    return n % 2 === 1 ? this.currents[Math.trunc(n / 2)] : -this.currents[Math.trunc(n / 2)];
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("I2t", this.i2t, 0, 0).setPositive();
    if (n === 1) return new EditInfo("On Resistance", this.resistance, 0, 0).setPositive();
    if (n === 2) return new EditInfo("Label (for linking)", this.label);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.i2t = ei.value;
    if (n === 1) this.resistance = ei.value;
    if (n === 2) this.label = ei.textf.value;
  }
  canFlipX() {
    return false;
  }
  canFlipY() {
    return false;
  }
}

class MultiplexerElm extends ChipElm {
  static FLAG_INVERTED_OUTPUT = 1 << 1;
  static FLAG_STROBE = 1 << 2;
  static FLAG_BUS_SELECT = 1 << 3;
  // inputMode: 0 = individual inputs/single output (original)
  //            1 = bus input/single output (bit selector)
  //            2 = bus input/bus output
  static INPUT_MODE_INDIVIDUAL = 0;
  static INPUT_MODE_BUS_BIT = 1;
  static INPUT_MODE_BUS_BUS = 2;
  selectBitCount;
  outputCount = 0;
  inputMode = 0;
  dataBusWidth = 4;
  strobe = -1;
  outputPin = 0;
  selectPin = 0;
  hasReset() {
    return false;
  }
  busSelect() {
    return this.hasFlag(MultiplexerElm.FLAG_BUS_SELECT);
  }
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.selectBitCount = 2;
      this.setupPins();
    } else {
      super(xa, ya, xb, yb, f, st);
      this.selectBitCount = 2;
      try {
        this.selectBitCount = parseIntStrict(st.nextToken());
      } catch (e) {
      }
      this.setupPins();
    }
  }
  getChipName() {
    return "Multiplexer";
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "se", this.selectBitCount);
    if (this.inputMode !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "im", this.inputMode);
    if (this.dataBusWidth !== 4)
      CircuitXMLSerializer.dumpAttr(elem, "dw", this.dataBusWidth);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.selectBitCount = xml.parseIntAttr("se", this.selectBitCount);
    this.inputMode = xml.parseIntAttr("im", 0);
    this.dataBusWidth = xml.parseIntAttr("dw", 4);
    this.setupPins();
  }
  setupPins() {
    if (!this.selectBitCount)
      this.selectBitCount = 2;
    const M = MultiplexerElm;
    this.outputCount = 1 << this.selectBitCount;
    let i, n;
    if (this.inputMode === M.INPUT_MODE_BUS_BUS) {
      const inputPinCount = this.outputCount * this.dataBusWidth;
      const outputPinCount = this.dataBusWidth;
      const invertedCount = this.hasFlag(M.FLAG_INVERTED_OUTPUT) ? this.dataBusWidth : 0;
      const strobeCount = this.hasFlag(M.FLAG_STROBE) ? 1 : 0;
      this.sizeX = this.selectBitCount + 1;
      this.sizeY = this.outputCount + 1;
      this.pins = new Array(inputPinCount + this.selectBitCount + outputPinCount + invertedCount + strobeCount);
      for (let g = 0; g < this.outputCount; g++) {
        for (i = 0; i < this.dataBusWidth; i++) {
          n = g * this.dataBusWidth + i;
          this.pins[n] = new Pin(this, g, ChipElm.SIDE_W, "I" + g);
          this.pins[n].busWidth = this.dataBusWidth;
          this.pins[n].busZ = i;
        }
      }
      this.selectPin = inputPinCount;
      for (i = 0; i < this.selectBitCount; i++) {
        n = this.selectPin + i;
        if (this.busSelect()) {
          this.pins[n] = new Pin(this, 0, ChipElm.SIDE_S, "S");
          this.pins[n].busWidth = this.selectBitCount;
          this.pins[n].busZ = i;
        } else {
          this.pins[n] = new Pin(this, i + 1, ChipElm.SIDE_S, "S" + i);
        }
      }
      this.outputPin = this.selectPin + this.selectBitCount;
      for (i = 0; i < this.dataBusWidth; i++) {
        n = this.outputPin + i;
        this.pins[n] = new Pin(this, 0, ChipElm.SIDE_E, "Q");
        this.pins[n].output = true;
        this.pins[n].busWidth = this.dataBusWidth;
        this.pins[n].busZ = i;
      }
      if (this.hasFlag(M.FLAG_INVERTED_OUTPUT)) {
        for (i = 0; i < this.dataBusWidth; i++) {
          n = this.outputPin + this.dataBusWidth + i;
          this.pins[n] = new Pin(this, 1, ChipElm.SIDE_E, "Q");
          this.pins[n].lineOver = true;
          this.pins[n].output = true;
          this.pins[n].bubble = i === 0;
          this.pins[n].busWidth = this.dataBusWidth;
          this.pins[n].busZ = i;
        }
      }
      if (this.hasFlag(M.FLAG_STROBE)) {
        n = this.outputPin + this.dataBusWidth + invertedCount;
        this.pins[n] = new Pin(this, 0, ChipElm.SIDE_S, "STR");
        this.strobe = n;
      } else
        this.strobe = -1;
    } else if (this.inputMode === M.INPUT_MODE_BUS_BIT) {
      this.sizeX = this.selectBitCount + 1;
      this.sizeY = 3;
      const strobeCount = this.hasFlag(M.FLAG_STROBE) ? 1 : 0;
      const invertedCount = this.hasFlag(M.FLAG_INVERTED_OUTPUT) ? 1 : 0;
      this.pins = new Array(this.outputCount + this.selectBitCount + 1 + invertedCount + strobeCount);
      for (i = 0; i < this.outputCount; i++) {
        this.pins[i] = new Pin(this, 0, ChipElm.SIDE_W, "I");
        this.pins[i].busWidth = this.outputCount;
        this.pins[i].busZ = i;
      }
      this.selectPin = this.outputCount;
      for (i = 0; i < this.selectBitCount; i++) {
        n = this.selectPin + i;
        if (this.busSelect()) {
          this.pins[n] = new Pin(this, 0, ChipElm.SIDE_S, "S");
          this.pins[n].busWidth = this.selectBitCount;
          this.pins[n].busZ = i;
        } else {
          this.pins[n] = new Pin(this, i + 1, ChipElm.SIDE_S, "S" + i);
        }
      }
      n = this.selectPin + this.selectBitCount;
      this.pins[n] = new Pin(this, 0, ChipElm.SIDE_E, "Q");
      this.pins[n].output = true;
      this.outputPin = n;
      if (this.hasFlag(M.FLAG_INVERTED_OUTPUT)) {
        n++;
        this.pins[n] = new Pin(this, 1, ChipElm.SIDE_E, "Q");
        this.pins[n].lineOver = true;
        this.pins[n].output = true;
        this.pins[n].bubble = true;
      }
      if (this.hasFlag(M.FLAG_STROBE)) {
        n++;
        this.pins[n] = new Pin(this, 0, ChipElm.SIDE_S, "STR");
        this.strobe = n;
      } else
        this.strobe = -1;
    } else {
      this.sizeX = this.selectBitCount + 1;
      this.sizeY = this.outputCount + 1;
      const strobeCount = this.hasFlag(M.FLAG_STROBE) ? 1 : 0;
      const invertedCount = this.hasFlag(M.FLAG_INVERTED_OUTPUT) ? 1 : 0;
      this.pins = new Array(this.outputCount + this.selectBitCount + 1 + invertedCount + strobeCount);
      for (i = 0; i < this.outputCount; i++)
        this.pins[i] = new Pin(this, i, ChipElm.SIDE_W, "I" + i);
      this.selectPin = this.outputCount;
      for (i = 0; i < this.selectBitCount; i++) {
        n = this.selectPin + i;
        if (this.busSelect()) {
          this.pins[n] = new Pin(this, 0, ChipElm.SIDE_S, "S");
          this.pins[n].busWidth = this.selectBitCount;
          this.pins[n].busZ = i;
        } else {
          this.pins[n] = new Pin(this, i + 1, ChipElm.SIDE_S, "S" + i);
        }
      }
      n = this.selectPin + this.selectBitCount;
      this.pins[n] = new Pin(this, 0, ChipElm.SIDE_E, "Q");
      this.pins[n].output = true;
      this.outputPin = n;
      if (this.hasFlag(M.FLAG_INVERTED_OUTPUT)) {
        n++;
        this.pins[n] = new Pin(this, 1, ChipElm.SIDE_E, "Q");
        this.pins[n].lineOver = true;
        this.pins[n].output = true;
        this.pins[n].bubble = true;
      }
      if (this.hasFlag(M.FLAG_STROBE)) {
        n++;
        this.pins[n] = new Pin(this, 0, ChipElm.SIDE_S, "STR");
        this.strobe = n;
      } else
        this.strobe = -1;
    }
    this.allocNodes();
  }
  getPostCount() {
    const M = MultiplexerElm;
    if (this.inputMode === M.INPUT_MODE_BUS_BUS) {
      const invertedCount2 = this.hasFlag(M.FLAG_INVERTED_OUTPUT) ? this.dataBusWidth : 0;
      const strobeCount2 = this.hasFlag(M.FLAG_STROBE) ? 1 : 0;
      return this.outputCount * this.dataBusWidth + this.selectBitCount + this.dataBusWidth + invertedCount2 + strobeCount2;
    }
    const invertedCount = this.hasFlag(M.FLAG_INVERTED_OUTPUT) ? 1 : 0;
    const strobeCount = this.hasFlag(M.FLAG_STROBE) ? 1 : 0;
    return this.outputCount + this.selectBitCount + 1 + invertedCount + strobeCount;
  }
  getVoltageSourceCount() {
    const M = MultiplexerElm;
    if (this.inputMode === M.INPUT_MODE_BUS_BUS) {
      let count = this.dataBusWidth;
      if (this.hasFlag(M.FLAG_INVERTED_OUTPUT))
        count += this.dataBusWidth;
      return count;
    }
    return this.hasFlag(M.FLAG_INVERTED_OUTPUT) ? 2 : 1;
  }
  readSelectValue() {
    let sel = 0;
    for (let i = 0; i < this.selectBitCount; i++)
      if (this.pins[this.selectPin + i].value)
        sel |= 1 << i;
    return sel;
  }
  execute() {
    const M = MultiplexerElm;
    const selectedValue = this.readSelectValue();
    if (this.inputMode === M.INPUT_MODE_BUS_BUS) {
      const strobed = this.strobe !== -1 && this.pins[this.strobe].value;
      for (let i = 0; i < this.dataBusWidth; i++) {
        const val = strobed ? false : this.pins[selectedValue * this.dataBusWidth + i].value;
        this.pins[this.outputPin + i].value = val;
      }
      if (this.hasFlag(M.FLAG_INVERTED_OUTPUT)) {
        for (let i = 0; i < this.dataBusWidth; i++)
          this.pins[this.outputPin + this.dataBusWidth + i].value = !this.pins[this.outputPin + i].value;
      }
    } else {
      let val = this.pins[selectedValue].value;
      if (this.strobe !== -1 && this.pins[this.strobe].value)
        val = false;
      this.pins[this.outputPin].value = val;
      if (this.hasFlag(M.FLAG_INVERTED_OUTPUT))
        this.pins[this.outputPin + 1].value = !val;
    }
  }
  getDumpType() {
    return 184;
  }
  getXmlDumpType() {
    return "mux";
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Select Bits", this.selectBitCount, 1, 8).setDimensionless();
    if (n === 1)
      return EditInfo.createCheckbox("Inverted Output", this.hasFlag(MultiplexerElm.FLAG_INVERTED_OUTPUT));
    if (n === 2)
      return EditInfo.createCheckbox("Strobe Pin", this.hasFlag(MultiplexerElm.FLAG_STROBE));
    if (n === 3) {
      const ei = new EditInfo("Input Mode", 0, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("Individual Inputs");
      ei.choice.add("Bus Input (Bit Select)");
      ei.choice.add("Bus Input/Output");
      ei.choice.select(this.inputMode);
      return ei;
    }
    if (n === 4)
      return EditInfo.createCheckbox("Bus Select", this.busSelect());
    if (n === 5 && this.inputMode === MultiplexerElm.INPUT_MODE_BUS_BUS)
      return new EditInfo("Data Bus Width", this.dataBusWidth, 2, 32).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    const M = MultiplexerElm;
    if (n === 0) {
      if (ei.value >= 1 && ei.value <= 6) {
        this.selectBitCount = Math.trunc(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be between 1 and 6");
      return;
    }
    if (n === 1) {
      this.flags = ei.changeFlag(this.flags, M.FLAG_INVERTED_OUTPUT);
      this.setupPins();
      this.setPoints();
      return;
    }
    if (n === 2) {
      this.flags = ei.changeFlag(this.flags, M.FLAG_STROBE);
      this.setupPins();
      this.setPoints();
      return;
    }
    if (n === 3) {
      this.inputMode = ei.choice.getSelectedIndex();
      this.setupPins();
      this.setPoints();
      return;
    }
    if (n === 4) {
      this.flags = ei.changeFlag(this.flags, M.FLAG_BUS_SELECT);
      this.setupPins();
      this.setPoints();
      return;
    }
    if (n === 5) {
      if (ei.value >= 2) {
        this.dataBusWidth = Math.trunc(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be >= 2");
      return;
    }
  }
}

class NDarlingtonElm extends DarlingtonElm {
  constructor(xx, yy) {
    super(xx, yy, false);
  }
  getDumpClass() {
    return DarlingtonElm;
  }
}

class NoiseElm extends RailElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb !== void 0) {
      super(xa, ya, xb, yb, f, st);
      this.waveform = VoltageElm.WF_NOISE;
    } else {
      super(xa, ya, VoltageElm.WF_NOISE);
    }
  }
  // dump this class as a RailElm.  The 'n' dump type is still used in CirSim.createCe to read old files
  //  getDumpType() { return 'n'; }
  getDumpClass() {
    return RailElm;
  }
  getShortcut() {
    return 0;
  }
}

class NortonAmpElm extends CompositeElm {
  opsize = 0;
  opheight = 0;
  opwidth = 0;
  static FLAG_SWAP = 1;
  static FLAG_SMALL = 2;
  // External nodes in model order: in+ (nd=3), in- (nd=1), out (nd=4)
  static modelExternalNodes = [3, 1, 4];
  // Child elements with node assignments ("nn" attribute)
  static modelXmlStr = '<elms><d nn="1 0" f="2" mo="default"/><d nn="2 0" f="2" mo="default"/><CCCS nn="3 2 1 0" f="0" ic="2" ex="-a"/><a nn="1 0 4" f="8" ma="12" mi="0" ga="100000"/></elms>';
  static modelElements = null;
  static initModel() {
    const modelDoc = new DOMParser().parseFromString(NortonAmpElm.modelXmlStr, "text/xml");
    NortonAmpElm.modelElements = [];
    const children = modelDoc.documentElement.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children.item(i);
      if (node.nodeType === Node.ELEMENT_NODE)
        NortonAmpElm.modelElements.push(node);
    }
  }
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0)
      super(xa, ya);
    else
      super(xa, ya, xb, yb, f);
    if (NortonAmpElm.modelElements === null)
      NortonAmpElm.initModel();
    this.loadCompositeXml(NortonAmpElm.modelElements, NortonAmpElm.modelExternalNodes);
    this.buildCompNodeList();
    this.allocNodes();
    this.noDiagonal = true;
    this.setSize(this.useSmallGrid() ? 1 : 2);
  }
  getXmlDumpType() {
    return "nor";
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.setSize((this.flags & NortonAmpElm.FLAG_SMALL) !== 0 ? 1 : 2);
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.opheight * 2);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.in1p[0], this.in1p[1]);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.in2p[0], this.in2p[1]);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.lead2, this.point2);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    this.setPowerColor(g, true);
    CircuitElm.drawThickPolygon(g, this.triangle);
    g.setFont(this.plusFont);
    this.drawCenteredText(g, "+", this.textp[0].x, this.textp[0].y - 2, true);
    this.drawCenteredText(g, "-", this.textp[1].x, this.textp[1].y, true);
    CircuitElm.drawThickCircle(g, this.nortonCenter.x, this.nortonCenter.y, this.nortonRadius);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    g.fillPolygon(this.nortonTriangle);
    this.curcount0 = this.updateDotCountImpl(-this.getCurrentIntoNode(0), this.curcount0);
    this.drawDots(g, this.in1p[0], this.in1p[1], this.curcount0);
    this.curcount1 = this.updateDotCountImpl(-this.getCurrentIntoNode(1), this.curcount1);
    this.drawDots(g, this.in2p[0], this.in2p[1], this.curcount1);
    this.curcount = this.updateDotCountImpl(-this.getCurrentIntoNode(2), this.curcount);
    this.drawDots(g, this.point2, this.lead2, this.curcount);
    this.drawPosts(g);
  }
  in1p;
  in2p;
  textp;
  triangle;
  nortonCenter;
  nortonRadius = 0;
  nortonTriangle;
  plusFont;
  curcount0 = 0;
  curcount1 = 0;
  setSize(s) {
    this.opsize = s;
    this.opheight = 8 * s;
    this.opwidth = 13 * s;
    this.flags = this.flags & ~NortonAmpElm.FLAG_SMALL | (s === 1 ? NortonAmpElm.FLAG_SMALL : 0);
  }
  setPoints() {
    super.setPoints();
    if (this.dn > 150 && this.isCreating())
      this.setSize(2);
    let ww = this.opwidth;
    if (ww > this.dn / 2)
      ww = Math.trunc(this.dn / 2);
    this.calcLeads(ww * 2);
    let hs = this.opheight * this.dsign;
    if ((this.flags & NortonAmpElm.FLAG_SWAP) !== 0)
      hs = -hs;
    this.in1p = this.newPointArray(2);
    this.in2p = this.newPointArray(2);
    this.textp = this.newPointArray(2);
    this.interpPoint2(this.point1, this.point2, this.in1p[0], this.in2p[0], 0, hs);
    this.interpPoint2(this.lead1, this.lead2, this.in1p[1], this.in2p[1], 0, hs);
    this.interpPoint2(this.lead1, this.lead2, this.textp[0], this.textp[1], 0.2, hs);
    const tris = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, tris[0], tris[1], 0, hs * 2);
    this.triangle = this.createPolygon(tris[0], tris[1], this.lead2);
    this.plusFont = new Font("SansSerif", 0, this.opsize === 2 ? 14 : 10);
    this.nortonCenter = new Point(this.lead1.x, this.lead1.y);
    this.nortonRadius = Math.trunc(this.opheight * 0.5);
    const innerTip = new Point(0, 0);
    const innerBase = this.newPointArray(2);
    this.interpPoint(this.in1p[1], this.in2p[1], innerTip, 1.2 / 3);
    this.interpPoint2(this.in1p[1], this.in2p[1], innerBase[0], innerBase[1], 1.8 / 3, this.opheight * 0.3);
    this.nortonTriangle = this.createPolygon(innerTip, innerBase[0], innerBase[1]);
    this.setPost(0, this.in1p[0]);
    this.setPost(1, this.in2p[0]);
    this.setPost(2, this.point2);
  }
  reset() {
    super.reset();
    this.curcount0 = this.curcount1 = 0;
  }
  getInfo(arr) {
    arr[0] = "norton amp";
    arr[1] = "V+ = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[2] = "V- = " + CircuitElm.getVoltageText(this.nodes[1].v);
    arr[3] = "Vout = " + CircuitElm.getVoltageText(this.nodes[2].v);
    arr[4] = "Iout = " + CircuitElm.getCurrentText(-this.getCurrentIntoNode(2));
  }
  flipX(c2, count) {
    if (this.dx === 0)
      this.flags ^= NortonAmpElm.FLAG_SWAP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    if (this.dy === 0)
      this.flags ^= NortonAmpElm.FLAG_SWAP;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    this.flags ^= NortonAmpElm.FLAG_SWAP;
    super.flipXY(xmy, count);
  }
  addRoutingObstacle(router) {
    this.addRoutingObstacleWithLeads(router, this.opwidth);
  }
}

class OTAElm extends CompositeElm {
  static modelString = "RailElm 4\rRailElm 10\rNTransistorElm 1 2 3\rNTransistorElm 3 1 4\rNTransistorElm 3 3 4\rNTransistorElm 5 6 2\rNTransistorElm 7 8 2\rPTransistorElm 9 6 10\rPTransistorElm 9 9 10\rPTransistorElm 6 12 9\rPTransistorElm 11 8 10\rPTransistorElm 11 11 10\rPTransistorElm 8 13 11\rNTransistorElm 14 14 4\rNTransistorElm 14 12 4\rNTransistorElm 12 13 14\rNTransistorElm 15 15 5\rNTransistorElm 15 15 7";
  static modelExternalNodes = [7, 5, 15, 1, 13];
  arrowPoly1;
  arrowPoly2;
  opheight = 32;
  opwidth = 32;
  circDiam = 19;
  circOverlap = 8;
  in1p;
  in2p;
  in3p;
  in4p;
  textp;
  bar1;
  bar2;
  circCent;
  point2bis;
  triangle;
  plusFont;
  curCount0 = 0;
  curCount1 = 0;
  curCount2 = 0;
  curCount3 = 0;
  posVolt = 9;
  negVolt = -9;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.noDiagonal = true;
      this.loadComposite(null, OTAElm.modelString, OTAElm.modelExternalNodes);
      this.initOTA();
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.noDiagonal = true;
      this.loadComposite(st, OTAElm.modelString, OTAElm.modelExternalNodes);
      this.negVolt = this.compElmList[0].maxVoltage;
      this.posVolt = this.compElmList[1].maxVoltage;
    }
  }
  initOTA() {
    this.compElmList[0].maxVoltage = this.negVolt;
    this.compElmList[1].maxVoltage = this.posVolt;
  }
  reset() {
    super.reset();
    this.curCount0 = this.curCount1 = this.curCount2 = this.curCount3 = 0;
  }
  getConnection(n1, n2) {
    return false;
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, 3 * this.opheight / 2);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.in1p[0], this.in1p[1]);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.in2p[0], this.in2p[1]);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.in3p[0], this.in3p[1]);
    this.setVoltageColor(g, this.nodes[3].v);
    CircuitElm.drawThickLine(g, this.in4p[0], this.in4p[1]);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    this.setPowerColor(g, true);
    CircuitElm.drawThickPolygon(g, this.triangle);
    g.fillPolygon(this.arrowPoly1);
    g.fillPolygon(this.arrowPoly2);
    CircuitElm.drawThickLine(g, this.bar1[0], this.bar1[1]);
    CircuitElm.drawThickLine(g, this.bar2[0], this.bar2[1]);
    CircuitElm.drawThickCircle(g, this.circCent[0].x, this.circCent[0].y, this.circDiam / 2);
    CircuitElm.drawThickCircle(g, this.circCent[1].x, this.circCent[1].y, this.circDiam / 2);
    g.setFont(this.plusFont);
    this.drawCenteredText(g, "+", this.textp[0].x, this.textp[0].y - 2, true);
    this.drawCenteredText(g, "-", this.textp[1].x, this.textp[1].y, true);
    this.curCount0 = this.updateDotCountImpl(-this.getCurrentIntoNode(0), this.curCount0);
    this.drawDots(g, this.in1p[0], this.in1p[1], this.curCount0);
    this.curCount1 = this.updateDotCountImpl(-this.getCurrentIntoNode(1), this.curCount1);
    this.drawDots(g, this.in2p[0], this.in2p[1], this.curCount0);
    this.curCount2 = this.updateDotCountImpl(-this.getCurrentIntoNode(2), this.curCount2);
    this.drawDots(g, this.in3p[0], this.in3p[1], this.curCount2);
    this.curCount3 = this.updateDotCountImpl(-this.getCurrentIntoNode(3), this.curCount3);
    this.drawDots(g, this.in4p[0], this.in4p[1], this.curCount3);
    this.drawPosts(g);
  }
  setPoints() {
    super.setPoints();
    const ww = this.opwidth;
    const wtot = ww * 2 + 2 * this.circDiam - this.circOverlap;
    if (this.dn > wtot) {
      this.lead1 = this.interpPoint(this.point1, this.point2, 1 - wtot / this.dn, 0);
      this.lead2 = this.point2;
      this.point2bis = this.point2;
    } else {
      this.lead1 = this.point1;
      this.lead2 = this.interpPoint(this.point1, this.point2, wtot / this.dn, 0);
      this.point2bis = this.lead2;
    }
    const hs = this.opheight * this.dsign;
    this.in1p = this.newPointArray(2);
    this.in2p = this.newPointArray(2);
    this.in3p = this.newPointArray(2);
    this.in4p = this.newPointArray(2);
    this.textp = this.newPointArray(2);
    this.bar1 = this.newPointArray(2);
    this.bar2 = this.newPointArray(2);
    this.circCent = this.newPointArray(2);
    this.interpPoint2(this.point1, this.point2bis, this.in1p[0], this.in2p[0], 0, hs);
    this.interpPoint2(this.lead1, this.lead2, this.in1p[1], this.in2p[1], 0, hs);
    this.interpPoint2(this.lead1, this.lead2, this.textp[0], this.textp[1], 0.1, hs);
    this.in3p[0] = this.point1;
    this.in3p[1] = this.lead1;
    this.in4p[0] = this.interpPoint(this.lead1, this.lead2, 1 - 16 / wtot, 32);
    this.in4p[1] = this.interpPoint(this.lead1, this.lead2, 1 - 16 / wtot, 8);
    const tris = this.newPointArray(3);
    this.interpPoint2(this.lead1, this.lead2, tris[0], tris[1], 0, 3 * hs / 2);
    tris[2] = this.interpPoint(this.lead1, this.lead2, 2 * ww / wtot);
    this.triangle = this.createPolygon(tris[0], tris[1], tris[2]);
    this.circCent[0] = this.interpPoint(this.lead1, this.lead2, 1 - this.circDiam / (2 * wtot), 0);
    this.circCent[1] = this.interpPoint(this.lead1, this.lead2, 1 - (3 * this.circDiam / 2 - this.circOverlap) / wtot, 0);
    let d1 = this.interpPoint(this.in3p[1], this.in1p[1], 0.3333);
    let d2 = this.interpPoint(this.in3p[1], this.in1p[1], 0.6666);
    this.arrowPoly1 = this.calcArrow(d1, d2, 8, 4);
    this.interpPoint2(d1, d2, this.bar1[0], this.bar1[1], 1, 4);
    d1 = this.interpPoint(this.in3p[1], this.in2p[1], 0.3333);
    d2 = this.interpPoint(this.in3p[1], this.in2p[1], 0.6666);
    this.arrowPoly2 = this.calcArrow(d1, d2, 8, 4);
    this.interpPoint2(d1, d2, this.bar2[0], this.bar2[1], 1, 4);
    this.plusFont = new Font("SansSerif", 0, 14);
    this.setPost(0, this.in1p[0]);
    this.setPost(1, this.in2p[0]);
    this.setPost(2, this.in3p[0]);
    this.setPost(3, this.in4p[0]);
    this.setPost(4, this.point2bis);
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "pv", this.posVolt);
    CircuitXMLSerializer.dumpAttr(elem, "nv", this.negVolt);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.posVolt = xml.parseDoubleAttr("pv", this.posVolt);
    this.negVolt = xml.parseDoubleAttr("nv", this.negVolt);
    this.initOTA();
  }
  getDumpType() {
    return 402;
  }
  getInfo(arr) {
    arr[0] = "OTA (LM13700 style)";
    arr[1] = "Iabc = " + CircuitElm.getCurrentText(-this.getCurrentIntoNode(3));
    arr[2] = "V+ - V- = " + CircuitElm.getVoltageText(this.nodes[0].v - this.nodes[1].v);
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("Positive Supply Voltage (5-20V)", this.posVolt, 5, 20).setUnitStep();
    if (n === 1) return new EditInfo("Negative Supply Voltage (V)", this.negVolt, -20, -5).setUnitStep();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.posVolt = ei.value;
    if (n === 1) this.negVolt = ei.value;
    this.initOTA();
  }
  canFlipX() {
    return false;
  }
  canFlipY() {
    return false;
  }
}

class OhmMeterElm extends CurrentElm {
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f, st);
  }
  getDumpType() {
    return 216;
  }
  setPoints() {
    super.setPoints();
    this.calcLeads(26);
  }
  draw(g) {
    const cr = 12;
    this.draw2Leads(g);
    this.setVoltageColor(g, (this.nodes[0].v + this.nodes[1].v) / 2);
    this.setPowerColor(g, false);
    CircuitElm.drawThickCircle(g, this.center.x, this.center.y, cr);
    this.drawCenteredText(g, Locale.ohmString, this.center.x, this.center.y, true);
    this.setBbox(this.point1, this.point2, cr);
    this.doDots(g);
    if (this.showValues() && this.current !== 0) {
      const s = CircuitElm.getShortUnitText(this.getVoltageDiff() / this.current, Locale.ohmString);
      if (this.dx === 0 || this.dy === 0)
        this.drawValues(g, s, cr);
    }
    this.drawPosts(g);
  }
  getScopeValue(x) {
    return x === VAL_R ? this.getVoltageDiff() / this.current : super.getScopeValue(x);
  }
  getScopeUnits(x) {
    return x === VAL_R ? UNITS_OHMS : super.getScopeUnits(x);
  }
  canShowValueInScope(x) {
    return x === VAL_R;
  }
  getInfo(arr) {
    arr[0] = "ohmmeter";
    if (this.current === 0)
      arr[1] = "R = ∞";
    else
      arr[1] = "R = " + CircuitElm.getUnitText(this.getVoltageDiff() / this.current, Locale.ohmString);
  }
}

class OpAmpElm extends CircuitElm {
  opsize;
  opheight;
  opwidth;
  opaddtext;
  maxOut;
  minOut;
  gain = 1e5;
  // (an old text-format op-amp with FLAG_GAIN but no gain value gets the default)
  gbw;
  FLAG_SWAP = 1;
  FLAG_SMALL = 2;
  FLAG_LOWGAIN = 4;
  FLAG_GAIN = 8;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.noDiagonal = true;
      this.maxOut = 15;
      this.minOut = -15;
      this.gbw = 1e6;
      this.flags = this.FLAG_GAIN;
      this.gain = 1e5;
      this.setSize(this.useSmallGrid() ? 1 : 2);
    } else {
      super(xa, ya, xb, yb, f);
      this.maxOut = 15;
      this.minOut = -15;
      this.gbw = 1e6;
      try {
        this.maxOut = parseFloatStrict(st.nextToken());
        this.minOut = parseFloatStrict(st.nextToken());
        this.gbw = parseFloatStrict(st.nextToken());
        const v0 = parseFloatStrict(st.nextToken());
        const v1 = parseFloatStrict(st.nextToken());
        this.savedVd = v1 - v0;
        this.justLoaded = true;
        this.gain = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
      this.noDiagonal = true;
      this.setSize((f & this.FLAG_SMALL) !== 0 ? 1 : 2);
      this.setGain();
    }
  }
  setGain() {
    if ((this.flags & this.FLAG_GAIN) !== 0)
      return;
    this.gain = (this.flags & this.FLAG_LOWGAIN) !== 0 ? 1e3 : 1e5;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ma", this.maxOut);
    CircuitXMLSerializer.dumpAttr(elem, "mi", this.minOut);
    CircuitXMLSerializer.dumpAttr(elem, "ga", this.gain);
  }
  undumpXml(xml) {
    this.flags = 0;
    super.undumpXml(xml);
    this.maxOut = xml.parseDoubleAttr("ma", this.maxOut);
    this.minOut = xml.parseDoubleAttr("mi", this.minOut);
    this.gain = xml.parseDoubleAttr("ga", this.gain);
    this.setSize((this.flags & this.FLAG_SMALL) !== 0 ? 1 : 2);
  }
  nonLinear() {
    return true;
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.opheight * 2);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.in1p[0], this.in1p[1]);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.in2p[0], this.in2p[1]);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.lead2, this.point2);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    this.setPowerColor(g, true);
    CircuitElm.drawThickPolygon(g, this.triangle);
    g.setFont(this.plusFont);
    this.drawCenteredText(g, "-", this.textp[0].x, this.textp[0].y - 2, true);
    this.drawCenteredText(g, "+", this.textp[1].x, this.textp[1].y, true);
    this.curcount = this.updateDotCountImpl(this.current, this.curcount);
    this.drawDots(g, this.point2, this.lead2, this.curcount);
    this.drawPosts(g);
  }
  getPower() {
    return this.nodes[2].v * this.current;
  }
  in1p;
  in2p;
  textp;
  triangle;
  plusFont;
  setSize(s) {
    this.opsize = s;
    this.opheight = 8 * s;
    this.opwidth = 13 * s;
    this.flags = this.flags & ~this.FLAG_SMALL | (s === 1 ? this.FLAG_SMALL : 0);
  }
  setPoints() {
    super.setPoints();
    if (this.dn > 150 && this.isCreating())
      this.setSize(2);
    let ww = this.opwidth;
    if (ww > this.dn / 2)
      ww = Math.floor(this.dn / 2);
    this.calcLeads(ww * 2);
    const hs = this.opheight * this.dsign;
    const hsSwapped = (this.flags & this.FLAG_SWAP) !== 0 ? -hs : hs;
    this.in1p = this.newPointArray(2);
    this.in2p = this.newPointArray(2);
    this.textp = this.newPointArray(2);
    this.interpPoint2(this.point1, this.point2, this.in1p[0], this.in2p[0], 0, hsSwapped);
    this.interpPoint2(this.lead1, this.lead2, this.in1p[1], this.in2p[1], 0, hsSwapped);
    this.interpPoint2(this.lead1, this.lead2, this.textp[0], this.textp[1], 0.2, hsSwapped);
    const tris = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, tris[0], tris[1], 0, hsSwapped * 2);
    this.triangle = this.createPolygon(tris[0], tris[1], this.lead2);
    this.plusFont = new Font("SansSerif", 0, this.opsize === 2 ? 14 : 10);
  }
  getPostCount() {
    return 3;
  }
  getPost(n) {
    return n === 0 ? this.in1p[0] : n === 1 ? this.in2p[0] : this.point2;
  }
  getVoltageSourceCount() {
    return 1;
  }
  getInfo(arr) {
    arr[0] = "op-amp";
    arr[1] = "V+ = " + CircuitElm.getVoltageText(this.nodes[1].v);
    arr[2] = "V- = " + CircuitElm.getVoltageText(this.nodes[0].v);
    const vo = Math.max(Math.min(this.nodes[2].v, this.maxOut), this.minOut);
    arr[3] = "Vout = " + CircuitElm.getVoltageText(vo);
    arr[4] = "Iout = " + CircuitElm.getCurrentText(-this.current);
    arr[5] = "range = " + CircuitElm.getVoltageText(this.minOut) + " to " + CircuitElm.getVoltageText(this.maxOut);
  }
  lastvd = 0;
  savedVd = 0;
  justLoaded = false;
  stamp() {
    CircuitElm.sim.stampNonLinearVS(this.voltSource);
    CircuitElm.sim.stampMatrixVN(this.nodes[2], this.voltSource, 1);
  }
  doStep() {
    const vd = this.justLoaded ? this.savedVd : this.nodes[1].v - this.nodes[0].v;
    this.justLoaded = false;
    const midpoint = (this.maxOut + this.minOut) * 0.5;
    if (Math.abs(this.lastvd - vd) > 0.1)
      CircuitElm.sim.converged = false;
    else if (this.nodes[2].v > this.maxOut + 0.1 || this.nodes[2].v < this.minOut - 0.1)
      CircuitElm.sim.converged = false;
    let x = 0;
    let dx = 0;
    const maxAdj = this.maxOut - midpoint;
    const minAdj = this.minOut - midpoint;
    if (vd >= maxAdj / this.gain && (this.lastvd >= 0 || CircuitElm.app.getrand(4) === 1)) {
      dx = 1e-4;
      x = this.maxOut - dx * maxAdj / this.gain;
    } else if (vd <= minAdj / this.gain && (this.lastvd <= 0 || CircuitElm.app.getrand(4) === 1)) {
      dx = 1e-4;
      x = this.minOut - dx * minAdj / this.gain;
    } else {
      dx = this.gain;
      x = midpoint;
    }
    CircuitElm.sim.stampMatrixNV(this.voltSource, this.nodes[0], dx);
    CircuitElm.sim.stampMatrixNV(this.voltSource, this.nodes[1], -dx);
    CircuitElm.sim.stampMatrixNV(this.voltSource, this.nodes[2], 1);
    CircuitElm.sim.stampRightSideVS(this.voltSource, x);
    this.lastvd = vd;
  }
  // there is no current path through the op-amp inputs, but there
  // is an indirect path through the output to ground.
  validate() {
    return this.validateRailNode(2);
  }
  getConnection(n1, n2) {
    return false;
  }
  getMatrixConnection(n1, n2) {
    return true;
  }
  hasGroundConnection(n1) {
    return n1 === 2;
  }
  getVoltageDiff() {
    return this.nodes[2].v - this.nodes[1].v;
  }
  getDumpType() {
    return "a".charCodeAt(0);
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Max Output (V)", this.maxOut, 1, 20);
    if (n === 1)
      return new EditInfo("Min Output (V)", this.minOut, -20, 0);
    if (n === 2)
      return new EditInfo("Gain", this.gain, 10, 1e6).setPositive();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.maxOut = ei.value;
    if (n === 1)
      this.minOut = ei.value;
    if (n === 2)
      this.gain = ei.value;
  }
  getShortcut() {
    return "a".charCodeAt(0);
  }
  getCurrentIntoNode(n) {
    if (n === 2)
      return -this.current;
    return 0;
  }
  flipX(c2, count) {
    if (this.dx === 0)
      this.flags ^= this.FLAG_SWAP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    if (this.dy === 0)
      this.flags ^= this.FLAG_SWAP;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    this.flags ^= this.FLAG_SWAP;
    super.flipXY(xmy, count);
  }
  addRoutingObstacle(router) {
    this.addRoutingObstacleWithLeads(router, this.opwidth);
  }
}

class OpAmpRealElm extends CompositeElm {
  static model741String = "NTransistorElm 3 8 9\rNTransistorElm 2 8 10\rPTransistorElm 11 12 9\rPTransistorElm 11 13 10\rNTransistorElm 14 12 1\rNTransistorElm 14 13 5\rNTransistorElm 12 7 14\rPTransistorElm 8 8 7\rPTransistorElm 8 11 7\rNTransistorElm 17 11 16\rNTransistorElm 17 17 4\rPTransistorElm 18 18 7\rPTransistorElm 18 20 7\rNTransistorElm 20 7 25\rNTransistorElm 13 22 24\rNTransistorElm 21 20 22\rNTransistorElm 25 20 6\rNTransistorElm 24 22 23\rPTransistorElm 22 4 15\rNTransistorElm 23 13 4\rCapacitorElm 13 20\rResistorElm 15 6\rResistorElm 6 25\rResistorElm 4 1\rResistorElm 4 14\rResistorElm 4 5\rResistorElm 4 16\rResistorElm 4 24\rResistorElm 4 23\rResistorElm 17 18\rResistorElm 22 21\rResistorElm 21 20\r";
  static model741ExternalNodes = [2, 3, 6, 7, 4];
  static lm324ModelString = "TransistorElm 1 2 3\rCurrentElm 4 3\rTransistorElm 2 2 5\rTransistorElm 2 6 5\rCapacitorElm 6 7\rCurrentElm 4 8\rCurrentElm 4 7\rTransistorElm 8 4 9\rTransistorElm 7 4 10\rTransistorElm 10 4 11\rTransistorElm 11 7 12\rResistorElm 11 12\rTransistorElm 7 5 12\rCurrentElm 12 5\rTransistorElm 6 5 8\rResistorElm 9 5\rTransistorElm 9 7 5\rTransistorElm 13 6 3";
  static lm324ExternalNodes = [1, 13, 12, 4, 5];
  static lm324ModelDump = "0 -1 -0 0 10000/0 0.000006/0 1 0 0 100/0 1 0 0 100/0 1e-11 0/0 0.000004/0 0.0001/0 1 0 0 100/0 1 0 0 100/0 1 0 0 100/0 1 0 0 100/0 25/0 1 0 0 100/0 0.00005/0 -1 0 0 100/0 10000/0 1 0 0 100/0 -1 0 0 10000";
  static lm324v2ModelString = "ResistorElm 4 6\rCurrentElm 4 7\rResistorElm 4 29\rResistorElm 8 30\rResistorElm 9 31\rTransistorElm 30 29 31 \rResistorElm 4 32\rResistorElm 2 33\rResistorElm 10 34\rTransistorElm 33 32 34 \rResistorElm 9 35\rResistorElm 9 36\rResistorElm 11 37\rTransistorElm 36 35 37 \rResistorElm 10 38\rResistorElm 10 39\rResistorElm 11 40\rTransistorElm 39 38 40 \rResistorElm 12 41\rTransistorElm 13 41 4 \rResistorElm 13 42\rTransistorElm 13 42 4 \rResistorElm 4 43\rTransistorElm 12 43 14 \rResistorElm 3 44\rTransistorElm 14 44 6 \rResistorElm 15 45\rTransistorElm 6 45 4 \rResistorElm 3 46\rTransistorElm 15 46 16 \rResistorElm 3 47\rTransistorElm 16 47 17 \rResistorElm 17 16\rResistorElm 5 17\rResistorElm 4 48\rTransistorElm 15 48 5 \rResistorElm 15 49\rTransistorElm 17 49 5 \rCurrentElm 18 3\rCurrentElm 19 3\rCurrentElm 20 3\rResistorElm 11 50\rTransistorElm 18 50 3 \rResistorElm 14 51\rTransistorElm 19 51 3 \rResistorElm 5 52\rTransistorElm 7 52 4 \rResistorElm 15 53\rTransistorElm 20 53 3 \rCapacitorElm 21 22\rResistorElm 12 21\rResistorElm 12 15\rVCVSElm 3 0 23 8\rVoltageElm 23 1\rCurrentElm 3 4\rResistorElm 4 3\rResistorElm 12 54\rTransistorElm 9 54 11 \rResistorElm 13 55\rTransistorElm 10 55 11 \rCapacitorElm 12 13\rCapacitorElm 6 15\rCapacitorElm 3 24\rResistorElm 11 24\rCapacitorElm 1 2\rCapacitorElm 2 0\rCapacitorElm 1 0\rVCVSElm 15 0 22 0\rCapacitorElm 5 0\rResistorElm 25 56\rTransistorElm 25 56 0 \rVCCSElm 27 0 4 3\rCurrentElm 0 25\rVoltageElm 25 26\rResistorElm 0 26\rVCVSElm 28 26 27 0\rResistorElm 0 27\rVoltageElm 28 0\rResistorElm 0 28";
  static lm324v2ExternalNodes = [2, 1, 5, 3, 4];
  static lm324v2ModelDump = "0 40000/0 5e-7/0 380/0 1700/0 5/0 -1 0 0 306 xlm324v2-qpi/0 380/0 1700/0 5/0 -1 0 0 300 xlm324v2-qpa/0 380/0 1700/0 5/0 -1 0 0 306 xlm324v2-qpi/0 380/0 1700/0 5/0 -1 0 0 306 xlm324v2-qpi/0 25/0 1 0 0 100 xlm324v2-qnq/0 25/0 1 0 0 100 xlm324v2-qnq/0 300/0 -1 0 0 100 xlm324v2-qpq/0 25/0 1 0 0 100 xlm324v2-qnq/0 25/0 1 0 0 100 xlm324v2-qnq/0 25/0 1 0 0 100 xlm324v2-qnq/0 25/0 1 0 0 100 xlm324v2-qnq/0 40000/0 18/0 300/0 -1 0 0 100 xlm324v2-qpq/0 25/0 1 0 0 100 xlm324v2-qnq/0 1.2e-7/0 6e-8/0 0.000001/0 300/0 -1 0 0 100 xlm324v2-qpq/0 300/0 -1 0 0 100 xlm324v2-qpq/0 25/0 1 0 0 100 xlm324v2-qnq/0 300/0 -1 0 0 100 xlm324v2-qpq/2 4.8e-12 0 0/0 3/0 3000000000/0 2 -0.00001*(a-b)/0 0 0 -0.00156/0 0.000005/0 450000/0 300/0 -1 0 0 100 xlm324v2-qpq/0 300/0 -1 0 0 100 xlm324v2-qpq/2 8e-12 0 0/2 1e-12 0 0/2 1e-13 0 0/0 300000/2 2.3e-13 0 0/2 7.9e-13 0 0/2 7.9e-13 0 0/0 2 2*(a-b)/2 5e-14 0 0/0 25/0 1 0 0 100 xlm324v2-qnq/0 2 0.0003*(a-b)/0 0.001/0 0 0 -0.25/0 1000000/0 2 1*(a-b)/0 1000000/0 0 0 -0.55/0 1000000";
  static MODEL_741 = 0;
  static MODEL_324 = 1;
  static MODEL_324v2 = 2;
  static model741resistances = [50, 25, 1e3, 5e4, 1e3, 5e3, 5e4, 50, 39e3, 7500, 4500];
  modelType;
  opheight = 16;
  opwidth = 32;
  curCounts;
  slewRate;
  currentLimit;
  capValue = 0;
  defaultCurrentLimit = 0.0231;
  FLAG_SWAP = 2;
  in1p;
  in2p;
  textp;
  rail1p;
  rail2p;
  triangle;
  plusFont;
  constructor(xa, ya, xb, yb, f, st) {
    if (st !== void 0) {
      super(xa, ya, xb, yb, f);
      this.noDiagonal = true;
      this.slewRate = parseFloatStrict(st.nextToken());
      this.capValue = parseFloatStrict(st.nextToken());
      this.currentLimit = this.defaultCurrentLimit;
      this.modelType = OpAmpRealElm.MODEL_741;
      try {
        this.currentLimit = parseFloatStrict(st.nextToken());
        this.modelType = parseIntStrict(st.nextToken());
      } catch (e) {
      }
    } else {
      super(xa, ya);
      this.noDiagonal = true;
      this.slewRate = 0.6;
      this.currentLimit = this.defaultCurrentLimit;
      this.modelType = OpAmpRealElm.MODEL_741;
    }
    this.initModel();
  }
  initModel() {
    this.flags |= CompositeElm.FLAG_ESCAPE;
    switch (this.modelType) {
      case OpAmpRealElm.MODEL_741:
        this.init741();
        break;
      case OpAmpRealElm.MODEL_324:
        this.init324();
        break;
      case OpAmpRealElm.MODEL_324v2:
        this.init324v2();
        break;
    }
    this.curCounts = new Array(5).fill(0);
    this.setPoints();
  }
  init741() {
    this.loadComposite(null, OpAmpRealElm.model741String, OpAmpRealElm.model741ExternalNodes);
    const cap = this.getCapacitor();
    if (cap) {
      cap.capacitance = 3e-11 / (this.slewRate / 0.6);
      cap.voltdiff = this.capValue;
    }
    for (let i = 0; i !== 11; i++)
      this.compElmList[21 + i].resistance = OpAmpRealElm.model741resistances[i];
    const currentMult = this.currentLimit / this.defaultCurrentLimit;
    this.compElmList[21].resistance /= currentMult;
    this.compElmList[22].resistance /= currentMult;
    this.compElmList[13].setBeta(currentMult * 100);
    this.compElmList[18].setBeta(currentMult * 100);
  }
  init324() {
    const st = new StringTokenizer(OpAmpRealElm.lm324ModelDump, "/");
    this.loadComposite(st, OpAmpRealElm.lm324ModelString, OpAmpRealElm.lm324ExternalNodes);
    const cap = this.getCapacitor();
    if (cap) {
      cap.capacitance = 1e-11 / (this.slewRate / 0.55);
      cap.voltdiff = this.capValue;
    }
    const currentMult = this.currentLimit / this.defaultCurrentLimit;
    this.compElmList[11].resistance /= currentMult;
    this.compElmList[9].setBeta(currentMult * 100);
    this.compElmList[10].setBeta(currentMult * 100);
    this.compElmList[12].setBeta(currentMult * 100);
    this.compElmList[16].setBeta(currentMult * 100);
  }
  init324v2() {
    const st = new StringTokenizer(OpAmpRealElm.lm324v2ModelDump, "/");
    this.loadComposite(st, OpAmpRealElm.lm324v2ModelString, OpAmpRealElm.lm324v2ExternalNodes);
  }
  reset() {
    super.reset();
    this.curCounts = new Array(5).fill(0);
  }
  getCapacitor() {
    if (this.modelType === OpAmpRealElm.MODEL_324v2) return null;
    return this.compElmList[this.modelType === OpAmpRealElm.MODEL_741 ? 20 : 4];
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "slr", this.slewRate);
    CircuitXMLSerializer.dumpAttr(elem, "cl", this.currentLimit);
    CircuitXMLSerializer.dumpAttr(elem, "mt", this.modelType);
  }
  dumpXmlState(doc, elem) {
    const elm = this.getCapacitor();
    CircuitXMLSerializer.dumpAttr(elem, "vd", elm ? elm.voltdiff : 0);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.slewRate = xml.parseDoubleAttr("slr", this.slewRate);
    this.currentLimit = xml.parseDoubleAttr("cl", this.currentLimit);
    this.modelType = xml.parseIntAttr("mt", this.modelType);
    const voltdiff = xml.parseDoubleAttr("vd", 0);
    this.initModel();
    const cap = this.getCapacitor();
    if (cap) cap.voltdiff = voltdiff;
  }
  getConnection(n1, n2) {
    return true;
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.opheight * 2);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.in1p[0], this.in1p[1]);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.in2p[0], this.in2p[1]);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.lead2, this.point2);
    this.setVoltageColor(g, this.nodes[3].v);
    CircuitElm.drawThickLine(g, this.rail1p[0], this.rail1p[1]);
    this.setVoltageColor(g, this.nodes[4].v);
    CircuitElm.drawThickLine(g, this.rail2p[0], this.rail2p[1]);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    this.setPowerColor(g, true);
    CircuitElm.drawThickPolygon(g, this.triangle);
    g.setFont(this.plusFont);
    this.drawCenteredText(g, "-", this.textp[0].x, this.textp[0].y - 2, true);
    this.drawCenteredText(g, "+", this.textp[1].x, this.textp[1].y, true);
    for (let i = 0; i !== 5; i++)
      this.curCounts[i] = this.updateDotCountImpl(this.getCurrentIntoNode(i), this.curCounts[i]);
    this.drawDots(g, this.in1p[1], this.in1p[0], this.curCounts[0]);
    this.drawDots(g, this.in2p[1], this.in2p[0], this.curCounts[1]);
    this.drawDots(g, this.lead2, this.point2, this.curCounts[2]);
    this.drawDots(g, this.rail1p[0], this.rail1p[1], -this.curCounts[3]);
    this.drawDots(g, this.rail2p[0], this.rail2p[1], -this.curCounts[4]);
    this.drawPosts(g);
  }
  setPoints() {
    super.setPoints();
    let ww = this.opwidth;
    if (ww > this.dn / 2) ww = Math.trunc(this.dn / 2);
    this.calcLeads(ww * 2);
    const hs = this.opheight * this.dsign;
    const hsswap = (this.flags & this.FLAG_SWAP) !== 0 ? -hs : hs;
    this.in1p = this.newPointArray(2);
    this.in2p = this.newPointArray(2);
    this.textp = this.newPointArray(2);
    this.rail1p = this.newPointArray(2);
    this.rail2p = this.newPointArray(2);
    this.interpPoint2(this.point1, this.point2, this.in1p[0], this.in2p[0], 0, hsswap);
    this.interpPoint2(this.lead1, this.lead2, this.in1p[1], this.in2p[1], 0, hsswap);
    this.interpPoint2(this.lead1, this.lead2, this.textp[0], this.textp[1], 0.2, hsswap);
    const railPos = 0.5 - this.dn / 2 % CircuitElm.app.gridSize / (ww * 2);
    this.interpPoint2(this.lead1, this.lead2, this.rail1p[1], this.rail2p[1], railPos, hs * 2 * (1 - railPos));
    this.interpPoint2(this.lead1, this.lead2, this.rail1p[0], this.rail2p[0], railPos, hs * 2);
    const tris = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, tris[0], tris[1], 0, hs * 2);
    this.triangle = this.createPolygon(tris[0], tris[1], this.lead2);
    this.plusFont = new Font("SansSerif", 0, 14);
    this.setPost(0, this.in1p[0]);
    this.setPost(1, this.in2p[0]);
    this.setPost(2, this.point2);
    this.setPost(3, this.rail1p[0]);
    this.setPost(4, this.rail2p[0]);
  }
  getDumpType() {
    return 409;
  }
  getElmType() {
    return "op-amp";
  }
  getInfo(arr) {
    const type = this.modelType === OpAmpRealElm.MODEL_741 ? "LM741" : "LM324";
    arr[0] = "op-amp (" + type + ")";
    arr[1] = "V+ = " + CircuitElm.getVoltageText(this.nodes[1].v);
    arr[2] = "V- = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[3] = "Vout = " + CircuitElm.getVoltageText(this.nodes[2].v);
    arr[4] = "Iout = " + CircuitElm.getCurrentText(this.getCurrentIntoNode(2));
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo(EditInfo.makeLink("opampreal.html", "Model"), this.modelType);
      ei.choice = new Choice();
      ei.choice.add("LM741");
      if (this.modelType === OpAmpRealElm.MODEL_324) {
        ei.choice.add("LM324, old");
        ei.choice.add("LM324, fixed");
        ei.choice.select(this.modelType);
      } else {
        ei.choice.add("LM324");
        ei.choice.select(this.modelType === OpAmpRealElm.MODEL_741 ? 0 : 1);
      }
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Swap Inputs", (this.flags & this.FLAG_SWAP) !== 0);
      return ei;
    }
    if (this.modelType === OpAmpRealElm.MODEL_324v2) return null;
    if (n === 2) return new EditInfo("Slew Rate (V/usec)", this.slewRate);
    if (n === 3) return new EditInfo("Output Current Limit (A)", this.currentLimit);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.modelType = ei.choice.getSelectedIndex();
      if (ei.choice.getItemCount() === 2 && this.modelType === 1)
        this.modelType = OpAmpRealElm.MODEL_324v2;
      this.capValue = 0;
      this.initModel();
      ei.newDialog = true;
    }
    if (n === 1) {
      this.flags = ei.changeFlag(this.flags, this.FLAG_SWAP);
      this.setPoints();
    }
    if (n === 2) {
      this.slewRate = ei.value;
      this.initModel();
    }
    if (n === 3) {
      this.currentLimit = ei.value;
      this.initModel();
    }
  }
  canFlipX() {
    return this.dy === 0;
  }
  canFlipY() {
    return this.dx === 0;
  }
}

class OpAmpSwapElm extends OpAmpElm {
  constructor(xx, yy) {
    super(xx, yy);
    this.flags |= this.FLAG_SWAP;
  }
  getDumpClass() {
    return OpAmpElm;
  }
  getShortcut() {
    return "A".charCodeAt(0);
  }
}

class OptocouplerElm extends CompositeElm {
  csize = 2;
  cspc = 0;
  cspc2 = 0;
  rectPointsX = [];
  rectPointsY = [];
  curCounts = new Array(4).fill(0);
  ctr = 1;
  // current transfer ratio (1.0 = 100%)
  static modelString = "DiodeElm 6 1\rCCCSElm 1 2 3 4\rNTransistorElm 3 4 5";
  static modelExternalNodes = [6, 2, 4, 5];
  diode;
  transistor;
  stubs = new Array(4);
  models = [];
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.loadComposite(null, OptocouplerElm.modelString, OptocouplerElm.modelExternalNodes);
      this.buildCompNodeList();
      this.allocNodes();
      this.noDiagonal = true;
      this.initOptocoupler();
      this.diode.modelName = "default-optocoupler-led";
      this.diode.setup();
    } else {
      super(xa, ya, xb, yb, f);
      this.loadComposite(null, OptocouplerElm.modelString, OptocouplerElm.modelExternalNodes);
      this.buildCompNodeList();
      this.allocNodes();
      this.noDiagonal = true;
      this.initOptocoupler();
    }
  }
  dumpXmlModel(doc) {
    const model = this.diode.model;
    if (!(model.builtIn || model.dumped))
      model.dumpXml(doc);
  }
  dumpXml(doc, elem) {
    const model = this.diode.model;
    if (!(model.builtIn || model.dumped))
      model.dumpXml(doc);
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ctr", this.ctr);
    CircuitXMLSerializer.dumpAttr(elem, "dmo", this.diode.modelName);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.ctr = xml.parseDoubleAttr("ctr", this.ctr);
    const defaultDmo = xml.parseStringAttr("ix", null) != null ? this.diode.modelName : "default";
    this.diode.modelName = xml.parseStringAttr("dmo", defaultDmo) ?? this.diode.modelName;
    this.initOptocoupler();
    this.diode.setup();
  }
  initOptocoupler() {
    this.csize = 2;
    this.cspc = 8 * 2;
    this.cspc2 = this.cspc * 2;
    this.diode = this.compElmList[0];
    const cccs = this.compElmList[1];
    this.transistor = this.compElmList[2];
    cccs?.setExpr(this.ctr + "*max(0,min(.0001, select(i-.003, (-80000000000*(i)^5+800000000*(i)^4-3000000*(i)^3+5177.2*(i)^2+.2453*(i)-.00005)*1.04/700, (9000000*(i)^5-998113*(i)^4+42174*(i)^3-861.32*(i)^2+9.0836*(i)-.0078)*.945/700)))");
    this.transistor.setBeta(700);
    this.curCounts = new Array(4).fill(0);
  }
  reset() {
    super.reset();
    this.curCounts = new Array(4).fill(0);
  }
  getConnection(n1, n2) {
    return Math.trunc(n1 / 2) === Math.trunc(n2 / 2);
  }
  draw(g) {
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    CircuitElm.drawThickPolygon(g, this.rectPointsX, this.rectPointsY, 4);
    for (let i = 0; i !== 4; i++) {
      this.setVoltageColor(g, this.nodes[i].v);
      const a = this.posts[i];
      const b = this.stubs[i];
      CircuitElm.drawThickLine(g, a, b);
      this.curCounts[i] = this.updateDotCountImpl(-this.getCurrentIntoNode(i), this.curCounts[i]);
      this.drawDots(g, a, b, this.curCounts[i]);
    }
    this.diode.draw(g);
    this.transistor.draw(g);
    this.drawPosts(g);
    g.setColor(CircuitElm.lightGrayColor);
    const dflip = this.isFlippedX() ? -1 : 1;
    const sx = this.stubs[0].x + 2 * dflip;
    const sy = Math.trunc((this.stubs[0].y + this.stubs[1].y) / 2);
    for (let i = 0; i !== 2; i++) {
      const y = sy + i * 10 - 5;
      const p1 = new Point(sx, y);
      const p2 = new Point(sx + 20 * dflip, y);
      const p = this.calcArrow(p1, p2, 5, 2);
      g.fillPolygon(p);
      g.drawLine(sx + 10 * dflip, y, sx + 15 * dflip, y);
    }
  }
  setPoints() {
    super.setPoints();
    const x0 = this.x + this.cspc2;
    const y0 = this.y;
    const xr = x0 - this.cspc;
    const yr = y0 - this.cspc / 2;
    const sizeX = 2;
    const sizeY = 2;
    const xs = sizeX * this.cspc2;
    const ys = sizeY * this.cspc2 - this.cspc;
    this.rectPointsX = [xr, xr + xs, xr + xs, xr];
    this.rectPointsY = [yr, yr, yr + ys, yr + ys];
    this.setBbox(xr, yr, this.rectPointsX[2], this.rectPointsY[2]);
    this.stubs = new Array(4);
    this.setPin(0, x0, y0, 0, 1, -1, 0, 0, 0);
    this.setPin(1, x0, y0, 0, 1, -1, 0, 0, 0);
    this.setPin(2, x0, y0, 0, 1, 1, 0, xs - this.cspc2, 0);
    this.setPin(3, x0, y0, 0, 1, 1, 0, xs - this.cspc2, 0);
    const dflip = this.isFlippedX() ? -1 : 1;
    this.diode.setPosition(
      this.posts[0].x + 32 * dflip,
      this.posts[0].y,
      this.posts[1].x + 32 * dflip,
      this.posts[1].y
    );
    this.stubs[0] = this.diode.getPost(0);
    this.stubs[1] = this.diode.getPost(1);
    const midp = Math.trunc((this.posts[2].y + this.posts[3].y) / 2);
    this.transistor.setFlipped(this.isFlippedY());
    this.transistor.setPosition(
      this.posts[2].x - 40 * dflip,
      midp,
      this.posts[2].x - 24 * dflip,
      midp
    );
    this.stubs[2] = this.transistor.getPost(1);
    this.stubs[3] = this.transistor.getPost(2);
  }
  isFlippedX() {
    return (this.flags & ChipElm.FLAG_FLIP_X) !== 0;
  }
  isFlippedY() {
    return (this.flags & ChipElm.FLAG_FLIP_Y) !== 0;
  }
  canFlipXY() {
    return false;
  }
  flipX(center2, count) {
    this.flags ^= ChipElm.FLAG_FLIP_X;
    if (count !== 1) {
      const xs = 3 * this.cspc2;
      this.x = center2 - this.x - xs;
      this.x2 = center2 - this.x2;
    }
    this.setPoints();
  }
  flipY(center2, count) {
    this.flags ^= ChipElm.FLAG_FLIP_Y;
    if (count !== 1) {
      const ys = 1 * this.cspc2;
      this.y = center2 - this.y - ys;
      this.y2 = center2 - this.y2;
    }
    this.setPoints();
  }
  setPin(n, px, py, ddx, ddy, dax, day, sx, sy) {
    const pos = n % 2;
    if (this.isFlippedX()) {
      ddx = -ddx;
      dax = -dax;
      px += this.cspc2;
      sx = -sx;
    }
    if (this.isFlippedY()) {
      ddy = -ddy;
      day = -day;
      py += this.cspc2;
      sy = -sy;
    }
    const xa = px + this.cspc2 * ddx * pos + sx;
    const ya = py + this.cspc2 * ddy * pos + sy;
    this.setPost(n, new Point(xa + dax * this.cspc2, ya + day * this.cspc2));
    this.stubs[n] = new Point(xa + dax * this.cspc, ya + day * this.cspc);
  }
  getDumpType() {
    return 407;
  }
  getInfo(arr) {
    arr[0] = "optocoupler";
    arr[1] = "CTR Scale = " + CircuitElm.showFormat.format(this.ctr);
    arr[2] = "Iin = " + CircuitElm.getCurrentText(this.getCurrentIntoNode(0));
    arr[3] = "Iout = " + CircuitElm.getCurrentText(this.getCurrentIntoNode(2));
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("CTR Scale", this.ctr, 0, 0).setDimensionless();
    if (n === 1) {
      const ei = new EditInfo("LED Model", 0, -1, -1);
      this.models = DiodeModel.getModelList(false);
      ei.choice = new Choice();
      for (let i = 0; i !== this.models.length; i++) {
        const dm = this.models[i];
        ei.choice.add(dm.getDescription());
        if (dm === this.diode.model)
          ei.choice.select(i);
      }
      return ei;
    }
    return null;
  }
  updateModels() {
    this.diode.setup();
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0) {
      this.ctr = ei.value;
      this.initOptocoupler();
    }
    if (n === 1) {
      this.diode.model = this.models[ei.choice.getSelectedIndex()];
      this.diode.modelName = this.diode.model.name;
      this.diode.setup();
    }
  }
}

class OutputElm extends CircuitElm {
  static FLAG_VALUE = 1;
  static FLAG_FIXED = 2;
  scale;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.scale = CircuitElm.SCALE_AUTO;
    } else {
      super(xa, ya, xb, yb, f);
      this.scale = CircuitElm.SCALE_AUTO;
      try {
        this.scale = parseIntStrict(st.nextToken());
      } catch (e) {
      }
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "sc", this.scale);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.scale = xml.parseIntAttr("sc", this.scale);
  }
  isOutputElm() {
    return true;
  }
  getDumpType() {
    return "O".charCodeAt(0);
  }
  getPostCount() {
    return 1;
  }
  setPoints() {
    super.setPoints();
    this.lead1 = new Point();
  }
  draw(g) {
    g.save();
    const selected = this.needsHighlight();
    const f = new Font("SansSerif", selected ? Font.BOLD : 0, 14);
    g.setFont(f);
    g.setColor(selected ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    let s = this.showVoltage() ? CircuitElm.getUnitTextWithScale(this.nodes[0].v, "V", this.scale, this.isFixed()) : Locale.LS("out");
    const role = CircuitElm.app.mouse.scopePlotRoles.get(this);
    if (role != null && role !== "")
      s = role;
    this.interpPoint(this.point1, this.point2, this.lead1, 1 - (Math.trunc(g.context.measureText(s).width / 2) + 8) / this.dn);
    this.setBbox(this.point1, this.lead1, 0);
    this.drawCenteredText(g, s, this.x2, this.y2, true);
    this.setVoltageColor(g, this.nodes[0].v);
    if (selected)
      g.setColor(CircuitElm.selectColor);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.drawPosts(g);
    g.restore();
  }
  addRoutingObstacle(router) {
    router.addWire(this.point1.x, this.point1.y, this.x2, this.y2);
    router.addObstacle(this.x2 - 10, this.y2 - 10, this.x2 + 10, this.y2 + 10);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getInfo(arr) {
    arr[0] = "output";
    arr[1] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
  }
  getEditInfo(n) {
    if (n === 0)
      return EditInfo.createCheckbox("Show Voltage", this.showVoltage());
    if (!this.showVoltage())
      return null;
    if (n === 1) {
      const ei = new EditInfo("Scale", 0);
      ei.choice = new Choice();
      ei.choice.add("Auto");
      ei.choice.add("V");
      ei.choice.add("mV");
      ei.choice.add(Locale.muString + "V");
      ei.choice.select(this.scale);
      return ei;
    }
    if (this.scale === CircuitElm.SCALE_AUTO)
      return null;
    if (n === 2)
      return EditInfo.createCheckbox("Fixed Precision", this.isFixed());
    return null;
  }
  isFixed() {
    return (this.flags & OutputElm.FLAG_FIXED) !== 0;
  }
  showVoltage() {
    return (this.flags & OutputElm.FLAG_VALUE) !== 0;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.flags = ei.changeFlag(this.flags, OutputElm.FLAG_VALUE);
      ei.newDialog = true;
    }
    if (n === 1) {
      this.scale = ei.choice.getSelectedIndex();
      ei.newDialog = true;
    }
    if (n === 2)
      this.flags = ei.changeFlag(this.flags, OutputElm.FLAG_FIXED);
  }
  //  void drawHandles(Graphics g, Color c) {
  //      g.setColor(c);
  //      g.fillRect(x-3, y-3, 7, 7);
  //  }
}

class PDarlingtonElm extends DarlingtonElm {
  constructor(xx, yy) {
    super(xx, yy, true);
  }
  getDumpClass() {
    return DarlingtonElm;
  }
}

class PhaseCompElm extends ChipElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
    } else {
      super(xa, ya, xb, yb, f, st);
    }
  }
  getChipName() {
    return "phase comparator";
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = 2;
    this.pins = new Array(3);
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "I1");
    this.pins[1] = new Pin(this, 1, ChipElm.SIDE_W, "I2");
    this.pins[2] = new Pin(this, 0, ChipElm.SIDE_E, "O");
    this.pins[2].output = true;
  }
  nonLinear() {
    return true;
  }
  stamp() {
    CircuitElm.sim.stampNonLinearVS(this.pins[2].voltSource);
    CircuitElm.sim.stampNonLinear(CircuitNode.ground);
    CircuitElm.sim.stampNonLinear(this.nodes[2]);
  }
  ff1 = false;
  ff2 = false;
  startIteration() {
    const v1 = this.nodes[0].v > this.getThreshold();
    const v2 = this.nodes[1].v > this.getThreshold();
    if (v1 && !this.pins[0].value)
      this.ff1 = true;
    if (v2 && !this.pins[1].value)
      this.ff2 = true;
    if (this.ff1 && this.ff2)
      this.ff1 = this.ff2 = false;
    this.pins[0].value = v1;
    this.pins[1].value = v2;
  }
  doStep() {
    const out = this.ff1 ? this.highVoltage : this.ff2 ? 0 : -1;
    if (out !== -1)
      CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[2], this.pins[2].voltSource, out);
    else {
      CircuitElm.sim.stampMatrixVV(this.pins[2].voltSource, this.pins[2].voltSource, 1);
    }
  }
  getPostCount() {
    return 3;
  }
  getVoltageSourceCount() {
    return 1;
  }
  getDumpType() {
    return 161;
  }
  getMatrixConnection(n1, n2) {
    return true;
  }
}

class PisoShiftElm extends ChipElm {
  static FLAG_NEW_BEHAVIOR = 2;
  data = [];
  dataIndex = 0;
  clockState = false;
  loadState = false;
  dataPinIndex = 0;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f, st);
    if (st !== void 0) {
      this.data = new Array(this.bits).fill(false);
      ChipElm.readBits(st, this.data);
    } else {
      this.data = new Array(this.bits).fill(false);
      this.flags |= PisoShiftElm.FLAG_NEW_BEHAVIOR;
    }
    this.setupPins();
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
  }
  dumpXmlState(doc, elem) {
    super.dumpXmlState(doc, elem);
    const newData = new Array(this.data.length).fill(false);
    for (let i = 0; i < this.data.length; i++)
      newData[i] = this.data[(i + this.dataIndex) % this.data.length];
    CircuitXMLSerializer.dumpAttr(elem, "dt", ChipElm.writeBitsToString(newData));
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.data = new Array(this.bits).fill(false);
    this.dataIndex = 0;
    const dt = xml.parseStringAttr("dt", null);
    if (dt !== null)
      ChipElm.readBitsFromString(dt, this.data);
  }
  getDumpType() {
    return 186;
  }
  getChipName() {
    return "PISO shift register";
  }
  needsBits() {
    return true;
  }
  defaultBitCount() {
    return 8;
  }
  hasNewBhvr() {
    return (this.flags & PisoShiftElm.FLAG_NEW_BEHAVIOR) !== 0;
  }
  reset() {
    super.reset();
    this.data = new Array(this.bits).fill(false);
  }
  setupPins() {
    this.sizeX = this.bits + 2;
    this.sizeY = 3;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 1, ChipElm.SIDE_W, "LD");
    this.pins[1] = new Pin(this, 2, ChipElm.SIDE_W, "");
    this.pins[1].clock = true;
    this.pins[2] = new Pin(this, 1, ChipElm.SIDE_E, "Q" + (this.hasNewBhvr() ? this.bits - 1 : this.bits));
    this.pins[2].output = true;
    if (this.hasNewBhvr()) {
      this.pins[3] = new Pin(this, 0, ChipElm.SIDE_W, "SER");
      if (this.data && this.data.length > 0)
        this.pins[2].value = this.data[0];
      this.dataPinIndex = 4;
    } else {
      this.dataPinIndex = 3;
    }
    for (let i = 0; i < this.bits; i++)
      this.pins[this.dataPinIndex + i] = new Pin(this, this.bits - i, ChipElm.SIDE_N, "D" + (this.bits - (i + 1)));
    this.allocNodes();
  }
  getPostCount() {
    return (this.hasNewBhvr() ? 4 : 3) + this.bits;
  }
  getVoltageSourceCount() {
    return 1;
  }
  execute() {
    if (this.pins[0].value !== this.loadState) {
      this.loadState = this.pins[0].value;
      if (this.loadState && this.data.length > 0) {
        if (this.hasNewBhvr()) {
          this.pins[2].value = this.pins[this.dataPinIndex].value;
          this.dataIndex = 0;
        } else {
          this.dataIndex = -1;
        }
        for (let i = 0; i < this.data.length; i++)
          this.data[i] = this.pins[this.dataPinIndex + i].value;
      }
    }
    if (this.pins[1].value !== this.clockState) {
      this.clockState = this.pins[1].value;
      if (this.clockState) {
        if (this.dataIndex >= 0)
          this.data[this.dataIndex] = this.hasNewBhvr() && this.pins[3].value;
        this.dataIndex++;
        if (this.dataIndex >= this.data.length)
          this.dataIndex = 0;
        this.pins[2].value = this.data[this.dataIndex];
      }
    }
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0 && ei.value !== this.bits && ei.value >= 1) {
      this.bits = Math.trunc(ei.value);
      this.data = new Array(this.bits).fill(false);
      this.setupPins();
      this.setPoints();
    }
  }
}

class PolarCapacitorElm extends CapacitorElm {
  maxNegativeVoltage;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f, st);
    if (st !== void 0) {
      this.maxNegativeVoltage = parseFloatStrict(st.nextToken());
    } else {
      this.maxNegativeVoltage = 1;
    }
  }
  getDumpType() {
    return 209;
  }
  getXmlDumpType() {
    return "pc";
  }
  dump() {
    return super.dump() + " " + this.maxNegativeVoltage;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "mv", this.maxNegativeVoltage);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.maxNegativeVoltage = xml.parseDoubleAttr("mv", this.maxNegativeVoltage);
  }
  plusPoint;
  setPoints() {
    super.setPoints();
    const f = (this.dn / 2 - 4) / this.dn;
    this.platePoints = this.newPointArray(14);
    const maxI = this.platePoints.length - 1;
    const midI = maxI / 2;
    for (let i = 0; i <= maxI; i++) {
      const q = (i - midI) * 0.9 / midI;
      this.platePoints[i] = this.interpPoint(this.plate2[0], this.plate2[1], i / maxI, 5 * (1 - Math.sqrt(1 - q * q)));
    }
    this.plusPoint = this.interpPoint(this.point1, this.point2, f - 8 / this.dn, -10 * this.dsign);
    if (this.y2 > this.y)
      this.plusPoint.y += 4;
    if (this.y > this.y2)
      this.plusPoint.y += 3;
  }
  draw(g) {
    super.draw(g);
    g.setColor(CircuitElm.whiteColor);
    g.setFont(CircuitElm.unitsFont);
    const w = Math.floor(g.context.measureText("+").width);
    g.drawString("+", this.plusPoint.x - Math.floor(w / 2), this.plusPoint.y);
  }
  getInfo(arr) {
    super.getInfo(arr);
    arr[0] = "capacitor (polarized)";
  }
  getEditInfo(n) {
    if (n === 4)
      return new EditInfo("Max Reverse Voltage", this.maxNegativeVoltage, 0, 0);
    return super.getEditInfo(n);
  }
  setEditValue(n, ei) {
    if (n === 4) {
      if (ei.value >= 0)
        this.maxNegativeVoltage = ei.value;
      else
        ei.setError("must be >= 0");
    }
    super.setEditValue(n, ei);
  }
  stepFinished() {
    if (this.getVoltageDiff() < 0 && this.getVoltageDiff() < -this.maxNegativeVoltage)
      CircuitElm.sim.stop("capacitor exceeded max reverse voltage", this);
    super.stepFinished();
  }
  getShortcut() {
    return "C".charCodeAt(0);
  }
}

class PotElm extends CircuitElm {
  FLAG_SHOW_VALUES = 1;
  FLAG_FLIP = 2;
  FLAG_FLIP_OFFSET = 4;
  position = 0.5;
  maxResistance = 1e3;
  resistance1 = 0;
  resistance2 = 0;
  current1 = 0;
  current2 = 0;
  current3 = 0;
  curcount1 = 0;
  curcount2 = 0;
  curcount3 = 0;
  slider = null;
  labelEl = null;
  sliderText = "Resistance";
  link = 0;
  sliderOwner = false;
  deleted = false;
  post3 = new Point();
  corner2 = new Point();
  arrowPoint = new Point();
  midpoint = new Point();
  arrow1 = new Point();
  arrow2 = new Point();
  ps3 = new Point();
  ps4 = new Point();
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.maxResistance = 1e3;
      this.position = 0.5;
      this.sliderText = "Resistance";
      this.flags = this.FLAG_SHOW_VALUES;
      this.createSlider();
    } else {
      super(xa, ya, xb, yb, f);
      this.maxResistance = parseFloatStrict(st.nextToken());
      this.position = parseFloatStrict(st.nextToken());
      let text = st.nextToken();
      while (st.hasMoreTokens())
        text += " " + st.nextToken();
      this.sliderText = text;
      this.createSlider();
    }
  }
  getPostCount() {
    return 3;
  }
  getDumpType() {
    return 174;
  }
  getXmlDumpType() {
    return "pt";
  }
  isPotElm() {
    return true;
  }
  getPost(n) {
    return n === 0 ? this.point1 : n === 1 ? this.point2 : this.post3;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ma", this.maxResistance);
    CircuitXMLSerializer.dumpAttr(elem, "po", this.position);
    CircuitXMLSerializer.dumpAttr(elem, "sl", this.sliderText);
    if (this.link !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "li", this.link);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.maxResistance = xml.parseDoubleAttr("ma", this.maxResistance);
    this.position = xml.parseDoubleAttr("po", this.position);
    this.sliderText = xml.parseStringAttr("sl", this.sliderText);
    this.setLink(xml.parseIntAttr("li", 0));
    this.slider?.setValue(this.calcSliderValue());
    if (this.labelEl != null)
      this.labelEl.textContent = this.sliderText;
  }
  calcSliderValue() {
    return Math.round((this.position - 5e-3) / 99e-4);
  }
  // detach from slider, transferring ownership to another linked pot if possible
  detachSlider() {
    if (!this.sliderOwner) return;
    let transferred = false;
    if (this.link !== 0) {
      for (const ce of CircuitElm.app.elmList) {
        if (ce instanceof PotElm && ce !== this && ce.link === this.link && !ce.deleted) {
          ce.sliderOwner = true;
          ce.slider = this.slider;
          ce.labelEl = this.labelEl;
          transferred = true;
          break;
        }
      }
    }
    if (!transferred) {
      if (this.labelEl != null) CircuitElm.app.removeWidgetFromVerticalPanel(this.labelEl);
      if (this.slider != null) CircuitElm.app.removeWidgetFromVerticalPanel(this.slider.element);
    }
    this.slider = null;
    this.labelEl = null;
    this.sliderOwner = false;
  }
  setLink(newLink) {
    if (newLink === this.link) return;
    this.detachSlider();
    this.link = newLink;
    this.createSlider();
  }
  createSlider() {
    if (this.link !== 0) {
      for (const ce of CircuitElm.app.elmList) {
        if (ce instanceof PotElm && ce !== this && ce.link === this.link && ce.slider != null) {
          this.slider = ce.slider;
          this.labelEl = ce.labelEl;
          this.sliderOwner = false;
          return;
        }
      }
    }
    const lbl = document.createElement("div");
    lbl.textContent = this.sliderText;
    lbl.className = "topSpace";
    this.labelEl = lbl;
    CircuitElm.app.addWidgetToVerticalPanel(lbl);
    const value = this.calcSliderValue();
    this.slider = new Scrollbar(Scrollbar.HORIZONTAL, value, 1, 0, 101);
    this.slider.addChangeHandler(() => {
      CircuitElm.app.analyzeFlag = true;
      this.setPoints();
      if (this.link !== 0) {
        for (const ce of CircuitElm.app.elmList) {
          if (ce instanceof PotElm && ce !== this && ce.link === this.link)
            ce.setPoints();
        }
      }
    });
    CircuitElm.app.addWidgetToVerticalPanel(this.slider.element);
    this.sliderOwner = true;
  }
  delete() {
    this.deleted = true;
    this.detachSlider();
    super.delete();
  }
  setPoints() {
    super.setPoints();
    const app = CircuitElm.app;
    let offset = 0;
    let myLen = 0;
    if (CircuitElm.abs(this.dx) > CircuitElm.abs(this.dy) !== this.hasFlag(this.FLAG_FLIP)) {
      myLen = 2 * app.gridSize * Math.sign(this.dx) * Math.ceil(CircuitElm.abs(this.dx) / (2 * app.gridSize));
      this.point2.x = this.point1.x + myLen;
      offset = this.dx < 0 ? this.dy : -this.dy;
      this.point2.y = this.point1.y;
    } else {
      myLen = 2 * app.gridSize * Math.sign(this.dy) * Math.ceil(CircuitElm.abs(this.dy) / (2 * app.gridSize));
      if (this.dy !== 0) {
        this.point2.y = this.point1.y + myLen;
        offset = this.dy > 0 ? this.dx : -this.dx;
        this.point2.x = this.point1.x;
      }
    }
    if (offset === 0)
      offset = this.hasFlag(this.FLAG_FLIP_OFFSET) ? -app.gridSize : app.gridSize;
    this.dn = CircuitElm.distance(this.point1, this.point2);
    const bodyLen = 32;
    this.calcLeads(bodyLen);
    this.position = this.slider.getValue() * 99e-4 + 5e-3;
    const soff = (this.position - 0.5) * bodyLen;
    this.post3 = this.interpPoint(this.point1, this.point2, 0.5, offset);
    this.corner2 = this.interpPoint(this.point1, this.point2, soff / this.dn + 0.5, offset);
    this.arrowPoint = this.interpPoint(this.point1, this.point2, soff / this.dn + 0.5, 8 * CircuitElm.sign(offset));
    this.midpoint = this.interpPoint(this.point1, this.point2, soff / this.dn + 0.5);
    this.arrow1 = new Point();
    this.arrow2 = new Point();
    const clen = CircuitElm.abs(offset) - 8;
    this.interpPoint2(this.corner2, this.arrowPoint, this.arrow1, this.arrow2, (clen - 8) / clen, 8);
    this.ps3 = new Point();
    this.ps4 = new Point();
  }
  draw(g) {
    const segments = 16;
    const hs = this.showEuroResistors() ? 6 : 8;
    const v1 = this.nodes[0].v;
    const v2 = this.nodes[1].v;
    const v3 = this.nodes[2].v;
    this.setBbox(this.point1, this.point2, hs);
    this.adjustBbox(this.post3, this.post3);
    this.draw2Leads(g);
    this.setPowerColor(g, true);
    const segf = 1 / segments;
    const divide = Math.round(segments * this.position);
    if (!this.showEuroResistors()) {
      let ox = 0;
      for (let i = 0; i !== segments; i++) {
        let nx = 0;
        switch (i & 3) {
          case 0:
            nx = 1;
            break;
          case 2:
            nx = -1;
            break;
          default:
            nx = 0;
            break;
        }
        const v = i < divide ? v1 + (v3 - v1) * i / divide : v3 + (v2 - v3) * (i - divide) / (segments - divide);
        this.setVoltageColor(g, v);
        this.interpPoint(this.lead1, this.lead2, CircuitElm.ps1, i * segf, hs * ox);
        this.interpPoint(this.lead1, this.lead2, CircuitElm.ps2, (i + 1) * segf, hs * nx);
        CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
        ox = nx;
      }
    } else {
      this.setVoltageColor(g, v1);
      this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, 0, hs);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
      for (let i = 0; i !== segments; i++) {
        const v = i < divide ? v1 + (v3 - v1) * i / divide : v3 + (v2 - v3) * (i - divide) / (segments - divide);
        this.setVoltageColor(g, v);
        this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, i * segf, hs);
        this.interpPoint2(this.lead1, this.lead2, this.ps3, this.ps4, (i + 1) * segf, hs);
        CircuitElm.drawThickLine(g, CircuitElm.ps1, this.ps3);
        CircuitElm.drawThickLine(g, CircuitElm.ps2, this.ps4);
      }
      this.interpPoint2(this.lead1, this.lead2, CircuitElm.ps1, CircuitElm.ps2, 1, hs);
      CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
    }
    this.setVoltageColor(g, v3);
    CircuitElm.drawThickLine(g, this.post3, this.corner2);
    CircuitElm.drawThickLine(g, this.corner2, this.arrowPoint);
    CircuitElm.drawThickLine(g, this.arrow1, this.arrowPoint);
    CircuitElm.drawThickLine(g, this.arrow2, this.arrowPoint);
    this.curcount1 = this.updateDotCountImpl(this.current1, this.curcount1);
    this.curcount2 = this.updateDotCountImpl(this.current2, this.curcount2);
    this.curcount3 = this.updateDotCountImpl(this.current3, this.curcount3);
    if (!this.isCreating()) {
      this.drawDots(g, this.point1, this.midpoint, this.curcount1);
      this.drawDots(g, this.point2, this.midpoint, this.curcount2);
      this.drawDots(g, this.post3, this.corner2, this.curcount3);
      this.drawDots(
        g,
        this.corner2,
        this.midpoint,
        this.addCurCount(this.curcount3, CircuitElm.distance(this.post3, this.corner2))
      );
    }
    this.drawPosts(g);
    if (this.showValues() && this.resistance1 > 0 && (this.flags & this.FLAG_SHOW_VALUES) !== 0) {
      const reverseY = this.post3.x < this.lead1.x && this.lead1.x === this.lead2.x;
      const reverseX = this.post3.y < this.lead1.y && this.lead1.x !== this.lead2.x;
      const rev = this.lead1.x === this.lead2.x && this.lead1.y < this.lead2.y || this.lead1.y === this.lead2.y && this.lead1.x > this.lead2.x;
      const s1 = CircuitElm.getShortUnitText(rev ? this.resistance2 : this.resistance1, this.showOhmSymbol() ? Locale.ohmString : "");
      const s2 = CircuitElm.getShortUnitText(rev ? this.resistance1 : this.resistance2, this.showOhmSymbol() ? Locale.ohmString : "");
      g.save();
      g.setFont(CircuitElm.valueFont);
      g.setColor(CircuitElm.whiteColor);
      const ya = g.currentFontSize / 2;
      let w = g.measureWidth(s1);
      if (this.lead1.x === this.lead2.x)
        g.drawString(s1, !reverseY ? this.arrowPoint.x + 2 : this.arrowPoint.x - 2 - w, Math.max(this.arrow1.y, this.arrow2.y) + 5 + ya);
      else
        g.drawString(s1, Math.min(this.arrow1.x, this.arrow2.x) - 2 - w, !reverseX ? this.arrowPoint.y + 4 + ya : this.arrowPoint.y - 4);
      w = g.measureWidth(s2);
      if (this.lead1.x === this.lead2.x)
        g.drawString(s2, !reverseY ? this.arrowPoint.x + 2 : this.arrowPoint.x - 2 - w, Math.min(this.arrow1.y, this.arrow2.y) - 3);
      else
        g.drawString(s2, Math.max(this.arrow1.x, this.arrow2.x) + 2, !reverseX ? this.arrowPoint.y + 4 + ya : this.arrowPoint.y - 4);
      g.restore();
    }
  }
  reset() {
    this.curcount1 = this.curcount2 = this.curcount3 = 0;
    super.reset();
  }
  calculateCurrent() {
    if (this.resistance1 === 0) return;
    this.current1 = (this.nodes[0].v - this.nodes[2].v) / this.resistance1;
    this.current2 = (this.nodes[1].v - this.nodes[2].v) / this.resistance2;
    this.current3 = -this.current1 - this.current2;
  }
  getCurrentIntoNode(n) {
    if (n === 0) return -this.current1;
    if (n === 1) return -this.current2;
    return -this.current3;
  }
  stamp() {
    const sim = SimulationManager.theSim;
    this.resistance1 = this.maxResistance * this.position;
    this.resistance2 = this.maxResistance * (1 - this.position);
    sim.stampResistor(this.nodes[0], this.nodes[2], this.resistance1);
    sim.stampResistor(this.nodes[2], this.nodes[1], this.resistance2);
  }
  getInfo(arr) {
    arr[0] = "potentiometer";
    arr[1] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
    arr[2] = "R1 = " + CircuitElm.getUnitText(this.resistance1, Locale.ohmString);
    arr[3] = "R2 = " + CircuitElm.getUnitText(this.resistance2, Locale.ohmString);
    arr[4] = "I1 = " + CircuitElm.getCurrentDText(this.current1);
    arr[5] = "I2 = " + CircuitElm.getCurrentDText(this.current2);
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("Resistance (ohms)", this.maxResistance, 0, 0);
    if (n === 1) {
      const ei = new EditInfo("Slider Text", 0, -1, -1);
      ei.text = this.sliderText;
      return ei;
    }
    if (n === 2) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Show Values", (this.flags & this.FLAG_SHOW_VALUES) !== 0);
      return ei;
    }
    if (n === 3) return new EditInfo("Group Number (for linking)", this.link, -1, -1);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.maxResistance = ei.value;
    if (n === 1) {
      this.sliderText = ei.textf.value;
      if (this.labelEl != null) this.labelEl.textContent = this.sliderText;
      CircuitElm.app.setiFrameHeight();
    }
    if (n === 2) this.flags = ei.changeFlag(this.flags, this.FLAG_SHOW_VALUES);
    if (n === 3) {
      this.setLink(Math.round(ei.value));
      this.slider?.setValue(this.calcSliderValue());
    }
  }
  setMouseElm(v) {
    super.setMouseElm(v);
    this.slider?.draw();
  }
  flipX(c2, count) {
    this.flags ^= this.FLAG_FLIP_OFFSET;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    this.flags ^= this.FLAG_FLIP_OFFSET;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    if (CircuitElm.abs(this.dx) === CircuitElm.abs(this.dy))
      this.flags ^= this.FLAG_FLIP;
    this.flags ^= this.FLAG_FLIP_OFFSET;
    super.flipXY(xmy, count);
  }
}

class ProbeElm extends CircuitElm {
  static FLAG_SHOWVOLTAGE = 1;
  static FLAG_CIRCLE = 2;
  static TP_VOL = 0;
  static TP_RMS = 1;
  static TP_MAX = 2;
  static TP_MIN = 3;
  static TP_P2P = 4;
  static TP_BIN = 5;
  static TP_FRQ = 6;
  static TP_PER = 7;
  static TP_PWI = 8;
  static TP_DUT = 9;
  // mark to space ratio
  static TP_AVG = 10;
  static circleSize = 12;
  meter;
  units = 0;
  scale;
  resistance;
  rmsV = 0;
  total = 0;
  count = 0;
  avgV = 0;
  totalV = 0;
  binaryLevel = 0;
  // 0 or 1 as double
  zerocount = 0;
  maxV = 0;
  lastMaxV = 0;
  minV = 0;
  lastMinV = 0;
  frequency = 0;
  period = 0;
  pulseWidth = 0;
  dutyCycle = 0;
  selectedValue = 0;
  increasingV = true;
  decreasingV = true;
  started = false;
  lastStepCount = 0;
  periodStart = 0;
  periodLength = 0;
  pulseStart = 0;
  center;
  // optional name, drawn next to the reading and usable as v(label) in an expression
  label = "";
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.meter = ProbeElm.TP_VOL;
      this.flags = ProbeElm.FLAG_SHOWVOLTAGE | ProbeElm.FLAG_CIRCLE;
      this.scale = CircuitElm.SCALE_AUTO;
      this.resistance = 1e7;
    } else {
      super(xa, ya, xb, yb, f);
      this.meter = ProbeElm.TP_VOL;
      this.scale = CircuitElm.SCALE_AUTO;
      this.resistance = 0;
      try {
        this.meter = parseIntStrict(st.nextToken());
        this.scale = parseIntStrict(st.nextToken());
        this.resistance = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
    }
  }
  getDumpType() {
    return "p".charCodeAt(0);
  }
  isProbeElm() {
    return true;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "me", this.meter);
    CircuitXMLSerializer.dumpAttr(elem, "sc", this.scale);
    CircuitXMLSerializer.dumpAttr(elem, "re", this.resistance);
    if (this.label.length > 0)
      CircuitXMLSerializer.dumpAttr(elem, "lb", this.label);
  }
  undumpXml(xml) {
    this.flags = 0;
    super.undumpXml(xml);
    this.meter = xml.parseIntAttr("me", this.meter);
    this.scale = xml.parseIntAttr("sc", this.scale);
    this.resistance = xml.parseDoubleAttr("re", 0);
    this.label = xml.parseStringAttr("lb", "") ?? "";
  }
  setPoints() {
    super.setPoints();
    this.center = this.interpPoint(this.point1, this.point2, 0.5);
  }
  reset() {
    super.reset();
    this.zerocount = 0;
    this.rmsV = this.total = this.count = 0;
    this.avgV = this.totalV = 0;
    this.maxV = this.lastMaxV = 0;
    this.minV = this.lastMinV = 0;
    this.binaryLevel = 0;
    this.period = this.pulseWidth = this.dutyCycle = 0;
    this.selectedValue = 0;
    this.periodStart = this.periodLength = this.pulseStart = 0;
    this.increasingV = true;
    this.decreasingV = true;
    this.started = false;
    this.lastStepCount = 0;
  }
  getMeter() {
    switch (this.meter) {
      case ProbeElm.TP_VOL:
        return "V";
      case ProbeElm.TP_RMS:
        return "V(rms)";
      case ProbeElm.TP_AVG:
        return "V(avg)";
      case ProbeElm.TP_MAX:
        return "Vmax";
      case ProbeElm.TP_MIN:
        return "Vmin";
      case ProbeElm.TP_P2P:
        return "Peak to peak";
      case ProbeElm.TP_BIN:
        return "Binary";
      case ProbeElm.TP_FRQ:
        return "Frequency";
      case ProbeElm.TP_PER:
        return "Period";
      case ProbeElm.TP_PWI:
        return "Pulse width";
      case ProbeElm.TP_DUT:
        return "Duty cycle";
    }
    return "";
  }
  mustShowVoltage() {
    return (this.flags & ProbeElm.FLAG_SHOWVOLTAGE) !== 0;
  }
  drawAsCircle() {
    return (this.flags & ProbeElm.FLAG_CIRCLE) !== 0;
  }
  draw(g) {
    g.save();
    const role = CircuitElm.app.mouse.scopePlotRoles.get(this);
    const showCircle = this.drawAsCircle() && (role == null || role === "");
    const hs = showCircle ? ProbeElm.circleSize : 8;
    this.setBbox(this.point1, this.point2, hs);
    const selected = this.needsHighlight();
    let len = selected || this.isCreating() || this.mustShowVoltage() ? 16 : this.dn - 32;
    if (showCircle)
      len = ProbeElm.circleSize * 2;
    this.calcLeads(len);
    this.setVoltageColor(g, this.nodes[0].v);
    if (selected)
      g.setColor(CircuitElm.selectColor);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.setVoltageColor(g, this.nodes[1].v);
    if (selected)
      g.setColor(CircuitElm.selectColor);
    CircuitElm.drawThickLine(g, this.lead2, this.point2);
    const f = new Font("SansSerif", Font.BOLD, 14);
    g.setFont(f);
    if (role != null && role !== "")
      this.drawCenteredText(g, role, this.center.x, this.center.y, true);
    const hsv = showCircle ? ProbeElm.circleSize + 3 : 4;
    if (this.mustShowVoltage()) {
      let s = "";
      switch (this.meter) {
        case ProbeElm.TP_VOL:
          s = CircuitElm.getUnitTextWithScale(this.getVoltageDiff(), "V", this.scale);
          break;
        case ProbeElm.TP_RMS:
          s = CircuitElm.getUnitTextWithScale(this.rmsV, "V(rms)", this.scale);
          break;
        case ProbeElm.TP_AVG:
          s = CircuitElm.getUnitTextWithScale(this.avgV, "V(avg)", this.scale);
          break;
        case ProbeElm.TP_MAX:
          s = CircuitElm.getUnitTextWithScale(this.lastMaxV, "Vpk", this.scale);
          break;
        case ProbeElm.TP_MIN:
          s = CircuitElm.getUnitTextWithScale(this.lastMinV, "Vmin", this.scale);
          break;
        case ProbeElm.TP_P2P:
          s = CircuitElm.getUnitTextWithScale(this.lastMaxV - this.lastMinV, "Vp2p", this.scale);
          break;
        case ProbeElm.TP_BIN:
          s = this.binaryLevel + "";
          break;
        case ProbeElm.TP_FRQ:
          s = CircuitElm.getUnitText(this.frequency, "Hz");
          break;
        case ProbeElm.TP_PER:
          break;
        case ProbeElm.TP_PWI:
          s = CircuitElm.getUnitText(this.pulseWidth, "s");
          break;
        case ProbeElm.TP_DUT:
          s = CircuitElm.showFormat.format(this.dutyCycle);
          break;
      }
      if (this.label.length > 0)
        s = this.label + " " + s;
      this.drawValues(g, s, hsv);
    } else if (this.label.length > 0)
      this.drawValues(g, this.label, hsv);
    g.setColor(CircuitElm.whiteColor);
    g.setFont(CircuitElm.unitsFont);
    const plusPoint = this.interpPoint(
      this.point1,
      this.point2,
      (this.dn / 2 - len / 2 - 4) / this.dn,
      -10 * this.dsign
    );
    if (this.y2 > this.y)
      plusPoint.y += 4;
    if (this.y > this.y2)
      plusPoint.y += 3;
    const w = g.context.measureText("+").width;
    g.drawString("+", plusPoint.x - w / 2, plusPoint.y);
    if (showCircle) {
      g.setColor(CircuitElm.lightGrayColor);
      CircuitElm.drawThickCircle(g, this.center.x, this.center.y, ProbeElm.circleSize);
      this.drawCenteredText(g, "V", this.center.x, this.center.y, true);
    }
    this.drawPosts(g);
    g.restore();
  }
  stepFinished() {
    if (CircuitElm.sim.timeStepCount === this.lastStepCount)
      return;
    this.lastStepCount = CircuitElm.sim.timeStepCount;
    this.count++;
    const v = this.getVoltageDiff();
    this.total += v * v;
    this.totalV += v;
    this.binaryLevel = v < 2.5 ? 0 : 1;
    if (!this.started) {
      this.started = true;
      this.maxV = this.minV = v;
      this.increasingV = true;
      this.decreasingV = false;
      this.periodStart = this.pulseStart = CircuitElm.sim.t;
    }
    if (v > this.maxV && this.increasingV) {
      this.maxV = v;
      this.increasingV = true;
      this.decreasingV = false;
    }
    if (v < this.maxV && this.increasingV) {
      this.lastMaxV = this.maxV;
      this.periodLength = CircuitElm.sim.t - this.periodStart;
      this.periodStart = CircuitElm.sim.t;
      this.period = this.periodLength;
      this.pulseWidth = CircuitElm.sim.t - this.pulseStart;
      this.dutyCycle = this.pulseWidth / this.periodLength;
      this.minV = v;
      this.increasingV = false;
      this.decreasingV = true;
      this.total /= this.count;
      this.rmsV = Math.sqrt(this.total);
      if (isNaN(this.rmsV)) this.rmsV = 0;
      this.avgV = this.totalV / this.count;
      if (isNaN(this.avgV)) this.avgV = 0;
      this.count = 0;
      this.total = 0;
      this.totalV = 0;
    }
    if (v < this.minV && this.decreasingV) {
      this.minV = v;
      this.increasingV = false;
      this.decreasingV = true;
    }
    if (v > this.minV && this.decreasingV) {
      this.lastMinV = this.minV;
      this.pulseStart = CircuitElm.sim.t;
      this.maxV = v;
      this.increasingV = true;
      this.decreasingV = false;
      this.total /= this.count;
      this.rmsV = Math.sqrt(this.total);
      if (isNaN(this.rmsV)) this.rmsV = 0;
      this.avgV = this.totalV / this.count;
      if (isNaN(this.avgV)) this.avgV = 0;
      this.count = 0;
      this.total = 0;
      this.totalV = 0;
    }
    if (v === 0) {
      this.zerocount++;
      if (this.zerocount > 5) {
        this.total = 0;
        this.rmsV = 0;
        this.avgV = 0;
        this.maxV = 0;
        this.minV = 0;
      }
    } else {
      this.zerocount = 0;
    }
  }
  calculateCurrent() {
    this.current = this.resistance === 0 ? 0 : (this.nodes[0].v - this.nodes[1].v) / this.resistance;
  }
  stamp() {
    if (this.resistance !== 0)
      CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
  }
  getInfo(arr) {
    arr[0] = "voltmeter";
    let i = 1;
    arr[i++] = this.getMeterLine(this.meter);
    if (this.meter !== ProbeElm.TP_VOL) arr[i++] = this.getMeterLine(ProbeElm.TP_VOL);
    if (this.meter !== ProbeElm.TP_MAX) arr[i++] = this.getMeterLine(ProbeElm.TP_MAX);
    if (this.meter !== ProbeElm.TP_MIN) arr[i++] = this.getMeterLine(ProbeElm.TP_MIN);
    if (this.meter !== ProbeElm.TP_RMS) arr[i++] = this.getMeterLine(ProbeElm.TP_RMS);
    if (this.meter !== ProbeElm.TP_AVG) arr[i++] = this.getMeterLine(ProbeElm.TP_AVG);
    if (this.meter !== ProbeElm.TP_P2P) arr[i++] = this.getMeterLine(ProbeElm.TP_P2P);
    if (this.meter !== ProbeElm.TP_PER) arr[i++] = this.getMeterLine(ProbeElm.TP_PER);
    if (this.meter !== ProbeElm.TP_PWI) arr[i++] = this.getMeterLine(ProbeElm.TP_PWI);
    if (this.meter !== ProbeElm.TP_DUT) arr[i++] = this.getMeterLine(ProbeElm.TP_DUT);
  }
  getMeterLine(m) {
    switch (m) {
      case ProbeElm.TP_VOL:
        return "Vd = " + CircuitElm.getVoltageText(this.getVoltageDiff());
      case ProbeElm.TP_RMS:
        return "V(rms) = " + CircuitElm.getVoltageText(this.rmsV);
      case ProbeElm.TP_AVG:
        return "V(avg) = " + CircuitElm.getVoltageText(this.avgV);
      case ProbeElm.TP_MAX:
        return "Vmax = " + CircuitElm.getVoltageText(this.lastMaxV);
      case ProbeElm.TP_MIN:
        return "Vmin = " + CircuitElm.getVoltageText(this.lastMinV);
      case ProbeElm.TP_P2P:
        return "Vp2p = " + CircuitElm.getVoltageText(this.lastMaxV - this.lastMinV);
      case ProbeElm.TP_BIN:
        return "Binary = " + this.binaryLevel;
      case ProbeElm.TP_FRQ:
        return "Freq = " + CircuitElm.getUnitText(this.frequency, "Hz");
      case ProbeElm.TP_PER:
        return "Period = " + CircuitElm.getUnitText(this.period, "s");
      case ProbeElm.TP_PWI:
        return "Pulse width = " + CircuitElm.getUnitText(this.pulseWidth, "s");
      case ProbeElm.TP_DUT:
        return "Duty cycle = " + CircuitElm.showFormat.format(this.dutyCycle);
    }
    return "";
  }
  getConnection(n1, n2) {
    return this.resistance !== 0;
  }
  getEditInfo(n) {
    if (n === 0)
      return EditInfo.createCheckbox("Show Value", this.mustShowVoltage());
    if (n === 1) {
      const ei = new EditInfo("Value", this.selectedValue, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("Voltage");
      ei.choice.add("RMS Voltage");
      ei.choice.add("Average Voltage");
      ei.choice.add("Max Voltage");
      ei.choice.add("Min Voltage");
      ei.choice.add("P2P Voltage");
      ei.choice.add("Binary Value");
      ei.choice.select(this.meterChoiceIndex(this.meter));
      return ei;
    }
    if (n === 2) {
      const ei = new EditInfo("Scale", 0);
      ei.choice = new Choice();
      ei.choice.add("Auto");
      ei.choice.add("V");
      ei.choice.add("mV");
      ei.choice.add(Locale.muString + "V");
      ei.choice.select(this.scale);
      return ei;
    }
    if (n === 3)
      return EditInfo.createCheckbox("Use Circle Symbol", this.drawAsCircle());
    if (n === 4)
      return new EditInfo("Series Resistance (0 = infinite)", this.resistance);
    if (n === 5) {
      const ei = new EditInfo("Label", 0, -1, -1);
      ei.text = this.label;
      return ei;
    }
    return null;
  }
  meterChoices() {
    return [
      ProbeElm.TP_VOL,
      ProbeElm.TP_RMS,
      ProbeElm.TP_AVG,
      ProbeElm.TP_MAX,
      ProbeElm.TP_MIN,
      ProbeElm.TP_P2P,
      ProbeElm.TP_BIN
    ];
  }
  meterChoiceIndex(m) {
    const choices = this.meterChoices();
    for (let i = 0; i !== choices.length; i++)
      if (choices[i] === m)
        return i;
    return 0;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      if (ei.checkbox.getState())
        this.flags |= ProbeElm.FLAG_SHOWVOLTAGE;
      else
        this.flags &= ~ProbeElm.FLAG_SHOWVOLTAGE;
    }
    if (n === 1)
      this.meter = this.meterChoices()[ei.choice.getSelectedIndex()];
    if (n === 2)
      this.scale = ei.choice.getSelectedIndex();
    if (n === 3)
      this.flags = ei.changeFlag(this.flags, ProbeElm.FLAG_CIRCLE);
    if (n === 4)
      this.resistance = ei.value;
    if (n === 5)
      this.label = ei.textf ? ei.textf.value : ei.text ?? "";
  }
  getExprRefName() {
    return this.label.length > 0 ? this.label : null;
  }
}

class PushSwitchElm extends SwitchElm {
  constructor(xx, yy) {
    super(xx, yy, true);
  }
  getDumpClass() {
    return SwitchElm;
  }
  getShortcut() {
    return 0;
  }
}

class SRAMElm extends ChipElm {
  static FLAG_HEX_DISPLAY = 4;
  addressNodes = 0;
  dataNodes = 0;
  internalNodes = 0;
  addressBits = 0;
  dataBits = 0;
  map;
  initialMap = null;
  // saved initial contents for restore on reset
  loadedFileName = null;
  // remembers the last file loaded via "Load Contents From File"
  static FLAG_RELOAD_ON_RESET = 2;
  static contentsOverride = null;
  static fileNameOverride = null;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.addressBits = this.dataBits = 4;
      this.map = /* @__PURE__ */ new Map();
      this.setupPins();
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
      this.map = /* @__PURE__ */ new Map();
      this.addressBits = parseIntStrict(st.nextToken());
      this.dataBits = parseIntStrict(st.nextToken());
      this.setupPins();
      try {
        while (true) {
          const a_str = st.nextToken();
          let a = parseIntStrict(a_str);
          if (a < 0)
            break;
          let v = parseIntStrict(st.nextToken());
          this.map.set(a, v);
          while (true) {
            v = parseIntStrict(st.nextToken());
            if (v < 0)
              break;
            this.map.set(++a, v);
          }
        }
      } catch (e) {
      }
      if ((this.flags & SRAMElm.FLAG_RELOAD_ON_RESET) !== 0)
        this.initialMap = new Map(this.map);
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ab", this.addressBits);
    CircuitXMLSerializer.dumpAttr(elem, "db", this.dataBits);
  }
  dumpXmlState(doc, elem) {
    super.dumpXmlState(doc, elem);
    if (this.map.size > 0)
      elem.appendChild(doc.createTextNode(this.contentsToString()));
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.addressBits = xml.parseIntAttr("ab", this.addressBits);
    this.dataBits = xml.parseIntAttr("db", this.dataBits);
    this.map = /* @__PURE__ */ new Map();
    try {
      const s = xml.parseContents();
      if (s) this.parseContentsString(s);
    } catch (e) {
    }
    this.setupPins();
  }
  reset() {
    super.reset();
    if ((this.flags & SRAMElm.FLAG_RELOAD_ON_RESET) !== 0 && this.initialMap !== null)
      this.map = new Map(this.initialMap);
  }
  nonLinear() {
    return true;
  }
  allowBus() {
    return true;
  }
  getChipName() {
    return "Static RAM";
  }
  setupPins() {
    if (this.addressBits === void 0)
      this.addressBits = 0;
    if (this.dataBits === void 0)
      this.dataBits = 0;
    this.sizeX = 2;
    const addrY = this.useBus() ? 1 : this.addressBits;
    const dataY = this.useBus() ? 1 : this.dataBits;
    this.sizeY = Math.max(addrY, dataY) + 1;
    this.bits = this.addressBits;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "WE");
    this.pins[0].lineOver = true;
    this.pins[1] = new Pin(this, 0, ChipElm.SIDE_E, "OE");
    this.pins[1].lineOver = true;
    this.addressNodes = 2;
    this.dataNodes = 2 + this.addressBits;
    this.internalNodes = 2 + this.addressBits + this.dataBits;
    this.makeBitPins(this.addressBits, this.sizeY - addrY, ChipElm.SIDE_W, this.addressNodes, "A", false, false, true);
    this.makeBitPins(this.dataBits, this.sizeY - dataY, ChipElm.SIDE_E, this.dataNodes, "D", true, false, true);
    this.allocNodes();
  }
  getPostCount() {
    return 2 + this.addressBits + this.dataBits;
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Address Bits", this.addressBits, 1, 1).setDimensionless();
    if (n === 1)
      return new EditInfo("# of Data Bits", this.dataBits, 1, 1).setDimensionless();
    if (n === 2) {
      const ei = new EditInfo("Contents", 0);
      ei.textArea = { value: SRAMElm.contentsOverride !== null ? SRAMElm.contentsOverride : this.contentsToString(), element: null };
      SRAMElm.contentsOverride = null;
      if (SRAMElm.fileNameOverride !== null)
        this.loadedFileName = SRAMElm.fileNameOverride;
      SRAMElm.fileNameOverride = null;
      return ei;
    }
    if (n === 3) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Hex Display", this.hasFlag(SRAMElm.FLAG_HEX_DISPLAY));
      return ei;
    }
    if (n === 4 && SRAMElm.loadFileSupported()) {
      const ei = new EditInfo(
        this.loadedFileName !== null ? "Loaded: " + this.loadedFileName : "",
        0,
        -1,
        -1
      );
      const input = document.createElement("input");
      input.type = "file";
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (file) SRAMElm.fetchLoadFileData(this, file);
      });
      ei.widget = input;
      return ei;
    }
    const reloadIdx = SRAMElm.loadFileSupported() ? 5 : 4;
    if (n === reloadIdx) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox(
        "Restore Contents on Reset",
        (this.flags & SRAMElm.FLAG_RELOAD_ON_RESET) !== 0
      );
      return ei;
    }
    return super.getChipEditInfo(n);
  }
  static loadFileSupported() {
    return typeof File !== "undefined" && typeof FileReader !== "undefined";
  }
  // Load Contents From File: reads the raw bytes of the chosen file and turns them into the
  // same "addr: val val val..." text the Contents field understands, one value per byte (or,
  // for dataBits > 8, per big-endian 16-bit pair) - matching circuitjs1's SRAMLoadFile.
  static fetchLoadFileData(elm, file) {
    if (file.size >= 128e3) {
      window.alert(Locale.LS("Cannot load: That file is too large!"));
      return;
    }
    const bytesPerValue = elm.dataBits > 8 ? 2 : 1;
    const hexDigits = bytesPerValue * 2;
    const reader = new FileReader();
    reader.onload = () => {
      const arr = new Uint8Array(reader.result);
      const n = arr.length - arr.length % bytesPerValue;
      let str = "0x0:";
      for (let i = 0; i < n; i += bytesPerValue) {
        let val = 0;
        for (let j = 0; j < bytesPerValue; j++)
          val = val << 8 | arr[i + j];
        let hex = val.toString(16).toUpperCase();
        while (hex.length < hexDigits)
          hex = "0" + hex;
        str += " 0x" + hex;
      }
      SRAMElm.doLoadCallback(str, file.name);
    };
    reader.readAsArrayBuffer(file);
  }
  static doLoadCallback(data, fileName) {
    SRAMElm.contentsOverride = data;
    SRAMElm.fileNameOverride = fileName;
    CirSim.editDialog?.resetDialog();
    SRAMElm.contentsOverride = null;
    SRAMElm.fileNameOverride = null;
  }
  contentsToString() {
    const hex = this.hasFlag(SRAMElm.FLAG_HEX_DISPLAY);
    let s = "";
    const maxI = 1 << this.addressBits;
    for (let i = 0; i < maxI; i++) {
      let val = this.map.get(i);
      if (val === void 0 || val === 0)
        continue;
      s += (hex ? i.toString(16).toUpperCase() : "" + i) + ": " + (hex ? this.toHex(val) : "" + val);
      let ct = 1;
      while (true) {
        val = this.map.get(++i);
        if (val === void 0 || val === 0)
          break;
        s += " " + (hex ? this.toHex(val) : "" + val);
        if (++ct === 8)
          break;
      }
      s += "\n";
    }
    return s;
  }
  toHex(val) {
    const mask = (1 << this.dataBits) - 1;
    const h = (val & mask).toString(16).toUpperCase();
    return h.length < 2 ? "0" + h : h;
  }
  parseContentsString(s) {
    this.map.clear();
    const lines = s.split("\n");
    for (let i = 0; i !== lines.length; i++) {
      try {
        const line = lines[i];
        const args = line.split(/: */);
        let addr = this.parseNumber(args[0]);
        const vals = args[1].split(/ +/);
        for (let j = 0; j !== vals.length; j++) {
          const val = this.parseNumber(vals[j]);
          this.map.set(addr++, val);
        }
      } catch (e) {
      }
    }
  }
  parseNumber(str) {
    if (str.startsWith("0x"))
      return parseIntStrict(str.substring(2), 16);
    if (this.hasFlag(SRAMElm.FLAG_HEX_DISPLAY))
      return parseIntStrict(str, 16);
    if (str.startsWith("0b"))
      return parseIntStrict(str.substring(2), 2);
    return parseIntStrict(str);
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.value >= 2 && ei.value <= 16) {
        this.addressBits = Math.floor(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be between 2 and 16");
    }
    if (n === 1) {
      if (ei.value >= 2 && ei.value <= 16) {
        this.dataBits = Math.floor(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be between 2 and 16");
    }
    if (n === 2) {
      this.parseContentsString(ei.textArea.element ? ei.textArea.element.value : ei.textArea.value);
      if ((this.flags & SRAMElm.FLAG_RELOAD_ON_RESET) !== 0)
        this.initialMap = new Map(this.map);
    }
    if (n === 3) {
      const oldFlags = this.flags;
      if (ei.textArea && ei.textArea.element)
        this.parseContentsString(ei.textArea.element.value);
      this.flags = ei.changeFlag(this.flags, SRAMElm.FLAG_HEX_DISPLAY);
      if (this.flags !== oldFlags) {
        SRAMElm.contentsOverride = this.contentsToString();
        ei.newDialog = true;
      }
    }
    const reloadIdx = SRAMElm.loadFileSupported() ? 5 : 4;
    if (n === reloadIdx) {
      this.flags = ei.changeFlag(this.flags, SRAMElm.FLAG_RELOAD_ON_RESET);
      if ((this.flags & SRAMElm.FLAG_RELOAD_ON_RESET) !== 0)
        this.initialMap = new Map(this.map);
      else
        this.initialMap = null;
    }
  }
  getVoltageSourceCount() {
    return this.dataBits;
  }
  getInternalNodeCount() {
    return this.dataBits;
  }
  setVoltageSource(j, vs) {
    super.setVoltageSource(j, vs);
    vs.setNodes(CircuitNode.ground, this.nodes[this.internalNodes + j]);
  }
  getMatrixConnection(n1, n2) {
    for (let i = 0; i !== this.dataBits; i++)
      if (this.comparePair(n1, n2, this.internalNodes + i, this.dataNodes + i))
        return true;
    return false;
  }
  address = 0;
  stamp() {
    for (let i = 0; i !== this.dataBits; i++) {
      const p = this.pins[i + this.dataNodes];
      CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[this.internalNodes + i], p.voltSource);
      CircuitElm.sim.stampNonLinear(this.nodes[this.internalNodes + i]);
      CircuitElm.sim.stampNonLinear(this.nodes[this.dataNodes + i]);
    }
  }
  doStep() {
    const writeEnabled = this.nodes[0].v < this.getThreshold();
    const outputEnabled = this.nodes[1].v < this.getThreshold() && !writeEnabled;
    this.address = 0;
    for (let i = 0; i !== this.addressBits; i++) {
      this.address |= this.nodes[this.addressNodes + i].v > this.getThreshold() ? 1 << this.addressBits - 1 - i : 0;
    }
    const dataObj = this.map.get(this.address);
    const data = dataObj === void 0 ? 0 : dataObj;
    for (let i = 0; i !== this.dataBits; i++) {
      const p = this.pins[i + this.dataNodes];
      CircuitElm.sim.updateVoltageSource(
        CircuitNode.ground,
        this.nodes[this.internalNodes + i],
        p.voltSource,
        (data & 1 << this.dataBits - 1 - i) === 0 ? 0 : this.highVoltage
      );
      if (outputEnabled)
        CircuitElm.sim.stampResistor(this.nodes[this.internalNodes + i], this.nodes[this.dataNodes + i], 1);
      else
        CircuitElm.sim.stampResistor(this.nodes[this.dataNodes + i], CircuitNode.ground, 1e8);
    }
  }
  stepFinished() {
    let data = 0;
    const writeEnabled = this.nodes[0].v < this.getThreshold();
    if (!writeEnabled)
      return;
    for (let i = 0; i !== this.dataBits; i++) {
      data |= this.nodes[this.dataNodes + i].v > this.getThreshold() ? 1 << this.dataBits - 1 - i : 0;
    }
    this.map.set(this.address, data);
  }
  getDumpType() {
    return 413;
  }
}

class ROMElm extends SRAMElm {
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
    }
  }
  getChipName() {
    return "ROM";
  }
  getDumpType() {
    return 436;
  }
  // no WE pin; just OE + address + data
  setupPins() {
    if (this.addressBits === void 0)
      this.addressBits = 0;
    if (this.addressBits === 0)
      this.addressBits = this.dataBits = 4;
    this.sizeX = 2;
    const addrY = this.useBus() ? 1 : this.addressBits;
    const dataY = this.useBus() ? 1 : this.dataBits;
    this.sizeY = Math.max(addrY, dataY) + 1;
    this.bits = this.addressBits;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "OE");
    this.pins[0].lineOver = true;
    this.addressNodes = 1;
    this.dataNodes = 1 + this.addressBits;
    this.internalNodes = 1 + this.addressBits + this.dataBits;
    this.makeBitPins(this.addressBits, this.sizeY - addrY, ChipElm.SIDE_W, this.addressNodes, "A", false, false, true);
    this.makeBitPins(this.dataBits, this.sizeY - dataY, ChipElm.SIDE_E, this.dataNodes, "D", true, false, true);
    this.allocNodes();
  }
  getPostCount() {
    return 1 + this.addressBits + this.dataBits;
  }
  doStep() {
    const outputEnabled = this.nodes[0].v < this.getThreshold();
    this.address = 0;
    for (let i = 0; i !== this.addressBits; i++)
      this.address |= this.nodes[this.addressNodes + i].v > this.getThreshold() ? 1 << this.addressBits - 1 - i : 0;
    const dataObj = this.map.get(this.address);
    const data = dataObj === void 0 ? 0 : dataObj;
    for (let i = 0; i !== this.dataBits; i++) {
      const p = this.pins[i + this.dataNodes];
      CircuitElm.sim.updateVoltageSource(
        CircuitNode.ground,
        this.nodes[this.internalNodes + i],
        p.voltSource,
        (data & 1 << this.dataBits - 1 - i) === 0 ? 0 : this.highVoltage
      );
      if (outputEnabled)
        CircuitElm.sim.stampResistor(this.nodes[this.internalNodes + i], this.nodes[this.dataNodes + i], 1);
      else
        CircuitElm.sim.stampResistor(this.nodes[this.dataNodes + i], CircuitNode.ground, 1e8);
    }
  }
  // no writing
  stepFinished() {
  }
}

class EditRelayModelDialog extends EditDialog {
  model;
  relayElm;
  constructor(rm, f, re) {
    super(rm, f);
    this.model = rm;
    this.relayElm = re;
    this.applyButton.remove();
  }
  apply() {
    if (!super.apply())
      return false;
    if (this.model.name === null || this.model.name.length === 0)
      this.model.pickName();
    if (this.relayElm !== null)
      this.relayElm.newModelCreated(this.model);
    return true;
  }
  closeDialog() {
    super.closeDialog();
    const edlg = CirSim.editDialog;
    if (edlg !== null)
      edlg.resetDialog();
    CirSim.relayModelEditDialog = null;
  }
}

class RelayElm extends CircuitElm {
  FLAG_SWAP_COIL = 1;
  FLAG_SHOW_BOX = 2;
  FLAG_BOTH_SIDES_COIL = 4;
  FLAG_FLIP = 8;
  FLAG_PULLDOWN = 16;
  needsPulldown() {
    return this.model != null && this.model.pulldown;
  }
  coilStyleFromFlags(f) {
    if ((f & this.FLAG_SWAP_COIL) !== 0) return 2;
    if ((f & this.FLAG_BOTH_SIDES_COIL) !== 0) return 0;
    return 1;
  }
  modelName;
  model;
  static lastModelName = "default";
  // convenience accessors so the rest of the code doesn't change
  inductance() {
    return this.model.inductance;
  }
  r_on() {
    return this.model.r_on;
  }
  r_off() {
    return this.model.r_off;
  }
  onCurrent() {
    return this.model.onCurrent;
  }
  offCurrent() {
    return this.model.offCurrent;
  }
  coilR() {
    return this.model.coilR;
  }
  switchingTime() {
    return this.model.switchingTime;
  }
  poleCount() {
    return this.model == null ? 1 : this.model.poleCount;
  }
  ind;
  coilPosts;
  coilLeads;
  swposts;
  swpoles;
  ptSwitch;
  lines;
  outline = this.newPointArray(4);
  coilCurrent;
  switchCurrent;
  coilCurCount;
  switchCurCount;
  // fractional position, between 0 and 1 inclusive
  d_position = 0;
  // integer position, can be 0 (off), 1 (on), 2 (in between)
  i_position = 0;
  openhs;
  dflip;
  onState = false;
  nSwitch0 = 0;
  nSwitch1 = 1;
  nSwitch2 = 2;
  nCoil1;
  nCoil2;
  nCoil3;
  currentOffset1;
  currentOffset2;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.modelName = RelayElm.lastModelName;
      this.model = RelayModel.getModelWithName(this.modelName);
      this.ind = new Inductor(CircuitElm.sim);
      this.ind.setup(this.inductance(), 0, Inductor.FLAG_BACK_EULER);
      this.noDiagonal = true;
      this.coilCurrent = this.coilCurCount = 0;
      this.setupPoles();
    } else {
      super(xa, ya, xb, yb, f);
      const poleCount = parseIntStrict(st.nextToken());
      const inductance = parseFloatStrict(st.nextToken());
      this.coilCurrent = parseFloatStrict(st.nextToken());
      const r_on = parseFloatStrict(st.nextToken());
      const r_off = parseFloatStrict(st.nextToken());
      const onCurrent = parseFloatStrict(st.nextToken());
      const coilR = parseFloatStrict(st.nextToken());
      let offCurrent = onCurrent;
      let switchingTime = 0;
      try {
        offCurrent = parseFloatStrict(st.nextToken());
        switchingTime = parseFloatStrict(st.nextToken());
        this.d_position = this.i_position = parseIntStrict(st.nextToken());
      } catch (e) {
      }
      this.model = RelayModel.getModelWithParameters(
        inductance,
        r_on,
        r_off,
        onCurrent,
        offCurrent,
        coilR,
        switchingTime,
        this.coilStyleFromFlags(f),
        (f & this.FLAG_SHOW_BOX) !== 0,
        (f & this.FLAG_PULLDOWN) !== 0,
        poleCount
      );
      this.modelName = this.model.name;
      this.postUndump();
    }
  }
  postUndump() {
    if (this.i_position === 1)
      this.onState = true;
    if (this.i_position === 2)
      this.d_position = 0.5;
    this.noDiagonal = true;
    this.ind = new Inductor(CircuitElm.sim);
    this.ind.setup(this.inductance(), this.coilCurrent, Inductor.FLAG_BACK_EULER);
    this.setupPoles();
    this.allocNodes();
  }
  setup() {
    this.model = RelayModel.getModelWithNameOrCopy(this.modelName, this.model);
    this.modelName = this.model.name;
    this.ind.setup(this.inductance(), this.coilCurrent, Inductor.FLAG_BACK_EULER);
  }
  updateModels() {
    this.setup();
    this.setPoints();
  }
  newModelCreated(rm) {
    this.model = rm;
    this.modelName = this.model.name;
    RelayElm.lastModelName = this.modelName;
    this.ind.setup(this.inductance(), this.coilCurrent, Inductor.FLAG_BACK_EULER);
    this.setPoints();
  }
  setupPoles() {
    this.nCoil1 = 3 * this.poleCount();
    this.nCoil2 = this.nCoil1 + 1;
    this.nCoil3 = this.nCoil1 + 2;
    if (this.switchCurrent == null || this.switchCurrent.length !== this.poleCount()) {
      this.switchCurrent = new Array(this.poleCount()).fill(0);
      this.switchCurCount = new Array(this.poleCount()).fill(0);
    }
  }
  getDumpType() {
    return 178;
  }
  getXmlDumpType() {
    return "rl";
  }
  dumpXmlModel(doc) {
    if (!(this.model.builtIn || this.model.dumped))
      this.model.dumpXml(doc);
  }
  dumpXml(doc, elem) {
    if (!(this.model.builtIn || this.model.dumped))
      this.model.dumpXml(doc);
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "mo", this.modelName);
  }
  dumpXmlState(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "i", this.coilCurrent);
    CircuitXMLSerializer.dumpAttr(elem, "ip", this.i_position);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    const mo = xml.parseStringAttr("mo", null);
    if (mo != null) {
      this.modelName = mo;
      this.model = RelayModel.getModelWithNameOrCopy(this.modelName, this.model);
      this.modelName = this.model.name;
    } else if (xml.parseStringAttr("ix", null) == null) {
      const poleCount = xml.parseIntAttr("po", 1);
      const defaults = new RelayModel();
      const inductance = xml.parseDoubleAttr("in", defaults.inductance);
      const r_on = xml.parseDoubleAttr("ron", defaults.r_on);
      const r_off = xml.parseDoubleAttr("roff", defaults.r_off);
      const onCurrent = xml.parseDoubleAttr("on", defaults.onCurrent);
      const coilR = xml.parseDoubleAttr("coR", defaults.coilR);
      const offCurrent = xml.parseDoubleAttr("of", defaults.offCurrent);
      const switchingTime = xml.parseDoubleAttr("sw", defaults.switchingTime);
      const coilStyle = this.coilStyleFromFlags(this.flags);
      const showBox = (this.flags & this.FLAG_SHOW_BOX) !== 0;
      const pulldown = (this.flags & this.FLAG_PULLDOWN) !== 0;
      this.model = RelayModel.getModelWithParameters(
        inductance,
        r_on,
        r_off,
        onCurrent,
        offCurrent,
        coilR,
        switchingTime,
        coilStyle,
        showBox,
        pulldown,
        poleCount
      );
      this.modelName = this.model.name;
    }
    this.coilCurrent = xml.parseDoubleAttr("i", this.coilCurrent);
    this.d_position = this.i_position = xml.parseIntAttr("ip", this.i_position);
    this.postUndump();
  }
  draw(g) {
    for (let i = 0; i !== 2; i++) {
      this.setVoltageColor(g, this.nodes[this.nCoil1 + i].v);
      CircuitElm.drawThickLine(g, this.coilLeads[i], this.coilPosts[i]);
    }
    const x = this.model.coilStyle === 2 ? 1 : 0;
    this.setPowerColor(g, this.coilCurrent * (this.nodes[this.nCoil1].v - this.nodes[this.nCoil2].v));
    this.drawCoil(
      g,
      this.dflip * 6,
      this.coilLeads[x],
      this.coilLeads[1 - x],
      this.nodes[this.nCoil1 + x].v,
      this.nodes[this.nCoil2 - x].v
    );
    if (this.model.showBox) {
      g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
      CircuitElm.drawThickLine(g, this.outline[0], this.outline[1]);
      CircuitElm.drawThickLine(g, this.outline[1], this.outline[2]);
      CircuitElm.drawThickLine(g, this.outline[2], this.outline[3]);
      CircuitElm.drawThickLine(g, this.outline[3], this.outline[0]);
    }
    g.setColor(Color.darkGray);
    for (let i = 0; i !== this.poleCount(); i++) {
      if (i === 0) {
        const off = this.model.coilStyle === 0 ? 4 : 0;
        this.interpPoint(
          this.point1,
          this.point2,
          this.lines[i * 2],
          0.5,
          this.openhs * 2 + 5 * this.dflip - i * this.openhs * 3 + off
        );
      } else
        this.interpPoint(
          this.point1,
          this.point2,
          this.lines[i * 2],
          0.5,
          Math.trunc(this.openhs * (-i * 3 + 3 - 0.5 + this.d_position)) + 5 * this.dflip
        );
      this.interpPoint(
        this.point1,
        this.point2,
        this.lines[i * 2 + 1],
        0.5,
        Math.trunc(this.openhs * (-i * 3 - 0.5 + this.d_position)) - 5 * this.dflip
      );
      g.setLineDash(4, 4);
      g.drawLine(this.lines[i * 2].x, this.lines[i * 2].y, this.lines[i * 2 + 1].x, this.lines[i * 2 + 1].y);
      g.setLineDash(0, 0);
    }
    for (let p = 0; p !== this.poleCount(); p++) {
      const po = p * 3;
      for (let i = 0; i !== 3; i++) {
        this.setVoltageColor(g, this.nodes[this.nSwitch0 + po + i].v);
        CircuitElm.drawThickLine(g, this.swposts[p][i], this.swpoles[p][i]);
      }
      this.interpPoint(this.swpoles[p][1], this.swpoles[p][2], this.ptSwitch[p], this.d_position);
      g.setColor(Color.lightGray);
      CircuitElm.drawThickLine(g, this.swpoles[p][0], this.ptSwitch[p]);
      this.switchCurCount[p] = this.updateDotCountImpl(this.switchCurrent[p], this.switchCurCount[p]);
      this.drawDots(g, this.swposts[p][0], this.swpoles[p][0], this.switchCurCount[p]);
      if (this.i_position !== 2)
        this.drawDots(
          g,
          this.swpoles[p][this.i_position + 1],
          this.swposts[p][this.i_position + 1],
          this.switchCurCount[p]
        );
    }
    this.coilCurCount = this.updateDotCountImpl(this.coilCurrent, this.coilCurCount);
    if (this.coilCurCount !== 0) {
      this.drawDots(g, this.coilPosts[0], this.coilLeads[0], this.coilCurCount);
      this.drawDots(g, this.coilLeads[0], this.coilLeads[1], this.addCurCount(this.coilCurCount, this.currentOffset1));
      this.drawDots(g, this.coilLeads[1], this.coilPosts[1], this.addCurCount(this.coilCurCount, this.currentOffset2));
    }
    this.drawPosts(g);
    this.setBbox(this.outline[0], this.outline[2], 0);
    this.adjustBbox(this.coilPosts[0], this.coilPosts[1]);
    this.adjustBbox(this.swposts[0][0], this.swposts[0][1]);
  }
  getCurrentIntoNode(n) {
    if (n < 3 * this.poleCount()) {
      const p = Math.trunc(n / 3);
      const k = n % 3;
      if (k === 0)
        return -this.switchCurrent[p];
      if (k === 1 + this.i_position)
        return this.switchCurrent[p];
      return 0;
    }
    if (n === 3 * this.poleCount())
      return -this.coilCurrent;
    return this.coilCurrent;
  }
  setPoints() {
    super.setPoints();
    this.setupPoles();
    this.allocNodes();
    this.dflip = this.hasFlag(this.FLAG_FLIP) ? -this.dsign : this.dsign;
    this.openhs = -this.dflip * 16;
    this.calcLeads(32);
    this.swposts = [];
    this.swpoles = [];
    for (let i = 0; i !== this.poleCount(); i++) {
      this.swposts[i] = [new Point(), new Point(), new Point()];
      this.swpoles[i] = [new Point(), new Point(), new Point()];
      this.interpPoint(this.lead1, this.lead2, this.swpoles[i][0], 0, -this.openhs * 3 * i);
      this.interpPoint(this.lead1, this.lead2, this.swpoles[i][1], 1, -this.openhs * 3 * i - this.openhs);
      this.interpPoint(this.lead1, this.lead2, this.swpoles[i][2], 1, -this.openhs * 3 * i + this.openhs);
      this.interpPoint(this.point1, this.point2, this.swposts[i][0], 0, -this.openhs * 3 * i);
      this.interpPoint(this.point1, this.point2, this.swposts[i][1], 1, -this.openhs * 3 * i - this.openhs);
      this.interpPoint(this.point1, this.point2, this.swposts[i][2], 1, -this.openhs * 3 * i + this.openhs);
    }
    this.coilPosts = this.newPointArray(2);
    this.coilLeads = this.newPointArray(2);
    this.ptSwitch = this.newPointArray(this.poleCount());
    const x = this.model.coilStyle === 2 ? 1 : 0;
    let boxSize;
    if (this.model.coilStyle !== 0) {
      this.interpPoint(this.point1, this.point2, this.coilPosts[0], x, this.openhs * 2);
      this.interpPoint(this.point1, this.point2, this.coilPosts[1], x, this.openhs * 3);
      this.interpPoint(this.point1, this.point2, this.coilLeads[0], 0.5, this.openhs * 2);
      this.interpPoint(this.point1, this.point2, this.coilLeads[1], 0.5, this.openhs * 3);
      boxSize = 56;
    } else {
      this.interpPoint(this.point1, this.point2, this.coilPosts[0], 0, this.openhs * 2);
      this.interpPoint(this.point1, this.point2, this.coilPosts[1], 1, this.openhs * 2);
      this.interpPoint(this.point1, this.point2, this.coilLeads[0], 0.5 - 16 / this.dn, this.openhs * 2);
      this.interpPoint(this.point1, this.point2, this.coilLeads[1], 0.5 + 16 / this.dn, this.openhs * 2);
      boxSize = 40;
    }
    this.lines = this.newPointArray(this.poleCount() * 2);
    const boxWScale = Math.min(0.4, 25 / this.dn);
    this.interpPoint(this.point1, this.point2, this.outline[0], 0.5 - boxWScale, -boxSize * this.dflip);
    this.interpPoint(this.point1, this.point2, this.outline[1], 0.5 + boxWScale, -boxSize * this.dflip);
    this.interpPoint(this.point1, this.point2, this.outline[2], 0.5 + boxWScale, -(this.openhs * 3 * this.poleCount()) - 24 * this.dflip);
    this.interpPoint(this.point1, this.point2, this.outline[3], 0.5 - boxWScale, -(this.openhs * 3 * this.poleCount()) - 24 * this.dflip);
    this.currentOffset1 = CircuitElm.distance(this.coilPosts[0], this.coilLeads[0]);
    this.currentOffset2 = this.currentOffset1 + CircuitElm.distance(this.coilLeads[0], this.coilLeads[1]);
  }
  getPost(n) {
    if (n < 3 * this.poleCount()) {
      const p = Math.trunc(n / 3);
      if (this.swposts[p] == null) {
        CirSim.console("relay " + this.modelName + ": poleCount grew after layout, rebuilding");
        this.setPoints();
      }
      return this.swposts[p][n % 3];
    }
    return this.coilPosts[n - 3 * this.poleCount()];
  }
  getPostCount() {
    return 2 + this.poleCount() * 3;
  }
  getInternalNodeCount() {
    return 1;
  }
  reset() {
    super.reset();
    this.ind.reset();
    this.coilCurrent = this.coilCurCount = 0;
    for (let i = 0; i !== this.poleCount(); i++)
      this.switchCurrent[i] = this.switchCurCount[i] = 0;
    this.d_position = this.i_position = 0;
  }
  stamp() {
    this.ind.stamp(this.nodes[this.nCoil1], this.nodes[this.nCoil3]);
    CircuitElm.sim.stampResistor(this.nodes[this.nCoil3], this.nodes[this.nCoil2], this.coilR());
    for (let i = 0; i !== this.poleCount() * 3; i++)
      CircuitElm.sim.stampNonLinear(this.nodes[this.nSwitch0 + i]);
    if (this.needsPulldown()) {
      for (let i = 0; i < this.poleCount(); i++) {
        CircuitElm.sim.stampResistor(this.nodes[this.nSwitch1 + i * 3], CircuitNode.ground, this.r_off());
        CircuitElm.sim.stampResistor(this.nodes[this.nSwitch2 + i * 3], CircuitNode.ground, this.r_off());
      }
    }
  }
  startIteration() {
    if (this.switchingTime() === 0) {
      this.startIterationOld();
      return;
    }
    this.ind.startIteration(this.nodes[this.nCoil1].v - this.nodes[this.nCoil3].v);
    const absCurrent = Math.abs(this.coilCurrent);
    if (this.onState) {
      if (absCurrent < this.offCurrent()) {
        this.onState = false;
        this.i_position = 2;
      } else {
        this.d_position += CircuitElm.sim.timeStep / this.switchingTime();
        if (this.d_position >= 1)
          this.d_position = this.i_position = 1;
      }
    } else {
      if (absCurrent > this.onCurrent()) {
        this.onState = true;
        this.i_position = 2;
      } else {
        this.d_position -= CircuitElm.sim.timeStep / this.switchingTime();
        if (this.d_position <= 0)
          this.d_position = this.i_position = 0;
      }
    }
  }
  startIterationOld() {
    this.ind.startIteration(this.nodes[this.nCoil1].v - this.nodes[this.nCoil3].v);
    const magic = 1.3;
    const pmult = Math.sqrt(magic + 1);
    const c = this.onCurrent();
    const p = this.coilCurrent * pmult / c;
    this.d_position = Math.abs(p * p) - 1.3;
    if (this.d_position < 0)
      this.d_position = 0;
    if (this.d_position > 1)
      this.d_position = 1;
    if (this.d_position < 0.1)
      this.i_position = 0;
    else if (this.d_position > 0.9)
      this.i_position = 1;
    else
      this.i_position = 2;
  }
  // we need this to be able to change the matrix for each step
  nonLinear() {
    return true;
  }
  doStep() {
    const voltdiff = this.nodes[this.nCoil1].v - this.nodes[this.nCoil3].v;
    this.ind.doStep(voltdiff);
    for (let p = 0; p !== this.poleCount() * 3; p += 3) {
      if (this.i_position === 0) {
        CircuitElm.sim.stampResistor(this.nodes[this.nSwitch0 + p], this.nodes[this.nSwitch1 + p], this.r_on());
        if (!this.needsPulldown())
          CircuitElm.sim.stampResistor(this.nodes[this.nSwitch0 + p], this.nodes[this.nSwitch2 + p], this.r_off());
      } else if (this.i_position === 1) {
        CircuitElm.sim.stampResistor(this.nodes[this.nSwitch0 + p], this.nodes[this.nSwitch2 + p], this.r_on());
        if (!this.needsPulldown())
          CircuitElm.sim.stampResistor(this.nodes[this.nSwitch0 + p], this.nodes[this.nSwitch1 + p], this.r_off());
      } else {
        CircuitElm.sim.stampResistor(this.nodes[this.nSwitch0 + p], this.nodes[this.nSwitch1 + p], this.r_off());
        CircuitElm.sim.stampResistor(this.nodes[this.nSwitch0 + p], this.nodes[this.nSwitch2 + p], this.r_off());
      }
    }
  }
  calculateCurrent() {
    const voltdiff = this.nodes[this.nCoil1].v - this.nodes[this.nCoil3].v;
    this.coilCurrent = this.ind.calculateCurrent(voltdiff);
    for (let p = 0; p !== this.poleCount(); p++) {
      if (this.i_position === 2)
        this.switchCurrent[p] = 0;
      else
        this.switchCurrent[p] = (this.nodes[this.nSwitch0 + p * 3].v - this.nodes[this.nSwitch1 + p * 3 + this.i_position].v) / this.r_on();
    }
  }
  getElmType() {
    return "relay";
  }
  getInfo(arr) {
    arr[0] = Locale.LS("relay");
    arr[0] += " (" + (this.switchingTime() === 0 ? "old model" : this.modelName) + ")";
    arr[1] = this.i_position === 0 ? Locale.LS("off") : Locale.LS("on");
    let ln = 2;
    for (let i = 0; i !== this.poleCount(); i++)
      arr[ln++] = "I" + (i + 1) + " = " + CircuitElm.getCurrentDText(this.switchCurrent[i]);
    arr[ln++] = Locale.LS("coil I") + " = " + CircuitElm.getCurrentDText(this.coilCurrent);
    arr[ln++] = Locale.LS("coil Vd") + " = " + CircuitElm.getVoltageDText(this.nodes[this.nCoil1].v - this.nodes[this.nCoil2].v);
  }
  models;
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Model", 0, -1, -1);
      this.models = RelayModel.getModelList();
      ei.choice = new Choice();
      for (let i = 0; i !== this.models.length; i++) {
        const rm = this.models[i];
        ei.choice.add(rm.getDescription());
        if (rm === this.model)
          ei.choice.select(i);
      }
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Create New Model") };
      return ei;
    }
    if (n === 2) {
      if (this.model.readOnly)
        return null;
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Edit Model") };
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.model = this.models[ei.choice.getSelectedIndex()];
      this.modelName = this.model.name;
      RelayElm.lastModelName = this.modelName;
      this.ind.setup(this.inductance(), this.coilCurrent, Inductor.FLAG_BACK_EULER);
      this.setPoints();
      ei.newDialog = true;
      return;
    }
    if (n === 1) {
      const newModel = new RelayModel(this.model);
      const editDialog = new EditRelayModelDialog(newModel, CirSim.theApp, this);
      CirSim.relayModelEditDialog = editDialog;
      editDialog.show();
      return;
    }
    if (n === 2) {
      if (!this.model.readOnly) {
        const editDialog = new EditRelayModelDialog(this.model, CirSim.theApp, null);
        CirSim.relayModelEditDialog = editDialog;
        editDialog.show();
      }
      return;
    }
  }
  getConnection(n1, n2) {
    if (Math.trunc(n1 / 3) !== Math.trunc(n2 / 3))
      return false;
    return true;
  }
  hasGroundConnection(n) {
    return this.needsPulldown() && n < this.nCoil1;
  }
  getShortcut() {
    return "R".charCodeAt(0);
  }
  flipX(c2, count) {
    if (this.dx === 0)
      this.flags ^= this.FLAG_FLIP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    if (this.dy === 0)
      this.flags ^= this.FLAG_FLIP;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    this.flags ^= this.FLAG_FLIP;
    super.flipXY(xmy, count);
  }
}

class RingCounterElm extends ChipElm {
  static FLAG_CLOCK_INHIBIT = 2;
  static FLAG_RESET_HIGH = 4;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.flags |= RingCounterElm.FLAG_CLOCK_INHIBIT;
      this.setupPins();
    } else {
      super(xa, ya, xb, yb, f, st);
    }
  }
  getChipName() {
    return "ring counter";
  }
  needsBits() {
    return true;
  }
  defaultBitCount() {
    return 10;
  }
  hasClockInhibit() {
    return (this.flags & RingCounterElm.FLAG_CLOCK_INHIBIT) !== 0 && this.bits >= 3;
  }
  hasInvertReset() {
    return (this.flags & RingCounterElm.FLAG_RESET_HIGH) === 0;
  }
  setupPins() {
    if (!this.bits)
      return;
    this.sizeX = this.bits > 2 ? this.bits : 2;
    this.sizeY = 2;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 1, ChipElm.SIDE_W, "");
    this.pins[0].clock = true;
    this.pins[1] = new Pin(this, this.sizeX - 1, ChipElm.SIDE_S, "R");
    this.pins[1].lineOver = this.hasInvertReset();
    for (let i = 0; i !== this.bits; i++) {
      const ii = i + 2;
      this.pins[ii] = new Pin(this, i, ChipElm.SIDE_N, "Q" + i);
      this.pins[ii].output = this.pins[ii].state = true;
    }
    if (this.hasClockInhibit()) {
      this.clockInhibit = this.pins.length - 1;
      this.pins[this.clockInhibit] = new Pin(this, 1, ChipElm.SIDE_S, "CE");
      this.pins[this.clockInhibit].lineOver = true;
    } else
      this.clockInhibit = -1;
    this.allocNodes();
  }
  getPostCount() {
    return this.hasClockInhibit() ? this.bits + 3 : this.bits + 2;
  }
  getVoltageSourceCount() {
    return this.bits;
  }
  execute() {
    let i;
    let running = true;
    if (this.hasClockInhibit() && this.pins[this.clockInhibit].value)
      running = false;
    for (i = 0; i !== this.bits; i++)
      if (this.pins[i + 2].value)
        break;
    if (this.pins[0].value && !this.lastClock && running) {
      if (i < this.bits)
        this.pins[i++ + 2].value = false;
      i %= this.bits;
      this.pins[i + 2].value = true;
    }
    if (this.pins[1].value !== this.hasInvertReset() || i === this.bits) {
      for (i = 1; i !== this.bits; i++)
        this.pins[i + 2].value = false;
      this.pins[2].value = true;
    }
    this.lastClock = this.pins[0].value;
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Invert reset pin", this.hasInvertReset());
      return ei;
    }
    if (n === 1)
      return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.checkbox.getState())
        this.flags &= ~RingCounterElm.FLAG_RESET_HIGH;
      else
        this.flags |= RingCounterElm.FLAG_RESET_HIGH;
      this.setupPins();
      this.setPoints();
      return;
    }
    if (n === 1) {
      if (ei.value >= 2) {
        this.bits = Math.trunc(ei.value);
        this.setupPins();
        this.setPoints();
      } else
        ei.setError("must be >= 2");
    }
  }
  getDumpType() {
    return 163;
  }
}

class SCRElm extends CircuitElm {
  anode = 0;
  cnode = 1;
  gnode = 2;
  inode = 3;
  FLAG_GATE_FIX = 1;
  diode;
  dir;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    this.setDefaults();
    if (st !== void 0) {
      try {
        this.lastvac = parseFloatStrict(st.nextToken());
        this.lastvag = parseFloatStrict(st.nextToken());
        this.triggerI = parseFloatStrict(st.nextToken());
        this.holdingI = parseFloatStrict(st.nextToken());
        this.gresistance = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
    } else {
      this.flags |= this.FLAG_GATE_FIX;
    }
    this.setup();
  }
  setDefaults() {
    this.gresistance = 50;
    this.holdingI = 82e-4;
    this.triggerI = 0.01;
  }
  setup() {
    this.diode = new Diode(CircuitElm.sim);
    this.diode.setupForDefaultModel();
    this.aresistance = 1;
  }
  nonLinear() {
    return true;
  }
  reset() {
    this.nodes[this.anode].v = this.nodes[this.cnode].v = this.nodes[this.gnode].v = 0;
    this.diode.reset();
    this.lastvag = this.lastvac = this.curcount_a = this.curcount_c = this.curcount_g = 0;
  }
  getDumpType() {
    return 177;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "tr", this.triggerI);
    CircuitXMLSerializer.dumpAttr(elem, "ho", this.holdingI);
    CircuitXMLSerializer.dumpAttr(elem, "gr", this.gresistance);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.triggerI = xml.parseDoubleAttr("tr", this.triggerI);
    this.holdingI = xml.parseDoubleAttr("ho", this.holdingI);
    this.gresistance = xml.parseDoubleAttr("gr", this.gresistance);
    this.setup();
  }
  ia = 0;
  ic = 0;
  ig = 0;
  curcount_a = 0;
  curcount_c = 0;
  curcount_g = 0;
  lastvac = 0;
  lastvag = 0;
  gresistance;
  triggerI;
  holdingI;
  hs = 8;
  poly;
  cathode;
  gate;
  applyGateFix() {
    return (this.flags & this.FLAG_GATE_FIX) !== 0;
  }
  setPoints() {
    super.setPoints();
    this.dir = 0;
    if (Math.abs(this.dx) > Math.abs(this.dy)) {
      this.dir = -CircuitElm.sign(this.dx) * CircuitElm.sign(this.dy);
      if (this.applyGateFix())
        this.dn = Math.abs(this.dx);
      this.point2.y = this.point1.y;
    } else {
      this.dir = CircuitElm.sign(this.dy) * CircuitElm.sign(this.dx);
      if (this.applyGateFix())
        this.dn = Math.abs(this.dy);
      this.point2.x = this.point1.x;
    }
    if (this.dir === 0)
      this.dir = 1;
    this.calcLeads(16);
    this.cathode = this.newPointArray(2);
    const pa = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, pa[0], pa[1], 0, this.hs);
    this.interpPoint2(this.lead1, this.lead2, this.cathode[0], this.cathode[1], 1, this.hs);
    this.poly = this.createPolygon(pa[0], pa[1], this.lead2);
    this.gate = this.newPointArray(2);
    const leadlen = (this.dn - 16) / 2;
    let gatelen = CircuitElm.app.gridSize;
    gatelen += leadlen % CircuitElm.app.gridSize;
    if (leadlen < gatelen) {
      this.x2 = this.x;
      this.y2 = this.y;
      return;
    }
    this.interpPoint(this.lead2, this.point2, this.gate[0], gatelen / leadlen, gatelen * this.dir);
    this.interpPoint(this.lead2, this.point2, this.gate[1], gatelen / leadlen, CircuitElm.app.gridSize * 2 * this.dir);
    this.gate[1].x = this.snapGrid(this.gate[1].x);
    this.gate[1].y = this.snapGrid(this.gate[1].y);
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.hs);
    this.adjustBbox(this.gate[0], this.gate[1]);
    const v1 = this.nodes[this.anode].v;
    const v2 = this.nodes[this.cnode].v;
    this.draw2Leads(g);
    this.setVoltageColor(g, v1);
    this.setPowerColor(g, true);
    g.fillPolygon(this.poly);
    this.setVoltageColor(g, this.nodes[this.gnode].v);
    CircuitElm.drawThickLine(g, this.lead2, this.gate[0]);
    CircuitElm.drawThickLine(g, this.gate[0], this.gate[1]);
    this.setVoltageColor(g, v2);
    this.setPowerColor(g, true);
    CircuitElm.drawThickLine(g, this.cathode[0], this.cathode[1]);
    this.curcount_a = this.updateDotCountImpl(this.ia, this.curcount_a);
    this.curcount_c = this.updateDotCountImpl(this.ic, this.curcount_c);
    this.curcount_g = this.updateDotCountImpl(this.ig, this.curcount_g);
    if (!this.isCreating()) {
      this.drawDots(g, this.point1, this.lead2, this.curcount_a);
      this.drawDots(g, this.point2, this.lead2, this.curcount_c);
      this.drawDots(g, this.gate[1], this.gate[0], this.curcount_g);
      this.drawDots(g, this.gate[0], this.lead2, this.curcount_g + CircuitElm.distance(this.gate[1], this.gate[0]));
    }
    if ((this.needsHighlight() || this.isCreating()) && this.point1.x === this.point2.x && this.point2.y > this.point1.y) {
      g.setColor(CircuitElm.whiteColor);
      const ds = CircuitElm.sign(this.dx);
      g.drawString("C", this.lead2.x + (ds < 0 ? 5 : -15), this.lead2.y + 12);
      g.drawString("A", this.lead1.x + 5, this.lead1.y - 4);
      g.drawString("G", this.gate[0].x, this.gate[0].y + 12);
    }
    this.drawPosts(g);
  }
  getCurrentIntoNode(n) {
    if (n === this.anode)
      return -this.ia;
    if (n === this.cnode)
      return -this.ic;
    return -this.ig;
  }
  getPost(n) {
    return n === 0 ? this.point1 : n === 1 ? this.point2 : this.gate[1];
  }
  getPostCount() {
    return 3;
  }
  getInternalNodeCount() {
    return 1;
  }
  getPower() {
    return (this.nodes[this.anode].v - this.nodes[this.gnode].v) * this.ia + (this.nodes[this.cnode].v - this.nodes[this.gnode].v) * this.ic;
  }
  aresistance;
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[this.anode]);
    CircuitElm.sim.stampNonLinear(this.nodes[this.cnode]);
    CircuitElm.sim.stampNonLinear(this.nodes[this.gnode]);
    CircuitElm.sim.stampNonLinear(this.nodes[this.inode]);
    CircuitElm.sim.stampResistor(this.nodes[this.gnode], this.nodes[this.cnode], this.gresistance);
    this.diode.stamp(this.nodes[this.inode], this.nodes[this.cnode]);
  }
  doStep() {
    const vac = this.nodes[this.anode].v - this.nodes[this.cnode].v;
    const vag = this.nodes[this.anode].v - this.nodes[this.gnode].v;
    if (Math.abs(vac - this.lastvac) > 0.01 || Math.abs(vag - this.lastvag) > 0.01)
      CircuitElm.sim.converged = false;
    this.lastvac = vac;
    this.lastvag = vag;
    this.diode.doStep(this.nodes[this.inode].v - this.nodes[this.cnode].v);
    const icmult = 1 / this.triggerI;
    const iamult = 1 / this.holdingI - icmult;
    this.aresistance = -icmult * this.ic + this.ia * iamult > 1 ? 0.0105 : 1e6;
    CircuitElm.sim.stampResistor(this.nodes[this.anode], this.nodes[this.inode], this.aresistance);
  }
  getInfo(arr) {
    arr[0] = "SCR";
    const vac = this.nodes[this.anode].v - this.nodes[this.cnode].v;
    const vag = this.nodes[this.anode].v - this.nodes[this.gnode].v;
    const vgc = this.nodes[this.gnode].v - this.nodes[this.cnode].v;
    arr[1] = "Ia = " + CircuitElm.getCurrentText(this.ia);
    arr[2] = "Ig = " + CircuitElm.getCurrentText(this.ig);
    arr[3] = "Vac = " + CircuitElm.getVoltageText(vac);
    arr[4] = "Vag = " + CircuitElm.getVoltageText(vag);
    arr[5] = "Vgc = " + CircuitElm.getVoltageText(vgc);
    arr[6] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  calculateCurrent() {
    this.ig = (this.nodes[this.gnode].v - this.nodes[this.cnode].v) / this.gresistance;
    this.ia = (this.nodes[this.anode].v - this.nodes[this.inode].v) / this.aresistance;
    this.ic = -this.ig - this.ia;
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Trigger Current (A)", this.triggerI, 0, 0).setPositive();
    if (n === 1)
      return new EditInfo("Holding Current (A)", this.holdingI, 0, 0).setPositive();
    if (n === 2)
      return new EditInfo("Gate Resistance (ohms)", this.gresistance, 0, 0).setPositive();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.triggerI = ei.value;
    if (n === 1)
      this.holdingI = ei.value;
    if (n === 2)
      this.gresistance = ei.value;
  }
  // if point1 and point2 are in line, then we don't know which way the gate
  // is pointed and flip won't work.  fix this
  fixEnds() {
    const pt = new Point();
    this.interpPoint(this.point1, this.point2, pt, 1, CircuitElm.app.gridSize * this.dir);
    this.x2 = pt.x;
    this.y2 = pt.y;
  }
  flipX(c2, count) {
    this.fixEnds();
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    this.fixEnds();
    super.flipY(c2, count);
  }
  flipXY(c2, count) {
    this.fixEnds();
    super.flipXY(c2, count);
  }
}

class SchmittElm extends InvertingSchmittElm {
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
    }
  }
  getDumpType() {
    return 182;
  }
  lastOutputVoltage = 0;
  startIteration() {
    this.lastOutputVoltage = this.nodes[1].v;
  }
  doStep() {
    let out;
    if (this.state) {
      if (this.nodes[0].v > this.upperTrigger) {
        this.state = false;
        out = this.logicOnLevel;
      } else {
        out = this.logicOffLevel;
      }
    } else {
      if (this.nodes[0].v < this.lowerTrigger) {
        this.state = true;
        out = this.logicOffLevel;
      } else {
        out = this.logicOnLevel;
      }
    }
    const maxStep = this.slewRate * CircuitElm.sim.timeStep * 1e9;
    out = Math.max(Math.min(this.lastOutputVoltage + maxStep, out), this.lastOutputVoltage - maxStep);
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[1], this.voltSource, out);
  }
  draw(g) {
    this.drawPosts(g);
    this.draw2Leads(g);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    CircuitElm.drawThickPolygon(g, this.gatePoly);
    g.setLineWidth(2);
    CircuitElm.drawPolygon(g, this.symbolPoly);
    g.setLineWidth(1);
    this.curcount = this.updateDotCountImpl(this.current, this.curcount);
    this.drawDots(g, this.lead2, this.point2, this.curcount);
  }
  setPoints() {
    super.setPoints();
    const hs = 16;
    let ww = 16;
    if (ww > this.dn / 2)
      ww = Math.floor(this.dn / 2);
    this.lead1 = this.interpPoint(this.point1, this.point2, 0.5 - ww / this.dn);
    this.lead2 = this.interpPoint(this.point1, this.point2, 0.5 + (ww - 3) / this.dn);
    const triPoints = this.newPointArray(3);
    this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[1], 0, hs);
    triPoints[2] = this.interpPoint(this.point1, this.point2, 0.5 + (ww - 5) / this.dn);
    this.gatePoly = this.createPolygon(triPoints);
  }
  getInfo(arr) {
    arr[0] = "Schmitt Trigger~";
  }
  getCurrentIntoNode(n) {
    if (n === 1)
      return this.current;
    return 0;
  }
}

class SeqGenElm extends ChipElm {
  static FLAG_NEW_VERSION = 2;
  static FLAG_PLAY_ONCE = 4;
  static FLAG_HAS_RESET = 8;
  bitPosition = 0;
  bitCount = 0;
  data = new Int32Array(1);
  clockstate = false;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f, st);
    if (st !== void 0) {
      try {
        if ((this.flags & SeqGenElm.FLAG_NEW_VERSION) === 0) {
          this.flags |= SeqGenElm.FLAG_NEW_VERSION;
          let oldData = parseIntStrict(st.nextToken());
          let newData = 0;
          for (let i = 0; i < 32; i++) {
            if (~(2147483647 - 1) >> i !== 0 && oldData & 1 << i)
              newData |= 1 << i;
          }
          this.bitCount = 8;
          this.data = new Int32Array([newData]);
        } else {
          this.bitCount = parseIntStrict(st.nextToken());
          const wordCount = Math.trunc(this.bitCount / 32) + (this.bitCount % 32 !== 0 ? 1 : 0);
          this.data = new Int32Array(wordCount);
          for (let i = 0; i < wordCount; i++)
            this.data[i] = parseIntStrict(st.nextToken());
        }
      } catch (e) {
      }
      if (this.bitCount > this.data.length * 32)
        this.bitCount = this.data.length * 32;
    } else {
      this.bitCount = 8;
      this.data = new Int32Array([0]);
      this.flags |= SeqGenElm.FLAG_NEW_VERSION;
      this.flags |= SeqGenElm.FLAG_HAS_RESET;
      this.setupPins();
      this.allocNodes();
    }
  }
  getChipName() {
    return "sequence generator";
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = 2;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "");
    this.pins[0].clock = true;
    this.pins[1] = new Pin(this, 1, ChipElm.SIDE_E, "Q");
    this.pins[1].output = true;
    if (this.hasReset())
      this.pins[2] = new Pin(this, 1, ChipElm.SIDE_W, "R");
  }
  getVoltageDiff() {
    return this.nodes[1].v;
  }
  getPostCount() {
    return this.hasReset() ? 3 : 2;
  }
  getVoltageSourceCount() {
    return 1;
  }
  hasPlayOnce() {
    return (this.flags & SeqGenElm.FLAG_PLAY_ONCE) !== 0;
  }
  hasReset() {
    return (this.flags & SeqGenElm.FLAG_HAS_RESET) !== 0;
  }
  reset() {
    super.reset();
    this.bitPosition = 0;
  }
  nextBit() {
    if (this.data.length > 0 && this.bitCount > 0) {
      if (this.bitPosition >= this.bitCount) {
        if (this.hasPlayOnce()) {
          this.pins[1].value = false;
          return;
        }
        this.bitPosition = 0;
      }
      this.pins[1].value = (this.data[Math.trunc(this.bitPosition / 32)] & 1 << this.bitPosition % 32) !== 0;
      this.bitPosition++;
    } else {
      this.pins[1].value = false;
    }
  }
  execute() {
    if (this.hasReset() && this.pins[2].value) {
      this.bitPosition = 0;
      this.clockstate = this.pins[0].value;
      this.nextBit();
    } else {
      if (this.pins[0].value !== this.clockstate) {
        this.clockstate = this.pins[0].value;
        if (this.clockstate)
          this.nextBit();
      }
    }
  }
  getDumpType() {
    return 188;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "bc", this.bitCount);
    let s = "";
    for (let i = 0; i < this.data.length; i++) {
      if (i > 0) s += " ";
      s += this.data[i];
    }
    CircuitXMLSerializer.dumpAttr(elem, "dt", s);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.bitCount = xml.parseIntAttr("bc", this.bitCount);
    const dt = xml.parseStringAttr("dt", null);
    if (dt !== null) {
      const st = new StringTokenizer(dt, " ");
      const words = [];
      while (st.hasMoreTokens()) words.push(parseIntStrict(st.nextToken()));
      this.data = new Int32Array(words);
    }
    if (this.bitCount > this.data.length * 32)
      this.bitCount = this.data.length * 32;
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Play Once", this.hasPlayOnce());
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("Sequence", 0, -1, -1);
      let sb = "";
      for (let i = 0; i < this.bitCount; i++)
        sb += (this.data[Math.trunc(i / 32)] & 1 << i % 32) !== 0 ? "1" : "0";
      ei.textArea = { value: sb };
      return ei;
    }
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      this.flags = ei.changeFlag(this.flags, SeqGenElm.FLAG_PLAY_ONCE);
      return;
    }
    if (n === 1) {
      const s = ei.textArea.element ? ei.textArea.element.value : ei.textArea.value;
      this.bitCount = 0;
      for (let i = 0; i < s.length; i++)
        if (s[i] === "0" || s[i] === "1") this.bitCount++;
      const wordCount = Math.max(1, Math.ceil(this.bitCount / 32));
      this.data = new Int32Array(wordCount);
      this.bitCount = 0;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === "0" || c === "1") {
          if (c === "1")
            this.data[Math.trunc(this.bitCount / 32)] |= 1 << this.bitCount % 32;
          this.bitCount++;
        }
      }
    }
  }
}

class SevenSegDecoderElm extends ChipElm {
  static symbols = [
    [true, true, true, true, true, true, false],
    //0
    [false, true, true, false, false, false, false],
    //1
    [true, true, false, true, true, false, true],
    //2
    [true, true, true, true, false, false, true],
    //3
    [false, true, true, false, false, true, true],
    //4
    [true, false, true, true, false, true, true],
    //5
    [true, false, true, true, true, true, true],
    //6
    [true, true, true, false, false, false, false],
    //7
    [true, true, true, true, true, true, true],
    //8
    [true, true, true, true, false, true, true],
    //9
    [true, true, true, false, true, true, true],
    //A
    [false, false, true, true, true, true, true],
    //B
    [true, false, false, true, true, true, false],
    //C
    [false, true, true, true, true, false, true],
    //D
    [true, false, false, true, true, true, true],
    //E
    [true, false, false, false, true, true, true]
    //F
  ];
  // 14-segment encoding: a=top, b=upper-right, c=lower-right, d=bottom, e=lower-left, f=upper-left,
  // g=diag UL-center, h=vert upper, i=diag UR-center, j=horiz right-center,
  // k=diag center-LR, l=vert lower, m=diag center-LL, n=horiz left-center
  static symbols14 = [
    [true, true, true, true, true, true, false, false, true, false, false, false, true, false],
    //0
    [false, true, true, false, false, false, false, false, true, false, false, false, false, false],
    //1
    [true, true, false, true, true, false, false, false, false, true, false, false, false, true],
    //2
    [true, true, true, true, false, false, false, false, false, true, false, false, false, true],
    //3
    [false, true, true, false, false, true, false, false, false, true, false, false, false, true],
    //4
    [true, false, true, true, false, true, false, false, false, true, false, false, false, true],
    //5
    [true, false, true, true, true, true, false, false, false, true, false, false, false, true],
    //6
    [true, false, false, false, false, false, false, false, true, false, false, true, false, false],
    //7
    [true, true, true, true, true, true, false, false, false, true, false, false, false, true],
    //8
    [true, true, true, true, false, true, false, false, false, true, false, false, false, true],
    //9
    [true, true, true, false, true, true, false, false, false, true, false, false, false, true],
    //A
    [true, true, true, true, false, false, false, true, false, true, false, true, false, false],
    //B
    [true, false, false, true, true, true, false, false, false, false, false, false, false, false],
    //C
    [true, true, true, true, false, false, false, true, false, false, false, true, false, false],
    //D
    [true, false, false, true, true, true, false, false, false, true, false, false, false, true],
    //E
    [true, false, false, false, true, true, false, false, false, true, false, false, false, true]
    //F
  ];
  // 16-segment encoding: a=top-left, b=top-right, c=upper-right, d=lower-right,
  // e=bottom-right, f=bottom-left, g=lower-left, h=upper-left,
  // i=diag UL-center, j=vert upper, k=diag UR-center, l=horiz right,
  // m=diag center-LR, n=vert lower, o=diag center-LL, p=horiz left
  static symbols16 = [
    [true, true, true, true, true, true, true, true, false, false, true, false, false, false, true, false],
    //0
    [false, false, true, true, false, false, false, false, false, false, true, false, false, false, false, false],
    //1
    [true, true, true, false, true, true, true, false, false, false, false, true, false, false, false, true],
    //2
    [true, true, true, true, true, true, false, false, false, false, false, true, false, false, false, true],
    //3
    [false, false, true, true, false, false, false, true, false, false, false, true, false, false, false, true],
    //4
    [true, true, false, true, true, true, false, true, false, false, false, true, false, false, false, true],
    //5
    [true, true, false, true, true, true, true, true, false, false, false, true, false, false, false, true],
    //6
    [true, true, false, false, false, false, false, false, false, false, true, false, false, true, false, false],
    //7
    [true, true, true, true, true, true, true, true, false, false, false, true, false, false, false, true],
    //8
    [true, true, true, true, true, true, false, true, false, false, false, true, false, false, false, true],
    //9
    [true, true, true, true, false, false, true, true, false, false, false, true, false, false, false, true],
    //A
    [true, true, true, true, true, true, false, false, false, true, false, true, false, true, false, false],
    //B
    [true, true, false, false, true, true, true, true, false, false, false, false, false, false, false, false],
    //C
    [true, true, true, true, true, true, false, false, false, true, false, false, false, true, false, false],
    //D
    [true, true, false, false, true, true, true, true, false, false, false, true, false, false, false, true],
    //E
    [true, true, false, false, false, false, true, true, false, false, false, true, false, false, false, true]
    //F
  ];
  static FLAG_ENABLE = 1 << 1;
  static FLAG_BLANK_F = 1 << 2;
  static FLAG_148_FONT = 1 << 3;
  segmentType = 0;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb !== void 0) {
      super(xa, ya, xb, yb, f, st);
      try {
        this.segmentType = parseIntStrict(st.nextToken());
        this.setupPins();
        this.setPoints();
      } catch (e) {
      }
    } else {
      super(xa, ya);
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "sgt", this.segmentType);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.segmentType = xml.parseIntAttr("sgt", this.segmentType);
    this.setupPins();
  }
  getSegmentCount() {
    if (this.segmentType === 1) return 14;
    if (this.segmentType === 2) return 16;
    return 7;
  }
  needsBits() {
    return false;
  }
  allowBus() {
    return true;
  }
  getChipName() {
    if (this.getSegmentCount() === 7) return "7-Segment Decoder";
    if (this.getSegmentCount() === 14) return "14-Segment Decoder";
    return "16-Segment Decoder";
  }
  setupPins() {
    const segCount = this.getSegmentCount();
    this.bits = 4;
    this.sizeX = 3;
    const inputPinsY = this.useBus() ? 1 : 4;
    const outputPinsY = this.useBus() ? 1 : segCount;
    this.sizeY = Math.max(outputPinsY, inputPinsY + (this.hasBlank() ? 1 : 0));
    this.pins = new Array(this.getPostCount());
    this.makeBitPins(4, 0, ChipElm.SIDE_W, segCount, "I", false, false, true);
    if (this.useBus()) {
      this.makeBitPins(segCount, 0, ChipElm.SIDE_E, 0, "seg", true, false, false);
    } else {
      for (let i = 0; i < segCount; i++) {
        this.pins[i] = new Pin(this, i, ChipElm.SIDE_E, String.fromCharCode("a".charCodeAt(0) + i));
        this.pins[i].output = true;
      }
    }
    if (this.hasBlank()) {
      this.pins[segCount + 4] = new Pin(this, inputPinsY, ChipElm.SIDE_W, "BI");
      this.pins[segCount + 4].bubble = true;
    }
    this.allocNodes();
  }
  hasBlank() {
    return (this.flags & SevenSegDecoderElm.FLAG_ENABLE) !== 0;
  }
  blankOnF() {
    return (this.flags & SevenSegDecoderElm.FLAG_BLANK_F) !== 0;
  }
  use148Font() {
    return (this.flags & SevenSegDecoderElm.FLAG_148_FONT) !== 0;
  }
  /** 7-segment mode only: by default 6 has a "hat" (top segment) and 9 has its bottom
   * segment filled in, matching the symbols table above. The '148 Font option (named for
   * the 74'148-style font some chips use) drops both, matching older 7-segment decoders. */
  segVal(segCount, sym, digit, seg) {
    if (segCount === 7 && this.use148Font()) {
      if (digit === 6 && seg === 0) return false;
      if (digit === 9 && seg === 3) return false;
    }
    return sym[digit][seg];
  }
  getPostCount() {
    const segCount = this.getSegmentCount();
    return segCount + 4 + (this.hasBlank() ? 1 : 0);
  }
  getVoltageSourceCount() {
    return this.getSegmentCount();
  }
  execute() {
    const segCount = this.getSegmentCount();
    let input = 0;
    if (this.pins[segCount + 0].value) input += 8;
    if (this.pins[segCount + 1].value) input += 4;
    if (this.pins[segCount + 2].value) input += 2;
    if (this.pins[segCount + 3].value) input += 1;
    let en = true;
    if (this.hasBlank() && !this.pins[segCount + 4].value)
      en = false;
    if (!en || input === 15 && this.blankOnF()) {
      for (let i = 0; i !== segCount; i++)
        this.writeOutput(i, false);
    } else {
      const sym = segCount === 14 ? SevenSegDecoderElm.symbols14 : segCount === 16 ? SevenSegDecoderElm.symbols16 : SevenSegDecoderElm.symbols;
      for (let i = 0; i < segCount; i++)
        this.writeOutput(i, this.segVal(segCount, sym, input, i));
    }
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Segments", 0, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("7 Segment");
      ei.choice.add("14 Segment");
      ei.choice.add("16 Segment");
      ei.choice.select(this.segmentType);
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Blank Pin", this.hasBlank());
      return ei;
    }
    if (n === 2) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Blank on 1111", this.blankOnF());
      return ei;
    }
    if (n === 3 && this.getSegmentCount() === 7) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("'148 Font", this.use148Font());
      return ei;
    }
    return super.getChipEditInfo(n);
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      this.segmentType = ei.choice.getSelectedIndex();
      this.setupPins();
      this.setPoints();
      return;
    }
    if (n === 1) {
      this.flags = ei.changeFlag(this.flags, SevenSegDecoderElm.FLAG_ENABLE);
      this.setupPins();
      this.setPoints();
      return;
    }
    if (n === 2)
      this.flags = ei.changeFlag(this.flags, SevenSegDecoderElm.FLAG_BLANK_F);
    if (n === 3)
      this.flags = ei.changeFlag(this.flags, SevenSegDecoderElm.FLAG_148_FONT);
    super.setChipEditValue(n, ei);
  }
  getDumpType() {
    return 197;
  }
}

class SevenSegElm extends ChipElm {
  // base segment count not including decimal point or colon
  baseSegmentCount = 0;
  // segment count including decimal point or colon
  segmentCount = 0;
  extraSegment = 0;
  static ES_NONE = 0;
  static ES_DP = 1;
  static ES_COLON = 2;
  pinCount = 0;
  commonPin = 0;
  // 1 = common cathode, -1 = common anode, 0 = no diodes
  diodeDirection = 0;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.setDefaults();
      this.setPinCount();
    } else {
      super(xa, ya, xb, yb, f, st);
      this.setDefaults();
      try {
        this.baseSegmentCount = parseIntStrict(st.nextToken());
        this.extraSegment = parseIntStrict(st.nextToken());
        this.diodeDirection = parseIntStrict(st.nextToken());
      } catch (e) {
      }
      this.setPinCount();
    }
  }
  setDefaults() {
    this.baseSegmentCount = this.segmentCount = 7;
    this.diodeDirection = 0;
  }
  dump() {
    return super.dump() + " " + this.baseSegmentCount + " " + this.extraSegment + " " + this.diodeDirection;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ba", this.baseSegmentCount);
    CircuitXMLSerializer.dumpAttr(elem, "ex", this.extraSegment);
    CircuitXMLSerializer.dumpAttr(elem, "di", this.diodeDirection);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.baseSegmentCount = xml.parseIntAttr("ba", this.baseSegmentCount);
    this.extraSegment = xml.parseIntAttr("ex", this.extraSegment);
    this.diodeDirection = xml.parseIntAttr("di", this.diodeDirection);
    this.setPinCount();
  }
  allowBus() {
    return this.diodeDirection === 0;
  }
  getChipName() {
    return this.segmentCount + "-segment display";
  }
  darkred;
  lightgray;
  setupPins() {
    if (!this.pinCount)
      return;
    this.darkred = new Color(30, 0, 0);
    this.lightgray = new Color(255 - 10, 255 - 10, 255 - 10);
    this.bits = this.segmentCount;
    if (this.useBus()) {
      this.sizeX = this.baseSegmentCount === 7 ? 4 : 5;
      this.sizeY = this.baseSegmentCount === 7 ? 4 : 6;
      this.pins = new Array(this.pinCount);
      this.makeBitPins(this.segmentCount, 0, ChipElm.SIDE_W, 0, "I", false, false, false);
      if (this.commonPin > 0)
        this.pins[this.commonPin] = new Pin(this, 1, ChipElm.SIDE_W, this.diodeDirection === 1 ? "gnd" : "Vcc");
    } else {
      const segmentPinsOnLeftSide = Math.trunc((this.baseSegmentCount + 1) / 2);
      this.sizeY = segmentPinsOnLeftSide;
      if (this.baseSegmentCount === 7) {
        this.sizeX = 4;
        if (this.pinCount > 7)
          this.sizeX = 5;
      } else
        this.sizeX = 5;
      if (this.pinCount > this.sizeY * 2)
        this.sizeY++;
      this.pins = new Array(this.pinCount);
      let i;
      for (i = 0; i !== segmentPinsOnLeftSide; i++)
        this.pins[i] = new Pin(this, i, ChipElm.SIDE_W, String.fromCharCode("a".charCodeAt(0) + i));
      const backwardCompatibility = this.segmentCount === 7 && this.diodeDirection === 0 && this.extraSegment === SevenSegElm.ES_NONE;
      let s = backwardCompatibility ? 1 : 0;
      for (; i !== this.segmentCount; i++)
        this.pins[i] = new Pin(this, s++, backwardCompatibility ? ChipElm.SIDE_S : ChipElm.SIDE_E, String.fromCharCode("a".charCodeAt(0) + i));
      if (this.extraSegment === SevenSegElm.ES_DP)
        this.pins[this.segmentCount - 1].text = "dp";
      if (this.commonPin > 0) {
        let side = ChipElm.SIDE_E;
        if (this.segmentCount !== 7) {
          side = ChipElm.SIDE_W;
          s = segmentPinsOnLeftSide;
        }
        this.pins[this.commonPin] = new Pin(this, s++, side, this.diodeDirection === 1 ? "gnd" : "Vcc");
      }
    }
  }
  drawSegment(g, p1, p2, thick) {
    g.context.beginPath();
    const p3 = new Point();
    const p4 = new Point();
    const p5 = new Point();
    const p6 = new Point();
    const dn = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    this.interpPoint2(p1, p2, p3, p4, thick / dn, thick);
    this.interpPoint2(p1, p2, p5, p6, 1 - thick / dn, thick);
    g.context.moveTo(p1.x, p1.y);
    g.context.lineTo(p3.x, p3.y);
    g.context.lineTo(p5.x, p5.y);
    g.context.lineTo(p2.x, p2.y);
    g.context.lineTo(p6.x, p6.y);
    g.context.lineTo(p4.x, p4.y);
    g.context.lineTo(p1.x, p1.y);
    g.context.fill();
  }
  drawDecimal(g, x, y, sp) {
    g.context.beginPath();
    g.context.moveTo(x, y - sp);
    g.context.lineTo(x - sp, y);
    g.context.lineTo(x, y + sp);
    g.context.lineTo(x + sp, y);
    g.context.lineTo(x, y - sp);
    g.context.fill();
  }
  static display7 = [
    // x1, y1, x2, y2 for each segment
    0,
    0,
    2,
    0,
    2,
    0,
    2,
    1,
    2,
    1,
    2,
    2,
    0,
    2,
    2,
    2,
    0,
    1,
    0,
    2,
    0,
    0,
    0,
    1,
    0,
    1,
    2,
    1
  ];
  static display16 = [
    0,
    0,
    1,
    0,
    1,
    0,
    2,
    0,
    2,
    0,
    2,
    1,
    2,
    1,
    2,
    2,
    2,
    2,
    1,
    2,
    1,
    2,
    0,
    2,
    0,
    2,
    0,
    1,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    0,
    1,
    1,
    2,
    0,
    1,
    1,
    1,
    1,
    2,
    1,
    1,
    1,
    2,
    2,
    1,
    1,
    1,
    2,
    1,
    1,
    0,
    2,
    0,
    1,
    1,
    1
  ];
  static display14 = [
    0,
    0,
    2,
    0,
    2,
    0,
    2,
    1,
    2,
    1,
    2,
    2,
    2,
    2,
    0,
    2,
    0,
    2,
    0,
    1,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    0,
    1,
    1,
    2,
    0,
    1,
    1,
    1,
    1,
    2,
    1,
    1,
    1,
    2,
    2,
    1,
    1,
    1,
    2,
    1,
    1,
    0,
    2,
    0,
    1,
    1,
    1
  ];
  diodes;
  stamp() {
    super.stamp();
    if (this.diodeDirection === 0)
      return;
    this.diodes = new Array(this.segmentCount);
    const model = DiodeModel.getModelWithName("default-led");
    for (let i = 0; i !== this.segmentCount; i++) {
      this.diodes[i] = new Diode(CircuitElm.sim);
      this.diodes[i].setup(model);
      if (this.diodeDirection === 1)
        this.diodes[i].stamp(this.nodes[i], this.nodes[this.commonPin]);
      else
        this.diodes[i].stamp(this.nodes[this.commonPin], this.nodes[i]);
    }
  }
  doStep() {
    super.doStep();
    if (this.diodeDirection === 0)
      return;
    for (let i = 0; i !== this.segmentCount; i++)
      this.diodes[i].doStep(this.diodeDirection * (this.nodes[i].v - this.nodes[this.commonPin].v));
  }
  nonLinear() {
    return this.diodeDirection !== 0;
  }
  draw(g) {
    this.drawChip(g);
    g.setColor(Color.red);
    let spx = this.cspc * 2;
    if (this.extraSegment !== SevenSegElm.ES_NONE)
      spx = Math.trunc(spx * 0.9);
    if (this.sizeY <= 4 || this.isFlippedXY())
      spx = Math.trunc(spx / 2);
    const spy = spx * 2;
    const xl = this.x + this.cspc + this.flippedSizeX * this.cspc - spx;
    let yl = this.y - this.cspc + this.flippedSizeY * this.cspc - spy;
    if (this.sizeY <= 4 && (this.flags & (ChipElm.FLAG_FLIP_Y | ChipElm.FLAG_FLIP_XY)) !== 0)
      yl += 10;
    const disp = this.baseSegmentCount === 7 ? SevenSegElm.display7 : this.baseSegmentCount === 14 ? SevenSegElm.display14 : SevenSegElm.display16;
    const thick = this.sizeY <= 4 ? 5 : Math.trunc(spx / 6);
    const dpsize = this.sizeY <= 4 ? 7 : this.isFlippedXY() ? 3 : 7;
    for (let step = 0; step !== 2; step++)
      for (let i = 0; i !== this.segmentCount; i++) {
        const i4 = i * 4;
        const diag = disp[i4] !== disp[i4 + 2] && disp[i4 + 1] !== disp[i4 + 3];
        if (diag !== (step === 0))
          continue;
        this.setColor(g, i);
        this.drawSegment(
          g,
          new Point(xl + disp[i4] * spx, yl + disp[i4 + 1] * spy),
          new Point(xl + disp[i4 + 2] * spx, yl + disp[i4 + 3] * spy),
          thick
        );
      }
    if (this.extraSegment === SevenSegElm.ES_DP) {
      this.setColor(g, this.baseSegmentCount);
      const dist = Math.max(spx * 1.5, spx + 12);
      this.drawDecimal(g, xl + spx + dist, yl + spy * 2, dpsize);
    }
    if (this.extraSegment === SevenSegElm.ES_COLON) {
      this.setColor(g, this.baseSegmentCount);
      const dist = Math.max(spx * 1.5, spx + 14);
      this.drawDecimal(g, xl + spx + dist, yl + spy * 0.5, dpsize);
      this.drawDecimal(g, xl + spx + dist, yl + spy * 1.5, dpsize);
    }
  }
  calculateCurrent() {
    if (this.diodeDirection === 0 || this.diodes == null) {
      for (let i = 0; i !== this.pinCount; i++)
        this.pins[i].current = 0;
      return;
    }
    this.pins[this.commonPin].current = 0;
    for (let i = 0; i !== this.segmentCount; i++) {
      this.pins[i].current = -this.diodeDirection * this.diodes[i].calculateCurrent(this.diodeDirection * (this.nodes[i].v - this.nodes[this.commonPin].v));
      this.pins[this.commonPin].current -= this.pins[i].current;
    }
  }
  getConnection(n1, n2) {
    return this.diodeDirection !== 0;
  }
  stepFinished() {
    if (this.commonPin > 0 && Math.abs(this.pins[this.commonPin].current) > 1e12)
      CircuitElm.sim.stop("max current exceeded", this);
  }
  setColor(g, p) {
    const whiteBkg = this.isPrintable();
    if (this.diodeDirection === 0) {
      g.setColor(this.pins[p].value ? Color.red : whiteBkg ? this.lightgray : this.darkred);
      return;
    }
    let w = -this.diodeDirection * this.pins[p].current / 0.01;
    if (w > 0)
      w = 255 * (1 + 0.2 * Math.log(w));
    if (w > 255)
      w = 255;
    const minw = whiteBkg ? 5 : 30;
    if (w < minw)
      w = minw;
    const wi = Math.trunc(w);
    const cc = whiteBkg ? new Color(255, 255 - wi, 255 - wi) : new Color(wi, 0, 0);
    g.setColor(cc);
  }
  getPostCount() {
    return this.pinCount ?? 0;
  }
  getVoltageSourceCount() {
    return 0;
  }
  getDumpType() {
    return 157;
  }
  getXmlDumpType() {
    return "ssd";
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Segments", 0, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("7 Segment");
      ei.choice.add("14 Segment");
      ei.choice.add("16 Segment");
      ei.choice.select(this.baseSegmentCount === 7 ? 0 : this.baseSegmentCount === 14 ? 1 : 2);
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("Extra Segment", 0, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("None");
      ei.choice.add("Decimal Point");
      ei.choice.add("Colon");
      ei.choice.select(this.extraSegment);
      return ei;
    }
    if (n === 2) {
      const ei = new EditInfo("Diodes", 0, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("Common Cathode");
      ei.choice.add("Common Anode");
      ei.choice.add("None (logic inputs)");
      ei.choice.select(this.diodeDirection === 1 ? 0 : this.diodeDirection === -1 ? 1 : 2);
      return ei;
    }
    return super.getChipEditInfo(n);
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      const ix = ei.choice.getSelectedIndex();
      this.baseSegmentCount = ix === 0 ? 7 : ix === 1 ? 14 : 16;
      this.setPinCount();
      return;
    }
    if (n === 1) {
      this.extraSegment = ei.choice.getSelectedIndex();
      this.setPinCount();
      return;
    }
    if (n === 2) {
      const ix = ei.choice.getSelectedIndex();
      this.diodeDirection = ix === 0 ? 1 : ix === 1 ? -1 : 0;
      this.setPinCount();
      return;
    }
    super.setChipEditValue(n, ei);
  }
  setPinCount() {
    this.segmentCount = this.baseSegmentCount;
    if (this.extraSegment > 0)
      this.segmentCount++;
    if (this.diodeDirection === 0) {
      this.pinCount = this.segmentCount;
      this.commonPin = -1;
    } else {
      this.pinCount = this.segmentCount + 1;
      this.commonPin = this.pinCount - 1;
    }
    this.allocNodes();
    this.setupPins();
    this.setPoints();
  }
  isDigitalChip() {
    return false;
  }
}

class SipoShiftElm extends ChipElm {
  static DATA_PIN_INDEX = 2;
  clockstate = false;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f, st);
    if (st !== void 0) {
      const data = new Array(this.bits).fill(false);
      ChipElm.readBits(st, data);
      for (let i = 0; i < this.bits; i++)
        this.pins[SipoShiftElm.DATA_PIN_INDEX + i].value = data[i];
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
  }
  dumpXmlState(doc, elem) {
    super.dumpXmlState(doc, elem);
    const data = new Array(this.bits).fill(false);
    for (let i = 0; i < this.bits; i++)
      data[i] = this.pins[SipoShiftElm.DATA_PIN_INDEX + i].value;
    CircuitXMLSerializer.dumpAttr(elem, "dt", ChipElm.writeBitsToString(data));
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    const dt = xml.parseStringAttr("dt", null);
    if (dt !== null) {
      const data = new Array(this.bits).fill(false);
      ChipElm.readBitsFromString(dt, data);
      for (let i = 0; i < this.bits; i++)
        this.pins[SipoShiftElm.DATA_PIN_INDEX + i].value = data[i];
    }
  }
  getDumpType() {
    return 189;
  }
  getChipName() {
    return "SIPO shift register";
  }
  needsBits() {
    return true;
  }
  defaultBitCount() {
    return 8;
  }
  setupPins() {
    this.sizeX = this.bits + 1;
    this.sizeY = 3;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 1, ChipElm.SIDE_W, "D");
    this.pins[1] = new Pin(this, 2, ChipElm.SIDE_W, "");
    this.pins[1].clock = true;
    for (let i = 0; i < this.bits; i++) {
      const prevVal = this.pins[SipoShiftElm.DATA_PIN_INDEX + i] ? this.pins[SipoShiftElm.DATA_PIN_INDEX + i].value : false;
      const pin = this.pins[SipoShiftElm.DATA_PIN_INDEX + i] = new Pin(this, i + 1, ChipElm.SIDE_N, "Q" + i);
      pin.value = prevVal;
      pin.output = true;
    }
    this.allocNodes();
  }
  getPostCount() {
    return 2 + this.bits;
  }
  getVoltageSourceCount() {
    return this.bits;
  }
  execute() {
    if (this.pins[1].value !== this.clockstate) {
      this.clockstate = this.pins[1].value;
      if (this.clockstate && this.bits > 0) {
        for (let i = this.bits - 2; i >= 0; i--)
          this.pins[SipoShiftElm.DATA_PIN_INDEX + i + 1].value = this.pins[SipoShiftElm.DATA_PIN_INDEX + i].value;
        this.pins[2].value = this.pins[0].value;
      }
    }
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("# of Bits", this.bits, 1, 1).setDimensionless();
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0 && ei.value !== this.bits && ei.value >= 1) {
      this.bits = Math.trunc(ei.value);
      this.setupPins();
      this.setPoints();
    }
  }
}

class SparkGapElm extends CircuitElm {
  resistance;
  onresistance;
  offresistance;
  breakdown;
  holdcurrent;
  state;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.onresistance = parseFloatStrict(st.nextToken());
      this.offresistance = parseFloatStrict(st.nextToken());
      this.breakdown = parseFloatStrict(st.nextToken());
      this.holdcurrent = parseFloatStrict(st.nextToken());
    } else {
      this.offresistance = 1e9;
      this.onresistance = 1e3;
      this.breakdown = 1e3;
      this.holdcurrent = 1e-3;
    }
    this.state = false;
    this.resistance = this.offresistance;
  }
  nonLinear() {
    return true;
  }
  getDumpType() {
    return 187;
  }
  dump() {
    return super.dump() + " " + this.onresistance + " " + this.offresistance + " " + this.breakdown + " " + this.holdcurrent;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "on", this.onresistance);
    CircuitXMLSerializer.dumpAttr(elem, "of", this.offresistance);
    CircuitXMLSerializer.dumpAttr(elem, "br", this.breakdown);
    CircuitXMLSerializer.dumpAttr(elem, "ho", this.holdcurrent);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.onresistance = xml.parseDoubleAttr("on", this.onresistance);
    this.offresistance = xml.parseDoubleAttr("of", this.offresistance);
    this.breakdown = xml.parseDoubleAttr("br", this.breakdown);
    this.holdcurrent = xml.parseDoubleAttr("ho", this.holdcurrent);
  }
  arrow1;
  arrow2;
  setPoints() {
    super.setPoints();
    const dist = 16;
    const alen = 8;
    this.calcLeads(dist + alen);
    let p1 = this.interpPoint(this.point1, this.point2, (this.dn - alen) / (2 * this.dn));
    this.arrow1 = this.calcArrow(this.point1, p1, alen, alen);
    p1 = this.interpPoint(this.point1, this.point2, (this.dn + alen) / (2 * this.dn));
    this.arrow2 = this.calcArrow(this.point2, p1, alen, alen);
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, 8);
    this.draw2Leads(g);
    this.setVoltageColor(g, this.nodes[0].v);
    this.setPowerColor(g, true);
    g.fillPolygon(this.arrow1);
    this.setVoltageColor(g, this.nodes[1].v);
    this.setPowerColor(g, true);
    g.fillPolygon(this.arrow2);
    if (this.state)
      this.doDots(g);
    this.drawPosts(g);
  }
  calculateCurrent() {
    const vd = this.nodes[0].v - this.nodes[1].v;
    this.current = vd / this.resistance;
  }
  reset() {
    super.reset();
    this.state = false;
  }
  startIteration() {
    if (Math.abs(this.current) < this.holdcurrent)
      this.state = false;
    const vd = this.nodes[0].v - this.nodes[1].v;
    if (Math.abs(vd) > this.breakdown)
      this.state = true;
  }
  doStep() {
    this.resistance = this.state ? this.onresistance : this.offresistance;
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[0]);
    CircuitElm.sim.stampNonLinear(this.nodes[1]);
  }
  getInfo(arr) {
    arr[0] = "spark gap";
    this.getBasicInfo(arr);
    arr[3] = this.state ? "on" : "off";
    arr[4] = "Ron = " + CircuitElm.getUnitText(this.onresistance, Locale.ohmString);
    arr[5] = "Roff = " + CircuitElm.getUnitText(this.offresistance, Locale.ohmString);
    arr[6] = "Vbreakdown = " + CircuitElm.getUnitText(this.breakdown, "V");
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("On resistance (ohms)", this.onresistance, 0, 0);
    if (n === 1)
      return new EditInfo("Off resistance (ohms)", this.offresistance, 0, 0);
    if (n === 2)
      return new EditInfo("Breakdown voltage", this.breakdown, 0, 0);
    if (n === 3)
      return new EditInfo("Holding current (A)", this.holdcurrent, 0, 0);
    return null;
  }
  setEditValue(n, ei) {
    if (ei.value > 0 && n === 0)
      this.onresistance = ei.value;
    if (ei.value > 0 && n === 1)
      this.offresistance = ei.value;
    if (ei.value > 0 && n === 2)
      this.breakdown = ei.value;
    if (ei.value > 0 && n === 3)
      this.holdcurrent = ei.value;
  }
}

class SquareRailElm extends RailElm {
  constructor(xx, yy) {
    super(xx, yy, VoltageElm.WF_SQUARE);
  }
  getDumpClass() {
    return RailElm;
  }
  getShortcut() {
    return 0;
  }
}

class StopTriggerElm extends CircuitElm {
  triggerVoltage = 1;
  triggered = false;
  stopped = false;
  conditionActive = false;
  durationMet = false;
  delay = 0;
  triggerTime = 0;
  requiredDuration = 0;
  conditionStartTime = 0;
  type = 0;
  count = 1;
  triggerCount = 0;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.triggerVoltage = parseFloatStrict(st.nextToken());
      this.type = parseIntStrict(st.nextToken());
      this.delay = parseFloatStrict(st.nextToken());
      this.count = 1;
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "tv", this.triggerVoltage);
    CircuitXMLSerializer.dumpAttr(elem, "tp", this.type);
    CircuitXMLSerializer.dumpAttr(elem, "dl", this.delay);
    CircuitXMLSerializer.dumpAttr(elem, "ct", this.count);
    CircuitXMLSerializer.dumpAttr(elem, "rd", this.requiredDuration);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.triggerVoltage = xml.parseDoubleAttr("tv", this.triggerVoltage);
    this.type = xml.parseIntAttr("tp", this.type);
    this.delay = xml.parseDoubleAttr("dl", this.delay);
    this.count = xml.parseIntAttr("ct", 1);
    if (this.count < 1)
      this.count = 1;
    this.requiredDuration = xml.parseDoubleAttr("rd", 0);
  }
  reset() {
    this.triggered = false;
    this.conditionActive = false;
    this.durationMet = false;
    this.triggerCount = 0;
  }
  getDumpType() {
    return 408;
  }
  getPostCount() {
    return 1;
  }
  setPoints() {
    super.setPoints();
    this.lead1 = this.interpPoint(this.point1, this.point2, 1 - 8 / this.dn);
  }
  draw(g) {
    g.save();
    const selected = this.needsHighlight() || this.stopped;
    g.setFont(new Font("SansSerif", selected ? Font.BOLD : 0, 14));
    g.setColor(selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
    this.setBbox(this.point1, this.lead1, 0);
    this.drawLabeledNode(g, Locale.LS("trigger"), this.point1, this.lead1);
    this.setVoltageColor(g, this.nodes[0].v);
    if (selected) g.setColor(CircuitElm.selectColor);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.drawPosts(g);
    g.restore();
  }
  stepFinished() {
    this.stopped = false;
    const condition = this.type === 0 && this.nodes[0].v >= this.triggerVoltage || this.type === 1 && this.nodes[0].v <= this.triggerVoltage;
    if (!this.conditionActive && condition) {
      this.conditionActive = true;
      this.conditionStartTime = CircuitElm.sim.t;
      this.durationMet = false;
    }
    if (this.conditionActive && condition && !this.durationMet && CircuitElm.sim.t - this.conditionStartTime >= this.requiredDuration) {
      this.durationMet = true;
      this.triggerCount++;
      if (!this.triggered && this.triggerCount >= this.count) {
        this.triggered = true;
        this.triggerTime = CircuitElm.sim.t;
      }
    }
    if (this.conditionActive && !condition)
      this.conditionActive = false;
    if (this.triggered && CircuitElm.sim.t >= this.triggerTime + this.delay) {
      this.triggered = false;
      this.triggerCount = 0;
      this.stopped = true;
      CircuitElm.app.setSimRunning(false);
    }
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getInfo(arr) {
    arr[0] = "stop trigger";
    arr[1] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[2] = "Vtrigger = " + CircuitElm.getVoltageText(this.triggerVoltage);
    if (this.triggered)
      arr[3] = "stopping in " + CircuitElm.getUnitText(this.triggerTime + this.delay - CircuitElm.sim.t, "s");
    else if (this.stopped)
      arr[3] = "stopped";
    else
      arr[3] = "waiting";
    if (!this.stopped && this.count > 1)
      arr[3] += " (" + Math.min(this.triggerCount, this.count) + "/" + this.count + ")";
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("Voltage", this.triggerVoltage).setUnitStep();
    if (n === 1) {
      const ei = new EditInfo("Trigger Type", this.type, -1, -1);
      ei.choice = new Choice();
      ei.choice.add(">=");
      ei.choice.add("<=");
      ei.choice.select(this.type);
      return ei;
    }
    if (n === 2) return new EditInfo("Delay (s)", this.delay);
    if (n === 3) return new EditInfo("Required Duration (s)", this.requiredDuration);
    if (n === 4) {
      const ei = new EditInfo("Required Count", this.count, -1, -1);
      return ei.setDimensionless().setPositive();
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.triggerVoltage = ei.value;
    if (n === 1) this.type = ei.choice.getSelectedIndex();
    if (n === 2) this.delay = ei.value;
    if (n === 3) {
      this.requiredDuration = ei.value;
      if (this.requiredDuration < 0)
        this.requiredDuration = 0;
    }
    if (n === 4) {
      this.count = Math.trunc(ei.value);
      if (this.count < 1)
        this.count = 1;
    }
  }
}

class SweepElm extends CircuitElm {
  maxV;
  maxF;
  minF;
  sweepTime;
  frequency;
  static FLAG_LOG = 1;
  static FLAG_BIDIR = 2;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.minF = 20;
      this.maxF = 4e3;
      this.maxV = 5;
      this.sweepTime = 0.1;
      this.flags = SweepElm.FLAG_BIDIR;
      this.reset();
    } else {
      super(xa, ya, xb, yb, f);
      this.minF = parseFloatStrict(st.nextToken());
      this.maxF = parseFloatStrict(st.nextToken());
      this.maxV = parseFloatStrict(st.nextToken());
      this.sweepTime = parseFloatStrict(st.nextToken());
      this.reset();
    }
  }
  getDumpType() {
    return 170;
  }
  getXmlDumpType() {
    return "sw";
  }
  getPostCount() {
    return 1;
  }
  circleSize = 17;
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "mi", this.minF);
    CircuitXMLSerializer.dumpAttr(elem, "ma", this.maxF);
    CircuitXMLSerializer.dumpAttr(elem, "mv", this.maxV);
    CircuitXMLSerializer.dumpAttr(elem, "sw", this.sweepTime);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.minF = xml.parseDoubleAttr("mi", this.minF);
    this.maxF = xml.parseDoubleAttr("ma", this.maxF);
    this.maxV = xml.parseDoubleAttr("mv", this.maxV);
    this.sweepTime = xml.parseDoubleAttr("sw", this.sweepTime);
    this.reset();
  }
  setPoints() {
    super.setPoints();
    this.lead1 = this.interpPoint(this.point1, this.point2, 1 - this.circleSize / this.dn);
  }
  addRoutingObstacle(router) {
    router.addWire(this.point1.x, this.point1.y, this.lead1.x, this.lead1.y);
    router.addObstacle(
      this.point2.x - this.circleSize,
      this.point2.y - this.circleSize,
      this.point2.x + this.circleSize,
      this.point2.y + this.circleSize
    );
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.circleSize);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.gray);
    this.setPowerColor(g, false);
    const xc = this.point2.x;
    const yc = this.point2.y;
    CircuitElm.drawThickCircle(g, xc, yc, this.circleSize);
    const wl = 8;
    this.adjustBbox(
      xc - this.circleSize,
      yc - this.circleSize,
      xc + this.circleSize,
      yc + this.circleSize
    );
    const xl = 10;
    let tm = Date.now();
    tm %= 2e3;
    if (tm > 1e3)
      tm = 2e3 - tm;
    let w = 1 + tm * 2e-3;
    if (CircuitElm.app.simIsRunning())
      w = 1 + 2 * (this.frequency - this.minF) / (this.maxF - this.minF);
    g.context.beginPath();
    g.setLineWidth(3);
    for (let i = -xl; i <= xl; i++) {
      const yy = yc + Math.round(0.95 * Math.sin(i * CircuitElm.pi * w / xl) * wl);
      if (i === -xl)
        g.context.moveTo(xc + i, yy);
      else
        g.context.lineTo(xc + i, yy);
    }
    g.context.stroke();
    g.setLineWidth(1);
    if (this.showValues()) {
      const s = CircuitElm.getShortUnitText(this.frequency, "Hz");
      if (this.dx === 0 || this.dy === 0)
        this.drawValues(g, s, this.circleSize);
    }
    this.drawPosts(g);
    this.curcount = this.updateDotCountImpl(-this.current, this.curcount);
    if (!this.isCreating())
      this.drawDots(g, this.point1, this.lead1, this.curcount);
  }
  validate() {
    return this.validateRailNode(0);
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[0], this.voltSource);
  }
  fadd = 0;
  fmul = 1;
  freqTime = 0;
  savedTimeStep = 0;
  dir = 1;
  v = 0;
  setParams() {
    if (this.frequency < this.minF || this.frequency > this.maxF) {
      this.frequency = this.minF;
      this.freqTime = 0;
      this.dir = 1;
    }
    if ((this.flags & SweepElm.FLAG_LOG) === 0) {
      this.fadd = this.dir * CircuitElm.sim.timeStep * (this.maxF - this.minF) / this.sweepTime;
      this.fmul = 1;
    } else {
      this.fadd = 0;
      this.fmul = Math.pow(this.maxF / this.minF, this.dir * CircuitElm.sim.timeStep / this.sweepTime);
    }
    this.savedTimeStep = CircuitElm.sim.timeStep;
  }
  reset() {
    this.frequency = this.minF;
    this.freqTime = 0;
    this.dir = 1;
    this.setParams();
  }
  startIteration() {
    if (CircuitElm.sim.timeStep !== this.savedTimeStep)
      this.setParams();
    this.v = Math.sin(this.freqTime) * this.maxV;
    this.freqTime += this.frequency * 2 * CircuitElm.pi * CircuitElm.sim.timeStep;
    this.frequency = this.frequency * this.fmul + this.fadd;
    if (this.frequency >= this.maxF && this.dir === 1) {
      if ((this.flags & SweepElm.FLAG_BIDIR) !== 0) {
        this.fadd = -this.fadd;
        this.fmul = 1 / this.fmul;
        this.dir = -1;
      } else
        this.frequency = this.minF;
    }
    if (this.frequency <= this.minF && this.dir === -1) {
      this.fadd = -this.fadd;
      this.fmul = 1 / this.fmul;
      this.dir = 1;
    }
  }
  doStep() {
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[0], this.voltSource, this.v);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getVoltageSourceCount() {
    return 1;
  }
  hasGroundConnection(n1) {
    return true;
  }
  isSweepElm() {
    return true;
  }
  getElmType() {
    return "sweep";
  }
  getInfo(arr) {
    arr[0] = "sweep " + ((this.flags & SweepElm.FLAG_LOG) === 0 ? "(linear)" : "(log)");
    arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
    arr[2] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
    arr[3] = "f = " + CircuitElm.getUnitText(this.frequency, "Hz");
    arr[4] = "range = " + CircuitElm.getUnitText(this.minF, "Hz") + " .. " + CircuitElm.getUnitText(this.maxF, "Hz");
    arr[5] = "time = " + CircuitElm.getUnitText(this.sweepTime, "s");
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Min Frequency (Hz)", this.minF, 0, 0);
    if (n === 1)
      return new EditInfo("Max Frequency (Hz)", this.maxF, 0, 0);
    if (n === 2)
      return new EditInfo("Sweep Time (s)", this.sweepTime, 0, 0);
    if (n === 3) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Logarithmic", (this.flags & SweepElm.FLAG_LOG) !== 0);
      return ei;
    }
    if (n === 4)
      return new EditInfo("Max Voltage", this.maxV, 0, 0).setUnitStep();
    if (n === 5) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Bidirectional", (this.flags & SweepElm.FLAG_BIDIR) !== 0);
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    const maxfreq = 1 / (8 * CircuitElm.sim.timeStep);
    if (n === 0) {
      this.minF = ei.value;
      if (this.minF > maxfreq)
        this.minF = maxfreq;
    }
    if (n === 1) {
      this.maxF = ei.value;
      if (this.maxF > maxfreq)
        this.maxF = maxfreq;
    }
    if (n === 2)
      this.sweepTime = ei.value;
    if (n === 3) {
      this.flags &= ~SweepElm.FLAG_LOG;
      if (ei.checkbox.getState())
        this.flags |= SweepElm.FLAG_LOG;
    }
    if (n === 4)
      this.maxV = ei.value;
    if (n === 5) {
      this.flags &= ~SweepElm.FLAG_BIDIR;
      if (ei.checkbox.getState())
        this.flags |= SweepElm.FLAG_BIDIR;
    }
    this.setParams();
  }
  getPower() {
    return -this.getVoltageDiff() * this.current;
  }
}

class Switch2Elm extends SwitchElm {
  link = 0;
  throwCount;
  static FLAG_CENTER_OFF = 1;
  static FLAG_FLIPPED = 8;
  constructor(xa, ya, xbOrMm, yb, f, st) {
    if (yb === void 0) {
      super(xa, ya, typeof xbOrMm === "boolean" ? xbOrMm : false);
      this.noDiagonal = true;
      this.throwCount = 2;
      this.allocNodes();
    } else {
      super(xa, ya, xbOrMm, yb, f, st);
      this.link = parseIntStrict(st.nextToken());
      this.throwCount = 2;
      try {
        this.throwCount = parseIntStrict(st.nextToken());
      } catch (e) {
      }
      this.noDiagonal = true;
      this.allocNodes();
    }
  }
  getDumpType() {
    return "S".charCodeAt(0);
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "li", this.link);
    CircuitXMLSerializer.dumpAttr(elem, "th", this.throwCount);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.link = xml.parseIntAttr("li", this.link);
    this.throwCount = xml.parseIntAttr("th", this.throwCount);
  }
  openhs = 16;
  swposts = [];
  swpoles = [];
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    this.swposts = this.newPointArray(this.throwCount);
    this.swpoles = this.newPointArray(2 + this.throwCount);
    for (let i = 0; i !== this.throwCount; i++) {
      let hs = -this.openhs * (i - Math.trunc((this.throwCount - 1) / 2));
      if (this.throwCount === 2 && i === 0)
        hs = this.openhs;
      this.interpPoint(this.lead1, this.lead2, this.swpoles[i], 1, hs);
      this.interpPoint(this.point1, this.point2, this.swposts[i], 1, hs);
    }
    this.swpoles[this.throwCount] = this.lead2;
    this.posCount = this.hasCenterOff() ? 3 : this.throwCount;
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.openhs);
    this.adjustBbox(this.swposts[0], this.swposts[this.throwCount - 1]);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    for (let i = 0; i !== this.throwCount; i++) {
      this.setVoltageColor(g, this.nodes[i + 1].v);
      CircuitElm.drawThickLine(g, this.swpoles[i], this.swposts[i]);
    }
    if (!this.needsHighlight())
      g.setColor(CircuitElm.whiteColor);
    CircuitElm.drawThickLine(g, this.lead1, this.swpoles[this.position]);
    this.updateDotCount();
    this.drawDots(g, this.point1, this.lead1, this.curcount);
    if (!(this.position === 2 && this.hasCenterOff()))
      this.drawDots(g, this.swpoles[this.position], this.swposts[this.position], this.curcount);
    this.drawPosts(g);
  }
  getCurrentIntoNode(n) {
    if (n === 0)
      return -this.current;
    if (n === this.position + 1)
      return this.current;
    return 0;
  }
  getSwitchRect() {
    const p0 = this.swpoles[0];
    const p1 = this.swpoles[this.throwCount - 1];
    const x = Math.min(this.lead1.x, p0.x, p1.x);
    const y = Math.min(this.lead1.y, p0.y, p1.y);
    const w = Math.abs(p0.x - this.lead1.x) + Math.abs(p1.x - p0.x);
    const h = Math.abs(p0.y - this.lead1.y) + Math.abs(p1.y - p0.y);
    return new Rectangle(x, y, w, h);
  }
  getPost(n) {
    return n === 0 ? this.point1 : this.swposts[n - 1];
  }
  getPostCount() {
    return 1 + (this.throwCount ?? 0);
  }
  calculateCurrent() {
    if (this.position === 2 && this.hasCenterOff())
      this.current = 0;
    else if (this.resistance > 0)
      this.current = (this.nodes[0].v - this.nodes[this.position + 1].v) / this.resistance;
  }
  setVoltageSource(n, v) {
    this.voltSource = v;
    v.setNodes(this.nodes[0], this.nodes[this.position + 1]);
  }
  stamp() {
    if (this.position === 2 && this.hasCenterOff())
      return;
    if (this.resistance > 0)
      CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[this.position + 1], this.resistance);
    else
      CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[this.position + 1], this.voltSource, 0);
  }
  getVoltageSourceCount() {
    if (this.position === 2 && this.hasCenterOff())
      return 0;
    return this.resistance > 0 ? 0 : 1;
  }
  toggle() {
    super.toggle();
    if (this.link !== 0) {
      for (let i = 0; i !== CircuitElm.sim.elmList.length; i++) {
        const o = CircuitElm.sim.elmList[i];
        if (o instanceof Switch2Elm) {
          const s2 = o;
          if (s2.link === this.link) {
            let pos = this.position;
            if (s2.isPositionFlipped() !== this.isPositionFlipped())
              pos = this.posCount - 1 - pos;
            if (pos < s2.posCount)
              s2.position = pos;
          }
        }
      }
    }
  }
  getConnection(n1, n2) {
    if (this.position === 2 && this.hasCenterOff())
      return false;
    return this.comparePair(n1, n2, 0, 1 + this.position);
  }
  isWireEquivalent() {
    return this.resistance === 0;
  }
  // optimizing out this element is too complicated to be worth it (see #646)
  isRemovableWire() {
    return false;
  }
  getElmType() {
    return "switch (SPDT)";
  }
  getInfo(arr) {
    arr[0] = "switch (" + (this.link === 0 ? "S" : "D") + "P" + (this.throwCount > 2 ? this.throwCount + "T)" : "DT)");
    arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
  }
  getEditInfo(n) {
    if (n === 1)
      return new EditInfo("Group Number (for linking)", this.link, 0, 100).setDimensionless().disallowSliders();
    if (n === 2)
      return new EditInfo("# of Throws", this.throwCount, 2, 10).setDimensionless().disallowSliders();
    return super.getEditInfo(n);
  }
  setEditValue(n, ei) {
    if (n === 1) {
      this.link = Math.trunc(ei.value);
    } else if (n === 2) {
      if (ei.value >= 2)
        this.throwCount = Math.trunc(ei.value);
      if (this.throwCount > 2)
        this.momentary = false;
      this.allocNodes();
      this.setPoints();
    } else
      super.setEditValue(n, ei);
  }
  // this is for backwards compatibility only.  we only support it if throwCount = 2
  hasCenterOff() {
    return (this.flags & Switch2Elm.FLAG_CENTER_OFF) !== 0 && this.throwCount === 2;
  }
  isPositionFlipped() {
    return (this.flags & Switch2Elm.FLAG_FLIPPED) !== 0;
  }
  addRoutingObstacle(router) {
    router.addWire(this.point1.x, this.point1.y, this.lead1.x, this.lead1.y);
    for (let i = 0; i !== this.throwCount; i++)
      router.addWire(this.swposts[i].x, this.swposts[i].y, this.swpoles[i].x, this.swpoles[i].y);
    let minX = this.lead1.x, minY = this.lead1.y;
    let maxX = this.lead1.x, maxY = this.lead1.y;
    for (let i = 0; i !== this.throwCount; i++) {
      minX = Math.min(minX, this.swpoles[i].x);
      minY = Math.min(minY, this.swpoles[i].y);
      maxX = Math.max(maxX, this.swpoles[i].x);
      maxY = Math.max(maxY, this.swpoles[i].y);
    }
    router.addObstacle(minX, minY, maxX, maxY);
  }
  getShortcut() {
    return "S".charCodeAt(0);
  }
  flipX(c2, count) {
    super.flipX(c2, count);
    this.position = this.posCount - 1 - this.position;
    this.flags ^= Switch2Elm.FLAG_FLIPPED;
  }
  flipY(c2, count) {
    super.flipY(c2, count);
    this.position = this.posCount - 1 - this.position;
    this.flags ^= Switch2Elm.FLAG_FLIPPED;
  }
  flipXY(c2, count) {
    super.flipXY(c2, count);
    this.position = this.posCount - 1 - this.position;
    this.flags ^= Switch2Elm.FLAG_FLIPPED;
  }
  validate() {
    if (this.position === 2 && this.hasCenterOff())
      return true;
    if (this.resistance > 0)
      return true;
    const fpi = new FindPathInfo(FindPathInfo.VOLTAGE, this, this.getNode(0), CircuitElm.sim);
    if (fpi.findPath(this.getNode(1 + this.position))) {
      this.resistance = 1e-3;
      return false;
    }
    return true;
  }
}

class TFlipFlopElm extends ChipElm {
  static FLAG_RESET = 2;
  static FLAG_SET = 4;
  hasReset() {
    return (this.flags & TFlipFlopElm.FLAG_RESET) !== 0 || this.hasSet();
  }
  hasSet() {
    return (this.flags & TFlipFlopElm.FLAG_SET) !== 0;
  }
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
      this.pins[2].value = !this.pins[1].value;
    }
  }
  getChipName() {
    return "T flip-flop";
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = 3;
    this.pins = new Array(this.getPostCount());
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "T");
    this.pins[1] = new Pin(this, 0, ChipElm.SIDE_E, "Q");
    this.pins[1].output = this.pins[1].state = true;
    this.pins[2] = new Pin(this, this.hasSet() ? 1 : 2, ChipElm.SIDE_E, "Q");
    this.pins[2].output = true;
    this.pins[2].lineOver = true;
    this.pins[3] = new Pin(this, 1, ChipElm.SIDE_W, "");
    this.pins[3].clock = true;
    if (!this.hasSet()) {
      if (this.hasReset())
        this.pins[4] = new Pin(this, 2, ChipElm.SIDE_W, "R");
    } else {
      this.pins[5] = new Pin(this, 2, ChipElm.SIDE_W, "S");
      this.pins[4] = new Pin(this, 2, ChipElm.SIDE_E, "R");
    }
  }
  getPostCount() {
    return 4 + (this.hasReset() ? 1 : 0) + (this.hasSet() ? 1 : 0);
  }
  getVoltageSourceCount() {
    return 2;
  }
  reset() {
    super.reset();
    this.pins[2].value = true;
  }
  execute() {
    if (this.pins[3].value && !this.lastClock) {
      if (this.pins[0].value) {
        this.pins[1].value = !this.pins[1].value;
      }
    }
    if (this.hasSet() && this.pins[5].value) {
      this.pins[1].value = true;
    }
    if (this.hasReset() && this.pins[4].value) {
      this.pins[1].value = false;
    }
    this.pins[2].value = !this.pins[1].value;
    this.lastClock = this.pins[3].value;
  }
  getDumpType() {
    return 193;
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Reset Pin", this.hasReset());
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Set Pin", this.hasSet());
      return ei;
    }
    return super.getChipEditInfo(n);
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      if (ei.checkbox.getState())
        this.flags |= TFlipFlopElm.FLAG_RESET;
      else
        this.flags &= ~TFlipFlopElm.FLAG_RESET | TFlipFlopElm.FLAG_SET;
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    }
    if (n === 1) {
      if (ei.checkbox.getState())
        this.flags |= TFlipFlopElm.FLAG_SET;
      else
        this.flags &= ~TFlipFlopElm.FLAG_SET;
      this.setupPins();
      this.allocNodes();
      this.setPoints();
    }
    super.setChipEditValue(n, ei);
  }
}

class TappedTransformerElm extends CircuitElm {
  inductance;
  ratio;
  couplingCoef;
  flip;
  static FLAG_FLIP = 1;
  ptEnds;
  ptCoil;
  ptCore;
  currents;
  curcounts;
  voltdiff;
  curSourceValue;
  a;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    this.currents = [0, 0, 0, 0];
    this.curcounts = [0, 0, 0, 0];
    this.voltdiff = [0, 0, 0];
    this.curSourceValue = [0, 0, 0];
    this.a = new Array(9).fill(0);
    if (st !== void 0) {
      this.inductance = parseFloatStrict(st.nextToken());
      this.ratio = parseFloatStrict(st.nextToken());
      this.currents[0] = parseFloatStrict(st.nextToken());
      this.currents[1] = parseFloatStrict(st.nextToken());
      try {
        this.currents[2] = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
      this.couplingCoef = 0.99;
      try {
        this.couplingCoef = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
    } else {
      this.inductance = 4;
      this.ratio = 1;
      this.couplingCoef = 0.99;
    }
    this.noDiagonal = true;
  }
  getDumpType() {
    return 169;
  }
  getXmlDumpType() {
    return "tt";
  }
  dump() {
    return super.dump() + " " + this.inductance + " " + this.ratio + " " + this.currents[0] + " " + this.currents[1] + " " + this.currents[2] + " " + this.couplingCoef;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "in", this.inductance);
    CircuitXMLSerializer.dumpAttr(elem, "ra", this.ratio);
    CircuitXMLSerializer.dumpAttr(elem, "co", this.couplingCoef);
  }
  dumpXmlState(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "c0", this.currents[0]);
    CircuitXMLSerializer.dumpAttr(elem, "c1", this.currents[1]);
    CircuitXMLSerializer.dumpAttr(elem, "c2", this.currents[2]);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.inductance = xml.parseDoubleAttr("in", this.inductance);
    this.ratio = xml.parseDoubleAttr("ra", this.ratio);
    this.couplingCoef = xml.parseDoubleAttr("co", this.couplingCoef);
    this.currents[0] = xml.parseDoubleAttr("c0", 0);
    this.currents[1] = xml.parseDoubleAttr("c1", 0);
    this.currents[2] = xml.parseDoubleAttr("c2", 0);
  }
  draw(g) {
    for (let i = 0; i !== 5; i++) {
      this.setVoltageColor(g, this.nodes[i].v);
      CircuitElm.drawThickLine(g, this.ptEnds[i], this.ptCoil[i]);
    }
    for (let i = 0; i !== 4; i++) {
      if (i === 1)
        continue;
      this.setPowerColor(g, this.currents[i] * (this.nodes[i].v - this.nodes[i + 1].v));
      this.drawCoil(
        g,
        i > 1 ? -6 * this.flip : 6 * this.flip,
        this.ptCoil[i],
        this.ptCoil[i + 1],
        this.nodes[i].v,
        this.nodes[i + 1].v
      );
    }
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    for (let i = 0; i !== 4; i += 2) {
      CircuitElm.drawThickLine(g, this.ptCore[i], this.ptCore[i + 1]);
    }
    for (let i = 0; i !== 4; i++)
      this.curcounts[i] = this.updateDotCountImpl(this.currents[i], this.curcounts[i]);
    this.drawDots(g, this.ptEnds[0], this.ptCoil[0], this.curcounts[0]);
    this.drawDots(g, this.ptCoil[0], this.ptCoil[1], this.curcounts[0]);
    this.drawDots(g, this.ptCoil[1], this.ptEnds[1], this.curcounts[0]);
    this.drawDots(g, this.ptEnds[2], this.ptCoil[2], this.curcounts[1]);
    this.drawDots(g, this.ptCoil[2], this.ptCoil[3], this.curcounts[1]);
    this.drawDots(g, this.ptCoil[3], this.ptEnds[3], this.curcounts[3]);
    this.drawDots(g, this.ptCoil[3], this.ptCoil[4], this.curcounts[2]);
    this.drawDots(g, this.ptCoil[4], this.ptEnds[4], this.curcounts[2]);
    this.drawPosts(g);
    this.setBbox(this.ptEnds[0], this.ptEnds[4], 0);
  }
  setPoints() {
    super.setPoints();
    this.flip = this.hasFlag(TappedTransformerElm.FLAG_FLIP) ? -1 : 1;
    const hs = 32 * this.flip;
    this.ptEnds = this.newPointArray(5);
    this.ptCoil = this.newPointArray(5);
    this.ptCore = this.newPointArray(4);
    this.ptEnds[0] = this.point1;
    this.ptEnds[2] = this.point2;
    this.interpPoint(this.point1, this.point2, this.ptEnds[1], 0, -hs * 2);
    this.interpPoint(this.point1, this.point2, this.ptEnds[3], 1, -hs);
    this.interpPoint(this.point1, this.point2, this.ptEnds[4], 1, -hs * 2);
    const ce = 0.5 - 12 / this.dn;
    const cd = 0.5 - 2 / this.dn;
    this.interpPoint(this.ptEnds[0], this.ptEnds[2], this.ptCoil[0], ce);
    this.interpPoint(this.ptEnds[0], this.ptEnds[2], this.ptCoil[1], ce, -hs * 2);
    this.interpPoint(this.ptEnds[0], this.ptEnds[2], this.ptCoil[2], 1 - ce);
    this.interpPoint(this.ptEnds[0], this.ptEnds[2], this.ptCoil[3], 1 - ce, -hs);
    this.interpPoint(this.ptEnds[0], this.ptEnds[2], this.ptCoil[4], 1 - ce, -hs * 2);
    for (let i = 0; i !== 2; i++) {
      const b = -hs * i * 2;
      this.interpPoint(this.ptEnds[0], this.ptEnds[2], this.ptCore[i], cd, b);
      this.interpPoint(this.ptEnds[0], this.ptEnds[2], this.ptCore[i + 2], 1 - cd, b);
    }
  }
  getPost(n) {
    return this.ptEnds[n];
  }
  getPostCount() {
    return 5;
  }
  reset() {
    this.currents[0] = this.currents[1] = this.currents[2] = this.currents[3] = 0;
    this.nodes[0].v = this.nodes[1].v = this.nodes[2].v = this.nodes[3].v = this.nodes[4].v = 0;
    this.curcounts[0] = this.curcounts[1] = this.curcounts[2] = 0;
    this.curSourceValue[0] = this.curSourceValue[1] = this.curSourceValue[2] = 0;
  }
  stamp() {
    const l1 = this.inductance;
    const l2 = this.inductance * this.ratio * this.ratio / 4;
    const m1 = this.couplingCoef * Math.sqrt(l1 * l2);
    const m2 = this.couplingCoef * l2;
    this.a[0] = l2 + m2;
    this.a[1] = this.a[2] = this.a[3] = this.a[6] = -m1;
    this.a[4] = this.a[8] = (l1 * l2 - m1 * m1) / (l2 - m2);
    this.a[5] = this.a[7] = (m1 * m1 - l1 * m2) / (l2 - m2);
    const det = l1 * (l2 + m2) - 2 * m1 * m1;
    const ts = this.isTrapezoidal() ? CircuitElm.sim.timeStep / 2 : CircuitElm.sim.timeStep;
    for (let i = 0; i !== 9; i++)
      this.a[i] *= ts / det;
    CircuitElm.sim.stampConductance(this.nodes[0], this.nodes[1], this.a[0]);
    CircuitElm.sim.stampVCCurrentSource(this.nodes[0], this.nodes[1], this.nodes[2], this.nodes[3], this.a[1]);
    CircuitElm.sim.stampVCCurrentSource(this.nodes[0], this.nodes[1], this.nodes[3], this.nodes[4], this.a[2]);
    CircuitElm.sim.stampVCCurrentSource(this.nodes[2], this.nodes[3], this.nodes[0], this.nodes[1], this.a[3]);
    CircuitElm.sim.stampConductance(this.nodes[2], this.nodes[3], this.a[4]);
    CircuitElm.sim.stampVCCurrentSource(this.nodes[2], this.nodes[3], this.nodes[3], this.nodes[4], this.a[5]);
    CircuitElm.sim.stampVCCurrentSource(this.nodes[3], this.nodes[4], this.nodes[0], this.nodes[1], this.a[6]);
    CircuitElm.sim.stampVCCurrentSource(this.nodes[3], this.nodes[4], this.nodes[2], this.nodes[3], this.a[7]);
    CircuitElm.sim.stampConductance(this.nodes[3], this.nodes[4], this.a[8]);
    for (let i = 0; i !== 5; i++)
      CircuitElm.sim.stampRightSide(this.nodes[i]);
  }
  isTrapezoidal() {
    return (this.flags & Inductor.FLAG_BACK_EULER) === 0;
  }
  startIteration() {
    this.voltdiff[0] = this.nodes[0].v - this.nodes[1].v;
    this.voltdiff[1] = this.nodes[2].v - this.nodes[3].v;
    this.voltdiff[2] = this.nodes[3].v - this.nodes[4].v;
    for (let i = 0; i !== 3; i++) {
      this.curSourceValue[i] = this.currents[i];
      if (this.isTrapezoidal())
        for (let j = 0; j !== 3; j++)
          this.curSourceValue[i] += this.a[i * 3 + j] * this.voltdiff[j];
    }
  }
  doStep() {
    CircuitElm.sim.stampCurrentSource(this.nodes[0], this.nodes[1], this.curSourceValue[0]);
    CircuitElm.sim.stampCurrentSource(this.nodes[2], this.nodes[3], this.curSourceValue[1]);
    CircuitElm.sim.stampCurrentSource(this.nodes[3], this.nodes[4], this.curSourceValue[2]);
  }
  calculateCurrent() {
    this.voltdiff[0] = this.nodes[0].v - this.nodes[1].v;
    this.voltdiff[1] = this.nodes[2].v - this.nodes[3].v;
    this.voltdiff[2] = this.nodes[3].v - this.nodes[4].v;
    for (let i = 0; i !== 3; i++) {
      this.currents[i] = this.curSourceValue[i];
      for (let j = 0; j !== 3; j++)
        this.currents[i] += this.a[i * 3 + j] * this.voltdiff[j];
    }
    this.currents[3] = this.currents[1] - this.currents[2];
  }
  getInfo(arr) {
    arr[0] = "transformer";
    arr[1] = "L = " + CircuitElm.getUnitText(this.inductance, "H");
    arr[2] = "Ratio = 1:" + this.ratio;
    arr[3] = "Vd1 = " + CircuitElm.getVoltageText(this.nodes[0].v - this.nodes[2].v);
    arr[4] = "Vd2 = " + CircuitElm.getVoltageText(this.nodes[1].v - this.nodes[3].v);
  }
  getCurrentIntoNode(n) {
    if (n === 0)
      return -this.currents[0];
    if (n === 1)
      return this.currents[0];
    if (n === 2)
      return -this.currents[1];
    if (n === 3)
      return this.currents[3];
    return this.currents[2];
  }
  getConnection(n1, n2) {
    if (this.comparePair(n1, n2, 0, 1))
      return true;
    if (this.comparePair(n1, n2, 2, 3))
      return true;
    if (this.comparePair(n1, n2, 3, 4))
      return true;
    if (this.comparePair(n1, n2, 2, 4))
      return true;
    return false;
  }
  // VCCS stamps couple all nodes, so they must all be in the same matrix
  getMatrixConnection(n1, n2) {
    return true;
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Primary Inductance (H)", this.inductance, 0.01, 5).setPositive();
    if (n === 1)
      return new EditInfo("Ratio (N1/N2)", 1 / this.ratio, 1, 10).setDimensionless().setPositive();
    if (n === 2)
      return new EditInfo("Coupling Coefficient", this.couplingCoef, 0, 1).setDimensionless().setPositive();
    if (n === 3) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Trapezoidal Approximation", this.isTrapezoidal());
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0)
      this.inductance = ei.value;
    if (n === 1 && this.ratio > 0)
      this.ratio = 1 / ei.value;
    if (n === 2) {
      if (ei.value > 0 && ei.value < 1)
        this.couplingCoef = ei.value;
      else
        ei.setError("must be > 0 and < 1");
    }
    if (n === 3) {
      if (ei.checkbox.getState())
        this.flags &= -3;
      else
        this.flags |= Inductor.FLAG_BACK_EULER;
    }
  }
  flipX(c2, count) {
    this.flags ^= TappedTransformerElm.FLAG_FLIP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    this.flags ^= TappedTransformerElm.FLAG_FLIP;
    super.flipY(c2, count);
  }
  flipXY(c2, count) {
    this.flags ^= TappedTransformerElm.FLAG_FLIP;
    super.flipXY(c2, count);
  }
}

class TestPointElm extends CircuitElm {
  meter;
  static TP_VOL = 0;
  static TP_RMS = 1;
  static TP_MAX = 2;
  static TP_MIN = 3;
  static TP_P2P = 4;
  static TP_BIN = 5;
  static TP_FRQ = 6;
  static TP_PER = 7;
  static TP_PWI = 8;
  static TP_DUT = 9;
  static TP_AVG = 10;
  static FLAG_LABEL = 1;
  zerocount = 0;
  rmsV = 0;
  total = 0;
  count = 0;
  avgV = 0;
  totalV = 0;
  maxV = 0;
  lastMaxV = 0;
  minV = 0;
  lastMinV = 0;
  frequency = 0;
  period = 0;
  binaryLevel = 0;
  pulseWidth = 0;
  dutyCycle = 0;
  selectedValue = 0;
  lastStepCount = 0;
  started = false;
  increasingV = true;
  decreasingV = true;
  periodStart = 0;
  periodLength = 0;
  pulseStart = 0;
  label;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.meter = TestPointElm.TP_VOL;
      this.label = "TP";
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.meter = parseIntStrict(st.nextToken());
      if ((this.flags & TestPointElm.FLAG_LABEL) !== 0)
        this.label = CustomLogicModel.unescape(st.nextToken());
      else
        this.label = "TP";
    }
  }
  reset() {
    super.reset();
    this.zerocount = 0;
    this.rmsV = this.total = this.count = 0;
    this.avgV = this.totalV = 0;
    this.maxV = this.lastMaxV = 0;
    this.minV = this.lastMinV = 0;
    this.binaryLevel = 0;
    this.period = this.pulseWidth = this.dutyCycle = 0;
    this.selectedValue = 0;
    this.periodStart = this.periodLength = this.pulseStart = 0;
    this.increasingV = true;
    this.decreasingV = true;
    this.started = false;
    this.lastStepCount = 0;
  }
  getDumpType() {
    return 368;
  }
  getPostCount() {
    return 1;
  }
  setPoints() {
    super.setPoints();
    this.lead1 = new Point();
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "me", this.meter);
    if (this.label !== "TP")
      CircuitXMLSerializer.dumpAttr(elem, "lb", this.label);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.meter = xml.parseIntAttr("me", this.meter);
    this.label = xml.parseStringAttr("lb", "TP") ?? "TP";
  }
  getMeter() {
    switch (this.meter) {
      case TestPointElm.TP_VOL:
        return "V";
      case TestPointElm.TP_RMS:
        return "V(rms)";
      case TestPointElm.TP_AVG:
        return "V(avg)";
      case TestPointElm.TP_MAX:
        return "Vmax";
      case TestPointElm.TP_MIN:
        return "Vmin";
      case TestPointElm.TP_P2P:
        return "Peak to peak";
      case TestPointElm.TP_BIN:
        return "Binary";
      case TestPointElm.TP_FRQ:
        return "Frequency";
      case TestPointElm.TP_PER:
        return "Period";
      case TestPointElm.TP_PWI:
        return "Pulse width";
      case TestPointElm.TP_DUT:
        return "Duty cycle";
    }
    return "";
  }
  drawText(g, str, str2, pt1, pt2) {
    const w1 = Math.floor(g.context.measureText(str).width);
    const w2 = Math.floor(g.context.measureText(str2).width);
    const spacing = 14;
    const wmax = Math.max(w1, w2);
    const h = Math.floor(g.currentFontSize);
    g.save();
    g.context.textBaseline = "middle";
    let x = pt2.x, y = pt2.y;
    if (pt1.y !== pt2.y) {
      x -= wmax / 2;
      y += CircuitElm.sign(pt2.y - pt1.y) * h;
      if (pt2.y < pt1.y)
        y -= spacing - 4;
    } else {
      if (pt2.x > pt1.x)
        x += 4;
      else
        x -= 4 + wmax;
    }
    g.drawString(str, x + (wmax - w1) / 2, y);
    g.drawString(str2, x + (wmax - w2) / 2, y + spacing);
    this.adjustBbox(x, y - h / 2, x + wmax, y + spacing + h / 2);
    g.restore();
  }
  draw(g) {
    g.save();
    const selected = this.needsHighlight();
    const f = new Font("SansSerif", selected ? Font.BOLD : 0, 14);
    g.setFont(f);
    g.setColor(selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
    let s = this.label;
    this.interpPoint(
      this.point1,
      this.point2,
      this.lead1,
      1 - (Math.floor(g.context.measureText("TP").width) / 2 + 8) / this.dn
    );
    this.setBbox(this.point1, this.lead1, 0);
    switch (this.meter) {
      case TestPointElm.TP_VOL:
        s = CircuitElm.getUnitText(this.nodes[0].v, "V");
        break;
      case TestPointElm.TP_RMS:
        s = CircuitElm.getUnitText(this.rmsV, "V(rms)");
        break;
      case TestPointElm.TP_AVG:
        s = CircuitElm.getUnitText(this.avgV, "V(avg)");
        break;
      case TestPointElm.TP_MAX:
        s = CircuitElm.getUnitText(this.lastMaxV, "Vpk");
        break;
      case TestPointElm.TP_MIN:
        s = CircuitElm.getUnitText(this.lastMinV, "Vmin");
        break;
      case TestPointElm.TP_P2P:
        s = CircuitElm.getUnitText(this.lastMaxV - this.lastMinV, "Vp2p");
        break;
      case TestPointElm.TP_BIN:
        s = this.binaryLevel + "";
        break;
      case TestPointElm.TP_FRQ:
        s = CircuitElm.getUnitText(this.frequency, "Hz");
        break;
      case TestPointElm.TP_PER:
        break;
      case TestPointElm.TP_PWI:
        s = CircuitElm.getUnitText(this.pulseWidth, "s");
        break;
      case TestPointElm.TP_DUT:
        s = CircuitElm.showFormat.format(this.dutyCycle);
        break;
    }
    this.drawText(g, this.label, s, this.point1, this.lead1);
    this.setVoltageColor(g, this.nodes[0].v);
    if (selected)
      g.setColor(CircuitElm.selectColor);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.drawPosts(g);
    g.restore();
  }
  stepFinished() {
    if (CircuitElm.sim.timeStepCount === this.lastStepCount)
      return;
    this.lastStepCount = CircuitElm.sim.timeStepCount;
    this.count++;
    this.total += this.nodes[0].v * this.nodes[0].v;
    this.totalV += this.nodes[0].v;
    if (this.nodes[0].v < 2.5)
      this.binaryLevel = 0;
    else
      this.binaryLevel = 1;
    if (!this.started) {
      this.started = true;
      this.maxV = this.minV = this.nodes[0].v;
      this.increasingV = true;
      this.decreasingV = false;
      this.periodStart = this.pulseStart = CircuitElm.sim.t;
    }
    if (this.nodes[0].v > this.maxV && this.increasingV) {
      this.maxV = this.nodes[0].v;
      this.increasingV = true;
      this.decreasingV = false;
    }
    if (this.nodes[0].v < this.maxV && this.increasingV) {
      this.lastMaxV = this.maxV;
      this.periodLength = CircuitElm.sim.t - this.periodStart;
      this.periodStart = CircuitElm.sim.t;
      this.period = this.periodLength;
      this.pulseWidth = CircuitElm.sim.t - this.pulseStart;
      this.dutyCycle = this.pulseWidth / this.periodLength;
      this.minV = this.nodes[0].v;
      this.increasingV = false;
      this.decreasingV = true;
      this.total = this.total / this.count;
      this.rmsV = Math.sqrt(this.total);
      if (isNaN(this.rmsV)) this.rmsV = 0;
      this.avgV = this.totalV / this.count;
      if (isNaN(this.avgV)) this.avgV = 0;
      this.count = 0;
      this.total = 0;
      this.totalV = 0;
    }
    if (this.nodes[0].v < this.minV && this.decreasingV) {
      this.minV = this.nodes[0].v;
      this.increasingV = false;
      this.decreasingV = true;
    }
    if (this.nodes[0].v > this.minV && this.decreasingV) {
      this.lastMinV = this.minV;
      this.pulseStart = CircuitElm.sim.t;
      this.maxV = this.nodes[0].v;
      this.increasingV = true;
      this.decreasingV = false;
      this.total = this.total / this.count;
      this.rmsV = Math.sqrt(this.total);
      if (isNaN(this.rmsV)) this.rmsV = 0;
      this.avgV = this.totalV / this.count;
      if (isNaN(this.avgV)) this.avgV = 0;
      this.count = 0;
      this.total = 0;
      this.totalV = 0;
    }
    if (this.nodes[0].v === 0) {
      this.zerocount++;
      if (this.zerocount > 5) {
        this.total = 0;
        this.rmsV = 0;
        this.avgV = 0;
        this.maxV = 0;
        this.minV = 0;
      }
    } else {
      this.zerocount = 0;
    }
    switch (this.meter) {
      case TestPointElm.TP_VOL:
        this.selectedValue = this.nodes[0].v;
        break;
      case TestPointElm.TP_RMS:
        this.selectedValue = this.rmsV;
        break;
      case TestPointElm.TP_AVG:
        this.selectedValue = this.avgV;
        break;
      case TestPointElm.TP_MAX:
        this.selectedValue = this.lastMaxV;
        break;
      case TestPointElm.TP_MIN:
        this.selectedValue = this.lastMinV;
        break;
      case TestPointElm.TP_P2P:
        this.selectedValue = this.lastMaxV - this.lastMinV;
        break;
      case TestPointElm.TP_BIN:
        this.selectedValue = this.binaryLevel;
        break;
      case TestPointElm.TP_FRQ:
        this.selectedValue = this.frequency;
        break;
      case TestPointElm.TP_PER:
        this.selectedValue = this.period;
        break;
      case TestPointElm.TP_PWI:
        this.selectedValue = this.pulseWidth;
        break;
      case TestPointElm.TP_DUT:
        this.selectedValue = this.dutyCycle;
        break;
    }
  }
  getScopeValue(x) {
    return this.selectedValue;
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getInfo(arr) {
    arr[0] = "Test Point";
    let i = 1;
    arr[i++] = this.getMeterLine(this.meter);
    if (this.meter !== TestPointElm.TP_VOL) arr[i++] = this.getMeterLine(TestPointElm.TP_VOL);
    if (this.meter !== TestPointElm.TP_MAX) arr[i++] = this.getMeterLine(TestPointElm.TP_MAX);
    if (this.meter !== TestPointElm.TP_MIN) arr[i++] = this.getMeterLine(TestPointElm.TP_MIN);
    if (this.meter !== TestPointElm.TP_RMS) arr[i++] = this.getMeterLine(TestPointElm.TP_RMS);
    if (this.meter !== TestPointElm.TP_AVG) arr[i++] = this.getMeterLine(TestPointElm.TP_AVG);
    if (this.meter !== TestPointElm.TP_P2P) arr[i++] = this.getMeterLine(TestPointElm.TP_P2P);
    if (this.meter !== TestPointElm.TP_PER) arr[i++] = this.getMeterLine(TestPointElm.TP_PER);
    if (this.meter !== TestPointElm.TP_PWI) arr[i++] = this.getMeterLine(TestPointElm.TP_PWI);
    if (this.meter !== TestPointElm.TP_DUT) arr[i++] = this.getMeterLine(TestPointElm.TP_DUT);
  }
  getMeterLine(m) {
    switch (m) {
      case TestPointElm.TP_VOL:
        return "V = " + CircuitElm.getUnitText(this.nodes[0].v, "V");
      case TestPointElm.TP_RMS:
        return "V(rms) = " + CircuitElm.getUnitText(this.rmsV, "V");
      case TestPointElm.TP_AVG:
        return "V(avg) = " + CircuitElm.getUnitText(this.avgV, "V");
      case TestPointElm.TP_MAX:
        return "Vmax = " + CircuitElm.getUnitText(this.lastMaxV, "Vpk");
      case TestPointElm.TP_MIN:
        return "Vmin = " + CircuitElm.getUnitText(this.lastMinV, "Vmin");
      case TestPointElm.TP_P2P:
        return "Vp2p = " + CircuitElm.getUnitText(this.lastMaxV - this.lastMinV, "Vp2p");
      case TestPointElm.TP_BIN:
        return "Binary:" + this.binaryLevel;
      case TestPointElm.TP_FRQ:
        return "Freq = " + CircuitElm.getUnitText(this.frequency, "Hz");
      case TestPointElm.TP_PER:
        return "Period = " + CircuitElm.getUnitText(this.period, "s");
      case TestPointElm.TP_PWI:
        return "Pulse width = " + CircuitElm.getUnitText(this.pulseWidth, "s");
      case TestPointElm.TP_DUT:
        return "Duty cycle = " + CircuitElm.showFormat.format(this.dutyCycle);
    }
    return "";
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Value", this.selectedValue, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("Voltage");
      ei.choice.add("RMS Voltage");
      ei.choice.add("Average Voltage");
      ei.choice.add("Max Voltage");
      ei.choice.add("Min Voltage");
      ei.choice.add("P2P Voltage");
      ei.choice.add("Binary Value");
      ei.choice.select(this.meterChoiceIndex(this.meter));
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("Label", 0, -1, -1);
      ei.text = this.label;
      return ei;
    }
    return null;
  }
  meterChoices() {
    return [
      TestPointElm.TP_VOL,
      TestPointElm.TP_RMS,
      TestPointElm.TP_AVG,
      TestPointElm.TP_MAX,
      TestPointElm.TP_MIN,
      TestPointElm.TP_P2P,
      TestPointElm.TP_BIN
    ];
  }
  meterChoiceIndex(m) {
    const choices = this.meterChoices();
    for (let i = 0; i !== choices.length; i++)
      if (choices[i] === m)
        return i;
    return 0;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.meter = this.meterChoices()[ei.choice.getSelectedIndex()];
    if (n === 1)
      this.label = ei.textf ? ei.textf.value : ei.text ?? "TP";
  }
  isTestPointElm() {
    return true;
  }
}

class TextElm extends GraphicElm {
  text;
  lines;
  size;
  color = null;
  editTextArea = null;
  //    final int FLAG_CENTER = 1;
  static FLAG_BAR = 2;
  static FLAG_ESCAPE = 4;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.text = "hello";
      this.lines = [this.text];
      this.size = 24;
    } else {
      super(xa, ya, xb, yb, f);
      this.size = parseIntStrict(st.nextToken());
      this.text = st.nextToken();
      if ((this.flags & TextElm.FLAG_ESCAPE) === 0) {
        while (st.hasMoreTokens())
          this.text += " " + st.nextToken();
        this.text = this.text.replace(/%2[bB]/g, "+");
      } else {
        this.text = CustomLogicModel.unescape(this.text);
      }
      this.lines = [];
      this.split();
    }
  }
  split() {
    this.lines = [];
    let s = this.text;
    while (true) {
      const i = s.search(/\\n/);
      if (i === -1)
        break;
      this.lines.push(s.substring(0, i));
      s = s.substring(i + 2);
    }
    this.lines.push(s);
  }
  dump() {
    this.flags |= TextElm.FLAG_ESCAPE;
    return super.dump() + " " + this.size + " " + CustomLogicModel.escape(this.text);
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "si", this.size);
    CircuitXMLSerializer.dumpAttr(elem, "te", this.text);
    if (this.color != null)
      CircuitXMLSerializer.dumpAttr(elem, "co", this.color);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.size = xml.parseIntAttr("si", this.size);
    this.text = xml.parseStringAttr("te", this.text) ?? this.text;
    this.color = xml.parseStringAttr("co", this.color);
    this.split();
  }
  getDumpType() {
    return "x".charCodeAt(0);
  }
  drag(xx, yy) {
    this.x = xx;
    this.y = yy;
    this.x2 = xx + 16;
    this.y2 = yy;
  }
  draw(g) {
    g.save();
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : this.color != null ? new Color(this.color) : CircuitElm.lightGrayColor);
    const f = new Font("SansSerif", 0, this.size);
    g.setFont(f);
    for (let i = 0; i !== this.lines.length; i++) {
      Math.trunc(g.context.measureText(this.lines[i]).width);
    }
    let cury = this.y;
    this.setBbox(this.x, this.y, this.x, this.y);
    for (let i = 0; i !== this.lines.length; i++) {
      const s = Locale.LS(this.lines[i]);
      const sw = Math.trunc(g.context.measureText(s).width);
      g.drawString(s, this.x, cury);
      if ((this.flags & TextElm.FLAG_BAR) !== 0) {
        const by = cury - g.currentFontSize;
        g.drawLine(this.x, by, this.x + sw - 1, by);
      }
      this.adjustBbox(this.x, cury - g.currentFontSize, this.x + sw, cury + 3);
      cury += g.currentFontSize + 3;
    }
    this.x2 = this.boundingBox.x + this.boundingBox.width;
    this.y2 = this.boundingBox.y + this.boundingBox.height;
    g.restore();
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Text", 0, -1, -1);
      ei.textArea = { value: this.text.replace(/\\n/g, "\n") };
      this.editTextArea = ei.textArea;
      return ei;
    }
    if (n === 1)
      return new EditInfo("Size", this.size, 5, 100);
    if (n === 2) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Draw Bar On Top", (this.flags & TextElm.FLAG_BAR) !== 0);
      return ei;
    }
    if (n === 3)
      return new EditInfo("Color", this.color != null ? this.color : CircuitElm.lightGrayColor.getHexValue()).setIsColor();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.text = this.editTextArea.element.value.replace(/\n/g, "\\n");
      this.split();
    }
    if (n === 1)
      this.size = Math.trunc(ei.value);
    if (n === 2) {
      if (ei.checkbox.getState())
        this.flags |= TextElm.FLAG_BAR;
      else
        this.flags &= ~TextElm.FLAG_BAR;
    }
    if (n === 3) {
      const c = ei.textf.value;
      this.color = c === CircuitElm.lightGrayColor.getHexValue() ? null : c;
    }
  }
  //    isCenteredText(): boolean { return (this.flags & FLAG_CENTER) !== 0; }
  getElmType() {
    return "text";
  }
  getInfo(arr) {
    arr[0] = this.text;
  }
  getShortcut() {
    return "t".charCodeAt(0);
  }
  canViewInScope() {
    return false;
  }
}

class ThermistorNTCElm extends CircuitElm {
  position;
  resistance = 0;
  minTempr = -40;
  maxTempr = 150;
  temperature = 0;
  r25 = 1e4;
  r50 = 3605;
  rneg40 = 0;
  b25100 = 0;
  t0 = 273.15;
  t25 = 273.15 + 25;
  slider = null;
  labelEl = null;
  sliderText;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.r25 = parseFloatStrict(st.nextToken());
      this.r50 = parseFloatStrict(st.nextToken());
      this.minTempr = parseFloatStrict(st.nextToken());
      this.maxTempr = parseFloatStrict(st.nextToken());
      this.position = parseFloatStrict(st.nextToken());
      this.sliderText = CustomLogicModel.unescape(st.nextToken());
    } else {
      this.position = 0.34;
      this.sliderText = "Temperature";
    }
    this.rneg40 = this.calcResistance(this.minTempr);
    this.b25100 = this.calcB25100();
    this.temperature = this.temprFromSliderPos();
    this.resistance = this.calcResistance(this.temperature);
    this.createSlider();
  }
  getPostCount() {
    return 2;
  }
  getDumpType() {
    return 350;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "r25", this.r25);
    CircuitXMLSerializer.dumpAttr(elem, "r50", this.r50);
    CircuitXMLSerializer.dumpAttr(elem, "mnt", this.minTempr);
    CircuitXMLSerializer.dumpAttr(elem, "mxt", this.maxTempr);
    CircuitXMLSerializer.dumpAttr(elem, "ps", this.position);
    CircuitXMLSerializer.dumpAttr(elem, "st", this.sliderText);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.r25 = xml.parseDoubleAttr("r25", this.r25);
    this.r50 = xml.parseDoubleAttr("r50", this.r50);
    this.minTempr = xml.parseDoubleAttr("mnt", this.minTempr);
    this.maxTempr = xml.parseDoubleAttr("mxt", this.maxTempr);
    this.position = xml.parseDoubleAttr("ps", this.position);
    this.sliderText = xml.parseStringAttr("st", this.sliderText) ?? this.sliderText;
    this.rneg40 = this.calcResistance(this.minTempr);
    this.b25100 = this.calcB25100();
    this.temperature = this.temprFromSliderPos();
    this.resistance = this.calcResistance(this.temperature);
    if (this.slider) {
      this.slider.setValue(Math.trunc(this.position * 100));
      if (this.labelEl) this.labelEl.textContent = this.sliderText;
    } else {
      this.createSlider();
    }
  }
  createSlider() {
    const lbl = document.createElement("div");
    lbl.textContent = this.sliderText;
    lbl.className = "topSpace";
    this.labelEl = lbl;
    CircuitElm.app.addWidgetToVerticalPanel(lbl);
    this.slider = new Scrollbar(Scrollbar.HORIZONTAL, Math.trunc(this.position * 100), 1, 0, 101);
    this.slider.addChangeHandler(() => {
      CircuitElm.app.analyzeFlag = true;
      this.setPoints();
    });
    CircuitElm.app.addWidgetToVerticalPanel(this.slider.element);
  }
  delete() {
    if (this.labelEl) CircuitElm.app.removeWidgetFromVerticalPanel(this.labelEl);
    if (this.slider) CircuitElm.app.removeWidgetFromVerticalPanel(this.slider.element);
    super.delete();
  }
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    if (this.slider) {
      this.position = this.slider.getValue() * 99e-4 + 5e-3;
      this.temperature = this.temprFromSliderPos();
      this.resistance = this.calcResistance(this.temperature);
    }
  }
  draw(g) {
    const hs = 6;
    this.setBbox(this.point1, this.point2, hs);
    this.draw2Leads(g);
    this.setPowerColor(g, true);
    const len = CircuitElm.distance(this.lead1, this.lead2);
    const ctx = g.context;
    ctx.save();
    ctx.lineWidth = 3;
    ctx.transform(
      (this.lead2.x - this.lead1.x) / len,
      (this.lead2.y - this.lead1.y) / len,
      -(this.lead2.y - this.lead1.y) / len,
      (this.lead2.x - this.lead1.x) / len,
      this.lead1.x,
      this.lead1.y
    );
    const grad = ctx.createLinearGradient(0, 0, len, 0);
    grad.addColorStop(0, this.getVoltageColor(g, this.nodes[0].v).getHexValue());
    grad.addColorStop(1, this.getVoltageColor(g, this.nodes[1].v).getHexValue());
    ctx.strokeStyle = grad;
    if (!this.showEuroResistors()) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 0; i < 4; i++) {
        ctx.lineTo((1 + 4 * i) * len / 16, hs);
        ctx.lineTo((3 + 4 * i) * len / 16, -hs);
      }
      ctx.lineTo(len, 0);
      ctx.stroke();
    } else {
      ctx.strokeRect(0, -hs, len, 2 * hs);
    }
    ctx.beginPath();
    ctx.moveTo(0 - hs, hs * 2);
    ctx.lineTo(hs, hs * 2);
    ctx.lineTo(len, -hs * 2);
    ctx.stroke();
    ctx.restore();
    if (this.showValues()) {
      this.temperature = this.temprFromSliderPos();
      this.resistance = this.calcResistance(this.temperature);
      this.drawValues(g, this.temperature + "°C=" + CircuitElm.getShortUnitText(this.resistance, "") + "Ω", hs);
    }
    this.doDots(g);
    this.drawPosts(g);
  }
  calculateCurrent() {
    this.current = (this.nodes[0].v - this.nodes[1].v) / this.resistance;
  }
  stamp() {
    this.temperature = this.temprFromSliderPos();
    this.resistance = this.calcResistance(this.temperature);
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
  }
  getInfo(arr) {
    arr[0] = "thermistor";
    arr[1] = "I = " + CircuitElm.getCurrentDText(this.current);
    arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
    arr[3] = "R = " + CircuitElm.getUnitText(this.resistance, Locale.ohmString);
    arr[4] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
    arr[5] = "T = " + CircuitElm.getUnitText(this.temperature, "°C");
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("R at 25°C", this.r25, this.r50 + 100, 1e5);
    if (n === 1) return new EditInfo("R at 50°C", this.r50, 100, this.r25 - 100);
    if (n === 2) return new EditInfo("Slider min temp (°C)", this.minTempr, -40, this.maxTempr);
    if (n === 3) return new EditInfo("Slider max temp (°C)", this.maxTempr, this.minTempr, 150);
    if (n === 4) {
      const ei = new EditInfo("Slider Text", 0, -1, -1);
      ei.text = this.sliderText;
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.r25 = ei.value;
    if (n === 1) this.r50 = ei.value;
    if (n === 2) this.minTempr = ei.value;
    if (n === 3) this.maxTempr = ei.value;
    if (n === 4) {
      this.sliderText = ei.textf.value;
      if (this.labelEl) this.labelEl.textContent = this.sliderText;
      CircuitElm.app.setiFrameHeight();
    }
    this.rneg40 = this.calcResistance(this.minTempr);
    this.b25100 = this.calcB25100();
    this.temperature = this.temprFromSliderPos();
    this.resistance = this.calcResistance(this.temperature);
  }
  calcResistance(tempr) {
    return Math.round(this.r25 * Math.exp(this.b25100 * (1 / (tempr + this.t0) - 1 / this.t25)));
  }
  temprFromSliderPos() {
    return Math.round(this.position * (this.maxTempr - this.minTempr) + this.minTempr);
  }
  calcB25100() {
    return (Math.log(this.r25) - Math.log(this.r50)) / (1 / (this.t0 + 25) - 1 / (this.t0 + 50));
  }
}

class ThreePhaseMotorElm extends CircuitElm {
  Rs;
  Rr;
  Ls;
  Lr;
  Lm;
  b;
  angle = CircuitElm.pi / 2;
  speed = 0;
  filteredSpeed = 0;
  coilCurrents;
  coilCurSourceValues;
  xformMatrix = null;
  nodeCurrents;
  voltSources;
  J;
  posts;
  leads;
  curcounts;
  motorCenter;
  n001_ind = 6;
  n002_ind = 7;
  n003_ind = 8;
  n004_ind = 9;
  n005_ind = 10;
  n006_ind = 11;
  n007_ind = 12;
  Zp = 2;
  coilCount = 5;
  coilNodes = [6, 1, 8, 3, 10, 5, 7, 9, 11, 12];
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.Rs = parseFloatStrict(st.nextToken());
      this.Rr = parseFloatStrict(st.nextToken());
      this.Ls = parseFloatStrict(st.nextToken());
      this.Lr = parseFloatStrict(st.nextToken());
      this.Lm = parseFloatStrict(st.nextToken());
      this.b = parseFloatStrict(st.nextToken());
      try {
        this.J = parseFloatStrict(st.nextToken());
      } catch (e) {
        this.J = 1;
      }
    } else {
      this.Rs = 0.435;
      this.Rr = 0.816;
      this.Ls = 0.0294;
      this.Lr = 0.0297;
      this.Lm = 0.0287;
      this.J = 1;
      this.b = 0.05;
    }
    this.voltSources = new Array(2);
    this.curcounts = [0, 0, 0];
    this.coilCurrents = new Array(this.coilCount).fill(0);
    this.coilCurSourceValues = new Array(this.coilCount).fill(0);
    this.nodeCurrents = [];
  }
  getDumpType() {
    return 427;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "rs", this.Rs);
    CircuitXMLSerializer.dumpAttr(elem, "rr", this.Rr);
    CircuitXMLSerializer.dumpAttr(elem, "ls", this.Ls);
    CircuitXMLSerializer.dumpAttr(elem, "lr", this.Lr);
    CircuitXMLSerializer.dumpAttr(elem, "lm", this.Lm);
    CircuitXMLSerializer.dumpAttr(elem, "b", this.b);
    CircuitXMLSerializer.dumpAttr(elem, "j", this.J);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.Rs = xml.parseDoubleAttr("rs", this.Rs);
    this.Rr = xml.parseDoubleAttr("rr", this.Rr);
    this.Ls = xml.parseDoubleAttr("ls", this.Ls);
    this.Lr = xml.parseDoubleAttr("lr", this.Lr);
    this.Lm = xml.parseDoubleAttr("lm", this.Lm);
    this.b = xml.parseDoubleAttr("b", this.b);
    this.J = xml.parseDoubleAttr("j", this.J);
  }
  getAngle() {
    return this.angle;
  }
  setPoints() {
    super.setPoints();
    this.posts = this.newPointArray(6);
    this.leads = this.newPointArray(6);
    const q = Math.abs(this.dy) > Math.abs(this.dx) ? -1 : 1;
    for (let i = 0; i !== 3; i++) {
      this.interpPoint(this.point1, this.point2, this.posts[i * 2], 0, -q * 32 * (i - 1));
      this.interpPoint(this.point1, this.point2, this.leads[i * 2], 0.45, -q * 32 * (i - 1));
      this.interpPoint(this.point1, this.point2, this.posts[i * 2 + 1], 1, q * 32 * (i - 1));
      this.interpPoint(this.point1, this.point2, this.leads[i * 2 + 1], 0.55, q * 32 * (i - 1));
    }
    this.motorCenter = this.interpPoint(this.point1, this.point2, 0.5);
    this.allocNodes();
  }
  getPostCount() {
    return 6;
  }
  getPost(n) {
    return this.posts[n];
  }
  getInternalNodeCount() {
    return 7;
  }
  getVoltageSourceCount() {
    return 2;
  }
  reset() {
    super.reset();
    this.filteredSpeed = this.speed = 0;
    this.coilCurSourceValues = new Array(this.coilCount).fill(0);
    this.coilCurrents = new Array(this.coilCount).fill(0);
  }
  stamp() {
    const n001 = this.nodes[this.n001_ind];
    const n002 = this.nodes[this.n002_ind];
    const n003 = this.nodes[this.n003_ind];
    const n004 = this.nodes[this.n004_ind];
    const n005 = this.nodes[this.n005_ind];
    const n006 = this.nodes[this.n006_ind];
    const n007 = this.nodes[this.n007_ind];
    CircuitElm.sim.stampResistor(this.nodes[0], n001, this.Rs);
    CircuitElm.sim.stampResistor(this.nodes[2], n003, this.Rs);
    CircuitElm.sim.stampResistor(this.nodes[4], n005, this.Rs);
    CircuitElm.sim.stampResistor(n004, CircuitNode.ground, 1.5 * this.Rr);
    CircuitElm.sim.stampResistor(n007, CircuitNode.ground, 1.5 * this.Rr);
    const Lr2 = this.Lr * 1.5;
    const coilInductances = [this.Ls, this.Ls, this.Ls, Lr2, Lr2];
    this.xformMatrix = [];
    for (let i = 0; i !== this.coilCount; i++) {
      this.xformMatrix[i] = new Array(this.coilCount).fill(0);
      this.xformMatrix[i][i] = coilInductances[i];
    }
    const k0 = this.Lm / Math.sqrt(this.Ls * Lr2);
    const cc = [];
    for (let i = 0; i < this.coilCount; i++) cc[i] = new Array(this.coilCount).fill(0);
    cc[0][3] = cc[3][0] = k0;
    cc[1][3] = cc[3][1] = -k0 / 2;
    cc[1][4] = cc[4][1] = k0 * Math.sqrt(3) / 2;
    cc[2][3] = cc[3][2] = -k0 / 2;
    cc[2][4] = cc[4][2] = -k0 * Math.sqrt(3) / 2;
    for (let i = 0; i !== this.coilCount; i++)
      for (let j = 0; j !== i; j++)
        this.xformMatrix[i][j] = this.xformMatrix[j][i] = cc[i][j] * Math.sqrt(coilInductances[i] * coilInductances[j]);
    SimulationManager.invertMatrix(this.xformMatrix, this.coilCount);
    const ts = CircuitElm.sim.timeStep;
    for (let i = 0; i !== this.coilCount; i++)
      for (let j = 0; j !== this.coilCount; j++) {
        this.xformMatrix[i][j] *= ts;
        const ni1 = this.coilNodes[i * 2], nj1 = this.coilNodes[j * 2];
        const ni2 = this.coilNodes[i * 2 + 1], nj2 = this.coilNodes[j * 2 + 1];
        if (i === j)
          CircuitElm.sim.stampConductance(this.nodes[ni1], this.nodes[ni2], this.xformMatrix[i][i]);
        else
          CircuitElm.sim.stampVCCurrentSource(this.nodes[ni1], this.nodes[ni2], this.nodes[nj1], this.nodes[nj2], this.xformMatrix[i][j]);
      }
    for (let i = 0; i !== 10; i++)
      CircuitElm.sim.stampRightSide(this.nodes[this.coilNodes[i]]);
    CircuitElm.sim.stampVoltageSource(n002, CircuitNode.ground, this.voltSources[0]);
    CircuitElm.sim.stampVoltageSource(n006, CircuitNode.ground, this.voltSources[1]);
    this.nodeCurrents = new Array(this.getNodeCount()).fill(0);
  }
  setVoltageSource(n, v) {
    this.voltSources[n] = v;
    if (n === 0) v.setNodes(this.nodes[this.n002_ind], CircuitNode.ground);
    else v.setNodes(this.nodes[this.n006_ind], CircuitNode.ground);
  }
  vs1value = 0;
  vs2value = 0;
  startIteration() {
    for (let i = 0; i !== this.coilCount; i++)
      this.coilCurSourceValues[i] = this.coilCurrents[i];
    const torque = this.Zp * Math.sqrt(3) / 2 * this.Lm * ((this.coilCurrents[1] - this.coilCurrents[2]) * this.coilCurrents[3] - Math.sqrt(3) * this.coilCurrents[0] * this.coilCurrents[4]);
    this.speed += CircuitElm.sim.timeStep * (torque - this.b * this.speed) / this.J;
    this.angle = this.angle + this.speed * CircuitElm.sim.timeStep;
    this.vs1value = -this.Zp * this.speed * (this.Lm * Math.sqrt(3) / 2 * (this.coilCurrents[1] - this.coilCurrents[2]) + 1.5 * this.Lr * this.coilCurrents[4]);
    this.vs2value = this.Zp * this.speed * (1.5 * this.Lm * this.coilCurrents[0] + 1.5 * this.Lr * this.coilCurrents[3]);
  }
  doStep() {
    for (let i = 0; i !== this.coilCount; i++) {
      const n1 = this.coilNodes[i * 2], n2 = this.coilNodes[i * 2 + 1];
      CircuitElm.sim.stampCurrentSource(this.nodes[n1], this.nodes[n2], this.coilCurSourceValues[i]);
    }
    CircuitElm.sim.updateVoltageSource(this.nodes[this.n002_ind], CircuitNode.ground, this.voltSources[0], -this.vs1value);
    CircuitElm.sim.updateVoltageSource(this.nodes[this.n006_ind], CircuitNode.ground, this.voltSources[1], -this.vs2value);
  }
  calculateCurrent() {
    if (!this.nodeCurrents) return;
    this.nodeCurrents.fill(0);
    for (let i = 0; i !== this.coilCount; i++) {
      let val = this.coilCurSourceValues[i];
      if (this.xformMatrix !== null) {
        for (let j = 0; j !== this.coilCount; j++) {
          const n1 = this.coilNodes[j * 2], n2 = this.coilNodes[j * 2 + 1];
          val += (this.nodes[n1].v - this.nodes[n2].v) * this.xformMatrix[i][j];
        }
      }
      this.coilCurrents[i] = val;
      const ni = this.coilNodes[i];
      this.nodeCurrents[ni] += val;
      this.nodeCurrents[ni + 1] -= val;
    }
  }
  hasGroundConnection(n1) {
    return false;
  }
  getConnection(n1, n2) {
    return true;
  }
  cr = 37;
  draw(g) {
    this.setBbox(this.point1, this.point2, this.cr);
    for (let i = 0; i !== 6; i++) {
      this.setVoltageColor(g, this.nodes[i].v);
      CircuitElm.drawThickLine(g, this.posts[i], this.leads[i]);
    }
    for (let i = 0; i !== 3; i++) {
      this.curcounts[i] = this.updateDotCountImpl(this.coilCurrents[i], this.curcounts[i]);
      this.drawDots(g, this.posts[i * 2], this.leads[i * 2], this.curcounts[i]);
      this.drawDots(g, this.leads[i * 2 + 1], this.posts[i * 2 + 1], this.curcounts[i]);
    }
    this.setPowerColor(g, true);
    g.setColor(new Color(165, 165, 165));
    g.fillOval(this.motorCenter.x - this.cr, this.motorCenter.y - this.cr, this.cr * 2, this.cr * 2);
    g.setColor(new Color(10, 10, 10));
    const angleAux = Math.round(this.angle * 300) / 300;
    g.fillOval(
      this.motorCenter.x - Math.trunc(this.cr / 2.2),
      this.motorCenter.y - Math.trunc(this.cr / 2.2),
      Math.trunc(2 * this.cr / 2.2),
      Math.trunc(2 * this.cr / 2.2)
    );
    const q = 0.28 * 1.7 * 36 / this.dn * 37 / 27;
    for (let k = 0; k < 3; k++) {
      const a = angleAux + k * CircuitElm.pi / 3;
      this.interpPointFix(this.point1, this.point2, CircuitElm.ps1, 0.5 + q * Math.cos(a), q * Math.sin(a));
      this.interpPointFix(this.point1, this.point2, CircuitElm.ps2, 0.5 - q * Math.cos(a), -q * Math.sin(a));
      ThreePhaseMotorElm.drawThickerLine(g, CircuitElm.ps1, CircuitElm.ps2);
    }
    this.drawPosts(g);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
    g.save();
    if (Math.abs(this.dy) > Math.abs(this.dx)) {
      for (let i = 0; i !== 3; i++) {
        const d1 = 5;
        g.drawString("UVW"[i] + "1", this.posts[i * 2].x + d1, this.posts[i * 2].y + 8);
        g.drawString("UVW"[i] + "2", this.posts[i * 2 + 1].x + d1, this.posts[i * 2 + 1].y - 2);
      }
    } else {
      g.context.textAlign = "center";
      for (let i = 0; i !== 3; i++) {
        const d1 = 11, d2 = 7;
        g.drawString("UVW"[i] + "1", this.posts[i * 2].x + d1, this.posts[i * 2].y - d2);
        g.drawString("UVW"[i] + "2", this.posts[i * 2 + 1].x - d1, this.posts[i * 2 + 1].y - d2);
      }
    }
    g.restore();
    this.filteredSpeed = this.filteredSpeed * 0.98 + this.speed * 0.02;
  }
  static drawThickerLine(g, pa, pb) {
    g.setLineWidth(6);
    g.drawLine(pa.x, pa.y, pb.x, pb.y);
    g.setLineWidth(1);
  }
  interpPointFix(a, b, c, f, gg) {
    const gx = b.y - a.y, gy = a.x - b.x;
    c.x = Math.round(a.x * (1 - f) + b.x * f + gg * gx);
    c.y = Math.round(a.y * (1 - f) + b.y * f + gg * gy);
  }
  getInfo(arr) {
    arr[0] = "3-Phase Motor";
    this.getBasicInfo(arr);
    arr[3] = Locale.LS("speed") + " = " + CircuitElm.getUnitText(60 * Math.abs(this.filteredSpeed) / (2 * CircuitElm.pi), Locale.LS("RPM"));
  }
  getCurrentIntoNode(n) {
    return n % 2 === 1 ? this.coilCurrents[Math.trunc(n / 2)] : -this.coilCurrents[Math.trunc(n / 2)];
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("Stator Inductance (H)", this.Ls, 0, 0);
    if (n === 1) return new EditInfo("Rotor Inductance (H)", this.Lr, 0, 0);
    if (n === 2) return new EditInfo("Coupling Coefficient", this.Lm / Math.sqrt(this.Ls * this.Lr), 0, 0).setDimensionless();
    if (n === 3) return new EditInfo("Stator Resistance (ohms)", this.Rs, 0, 0);
    if (n === 4) return new EditInfo("Rotor Resistance (ohms)", this.Rr, 0, 0);
    if (n === 5) return new EditInfo("Friction coefficient (Nms/rad)", this.b, 0, 0);
    if (n === 6) return new EditInfo("Moment of inertia (Kg.m^2)", this.J, 0, 0);
    return null;
  }
  setEditValue(n, ei) {
    if (ei.value > 0 && n === 0) this.Ls = ei.value;
    if (ei.value > 0 && n === 1) this.Lr = ei.value;
    if (ei.value > 0 && ei.value < 1 && n === 2) this.Lm = ei.value * Math.sqrt(this.Ls * this.Lr);
    if (ei.value > 0 && n === 3) this.Rs = ei.value;
    if (ei.value > 0 && n === 4) this.Rr = ei.value;
    if (n === 5) this.b = ei.value;
    if (ei.value > 0 && n === 6) this.J = ei.value;
  }
  canFlipX() {
    return false;
  }
  canFlipY() {
    return false;
  }
}

class TimeDelayRelayElm extends ChipElm {
  lastTransition = 0;
  poweredState = false;
  onState = false;
  vinResistance = 1e4;
  resistance;
  onDelay;
  offDelay;
  onResistance;
  offResistance;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f, st);
    if (st !== void 0) {
      this.onDelay = parseFloatStrict(st.nextToken());
      this.offDelay = parseFloatStrict(st.nextToken());
      this.onResistance = parseFloatStrict(st.nextToken());
      this.offResistance = this.resistance = parseFloatStrict(st.nextToken());
    } else {
      this.onDelay = 1;
      this.offDelay = 0;
      this.onResistance = 1;
      this.offResistance = this.resistance = 1e7;
    }
  }
  reset() {
    this.lastTransition = 0;
    this.poweredState = this.onState = false;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ond", this.onDelay);
    CircuitXMLSerializer.dumpAttr(elem, "ofd", this.offDelay);
    CircuitXMLSerializer.dumpAttr(elem, "onr", this.onResistance);
    CircuitXMLSerializer.dumpAttr(elem, "ofr", this.offResistance);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.onDelay = xml.parseDoubleAttr("ond", this.onDelay);
    this.offDelay = xml.parseDoubleAttr("ofd", this.offDelay);
    this.onResistance = xml.parseDoubleAttr("onr", this.onResistance);
    this.offResistance = xml.parseDoubleAttr("ofr", this.offResistance);
    this.resistance = this.offResistance;
  }
  getChipName() {
    return "time delay relay";
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = 2;
    this.pins = new Array(4);
    this.pins[0] = new Pin(this, 1, ChipElm.SIDE_W, "Vin");
    this.pins[1] = new Pin(this, 1, ChipElm.SIDE_E, "gnd");
    this.pins[2] = new Pin(this, 0, ChipElm.SIDE_W, "in");
    this.pins[3] = new Pin(this, 0, ChipElm.SIDE_E, "out");
  }
  nonLinear() {
    return true;
  }
  stamp() {
    this.resistance = this.onState ? this.onResistance : this.offResistance;
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.vinResistance);
    CircuitElm.sim.stampNonLinear(this.nodes[2]);
    CircuitElm.sim.stampNonLinear(this.nodes[3]);
  }
  doStep() {
    this.resistance = this.onState ? this.onResistance : this.offResistance;
    CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[3], this.resistance);
  }
  stepFinished() {
    const oldState = this.poweredState;
    this.poweredState = this.nodes[0].v - this.nodes[1].v > 2.5;
    if (oldState !== this.poweredState)
      this.lastTransition = CircuitElm.sim.t;
    if (CircuitElm.sim.t > this.lastTransition + (this.poweredState ? this.onDelay : this.offDelay))
      this.onState = this.poweredState;
  }
  draw(g) {
    this.pins[0].current = -(this.nodes[0].v - this.nodes[1].v) / this.vinResistance;
    this.pins[2].current = -(this.nodes[2].v - this.nodes[3].v) / this.resistance;
    this.pins[1].current = -this.pins[0].current;
    this.pins[3].current = -this.pins[2].current;
    this.drawChip(g);
  }
  isDigitalChip() {
    return false;
  }
  getPostCount() {
    return 4;
  }
  getVoltageSourceCount() {
    return 0;
  }
  getDumpType() {
    return 414;
  }
  getChipEditInfo(n) {
    if (n === 0)
      return new EditInfo("On Delay (s)", this.onDelay, 0, 0);
    if (n === 1)
      return new EditInfo("Off Delay (s)", this.offDelay, 0, 0);
    if (n === 2)
      return new EditInfo("On Resistance (ohms)", this.onResistance, 0, 0).setPositive();
    if (n === 3)
      return new EditInfo("Off Resistance (ohms)", this.offResistance, 0, 0).setPositive();
    return null;
  }
  setChipEditValue(n, ei) {
    if (n === 0)
      this.onDelay = ei.value;
    if (n === 1)
      this.offDelay = ei.value;
    if (n === 2)
      this.onResistance = ei.value;
    if (n === 3)
      this.offResistance = ei.value;
  }
}

class TimerElm extends ChipElm {
  static FLAG_RESET = 2;
  static FLAG_GROUND = 4;
  static FLAG_NUMBERS = 8;
  static N_DIS = 0;
  static N_TRIG = 1;
  static N_THRES = 2;
  static N_VCC = 3;
  static N_CTL = 4;
  static N_OUT = 5;
  static N_RST = 6;
  static N_GND = 7;
  getDefaultFlags() {
    return TimerElm.FLAG_RESET | TimerElm.FLAG_GROUND;
  }
  ground;
  out = false;
  triggerSuppressed = false;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
    } else {
      super(xa, ya, xb, yb, f, st);
    }
  }
  getChipName() {
    return "555 Timer";
  }
  setupPins() {
    this.sizeX = 3;
    this.sizeY = 5;
    this.pins = new Array(8);
    const N = TimerElm;
    this.pins[N.N_DIS] = new Pin(this, 1, ChipElm.SIDE_W, this.usePinNames() ? "dis" : "7");
    this.pins[N.N_TRIG] = new Pin(this, 3, ChipElm.SIDE_W, this.usePinNames() ? "tr" : "2");
    if (this.usePinNames())
      this.pins[N.N_TRIG].lineOver = true;
    this.pins[N.N_THRES] = new Pin(this, 4, ChipElm.SIDE_W, this.usePinNames() ? "th" : "6");
    this.pins[N.N_VCC] = new Pin(this, 1, ChipElm.SIDE_N, this.usePinNames() ? "Vcc" : "8");
    this.pins[N.N_CTL] = new Pin(this, 1, ChipElm.SIDE_S, this.usePinNames() ? "ctl" : "5");
    this.pins[N.N_OUT] = new Pin(this, 2, ChipElm.SIDE_E, this.usePinNames() ? "out" : "3");
    this.pins[N.N_OUT].state = true;
    this.pins[N.N_RST] = new Pin(this, 1, ChipElm.SIDE_E, this.usePinNames() ? "rst" : "4");
    if (this.usePinNames())
      this.pins[N.N_RST].lineOver = true;
    this.pins[N.N_GND] = new Pin(this, 2, ChipElm.SIDE_S, this.usePinNames() ? "gnd" : "1");
  }
  nonLinear() {
    return true;
  }
  hasReset() {
    return (this.flags & TimerElm.FLAG_RESET) !== 0 || this.hasGroundPin();
  }
  hasGroundPin() {
    return (this.flags & TimerElm.FLAG_GROUND) !== 0;
  }
  usePinNumbers() {
    return (this.flags & TimerElm.FLAG_NUMBERS) !== 0;
  }
  usePinNames() {
    return (this.flags & TimerElm.FLAG_NUMBERS) === 0;
  }
  isDigitalChip() {
    return false;
  }
  stamp() {
    const N = TimerElm;
    this.ground = this.hasGroundPin() ? this.nodes[N.N_GND] : CircuitNode.ground;
    CircuitElm.sim.stampResistor(this.nodes[N.N_VCC], this.nodes[N.N_CTL], 5e3);
    CircuitElm.sim.stampResistor(this.nodes[N.N_CTL], this.ground, 1e4);
    CircuitElm.sim.stampNonLinear(this.nodes[N.N_DIS]);
    CircuitElm.sim.stampNonLinear(this.nodes[N.N_OUT]);
    CircuitElm.sim.stampNonLinear(this.nodes[N.N_VCC]);
    if (this.hasGroundPin())
      CircuitElm.sim.stampNonLinear(this.nodes[N.N_GND]);
  }
  calculateCurrent() {
    const N = TimerElm;
    this.pins[N.N_VCC].current = (this.nodes[N.N_CTL].v - this.nodes[N.N_VCC].v) / 5e3;
    const groundVolts = this.hasGroundPin() ? this.nodes[N.N_GND].v : 0;
    this.pins[N.N_CTL].current = -(this.nodes[N.N_CTL].v - groundVolts) / 1e4 - this.pins[N.N_VCC].current;
    this.pins[N.N_DIS].current = !this.out ? -(this.nodes[N.N_DIS].v - groundVolts) / 10 : 0;
    this.pins[N.N_OUT].current = -(this.nodes[N.N_OUT].v - (this.out ? this.nodes[N.N_VCC].v : groundVolts));
    if (this.out)
      this.pins[N.N_VCC].current -= this.pins[N.N_OUT].current;
    if (this.hasGroundPin()) {
      this.pins[N.N_GND].current = (this.nodes[N.N_CTL].v - groundVolts) / 1e4;
      if (!this.out)
        this.pins[N.N_GND].current += (this.nodes[N.N_DIS].v - groundVolts) / 10 + (this.nodes[N.N_OUT].v - groundVolts);
    }
  }
  startIteration() {
    const N = TimerElm;
    const groundVolts = this.hasGroundPin() ? this.nodes[N.N_GND].v : 0;
    this.out = this.nodes[N.N_OUT].v > (this.nodes[N.N_VCC].v + groundVolts) / 2;
    if (this.nodes[N.N_THRES].v > this.nodes[N.N_CTL].v)
      this.out = false;
    const triggered = (this.nodes[N.N_CTL].v + groundVolts) / 2 > this.nodes[N.N_TRIG].v;
    if (triggered || this.triggerSuppressed)
      this.out = true;
    if (this.hasReset() && this.nodes[N.N_RST].v < 0.7 + groundVolts) {
      this.out = false;
      this.triggerSuppressed = triggered;
    } else
      this.triggerSuppressed = false;
  }
  doStep() {
    const N = TimerElm;
    if (!this.out)
      CircuitElm.sim.stampResistor(this.nodes[N.N_DIS], this.ground, 10);
    CircuitElm.sim.stampResistor(this.out ? this.nodes[N.N_VCC] : this.ground, this.nodes[N.N_OUT], 1);
  }
  getPostCount() {
    return this.hasGroundPin() ? 8 : this.hasReset() ? 7 : 6;
  }
  getVoltageSourceCount() {
    return 0;
  }
  getMatrixConnection(n1, n2) {
    return true;
  }
  getDumpType() {
    return 165;
  }
  getChipEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, 0, 0);
      ei.checkbox = new Checkbox("Ground Pin", this.hasGroundPin());
      return ei;
    }
    if (n === 1)
      return EditInfo.createCheckbox("Show Pin Numbers", this.usePinNumbers());
    return super.getChipEditInfo(n);
  }
  setChipEditValue(n, ei) {
    if (n === 0) {
      this.flags = ei.changeFlag(this.flags, TimerElm.FLAG_GROUND);
      this.allocNodes();
      this.setPoints();
      return;
    }
    if (n === 1) {
      this.flags = ei.changeFlag(this.flags, TimerElm.FLAG_NUMBERS);
      this.setupPins();
      this.setPoints();
      return;
    }
    super.setChipEditValue(n, ei);
  }
}

class TransLineElm extends CircuitElm {
  delay;
  imped;
  voltageL = null;
  voltageR = null;
  lenSteps = 0;
  ptr = 0;
  width = 0;
  lastStepCount = 0;
  posts = [];
  inner = [];
  voltSource1 = null;
  voltSource2 = null;
  current1 = 0;
  current2 = 0;
  curCount1 = 0;
  curCount2 = 0;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.delay = 1e3 * CircuitElm.sim.maxTimeStep;
      this.imped = 75;
      this.noDiagonal = true;
      this.reset();
    } else {
      super(xa, ya, xb, yb, f);
      this.delay = parseFloatStrict(st.nextToken());
      this.imped = parseFloatStrict(st.nextToken());
      this.width = parseIntStrict(st.nextToken());
      st.nextToken();
      this.noDiagonal = true;
      this.reset();
    }
  }
  getDumpType() {
    return 171;
  }
  getPostCount() {
    return 4;
  }
  getInternalNodeCount() {
    return 2;
  }
  getXmlDumpType() {
    return "tl";
  }
  dump() {
    return super.dump() + " " + this.delay + " " + this.imped + " " + this.width + " 0";
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "de", this.delay);
    CircuitXMLSerializer.dumpAttr(elem, "im", this.imped);
    CircuitXMLSerializer.dumpAttr(elem, "wi", this.width);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.delay = xml.parseDoubleAttr("de", this.delay);
    this.imped = xml.parseDoubleAttr("im", this.imped);
    this.width = xml.parseIntAttr("wi", this.width);
    this.reset();
  }
  drag(xx, yy) {
    xx = this.snapGrid(xx);
    yy = this.snapGrid(yy);
    const w1 = CircuitElm.max(CircuitElm.app.gridSize, CircuitElm.abs(yy - this.y));
    const w2 = CircuitElm.max(CircuitElm.app.gridSize, CircuitElm.abs(xx - this.x));
    if (w1 > w2) {
      xx = this.x;
      this.width = w2;
    } else {
      yy = this.y;
      this.width = w1;
    }
    this.x2 = xx;
    this.y2 = yy;
    this.setPoints();
  }
  reset() {
    if (CircuitElm.sim.maxTimeStep === 0)
      return;
    this.lenSteps = Math.trunc(this.delay / CircuitElm.sim.maxTimeStep);
    if (this.lenSteps > 1e5) {
      this.voltageL = this.voltageR = null;
    } else {
      this.voltageL = new Float64Array(this.lenSteps);
      this.voltageR = new Float64Array(this.lenSteps);
    }
    this.ptr = 0;
    super.reset();
    this.lastStepCount = 0;
  }
  setPoints() {
    super.setPoints();
    const ds = this.dy === 0 ? CircuitElm.sign(this.dx) : -CircuitElm.sign(this.dy);
    const p3 = this.interpPoint(this.point1, this.point2, 0, -this.width * ds);
    const p4 = this.interpPoint(this.point1, this.point2, 1, -this.width * ds);
    const sep = CircuitElm.app.gridSize / 2;
    const p5 = this.interpPoint(this.point1, this.point2, 0, -(this.width / 2 - sep) * ds);
    const p6 = this.interpPoint(this.point1, this.point2, 1, -(this.width / 2 - sep) * ds);
    const p7 = this.interpPoint(this.point1, this.point2, 0, -(this.width / 2 + sep) * ds);
    const p8 = this.interpPoint(this.point1, this.point2, 1, -(this.width / 2 + sep) * ds);
    this.posts = [p3, p4, this.point1, this.point2];
    this.inner = [p7, p8, p5, p6];
  }
  draw(g) {
    this.setBbox(this.posts[0], this.posts[3], 0);
    const segments = Math.trunc(this.dn / 2);
    const ix0 = this.ptr - 1 + this.lenSteps;
    const segf = 1 / segments;
    g.setColor(Color.darkGray);
    g.fillRect(
      this.inner[2].x,
      this.inner[2].y,
      this.inner[1].x - this.inner[2].x + 2,
      this.inner[1].y - this.inner[2].y + 2
    );
    for (let i = 0; i !== 4; i++) {
      this.setVoltageColor(g, this.nodes[i].v);
      CircuitElm.drawThickLine(g, this.posts[i], this.inner[i]);
    }
    if (this.voltageL != null) {
      for (let i = 0; i !== segments; i++) {
        const ix1 = (ix0 - Math.trunc(this.lenSteps * i / segments)) % this.lenSteps;
        const ix2 = (ix0 - Math.trunc(this.lenSteps * (segments - 1 - i) / segments)) % this.lenSteps;
        const v = (this.voltageL[ix1] + this.voltageR[ix2]) / 2;
        this.setVoltageColor(g, v);
        this.interpPoint(this.inner[0], this.inner[1], CircuitElm.ps1, i * segf);
        this.interpPoint(this.inner[2], this.inner[3], CircuitElm.ps2, i * segf);
        g.drawLine(CircuitElm.ps1.x, CircuitElm.ps1.y, CircuitElm.ps2.x, CircuitElm.ps2.y);
        this.interpPoint(this.inner[2], this.inner[3], CircuitElm.ps1, (i + 1) * segf);
        CircuitElm.drawThickLine(g, CircuitElm.ps1, CircuitElm.ps2);
      }
    }
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.inner[0], this.inner[1]);
    this.drawPosts(g);
    this.curCount1 = this.updateDotCountImpl(-this.current1, this.curCount1);
    this.curCount2 = this.updateDotCountImpl(this.current2, this.curCount2);
    if (!this.isCreating()) {
      this.drawDots(g, this.posts[0], this.inner[0], this.curCount1);
      this.drawDots(g, this.posts[2], this.inner[2], -this.curCount1);
      this.drawDots(g, this.posts[1], this.inner[1], -this.curCount2);
      this.drawDots(g, this.posts[3], this.inner[3], this.curCount2);
    }
  }
  setVoltageSource(n, v) {
    if (n === 0) {
      this.voltSource1 = v;
      v.setNodes(this.nodes[4], this.nodes[0]);
    } else {
      this.voltSource2 = v;
      v.setNodes(this.nodes[5], this.nodes[1]);
    }
  }
  setCurrent(vs, c) {
    if (vs === this.voltSource1)
      this.current1 = c;
    else
      this.current2 = c;
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(this.nodes[4], this.nodes[0], this.voltSource1);
    CircuitElm.sim.stampVoltageSource(this.nodes[5], this.nodes[1], this.voltSource2);
    CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[4], this.imped);
    CircuitElm.sim.stampResistor(this.nodes[3], this.nodes[5], this.imped);
  }
  startIteration() {
    if (this.voltageL == null) {
      CircuitElm.sim.stop("Transmission line delay too large!", this);
      return;
    }
    this.voltageL[this.ptr] = this.nodes[2].v - this.nodes[0].v + this.nodes[2].v - this.nodes[4].v;
    this.voltageR[this.ptr] = this.nodes[3].v - this.nodes[1].v + this.nodes[3].v - this.nodes[5].v;
  }
  doStep() {
    if (this.voltageL == null) {
      CircuitElm.sim.stop("Transmission line delay too large!", this);
      return;
    }
    const nextPtr = (this.ptr + 1) % this.lenSteps;
    CircuitElm.sim.updateVoltageSource(this.nodes[4], this.nodes[0], this.voltSource1, -this.voltageR[nextPtr]);
    CircuitElm.sim.updateVoltageSource(this.nodes[5], this.nodes[1], this.voltSource2, -this.voltageL[nextPtr]);
    if (Math.abs(this.nodes[0].v) > 1e-5 || Math.abs(this.nodes[1].v) > 1e-5) {
      CircuitElm.sim.stop("Need to ground transmission line!", this);
      return;
    }
  }
  stepFinished() {
    if (CircuitElm.sim.timeStepCount === this.lastStepCount)
      return;
    this.lastStepCount = CircuitElm.sim.timeStepCount;
    this.ptr = (this.ptr + 1) % this.lenSteps;
  }
  getPost(n) {
    return this.posts[n];
  }
  getVoltageSourceCount() {
    return 2;
  }
  hasGroundConnection(n1) {
    return false;
  }
  getConnection(n1, n2) {
    return false;
  }
  getMatrixConnection(n1, n2) {
    return n1 % 2 === n2 % 2;
  }
  getInfo(arr) {
    arr[0] = "transmission line";
    arr[1] = CircuitElm.getUnitText(this.imped, Locale.ohmString);
    arr[2] = "length = " + CircuitElm.getUnitText(0.65 * 29979e4 * this.delay, "m");
    arr[3] = "delay = " + CircuitElm.getUnitText(this.delay, "s");
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Delay (s)", this.delay, 0, 0).setPositive();
    if (n === 1)
      return new EditInfo("Impedance (ohms)", this.imped, 0, 0).setPositive();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0) {
      this.delay = ei.value;
      this.reset();
    }
    if (n === 1 && ei.value > 0) {
      this.imped = ei.value;
      this.reset();
    }
  }
  getCurrentIntoNode(n) {
    if (n === 0) return this.current1;
    if (n === 2) return -this.current1;
    if (n === 3) return -this.current2;
    return this.current2;
  }
  canFlipX() {
    return this.dy === 0;
  }
  canFlipY() {
    return this.dx === 0;
  }
}

class TransformerElm extends CircuitElm {
  inductance;
  ratio;
  couplingCoef;
  saturationCurrent = 0;
  // 0 = disabled (linear core)
  ptEnds;
  ptCoil;
  ptCore;
  currents;
  curcounts;
  dots;
  width;
  polarity;
  flip;
  static FLAG_REVERSE = 4;
  static FLAG_VERTICAL = 8;
  static FLAG_FLIP = 16;
  a1;
  a2;
  a3;
  a4;
  curSourceValue1;
  curSourceValue2;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.inductance = 4;
      this.ratio = this.polarity = 1;
      this.width = 32;
      this.noDiagonal = true;
      this.couplingCoef = 0.999;
      this.currents = new Array(2).fill(0);
      this.curcounts = new Array(2).fill(0);
      this.curSourceValue1 = this.curSourceValue2 = this.a1 = this.a2 = this.a3 = this.a4 = 0;
    } else {
      super(xa, ya, xb, yb, f);
      if (this.hasFlag(TransformerElm.FLAG_VERTICAL))
        this.width = -Math.max(32, Math.abs(xb - xa));
      else
        this.width = Math.max(32, Math.abs(yb - ya));
      this.inductance = parseFloatStrict(st.nextToken());
      this.ratio = parseFloatStrict(st.nextToken());
      this.currents = new Array(2).fill(0);
      this.curcounts = new Array(2).fill(0);
      this.currents[0] = parseFloatStrict(st.nextToken());
      this.currents[1] = parseFloatStrict(st.nextToken());
      this.couplingCoef = 0.999;
      this.curSourceValue1 = this.curSourceValue2 = this.a1 = this.a2 = this.a3 = this.a4 = 0;
      try {
        this.couplingCoef = parseFloatStrict(st.nextToken());
        this.saturationCurrent = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
      this.noDiagonal = true;
      this.polarity = this.hasFlag(TransformerElm.FLAG_REVERSE) ? -1 : 1;
    }
  }
  getDumpType() {
    return "T".charCodeAt(0);
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "in", this.inductance);
    CircuitXMLSerializer.dumpAttr(elem, "ra", this.ratio);
    CircuitXMLSerializer.dumpAttr(elem, "co", this.couplingCoef);
    CircuitXMLSerializer.dumpAttr(elem, "wi", this.width);
    if (this.saturationCurrent !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "isat", this.saturationCurrent);
  }
  dumpXmlState(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "c0", this.currents[0]);
    CircuitXMLSerializer.dumpAttr(elem, "c1", this.currents[1]);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    if (this.hasFlag(TransformerElm.FLAG_VERTICAL))
      this.width = -Math.max(32, Math.abs(this.x2 - this.x));
    else
      this.width = Math.max(32, Math.abs(this.y2 - this.y));
    this.inductance = xml.parseDoubleAttr("in", this.inductance);
    this.ratio = xml.parseDoubleAttr("ra", this.ratio);
    this.couplingCoef = xml.parseDoubleAttr("co", this.couplingCoef);
    this.width = xml.parseIntAttr("wi", this.width);
    this.saturationCurrent = xml.parseDoubleAttr("isat", this.saturationCurrent);
    this.currents[0] = xml.parseDoubleAttr("c0", 0);
    this.currents[1] = xml.parseDoubleAttr("c1", 0);
    this.polarity = this.hasFlag(TransformerElm.FLAG_REVERSE) ? -1 : 1;
  }
  nonLinear() {
    return this.saturationCurrent > 0;
  }
  isTrapezoidal() {
    return (this.flags & Inductor.FLAG_BACK_EULER) === 0;
  }
  draw(g) {
    let i;
    for (i = 0; i !== 4; i++) {
      this.setVoltageColor(g, this.nodes[i].v);
      CircuitElm.drawThickLine(g, this.ptEnds[i], this.ptCoil[i]);
    }
    for (i = 0; i !== 2; i++) {
      this.setPowerColor(g, this.currents[i] * (this.nodes[i].v - this.nodes[i + 2].v));
      let csign = this.dsign * (i === 1 ? -6 * this.polarity : 6) * this.flip;
      if (this.hasFlag(TransformerElm.FLAG_VERTICAL))
        csign *= -1;
      this.drawCoil(g, csign, this.ptCoil[i], this.ptCoil[i + 2], this.nodes[i].v, this.nodes[i + 2].v);
    }
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    for (i = 0; i !== 2; i++) {
      CircuitElm.drawThickLine(g, this.ptCore[i], this.ptCore[i + 2]);
      if (this.dots !== null)
        g.fillOval(this.dots[i].x - 2, this.dots[i].y - 2, 5, 5);
      this.curcounts[i] = this.updateDotCountImpl(this.currents[i], this.curcounts[i]);
    }
    for (i = 0; i !== 2; i++) {
      this.drawDots(g, this.ptEnds[i], this.ptCoil[i], this.curcounts[i]);
      this.drawDots(g, this.ptCoil[i], this.ptCoil[i + 2], this.curcounts[i]);
      this.drawDots(g, this.ptEnds[i + 2], this.ptCoil[i + 2], -this.curcounts[i]);
    }
    this.drawPosts(g);
    this.setBbox(this.ptEnds[0], this.ptEnds[this.polarity === 1 ? 3 : 1], 0);
  }
  setPoints() {
    super.setPoints();
    if (this.hasFlag(TransformerElm.FLAG_VERTICAL))
      this.point2.x = this.point1.x;
    else
      this.point2.y = this.point1.y;
    this.ptEnds = this.newPointArray(4);
    this.ptCoil = this.newPointArray(4);
    this.ptCore = this.newPointArray(4);
    this.ptEnds[0] = this.point1;
    this.ptEnds[1] = this.point2;
    this.flip = this.hasFlag(TransformerElm.FLAG_FLIP) ? -1 : 1;
    this.interpPoint(this.point1, this.point2, this.ptEnds[2], 0, -this.dsign * this.width * this.flip);
    this.interpPoint(this.point1, this.point2, this.ptEnds[3], 1, -this.dsign * this.width * this.flip);
    const ce = 0.5 - 12 / this.dn;
    const cd = 0.5 - 2 / this.dn;
    let i;
    for (i = 0; i !== 4; i += 2) {
      this.interpPoint(this.ptEnds[i], this.ptEnds[i + 1], this.ptCoil[i], ce);
      this.interpPoint(this.ptEnds[i], this.ptEnds[i + 1], this.ptCoil[i + 1], 1 - ce);
      this.interpPoint(this.ptEnds[i], this.ptEnds[i + 1], this.ptCore[i], cd);
      this.interpPoint(this.ptEnds[i], this.ptEnds[i + 1], this.ptCore[i + 1], 1 - cd);
    }
    if (this.polarity === -1) {
      const vsign = this.hasFlag(TransformerElm.FLAG_VERTICAL) ? -1 : 1;
      this.dots = new Array(2);
      const dotp = Math.abs(7 / this.width);
      this.dots[0] = this.interpPoint(this.ptCoil[0], this.ptCoil[2], dotp, -7 * this.dsign * vsign * this.flip);
      this.dots[1] = this.interpPoint(this.ptCoil[3], this.ptCoil[1], dotp, -7 * this.dsign * vsign * this.flip);
      let x = this.ptEnds[1];
      this.ptEnds[1] = this.ptEnds[3];
      this.ptEnds[3] = x;
      x = this.ptCoil[1];
      this.ptCoil[1] = this.ptCoil[3];
      this.ptCoil[3] = x;
    } else
      this.dots = null;
  }
  getPost(n) {
    return this.ptEnds[n];
  }
  getPostCount() {
    return 4;
  }
  reset() {
    this.currents[0] = this.currents[1] = this.curcounts[0] = this.curcounts[1] = this.curSourceValue1 = this.curSourceValue2 = 0;
  }
  // compute effective inductance with saturation: L(I) = L0 / (1 + (I/Isat)^2)
  calcEffectiveInductance(l0, i, isat) {
    if (isat <= 0) return l0;
    const ratio = i / isat;
    return l0 / (1 + ratio * ratio);
  }
  // compute a1-a4 companion model coefficients from effective inductances
  computeCoefficients(l1, l2, m) {
    const deti = 1 / (l1 * l2 - m * m);
    const ts = this.isTrapezoidal() ? CircuitElm.sim.timeStep / 2 : CircuitElm.sim.timeStep;
    this.a1 = l2 * deti * ts;
    this.a2 = -m * deti * ts;
    this.a3 = -m * deti * ts;
    this.a4 = l1 * deti * ts;
  }
  stamp() {
    const l1 = this.inductance;
    const l2 = this.inductance * this.ratio * this.ratio;
    const m = this.couplingCoef * Math.sqrt(l1 * l2);
    this.computeCoefficients(l1, l2, m);
    if (this.saturationCurrent > 0) {
      CircuitElm.sim.stampNonLinear(this.nodes[0]);
      CircuitElm.sim.stampNonLinear(this.nodes[1]);
      CircuitElm.sim.stampNonLinear(this.nodes[2]);
      CircuitElm.sim.stampNonLinear(this.nodes[3]);
    } else {
      CircuitElm.sim.stampConductance(this.nodes[0], this.nodes[2], this.a1);
      CircuitElm.sim.stampVCCurrentSource(this.nodes[0], this.nodes[2], this.nodes[1], this.nodes[3], this.a2);
      CircuitElm.sim.stampVCCurrentSource(this.nodes[1], this.nodes[3], this.nodes[0], this.nodes[2], this.a3);
      CircuitElm.sim.stampConductance(this.nodes[1], this.nodes[3], this.a4);
    }
    CircuitElm.sim.stampRightSide(this.nodes[0]);
    CircuitElm.sim.stampRightSide(this.nodes[1]);
    CircuitElm.sim.stampRightSide(this.nodes[2]);
    CircuitElm.sim.stampRightSide(this.nodes[3]);
  }
  startIteration() {
    if (this.saturationCurrent > 0) {
      const l1 = this.calcEffectiveInductance(this.inductance, this.currents[0], this.saturationCurrent);
      const l2 = this.calcEffectiveInductance(
        this.inductance * this.ratio * this.ratio,
        this.currents[1],
        this.saturationCurrent * this.ratio
      );
      const m = this.couplingCoef * Math.sqrt(l1 * l2);
      this.computeCoefficients(l1, l2, m);
    }
    const voltdiff1 = this.nodes[0].v - this.nodes[2].v;
    const voltdiff2 = this.nodes[1].v - this.nodes[3].v;
    if (this.isTrapezoidal()) {
      this.curSourceValue1 = voltdiff1 * this.a1 + voltdiff2 * this.a2 + this.currents[0];
      this.curSourceValue2 = voltdiff1 * this.a3 + voltdiff2 * this.a4 + this.currents[1];
    } else {
      this.curSourceValue1 = this.currents[0];
      this.curSourceValue2 = this.currents[1];
    }
  }
  doStep() {
    if (this.saturationCurrent > 0) {
      CircuitElm.sim.stampConductance(this.nodes[0], this.nodes[2], this.a1);
      CircuitElm.sim.stampVCCurrentSource(this.nodes[0], this.nodes[2], this.nodes[1], this.nodes[3], this.a2);
      CircuitElm.sim.stampVCCurrentSource(this.nodes[1], this.nodes[3], this.nodes[0], this.nodes[2], this.a3);
      CircuitElm.sim.stampConductance(this.nodes[1], this.nodes[3], this.a4);
    }
    CircuitElm.sim.stampCurrentSource(this.nodes[0], this.nodes[2], this.curSourceValue1);
    CircuitElm.sim.stampCurrentSource(this.nodes[1], this.nodes[3], this.curSourceValue2);
  }
  calculateCurrent() {
    const voltdiff1 = this.nodes[0].v - this.nodes[2].v;
    const voltdiff2 = this.nodes[1].v - this.nodes[3].v;
    this.currents[0] = voltdiff1 * this.a1 + voltdiff2 * this.a2 + this.curSourceValue1;
    this.currents[1] = voltdiff1 * this.a3 + voltdiff2 * this.a4 + this.curSourceValue2;
  }
  getCurrentIntoNode(n) {
    if (n < 2)
      return -this.currents[n];
    return this.currents[n - 2];
  }
  getInfo(arr) {
    arr[0] = this.saturationCurrent > 0 ? "transformer (sat)" : "transformer";
    arr[1] = "L = " + CircuitElm.getUnitText(this.inductance, "H");
    arr[2] = "Ratio = 1:" + this.ratio;
    arr[3] = "Vd1 = " + CircuitElm.getVoltageText(this.nodes[0].v - this.nodes[2].v);
    arr[4] = "Vd2 = " + CircuitElm.getVoltageText(this.nodes[1].v - this.nodes[3].v);
    arr[5] = "I1 = " + CircuitElm.getCurrentText(this.currents[0]);
    arr[6] = "I2 = " + CircuitElm.getCurrentText(this.currents[1]);
    if (this.saturationCurrent > 0) {
      const l1Eff = this.calcEffectiveInductance(this.inductance, this.currents[0], this.saturationCurrent);
      arr[7] = "L1eff = " + CircuitElm.getUnitText(l1Eff, "H");
    }
  }
  getConnection(n1, n2) {
    if (this.comparePair(n1, n2, 0, 2))
      return true;
    if (this.comparePair(n1, n2, 1, 3))
      return true;
    return false;
  }
  // VCCS stamps couple all nodes, so they must all be in the same matrix
  getMatrixConnection(n1, n2) {
    return true;
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Primary Inductance (H)", this.inductance, 0.01, 5).setPositive();
    if (n === 1)
      return new EditInfo("Ratio (N1/N2)", 1 / this.ratio, 1, 10).setDimensionless().setPositive();
    if (n === 2)
      return new EditInfo("Coupling Coefficient", this.couplingCoef, 0, 1).setDimensionless().setPositive();
    if (n === 3) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox(
        "Trapezoidal Approximation",
        this.isTrapezoidal()
      );
      return ei;
    }
    if (n === 4) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox(
        "Swap Secondary Polarity",
        this.polarity === -1
      );
      return ei;
    }
    if (n === 5)
      return new EditInfo("Saturation Current (A) (0=none)", this.saturationCurrent);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0)
      this.inductance = ei.value;
    if (n === 1 && ei.value > 0)
      this.ratio = 1 / ei.value;
    if (n === 2) {
      if (ei.value > 0 && ei.value < 1)
        this.couplingCoef = ei.value;
      else
        ei.setError("must be > 0 and < 1");
    }
    if (n === 3) {
      if (ei.checkbox.getState())
        this.flags &= -3;
      else
        this.flags |= Inductor.FLAG_BACK_EULER;
    }
    if (n === 4) {
      this.polarity = ei.checkbox.getState() ? -1 : 1;
      if (ei.checkbox.getState())
        this.flags |= TransformerElm.FLAG_REVERSE;
      else
        this.flags &= ~TransformerElm.FLAG_REVERSE;
      this.setPoints();
    }
    if (n === 5) {
      if (ei.value >= 0)
        this.saturationCurrent = ei.value;
      else
        ei.setError("must be >= 0");
    }
  }
  getShortcut() {
    return "T".charCodeAt(0);
  }
  drag(xx, yy) {
    xx = this.snapGrid(xx);
    yy = this.snapGrid(yy);
    if (Math.abs(xx - this.x) > Math.abs(yy - this.y)) {
      this.flags &= ~TransformerElm.FLAG_VERTICAL;
    } else
      this.flags |= TransformerElm.FLAG_VERTICAL;
    if (this.hasFlag(TransformerElm.FLAG_VERTICAL))
      this.width = -Math.max(32, Math.abs(xx - this.x));
    else
      this.width = Math.max(32, Math.abs(yy - this.y));
    if (xx === this.x)
      yy = this.y;
    this.x2 = xx;
    this.y2 = yy;
    this.setPoints();
  }
  flipX(c2, count) {
    if (this.hasFlag(TransformerElm.FLAG_VERTICAL))
      this.flags ^= TransformerElm.FLAG_FLIP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    if (!this.hasFlag(TransformerElm.FLAG_VERTICAL))
      this.flags ^= TransformerElm.FLAG_FLIP;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    this.flags ^= TransformerElm.FLAG_VERTICAL;
    this.width *= -1;
    super.flipXY(xmy, count);
  }
}

class TriStateElm extends CircuitElm {
  resistance = 0;
  r_on;
  r_off;
  r_off_ground;
  highVoltage;
  busWidth = 1;
  voltageSources;
  FLAG_FLIP = 1;
  FLAG_FLIP_X = 2;
  FLAG_FLIP_Y = 4;
  open = false;
  ps;
  point3;
  lead3;
  busLead1;
  gatePoly;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.r_on = 0.1;
      this.r_off = 1e10;
      this.r_off_ground = 0;
      this.highVoltage = 5;
      try {
        this.r_on = parseFloatStrict(st.nextToken());
        this.r_off = parseFloatStrict(st.nextToken());
        this.r_off_ground = parseFloatStrict(st.nextToken());
        this.highVoltage = parseFloatStrict(st.nextToken());
      } catch (e) {
      }
    } else {
      this.r_on = 0.1;
      this.r_off = 1e10;
      this.r_off_ground = 1e8;
      this.highVoltage = GateElm.lastHighVoltage;
    }
    this.noDiagonal = true;
    this.allocNodes();
  }
  dump() {
    return super.dump() + " " + this.r_on + " " + this.r_off + " " + this.r_off_ground + " " + this.highVoltage;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ron", this.r_on);
    CircuitXMLSerializer.dumpAttr(elem, "roff", this.r_off);
    CircuitXMLSerializer.dumpAttr(elem, "rog", this.r_off_ground);
    CircuitXMLSerializer.dumpAttr(elem, "hi", this.highVoltage);
    if (this.busWidth !== 1)
      CircuitXMLSerializer.dumpAttr(elem, "bw", this.busWidth);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.r_on = xml.parseDoubleAttr("ron", this.r_on);
    this.r_off = xml.parseDoubleAttr("roff", this.r_off);
    this.r_off_ground = xml.parseDoubleAttr("rog", this.r_off_ground);
    this.highVoltage = xml.parseDoubleAttr("hi", this.highVoltage);
    this.busWidth = xml.parseIntAttr("bw", 1);
    this.allocNodes();
  }
  getDumpType() {
    return 180;
  }
  getXmlDumpType() {
    return "ts";
  }
  setHighVoltage(hv) {
    this.highVoltage = hv;
  }
  setPoints() {
    super.setPoints();
    const len = 32;
    this.calcLeads(len);
    this.adjustLeadsToGrid((this.flags & this.FLAG_FLIP_X) !== 0, (this.flags & this.FLAG_FLIP_Y) !== 0);
    this.ps = new Point();
    const hs = 16;
    let ww = 16;
    if (ww > this.dn / 2) ww = Math.trunc(this.dn / 2);
    const triPoints = this.newPointArray(3);
    this.interpPoint2(this.lead1, this.lead2, triPoints[0], triPoints[1], 0, hs + 2);
    triPoints[2] = this.interpPoint(this.lead1, this.lead2, 0.5 + (ww - 2) / len);
    this.gatePoly = this.createPolygon(triPoints);
    this.busLead1 = this.interpPoint(this.point1, this.lead1, 1 - 2 / this.dn);
    const sign = (this.flags & this.FLAG_FLIP) === 0 ? -1 : 1;
    this.point3 = this.interpPoint(this.lead1, this.lead2, 0.5, sign * hs);
    this.lead3 = this.interpPoint(this.lead1, this.lead2, 0.5, sign * (hs / 2 + 2));
  }
  draw(g) {
    const hs = 16;
    this.setBbox(this.point1, this.point2, hs);
    this.setVoltageColor(g, this.nodes[2 * this.busWidth].v);
    CircuitElm.drawThickLine(g, this.point3, this.lead3);
    if (this.busWidth > 1) {
      this.setVoltageColor(g, this.nodes[0].v);
      CircuitElm.drawThickLine(g, this.point1, this.busLead1, 5);
      this.setVoltageColor(g, this.nodes[this.busWidth].v);
      CircuitElm.drawThickLine(g, this.lead2, this.point2, 5);
    } else {
      this.draw2Leads(g);
    }
    g.setColor(CircuitElm.lightGrayColor);
    CircuitElm.drawThickPolygon(g, this.gatePoly);
    this.curcount = this.updateDotCountImpl(this.current, this.curcount);
    this.drawDots(g, this.lead2, this.point2, this.curcount);
    this.drawPosts(g);
  }
  controlNode() {
    return 2 * this.busWidth;
  }
  internalNode(bit) {
    return 2 * this.busWidth + 1 + bit;
  }
  calculateCurrent() {
    this.current = 0;
    for (let i = 0; i < this.busWidth; i++) {
      const intNode = this.internalNode(i);
      const outNode = this.busWidth + i;
      const current31 = (this.nodes[intNode].v - this.nodes[outNode].v) / this.resistance;
      const current10 = this.r_off_ground === 0 ? 0 : this.nodes[outNode].v / this.r_off_ground;
      this.current += current31 - current10;
    }
  }
  getCurrentIntoNode(n) {
    if (n >= this.busWidth && n < 2 * this.busWidth) return this.current / this.busWidth;
    return 0;
  }
  nonLinear() {
    return true;
  }
  stamp() {
    for (let i = 0; i < this.busWidth; i++) {
      CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[this.internalNode(i)], this.voltageSources[i]);
      CircuitElm.sim.stampNonLinear(this.nodes[this.internalNode(i)]);
      CircuitElm.sim.stampNonLinear(this.nodes[this.busWidth + i]);
    }
  }
  doStep() {
    this.open = this.nodes[this.controlNode()].v < this.highVoltage * 0.5;
    this.resistance = this.open ? this.r_off : this.r_on;
    for (let i = 0; i < this.busWidth; i++) {
      const intNode = this.internalNode(i);
      const outNode = this.busWidth + i;
      CircuitElm.sim.stampResistor(this.nodes[intNode], this.nodes[outNode], this.resistance);
      if (this.r_off_ground > 0)
        CircuitElm.sim.stampResistor(this.nodes[outNode], CircuitNode.ground, this.r_off_ground);
      CircuitElm.sim.updateVoltageSource(
        CircuitNode.ground,
        this.nodes[intNode],
        this.voltageSources[i],
        this.nodes[i].v > this.highVoltage * 0.5 ? this.highVoltage : 0
      );
    }
  }
  drag(xx, yy) {
    let flip = xx < this.x === yy < this.y;
    xx = this.snapGrid(xx);
    yy = this.snapGrid(yy);
    if (Math.abs(this.x - xx) < Math.abs(this.y - yy)) xx = this.x;
    else {
      flip = !flip;
      yy = this.y;
    }
    this.flags = flip ? this.flags | this.FLAG_FLIP : this.flags & ~this.FLAG_FLIP;
    super.drag(xx, yy);
  }
  getPostCount() {
    return 2 * this.busWidth + 1;
  }
  getInternalNodeCount() {
    return this.busWidth;
  }
  getVoltageSourceCount() {
    return this.busWidth;
  }
  setVoltageSource(n, v) {
    if (!this.voltageSources || this.voltageSources.length !== this.busWidth)
      this.voltageSources = new Array(this.busWidth);
    this.voltageSources[n] = v;
    v.setNodes(CircuitNode.ground, this.nodes[this.internalNode(n)]);
  }
  getMatrixConnection(n1, n2) {
    for (let i = 0; i < this.busWidth; i++)
      if (this.comparePair(n1, n2, this.busWidth + i, this.internalNode(i))) return true;
    return false;
  }
  getPost(n) {
    if (n < this.busWidth)
      return this.busWidth > 1 ? new Point(this.point1.x, this.point1.y, n) : this.point1;
    if (n < 2 * this.busWidth)
      return this.busWidth > 1 ? new Point(this.point2.x, this.point2.y, n - this.busWidth) : this.point2;
    return this.point3;
  }
  getPostWidth(n) {
    return n < 2 * this.busWidth ? this.busWidth : 1;
  }
  getInfo(arr) {
    arr[0] = "tri-state buffer";
    if (this.busWidth > 1) arr[0] += " (" + this.busWidth + ")";
    arr[1] = this.open ? "open" : "closed";
    arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
    arr[3] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
    arr[4] = "Vc = " + CircuitElm.getVoltageText(this.nodes[this.controlNode()].v);
  }
  getConnection(n1, n2) {
    return false;
  }
  hasGroundConnection(n1) {
    return n1 >= this.busWidth && n1 < 2 * this.busWidth;
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("On Resistance (ohms)", this.r_on, 0, 0).setPositive();
    if (n === 1) return new EditInfo("Off Resistance (ohms)", this.r_off, 0, 0).setPositive();
    if (n === 2) return new EditInfo("Output Pulldown Resistance (ohms)", this.r_off_ground, 0, 0).setPositive();
    if (n === 3) return new EditInfo("High Logic Voltage", this.highVoltage, 1, 10).setUnitStep();
    if (n === 4) return new EditInfo("Bus Width", this.busWidth, 1, 32).setDimensionless();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0 && ei.value > 0) this.r_on = ei.value;
    if (n === 1 && ei.value > 0) this.r_off = ei.value;
    if (n === 2 && ei.value > 0) this.r_off_ground = ei.value;
    if (n === 3) this.highVoltage = GateElm.lastHighVoltage = ei.value;
    if (n === 4) {
      if (ei.value >= 1) {
        this.busWidth = Math.trunc(ei.value);
        this.allocNodes();
      } else ei.setError("must be >= 1");
    }
  }
  flipX(c2, count) {
    this.flags ^= this.FLAG_FLIP | this.FLAG_FLIP_X;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    this.flags ^= this.FLAG_FLIP | this.FLAG_FLIP_Y;
    super.flipY(c2, count);
  }
  flipXY(c2, count) {
    this.flags ^= this.FLAG_FLIP;
    super.flipXY(c2, count);
  }
}

class TriacElm extends CircuitElm {
  mt1node = 1;
  mt2node = 0;
  gnode = 2;
  mtinode = 3;
  diode03;
  diode30;
  state = false;
  i1 = 0;
  i2 = 0;
  ig = 0;
  curcount_1 = 0;
  curcount_2 = 0;
  curcount_g = 0;
  cresistance = 0;
  triggerI = 0;
  holdingI = 0;
  aresistance = 0;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.setDefaults();
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.setDefaults();
      this.triggerI = parseFloatStrict(st.nextToken());
      this.holdingI = parseFloatStrict(st.nextToken());
      this.cresistance = parseFloatStrict(st.nextToken());
      this.state = st.nextToken() === "true";
    }
    this.setup();
  }
  setDefaults() {
    this.holdingI = 82e-4;
    this.triggerI = 0.01;
    this.cresistance = 100;
  }
  setup() {
    this.diode03 = new Diode(CircuitElm.sim);
    this.diode03.setupForDefaultModel();
    this.diode30 = new Diode(CircuitElm.sim);
    this.diode30.setupForDefaultModel();
  }
  nonLinear() {
    return true;
  }
  reset() {
    this.diode03.reset();
    this.diode30.reset();
    this.curcount_1 = this.curcount_2 = this.curcount_g = 0;
  }
  getDumpType() {
    return 206;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ti", this.triggerI);
    CircuitXMLSerializer.dumpAttr(elem, "hi", this.holdingI);
    CircuitXMLSerializer.dumpAttr(elem, "cr", this.cresistance);
  }
  dumpXmlState(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "st", this.state);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.triggerI = xml.parseDoubleAttr("ti", this.triggerI);
    this.holdingI = xml.parseDoubleAttr("hi", this.holdingI);
    this.cresistance = xml.parseDoubleAttr("cr", this.cresistance);
    this.state = xml.parseBooleanAttr("st", this.state);
    this.setup();
  }
  hs = 8;
  arrows;
  plate1;
  plate2;
  gate;
  setPoints() {
    super.setPoints();
    let dir = 0;
    if (CircuitElm.abs(this.dx) > CircuitElm.abs(this.dy)) {
      dir = -CircuitElm.sign(this.dx) * CircuitElm.sign(this.dy);
      this.dn = CircuitElm.abs(this.dx);
      this.point2.y = this.point1.y;
    } else {
      dir = CircuitElm.sign(this.dy) * CircuitElm.sign(this.dx);
      this.dn = CircuitElm.abs(this.dy);
      this.point2.x = this.point1.x;
    }
    if (dir === 0) dir = 1;
    this.calcLeads(16);
    this.plate1 = this.newPointArray(2);
    this.plate2 = this.newPointArray(2);
    this.gate = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, this.plate1[0], this.plate1[1], 0, 16);
    this.interpPoint2(this.lead1, this.lead2, this.plate2[0], this.plate2[1], 1, 16);
    this.arrows = new Array(2);
    for (let i = 0; i !== 2; i++) {
      const sgn = -1 + i * 2;
      const p1 = this.interpPoint(this.lead1, this.lead2, i, 8 * sgn);
      const p2 = this.interpPoint(this.lead1, this.lead2, 1 - i, 16 * sgn);
      const p3 = this.interpPoint(this.lead1, this.lead2, 1 - i, 0 * sgn);
      this.arrows[i] = this.createPolygon(p1, p2, p3);
    }
    const gatelen = CircuitElm.app.gridSize;
    const leadlen = (this.dn - 16) / 2;
    const gatelenAdj = gatelen + leadlen % CircuitElm.app.gridSize;
    if (leadlen < gatelenAdj) {
      this.x2 = this.x;
      this.y2 = this.y;
      return;
    }
    this.gate[0] = this.interpPoint(this.lead2, this.point2, gatelenAdj / leadlen, gatelenAdj * dir);
    this.gate[1] = this.interpPoint(this.lead2, this.point2, gatelenAdj / leadlen, CircuitElm.app.gridSize * 2 * dir);
  }
  draw(g) {
    const v1 = this.nodes[0].v;
    const v2 = this.nodes[1].v;
    this.setBbox(this.point1, this.point2, 6);
    this.adjustBbox(this.gate[0], this.gate[1]);
    this.draw2Leads(g);
    this.setVoltageColor(g, v1);
    this.setPowerColor(g, true);
    CircuitElm.drawThickLine(g, this.plate1[0], this.plate1[1]);
    this.setVoltageColor(g, v2);
    this.setPowerColor(g, true);
    CircuitElm.drawThickLine(g, this.plate2[0], this.plate2[1]);
    g.fillPolygon(this.arrows[0]);
    this.setVoltageColor(g, v1);
    this.setPowerColor(g, true);
    g.fillPolygon(this.arrows[1]);
    this.setVoltageColor(g, this.nodes[this.gnode].v);
    CircuitElm.drawThickLine(g, this.lead2, this.gate[0]);
    CircuitElm.drawThickLine(g, this.gate[0], this.gate[1]);
    this.curcount_1 = this.updateDotCountImpl(this.i1, this.curcount_1);
    this.curcount_2 = this.updateDotCountImpl(this.i2, this.curcount_2);
    this.curcount_g = this.updateDotCountImpl(this.ig, this.curcount_g);
    if (!this.isCreating()) {
      this.drawDots(g, this.point1, this.lead2, this.curcount_2);
      this.drawDots(g, this.point2, this.lead2, this.curcount_1);
      this.drawDots(g, this.gate[1], this.gate[0], this.curcount_g);
      this.drawDots(g, this.gate[0], this.lead2, this.addCurCount(this.curcount_g, CircuitElm.distance(this.gate[1], this.gate[0])));
    }
    if ((this.needsHighlight() || this.isCreating()) && this.point1.x === this.point2.x && this.point2.y > this.point1.y) {
      g.setColor(CircuitElm.whiteColor);
      const ds = CircuitElm.sign(this.dx);
      g.drawString("MT1", this.lead2.x + (ds < 0 ? 5 : -30), this.lead2.y + 12);
      g.drawString("MT2", this.lead1.x + 5, this.lead1.y - 4);
      g.drawString("G", this.gate[0].x, this.gate[0].y + 12);
    }
    this.drawPosts(g);
  }
  getPost(n) {
    return n === 0 ? this.point1 : n === 1 ? this.point2 : this.gate[1];
  }
  getCurrentIntoNode(n) {
    if (n === 0) return -this.i2;
    if (n === 1) return -this.i1;
    return -this.ig;
  }
  getPostCount() {
    return 3;
  }
  getInternalNodeCount() {
    return 1;
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[this.mt1node]);
    CircuitElm.sim.stampNonLinear(this.nodes[this.mt2node]);
    CircuitElm.sim.stampNonLinear(this.nodes[this.gnode]);
    CircuitElm.sim.stampNonLinear(this.nodes[this.mtinode]);
    CircuitElm.sim.stampResistor(this.nodes[this.gnode], this.nodes[this.mt1node], this.cresistance);
    this.diode03.stamp(this.nodes[this.mt2node], this.nodes[this.mtinode]);
    this.diode30.stamp(this.nodes[this.mtinode], this.nodes[this.mt2node]);
  }
  startIteration() {
    if (Math.abs(this.i2) < this.holdingI) this.state = false;
    if (Math.abs(this.ig) > this.triggerI) this.state = true;
    this.aresistance = this.state ? 0.01 : 1e6;
  }
  doStep() {
    this.diode03.doStep(this.nodes[this.mt2node].v - this.nodes[this.mtinode].v);
    this.diode30.doStep(this.nodes[this.mtinode].v - this.nodes[this.mt2node].v);
    CircuitElm.sim.stampResistor(this.nodes[this.mtinode], this.nodes[this.mt1node], this.aresistance);
  }
  getInfo(arr) {
    arr[0] = "TRIAC";
    arr[1] = this.state ? "on" : "off";
    arr[2] = "Vmt2mt1 = " + CircuitElm.getVoltageText(this.nodes[this.mt2node].v - this.nodes[this.mt1node].v);
    arr[3] = "Imt1 = " + CircuitElm.getCurrentText(this.i1);
    arr[4] = "Imt2 = " + CircuitElm.getCurrentText(this.i2);
    arr[5] = "Ig = " + CircuitElm.getCurrentText(this.ig);
    arr[6] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  calculateCurrent() {
    if (this.aresistance === 0)
      this.i2 = 0;
    else
      this.i2 = (this.nodes[this.mtinode].v - this.nodes[this.mt1node].v) / this.aresistance;
    this.ig = -(this.nodes[this.mt1node].v - this.nodes[this.gnode].v) / this.cresistance;
    this.i1 = -this.i2 - this.ig;
  }
  getPower() {
    return (this.nodes[this.mt2node].v - this.nodes[this.mt1node].v) * this.i2 + (this.nodes[this.gnode].v - this.nodes[this.mt1node].v) * this.ig;
  }
  getEditInfo(n) {
    if (n === 0) return new EditInfo("Trigger Current (A)", this.triggerI, 0, 0).setPositive();
    if (n === 1) return new EditInfo("Holding Current (A)", this.holdingI, 0, 0).setPositive();
    if (n === 2) return new EditInfo("Gate-MT1 Resistance (ohms)", this.cresistance, 0, 0).setPositive();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.triggerI = ei.value;
    if (n === 1) this.holdingI = ei.value;
    if (n === 2) this.cresistance = ei.value;
  }
  canViewInScope() {
    return true;
  }
  getVoltageDiff() {
    return this.nodes[this.mt2node].v - this.nodes[this.mt1node].v;
  }
  getCurrent() {
    return this.i2;
  }
}

class TriodeElm extends CircuitElm {
  static FLAG_FLIP = 1;
  static FLAG_DSIGN_FIX = 2;
  mu;
  kg1;
  curcountp = 0;
  curcountc = 0;
  curcountg = 0;
  currentp = 0;
  currentg = 0;
  currentc = 0;
  gridCurrentR = 6e3;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.mu = 93;
      this.kg1 = 680;
      this.flags |= TriodeElm.FLAG_DSIGN_FIX;
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.mu = parseFloatStrict(st.nextToken());
      this.kg1 = parseFloatStrict(st.nextToken());
    }
    this.setup();
  }
  setup() {
    this.noDiagonal = true;
  }
  nonLinear() {
    return true;
  }
  reset() {
    this.curcount = 0;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "mu", this.mu);
    CircuitXMLSerializer.dumpAttr(elem, "kg", this.kg1);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.mu = xml.parseDoubleAttr("mu", this.mu);
    this.kg1 = xml.parseDoubleAttr("kg", this.kg1);
  }
  getDumpType() {
    return 173;
  }
  plate;
  grid;
  cath;
  midgrid;
  midcath;
  circler = 0;
  setPoints() {
    super.setPoints();
    const s = (this.flags & TriodeElm.FLAG_DSIGN_FIX) !== 0 ? this.dsign : 1;
    const flip = (this.flags & TriodeElm.FLAG_FLIP) !== 0 ? -s : s;
    this.plate = this.newPointArray(4);
    this.grid = this.newPointArray(8);
    this.cath = this.newPointArray(4);
    this.grid[0] = this.point1;
    const nearw = 8 * flip;
    this.plate[1] = this.interpPoint(this.point1, this.point2, 1, nearw);
    const farw = 32 * flip;
    this.plate[0] = this.interpPoint(this.point1, this.point2, 1, farw);
    const platew = 18;
    this.interpPoint2(this.point2, this.plate[1], this.plate[2], this.plate[3], 1, platew);
    this.circler = 24;
    this.grid[1] = this.interpPoint(this.point1, this.point2, (this.dn - this.circler) / this.dn, 0);
    for (let i = 0; i !== 3; i++) {
      this.grid[2 + i * 2] = this.interpPoint(this.grid[1], this.point2, (i * 3 + 1) / 4.5, 0);
      this.grid[3 + i * 2] = this.interpPoint(this.grid[1], this.point2, (i * 3 + 2) / 4.5, 0);
    }
    this.midgrid = this.point2;
    const cathw = 16 * flip;
    this.midcath = this.interpPoint(this.point1, this.point2, 1, -nearw);
    this.interpPoint2(this.point2, this.plate[1], this.cath[1], this.cath[2], -1, cathw);
    this.cath[3] = this.interpPoint(this.point2, this.plate[1], -1.2, -cathw);
    this.cath[0] = this.interpPoint(this.point2, this.plate[1], -farw / nearw, cathw);
  }
  draw(g) {
    g.setColor("#888888");
    CircuitElm.drawThickCircle(g, this.point2.x, this.point2.y, this.circler);
    this.setBbox(this.point1, this.plate[0], 16);
    this.adjustBbox(this.cath[0].x, this.cath[1].y, this.point2.x + this.circler, this.point2.y + this.circler);
    this.setVoltageColor(g, this.nodes[0].v);
    this.setPowerColor(g, this.currentp * (this.nodes[0].v - this.nodes[2].v));
    CircuitElm.drawThickLine(g, this.plate[0], this.plate[1]);
    CircuitElm.drawThickLine(g, this.plate[2], this.plate[3]);
    this.setVoltageColor(g, this.nodes[1].v);
    this.setPowerColor(g, this.currentg * (this.nodes[1].v - this.nodes[2].v));
    for (let i = 0; i !== 8; i += 2)
      CircuitElm.drawThickLine(g, this.grid[i], this.grid[i + 1]);
    this.setVoltageColor(g, this.nodes[2].v);
    this.setPowerColor(g, 0);
    for (let i = 0; i !== 3; i++)
      CircuitElm.drawThickLine(g, this.cath[i], this.cath[i + 1]);
    this.curcountp = this.updateDotCountImpl(this.currentp, this.curcountp);
    this.curcountc = this.updateDotCountImpl(this.currentc, this.curcountc);
    this.curcountg = this.updateDotCountImpl(this.currentg, this.curcountg);
    if (!this.isCreating()) {
      this.drawDots(g, this.plate[0], this.midgrid, this.curcountp);
      this.drawDots(g, this.midgrid, this.midcath, this.curcountc);
      this.drawDots(g, this.midcath, this.cath[1], this.addCurCount(this.curcountc, 8));
      this.drawDots(g, this.cath[1], this.cath[0], this.addCurCount(this.curcountc, 8));
      this.drawDots(g, this.point1, this.midgrid, this.curcountg);
    }
    this.drawPosts(g);
  }
  getCurrentIntoNode(n) {
    if (n === 2) return this.currentc;
    if (n === 0) return -this.currentp;
    return -this.currentg;
  }
  getPost(n) {
    return n === 0 ? this.plate[0] : n === 1 ? this.grid[0] : this.cath[0];
  }
  getPostCount() {
    return 3;
  }
  getPower() {
    return (this.nodes[this.plateN].v - this.nodes[this.cathN].v) * this.currentc + (this.nodes[this.gridN].v - this.nodes[this.cathN].v) * this.currentg;
  }
  getCurrent() {
    return this.currentc;
  }
  gridN = 1;
  cathN = 2;
  plateN = 0;
  lastv0 = 0;
  lastv1 = 0;
  lastv2 = 0;
  doStep() {
    const vs = [this.nodes[0].v, this.nodes[1].v, this.nodes[2].v];
    if (vs[1] > this.lastv1 + 0.5) vs[1] = this.lastv1 + 0.5;
    if (vs[1] < this.lastv1 - 0.5) vs[1] = this.lastv1 - 0.5;
    if (vs[2] > this.lastv2 + 0.5) vs[2] = this.lastv2 + 0.5;
    if (vs[2] < this.lastv2 - 0.5) vs[2] = this.lastv2 - 0.5;
    const vgk = vs[this.gridN] - vs[this.cathN];
    const vpk = vs[this.plateN] - vs[this.cathN];
    if (Math.abs(this.lastv0 - vs[0]) > 0.01 || Math.abs(this.lastv1 - vs[1]) > 0.01 || Math.abs(this.lastv2 - vs[2]) > 0.01)
      CircuitElm.sim.converged = false;
    this.lastv0 = vs[0];
    this.lastv1 = vs[1];
    this.lastv2 = vs[2];
    let ids = 0;
    let gm = 0;
    let Gds = 0;
    const ival = vgk + vpk / this.mu;
    this.currentg = 0;
    if (vgk > 0.01) {
      CircuitElm.sim.stampResistor(this.nodes[this.gridN], this.nodes[this.cathN], this.gridCurrentR);
      this.currentg = vgk / this.gridCurrentR;
    } else
      CircuitElm.sim.stampResistor(this.nodes[this.gridN], this.nodes[this.cathN], 1e8);
    if (ival < 0) {
      Gds = 1e-8;
      ids = vpk * Gds;
    } else {
      ids = Math.pow(ival, 1.5) / this.kg1;
      const q = 1.5 * Math.sqrt(ival) / this.kg1;
      Gds = q;
      gm = q / this.mu;
    }
    this.currentp = ids;
    this.currentc = ids + this.currentg;
    const rs = -ids + Gds * vpk + gm * vgk;
    CircuitElm.sim.stampMatrix(this.nodes[this.plateN], this.nodes[this.plateN], Gds);
    CircuitElm.sim.stampMatrix(this.nodes[this.plateN], this.nodes[this.cathN], -Gds - gm);
    CircuitElm.sim.stampMatrix(this.nodes[this.plateN], this.nodes[this.gridN], gm);
    CircuitElm.sim.stampMatrix(this.nodes[this.cathN], this.nodes[this.plateN], -Gds);
    CircuitElm.sim.stampMatrix(this.nodes[this.cathN], this.nodes[this.cathN], Gds + gm);
    CircuitElm.sim.stampMatrix(this.nodes[this.cathN], this.nodes[this.gridN], -gm);
    CircuitElm.sim.stampRightSide(this.nodes[this.plateN], rs);
    CircuitElm.sim.stampRightSide(this.nodes[this.cathN], -rs);
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[0]);
    CircuitElm.sim.stampNonLinear(this.nodes[1]);
    CircuitElm.sim.stampNonLinear(this.nodes[2]);
  }
  getInfo(arr) {
    arr[0] = "triode";
    const vac = this.nodes[this.plateN].v - this.nodes[this.cathN].v;
    const vgc = this.nodes[this.gridN].v - this.nodes[this.cathN].v;
    const vag = this.nodes[this.plateN].v - this.nodes[this.gridN].v;
    arr[1] = "Vac = " + CircuitElm.getVoltageText(vac);
    arr[2] = "Vgc = " + CircuitElm.getVoltageText(vgc);
    arr[3] = "Vag = " + CircuitElm.getVoltageText(vag);
    arr[4] = "Ic = " + CircuitElm.getUnitText(this.currentc, "A");
    arr[5] = "Ig = " + CircuitElm.getUnitText(this.currentg, "A");
  }
  // grid not connected to other terminals
  getConnection(n1, n2) {
    return !(n1 === 1 || n2 === 1);
  }
  getMatrixConnection(n1, n2) {
    return true;
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("mu", this.mu, 0, 0).setDimensionless().setPositive();
    if (n === 1)
      return new EditInfo("kg1", this.kg1, 0, 0).setDimensionless().setPositive();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.mu = ei.value;
    if (n === 1) this.kg1 = ei.value;
  }
  canViewInScope() {
    return true;
  }
  getVoltageDiff() {
    return this.nodes[this.plateN].v - this.nodes[this.cathN].v;
  }
  flipX(c2, count) {
    if (this.x === this.x2)
      this.flags ^= TriodeElm.FLAG_FLIP;
    if ((this.flags & TriodeElm.FLAG_DSIGN_FIX) === 0 && this.x !== this.x2)
      this.flags ^= TriodeElm.FLAG_FLIP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    if (this.y === this.y2)
      this.flags ^= TriodeElm.FLAG_FLIP;
    if ((this.flags & TriodeElm.FLAG_DSIGN_FIX) === 0 && this.y !== this.y2)
      this.flags ^= TriodeElm.FLAG_FLIP;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    this.flags ^= TriodeElm.FLAG_FLIP;
    super.flipXY(xmy, count);
  }
}

class TunnelDiodeElm extends CircuitElm {
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
    }
    this.setup();
  }
  nonLinear() {
    return true;
  }
  setup() {
  }
  getDumpType() {
    return 175;
  }
  hs = 8;
  poly;
  cathode;
  setPoints() {
    super.setPoints();
    this.calcLeads(16);
    this.cathode = this.newPointArray(4);
    const pa = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, pa[0], pa[1], 0, this.hs);
    this.interpPoint2(this.lead1, this.lead2, this.cathode[0], this.cathode[1], 1, this.hs);
    this.interpPoint2(this.lead1, this.lead2, this.cathode[2], this.cathode[3], 0.8, this.hs);
    this.poly = this.createPolygon(pa[0], pa[1], this.lead2);
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.hs);
    const v1 = this.nodes[0].v;
    const v2 = this.nodes[1].v;
    this.draw2Leads(g);
    this.setPowerColor(g, true);
    this.setVoltageColor(g, v1);
    g.fillPolygon(this.poly);
    this.setVoltageColor(g, v2);
    CircuitElm.drawThickLine(g, this.cathode[0], this.cathode[1]);
    CircuitElm.drawThickLine(g, this.cathode[2], this.cathode[0]);
    CircuitElm.drawThickLine(g, this.cathode[3], this.cathode[1]);
    this.doDots(g);
    this.drawPosts(g);
  }
  reset() {
    this.lastvoltdiff = this.curcount = 0;
  }
  lastvoltdiff = 0;
  limitStep(vnew, vold) {
    if (vnew > vold + 1)
      return vold + 1;
    if (vnew < vold - 1)
      return vold - 1;
    return vnew;
  }
  stamp() {
    CircuitElm.sim.stampNonLinear(this.nodes[0]);
    CircuitElm.sim.stampNonLinear(this.nodes[1]);
  }
  static pvp = 0.1;
  static pip = 47e-4;
  static pvv = 0.37;
  static pvt = 0.026;
  static pvpp = 0.525;
  static piv = 37e-5;
  doStep() {
    let voltdiff = this.nodes[0].v - this.nodes[1].v;
    if (Math.abs(voltdiff - this.lastvoltdiff) > 0.01)
      CircuitElm.sim.converged = false;
    voltdiff = this.limitStep(voltdiff, this.lastvoltdiff);
    this.lastvoltdiff = voltdiff;
    const { pvp, pip, pvv, pvt, pvpp, piv } = TunnelDiodeElm;
    const i0 = piv * Math.exp(-pvv);
    const i = pip * Math.exp(-pvpp / pvt) * (Math.exp(voltdiff / pvt) - 1) + pip * (voltdiff / pvp) * Math.exp(1 - voltdiff / pvp) + piv * Math.exp(voltdiff - pvv) - i0;
    const geq = pip * Math.exp(-pvpp / pvt) * Math.exp(voltdiff / pvt) / pvt + pip * Math.exp(1 - voltdiff / pvp) / pvp - Math.exp(1 - voltdiff / pvp) * pip * voltdiff / (pvp * pvp) + Math.exp(voltdiff - pvv) * piv;
    const nc = i - geq * voltdiff;
    CircuitElm.sim.stampConductance(this.nodes[0], this.nodes[1], geq);
    CircuitElm.sim.stampCurrentSource(this.nodes[0], this.nodes[1], nc);
  }
  calculateCurrent() {
    const voltdiff = this.nodes[0].v - this.nodes[1].v;
    const { pvp, pip, pvv, pvt, pvpp, piv } = TunnelDiodeElm;
    const i0 = piv * Math.exp(-pvv);
    this.current = pip * Math.exp(-pvpp / pvt) * (Math.exp(voltdiff / pvt) - 1) + pip * (voltdiff / pvp) * Math.exp(1 - voltdiff / pvp) + piv * Math.exp(voltdiff - pvv) - i0;
  }
  getInfo(arr) {
    arr[0] = "tunnel diode";
    arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
    arr[2] = "Vd = " + CircuitElm.getVoltageText(this.getVoltageDiff());
    arr[3] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
}

class UnijunctionElm extends CompositeElm {
  // node 0 = E
  // node 1 = B1
  // node 2 = B2
  static FLAG_FLIP = 2;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
    }
    this.setup();
  }
  static ujtModelString = "DiodeElm 1 4\rVoltageElm 4 5\rCCVSElm 4 5 6 0\rResistorElm 0 6\rVCCSElm 5 7 5 7 6 7 5\rCapacitorElm 5 7\rResistorElm 7 2\rResistorElm 3 5";
  static ujtExternalNodes = [1, 2, 3];
  static ujtModelDump = "2 x2n2646-emitter/0 0 0 0 0 0 0/2 2 1000*a/0 1000000/0 5 0.00028*(a-b)\\p0.00575*(c-d)*e/2 3.5e-11 0 0/0 38.15/0 2518";
  setup() {
    this.noDiagonal = true;
    this.flags |= CompositeElm.FLAG_ESCAPE;
    const st = new StringTokenizer(UnijunctionElm.ujtModelDump, "/");
    this.loadComposite(st, UnijunctionElm.ujtModelString, UnijunctionElm.ujtExternalNodes);
    CircuitElm.sim.adjustTimeStep = true;
  }
  dump() {
    return this.dumpWithMask(0);
  }
  reset() {
    super.reset();
    this.curcountb1 = this.curcountb2 = this.curcounte = 0;
  }
  getDumpType() {
    return 417;
  }
  b1;
  b2;
  emitterPoly;
  emitter;
  curcountb1 = 0;
  curcountb2 = 0;
  curcounte = 0;
  arrowPoly;
  hs = 16;
  draw(g) {
    this.setBbox(this.point1, this.b1[0], 0);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.b1[0], this.b1[1]);
    CircuitElm.drawThickLine(g, this.b1[1], this.b1[2]);
    this.setVoltageColor(g, this.nodes[2].v);
    CircuitElm.drawThickLine(g, this.b2[0], this.b2[1]);
    CircuitElm.drawThickLine(g, this.b2[1], this.b2[2]);
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.emitter[0], this.emitter[1]);
    CircuitElm.drawThickLine(g, this.emitter[1], this.emitter[2]);
    g.fillPolygon(this.arrowPoly);
    this.setPowerColor(g, true);
    g.fillPolygon(this.emitterPoly);
    const ib2 = -this.getCurrentIntoNode(2);
    const ib1 = -this.getCurrentIntoNode(1);
    this.curcountb2 = this.updateDotCountImpl(ib2, this.curcountb2);
    this.curcountb1 = this.updateDotCountImpl(ib1, this.curcountb1);
    this.curcounte = this.updateDotCountImpl(-ib1 - ib2, this.curcounte);
    if (this.curcountb1 !== 0 || this.curcountb2 !== 0) {
      this.drawDots(g, this.b1[0], this.b1[1], this.curcountb1);
      this.drawDots(g, this.b1[1], this.b1[2], this.addCurCount(this.curcountb1, 8));
      this.drawDots(g, this.b2[0], this.b2[1], this.curcountb2);
      this.drawDots(g, this.b2[1], this.b2[2], this.addCurCount(this.curcountb2, 8));
      this.drawDots(g, this.emitter[0], this.emitter[1], this.curcounte);
      this.drawDots(g, this.emitter[1], this.emitter[2], this.curcounte);
    }
    this.drawPosts(g);
  }
  setPoints() {
    super.setPoints();
    const flip = this.hasFlag(UnijunctionElm.FLAG_FLIP) ? -1 : 1;
    const hs2 = this.hs * this.dsign * flip;
    this.b1 = this.newPointArray(3);
    this.b2 = this.newPointArray(3);
    this.emitter = this.newPointArray(3);
    const p1 = this.interpPoint(this.point1, this.point2, 0, -hs2);
    const p2 = this.interpPoint(this.point1, this.point2, 1, -hs2);
    this.interpPoint2(p1, p2, this.b1[0], this.b2[0], 1, -hs2);
    this.interpPoint2(p1, p2, this.b1[1], this.b2[1], 1, -hs2 / 2);
    this.interpPoint2(p1, p2, this.b1[2], this.b2[2], 1 - 10 / this.dn, -hs2 / 2);
    this.emitter[0] = this.interpPoint(p1, p2, 0, hs2);
    this.emitter[1] = this.interpPoint(p1, p2, 1 - 28 / this.dn, hs2);
    this.emitter[2] = this.interpPoint(p1, p2, 1 - 14 / this.dn);
    const ra = this.newPointArray(4);
    this.interpPoint2(p1, p2, ra[0], ra[1], 1 - 13 / this.dn, this.hs);
    this.interpPoint2(p1, p2, ra[2], ra[3], 1 - 10 / this.dn, this.hs);
    this.emitterPoly = this.createPolygon(ra[0], ra[1], ra[3], ra[2]);
    this.arrowPoly = this.calcArrow(this.emitter[1], this.emitter[2], 8, 3);
  }
  getPost(n) {
    return n === 0 ? this.emitter[0] : n === 1 ? this.b1[0] : this.b2[0];
  }
  getPostCount() {
    return 3;
  }
  getInfo(arr) {
    arr[0] = "unijunction transistor";
    arr[1] = "Ie = " + CircuitElm.getCurrentText(-this.getCurrentIntoNode(0));
    arr[2] = "Ib2 = " + CircuitElm.getCurrentText(-this.getCurrentIntoNode(2));
    arr[3] = "Veb1 = " + CircuitElm.getVoltageText(this.nodes[0].v - this.nodes[1].v);
    arr[4] = "Vb2b1 = " + CircuitElm.getVoltageText(this.nodes[2].v - this.nodes[1].v);
    arr[5] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
  }
  flipX(c2, count) {
    if (this.dx === 0)
      this.flags ^= UnijunctionElm.FLAG_FLIP;
    super.flipX(c2, count);
  }
  flipY(c2, count) {
    if (this.dy === 0)
      this.flags ^= UnijunctionElm.FLAG_FLIP;
    super.flipY(c2, count);
  }
  flipXY(xmy, count) {
    this.flags ^= UnijunctionElm.FLAG_FLIP;
    super.flipXY(xmy, count);
  }
}

class ControlledSourceElm extends CircuitElm {
  static diamondSize = 18;
  engine = new ExprEngine(this);
  get expr() {
    return this.engine.expr;
  }
  get exprString() {
    return this.engine.exprString;
  }
  center;
  side1;
  side2;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.setExpr(this.getDefaultExpr());
    } else {
      super(xa, ya, xb, yb, f);
      this.setExpr(this.getDefaultExpr());
    }
  }
  getPostCount() {
    return 2;
  }
  nonLinear() {
    return true;
  }
  getRefNodeCount() {
    return this.engine ? this.engine.getRefNodeCount() : 0;
  }
  resolveExprRefs(elmList) {
    this.engine.resolveRefs(elmList);
  }
  setParentList(elmList) {
    super.setParentList(elmList);
    this.engine.resolveRefElmsByNode(elmList);
  }
  // these two sources have no input pins, so every expression input is a reference
  setExpr(exprStr) {
    this.engine.parse(exprStr);
    this.engine.alloc(0);
    this.allocNodes();
  }
  parseExpr(ei) {
    const err = this.engine.parse(this.engine.exprString);
    this.engine.alloc(0);
    this.allocNodes();
    if (err != null && ei != null) {
      ei.setErrorFieldName(this.getExprLabel());
      ei.setError(Locale.LS("Parse error in expression") + ": " + this.engine.exprString + ": " + err);
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ex", this.engine.exprString);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.engine.exprString = xml.parseStringAttr("ex", this.engine.exprString) ?? this.engine.exprString;
    this.parseExpr();
  }
  // the diamond's long diagonal runs along the element; the leads meet its two tips
  setPoints() {
    super.setPoints();
    const d = ControlledSourceElm.diamondSize;
    this.calcLeads(d * 2);
    this.center = this.interpPoint(this.point1, this.point2, 0.5);
    this.side1 = this.interpPoint(this.point1, this.point2, 0.5, d);
    this.side2 = this.interpPoint(this.point1, this.point2, 0.5, -d);
  }
  drawDiamond(g) {
    CircuitElm.drawThickLine(g, this.lead1, this.side1);
    CircuitElm.drawThickLine(g, this.side1, this.lead2);
    CircuitElm.drawThickLine(g, this.lead2, this.side2);
    CircuitElm.drawThickLine(g, this.side2, this.lead1);
  }
  // same widening schedule VCCSElm uses, so a hard-to-converge expression still settles
  getConvergeLimit() {
    const sim = SimulationManager.theSim;
    if (sim.subIterations < 10) return 1e-3;
    if (sim.subIterations < 200) return 0.01;
    return 0.1;
  }
  stepFinished() {
    this.engine.stepFinished(this.getOutputValue());
  }
  reset() {
    super.reset();
    this.engine.reset();
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo(EditInfo.makeLink("customfunction.html", this.getExprLabel()), 0, -1, -1);
      ei.text = this.engine.exprString;
      ei.disallowSliders();
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.engine.exprString = ei.textf.value;
      this.parseExpr(ei);
    }
  }
  getInfo(arr) {
    arr[0] = this.getElmType();
    arr[1] = this.getExprLabel() + " = " + this.engine.exprString;
    arr[2] = "V = " + CircuitElm.getVoltageText(this.getVoltageDiff());
    arr[3] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
    this.engine.addUnresolvedInfo(arr, 4);
  }
  getVoltageDiff() {
    return this.nodes[1].v - this.nodes[0].v;
  }
  getPower() {
    return -this.getVoltageDiff() * this.current;
  }
}

class ControlledCurrentElm extends ControlledSourceElm {
  broken = false;
  ashaft1;
  ashaft2;
  arrow;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0)
      super(xa, ya);
    else
      super(xa, ya, xb, yb, f, st);
  }
  getDefaultExpr() {
    return ".001*v(in)";
  }
  getOutputValue() {
    return this.current;
  }
  getExprLabel() {
    return "Output Current";
  }
  // integer dump types are for the obsolete text format; this element is XML only
  getDumpType() {
    return 0;
  }
  getXmlDumpType() {
    return "ci";
  }
  getElmType() {
    return "Controlled Current Source";
  }
  getVoltageSourceCount() {
    return 0;
  }
  setPoints() {
    super.setPoints();
    this.ashaft1 = this.interpPoint(this.lead1, this.lead2, 0.3);
    this.ashaft2 = this.interpPoint(this.lead1, this.lead2, 0.7 - 0.1);
    const tip = this.interpPoint(this.lead1, this.lead2, 0.85 - 0.1);
    this.arrow = this.calcArrow(this.center, tip, 7, 6);
  }
  stamp() {
    const sim = SimulationManager.theSim;
    if (this.broken) {
      sim.stampResistor(this.nodes[0], this.nodes[1], 1e8);
      return;
    }
    sim.stampNonLinear(this.nodes[0]);
    sim.stampNonLinear(this.nodes[1]);
  }
  doStep() {
    const sim = SimulationManager.theSim;
    if (this.broken || this.expr == null) {
      this.current = 0;
      return;
    }
    if (!this.engine.checkConvergence(this.getConvergeLimit()))
      sim.converged = false;
    const rs = this.engine.evalAndStamp(false);
    sim.stampCurrentSource(this.nodes[0], this.nodes[1], rs);
    this.current = this.engine.value;
    this.engine.saveInputs();
  }
  // our output is a current source from post 1 to post 2
  stampInputDerivative(pos, neg, dx) {
    SimulationManager.theSim.stampVCCurrentSource(this.nodes[0], this.nodes[1], pos, neg, dx);
  }
  stampInputDerivativeVS(ivs, dx) {
    SimulationManager.theSim.stampCCCS(this.nodes[0], this.nodes[1], ivs, dx);
  }
  // a current source with nowhere for the current to go is a matrix error, so check
  validate() {
    const fpi = new FindPathInfo(FindPathInfo.INDUCT, this, this.getNode(1), SimulationManager.theSim);
    this.broken = !fpi.findPath(this.getNode(0));
    return true;
  }
  draw(g) {
    this.draw2Leads(g);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.gray);
    this.setPowerColor(g, false);
    this.drawDiamond(g);
    CircuitElm.drawThickLine(g, this.ashaft1, this.ashaft2);
    g.fillPolygon(this.arrow);
    this.setBbox(this.point1, this.point2, ControlledSourceElm.diamondSize);
    this.doDots(g);
    this.drawPosts(g);
  }
  getInfo(arr) {
    super.getInfo(arr);
    if (this.broken) {
      let i = 0;
      while (arr[i] != null) i++;
      arr[i] = "(no current path)";
    }
  }
}

class ControlledVoltageElm extends ControlledSourceElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0)
      super(xa, ya);
    else
      super(xa, ya, xb, yb, f, st);
  }
  getDefaultExpr() {
    return "v(in)";
  }
  getOutputValue() {
    return this.getVoltageDiff();
  }
  getExprLabel() {
    return "Output Voltage";
  }
  // integer dump types are for the obsolete text format; this element is XML only
  getDumpType() {
    return 0;
  }
  getXmlDumpType() {
    return "cv";
  }
  getElmType() {
    return "Controlled Voltage Source";
  }
  getVoltageSourceCount() {
    return 1;
  }
  // tell the voltage source which nodes it sits between, so assignMatrix() can find
  // its matrix.  same order as the stamp below.
  setVoltageSource(n, v) {
    super.setVoltageSource(n, v);
    v.setNodes(this.nodes[0], this.nodes[1]);
  }
  stamp() {
    const sim = SimulationManager.theSim;
    sim.stampNonLinearVS(this.voltSource);
    sim.stampVoltageSource(this.nodes[0], this.nodes[1], this.voltSource);
  }
  doStep() {
    const sim = SimulationManager.theSim;
    if (this.expr == null)
      return;
    if (!this.engine.checkConvergence(this.getConvergeLimit()))
      sim.converged = false;
    const rs = this.engine.evalAndStamp(false);
    const v0 = this.engine.value;
    if (Math.abs(this.nodes[1].v - this.nodes[0].v - v0) > Math.abs(v0) * 0.01 && sim.subIterations < 100)
      sim.converged = false;
    sim.stampRightSideVS(this.voltSource, rs);
    this.engine.saveInputs();
  }
  // our output is a voltage source, so derivatives go into its matrix row
  stampInputDerivative(pos, neg, dx) {
    const sim = SimulationManager.theSim;
    sim.stampMatrixNV(this.voltSource, pos, -dx);
    sim.stampMatrixNV(this.voltSource, neg, dx);
  }
  stampInputDerivativeVS(ivs, dx) {
    SimulationManager.theSim.stampMatrixVV(this.voltSource, ivs, -dx);
  }
  setCurrent(_vs, c) {
    this.current = c;
  }
  draw(g) {
    this.draw2Leads(g);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : Color.gray);
    this.setPowerColor(g, false);
    this.drawDiamond(g);
    g.setFont(new Font("SansSerif", 0, 12));
    const pm = this.interpPoint(this.lead1, this.lead2, 0.3);
    const pp = this.interpPoint(this.lead1, this.lead2, 0.7);
    this.drawCenteredText(g, "−", pm.x, pm.y, true);
    this.drawCenteredText(g, "+", pp.x, pp.y, true);
    this.setBbox(this.point1, this.point2, ControlledSourceElm.diamondSize);
    this.doDots(g);
    this.drawPosts(g);
  }
}

class VCOElm extends ChipElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
    } else {
      super(xa, ya, xb, yb, f, st);
    }
  }
  getChipName() {
    return "VCO";
  }
  setupPins() {
    this.sizeX = 2;
    this.sizeY = 4;
    this.pins = new Array(6);
    this.pins[0] = new Pin(this, 0, ChipElm.SIDE_W, "Vi");
    this.pins[1] = new Pin(this, 3, ChipElm.SIDE_W, "Vo");
    this.pins[1].output = true;
    this.pins[2] = new Pin(this, 0, ChipElm.SIDE_E, "C");
    this.pins[3] = new Pin(this, 1, ChipElm.SIDE_E, "C");
    this.pins[4] = new Pin(this, 2, ChipElm.SIDE_E, "R1");
    this.pins[4].output = true;
    this.pins[5] = new Pin(this, 3, ChipElm.SIDE_E, "R2");
    this.pins[5].output = true;
  }
  nonLinear() {
    return true;
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[1], this.pins[1].voltSource);
    CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[4], this.pins[4].voltSource, 0);
    CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[5], this.pins[5].voltSource, 5);
    CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[3], this.cResistance);
    CircuitElm.sim.stampNonLinear(this.nodes[2]);
    CircuitElm.sim.stampNonLinear(this.nodes[3]);
  }
  cResistance = 1e6;
  cCurrent = 0;
  cDir = 0;
  doStep() {
    const vc = this.nodes[3].v - this.nodes[2].v;
    let vo = this.nodes[1].v;
    let dir = vo < 2.5 ? 1 : -1;
    if (vo < 2.5 && vc > 4.5) {
      vo = 5;
      dir = -1;
    }
    if (vo > 2.5 && vc < 0.5) {
      vo = 0;
      dir = 1;
    }
    CircuitElm.sim.updateVoltageSource(CircuitNode.ground, this.nodes[1], this.pins[1].voltSource, vo);
    CircuitElm.sim.stampMatrixVN(this.nodes[2], this.pins[4].voltSource, dir);
    CircuitElm.sim.stampMatrixVN(this.nodes[2], this.pins[5].voltSource, dir);
    CircuitElm.sim.stampMatrixVN(this.nodes[3], this.pins[4].voltSource, -dir);
    CircuitElm.sim.stampMatrixVN(this.nodes[3], this.pins[5].voltSource, -dir);
    this.cDir = dir;
  }
  // can't do this in calculateCurrent() because it's called before
  // we get pins[4].current and pins[5].current, which we need
  computeCurrent() {
    if (this.cResistance === 0)
      return;
    const c = this.cDir * (this.pins[4].current + this.pins[5].current) + (this.nodes[3].v - this.nodes[2].v) / this.cResistance;
    this.pins[2].current = -c;
    this.pins[3].current = c;
    this.pins[0].current = -this.pins[4].current;
  }
  draw(g) {
    this.computeCurrent();
    this.drawChip(g);
  }
  getPostCount() {
    return 6;
  }
  getVoltageSourceCount() {
    return 3;
  }
  getDumpType() {
    return 158;
  }
  getMatrixConnection(n1, n2) {
    return true;
  }
  isDigitalChip() {
    return false;
  }
}

class VCVSElm extends VCCSElm {
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0)
      super(xa, ya);
    else
      super(xa, ya, xb, yb, f, st);
  }
  setupPins() {
    if (!this.inputCount)
      this.inputCount = 0;
    this.sizeX = 2;
    this.sizeY = this.inputCount > 2 ? this.inputCount : 2;
    this.pins = new Array(this.inputCount + 2);
    for (let i = 0; i !== this.inputCount; i++)
      this.pins[i] = new Pin(this, i, ChipElm.SIDE_W, String.fromCharCode(65 + i));
    this.pins[this.inputCount] = new Pin(this, 0, ChipElm.SIDE_E, "V+");
    this.pins[this.inputCount].output = true;
    this.pins[this.inputCount + 1] = new Pin(this, 1, ChipElm.SIDE_E, "V-");
    this.allocExprArrays();
    this.allocNodes();
  }
  getChipName() {
    return "VCVS";
  }
  stamp() {
    const sim = SimulationManager.theSim;
    const vs = this.pins[this.inputCount].voltSource;
    sim.stampNonLinearVS(vs);
    sim.stampVoltageSource(this.nodes[this.inputCount + 1], this.nodes[this.inputCount], vs);
  }
  doStep() {
    const sim = SimulationManager.theSim;
    if (!this.engine.checkConvergence(this.getConvergeLimit()))
      sim.converged = false;
    const vn = this.pins[this.inputCount].voltSource;
    if (this.expr != null) {
      const rs = this.engine.evalAndStamp(false);
      const v0 = this.engine.value;
      if (Math.abs(this.nodes[this.inputCount].v - this.nodes[this.inputCount + 1].v - v0) > Math.abs(v0) * 0.01 && sim.subIterations < 100)
        sim.converged = false;
      sim.stampRightSideVS(vn, rs);
    }
    this.engine.saveInputs();
  }
  // our output is a voltage source, so derivatives go into its matrix row
  stampInputDerivative(pos, neg, dx) {
    const sim = SimulationManager.theSim;
    const vn = this.pins[this.inputCount].voltSource;
    sim.stampMatrixNV(vn, pos, -dx);
    sim.stampMatrixNV(vn, neg, dx);
  }
  stampInputDerivativeVS(ivs, dx) {
    SimulationManager.theSim.stampMatrixVV(this.pins[this.inputCount].voltSource, ivs, -dx);
  }
  stepFinished() {
    this.exprState.updateLastValues(this.nodes[this.inputCount].v - this.nodes[this.inputCount + 1].v);
  }
  getPostCount() {
    return this.inputCount + 2;
  }
  getVoltageSourceCount() {
    return 1;
  }
  getDumpType() {
    return 212;
  }
  hasCurrentOutput() {
    return false;
  }
  setVoltageSource(j, vs) {
    super.setVoltageSource(j, vs);
    vs.setNodes(this.nodes[this.inputCount + 1], this.nodes[this.inputCount]);
  }
  setCurrent(vs, c) {
    if (this.pins[this.inputCount].voltSource === vs) {
      this.pins[this.inputCount].current = c;
      this.pins[this.inputCount + 1].current = -c;
    }
  }
}

class VarRailElm extends RailElm {
  slider = null;
  labelEl = null;
  sliderText = "Voltage";
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya, VoltageElm.WF_VAR);
      this.sliderText = "Voltage";
      this.frequency = this.maxVoltage;
      this.createSlider();
    } else {
      super(xa, ya, xb, yb, f, st);
      let text = st.nextToken();
      while (st.hasMoreTokens())
        text += " " + st.nextToken();
      this.sliderText = text.replace(/%2[bB]/g, "+");
      this.createSlider();
    }
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "st", this.sliderText);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.sliderText = xml.parseStringAttr("st", this.sliderText);
    if (this.labelEl != null)
      this.labelEl.textContent = Locale.LS(this.sliderText);
    const value = Math.trunc((this.frequency - this.bias) * 100 / (this.maxVoltage - this.bias));
    this.slider?.setValue(value);
  }
  getDumpType() {
    return 172;
  }
  isVarRailElm() {
    return true;
  }
  dump() {
    return super.dump() + " " + this.sliderText.replace(/\+/g, "%2B");
  }
  createSlider() {
    this.waveform = VoltageElm.WF_VAR;
    const denom = this.maxVoltage - this.bias;
    const value = denom !== 0 ? Math.trunc((this.frequency - this.bias) * 100 / denom) : 0;
    const lbl = document.createElement("div");
    lbl.textContent = Locale.LS(this.sliderText);
    lbl.className = "topSpace";
    this.labelEl = lbl;
    CircuitElm.app.addWidgetToVerticalPanel(lbl);
    this.slider = new Scrollbar(Scrollbar.HORIZONTAL, value, 1, 0, 101);
    CircuitElm.app.addWidgetToVerticalPanel(this.slider.element);
  }
  getVoltage() {
    this.frequency = this.slider.getValue() * (this.maxVoltage - this.bias) / 100 + this.bias;
    return this.frequency;
  }
  delete() {
    if (this.labelEl != null)
      CircuitElm.app.removeWidgetFromVerticalPanel(this.labelEl);
    if (this.slider != null)
      CircuitElm.app.removeWidgetFromVerticalPanel(this.slider.element);
    super.delete();
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Min Voltage", this.bias, -20, 20).setUnitStep();
    if (n === 1)
      return new EditInfo("Max Voltage", this.maxVoltage, -20, 20).setUnitStep();
    if (n === 2) {
      const ei = new EditInfo("Slider Text", 0, -1, -1);
      ei.text = this.sliderText;
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.bias = ei.value;
    if (n === 1)
      this.maxVoltage = ei.value;
    if (n === 2) {
      this.sliderText = ei.textf.value;
      if (this.labelEl != null)
        this.labelEl.textContent = Locale.LS(this.sliderText);
      CircuitElm.app.setiFrameHeight();
    }
  }
  getShortcut() {
    return 0;
  }
  setMouseElm(v) {
    super.setMouseElm(v);
    this.slider?.draw();
  }
}

class VaractorElm extends DiodeElm {
  baseCapacitance;
  capacitance = 0;
  capCurrent = 0;
  // DiodeElm.lastvoltdiff = volt diff from last iteration
  // capvoltdiff = volt diff from last timestep
  compResistance = 0;
  capvoltdiff = 0;
  plate1;
  plate2;
  voltSourceValue = 0;
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.baseCapacitance = 4e-12;
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f, st);
      this.capvoltdiff = parseFloatStrict(st.nextToken());
      this.baseCapacitance = parseFloatStrict(st.nextToken());
    }
  }
  getDumpType() {
    return 176;
  }
  getElmType() {
    return "varactor";
  }
  getInfo(arr) {
    super.getInfo(arr);
    arr[0] = "varactor";
    arr[5] = "C = " + CircuitElm.getUnitText(this.capacitance, "F");
  }
  stepFinished() {
    this.capvoltdiff = this.nodes[0].v - this.nodes[1].v;
  }
  calculateCurrent() {
    super.calculateCurrent();
    this.current += this.capCurrent;
  }
  reset() {
    super.reset();
    this.capvoltdiff = 0;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "ca", this.capvoltdiff);
    CircuitXMLSerializer.dumpAttr(elem, "ba", this.baseCapacitance);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.capvoltdiff = xml.parseDoubleAttr("ca", this.capvoltdiff);
    this.baseCapacitance = xml.parseDoubleAttr("ba", this.baseCapacitance);
  }
  setPoints() {
    super.setPoints();
    const platef = 0.6;
    const pa = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, pa[0], pa[1], 0, this.hs);
    this.interpPoint2(this.lead1, this.lead2, this.cathode[0], this.cathode[1], platef, this.hs);
    const arrowPoint = this.interpPoint(this.lead1, this.lead2, platef);
    this.poly = this.createPolygon(pa[0], pa[1], arrowPoint);
    this.plate1 = this.newPointArray(2);
    this.plate2 = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, this.plate1[0], this.plate1[1], platef, this.hs);
    this.interpPoint2(this.lead1, this.lead2, this.plate2[0], this.plate2[1], 1, this.hs);
  }
  draw(g) {
    this.drawDiode(g);
    this.setVoltageColor(g, this.nodes[0].v);
    this.setPowerColor(g, false);
    CircuitElm.drawThickLine(g, this.plate1[0], this.plate1[1]);
    if (this.showPower())
      g.setColor("#888888");
    this.setVoltageColor(g, this.nodes[1].v);
    this.setPowerColor(g, false);
    CircuitElm.drawThickLine(g, this.plate2[0], this.plate2[1]);
    this.doDots(g);
    this.drawPosts(g);
  }
  setVoltageSource(n, v) {
    super.setVoltageSource(n, v);
    v.setNodes(this.nodes[0], this.nodes[2]);
  }
  stamp() {
    super.stamp();
    CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[2], this.voltSource);
    CircuitElm.sim.stampNonLinear(this.nodes[2]);
  }
  startIteration() {
    super.startIteration();
    const c0 = this.baseCapacitance;
    if (this.capvoltdiff > 0)
      this.capacitance = c0;
    else
      this.capacitance = c0 / Math.pow(1 - this.capvoltdiff / this.model.fwdrop, 0.5);
    this.compResistance = CircuitElm.sim.timeStep / (2 * this.capacitance);
    this.voltSourceValue = -this.capvoltdiff - this.capCurrent * this.compResistance;
  }
  doStep() {
    super.doStep();
    CircuitElm.sim.stampResistor(this.nodes[2], this.nodes[1], this.compResistance);
    CircuitElm.sim.updateVoltageSource(this.nodes[0], this.nodes[2], this.voltSource, this.voltSourceValue);
  }
  getEditInfo(n) {
    if (n === 1)
      return new EditInfo("Capacitance @ 0V (F)", this.baseCapacitance, 10, 1e3);
    return super.getEditInfo(n);
  }
  setEditValue(n, ei) {
    if (n === 1) {
      this.baseCapacitance = ei.value;
      return;
    }
    super.setEditValue(n, ei);
  }
  getShortcut() {
    return 0;
  }
  setCurrent(vs, c) {
    this.capCurrent = c;
  }
  getVoltageSourceCount() {
    return 1;
  }
  getInternalNodeCount() {
    return 1;
  }
}

class WattmeterElm extends CircuitElm {
  width = 0;
  voltSources;
  currents;
  curcounts;
  meter = 0;
  PM_INST = 0;
  PM_AVG = 1;
  avgPower = 0;
  totalEnergy = 0;
  cycleTime = 0;
  lastCycleTime = 0;
  runEnergy = 0;
  runTime = 0;
  zeroTime = 0;
  peak = 0;
  trough = 0;
  wasAboveMid = false;
  haveFullCycle = false;
  posts;
  inner;
  rectPointsX;
  rectPointsY;
  center;
  maxTextLen = 0;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    if (st !== void 0) {
      this.width = parseIntStrict(st.nextToken());
      try {
        this.meter = parseIntStrict(st.nextToken());
      } catch (e) {
      }
    }
    this.setup();
  }
  setup() {
    this.voltSources = new Array(2);
    this.currents = [0, 0];
    this.curcounts = [0, 0];
  }
  dump() {
    return super.dump() + " " + this.width + " " + this.meter;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "w", this.width);
    CircuitXMLSerializer.dumpAttr(elem, "meter", this.meter);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.width = xml.parseIntAttr("w", this.width);
    this.meter = xml.parseIntAttr("meter", this.meter);
    this.setup();
  }
  getVoltageSourceCount() {
    return 2;
  }
  getDumpType() {
    return 420;
  }
  getPostCount() {
    return 4;
  }
  drag(xx, yy) {
    xx = this.snapGrid(xx);
    yy = this.snapGrid(yy);
    const w1 = Math.max(CircuitElm.app.gridSize, CircuitElm.abs(yy - this.y));
    const w2 = Math.max(CircuitElm.app.gridSize, CircuitElm.abs(xx - this.x));
    if (w1 > w2) {
      xx = this.x;
      this.width = w2;
    } else {
      yy = this.y;
      this.width = w1;
    }
    this.x2 = xx;
    this.y2 = yy;
    this.setPoints();
  }
  setPoints() {
    super.setPoints();
    const ds = this.dy === 0 ? CircuitElm.sign(this.dx) : -CircuitElm.sign(this.dy);
    const p3 = this.interpPoint(this.point1, this.point2, 0, -this.width * ds);
    const p4 = this.interpPoint(this.point1, this.point2, 1, -this.width * ds);
    const sep = CircuitElm.app.gridSize;
    const p5 = this.interpPoint(this.point1, this.point2, sep / this.dn);
    const p6 = this.interpPoint(this.point1, this.point2, 1 - sep / this.dn);
    const p7 = this.interpPoint(p3, p4, sep / this.dn);
    const p8 = this.interpPoint(p3, p4, 1 - sep / this.dn);
    this.posts = [p3, p4, this.point1, this.point2];
    this.inner = [p7, p8, p5, p6];
    const r1 = this.interpPoint(this.point1, this.point2, sep / this.dn, ds * sep);
    const r2 = this.interpPoint(this.point1, this.point2, 1 - sep / this.dn, ds * sep);
    const r3 = this.interpPoint(this.point1, this.point2, sep / this.dn, -ds * (sep + this.width));
    const r4 = this.interpPoint(this.point1, this.point2, 1 - sep / this.dn, -ds * (sep + this.width));
    this.rectPointsX = [r1.x, r2.x, r4.x, r3.x];
    this.rectPointsY = [r1.y, r2.y, r4.y, r3.y];
    this.center = this.interpPoint(r1, r4, 0.5);
    this.maxTextLen = Math.max(Math.abs(r1.x - r4.x) - 5, 5);
  }
  getPost(n) {
    return this.posts[n];
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(this.nodes[0], this.nodes[1], this.voltSources[0], 0);
    CircuitElm.sim.stampVoltageSource(this.nodes[2], this.nodes[3], this.voltSources[1], 0);
  }
  setVoltageSource(j, vs) {
    this.voltSources[j] = vs;
    vs.setNodes(this.nodes[j * 2], this.nodes[j * 2 + 1]);
  }
  stepFinished() {
    const p = this.getPower();
    const dt = CircuitElm.sim.timeStep;
    this.cycleTime += dt;
    this.totalEnergy += p * dt;
    this.runTime += dt;
    this.runEnergy += p * dt;
    const mid = this.runEnergy / this.runTime;
    if (p > this.peak)
      this.peak = p;
    if (p < this.trough)
      this.trough = p;
    const band = (this.peak - this.trough) * 0.05 + Math.abs(this.peak) * 1e-9;
    const above = this.wasAboveMid ? p > mid - band : p > mid + band;
    if (above && !this.wasAboveMid) {
      if (this.haveFullCycle) {
        this.avgPower = this.totalEnergy / this.cycleTime;
        if (isNaN(this.avgPower))
          this.avgPower = 0;
        this.lastCycleTime = this.cycleTime;
      } else {
        this.haveFullCycle = true;
      }
      this.totalEnergy = 0;
      this.cycleTime = 0;
    } else if (this.lastCycleTime > 0 && this.cycleTime > this.lastCycleTime * 8) {
      this.avgPower = this.totalEnergy / this.cycleTime;
      if (isNaN(this.avgPower))
        this.avgPower = 0;
      this.totalEnergy = 0;
      this.cycleTime = 0;
    }
    this.wasAboveMid = above;
    if (this.lastCycleTime === 0)
      this.avgPower = mid;
    if (p === 0) {
      this.zeroTime += dt;
      if (this.lastCycleTime > 0 && this.zeroTime > this.lastCycleTime * 1.5) {
        this.avgPower = 0;
        this.totalEnergy = 0;
        this.cycleTime = 0;
      }
    } else {
      this.zeroTime = 0;
    }
  }
  draw(g) {
    for (let i = 0; i !== 2; i++)
      this.curcounts[i] = this.updateDotCountImpl(this.currents[i], this.curcounts[i]);
    let flip = 1;
    for (let i = 0; i !== 4; i++) {
      this.setVoltageColor(g, this.nodes[i].v);
      CircuitElm.drawThickLine(g, this.posts[i], this.inner[i]);
      this.drawDots(g, this.posts[i], this.inner[i], this.curcounts[Math.trunc(i / 2)] * flip);
      flip *= -1;
    }
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    CircuitElm.drawThickPolygon(g, this.rectPointsX, this.rectPointsY, 4);
    this.setBbox(this.posts[0].x, this.posts[0].y, this.posts[3].x, this.posts[3].y);
    this.drawPosts(g);
    const str = this.meter === this.PM_AVG ? CircuitElm.getUnitText(this.avgPower, "W(avg)") : CircuitElm.getUnitText(this.getPower(), "W");
    g.save();
    let fsize = 15;
    let w;
    while (true) {
      g.setFont(new Font("SansSerif", 0, fsize));
      w = Math.trunc(g.context.measureText(str).width);
      if (w < this.maxTextLen) break;
      fsize--;
    }
    g.setColor(CircuitElm.whiteColor);
    g.context.textBaseline = "middle";
    g.drawString(str, this.center.x - Math.trunc(w / 2), this.center.y);
    g.restore();
  }
  getPower() {
    return this.getVoltageDiff() * this.getCurrent();
  }
  setCurrent(vs, c) {
    this.currents[vs === this.voltSources[0] ? 0 : 1] = c;
  }
  getCurrentIntoNode(n) {
    return n % 2 === 0 ? -this.currents[Math.trunc(n / 2)] : this.currents[Math.trunc(n / 2)];
  }
  getConnection(n1, n2) {
    return Math.trunc(n1 / 2) === Math.trunc(n2 / 2);
  }
  hasGroundConnection(n1) {
    return false;
  }
  getInfo(arr) {
    arr[0] = "wattmeter (old)";
    this.getBasicInfo(arr);
    arr[3] = "P = " + CircuitElm.getUnitText(this.getPower(), "W");
    if (this.meter === this.PM_AVG)
      arr[4] = "Pavg = " + CircuitElm.getUnitText(this.avgPower, "W");
  }
  canViewInScope() {
    return true;
  }
  getCurrent() {
    return this.currents[1];
  }
  getVoltageDiff() {
    return this.nodes[2].v - this.nodes[0].v;
  }
  canFlipX() {
    return false;
  }
  canFlipY() {
    return false;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Value", 0, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("Instantaneous");
      ei.choice.add("Average");
      ei.choice.select(this.meter);
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) this.meter = ei.choice.getSelectedIndex();
  }
}

class WattmeterTrueElm extends CircuitElm {
  width = 0;
  voltSources;
  currents;
  curcounts;
  meter = 0;
  PM_INST = 0;
  PM_AVG = 1;
  selectedValue = 0;
  avgPower = 0;
  totalEnergy = 0;
  cycleTime = 0;
  lastCycleTime = 0;
  runEnergy = 0;
  runTime = 0;
  zeroTime = 0;
  peak = 0;
  trough = 0;
  curPeak = 0;
  curTrough = 0;
  wasAboveMid = false;
  haveFullCycle = false;
  posts;
  inner;
  rectPointsX;
  rectPointsY;
  center;
  maxTextLen = 0;
  constructor(xa, ya, xb, yb, f, st) {
    super(xa, ya, xb, yb, f);
    this.setup();
  }
  setup() {
    this.voltSources = new Array(2);
    this.currents = [0, 0];
    this.curcounts = [0, 0];
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "w", this.width);
    CircuitXMLSerializer.dumpAttr(elem, "meter", this.meter);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.width = xml.parseIntAttr("w", this.width);
    this.meter = xml.parseIntAttr("meter", this.meter);
    this.setup();
  }
  getVoltageSourceCount() {
    return 1;
  }
  getPostCount() {
    return 4;
  }
  drag(xx, yy) {
    xx = this.snapGrid(xx);
    yy = this.snapGrid(yy);
    const w1 = Math.max(CircuitElm.app.gridSize, CircuitElm.abs(yy - this.y));
    const w2 = Math.max(CircuitElm.app.gridSize, CircuitElm.abs(xx - this.x));
    if (w1 > w2) {
      xx = this.x;
      this.width = w2;
    } else {
      yy = this.y;
      this.width = w1;
    }
    this.x2 = xx;
    this.y2 = yy;
    this.setPoints();
  }
  setPoints() {
    super.setPoints();
    const ds = this.dy === 0 ? CircuitElm.sign(this.dx) : -CircuitElm.sign(this.dy);
    const p3 = this.interpPoint(this.point1, this.point2, 0, -this.width * ds);
    const p4 = this.interpPoint(this.point1, this.point2, 1, -this.width * ds);
    const sep = CircuitElm.app.gridSize;
    const p5 = this.interpPoint(this.point1, this.point2, sep / this.dn);
    const p6 = this.interpPoint(this.point1, this.point2, 1 - sep / this.dn);
    const p7 = this.interpPoint(p3, p4, sep / this.dn);
    const p8 = this.interpPoint(p3, p4, 1 - sep / this.dn);
    this.posts = [p4, p3, this.point1, this.point2];
    this.inner = [p8, p7, p5, p6];
    const r1 = this.interpPoint(this.point1, this.point2, sep / this.dn, ds * sep);
    const r2 = this.interpPoint(this.point1, this.point2, 1 - sep / this.dn, ds * sep);
    const r3 = this.interpPoint(this.point1, this.point2, sep / this.dn, -ds * (sep + this.width));
    const r4 = this.interpPoint(this.point1, this.point2, 1 - sep / this.dn, -ds * (sep + this.width));
    this.rectPointsX = [r1.x, r2.x, r4.x, r3.x];
    this.rectPointsY = [r1.y, r2.y, r4.y, r3.y];
    this.center = this.interpPoint(r1, r4, 0.5);
    this.maxTextLen = Math.max(Math.abs(r1.x - r4.x) - 5, 5);
  }
  getPost(n) {
    return this.posts[n];
  }
  stamp() {
    CircuitElm.sim.stampVoltageSource(this.nodes[2], this.nodes[3], this.voltSources[0], 0);
    CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], 1e8);
  }
  setVoltageSource(j, vs) {
    this.voltSources[j] = vs;
  }
  draw(g) {
    for (let i = 0; i !== 2; i++)
      this.curcounts[i] = this.updateDotCountImpl(this.currents[i], this.curcounts[i]);
    let flip = 1;
    for (let i = 0; i !== 4; i++) {
      this.setVoltageColor(g, this.nodes[i].v);
      CircuitElm.drawThickLine(g, this.posts[i], this.inner[i]);
      if (i === 2 || i === 3)
        this.drawDots(g, this.posts[i], this.inner[i], this.curcounts[Math.trunc(i / 2)] * flip);
      {
        let label;
        if (i === 2) label = "M";
        else if (i === 3) label = "L";
        else if (i === 1) label = "C";
        else label = "V";
        g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
        const w2 = Math.trunc(g.context.measureText(label).width);
        const labelPoint = this.interpPoint(this.posts[i], this.inner[i], 1.5);
        g.drawString(label, labelPoint.x - Math.trunc(w2 / 2), labelPoint.y + 4);
      }
      flip *= -1;
    }
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    CircuitElm.drawThickPolygon(g, this.rectPointsX, this.rectPointsY, 4);
    this.setBbox(this.rectPointsX[0], this.rectPointsY[0], this.rectPointsX[2], this.rectPointsY[2]);
    this.drawPosts(g);
    const str = CircuitElm.getUnitText(this.getMeterPower(), "W");
    g.save();
    let fsize = 15;
    let w;
    while (true) {
      g.setFont(new Font("SansSerif", 0, fsize));
      w = Math.trunc(g.context.measureText(str).width);
      if (w < this.maxTextLen)
        break;
      fsize--;
    }
    g.setColor(CircuitElm.whiteColor);
    g.context.textBaseline = "middle";
    g.drawString(str, this.center.x - Math.trunc(w / 2), this.center.y);
    g.restore();
  }
  // Average over whole cycles, delimited by rising crossings of the long-run mean
  // (ported from WattmeterElm.stepFinished(), which fixed the same averaging
  // against local extrema of the power waveform that this element used to do).
  stepFinished() {
    const p = this.getPower();
    const dt = CircuitElm.sim.timeStep;
    this.cycleTime += dt;
    this.totalEnergy += p * dt;
    this.runTime += dt;
    this.runEnergy += p * dt;
    const mid = this.runEnergy / this.runTime;
    if (p > this.curPeak)
      this.curPeak = p;
    if (p < this.curTrough)
      this.curTrough = p;
    const band = (this.peak - this.trough) * 0.05 + Math.abs(this.peak) * 1e-9;
    const above = this.wasAboveMid ? p > mid - band : p > mid + band;
    if (above && !this.wasAboveMid) {
      if (this.haveFullCycle) {
        this.avgPower = this.totalEnergy / this.cycleTime;
        if (isNaN(this.avgPower))
          this.avgPower = 0;
        this.lastCycleTime = this.cycleTime;
      } else {
        this.haveFullCycle = true;
      }
      this.totalEnergy = 0;
      this.cycleTime = 0;
      this.peak = this.curPeak;
      this.trough = this.curTrough;
      this.curPeak = p;
      this.curTrough = p;
    } else if (this.lastCycleTime > 0 && this.cycleTime > this.lastCycleTime * 8) {
      this.avgPower = this.totalEnergy / this.cycleTime;
      if (isNaN(this.avgPower))
        this.avgPower = 0;
      this.totalEnergy = 0;
      this.cycleTime = 0;
      this.peak = this.curPeak;
      this.trough = this.curTrough;
      this.curPeak = p;
      this.curTrough = p;
    }
    this.wasAboveMid = above;
    if (this.lastCycleTime === 0)
      this.avgPower = mid;
    if (p === 0) {
      this.zeroTime += dt;
      if (this.lastCycleTime > 0 && this.zeroTime > this.lastCycleTime * 1.5) {
        this.avgPower = 0;
        this.totalEnergy = 0;
        this.cycleTime = 0;
      }
    } else {
      this.zeroTime = 0;
    }
  }
  setCurrent(vn, c) {
    this.currents[vn === this.voltSources[1] ? 0 : 1] = c;
  }
  getCurrentIntoNode(n) {
    if (n % 2 === 0)
      return -this.currents[Math.trunc(n / 2)];
    else
      return this.currents[Math.trunc(n / 2)];
  }
  getConnection(n1, n2) {
    return Math.trunc(n1 / 2) === Math.trunc(n2 / 2);
  }
  hasGroundConnection(n1) {
    return false;
  }
  getInfo(arr) {
    arr[0] = "wattmeter";
    this.getBasicInfo(arr);
    arr[3] = "P = " + CircuitElm.getUnitText(this.getVoltageDiff() * this.getCurrent(), "W");
    arr[4] = "P = " + CircuitElm.getUnitText(this.getAveragePower(), "W");
  }
  getPower() {
    return this.getVoltageDiff() * this.getCurrent();
  }
  getMeterPower() {
    let value;
    switch (this.meter) {
      case this.PM_INST:
        value = this.getVoltageDiff() * this.getCurrent();
        break;
      case this.PM_AVG:
        value = this.getAveragePower();
        break;
      default:
        value = -1;
    }
    return value;
  }
  canViewInScope() {
    return true;
  }
  getCurrent() {
    return this.currents[1];
  }
  getVoltageDiff() {
    return this.nodes[1].v - this.nodes[0].v;
  }
  getAveragePower() {
    return this.avgPower;
  }
  canFlipX() {
    return false;
  }
  canFlipY() {
    return false;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Value", this.selectedValue, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("Instantaneous Power");
      ei.choice.add("Average Power");
      ei.choice.select(this.meter);
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.meter = ei.choice.getSelectedIndex();
  }
}

class ZenerElm extends DiodeElm {
  static lastZenerModelName = "default-zener";
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.modelName = ZenerElm.lastZenerModelName;
      this.setup();
    } else {
      super(xa, ya, xb, yb, f, st);
      if ((f & DiodeElm.FLAG_MODEL) === 0) {
        const zvoltage = parseFloatStrict(st.nextToken());
        this.model = DiodeModel.getModelWithParameters(this.model.fwdrop, zvoltage);
        this.modelName = this.model.name;
      }
      this.setup();
    }
  }
  getDumpType() {
    return "z".charCodeAt(0);
  }
  hs = 8;
  wing;
  setPoints() {
    super.setPoints();
    this.calcLeads(16);
    this.cathode = this.newPointArray(2);
    this.wing = this.newPointArray(2);
    const pa = this.newPointArray(2);
    this.interpPoint2(this.lead1, this.lead2, pa[0], pa[1], 0, this.hs);
    this.interpPoint2(this.lead1, this.lead2, this.cathode[0], this.cathode[1], 1, this.hs);
    this.interpPoint(this.cathode[0], this.cathode[1], this.wing[0], -0.2, -this.hs);
    this.interpPoint(this.cathode[1], this.cathode[0], this.wing[1], -0.2, -this.hs);
    this.poly = this.createPolygon(pa[0], pa[1], this.lead2);
  }
  draw(g) {
    this.setBbox(this.point1, this.point2, this.hs);
    const v1 = this.nodes[0].v;
    const v2 = this.nodes[1].v;
    this.draw2Leads(g);
    this.setPowerColor(g, true);
    this.setVoltageColor(g, v1);
    g.fillPolygon(this.poly);
    this.setVoltageColor(g, v2);
    DiodeElm.drawThickLine(g, this.cathode[0], this.cathode[1]);
    DiodeElm.drawThickLine(g, this.wing[0], this.cathode[0]);
    DiodeElm.drawThickLine(g, this.wing[1], this.cathode[1]);
    this.doDots(g);
    this.drawPosts(g);
  }
  default_zvoltage = 5.6;
  getElmType() {
    return "Zener diode";
  }
  getInfo(arr) {
    super.getInfo(arr);
    arr[0] = "Zener diode";
    arr[5] = "Vz = " + DiodeElm.getVoltageText(this.model.breakdownVoltage);
  }
  isZenerElm() {
    return true;
  }
  getShortcut() {
    return "z".charCodeAt(0);
  }
  setLastModelName(n) {
    ZenerElm.lastZenerModelName = n;
  }
}

function registerElements() {
  ElementFactory.registerClass("JfetElm", JfetElm);
  ElementFactory.registerClass("MosfetElm", MosfetElm);
  ElementFactory.registerClass("TransistorElm", TransistorElm);
  ElementFactory.registerClass("ACRailElm", ACRailElm);
  ElementFactory.registerClass("ACVoltageElm", ACVoltageElm);
  ElementFactory.registerClass("ADCElm", ADCElm);
  ElementFactory.registerClass("AMElm", AMElm);
  ElementFactory.registerClass("AmmeterElm", AmmeterElm);
  ElementFactory.registerClass("AnalogMuxElm", AnalogMuxElm);
  ElementFactory.registerClass("AnalogSwitch2Elm", AnalogSwitch2Elm);
  ElementFactory.registerClass("AnalogSwitchElm", AnalogSwitchElm);
  ElementFactory.registerClass("AndGateElm", AndGateElm);
  ElementFactory.registerClass("AntennaElm", AntennaElm);
  ElementFactory.registerClass("AudioInputElm", AudioInputElm);
  ElementFactory.registerClass("AudioOutputElm", AudioOutputElm);
  ElementFactory.registerClass("BatteryElm", BatteryElm);
  ElementFactory.registerClass("BoxElm", BoxElm);
  ElementFactory.registerClass("BusLogicInputElm", BusLogicInputElm);
  ElementFactory.registerClass("BusSplitterElm", BusSplitterElm);
  ElementFactory.registerClass("BusTransceiverElm", BusTransceiverElm);
  ElementFactory.registerClass("CC2Elm", CC2Elm);
  ElementFactory.registerClass("CC2NegElm", CC2NegElm);
  ElementFactory.registerClass("CCCSElm", CCCSElm);
  ElementFactory.registerClass("CCVSElm", CCVSElm);
  ElementFactory.registerClass("CapacitorElm", CapacitorElm);
  ElementFactory.registerClass("ClockElm", ClockElm);
  ElementFactory.registerClass("ComparatorElm", ComparatorElm);
  ElementFactory.registerClass("Counter2Elm", Counter2Elm);
  ElementFactory.registerClass("CounterElm", CounterElm);
  ElementFactory.registerClass("CrossSwitchElm", CrossSwitchElm);
  ElementFactory.registerClass("CrystalElm", CrystalElm);
  ElementFactory.registerClass("CurrentElm", CurrentElm);
  ElementFactory.registerClass("CustomLogicElm", CustomLogicElm);
  ElementFactory.registerClass("CustomTransformerElm", CustomTransformerElm);
  ElementFactory.registerClass("DACElm", DACElm);
  ElementFactory.registerClass("DCMotorElm", DCMotorElm);
  ElementFactory.registerClass("DCVoltageElm", DCVoltageElm);
  ElementFactory.registerClass("DFlipFlopElm", DFlipFlopElm);
  ElementFactory.registerClass("DPDTSwitchElm", DPDTSwitchElm);
  ElementFactory.registerClass("DarlingtonElm", DarlingtonElm);
  ElementFactory.registerClass("DataInputElm", DataInputElm);
  ElementFactory.registerClass("DataRecorderElm", DataRecorderElm);
  ElementFactory.registerClass("DeMultiplexerElm", DeMultiplexerElm);
  ElementFactory.registerClass("DecimalDisplayElm", DecimalDisplayElm);
  ElementFactory.registerClass("DelayBufferElm", DelayBufferElm);
  ElementFactory.registerClass("DiacElm", DiacElm);
  ElementFactory.registerClass("DiodeElm", DiodeElm);
  ElementFactory.registerClass("ExtVoltageElm", ExtVoltageElm);
  ElementFactory.registerClass("FMElm", FMElm);
  ElementFactory.registerClass("FullAdderElm", FullAdderElm);
  ElementFactory.registerClass("FuseElm", FuseElm);
  ElementFactory.registerClass("GroundElm", GroundElm);
  ElementFactory.registerClass("GyratorElm", GyratorElm);
  ElementFactory.registerClass("HalfAdderElm", HalfAdderElm);
  ElementFactory.registerClass("InductorElm", InductorElm);
  ElementFactory.registerClass("InstructionDisplayElm", InstructionDisplayElm);
  ElementFactory.registerClass("InverterElm", InverterElm);
  ElementFactory.registerClass("InvertingSchmittElm", InvertingSchmittElm);
  ElementFactory.registerClass("JKFlipFlopElm", JKFlipFlopElm);
  ElementFactory.registerClass("LDRElm", LDRElm);
  ElementFactory.registerClass("LEDArrayElm", LEDArrayElm);
  ElementFactory.registerClass("LEDElm", LEDElm);
  ElementFactory.registerClass("LabeledNodeElm", LabeledNodeElm);
  ElementFactory.registerClass("LampElm", LampElm);
  ElementFactory.registerClass("LatchElm", LatchElm);
  ElementFactory.registerClass("LineElm", LineElm);
  ElementFactory.registerClass("LogicInputElm", LogicInputElm);
  ElementFactory.registerClass("LogicOutputElm", LogicOutputElm);
  ElementFactory.registerClass("MBBSwitchElm", MBBSwitchElm);
  ElementFactory.registerClass("MemristorElm", MemristorElm);
  ElementFactory.registerClass("MonostableElm", MonostableElm);
  ElementFactory.registerClass("MotorProtectionSwitchElm", MotorProtectionSwitchElm);
  ElementFactory.registerClass("MultiplexerElm", MultiplexerElm);
  ElementFactory.registerClass("NDarlingtonElm", NDarlingtonElm);
  ElementFactory.registerClass("NJfetElm", NJfetElm);
  ElementFactory.registerClass("NMosfetElm", NMosfetElm);
  ElementFactory.registerClass("NTransistorElm", NTransistorElm);
  ElementFactory.registerClass("NandGateElm", NandGateElm);
  ElementFactory.registerClass("NoiseElm", NoiseElm);
  ElementFactory.registerClass("NorGateElm", NorGateElm);
  ElementFactory.registerClass("NortonAmpElm", NortonAmpElm);
  ElementFactory.registerClass("OTAElm", OTAElm);
  ElementFactory.registerClass("OhmMeterElm", OhmMeterElm);
  ElementFactory.registerClass("OpAmpElm", OpAmpElm);
  ElementFactory.registerClass("OpAmpRealElm", OpAmpRealElm);
  ElementFactory.registerClass("OpAmpSwapElm", OpAmpSwapElm);
  ElementFactory.registerClass("OptocouplerElm", OptocouplerElm);
  ElementFactory.registerClass("OrGateElm", OrGateElm);
  ElementFactory.registerClass("OutputElm", OutputElm);
  ElementFactory.registerClass("PDarlingtonElm", PDarlingtonElm);
  ElementFactory.registerClass("PJfetElm", PJfetElm);
  ElementFactory.registerClass("PMosfetElm", PMosfetElm);
  ElementFactory.registerClass("PTransistorElm", PTransistorElm);
  ElementFactory.registerClass("PhaseCompElm", PhaseCompElm);
  ElementFactory.registerClass("PisoShiftElm", PisoShiftElm);
  ElementFactory.registerClass("PolarCapacitorElm", PolarCapacitorElm);
  ElementFactory.registerClass("PotElm", PotElm);
  ElementFactory.registerClass("ProbeElm", ProbeElm);
  ElementFactory.registerClass("PushSwitchElm", PushSwitchElm);
  ElementFactory.registerClass("ROMElm", ROMElm);
  ElementFactory.registerClass("RailElm", RailElm);
  ElementFactory.registerClass("RelayCoilElm", RelayCoilElm);
  ElementFactory.registerClass("RelayContactElm", RelayContactElm);
  ElementFactory.registerClass("RelayElm", RelayElm);
  ElementFactory.registerClass("ResistorElm", ResistorElm);
  ElementFactory.registerClass("RingCounterElm", RingCounterElm);
  ElementFactory.registerClass("RoutedWireElm", RoutedWireElm);
  ElementFactory.registerClass("SCRElm", SCRElm);
  ElementFactory.registerClass("SRAMElm", SRAMElm);
  ElementFactory.registerClass("SchmittElm", SchmittElm);
  ElementFactory.registerClass("ScopeElm", ScopeElm);
  ElementFactory.registerClass("SeqGenElm", SeqGenElm);
  ElementFactory.registerClass("SevenSegDecoderElm", SevenSegDecoderElm);
  ElementFactory.registerClass("SevenSegElm", SevenSegElm);
  ElementFactory.registerClass("SipoShiftElm", SipoShiftElm);
  ElementFactory.registerClass("SparkGapElm", SparkGapElm);
  ElementFactory.registerClass("SquareRailElm", SquareRailElm);
  ElementFactory.registerClass("StopTriggerElm", StopTriggerElm);
  ElementFactory.registerClass("SubcircuitElm", SubcircuitElm);
  ElementFactory.registerClass("SweepElm", SweepElm);
  ElementFactory.registerClass("Switch2Elm", Switch2Elm);
  ElementFactory.registerClass("SwitchElm", SwitchElm);
  ElementFactory.registerClass("TFlipFlopElm", TFlipFlopElm);
  ElementFactory.registerClass("TappedTransformerElm", TappedTransformerElm);
  ElementFactory.registerClass("TestPointElm", TestPointElm);
  ElementFactory.registerClass("TextElm", TextElm);
  ElementFactory.registerClass("ThermistorNTCElm", ThermistorNTCElm);
  ElementFactory.registerClass("ThreePhaseMotorElm", ThreePhaseMotorElm);
  ElementFactory.registerClass("TimeDelayRelayElm", TimeDelayRelayElm);
  ElementFactory.registerClass("TimerElm", TimerElm);
  ElementFactory.registerClass("TransLineElm", TransLineElm);
  ElementFactory.registerClass("TransformerElm", TransformerElm);
  ElementFactory.registerClass("TriStateElm", TriStateElm);
  ElementFactory.registerClass("TriacElm", TriacElm);
  ElementFactory.registerClass("TriodeElm", TriodeElm);
  ElementFactory.registerClass("TunnelDiodeElm", TunnelDiodeElm);
  ElementFactory.registerClass("UnijunctionElm", UnijunctionElm);
  ElementFactory.registerClass("ControlledCurrentElm", ControlledCurrentElm);
  ElementFactory.registerClass("ControlledVoltageElm", ControlledVoltageElm);
  ElementFactory.registerClass("VCCSElm", VCCSElm);
  ElementFactory.registerClass("VCOElm", VCOElm);
  ElementFactory.registerClass("VCVSElm", VCVSElm);
  ElementFactory.registerClass("VarRailElm", VarRailElm);
  ElementFactory.registerClass("VaractorElm", VaractorElm);
  ElementFactory.registerClass("VoltageElm", VoltageElm);
  ElementFactory.registerClass("WattmeterElm", WattmeterElm);
  ElementFactory.registerClass("WattmeterTrueElm", WattmeterTrueElm);
  ElementFactory.registerClass("WireElm", WireElm);
  ElementFactory.registerClass("XnorGateElm", XnorGateElm);
  ElementFactory.registerClass("XorGateElm", XorGateElm);
  ElementFactory.registerClass("ZenerElm", ZenerElm);
  CirSim.theApp.register("ACRailElm", new ACRailElm(0, 0));
  CirSim.theApp.register("ACVoltageElm", new ACVoltageElm(0, 0));
  CirSim.theApp.register("ADCElm", new ADCElm(0, 0));
  CirSim.theApp.register("AMElm", new AMElm(0, 0));
  CirSim.theApp.register("AmmeterElm", new AmmeterElm(0, 0));
  CirSim.theApp.register("AnalogMuxElm", new AnalogMuxElm(0, 0));
  CirSim.theApp.register("AnalogSwitch2Elm", new AnalogSwitch2Elm(0, 0));
  CirSim.theApp.register("AnalogSwitchElm", new AnalogSwitchElm(0, 0));
  CirSim.theApp.register("AndGateElm", new AndGateElm(0, 0));
  CirSim.theApp.register("AntennaElm", new AntennaElm(0, 0));
  CirSim.theApp.register("AudioInputElm", new AudioInputElm(0, 0));
  CirSim.theApp.register("AudioOutputElm", new AudioOutputElm(0, 0));
  CirSim.theApp.register("BatteryElm", new BatteryElm(0, 0));
  CirSim.theApp.register("BoxElm", new BoxElm(0, 0));
  CirSim.theApp.register("BusLogicInputElm", new BusLogicInputElm(0, 0));
  CirSim.theApp.register("BusSplitterElm", new BusSplitterElm(0, 0));
  CirSim.theApp.register("BusTransceiverElm", new BusTransceiverElm(0, 0));
  CirSim.theApp.register("CC2Elm", new CC2Elm(0, 0));
  CirSim.theApp.register("CC2NegElm", new CC2NegElm(0, 0));
  CirSim.theApp.register("CCCSElm", new CCCSElm(0, 0));
  CirSim.theApp.register("CCVSElm", new CCVSElm(0, 0));
  CirSim.theApp.register("CapacitorElm", new CapacitorElm(0, 0));
  CirSim.theApp.register("ClockElm", new ClockElm(0, 0));
  CirSim.theApp.register("ComparatorElm", new ComparatorElm(0, 0));
  CirSim.theApp.register("Counter2Elm", new Counter2Elm(0, 0));
  CirSim.theApp.register("CounterElm", new CounterElm(0, 0));
  CirSim.theApp.register("CrossSwitchElm", new CrossSwitchElm(0, 0));
  CirSim.theApp.register("CrystalElm", new CrystalElm(0, 0));
  CirSim.theApp.register("CurrentElm", new CurrentElm(0, 0));
  CirSim.theApp.register("CustomLogicElm", new CustomLogicElm(0, 0));
  CirSim.theApp.register("CustomTransformerElm", new CustomTransformerElm(0, 0));
  CirSim.theApp.register("DACElm", new DACElm(0, 0));
  CirSim.theApp.register("DCMotorElm", new DCMotorElm(0, 0));
  CirSim.theApp.register("DCVoltageElm", new DCVoltageElm(0, 0));
  CirSim.theApp.register("DFlipFlopElm", new DFlipFlopElm(0, 0));
  CirSim.theApp.register("DPDTSwitchElm", new DPDTSwitchElm(0, 0));
  CirSim.theApp.register("DarlingtonElm", new DarlingtonElm(0, 0));
  CirSim.theApp.register("DataInputElm", new DataInputElm(0, 0));
  CirSim.theApp.register("DataRecorderElm", new DataRecorderElm(0, 0));
  CirSim.theApp.register("DeMultiplexerElm", new DeMultiplexerElm(0, 0));
  CirSim.theApp.register("DecimalDisplayElm", new DecimalDisplayElm(0, 0));
  CirSim.theApp.register("DelayBufferElm", new DelayBufferElm(0, 0));
  CirSim.theApp.register("DiacElm", new DiacElm(0, 0));
  CirSim.theApp.register("DiodeElm", new DiodeElm(0, 0));
  CirSim.theApp.register("ExtVoltageElm", new ExtVoltageElm(0, 0));
  CirSim.theApp.register("FMElm", new FMElm(0, 0));
  CirSim.theApp.register("FullAdderElm", new FullAdderElm(0, 0));
  CirSim.theApp.register("FuseElm", new FuseElm(0, 0));
  CirSim.theApp.register("GroundElm", new GroundElm(0, 0));
  CirSim.theApp.register("GyratorElm", new GyratorElm(0, 0));
  CirSim.theApp.register("HalfAdderElm", new HalfAdderElm(0, 0));
  CirSim.theApp.register("InductorElm", new InductorElm(0, 0));
  CirSim.theApp.register("InstructionDisplayElm", new InstructionDisplayElm(0, 0));
  CirSim.theApp.register("InverterElm", new InverterElm(0, 0));
  CirSim.theApp.register("InvertingSchmittElm", new InvertingSchmittElm(0, 0));
  CirSim.theApp.register("JKFlipFlopElm", new JKFlipFlopElm(0, 0));
  CirSim.theApp.register("LDRElm", new LDRElm(0, 0));
  CirSim.theApp.register("LEDArrayElm", new LEDArrayElm(0, 0));
  CirSim.theApp.register("LEDElm", new LEDElm(0, 0));
  CirSim.theApp.register("LabeledNodeElm", new LabeledNodeElm(0, 0));
  CirSim.theApp.register("LampElm", new LampElm(0, 0));
  CirSim.theApp.register("LatchElm", new LatchElm(0, 0));
  CirSim.theApp.register("LineElm", new LineElm(0, 0));
  CirSim.theApp.register("LogicInputElm", new LogicInputElm(0, 0));
  CirSim.theApp.register("LogicOutputElm", new LogicOutputElm(0, 0));
  CirSim.theApp.register("MBBSwitchElm", new MBBSwitchElm(0, 0));
  CirSim.theApp.register("MemristorElm", new MemristorElm(0, 0));
  CirSim.theApp.register("MonostableElm", new MonostableElm(0, 0));
  CirSim.theApp.register("MotorProtectionSwitchElm", new MotorProtectionSwitchElm(0, 0));
  CirSim.theApp.register("MultiplexerElm", new MultiplexerElm(0, 0));
  CirSim.theApp.register("NDarlingtonElm", new NDarlingtonElm(0, 0));
  CirSim.theApp.register("NJfetElm", new NJfetElm(0, 0));
  CirSim.theApp.register("NMosfetElm", new NMosfetElm(0, 0));
  CirSim.theApp.register("NTransistorElm", new NTransistorElm(0, 0));
  CirSim.theApp.register("NandGateElm", new NandGateElm(0, 0));
  CirSim.theApp.register("NoiseElm", new NoiseElm(0, 0));
  CirSim.theApp.register("NorGateElm", new NorGateElm(0, 0));
  CirSim.theApp.register("NortonAmpElm", new NortonAmpElm(0, 0));
  CirSim.theApp.register("OTAElm", new OTAElm(0, 0));
  CirSim.theApp.register("OhmMeterElm", new OhmMeterElm(0, 0));
  CirSim.theApp.register("OpAmpElm", new OpAmpElm(0, 0));
  CirSim.theApp.register("OpAmpRealElm", new OpAmpRealElm(0, 0));
  CirSim.theApp.register("OpAmpSwapElm", new OpAmpSwapElm(0, 0));
  CirSim.theApp.register("OptocouplerElm", new OptocouplerElm(0, 0));
  CirSim.theApp.register("OrGateElm", new OrGateElm(0, 0));
  CirSim.theApp.register("OutputElm", new OutputElm(0, 0));
  CirSim.theApp.register("PDarlingtonElm", new PDarlingtonElm(0, 0));
  CirSim.theApp.register("PJfetElm", new PJfetElm(0, 0));
  CirSim.theApp.register("PMosfetElm", new PMosfetElm(0, 0));
  CirSim.theApp.register("PTransistorElm", new PTransistorElm(0, 0));
  CirSim.theApp.register("PhaseCompElm", new PhaseCompElm(0, 0));
  CirSim.theApp.register("PisoShiftElm", new PisoShiftElm(0, 0));
  CirSim.theApp.register("PolarCapacitorElm", new PolarCapacitorElm(0, 0));
  CirSim.theApp.register("PotElm", new PotElm(0, 0));
  CirSim.theApp.register("ProbeElm", new ProbeElm(0, 0));
  CirSim.theApp.register("PushSwitchElm", new PushSwitchElm(0, 0));
  CirSim.theApp.register("ROMElm", new ROMElm(0, 0));
  CirSim.theApp.register("RailElm", new RailElm(0, 0));
  CirSim.theApp.register("RelayCoilElm", new RelayCoilElm(0, 0));
  CirSim.theApp.register("RelayContactElm", new RelayContactElm(0, 0));
  CirSim.theApp.register("RelayElm", new RelayElm(0, 0));
  CirSim.theApp.register("ResistorElm", new ResistorElm(0, 0));
  CirSim.theApp.register("RingCounterElm", new RingCounterElm(0, 0));
  CirSim.theApp.register("RoutedWireElm", new RoutedWireElm(0, 0));
  CirSim.theApp.register("SCRElm", new SCRElm(0, 0));
  CirSim.theApp.register("SRAMElm", new SRAMElm(0, 0));
  CirSim.theApp.register("SchmittElm", new SchmittElm(0, 0));
  CirSim.theApp.register("ScopeElm", new ScopeElm(0, 0));
  CirSim.theApp.register("SeqGenElm", new SeqGenElm(0, 0));
  CirSim.theApp.register("SevenSegDecoderElm", new SevenSegDecoderElm(0, 0));
  CirSim.theApp.register("SevenSegElm", new SevenSegElm(0, 0));
  CirSim.theApp.register("SipoShiftElm", new SipoShiftElm(0, 0));
  CirSim.theApp.register("SparkGapElm", new SparkGapElm(0, 0));
  CirSim.theApp.register("SquareRailElm", new SquareRailElm(0, 0));
  CirSim.theApp.register("StopTriggerElm", new StopTriggerElm(0, 0));
  CirSim.theApp.register("SweepElm", new SweepElm(0, 0));
  CirSim.theApp.register("Switch2Elm", new Switch2Elm(0, 0));
  CirSim.theApp.register("SwitchElm", new SwitchElm(0, 0));
  CirSim.theApp.register("TFlipFlopElm", new TFlipFlopElm(0, 0));
  CirSim.theApp.register("TappedTransformerElm", new TappedTransformerElm(0, 0));
  CirSim.theApp.register("TestPointElm", new TestPointElm(0, 0));
  CirSim.theApp.register("TextElm", new TextElm(0, 0));
  CirSim.theApp.register("ThermistorNTCElm", new ThermistorNTCElm(0, 0));
  CirSim.theApp.register("ThreePhaseMotorElm", new ThreePhaseMotorElm(0, 0));
  CirSim.theApp.register("TimeDelayRelayElm", new TimeDelayRelayElm(0, 0));
  CirSim.theApp.register("TimerElm", new TimerElm(0, 0));
  CirSim.theApp.register("TransLineElm", new TransLineElm(0, 0));
  CirSim.theApp.register("TransformerElm", new TransformerElm(0, 0));
  CirSim.theApp.register("TriStateElm", new TriStateElm(0, 0));
  CirSim.theApp.register("TriacElm", new TriacElm(0, 0));
  CirSim.theApp.register("TriodeElm", new TriodeElm(0, 0));
  CirSim.theApp.register("TunnelDiodeElm", new TunnelDiodeElm(0, 0));
  CirSim.theApp.register("ControlledCurrentElm", new ControlledCurrentElm(0, 0));
  CirSim.theApp.register("ControlledVoltageElm", new ControlledVoltageElm(0, 0));
  CirSim.theApp.register("VCCSElm", new VCCSElm(0, 0));
  CirSim.theApp.register("VCOElm", new VCOElm(0, 0));
  CirSim.theApp.register("VCVSElm", new VCVSElm(0, 0));
  CirSim.theApp.register("VarRailElm", new VarRailElm(0, 0));
  CirSim.theApp.register("VaractorElm", new VaractorElm(0, 0));
  CirSim.theApp.register("VoltageElm", new VoltageElm(0, 0, VoltageElm.WF_DC));
  CirSim.theApp.register("WattmeterElm", new WattmeterElm(0, 0));
  CirSim.theApp.register("WattmeterTrueElm", new WattmeterTrueElm(0, 0));
  CirSim.theApp.register("WireElm", new WireElm(0, 0));
  CirSim.theApp.register("XnorGateElm", new XnorGateElm(0, 0));
  CirSim.theApp.register("XorGateElm", new XorGateElm(0, 0));
  CirSim.theApp.register("ZenerElm", new ZenerElm(0, 0));
  CirSim.theApp.register("UnijunctionElm", new UnijunctionElm(0, 0));
  CirSim.theApp.register("SubcircuitElm", new SubcircuitElm(0, 0));
}

export { registerElements };
