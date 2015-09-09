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
      .domain([-1, 0, 1])
      .range([colorLow, colorMed, colorHigh]);

    function DiffHeatmap(data) {
      this.h_data = data;
      //todo check if this is correct or should be removed!
      this.container = d3.select("#board")
        .append("div")
        .classed("taco-table-container", true);
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

      that.h_data.then(function(data) {
        var height = data.union.ur_ids.length * h;
        var width = data.union.uc_ids.length * w;
        var position = parseInt( parseInt(d3.select("#board").style("width"))/2)- margin.left - parseInt(width/2);

        that.container
          .style("width", width +2 + margin.left + margin.right+'px')
          .style("height", height +2 + margin.top + margin.bottom+'px')
          //todo find an alternative for margin.top here!! or in the other heatmap (special margin)
          .style("transform", "translate(" + position + "px," + margin.top + "px)")
          .call(drag);

        var root = that.container.append("div")// g.margin
          .attr("class", "taco-table")
          .style("width", width +2 +'px')
          .style("height", height +2 +'px')
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
          .style("width", width + "px")
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
          .style("height", height + "px")
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
          .style("width", width + "px")
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
          .style("height", height + "px")
          .style("background-color",  colorDeleted);

        //todo think of a better way for normalization
        var diff_max = 0;
        data.ch_cells.forEach(function (e, i, arr) {
            diff_max = (Math.abs(e.diff_data)> diff_max ? Math.abs(e.diff_data) : diff_max);
          }
        );

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
          .style("height", height + "px")
          .style("background-color",  function(d){
            return d.is_added ? colorMerged : colorSplit
          })
          .style("z-index", function(d){return d.is_added ? "0" : "1"});

        var mergedRows = root.selectAll(".taco-mer-row")
          .data(data.merged_rows)
          .enter()
          .append("div")
          .attr("class", "taco-mer-row")
          .style("zIndex", function(d){ return d.is_merge ? "0" : "1"})
          //todo use the merge_id
          .style("left",  0 + "px")
          .style("top", function (d) {
            //var y = that.row_ids.indexOf(d);
            var y = d.pos;
            return (y !== -1? y * h : null) + "px";
          })
          .style("width", width + "px")
          .style("height", h + "px")
          .style("background-color",  function(d){return d.is_added ? colorMerged : colorSplit})
          .style("z-index", function(d){ return d.is_added ? "0" : "1"});

        var splitCols = root.selectAll(".taco-spl-col")
          .data(data.split_cols)
          .enter()
          .append("div")
          .attr("class", "taco-spl-col")
          .style("z-index", function(d){ return d.is_added ? "0" : "1"})
          //todo use the merge_id
          .style("top",  0 + "px")
          .style("left", function (d) {
            //var x = that.col_ids.indexOf(d);
            var x = d.pos;
            return (x !== -1? x * w : null) + "px";
          })
          .style("width", w + "px")
          .style("height", height + "px")
          .style("background-color",  function(d){
            return (d.is_added ? colorMerged : colorSplit)
          });

        var splitRows = root.selectAll(".taco-spl-row")
          .data(data.split_rows)
          .enter()
          .append("div")
          .attr("class", "taco-spl-row")
          .style("z-index", function(d){ return d.is_added ? "0" : "1"})
          //todo use the merge_id
          .style("left",  0 + "px")
          .style("top", function (d) {
            //var y = that.row_ids.indexOf(d);
            var y = d.pos;
            return (y !== -1? y * h : null) + "px";
          })
          .style("width", width + "px")
          .style("height", h + "px")
          .style("background-color",  function(d){return (d.is_added ? colorMerged : colorSplit)});

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

    //helper function
    function normalize(diff_data, max){
      return diff_data/max
    }

    exports.DiffHeatmap = DiffHeatmap;

    exports.create = function(data){
      return new DiffHeatmap(data);
    };

    //data, parent, options
    // defineVis(name, defaultOptions, initialSize, build, functions)
    exports.DiffHeatmapVis = d3utils.defineVis('DiffHeatmapVis', {

      }, function (data) {
          return [data.desc.size[0] *w, data.desc.size[1]*h]; //this is not really critical
      }, function ($parent, data, size) { //build the vis
          //data.data().then(function(d){console.log("size from data", d.union.uc_ids.length, d.union.ur_ids.length)});
          var o = this.options;
          //var diff = new DiffHeatmap(data.data(), data.desc.size); //use the union size from the server instead of the client
          var diff = new DiffHeatmap(data.data());
          diff.drawDiffHeatmap();
          return diff.container;
    });

    exports.createDiff = function (data, parent, options) {
      return new exports.DiffHeatmapVis(data, parent, options);
    };

  });
