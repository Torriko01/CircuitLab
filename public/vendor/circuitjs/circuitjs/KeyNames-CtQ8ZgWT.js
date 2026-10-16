class KeyNames {
  static PLACEHOLDER_BASE = 300;
  static KEYCODE_BITS = 8;
  // native keyCodes fit comfortably in 8 bits
  static MOD_SHIFT = 1;
  static MOD_CTRL = 2;
  static MOD_ALT = 4;
  static MOD_META = 8;
  static MOD_MASK = KeyNames.MOD_SHIFT | KeyNames.MOD_CTRL | KeyNames.MOD_ALT | KeyNames.MOD_META;
  static isMac = typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac");
  // keys that never generate a keypress event on their own, even with no modifiers held
  static NONPRINTING_KEYCODES = [
    36,
    35,
    33,
    34,
    45,
    112,
    113,
    114,
    115,
    116,
    117,
    118,
    119,
    120,
    121,
    122,
    123
  ];
  static isNonPrinting(keyCode) {
    for (let i = 0; i !== KeyNames.NONPRINTING_KEYCODES.length; i++)
      if (KeyNames.NONPRINTING_KEYCODES[i] === keyCode)
        return true;
    return false;
  }
  // the modifier keys themselves (Shift, Ctrl, Alt, various Meta/Windows/Cmd key codes) --
  // pressing one of these alone (before the "real" key that goes with it) isn't a shortcut
  static isModifierKeyCode(keyCode) {
    switch (keyCode) {
      case 16:
      case 17:
      case 18:
      case 91:
      case 92:
      case 93:
      case 224:
        return true;
    }
    return false;
  }
  // true if a keydown for this key/modifier combo should be matched right away via
  // keyCode (rather than waiting to see if a keypress event follows)
  static usesKeyCodePath(keyCode, ctrl, alt, meta) {
    if (KeyNames.isModifierKeyCode(keyCode))
      return false;
    return ctrl || alt || meta || KeyNames.isNonPrinting(keyCode);
  }
  // encodes a keyCode + modifier state from a keydown event into a placeholder char code,
  // or -1 if this key/modifier combo should go through the ordinary keypress-based path
  // instead (a plain printable character with no Ctrl/Alt/Meta held)
  static keyCodeToPlaceholder(keyCode, shift, ctrl, alt, meta) {
    if (!KeyNames.usesKeyCodePath(keyCode, ctrl, alt, meta))
      return -1;
    const mods = (shift ? KeyNames.MOD_SHIFT : 0) | (ctrl ? KeyNames.MOD_CTRL : 0) | (alt ? KeyNames.MOD_ALT : 0) | (meta ? KeyNames.MOD_META : 0);
    return KeyNames.PLACEHOLDER_BASE + keyCode + (mods << KeyNames.KEYCODE_BITS);
  }
  static keyLabel(keyCode) {
    switch (keyCode) {
      case 36:
        return "Home";
      case 35:
        return "End";
      case 33:
        return "Page Up";
      case 34:
        return "Page Down";
      case 45:
        return "Insert";
      case 112:
        return "F1";
      case 113:
        return "F2";
      case 114:
        return "F3";
      case 115:
        return "F4";
      case 116:
        return "F5";
      case 117:
        return "F6";
      case 118:
        return "F7";
      case 119:
        return "F8";
      case 120:
        return "F9";
      case 121:
        return "F10";
      case 122:
        return "F11";
      case 123:
        return "F12";
      case 186:
        return ";";
      case 187:
        return "=";
      case 188:
        return ",";
      case 189:
        return "-";
      case 190:
        return ".";
      case 191:
        return "/";
      case 192:
        return "`";
      case 219:
        return "[";
      case 220:
        return "\\";
      case 221:
        return "]";
      case 222:
        return "'";
    }
    if (keyCode >= 65 && keyCode <= 90)
      return String.fromCharCode(keyCode);
    if (keyCode >= 48 && keyCode <= 57)
      return String.fromCharCode(keyCode);
    return "Key" + keyCode;
  }
  // display name for a placeholder char code, or null if c isn't one of ours
  static displayName(c) {
    const code = c - KeyNames.PLACEHOLDER_BASE;
    if (code < 0)
      return null;
    const keyCode = code & (1 << KeyNames.KEYCODE_BITS) - 1;
    const mods = code >> KeyNames.KEYCODE_BITS;
    if ((mods & -16) !== 0)
      return null;
    let sb = "";
    if ((mods & KeyNames.MOD_CTRL) !== 0)
      sb += "Ctrl-";
    if ((mods & KeyNames.MOD_ALT) !== 0)
      sb += KeyNames.isMac ? "Opt-" : "Alt-";
    if ((mods & KeyNames.MOD_META) !== 0)
      sb += KeyNames.isMac ? "Cmd-" : "Win-";
    if ((mods & KeyNames.MOD_SHIFT) !== 0)
      sb += "Shift-";
    sb += KeyNames.keyLabel(keyCode);
    return sb;
  }
  // text to show in the UI for a stored (single-char) shortcut string
  static displayText(shortcut) {
    if (shortcut == null || shortcut.length !== 1)
      return shortcut;
    if (shortcut.charAt(0) === " ")
      return "Space";
    const name = KeyNames.displayName(shortcut.charCodeAt(0));
    return name != null ? name : shortcut;
  }
}

export { KeyNames as K };
