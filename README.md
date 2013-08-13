# structs.js

A [prollyfill](http://prollyfill.org) for the ES6 [typed/structured objects](http://wiki.ecmascript.org/doku.php?id=harmony:typed_objects) API.

Depends on proxies.

To use, include all files in the `lib` directory.

Example:

```javascript
var { struct, array, uint32, float32 } = Structs;

var Point = struct({ x: uint32, y: uint32 });
var Segment = struct({ start: Point, end: Point, opacity: float32 });
var Triangle = array(Segment, 3);

var t = new Triangle([{ start: { x: 0, y: 0 },
                        end: { x: 10, y: 0 },
                        opacity: 0.5 },
                      { start: { x: 10, y: 0 },
                        end: { x: 5, y: 10 },
                        opacity: 1.0 },
                      { start: { x: 5, y: 10 },
                        end: { x: 0, y: 0 },
                        opacity: 0.3 }]);
// ...
t[2].opacity = 0.4;
t[0].start.x++;
// ...
```

Example:

```javascript
var { struct, uint32, float32, object } = Structs;

var Widget = struct({ foo: uint32, bar: float32, baz: object });
var w = new Widget;
w.baz // null
w.baz = { quux: "xyzzx" };
w.foo = 12;
```

## License

Licensed under the [MIT License](http://mit-license.org).
