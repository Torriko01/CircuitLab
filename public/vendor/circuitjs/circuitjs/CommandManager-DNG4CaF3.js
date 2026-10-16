import { P as Point, p as parseIntStrict, E as EditInfo, c as CircuitElm, d as Choice, L as Locale, e as Checkbox, f as Color, g as Dialog, h as CommandPaletteRegistry, a as CirSim, i as CommandPaletteHistory, H as HookRegistry, j as CustomLogicModel, D as DiodeModel, T as TransistorModel, R as RelayModel, S as SubcircuitModel, M as MosfetModel, k as ExtListEntry, b as CircuitXMLSerializer, l as SimulationManager, m as Scope, n as MouseManager, G as Graphics, o as ExportAsLocalFileDialog, q as CircuitLoader } from './CircuitElm-D0NL-LPP.js';
import { R as RoutedWireElm, S as ScopeElm } from './ScopeElm-D-xJz0et.js';
import { E as EditDialog } from './EditDialog-BLOWt7NH.js';
import { C as ChipElm, E as EditSubcircuitModelDialog } from './EditSubcircuitModelDialog-C5vUSIFP.js';
import './UIManager-Bxtki72o.js';
import './KeyNames-CtQ8ZgWT.js';

class WireConverter {
  static convertWires(sim) {
    const elmList = sim.elmList;
    let hasSelection = false;
    for (const ce of elmList) {
      if (ce.isWireElm() && !ce.isRoutedWireElm() && ce.isSelected()) {
        hasSelection = true;
        break;
      }
    }
    const wires = [];
    for (const ce of elmList) {
      if (ce.isRoutedWireElm())
        continue;
      if (ce.isWireElm() && (!hasSelection || ce.isSelected()))
        wires.push(ce);
    }
    if (wires.length === 0)
      return;
    const pointCount = /* @__PURE__ */ new Map();
    for (const w of wires) {
      WireConverter.inc(pointCount, WireConverter.key(w.x, w.y));
      WireConverter.inc(pointCount, WireConverter.key(w.x2, w.y2));
    }
    for (const ce of elmList) {
      if (ce.isWireElm())
        continue;
      for (let i = 0; i < ce.getPostCount(); i++) {
        const p = ce.getPost(i);
        const k = WireConverter.key(p.x, p.y);
        if (pointCount.has(k)) {
          WireConverter.inc(pointCount, k);
          WireConverter.inc(pointCount, k);
        }
      }
    }
    const pointToWires = /* @__PURE__ */ new Map();
    for (const w of wires) {
      WireConverter.addToList(pointToWires, WireConverter.key(w.x, w.y), w);
      WireConverter.addToList(pointToWires, WireConverter.key(w.x2, w.y2), w);
    }
    const visited = /* @__PURE__ */ new Set();
    const chains = [];
    for (const w of wires) {
      if (visited.has(w))
        continue;
      const chain = [];
      WireConverter.buildChain(w, chain, visited, pointCount, pointToWires);
      chains.push(chain);
    }
    for (const chain of chains) {
      if (chain.length === 1) {
        const w = chain[0];
        const pts = [];
        pts.push(new Point(w.x, w.y));
        pts.push(new Point(w.x2, w.y2));
        const rw2 = new RoutedWireElm(pts);
        const idx = elmList.indexOf(w);
        if (idx >= 0)
          elmList.splice(idx, 1);
        elmList.push(rw2);
        continue;
      }
      const orderedPoints = WireConverter.orderChain(chain, pointCount);
      if (orderedPoints === null || orderedPoints.length < 3)
        continue;
      const rw = new RoutedWireElm(orderedPoints);
      for (const w of chain) {
        const idx = elmList.indexOf(w);
        if (idx >= 0)
          elmList.splice(idx, 1);
      }
      elmList.push(rw);
    }
  }
  // walk along connected wires where interior points have degree 2
  static buildChain(start, chain, visited, pointCount, pointToWires) {
    const stack = [];
    stack.push(start);
    while (stack.length > 0) {
      const w = stack.pop();
      if (visited.has(w))
        continue;
      visited.add(w);
      chain.push(w);
      const k1 = WireConverter.key(w.x, w.y);
      const k2 = WireConverter.key(w.x2, w.y2);
      if (pointCount.get(k1) === 2) {
        for (const neighbor of pointToWires.get(k1)) {
          if (!visited.has(neighbor))
            stack.push(neighbor);
        }
      }
      if (pointCount.get(k2) === 2) {
        for (const neighbor of pointToWires.get(k2)) {
          if (!visited.has(neighbor))
            stack.push(neighbor);
        }
      }
    }
  }
  // order chain wires into a sequence of points from one endpoint to the other
  static orderChain(chain, pointCount) {
    const local = /* @__PURE__ */ new Map();
    for (const w of chain) {
      WireConverter.addToList(local, WireConverter.key(w.x, w.y), w);
      WireConverter.addToList(local, WireConverter.key(w.x2, w.y2), w);
    }
    let startWire = null;
    let startKey = "";
    for (const w of chain) {
      const k1 = WireConverter.key(w.x, w.y);
      const k2 = WireConverter.key(w.x2, w.y2);
      if (pointCount.get(k1) !== 2) {
        startWire = w;
        startKey = k1;
        break;
      }
      if (pointCount.get(k2) !== 2) {
        startWire = w;
        startKey = k2;
        break;
      }
    }
    if (startWire === null)
      return null;
    const points = [];
    points.push(new Point(WireConverter.keyX(startKey), WireConverter.keyY(startKey)));
    const used = /* @__PURE__ */ new Set();
    let current = startWire;
    let currentPt = startKey;
    while (current !== null) {
      used.add(current);
      const k1 = WireConverter.key(current.x, current.y);
      const k2 = WireConverter.key(current.x2, current.y2);
      const otherEnd = k1 === currentPt ? k2 : k1;
      points.push(new Point(WireConverter.keyX(otherEnd), WireConverter.keyY(otherEnd)));
      current = null;
      if (pointCount.get(otherEnd) === 2) {
        const neighbors = local.get(otherEnd);
        if (neighbors !== void 0) {
          for (const w of neighbors) {
            if (!used.has(w)) {
              current = w;
              currentPt = otherEnd;
              break;
            }
          }
        }
      }
    }
    return points;
  }
  static key(x, y) {
    return x + "," + y;
  }
  static keyX(k) {
    return parseIntStrict(k.split(",")[0]);
  }
  static keyY(k) {
    return parseIntStrict(k.split(",")[1]);
  }
  static inc(map, k) {
    const v = map.get(k);
    map.set(k, v === void 0 ? 1 : v + 1);
  }
  static addToList(map, k, w) {
    let list = map.get(k);
    if (list === void 0) {
      list = [];
      map.set(k, list);
    }
    list.push(w);
  }
}

class EditOptions {
  app;
  sim;
  constructor(a, s) {
    this.app = a;
    this.sim = s;
  }
  getEditInfo(n) {
    if (n === 0)
      return new EditInfo("Time step size (s)", this.sim.maxTimeStep, 0, 0).setPositive();
    if (n === 1)
      return new EditInfo(
        "Range for voltage color (V)",
        CircuitElm.voltageRange,
        0,
        0
      ).setPositive();
    if (n === 2) {
      const ei = new EditInfo("Change Language", 0, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("(no change)");
      ei.choice.add("Čeština");
      ei.choice.add("Dansk");
      ei.choice.add("Deutsch");
      ei.choice.add("English");
      ei.choice.add("Español");
      ei.choice.add("Suomi");
      ei.choice.add("Français");
      ei.choice.add("Italiano");
      ei.choice.add("Norsk bokmål");
      ei.choice.add("Polski");
      ei.choice.add("Português");
      ei.choice.add("Русский");
      ei.choice.add("中文 (中国大陆)");
      ei.choice.add("中文 (台湾)");
      ei.choice.add("日本語");
      ei.choice.add("한국어");
      return ei;
    }
    if (n === 3)
      return new EditInfo("Positive Color", CircuitElm.positiveColor.getHexValue()).setIsColor().newColumnMethod();
    if (n === 4)
      return new EditInfo("Negative Color", CircuitElm.negativeColor.getHexValue()).setIsColor();
    if (n === 5)
      return new EditInfo("Neutral Color", CircuitElm.neutralColor.getHexValue()).setIsColor();
    if (n === 6)
      return new EditInfo("Selection Color", CircuitElm.selectColor.getHexValue()).setIsColor();
    if (n === 7)
      return new EditInfo("Current Color", CircuitElm.currentColor.getHexValue()).setIsColor();
    if (n === 8) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Reset Colors to Default") };
      return ei;
    }
    if (n === 9)
      return new EditInfo("# of Decimal Digits (short format)", CircuitElm.shortDecimalDigits);
    if (n === 10)
      return new EditInfo("# of Decimal Digits (long format)", CircuitElm.decimalDigits).newColumnMethod();
    if (n === 11) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Developer Mode", this.app.developerMode);
      return ei;
    }
    if (n === 12)
      return new EditInfo("Minimum Target Frame Rate", this.app.minFrameRate).setPositive();
    if (n === 13)
      return new EditInfo("Mouse Wheel Sensitivity", this.app.mouse.wheelSensitivity).setPositive();
    if (n === 14) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Auto-Run DC Operating Point on Reset", this.app.autoDCOnReset);
      return ei;
    }
    if (n === 15) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Auto-Adjust Timestep", this.sim.adjustTimeStep);
      return ei;
    }
    if (n === 16) {
      const ei = new EditInfo("Matrix Solver", 0, -1, -1);
      ei.choice = new Choice();
      ei.choice.add(Locale.LS("Auto"));
      ei.choice.add(Locale.LS("Dense (Crout's LU)"));
      ei.choice.add(Locale.LS("Sparse (CSC LU)"));
      ei.choice.select(this.sim.solverType);
      return ei;
    }
    if (n === 17)
      return new EditInfo("Value Label Font Size", CircuitElm.valueFontSize);
    if (n === 18 && this.sim.adjustTimeStep)
      return new EditInfo("Minimum time step size (s)", this.sim.minTimeStep, 0, 0).setPositive();
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.sim.maxTimeStep = ei.value;
    }
    if (n === 1)
      CircuitElm.voltageRange = ei.value;
    if (n === 2) {
      const lang = ei.choice.getSelectedIndex();
      if (lang === 0)
        return;
      let langString = null;
      switch (lang) {
        // Czech is csx instead of cs because we are not ready to use it automatically yet
        case 1:
          langString = "csx";
          break;
        case 2:
          langString = "da";
          break;
        case 3:
          langString = "de";
          break;
        case 4:
          langString = "en";
          break;
        case 5:
          langString = "es";
          break;
        case 6:
          langString = "fi";
          break;
        case 7:
          langString = "fr";
          break;
        case 8:
          langString = "it";
          break;
        case 9:
          langString = "nb";
          break;
        case 10:
          langString = "pl";
          break;
        case 11:
          langString = "pt";
          break;
        case 12:
          langString = "ru";
          break;
        case 13:
          langString = "zh";
          break;
        case 14:
          langString = "zh-tw";
          break;
        case 15:
          langString = "ja";
          break;
        case 16:
          langString = "kr";
          break;
      }
      if (langString == null)
        return;
      const stor = typeof localStorage !== "undefined" ? localStorage : null;
      if (stor == null) {
        window.alert(Locale.LS("Can't set language"));
        return;
      }
      stor.setItem("language", langString);
      if (window.confirm(Locale.LS("Must restart to set language.  Restart now?")))
        window.location.reload();
    }
    if (n === 3) {
      CircuitElm.positiveColor = this.setColor("positiveColor", ei, Color.green);
      CircuitElm.setColorScale();
    }
    if (n === 4) {
      CircuitElm.negativeColor = this.setColor("negativeColor", ei, Color.red);
      CircuitElm.setColorScale();
    }
    if (n === 5) {
      CircuitElm.neutralColor = this.setColor("neutralColor", ei, Color.gray);
      CircuitElm.setColorScale();
    }
    if (n === 6)
      CircuitElm.selectColor = this.setColor("selectColor", ei, Color.cyan);
    if (n === 7)
      CircuitElm.currentColor = this.setColor("currentColor", ei, Color.yellow);
    if (n === 8) {
      const stor = typeof localStorage !== "undefined" ? localStorage : null;
      if (stor != null) {
        stor.removeItem("positiveColor");
        stor.removeItem("negativeColor");
        stor.removeItem("neutralColor");
        stor.removeItem("selectColor");
        stor.removeItem("currentColor");
      }
      this.app.ui.setColors(null, null, null, null, null);
      ei.newDialog = true;
    }
    if (n === 9)
      CircuitElm.setDecimalDigits(Math.trunc(ei.value), true, true);
    if (n === 10)
      CircuitElm.setDecimalDigits(Math.trunc(ei.value), false, true);
    if (n === 11)
      this.app.developerMode = ei.checkbox.getState();
    if (n === 12)
      this.app.minFrameRate = ei.value;
    if (n === 13) {
      this.app.mouse.wheelSensitivity = ei.value;
      const stor = typeof localStorage !== "undefined" ? localStorage : null;
      if (stor != null)
        stor.setItem("wheelSensitivity", this.app.mouse.wheelSensitivity.toString());
    }
    if (n === 14)
      this.app.autoDCOnReset = ei.checkbox.getState();
    if (n === 15) {
      this.sim.adjustTimeStep = ei.checkbox.getState();
      ei.newDialog = true;
    }
    if (n === 16) {
      const newType = ei.choice.getSelectedIndex();
      if (newType !== this.sim.solverType) {
        this.sim.solverType = newType;
        this.app.needAnalyze();
      }
    }
    if (n === 17)
      CircuitElm.setValueFontSize(ei.value > 0 ? Math.trunc(ei.value) : 12);
    if (n === 18 && ei.value > 0)
      this.sim.minTimeStep = ei.value;
  }
  setColor(name, ei, def) {
    let val = ei.textf.value;
    if (val.length === 0)
      val = def.getHexValue();
    const stor = typeof localStorage !== "undefined" ? localStorage : null;
    if (stor != null)
      stor.setItem(name, val);
    return new Color(val);
  }
}

class ExportAsTextDialog extends Dialog {
  sim;
  textArea;
  constructor(asim, s) {
    super();
    this.closeOnEnter = false;
    this.sim = asim;
    this.dialogEl.innerHTML = "";
    const titleEl = document.createElement("h3");
    titleEl.textContent = Locale.LS("Export as Text");
    titleEl.style.margin = "0 0 8px 0";
    this.dialogEl.appendChild(titleEl);
    const label = document.createElement("div");
    label.textContent = Locale.LS("Text file for this circuit is...");
    this.dialogEl.appendChild(label);
    const ta = document.createElement("textarea");
    ta.style.width = "400px";
    ta.style.height = "300px";
    ta.style.display = "block";
    ta.value = s;
    this.textArea = ta;
    this.dialogEl.appendChild(ta);
    const hp = document.createElement("div");
    hp.style.display = "flex";
    hp.style.justifyContent = "space-between";
    hp.style.marginTop = "8px";
    this.dialogEl.appendChild(hp);
    const leftBtns = document.createElement("div");
    hp.appendChild(leftBtns);
    const okButton = document.createElement("button");
    okButton.textContent = Locale.LS("OK");
    okButton.onclick = () => this.closeDialog();
    leftBtns.appendChild(okButton);
    const copyButton = document.createElement("button");
    copyButton.textContent = Locale.LS("Copy to Clipboard");
    copyButton.style.marginLeft = "8px";
    copyButton.onclick = () => {
      this.textArea.focus();
      this.textArea.select();
      document.execCommand("copy");
      this.textArea.setSelectionRange(0, 0);
    };
    leftBtns.appendChild(copyButton);
    const importButton = document.createElement("button");
    importButton.textContent = Locale.LS("Re-Import");
    importButton.onclick = () => {
      this.sim.undoManager?.pushUndo();
      const text = this.textArea.value;
      this.closeDialog();
      if (text != null) {
        this.sim.readCircuit(text);
        this.sim.allowSave(false);
        this.sim.unsavedChanges = false;
        this.sim.savedFlag = true;
      }
    };
    hp.appendChild(importButton);
  }
}

class CommandPalette {
  static WIDTH = 520;
  static MAX_RESULTS = 50;
  sim;
  overlay;
  panel;
  filterBox;
  listPanel;
  visibleCommands = [];
  selectedIndex = 0;
  // Only rebuild the list when the filter text actually changes; refreshList() resets
  // selectedIndex to 0, so we must not call it on every key-up (e.g. arrow keys).
  lastQuery = "";
  closed = false;
  constructor(sim) {
    this.sim = sim;
    this.overlay = document.createElement("div");
    this.overlay.className = "command-palette-overlay";
    this.overlay.addEventListener("mousedown", (e) => {
      if (e.target === this.overlay)
        this.close();
    });
    this.panel = document.createElement("div");
    this.panel.className = "command-palette";
    this.panel.style.width = CommandPalette.WIDTH + "px";
    this.filterBox = document.createElement("input");
    this.filterBox.type = "text";
    this.filterBox.className = "command-palette-input";
    this.filterBox.placeholder = Locale.LS("Type a command...");
    this.panel.appendChild(this.filterBox);
    this.listPanel = document.createElement("div");
    this.listPanel.className = "command-palette-list";
    this.panel.appendChild(this.listPanel);
    this.filterBox.addEventListener("keyup", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Enter" || e.key === "Escape")
        return;
      this.onFilterTextChanged();
    });
  }
  show() {
    this.lastQuery = "";
    this.filterBox.value = "";
    this.refreshList();
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.panel);
    this.centerPopup();
    this.filterBox.focus();
    this.selectedIndex = 0;
    this.updateSelectionHighlight();
  }
  isShowing() {
    return !this.closed;
  }
  centerPopup() {
    const left = Math.max(0, (window.innerWidth - CommandPalette.WIDTH) / 2);
    const top = Math.max(0, window.innerHeight / 5);
    this.panel.style.left = left + "px";
    this.panel.style.top = top + "px";
  }
  onFilterTextChanged() {
    const query = this.filterBox.value;
    if (query === this.lastQuery)
      return;
    this.lastQuery = query;
    this.refreshList();
  }
  refreshList() {
    const query = this.filterBox.value;
    this.listPanel.innerHTML = "";
    this.visibleCommands = [];
    this.selectedIndex = 0;
    if (query.trim().length === 0) {
      const recent = CommandPaletteRegistry.recentCommands();
      if (recent.length > 0) {
        this.addSectionLabel(Locale.LS("Recent"));
        for (const cmd of recent)
          this.addCommandRow(cmd, query);
      }
    } else {
      const results = CommandPaletteRegistry.search(query, CommandPalette.MAX_RESULTS);
      for (const cmd of results)
        this.addCommandRow(cmd, query);
    }
    this.updateSelectionHighlight();
  }
  addSectionLabel(text) {
    const l = document.createElement("div");
    l.className = "command-palette-section-label";
    l.textContent = text;
    this.listPanel.appendChild(l);
  }
  addCommandRow(cmd, query) {
    const index = this.visibleCommands.length;
    this.visibleCommands.push(cmd);
    const row = document.createElement("div");
    row.className = "command-palette-item";
    row.setAttribute("data-index", String(index));
    const label = document.createElement("div");
    label.className = "command-palette-item-label";
    label.innerHTML = CommandPaletteRegistry.highlightMatch(Locale.LS(cmd.label), query);
    row.appendChild(label);
    if (cmd.hint != null && cmd.hint.length > 0) {
      const hint = document.createElement("div");
      hint.className = "command-palette-item-hint";
      hint.textContent = Locale.LS(cmd.hint);
      row.appendChild(hint);
    }
    row.addEventListener("click", () => {
      this.selectedIndex = index;
      this.executeSelected();
    });
    this.listPanel.appendChild(row);
  }
  moveSelection(delta) {
    if (this.visibleCommands.length === 0)
      return;
    this.selectedIndex += delta;
    if (this.selectedIndex < 0)
      this.selectedIndex = this.visibleCommands.length - 1;
    if (this.selectedIndex >= this.visibleCommands.length)
      this.selectedIndex = 0;
    this.updateSelectionHighlight();
    this.scrollSelectedIntoView();
  }
  updateSelectionHighlight() {
    for (const row of Array.from(this.listPanel.children)) {
      const idxStr = row.getAttribute("data-index");
      if (idxStr == null || idxStr.length === 0)
        continue;
      const idx = parseInt(idxStr, 10);
      row.classList.toggle("command-palette-item-selected", idx === this.selectedIndex);
    }
  }
  scrollSelectedIntoView() {
    for (const row of Array.from(this.listPanel.children)) {
      const idxStr = row.getAttribute("data-index");
      if (idxStr != null && idxStr.length > 0 && parseInt(idxStr, 10) === this.selectedIndex) {
        row.scrollIntoView({ block: "nearest" });
        break;
      }
    }
  }
  executeSelected() {
    if (this.visibleCommands.length === 0 || this.selectedIndex < 0 || this.selectedIndex >= this.visibleCommands.length)
      return;
    const cmd = this.visibleCommands[this.selectedIndex];
    this.close();
    CommandPalette.execute(cmd);
  }
  static execute(cmd) {
    const app = CirSim.theApp;
    if (cmd.custom != null)
      cmd.custom.execute();
    else
      app.commands.menuPerformed(cmd.menu, cmd.item);
    CommandPaletteHistory.record(cmd.id);
  }
  close() {
    if (this.closed)
      return;
    this.closed = true;
    this.overlay.remove();
    this.panel.remove();
    if (CirSim.commandPalette === this)
      CirSim.commandPalette = null;
  }
}

class ImportFromTextDialog extends Dialog {
  constructor(sim) {
    super();
    this.closeOnEnter = false;
    this.dialogEl.innerHTML = "";
    const title = document.createElement("div");
    title.textContent = Locale.LS("Import from Text");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    this.dialogEl.appendChild(title);
    const label = document.createElement("div");
    label.textContent = Locale.LS("Paste the text file for your circuit here...");
    label.style.marginBottom = "4px";
    this.dialogEl.appendChild(label);
    const textArea = document.createElement("textarea");
    textArea.style.width = "300px";
    textArea.style.height = "200px";
    textArea.style.display = "block";
    this.dialogEl.appendChild(textArea);
    const subCheck = document.createElement("input");
    subCheck.type = "checkbox";
    const subLabel = document.createElement("label");
    subLabel.style.display = "block";
    subLabel.style.margin = "4px 0";
    subLabel.appendChild(subCheck);
    subLabel.appendChild(document.createTextNode(" " + Locale.LS("Load Subcircuits Only")));
    this.dialogEl.appendChild(subLabel);
    const hp = document.createElement("div");
    hp.style.display = "flex";
    hp.style.gap = "8px";
    hp.style.marginTop = "8px";
    this.dialogEl.appendChild(hp);
    const okButton = document.createElement("button");
    okButton.textContent = Locale.LS("OK");
    okButton.addEventListener("click", () => {
      sim.undoManager?.pushUndo();
      this.closeDialog();
      sim.importCircuitFromText(textArea.value, subCheck.checked);
    });
    hp.appendChild(okButton);
    const cancelButton = document.createElement("button");
    cancelButton.textContent = Locale.LS("Cancel");
    cancelButton.addEventListener("click", () => this.closeDialog());
    hp.appendChild(cancelButton);
    this.show();
  }
}

function getCircuitAsComposite(sim) {
  const elmDoc = document.implementation.createDocument(null, "elms");
  const elmRoot = elmDoc.documentElement;
  CustomLogicModel.clearDumpedFlags();
  DiodeModel.clearDumpedFlags();
  TransistorModel.clearDumpedFlags();
  RelayModel.clearDumpedFlags();
  SubcircuitModel.clearDumpedFlags();
  MosfetModel.clearDumpedFlags();
  const sideLabels = [[], [], [], []];
  const extList = [];
  const sel = sim.app.isSelection();
  const closedSwitches = [];
  for (let i = 0; i !== sim.app.elmList.length; i++) {
    const ce = sim.app.elmList[i];
    if (ce.isSwitchElm() && ce.position === 0) {
      closedSwitches.push(ce);
      ce.position = 1;
    }
  }
  if (!sim.preStampCircuit(true)) {
    for (const se of closedSwitches) se.position = 0;
    return null;
  }
  for (const se of closedSwitches) se.position = 0;
  const nodeCount = sim.nodeList.length;
  const used = new Array(nodeCount).fill(false);
  const extnodes = new Array(nodeCount).fill(false);
  for (let i = 0; i !== sim.elmList.length; i++) {
    const ce = sim.getElm(i);
    if (sel && !ce.isSelected()) continue;
    if (!ce.isLabeledNodeElm()) continue;
    const lne = ce;
    if (lne.isInternal()) continue;
    if (extnodes[ce.getNode(0).index]) continue;
    let side = ChipElm.SIDE_W;
    if (Math.abs(ce.dx) >= Math.abs(ce.dy) && ce.dx > 0) side = ChipElm.SIDE_E;
    if (Math.abs(ce.dx) <= Math.abs(ce.dy) && ce.dy < 0) side = ChipElm.SIDE_N;
    if (Math.abs(ce.dx) <= Math.abs(ce.dy) && ce.dy > 0) side = ChipElm.SIDE_S;
    sideLabels[side].push(lne);
    for (let j = 0; j < lne.busWidth; j++) {
      extnodes[ce.getNode(j).index] = true;
      if (ce.getNode(j).index === 0) {
        window.alert('Node "' + lne.text + `" can't be connected to ground`);
        return null;
      }
    }
  }
  sideLabels[ChipElm.SIDE_W].sort((a, b) => a.y - b.y);
  sideLabels[ChipElm.SIDE_E].sort((a, b) => a.y - b.y);
  sideLabels[ChipElm.SIDE_N].sort((a, b) => a.x - b.x);
  sideLabels[ChipElm.SIDE_S].sort((a, b) => a.x - b.x);
  for (let side = 0; side < sideLabels.length; side++) {
    for (let pos = 0; pos < sideLabels[side].length; pos++) {
      const lne = sideLabels[side][pos];
      for (let j = 0; j < lne.busWidth; j++) {
        const ent = new ExtListEntry(lne.text, lne.getNode(j).index, pos, side);
        ent.busWidth = lne.busWidth;
        ent.busZ = j;
        extList.push(ent);
      }
    }
  }
  const dumpList = [];
  const extraList = [];
  for (let i = 0; i !== sim.app.elmList.length; i++) {
    const ce = sim.app.elmList[i];
    if (sel && !ce.isSelected()) continue;
    if (ce.isWireElm() || ce.isRoutedWireElm() || ce.isLabeledNodeElm() || ce.isScopeElm() || ce.isGraphicElm() || ce.isGroundElm()) {
      extraList.push(ce);
    } else {
      dumpList.push(ce);
    }
  }
  dumpList.push(...extraList);
  const inModel = new Array(nodeCount).fill(false);
  for (const ce of dumpList)
    for (let j = 0; j !== ce.getPostCount(); j++)
      inModel[ce.getNode(j).index] = true;
  for (let i = 0; i !== dumpList.length; i++) {
    const ce = dumpList[i];
    let nn = "";
    for (let j = 0; j !== ce.getPostCount(); j++) {
      const n = ce.getNode(j).index;
      used[n] = true;
      if (nn.length > 0) nn += " ";
      nn += n;
    }
    let rn = "";
    for (let j = 0; j !== ce.getRefNodeCount(); j++) {
      const n = ce.getNode(ce.getRefNodeBase() + j).index;
      if (n !== 0 && !inModel[n]) {
        window.alert('Element "' + ce.getElmType() + '" refers to a node outside the selection');
        for (const se of closedSwitches) se.position = 0;
        return null;
      }
      used[n] = true;
      if (rn.length > 0) rn += " ";
      rn += n;
    }
    const child = elmDoc.createElement(ce.getXmlDumpType());
    CircuitXMLSerializer.dumpAttr(child, "nn", nn);
    if (rn.length > 0)
      CircuitXMLSerializer.dumpAttr(child, "rn", rn);
    ce.dumpXml(elmDoc, child);
    let cn = child.firstChild;
    while (cn !== null) {
      const next = cn.nextSibling;
      if (cn.nodeType === Node.ELEMENT_NODE)
        child.removeChild(cn);
      cn = next;
    }
    elmRoot.appendChild(child);
  }
  for (let i = 0; i !== extList.length; i++) {
    const ent = extList[i];
    if (!used[ent.node]) {
      window.alert('Node "' + ent.name + '" is not used!');
      return null;
    }
  }
  const ccm = SubcircuitModel.createModel("", elmDoc, extList);
  SimulationManager.console("created model " + CircuitXMLSerializer.prettyPrint(elmDoc));
  return ccm;
}
HookRegistry.getCircuitAsComposite = (sim) => getCircuitAsComposite(sim);

class CommandManager {
  app;
  clipboard = "";
  constructor(app) {
    this.app = app;
  }
  menuPerformed(menu, item) {
    const contextPanel = this.app.ui?.contextPanel;
    if ((menu == "edit" || menu == "main" || menu == "scopes") && this.app.ui?.isReadOnly()) {
      window.alert(Locale.LS("Editing disabled.  Re-enable from the Options menu."));
      return;
    }
    if (item == "about")
      CirSim.aboutBox = new window.AboutBox(CirSim.versionString);
    if (item == "importfromlocalfile") {
      this.app.undoManager?.pushUndo();
      if (CirSim.isElectron())
        CommandManager.electronOpenFile();
      else
        this.app.ui?.loadFileInput?.element.click();
    }
    if (item == "newwindow")
      CommandManager.newElectronWindow();
    if (item == "save")
      CommandManager.electronSave(this.app.dumpCircuit());
    if (item == "saveas")
      CommandManager.electronSaveAs(this.app.dumpCircuit());
    if (item == "importfromtext")
      new ImportFromTextDialog(this.app);
    if (item == "importfromdropbox")
      CirSim.dialogShowing = new window.ImportFromDropboxDialog(this.app);
    if (item == "exportasurl") {
      this.doExportAsUrl();
      this.app.unsavedChanges = false;
    }
    if (item == "exportaslocalfile") {
      this.doExportAsLocalFile();
      this.app.unsavedChanges = false;
    }
    if (item == "exportastext") {
      this.doExportAsText();
      this.app.unsavedChanges = false;
    }
    if (item == "exportasimage")
      this.app.imageExporter?.doExportAsImage();
    if (item == "copypng") {
      this.app.imageExporter?.doImageToClipboard();
      if (this.app.ui?.contextPanel != null)
        this.app.ui.contextPanel.remove();
      this.app.ui.contextPanel = null;
    }
    if (item == "exportassvg")
      this.app.imageExporter?.doExportAsSVG();
    if (item == "createsubcircuit")
      this.doCreateSubcircuit();
    if (item == "dcanalysis")
      this.doDCAnalysis();
    if (item == "print")
      this.app.imageExporter?.doPrint();
    if (item == "recover")
      this.app.undoManager?.doRecover();
    if ((menu == "elm" || menu == "scopepop") && contextPanel != null)
      contextPanel.remove();
    this.app.ui.contextPanel = null;
    if (menu == "options" && item == "shortcuts") {
      CirSim.dialogShowing = new window.ShortcutsDialog(this.app);
      CirSim.dialogShowing.show();
    }
    if (item == "subcircuits") {
      CirSim.dialogShowing = new window.SubcircuitDialog(this.app);
      CirSim.dialogShowing.show();
    }
    if (item == "search" || item == "commandpalette") {
      CirSim.commandPalette = new CommandPalette(this.app);
      CirSim.commandPalette.show();
    }
    if (menu == "options" && item == "other")
      this.doEdit(new EditOptions(this.app, this.app.sim));
    if (item == "devtools")
      CommandManager.toggleDevTools();
    if (item == "undo")
      this.app.undoManager?.doUndo();
    if (item == "redo")
      this.app.undoManager?.doRedo();
    if (item == "runstop")
      this.app.setSimRunning(!this.app.simIsRunning());
    if (menu == "key" && this.app.mouse.getMouseElm() != null) {
      this.app.mouse.menuElm = this.app.mouse.getMouseElm();
      menu = "elm";
    }
    if (menu != "elm")
      this.app.mouse.menuElm = null;
    if (item == "cut")
      this.doCut();
    if (item == "copy")
      this.doCopy();
    if (item == "paste")
      this.doPaste(null);
    if (item == "duplicate")
      this.doDuplicate();
    if (item == "flip")
      this.app.mouse.doFlip();
    if (item == "split")
      this.app.mouse.doSplit(this.app.mouse.menuElm);
    if (item == "selectAll")
      this.app.mouse.doSelectAll();
    if (item == "centercircuit") {
      this.app.undoManager?.pushUndo();
      this.app.centerCircuit();
    }
    if (item == "rotateCCW") {
      this.app.undoManager?.pushUndo();
      this.rotateCCW();
    }
    if (item == "rotateCW") {
      this.app.undoManager?.pushUndo();
      this.rotateCW();
    }
    if (item == "mirrorX") {
      this.app.undoManager?.pushUndo();
      this.mirrorX();
    }
    if (item == "mirrorY") {
      this.app.undoManager?.pushUndo();
      this.mirrorY();
    }
    if (item == "convertWires") {
      this.app.undoManager?.pushUndo();
      WireConverter.convertWires(this.app);
      this.app.needAnalyze();
    }
    if (item == "createTest") {
      this.app.undoManager?.pushUndo();
      window.TestCreator?.createTest(this.app);
    }
    if (item == "stackAll")
      this.app.scopeManager.stackAll?.();
    if (item == "unstackAll")
      this.app.scopeManager.unstackAll?.();
    if (item == "combineAll")
      this.app.scopeManager.combineAll?.();
    if (item == "separateAll")
      this.app.scopeManager.separateAll?.();
    if (item == "zoomin")
      this.app.mouse.zoomCircuit(20, true);
    if (item == "zoomout")
      this.app.mouse.zoomCircuit(-20, true);
    if (item == "zoom100")
      this.app.mouse.setCircuitScale(1, true);
    if (menu == "elm" && item == "edit")
      this.doEdit(this.app.mouse.menuElm);
    if (item == "delete") {
      if (menu != "elm")
        this.app.mouse.menuElm = null;
      this.app.undoManager?.pushUndo();
      this.doDelete(true);
    }
    if (item == "sliders")
      this.doSliders(this.app.mouse.menuElm);
    if (item == "viewInScope" && this.app.mouse.menuElm != null) {
      let i;
      for (i = 0; i != this.app.scopeManager.scopeCount; i++)
        if (this.app.scopeManager.scopes[i].getElm() == null)
          break;
      if (i == this.app.scopeManager.scopeCount) {
        if (this.app.scopeManager.scopeCount == this.app.scopeManager.scopes.length)
          return;
        this.app.scopeManager.scopeCount++;
        this.app.scopeManager.scopes[i] = new Scope(this.app, this.app.sim);
        this.app.scopeManager.scopes[i].position = i;
      }
      this.app.scopeManager.scopes[i].setElm(this.app.mouse.menuElm);
      if (i > 0)
        this.app.scopeManager.scopes[i].speed = this.app.scopeManager.scopes[i - 1].speed;
    }
    if (item == "viewInFloatScope" && this.app.mouse.menuElm != null) {
      const newScope = new ScopeElm(
        this.app.snapGrid(this.app.mouse.menuElm.x + 50),
        this.app.snapGrid(this.app.mouse.menuElm.y + 50)
      );
      this.app.elmList.push(newScope);
      newScope.setScopeElm(this.app.mouse.menuElm);
      this.app.needAnalyze();
    }
    if (item.startsWith("addToScope") && this.app.mouse.menuElm != null) {
      const n = parseIntStrict(item.substring(10));
      const sm = this.app.scopeManager;
      if (n < sm.scopeCount + (sm.countScopeElms?.() ?? 0)) {
        if (n < sm.scopeCount)
          sm.scopes[n].addElm(this.app.mouse.menuElm);
        else
          sm.getNthScopeElm(n - sm.scopeCount).elmScope.addElm(this.app.mouse.menuElm);
      }
      sm.scopeMenuSelected = -1;
    }
    if (menu == "scopepop") {
      this.app.undoManager?.pushUndo();
      const sm = this.app.scopeManager;
      let s;
      if (sm.menuScope != -1)
        s = sm.scopes[sm.menuScope];
      else
        s = this.app.mouse.getMouseElm()?.elmScope;
      if (item == "dock") {
        if (sm.scopeCount == sm.scopes.length)
          return;
        sm.scopes[sm.scopeCount] = this.app.mouse.getMouseElm()?.elmScope;
        this.app.mouse.getMouseElm()?.clearElmScope();
        sm.scopes[sm.scopeCount].position = sm.scopeCount;
        sm.scopeCount++;
        this.doDelete(false);
      }
      if (item == "undock") {
        const elm = s.getElm();
        const newScope = new ScopeElm(
          this.app.snapGrid(elm.x + 50),
          this.app.snapGrid(elm.y + 50)
        );
        this.app.elmList.push(newScope);
        newScope.setElmScope(sm.scopes[sm.menuScope]);
        for (let i = sm.menuScope; i < sm.scopeCount; i++)
          sm.scopes[i] = sm.scopes[i + 1];
        sm.scopeCount--;
        this.app.needAnalyze();
      }
      if (item == "remove")
        s.setElm(null);
      if (item == "removeplot")
        s.removePlot(sm.menuPlot);
      if (item == "speed2")
        s.speedUp();
      if (item == "speed1/2")
        s.slowDown();
      if (item == "maxscale")
        s.maxScaleToggle();
      if (item == "stack")
        sm.stackScope(sm.menuScope);
      if (item == "unstack")
        sm.unstackScope(sm.menuScope);
      if (item == "combine")
        sm.combineScope(sm.menuScope);
      if (item == "selecty")
        s.selectY();
      if (item == "reset")
        s.resetGraph(true);
      if (item == "exportcsv")
        s.exportCSV();
      if (item == "exportimage")
        s.exportImage();
      if (item == "properties")
        s.showProperties();
      sm.deleteUnusedScopeElms?.();
    }
    if (menu == "circuits" && item.indexOf("setup ") == 0) {
      this.app.undoManager?.pushUndo();
      const sp = item.indexOf(" ", 6);
      this.app.menus.readSetupFile(item.substring(6, sp), item.substring(sp + 1));
    }
    if (item == "newblankcircuit") {
      this.app.undoManager?.pushUndo();
      this.app.menus.readSetupFile("blank.txt", "Blank Circuit");
    }
    if (menu == "main") {
      if (contextPanel != null)
        contextPanel.remove();
      this.app.ui.contextPanel = null;
      this.app.setMouseMode(MouseManager.MODE_ADD_ELM);
      const s = item;
      if (s.length > 0)
        this.app.ui.mouseModeStr = s;
      if (s == "DragAll")
        this.app.setMouseMode(MouseManager.MODE_DRAG_ALL);
      else if (s == "DragRow")
        this.app.setMouseMode(MouseManager.MODE_DRAG_ROW);
      else if (s == "DragColumn")
        this.app.setMouseMode(MouseManager.MODE_DRAG_COLUMN);
      else if (s == "DragSelected")
        this.app.setMouseMode(MouseManager.MODE_DRAG_SELECTED);
      else if (s == "DragPost")
        this.app.setMouseMode(MouseManager.MODE_DRAG_POST);
      else if (s == "Select")
        this.app.setMouseMode(MouseManager.MODE_SELECT);
      this.app.updateToolbar();
      this.app.mouse.tempMouseMode = this.app.mouse.mouseMode;
    }
    if (item == "fullscreen") {
      if (!Graphics.isFullScreen)
        Graphics.viewFullScreen();
      else
        Graphics.exitFullScreen();
      this.app.centerCircuit();
    }
    this.app.repaint();
  }
  doEdit(eable, pushUndo = true) {
    this.app.mouse.clearSelection();
    if (pushUndo)
      this.app.undoManager?.pushUndo();
    if (CirSim.editDialog != null) {
      CirSim.editDialog.setVisible(false);
      CirSim.editDialog = null;
    }
    CirSim.editDialog = new EditDialog(eable, this.app);
    CirSim.editDialog.show();
  }
  doSliders(ce) {
    this.app.mouse.clearSelection();
    this.app.undoManager?.pushUndo();
    CirSim.dialogShowing = new window.SliderDialog(ce, this.app);
    CirSim.dialogShowing.show();
  }
  doExportAsUrl() {
    const dump = this.app.dumpCircuit();
    CirSim.dialogShowing = new window.ExportAsUrlDialog(dump);
    CirSim.dialogShowing.show();
  }
  doExportAsText() {
    const dump = this.app.dumpCircuit();
    CirSim.dialogShowing = new ExportAsTextDialog(this.app, dump);
    CirSim.dialogShowing.show();
  }
  doCreateSubcircuit() {
    const dlg = new EditSubcircuitModelDialog();
    if (!dlg.createModel())
      return;
    dlg.createDialog();
    CirSim.dialogShowing = dlg;
    CirSim.dialogShowing.show();
  }
  doExportAsLocalFile() {
    const dump = this.app.dumpCircuit();
    CirSim.dialogShowing = new ExportAsLocalFileDialog(dump);
    CirSim.dialogShowing.show();
  }
  doDCAnalysis() {
    this.app.dcAnalysisFlag = true;
    this.app.resetAction();
  }
  setMenuSelection() {
    if (this.app.mouse.menuElm != null) {
      if (this.app.mouse.menuElm.selected)
        return;
      this.app.mouse.clearSelection();
      this.app.mouse.menuElm.setSelected(true);
    }
  }
  countSelected() {
    let count = 0;
    for (const ce of this.app.elmList)
      if (ce.isSelected())
        count++;
    return count;
  }
  prepareFlip() {
    this.app.undoManager?.pushUndo();
    this.setMenuSelection();
    let minx = 3e4, maxx = -3e4;
    let miny = 3e4, maxy = -3e4;
    const count = this.countSelected();
    for (const ce of this.app.elmList) {
      if (ce.isSelected() || count == 0) {
        minx = Math.min(ce.x, Math.min(ce.x2, minx));
        maxx = Math.max(ce.x, Math.max(ce.x2, maxx));
        miny = Math.min(ce.y, Math.min(ce.y2, miny));
        maxy = Math.max(ce.y, Math.max(ce.y2, maxy));
      }
    }
    return { cx: Math.trunc((minx + maxx) / 2), cy: Math.trunc((miny + maxy) / 2), count };
  }
  // mirror horizontally (flip left-right)
  mirrorX() {
    const fi = this.prepareFlip();
    const center2 = fi.cx * 2;
    for (const ce of this.app.elmList)
      if (ce.isSelected() || fi.count == 0)
        ce.flipX(center2, fi.count);
    this.app.needAnalyze();
  }
  // mirror vertically (flip top-bottom)
  mirrorY() {
    const fi = this.prepareFlip();
    const center2 = fi.cy * 2;
    for (const ce of this.app.elmList)
      if (ce.isSelected() || fi.count == 0)
        ce.flipY(center2, fi.count);
    this.app.needAnalyze();
  }
  // rotate 90 degrees counterclockwise: a diagonal flip followed by a vertical flip cancels out the mirroring and leaves a pure rotation
  rotateCCW() {
    const fi = this.prepareFlip();
    const center2 = fi.cy * 2;
    const xmy = this.app.snapGrid(fi.cx - fi.cy);
    for (const ce of this.app.elmList) {
      if (ce.isSelected() || fi.count == 0) {
        ce.flipXY(xmy, fi.count);
        ce.flipY(center2, fi.count);
      }
    }
    this.app.needAnalyze();
  }
  // rotate 90 degrees clockwise: same two flips as rotateCCW(), in the opposite order, giving the opposite rotation direction
  rotateCW() {
    const fi = this.prepareFlip();
    const center2 = fi.cy * 2;
    const xmy = this.app.snapGrid(fi.cx - fi.cy);
    for (const ce of this.app.elmList) {
      if (ce.isSelected() || fi.count == 0) {
        ce.flipY(center2, fi.count);
        ce.flipXY(xmy, fi.count);
      }
    }
    this.app.needAnalyze();
  }
  doCut() {
    this.app.undoManager?.pushUndo();
    this.setMenuSelection();
    this.clipboard = this.copyOfSelectedElms();
    this.writeClipboardToStorage();
    this.doDelete(true);
    this.enablePaste();
  }
  writeClipboardToStorage() {
    localStorage.setItem("circuitClipboard", this.clipboard);
  }
  readClipboardFromStorage() {
    this.clipboard = localStorage.getItem("circuitClipboard") ?? "";
  }
  doDelete(pushUndoFlag) {
    if (pushUndoFlag)
      this.app.undoManager?.pushUndo();
    let hasDeleted = false;
    for (let i = this.app.elmList.length - 1; i >= 0; i--) {
      const ce = this.app.elmList[i];
      if (this.willDelete(ce)) {
        if (ce.isMouseElm())
          this.app.mouse.setMouseElm(null);
        ce.delete();
        this.app.elmList.splice(i, 1);
        hasDeleted = true;
      }
    }
    if (hasDeleted) {
      this.app.scopeManager.deleteUnusedScopeElms?.();
      this.app.needAnalyze();
      this.app.undoManager?.writeRecoveryToStorage();
    }
  }
  willDelete(ce) {
    return ce.isSelected() || ce.isMouseElm();
  }
  copyOfSelectedElms() {
    const doc = document.implementation.createDocument(null, "cir", null);
    const root = doc.documentElement;
    CustomLogicModel.clearDumpedFlags();
    SubcircuitModel.clearDumpedFlags();
    DiodeModel.clearDumpedFlags();
    TransistorModel.clearDumpedFlags();
    RelayModel.clearDumpedFlags();
    MosfetModel.clearDumpedFlags();
    for (let i = this.app.elmList.length - 1; i >= 0; i--) {
      const ce = this.app.elmList[i];
      ce.dumpXmlModel?.(doc);
      if (ce.isSelected() && !ce.isScopeElm?.()) {
        const elem = doc.createElement(ce.getXmlDumpType());
        ce.dumpXml?.(doc, elem);
        ce.dumpXmlState?.(doc, elem);
        root.appendChild(elem);
      }
    }
    return new window.XMLSerializer().serializeToString(doc);
  }
  doCopy() {
    const clearSel = this.app.mouse.menuElm != null && !this.app.mouse.menuElm.selected;
    this.setMenuSelection();
    this.clipboard = this.copyOfSelectedElms();
    if (clearSel)
      this.app.mouse.clearSelection();
    this.writeClipboardToStorage();
    this.enablePaste();
  }
  enablePaste() {
    if (this.clipboard == null || this.clipboard.length == 0)
      this.readClipboardFromStorage();
    this.app.menus.pasteItem.setEnabled(this.clipboard != null && this.clipboard.length > 0);
  }
  doDuplicate() {
    this.setMenuSelection();
    const s = this.copyOfSelectedElms();
    this.doPaste(s);
  }
  doPaste(dump) {
    this.app.undoManager?.pushUndo();
    this.app.mouse.clearSelection();
    let oldbb = null;
    for (const ce of this.app.elmList) {
      const bb = ce.getBoundingBox();
      if (oldbb != null)
        oldbb = oldbb.union(bb);
      else
        oldbb = bb;
    }
    const oldsz = this.app.elmList.length;
    let flags = CircuitLoader.RC_RETAIN;
    if (oldsz > 0)
      flags |= CircuitLoader.RC_NO_CENTER;
    if (dump != null)
      this.app.loader.readCircuit(dump, flags);
    else {
      this.readClipboardFromStorage();
      this.app.loader.readCircuit(this.clipboard, flags);
    }
    let newbb = null;
    for (let i = oldsz; i != this.app.elmList.length; i++) {
      const ce = this.app.elmList[i];
      ce.setSelected(true);
      const bb = ce.getBoundingBox();
      if (newbb != null)
        newbb = newbb.union(bb);
      else
        newbb = bb;
    }
    if (oldbb != null && newbb != null) {
      let dx = 0, dy = 0;
      const spacew = this.app.circuitArea.width - oldbb.width - newbb.width;
      const spaceh = this.app.circuitArea.height - oldbb.height - newbb.height;
      if (!oldbb.intersects(newbb)) {
        dx = this.app.snapGrid(oldbb.x - newbb.x);
        dy = this.app.snapGrid(oldbb.y - newbb.y);
      }
      if (spacew > spaceh)
        dx = this.app.snapGrid(oldbb.x + oldbb.width - newbb.x + this.app.gridSize);
      else
        dy = this.app.snapGrid(oldbb.y + oldbb.height - newbb.y + this.app.gridSize);
      if (this.app.mouse.mouseCursorX > 0 && this.app.circuitArea.contains(this.app.mouse.mouseCursorX, this.app.mouse.mouseCursorY)) {
        const gx = this.app.mouse.inverseTransformX(this.app.mouse.mouseCursorX);
        const gy = this.app.mouse.inverseTransformY(this.app.mouse.mouseCursorY);
        const mdx = this.app.snapGrid(gx - (newbb.x + newbb.width / 2));
        const mdy = this.app.snapGrid(gy - (newbb.y + newbb.height / 2));
        let i;
        for (i = oldsz; i != this.app.elmList.length; i++) {
          if (!this.app.elmList[i].allowMove(mdx, mdy))
            break;
        }
        if (i == this.app.elmList.length) {
          dx = mdx;
          dy = mdy;
        }
      }
      for (let i = oldsz; i != this.app.elmList.length; i++)
        this.app.elmList[i].move(dx, dy);
    }
    this.app.needAnalyze();
    this.app.undoManager?.writeRecoveryToStorage();
  }
  static electronSaveAsCallback(s) {
    s = s.substring(s.lastIndexOf("/") + 1);
    s = s.substring(s.lastIndexOf("\\") + 1);
    const app = CirSim.theApp;
    app.setCircuitTitle(s);
    app.allowSave(true);
    app.savedFlag = true;
    app.repaint();
  }
  static electronSaveCallback() {
    const app = CirSim.theApp;
    app.savedFlag = true;
    app.repaint();
  }
  static newElectronWindow() {
    window.newWindow?.();
  }
  static electronSaveAs(dump) {
    window.showSaveDialog?.().then((file) => {
      if (file.canceled) return;
      window.saveFile(file, dump);
      CommandManager.electronSaveAsCallback(file.filePath.toString());
    });
  }
  static electronSave(dump) {
    window.saveFile?.(null, dump);
    CommandManager.electronSaveCallback();
  }
  static electronOpenFileCallback(text, name) {
    const app = CirSim.theApp;
    window.LoadFile?.doLoadCallback(text, name);
    app.allowSave(true);
  }
  static electronOpenFile() {
    window.openFile?.((text, name) => {
      CommandManager.electronOpenFileCallback(text, name);
    });
  }
  static toggleDevTools() {
    window.toggleDevTools?.();
  }
}

export { CommandManager };
