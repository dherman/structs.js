var TypedObjects = (function () {
"use strict";  

var TYPED_OBJECT = {}
function valueType(size, View, name) {
  var result = function() {
  }

  result._size = size;
  result._View = View;
  result._getItem = function(view, offset) { return view[offset]; };
  result._setItem = function(view, offset, v) { view[offset] = v; };
  result._name = name;
  result._alignment = size;
  result._clazz = TYPED_OBJECT;
  return result;
}

function padTo(size, elemSize) {
  if (size % elemSize == 0) return size;
  return size + (elemSize - (size % elemSize));
}

// Emulate typed array
function StructView(S) {
  var result = function(buffer, offset, length) {
    if (!offset) { 
      offset = 0;
      length = buffer.byteLength / S._alignment;
    }
    this._buffer = buffer;
    this._offset = offset;
  }

  result.prototype.getItem = function(index) {
    return new S(this._buffer, this._offset + index * S._alignment);
  } 

  result.prototype.setItem = function(index, v) {
    new S(this._buffer, this._offset + index * S._alignment, v);
  }
  return result; 
}

function StructType(typeObj) {
  var props = Object.getOwnPropertyNames(typeObj);

  var internals = {};

  var viewTypes = [];
  var viewAccessors = [];

  var size = 0;
  var maxElemAlign = 0;
  for (var i = 0; i < props.length; i++) {
    var pName = props[i];
    var pType = typeObj[pName];
    if (pType._clazz !== TYPED_OBJECT)
      throw new TypeError("Property " + pName + ": unknown type");
    if (typeof pType._size == "undefined")
      throw new TypeError("Type " + pType._name + " is variable-length");
    size = padTo(size, pType._alignment);

    var viewTypeIdx = viewTypes.indexOf(pType._View);
    if (viewTypeIdx < 0) {
      viewTypeIdx = viewTypes.length;
      viewTypes.push(pType._View);
    }

    internals[pName] = {
      viewTypeIdx : viewTypeIdx,
      offset : size / pType._alignment,
      byteOffset : size,
      type : pType
    }

    if (pType._alignment > maxElemAlign) {
      maxElemAlign = pType._alignment;
    }

    size += pType._size;
  }

  size = padTo(size, maxElemAlign);
  
  var result = function(o, offset, o1) {
    var views = new Array(viewTypes.length);


    if (o instanceof ArrayBuffer) {
      for (var i = 0; i < viewTypes.length; i++) {
        views[i] = new viewTypes[i](o, offset, size / viewTypes[i].BYTES_PER_ELEMENT);
      }
    } else {
      var buffer = new ArrayBuffer(size);
      for (var i = 0; i < viewTypes.length; i++) {
        views[i] = new viewTypes[i](buffer);
      }
    }

    for (var i = 0; i < props.length; i++) {
      var obj = this;
      (function() {
      var pName = props[i];
      var internalDescr = internals[pName];
      var view = views[internalDescr.viewTypeIdx];
      var offset = internalDescr.offset;
      Object.defineProperty(
          obj,
          pName,
          { configurable: false,
            enumerable:   true,
            get: function() { return internalDescr.type._getItem(view, offset); },
            set: function(v) { internalDescr.type._setItem(view, offset, v); }
          }
          );
      }) ();
    }   
    if (!(o instanceof ArrayBuffer) && o) {
      for (var i = 0; i < props.length; i++) {
        pName = props[i];
        this[pName] = o[pName]; 
      }
    } else if (o1) {
      for (var i = 0; i < props.length; i++) {
        pName = props[i];
        this[pName] = o1[pName]; 
      }
    }
  }
  result._size = size;
  result._alignment = maxElemAlign;
  result._View = StructView(result);
  result._getItem = function(view, offset) { return view.getItem(offset); };
  result._setItem = function(view, offset, v) { view.setItem(offset, v); };
  result._clazz = TYPED_OBJECT;
  return result;
}

function ArrayType(elementType, length) {
  if (elementType._clazz !== TYPED_OBJECT) {
    throw new TypeError("Not a type");
  }
  if (typeof elementType._size == "undefined") {
    throw new TypeError("Element type cannot be of variable length");
  }

  var fixedLength = typeof length != "undefined";

  var result = function(o, byteOffset, o1) {
    var self = this;
    var view;
    var viewLength;
    if (o instanceof ArrayBuffer) {
      if (!fixedLength) {
        if (o.byteLength % elementType._size != 0)
          throw new RangeError("ArrayBuffer size must be a multiple of " + elementType._size);
        viewLength = o.byteLength / elementType._size;
      } else {
        viewLength = length; 
      }
      view = new elementType._View(o, byteOffset, viewLength);
    } else {
      if (fixedLength) {
        viewLength = length;
      } else {
        viewLength = o.length;
      }
      var buffer = new ArrayBuffer(viewLength * elementType._size)
      view = new elementType._View(buffer);
    }

    if (fixedLength) {
      for (var i = 0; i < viewLength; i++) {
        (function() {
          var off = i * elementType._size / elementType._alignment;
          Object.defineProperty(
            self,
            i,
            { configurable:false,
              enumerable:true,
              get: function() {
                return elementType._getItem(view, off);
              },
              set: function(v) {
                elementType._setItem(view, off, v);
              }
            }
        );
        })()
      }
      Object.defineProperty(
        self,
        "length",
        { configurable:false,
          enumerable:false,
          writable:false,
          value: viewLength
        });
      if (!(o instanceof ArrayBuffer) && o) {
        for (i = 0; i < Math.min(viewLength, o.length); i++) {
          self[i] = o[i];
        }
      }
    }
  }

  
  if (fixedLength)
    result._size = length * elementType._size;
  result._alignment = elementType._alignment;
  result._View = StructView(result);
  result._getItem = function(view, offset) { return view.getItem(offset); };
  result._setItem = function(view, offset, v) { view.setItem(offset, v); };
  result._clazz = TYPED_OBJECT;
  return result;
}

return {
  int8 : valueType(1, Int8Array, "int8"),
  uint8 : valueType(1, Uint8Array, "uint8"),
  uint8clamped : valueType(1, Uint8ClampedArray, "uint8"),
  int16 : valueType(2, Int16Array, "int16"),
  uint16 : valueType(2, Uint16Array, "uint16"),
  int32 : valueType(4, Int32Array, "int32"),
  uint32 : valueType(4, Uint32Array, "uint32"),
  float32 : valueType(4, Float32Array, "float32"),
  float64 : valueType(8, Float64Array, "float64"),

  StructType: StructType,
  ArrayType: ArrayType
};
})();
