import { a as CirSim, f as Color, c as CircuitElm, G as Graphics } from './CircuitElm-D0NL-LPP.js';

class ImageExporter {
  static CAC_PRINT = 0;
  static CAC_IMAGE = 1;
  static CAC_SVG = 2;
  sim;
  constructor(sim) {
    this.sim = sim;
  }
  static defaultFileName(ext) {
    const d = /* @__PURE__ */ new Date();
    const pad = (n) => n < 10 ? "0" + n : "" + n;
    const dtf = "" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes());
    return "circuit-" + dtf + ext;
  }
  doExportAsImage() {
    if (CirSim.isElectron()) {
      const dataURL = this.getCircuitAsCanvas(ImageExporter.CAC_IMAGE).toDataURL();
      const base64 = dataURL.substring(dataURL.indexOf(",") + 1);
      window.showSaveDialog?.(ImageExporter.defaultFileName(".png")).then((file) => {
        if (file.canceled)
          return;
        window.saveFile(file, base64, "base64");
      });
      return;
    }
    CirSim.dialogShowing = new window.ExportAsImageDialog(ImageExporter.CAC_IMAGE, this.sim);
    CirSim.dialogShowing.show();
  }
  doImageToClipboard() {
    const cv = this.getCircuitAsCanvas(ImageExporter.CAC_IMAGE);
    cv.toBlob((blob) => {
      if (blob == null)
        return;
      const item = new window.ClipboardItem({ "image/png": blob });
      navigator.clipboard.write([item]).then((x) => console.log(x));
    });
  }
  doPrint() {
    const cv = this.getCircuitAsCanvas(ImageExporter.CAC_PRINT);
    const img = cv.toDataURL("image/png");
    const style = document.createElement("style");
    style.id = "circuit-print-style";
    style.innerHTML = "@media print { body > *:not(#circuit-print-overlay) { display: none !important; } } #circuit-print-overlay { display: none; } @media print { html, body { height: 100%; margin: 0; padding: 0; } @page { size: auto; margin: 10mm; } #circuit-print-overlay { display: flex !important; align-items: center; justify-content: center; width: 100%; height: 100%; } #circuit-print-overlay img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; page-break-inside: avoid; } }";
    document.head.appendChild(style);
    const overlay = document.createElement("div");
    overlay.id = "circuit-print-overlay";
    const imgEl = document.createElement("img");
    imgEl.src = img;
    overlay.appendChild(imgEl);
    document.body.appendChild(overlay);
    setTimeout(() => {
      window.print();
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    }, 500);
  }
  doExportAsSVG() {
    if (CirSim.isElectron()) {
      window.showSaveDialog?.(ImageExporter.defaultFileName(".svg")).then((file) => {
        if (file.canceled)
          return;
        window.saveFile(file, this.getCircuitAsSVG(), "utf8");
      });
      return;
    }
    CirSim.dialogShowing = new window.ExportAsImageDialog(ImageExporter.CAC_SVG, this.sim);
    CirSim.dialogShowing.show();
  }
  doExportAsSVGFromAPI() {
    const svg = this.getCircuitAsSVG();
    this.sim.jsInterface.callSVGRenderedHook(svg);
  }
  // max canvas dimensions we'll target; chosen to stay under the tightest
  // common browser limit (Chrome caps canvas area at 16384*16384 = 268,435,456 px)
  static MAX_CANVAS_DIM = 16e3;
  static MAX_CANVAS_AREA = 25e7;
  getCircuitAsCanvas(type) {
    const cv = document.createElement("canvas");
    const bounds = this.sim.getCircuitBounds();
    const wmargin = 140;
    const hmargin = 100;
    const baseW = bounds.width + wmargin;
    const baseH = bounds.height + hmargin;
    let factor = 2;
    factor = Math.min(factor, ImageExporter.MAX_CANVAS_DIM / baseW);
    factor = Math.min(factor, ImageExporter.MAX_CANVAS_DIM / baseH);
    factor = Math.min(factor, Math.sqrt(ImageExporter.MAX_CANVAS_AREA / (baseW * baseH)));
    const w = Math.round(bounds.width * factor + wmargin);
    const h = Math.round(bounds.height * factor + hmargin);
    cv.width = w;
    cv.height = h;
    const context = cv.getContext("2d");
    this.drawCircuitInContext(context, type, bounds, w, h);
    return cv;
  }
  getCircuitAsSVG() {
    const bounds = this.sim.getCircuitBounds();
    const wmargin = 140;
    const hmargin = 100;
    const w = bounds.width + wmargin;
    const h = bounds.height + hmargin;
    const context = new window.C2S(w, h);
    this.drawCircuitInContext(context, ImageExporter.CAC_SVG, bounds, w, h);
    return context.getSerializedSvg();
  }
  drawCircuitInContext(context, type, bounds, w, h) {
    const g = new Graphics(context);
    context.setTransform(1, 0, 0, 1, 0, 0);
    const oldTransform = this.sim.transform.slice();
    let scale = 1;
    const p = this.sim.menus.printableCheckItem.getState();
    const c = this.sim.menus.dotsCheckItem.getState();
    const print = type === ImageExporter.CAC_PRINT;
    if (print)
      this.sim.menus.printableCheckItem.setState(true);
    if (this.sim.menus.printableCheckItem.getState()) {
      CircuitElm.whiteColor = Color.black;
      CircuitElm.lightGrayColor = Color.black;
      g.setColor(Color.white);
    } else {
      CircuitElm.whiteColor = Color.white;
      CircuitElm.lightGrayColor = Color.lightGray;
      g.setColor(Color.black);
    }
    g.fillRect(0, 0, w, h);
    this.sim.menus.dotsCheckItem.setState(false);
    const wmargin = 140;
    const hmargin = 100;
    if (bounds != null)
      scale = Math.min(w / (bounds.width + wmargin), h / (bounds.height + hmargin));
    this.sim.transform[0] = this.sim.transform[3] = scale;
    this.sim.transform[4] = -(bounds.x - wmargin / 2);
    this.sim.transform[5] = -(bounds.y - hmargin / 2);
    context.scale(scale, scale);
    context.translate(this.sim.transform[4], this.sim.transform[5]);
    context.lineCap = "round";
    for (const ce of this.sim.elmList)
      ce.draw(g);
    for (let i = 0; i !== this.sim.postDrawList.length; i++)
      CircuitElm.drawPost(g, this.sim.postDrawList[i]);
    this.sim.menus.printableCheckItem.setState(p);
    this.sim.menus.dotsCheckItem.setState(c);
    this.sim.transform = oldTransform;
  }
}

export { ImageExporter };
