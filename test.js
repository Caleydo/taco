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
            //var x : number;
            //x = 'ab';
            var that = this;
            this.innertest = function () {
                return that.b;
            };
        }
        Test.prototype.test = function () {
            d3.select('body').attr('class', 'ddd');
            return this.a;
        };
        Test.prototype.test2 = function () {
            return this.b;
        };
        return Test;
    })();
    exports.Test = Test;
    var a10 = new Test(10);
    console.log(a10.test());
    var a20 = new test(20);
    console.log(a20.test());
    function ff() {
        var t = new Test();
        return t.test();
    }
    exports.ff = ff;
});
//# sourceMappingURL=test.js.map