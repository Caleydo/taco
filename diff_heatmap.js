/**
 * Created by Reem on 6/15/2015.
 */
define(["require", "exports", 'd3'],
  function (require, exports, d3) {


    var h_data = [
      {score: 1.5, row: 0, col: 0},
      {score: 0.7, row: 0, col: 1},
      {score: -1.2, row: 1, col: 0},
      {score: 0.0, row: 1, col: 1},
      {score: 0.1, row: 2, col: 0},
      {score: 0.4, row: 2, col: 1},
      {score: 2.0, row: 0, col: 2},
      {score: -1.8, row: 1, col: 2},
      {score: 0.6, row: 2, col: 2}
    ];
    

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

    var svg = d3.select("#board")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    exports.heatMap = svg.selectAll(".board")
      .data(h_data, function (d) {return d.col + ':' + d.row;})
      .enter()
      .append("svg:rect")
      .attr("x", function (d) {return d.row * w;})
      .attr("y", function (d) {return d.col * h;})
      .attr("width", function (d) {return w;})
      .attr("height", function (d) {return h;})
      .style("fill", function (d) {return colorScale(d.score);});

  });
