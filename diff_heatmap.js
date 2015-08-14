/**
 * Created by Reem on 6/15/2015.
 */
define(["require", "exports", 'd3', 'underscore'],
  function (require, exports, d3, _) {

    //height of each row in the heatmap
    //width of each column in the heatmap
    var gridSize = 6,
      h = gridSize,
      w = gridSize;

    var margin = {top: 10, right: 10, bottom: 10, left: 10};

    var colorDeleted = 'red', colorLow = 'yellow', colorMed = 'white', colorHigh = 'blue', colorAdded = 'green';

    var colorScale = d3.scale.linear()
      .domain([-2, -1, 0, 1, 2])
      .range([colorDeleted, colorLow, colorMed, colorHigh, colorAdded]);

    function DiffHeatmap(data, rows1, rows2, cols1, cols2) {
      this.h_data = data;

      this.row_ids = _.union(rows1, rows2);
      this.col_ids = _.union(cols1, cols2);

      console.log("uni cols", this.col_ids);
      console.log("uni rows", this.row_ids);

      this.height = this.row_ids.length * h;
      this.width  = this.col_ids.length * w;

      this.container;

      /*
      this.xScale = d3.scale.linear()
        .range([0, this.width])
        .domain([0,data[0].length]);

      this.yScale = d3.scale.linear()
        .range([0, this.height])
        .domain([0,data.length]);*/
    }

    DiffHeatmap.prototype.get_data = function () {
      return this.h_data;
    };

    DiffHeatmap.prototype.remove = function(){
      this.container.remove();
    };

    DiffHeatmap.prototype.drawDiffHeatmap = function(){

      var drag = d3.behavior.drag()
        //.on('dragstart', function() { console.log("start") })
        .on('drag', dragHandler);
        //.on('dragend', function() { console.log("end") });

      //todo to use just the one in heatmap
      function dragHandler(d) {
        //must have position absolute to work like this
        //otherwise use transfrom css property
        d3.select(this)
          .style("left", (this.offsetLeft + d3.event.dx) + "px")
          .style("top", (this.offsetTop + d3.event.dy) + "px");
      }

      var that = this;
      that.h_data.then(function(data) {
        //todo create this as the size of the final table at the beginning?
        var position = parseInt( parseInt(d3.select("#board").style("width"))/2)- margin.left - parseInt(that.width/2);

        //console.log( 'data len', data);
        that.container = d3.select("#board")
          .append("div") //svg
          .classed("taco-table-container", true)
          .style("width", that.width +2 + margin.left + margin.right+'px')
          .style("height", that.height +2 + margin.top + margin.bottom+'px')
          //todo find an alternative for margin.top here!! or in the other heatmap (special margin)
          .style("transform", "translate(" + position + "px," + margin.top + "px)")
          .call(drag);
        var root = that.container.append("div")// g.margin
          .attr("class", "taco-table")
          .style("width", that.width +2 +'px')
          .style("height", that.height +2 +'px')
          .style("transform", "translate(" + margin.left + "px," + margin.top + "px)")
          //todo move this to the css
          .style("background-color", "white");

        //visualizing the diff
        var addedRows = root.selectAll(".taco-added-row")
          .data(data.added_rows)
          .enter()
          .append("div")
          .attr("class", "taco-added-row")
          .style("left",  0 + "px")
          .style("top", function (d) {
            //var y = that.row_ids.indexOf(d);
            var y = d.pos;
            return (y !== -1? y * h : null) + "px";
          })
          .style("width", that.width + "px")
          .style("height", h + "px")
          .style("background-color",  colorAdded);

        var addedCols = root.selectAll(".taco-added-col")
          .data(data.added_cols)
          .enter()
          .append("div")
          .attr("class", "taco-added-col")
          .style("top",  0 + "px")
          .style("left", function (d) {
            //var x = that.col_ids.indexOf(d);
            var x = d.pos;
            return (x !== -1? x * w : null) + "px";
          })
          .style("width", w + "px")
          .style("height", that.height + "px")
          .style("background-color",  colorAdded);

        var deletedRows = root.selectAll(".taco-del-row")
          .data(data.deleted_rows)
          .enter()
          .append("div")
          .attr("class", "taco-del-row")
          .style("left",  0 + "px")
          .style("top", function (d) {
            //var y = that.row_ids.indexOf(d);
            var y = d.pos;
            return (y !== -1? y * h : null) + "px";
          })
          .style("width", that.width + "px")
          .style("height", h + "px")
          .style("background-color",  colorDeleted);

        var deletedCols = root.selectAll(".taco-del-col")
          .data(data.deleted_cols)
          .enter()
          .append("div")
          .attr("class", "taco-del-col")
          .style("top",  0 + "px")
          .style("left", function (d) {
            //var x = that.col_ids.indexOf(d);
            var x = d.pos;
            return (x !== -1? x * w : null) + "px";
          })
          .style("width", w + "px")
          .style("height", that.height + "px")
          .style("background-color",  colorDeleted);

        //todo think of a better way for normalization
        var diff_max = 0;
        data.ch_cells.forEach(function (e, i, arr) {
            diff_max = (Math.abs(e.diff_data)> diff_max ? Math.abs(e.diff_data) : diff_max);
          }
        );

        var chCells = root.selectAll(".taco-ch-cell")
          .data(data.ch_cells)
          .enter()
          .append("div")
          .attr("class", "taco-ch-cell")
          .style("top",  function (d) {
            //var y = that.row_ids.indexOf(d.row);
            var y = d.rpos;
            return (y !== -1? y * h : null) + "px";
          })
          .style("left", function (d) {
            //var x = that.col_ids.indexOf(d.col);
            var x = d.cpos;
            return (x !== -1? x * w : null) + "px";
          })
          .style("width", w + "px")
          .style("height", h + "px")
          .style("background-color",  function(d){ return colorScale(normalize(d.diff_data, diff_max));} );
      })
    };

    function normalize(diff_data, max){
      return diff_data/max
    }

    exports.DiffHeatmap = DiffHeatmap;

    exports.create = function(data, rows1, rows2, cols1, cols2){
      return new DiffHeatmap(data, rows1, rows2, cols1, cols2)
    };

  });
