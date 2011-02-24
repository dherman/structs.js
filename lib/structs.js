/* ***** BEGIN LICENSE BLOCK *****
 *
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Structs library.
 *
 * The Initial Developer of the Original Code is
 * Dave Herman <dherman@mozilla.com>.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Dave Herman <dherman@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// FIXME:
//  - which elements of the API should be immutable?
//  - for anything that isn't immutable, need to save and use the initial value (e.g., t.bytes)
//  - private data could probably share more methods in prototypes, to save space
//  - are there more typed array methods we can implement?
//  - if we change Proxy.createFunction to allow setting the prototype, create meta-class hierarchy

var Structs = (function() {

var privates = new PrivateField();

function Block() {
    throw new Error("Block is abstract");
}

function unwrapBlock(x, msg) {
    var X = privates.unwrap(x);
    if (!X || X.Class !== "Block")
        throw new TypeError(msg);
    return X;
}

Block.prototype = {
    update: function(val) {
        var This = unwrapBlock(this, "update must be called on a Block object");
        var type = This.BlockType;
        var Type = privates.unwrap(type);
        Type.Convert(val, This.Buffer, This.Start);
    },
    updateRef: function(x, key) {
        var This = unwrapBlock(this, "updateRef must be called on a Block object");
        var X = unwrapBlock(x, "expected Block object, got " + x);
        X.SetRef(This, key);
    }
};

function array(n) {
    return new ArrayType(this, n);
}

function IntType(bytes, min, max, TypedArray, BlockType, cast) {
    // (any, ArrayBuffer, index) -> void
    function Convert(val, dst, i) {
        var ref = new TypedArray(dst, i, 1);
        if (val === true)
            ref[0] = 1;
        else if (val === false)
            ref[0] = 0;
        else if (typeof val === "number" && val >= min && val <= max && Math.floor(val) === Math.ceil(val))
            ref[0] = val;
        else
            throw new TypeError("invalid " + BlockType + " value: " + val);
        return ref;
    }

    function IsSame(u) {
        var U = privates.unwrap(u);
        if (!U || U.Class !== "BlockType")
            throw new TypeError("expected a BlockType, got " + u);
        return U.BlockType === BlockType;
    }

    function Cast(n) {
        if (typeof n === "string") {
            n = parseInt(n);
            if (n !== n)
                throw new TypeError("invalid " + BlockType + " string");
        }
        if (typeof n !== "number")
            throw new TypeError("invalid " + BlockType + ": " + n);
        if (n === Infinity || n !== n)
            return 0;
        return CCast(n);
    }

    function CCast(n) {
        if (typeof n !== "number")
            throw new TypeError("expected number, got " + n);
        return cast(n);
    }

    function Call(n) {
        return Cast(n);
    }

    function Construct() {
        throw new TypeError("cannot instantiate atomic type " + BlockType);
    }

    // (ArrayBuffer, index) -> number
    function Reify(buf, i) {
        return (new TypedArray(buf, i, 1))[0];
    }

    return {
        Class: "BlockType",
        BlockType: BlockType,
        Convert: Convert,
        IsSame: IsSame,
        Cast: Cast,
        CCast: CCast,
        Call: Call,
        Construct: Construct,
        Reify: Reify
    };
}

var Uint8  = IntType(1, 0, 0xff,       Uint8Array,  "uint8",  ToUint8);
var Uint16 = IntType(2, 0, 0xffff,     Uint16Array, "uint16", ToUint16);
var Uint32 = IntType(4, 0, 0xffffffff, Uint32Array, "uint32", ToUint32);

var Int8  = IntType(1, -0x80,       0x7f,       Int8Array,  "int8",  ToInt8);
var Int16 = IntType(2, -0x8000,     0x7fff,     Int16Array, "int16", ToInt16);
var Int32 = IntType(4, -0x80000000, 0x7fffffff, Int32Array, "int32", ToInt32);

var uint8  = privates.wrapFunction({ bytes: 1, array: array, toString: function() { return "uint8"  } }, Uint8,  Uint8.Call,  Uint8.Construct);
var uint16 = privates.wrapFunction({ bytes: 2, array: array, toString: function() { return "uint16" } }, Uint16, Uint16.Call, Uint16.Construct);
var uint32 = privates.wrapFunction({ bytes: 4, array: array, toString: function() { return "uint32" } }, Uint32, Uint32.Call, Uint32.Construct);

var int8  = privates.wrapFunction({ bytes: 1, array: array, toString: function() { return "int8"  } }, Int8,  Int8.Call,  Int8.Construct);
var int16 = privates.wrapFunction({ bytes: 2, array: array, toString: function() { return "int16" } }, Int16, Int16.Call, Int16.Construct);
var int32 = privates.wrapFunction({ bytes: 4, array: array, toString: function() { return "int32" } }, Int32, Int32.Call, Int32.Construct);

function Float(k, FloatkArray, cast) {
    const bytes = k / 8;
    const BlockType = "float" + k;

    // (any, ArrayBuffer, index) -> void
    function Convert(val, dst, i) {
        var ref = new FloatkArray(dst, i, 1);
        if (val === true)
            ref[0] = 1;
        else if (val === false)
            ref[0] = 0;
        else if (typeof val === "number")
            ref[0] = val;
        else
            throw new TypeError("invalid " + BlockType + " value: " + val);
    }

    function IsSame(u) {
        var U = privates.unwrap(u);
        if (!U || U.Class !== "BlockType")
            throw new TypeError("expected a BlockType, got " + u);
        return U.BlockType === BlockType;
    }

    function Cast(n) {
        if (typeof n === "string")
            n = parseFloat(n);
        if (typeof n !== "number")
            throw new TypeError("invalid " + BlockType + ": " + n);
        return CCast(n);
    }

    function CCast(n) {
        if (typeof n !== "number")
            throw new TypeError("expected number, got " + n);
        return cast(n);
    }

    function Call(n) {
        return Cast(n);
    }

    function Construct() {
        throw new TypeError("cannot instantiate atomic type uint8");
    }

    // (ArrayBuffer, index) -> number
   function Reify(buf, i) {
        return (new FloatkArray(buf, i, 1))[0];
    }

    return {
        Class: "BlockType",
        BlockType: BlockType,
        Convert: Convert,
        IsSame: IsSame,
        Cast: Cast,
        CCast: CCast,
        Call: Call,
        Construct: Construct,
        Reify: Reify
    };
}

// FIXME: implement this
function doubleToFloat(n) {
    throw new Error("float64 -> float32 cast not implemented");
}

var Float32 = Float(32, Float32Array, function(n) { return n; });
var Float64 = Float(64, Float64Array, doubleToFloat);

var float32 = privates.wrapFunction({ bytes: 4, array: array, toString: function() { return "float32" } }, Float32, Float32.Call, Float32.Construct);
var float64 = privates.wrapFunction({ bytes: 8, array: array, toString: function() { return "float64" } }, Float64, Float64.Call, Float64.Construct);

// FIXME: optimize using 64-bit chunks
function memcpy(dst, dstOff, src, srcOff, bytes) {
    var dstA = new Uint8Array(dst, dstOff, bytes);
    var srcA = new Uint8Array(src, srcOff, bytes);
    for (var i = 0; i < bytes; i++)
        dstA[i] = srcA[i];
}

function StructType(desc) {
    var Fields = Object.create(null, {});
    var bytes = 0;
    for (var fieldName in desc) {
        if (({}).hasOwnProperty.call(desc, fieldName)) {
            var fieldType = desc[fieldName];
            var FieldType = privates.unwrap(fieldType);
            if (!FieldType || FieldType.Class !== "BlockType")
                throw new TypeError("field " + fieldName + ": expected a BlockType, got " + fieldType);
            Fields[fieldName] = fieldType;
            bytes += fieldType.bytes;
        }
    }
    Object.freeze(Fields);

    // FIXME: implement this
    function Call() {
        throw new Error("Struct.[[Call]] not yet implemented");
    }

    function Construct(init) {
        var s = Reify(new ArrayBuffer(bytes), 0);
        if (init)
            s.update(init);
        return s;
    }

    // (ArrayBuffer, index) -> Block
    function Reify(buf, i) {
        var S = {
            Class: "Block",
            BlockType: t,
            Buffer: buf,
            Start: i
        };
        var s = Object.create(Block.prototype, {});
        var j = 0;
        for (var fieldName in Fields) {
            (function() {
                var fieldType = Fields[fieldName];
                var FieldType = privates.unwrap(fieldType);
                var off = j;
                Object.defineProperty(s, fieldName, {
                    enumerable: true,
                    configurable: true,
                    get: function() {
                        return FieldType.Reify(S.Buffer, S.Start + off);
                    },
                    set: function(val) {
                        FieldType.Convert(val, S.Buffer, S.Start + off);
                    }
                });
                j += fieldType.bytes;
            })();
        }
        return privates.wrap(s, S, t.prototype);
    }

    // (any, ArrayBuffer, index) -> void
    function Convert(val, dst, i) {
        if (typeof val !== "object" || val === null)
            throw new TypeError("expected object, got " + val);
        var Val = privates.unwrap(val);
        if (Val && Val.Class === "Block") {
            if (!privates.unwrap(Val.BlockType).IsSame(t))
                throw new TypeError("BlockType mismatch");
            memcpy(dst, i, Val.Buffer, Val.Start, bytes);
            return;
        }
        for (var fieldName in Fields) {
            var fieldType = Fields[fieldName];
            var FieldType = privates.unwrap(fieldType);
            FieldType.Convert(val[fieldName], dst, i);
            i += fieldType.bytes;
        }
    }

    var T = {
        Class: "BlockType",
        BlockType: "struct",
        Fields: Fields,
        Convert: Convert,
        IsSame: function(u) {
            return t === u;
        },
        Call: Call,
        Construct: Construct,
        Reify: Reify
    };

    var t = privates.wrapFunction({
        bytes: bytes,
        fields: Fields,
        prototype: Object.create(Block.prototype, { constructor: { value: t }, toString: function() { return "[object Struct]"; } }),
        array: array,
        toString: function() { return "[object StructType]"; }
    }, T, Call, Construct);
    return t;
}

function normal(val, enumerable) {
    if (enumerable === (void 0))
        enumerable = true;
    return { value: val,
             enumerable: enumerable,
             configurable: true,
             writable: true };
}

function ArrayType(elementType, length) {
    if (!elementType || typeof elementType !== "function")
        throw new TypeError("expected BlockType, got " + elementType);
    var ElementType = privates.unwrap(elementType);
    if (!ElementType || ElementType.Class !== "BlockType")
        throw new TypeError("expected BlockType, got " + elementType);

    if (typeof length !== "number")
        throw new TypeError("expected number, got " + length);

    var bytes = elementType.bytes * length;

    // FIXME: implement this
    function Call() {
        throw new Error("Array.[[Call]] not yet implemented");
    }

    function Construct(init) {
        var a = Reify(new ArrayBuffer(bytes), 0);
        if (init)
            a.update(init);
        return a;
    }

    function SetRef(X, key) {
        if (typeof key !== "number")
            throw new TypeError("expected index, got " + key);
        if (key < 0 || key >= length)
            throw new RangeError("expected index in range [0, " + length + "), got " + key);
        if (!privates.unwrap(X.BlockType).IsSame(elementType))
            throw new TypeError("cannot update block to mismatched type");
        var before = X.Buffer;
        print(X.Buffer + ", " + X.Start);
        X.Buffer = this.Buffer;
        X.Start = this.Start + (key * elementType.bytes);
        print(X.Buffer + ", " + X.Start);
        var after = X.Buffer;
        print(before === after);
    }

    // (ArrayBuffer, index) -> Block
    function Reify(buf, i) {
        var A = {
            Class: "Block",
            BlockType: t,
            Buffer: buf,
            Start: i,
            SetRef: SetRef
        };
        var a = Object.create(Block.prototype, {
            length: { value: length },
            fill: normal(fill, false),
            subarray: normal(subarray, false),
            toArray: normal(toArray, false),
            map: normal(map, false),
            forEach: normal(Array.prototype.forEach, false),
            reduce: normal(Array.prototype.reduce, false)
        });
        for (var j = 0; j < length; j++) {
            (function() {
                var off = j * elementType.bytes;
                Object.defineProperty(a, j, {
                    enumerable: true,
                    configurable: true,
                    get: function() {
                        return ElementType.Reify(A.Buffer, A.Start + off);
                    },
                    set: function(val) {
                        ElementType.Convert(val, A.Buffer, A.Start + off);
                    }
                });
            })();
        }
        return privates.wrap(a, A, t.prototype);
    }

    // (any, ArrayBuffer, index) -> void
    function Convert(val, dst, i) {
        if (typeof val !== "object" || val === null)
            throw new TypeError("expected object, got " + val);
        var Val = privates.unwrap(val);
        if (Val && Val.Class === "Block") {
            if (!privates.unwrap(Val.BlockType).IsSame(t))
                throw new TypeError("BlockType mismatch");
            memcpy(dst, i, Val.Buffer, Val.Start, bytes);
            return;
        }
        for (var j = 0; j < length; j++) {
            ElementType.Convert(val[j], dst, i);
            i += elementType.bytes;
        }
    }

    var T = {
        Class: "BlockType",
        BlockType: "array",
        ElementType: ElementType,
        Length: length,
        Convert: Convert,
        IsSame: function(u) {
            if (typeof u !== "function")
                throw new TypeError("expected BlockType, got " + u);
            var U = privates.unwrap(u);
            if (!U || U.Class !== "BlockType")
                throw new TypeError("expected BlockType, got " + u);
            return U.BlockType === "array" && U.ElementType.IsSame(elementType) && U.Length === length;
        },
        Call: Call,
        Construct: Construct,
        Reify: Reify
    };

    var t = privates.wrapFunction({
        bytes: bytes,
        elementType: elementType,
        length: length,
        array: array,
        toString: function() { return "[object ArrayType]"; }
    }, T, Call, Construct);
    return t;
}

function unwrapArray(a, msg) {
    if (typeof a !== "object")
        throw new TypeError(msg);
    var A = privates.unwrap(a);
    if (!A || A.Class !== "Block")
        throw new TypeError(msg);
    var t = A.BlockType;
    var T = privates.unwrap(t);
    if (T.BlockType !== "array")
        throw new TypeError(msg);
    return A;
}

function subarray(begin, end) {
    var This = unwrapArray(this, "subarray must be called on an array block object");

    var t = This.BlockType;

    if (end === (void 0))
        end = this.length;

    if (begin < 0 || begin > end)
        throw new RangeError(begin + " not in range [0, " + end + "]");

    var elementType = t.elementType;

    var u = new ArrayType(elementType, end - begin);
    var U = privates.unwrap(u);

    return U.Reify(This.Buffer, This.Start + (begin * elementType.bytes));
}

function fill(val) {
    var length = this.length;
    for (var i = 0; i < length; i++)
        this[i] = val;
}

function toArray() {
    var length = this.length;
    var result = new Array(length);
    for (var i = 0; i < length; i++)
        result[i] = this[i];
    return result;
}

function map(f) {
    var This = unwrapArray(this, "map must be called on a binary array block");
    var type = This.BlockType;
    var result = new type();
    var length = this.length;
    for (var i = 0; i < length; i++)
        result[i] = f(this[i]);
    return result;
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
    Block: Block,
    StructType: StructType,
    ArrayType: ArrayType
};

})();
