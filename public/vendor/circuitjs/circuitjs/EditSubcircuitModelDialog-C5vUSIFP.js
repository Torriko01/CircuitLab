import { c as CircuitElm, p as parseIntStrict, r as parseFloatStrict, v as Font, u as CircuitNode, b as CircuitXMLSerializer, E as EditInfo, d as Choice, x as StringTokenizer, P as Point, a as CirSim, j as CustomLogicModel, C as CircuitXMLDeserializer, S as SubcircuitModel, I as CircuitNodeLink, L as Locale, H as HookRegistry, g as Dialog, l as SimulationManager, G as Graphics } from './CircuitElm-D0NL-LPP.js';

class Pin {
  chip;
  pos;
  side;
  side0;
  text;
  post;
  stub;
  textloc;
  bubbleX = 0;
  bubbleY = 0;
  voltSource = null;
  lineOver = false;
  bubble = false;
  clock = false;
  output = false;
  value = false;
  state = false;
  selected = false;
  curcount = 0;
  current = 0;
  busWidth = 1;
  busZ = 0;
  clockPointsX = null;
  clockPointsY = null;
  constructor(chip, p, s, t) {
    this.chip = chip;
    this.pos = p;
    this.side0 = this.side = s;
    this.text = t;
  }
  setPoint(px, py, dx, dy, dax, day, sx, sy) {
    const chip = this.chip;
    if (chip.isFlippedX()) {
      dx = -dx;
      dax = -dax;
      px += chip.cspc2 * (chip.flippedSizeX - 1);
      sx = -sx;
    }
    if (chip.isFlippedY()) {
      dy = -dy;
      day = -day;
      py += chip.cspc2 * (chip.flippedSizeY - 1);
      sy = -sy;
    }
    const xa = px + chip.cspc2 * dx * this.pos + sx;
    const ya = py + chip.cspc2 * dy * this.pos + sy;
    this.post = new Point(xa + dax * chip.cspc2, ya + day * chip.cspc2);
    const busExtra = this.busWidth > 1 ? 2 : 0;
    this.stub = new Point(xa + dax * (chip.cspc + busExtra), ya + day * (chip.cspc + busExtra));
    this.textloc = new Point(xa, ya);
    this.post.z = this.busZ;
    if (this.bubble) {
      this.bubbleX = xa + dax * 10 * chip.csize;
      this.bubbleY = ya + day * 10 * chip.csize;
    }
    if (this.clock) {
      if (this.clockPointsX === null) {
        this.clockPointsX = new Array(3);
        this.clockPointsY = new Array(3);
      }
      this.clockPointsX[0] = xa + dax * chip.cspc - dx * chip.cspc / 2;
      this.clockPointsY[0] = ya + day * chip.cspc - dy * chip.cspc / 2;
      this.clockPointsX[1] = xa;
      this.clockPointsY[1] = ya;
      this.clockPointsX[2] = xa + dax * chip.cspc + dx * chip.cspc / 2;
      this.clockPointsY[2] = ya + day * chip.cspc + dy * chip.cspc / 2;
      if (this.text.length > 0) {
        this.clockPointsX[1] += dax * chip.cspc / 2;
        this.clockPointsY[1] += day * chip.cspc / 2;
        this.textloc.x -= dax * chip.cspc / 2;
        this.textloc.y -= day * chip.cspc / 4;
      }
    } else {
      this.clockPointsX = null;
      this.clockPointsY = null;
    }
  }
  // convert position + side to a grid index so we can detect overlaps
  toGrid(p, s) {
    const chip = this.chip;
    if (s === ChipElm.SIDE_N) return p;
    if (s === ChipElm.SIDE_S) return p + chip.sizeX * (chip.sizeY - 1);
    if (s === ChipElm.SIDE_W) return p * chip.sizeX;
    if (s === ChipElm.SIDE_E) return p * chip.sizeX + chip.sizeX - 1;
    return -1;
  }
  overlaps(p, s) {
    const g = this.toGrid(p, s);
    if (g === -1) return true;
    return this.toGrid(this.pos, this.side) === g;
  }
  fixName() {
    if (this.text.startsWith("/")) {
      this.text = this.text.substring(1);
      this.lineOver = true;
    } else if (this.text.startsWith("#")) {
      this.text = this.text.substring(1);
      this.bubble = true;
    }
    let result = this.text.replace("CLK:", "");
    if (result.length !== this.text.length) {
      this.clock = true;
      this.text = result;
    }
    result = this.text.replace("INV:", "");
    if (result.length !== this.text.length) {
      this.bubble = true;
      this.text = result;
    }
    if (this.text.toLowerCase() === "clk") {
      this.text = "";
      this.clock = true;
    }
  }
}
class ChipElm extends CircuitElm {
  csize = 0;
  cspc = 0;
  cspc2 = 0;
  bits = 0;
  highVoltage = 5;
  bitOrder = 0;
  pins;
  rectPointsX;
  rectPointsY;
  sizeX = 0;
  sizeY = 0;
  flippedSizeX = 0;
  flippedSizeY = 0;
  lastClock = false;
  justLoaded = false;
  labelX = 0;
  labelY = 0;
  static FLAG_SMALL = 1;
  static FLAG_FLIP_X = 1 << 10;
  static FLAG_FLIP_Y = 1 << 11;
  static FLAG_FLIP_XY = 1 << 12;
  static FLAG_CUSTOM_VOLTAGE = 1 << 13;
  static BIT_ORDER_MSB_FIRST = 0;
  static BIT_ORDER_LSB_FIRST = 1;
  static BIT_ORDER_BUS = 2;
  static SIDE_N = 0;
  static SIDE_S = 1;
  static SIDE_W = 2;
  static SIDE_E = 3;
  static sideFlipXY = [
    ChipElm.SIDE_W,
    ChipElm.SIDE_E,
    ChipElm.SIDE_N,
    ChipElm.SIDE_S
  ];
  constructor(xa, ya, xb, yb, f, st) {
    if (xb === void 0) {
      super(xa, ya);
      if (this.needsBits())
        this.bits = this.defaultBitCount();
      this.highVoltage = 5;
      this.noDiagonal = true;
      this.setupPins();
      this.allocNodes();
      this.setSize(this.useSmallGrid() ? 1 : 2);
    } else {
      super(xa, ya, xb, yb, f);
      if (this.needsBits())
        this.bits = st.hasMoreTokens() ? parseIntStrict(st.nextToken()) : this.defaultBitCount();
      this.highVoltage = this.hasCustomVoltage() ? parseFloatStrict(st.nextToken()) : 5;
      this.noDiagonal = true;
      this.setupPins();
      this.allocNodes();
      this.setSize((f & ChipElm.FLAG_SMALL) !== 0 ? 1 : 2);
      for (let i = 0; i !== this.getPostCount(); i++) {
        if (this.pins[i].state) {
          const v = parseFloatStrict(st.nextToken());
          this.pins[i].value = v > this.getThreshold();
        }
      }
      this.justLoaded = true;
    }
  }
  needsBits() {
    return false;
  }
  hasCustomVoltage() {
    return (this.flags & ChipElm.FLAG_CUSTOM_VOLTAGE) !== 0;
  }
  useBus() {
    return this.bitOrder === ChipElm.BIT_ORDER_BUS;
  }
  isDigitalChip() {
    return true;
  }
  getThreshold() {
    return this.highVoltage / 2;
  }
  defaultBitCount() {
    return 4;
  }
  setSize(s) {
    this.csize = s;
    this.cspc = 8 * s;
    this.cspc2 = this.cspc * 2;
    this.flags &= -2;
    this.flags |= s === 1 ? ChipElm.FLAG_SMALL : 0;
  }
  draw(g) {
    this.drawChip(g);
  }
  drawChip(g) {
    g.save();
    const f = new Font("normal", 0, 10 * this.csize);
    let hasVertical = false;
    for (let i = 0; i !== this.getPostCount(); i++)
      if (this.pins[i].side === ChipElm.SIDE_N || this.pins[i].side === ChipElm.SIDE_S) {
        hasVertical = true;
        break;
      }
    for (let i = 0; i !== this.getPostCount(); i++) {
      g.setFont(f);
      const p = this.pins[i];
      if (p.busZ > 0)
        continue;
      this.setVoltageColor(g, this.nodes[i].v);
      const a = p.post;
      const b = p.stub;
      CircuitElm.drawThickLine(g, a, b, p.busWidth > 1 ? 5 : 3);
      p.curcount = this.updateDotCountImpl(p.current, p.curcount);
      this.drawDots(g, b, a, p.curcount);
      if (p.bubble) {
        g.setColor(CircuitElm.app.getBackgroundColor());
        CircuitElm.drawThickCircle(g, p.bubbleX, p.bubbleY, 1);
        g.setColor(CircuitElm.lightGrayColor);
        CircuitElm.drawThickCircle(g, p.bubbleX, p.bubbleY, 3);
      }
      if (p.clockPointsX !== null) {
        g.setColor(CircuitElm.lightGrayColor);
        g.drawPolyline(p.clockPointsX, p.clockPointsY, 3);
      }
      g.setColor(p.selected ? CircuitElm.selectColor : CircuitElm.whiteColor);
      let fsz = 10 * this.csize;
      let availSpace = this.cspc * 2 - 8;
      if (!hasVertical && this.sizeX > 2)
        availSpace = this.cspc * 2.5 + this.cspc * (this.sizeX - 3);
      const text = p.busWidth > 1 ? p.text + "/" + p.busWidth : p.text;
      while (true) {
        const sw = g.context.measureText(text).width;
        if (sw > availSpace) {
          fsz -= 1;
          g.setFont(new Font("normal", 0, fsz));
          continue;
        }
        const asc = g.currentFontSize;
        let tx;
        if (p.side === this.flippedXSide(ChipElm.SIDE_W))
          tx = p.textloc.x - (this.cspc - 5);
        else if (p.side === this.flippedXSide(ChipElm.SIDE_E))
          tx = p.textloc.x + (this.cspc - 5) - sw;
        else
          tx = p.textloc.x - sw / 2;
        g.drawString(text, tx, p.textloc.y + asc / 3);
        if (p.lineOver) {
          const ya = p.textloc.y - asc + asc / 3;
          g.drawLine(tx, ya, tx + sw, ya);
        }
        break;
      }
    }
    this.drawLabel(g, this.labelX, this.labelY);
    g.setColor(this.needsHighlight() ? CircuitElm.selectColor : CircuitElm.lightGrayColor);
    CircuitElm.drawThickPolygon(g, this.rectPointsX, this.rectPointsY, 4);
    this.drawPosts(g);
    g.restore();
  }
  drawLabel(g, x, y) {
  }
  drag(xx, yy) {
    yy = this.snapGrid(yy);
    if (xx < this.x) {
      xx = this.x;
      yy = this.y;
    } else {
      this.y = this.y2 = yy;
      this.x2 = Math.min(this.snapGrid(xx), this.x + (this.sizeX + 1) * this.cspc2);
    }
    this.setPoints();
  }
  setPoints() {
    if (this.x2 - this.x > this.sizeX * this.cspc2 && this.isCreating())
      this.setSize(2);
    const x0 = this.x + this.cspc2;
    const y0 = this.y;
    const xr = x0 - this.cspc;
    const yr = y0 - this.cspc;
    this.flippedSizeX = this.sizeX;
    this.flippedSizeY = this.sizeY;
    if (this.isFlippedXY()) {
      this.flippedSizeX = this.sizeY;
      this.flippedSizeY = this.sizeX;
    }
    const xs = this.flippedSizeX * this.cspc2;
    const ys = this.flippedSizeY * this.cspc2;
    for (let i = 0; i !== this.getPostCount(); i++) {
      const p = this.pins[i];
      p.side = p.side0;
      if ((this.flags & ChipElm.FLAG_FLIP_XY) !== 0)
        p.side = ChipElm.sideFlipXY[p.side];
      switch (p.side) {
        case ChipElm.SIDE_N:
          p.setPoint(x0, y0, 1, 0, 0, -1, 0, 0);
          break;
        case ChipElm.SIDE_S:
          p.setPoint(x0, y0, 1, 0, 0, 1, 0, ys - this.cspc2);
          break;
        case ChipElm.SIDE_W:
          p.setPoint(x0, y0, 0, 1, -1, 0, 0, 0);
          break;
        case ChipElm.SIDE_E:
          p.setPoint(x0, y0, 0, 1, 1, 0, xs - this.cspc2, 0);
          break;
      }
    }
    this.rectPointsX = [xr, xr + xs, xr + xs, xr];
    this.rectPointsY = [yr, yr, yr + ys, yr + ys];
    this.setBbox(xr, yr, this.rectPointsX[2], this.rectPointsY[2]);
    this.labelX = xr + xs / 2;
    this.labelY = yr + ys / 2;
  }
  initBoundingBox() {
    super.initBoundingBox();
    if (this.pins == null || this.cspc === 0)
      return;
    const xr = this.x + this.cspc2 - this.cspc;
    const yr = this.y - this.cspc;
    const fsx = this.isFlippedXY() ? this.sizeY : this.sizeX;
    const fsy = this.isFlippedXY() ? this.sizeX : this.sizeY;
    const xs = fsx * this.cspc2;
    const ys = fsy * this.cspc2;
    this.setBbox(xr, yr, xr + xs, yr + ys);
  }
  addRoutingObstacle(router) {
    router.addObstacle(this.rectPointsX[0], this.rectPointsY[0], this.rectPointsX[2], this.rectPointsY[2]);
  }
  getPinPos(xp, yp, currentSide, pos) {
    const x0 = this.x + this.cspc2;
    const y0 = this.y;
    const xr = x0 - this.cspc;
    const yr = y0 - this.cspc;
    const xd = (xp - xr) / this.cspc2 - 0.5;
    const yd = (yp - yr) / this.cspc2 - 0.5;
    if (xd >= 0 && xd <= this.sizeX && yd >= 0 && yd <= this.sizeY) {
      const dW = xd, dE = this.sizeX - xd, dN = yd, dS = this.sizeY - yd;
      const curDist = currentSide === ChipElm.SIDE_N ? dN : currentSide === ChipElm.SIDE_S ? dS : currentSide === ChipElm.SIDE_W ? dW : dE;
      const minDist2 = Math.min(Math.min(dW, dE), Math.min(dN, dS));
      let side;
      if (curDist <= minDist2 + 1) {
        side = currentSide;
      } else {
        side = minDist2 === dN ? ChipElm.SIDE_N : minDist2 === dS ? ChipElm.SIDE_S : minDist2 === dW ? ChipElm.SIDE_W : ChipElm.SIDE_E;
      }
      pos[0] = side === ChipElm.SIDE_N || side === ChipElm.SIDE_S ? Math.max(0, Math.min(Math.round(xd), this.sizeX - 1)) : Math.max(0, Math.min(Math.round(yd), this.sizeY - 1));
      pos[1] = side;
      return true;
    }
    const distW = xd < 0 ? -xd : Number.MAX_VALUE;
    const distE = xd > this.sizeX ? xd - this.sizeX : Number.MAX_VALUE;
    const distN = yd < 0 ? -yd : Number.MAX_VALUE;
    const distS = yd > this.sizeY ? yd - this.sizeY : Number.MAX_VALUE;
    const minDist = Math.min(Math.min(distW, distE), Math.min(distN, distS));
    if (minDist === distN) {
      pos[0] = Math.max(0, Math.min(Math.round(xd), this.sizeX - 1));
      pos[1] = ChipElm.SIDE_N;
    } else if (minDist === distS) {
      pos[0] = Math.max(0, Math.min(Math.round(xd), this.sizeX - 1));
      pos[1] = ChipElm.SIDE_S;
    } else if (minDist === distW) {
      pos[0] = Math.max(0, Math.min(Math.round(yd), this.sizeY - 1));
      pos[1] = ChipElm.SIDE_W;
    } else {
      pos[0] = Math.max(0, Math.min(Math.round(yd), this.sizeY - 1));
      pos[1] = ChipElm.SIDE_E;
    }
    return true;
  }
  getOverlappingPin(p1, p2, pin) {
    for (let i = 0; i !== this.getPostCount(); i++) {
      if (pin === i || this.pins[i].busZ > 0)
        continue;
      if (this.pins[i].overlaps(p1, p2))
        return i;
    }
    return -1;
  }
  getPost(n) {
    return this.pins[n].post;
  }
  getPostWidth(n) {
    return this.pins[n].busWidth;
  }
  setVoltageSource(j, vs) {
    for (let i = 0; i !== this.getPostCount(); i++) {
      const p = this.pins[i];
      if (p.output && j-- === 0) {
        p.voltSource = vs;
        vs.setNodes(CircuitNode.ground, this.nodes[i]);
        return;
      }
    }
    console.log("setVoltageSource failed for " + this);
  }
  setHighVoltage(hv) {
    this.highVoltage = hv;
  }
  stamp() {
    let vsc = 0;
    for (let i = 0; i !== this.getPostCount(); i++) {
      const p = this.pins[i];
      if (p.output) {
        CircuitElm.sim.stampVoltageSource(CircuitNode.ground, this.nodes[i], p.voltSource);
        vsc++;
      }
    }
    if (vsc !== this.getVoltageSourceCount())
      console.log("voltage source count does not match number of outputs");
  }
  execute() {
  }
  startIteration() {
    for (let i = 0; i !== this.getPostCount(); i++) {
      const p = this.pins[i];
      if (!p.output)
        p.value = this.nodes[i].v > this.getThreshold();
    }
    if (this.justLoaded)
      this.justLoaded = false;
    else
      this.execute();
  }
  doStep() {
    for (let i = 0; i !== this.getPostCount(); i++) {
      const p = this.pins[i];
      if (p.output)
        CircuitElm.sim.updateVoltageSource(
          CircuitNode.ground,
          this.nodes[i],
          p.voltSource,
          p.value ? this.highVoltage : 0
        );
    }
  }
  reset() {
    for (let i = 0; i !== this.getPostCount(); i++) {
      this.pins[i].value = false;
      this.pins[i].curcount = 0;
    }
    this.lastClock = false;
  }
  dump() {
    if (this.highVoltage === 5)
      this.flags &= -8193;
    else
      this.flags |= ChipElm.FLAG_CUSTOM_VOLTAGE;
    let s = super.dump();
    if (this.needsBits())
      s += " " + this.bits;
    if (this.hasCustomVoltage())
      s += " " + this.highVoltage;
    for (let i = 0; i !== this.getPostCount(); i++)
      if (this.pins[i].state)
        s += " " + this.nodes[i].v;
    return s;
  }
  dumpXml(doc, elem) {
    super.dumpXml(doc, elem);
    if (this.bits > 0)
      CircuitXMLSerializer.dumpAttr(elem, "bi", this.bits);
    if (this.highVoltage !== 5)
      CircuitXMLSerializer.dumpAttr(elem, "hv", this.highVoltage);
    if (this.bitOrder !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "bo", this.bitOrder);
  }
  dumpXmlState(doc, elem) {
    for (let i = 0; i !== this.getPostCount(); i++)
      if (this.pins[i].state && this.nodes[i].v > 0)
        CircuitXMLSerializer.dumpAttr(elem, "v" + i, this.nodes[i].v);
  }
  undumpXml(xml) {
    const stateRestore = xml.parseStringAttr("ix", null) != null;
    if (!stateRestore)
      this.flags = 0;
    super.undumpXml(xml);
    this.bits = xml.parseIntAttr("bi", this.bits);
    this.highVoltage = xml.parseDoubleAttr("hv", this.highVoltage);
    this.bitOrder = xml.parseIntAttr("bo", this.bitOrder);
    if (!stateRestore) {
      this.setupPins();
      this.allocNodes();
      this.setSize((this.flags & ChipElm.FLAG_SMALL) !== 0 ? 1 : 2);
    }
    for (let i = 0; i !== this.getPostCount(); i++) {
      const v = xml.parseDoubleAttr("v" + i, 0);
      if (this.pins != null)
        this.pins[i].value = v > this.getThreshold();
    }
    this.justLoaded = true;
  }
  writeOutput(n, value) {
    if (!this.pins[n].output)
      console.log("pin " + n + " is not an output!");
    this.pins[n].value = value;
  }
  getInfo(arr) {
    arr[0] = this.getChipName();
    let a = 1, shown = 0;
    for (let i = 0; i !== this.getPostCount(); i++) {
      const p = this.pins[i];
      if (arr[a] !== null && arr[a] !== void 0)
        arr[a] += "; ";
      else
        arr[a] = "";
      let t = p.text;
      if (p.lineOver) t += "'";
      if (p.clock) t = "Clk";
      if (p.busWidth > 1) {
        let value = 0;
        for (let j = 0; j < p.busWidth; j++)
          if (this.nodes[i + j].v > this.getThreshold())
            value |= 1 << this.pins[i + j].busZ;
        arr[a] += t + " = " + value + " / 0x" + value.toString(16).toUpperCase();
        i += p.busWidth - 1;
      } else
        arr[a] += t + " = " + CircuitElm.getVoltageText(this.nodes[i].v);
      if (++shown % 2 === 0)
        a++;
    }
  }
  setCurrent(vs, c) {
    for (let i = 0; i !== this.getPostCount(); i++)
      if (this.pins[i].output && this.pins[i].voltSource === vs)
        this.pins[i].current = c;
  }
  validate() {
    for (let i = 0; i !== this.getPostCount(); i++)
      if (this.pins[i].output && !this.validateRailNode(i))
        return false;
    return true;
  }
  getChipName() {
    return "chip";
  }
  getConnection(n1, n2) {
    return false;
  }
  hasGroundConnection(n1) {
    return this.pins[n1].output;
  }
  getCurrentIntoNode(n) {
    if (n < 0 || n >= this.pins.length)
      return 0;
    return this.pins[n].current;
  }
  isFlippedX() {
    return this.hasFlag(ChipElm.FLAG_FLIP_X);
  }
  isFlippedY() {
    return this.hasFlag(ChipElm.FLAG_FLIP_Y);
  }
  isFlippedXY() {
    return this.hasFlag(ChipElm.FLAG_FLIP_XY);
  }
  allowBus() {
    return false;
  }
  flippedXSide(s) {
    if (!this.isFlippedX()) return s;
    if (s === ChipElm.SIDE_W) return ChipElm.SIDE_E;
    if (s === ChipElm.SIDE_E) return ChipElm.SIDE_W;
    return s;
  }
  flipX(center2, count) {
    this.flags ^= ChipElm.FLAG_FLIP_X;
    if (count !== 1) {
      const xs = (this.flippedSizeX + 1) * this.cspc2;
      this.x = center2 - this.x - xs;
      this.x2 = center2 - this.x2;
    }
    this.setPoints();
  }
  flipY(center2, count) {
    this.flags ^= ChipElm.FLAG_FLIP_Y;
    if (count !== 1) {
      const ys = (this.flippedSizeY - 1) * this.cspc2;
      this.y = center2 - this.y - ys;
      this.y2 = center2 - this.y2;
    }
    this.setPoints();
  }
  flipXY(xmy, count) {
    this.flags ^= ChipElm.FLAG_FLIP_XY;
    if (this.isFlippedX() !== this.isFlippedY())
      this.flags ^= ChipElm.FLAG_FLIP_X | ChipElm.FLAG_FLIP_Y;
    if (count !== 1) {
      this.x += this.cspc2;
      super.flipXY(xmy, count);
      this.x -= this.cspc2;
    }
    this.setPoints();
  }
  getNumHandles() {
    return 0;
  }
  getEditInfo(n) {
    if (this.isDigitalChip()) {
      if (n === 0)
        return new EditInfo("High Logic Voltage", this.highVoltage).setUnitStep();
      n--;
    }
    if (this.allowBus()) {
      if (n === 0) {
        const ei = new EditInfo("Bit Order", 0, -1, -1);
        ei.choice = new Choice();
        ei.choice.add("MSB First");
        ei.choice.add("LSB First");
        ei.choice.add("Bus");
        ei.choice.select(this.bitOrder);
        return ei;
      }
      n--;
    }
    return this.getChipEditInfo(n);
  }
  setEditValue(n, ei) {
    if (this.isDigitalChip()) {
      if (n === 0) {
        this.highVoltage = ei.value;
        return;
      }
      n--;
    }
    if (this.allowBus()) {
      if (n === 0) {
        this.bitOrder = ei.choice.getSelectedIndex();
        this.setupPins();
        this.setPoints();
        return;
      }
      n--;
    }
    this.setChipEditValue(n, ei);
  }
  getChipEditInfo(n) {
    return null;
  }
  setChipEditValue(n, ei) {
  }
  makeBitPins(count, pos, side, offset, name, output, state, reversed) {
    for (let i = 0; i !== count; i++) {
      const ii = reversed ? offset + count - 1 - i : offset + i;
      if (this.useBus()) {
        this.pins[ii] = new Pin(this, pos, side, name);
        this.pins[ii].busWidth = count;
        this.pins[ii].busZ = i;
      } else if (this.bitOrder === ChipElm.BIT_ORDER_LSB_FIRST) {
        this.pins[ii] = new Pin(this, pos + i, side, name + i);
      } else {
        this.pins[ii] = new Pin(this, pos + (count - 1 - i), side, name + i);
      }
      this.pins[ii].output = output;
      this.pins[ii].state = state;
    }
  }
  static writeBits(data) {
    let sb = "";
    let integer = 0;
    let bitIndex = 0;
    for (let i = 0; i < data.length; i++) {
      if (bitIndex >= 32) {
        sb += " " + integer;
        integer = 0;
        bitIndex = 0;
      }
      if (data[i])
        integer |= 1 << bitIndex;
      bitIndex++;
    }
    if (bitIndex > 0)
      sb += " " + integer;
    return sb;
  }
  static readBits(st, output) {
    let integer = 0;
    let bitIndex = 32;
    for (let i = 0; i < output.length; i++) {
      if (bitIndex >= 32) {
        if (st.hasMoreTokens()) {
          integer = parseIntStrict(st.nextToken());
          bitIndex = 0;
        } else
          break;
      }
      output[i] = (integer & 1 << bitIndex) !== 0;
      bitIndex++;
    }
  }
  static writeBitsToString(data) {
    let sb = "";
    let integer = 0;
    let bitIndex = 0;
    for (let i = 0; i < data.length; i++) {
      if (bitIndex >= 32) {
        if (sb.length > 0) sb += " ";
        sb += integer;
        integer = 0;
        bitIndex = 0;
      }
      if (data[i])
        integer |= 1 << bitIndex;
      bitIndex++;
    }
    if (sb.length > 0) sb += " ";
    sb += integer;
    return sb;
  }
  static readBitsFromString(s, output) {
    const st = new StringTokenizer(s, " ");
    let integer = 0;
    let bitIndex = 32;
    for (let i = 0; i < output.length; i++) {
      if (bitIndex >= 32) {
        if (st.hasMoreTokens()) {
          integer = parseIntStrict(st.nextToken());
          bitIndex = 0;
        } else
          break;
      }
      output[i] = (integer & 1 << bitIndex) !== 0;
      bitIndex++;
    }
  }
}

class SubcircuitChipElm extends ChipElm {
  label = null;
  constructor(xx, yy) {
    super(xx, yy);
    this.setSize(2);
  }
  needsBits() {
    return false;
  }
  setupPins() {
  }
  getVoltageSourceCount() {
    return 0;
  }
  setPins(p) {
    this.pins = p;
  }
  allocPins(n) {
    this.pins = new Array(n);
  }
  setPin(n, p, s, t) {
    this.pins[n] = new Pin(this, p, s, t);
    this.pins[n].fixName();
  }
  setLabel(text) {
    this.label = text;
  }
  drawLabel(g, x, y) {
    if (this.label === null) return;
    g.save();
    g.context.textBaseline = "middle";
    g.context.textAlign = "center";
    g.drawString(this.label, x, y);
    g.restore();
  }
  getPostCount() {
    return this.pins == null ? 1 : this.pins.length;
  }
}

class CompositeElm extends CircuitElm {
  // need to use escape() instead of converting spaces to _'s so composite elements can be nested
  static FLAG_ESCAPE = 1;
  // list of elements contained in this subcircuit
  compElmList = [];
  // list of nodes, mapping each one to a list of elements that reference that node
  compNodeList = null;
  numPosts = 0;
  numNodes = 0;
  posts = [];
  // node info strings for each element (space-separated node numbers), stored for deferred node list building
  compNodeInfo = [];
  // per child, the node numbers its expression refers to by name (the "rn" attribute).
  // empty for the old text format, which predates expression references.
  compRefNodeInfo = [];
  // external node IDs, stored for deferred node list building
  extNodeIds = [];
  constructor(xx, yy, xb, yb, f) {
    if (xb === void 0)
      super(xx, yy);
    else
      super(xx, yy, xb, yb, f);
  }
  getChildElmList() {
    return this.compElmList;
  }
  useEscape() {
    return (this.flags & CompositeElm.FLAG_ESCAPE) !== 0;
  }
  loadComposite(stIn, model, externalNodes) {
    this.compElmList = [];
    const nodeInfoList = [];
    const lines = model.split("\r");
    for (const line of lines) {
      const sp = line.indexOf(" ");
      if (sp < 0) continue;
      const ceType = line.substring(0, sp);
      const nodeStr = line.substring(sp + 1);
      let newce = CirSim.constructElement(ceType, 0, 0);
      if (stIn != null) {
        const tint = newce.getDumpType();
        let dumpedCe = stIn.nextToken();
        if (this.useEscape())
          dumpedCe = CustomLogicModel.unescape(dumpedCe);
        const stCe = new StringTokenizer(dumpedCe, this.useEscape() ? " " : "_");
        const flags = parseIntStrict(stCe.nextToken());
        newce = CirSim.createCe(tint, 0, 0, 0, 0, flags, stCe);
      }
      if (newce == null) {
        CirSim.console("failed to create " + ceType + " in CompositeElm");
        continue;
      }
      if (newce.isGroundElm())
        newce.setOldStyle();
      newce.parent = this;
      this.compElmList.push(newce);
      nodeInfoList.push(nodeStr);
    }
    this.compNodeInfo = nodeInfoList;
    this.compRefNodeInfo = [];
    this.extNodeIds = externalNodes;
    this.numPosts = this.numNodes = externalNodes.length;
    this.posts = new Array(this.numPosts);
    this.allocNodes();
    this.flags |= CompositeElm.FLAG_ESCAPE;
  }
  loadCompositeXml(elmEntries, externalNodes) {
    const xml = new CircuitXMLDeserializer(CirSim.theApp);
    this.compElmList = [];
    const nodeInfoList = [];
    const refNodeInfoList = [];
    for (const childElem of elmEntries) {
      const tagName = childElem.tagName;
      if (tagName === "ccm") {
        xml.parseChildElement(childElem);
        SubcircuitModel.undumpEmbeddedModelXml(xml);
        continue;
      }
      const className = CirSim.xmlDumpTypeMap.get(tagName);
      if (className == null)
        continue;
      if (className === "WireElm" || className === "RoutedWireElm" || className === "LabeledNodeElm" || className === "ScopeElm" || className === "GraphicElm" || className === "GroundElm" && childElem.getAttribute("x") != null)
        continue;
      const newce = CirSim.constructElement(className, 0, 0);
      if (newce.isGroundElm())
        newce.setOldStyle();
      xml.parseChildElement(childElem);
      newce.undumpXml(xml);
      newce.parent = this;
      this.compElmList.push(newce);
      const nn = childElem.getAttribute("nn");
      nodeInfoList.push(nn != null ? nn : "");
      const rn = childElem.getAttribute("rn");
      refNodeInfoList.push(rn != null ? rn : "");
    }
    this.compNodeInfo = nodeInfoList;
    this.compRefNodeInfo = refNodeInfoList;
    this.extNodeIds = externalNodes;
    this.numPosts = this.numNodes = externalNodes.length;
    this.posts = new Array(this.numPosts);
    this.flags |= CompositeElm.FLAG_ESCAPE;
  }
  // build compNodeList from stored node info.  called from preStamp() so that sub-elements
  // have their final state (after undumpXml) when we query their internal node counts.
  buildCompNodeList() {
    const compNodeHash = /* @__PURE__ */ new Map();
    this.compNodeList = [];
    for (let i = 0; i !== this.compElmList.length; i++) {
      const ce = this.compElmList[i];
      const stNodes = new StringTokenizer(this.compNodeInfo[i], " +	");
      let thisPost = 0;
      while (stNodes.hasMoreTokens()) {
        const nodeOfThisPost = parseIntStrict(stNodes.nextToken());
        if (nodeOfThisPost === 0) {
          ce.setNode(thisPost, CircuitNode.ground);
          thisPost++;
          continue;
        }
        const cnLink = new CircuitNodeLink();
        cnLink.num = thisPost;
        cnLink.elm = ce;
        if (!compNodeHash.has(nodeOfThisPost)) {
          const cn = new CircuitNode();
          cn.links.push(cnLink);
          compNodeHash.set(nodeOfThisPost, cn);
        } else {
          compNodeHash.get(nodeOfThisPost).links.push(cnLink);
        }
        thisPost++;
      }
      const refInfo = this.compRefNodeInfo[i];
      if (refInfo == null || refInfo.length === 0)
        continue;
      const stRefs = new StringTokenizer(refInfo, " +	");
      let thisRef = ce.getRefNodeBase();
      while (stRefs.hasMoreTokens()) {
        const nodeOfThisRef = parseIntStrict(stRefs.nextToken());
        if (nodeOfThisRef === 0) {
          ce.setNode(thisRef, CircuitNode.ground);
          thisRef++;
          continue;
        }
        const cnLink = new CircuitNodeLink();
        cnLink.num = thisRef;
        cnLink.elm = ce;
        if (!compNodeHash.has(nodeOfThisRef)) {
          const cn = new CircuitNode();
          cn.links.push(cnLink);
          compNodeHash.set(nodeOfThisRef, cn);
        } else {
          compNodeHash.get(nodeOfThisRef).links.push(cnLink);
        }
        thisRef++;
      }
    }
    try {
      for (let i = 0; i < this.extNodeIds.length; i++) {
        const id = this.extNodeIds[i];
        if (compNodeHash.has(id)) {
          this.compNodeList.push(compNodeHash.get(id));
          compNodeHash.delete(id);
        } else
          throw new Error("missing external node");
      }
    } catch (e) {
      this.compNodeList = null;
      return;
    }
    for (const [, cn] of compNodeHash)
      this.compNodeList.push(cn);
    for (let i = 0; i !== this.compElmList.length; i++) {
      const ce = this.compElmList[i];
      const inodes = ce.getInternalNodeCount();
      for (let j = 0; j !== inodes; j++) {
        const cnLink = new CircuitNodeLink();
        cnLink.num = j + ce.getPostCount();
        cnLink.elm = ce;
        const cn = new CircuitNode();
        cn.links.push(cnLink);
        this.compNodeList.push(cn);
      }
    }
    this.numNodes = this.compNodeList.length;
  }
  preStamp() {
    for (const ce of this.compElmList)
      ce.preStamp();
    this.buildCompNodeList();
    this.allocNodes();
  }
  dump() {
    return super.dump() + this.dumpElements();
  }
  dumpElements(mask) {
    let dumpStr = "";
    for (let i = 0; i < this.compElmList.length; i++) {
      if (mask !== void 0 && (mask & 1 << i) === 0)
        continue;
      let tstring = this.compElmList[i].dump();
      tstring = tstring.replace(/[A-Za-z0-9]+ 0 0 0 0 /, "");
      dumpStr += " " + CustomLogicModel.escape(tstring);
    }
    return dumpStr;
  }
  dumpWithMask(mask) {
    return super.dump() + this.dumpElements(mask);
  }
  dumpXmlState(doc, elem) {
    for (let i = 0; i !== this.compElmList.length; i++) {
      const ce = this.compElmList[i];
      const child = doc.createElement(ce.getXmlDumpType());
      ce.dumpXmlState(doc, child);
      if (child.attributes.length === 0 && !child.hasChildNodes())
        continue;
      child.setAttribute("ix", i);
      elem.appendChild(child);
    }
  }
  undumpXml(xml) {
    super.undumpXml(xml);
    const state = xml.currentXmlElement;
    for (const elem of xml.getChildElements()) {
      xml.parseChildElement(elem);
      const ix = xml.parseIntAttr("ix", -1);
      if (ix < 0 || ix >= this.compElmList.length) {
        CirSim.console("ix " + ix + " out of range");
        continue;
      }
      const ce = this.compElmList[ix];
      if (elem.tagName !== ce.getXmlDumpType())
        throw new Error("dump type mismatch for composite child: " + ix);
      ce.undumpXml(xml);
    }
    xml.parseChildElement(state);
  }
  getConnection(n1, n2) {
    return false;
  }
  hasGroundConnection(n1) {
    return false;
  }
  reset() {
    for (const ce of this.compElmList)
      ce.reset();
  }
  getPostCount() {
    return this.numPosts;
  }
  getInternalNodeCount() {
    return this.numNodes - this.numPosts;
  }
  getPost(n) {
    return this.posts[n];
  }
  setPost(n, pOrX, y) {
    if (typeof pOrX === "number")
      this.posts[n] = new Point(pOrX, y);
    else
      this.posts[n] = pOrX;
  }
  getPower() {
    let power = 0;
    for (const ce of this.compElmList)
      power += ce.getPower();
    return power;
  }
  stamp() {
    for (const ce of this.compElmList)
      ce.setParentList(this.compElmList);
  }
  // called to set node p (local to this element) to equal n (global)
  setNode(p, n) {
    super.setNode(p, n);
    if (this.compNodeList == null)
      return;
    const cnLinks = this.compNodeList[p].links;
    for (let i = 0; i < cnLinks.length; i++)
      cnLinks[i].elm.setNode(cnLinks[i].num, n);
  }
  canViewInScope() {
    return false;
  }
  delete() {
    if (this.compElmList != null)
      for (const ce of this.compElmList)
        ce.delete();
    super.delete();
  }
  getCurrentIntoNode(n) {
    let c = 0;
    if (this.compNodeList == null)
      return 0;
    const cnLinks = this.compNodeList[n].links;
    for (let i = 0; i < cnLinks.length; i++)
      c += cnLinks[i].elm.getCurrentIntoNode(cnLinks[i].num);
    return c;
  }
}

class SubcircuitElm extends CompositeElm {
  modelName;
  chip = null;
  postCount = 0;
  inputCount = 0;
  outputCount = 0;
  model = null;
  highVoltage = 0;
  static lastModelName = "default";
  static FLAG_SMALL = 2;
  constructor(xxOrXa, yyOrYa, nameOrXb, yb, f, st) {
    if (typeof nameOrXb === "number") {
      super(xxOrXa, yyOrYa, nameOrXb, yb, f);
      this.modelName = CustomLogicModel.unescape(st.nextToken());
      this.updateModels(st);
    } else {
      super(xxOrXa, yyOrYa);
      if (typeof nameOrXb === "string") {
        this.modelName = nameOrXb;
      } else {
        this.modelName = xxOrXa === 0 && yyOrYa === 0 ? "default" : SubcircuitElm.lastModelName;
      }
      this.flags |= CompositeElm.FLAG_ESCAPE;
      if (this.useSmallGrid()) this.flags |= SubcircuitElm.FLAG_SMALL;
      this.updateModels();
    }
  }
  dumpXmlModel(doc) {
    if (this.compElmList) {
      for (const ce of this.compElmList) ce.dumpXmlModel(doc);
    }
    if (this.model != null && !(this.model.builtin || this.model.dumped))
      this.model.dumpXml(doc);
  }
  dumpXml(doc, elem) {
    this.dumpXmlModel(doc);
    super.dumpXml(doc, elem);
    CircuitXMLSerializer.dumpAttr(elem, "mo", this.modelName);
    if (this.highVoltage !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "hv", this.highVoltage);
  }
  undumpXml(xml) {
    this.modelName = xml.parseStringAttr("mo", this.modelName);
    this.highVoltage = xml.parseDoubleAttr("hv", 0);
    this.updateModels();
    super.undumpXml(xml);
  }
  draw(g) {
    for (let i = 0; i < this.postCount; i++) {
      this.chip.nodes[i] = this.nodes[i];
      this.chip.pins[i].current = this.getCurrentIntoNode(i);
    }
    this.chip.setSelected(this.needsHighlight());
    this.chip.draw(g);
  }
  addRoutingObstacle(router) {
    this.chip.addRoutingObstacle(router);
  }
  setPoints() {
    this.chip = new SubcircuitChipElm(this.x, this.y);
    this.chip.x2 = this.x2;
    this.chip.y2 = this.y2;
    this.chip.flags = this.flags & (ChipElm.FLAG_FLIP_X | ChipElm.FLAG_FLIP_Y | ChipElm.FLAG_FLIP_XY);
    if (this.model == null) {
      this.chip.setSize((this.flags & SubcircuitElm.FLAG_SMALL) !== 0 ? 1 : 2);
      this.chip.setLabel("?");
      this.chip.sizeX = this.chip.sizeY = 2;
      this.chip.allocPins(0);
      this.chip.setPoints();
      this.boundingBox = this.chip.boundingBox;
      return;
    }
    if (this.x2 - this.x > this.model.sizeX * 16 && this.isCreating())
      this.flags &= ~SubcircuitElm.FLAG_SMALL;
    this.chip.setSize((this.flags & SubcircuitElm.FLAG_SMALL) !== 0 ? 1 : 2);
    this.chip.setLabel((this.model.flags & SubcircuitModel.FLAG_SHOW_LABEL) !== 0 ? this.model.name : null);
    this.chip.sizeX = this.model.sizeX;
    this.chip.sizeY = this.model.sizeY;
    this.chip.allocPins(this.postCount);
    for (let i = 0; i < this.postCount; i++) {
      const pin = this.model.extList[i];
      this.chip.setPin(i, pin.pos, pin.side, pin.name);
      this.chip.pins[i].busWidth = pin.busWidth;
      this.chip.pins[i].busZ = pin.busZ;
    }
    this.chip.setPoints();
    this.boundingBox = this.chip.boundingBox;
    for (let i = 0; i < this.getPostCount(); i++)
      this.setPost(i, this.chip.getPost(i));
  }
  updateModels(st) {
    if (st !== void 0) {
      this._updateModels(st);
    } else {
      this.model = null;
      this._updateModels(null);
    }
  }
  _updateModels(st) {
    if (this.model !== null && this.model.name === this.modelName) return;
    this.model = SubcircuitModel.getModelWithName(this.modelName);
    if (!this.model) {
      this.postCount = 0;
      this.compElmList = [];
      this.numPosts = this.numNodes = 0;
      this.posts = [];
      this.allocNodes();
      this.setPoints();
      return;
    }
    this.postCount = this.model.extList.length;
    const externalNodes = new Array(this.postCount);
    for (let i = 0; i < this.postCount; i++)
      externalNodes[i] = this.model.extList[i].node;
    if (st !== null) {
      this.loadComposite(st, this.model.getNodeList(), externalNodes);
    } else {
      this.loadCompositeXml(this.model.getElmEntries(), externalNodes);
    }
    this.propagateHighVoltage();
    this.allocNodes();
    this.setPoints();
  }
  propagateHighVoltage() {
    if (this.highVoltage === 0) return;
    for (const ce of this.compElmList) {
      ce.setHighVoltage(this.highVoltage);
      if (ce instanceof SubcircuitElm)
        ce.propagateHighVoltage();
    }
  }
  setHighVoltage(hv) {
    this.highVoltage = hv;
  }
  getPostCount() {
    return this.postCount;
  }
  getPostWidth(n) {
    return this.chip ? this.chip.getPostWidth(n) : 1;
  }
  flipX(center2, count) {
    this.flags ^= ChipElm.FLAG_FLIP_X;
    if (count !== 1) {
      const xs = (this.chip.flippedSizeX + 1) * this.chip.cspc2;
      this.x = center2 - this.x - xs;
      this.x2 = center2 - this.x2;
    }
    this.setPoints();
  }
  flipY(center2, count) {
    this.flags ^= ChipElm.FLAG_FLIP_Y;
    if (count !== 1) {
      const xs = (this.chip.flippedSizeY - 1) * this.chip.cspc2;
      this.y = center2 - this.y - xs;
      this.y2 = center2 - this.y2;
    }
    this.setPoints();
  }
  isFlippedX() {
    return (this.flags & ChipElm.FLAG_FLIP_X) !== 0;
  }
  isFlippedY() {
    return (this.flags & ChipElm.FLAG_FLIP_Y) !== 0;
  }
  flipXY(xmy, count) {
    this.flags ^= ChipElm.FLAG_FLIP_XY;
    if (this.isFlippedX() !== this.isFlippedY())
      this.flags ^= ChipElm.FLAG_FLIP_X | ChipElm.FLAG_FLIP_Y;
    if (count !== 1) {
      this.x += this.chip.cspc2;
      super.flipXY(xmy, count);
      this.x -= this.chip.cspc2;
    }
    this.setPoints();
  }
  // build a display list with all elements including ones skipped by loadCompositeXml
  buildDisplayElmList() {
    const allElms = [...this.compElmList];
    const elmEntries = this.model.getElmEntries();
    const xml = new CircuitXMLDeserializer(CircuitElm.app);
    let compIdx = 0;
    for (const childElem of elmEntries) {
      const tagName = childElem.tagName;
      const className = CirSim.xmlDumpTypeMap.get(tagName);
      if (!className) continue;
      let ce;
      if (className === "WireElm" || className === "RoutedWireElm" || className === "LabeledNodeElm" || className === "ScopeElm" || className === "GraphicElm" || className === "GroundElm" && childElem.getAttribute("x") !== null) {
        ce = CirSim.constructElement(className, 0, 0);
        xml.parseChildElement(childElem);
        ce.undumpXml(xml);
        allElms.push(ce);
      } else {
        ce = this.compElmList[compIdx++];
      }
      ce.setPositionFromXml(childElem);
    }
    return allElms;
  }
  canViewComponents() {
    if (this.model == null)
      return false;
    const elmEntries = this.model.getElmEntries();
    for (const childElem of elmEntries) {
      if (childElem.getAttribute("x") !== null) return true;
    }
    return false;
  }
  isSubcircuitElm() {
    return true;
  }
  onDoubleClick() {
    if (this.canViewComponents()) {
      CirSim.editDialog?.closeDialog();
      CircuitElm.app.ui.pushSubcircuit(this, this.buildDisplayElmList());
    } else if (!CircuitElm.app.ui.isReadOnly())
      CircuitElm.app.commands.doEdit(this);
  }
  // don't bring up the properties when placing a subcircuit
  showPropertiesOnCreate() {
    return false;
  }
  getDumpType() {
    return 410;
  }
  getXmlDumpType() {
    return "cc";
  }
  getElmType() {
    return "subcircuit";
  }
  getInfo(arr) {
    super.getInfo(arr);
    if (this.model == null) {
      arr[0] = Locale.LS("subcircuit") + " (" + Locale.LS("missing: ") + this.modelName + ")";
      return;
    }
    if (this.model.builtin && this.model.name.startsWith("~"))
      arr[0] = this.model.name.substring(1);
    else
      arr[0] = "subcircuit (" + this.model.name + ")";
    let a = 1;
    for (let i = 0; i < this.postCount; i++) {
      if (a >= arr.length) break;
      const ent = this.model.extList[i];
      if (ent.busZ > 0) continue;
      if (ent.busWidth > 1) {
        let value = 0;
        for (let j = 0; j < ent.busWidth; j++)
          if (this.nodes[i + j].v > this.chip.getThreshold())
            value |= 1 << j;
        arr[a] = ent.name + " = " + value + " / 0x" + value.toString(16).toUpperCase();
      } else {
        arr[a] = ent.name + " = " + CircuitElm.getVoltageText(this.nodes[i].v);
      }
      a++;
    }
  }
  models = [];
  getEditInfo(n) {
    if (this.model != null && this.model.internal) n += 2;
    if (n === 0) {
      const label = this.model == null ? Locale.LS("Model not found: ") + this.modelName : EditInfo.makeLink("subcircuits.html", "Model Name");
      const ei = new EditInfo(label, 0, -1, -1);
      this.models = SubcircuitModel.getModelList();
      ei.choice = new Choice();
      for (let i = 0; i < this.models.length; i++) {
        const ccm = this.models[i];
        ei.choice.add(ccm.name);
        if (ccm === this.model) ei.choice.select(i);
      }
      return ei;
    }
    if (this.model == null)
      return null;
    if (n === 1) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Edit Pin Layout") };
      return ei;
    }
    if (n === 2 && this.canViewComponents()) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("View Components") };
      return ei;
    }
    const hvIdx = this.canViewComponents() ? 3 : 2;
    if (n === hvIdx)
      return new EditInfo("High Logic Voltage (0=default)", this.highVoltage, 0, 10).setUnitStep();
    if (n === hvIdx + 1 && this.model.canLoadModelCircuit()) {
      const ei = new EditInfo("", 0, -1, -1);
      ei.button = { label: Locale.LS("Edit Model") };
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (this.model != null && this.model.internal) n += 2;
    if (n === 0) {
      this.model = this.models[ei.choice.getSelectedIndex()];
      SubcircuitElm.lastModelName = this.modelName = this.model.name;
      this.updateModels();
      this.setPoints();
      return;
    }
    if (this.model == null)
      return;
    if (n === 1) {
      if (this.model.name === "default") {
        window.alert(Locale.LS("Can't edit this model."));
        return;
      }
      const dlg = new EditSubcircuitModelDialog();
      dlg.setModel(this.model);
      dlg.createDialog();
      CirSim.dialogShowing = dlg;
      dlg.show();
      return;
    }
    if (n === 2) {
      CircuitElm.app.ui.pushSubcircuit(this, this.buildDisplayElmList());
      CirSim.editDialog.closeDialog();
    }
    const hvIdx = this.canViewComponents() ? 3 : 2;
    if (n === hvIdx) {
      this.highVoltage = ei.value;
      this.propagateHighVoltage();
    }
    if (n === hvIdx + 1) {
      CircuitElm.app.pushContext(this.model.name);
      if (this.model.modelCircuit !== null)
        CircuitElm.app.readCircuit(this.model.modelCircuit);
      else if (this.model.elmDoc) {
        const xmlDes = new CircuitXMLDeserializer(CircuitElm.app);
        xmlDes.readCircuitFromDoc(this.model.elmDoc);
      }
      CirSim.editDialog.closeDialog();
    }
  }
  getNumHandles() {
    return 0;
  }
}
HookRegistry.createSubcircuitElm = (x, y, name) => new SubcircuitElm(x, y, name);

class EditSubcircuitModelDialog extends Dialog {
  model = null;
  chip = null;
  postCount = 0;
  context = null;
  scale = 1;
  popContext = false;
  modelNameInput = null;
  scopeSelect = null;
  labelCheck = null;
  canvas = null;
  dragging = false;
  rubberBand = false;
  rubberBandX1 = 0;
  rubberBandY1 = 0;
  rubberBandX2 = 0;
  rubberBandY2 = 0;
  selectedPins = /* @__PURE__ */ new Set();
  dragStartPosArr = [];
  dragStartSideArr = [];
  dragStartPos = 0;
  dragStartSide = 0;
  dragCurrentSide = 0;
  selectedPin = -1;
  static SCOPE_THIS_CIRCUIT = 0;
  static SCOPE_THIS_SESSION = 1;
  static SCOPE_SAVE_ACROSS_SESSIONS = 2;
  constructor() {
    super();
    this.closeOnEnter = true;
  }
  setModel(m) {
    this.model = m;
  }
  createModel() {
    const nodeSet = /* @__PURE__ */ new Set();
    this.model = SimulationManager.theSim.getCircuitAsComposite();
    if (!this.model) return false;
    if (this.model.extList.length === 0) {
      window.alert(Locale.LS("Device has no external inputs/outputs!"));
      this.model.remove();
      return false;
    }
    this.model.extList.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    const postCount = this.model.extList.length;
    const sideCounts = [0, 0, 0, 0];
    for (let i = 0; i < postCount; i++) {
      const pin = this.model.extList[i];
      if (pin.busZ === 0) sideCounts[pin.side]++;
      if (nodeSet.has(pin.node)) {
        window.alert(Locale.LS("Can't have two input/output nodes connected!"));
        return false;
      }
      nodeSet.add(pin.node);
    }
    const xOffsetLeft = sideCounts[ChipElm.SIDE_W] > 0 ? 1 : 0;
    const xOffsetRight = sideCounts[ChipElm.SIDE_E] > 0 ? 1 : 0;
    for (let i = 0; i < postCount; i++) {
      const pin = this.model.extList[i];
      if (pin.side === ChipElm.SIDE_N || pin.side === ChipElm.SIDE_S)
        pin.pos += xOffsetLeft;
    }
    const minHeight = sideCounts[ChipElm.SIDE_N] > 0 && sideCounts[ChipElm.SIDE_S] > 0 ? 2 : 1;
    const pinsNS = Math.max(sideCounts[ChipElm.SIDE_N], sideCounts[ChipElm.SIDE_S]);
    const pinsWE = Math.max(sideCounts[ChipElm.SIDE_W], sideCounts[ChipElm.SIDE_E]);
    this.model.sizeX = Math.max(2, pinsNS + xOffsetLeft + xOffsetRight);
    this.model.sizeY = Math.max(minHeight, pinsWE);
    return true;
  }
  createDialog() {
    this.dialogEl.innerHTML = "";
    const title = document.createElement("div");
    title.textContent = Locale.LS("Edit Subcircuit Pin Layout");
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    this.dialogEl.appendChild(title);
    this.dialogEl.appendChild(
      Object.assign(document.createElement("div"), { textContent: Locale.LS("Drag the pins to the desired position") })
    );
    this.canvas = document.createElement("canvas");
    this.canvas.width = 400;
    this.canvas.height = 400;
    this.canvas.style.width = "400px";
    this.canvas.style.height = "400px";
    this.canvas.style.display = "block";
    this.dialogEl.appendChild(this.canvas);
    this.context = this.canvas.getContext("2d");
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.canvas.addEventListener("mouseup", (e) => this.onMouseUp(e));
    this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.canvas.addEventListener("mouseout", () => {
    });
    this.canvas.addEventListener("mouseover", () => {
    });
    this.chip = new SubcircuitChipElm(50, 50);
    this.chip.x2 = 200;
    this.chip.y2 = 50;
    this.selectedPin = -1;
    this.createPinsFromModel();
    if (this.model.name === null || this.model.name === "") {
      this.dialogEl.appendChild(Object.assign(document.createElement("label"), { textContent: Locale.LS("Model Name") }));
      this.modelNameInput = document.createElement("input");
      this.modelNameInput.type = "text";
      this.modelNameInput.style.display = "block";
      this.modelNameInput.addEventListener("input", () => this.drawChip());
      this.dialogEl.appendChild(this.modelNameInput);
    }
    const hp = document.createElement("div");
    hp.style.display = "flex";
    hp.style.alignItems = "center";
    hp.style.gap = "4px";
    hp.style.margin = "8px 0";
    const addBtn = (label, dx, dy) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.addEventListener("click", () => this.adjustChipSize(dx, dy));
      hp.appendChild(b);
    };
    hp.appendChild(Object.assign(document.createElement("span"), { textContent: Locale.LS("Width") + " " }));
    addBtn("+", 1, 0);
    addBtn("-", -1, 0);
    hp.appendChild(Object.assign(document.createElement("span"), { textContent: "  " + Locale.LS("Height") + " " }));
    addBtn("+", 0, 1);
    addBtn("-", 0, -1);
    this.dialogEl.appendChild(hp);
    const labelLabel = document.createElement("label");
    this.labelCheck = document.createElement("input");
    this.labelCheck.type = "checkbox";
    this.labelCheck.checked = this.model.showLabel();
    this.labelCheck.addEventListener("change", () => {
      this.model.setShowLabel(this.labelCheck.checked);
      this.drawChip();
    });
    labelLabel.appendChild(this.labelCheck);
    labelLabel.appendChild(document.createTextNode(" " + Locale.LS("Show Label")));
    this.dialogEl.appendChild(labelLabel);
    const scopeRow = document.createElement("div");
    scopeRow.style.margin = "8px 0";
    scopeRow.appendChild(Object.assign(document.createElement("span"), { textContent: Locale.LS("Scope:") + " " }));
    this.scopeSelect = document.createElement("select");
    const scopes = [Locale.LS("This Circuit"), Locale.LS("This Session"), Locale.LS("Save Across Sessions")];
    scopes.forEach((s) => this.scopeSelect.appendChild(Object.assign(document.createElement("option"), { textContent: s })));
    if (this.model.isSaved())
      this.scopeSelect.value = scopes[EditSubcircuitModelDialog.SCOPE_SAVE_ACROSS_SESSIONS];
    else if (this.model.name && SubcircuitModel.globalModelMap.has(this.model.name))
      this.scopeSelect.selectedIndex = EditSubcircuitModelDialog.SCOPE_THIS_SESSION;
    else
      this.scopeSelect.selectedIndex = EditSubcircuitModelDialog.SCOPE_THIS_CIRCUIT;
    scopeRow.appendChild(this.scopeSelect);
    this.dialogEl.appendChild(scopeRow);
    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.gap = "8px";
    btnRow.style.marginTop = "8px";
    const okBtn = document.createElement("button");
    okBtn.textContent = Locale.LS("OK");
    okBtn.addEventListener("click", () => this.enterPressed());
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = Locale.LS("Cancel");
    cancelBtn.addEventListener("click", () => this.closeDialog());
    btnRow.appendChild(okBtn);
    btnRow.appendChild(cancelBtn);
    this.dialogEl.appendChild(btnRow);
    this.show();
  }
  createPinsFromModel() {
    this.postCount = this.model.extList.length;
    this.chip.allocPins(this.postCount);
    this.chip.sizeX = this.model.sizeX;
    this.chip.sizeY = this.model.sizeY;
    this.chip.allocNodes();
    for (let i = 0; i < this.postCount; i++) {
      const pin = this.model.extList[i];
      this.chip.setPin(i, pin.pos, pin.side, pin.name);
      this.chip.pins[i].busWidth = pin.busWidth;
      this.chip.pins[i].busZ = pin.busZ;
      if (this.selectedPins.has(i)) this.chip.pins[i].selected = true;
    }
    this.chip.setPoints();
  }
  enterPressed() {
    if (this.modelNameInput) {
      const name = this.modelNameInput.value;
      if (name.length === 0) {
        window.alert(Locale.LS("Please enter a model name."));
        return;
      }
      SubcircuitElm.lastModelName = name;
      this.model.setName(name);
    }
    const scope = this.scopeSelect.selectedIndex;
    SubcircuitModel.localModelMap.delete(this.model.name);
    SubcircuitModel.globalModelMap.delete(this.model.name);
    this.model.setSaved(false);
    if (scope === EditSubcircuitModelDialog.SCOPE_THIS_CIRCUIT) {
      SubcircuitModel.localModelMap.set(this.model.name, this.model);
    } else if (scope === EditSubcircuitModelDialog.SCOPE_THIS_SESSION) {
      SubcircuitModel.globalModelMap.set(this.model.name, this.model);
    } else {
      this.model.setSaved(true);
    }
    CirSim.theApp.updateModels();
    CirSim.theApp.needAnalyze();
    if (!this.popContext && CirSim.theApp.contextStack.length > 0) {
      CirSim.theApp.contextStack[CirSim.theApp.contextStack.length - 1].changedModels.push(this.model);
    }
    if (this.popContext) {
      const app = CirSim.theApp;
      const savedModel = this.model;
      const changedModels = app.popContextAndGetChangedModels();
      changedModels.push(savedModel);
      for (const m of changedModels) {
        SubcircuitModel.replaceModel(m);
        app.refreshModels(m.name);
      }
      if (app.contextStack.length > 0)
        app.contextStack[app.contextStack.length - 1].changedModels.push(...changedModels);
    }
    this.closeDialog();
  }
  closeDialog() {
    if (this.model && this.model.name === "")
      this.model.remove();
    super.closeDialog();
  }
  show() {
    super.show();
    this.drawChip();
  }
  drawChip() {
    if (!this.context || !this.chip.boundingBox) return;
    const g = new Graphics(this.context);
    const scalew = this.canvas.width / (this.chip.boundingBox.width + this.chip.boundingBox.x * 2);
    const scaleh = this.canvas.height / (this.chip.boundingBox.height + this.chip.boundingBox.y * 2);
    this.scale = 1 / Math.min(scalew, scaleh);
    this.context.fillStyle = CirSim.theApp.getBackgroundColor().getHexValue();
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.setTransform(1 / this.scale, 0, 0, 1 / this.scale, 0, 0);
    const labelName = this.labelCheck?.checked ? this.modelNameInput ? this.modelNameInput.value : this.model.name : null;
    this.chip.setLabel(labelName);
    this.chip.draw(g);
  }
  adjustChipSize(dx, dy) {
    if (dx < 0) {
      for (let i = 0; i < this.postCount; i++) {
        const p = this.chip.pins[i];
        if (p.busZ > 0) continue;
        if ((p.side === ChipElm.SIDE_N || p.side === ChipElm.SIDE_S) && p.pos >= this.chip.sizeX + dx)
          return;
      }
    }
    if (dy < 0) {
      let needShift = false;
      for (let i = 0; i < this.postCount; i++) {
        const p = this.chip.pins[i];
        if (p.busZ > 0) continue;
        if ((p.side === ChipElm.SIDE_E || p.side === ChipElm.SIDE_W) && p.pos >= this.chip.sizeY + dy) {
          needShift = true;
          break;
        }
      }
      if (needShift) {
        for (let i = 0; i < this.postCount; i++) {
          const p = this.chip.pins[i];
          if (p.busZ > 0) continue;
          if ((p.side === ChipElm.SIDE_E || p.side === ChipElm.SIDE_W) && p.pos === 0) return;
        }
        for (let i = 0; i < this.postCount; i++) {
          const pe = this.model.extList[i];
          if (pe.side === ChipElm.SIDE_E || pe.side === ChipElm.SIDE_W) pe.pos -= 1;
        }
      }
    }
    if (this.chip.sizeX + dx < 1 || this.chip.sizeY + dy < 1) return;
    this.model.sizeX += dx;
    this.model.sizeY += dy;
    this.createPinsFromModel();
    this.drawChip();
  }
  findNearestPin(x, y) {
    let bestDist = 20;
    let best = -1;
    for (let i = 0; i < this.postCount; i++) {
      const p = this.chip.pins[i];
      if (p.busZ > 0) continue;
      const dx = x * this.scale - p.textloc.x;
      const dy = y * this.scale - p.textloc.y;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  }
  updatePinHighlight() {
    for (let i = 0; i < this.postCount; i++)
      this.chip.pins[i].selected = this.selectedPins.has(i);
  }
  drawRubberBand() {
    const x1 = Math.min(this.rubberBandX1, this.rubberBandX2);
    const y1 = Math.min(this.rubberBandY1, this.rubberBandY2);
    const w = Math.abs(this.rubberBandX2 - this.rubberBandX1);
    const h = Math.abs(this.rubberBandY2 - this.rubberBandY1);
    this.context.save();
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.fillStyle = "rgba(68,136,255,0.15)";
    this.context.fillRect(x1, y1, w, h);
    this.context.strokeStyle = "#4488ff";
    this.context.lineWidth = 1;
    this.context.strokeRect(x1, y1, w, h);
    this.context.restore();
  }
  onMouseUp(event) {
    if (this.rubberBand) {
      const x1 = Math.min(this.rubberBandX1, this.rubberBandX2);
      const x2 = Math.max(this.rubberBandX1, this.rubberBandX2);
      const y1 = Math.min(this.rubberBandY1, this.rubberBandY2);
      const y2 = Math.max(this.rubberBandY1, this.rubberBandY2);
      const firstSel = this.selectedPins.size > 0 ? this.model.extList[this.selectedPins.values().next().value].side : -1;
      let selSide = firstSel;
      for (let i = 0; i < this.postCount; i++) {
        if (this.chip.pins[i].busZ > 0) continue;
        const px = this.chip.pins[i].textloc.x / this.scale | 0;
        const py = this.chip.pins[i].textloc.y / this.scale | 0;
        if (px >= x1 && px <= x2 && py >= y1 && py <= y2) {
          if (selSide === -1) selSide = this.model.extList[i].side;
          if (this.model.extList[i].side === selSide) this.selectedPins.add(i);
        }
      }
      this.rubberBand = false;
      this.updatePinHighlight();
      this.drawChip();
    }
    this.dragging = false;
  }
  onMouseMove(event) {
    this.mouseMoved(event.offsetX, event.offsetY);
  }
  mouseMoved(x, y) {
    if (this.rubberBand) {
      this.rubberBandX2 = x;
      this.rubberBandY2 = y;
      const x1 = Math.min(this.rubberBandX1, this.rubberBandX2);
      const x2 = Math.max(this.rubberBandX1, this.rubberBandX2);
      const y1 = Math.min(this.rubberBandY1, this.rubberBandY2);
      const y2 = Math.max(this.rubberBandY1, this.rubberBandY2);
      let selSide2 = this.selectedPins.size > 0 ? this.model.extList[this.selectedPins.values().next().value].side : -1;
      if (selSide2 === -1) {
        for (let i = 0; i < this.postCount; i++) {
          if (this.chip.pins[i].busZ > 0) continue;
          const px = this.chip.pins[i].textloc.x / this.scale | 0;
          const py = this.chip.pins[i].textloc.y / this.scale | 0;
          if (px >= x1 && px <= x2 && py >= y1 && py <= y2) {
            selSide2 = this.model.extList[i].side;
            break;
          }
        }
      }
      for (let i = 0; i < this.postCount; i++) {
        this.chip.pins[i].selected = this.selectedPins.has(i);
        if (this.chip.pins[i].busZ > 0) continue;
        const px = this.chip.pins[i].textloc.x / this.scale | 0;
        const py = this.chip.pins[i].textloc.y / this.scale | 0;
        if (px >= x1 && px <= x2 && py >= y1 && py <= y2 && this.model.extList[i].side === selSide2)
          this.chip.pins[i].selected = true;
      }
      this.drawChip();
      this.drawRubberBand();
      return;
    }
    if (this.dragging) {
      if (this.selectedPin < 0) return;
      const pos = [0, 0];
      if (!this.chip.getPinPos(x * this.scale | 0, y * this.scale | 0, this.dragCurrentSide, pos)) return;
      this.dragCurrentSide = pos[1];
      for (let i = 0; i < this.postCount; i++) {
        this.model.extList[i].pos = this.dragStartPosArr[i];
        this.model.extList[i].side = this.dragStartSideArr[i];
      }
      const newSide = pos[1];
      let maxNewPos = newSide === ChipElm.SIDE_N || newSide === ChipElm.SIDE_S ? this.chip.sizeX - 1 : this.chip.sizeY - 1;
      let minOff = Number.MAX_SAFE_INTEGER, maxOff = Number.MIN_SAFE_INTEGER;
      let sameSideCount = 0;
      for (const idx of this.selectedPins) {
        if (this.dragStartSideArr[idx] !== this.dragStartSide) continue;
        sameSideCount++;
        const off = this.dragStartPosArr[idx] - this.dragStartPos;
        if (off < minOff) minOff = off;
        if (off > maxOff) maxOff = off;
      }
      const groupSize = maxOff - minOff + 1;
      let effectiveSide = newSide;
      let effectiveMaxPos = maxNewPos;
      if (groupSize > maxNewPos + 1) {
        effectiveSide = this.dragStartSide;
        effectiveMaxPos = effectiveSide === ChipElm.SIDE_N || effectiveSide === ChipElm.SIDE_S ? this.chip.sizeX - 1 : this.chip.sizeY - 1;
      }
      const anchor = Math.max(-minOff, Math.min(effectiveMaxPos - maxOff, pos[0]));
      const delta = anchor - this.dragStartPos;
      const sameSide = effectiveSide === this.dragStartSide;
      const contiguous = groupSize === sameSideCount;
      const updateBusGroup = (pj, newPos, newSideVal) => {
        pj.pos = newPos;
        if (newSideVal !== void 0) pj.side = newSideVal;
        for (let j = 0; j < this.postCount; j++) {
          const pjj = this.model.extList[j];
          if (pjj.name === pj.name && pjj.busWidth === pj.busWidth) {
            pjj.pos = newPos;
            if (newSideVal !== void 0) pjj.side = newSideVal;
          }
        }
      };
      if (sameSide && contiguous) {
        for (let i = 0; i < this.postCount; i++) {
          if (this.selectedPins.has(i) || this.chip.pins[i].busZ > 0) continue;
          if (this.dragStartSideArr[i] !== this.dragStartSide) continue;
          const origPos = this.dragStartPosArr[i];
          let newPos;
          if (delta >= 0)
            newPos = origPos >= this.dragStartPos + maxOff + 1 && origPos <= anchor + maxOff ? origPos - groupSize : origPos;
          else
            newPos = origPos >= anchor + minOff && origPos <= this.dragStartPos + minOff - 1 ? origPos + groupSize : origPos;
          if (newPos !== origPos) updateBusGroup(this.model.extList[i], newPos);
        }
      } else {
        const groupPos = /* @__PURE__ */ new Set();
        for (const idx of this.selectedPins) {
          if (this.dragStartSideArr[idx] !== this.dragStartSide) continue;
          groupPos.add(anchor + this.dragStartPosArr[idx] - this.dragStartPos);
        }
        const displaced = [];
        for (let i = 0; i < this.postCount; i++) {
          if (this.selectedPins.has(i) || this.chip.pins[i].busZ > 0) continue;
          if (this.dragStartSideArr[i] !== effectiveSide) continue;
          if (groupPos.has(this.dragStartPosArr[i])) displaced.push(i);
        }
        const taken = /* @__PURE__ */ new Set();
        for (let i = 0; i < this.postCount; i++) {
          if (this.selectedPins.has(i) || this.chip.pins[i].busZ > 0) continue;
          if (this.dragStartSideArr[i] === effectiveSide && !groupPos.has(this.dragStartPosArr[i]))
            taken.add(this.dragStartPosArr[i]);
        }
        const available = [];
        for (let slot = 0; slot <= effectiveMaxPos; slot++)
          if (!groupPos.has(slot) && !taken.has(slot)) available.push(slot);
        displaced.sort((a, b) => this.dragStartPosArr[a] - this.dragStartPosArr[b]);
        const slots = [];
        if (delta >= 0) {
          for (let k = available.length - 1; k >= 0 && slots.length < displaced.length; k--)
            if (available[k] < anchor) slots.push(available[k]);
          for (let k = 0; k < available.length && slots.length < displaced.length; k++)
            if (available[k] > anchor + maxOff) slots.push(available[k]);
        } else {
          for (let k = 0; k < available.length && slots.length < displaced.length; k++)
            if (available[k] > anchor + maxOff) slots.push(available[k]);
          for (let k = available.length - 1; k >= 0 && slots.length < displaced.length; k--)
            if (available[k] < anchor) slots.push(available[k]);
        }
        slots.sort((a, b) => a - b);
        for (let k = 0; k < displaced.length && k < slots.length; k++)
          updateBusGroup(this.model.extList[displaced[k]], slots[k]);
      }
      for (const idx of this.selectedPins) {
        if (this.dragStartSideArr[idx] !== this.dragStartSide) continue;
        const newPos = anchor + this.dragStartPosArr[idx] - this.dragStartPos;
        updateBusGroup(this.model.extList[idx], newPos, effectiveSide);
      }
      this.createPinsFromModel();
      this.drawChip();
    } else {
      const hoveredPin = this.findNearestPin(x, y);
      for (let i = 0; i < this.postCount; i++)
        this.chip.pins[i].selected = this.selectedPins.has(i) || i === hoveredPin;
      this.drawChip();
    }
  }
  onMouseDown(event) {
    const x = event.offsetX, y = event.offsetY;
    const hoveredPin = this.findNearestPin(x, y);
    if (hoveredPin < 0) {
      if (!event.shiftKey) this.selectedPins.clear();
      this.rubberBand = true;
      this.rubberBandX1 = this.rubberBandX2 = x;
      this.rubberBandY1 = this.rubberBandY2 = y;
      this.updatePinHighlight();
      this.drawChip();
      return;
    }
    this.rubberBand = false;
    if (event.shiftKey) {
      if (this.selectedPins.has(hoveredPin)) {
        this.selectedPins.delete(hoveredPin);
      } else {
        const hSide = this.model.extList[hoveredPin].side;
        let ok = this.selectedPins.size === 0;
        if (!ok) ok = this.model.extList[this.selectedPins.values().next().value].side === hSide;
        if (ok) this.selectedPins.add(hoveredPin);
      }
    } else {
      if (!this.selectedPins.has(hoveredPin)) {
        this.selectedPins.clear();
        this.selectedPins.add(hoveredPin);
      }
    }
    this.selectedPin = hoveredPin;
    this.dragStartPosArr = new Array(this.postCount);
    this.dragStartSideArr = new Array(this.postCount);
    for (let i = 0; i < this.postCount; i++) {
      const pe = this.model.extList[i];
      this.dragStartPosArr[i] = pe.pos;
      this.dragStartSideArr[i] = pe.side;
    }
    const sp = this.model.extList[this.selectedPin];
    this.dragStartPos = sp.pos;
    this.dragStartSide = this.dragCurrentSide = sp.side;
    this.updatePinHighlight();
    this.dragging = true;
    this.drawChip();
  }
  // Preserve pin positions/sides from existingModel in newModel, matching by name.
  static preservePinLayout(newModel, existingModel) {
    const n = newModel.extList.length;
    const matched = new Array(n).fill(false);
    let anyPreserved = false;
    const placed = [];
    for (let i = 0; i < n; i++) {
      const ent = newModel.extList[i];
      if (ent.busZ !== 0) continue;
      for (const old of existingModel.extList) {
        if (old.busZ === 0 && old.name === ent.name) {
          ent.pos = old.pos;
          ent.side = old.side;
          matched[i] = true;
          anyPreserved = true;
          break;
        }
      }
      if (matched[i]) placed.push([ent.pos, ent.side]);
    }
    if (!anyPreserved) return;
    newModel.sizeX = existingModel.sizeX;
    newModel.sizeY = existingModel.sizeY;
    for (let i = 0; i < n; i++) {
      if (matched[i]) continue;
      const ent = newModel.extList[i];
      if (ent.busZ !== 0) continue;
      const side = ent.side;
      const ns = side === ChipElm.SIDE_N || side === ChipElm.SIDE_S;
      let foundPos = -1;
      for (let expansion = 0; expansion <= n && foundPos < 0; expansion++) {
        const curSizeX = newModel.sizeX + (ns ? expansion : 0);
        const curSizeY = newModel.sizeY + (ns ? 0 : expansion);
        const maxPos = ns ? curSizeX : curSizeY;
        for (let p = 0; p < maxPos; p++) {
          if (!EditSubcircuitModelDialog.pinIsOccupied(p, side, placed, curSizeX, curSizeY)) {
            foundPos = p;
            newModel.sizeX = curSizeX;
            newModel.sizeY = curSizeY;
            break;
          }
        }
      }
      ent.pos = foundPos >= 0 ? foundPos : 0;
      placed.push([ent.pos, side]);
    }
    for (const ent of newModel.extList) {
      if (ent.busZ === 0) continue;
      for (const anchor of newModel.extList) {
        if (anchor.busZ === 0 && anchor.name === ent.name) {
          ent.pos = anchor.pos;
          ent.side = anchor.side;
          break;
        }
      }
    }
  }
  static pinToGrid(pos, side, sizeX, sizeY) {
    if (side === ChipElm.SIDE_N) return pos;
    if (side === ChipElm.SIDE_S) return pos + sizeX * (sizeY - 1);
    if (side === ChipElm.SIDE_W) return pos * sizeX;
    if (side === ChipElm.SIDE_E) return pos * sizeX + sizeX - 1;
    return -1;
  }
  static pinIsOccupied(pos, side, placed, sizeX, sizeY) {
    const g = EditSubcircuitModelDialog.pinToGrid(pos, side, sizeX, sizeY);
    if (g < 0) return true;
    for (const p of placed) {
      if (EditSubcircuitModelDialog.pinToGrid(p[0], p[1], sizeX, sizeY) === g) return true;
    }
    return false;
  }
}

export { ChipElm as C, EditSubcircuitModelDialog as E, Pin as P, SubcircuitElm as S, CompositeElm as a };
