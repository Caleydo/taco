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
    var x : number;

    //x = 'ab';
  }

  test() {
    d3.select('body').attr('class','ddd');
    return this.a;
  }
}

export function ff() {
  var t = new Test();
  return t.test();
}


