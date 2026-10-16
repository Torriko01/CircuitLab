import { C as CircuitXMLDeserializer, a as CirSim, b as CircuitXMLSerializer, D as DiodeModel, H as HookRegistry, L as Locale } from './CircuitElm-D0NL-LPP.js';
import './EditSubcircuitModelDialog-C5vUSIFP.js';
import './KeyNames-CtQ8ZgWT.js';

function _mergeNamespaces(n, m) {
	for (var i = 0; i < m.length; i++) {
		const e = m[i];
		if (typeof e !== 'string' && !Array.isArray(e)) { for (const k in e) {
			if (k !== 'default' && !(k in n)) {
				const d = Object.getOwnPropertyDescriptor(e, k);
				if (d) {
					Object.defineProperty(n, k, d.get ? d : {
						enumerable: true,
						get: () => e[k]
					});
				}
			}
		} }
	}
	return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: 'Module' }));
}

true              &&(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
}());

class JSInterface {
  app;
  constructor(app) {
    this.app = app;
  }
  setExtVoltage(name, v) {
    for (let i = 0; i !== this.app.elmList.length; i++) {
      const ce = this.app.getElm(i);
      if (ce.isExtVoltageElm()) {
        if (ce.getName() === name)
          ce.setVoltage(v);
      }
    }
  }
  getJSElements() {
    const arr = [];
    for (let i = 0; i !== this.app.elmList.length; i++) {
      const ce = this.app.getElm(i);
      ce.addJSMethods();
      arr.push(ce.getJavaScriptObject());
    }
    return arr;
  }
  getLabeledNodeVoltage(name) {
    return this.app.sim.getLabeledNodeVoltage(name);
  }
  // Delegate methods for JS API access
  setSimRunning(run) {
    this.app.setSimRunning(run);
  }
  simIsRunning() {
    return this.app.simIsRunning();
  }
  doExportAsSVGFromAPI() {
    this.app.imageExporter.doExportAsSVGFromAPI();
  }
  dumpCircuit() {
    return this.app.dumpCircuit();
  }
  importCircuitFromText(t, s) {
    this.app.importCircuitFromText(t, s);
  }
  getTime() {
    return this.app.sim.t;
  }
  getTimeStep() {
    return this.app.sim.timeStep;
  }
  setTimeStep(ts) {
    this.app.sim.timeStep = ts;
  }
  getMaxTimeStep() {
    return this.app.sim.maxTimeStep;
  }
  setMaxTimeStep(ts) {
    this.app.sim.maxTimeStep = this.app.sim.timeStep = ts;
  }
  setupJSInterface() {
    const that = this;
    window.CircuitJS1 = {
      setSimRunning: (run) => that.setSimRunning(run),
      getTime: () => that.getTime(),
      getTimeStep: () => that.getTimeStep(),
      setTimeStep: (ts) => that.setTimeStep(ts),
      // don't use this, see #843
      getMaxTimeStep: () => that.getMaxTimeStep(),
      setMaxTimeStep: (ts) => that.setMaxTimeStep(ts),
      isRunning: () => that.simIsRunning(),
      getNodeVoltage: (n) => that.getLabeledNodeVoltage(n),
      setExtVoltage: (n, v) => that.setExtVoltage(n, v),
      getElements: () => that.getJSElements(),
      getCircuitAsSVG: () => that.doExportAsSVGFromAPI(),
      exportCircuit: () => that.dumpCircuit(),
      importCircuit: (circuit, subcircuitsOnly) => that.importCircuitFromText(circuit, subcircuitsOnly)
    };
    const hook = window.oncircuitjsloaded;
    if (hook)
      hook(window.CircuitJS1);
  }
  callUpdateHook() {
    const hook = window.CircuitJS1?.onupdate;
    if (hook)
      hook(window.CircuitJS1);
  }
  callAnalyzeHook() {
    const hook = window.CircuitJS1?.onanalyze;
    if (hook)
      hook(window.CircuitJS1);
  }
  callTimeStepHook() {
    const hook = window.CircuitJS1?.ontimestep;
    if (hook)
      hook(window.CircuitJS1);
  }
  callSVGRenderedHook(svgData) {
    const hook = window.CircuitJS1?.onsvgrendered;
    if (hook)
      hook(window.CircuitJS1, svgData);
  }
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var lzString$1 = {exports: {}};

var hasRequiredLzString;

function requireLzString () {
	if (hasRequiredLzString) return lzString$1.exports;
	hasRequiredLzString = 1;
	(function (module) {
		// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
		// This work is free. You can redistribute it and/or modify it
		// under the terms of the WTFPL, Version 2
		// For more information see LICENSE.txt or http://www.wtfpl.net/
		//
		// For more information, the home page:
		// http://pieroxy.net/blog/pages/lz-string/testing.html
		//
		// LZ-based compression algorithm, version 1.4.5
		var LZString = (function() {

		// private property
		var f = String.fromCharCode;
		var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
		var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
		var baseReverseDic = {};

		function getBaseValue(alphabet, character) {
		  if (!baseReverseDic[alphabet]) {
		    baseReverseDic[alphabet] = {};
		    for (var i=0 ; i<alphabet.length ; i++) {
		      baseReverseDic[alphabet][alphabet.charAt(i)] = i;
		    }
		  }
		  return baseReverseDic[alphabet][character];
		}

		var LZString = {
		  compressToBase64 : function (input) {
		    if (input == null) return "";
		    var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
		    switch (res.length % 4) { // To produce valid Base64
		    default: // When could this happen ?
		    case 0 : return res;
		    case 1 : return res+"===";
		    case 2 : return res+"==";
		    case 3 : return res+"=";
		    }
		  },

		  decompressFromBase64 : function (input) {
		    if (input == null) return "";
		    if (input == "") return null;
		    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
		  },

		  compressToUTF16 : function (input) {
		    if (input == null) return "";
		    return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
		  },

		  decompressFromUTF16: function (compressed) {
		    if (compressed == null) return "";
		    if (compressed == "") return null;
		    return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
		  },

		  //compress into uint8array (UCS-2 big endian format)
		  compressToUint8Array: function (uncompressed) {
		    var compressed = LZString.compress(uncompressed);
		    var buf=new Uint8Array(compressed.length*2); // 2 bytes per character

		    for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
		      var current_value = compressed.charCodeAt(i);
		      buf[i*2] = current_value >>> 8;
		      buf[i*2+1] = current_value % 256;
		    }
		    return buf;
		  },

		  //decompress from uint8array (UCS-2 big endian format)
		  decompressFromUint8Array:function (compressed) {
		    if (compressed===null || compressed===undefined){
		        return LZString.decompress(compressed);
		    } else {
		        var buf=new Array(compressed.length/2); // 2 bytes per character
		        for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
		          buf[i]=compressed[i*2]*256+compressed[i*2+1];
		        }

		        var result = [];
		        buf.forEach(function (c) {
		          result.push(f(c));
		        });
		        return LZString.decompress(result.join(''));

		    }

		  },


		  //compress into a string that is already URI encoded
		  compressToEncodedURIComponent: function (input) {
		    if (input == null) return "";
		    return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
		  },

		  //decompress from an output of compressToEncodedURIComponent
		  decompressFromEncodedURIComponent:function (input) {
		    if (input == null) return "";
		    if (input == "") return null;
		    input = input.replace(/ /g, "+");
		    return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
		  },

		  compress: function (uncompressed) {
		    return LZString._compress(uncompressed, 16, function(a){return f(a);});
		  },
		  _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
		    if (uncompressed == null) return "";
		    var i, value,
		        context_dictionary= {},
		        context_dictionaryToCreate= {},
		        context_c="",
		        context_wc="",
		        context_w="",
		        context_enlargeIn= 2, // Compensate for the first entry which should not count
		        context_dictSize= 3,
		        context_numBits= 2,
		        context_data=[],
		        context_data_val=0,
		        context_data_position=0,
		        ii;

		    for (ii = 0; ii < uncompressed.length; ii += 1) {
		      context_c = uncompressed.charAt(ii);
		      if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
		        context_dictionary[context_c] = context_dictSize++;
		        context_dictionaryToCreate[context_c] = true;
		      }

		      context_wc = context_w + context_c;
		      if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
		        context_w = context_wc;
		      } else {
		        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
		          if (context_w.charCodeAt(0)<256) {
		            for (i=0 ; i<context_numBits ; i++) {
		              context_data_val = (context_data_val << 1);
		              if (context_data_position == bitsPerChar-1) {
		                context_data_position = 0;
		                context_data.push(getCharFromInt(context_data_val));
		                context_data_val = 0;
		              } else {
		                context_data_position++;
		              }
		            }
		            value = context_w.charCodeAt(0);
		            for (i=0 ; i<8 ; i++) {
		              context_data_val = (context_data_val << 1) | (value&1);
		              if (context_data_position == bitsPerChar-1) {
		                context_data_position = 0;
		                context_data.push(getCharFromInt(context_data_val));
		                context_data_val = 0;
		              } else {
		                context_data_position++;
		              }
		              value = value >> 1;
		            }
		          } else {
		            value = 1;
		            for (i=0 ; i<context_numBits ; i++) {
		              context_data_val = (context_data_val << 1) | value;
		              if (context_data_position ==bitsPerChar-1) {
		                context_data_position = 0;
		                context_data.push(getCharFromInt(context_data_val));
		                context_data_val = 0;
		              } else {
		                context_data_position++;
		              }
		              value = 0;
		            }
		            value = context_w.charCodeAt(0);
		            for (i=0 ; i<16 ; i++) {
		              context_data_val = (context_data_val << 1) | (value&1);
		              if (context_data_position == bitsPerChar-1) {
		                context_data_position = 0;
		                context_data.push(getCharFromInt(context_data_val));
		                context_data_val = 0;
		              } else {
		                context_data_position++;
		              }
		              value = value >> 1;
		            }
		          }
		          context_enlargeIn--;
		          if (context_enlargeIn == 0) {
		            context_enlargeIn = Math.pow(2, context_numBits);
		            context_numBits++;
		          }
		          delete context_dictionaryToCreate[context_w];
		        } else {
		          value = context_dictionary[context_w];
		          for (i=0 ; i<context_numBits ; i++) {
		            context_data_val = (context_data_val << 1) | (value&1);
		            if (context_data_position == bitsPerChar-1) {
		              context_data_position = 0;
		              context_data.push(getCharFromInt(context_data_val));
		              context_data_val = 0;
		            } else {
		              context_data_position++;
		            }
		            value = value >> 1;
		          }


		        }
		        context_enlargeIn--;
		        if (context_enlargeIn == 0) {
		          context_enlargeIn = Math.pow(2, context_numBits);
		          context_numBits++;
		        }
		        // Add wc to the dictionary.
		        context_dictionary[context_wc] = context_dictSize++;
		        context_w = String(context_c);
		      }
		    }

		    // Output the code for w.
		    if (context_w !== "") {
		      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
		        if (context_w.charCodeAt(0)<256) {
		          for (i=0 ; i<context_numBits ; i++) {
		            context_data_val = (context_data_val << 1);
		            if (context_data_position == bitsPerChar-1) {
		              context_data_position = 0;
		              context_data.push(getCharFromInt(context_data_val));
		              context_data_val = 0;
		            } else {
		              context_data_position++;
		            }
		          }
		          value = context_w.charCodeAt(0);
		          for (i=0 ; i<8 ; i++) {
		            context_data_val = (context_data_val << 1) | (value&1);
		            if (context_data_position == bitsPerChar-1) {
		              context_data_position = 0;
		              context_data.push(getCharFromInt(context_data_val));
		              context_data_val = 0;
		            } else {
		              context_data_position++;
		            }
		            value = value >> 1;
		          }
		        } else {
		          value = 1;
		          for (i=0 ; i<context_numBits ; i++) {
		            context_data_val = (context_data_val << 1) | value;
		            if (context_data_position == bitsPerChar-1) {
		              context_data_position = 0;
		              context_data.push(getCharFromInt(context_data_val));
		              context_data_val = 0;
		            } else {
		              context_data_position++;
		            }
		            value = 0;
		          }
		          value = context_w.charCodeAt(0);
		          for (i=0 ; i<16 ; i++) {
		            context_data_val = (context_data_val << 1) | (value&1);
		            if (context_data_position == bitsPerChar-1) {
		              context_data_position = 0;
		              context_data.push(getCharFromInt(context_data_val));
		              context_data_val = 0;
		            } else {
		              context_data_position++;
		            }
		            value = value >> 1;
		          }
		        }
		        context_enlargeIn--;
		        if (context_enlargeIn == 0) {
		          context_enlargeIn = Math.pow(2, context_numBits);
		          context_numBits++;
		        }
		        delete context_dictionaryToCreate[context_w];
		      } else {
		        value = context_dictionary[context_w];
		        for (i=0 ; i<context_numBits ; i++) {
		          context_data_val = (context_data_val << 1) | (value&1);
		          if (context_data_position == bitsPerChar-1) {
		            context_data_position = 0;
		            context_data.push(getCharFromInt(context_data_val));
		            context_data_val = 0;
		          } else {
		            context_data_position++;
		          }
		          value = value >> 1;
		        }


		      }
		      context_enlargeIn--;
		      if (context_enlargeIn == 0) {
		        context_enlargeIn = Math.pow(2, context_numBits);
		        context_numBits++;
		      }
		    }

		    // Mark the end of the stream
		    value = 2;
		    for (i=0 ; i<context_numBits ; i++) {
		      context_data_val = (context_data_val << 1) | (value&1);
		      if (context_data_position == bitsPerChar-1) {
		        context_data_position = 0;
		        context_data.push(getCharFromInt(context_data_val));
		        context_data_val = 0;
		      } else {
		        context_data_position++;
		      }
		      value = value >> 1;
		    }

		    // Flush the last char
		    while (true) {
		      context_data_val = (context_data_val << 1);
		      if (context_data_position == bitsPerChar-1) {
		        context_data.push(getCharFromInt(context_data_val));
		        break;
		      }
		      else context_data_position++;
		    }
		    return context_data.join('');
		  },

		  decompress: function (compressed) {
		    if (compressed == null) return "";
		    if (compressed == "") return null;
		    return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
		  },

		  _decompress: function (length, resetValue, getNextValue) {
		    var dictionary = [],
		        enlargeIn = 4,
		        dictSize = 4,
		        numBits = 3,
		        entry = "",
		        result = [],
		        i,
		        w,
		        bits, resb, maxpower, power,
		        c,
		        data = {val:getNextValue(0), position:resetValue, index:1};

		    for (i = 0; i < 3; i += 1) {
		      dictionary[i] = i;
		    }

		    bits = 0;
		    maxpower = Math.pow(2,2);
		    power=1;
		    while (power!=maxpower) {
		      resb = data.val & data.position;
		      data.position >>= 1;
		      if (data.position == 0) {
		        data.position = resetValue;
		        data.val = getNextValue(data.index++);
		      }
		      bits |= (resb>0 ? 1 : 0) * power;
		      power <<= 1;
		    }

		    switch (bits) {
		      case 0:
		          bits = 0;
		          maxpower = Math.pow(2,8);
		          power=1;
		          while (power!=maxpower) {
		            resb = data.val & data.position;
		            data.position >>= 1;
		            if (data.position == 0) {
		              data.position = resetValue;
		              data.val = getNextValue(data.index++);
		            }
		            bits |= (resb>0 ? 1 : 0) * power;
		            power <<= 1;
		          }
		        c = f(bits);
		        break;
		      case 1:
		          bits = 0;
		          maxpower = Math.pow(2,16);
		          power=1;
		          while (power!=maxpower) {
		            resb = data.val & data.position;
		            data.position >>= 1;
		            if (data.position == 0) {
		              data.position = resetValue;
		              data.val = getNextValue(data.index++);
		            }
		            bits |= (resb>0 ? 1 : 0) * power;
		            power <<= 1;
		          }
		        c = f(bits);
		        break;
		      case 2:
		        return "";
		    }
		    dictionary[3] = c;
		    w = c;
		    result.push(c);
		    while (true) {
		      if (data.index > length) {
		        return "";
		      }

		      bits = 0;
		      maxpower = Math.pow(2,numBits);
		      power=1;
		      while (power!=maxpower) {
		        resb = data.val & data.position;
		        data.position >>= 1;
		        if (data.position == 0) {
		          data.position = resetValue;
		          data.val = getNextValue(data.index++);
		        }
		        bits |= (resb>0 ? 1 : 0) * power;
		        power <<= 1;
		      }

		      switch (c = bits) {
		        case 0:
		          bits = 0;
		          maxpower = Math.pow(2,8);
		          power=1;
		          while (power!=maxpower) {
		            resb = data.val & data.position;
		            data.position >>= 1;
		            if (data.position == 0) {
		              data.position = resetValue;
		              data.val = getNextValue(data.index++);
		            }
		            bits |= (resb>0 ? 1 : 0) * power;
		            power <<= 1;
		          }

		          dictionary[dictSize++] = f(bits);
		          c = dictSize-1;
		          enlargeIn--;
		          break;
		        case 1:
		          bits = 0;
		          maxpower = Math.pow(2,16);
		          power=1;
		          while (power!=maxpower) {
		            resb = data.val & data.position;
		            data.position >>= 1;
		            if (data.position == 0) {
		              data.position = resetValue;
		              data.val = getNextValue(data.index++);
		            }
		            bits |= (resb>0 ? 1 : 0) * power;
		            power <<= 1;
		          }
		          dictionary[dictSize++] = f(bits);
		          c = dictSize-1;
		          enlargeIn--;
		          break;
		        case 2:
		          return result.join('');
		      }

		      if (enlargeIn == 0) {
		        enlargeIn = Math.pow(2, numBits);
		        numBits++;
		      }

		      if (dictionary[c]) {
		        entry = dictionary[c];
		      } else {
		        if (c === dictSize) {
		          entry = w + w.charAt(0);
		        } else {
		          return null;
		        }
		      }
		      result.push(entry);

		      // Add w+entry[0] to the dictionary.
		      dictionary[dictSize++] = w + entry.charAt(0);
		      enlargeIn--;

		      w = entry;

		      if (enlargeIn == 0) {
		        enlargeIn = Math.pow(2, numBits);
		        numBits++;
		      }

		    }
		  }
		};
		  return LZString;
		})();

		if( module != null ) {
		  module.exports = LZString;
		} else if( typeof angular !== 'undefined' && angular != null ) {
		  angular.module('LZString', [])
		  .factory('LZString', function () {
		    return LZString;
		  });
		} 
	} (lzString$1));
	return lzString$1.exports;
}

var lzStringExports = requireLzString();
const lzString = /*@__PURE__*/getDefaultExportFromCjs(lzStringExports);

const LZString = /*#__PURE__*/_mergeNamespaces({
	__proto__: null,
	default: lzString
}, [lzStringExports]);

/*!!
 *  Canvas 2 Svg v1.0.19
 *  A low level canvas to SVG converter. Uses a mock canvas context to build an SVG document.
 *
 *  Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 *
 *  Author:
 *  Kerry Liu
 *
 *  Copyright (c) 2014 Gliffy Inc.
 */

(function () {

    var STYLES, ctx, CanvasGradient, CanvasPattern, namedEntities;

    //helper function to format a string
    function format(str, args) {
        var keys = Object.keys(args), i;
        for (i=0; i<keys.length; i++) {
            str = str.replace(new RegExp("\\{" + keys[i] + "\\}", "gi"), args[keys[i]]);
        }
        return str;
    }

    //helper function that generates a random string
    function randomString(holder) {
        var chars, randomstring, i;
        if (!holder) {
            throw new Error("cannot create a random attribute name for an undefined object");
        }
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        randomstring = "";
        do {
            randomstring = "";
            for (i = 0; i < 12; i++) {
                randomstring += chars[Math.floor(Math.random() * chars.length)];
            }
        } while (holder[randomstring]);
        return randomstring;
    }

    //helper function to map named to numbered entities
    function createNamedToNumberedLookup(items, radix) {
        var i, entity, lookup = {}, base10;
        items = items.split(',');
        radix = radix || 10;
        // Map from named to numbered entities.
        for (i = 0; i < items.length; i += 2) {
            entity = '&' + items[i + 1] + ';';
            base10 = parseInt(items[i], radix);
            lookup[entity] = '&#'+base10+';';
        }
        //FF and IE need to create a regex from hex values ie &nbsp; == \xa0
        lookup["\\xa0"] = '&#160;';
        return lookup;
    }

    //helper function to map canvas-textAlign to svg-textAnchor
    function getTextAnchor(textAlign) {
        //TODO: support rtl languages
        var mapping = {"left":"start", "right":"end", "center":"middle", "start":"start", "end":"end"};
        return mapping[textAlign] || mapping.start;
    }

    //helper function to map canvas-textBaseline to svg-dominantBaseline
    function getDominantBaseline(textBaseline) {
        //INFO: not supported in all browsers
        var mapping = {"alphabetic": "alphabetic", "hanging": "hanging", "top":"text-before-edge", "bottom":"text-after-edge", "middle":"central"};
        return mapping[textBaseline] || mapping.alphabetic;
    }

    // Unpack entities lookup where the numbers are in radix 32 to reduce the size
    // entity mapping courtesy of tinymce
    namedEntities = createNamedToNumberedLookup(
        '50,nbsp,51,iexcl,52,cent,53,pound,54,curren,55,yen,56,brvbar,57,sect,58,uml,59,copy,' +
            '5a,ordf,5b,laquo,5c,not,5d,shy,5e,reg,5f,macr,5g,deg,5h,plusmn,5i,sup2,5j,sup3,5k,acute,' +
            '5l,micro,5m,para,5n,middot,5o,cedil,5p,sup1,5q,ordm,5r,raquo,5s,frac14,5t,frac12,5u,frac34,' +
            '5v,iquest,60,Agrave,61,Aacute,62,Acirc,63,Atilde,64,Auml,65,Aring,66,AElig,67,Ccedil,' +
            '68,Egrave,69,Eacute,6a,Ecirc,6b,Euml,6c,Igrave,6d,Iacute,6e,Icirc,6f,Iuml,6g,ETH,6h,Ntilde,' +
            '6i,Ograve,6j,Oacute,6k,Ocirc,6l,Otilde,6m,Ouml,6n,times,6o,Oslash,6p,Ugrave,6q,Uacute,' +
            '6r,Ucirc,6s,Uuml,6t,Yacute,6u,THORN,6v,szlig,70,agrave,71,aacute,72,acirc,73,atilde,74,auml,' +
            '75,aring,76,aelig,77,ccedil,78,egrave,79,eacute,7a,ecirc,7b,euml,7c,igrave,7d,iacute,7e,icirc,' +
            '7f,iuml,7g,eth,7h,ntilde,7i,ograve,7j,oacute,7k,ocirc,7l,otilde,7m,ouml,7n,divide,7o,oslash,' +
            '7p,ugrave,7q,uacute,7r,ucirc,7s,uuml,7t,yacute,7u,thorn,7v,yuml,ci,fnof,sh,Alpha,si,Beta,' +
            'sj,Gamma,sk,Delta,sl,Epsilon,sm,Zeta,sn,Eta,so,Theta,sp,Iota,sq,Kappa,sr,Lambda,ss,Mu,' +
            'st,Nu,su,Xi,sv,Omicron,t0,Pi,t1,Rho,t3,Sigma,t4,Tau,t5,Upsilon,t6,Phi,t7,Chi,t8,Psi,' +
            't9,Omega,th,alpha,ti,beta,tj,gamma,tk,delta,tl,epsilon,tm,zeta,tn,eta,to,theta,tp,iota,' +
            'tq,kappa,tr,lambda,ts,mu,tt,nu,tu,xi,tv,omicron,u0,pi,u1,rho,u2,sigmaf,u3,sigma,u4,tau,' +
            'u5,upsilon,u6,phi,u7,chi,u8,psi,u9,omega,uh,thetasym,ui,upsih,um,piv,812,bull,816,hellip,' +
            '81i,prime,81j,Prime,81u,oline,824,frasl,88o,weierp,88h,image,88s,real,892,trade,89l,alefsym,' +
            '8cg,larr,8ch,uarr,8ci,rarr,8cj,darr,8ck,harr,8dl,crarr,8eg,lArr,8eh,uArr,8ei,rArr,8ej,dArr,' +
            '8ek,hArr,8g0,forall,8g2,part,8g3,exist,8g5,empty,8g7,nabla,8g8,isin,8g9,notin,8gb,ni,8gf,prod,' +
            '8gh,sum,8gi,minus,8gn,lowast,8gq,radic,8gt,prop,8gu,infin,8h0,ang,8h7,and,8h8,or,8h9,cap,8ha,cup,' +
            '8hb,int,8hk,there4,8hs,sim,8i5,cong,8i8,asymp,8j0,ne,8j1,equiv,8j4,le,8j5,ge,8k2,sub,8k3,sup,8k4,' +
            'nsub,8k6,sube,8k7,supe,8kl,oplus,8kn,otimes,8l5,perp,8m5,sdot,8o8,lceil,8o9,rceil,8oa,lfloor,8ob,' +
            'rfloor,8p9,lang,8pa,rang,9ea,loz,9j0,spades,9j3,clubs,9j5,hearts,9j6,diams,ai,OElig,aj,oelig,b0,' +
            'Scaron,b1,scaron,bo,Yuml,m6,circ,ms,tilde,802,ensp,803,emsp,809,thinsp,80c,zwnj,80d,zwj,80e,lrm,' +
            '80f,rlm,80j,ndash,80k,mdash,80o,lsquo,80p,rsquo,80q,sbquo,80s,ldquo,80t,rdquo,80u,bdquo,810,dagger,' +
            '811,Dagger,81g,permil,81p,lsaquo,81q,rsaquo,85c,euro', 32);


    //Some basic mappings for attributes and default values.
    STYLES = {
        "strokeStyle":{
            svgAttr : "stroke", //corresponding svg attribute
            canvas : "#000000", //canvas default
            svg : "none",       //svg default
            apply : "stroke"    //apply on stroke() or fill()
        },
        "fillStyle":{
            svgAttr : "fill",
            canvas : "#000000",
            svg : null, //svg default is black, but we need to special case this to handle canvas stroke without fill
            apply : "fill"
        },
        "lineCap":{
            svgAttr : "stroke-linecap",
            canvas : "butt",
            svg : "butt",
            apply : "stroke"
        },
        "lineJoin":{
            svgAttr : "stroke-linejoin",
            canvas : "miter",
            svg : "miter",
            apply : "stroke"
        },
        "miterLimit":{
            svgAttr : "stroke-miterlimit",
            canvas : 10,
            svg : 4,
            apply : "stroke"
        },
        "lineWidth":{
            svgAttr : "stroke-width",
            canvas : 1,
            svg : 1,
            apply : "stroke"
        },
        "globalAlpha": {
            svgAttr : "opacity",
            canvas : 1,
            svg : 1,
            apply :  "fill stroke"
        },
        "font":{
            //font converts to multiple svg attributes, there is custom logic for this
            canvas : "10px sans-serif"
        },
        "shadowColor":{
            canvas : "#000000"
        },
        "shadowOffsetX":{
            canvas : 0
        },
        "shadowOffsetY":{
            canvas : 0
        },
        "shadowBlur":{
            canvas : 0
        },
        "textAlign":{
            canvas : "start"
        },
        "textBaseline":{
            canvas : "alphabetic"
        },
        "lineDash" : {
            svgAttr : "stroke-dasharray",
            canvas : [],
            svg : null,
            apply : "stroke"
        }
    };

    /**
     *
     * @param gradientNode - reference to the gradient
     * @constructor
     */
    CanvasGradient = function (gradientNode, ctx) {
        this.__root = gradientNode;
        this.__ctx = ctx;
    };

    /**
     * Adds a color stop to the gradient root
     */
    CanvasGradient.prototype.addColorStop = function (offset, color) {
        var stop = this.__ctx.__createElement("stop"), regex, matches;
        stop.setAttribute("offset", offset);
        if (color.indexOf("rgba") !== -1) {
            //separate alpha value, since webkit can't handle it
            regex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d?\.?\d*)\s*\)/gi;
            matches = regex.exec(color);
            stop.setAttribute("stop-color", format("rgb({r},{g},{b})", {r:matches[1], g:matches[2], b:matches[3]}));
            stop.setAttribute("stop-opacity", matches[4]);
        } else {
            stop.setAttribute("stop-color", color);
        }
        this.__root.appendChild(stop);
    };

    CanvasPattern = function (pattern, ctx) {
        this.__root = pattern;
        this.__ctx = ctx;
    };

    /**
     * The mock canvas context
     * @param o - options include:
     * ctx - existing Context2D to wrap around
     * width - width of your canvas (defaults to 500)
     * height - height of your canvas (defaults to 500)
     * enableMirroring - enables canvas mirroring (get image data) (defaults to false)
     * document - the document object (defaults to the current document)
     */
    ctx = function (o) {
        var defaultOptions = { width:500, height:500, enableMirroring : false}, options;

        //keep support for this way of calling C2S: new C2S(width,height)
        if (arguments.length > 1) {
            options = defaultOptions;
            options.width = arguments[0];
            options.height = arguments[1];
        } else if ( !o ) {
            options = defaultOptions;
        } else {
            options = o;
        }

        if (!(this instanceof ctx)) {
            //did someone call this without new?
            return new ctx(options);
        }

        //setup options
        this.width = options.width || defaultOptions.width;
        this.height = options.height || defaultOptions.height;
        this.enableMirroring = options.enableMirroring !== undefined ? options.enableMirroring : defaultOptions.enableMirroring;

        this.canvas = this;   ///point back to this instance!
        this.__document = options.document || document;

        // allow passing in an existing context to wrap around
        // if a context is passed in, we know a canvas already exist
        if (options.ctx) {
            this.__ctx = options.ctx;
        } else {
            this.__canvas = this.__document.createElement("canvas");
            this.__ctx = this.__canvas.getContext("2d");
        }

        this.__setDefaultStyles();
        this.__stack = [this.__getStyleState()];
        this.__groupStack = [];

        //the root svg element
        this.__root = this.__document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.__root.setAttribute("version", 1.1);
        this.__root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        this.__root.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        this.__root.setAttribute("width", this.width);
        this.__root.setAttribute("height", this.height);

        //make sure we don't generate the same ids in defs
        this.__ids = {};

        //defs tag
        this.__defs = this.__document.createElementNS("http://www.w3.org/2000/svg", "defs");
        this.__root.appendChild(this.__defs);

        //also add a group child. the svg element can't use the transform attribute
        this.__currentElement = this.__document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.__root.appendChild(this.__currentElement);
    };


    /**
     * Creates the specified svg element
     * @private
     */
    ctx.prototype.__createElement = function (elementName, properties, resetFill) {
        if (typeof properties === "undefined") {
            properties = {};
        }

        var element = this.__document.createElementNS("http://www.w3.org/2000/svg", elementName),
            keys = Object.keys(properties), i, key;
        if (resetFill) {
            //if fill or stroke is not specified, the svg element should not display. By default SVG's fill is black.
            element.setAttribute("fill", "none");
            element.setAttribute("stroke", "none");
        }
        for (i=0; i<keys.length; i++) {
            key = keys[i];
            element.setAttribute(key, properties[key]);
        }
        return element;
    };

    /**
     * Applies default canvas styles to the context
     * @private
     */
    ctx.prototype.__setDefaultStyles = function () {
        //default 2d canvas context properties see:http://www.w3.org/TR/2dcontext/
        var keys = Object.keys(STYLES), i, key;
        for (i=0; i<keys.length; i++) {
            key = keys[i];
            this[key] = STYLES[key].canvas;
        }
    };

    /**
     * Applies styles on restore
     * @param styleState
     * @private
     */
    ctx.prototype.__applyStyleState = function (styleState) {
        var keys = Object.keys(styleState), i, key;
        for (i=0; i<keys.length; i++) {
            key = keys[i];
            this[key] = styleState[key];
        }
    };

    /**
     * Gets the current style state
     * @return {Object}
     * @private
     */
    ctx.prototype.__getStyleState = function () {
        var i, styleState = {}, keys = Object.keys(STYLES), key;
        for (i=0; i<keys.length; i++) {
            key = keys[i];
            styleState[key] = this[key];
        }
        return styleState;
    };

    /**
     * Apples the current styles to the current SVG element. On "ctx.fill" or "ctx.stroke"
     * @param type
     * @private
     */
    ctx.prototype.__applyStyleToCurrentElement = function (type) {
	this.lineCap = 'round';
    	var currentElement = this.__currentElement;
    	var currentStyleGroup = this.__currentElementsToStyle;
    	if (currentStyleGroup) {
    		currentElement.setAttribute(type, "");
    		currentElement = currentStyleGroup.element;
    		currentStyleGroup.children.forEach(function (node) {
    			node.setAttribute(type, "");
    		});
    	}

        var keys = Object.keys(STYLES), i, style, value, id, regex, matches;
        for (i = 0; i < keys.length; i++) {
            style = STYLES[keys[i]];
            value = this[keys[i]];
            if (style.apply) {
                //is this a gradient or pattern?
                if (value instanceof CanvasPattern) {
                    //pattern
                    if (value.__ctx) {
                        //copy over defs
                        while(value.__ctx.__defs.childNodes.length) {
                            id = value.__ctx.__defs.childNodes[0].getAttribute("id");
                            this.__ids[id] = id;
                            this.__defs.appendChild(value.__ctx.__defs.childNodes[0]);
                        }
                    }
                    currentElement.setAttribute(style.apply, format("url(#{id})", {id:value.__root.getAttribute("id")}));
                }
                else if (value instanceof CanvasGradient) {
                    //gradient
                    currentElement.setAttribute(style.apply, format("url(#{id})", {id:value.__root.getAttribute("id")}));
                } else if (style.apply.indexOf(type)!==-1 && style.svg !== value) {
                    if ((style.svgAttr === "stroke" || style.svgAttr === "fill") && value.indexOf("rgba") !== -1) {
                        //separate alpha value, since illustrator can't handle it
                        regex = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d?\.?\d*)\s*\)/gi;
                        matches = regex.exec(value);
                        currentElement.setAttribute(style.svgAttr, format("rgb({r},{g},{b})", {r:matches[1], g:matches[2], b:matches[3]}));
                        //should take globalAlpha here
                        var opacity = matches[4];
                        var globalAlpha = this.globalAlpha;
                        if (globalAlpha != null) {
                            opacity *= globalAlpha;
                        }
                        currentElement.setAttribute(style.svgAttr+"-opacity", opacity);
                    } else {
                        var attr = style.svgAttr;
                        if (keys[i] === 'globalAlpha') {
                            attr = type+'-'+style.svgAttr;
                            if (currentElement.getAttribute(attr)) {
                                 //fill-opacity or stroke-opacity has already been set by stroke or fill.
                                continue;
                            }
                        }
                        //otherwise only update attribute if right type, and not svg default
                        currentElement.setAttribute(attr, value);
                    }
                }
            }
        }
    };

    /**
     * Will return the closest group or svg node. May return the current element.
     * @private
     */
    ctx.prototype.__closestGroupOrSvg = function (node) {
        node = node || this.__currentElement;
        if (node.nodeName === "g" || node.nodeName === "svg") {
            return node;
        } else {
            return this.__closestGroupOrSvg(node.parentNode);
        }
    };

    /**
     * Returns the serialized value of the svg so far
     * @param fixNamedEntities - Standalone SVG doesn't support named entities, which document.createTextNode encodes.
     *                           If true, we attempt to find all named entities and encode it as a numeric entity.
     * @return serialized svg
     */
    ctx.prototype.getSerializedSvg = function (fixNamedEntities) {
        var serialized = new XMLSerializer().serializeToString(this.__root),
            keys, i, key, value, regexp, xmlns;

        //IE search for a duplicate xmnls because they didn't implement setAttributeNS correctly
        xmlns = /xmlns="http:\/\/www\.w3\.org\/2000\/svg".+xmlns="http:\/\/www\.w3\.org\/2000\/svg/gi;
        if (xmlns.test(serialized)) {
            serialized = serialized.replace('xmlns="http://www.w3.org/2000/svg','xmlns:xlink="http://www.w3.org/1999/xlink');
        }

        if (fixNamedEntities) {
            keys = Object.keys(namedEntities);
            //loop over each named entity and replace with the proper equivalent.
            for (i=0; i<keys.length; i++) {
                key = keys[i];
                value = namedEntities[key];
                regexp = new RegExp(key, "gi");
                if (regexp.test(serialized)) {
                    serialized = serialized.replace(regexp, value);
                }
            }
        }

        return serialized;
    };


    /**
     * Returns the root svg
     * @return
     */
    ctx.prototype.getSvg = function () {
        return this.__root;
    };
    /**
     * Will generate a group tag.
     */
    ctx.prototype.save = function () {
        var group = this.__createElement("g");
        var parent = this.__closestGroupOrSvg();
        this.__groupStack.push(parent);
        parent.appendChild(group);
        this.__currentElement = group;
        this.__stack.push(this.__getStyleState());
    };
    /**
     * Sets current element to parent, or just root if already root
     */
    ctx.prototype.restore = function () {
        this.__currentElement = this.__groupStack.pop();
        this.__currentElementsToStyle = null;
        //Clearing canvas will make the poped group invalid, currentElement is set to the root group node.
        if (!this.__currentElement) {
            this.__currentElement = this.__root.childNodes[1];
        }
        var state = this.__stack.pop();
        this.__applyStyleState(state);
    };

    /**
     * Helper method to add transform
     * @private
     */
    ctx.prototype.__addTransform = function (t) {
        //if the current element has siblings, add another group
        var parent = this.__closestGroupOrSvg();
        if (parent.childNodes.length > 0) {
        	if (this.__currentElement.nodeName === "path") {
        		if (!this.__currentElementsToStyle) this.__currentElementsToStyle = {element: parent, children: []};
        		this.__currentElementsToStyle.children.push(this.__currentElement);
        		this.__applyCurrentDefaultPath();
        	}

            var group = this.__createElement("g");
            parent.appendChild(group);
            this.__currentElement = group;
        }

        var transform = this.__currentElement.getAttribute("transform");
        if (transform) {
            transform += " ";
        } else {
            transform = "";
        }
        transform += t;
        this.__currentElement.setAttribute("transform", transform);
    };

    /**
     *  scales the current element
     */
    ctx.prototype.scale = function (x, y) {
        if (y === undefined) {
            y = x;
        }
        this.__addTransform(format("scale({x},{y})", {x:x, y:y}));
    };

    /**
     * rotates the current element
     */
    ctx.prototype.rotate = function (angle) {
        var degrees = (angle * 180 / Math.PI);
        this.__addTransform(format("rotate({angle},{cx},{cy})", {angle:degrees, cx:0, cy:0}));
    };

    /**
     * translates the current element
     */
    ctx.prototype.translate = function (x, y) {
        this.__addTransform(format("translate({x},{y})", {x:x,y:y}));
    };

    /**
     * applies a transform to the current element
     */
    ctx.prototype.transform = function (a, b, c, d, e, f) {
        this.__addTransform(format("matrix({a},{b},{c},{d},{e},{f})", {a:a, b:b, c:c, d:d, e:e, f:f}));
    };

    /**
     * Create a new Path Element
     */
    ctx.prototype.beginPath = function () {
        var path, parent;

        // Note that there is only one current default path, it is not part of the drawing state.
        // See also: https://html.spec.whatwg.org/multipage/scripting.html#current-default-path
        this.__currentDefaultPath = "";
        this.__currentPosition = {};

        path = this.__createElement("path", {}, true);
        parent = this.__closestGroupOrSvg();
        parent.appendChild(path);
        this.__currentElement = path;
    };

    /**
     * Helper function to apply currentDefaultPath to current path element
     * @private
     */
    ctx.prototype.__applyCurrentDefaultPath = function () {
    	var currentElement = this.__currentElement;
        if (currentElement.nodeName === "path") {
			currentElement.setAttribute("d", this.__currentDefaultPath);
        } else {
			console.error("Attempted to apply path command to node", currentElement.nodeName);
        }
    };

    /**
     * Helper function to add path command
     * @private
     */
    ctx.prototype.__addPathCommand = function (command) {
        this.__currentDefaultPath += " ";
        this.__currentDefaultPath += command;
    };

    /**
     * Adds the move command to the current path element,
     * if the currentPathElement is not empty create a new path element
     */
    ctx.prototype.moveTo = function (x,y) {
        if (this.__currentElement.nodeName !== "path") {
            this.beginPath();
        }

        // creates a new subpath with the given point
        this.__currentPosition = {x: x, y: y};
        this.__addPathCommand(format("M {x} {y}", {x:x, y:y}));
    };

    /**
     * Closes the current path
     */
    ctx.prototype.closePath = function () {
        if (this.__currentDefaultPath) {
            this.__addPathCommand("Z");
        }
    };

    /**
     * Adds a line to command
     */
    ctx.prototype.lineTo = function (x, y) {
        this.__currentPosition = {x: x, y: y};
        if (this.__currentDefaultPath.indexOf('M') > -1) {
            this.__addPathCommand(format("L {x} {y}", {x:x, y:y}));
        } else {
            this.__addPathCommand(format("M {x} {y}", {x:x, y:y}));
        }
    };

    /**
     * Add a bezier command
     */
    ctx.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
        this.__currentPosition = {x: x, y: y};
        this.__addPathCommand(format("C {cp1x} {cp1y} {cp2x} {cp2y} {x} {y}",
            {cp1x:cp1x, cp1y:cp1y, cp2x:cp2x, cp2y:cp2y, x:x, y:y}));
    };

    /**
     * Adds a quadratic curve to command
     */
    ctx.prototype.quadraticCurveTo = function (cpx, cpy, x, y) {
        this.__currentPosition = {x: x, y: y};
        this.__addPathCommand(format("Q {cpx} {cpy} {x} {y}", {cpx:cpx, cpy:cpy, x:x, y:y}));
    };


    /**
     * Return a new normalized vector of given vector
     */
    var normalize = function (vector) {
        var len = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
        return [vector[0] / len, vector[1] / len];
    };

    /**
     * Adds the arcTo to the current path
     *
     * @see http://www.w3.org/TR/2015/WD-2dcontext-20150514/#dom-context-2d-arcto
     */
    ctx.prototype.arcTo = function (x1, y1, x2, y2, radius) {
        // Let the point (x0, y0) be the last point in the subpath.
        var x0 = this.__currentPosition && this.__currentPosition.x;
        var y0 = this.__currentPosition && this.__currentPosition.y;

        // First ensure there is a subpath for (x1, y1).
        if (typeof x0 == "undefined" || typeof y0 == "undefined") {
            return;
        }

        // Negative values for radius must cause the implementation to throw an IndexSizeError exception.
        if (radius < 0) {
            throw new Error("IndexSizeError: The radius provided (" + radius + ") is negative.");
        }

        // If the point (x0, y0) is equal to the point (x1, y1),
        // or if the point (x1, y1) is equal to the point (x2, y2),
        // or if the radius radius is zero,
        // then the method must add the point (x1, y1) to the subpath,
        // and connect that point to the previous point (x0, y0) by a straight line.
        if (((x0 === x1) && (y0 === y1))
            || ((x1 === x2) && (y1 === y2))
            || (radius === 0)) {
            this.lineTo(x1, y1);
            return;
        }

        // Otherwise, if the points (x0, y0), (x1, y1), and (x2, y2) all lie on a single straight line,
        // then the method must add the point (x1, y1) to the subpath,
        // and connect that point to the previous point (x0, y0) by a straight line.
        var unit_vec_p1_p0 = normalize([x0 - x1, y0 - y1]);
        var unit_vec_p1_p2 = normalize([x2 - x1, y2 - y1]);
        if (unit_vec_p1_p0[0] * unit_vec_p1_p2[1] === unit_vec_p1_p0[1] * unit_vec_p1_p2[0]) {
            this.lineTo(x1, y1);
            return;
        }

        // Otherwise, let The Arc be the shortest arc given by circumference of the circle that has radius radius,
        // and that has one point tangent to the half-infinite line that crosses the point (x0, y0) and ends at the point (x1, y1),
        // and that has a different point tangent to the half-infinite line that ends at the point (x1, y1), and crosses the point (x2, y2).
        // The points at which this circle touches these two lines are called the start and end tangent points respectively.

        // note that both vectors are unit vectors, so the length is 1
        var cos = (unit_vec_p1_p0[0] * unit_vec_p1_p2[0] + unit_vec_p1_p0[1] * unit_vec_p1_p2[1]);
        var theta = Math.acos(Math.abs(cos));

        // Calculate origin
        var unit_vec_p1_origin = normalize([
            unit_vec_p1_p0[0] + unit_vec_p1_p2[0],
            unit_vec_p1_p0[1] + unit_vec_p1_p2[1]
        ]);
        var len_p1_origin = radius / Math.sin(theta / 2);
        var x = x1 + len_p1_origin * unit_vec_p1_origin[0];
        var y = y1 + len_p1_origin * unit_vec_p1_origin[1];

        // Calculate start angle and end angle
        // rotate 90deg clockwise (note that y axis points to its down)
        var unit_vec_origin_start_tangent = [
            -unit_vec_p1_p0[1],
            unit_vec_p1_p0[0]
        ];
        // rotate 90deg counter clockwise (note that y axis points to its down)
        var unit_vec_origin_end_tangent = [
            unit_vec_p1_p2[1],
            -unit_vec_p1_p2[0]
        ];
        var getAngle = function (vector) {
            // get angle (clockwise) between vector and (1, 0)
            var x = vector[0];
            var y = vector[1];
            if (y >= 0) { // note that y axis points to its down
                return Math.acos(x);
            } else {
                return -Math.acos(x);
            }
        };
        var startAngle = getAngle(unit_vec_origin_start_tangent);
        var endAngle = getAngle(unit_vec_origin_end_tangent);

        // Connect the point (x0, y0) to the start tangent point by a straight line
        this.lineTo(x + unit_vec_origin_start_tangent[0] * radius,
                    y + unit_vec_origin_start_tangent[1] * radius);

        // Connect the start tangent point to the end tangent point by arc
        // and adding the end tangent point to the subpath.
        this.arc(x, y, radius, startAngle, endAngle);
    };

    /**
     * Sets the stroke property on the current element
     */
    ctx.prototype.stroke = function () {
        if (this.__currentElement.nodeName === "path") {
            this.__currentElement.setAttribute("paint-order", "fill stroke markers");
        }
        this.__applyCurrentDefaultPath();
        this.__applyStyleToCurrentElement("stroke");
    };

    /**
     * Sets fill properties on the current element
     */
    ctx.prototype.fill = function () {
        if (this.__currentElement.nodeName === "path") {
            this.__currentElement.setAttribute("paint-order", "stroke fill markers");
        }
        this.__applyCurrentDefaultPath();
        this.__applyStyleToCurrentElement("fill");
    };

    /**
     *  Adds a rectangle to the path.
     */
    ctx.prototype.rect = function (x, y, width, height) {
        if (this.__currentElement.nodeName !== "path") {
            this.beginPath();
        }
        this.moveTo(x, y);
        this.lineTo(x+width, y);
        this.lineTo(x+width, y+height);
        this.lineTo(x, y+height);
        this.lineTo(x, y);
        this.closePath();
    };


    /**
     * adds a rectangle element
     */
    ctx.prototype.fillRect = function (x, y, width, height) {
        var rect, parent;
        rect = this.__createElement("rect", {
            x : x,
            y : y,
            width : width,
            height : height
        }, true);
        parent = this.__closestGroupOrSvg();
        parent.appendChild(rect);
        this.__currentElement = rect;
        this.__applyStyleToCurrentElement("fill");
    };

    /**
     * Draws a rectangle with no fill
     * @param x
     * @param y
     * @param width
     * @param height
     */
    ctx.prototype.strokeRect = function (x, y, width, height) {
        var rect, parent;
        rect = this.__createElement("rect", {
            x : x,
            y : y,
            width : width,
            height : height
        }, true);
        parent = this.__closestGroupOrSvg();
        parent.appendChild(rect);
        this.__currentElement = rect;
        this.__applyStyleToCurrentElement("stroke");
    };


    /**
     * Clear entire canvas:
     * 1. save current transforms
     * 2. remove all the childNodes of the root g element
     */
    ctx.prototype.__clearCanvas = function () {
        var current = this.__closestGroupOrSvg(),
            transform = current.getAttribute("transform");
        var rootGroup = this.__root.childNodes[1];
        var childNodes = rootGroup.childNodes;
        for (var i = childNodes.length - 1; i >= 0; i--) {
            if (childNodes[i]) {
                rootGroup.removeChild(childNodes[i]);
            }
        }
        this.__currentElement = rootGroup;
        //reset __groupStack as all the child group nodes are all removed.
        this.__groupStack = [];
        if (transform) {
            this.__addTransform(transform);
        }
    };

    /**
     * "Clears" a canvas by just drawing a white rectangle in the current group.
     */
    ctx.prototype.clearRect = function (x, y, width, height) {
        //clear entire canvas
        if (x === 0 && y === 0 && width === this.width && height === this.height) {
            this.__clearCanvas();
            return;
        }
        var rect, parent = this.__closestGroupOrSvg();
        rect = this.__createElement("rect", {
            x : x,
            y : y,
            width : width,
            height : height,
            fill : "#FFFFFF"
        }, true);
        parent.appendChild(rect);
    };

    /**
     * Adds a linear gradient to a defs tag.
     * Returns a canvas gradient object that has a reference to it's parent def
     */
    ctx.prototype.createLinearGradient = function (x1, y1, x2, y2) {
        var grad = this.__createElement("linearGradient", {
            id : randomString(this.__ids),
            x1 : x1+"px",
            x2 : x2+"px",
            y1 : y1+"px",
            y2 : y2+"px",
            "gradientUnits" : "userSpaceOnUse"
        }, false);
        this.__defs.appendChild(grad);
        return new CanvasGradient(grad, this);
    };

    /**
     * Adds a radial gradient to a defs tag.
     * Returns a canvas gradient object that has a reference to it's parent def
     */
    ctx.prototype.createRadialGradient = function (x0, y0, r0, x1, y1, r1) {
        var grad = this.__createElement("radialGradient", {
            id : randomString(this.__ids),
            cx : x1+"px",
            cy : y1+"px",
            r  : r1+"px",
            fx : x0+"px",
            fy : y0+"px",
            "gradientUnits" : "userSpaceOnUse"
        }, false);
        this.__defs.appendChild(grad);
        return new CanvasGradient(grad, this);

    };

    /**
     * Parses the font string and returns svg mapping
     * @private
     */
    ctx.prototype.__parseFont = function () {
        var regex = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-,\'\"\sa-z0-9]+?)\s*$/i;
        var fontPart = regex.exec( this.font );
        var data = {
            style : fontPart[1] || 'normal',
            size : fontPart[4] || '10px',
            family : fontPart[6] || 'sans-serif',
            weight: fontPart[3] || 'normal',
            decoration : fontPart[2] || 'normal',
            href : null
        };

        //canvas doesn't support underline natively, but we can pass this attribute
        if (this.__fontUnderline === "underline") {
            data.decoration = "underline";
        }

        //canvas also doesn't support linking, but we can pass this as well
        if (this.__fontHref) {
            data.href = this.__fontHref;
        }

        return data;
    };

    /**
     * Helper to link text fragments
     * @param font
     * @param element
     * @return {*}
     * @private
     */
    ctx.prototype.__wrapTextLink = function (font, element) {
        if (font.href) {
            var a = this.__createElement("a");
            a.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", font.href);
            a.appendChild(element);
            return a;
        }
        return element;
    };

    /**
     * Fills or strokes text
     * @param text
     * @param x
     * @param y
     * @param action - stroke or fill
     * @private
     */
    ctx.prototype.__applyText = function (text, x, y, action) {
        var font = this.__parseFont(),
            parent = this.__closestGroupOrSvg(),
            textElement = this.__createElement("text", {
                "font-family" : font.family,
                "font-size" : font.size,
                "font-style" : font.style,
                "font-weight" : font.weight,
                "text-decoration" : font.decoration,
                "x" : x,
                "y" : y,
                "text-anchor": getTextAnchor(this.textAlign),
                "dominant-baseline": getDominantBaseline(this.textBaseline)
            }, true);

        textElement.appendChild(this.__document.createTextNode(text));
        this.__currentElement = textElement;
        this.__applyStyleToCurrentElement(action);
        parent.appendChild(this.__wrapTextLink(font,textElement));
    };

    /**
     * Creates a text element
     * @param text
     * @param x
     * @param y
     */
    ctx.prototype.fillText = function (text, x, y) {
        this.__applyText(text, x, y, "fill");
    };

    /**
     * Strokes text
     * @param text
     * @param x
     * @param y
     */
    ctx.prototype.strokeText = function (text, x, y) {
        this.__applyText(text, x, y, "stroke");
    };

    /**
     * No need to implement this for svg.
     * @param text
     * @return {TextMetrics}
     */
    ctx.prototype.measureText = function (text) {
        this.__ctx.font = this.font;
        return this.__ctx.measureText(text);
    };

    /**
     *  Arc command!
     */
    ctx.prototype.arc = function (x, y, radius, startAngle, endAngle, counterClockwise) {
        // in canvas no circle is drawn if no angle is provided.
        if (startAngle === endAngle) {
            return;
        }
        startAngle = startAngle % (2*Math.PI);
        endAngle = endAngle % (2*Math.PI);
	if (endAngle == 6.28318) endAngle = 6.27; // fix for missing posts
        if (startAngle === endAngle) {
            //circle time! subtract some of the angle so svg is happy (svg elliptical arc can't draw a full circle)
            endAngle = ((endAngle + (2*Math.PI)) - 0.001 * (counterClockwise ? -1 : 1)) % (2*Math.PI);
        }
        var endX = x+radius*Math.cos(endAngle),
            endY = y+radius*Math.sin(endAngle),
            startX = x+radius*Math.cos(startAngle),
            startY = y+radius*Math.sin(startAngle),
            sweepFlag = counterClockwise ? 0 : 1,
            largeArcFlag = 0,
            diff = endAngle - startAngle;

        // https://github.com/gliffy/canvas2svg/issues/4
        if (diff < 0) {
            diff += 2*Math.PI;
        }

        if (counterClockwise) {
            largeArcFlag = diff > Math.PI ? 0 : 1;
        } else {
            largeArcFlag = diff > Math.PI ? 1 : 0;
        }

        this.lineTo(startX, startY);
        this.__addPathCommand(format("A {rx} {ry} {xAxisRotation} {largeArcFlag} {sweepFlag} {endX} {endY}",
            {rx:radius, ry:radius, xAxisRotation:0, largeArcFlag:largeArcFlag, sweepFlag:sweepFlag, endX:endX, endY:endY}));

        this.__currentPosition = {x: endX, y: endY};
    };

    // simple implementation of ellipse.  rotation is not supported
    ctx.prototype.ellipse = function (x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterClockwise) {
        // in canvas no circle is drawn if no angle is provided.
        if (startAngle === endAngle) {
            return;
        }
        startAngle = startAngle % (2*Math.PI);
        endAngle = endAngle % (2*Math.PI);
        if (startAngle === endAngle) {
            //circle time! subtract some of the angle so svg is happy (svg elliptical arc can't draw a full circle)
            endAngle = ((endAngle + (2*Math.PI)) - 0.001 * (counterClockwise ? -1 : 1)) % (2*Math.PI);
        }
        var endX = x+radiusX*Math.cos(endAngle),
            endY = y+radiusY*Math.sin(endAngle),
            startX = x+radiusX*Math.cos(startAngle),
            startY = y+radiusY*Math.sin(startAngle),
            sweepFlag = counterClockwise ? 0 : 1,
            largeArcFlag = 0,
            diff = endAngle - startAngle;

        // https://github.com/gliffy/canvas2svg/issues/4
        if (diff < 0) {
            diff += 2*Math.PI;
        }

        if (counterClockwise) {
            largeArcFlag = diff > Math.PI ? 0 : 1;
        } else {
            largeArcFlag = diff > Math.PI ? 1 : 0;
        }

        this.lineTo(startX, startY);
        this.__addPathCommand(format("A {rx} {ry} {xAxisRotation} {largeArcFlag} {sweepFlag} {endX} {endY}",
            {rx:radiusX, ry:radiusY, xAxisRotation:0, largeArcFlag:largeArcFlag, sweepFlag:sweepFlag, endX:endX, endY:endY}));

        this.__currentPosition = {x: endX, y: endY};
    };

    /**
     * Generates a ClipPath from the clip command.
     */
    ctx.prototype.clip = function () {
        var group = this.__closestGroupOrSvg(),
            clipPath = this.__createElement("clipPath"),
            id =  randomString(this.__ids),
            newGroup = this.__createElement("g");

        this.__applyCurrentDefaultPath();
        group.removeChild(this.__currentElement);
        clipPath.setAttribute("id", id);
        clipPath.appendChild(this.__currentElement);

        this.__defs.appendChild(clipPath);

        //set the clip path to this group
        group.setAttribute("clip-path", format("url(#{id})", {id:id}));

        //clip paths can be scaled and transformed, we need to add another wrapper group to avoid later transformations
        // to this path
        group.appendChild(newGroup);

        this.__currentElement = newGroup;

    };

    /**
     * Draws a canvas, image or mock context to this canvas.
     * Note that all svg dom manipulation uses node.childNodes rather than node.children for IE support.
     * http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-drawimage
     */
    ctx.prototype.drawImage = function () {
        //convert arguments to a real array
        var args = Array.prototype.slice.call(arguments),
            image=args[0],
            dx, dy, dw, dh, sx=0, sy=0, sw, sh, parent, svg, defs, group,
            svgImage, canvas, context, id;

        if (args.length === 3) {
            dx = args[1];
            dy = args[2];
            sw = image.width;
            sh = image.height;
            dw = sw;
            dh = sh;
        } else if (args.length === 5) {
            dx = args[1];
            dy = args[2];
            dw = args[3];
            dh = args[4];
            sw = image.width;
            sh = image.height;
        } else if (args.length === 9) {
            sx = args[1];
            sy = args[2];
            sw = args[3];
            sh = args[4];
            dx = args[5];
            dy = args[6];
            dw = args[7];
            dh = args[8];
        } else {
            throw new Error("Invalid number of arguments passed to drawImage: " + arguments.length);
        }

        parent = this.__closestGroupOrSvg();
        this.__currentElement;
        var translateDirective = "translate(" + dx + ", " + dy + ")";
        if (image instanceof ctx) {
            //canvas2svg mock canvas context. In the future we may want to clone nodes instead.
            //also I'm currently ignoring dw, dh, sw, sh, sx, sy for a mock context.
            svg = image.getSvg().cloneNode(true);
            if (svg.childNodes && svg.childNodes.length > 1) {
                defs = svg.childNodes[0];
                while(defs.childNodes.length) {
                    id = defs.childNodes[0].getAttribute("id");
                    this.__ids[id] = id;
                    this.__defs.appendChild(defs.childNodes[0]);
                }
                group = svg.childNodes[1];
                if (group) {
                    //save original transform
                    var originTransform = group.getAttribute("transform");
                    var transformDirective;
                    if (originTransform) {
                        transformDirective = originTransform+" "+translateDirective;
                    } else {
                        transformDirective = translateDirective;
                    }
                    group.setAttribute("transform", transformDirective);
                    parent.appendChild(group);
                }
            }
        } else if (image.nodeName === "CANVAS" || image.nodeName === "IMG") {
            //canvas or image
            svgImage = this.__createElement("image");
            svgImage.setAttribute("width", dw);
            svgImage.setAttribute("height", dh);
            svgImage.setAttribute("preserveAspectRatio", "none");

            if (sx || sy || sw !== image.width || sh !== image.height) {
                //crop the image using a temporary canvas
                canvas = this.__document.createElement("canvas");
                canvas.width = dw;
                canvas.height = dh;
                context = canvas.getContext("2d");
                context.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);
                image = canvas;
            }
            svgImage.setAttribute("transform", translateDirective);
            svgImage.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href",
                image.nodeName === "CANVAS" ? image.toDataURL() : image.getAttribute("src"));
            parent.appendChild(svgImage);
        }
    };

    /**
     * Generates a pattern tag
     */
    ctx.prototype.createPattern = function (image, repetition) {
        var pattern = this.__document.createElementNS("http://www.w3.org/2000/svg", "pattern"), id = randomString(this.__ids),
            img;
        pattern.setAttribute("id", id);
        pattern.setAttribute("width", image.width);
        pattern.setAttribute("height", image.height);
        if (image.nodeName === "CANVAS" || image.nodeName === "IMG") {
            img = this.__document.createElementNS("http://www.w3.org/2000/svg", "image");
            img.setAttribute("width", image.width);
            img.setAttribute("height", image.height);
            img.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href",
                image.nodeName === "CANVAS" ? image.toDataURL() : image.getAttribute("src"));
            pattern.appendChild(img);
            this.__defs.appendChild(pattern);
        } else if (image instanceof ctx) {
            pattern.appendChild(image.__root.childNodes[1]);
            this.__defs.appendChild(pattern);
        }
        return new CanvasPattern(pattern, this);
    };

    ctx.prototype.setLineDash = function (dashArray) {
        if (dashArray && dashArray.length > 0) {
            this.lineDash = dashArray.join(",");
        } else {
            this.lineDash = null;
        }
    };

    /**
     * Not yet implemented
     */
    ctx.prototype.drawFocusRing = function () {};
    ctx.prototype.createImageData = function () {};
    ctx.prototype.getImageData = function () {};
    ctx.prototype.putImageData = function () {};
    ctx.prototype.globalCompositeOperation = function () {};
    ctx.prototype.setTransform = function () {};

    //add options for alternative namespace
    if (typeof window === "object") {
        window.C2S = ctx;
    }

    // CommonJS/Browserify
    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = ctx;
    }

}());

function installSandboxBridge(app) {
  if (new URLSearchParams(location.search).get("sandbox") !== "1") return;
  const api = window.CircuitJS1;
  let busy = 0, undoing = 0, dirty = false, needsReset = false, message = "";
  let lastDesign = "", lastElectric = "", lastStimulus = "", started = 0, sequence = 0, hostError = "";
  let runId = crypto.randomUUID(), designRevision = 0, stimulusCount = 0;
  const ids = /* @__PURE__ */ new WeakMap();
  const id = (e) => {
    if (!ids.has(e)) ids.set(e, ++sequence);
    return ids.get(e);
  };
  const run = app.ui.setSimRunning.bind(app.ui);
  const load = app.loader.readCircuit.bind(app.loader);
  const reset = app.ui.resetAction.bind(app.ui);
  const request = (action, text) => bridge.onrequest?.({ action, text });
  const notice = (text) => {
    message = text;
    app.ui.showToast(text);
  };
  function documentText() {
    const doc = new DOMParser().parseFromString(app.dumpCircuit(false), "text/xml");
    for (let i = 0; i < app.scopeManager.scopeCount; i++) app.scopeManager.scopes[i].dumpXml(doc, doc.documentElement);
    return CircuitXMLSerializer.prettyPrint(doc);
  }
  function signatures() {
    const doc = document.implementation.createDocument(null, "cir", null);
    const parent = /* @__PURE__ */ new Map();
    const find = (s) => {
      if (!parent.has(s)) parent.set(s, s);
      const p = parent.get(s);
      if (p !== s) parent.set(s, find(p));
      return parent.get(s);
    };
    const join = (a, b) => {
      a = find(a);
      b = find(b);
      if (a !== b) parent.set(a, b);
    };
    const point = (e, n) => {
      const p = e.getPost(n);
      return `${p.x},${p.y}`;
    };
    const elements = app.elmList;
    const records = [];
    const stimuli = [];
    for (const e of elements) {
      const type = e.getXmlDumpType();
      const ports = Array.from({ length: e.getPostCount() }, (_, i) => point(e, i));
      ports.forEach(find);
      if (["w", "rw"].includes(type) && ports.length === 2) {
        join(ports[0], ports[1]);
        continue;
      }
      if (e.isGroundElm?.()) {
        if (ports[0]) join(ports[0], "@ground");
        continue;
      }
      if (type === "ln") {
        if (ports[0]) join(ports[0], `@label:${e.getName()}`);
        continue;
      }
      if (!ports.length) continue;
      const node = doc.createElement(type);
      e.dumpXml(doc, node);
      node.removeAttribute("x");
      if (e.isSwitchElm?.()) {
        node.removeAttribute("p");
        stimuli.push(`${id(e)}:${e.position}`);
      }
      records.push({ key: String(id(e)), params: new XMLSerializer().serializeToString(node), ports });
    }
    const groups = /* @__PURE__ */ new Map();
    for (const r of records) r.ports.forEach((p, i) => {
      const root2 = find(p);
      const list = groups.get(root2) ?? [];
      list.push(`${r.key}:${i}`);
      groups.set(root2, list);
    });
    const electric = records.map((r) => [r.key, r.params, r.ports.map((p) => (find(p) === find("@ground") ? "G:" : "") + groups.get(find(p)).slice().sort().join("|"))]);
    const designDoc = new DOMParser().parseFromString(app.dumpCircuit(false), "text/xml");
    const models = Array.from(designDoc.documentElement.children).filter((e) => ["dm", "tm", "mm", "rlm", "clm", "ccm"].includes(e.tagName)).map((e) => new XMLSerializer().serializeToString(e));
    const root = designDoc.documentElement;
    const options = [root.getAttribute("ts"), root.getAttribute("mts"), Number(root.getAttribute("f")) & 128, root.getAttribute("st")];
    return { electric: JSON.stringify({ electric, models, options }), stimulus: stimuli.join(";") };
  }
  function baseline() {
    const s = signatures();
    lastElectric = s.electric;
    lastStimulus = s.stimulus;
    lastDesign = app.dumpCircuit(false);
  }
  function check(forceView = false) {
    if (busy) return;
    const design = app.dumpCircuit(false);
    if (design !== lastDesign) {
      const s = signatures();
      const changed = s.electric !== lastElectric;
      const stimulus = s.stimulus !== lastStimulus;
      if (changed) {
        designRevision++;
        needsReset = true;
        hostError = "";
        run(false);
        message = "电气设计已修改 · 请重新开始";
        app.scopeManager.resetGraphs();
      } else if (stimulus) {
        stimulusCount++;
        message = "输入已切换 · 正在观察本次运行中的激励";
      }
      lastDesign = design;
      lastElectric = s.electric;
      lastStimulus = s.stimulus;
      dirty = true;
    }
    if (forceView) dirty = true;
    if (dirty && !app.mouse.dragging && !app.dialogIsShowing()) {
      dirty = false;
      bridge.onchange?.({ circuit: documentText(), needsReset });
    }
  }
  function status() {
    const error = hostError || app.stopMessage || (app.consoleExceptionOccurred ? "内核出现异常，请检查元件和参数后重新开始。" : "");
    return { running: app.simIsRunning(), time: app.sim.t, error, needsReset, message, elements: app.elmList.length, scopes: app.scopeManager.scopeCount, runId, designRevision, stimulusCount };
  }
  function inspect(text) {
    if (typeof text !== "string" || new TextEncoder().encode(text).length > 1e6) throw new Error("电路文件超过 1 MB 限制");
    text = text.trim();
    let count = 0;
    if (text.startsWith("<")) {
      if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error("不支持带外部声明的 XML");
      const doc = new DOMParser().parseFromString(text, "text/xml"), root = doc.documentElement;
      if (doc.querySelector("parsererror") || root.tagName !== "cir" || root.hasAttribute("sublib")) throw new Error("需要完整的 CircuitJS 电路，不支持子电路库文件");
      const metadata = /* @__PURE__ */ new Set(["o", "dm", "rlm", "tm", "mm", "clm", "ccm", "h", "adj"]);
      DiodeModel.createModelMap();
      const declaredDiodes = /* @__PURE__ */ new Set();
      for (const e of Array.from(root.children)) {
        if (e.tagName === "dm") declaredDiodes.add(e.getAttribute("nm"));
        if (metadata.has(e.tagName)) continue;
        if (!CirSim.xmlDumpTypeMap.has(e.tagName) || !e.hasAttribute("x")) throw new Error(`未知或不完整的元件：${e.tagName}`);
        const coords = e.getAttribute("x").trim().split(/\s+/).map(Number);
        if (coords.length !== 4 || coords.some((v) => !Number.isFinite(v) || !Number.isInteger(v) || Math.abs(v) > 1e5)) throw new Error("元件坐标无效");
        const model = e.getAttribute("mo"), className = CirSim.xmlDumpTypeMap.get(e.tagName);
        if (model && ["DiodeElm", "ZenerElm", "LEDElm", "VaractorElm"].includes(className) && !DiodeModel.modelMap.has(model) && !declaredDiodes.has(model)) throw new Error(`二极管模型缺失：${model}`);
        count++;
      }
      if (doc.getElementsByTagName("*").length > 3e3) throw new Error("文件中的模型或配置过多");
    } else {
      for (const line of text.split(/\r?\n/).filter((x) => x.trim())) {
        const token = line.trim().split(/\s+/)[0];
        if (["$", "o", "h", "!", '"', " ", "&"].includes(token)) continue;
        if (token === ".") throw new Error("首版不支持旧文本子电路库，请使用完整 XML 电路");
        const code = /^\d+$/.test(token) ? Number(token) : token.charCodeAt(0);
        if (!CirSim.dumpTypeMap.has(code)) throw new Error(`未知或不支持的旧文本记录：${token}`);
        count++;
      }
    }
    if (count > 500) throw new Error("导入超过 500 个图元，请缩小为局部电路");
    return { text, count };
  }
  for (const key of ["parseDoubleAttr", "parseIntAttr"]) {
    const original = CircuitXMLDeserializer.prototype[key];
    CircuitXMLDeserializer.prototype[key] = function(attr, def) {
      const raw = this.currentXmlElement.getAttribute(attr);
      if (raw !== null && (raw.trim() === "" || !Number.isFinite(Number(raw)) || key === "parseIntAttr" && !Number.isInteger(Number(raw)))) throw new Error(`数值无效：${attr}=${raw}`);
      return original.call(this, attr, def);
    };
  }
  const bridge = {
    version: 1,
    onchange: null,
    onrequest: null,
    status,
    snapshot: documentText,
    flush() {
      check();
      return documentText();
    },
    load(text) {
      const input = inspect(text);
      busy++;
      try {
        run(false);
        hostError = "";
        app.consoleExceptionOccurred = false;
        app.resetEditingContext();
        const diagnostics = [], log = console.log;
        console.log = (...args) => {
          const text2 = args.map(String).join(" ");
          if (/unrecognized|model not found|exception|failed to create|invalid value/i.test(text2)) diagnostics.push(text2);
          log(...args);
        };
        try {
          load(input.text);
        } finally {
          console.log = log;
        }
        if (diagnostics.length) throw new Error(diagnostics[0]);
        if (app.consoleExceptionOccurred || app.elmList.length !== input.count) throw new Error("电路未完整载入，原项目未替换");
        if (!Number.isFinite(app.sim.maxTimeStep) || app.sim.maxTimeStep <= 0 || app.sim.maxTimeStep > 1 || !Number.isFinite(app.sim.minTimeStep) || app.sim.minTimeStep <= 0) throw new Error("仿真步长无效");
        reset();
        run(false);
        app.sim.analyzeCircuit();
        app.analyzeFlag = false;
        needsReset = false;
        runId = crypto.randomUUID();
        stimulusCount = 0;
        message = "已载入设计 · 从显式初始条件开始";
        app.undoManager.undoStack = [];
        app.undoManager.redoStack = [];
        app.undoManager.enableUndoRedo();
        baseline();
        dirty = false;
        return { circuit: documentText(), ...status() };
      } finally {
        busy--;
      }
    },
    pause() {
      run(false);
    },
    run() {
      check();
      if (needsReset) throw new Error("设计已修改，请点击“重新开始”");
      app.ui.setSimRunning(true);
      return status();
    },
    restart() {
      busy++;
      try {
        run(false);
        hostError = "";
        reset();
        run(false);
        app.sim.analyzeCircuit();
        app.analyzeFlag = false;
        needsReset = false;
        runId = crypto.randomUUID();
        stimulusCount = 0;
        message = "已按初始条件重新开始";
        baseline();
      } finally {
        busy--;
      }
      app.ui.setSimRunning(true);
      return status();
    }
  };
  window.CircuitSandbox = bridge;
  function sourceLoop() {
    const parents = /* @__PURE__ */ new Map();
    const root = (p) => {
      if (!parents.has(p)) parents.set(p, p);
      const q = parents.get(p);
      if (q !== p) parents.set(p, root(q));
      return parents.get(p);
    };
    const join = (a, b) => parents.set(root(a), root(b));
    const port = (e, i) => {
      const p = e.getPost(i);
      return `${p.x},${p.y}`;
    };
    for (const e of app.elmList) {
      const type = e.getXmlDumpType();
      if ((["w", "rw"].includes(type) || type === "s" && e.position === 0 && e.resistance === 0) && e.getPostCount() === 2) join(port(e, 0), port(e, 1));
      else if (e.isGroundElm?.()) join(port(e, 0), "@ground");
      else if (type === "ln") join(port(e, 0), `@label:${e.getName()}`);
    }
    for (const e of app.elmList) if (e.internalResistance === 0 && typeof e.waveform === "number" && e.getPostCount() > 0) {
      const a = port(e, 0), b = e.getPostCount() === 1 ? "@ground" : port(e, 1);
      if (root(a) === root(b)) return true;
      join(a, b);
    }
    return false;
  }
  app.ui.setSimRunning = (value) => {
    if (busy) {
      run(false);
      return;
    }
    check();
    if (value && (needsReset || app.elmList.length > 200 || app.elmList.length === 0)) {
      notice(needsReset ? "设计已修改，请点击工作台“重新开始”" : "运行范围为 1–200 个图元，请调整电路");
      return;
    }
    if (value && sourceLoop()) {
      hostError = "理想电压源形成闭环或被导线短接。请检查连接，并在需要时显式加入真实内阻。";
      run(false);
      return;
    }
    if (value && !app.simIsRunning()) started = performance.now();
    run(value);
  };
  app.ui.resetAction = () => bridge.restart();
  const analyze = app.needAnalyze.bind(app);
  app.needAnalyze = () => {
    analyze();
    check();
  };
  const update = app.ui.updateCircuit.bind(app.ui);
  app.ui.updateCircuit = () => {
    check();
    if (app.simIsRunning() && sourceLoop()) {
      hostError = "理想电压源形成闭环或被导线短接。请检查连接，并显式加入需要的真实内阻。";
      run(false);
    }
    if (app.simIsRunning() && performance.now() - started > 6e4) {
      run(false);
      message = "本次运行已满 60 秒 · 已暂停，可继续";
    }
    update();
  };
  app.loader.readCircuit = (text, flags = 0) => {
    if (!busy && !undoing && !(flags & 1)) {
      notice("请通过中文工作台新建或导入项目");
      return;
    }
    inspect(text);
    load(text, flags);
    check();
  };
  const undoSignatures = /* @__PURE__ */ new WeakMap();
  const pushUndo = app.undoManager.pushUndo.bind(app.undoManager);
  app.undoManager.pushUndo = () => {
    pushUndo();
    const item = app.undoManager.undoStack.at(-1);
    if (item) undoSignatures.set(item, signatures().electric);
  };
  const loadUndo = app.undoManager.loadUndoItem.bind(app.undoManager);
  app.undoManager.loadUndoItem = (item) => {
    if (undoSignatures.get(item) === signatures().electric) {
      const doc = new DOMParser().parseFromString(item.dump, "text/xml");
      const nodes = Array.from(doc.documentElement.children).filter((e) => CirSim.xmlDumpTypeMap.has(e.tagName) && e.hasAttribute("x"));
      if (nodes.length === app.elmList.length && nodes.every((e, i) => e.tagName === app.elmList[i].getXmlDumpType())) {
        nodes.forEach((node, i) => {
          const e = app.elmList[i];
          if (!e.getPostCount()) {
            const reader = new CircuitXMLDeserializer(app);
            reader.currentXmlElement = node;
            e.undumpXml(reader);
          }
          if (e.isSwitchElm?.()) e.position = Number(node.getAttribute("p") ?? 0);
          e.setPositionFromXml(node);
        });
        app.transform[0] = app.transform[3] = item.scale;
        app.transform[4] = item.transform4;
        app.transform[5] = item.transform5;
        app.needAnalyze();
        return;
      }
    }
    loadUndo(item);
  };
  for (const key of ["doUndo", "doRedo"]) {
    const original = app.undoManager[key].bind(app.undoManager);
    app.undoManager[key] = () => {
      const before = signatures().electric, oldIds = app.elmList.map((e) => id(e));
      undoing++;
      busy++;
      try {
        original();
        app.elmList.forEach((e, i) => {
          if (oldIds[i]) ids.set(e, oldIds[i]);
        });
        const item = app.undoManager[key === "doUndo" ? "redoStack" : "undoStack"].at(-1);
        if (item) undoSignatures.set(item, before);
      } finally {
        undoing--;
        busy--;
      }
      check();
    };
  }
  app.undoManager.writeRecoveryToStorage = () => {
  };
  app.isModified = () => false;
  app.menus.readSetupFile = () => request("templates");
  const command = app.commands.menuPerformed.bind(app.commands);
  app.commands.menuPerformed = (menu, item) => {
    if (["newblankcircuit", "newwindow"].includes(item)) {
      request("new");
      return;
    }
    if (item === "importfromdropbox") {
      notice("首版支持本机项目文件，请使用工作台导入");
      return;
    }
    if (item === "exportasurl") {
      notice("请下载项目文件分享；首版不提供在线链接");
      return;
    }
    if (["importfromlocalfile", "importfromtext"].includes(item)) {
      request(item === "importfromtext" ? "importText" : "import");
      return;
    }
    if (item === "exportastext") {
      request("exportCircuit");
      return;
    }
    if (["save", "saveas", "exportaslocalfile"].includes(item)) {
      request("export");
      return;
    }
    if (["recover", "createsubcircuit", "subcircuits", "dcanalysis"].includes(item)) {
      notice("此高级操作暂不纳入沙盒项目管理，请使用工作台项目与初始条件");
      return;
    }
    command(menu, item);
    check(true);
  };
  api.importCircuit = (text) => request("importText", text);
  if (app.ui.loadFileInput) app.ui.loadFileInput.element.style.display = "none";
  app.ui.iFrame?.remove();
  app.menus.toolbarCheckItem.setState(true);
  app.menus.showPropsOnClickCheckItem.setState(true);
  app.ui.setToolbar();
  const highlight = app.ui.toolbar.highlightButton.bind(app.ui.toolbar);
  app.ui.toolbar.highlightButton = (key) => {
    highlight(key);
    if (!app.ui.toolbar.highlightableButtons.has(key)) app.ui.toolbar.activeButton = null;
  };
  const events = ["mouseup", "keyup", "change", "wheel"];
  for (const event of events) document.addEventListener(event, () => setTimeout(() => check(true), 0));
  baseline();
  run(false);
}

window.LZString = LZString;
HookRegistry.createJSInterface = (app2) => new JSInterface(app2);
await Locale.load();
const app = new CirSim();
await app.init();
installSandboxBridge(app);
