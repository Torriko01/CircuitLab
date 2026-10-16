import { g as Dialog, L as Locale } from './CircuitElm-D0NL-LPP.js';
import { ImageExporter } from './ImageExporter-CQsJHMAl.js';

class ExportAsImageDialog extends Dialog {
  textBox;
  dataURL;
  ext;
  // string may have unicode text in it, so we don't just call btoa()
  static b64encode(a) {
    return window.btoa(unescape(encodeURIComponent(a)));
  }
  constructor(type, sim) {
    super();
    this.dialogEl.innerHTML = "";
    const titleEl = document.createElement("h3");
    titleEl.textContent = Locale.LS("Save as Image");
    titleEl.style.margin = "0 0 8px 0";
    this.dialogEl.appendChild(titleEl);
    const label = document.createElement("div");
    label.textContent = Locale.LS("File name:");
    this.dialogEl.appendChild(label);
    const tb = document.createElement("input");
    tb.type = "text";
    tb.style.width = "250px";
    this.textBox = tb;
    this.dialogEl.appendChild(tb);
    const imageExporter = sim.imageExporter;
    this.ext = ".png";
    if (type === ImageExporter.CAC_IMAGE) {
      this.dataURL = imageExporter.getCircuitAsCanvas(type).toDataURL();
    } else {
      const data = imageExporter.getCircuitAsSVG();
      this.dataURL = "data:text/plain;base64," + ExportAsImageDialog.b64encode(data);
      this.ext = ".svg";
    }
    this.textBox.value = ImageExporter.defaultFileName(this.ext);
    const hp = document.createElement("div");
    hp.style.display = "flex";
    hp.style.justifyContent = "space-between";
    hp.style.marginTop = "8px";
    this.dialogEl.appendChild(hp);
    const okButton = document.createElement("button");
    okButton.textContent = Locale.LS("OK");
    okButton.onclick = () => {
      this.apply();
      this.closeDialog();
    };
    hp.appendChild(okButton);
    const cancelButton = document.createElement("button");
    cancelButton.textContent = Locale.LS("Cancel");
    cancelButton.onclick = () => this.closeDialog();
    hp.appendChild(cancelButton);
  }
  apply() {
    let fname = this.textBox.value;
    if (!fname.includes("."))
      fname += this.ext;
    const a = document.createElement("a");
    a.textContent = fname;
    a.href = this.dataURL;
    a.setAttribute("download", fname);
    this.dialogEl.appendChild(a);
    a.click();
    return true;
  }
}
window.ExportAsImageDialog = ExportAsImageDialog;

export { ExportAsImageDialog };
