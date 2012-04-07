var { TypedBuffer, uint8, uint16, uint32, int8, int16, int32, struct, array, object, pointer, any } = Structs;

function buildArray(n) {
    var result = [];
    for (var i = 0; i < n; i++)
        result[i] = i;
    return result;
}

function throws(f) {
    try {
        f();
        return false;
    } catch (e) {
        return true;
    }
}

var Point = struct({ x: uint32, y: uint32 });
var Segment = struct({ start: Point, end: Point });
var PointRefs = struct({ ref1: pointer(Point), ref2: pointer(Point) });

wru.test([ {
    name: "uint8(0)...uint8(255)",
    test: function() {
        for (var i = 0; i <= 255; i++)
            wru.assert(uint8(i) === i);
    }
}, {
    name: "uint8(256)...uint8(511)",
    test: function() {
        for (var i = 256; i <= 511; i++)
            wru.assert(uint8(i) === (i - 256));
    }
}, {
    name: "uint8(-256)...uint8(-1)",
    test: function() {
        for (var i = -256; i <= -1; i++)
            wru.assert(uint8(i) === (i + 256));
    }
}, {
    name: "uint16",
    test: function() {
        wru.assert("-65537", uint16(-65537) === 65535);
        wru.assert("-65536", uint16(-65536) === 0);
        wru.assert("-65535", uint16(-65535) === 1);
        wru.assert("-2", uint16(-2) === 65534);
        wru.assert("-1", uint16(-1) === 65535);
        wru.assert("0", uint16(0) === 0);
        wru.assert("1", uint16(1) === 1);
        wru.assert("65535", uint16(65535) === 65535);
        wru.assert("65536", uint16(65536) === 0);
        wru.assert("65537", uint16(65537) === 1);
    }
}, {
    name: "uint32",
    test: function() {
        wru.assert("-4294967297", uint32(-4294967297) === 4294967295);
        wru.assert("-4294967296", uint32(-4294967296) === 0);
        wru.assert("-4294967295", uint32(-4294967295) === 1);
        wru.assert("-2", uint32(-2) === 4294967294);
        wru.assert("-1", uint32(-1) === 4294967295);
        wru.assert("0", uint32(0) === 0);
        wru.assert("1", uint32(1) === 1);
        wru.assert("4294967295", uint32(4294967295) === 4294967295);
        wru.assert("4294967296", uint32(4294967296) === 0);
        wru.assert("4294967297", uint32(4294967297) === 1);
    }
}, {
    name: "int8(-128)...int8(127)",
    test: function() {
        for (var i = -128; i <= 127; i++)
            wru.assert(int8(i) === i);
    }
}, {
    name: "int8(128)...int8(383)",
    test: function() {
        for (var i = 128; i <= 383; i++)
            wru.assert(int8(i) === (i - 256));
    }
}, {
    name: "int8(-384)...int8(-129)",
    test: function() {
        for (var i = -384; i <= -129; i++)
            wru.assert(int8(i) === (i + 256));
    }
}, {
    name: "int16",
    test: function() {
        wru.assert("-32769", int16(-32769) === 32767);
        wru.assert("-32768", int16(-32768) === -32768);
        wru.assert("-32767", int16(-32767) === -32767);
        wru.assert("-2", int16(-2) === -2);
        wru.assert("-1", int16(-1) === -1);
        wru.assert("0", int16(0) === 0);
        wru.assert("1", int16(1) === 1);
        wru.assert("32767", int16(32767) === 32767);
        wru.assert("32768", int16(32768) === -32768);
        wru.assert("32769", int16(32769) === -32767);
    }
}, {
    name: "int32",
    test: function() {
        wru.assert("-2147483649", int32(-2147483649) === 2147483647);
        wru.assert("-2147483648", int32(-2147483648) === -2147483648);
        wru.assert("-2147483647", int32(-2147483647) === -2147483647);
        wru.assert("-2", int32(-2) === -2);
        wru.assert("-1", int32(-1) === -1);
        wru.assert("0", int32(0) === 0);
        wru.assert("1", int32(1) === 1);
        wru.assert("2147483647", int32(2147483647) === 2147483647);
        wru.assert("2147483648", int32(2147483648) === -2147483648);
        wru.assert("2147483649", int32(2147483649) === -2147483647);
    }
}, {
    name: "copy vs ref",
    test: function() {
        var start = new Point({ x: 0, y: 0 });
        var end = new Point({ x: 10, y: 10 });
        var s = new Segment({ start: start, end: end });
        var t = new PointRefs({ ref1: start, ref2: end });
        end.y++;
        wru.assert(s.end.y === 10);
        wru.assert(t.ref2.y === 11);
    }
}, {
    name: "unsized array type",
    test: function() {
        var A = array(uint32);
        var a = new A(16);
        wru.assert(a.length === 16);
        wru.assert(a[0] === 0);
        wru.assert(a[12] === 0);
        a[12] = 17;
        wru.assert(a[0] === 0);
        wru.assert(a[12] === 17);
    }
}, {
    name: "sized array type",
    test: function() {
        var A = array(uint32, 16);
        var a = new A();
        wru.assert(a.length === 16);
        wru.assert(a.length === 16);
        wru.assert(a[0] === 0);
        wru.assert(a[12] === 0);
        a[12] = 17;
        wru.assert(a[0] === 0);
        wru.assert(a[12] === 17);
    }
} ]);
