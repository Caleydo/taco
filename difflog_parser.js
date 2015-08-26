/**
 * Created by Reem on 6/15/2015.
 */

define(["require", "exports", 'd3'],
  function (require, exports, d3) {

    function DifflogParser(diff_file) {
      this.filepath = diff_file;
      this.diff_arrays = {
        added_rows: [],
        deleted_rows: [],
        added_cols: [],
        deleted_cols: [],
        merged_rows: [],
        split_rows: [],
        merged_cols: [],
        split_cols: [],
        ch_cells: []
      };
    }

    DifflogParser.prototype.getDiff = function(){
      var that = this;
      //so far we use the same counter for both columns and rows (it doesn't matter)
      var merge_id = 0;
      var split_id = 0;

      var promise = new Promise(function(resolve, reject){
        d3.tsv(that.filepath, function (error, data) {
          if (error) reject(error);
          data.forEach(function (d) {
            //we assume that the id is separated by comma ,
            var log_separator = ",";
            /*operation: d.operation,
             type: d.type,
             id: d.id,
             position: d.position // convert to number use: +d.position*/
            if (d.operation === "add") {
              if (d.type === 'column') {
                that.diff_arrays.added_cols.push({id: d.id, pos: +d.position});
              } else if (d.type === 'row') {
                that.diff_arrays.added_rows.push({id: d.id, pos: +d.position});
              }
            } else if (d.operation === "delete") {
              if (d.type === 'column') {
                that.diff_arrays.deleted_cols.push({id: d.id, pos: +d.position});
              } else if (d.type === 'row') {
                that.diff_arrays.deleted_rows.push({id: d.id, pos: +d.position});
              }
            } else if (d.operation === "merge") {
              var ids = d.id.split(log_separator); //the first one is the merge one!
              var pos = d.position.split(log_separator).map(Number);
              ids.forEach(function (value,index){
                if (d.type === 'column') {
                  that.diff_arrays.merged_cols.push({id: value, pos: pos[index], merge_id: merge_id, is_merge:(index == 0)});
                } else if (d.type === 'row') {
                  that.diff_arrays.merged_rows.push({id: value, pos: pos[index], merge_id: merge_id, is_merge:(index == 0)});
                }
              });
              //increment the merge id
              merge_id++;
            } else if (d.operation === "split") {
              var ids = d.id.split(log_separator); //the first one is the merge one!
              var pos = d.position.split(log_separator).map(Number);
              ids.forEach(function (value,index){
                if (d.type === 'column') {
                  that.diff_arrays.split_cols.push({id: value, pos: pos[index], split_id: merge_id, is_split:(index == 0)});
                } else if (d.type === 'row') {
                  that.diff_arrays.split_rows.push({id: value, pos: pos[index], split_id: merge_id, is_split:(index == 0)});
                }
              });
              //increment the split id
              split_id++;
            } else if (d.operation === "change" && d.type === 'cell'){
              var cell = d.id.split(log_separator);
              var pos = d.position.split(log_separator);
              that.diff_arrays.ch_cells.push({row: cell[0], col: cell[1], diff_data: d.data, rpos: +pos[0], cpos: +pos[1]});
            }
          });
          console.log(that.diff_arrays);
          resolve(that.diff_arrays);
          //
        });
      });

      return promise;
    };

    exports.create = function(diff_file){
      return new DifflogParser(diff_file);
    };

  });
