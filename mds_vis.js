/**
 * Created by Reem on 10/23/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util', './drag'], function (exports, d3, d3utils, drag) {
    //draw MDS graph?
    Array.prototype.enorm = function () {
      return Math.sqrt(this.reduce(function (prev, cur) {
        return prev + cur * cur;
      }, 0));
    };

    dist = function (a, b) {
      return (a.add(b.mult(-1))).enorm();
    };

    Array.prototype.add = function (b) {
      var s = Array(this.length);
      for (var ind = 0; ind < this.length; ind++) {
        if (typeof(b) == "number") {
          s[ind] = this[ind] + b;
        }
        else {
          s[ind] = this[ind] + b[ind];
        }
      }
      return s;
    };

    Array.prototype.mult = function (b) {
      var s = Array(this.length);
      for (var ind = 0; ind < this.length; ind++) {
        if (typeof(b) == "number") {
          s[ind] = this[ind] * b;
        }
        else {
          s[ind] = this[ind] * b[ind];
        }
      }
      return s;
    };

    Array.prototype.max = function () {
      return Math.max.apply(Math, this);
    };

    Array.prototype.min = function () {
      return Math.min.apply(Math, this);
    };

    Array.prototype.range = function () {
      return [this.min(), this.max()];
    };
    function project(a, b, r) {
      var d = a.add(b.mult(-1));
      var rat = r / d.enorm();
      return b.add(d.mult(rat));
    }

    function recompute_positions(ind, X, D) {
      var d = D[ind], Xc = Array(D.length), x = [X[ind].x, X[ind].y];
      for (i = 0; i < X.length; i++) {
        if (i != ind) {
          var tmp = project([X[i].x, X[i].y], x, d[i]);
          Xc[i] = {'x': tmp[0], 'y': tmp[1]};
        }
        else {
          Xc[ind] = X[ind];
        }

      }
      return Xc;
    }

    //Used to expand slightly the plotting window
    expand = function (r) {
      var d = r[1] - r[0], alpha = .1;
      return r.add([-alpha * d, alpha * d]);
    };

    d3scatterplot = function (svg, X, D, cities) {
      var nPix = 420, n = D.length, mar = [40, 60, 40, 40];

      var xv = X.map(function (e) {
        return e.x;
      }), xRange = expand(xv.range());
      var yv = X.map(function (e) {
        return e.y;
      }), yRange = expand(yv.range());
      svg.attr("width", nPix + mar[0] + mar[2])
        .attr("height", nPix + mar[1] + mar[3]);

      var sg = svg.append("g")
        .attr("transform", "translate("
        + mar[0] + ","
        + mar[1] + ")");

      var xScale = d3.scale.linear()
        .range([0, nPix])
        .domain(xRange);

      var yScale = d3.scale.linear()
        .range([nPix, 0])
        .domain(yRange);

      var labels = sg.selectAll(".labels")
        .data(X).enter()
        .append("text")
        .attr("class", "label")
        .text(function (d, i) {
          return cities[i];
        })
        .attr("font-size", 10)
        .attr("id", function (d, i) {
          return "label" + i
        });

      var dots = sg.selectAll(".datapoint")
        .data(X).enter()
        .append("circle")
        .attr("class", "datapoint")
        .attr("cx", function (d) {
          return xScale(d.x);
        })
        .attr("cy", function (d) {
          return yScale(d.y);
        })
        .attr("id", function (d, i) {
          return "point" + i
        })
        .attr("r", 2);

      var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(4);
      svg.append("g").call(xAxis)
        .attr("class", "axis")  //Assign "axis" class
        .attr("transform", "translate(" + mar[0] + "," + (nPix + mar[1]) + ")");

      var yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(4);
      svg.append("g").call(yAxis)
        .attr("class", "axis")  //Assign "axis" class
        .attr("transform", "translate(" + mar[0] + "," + (mar[3]) + ")");

      var Xn = recompute_positions(0, X, D);
      labels.data(Xn)
        .transition()
        .attr("x", function (d) {
          return xScale(d.x);
        })
        .attr("y", function (d) {
          return yScale(d.y);
        });
    };

    function drawMDSGraph(parent, data, dim) {
      //this calls the d3 code
      //http://bl.ocks.org/dahtah/4482115#data.js
      var svg = parent.append("svg")
        //todo change this to the dim
        .attr("width", "100%")
        .attr("height", "100%");
      d3scatterplot(svg, data.X, data.D, data.cities);


      return svg;
    }

    exports.MDSVis = d3utils.defineVis('DiffBarPlotVis', {
        dim: ['column']
      }, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        var $node = $parent.append("div")
          .classed("d3-scatter-output", true);
        data.data().then(function(mdata){
          drawMDSGraph($parent, mdata, size);
        });
        return $node;
      });

    exports.create = function (data, parent, options) {
      return new exports.MDSVis(data, parent, options);
    };
  }
);
