/**
 * Created by Reem on 6/11/2015.
 */
///<reference path="../../tsd.d.ts" />

import d3 = require('d3');

var x = 5;

export class Test {
  b : number;
  constructor(public a = 5) {
    this.b = a+10;
    //var x : number;

    //x = 'ab';
    var that = this;
    this.innertest = function() {
      return that.b;
    };
  }

  test() {
    d3.select('body').attr('class','ddd');
    return this.a;
  }

  private test2() {
    return this.b;
  }
}

var a10 = new Test(10);
console.log(a10.test());
var a20 = new test(20);
console.log(a20.test());

export function ff() {
  var t = new Test();
  return t.test();
}


