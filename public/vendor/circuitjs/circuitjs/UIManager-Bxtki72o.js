import { z as CheckItem, L as Locale, A as MenuItem, w as Rectangle, a as CirSim, c as CircuitElm, p as parseIntStrict, b as CircuitXMLSerializer, P as Point, e as Checkbox, E as EditInfo, S as SubcircuitModel, B as Menus, h as CommandPaletteRegistry, f as Color, n as MouseManager, G as Graphics, m as Scope, r as parseFloatStrict, q as CircuitLoader, o as ExportAsLocalFileDialog, t as ScrollValuePopup } from './CircuitElm-D0NL-LPP.js';
import { E as EditSubcircuitModelDialog } from './EditSubcircuitModelDialog-C5vUSIFP.js';
import { K as KeyNames } from './KeyNames-CtQ8ZgWT.js';

class ScopePopupMenu {
  ul;
  maxScaleItem;
  stackItem;
  unstackItem;
  combineItem;
  dockItem;
  undockItem;
  constructor(app) {
    this.ul = document.createElement("ul");
    const addPlain = (label, cmdName) => {
      const item = new MenuItem();
      const li = document.createElement("li");
      li.className = "menuItem";
      li.innerHTML = `<span class="checkMark" style="visibility:hidden">&#10003;</span> ${Locale.LS(label)}`;
      li.addEventListener("click", (e) => {
        if (li.classList.contains("menuItemDisabled")) return;
        e.stopPropagation();
        if (app) app.commands.menuPerformed("scopepop", cmdName);
      });
      item._li = li;
      this.ul.appendChild(li);
      return item;
    };
    addPlain("Remove Scope", "remove");
    this.dockItem = addPlain("Dock Scope", "dock");
    this.undockItem = addPlain("Undock Scope", "undock");
    this.maxScaleItem = new CheckItem(false);
    const maxLi = document.createElement("li");
    maxLi.className = "menuItem";
    maxLi.innerHTML = `<span class="checkMark" style="visibility:hidden">&#10003;</span> ${Locale.LS("Max Scale")}`;
    this.maxScaleItem._li = maxLi;
    maxLi.addEventListener("click", (e) => {
      e.stopPropagation();
      if (app) app.commands.menuPerformed("scopepop", "maxscale");
    });
    this.ul.appendChild(maxLi);
    this.stackItem = addPlain("Stack", "stack");
    this.unstackItem = addPlain("Unstack", "unstack");
    this.combineItem = addPlain("Combine", "combine");
    addPlain("Remove Plot", "removeplot");
    addPlain("Reset", "reset");
    addPlain("Export CSV...", "exportcsv");
    addPlain("Export Image...", "exportimage");
    addPlain("Properties...", "properties");
  }
  doScopePopupChecks(floating, canstack, cancombine, canunstack, s) {
    this.maxScaleItem.setState(s.maxScale);
    setLiVisible(this.stackItem._li, !floating);
    this.stackItem.setEnabled(canstack);
    setLiVisible(this.unstackItem._li, !floating);
    this.unstackItem.setEnabled(canunstack);
    setLiVisible(this.combineItem._li, !floating);
    this.combineItem.setEnabled(cancombine);
    setLiVisible(this.dockItem._li, floating);
    setLiVisible(this.undockItem._li, !floating);
  }
  getMenuBar() {
    return this.ul;
  }
}
function setLiVisible(li, visible) {
  if (li) li.style.display = visible ? "" : "none";
}

class ScopeManager {
  sim;
  scopes;
  scopeCount;
  scopeColCount;
  scopeSelected = -1;
  scopeMenuSelected = -1;
  menuScope = -1;
  menuPlot = -1;
  scopeHeightFraction = 0.2;
  oldScopeCount = -1;
  scopePopupMenu = null;
  // GWT MenuBar/MenuItem skipped; init() and composeSelectScopeMenu() are stubs.
  selectScopeMenuBar = null;
  constructor(sim) {
    this.sim = sim;
    this.scopes = new Array(20);
    this.scopeColCount = new Array(20).fill(0);
    this.scopeCount = 0;
    this.init();
  }
  init() {
    this.scopePopupMenu = new ScopePopupMenu(this.sim);
  }
  composeSelectScopeMenu(sb) {
  }
  scopeMenuIsSelected(s) {
    if (this.scopeMenuSelected < 0)
      return false;
    if (this.scopeMenuSelected < this.scopeCount)
      return this.scopes[this.scopeMenuSelected] === s;
    return this.getNthScopeElm(this.scopeMenuSelected - this.scopeCount)?.elmScope === s;
  }
  timeStep() {
    let i;
    for (i = 0; i !== this.scopeCount; i++)
      this.scopes[i].timeStep();
    const scopeElmArr = this.sim.scopeElmArr;
    if (scopeElmArr !== null) {
      for (i = 0; i !== scopeElmArr.length; i++)
        scopeElmArr[i].stepScope();
    }
  }
  setupScopes() {
    let i;
    let pos = -1;
    for (i = 0; i < this.scopeCount; i++) {
      if (!this.scopes[i]) {
        this.scopeCount = i;
        break;
      }
      if (this.scopes[i].needToRemove()) {
        let j;
        for (j = i; j < this.scopeCount; j++)
          this.scopes[j] = this.scopes[j + 1];
        this.scopeCount--;
        i--;
        continue;
      }
      if (this.scopes[i].position > pos + 1)
        this.scopes[i].position = pos + 1;
      pos = this.scopes[i].position;
    }
    while (this.scopeCount > 0 && this.scopes[this.scopeCount - 1]?.getElm() === null)
      this.scopeCount--;
    const ui = this.sim.ui;
    const h = ui.canvasHeight - this.sim.circuitArea.height;
    pos = 0;
    for (i = 0; i !== this.scopeCount; i++)
      this.scopeColCount[i] = 0;
    for (i = 0; i !== this.scopeCount; i++) {
      pos = ScopeManager.max(this.scopes[i].position, pos);
      this.scopeColCount[this.scopes[i].position]++;
    }
    const colct = pos + 1;
    let iw = CirSim.infoWidth;
    if (colct <= 2)
      iw = Math.trunc(iw * 3 / 2);
    let w = Math.trunc((ui.canvasWidth - iw) / colct);
    const marg = 10;
    if (w < marg * 2)
      w = marg * 2;
    pos = -1;
    let colh = 0;
    let row = 0;
    let speed = 0;
    for (i = 0; i !== this.scopeCount; i++) {
      const s = this.scopes[i];
      if (s.position > pos) {
        pos = s.position;
        colh = Math.trunc(h / this.scopeColCount[pos]);
        row = 0;
        speed = s.speed;
      }
      if (s.speed !== speed) {
        s.speed = speed;
        s.resetGraph();
      }
      const r = new Rectangle(pos * w, ui.canvasHeight - h + colh * row, w - marg, colh);
      row++;
      if (!r.equals(s.rect))
        s.setRect(r);
    }
    if (this.oldScopeCount !== this.scopeCount) {
      ui.setCircuitArea();
      this.oldScopeCount = this.scopeCount;
    }
  }
  // we need to calculate wire currents for every iteration if someone is viewing a wire in the
  // scope.  Otherwise we can do it only once per frame.
  canDelayWireProcessing() {
    let i;
    for (i = 0; i !== this.scopeCount; i++)
      if (this.scopes[i].viewingWire())
        return false;
    for (const ce of this.sim.elmList)
      if (ce.isScopeElm() && ce.elmScope !== null && ce.elmScope.viewingWire())
        return false;
    return true;
  }
  countScopeElms() {
    let c = 0;
    for (let i = 0; i !== this.sim.elmList.length; i++) {
      if (this.sim.elmList[i].isScopeElm())
        c++;
    }
    return c;
  }
  getNthScopeElm(n) {
    for (let i = 0; i !== this.sim.elmList.length; i++) {
      if (this.sim.elmList[i].isScopeElm()) {
        n--;
        if (n < 0)
          return this.sim.elmList[i];
      }
    }
    return null;
  }
  canStackScope(s) {
    if (this.scopeCount < 2)
      return false;
    if (s === 0)
      s = 1;
    if (this.scopes[s].position === this.scopes[s - 1].position)
      return false;
    return true;
  }
  canCombineScope(s) {
    return this.scopeCount >= 2;
  }
  canUnstackScope(s) {
    if (this.scopeCount < 2)
      return false;
    if (s === 0)
      s = 1;
    if (this.scopes[s].position !== this.scopes[s - 1].position) {
      if (s + 1 < this.scopeCount && this.scopes[s + 1].position === this.scopes[s].position)
        return true;
      else
        return false;
    }
    return true;
  }
  stackScope(s) {
    if (!this.canStackScope(s))
      return;
    if (s === 0) {
      s = 1;
    }
    this.scopes[s].position = this.scopes[s - 1].position;
    for (s++; s < this.scopeCount; s++)
      this.scopes[s].position--;
  }
  unstackScope(s) {
    if (!this.canUnstackScope(s))
      return;
    if (s === 0) {
      s = 1;
    }
    if (this.scopes[s].position !== this.scopes[s - 1].position)
      s++;
    for (; s < this.scopeCount; s++)
      this.scopes[s].position++;
  }
  combineScope(s) {
    if (!this.canCombineScope(s))
      return;
    if (s === 0) {
      s = 1;
    }
    this.scopes[s - 1].combine(this.scopes[s]);
    this.scopes[s].setElm(null);
  }
  stackAll() {
    let i;
    for (i = 0; i !== this.scopeCount; i++) {
      this.scopes[i].position = 0;
      this.scopes[i].showMax = this.scopes[i].showMin = false;
    }
  }
  unstackAll() {
    let i;
    for (i = 0; i !== this.scopeCount; i++) {
      this.scopes[i].position = i;
      this.scopes[i].showMax = true;
    }
  }
  combineAll() {
    let i;
    for (i = this.scopeCount - 2; i >= 0; i--) {
      this.scopes[i].combine(this.scopes[i + 1]);
      this.scopes[i + 1].setElm(null);
    }
  }
  separateAll() {
    let i;
    const newscopes = new Array(20);
    let ct = 0;
    for (i = 0; i < this.scopeCount; i++)
      ct = this.scopes[i].separate(newscopes, ct);
    this.scopes = newscopes;
    this.scopeCount = ct;
  }
  deleteUnusedScopeElms() {
    for (let i = this.sim.elmList.length - 1; i >= 0; i--) {
      const ce = this.sim.elmList[i];
      if (ce.isScopeElm() && ce.elmScope !== null && ce.elmScope.needToRemove()) {
        ce.delete();
        this.sim.elmList.splice(i, 1);
        this.sim.needAnalyze();
      }
    }
  }
  addScope(sc) {
    if (sc.position < 0)
      sc.position = this.scopeCount;
    this.scopes[this.scopeCount++] = sc;
  }
  clearScopes() {
    this.scopeCount = 0;
  }
  resetGraphs() {
    for (let i = 0; i !== this.scopeCount; i++)
      this.scopes[i].resetGraphFull(true);
  }
  static max(a, b) {
    return a > b ? a : b;
  }
}

class SwitchElm extends CircuitElm {
  momentary;
  // position 0 == closed, position 1 == open
  position;
  posCount;
  resistance = 0;
  static COMPOSITE_CLOSED_R = 1e-3;
  static FLAG_IEC = 2;
  static FLAG_LABEL = 4;
  label;
  keyShortcut;
  constructor(xa, ya, xbOrMm, yb, f, st) {
    if (yb === void 0) {
      super(xa, ya);
      if (typeof xbOrMm === "boolean") {
        const mm = xbOrMm;
        this.position = mm ? 1 : 0;
        this.momentary = mm;
      } else {
        this.momentary = false;
        this.position = 0;
      }
      this.posCount = 2;
      this.label = null;
      this.keyShortcut = null;
    } else {
      super(xa, ya, xbOrMm, yb, f);
      const str = st.nextToken();
      const isLogicInput = this.isLogicInputElm();
      if (str === "true")
        this.position = isLogicInput ? 0 : 1;
      else if (str === "false")
        this.position = isLogicInput ? 1 : 0;
      else
        this.position = parseIntStrict(str);
      this.momentary = st.nextToken() === "true";
      this.posCount = 2;
      this.label = null;
      if ((this.flags & SwitchElm.FLAG_LABEL) !== 0)
        this.label = st.nextToken();
      this.keyShortcut = null;
    }
  }
  getDumpType() {
    return "s".charCodeAt(0);
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    if (this.position !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "p", this.position);
    if (this.momentary)
      CircuitXMLSerializer.dumpAttr(elem, "mm", this.momentary);
    if (this.label !== null)
      CircuitXMLSerializer.dumpAttr(elem, "lab", this.label);
    if (this.keyShortcut !== null)
      CircuitXMLSerializer.dumpAttr(elem, "key", this.keyShortcut);
    if (this.resistance !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "r", this.resistance);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.position = xml.parseIntAttr("p", this.position);
    this.momentary = xml.parseBooleanAttr("mm", this.momentary);
    this.label = xml.parseStringAttr("lab", this.label);
    this.keyShortcut = xml.parseStringAttr("key", this.keyShortcut);
    this.resistance = xml.parseDoubleAttr("r", 0);
  }
  ps = new Point();
  ps2 = new Point();
  extraPoints = [];
  openhs = 16;
  setPoints() {
    super.setPoints();
    this.calcLeads(32);
    this.ps = new Point();
    this.ps2 = new Point();
    if (this.useIECSymbol()) {
      this.extraPoints = this.newPointArray(7);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[0], 0.5, this.openhs / 2);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[1], 0.5, 24);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[2], 0.5 - 0.1, 24);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[3], 0.5 + 0.1, 24);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[4], 0.5, 19);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[5], 0.5 - 0.1, 16);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[6], 0.5, 13);
    }
  }
  draw(g) {
    const hs1 = this.position === 1 ? 0 : 2;
    const hs2 = this.position === 1 ? this.openhs : 2;
    this.setBbox(this.point1, this.point2, this.openhs);
    this.draw2Leads(g);
    if (this.position === 0)
      this.doDots(g);
    if (!this.needsHighlight())
      g.setColor(CircuitElm.whiteColor);
    this.interpPoint(this.lead1, this.lead2, this.ps, 0, hs1);
    this.interpPoint(this.lead1, this.lead2, this.ps2, 1, hs2);
    CircuitElm.drawThickLine(g, this.ps, this.ps2);
    if (this.label !== null) {
      g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
      if (Math.abs(this.dy) > Math.abs(this.dx))
        g.drawString(this.label, this.x + 10, (this.y < this.y2 ? this.lead1 : this.lead2).y - 5);
      else {
        g.save();
        g.context.textAlign = "center";
        g.drawString(this.label, (this.x + this.x2) / 2, this.x2 > this.x ? this.y + 15 : this.y - 15);
        g.restore();
      }
    }
    if (this.useIECSymbol()) {
      g.drawLine(this.extraPoints[2], this.extraPoints[3]);
      g.setLineDash(3, 3);
      this.interpPoint(this.lead1, this.lead2, this.extraPoints[0], 0.5, this.position === 1 ? this.openhs / 2 : 2);
      if (this.momentary)
        g.drawLine(this.extraPoints[1], this.extraPoints[0]);
      else {
        g.drawLine(this.extraPoints[6], this.extraPoints[0]);
        g.drawLine(this.extraPoints[1], this.extraPoints[4]);
      }
      g.setLineDash(0, 0);
      if (!this.momentary) {
        g.drawLine(this.extraPoints[4], this.extraPoints[5]);
        g.drawLine(this.extraPoints[6], this.extraPoints[5]);
      }
    }
    this.drawPosts(g);
  }
  isSwitchElm() {
    return true;
  }
  getSwitchRect() {
    this.interpPoint(this.lead1, this.lead2, this.ps, 0, this.openhs);
    const x = Math.min(this.lead1.x, this.lead2.x, this.ps.x);
    const y = Math.min(this.lead1.y, this.lead2.y, this.ps.y);
    const w = Math.abs(this.lead2.x - this.lead1.x) + Math.abs(this.ps.x - this.lead1.x);
    const h = Math.abs(this.lead2.y - this.lead1.y) + Math.abs(this.ps.y - this.lead1.y);
    return new Rectangle(x, y, w, h);
  }
  calculateCurrent() {
    if (this.position === 1)
      this.current = 0;
    else if (this.resistance > 0)
      this.current = (this.nodes[0].v - this.nodes[1].v) / this.resistance;
    else if (this.parent != null)
      this.current = (this.nodes[0].v - this.nodes[1].v) / SwitchElm.COMPOSITE_CLOSED_R;
  }
  mouseUp() {
    if (this.momentary)
      this.toggle();
  }
  simpleToggle() {
    this.position++;
    if (this.position >= this.posCount)
      this.position = 0;
  }
  toggle() {
    this.simpleToggle();
    if (this.label !== null) {
      for (let i = 0; i !== CircuitElm.sim.elmList.length; i++) {
        const o = CircuitElm.sim.elmList[i];
        if (o instanceof SwitchElm && o !== this) {
          const s2 = o;
          if (this.label === s2.label)
            s2.simpleToggle();
        }
      }
    }
  }
  getElmType() {
    return "switch (SPST)";
  }
  getInfo(arr) {
    arr[0] = this.momentary ? "push switch (SPST)" : "switch (SPST)";
    if (this.position === 1) {
      arr[1] = "open";
      arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
    } else {
      arr[1] = "closed";
      arr[2] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
      arr[3] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
    }
  }
  getConnection(n1, n2) {
    return this.position === 0;
  }
  isWireEquivalent() {
    return this.position === 0 && this.parent == null && this.resistance === 0;
  }
  isRemovableWire() {
    return this.position === 0 && this.parent == null && this.resistance === 0;
  }
  stamp() {
    if (this.position === 0) {
      if (this.resistance > 0)
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], this.resistance);
      else if (this.parent != null)
        CircuitElm.sim.stampResistor(this.nodes[0], this.nodes[1], SwitchElm.COMPOSITE_CLOSED_R);
    }
  }
  useIECSymbol() {
    return (this.flags & SwitchElm.FLAG_IEC) !== 0;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Momentary Switch", this.momentary);
      return ei;
    }
    if (n === 1)
      return EditInfo.createCheckbox("IEC Symbol", this.useIECSymbol());
    if (n === 2)
      return new EditInfo("Label (for linking)", this.label === null ? "" : this.label);
    if (n === 3)
      return this.getKeyShortcutEditInfo();
    if (n === 4) {
      const ei = new EditInfo("On Resistance (ohms)", this.resistance);
      ei.setNonNegative();
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.momentary = ei.checkbox.getState();
    if (n === 1) {
      this.flags = ei.changeFlag(this.flags, SwitchElm.FLAG_IEC);
      this.setPoints();
    }
    if (n === 2) {
      this.label = ei.textf.value;
      if (this.label.length === 0) {
        this.label = null;
        this.flags &= ~SwitchElm.FLAG_LABEL;
      } else
        this.flags |= SwitchElm.FLAG_LABEL;
    }
    if (n === 3)
      this.setKeyShortcutEditValue(ei);
    if (n === 4)
      this.resistance = ei.value;
  }
  // helper methods for keyboard shortcut edit field, usable by subclasses
  getKeyShortcutEditInfo() {
    return new EditInfo("Keyboard Shortcut", this.keyShortcut === null ? "" : this.keyShortcut);
  }
  setKeyShortcutEditValue(ei) {
    const s = ei.textf.value.trim();
    if (s.length === 0)
      this.keyShortcut = null;
    else
      this.keyShortcut = s.substring(0, 1).toLowerCase();
  }
  addRoutingObstacle(router) {
    if (this.x === this.x2 || this.y === this.y2) {
      router.addWire(this.x, this.y, this.x2, this.y2);
      const pa = this.interpPoint(this.lead1, this.lead2, 0, 0);
      const pb = this.interpPoint(this.lead1, this.lead2, 1, this.openhs);
      router.addObstacle(pa.x, pa.y, pb.x, pb.y);
    }
  }
  getShortcut() {
    return "s".charCodeAt(0);
  }
}

class MyCommand {
  menu;
  className;
  constructor(menu, className) {
    this.menu = menu;
    this.className = className;
  }
  execute() {
    CirSim.theApp.commands.menuPerformed(this.menu, this.className);
  }
  getMenuName() {
    return this.menu;
  }
  getItemName() {
    return this.className;
  }
  setItemName(name) {
    this.className = name;
  }
}

class Toolbar {
  element;
  modeLabel;
  highlightableButtons = /* @__PURE__ */ new Map();
  activeButton = null;
  resistorButton;
  // variant popups (from createButtonSet) and the buttons that open them, so
  // opening one can close the others, and tapping/clicking outside any of them
  // can close them all (mainly needed on touch devices, which have no hover-out)
  paletteContainers = [];
  paletteButtons = [];
  globalPopupCloserInstalled = false;
  constructor() {
    this.element = document.createElement("div");
    const style = this.element.style;
    style.padding = "2px";
    style.backgroundColor = "#f8f8f8";
    style.borderWidth = "1px";
    style.borderStyle = "solid";
    style.borderColor = "#ccc";
    style.display = "flex";
    style.alignItems = "center";
    style.flexWrap = "nowrap";
    style.overflow = "hidden";
    style.boxSizing = "border-box";
    this.element.appendChild(this.createIconButton("reply", "Undo", new MyCommand("edit", "undo")));
    this.element.appendChild(this.createIconButton("forward", "Redo", new MyCommand("edit", "redo")));
    this.element.appendChild(this.createIconButton("scissors", "Cut", new MyCommand("edit", "cut")));
    this.element.appendChild(this.createIconButton("copy", "Copy", new MyCommand("edit", "copy")));
    this.element.appendChild(this.createIconButton("paste", "Paste", new MyCommand("edit", "paste")));
    this.element.appendChild(this.createIconButton("clone", "Duplicate", new MyCommand("edit", "duplicate")));
    this.element.appendChild(this.createIconButton("search", "Find Component/Command...", new MyCommand("edit", "search")));
    this.element.appendChild(this.createIconButton("zoom-11", "Zoom 100%", new MyCommand("zoom", "zoom100")));
    this.element.appendChild(this.createIconButton("zoom-in", "Zoom In", new MyCommand("zoom", "zoomin")));
    this.element.appendChild(this.createIconButton("zoom-out", "Zoom Out", new MyCommand("zoom", "zoomout")));
    this.element.appendChild(this.createIconButtonForClass(this.wireIcon, "WireElm"));
    this.resistorButton = this.createIconButtonForClass(this.resistorIcon, "ResistorElm");
    this.element.appendChild(this.resistorButton);
    this.element.appendChild(this.createIconButtonForClass(this.groundIcon, "GroundElm"));
    const capacitorInfo = [this.capacitorIcon, "CapacitorElm", this.polarCapacitorIcon, "PolarCapacitorElm"];
    this.element.appendChild(this.createButtonSet(capacitorInfo));
    this.element.appendChild(this.createIconButtonForClass(this.inductIcon, "InductorElm"));
    this.element.appendChild(this.createIconButtonForClass(this.diodeIcon, "DiodeElm"));
    const srcInfo = [this.voltage2Icon, "DCVoltageElm", this.acSrcIcon, "ACVoltageElm"];
    this.element.appendChild(this.createButtonSet(srcInfo));
    this.element.appendChild(this.createIconButtonForClass(this.railIcon, "RailElm"));
    const switchInfo = [
      this.switchIcon,
      "SwitchElm",
      this.spdtIcon,
      "Switch2Elm",
      this.aswitch1Icon,
      "AnalogSwitchElm",
      this.aswitch2Icon,
      "AnalogSwitch2Elm"
    ];
    this.element.appendChild(this.createButtonSet(switchInfo));
    const opAmpInfo = [this.opAmpBotIcon, "OpAmpElm", this.opAmpTopIcon, "OpAmpSwapElm"];
    this.element.appendChild(this.createButtonSet(opAmpInfo));
    const transistorInfo = [this.transistorIcon, "NTransistorElm", this.pnpTransistorIcon, "PTransistorElm"];
    this.element.appendChild(this.createButtonSet(transistorInfo));
    const fetInfo = [this.fetIcon, "NMosfetElm", this.fetIcon2, "PMosfetElm"];
    this.element.appendChild(this.createButtonSet(fetInfo));
    this.element.appendChild(this.createIconButtonForClass(this.inverterIcon, "InverterElm"));
    const gateInfo = [
      this.andIcon,
      "AndGateElm",
      this.nandIcon,
      "NandGateElm",
      this.orIcon,
      "OrGateElm",
      this.norIcon,
      "NorGateElm",
      this.xorIcon,
      "XorGateElm",
      this.xnorIcon,
      "XnorGateElm"
    ];
    this.element.appendChild(this.createButtonSet(gateInfo));
    this.modeLabel = document.createElement("span");
    this.styleModeLabel(this.modeLabel);
    this.element.appendChild(this.modeLabel);
  }
  setModeLabel(text) {
    this.modeLabel.textContent = text;
  }
  createIconButtonForClass(icon, cls) {
    const app = CirSim.theApp;
    return this.createIconButton(icon, app.getLabelTextForClass(cls) ?? cls, new MyCommand("main", cls));
  }
  createIconButton(iconClass, tooltip, command) {
    const iconLabel = document.createElement("span");
    if (iconClass.startsWith("<svg"))
      iconLabel.innerHTML = this.makeSvg(iconClass, 24);
    else
      iconLabel.classList.add("cirjsicon-" + iconClass);
    iconLabel.title = Locale.LS(tooltip);
    const style = iconLabel.style;
    style.fontSize = "24px";
    style.color = "#333";
    style.padding = "1px";
    style.marginRight = "5px";
    style.cursor = "pointer";
    if (iconClass.startsWith("<svg"))
      style.paddingTop = "5px";
    style.touchAction = "none";
    iconLabel.addEventListener("mouseover", () => iconLabel.style.color = "#007bff");
    iconLabel.addEventListener("mouseout", () => iconLabel.style.color = "#333");
    iconLabel.addEventListener("click", () => {
      iconLabel.style.color = "#333";
      if (iconLabel === this.activeButton) {
        new MyCommand("main", "Select").execute();
        this.activeButton = null;
      } else
        command.execute();
    });
    if (command.getMenuName() === "main") {
      this.highlightableButtons.set(command.getItemName(), iconLabel);
      iconLabel.addEventListener("mousedown", (mde) => {
        if (mde.button === 0)
          UIManager.theUI.mouse.beginToolbarDrag(command.getItemName(), mde.clientX, mde.clientY);
      });
      this.addTouchDragSupport(iconLabel);
      iconLabel.addEventListener("mouseover", () => {
        const label = CirSim.theApp.getLabelTextForClass(command.getItemName());
        if (label != null)
          this.setModeLabel(label + Locale.LS(": Drag And Drop To Create"));
      });
      iconLabel.addEventListener("mouseout", () => UIManager.theUI.updateToolbar());
    }
    return iconLabel;
  }
  // Translate touch gestures on a toolbar button into the synthetic mouse events that
  // beginToolbarDrag/toolbarDragMove/toolbarDragEnd already expect, since iOS/touch browsers
  // don't emit real mousemove events during a touch-drag (they just pan the page instead).
  // touchstart re-dispatches a "mousedown" on the button itself, which the existing
  // mousedown handler picks up; touchmove/touchend dispatch "mousemove"/"mouseup" on the
  // document so the document-level listeners (which drive the drag once it's pending)
  // see them just like they would for a real mouse drag.
  addTouchDragSupport(el) {
    let startX = 0, startY = 0, moved = false;
    const TAP_THRESHOLD = 6;
    el.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1)
        return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      moved = false;
      el.dispatchEvent(new MouseEvent("mouseover", { clientX: t.clientX, clientY: t.clientY, bubbles: true, cancelable: true }));
      el.dispatchEvent(new MouseEvent("mousedown", { clientX: t.clientX, clientY: t.clientY, bubbles: true, cancelable: true, button: 0 }));
    }, { passive: true });
    el.addEventListener("touchmove", (e) => {
      if (e.touches.length !== 1)
        return;
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - startX, dy = t.clientY - startY;
      if (dx * dx + dy * dy > TAP_THRESHOLD * TAP_THRESHOLD)
        moved = true;
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: t.clientX, clientY: t.clientY, bubbles: true, cancelable: true }));
    }, { passive: false });
    el.addEventListener("touchend", (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      document.dispatchEvent(new MouseEvent("mouseup", { clientX: t.clientX, clientY: t.clientY, bubbles: true, cancelable: true }));
      if (!moved)
        el.dispatchEvent(new MouseEvent("click", { clientX: t.clientX, clientY: t.clientY, bubbles: true, cancelable: true }));
      el.style.color = "#333";
    }, { passive: false });
    el.addEventListener("touchcancel", (e) => {
      const t = e.changedTouches[0];
      document.dispatchEvent(new MouseEvent("mouseup", { clientX: t.clientX, clientY: t.clientY, bubbles: true, cancelable: true }));
      el.style.color = "#333";
    }, { passive: true });
  }
  // Closes the palette once a touch that started on its owning button (which is
  // where the popup opens from) moves off of both the button and the popup.
  // Can't just close on touchstart/mousedown like a real mouse-drag effectively
  // does via mouseout -- touchstart on this same element is also what opens the
  // popup (see addTouchDragSupport's synthetic mouseover), so closing immediately
  // there would close the popup the instant it appears.
  addPopupDismissOnLeave(el, popupEl) {
    el.addEventListener("touchmove", (e) => {
      if (e.touches.length !== 1)
        return;
      if (popupEl.style.display === "none")
        return;
      const t = e.touches[0];
      const pr = popupEl.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      const inPopup = t.clientX >= pr.left && t.clientX <= pr.right && t.clientY >= pr.top && t.clientY <= pr.bottom;
      const inButton = t.clientX >= er.left && t.clientX <= er.right && t.clientY >= er.top && t.clientY <= er.bottom;
      if (!inPopup && !inButton)
        this.closeAllPalettes();
    }, { passive: true });
  }
  closeAllPalettes() {
    for (const p of this.paletteContainers)
      p.style.display = "none";
  }
  // Closes all open variant popups when the user taps/clicks anywhere that isn't
  // one of the popups or one of the buttons that open them. Needed on touch
  // devices, which never send a mouseout to close a popup the way hovering away
  // does on desktop.
  installGlobalPopupCloser() {
    if (this.globalPopupCloserInstalled)
      return;
    this.globalPopupCloserInstalled = true;
    const handler = (e) => {
      const t = e.target;
      if (!(t instanceof Node))
        return;
      for (const p of this.paletteContainers)
        if (p.contains(t))
          return;
      for (const b of this.paletteButtons)
        if (b.contains(t))
          return;
      this.closeAllPalettes();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
  }
  makeSvg(s, size) {
    const scale = size / 24;
    return "<svg xmlns='http://www.w3.org/2000/svg' width='" + size + "' height='" + size + "'><g transform='scale(" + scale + ")'>" + s.substring(5, s.length - 5) + "<g></svg>";
  }
  // New method for creating variant buttons
  createButtonSet(info) {
    const mainCommand = new MyCommand("main", info[1]);
    const app = CirSim.theApp;
    const iconLabel = this.createIconButton(info[0], app.getLabelTextForClass(info[1]) ?? info[1], mainCommand);
    const paletteContainer = document.createElement("div");
    paletteContainer.style.display = "none";
    paletteContainer.className = "palette-container";
    const paletteStyle = paletteContainer.style;
    paletteStyle.position = "absolute";
    paletteStyle.zIndex = "1000";
    paletteStyle.backgroundColor = "#ffffff";
    paletteStyle.borderWidth = "1px";
    paletteStyle.borderColor = "#ccc";
    paletteStyle.borderStyle = "solid";
    paletteStyle.padding = "5px";
    paletteStyle.display = "none";
    paletteStyle.flexDirection = "column";
    for (let i = 0; i < info.length; i += 2) {
      const variantButton = document.createElement("span");
      variantButton.innerHTML = this.makeSvg(info[i], 40);
      variantButton.title = app.getLabelTextForClass(info[i + 1]) ?? info[i + 1];
      const variantStyle = variantButton.style;
      variantStyle.color = "#333";
      variantStyle.cursor = "pointer";
      variantStyle.touchAction = "none";
      const command = new MyCommand("main", info[i + 1]);
      const smallSvg = this.makeSvg(info[i], 24);
      const selectVariant = () => {
        iconLabel.innerHTML = smallSvg;
        this.highlightableButtons.delete(mainCommand.getItemName());
        this.highlightableButtons.set(command.getItemName(), iconLabel);
        mainCommand.setItemName(command.getItemName());
        this.closeAllPalettes();
        command.execute();
      };
      variantButton.addEventListener("click", () => selectVariant());
      variantButton.addEventListener("mousedown", (mde) => {
        if (mde.button === 0) {
          selectVariant();
          UIManager.theUI.mouse.beginToolbarDrag(command.getItemName(), mde.clientX, mde.clientY);
        }
      });
      this.addTouchDragSupport(variantButton);
      variantButton.addEventListener("mouseover", () => {
        const label = app.getLabelTextForClass(command.getItemName());
        if (label != null)
          this.setModeLabel(label + Locale.LS(": Drag And Drop To Create"));
      });
      variantButton.addEventListener("mouseout", () => UIManager.theUI.updateToolbar());
      paletteContainer.appendChild(variantButton);
    }
    document.body.appendChild(paletteContainer);
    this.paletteContainers.push(paletteContainer);
    this.paletteButtons.push(iconLabel);
    this.installGlobalPopupCloser();
    this.addPopupDismissOnLeave(iconLabel, paletteContainer);
    iconLabel.addEventListener("mouseover", () => {
      for (const p of this.paletteContainers)
        if (p !== paletteContainer)
          p.style.display = "none";
      paletteContainer.style.display = "flex";
      const rect = iconLabel.getBoundingClientRect();
      const leftOffset = rect.left + window.scrollX - 12;
      const topOffset = rect.top + window.scrollY + iconLabel.offsetHeight - 2;
      paletteContainer.style.left = leftOffset + "px";
      paletteContainer.style.top = topOffset + "px";
    });
    iconLabel.addEventListener("mouseout", () => {
      paletteContainer.style.display = "none";
    });
    paletteContainer.addEventListener("mouseover", () => paletteContainer.style.display = "flex");
    paletteContainer.addEventListener("mouseout", () => {
      paletteContainer.style.display = "none";
    });
    return iconLabel;
  }
  styleModeLabel(el) {
    el.style.fontSize = "16px";
    el.style.color = "#333";
    el.style.paddingRight = "10px";
    el.style.whiteSpace = "nowrap";
  }
  highlightButton(key) {
    if (this.activeButton !== null) {
      this.activeButton.style.color = "#333";
      this.activeButton.style.backgroundColor = "";
    }
    const newActiveButton = this.highlightableButtons.get(key) ?? null;
    if (newActiveButton !== null) {
      newActiveButton.style.color = "#007bff";
      newActiveButton.style.backgroundColor = "#e6f7ff";
      this.activeButton = newActiveButton;
    }
  }
  setEuroResistors(euro) {
    this.resistorButton.innerHTML = this.makeSvg(euro ? this.euroResistorIcon : this.resistorIcon, 24);
  }
  wireIcon = "<svg><g transform='scale(0.208) translate(7.5, 32)'><line x1='5' y1='45' x2='95' y2='5' stroke='currentColor' stroke-width='8' /> <circle cx='5' cy='45' r='10' fill='currentColor' /><circle cx='95' cy='5' r='10' fill='currentColor' /> </g></svg>";
  resistorIcon = "<svg> <g transform='scale(.5,.5) translate(-544,-297)'><path stroke='#000000' d=' M 544 320 L 552 320' stroke-width='3'/><path stroke='#000000' d=' M 584 320 L 592 320' stroke-width='3'/><g transform='matrix(1,0,0,1,552,320)'><path fill='none' stroke='currentColor' d=' M 0 0 L 2 6 L 6 -6 L 10 6 L 14 -6 L 18 6 L 22 -6 L 26 6 L 30 -6 L 32 0' stroke-width='2'/> </g> </g> </svg>";
  euroResistorIcon = "<svg><g transform='translate(97.71,-28.71) scale(0.428571)'><path fill='none' stroke='currentColor' d=' M -224 96 L -216 96' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M -184 96 L -176 96' stroke-linecap='round' stroke-width='3' /><g transform='matrix(1,0,0,1,-216,96)'><rect fill='none' stroke='currentColor' x='0' y='-6' width='32' height='12' stroke-linecap='round' stroke-width='3' /></g><path fill='currentColor' stroke='currentColor' d=' M -221 96 A 3 3 0 1 1 -221.00026077471009 95.96044522459944 Z' /><path fill='currentColor' stroke='currentColor' d=' M -173 96 A 3 3 0 1 1 -173.00026077471009 95.96044522459944 Z' /></g></svg>";
  groundIcon = "<svg><defs /><g transform='scale(.6) translate(-826.46,-231.31) scale(1.230769)'><path fill='none' stroke='currentColor' d=' M 688 192 L 688 208' stroke-linecap='round' stroke-width='3' /> <path fill='none' stroke='currentColor' d=' M 698 208 L 678 208' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 694 213 L 682 213' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 690 218 L 686 218' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 691 192 A 3 3 0 1 1 690.9997392252899 191.96044522459943 Z' /> </g></svg>";
  capacitorIcon = "<svg><defs /><g transform='translate(-323.76,-71.18) scale(0.470588)'><path fill='none' stroke='currentColor' d=' M 688 176 L 708 176' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 708 164 L 708 188' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 736 176 L 716 176' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 716 164 L 716 188' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 691 176 A 3 3 0 1 1 690.9997392252899 175.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 739 176 A 3 3 0 1 1 738.9997392252899 175.96044522459943 Z' /></g></svg>";
  // like capacitorIcon, but with one plate curved (the cathode) and a "+" marking
  // the anode plate, matching the polarized-capacitor schematic symbol
  polarCapacitorIcon = "<svg><defs /><g transform='translate(-323.76,-71.18) scale(0.470588)'><path fill='none' stroke='currentColor' d=' M 688 176 L 708 176' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 708 164 L 708 188' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 736 176 L 716 176' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 716 164 Q 709 176 716 188' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 691 176 A 3 3 0 1 1 690.9997392252899 175.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 739 176 A 3 3 0 1 1 738.9997392252899 175.96044522459943 Z' /><g><text fill='currentColor' stroke='none' font-family='sans-serif' font-size='11px' font-weight='bold' x='700' y='157' text-anchor='middle' dominant-baseline='central'>+</text></g></g></svg>";
  diodeIcon = "<svg><defs /><g transform='translate(-323.76,-72.06) scale(0.470588)'><path fill='none' stroke='currentColor' d=' M 688 176 L 704 176' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 720 176 L 736 176' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 704 168 L 704 184 L 720 176 Z' /><path fill='none' stroke='currentColor' d=' M 720 168 L 720 184' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 691 176 A 3 3 0 1 1 690.9997392252899 175.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 739 176 A 3 3 0 1 1 738.9997392252899 175.96044522459943 Z' /></g></svg>";
  switchIcon = "<svg><defs /><g transform='translate(55.79,-100.42) scale(0.421053)'><path fill='none' stroke='currentColor' d=' M -128 272 L -120 272' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M -88 272 L -80 272' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M -120 272 L -88 256' stroke-linecap='round' stroke-width='3' /></g></svg>";
  voltage2Icon = "<svg><defs /><g transform='scale(.8) translate(-122.00,-53.00) scale(0.500000)'><path fill='none' stroke='currentColor' d=' M 272 160 L 272 140' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 132 L 272 112' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 262 140 L 282 140' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 256 132 L 288 132' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 275 160 A 3 3 0 1 1 274.99973922528994 159.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 275 112 A 3 3 0 1 1 274.99973922528994 111.96044522459944 Z' /></g></svg>";
  transistorIcon = "<svg><defs /><g transform='translate(-107.73,-90.40) scale(0.533333)'><path fill='none' stroke='currentColor' d=' M 240 176 L 227 186' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 240 208 L 227 198' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 240 208 L 236 200 L 231 206 Z' /><path fill='none' stroke='currentColor' d=' M 208 192 L 224 192' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 224 176 L 227 176 L 227 208 L 224 208 Z' /><path fill='currentColor' stroke='currentColor' d=' M 211 192 A 3 3 0 1 1 210.99973922528991 191.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 243 176 A 3 3 0 1 1 242.99973922528991 175.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 243 208 A 3 3 0 1 1 242.99973922528991 207.96044522459943 Z' /></g></svg>";
  pnpTransistorIcon = "<svg><defs /><g transform='translate(-116.27,-90.40) scale(0.533333)'><path fill='none' stroke='currentColor' d=' M 256 208 L 243 198' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 256 176 L 243 186' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 245 187 L 253 184 L 248 178 Z' /><path fill='none' stroke='currentColor' d=' M 224 192 L 240 192' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 240 176 L 243 176 L 243 208 L 240 208 Z' /><path fill='currentColor' stroke='currentColor' d=' M 227 192 A 3 3 0 1 1 226.99973922528991 191.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 259 208 A 3 3 0 1 1 258.99973922528994 207.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 259 176 A 3 3 0 1 1 258.99973922528994 175.96044522459943 Z' /></g></svg>";
  fetIcon = "<svg><defs /><g transform='translate(-68.92,-50.27) scale(0.324324)'><path fill='none' stroke='currentColor' d=' M 272 208 L 250 208' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 176 L 250 176' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 208 L 250 203' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 197 L 250 192' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 192 L 250 187' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 181 L 250 176' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 208 L 250 213' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 176 L 250 171' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 208 L 272 192' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 192 L 250 192' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 250 192 L 262 197 L 262 187 Z' /><path fill='none' stroke='currentColor' d=' M 224 192 L 244 192' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 244 184 L 244 200' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 176 L 272 160' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 208 L 272 224' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 227 192 A 3 3 0 1 1 226.99973922528991 191.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 275 160 A 3 3 0 1 1 274.99973922528994 159.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 275 224 A 3 3 0 1 1 274.99973922528994 223.96044522459943 Z' /></g></svg>";
  fetIcon2 = "<svg><defs /><g transform='translate(-68.92,-50.27) scale(0.324324)'><path fill='none' stroke='currentColor' d=' M 272 176 L 272 160' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 208 L 272 224' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 208 L 250 208' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 176 L 250 176' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 208 L 250 203' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 197 L 250 192' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 192 L 250 187' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 181 L 250 176' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 208 L 250 213' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 250 176 L 250 171' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 176 L 272 192' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 272 192 L 250 192' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 272 192 L 260 187 L 260 197 Z' /><path fill='none' stroke='currentColor' d=' M 224 192 L 244 192' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 244 184 L 244 200' stroke-linecap='round' stroke-width='3' /><path fill='currentColor' stroke='currentColor' d=' M 275 160 A 3 3 0 1 1 274.99973922528994 159.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 275 224 A 3 3 0 1 1 274.99973922528994 223.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 227 192 A 3 3 0 1 1 226.99973922528991 191.96044522459943 Z' /></g></svg>";
  inductIcon = "<svg><g transform='translate(-101.59,-58.18) scale(0.405680)'><path fill='none' stroke='currentColor' d=' M 256 176 L 264 176' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 296 176 L 304 176' stroke-linecap='round' stroke-width='3' /><g transform='matrix(1,0,0,1,264,176) scale(1,1)'><path fill='none' stroke='currentColor' d=' M 0 0 L 0 6.53144959545255e-16 A 5.333333333333333 5.333333333333333 0 0 1 10.666666666666666 0 L 10.666666666666666 0' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 10.666666666666666 0 L 10.666666666666668 6.53144959545255e-16 A 5.333333333333333 5.333333333333333 0 0 1 21.333333333333332 0 L 21.333333333333332 0' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 21.333333333333332 0 L 21.333333333333336 6.53144959545255e-16 A 5.333333333333333 5.333333333333333 0 0 1 32 0 L 32 0' stroke-linecap='round' stroke-width='3' /></g><path fill='currentColor' stroke='currentColor' d=' M 259 176 A 3 3 0 1 1 258.99973922528994 175.96044522459943 Z' /><path fill='currentColor' stroke='currentColor' d=' M 307 176 A 3 3 0 1 1 306.99973922528994 175.96044522459943 Z' /></g></svg>";
  railIcon = "<svg><g><text style='user-select: none;' fill='currentColor' stroke='none' font-family='sans-serif' font-size='10px' font-style='normal' font-weight='normal' text-decoration='normal' x='2' y='11' text-anchor='start' dominant-baseline='central'>+5V</text></g></svg>";
  andIcon = "<svg><g transform='translate(-143.64,-130.55) scale(0.363636)'><path fill='none' stroke='currentColor' d=' M 400 400 L 414 400' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 400 384 L 414 384' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 442 392 L 456 392' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 414 378 L 428 378 A 14 14 0 0 1 428 406 L 414 406 Z' stroke-linecap='round' stroke-width='3' /></g></svg>";
  orIcon = "<svg><g transform='translate(-143.64,-153.82) scale(0.363636)'><path fill='none' stroke='currentColor' d=' M 400 464 L 414 464' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 400 448 L 414 448' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 442 456 L 456 456' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 413 442 L 422 442 C 434 445 434 445 442 456 C 434 467 434 467 422 470 L 413 470 C 416 456 416 456 413 442 Z' stroke-linecap='round' stroke-width='3' /></g></svg>";
  xorIcon = "<svg><g transform='translate(-143.64,-180.00) scale(0.363636)'><path fill='none' stroke='currentColor' d=' M 400 536 L 414 536' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 400 520 L 414 520' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 442 528 L 456 528' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 413 514 L 422 514 C 434 517 434 517 442 528 C 434 539 434 539 422 542 L 413 542 C 416 528 416 528 413 514 Z M 408 514 C 411 528 411 528 408 542' stroke-linecap='round' stroke-width='3' /></g></svg>";
  nandIcon = "<svg><g transform='translate(-143.64,-142.18) scale(0.363636)'><path fill='none' stroke='currentColor' d=' M 400 432 L 414 432' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 400 416 L 414 416' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 450 424 L 456 424' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 414 410 L 428 410 A 14 14 0 0 1 428 438 L 414 438 Z' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 448.94 424 A 2.94 2.94 0 1 1 448.93999853000014 423.99706000049' stroke-linecap='round' stroke-width='3' /></g></svg>";
  norIcon = "<svg><g transform='translate(-143.64,-165.45) scale(0.363636)'><path fill='none' stroke='currentColor' d=' M 400 496 L 414 496' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 400 480 L 414 480' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 450 488 L 456 488' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 413 474 L 422 474 C 434 477 434 477 442 488 C 434 499 434 499 422 502 L 413 502 C 416 488 416 488 413 474 Z' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 448.94 488 A 2.94 2.94 0 1 1 448.93999853000014 487.99706000049' stroke-linecap='round' stroke-width='3' /></g></svg>";
  inverterIcon = "<svg><g transform='translate(-288.41,-166.76) scale(0.413793)'><path fill='none' stroke='currentColor' d=' M 704 432 L 712 432' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 746 432 L 752 432' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 712 416 L 712 448 L 739 432 Z' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 744.94 432 A 2.94 2.94 0 1 1 744.9399985300001 431.99706000049' stroke-linecap='round' stroke-width='3' /></g></svg>";
  xnorIcon = "<svg><g fill='none' stroke='currentColor' stroke-linecap='round' stroke-width='3'><path stroke-width='1.0909200000000001' d='M1.814 14.909h5.091M1.814 9.09h5.091M6.542 6.909h3.272c4.364 1.09 4.364 1.09 7.273 5.09-2.909 4-2.909 4-7.273 5.092H6.542C7.632 12 7.632 12 6.542 6.909Zm-1.819 0c1.091 5.09 1.091 5.09 0 10.182M19.996 11.98h2.182M19.61 11.98a1.07 1.07 0 1 1 0-.002'/></g></svg>";
  aswitch1Icon = "<svg><g transform='translate(-242.27,-122.92) scale(0.324324)'><path fill='none' stroke='currentColor' d=' M 752 416 L 768 416' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 800 416 L 816 416' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 768 416 L 800 400' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 784 432 L 784 424' stroke-linecap='round' stroke-width='3' /></g></svg>";
  aswitch2Icon = "<svg><g transform='translate(-237.08,-146.27) scale(0.324324)'><path fill='none' stroke='currentColor' d=' M 736 480 L 752 480' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 784 496 L 800 496' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 784 464 L 800 464' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 752 480 L 784 464' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 768 496 L 768 512' stroke-linecap='round' stroke-width='3' /></g></svg>";
  dpdtIcon = "<svg><g transform='translate(-205.60,-130.93) scale(0.266667)'><path fill='none' stroke='currentColor' d=' M 784 512 L 800 512' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 848 528 L 832 528' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 848 496 L 832 496' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 816 520 L 816 557' stroke-linecap='round' /><path fill='none' stroke='currentColor' d=' M 800 512 L 832 528' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 784 560 L 800 560' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 848 576 L 832 576' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 848 544 L 832 544' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 800 560 L 832 576' stroke-linecap='round' stroke-width='3' /></g></svg>";
  spdtIcon = "<svg><g transform='translate(-242.27,-143.68) scale(0.324324)'><path fill='none' stroke='currentColor' d=' M 752 480 L 768 480' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 800 464 L 816 464' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 800 496 L 816 496' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 768 480 L 800 464' stroke-linecap='round' stroke-width='3' /></g></svg>";
  acSrcIcon = "<svg><g transform='translate(-104.09,-66.93) scale(0.266667)'><path fill='none' stroke='currentColor' d=' M 432 336 L 432 313' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 432 279 L 432 256' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 448.66 296 A 16.66 16.66 0 1 1 448.6599916700007 295.98334000277663' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 422 296 L 423 294 L 424 292 L 425 290 L 426 289 L 427 289 L 428 289 L 429 290 L 430 292 L 431 294 L 432 296 L 433 298 L 434 300 L 435 302 L 436 303 L 437 303 L 438 303 L 439 302 L 440 300 L 441 298 L 442 296' stroke-linecap='round' stroke-width='3' /></g></svg>";
  opAmpTopIcon = "<svg><g transform='translate(-169.33,-86.13) scale(0.266667)'><path fill='none' stroke='currentColor' d=' M 640 384 L 654 384' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 640 352 L 654 352' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 706 368 L 720 368' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 654 400 L 654 336 L 706 368 Z' stroke-linecap='round' stroke-width='3' /><g><text fill='currentColor' stroke='currentColor' font-family='sans-serif' font-size='14px' font-style='normal' font-weight='normal' text-decoration='normal' x='664' y='382' text-anchor='middle' dominant-baseline='central'>-</text></g><g><text fill='currentColor' stroke='currentColor' font-family='sans-serif' font-size='14px' font-style='normal' font-weight='normal' text-decoration='normal' x='664' y='352' text-anchor='middle' dominant-baseline='central'>+</text></g></g></svg>";
  opAmpBotIcon = "<svg><g transform='translate(-169.33,-86.13) scale(0.266667)'><path fill='none' stroke='currentColor' d=' M 640 352 L 654 352' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 640 384 L 654 384' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 706 368 L 720 368' stroke-linecap='round' stroke-width='3' /><path fill='none' stroke='currentColor' d=' M 654 336 L 654 400 L 706 368 Z' stroke-linecap='round' stroke-width='3' /><g><text fill='currentColor' stroke='currentColor' font-family='sans-serif' font-size='14px' font-style='normal' font-weight='normal' text-decoration='normal' x='664' y='350' text-anchor='middle' dominant-baseline='central'>-</text></g><g><text fill='currentColor' stroke='currentColor' font-family='sans-serif' font-size='14px' font-style='normal' font-weight='normal' text-decoration='normal' x='664' y='384' text-anchor='middle' dominant-baseline='central'>+</text></g></g></svg>";
}

class SubcircuitBar {
  element;
  subcircuitLabel;
  backButton;
  contextLabel;
  contextSaveButton;
  contextSaveCopyButton;
  hasSubcircuit = false;
  hasContext = false;
  constructor() {
    this.element = document.createElement("div");
    this.element.className = "subcircuitBar";
    const style = this.element.style;
    style.background = "rgba(248,248,248,0.85)";
    style.position = "absolute";
    style.padding = "4px";
    style.paddingLeft = "8px";
    style.paddingRight = "8px";
    style.borderBottom = "1px solid #ccc";
    style.pointerEvents = "auto";
    style.boxSizing = "border-box";
    style.whiteSpace = "nowrap";
    style.display = "none";
    this.subcircuitLabel = document.createElement("span");
    this.styleLabel(this.subcircuitLabel);
    this.subcircuitLabel.style.display = "none";
    this.element.appendChild(this.subcircuitLabel);
    this.contextLabel = document.createElement("span");
    this.styleLabel(this.contextLabel);
    this.contextLabel.style.display = "none";
    this.element.appendChild(this.contextLabel);
    this.backButton = this.createButton("◀ Back", () => {
      const app = CirSim.theApp;
      if (UIManager.theUI.subcircuitStack.length > 0)
        UIManager.theUI.popSubcircuit();
      else
        app.popContext();
    });
    this.backButton.style.display = "none";
    this.element.appendChild(this.backButton);
    this.contextSaveButton = this.createButton("Save", () => {
      const app = CirSim.theApp;
      const modelName = app.getEditingModelName();
      const dlg = new EditSubcircuitModelDialog();
      if (!dlg.createModel())
        return;
      const existingModel = SubcircuitModel.getModelWithName(modelName);
      dlg.model.setName(modelName);
      if (existingModel !== null)
        EditSubcircuitModelDialog.preservePinLayout(dlg.model, existingModel);
      dlg.popContext = true;
      dlg.createDialog();
      CirSim.dialogShowing = dlg;
      dlg.show();
    });
    this.contextSaveButton.style.display = "none";
    this.element.appendChild(this.contextSaveButton);
    this.contextSaveCopyButton = this.createButton("Save Copy", () => {
      const app = CirSim.theApp;
      const modelName = app.getEditingModelName();
      const dlg = new EditSubcircuitModelDialog();
      if (!dlg.createModel())
        return;
      const existingModel = SubcircuitModel.getModelWithName(modelName);
      if (existingModel !== null)
        EditSubcircuitModelDialog.preservePinLayout(dlg.model, existingModel);
      dlg.popContext = true;
      dlg.createDialog();
      CirSim.dialogShowing = dlg;
      dlg.show();
    });
    this.contextSaveCopyButton.style.display = "none";
    this.element.appendChild(this.contextSaveCopyButton);
  }
  styleLabel(el) {
    el.style.fontSize = "14px";
    el.style.color = "#333";
    el.style.paddingRight = "10px";
  }
  createButton(text, handler) {
    const btn = document.createElement("button");
    btn.textContent = Locale.LS(text);
    btn.addEventListener("click", handler);
    btn.style.marginLeft = "5px";
    btn.style.marginRight = "5px";
    return btn;
  }
  setSubcircuitPath(path) {
    this.hasSubcircuit = path !== null;
    this.subcircuitLabel.style.display = this.hasSubcircuit ? "" : "none";
    if (this.hasSubcircuit)
      this.subcircuitLabel.textContent = path;
    this.updateVisibility();
  }
  setContextInfo(modelName) {
    this.hasContext = modelName !== null;
    this.contextLabel.style.display = this.hasContext ? "" : "none";
    this.contextSaveButton.style.display = this.hasContext ? "" : "none";
    this.contextSaveCopyButton.style.display = this.hasContext ? "" : "none";
    if (this.hasContext)
      this.contextLabel.textContent = Locale.LS("Editing: ") + modelName;
    this.updateVisibility();
  }
  updateVisibility() {
    const show = this.hasSubcircuit || this.hasContext;
    this.element.style.display = show ? "block" : "none";
    this.backButton.style.display = show ? "" : "none";
  }
  updatePosition(left, top, width) {
    this.element.style.left = left + "px";
    this.element.style.top = top + "px";
    this.element.style.width = width + "px";
  }
}

const KEY_BACKSPACE = 8;
const KEY_DELETE = 46;
const KEY_ENTER = 13;
const KEY_ESCAPE = 27;
const KEY_SPACE = 32;
const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_A = 65, KEY_C = 67, KEY_D = 68, KEY_N = 78;
const KEY_O = 79, KEY_P = 80, KEY_S = 83, KEY_V = 86;
const KEY_X = 88, KEY_Y = 89, KEY_Z = 90;
class Scrollbar {
  static HORIZONTAL = 1;
  static HMARGIN = 2;
  static SCROLLHEIGHT = 14;
  static BARMARGIN = 3;
  element;
  g;
  min;
  max;
  val;
  stepSize = 0;
  dragging = false;
  enabled = true;
  command = null;
  attachedElm = null;
  vpw;
  constructor(orientation, value, visible, min, max, cmd, elm) {
    this.vpw = UIManager.VERTICALPANELWIDTH;
    this.min = min;
    this.max = max - 1;
    this.val = value;
    if (cmd) this.command = cmd;
    if (elm) this.attachedElm = elm;
    const can = document.createElement("canvas");
    can.width = this.vpw;
    can.height = Scrollbar.SCROLLHEIGHT;
    can.style.width = this.vpw + "px";
    can.style.height = Scrollbar.SCROLLHEIGHT + "px";
    can.style.display = "block";
    can.style.cursor = "default";
    this.element = can;
    this.g = can.getContext("2d");
    can.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.doMouseDown(e.offsetX, true);
    });
    can.addEventListener("mousemove", (e) => {
      e.preventDefault();
      if (this.dragging && e.buttons === 0) {
        this.dragging = false;
        return;
      }
      this.doMouseMove(e.offsetX);
    });
    can.addEventListener("mouseup", (e) => {
      e.preventDefault();
      if (this.enabled && this.dragging) {
        this.val = this.calcValueFromPos(e.offsetX);
        this.dragging = false;
        this.draw();
        if (this.command) this.command();
      }
    });
    can.addEventListener("mouseout", () => {
      if (this.dragging) return;
      if (this.enabled && this.attachedElm?.isMouseElm())
        CirSim.theApp.mouse.setMouseElm(null);
    });
    can.addEventListener("mouseover", () => {
      if (this.enabled && this.attachedElm)
        CirSim.theApp.mouse.setMouseElm(this.attachedElm);
    });
    can.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (this.enabled) this.setValue(this.val + Math.round(ScrollValuePopup.normalizeWheelDelta(e) / 3));
    }, { passive: false });
    can.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.dragging = false;
      const t = e.touches[0];
      this.doMouseDown(t.clientX - can.getBoundingClientRect().left, false);
    }, { passive: false });
    can.addEventListener("touchmove", (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.doMouseMove(t.clientX - can.getBoundingClientRect().left);
    }, { passive: false });
    can.addEventListener("touchend", (e) => {
      e.preventDefault();
      if (this.enabled && this.dragging) {
        this.dragging = false;
        this.draw();
        if (this.command) this.command();
      }
    });
    can.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      this.dragging = false;
    });
    this.draw();
  }
  doMouseDown(x, mouse) {
    if (!this.enabled) return;
    const vpw = this.vpw;
    const hm = Scrollbar.HMARGIN;
    const sh = Scrollbar.SCROLLHEIGHT;
    const step = this.stepSize > 0 ? Math.max(1, Math.round(this.stepSize)) : 1;
    if (x < hm + sh) {
      this.val = this.snapToStep(Math.max(this.min, this.val - step));
    } else if (x > vpw - hm - sh) {
      this.val = this.snapToStep(Math.min(this.max, this.val + step));
    } else {
      this.val = this.calcValueFromPos(x);
      this.dragging = true;
    }
    this.draw();
    if (this.command) this.command();
  }
  doMouseMove(x) {
    if (!this.enabled || !this.dragging) return;
    this.val = this.calcValueFromPos(x);
    this.draw();
    if (this.command) this.command();
  }
  calcValueFromPos(x) {
    const vpw = this.vpw;
    const hm = Scrollbar.HMARGIN;
    const sh = Scrollbar.SCROLLHEIGHT;
    const bm = Scrollbar.BARMARGIN;
    let v = this.min + (this.max - this.min) * (x - hm - sh - bm) / (vpw - 2 * (hm + sh + bm));
    v = Math.max(this.min, Math.min(this.max, v));
    return this.snapToStep(Math.round(v));
  }
  snapToStep(v) {
    if (this.stepSize > 0) {
      v = Math.round((v - this.min) / this.stepSize) * this.stepSize + this.min;
      v = Math.max(this.min, Math.min(this.max, v));
    }
    return Math.round(v);
  }
  setStepSize(step) {
    this.stepSize = step;
  }
  draw() {
    const g = this.g;
    const vpw = this.vpw;
    const sh = Scrollbar.SCROLLHEIGHT;
    const hm = Scrollbar.HMARGIN;
    const bm = Scrollbar.BARMARGIN;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, vpw, sh);
    g.strokeStyle = this.enabled ? "#000000" : "lightgrey";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(hm + sh - 3, 0);
    g.lineTo(hm, sh / 2);
    g.lineTo(hm + sh - 3, sh);
    g.moveTo(vpw - hm - sh + 3, 0);
    g.lineTo(vpw - hm, sh / 2);
    g.lineTo(vpw - hm - sh + 3, sh);
    g.stroke();
    if (this.enabled) {
      g.strokeStyle = "grey";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(hm + sh + bm, sh / 2);
      g.lineTo(vpw - hm - sh - bm, sh / 2);
      g.stroke();
      const p = hm + sh + bm + (vpw - 2 * (hm + sh + bm)) * (this.val - this.min) / (this.max - this.min);
      g.strokeStyle = this.attachedElm?.needsHighlight() ? CircuitElm.selectColor?.getHexValue() ?? "red" : "red";
      g.beginPath();
      g.moveTo(hm + sh + bm, sh / 2);
      g.lineTo(p, sh / 2);
      g.stroke();
      g.strokeStyle = "#000000";
      g.lineWidth = 1;
      g.fillStyle = "#ffffff";
      g.fillRect(p - 2, 2, 5, sh - 4);
      g.strokeRect(p - 2, 2, 5, sh - 4);
    }
  }
  getValue() {
    return this.val;
  }
  setValue(v) {
    if (v < this.min) v = this.min;
    else if (v > this.max) v = this.max;
    this.val = v;
    this.draw();
    if (this.command) this.command();
  }
  enable() {
    this.enabled = true;
    this.draw();
  }
  disable() {
    this.enabled = false;
    this.dragging = false;
    this.draw();
  }
  addChangeHandler(fn) {
    this.command = fn;
  }
}
class LoadFile {
  element;
  static isSupported() {
    return !!(window.File && window.FileReader);
  }
  constructor(app) {
    this.element = document.createElement("input");
    this.element.type = "file";
    this.element.setAttribute("name", "Import");
    this.element.id = "LoadFileElement";
    this.element.accept = ".txt,.circuitjs";
    this.element.className = "offScreen";
    this.element.addEventListener("change", () => LoadFile.doLoad(app));
  }
  static doLoad(app) {
    const input = document.getElementById("LoadFileElement");
    if (!input || !input.files || input.files.length < 1) return;
    const file = input.files[0];
    if (file.size >= 128e4) {
      alert("File too large!");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (CircuitLoader.isSubcircuitLibrary(text)) {
        app.loader.readSubcircuitLibrary(text);
        app.createNewLoadFile();
        return;
      }
      app.undoManager?.pushUndo();
      app.resetEditingContext();
      app.loader.readCircuit(text);
      app.createNewLoadFile();
      app.setCircuitTitle(file.name);
      ExportAsLocalFileDialog.setLastFileName(file.name);
      app.unsavedChanges = false;
      app.savedFlag = true;
    };
    reader.readAsText(file);
  }
}
class CheckboxMenuItem {
  _label;
  _shortcut;
  _state = false;
  _command = null;
  constructor(label, shortcut = "") {
    this._label = label;
    this._shortcut = shortcut;
  }
  getState() {
    return this._state;
  }
  setState(s) {
    this._state = s;
  }
  getShortcut() {
    return this._shortcut;
  }
  setShortcut(s) {
    this._shortcut = s;
  }
  setScheduledCommand(cmd) {
    this._command = () => cmd.execute();
  }
  setCommand(cmd) {
    this._command = () => cmd.execute();
  }
  execute() {
    if (this._command) this._command();
  }
  getLabel() {
    return this._label;
  }
}
class PerfEntry {
  parent;
  children = /* @__PURE__ */ new Map();
  startTime = 0;
  endTime = 0;
  length = 0;
  constructor(p) {
    this.parent = p;
  }
  addChild(name, entry) {
    if (!this.children.has(name)) {
      this.children.set(name, entry);
      return true;
    }
    return false;
  }
}
class PerfMonitor {
  rootCtxName = "";
  rootCtx = null;
  ctx = null;
  startContext(name) {
    const newEntry = this.startNewEntry(this.ctx);
    if (this.ctx == null) {
      this.ctx = newEntry;
      if (this.rootCtx == null) {
        this.rootCtxName = name;
        this.rootCtx = this.ctx;
      }
    } else {
      if (this.ctx.addChild(name, newEntry))
        this.ctx = newEntry;
    }
  }
  stopContext() {
    if (this.ctx != null) {
      this.ctx.endTime = PerfMonitor.getTime();
      this.ctx.length = this.ctx.endTime - this.ctx.startTime;
      this.ctx = this.ctx.parent;
    }
  }
  startNewEntry(parent) {
    const newEntry = new PerfEntry(parent);
    newEntry.startTime = PerfMonitor.getTime();
    return newEntry;
  }
  static buildString(mon) {
    const sb = [];
    if (mon.rootCtx != null)
      PerfMonitor.buildStringInternal(sb, mon.rootCtxName, mon.rootCtx, 0);
    return { toString: () => sb.join("") };
  }
  static buildStringInternal(sb, name, entry, depth) {
    for (let x = 0; x < depth; x++)
      sb.push("-");
    sb.push(name);
    sb.push(": ");
    sb.push(entry.length.toString());
    sb.push("\n");
    for (const [key, child] of entry.children)
      PerfMonitor.buildStringInternal(sb, key, child, depth + 1);
  }
  static getTime() {
    return window.performance.now();
  }
}
class QueryParameters {
  params;
  constructor() {
    this.params = new URLSearchParams(window.location.search);
  }
  getValue(key) {
    return this.params.get(key);
  }
  getBooleanValue(key, defaultVal) {
    const v = this.params.get(key);
    if (v === null) return defaultVal;
    return v === "true" || v === "1";
  }
}
class UIManager {
  static theUI;
  app;
  menus;
  scopeManager;
  resetButton;
  runStopButton;
  dumpMatrixButton = null;
  powerLabel;
  titleLabel;
  speedBar;
  currentBar;
  powerBar;
  contextPanel = null;
  mouse;
  mouseModeStr = "Select";
  // timing/frame fields
  lastTime = 0;
  lastFrameTime = 0;
  secTime = 0;
  frames = 0;
  steps = 0;
  framerate = 0;
  steprate = 0;
  needsRepaint = false;
  hideInfoBox = false;
  hideMenu = false;
  lastCursorStyle = null;
  toolbar;
  subcircuitBar;
  layoutPanel;
  verticalPanel;
  canvasWrapper;
  buttonPanel;
  mainMenuItems = [];
  mainMenuItemNames = [];
  sidePanelCheckboxLabel;
  loadFileInput = null;
  iFrame = null;
  elmList;
  // stack of enclosing subcircuits when viewing composite internals
  subcircuitStack = [];
  cv;
  cvcontext;
  // canvas width/height in px (before device pixel ratio scaling)
  canvasWidth = 0;
  canvasHeight = 0;
  lastDevicePixelRatio = 0;
  static MENUBARHEIGHT = 30;
  static TOOLBARHEIGHT = 40;
  static VERTICALPANELWIDTH = 166;
  // default
  lastResizeTime = 0;
  // For tracking shift double-tap to open the command palette (see onKeyDown/onKeyUp).
  lastShiftKeyUpMs = 0;
  keyPressedSinceShiftUp = false;
  constructor(app) {
    this.app = app;
    UIManager.theUI = this;
  }
  init() {
    let printable = false;
    let convention = true;
    let euroRes = false;
    let usRes = false;
    let showOhm = false;
    let running = true;
    let hideSidebar = false;
    let noEditing = false;
    let mouseWheelEdit = false;
    this.hideMenu = false;
    const qp = new QueryParameters();
    let positiveColor = null;
    let negativeColor = null;
    let neutralColor = null;
    let selectColor = null;
    let currentColor = null;
    let mouseModeReq = null;
    let euroGates = false;
    this.elmList = this.app.elmList;
    try {
      euroRes = qp.getBooleanValue("euroResistors", false);
      euroGates = qp.getBooleanValue("IECGates", this.getOptionFromStorage("euroGates", Locale.weAreInGermany()));
      usRes = qp.getBooleanValue("usResistors", false);
      showOhm = qp.getBooleanValue("showOhm", this.getOptionFromStorage("showOhm", false));
      running = qp.getBooleanValue("running", true);
      hideSidebar = qp.getBooleanValue("hideSidebar", false);
      this.hideMenu = qp.getBooleanValue("hideMenu", false);
      printable = qp.getBooleanValue("whiteBackground", this.getOptionFromStorage("whiteBackground", false));
      convention = qp.getBooleanValue(
        "conventionalCurrent",
        this.getOptionFromStorage("conventionalCurrent", true)
      );
      noEditing = !qp.getBooleanValue("editable", true);
      mouseWheelEdit = qp.getBooleanValue("mouseWheelEdit", this.getOptionFromStorage("mouseWheelEdit", true));
      positiveColor = qp.getValue("positiveColor");
      negativeColor = qp.getValue("negativeColor");
      neutralColor = qp.getValue("neutralColor");
      selectColor = qp.getValue("selectColor");
      currentColor = qp.getValue("currentColor");
      mouseModeReq = qp.getValue("mouseMode");
      this.hideInfoBox = qp.getBooleanValue("hideInfoBox", false);
    } catch (e) {
      CirSim.console("Exception: " + e);
    }
    let euroSetting = false;
    if (euroRes)
      euroSetting = true;
    else if (usRes)
      euroSetting = false;
    else
      euroSetting = this.getOptionFromStorage("euroResistors", !Locale.weAreInUS(true));
    this.layoutPanel = document.createElement("div");
    this.layoutPanel.className = "layoutPanel";
    this.layoutPanel.style.cssText = "position:absolute;inset:0;overflow:hidden;";
    this.app.ui = this;
    this.app.menus = this.menus = new Menus(this.app);
    this.menus.init();
    CommandPaletteRegistry.buildStatic(this.app);
    CirSim.dumpTypeMap = CirSim.dumpTypeMap || /* @__PURE__ */ new Map();
    CirSim.xmlDumpTypeMap = CirSim.xmlDumpTypeMap || /* @__PURE__ */ new Map();
    CirSim.dumpTypeMap.set(403, "ScopeElm");
    CirSim.xmlDumpTypeMap.set("Scope", "ScopeElm");
    this.menus.recoverItem.setEnabled(this.app.recovery != null);
    const width = window.innerWidth;
    UIManager.VERTICALPANELWIDTH = Math.floor(width / 5);
    if (UIManager.VERTICALPANELWIDTH > 166) UIManager.VERTICALPANELWIDTH = 166;
    if (UIManager.VERTICALPANELWIDTH < 128) UIManager.VERTICALPANELWIDTH = 128;
    this.verticalPanel = document.createElement("div");
    this.verticalPanel.className = "verticalPanel";
    this.verticalPanel.id = "painel";
    this.verticalPanel.style.cssText = `position:absolute;top:${UIManager.MENUBARHEIGHT}px;right:0;bottom:0;width:${UIManager.VERTICALPANELWIDTH}px;overflow-x:hidden;overflow-y:auto;`;
    const sidePanelCheckbox = document.createElement("input");
    sidePanelCheckbox.type = "checkbox";
    sidePanelCheckbox.id = "trigger";
    sidePanelCheckbox.className = "trigger";
    this.sidePanelCheckboxLabel = document.createElement("label");
    this.sidePanelCheckboxLabel.className = "triggerLabel";
    this.sidePanelCheckboxLabel.setAttribute("for", "trigger");
    const topPanelCheckbox = document.createElement("input");
    topPanelCheckbox.type = "checkbox";
    topPanelCheckbox.id = "toptrigger";
    topPanelCheckbox.className = "toptrigger";
    const topPanelCheckboxLabel = document.createElement("label");
    topPanelCheckboxLabel.className = "toptriggerlabel";
    topPanelCheckboxLabel.setAttribute("for", "toptrigger");
    this.buttonPanel = UIManager.VERTICALPANELWIDTH === 166 ? Object.assign(document.createElement("div"), { style: { display: "flex", flexDirection: "row" } }) : Object.assign(document.createElement("div"), { style: { display: "flex", flexDirection: "column" } });
    this.menus.pasteItem.setEnabled(false);
    this.menus.dotsCheckItem.setState(true);
    this.menus.voltsCheckItem.setState(true);
    this.menus.showValuesCheckItem.setState(true);
    this.menus.toolbarCheckItem.setState(
      !this.hideMenu && !noEditing && !hideSidebar && this.app.startCircuit == null && this.app.startCircuitText == null && this.app.startCircuitLink == null
    );
    this.menus.showPropsOnClickCheckItem.setState(this.menus.toolbarCheckItem.getState());
    this.menus.crossHairCheckItem.setState(this.getOptionFromStorage("crossHair", false));
    this.menus.euroResistorCheckItem.setState(euroSetting);
    this.menus.euroResistorCheckItem.setCommand({
      execute: () => {
        this.setOptionInStorage("euroResistors", this.menus.euroResistorCheckItem.getState());
        this.toolbar.setEuroResistors(this.menus.euroResistorCheckItem.getState());
      }
    });
    this.menus.showOhmCheckItem.setState(showOhm);
    this.menus.showOhmCheckItem.setCommand({
      execute: () => {
        this.setOptionInStorage("showOhm", this.menus.showOhmCheckItem.getState());
      }
    });
    this.menus.euroGatesCheckItem.setCommand({
      execute: () => {
        this.setOptionInStorage("euroGates", this.menus.euroGatesCheckItem.getState());
        for (const ce of this.elmList)
          ce.setPoints();
      }
    });
    this.menus.euroGatesCheckItem.setState(euroGates);
    this.menus.printableCheckItem.setCommand({
      execute: () => {
        for (let i = 0; i < this.scopeManager.scopeCount; i++)
          this.scopeManager.scopes[i].setRect(this.scopeManager.scopes[i].rect);
        this.setOptionInStorage("whiteBackground", this.menus.printableCheckItem.getState());
      }
    });
    this.menus.printableCheckItem.setState(printable);
    this.menus.conventionCheckItem.setCommand({
      execute: () => {
        this.setOptionInStorage("conventionalCurrent", this.menus.conventionCheckItem.getState());
        const cc = CircuitElm.currentColor.getHexValue();
        if (cc === "#ffff00" || cc === "#00ffff")
          CircuitElm.currentColor = this.menus.conventionCheckItem.getState() ? Color.yellow : Color.cyan;
      }
    });
    this.menus.conventionCheckItem.setState(convention);
    this.menus.noEditCheckItem.setState(noEditing);
    this.menus.mouseWheelEditCheckItem.setState(mouseWheelEdit);
    this.loadShortcuts();
    this.layoutPanel.appendChild(topPanelCheckbox);
    this.layoutPanel.appendChild(topPanelCheckboxLabel);
    this.toolbar = new Toolbar();
    this.toolbar.setEuroResistors(euroSetting);
    const menuBar = this.menus.menuBar;
    const vpw = hideSidebar ? 0 : UIManager.VERTICALPANELWIDTH;
    const mbh = this.hideMenu ? 0 : UIManager.MENUBARHEIGHT;
    if (hideSidebar) UIManager.VERTICALPANELWIDTH = 0;
    if (!this.hideMenu) {
      menuBar.style.cssText = `position:absolute;left:0;top:0;right:0;height:${UIManager.MENUBARHEIGHT}px;`;
      this.layoutPanel.appendChild(menuBar);
    }
    if (!hideSidebar) {
      this.layoutPanel.appendChild(sidePanelCheckbox);
      this.layoutPanel.appendChild(this.sidePanelCheckboxLabel);
      this.layoutPanel.appendChild(this.verticalPanel);
    }
    this.toolbar.element.style.position = "absolute";
    this.toolbar.element.style.left = "0";
    this.toolbar.element.style.top = mbh + "px";
    this.toolbar.element.style.right = vpw + "px";
    this.toolbar.element.style.height = UIManager.TOOLBARHEIGHT + "px";
    this.toolbar.element.style.overflow = "hidden";
    this.layoutPanel.appendChild(this.toolbar.element);
    this.canvasWrapper = document.createElement("div");
    this.canvasWrapper.className = "canvasWrapper";
    this.canvasWrapper.style.cssText = `position:absolute;top:${mbh + UIManager.TOOLBARHEIGHT}px;right:${vpw}px;bottom:0;left:0;overflow:hidden;`;
    this.layoutPanel.appendChild(this.canvasWrapper);
    document.body.appendChild(this.layoutPanel);
    this.cv = document.createElement("canvas");
    this.cv.style.cssText = "position:absolute;";
    this.canvasWrapper.appendChild(this.cv);
    window.addEventListener("resize", () => {
      this.lastResizeTime = Date.now();
      this.repaint();
    });
    this.cvcontext = this.cv.getContext("2d");
    this.app.scopeManager = this.scopeManager = new ScopeManager(this.app);
    this.subcircuitBar = new SubcircuitBar();
    document.body.appendChild(this.subcircuitBar.element);
    this.setToolbar();
    this.verticalPanel.appendChild(this.buttonPanel);
    this.resetButton = document.createElement("button");
    this.resetButton.textContent = Locale.LS("Reset");
    this.resetButton.className = "topButton";
    this.resetButton.addEventListener("click", () => this.resetAction());
    this.buttonPanel.appendChild(this.resetButton);
    this.runStopButton = document.createElement("button");
    this.runStopButton.innerHTML = "<strong>RUN</strong>&nbsp;/&nbsp;Stop";
    this.runStopButton.className = "topButton";
    this.runStopButton.addEventListener("click", () => this.setSimRunning(!this.simIsRunning()));
    this.buttonPanel.appendChild(this.runStopButton);
    if (LoadFile.isSupported()) {
      this.loadFileInput = new LoadFile(this.app);
      this.verticalPanel.appendChild(this.loadFileInput.element);
    }
    let l;
    l = document.createElement("div");
    l.textContent = Locale.LS("Simulation Speed");
    l.className = "topSpace";
    this.verticalPanel.appendChild(l);
    this.speedBar = new Scrollbar(Scrollbar.HORIZONTAL, 3, 1, 0, 260);
    this.verticalPanel.appendChild(this.speedBar.element);
    l = document.createElement("div");
    l.textContent = Locale.LS("Current Speed");
    l.className = "topSpace";
    this.verticalPanel.appendChild(l);
    this.currentBar = new Scrollbar(Scrollbar.HORIZONTAL, 50, 1, 1, 100);
    this.verticalPanel.appendChild(this.currentBar.element);
    this.powerLabel = document.createElement("div");
    this.powerLabel.textContent = Locale.LS("Power Brightness");
    this.powerLabel.className = "topSpace";
    this.verticalPanel.appendChild(this.powerLabel);
    this.powerBar = new Scrollbar(Scrollbar.HORIZONTAL, 50, 1, 1, 100);
    this.verticalPanel.appendChild(this.powerBar.element);
    this.setPowerBarEnable();
    if (window.TestManager && window.TestManager.enabled) {
      const tm = new window.TestManager(this.app);
      tm.createUI(this.verticalPanel);
    }
    l = document.createElement("div");
    l.textContent = Locale.LS("Current Circuit:");
    l.className = "topSpace";
    this.verticalPanel.appendChild(l);
    this.titleLabel = document.createElement("div");
    this.titleLabel.textContent = "Label";
    this.verticalPanel.appendChild(this.titleLabel);
    this.iFrame = document.createElement("iframe");
    this.iFrame.src = "iframe.html";
    this.iFrame.style.width = UIManager.VERTICALPANELWIDTH + "px";
    this.iFrame.style.height = "100px";
    this.iFrame.scrolling = "no";
    this.verticalPanel.appendChild(this.iFrame);
    this.setGrid();
    this.app.mouse = this.mouse = new MouseManager(this.app, this);
    this.mouse.register(this.cv);
    this.mouse.enableDisableMenuItems();
    this.setiFrameHeight();
    menuBar.addEventListener("click", () => this.mouse.doMainMenuChecks());
    this.registerKeyHandlers();
    window.addEventListener("beforeunload", (event) => {
      if (this.app.isModified() && !CirSim.isElectron())
        event.returnValue = Locale.LS("Are you sure?  There are unsaved changes.");
    });
    this.setColors(positiveColor, negativeColor, neutralColor, selectColor, currentColor);
    if (!running)
      this.setSimRunning(false);
  }
  static devicePixelRatio() {
    return window.devicePixelRatio || 1;
  }
  // ---- Canvas/Layout ----
  checkCanvasSize() {
    let expectedWidth = window.innerWidth;
    let expectedHeight = window.innerHeight;
    expectedHeight -= this.hideMenu ? 0 : UIManager.MENUBARHEIGHT;
    if (!this.app.isMobile(this.sidePanelCheckboxLabel))
      expectedWidth -= UIManager.VERTICALPANELWIDTH;
    if (this.menus.toolbarCheckItem.getState())
      expectedHeight -= UIManager.TOOLBARHEIGHT;
    expectedWidth = Math.max(expectedWidth, 0);
    expectedHeight = Math.max(expectedHeight, 0);
    const dpr = UIManager.devicePixelRatio();
    if (this.canvasWidth !== expectedWidth || this.canvasHeight !== expectedHeight || this.lastDevicePixelRatio !== dpr)
      this.setCanvasSize();
  }
  setCanvasSize() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    height -= this.hideMenu ? 0 : UIManager.MENUBARHEIGHT;
    if (!this.app.isMobile(this.sidePanelCheckboxLabel))
      width -= UIManager.VERTICALPANELWIDTH;
    if (this.menus.toolbarCheckItem.getState())
      height -= UIManager.TOOLBARHEIGHT;
    width = Math.max(width, 0);
    height = Math.max(height, 0);
    if (this.cv) {
      this.cv.style.width = width + "px";
      this.cv.style.height = height + "px";
      this.canvasWidth = width;
      this.canvasHeight = height;
      const scale = UIManager.devicePixelRatio();
      this.lastDevicePixelRatio = scale;
      this.cv.width = Math.round(width * scale);
      this.cv.height = Math.round(height * scale);
    }
    this.setCircuitArea();
    if (this.subcircuitBar) {
      const barTop = (this.hideMenu ? 0 : UIManager.MENUBARHEIGHT) + (this.menus.toolbarCheckItem.getState() ? UIManager.TOOLBARHEIGHT : 0);
      this.subcircuitBar.updatePosition(0, barTop, width);
    }
    if (this.app.transform[0] === 0 || Date.now() - this.lastResizeTime < 1e3)
      this.centerCircuit();
  }
  setCircuitArea() {
    const height = this.canvasHeight;
    const width = this.canvasWidth;
    let h;
    if (this.app.scopeManager == null || this.app.scopeManager.scopeCount === 0)
      h = 0;
    else
      h = Math.round(height * this.app.scopeManager.scopeHeightFraction);
    this.app.circuitArea = new Rectangle(0, 0, width, height - h);
  }
  centerCircuit() {
    if (this.elmList == null)
      return;
    const bounds = this.getCircuitBounds();
    this.setCircuitArea();
    let scale = 1;
    let cheight = this.app.circuitArea.height;
    if (this.app.scopeManager.scopeCount === 0 && this.app.circuitArea.width < 800) {
      const h = Math.round(cheight * this.app.scopeManager.scopeHeightFraction);
      cheight -= h;
    }
    if (bounds != null)
      scale = Math.min(
        this.app.circuitArea.width / (bounds.width + 140),
        cheight / (bounds.height + 100)
      );
    scale = Math.min(scale, 1.5);
    this.app.transform[0] = this.app.transform[3] = scale;
    this.app.transform[1] = this.app.transform[2] = this.app.transform[4] = this.app.transform[5] = 0;
    if (bounds != null) {
      this.app.transform[4] = (this.app.circuitArea.width - bounds.width * scale) / 2 - bounds.x * scale;
      this.app.transform[5] = (cheight - bounds.height * scale) / 2 - bounds.y * scale;
    }
  }
  getCircuitBounds() {
    let minx = 3e4, maxx = -3e4, miny = 3e4, maxy = -3e4;
    for (const ce of this.elmList) {
      if (!ce.isCenteredText()) {
        minx = UIManager.min(ce.x, UIManager.min(ce.x2, minx));
        maxx = UIManager.max(ce.x, UIManager.max(ce.x2, maxx));
      }
      miny = UIManager.min(ce.y, UIManager.min(ce.y2, miny));
      maxy = UIManager.max(ce.y, UIManager.max(ce.y2, maxy));
      const bb = ce.getBoundingBox();
      if (bb != null) {
        if (!ce.isCenteredText()) {
          minx = UIManager.min(bb.x, minx);
          maxx = UIManager.max(bb.x + bb.width, maxx);
        }
        miny = UIManager.min(bb.y, miny);
        maxy = UIManager.max(bb.y + bb.height, maxy);
      }
    }
    if (minx > maxx)
      return null;
    return new Rectangle(minx, miny, maxx - minx, maxy - miny);
  }
  // ---- Repaint ----
  repaint() {
    if (!this.needsRepaint) {
      this.needsRepaint = true;
      setTimeout(() => {
        this.updateCircuit();
        this.needsRepaint = false;
      }, this.app.FASTTIMER);
    }
  }
  // ---- Sim Running ----
  setSimRunning(s) {
    if (s) {
      if (this.app.stopMessage != null)
        return;
      this.app.simRunning = true;
      this.runStopButton.innerHTML = "<strong>RUN</strong>&nbsp;/&nbsp;Stop";
      this.runStopButton.className = "topButton";
      this.app.timer.scheduleRepeating(this.app.FASTTIMER);
    } else {
      this.app.simRunning = false;
      this.runStopButton.innerHTML = "Run&nbsp;/&nbsp;<strong>STOP</strong>";
      this.runStopButton.className = "topButton-red";
      this.app.timer.cancel();
      this.repaint();
    }
  }
  simIsRunning() {
    return this.app.simRunning;
  }
  // find the element in "list" to highlight for target: either target itself, or,
  // if target is nested inside a subcircuit/composite not in list, walk up through
  // its owning composites until we reach one that's in list (e.g. the subcircuit
  // chip). Returns null if we walk off the top without finding target in list (e.g.
  // it belongs to a different, currently unopened part of the circuit hierarchy).
  findHighlightElm(target, list) {
    let ce = target;
    while (ce != null && (list == null || !list.includes(ce)))
      ce = ce.parent;
    return ce;
  }
  // ---- Drawing/Display ----
  updateCircuit() {
    const perfmon = new PerfMonitor();
    perfmon.startContext("updateCircuit()");
    this.checkCanvasSize();
    let didAnalyze = this.app.analyzeFlag;
    if (this.app.analyzeFlag || this.app.dcAnalysisFlag) {
      perfmon.startContext("analyzeCircuit()");
      this.app.sim.analyzeCircuit();
      this.app.analyzeFlag = false;
      perfmon.stopContext();
    }
    if (this.app.sim.needsStamp && this.app.simRunning) {
      perfmon.startContext("stampCircuit()");
      try {
        this.app.sim.preStampAndStampCircuit();
      } catch (e) {
        this.app.sim.stop("Exception in stampCircuit()", null);
        CirSim.console("Exception in stampCircuit: " + e);
      }
      perfmon.stopContext();
    }
    const stopHighlightElm = this.app.stopElm == null ? null : this.findHighlightElm(this.app.stopElm, this.elmList);
    if (stopHighlightElm != null && stopHighlightElm !== this.mouse.getMouseElm())
      stopHighlightElm.setMouseElm(true);
    this.app.scopeManager.setupScopes();
    const g = new Graphics(this.cvcontext);
    if (this.menus.printableCheckItem.getState()) {
      CircuitElm.whiteColor = Color.black;
      CircuitElm.lightGrayColor = Color.black;
      g.setColor(Color.white);
      this.cv.style.backgroundColor = "#fff";
    } else {
      CircuitElm.whiteColor = Color.white;
      CircuitElm.lightGrayColor = Color.lightGray;
      g.setColor(Color.black);
      this.cv.style.backgroundColor = "#000";
    }
    g.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    if (this.app.simRunning) {
      if (this.app.sim.needsStamp)
        CirSim.console("needsStamp while simRunning?");
      perfmon.startContext("runCircuit()");
      try {
        this.app.sim.runCircuit(didAnalyze);
      } catch (e) {
        CirSim.debugger();
        CirSim.console("exception in runCircuit " + e);
        this.app.consoleExceptionOccurred = true;
      }
      perfmon.stopContext();
    }
    const sysTime = Date.now();
    if (this.app.simRunning) {
      if (this.lastTime !== 0) {
        const inc = sysTime - this.lastTime;
        let c = this.currentBar.getValue();
        c = Math.exp(c / 3.5 - 14.2);
        CircuitElm.currentMult = 1.7 * inc * c;
        if (!this.menus.conventionCheckItem.getState())
          CircuitElm.currentMult = -CircuitElm.currentMult;
      }
      this.lastTime = sysTime;
    } else {
      this.lastTime = 0;
    }
    if (sysTime - this.secTime >= 1e3) {
      this.framerate = this.frames;
      this.steprate = this.steps;
      this.frames = 0;
      this.steps = 0;
      this.secTime = sysTime;
    }
    CircuitElm.powerMult = Math.exp(this.powerBar.getValue() / 4.762 - 7);
    perfmon.startContext("graphics");
    g.setFont(CircuitElm.unitsFont);
    this.cvcontext.lineCap = "round";
    if (this.menus.noEditCheckItem.getState())
      g.drawLock(20, 30);
    g.setColor(Color.white);
    const scale = UIManager.devicePixelRatio();
    this.cvcontext.setTransform(
      this.app.transform[0] * scale,
      0,
      0,
      this.app.transform[3] * scale,
      this.app.transform[4] * scale,
      this.app.transform[5] * scale
    );
    perfmon.startContext("elm.draw()");
    try {
      for (const ce of this.elmList) {
        if (this.menus.powerCheckItem.getState())
          g.setColor(Color.gray);
        ce.draw(g);
      }
    } catch (e) {
      CirSim.debugger();
      CirSim.console("exception in elm.draw() " + e);
      this.app.consoleExceptionOccurred = true;
    }
    try {
      if (stopHighlightElm != null) {
        if (this.menus.powerCheckItem.getState())
          g.setColor(Color.gray);
        stopHighlightElm.draw(g);
      }
    } catch (e) {
    }
    perfmon.stopContext();
    if (this.mouse.mouseMode !== MouseManager.MODE_DRAG_ROW && this.mouse.mouseMode !== MouseManager.MODE_DRAG_COLUMN) {
      for (let i = 0; i !== this.app.postDrawList.length; i++)
        CircuitElm.drawPost(g, this.app.postDrawList[i]);
    }
    if (this.mouse.tempMouseMode === MouseManager.MODE_DRAG_ROW || this.mouse.tempMouseMode === MouseManager.MODE_DRAG_COLUMN || this.mouse.tempMouseMode === MouseManager.MODE_DRAG_POST || this.mouse.tempMouseMode === MouseManager.MODE_DRAG_SELECTED) {
      for (const ce of this.elmList) {
        if (ce !== this.mouse.getMouseElm() || this.mouse.tempMouseMode !== MouseManager.MODE_DRAG_POST) {
          g.setColor(Color.gray);
          g.fillOval(ce.x - 3, ce.y - 3, 7, 7);
          g.fillOval(ce.x2 - 3, ce.y2 - 3, 7, 7);
        } else {
          ce.drawHandles(g, CircuitElm.selectColor);
        }
      }
    }
    if (this.mouse.tempMouseMode === MouseManager.MODE_SELECT && this.mouse.getMouseElm() != null) {
      this.mouse.getMouseElm().drawHandles(g, CircuitElm.selectColor);
      if (this.mouse.getMouseElm().isRoutedWireElm() && this.mouse.mouseCursorX >= 0) {
        const rw = this.mouse.getMouseElm();
        const gx = this.mouse.inverseTransformX(this.mouse.mouseCursorX);
        const gy = this.mouse.inverseTransformY(this.mouse.mouseCursorY);
        const sp = rw.getSnapPointOnWire(gx, gy);
        if (sp != null) {
          g.setColor(CircuitElm.selectColor);
          g.fillOval(sp.x - 4, sp.y - 4, 9, 9);
        }
      }
    }
    if (this.mouse.dragElm != null && (this.mouse.dragElm.x !== this.mouse.dragElm.x2 || this.mouse.dragElm.y !== this.mouse.dragElm.y2)) {
      this.mouse.dragElm.draw(g);
      this.mouse.dragElm.drawHandles(g, CircuitElm.selectColor);
    }
    for (let i = 0; i !== this.app.badConnectionList.length; i++) {
      const cn = this.app.badConnectionList[i];
      g.setColor(Color.red);
      g.fillOval(cn.x - 3, cn.y - 3, 7, 7);
    }
    if (this.mouse.selectedArea != null) {
      g.setColor(CircuitElm.selectColor);
      g.drawRect(
        this.mouse.selectedArea.x,
        this.mouse.selectedArea.y,
        this.mouse.selectedArea.width,
        this.mouse.selectedArea.height
      );
    }
    if (this.menus.crossHairCheckItem.getState() && this.mouse.mouseCursorX >= 0 && this.mouse.mouseCursorX <= this.app.circuitArea.width && this.mouse.mouseCursorY <= this.app.circuitArea.height) {
      g.setColor(Color.gray);
      const x = this.app.snapGrid(this.mouse.inverseTransformX(this.mouse.mouseCursorX));
      const y = this.app.snapGrid(this.mouse.inverseTransformY(this.mouse.mouseCursorY));
      g.drawLine(x, this.mouse.inverseTransformY(0), x, this.mouse.inverseTransformY(this.app.circuitArea.height));
      g.drawLine(this.mouse.inverseTransformX(0), y, this.mouse.inverseTransformX(this.app.circuitArea.width), y);
    }
    this.cvcontext.setTransform(scale, 0, 0, scale, 0, 0);
    perfmon.startContext("drawBottomArea()");
    this.drawBottomArea(g);
    perfmon.stopContext();
    g.setColor(Color.white);
    perfmon.stopContext();
    if (stopHighlightElm != null && stopHighlightElm !== this.mouse.getMouseElm())
      stopHighlightElm.setMouseElm(false);
    this.frames++;
    if (this.app.dcAnalysisFlag) {
      this.app.dcAnalysisFlag = false;
      this.app.analyzeFlag = true;
    }
    this.lastFrameTime = this.lastTime;
    if (this.app.savedDumpPending) {
      this.app.savedDumpPending = false;
      this.app.savedDump = this.app.dumpCircuit(false);
    }
    perfmon.stopContext();
    if (this.app.developerMode) {
      let height = 15;
      const increment = 15;
      g.drawString("Framerate: " + CircuitElm.showFormat.format(this.framerate), 10, height);
      g.drawString("Steprate: " + CircuitElm.showFormat.format(this.steprate), 10, height += increment);
      g.drawString("Steprate/iter: " + CircuitElm.showFormat.format(this.steprate / this.app.getIterCount()), 10, height += increment);
      g.drawString("iterc: " + CircuitElm.showFormat.format(this.app.getIterCount()), 10, height += increment);
      g.drawString("Frames: " + this.frames, 10, height += increment);
      if (this.mouse.mouseCursorX >= 0) {
        const cx = this.mouse.inverseTransformX(this.mouse.mouseCursorX);
        const cy = this.mouse.inverseTransformY(this.mouse.mouseCursorY);
        g.drawString("Mouse: (" + cx + ", " + cy + ")", 10, height += increment);
      }
      height += increment * 2;
      const perfmonResult = PerfMonitor.buildString(perfmon).toString();
      const splits = perfmonResult.split("\n");
      for (let x = 0; x < splits.length; x++)
        g.drawString(splits[x], 10, height + increment * x);
    }
    try {
      this.app.jsInterface?.callUpdateHook();
    } catch (e) {
    }
  }
  // called when updateCircuit() itself threw an exception, so drawBottomArea()
  // was never reached to show the warning there.
  drawExceptionIndicator() {
    const scale = UIManager.devicePixelRatio();
    this.cvcontext.setTransform(scale, 0, 0, scale, 0, 0);
    const g = new Graphics(this.cvcontext);
    const x = UIManager.max(this.canvasWidth - CirSim.infoWidth, 0) + 5;
    g.setFont(CircuitElm.unitsFont);
    g.setColor(Color.yellow);
    g.drawString("exception, see console!", x, this.canvasHeight - 10);
  }
  drawBottomArea(g) {
    let leftX = 0;
    let h = 0;
    if (this.app.stopMessage == null && this.app.scopeManager.scopeCount === 0) {
      leftX = UIManager.max(this.canvasWidth - CirSim.infoWidth, 0);
      const h0 = Math.round(this.canvasHeight * this.app.scopeManager.scopeHeightFraction);
      h = this.mouse.getMouseElm() == null ? 70 : h0;
      if (this.hideInfoBox)
        h = 0;
    }
    if (this.app.stopMessage != null && this.app.circuitArea.height > this.canvasHeight - 30)
      h = 30;
    g.setColor(this.menus.printableCheckItem.getState() ? "#eee" : "#111");
    g.fillRect(
      leftX,
      this.app.circuitArea.height - h,
      this.app.circuitArea.width,
      this.canvasHeight - this.app.circuitArea.height + h
    );
    g.setFont(CircuitElm.unitsFont);
    let ct = this.app.scopeManager.scopeCount;
    if (this.app.stopMessage != null)
      ct = 0;
    Scope.clearCursorInfo();
    for (let i = 0; i !== ct; i++)
      this.app.scopeManager.scopes[i].selectScope(this.mouse.mouseCursorX, this.mouse.mouseCursorY);
    if (this.app.scopeElmArr != null)
      for (let i = 0; i !== this.app.scopeElmArr.length; i++)
        this.app.scopeElmArr[i].selectScope(this.mouse.mouseCursorX, this.mouse.mouseCursorY);
    for (let i = 0; i !== ct; i++)
      this.app.scopeManager.scopes[i].draw(g);
    if (this.mouse.mouseWasOverSplitter) {
      g.setColor(CircuitElm.selectColor);
      g.setLineWidth(4);
      g.drawLine(0, this.app.circuitArea.height - 2, this.app.circuitArea.width, this.app.circuitArea.height - 2);
      g.setLineWidth(1);
    }
    g.setColor(CircuitElm.whiteColor);
    if (this.app.stopMessage != null) {
      g.drawString(this.app.stopMessage, 10, this.canvasHeight - 10);
    } else if (!this.hideInfoBox) {
      const info = new Array(10).fill(null);
      if (this.mouse.getMouseElm() != null) {
        if (this.mouse.mousePost === -1) {
          this.mouse.getMouseElm().getInfo(info);
          info[0] = Locale.LS(info[0]);
          if (info[1] != null)
            info[1] = Locale.LS(info[1]);
          if (this.app.developerMode) {
            let ni;
            for (ni = 0; info[ni] != null && ni < info.length - 1; ni++)
              ;
            try {
              let nodeStr = "nodes:";
              for (let nn = 0; nn < this.mouse.getMouseElm().getNodeCount(); nn++)
                nodeStr += " " + this.mouse.getMouseElm().getNode(nn).index;
              info[ni] = nodeStr;
            } catch (e) {
            }
          }
        } else {
          info[0] = "V = " + CircuitElm.getUnitText(this.mouse.getMouseElm().getPostVoltage(this.mouse.mousePost), "V");
        }
      } else {
        info[0] = "t = " + CircuitElm.getTimeText(this.app.sim.t);
        const nominalSteprate = 160 * this.app.getIterCount();
        const timerate = nominalSteprate * this.app.sim.timeStep;
        if (timerate >= 0.1 && this.steprate >= nominalSteprate * 0.9)
          info[0] += " (" + CircuitElm.showFormat.format(timerate) + "x)";
        info[1] = Locale.LS("time step = ") + CircuitElm.getTimeText(this.app.sim.timeStep);
      }
      if (this.app.hintType !== -1) {
        let i2;
        for (i2 = 0; info[i2] != null; i2++)
          ;
        const s = this.app.getHint();
        if (s == null)
          this.app.hintType = -1;
        else
          info[i2] = s;
      }
      let x = leftX + 5;
      if (ct !== 0)
        x = this.app.scopeManager.scopes[ct - 1].rightEdge() + 20;
      let i;
      for (i = 0; info[i] != null; i++)
        ;
      const badnodes = this.app.badConnectionList.length;
      if (badnodes > 0)
        info[i++] = badnodes + (badnodes === 1 ? Locale.LS(" bad connection") : Locale.LS(" bad connections"));
      if (this.app.savedFlag)
        info[i++] = "(saved)";
      const ybase = this.app.circuitArea.height - h;
      for (i = 0; info[i] != null; i++)
        g.drawString(info[i], x, ybase + 15 * (i + 1));
    }
  }
  getBackgroundColor() {
    if (this.menus.printableCheckItem.getState())
      return Color.white;
    return Color.black;
  }
  // ---- UI Controls ----
  setPowerBarEnable() {
    if (this.menus.powerCheckItem.getState()) {
      this.powerLabel.classList.remove("disabled");
      this.powerBar.enable();
    } else {
      this.powerLabel.classList.add("disabled");
      this.powerBar.disable();
    }
  }
  isReadOnly() {
    return this.menus.noEditCheckItem.getState() || this.subcircuitStack.length > 0;
  }
  // show an element (menu bar) as a floating context-menu popup at the given client coordinates
  showContextPanel(content, clientX, clientY) {
    if (this.contextPanel != null) {
      this.contextPanel.remove();
      this.contextPanel = null;
    }
    content.className = "elmContextMenu";
    content.style.position = "fixed";
    content.style.left = clientX + "px";
    content.style.top = clientY + "px";
    document.body.appendChild(content);
    this.contextPanel = content;
    const w = content.offsetWidth;
    const h = content.offsetHeight;
    const clampedX = Math.max(0, Math.min(clientX, window.innerWidth - w));
    const clampedY = Math.max(0, Math.min(clientY, window.innerHeight - h));
    if (clampedX !== clientX || clampedY !== clientY) {
      content.style.left = clampedX + "px";
      content.style.top = clampedY + "px";
    }
    const close = (evt) => {
      if (!content.contains(evt.target)) {
        content.remove();
        this.contextPanel = null;
        document.removeEventListener("mousedown", close, true);
      }
    };
    document.addEventListener("mousedown", close, true);
  }
  enableItems() {
  }
  setToolbar() {
    const showing = this.menus.toolbarCheckItem.getState();
    this.toolbar.element.style.display = showing ? "flex" : "none";
    if (this.canvasWrapper) {
      const mbh = this.hideMenu ? 0 : UIManager.MENUBARHEIGHT;
      const tbh = showing ? UIManager.TOOLBARHEIGHT : 0;
      this.canvasWrapper.style.top = mbh + tbh + "px";
    }
    this.setCanvasSize();
  }
  updateToolbar() {
    if (this.mouse.dragElm != null)
      this.toolbar.setModeLabel(Locale.LS("Drag Mouse"));
    else
      this.toolbar.setModeLabel(Locale.LS("Mode: ") + this.app.classToLabelMap?.get(this.mouseModeStr));
    this.toolbar.highlightButton(this.mouseModeStr);
  }
  pushSubcircuit(cce, allElms) {
    this.subcircuitStack.push(cce);
    this.elmList = allElms;
    this.updateSubcircuitPath();
    this.app.sim.analyzeCircuit();
    this.centerCircuit();
  }
  popSubcircuit() {
    if (this.subcircuitStack.length === 0)
      return;
    this.subcircuitStack.pop();
    if (this.subcircuitStack.length === 0)
      this.elmList = this.app.elmList;
    else {
      const cce = this.subcircuitStack[this.subcircuitStack.length - 1];
      this.elmList = cce.buildDisplayElmList();
    }
    this.updateSubcircuitPath();
    this.app.sim.analyzeCircuit();
    this.centerCircuit();
  }
  updateSubcircuitPath() {
    if (this.subcircuitStack.length === 0) {
      this.subcircuitBar.setSubcircuitPath(null);
    } else {
      let sb = Locale.LS("Viewing: ");
      for (let i = 0; i < this.subcircuitStack.length; i++) {
        if (i > 0) sb += " > ";
        sb += this.subcircuitStack[i].modelName;
      }
      this.subcircuitBar.setSubcircuitPath(sb);
    }
  }
  updateContextButtons() {
    this.subcircuitBar.setContextInfo(this.app.getEditingModelName());
  }
  setMouseMode(mode) {
    this.mouse.mouseMode = mode;
    if (mode === MouseManager.MODE_ADD_ELM)
      this.setCursorStyle("cursorCross");
    else
      this.setCursorStyle("cursorPointer");
  }
  setCursorStyle(s) {
    if (this.lastCursorStyle != null)
      this.cv.classList.remove(this.lastCursorStyle);
    this.cv.classList.add(s);
    this.lastCursorStyle = s;
  }
  setGrid() {
    this.app.gridSize = this.menus.smallGridCheckItem.getState() ? 8 : 16;
    this.app.gridMask = ~(this.app.gridSize - 1);
    this.app.gridRound = this.app.gridSize / 2 - 1;
  }
  // ---- Dialogs ----
  // true when any dialog (including the non-modal property editor) is showing. Used for
  // keyboard handling, where the property editor still counts: Escape/Enter should keep
  // routing to it, and typing in its fields shouldn't leak out as tool shortcuts.
  dialogIsShowing() {
    if (CirSim.editDialog != null && CirSim.editDialog.isShowing())
      return true;
    return this.modalDialogIsShowing();
  }
  // true when a *modal* dialog is showing. The property editor (CirSim.editDialog) is
  // non-modal, so canvas/scope mouse handling should keep working while it's open; use
  // this (instead of dialogIsShowing()) at those call sites.
  modalDialogIsShowing() {
    if (CirSim.customLogicEditDialog != null && CirSim.customLogicEditDialog.isShowing())
      return true;
    if (CirSim.diodeModelEditDialog != null && CirSim.diodeModelEditDialog.isShowing())
      return true;
    if (CirSim.dialogShowing != null && CirSim.dialogShowing.isShowing())
      return true;
    if (this.contextPanel != null && this.contextPanel.isShowing?.())
      return true;
    if (CirSim.scrollValuePopup != null && CirSim.scrollValuePopup.isShowing())
      return true;
    if (CirSim.typeScrollPopup != null && CirSim.typeScrollPopup.isShowing())
      return true;
    if (CirSim.aboutBox != null && CirSim.aboutBox.isShowing())
      return true;
    if (CirSim.commandPalette != null && CirSim.commandPalette.isShowing())
      return true;
    return false;
  }
  // ---- Keyboard ----
  registerKeyHandlers() {
    document.addEventListener("keydown", (e) => this.onKeyDown(e));
    document.addEventListener("keyup", (e) => this.onKeyUp(e));
    document.addEventListener("keypress", (e) => this.onKeyPress(e));
  }
  onKeyDown(e) {
    const code = e.keyCode;
    if (this.mouse.isToolbarDragPending() && code === KEY_ESCAPE)
      this.mouse.cancelToolbarDrag();
    if (code === 16) {
      if (!e.repeat) {
        this.mouse.netHighlightKeyHeld = true;
        this.mouse.updateNetHighlight();
        this.app.repaint();
        this.mouse.toolbarDragOrientationChanged(true);
        const now = Date.now();
        if (this.lastShiftKeyUpMs > 0 && now - this.lastShiftKeyUpMs < 400 && !this.keyPressedSinceShiftUp && !this.dialogIsShowing()) {
          this.app.commands.menuPerformed("key", "commandpalette");
          e.preventDefault();
          this.lastShiftKeyUpMs = 0;
        }
      }
    } else if (!e.repeat) {
      this.keyPressedSinceShiftUp = true;
    }
    if (this.dialogIsShowing()) {
      if (CirSim.scrollValuePopup != null && CirSim.scrollValuePopup.isShowing()) {
        if (code === KEY_ESCAPE || code === KEY_SPACE)
          CirSim.scrollValuePopup.close(false);
        if (code === KEY_ENTER)
          CirSim.scrollValuePopup.close(true);
      }
      if (CirSim.typeScrollPopup != null && CirSim.typeScrollPopup.isShowing()) {
        if (code === KEY_ESCAPE || code === KEY_SPACE)
          CirSim.typeScrollPopup.close(false);
        if (code === KEY_ENTER)
          CirSim.typeScrollPopup.close(true);
      }
      let dlg = CirSim.editDialog;
      if (CirSim.diodeModelEditDialog != null) dlg = CirSim.diodeModelEditDialog;
      if (CirSim.customLogicEditDialog != null) dlg = CirSim.customLogicEditDialog;
      if (CirSim.dialogShowing != null) dlg = CirSim.dialogShowing;
      if (dlg != null && dlg.isShowing()) {
        if (code === KEY_ESCAPE) dlg.closeDialog();
        if (code === KEY_ENTER) dlg.enterPressed();
      }
      if (CirSim.commandPalette != null && CirSim.commandPalette.isShowing()) {
        if (code === KEY_DOWN) {
          CirSim.commandPalette.moveSelection(1);
          e.preventDefault();
          return;
        }
        if (code === KEY_UP) {
          CirSim.commandPalette.moveSelection(-1);
          e.preventDefault();
          return;
        }
        if (code === KEY_ENTER) {
          CirSim.commandPalette.executeSelected();
          e.preventDefault();
          return;
        }
        if (code === KEY_ESCAPE) {
          CirSim.commandPalette.close();
          e.preventDefault();
          return;
        }
      }
      return;
    }
    if (this.isReadOnly()) {
      this.handleReadonlyKeyDown(e, code);
      return;
    }
    if (code === KEY_BACKSPACE || code === KEY_DELETE) {
      if (this.app.scopeManager.scopeSelected !== -1) {
        this.app.scopeManager.scopes[this.app.scopeManager.scopeSelected].setElm(null);
        this.app.scopeManager.scopeSelected = -1;
      } else {
        this.mouse.menuElm = null;
        this.app.undoManager.pushUndo();
        this.app.commands.doDelete(true);
        e.preventDefault();
      }
    }
    if (code === KEY_ESCAPE) {
      this.setMouseMode(MouseManager.MODE_SELECT);
      this.mouseModeStr = "Select";
      this.updateToolbar();
      this.mouse.tempMouseMode = this.mouse.mouseMode;
      e.preventDefault();
    }
    if (code === KEY_LEFT || code === KEY_RIGHT || code === KEY_UP || code === KEY_DOWN) {
      let dx = 0, dy = 0;
      if (code === KEY_LEFT) dx = -this.app.gridSize;
      if (code === KEY_RIGHT) dx = this.app.gridSize;
      if (code === KEY_UP) dy = -this.app.gridSize;
      if (code === KEY_DOWN) dy = this.app.gridSize;
      let hasSel = false;
      for (let i = 0; i !== this.elmList.length; i++)
        if (this.elmList[i].isSelected()) {
          hasSel = true;
          break;
        }
      if (hasSel) {
        this.app.undoManager.pushUndo();
        for (let i = 0; i !== this.elmList.length; i++) {
          const ce = this.elmList[i];
          if (ce.isSelected())
            ce.move(dx, dy);
        }
        this.app.needAnalyze();
        e.preventDefault();
      }
    }
    let customShortcutHandled = false;
    const placeholder = KeyNames.keyCodeToPlaceholder(code, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey);
    if (placeholder >= 0 && !e.repeat) {
      const c = this.app.shortcuts.get(placeholder);
      if (c != null) {
        if (c.startsWith("cmd:")) {
          const parts = c.split(":");
          this.app.commands.menuPerformed(parts[1], parts[2]);
        } else {
          this.setMouseMode(MouseManager.MODE_ADD_ELM);
          this.mouseModeStr = c;
          this.updateToolbar();
          this.mouse.tempMouseMode = this.mouse.mouseMode;
        }
        e.preventDefault();
        customShortcutHandled = true;
      }
    }
    if (!customShortcutHandled && (e.ctrlKey || e.metaKey)) {
      if (code === KEY_C) {
        this.app.commands.menuPerformed("key", "copy");
        e.preventDefault();
      }
      if (code === KEY_X) {
        this.app.commands.menuPerformed("key", "cut");
        e.preventDefault();
      }
      if (code === KEY_V) {
        this.app.commands.menuPerformed("key", "paste");
        e.preventDefault();
      }
      if (code === KEY_Z) {
        this.app.commands.menuPerformed("key", "undo");
        e.preventDefault();
      }
      if (code === KEY_Y) {
        this.app.commands.menuPerformed("key", "redo");
        e.preventDefault();
      }
      if (code === KEY_D) {
        this.app.commands.menuPerformed("key", "duplicate");
        e.preventDefault();
      }
      if (code === KEY_A) {
        this.app.commands.menuPerformed("key", "selectAll");
        e.preventDefault();
      }
      if (code === KEY_P) {
        this.app.commands.menuPerformed("key", "print");
        e.preventDefault();
      }
      if (code === KEY_N && CirSim.isElectron()) {
        this.app.commands.menuPerformed("key", "newwindow");
        e.preventDefault();
      }
      if (code === KEY_S) {
        let cmd = "exportaslocalfile";
        if (CirSim.isElectron())
          cmd = this.menus.saveFileItem.isEnabled() ? "save" : "saveas";
        this.app.commands.menuPerformed("key", cmd);
        e.preventDefault();
      }
      if (code === KEY_O) {
        this.app.commands.menuPerformed("key", "importfromlocalfile");
        e.preventDefault();
      }
    }
  }
  onKeyUp(e) {
    const code = e.keyCode;
    if (code === 16) {
      this.mouse.netHighlightKeyHeld = false;
      this.mouse.updateNetHighlight();
      this.app.repaint();
      this.mouse.toolbarDragOrientationChanged(false);
      this.lastShiftKeyUpMs = Date.now();
      this.keyPressedSinceShiftUp = false;
    }
    if (this.dialogIsShowing())
      return;
    if (this.isReadOnly())
      return;
    const keyStr = String.fromCharCode(code).toLowerCase();
    let released = false;
    for (let i = 0; i !== this.elmList.length; i++) {
      const ce = this.elmList[i];
      if (ce instanceof SwitchElm) {
        const se = ce;
        if (se.momentary && se.keyShortcut != null && se.keyShortcut === keyStr) {
          se.mouseUp();
          released = true;
        }
      }
    }
    if (released) {
      this.mouse.heldSwitchElm = null;
      this.app.needAnalyze();
      this.app.repaint();
    }
  }
  onKeyPress(e) {
    const cc = e.charCode;
    if (this.dialogIsShowing())
      return;
    if (cc === 45) {
      this.app.commands.menuPerformed("key", "zoomout");
      e.preventDefault();
    }
    if (cc === 43 || cc === 61) {
      this.app.commands.menuPerformed("key", "zoomin");
      e.preventDefault();
    }
    if (cc === 48) {
      this.app.commands.menuPerformed("key", "zoom100");
      e.preventDefault();
    }
    if (cc === 47 && this.app.shortcuts.get(47) == null) {
      this.app.commands.menuPerformed("key", "commandpalette");
      e.preventDefault();
    }
    if (this.isReadOnly())
      return;
    if (cc >= 32 && cc < 127) {
      const keyStr = String.fromCharCode(cc).toLowerCase();
      let toggled = false;
      if (!e.repeat) {
        for (let i = 0; i !== this.elmList.length; i++) {
          const ce = this.elmList[i];
          if (ce instanceof SwitchElm) {
            const se = ce;
            if (se.keyShortcut != null && se.keyShortcut === keyStr) {
              se.toggle();
              if (!se.isLogicInputElm())
                this.app.needAnalyze();
              toggled = true;
            }
          }
        }
      }
      if (toggled) {
        e.preventDefault();
        this.app.repaint();
      } else {
        const c = this.app.shortcuts.get(cc);
        if (c != null) {
          e.preventDefault();
          if (c.startsWith("cmd:")) {
            const parts = c.split(":");
            this.app.commands.menuPerformed(parts[1], parts[2]);
            return;
          }
          this.setMouseMode(MouseManager.MODE_ADD_ELM);
          this.mouseModeStr = c;
          this.updateToolbar();
          this.mouse.tempMouseMode = this.mouse.mouseMode;
        } else if (cc === KEY_SPACE) {
          this.setMouseMode(MouseManager.MODE_SELECT);
          this.mouseModeStr = "Select";
          this.updateToolbar();
          this.mouse.tempMouseMode = this.mouse.mouseMode;
          e.preventDefault();
        }
      }
    }
  }
  handleReadonlyKeyDown(e, code) {
  }
  // ---- Widget management ----
  createNewLoadFile() {
    if (this.loadFileInput == null) return;
    const newlf = new LoadFile(this.app);
    this.verticalPanel.replaceChild(newlf.element, this.loadFileInput.element);
    this.loadFileInput = newlf;
  }
  addWidgetToVerticalPanel(w) {
    if (this.verticalPanel == null)
      return;
    if (this.iFrame != null) {
      this.verticalPanel.insertBefore(w, this.iFrame);
      this.setiFrameHeight();
    } else {
      this.verticalPanel.appendChild(w);
    }
  }
  removeWidgetFromVerticalPanel(w) {
    if (this.verticalPanel == null)
      return;
    if (w.parentNode === this.verticalPanel)
      this.verticalPanel.removeChild(w);
    if (this.iFrame != null)
      this.setiFrameHeight();
  }
  // ---- Other ----
  // show a brief message that fades out on its own
  showToast(msg, ms = 3e3) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
      t.classList.add("fading");
      setTimeout(() => t.remove(), 500);
    }, ms);
  }
  setCircuitTitle(s) {
    this.titleLabel.textContent = s == null ? null : s.replace(/_/g, "_​");
    if (s != null && s.length > 0)
      document.title = s + " - " + CirSim.baseTitle;
    else
      document.title = CirSim.baseTitle;
  }
  allowSave(b) {
    if (this.menus.saveFileItem != null)
      this.menus.saveFileItem.setEnabled(b);
  }
  isSelection() {
    for (const ce of this.elmList)
      if (ce.isSelected())
        return true;
    return false;
  }
  resetAction() {
    this.app.consoleExceptionOccurred = false;
    this.app.analyzeFlag = true;
    if (this.app.autoDCOnReset)
      this.app.dcAnalysisFlag = true;
    if (this.app.sim.t === 0)
      this.setSimRunning(true);
    this.app.sim.resetTime();
    this.app.sim.resetNodes();
    for (const ce of this.elmList)
      ce.reset();
    this.app.scopeManager.resetGraphs();
    this.repaint();
  }
  composeSubcircuitMenu() {
    if (this.menus.subcircuitMenuBar == null)
      return;
    for (let mi = 0; mi !== 2; mi++) {
      const menu = this.menus.subcircuitMenuBar[mi];
      menu.clearItems();
      const list = SubcircuitModel.getModelList();
      for (let i = 0; i !== list.length; i++) {
        const name = list[i].name;
        menu.addCheckboxItem(this.getClassCheckItem(Locale.LS("Add ") + name, "SubcircuitElm:" + name));
      }
    }
    MouseManager.lastSubcircuitMenuUpdate = SubcircuitModel.sequenceNumber;
  }
  getClassCheckItem(s, t) {
    if (this.app.classToLabelMap == null)
      this.app.classToLabelMap = /* @__PURE__ */ new Map();
    this.app.classToLabelMap.set(t, s);
    let shortcut = "";
    let elm = null;
    try {
      elm = this.app.constructElement(t, 0, 0);
    } catch (e) {
      this.app.console("exception: " + e);
    }
    this.app.register(t, elm);
    if (elm == null && t.indexOf("Elm") >= 0)
      this.app.console("can't create class: " + t);
    if (elm != null) {
      if (elm.needsShortcut()) {
        shortcut += String.fromCharCode(elm.getShortcut());
        if (this.app.shortcuts.get(elm.getShortcut()) != null && this.app.shortcuts.get(elm.getShortcut()) !== t)
          this.app.console("already have shortcut for " + String.fromCharCode(elm.getShortcut()) + " " + elm);
        this.app.shortcuts.set(elm.getShortcut(), t);
      }
      elm.delete();
    }
    const mi = shortcut === "" ? new CheckboxMenuItem(s) : new CheckboxMenuItem(s, shortcut);
    mi.setScheduledCommand(new MyCommand("main", t));
    this.mainMenuItems.push(mi);
    this.mainMenuItemNames.push(t);
    return mi;
  }
  setiFrameHeight() {
    if (this.iFrame == null)
      return;
    let cumheight = 0;
    const children = Array.from(this.verticalPanel.children);
    for (const child of children) {
      if (child === this.iFrame) break;
      if (this.loadFileInput && child === this.loadFileInput.element) continue;
      cumheight += child.offsetHeight;
      if (child.className.includes("topSpace"))
        cumheight += 12;
    }
    let ih = window.innerHeight - (this.hideMenu ? 0 : UIManager.MENUBARHEIGHT) - cumheight;
    if (ih < 0) ih = 0;
    this.iFrame.style.height = ih + "px";
  }
  setColors(positiveColor, negativeColor, neutralColor, selectColor, currentColor) {
    try {
      if (positiveColor == null)
        positiveColor = localStorage.getItem("positiveColor");
      if (negativeColor == null)
        negativeColor = localStorage.getItem("negativeColor");
      if (neutralColor == null)
        neutralColor = localStorage.getItem("neutralColor");
      if (selectColor == null)
        selectColor = localStorage.getItem("selectColor");
      if (currentColor == null)
        currentColor = localStorage.getItem("currentColor");
    } catch (e) {
    }
    if (positiveColor != null)
      CircuitElm.positiveColor = new Color(decodeURIComponent(positiveColor));
    else if (this.getOptionFromStorage("alternativeColor", false))
      CircuitElm.positiveColor = Color.blue;
    else
      CircuitElm.positiveColor = Color.green;
    if (negativeColor != null)
      CircuitElm.negativeColor = new Color(decodeURIComponent(negativeColor));
    else
      CircuitElm.negativeColor = Color.red;
    if (neutralColor != null)
      CircuitElm.neutralColor = new Color(decodeURIComponent(neutralColor));
    else
      CircuitElm.neutralColor = Color.gray;
    if (selectColor != null)
      CircuitElm.selectColor = new Color(decodeURIComponent(selectColor));
    else
      CircuitElm.selectColor = Color.cyan;
    if (currentColor != null)
      CircuitElm.currentColor = new Color(decodeURIComponent(currentColor));
    else
      CircuitElm.currentColor = this.menus.conventionCheckItem.getState() ? Color.yellow : Color.cyan;
    CircuitElm.setColorScale();
  }
  setWheelSensitivity() {
    this.mouse.wheelSensitivity = 1;
    try {
      const s = localStorage.getItem("wheelSensitivity");
      if (s != null)
        this.mouse.wheelSensitivity = parseFloatStrict(s);
    } catch (e) {
    }
  }
  getOptionFromStorage(key, val) {
    try {
      const s = localStorage.getItem(key);
      if (s == null) return val;
      return s === "true";
    } catch (e) {
      return val;
    }
  }
  setOptionInStorage(key, val) {
    try {
      localStorage.setItem(key, val ? "true" : "false");
    } catch (e) {
    }
  }
  saveShortcuts() {
    try {
      let str = "1";
      for (const [key, sh] of this.app.shortcuts)
        str += ";" + key + "=" + sh;
      localStorage.setItem("shortcuts", str);
    } catch (e) {
    }
  }
  loadShortcuts() {
    try {
      const str = localStorage.getItem("shortcuts");
      if (str == null) return;
      const keys = str.split(";");
      this.app.shortcuts.clear();
      for (let i = 0; i !== this.mainMenuItems.length; i++) {
        const item = this.mainMenuItems[i];
        if (item.getShortcut().length > 1) break;
        item.setShortcut("");
      }
      for (let i = 1; i < keys.length; i++) {
        const arr = keys[i].split("=");
        if (arr.length !== 2) continue;
        const c = parseIntStrict(arr[0]);
        const className = arr[1];
        this.app.shortcuts.set(c, className);
        for (let j = 0; j !== this.mainMenuItems.length; j++) {
          if (this.mainMenuItemNames[j] === className) {
            this.mainMenuItems[j].setShortcut(String.fromCharCode(c));
            break;
          }
        }
      }
    } catch (e) {
    }
  }
  getLabelTextForClass(cls) {
    return this.app.classToLabelMap?.get(cls);
  }
  static min(a, b) {
    return a < b ? a : b;
  }
  static max(a, b) {
    return a > b ? a : b;
  }
}

const UIManager$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    Scrollbar,
    UIManager
}, Symbol.toStringTag, { value: 'Module' }));

export { Scrollbar as S, UIManager as U, SwitchElm as a, UIManager$1 as b };
