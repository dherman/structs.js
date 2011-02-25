# structs.js

Written by [Dave Herman](http://blog.mozilla.com/dherman)

A prototype implementation of the ECMAScript [Binary Data](http://wiki.ecmascript.org/doku.php?id=strawman:binary_data) API.

This version currently only works in Firefox 4, because it depends on proxies. It could be extended to work in Safari and Chrome by avoiding proxies (whose use is confined only to field.js). Then with a bit more work, it could be extended to work in IE by shimming typed arrays via plain arrays.

To use the library, include all three files in the `lib` directory.

Example:

    var { StructType, ArrayType, uint32, float32 } = Structs;
    
    var Point = new StructType({ x: uint32, y: uint32 });
    var Segment = new StructType({ start: Point, end: Point, opacity: float32 });
    var Triangle = new ArrayType(Segment, 3);
    
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
