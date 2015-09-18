/**
 * Created by Reem and Sam on 9/17/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util'], function (exports, d3, d3utils) {
    //draws the barplot based on the projected data
    function drawDiffBarplot(p_data, parent, dim) {

      var margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
      /*
      var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

      var y = d3.scale.linear()
        .rangeRound([height, 0]);

      var color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(d3.format(".2s"));
      */

      /*
       var container = parent.append("div")
       .classed("chart", true)
       .style("width", width + 2 + margin.left + margin.right + 'px')
       .style("height", height + 2 + margin.top + margin.bottom + 'px')
       //todo find an alternative for margin.top here!! or in the other heatmap (special margin)
       .style("transform", "translate(" + 20 + "px," + margin.top + "px)");
       */

      var x = d3.scale.linear()
        //.domain([0, d3.max(p_data)])
        .domain([0, 50])
        .range([0, 420]);

      var data_map = d3.map(p_data);
      //var data_map = [1,2,3,4,5,6];
      var bp = d3.select(".chart").selectAll("div.rows")
        .data(data_map.values(),function(d,i){console.log(d); return data_map.keys()[i];});

      bp.enter().append("div")
        .classed("rows",true)
        .style("width", function (d) {
          return x(d.count) + "px";
        })
        .text(function (d) {
          return d.pos;
        });

      /*
       var svg = d3.select("body").append("svg")
       .attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom)
       .append("g")
       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

       var root = d3.selectAll("idk").data(p_data).enter();

       color.domain(d3.keys(data[0]).filter(function (key) {
       return key !== "State";
       }));

       data.forEach(function (d) {
       var y0 = 0;
       d.ages = color.domain().map(function (name) {
       return {name: name, y0: y0, y1: y0 += +d[name]};
       });
       d.total = d.ages[d.ages.length - 1].y1;
       });

       data.sort(function (a, b) {
       return b.total - a.total;
       });

       x.domain(data.map(function (d) {
       return d.State;
       }));
       y.domain([0, d3.max(data, function (d) {
       return d.total;
       })]);

       svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);

       svg.append("g")
       .attr("class", "y axis")
       .call(yAxis)
       .append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 6)
       .attr("dy", ".71em")
       .style("text-anchor", "end")
       .text("Population");

       var state = svg.selectAll(".state")
       .data(data)
       .enter().append("g")
       .attr("class", "g")
       .attr("transform", function (d) {
       return "translate(" + x(d.State) + ",0)";
       });

       state.selectAll("rect")
       .data(function (d) {
       return d.ages;
       })
       .enter().append("rect")
       .attr("width", x.rangeBand())
       .attr("y", function (d) {
       return y(d.y1);
       })
       .attr("height", function (d) {
       return y(d.y0) - y(d.y1);
       })
       .style("fill", function (d) {
       return color(d.name);
       });
       */
      return container; //?
    }

    exports.DiffBarPlotVis = d3utils.defineVis('DiffBarPlotVis', {
        dim: 'column'
      }, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        //var $node = $parent.append('pre');
        var $node = $parent;

        console.log("o", o, "desc", data.desc);
        //todo change this so that it consider the case of both rows and cols at the same time
        data.dimStats(data.desc.direction[0]).then(function (stats) {
          //$node.text(JSON.stringify(stats, null, ' '));
          $node = drawDiffBarplot(stats, $parent);
        });
        return $node;
      });

    exports.create = function (data, parent, options) {
      return new exports.DiffBarPlotVis(data, parent, options);
    };
  }
)
;
