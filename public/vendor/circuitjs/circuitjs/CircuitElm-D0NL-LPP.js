const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./UIManager-Bxtki72o.js","./EditSubcircuitModelDialog-C5vUSIFP.js","./KeyNames-CtQ8ZgWT.js","./CommandManager-DNG4CaF3.js","./ScopeElm-D-xJz0et.js","./EditDialog-BLOWt7NH.js","./Adjustable-BWwy8o9t.js","./SliderDialog-DaQovZaP.js","./ScopePropertiesDialog-Ca6zTNa4.js","./ShortcutsDialog-BpnJkJG2.js","./ExportAsImageDialog-BUlXCO0L.js","./ImageExporter-CQsJHMAl.js","./registerElements-BeniTXyS.js"])))=>i.map(i=>d[i]);
function parseIntStrict(s, radix) {
  const n = parseInt(s, radix);
  if (isNaN(n))
    throw new Error("invalid integer: " + JSON.stringify(s));
  return n;
}
function parseFloatStrict(s) {
  const n = parseFloat(s);
  if (isNaN(n))
    throw new Error("invalid float: " + JSON.stringify(s));
  return n;
}

class Color {
  static white = new Color(255, 255, 255);
  static lightGray = new Color(192, 192, 192);
  static gray = new Color(128, 128, 128);
  static GRAY = new Color(128, 128, 128);
  static dark_gray = new Color(64, 64, 64);
  static darkGray = new Color(64, 64, 64);
  static black = new Color(0, 0, 0);
  static red = new Color(255, 0, 0);
  static pink = new Color(255, 175, 175);
  static orange = new Color(255, 200, 0);
  static yellow = new Color(255, 255, 0);
  static green = new Color(0, 255, 0);
  static magenta = new Color(255, 0, 255);
  static cyan = new Color(0, 255, 255);
  static blue = new Color(0, 0, 255);
  static NONE = new Color("");
  r = 0;
  g = 0;
  b = 0;
  colorText = null;
  constructor(arg0, arg1, arg2) {
    if (typeof arg0 === "string") {
      this.colorText = arg0;
      if (arg0.startsWith("#") && arg0.length === 7) {
        this.r = parseIntStrict(arg0.substring(1, 3), 16);
        this.g = parseIntStrict(arg0.substring(3, 5), 16);
        this.b = parseIntStrict(arg0.substring(5, 7), 16);
      }
    } else if (arg0 instanceof Color) {
      const c1 = arg0;
      const c2 = arg1;
      const mix = arg2;
      const m0 = 1 - mix;
      this.r = Math.trunc(c1.r * m0 + c2.r * mix);
      this.g = Math.trunc(c1.g * m0 + c2.g * mix);
      this.b = Math.trunc(c1.b * m0 + c2.b * mix);
    } else {
      this.r = arg0;
      this.g = arg1;
      this.b = arg2;
    }
  }
  getRed() {
    return this.r;
  }
  getGreen() {
    return this.g;
  }
  getBlue() {
    return this.b;
  }
  getHexValue() {
    if (this.colorText !== null)
      return this.colorText;
    return "#" + this.pad(this.r.toString(16)) + this.pad(this.g.toString(16)) + this.pad(this.b.toString(16));
  }
  pad(s) {
    if (s.length === 0) return "00";
    if (s.length === 1) return "0" + s;
    return s;
  }
  toString() {
    if (this.colorText !== null)
      return this.colorText;
    return "red=" + this.r + ", green=" + this.g + ", blue=" + this.b;
  }
}

class Point {
  x = 0;
  y = 0;
  z = 0;
  constructor(arg0, arg1, arg2) {
    if (arg0 === void 0) ; else if (arg0 instanceof Point) {
      this.x = arg0.x;
      this.y = arg0.y;
      this.z = arg0.z;
    } else {
      this.x = arg0;
      this.y = arg1;
      this.z = arg2 ?? 0;
    }
  }
  setLocation(p) {
    this.x = p.x;
    this.y = p.y;
    this.z = p.z;
  }
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
  equals(other) {
    if (other instanceof Point)
      return this.x === other.x && this.y === other.y && this.z === other.z;
    return false;
  }
  hashCode() {
    return 41 * (41 * (41 + this.x) + this.y) + this.z;
  }
  toString() {
    if (this.z !== 0)
      return `Point(${this.x},${this.y},${this.z})`;
    return `Point(${this.x},${this.y})`;
  }
}

class Font {
  static BOLD = 1;
  fontname;
  size;
  constructor(name, style, size) {
    if (name === "SansSerif")
      name = "sans-serif";
    const styleStr = (style & Font.BOLD) !== 0 ? "bold " : "normal ";
    this.fontname = styleStr + size + "px " + name;
    this.size = size;
  }
}

const INT_MAX = 2147483647;
class Rectangle {
  x;
  y;
  width;
  height;
  constructor(arg0, arg1, arg2, arg3) {
    if (arg0 === void 0) {
      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;
    } else if (arg0 instanceof Point) {
      this.x = arg0.x;
      this.y = arg0.y;
      this.width = 0;
      this.height = 0;
    } else if (arg0 instanceof Rectangle) {
      this.x = arg0.x;
      this.y = arg0.y;
      this.width = arg0.width;
      this.height = arg0.height;
    } else {
      this.x = arg0;
      this.y = arg1;
      this.width = arg2;
      this.height = arg3;
    }
  }
  setBounds(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  translate(dx, dy) {
    this.x += dx;
    this.y += dy;
  }
  contains(arg0, arg1) {
    if (arg0 instanceof Rectangle)
      return this.contains(arg0.x, arg0.y) && this.contains(arg0.x + arg0.width, arg0.y + arg0.height);
    const X = arg0, Y = arg1;
    const w = this.width;
    const h = this.height;
    if ((w | h) < 0) {
      return false;
    }
    const x = this.x;
    const y = this.y;
    if (X < x || Y < y) {
      return false;
    }
    const w2 = w + x;
    const h2 = h + y;
    return (w2 < x || w2 > X) && (h2 < y || h2 > Y);
  }
  /*
  move(x: number, y: number): void {
      this.x = x;
      this.y = y;
  }
  */
  intersects(r) {
    let tw = this.width;
    let th = this.height;
    let rw = r.width;
    let rh = r.height;
    if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
      return false;
    }
    const tx = this.x;
    const ty = this.y;
    const rx = r.x;
    const ry = r.y;
    rw += rx;
    rh += ry;
    tw += tx;
    th += ty;
    return (rw < rx || rw > tx) && (rh < ry || rh > ty) && (tw < tx || tw > rx) && (th < ty || th > ry);
  }
  union(r) {
    let tx2 = this.width;
    let ty2 = this.height;
    if ((tx2 | ty2) < 0) {
      return new Rectangle(r);
    }
    let rx2 = r.width;
    let ry2 = r.height;
    if ((rx2 | ry2) < 0) {
      return new Rectangle(this);
    }
    let tx1 = this.x;
    let ty1 = this.y;
    tx2 += tx1;
    ty2 += ty1;
    let rx1 = r.x;
    let ry1 = r.y;
    rx2 += rx1;
    ry2 += ry1;
    if (tx1 > rx1) tx1 = rx1;
    if (ty1 > ry1) ty1 = ry1;
    if (tx2 < rx2) tx2 = rx2;
    if (ty2 < ry2) ty2 = ry2;
    tx2 -= tx1;
    ty2 -= ty1;
    if (tx2 > INT_MAX) tx2 = INT_MAX;
    if (ty2 > INT_MAX) ty2 = INT_MAX;
    return new Rectangle(tx1, ty1, tx2, ty2);
  }
  equals(other) {
    if (other instanceof Rectangle) {
      const r = other;
      return this.x === r.x && this.y === r.y && this.width === r.width && this.height === r.height;
    }
    return false;
  }
  toString() {
    return "Rect(" + this.x + "," + this.y + "," + this.width + "," + this.height + ")";
  }
}

class Polygon {
  //  ArrayList<Point> poly;
  static MIN_LENGTH = 4;
  npoints = 0;
  xpoints;
  ypoints;
  constructor() {
    this.xpoints = new Array(Polygon.MIN_LENGTH).fill(0);
    this.ypoints = new Array(Polygon.MIN_LENGTH).fill(0);
  }
  //  addPoint(x: number, y: number): void {
  //      poly.add(new Point(x,y));
  //  }
  addPoint(x, y) {
    if (this.npoints >= this.xpoints.length || this.npoints >= this.ypoints.length) {
      let newLength = this.npoints * 2;
      if (newLength < Polygon.MIN_LENGTH) {
        newLength = Polygon.MIN_LENGTH;
      } else if ((newLength & newLength - 1) !== 0) {
        newLength = Math.pow(2, Math.ceil(Math.log2(newLength)));
      }
      this.xpoints = this.expand(this.xpoints, newLength);
      this.ypoints = this.expand(this.ypoints, newLength);
    }
    this.xpoints[this.npoints] = x;
    this.ypoints[this.npoints] = y;
    this.npoints++;
  }
  expand(inp, newlen) {
    const out = new Array(newlen).fill(0);
    for (let i = 0; i < inp.length; i++)
      out[i] = inp[i];
    return out;
  }
}

class Graphics {
  context;
  currentFontSize;
  lastColor = null;
  savedFontSize = 12;
  static isFullScreen = false;
  constructor(context) {
    this.context = context;
    this.currentFontSize = 12;
  }
  setColor(color) {
    if (color instanceof Color) {
      if (color != null) {
        const colorString = color.getHexValue();
        this.context.strokeStyle = colorString;
        this.context.fillStyle = colorString;
      } else {
        console.log("Ignoring null-Color");
      }
      this.lastColor = color;
    } else if (typeof color === "string") {
      this.context.strokeStyle = color;
      this.context.fillStyle = color;
      this.lastColor = null;
    }
  }
  clipRect(x, y, width, height) {
    this.context.beginPath();
    this.context.rect(x, y, width, height);
    this.context.clip();
  }
  restore() {
    this.context.restore();
    this.currentFontSize = this.savedFontSize;
  }
  save() {
    this.context.save();
    this.savedFontSize = this.currentFontSize;
  }
  fillRect(x, y, width, height) {
    this.context.fillRect(x, y, width, height);
  }
  drawRect(x, y, width, height) {
    this.context.strokeRect(x, y, width, height);
  }
  fillOval(x, y, width, height) {
    this.context.beginPath();
    this.context.arc(x + width / 2, y + width / 2, width / 2, 0, 2 * 3.14159);
    this.context.closePath();
    this.context.fill();
  }
  drawString(s, x, y) {
    this.context.fillText(s, x, y);
  }
  measureWidth(s) {
    return this.context.measureText(s).width;
  }
  setLineWidth(width) {
    this.context.lineWidth = width;
  }
  drawLine(x1, y1, x2, y2) {
    if (x1 instanceof Point && y1 instanceof Point) {
      this.context.beginPath();
      this.context.moveTo(x1.x, x1.y);
      this.context.lineTo(y1.x, y1.y);
      this.context.stroke();
    } else {
      this.context.beginPath();
      this.context.moveTo(x1, y1);
      this.context.lineTo(x2, y2);
      this.context.stroke();
    }
  }
  drawPolyline(xpoints, ypoints, n) {
    this.context.beginPath();
    for (let i = 0; i < n; i++) {
      if (i === 0)
        this.context.moveTo(xpoints[i], ypoints[i]);
      else
        this.context.lineTo(xpoints[i], ypoints[i]);
    }
    this.context.closePath();
    this.context.stroke();
  }
  fillPolygon(p) {
    this.context.beginPath();
    for (let i = 0; i < p.npoints; i++) {
      if (i === 0)
        this.context.moveTo(p.xpoints[i], p.ypoints[i]);
      else
        this.context.lineTo(p.xpoints[i], p.ypoints[i]);
    }
    this.context.closePath();
    this.context.fill();
  }
  setFont(f) {
    if (f != null) {
      this.context.font = f.fontname;
      this.currentFontSize = f.size;
    }
  }
  //  getFont(): Font {
  //      // this may return wrong font if g.save/restore() is used.  just use that instead
  //      return currentFont;
  //  }
  drawLock(x, y) {
    this.context.save();
    this.setColor(new Color(209, 75, 75));
    this.context.lineWidth = 3;
    this.fillRect(x, y, 30, 20);
    this.context.beginPath();
    this.context.moveTo(x + 15 - 10, y);
    this.context.lineTo(x + 15 - 10, y - 4);
    this.context.arc(x + 15, y - 4, 10, -3.1415, 0);
    this.context.lineTo(x + 15 + 10, y);
    this.context.stroke();
    this.context.restore();
  }
  static distanceSq(x1, y1, x2, y2) {
    x2 -= x1;
    y2 -= y1;
    return x2 * x2 + y2 * y2;
  }
  setLineDash(a, b) {
    if (typeof this.context.setLineDash !== "function")
      return;
    if (a === 0)
      this.context.setLineDash([]);
    else
      this.context.setLineDash([a, b]);
  }
  static viewFullScreen() {
    Graphics.requestFullScreen();
    Graphics.isFullScreen = true;
  }
  static requestFullScreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }
  static exitFullScreen() {
    Graphics.requestExitFullScreen();
    Graphics.isFullScreen = false;
  }
  static requestExitFullScreen() {
    const d = document;
    if (d.exitFullscreen) {
      d.exitFullscreen();
    } else if (d.mozExitFullScreen) {
      d.mozExitFullScreen();
    } else if (d.webkitExitFullscreen) {
      d.webkitExitFullscreen();
    } else if (d.msExitFullscreen) {
      d.msExitFullscreen();
    }
  }
}

class CircuitNodeLink {
  num = 0;
  elm = null;
  // CircuitElm — typed as any to avoid circular import
}

class VoltageSource {
  index = 0;
  elm = null;
  // CircuitElm — typed as any to avoid circular import
  matrix = null;
  row = 0;
  // row in matrix (nodeCount + 1-based offset)
  n1 = null;
  // nodes this VS is stamped between
  n2 = null;
  // save the nodes this voltage source is stamped between.
  // used later to determine which matrix it belongs to.
  setNodes(n1, n2) {
    this.n1 = n1;
    this.n2 = n2;
  }
  // assign matrix from saved nodes (use non-ground node's matrix)
  assignMatrix() {
    if (this.n1 != null && this.n1 !== CircuitNode.ground && this.n1.matrix != null)
      this.matrix = this.n1.matrix;
    else if (this.n2 != null && this.n2 !== CircuitNode.ground && this.n2.matrix != null)
      this.matrix = this.n2.matrix;
    else
      this.matrix = this.elm.getNode(this.elm.getPostCount() - 1).matrix;
    if (this.matrix == null) {
      console.log("null matrix! " + this.elm + " n1=" + (this.n1 == null ? "null" : this.n1.index + " m=" + this.n1.matrix) + " n2=" + (this.n2 == null ? "null" : this.n2.index + " m=" + this.n2.matrix) + " fallback=" + this.elm.getNode(this.elm.getPostCount() - 1).index);
    }
  }
}

class DGrowArray {
  data;
  length;
  constructor(length = 0) {
    this.data = new Float64Array(length);
    this.length = length;
  }
  reset() {
    this.reshape(0);
  }
  /**
   * Changes the array's length and doesn't attempt to preserve previous values if a new array is required
   *
   * @param length New array length
   */
  reshape(length) {
    if (this.data.length < length) {
      this.data = new Float64Array(length);
    }
    this.length = length;
    return this;
  }
  /**
   * Increases the internal array's length by the specified amount. Previous values are preserved.
   * The length value is not modified since this does not change the 'meaning' of the array, just
   * increases the amount of data which can be stored in it.
   *
   * this.data = new data_type[ data.length + amount ]
   *
   * @param amount Number of elements added to the internal array's length
   */
  growInternal(amount) {
    const tmp = new Float64Array(this.data.length + amount);
    tmp.set(this.data);
    this.data = tmp;
  }
  setTo(original) {
    this.reshape(original.length);
    this.data.set(original.data.subarray(0, original.length));
  }
  add(value) {
    if (this.length >= this.data.length) {
      this.growInternal(Math.min(5e5, this.data.length + 10));
    }
    this.data[this.length++] = value;
  }
  get(index) {
    if (index < 0 || index >= this.length)
      throw new Error("Out of bounds");
    return this.data[index];
  }
  set(index, value) {
    if (index < 0 || index >= this.length)
      throw new Error("Out of bounds");
    this.data[index] = value;
  }
  free() {
    this.data = new Float64Array(0);
    this.length = 0;
  }
}

function binarySearch(arr, from, to, key) {
  let low = from;
  let high = to - 1;
  while (low <= high) {
    const mid = low + high >>> 1;
    const midVal = arr[mid];
    if (midVal < key) low = mid + 1;
    else if (midVal > key) high = mid - 1;
    else return mid;
  }
  return -(low + 1);
}
class CoordinateRealValue {
  /** The coordinate */
  row = 0;
  col = 0;
  /** The value of the coordinate */
  value = 0;
}
class DMatrixSparseCSC {
  /**
   * Storage for non-zero values. Only valid up to length-1.
   */
  nz_values = new Float64Array(0);
  /**
   * Length of data. Number of non-zero values in the matrix
   */
  nz_length;
  /**
   * Specifies which row a specific non-zero value corresponds to. If they are sorted or not with in each column
   * is specified by the {@link indicesSorted} flag.
   */
  nz_rows = new Int32Array(0);
  /**
   * Stores the range of indexes in the non-zero lists that belong to each column. Column 'i' corresponds to
   * indexes col_idx[i] to col_idx[i+1]-1, inclusive.
   */
  col_idx;
  /**
   * Number of rows in the matrix
   */
  numRows;
  /**
   * Number of columns in the matrix
   */
  numCols;
  /**
   * Flag that's used to indicate of the row indices are sorted or not.
   */
  indicesSorted = false;
  static EPS = Math.pow(2, -52);
  /**
   * Constructor with a default arrayLength of zero.
   *
   * @param numRows Number of rows
   * @param numCols Number of columns
   */
  constructor(numRows, numCols, arrayLength = 0) {
    if (numRows < 0 || numCols < 0 || arrayLength < 0)
      throw new Error("Rows, columns, and arrayLength must be not be negative");
    this.numRows = numRows;
    this.numCols = numCols;
    this.nz_length = 0;
    this.col_idx = new Int32Array(numCols + 1);
    this.growMaxLength(arrayLength, false);
  }
  static fromMatrix(original) {
    const m = new DMatrixSparseCSC(original.numRows, original.numCols, original.nz_length);
    m.setTo(original);
    return m;
  }
  getNumRows() {
    return this.numRows;
  }
  getNumCols() {
    return this.numCols;
  }
  copy() {
    return DMatrixSparseCSC.fromMatrix(this);
  }
  createLike() {
    return new DMatrixSparseCSC(this.numRows, this.numCols);
  }
  setTo(original) {
    const o = original;
    this.reshape(o.numRows, o.numCols, o.nz_length);
    this.nz_length = o.nz_length;
    this.nz_values.set(o.nz_values.subarray(0, this.nz_length));
    this.nz_rows.set(o.nz_rows.subarray(0, this.nz_length));
    this.col_idx.set(o.col_idx.subarray(0, this.numCols + 1));
    this.indicesSorted = o.indicesSorted;
  }
  isAssigned(row, col) {
    return this.nz_index(row, col) >= 0;
  }
  get(row, col, fallBackValue) {
    if (row < 0 || row >= this.numRows || col < 0 || col >= this.numCols)
      throw new Error("Outside of matrix bounds");
    if (fallBackValue !== void 0)
      return this.unsafe_get_fallback(row, col, fallBackValue);
    return this.unsafe_get(row, col);
  }
  unsafe_get(row, col) {
    const index = this.nz_index(row, col);
    if (index >= 0)
      return this.nz_values[index];
    return 0;
  }
  unsafe_get_fallback(row, col, fallBackValue) {
    const index = this.nz_index(row, col);
    if (index >= 0)
      return this.nz_values[index];
    return fallBackValue;
  }
  /**
   * Returns the index in nz_rows for the element at (row,col) if it already exists in the matrix. If not then -1
   * is returned.
   *
   * @param row row coordinate
   * @param col column coordinate
   * @return nz_row index or -1 if the element does not exist
   */
  nz_index(row, col) {
    const col0 = this.col_idx[col];
    const col1 = this.col_idx[col + 1];
    if (this.indicesSorted) {
      return binarySearch(this.nz_rows, col0, col1, row);
    } else {
      for (let i = col0; i < col1; i++) {
        if (this.nz_rows[i] === row) {
          return i;
        }
      }
      return -1;
    }
  }
  set(row, col, val) {
    if (row < 0 || row >= this.numRows || col < 0 || col >= this.numCols)
      throw new Error("Outside of matrix bounds");
    this.unsafe_set(row, col, val);
  }
  unsafe_set(row, col, val) {
    let index = this.nz_index(row, col);
    if (index >= 0) {
      this.nz_values[index] = val;
    } else {
      const idx0 = this.col_idx[col];
      const idx1 = this.col_idx[col + 1];
      for (index = idx0; index < idx1; index++) {
        if (row < this.nz_rows[index]) {
          break;
        }
      }
      for (let i = col + 1; i <= this.numCols; i++) {
        this.col_idx[i]++;
      }
      if (this.nz_length >= this.nz_values.length)
        this.growMaxLength(this.nz_length * 2 + 1, true);
      for (let i = this.nz_length; i > index; i--) {
        this.nz_rows[i] = this.nz_rows[i - 1];
        this.nz_values[i] = this.nz_values[i - 1];
      }
      this.nz_rows[index] = row;
      this.nz_values[index] = val;
      this.nz_length++;
    }
  }
  remove(row, col) {
    const index = this.nz_index(row, col);
    if (index < 0)
      return;
    for (let i = col + 1; i <= this.numCols; i++) {
      this.col_idx[i]--;
    }
    this.nz_length--;
    for (let i = index; i < this.nz_length; i++) {
      this.nz_rows[i] = this.nz_rows[i + 1];
      this.nz_values[i] = this.nz_values[i + 1];
    }
  }
  zero() {
    this.col_idx.fill(0, 0, this.numCols + 1);
    this.nz_length = 0;
    this.indicesSorted = false;
  }
  create(numRows, numCols) {
    return new DMatrixSparseCSC(numRows, numCols);
  }
  getNonZeroLength() {
    return this.nz_length;
  }
  reshape(numRows, numCols, arrayLength = 0) {
    if (numRows < 0 || numCols < 0 || arrayLength < 0)
      throw new Error("Rows, columns, and arrayLength must be not be negative");
    this.indicesSorted = false;
    this.numRows = numRows;
    this.numCols = numCols;
    this.growMaxLength(arrayLength, false);
    this.nz_length = 0;
    if (numCols + 1 > this.col_idx.length) {
      this.col_idx = new Int32Array(numCols + 1);
    } else {
      this.col_idx.fill(0, 0, numCols + 1);
    }
  }
  shrinkArrays() {
    if (this.nz_length < this.nz_values.length) {
      const tmp_values = new Float64Array(this.nz_length);
      const tmp_rows = new Int32Array(this.nz_length);
      tmp_values.set(this.nz_values.subarray(0, this.nz_length));
      tmp_rows.set(this.nz_rows.subarray(0, this.nz_length));
      this.nz_values = tmp_values;
      this.nz_rows = tmp_rows;
    }
  }
  /**
   * Increases the maximum size of the data array so that it can store sparse data up to 'length'. The class
   * parameter nz_length is not modified by this function call.
   *
   * @param arrayLength   Desired maximum length of sparse data
   * @param preserveValue If true the old values will be copied into the new arrays. If false that step will be skipped.
   */
  growMaxLength(arrayLength, preserveValue) {
    if (arrayLength < 0)
      throw new Error("Negative array length. Overflow?");
    if (arrayLength > this.nz_values.length) {
      const data = new Float64Array(arrayLength);
      const row_idx = new Int32Array(arrayLength);
      if (preserveValue) {
        data.set(this.nz_values.subarray(0, this.nz_length));
        row_idx.set(this.nz_rows.subarray(0, this.nz_length));
      }
      this.nz_values = data;
      this.nz_rows = row_idx;
    }
  }
  /**
   * Increases the maximum number of columns in the matrix.
   *
   * @param desiredColumns Desired number of columns.
   * @param preserveValue  If the array needs to be expanded should it copy the previous values?
   */
  growMaxColumns(desiredColumns, preserveValue) {
    if (this.col_idx.length < desiredColumns + 1) {
      const c = new Int32Array(desiredColumns + 1);
      if (preserveValue)
        c.set(this.col_idx);
      this.col_idx = c;
    }
  }
  /**
   * Given the histogram of columns compute the col_idx for the matrix. nz_length is automatically set and
   * nz_values will grow if needed.
   *
   * @param histogram histogram of column values in the sparse matrix. modified, see above.
   */
  histogramToStructure(histogram) {
    this.col_idx[0] = 0;
    let index = 0;
    for (let i = 1; i <= this.numCols; i++) {
      this.col_idx[i] = index += histogram[i - 1];
    }
    this.nz_length = index;
    this.growMaxLength(this.nz_length, false);
    if (this.col_idx[this.numCols] !== this.nz_length)
      throw new Error("Egads");
  }
  /**
   * Copies the non-zero structure of orig into "this"
   *
   * @param orig Matrix who's structure is to be copied
   */
  copyStructure(orig) {
    this.reshape(orig.numRows, orig.numCols, orig.nz_length);
    this.nz_length = orig.nz_length;
    this.col_idx.set(orig.col_idx.subarray(0, orig.numCols + 1));
    this.nz_rows.set(orig.nz_rows.subarray(0, orig.nz_length));
  }
  /**
   * If the indices has been sorted or not
   *
   * @return true if sorted or false if not sorted
   */
  isIndicesSorted() {
    return this.indicesSorted;
  }
  /**
   * Returns true if number of non-zero elements is the maximum size
   *
   * @return true if no more non-zero elements can be added
   */
  isFull() {
    return this.nz_length === this.numRows * this.numCols;
  }
  static convert(circuitMatrix, tol) {
    let nonzero = 0;
    for (let i2 = 0; i2 !== circuitMatrix.length; i2++)
      for (let j2 = 0; j2 !== circuitMatrix.length; j2++) {
        if (circuitMatrix[i2][j2] !== 0) {
          nonzero++;
        }
      }
    const dst = new DMatrixSparseCSC(circuitMatrix.length, circuitMatrix.length, nonzero);
    dst.nz_length = 0;
    dst.col_idx[0] = 0;
    let i, j;
    for (i = 0; i !== circuitMatrix.length; i++) {
      for (j = 0; j !== circuitMatrix.length; j++) {
        const value = circuitMatrix[j][i];
        if (!(Math.abs(value) <= tol)) {
          dst.nz_rows[dst.nz_length] = j;
          dst.nz_values[dst.nz_length] = value;
          ++dst.nz_length;
        }
      }
      dst.col_idx[i + 1] = dst.nz_length;
    }
    return dst;
  }
  // the same as convert(), reading only the given entries (col*n+row, sorted); all others must be zero
  static convertEntries(circuitMatrix, entries, tol) {
    const n = circuitMatrix.length;
    let nonzero = 0;
    for (let k = 0; k !== entries.length; k++) {
      const j = entries[k] % n;
      if (circuitMatrix[j][(entries[k] - j) / n] !== 0)
        nonzero++;
    }
    const dst = new DMatrixSparseCSC(n, n, nonzero);
    dst.nz_length = 0;
    dst.col_idx[0] = 0;
    let col = 0;
    for (let k = 0; k !== entries.length; k++) {
      const j = entries[k] % n, i = (entries[k] - j) / n;
      while (col < i)
        dst.col_idx[++col] = dst.nz_length;
      const value = circuitMatrix[j][i];
      if (!(Math.abs(value) <= tol)) {
        dst.nz_rows[dst.nz_length] = j;
        dst.nz_values[dst.nz_length] = value;
        ++dst.nz_length;
      }
    }
    while (col < n)
      dst.col_idx[++col] = dst.nz_length;
    return dst;
  }
  createCoordinateIterator() {
    const matrix = this;
    const coordinate = new CoordinateRealValue();
    let nz_index = 0;
    let column = 0;
    const incrementColumn = () => {
      while (column + 1 <= matrix.numCols && nz_index >= matrix.col_idx[column + 1]) {
        column++;
      }
    };
    incrementColumn();
    return {
      hasNext() {
        return nz_index < matrix.nz_length;
      },
      next() {
        coordinate.row = matrix.nz_rows[nz_index];
        coordinate.col = column;
        coordinate.value = matrix.nz_values[nz_index];
        nz_index++;
        incrementColumn();
        return coordinate;
      }
    };
  }
}

class IGrowArray {
  data;
  length;
  constructor(length = 0) {
    this.data = new Int32Array(length);
    this.length = length;
  }
  reshape(length) {
    if (this.data.length < length) {
      this.data = new Int32Array(length);
    }
    this.length = length;
  }
  /**
   * Increases the internal array's length by the specified amount. Previous values are preserved.
   * The length value is not modified since this does not change the 'meaning' of the array, just
   * increases the amount of data which can be stored in it.
   *
   * this.data = new data_type[ data.length + amount ]
   *
   * @param amount Number of elements added to the internal array's length
   */
  growInternal(amount) {
    const tmp = new Int32Array(this.data.length + amount);
    tmp.set(this.data);
    this.data = tmp;
  }
  setTo(original) {
    this.reshape(original.length);
    this.data.set(original.data.subarray(0, original.length));
  }
  get(index) {
    if (index < 0 || index >= this.length)
      throw new Error("Out of bounds");
    return this.data[index];
  }
  set(index, value) {
    if (index < 0 || index >= this.length)
      throw new Error("Out of bounds");
    this.data[index] = value;
  }
  add(value) {
    if (this.length === this.data.length) {
      this.growInternal(Math.min(1e4, 1 + this.data.length));
    }
    this.data[this.length++] = value;
  }
  clear() {
    this.length = 0;
  }
  free() {
    this.data = new Int32Array(0);
    this.length = 0;
  }
}

class SparseLU {
  constructor() {
  }
  gw = new IGrowArray();
  L = new DMatrixSparseCSC(0, 0, 0);
  U = new DMatrixSparseCSC(0, 0, 0);
  x = new Float64Array(0);
  initialize(A) {
    const m = A.numRows;
    const n = A.numCols;
    const o = Math.min(m, n);
    this.L.reshape(m, m, 4 * A.nz_length + o);
    this.L.nz_length = 0;
    this.U.reshape(m, n, 4 * A.nz_length + o);
    this.U.nz_length = 0;
    this.singular = false;
    if (this.pinv.length !== m) {
      this.pinv = new Int32Array(m);
      this.x = new Float64Array(m);
    }
    for (let i = 0; i < m; ++i) {
      this.pinv[i] = -1;
      this.L.col_idx[i] = 0;
    }
  }
  gxi = new IGrowArray();
  pinv = new Int32Array(0);
  singular = false;
  performLU(A) {
    const m = A.numRows;
    const n = A.numCols;
    const w = SparseLU.adjustIZero(this.gw, m * 2, m);
    let k;
    for (k = 0; k < n; ++k) {
      this.L.col_idx[k] = this.L.nz_length;
      this.U.col_idx[k] = this.U.nz_length;
      if (this.L.nz_length + n > this.L.nz_values.length) {
        this.L.growMaxLength(2 * this.L.nz_values.length + n, true);
      }
      if (this.U.nz_length + n > this.U.nz_values.length) {
        this.U.growMaxLength(2 * this.U.nz_values.length + n, true);
      }
      const col = k;
      const top = SparseLU.solveColB(this.L, true, A, col, this.x, this.pinv, this.gxi, w);
      const xi = this.gxi.data;
      let ipiv = -1;
      let a = -17976931348623157e292;
      for (let p = top; p < n; ++p) {
        const i = xi[p];
        if (this.pinv[i] < 0) {
          let t;
          if ((t = Math.abs(this.x[i])) > a) {
            a = t;
            ipiv = i;
          }
        } else {
          this.U.nz_rows[this.U.nz_length] = this.pinv[i];
          this.U.nz_values[this.U.nz_length++] = this.x[i];
        }
      }
      if (ipiv === -1 || a <= 0) {
        this.singular = true;
        return false;
      }
      const pivot = this.x[ipiv];
      this.U.nz_rows[this.U.nz_length] = k;
      this.U.nz_values[this.U.nz_length++] = pivot;
      this.pinv[ipiv] = k;
      this.L.nz_rows[this.L.nz_length] = ipiv;
      this.L.nz_values[this.L.nz_length++] = 1;
      for (let p = top; p < n; ++p) {
        const i = xi[p];
        if (this.pinv[i] < 0) {
          this.L.nz_rows[this.L.nz_length] = i;
          this.L.nz_values[this.L.nz_length++] = this.x[i] / pivot;
        }
        this.x[i] = 0;
      }
    }
    this.L.col_idx[n] = this.L.nz_length;
    this.U.col_idx[n] = this.U.nz_length;
    for (k = 0; k < this.L.nz_length; ++k) {
      this.L.nz_rows[k] = this.pinv[this.L.nz_rows[k]];
    }
    return true;
  }
  AnumRows = 0;
  AnumCols = 0;
  setA(A) {
    this.AnumRows = A.numRows;
    this.AnumCols = A.numCols;
    return this.decompose(A);
  }
  decompose(A) {
    this.initialize(A);
    return this.performLU(A);
  }
  gx = new DGrowArray();
  gb = new DGrowArray();
  solve(B, X) {
    if (B.length !== this.AnumRows) {
      throw new Error("Unexpected number of rows in B based on shape of A. Found=" + B.length + " Expected=" + this.AnumRows);
    }
    const x = SparseLU.adjustD(this.gx, X.length);
    const b = SparseLU.adjustD(this.gb, B.length);
    const L = this.L;
    const U = this.U;
    for (let i = 0; i < B.length; i++) {
      b[i] = B[i];
    }
    SparseLU.permuteInv(this.pinv, b, x, X.length);
    SparseLU.solveL(L, x);
    SparseLU.solveU(U, x);
    for (let i = 0; i < X.length; i++) {
      X[i] = x[i];
    }
  }
  static solveColB(G, lower, B, colB, x, pinv, g_xi, w) {
    const X_rows = G.numCols;
    const xi = SparseLU.adjustI(g_xi, X_rows);
    const top = SparseLU.searchNzRowsInX(G, B, colB, pinv, xi, w);
    let idxB0;
    for (idxB0 = top; idxB0 < X_rows; ++idxB0) {
      x[xi[idxB0]] = 0;
    }
    idxB0 = B.col_idx[colB];
    const idxB1 = B.col_idx[colB + 1];
    let px;
    for (px = idxB0; px < idxB1; ++px) {
      x[B.nz_rows[px]] = B.nz_values[px];
    }
    for (px = top; px < X_rows; ++px) {
      const j = xi[px];
      const J = pinv !== null ? pinv[j] : j;
      if (J >= 0) {
        let p;
        let q;
        if (lower) {
          x[j] /= G.nz_values[G.col_idx[J]];
          p = G.col_idx[J] + 1;
          q = G.col_idx[J + 1];
        } else {
          x[j] /= G.nz_values[G.col_idx[J + 1] - 1];
          p = G.col_idx[J];
          q = G.col_idx[J + 1] - 1;
        }
        while (p < q) {
          const var10001 = G.nz_rows[p];
          x[var10001] -= G.nz_values[p] * x[j];
          ++p;
        }
      }
    }
    return top;
  }
  static searchNzRowsInX(G, B, colB, pinv, xi, w) {
    const X_rows = G.numCols;
    if (xi.length < X_rows) {
      throw new Error("xi must be at least G.numCols=" + G.numCols);
    } else if (w.length < 2 * X_rows) {
      throw new Error("w must be at least 2*G.numCols in length (2*number of rows in X) and first N elements must be zero");
    } else {
      const idx0 = B.col_idx[colB];
      const idx1 = B.col_idx[colB + 1];
      let top = X_rows;
      let i;
      for (i = idx0; i < idx1; ++i) {
        const rowB = B.nz_rows[i];
        if (rowB < X_rows && w[rowB] === 0) {
          top = SparseLU.searchNzRowsInX_DFS(rowB, G, top, pinv, xi, w);
        }
      }
      for (i = top; i < X_rows; ++i) {
        w[xi[i]] = 0;
      }
      return top;
    }
  }
  static searchNzRowsInX_DFS(rowB, G, top, pinv, xi, w) {
    const N = G.numCols;
    let head = 0;
    xi[head] = rowB;
    while (head >= 0) {
      const G_col = xi[head];
      const G_col_new = pinv !== null ? pinv[G_col] : G_col;
      if (w[G_col] === 0) {
        w[G_col] = 1;
        w[N + head] = G_col_new >= 0 && G_col_new < N ? G.col_idx[G_col_new] : 0;
      }
      let done = true;
      const idx0 = w[N + head];
      const idx1 = G_col_new >= 0 && G_col_new < N ? G.col_idx[G_col_new + 1] : 0;
      for (let j = idx0; j < idx1; ++j) {
        const jrow = G.nz_rows[j];
        if (jrow < N && w[jrow] === 0) {
          w[N + head] = j + 1;
          ++head;
          xi[head] = jrow;
          done = false;
          break;
        }
      }
      if (done) {
        --head;
        --top;
        xi[top] = G_col;
      }
    }
    return top;
  }
  static solveL(L, x) {
    const N = L.numCols;
    let idx0 = L.col_idx[0];
    for (let col = 0; col < N; ++col) {
      const idx1 = L.col_idx[col + 1];
      const x_j = x[col] /= L.nz_values[idx0];
      for (let i = idx0 + 1; i < idx1; ++i) {
        const row = L.nz_rows[i];
        x[row] -= L.nz_values[i] * x_j;
      }
      idx0 = idx1;
    }
  }
  static solveU(U, x) {
    const N = U.numCols;
    let idx1 = U.col_idx[N];
    for (let col = N - 1; col >= 0; --col) {
      const idx0 = U.col_idx[col];
      const x_j = x[col] /= U.nz_values[idx1 - 1];
      for (let i = idx0; i < idx1 - 1; ++i) {
        const row = U.nz_rows[i];
        x[row] -= U.nz_values[i] * x_j;
      }
      idx1 = idx0;
    }
  }
  static adjustIZero(gwork, desired, zeroToM) {
    const w = SparseLU.adjustI(gwork, desired);
    w.fill(0, 0, zeroToM);
    return w;
  }
  static adjustI(gwork, desired) {
    if (gwork === null) {
      gwork = new IGrowArray();
    }
    gwork.reshape(desired);
    return gwork.data;
  }
  static adjustD(gwork, desired) {
    if (gwork === null) {
      gwork = new DGrowArray();
    }
    gwork.reshape(desired);
    return gwork.data;
  }
  static permuteInv(perm, input, output, N) {
    for (let k = 0; k < N; ++k) {
      output[perm[k]] = input[k];
    }
  }
}

class CircuitMatrix {
  matrix = [];
  rightSide = [];
  origRightSide = [];
  origMatrix = [];
  permute = [];
  size = 0;
  nodeCount = 0;
  // number of node rows (vs rows come after)
  nonLinear = false;
  nodeVoltages = [];
  lastNodeVoltages = null;
  sparseLU = null;
  nodeList = [];
  voltageSourceList = [];
  // the entries stamped since clear(), as col*size+row; every other entry of
  // matrix and origMatrix is zero, so the sparse solver resets and converts only these
  // instead of all size*size entries
  stamped = [];
  stampedSorted = true;
  stampedFlags = new Uint8Array(0);
  clear() {
    const sz = this.size;
    this.matrix = Array.from({ length: sz }, () => new Array(sz).fill(0));
    this.origMatrix = Array.from({ length: sz }, () => new Array(sz).fill(0));
    this.stampedFlags = new Uint8Array(sz * sz);
    this.stamped = [];
    this.stampedSorted = true;
  }
  stamp(row, col, x) {
    this.matrix[row][col] += x;
    const k = col * this.size + row;
    if (!this.stampedFlags[k]) {
      this.stampedFlags[k] = 1;
      this.stamped.push(k);
      this.stampedSorted = false;
    }
  }
}

class CircuitNode {
  static ground;
  links = [];
  internal = false;
  index = 0;
  matrix = null;
  row = 0;
  // row in matrix (0 = ground/excluded)
  v = 0;
  toString() {
    return "node " + this.index;
  }
}
CircuitNode.ground = new CircuitNode();

class MinHeap {
  constructor(compare) {
    this.compare = compare;
  }
  compare;
  data = [];
  offer(item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }
  poll() {
    if (this.data.length === 0) return void 0;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  isEmpty() {
    return this.data.length === 0;
  }
  _bubbleUp(i) {
    while (i > 0) {
      const parent = i - 1 >> 1;
      if (this.compare(this.data[i], this.data[parent]) < 0) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else break;
    }
  }
  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.compare(this.data[l], this.data[smallest]) < 0) smallest = l;
      if (r < n && this.compare(this.data[r], this.data[smallest]) < 0) smallest = r;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}
class WireRouter {
  rows = 0;
  cols = 0;
  grid = null;
  static OBSTACLE = 1;
  static HORIZONTAL = 2;
  static VERTICAL = 4;
  static NONE = 0;
  static UP = 1;
  static DOWN = 2;
  static LEFT = 3;
  static RIGHT = 4;
  turnPenalty = 4;
  gridSize = 16;
  originX = 0;
  originY = 0;
  static lastRouter = null;
  static ESCAPE_BONUS = -0.4;
  constructor() {
    WireRouter.lastRouter = this;
  }
  setTurnPenalty(penalty) {
    this.turnPenalty = penalty;
  }
  addObstacle(px1OrPts, py1, px2, py2) {
    if (Array.isArray(px1OrPts)) {
      const pts = px1OrPts;
      let minX = pts[0].x, minY = pts[0].y, maxX = pts[0].x, maxY = pts[0].y;
      for (let i = 1; i < pts.length; i++) {
        if (pts[i].x < minX) minX = pts[i].x;
        if (pts[i].y < minY) minY = pts[i].y;
        if (pts[i].x > maxX) maxX = pts[i].x;
        if (pts[i].y > maxY) maxY = pts[i].y;
      }
      this.addObstacle(minX, minY, maxX, maxY);
      return;
    }
    let px1n = px1OrPts + this.gridSize / 2;
    let px2n = px2 + this.gridSize / 2;
    let py1n = py1 + this.gridSize / 2;
    let py2n = py2 + this.gridSize / 2;
    const r1 = (py1n - this.originY) / this.gridSize | 0;
    const c1 = (px1n - this.originX) / this.gridSize | 0;
    const r2 = (py2n - this.originY) / this.gridSize | 0;
    const c2 = (px2n - this.originX) / this.gridSize | 0;
    const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
    const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
    for (let c = minC; c <= maxC; c++)
      for (let r = minR; r <= maxR; r++)
        if (this.isValid(r, c))
          this.grid[r][c] |= WireRouter.OBSTACLE;
  }
  addObstaclePoint(px, py) {
    const r = (py - this.originY) / this.gridSize | 0;
    const c = (px - this.originX) / this.gridSize | 0;
    if (this.isValid(r, c))
      this.grid[r][c] |= WireRouter.OBSTACLE;
  }
  addWire(px1, py1, px2, py2) {
    const r1 = (py1 - this.originY) / this.gridSize | 0;
    const c1 = (px1 - this.originX) / this.gridSize | 0;
    const r2 = (py2 - this.originY) / this.gridSize | 0;
    const c2 = (px2 - this.originX) / this.gridSize | 0;
    const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
    const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
    if (r1 === r2) {
      for (let c = minC; c <= maxC; c++)
        if (this.isValid(r1, c))
          this.grid[r1][c] |= WireRouter.HORIZONTAL;
    } else {
      for (let r = minR; r <= maxR; r++)
        if (this.isValid(r, c1))
          this.grid[r][c1] |= WireRouter.VERTICAL;
    }
  }
  initGrid(wire, gridSize, elmList, bounds) {
    this.gridSize = gridSize;
    let minX = Math.min(wire.x, wire.x2);
    let minY = Math.min(wire.y, wire.y2);
    let maxX = Math.max(wire.x, wire.x2);
    let maxY = Math.max(wire.y, wire.y2);
    if (bounds !== null) {
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }
    const margin = 2;
    this.originX = (minX / this.gridSize | 0) * this.gridSize - margin * this.gridSize;
    this.originY = (minY / this.gridSize | 0) * this.gridSize - margin * this.gridSize;
    this.rows = (maxY - this.originY) / this.gridSize + 1 + margin * 2 | 0;
    this.cols = (maxX - this.originX) / this.gridSize + 1 + margin * 2 | 0;
    this.grid = [];
    for (let r = 0; r < this.rows; r++)
      this.grid.push(new Array(this.cols).fill(0));
    for (const ce of elmList) {
      if (wire === ce) continue;
      ce.addRoutingObstacle(this);
      for (let i = 0; i < ce.getPostCount(); i++) {
        const p = ce.getPost(i);
        this.addObstaclePoint(p.x, p.y);
      }
    }
    this.grid[(wire.y - this.originY) / this.gridSize | 0][(wire.x - this.originX) / this.gridSize | 0] = 0;
    this.grid[(wire.y2 - this.originY) / this.gridSize | 0][(wire.x2 - this.originX) / this.gridSize | 0] = 0;
  }
  dr(dir) {
    if (dir === WireRouter.UP) return -1;
    if (dir === WireRouter.DOWN) return 1;
    return 0;
  }
  dc(dir) {
    if (dir === WireRouter.LEFT) return -1;
    if (dir === WireRouter.RIGHT) return 1;
    return 0;
  }
  getPreferredEscapeDirections(r, c) {
    const prefs = [];
    if (!this.canMoveTo(r - 1, c, WireRouter.UP)) prefs.push(WireRouter.DOWN);
    if (!this.canMoveTo(r + 1, c, WireRouter.DOWN)) prefs.push(WireRouter.UP);
    if (!this.canMoveTo(r, c - 1, WireRouter.LEFT)) prefs.push(WireRouter.RIGHT);
    if (!this.canMoveTo(r, c + 1, WireRouter.RIGHT)) prefs.push(WireRouter.LEFT);
    return prefs;
  }
  tryPatternRouting(startR, startC, goalR, goalC) {
    if (startR === goalR && startC === goalC) {
      return [new Point(startC * this.gridSize + this.originX, startR * this.gridSize + this.originY)];
    }
    const startPrefs = this.getPreferredEscapeDirections(startR, startC);
    let bestCost = Infinity;
    let bestCorners = null;
    const tryPath = (path, initialDir) => {
      const cost = this.evaluatePath(path, initialDir, startPrefs);
      if (cost >= 0 && cost < bestCost) {
        bestCost = cost;
        bestCorners = path;
      }
    };
    if (startR !== goalR && startC !== goalC) {
      tryPath(
        [[startR, startC], [startR, goalC], [goalR, goalC]],
        goalC > startC ? WireRouter.RIGHT : WireRouter.LEFT
      );
      tryPath(
        [[startR, startC], [goalR, startC], [goalR, goalC]],
        goalR > startR ? WireRouter.DOWN : WireRouter.UP
      );
    } else if (startR === goalR) {
      tryPath(
        [[startR, startC], [goalR, goalC]],
        goalC > startC ? WireRouter.RIGHT : WireRouter.LEFT
      );
    } else {
      tryPath(
        [[startR, startC], [goalR, goalC]],
        goalR > startR ? WireRouter.DOWN : WireRouter.UP
      );
    }
    const maxDetour = 5;
    if (startR !== goalR) {
      for (let margin = 1; margin <= maxDetour; margin++) {
        for (const side of [-1, 1]) {
          for (const base of [startC, goalC]) {
            const detourCol = base + side * margin;
            if (!this.isValid(0, detourCol)) continue;
            const z = [[startR, startC]];
            if (startC !== detourCol) z.push([startR, detourCol]);
            if (startR !== goalR) z.push([goalR, detourCol]);
            if (detourCol !== goalC) z.push([goalR, goalC]);
            if (z.length >= 2)
              tryPath(z, detourCol > startC ? WireRouter.RIGHT : WireRouter.LEFT);
          }
        }
      }
    }
    if (startC !== goalC) {
      for (let margin = 1; margin <= maxDetour; margin++) {
        for (const side of [-1, 1]) {
          for (const base of [startR, goalR]) {
            const detourRow = base + side * margin;
            if (!this.isValid(detourRow, 0)) continue;
            const z = [[startR, startC]];
            if (startR !== detourRow) z.push([detourRow, startC]);
            if (startC !== goalC) z.push([detourRow, goalC]);
            if (detourRow !== goalR) z.push([goalR, goalC]);
            if (z.length >= 2)
              tryPath(z, detourRow > startR ? WireRouter.DOWN : WireRouter.UP);
          }
        }
      }
    }
    if (bestCorners === null) return [];
    return this.pixelsFromGridPoints(bestCorners);
  }
  evaluatePath(corners, initialDir, startPrefs) {
    if (corners.length < 2) return -1;
    let cost = 0;
    let prevDir = WireRouter.NONE;
    let prev = corners[0];
    for (let i = 1; i < corners.length; i++) {
      const curr = corners[i];
      const dr = curr[0] - prev[0];
      const dc = curr[1] - prev[1];
      const steps = Math.max(Math.abs(dr), Math.abs(dc));
      if (steps === 0) continue;
      let moveDir;
      if (dr === 0 && dc > 0) moveDir = WireRouter.RIGHT;
      else if (dr === 0 && dc < 0) moveDir = WireRouter.LEFT;
      else if (dc === 0 && dr > 0) moveDir = WireRouter.DOWN;
      else if (dc === 0 && dr < 0) moveDir = WireRouter.UP;
      else return -1;
      let r = prev[0], c = prev[1];
      for (let s = 0; s < steps; s++) {
        r += Math.sign(dr);
        c += Math.sign(dc);
        if (!this.isValid(r, c) || !this.canMoveTo(r, c, moveDir))
          return -1;
      }
      cost += steps;
      if (prevDir !== WireRouter.NONE && moveDir !== prevDir && moveDir !== this.opposite(prevDir))
        cost += this.turnPenalty;
      prevDir = moveDir;
      prev = curr;
    }
    for (const p of startPrefs) {
      if (p === initialDir) {
        cost += WireRouter.ESCAPE_BONUS;
        break;
      }
    }
    return cost;
  }
  pixelsFromGridPoints(gridPoints) {
    return gridPoints.map((g) => new Point(g[1] * this.gridSize + this.originX, g[0] * this.gridSize + this.originY));
  }
  routeWire(px1, py1, px2, py2) {
    const startR = (py1 - this.originY) / this.gridSize | 0;
    const startC = (px1 - this.originX) / this.gridSize | 0;
    const goalR = (py2 - this.originY) / this.gridSize | 0;
    const goalC = (px2 - this.originX) / this.gridSize | 0;
    if (!this.isValid(startR, startC) || !this.isValid(goalR, goalC))
      return [];
    if (!this.canMoveTo(goalR, goalC, WireRouter.UP) && !this.canMoveTo(goalR, goalC, WireRouter.DOWN) && !this.canMoveTo(goalR, goalC, WireRouter.LEFT) && !this.canMoveTo(goalR, goalC, WireRouter.RIGHT))
      return [];
    const patternPath = this.tryPatternRouting(startR, startC, goalR, goalC);
    if (patternPath.length > 0) {
      console.log("pattern");
      return patternPath;
    }
    console.log("A*");
    const openSet = new MinHeap((a, b) => a.fScore - b.fScore);
    const gScore = /* @__PURE__ */ new Map();
    const cameFrom = /* @__PURE__ */ new Map();
    const startPrefs = this.getPreferredEscapeDirections(startR, startC);
    for (const d of [WireRouter.UP, WireRouter.DOWN, WireRouter.LEFT, WireRouter.RIGHT]) {
      if (!this.canMoveTo(startR + this.dr(d), startC + this.dc(d), d)) continue;
      let initG = 0;
      if (startPrefs.includes(d)) initG += WireRouter.ESCAPE_BONUS;
      const key = this.key(startR, startC, d);
      const h = this.manhattan(startR, startC, goalR, goalC);
      openSet.offer({ r: startR, c: startC, dir: d, gScore: initG, fScore: initG + h });
      gScore.set(key, initG);
    }
    let bestGoalNode = null;
    while (!openSet.isEmpty()) {
      const current = openSet.poll();
      const currKey = this.key(current.r, current.c, current.dir);
      if (current.gScore > (gScore.get(currKey) ?? Infinity)) continue;
      if (current.r === goalR && current.c === goalC) {
        if (bestGoalNode === null || current.gScore < bestGoalNode.gScore)
          bestGoalNode = current;
      }
      for (const neigh of this.neighbors(current.r, current.c)) {
        const nr = neigh[0], nc = neigh[1], moveDir = neigh[2];
        if (!this.canMoveTo(nr, nc, moveDir)) continue;
        let moveCost = 1;
        if (current.dir !== WireRouter.NONE && moveDir !== current.dir && moveDir !== this.opposite(current.dir))
          moveCost += this.turnPenalty;
        const nKey = this.key(nr, nc, moveDir);
        const tentG = current.gScore + moveCost;
        if (tentG < (gScore.get(nKey) ?? Infinity)) {
          cameFrom.set(nKey, currKey);
          gScore.set(nKey, tentG);
          const h = this.manhattan(nr, nc, goalR, goalC);
          openSet.offer({ r: nr, c: nc, dir: moveDir, gScore: tentG, fScore: tentG + h });
        }
      }
    }
    if (bestGoalNode === null) return [];
    const fullPath = [];
    let currentKey = this.key(bestGoalNode.r, bestGoalNode.c, bestGoalNode.dir);
    while (currentKey !== void 0) {
      const pos = this.parseKey(currentKey);
      fullPath.unshift([pos[0], pos[1]]);
      currentKey = cameFrom.get(currentKey);
    }
    const compressed = this.compressPath(fullPath);
    return compressed.map((pt) => new Point(pt[1] * this.gridSize + this.originX, pt[0] * this.gridSize + this.originY));
  }
  compressPath(fullPath) {
    if (fullPath.length <= 2) return [...fullPath];
    const minimal = [fullPath[0]];
    for (let i = 1; i < fullPath.length - 1; i++) {
      const a = fullPath[i - 1], b = fullPath[i], c = fullPath[i + 1];
      const dx1 = b[1] - a[1], dy1 = b[0] - a[0];
      const dx2 = c[1] - b[1], dy2 = c[0] - b[0];
      const collinear = dx1 * dy2 - dy1 * dx2 === 0 && dx1 * dx2 + dy1 * dy2 > 0;
      if (!collinear) minimal.push(b);
    }
    const last = fullPath[fullPath.length - 1];
    const prev = minimal[minimal.length - 1];
    if (prev[0] !== last[0] || prev[1] !== last[1]) minimal.push(last);
    return minimal;
  }
  placeWire(path) {
    if (path.length < 2) return;
    const s = path[0], e = path[path.length - 1];
    this.grid[s[0]][s[1]] |= WireRouter.HORIZONTAL | WireRouter.VERTICAL;
    this.grid[e[0]][e[1]] |= WireRouter.HORIZONTAL | WireRouter.VERTICAL;
    let prevDir = WireRouter.NONE;
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1], curr = path[i];
      const dr = curr[0] - prev[0], dc = curr[1] - prev[1];
      const thisDir = this.getMoveDir(dr, dc);
      const flag = thisDir === WireRouter.LEFT || thisDir === WireRouter.RIGHT ? WireRouter.HORIZONTAL : WireRouter.VERTICAL;
      this.grid[curr[0]][curr[1]] |= flag;
      if (prevDir !== WireRouter.NONE && thisDir !== prevDir && thisDir !== this.opposite(prevDir))
        this.grid[prev[0]][prev[1]] |= WireRouter.HORIZONTAL | WireRouter.VERTICAL;
      prevDir = thisDir;
    }
  }
  isValid(r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }
  canMoveTo(r, c, moveDir) {
    if (!this.isValid(r, c)) return false;
    const cell = this.grid[r][c];
    if ((cell & WireRouter.OBSTACLE) !== 0) return false;
    const flag = moveDir === WireRouter.LEFT || moveDir === WireRouter.RIGHT ? WireRouter.HORIZONTAL : WireRouter.VERTICAL;
    return (cell & flag) === 0;
  }
  getMoveDir(dr, dc) {
    if (dr === -1) return WireRouter.UP;
    if (dr === 1) return WireRouter.DOWN;
    if (dc === -1) return WireRouter.LEFT;
    if (dc === 1) return WireRouter.RIGHT;
    return WireRouter.NONE;
  }
  opposite(d) {
    if (d === WireRouter.UP) return WireRouter.DOWN;
    if (d === WireRouter.DOWN) return WireRouter.UP;
    if (d === WireRouter.LEFT) return WireRouter.RIGHT;
    if (d === WireRouter.RIGHT) return WireRouter.LEFT;
    return WireRouter.NONE;
  }
  manhattan(r1, c1, r2, c2) {
    return Math.abs(r1 - r2) + Math.abs(c1 - c2);
  }
  neighbors(r, c) {
    const list = [];
    if (r > 0) list.push([r - 1, c, WireRouter.UP]);
    if (r < this.rows - 1) list.push([r + 1, c, WireRouter.DOWN]);
    if (c > 0) list.push([r, c - 1, WireRouter.LEFT]);
    if (c < this.cols - 1) list.push([r, c + 1, WireRouter.RIGHT]);
    return list;
  }
  key(r, c, d) {
    return r + "," + c + "," + d;
  }
  parseKey(key) {
    const parts = key.split(",");
    return [parseIntStrict(parts[0]), parseIntStrict(parts[1]), parseIntStrict(parts[2])];
  }
  drawGrid(ctx, showGridLines) {
    if (this.grid === null || this.rows === 0 || this.cols === 0) return;
    ctx.save();
    ctx.translate(-this.gridSize / 2, -this.gridSize / 2);
    if (showGridLines) {
      ctx.strokeStyle = "#222244";
      ctx.lineWidth = 0.5;
      for (let r = 0; r < this.rows; r++) {
        const y = this.originY + r * this.gridSize;
        ctx.beginPath();
        ctx.moveTo(this.originX, y);
        ctx.lineTo(this.originX + this.cols * this.gridSize, y);
        ctx.stroke();
      }
      for (let c = 0; c < this.cols; c++) {
        const x = this.originX + c * this.gridSize;
        ctx.beginPath();
        ctx.moveTo(x, this.originY);
        ctx.lineTo(x, this.originY + this.rows * this.gridSize);
        ctx.stroke();
      }
    }
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const x = this.originX + c * this.gridSize;
        const y = this.originY + r * this.gridSize;
        const size = this.gridSize;
        if ((cell & WireRouter.OBSTACLE) !== 0) {
          ctx.fillStyle = "#88ccff";
          ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
          continue;
        }
        const hasHoriz = (cell & WireRouter.HORIZONTAL) !== 0;
        const hasVert = (cell & WireRouter.VERTICAL) !== 0;
        if (hasHoriz || hasVert) {
          ctx.strokeStyle = "#88ccff";
          ctx.lineWidth = 2.2;
          const midX = x + size / 2;
          const midY = y + size / 2;
          if (hasHoriz) {
            ctx.beginPath();
            ctx.moveTo(x + 2, midY);
            ctx.lineTo(x + size - 2, midY);
            ctx.stroke();
          }
          if (hasVert) {
            ctx.beginPath();
            ctx.moveTo(midX, y + 2);
            ctx.lineTo(midX, y + size - 2);
            ctx.stroke();
          }
          if (hasHoriz && hasVert) {
            ctx.fillStyle = "#44aaff";
            ctx.beginPath();
            ctx.arc(midX, midY, 3.5, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }
    }
    ctx.fillStyle = "rgba(255, 180, 60, 0.4)";
    ctx.fillRect(this.originX - 4, this.originY - 4, 8, 8);
    ctx.restore();
  }
}

const scriptRel = 'modulepreload';const assetsURL = function(dep, importerUrl) { return new URL(dep, importerUrl).href };const seen = {};const __vitePreload = function preload(baseModule, deps, importerUrl) {
	let promise = Promise.resolve();
	if (true               && deps && deps.length > 0) {
		const links = document.getElementsByTagName("link");
		const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
		const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
		function allSettled(promises$2) {
			return Promise.all(promises$2.map((p) => Promise.resolve(p).then((value$1) => ({
				status: "fulfilled",
				value: value$1
			}), (reason) => ({
				status: "rejected",
				reason
			}))));
		}
		promise = allSettled(deps.map((dep) => {
			dep = assetsURL(dep, importerUrl);
			if (dep in seen) return;
			seen[dep] = true;
			const isCss = dep.endsWith(".css");
			const cssSelector = isCss ? "[rel=\"stylesheet\"]" : "";
			if (!!importerUrl) for (let i$1 = links.length - 1; i$1 >= 0; i$1--) {
				const link$1 = links[i$1];
				if (link$1.href === dep && (!isCss || link$1.rel === "stylesheet")) return;
			}
			else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) return;
			const link = document.createElement("link");
			link.rel = isCss ? "stylesheet" : scriptRel;
			if (!isCss) link.as = "script";
			link.crossOrigin = "";
			link.href = dep;
			if (cspNonce) link.setAttribute("nonce", cspNonce);
			document.head.appendChild(link);
			if (isCss) return new Promise((res, rej) => {
				link.addEventListener("load", res);
				link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
			});
		}));
	}
	function handlePreloadError(err$2) {
		const e$1 = new Event("vite:preloadError", { cancelable: true });
		e$1.payload = err$2;
		window.dispatchEvent(e$1);
		if (!e$1.defaultPrevented) throw err$2;
	}
	return promise.then((res) => {
		for (const item of res || []) {
			if (item.status !== "rejected") continue;
			handlePreloadError(item.reason);
		}
		return baseModule().catch(handlePreloadError);
	});
};

const url = import.meta.url;
const moduleBaseURL = url.substring(0, url.lastIndexOf("/") + 1);

class Locale {
  static ohmString = "Ω";
  static muString = "μ";
  static localizationMap = /* @__PURE__ */ new Map();
  static LS(s) {
    if (s == null)
      return s;
    if (s.length === 0)
      return s;
    const sm = Locale.localizationMap.get(s);
    if (sm != null)
      return sm;
    const ix = s.indexOf("~");
    if (ix !== s.length - 1)
      return s;
    s = s.substring(0, ix);
    const sm2 = Locale.localizationMap.get(s);
    if (sm2 != null)
      return sm2;
    return s;
  }
  static weAreInUS(orCanada) {
    try {
      const languages = navigator.languages;
      const l = (languages && languages.length > 0 ? languages[0] : navigator.language) || "";
      if (l.length > 2) {
        const region = l.slice(-2).toUpperCase();
        return region === "US" || region === "CA" && orCanada;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  static weAreInGermany() {
    try {
      const languages = navigator.languages;
      const l = (languages && languages.length > 0 ? languages[0] : navigator.language) || "";
      return l.toUpperCase().startsWith("DE");
    } catch (e) {
      return false;
    }
  }
  // Ported from circuitjs1.java: circuitjs1.language()
  static language() {
    const nav = navigator;
    if (nav.languages) {
      if (nav.languages.length > 0)
        return nav.languages[0];
      else
        return "en-US";
    } else {
      return nav.language || nav.userLanguage;
    }
  }
  // Ported from circuitjs1.java: circuitjs1.convertUnicodeEscapes()
  static convertUnicodeEscapes(input) {
    if (input.indexOf("\\u") < 0)
      return input;
    let result = "";
    const length = input.length;
    let i = 0;
    while (i < length) {
      if (i + 5 < length && input.charAt(i) === "\\" && input.charAt(i + 1) === "u") {
        const hexCode = input.substring(i + 2, i + 6);
        const codePoint = parseIntStrict(hexCode, 16);
        if (!isNaN(codePoint)) {
          result += String.fromCharCode(codePoint);
          i += 6;
        } else {
          result += "\\u" + hexCode;
          i += 6;
        }
      } else {
        result += input.charAt(i);
        i++;
      }
    }
    return result;
  }
  // Ported from circuitjs1.java: circuitjs1.processLocale()
  static processLocale(data) {
    const localizationMap = /* @__PURE__ */ new Map();
    const lines = data.split(/\r?\n/);
    for (let i = 0; i !== lines.length; i++) {
      let line = lines[i];
      if (line.length === 0)
        continue;
      if (line.charAt(0) !== '"') {
        console.log("ignoring line in string catalog: " + line);
        continue;
      }
      line = Locale.convertUnicodeEscapes(line);
      const q2 = line.indexOf('"', 1);
      if (q2 < 0 || line.charAt(q2 + 1) !== "=" || line.charAt(q2 + 2) !== '"' || line.charAt(line.length - 1) !== '"') {
        console.log("ignoring line in string catalog: " + line);
        continue;
      }
      const str1 = line.substring(1, q2);
      const str2 = line.substring(q2 + 3, line.length - 1);
      localizationMap.set(str1, str2);
    }
    return localizationMap;
  }
  // Ported from circuitjs1.java: circuitjs1.loadLocale()
  static async load() {
    const qp = new URLSearchParams(window.location.search);
    let lang = qp.get("lang");
    if (lang == null) {
      let stor = null;
      try {
        stor = window.localStorage;
      } catch (e) {
      }
      if (stor != null)
        lang = stor.getItem("language");
      if (lang == null)
        lang = Locale.language();
    }
    console.log("got language " + lang);
    if (lang.toLowerCase() === "zh-tw" || lang.toLowerCase() === "zh-cht")
      lang = "zh-tw";
    else
      lang = lang.replace(/-.*/, "");
    if (lang.startsWith("en")) {
      Locale.localizationMap = /* @__PURE__ */ new Map();
      return;
    }
    const url = moduleBaseURL + "locale/locale_" + lang + ".txt";
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        Locale.localizationMap = Locale.processLocale(text);
      } else {
        console.log("Bad file server response: " + response.statusText);
        Locale.localizationMap = /* @__PURE__ */ new Map();
      }
    } catch (e) {
      console.log("failed file reading", e);
      Locale.localizationMap = /* @__PURE__ */ new Map();
    }
  }
}

class CommandPaletteHistory {
  static MAX = 10;
  static KEY = "commandPaletteHistory";
  static record(id) {
    if (id == null || id.length === 0)
      return;
    const ids = CommandPaletteHistory.load();
    const existing = ids.indexOf(id);
    if (existing >= 0)
      ids.splice(existing, 1);
    ids.unshift(id);
    while (ids.length > CommandPaletteHistory.MAX)
      ids.pop();
    CommandPaletteHistory.save(ids);
  }
  static getRecentIds() {
    const ids = CommandPaletteHistory.load();
    CommandPaletteHistory.pruneStale(ids);
    return ids;
  }
  // Drop ids that no longer exist in CommandPaletteRegistry (e.g. after palette changes).
  static pruneStale(ids) {
    let changed = false;
    for (let i = ids.length - 1; i >= 0; i--) {
      if (CommandPaletteRegistry.get(ids[i]) == null) {
        ids.splice(i, 1);
        changed = true;
      }
    }
    if (changed)
      CommandPaletteHistory.save(ids);
  }
  static save(ids) {
    try {
      localStorage.setItem(CommandPaletteHistory.KEY, ids.join("\n"));
    } catch (e) {
    }
  }
  static load() {
    try {
      const s = localStorage.getItem(CommandPaletteHistory.KEY);
      if (s == null || s.length === 0)
        return [];
      return s.split("\n").filter((p) => p.length > 0);
    } catch (e) {
      return [];
    }
  }
}

class PaletteCommand {
  id;
  label;
  category;
  keywords;
  menu;
  item;
  custom;
  hint;
  constructor(init) {
    this.id = init.id;
    this.label = init.label;
    this.category = init.category;
    this.keywords = init.keywords;
    this.menu = init.menu ?? null;
    this.item = init.item ?? null;
    this.custom = init.custom ?? null;
    this.hint = init.hint ?? null;
  }
  searchText() {
    return (this.label + " " + this.category + " " + this.keywords).toLowerCase();
  }
}
class ScoredCommand {
  constructor(cmd, score) {
    this.cmd = cmd;
    this.score = score;
  }
  cmd;
  score;
}
class CommandPaletteRegistry {
  static commands = [];
  // Kept separate so hundreds of example circuits don't appear until the user types
  // at least MIN_CIRCUIT_QUERY_LEN characters.
  static circuitCommands = [];
  static byId = /* @__PURE__ */ new Map();
  static MIN_CIRCUIT_QUERY_LEN = 2;
  static clear() {
    CommandPaletteRegistry.commands = [];
    CommandPaletteRegistry.circuitCommands = [];
    CommandPaletteRegistry.byId.clear();
  }
  static addCommand(cmd) {
    if (CommandPaletteRegistry.byId.has(cmd.id))
      return;
    CommandPaletteRegistry.commands.push(cmd);
    CommandPaletteRegistry.byId.set(cmd.id, cmd);
  }
  static add(id, label, category, keywords, menu, item) {
    CommandPaletteRegistry.addCommand(new PaletteCommand({ id, label, category, keywords, menu, item }));
  }
  static addToggle(id, label, category, keywords, custom) {
    CommandPaletteRegistry.addCommand(new PaletteCommand({ id, label, category, keywords, custom }));
  }
  static get(id) {
    return CommandPaletteRegistry.byId.get(id);
  }
  // Called from UIManager.init() after menus.init() so mainMenuItems is populated.
  static buildStatic(app) {
    CommandPaletteRegistry.clear();
    const ui = app.ui;
    const m = app.menus;
    for (let i = 0; i !== ui.mainMenuItems.length; i++) {
      const item = ui.mainMenuItems[i];
      const cls = ui.mainMenuItemNames[i];
      const name = item.getLabel();
      const label = Locale.LS("Mode: ") + name;
      let kw = cls + " " + name;
      const sc = item.getShortcut();
      if (sc != null && sc.length === 1)
        kw += " " + sc;
      CommandPaletteRegistry.add("main:" + cls, label, "Mode", kw, "main", cls);
    }
    const cm = m.ctrlMetaKey;
    CommandPaletteRegistry.add("file:newblankcircuit", "New Blank Circuit", "File", "new blank", "file", "newblankcircuit");
    CommandPaletteRegistry.add("file:importfromtext", "Import From Text...", "File", "import text", "file", "importfromtext");
    CommandPaletteRegistry.add("file:importfromdropbox", "Import From Dropbox...", "File", "import dropbox", "file", "importfromdropbox");
    if (CirSim.isElectron()) {
      CommandPaletteRegistry.add("file:save", "Save", "File", "save " + cm + "S", "file", "save");
      CommandPaletteRegistry.add("file:saveas", "Save As...", "File", "save export", "file", "saveas");
    } else {
      CommandPaletteRegistry.add("file:exportaslocalfile", "Save As...", "File", "save export " + cm + "S", "file", "exportaslocalfile");
    }
    CommandPaletteRegistry.add("file:exportasurl", "Export As Link...", "File", "export url link share", "file", "exportasurl");
    CommandPaletteRegistry.add("file:exportastext", "Export As Text...", "File", "export text", "file", "exportastext");
    CommandPaletteRegistry.add("file:exportasimage", "Save As Image...", "File", "export image png", "file", "exportasimage");
    CommandPaletteRegistry.add("file:copypng", "Copy Circuit Image to Clipboard", "File", "copy image clipboard png", "file", "copypng");
    CommandPaletteRegistry.add("file:exportassvg", "Save As SVG...", "File", "export svg vector", "file", "exportassvg");
    CommandPaletteRegistry.add("file:createsubcircuit", "Create Subcircuit...", "File", "subcircuit create", "file", "createsubcircuit");
    CommandPaletteRegistry.add("file:dcanalysis", "Find DC Operating Point", "File", "dc analysis operating point", "file", "dcanalysis");
    CommandPaletteRegistry.add("file:recover", "Recover Auto-Save", "File", "recover autosave restore", "file", "recover");
    CommandPaletteRegistry.add("file:print", "Print...", "File", "print " + cm + "P", "file", "print");
    CommandPaletteRegistry.add("view:fullscreen", "Toggle Full Screen", "View", "fullscreen", "view", "fullscreen");
    CommandPaletteRegistry.add("file:about", "About...", "File", "about help", "file", "about");
    CommandPaletteRegistry.add("edit:undo", "Undo", "Edit", "undo " + cm + "Z", "edit", "undo");
    CommandPaletteRegistry.add("edit:redo", "Redo", "Edit", "redo " + cm + "Y", "edit", "redo");
    CommandPaletteRegistry.add("edit:cut", "Cut", "Edit", "cut " + cm + "X", "edit", "cut");
    CommandPaletteRegistry.add("edit:copy", "Copy", "Edit", "copy " + cm + "C", "edit", "copy");
    CommandPaletteRegistry.add("edit:paste", "Paste", "Edit", "paste " + cm + "V", "edit", "paste");
    CommandPaletteRegistry.add("edit:duplicate", "Duplicate", "Edit", "duplicate clone " + cm + "D", "edit", "duplicate");
    CommandPaletteRegistry.add("edit:selectAll", "Select All", "Edit", "select all " + cm + "A", "edit", "selectAll");
    CommandPaletteRegistry.add("edit:search", "Find Component/Command...", "Edit", "find component search command palette /", "edit", "search");
    CommandPaletteRegistry.add("edit:centercircuit", Locale.weAreInUS(false) ? "Center Circuit" : "Centre Circuit", "Edit", "center centre fit", "edit", "centercircuit");
    CommandPaletteRegistry.add("zoom:zoom100", "Zoom 100%", "View", "zoom reset 0", "zoom", "zoom100");
    CommandPaletteRegistry.add("zoom:zoomin", "Zoom In", "View", "zoom in +", "zoom", "zoomin");
    CommandPaletteRegistry.add("zoom:zoomout", "Zoom Out", "View", "zoom out -", "zoom", "zoomout");
    CommandPaletteRegistry.add("edit:mirrorX", "Mirror X", "Edit", "mirror flip x", "edit", "mirrorX");
    CommandPaletteRegistry.add("edit:mirrorY", "Mirror Y", "Edit", "mirror flip y", "edit", "mirrorY");
    CommandPaletteRegistry.add("edit:rotateCCW", "Rotate CCW", "Edit", "rotate counterclockwise ccw", "edit", "rotateCCW");
    CommandPaletteRegistry.add("edit:rotateCW", "Rotate CW", "Edit", "rotate clockwise cw", "edit", "rotateCW");
    CommandPaletteRegistry.add("scopes:stackAll", "Stack All", "Scopes", "stack scopes", "scopes", "stackAll");
    CommandPaletteRegistry.add("scopes:unstackAll", "Unstack All", "Scopes", "unstack scopes", "scopes", "unstackAll");
    CommandPaletteRegistry.add("scopes:combineAll", "Combine All", "Scopes", "combine scopes merge", "scopes", "combineAll");
    CommandPaletteRegistry.add("scopes:separateAll", "Separate All", "Scopes", "separate scopes split", "scopes", "separateAll");
    CommandPaletteRegistry.add("tools:convertWires", "Convert Wires to Routed Wires", "Tools", "convert wires routed", "tools", "convertWires");
    CommandPaletteRegistry.add("tools:subcircuits", "Subcircuit Manager", "Tools", "subcircuit manager", "tools", "subcircuits");
    CommandPaletteRegistry.add("key:runstop", "Run/Stop Simulation", "Simulation", "run stop pause start simulation", "key", "runstop");
    const dots = m.dotsCheckItem;
    CommandPaletteRegistry.addToggle("options:showcurrent", "Show Current", "Options", "current dots flow", {
      execute: () => {
        dots.toggle();
        app.repaint();
      }
    });
    const volts = m.voltsCheckItem;
    const power = m.powerCheckItem;
    CommandPaletteRegistry.addToggle("options:showvoltage", "Show Voltage", "Options", "voltage power bar", {
      execute: () => {
        volts.setState(!volts.getState());
        if (volts.getState())
          power.setState(false);
        app.setPowerBarEnable();
      }
    });
    CommandPaletteRegistry.addToggle("options:showpower", "Show Power", "Options", "power bar watt", {
      execute: () => {
        power.setState(!power.getState());
        if (power.getState())
          volts.setState(false);
        app.setPowerBarEnable();
      }
    });
    const showValues = m.showValuesCheckItem;
    CommandPaletteRegistry.addToggle("options:showvalues", "Show Values", "Options", "values labels", {
      execute: () => {
        showValues.toggle();
        app.repaint();
      }
    });
    const smallGrid = m.smallGridCheckItem;
    CommandPaletteRegistry.addToggle("options:smallgrid", "Small Grid", "Options", "grid snap", {
      execute: () => {
        smallGrid.toggle();
        app.setGrid();
      }
    });
    const toolbar = m.toolbarCheckItem;
    CommandPaletteRegistry.addToggle("options:toolbar", "Toolbar", "Options", "toolbar show hide", {
      execute: () => {
        toolbar.toggle();
        app.setToolbar();
      }
    });
    const crossHair = m.crossHairCheckItem;
    CommandPaletteRegistry.addToggle("options:crosshair", "Show Cursor Crosshair", "Options", "crosshair cursor", {
      execute: () => {
        crossHair.toggle();
        app.setOptionInStorage("crossHair", crossHair.getState());
      }
    });
    const euroRes = m.euroResistorCheckItem;
    CommandPaletteRegistry.addToggle("options:euroresistors", "European Resistors", "Options", "european resistors iec", {
      execute: () => {
        euroRes.toggle();
        app.repaint();
      }
    });
    const showOhm = m.showOhmCheckItem;
    CommandPaletteRegistry.addToggle("options:showohm", "Show Ω Unit", "Options", "ohm unit omega", {
      execute: () => {
        showOhm.toggle();
        app.repaint();
      }
    });
    const euroGates = m.euroGatesCheckItem;
    CommandPaletteRegistry.addToggle("options:eurogates", "IEC Gates", "Options", "iec gates logic", {
      execute: () => {
        euroGates.toggle();
        app.repaint();
      }
    });
    const printable = m.printableCheckItem;
    CommandPaletteRegistry.addToggle("options:whitebackground", "White Background", "Options", "white background printable", {
      execute: () => {
        printable.toggle();
        app.repaint();
      }
    });
    const convention = m.conventionCheckItem;
    CommandPaletteRegistry.addToggle("options:conventionalcurrent", "Conventional Current Motion", "Options", "conventional current", {
      execute: () => {
        convention.toggle();
        app.repaint();
      }
    });
    const noEdit = m.noEditCheckItem;
    CommandPaletteRegistry.addToggle("options:disableediting", "Disable Editing", "Options", "disable editing readonly", {
      execute: () => {
        noEdit.toggle();
      }
    });
    const mouseWheelEdit = m.mouseWheelEditCheckItem;
    CommandPaletteRegistry.addToggle("options:mousewheeledit", "Edit Values With Mouse Wheel", "Options", "mouse wheel edit values", {
      execute: () => {
        mouseWheelEdit.setState(!mouseWheelEdit.getState());
        app.setOptionInStorage("mouseWheelEdit", mouseWheelEdit.getState());
      }
    });
    CommandPaletteRegistry.add("options:shortcuts", "Shortcuts...", "Options", "keyboard shortcuts keys", "options", "shortcuts");
    CommandPaletteRegistry.add("options:other", "Other Options...", "Options", "options settings preferences", "options", "other");
    if (CirSim.isElectron())
      CommandPaletteRegistry.add("options:devtools", "Toggle Dev Tools", "Options", "developer tools debug", "options", "devtools");
  }
  // Called from Menus.processSetupList() for each circuit entry in setuplist.txt.
  static registerCircuit(file, title, submenuPath) {
    const label = Locale.LS("Circuit: ") + title;
    const id = "circuits:" + file;
    if (CommandPaletteRegistry.byId.has(id))
      return;
    let stem = file;
    const dot = stem.lastIndexOf(".");
    if (dot > 0)
      stem = stem.substring(0, dot);
    let kw = stem + " " + title;
    if (submenuPath != null && submenuPath.length > 0)
      kw += " " + submenuPath;
    const cmd = new PaletteCommand({
      id,
      label,
      category: "Circuits",
      keywords: kw,
      menu: "circuits",
      item: "setup " + file + " " + title,
      hint: submenuPath != null && submenuPath.length > 0 ? submenuPath : void 0
    });
    CommandPaletteRegistry.circuitCommands.push(cmd);
    CommandPaletteRegistry.byId.set(id, cmd);
  }
  // Substring matches rank above scattered-character (fuzzy) matches.
  static fuzzyScore(query, cmd) {
    if (query.length === 0)
      return 1;
    const target = cmd.searchText();
    const idx = target.indexOf(query);
    if (idx >= 0)
      return 1e3 - idx + query.length * 10;
    let qi = 0;
    let score = 0;
    let lastMatch = -2;
    for (let ti = 0; ti < target.length && qi < query.length; ti++) {
      if (target.charAt(ti) === query.charAt(qi)) {
        score += lastMatch === ti - 1 ? 10 : 1;
        lastMatch = ti;
        qi++;
      }
    }
    if (qi !== query.length)
      return 0;
    return score;
  }
  static search(query, maxResults) {
    const q = query.toLowerCase().trim();
    const scored = [];
    for (const cmd of CommandPaletteRegistry.commands) {
      const score = CommandPaletteRegistry.fuzzyScore(q, cmd);
      if (score > 0)
        scored.push(new ScoredCommand(cmd, score));
    }
    if (q.length >= CommandPaletteRegistry.MIN_CIRCUIT_QUERY_LEN) {
      for (const cmd of CommandPaletteRegistry.circuitCommands) {
        const score = CommandPaletteRegistry.fuzzyScore(q, cmd);
        if (score > 0)
          scored.push(new ScoredCommand(cmd, score));
      }
    }
    scored.sort((a, b) => {
      const aMode = a.cmd.category === "Mode";
      const bMode = b.cmd.category === "Mode";
      if (aMode !== bMode)
        return aMode ? -1 : 1;
      return b.score - a.score;
    });
    return scored.slice(0, maxResults).map((s) => s.cmd);
  }
  // Resolves ids from CommandPaletteHistory; skips entries removed from the registry.
  static recentCommands() {
    const ids = CommandPaletteHistory.getRecentIds();
    const result = [];
    for (const id of ids) {
      const cmd = CommandPaletteRegistry.get(id);
      if (cmd != null)
        result.push(cmd);
    }
    return result;
  }
  // Returns HTML with matched portions wrapped in <b> (label is escaped).
  static highlightMatch(label, query) {
    if (query == null || query.trim().length === 0)
      return CommandPaletteRegistry.escapeHtml(label);
    const q = query.toLowerCase().trim();
    const lower = label.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx >= 0) {
      return CommandPaletteRegistry.escapeHtml(label.substring(0, idx)) + "<b>" + CommandPaletteRegistry.escapeHtml(label.substring(idx, idx + q.length)) + "</b>" + CommandPaletteRegistry.escapeHtml(label.substring(idx + q.length));
    }
    let sb = "";
    let qi = 0;
    for (let i = 0; i < label.length; i++) {
      const c = label.charAt(i);
      if (qi < q.length && c.toLowerCase() === q.charAt(qi)) {
        sb += "<b>" + CommandPaletteRegistry.escapeHtml(c) + "</b>";
        qi++;
      } else {
        sb += CommandPaletteRegistry.escapeHtml(c);
      }
    }
    return sb;
  }
  static escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
}

class CheckItem {
  _state;
  _command = null;
  _li = null;
  // linked DOM element, set when added to a Menu
  constructor(state = false) {
    this._state = state;
  }
  getState() {
    return this._state;
  }
  setState(s) {
    this._state = s;
    if (this._li) {
      const mark = this._li.querySelector(".checkMark");
      if (mark) mark.style.visibility = s ? "visible" : "hidden";
    }
  }
  setCommand(cmd) {
    this._command = () => cmd.execute();
  }
  setScheduledCommand(cmd) {
    this._command = () => cmd.execute();
  }
  // Toggle state then run command (called on click)
  toggle() {
    this.setState(!this._state);
    if (this._command) this._command();
  }
  execute() {
    if (this._command) this._command();
  }
}
class MenuItem {
  _enabled = true;
  _command = null;
  _li = null;
  setEnabled(b) {
    this._enabled = b;
    if (this._li) this._li.classList.toggle("menuItemDisabled", !b);
  }
  isEnabled() {
    return this._enabled;
  }
  setScheduledCommand(cmd) {
    this._command = () => cmd.execute();
  }
  // GWT compatibility aliases used by scope popup menus
  setCommand(cmd) {
    this._command = cmd ? () => cmd.execute() : null;
  }
  setSubMenu(_sub) {
  }
  execute() {
    if (this._enabled && this._command) this._command();
  }
}
function closeAllMenus() {
  document.querySelectorAll(".gwt-MenuItem.open, .topMenuItem.open, li.hasSubmenu.open").forEach((el) => el.classList.remove("open"));
}
function anyMenuOpen() {
  return document.querySelector(".gwt-MenuItem.open, .topMenuItem.open") !== null;
}
function iconHtml(icon, text) {
  const ls = Locale.LS(text);
  return icon ? `<i class="cirjsicon-${icon}"></i>&nbsp;${ls}` : ls;
}
function shortcutHtml(icon, text, shortcut) {
  const inner = iconHtml(icon, text);
  return `<div class="menuItemRow"><span>${inner}</span><span class="shortcutHint">${shortcut}</span></div>`;
}
class Menu {
  ul;
  app;
  constructor(app) {
    this.app = app;
    this.ul = document.createElement("ul");
    this.ul.className = "menuDropdown";
  }
  // Add a simple command item, returns the <li> for optional post-setup.
  addCommand(html, menuName, cmdName) {
    const li = this.makeLi(html);
    li.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    li.addEventListener("click", (e) => {
      if (li.classList.contains("menuItemDisabled")) return;
      e.stopPropagation();
      closeAllMenus();
      this.app.commands.menuPerformed(menuName, cmdName);
    });
    this.ul.appendChild(li);
    return li;
  }
  // Add a command item and wire it to a MenuItem state object.
  addMenuItem(item, html, menuName, cmdName) {
    const li = this.addCommand(html, menuName, cmdName);
    item._li = li;
    item.setEnabled(item.isEnabled());
    item.setScheduledCommand({ execute: () => this.app.commands.menuPerformed(menuName, cmdName) });
  }
  // Add a CheckItem (toggles on click, shows checkmark).
  addCheckItem(item, label) {
    const li = this.makeLi("");
    li.innerHTML = `<span class="checkMark">&#10003;</span> ${Locale.LS(label)}`;
    const mark = li.querySelector(".checkMark");
    mark.style.visibility = item.getState() ? "visible" : "hidden";
    item._li = li;
    li.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllMenus();
      item.toggle();
    });
    this.ul.appendChild(li);
  }
  // Add a CheckboxMenuItem from UIManager.getClassCheckItem (element-placement mode).
  // The item has getLabel(), getShortcut(), execute(), and a _li property.
  addCheckboxItem(item) {
    const li = this.makeLi("");
    const label = item.getLabel ? item.getLabel() : String(item);
    const sc = item.getShortcut ? item.getShortcut() : "";
    li.innerHTML = `<span class="checkMark">&#10003;</span> <span class="itemLabel">${Locale.LS(label)}</span>` + (sc ? `<span class="shortcutHint">${sc}</span>` : "");
    li.querySelector(".checkMark").style.visibility = "hidden";
    item._li = li;
    li.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      closeAllMenus();
      item.execute();
    });
    this.ul.appendChild(li);
  }
  // Add a submenu entry (hover opens the child menu on desktop). Touch devices have no
  // real hover, so relying on CSS :hover alone (as this used to) is unreliable there: a
  // tap can register as hover without a click ever firing, or leave the hover state stuck
  // since there's no mouseout when the finger lifts. Track visibility explicitly instead.
  addSubmenu(html, sub) {
    const li = this.makeLi(html + '<span class="submenuArrow">&#9658;</span>');
    li.classList.add("hasSubmenu");
    li.appendChild(sub.ul);
    this.ul.appendChild(li);
    const openThis = () => {
      for (const sib of Array.from(this.ul.children))
        if (sib !== li) sib.classList.remove("open");
      li.classList.add("open");
    };
    li.addEventListener("mouseover", (e) => {
      e.stopPropagation();
      openThis();
    });
    li.addEventListener("touchstart", (e) => {
      e.stopPropagation();
      openThis();
    }, { passive: true });
    li.addEventListener("click", (e) => e.stopPropagation());
    return li;
  }
  addSeparator() {
    const sep = document.createElement("li");
    sep.className = "menuSeparator";
    this.ul.appendChild(sep);
  }
  // Clear all items — used when rebuilding the dynamic Subcircuits submenu.
  clearItems() {
    this.ul.innerHTML = "";
  }
  makeLi(html) {
    const li = document.createElement("li");
    li.className = "menuItem";
    li.innerHTML = html;
    return li;
  }
}
const subheadHtml = '<span class="checkMark" style="visibility:hidden">&#10003;</span>';
class Menus {
  aboutItem = new MenuItem();
  importFromLocalFileItem = new MenuItem();
  importFromTextItem = new MenuItem();
  exportAsUrlItem = new MenuItem();
  exportAsLocalFileItem = new MenuItem();
  exportAsTextItem = new MenuItem();
  printItem = new MenuItem();
  recoverItem = new MenuItem();
  saveFileItem = new MenuItem();
  importFromDropboxItem = new MenuItem();
  undoItem = new MenuItem();
  redoItem = new MenuItem();
  cutItem = new MenuItem();
  copyItem = new MenuItem();
  pasteItem = new MenuItem();
  selectAllItem = new MenuItem();
  optionsItem = new MenuItem();
  rotateCCWItem = new MenuItem();
  rotateCWItem = new MenuItem();
  mirrorXItem = new MenuItem();
  mirrorYItem = new MenuItem();
  stackAllItem = new MenuItem();
  unstackAllItem = new MenuItem();
  combineAllItem = new MenuItem();
  separateAllItem = new MenuItem();
  elmEditMenuItem = new MenuItem();
  elmCutMenuItem = new MenuItem();
  elmCopyMenuItem = new MenuItem();
  elmDeleteMenuItem = new MenuItem();
  elmScopeMenuItem = new MenuItem();
  elmFloatScopeMenuItem = new MenuItem();
  elmAddScopeMenuItem = new MenuItem();
  elmSplitMenuItem = new MenuItem();
  elmSliderMenuItem = new MenuItem();
  elmRotateCCWMenuItem = new MenuItem();
  elmRotateCWMenuItem = new MenuItem();
  elmMirrorXMenuItem = new MenuItem();
  elmMirrorYMenuItem = new MenuItem();
  elmSwapMenuItem = new MenuItem();
  scopeRemovePlotMenuItem = new MenuItem();
  scopeSelectYMenuItem = new MenuItem();
  dotsCheckItem = new CheckItem(true);
  voltsCheckItem = new CheckItem(true);
  powerCheckItem = new CheckItem();
  smallGridCheckItem = new CheckItem();
  crossHairCheckItem = new CheckItem();
  showValuesCheckItem = new CheckItem(true);
  conductanceCheckItem = new CheckItem();
  euroResistorCheckItem = new CheckItem();
  showOhmCheckItem = new CheckItem();
  euroGatesCheckItem = new CheckItem();
  printableCheckItem = new CheckItem();
  conventionCheckItem = new CheckItem(true);
  noEditCheckItem = new CheckItem();
  mouseWheelEditCheckItem = new CheckItem(true);
  toolbarCheckItem = new CheckItem(true);
  showPropsOnClickCheckItem = new CheckItem(true);
  menuBar = document.createElement("nav");
  // right-click context popup — same Draw menu content, built separately
  mainMenuBar = document.createElement("ul");
  elmMenuBar = document.createElement("ul");
  subcircuitMenuBar = null;
  hideMenu = false;
  isMac = false;
  ctrlMetaKey = "Ctrl-";
  app;
  constructor(app) {
    this.app = app;
  }
  menuBarRow = document.createElement("tr");
  init() {
    const os = navigator.platform;
    this.isMac = os.toLowerCase().includes("mac");
    this.ctrlMetaKey = this.isMac ? Locale.LS("Cmd-") : Locale.LS("Ctrl-");
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    this.menuBar = wrapper;
    const bar = document.createElement("div");
    bar.setAttribute("tabindex", "0");
    bar.setAttribute("role", "menubar");
    bar.className = "gwt-MenuBar gwt-MenuBar-horizontal";
    bar.style.cssText = "outline: 0; position: absolute; inset: 0;";
    const table = document.createElement("table");
    table.addEventListener("click", () => closeAllMenus());
    const tbody = document.createElement("tbody");
    this.menuBarRow = document.createElement("tr");
    tbody.appendChild(this.menuBarRow);
    table.appendChild(tbody);
    bar.appendChild(table);
    const focusTrap = document.createElement("input");
    focusTrap.type = "text";
    focusTrap.tabIndex = -1;
    focusTrap.setAttribute("aria-hidden", "true");
    focusTrap.style.cssText = "opacity:0;height:1px;width:1px;z-index:-1;overflow:hidden;position:absolute;";
    bar.appendChild(focusTrap);
    wrapper.appendChild(bar);
    const ck = this.ctrlMetaKey;
    const fileMenu = new Menu(this.app);
    if (this.isElectron())
      fileMenu.addCommand(shortcutHtml("window", "New Window...", Locale.LS(ck + "N")), "file", "newwindow");
    fileMenu.addCommand(iconHtml("doc-new", "New Blank Circuit"), "file", "newblankcircuit");
    fileMenu.addMenuItem(
      this.importFromLocalFileItem,
      shortcutHtml("folder", "Open File...", Locale.LS(ck + "O")),
      "file",
      "importfromlocalfile"
    );
    this.importFromLocalFileItem.setEnabled(typeof FileReader !== "undefined");
    fileMenu.addMenuItem(
      this.importFromTextItem,
      iconHtml("doc-text", "Import From Text..."),
      "file",
      "importfromtext"
    );
    fileMenu.addMenuItem(
      this.importFromDropboxItem,
      iconHtml("dropbox", "Import From Dropbox..."),
      "file",
      "importfromdropbox"
    );
    if (this.isElectron()) {
      fileMenu.addMenuItem(
        this.saveFileItem,
        shortcutHtml("floppy", "Save", Locale.LS(ck + "S")),
        "file",
        "save"
      );
      fileMenu.addCommand(iconHtml("floppy", "Save As..."), "file", "saveas");
    } else {
      fileMenu.addMenuItem(
        this.exportAsLocalFileItem,
        shortcutHtml("floppy", "Save As...", Locale.LS(ck + "S")),
        "file",
        "exportaslocalfile"
      );
      this.exportAsLocalFileItem.setEnabled("download" in document.createElement("a"));
    }
    fileMenu.addMenuItem(
      this.exportAsUrlItem,
      iconHtml("export", "Export As Link..."),
      "file",
      "exportasurl"
    );
    fileMenu.addMenuItem(
      this.exportAsTextItem,
      iconHtml("export", "Export As Text..."),
      "file",
      "exportastext"
    );
    fileMenu.addCommand(iconHtml("image", "Export As Image..."), "file", "exportasimage");
    fileMenu.addCommand(iconHtml("image", "Copy Circuit Image to Clipboard"), "file", "copypng");
    fileMenu.addCommand(iconHtml("image", "Export As SVG..."), "file", "exportassvg");
    fileMenu.addCommand(iconHtml("microchip", "Create Subcircuit..."), "file", "createsubcircuit");
    fileMenu.addCommand(iconHtml("magic", "Find DC Operating Point"), "file", "dcanalysis");
    fileMenu.addMenuItem(
      this.recoverItem,
      iconHtml("back-in-time", "Recover Auto-Save"),
      "file",
      "recover"
    );
    fileMenu.addMenuItem(
      this.printItem,
      shortcutHtml("print", "Print...", Locale.LS(ck + "P")),
      "file",
      "print"
    );
    fileMenu.addSeparator();
    fileMenu.addCommand(iconHtml("resize-full-alt", "Toggle Full Screen"), "view", "fullscreen");
    fileMenu.addSeparator();
    fileMenu.addMenuItem(this.aboutItem, iconHtml("info-circled", "About..."), "file", "about");
    const editMenu = new Menu(this.app);
    editMenu.addMenuItem(this.undoItem, shortcutHtml("reply", "Undo", Locale.LS(ck + "Z")), "edit", "undo");
    editMenu.addMenuItem(this.redoItem, shortcutHtml("forward", "Redo", Locale.LS(ck + "Y")), "edit", "redo");
    editMenu.addSeparator();
    editMenu.addMenuItem(this.cutItem, shortcutHtml("scissors", "Cut", Locale.LS(ck + "X")), "edit", "cut");
    editMenu.addMenuItem(this.copyItem, shortcutHtml("copy", "Copy", Locale.LS(ck + "C")), "edit", "copy");
    editMenu.addMenuItem(this.pasteItem, shortcutHtml("paste", "Paste", Locale.LS(ck + "V")), "edit", "paste");
    editMenu.addCommand(shortcutHtml("clone", "Duplicate", Locale.LS(ck + "D")), "edit", "duplicate");
    editMenu.addSeparator();
    editMenu.addMenuItem(this.selectAllItem, shortcutHtml("select-all", "Select All", Locale.LS(ck + "A")), "edit", "selectAll");
    editMenu.addSeparator();
    editMenu.addCommand(shortcutHtml("search", "Find Component/Command...", "/"), "edit", "search");
    editMenu.addCommand(iconHtml("target", Locale.weAreInUS(false) ? "Center Circuit" : "Centre Circuit"), "edit", "centercircuit");
    editMenu.addCommand(shortcutHtml("zoom-11", "Zoom 100%", "0"), "zoom", "zoom100");
    editMenu.addCommand(shortcutHtml("zoom-in", "Zoom In", "+"), "zoom", "zoomin");
    editMenu.addCommand(shortcutHtml("zoom-out", "Zoom Out", "-"), "zoom", "zoomout");
    editMenu.addMenuItem(this.mirrorXItem, iconHtml("flip-x", "Mirror X"), "edit", "mirrorX");
    editMenu.addMenuItem(this.mirrorYItem, iconHtml("flip-y", "Mirror Y"), "edit", "mirrorY");
    editMenu.addMenuItem(this.rotateCCWItem, iconHtml("ccw", "Rotate CCW"), "edit", "rotateCCW");
    editMenu.addMenuItem(this.rotateCWItem, iconHtml("cw", "Rotate CW"), "edit", "rotateCW");
    const drawMenu = new Menu(this.app);
    const popupMenu = new Menu(this.app);
    this.subcircuitMenuBar = [new Menu(this.app), new Menu(this.app)];
    this.composeMainMenu(popupMenu, 0);
    this.composeMainMenu(drawMenu, 1);
    this.mainMenuBar = popupMenu.ul;
    const scopesMenu = new Menu(this.app);
    scopesMenu.addMenuItem(this.stackAllItem, iconHtml("lines", "Stack All"), "scopes", "stackAll");
    scopesMenu.addMenuItem(this.unstackAllItem, iconHtml("columns", "Unstack All"), "scopes", "unstackAll");
    scopesMenu.addMenuItem(this.combineAllItem, iconHtml("object-group", "Combine All"), "scopes", "combineAll");
    scopesMenu.addMenuItem(this.separateAllItem, iconHtml("object-ungroup", "Separate All"), "scopes", "separateAll");
    const optMenu = new Menu(this.app);
    optMenu.addCheckItem(this.dotsCheckItem, "Show Current");
    optMenu.addCheckItem(this.voltsCheckItem, "Show Voltage");
    this.voltsCheckItem.setCommand({ execute: () => {
      if (this.voltsCheckItem.getState()) this.powerCheckItem.setState(false);
      this.app.setPowerBarEnable();
    } });
    optMenu.addCheckItem(this.powerCheckItem, "Show Power");
    this.powerCheckItem.setCommand({ execute: () => {
      if (this.powerCheckItem.getState()) this.voltsCheckItem.setState(false);
      this.app.setPowerBarEnable();
    } });
    optMenu.addCheckItem(this.showValuesCheckItem, "Show Values");
    optMenu.addCheckItem(this.smallGridCheckItem, "Small Grid");
    this.smallGridCheckItem.setCommand({ execute: () => this.app.setGrid() });
    optMenu.addCheckItem(this.toolbarCheckItem, "Toolbar");
    this.toolbarCheckItem.setCommand({ execute: () => this.app.ui?.setToolbar() });
    optMenu.addCheckItem(this.showPropsOnClickCheckItem, "Show Properties On Click");
    optMenu.addCheckItem(this.crossHairCheckItem, "Show Cursor Cross Hairs");
    this.crossHairCheckItem.setCommand({ execute: () => this.app.ui?.setOptionInStorage("crossHair", this.crossHairCheckItem.getState()) });
    optMenu.addCheckItem(this.euroResistorCheckItem, "European Resistors");
    optMenu.addCheckItem(this.showOhmCheckItem, "Show Ω Unit");
    optMenu.addCheckItem(this.euroGatesCheckItem, "IEC Gates");
    optMenu.addCheckItem(this.printableCheckItem, "White Background");
    optMenu.addCheckItem(this.conventionCheckItem, "Conventional Current Motion");
    optMenu.addCheckItem(this.noEditCheckItem, "Disable Editing");
    optMenu.addCheckItem(this.mouseWheelEditCheckItem, "Edit Values With Mouse Wheel");
    this.mouseWheelEditCheckItem.setCommand({ execute: () => this.app.ui?.setOptionInStorage("mouseWheelEdit", this.mouseWheelEditCheckItem.getState()) });
    optMenu.addCommand(subheadHtml + Locale.LS("Shortcuts..."), "options", "shortcuts");
    optMenu.addMenuItem(this.optionsItem, subheadHtml + Locale.LS("Other Options..."), "options", "other");
    if (this.isElectron())
      optMenu.addCommand(subheadHtml + Locale.LS("Toggle Dev Tools"), "options", "devtools");
    const toolsMenu = new Menu(this.app);
    toolsMenu.addCommand(Locale.LS("Convert Wires to Routed Wires"), "tools", "convertWires");
    toolsMenu.addCommand(Locale.LS("Subcircuit Manager"), "tools", "subcircuits");
    this.addTopItem(this.menuBarRow, Locale.LS("File"), fileMenu);
    this.addTopItem(this.menuBarRow, Locale.LS("Edit"), editMenu);
    this.addTopItem(this.menuBarRow, Locale.LS("Draw"), drawMenu);
    this.addTopItem(this.menuBarRow, Locale.LS("Scopes"), scopesMenu);
    this.addTopItem(this.menuBarRow, Locale.LS("Options"), optMenu);
    this.addTopItem(this.menuBarRow, Locale.LS("Tools"), toolsMenu);
    this.buildElmMenuBar();
    document.addEventListener("click", () => closeAllMenus());
    document.addEventListener("touchstart", () => closeAllMenus(), { passive: true });
  }
  // this is called twice, once for the Draw menu, once for the right mouse popup menu
  composeMainMenu(menu, num) {
    this.makeClassCheckItems(menu, [
      "Add Wire",
      "WireElm",
      "Add Routed Wire",
      "RoutedWireElm",
      "Add Resistor",
      "ResistorElm"
    ]);
    const passMenu = new Menu(this.app);
    this.makeClassCheckItems(passMenu, [
      "Add Capacitor",
      "CapacitorElm",
      "Add Capacitor (polarized)",
      "PolarCapacitorElm",
      "Add Inductor",
      "InductorElm",
      "Add Switch",
      "SwitchElm",
      "Add Push Switch",
      "PushSwitchElm",
      "Add SPDT Switch",
      "Switch2Elm",
      "Add DPDT Switch",
      "DPDTSwitchElm",
      "Add Make-Before-Break Switch",
      "MBBSwitchElm",
      "Add Potentiometer",
      "PotElm",
      "Add Transformer",
      "TransformerElm",
      "Add Tapped Transformer",
      "TappedTransformerElm",
      "Add Custom Transformer",
      "CustomTransformerElm",
      "Add Transmission Line",
      "TransLineElm",
      "Add Relay",
      "RelayElm",
      "Add Relay Coil",
      "RelayCoilElm",
      "Add Relay Contact",
      "RelayContactElm",
      "Add Photoresistor",
      "LDRElm",
      "Add Thermistor",
      "ThermistorNTCElm",
      "Add Memristor",
      "MemristorElm",
      "Add Spark Gap",
      "SparkGapElm",
      "Add Fuse",
      "FuseElm",
      "Add Crystal",
      "CrystalElm",
      "Add Cross Switch",
      "CrossSwitchElm",
      "Add Gyrator",
      "GyratorElm"
    ]);
    menu.addSubmenu(subheadHtml + Locale.LS("Passive Components"), passMenu);
    const inputMenu = new Menu(this.app);
    this.makeClassCheckItems(inputMenu, [
      "Add Ground",
      "GroundElm",
      "Add Voltage Source (2-terminal)",
      "DCVoltageElm",
      "Add Battery",
      "BatteryElm",
      "Add A/C Voltage Source (2-terminal)",
      "ACVoltageElm",
      "Add Voltage Source (1-terminal)",
      "RailElm",
      "Add A/C Voltage Source (1-terminal)",
      "ACRailElm",
      "Add Square Wave Source (1-terminal)",
      "SquareRailElm",
      "Add Clock",
      "ClockElm",
      "Add A/C Sweep",
      "SweepElm",
      "Add Variable Voltage",
      "VarRailElm",
      "Add Antenna",
      "AntennaElm",
      "Add AM Source",
      "AMElm",
      "Add FM Source",
      "FMElm",
      "Add Current Source",
      "CurrentElm",
      "Add Noise Generator",
      "NoiseElm",
      "Add Audio Input",
      "AudioInputElm",
      "Add Data Input",
      "DataInputElm",
      "Add External Voltage (JavaScript)",
      "ExtVoltageElm"
    ]);
    menu.addSubmenu(subheadHtml + Locale.LS("Inputs and Sources"), inputMenu);
    const outputMenu = new Menu(this.app);
    this.makeClassCheckItems(outputMenu, [
      "Add Analog Output",
      "OutputElm",
      "Add LED",
      "LEDElm",
      "Add Lamp",
      "LampElm",
      "Add Text",
      "TextElm",
      "Add Box",
      "BoxElm",
      "Add Line",
      "LineElm",
      "Add Labeled Node",
      "LabeledNodeElm",
      "Add Voltmeter/Scope Probe",
      "ProbeElm",
      "Add Ohmmeter",
      "OhmMeterElm",
      "Add Ammeter",
      "AmmeterElm",
      "Add Wattmeter",
      "WattmeterTrueElm",
      "Add Test Point",
      "TestPointElm",
      "Add Decimal Display",
      "DecimalDisplayElm",
      "Add Instruction Display",
      "InstructionDisplayElm",
      "Add LED Array",
      "LEDArrayElm",
      "Add Data Export",
      "DataRecorderElm",
      "Add Audio Output",
      "AudioOutputElm",
      "Add Stop Trigger",
      "StopTriggerElm",
      "Add DC Motor",
      "DCMotorElm",
      "Add 3-Phase Motor",
      "ThreePhaseMotorElm",
      "Add Wattmeter (old)",
      "WattmeterElm"
    ]);
    menu.addSubmenu(subheadHtml + Locale.LS("Outputs and Labels"), outputMenu);
    this.app.register("CCVSElm", this.app.constructElement("CCVSElm", 0, 0));
    this.app.register("VCCSElm", this.app.constructElement("VCCSElm", 0, 0));
    const activeMenu = new Menu(this.app);
    this.makeClassCheckItems(activeMenu, [
      "Add Diode",
      "DiodeElm",
      "Add Zener Diode",
      "ZenerElm",
      "Add Transistor (bipolar, NPN)",
      "NTransistorElm",
      "Add Transistor (bipolar, PNP)",
      "PTransistorElm",
      "Add MOSFET (N-Channel)",
      "NMosfetElm",
      "Add MOSFET (P-Channel)",
      "PMosfetElm",
      "Add JFET (N-Channel)",
      "NJfetElm",
      "Add JFET (P-Channel)",
      "PJfetElm",
      "Add SCR",
      "SCRElm",
      "Add DIAC",
      "DiacElm",
      "Add TRIAC",
      "TriacElm",
      "Add Darlington Pair (NPN)",
      "NDarlingtonElm",
      "Add Darlington Pair (PNP)",
      "PDarlingtonElm",
      "Add Varactor/Varicap",
      "VaractorElm",
      "Add Tunnel Diode",
      "TunnelDiodeElm",
      "Add Triode",
      "TriodeElm",
      "Add Unijunction Transistor",
      "UnijunctionElm"
    ]);
    menu.addSubmenu(subheadHtml + Locale.LS("Active Components"), activeMenu);
    const activeBlocMenu = new Menu(this.app);
    this.makeClassCheckItems(activeBlocMenu, [
      "Add Op Amp (ideal, - on top)",
      "OpAmpElm",
      "Add Op Amp (ideal, + on top)",
      "OpAmpSwapElm",
      "Add Op Amp (real)",
      "OpAmpRealElm",
      "Add Analog Switch (SPST)",
      "AnalogSwitchElm",
      "Add Analog Switch (SPDT)",
      "AnalogSwitch2Elm",
      "Add Analog Multiplexer",
      "AnalogMuxElm",
      "Add Tristate Buffer",
      "TriStateElm",
      "Add Schmitt Trigger",
      "SchmittElm",
      "Add Schmitt Trigger (Inverting)",
      "InvertingSchmittElm",
      "Add Delay Buffer",
      "DelayBufferElm",
      "Add CCII+",
      "CC2Elm",
      "Add CCII-",
      "CC2NegElm",
      "Add Comparator (Hi-Z/GND output)",
      "ComparatorElm",
      "Add OTA (LM13700 style)",
      "OTAElm",
      "Add Norton Amp (LM3900)",
      "NortonAmpElm",
      "Add Controlled Voltage Source (2-terminal)",
      "ControlledVoltageElm",
      "Add Controlled Current Source (2-terminal)",
      "ControlledCurrentElm",
      "Add Voltage-Controlled Voltage Source (VCVS)",
      "VCVSElm",
      "Add Voltage-Controlled Current Source (VCCS)",
      "VCCSElm",
      "Add Current-Controlled Voltage Source (CCVS)",
      "CCVSElm",
      "Add Current-Controlled Current Source (CCCS)",
      "CCCSElm",
      "Add Optocoupler",
      "OptocouplerElm",
      "Add Time Delay Relay",
      "TimeDelayRelayElm",
      "Add LM317",
      "SubcircuitElm:~LM317-v2",
      "Add TL431",
      "SubcircuitElm:~TL431",
      "Add Motor Protection Switch",
      "MotorProtectionSwitchElm",
      "Add Subcircuit Instance",
      "SubcircuitElm"
    ]);
    menu.addSubmenu(subheadHtml + Locale.LS("Active Building Blocks"), activeBlocMenu);
    const gateMenu = new Menu(this.app);
    this.makeClassCheckItems(gateMenu, [
      "Add Logic Input",
      "LogicInputElm",
      "Add Logic Output",
      "LogicOutputElm",
      "Add Bus Input",
      "BusLogicInputElm",
      "Add Inverter",
      "InverterElm",
      "Add NAND Gate",
      "NandGateElm",
      "Add NOR Gate",
      "NorGateElm",
      "Add AND Gate",
      "AndGateElm",
      "Add OR Gate",
      "OrGateElm",
      "Add XOR Gate",
      "XorGateElm",
      "Add XNOR Gate",
      "XnorGateElm"
    ]);
    menu.addSubmenu(subheadHtml + Locale.LS("Logic Gates, Input and Output"), gateMenu);
    const chipMenu = new Menu(this.app);
    this.makeClassCheckItems(chipMenu, [
      "Add D Flip-Flop",
      "DFlipFlopElm",
      "Add JK Flip-Flop",
      "JKFlipFlopElm",
      "Add T Flip-Flop",
      "TFlipFlopElm",
      "Add 7 Segment LED",
      "SevenSegElm",
      "Add 7 Segment Decoder",
      "SevenSegDecoderElm",
      "Add Multiplexer",
      "MultiplexerElm",
      "Add Demultiplexer",
      "DeMultiplexerElm",
      "Add SIPO shift register",
      "SipoShiftElm",
      "Add PISO shift register",
      "PisoShiftElm",
      "Add Counter",
      "CounterElm",
      "Add Counter w/ Load",
      "Counter2Elm",
      "Add Ring Counter",
      "DecadeElm",
      "Add Latch/Register",
      "LatchElm",
      "Add Sequence generator",
      "SeqGenElm",
      "Add Adder",
      "FullAdderElm",
      "Add Half Adder",
      "HalfAdderElm",
      "Add Custom Logic",
      "UserDefinedLogicElm",
      // don't change this, it will break people's saved shortcuts
      "Add Static RAM",
      "SRAMElm",
      "Add ROM",
      "ROMElm",
      "Add Bus Transceiver",
      "BusTransceiverElm",
      "Add Bus Splitter",
      "BusSplitterElm"
    ]);
    menu.addSubmenu(subheadHtml + Locale.LS("Digital Chips"), chipMenu);
    const achipMenu = new Menu(this.app);
    this.makeClassCheckItems(achipMenu, [
      "Add 555 Timer",
      "TimerElm",
      "Add Phase Comparator",
      "PhaseCompElm",
      "Add DAC",
      "DACElm",
      "Add ADC",
      "ADCElm",
      "Add VCO",
      "VCOElm",
      "Add Monostable",
      "MonostableElm"
    ]);
    menu.addSubmenu(subheadHtml + Locale.LS("Analog and Hybrid Chips"), achipMenu);
    menu.addSubmenu(subheadHtml + Locale.LS("Subcircuits"), this.subcircuitMenuBar[num]);
    const otherMenu = new Menu(this.app);
    let mi;
    mi = this.getClassCheckItem(Locale.LS("Drag All"), "DragAll");
    mi.setShortcut(Locale.LS("(Alt-drag)"));
    otherMenu.addCheckboxItem(mi);
    mi = this.getClassCheckItem(Locale.LS("Drag Row"), "DragRow");
    mi.setShortcut(Locale.LS("(A-S-drag)"));
    otherMenu.addCheckboxItem(mi);
    mi = this.getClassCheckItem(Locale.LS("Drag Column"), "DragColumn");
    mi.setShortcut(this.isMac ? Locale.LS("(A-Cmd-drag)") : Locale.LS("(A-M-drag)"));
    otherMenu.addCheckboxItem(mi);
    mi = this.getClassCheckItem(Locale.LS("Drag Selected"), "DragSelected");
    otherMenu.addCheckboxItem(mi);
    mi = this.getClassCheckItem(Locale.LS("Drag Post"), "DragPost");
    mi.setShortcut("(" + this.ctrlMetaKey + "drag)");
    otherMenu.addCheckboxItem(mi);
    menu.addSubmenu(subheadHtml + Locale.LS("Drag"), otherMenu);
    mi = this.getClassCheckItem(Locale.LS("Select/Drag Sel"), "Select");
    mi.setShortcut(Locale.LS("(space or Shift-drag)"));
    menu.addCheckboxItem(mi);
  }
  makeClassCheckItems(menu, items) {
    for (let i = 0; i < items.length; i += 2)
      menu.addCheckboxItem(this.getClassCheckItem(Locale.LS(items[i]), items[i + 1]));
  }
  getClassCheckItem(s, t) {
    return this.app.ui.getClassCheckItem(s, t);
  }
  isElectron() {
    return CirSim.isElectron?.() ?? false;
  }
  // Load the built-in circuits list from the server and build the Circuits menu.
  // Uses fetch() instead of GWT's RequestBuilder.
  getSetupList(openDefault) {
    const url = moduleBaseURL + "setuplist.txt";
    fetch(url).then((r) => {
      if (!r.ok) {
        CirSim.console("Can't load circuit list!");
        return null;
      }
      return r.text();
    }).then((text) => {
      if (text) this.processSetupList(text, openDefault);
    }).catch(() => {
      CirSim.console("Can't load circuit list!");
    });
  }
  processSetupList(text, openDefault) {
    const lines = text.split(/\r?\n/);
    const stack = [];
    const submenuStack = [""];
    let currentMenu = new Menu(this.app);
    this.addTopItem(this.menuBarRow, Locale.LS("Circuits"), currentMenu);
    stack.push(currentMenu);
    for (const line of lines) {
      if (!line || line[0] === "#") continue;
      if (line[0] === "+") {
        const sub = new Menu(this.app);
        currentMenu.addSubmenu(Locale.LS(line.substring(1)), sub);
        currentMenu = sub;
        stack.push(currentMenu);
        submenuStack.push(line.substring(1));
      } else if (line[0] === "-") {
        stack.pop();
        currentMenu = stack[stack.length - 1];
        submenuStack.pop();
      } else {
        const sp = line.indexOf(" ");
        if (sp > 0) {
          const first = line[0] === ">";
          const file = line.substring(first ? 1 : 0, sp);
          const title = Locale.LS(line.substring(sp + 1));
          currentMenu.addCommand(title, "circuits", "setup " + file + " " + title);
          CommandPaletteRegistry.registerCircuit(file, title, submenuStack[submenuStack.length - 1]);
          const app = this.app;
          if (file === app.startCircuit && app.startLabel == null) {
            app.startLabel = title;
            this.app.setCircuitTitle(title);
          }
          if (first && app.startCircuit == null) {
            app.startCircuit = file;
            app.startLabel = title;
            if (openDefault && this.app.stopMessage == null)
              this.readSetupFile(app.startCircuit, app.startLabel);
          }
        }
      }
    }
  }
  readSetupFile(str, title) {
    console.log(str);
    this.app.resetEditingContext?.();
    const url = moduleBaseURL + "circuits/" + str;
    this.app.loader?.loadFileFromURL(url);
    if (title != null)
      this.app.setCircuitTitle(title);
    this.app.unsavedChanges = false;
    this.app.savedFlag = true;
  }
  // ---- Private helpers ----
  // Add a top-level item to the horizontal menu bar (clicking toggles the dropdown).
  addTopItem(row, label, menu) {
    const td = document.createElement("td");
    td.className = "gwt-MenuItem";
    td.setAttribute("role", "menuitem");
    td.setAttribute("aria-haspopup", "true");
    td.textContent = label;
    td.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = td.classList.contains("open");
      closeAllMenus();
      if (!wasOpen) td.classList.add("open");
    });
    td.addEventListener("mouseover", (e) => {
      if (anyMenuOpen()) {
        closeAllMenus();
        td.classList.add("open");
      }
    });
    td.appendChild(menu.ul);
    row.appendChild(td);
    return td;
  }
  // Build the element right-click context menu.
  buildElmMenuBar() {
    const ul = document.createElement("ul");
    ul.className = "menuDropdown elmContextMenu";
    this.elmMenuBar = ul;
    const m = new Menu(this.app);
    m.ul = ul;
    m.addMenuItem(this.elmEditMenuItem, Locale.LS("Edit..."), "elm", "edit");
    m.addMenuItem(this.elmScopeMenuItem, Locale.LS("View in New Scope"), "elm", "viewInScope");
    m.addMenuItem(this.elmFloatScopeMenuItem, Locale.LS("View in New Undocked Scope"), "elm", "viewInFloatScope");
    m.addMenuItem(this.elmAddScopeMenuItem, Locale.LS("Add to Existing Scope"), "elm", "addToScope0");
    m.addMenuItem(this.elmCutMenuItem, Locale.LS("Cut"), "elm", "cut");
    m.addMenuItem(this.elmCopyMenuItem, Locale.LS("Copy"), "elm", "copy");
    m.addMenuItem(this.elmDeleteMenuItem, Locale.LS("Delete"), "elm", "delete");
    m.addCommand(Locale.LS("Duplicate"), "elm", "duplicate");
    m.addMenuItem(this.elmSwapMenuItem, Locale.LS("Swap Terminals"), "elm", "flip");
    m.addMenuItem(this.elmMirrorXMenuItem, Locale.LS("Mirror X"), "elm", "mirrorX");
    m.addMenuItem(this.elmMirrorYMenuItem, Locale.LS("Mirror Y"), "elm", "mirrorY");
    m.addMenuItem(this.elmRotateCCWMenuItem, Locale.LS("Rotate CCW"), "elm", "rotateCCW");
    m.addMenuItem(this.elmRotateCWMenuItem, Locale.LS("Rotate CW"), "elm", "rotateCW");
    m.addMenuItem(this.elmSplitMenuItem, shortcutHtml("", "Split Wire Manually", Locale.LS(this.ctrlMetaKey + "click")), "elm", "split");
    m.addMenuItem(this.elmSliderMenuItem, Locale.LS("Sliders..."), "elm", "sliders");
  }
}

class ExtListEntry {
  name;
  node;
  pos;
  side;
  busWidth = 1;
  busZ = 0;
  constructor(name, node, pos, side) {
    this.name = name;
    this.node = node;
    this.pos = pos ?? 0;
    this.side = side ?? 2;
  }
}

class Checkbox {
  name;
  state;
  element = null;
  constructor(name, state) {
    this.name = name;
    this.state = state;
  }
  getState() {
    return this.element ? this.element.checked : this.state;
  }
  setState(s) {
    this.state = s;
    if (this.element) this.element.checked = s;
  }
}

class Choice {
  items = [];
  selectedIndex = 0;
  element = null;
  add(item) {
    this.items.push(item);
  }
  select(index) {
    this.selectedIndex = index;
  }
  getSelectedIndex() {
    return this.element ? this.element.selectedIndex : this.selectedIndex;
  }
  getItemCount() {
    return this.items.length;
  }
  getItem(index) {
    return this.items[index];
  }
}

class EditInfo {
  name = "";
  text = null;
  value = 0;
  dimensionless = false;
  // use a plain +/-1 step (rather than the E12 preferred-value series) for the EditDialog
  // stepper buttons; for quantities like voltage that aren't usually picked from E12 values
  unitStep = false;
  noSliders = false;
  isColor = false;
  newColumn = false;
  positive = false;
  nonNegative = false;
  minVal = 0;
  maxVal = 0;
  error = null;
  errorFieldName = null;
  checkbox = null;
  choice = null;
  button = null;
  textArea = null;
  widget = null;
  newDialog = false;
  textf = null;
  loadFile = null;
  minBox = null;
  maxBox = null;
  labelBox = null;
  stepBox = null;
  constructor(name, valOrTxt, mn, mx) {
    this.name = name;
    if (typeof valOrTxt === "string") {
      this.text = valOrTxt;
      this.dimensionless = true;
      this.noSliders = true;
    } else {
      this.value = valOrTxt;
      if (mn !== void 0) this.minVal = mn;
      if (mx !== void 0) this.maxVal = mx;
    }
  }
  static createCheckbox(name, flag) {
    const ei = new EditInfo("", 0, -1, -1);
    ei.checkbox = new Checkbox(name, flag);
    return ei;
  }
  setDimensionless() {
    this.dimensionless = true;
    return this;
  }
  setUnitStep() {
    this.unitStep = true;
    return this;
  }
  disallowSliders() {
    this.noSliders = true;
    return this;
  }
  setIsColor() {
    this.isColor = true;
    return this;
  }
  newColumnMethod() {
    this.newColumn = true;
    return this;
  }
  changeFlag(flags, bit) {
    if (this.checkbox.getState())
      return flags | bit;
    return flags & ~bit;
  }
  changeFlagInverted(flags, bit) {
    if (!this.checkbox.getState())
      return flags | bit;
    return flags & ~bit;
  }
  setError(s) {
    this.error = s;
  }
  setErrorFieldName(s) {
    this.errorFieldName = s;
    return this;
  }
  setPositive() {
    this.positive = true;
    return this;
  }
  setNonNegative() {
    this.nonNegative = true;
    return this;
  }
  canCreateAdjustable() {
    return this.choice == null && this.checkbox == null && this.button == null && this.textArea == null && this.widget == null && !this.noSliders;
  }
  static makeLink(file, text) {
    return `<a href="${file}" target="_blank">${text}</a>`;
  }
}

const HookRegistry = {
  undumpSubcircuitModel: null,
  loadSubcircuitModelsFromStorage: null,
  clearSubcircuitModelDumpedFlags: null,
  dumpUnusedLocalSubcircuitModels: null,
  createScopePropertiesDialog: null,
  scopeNextHighestScale: null,
  getCircuitAsComposite: null,
  createSubcircuitElm: null,
  createJSInterface: null,
  resetGroundNodeList: null,
  resetLabeledNodeList: null,
  getLabeledNode: null
};

class CircuitXMLSerializer {
  app;
  constructor(app) {
    this.app = app;
  }
  static escapeXml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  static prettyPrint(doc) {
    return CircuitXMLSerializer.prettyPrintNode(doc.documentElement, 0);
  }
  static prettyPrintNode(node, indent) {
    let sb = "";
    const indentStr = "  ".repeat(indent);
    sb += indentStr + "<" + node.nodeName;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node;
      for (let i = 0; i < elem.attributes.length; i++) {
        const attr = elem.attributes[i];
        sb += " " + attr.name + '="' + CircuitXMLSerializer.escapeXml(attr.value) + '"';
      }
    }
    const children = node.childNodes;
    if (children.length === 0) {
      sb += "/>\n";
    } else {
      sb += ">";
      let hasElementChildren = false;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (!hasElementChildren)
            sb += "\n";
          hasElementChildren = true;
          sb += CircuitXMLSerializer.prettyPrintNode(child, indent + 1);
        } else if (child.nodeType === Node.TEXT_NODE) {
          const text = (child.nodeValue ?? "").trim();
          if (text !== "")
            sb += CircuitXMLSerializer.escapeXml(text);
        }
      }
      if (hasElementChildren)
        sb += indentStr;
      sb += "</" + node.nodeName + ">\n";
    }
    return sb;
  }
  // false leaves out simulation state and scopes, whose settings drift as they run (auto
  // scale, plot speed), for checking whether the circuit itself has changed since it was saved
  saveState = true;
  dumpCircuit() {
    const doc = document.implementation.createDocument(null, "cir", null);
    const root = doc.documentElement;
    const menus = this.app.menus;
    let f = menus.dotsCheckItem.getState() ? 1 : 0;
    f |= menus.smallGridCheckItem.getState() ? 2 : 0;
    f |= menus.voltsCheckItem.getState() ? 0 : 4;
    f |= menus.powerCheckItem.getState() ? 8 : 0;
    f |= menus.showValuesCheckItem.getState() ? 0 : 16;
    const sim = this.app.sim;
    f |= sim.adjustTimeStep ? 64 : 0;
    f |= this.app.autoDCOnReset ? 128 : 0;
    CircuitXMLSerializer.dumpAttr(root, "f", f);
    CircuitXMLSerializer.dumpAttr(root, "ts", sim.maxTimeStep);
    CircuitXMLSerializer.dumpAttr(root, "ic", this.app.getIterCount());
    const ui = this.app.ui;
    CircuitXMLSerializer.dumpAttr(root, "cb", ui.currentBar.getValue());
    CircuitXMLSerializer.dumpAttr(root, "pb", ui.powerBar.getValue());
    CircuitXMLSerializer.dumpAttr(root, "vr", CircuitElm.voltageRange);
    CircuitXMLSerializer.dumpAttr(root, "mts", sim.minTimeStep);
    if (sim.solverType !== 0)
      CircuitXMLSerializer.dumpAttr(root, "st", sim.solverType);
    for (const ce of this.app.elmList) {
      const elem = doc.createElement(ce.getXmlDumpType());
      ce.dumpXml(doc, elem);
      if (this.saveState)
        ce.dumpXmlState(doc, elem);
      root.appendChild(elem);
    }
    HookRegistry.dumpUnusedLocalSubcircuitModels?.(doc);
    const sm = this.app.scopeManager;
    if (this.saveState)
      for (let i = 0; i !== sm.scopeCount; i++)
        sm.scopes[i].dumpXml(doc, root);
    for (let i = 0; i !== this.app.adjustables.length; i++)
      this.app.adjustables[i].dumpXml(doc, root, this.app);
    if (this.app.hintType !== -1) {
      const h = doc.createElement("h");
      CircuitXMLSerializer.dumpAttr(h, "t", this.app.hintType);
      CircuitXMLSerializer.dumpAttr(h, "i1", this.app.hintItem1);
      CircuitXMLSerializer.dumpAttr(h, "i2", this.app.hintItem2);
      root.appendChild(h);
    }
    return CircuitXMLSerializer.prettyPrint(doc);
  }
  static checkAttr(elem, name) {
    if (elem.getAttribute(name) !== null)
      throw new Error("naming conflict: " + name);
  }
  static dumpAttr(elem, name, value) {
    CircuitXMLSerializer.checkAttr(elem, name);
    if (typeof value === "string") {
      value = value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&apos;").replace(/</g, "&lt;");
    }
    elem.setAttribute(name, String(value));
  }
}

class WireSegment {
  wire;
  // CircuitElm
  bit;
  endpoint0;
  endpoint1;
  // string keys for each endpoint
  neighbors = null;
  // position-based neighbors (CircuitElm[])
  labelNeighbors = null;
  // neighbors at shared label endpoint
  post = 0;
  // 0 or 1: which endpoint was used for current calc
  current = 0;
  // set by calcWireCurrents, for label neighbor use
  constructor(w, b, ep0, ep1) {
    this.wire = w;
    this.bit = b;
    this.endpoint0 = ep0;
    this.endpoint1 = ep1;
  }
}
class RoutedWireConnection {
  wire;
  // RoutedWireElm
  wirePost;
  // which post of the RoutedWireElm (0 or 1)
  elmPost;
  // which post of the non-routed element
  constructor(wire, wirePost, elmPost) {
    this.wire = wire;
    this.wirePost = wirePost;
    this.elmPost = elmPost;
  }
}
class SimulationManager {
  app;
  static theSim = null;
  // this is different than the main elmList; it has CompositeElm child elms in it
  elmList = [];
  // CircuitElm[]
  nodeList = [];
  voltageSources = [];
  matrices = null;
  circuitNonLinear = false;
  voltageSourceCount = 0;
  needsStamp = false;
  // mapping from elements to connected routed wires
  routedWireMap = /* @__PURE__ */ new Map();
  elmArr = [];
  // CircuitElm[]
  t = 0;
  // Solver type: 0=Auto, 1=Dense, 2=Sparse
  static SOLVER_AUTO = 0;
  static SOLVER_DENSE = 1;
  static SOLVER_SPARSE = 2;
  static SPARSE_THRESHOLD = 150;
  solverType = SimulationManager.SOLVER_AUTO;
  usingSparse = false;
  // current timestep (time between iterations)
  timeStep = 0;
  // maximum timestep (== timeStep unless we reduce it because of trouble converging)
  maxTimeStep = 0;
  minTimeStep = 0;
  // accumulated time since we incremented timeStepCount
  timeStepAccum = 0;
  // incremented each time we advance t by maxTimeStep
  timeStepCount = 0;
  adjustTimeStep = false;
  lastIterTime = 0;
  static console(text) {
    console.log(text);
  }
  static debugger() {
    debugger;
  }
  constructor(app) {
    SimulationManager.theSim = this;
    this.app = app;
  }
  resetTime() {
    this.t = this.timeStepAccum = 0;
    this.timeStepCount = 0;
  }
  // zero all node voltages; nodes are shared between elements so this must be done
  // centrally rather than per-element
  resetNodes() {
    for (const cn of this.nodeList)
      cn.v = 0;
  }
  getCircuitNode(n) {
    if (n >= this.nodeList.length)
      return null;
    return this.nodeList[n];
  }
  getElm(n) {
    if (n >= this.elmList.length)
      return null;
    return this.elmList[n];
  }
  // map points to node numbers
  nodeMap = /* @__PURE__ */ new Map();
  // separate node map for UI element list (when viewing composite internals)
  uiNodeMap = /* @__PURE__ */ new Map();
  // info about each wire segment and its neighbors, used to calculate wire currents
  wireInfoList = [];
  // the element list that wireInfoList was built from
  wireInfoElmSet = /* @__PURE__ */ new Set();
  // Set<CircuitElm>
  // tracks which (element, bit) pairs have been resolved in calcWireInfo
  wireInfoResolved = /* @__PURE__ */ new Map();
  // Map<CircuitElm, Set<Integer>>
  // detect bus widths for wires based on connected elements
  busMismatchList = [];
  detectBusWidths() {
    this.detectBusWidthsForList(this.elmList);
  }
  detectBusWidthsForList(list) {
    this.busMismatchList = [];
    const widthMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < list.length; i++) {
      const ce = list[i];
      if (ce.isRemovableWire()) continue;
      for (let j = 0; j < ce.getPostCount(); j++) {
        const w = ce.getPostWidth(j);
        if (w > 1) {
          const pt = ce.getPost(j);
          const key = pt.x + "," + pt.y;
          const existing = widthMap.get(key);
          if (existing != null && existing !== w)
            this.busMismatchList.push(pt);
          if (existing == null || w > existing)
            widthMap.set(key, w);
        }
      }
    }
    const labelWidthMap = /* @__PURE__ */ new Map();
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < list.length; i++) {
        const ce = list[i];
        if (ce.isWireElm()) {
          const wire = ce;
          const k1 = wire.point1.x + "," + wire.point1.y;
          const k2 = wire.point2.x + "," + wire.point2.y;
          const w1 = widthMap.get(k1);
          const w2 = widthMap.get(k2);
          let w = 1;
          if (w1 != null) w = w1;
          if (w2 != null && w2 > w) w = w2;
          if (w !== wire.busWidth) {
            wire.busWidth = w;
            wire.currents = w > 1 ? new Array(w).fill(0) : null;
            wire.allocNodes();
            changed = true;
          }
          if (w > 1) {
            if (w1 == null || w1 < w) {
              widthMap.set(k1, w);
              changed = true;
            }
            if (w2 == null || w2 < w) {
              widthMap.set(k2, w);
              changed = true;
            }
          }
        } else if (ce.isLabeledNodeElm()) {
          const ln = ce;
          const k = ln.point1.x + "," + ln.point1.y;
          const w = widthMap.get(k);
          const lw = labelWidthMap.get(ln.text);
          let bw = 1;
          if (w != null) bw = w;
          if (lw != null && lw > bw) bw = lw;
          if (bw !== ln.busWidth) {
            ln.busWidth = bw;
            ln.currents = bw > 1 ? new Array(bw).fill(0) : null;
            ln.allocNodes();
            changed = true;
          }
          if (bw > 1) {
            if (w == null || w < bw) {
              widthMap.set(k, bw);
              changed = true;
            }
            if (lw == null || lw < bw) {
              labelWidthMap.set(ln.text, bw);
              changed = true;
            }
          }
        } else if (ce.isBusSplitterElm()) {
          const bs = ce;
          const p = bs.pins[0].post.x + "," + bs.pins[0].post.y;
          const bw = bs.bits;
          const w = widthMap.get(p);
          if (w != null && w !== bw)
            this.busMismatchList.push(bs.pins[0].post);
          if (w == null || w < bw) {
            widthMap.set(p, bw);
            changed = true;
          }
        }
      }
    }
    for (let i = 0; i < list.length; i++) {
      const ce = list[i];
      if (ce.isRemovableWire()) continue;
      for (let j = 0; j < ce.getPostCount(); j++) {
        const w = ce.getPostWidth(j);
        if (w > 1) {
          const pt = ce.getPost(j);
          const key = pt.x + "," + pt.y;
          const propagated = widthMap.get(key);
          if (propagated != null && propagated !== w)
            this.busMismatchList.push(pt);
        }
      }
    }
  }
  // find groups of nodes connected by wire equivalents and map them to the same node.  this speeds things
  // up considerably by reducing the size of the matrix.  We do this for wires, labeled nodes, and ground.
  // The actual node we map to is not assigned yet.  Instead we map to the same NodeMapEntry.
  calculateWireClosure() {
    HookRegistry.resetLabeledNodeList?.();
    HookRegistry.resetGroundNodeList?.();
    this.calculateWireClosureForList(this.elmList, false);
  }
  // run wire closure on a given element list.  if uiList is true, treat LabeledNodeElm.getConnectedPost()
  // as null (since labeled nodes in subcircuits connect to composite terminals, not to each other)
  calculateWireClosureForList(list, uiList) {
    let i;
    const nm = /* @__PURE__ */ new Map();
    this.wireInfoList = [];
    this.wireInfoElmSet = new Set(list);
    for (i = 0; i !== list.length; i++) {
      const ce = list[i];
      if (!ce.isRemovableWire())
        continue;
      ce.getWireSegments(this.wireInfoList);
      const bw = ce.getBusWidth();
      for (let j = 0; j < bw; j++) {
        const p0 = ce.getPost(j);
        const k0 = SimulationManager.pointKey(p0);
        let cn = nm.get(k0);
        const p1 = uiList && ce.isLabeledNodeElm() ? null : ce.getConnectedPost(j);
        if (p1 == null) {
          if (cn == null) {
            cn = new NodeMapEntry();
            nm.set(k0, cn);
          }
          continue;
        }
        const k1 = SimulationManager.pointKey(p1);
        let cn2 = nm.get(k1);
        if (cn != null && cn2 != null) {
          for (const [key, val] of nm.entries()) {
            if (val === cn2)
              nm.set(key, cn);
          }
        } else if (cn != null) {
          nm.set(k1, cn);
        } else if (cn2 != null) {
          nm.set(k0, cn2);
        } else {
          cn = new NodeMapEntry();
          nm.set(k0, cn);
          nm.set(k1, cn);
        }
      }
    }
    if (uiList)
      this.uiNodeMap = this.nmToPointMap(nm, list);
    else
      this.nodeMap = this.nmToPointMap(nm, list);
  }
  // convert string-key map to Point-key map by scanning element posts
  nmToPointMap(nm, list) {
    const result = /* @__PURE__ */ new Map();
    for (const ce of list) {
      const bw = ce.isRemovableWire() ? ce.getBusWidth() : ce.getPostCount();
      for (let j = 0; j < bw; j++) {
        const p = ce.isRemovableWire() ? ce.getPost(j) : ce.getPost(j);
        if (p == null) continue;
        const key = SimulationManager.pointKey(p);
        const entry = nm.get(key);
        if (entry != null)
          result.set(p, entry);
      }
      if (ce.isRemovableWire()) {
        for (let j = 0; j < ce.getBusWidth(); j++) {
          const p = ce.getConnectedPost(j);
          if (p == null) continue;
          const key = SimulationManager.pointKey(p);
          const entry = nm.get(key);
          if (entry != null)
            result.set(p, entry);
        }
      }
    }
    return result;
  }
  // assign nodes to UI wires (which aren't part of simulation) based on neighboring non-wire elements
  // that already have nodes assigned by makeNodeList.  also add wire links to nodeList so calcWireInfo works.
  assignUiWireNodes() {
    const uiList = this.app.ui.elmList;
    for (let i = 0; i !== uiList.length; i++) {
      const ce = uiList[i];
      if (ce.isRemovableWire())
        continue;
      for (let j = 0; j !== ce.getPostCount(); j++) {
        const pt = ce.getPost(j);
        const nme = this.getFromPointMap(this.uiNodeMap, pt);
        const cn = ce.getNode(j);
        if (nme != null && nme.node == null && cn != null)
          nme.node = cn;
        if (cn != null) {
          const cnl = new CircuitNodeLink();
          cnl.num = j;
          cnl.elm = ce;
          cn.links.push(cnl);
        }
      }
    }
    for (let i = 0; i !== uiList.length; i++) {
      const ce = uiList[i];
      if (!ce.isRemovableWire())
        continue;
      for (let j = 0; j !== ce.getPostCount(); j++) {
        const pt = ce.getPost(j);
        const nme = this.getFromPointMap(this.uiNodeMap, pt);
        if (nme != null && nme.node != null) {
          const cn = nme.node;
          ce.setNode(j, cn);
          const cnl = new CircuitNodeLink();
          cnl.num = j;
          cnl.elm = ce;
          cn.links.push(cnl);
        } else if (!ce.isLabeledNodeElm()) {
          SimulationManager.console("missing node for " + pt);
        }
      }
    }
  }
  // look up Point in a Point-keyed map using coordinate equality
  getFromPointMap(map, pt) {
    for (const [k, v] of map.entries()) {
      if (k.x === pt.x && k.y === pt.y && k.z === pt.z)
        return v;
    }
    return void 0;
  }
  // generate info we need to calculate wire currents.  Most other elements calculate currents using
  // the voltage on their terminal nodes.  But wires have the same voltage at both ends, so we need
  // to use the neighbors' currents instead.  We used to treat wires as zero voltage sources to make
  // this easier, but this is very inefficient, since it makes the matrix 2 rows bigger for each wire.
  // We create a list of WireInfo objects instead to help us calculate the wire currents instead,
  // so we make the matrix less complex, and we only calculate the wire currents when we need them
  // (once per frame, not once per subiteration).  We need the WireInfos arranged in the correct order,
  // each one containing a list of neighbors and which end to use (since one end may be ready before
  // the other)
  isWireInfoResolved(ce, bit) {
    const bits = this.wireInfoResolved.get(ce);
    return bits != null && bits.has(bit);
  }
  setWireInfoResolved(ce, bit) {
    let bits = this.wireInfoResolved.get(ce);
    if (bits == null) {
      bits = /* @__PURE__ */ new Set();
      this.wireInfoResolved.set(ce, bits);
    }
    bits.add(bit);
  }
  calcWireInfo() {
    let i, j;
    let moved = 0;
    this.wireInfoResolved = /* @__PURE__ */ new Map();
    const labelMap = /* @__PURE__ */ new Map();
    for (i = 0; i !== this.wireInfoList.length; i++) {
      const ws = this.wireInfoList[i];
      if (ws.endpoint1 != null && ws.endpoint1.startsWith("label:")) {
        let list = labelMap.get(ws.endpoint1);
        if (list == null) {
          list = [];
          labelMap.set(ws.endpoint1, list);
        }
        list.push(ws);
      }
    }
    for (i = 0; i !== this.wireInfoList.length; i++) {
      const ws = this.wireInfoList[i];
      const wire = ws.wire;
      const cn1 = wire.getNode(ws.bit);
      if (cn1 == null) {
        ws.neighbors = [];
        ws.labelNeighbors = [];
        this.setWireInfoResolved(wire, ws.bit);
        continue;
      }
      const neighbors0 = [];
      const neighbors1 = [];
      const labelNeighbors = [];
      let isReady0 = true, isReady1 = !wire.isGroundElm();
      for (j = 0; j !== cn1.links.length; j++) {
        const cnl = cn1.links[j];
        const ce = cnl.elm;
        if (ce === wire) continue;
        if (!this.wireInfoElmSet.has(ce)) continue;
        if (cnl.num >= ce.getPostCount()) continue;
        const pt = ce.getPost(cnl.num);
        if (pt == null) continue;
        const ptKey = SimulationManager.pointKey(pt);
        const neighborBit = cnl.num % ce.getBusWidth();
        const notReady = ce.isRemovableWire() && !this.isWireInfoResolved(ce, neighborBit);
        if (ws.endpoint0 != null && ws.endpoint0 === ptKey) {
          neighbors0.push(ce);
          if (notReady) isReady0 = false;
        } else if (ws.endpoint1 != null && !ws.endpoint1.startsWith("label:") && ws.endpoint1 === ptKey) {
          neighbors1.push(ce);
          if (notReady) isReady1 = false;
        }
      }
      if (ws.endpoint1 != null && ws.endpoint1.startsWith("label:")) {
        const peers = labelMap.get(ws.endpoint1);
        if (peers != null) {
          for (j = 0; j !== peers.length; j++) {
            const other = peers[j];
            if (other === ws) continue;
            const notReady = !this.isWireInfoResolved(other.wire, other.bit);
            labelNeighbors.push(other);
            if (notReady) isReady1 = false;
          }
        }
      }
      if (isReady0) {
        ws.neighbors = neighbors0;
        ws.post = 0;
        this.setWireInfoResolved(wire, ws.bit);
        moved = 0;
      } else if (isReady1 && (ws.endpoint1 != null || !wire.isGroundElm())) {
        ws.neighbors = neighbors1;
        ws.labelNeighbors = labelNeighbors;
        ws.post = 1;
        this.setWireInfoResolved(wire, ws.bit);
        moved = 0;
      } else {
        this.wireInfoList.push(this.wireInfoList.splice(i--, 1)[0]);
        moved++;
        if (moved > this.wireInfoList.length * 2) {
          SimulationManager.console("wire loop detected, " + this.wireInfoList.length + " wires total, unresolved:");
          for (let k = i; k < this.wireInfoList.length; k++) {
            if (k < 0)
              continue;
            const wk = this.wireInfoList[k];
            SimulationManager.console("  unresolved: " + wk.wire.constructor.name + " bit=" + wk.bit + " ep0=" + wk.endpoint0 + " ep1=" + wk.endpoint1 + " resolved=" + this.wireInfoResolved.get(wk.wire));
          }
          this.stop("wire loop detected", wire);
          return false;
        }
      }
    }
    return true;
  }
  // find or allocate ground node
  setGroundNode(subcircuit) {
    let i;
    let gotGround = false;
    let gotRail = false;
    let volt = null;
    let battery = null;
    const cn = new CircuitNode();
    cn.index = 0;
    this.nodeList.push(cn);
    CircuitNode.ground = cn;
    for (i = 0; i !== this.elmList.length; i++) {
      const ce = this.getElm(i);
      if (ce.isGroundElm()) {
        gotGround = true;
        const nme = this.getFromPointMap(this.nodeMap, ce.getPost(0));
        if (nme != null)
          nme.node = CircuitNode.ground;
        break;
      }
      if (ce.isRailElm())
        gotRail = true;
      if (volt == null && ce.isVoltageElm())
        volt = ce;
      if (battery == null && ce.isBatteryElm())
        battery = ce;
    }
    if (!subcircuit && !gotGround && (volt != null || battery != null) && !gotRail) {
      const pt = (volt != null ? volt : battery).getPost(0);
      const cln = this.getFromPointMap(this.nodeMap, pt);
      if (cln != null)
        cln.node = CircuitNode.ground;
      else
        this.nodeMap.set(pt, new NodeMapEntry(CircuitNode.ground));
    }
  }
  // make list of nodes
  makeNodeList() {
    let i, j;
    let vscount = 0;
    for (i = 0; i !== this.elmList.length; i++)
      this.getElm(i).preStamp();
    for (i = 0; i !== this.elmList.length; i++) {
      const ce = this.getElm(i);
      const inodes = ce.getInternalNodeCount();
      const ivs = ce.getVoltageSourceCount();
      const posts = ce.getPostCount();
      for (j = 0; j !== posts; j++) {
        const pt = ce.getPost(j);
        const cln = this.getFromPointMap(this.nodeMap, pt);
        if (cln == null || cln.node == null) {
          const cn2 = new CircuitNode();
          cn2.index = this.nodeList.length;
          const cnl = new CircuitNodeLink();
          cnl.num = j;
          cnl.elm = ce;
          cn2.links.push(cnl);
          ce.setNode(j, cn2);
          if (cln != null)
            cln.node = cn2;
          else
            this.nodeMap.set(pt, new NodeMapEntry(cn2));
          this.nodeList.push(cn2);
        } else {
          const cn2 = cln.node;
          const cnl = new CircuitNodeLink();
          cnl.num = j;
          cnl.elm = ce;
          cn2.links.push(cnl);
          ce.setNode(j, cn2);
          if (cn2 === CircuitNode.ground)
            ce.calculateCurrent();
        }
      }
      for (j = 0; j !== inodes; j++) {
        const cn2 = new CircuitNode();
        cn2.index = this.nodeList.length;
        cn2.internal = true;
        const cnl = new CircuitNodeLink();
        cnl.num = j + posts;
        cnl.elm = ce;
        cn2.links.push(cnl);
        ce.setNode(cnl.num, cn2);
        this.nodeList.push(cn2);
      }
      vscount += ivs;
    }
    for (i = 0; i !== this.elmList.length; i++) {
      const ce = this.getElm(i);
      const refs = ce.getRefNodeCount();
      if (refs === 0)
        continue;
      ce.resolveExprRefs(this.elmList);
      const base = ce.getPostCount() + ce.getInternalNodeCount();
      for (j = 0; j !== refs; j++) {
        const cn2 = ce.getNode(base + j);
        if (cn2 == null || cn2 === CircuitNode.ground)
          continue;
        const cnl = new CircuitNodeLink();
        cnl.num = base + j;
        cnl.elm = ce;
        cn2.links.push(cnl);
      }
    }
    this.voltageSources = new Array(vscount);
  }
  // recursively add child elements to elmList and make node links
  addChildElms(list) {
    for (const ce of list) {
      const childList = ce.getChildElmList();
      if (childList != null) {
        this.addChildElms(childList);
        continue;
      }
      this.elmList.push(ce);
      const nodeCount = ce.getNodeCount();
      for (let i = 0; i !== nodeCount; i++) {
        const cn = ce.getNode(i);
        const cnl = new CircuitNodeLink();
        cnl.num = i;
        cnl.elm = ce;
        cn.links.push(cnl);
        cn.internal = false;
      }
    }
  }
  unconnectedNodes = [];
  nodesWithGroundConnection = [];
  // CircuitElm[]
  nodesWithGroundConnectionCount = 0;
  findUnconnectedNodes() {
    let i, j, k;
    const totalNodes = this.nodeList.length;
    const closure = new Array(totalNodes).fill(false);
    this.unconnectedNodes = [];
    this.nodesWithGroundConnection = [];
    closure[0] = true;
    for (i = 0; i !== this.elmList.length; i++) {
      const ce = this.getElm(i);
      let hasGround = false;
      for (j = 0; j < ce.getPostCount(); j++) {
        if (ce.hasGroundConnection(j)) {
          hasGround = true;
          closure[ce.getNode(j).index] = true;
        }
      }
      if (hasGround)
        this.nodesWithGroundConnection.push(ce);
    }
    const queue = [];
    for (i = 0; i < totalNodes; i++)
      if (closure[i]) queue.push(i);
    let qHead = 0;
    let scanFrom = 1;
    for (; ; ) {
      if (qHead < queue.length) {
        const n = queue[qHead++];
        const cn = this.getCircuitNode(n);
        for (j = 0; j !== cn.links.length; j++) {
          const cnl = cn.links[j];
          const ce = cnl.elm;
          const post1 = cnl.num;
          if (ce.isRefNode(post1))
            continue;
          for (k = 0; k !== ce.getPostCount(); k++) {
            if (k === post1)
              continue;
            const kn = ce.getNode(k).index;
            if (!closure[kn] && ce.getConnection(post1, k)) {
              closure[kn] = true;
              queue.push(kn);
            }
          }
        }
      } else {
        let found = false;
        for (; scanFrom < totalNodes; scanFrom++) {
          if (!closure[scanFrom] && !this.getCircuitNode(scanFrom).internal) {
            this.unconnectedNodes.push(scanFrom);
            closure[scanFrom] = true;
            queue.push(scanFrom++);
            found = true;
            break;
          }
        }
        if (!found)
          break;
      }
    }
    if (this.unconnectedNodes.length !== 0) {
      let s = "unconnected nodes:";
      for (i = 0; i !== this.unconnectedNodes.length; i++)
        s += " " + this.unconnectedNodes[i];
      SimulationManager.console(s);
    }
  }
  calculateClosures() {
    const totalNodes = this.nodeList.length;
    const closureIndex = new Array(totalNodes).fill(-1);
    let i;
    closureIndex[0] = -2;
    let closureCount = 0;
    for (i = 1; i !== totalNodes; i++) {
      if (closureIndex[i] >= 0)
        continue;
      const stack = [];
      stack.push(i);
      closureIndex[i] = closureCount;
      while (stack.length > 0) {
        const n = stack.pop();
        const cn = this.getCircuitNode(n);
        let j;
        for (j = 0; j !== cn.links.length; j++) {
          const cnl = cn.links[j];
          const ce = cnl.elm;
          const post1 = cnl.num;
          let k;
          for (k = 0; k !== ce.getNodeCount(); k++) {
            if (k === post1)
              continue;
            if (!ce.getMatrixConnection(post1, k))
              continue;
            const kn = ce.getNode(k).index;
            if (kn === 0)
              continue;
            if (closureIndex[kn] < 0) {
              closureIndex[kn] = closureCount;
              stack.push(kn);
            }
          }
        }
      }
      closureCount++;
    }
    if (closureCount === 0)
      closureCount = 1;
    this.matrices = new Array(closureCount);
    for (i = 0; i !== closureCount; i++)
      this.matrices[i] = new CircuitMatrix();
    for (i = 1; i !== totalNodes; i++) {
      const ci = closureIndex[i];
      if (ci < 0)
        continue;
      const cn = this.getCircuitNode(i);
      const m = this.matrices[ci];
      m.nodeCount++;
      cn.row = m.nodeCount;
      cn.matrix = m;
      m.nodeList.push(cn);
    }
    CircuitNode.ground.row = 0;
    CircuitNode.ground.matrix = null;
    for (let ci = 0; ci !== closureCount; ci++) {
      let nodeStr = "";
      for (i = 1; i !== totalNodes; i++) {
        if (closureIndex[i] === ci) {
          if (nodeStr.length > 0)
            nodeStr += ", ";
          nodeStr += i;
        }
      }
    }
  }
  // take list of unconnected nodes, which we identified earlier, and connect them to ground
  // with a big resistor.  otherwise we will get matrix errors.  The resistor has to be big,
  // otherwise circuits like 555 Square Wave will break
  connectUnconnectedNodes() {
    let i;
    for (i = 0; i !== this.unconnectedNodes.length; i++) {
      const n = this.unconnectedNodes[i];
      this.stampResistor(CircuitNode.ground, this.nodeList[n], 1e8);
    }
  }
  validateCircuit() {
    let i;
    for (i = 0; i !== this.elmList.length; i++) {
      const ce = this.getElm(i);
      if (!ce.validate())
        return false;
    }
    return true;
  }
  // analyze the circuit when something changes, so it can be simulated.
  // Most of this has been moved to preStampCircuit() so it can be avoided if the simulation is stopped.
  analyzeCircuit() {
    this.app.setStopElm(null, null);
    this.elmList = this.app.elmList;
    if (this.elmList.length === 0) {
      this.app.postDrawList = [];
      this.app.badConnectionList = [];
      return;
    }
    this.detectBusWidths();
    if (this.app.ui.elmList !== this.app.elmList)
      this.detectBusWidthsForList(this.app.ui.elmList);
    this.makePostDrawList();
    this.needsStamp = true;
  }
  // do the rest of the pre-stamp circuit analysis
  preStampCircuit(subcircuit) {
    let i, j;
    this.nodeList = [];
    this.elmList = this.app.elmList;
    this.calculateWireClosure();
    this.setGroundNode(subcircuit);
    this.makeNodeList();
    if (this.app.ui.elmList !== this.app.elmList) {
      this.detectBusWidthsForList(this.app.ui.elmList);
      this.calculateWireClosureForList(this.app.ui.elmList, true);
      this.assignUiWireNodes();
    }
    if (!this.calcWireInfo())
      return false;
    this.nodeMap = /* @__PURE__ */ new Map();
    this.uiNodeMap = /* @__PURE__ */ new Map();
    this.elmList = [...this.app.elmList];
    for (const elm of this.elmList) {
      const list = elm.getChildElmList();
      if (list != null)
        this.addChildElms(list);
    }
    let vscount = 0;
    this.circuitNonLinear = false;
    for (i = 0; i !== this.elmList.length; i++) {
      const ce = this.getElm(i);
      if (ce.nonLinear())
        this.circuitNonLinear = true;
      const ivs = ce.getVoltageSourceCount();
      for (j = 0; j !== ivs; j++) {
        const vs = new VoltageSource();
        vs.index = vscount;
        vs.elm = ce;
        this.voltageSources[vscount] = vs;
        ce.setVoltageSource(j, vs);
        vscount++;
      }
    }
    this.voltageSourceCount = vscount;
    let gotVoltageSource = false;
    this.app.showResistanceInVoltageSources = true;
    for (i = 0; i !== this.elmList.length; i++) {
      const ce = this.getElm(i);
      if (ce.isVoltageElm()) {
        if (gotVoltageSource)
          this.app.showResistanceInVoltageSources = false;
        else
          gotVoltageSource = true;
      }
    }
    this.findUnconnectedNodes();
    this.calculateClosures();
    if (!this.validateCircuit())
      return false;
    const vsPerMatrix = new Array(this.matrices.length).fill(0);
    for (i = 0; i !== this.voltageSourceCount; i++) {
      const vs = this.voltageSources[i];
      vs.assignMatrix();
    }
    for (i = 0; i !== this.voltageSourceCount; i++) {
      const vs = this.voltageSources[i];
      const m = vs.matrix;
      let mi = 0;
      for (j = 0; j !== this.matrices.length; j++)
        if (this.matrices[j] === m) {
          mi = j;
          break;
        }
      vsPerMatrix[mi]++;
      vs.row = m.nodeCount + vsPerMatrix[mi];
      m.voltageSourceList.push(vs);
    }
    for (i = 0; i !== this.matrices.length; i++) {
      this.matrices[i].size = this.matrices[i].nodeCount + vsPerMatrix[i];
    }
    this.nodesWithGroundConnectionCount = this.nodesWithGroundConnection.length;
    this.nodesWithGroundConnection = [];
    this.timeStep = this.maxTimeStep;
    this.needsStamp = true;
    this.app.jsInterface?.callAnalyzeHook();
    return true;
  }
  // do pre-stamping and then stamp circuit
  preStampAndStampCircuit() {
    let i;
    for (i = 0; i !== 10; i++)
      if (this.preStampCircuit(false) || this.app.stopMessage != null)
        break;
    if (this.app.stopMessage != null)
      return;
    if (i === 10) {
      this.stop("failed to stamp circuit", null);
      return;
    }
    this.stampCircuit();
  }
  // stamp the matrix, meaning populate the matrix as required to simulate the circuit (for all linear elements, at least).
  // this gets called after something changes in the circuit, and also when auto-adjusting timestep
  stampCircuit() {
    let i;
    for (i = 0; i !== this.matrices.length; i++) {
      const m = this.matrices[i];
      const sz = m.size;
      m.clear();
      m.rightSide = new Array(sz).fill(0);
      m.origRightSide = new Array(sz).fill(0);
      m.permute = new Array(sz).fill(0);
      m.nodeVoltages = new Array(m.nodeCount).fill(0);
      if (m.lastNodeVoltages == null || m.lastNodeVoltages.length !== m.nodeCount)
        m.lastNodeVoltages = new Array(m.nodeCount).fill(0);
      m.nonLinear = false;
    }
    if (this.circuitNonLinear) {
      for (i = 0; i !== this.matrices.length; i++)
        this.matrices[i].nonLinear = true;
    }
    this.connectUnconnectedNodes();
    for (i = 0; i !== this.elmList.length; i++) {
      const ce = this.getElm(i);
      ce.setParentList(this.elmList);
      ce.stamp();
    }
    if (this.matrices == null)
      return;
    let maxMatrixSize = 0;
    for (let mi = 0; mi !== this.matrices.length; mi++) {
      const m = this.matrices[mi];
      const sz = m.size;
      if (sz > maxMatrixSize) maxMatrixSize = sz;
      for (i = 0; i !== sz; i++)
        m.origRightSide[i] = m.rightSide[i];
      for (i = 0; i !== sz; i++)
        for (let j22 = 0; j22 !== sz; j22++)
          m.origMatrix[i][j22] = m.matrix[i][j22];
    }
    if (this.solverType === SimulationManager.SOLVER_SPARSE)
      this.usingSparse = true;
    else if (this.solverType === SimulationManager.SOLVER_DENSE)
      this.usingSparse = false;
    else
      this.usingSparse = maxMatrixSize >= SimulationManager.SPARSE_THRESHOLD;
    for (let mi = 0; mi !== this.matrices.length; mi++) {
      const m = this.matrices[mi];
      if (!m.nonLinear) {
        if (!SimulationManager.lu_factor(m.matrix, m.size, m.permute, m)) {
          this.stop("Singular matrix!", null);
          return;
        }
      }
    }
    this.elmArr = new Array(this.elmList.length);
    let scopeElmCount = 0;
    for (i = 0; i !== this.elmList.length; i++) {
      this.elmArr[i] = this.elmList[i];
      if (this.elmArr[i].isScopeElm())
        scopeElmCount++;
    }
    const scopeElmArr = new Array(scopeElmCount);
    let j2 = 0;
    for (i = 0; i !== this.elmList.length; i++) {
      if (this.elmArr[i].isScopeElm())
        scopeElmArr[j2++] = this.elmArr[i];
    }
    this.app.scopeElmArr = scopeElmArr;
    this.needsStamp = false;
  }
  // make list of posts we need to draw.  posts shared by 2 elements should be hidden, all
  // others should be drawn.  We can't use the node list for this purpose anymore because wires
  // have the same node number at both ends.
  makePostDrawList() {
    const postCountMap = /* @__PURE__ */ new Map();
    const drawList = this.app.ui.elmList;
    let i, j;
    for (i = 0; i !== drawList.length; i++) {
      const ce = drawList[i];
      const posts = ce.getPostCount();
      for (j = 0; j !== posts; j++) {
        const pt = ce.getPost(j);
        const key = SimulationManager.pointKey(pt);
        const entry = postCountMap.get(key);
        if (entry == null)
          postCountMap.set(key, { pt, count: 1 });
        else
          entry.count++;
      }
    }
    const postDrawList = this.app.postDrawList = [];
    const badConnectionList = this.app.badConnectionList = [];
    for (const entry of postCountMap.values()) {
      if (entry.count !== 2)
        postDrawList.push(entry.pt);
      if (entry.count === 1) {
        let bad = false;
        const cn = entry.pt;
        for (j = 0; j !== drawList.length && !bad; j++) {
          const ce = drawList[j];
          if (ce.isGraphicElm())
            continue;
          if (ce.isRoutedWireElm()) {
            if (ce.pointOnPath(cn))
              bad = true;
            continue;
          }
          if (!ce.boundingBox.contains(cn.x, cn.y))
            continue;
          let k;
          const pc = ce.getPostCount();
          for (k = 0; k !== pc; k++)
            if (ce.getPost(k).x === cn.x && ce.getPost(k).y === cn.y)
              break;
          if (k === pc)
            bad = true;
        }
        if (bad)
          badConnectionList.push(cn);
      }
    }
    badConnectionList.push(...this.busMismatchList);
    this.routedWireMap = /* @__PURE__ */ new Map();
    for (i = 0; i !== drawList.length; i++) {
      const ce = drawList[i];
      if (!ce.isRoutedWireElm())
        continue;
      const rw = ce;
      const rwPosts = rw.getPostCount();
      for (let rp = 0; rp < rwPosts; rp++) {
        const rwPt = rw.getPost(rp);
        for (j = 0; j !== drawList.length; j++) {
          const other = drawList[j];
          if (other === rw || other.isRoutedWireElm())
            continue;
          const otherPosts = other.getPostCount();
          for (let op = 0; op < otherPosts; op++) {
            const op2 = other.getPost(op);
            if (op2.x === rwPt.x && op2.y === rwPt.y) {
              let list = this.routedWireMap.get(other);
              if (list == null) {
                list = [];
                this.routedWireMap.set(other, list);
              }
              list.push(new RoutedWireConnection(rw, rp, op));
            }
          }
        }
      }
    }
  }
  stop(s, ce) {
    this.app.setStopElm(ce, Locale.LS(s));
    this.matrices = null;
    this.app.setSimRunning(false);
    this.app.analyzeFlag = false;
  }
  // control voltage source vs with voltage from n1 to n2 (must
  // also call stampVoltageSource())
  stampVCVS(n1, n2, coef, vs) {
    this.stampMatrixNV(vs, n1, coef);
    this.stampMatrixNV(vs, n2, -coef);
  }
  // stamp independent voltage source #vs, from n1 to n2, amount v
  stampVoltageSource(n1, n2, vs, v) {
    if (vs == null) return;
    if (v !== void 0) {
      this.stampMatrixNV(vs, n1, -1);
      this.stampMatrixNV(vs, n2, 1);
      this.stampRightSideVS(vs, v);
      this.stampMatrixVN(n1, vs, 1);
      this.stampMatrixVN(n2, vs, -1);
    } else {
      this.stampMatrixNV(vs, n1, -1);
      this.stampMatrixNV(vs, n2, 1);
      this.stampMatrixVN(n1, vs, 1);
      this.stampMatrixVN(n2, vs, -1);
    }
  }
  // stamp voltage source using nodes saved in VoltageSource
  stampVoltageSourceVS(vs, v) {
    this.stampVoltageSource(vs.n1, vs.n2, vs, v);
  }
  // update voltage source in doStep()
  updateVoltageSource(n1, n2, vs, v) {
    if (vs == null) return;
    this.stampRightSideVS(vs, v);
  }
  stampResistor(n1, n2, r) {
    const r0 = 1 / r;
    if (isNaN(r0) || !isFinite(r0)) {
      console.log("bad resistance " + r + " " + r0 + "\n");
      return;
    }
    this.stampMatrix(n1, n1, r0);
    this.stampMatrix(n2, n2, r0);
    this.stampMatrix(n1, n2, -r0);
    this.stampMatrix(n2, n1, -r0);
  }
  stampConductance(n1, n2, r0) {
    this.stampMatrix(n1, n1, r0);
    this.stampMatrix(n2, n2, r0);
    this.stampMatrix(n1, n2, -r0);
    this.stampMatrix(n2, n1, -r0);
  }
  // specify that current from cn1 to cn2 is equal to voltage from vn1 to vn2, divided by g
  stampVCCurrentSource(cn1, cn2, vn1, vn2, g) {
    this.stampMatrix(cn1, vn1, g);
    this.stampMatrix(cn2, vn2, g);
    this.stampMatrix(cn1, vn2, -g);
    this.stampMatrix(cn2, vn1, -g);
  }
  stampCurrentSource(n1, n2, i) {
    this.stampRightSide(n1, -i);
    this.stampRightSide(n2, i);
  }
  // stamp a current source from n1 to n2 depending on current through vs
  stampCCCS(n1, n2, vs, gain) {
    this.stampMatrixVN(n1, vs, gain);
    this.stampMatrixVN(n2, vs, -gain);
  }
  // stamp value x in row i, column j, meaning that a voltage change
  // of dv in node j will increase the current into node i by x dv.
  // (Unless i or j is a voltage source node.)
  stampMatrix(i, j, x) {
    if (!isFinite(x))
      SimulationManager.debugger();
    if (i.row > 0 && j.row > 0) {
      if (i.matrix !== j.matrix)
        SimulationManager.console("stampMatrix cross-matrix! node " + i.index + " (matrix row " + i.row + ") vs node " + j.index + " (matrix row " + j.row + ")");
      const m = i !== CircuitNode.ground ? i.matrix : j.matrix;
      m.stamp(i.row - 1, j.row - 1, x);
    }
  }
  // stamp from voltage source row to node column
  stampMatrixNV(i, j, x) {
    if (!isFinite(x))
      SimulationManager.debugger();
    if (j.row > 0) {
      if (i.matrix !== j.matrix)
        SimulationManager.console("stampMatrix cross-matrix! vs row " + i.row + " vs node " + j.index + " (row " + j.row + ")");
      i.matrix.stamp(i.row - 1, j.row - 1, x);
    }
  }
  // stamp from node row to voltage source column
  stampMatrixVN(i, j, x) {
    if (!isFinite(x))
      SimulationManager.debugger();
    if (i.row > 0) {
      if (i.matrix !== j.matrix)
        SimulationManager.console("stampMatrix cross-matrix! node " + i.index + " (row " + i.row + ") vs vs row " + j.row);
      j.matrix.stamp(i.row - 1, j.row - 1, x);
    }
  }
  // stamp voltage source to voltage source
  stampMatrixVV(i, j, x) {
    if (!isFinite(x))
      SimulationManager.debugger();
    if (i.matrix !== j.matrix)
      SimulationManager.console("stampMatrix cross-matrix! vs row " + i.row + " vs vs row " + j.row);
    i.matrix.stamp(i.row - 1, j.row - 1, x);
  }
  // stamp value x on the right side of row i, representing an
  // independent current source flowing into node i
  stampRightSide(n, x) {
    if (x === void 0)
      return;
    if (n.row > 0)
      n.matrix.rightSide[n.row - 1] += x;
  }
  stampRightSideVS(vs, x) {
    if (x === void 0)
      return;
    vs.matrix.rightSide[vs.row - 1] += x;
  }
  // indicate that the values on the left side of row change in doStep() (no-ops)
  stampNonLinear(n) {
  }
  stampNonLinearVS(vs) {
  }
  converged = false;
  subIterations = 0;
  runCircuit(didAnalyze) {
    if (this.matrices == null || this.elmList.length === 0) {
      this.matrices = null;
      return;
    }
    let iter;
    let debugprint = this.app.dumpMatrix;
    this.app.dumpMatrix = false;
    const steprate = Math.trunc(160 * this.app.getIterCount());
    let tm = Date.now();
    let lit = this.lastIterTime;
    if (lit === 0) {
      this.lastIterTime = tm;
      return;
    }
    if (1e3 >= steprate * (tm - this.lastIterTime) && !didAnalyze)
      return;
    const delayWireProcessing = this.app.scopeManager.canDelayWireProcessing();
    const timeStepCountAtFrameStart = this.timeStepCount;
    let goodIterations = 100;
    const frameTimeLimit = Math.trunc(1e3 / this.app.minFrameRate);
    if (CircuitNode.ground.v != 0)
      this.stop("ground node at nonzero voltage", null);
    for (iter = 1; ; iter++) {
      if (goodIterations >= 3 && this.timeStep < this.maxTimeStep) {
        this.timeStep = Math.min(this.timeStep * 2, this.maxTimeStep);
        SimulationManager.console("timestep up = " + this.timeStep + " at " + this.t);
        this.stampCircuit();
        goodIterations = 0;
      }
      let i, j, subiter;
      for (i = 0; i !== this.elmArr.length; i++)
        this.elmArr[i].startIteration();
      this.app.ui.steps++;
      const subiterCount = this.adjustTimeStep && this.timeStep / 2 > this.minTimeStep ? 100 : 5e3;
      for (subiter = 0; subiter !== subiterCount; subiter++) {
        this.converged = true;
        this.subIterations = subiter;
        for (let mi = 0; mi !== this.matrices.length; mi++) {
          const m = this.matrices[mi];
          for (i = 0; i !== m.size; i++)
            m.rightSide[i] = m.origRightSide[i];
          if (m.nonLinear) {
            if (this.usingSparse) {
              const st = m.stamped;
              for (let k = 0; k !== st.length; k++) {
                const r = st[k] % m.size, c = (st[k] - r) / m.size;
                m.matrix[r][c] = m.origMatrix[r][c];
              }
            } else {
              for (i = 0; i !== m.size; i++)
                for (j = 0; j !== m.size; j++)
                  m.matrix[i][j] = m.origMatrix[i][j];
            }
          }
        }
        for (i = 0; i !== this.elmArr.length; i++)
          this.elmArr[i].doStep();
        if (this.app.stopMessage != null)
          return;
        const printit = debugprint;
        debugprint = false;
        for (let mi = 0; mi !== this.matrices.length; mi++) {
          const m = this.matrices[mi];
          if (m.size < 8) {
            for (j = 0; j !== m.size; j++) {
              for (i = 0; i !== m.size; i++) {
                const x = m.matrix[i][j];
                if (isNaN(x) || !isFinite(x)) {
                  this.stop("nan/infinite matrix!", null);
                  SimulationManager.console("matrix " + mi + " [" + i + "][" + j + "] is " + x);
                  return;
                }
              }
            }
          }
          if (printit) {
            SimulationManager.console("matrix " + mi + ":");
            for (j = 0; j !== m.size; j++) {
              let x = "";
              for (i = 0; i !== m.size; i++)
                x += m.matrix[j][i] + ",";
              x += "\n";
              SimulationManager.console(x);
            }
          }
          if (m.nonLinear) {
            if (this.converged && subiter > 0)
              continue;
            if (!SimulationManager.lu_factor(m.matrix, m.size, m.permute, m)) {
              this.stop("Singular matrix!", null);
              return;
            }
          }
          SimulationManager.lu_solve(m.matrix, m.size, m.permute, m.rightSide, m);
          this.applySolvedRightSide(m);
        }
        if (printit)
          SimulationManager.console("done");
        if (!this.circuitNonLinear)
          break;
        if (this.converged && subiter > 0)
          break;
      }
      if (subiter === subiterCount) {
        goodIterations = 0;
        if (this.adjustTimeStep) {
          this.timeStep /= 2;
          SimulationManager.console("timestep down to " + this.timeStep + " at " + this.t);
        }
        if (this.timeStep < this.minTimeStep || !this.adjustTimeStep) {
          SimulationManager.console("convergence failed after " + subiter + " iterations");
          this.stop("Convergence failed!", null);
          break;
        }
        for (let mi = 0; mi !== this.matrices.length; mi++)
          this.setNodeVoltages(this.matrices[mi], this.matrices[mi].lastNodeVoltages);
        this.stampCircuit();
        continue;
      }
      if (subiter > 5 || this.timeStep < this.maxTimeStep)
        SimulationManager.console("converged after " + subiter + " iterations, timeStep = " + this.timeStep);
      if (subiter < 3)
        goodIterations++;
      else
        goodIterations = 0;
      this.t += this.timeStep;
      this.timeStepAccum += this.timeStep;
      if (this.timeStepAccum >= this.maxTimeStep) {
        this.timeStepAccum -= this.maxTimeStep;
        this.timeStepCount++;
      }
      for (i = 0; i !== this.elmArr.length; i++)
        this.elmArr[i].stepFinished();
      if (!delayWireProcessing)
        this.calcWireCurrents();
      this.app.onTimeStep();
      for (let mi = 0; mi !== this.matrices.length; mi++) {
        const m = this.matrices[mi];
        for (i = 0; i !== m.nodeCount; i++)
          m.lastNodeVoltages[i] = m.nodeVoltages[i];
      }
      tm = Date.now();
      lit = tm;
      if ((this.timeStepCount - timeStepCountAtFrameStart) * 1e3 >= steprate * (tm - this.lastIterTime) || tm - this.app.ui.lastFrameTime > frameTimeLimit)
        break;
      if (!this.app.simRunning)
        break;
    }
    this.lastIterTime = lit;
    if (delayWireProcessing)
      this.calcWireCurrents();
  }
  // set node voltages given right side found by solving one matrix
  applySolvedRightSide(m) {
    let j;
    for (j = 0; j !== m.size; j++) {
      const res = m.rightSide[j];
      if (isNaN(res)) {
        this.converged = false;
        break;
      }
      if (j < m.nodeCount) {
        m.nodeVoltages[j] = res;
      }
    }
    for (j = 0; j !== m.voltageSourceList.length; j++) {
      const vs = m.voltageSourceList[j];
      const res = m.rightSide[vs.row - 1];
      if (!isNaN(res))
        vs.elm.setCurrent(vs, res);
    }
    this.setNodeVoltages(m, m.nodeVoltages);
  }
  // set node voltages in each element given an array of node voltages for one matrix
  setNodeVoltages(m, nv) {
    let j, k;
    for (j = 0; j !== m.nodeList.length; j++) {
      const cn = m.nodeList[j];
      const res = nv[cn.row - 1];
      cn.v = res;
      for (k = 0; k !== cn.links.length; k++) {
        const cnl = cn.links[k];
        cnl.elm.calculateCurrent();
      }
    }
  }
  // we removed wires from the matrix to speed things up.  in order to display wire currents,
  // we need to calculate them now.
  calcWireCurrents() {
    let i, j;
    for (i = 0; i !== this.wireInfoList.length; i++) {
      const ws = this.wireInfoList[i];
      let cur = 0;
      if (ws.post === 0) {
        const p = ws.wire.getPost(ws.bit);
        for (j = 0; j !== ws.neighbors.length; j++) {
          const ce = ws.neighbors[j];
          cur += ce.getCurrentIntoNode(ce.getNodeAtPoint(p));
        }
      } else {
        if (ws.endpoint1 != null && ws.endpoint1.startsWith("label:")) {
          if (ws.labelNeighbors != null)
            for (j = 0; j !== ws.labelNeighbors.length; j++)
              cur += ws.labelNeighbors[j].current;
        } else {
          const p = ws.wire.getConnectedPost(ws.bit);
          for (j = 0; j !== ws.neighbors.length; j++) {
            const ce = ws.neighbors[j];
            cur += ce.getCurrentIntoNode(ce.getNodeAtPoint(p));
          }
        }
      }
      if (ws.post !== 0)
        cur = -cur;
      ws.wire.setWireCurrent(ws.bit, cur);
      ws.current = cur;
    }
  }
  getCircuitAsComposite() {
    return HookRegistry.getCircuitAsComposite?.(this) ?? null;
  }
  static invertMatrix(a, n) {
    const ipvt = new Array(n);
    SimulationManager.lu_factor_dense(a, n, ipvt);
    let i, j;
    const b = new Array(n).fill(0);
    const inva = Array.from({ length: n }, () => new Array(n).fill(0));
    for (i = 0; i !== n; i++) {
      for (j = 0; j !== n; j++)
        b[j] = 0;
      b[i] = 1;
      SimulationManager.lu_solve_dense(a, n, ipvt, b);
      for (j = 0; j !== n; j++)
        inva[j][i] = b[j];
    }
    for (i = 0; i !== n; i++)
      for (j = 0; j !== n; j++)
        a[i][j] = inva[i][j];
  }
  // Dispatching lu_factor: uses sparse or dense solver based on solverType setting
  static lu_factor(a, n, ipvt, cm) {
    const sm = SimulationManager.theSim;
    if (sm !== null && sm.usingSparse) {
      if (!cm.stampedSorted) {
        cm.stamped.sort((x, y) => x - y);
        cm.stampedSorted = true;
      }
      const sparse = DMatrixSparseCSC.convertEntries(a, cm.stamped, DMatrixSparseCSC.EPS);
      if (cm.sparseLU === null) cm.sparseLU = new SparseLU();
      return cm.sparseLU.setA(sparse);
    }
    return SimulationManager.lu_factor_dense(a, n, ipvt);
  }
  // factors a matrix into upper and lower triangular matrices by
  // gaussian elimination.  On entry, a[0..n-1][0..n-1] is the
  // matrix to be factored.  ipvt[] returns an integer vector of pivot
  // indices, used in the lu_solve() routine.
  static lu_factor_dense(a, n, ipvt) {
    let i, j, k;
    for (i = 0; i !== n; i++) {
      let row_all_zeros = true;
      for (j = 0; j !== n; j++) {
        if (a[i][j] !== 0) {
          row_all_zeros = false;
          break;
        }
      }
      if (row_all_zeros)
        return false;
    }
    for (j = 0; j !== n; j++) {
      for (i = 0; i !== j; i++) {
        let q = a[i][j];
        for (k = 0; k !== i; k++)
          q -= a[i][k] * a[k][j];
        a[i][j] = q;
      }
      let largest = 0;
      let largestRow = -1;
      for (i = j; i !== n; i++) {
        let q = a[i][j];
        for (k = 0; k !== j; k++)
          q -= a[i][k] * a[k][j];
        a[i][j] = q;
        const x = Math.abs(q);
        if (x >= largest) {
          largest = x;
          largestRow = i;
        }
      }
      if (j !== largestRow) {
        if (largestRow === -1) {
          SimulationManager.console("largestRow == -1");
          return false;
        }
        let x;
        for (k = 0; k !== n; k++) {
          x = a[largestRow][k];
          a[largestRow][k] = a[j][k];
          a[j][k] = x;
        }
      }
      ipvt[j] = largestRow;
      if (a[j][j] === 0) {
        SimulationManager.console("didn't avoid zero");
        return false;
      }
      if (j !== n - 1) {
        const mult = 1 / a[j][j];
        for (i = j + 1; i !== n; i++)
          a[i][j] *= mult;
      }
    }
    return true;
  }
  // Dispatching lu_solve: uses sparse or dense solver based on solverType setting
  static lu_solve(a, n, ipvt, b, cm) {
    const sm = SimulationManager.theSim;
    if (sm !== null && sm.usingSparse && cm.sparseLU !== null) {
      cm.sparseLU.solve(b, b);
      return;
    }
    SimulationManager.lu_solve_dense(a, n, ipvt, b);
  }
  // Solves the set of n linear equations using a LU factorization
  // previously performed by lu_factor.  On input, b[0..n-1] is the right
  // hand side of the equations, and on output, contains the solution.
  static lu_solve_dense(a, n, ipvt, b) {
    let i;
    for (i = 0; i !== n; i++) {
      const row = ipvt[i];
      let swap = b[row];
      b[row] = b[i];
      b[i] = swap;
      if (swap !== 0)
        break;
    }
    const bi = i++;
    for (; i < n; i++) {
      const row = ipvt[i];
      let j;
      let tot = b[row];
      b[row] = b[i];
      for (j = bi; j < i; j++)
        tot -= a[i][j] * b[j];
      b[i] = tot;
    }
    for (i = n - 1; i >= 0; i--) {
      let tot = b[i];
      let j;
      for (j = i + 1; j !== n; j++)
        tot -= a[i][j] * b[j];
      b[i] = tot / a[i][i];
    }
  }
  getLabeledNodeVoltage(name) {
    for (let i = 0; i < this.elmList.length; i++) {
      const ce = this.elmList[i];
      if (ce.isLabeledNodeElm() && ce.getName() === name)
        return ce.nodes[0].v;
    }
    return 0;
  }
  static pointKey(p) {
    return p.x + "," + p.y + "," + p.z;
  }
  static WireSegment = WireSegment;
  static RoutedWireConnection = RoutedWireConnection;
}
class NodeMapEntry {
  node;
  constructor(n) {
    this.node = n ?? null;
  }
}

const SimulationManager$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    RoutedWireConnection,
    SimulationManager,
    WireSegment
}, Symbol.toStringTag, { value: 'Module' }));

class StringTokenizer {
  // WARNING: StringTokenizer is a CORE class in the bootstrap cycle. See the
  // comments in vm/reference/java/lang/Runtime for implications of this fact.
  /**
   * The position in the str, where we currently are.
   */
  pos;
  /**
   * The string that should be split into tokens.
   */
  str;
  /**
   * The length of the string.
   */
  len;
  /**
   * The string containing the delimiter characters.
   */
  delim;
  /**
   * Tells, if we should return the delimiters.
   */
  retDelims;
  constructor(str, delim = " 	\n\r\f", returnDelims = false) {
    this.len = str.length;
    this.str = str;
    this.delim = delim;
    this.retDelims = returnDelims;
    this.pos = 0;
  }
  /**
   * Tells if there are more tokens.
   *
   * @return true if the next call of nextToken() will succeed
   */
  hasMoreTokens() {
    if (!this.retDelims) {
      while (this.pos < this.len && this.delim.indexOf(this.str.charAt(this.pos)) >= 0)
        this.pos++;
    }
    return this.pos < this.len;
  }
  /**
   * Returns the nextToken, changing the delimiter set to the given
   * delim.  The change of the delimiter set is permanent, ie. the
   * next call of nextToken(), uses the same delimiter set.
   *
   * @param delim a string containing the new delimiter characters
   * @return the next token with respect to the new delimiter characters
   */
  nextToken(delim) {
    if (delim !== void 0)
      this.delim = delim;
    if (this.pos < this.len && this.delim.indexOf(this.str.charAt(this.pos)) >= 0) {
      if (this.retDelims)
        return this.str.substring(this.pos, ++this.pos);
      while (++this.pos < this.len && this.delim.indexOf(this.str.charAt(this.pos)) >= 0)
        ;
    }
    if (this.pos < this.len) {
      const start = this.pos;
      while (++this.pos < this.len && this.delim.indexOf(this.str.charAt(this.pos)) < 0)
        ;
      return this.str.substring(start, this.pos);
    }
    throw new Error("NoSuchElementException");
  }
  /**
   * This does the same as hasMoreTokens. This is the
   * Enumeration interface method.
   *
   * @return true, if the next call of nextElement() will succeed
   */
  hasMoreElements() {
    return this.hasMoreTokens();
  }
  /**
   * This does the same as nextTokens. This is the
   * Enumeration interface method.
   *
   * @return the next token with respect to the current delimiter characters
   */
  nextElement() {
    return this.nextToken();
  }
  /**
   * This counts the number of remaining tokens in the string, with
   * respect to the current delimiter set.
   *
   * @return the number of times nextTokens() will succeed
   */
  countTokens() {
    let count = 0;
    let delimiterCount = 0;
    let tokenFound = false;
    let tmpPos = this.pos;
    while (tmpPos < this.len) {
      if (this.delim.indexOf(this.str.charAt(tmpPos++)) >= 0) {
        if (tokenFound) {
          count++;
          tokenFound = false;
        }
        delimiterCount++;
      } else {
        tokenFound = true;
        while (tmpPos < this.len && this.delim.indexOf(this.str.charAt(tmpPos)) < 0)
          ++tmpPos;
      }
    }
    if (tokenFound)
      count++;
    return this.retDelims ? count + delimiterCount : count;
  }
}

class DiodeModel {
  static modelMap;
  flags = 0;
  name;
  description;
  saturationCurrent;
  seriesResistance;
  emissionCoefficient;
  breakdownVoltage;
  // used for UI code, not guaranteed to be set
  forwardVoltage = 0;
  forwardCurrent = 0;
  dumped = false;
  readOnly = false;
  builtIn = false;
  oldStyle = false;
  internal = false;
  static FLAGS_SIMPLE = 1;
  // Electron thermal voltage at SPICE's default temperature of 27 C (300.15 K):
  static vt = 0.025865;
  // The diode's "scale voltage", the voltage increase which will raise current by a factor of e.
  vscale;
  // The multiplicative equivalent of dividing by vscale (for speed).
  vdcoef;
  // voltage drop @ 1A
  fwdrop;
  constructor(scOrCopy, sr, ec, bv, d) {
    if (scOrCopy === void 0) {
      this.saturationCurrent = 1e-14;
      this.seriesResistance = 0;
      this.emissionCoefficient = 1;
      this.breakdownVoltage = 0;
      this.updateModel();
    } else if (scOrCopy instanceof DiodeModel) {
      const copy = scOrCopy;
      this.flags = copy.flags;
      this.saturationCurrent = copy.saturationCurrent;
      this.seriesResistance = copy.seriesResistance;
      this.emissionCoefficient = copy.emissionCoefficient;
      this.breakdownVoltage = copy.breakdownVoltage;
      this.forwardCurrent = copy.forwardCurrent;
      this.updateModel();
    } else {
      this.saturationCurrent = scOrCopy;
      this.seriesResistance = sr;
      this.emissionCoefficient = ec;
      this.breakdownVoltage = bv;
      this.description = d;
      this.updateModel();
    }
  }
  static getModelWithName(name) {
    DiodeModel.createModelMap();
    let lm = DiodeModel.modelMap.get(name);
    if (lm != null)
      return lm;
    lm = new DiodeModel();
    lm.name = name;
    DiodeModel.modelMap.set(name, lm);
    return lm;
  }
  static getModelWithNameOrCopy(name, oldmodel) {
    DiodeModel.createModelMap();
    const lm = DiodeModel.modelMap.get(name);
    if (lm != null)
      return lm;
    if (oldmodel == null) {
      CirSim.console("model not found: " + name);
      return DiodeModel.getDefaultModel();
    }
    const copy = new DiodeModel(oldmodel);
    copy.name = name;
    DiodeModel.modelMap.set(name, copy);
    return copy;
  }
  static createModelMap() {
    if (DiodeModel.modelMap != null)
      return;
    DiodeModel.modelMap = /* @__PURE__ */ new Map();
    DiodeModel.addDefaultModel("spice-default", new DiodeModel(1e-14, 0, 1, 0, null));
    DiodeModel.addDefaultModel("default", new DiodeModel(17143528192808883e-23, 0, 2, 0, null));
    DiodeModel.addDefaultModel("default-zener", new DiodeModel(17143528192808883e-23, 0, 2, 5.6, null));
    DiodeModel.addDefaultModel("old-default-led", new DiodeModel(22349907006671927e-34, 0, 2, 0, null).setInternal());
    DiodeModel.addDefaultModel("default-led", new DiodeModel(932e-13, 0.042, 3.73, 0, null));
    DiodeModel.addDefaultModel("default-optocoupler-led", new DiodeModel(1714e-10, 0, 4.077, 0, null));
    DiodeModel.addDefaultModel("1N5711", new DiodeModel(315e-9, 2.8, 2.03, 70, "Schottky"));
    DiodeModel.addDefaultModel("1N5712", new DiodeModel(68e-11, 12, 1.003, 20, "Schottky"));
    DiodeModel.addDefaultModel("BAT85", new DiodeModel(2076e-10, 2.326, 1.023, 33, "Schottky"));
    DiodeModel.addDefaultModel("1N34", new DiodeModel(2e-10, 0.084, 2.19, 60, "germanium").setInternal());
    DiodeModel.addDefaultModel("1N4004", new DiodeModel(188e-10, 0.0286, 2, 400, "general purpose"));
    DiodeModel.addDefaultModel("1N4148", new DiodeModel(4352e-12, 0.6458, 1.906, 75, "switching"));
    DiodeModel.addDefaultModel("x2n2646-emitter", new DiodeModel(213e-13, 0, 1.8, 0, null).setInternal());
    DiodeModel.loadInternalModel("~tl431ed-d_ed 0 1e-14 5 1 0 0");
    DiodeModel.loadInternalModel("~lm317-dz 0 1e-14 0 1 6.3 0");
  }
  static addDefaultModel(name, dm) {
    DiodeModel.modelMap.set(name, dm);
    dm.readOnly = dm.builtIn = true;
    dm.name = name;
  }
  setInternal() {
    this.internal = true;
    return this;
  }
  // create a new model using given parameters, keeping backward compatibility.  The method we use has problems, but we don't want to
  // change circuit behavior.  We don't do this anymore because we discovered that changing the leakage current to get a given fwdrop
  // does not work well; the leakage currents can be way too high or low.
  static getModelWithParameters(fwdrop, zvoltage) {
    DiodeModel.createModelMap();
    const emcoef = 2;
    for (const [, dm2] of DiodeModel.modelMap) {
      if (Math.abs(dm2.fwdrop - fwdrop) < 1e-8 && dm2.seriesResistance === 0 && Math.abs(dm2.breakdownVoltage - zvoltage) < 1e-8 && dm2.emissionCoefficient === emcoef)
        return dm2;
    }
    const vscale = emcoef * DiodeModel.vt;
    const vdcoef = 1 / vscale;
    const leakage = 1 / (Math.exp(fwdrop * vdcoef) - 1);
    let name = "fwdrop=" + fwdrop;
    if (zvoltage !== 0)
      name = name + " zvoltage=" + zvoltage;
    const dm = DiodeModel.getModelWithName(name);
    dm.saturationCurrent = leakage;
    dm.emissionCoefficient = emcoef;
    dm.breakdownVoltage = zvoltage;
    dm.readOnly = dm.oldStyle = true;
    dm.updateModel();
    return dm;
  }
  static getDefaultModel() {
    return DiodeModel.getModelWithName("default");
  }
  static loadInternalModel(s) {
    const st = new StringTokenizer(s);
    const dm = DiodeModel.undumpModel(st);
    dm.builtIn = dm.internal = true;
  }
  static clearDumpedFlags() {
    if (DiodeModel.modelMap == null)
      return;
    for (const [, dm] of DiodeModel.modelMap)
      dm.dumped = false;
  }
  static getModelList(zener) {
    const vector = [];
    for (const [, dm] of DiodeModel.modelMap) {
      if (dm.internal)
        continue;
      if (zener && dm.breakdownVoltage === 0)
        continue;
      if (!vector.includes(dm))
        vector.push(dm);
    }
    vector.sort((a, b) => a.compareTo(b));
    return vector;
  }
  compareTo(dm) {
    return this.name < dm.name ? -1 : this.name > dm.name ? 1 : 0;
  }
  getDescription() {
    if (this.description == null)
      return this.name;
    return this.name + " (" + Locale.LS(this.description) + ")";
  }
  static undumpModel(st) {
    const name = CustomLogicModel.unescape(st.nextToken());
    const dm = DiodeModel.getModelWithName(name);
    dm.undump(st);
    return dm;
  }
  undump(st) {
    this.flags = parseIntStrict(st.nextToken());
    this.saturationCurrent = parseFloatStrict(st.nextToken());
    this.seriesResistance = parseFloatStrict(st.nextToken());
    this.emissionCoefficient = parseFloatStrict(st.nextToken());
    this.breakdownVoltage = parseFloatStrict(st.nextToken());
    try {
      this.forwardCurrent = parseFloatStrict(st.nextToken());
    } catch (e) {
    }
    this.updateModel();
  }
  static undumpModelXml(xml) {
    const name = xml.parseStringAttr("nm", null);
    const dm = DiodeModel.getModelWithName(name);
    dm.undumpXml(xml);
    return dm;
  }
  undumpXml(xml) {
    this.flags = xml.parseIntAttr("f", this.flags);
    this.saturationCurrent = xml.parseDoubleAttr("is", this.saturationCurrent);
    this.seriesResistance = xml.parseDoubleAttr("rs", this.seriesResistance);
    this.emissionCoefficient = xml.parseDoubleAttr("n", this.emissionCoefficient);
    this.breakdownVoltage = xml.parseDoubleAttr("bv", this.breakdownVoltage);
    this.forwardCurrent = xml.parseDoubleAttr("fi", this.forwardCurrent);
    this.updateModel();
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Model Name", 0);
      ei.text = this.name == null ? "" : this.name;
      return ei;
    }
    if (n === 1)
      return new EditInfo("Saturation Current", this.saturationCurrent, -1, -1);
    if (this.isSimple()) {
      if (n === 2)
        return new EditInfo("Forward Voltage", this.forwardVoltage, -1, -1);
      if (n === 3)
        return new EditInfo("Current At Above Voltage (A)", this.forwardCurrent, -1, -1);
    } else {
      if (n === 2)
        return new EditInfo("Series Resistance", this.seriesResistance, -1, -1);
      if (n === 3)
        return new EditInfo(EditInfo.makeLink("diodecalc.html", "Emission Coefficient"), this.emissionCoefficient, -1, -1);
    }
    if (n === 4)
      return new EditInfo("Breakdown Voltage", this.breakdownVoltage, -1, -1);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.name = ei.textf.value;
      if (this.name.length > 0)
        DiodeModel.modelMap.set(this.name, this);
    }
    if (n === 1)
      this.saturationCurrent = ei.value;
    if (this.isSimple()) {
      if (n === 2)
        this.forwardVoltage = ei.value;
      if (n === 3)
        this.forwardCurrent = ei.value;
      this.setEmissionCoefficient();
    } else {
      if (n === 2)
        this.seriesResistance = ei.value;
      if (n === 3)
        this.emissionCoefficient = ei.value;
    }
    if (n === 4)
      this.breakdownVoltage = Math.abs(ei.value);
    this.updateModel();
    CircuitElm.app.updateModels();
  }
  // set emission coefficient for simple mode if we have enough data
  setEmissionCoefficient() {
    if (this.forwardCurrent > 0 && this.forwardVoltage > 0)
      this.emissionCoefficient = this.forwardVoltage / Math.log(this.forwardCurrent / this.saturationCurrent + 1) / DiodeModel.vt;
    this.seriesResistance = 0;
  }
  setForwardVoltage() {
    if (this.forwardCurrent === 0)
      this.forwardCurrent = 1;
    this.forwardVoltage = this.emissionCoefficient * DiodeModel.vt * Math.log(this.forwardCurrent / this.saturationCurrent + 1);
  }
  updateModel() {
    this.vscale = this.emissionCoefficient * DiodeModel.vt;
    this.vdcoef = 1 / this.vscale;
    this.fwdrop = Math.log(1 / this.saturationCurrent + 1) * this.emissionCoefficient * DiodeModel.vt;
  }
  dump() {
    this.dumped = true;
    return "34 " + CustomLogicModel.escape(this.name) + " " + this.flags + " " + this.saturationCurrent + " " + this.seriesResistance + " " + this.emissionCoefficient + " " + this.breakdownVoltage + " " + this.forwardCurrent;
  }
  dumpXml(doc) {
    this.dumped = true;
    const elem = doc.createElement("dm");
    CircuitXMLSerializer.dumpAttr(elem, "nm", this.name);
    CircuitXMLSerializer.dumpAttr(elem, "f", this.flags);
    CircuitXMLSerializer.dumpAttr(elem, "is", this.saturationCurrent);
    CircuitXMLSerializer.dumpAttr(elem, "rs", this.seriesResistance);
    CircuitXMLSerializer.dumpAttr(elem, "n", this.emissionCoefficient);
    CircuitXMLSerializer.dumpAttr(elem, "bv", this.breakdownVoltage);
    if (this.forwardCurrent > 0)
      CircuitXMLSerializer.dumpAttr(elem, "fi", this.forwardCurrent);
    doc.documentElement.appendChild(elem);
  }
  isSimple() {
    return (this.flags & DiodeModel.FLAGS_SIMPLE) !== 0;
  }
  setSimple(s) {
    this.flags = s ? DiodeModel.FLAGS_SIMPLE : 0;
  }
  pickName() {
    if (this.breakdownVoltage > 0 && this.breakdownVoltage < 20)
      this.name = "zener-" + CircuitElm.showFormat.format(this.breakdownVoltage);
    else if (this.isSimple())
      this.name = "fwdrop=" + CircuitElm.showFormat.format(this.forwardVoltage);
    else
      this.name = "diodemodel";
    if (DiodeModel.modelMap.get(this.name) != null) {
      let num = 2;
      for (; ; num++) {
        const n = this.name + "-" + num;
        if (DiodeModel.modelMap.get(n) == null) {
          this.name = n;
          break;
        }
      }
    }
  }
}

class TransistorModel {
  static modelMap;
  flags = 0;
  name;
  description = null;
  satCur;
  invRollOffF = 0;
  BEleakCur = 0;
  leakBEemissionCoeff = 1.5;
  invRollOffR = 0;
  BCleakCur = 0;
  leakBCemissionCoeff = 2;
  emissionCoeffF = 1;
  emissionCoeffR = 1;
  invEarlyVoltF = 0;
  invEarlyVoltR = 0;
  betaR = 1;
  // Junction capacitance parameters (SPICE Gummel-Poon charge storage)
  // These model the physical depletion-layer capacitance of each PN junction.
  // A real transistor junction is a thin insulating depletion region sandwiched
  // between two conducting regions -- physically identical to a parallel-plate
  // capacitor whose plate spacing (and therefore capacitance) varies with the
  // applied voltage.  Reverse bias widens the depletion layer (less capacitance);
  // forward bias narrows it (more capacitance).
  //
  // Without these, the BJT is a pure DC device -- it responds instantly to any
  // signal, no matter how fast.  With them, the transistor has a finite
  // transition frequency (ft) and exhibits the propagation delay and phase
  // shift that real transistors produce.
  //
  // SPICE formula:  C(V) = Cj0 / (1 - V/Vj)^Mj   for V < 0.5*Vj
  //                 (linear extrapolation above 0.5*Vj to avoid singularity)
  //
  // Typical values (from SPICE .model cards):
  //   2N2222A (general-purpose NPN):  CJE=22.01pF VJE=0.7  MJE=0.377
  //                                   CJC=7.306pF VJC=0.75 MJC=0.3416
  //   2N3904  (small-signal NPN):     CJE=4.493pF VJE=0.65 MJE=0.2593
  //                                   CJC=3.638pF VJC=0.75 MJC=0.3085
  //   2N3906  (small-signal PNP):     CJE=4.49pF  VJE=0.632 MJE=0.267
  //                                   CJC=4.43pF  VJC=0.632 MJC=0.33
  junctionCapBE = 0;
  // CJE: zero-bias BE depletion capacitance (F), 0=disabled
  junctionCapBC = 0;
  // CJC: zero-bias BC depletion capacitance (F), 0=disabled
  junctionPotBE = 0.75;
  // VJE: BE built-in potential (V)
  junctionPotBC = 0.75;
  // VJC: BC built-in potential (V)
  junctionExpBE = 0.33;
  // MJE: BE junction grading coefficient
  junctionExpBC = 0.33;
  // MJC: BC junction grading coefficient
  // Transit time parameters (SPICE Gummel-Poon diffusion charge storage)
  // These model the minority carrier charge stored in the base region during
  // active operation.  The diffusion capacitance Cd = TT * gm adds to the
  // depletion capacitance above, and is the dominant contributor at high
  // forward bias (where gm is large).
  //
  // Typical values (from SPICE .model cards):
  //   2N2222A:  TF=0.411ns  TR=46.91ns
  //   2N3904:   TF=0.301ns  TR=239ns
  //   2N3906:   TF=0.579ns  TR=94.36ns
  transitTimeF = 0;
  // TF: forward transit time (s), 0=disabled
  transitTimeR = 0;
  // TR: reverse transit time (s), 0=disabled
  dumped = false;
  readOnly = false;
  builtIn = false;
  internal = false;
  constructor(dOrCopy, sc) {
    if (dOrCopy === void 0) {
      this.updateModel();
    } else if (dOrCopy instanceof TransistorModel) {
      const copy = dOrCopy;
      this.flags = copy.flags;
      this.satCur = copy.satCur;
      this.invRollOffF = copy.invRollOffF;
      this.BEleakCur = copy.BEleakCur;
      this.leakBEemissionCoeff = copy.leakBEemissionCoeff;
      this.invRollOffR = copy.invRollOffR;
      this.BCleakCur = copy.BCleakCur;
      this.leakBCemissionCoeff = copy.leakBCemissionCoeff;
      this.emissionCoeffF = copy.emissionCoeffF;
      this.emissionCoeffR = copy.emissionCoeffR;
      this.invEarlyVoltF = copy.invEarlyVoltF;
      this.invEarlyVoltR = copy.invEarlyVoltR;
      this.betaR = copy.betaR;
      this.junctionCapBE = copy.junctionCapBE;
      this.junctionPotBE = copy.junctionPotBE;
      this.junctionExpBE = copy.junctionExpBE;
      this.junctionCapBC = copy.junctionCapBC;
      this.junctionPotBC = copy.junctionPotBC;
      this.junctionExpBC = copy.junctionExpBC;
      this.transitTimeF = copy.transitTimeF;
      this.transitTimeR = copy.transitTimeR;
      this.updateModel();
    } else {
      this.description = dOrCopy;
      this.satCur = sc;
      this.emissionCoeffF = this.emissionCoeffR = 1;
      this.leakBEemissionCoeff = 1.5;
      this.leakBCemissionCoeff = 2;
      this.betaR = 1;
      this.junctionCapBE = 0;
      this.junctionCapBC = 0;
      this.junctionPotBE = 0.75;
      this.junctionPotBC = 0.75;
      this.junctionExpBE = 0.33;
      this.junctionExpBC = 0.33;
      this.transitTimeF = 0;
      this.transitTimeR = 0;
      this.updateModel();
    }
  }
  static getModelWithName(name) {
    TransistorModel.createModelMap();
    let lm = TransistorModel.modelMap.get(name);
    if (lm != null)
      return lm;
    lm = new TransistorModel();
    lm.name = name;
    TransistorModel.modelMap.set(name, lm);
    return lm;
  }
  static getModelWithNameOrCopy(name, oldmodel) {
    TransistorModel.createModelMap();
    const lm = TransistorModel.modelMap.get(name);
    if (lm != null)
      return lm;
    if (oldmodel == null) {
      CirSim.console("model not found: " + name);
      return TransistorModel.getDefaultModel();
    }
    const copy = new TransistorModel(oldmodel);
    copy.name = name;
    TransistorModel.modelMap.set(name, copy);
    return copy;
  }
  static createModelMap() {
    if (TransistorModel.modelMap != null)
      return;
    TransistorModel.modelMap = /* @__PURE__ */ new Map();
    TransistorModel.addDefaultModel("default", new TransistorModel("default", 1e-13));
    TransistorModel.addDefaultModel("spice-default", new TransistorModel("spice-default", 1e-16));
    TransistorModel.loadInternalModel("xlm324v2-qpi 0 1.01e-16 333.3333333333333 0 1.5 0 0 2 1 1 0.0034482758620689655 0 1");
    TransistorModel.loadInternalModel("xlm324v2-qpi 0 1.01e-16 333.3333333333333 0 1.5 0 0 2 1 1 0.0034482758620689655 0 1");
    TransistorModel.loadInternalModel("xlm324v2-qpa 0 1.01e-16 333.3333333333333 0 1.5 0 0 2 1 1 0.004081632653061225 0 1");
    TransistorModel.loadInternalModel("xlm324v2-qnq 0 1e-16 200 0 1.5 0 0 2 1 1 0 0 1");
    TransistorModel.loadInternalModel("xlm324v2-qpq 0 1e-16 333.3333333333333 0 1.5 0 0 2 1 1 0 0 1");
    TransistorModel.loadInternalModel("~tl431ed-qn_ed 0 1e-16 0 0 1.5 0 0 2 1 1 0.0125 0.02 1");
    TransistorModel.loadInternalModel("~tl431ed-qn_ed-A1.2 0 1.2e-16 0 0 1.5 0 0 2 1 1 0.0125 0.02 1");
    TransistorModel.loadInternalModel("~tl431ed-qn_ed-A2.2 0 2.2000000000000002e-16 0 0 1.5 0 0 2 1 1 0.0125 0.02 1");
    TransistorModel.loadInternalModel("~tl431ed-qn_ed-A0.5 0 5e-17 0 0 1.5 0 0 2 1 1 0.0125 0.02 1");
    TransistorModel.loadInternalModel("~tl431ed-qp_ed 0 1e-16 0 0 1.5 0 0 2 1 1 0.014285714285714285 0.025 1");
    TransistorModel.loadInternalModel("~tl431ed-qn_ed-A5 0 5e-16 0 0 1.5 0 0 2 1 1 0.0125 0.02 1");
    TransistorModel.loadInternalModel("~lm317-qpl-A0.1 0 1e-17 0 0 1.5 0 0 2 1 1 0.02 0 1");
    TransistorModel.loadInternalModel("~lm317-qnl-A0.2 0 2e-17 0 0 1.5 0 0 2 1 1 0.01 0 1");
    TransistorModel.loadInternalModel("~lm317-qpl-A0.2 0 2e-17 0 0 1.5 0 0 2 1 1 0.02 0 1");
    TransistorModel.loadInternalModel("~lm317-qnl-A2 0 2e-16 0 0 1.5 0 0 2 1 1 0.01 0 1");
    TransistorModel.loadInternalModel("~lm317-qpl-A2 0 2e-16 0 0 1.5 0 0 2 1 1 0.02 0 1");
    TransistorModel.loadInternalModel("~lm317-qnl-A5 0 5e-16 0 0 1.5 0 0 2 1 1 0.01 0 1");
    TransistorModel.loadInternalModel("~lm317-qnl-A50 0 5e-15 0 0 1.5 0 0 2 1 1 0.01 0 1");
  }
  static addDefaultModel(name, dm) {
    TransistorModel.modelMap.set(name, dm);
    dm.readOnly = dm.builtIn = true;
    dm.name = name;
  }
  static getDefaultModel() {
    return TransistorModel.getModelWithName("default");
  }
  static clearDumpedFlags() {
    if (TransistorModel.modelMap == null)
      return;
    for (const [, tm] of TransistorModel.modelMap)
      tm.dumped = false;
  }
  static getModelList() {
    const vector = [];
    for (const [, tm] of TransistorModel.modelMap) {
      if (tm.internal)
        continue;
      if (!vector.includes(tm))
        vector.push(tm);
    }
    vector.sort((a, b) => a.compareTo(b));
    return vector;
  }
  compareTo(dm) {
    return this.name < dm.name ? -1 : this.name > dm.name ? 1 : 0;
  }
  getDescription() {
    if (this.description == null || this.description === this.name)
      return this.name;
    return this.name + " (" + Locale.LS(this.description) + ")";
  }
  static loadInternalModel(s) {
    const st = new StringTokenizer(s);
    const tm = TransistorModel.undumpModel(st);
    tm.builtIn = tm.internal = true;
  }
  static undumpModel(st) {
    const name = CustomLogicModel.unescape(st.nextToken());
    const dm = TransistorModel.getModelWithName(name);
    dm.undump(st);
    return dm;
  }
  undump(st) {
    this.flags = parseIntStrict(st.nextToken());
    this.satCur = parseFloatStrict(st.nextToken());
    this.invRollOffF = parseFloatStrict(st.nextToken());
    this.BEleakCur = parseFloatStrict(st.nextToken());
    this.leakBEemissionCoeff = parseFloatStrict(st.nextToken());
    this.invRollOffR = parseFloatStrict(st.nextToken());
    this.BCleakCur = parseFloatStrict(st.nextToken());
    this.leakBCemissionCoeff = parseFloatStrict(st.nextToken());
    this.emissionCoeffF = parseFloatStrict(st.nextToken());
    this.emissionCoeffR = parseFloatStrict(st.nextToken());
    this.invEarlyVoltF = parseFloatStrict(st.nextToken());
    this.invEarlyVoltR = parseFloatStrict(st.nextToken());
    this.betaR = parseFloatStrict(st.nextToken());
    try {
      this.junctionCapBE = parseFloatStrict(st.nextToken());
      this.junctionPotBE = parseFloatStrict(st.nextToken());
      this.junctionExpBE = parseFloatStrict(st.nextToken());
      this.junctionCapBC = parseFloatStrict(st.nextToken());
      this.junctionPotBC = parseFloatStrict(st.nextToken());
      this.junctionExpBC = parseFloatStrict(st.nextToken());
    } catch (e) {
    }
    try {
      this.transitTimeF = parseFloatStrict(st.nextToken());
      this.transitTimeR = parseFloatStrict(st.nextToken());
    } catch (e) {
    }
    this.updateModel();
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Model Name", 0);
      ei.text = this.name == null ? "" : this.name;
      return ei;
    }
    if (n === 1) return new EditInfo("Transport Saturation Current (IS)", this.satCur);
    if (n === 2) return new EditInfo("Reverse Beta (BR)", this.betaR);
    if (n === 3) return new EditInfo("Forward Early Voltage (VAF)", 1 / this.invEarlyVoltF);
    if (n === 4) return new EditInfo("Reverse Early Voltage (VAR)", 1 / this.invEarlyVoltR);
    if (n === 5) return new EditInfo("Corner For Forward Beta High Current Roll-Off (IKF)", 1 / this.invRollOffF);
    if (n === 6) return new EditInfo("Corner For Reverse Beta High Current Roll-Off (IKR)", 1 / this.invRollOffR);
    if (n === 7) return new EditInfo("Forward Current Emission Coefficient (NF)", this.emissionCoeffF);
    if (n === 8) return new EditInfo("Reverse Current Emission Coefficient (NR)", this.emissionCoeffR);
    if (n === 9) return new EditInfo("B-E Leakage Saturation Current (ISE)", this.BEleakCur);
    if (n === 10) return new EditInfo("B-E Leakage Emission Coefficient (NE)", this.leakBEemissionCoeff);
    if (n === 11) return new EditInfo("B-C Leakage Saturation Current (ISC)", this.BCleakCur);
    if (n === 12) return new EditInfo("B-C Leakage Emission Coefficient (NC)", this.leakBCemissionCoeff);
    if (n === 13) return new EditInfo("B-E Zero-Bias Junction Capacitance (CJE)", this.junctionCapBE);
    if (n === 14) return new EditInfo("B-E Junction Potential (VJE)", this.junctionPotBE).setPositive();
    if (n === 15) return new EditInfo("B-E Junction Grading Coefficient (MJE)", this.junctionExpBE).setPositive();
    if (n === 16) return new EditInfo("B-C Zero-Bias Junction Capacitance (CJC)", this.junctionCapBC);
    if (n === 17) return new EditInfo("B-C Junction Potential (VJC)", this.junctionPotBC).setPositive();
    if (n === 18) return new EditInfo("B-C Junction Grading Coefficient (MJC)", this.junctionExpBC).setPositive();
    if (n === 19) return new EditInfo("Forward Transit Time TF (s)", this.transitTimeF);
    if (n === 20) return new EditInfo("Reverse Transit Time TR (s)", this.transitTimeR);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.name = ei.textf.value;
      if (this.name.length > 0)
        TransistorModel.modelMap.set(this.name, this);
    }
    if (n === 1) this.satCur = ei.value;
    if (n === 2) this.betaR = ei.value;
    if (n === 3) this.invEarlyVoltF = 1 / ei.value;
    if (n === 4) this.invEarlyVoltR = 1 / ei.value;
    if (n === 5) this.invRollOffF = 1 / ei.value;
    if (n === 6) this.invRollOffR = 1 / ei.value;
    if (n === 7) this.emissionCoeffF = ei.value;
    if (n === 8) this.emissionCoeffR = ei.value;
    if (n === 9) this.BEleakCur = ei.value;
    if (n === 10) this.leakBEemissionCoeff = ei.value;
    if (n === 11) this.BCleakCur = ei.value;
    if (n === 12) this.leakBCemissionCoeff = ei.value;
    if (n === 13) this.junctionCapBE = ei.value;
    if (n === 14) this.junctionPotBE = ei.value;
    if (n === 15) this.junctionExpBE = ei.value;
    if (n === 16) this.junctionCapBC = ei.value;
    if (n === 17) this.junctionPotBC = ei.value;
    if (n === 18) this.junctionExpBC = ei.value;
    if (n === 19) {
      if (ei.value >= 0) this.transitTimeF = ei.value;
      else ei.setError("must be >= 0");
    }
    if (n === 20) {
      if (ei.value >= 0) this.transitTimeR = ei.value;
      else ei.setError("must be >= 0");
    }
    this.updateModel();
    CircuitElm.app.updateModels();
  }
  updateModel() {
  }
  pickName() {
    this.name = "transistormodel";
    if (TransistorModel.modelMap.get(this.name) != null) {
      let num = 2;
      for (; ; num++) {
        const n = this.name + "-" + num;
        if (TransistorModel.modelMap.get(n) == null) {
          this.name = n;
          break;
        }
      }
    }
    TransistorModel.modelMap.set(this.name, this);
  }
  dumpXml(doc) {
    this.dumped = true;
    const elem = doc.createElement("tm");
    CircuitXMLSerializer.dumpAttr(elem, "nm", this.name);
    CircuitXMLSerializer.dumpAttr(elem, "f", this.flags);
    CircuitXMLSerializer.dumpAttr(elem, "is", this.satCur);
    CircuitXMLSerializer.dumpAttr(elem, "ikf", this.invRollOffF);
    CircuitXMLSerializer.dumpAttr(elem, "ise", this.BEleakCur);
    CircuitXMLSerializer.dumpAttr(elem, "ne", this.leakBEemissionCoeff);
    CircuitXMLSerializer.dumpAttr(elem, "ikr", this.invRollOffR);
    CircuitXMLSerializer.dumpAttr(elem, "isc", this.BCleakCur);
    CircuitXMLSerializer.dumpAttr(elem, "nc", this.leakBCemissionCoeff);
    CircuitXMLSerializer.dumpAttr(elem, "nf", this.emissionCoeffF);
    CircuitXMLSerializer.dumpAttr(elem, "nr", this.emissionCoeffR);
    CircuitXMLSerializer.dumpAttr(elem, "vaf", this.invEarlyVoltF);
    CircuitXMLSerializer.dumpAttr(elem, "var", this.invEarlyVoltR);
    CircuitXMLSerializer.dumpAttr(elem, "br", this.betaR);
    if (this.junctionCapBE !== 0) {
      CircuitXMLSerializer.dumpAttr(elem, "cje", this.junctionCapBE);
      CircuitXMLSerializer.dumpAttr(elem, "vje", this.junctionPotBE);
      CircuitXMLSerializer.dumpAttr(elem, "mje", this.junctionExpBE);
    }
    if (this.junctionCapBC !== 0) {
      CircuitXMLSerializer.dumpAttr(elem, "cjc", this.junctionCapBC);
      CircuitXMLSerializer.dumpAttr(elem, "vjc", this.junctionPotBC);
      CircuitXMLSerializer.dumpAttr(elem, "mjc", this.junctionExpBC);
    }
    if (this.transitTimeF !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "tf", this.transitTimeF);
    if (this.transitTimeR !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "tr", this.transitTimeR);
    doc.documentElement.appendChild(elem);
  }
  static undumpModelXml(xml) {
    const name = xml.parseStringAttr("nm", null);
    const tm = TransistorModel.getModelWithName(name);
    tm.undumpXml(xml);
    return tm;
  }
  undumpXml(xml) {
    this.flags = xml.parseIntAttr("f", this.flags);
    this.satCur = xml.parseDoubleAttr("is", this.satCur);
    this.invRollOffF = xml.parseDoubleAttr("ikf", this.invRollOffF);
    this.BEleakCur = xml.parseDoubleAttr("ise", this.BEleakCur);
    this.leakBEemissionCoeff = xml.parseDoubleAttr("ne", this.leakBEemissionCoeff);
    this.invRollOffR = xml.parseDoubleAttr("ikr", this.invRollOffR);
    this.BCleakCur = xml.parseDoubleAttr("isc", this.BCleakCur);
    this.leakBCemissionCoeff = xml.parseDoubleAttr("nc", this.leakBCemissionCoeff);
    this.emissionCoeffF = xml.parseDoubleAttr("nf", this.emissionCoeffF);
    this.emissionCoeffR = xml.parseDoubleAttr("nr", this.emissionCoeffR);
    this.invEarlyVoltF = xml.parseDoubleAttr("vaf", this.invEarlyVoltF);
    this.invEarlyVoltR = xml.parseDoubleAttr("var", this.invEarlyVoltR);
    this.betaR = xml.parseDoubleAttr("br", this.betaR);
    this.junctionCapBE = xml.parseDoubleAttr("cje", this.junctionCapBE);
    this.junctionPotBE = xml.parseDoubleAttr("vje", this.junctionPotBE);
    this.junctionExpBE = xml.parseDoubleAttr("mje", this.junctionExpBE);
    this.junctionCapBC = xml.parseDoubleAttr("cjc", this.junctionCapBC);
    this.junctionPotBC = xml.parseDoubleAttr("vjc", this.junctionPotBC);
    this.junctionExpBC = xml.parseDoubleAttr("mjc", this.junctionExpBC);
    this.transitTimeF = xml.parseDoubleAttr("tf", this.transitTimeF);
    this.transitTimeR = xml.parseDoubleAttr("tr", this.transitTimeR);
    this.updateModel();
  }
}

class CircuitLoader {
  app;
  // was CirSim – the main app/UI object
  sim;
  // the simulation engine
  scopes;
  // to clear/add scopes
  menus;
  // to toggle check items (dots, volts, etc.)
  // Flags (copied from CirSim for clarity – you can keep them here or reference app's constants)
  static RC_RETAIN = 1;
  static RC_NO_CENTER = 2;
  static RC_SUBCIRCUITS = 4;
  static RC_KEEP_TITLE = 8;
  constructor(app, sim, scopes, menus) {
    this.app = app;
    this.sim = sim;
    this.scopes = scopes;
    this.menus = menus;
  }
  clearCircuit() {
    WireRouter.lastRouter = null;
    this.app.mouse.clearMouseElm();
    for (const ce of this.app.elmList) {
      ce.delete();
    }
    this.sim.resetTime();
    this.sim.solverType = SimulationManager.SOLVER_AUTO;
    this.app.elmList.length = 0;
    this.app.hintType = -1;
    this.sim.maxTimeStep = 5e-6;
    this.sim.minTimeStep = 5e-11;
    this.menus.dotsCheckItem.setState(false);
    this.menus.smallGridCheckItem.setState(false);
    this.menus.powerCheckItem.setState(false);
    this.menus.voltsCheckItem.setState(true);
    this.menus.showValuesCheckItem.setState(true);
    this.app.autoDCOnReset = false;
    this.app.setGrid();
    this.app.ui.speedBar.setValue(117);
    this.app.ui.currentBar.setValue(50);
    this.app.ui.powerBar.setValue(50);
    CircuitElm.voltageRange = 5;
    this.scopes.clearScopes();
    this.sim.lastIterTime = 0;
    if (this.app.contextStack.length === 0) {
      SubcircuitModel.clearLocalModels();
    }
    if (this.app.ui.subcircuitStack.length > 0) {
      this.app.ui.subcircuitStack.length = 0;
      this.app.ui.elmList = this.app.elmList;
      this.app.ui.updateSubcircuitPath();
    }
  }
  // subcircuit library files (saved from the Subcircuit Manager) are XML circuit files
  // containing only subcircuit models
  static isSubcircuitLibrary(text) {
    return /^<cir\b[^>]*\bsublib="1"/.test(text);
  }
  // load subcircuit models from a library file, making them global.  Leaves the current circuit alone.
  readSubcircuitLibrary(text) {
    const doc = new DOMParser().parseFromString(text, "text/xml");
    const xml = new CircuitXMLDeserializer(this.app);
    const models = SubcircuitModel.loadLibrary(xml, doc.documentElement);
    for (const m of models)
      this.app.refreshModels(m.name);
    if (models.length === 0)
      this.app.ui.showToast(Locale.LS("No subcircuits found in file"));
    else
      this.app.ui.showToast(Locale.LS("Loaded subcircuits: ") + models.map((m) => m.name).join(", "));
  }
  readCircuit(text, flags = 0) {
    if (CircuitLoader.isSubcircuitLibrary(text)) {
      this.readSubcircuitLibrary(text);
      return;
    }
    if (text.startsWith("<")) {
      if ((flags & CircuitLoader.RC_RETAIN) == 0)
        this.clearCircuit();
      const xml = new CircuitXMLDeserializer(this.app);
      xml.readCircuit(text, flags);
      return;
    }
    this.readCircuitText(text, flags);
    if ((flags & CircuitLoader.RC_KEEP_TITLE) == 0) {
      this.app.setCircuitTitle(null);
    }
  }
  async loadCircuitFromUrl(url, title) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        this.readCircuit(text, CircuitLoader.RC_KEEP_TITLE);
        this.app.allowSave(false);
        this.app.unsavedChanges = false;
        this.app.savedFlag = true;
      } else {
        window.alert(Locale.LS("Can't load circuit!"));
        console.log("Bad file server response:" + response.statusText);
      }
    } catch (e) {
      window.alert(Locale.LS("Can't load circuit!"));
      console.log("File Error Response", e);
    }
    if (title != null) {
      this.app.setCircuitTitle(title);
    }
    this.app.unsavedChanges = false;
  }
  readCircuitText(text, flags) {
    if ((flags & CircuitLoader.RC_RETAIN) == 0) {
      this.clearCircuit();
    }
    const subs = (flags & CircuitLoader.RC_SUBCIRCUITS) != 0;
    const lines = text.split(/\r?\n|\r/);
    for (const line of lines) {
      if (line.length === 0) continue;
      const st = new StringTokenizer(line, " +	\n\r\f");
      while (st.hasMoreTokens()) {
        const type = st.nextToken();
        let tint = type.charCodeAt(0);
        try {
          if (subs && tint !== ".".charCodeAt(0)) continue;
          if (tint === "o".charCodeAt(0)) {
            const sc = new Scope(this.app, this.sim);
            sc.undump(st);
            this.scopes.addScope(sc);
            break;
          }
          if (tint === "h".charCodeAt(0)) {
            this.readHint(st);
            break;
          }
          if (tint === "$".charCodeAt(0)) {
            this.readOptions(st, flags);
            break;
          }
          if (tint === "!".charCodeAt(0)) {
            CustomLogicModel.undumpModel(st);
            break;
          }
          if (tint === "%".charCodeAt(0) || tint === "?".charCodeAt(0) || tint === "B".charCodeAt(0)) {
            break;
          }
          if (tint >= "0".charCodeAt(0) && tint <= "9".charCodeAt(0))
            tint = parseIntStrict(type);
          if (tint === 34) {
            DiodeModel.undumpModel(st);
            break;
          }
          if (tint === 32) {
            TransistorModel.undumpModel(st);
            break;
          }
          if (tint === 38) {
            const adj = new window.Adjustable(st, this.app);
            if (adj.elm != null)
              this.app.adjustables.push(adj);
            break;
          }
          if (tint === ".".charCodeAt(0)) {
            SubcircuitModel.undumpModel(st);
            break;
          }
          const x1 = parseIntStrict(st.nextToken());
          const y1 = parseIntStrict(st.nextToken());
          const x2 = parseIntStrict(st.nextToken());
          const y2 = parseIntStrict(st.nextToken());
          const f = parseIntStrict(st.nextToken());
          const newce = CirSim.createCe(tint, x1, y1, x2, y2, f, st);
          if (newce == null) {
            CirSim.console("unrecognized dump type: " + type);
            break;
          }
          newce.setPoints();
          this.app.elmList.push(newce);
        } catch (ee) {
          CirSim.console("exception while undumping " + ee);
          debugger;
          this.app.consoleExceptionOccurred = true;
          break;
        }
        break;
      }
    }
    this.finishReadCircuit(flags);
  }
  finishReadCircuit(flags) {
    this.app.setPowerBarEnable();
    this.app.enableItems();
    if ((flags & CircuitLoader.RC_RETAIN) == 0) {
      for (let i = 0; i < this.app.adjustables.length; i++) {
        if (!this.app.adjustables[i].createSlider(this.app))
          this.app.adjustables.splice(i--, 1);
      }
    }
    this.app.needAnalyze();
    if ((flags & CircuitLoader.RC_NO_CENTER) == 0)
      this.app.centerCircuit();
    if ((flags & CircuitLoader.RC_SUBCIRCUITS) != 0)
      this.app.updateModels();
  }
  readHint(st) {
    this.app.hintType = parseIntStrict(st.nextToken());
    this.app.hintItem1 = parseIntStrict(st.nextToken());
    this.app.hintItem2 = parseIntStrict(st.nextToken());
  }
  readOptions(st, importFlags) {
    const flags = parseIntStrict(st.nextToken());
    if ((importFlags & CircuitLoader.RC_RETAIN) != 0) {
      if ((flags & 2) != 0)
        this.menus.smallGridCheckItem.setState(true);
      return;
    }
    this.readCircuitFlags(flags);
    this.sim.maxTimeStep = this.sim.timeStep = parseFloatStrict(st.nextToken());
    const sp = parseFloatStrict(st.nextToken());
    const sp2 = Math.trunc(Math.log(10 * sp) * 24 + 61.5);
    this.app.ui.speedBar.setValue(sp2);
    this.app.ui.currentBar.setValue(parseIntStrict(st.nextToken()));
    CircuitElm.voltageRange = parseFloatStrict(st.nextToken());
    try {
      this.app.ui.powerBar.setValue(parseIntStrict(st.nextToken()));
      this.sim.minTimeStep = parseFloatStrict(st.nextToken());
    } catch (ignored) {
    }
    this.app.setGrid();
  }
  readCircuitFlags(flags) {
    this.menus.dotsCheckItem.setState((flags & 1) != 0);
    this.menus.smallGridCheckItem.setState((flags & 2) != 0);
    this.menus.voltsCheckItem.setState((flags & 4) == 0);
    this.menus.powerCheckItem.setState((flags & 8) == 8);
    this.menus.showValuesCheckItem.setState((flags & 16) == 0);
    this.sim.adjustTimeStep = (flags & 64) != 0;
    this.app.autoDCOnReset = (flags & 128) != 0;
  }
  async loadFileFromURL(url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        this.readCircuit(text, CircuitLoader.RC_KEEP_TITLE);
        this.app.allowSave(false);
        this.app.unsavedChanges = false;
        this.app.savedFlag = true;
      } else {
        window.alert(Locale.LS("Can't load circuit!"));
        console.log("Bad file server response:" + response.statusText);
      }
    } catch (e) {
      console.log("failed file reading", e);
    }
  }
}

const CircuitLoader$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    CircuitLoader
}, Symbol.toStringTag, { value: 'Module' }));

class RelayModel {
  static modelMap;
  flags = 0;
  name;
  description = null;
  inductance;
  r_on;
  r_off;
  onCurrent;
  offCurrent;
  coilR;
  switchingTime;
  coilStyle;
  // 0=both sides, 1=side1, 2=side2
  poleCount = 1;
  showBox;
  pulldown;
  dumped = false;
  readOnly = false;
  builtIn = false;
  oldStyle = false;
  constructor(copy) {
    if (copy === void 0) {
      this.inductance = 0.2;
      this.r_on = 0.05;
      this.r_off = 1e6;
      this.onCurrent = 0.02;
      this.offCurrent = 0.015;
      this.coilR = 20;
      this.switchingTime = 5e-3;
      this.coilStyle = 0;
      this.showBox = true;
      this.pulldown = true;
    } else {
      this.flags = copy.flags;
      this.inductance = copy.inductance;
      this.r_on = copy.r_on;
      this.r_off = copy.r_off;
      this.onCurrent = copy.onCurrent;
      this.offCurrent = copy.offCurrent;
      this.coilR = copy.coilR;
      this.switchingTime = copy.switchingTime;
      this.coilStyle = copy.coilStyle;
      this.poleCount = copy.poleCount;
      this.showBox = copy.showBox;
      this.pulldown = copy.pulldown;
    }
  }
  static getModelWithName(name) {
    RelayModel.createModelMap();
    let lm = RelayModel.modelMap.get(name);
    if (lm != null)
      return lm;
    lm = new RelayModel();
    lm.name = name;
    RelayModel.modelMap.set(name, lm);
    return lm;
  }
  static getModelWithNameOrCopy(name, oldmodel) {
    RelayModel.createModelMap();
    const lm = RelayModel.modelMap.get(name);
    if (lm != null)
      return lm;
    if (oldmodel == null) {
      CirSim.console("relay model not found: " + name);
      return RelayModel.getDefaultModel();
    }
    CirSim.console("relay model not found yet, using placeholder: " + name);
    const copy = new RelayModel(oldmodel);
    copy.name = name;
    RelayModel.modelMap.set(name, copy);
    return copy;
  }
  static createModelMap() {
    if (RelayModel.modelMap != null)
      return;
    RelayModel.modelMap = /* @__PURE__ */ new Map();
    RelayModel.addDefaultModel("default", new RelayModel());
    const m2 = new RelayModel();
    m2.poleCount = 2;
    RelayModel.addDefaultModel("default-2-poles", m2);
    const m3 = new RelayModel();
    m3.poleCount = 3;
    RelayModel.addDefaultModel("default-3-poles", m3);
  }
  static addDefaultModel(name, rm) {
    RelayModel.modelMap.set(name, rm);
    rm.readOnly = rm.builtIn = true;
    rm.name = name;
  }
  static getDefaultModel() {
    return RelayModel.getModelWithName("default");
  }
  // Create (or find) a model from old-style per-element parameters for backward compatibility.
  static getModelWithParameters(inductance, r_on, r_off, onCurrent, offCurrent, coilR, switchingTime, coilStyle, showBox, pulldown, poleCount) {
    RelayModel.createModelMap();
    for (const rm2 of RelayModel.modelMap.values()) {
      if (Math.abs(rm2.inductance - inductance) < 1e-15 && Math.abs(rm2.r_on - r_on) < 1e-15 && Math.abs(rm2.r_off - r_off) < 1e-15 && Math.abs(rm2.onCurrent - onCurrent) < 1e-15 && Math.abs(rm2.offCurrent - offCurrent) < 1e-15 && Math.abs(rm2.coilR - coilR) < 1e-15 && Math.abs(rm2.switchingTime - switchingTime) < 1e-15 && rm2.coilStyle === coilStyle && rm2.showBox === showBox && rm2.pulldown === pulldown && rm2.poleCount === poleCount)
        return rm2;
    }
    const baseName = "old-relay";
    let name = baseName;
    if (RelayModel.modelMap.get(name) != null) {
      let num = 2;
      for (; ; num++) {
        const n = baseName + "-" + num;
        if (RelayModel.modelMap.get(n) == null) {
          name = n;
          break;
        }
      }
    }
    const rm = RelayModel.getModelWithName(name);
    rm.inductance = inductance;
    rm.r_on = r_on;
    rm.r_off = r_off;
    rm.onCurrent = onCurrent;
    rm.offCurrent = offCurrent;
    rm.coilR = coilR;
    rm.switchingTime = switchingTime;
    rm.coilStyle = coilStyle;
    rm.showBox = showBox;
    rm.pulldown = pulldown;
    rm.poleCount = poleCount;
    rm.oldStyle = true;
    return rm;
  }
  static clearDumpedFlags() {
    if (RelayModel.modelMap == null)
      return;
    for (const rm of RelayModel.modelMap.values())
      rm.dumped = false;
  }
  static getModelList() {
    const list = [];
    for (const rm of RelayModel.modelMap.values()) {
      if (!list.includes(rm))
        list.push(rm);
    }
    list.sort((a, b) => a.compareTo(b));
    return list;
  }
  compareTo(rm) {
    return this.name.localeCompare(rm.name);
  }
  getDescription() {
    if (this.description == null)
      return this.name;
    return this.name + " (" + Locale.LS(this.description) + ")";
  }
  pickName() {
    this.name = "relaymodel";
    if (RelayModel.modelMap.get(this.name) != null) {
      let num = 2;
      for (; ; num++) {
        const n = this.name + "-" + num;
        if (RelayModel.modelMap.get(n) == null) {
          this.name = n;
          break;
        }
      }
    }
    RelayModel.modelMap.set(this.name, this);
  }
  dumpXml(doc) {
    this.dumped = true;
    const elem = doc.createElement("rlm");
    CircuitXMLSerializer.dumpAttr(elem, "nm", this.name);
    CircuitXMLSerializer.dumpAttr(elem, "f", this.flags);
    CircuitXMLSerializer.dumpAttr(elem, "in", this.inductance);
    CircuitXMLSerializer.dumpAttr(elem, "ron", this.r_on);
    CircuitXMLSerializer.dumpAttr(elem, "rof", this.r_off);
    CircuitXMLSerializer.dumpAttr(elem, "on", this.onCurrent);
    CircuitXMLSerializer.dumpAttr(elem, "of", this.offCurrent);
    CircuitXMLSerializer.dumpAttr(elem, "coR", this.coilR);
    CircuitXMLSerializer.dumpAttr(elem, "sw", this.switchingTime);
    CircuitXMLSerializer.dumpAttr(elem, "cs", this.coilStyle);
    if (this.poleCount !== 1)
      CircuitXMLSerializer.dumpAttr(elem, "po", this.poleCount);
    if (this.showBox)
      CircuitXMLSerializer.dumpAttr(elem, "sb", 1);
    if (this.pulldown)
      CircuitXMLSerializer.dumpAttr(elem, "pd", 1);
    doc.documentElement.appendChild(elem);
  }
  static undumpModelXml(xml) {
    const name = xml.parseStringAttr("nm", null);
    const rm = RelayModel.getModelWithName(name);
    rm.undumpXml(xml);
    return rm;
  }
  undumpXml(xml) {
    this.flags = xml.parseIntAttr("f", this.flags);
    this.inductance = xml.parseDoubleAttr("in", this.inductance);
    this.r_on = xml.parseDoubleAttr("ron", this.r_on);
    this.r_off = xml.parseDoubleAttr("rof", this.r_off);
    this.onCurrent = xml.parseDoubleAttr("on", this.onCurrent);
    this.offCurrent = xml.parseDoubleAttr("of", this.offCurrent);
    this.coilR = xml.parseDoubleAttr("coR", this.coilR);
    this.switchingTime = xml.parseDoubleAttr("sw", this.switchingTime);
    this.coilStyle = xml.parseIntAttr("cs", this.coilStyle);
    this.poleCount = xml.parseIntAttr("po", this.poleCount);
    this.showBox = xml.parseIntAttr("sb", this.showBox ? 1 : 0) !== 0;
    this.pulldown = xml.parseIntAttr("pd", this.pulldown ? 1 : 0) !== 0;
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Model Name", 0);
      ei.text = this.name == null ? "" : this.name;
      return ei;
    }
    if (n === 1)
      return new EditInfo("Inductance (H)", this.inductance, 0, 0).setPositive();
    if (n === 2)
      return new EditInfo("On Resistance (ohms)", this.r_on, 0, 0).setPositive();
    if (n === 3)
      return new EditInfo("Off Resistance (ohms)", this.r_off, 0, 0).setPositive();
    if (n === 4)
      return new EditInfo("On Current (A)", this.onCurrent, 0, 0).setPositive();
    if (n === 5)
      return new EditInfo("Off Current (A)", this.offCurrent, 0, 0).setPositive();
    if (n === 6)
      return new EditInfo("Number of Poles", this.poleCount, 1, 4).setDimensionless();
    if (n === 7)
      return new EditInfo("Coil Resistance (ohms)", this.coilR, 0, 0).setPositive();
    if (n === 8)
      return new EditInfo("Switching Time (s)", this.switchingTime, 0, 0).setPositive();
    if (n === 9) {
      const ei = new EditInfo("Coil Style", this.coilStyle, -1, -1);
      ei.choice = new Choice();
      ei.choice.add("Both Sides");
      ei.choice.add("Side 1");
      ei.choice.add("Side 2");
      ei.choice.select(this.coilStyle);
      return ei;
    }
    if (n === 10)
      return EditInfo.createCheckbox("Show Box", this.showBox);
    if (n === 11)
      return EditInfo.createCheckbox("Pulldown Resistor", this.pulldown);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.name = ei.textf.value;
      if (this.name.length > 0)
        RelayModel.modelMap.set(this.name, this);
    }
    if (n === 1 && ei.value > 0) this.inductance = ei.value;
    if (n === 2 && ei.value > 0) this.r_on = ei.value;
    if (n === 3 && ei.value > 0) this.r_off = ei.value;
    if (n === 4 && ei.value > 0) this.onCurrent = ei.value;
    if (n === 5 && ei.value > 0) this.offCurrent = ei.value;
    if (n === 6 && ei.value >= 1) this.poleCount = Math.trunc(ei.value);
    if (n === 7 && ei.value > 0) this.coilR = ei.value;
    if (n === 8 && ei.value > 0) this.switchingTime = ei.value;
    if (n === 9) this.coilStyle = ei.choice.getSelectedIndex();
    if (n === 10) this.showBox = ei.checkbox.getState();
    if (n === 11) this.pulldown = ei.checkbox.getState();
    CirSim.theApp.updateModels();
  }
}

class MosfetModel {
  static modelMap;
  static FLAG_JFET = 1;
  flags = 0;
  name;
  description;
  threshold;
  // Vt: threshold voltage (V)
  beta;
  // transconductance parameter (A/V^2)
  lambda = 0;
  // channel-length modulation (1/V), 0=ideal
  capGS = 0;
  // Cgs: gate-source capacitance (F), 0=disabled
  capGD = 0;
  // Cgd: gate-drain capacitance (F), 0=disabled
  // these describe how parts using this model are drawn/simulated; they were formerly
  // per-element (or, worse, circuit-wide) flags, but they really describe the physical
  // part, e.g. whether it exposes a 4th body terminal or has a body diode, so they belong
  // on the model.  Not used for JFETs (isJfet() true), which never show the bulk/body.
  showBulk = false;
  digitalSymbol = false;
  // draw as a simple digital-logic symbol (only if !showBulk)
  bodyDiode = false;
  // simulate the parasitic body diode (only if showBulk)
  bodyTerminal = false;
  // expose the body as a 4th terminal (only if bodyDiode)
  showBodyDiodeSymbol = false;
  // draw the body diode symbol (only if bodyDiode)
  dumped = false;
  readOnly = false;
  builtIn = false;
  internal = false;
  // true if this model was synthesized from an old circuit file's inline per-element
  // vt/beta values rather than picked/created by the user; see DiodeModel.oldStyle
  oldStyle = false;
  constructor(dOrCopy, vt, b) {
    if (dOrCopy === void 0) {
      this.threshold = 1.5;
      this.beta = 0.02;
      this.showBulk = true;
      this.bodyDiode = true;
    } else if (dOrCopy instanceof MosfetModel) {
      const copy = dOrCopy;
      this.flags = copy.flags;
      this.threshold = copy.threshold;
      this.beta = copy.beta;
      this.lambda = copy.lambda;
      this.capGS = copy.capGS;
      this.capGD = copy.capGD;
      this.showBulk = copy.showBulk;
      this.digitalSymbol = copy.digitalSymbol;
      this.bodyDiode = copy.bodyDiode;
      this.bodyTerminal = copy.bodyTerminal;
      this.showBodyDiodeSymbol = copy.showBodyDiodeSymbol;
    } else {
      this.description = dOrCopy;
      this.threshold = vt;
      this.beta = b;
      this.showBulk = true;
      this.bodyDiode = true;
    }
  }
  // is this a model meant for use by JfetElm (vs. MosfetElm)?  JFETs and MOSFETs share this
  // one model class since the only real difference between them is which default parameter
  // values make sense; this flag is just used to filter the model-picker dropdown per element type.
  isJfet() {
    return (this.flags & MosfetModel.FLAG_JFET) !== 0;
  }
  setJfet() {
    this.flags |= MosfetModel.FLAG_JFET;
    return this;
  }
  static getModelWithName(name) {
    MosfetModel.createModelMap();
    let lm = MosfetModel.modelMap.get(name);
    if (lm != null)
      return lm;
    lm = new MosfetModel();
    lm.name = name;
    MosfetModel.modelMap.set(name, lm);
    return lm;
  }
  static getModelWithNameOrCopy(name, oldmodel, jfet) {
    MosfetModel.createModelMap();
    const lm = MosfetModel.modelMap.get(name);
    if (lm != null)
      return lm;
    if (oldmodel == null) {
      CirSim.console("model not found: " + name);
      return MosfetModel.getDefaultModel(jfet);
    }
    const copy = new MosfetModel(oldmodel);
    copy.name = name;
    MosfetModel.modelMap.set(name, copy);
    return copy;
  }
  static createModelMap() {
    if (MosfetModel.modelMap != null)
      return;
    MosfetModel.modelMap = /* @__PURE__ */ new Map();
    MosfetModel.addDefaultModel("default", new MosfetModel("default", 1.5, 0.02));
    const noDiodeDefault = new MosfetModel("default-nodiode", 1.5, 0.02);
    noDiodeDefault.bodyDiode = false;
    MosfetModel.addDefaultModel("default-nodiode", noDiodeDefault);
    const bodyTerminalDefault = new MosfetModel("default-body", 1.5, 0.02);
    bodyTerminalDefault.bodyTerminal = true;
    MosfetModel.addDefaultModel("default-body", bodyTerminalDefault);
    const digitalDefault = new MosfetModel("default-digital", 1.5, 0.02);
    digitalDefault.showBulk = false;
    digitalDefault.digitalSymbol = true;
    digitalDefault.bodyDiode = false;
    MosfetModel.addDefaultModel("default-digital", digitalDefault);
    const jfetDefault = new MosfetModel("default-jfet", -4, 125e-5).setJfet();
    jfetDefault.showBulk = jfetDefault.bodyDiode = false;
    MosfetModel.addDefaultModel("default-jfet", jfetDefault);
  }
  static addDefaultModel(name, dm) {
    MosfetModel.modelMap.set(name, dm);
    dm.readOnly = dm.builtIn = true;
    dm.name = name;
  }
  static getDefaultModel(jfet) {
    return MosfetModel.getModelWithName(jfet ? "default-jfet" : "default");
  }
  // Find (or create) a model matching the given legacy per-element vt/beta and drawing/behavior
  // flags, for backward compatibility with old circuit files that stored these inline per
  // element instead of by model name.
  static getModelWithParameters(vt, beta, jfet, showBulk, bodyDiode, bodyTerminal, digitalSymbol, showBodyDiodeSymbol) {
    MosfetModel.createModelMap();
    for (const [, mm2] of MosfetModel.modelMap) {
      if (mm2.isJfet() === jfet && Math.abs(mm2.threshold - vt) < 1e-15 && Math.abs(mm2.beta - beta) < 1e-15 && mm2.lambda === 0 && mm2.capGS === 0 && mm2.capGD === 0 && mm2.showBulk === showBulk && mm2.bodyDiode === bodyDiode && mm2.bodyTerminal === bodyTerminal && mm2.digitalSymbol === digitalSymbol && mm2.showBodyDiodeSymbol === showBodyDiodeSymbol)
        return mm2;
    }
    const baseName = "old-" + (jfet ? "jfet" : "mosfet");
    let name = baseName;
    if (MosfetModel.modelMap.get(name) != null) {
      let num = 2;
      for (; ; num++) {
        const n = baseName + "-" + num;
        if (MosfetModel.modelMap.get(n) == null) {
          name = n;
          break;
        }
      }
    }
    const mm = MosfetModel.getModelWithName(name);
    mm.threshold = vt;
    mm.beta = beta;
    mm.showBulk = showBulk;
    mm.bodyDiode = bodyDiode;
    mm.bodyTerminal = bodyTerminal;
    mm.digitalSymbol = digitalSymbol;
    mm.showBodyDiodeSymbol = showBodyDiodeSymbol;
    if (jfet)
      mm.setJfet();
    mm.oldStyle = true;
    return mm;
  }
  static clearDumpedFlags() {
    if (MosfetModel.modelMap == null)
      return;
    for (const [, mm] of MosfetModel.modelMap)
      mm.dumped = false;
  }
  // jfet selects whether to return models meant for JfetElm or for MosfetElm
  static getModelList(jfet) {
    MosfetModel.createModelMap();
    const vector = [];
    for (const [, mm] of MosfetModel.modelMap) {
      if (mm.internal || mm.isJfet() !== jfet)
        continue;
      if (!vector.includes(mm))
        vector.push(mm);
    }
    vector.sort((a, b) => a.compareTo(b));
    return vector;
  }
  compareTo(dm) {
    return this.name < dm.name ? -1 : this.name > dm.name ? 1 : 0;
  }
  getDescription() {
    if (this.description == null || this.description === this.name)
      return this.name;
    return this.name + " (" + Locale.LS(this.description) + ")";
  }
  static undumpModel(st) {
    const name = CustomLogicModel.unescape(st.nextToken());
    const dm = MosfetModel.getModelWithName(name);
    dm.undump(st);
    return dm;
  }
  undump(st) {
    this.flags = parseIntStrict(st.nextToken());
    this.threshold = parseFloatStrict(st.nextToken());
    this.beta = parseFloatStrict(st.nextToken());
    try {
      this.lambda = parseFloatStrict(st.nextToken());
    } catch (e) {
    }
    try {
      this.capGS = parseFloatStrict(st.nextToken());
      this.capGD = parseFloatStrict(st.nextToken());
    } catch (e) {
    }
    try {
      this.showBulk = parseIntStrict(st.nextToken()) !== 0;
      this.digitalSymbol = parseIntStrict(st.nextToken()) !== 0;
      this.bodyDiode = parseIntStrict(st.nextToken()) !== 0;
      this.bodyTerminal = parseIntStrict(st.nextToken()) !== 0;
      this.showBodyDiodeSymbol = parseIntStrict(st.nextToken()) !== 0;
    } catch (e) {
    }
  }
  dumpXml(doc) {
    this.dumped = true;
    const elem = doc.createElement("mm");
    CircuitXMLSerializer.dumpAttr(elem, "nm", this.name);
    CircuitXMLSerializer.dumpAttr(elem, "f", this.flags);
    CircuitXMLSerializer.dumpAttr(elem, "vt", this.threshold);
    CircuitXMLSerializer.dumpAttr(elem, "be", this.beta);
    if (this.lambda !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "la", this.lambda);
    if (this.capGS !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "cgs", this.capGS);
    if (this.capGD !== 0)
      CircuitXMLSerializer.dumpAttr(elem, "cgd", this.capGD);
    CircuitXMLSerializer.dumpAttr(elem, "sb", this.showBulk ? 1 : 0);
    CircuitXMLSerializer.dumpAttr(elem, "dsy", this.digitalSymbol ? 1 : 0);
    CircuitXMLSerializer.dumpAttr(elem, "bd", this.bodyDiode ? 1 : 0);
    CircuitXMLSerializer.dumpAttr(elem, "bt", this.bodyTerminal ? 1 : 0);
    CircuitXMLSerializer.dumpAttr(elem, "sbd", this.showBodyDiodeSymbol ? 1 : 0);
    doc.documentElement.appendChild(elem);
  }
  static undumpModelXml(xml) {
    const name = xml.parseStringAttr("nm", null);
    const dm = MosfetModel.getModelWithName(name);
    dm.undumpXml(xml);
    return dm;
  }
  undumpXml(xml) {
    this.flags = xml.parseIntAttr("f", this.flags);
    this.threshold = xml.parseDoubleAttr("vt", this.threshold);
    this.beta = xml.parseDoubleAttr("be", this.beta);
    this.lambda = xml.parseDoubleAttr("la", this.lambda);
    this.capGS = xml.parseDoubleAttr("cgs", this.capGS);
    this.capGD = xml.parseDoubleAttr("cgd", this.capGD);
    this.showBulk = xml.parseIntAttr("sb", this.showBulk ? 1 : 0) !== 0;
    this.digitalSymbol = xml.parseIntAttr("dsy", this.digitalSymbol ? 1 : 0) !== 0;
    this.bodyDiode = xml.parseIntAttr("bd", this.bodyDiode ? 1 : 0) !== 0;
    this.bodyTerminal = xml.parseIntAttr("bt", this.bodyTerminal ? 1 : 0) !== 0;
    this.showBodyDiodeSymbol = xml.parseIntAttr("sbd", this.showBodyDiodeSymbol ? 1 : 0) !== 0;
  }
  getDialogTitle() {
    return "Edit " + (this.isJfet() ? "JFET" : "MOSFET") + " Model";
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Model Name", 0);
      ei.text = this.name == null ? "" : this.name;
      return ei;
    }
    if (n === 1) return new EditInfo("Threshold Voltage (Vt)", this.threshold);
    if (n === 2) return new EditInfo(EditInfo.makeLink("mosfet-beta.html", "Beta"), this.beta);
    let idx = 3;
    if (!this.isJfet()) {
      if (n === idx++)
        return EditInfo.createCheckbox("Show Bulk", this.showBulk);
      if (n === idx++) {
        if (!this.showBulk)
          return EditInfo.createCheckbox("Digital Symbol", this.digitalSymbol);
        return EditInfo.createCheckbox("Simulate Body Diode", this.bodyDiode);
      }
      if (this.showBulk && this.bodyDiode) {
        if (n === idx++)
          return EditInfo.createCheckbox("Body Terminal", this.bodyTerminal);
        if (n === idx++)
          return EditInfo.createCheckbox("Show Body Diode", this.showBodyDiodeSymbol);
      }
    }
    if (n === idx++) return new EditInfo("Lambda", this.lambda).setDimensionless().newColumnMethod();
    if (n === idx++) return new EditInfo("Gate-Source Capacitance (Cgs)", this.capGS);
    if (n === idx) return new EditInfo("Gate-Drain Capacitance (Cgd)", this.capGD);
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0) {
      this.name = ei.textf.value;
      if (this.name.length > 0)
        MosfetModel.modelMap.set(this.name, this);
    }
    if (n === 1) this.threshold = ei.value;
    if (n === 2 && ei.value > 0) this.beta = ei.value;
    let idx = 3;
    if (!this.isJfet()) {
      if (n === idx++) {
        const newVal = ei.checkbox.getState();
        if (newVal !== this.showBulk)
          ei.newDialog = true;
        this.showBulk = newVal;
      } else if (n === idx++) {
        const newVal = ei.checkbox.getState();
        if (!this.showBulk) {
          if (newVal !== this.digitalSymbol)
            ei.newDialog = true;
          this.digitalSymbol = newVal;
        } else {
          if (newVal !== this.bodyDiode)
            ei.newDialog = true;
          this.bodyDiode = newVal;
        }
      } else if (this.showBulk && this.bodyDiode && n === idx++) {
        this.bodyTerminal = ei.checkbox.getState();
      } else if (this.showBulk && this.bodyDiode && n === idx++) {
        this.showBodyDiodeSymbol = ei.checkbox.getState();
      }
    }
    if (n === idx) this.lambda = ei.value >= 0 ? ei.value : this.lambda;
    else if (n === idx + 1) this.capGS = ei.value >= 0 ? ei.value : this.capGS;
    else if (n === idx + 2) this.capGD = ei.value >= 0 ? ei.value : this.capGD;
    CirSim.theApp.updateModels();
  }
  pickName() {
    this.name = this.isJfet() ? "jfetmodel" : "mosfetmodel";
    if (MosfetModel.modelMap.get(this.name) != null) {
      let num = 2;
      for (; ; num++) {
        const n = this.name + "-" + num;
        if (MosfetModel.modelMap.get(n) == null) {
          this.name = n;
          break;
        }
      }
    }
  }
}

class CircuitXMLDeserializer {
  app;
  currentXmlElement;
  currentElm = null;
  constructor(app) {
    this.app = app;
  }
  readCircuit(text, readFlags) {
    const doc = new DOMParser().parseFromString(text, "text/xml");
    const root = doc.documentElement;
    if ((readFlags & CircuitLoader.RC_RETAIN) === 0)
      this.app.clearCircuit();
    this.currentXmlElement = root;
    if ((readFlags & CircuitLoader.RC_RETAIN) === 0) {
      const flags = this.parseIntAttr("f", 0);
      this.app.loader.readCircuitFlags(flags);
      const sim = this.app.sim;
      sim.maxTimeStep = sim.timeStep = this.parseDoubleAttr("ts", sim.maxTimeStep);
      const sp = this.parseDoubleAttr("ic", this.app.getIterCount());
      const sp2 = Math.trunc(Math.log(10 * sp) * 24 + 61.5);
      const ui = this.app.ui;
      ui.speedBar.setValue(sp2);
      ui.currentBar.setValue(this.parseIntAttr("cb", ui.currentBar.getValue()));
      CircuitElm.voltageRange = this.parseDoubleAttr("vr", CircuitElm.voltageRange);
      ui.powerBar.setValue(this.parseIntAttr("pb", ui.powerBar.getValue()));
      sim.minTimeStep = this.parseDoubleAttr("mts", sim.minTimeStep);
      sim.solverType = this.parseIntAttr("st", sim.solverType);
      this.app.setGrid();
    }
    this.readElements(root);
    this.app.loader.finishReadCircuit(readFlags);
  }
  // read elements from an already-parsed XML document (e.g. from SubcircuitModel.elmDoc)
  readCircuitFromDoc(doc) {
    this.app.clearCircuit();
    this.readElements(doc.documentElement);
    this.app.loader.finishReadCircuit(0);
  }
  readElements(root) {
    const children = root.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.nodeType !== Node.ELEMENT_NODE)
        continue;
      const elem = node;
      const tagName = elem.tagName;
      if (tagName === "o") {
        const sc = new Scope(this.app, this.app.sim);
        this.currentXmlElement = elem;
        sc.undumpXml(this);
        this.app.scopeManager.addScope(sc);
        continue;
      }
      if (tagName === "dm") {
        this.currentXmlElement = elem;
        DiodeModel.undumpModelXml(this);
        continue;
      }
      if (tagName === "rlm") {
        this.currentXmlElement = elem;
        RelayModel.undumpModelXml(this);
        continue;
      }
      if (tagName === "tm") {
        this.currentXmlElement = elem;
        TransistorModel.undumpModelXml(this);
        continue;
      }
      if (tagName === "mm") {
        this.currentXmlElement = elem;
        MosfetModel.undumpModelXml(this);
        continue;
      }
      if (tagName === "clm") {
        this.currentXmlElement = elem;
        CustomLogicModel.undumpModelXml(this);
        continue;
      }
      if (tagName === "ccm") {
        this.currentXmlElement = elem;
        HookRegistry.undumpSubcircuitModel?.(this);
        continue;
      }
      if (tagName === "h") {
        this.currentXmlElement = elem;
        this.app.hintType = this.parseIntAttr("t", -1);
        this.app.hintItem1 = this.parseIntAttr("i1", 0);
        this.app.hintItem2 = this.parseIntAttr("i2", 0);
        continue;
      }
      if (tagName === "adj") {
        this.currentXmlElement = elem;
        window.Adjustable?.undumpXml(this, this.app);
        continue;
      }
      if (tagName === "test") {
        const tm = window.TestManager?.theManager;
        if (tm != null) {
          this.currentXmlElement = elem;
          tm.saveTestTag(this.parseDoubleAttr("len", -1));
        }
        continue;
      }
      if (tagName === "switchevent") {
        const tm = window.TestManager?.theManager;
        if (tm != null) {
          this.currentXmlElement = elem;
          tm.saveSwitchEvent(this.parseDoubleAttr("t", 0), this.parseIntAttr("en", -1));
        }
        continue;
      }
      if (tagName === "scopedata") {
        const tm = window.TestManager?.theManager;
        if (tm != null) {
          this.currentXmlElement = elem;
          const si = this.parseIntAttr("si", -1);
          const pi = this.parseIntAttr("pi", -1);
          const en = this.parseIntAttr("en", -1);
          const v = this.parseIntAttr("v", 0);
          const u = this.parseIntAttr("u", 0);
          const sp = this.parseIntAttr("sp", 1);
          const ts = this.parseDoubleAttr("ts", 0);
          const values = this.parseDoubleArray(this.parseContents());
          tm.saveScopeDataTag(si, pi, en, v, u, sp, ts, values);
        }
        continue;
      }
      const x = elem.getAttribute("x");
      if (x == null)
        continue;
      const className = CirSim.xmlDumpTypeMap.get(tagName);
      if (className == null) {
        console.log("unrecognized xml element: " + tagName);
        continue;
      }
      const elm = this.app.constructElement(className, 0, 0);
      this.currentXmlElement = elem;
      this.currentElm = elm;
      elm.undumpXml(this);
      elm.setPositionFromXml(elem);
      this.app.elmList.push(elm);
    }
  }
  parseDoubleAttr(attr, def) {
    const v = this.currentXmlElement.getAttribute(attr);
    if (v == null)
      return def;
    const n = parseFloat(v);
    if (isNaN(n)) {
      console.log("invalid value for attribute " + attr + ": " + JSON.stringify(v));
      return def;
    }
    return n;
  }
  parseIntAttr(attr, def) {
    const v = this.currentXmlElement.getAttribute(attr);
    if (v == null)
      return def;
    const n = parseInt(v);
    if (isNaN(n)) {
      console.log("invalid value for attribute " + attr + ": " + JSON.stringify(v));
      return def;
    }
    return n;
  }
  parseBooleanAttr(attr, def) {
    const v = this.currentXmlElement.getAttribute(attr);
    if (v == null)
      return def;
    return v === "true";
  }
  parseStringAttr(attr, def) {
    let s = this.currentXmlElement.getAttribute(attr);
    if (s == null)
      return def;
    s = s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    return s;
  }
  parseContents() {
    try {
      const child = this.currentXmlElement.firstChild;
      return child ? child.nodeValue : null;
    } catch (e) {
      return null;
    }
  }
  parseDoubleArray(text) {
    if (text == null || text.trim() === "")
      return [];
    return text.trim().split(",").map((s) => parseFloat(s.trim()));
  }
  getChildElements() {
    const elements = [];
    const children = this.currentXmlElement.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.nodeType === Node.ELEMENT_NODE)
        elements.push(node);
    }
    return elements;
  }
  parseChildElement(elem) {
    this.currentXmlElement = elem;
  }
}

class CustomLogicModel {
  static FLAG_SCHMITT = 1;
  static modelMap = null;
  flags = 0;
  name = "";
  inputs = [];
  outputs = [];
  infoText = "";
  rules = "";
  rulesLeft = [];
  rulesRight = [];
  dumped = false;
  triState = false;
  static getModelWithName(name) {
    if (CustomLogicModel.modelMap == null)
      CustomLogicModel.modelMap = /* @__PURE__ */ new Map();
    let lm = CustomLogicModel.modelMap.get(name);
    if (lm != null)
      return lm;
    lm = new CustomLogicModel();
    lm.name = name;
    lm.infoText = name === "default" ? "custom logic" : name;
    CustomLogicModel.modelMap.set(name, lm);
    return lm;
  }
  static getModelWithNameOrCopy(name, oldmodel) {
    if (CustomLogicModel.modelMap == null)
      CustomLogicModel.modelMap = /* @__PURE__ */ new Map();
    const lm = CustomLogicModel.modelMap.get(name);
    if (lm != null)
      return lm;
    const copy = new CustomLogicModel(oldmodel ?? void 0);
    copy.name = name;
    copy.infoText = name;
    CustomLogicModel.modelMap.set(name, copy);
    return copy;
  }
  static clearDumpedFlags() {
    if (CustomLogicModel.modelMap == null)
      return;
    for (const m of CustomLogicModel.modelMap.values())
      m.dumped = false;
  }
  constructor(copy) {
    if (copy === void 0) {
      this.inputs = this.listToArray("A,B");
      this.outputs = this.listToArray("C,D");
      this.rulesLeft = [];
      this.rulesRight = [];
      this.rules = "";
    } else {
      this.flags = copy.flags;
      this.inputs = copy.inputs;
      this.outputs = copy.outputs;
      this.infoText = copy.infoText;
      this.rules = copy.rules;
      this.rulesLeft = copy.rulesLeft;
      this.rulesRight = copy.rulesRight;
    }
  }
  static undumpModel(st) {
    const name = CustomLogicModel.unescape(st.nextToken());
    const model = CustomLogicModel.getModelWithName(name);
    model.undump(st);
  }
  undump(st) {
    this.flags = parseIntStrict(st.nextToken());
    this.inputs = this.listToArray(CustomLogicModel.unescape(st.nextToken()));
    this.outputs = this.listToArray(CustomLogicModel.unescape(st.nextToken()));
    this.infoText = CustomLogicModel.unescape(st.nextToken());
    this.rules = CustomLogicModel.unescape(st.nextToken());
    this.parseRules(null);
  }
  static undumpModelXml(xml) {
    const name = xml.parseStringAttr("nm", null);
    const model = CustomLogicModel.getModelWithName(name);
    model.undumpXml(xml);
  }
  undumpXml(xml) {
    this.flags = xml.parseIntAttr("f", this.flags);
    this.inputs = this.listToArray(xml.parseStringAttr("in", null) ?? "");
    this.outputs = this.listToArray(xml.parseStringAttr("o", null) ?? "");
    this.infoText = xml.parseStringAttr("if", null) ?? "";
    this.rules = (xml.parseContents() ?? "").trim();
    this.parseRules(null);
  }
  arrayToList(arr) {
    if (arr == null || arr.length === 0)
      return "";
    return arr.join(",");
  }
  listToArray(arr) {
    return arr.split(",");
  }
  getEditInfo(n) {
    if (n === 0) {
      const ei = new EditInfo("Inputs", 0, -1, -1);
      ei.text = this.arrayToList(this.inputs);
      return ei;
    }
    if (n === 1) {
      const ei = new EditInfo("Outputs", 0, -1, -1);
      ei.text = this.arrayToList(this.outputs);
      return ei;
    }
    if (n === 2) {
      const ei = new EditInfo("Info Text", 0, -1, -1);
      ei.text = this.infoText;
      return ei;
    }
    if (n === 3) {
      const ei = new EditInfo(EditInfo.makeLink("customlogic.html", "Definition"), 0, -1, -1);
      ei.setErrorFieldName("Definition");
      ei.textArea = { value: this.rules };
      return ei;
    }
    return null;
  }
  setEditValue(n, ei) {
    if (n === 0)
      this.inputs = this.listToArray(ei.textf.value);
    if (n === 1)
      this.outputs = this.listToArray(ei.textf.value);
    if (n === 2)
      this.infoText = ei.textf.value;
    if (n === 3) {
      this.rules = ei.textArea.element.value;
      this.parseRules(ei);
    }
    if (n === 4) {
      if (ei.checkbox.getState())
        this.flags |= CustomLogicModel.FLAG_SCHMITT;
      else
        this.flags &= -2;
    }
    CirSim.theApp.updateModels();
  }
  parseRules(ei) {
    const lines = this.rules.split("\n");
    this.rulesLeft = [];
    this.rulesRight = [];
    this.triState = false;
    for (let i = 0; i !== lines.length; i++) {
      const s = lines[i].toLowerCase().trim();
      if (s.length === 0 || s.startsWith("#"))
        continue;
      const s0 = s.replace(/ /g, "").split("=");
      if (s0.length !== 2) {
        if (ei != null)
          ei.setError("error on line " + (i + 1));
        return;
      }
      if (s0[0].length < this.inputs.length) {
        if (ei != null)
          ei.setError("must have >= " + this.inputs.length + " digits on left side (line " + (i + 1) + ")");
        return;
      }
      if (s0[0].length > this.inputs.length + this.outputs.length) {
        if (ei != null)
          ei.setError("must have <= " + (this.inputs.length + this.outputs.length) + " digits on left side (line " + (i + 1) + ")");
        return;
      }
      if (s0[1].length !== this.outputs.length) {
        if (ei != null)
          ei.setError("must have " + this.outputs.length + " digits on right side (line " + (i + 1) + ")");
        return;
      }
      const rl = s0[0];
      const used = new Array(26).fill(false);
      let newRl = "";
      for (let j = 0; j !== rl.length; j++) {
        const x = rl.charCodeAt(j);
        const xc = rl.charAt(j);
        if (xc === "?" || xc === "+" || xc === "-" || xc === "0" || xc === "1") {
          newRl += xc;
          continue;
        }
        if (xc < "a" || xc > "z") {
          if (ei != null)
            ei.setError("error on line " + (i + 1));
          return;
        }
        const idx = x - "a".charCodeAt(0);
        if (used[idx]) {
          newRl += xc.toUpperCase();
          continue;
        }
        used[idx] = true;
        newRl += xc;
      }
      const rr = s0[1];
      if (rr.includes("_"))
        this.triState = true;
      this.rulesLeft.push(newRl);
      this.rulesRight.push(rr);
    }
  }
  dumpXml(doc) {
    this.dumped = true;
    const elem = doc.createElement("clm");
    CircuitXMLSerializer.dumpAttr(elem, "nm", this.name);
    CircuitXMLSerializer.dumpAttr(elem, "f", this.flags);
    CircuitXMLSerializer.dumpAttr(elem, "in", this.arrayToList(this.inputs));
    CircuitXMLSerializer.dumpAttr(elem, "o", this.arrayToList(this.outputs));
    CircuitXMLSerializer.dumpAttr(elem, "if", this.infoText);
    elem.appendChild(doc.createTextNode(this.rules));
    doc.documentElement.appendChild(elem);
  }
  static escape(s) {
    if (s.length === 0)
      return "\\0";
    return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/ /g, "\\s").replace(/\+/g, "\\p").replace(/=/g, "\\q").replace(/#/g, "\\h").replace(/&/g, "\\a").replace(/\r/g, "\\r");
  }
  static unescape(s) {
    if (s === "\\0")
      return "";
    let i = 0;
    while (i < s.length) {
      if (s.charAt(i) === "\\") {
        const c = s.charAt(i + 1);
        if (c === "n")
          s = s.substring(0, i) + "\n" + s.substring(i + 2);
        else if (c === "r")
          s = s.substring(0, i) + "\r" + s.substring(i + 2);
        else if (c === "s")
          s = s.substring(0, i) + " " + s.substring(i + 2);
        else if (c === "p")
          s = s.substring(0, i) + "+" + s.substring(i + 2);
        else if (c === "q")
          s = s.substring(0, i) + "=" + s.substring(i + 2);
        else if (c === "h")
          s = s.substring(0, i) + "#" + s.substring(i + 2);
        else if (c === "a")
          s = s.substring(0, i) + "&" + s.substring(i + 2);
        else
          s = s.substring(0, i) + s.substring(i + 1);
      }
      i++;
    }
    return s;
  }
}

class SubcircuitModel {
  static globalModelMap = /* @__PURE__ */ new Map();
  static localModelMap = /* @__PURE__ */ new Map();
  flags = 0;
  sizeX = 0;
  sizeY = 0;
  name = "";
  extList = [];
  // XML document storing child element definitions
  elmDoc = null;
  modelCircuit = null;
  dumped = false;
  internal = false;
  // don't show in list
  builtin = false;
  // included by default, don't allow deletion
  static sequenceNumber = 0;
  static FLAG_SHOW_LABEL = 1;
  setName(n) {
    if (SubcircuitModel.localModelMap.delete(this.name)) {
      this.name = n;
      SubcircuitModel.localModelMap.set(this.name, this);
    } else {
      SubcircuitModel.globalModelMap.delete(this.name);
      this.name = n;
      SubcircuitModel.globalModelMap.set(this.name, this);
    }
    SubcircuitModel.sequenceNumber++;
  }
  static initModelMap() {
    SubcircuitModel.globalModelMap = /* @__PURE__ */ new Map();
    SubcircuitModel.localModelMap = /* @__PURE__ */ new Map();
    const extList = [];
    extList.push(new ExtListEntry("gnd", 1));
    const d = SubcircuitModel.createModelFromOldFormat("default", "0 0", "GroundElm 1", extList);
    d.sizeX = d.sizeY = 1;
    d.builtin = true;
    SubcircuitModel.localModelMap.delete(d.name);
    SubcircuitModel.globalModelMap.set(d.name, d);
    SubcircuitModel.sequenceNumber = 1;
    SubcircuitModel.loadInternalModels();
  }
  static loadModelsFromStorage() {
    const stor = window.localStorage;
    if (stor === null) return;
    const len = stor.length;
    for (let i = 0; i < len; i++) {
      const key = stor.key(i);
      if (!key || !key.startsWith("subcircuit:")) continue;
      const data = stor.getItem(key);
      if (!data) continue;
      try {
        if (data.startsWith("<")) {
          SubcircuitModel.loadModelFromStorage(data);
        } else {
          let firstLine = data;
          const lineLen = data.indexOf("\n");
          if (lineLen !== -1) firstLine = data.substring(0, lineLen);
          const st = new StringTokenizer(firstLine, " ");
          if (st.nextToken() === ".") {
            const model = SubcircuitModel.undumpModel(st);
            if (lineLen !== -1) model.modelCircuit = data.substring(lineLen + 1);
            SubcircuitModel.localModelMap.delete(model.name);
            SubcircuitModel.globalModelMap.set(model.name, model);
          }
        }
      } catch (e) {
        CirSim.console("Exception: " + e);
      }
    }
  }
  static getModelWithName(name) {
    if (SubcircuitModel.globalModelMap.size === 0 && SubcircuitModel.localModelMap.size === 0)
      SubcircuitModel.initModelMap();
    const lm = SubcircuitModel.localModelMap.get(name);
    if (lm) return lm;
    return SubcircuitModel.globalModelMap.get(name) ?? null;
  }
  // create model from old-style nodeList/elmDump format, converting to XML immediately
  static createModelFromOldFormat(name, elmDump, nodeList, extList) {
    const lm = new SubcircuitModel();
    lm.name = name;
    lm.extList = extList;
    lm.convertOldFormatToXml(nodeList, elmDump);
    SubcircuitModel.localModelMap.set(name, lm);
    SubcircuitModel.sequenceNumber++;
    return lm;
  }
  // create model with XML element doc already built
  static createModel(name, elmDoc, extList) {
    const lm = new SubcircuitModel();
    lm.name = name;
    lm.elmDoc = elmDoc;
    lm.extList = extList;
    SubcircuitModel.localModelMap.set(name, lm);
    SubcircuitModel.sequenceNumber++;
    return lm;
  }
  static clearDumpedFlags() {
    for (const m of SubcircuitModel.globalModelMap.values()) m.dumped = false;
    for (const m of SubcircuitModel.localModelMap.values()) m.dumped = false;
  }
  static getModelList() {
    const merged = new Map(SubcircuitModel.globalModelMap);
    for (const [k, v] of SubcircuitModel.localModelMap) merged.set(k, v);
    const result = [];
    for (const dm of merged.values()) {
      if (!dm.internal) result.push(dm);
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }
  static undumpModel(st) {
    const name = CustomLogicModel.unescape(st.nextToken());
    let model = SubcircuitModel.getModelWithName(name);
    if (model === null) {
      model = new SubcircuitModel();
      model.name = name;
      SubcircuitModel.localModelMap.set(name, model);
      SubcircuitModel.sequenceNumber++;
    } else if (SubcircuitModel.globalModelMap.has(name) && !SubcircuitModel.localModelMap.has(name)) {
      model = new SubcircuitModel();
      model.name = name;
      SubcircuitModel.localModelMap.set(name, model);
      SubcircuitModel.sequenceNumber++;
    }
    model.undump(st);
    return model;
  }
  undump(st) {
    this.flags = parseIntStrict(st.nextToken());
    this.sizeX = parseIntStrict(st.nextToken());
    this.sizeY = parseIntStrict(st.nextToken());
    const extCount = parseIntStrict(st.nextToken());
    this.extList = [];
    for (let i = 0; i < extCount; i++) {
      const s = CustomLogicModel.unescape(st.nextToken());
      const n = parseIntStrict(st.nextToken());
      const p = parseIntStrict(st.nextToken());
      const sd = parseIntStrict(st.nextToken());
      this.extList.push(new ExtListEntry(s, n, p, sd));
    }
    const nodeList = CustomLogicModel.unescape(st.nextToken());
    const elmDump = CustomLogicModel.unescape(st.nextToken());
    this.convertOldFormatToXml(nodeList, elmDump);
  }
  // convert old-style nodeList/elmDump strings to XML element tree
  convertOldFormatToXml(nodeList, elmDump) {
    this.elmDoc = document.implementation.createDocument(null, "elms", null);
    const root = this.elmDoc.documentElement;
    const modelLines = nodeList.split("\r").filter((l) => l.length > 0);
    const elmTokenizer = new StringTokenizer(elmDump, " ");
    for (const line of modelLines) {
      const stModel = new StringTokenizer(line, " +	\n\r\f");
      let ceType = stModel.nextToken();
      let nn = "";
      while (stModel.hasMoreTokens()) {
        if (nn.length > 0) nn += " ";
        nn += stModel.nextToken();
      }
      if (ceType == "CustomCompositeElm")
        ceType = "SubcircuitElm";
      let ce = CirSim.constructElement(ceType, 0, 0);
      if (ce == null) {
        console.log("can't create element in convertOldFormatToXml", ceType);
        debugger;
      }
      if (elmTokenizer.hasMoreTokens()) {
        const dumpedCe = CustomLogicModel.unescape(elmTokenizer.nextToken());
        const stCe = new StringTokenizer(dumpedCe, " ");
        const ceFlags = parseIntStrict(stCe.nextToken());
        ce = CirSim.createCe(ce.getDumpType(), 0, 0, 0, 0, ceFlags, stCe);
      }
      if (ce.isGroundElm()) ce.setOldStyle();
      const child = this.elmDoc.createElement(ce.getXmlDumpType());
      CircuitXMLSerializer.dumpAttr(child, "nn", nn);
      ce.dumpXml(this.elmDoc, child);
      child.removeAttribute("x");
      root.appendChild(child);
    }
  }
  isSaved() {
    if (!this.name) return false;
    return localStorage.getItem("subcircuit:" + this.name) !== null;
  }
  setSaved(sv) {
    if (sv) {
      const doc = document.implementation.createDocument(null, "ccm", null);
      const root = doc.documentElement;
      this.buildXmlElement(doc, root);
      const serializer = new window.XMLSerializer();
      localStorage.setItem("subcircuit:" + this.name, serializer.serializeToString(doc));
      SubcircuitModel.globalModelMap.set(this.name, this);
    } else {
      localStorage.removeItem("subcircuit:" + this.name);
    }
  }
  // where this model lives: local to the current circuit, global (available to all circuits
  // this session), or persistent (global and saved in local storage across sessions)
  getScope() {
    if (SubcircuitModel.localModelMap.get(this.name) === this) return "local";
    if (this.isSaved()) return "persistent";
    return "global";
  }
  // names of models used by subcircuits in the current circuit, including nested ones
  static getModelNamesInUse() {
    const names = /* @__PURE__ */ new Set();
    const scan = (list) => {
      for (const ce of list) {
        if (!ce.isSubcircuitElm()) continue;
        names.add(ce.modelName);
        if (ce.compElmList) scan(ce.compElmList);
      }
    };
    scan(CirSim.theApp.elmList);
    return names;
  }
  // move model to the global map, replacing any local or global model with the same name
  makeGlobal() {
    SubcircuitModel.localModelMap.delete(this.name);
    SubcircuitModel.globalModelMap.set(this.name, this);
    if (this.isSaved()) this.setSaved(true);
    SubcircuitModel.sequenceNumber++;
  }
  // move model to the local map so it belongs only to the current circuit,
  // replacing any local model with the same name, and remove it from storage
  makeLocal() {
    if (this.isSaved()) this.setSaved(false);
    if (SubcircuitModel.globalModelMap.get(this.name) === this)
      SubcircuitModel.globalModelMap.delete(this.name);
    SubcircuitModel.localModelMap.set(this.name, this);
    SubcircuitModel.sequenceNumber++;
  }
  makePersistent() {
    this.makeGlobal();
    this.setSaved(true);
  }
  // dump models as a subcircuit library file, which can be loaded like a circuit
  static dumpLibrary(models) {
    const doc = document.implementation.createDocument(null, "cir", null);
    const root = doc.documentElement;
    CircuitXMLSerializer.dumpAttr(root, "sublib", 1);
    for (const m of models) {
      const elem = doc.createElement("ccm");
      m.buildXmlElement(doc, elem);
      root.appendChild(elem);
    }
    return CircuitXMLSerializer.prettyPrint(doc);
  }
  // load models from a subcircuit library file and make them global
  static loadLibrary(xml, root) {
    const oldLocalMap = SubcircuitModel.localModelMap;
    const loaded = /* @__PURE__ */ new Map();
    SubcircuitModel.localModelMap = loaded;
    try {
      xml.currentXmlElement = root;
      for (const child of xml.getChildElements()) {
        if (child.tagName !== "ccm") continue;
        xml.parseChildElement(child);
        SubcircuitModel.undumpModelXml(xml);
      }
    } finally {
      SubcircuitModel.localModelMap = oldLocalMap;
      for (const m of loaded.values()) m.makeGlobal();
    }
    return [...loaded.values()];
  }
  static loadModelFromStorage(data) {
    const doc = new DOMParser().parseFromString(data, "text/xml");
    const root = doc.documentElement;
    const xml = new CircuitXMLDeserializer(CirSim.theApp);
    xml.currentXmlElement = root;
    const modelName = xml.parseStringAttr("nm", null);
    const model = new SubcircuitModel();
    model.name = modelName;
    model.parseXmlElement(xml);
    SubcircuitModel.globalModelMap.set(modelName, model);
    SubcircuitModel.sequenceNumber++;
  }
  showLabel() {
    return (this.flags & SubcircuitModel.FLAG_SHOW_LABEL) !== 0;
  }
  isBuiltin() {
    return this.builtin;
  }
  setShowLabel(sl) {
    this.flags = sl ? this.flags | SubcircuitModel.FLAG_SHOW_LABEL : this.flags & -2;
  }
  // check if all bus entries have consecutive node numbers so we can use compact format
  busNodesConsecutive() {
    for (let i = 0; i < this.extList.length; i++) {
      const ent = this.extList[i];
      if (ent.busZ > 0 && ent.node !== this.extList[i - 1].node + 1)
        return false;
    }
    return true;
  }
  // build XML attributes and children into the given element
  buildXmlElement(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "nm", this.name);
    CircuitXMLSerializer.dumpAttr(elem, "f", this.flags);
    CircuitXMLSerializer.dumpAttr(elem, "sx", this.sizeX);
    CircuitXMLSerializer.dumpAttr(elem, "sy", this.sizeY);
    const bcs = this.busNodesConsecutive();
    if (bcs) CircuitXMLSerializer.dumpAttr(elem, "bcs", 1);
    for (const ent of this.extList) {
      if (bcs && ent.busZ > 0) continue;
      const ext = doc.createElement("ext");
      CircuitXMLSerializer.dumpAttr(ext, "nm", ent.name);
      CircuitXMLSerializer.dumpAttr(ext, "nd", ent.node);
      CircuitXMLSerializer.dumpAttr(ext, "ps", ent.pos);
      CircuitXMLSerializer.dumpAttr(ext, "sd", ent.side);
      if (ent.busWidth > 1) {
        CircuitXMLSerializer.dumpAttr(ext, "bw", ent.busWidth);
        if (!bcs) CircuitXMLSerializer.dumpAttr(ext, "bz", ent.busZ);
      }
      elem.appendChild(ext);
    }
    if (this.elmDoc) {
      const children = this.elmDoc.documentElement.childNodes;
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const imported = doc.importNode(node, true);
        elem.appendChild(imported);
      }
    }
  }
  dumpXml(doc) {
    if (this.internal) return;
    this.dumped = true;
    const elem = doc.createElement("ccm");
    this.buildXmlElement(doc, elem);
    doc.documentElement.appendChild(elem);
  }
  static undumpModelXml(xml) {
    const name = xml.parseStringAttr("nm", null);
    let model = SubcircuitModel.getModelWithName(name);
    if (model === null) {
      model = new SubcircuitModel();
      model.name = name;
      SubcircuitModel.localModelMap.set(name, model);
      SubcircuitModel.sequenceNumber++;
    } else if (SubcircuitModel.globalModelMap.has(name) && !SubcircuitModel.localModelMap.has(name)) {
      model = new SubcircuitModel();
      model.name = name;
      SubcircuitModel.localModelMap.set(name, model);
      SubcircuitModel.sequenceNumber++;
    }
    model.undumpXml(xml);
    return model;
  }
  // register a model definition embedded in another model (a nested subcircuit), unless a model
  // with that name already exists.  The embedded copy is a snapshot taken when the outer model
  // was created, so it may be stale; it must never overwrite a model that instances are using.
  static undumpEmbeddedModelXml(xml) {
    const name = xml.parseStringAttr("nm", null);
    if (SubcircuitModel.getModelWithName(name) !== null) return;
    const model = new SubcircuitModel();
    model.name = name;
    SubcircuitModel.localModelMap.set(name, model);
    SubcircuitModel.sequenceNumber++;
    model.undumpXml(xml);
  }
  // parse XML attributes and children from deserializer
  parseXmlElement(xml) {
    this.flags = xml.parseIntAttr("f", this.flags);
    this.sizeX = xml.parseIntAttr("sx", this.sizeX);
    this.sizeY = xml.parseIntAttr("sy", this.sizeY);
    const bcs = xml.parseIntAttr("bcs", 0) !== 0;
    this.extList = [];
    this.elmDoc = document.implementation.createDocument(null, "elms", null);
    const root = this.elmDoc.documentElement;
    for (const child of xml.getChildElements()) {
      if (child.tagName === "ext") {
        xml.parseChildElement(child);
        const s = xml.parseStringAttr("nm", "");
        const n = xml.parseIntAttr("nd", 0);
        const p = xml.parseIntAttr("ps", 0);
        const sd = xml.parseIntAttr("sd", 0);
        const bw = xml.parseIntAttr("bw", 1);
        if (bcs && bw > 1) {
          for (let j = 0; j < bw; j++) {
            const ent = new ExtListEntry(s, n + j, p, sd);
            ent.busWidth = bw;
            ent.busZ = j;
            this.extList.push(ent);
          }
        } else {
          const ent = new ExtListEntry(s, n, p, sd);
          ent.busWidth = bw;
          ent.busZ = xml.parseIntAttr("bz", 0);
          this.extList.push(ent);
        }
      } else {
        const imported = this.elmDoc.importNode(child, true);
        root.appendChild(imported);
        const tagName = child.tagName;
        xml.parseChildElement(child);
        if (tagName === "dm")
          DiodeModel.undumpModelXml(xml);
        else if (tagName === "rlm")
          RelayModel.undumpModelXml(xml);
        else if (tagName === "tm")
          TransistorModel.undumpModelXml(xml);
        else if (tagName === "clm")
          CustomLogicModel.undumpModelXml(xml);
        else if (tagName === "mm")
          MosfetModel.undumpModelXml(xml);
        else if (tagName === "ccm")
          SubcircuitModel.undumpEmbeddedModelXml(xml);
      }
    }
  }
  undumpXml(xml) {
    this.parseXmlElement(xml);
  }
  // get child elements from elmDoc for use by loadCompositeXml
  getElmEntries() {
    if (!this.elmDoc) return [];
    const entries = [];
    const children = this.elmDoc.documentElement.childNodes;
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.nodeType === Node.ELEMENT_NODE)
        entries.push(node);
    }
    return entries;
  }
  // reconstruct old-format nodeList string from XML (for loadComposite compatibility)
  getNodeList() {
    let nodeList = "";
    for (const child of this.getElmEntries()) {
      const tagName = child.tagName;
      const className = CirSim.xmlDumpTypeMap.get(tagName);
      if (!className) continue;
      const nn = child.getAttribute("nn");
      if (nodeList.length > 0) nodeList += "\r";
      nodeList += className + (nn && nn.length > 0 ? " " + nn : "");
    }
    return nodeList;
  }
  canLoadModelCircuit() {
    if (this.modelCircuit && this.modelCircuit.length > 0) return true;
    if (this.elmDoc) {
      const children = this.elmDoc.documentElement.childNodes;
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.getAttribute("x") !== null) return true;
        }
      }
    }
    return false;
  }
  remove() {
    this.setSaved(false);
    SubcircuitModel.localModelMap.delete(this.name);
    SubcircuitModel.globalModelMap.delete(this.name);
    SubcircuitModel.sequenceNumber++;
  }
  // replace a model in whichever map it lives in.  A global model replaces any local
  // copy with the same name (e.g. a stale one reloaded from a saved editing context).
  static replaceModel(model) {
    if (SubcircuitModel.globalModelMap.get(model.name) === model)
      SubcircuitModel.localModelMap.delete(model.name);
    else
      SubcircuitModel.localModelMap.set(model.name, model);
    SubcircuitModel.sequenceNumber++;
  }
  // dump local models not already dumped (i.e. not used by any element), since local
  // models belong to the circuit and would otherwise be lost when it is reloaded
  static dumpUnusedLocalModels(doc) {
    for (const m of SubcircuitModel.localModelMap.values())
      if (!m.dumped && !m.builtin && m.name !== "")
        m.dumpXml(doc);
  }
  static clearLocalModels() {
    SubcircuitModel.localModelMap.clear();
    SubcircuitModel.sequenceNumber++;
  }
  static loadInternalModels() {
    const lm317 = ". ~LM317-v2 0 2 2 3 adj 2 1 1 in 1 0 2 out 3 0 3 JfetElm\\s3\\s4\\s1\\s\\rResistorElm\\s5\\s39\\rCapacitorElm\\s39\\s6\\rCapacitorElm\\s39\\s5\\rTransistorElm\\s39\\s5\\s6\\s\\rResistorElm\\s7\\s40\\rCapacitorElm\\s40\\s8\\rCapacitorElm\\s40\\s5\\rTransistorElm\\s40\\s5\\s8\\s\\rResistorElm\\s5\\s41\\rCapacitorElm\\s41\\s9\\rCapacitorElm\\s41\\s7\\rTransistorElm\\s41\\s7\\s9\\s\\rResistorElm\\s7\\s42\\rCapacitorElm\\s42\\s3\\rCapacitorElm\\s42\\s10\\rTransistorElm\\s42\\s10\\s3\\s\\rResistorElm\\s10\\s43\\rCapacitorElm\\s43\\s11\\rCapacitorElm\\s43\\s3\\rTransistorElm\\s43\\s3\\s11\\s\\rResistorElm\\s10\\s44\\rCapacitorElm\\s44\\s13\\rCapacitorElm\\s44\\s12\\rTransistorElm\\s44\\s12\\s13\\s\\rResistorElm\\s5\\s45\\rCapacitorElm\\s45\\s14\\rCapacitorElm\\s45\\s11\\rTransistorElm\\s45\\s11\\s14\\s\\rResistorElm\\s12\\s46\\rCapacitorElm\\s46\\s11\\rCapacitorElm\\s46\\s15\\rTransistorElm\\s46\\s15\\s11\\s\\rResistorElm\\s5\\s47\\rCapacitorElm\\s47\\s17\\rCapacitorElm\\s47\\s16\\rTransistorElm\\s47\\s16\\s17\\s\\rResistorElm\\s15\\s48\\rCapacitorElm\\s48\\s18\\rCapacitorElm\\s48\\s16\\rTransistorElm\\s48\\s16\\s18\\s\\rResistorElm\\s19\\s49\\rCapacitorElm\\s49\\s16\\rCapacitorElm\\s49\\s3\\rTransistorElm\\s49\\s3\\s16\\s\\rResistorElm\\s20\\s50\\rCapacitorElm\\s50\\s19\\rCapacitorElm\\s50\\s1\\rTransistorElm\\s50\\s1\\s19\\s\\rResistorElm\\s5\\s51\\rCapacitorElm\\s51\\s21\\rCapacitorElm\\s51\\s20\\rTransistorElm\\s51\\s20\\s21\\s\\rResistorElm\\s22\\s52\\rCapacitorElm\\s52\\s20\\rCapacitorElm\\s52\\s3\\rTransistorElm\\s52\\s3\\s20\\s\\rResistorElm\\s23\\s53\\rCapacitorElm\\s53\\s16\\rCapacitorElm\\s53\\s22\\rTransistorElm\\s53\\s22\\s16\\s\\rResistorElm\\s3\\s54\\rCapacitorElm\\s54\\s24\\rCapacitorElm\\s54\\s22\\rTransistorElm\\s54\\s22\\s24\\s\\rResistorElm\\s23\\s55\\rCapacitorElm\\s55\\s16\\rCapacitorElm\\s55\\s23\\rTransistorElm\\s55\\s23\\s16\\s\\rResistorElm\\s3\\s56\\rCapacitorElm\\s56\\s25\\rCapacitorElm\\s56\\s23\\rTransistorElm\\s56\\s23\\s25\\s\\rResistorElm\\s26\\s57\\rCapacitorElm\\s57\\s16\\rCapacitorElm\\s57\\s3\\rTransistorElm\\s57\\s3\\s16\\s\\rResistorElm\\s27\\s58\\rCapacitorElm\\s58\\s3\\rCapacitorElm\\s58\\s26\\rTransistorElm\\s58\\s26\\s3\\s\\rResistorElm\\s28\\s59\\rCapacitorElm\\s59\\s1\\rCapacitorElm\\s59\\s28\\rTransistorElm\\s59\\s28\\s1\\s\\rResistorElm\\s28\\s60\\rCapacitorElm\\s60\\s1\\rCapacitorElm\\s60\\s16\\rTransistorElm\\s60\\s16\\s1\\s\\rResistorElm\\s16\\s61\\rCapacitorElm\\s61\\s29\\rCapacitorElm\\s61\\s28\\rTransistorElm\\s61\\s28\\s29\\s\\rResistorElm\\s31\\s62\\rCapacitorElm\\s62\\s32\\rCapacitorElm\\s62\\s30\\rTransistorElm\\s62\\s30\\s32\\s\\rResistorElm\\s31\\s63\\rCapacitorElm\\s63\\s33\\rCapacitorElm\\s63\\s30\\rTransistorElm\\s63\\s30\\s33\\s\\rResistorElm\\s34\\s64\\rCapacitorElm\\s64\\s35\\rCapacitorElm\\s64\\s1\\rTransistorElm\\s64\\s1\\s35\\s\\rResistorElm\\s35\\s65\\rCapacitorElm\\s65\\s36\\rCapacitorElm\\s65\\s1\\rTransistorElm\\s65\\s1\\s36\\s\\rDiodeElm\\s3\\s4\\rDiodeElm\\s37\\s1\\rDiodeElm\\s32\\s38\\rResistorElm\\s1\\s6\\rResistorElm\\s1\\s9\\rResistorElm\\s1\\s14\\rResistorElm\\s1\\s17\\rResistorElm\\s1\\s21\\rResistorElm\\s4\\s7\\rResistorElm\\s7\\s10\\rResistorElm\\s11\\s12\\rResistorElm\\s8\\s3\\rResistorElm\\s13\\s3\\rResistorElm\\s15\\s3\\rResistorElm\\s18\\s3\\rResistorElm\\s19\\s3\\rResistorElm\\s2\\s24\\rResistorElm\\s24\\s25\\rResistorElm\\s16\\s26\\rResistorElm\\s16\\s31\\rResistorElm\\s29\\s35\\rResistorElm\\s16\\s34\\rResistorElm\\s27\\s30\\rResistorElm\\s30\\s31\\rResistorElm\\s3\\s35\\rResistorElm\\s37\\s38\\rResistorElm\\s33\\s32\\rResistorElm\\s33\\s36\\rResistorElm\\s36\\s3\\rCapacitorElm\\s22\\s3\\rCapacitorElm\\s22\\s2\\rCapacitorElm\\s26\\s27\\rCapacitorElm\\s5\\s3\\rCapacitorElm\\s28\\s3\\rCapacitorElm\\s23\\s3\\r 0\\\\s-7\\\\s0.0001\\s0\\\\s200\\s2\\\\s1.5000000000000002e-13\\\\s0\\\\s0\\s2\\\\s1e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.1\\s0\\\\s500\\s2\\\\s4e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A0.2\\s0\\\\s200\\s2\\\\s1.5000000000000002e-13\\\\s0\\\\s0\\s2\\\\s1e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.1\\s0\\\\s500\\s2\\\\s4e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A0.2\\s0\\\\s100\\s2\\\\s3.0000000000000003e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.2\\s0\\\\s500\\s2\\\\s4e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A0.2\\s0\\\\s100\\s2\\\\s3.0000000000000003e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.2\\s0\\\\s100\\s2\\\\s3.0000000000000003e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.2\\s0\\\\s100\\s2\\\\s3.0000000000000003e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.2\\s0\\\\s500\\s2\\\\s4e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A0.2\\s0\\\\s100\\s2\\\\s3.0000000000000003e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.2\\s0\\\\s500\\s2\\\\s4e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A0.2\\s0\\\\s100\\s2\\\\s3.0000000000000003e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.2\\s0\\\\s100\\s2\\\\s3.0000000000000003e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.2\\s0\\\\s100\\s2\\\\s3.0000000000000003e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.2\\s0\\\\s500\\s2\\\\s4e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A0.2\\s0\\\\s100\\s2\\\\s3.0000000000000003e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.2\\s0\\\\s50\\s2\\\\s4e-12\\\\s0\\\\s0\\s2\\\\s2e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A2\\s0\\\\s100\\s2\\\\s3.0000000000000003e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A0.2\\s0\\\\s500\\s2\\\\s4e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A0.2\\s0\\\\s10\\s2\\\\s3e-12\\\\s0\\\\s0\\s2\\\\s2e-12\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A2\\s0\\\\s10\\s2\\\\s3e-12\\\\s0\\\\s0\\s2\\\\s2e-12\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s40\\\\s~lm317-qpl-A2\\s0\\\\s50\\s2\\\\s4e-12\\\\s0\\\\s0\\s2\\\\s2e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A2\\s0\\\\s500\\s2\\\\s4e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A0.2\\s0\\\\s500\\s2\\\\s4e-13\\\\s0\\\\s0\\s2\\\\s2e-13\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A0.2\\s0\\\\s20\\s2\\\\s1e-11\\\\s0\\\\s0\\s2\\\\s5e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A5\\s0\\\\s2\\s2\\\\s1e-10\\\\s0\\\\s0\\s2\\\\s5e-11\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s80\\\\s~lm317-qnl-A50\\s2\\\\s~lm317-dz\\s2\\\\s~lm317-dz\\s2\\\\s~lm317-dz\\s0\\\\s310\\s0\\\\s310\\s0\\\\s190\\s0\\\\s82\\s0\\\\s5600\\s0\\\\s100000\\s0\\\\s130\\s0\\\\s12400\\s0\\\\s180\\s0\\\\s4100\\s0\\\\s5800\\s0\\\\s72\\s0\\\\s5100\\s0\\\\s12000\\s0\\\\s2400\\s0\\\\s6700\\s0\\\\s12000\\s0\\\\s130\\s0\\\\s370\\s0\\\\s13000\\s0\\\\s400\\s0\\\\s160\\s0\\\\s18000\\s0\\\\s160\\s0\\\\s3\\s0\\\\s0.1\\s2\\\\s3e-11\\\\s0\\\\s0\\s2\\\\s3e-11\\\\s0\\\\s0\\s2\\\\s5e-12\\\\s0\\\\s0\\s2\\\\s2e-12\\\\s0\\\\s0\\s2\\\\s1e-12\\\\s0\\\\s0\\s2\\\\s1e-12\\\\s0\\\\s0";
    const tl431 = ". ~TL431 0 1 3 3 A 2 0 1 C 1 0 0 ref 3 1 2 ResistorElm\\s3\\s18\\rCapacitorElm\\s18\\s4\\rCapacitorElm\\s18\\s1\\rTransistorElm\\s18\\s1\\s4\\s\\rResistorElm\\s4\\s5\\rResistorElm\\s5\\s6\\rResistorElm\\s5\\s7\\rResistorElm\\s6\\s19\\rCapacitorElm\\s19\\s2\\rCapacitorElm\\s19\\s6\\rTransistorElm\\s19\\s6\\s2\\s\\rResistorElm\\s6\\s20\\rCapacitorElm\\s20\\s8\\rCapacitorElm\\s20\\s7\\rTransistorElm\\s20\\s7\\s8\\s\\rResistorElm\\s8\\s2\\rResistorElm\\s4\\s21\\rCapacitorElm\\s21\\s10\\rCapacitorElm\\s21\\s9\\rTransistorElm\\s21\\s9\\s10\\s\\rResistorElm\\s10\\s11\\rResistorElm\\s7\\s22\\rCapacitorElm\\s22\\s2\\rCapacitorElm\\s22\\s11\\rTransistorElm\\s22\\s11\\s2\\s\\rResistorElm\\s13\\s23\\rCapacitorElm\\s23\\s2\\rCapacitorElm\\s23\\s12\\rTransistorElm\\s23\\s12\\s2\\s\\rResistorElm\\s9\\s24\\rCapacitorElm\\s24\\s14\\rCapacitorElm\\s24\\s9\\rTransistorElm\\s24\\s9\\s14\\s\\rResistorElm\\s9\\s25\\rCapacitorElm\\s25\\s15\\rCapacitorElm\\s25\\s12\\rTransistorElm\\s25\\s12\\s15\\s\\rResistorElm\\s1\\s14\\rResistorElm\\s1\\s15\\rResistorElm\\s12\\s26\\rCapacitorElm\\s26\\s16\\rCapacitorElm\\s26\\s1\\rTransistorElm\\s26\\s1\\s16\\s\\rResistorElm\\s17\\s16\\rResistorElm\\s17\\s27\\rCapacitorElm\\s27\\s2\\rCapacitorElm\\s27\\s1\\rTransistorElm\\s27\\s1\\s2\\s\\rResistorElm\\s17\\s2\\rResistorElm\\s12\\s28\\rCapacitorElm\\s28\\s3\\rCapacitorElm\\s28\\s12\\rTransistorElm\\s28\\s12\\s3\\s\\rDiodeElm\\s2\\s12\\rResistorElm\\s13\\s6\\rDiodeElm\\s2\\s1\\rCapacitorElm\\s1\\s12\\rCapacitorElm\\s7\\s11\\r 0\\\\s40\\s2\\\\s1e-12\\\\s0\\\\s0\\s2\\\\s2e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s140\\\\s~tl431ed-qn_ed\\s0\\\\s3280\\s0\\\\s2400\\s0\\\\s7200\\s0\\\\s33.333333333333336\\s2\\\\s1.2e-12\\\\s0\\\\s0\\s2\\\\s2.4e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s140\\\\s~tl431ed-qn_ed-A1.2\\s0\\\\s18.18181818181818\\s2\\\\s2.2000000000000003e-12\\\\s0\\\\s0\\s2\\\\s4.400000000000001e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s140\\\\s~tl431ed-qn_ed-A2.2\\s0\\\\s800\\s0\\\\s40\\s2\\\\s1e-12\\\\s0\\\\s0\\s2\\\\s2e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s140\\\\s~tl431ed-qn_ed\\s0\\\\s4000\\s0\\\\s40\\s2\\\\s1e-12\\\\s0\\\\s0\\s2\\\\s2e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s140\\\\s~tl431ed-qn_ed\\s0\\\\s80\\s2\\\\s5e-13\\\\s0\\\\s0\\s2\\\\s1e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s140\\\\s~tl431ed-qn_ed-A0.5\\s0\\\\s80\\s2\\\\s1e-12\\\\s0\\\\s0\\s2\\\\s3e-12\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s60\\\\s~tl431ed-qp_ed\\s0\\\\s80\\s2\\\\s1e-12\\\\s0\\\\s0\\s2\\\\s3e-12\\\\s0\\\\s0\\s0\\\\s-1\\\\s0\\\\s0\\\\s60\\\\s~tl431ed-qp_ed\\s0\\\\s800\\s0\\\\s800\\s0\\\\s40\\s2\\\\s1e-12\\\\s0\\\\s0\\s2\\\\s2e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s140\\\\s~tl431ed-qn_ed\\s0\\\\s150\\s0\\\\s8\\s2\\\\s5e-12\\\\s0\\\\s0\\s2\\\\s1e-11\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s140\\\\s~tl431ed-qn_ed-A5\\s0\\\\s10000\\s0\\\\s40\\s2\\\\s1e-12\\\\s0\\\\s0\\s2\\\\s2e-12\\\\s0\\\\s0\\s0\\\\s1\\\\s0\\\\s0\\\\s140\\\\s~tl431ed-qn_ed\\s2\\\\s~tl431ed-d_ed\\s0\\\\s1000\\s2\\\\s~tl431ed-d_ed\\s2\\\\s1e-11\\\\s0\\\\s0\\s2\\\\s2e-11\\\\s0\\\\s0";
    for (const modelStr of [lm317, tl431]) {
      const st = new StringTokenizer(modelStr, " ");
      st.nextToken();
      const model = SubcircuitModel.undumpModel(st);
      model.internal = model.builtin = true;
      SubcircuitModel.localModelMap.delete(model.name);
      SubcircuitModel.globalModelMap.set(model.name, model);
    }
  }
}
HookRegistry.undumpSubcircuitModel = (xml) => SubcircuitModel.undumpModelXml(xml);
HookRegistry.loadSubcircuitModelsFromStorage = () => SubcircuitModel.loadModelsFromStorage();
HookRegistry.clearSubcircuitModelDumpedFlags = () => SubcircuitModel.clearDumpedFlags();
HookRegistry.dumpUnusedLocalSubcircuitModels = (doc) => SubcircuitModel.dumpUnusedLocalModels(doc);

class ScrollValuePopup {
  static e12 = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  static labMax = 5;
  static scale = 6;
  values = [];
  minpow = 0;
  maxpow = 1;
  nvalues = 0;
  currentidx = 0;
  lastidx = 0;
  myElm;
  labels = [];
  deltaY = 0;
  name = "";
  inf;
  sim;
  panel;
  closed = false;
  onWheel = (e) => {
    e.preventDefault();
    this.doDeltaY(ScrollValuePopup.normalizeWheelDelta(e));
  };
  onMouseOut = () => this.close(true);
  onMouseDown = (e) => {
    if (e.button === 0 || e.button === 1)
      this.close(true);
    else
      this.close(false);
  };
  constructor(x, y, dy, elm, sim) {
    this.myElm = elm;
    this.sim = sim;
    this.sim.undoManager.pushUndo();
    this.setupValues();
    this.panel = document.createElement("div");
    this.panel.className = "scrollValuePopup";
    const nameLabel = document.createElement("div");
    nameLabel.className = "scrollValuePopup-name";
    nameLabel.textContent = this.name;
    this.panel.appendChild(nameLabel);
    for (let i = 0; i < ScrollValuePopup.labMax; i++) {
      const label = document.createElement("div");
      label.textContent = "---";
      label.className = "scrollValuePopup-label" + (i === 2 ? " selected" : i === 1 || i === 3 ? " off1" : " off2");
      this.panel.appendChild(label);
      this.labels.push(label);
    }
    this.panel.addEventListener("wheel", this.onWheel, { passive: false });
    this.panel.addEventListener("mouseout", this.onMouseOut);
    this.panel.addEventListener("mousedown", this.onMouseDown);
    this.doDeltaY(dy);
    this.panel.style.visibility = "hidden";
    document.body.appendChild(this.panel);
    const w = this.panel.offsetWidth;
    const h = this.panel.offsetHeight;
    const left = Math.max(0, x - w / 4);
    const top = Math.max(0, y - 7 * h / 12);
    this.panel.style.left = left + "px";
    this.panel.style.top = top + "px";
    this.panel.style.visibility = "";
  }
  setupValues() {
    if (this.myElm.isResistorElm()) {
      this.minpow = -1;
      this.maxpow = 7;
    }
    if (this.myElm.isCapacitorElm()) {
      this.minpow = -11;
      this.maxpow = -3;
    }
    if (this.myElm.isInductorElm()) {
      this.minpow = -6;
      this.maxpow = 0;
    }
    this.values = new Array(2 + (this.maxpow - this.minpow) * 12);
    let ptr = 0;
    for (let i = this.minpow; i <= this.maxpow; i++) {
      const jmax = i !== this.maxpow ? 12 : 1;
      for (let j = 0; j < jmax; j++, ptr++)
        this.values[ptr] = Math.pow(10, i) * ScrollValuePopup.e12[j];
    }
    this.nvalues = ptr;
    this.values[this.nvalues] = 1e99;
    this.inf = this.myElm.getEditInfo(0);
    const currentvalue = this.inf.value;
    for (let i = 0; i < this.nvalues + 1; i++) {
      if (CircuitElm.getShortUnitText(currentvalue, "") === CircuitElm.getShortUnitText(this.values[i], "")) {
        this.values[i] = currentvalue;
        this.currentidx = i;
        break;
      }
      if (currentvalue < this.values[i]) {
        this.currentidx = i;
        for (let j = this.nvalues - 1; j >= i; j--)
          this.values[j + 1] = this.values[j];
        this.values[i] = currentvalue;
        this.nvalues++;
        break;
      }
    }
    this.name = this.inf.name;
    this.lastidx = this.currentidx;
  }
  setupLabels() {
    const thissel = this.getSelIdx();
    for (let i = 0; i < ScrollValuePopup.labMax; i++) {
      const label = this.labels[i];
      label.classList.remove("current");
      const idx = thissel + i - 2;
      if (idx < 0 || idx >= this.nvalues)
        label.textContent = "---";
      else {
        label.textContent = CircuitElm.getShortUnitText(this.values[idx], "");
        if (idx === this.currentidx)
          label.classList.add("current");
      }
    }
  }
  close(keepChanges) {
    if (this.closed)
      return;
    this.closed = true;
    if (!keepChanges)
      this.setElmValue(this.currentidx);
    else
      this.setElmValue();
    this.panel.remove();
  }
  isShowing() {
    return !this.closed;
  }
  doDeltaY(dy) {
    this.deltaY += dy / (window.devicePixelRatio || 1);
    this.setElmValue();
    this.setupLabels();
  }
  setElmValue(i = this.getSelIdx()) {
    if (i !== this.lastidx) {
      this.lastidx = i;
      this.inf.value = this.values[i];
      this.myElm.setEditValue(0, this.inf);
      this.sim.needAnalyze();
    }
  }
  // GWT's MouseWheelEvent.getDeltaY() (which the constants below, like scale, were tuned
  // against) came out much smaller than the raw pixel deltaY a native 'wheel' event gives
  // us - GWT computed it from the legacy, non-standard wheelDelta property, whose ratio to
  // deltaY turned out not to be the fixed cross-browser constant it's classically assumed
  // to be. 0.12 is an empirically-chosen scale-down factor, not a derived conversion.
  static normalizeWheelDelta(e) {
    return Math.round(e.deltaY * 0.12) || 0;
  }
  getSelIdx() {
    let r = this.currentidx + Math.round(this.sim.mouse.wheelSensitivity * this.deltaY / ScrollValuePopup.scale);
    if (r < 0)
      r = 0;
    if (r >= this.nvalues)
      r = this.nvalues - 1;
    return r;
  }
}

class MouseManager {
  static MODE_ADD_ELM = 0;
  static MODE_DRAG_ALL = 1;
  static MODE_DRAG_ROW = 2;
  static MODE_DRAG_COLUMN = 3;
  static MODE_DRAG_SELECTED = 4;
  static MODE_DRAG_POST = 5;
  static MODE_SELECT = 6;
  static MODE_DRAG_SPLITTER = 7;
  static MODE_DRAG_REROUTE = 8;
  static POSTGRABSQ = 25;
  static MINPOSTGRABSIZE = 256;
  static lastSubcircuitMenuUpdate = 0;
  sim;
  ui;
  // UIManager — not statically imported to avoid circular TDZ
  // fields
  mouseWasOverSplitter = false;
  mouseMode = MouseManager.MODE_SELECT;
  tempMouseMode = MouseManager.MODE_SELECT;
  dragGridX = 0;
  dragGridY = 0;
  dragScreenX = 0;
  dragScreenY = 0;
  initDragGridX = 0;
  initDragGridY = 0;
  mouseDownTime = 0;
  mouseDownScreenX = 0;
  mouseDownScreenY = 0;
  zoomTime = 0;
  mouseCursorX = -1;
  mouseCursorY = -1;
  selectedArea = null;
  dragging = false;
  wheelSensitivity = 1;
  dragElm = null;
  menuElm = null;
  mouseElm = null;
  didSwitch = false;
  mousePost = -1;
  highlightedNode = null;
  netHighlightKeyHeld = false;
  scopePlotRoles = /* @__PURE__ */ new Map();
  draggingPost = -1;
  heldSwitchElm = null;
  // SwitchElm
  mouseDragging = false;
  menuClientX = 0;
  menuClientY = 0;
  menuX = 0;
  menuY = 0;
  // elements grabbed at mouse-down for DragRow/DragColumn
  dragRowColElms = [];
  dragRowColPosts = [];
  // ---- Toolbar drag-and-drop ----
  // A press-and-drag on a toolbar icon drops a new element where the mouse is released,
  // instead of just switching the mouse mode the way a plain click does.
  static TOOLBAR_DRAG_THRESHOLD = 6;
  toolbarDragClass = null;
  toolbarDragStartX = 0;
  toolbarDragStartY = 0;
  toolbarDragActive = false;
  toolbarDragVertical = false;
  toolbarDragAnchorX = 0;
  toolbarDragAnchorY = 0;
  constructor(sim, ui) {
    this.sim = sim;
    this.ui = ui;
  }
  register(canvas) {
    canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
    canvas.addEventListener("mouseout", (e) => this.onMouseOut(e));
    canvas.addEventListener("mouseup", (e) => this.onMouseUp(e));
    canvas.addEventListener("click", (e) => this.onClick(e));
    canvas.addEventListener("dblclick", (e) => this.onDoubleClick(e));
    canvas.addEventListener("contextmenu", (e) => this.onContextMenu(e));
    canvas.addEventListener("wheel", (e) => this.onMouseWheel(e), { passive: false });
    this.doTouchHandlers(canvas);
    document.addEventListener("mousemove", (e) => {
      if (this.isToolbarDragPending()) {
        e.preventDefault();
        this.toolbarDragMove(e.clientX, e.clientY, e.shiftKey);
      }
    });
    document.addEventListener("mouseup", (e) => {
      if (this.isToolbarDragPending())
        this.toolbarDragEnd(e.clientX, e.clientY);
    });
  }
  getCanvasX(canvas, clientX) {
    return clientX - canvas.getBoundingClientRect().left;
  }
  getCanvasY(canvas, clientY) {
    return clientY - canvas.getBoundingClientRect().top;
  }
  // install touch handlers
  doTouchHandlers(cv) {
    let lastTap = 0;
    let tmout = null;
    let lastScale = 1;
    cv.addEventListener("touchstart", (e) => {
      clearTimeout(tmout);
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[e.touches.length - 1];
      lastScale = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const midX = 0.5 * (touch1.clientX + touch2.clientX);
      const midY = 0.5 * (touch1.clientY + touch2.clientY);
      if (e.touches.length > 1) {
        if (this.dragElm != null) {
          this.dragElm.delete();
          this.dragElm = null;
        }
        lastTap = 0;
        this.twoFingerTouch(midX, midY - cv.getBoundingClientRect().top);
        return;
      }
      let etype = "mousedown";
      if (e.timeStamp - lastTap < 300) {
        etype = "dblclick";
      } else {
        tmout = setTimeout(() => {
          this.longPress();
        }, 500);
      }
      lastTap = e.timeStamp;
      const mouseEvent = new MouseEvent(etype, { clientX: midX, clientY: midY });
      cv.dispatchEvent(mouseEvent);
    }, false);
    cv.addEventListener("touchend", (e) => {
      const mouseEvent = new MouseEvent("mouseup", {});
      mouseEvent.fromTouch = true;
      e.preventDefault();
      clearTimeout(tmout);
      cv.dispatchEvent(mouseEvent);
    }, false);
    cv.addEventListener("touchmove", (e) => {
      e.preventDefault();
      clearTimeout(tmout);
      const touch1 = e.touches[0];
      const touch2 = e.touches[e.touches.length - 1];
      if (e.touches.length > 1) {
        const newScale = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        this.zoomCircuit(40 * (Math.log(newScale) - Math.log(lastScale)));
        lastScale = newScale;
      }
      const midX = 0.5 * (touch1.clientX + touch2.clientX);
      const midY = 0.5 * (touch1.clientY + touch2.clientY);
      const mouseEvent = new MouseEvent("mousemove", { clientX: midX, clientY: midY });
      cv.dispatchEvent(mouseEvent);
    }, false);
  }
  longPress() {
    this.doPopupMenu();
  }
  twoFingerTouch(x, y) {
    this.tempMouseMode = MouseManager.MODE_DRAG_ALL;
    this.dragScreenX = x;
    this.dragScreenY = y;
  }
  snapGrid(x) {
    return x + this.sim.gridRound & this.sim.gridMask;
  }
  isToolbarDragPending() {
    return this.toolbarDragClass != null;
  }
  // re-place the element being dragged, e.g. when shift is pressed/released
  // without any mouse movement
  toolbarDragOrientationChanged(vertical) {
    if (this.toolbarDragClass == null || this.dragElm == null)
      return;
    this.toolbarDragVertical = vertical;
    this.dragElm.dragPlace(this.toolbarDragAnchorX, this.toolbarDragAnchorY, this.toolbarDragVertical);
    this.sim.repaint();
  }
  beginToolbarDrag(className, clientX, clientY) {
    if (this.ui.isReadOnly() || this.sim.modalDialogIsShowing())
      return;
    this.toolbarDragClass = className;
    this.toolbarDragStartX = clientX;
    this.toolbarDragStartY = clientY;
    this.toolbarDragActive = false;
    this.toolbarDragVertical = false;
  }
  cancelToolbarDrag() {
    if (this.dragElm != null) {
      this.dragElm.delete();
      this.dragElm = null;
    }
    this.toolbarDragClass = null;
    this.toolbarDragActive = false;
    this.tempMouseMode = this.mouseMode;
    this.dragging = false;
  }
  toolbarDragMove(clientX, clientY, vertical) {
    if (this.toolbarDragClass == null)
      return;
    if (!this.toolbarDragActive) {
      const dx = clientX - this.toolbarDragStartX, dy = clientY - this.toolbarDragStartY;
      if (dx * dx + dy * dy < MouseManager.TOOLBAR_DRAG_THRESHOLD * MouseManager.TOOLBAR_DRAG_THRESHOLD)
        return;
      this.toolbarDragActive = true;
      this.sim.undoManager?.pushUndo();
    }
    const canvas = this.ui.cv;
    const cx = this.getCanvasX(canvas, clientX);
    const cy = this.getCanvasY(canvas, clientY);
    if (!this.sim.circuitArea.contains(cx, cy)) {
      if (this.dragElm != null)
        this.sim.repaint();
      return;
    }
    this.toolbarDragAnchorX = this.snapGrid(this.inverseTransformX(cx));
    this.toolbarDragAnchorY = this.snapGrid(this.inverseTransformY(cy));
    this.toolbarDragVertical = vertical;
    if (this.dragElm == null) {
      try {
        this.dragElm = this.sim.constructElement(this.toolbarDragClass, this.toolbarDragAnchorX, this.toolbarDragAnchorY);
      } catch (ex) {
        CirSim.debugger();
      }
      this.tempMouseMode = MouseManager.MODE_ADD_ELM;
      this.dragging = true;
    }
    if (this.dragElm != null)
      this.dragElm.dragPlace(this.toolbarDragAnchorX, this.toolbarDragAnchorY, this.toolbarDragVertical);
    this.sim.repaint();
  }
  toolbarDragEnd(clientX, clientY) {
    if (this.toolbarDragClass == null)
      return;
    const wasActive = this.toolbarDragActive;
    this.toolbarDragClass = null;
    this.toolbarDragActive = false;
    if (!wasActive)
      return;
    let createdElm = null;
    if (this.dragElm != null) {
      if (this.dragElm.creationFailed()) {
        this.dragElm.delete();
      } else {
        this.splitAt(this.dragElm.x, this.dragElm.y);
        this.splitAt(this.dragElm.x2, this.dragElm.y2);
        this.ui.elmList.push(this.dragElm);
        this.dragElm.draggingDone();
        this.sim.undoManager?.writeRecoveryToStorage();
        this.sim.unsavedChanges = true;
        this.sim.needAnalyze();
        this.sim.undoManager?.pushUndo();
        createdElm = this.dragElm;
      }
      this.dragElm = null;
    }
    this.tempMouseMode = this.mouseMode;
    this.dragging = false;
    this.sim.updateToolbar();
    this.sim.repaint();
    if (createdElm != null && createdElm.showPropertiesOnCreate() && !this.ui.isReadOnly())
      this.sim.commands.doEdit(createdElm, false);
  }
  doSwitch(x, y) {
    if (this.mouseElm == null || !this.mouseElm.isSwitchElm())
      return false;
    const se = this.mouseElm;
    if (!se.getSwitchRect().contains(x, y))
      return false;
    se.toggle();
    if (se.momentary)
      this.heldSwitchElm = se;
    if (!this.mouseElm.isLogicInputElm())
      this.sim.needAnalyze();
    return true;
  }
  mouseDragged(e) {
    if (Scope.draggingPlotYScope != null) {
      const canvas0 = this.ui.cv;
      Scope.draggingPlotYScope.dragPlotY(this.getCanvasY(canvas0, e.clientY));
      this.sim.repaint();
      return;
    }
    if (e.button === 2) {
      if (!(e.metaKey || e.shiftKey || e.ctrlKey || e.altKey))
        return;
    }
    const canvas = this.ui.cv;
    const ex = this.getCanvasX(canvas, e.clientX);
    const ey = this.getCanvasY(canvas, e.clientY);
    if (this.tempMouseMode === MouseManager.MODE_DRAG_SPLITTER) {
      this.dragSplitter(ex, ey);
      return;
    }
    const gx = this.inverseTransformX(ex);
    const gy = this.inverseTransformY(ey);
    if (!this.sim.circuitArea.contains(ex, ey)) {
      this.sim.repaint();
      return;
    }
    let changed = false;
    if (this.dragElm != null) {
      this.dragElm.drag(gx, gy);
      this.setMouseElm(null);
    }
    let success = true;
    switch (this.tempMouseMode) {
      case MouseManager.MODE_DRAG_ALL:
        this.dragAll(ex, ey);
        break;
      case MouseManager.MODE_DRAG_ROW:
        this.dragRow(this.snapGrid(gx), this.snapGrid(gy));
        changed = true;
        break;
      case MouseManager.MODE_DRAG_COLUMN:
        this.dragColumn(this.snapGrid(gx), this.snapGrid(gy));
        changed = true;
        break;
      case MouseManager.MODE_DRAG_POST:
        if (this.mouseElm != null) {
          this.dragPost(this.snapGrid(gx), this.snapGrid(gy), e.shiftKey);
          changed = true;
        }
        break;
      case MouseManager.MODE_SELECT:
        if (this.mouseElm == null)
          this.selectArea(gx, gy, e.shiftKey);
        else if (!this.ui.isReadOnly()) {
          if (Date.now() - this.mouseDownTime < 150)
            return;
          if (this.mouseElm.isRoutedWireElm()) {
            this.tempMouseMode = MouseManager.MODE_DRAG_REROUTE;
            this.mouseElm.rerouteVia(this.snapGrid(gx), this.snapGrid(gy));
            changed = true;
          } else {
            this.tempMouseMode = MouseManager.MODE_DRAG_SELECTED;
            changed = success = this.dragSelected(gx, gy);
          }
        }
        break;
      case MouseManager.MODE_DRAG_SELECTED:
        changed = success = this.dragSelected(gx, gy);
        break;
      case MouseManager.MODE_DRAG_REROUTE:
        if (this.mouseElm != null && this.mouseElm.isRoutedWireElm()) {
          this.mouseElm.rerouteVia(this.snapGrid(gx), this.snapGrid(gy));
          changed = true;
        }
        break;
    }
    this.dragging = true;
    if (success) {
      this.dragScreenX = ex;
      this.dragScreenY = ey;
      this.dragGridX = this.inverseTransformX(this.dragScreenX);
      this.dragGridY = this.inverseTransformY(this.dragScreenY);
      if (!(this.tempMouseMode === MouseManager.MODE_DRAG_SELECTED && this.onlyGraphicsElmsSelected())) {
        this.dragGridX = this.snapGrid(this.dragGridX);
        this.dragGridY = this.snapGrid(this.dragGridY);
      }
    }
    if (changed)
      this.sim.undoManager?.writeRecoveryToStorage();
    this.sim.repaint();
  }
  dragSplitter(x, y) {
    let h = this.ui.canvasHeight;
    if (h < 1) h = 1;
    this.sim.scopeManager.scopeHeightFraction = 1 - y / h;
    if (this.sim.scopeManager.scopeHeightFraction < 0.1)
      this.sim.scopeManager.scopeHeightFraction = 0.1;
    if (this.sim.scopeManager.scopeHeightFraction > 0.9)
      this.sim.scopeManager.scopeHeightFraction = 0.9;
    this.ui.setCircuitArea();
    this.sim.repaint();
  }
  dragAll(x, y) {
    const dx = x - this.dragScreenX;
    const dy = y - this.dragScreenY;
    if (dx === 0 && dy === 0) return;
    this.sim.transform[4] += dx;
    this.sim.transform[5] += dy;
    this.dragScreenX = x;
    this.dragScreenY = y;
  }
  dragRow(x, y) {
    const dy = y - this.dragGridY;
    if (dy === 0) return;
    for (let i = 0; i < this.dragRowColElms.length; i++)
      this.dragRowColElms[i].movePoint(this.dragRowColPosts[i], 0, dy);
    this.removeZeroLengthElements();
  }
  dragColumn(x, y) {
    const dx = x - this.dragGridX;
    if (dx === 0) return;
    for (let i = 0; i < this.dragRowColElms.length; i++)
      this.dragRowColElms[i].movePoint(this.dragRowColPosts[i], dx, 0);
    this.removeZeroLengthElements();
  }
  onlyGraphicsElmsSelected() {
    if (this.mouseElm != null && !this.mouseElm.isGraphicElm())
      return false;
    for (const ce of this.ui.elmList) {
      if (ce.isSelected() && !ce.isGraphicElm())
        return false;
    }
    return true;
  }
  dragSelected(x, y) {
    let me = false;
    if (this.mouseElm != null && !this.mouseElm.isSelected())
      this.mouseElm.setSelected(me = true);
    if (!this.onlyGraphicsElmsSelected()) {
      x = this.snapGrid(x);
      y = this.snapGrid(y);
    }
    const dx = x - this.dragGridX;
    const dy = y - this.dragGridY;
    if (dx === 0 && dy === 0) {
      if (me) this.mouseElm.setSelected(false);
      return false;
    }
    let allowed = true;
    for (const ce of this.ui.elmList) {
      if (ce.isSelected() && !ce.allowMove(dx, dy))
        allowed = false;
      if (!allowed) break;
    }
    if (allowed) {
      for (const ce of this.ui.elmList) {
        if (ce.isSelected())
          ce.move(dx, dy);
      }
      if (this.sim.sim.routedWireMap != null) {
        for (const ce of this.ui.elmList) {
          if (!ce.isSelected()) continue;
          const conns = this.sim.sim.routedWireMap.get(ce);
          if (conns == null) continue;
          for (const conn of conns) {
            if (!conn.wire.isSelected() && conn.wire.getPost(conn.wirePost).z === 0)
              conn.wire.movePoint(conn.wirePost, dx, dy);
          }
        }
      }
      this.sim.needAnalyze();
    }
    if (me) this.mouseElm.setSelected(false);
    return allowed;
  }
  dragPost(x, y, all) {
    if (this.draggingPost === -1) {
      this.draggingPost = Graphics.distanceSq(this.mouseElm.x, this.mouseElm.y, x, y) > Graphics.distanceSq(this.mouseElm.x2, this.mouseElm.y2, x, y) ? 1 : 0;
    }
    const dx = x - this.dragGridX;
    const dy = y - this.dragGridY;
    if (dx === 0 && dy === 0) return;
    if (all) {
      for (let i = 0; i < this.ui.elmList.length; i++) {
        const e = this.ui.elmList[i];
        let p = 0;
        if (e.x === this.dragGridX && e.y === this.dragGridY)
          p = 0;
        else if (e.x2 === this.dragGridX && e.y2 === this.dragGridY)
          p = 1;
        else
          continue;
        e.movePoint(p, dx, dy);
      }
    } else {
      this.mouseElm.movePoint(this.draggingPost, dx, dy);
      if (this.sim.sim.routedWireMap != null) {
        const conns = this.sim.sim.routedWireMap.get(this.mouseElm);
        if (conns != null) {
          for (const conn of conns) {
            if (conn.elmPost === this.draggingPost && conn.wire.getPost(conn.wirePost).z === 0)
              conn.wire.movePoint(conn.wirePost, dx, dy);
          }
        }
      }
    }
    this.sim.needAnalyze();
  }
  doFlip() {
    this.menuElm.flipPosts();
    this.sim.needAnalyze();
  }
  doSplit(ce) {
    if (ce == null || !ce.isWireElm())
      return;
    const px = this.snapGrid(this.inverseTransformX(this.menuX));
    const py = this.snapGrid(this.inverseTransformY(this.menuY));
    if (this.splitWireAt(px, py))
      this.sim.needAnalyze();
  }
  // Split any WireElm (including RoutedWireElm) whose interior contains (px, py).
  // Returns true if any wire was split.
  splitWireAt(px, py) {
    let split = false;
    for (let i = this.ui.elmList.length - 1; i >= 0; i--) {
      const ce = this.ui.elmList[i];
      if (!ce.isWireElm())
        continue;
      const we = ce;
      if (!we.pointOnWireInterior(px, py))
        continue;
      const newWire = we.split(px, py);
      if (newWire != null) {
        this.ui.elmList.push(newWire);
        split = true;
      }
    }
    return split;
  }
  // Split the lead stub of any non-wire element whose lead contains (px, py).
  // Moves the element's post to the split point and inserts a wire for the remainder.
  // Returns true if any lead was split.
  splitLeadsAt(px, py) {
    let split = false;
    for (let i = this.ui.elmList.length - 1; i >= 0; i--) {
      const ce = this.ui.elmList[i];
      if (ce.isWireElm())
        continue;
      const post = ce.getLeadPost(px, py);
      if (post < 0)
        continue;
      const ox = post === 0 ? ce.x : ce.x2;
      const oy = post === 0 ? ce.y : ce.y2;
      ce.movePoint(post, px - ox, py - oy);
      const w = this.sim.constructElement("WireElm", px, py);
      w.drag(ox, oy);
      this.ui.elmList.push(w);
      split = true;
    }
    return split;
  }
  // Split any wire or element lead whose interior contains (px, py).
  splitAt(px, py) {
    const a = this.splitWireAt(px, py);
    const b = this.splitLeadsAt(px, py);
    return a || b;
  }
  selectArea(x, y, add) {
    if (CirSim.editDialog != null)
      CirSim.editDialog.closeDialog();
    const x1 = Math.min(x, this.initDragGridX);
    const x2 = Math.max(x, this.initDragGridX);
    const y1 = Math.min(y, this.initDragGridY);
    const y2 = Math.max(y, this.initDragGridY);
    this.selectedArea = new Rectangle(x1, y1, x2 - x1, y2 - y1);
    for (const ce of this.ui.elmList) {
      ce.selectRect(this.selectedArea, add);
    }
    this.enableDisableMenuItems();
  }
  enableDisableMenuItems() {
    let canFlipX = true;
    let canFlipY = true;
    let canFlipXY = true;
    const selCount = this.sim.commands.countSelected();
    for (const elm of this.ui.elmList) {
      if (elm.isSelected() || selCount === 0) {
        if (!elm.canFlipX()) canFlipX = false;
        if (!elm.canFlipY()) canFlipY = false;
        if (!elm.canFlipXY()) canFlipXY = false;
      }
    }
    this.sim.menus.cutItem.setEnabled(selCount > 0);
    this.sim.menus.copyItem.setEnabled(selCount > 0);
    this.sim.menus.rotateCCWItem.setEnabled(canFlipXY && canFlipY);
    this.sim.menus.rotateCWItem.setEnabled(canFlipXY && canFlipY);
    this.sim.menus.mirrorXItem.setEnabled(canFlipX);
    this.sim.menus.mirrorYItem.setEnabled(canFlipY);
  }
  setMouseElm(ce) {
    if (ce !== this.mouseElm) {
      if (this.mouseElm != null)
        this.mouseElm.setMouseElm(false);
      if (ce != null)
        ce.setMouseElm(true);
      this.mouseElm = ce;
      for (let i = 0; i < this.sim.adjustables.length; i++)
        this.sim.adjustables[i].setMouseElm(ce);
    }
    if (ce != null && ce.isRemovableWire() && this.sim.sim.nodeList != null && this.netHighlightKeyHeld) {
      this.highlightedNode = ce.getNode(0);
    } else {
      this.highlightedNode = null;
    }
  }
  getMouseElm() {
    return this.mouseElm;
  }
  updateNetHighlight() {
    const ce = this.mouseElm;
    if (ce != null && ce.isRemovableWire() && this.netHighlightKeyHeld) {
      if (this.sim.sim.needsStamp) {
        try {
          this.sim.sim.preStampAndStampCircuit();
        } catch (e) {
          this.sim.sim.stop("Exception in stampCircuit()", null);
        }
      }
      if (this.sim.sim.nodeList != null)
        this.highlightedNode = ce.getNode(0);
    } else {
      this.highlightedNode = null;
    }
  }
  removeZeroLengthElements() {
    for (let i = this.ui.elmList.length - 1; i >= 0; i--) {
      const ce = this.ui.elmList[i];
      if (ce.x === ce.x2 && ce.y === ce.y2) {
        this.ui.elmList.splice(i, 1);
        ce.delete();
      }
    }
    this.sim.needAnalyze();
  }
  mouseIsOverSplitter(x, y) {
    if (this.sim.scopeManager.scopeCount === 0)
      return false;
    const isOverSplitter = x >= 0 && x < this.sim.circuitArea.width && y >= this.sim.circuitArea.height - 5 && y < this.sim.circuitArea.height;
    if (isOverSplitter !== this.mouseWasOverSplitter) {
      if (isOverSplitter)
        this.sim.setCursorStyle("cursorSplitter");
      else
        this.sim.setMouseMode(this.mouseMode);
    }
    this.mouseWasOverSplitter = isOverSplitter;
    return isOverSplitter;
  }
  onMouseMove(e) {
    e.preventDefault();
    if (this.isToolbarDragPending())
      return;
    const canvas = this.ui.cv;
    this.mouseCursorX = this.getCanvasX(canvas, e.clientX);
    this.mouseCursorY = this.getCanvasY(canvas, e.clientY);
    if (this.mouseDragging) {
      this.mouseDragged(e);
      return;
    }
    this.mouseSelect(e);
    this.sim.scopeManager.scopeMenuSelected = -1;
  }
  // convert screen coordinates to grid coordinates by inverting circuit transform
  inverseTransformX(x) {
    return Math.floor((x - this.sim.transform[4]) / this.sim.transform[0]);
  }
  inverseTransformY(y) {
    return Math.floor((y - this.sim.transform[5]) / this.sim.transform[3]);
  }
  // convert grid coordinates to screen coordinates
  transformX(x) {
    return Math.floor(x * this.sim.transform[0] + this.sim.transform[4]);
  }
  transformY(y) {
    return Math.floor(y * this.sim.transform[3] + this.sim.transform[5]);
  }
  // need to break this out into a separate routine to handle selection,
  // since we don't get mouse move events on mobile
  mouseSelect(e) {
    let newMouseElm = null;
    const canvas = this.ui.cv;
    const sx = this.getCanvasX(canvas, e.clientX);
    const sy = this.getCanvasY(canvas, e.clientY);
    this.mouseCursorX = sx;
    this.mouseCursorY = sy;
    const gx = this.inverseTransformX(sx);
    const gy = this.inverseTransformY(sy);
    this.dragGridX = this.snapGrid(gx);
    this.dragGridY = this.snapGrid(gy);
    this.dragScreenX = sx;
    this.dragScreenY = sy;
    this.draggingPost = -1;
    this.mousePost = -1;
    this.scopePlotRoles.clear();
    if (this.mouseIsOverSplitter(sx, sy)) {
      this.setMouseElm(null);
      return;
    }
    if (this.sim.circuitArea.contains(sx, sy)) {
      if (this.mouseElm != null && this.mouseElm.getHandleGrabbedClose(gx, gy, MouseManager.POSTGRABSQ, MouseManager.MINPOSTGRABSIZE) >= 0) {
        newMouseElm = this.mouseElm;
      } else {
        let bestDist = 1e8;
        for (const ce of this.ui.elmList) {
          if (ce.boundingBox.contains(gx, gy)) {
            const dist = ce.getMouseDistance(gx, gy);
            if (dist >= 0 && dist < bestDist) {
              bestDist = dist;
              newMouseElm = ce;
            }
          }
        }
      }
    }
    this.sim.scopeManager.scopeSelected = -1;
    if (newMouseElm == null) {
      for (let i = 0; i < this.sim.scopeManager.scopeCount; i++) {
        const s = this.sim.scopeManager.scopes[i];
        if (s.rect.contains(sx, sy)) {
          newMouseElm = s.getElm();
          s.addScopePlotRoles(this.scopePlotRoles);
          this.sim.scopeManager.scopeSelected = i;
        }
      }
      for (const ce of this.ui.elmList) {
        if (this.mouseMode === MouseManager.MODE_DRAG_POST) {
          if (ce.getHandleGrabbedClose(gx, gy, MouseManager.POSTGRABSQ, 0) > 0) {
            newMouseElm = ce;
            break;
          }
        }
        const jn = ce.getPostCount();
        for (let j = 0; j < jn; j++) {
          const pt = ce.getPost(j);
          if (Graphics.distanceSq(pt.x, pt.y, gx, gy) < 26) {
            newMouseElm = ce;
            this.mousePost = j;
            break;
          }
        }
      }
    } else {
      this.mousePost = -1;
      for (let i = 0; i < newMouseElm.getPostCount(); i++) {
        const pt = newMouseElm.getPost(i);
        if (Graphics.distanceSq(pt.x, pt.y, gx, gy) < 26)
          this.mousePost = i;
      }
    }
    this.sim.repaint();
    this.netHighlightKeyHeld = e.shiftKey;
    this.setMouseElm(newMouseElm);
  }
  onContextMenu(e) {
    e.preventDefault();
    if (!this.sim.modalDialogIsShowing()) {
      this.menuClientX = e.clientX;
      this.menuClientY = e.clientY;
      this.doPopupMenu();
    }
  }
  // show a context menu popup, clamping to canvas bounds and repositioning submenus
  showContextPanel(x, y) {
    this.watchSubmenus(true);
    const panel = this.ui.contextPanel;
    panel.style.left = x + "px";
    panel.style.top = y + "px";
    panel.style.display = "block";
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;
    const clampedX = Math.max(0, Math.min(x, this.ui.canvasWidth - w));
    const clampedY = Math.max(0, Math.min(y, this.ui.canvasHeight - h));
    if (clampedX !== x || clampedY !== y) {
      panel.style.left = clampedX + "px";
      panel.style.top = clampedY + "px";
    }
  }
  // watch for submenu popups and reposition them if they extend below the viewport
  watchSubmenus(watch) {
    if (watch) {
      const vh = window.innerHeight;
      const clamp = (el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom > vh) {
          const newTop = Math.max(0, vh - rect.height);
          el.style.top = newTop + "px";
        }
      };
      window.__circuitSubmenuObserver = new MutationObserver(() => {
        const popups = document.querySelectorAll(".elmContextMenu");
        popups.forEach(clamp);
      });
      window.__circuitSubmenuObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style"]
      });
    } else {
      if (window.__circuitSubmenuObserver) {
        window.__circuitSubmenuObserver.disconnect();
        window.__circuitSubmenuObserver = null;
      }
    }
  }
  doPopupMenu() {
    if (this.ui.isReadOnly() || this.sim.modalDialogIsShowing())
      return;
    this.menuElm = this.mouseElm;
    this.sim.scopeManager.menuScope = -1;
    this.sim.scopeManager.menuPlot = -1;
    if (this.sim.scopeManager.scopeSelected !== -1) {
      if (this.sim.scopeManager.scopes[this.sim.scopeManager.scopeSelected].canMenu()) {
        this.sim.scopeManager.menuScope = this.sim.scopeManager.scopeSelected;
        this.sim.scopeManager.menuPlot = this.sim.scopeManager.scopes[this.sim.scopeManager.scopeSelected].selectedPlot;
        this.sim.scopeManager.scopePopupMenu.doScopePopupChecks(
          false,
          this.sim.scopeManager.canStackScope(this.sim.scopeManager.scopeSelected),
          this.sim.scopeManager.canCombineScope(this.sim.scopeManager.scopeSelected),
          this.sim.scopeManager.canUnstackScope(this.sim.scopeManager.scopeSelected),
          this.sim.scopeManager.scopes[this.sim.scopeManager.scopeSelected]
        );
        this.ui.showContextPanel(this.sim.scopeManager.scopePopupMenu.getMenuBar(), this.menuClientX, this.menuClientY);
      }
    } else if (this.mouseElm != null) {
      if (!this.mouseElm.isScopeElm()) {
        this.sim.menus.elmScopeMenuItem.setEnabled(this.mouseElm.canViewInScope());
        this.sim.menus.elmFloatScopeMenuItem.setEnabled(this.mouseElm.canViewInScope());
        if (this.sim.scopeManager.scopeCount + this.sim.scopeManager.countScopeElms() <= 1) {
          this.sim.menus.elmAddScopeMenuItem.setCommand({ execute: () => this.sim.commands.menuPerformed("elm", "addToScope0") });
          this.sim.menus.elmAddScopeMenuItem.setSubMenu(null);
          this.sim.menus.elmAddScopeMenuItem.setEnabled(
            this.mouseElm.canViewInScope() && this.sim.scopeManager.scopeCount + this.sim.scopeManager.countScopeElms() > 0
          );
        } else {
          this.sim.scopeManager.composeSelectScopeMenu(this.sim.scopeManager.selectScopeMenuBar);
          this.sim.menus.elmAddScopeMenuItem.setCommand(null);
          this.sim.menus.elmAddScopeMenuItem.setSubMenu(this.sim.scopeManager.selectScopeMenuBar);
          this.sim.menus.elmAddScopeMenuItem.setEnabled(this.mouseElm.canViewInScope());
        }
        this.sim.menus.elmEditMenuItem.setEnabled(this.mouseElm.getEditInfo(0) != null);
        this.sim.menus.elmSplitMenuItem.setEnabled(this.mouseElm.isWireElm());
        this.sim.menus.elmSliderMenuItem.setEnabled(this.sliderItemEnabled(this.mouseElm));
        let canFlipX = this.mouseElm.canFlipX();
        let canFlipY = this.mouseElm.canFlipY();
        let canFlipXY = this.mouseElm.canFlipXY();
        for (const elm of this.ui.elmList) {
          if (elm.isSelected()) {
            if (!elm.canFlipX()) canFlipX = false;
            if (!elm.canFlipY()) canFlipY = false;
            if (!elm.canFlipXY()) canFlipXY = false;
          }
        }
        this.sim.menus.elmRotateCCWMenuItem.setEnabled(canFlipXY && canFlipY);
        this.sim.menus.elmRotateCWMenuItem.setEnabled(canFlipXY && canFlipY);
        this.sim.menus.elmMirrorXMenuItem.setEnabled(canFlipX);
        this.sim.menus.elmMirrorYMenuItem.setEnabled(canFlipY);
        this.ui.showContextPanel(this.sim.menus.elmMenuBar, this.menuClientX, this.menuClientY);
      } else {
        const s = this.mouseElm;
        if (s.elmScope.canMenu()) {
          this.sim.scopeManager.menuPlot = s.elmScope.selectedPlot;
          this.sim.scopeManager.scopePopupMenu.doScopePopupChecks(true, false, false, false, s.elmScope);
          this.ui.showContextPanel(this.sim.scopeManager.scopePopupMenu.getMenuBar(), this.menuClientX, this.menuClientY);
        }
      }
    } else {
      this.doMainMenuChecks();
      this.ui.showContextPanel(this.sim.menus.mainMenuBar, this.menuClientX, this.menuClientY);
    }
  }
  // check if the user can create sliders for this element
  sliderItemEnabled(elm) {
    if (elm.isVarRailElm() || elm.isPotElm())
      return false;
    for (let i = 0; ; i++) {
      const ei = elm.getEditInfo(i);
      if (ei == null)
        return false;
      if (ei.canCreateAdjustable())
        return true;
    }
  }
  onClick(e) {
    e.preventDefault();
    if (e.button === 1)
      this.scrollValues(e.clientX, e.clientY, 0);
  }
  onDoubleClick(e) {
    e.preventDefault();
    if (this.mouseElm == null || this.sim.scopeManager.scopeSelected !== -1)
      return;
    if (this.mouseElm.isSubcircuitElm()) {
      this.mouseElm.onDoubleClick();
      return;
    }
    if (!this.mouseElm.isSwitchElm() && !this.ui.isReadOnly())
      this.sim.commands.doEdit(this.mouseElm);
  }
  onMouseOut(e) {
    this.mouseCursorX = -1;
    if (this.mouseDragging)
      this.endDrag();
  }
  clearMouseElm() {
    this.sim.scopeManager.scopeSelected = -1;
    this.setMouseElm(null);
    this.scopePlotRoles.clear();
  }
  onMouseDown(e) {
    e.preventDefault();
    if (this.ui.cv && this.ui.cv.focus) this.ui.cv.focus();
    this.sim.stopElm = null;
    const canvas = this.ui.cv;
    const ex = this.getCanvasX(canvas, e.clientX);
    const ey = this.getCanvasY(canvas, e.clientY);
    this.menuX = this.menuClientX = ex;
    this.menuY = this.menuClientY = ey;
    this.mouseDownTime = Date.now();
    this.mouseDownScreenX = ex;
    this.mouseDownScreenY = ey;
    this.sim.commands.enablePaste();
    if (e.button !== 0 && e.button !== 1)
      return;
    this.mouseSelect(e);
    this.mouseDragging = true;
    this.didSwitch = false;
    if (this.mouseWasOverSplitter) {
      this.tempMouseMode = MouseManager.MODE_DRAG_SPLITTER;
      return;
    }
    if (e.button === 0) {
      this.tempMouseMode = this.mouseMode;
      if (e.altKey && e.metaKey)
        this.tempMouseMode = MouseManager.MODE_DRAG_COLUMN;
      else if (e.altKey && e.shiftKey)
        this.tempMouseMode = MouseManager.MODE_DRAG_ROW;
      else if (e.shiftKey)
        this.tempMouseMode = MouseManager.MODE_SELECT;
      else if (e.altKey)
        this.tempMouseMode = MouseManager.MODE_DRAG_ALL;
      else if (e.ctrlKey || e.metaKey)
        this.tempMouseMode = MouseManager.MODE_DRAG_POST;
    } else {
      this.tempMouseMode = MouseManager.MODE_DRAG_ALL;
    }
    if (this.ui.isReadOnly() && this.tempMouseMode !== MouseManager.MODE_DRAG_ALL)
      this.tempMouseMode = MouseManager.MODE_SELECT;
    if (!this.sim.modalDialogIsShowing() && (this.sim.scopeManager.scopeSelected !== -1 && this.sim.scopeManager.scopes[this.sim.scopeManager.scopeSelected].cursorInSettingsWheel() || this.sim.scopeManager.scopeSelected === -1 && this.mouseElm != null && this.mouseElm.isScopeElm() && this.mouseElm.elmScope.cursorInSettingsWheel())) {
      if (this.ui.isReadOnly()) return;
      const s = this.sim.scopeManager.scopeSelected !== -1 ? this.sim.scopeManager.scopes[this.sim.scopeManager.scopeSelected] : this.mouseElm.elmScope;
      s.showProperties();
      this.clearSelection();
      this.mouseDragging = false;
      return;
    }
    if (!this.sim.modalDialogIsShowing()) {
      for (let i = 0; i < this.sim.scopeManager.scopeCount; i++)
        this.sim.scopeManager.scopes[i].mousePressed(ex, ey);
      if (this.sim.scopeElmArr != null) {
        for (let i = 0; i < this.sim.scopeElmArr.length; i++)
          this.sim.scopeElmArr[i].elmScope.mousePressed(ex, ey);
      }
    }
    if (!this.sim.modalDialogIsShowing() && Scope.cursorScope != null && (e.button === 1 || e.button === 0 && e.altKey) && Scope.cursorScope.startDragPlotY(ex, ey))
      return;
    const gx = this.inverseTransformX(ex);
    const gy = this.inverseTransformY(ey);
    if (this.doSwitch(gx, gy)) {
      this.didSwitch = true;
      return;
    }
    if (this.tempMouseMode === MouseManager.MODE_SELECT && this.mouseElm != null && !this.ui.isReadOnly() && this.mouseElm.getHandleGrabbedClose(gx, gy, MouseManager.POSTGRABSQ, MouseManager.MINPOSTGRABSIZE) >= 0 && !this.anySelectedButMouse())
      this.tempMouseMode = MouseManager.MODE_DRAG_POST;
    if (this.tempMouseMode !== MouseManager.MODE_SELECT && this.tempMouseMode !== MouseManager.MODE_DRAG_SELECTED)
      this.clearSelection();
    this.sim.undoManager?.pushUndo();
    this.initDragGridX = gx;
    this.initDragGridY = gy;
    this.dragging = true;
    if (this.tempMouseMode === MouseManager.MODE_DRAG_ROW || this.tempMouseMode === MouseManager.MODE_DRAG_COLUMN) {
      this.dragRowColElms = [];
      this.dragRowColPosts = [];
      const sgx = this.snapGrid(gx);
      const sgy = this.snapGrid(gy);
      for (const ce of this.ui.elmList) {
        if (this.tempMouseMode === MouseManager.MODE_DRAG_ROW) {
          if (ce.y === sgy) {
            this.dragRowColElms.push(ce);
            this.dragRowColPosts.push(0);
          }
          if (ce.y2 === sgy) {
            this.dragRowColElms.push(ce);
            this.dragRowColPosts.push(1);
          }
        } else {
          if (ce.x === sgx) {
            this.dragRowColElms.push(ce);
            this.dragRowColPosts.push(0);
          }
          if (ce.x2 === sgx) {
            this.dragRowColElms.push(ce);
            this.dragRowColPosts.push(1);
          }
        }
      }
    }
    if (this.tempMouseMode !== MouseManager.MODE_ADD_ELM)
      return;
    const x0 = this.snapGrid(gx);
    const y0 = this.snapGrid(gy);
    if (!this.sim.circuitArea.contains(ex, ey))
      return;
    try {
      this.dragElm = this.sim.constructElement(this.ui.mouseModeStr, x0, y0);
    } catch (ex2) {
      CirSim.debugger();
    }
    this.sim.updateToolbar();
  }
  // check/uncheck/enable/disable menu items as appropriate when menu bar clicked on, or when
  // right mouse menu accessed.  also displays shortcuts as a side effect
  doMainMenuChecks() {
    const c = this.ui.mainMenuItems.length;
    for (let i = 0; i < c; i++) {
      const s = this.ui.mainMenuItemNames[i];
      this.ui.mainMenuItems[i].setState(s === this.ui.mouseModeStr);
    }
    this.sim.menus.stackAllItem.setEnabled(this.sim.scopeManager.scopeCount > 1 && this.sim.scopeManager.scopes[this.sim.scopeManager.scopeCount - 1].position > 0);
    this.sim.menus.unstackAllItem.setEnabled(this.sim.scopeManager.scopeCount > 1 && this.sim.scopeManager.scopes[this.sim.scopeManager.scopeCount - 1].position !== this.sim.scopeManager.scopeCount - 1);
    this.sim.menus.combineAllItem.setEnabled(this.sim.scopeManager.scopeCount > 1);
    this.sim.menus.separateAllItem.setEnabled(this.sim.scopeManager.scopeCount > 0);
    if (MouseManager.lastSubcircuitMenuUpdate !== SubcircuitModel.sequenceNumber)
      this.sim.composeSubcircuitMenu();
  }
  onMouseUp(e) {
    e.preventDefault();
    if (this.isToolbarDragPending())
      return;
    if (this.tempMouseMode === MouseManager.MODE_SELECT && this.selectedArea == null && e.button === 0)
      this.clearSelection();
    if (this.tempMouseMode === MouseManager.MODE_DRAG_POST && this.draggingPost === -1)
      this.doSplit(this.mouseElm);
    const wasPlainClick = e.button === 0 && !this.didSwitch && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey;
    let clickedElm = null;
    let clickedEmpty = false;
    if (wasPlainClick) {
      const dx = this.mouseCursorX - this.mouseDownScreenX;
      const dy = this.mouseCursorY - this.mouseDownScreenY;
      if (dx * dx + dy * dy < 16 && this.sim.scopeManager.scopeSelected === -1) {
        if (this.mouseElm != null && !this.mouseElm.isSwitchElm())
          clickedElm = this.mouseElm;
        else if (this.mouseElm == null)
          clickedEmpty = true;
      }
    }
    const createdElm = this.endDrag();
    if (createdElm != null) {
      if (createdElm.showPropertiesOnCreate() && !this.ui.isReadOnly())
        this.sim.commands.doEdit(createdElm, false);
    } else if (clickedElm != null && !e.fromTouch && this.sim.menus.showPropsOnClickCheckItem.getState() && !this.ui.isReadOnly()) {
      this.sim.commands.doEdit(clickedElm);
    } else if (clickedEmpty && CirSim.editDialog != null) {
      CirSim.editDialog.closeDialog();
    }
  }
  // common cleanup for ending a drag, whether via mouseup or the mouse leaving the canvas.
  // returns the element that was just created (added to elmList), if any.
  endDrag() {
    this.mouseDragging = false;
    Scope.dragStartTime = -1;
    Scope.endDragPlotY();
    this.tempMouseMode = this.mouseMode;
    this.selectedArea = null;
    this.dragging = false;
    let circuitChanged = false;
    if (this.draggingPost >= 0 && this.mouseElm != null) {
      const p = this.mouseElm.getPost(this.draggingPost);
      if (p != null && this.splitAt(p.x, p.y))
        circuitChanged = true;
    }
    if (this.heldSwitchElm != null) {
      this.heldSwitchElm.mouseUp();
      this.heldSwitchElm = null;
      circuitChanged = true;
    }
    let createdElm = null;
    if (this.dragElm != null) {
      if (this.dragElm.creationFailed()) {
        this.dragElm.delete();
        if (this.mouseMode === MouseManager.MODE_SELECT || this.mouseMode === MouseManager.MODE_DRAG_SELECTED)
          this.clearSelection();
        this.ui.toolbar.setModeLabel(Locale.LS("Press and hold mouse to create circuit element"));
        this.dragElm = null;
      } else {
        this.splitAt(this.dragElm.x, this.dragElm.y);
        this.splitAt(this.dragElm.x2, this.dragElm.y2);
        this.ui.elmList.push(this.dragElm);
        this.dragElm.draggingDone();
        circuitChanged = true;
        this.sim.undoManager?.writeRecoveryToStorage();
        this.sim.unsavedChanges = true;
        createdElm = this.dragElm;
        this.dragElm = null;
        this.sim.updateToolbar();
      }
    }
    if (circuitChanged) {
      this.sim.needAnalyze();
      this.sim.undoManager?.pushUndo();
    }
    if (this.dragElm != null)
      this.dragElm.delete();
    this.dragElm = null;
    this.sim.repaint();
    return createdElm;
  }
  onMouseWheel(e) {
    e.preventDefault();
    let zoomOnly = Date.now() < this.zoomTime + 1e3;
    if (this.ui.isReadOnly() || !this.sim.menus.mouseWheelEditCheckItem.getState())
      zoomOnly = true;
    if (!zoomOnly)
      this.scrollValues(e.clientX, e.clientY, ScrollValuePopup.normalizeWheelDelta(e));
    if (this.mouseElm != null && this.mouseElm.onMouseWheel && !zoomOnly)
      this.mouseElm.onMouseWheel(e);
    else if (this.sim.scopeManager.scopeSelected !== -1)
      this.sim.scopeManager.scopes[this.sim.scopeManager.scopeSelected].onMouseWheel(e);
    else if (!this.sim.modalDialogIsShowing()) {
      const canvas = this.ui.cv;
      this.mouseCursorX = this.getCanvasX(canvas, e.clientX);
      this.mouseCursorY = this.getCanvasY(canvas, e.clientY);
      this.zoomCircuit(-ScrollValuePopup.normalizeWheelDelta(e) * this.wheelSensitivity, false);
      this.zoomTime = Date.now();
    }
    this.sim.repaint();
  }
  zoomCircuit(dy, fromKeyboard = false) {
    const oldScale = this.sim.transform[0];
    const val = dy * 0.01;
    let newScale = Math.max(oldScale + val, 0.2);
    newScale = Math.min(newScale, 2.5);
    if (newScale === oldScale) return;
    this.setCircuitScale(newScale, fromKeyboard);
  }
  setCircuitScale(newScale, fromKeyboard = false) {
    const constX = !fromKeyboard ? this.mouseCursorX : this.sim.circuitArea.width / 2;
    const constY = !fromKeyboard ? this.mouseCursorY : this.sim.circuitArea.height / 2;
    const cx = this.inverseTransformX(constX);
    const cy = this.inverseTransformY(constY);
    this.sim.transform[0] = this.sim.transform[3] = newScale;
    this.sim.transform[4] = constX - cx * newScale;
    this.sim.transform[5] = constY - cy * newScale;
  }
  scrollValues(x, y, deltay) {
    if (this.mouseElm != null && !this.sim.modalDialogIsShowing() && this.sim.scopeManager.scopeSelected === -1) {
      if (this.mouseElm.isResistorElm() || this.mouseElm.isCapacitorElm() || this.mouseElm.isInductorElm()) {
        CirSim.scrollValuePopup = new ScrollValuePopup(x, y, deltay, this.mouseElm, this.sim);
      }
    }
  }
  doMainMenuChecksFromMenuBar() {
    this.doMainMenuChecks();
  }
  clearSelection() {
    for (const ce of this.ui.elmList) {
      ce.setSelected(false);
    }
    this.enableDisableMenuItems();
  }
  doSelectAll() {
    for (const ce of this.ui.elmList) {
      ce.setSelected(true);
    }
    this.enableDisableMenuItems();
  }
  anySelectedButMouse() {
    for (const ce of this.ui.elmList) {
      if (ce !== this.mouseElm && ce.selected)
        return true;
    }
    return false;
  }
}

class ElementFactory {
  static classMap = /* @__PURE__ */ new Map();
  // Register a class so create() can find it by name
  static registerClass(name, ctor) {
    ElementFactory.classMap.set(name, ctor);
  }
  static create(name, x1, y1, x2, y2, f, st) {
    const ctor = ElementFactory.classMap.get(name);
    if (ctor == null) return null;
    if (x2 === void 0)
      return new ctor(x1, y1);
    return new ctor(x1, y1, x2, y2, f, st);
  }
  static hasClass(name) {
    return ElementFactory.classMap.has(name);
  }
}

class Dialog {
  closeOnEnter = true;
  // dialog that was showing when this one was opened on top of it
  parentDialog = null;
  dialogEl;
  constructor() {
    this.dialogEl = document.createElement("dialog");
    this.dialogEl.classList.add("circuitDialog");
    document.body.appendChild(this.dialogEl);
    this.dialogEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.enterPressed();
      if (e.key === "Escape") {
        e.preventDefault();
        this.closeDialog();
      }
    });
    this.setupDragging();
  }
  // Dialogs were draggable in the GWT version (DialogBox dragged by its caption).
  // Native <dialog> elements aren't, so implement dragging here: pressing anywhere
  // on the dialog that isn't an interactive control starts a drag.
  dlgDragging = false;
  dlgDragStartX = 0;
  dlgDragStartY = 0;
  dragOrigLeft = 0;
  dragOrigTop = 0;
  dragPointerId = -1;
  // labels wrapping/targeting an input are included so clicking a checkbox
  // label toggles it (pointer capture would otherwise retarget the click to the dialog)
  static NO_DRAG_SELECTOR = "input, button, select, textarea, a, option, canvas, label:has(input), label[for], [contenteditable]";
  setupDragging() {
    this.dialogEl.addEventListener("pointerdown", (e) => {
      if (e.button !== 0)
        return;
      const target = e.target;
      if (!target || target.closest(Dialog.NO_DRAG_SELECTOR))
        return;
      const r = this.dialogEl.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        return;
      this.dlgDragStartX = e.clientX;
      this.dlgDragStartY = e.clientY;
      this.dragOrigLeft = r.left;
      this.dragOrigTop = r.top;
      this.dragPointerId = e.pointerId;
      this.dlgDragging = false;
      this.dialogEl.setPointerCapture(e.pointerId);
    });
    this.dialogEl.addEventListener("pointermove", (e) => {
      if (this.dragPointerId !== e.pointerId)
        return;
      const dx = e.clientX - this.dlgDragStartX;
      const dy = e.clientY - this.dlgDragStartY;
      if (!this.dlgDragging) {
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3)
          return;
        this.dlgDragging = true;
        const r = this.dialogEl.getBoundingClientRect();
        this.dialogEl.style.margin = "0";
        this.dialogEl.style.position = "fixed";
        this.dialogEl.style.left = r.left + "px";
        this.dialogEl.style.top = r.top + "px";
        this.dragOrigLeft = r.left;
        this.dragOrigTop = r.top;
        const sel = window.getSelection();
        if (sel) sel.removeAllRanges();
      }
      e.preventDefault();
      this.moveTo(this.dragOrigLeft + dx, this.dragOrigTop + dy);
    });
    const endDrag = (e) => {
      if (this.dragPointerId !== e.pointerId)
        return;
      if (this.dialogEl.hasPointerCapture(e.pointerId))
        this.dialogEl.releasePointerCapture(e.pointerId);
      this.dragPointerId = -1;
      this.dlgDragging = false;
    };
    this.dialogEl.addEventListener("pointerup", endDrag);
    this.dialogEl.addEventListener("pointercancel", endDrag);
  }
  // move the dialog to the given viewport position, keeping it on screen
  moveTo(x, y) {
    const w = this.dialogEl.offsetWidth;
    const margin = 20;
    x = Math.max(margin - w, Math.min(x, window.innerWidth - margin));
    y = Math.max(0, Math.min(y, window.innerHeight - margin));
    this.dialogEl.style.left = x + "px";
    this.dialogEl.style.top = y + "px";
  }
  isShowing() {
    return this.dialogEl.open;
  }
  show() {
    this.dialogEl.showModal();
    if (CirSim.dialogShowing !== this)
      this.parentDialog = CirSim.dialogShowing;
    CirSim.dialogShowing = this;
  }
  setVisible(visible) {
    if (visible) this.show();
    else this.closeDialog();
  }
  closeDialog() {
    if (this.dialogEl.open)
      this.dialogEl.close();
    if (CirSim.dialogShowing === this) {
      const p = this.parentDialog;
      CirSim.dialogShowing = p && p.isShowing() ? p : null;
    }
    document.body.removeChild(this.dialogEl);
  }
  enterPressed() {
    if (this.closeOnEnter && this.apply())
      this.closeDialog();
  }
  apply() {
    return true;
  }
}

class ExportAsLocalFileDialog extends Dialog {
  static lastFileName = null;
  textBox;
  blobUrl;
  // if false, this isn't a circuit file, so don't remember its name for future circuit saves
  rememberName;
  static downloadIsSupported() {
    return "download" in document.createElement("a");
  }
  static getBlobUrl(data) {
    const oldBlob = document.exportBlob;
    if (oldBlob)
      URL.revokeObjectURL(oldBlob);
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    document.exportBlob = url;
    return url;
  }
  static setLastFileName(s) {
    if (s == null || s.startsWith("circuitjs-"))
      ExportAsLocalFileDialog.lastFileName = null;
    else
      ExportAsLocalFileDialog.lastFileName = s;
  }
  // fileName/title are given when exporting something other than the circuit (e.g. subcircuits)
  constructor(data, fileName = null, title = "Export as Local File") {
    super();
    this.rememberName = fileName == null;
    this.dialogEl.innerHTML = "";
    const titleEl = document.createElement("h3");
    titleEl.textContent = Locale.LS(title);
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
    this.blobUrl = ExportAsLocalFileDialog.getBlobUrl(data);
    let fname;
    if (fileName != null) {
      fname = fileName;
    } else if (ExportAsLocalFileDialog.lastFileName != null) {
      fname = ExportAsLocalFileDialog.lastFileName;
    } else {
      const now = /* @__PURE__ */ new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const ts = now.getFullYear().toString() + pad(now.getMonth() + 1) + pad(now.getDate()) + "-" + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
      fname = "circuitjs-" + ts + ".txt";
    }
    tb.value = fname;
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
      fname += ".txt";
    if (this.rememberName)
      ExportAsLocalFileDialog.setLastFileName(fname);
    const a = document.createElement("a");
    a.href = this.blobUrl;
    a.setAttribute("download", fname);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  }
}

class UndoItem {
  dump;
  scale;
  transform4;
  transform5;
  constructor(sim, dump) {
    this.dump = dump;
    this.scale = sim.transform[0];
    this.transform4 = sim.transform[4];
    this.transform5 = sim.transform[5];
  }
}
class UndoManager {
  sim;
  undoStack;
  redoStack;
  constructor(sim) {
    this.sim = sim;
    this.undoStack = [];
    this.redoStack = [];
  }
  // the dump without the sidebar slider settings (simulation speed, current speed, power
  // brightness), which are saved in the root element
  static withoutSliders(dump) {
    const end = dump.indexOf(">");
    if (end < 0)
      return dump;
    return dump.substring(0, end).replace(/ (ic|cb|pb)="[^"]*"/g, "") + dump.substring(end);
  }
  pushUndo() {
    this.redoStack.length = 0;
    const s = this.sim.dumpCircuit();
    if (this.undoStack.length > 0 && UndoManager.withoutSliders(s) === UndoManager.withoutSliders(this.undoStack[this.undoStack.length - 1].dump))
      return;
    this.undoStack.push(new UndoItem(this.sim, s));
    this.enableUndoRedo();
    this.sim.savedFlag = false;
    this.sim.unsavedChanges = true;
  }
  doUndo() {
    if (this.undoStack.length === 0)
      return;
    this.redoStack.push(new UndoItem(this.sim, this.sim.dumpCircuit()));
    const ui = this.undoStack.pop();
    this.loadUndoItem(ui);
    this.enableUndoRedo();
  }
  doRedo() {
    if (this.redoStack.length === 0)
      return;
    this.undoStack.push(new UndoItem(this.sim, this.sim.dumpCircuit()));
    const ui = this.redoStack.pop();
    this.loadUndoItem(ui);
    this.enableUndoRedo();
  }
  loadUndoItem(ui) {
    this.sim.loader.readCircuit(ui.dump, CircuitLoader.RC_NO_CENTER);
    this.sim.transform[0] = this.sim.transform[3] = ui.scale;
    this.sim.transform[4] = ui.transform4;
    this.sim.transform[5] = ui.transform5;
  }
  doRecover() {
    this.pushUndo();
    this.sim.loader.readCircuit(this.sim.recovery);
    this.sim.allowSave(false);
    this.sim.menus.recoverItem.setEnabled(false);
    this.sim.unsavedChanges = false;
  }
  enableUndoRedo() {
    this.sim.menus.redoItem.setEnabled(this.redoStack.length > 0);
    this.sim.menus.undoItem.setEnabled(this.undoStack.length > 0);
  }
  writeRecoveryToStorage() {
    CirSim.console("write recovery");
    const stor = window.localStorage;
    if (stor == null)
      return;
    const s = this.sim.dumpCircuit();
    stor.setItem("circuitRecovery", s);
  }
  readRecovery() {
    const stor = window.localStorage;
    if (stor == null)
      return;
    this.sim.recovery = stor.getItem("circuitRecovery");
  }
}

class CirSimTimer {
  app;
  intervalId = null;
  constructor(app) {
    this.app = app;
  }
  scheduleRepeating(ms) {
    if (this.intervalId != null)
      clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      try {
        this.app.ui?.updateCircuit();
      } catch (e) {
        CirSim.debugger();
        CirSim.console("exception in updateCircuit " + e);
        console.error(e);
        this.app.consoleExceptionOccurred = true;
      }
      if (this.app.consoleExceptionOccurred)
        this.app.ui?.drawExceptionIndicator();
    }, ms);
  }
  cancel() {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
class CirSim {
  static pi = 3.141592653589793;
  static infoWidth = 160;
  static HINT_LC = 1;
  static HINT_RC = 2;
  static HINT_3DB_C = 3;
  static HINT_TWINT = 4;
  static HINT_3DB_L = 5;
  static theApp;
  elmList = [];
  // CircuitElm[]
  postDrawList = [];
  // Point[]
  badConnectionList = [];
  // Point[]
  adjustables = [];
  // Adjustable[]
  // saved context stack for editing subcircuit models
  contextStack = [];
  menus;
  mouse;
  ui = null;
  // UIManager — set during UIManager.init()
  sim = null;
  // SimulationManager
  undoManager = null;
  imageExporter = null;
  commands = null;
  // CommandManager
  scopeManager = null;
  loader = null;
  // CircuitLoader
  jsInterface = null;
  analyzeFlag = false;
  savedFlag = false;
  simRunning = true;
  // read directly by UIManager/SimulationManager
  dumpMatrix = false;
  dcAnalysisFlag = false;
  autoDCOnReset = false;
  // set by edits (pushUndo() and so on), even ones that change nothing, like a click;
  // isModified() checks whether the circuit really changed.  Clearing it (after a load
  // or save) takes a new savedDump after the next frame, once scopes are set up.
  unsavedChangesFlag = false;
  get unsavedChanges() {
    return this.unsavedChangesFlag;
  }
  set unsavedChanges(b) {
    this.unsavedChangesFlag = b;
    if (!b)
      this.savedDumpPending = true;
  }
  savedDump = null;
  // the circuit (without state) as of the last load or save
  savedDumpPending = true;
  shown = false;
  developerMode = false;
  showResistanceInVoltageSources = false;
  hintType = -1;
  hintItem1 = 0;
  hintItem2 = 0;
  stopMessage = null;
  consoleExceptionOccurred = false;
  stopElm = null;
  scopeElmArr = null;
  minFrameRate = 20;
  recovery = null;
  startCircuit = null;
  startLabel = null;
  startCircuitText = null;
  startCircuitLink = null;
  // circuit layout
  transform = [0, 0, 0, 0, 0, 0];
  // [scaleX, 0, 0, scaleY, transX, transY]
  circuitArea = new Rectangle(0, 0, 800, 600);
  gridSize = 16;
  gridMask = -16;
  gridRound = 7;
  shortcuts = /* @__PURE__ */ new Map();
  // format is "cmd:<menu>:<item>"
  static RUNSTOP_SHORTCUT_ACTION = "cmd:key:runstop";
  static COMMAND_PALETTE_SHORTCUT_ACTION = "cmd:key:commandpalette";
  classToLabelMap = /* @__PURE__ */ new Map();
  random = {
    nextInt: () => Math.floor(Math.random() * 2147483647),
    nextDouble: () => Math.random()
  };
  // simulation timer
  FASTTIMER = 16;
  // ms between frames (~60fps)
  timer = new CirSimTimer(this);
  // dialog stubs — set when dialogs open
  static editDialog = null;
  static customLogicEditDialog = null;
  static diodeModelEditDialog = null;
  static relayModelEditDialog = null;
  static mosfetModelEditDialog = null;
  static scrollValuePopup = null;
  static typeScrollPopup = null;
  static dialogShowing = null;
  static aboutBox = null;
  static commandPalette = null;
  // non-null while the command palette popup is open
  static baseTitle = "Circuit Simulator";
  static versionString = "5.0.0ts (alpha)";
  // maps integer dump type code → class name (built by register())
  static dumpTypeMap = /* @__PURE__ */ new Map();
  // maps XML dump type string → class name
  static xmlDumpTypeMap = /* @__PURE__ */ new Map();
  constructor() {
    CirSim.theApp = this;
    this.menus = new Menus();
    this.mouse = new MouseManager(this, null);
  }
  async init() {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width";
    document.head.appendChild(meta);
    let running = true;
    const { SimulationManager } = await __vitePreload(async () => { const { SimulationManager } = await Promise.resolve().then(() => SimulationManager$1);return { SimulationManager }},true              ?void 0:void 0,import.meta.url);
    this.sim = new SimulationManager(this);
    CircuitElm.initClass(this, this.sim);
    const { UIManager } = await __vitePreload(async () => { const { UIManager } = await import('./UIManager-Bxtki72o.js').then(n => n.b);return { UIManager }},true              ?__vite__mapDeps([0,1,2]):void 0,import.meta.url);
    this.ui = new UIManager(this);
    this.undoManager = new UndoManager(this);
    this.undoManager.readRecovery();
    const { ImageExporter } = await __vitePreload(async () => { const { ImageExporter } = await import('./ImageExporter-CQsJHMAl.js');return { ImageExporter }},true              ?[]:void 0,import.meta.url);
    this.imageExporter = new ImageExporter(this);
    const { CommandManager } = await __vitePreload(async () => { const { CommandManager } = await import('./CommandManager-DNG4CaF3.js');return { CommandManager }},true              ?__vite__mapDeps([3,4,0,1,2,5]):void 0,import.meta.url);
    this.commands = new CommandManager(this);
    await __vitePreload(() => import('./Adjustable-BWwy8o9t.js'),true              ?__vite__mapDeps([6,0,1,2]):void 0,import.meta.url);
    await __vitePreload(() => import('./AboutBox-C_O2Ab1e.js'),true              ?[]:void 0,import.meta.url);
    await __vitePreload(() => import('./SliderDialog-DaQovZaP.js'),true              ?__vite__mapDeps([7,5,0,1,2,6]):void 0,import.meta.url);
    await __vitePreload(() => import('./ScopePropertiesDialog-Ca6zTNa4.js'),true              ?__vite__mapDeps([8,5,0,1,2]):void 0,import.meta.url);
    await __vitePreload(() => import('./ShortcutsDialog-BpnJkJG2.js'),true              ?__vite__mapDeps([9,2]):void 0,import.meta.url);
    await __vitePreload(() => import('./SubcircuitDialog-BWJn8xZf.js'),true              ?[]:void 0,import.meta.url);
    await __vitePreload(() => import('./ExportAsUrlDialog-nxSRlfHw.js'),true              ?[]:void 0,import.meta.url);
    await __vitePreload(() => import('./ExportAsImageDialog-BUlXCO0L.js'),true              ?__vite__mapDeps([10,11]):void 0,import.meta.url);
    await __vitePreload(() => import('./ScopeExportImageDialog-B4c1IFbQ.js'),true              ?[]:void 0,import.meta.url);
    await __vitePreload(() => import('./ImportFromDropboxDialog-tiK1fp-v.js'),true              ?[]:void 0,import.meta.url);
    const qp = new QueryParameters();
    let positiveColor = null;
    let negativeColor = null;
    let neutralColor = null;
    let selectColor = null;
    let currentColor = null;
    let mouseModeReq = null;
    try {
      let cct = qp.getValue("cct");
      if (cct != null)
        this.startCircuitText = cct.replace(/%24/g, "$");
      if (this.startCircuitText == null)
        this.startCircuitText = CirSim.getElectronStartCircuitText();
      const ctz = qp.getValue("ctz");
      if (ctz != null)
        this.startCircuitText = this.decompress(ctz);
      this.startCircuit = qp.getValue("startCircuit");
      this.startLabel = qp.getValue("startLabel");
      this.startCircuitLink = qp.getValue("startCircuitLink");
      running = qp.getBooleanValue("running", true);
      positiveColor = qp.getValue("positiveColor");
      negativeColor = qp.getValue("negativeColor");
      neutralColor = qp.getValue("neutralColor");
      selectColor = qp.getValue("selectColor");
      currentColor = qp.getValue("currentColor");
      mouseModeReq = qp.getValue("mouseMode");
    } catch (e) {
    }
    this.transform = [0, 0, 0, 0, 0, 0];
    this.shortcuts = /* @__PURE__ */ new Map();
    this.elmList = [];
    const { registerElements } = await __vitePreload(async () => { const { registerElements } = await import('./registerElements-BeniTXyS.js');return { registerElements }},true              ?__vite__mapDeps([12,5,0,1,2,4]):void 0,import.meta.url);
    registerElements();
    this.ui.init();
    this.adjustables = [];
    this.ui.setColors(positiveColor, negativeColor, neutralColor, selectColor, currentColor);
    this.ui.setWheelSensitivity();
    try {
      HookRegistry.loadSubcircuitModelsFromStorage?.();
    } catch (e) {
      CirSim.console("Exception: " + e);
    }
    const { CircuitLoader } = await __vitePreload(async () => { const { CircuitLoader } = await Promise.resolve().then(() => CircuitLoader$1);return { CircuitLoader }},true              ?void 0:void 0,import.meta.url);
    this.loader = new CircuitLoader(this, this.sim, this.scopeManager, this.menus);
    window.TestManager?.init(this);
    if (window.TestManager?.loadingTestCircuit) {
      this.startCircuitText = this.startCircuit = null;
    } else if (this.startCircuitText != null) {
      this.menus.getSetupList(false);
      this.loader.readCircuit(this.startCircuitText);
      const electronFileName = CirSim.getElectronStartCircuitFileName();
      if (electronFileName != null)
        this.setCircuitTitle(electronFileName);
      this.unsavedChanges = false;
    } else {
      if (this.stopMessage == null && this.startCircuitLink != null) {
        this.loader.readCircuit("");
        this.menus.getSetupList(false);
        window.ImportFromDropboxDialog?.setSim(this);
        window.ImportFromDropboxDialog?.doImportDropboxLink(this.startCircuitLink, false);
      } else {
        this.loader.readCircuit("");
        if (this.stopMessage == null && this.startCircuit != null) {
          this.menus.getSetupList(false);
          this.menus.readSetupFile(this.startCircuit, this.startLabel);
        } else
          this.menus.getSetupList(true);
      }
    }
    if (mouseModeReq != null)
      this.commands?.menuPerformed("main", mouseModeReq);
    this.undoManager?.enableUndoRedo();
    this.commands?.enablePaste();
    this.jsInterface = HookRegistry.createJSInterface?.(this);
    this.jsInterface?.setupJSInterface();
    this.setSimRunning(running);
  }
  isPrintable() {
    return this.menus.printableCheckItem.getState();
  }
  // delegation methods for UIManager
  setOptionInStorage(key, val) {
    this.ui.setOptionInStorage(key, val);
  }
  getOptionFromStorage(key, val) {
    return this.ui.getOptionFromStorage(key, val);
  }
  saveShortcuts() {
    this.ui.saveShortcuts();
  }
  composeSubcircuitMenu() {
    this.ui.composeSubcircuitMenu();
  }
  setiFrameHeight() {
    this.ui.setiFrameHeight();
  }
  centerCircuit() {
    this.ui.centerCircuit();
  }
  getCircuitBounds() {
    return this.ui.getCircuitBounds();
  }
  setSimRunning(s) {
    this.ui.setSimRunning(s);
  }
  simIsRunning() {
    return this.ui.simIsRunning();
  }
  repaint() {
    this.ui.repaint();
  }
  updateCircuit() {
    this.ui.updateCircuit();
  }
  setStopElm(ce, msg) {
    this.stopElm = ce;
    this.stopMessage = msg;
  }
  drawBottomArea(g) {
    this.ui.drawBottomArea(g);
  }
  getBackgroundColor() {
    return this.ui.getBackgroundColor();
  }
  onTimeStep() {
    this.scopeManager.timeStep();
    this.jsInterface?.callTimeStepHook();
  }
  needAnalyze() {
    this.analyzeFlag = true;
    this.repaint();
    this.mouse.enableDisableMenuItems();
  }
  getElm(n) {
    if (n >= this.elmList.length)
      return null;
    return this.elmList[n];
  }
  getIterCount() {
    if (this.ui.speedBar.getValue() == 0)
      return 0;
    return 0.1 * Math.exp((this.ui.speedBar.getValue() - 61) / 24);
  }
  getHint() {
    const c1 = this.getElm(this.hintItem1);
    const c2 = this.getElm(this.hintItem2);
    if (c1 == null || c2 == null)
      return null;
    if (this.hintType == CirSim.HINT_LC) {
      if (!c1.isInductorElm())
        return null;
      if (!c2.isCapacitorElm())
        return null;
      return Locale.LS("res.f = ") + c1.constructor.getUnitText(1 / (2 * CirSim.pi * Math.sqrt(c1.inductance * c2.capacitance)), "Hz");
    }
    if (this.hintType == CirSim.HINT_RC) {
      if (!c1.isResistorElm())
        return null;
      if (!c2.isCapacitorElm())
        return null;
      return "RC = " + c1.constructor.getUnitText(c1.resistance * c2.capacitance, "s");
    }
    if (this.hintType == CirSim.HINT_3DB_C) {
      if (!c1.isResistorElm())
        return null;
      if (!c2.isCapacitorElm())
        return null;
      return Locale.LS("f.3db = ") + c1.constructor.getUnitText(1 / (2 * CirSim.pi * c1.resistance * c2.capacitance), "Hz");
    }
    if (this.hintType == CirSim.HINT_3DB_L) {
      if (!c1.isResistorElm())
        return null;
      if (!c2.isInductorElm())
        return null;
      return Locale.LS("f.3db = ") + c1.constructor.getUnitText(c1.resistance / (2 * CirSim.pi * c2.inductance), "Hz");
    }
    if (this.hintType == CirSim.HINT_TWINT) {
      if (!c1.isResistorElm())
        return null;
      if (!c2.isCapacitorElm())
        return null;
      return Locale.LS("fc = ") + c1.constructor.getUnitText(1 / (2 * CirSim.pi * c1.resistance * c2.capacitance), "Hz");
    }
    return null;
  }
  findAdjustable(elm, item) {
    for (let i = 0; i !== this.adjustables.length; i++) {
      const a = this.adjustables[i];
      if (a.elm == elm && a.editItem == item)
        return a;
    }
    return null;
  }
  static console(text) {
    console.log(text);
  }
  static debugger() {
    debugger;
  }
  min(a, b) {
    return a < b ? a : b;
  }
  max(a, b) {
    return a > b ? a : b;
  }
  resetAction() {
    this.ui.resetAction();
  }
  static isElectron() {
    return window.openFile != void 0;
  }
  static getElectronStartCircuitText() {
    return window.startCircuitText ?? null;
  }
  static getElectronStartCircuitFileName() {
    return window.startCircuitFileName ?? null;
  }
  allowSave(b) {
    this.ui.allowSave(b);
  }
  importCircuitFromText(circuitText, subcircuitsOnly) {
    const RC_SUBCIRCUITS = 2, RC_RETAIN = 4;
    if (circuitText != null && this.loader.constructor.isSubcircuitLibrary(circuitText))
      subcircuitsOnly = true;
    const flags = subcircuitsOnly ? RC_SUBCIRCUITS | RC_RETAIN : 0;
    if (!subcircuitsOnly)
      this.resetEditingContext();
    if (circuitText != null) {
      this.loader.readCircuit(circuitText, flags);
      ExportAsLocalFileDialog.setLastFileName(null);
      this.allowSave(false);
      if (!subcircuitsOnly) {
        this.unsavedChanges = false;
        this.savedFlag = true;
      }
    }
  }
  dumpOptions() {
    let f = this.menus.dotsCheckItem.getState() ? 1 : 0;
    f |= this.menus.smallGridCheckItem.getState() ? 2 : 0;
    f |= this.menus.voltsCheckItem.getState() ? 0 : 4;
    f |= this.menus.powerCheckItem.getState() ? 8 : 0;
    f |= this.menus.showValuesCheckItem.getState() ? 0 : 16;
    f |= this.sim.adjustTimeStep ? 64 : 0;
    f |= this.autoDCOnReset ? 128 : 0;
    const dump = "$ " + f + " " + this.sim.maxTimeStep + " " + this.getIterCount() + " " + this.ui.currentBar.getValue() + " " + CircuitElm.voltageRange + " " + this.ui.powerBar.getValue() + " " + this.sim.minTimeStep + "\n";
    return dump;
  }
  // a click pushes an undo item (and so sets unsavedChanges) even if nothing moves,
  // so check whether the circuit itself is different
  isModified() {
    if (!this.unsavedChanges)
      return false;
    if (this.savedDump == null || this.savedDumpPending)
      return true;
    return UndoManager.withoutSliders(this.dumpCircuit(false)) !== UndoManager.withoutSliders(this.savedDump);
  }
  // saveState=false: without simulation state or scopes (see CircuitXMLSerializer)
  dumpCircuit(saveState = true) {
    CustomLogicModel.clearDumpedFlags();
    HookRegistry.clearSubcircuitModelDumpedFlags?.();
    DiodeModel.clearDumpedFlags();
    TransistorModel.clearDumpedFlags();
    RelayModel.clearDumpedFlags();
    MosfetModel.clearDumpedFlags();
    const xml = new CircuitXMLSerializer(this);
    xml.saveState = saveState;
    return xml.dumpCircuit();
  }
  setCircuitTitle(s) {
    this.ui.setCircuitTitle(s);
  }
  clearCircuit() {
    this.loader.clearCircuit();
  }
  readCircuit(s) {
    this.loader.readCircuit(s);
  }
  pushContext(modelName) {
    const ctx = new CircuitContext();
    ctx.circuitDump = this.dumpCircuit();
    ctx.undoStack = this.undoManager.undoStack;
    ctx.redoStack = this.undoManager.redoStack;
    ctx.transform = this.transform.slice();
    ctx.modelName = modelName;
    this.contextStack.push(ctx);
    this.undoManager.undoStack = [];
    this.undoManager.redoStack = [];
    this.undoManager.enableUndoRedo();
    this.ui.updateContextButtons();
  }
  popContext() {
    this.popContextAndGetChangedModels();
  }
  // pop context and return the list of models changed at deeper levels
  popContextAndGetChangedModels() {
    if (this.contextStack.length === 0)
      return [];
    const ctx = this.contextStack.splice(this.contextStack.length - 1, 1)[0];
    const RC_NO_CENTER = 8;
    this.loader.readCircuit(ctx.circuitDump, RC_NO_CENTER);
    this.transform = ctx.transform;
    this.undoManager.undoStack = ctx.undoStack;
    this.undoManager.redoStack = ctx.redoStack;
    this.undoManager.enableUndoRedo();
    this.ui.updateContextButtons();
    return ctx.changedModels;
  }
  resetEditingContext() {
    this.contextStack = [];
    this.ui.updateContextButtons();
  }
  isEditingContext() {
    return this.contextStack.length > 0;
  }
  getEditingModelName() {
    if (this.contextStack.length === 0)
      return null;
    return this.contextStack[this.contextStack.length - 1].modelName;
  }
  // delete sliders for an element
  deleteSliders(elm) {
    if (this.adjustables == null)
      return;
    for (let i = this.adjustables.length - 1; i >= 0; i--) {
      const adj = this.adjustables[i];
      if (adj.elm == elm) {
        adj.deleteSlider(this);
        this.adjustables.splice(i, 1);
      }
    }
  }
  snapGrid(x) {
    return x + this.gridRound & this.gridMask;
  }
  locateElm(elm) {
    for (let i = 0; i !== this.elmList.length; i++)
      if (elm === this.elmList[i])
        return i;
    return -1;
  }
  setPowerBarEnable() {
    this.ui.setPowerBarEnable();
  }
  enableItems() {
    this.ui.enableItems();
  }
  setGrid() {
    this.ui.setGrid();
  }
  setToolbar() {
    this.ui.setToolbar();
  }
  setMouseMode(mode) {
    this.ui.setMouseMode(mode);
  }
  setCursorStyle(s) {
    this.ui.setCursorStyle(s);
  }
  dialogIsShowing() {
    return this.ui.dialogIsShowing();
  }
  modalDialogIsShowing() {
    return this.ui.modalDialogIsShowing();
  }
  updateToolbar() {
    this.ui.updateToolbar();
  }
  getLabelTextForClass(cls) {
    return this.ui.getLabelTextForClass(cls);
  }
  createNewLoadFile() {
    this.ui.createNewLoadFile();
  }
  addWidgetToVerticalPanel(w) {
    this.ui.addWidgetToVerticalPanel(w);
  }
  removeWidgetFromVerticalPanel(w) {
    this.ui.removeWidgetFromVerticalPanel(w);
  }
  register(origClassName, elm) {
    let className = origClassName;
    if (CirSim.dumpTypeMap == null) {
      CirSim.dumpTypeMap = /* @__PURE__ */ new Map();
      CirSim.xmlDumpTypeMap = /* @__PURE__ */ new Map();
    }
    if (elm == null)
      return;
    const t = elm.getDumpType();
    if (elm.getDumpClass) {
      const cs = elm.getDumpClass();
      if (cs && cs.name) {
        className = cs.name;
        const dot = className.lastIndexOf(".");
        if (dot >= 0) className = className.substring(dot + 1);
      }
    }
    if (t > 0) {
      const s = CirSim.dumpTypeMap.get(t);
      if (s != null) {
        if (s !== className)
          CirSim.console("dump type conflict for " + className + " " + t);
      } else {
        CirSim.dumpTypeMap.set(t, className);
      }
    }
    const xt = elm.getXmlDumpType ? elm.getXmlDumpType() : className;
    const s2 = CirSim.xmlDumpTypeMap.get(xt);
    if (s2 != null) {
      if (s2 !== className)
        CirSim.console("xml dump type conflict for " + className + " " + xt);
    } else {
      CirSim.xmlDumpTypeMap.set(xt, className);
    }
  }
  static createCe(tint, x1, y1, x2, y2, f, st) {
    if (tint === "n".charCodeAt(0))
      return ElementFactory.create("NoiseElm", x1, y1, x2, y2, f, st);
    const name = CirSim.dumpTypeMap.get(tint);
    if (name == null)
      return null;
    return ElementFactory.create(name, x1, y1, x2, y2, f, st);
  }
  static constructElement(n, x1, y1) {
    const elm = ElementFactory.create(n, x1, y1 ?? 0);
    if (elm != null)
      return elm;
    if (n == "VoltageElm")
      return ElementFactory.create("DCVoltageElm", x1, y1 ?? 0);
    if (n == "TransistorElm")
      return ElementFactory.create("NTransistorElm", x1, y1 ?? 0);
    if (n == "MosfetElm")
      return ElementFactory.create("NMosfetElm", x1, y1 ?? 0);
    if (n == "JfetElm")
      return ElementFactory.create("NJfetElm", x1, y1 ?? 0);
    if (n == "DarlingtonElm")
      return ElementFactory.create("NDarlingtonElm", x1, y1 ?? 0);
    if (n == "DecadeElm" || n == "RingCounterElm")
      return ElementFactory.create("RingCounterElm", x1, y1 ?? 0);
    if (n == "UserDefinedLogicElm" || n == "CustomLogicElm")
      return ElementFactory.create("CustomLogicElm", x1, y1 ?? 0);
    if (n.startsWith("SubcircuitElm:")) {
      const ix = n.indexOf(":") + 1;
      const name = n.substring(ix);
      return HookRegistry.createSubcircuitElm(x1, y1 ?? 0, name);
    }
    return null;
  }
  updateModels() {
    for (const ce of this.elmList)
      ce.updateModels();
  }
  // force all SubcircuitElm with a given model name to re-fetch their model
  refreshModels(modelName) {
    for (const ce of this.elmList) {
      if (ce.isSubcircuitElm && ce.isSubcircuitElm()) {
        if (ce.modelName === modelName) {
          ce.model = null;
          ce.updateModels();
        }
      }
    }
    this.needAnalyze();
  }
  isSelection() {
    return this.ui.isSelection();
  }
  isMobile(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    return style.display !== "none";
  }
  decompress(dump) {
    return window.LZString.decompressFromEncodedURIComponent(dump);
  }
  // instance wrappers for Java compatibility
  constructElement(name, x, y) {
    return CirSim.constructElement(name, x, y);
  }
  console(s) {
    CirSim.console(s);
  }
  getrand(x) {
    let q = this.random.nextInt();
    if (q < 0) q = -q;
    return q % x;
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
  getBooleanValue(key, def) {
    const v = this.params.get(key);
    if (v == null) return def;
    return v !== "false" && v !== "0";
  }
}
class CircuitContext {
  circuitDump = "";
  undoStack = [];
  redoStack = [];
  transform = [];
  modelName = "";
  changedModels = [];
}

const VAL_POWER = 7;
const VAL_POWER_OLD = 1;
const VAL_VOLTAGE = 0;
const VAL_CURRENT = 3;
const VAL_IB = 1;
const VAL_IC = 2;
const VAL_IE = 3;
const VAL_VBE = 4;
const VAL_VBC = 5;
const VAL_VCE = 6;
const VAL_R = 2;
const VAL_CHARGE = 8;
const UNITS_V = 0;
const UNITS_A = 1;
const UNITS_W = 2;
const UNITS_OHMS = 3;
const UNITS_C = 4;
const UNITS_COUNT = 5;
const V_POSITION_STEPS = 200;
const MIN_MAN_SCALE = 1e-9;
const multa = [2, 2.5, 2];

class ScopePlot {
  minValues;
  maxValues;
  scopePointCount;
  ptr;
  // ptr is pointer to the current sample
  value;
  // Value - the property being shown - e.g. VAL_CURRENT
  // scopePlotSpeed is in sim timestep units per pixel
  scopePlotSpeed;
  units;
  lastUpdateTime;
  lastValue;
  color;
  elm;
  // Has a manual scale in "/div" format been put in by the user (as opposed to being
  // inferred from a "MaxValue" format or from an automatically calculated scale)?
  // Manual scales should be kept to sane values anyway, but this shows if this is a user
  // intention we should respect, or if we should try and populate reasonable values from
  // the data we have
  manScaleSet = false;
  manScale = 1;
  // Units per division
  manVPosition = 0;
  // 0 is center of screen. +V_POSITION_STEPS/2 is top of screen
  gridMult = 0;
  plotOffset = 0;
  acCoupled = false;
  acAlpha = 0.9999;
  // Filter coefficient for AC coupling
  acDc = 0;
  // DC level removed by AC coupling filter (the coupling capacitor's voltage)
  acCount = 0;
  // samples since filter was reset, for fast start
  static FLAG_AC = 1;
  constructor(e, u, v, manS) {
    this.elm = e;
    this.units = u;
    this.value = 0;
    this.scopePointCount = 0;
    this.ptr = 0;
    this.scopePlotSpeed = 0;
    this.lastUpdateTime = 0;
    this.lastValue = 0;
    this.color = "#FFFFFF";
    this.minValues = [];
    this.maxValues = [];
    if (v !== void 0 && manS !== void 0) {
      this.value = v;
      this.manScale = manS;
      if (u === UNITS_OHMS || u === UNITS_W || u === UNITS_C)
        this.manVPosition = -V_POSITION_STEPS / 2;
    }
  }
  startIndex(w) {
    return this.ptr + this.scopePointCount - w;
  }
  reset(spc, sp, full) {
    let oldSpc = this.scopePointCount;
    this.scopePointCount = spc;
    if (this.scopePlotSpeed !== sp)
      oldSpc = 0;
    this.scopePlotSpeed = sp;
    this.acAlpha = 1 - 1 / (1.15 * sp * spc);
    this.acDc = 0;
    this.acCount = 0;
    const oldMin = this.minValues;
    const oldMax = this.maxValues;
    this.minValues = new Array(spc).fill(0);
    this.maxValues = new Array(spc).fill(0);
    if (oldMin !== null && oldMin.length > 0 && !full) {
      let i;
      for (i = 0; i !== spc && i !== oldSpc; i++) {
        const i1 = -i & spc - 1;
        const i2 = this.ptr - i & oldSpc - 1;
        this.minValues[i1] = oldMin[i2];
        this.maxValues[i1] = oldMax[i2];
      }
    } else
      this.lastUpdateTime = SimulationManager.theSim.t;
    this.ptr = 0;
  }
  timeStep() {
    if (this.elm === null)
      return;
    let v = this.elm.getScopeValue(this.value);
    this.acCount++;
    const k = Math.max(1 / this.acCount, 1 - this.acAlpha);
    this.acDc += (v - this.acDc) * k;
    this.lastValue = v;
    if (this.isAcCoupled())
      v -= this.acDc;
    if (v < this.minValues[this.ptr])
      this.minValues[this.ptr] = v;
    if (v > this.maxValues[this.ptr])
      this.maxValues[this.ptr] = v;
    const maxTimeStep = SimulationManager.theSim.maxTimeStep;
    if (SimulationManager.theSim.t - this.lastUpdateTime >= maxTimeStep * this.scopePlotSpeed) {
      this.ptr = this.ptr + 1 & this.scopePointCount - 1;
      this.minValues[this.ptr] = this.maxValues[this.ptr] = v;
      this.lastUpdateTime += maxTimeStep * this.scopePlotSpeed;
    }
  }
  getUnitText(v) {
    switch (this.units) {
      case UNITS_V:
        return CircuitElm.getVoltageText(v);
      case UNITS_A:
        return CircuitElm.getCurrentText(v);
      case UNITS_OHMS:
        return CircuitElm.getUnitText(v, Locale.ohmString);
      case UNITS_W:
        return CircuitElm.getUnitText(v, "W");
      case UNITS_C:
        return CircuitElm.getUnitText(v, "C");
    }
    return "";
  }
  static colors = [
    "#FF0000",
    "#FF8000",
    "#FF00FF",
    "#7F00FF",
    "#0000FF",
    "#0080FF",
    "#FFFF00",
    "#00FFFF"
  ];
  assignColor(count) {
    if (count > 0) {
      this.color = ScopePlot.colors[(count - 1) % 8];
      return;
    }
    switch (this.units) {
      case UNITS_V:
        this.color = CircuitElm.positiveColor.getHexValue();
        break;
      case UNITS_A:
        this.color = CirSim.theApp.isPrintable() ? "#A0A000" : "#FFFF00";
        break;
      default:
        this.color = CirSim.theApp.isPrintable() ? "#000000" : "#FFFFFF";
        break;
    }
  }
  setAcCoupled(b) {
    if (this.canAcCouple()) {
      this.acCoupled = b;
    } else
      this.acCoupled = false;
  }
  canAcCouple() {
    return this.units === UNITS_V;
  }
  isAcCoupled() {
    return this.acCoupled;
  }
  getPlotFlags() {
    return this.acCoupled ? ScopePlot.FLAG_AC : 0;
  }
}

class ScopeDataIterator {
  plot;
  ipa;
  validCount;
  currentIp = 0;
  startIndex = 0;
  scopePointCount;
  // Accept pre-computed values to avoid circular imports with Scope
  constructor(scopePointCount, ipa, validCount, plot) {
    this.plot = plot;
    this.scopePointCount = scopePointCount;
    this.ipa = ipa;
    this.validCount = validCount;
  }
  skipNonzeroValues() {
    for (; this.startIndex < this.validCount; this.startIndex++) {
      const ip = this.startIndex + this.ipa & this.scopePointCount - 1;
      if (this.plot.maxValues[ip] !== 0)
        return this.plot.maxValues[ip];
    }
    return 0;
  }
  getMin() {
    return this.plot.minValues[this.currentIp];
  }
  getMax() {
    return this.plot.maxValues[this.currentIp];
  }
  [Symbol.iterator]() {
    let i = this.startIndex;
    const self = this;
    return {
      next() {
        if (i < self.validCount) {
          self.currentIp = i + self.ipa & self.scopePointCount - 1;
          return { value: i++, done: false };
        }
        return { value: 0, done: true };
      }
    };
  }
}

class ScopePlot2d {
  enabled = false;
  plotXY = false;
  scaleX;
  scaleY;
  // X/Y axis plot indices (into scope.plots)
  plotX = 0;
  plotY = 1;
  // Modulator plot indices (-1 = none)
  plotBrightness = -1;
  plotColorR = -1;
  plotColorG = -1;
  plotColorB = -1;
  // Auto-scales for modulator plots
  scaleBrightness = 5;
  scaleR = 5;
  scaleG = 5;
  scaleB = 5;
  imageCanvas = null;
  imageContext = null;
  draw_ox = -1;
  draw_oy = -1;
  alphaCounter = 0;
  trailPersistence = 0;
  static DEFAULT_TRAIL_PERSISTENCE = 0;
  lastTrailSimTime = -1;
  scope;
  constructor(scope) {
    this.scope = scope;
    this.scaleX = 5;
    this.scaleY = 0.1;
  }
  allocImage() {
    if (!this.enabled)
      return;
    if (this.imageCanvas === null) {
      this.imageCanvas = document.createElement("canvas");
      this.imageContext = this.imageCanvas.getContext("2d");
    }
    this.imageCanvas.width = this.scope.rect.width;
    this.imageCanvas.height = this.scope.rect.height;
    this.clearView();
  }
  clearView() {
    if (this.imageContext !== null) {
      this.imageContext.fillStyle = this.scope.app.isPrintable() ? "#eee" : "#111";
      this.imageContext.fillRect(0, 0, this.scope.rect.width - 1, this.scope.rect.height - 1);
    }
    this.draw_ox = this.draw_oy = -1;
  }
  calcGridPx(width, height) {
    const m = Math.min(width, height);
    return m / 2 / (this.scope.manDivisions / 2 + 0.05);
  }
  // Draw a segment from (ox,oy) to (x2,y2) with the given color and alpha.
  drawSegment(ox, oy, x2, y2, color, alpha) {
    if (alpha !== 1)
      this.imageContext.globalAlpha = alpha;
    this.imageContext.strokeStyle = color;
    this.imageContext.beginPath();
    this.imageContext.moveTo(ox, oy);
    this.imageContext.lineTo(x2, y2);
    this.imageContext.stroke();
    if (alpha !== 1)
      this.imageContext.globalAlpha = 1;
  }
  drawTo(x2, y2, color, alpha) {
    if (this.draw_ox === -1) {
      this.draw_ox = x2;
      this.draw_oy = y2;
      return;
    }
    const c = color ?? (this.scope.app.isPrintable() ? "#000000" : "#ffffff");
    this.drawSegment(this.draw_ox, this.draw_oy, x2, y2, c, alpha ?? 1);
    this.draw_ox = x2;
    this.draw_oy = y2;
  }
  // Compute the draw color from R/G/B modulator plots.
  computeColor() {
    if (this.plotColorR < 0 && this.plotColorG < 0 && this.plotColorB < 0)
      return this.scope.app.isPrintable() ? "#000000" : "#ffffff";
    let r = 0, g = 0, b = 0;
    if (this.plotColorR >= 0 && this.plotColorR < this.scope.plots.length) {
      const rv = this.scope.plots[this.plotColorR].lastValue;
      while (rv > this.scaleR) this.scaleR *= 2;
      r = Math.trunc(Math.max(0, Math.min(255, rv / this.scaleR * 255)));
    }
    if (this.plotColorG >= 0 && this.plotColorG < this.scope.plots.length) {
      const gv = this.scope.plots[this.plotColorG].lastValue;
      while (gv > this.scaleG) this.scaleG *= 2;
      g = Math.trunc(Math.max(0, Math.min(255, gv / this.scaleG * 255)));
    }
    if (this.plotColorB >= 0 && this.plotColorB < this.scope.plots.length) {
      const bv = this.scope.plots[this.plotColorB].lastValue;
      while (bv > this.scaleB) this.scaleB *= 2;
      b = Math.trunc(Math.max(0, Math.min(255, bv / this.scaleB * 255)));
    }
    return "rgb(" + r + "," + g + "," + b + ")";
  }
  // Compute draw alpha from the brightness modulator plot (0 = off, 1 = full).
  computeAlpha() {
    if (this.plotBrightness < 0 || this.plotBrightness >= this.scope.plots.length)
      return 1;
    const bv = Math.abs(this.scope.plots[this.plotBrightness].lastValue);
    while (bv > this.scaleBrightness) this.scaleBrightness *= 2;
    return this.scaleBrightness > 0 ? bv / this.scaleBrightness : 0;
  }
  // Clamp plotX/plotY to valid range.
  validPlotIndex(idx, defaultIdx) {
    if (this.scope.plots.length === 0) return 0;
    if (idx < 0 || idx >= this.scope.plots.length) return Math.min(defaultIdx, this.scope.plots.length - 1);
    return idx;
  }
  timeStep() {
    if (this.imageContext === null || this.scope.plots.length < 1)
      return;
    const px = this.validPlotIndex(this.plotX, 0);
    const py = this.validPlotIndex(this.plotY, Math.min(1, this.scope.plots.length - 1));
    const v = this.scope.plots[px].lastValue;
    const yval = this.scope.plots[py].lastValue;
    let x, y;
    if (!this.scope.isManualScale()) {
      let newscale = false;
      while (v > this.scaleX || v < -this.scaleX) {
        this.scaleX *= 2;
        newscale = true;
      }
      while (yval > this.scaleY || yval < -this.scaleY) {
        this.scaleY *= 2;
        newscale = true;
      }
      if (newscale)
        this.clearView();
      x = Math.trunc(this.scope.rect.width * (1 + v / this.scaleX) * 0.499);
      y = Math.trunc(this.scope.rect.height * (1 - yval / this.scaleY) * 0.499);
    } else {
      const gridPx = this.calcGridPx(this.scope.rect.width, this.scope.rect.height);
      x = Math.trunc(this.scope.rect.width * 0.499 + v / this.scope.plots[px].manScale * gridPx + gridPx * this.scope.manDivisions * this.scope.plots[px].manVPosition / Scope.V_POSITION_STEPS);
      y = Math.trunc(this.scope.rect.height * 0.499 - yval / this.scope.plots[py].manScale * gridPx - gridPx * this.scope.manDivisions * this.scope.plots[py].manVPosition / Scope.V_POSITION_STEPS);
    }
    this.drawTo(x, y, this.computeColor(), this.computeAlpha());
  }
  maxScale() {
    const x = 1e-8;
    this.scope.scale[Scope.UNITS_V] *= x;
    this.scope.scale[Scope.UNITS_A] *= x;
    this.scope.scale[Scope.UNITS_OHMS] *= x;
    this.scope.scale[Scope.UNITS_W] *= x;
    this.scope.scale[Scope.UNITS_C] *= x;
    this.scaleX *= x;
    this.scaleY *= x;
    this.scaleBrightness *= x;
    this.scaleR *= x;
    this.scaleG *= x;
    this.scaleB *= x;
  }
  draw(g) {
    if (this.imageContext === null)
      return;
    g.context.save();
    g.context.translate(this.scope.rect.x, this.scope.rect.y);
    g.clipRect(0, 0, this.scope.rect.width, this.scope.rect.height);
    this.alphaCounter++;
    if (this.alphaCounter > 2) {
      this.alphaCounter = 0;
      let fadeAlpha;
      if (this.trailPersistence <= 0) {
        fadeAlpha = 0.01;
      } else {
        if (this.lastTrailSimTime < 0 || this.scope.sim.t < this.lastTrailSimTime)
          this.lastTrailSimTime = this.scope.sim.t;
        const elapsed = this.scope.sim.t - this.lastTrailSimTime;
        const timeConst = this.trailPersistence * this.scope.sim.maxTimeStep;
        fadeAlpha = 1 - Math.exp(-elapsed / timeConst);
        if (fadeAlpha >= 3 / 255)
          this.lastTrailSimTime = this.scope.sim.t;
        else
          fadeAlpha = 0;
      }
      if (fadeAlpha > 0) {
        this.imageContext.globalAlpha = fadeAlpha;
        this.imageContext.fillStyle = this.scope.app.isPrintable() ? "#ffffff" : "#000000";
        this.imageContext.fillRect(0, 0, this.scope.rect.width, this.scope.rect.height);
        this.imageContext.globalAlpha = 1;
      }
    }
    g.context.drawImage(this.imageCanvas, 0, 0);
    g.setColor(CircuitElm.whiteColor);
    g.fillOval(this.draw_ox - 2, this.draw_oy - 2, 5, 5);
    g.setColor(CircuitElm.positiveColor);
    g.drawLine(0, this.scope.rect.height / 2, this.scope.rect.width - 1, this.scope.rect.height / 2);
    if (!this.plotXY)
      g.setColor(Color.yellow);
    g.drawLine(this.scope.rect.width / 2, 0, this.scope.rect.width / 2, this.scope.rect.height - 1);
    if (this.scope.isManualScale()) {
      const gridPx = this.calcGridPx(this.scope.rect.width, this.scope.rect.height);
      g.setColor("#404040");
      for (let i = -this.scope.manDivisions; i <= this.scope.manDivisions; i++) {
        if (i !== 0)
          g.drawLine(
            Math.trunc(gridPx * i) + this.scope.rect.width / 2,
            0,
            Math.trunc(gridPx * i) + this.scope.rect.width / 2,
            this.scope.rect.height
          );
        g.drawLine(
          0,
          Math.trunc(gridPx * i) + this.scope.rect.height / 2,
          this.scope.rect.width,
          Math.trunc(gridPx * i) + this.scope.rect.height / 2
        );
      }
    }
    this.scope.overlays.textY = 10;
    g.setColor(CircuitElm.whiteColor);
    if (this.scope.text != null)
      this.scope.drawInfoText(g, this.scope.text);
    const px = this.validPlotIndex(this.plotX, 0);
    const py = this.validPlotIndex(this.plotY, Math.min(1, this.scope.plots.length - 1));
    if (this.scope.showScale && this.scope.plots.length >= 1 && this.scope.isManualScale() && px < this.scope.plots.length && py < this.scope.plots.length) {
      const spx = this.scope.plots[px];
      const spy = this.scope.plots[py];
      this.scope.drawInfoText(g, "X=" + spx.getUnitText(spx.manScale) + "/div, Y=" + spy.getUnitText(spy.manScale) + "/div");
    }
    g.context.restore();
    this.scope.drawSettingsWheel(g);
    if (!this.scope.app.modalDialogIsShowing() && this.scope.rect.contains(this.scope.app.mouse.mouseCursorX, this.scope.app.mouse.mouseCursorY) && this.scope.plots.length >= 1 && px < this.scope.plots.length && py < this.scope.plots.length) {
      const gridPx = this.calcGridPx(this.scope.rect.width, this.scope.rect.height);
      const info = new Array(2);
      const spx = this.scope.plots[px];
      const spy = this.scope.plots[py];
      let xValue, yValue;
      if (this.scope.isManualScale()) {
        xValue = spx.manScale * ((this.scope.app.mouse.mouseCursorX - this.scope.rect.x - this.scope.rect.width / 2) / gridPx - this.scope.manDivisions * spx.manVPosition / Scope.V_POSITION_STEPS);
        yValue = spy.manScale * ((-this.scope.app.mouse.mouseCursorY + this.scope.rect.y + this.scope.rect.height / 2) / gridPx - this.scope.manDivisions * spy.manVPosition / Scope.V_POSITION_STEPS);
      } else {
        xValue = ((this.scope.app.mouse.mouseCursorX - this.scope.rect.x) / (0.499 * this.scope.rect.width) - 1) * this.scaleX;
        yValue = -((this.scope.app.mouse.mouseCursorY - this.scope.rect.y) / (0.499 * this.scope.rect.height) - 1) * this.scaleY;
      }
      info[0] = spx.getUnitText(xValue);
      info[1] = spy.getUnitText(yValue);
      this.scope.drawCursorInfo(g, info, 2, this.scope.app.mouse.mouseCursorX, true);
    }
  }
}

class ScopeSerializer {
  scope;
  static FLAG_YELM = 32;
  static FLAG_IVALUE = 2048;
  static FLAG_PLOTS = 4096;
  static FLAG_MAN_SCALE = 16;
  static FLAG_PERPLOTFLAGS = 1 << 18;
  static FLAG_PERPLOT_MAN_SCALE = 1 << 19;
  static FLAG_DIVISIONS = 1 << 21;
  static FLAG_TRIGGER = 1 << 24;
  constructor(scope) {
    this.scope = scope;
  }
  getFlags() {
    let flags = (this.scope.showI ? 1 : 0) | (this.scope.showV ? 2 : 0) | (this.scope.showMax ? 0 : 4) | // showMax used to be always on
    (this.scope.showFreq ? 8 : 0) | // In this version we always dump manual settings using the PERPLOT format
    (this.scope.isManualScale() ? ScopeSerializer.FLAG_MAN_SCALE | ScopeSerializer.FLAG_PERPLOT_MAN_SCALE : 0) | (this.scope.plot2d.enabled ? 64 : 0) | (this.scope.plot2d.plotXY ? 128 : 0) | (this.scope.showMin ? 256 : 0) | (this.scope.showScale ? 512 : 0) | (this.scope.fftPlot.enabled ? 1024 : 0) | (this.scope.maxScale ? 8192 : 0) | (this.scope.showRMS ? 16384 : 0) | (this.scope.showDutyCycle ? 32768 : 0) | (this.scope.fftPlot.logSpectrum ? 65536 : 0) | (this.scope.showAverage ? 1 << 17 : 0) | (this.scope.showElmInfo ? 1 << 20 : 0) | (this.scope.showP2P ? 1 << 22 : 0) | (this.scope.fftPlot.showPhaseAngle ? 1 << 23 : 0);
    flags |= ScopeSerializer.FLAG_PLOTS;
    let allPlotFlags = 0;
    for (const p of this.scope.plots)
      allPlotFlags |= p.getPlotFlags();
    flags |= allPlotFlags !== 0 ? ScopeSerializer.FLAG_PERPLOTFLAGS : 0;
    if (this.scope.isManualScale())
      flags |= ScopeSerializer.FLAG_DIVISIONS;
    if (this.scope.trigger.isActive())
      flags |= ScopeSerializer.FLAG_TRIGGER;
    return flags;
  }
  setFlags(flags) {
    this.scope.showI = (flags & 1) !== 0;
    this.scope.showV = (flags & 2) !== 0;
    this.scope.showMax = (flags & 4) === 0;
    this.scope.showFreq = (flags & 8) !== 0;
    this.scope.manualScale = (flags & ScopeSerializer.FLAG_MAN_SCALE) !== 0;
    this.scope.plot2d.enabled = (flags & 64) !== 0;
    this.scope.plot2d.plotXY = (flags & 128) !== 0;
    this.scope.showMin = (flags & 256) !== 0;
    this.scope.showScale = (flags & 512) !== 0;
    this.scope.fftPlot.show((flags & 1024) !== 0);
    this.scope.maxScale = (flags & 8192) !== 0;
    this.scope.showRMS = (flags & 16384) !== 0;
    this.scope.showDutyCycle = (flags & 32768) !== 0;
    this.scope.fftPlot.logSpectrum = (flags & 65536) !== 0;
    this.scope.showAverage = (flags & 1 << 17) !== 0;
    this.scope.showElmInfo = (flags & 1 << 20) !== 0;
    this.scope.showP2P = (flags & 1 << 22) !== 0;
    this.scope.fftPlot.showPhaseAngle = (flags & 1 << 23) !== 0;
  }
  dumpXml(doc, root) {
    const vPlot = this.scope.plots[0];
    const elm = vPlot.elm;
    if (elm === null)
      return;
    if (this.scope.plot2d.enabled && this.scope.plots.length >= 2) {
      const px = this.scope.plot2d.validPlotIndex(this.scope.plot2d.plotX, 0);
      const py = this.scope.plot2d.validPlotIndex(this.scope.plot2d.plotY, 1);
      this.scope.scale[this.scope.plots[px].units] = this.scope.plot2d.scaleX;
      this.scope.scale[this.scope.plots[py].units] = this.scope.plot2d.scaleY;
    }
    const flags = this.getFlags();
    const eno = this.scope.app.locateElm(elm);
    if (eno < 0)
      return;
    const xmlElm = doc.createElement("o");
    CircuitXMLSerializer.dumpAttr(xmlElm, "en", eno);
    CircuitXMLSerializer.dumpAttr(xmlElm, "sp", vPlot.scopePlotSpeed);
    const f = flags & -17567745;
    CircuitXMLSerializer.dumpAttr(xmlElm, "f", ScopeSerializer.exportAsDecOrHex(f, 0));
    CircuitXMLSerializer.dumpAttr(xmlElm, "p", this.scope.position);
    if (this.scope.manDivisions !== 8)
      CircuitXMLSerializer.dumpAttr(xmlElm, "md", this.scope.manDivisions);
    this.scope.trigger.dumpXml(xmlElm);
    if (this.scope.plot2d.plotXY) {
      if (this.scope.plot2d.plotX !== 0) CircuitXMLSerializer.dumpAttr(xmlElm, "xy2x", this.scope.plot2d.plotX);
      if (this.scope.plot2d.plotY !== 1) CircuitXMLSerializer.dumpAttr(xmlElm, "xy2y", this.scope.plot2d.plotY);
      if (this.scope.plot2d.plotBrightness >= 0) CircuitXMLSerializer.dumpAttr(xmlElm, "xy2br", this.scope.plot2d.plotBrightness);
      if (this.scope.plot2d.plotColorR >= 0) CircuitXMLSerializer.dumpAttr(xmlElm, "xy2r", this.scope.plot2d.plotColorR);
      if (this.scope.plot2d.plotColorG >= 0) CircuitXMLSerializer.dumpAttr(xmlElm, "xy2g", this.scope.plot2d.plotColorG);
      if (this.scope.plot2d.plotColorB >= 0) CircuitXMLSerializer.dumpAttr(xmlElm, "xy2b", this.scope.plot2d.plotColorB);
    }
    root.appendChild(xmlElm);
    for (let i = 0; i < this.scope.plots.length; i++) {
      const p = this.scope.plots[i];
      const pelm = doc.createElement("p");
      if (p.getPlotFlags() > 0)
        CircuitXMLSerializer.dumpAttr(pelm, "f", p.getPlotFlags().toString(16));
      if (p.elm !== elm)
        CircuitXMLSerializer.dumpAttr(pelm, "e", this.scope.app.locateElm(p.elm));
      CircuitXMLSerializer.dumpAttr(pelm, "v", p.value);
      CircuitXMLSerializer.dumpAttr(pelm, "sc", this.scope.scale[p.units]);
      if (this.scope.isManualScale()) {
        CircuitXMLSerializer.dumpAttr(pelm, "ms", p.manScale);
        CircuitXMLSerializer.dumpAttr(pelm, "mp", p.manVPosition);
      }
      xmlElm.appendChild(pelm);
    }
    if (this.scope.text !== null)
      xmlElm.setAttribute("x", this.scope.text);
    if (this.scope.plot2d.trailPersistence !== ScopePlot2d.DEFAULT_TRAIL_PERSISTENCE)
      CircuitXMLSerializer.dumpAttr(xmlElm, "tp", this.scope.plot2d.trailPersistence);
  }
  undumpXml(xml) {
    const e = xml.parseIntAttr("en", -1);
    if (e === -1)
      return;
    const ce = this.scope.app.getElm(e);
    this.scope.setElm(ce);
    this.scope.plots = [];
    this.scope.speed = xml.parseIntAttr("sp", 64);
    const fs = xml.parseStringAttr("f", "0");
    const flags = ScopeSerializer.importDecOrHex(fs);
    this.scope.position = xml.parseIntAttr("p", 0);
    this.scope.manDivisions = xml.parseIntAttr("md", 8);
    this.scope.text = xml.parseStringAttr("x", null);
    this.scope.plot2d.trailPersistence = xml.parseIntAttr("tp", ScopePlot2d.DEFAULT_TRAIL_PERSISTENCE);
    this.scope.trigger.undumpXml(xml);
    const xy2x = xml.parseIntAttr("xy2x", 0);
    const xy2y = xml.parseIntAttr("xy2y", 1);
    const xy2br = xml.parseIntAttr("xy2br", -1);
    const xy2r = xml.parseIntAttr("xy2r", -1);
    const xy2g = xml.parseIntAttr("xy2g", -1);
    const xy2b = xml.parseIntAttr("xy2b", -1);
    for (const elem of xml.getChildElements()) {
      xml.parseChildElement(elem);
      const plotFlags = parseIntStrict(xml.parseStringAttr("f", "0"), 16);
      const plotElm = this.scope.app.getElm(xml.parseIntAttr("e", e));
      const val = xml.parseIntAttr("v", -1);
      const u = plotElm.getScopeUnits(val);
      const sc = xml.parseDoubleAttr("sc", -1);
      if (sc >= 0)
        this.scope.scale[u] = sc;
      const p = new ScopePlot(plotElm, u, val, this.scope.getManScaleFromMaxScale(u, false));
      this.scope.plots.push(p);
      p.acCoupled = (plotFlags & ScopePlot.FLAG_AC) !== 0;
      const ms = xml.parseDoubleAttr("ms", -1);
      if (ms >= 0) {
        p.manScaleSet = true;
        p.manScale = ms;
        p.manVPosition = xml.parseIntAttr("mp", 0);
      }
    }
    this.setFlags(flags);
    if (this.scope.plot2d.plotXY) {
      this.scope.plot2d.plotX = xy2x;
      this.scope.plot2d.plotY = xy2y;
      this.scope.plot2d.plotBrightness = xy2br;
      this.scope.plot2d.plotColorR = xy2r;
      this.scope.plot2d.plotColorG = xy2g;
      this.scope.plot2d.plotColorB = xy2b;
    }
    if (this.scope.plot2d.enabled && this.scope.plots.length >= 1) {
      const px = this.scope.plot2d.validPlotIndex(this.scope.plot2d.plotX, 0);
      const py = this.scope.plot2d.validPlotIndex(this.scope.plot2d.plotY, Math.min(1, this.scope.plots.length - 1));
      this.scope.plot2d.scaleX = this.scope.scale[this.scope.plots[px].units];
      this.scope.plot2d.scaleY = this.scope.scale[this.scope.plots[py].units];
    }
  }
  undump(st) {
    this.scope.initialize();
    const e = parseIntStrict(st.nextToken());
    if (e === -1)
      return;
    const ce = this.scope.app.getElm(e);
    this.scope.setElm(ce);
    this.scope.speed = parseIntStrict(st.nextToken());
    let value = parseIntStrict(st.nextToken());
    if (!ce.isTransistorElm() && value === Scope.VAL_POWER_OLD)
      value = Scope.VAL_POWER;
    const flags = ScopeSerializer.importDecOrHex(st.nextToken());
    this.scope.scale[UNITS_V] = parseFloatStrict(st.nextToken());
    this.scope.scale[UNITS_A] = parseFloatStrict(st.nextToken());
    if (this.scope.scale[UNITS_V] === 0)
      this.scope.scale[UNITS_V] = 0.5;
    if (this.scope.scale[UNITS_A] === 0)
      this.scope.scale[UNITS_A] = 1;
    this.scope.plot2d.scaleX = this.scope.scale[UNITS_V];
    this.scope.plot2d.scaleY = this.scope.scale[UNITS_A];
    this.scope.scale[UNITS_OHMS] = this.scope.scale[UNITS_W] = this.scope.scale[UNITS_C] = this.scope.scale[UNITS_V];
    this.scope.text = null;
    const plot2dFlag = (flags & 64) !== 0;
    const hasPlotFlags = (flags & ScopeSerializer.FLAG_PERPLOTFLAGS) !== 0;
    if ((flags & ScopeSerializer.FLAG_PLOTS) !== 0) {
      try {
        this.scope.position = parseIntStrict(st.nextToken());
        const sz = parseIntStrict(st.nextToken());
        this.scope.manDivisions = 8;
        if ((flags & ScopeSerializer.FLAG_DIVISIONS) !== 0)
          this.scope.manDivisions = Scope.lastManDivisions = parseIntStrict(st.nextToken());
        let u = ce.getScopeUnits(value);
        if (u > UNITS_A)
          this.scope.scale[u] = parseFloatStrict(st.nextToken());
        this.scope.setValue(value);
        while (this.scope.plots.length > 1)
          this.scope.plots.splice(1, 1);
        let plotFlags = 0;
        for (let i = 0; i !== sz; i++) {
          if (hasPlotFlags)
            plotFlags = parseIntStrict(st.nextToken(), 16);
          if (i !== 0) {
            const ne = parseIntStrict(st.nextToken());
            const val = parseIntStrict(st.nextToken());
            const elm2 = this.scope.app.getElm(ne);
            u = elm2.getScopeUnits(val);
            if (u > UNITS_A)
              this.scope.scale[u] = parseFloatStrict(st.nextToken());
            this.scope.plots.push(new ScopePlot(elm2, u, val, this.scope.getManScaleFromMaxScale(u, false)));
          }
          const p = this.scope.plots[i];
          p.acCoupled = (plotFlags & ScopePlot.FLAG_AC) !== 0;
          if ((flags & ScopeSerializer.FLAG_PERPLOT_MAN_SCALE) !== 0) {
            p.manScaleSet = true;
            p.manScale = parseFloatStrict(st.nextToken());
            p.manVPosition = parseIntStrict(st.nextToken());
          }
        }
        while (st.hasMoreTokens()) {
          if (this.scope.text === null)
            this.scope.text = st.nextToken();
          else
            this.scope.text += " " + st.nextToken();
        }
      } catch (ee) {
      }
    } else {
      let yElm = null;
      let ivalue = 0;
      this.scope.manDivisions = 8;
      try {
        this.scope.position = parseIntStrict(st.nextToken());
        let ye = -1;
        if ((flags & ScopeSerializer.FLAG_YELM) !== 0) {
          ye = parseIntStrict(st.nextToken());
          if (ye !== -1)
            yElm = this.scope.app.getElm(ye);
          if (!plot2dFlag)
            yElm = null;
        }
        if ((flags & ScopeSerializer.FLAG_IVALUE) !== 0)
          ivalue = parseIntStrict(st.nextToken());
        while (st.hasMoreTokens()) {
          if (this.scope.text === null)
            this.scope.text = st.nextToken();
          else
            this.scope.text += " " + st.nextToken();
        }
      } catch (ee) {
      }
      this.scope.setValues(value, ivalue, this.scope.app.getElm(e), yElm);
    }
    if (this.scope.text !== null)
      this.scope.text = CustomLogicModel.unescape(this.scope.text);
    this.scope.plot2d.enabled = plot2dFlag;
    this.setFlags(flags);
  }
  saveAsDefault() {
    const stor = typeof localStorage !== "undefined" ? localStorage : null;
    if (stor === null)
      return;
    const vPlot = this.scope.plots[0];
    const flags = this.getFlags();
    let s = "1 " + flags + " " + vPlot.scopePlotSpeed;
    if ((flags & ScopeSerializer.FLAG_TRIGGER) !== 0)
      s += " " + this.scope.trigger.level;
    stor.setItem("scopeDefaults", s);
  }
  loadDefaults() {
    const stor = typeof localStorage !== "undefined" ? localStorage : null;
    if (stor === null)
      return false;
    const str = stor.getItem("scopeDefaults");
    if (str === null)
      return false;
    const arr = str.split(" ");
    const flags = parseIntStrict(arr[1]);
    this.setFlags(flags);
    this.scope.speed = parseIntStrict(arr[2]);
    if (arr.length > 3 && (flags & ScopeSerializer.FLAG_TRIGGER) !== 0)
      this.scope.trigger.level = parseFloatStrict(arr[3]);
    return true;
  }
  static exportAsDecOrHex(v, thresh) {
    if (v >= thresh)
      return "x" + v.toString(16);
    else
      return v.toString();
  }
  static importDecOrHex(s) {
    if (s.charAt(0) === "x")
      return parseIntStrict(s.substring(1), 16);
    else
      return parseIntStrict(s);
  }
}

class FFT {
  size;
  bits;
  cosTable;
  sinTable;
  winTable;
  constructor(n) {
    this.size = n;
    this.bits = Math.floor(Math.log(this.size) / Math.log(2));
    this.cosTable = new Array(this.size / 2);
    this.sinTable = new Array(this.size / 2);
    const dtheta = -2 * Math.PI / this.size;
    for (let i = 0; i < this.cosTable.length; i++) {
      this.cosTable[i] = Math.cos(dtheta * i);
      this.sinTable[i] = Math.sin(dtheta * i);
    }
    const gainCompensation = 1.5707963267961471;
    this.winTable = new Array(this.size);
    for (let i = 0; i < this.winTable.length; i++) {
      const weight = Math.sin(i * Math.PI / this.winTable.length);
      this.winTable[i] = weight * gainCompensation;
    }
  }
  /*
   * This uses the radix-2 decimation-in-time FFT algorithm.
   * Based on
   * http://www.ee.columbia.edu/~ronw/code/MEAPsoft/doc/html/FFT_8java-source.html
   * Douglas L. Jones
   * University of Illinois at Urbana-Champaign
   * January 19, 1992
   * http://cnx.rice.edu/content/m12016/latest/
   */
  fft(real, imag, windowed) {
    if (windowed) {
      for (let i = 0; i < real.length; i++) {
        real[i] *= this.winTable[i];
        imag[i] *= this.winTable[i];
      }
    }
    let j = 0;
    let n2 = real.length / 2;
    for (let i = 1; i < real.length - 1; i++) {
      let n1 = n2;
      while (j >= n1) {
        j -= n1;
        n1 /= 2;
      }
      j += n1;
      if (i < j) {
        let t1 = real[i];
        real[i] = real[j];
        real[j] = t1;
        t1 = imag[i];
        imag[i] = imag[j];
        imag[j] = t1;
      }
    }
    n2 = 1;
    for (let i = 0; i < this.bits; i++) {
      const n1 = n2;
      n2 <<= 1;
      let a = 0;
      for (j = 0; j < n1; j++) {
        const c = this.cosTable[a];
        const s = this.sinTable[a];
        a += 1 << this.bits - i - 1;
        for (let k = j; k < real.length; k += n2) {
          const t = k + n1;
          const t1 = c * real[t] - s * imag[t];
          const t2 = s * real[t] + c * imag[t];
          real[k + n1] = real[k] - t1;
          imag[k + n1] = imag[k] - t2;
          real[k] += t1;
          imag[k] += t2;
        }
      }
    }
  }
  getSize() {
    return this.size;
  }
  magnitude(real, imag) {
    return Math.sqrt(real * real + imag * imag) / this.size;
  }
}

class ScopeFFT {
  scope;
  enabled = false;
  logSpectrum = false;
  showPhaseAngle = false;
  fftMaxMagnitude = 0;
  fftReal = null;
  fftImag = null;
  fft = null;
  constructor(scope) {
    this.scope = scope;
  }
  show(b) {
    this.enabled = b;
    if (!this.enabled)
      this.fft = null;
  }
  drawVerticalGridLines(g) {
    let prevEnd = 0;
    const divs = 20;
    const maxFrequency = 1 / (this.scope.sim.maxTimeStep * this.scope.speed * divs * 2);
    for (let i = 0; i < divs; i++) {
      const x = Math.floor(this.scope.rect.width * i / divs);
      if (x < prevEnd) continue;
      const s = "" + Math.round(i * maxFrequency) + "Hz";
      const sWidth = Math.ceil(g.context.measureText(s).width);
      prevEnd = x + sWidth + 4;
      if (i > 0) {
        g.setColor("#880000");
        g.drawLine(x, 0, x, this.scope.rect.height);
      }
      g.setColor("#FF0000");
      g.drawString(s, x + 2, this.scope.rect.height);
    }
  }
  draw(g) {
    if (this.fft === null || this.fft.getSize() !== this.scope.scopePointCount)
      this.fft = new FFT(this.scope.scopePointCount);
    const real = new Array(this.scope.scopePointCount).fill(0);
    const imag = new Array(this.scope.scopePointCount).fill(0);
    const plot = this.scope.visiblePlots.length === 0 ? this.scope.plots[0] : this.scope.visiblePlots[0];
    const maxV = plot.maxValues;
    const minV = plot.minValues;
    const ptr = plot.ptr;
    for (let i = 0; i < this.scope.scopePointCount; i++) {
      const ii = ptr - i + this.scope.scopePointCount & this.scope.scopePointCount - 1;
      real[i] = 0.5 * (maxV[ii] + minV[ii]);
      imag[i] = 0;
    }
    this.fft.fft(real, imag, true);
    let maxM = 1e-8;
    for (let i = 0; i < this.scope.scopePointCount / 2; i++) {
      const m = this.fft.magnitude(real[i], imag[i]);
      if (m > maxM)
        maxM = m;
    }
    this.fftMaxMagnitude = maxM;
    this.fftReal = real;
    this.fftImag = imag;
    let prevX = 0;
    g.setColor("#FF0000");
    if (!this.logSpectrum) {
      let prevHeight = 0;
      const y = this.scope.rect.height - 1 - 12;
      for (let i = 0; i < this.scope.scopePointCount / 2; i++) {
        const x = Math.floor(2 * i * this.scope.rect.width / this.scope.scopePointCount);
        const magnitude = this.fft.magnitude(real[i], imag[i]);
        const height = Math.floor(magnitude * y / maxM);
        if (x !== prevX)
          g.drawLine(prevX, y - prevHeight, x, y - height);
        prevHeight = height;
        prevX = x;
      }
    } else {
      const dbRange = 80;
      const topMargin = 5;
      const bottomMargin = 12;
      const plotHeight = this.scope.rect.height - topMargin - bottomMargin;
      const pixelsPerDb = plotHeight / dbRange;
      let prevY = 0;
      for (let db = -20; db >= -80; db -= 20) {
        const y = topMargin + Math.floor(-db * pixelsPerDb);
        if (y < 0 || y >= this.scope.rect.height)
          continue;
        g.setColor("#880000");
        g.drawLine(0, y, this.scope.rect.width, y);
        g.setColor("#FF0000");
        g.drawString(db + " dB", 2, y - 2);
      }
      g.setColor("#FF0000");
      for (let i = 0; i < this.scope.scopePointCount / 2; i++) {
        const x = Math.floor(2 * i * this.scope.rect.width / this.scope.scopePointCount);
        const magnitude = this.fft.magnitude(real[i], imag[i]);
        let db = 20 * Math.log(magnitude / maxM) / Math.log(10);
        if (db < -dbRange)
          db = -dbRange;
        const y = topMargin + Math.floor(-db * pixelsPerDb);
        if (x !== prevX)
          g.drawLine(prevX, prevY, x, y);
        prevY = y;
        prevX = x;
      }
    }
  }
  drawPhaseAngle(g) {
    let vPlot = null;
    let iPlot = null;
    for (const p of this.scope.visiblePlots) {
      if (p.units === UNITS_V) {
        if (vPlot !== null) return;
        vPlot = p;
      } else if (p.units === UNITS_A) {
        if (iPlot !== null) return;
        iPlot = p;
      } else
        return;
    }
    if (vPlot === null || iPlot === null)
      return;
    if (this.fft === null || this.fft.getSize() !== this.scope.scopePointCount)
      this.fft = new FFT(this.scope.scopePointCount);
    const vReal = new Array(this.scope.scopePointCount).fill(0);
    const vImag = new Array(this.scope.scopePointCount).fill(0);
    const iReal = new Array(this.scope.scopePointCount).fill(0);
    const iImag = new Array(this.scope.scopePointCount).fill(0);
    const ipa = this.scope.displayStartIndex(vPlot, this.scope.rect.width);
    const validCount = this.scope.validDataCount(vPlot, ipa, this.scope.rect.width);
    for (let i = 0; i < validCount; i++) {
      const ip = i + ipa & this.scope.scopePointCount - 1;
      vReal[i] = 0.5 * (vPlot.maxValues[ip] + vPlot.minValues[ip]);
      iReal[i] = 0.5 * (iPlot.maxValues[ip] + iPlot.minValues[ip]);
    }
    this.fft.fft(vReal, vImag, true);
    this.fft.fft(iReal, iImag, true);
    let fund = 1;
    let maxM = 0;
    for (let i = 1; i < this.scope.scopePointCount / 2; i++) {
      const m = this.fft.magnitude(vReal[i], vImag[i]);
      if (m > maxM) {
        maxM = m;
        fund = i;
      }
    }
    if (maxM < 1e-8)
      return;
    const angleV = Math.atan2(vImag[fund], vReal[fund]);
    const angleI = Math.atan2(iImag[fund], iReal[fund]);
    let angle = (angleV - angleI) * 180 / Math.PI;
    while (angle > 180) angle -= 360;
    while (angle < -180) angle += 360;
    this.scope.drawInfoText(g, Locale.LS("Phase angle: ") + CircuitElm.showFormat.format(angle) + "°");
  }
  addCursorInfo(info, ct, mouseCursorX) {
    const maxFrequency = 1 / (this.scope.sim.maxTimeStep * this.scope.speed * 2);
    info[ct++] = CircuitElm.getUnitText(maxFrequency * (mouseCursorX - this.scope.rect.x) / this.scope.rect.width, "Hz");
    if (this.fft !== null && this.fftReal !== null && this.fftMaxMagnitude > 0) {
      const fftIndex = Math.floor((mouseCursorX - this.scope.rect.x) * this.scope.scopePointCount / (2 * this.scope.rect.width));
      if (fftIndex >= 0 && fftIndex < this.scope.scopePointCount / 2) {
        const mag = this.fft.magnitude(this.fftReal[fftIndex], this.fftImag[fftIndex]);
        const db = 20 * Math.log(mag / this.fftMaxMagnitude) / Math.log(10);
        info[ct++] = Math.round(db) + " dB";
      }
    }
    return ct;
  }
}

class ScopeOverlays {
  scope;
  textY = 0;
  constructor(scope) {
    this.scope = scope;
  }
  // true if `lines` more lines of text fit in the top half of the scope, so
  // optional text (label, legend) doesn't cover the waveform in short scopes
  hasRoomForText(lines) {
    return this.textY + 15 * (lines - 1) <= this.scope.rect.height / 2;
  }
  drawInfoText(g, text) {
    if (this.scope.rect.height <= this.textY + 5)
      return;
    g.drawString(text, 0, this.textY);
    this.textY += 15;
  }
  drawScale(plot, g) {
    if (!this.scope.isManualScale()) {
      if (this.scope.gridStepY !== 0 && !(this.scope.showV && this.scope.showI)) {
        const vScaleText = " V=" + plot.getUnitText(this.scope.gridStepY) + "/div";
        this.drawInfoText(g, "H=" + CircuitElm.getUnitText(this.scope.gridStepX, "s") + "/div" + vScaleText);
      }
    } else {
      if (this.scope.rect.height <= this.textY + 5)
        return;
      let x = 0;
      const hs = "H=" + CircuitElm.getUnitText(this.scope.gridStepX, "s") + "/div";
      g.drawString(hs, 0, this.textY);
      x += g.measureWidth(hs);
      const bulletWidth = 17;
      for (let i = 0; i < this.scope.visiblePlots.length; i++) {
        const p = this.scope.visiblePlots[i];
        const s = p.getUnitText(p.manScale);
        if (p !== null) {
          const vScaleText = "=" + s + "/div";
          const vScaleWidth = g.measureWidth(vScaleText);
          if (x + bulletWidth + vScaleWidth > this.scope.rect.width) {
            x = 0;
            this.textY += 15;
            if (this.scope.rect.height <= this.textY + 5)
              return;
          }
          g.setColor(p.color);
          g.fillOval(x + 7, this.textY - 9, 8, 8);
          x += bulletWidth;
          g.setColor(CircuitElm.whiteColor);
          g.drawString(vScaleText, x, this.textY);
          x += vScaleWidth;
        }
      }
      this.textY += 15;
    }
  }
  // shared cycle-detection loop for drawAverage, drawRMS, drawDutyCycle.
  // calls onCycleStart at first rising edge, onSample each sample thereafter,
  // onCycleEnd at each subsequent rising edge.  returns end-start span, or 0.
  iterateCycles(sdi, mid, onCycleStart, onSample, onCycleEnd) {
    const fnz = sdi.skipNonzeroValues();
    let state = fnz > mid ? 1 : -1;
    let waveCount = 0;
    let start = 0, end = 0;
    for (const i of sdi) {
      let sw = false;
      if (state === 1) {
        if (sdi.getMax() < mid) sw = true;
      } else if (sdi.getMin() > mid) sw = true;
      if (sw) {
        state = -state;
        if (state === 1) {
          if (waveCount === 0) {
            start = i;
            onCycleStart();
          } else {
            end = i;
            onCycleEnd();
          }
          waveCount++;
        }
      }
      if (waveCount > 0)
        onSample();
    }
    return end - start;
  }
  makeSdi(plot) {
    const ipa = this.scope.displayStartIndex(plot, this.scope.rect.width);
    const validCount = this.scope.validDataCount(plot, ipa, this.scope.rect.width);
    return new ScopeDataIterator(this.scope.scopePointCount, ipa, validCount, plot);
  }
  drawRMS(g) {
    if (!this.scope.canShowRMS()) {
      this.scope.showRMS = false;
      this.scope.showAverage = true;
      this.drawAverage(g);
      return;
    }
    const plot = this.scope.visiblePlots[0];
    const mid = (this.scope.maxValue + this.scope.minValue) / 2;
    const sdi = this.makeSdi(plot);
    let avg = 0, endAvg = 0;
    const span = this.iterateCycles(
      sdi,
      mid,
      () => {
        avg = 0;
      },
      () => {
        const m = (sdi.getMax() + sdi.getMin()) * 0.5;
        avg += m * m;
      },
      () => {
        endAvg = avg;
      }
    );
    if (span > 0)
      this.drawInfoText(g, plot.getUnitText(Math.sqrt(endAvg / span)) + "rms");
  }
  drawAverage(g) {
    const plot = this.scope.visiblePlots[0];
    const mid = (this.scope.maxValue + this.scope.minValue) / 2;
    const sdi = this.makeSdi(plot);
    let avg = 0, endAvg = 0;
    const span = this.iterateCycles(
      sdi,
      mid,
      () => {
        avg = 0;
      },
      () => {
        avg += (sdi.getMax() + sdi.getMin()) * 0.5;
      },
      () => {
        endAvg = avg;
      }
    );
    if (span > 0)
      this.drawInfoText(g, plot.getUnitText(endAvg / span) + Locale.LS(" average"));
  }
  drawDutyCycle(g) {
    const plot = this.scope.visiblePlots[0];
    const mid = (this.scope.maxValue + this.scope.minValue) / 2;
    const sdi = this.makeSdi(plot);
    let dutyLen = 0, prevDuty = 0;
    const span = this.iterateCycles(
      sdi,
      mid,
      () => {
        dutyLen = 0;
      },
      () => {
        if (sdi.getMax() > mid) dutyLen++;
      },
      () => {
        prevDuty = dutyLen;
      }
    );
    if (span > 0)
      this.drawInfoText(g, Locale.LS("Duty cycle ") + Math.trunc(100 * prevDuty / span) + "%");
  }
  drawFrequency(g) {
    const plot = this.scope.visiblePlots[0];
    const sdi = this.makeSdi(plot);
    let avg = 0;
    for (const i of sdi)
      avg += sdi.getMin() + sdi.getMax();
    avg /= sdi.validCount * 2;
    let state = 0;
    const thresh = avg * 0.05;
    let oi = 0;
    let avperiod = 0;
    let periodct = -1;
    let avperiod2 = 0;
    for (const i of sdi) {
      const q = sdi.getMax() - avg;
      const os = state;
      if (q < thresh)
        state = 1;
      else if (q > -thresh)
        state = 2;
      if (state === 2 && os === 1) {
        const pd = i - oi;
        oi = i;
        if (pd < 12)
          continue;
        if (periodct >= 0) {
          avperiod += pd;
          avperiod2 += pd * pd;
        }
        periodct++;
      }
    }
    avperiod /= periodct;
    avperiod2 /= periodct;
    const periodstd = Math.sqrt(avperiod2 - avperiod * avperiod);
    const freq = 1 / (avperiod * this.scope.sim.maxTimeStep * this.scope.speed);
    if (periodct < 1 || periodstd > 2 || !isFinite(freq))
      return;
    this.drawInfoText(g, CircuitElm.getUnitText(freq, "Hz"));
  }
  drawElmInfo(g) {
    const info = [null];
    this.scope.getElm().getInfo(info);
    for (let i = 0; info[i] != null; i++)
      this.drawInfoText(g, info[i]);
  }
  // legend showing each plot's color and description, used when multiple plots are combined
  // in one scope (so a plain text label can't identify which trace is which)
  drawLegend(g) {
    const plots = this.scope.visiblePlots;
    const order = plots.map((_, i) => i);
    if (this.scope.manualScale)
      order.sort((a, b) => plots[b].manVPosition - plots[a].manVPosition);
    for (const i of order) {
      if (this.scope.rect.height <= this.textY + 5)
        return;
      const plot = plots[i];
      const label = plot.elm !== null ? Locale.LS(plot.elm.getScopeText(plot.value)) : "Plot " + (i + 1);
      g.setColor(plot.color);
      g.fillRect(0, this.textY - 9, 10, 10);
      g.setColor(CircuitElm.whiteColor);
      g.drawString(label, 16, this.textY);
      this.textY += 15;
    }
  }
  // true if this scope is stacked under another scope with the same label, so we
  // don't repeat it (e.g. several stacked "logic output" scopes)
  sameLabelAsScopeAbove(t) {
    const scope = this.scope;
    if (scope.position < 0 || scope.exporting)
      return false;
    const mgr = scope.app.scopeManager;
    const i = mgr.scopes.indexOf(scope);
    if (i <= 0 || i >= mgr.scopeCount)
      return false;
    const above = mgr.scopes[i - 1];
    return above.position === scope.position && above.getScopeLabelOrText(true) === t;
  }
  draw(g) {
    g.setColor(CircuitElm.whiteColor);
    this.textY = 10;
    if (this.scope.visiblePlots.length === 0) {
      if (this.scope.showElmInfo)
        this.drawElmInfo(g);
      return;
    }
    const plot = this.scope.visiblePlots[0];
    if (this.scope.showScale)
      this.drawScale(plot, g);
    if (this.scope.showMax)
      this.drawInfoText(g, "Max=" + plot.getUnitText(this.scope.maxValue));
    if (this.scope.showMin) {
      const ym = this.scope.rect.height - 5;
      g.drawString("Min=" + plot.getUnitText(this.scope.minValue), 0, ym);
    }
    if (this.scope.showP2P)
      this.drawInfoText(g, "P-P=" + plot.getUnitText(this.scope.maxValue - this.scope.minValue));
    if (this.scope.showRMS)
      this.drawRMS(g);
    if (this.scope.showAverage)
      this.drawAverage(g);
    if (this.scope.showDutyCycle)
      this.drawDutyCycle(g);
    const t = this.scope.getScopeLabelOrText(true);
    if (t != null && t !== "") {
      if (!this.sameLabelAsScopeAbove(t) && (this.scope.text !== null || this.hasRoomForText(1)))
        this.drawInfoText(g, t);
    } else if (this.scope.visiblePlots.length > 1 && this.hasRoomForText(this.scope.visiblePlots.length))
      this.drawLegend(g);
    if (this.scope.showFreq)
      this.drawFrequency(g);
    if (this.scope.showElmInfo)
      this.drawElmInfo(g);
    if (this.scope.fftPlot.showPhaseAngle)
      this.scope.fftPlot.drawPhaseAngle(g);
  }
}

class ScopeTrigger {
  // Trigger mode constants
  static TRIGGER_FREERUN = 0;
  static TRIGGER_NORMAL = 1;
  static TRIGGER_AUTO = 2;
  // Trigger edge constants
  static TRIGGER_EDGE_RISING = 0;
  static TRIGGER_EDGE_FALLING = 1;
  // Trigger state machine states
  static TRIG_STATE_ARMED = 0;
  static TRIG_STATE_TRIGGERED = 1;
  static TRIG_STATE_AUTO_RUN = 2;
  // Configuration
  mode = ScopeTrigger.TRIGGER_FREERUN;
  edge = ScopeTrigger.TRIGGER_EDGE_RISING;
  level = 0;
  // State machine
  state = ScopeTrigger.TRIG_STATE_ARMED;
  ptr = 0;
  prevValue = 0;
  holdoff = 0;
  autoTimeout = 0;
  waiting = false;
  time = 0;
  fired = false;
  lastCheckPtr = -1;
  isActive() {
    return this.mode !== ScopeTrigger.TRIGGER_FREERUN;
  }
  isTriggered() {
    return this.isActive() && this.fired && this.state !== ScopeTrigger.TRIG_STATE_AUTO_RUN;
  }
  // Returns the start index for display, accounting for trigger mode.
  displayStartIndex(plot, w, scopePointCount) {
    if (this.mode === ScopeTrigger.TRIGGER_FREERUN || !this.fired || this.state === ScopeTrigger.TRIG_STATE_AUTO_RUN)
      return plot.startIndex(w);
    return this.ptr + scopePointCount - w / 2;
  }
  // Returns the number of valid data points to display, clamped to width w.
  // In triggered mode, data beyond plot.ptr is stale (old circular buffer
  // contents) and must not be drawn or used for measurements.
  validDataCount(plot, ipa, w, scopePointCount) {
    if (!this.isTriggered())
      return w;
    const count = (plot.ptr - ipa & scopePointCount - 1) + 1;
    return Math.min(count, w);
  }
  dumpXml(xmlElm) {
    if (!this.isActive())
      return;
    CircuitXMLSerializer.dumpAttr(xmlElm, "triggerMode", this.mode);
    CircuitXMLSerializer.dumpAttr(xmlElm, "triggerEdge", this.edge);
    CircuitXMLSerializer.dumpAttr(xmlElm, "triggerLevel", this.level);
  }
  // Must be called before xml.parseChildElement() to ensure attrs are read from the parent element
  undumpXml(xml) {
    this.mode = xml.parseIntAttr("triggerMode", ScopeTrigger.TRIGGER_FREERUN);
    this.edge = xml.parseIntAttr("triggerEdge", ScopeTrigger.TRIGGER_EDGE_RISING);
    this.level = xml.parseDoubleAttr("triggerLevel", 0);
  }
  // Reset trigger state; called from Scope.resetGraph().
  reset(scopePointCount) {
    this.state = ScopeTrigger.TRIG_STATE_ARMED;
    this.holdoff = 0;
    this.waiting = false;
    this.fired = false;
    this.lastCheckPtr = -1;
    this.autoTimeout = 2 * scopePointCount;
  }
  // Trigger edge detection and state machine, called every time the plot ptr advances.
  check(visiblePlots, plot2d, sim, scopePointCount, rectWidth) {
    if (this.mode === ScopeTrigger.TRIGGER_FREERUN || visiblePlots.length === 0 || plot2d)
      return;
    const plot = visiblePlots[0];
    const currentPtr = plot.ptr;
    if (currentPtr === this.lastCheckPtr)
      return;
    this.lastCheckPtr = currentPtr;
    const val = (plot.maxValues[currentPtr] + plot.minValues[currentPtr]) * 0.5;
    let edgeCrossing;
    if (this.edge === ScopeTrigger.TRIGGER_EDGE_RISING)
      edgeCrossing = this.prevValue < this.level && val >= this.level;
    else
      edgeCrossing = this.prevValue > this.level && val <= this.level;
    switch (this.state) {
      case ScopeTrigger.TRIG_STATE_ARMED:
        if (edgeCrossing) {
          this.state = ScopeTrigger.TRIG_STATE_TRIGGERED;
          this.ptr = currentPtr;
          this.time = sim.t;
          this.holdoff = 0;
          this.waiting = false;
          this.fired = true;
        } else {
          this.waiting = true;
          if (this.mode === ScopeTrigger.TRIGGER_AUTO) {
            this.holdoff++;
            if (this.holdoff >= this.autoTimeout) {
              this.state = ScopeTrigger.TRIG_STATE_AUTO_RUN;
              this.waiting = false;
            }
          }
        }
        break;
      case ScopeTrigger.TRIG_STATE_TRIGGERED:
        this.holdoff++;
        if (this.holdoff >= rectWidth) {
          this.state = ScopeTrigger.TRIG_STATE_ARMED;
          this.holdoff = 0;
        }
        break;
      case ScopeTrigger.TRIG_STATE_AUTO_RUN:
        if (edgeCrossing) {
          this.state = ScopeTrigger.TRIG_STATE_TRIGGERED;
          this.ptr = currentPtr;
          this.time = sim.t;
          this.holdoff = 0;
          this.fired = true;
        }
        break;
    }
    this.prevValue = val;
  }
  // Draw trigger indicator: dashed level line, edge arrow, and status text
  drawIndicator(g, visiblePlots, rect) {
    if (this.mode === ScopeTrigger.TRIGGER_FREERUN || visiblePlots.length === 0)
      return;
    const plot = visiblePlots[0];
    const maxy = Math.trunc((rect.height - 1) / 2);
    const trigY = maxy - Math.trunc((this.level + plot.plotOffset) * plot.gridMult);
    if (trigY >= 0 && trigY < rect.height) {
      g.setColor("#FF8000");
      for (let x = 0; x < rect.width; x += 8) {
        const x2 = Math.min(x + 4, rect.width - 1);
        g.drawLine(x, trigY, x2, trigY);
      }
      const edgeText = this.edge === ScopeTrigger.TRIGGER_EDGE_RISING ? "T↑" : "T↓";
      g.drawString(edgeText, rect.width - 25, trigY - 3);
    }
    let statusText;
    switch (this.state) {
      case ScopeTrigger.TRIG_STATE_ARMED:
        statusText = this.waiting ? "WAIT" : "ARMED";
        break;
      case ScopeTrigger.TRIG_STATE_TRIGGERED:
        statusText = "TRIG";
        break;
      case ScopeTrigger.TRIG_STATE_AUTO_RUN:
        statusText = "AUTO";
        break;
      default:
        statusText = "";
    }
    g.setColor("#FF8000");
    const sw = Math.trunc(g.measureWidth(statusText));
    g.drawString(statusText, rect.width - sw - 5, rect.height - 5);
  }
}

class Scope {
  static VAL_POWER = VAL_POWER;
  static VAL_POWER_OLD = VAL_POWER_OLD;
  static VAL_VOLTAGE = VAL_VOLTAGE;
  static VAL_CURRENT = VAL_CURRENT;
  static VAL_IB = VAL_IB;
  static VAL_IC = VAL_IC;
  static VAL_IE = VAL_IE;
  static VAL_VBE = VAL_VBE;
  static VAL_VBC = VAL_VBC;
  static VAL_VCE = VAL_VCE;
  static VAL_R = VAL_R;
  static VAL_CHARGE = VAL_CHARGE;
  static UNITS_V = UNITS_V;
  static UNITS_A = UNITS_A;
  static UNITS_W = UNITS_W;
  static UNITS_OHMS = UNITS_OHMS;
  static UNITS_C = UNITS_C;
  static UNITS_COUNT = UNITS_COUNT;
  static multa = multa;
  static V_POSITION_STEPS = V_POSITION_STEPS;
  static MIN_MAN_SCALE = MIN_MAN_SCALE;
  scopePointCount = 128;
  position;
  // speed is sim timestep units per pixel
  speed = 64;
  text = null;
  rect;
  manualScale = false;
  showI = false;
  showV = false;
  showScale = false;
  showMax = true;
  showMin = false;
  showP2P = false;
  showFreq = false;
  plot2d;
  fftPlot;
  overlays;
  serializer;
  maxScale = false;
  showNegative = false;
  showRMS = false;
  showAverage = false;
  showDutyCycle = false;
  showElmInfo = false;
  plots;
  visiblePlots;
  app;
  sim;
  // scopeTimeStep to check if sim timestep has changed from previous value when redrawing
  scopeTimeStep = 0;
  scale;
  // Max value to scale the display to show - indexed for each value of UNITS - e.g. UNITS_V, UNITS_A etc.
  reduceRange;
  wheelDeltaY = 0;
  selectedPlot = -1;
  properties = null;
  curColor = "";
  voltColor = "";
  gridStepX = 0;
  gridStepY = 0;
  maxValue = 0;
  minValue = 0;
  manDivisions;
  // Number of vertical divisions when in manual mode
  static lastManDivisions = 8;
  drawGridLines = true;
  somethingSelected = false;
  exporting = false;
  // drawing for PNG/SVG export; ignore mouse/menu selection
  trigger = new ScopeTrigger();
  static cursorTime = -1;
  static dragStartTime = -1;
  static cursorUnits = 0;
  static cursorScope = null;
  static draggingPlotYScope = null;
  draggingPlotY = false;
  dragPlotYMouseStart = 0;
  dragPlotYInitialPosition = 0;
  constructor(app_, sim_) {
    this.sim = sim_;
    this.app = app_;
    this.position = -1;
    this.scale = new Array(UNITS_COUNT).fill(0);
    this.reduceRange = new Array(UNITS_COUNT).fill(false);
    this.manDivisions = Scope.lastManDivisions;
    this.rect = new Rectangle(0, 0, 1, 1);
    this.plots = [];
    this.visiblePlots = [];
    this.plot2d = new ScopePlot2d(this);
    this.fftPlot = new ScopeFFT(this);
    this.overlays = new ScopeOverlays(this);
    this.serializer = new ScopeSerializer(this);
    this.initialize();
  }
  showCurrent(b) {
    this.showI = b;
    if (b && !this.hasPlotValue(VAL_CURRENT)) {
      const ce = this.getElm();
      if (ce !== null)
        this.plots.push(new ScopePlot(ce, UNITS_A, VAL_CURRENT, this.getManScaleFromMaxScale(UNITS_A, false)));
    }
    this.calcVisiblePlots();
    this.resetGraph();
  }
  showVoltage(b) {
    this.showV = b;
    if (b && !this.hasPlotValue(VAL_VOLTAGE)) {
      const ce = this.getElm();
      if (ce !== null)
        this.plots.push(new ScopePlot(ce, UNITS_V, VAL_VOLTAGE, this.getManScaleFromMaxScale(UNITS_V, false)));
    }
    this.calcVisiblePlots();
    this.resetGraph();
  }
  // check if any plot has the given value (unlike showingValue which checks ALL plots)
  hasPlotValue(v) {
    for (let i = 0; i !== this.plots.length; i++) {
      if (this.plots[i].value === v)
        return true;
    }
    return false;
  }
  showPlotValue(val, b) {
    if (b) {
      if (!this.hasPlotValue(val)) {
        const ce = this.getElm();
        if (ce !== null) {
          const u = ce.getScopeUnits(val);
          this.plots.push(new ScopePlot(ce, u, val, this.getManScaleFromMaxScale(u, false)));
        }
      }
    } else {
      for (let i = this.plots.length - 1; i >= 0; i--) {
        if (this.plots[i].value === val && this.plots.length > 1)
          this.plots.splice(i, 1);
      }
    }
    this.calcVisiblePlots();
    this.resetGraph();
  }
  showCharge(b) {
    this.showPlotValue(VAL_CHARGE, b);
  }
  showPower(b) {
    this.showPlotValue(VAL_POWER, b);
  }
  showMaxF(b) {
    this.showMax = b;
  }
  showScaleF(b) {
    this.showScale = b;
  }
  showMinF(b) {
    this.showMin = b;
  }
  showP2PF(b) {
    this.showP2P = b;
  }
  showFreqF(b) {
    this.showFreq = b;
  }
  setManualScale(value, roundup) {
    if (value !== this.manualScale)
      this.plot2d.clearView();
    this.manualScale = value;
    for (const p of this.plots) {
      if (!p.manScaleSet) {
        p.manScale = this.getManScaleFromMaxScale(p.units, roundup);
        p.manVPosition = 0;
        p.manScaleSet = true;
      }
    }
  }
  resetGraph(full = false) {
    this.resetGraphFull(full);
  }
  resetGraphFull(full) {
    this.scopePointCount = 1;
    while (this.scopePointCount <= this.rect.width)
      this.scopePointCount *= 2;
    if (this.trigger.isActive())
      this.scopePointCount *= 2;
    if (this.plots === null)
      this.plots = [];
    this.showNegative = false;
    let i;
    for (i = 0; i !== this.plots.length; i++)
      this.plots[i].reset(this.scopePointCount, this.speed, full);
    this.calcVisiblePlots();
    this.scopeTimeStep = this.sim.maxTimeStep;
    this.plot2d.allocImage();
    this.trigger.reset(this.scopePointCount);
    this.plot2d.lastTrailSimTime = -1;
  }
  setManualScaleValue(plotId, d) {
    if (plotId >= this.visiblePlots.length)
      return;
    this.plot2d.clearView();
    this.visiblePlots[plotId].manScale = d;
    this.visiblePlots[plotId].manScaleSet = true;
  }
  getScaleValue() {
    if (this.visiblePlots.length === 0)
      return 0;
    const p = this.visiblePlots[0];
    return this.scale[p.units];
  }
  getScaleUnitsText() {
    if (this.visiblePlots.length === 0)
      return "V";
    const p = this.visiblePlots[0];
    return Scope.getScaleUnitsTextStatic(p.units);
  }
  static getScaleUnitsTextStatic(units) {
    switch (units) {
      case UNITS_A:
        return "A";
      case UNITS_OHMS:
        return Locale.ohmString;
      case UNITS_W:
        return "W";
      case UNITS_C:
        return "C";
      default:
        return "V";
    }
  }
  setManDivisions(d) {
    this.manDivisions = Scope.lastManDivisions = d;
  }
  active() {
    return this.plots.length > 0 && this.plots[0].elm !== null;
  }
  isTriggered() {
    return this.trigger.isTriggered();
  }
  displayStartIndex(plot, w) {
    return this.trigger.displayStartIndex(plot, w, this.scopePointCount);
  }
  validDataCount(plot, ipa, w) {
    return this.trigger.validDataCount(plot, ipa, w, this.scopePointCount);
  }
  checkTrigger() {
    this.trigger.check(this.visiblePlots, this.plot2d.enabled, this.sim, this.scopePointCount, this.rect.width);
  }
  setTriggerMode(mode) {
    this.trigger.mode = mode;
    this.resetGraph();
  }
  drawTriggerIndicator(g) {
    this.trigger.drawIndicator(g, this.visiblePlots, this.rect);
  }
  initialize() {
    this.resetGraph();
    this.scale[UNITS_W] = this.scale[UNITS_OHMS] = this.scale[UNITS_V] = this.scale[UNITS_C] = 5;
    this.scale[UNITS_A] = 0.1;
    this.plot2d.scaleX = 5;
    this.plot2d.scaleY = 0.1;
    this.plot2d.enabled = false;
    this.speed = 64;
    this.showMax = true;
    this.showV = this.showI = false;
    this.showScale = this.showFreq = this.manualScale = this.showMin = this.showP2P = this.showElmInfo = false;
    this.fftPlot.enabled = false;
    if (!this.serializer.loadDefaults()) {
      let i;
      for (i = 0; i !== this.plots.length; i++) {
        const plot = this.plots[i];
        if (plot.units === UNITS_V)
          this.showV = true;
        if (plot.units === UNITS_A)
          this.showI = true;
      }
    }
  }
  calcVisiblePlots() {
    this.visiblePlots = [];
    let i;
    let vc = 0, ac = 0, oc = 0;
    if (!this.plot2d.enabled) {
      for (i = 0; i !== this.plots.length; i++) {
        const plot = this.plots[i];
        if (plot.value === VAL_VOLTAGE) {
          if (this.showV) {
            this.visiblePlots.push(plot);
            plot.assignColor(vc++);
          }
        } else if (plot.value === VAL_CURRENT) {
          if (this.showI) {
            this.visiblePlots.push(plot);
            plot.assignColor(ac++);
          }
        } else {
          this.visiblePlots.push(plot);
          plot.assignColor(oc++);
        }
      }
    } else {
      for (i = 0; i < this.plots.length; i++)
        this.visiblePlots.push(this.plots[i]);
    }
  }
  setRect(r) {
    const w = this.rect.width;
    const h = this.rect.height;
    this.rect = r;
    if (this.rect.width !== w || this.plot2d.plotXY && this.rect.height !== h)
      this.resetGraph();
  }
  getWidth() {
    return this.rect.width;
  }
  rightEdge() {
    return this.rect.x + this.rect.width;
  }
  setElm(ce) {
    this.plots = [];
    if (ce !== null && ce.isTransistorElm())
      this.setValue(VAL_VCE, ce);
    else
      this.setValue(0, ce);
    this.initialize();
  }
  addElm(ce) {
    if (ce.isTransistorElm())
      this.addValue(VAL_VCE, ce);
    else
      this.addValue(0, ce);
  }
  setValueNum(val) {
    if (this.plots.length > 2 || this.plots.length === 0)
      return;
    const ce = this.plots[0].elm;
    if (this.plots.length === 2 && this.plots[1].elm !== ce)
      return;
    this.plot2d.enabled = this.plot2d.plotXY = false;
    this.setValue(val, ce);
  }
  addValue(val, ce) {
    if (val === 0) {
      this.plots.push(new ScopePlot(ce, UNITS_V, VAL_VOLTAGE, this.getManScaleFromMaxScale(UNITS_V, false)));
      if (ce !== null && this.app.menus.dotsCheckItem.getState() && !ce.isOutputElm() && !ce.isLogicOutputElm() && !ce.isAudioOutputElm() && !ce.isTestPointElm() && !ce.isProbeElm())
        this.plots.push(new ScopePlot(ce, UNITS_A, VAL_CURRENT, this.getManScaleFromMaxScale(UNITS_A, false)));
    } else {
      if (ce === null) return;
      const u = ce.getScopeUnits(val);
      this.plots.push(new ScopePlot(ce, u, val, this.getManScaleFromMaxScale(u, false)));
      if (u === UNITS_V)
        this.showV = true;
      if (u === UNITS_A)
        this.showI = true;
    }
    this.calcVisiblePlots();
    this.resetGraph();
  }
  setValue(val, ce) {
    if (ce !== void 0) {
      this.plots = [];
      this.addValue(val, ce);
    } else {
      this.setValueNum(val);
    }
  }
  setValues(val, ival, ce, yelm) {
    if (ival > 0) {
      this.plots = [];
      if (ce === null) return;
      this.plots.push(new ScopePlot(ce, ce.getScopeUnits(val), val, this.getManScaleFromMaxScale(ce.getScopeUnits(val), false)));
      this.plots.push(new ScopePlot(ce, ce.getScopeUnits(ival), ival, this.getManScaleFromMaxScale(ce.getScopeUnits(ival), false)));
      return;
    }
    if (yelm !== null) {
      this.plots = [];
      if (ce === null) return;
      this.plots.push(new ScopePlot(ce, ce.getScopeUnits(val), 0, this.getManScaleFromMaxScale(ce.getScopeUnits(val), false)));
      this.plots.push(new ScopePlot(yelm, ce.getScopeUnits(ival), 0, this.getManScaleFromMaxScale(ce.getScopeUnits(val), false)));
      return;
    }
    this.setValueNum(val);
  }
  setText(s) {
    this.text = s;
  }
  getText() {
    return this.text;
  }
  showingValue(v) {
    let i;
    for (i = 0; i !== this.plots.length; i++) {
      const sp = this.plots[i];
      if (sp.value !== v)
        return false;
    }
    return true;
  }
  // returns true if we have a plot of voltage and nothing else (except current or charge).
  // The default case is a plot of voltage and current, so we're basically checking if that case is true.
  // Charge is also allowed since it coexists additively with voltage and current.
  showingVoltageAndMaybeCurrent() {
    let i;
    let gotv = false;
    for (i = 0; i !== this.plots.length; i++) {
      const sp = this.plots[i];
      if (sp.value === VAL_VOLTAGE)
        gotv = true;
      else if (sp.value !== VAL_CURRENT && sp.value !== VAL_CHARGE)
        return false;
    }
    return gotv;
  }
  combine(s) {
    this.plots = this.visiblePlots;
    this.plots.push(...s.visiblePlots);
    s.plots.length = 0;
    this.calcVisiblePlots();
  }
  // separate this scope's plots into separate scopes and return them in arr[pos], arr[pos+1], etc.  return new length of array.
  separate(arr, pos) {
    let i;
    let lastPlot = null;
    for (i = 0; i !== this.visiblePlots.length; i++) {
      if (pos >= arr.length)
        return pos;
      const s = new Scope(this.app, this.sim);
      const sp = this.visiblePlots[i];
      if (lastPlot !== null && lastPlot.elm === sp.elm && lastPlot.value === VAL_VOLTAGE && sp.value === VAL_CURRENT)
        continue;
      s.setValue(sp.value, sp.elm);
      s.position = pos;
      arr[pos++] = s;
      lastPlot = sp;
      s.serializer.setFlags(this.serializer.getFlags());
      s.setSpeed(this.speed);
    }
    return pos;
  }
  removePlot(plot) {
    if (plot < this.visiblePlots.length) {
      const p = this.visiblePlots[plot];
      const idx = this.plots.indexOf(p);
      if (idx >= 0)
        this.plots.splice(idx, 1);
      this.calcVisiblePlots();
    }
  }
  // called for each timestep
  timeStep() {
    let i;
    for (i = 0; i !== this.plots.length; i++)
      this.plots[i].timeStep();
    this.checkTrigger();
    if (this.plot2d.enabled)
      this.plot2d.timeStep();
  }
  /*
  void adjustScale(double x) {
      scale[UNITS_V] *= x;
      scale[UNITS_A] *= x;
      scale[UNITS_OHMS] *= x;
      scale[UNITS_W] *= x;
      scaleX *= x;
      scaleY *= x;
  }
  */
  setMaxScale(s) {
    this.maxScaleToggle();
    this.maxScale = s;
  }
  maxScaleToggle() {
    if (this.plot2d.enabled) {
      this.plot2d.maxScale();
      return;
    }
    this.maxScale = !this.maxScale;
    this.showNegative = false;
  }
  drawSettingsWheel(g) {
    const outR = 8;
    const inR = 5;
    const inR45 = 4;
    const outR45 = 6;
    if (this.showSettingsWheel()) {
      g.context.save();
      if (this.cursorInSettingsWheel())
        g.setColor(CircuitElm.selectColor);
      else
        g.setColor(Color.dark_gray);
      g.context.translate(this.rect.x + 18, this.rect.y + this.rect.height - 18);
      CircuitElm.drawThickCircle(g, 0, 0, inR);
      CircuitElm.drawThickLine(g, -outR, 0, -inR, 0);
      CircuitElm.drawThickLine(g, outR, 0, inR, 0);
      CircuitElm.drawThickLine(g, 0, -outR, 0, -inR);
      CircuitElm.drawThickLine(g, 0, outR, 0, inR);
      CircuitElm.drawThickLine(g, -outR45, -outR45, -inR45, -inR45);
      CircuitElm.drawThickLine(g, outR45, -outR45, inR45, -inR45);
      CircuitElm.drawThickLine(g, -outR45, outR45, -inR45, inR45);
      CircuitElm.drawThickLine(g, outR45, outR45, inR45, inR45);
      g.context.restore();
    }
  }
  showSettingsWheel() {
    return this.rect.height > 100 && this.rect.width > 100;
  }
  cursorInSettingsWheel() {
    return this.showSettingsWheel() && this.app.mouse.mouseCursorX >= this.rect.x && this.app.mouse.mouseCursorX <= this.rect.x + 36 && this.app.mouse.mouseCursorY >= this.rect.y + this.rect.height - 36 && this.app.mouse.mouseCursorY <= this.rect.y + this.rect.height;
  }
  // does another scope have something selected?
  checkForSelectionElsewhere() {
    if (Scope.cursorScope === this)
      return;
    if (this.draggingPlotY)
      return;
    if (Scope.cursorScope === null || this.visiblePlots.length === 0) {
      this.selectedPlot = -1;
      return;
    }
    let i;
    for (i = 0; i !== this.visiblePlots.length; i++) {
      const p = this.visiblePlots[i];
      if (p.units === Scope.cursorUnits) {
        this.selectedPlot = i;
        return;
      }
    }
    this.selectedPlot = 0;
  }
  draw(g) {
    this.drawImpl(g, false);
  }
  // forExport suppresses mouse-driven UI chrome (settings wheel, selection highlight
  // wash, cursor readout) that shouldn't appear in an exported PNG/SVG
  drawImpl(g, forExport) {
    if (this.plots.length === 0)
      return;
    if (this.scopeTimeStep !== this.sim.maxTimeStep) {
      this.scopeTimeStep = this.sim.maxTimeStep;
      this.resetGraph();
    }
    if (this.plot2d.enabled) {
      this.plot2d.draw(g);
      return;
    }
    if (!forExport)
      this.drawSettingsWheel(g);
    g.context.save();
    g.setColor(Color.red);
    g.context.translate(this.rect.x, this.rect.y);
    g.clipRect(0, 0, this.rect.width, this.rect.height);
    if (this.fftPlot.enabled) {
      this.fftPlot.drawVerticalGridLines(g);
      this.fftPlot.draw(g);
    }
    let i;
    for (i = 0; i !== UNITS_COUNT; i++) {
      this.reduceRange[i] = false;
      if (this.maxScale && !this.manualScale)
        this.scale[i] = 1e-4;
    }
    let si;
    this.somethingSelected = false;
    for (si = 0; si !== this.visiblePlots.length; si++) {
      const plot = this.visiblePlots[si];
      this.calcPlotScale(plot);
      if (this.app.scopeManager.scopeSelected === -1 && plot.elm !== null && plot.elm.isMouseElm() && !this.exporting)
        this.somethingSelected = true;
      this.reduceRange[plot.units] = true;
    }
    const sel = this.app.scopeManager.scopeMenuIsSelected(this) && !this.exporting;
    const somethingSelectedHere = this.somethingSelected;
    if (!this.exporting)
      this.checkForSelectionElsewhere();
    if (this.selectedPlot >= 0)
      this.somethingSelected = true;
    if (!forExport && (somethingSelectedHere || sel)) {
      g.context.save();
      g.context.globalAlpha = 0.15;
      g.setColor(CircuitElm.selectColor);
      g.fillRect(0, 0, this.rect.width, this.rect.height);
      g.context.restore();
    }
    if (this.getSingleElm() !== null)
      this.somethingSelected = false;
    this.drawGridLines = true;
    let allPlotsSameUnits = true;
    for (i = 1; i < this.visiblePlots.length; i++) {
      if (this.visiblePlots[i].units !== this.visiblePlots[0].units)
        allPlotsSameUnits = false;
    }
    if ((allPlotsSameUnits || this.showMax || this.showMin || this.showP2P) && this.visiblePlots.length > 0)
      this.calcMaxAndMin(this.visiblePlots[0].units);
    for (i = 0; i !== this.visiblePlots.length; i++) {
      if (this.visiblePlots[i].units > UNITS_A && i !== this.selectedPlot)
        this.drawPlot(g, this.visiblePlots[i], allPlotsSameUnits, false, sel);
    }
    for (i = 0; i !== this.visiblePlots.length; i++) {
      if (this.visiblePlots[i].units === UNITS_A && i !== this.selectedPlot)
        this.drawPlot(g, this.visiblePlots[i], allPlotsSameUnits, false, sel);
    }
    for (i = 0; i !== this.visiblePlots.length; i++) {
      if (this.visiblePlots[i].units === UNITS_V && i !== this.selectedPlot)
        this.drawPlot(g, this.visiblePlots[i], allPlotsSameUnits, false, sel);
    }
    if (this.selectedPlot >= 0 && this.selectedPlot < this.visiblePlots.length)
      this.drawPlot(g, this.visiblePlots[this.selectedPlot], allPlotsSameUnits, true, sel);
    this.drawTriggerIndicator(g);
    this.overlays.draw(g);
    g.restore();
    if (!forExport)
      this.drawCursor(g);
    if (this.plots[0].ptr > 5 && !this.manualScale) {
      for (i = 0; i !== UNITS_COUNT; i++)
        if (this.scale[i] > 1e-4 && this.reduceRange[i])
          this.scale[i] /= 2;
    }
    if (this.properties !== null && this.properties.isShowing())
      this.properties.refreshDraw();
  }
  // calculate maximum and minimum values for all plots of given units
  calcMaxAndMin(units) {
    this.maxValue = -1e8;
    this.minValue = 1e8;
    for (const plot of this.visiblePlots) {
      if (plot.units !== units)
        continue;
      const ipa = this.displayStartIndex(plot, this.rect.width);
      const validCount = this.validDataCount(plot, ipa, this.rect.width);
      const sdi = new ScopeDataIterator(this.scopePointCount, ipa, validCount, plot);
      for (const i of sdi) {
        if (sdi.getMax() > this.maxValue)
          this.maxValue = sdi.getMax();
        if (sdi.getMin() < this.minValue)
          this.minValue = sdi.getMin();
      }
    }
  }
  // adjust scale of a plot
  calcPlotScale(plot) {
    if (this.manualScale)
      return;
    let max = 0;
    let gridMax = this.scale[plot.units];
    const ipa = this.displayStartIndex(plot, this.rect.width);
    const validCount = this.validDataCount(plot, ipa, this.rect.width);
    const sdi = new ScopeDataIterator(this.scopePointCount, ipa, validCount, plot);
    for (const i of sdi) {
      if (sdi.getMax() > max)
        max = sdi.getMax();
      if (sdi.getMin() < -max)
        max = -sdi.getMin();
    }
    if (this.maxScale)
      gridMax = Math.max(max, gridMax);
    else
      while (max > gridMax)
        gridMax *= 2;
    this.scale[plot.units] = gridMax;
  }
  calcGridStepX() {
    let multptr = 0;
    let gsx = 1e-15;
    const ts = this.sim.maxTimeStep * this.speed;
    while (gsx < ts * 20) {
      gsx *= multa[multptr++ % 3];
    }
    return gsx;
  }
  getGridMaxFromManScale(plot) {
    return (this.manDivisions / 2 + 0.05) * plot.manScale;
  }
  // Compute grid display parameters for a plot. Sets plot.plotOffset, plot.gridMult,
  // and this.gridStepY as side-effects; returns gridMid for use by callers.
  calcGridParams(plot, allPlotsSameUnits) {
    const maxy = Math.trunc((this.rect.height - 1) / 2);
    let gridMid, positionOffset, gridMax;
    if (!this.isManualScale()) {
      gridMax = this.scale[plot.units];
      gridMid = 0;
      positionOffset = 0;
      if (allPlotsSameUnits) {
        let mx = gridMax;
        let mn = 0;
        if (this.maxScale) {
          mx = this.maxValue;
          mn = this.minValue;
        } else if (this.showNegative || this.minValue < (mx + mn) * 0.5 - (mx - mn) * 0.55) {
          mn = -gridMax;
          this.showNegative = true;
        }
        gridMid = (mx + mn) * 0.5;
        gridMax = (mx - mn) * 0.55;
      }
      this.gridStepY = 1e-8;
      let multptr = 0;
      while (this.gridStepY < 20 * gridMax / maxy)
        this.gridStepY *= multa[multptr++ % 3];
    } else {
      gridMid = 0;
      gridMax = this.getGridMaxFromManScale(plot);
      positionOffset = gridMax * 2 * plot.manVPosition / V_POSITION_STEPS;
      this.gridStepY = plot.manScale;
    }
    plot.plotOffset = -gridMid + positionOffset;
    plot.gridMult = maxy / gridMax;
    return gridMid;
  }
  drawHVGridLines(g, plot, gridMid, allPlotsSameUnits, allSelected) {
    const maxy = Math.trunc((this.rect.height - 1) / 2);
    let minorDiv = "#404040";
    let majorDiv = "#A0A0A0";
    if (this.app.isPrintable()) {
      minorDiv = "#D0D0D0";
      majorDiv = "#808080";
      this.curColor = "#A0A000";
    }
    if (allSelected)
      majorDiv = CircuitElm.selectColor.getHexValue();
    const highlightCenter = !this.isManualScale();
    const showHGridLines = this.gridStepY !== 0 && (this.isManualScale() || allPlotsSameUnits);
    for (let ll = -100; ll <= 100; ll++) {
      if (ll !== 0 && !showHGridLines)
        continue;
      const yl = maxy - (ll * this.gridStepY - gridMid) * plot.gridMult;
      if (yl < 0 || yl >= this.rect.height - 1)
        continue;
      g.setColor(ll === 0 && highlightCenter ? majorDiv : minorDiv);
      g.drawLine(0, yl, this.rect.width - 1, yl);
    }
    const ts = this.sim.maxTimeStep * this.speed;
    const tRight = this.isTriggered() ? this.trigger.time + ts * this.rect.width / 2 : this.sim.t;
    const tstart = tRight - ts * this.rect.width;
    const tx = tRight - tRight % this.gridStepX;
    for (let ll = 0; ; ll++) {
      const tl = tx - this.gridStepX * ll;
      const gx = Math.trunc((tl - tstart) / ts);
      if (gx < 0)
        break;
      if (gx >= this.rect.width || tl < 0)
        continue;
      g.setColor((tl + this.gridStepX / 4) % (this.gridStepX * 10) < this.gridStepX ? majorDiv : minorDiv);
      g.drawLine(gx, 0, gx, this.rect.height - 1);
    }
  }
  drawPlot(g, plot, allPlotsSameUnits, selected, allSelected) {
    if (plot.elm === null)
      return;
    const maxy = Math.trunc((this.rect.height - 1) / 2);
    let color = this.somethingSelected ? "#A0A0A0" : plot.color;
    if (allSelected || this.app.scopeManager.scopeSelected === -1 && this.getSingleElm() === null && plot.elm.isMouseElm() && !this.exporting)
      color = CircuitElm.selectColor.getHexValue();
    else if (selected)
      color = plot.color;
    const ipa = this.displayStartIndex(plot, this.rect.width);
    const maxV = plot.maxValues;
    const minV = plot.minValues;
    const gridMid = this.calcGridParams(plot, allPlotsSameUnits);
    const minRangeLo = -10 - Math.trunc(gridMid * plot.gridMult);
    let minRangeHi = 10 - Math.trunc(gridMid * plot.gridMult);
    let curMinRangeLo = minRangeLo;
    this.gridStepX = this.calcGridStepX();
    if (this.drawGridLines)
      this.drawHVGridLines(g, plot, gridMid, allPlotsSameUnits, allSelected);
    this.drawGridLines = false;
    g.setColor(color);
    if (this.isManualScale()) {
      const y0 = maxy - Math.trunc(plot.gridMult * plot.plotOffset);
      g.drawLine(0, y0, 8, y0);
      g.drawString("0", 0, y0 - 2);
    }
    const drawWidth = this.validDataCount(plot, ipa, this.rect.width);
    let ox = -1, oy = -1;
    let i;
    for (i = 0; i !== drawWidth; i++) {
      const ip = i + ipa & this.scopePointCount - 1;
      const minvy = Math.round(plot.gridMult * (minV[ip] + plot.plotOffset));
      const maxvy = Math.round(plot.gridMult * (maxV[ip] + plot.plotOffset));
      if (minvy <= maxy) {
        if (minvy < curMinRangeLo || maxvy > minRangeHi) {
          this.reduceRange[plot.units] = false;
          curMinRangeLo = -1e3;
          minRangeHi = 1e3;
        }
        if (ox !== -1) {
          if (minvy === oy && maxvy === oy)
            continue;
          g.drawLine(ox, maxy - oy, i, maxy - oy);
          ox = oy = -1;
        }
        if (minvy === maxvy) {
          ox = i;
          oy = minvy;
          continue;
        }
        g.drawLine(i, maxy - minvy, i, maxy - maxvy);
      }
    }
    if (ox !== -1)
      g.drawLine(ox, maxy - oy, i - 1, maxy - oy);
  }
  static clearCursorInfo() {
    Scope.cursorScope = null;
    Scope.cursorTime = -1;
  }
  mouseXToTime(mouseX) {
    if (this.isTriggered())
      return this.trigger.time + this.sim.maxTimeStep * this.speed * (mouseX - this.rect.x - this.rect.width / 2);
    else
      return this.sim.t - this.sim.maxTimeStep * this.speed * (this.rect.x + this.rect.width - mouseX);
  }
  selectScope(mouseX, mouseY) {
    if (!this.rect.contains(mouseX, mouseY))
      return;
    if (this.plot2d.enabled || this.visiblePlots.length === 0)
      Scope.cursorTime = -1;
    else
      Scope.cursorTime = this.mouseXToTime(mouseX);
    this.checkForSelection(mouseX, mouseY);
    Scope.cursorScope = this;
  }
  mousePressed(mouseX, mouseY) {
    if (!this.rect.contains(mouseX, mouseY))
      return;
    if (this.plot2d.enabled || this.fftPlot.enabled || this.visiblePlots.length === 0)
      return;
    Scope.dragStartTime = this.mouseXToTime(mouseX);
  }
  // find selected plot
  checkForSelection(mouseX, mouseY) {
    if (this.app.modalDialogIsShowing())
      return;
    if (this.draggingPlotY)
      return;
    if (!this.rect.contains(mouseX, mouseY)) {
      this.selectedPlot = -1;
      return;
    }
    if (this.plots.length === 0) {
      this.selectedPlot = -1;
      return;
    }
    const ipa = this.displayStartIndex(this.plots[0], this.rect.width);
    const ip = mouseX - this.rect.x + ipa & this.scopePointCount - 1;
    const maxy = Math.trunc((this.rect.height - 1) / 2);
    const y = maxy;
    let i;
    let bestdist = 1e4;
    let best = -1;
    for (i = 0; i !== this.visiblePlots.length; i++) {
      const plot = this.visiblePlots[i];
      const maxvy = plot.gridMult * (plot.maxValues[ip] + plot.plotOffset);
      const dist = Math.abs(mouseY - (this.rect.y + y - maxvy));
      if (dist < bestdist) {
        bestdist = dist;
        best = i;
      }
    }
    this.selectedPlot = best;
    if (this.selectedPlot >= 0)
      Scope.cursorUnits = this.visiblePlots[this.selectedPlot].units;
  }
  timeToX(t) {
    if (this.isTriggered())
      return Math.trunc(this.rect.x + this.rect.width / 2 + (t - this.trigger.time) / (this.sim.maxTimeStep * this.speed));
    else
      return -Math.trunc((this.sim.t - t) / (this.sim.maxTimeStep * this.speed) - this.rect.x - this.rect.width);
  }
  // draw a dot on the selected plot at pixel x; return the plot value there, or NaN if out of range
  drawPlotDot(g, plot, x) {
    if (x < this.rect.x || x >= this.rect.x + this.rect.width)
      return NaN;
    const ipa = this.displayStartIndex(this.plots[0], this.rect.width);
    const ip = x - this.rect.x + ipa & this.scopePointCount - 1;
    const value = plot.maxValues[ip];
    const vy = plot.gridMult * (value + plot.plotOffset);
    const dotY = this.rect.y + Math.trunc((this.rect.height - 1) / 2) - vy;
    g.setColor(plot.color);
    if (dotY >= this.rect.y && dotY < this.rect.y + this.rect.height)
      g.fillOval(x - 2, dotY - 2, 5, 5);
    return value;
  }
  drawCursor(g) {
    if (this.app.modalDialogIsShowing())
      return;
    if (Scope.cursorScope === null)
      return;
    const info = new Array(7).fill(null);
    let cursorX = -1;
    let ct = 0;
    let cursorValue = NaN;
    const plot = this.visiblePlots.length > 0 ? this.visiblePlots[this.selectedPlot >= 0 ? this.selectedPlot : 0] : null;
    if (Scope.cursorTime >= 0) {
      cursorX = this.timeToX(Scope.cursorTime);
      if (plot !== null) {
        cursorValue = this.drawPlotDot(g, plot, cursorX);
        if (Scope.dragStartTime < 0 && !isNaN(cursorValue))
          info[ct++] = plot.getUnitText(cursorValue);
      }
    }
    if (this.fftPlot.enabled && Scope.cursorScope === this) {
      if (cursorX < 0)
        cursorX = this.app.mouse.mouseCursorX;
      ct = this.fftPlot.addCursorInfo(info, ct, this.app.mouse.mouseCursorX);
    } else if (cursorX < this.rect.x)
      return;
    if (Scope.dragStartTime >= 0 && Scope.cursorScope === this && plot !== null && !this.plot2d.enabled && !this.fftPlot.enabled) {
      const dragX = this.timeToX(Scope.dragStartTime);
      if (dragX >= this.rect.x && dragX < this.rect.x + this.rect.width) {
        g.setColor(CircuitElm.lightGrayColor);
        g.drawLine(dragX, this.rect.y, dragX, this.rect.y + this.rect.height);
        const startValue = this.drawPlotDot(g, plot, dragX);
        const deltaT = Scope.cursorTime - Scope.dragStartTime;
        info[ct++] = "Δt=" + CircuitElm.getTimeText(Math.abs(deltaT));
        if (!isNaN(cursorValue) && !isNaN(startValue)) {
          info[ct++] = "Δ=" + plot.getUnitText(cursorValue - startValue);
          info[ct++] = plot.getUnitText(cursorValue);
        }
      }
    }
    if (this.visiblePlots.length > 0)
      info[ct++] = CircuitElm.getTimeText(Scope.cursorTime);
    if (Scope.cursorScope !== this) {
      if (this.rect.height < 40 || this.position >= 0 && Scope.cursorScope.position === this.position) {
        this.drawCursorInfo(g, null, 0, cursorX, false);
        return;
      }
    }
    this.drawCursorInfo(g, info, ct, cursorX, false);
  }
  drawCursorInfo(g, info, ct, x, drawY) {
    let szw = 0, szh = 15 * ct;
    let i;
    if (info !== null) {
      for (i = 0; i !== ct; i++) {
        const w = g.context.measureText(info[i]).width;
        if (w > szw)
          szw = w;
      }
    }
    g.setColor(CircuitElm.whiteColor);
    g.drawLine(x, this.rect.y, x, this.rect.y + this.rect.height);
    if (drawY)
      g.drawLine(this.rect.x, this.app.mouse.mouseCursorY, this.rect.x + this.rect.width, this.app.mouse.mouseCursorY);
    g.setColor(this.app.isPrintable() ? Color.white : Color.black);
    let bx = x;
    if (bx < szw / 2)
      bx = szw / 2;
    g.fillRect(bx - szw / 2, this.rect.y - szh, szw, szh);
    if (info !== null) {
      g.setColor(CircuitElm.whiteColor);
      for (i = 0; i !== ct; i++) {
        const w = g.context.measureText(info[i]).width;
        g.drawString(info[i], bx - w / 2, this.rect.y - 2 - (ct - 1 - i) * 15);
      }
    }
  }
  canShowRMS() {
    if (this.visiblePlots.length === 0)
      return false;
    const plot = this.visiblePlots[0];
    return plot.units === UNITS_V || plot.units === UNITS_A;
  }
  drawInfoText(g, text) {
    this.overlays.drawInfoText(g, text);
  }
  getScopeText() {
    if (this.selectedPlot < 0 && this.getSingleElm() === null)
      return null;
    if (this.visiblePlots.length === 0)
      return null;
    let plot = this.visiblePlots[0];
    if (this.selectedPlot >= 0 && this.visiblePlots.length > this.selectedPlot)
      plot = this.visiblePlots[this.selectedPlot];
    if (plot.elm === null)
      return "";
    else
      return plot.elm.getScopeText(plot.value);
  }
  getScopeLabelOrText(forInfo) {
    const fi = forInfo === true;
    let t = this.text;
    if (t === null) {
      if (fi && this.showElmInfo)
        return "";
      t = this.getScopeText();
      if (t === null)
        return "";
      return Locale.LS(t);
    } else
      return t;
  }
  setSpeed(sp) {
    if (sp < 1)
      sp = 1;
    if (sp > 1024)
      sp = 1024;
    this.speed = sp;
    this.resetGraph();
  }
  showProperties() {
    this.properties = HookRegistry.createScopePropertiesDialog(this.app, this);
    CirSim.dialogShowing = this.properties;
  }
  exportCSV() {
    if (this.visiblePlots.length === 0)
      return;
    let sb = "time";
    let i;
    for (i = 0; i !== this.visiblePlots.length; i++) {
      const plot = this.visiblePlots[i];
      const name = plot.elm !== null ? plot.elm.getClassName().replace("Elm", "") : "unknown";
      const unit = Scope.getScaleUnitsTextStatic(plot.units);
      sb += ',"' + name + " " + unit + ' min"';
      sb += ',"' + name + " " + unit + ' max"';
    }
    sb += "\n";
    const plot0 = this.visiblePlots[0];
    const w = this.rect.width;
    const ts = this.sim.maxTimeStep * this.speed;
    const tStart = this.sim.t - ts * w;
    plot0.startIndex(w);
    for (i = 0; i !== w; i++) {
      const t = tStart + ts * i;
      if (t < 0)
        continue;
      sb += t;
      let j;
      for (j = 0; j !== this.visiblePlots.length; j++) {
        const plot = this.visiblePlots[j];
        const ip = i + plot.startIndex(w) & plot.scopePointCount - 1;
        sb += "," + plot.minValues[ip];
        sb += "," + plot.maxValues[ip];
      }
      sb += "\n";
    }
    Scope.downloadCSV(sb, "scope-data.csv");
  }
  static downloadCSV(data, filename) {
    const blob = new Blob([data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  exportImage() {
    CirSim.dialogShowing = new window.ScopeExportImageDialog(this);
    CirSim.dialogShowing.show();
  }
  exportPNG(transparent = false) {
    const scale = window.devicePixelRatio || 1;
    const cv = document.createElement("canvas");
    cv.width = Math.round(this.rect.width * scale);
    cv.height = Math.round(this.rect.height * scale);
    const context = cv.getContext("2d");
    context.scale(scale, scale);
    this.drawForExport(context, transparent);
    Scope.downloadDataURL(cv.toDataURL(), "scope.png");
  }
  exportSVG(transparent = false) {
    const context = new window.C2S(this.rect.width, this.rect.height);
    this.drawForExport(context, transparent);
    Scope.downloadSVG(context.getSerializedSvg(), "scope.svg");
  }
  // draws this scope, sized to its own rect, into a fresh context at (0,0) instead of
  // its on-screen position, with a solid (or transparent) background and no mouse-driven
  // UI chrome -- shared by exportPNG/exportSVG
  drawForExport(context, transparent) {
    context.lineCap = "round";
    context.translate(-this.rect.x, -this.rect.y);
    const g = new Graphics(context);
    if (!transparent) {
      if (this.position >= 0)
        g.setColor(this.app.isPrintable() ? "#eee" : "#111");
      else
        g.setColor(this.app.isPrintable() ? Color.white : Color.black);
      g.fillRect(this.rect.x, this.rect.y, this.rect.width, this.rect.height);
    }
    const savedSelectedPlot = this.selectedPlot;
    this.selectedPlot = -1;
    this.exporting = true;
    try {
      this.drawImpl(g, true);
    } finally {
      this.exporting = false;
      this.selectedPlot = savedSelectedPlot;
    }
  }
  static downloadDataURL(dataURL, filename) {
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  static downloadSVG(data, filename) {
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  speedUp() {
    if (this.speed > 1) {
      this.speed /= 2;
      this.resetGraph();
    }
  }
  slowDown() {
    if (this.speed < 1024)
      this.speed *= 2;
    this.resetGraph();
  }
  setPlotPosition(plot, v) {
    this.visiblePlots[plot].manVPosition = v;
  }
  // start dragging the currently selected plot up/down (manual scale mode only)
  startDragPlotY(mouseX, mouseY) {
    if (!this.rect.contains(mouseX, mouseY))
      return false;
    if (!this.isManualScale() || this.selectedPlot < 0 || this.selectedPlot >= this.visiblePlots.length)
      return false;
    this.draggingPlotY = true;
    this.dragPlotYMouseStart = mouseY;
    this.dragPlotYInitialPosition = this.visiblePlots[this.selectedPlot].manVPosition;
    Scope.draggingPlotYScope = this;
    return true;
  }
  dragPlotY(mouseY) {
    if (this.selectedPlot < 0 || this.selectedPlot >= this.visiblePlots.length)
      return;
    const maxy = Math.max(1, Math.trunc((this.rect.height - 1) / 2));
    const dy = mouseY - this.dragPlotYMouseStart;
    let newPos = this.dragPlotYInitialPosition - Math.round(dy * V_POSITION_STEPS / (2 * maxy));
    newPos = Math.max(-V_POSITION_STEPS, Math.min(V_POSITION_STEPS, newPos));
    this.visiblePlots[this.selectedPlot].manVPosition = newPos;
  }
  static endDragPlotY() {
    if (Scope.draggingPlotYScope != null)
      Scope.draggingPlotYScope.draggingPlotY = false;
    Scope.draggingPlotYScope = null;
  }
  // get scope element, returning null if there's more than one
  getSingleElm() {
    const elm = this.plots[0].elm;
    let i;
    for (i = 1; i < this.plots.length; i++) {
      if (this.plots[i].elm !== elm)
        return null;
    }
    return elm;
  }
  canMenu() {
    return this.plots[0].elm !== null;
  }
  canShowResistance() {
    const elm = this.getSingleElm();
    return elm !== null && elm.canShowValueInScope(VAL_R);
  }
  isShowingVceAndIc() {
    return this.plot2d.enabled && this.plots.length === 2 && this.plots[0].value === VAL_VCE && this.plots[1].value === VAL_IC;
  }
  dumpXml(doc, root) {
    this.serializer.dumpXml(doc, root);
  }
  undumpXml(xml) {
    this.serializer.undumpXml(xml);
  }
  undump(st) {
    this.serializer.undump(st);
  }
  saveAsDefault() {
    this.serializer.saveAsDefault();
  }
  handleMenu(mi, state) {
    if (mi === "maxscale")
      this.maxScaleToggle();
    if (mi === "showvoltage")
      this.showVoltage(state);
    if (mi === "showcurrent")
      this.showCurrent(state);
    if (mi === "showscale")
      this.showScaleF(state);
    if (mi === "showpeak")
      this.showMaxF(state);
    if (mi === "shownegpeak")
      this.showMinF(state);
    if (mi === "showp2p")
      this.showP2PF(state);
    if (mi === "showfreq")
      this.showFreqF(state);
    if (mi === "showfft")
      this.fftPlot.show(state);
    if (mi === "logspectrum")
      this.fftPlot.logSpectrum = state;
    if (mi === "showrms")
      this.showRMS = state;
    if (mi === "showaverage")
      this.showAverage = state;
    if (mi === "showduty")
      this.showDutyCycle = state;
    if (mi === "showphaseangle")
      this.fftPlot.showPhaseAngle = state;
    if (mi === "showelminfo")
      this.showElmInfo = state;
    if (mi === "showpower")
      this.showPower(state);
    if (mi === "showib")
      this.showPlotValue(VAL_IB, state);
    if (mi === "showic")
      this.showPlotValue(VAL_IC, state);
    if (mi === "showie")
      this.showPlotValue(VAL_IE, state);
    if (mi === "showvbe")
      this.showPlotValue(VAL_VBE, state);
    if (mi === "showvbc")
      this.showPlotValue(VAL_VBC, state);
    if (mi === "showvce")
      this.showPlotValue(VAL_VCE, state);
    if (mi === "showvcevsic") {
      this.plot2d.enabled = true;
      this.plot2d.plotXY = false;
      this.setValues(VAL_VCE, VAL_IC, this.getElm(), null);
      this.resetGraph();
    }
    if (mi === "showvvsi") {
      this.plot2d.enabled = state;
      this.plot2d.plotXY = false;
      this.resetGraph();
    }
    if (mi === "manualscale")
      this.setManualScale(state, true);
    if (mi === "plotxy") {
      this.plot2d.plotXY = this.plot2d.enabled = state;
      if (this.plot2d.enabled) {
        this.plots = this.visiblePlots;
        this.plot2d.plotX = 0;
        this.plot2d.plotY = Math.min(1, this.plots.length - 1);
        this.plot2d.plotBrightness = this.plot2d.plotColorR = this.plot2d.plotColorG = this.plot2d.plotColorB = -1;
      }
      if (this.plot2d.enabled && this.plots.length === 1)
        this.selectY();
      this.resetGraph();
    }
    if (mi === "showresistance")
      this.showPlotValue(VAL_R, state);
    if (mi === "showcharge")
      this.showCharge(state);
  }
  //    void select() {
  //        sim.setMouseElm(elm);
  //        if (plotXY) {
  //            sim.plotXElm = elm;
  //            sim.plotYElm = yElm;
  //        }
  //    }
  selectY() {
    const yElm = this.plots.length === 2 ? this.plots[1].elm : null;
    let e = yElm === null ? -1 : this.app.locateElm(yElm);
    const firstE = e;
    while (true) {
      for (e++; e < this.app.elmList.length; e++) {
        const ce = this.app.getElm(e);
        if ((ce.isOutputElm() || ce.isProbeElm()) && ce !== this.plots[0].elm) {
          const yElm2 = ce;
          if (this.plots.length === 1)
            this.plots.push(new ScopePlot(yElm2, UNITS_V));
          else {
            this.plots[1].elm = yElm2;
            this.plots[1].units = UNITS_V;
          }
          return;
        }
      }
      if (firstE === -1)
        return;
      e = -1;
    }
  }
  onMouseWheel(e) {
    this.wheelDeltaY += ScrollValuePopup.normalizeWheelDelta(e) * this.app.mouse.wheelSensitivity;
    if (this.wheelDeltaY > 5) {
      this.slowDown();
      this.wheelDeltaY = 0;
    }
    if (this.wheelDeltaY < -5) {
      this.speedUp();
      this.wheelDeltaY = 0;
    }
  }
  getElm() {
    if (this.selectedPlot >= 0 && this.visiblePlots.length > this.selectedPlot)
      return this.visiblePlots[this.selectedPlot].elm;
    return this.visiblePlots.length > 0 ? this.visiblePlots[0].elm : this.plots[0].elm;
  }
  showingElm(e) {
    for (let i = 0; i !== this.plots.length; i++)
      if (this.plots[i].elm === e)
        return true;
    return false;
  }
  viewingWire() {
    let i;
    for (i = 0; i !== this.plots.length; i++)
      if (this.plots[i].elm !== null && this.plots[i].elm.isWireEquivalent())
        return true;
    return false;
  }
  // Populate roles map with all elements involved in this scope's display.
  // In XY mode each element is labelled by its axis role; in normal mode all
  // visible plot elements get an empty label (highlighted but unlabelled).
  addScopePlotRoles(roles) {
    if (this.plot2d.plotXY) {
      this.addPlotRole(roles, this.plot2d.plotX, "X");
      this.addPlotRole(roles, this.plot2d.plotY, "Y");
      this.addPlotRole(roles, this.plot2d.plotBrightness, "Br");
      this.addPlotRole(roles, this.plot2d.plotColorR, "R");
      this.addPlotRole(roles, this.plot2d.plotColorG, "G");
      this.addPlotRole(roles, this.plot2d.plotColorB, "B");
    } else {
      for (const p of this.visiblePlots)
        if (p.elm !== null)
          this.addElmRole(roles, p.elm, "");
    }
  }
  addPlotRole(roles, idx, role) {
    if (idx < 0 || idx >= this.plots.length) return;
    if (this.plots[idx].elm !== null)
      this.addElmRole(roles, this.plots[idx].elm, role);
  }
  addElmRole(roles, elm, role) {
    if (elm === null) return;
    const existing = roles.get(elm);
    roles.set(elm, existing === void 0 ? role : existing + "/" + role);
  }
  needToRemove() {
    let ret = true;
    let removed = false;
    let i;
    for (i = 0; i !== this.plots.length; i++) {
      const plot = this.plots[i];
      if (this.app.locateElm(plot.elm) < 0) {
        this.plots.splice(i--, 1);
        removed = true;
      } else
        ret = false;
    }
    if (removed)
      this.calcVisiblePlots();
    return ret;
  }
  isManualScale() {
    return this.manualScale;
  }
  getManScaleFromMaxScale(units, roundUp) {
    let s = this.scale[units];
    if (units > UNITS_A)
      s = 0.5 * s;
    if (roundUp)
      return HookRegistry.scopeNextHighestScale(2 * s / this.manDivisions);
    else
      return 2 * s / this.manDivisions;
  }
}

class FindPathInfo {
  static INDUCT = 1;
  static VOLTAGE = 2;
  static SHORT = 3;
  static CAP_V = 4;
  visited;
  dest;
  firstElm;
  // CircuitElm — typed as any to avoid circular import
  type;
  sim;
  // SimulationManager — typed as any to avoid circular import
  // State object to help find loops in circuit subject to various conditions (depending on type_)
  // elm_ = source and destination element.  dest_ = destination node.
  constructor(type_, elm_, dest_, sim_) {
    this.dest = dest_;
    this.type = type_;
    this.firstElm = elm_;
    this.sim = sim_;
    this.visited = new Array(sim_.nodeList.length).fill(false);
  }
  // look through circuit for loop starting at node n1 of firstElm, for a path back to
  // dest node of firstElm
  findPath(n1) {
    if (n1 === this.dest)
      return true;
    if (this.visited[n1.index])
      return false;
    this.visited[n1.index] = true;
    for (let i = 0; i < n1.links.length; i++) {
      const cnl = n1.links[i];
      const ce = cnl.elm;
      if (this.checkElm(n1, ce))
        return true;
    }
    if (n1 === CircuitNode.ground) {
      for (let i = 0; i < this.sim.nodesWithGroundConnection.length; i++)
        if (this.checkElm(CircuitNode.ground, this.sim.nodesWithGroundConnection[i]))
          return true;
    }
    return false;
  }
  checkElm(n1, ce) {
    if (ce === this.firstElm)
      return false;
    if (this.type === FindPathInfo.INDUCT) {
      if (ce.isCurrentElm())
        return false;
    }
    if (this.type === FindPathInfo.VOLTAGE) {
      if (!(ce.isWireEquivalent() || ce.isVoltageElm() || ce.isLogicInputElm() || ce.isGroundElm()))
        return false;
    }
    if (this.type === FindPathInfo.SHORT && !ce.isWireEquivalent())
      return false;
    if (this.type === FindPathInfo.CAP_V) {
      if (!(ce.isWireEquivalent() || ce.isIdealCapacitor() || ce.isVoltageElm() || ce.isLogicInputElm()))
        return false;
    }
    if (n1 === CircuitNode.ground) {
      for (let j = 0; j < ce.getPostCount(); j++)
        if (ce.hasGroundConnection(j) && this.findPath(ce.getNode(j)))
          return true;
    }
    for (let j = 0; j < ce.getPostCount(); j++) {
      if (ce.getNode(j) === n1) {
        if (ce.hasGroundConnection(j) && this.findPath(CircuitNode.ground))
          return true;
        if (this.type === FindPathInfo.INDUCT && ce.isInductorElm()) {
          let c = ce.getCurrent();
          if (j === 0)
            c = -c;
          if (Math.abs(c - this.firstElm.getCurrent()) > 1e-10)
            continue;
        }
        for (let k = 0; k < ce.getPostCount(); k++) {
          if (j === k)
            continue;
          if (ce.getConnection(j, k) && this.findPath(ce.getNode(k))) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

class NumberFormat {
  pattern;
  constructor(pattern) {
    this.pattern = pattern;
  }
  static getFormat(pattern) {
    return new NumberFormat(pattern);
  }
  format(v) {
    if (this.pattern.includes("E")) {
      const exp = v.toExponential(2).toUpperCase();
      return exp.replace(/E([+-]?)(\d+)$/, (_, sign, digits2) => "E" + (sign === "-" ? "-" : "") + digits2.padStart(3, "0"));
    }
    const dotIdx = this.pattern.indexOf(".");
    if (dotIdx === -1)
      return Math.round(v).toString();
    const decPart = this.pattern.substring(dotIdx + 1);
    const digits = decPart.length;
    const isFixed = decPart.includes("0");
    if (isFixed)
      return v.toFixed(digits);
    return parseFloatStrict(v.toFixed(digits)).toString();
  }
}

class CircuitElm {
  static voltageRange = 5;
  static colorScaleCount = 201;
  // odd so ground = gray
  static colorScale;
  static currentMult;
  static powerMult;
  // scratch points for convenience
  static ps1;
  static ps2;
  static app;
  static sim;
  static whiteColor;
  static lightGrayColor;
  static selectColor;
  static positiveColor;
  static negativeColor;
  static neutralColor;
  static currentColor;
  static unitsFont;
  static valueFont;
  static valueFontSize = 12;
  static showFormat;
  static shortFormat;
  static fixedFormat;
  static pi = 3.141592653589793;
  static mouseElmRef = null;
  static SCALE_AUTO = 0;
  static SCALE_1 = 1;
  static SCALE_M = 2;
  static SCALE_MU = 3;
  static decimalDigits;
  static shortDecimalDigits;
  // initial point where user created element.  For simple two-terminal elements, this is the first node/post.
  x;
  // point to which user dragged out element.  For simple two-terminal elements, this is the second node/post
  y;
  x2;
  y2;
  flags;
  voltSource = null;
  nodes;
  // length along x and y axes, and sign of difference
  dx = 0;
  dy = 0;
  dsign = 0;
  lastHandleGrabbed = -1;
  // length of element
  dn = 0;
  dpx1 = 0;
  dpy1 = 0;
  // (x,y) and (x2,y2) as Point objects
  point1 = new Point();
  point2 = new Point();
  // lead points (ends of wire stubs for simple two-terminal elements)
  lead1 = null;
  lead2 = null;
  current = 0;
  curcount = 0;
  boundingBox;
  // if subclasses set this to true, element will be horizontal or vertical only
  noDiagonal = false;
  selected = false;
  // the CompositeElm (subcircuit chip) this element is a child of, if any
  parent = null;
  //    abstract getDumpType(): number;
  getDumpType() {
    return 0;
  }
  getXmlDumpType() {
    const t = this.getDumpType();
    if (t > 64 && t < 127)
      return String.fromCharCode(t);
    return this.getClassName().replace("Elm", "");
  }
  // leftover from java, doesn't do anything anymore.
  getDumpClass() {
    return this.constructor;
  }
  getDefaultFlags() {
    return 0;
  }
  hasFlag(f) {
    return (this.flags & f) !== 0;
  }
  static initClass(app_, sim_) {
    CircuitElm.sim = sim_;
    CircuitElm.app = app_;
    CircuitElm.colorScale = new Array(CircuitElm.colorScaleCount);
    CircuitElm.ps1 = new Point();
    CircuitElm.ps2 = new Point();
    const stor = typeof localStorage !== "undefined" ? localStorage : null;
    CircuitElm.decimalDigits = 3;
    CircuitElm.shortDecimalDigits = 1;
    if (stor != null) {
      const s1 = stor.getItem("decimalDigits");
      const s2 = stor.getItem("decimalDigitsShort");
      if (s1 != null)
        CircuitElm.decimalDigits = parseIntStrict(s1);
      if (s2 != null)
        CircuitElm.shortDecimalDigits = parseIntStrict(s2);
      const sf = stor.getItem("valueFontSize");
      if (sf != null)
        CircuitElm.valueFontSize = parseIntStrict(sf);
    }
    CircuitElm.setDecimalDigits(CircuitElm.decimalDigits, false, false);
    CircuitElm.setDecimalDigits(CircuitElm.shortDecimalDigits, true, false);
    CircuitElm.unitsFont = new Font("SansSerif", 0, 12);
    CircuitElm.valueFont = new Font("SansSerif", 0, CircuitElm.valueFontSize);
    CircuitElm.currentMult = 0;
  }
  static setValueFontSize(size) {
    CircuitElm.valueFontSize = size;
    CircuitElm.valueFont = new Font("SansSerif", 0, CircuitElm.valueFontSize);
    const stor = typeof localStorage !== "undefined" ? localStorage : null;
    if (stor != null)
      stor.setItem("valueFontSize", String(CircuitElm.valueFontSize));
  }
  static setDecimalDigits(num, sf, save) {
    if (sf)
      CircuitElm.shortDecimalDigits = num;
    else
      CircuitElm.decimalDigits = num;
    let s = "####.";
    let ct = num;
    for (; ct > 0; ct--)
      s += "#";
    const nf = NumberFormat.getFormat(s);
    if (sf)
      CircuitElm.shortFormat = nf;
    else
      CircuitElm.showFormat = nf;
    if (save) {
      const stor = typeof localStorage !== "undefined" ? localStorage : null;
      if (stor != null)
        stor.setItem(sf ? "decimalDigitsShort" : "decimalDigits", num.toString());
    }
    if (!sf) {
      s = "####.";
      ct = num;
      for (; ct > 0; ct--)
        s += "0";
      CircuitElm.fixedFormat = NumberFormat.getFormat(s);
    }
  }
  static setColorScale() {
    let i;
    if (CircuitElm.positiveColor == null)
      CircuitElm.positiveColor = Color.green;
    if (CircuitElm.negativeColor == null)
      CircuitElm.negativeColor = Color.red;
    if (CircuitElm.neutralColor == null)
      CircuitElm.neutralColor = Color.gray;
    for (i = 0; i !== CircuitElm.colorScaleCount; i++) {
      const v = i * 2 / CircuitElm.colorScaleCount - 1;
      if (v < 0) {
        CircuitElm.colorScale[i] = new Color(CircuitElm.neutralColor, CircuitElm.negativeColor, -v);
      } else {
        CircuitElm.colorScale[i] = new Color(CircuitElm.neutralColor, CircuitElm.positiveColor, v);
      }
    }
  }
  constructor(xa, ya, xb, yb, f) {
    if (xb === void 0) {
      this.x = xa;
      this.x2 = xa;
      this.y = ya;
      this.y2 = ya;
      this.flags = this.getDefaultFlags();
    } else {
      this.x = xa;
      this.y = ya;
      this.x2 = xb;
      this.y2 = yb;
      this.flags = f;
    }
    this.allocNodes();
    this.initBoundingBox();
  }
  initBoundingBox() {
    this.boundingBox = new Rectangle();
    this.boundingBox.setBounds(
      CircuitElm.min(this.x, this.x2),
      CircuitElm.min(this.y, this.y2),
      CircuitElm.abs(this.x2 - this.x) + 1,
      CircuitElm.abs(this.y2 - this.y) + 1
    );
  }
  // allocate nodes/volts arrays we need
  allocNodes() {
    const n = this.getNodeCount() || 1;
    if (this.nodes == null || this.nodes.length !== n) {
      this.nodes = new Array(n).fill(CircuitNode.ground);
    }
  }
  // dump component state for export/undo
  dump() {
    const t = this.getDumpType();
    return (t < 127 ? String.fromCharCode(t) + " " : t + " ") + this.x + " " + this.y + " " + this.x2 + " " + this.y2 + " " + this.flags;
  }
  // handle reset button
  reset() {
    this.curcount = 0;
  }
  draw(g) {
  }
  // override this in elements that use highVoltage (gates, chips, inverters, etc.)
  setHighVoltage(hv) {
  }
  // set current for voltage source vn to c.  vn will be the same value as in a previous call to setVoltageSource(n, vn)
  setCurrent(vs, c) {
    this.current = c;
  }
  // set current for wire-like elements (called from calcWireCurrents, one call per bit for bus wires)
  setWireCurrent(bit, c) {
    this.current = c;
  }
  // get current for one- or two-terminal elements
  getCurrent() {
    return this.current;
  }
  setParentList(elmList) {
  }
  getChildElmList() {
    return null;
  }
  // called before makeNodeList to allow elements to set up internal node counts, etc.
  preStamp() {
  }
  // stamp matrix values for linear elements.
  // for non-linear elements, use this to stamp values that don't change each iteration, and call stampRightSide() or stampNonLinear() as needed
  stamp() {
  }
  // add this element as an obstacle to the wire router grid
  addRoutingObstacle(router) {
    if (this.x === this.x2 || this.y === this.y2) {
      router.addWire(this.x, this.y, this.x2, this.y2);
      if (this.lead1 != null && this.lead2 != null)
        router.addObstacle(this.lead1.x, this.lead1.y, this.lead2.x, this.lead2.y);
    }
  }
  addRoutingObstacleWithLeads(router, width) {
    if (this.x === this.x2 || this.y === this.y2) {
      router.addWire(this.x, this.y, this.x2, this.y2);
      const pa = this.interpPoint(this.lead1, this.lead2, 0, width);
      const pb = this.interpPoint(this.lead1, this.lead2, 1, -width);
      router.addObstacle(pa.x, pa.y, pb.x, pb.y);
    }
  }
  // stamp matrix values for non-linear elements
  doStep() {
  }
  delete() {
    if (CircuitElm.mouseElmRef === this)
      CircuitElm.mouseElmRef = null;
    CircuitElm.app.deleteSliders(this);
  }
  startIteration() {
  }
  // get voltage of x'th node
  getPostVoltage(x) {
    return this.nodes[x].v;
  }
  // calculate current in response to node voltages changing
  calculateCurrent() {
  }
  // calculate post locations and other convenience values used for drawing.  Called when element is moved
  setPoints() {
    this.dx = this.x2 - this.x;
    this.dy = this.y2 - this.y;
    this.dn = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    this.dpx1 = this.dy / this.dn;
    this.dpy1 = -this.dx / this.dn;
    this.dsign = this.dy === 0 ? CircuitElm.sign(this.dx) : CircuitElm.sign(this.dy);
    this.point1 = new Point(this.x, this.y);
    this.point2 = new Point(this.x2, this.y2);
  }
  // calculate lead points for an element of length len.  Handy for simple two-terminal elements.
  // Posts are where the user connects wires; leads are ends of wire stubs drawn inside the element.
  calcLeads(len) {
    if (this.dn < len || len === 0) {
      this.lead1 = this.point1;
      this.lead2 = this.point2;
      return;
    }
    this.lead1 = this.interpPoint(this.point1, this.point2, (this.dn - len) / (2 * this.dn));
    this.lead2 = this.interpPoint(this.point1, this.point2, (this.dn + len) / (2 * this.dn));
  }
  // Returns true if (px,py) lies strictly inside the axis-aligned segment (ax,ay)-(bx,by).
  static pointOnSegmentInterior(ax, ay, bx, by, px, py) {
    if (px === ax && py === ay || px === bx && py === by) return false;
    if (ax === bx && px === ax) {
      const miny = Math.min(ay, by), maxy = Math.max(ay, by);
      return py > miny && py < maxy;
    } else if (ay === by && py === ay) {
      const minx = Math.min(ax, bx), maxx = Math.max(ax, bx);
      return px > minx && px < maxx;
    }
    return false;
  }
  // Returns which post (0 or 1) has a lead stub containing (px, py), or -1 if neither.
  getLeadPost(px, py) {
    if (this.lead1 != null && this.lead1 !== this.point1 && CircuitElm.pointOnSegmentInterior(this.point1.x, this.point1.y, this.lead1.x, this.lead1.y, px, py))
      return 0;
    if (this.lead2 != null && this.lead2 !== this.point2 && CircuitElm.pointOnSegmentInterior(this.lead2.x, this.lead2.y, this.point2.x, this.point2.y, px, py))
      return 1;
    if (this.lead1 == null && this.getPostCount() === 1 && CircuitElm.pointOnSegmentInterior(this.point1.x, this.point1.y, this.point2.x, this.point2.y, px, py))
      return 0;
    return -1;
  }
  // adjust leads so that the point exactly between them is a grid point (so we can place a terminal there)
  adjustLeadsToGrid(flipX, flipY) {
    const cx = (this.point1.x + this.point2.x) / 2;
    const cy = (this.point1.y + this.point2.y) / 2;
    const roundx = flipX ? 1 : -1;
    const roundy = flipY ? 1 : -1;
    const adjx = this.snapGrid(cx + roundx) - cx;
    const adjy = this.snapGrid(cy + roundy) - cy;
    this.lead1.move(adjx, adjy);
    this.lead2.move(adjx, adjy);
  }
  interpPoint(a, b, cOrF, fOrG, g) {
    if (typeof cOrF === "number" && fOrG === void 0) {
      const p = new Point();
      this.interpPointInto(a, b, p, cOrF);
      return p;
    } else if (cOrF instanceof Point && g === void 0) {
      this.interpPointInto(a, b, cOrF, fOrG);
    } else if (cOrF instanceof Point && g !== void 0) {
      this.interpPointPerpInto(a, b, cOrF, fOrG, g);
    } else {
      const p = new Point();
      this.interpPointPerpInto(a, b, p, cOrF, fOrG);
      return p;
    }
  }
  interpPointInto(a, b, c, f) {
    c.x = Math.floor(a.x * (1 - f) + b.x * f + 0.48);
    c.y = Math.floor(a.y * (1 - f) + b.y * f + 0.48);
  }
  interpPointPerpInto(a, b, c, f, g) {
    const gx = b.y - a.y;
    const gy = a.x - b.x;
    g /= Math.sqrt(gx * gx + gy * gy);
    c.x = Math.floor(a.x * (1 - f) + b.x * f + g * gx + 0.48);
    c.y = Math.floor(a.y * (1 - f) + b.y * f + g * gy + 0.48);
  }
  /**
   * Calculates two points fraction f along the line between a and b and offest perpendicular by +/-g
   * @param a 1st point (In)
   * @param b 2nd point (In)
   * @param c 1st point (Out)
   * @param d 2nd point (Out)
   * @param f Fraction along line
   * @param g Fraction perpendicular to line
   */
  interpPoint2(a, b, c, d, f, g) {
    const gx = b.y - a.y;
    const gy = a.x - b.x;
    g /= Math.sqrt(gx * gx + gy * gy);
    c.x = Math.floor(a.x * (1 - f) + b.x * f + g * gx + 0.48);
    c.y = Math.floor(a.y * (1 - f) + b.y * f + g * gy + 0.48);
    d.x = Math.floor(a.x * (1 - f) + b.x * f - g * gx + 0.48);
    d.y = Math.floor(a.y * (1 - f) + b.y * f - g * gy + 0.48);
  }
  draw2Leads(g) {
    this.setVoltageColor(g, this.nodes[0].v);
    CircuitElm.drawThickLine(g, this.point1, this.lead1);
    this.setVoltageColor(g, this.nodes[1].v);
    CircuitElm.drawThickLine(g, this.lead2, this.point2);
  }
  newPointArray(n) {
    const a = new Array(n);
    while (n > 0)
      a[--n] = new Point();
    return a;
  }
  snapGrid(z) {
    return CircuitElm.app.snapGrid(z);
  }
  CURRENT_TOO_FAST = 100;
  // draw current dots from point a to b
  drawDots(g, pa, pb, pos) {
    if (!CircuitElm.app.simIsRunning() || pos === 0 || !CircuitElm.app.menus.dotsCheckItem.getState())
      return;
    const dx = pb.x - pa.x;
    const dy = pb.y - pa.y;
    const dn = Math.sqrt(dx * dx + dy * dy);
    g.setColor(CircuitElm.currentColor);
    const ds = 16;
    if (pos === this.CURRENT_TOO_FAST || pos === -this.CURRENT_TOO_FAST) {
      g.save();
      const ctx = g.context;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
      g.restore();
      pos = Math.random() * ds;
    }
    pos %= ds;
    if (pos < 0)
      pos += ds;
    for (let di = pos; di < dn; di += ds) {
      const x0 = Math.trunc(pa.x + di * dx / dn);
      const y0 = Math.trunc(pa.y + di * dy / dn);
      g.fillRect(x0 - 2, y0 - 2, 4, 4);
    }
  }
  addCurCount(c, a) {
    if (c === this.CURRENT_TOO_FAST || c === -this.CURRENT_TOO_FAST)
      return c;
    return c + a;
  }
  calcArrow(a, b, al, aw) {
    const poly = new Polygon();
    const p1 = new Point();
    const p2 = new Point();
    const adx = b.x - a.x;
    const ady = b.y - a.y;
    const l = Math.sqrt(adx * adx + ady * ady);
    poly.addPoint(b.x, b.y);
    this.interpPoint2(a, b, p1, p2, 1 - al / l, aw);
    poly.addPoint(p1.x, p1.y);
    poly.addPoint(p2.x, p2.y);
    return poly;
  }
  createPolygon(a, b, c, d) {
    const p = new Polygon();
    if (Array.isArray(a)) {
      for (let i = 0; i !== a.length; i++)
        p.addPoint(a[i].x, a[i].y);
    } else {
      p.addPoint(a.x, a.y);
      p.addPoint(b.x, b.y);
      p.addPoint(c.x, c.y);
      if (d !== void 0)
        p.addPoint(d.x, d.y);
    }
    return p;
  }
  // draw second point to xx, yy
  drag(xx, yy) {
    xx = this.snapGrid(xx);
    yy = this.snapGrid(yy);
    if (this.noDiagonal) {
      if (Math.abs(this.x - xx) < Math.abs(this.y - yy)) {
        xx = this.x;
      } else {
        yy = this.y;
      }
    }
    this.x2 = xx;
    this.y2 = yy;
    this.setPoints();
  }
  // Default length (in pixels) used when this element is placed via toolbar
  // drag-and-drop, since there's no drag-to-size gesture to set the length by hand
  // in that case.  Override for elements that look better a bit longer/shorter.
  getDragLength() {
    return 64;
  }
  // Override (ignoring requestedVertical) for elements that should only ever be
  // placed vertically via toolbar drag-and-drop, e.g. GroundElm, VoltageElm.
  getDragVertical(requestedVertical) {
    return requestedVertical;
  }
  // Positions this element for toolbar drag-and-drop placement: (xa,ya) is the
  // anchor point that tracks the mouse, in circuit coordinates, already snapped to
  // the grid.  Called repeatedly as the mouse moves and whenever the requested
  // orientation changes (e.g. the shift key toggled without the mouse moving), so
  // it must be idempotent given the same arguments.  Override for elements where a
  // different point (rather than x,y) should track the mouse, e.g. RailElm, where
  // the label should track the mouse rather than the connection post.
  dragPlace(xa, ya, vertical) {
    vertical = this.getDragVertical(vertical);
    const len = this.getDragLength();
    this.x = xa;
    this.y = ya;
    this.x2 = xa + (vertical ? 0 : len);
    this.y2 = ya + (vertical ? len : 0);
    this.setPoints();
  }
  // swap the two endpoints in place; for use by dragPlace() overrides on elements
  // where a different point (rather than x,y) should track the mouse anchor
  swapDragEndpoints() {
    const tx = this.x, ty = this.y;
    this.x = this.x2;
    this.y = this.y2;
    this.x2 = tx;
    this.y2 = ty;
    this.setPoints();
  }
  move(dx, dy) {
    this.x += dx;
    this.y += dy;
    this.x2 += dx;
    this.y2 += dy;
    this.boundingBox.translate(dx, dy);
    this.setPoints();
  }
  // called when an element is done being dragged out; returns true if it's zero size and should be deleted
  creationFailed() {
    return this.x === this.x2 && this.y === this.y2;
  }
  // this is used to set the position of an internal element so we can draw it inside the parent
  setPosition(x_, y_, x2_, y2_) {
    this.x = x_;
    this.y = y_;
    this.x2 = x2_;
    this.y2 = y2_;
    this.initBoundingBox();
    this.setPoints();
  }
  setPositionFromXml(elem) {
    const x = elem.getAttribute("x");
    if (x == null)
      return;
    const xs = x.split(" ");
    this.setPosition(
      parseIntStrict(xs[0]),
      parseIntStrict(xs[1]),
      parseIntStrict(xs[2]),
      parseIntStrict(xs[3])
    );
  }
  // determine if moving this element by (dx,dy) will put it on top of another element
  allowMove(dx, dy) {
    const nx = this.x + dx;
    const ny = this.y + dy;
    const nx2 = this.x2 + dx;
    const ny2 = this.y2 + dy;
    for (const ce of CircuitElm.app.elmList) {
      if (ce.x === nx && ce.y === ny && ce.x2 === nx2 && ce.y2 === ny2)
        return false;
      if (ce.x === nx2 && ce.y === ny2 && ce.x2 === nx && ce.y2 === ny)
        return false;
    }
    return true;
  }
  movePoint(n, dx, dy) {
    const oldx = this.x;
    const oldy = this.y;
    const oldx2 = this.x2;
    const oldy2 = this.y2;
    if (this.noDiagonal) {
      if (this.x === this.x2)
        dx = 0;
      else
        dy = 0;
    }
    if (n === 0) {
      this.x += dx;
      this.y += dy;
    } else {
      this.x2 += dx;
      this.y2 += dy;
    }
    if (this.x === this.x2 && this.y === this.y2) {
      this.x = oldx;
      this.y = oldy;
      this.x2 = oldx2;
      this.y2 = oldy2;
    }
    this.setPoints();
  }
  flipX(center2, count) {
    this.x = center2 - this.x;
    this.x2 = center2 - this.x2;
    this.initBoundingBox();
    this.setPoints();
  }
  flipY(center2, count) {
    this.y = center2 - this.y;
    this.y2 = center2 - this.y2;
    this.initBoundingBox();
    this.setPoints();
  }
  flipXY(xmy, count) {
    const nx = this.y + xmy;
    const ny = this.x - xmy;
    const nx2 = this.y2 + xmy;
    const ny2 = this.x2 - xmy;
    this.x = nx;
    this.y = ny;
    this.x2 = nx2;
    this.y2 = ny2;
    this.initBoundingBox();
    this.setPoints();
  }
  drawPosts(g) {
    if (!this.isCreating() && !this.needsHighlight())
      return;
    if (CircuitElm.app.mouse.mouseMode === MouseManager.MODE_DRAG_ROW || CircuitElm.app.mouse.mouseMode === MouseManager.MODE_DRAG_COLUMN)
      return;
    for (let i = 0; i !== this.getPostCount(); i++) {
      const p = this.getPost(i);
      CircuitElm.drawPost(g, p);
    }
    this.drawScopeTerminalLabels(g);
  }
  drawScopeTerminalLabels(g) {
    if (this.getPostCount() !== 2)
      return;
    if (!CircuitElm.app.mouse.scopePlotRoles.has(this))
      return;
    if (this.dn === 0)
      return;
    if (this.isWireEquivalent())
      return;
    g.setColor(CircuitElm.selectColor);
    g.setFont(CircuitElm.unitsFont);
    g.save();
    g.context.textBaseline = "middle";
    g.context.textAlign = "center";
    const axOff = 10, perpOff = 8;
    const swap = this.isVoltageElm();
    const pp = this.interpPoint(this.point1, this.point2, axOff / this.dn, perpOff);
    g.drawString(swap ? "−" : "+", pp.x, pp.y);
    const mp = this.interpPoint(this.point1, this.point2, 1 - axOff / this.dn, perpOff);
    g.drawString(swap ? "+" : "−", mp.x, mp.y);
    g.restore();
  }
  getNumHandles() {
    return this.getPostCount();
  }
  drawHandles(g, c) {
    if (this.getNumHandles() === 0)
      return;
    g.setColor(c);
    if (this.lastHandleGrabbed === -1)
      g.fillRect(this.x - 3, this.y - 3, 7, 7);
    else if (this.lastHandleGrabbed === 0)
      g.fillRect(this.x - 4, this.y - 4, 9, 9);
    if (this.getNumHandles() > 1) {
      if (this.lastHandleGrabbed === -1)
        g.fillRect(this.x2 - 3, this.y2 - 3, 7, 7);
      else if (this.lastHandleGrabbed === 1)
        g.fillRect(this.x2 - 4, this.y2 - 4, 9, 9);
    }
  }
  getHandleGrabbedClose(xtest, ytest, deltaSq, minSize) {
    this.lastHandleGrabbed = -1;
    if (Graphics.distanceSq(this.x, this.y, this.x2, this.y2) >= minSize) {
      if (Graphics.distanceSq(this.x, this.y, xtest, ytest) <= deltaSq)
        this.lastHandleGrabbed = 0;
      else if (this.getNumHandles() > 1 && Graphics.distanceSq(this.x2, this.y2, xtest, ytest) <= deltaSq)
        this.lastHandleGrabbed = 1;
    }
    return this.lastHandleGrabbed;
  }
  // number of voltage sources this element needs
  getVoltageSourceCount() {
    return 0;
  }
  // number of internal nodes (nodes not visible in UI that are needed for implementation)
  getInternalNodeCount() {
    return 0;
  }
  // number of nodes this element references by name (v(label)/i(meter) in an expression)
  // but is not wired to.  they are appended to nodes[] after the posts and internal nodes,
  // two per reference (the positive and negative end of the referenced quantity).  they
  // exist so that calculateClosures() pulls the referenced node into the same matrix,
  // which lets us stamp a derivative against it.  they carry no current and aren't drawn.
  getRefNodeCount() {
    return 0;
  }
  // resolve the names our expression refers to, filling in our reference nodes.  called
  // from makeNodeList() once every element's posts have nodes, and before the matrices
  // are partitioned.  unresolved names are left as ground.
  resolveExprRefs(_elmList) {
  }
  // the name by which an expression can refer to this element, or null if it has none
  getExprRefName() {
    return null;
  }
  // index in nodes[] where our reference nodes start, after the posts and internal nodes
  getRefNodeBase() {
    return this.getPostCount() + this.getInternalNodeCount();
  }
  // is node index n one of our reference nodes (rather than a post or internal node)?
  // referring to a node by name doesn't connect us to it, so the connectivity passes
  // have to leave these out even though they're in nodes[].
  isRefNode(n) {
    return n >= this.getRefNodeBase();
  }
  getNodeCount() {
    return this.getPostCount() + this.getInternalNodeCount() + this.getRefNodeCount();
  }
  // notify this element that its pth node is n.
  setNode(p, n) {
    if (this.isRefNode(p)) {
      this.nodes[p] = n;
      return;
    }
    let v = 0;
    if (this.nodes[p] !== void 0)
      v = this.nodes[p].v;
    this.nodes[p] = n;
    if (v != 0 && this.nodes[p].index > 0)
      this.nodes[p].v = v;
  }
  // notify this element that its nth voltage source is v.  This value v can be passed to stampVoltageSource(), etc and will be passed back in calls to setCurrent()
  setVoltageSource(n, v) {
    this.voltSource = v;
  }
  //    getVoltageSource(): number { return voltSource; } // Never used except for debug code which is commented out
  getVoltageDiff() {
    return this.nodes[0].v - this.nodes[1].v;
  }
  nonLinear() {
    return false;
  }
  getPostCount() {
    return 2;
  }
  getPostWidth(n) {
    return 1;
  }
  getBusWidth() {
    return 1;
  }
  // generate WireSegment entries for this wire-like element (called during calculateWireClosureForList)
  getWireSegments(list) {
    const bw = this.getBusWidth();
    for (let b = 0; b < bw; b++) {
      const p0 = this.getPost(b);
      const p1 = this.getConnectedPost(b);
      const ep0 = SimulationManager.pointKey(p0);
      const ep1 = p1 != null && !p1.equals(p0) ? SimulationManager.pointKey(p1) : null;
      list.push(new SimulationManager.WireSegment(this, b, ep0, ep1));
    }
  }
  // get CircuitNode for nth node
  getNode(n) {
    return this.nodes[n];
  }
  // get position of nth node
  getPost(n) {
    return n === 0 ? this.point1 : n === 1 ? this.point2 : null;
  }
  // return post we're connected to (for wires, so we can optimize them out in calculateWireClosure())
  // return the post that post n connects through to (for bus wires, each bit connects to its counterpart)
  getConnectedPost(n) {
    return this.point2;
  }
  getNodeAtPoint(pt) {
    for (let i = 0; i !== this.getPostCount(); i++) {
      if (this.getPost(i).equals(pt))
        return i;
    }
    return 0;
  }
  /*
  drawPost(g: Graphics, x0: number, y0: number, n: number): void {
      if (!this.isCreating() && !this.needsHighlight() &&
          app.getCircuitNode(n).links.size() == 2)
          return;
      if (app.mouse.mouseMode == MouseManager.MODE_DRAG_ROW ||
          app.mouse.mouseMode == MouseManager.MODE_DRAG_COLUMN)
          return;
      this.drawPost(g, x0, y0);
  }
  */
  static drawPost(g, pt) {
    g.setColor(CircuitElm.whiteColor);
    g.fillOval(pt.x - 3, pt.y - 3, 7, 7);
  }
  setBbox(x1OrP1, y1OrP2, x2OrW, y2) {
    if (x1OrP1 instanceof Point) {
      const p1 = x1OrP1, p2 = y1OrP2, w = x2OrW;
      this.setBbox(p1.x, p1.y, p2.x, p2.y);
      const dpx = Math.trunc(this.dpx1 * w);
      const dpy = Math.trunc(this.dpy1 * w);
      this.adjustBbox(p1.x + dpx, p1.y + dpy, p1.x - dpx, p1.y - dpy);
    } else {
      let x1 = x1OrP1, y1 = y1OrP2, x2 = x2OrW;
      if (x1 > x2) {
        const q = x1;
        x1 = x2;
        x2 = q;
      }
      if (y1 > y2) {
        const q = y1;
        y1 = y2;
        y2 = q;
      }
      this.boundingBox.setBounds(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
    }
  }
  adjustBbox(x1OrP1, y1OrP2, x2, y2) {
    if (x1OrP1 instanceof Point) {
      this.adjustBbox(x1OrP1.x, x1OrP1.y, y1OrP2.x, y1OrP2.y);
      return;
    }
    let x1 = x1OrP1, y1 = y1OrP2;
    if (x1 > x2) {
      const q = x1;
      x1 = x2;
      x2 = q;
    }
    if (y1 > y2) {
      const q = y1;
      y1 = y2;
      y2 = q;
    }
    x1 = CircuitElm.min(this.boundingBox.x, x1);
    y1 = CircuitElm.min(this.boundingBox.y, y1);
    x2 = CircuitElm.max(this.boundingBox.x + this.boundingBox.width, x2);
    y2 = CircuitElm.max(this.boundingBox.y + this.boundingBox.height, y2);
    this.boundingBox.setBounds(x1, y1, x2 - x1, y2 - y1);
  }
  // needed for calculating circuit bounds (need to special-case centered text elements)
  isCenteredText() {
    return false;
  }
  drawCenteredText(g, s, x, y, cx) {
    const w = Math.trunc(g.context.measureText(s).width);
    const h2 = Math.trunc(g.currentFontSize) / 2;
    g.save();
    g.context.textBaseline = "middle";
    if (cx) {
      g.context.textAlign = "center";
      this.adjustBbox(x - w / 2, y - h2, x + w / 2, y + h2);
    } else {
      this.adjustBbox(x, y - h2, x + w, y + h2);
    }
    if (cx)
      g.context.textAlign = "center";
    g.drawString(s, x, y);
    g.restore();
  }
  // draw component values (number of resistor ohms, etc).  hs = offset
  drawValues(g, s, hs) {
    if (s == null)
      return;
    g.save();
    g.setFont(CircuitElm.valueFont);
    const w = Math.trunc(g.context.measureText(s).width);
    g.setColor(CircuitElm.whiteColor);
    const ya = Math.trunc(g.currentFontSize) / 2;
    let xc, yc;
    if (this.isRailElm() || this.isSweepElm()) {
      xc = this.x2;
      yc = this.y2;
    } else {
      xc = (this.x2 + this.x) / 2;
      yc = (this.y2 + this.y) / 2;
    }
    const dpx = Math.trunc(this.dpx1 * hs);
    const dpy = Math.trunc(this.dpy1 * hs);
    if (dpx === 0)
      g.drawString(s, xc - w / 2, yc - CircuitElm.abs(dpy) - 2);
    else {
      let xx = xc + CircuitElm.abs(dpx) + 2;
      if (this.isVoltageElm() || this.x < this.x2 && this.y > this.y2)
        xx = xc - (w + CircuitElm.abs(dpx) + 2);
      g.drawString(s, xx, yc + dpy + ya);
    }
    g.restore();
  }
  drawLabeledNode(g, str, pt1, pt2) {
    g.save();
    g.setFont(CircuitElm.valueFont);
    let lineOver = false;
    if (str.startsWith("/")) {
      lineOver = true;
      str = str.substring(1);
    }
    const w = Math.trunc(g.context.measureText(str).width);
    const h = Math.trunc(g.currentFontSize);
    g.context.textBaseline = "middle";
    let x = pt2.x, y = pt2.y;
    if (pt1.y !== pt2.y) {
      x -= w / 2;
      y += CircuitElm.sign(pt2.y - pt1.y) * h;
    } else {
      if (pt2.x > pt1.x)
        x += 4;
      else
        x -= 4 + w;
    }
    g.drawString(str, x, y);
    this.adjustBbox(x, y - h / 2, x + w, y + h / 2);
    g.restore();
    if (lineOver) {
      const ya = y - h / 2 - 1;
      g.drawLine(x, ya, x + w, ya);
    }
  }
  drawCoil(g, hs, p1, p2, v1, v2) {
    const len = CircuitElm.distance(p1, p2);
    g.save();
    g.context.lineWidth = 3;
    g.context.transform(
      (p2.x - p1.x) / len,
      (p2.y - p1.y) / len,
      -(p2.y - p1.y) / len,
      (p2.x - p1.x) / len,
      p1.x,
      p1.y
    );
    if (CircuitElm.app.menus.voltsCheckItem.getState()) {
      const grad = g.context.createLinearGradient(0, 0, len, 0);
      grad.addColorStop(0, this.getVoltageColor(g, v1).getHexValue());
      grad.addColorStop(1, this.getVoltageColor(g, v2).getHexValue());
      g.context.strokeStyle = grad;
    }
    g.context.lineCap = "round";
    g.context.scale(1, hs > 0 ? 1 : -1);
    const loopCt = Math.ceil(len / 11);
    for (let loop = 0; loop !== loopCt; loop++) {
      g.context.beginPath();
      const start = len * loop / loopCt;
      g.context.moveTo(start, 0);
      g.context.arc(len * (loop + 0.5) / loopCt, 0, len / (2 * loopCt), Math.PI, Math.PI * 2);
      g.context.lineTo(len * (loop + 1) / loopCt, 0);
      g.context.stroke();
    }
    g.restore();
  }
  static drawThickLine(g, xOrPa, yOrPb, x2OrWidth, y2) {
    if (typeof xOrPa === "number") {
      g.setLineWidth(3);
      g.drawLine(xOrPa, yOrPb, x2OrWidth, y2);
      g.setLineWidth(1);
    } else if (x2OrWidth === void 0) {
      CircuitElm.drawThickLine(g, xOrPa, yOrPb, 3);
    } else {
      g.setLineWidth(x2OrWidth);
      g.drawLine(xOrPa, yOrPb);
      g.setLineWidth(1);
    }
  }
  static drawThickPolygon(g, xsOrP, ys, c) {
    if (xsOrP instanceof Polygon) {
      CircuitElm.drawThickPolygon(g, xsOrP.xpoints, xsOrP.ypoints, xsOrP.npoints);
    } else {
      g.setLineWidth(3);
      g.drawPolyline(xsOrP, ys, c);
      g.setLineWidth(1);
    }
  }
  static drawPolygon(g, p) {
    g.drawPolyline(p.xpoints, p.ypoints, p.npoints);
  }
  static drawThickCircle(g, cx, cy, ri) {
    g.setLineWidth(3);
    g.context.beginPath();
    g.context.arc(cx, cy, ri * 0.98, 0, 2 * Math.PI);
    g.context.stroke();
    g.setLineWidth(1);
  }
  getSchmittPolygon(gsize, ctr) {
    const pts = this.newPointArray(6);
    const hs = 3 * gsize;
    const h1 = 3 * gsize;
    const h2 = h1 * 2;
    const len = CircuitElm.distance(this.lead1, this.lead2);
    pts[0] = this.interpPoint(this.lead1, this.lead2, ctr - h2 / len, hs);
    pts[1] = this.interpPoint(this.lead1, this.lead2, ctr + h1 / len, hs);
    pts[2] = this.interpPoint(this.lead1, this.lead2, ctr + h1 / len, -hs);
    pts[3] = this.interpPoint(this.lead1, this.lead2, ctr + h2 / len, -hs);
    pts[4] = this.interpPoint(this.lead1, this.lead2, ctr - h1 / len, -hs);
    pts[5] = this.interpPoint(this.lead1, this.lead2, ctr - h1 / len, hs);
    return this.createPolygon(pts);
  }
  static getVoltageDText(v) {
    return CircuitElm.getUnitText(Math.abs(v), "V");
  }
  static getVoltageText(v) {
    return CircuitElm.getUnitText(v, "V");
  }
  static getTimeText(v) {
    if (v >= 60) {
      const h = Math.floor(v / 3600);
      v -= 3600 * h;
      const m = Math.floor(v / 60);
      v -= 60 * m;
      if (h === 0)
        return m + ":" + (v >= 10 ? "" : "0") + CircuitElm.showFormat.format(v);
      return h + ":" + (m >= 10 ? "" : "0") + m + ":" + (v >= 10 ? "" : "0") + CircuitElm.showFormat.format(v);
    }
    return CircuitElm.getUnitText(v, "s");
  }
  static format(v, sf) {
    return (sf ? CircuitElm.shortFormat : CircuitElm.showFormat).format(v);
  }
  static getUnitText(v, u) {
    return CircuitElm.getUnitTextImpl(v, u, false);
  }
  static getShortUnitText(v, u) {
    return CircuitElm.getUnitTextImpl(v, u, true);
  }
  static getUnitTextImpl(v, u, sf) {
    const sp = sf ? "" : " ";
    const va = Math.abs(v);
    if (va < 1e-14)
      return "0" + sp + u;
    if (va < 1e-9)
      return CircuitElm.format(v * 1e12, sf) + sp + "p" + u;
    if (va < 1e-6)
      return CircuitElm.format(v * 1e9, sf) + sp + "n" + u;
    if (va < 1e-3)
      return CircuitElm.format(v * 1e6, sf) + sp + Locale.muString + u;
    if (va < 1)
      return CircuitElm.format(v * 1e3, sf) + sp + "m" + u;
    if (va < 1e3)
      return CircuitElm.format(v, sf) + sp + u;
    if (va < 1e6)
      return CircuitElm.format(v * 1e-3, sf) + sp + "k" + u;
    if (va < 1e9)
      return CircuitElm.format(v * 1e-6, sf) + sp + "M" + u;
    if (va < 1e12)
      return CircuitElm.format(v * 1e-9, sf) + sp + "G" + u;
    return NumberFormat.getFormat("#.##E000").format(v) + sp + u;
  }
  static getCurrentText(i) {
    return CircuitElm.getUnitText(i, "A");
  }
  static getCurrentDText(i) {
    return CircuitElm.getUnitText(Math.abs(i), "A");
  }
  static getUnitTextWithScale(val, utext, scale, fixed) {
    fixed = fixed ?? false;
    if (Math.abs(val) > 1e12)
      return CircuitElm.getUnitText(val, utext);
    const nf = fixed ? CircuitElm.fixedFormat : CircuitElm.showFormat;
    if (scale === CircuitElm.SCALE_1)
      return nf.format(val) + " " + utext;
    if (scale === CircuitElm.SCALE_M)
      return nf.format(1e3 * val) + " m" + utext;
    if (scale === CircuitElm.SCALE_MU)
      return nf.format(1e6 * val) + " " + Locale.muString + utext;
    return CircuitElm.getUnitText(val, utext);
  }
  // update dot positions (curcount) for drawing current (simple case for single current)
  updateDotCount() {
    this.curcount = this.updateDotCountImpl(this.current, this.curcount);
  }
  // update dot positions (curcount) for drawing current (general case for multiple currents)
  updateDotCountImpl(cur, cc) {
    if (!CircuitElm.app.simIsRunning())
      return cc;
    const cadd = cur * CircuitElm.currentMult;
    if (cadd > 6 || cadd < -6)
      return this.CURRENT_TOO_FAST;
    if (cc === this.CURRENT_TOO_FAST)
      cc = 0;
    return cc + cadd % 8;
  }
  // update and draw current for simple two-terminal element
  doDots(g) {
    this.updateDotCount();
    if (!this.isCreating())
      this.drawDots(g, this.point1, this.point2, this.curcount);
  }
  doAdjust() {
  }
  setupAdjust() {
  }
  // get component info for display in lower right
  getInfo(arr) {
  }
  // get element type name for edit dialog title.  override if getInfo()[0] includes dynamic state.
  getElmType() {
    const info = new Array(10);
    this.getInfo(info);
    return info[0];
  }
  getBasicInfo(arr) {
    arr[1] = "I = " + CircuitElm.getCurrentDText(this.getCurrent());
    arr[2] = "Vd = " + CircuitElm.getVoltageDText(this.getVoltageDiff());
    return 3;
  }
  getScopeText(v) {
    const info = new Array(10);
    this.getInfo(info);
    return info[0];
  }
  getVoltageColor(g, volts) {
    if (this.needsHighlight()) {
      return CircuitElm.selectColor;
    }
    if (!CircuitElm.app.menus.voltsCheckItem.getState()) {
      return CircuitElm.whiteColor;
    }
    if (isNaN(volts))
      volts = 0;
    let c = Math.trunc((volts + CircuitElm.voltageRange) * (CircuitElm.colorScaleCount - 1) / (CircuitElm.voltageRange * 2));
    if (c < 0)
      c = 0;
    if (c >= CircuitElm.colorScaleCount)
      c = CircuitElm.colorScaleCount - 1;
    return CircuitElm.colorScale[c];
  }
  setVoltageColor(g, volts) {
    g.setColor(this.getVoltageColor(g, volts));
  }
  setPowerColor(g, yellowOrW0) {
    if (typeof yellowOrW0 === "boolean") {
      if (!this.showPower())
        return;
      this.setPowerColor(g, this.getPower());
    } else {
      if (!this.showPower())
        return;
      if (this.needsHighlight()) {
        g.setColor(CircuitElm.selectColor);
        return;
      }
      const w0 = yellowOrW0 * CircuitElm.powerMult;
      let i = Math.trunc(CircuitElm.colorScaleCount / 2 + CircuitElm.colorScaleCount / 2 * -w0);
      if (i < 0)
        i = 0;
      if (i >= CircuitElm.colorScaleCount)
        i = CircuitElm.colorScaleCount - 1;
      g.setColor(CircuitElm.colorScale[i]);
    }
  }
  setConductanceColor(g, w0) {
    w0 *= CircuitElm.powerMult;
    const w = w0 < 0 ? -w0 : w0;
    const wClamped = w > 1 ? 1 : w;
    const rg = Math.trunc(wClamped * 255);
    g.setColor(new Color(rg, rg, rg));
  }
  getPower() {
    return this.getVoltageDiff() * this.current;
  }
  getScopeValue(x) {
    return x === Scope.VAL_CURRENT ? this.getCurrent() : x === Scope.VAL_POWER ? this.getPower() : this.getVoltageDiff();
  }
  getScopeUnits(x) {
    return x === Scope.VAL_CURRENT ? Scope.UNITS_A : x === Scope.VAL_POWER ? Scope.UNITS_W : Scope.UNITS_V;
  }
  getEditInfo(n) {
    return null;
  }
  setEditValue(n, ei) {
  }
  // are n1 and n2 connected by this element?  this is used to determine
  // unconnected nodes, and look for loops
  getConnection(n1, n2) {
    return true;
  }
  // are n1 and n2 in the same matrix?  by default same as getConnection(), but
  // can be overridden for elements like MOSFETs where the gate affects drain/source
  // but isn't electrically connected.  n1 and n2 may be internal nodes.
  getMatrixConnection(n1, n2) {
    return this.getConnection(n1, n2);
  }
  // is n1 connected to ground somehow?
  hasGroundConnection(n1) {
    return false;
  }
  // is this a wire or equivalent to a wire?  (used for circuit validation)
  isWireEquivalent() {
    return false;
  }
  // is this a wire we can remove?
  isRemovableWire() {
    return false;
  }
  isIdealCapacitor() {
    return false;
  }
  isExtVoltageElm() {
    return false;
  }
  isVoltageElm() {
    return false;
  }
  isBatteryElm() {
    return false;
  }
  isRailElm() {
    return false;
  }
  isSweepElm() {
    return false;
  }
  isCurrentElm() {
    return false;
  }
  isGroundElm() {
    return false;
  }
  isInductorElm() {
    return false;
  }
  canViewInScope() {
    return this.getPostCount() <= 2;
  }
  canFlipX() {
    return true;
  }
  canFlipY() {
    return true;
  }
  canFlipXY() {
    return this.canFlipX() || this.canFlipY();
  }
  comparePair(x1, x2, y1, y2) {
    return x1 === y1 && x2 === y2 || x1 === y2 && x2 === y1;
  }
  needsHighlight() {
    return CircuitElm.mouseElmRef === this || this.selected || CircuitElm.app.mouse.scopePlotRoles.has(this) || // Test if the current mouseElm is a ScopeElm and, if so, does it belong to this elm
    CircuitElm.mouseElmRef !== null && CircuitElm.mouseElmRef.isScopeElm() && CircuitElm.mouseElmRef.elmScope != null && CircuitElm.mouseElmRef.elmScope.getElm() === this || this.isOnHighlightedNet();
  }
  isOnHighlightedNet() {
    if (CircuitElm.app.mouse.highlightedNode == null)
      return false;
    for (let i = 0; i !== this.getPostCount(); i++)
      if (this.nodes[i] === CircuitElm.app.mouse.highlightedNode)
        return true;
    return false;
  }
  isCreating() {
    return CircuitElm.app.mouse.dragElm === this;
  }
  isSelected() {
    return this.selected;
  }
  canShowValueInScope(v) {
    return false;
  }
  setSelected(x) {
    this.selected = x;
  }
  selectRect(r, add) {
    if (r.intersects(this.boundingBox))
      this.selected = true;
    else if (!add)
      this.selected = false;
  }
  static abs(x) {
    return x < 0 ? -x : x;
  }
  static sign(x) {
    return x < 0 ? -1 : x === 0 ? 0 : 1;
  }
  static min(a, b) {
    return a < b ? a : b;
  }
  static max(a, b) {
    return a > b ? a : b;
  }
  static distance(p1, p2) {
    const x = p1.x - p2.x;
    const y = p1.y - p2.y;
    return Math.sqrt(x * x + y * y);
  }
  getBoundingBox() {
    return this.boundingBox;
  }
  needsShortcut() {
    return this.getShortcut() > 0;
  }
  getShortcut() {
    return 0;
  }
  showValues() {
    return CircuitElm.app.menus.showValuesCheckItem.getState();
  }
  showPower() {
    return CircuitElm.app.menus.powerCheckItem.getState();
  }
  showEuroResistors() {
    return CircuitElm.app.menus.euroResistorCheckItem.getState();
  }
  showOhmSymbol() {
    return CircuitElm.app.menus.showOhmCheckItem.getState();
  }
  useSmallGrid() {
    return CircuitElm.app.menus.smallGridCheckItem.getState();
  }
  doDcAnalysis() {
    return CircuitElm.app.dcAnalysisFlag;
  }
  isPrintable() {
    return CircuitElm.app.isPrintable();
  }
  isWireElm() {
    return false;
  }
  isLabeledNodeElm() {
    return false;
  }
  isBusSplitterElm() {
    return false;
  }
  isScopeElm() {
    return false;
  }
  elmScope = null;
  clearElmScope() {
  }
  isGraphicElm() {
    return false;
  }
  isRoutedWireElm() {
    return false;
  }
  isSwitchElm() {
    return false;
  }
  // whether to automatically bring up the property editor when this element is created
  showPropertiesOnCreate() {
    return true;
  }
  isLogicInputElm() {
    return false;
  }
  isVarRailElm() {
    return false;
  }
  isPotElm() {
    return false;
  }
  isResistorElm() {
    return false;
  }
  isCapacitorElm() {
    return false;
  }
  isSubcircuitElm() {
    return false;
  }
  isTransistorElm() {
    return false;
  }
  isMosfetElm() {
    return false;
  }
  isJfetElm() {
    return false;
  }
  isOutputElm() {
    return false;
  }
  isLogicOutputElm() {
    return false;
  }
  isAudioOutputElm() {
    return false;
  }
  isTestPointElm() {
    return false;
  }
  isProbeElm() {
    return false;
  }
  validate() {
    return true;
  }
  validateRailNode(n) {
    const fpi = new FindPathInfo(FindPathInfo.VOLTAGE, this, this.getNode(n), CircuitElm.sim);
    if (fpi.findPath(CircuitNode.ground)) {
      CircuitElm.sim.stop("Path to ground with no resistance!", this);
      return false;
    }
    return true;
  }
  setMouseElm(v) {
    if (v)
      CircuitElm.mouseElmRef = this;
    else if (CircuitElm.mouseElmRef === this)
      CircuitElm.mouseElmRef = null;
  }
  draggingDone() {
  }
  lineDistanceSq(xa, ya, xb, yb, gx, gy) {
    const dtop = (yb - ya) * gx - (xb - xa) * gy + xb * ya - yb * xa;
    const dbot = (yb - ya) * (yb - ya) + (xb - xa) * (xb - xa);
    return dtop * dtop / dbot;
  }
  getMouseDistance(gx, gy) {
    if (this.getPostCount() === 0)
      return Graphics.distanceSq(gx, gy, (this.x2 + this.x) / 2, (this.y2 + this.y) / 2);
    return this.lineDistanceSq(this.x, this.y, this.x2, this.y2, gx, gy);
  }
  dumpModel() {
    return null;
  }
  dumpXmlModel(doc) {
  }
  isMouseElm() {
    return CircuitElm.mouseElmRef === this;
  }
  updateModels() {
  }
  stepFinished() {
  }
  // get current flowing into node n out of this element
  getCurrentIntoNode(n) {
    if (this.isRefNode(n))
      return 0;
    if (n === 0 && this.getPostCount() === 2)
      return -this.current;
    else
      return this.current;
  }
  flipPosts() {
    const oldx = this.x;
    const oldy = this.y;
    this.x = this.x2;
    this.y = this.y2;
    this.x2 = oldx;
    this.y2 = oldy;
    this.setPoints();
  }
  getClassName() {
    return this.constructor.name;
  }
  dumpXml(doc, elem) {
    CircuitXMLSerializer.dumpAttr(elem, "x", this.x + " " + this.y + " " + this.x2 + " " + this.y2);
    CircuitXMLSerializer.dumpAttr(elem, "f", this.flags);
  }
  undumpXml(xml) {
    this.flags = xml.parseIntAttr("f", this.flags);
  }
  dumpXmlState(doc, elem) {
  }
  getJsArrayString() {
    return [];
  }
  getInfoJS() {
    const jsarr = this.getJsArrayString();
    const arr = new Array(20).fill(null);
    this.getInfo(arr);
    for (let i = 0; arr[i] != null; i++)
      jsarr.push(arr[i]);
    return jsarr;
  }
  getVoltageJS(n) {
    if (n >= this.nodes.length)
      return 0;
    return this.nodes[n].v;
  }
  _jsProxy = null;
  addJSMethods() {
    if (!this._jsProxy)
      this._jsProxy = {};
    const p = this._jsProxy;
    p["getType"] = () => this.getClassName();
    p["getInfo"] = () => this.getInfoJS();
    p["getVoltageDiff"] = () => this.getVoltageDiff();
    p["getVoltage"] = (n) => this.getVoltageJS(n);
    p["getCurrent"] = () => this.getCurrent();
    p["getPostCount"] = () => this.getPostCount();
  }
  getJavaScriptObject() {
    return this._jsProxy ?? this;
  }
}

export { MenuItem as A, Menus as B, CircuitXMLDeserializer as C, DiodeModel as D, EditInfo as E, FindPathInfo as F, Graphics as G, HookRegistry as H, CircuitNodeLink as I, Locale as L, MosfetModel as M, Point as P, RelayModel as R, SubcircuitModel as S, TransistorModel as T, UNITS_OHMS as U, VAL_R as V, WireRouter as W, CirSim as a, CircuitXMLSerializer as b, CircuitElm as c, Choice as d, Checkbox as e, Color as f, Dialog as g, CommandPaletteRegistry as h, CommandPaletteHistory as i, CustomLogicModel as j, ExtListEntry as k, SimulationManager as l, Scope as m, MouseManager as n, ExportAsLocalFileDialog as o, parseIntStrict as p, CircuitLoader as q, parseFloatStrict as r, ScopeTrigger as s, ScrollValuePopup as t, CircuitNode as u, Font as v, Rectangle as w, StringTokenizer as x, ElementFactory as y, CheckItem as z };
