# structs.js

Written by [Dave Herman](http://blog.mozilla.com/dherman)

A prototype implementation of the ECMAScript [Binary Data](http://wiki.ecmascript.org/doku.php?id=strawman:binary_data) API.

This version currently only works in Firefox 4, because it depends on proxies. It could be extended to work in Safari and Chrome by avoiding proxies (whose use is confined only to field.js). Then with a bit more work, it could be extended to work in IE by shimming typed arrays via plain arrays.

To use the library, include all three files in the `lib` directory.
