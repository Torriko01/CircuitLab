import { g as Dialog, L as Locale, S as SubcircuitModel, o as ExportAsLocalFileDialog } from './CircuitElm-D0NL-LPP.js';

class SubcircuitDialog extends Dialog {
  subcircuitListBox;
  subcircuits = [];
  constructor(sim) {
    super();
    this.dialogEl.style.width = "400px";
    const title = document.createElement("div");
    title.textContent = Locale.LS("Subcircuit Manager");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "6px";
    this.dialogEl.appendChild(title);
    this.subcircuitListBox = document.createElement("select");
    this.subcircuitListBox.multiple = true;
    this.subcircuitListBox.size = 10;
    this.subcircuitListBox.style.width = "100%";
    this.dialogEl.appendChild(this.subcircuitListBox);
    this.populateList(/* @__PURE__ */ new Set());
    const buttons = document.createElement("div");
    buttons.style.display = "grid";
    buttons.style.gridTemplateColumns = "repeat(3, 1fr)";
    buttons.style.gap = "8px";
    buttons.style.padding = "12px 0 6px 0";
    this.dialogEl.appendChild(buttons);
    const addButton = (label, handler) => {
      const b = document.createElement("button");
      b.textContent = Locale.LS(label);
      b.onclick = handler;
      buttons.appendChild(b);
    };
    addButton("Make Local", () => this.handleMakeLocal());
    addButton("Make Global", () => this.handleMakeGlobal());
    addButton("Make Persistent", () => this.handleMakePersistent());
    addButton("Save", () => this.handleSave());
    addButton("Delete", () => this.handleDelete());
    addButton("Done", () => this.closeDialog());
  }
  // fill list box, selecting the models in selected
  populateList(selected) {
    this.subcircuits = SubcircuitModel.getModelList().filter((m) => !m.isBuiltin());
    this.subcircuitListBox.innerHTML = "";
    for (const m of this.subcircuits) {
      const opt = document.createElement("option");
      opt.textContent = m.name + " (" + Locale.LS(m.getScope()) + ")";
      opt.selected = selected.has(m);
      this.subcircuitListBox.appendChild(opt);
    }
  }
  getSelected() {
    const sel = [];
    const opts = this.subcircuitListBox.options;
    for (let i = 0; i < opts.length; i++)
      if (opts[i].selected) sel.push(this.subcircuits[i]);
    if (sel.length === 0)
      window.alert(Locale.LS("Please select one or more subcircuits."));
    return sel;
  }
  handleMakeLocal() {
    const sel = this.getSelected();
    for (const m of sel) m.makeLocal();
    this.populateList(new Set(sel));
  }
  handleMakeGlobal() {
    const sel = this.getSelected();
    for (const m of sel) m.makeGlobal();
    this.populateList(new Set(sel));
  }
  handleMakePersistent() {
    const sel = this.getSelected();
    for (const m of sel) m.makePersistent();
    this.populateList(new Set(sel));
  }
  // save selected subcircuits as a library file which can be loaded like a circuit
  handleSave() {
    const sel = this.getSelected();
    if (sel.length === 0) return;
    const data = SubcircuitModel.dumpLibrary(sel);
    const base = sel.length === 1 ? sel[0].name.replace(/[\\/:*?"<>|]/g, "_") : "subcircuits";
    const fname = base + ".txt";
    new ExportAsLocalFileDialog(data, fname, "Save Subcircuits").show();
  }
  handleDelete() {
    const sel = this.getSelected();
    if (sel.length === 0) return;
    const inUse = SubcircuitModel.getModelNamesInUse();
    const used = sel.filter((m) => inUse.has(m.name));
    if (used.length > 0) {
      window.alert(Locale.LS("Can't delete subcircuits in use in the current circuit: ") + used.map((m) => m.name).join(", "));
      return;
    }
    const names = sel.map((m) => m.name).join(", ");
    if (!window.confirm(Locale.LS("Are you sure you want to delete ") + names + "?"))
      return;
    for (const m of sel) m.remove();
    this.populateList(/* @__PURE__ */ new Set());
  }
}
window.SubcircuitDialog = SubcircuitDialog;

export { SubcircuitDialog };
