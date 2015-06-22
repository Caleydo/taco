/**
 * Created by Reem on 6/11/2015.
 */
///<reference path="../../tsd.d.ts" />
define(["require", "exports", 'd3'], function (require, exports, d3) {
    var x = 5;
    var Test = (function () {
        function Test(a) {
            if (a === void 0) { a = 5; }
            this.a = a;
            this.b = a + 10;
            var x;
            //x = 'ab';
        }
        Test.prototype.test = function () {
            d3.select('body').attr('class', 'ddd');
            return this.a;
        };
        return Test;
    })();
    exports.Test = Test;
    function ff() {
        var t = new Test();
        return t.test();
    }
    exports.ff = ff;
});
//# sourceMappingURL=test.js.map