import { g as Dialog } from './CircuitElm-D0NL-LPP.js';

class AboutBox extends Dialog {
  constructor(version) {
    super();
    sessionStorage.setItem("versionString", version);
    const vp = document.createElement("div");
    vp.style.width = "400px";
    this.dialogEl.appendChild(vp);
    const iframe = document.createElement("iframe");
    iframe.src = "circuitjs/about.html";
    iframe.width = "400";
    iframe.height = "430";
    iframe.scrolling = "auto";
    iframe.frameBorder = "0";
    vp.appendChild(iframe);
    vp.appendChild(document.createElement("br"));
    const okButton = document.createElement("button");
    okButton.textContent = "OK";
    okButton.onclick = () => this.closeDialog();
    vp.appendChild(okButton);
    this.show();
  }
}
window.AboutBox = AboutBox;

export { AboutBox };
