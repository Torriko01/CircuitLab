import { g as Dialog, L as Locale } from './CircuitElm-D0NL-LPP.js';

class ScopeExportImageDialog extends Dialog {
  // remember last choices for the session
  static lastSVG = false;
  static lastTransparent = false;
  scope;
  svgRadio;
  transparentCheck;
  constructor(scope) {
    super();
    this.scope = scope;
    const titleEl = document.createElement("h3");
    titleEl.textContent = Locale.LS("Export Image");
    titleEl.style.margin = "0 0 8px 0";
    this.dialogEl.appendChild(titleEl);
    const addRadio = (text, checked) => {
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "scopeExportFormat";
      radio.checked = checked;
      const label = document.createElement("label");
      label.style.display = "block";
      label.style.margin = "4px 0";
      label.appendChild(radio);
      label.appendChild(document.createTextNode(" " + Locale.LS(text)));
      this.dialogEl.appendChild(label);
      return radio;
    };
    addRadio("PNG", !ScopeExportImageDialog.lastSVG);
    this.svgRadio = addRadio("SVG", ScopeExportImageDialog.lastSVG);
    this.transparentCheck = document.createElement("input");
    this.transparentCheck.type = "checkbox";
    this.transparentCheck.checked = ScopeExportImageDialog.lastTransparent;
    const tLabel = document.createElement("label");
    tLabel.style.display = "block";
    tLabel.style.margin = "8px 0 4px 0";
    tLabel.appendChild(this.transparentCheck);
    tLabel.appendChild(document.createTextNode(" " + Locale.LS("Transparent Background")));
    this.dialogEl.appendChild(tLabel);
    const hp = document.createElement("div");
    hp.style.display = "flex";
    hp.style.gap = "8px";
    hp.style.marginTop = "8px";
    this.dialogEl.appendChild(hp);
    const okButton = document.createElement("button");
    okButton.textContent = Locale.LS("OK");
    okButton.addEventListener("click", () => {
      if (this.apply())
        this.closeDialog();
    });
    hp.appendChild(okButton);
    const cancelButton = document.createElement("button");
    cancelButton.textContent = Locale.LS("Cancel");
    cancelButton.addEventListener("click", () => this.closeDialog());
    hp.appendChild(cancelButton);
  }
  apply() {
    const svg = this.svgRadio.checked;
    const transparent = this.transparentCheck.checked;
    ScopeExportImageDialog.lastSVG = svg;
    ScopeExportImageDialog.lastTransparent = transparent;
    if (svg)
      this.scope.exportSVG(transparent);
    else
      this.scope.exportPNG(transparent);
    return true;
  }
}
window.ScopeExportImageDialog = ScopeExportImageDialog;

export { ScopeExportImageDialog };
