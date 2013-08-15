var int8 = TypedObjects.int8;
var int16 = TypedObjects.int16;
var int32 = TypedObjects.int32;
var uint8 = TypedObjects.uint8;
var uint16 = TypedObjects.uint16;
var uint32 = TypedObjects.uint32;
var float32 = TypedObjects.float32;
var float64 = TypedObjects.float64;
var uint8clamped = TypedObjects.uint8clamped;
var StructType = TypedObjects.StructType;

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
    } }
]);
