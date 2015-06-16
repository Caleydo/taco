/**
 * Created by Reem on 6/15/2015.
 */
define(["require", "exports", 'd3', 'underscore'],
  function (require, exports, d3, _) {

    var DiffHeatmap = (function () {
      function DiffHeatmap(data) {
        this.h_data = data;
      //}
      //DiffHeatmap.prototype.get_data = function () {
      //  return this.h_data;
      };
      //if we want to have a function here
      //ok i think i need a getter here


      return DiffHeatmap;
      })();
    exports.DiffHeatmap = DiffHeatmap;

    //height of each row in the heatmap
    //width of each column in the heatmap
    var gridSize = 16,
      h = gridSize,
      w = gridSize,
      rectPadding = 60;

    var colorDeleted = 'red', colorLow = 'yellow', colorMed = 'white', colorHigh = 'blue', colorAdded = 'green';

    var margin = {top: 20, right: 80, bottom: 30, left: 50},
      width = 640 - margin.left - margin.right,
      height = 380 - margin.top - margin.bottom;

    var colorScale = d3.scale.linear()
      .domain([-2, -1, 0, 1, 2])
      .range([colorDeleted, colorLow, colorMed, colorHigh, colorAdded]);

    var drawDiffHeatmap = function(){

      var svg = d3.select("#board")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var heatMap = svg.selectAll(".board")
        .data(this.h_data, function (d) {return d.col + ':' + d.row;})
        .enter()
        .append("svg:rect")
        .attr("x", function (d) {return d.row * w;})
        .attr("y", function (d) {return d.col * h;})
        .attr("width", function (d) {return w;})
        .attr("height", function (d) {return h;})
        .style("fill", function (d) {return colorScale(d.score);})
        .style("stroke","rgb(0,0,0)");
    };
    exports.drawDiffHeatmap = drawDiffHeatmap;

    var createDiffMatrix = function(ids1, ids2, dim1, dim2, diff_arrays){

      var k1 = [1,2,4],
        k2 = [2,3,4];

      var idk = _.union(k1,k2);
      console.log(idk);

    };
    exports.createDiffMatrix = createDiffMatrix;

  });
