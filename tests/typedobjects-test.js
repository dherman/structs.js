"use strict";
var int8 = TypedObjects.int8;
var int16 = TypedObjects.int16;
var int32 = TypedObjects.int32;
var uint8 = TypedObjects.uint8;
var uint16 = TypedObjects.uint16;
var uint32 = TypedObjects.uint32;
var float32 = TypedObjects.float32;
var float64 = TypedObjects.float64;
var uint8clamped = TypedObjects.uint8clamped;

var any = TypedObjects.any;
var object = TypedObjects.object;
var string = TypedObjects.string;

var StructType = TypedObjects.StructType;
var ArrayType = TypedObjects.ArrayType;

function throws(f) {
    try {
        f();
        return false;
    } catch (e) {
        return true;
    }
}

wru.test([ {
    name: "first test",
    test: function() {
      var Point = new StructType( { x : uint8, y : uint8 });
      var p1 = new Point({ x : 1, y : 1});
      wru.assert(p1.x === 1);
      wru.assert(p1.y === 1);
    } }, {
    name: "alignment",
    test: function() {
      var S = new StructType( { x : uint8, y : uint32 } );
      var s = new S( { x : 255, y : 1024 } );
      wru.assert(s.x === 255);
      wru.assert(s.y === 1024);
    } }, {    
    name: "alignment 2",
    test: function() {
      var S = new StructType( { x : uint32, y : uint8 } );
      var s = new S( { x : 1024, y : 255 } );
      wru.assert(s.x === 1024);
      wru.assert(s.y === 255);
    } }, {
    name: "all primitive types",
    test: function() {
      var S = new StructType(
          {   u8 : uint8,
              i8 : int8,
              u8c : uint8clamped,
              u16 : uint16,
              i16 : int16,
              u32 : uint32,
              i32 : int32,
              f32 : float32,
              f64 : float64 });
      var s = new S({ u8 : 255, i8 : 127, u8c : 1024, u16 : 0xFFFF, i16 : 0x7FFF,
                      u32 : 0xFFFFFFFF, i32 : 0x7FFFFFFF,
                      f32 : 1.5, f64 : 1.5 });
      wru.assert(s.u8 === 255);
      wru.assert(s.i8 === 127);
      wru.assert(s.u8c === 255);
      wru.assert(s.u16 === 0xFFFF);
      wru.assert(s.i16 === 0x7FFF);
      wru.assert(s.u32 === 0xFFFFFFFF);
      wru.assert(s.i32 === 0x7FFFFFFF);
      wru.assert(s.f32 === 1.5);
      wru.assert(s.f64 === 1.5);

      var s0 = new S();
      wru.assert(s0.u8 === 0);
      wru.assert(s0.i8 === 0);
      wru.assert(s0.u8c === 0);
      wru.assert(s0.u16 === 0);
      wru.assert(s0.i16 === 0);
      wru.assert(s0.u32 === 0);
      wru.assert(s0.i32 === 0);
      wru.assert(s0.f32 === 0);
      wru.assert(s0.f64 === 0);

    } }, {
    name: "ArrayBuffer constructor",
    test: function() {
      var S = new StructType({ x : uint8, y : uint16, z : uint32 });
      var buffer = new ArrayBuffer(1024);
      var u8a = new Uint8Array(buffer);
      var s = new S(buffer, 100);
      s.x = 1;
      s.y = 2;
      s.z = 3; 
      wru.assert(u8a[100] === 1);
      wru.assert(u8a[102] === 2); // assume little-endian
      wru.assert(u8a[104] === 3); // assume little-endian
    } }, {
    name: "Struct in struct",
    test: function() {
      var S = new StructType({ x : uint8 });
      var S1 = new StructType({ s : S });
      var s1 = new S1({ s : { x : 1 } });
      wru.assert(s1.s.x === 1);
      s1.s.x = 2;
      wru.assert(s1.s.x === 2);
      var s = new S({ x : 42 });
      s1.s = s;
      wru.assert(s1.s.x === 42);
      s1.s.x = 27;
      s = s1.s;
      wru.assert(s.x === 27);
    } }, {
    name: "Struct in struct 2",
    test: function() {
      var S = new StructType({ x : uint8, y : uint32 });
      var S1 = new StructType({ z : uint16, s : S });
      var s1 = new S1({ z : 3, s : { x : 1, y : 2 } });
      wru.assert(S.storage(s1.s).byteOffset === 4);
      wru.assert(S.storage(s1.s).byteLength === 8);
      wru.assert(s1.s.x === 1 && s1.s.y === 2 && s1.z === 3);
      s1.s.x = 2;
      wru.assert(s1.s.x === 2 && s1.s.y === 2 && s1.z === 3);
      var s = new S({ x : 42, y : 1024 });
      s1.s = s;
      wru.assert(s1.s.x === 42 && s1.s.y === 1024);
      s1.s.x = 27;
      s = s1.s;
      wru.assert(s.x === 27 && s.y === 1024);
    } }, {
    name: "Struct in struct: ArrayBuffer",
    test: function() {
      var u8a = new Uint8Array(1024);   
      var S = new StructType({ x : uint8, y : uint32 });
      var S1 = new StructType({ z : uint16, s : S });
      var s1 = new S1(u8a.buffer, 100);
      s1.s = new S({ x : 1, y : 2});
      wru.assert(s1.s.x == 1 && s1.s.y == 2);
      s1.z = 3;
      wru.assert(u8a[100] === 3);
      wru.assert(u8a[104] === 1);
      wru.assert(u8a[108] === 2);
    } }, {
    name: "ArrayType: simple",
    test: function() {
      var A = new ArrayType(uint8, 10);
      var a = new A();
      var i;
      wru.assert(a.length === 10);
      wru.assert(a.byteLength === 10);
      wru.assert(a.byteOffset === 0);
      for (i = 0; i < 10; i++) a[i] = i;
      for (i = 0; i < 10; i++) {
        wru.assert(a[i] === i);
      }
      var a1 = new A([10, 9, 8, 7, 6 , 5, 4, 3, 2, 1]);
      wru.assert(a1.length === 10);
      for (i = 0; i < 10; i++)
        wru.assert(a1[i] === 10 - i);
    } }, {
    name: "ArrayType: uint16",
    test: function() {
      var i;
      var A = new ArrayType(uint16, 10);
      var a = new A();
      wru.assert(a.length === 10);
      for (i = 0; i < 10; i++) a[i] = i;
      for (i = 0; i < 10; i++) {
        wru.assert(a[i] === i);
      }
      var a1 = new A([10, 9, 8, 7, 6 , 5, 4, 3, 2, 1]);
      wru.assert(a1.length === 10);
      for (i = 0; i < 10; i++)
        wru.assert(a1[i] === 10 - i);
    } }, {
    name: "ArrayType: struct",
    test: function() {
      var i;
      var S = new StructType({ x : uint8, y : uint32 });
      var initializer = [];
      for(i = 0; i < 10; i++) {
        initializer.push(new S({ x : 2*i, y : 2*i + 1}));        
      }    
      var A = new ArrayType(S, 10);
      var a = new A(initializer);
      wru.assert(a.length ===10);
      for (i = 0; i < 10; i++) {
        wru.assert(a[i].x === 2*i);
        wru.assert(a[i].y === 2*i + 1);
      }

      var a1 = new A();
      for (i = 0; i < 10; i++) {
        a1[i] = initializer[i];
      }
      wru.assert(a1.length ===10);
      for (i = 0; i < 10; i++) {
        wru.assert(a1[i].x === 2*i);
        wru.assert(a1[i].y === 2*i + 1);
      }
    } }, {
    name: "ArrayType: single struct",
    test: function() {
      var S = new StructType({x : uint8});
      var A = new ArrayType(S, 1);
      var a = new A([{ x : 10}]);
      wru.assert(a[0].x === 10);
    } }, {
    name: "Variable sized ArrayType",
    test: function() {
      var uint32Array = new ArrayType(uint32);
      var u32a = new uint32Array(10);
      wru.assert(u32a.length === 10);
      u32a[0] = 11;
      u32a[7] = 56;
      wru.assert(u32a[0] === 11);
      wru.assert(u32a[7] === 56);
    } }, {
    name: "ArrayType in a struct",
    test: function() {
      var A = new ArrayType(uint8, 3);
      var S = new StructType({ left : A, right : A });
      var s = new S({ left : [ 1, 2, 3 ], right : [ 257, 258, 259 ] });
      wru.assert(s.left.length == 3);
      wru.assert(s.right.length == 3);
      wru.assert(s.right.byteOffset === 3);
      wru.assert(s.right.byteLength === 3);
      for (var i = 0; i < 3; i++) {
        wru.assert(s.left[i] === s.right[i]);
      }
    } }, {
    name: "ArrayType in a struct: simple",
    test: function() {
      var A = new ArrayType(uint8, 3);
      var S = new StructType({ z : uint32, left : A });
      var s = new S({ left : [ 1, 2, 3 ]});
      wru.assert(s.left.length == 3);
      for (var i = 0; i < 3; i++) {
        wru.assert(s.left[i] === i + 1);
      }
    } }, {
    name: "Opaque types: simple",
    test: function() {
      var S = new StructType({x : uint8, o : object});
      var o = {};
      var s = new S({ x : 5, o : o });
      wru.assert(s.x === 5);
      wru.assert(s.o === o);
      wru.assert(S.storage === undefined);
    } }, {
    name: "Opaque types: mixed",
    test: function() {
      var S = new StructType({x : uint8, o : object});
      var S1 = new StructType({ s : S, x : uint32});
      var o = {};
      var s1 = new S1({s : { x : 5, o : o }, x : 1024});
      wru.assert(s1.x === 1024);
      wru.assert(s1.s.o === o);
      wru.assert(s1.s.x === 5);
      wru.assert(S1.storage === undefined);
    } }, {
    name: "Opaque types: opaque storage",
    test: function() {
      var S = new StructType({x : uint8, y : uint32 });
      var S1 = new StructType({ s : S, o : object});
      var o = {};
      var s1 = new S1({s : { x : 5, y : 1024 }, o : o});
      wru.assert(s1.s.x === 5);
      wru.assert(s1.s.y === 1024);
      wru.assert(s1.o === o);
      wru.assert(S.storage !== undefined);
      wru.assert(S1.storage === undefined);
      wru.assert(throws(function() { S.storage(s1.s); }));
    } }, {
    name: "Opaque array",
    test: function() {
      var A = new ArrayType(object, 100);
      var o = {};
      var a = new A();
      for(var i = 0; i < 100; i++) {
        a[i] = o;
      }
      wru.assert(a.length === 100);
      wru.assert(a.byteLength === undefined);
      wru.assert(a.byteOffset === undefined);
      for(var i = 0; i < 100; i++) {
        wru.assert(a[i] === o);
      }
    } }

]);
