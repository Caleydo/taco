/**
 * Created by Reem on 6/15/2015.
 */
define(["require", "exports", 'd3', 'underscore'],
  function (require, exports, d3, _) {

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

    function DiffHeatmap(data) {
      this.h_data = data;
    }
    DiffHeatmap.prototype.get_data = function () {
      return this.h_data;
    };
    //if we want to have a function here

    exports.create = function(data){
      return new DiffHeatmap(data)
    };

    DiffHeatmap.prototype.drawDiffHeatmap = function(){

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
        .attr("x", function (d) {return d.col * w;})
        .attr("y", function (d) {return d.row * h;})
        .attr("width", function (d) {return w;})
        .attr("height", function (d) {return h;})
        .style("fill", function (d) {return colorScale(d.score);})
        .style("stroke","rgb(0,0,0)");
    };

    exports.createDiffMatrix = function(rows1, rows2, cols1, cols2, diff_arrays){

      var row_ids = _.union(rows1, rows2);
      console.log("uni", row_ids);
      var col_ids = _.union(cols1, cols2);
      console.log("uni cols", col_ids);

      console.log("diff arrays ", diff_arrays);
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

      //console.log('access diff matrix', diffById(diff_matrix, 1,0));

      //todo: change the parse int
      diff_arrays.then(function(data){
        console.log("i have no idea", data);
        data.added_rows.forEach(function(e, i, arr){
          if (row_ids.indexOf(parseInt(e)) != -1) {
            console.log("found an added row", parseInt(e));
            col_ids.forEach(function(col, j, cols){
              //console.log("diff by id!", diffById(diff_matrix, parseInt(e),parseInt(col)));
              diffById(diff_matrix, parseInt(e),parseInt(col)).score = 2;
              //console.log("diff by id2!", diffById(diff_matrix, parseInt(e),parseInt(col)));
            });
          }
        });
        data.deleted_rows.forEach(function(e, i, arr){
          if (row_ids.indexOf(parseInt(e)) != -1) {
            console.log("found a deleted row", parseInt(e));
            col_ids.forEach(function(col, j, cols){
              diffById(diff_matrix, parseInt(e),parseInt(col)).score = -2;
            });
          }
        });
        data.added_cols.forEach(function(e, i, arr){
          if (col_ids.indexOf(parseInt(e)) != -1) {
            console.log("found an added cols", parseInt(e));
            row_ids.forEach(function(row, j, rows){
              diffById(diff_matrix, parseInt(row), parseInt(e)).score = 2;
            });
          }
        });
        data.deleted_cols.forEach(function(e, i, arr){
          if (col_ids.indexOf(parseInt(e)) != -1) {
            console.log("found a deleted cols", parseInt(e));
            row_ids.forEach(function(row, j, rows){
              diffById(diff_matrix,parseInt(row), parseInt(e)).score = -2;
            });
          }
        });

      }).catch(function(e){
        console.log("seems so");
      });

      //console.log("diff matrix", diff_matrix);
      return diff_matrix.values();
    };

  });
