import { c as CircuitElm, j as CustomLogicModel, b as CircuitXMLSerializer, P as Point, l as SimulationManager, L as Locale, E as EditInfo, e as Checkbox, H as HookRegistry, a as CirSim, p as parseIntStrict, W as WireRouter, m as Scope, x as StringTokenizer, w as Rectangle } from './CircuitElm-D0NL-LPP.js';
import { U as UIManager } from './UIManager-Bxtki72o.js';

class LabelEntry {
  point;
  node = null;
}
class LabeledNodeElm extends CircuitElm {
  static FLAG_ESCAPE = 4;
  static FLAG_INTERNAL = 1;
  static FLAG_ROTATE_TEXT = 8;
  text = "label";
  busWidth = 1;
  currents = null;
  static labelList = /* @__PURE__ */ new Map();
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      this.text = "label";
    } else {
      super(xa, ya, xb, yb, f);
      this.text = st.nextToken();
      if ((this.flags & LabeledNodeElm.FLAG_ESCAPE) === 0) {
        while (st.hasMoreTokens())
          this.text += " " + st.nextToken();
      } else {
        this.text = CustomLogicModel.unescape(this.text);
      }
    }
  }
  dump() {
    this.flags |= LabeledNodeElm.FLAG_ESCAPE;
    return super.dump() + " " + CustomLogicModel.escape(this.text);
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "te", this.text);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    this.text = xml.parseStringAttr("te", this.text) ?? this.text;
  }
  isInternal() {
    return (this.flags & LabeledNodeElm.FLAG_INTERNAL) !== 0;
  }
  isRotateText() {
    return (this.flags & LabeledNodeElm.FLAG_ROTATE_TEXT) !== 0;
  }
  static resetNodeList() {
    LabeledNodeElm.labelList = /* @__PURE__ */ new Map();
  }
  circleSize = 17;
  setPoints() {
    super.setPoints();
    this.lead1 = this.interpPoint(this.point1, this.point2, 1 - this.circleSize / this.dn);
  }
  // get post we're connected to
  getConnectedPost(n = 0) {
    const key = this.busWidth > 1 ? this.text + ":" + n : this.text;
    const myPost = this.getPost(n);
    const le = LabeledNodeElm.labelList.get(key);
    if (le != null)
      return le.point;
    const newLe = new LabelEntry();
    newLe.point = myPost;
    LabeledNodeElm.labelList.set(key, newLe);
    return null;
  }
  setNode(p, n) {
    super.setNode(p, n);
    const key = this.busWidth > 1 ? this.text + ":" + p : this.text;
    const le = LabeledNodeElm.labelList.get(key);
    if (le != null)
      le.node = n;
  }
  getDumpType() {
    return 207;
  }
  getXmlDumpType() {
    return "ln";
  }
  getPostCount() {
    return this.busWidth;
  }
  getPostWidth(n) {
    return this.busWidth;
  }
  getBusWidth() {
    return this.busWidth;
  }
  getPost(n) {
    if (this.busWidth === 1)
      return this.point1;
    return new Point(this.point1.x, this.point1.y, n);
  }
  getWireSegments(list) {
    for (let b = 0; b < this.busWidth; b++) {
      const ep0 = SimulationManager.pointKey(this.getPost(b));
      const ep1 = this.busWidth > 1 ? "label:" + this.text + ":" + b : "label:" + this.text;
      list.push(new SimulationManager.WireSegment(this, b, ep0, ep1));
    }
  }
  // this is basically a wire, since it just connects two or more nodes together
  isWireEquivalent() {
    return true;
  }
  isRemovableWire() {
    return true;
  }
  getConnection(n1, n2) {
    return n1 === n2;
  }
  static getByName(n) {
    if (LabeledNodeElm.labelList == null)
      return null;
    const le = LabeledNodeElm.labelList.get(n);
    if (le == null)
      return null;
    return le.node;
  }
  // find label text for the given node, if any (used to show label in getInfo() for wires)
  static getLabelForNode(cn) {
    if (LabeledNodeElm.labelList == null || cn == null)
      return null;
    for (const [key, le] of LabeledNodeElm.labelList) {
      if (le.node === cn) {
        const ci = key.lastIndexOf(":");
        return ci < 0 ? key : key.substring(0, ci);
      }
    }
    return null;
  }
  drawLabeledNode(g, str, pt1, pt2) {
    if (this.isRotateText() && pt1.x === pt2.x) {
      this.drawRotatedLabeledNode(g, str, pt1, pt2);
      return;
    }
    super.drawLabeledNode(g, str, pt1, pt2);
  }
  drawRotatedLabeledNode(g, str, pt1, pt2) {
    let lineOver = false;
    if (str.startsWith("/")) {
      lineOver = true;
      str = str.substring(1);
    }
    const w = g.context.measureText(str).width;
    const h = g.currentFontSize;
    g.save();
    g.context.textBaseline = "middle";
    const dir = CircuitElm.sign(pt2.y - pt1.y);
    const offset = h + Math.max(0, w / 2 - h);
    const tx = pt2.x;
    const ty = pt2.y + dir * offset;
    g.context.translate(tx, ty);
    g.context.rotate(-Math.PI / 2);
    g.context.textAlign = "center";
    g.drawString(str, 0, 0);
    this.adjustBbox(tx - h / 2, ty - w / 2, tx + h / 2, ty + w / 2);
    g.restore();
    if (lineOver) {
      const xa = -h / 2 - 1;
      g.save();
      g.context.translate(tx, ty);
      g.context.rotate(-Math.PI / 2);
      g.drawLine(-w / 2, xa, w / 2, xa);
      g.restore();
    }
  }
  draw(g) {
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1, this.busWidth > 1 ? 5 : 3);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
    this.setPowerColor(g, false);
    this.interpPoint(this.point1, this.point2, CircuitElm.ps2, 1 + 11 / this.dn);
    this.setBbox(this.point1, CircuitElm.ps2, this.circleSize);
    this.drawLabeledNode(g, this.text, this.point1, this.lead1);
    if (this.currents != null) {
      this.current = 0;
      for (let i = 0; i < this.currents.length; i++)
        this.current += this.currents[i];
    }
    this.updateDotCount();
    this.drawDots(g, this.point1, this.lead1, this.curcount);
    this.drawPosts(g);
  }
  getCurrentIntoNode(n) {
    if (this.currents != null)
      return -this.currents[n];
    return -this.current;
  }
  setCurrent(vs, c) {
    this.current = c;
  }
  setWireCurrent(bit, c) {
    if (this.currents != null)
      this.currents[bit] = c;
    else
      this.current = c;
  }
  getShortcut() {
    return "b".charCodeAt(0);
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  getElmType() {
    return "Labeled Node";
  }
  getBusValue() {
    let value = 0;
    for (let i = 0; i < this.busWidth; i++)
      if (this.nodes[i].v > 2.5)
        value |= 1 << i;
    return value;
  }
  getInfo(arr) {
    arr[0] = Locale.LS(this.text) + " (" + Locale.LS("Labeled Node") + ")";
    if (this.busWidth > 1) {
      const value = this.getBusValue();
      arr[1] = "value = " + value;
      arr[2] = "hex = 0x" + value.toString(16).toUpperCase();
    } else {
      arr[1] = "I = " + CircuitElm.getCurrentText(this.getCurrent());
      arr[2] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
    }
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Text", 0, -1, -1);
      ei.text = this.text;
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Internal Node", this.isInternal());
      return ei;
    }
    if (n === 2) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Rotate Text When Vertical", this.isRotateText());
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.text = ei.textf.value;
    if (n === 1)
      this.flags = ei.changeFlag(this.flags, LabeledNodeElm.FLAG_INTERNAL);
    if (n === 2)
      this.flags = ei.changeFlag(this.flags, LabeledNodeElm.FLAG_ROTATE_TEXT);
  }
  getScopeText(v) {
    return this.text;
  }
  getName() {
    return this.text;
  }
  isLabeledNodeElm() {
    return true;
  }
  addJSMethods() {
    super.addJSMethods();
    const p = this._jsProxy;
    p["getLabelName"] = () => this.getName();
  }
}
HookRegistry.resetLabeledNodeList = () => LabeledNodeElm.resetNodeList();
HookRegistry.getLabeledNode = (name) => LabeledNodeElm.getByName(name);

class WireElm extends CircuitElm {
  busWidth = 1;
  currents = null;
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
    } else {
      super(xa, ya, xb, yb, f);
    }
  }
  static FLAG_SHOWCURRENT = 1;
  static FLAG_SHOWVOLTAGE = 2;
  static FLAG_SHOW_BUS_VALUE = 4;
  static FLAG_SHOW_BUS_VALUE_HEX = 8;
  getPostCount() {
    return (this.busWidth ?? 1) * 2;
  }
  getBusWidth() {
    return this.busWidth;
  }
  getPost(n) {
    if (this.busWidth == 1)
      return n == 0 ? this.point1 : this.point2;
    if (n < this.busWidth)
      return new Point(this.point1.x, this.point1.y, n);
    return new Point(this.point2.x, this.point2.y, n - this.busWidth);
  }
  getPostWidth(n) {
    return this.busWidth;
  }
  getConnection(n1, n2) {
    if (this.busWidth == 1)
      return true;
    return Math.abs(n1 - n2) == this.busWidth;
  }
  getConnectedPost(n) {
    if (n === void 0)
      return this.point2;
    if (this.busWidth == 1)
      return n == 0 ? this.point2 : this.point1;
    if (n < this.busWidth)
      return new Point(this.point2.x, this.point2.y, n);
    return new Point(this.point1.x, this.point1.y, n - this.busWidth);
  }
  getBusValue() {
    let value = 0;
    for (let i = 0; i < this.busWidth; i++)
      if (this.nodes[i].v > 2.5)
        value |= 1 << i;
    return value;
  }
  draw(g) {
    if (this.currents != null) {
      this.current = 0;
      for (let i = 0; i < this.currents.length; i++)
        this.current += this.currents[i];
    }
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.point2, this.busWidth > 1 ? 5 : 3);
    this.doDots(g);
    this.setBbox(this.point1, this.point2, 3);
    let s = "";
    if (this.busWidth > 1 && (this.mustShowBusValue() || this.mustShowBusValueHex())) {
      const value = this.getBusValue();
      if (this.mustShowBusValue())
        s = "" + value;
      if (this.mustShowBusValueHex())
        s = (s.length > 0 ? s + " " : "") + "0x" + value.toString(16).toUpperCase();
    } else if (this.busWidth == 1) {
      if (this.mustShowCurrent())
        s = CircuitElm.getShortUnitText(Math.abs(this.getCurrent()), "A");
      if (this.mustShowVoltage())
        s = (s.length > 0 ? s + " " : "") + CircuitElm.getShortUnitText(this.nodes[0].v, "V");
    }
    this.drawValues(g, s, 4);
    this.drawPosts(g);
  }
  stamp() {
  }
  mustShowCurrent() {
    return (this.flags & WireElm.FLAG_SHOWCURRENT) != 0;
  }
  mustShowVoltage() {
    return (this.flags & WireElm.FLAG_SHOWVOLTAGE) != 0;
  }
  mustShowBusValue() {
    return (this.flags & WireElm.FLAG_SHOW_BUS_VALUE) != 0;
  }
  mustShowBusValueHex() {
    return (this.flags & WireElm.FLAG_SHOW_BUS_VALUE_HEX) != 0;
  }
  //	int getVoltageSourceCount() { return 1; }
  getInfo(arr) {
    arr[0] = this.busWidth > 1 ? "bus wire (" + this.busWidth + ")" : "wire";
    if (this.busWidth > 1) {
      const value = this.getBusValue();
      arr[1] = "value = " + value;
      arr[2] = "hex = 0x" + value.toString(16).toUpperCase();
      let label = LabeledNodeElm.getLabelForNode(this.getNode(0));
      if (label != null) {
        for (let i = 1; i < this.busWidth; i++) {
          if (label !== LabeledNodeElm.getLabelForNode(this.getNode(i))) {
            label = null;
            break;
          }
        }
      }
      if (label != null)
        arr[3] = label;
    } else {
      arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
      arr[2] = "V = " + CircuitElm.getVoltageText(this.nodes[0].v);
      const label = LabeledNodeElm.getLabelForNode(this.getNode(0));
      if (label != null)
        arr[3] = label;
    }
  }
  getDumpType() {
    return "w".charCodeAt(0);
  }
  getPower() {
    return 0;
  }
  getVoltageDiff() {
    return this.nodes[0].v;
  }
  isWireEquivalent() {
    return true;
  }
  isRemovableWire() {
    return true;
  }
  isWireElm() {
    return true;
  }
  showPropertiesOnCreate() {
    return false;
  }
  setWireCurrent(bit, c) {
    if (this.currents != null)
      this.currents[bit] = c;
    else
      this.current = c;
  }
  getCurrentIntoNode(n) {
    if (this.currents != null) {
      if (n < this.busWidth)
        return -this.currents[n];
      return this.currents[n - this.busWidth];
    }
    if (n == 0)
      return -this.current;
    return this.current;
  }
  getEditInfo(n) {
    if (n == 0) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Show Current", this.mustShowCurrent());
      return ei;
    }
    if (n == 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Show Voltage", this.mustShowVoltage());
      return ei;
    }
    if (n == 2) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Show Bus Value", this.mustShowBusValue());
      return ei;
    }
    if (n == 3) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.checkbox = new Checkbox("Show Bus Value (Hex)", this.mustShowBusValueHex());
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n == 0) {
      if (ei.checkbox.getState())
        this.flags |= WireElm.FLAG_SHOWCURRENT;
      else
        this.flags &= ~WireElm.FLAG_SHOWCURRENT;
    }
    if (n == 1) {
      if (ei.checkbox.getState())
        this.flags |= WireElm.FLAG_SHOWVOLTAGE;
      else
        this.flags &= ~WireElm.FLAG_SHOWVOLTAGE;
    }
    if (n == 2)
      this.flags = ei.changeFlag(this.flags, WireElm.FLAG_SHOW_BUS_VALUE);
    if (n == 3)
      this.flags = ei.changeFlag(this.flags, WireElm.FLAG_SHOW_BUS_VALUE_HEX);
  }
  getShortcut() {
    return "w".charCodeAt(0);
  }
  static pointOnWireInteriorForPoints(px, py, pts) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (CircuitElm.pointOnSegmentInterior(a.x, a.y, b.x, b.y, px, py)) return true;
    }
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i];
      if (p.x === px && p.y === py) return true;
    }
    return false;
  }
  pointOnWireInterior(px, py) {
    const pts = [this.point1, this.point2];
    return WireElm.pointOnWireInteriorForPoints(px, py, pts);
  }
  split(px, py) {
    const newWire = new WireElm(px, py);
    newWire.drag(this.x2, this.y2);
    this.drag(px, py);
    return newWire;
  }
  // True if some other 2-terminal element already connects (ax,ay) directly to
  // (bx,by). Used to avoid laying a redundant parallel wire segment on top of
  // an existing colinear element, which would create an electrical loop.
  hasDirectConnection(ax, ay, bx, by) {
    for (const ce of CirSim.theApp.elmList) {
      if (ce === this || ce.getPostCount() !== 2)
        continue;
      const p0 = ce.getPost(0);
      const p1 = ce.getPost(1);
      if (p0.x === ax && p0.y === ay && p1.x === bx && p1.y === by || p0.x === bx && p0.y === by && p1.x === ax && p1.y === ay)
        return true;
    }
    return false;
  }
  // After a plain wire is newly drawn, split it at any point where another
  // element's post lies in its interior, so it connects there instead of just
  // crossing over it. (RoutedWireElm overrides this to do nothing, since it
  // routes around such posts instead of through them.) Any sub-segment that
  // would duplicate an existing colinear element (both endpoints of that
  // element lying on the new wire) is dropped instead of added, since adding
  // it would just create a parallel loop.
  draggingDone() {
    const splitPoints = [];
    for (const p of CirSim.theApp.postDrawList) {
      if (CircuitElm.pointOnSegmentInterior(this.x, this.y, this.x2, this.y2, p.x, p.y))
        splitPoints.push(p);
    }
    if (splitPoints.length === 0)
      return;
    const x0 = this.x, y0 = this.y;
    splitPoints.sort((a, b) => {
      const da = (a.x - x0) * (a.x - x0) + (a.y - y0) * (a.y - y0);
      const db = (b.x - x0) * (b.x - x0) + (b.y - y0) * (b.y - y0);
      return da - db;
    });
    const pts = [new Point(this.x, this.y)];
    for (const p of splitPoints) {
      const last2 = pts[pts.length - 1];
      if (p.x !== last2.x || p.y !== last2.y)
        pts.push(p);
    }
    const last = pts[pts.length - 1];
    if (last.x !== this.x2 || last.y !== this.y2)
      pts.push(new Point(this.x2, this.y2));
    let first = true;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (this.hasDirectConnection(a.x, a.y, b.x, b.y))
        continue;
      if (first) {
        this.x = a.x;
        this.y = a.y;
        this.drag(b.x, b.y);
        first = false;
      } else {
        const seg = new WireElm(a.x, a.y);
        seg.drag(b.x, b.y);
        CirSim.theApp.elmList.push(seg);
      }
    }
    if (first) {
      const idx = CirSim.theApp.elmList.indexOf(this);
      if (idx >= 0)
        CirSim.theApp.elmList.splice(idx, 1);
      this.delete();
    }
  }
  getMouseDistance(gx, gy) {
    const thresh = 10;
    const d2 = this.lineDistanceSq(this.x, this.y, this.x2, this.y2, gx, gy);
    if (d2 <= thresh * thresh)
      return d2;
    return -1;
  }
}

class RoutedWireElm extends WireElm {
  routePoints = null;
  constructor(xxOrPoints, yy, xb, yb, f, st) {
    if (Array.isArray(xxOrPoints)) {
      const points = xxOrPoints;
      super(points[0].x, points[0].y);
      this.setPoints(points);
    } else if (xb !== void 0) {
      super(xxOrPoints, yy, xb, yb, f, st);
    } else {
      super(xxOrPoints, yy);
    }
  }
  getDumpType() {
    return 0;
  }
  getXmlDumpType() {
    return "rw";
  }
  isRoutedWireElm() {
    return true;
  }
  // RoutedWireElm routes around other elements' posts rather than splitting to
  // connect to them, so don't auto-split like a plain WireElm would.
  draggingDone() {
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    if (this.routePoints !== null && this.routePoints.length > 0) {
      const parts = this.routePoints.map((p) => p.x + "," + p.y);
      elem.appendChild(doc.createTextNode(parts.join(";")));
    }
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    try {
      const contents = xml.parseContents();
      if (contents !== null && contents.length > 0) {
        const points = [];
        for (const pair of contents.split(";")) {
          const xy = pair.split(",");
          points.push(new Point(parseIntStrict(xy[0]), parseIntStrict(xy[1])));
        }
        if (points.length >= 2)
          this.routePoints = points;
      }
    } catch (e) {
    }
  }
  move(dx, dy) {
    if (this.routePoints !== null) {
      for (const p of this.routePoints)
        p.move(dx, dy);
    }
    super.move(dx, dy);
  }
  getShortcut() {
    return "W".charCodeAt(0);
  }
  setPoints(pointsOrRouting) {
    if (Array.isArray(pointsOrRouting)) {
      const points = pointsOrRouting;
      const first = points[0];
      const last = points[points.length - 1];
      this.x = first.x;
      this.y = first.y;
      this.x2 = last.x;
      this.y2 = last.y;
      super.setPoints();
      this.routePoints = points;
      return;
    }
    const routing = pointsOrRouting !== false;
    super.setPoints();
    if (this.routePoints !== null && this.routePoints.length >= 2) {
      const first = this.routePoints[0];
      const last = this.routePoints[this.routePoints.length - 1];
      if (first.x === this.x && first.y === this.y && last.x === this.x2 && last.y === this.y2)
        return;
    }
    if (!routing) {
      this.routePoints = [this.point1, this.point2];
      return;
    }
    const router = new WireRouter();
    router.initGrid(this, CirSim.theApp.gridSize, UIManager.theUI.elmList, UIManager.theUI.getCircuitBounds());
    const result = router.routeWire(this.x, this.y, this.x2, this.y2);
    if (result.length < 2) {
      CirSim.console("routing failed");
      this.routePoints = [this.point1, new Point(this.x2, this.y), this.point2];
      return;
    }
    CirSim.console("route success");
    this.routePoints = result;
  }
  // split this routed wire at the point nearest (mx, my)
  split(mx, my) {
    if (this.routePoints === null || this.routePoints.length < 2)
      return null;
    let bestSeg = -1;
    let bestDist = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < this.routePoints.length - 1; i++) {
      const a2 = this.routePoints[i];
      const b2 = this.routePoints[i + 1];
      const d = RoutedWireElm.segmentDistanceSq(a2.x, a2.y, b2.x, b2.y, mx, my);
      if (d < bestDist) {
        bestDist = d;
        bestSeg = i;
      }
    }
    const a = this.routePoints[bestSeg];
    const b = this.routePoints[bestSeg + 1];
    let sx, sy;
    if (a.x === b.x) {
      sx = a.x;
      sy = this.snapGrid(my);
      sy = Math.max(Math.min(a.y, b.y), Math.min(sy, Math.max(a.y, b.y)));
    } else {
      sy = a.y;
      sx = this.snapGrid(mx);
      sx = Math.max(Math.min(a.x, b.x), Math.min(sx, Math.max(a.x, b.x)));
    }
    if (sx === this.x && sy === this.y || sx === this.x2 && sy === this.y2)
      return null;
    const atA = sx === a.x && sy === a.y;
    const atB = sx === b.x && sy === b.y;
    const rp1 = [];
    for (let i = 0; i <= bestSeg; i++) rp1.push(this.routePoints[i]);
    if (!atA)
      rp1.push(new Point(sx, sy));
    const rp2 = [new Point(sx, sy)];
    for (let i = bestSeg + 1; i < this.routePoints.length; i++) {
      if (i === bestSeg + 1 && atB)
        continue;
      rp2.push(this.routePoints[i]);
    }
    this.setPoints(rp1);
    return new RoutedWireElm(rp2);
  }
  selectRect(r, add) {
    if (this.routePoints === null || this.routePoints.length < 2) {
      super.selectRect(r, add);
      return;
    }
    let hit = false;
    for (let i = 0; i < this.routePoints.length - 1 && !hit; i++) {
      const a = this.routePoints[i];
      const b = this.routePoints[i + 1];
      if (RoutedWireElm.segmentIntersectsRect(a, b, r))
        hit = true;
    }
    if (hit)
      this.selected = true;
    else if (!add)
      this.selected = false;
  }
  // test whether an axis-aligned segment (a-b) intersects rectangle r
  static segmentIntersectsRect(a, b, r) {
    const rx1 = r.x, ry1 = r.y, rx2 = r.x + r.width, ry2 = r.y + r.height;
    if (a.y === b.y) {
      if (a.y < ry1 || a.y > ry2)
        return false;
      const lo = Math.min(a.x, b.x), hi = Math.max(a.x, b.x);
      return hi >= rx1 && lo <= rx2;
    } else {
      if (a.x < rx1 || a.x > rx2)
        return false;
      const lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y);
      return hi >= ry1 && lo <= ry2;
    }
  }
  pointOnWireInterior(px, py) {
    if (this.routePoints === null || this.routePoints.length < 2)
      return false;
    return WireElm.pointOnWireInteriorForPoints(px, py, this.routePoints);
  }
  rerouteVia(vx, vy) {
    const router = new WireRouter();
    router.initGrid(this, CirSim.theApp.gridSize, UIManager.theUI.elmList, UIManager.theUI.getCircuitBounds());
    const rp1 = router.routeWire(this.x, this.y, vx, vy);
    if (rp1.length < 2) return;
    for (let i = 0; i < rp1.length - 1; i++)
      router.addWire(rp1[i].x, rp1[i].y, rp1[i + 1].x, rp1[i + 1].y);
    const rp2 = router.routeWire(vx, vy, this.x2, this.y2);
    if (rp2.length < 2) return;
    this.routePoints = [...rp1, ...rp2.slice(1)];
  }
  addRoutingObstacle(router) {
    if (this.routePoints === null) return;
    for (let i = 0; i < this.routePoints.length - 1; i++)
      router.addWire(
        this.routePoints[i].x,
        this.routePoints[i].y,
        this.routePoints[i + 1].x,
        this.routePoints[i + 1].y
      );
  }
  draw(g) {
    if (this.routePoints === null || this.routePoints.length < 2) {
      super.draw(g);
      return;
    }
    this.setVoltageColor(g, this.nodes[0].v);
    for (let i = 0; i < this.routePoints.length - 1; i++)
      CircuitElm.drawThickLine(g, this.routePoints[i], this.routePoints[i + 1], this.busWidth > 1 ? 5 : 3);
    if (this.currents !== null) {
      this.current = 0;
      for (let i = 0; i < this.currents.length; i++)
        this.current += this.currents[i];
    }
    this.doDots(g);
    const m = 5;
    let minX = this.point1.x, minY = this.point1.y, maxX = this.point1.x, maxY = this.point1.y;
    for (let i = 1; i < this.routePoints.length; i++) {
      const p = this.routePoints[i];
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    this.setBbox(minX - m, minY - m, maxX + m, maxY + m);
    let s = "";
    if (this.busWidth > 1 && (this.mustShowBusValue() || this.mustShowBusValueHex())) {
      const value = this.getBusValue();
      if (this.mustShowBusValue()) s = "" + value;
      if (this.mustShowBusValueHex()) s = (s.length > 0 ? s + " " : "") + "0x" + value.toString(16).toUpperCase();
    } else if (this.busWidth === 1) {
      if (this.mustShowCurrent()) s = CircuitElm.getShortUnitText(Math.abs(this.getCurrent()), "A");
      if (this.mustShowVoltage()) s = (s.length > 0 ? s + " " : "") + CircuitElm.getShortUnitText(this.nodes[0].v, "V");
    }
    if (s.length > 0)
      this.drawValuesOnLongestSegment(g, s);
    this.drawPosts(g);
  }
  drawValuesOnLongestSegment(g, s) {
    if (this.routePoints === null || this.routePoints.length < 2) return;
    let bestLen = 0, bestSeg = 0;
    for (let i = 0; i < this.routePoints.length - 1; i++) {
      const a2 = this.routePoints[i], b2 = this.routePoints[i + 1];
      const dx = b2.x - a2.x, dy = b2.y - a2.y;
      const len = dx * dx + dy * dy;
      if (len > bestLen) {
        bestLen = len;
        bestSeg = i;
      }
    }
    const a = this.routePoints[bestSeg], b = this.routePoints[bestSeg + 1];
    const mx = (a.x + b.x) / 2 | 0, my = (a.y + b.y) / 2 | 0;
    g.setFont(CircuitElm.unitsFont);
    const w = g.measureWidth(s);
    const ya = g.currentFontSize / 2 | 0;
    g.setColor(CircuitElm.whiteColor);
    if (a.y === b.y)
      g.drawString(s, mx - w / 2, my - 6);
    else
      g.drawString(s, mx + 4, my + ya);
  }
  doDots(g) {
    this.updateDotCount();
    if (this.isCreating() || this.curcount === 0 || this.routePoints === null) return;
    let cc = this.curcount;
    for (let i = 0; i < this.routePoints.length - 1; i++) {
      const a = this.routePoints[i], b = this.routePoints[i + 1];
      this.drawDots(g, a, b, cc);
      const dx = b.x - a.x, dy = b.y - a.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      cc = this.addCurCount(cc, segLen);
    }
  }
  getMouseDistance(gx, gy) {
    if (this.routePoints === null) return super.getMouseDistance(gx, gy);
    const thresh = 10;
    let best = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < this.routePoints.length - 1; i++) {
      const a = this.routePoints[i], b = this.routePoints[i + 1];
      const d = RoutedWireElm.segmentDistanceSq(a.x, a.y, b.x, b.y, gx, gy);
      if (d < best) best = d;
    }
    return best <= thresh * thresh ? best : -1;
  }
  static segmentDistanceSq(ax, ay, bx, by, gx, gy) {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return (gx - ax) * (gx - ax) + (gy - ay) * (gy - ay);
    let t = ((gx - ax) * dx + (gy - ay) * dy) / lenSq;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const px = ax + t * dx, py = ay + t * dy;
    const ex = gx - px, ey = gy - py;
    return ex * ex + ey * ey | 0;
  }
  pointOnPath(p) {
    if (this.routePoints === null || this.routePoints.length < 2) return false;
    if (p.equals(this.point1) || p.equals(this.point2)) return false;
    for (let i = 0; i < this.routePoints.length - 1; i++) {
      const a = this.routePoints[i], b = this.routePoints[i + 1];
      if (a.x === b.x && p.x === a.x) {
        const lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y);
        if (p.y >= lo && p.y <= hi) return true;
      } else if (a.y === b.y && p.y === a.y) {
        const lo = Math.min(a.x, b.x), hi = Math.max(a.x, b.x);
        if (p.x >= lo && p.x <= hi) return true;
      }
    }
    return false;
  }
  getSnapPointOnWire(mx, my) {
    if (this.routePoints === null || this.routePoints.length < 2) return null;
    let bestSeg = -1, bestDist = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < this.routePoints.length - 1; i++) {
      const a2 = this.routePoints[i], b2 = this.routePoints[i + 1];
      const d = this.lineDistanceSq(a2.x, a2.y, b2.x, b2.y, mx, my);
      if (d < bestDist) {
        bestDist = d;
        bestSeg = i;
      }
    }
    const a = this.routePoints[bestSeg], b = this.routePoints[bestSeg + 1];
    let sx, sy;
    if (a.x === b.x) {
      sx = a.x;
      sy = this.snapGrid(my);
    } else {
      sy = a.y;
      sx = this.snapGrid(mx);
    }
    return new Point(sx, sy);
  }
  getInfo(arr) {
    super.getInfo(arr);
    arr[0] = this.busWidth > 1 ? "routed bus wire (" + this.busWidth + ")" : "routed wire";
  }
}

class ScopeElm extends CircuitElm {
  constructor(xxOrXa, yyOrYa, xb, yb, f, st) {
    if (xb === void 0) {
      super(xxOrXa, yyOrYa);
      this.noDiagonal = false;
      this.x2 = this.x + 128;
      this.y2 = this.y + 64;
      this.elmScope = new Scope(CircuitElm.app, CircuitElm.sim);
      this.setPoints();
    } else {
      super(xxOrXa, yyOrYa, xb, yb, f);
      this.noDiagonal = false;
      const sStr = st.nextToken();
      const sst = new StringTokenizer(sStr, "_");
      this.elmScope = new Scope(CircuitElm.app, CircuitElm.sim);
      this.elmScope.undump(sst);
      this.setPoints();
      this.elmScope.resetGraph();
    }
  }
  setScopeElm(e) {
    this.elmScope.setElm(e);
    this.elmScope.resetGraph();
  }
  setScopeRect() {
    const i1 = CircuitElm.app.mouse.transformX(Math.min(this.x, this.x2));
    const i2 = CircuitElm.app.mouse.transformX(Math.max(this.x, this.x2));
    const j1 = CircuitElm.app.mouse.transformY(Math.min(this.y, this.y2));
    const j2 = CircuitElm.app.mouse.transformY(Math.max(this.y, this.y2));
    const r = new Rectangle(i1, j1, i2 - i1, j2 - j1);
    if (!r.equals(this.elmScope.rect))
      this.elmScope.setRect(r);
  }
  setPoints() {
    super.setPoints();
    this.setScopeRect();
  }
  setElmScope(s) {
    this.elmScope = s;
  }
  stepScope() {
    this.elmScope.timeStep();
  }
  reset() {
    super.reset();
    this.elmScope.resetGraphFull(true);
  }
  clearElmScope() {
    this.elmScope = null;
  }
  canViewInScope() {
    return false;
  }
  getDumpType() {
    return 403;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    this.elmScope.dumpXml(doc, elem);
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    for (const child of xml.getChildElements()) {
      if (child.tagName === "o") {
        xml.parseChildElement(child);
        this.elmScope.undumpXml(xml);
        break;
      }
    }
    this.elmScope.resetGraph();
  }
  draw(g) {
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.whiteColor);
    g.context.save();
    g.context.scale(1 / CircuitElm.app.transform[0], 1 / CircuitElm.app.transform[3]);
    g.context.translate(-CircuitElm.app.transform[4], -CircuitElm.app.transform[5]);
    this.setScopeRect();
    this.elmScope.position = -1;
    this.elmScope.draw(g);
    g.context.restore();
    this.setBbox(this.point1, this.point2, 0);
    this.drawPosts(g);
  }
  getPostCount() {
    return 0;
  }
  getNumHandles() {
    return 2;
  }
  isScopeElm() {
    return true;
  }
  selectScope(mx, my) {
    this.elmScope.selectScope(mx, my);
  }
}

export { LabeledNodeElm as L, RoutedWireElm as R, ScopeElm as S, WireElm as W };
