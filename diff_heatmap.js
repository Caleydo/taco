/**
 * Created by Reem on 6/15/2015.
 */
define(["require", "exports", 'd3', 'underscore', '../caleydo_core/d3util'],
  function (require, exports, d3, _, d3utils) {

    //height of each row in the heatmap
    //width of each column in the heatmap
    var gridSize = 6,
      h = gridSize,
      w = gridSize;

    var margin = {top: 10, right: 10, bottom: 10, left: 10};

    var colorDeleted = 'red', colorLow = 'yellow', colorMed = 'white', colorHigh = 'blue', colorAdded = 'green',
      colorMerged = '#B2DF8A',//light green
      colorSplit = '#FB9A99'; //light red

    var colorScale = d3.scale.linear()
      .domain([-2, -1, 0, 1, 2])
      .range([colorDeleted, colorLow, colorMed, colorHigh, colorAdded]);

    function DiffHeatmap(data, dim) {
      this.h_data = data;

      console.log("uni cols", this.col_ids);
      console.log("uni rows", this.row_ids);

      this.width  = dim[1] * w;
      this.height = dim[0] * h;

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
      //todo create this as the size of the final table at the beginning?
      var that = this;
      var position = parseInt( parseInt(d3.select("#board").style("width"))/2)- margin.left - parseInt(that.width/2);

      //console.log( 'data len', data);
      this.container = d3.select("#board")
        .append("div") //svg
        .classed("taco-table-container", true)
        .style("width", that.width +2 + margin.left + margin.right+'px')
        .style("height", that.height +2 + margin.top + margin.bottom+'px')
        //todo find an alternative for margin.top here!! or in the other heatmap (special margin)
        .style("transform", "translate(" + position + "px," + margin.top + "px)")
        .call(drag);


      that.h_data.then(function(data) {

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

        var mergedRows = root.selectAll(".taco-mer-row")
          .data(data.merged_rows)
          .enter()
          .append("div")
          .attr("class", "taco-mer-row")
            //todo use the merge_id
          .style("left",  0 + "px")
          .style("top", function (d) {
            //var y = that.row_ids.indexOf(d);
            var y = d.pos;
            return (y !== -1? y * h : null) + "px";
          })
          .style("width", that.width + "px")
          .style("height", h + "px")
          .style("background-color",  function(d){return (d.is_merge ? colorMerged : colorSplit)});

        var mergedCols = root.selectAll(".taco-mer-col")
          .data(data.merged_cols)
          .enter()
          .append("div")
          .attr("class", "taco-mer-col")
            //todo use the merge_id
          .style("top",  0 + "px")
          .style("left", function (d) {
            //var x = that.col_ids.indexOf(d);
            var x = d.pos;
            return (x !== -1? x * w : null) + "px";
          })
          .style("width", w + "px")
          .style("height", that.height + "px")
          .style("background-color",  function(d){
            return (d.is_merge ? colorMerged : colorSplit)
          });

        console.log("merged cols", data.merged_cols);
        console.log("merged rows", data.merged_rows);
        console.log("split cols", data.split_cols);
        console.log("split rows", data.split_rows);
        //todo split rows and columns

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

    exports.DiffHeatmapVis = d3utils.defineVis('DiffHeatmapVis', {

        }
        , function (data) {
          return [data.desc.size[0] *w, data.desc.size[1]*h];
        }, function ($parent, data, size) { //build the vis
          var o = this.options;
          var diff = new DiffHeatmap(data.data(), data.desc.size);
          diff.drawDiffHeatmap();
          return diff.container;
        });

    exports.createDiff = function (data, parent, options) {
      return new exports.DiffHeatmapVis(data, parent, options);
    };

    exports.create = function(data, size){
      return new DiffHeatmap(data, size)
    };

  });
