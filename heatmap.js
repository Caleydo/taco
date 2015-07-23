/**
 * Created by Reem on 7/23/2015.
 */
define(["require", "exports", 'd3'],
  function (require, exports, d3) {

    //height of each row in the heatmap
    //width of each column in the heatmap
    var gridSize = 10,
      h = gridSize,
      w = gridSize;

    var margin = {top: 10, right: 40, bottom: 10, left: 20},
      width = 640 - margin.left - margin.right,
      height = 380 - margin.top - margin.bottom;

    var colorMin = 'white', colorMax = 'black';


    //todo to get the min max data values
    function Heatmap(data, row, col) {
      this.h_data = data;
      this.width = col.length * w;
      this.height = row.length * h;

      var dataMax = 10, dataMin = 0;
      this.colorScale = d3.scale.linear()
        .domain([dataMin, dataMax])
        .range([colorMin, colorMax]);

      this.x = d3.scale.linear()
        .range([0, this.width])
        .domain([0,data[0].length]);

      this.y = d3.scale.linear()
        .range([0, this.height])
        .domain([0,data.length]);
    }

    Heatmap.prototype.get_data = function () {
      return this.h_data;
    };

    exports.Heatmap = Heatmap;

    exports.create = function(data, row, col){
      return new Heatmap(data, row, col)
    };

    Heatmap.prototype.drawHeatmap = function() {

      var drag = d3.behavior.drag()
        .on('dragstart', function () {
          console.log("start")
        })
        .on('drag', dragHandler)
        .on('dragend', function () {
          console.log("end")
        });

      function dragHandler(d) {
        //d.x += d3.event.dx;
        //d.y += d3.event.dy;
        //d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");
        d3.select(this)
          .style("transform", "translate(" + (d3.event.x) + "px," + (d3.event.y) + "px)");
        console.log(d3.event, this)
      }

      var that = this;

      var root = d3.select("#board")
        .append("div") //svg
        .classed("taco-table-container", true)
        .style("width", that.width + margin.left + margin.right + 'px')
        .style("height", that.height + margin.top + margin.bottom + 'px')
        .append("div")// g.margin
        .attr("class", "taco-table")
        .style("width", that.width + margin.left + margin.right - 50 + 'px')
        .style("height", that.height + margin.top + margin.bottom - 50 + 'px')
        .style("transform", "translate(" + margin.left + "px," + margin.top + "px)")
        .call(drag);

      var row = root.selectAll(".row")
        .data(that.h_data)
        .enter()
        .append("div") //svg:rect
        .classed( "row", true);
        //todo think of a better way to show heatmap
        /*.style("left", function (d, i) {
          return ((d.length) * w) + "px";} )
        .style("top", function (d, i) {return ((i+1) * h) + "px";})
        .style("width", function (d) {return w + "px";})
        .style("height", function (d) {return h + "px";})
        .style("background-color", function (d) {return that.colorScale(d.score);});*/

      var col = row.selectAll(".cell")
        .data(function (d,i) { return d.map(function(a) { return {value: a, row: i}; } ) })
        .enter()
        .append("div")
        .classed("cell", true)
        .style("left", function(d, i) { return that.x(i) + "px"; })
        .style("top", function(d, i) { return that.y(d.row) + "px"; })
        .style("width", that.x(1) + "px")
        .style("height", that.y(1) + "px")
        .style("background-color", function(d) { return that.colorScale(d.value); });

/*      var heatMap = root.selectAll(".board")
        .data(that.h_data, function (d) { console.log("data", d); return d.col + ':' + d.row;})
        .enter()
        .append("div") //svg:rect
        //todo think of a better way to show heatmap
        .style("left", function (d, i) {
          return ((d.length) * w) + "px";} )
        .style("top", function (d, i) {return ((i+1) * h) + "px";})
        .style("width", function (d) {return w + "px";})
        .style("height", function (d) {return h + "px";})
        .style("background-color", function (d) {return that.colorScale(d.score);});*/
    }
  });
