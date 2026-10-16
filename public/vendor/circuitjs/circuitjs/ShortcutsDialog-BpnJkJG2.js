import { g as Dialog, L as Locale, a as CirSim } from './CircuitElm-D0NL-LPP.js';
import { K as KeyNames } from './KeyNames-CtQ8ZgWT.js';

class ShortcutsDialog extends Dialog {
  sim;
  ui;
  textBoxes = [];
  shortcuts = [];
  // target each row applies to: a mainMenuItems index, -1 for run/stop, -2 for command palette
  rowMenuItemIndex = [];
  okButton;
  constructor(sim) {
    super();
    this.sim = sim;
    this.ui = sim.ui;
    this.dialogEl.style.minWidth = "400px";
    const title = document.createElement("div");
    title.textContent = Locale.LS("Edit Shortcuts");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "6px";
    this.dialogEl.appendChild(title);
    const sp = document.createElement("div");
    sp.style.height = "400px";
    sp.style.overflowY = "auto";
    this.dialogEl.appendChild(sp);
    const rowNames = [];
    const rowInitialShortcuts = [];
    let i;
    for (i = 0; i !== this.ui.mainMenuItems.length; i++) {
      const item = this.ui.mainMenuItems[i];
      if (item.getShortcut().length > 1)
        break;
      rowNames.push(item.getLabel());
      rowInitialShortcuts.push(item.getShortcut());
      this.rowMenuItemIndex.push(i);
    }
    let runStopShortcut = "";
    let commandPaletteShortcut = "/";
    for (const [key, value] of this.sim.shortcuts) {
      if (value === CirSim.RUNSTOP_SHORTCUT_ACTION)
        runStopShortcut = String.fromCharCode(key);
      else if (value === CirSim.COMMAND_PALETTE_SHORTCUT_ACTION)
        commandPaletteShortcut = String.fromCharCode(key);
    }
    rowNames.push(Locale.LS("Start/Stop Simulation"));
    rowInitialShortcuts.push(runStopShortcut);
    this.rowMenuItemIndex.push(-1);
    rowNames.push(Locale.LS("Command Palette"));
    rowInitialShortcuts.push(commandPaletteShortcut);
    this.rowMenuItemIndex.push(-2);
    const table = document.createElement("table");
    sp.appendChild(table);
    for (i = 0; i !== rowNames.length; i++) {
      const row = i;
      const tr = document.createElement("tr");
      table.appendChild(tr);
      const nameTd = document.createElement("td");
      nameTd.textContent = rowNames[i];
      tr.appendChild(nameTd);
      const text = document.createElement("input");
      text.type = "text";
      text.readOnly = true;
      text.value = KeyNames.displayText(rowInitialShortcuts[i]) ?? "";
      this.shortcuts.push(rowInitialShortcuts[i]);
      text.addEventListener("keydown", (ev) => {
        const keyCode = ev.keyCode;
        const placeholder = KeyNames.keyCodeToPlaceholder(
          keyCode,
          ev.shiftKey,
          ev.ctrlKey,
          ev.altKey,
          ev.metaKey
        );
        if (placeholder >= 0) {
          ev.preventDefault();
          this.setRowShortcut(row, text, String.fromCharCode(placeholder));
        } else if (keyCode === 8 || keyCode === 46) {
          ev.preventDefault();
          this.setRowShortcut(row, text, "");
        }
      });
      text.addEventListener("keypress", (ev) => {
        ev.preventDefault();
        const cc = ev.charCode ?? ev.which;
        if (cc >= 32 && cc < 127)
          this.setRowShortcut(row, text, String.fromCharCode(cc));
      });
      const textTd = document.createElement("td");
      textTd.appendChild(text);
      tr.appendChild(textTd);
      this.textBoxes.push(text);
      const clearButton = document.createElement("button");
      clearButton.textContent = Locale.LS("Clear");
      clearButton.addEventListener("click", () => this.setRowShortcut(row, text, ""));
      const clearTd = document.createElement("td");
      clearTd.appendChild(clearButton);
      tr.appendChild(clearTd);
    }
    const hp = document.createElement("div");
    hp.style.display = "flex";
    hp.style.justifyContent = "space-between";
    hp.style.marginTop = "8px";
    this.dialogEl.appendChild(hp);
    this.okButton = document.createElement("button");
    this.okButton.textContent = Locale.LS("OK");
    this.okButton.addEventListener("click", () => this.enterPressed());
    hp.appendChild(this.okButton);
    const cancelButton = document.createElement("button");
    cancelButton.textContent = Locale.LS("Cancel");
    cancelButton.addEventListener("click", () => this.closeDialog());
    hp.appendChild(cancelButton);
  }
  setRowShortcut(row, text, shortcut) {
    this.shortcuts[row] = shortcut;
    text.value = KeyNames.displayText(shortcut) ?? "";
    this.checkForDuplicates();
  }
  enterPressed() {
    if (this.checkForDuplicates())
      return;
    this.sim.shortcuts.clear();
    for (let i = 0; i !== this.shortcuts.length; i++) {
      const str = this.shortcuts[i];
      const menuItemIndex = this.rowMenuItemIndex[i];
      if (menuItemIndex >= 0) {
        const item = this.ui.mainMenuItems[menuItemIndex];
        item.setShortcut(str);
        if (str.length > 0)
          this.sim.shortcuts.set(str.charCodeAt(0), this.ui.mainMenuItemNames[menuItemIndex]);
      } else if (menuItemIndex === -1) {
        if (str.length > 0)
          this.sim.shortcuts.set(str.charCodeAt(0), CirSim.RUNSTOP_SHORTCUT_ACTION);
      } else if (menuItemIndex === -2) {
        if (str.length > 0)
          this.sim.shortcuts.set(str.charCodeAt(0), CirSim.COMMAND_PALETTE_SHORTCUT_ACTION);
      }
    }
    this.sim.saveShortcuts();
    this.closeDialog();
  }
  checkForDuplicates() {
    const boxForShortcut = /* @__PURE__ */ new Map();
    let result = false;
    for (let i = 0; i !== this.textBoxes.length; i++) {
      const box = this.textBoxes[i];
      const str = this.shortcuts[i];
      if (str.length === 0) {
        box.style.color = "black";
        continue;
      }
      const c = str.charAt(0);
      const other = boxForShortcut.get(c);
      if (other != null) {
        box.style.color = "red";
        other.style.color = "red";
        result = true;
      } else
        box.style.color = "black";
      boxForShortcut.set(c, box);
    }
    this.okButton.disabled = result;
    return result;
  }
}
window.ShortcutsDialog = ShortcutsDialog;

export { ShortcutsDialog };
