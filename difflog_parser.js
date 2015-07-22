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
        ch_cells: []
      };
    }

    DifflogParser.prototype.getDiff = function(){
      var that = this;

      var promise = new Promise(function(resolve, reject){
        d3.tsv(that.filepath, function (error, data) {
          if (error) reject(error);
          data.forEach(function (d) {
            /*operation: d.operation,
             type: d.type,
             id: d.id, // TODO: consider that the change operation returns 2 values here
             position: d.position // convert to number use: +d.position*/
            if (d.operation === "add") {
              if (d.type === 'column') {
                that.diff_arrays.added_cols.push(d.id);
              } else if (d.type === 'row') {
                that.diff_arrays.added_rows.push(d.id);
              }
            } else if (d.operation === "delete") {
              if (d.type === 'column') {
                that.diff_arrays.deleted_cols.push(d.id);
              } else if (d.type === 'row') {
                that.diff_arrays.deleted_rows.push(d.id);
              }
            } else if (d.operation === "change" && d.type === 'cell'){
              //we assume that the id is separated by comma ,
              var cell = d.id.split(",");
              that.diff_arrays.ch_cells.push({row: cell[0], col: cell[1], diff_data: d.data});
            }
          });
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
