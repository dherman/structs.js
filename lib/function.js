if (!Function.create) {
    Function.create = function create(call, construct) {
        var f = Proxy.createFunction(Proxy.Handler(function(){}),
                                     call,
                                     function() {
                                         var self = Object.create(f.prototype);
                                         var result = construct.apply(self, arguments);
                                         return (typeof result === "object" && result !== null)
                                              ? result
                                              : self;
                                     });
        f.prototype.constructor = f;
        return f;
    }
}
