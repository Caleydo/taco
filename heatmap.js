/**
 * Created by Reem on 7/23/2015.
 */
define(["require", "exports", 'd3'],
  function (require, exports, d3) {

    //height of each row in the heatmap
    //width of each column in the heatmap
    var gridSize = 4,
      h = gridSize,
      w = gridSize;

    var margin = {top: 10, right: 10, bottom: 10, left: 10};

    var colorMin = 'white', colorMax = 'black';


    //todo to get the min max data values
    function Heatmap(data, row, col, range, pos) {
      this.h_data = data;
      this.width = col.length * w +2;
      this.height = row.length * h +2;

      var dataMax = range[1], dataMin = range[0];
      this.colorScale = d3.scale.linear()
        .domain([dataMin, dataMax])
        .range([colorMin, colorMax]);

      this.xScale = d3.scale.linear()
        .range([0, this.width -2])
        .domain([0,data[0].length]);

      this.yScale = d3.scale.linear()
        .range([0, this.height -2])
        .domain([0,data.length]);

      this.position = pos;
    }

    Heatmap.prototype.get_data = function () {
      return this.h_data;
    };

    exports.Heatmap = Heatmap;

    exports.create = function(data, row, col, range, pos){
      return new Heatmap(data, row, col, range, pos)
    };
    var container;

    Heatmap.prototype.remove = function(){
      container.remove();
    };

    Heatmap.prototype.drawHeatmap = function() {

      var drag = d3.behavior.drag()
        //.on('dragstart', function () {console.log("start")})
        .on('drag', dragHandler);
        //.on('dragend', function () {console.log("end")});

      function dragHandler(d) {
        //must have position absolute to work like this
        //otherwise use transfrom css property
        d3.select(this)
          .style("left", (this.offsetLeft + d3.event.dx) + "px")
          .style("top", (this.offsetTop + d3.event.dy) + "px");
      }

      var that = this;

      var width = parseInt(d3.select("#board").style("width"));

      container = d3.select("#board")
        .append("div") //svg
        .classed("taco-table-container", true)
        .style("width", that.width + margin.left + margin.right + 'px')
        .style("height", that.height + margin.top + margin.bottom + 'px')
        //to shift the table to be at the right end
        .style("transform", "translate(" + (that.position.x>0? that.position.x : width + that.position.x - that.width - margin.right - margin.left) + "px," + that.position.y + "px)")
        .call(drag);

       var root = container.append("div")// g.margin
        .attr("class", "taco-table")
        .style("width", that.width + 'px')
        .style("height", that.height + 'px')
        .style("transform", "translate(" + margin.left + "px," + margin.top + "px)");

      var row = root.selectAll(".taco-row")
        .data(that.h_data)
        .enter()
        .append("div") //svg:rect
        .classed( "taco-row", true);
        //todo think of a better way to show heatmap
        /*.style("left", function (d, i) {
          return ((d.length) * w) + "px";} )
        .style("top", function (d, i) {return ((i+1) * h) + "px";})
        .style("width", function (d) {return w + "px";})
        .style("height", function (d) {return h + "px";})
        .style("background-color", function (d) {return that.colorScale(d.score);});*/

      var col = row.selectAll(".taco-cell")
        .data(function (d,i) { return d.map(function(a) { return {value: a, row: i}; } ) })
        .enter()
        .append("div")
        .classed("taco-cell", true)
        .style("left", function(d, i) { return that.xScale(i) + "px"; })
        .style("top", function(d, i) { return that.yScale(d.row) + "px"; })
        .style("width", that.xScale(1) + "px")
        .style("height", that.yScale(1) + "px")
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
