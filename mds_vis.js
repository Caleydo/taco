/**
 * Created by Reem on 10/23/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util'], function (exports, d3, d3utils) {
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

    //end of mds part
    //beginning of force directed graph
    function drawFDGraph(parent, mdata, size){
      //todo use size instead
      var width = 500,
        height = 500;
      var svg = parent.append("svg")
        .attr("width", width)
        .attr("height", height);
      svg = drawGraphNodes(svg, mdata, width, height);
      return svg;
    }

    function drawGraphNodes(svg, graph, width, height){
      //todo consider the value in the links!!
      //todo the value should represent the similarity ?
      var force = d3.layout.force()
        .charge(-150)
        .size([width, height])
        .nodes(graph.nodes)
        .links(graph.links);
        //.start();

      // http://jsdatav.is/visuals.html?id=83515b77c2764837aac2
      // here the value represent the distance -> diff
      force.linkDistance(function(link) {
        return link.value * 3;
      });
      //force.linkDistance(width/2);

      // http://jsdatav.is/visuals.html?id=774d02a21dc1c714def8
      // here the value represent the attraction force? but the distance should be static
      //force.linkStrength(function(link){
         //should return [0,1], 1 is the default which is repulsive
        //todo we assume that the value we get is [0,100]
        //todo better to divide it on the largest value -> do some sort of normalization here
       // return link.value/100;
      //});

      //it's important to start at the end
      force.start();

      var node = svg.selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("g")
        .attr("class", "node");
        //.call(force.drag);

      var circles = node.append("circle")
        .attr("r", 7)
        .attr("class", "fd-circle");

      node.append("text")
        .attr("dx", 10)
        .attr("dy", ".35em")
        .text(function (d, i) {
          return d.name;
        });

      //var onClick = d3utils.selectionUtil(graph.nodes, node, 'fd-circle');

      //node.on('click', onClick);

      force.on("tick", function () {
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      });
      return svg;
    }

    //end of fd graph
    exports.MDSVis = d3utils.defineVis('MDSVis', {
        dim: ['column']
      }, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        var $node = $parent.append("div")
          .classed("d3-scatter-output", true);
        data.data().then(function(mdata){
          //drawMDSGraph($parent, mdata, size);
          return drawFDGraph($parent, mdata, size);
        });
        return $node;
      });

    exports.create = function (data, parent, options) {
      return new exports.MDSVis(data, parent, options);
    };
  }
);
