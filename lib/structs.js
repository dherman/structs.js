var Structs = (function() {

// brand of binary data types
const TYPE_BRAND = {};

function isType(x) {
    return typeof x === "function" && x._brand === TYPE_BRAND;
}

// brand of binary data objects
const DATA_BRAND = {};

function isTypedData(x) {
    return typeof x === "object" && x._brand === DATA_BRAND;
}

function TypedBuffer(type) {
    this._type = type;
    this._raw = new ArrayBuffer(type._byteLength);
    this._jsvalAtOffset = Object.create(null);     // fields of type pointer, object, and any
                                                   // (lazily initialized)
}

var TBp = TypedBuffer.prototype;

function int(bytes, min, max, View, typeName, toInt) {
    var t = Function.create(function cast(x) {
        if (typeof x === "string") {
            x = parseInt(x);
            if (x !== x)
                throw new TypeError("invalid " + typeName + " string");
        }
        if (typeof x !== "number")
            throw new TypeError("invalid " + typeName + ": " + x);
        return toInt(x);
    }, function() {
        throw new TypeError("cannot instantiate atomic type " + typeName);
    });

    t.toString = function() {
        return "[type " + typeName + "]";
    };

    t.toSource = function() {
        return typeName;
    }

    t._brand = TYPE_BRAND;
    t._shortName = typeName;
    t._variant = typeName;
    t._container = false;
    t._fixedSize = true;
    t._allowCasts = true;
    t._byteLength = bytes;

    t._sameType = function sameType(u) {
        return u._variant === this._variant;
    };

    // (ArrayBuffer, index, Buffer) -> number
    t._read = function read(raw, i) {
        return (new View(raw, i, 1))[0];
    }

    // (any, ArrayBuffer, index, Buffer) -> void
    t._write = function write(x, raw, i) {
        var view = new View(raw, i, 1);
        if (x === true)
            view[0] = 1;
        else if (x === false)
            view[0] = 0;
        else if (typeof x === "number" && x >= min && x <= max && Math.floor(x) === Math.ceil(x))
            view[0] = x;
        else
            throw new TypeError("invalid " + typeName + " value: " + x);
    };

    return t;
}

function ToInt(bits) {
    const twoN = Math.pow(2, bits);
    const twoNMinus1 = Math.pow(2, bits - 1);

    return function ToIntN(x) {
        x = +x;
        if (x !== x || x === 0 || x === Infinity || x === -Infinity)
            return 0;
        x %= twoN;
        x = (x >= 0) ? Math.floor(x) : Math.ceil(x) + twoN;
        return (x >= twoNMinus1) ? x - twoN : x;
    };
}

function ToUint(bits) {
    const twoN = Math.pow(2, bits);

    return function ToUintN(x) {
        x = +x;
        if (x !== x || x === 0 || x === Infinity || x === -Infinity)
            return 0;
        var neg = x < 0;
        x = Math.floor(neg ? -x : x);
        x = neg ? -x : x;
        x %= twoN;
        return (x >= 0) ? x : x + twoN;
    }
}

var uint8  = int(1, 0, 0xff,       Uint8Array,  "uint8",  ToUint(8));
var uint16 = int(2, 0, 0xffff,     Uint16Array, "uint16", ToUint(16));
var uint32 = int(4, 0, 0xffffffff, Uint32Array, "uint32", function ToUint32(x) { return x >>> 0 });

var int8  = int(1, -0x80,       0x7f,       Int8Array,  "int8",  ToInt(8));
var int16 = int(2, -0x8000,     0x7fff,     Int16Array, "int16", ToInt(16));
var int32 = int(4, -0x80000000, 0x7fffffff, Int32Array, "int32", function ToInt32(x) { return x >> 0 });

function float(k, View, cast) {
    const bytes = k / 8;
    const typeName = "float" + k;

    var t = Function.create(function cast(x) {
        if (typeof x === "string") {
            x = parseFloat(x);
            if (x !== x)
                throw new TypeError("invalid " + typeName + " string");
        }
        if (typeof x !== "number")
            throw new TypeError("invalid " + typeName + ": " + x);
        return cast(x);
    }, function() {
        throw new TypeError("cannot instantiate atomic type " + typeName);
    });

    t.toString = function() {
        return "[type " + typeName + "]";
    };

    t.toSource = function() {
        return typeName;
    }

    t._brand = TYPE_BRAND;
    t._shortName = typeName;
    t._variant = typeName;
    t._container = false;
    t._fixedSize = true;
    t._allowCasts = true;
    t._byteLength = bytes;

    t._sameType = function sameType(u) {
        return u._variant === this._variant;
    };

    // (ArrayBuffer, index, Buffer) -> number
    t._read = function read(raw, i) {
        return (new View(raw, i, 1))[0];
    }

    // (any, ArrayBuffer, index, Buffer) -> void
    t._write = function write(x, raw, i) {
        var view = new View(raw, i, 1);
        if (x === true)
            view[0] = 1;
        else if (x === false)
            view[0] = 0;
        else if (typeof x === "number")
            view[0] = cast(x);
        else
            throw new TypeError("invalid " + typeName + " value: " + x);
    };

    return t;
}

function doubleToFloat(x) {
    return (new Float32Array([x]))[0];
}

var float32 = float(32, Float32Array, doubleToFloat);
var float64 = float(64, Float64Array, function(n) { return n });

function struct(desc, name) {
    function t(x, byteOffset) {
        var self = (this instanceof t) ? this : Object.create(p);
        var update = false;

        self._brand = DATA_BRAND;
        self._type = t;

        switch (typeof x) {
          case "object":
            if (x instanceof ArrayBuffer) {
                if (!t._allowCasts)
                    throw new TypeError("cannot create ArrayBuffer view for type " + t.shortName);
                self._buffer = x;
                self._raw = x;
                self._byteOffset = byteOffset || 0;
                break;
            }
            update = true;
            // FALL THROUGH

          case "undefined":
            self._buffer = new TypedBuffer(t);
            self._raw = self._buffer._raw;
            self._byteOffset = 0;
            break;

          default:
            throw new TypeError("expected ArrayBuffer or optional descriptor");
        }

        if (update)
            self.update(x);

        return self;
    }

    const _fields = Object.create(null);

    t.toString = function() {
        return "[type Struct]";
    };

    t.toSource = function() {
        return "struct"
             + (this._structName ? " " + this._structName : "")
             + " { "
             + Object.keys(_fields)
                     .map(function(fieldName) {
                              return fieldName + ": " + _fields[fieldName]._shortName
                          }, this)
                     .join(", ")
             + " }";
    };

    var p = t.prototype;

    p.update = function(x) {
        for (var fieldName in _fields) {
            this[fieldName] = x[fieldName];
        }
    };

    p.toString = function() {
        return "[struct" + (t._structName ? " " + t._structName : "") + "]";
    };

    p.toSource = function() {
        return t._shortName
             + "({ "
             + Object.keys(_fields)
                     .map(function(fieldName) {
                              return fieldName + ": " + this[fieldName]
                          }, this)
                     .join(", ")
             + " })";
    };

    Object.defineProperty(p, "buffer", {
        enumerable: false,
        configurable: false,
        get: function() {
            return this._buffer;
        }
    });

    Object.defineProperty(p, "byteLength", {
        enumerable: false,
        configurable: false,
        get: function() {
            return this._type._byteLength;
        }
    });

    Object.defineProperty(p, "byteOffset", {
        enumerable: false,
        configurable: false,
        get: function() {
            return this._byteOffset;
        }
    });

    var bytes = 0;
    var offset = 0;

    var lastFieldName = null;
    var lastFieldType = null;
    var allowCasts = true;

    Object.keys(desc).forEach(function(fieldName) {
        if (lastFieldType && !lastFieldType._fixedSize)
            throw new TypeError("field " + lastFieldName + " is not of fixed size");
        var fieldType = desc[fieldName];
        _fields[fieldName] = fieldType;
        const i = offset;
        Object.defineProperty(p, fieldName, {
            configurable: false,
            enumerable: true,
            get: function() {
                return fieldType._read(this._raw, this._byteOffset + i, this._buffer);
            },
            set: function(x) {
                return fieldType._write(x, this._raw, this._byteOffset + i, this._buffer);
            }
        });
        offset += fieldType._byteLength;
        bytes += fieldType._byteLength;
        lastFieldName = fieldName;
        lastFieldType = fieldType;
        if (!fieldType._allowCasts)
            allowCasts = false;
    });

    t._brand = TYPE_BRAND;
    t._variant = "struct";
    t._container = true;
    t._structName = name || "";
    t._shortName = name || "struct";
    t._fixedSize = lastFieldType._fixedSize;
    t._allowCasts = allowCasts;
    t._byteLength = t._fixedSize ? bytes : undefined;

    t._sameType = function sameType(u) {
        return u === t;
    }

    // (ArrayBuffer, index, Buffer) -> BufferView
    t._read = function read(raw, i, buf) {
        var view = Object.create(p);
        view._brand = DATA_BRAND;
        view._type = t;
        view._buffer = buf;
        view._raw = raw;
        view._byteOffset = i;
        return view;
    };

    // (any, ArrayBuffer, index, Buffer) -> void
    t._write = function write(x, raw, i, buf) {
        if (typeof x !== "object" || x === null)
            throw new TypeError("expected object, got " + x);

        for (var fieldName in _fields) {
            var fieldType = _fields[fieldName];
            fieldType._write(x[fieldName], raw, i, buf);
            i += fieldType._byteLength;
        }
    };

    return t;
}

function array(elementType, length) {
    const fixedSize = typeof length !== "undefined";

    function t(x, byteOffset, instanceLength) {
        var self = (this instanceof t) ? this : Object.create(p);
        var update = false;

        self._brand = DATA_BRAND;
        self._type = t;

        switch (typeof x) {
          case "number":
            if (fixedSize)
                throw new TypeError("array type already has length " + length);
            self.length = instanceLength = x;
            self._buffer = new TypedBuffer(t);
            self._raw = self._buffer._raw;
            self._byteOffset = 0;
            break;

          case "undefined":
            self.length = fixedSize ? length : (instanceLength = 0);
            self._buffer = new TypedBuffer(t);
            self._raw = self._buffer._raw;
            self._byteOffset = 0;
            break;

          case "object":
            if (x instanceof ArrayBuffer) {
                if (!elementType._allowCasts)
                    throw new TypeError("cannot create ArrayBuffer view for type " + elementType.shortName);
                self._buffer = x;
                self._raw = x;
                self._byteOffset = byteOffset || 0;
                if (typeof instanceLength === "number") {
                    if (fixedSize)
                        throw new TypeError("array type already has length " + length);
                }
            } else {
                update = true;
            }
            break;

          default:
            throw new TypeError("expected optional number or object, got " + x);
        }

        if (!fixedSize) {
            for (var i = 0; i < instanceLength; i++) {
                (function() {
                    const off = i * elementType._byteLength;
                    Object.defineProperty(self, i, {
                        enumerable: true,
                        configurable: false,
                        get: function() {
                            return elementType._read(this._raw, this._byteOffset + off, this._buffer);
                        },
                        set: function(x) {
                            elementType._write(x, this._raw, this._byteOffset + off, this._buffer);
                        }
                    });
                })();
            }
        }

        if (update)
            self.update(x);

        return self;
    }

    if (!elementType._fixedSize)
        throw new TypeError(elementType._shortName + " type is not of fixed size");

    t.toString = function() {
        return "[type Array]";
    };

    t.toSource = function() {
        return "array(" + elementType.toSource() + ")";
    };

    var p = t.prototype;

    p.update = function update(x) {
        for (var i = 0, n = this.length; i < n; i++) {
            this[i] = x[i];
        }
    };

    p.toString = function toString() {
        return "[array " + this._type._elementType._shortName + "]";
    };

    p.toSource = function toSource() {
        return "array("
             + this._type._elementType._shortName
             + ")(["
             + this.toArray().map(String).join(",")
             + "])";
    };

    p.fill = function fill(x) {
        for (var i = 0, n = this.length; i < n; i++)
            this[i] = x;
    };

    p.subarray = function subarray(begin, end) {
        if (typeof end === "undefined")
            end = this.length;
        if (begin < 0 || begin >= end)
            throw new RangeError("begin index " + begin + " out of range");
        if (end <= 0 || end > this.length)
            throw new RangeError("end index " + end + " out of range");
        var elementType = this._type._elementType;
        var u = array(elementType, end - begin);
        return u._read(this._raw, this._byteOffset + (begin * elementType._byteLength), this._buffer);
    };

    p.toArray = function toArray() {
        var result = [];
        for (var i = 0, n = this.length; i < n; i++)
            result[i] = this[i];
        return result;
    };

    p.map = function map(f) {
        var elementType = this._type._elementType, A = array(elementType);
        var n = this.length, result = new A(n);
        for (var i = 0; i < n; i++)
            result[i] = this[i];
        return result;
    };

    var Ap = Array.prototype;

    p.forEach = Ap.forEach;

    p.reduce = Ap.reduce;

    if (fixedSize) {
        t._length = length;
        p.length = length;

        for (var i = 0; i < length; i++) {
            (function() {
                const off = i * elementType._byteLength;
                Object.defineProperty(p, i, {
                    enumerable: true,
                    configurable: false,
                    get: function() {
                        return elementType._read(this._raw, this._byteOffset + off, this._buffer);
                    },
                    set: function(x) {
                        elementType._write(x, this._raw, this._byteOffset + off, this._buffer);
                    }
                });
            })();
        }
    } else {
        t._length = undefined;
    }

    Object.defineProperty(p, "buffer", {
        enumerable: false,
        configurable: false,
        get: function() {
            return this._buffer;
        }
    });

    Object.defineProperty(p, "byteLength", {
        enumerable: false,
        configurable: false,
        get: function() {
            return this._type._byteLength;
        }
    });

    Object.defineProperty(p, "byteOffset", {
        enumerable: false,
        configurable: false,
        get: function() {
            return this._byteOffset;
        }
    });

    Object.defineProperty(p, "BYTES_PER_ELEMENT", {
        value: elementType._byteLength
    });

    t._brand = TYPE_BRAND;
    t._variant = "array";
    t._container = true;
    t._shortName = "array";
    t._fixedSize = fixedSize;
    t._allowCasts = elementType._allowCasts;
    t._byteLength = fixedSize ? length * elementType._byteLength : undefined;

    t._elementType = elementType;

    t._sameType = function sameType(u) {
        return u._variant === "array" &&
               this._elementType._sameType(u._elementType) &&
               this._length === u._length;
    };

    // (ArrayBuffer, index, Buffer) -> BufferView
    t._read = function(raw, i, buf) {
        var view = Object.create(p);
        view._brand = DATA_BRAND;
        view._type = t;
        view._buffer = buf;
        view._raw = raw;
        view._byteOffset = i;
        return view;
    };

    // (any, ArrayBuffer, index, Buffer) -> void
    t._write = function(a, raw, i, buf) {
        var elementType = this._type._elementType;
        var incr = elementType._byteLength;
        for (var j = 0, n = this.length; j < n; j++) {
            elementType._write(a[j], raw, i, buf);
            i += incr;
        }
    };

    return t;
}

var object = {
    toString: function() {
        return "[type Object]";
    },

    toSource: function() {
        return "object";
    },

    _brand: TYPE_BRAND,
    _variant: "object",
    _container: false,
    _shortName: "object",
    _fixedSize: true,
    _allowCasts: false,
    _byteLength: 4,

    _sameType: function sameType(u) {
        return u._variant === "object";
    },

    // (ArrayBuffer, index, TypedBuffer) -> Object
    _read: function(raw, i, buf) {
        return buf._jsvalAtOffset[i] || null;
    },

    // (Object, ArrayBuffer, index, TypedBuffer) -> void
    _write: function(obj, raw, i, buf) {
        if (typeof obj !== "object")
            throw new TypeError("expected object, got " + obj);
        buf._jsvalAtOffset[i] = obj;
    }
};

var any = {
    toString: function() {
        return "[type Any]";
    },

    toSource: function() {
        return "any";
    },

    _brand: TYPE_BRAND,
    _variant: "any",
    _container: false,
    _shortName: "any",
    _fixedSize: true,
    _allowCasts: false,
    _byteLength: 4,

    _sameType: function sameType(u) {
        return u._variant === "any";
    },

    // (ArrayBuffer, index, TypedBuffer) -> any
    _read: function(raw, i, buf) {
        return buf._jsvalAtOffset[i];
    },

    // (any, ArrayBuffer, index, TypedBuffer) -> void
    _write: function(x, raw, i, buf) {
        buf._jsvalAtOffset[i] = x;
    }
};

function pointer(targetType) {
    if (!targetType._container)
        throw new TypeError("target type is not a container type");

    return {
        toString: function() {
            return "[type Pointer]";
        },

        toSource: function() {
            return "pointer(" + this._targetType.toSource() + ")";
        },

        _brand: TYPE_BRAND,
        _variant: "pointer",
        _container: false,
        _shortName: targetType._shortName + "*",
        _fixedSize: true,
        _allowCasts: false,
        _byteLength: 4,

        _targetType: targetType,

        _sameType: function sameType(u) {
            return u._variant === "pointer" && this._targetType._sameType(u._targetType);
        },

        // (ArrayBuffer, index, TypedBuffer) -> Object
        _read: function(raw, i, buf) {
            return buf._jsvalAtOffset[i] || null;
        },

        // (Object, ArrayBuffer, index, TypedBuffer) -> void
        _write: function(obj, raw, i, buf) {
            if (typeof obj !== "object" || (obj !== null && (obj._brand !== DATA_BRAND || !obj._type._sameType(this._targetType))))
                throw new TypeError("expected object of type " + this._targetType._shortName + ", got " + obj);
            buf._jsvalAtOffset[i] = obj;
        }
    };
}


return {
    uint8: uint8,
    uint16: uint16,
    uint32: uint32,
    int8: int8,
    int16: int16,
    int32: int32,

    float32: float32,
    float64: float64,

    struct: struct,
    array: array,
    pointer: pointer,
    object: object,
    any: any
}

})();
