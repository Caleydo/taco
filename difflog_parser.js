/**
 * Created by Reem on 6/15/2015.
 */

define(["require", "exports", 'd3'],
  function (require, exports, d3) {
  var filepath = 'data/tiny_table.log';

  var diff_arrays = {
    added_rows : [],
    deleted_rows : [],
    added_cols : [],
    deleted_cols : []
  };

  d3.tsv(filepath, function (data) {
    data.forEach(function(d) {
      /*operation: d.operation,
       type: d.type,
       id: d.id, // TODO: consider that the change operation returns 2 values here
       position: d.position // convert to number use: +d.position*/
      if (d.operation == "add") {
        if (d.type == 'column') {
          diff_arrays.added_cols.push(d.id);
        } else if (d.type == 'row') {
          diff_arrays.added_rows.push(d.id);
        }
      } else if (d.operation == "delete") {
        if (d.type == 'column') {
          diff_arrays.deleted_cols.push(d.id);
        } else if (d.type == 'row') {
          diff_arrays.deleted_rows.push(d.id);
        }
      }
    });

    exports.Diff = diff_arrays;
    //console.log(diff_arrays)
  });
  //the diff_arrays is empty here!
  //console.log(diff_arrays.added_cols, diff_arrays.added_rows, diff_arrays.deleted_cols, diff_arrays.deleted_rows);
});
