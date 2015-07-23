/**
 * Created by Reem on 6/15/2015.
 */
define(["require", "exports", 'd3', 'underscore'],
  function (require, exports, d3, _) {

    //height of each row in the heatmap
    //width of each column in the heatmap
    var gridSize = 10,
      h = gridSize,
      w = gridSize;

    var margin = {top: 10, right: 40, bottom: 10, left: 20},
      width = 640 - margin.left - margin.right,
      height = 380 - margin.top - margin.bottom;

    var colorDeleted = 'red', colorLow = 'yellow', colorMed = 'white', colorHigh = 'blue', colorAdded = 'green';

    var colorScale = d3.scale.linear()
      .domain([-2, -1, 0, 1, 2])
      .range([colorDeleted, colorLow, colorMed, colorHigh, colorAdded]);

    function DiffHeatmap(data) {
      this.h_data = data;
      this.width = width;
      this.height = height;
    }
    DiffHeatmap.prototype.get_data = function () {
      return this.h_data;
    };
    //if we want to have a function here
    exports.DiffHeatmap = DiffHeatmap;

    exports.create = function(data){
      return new DiffHeatmap(data)
    };

    DiffHeatmap.prototype.drawDiffHeatmap = function(){

      var drag = d3.behavior.drag()
        .on('dragstart', function() { console.log("start") })
        .on('drag', dragHandler)
        .on('dragend', function() { console.log("end") });

      function dragHandler(d) {
        //d.x += d3.event.dx;
        //d.y += d3.event.dy;
        //d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");
        d3.select(this)
          .style("transform", "translate(" + (d3.event.x) + "px," + (d3.event.y) + "px)");
        console.log(d3.event, this)}

      var that = this;
      that.h_data.then(function(data) {
        //todo create this as the size of the final table at the beginning?
        console.log( 'data len', data.length);
        var root = d3.select("#board")
          .append("div") //svg
          .classed("taco-table-container", true)
          .style("width", that.width + margin.left + margin.right+'px')
          .style("height", that.height + margin.top + margin.bottom+'px')
          .append("div")// g.margin
          .attr("class", "taco-table")
          .style("width", that.width + margin.left + margin.right- 50 +'px')
          .style("height", that.height + margin.top + margin.bottom- 50 +'px')
          .style("transform", "translate(" + margin.left + "px," + margin.top + "px)")
          .call(drag);

        var heatMap = root.selectAll(".board")
          .data(data, function (d) {return d.col + ':' + d.row;})
          .enter()
          .append("div") //svg:rect
          //todo think of a better way to show heatmap
          .style("left", function (d) {return (parseInt(d.col.substring(3)) * w) + "px";})
          .style("top", function (d) {return (parseInt(d.row.substring(3)) * h) + "px";})
          .style("width", function (d) {return w + "px";})
          .style("height", function (d) {return h + "px";})
          .style("background-color", function (d) {return colorScale(d.score);});
      })
    };

    exports.createDiffMatrix = function(rows1, rows2, cols1, cols2){

      var row_ids = _.union(rows1, rows2);
      console.log("uni", row_ids);
      var col_ids = _.union(cols1, cols2);
      console.log("uni cols", col_ids);

      this.height = row_ids.length;
      this.width = col_ids.length;

      //console.log("diff arrays ", diff_arrays);
      //todo: are the ids always a number? how to merge then?
      var default_value = 0;
      var delimiter = ':';

      function makeArray(row_ids, col_ids, val) {
        var list = d3.map();
        row_ids.forEach(function(row_e, row_index, row_array){
          col_ids.forEach(function(col_e, col_index, col_array){
            //todo: this will draw later based on int ids
            list.set(row_e+delimiter+col_e, {score: val, row:row_e, col:col_e});
          });
        });
        return list;
      }

      function diffById(diffm, row, col) {
        return diffm.get(row+delimiter+col);
      }

      var diff_matrix = makeArray( row_ids, col_ids, default_value);

      function normalize(diff_data, max){
        return diff_data/max
      }

      function convertData(data) {
        data.added_rows.forEach(function(e, i, arr){
          if (row_ids.indexOf(e) != -1) {
            col_ids.forEach(function(col, j, cols){
              diffById(diff_matrix, e,col).score = 2;
            });
          }
        });
        data.added_cols.forEach(function(e, i, arr){
          if (col_ids.indexOf(e) != -1) {
            row_ids.forEach(function(row, j, rows){
              diffById(diff_matrix, row, e).score = 2;
            });
          }
        });
        data.deleted_rows.forEach(function(e, i, arr){
          if (row_ids.indexOf(e) != -1) {
            col_ids.forEach(function(col, j, cols){
              diffById(diff_matrix, e,col).score = -2;
            });
          }
        });
        data.deleted_cols.forEach(function(e, i, arr){
          if (col_ids.indexOf(e) != -1) {
            row_ids.forEach(function(row, j, rows){
              diffById(diff_matrix,row, e).score = -2;
            });
          }
        });
        //todo think of a better way for normalization
        var diff_max = 0;
        data.ch_cells.forEach(function (e, i, arr) {
          diff_max = (Math.abs(e.diff_data)> diff_max ? Math.abs(e.diff_data) : diff_max);
          }
        );
        data.ch_cells.forEach(function (e, i, arr) {
            diffById(diff_matrix, e.row, e.col).score = normalize(e.diff_data, diff_max); //todo change it after calcualting it
          }
        );

        return diff_matrix.values();
      }

      return convertData;
    };

  });
