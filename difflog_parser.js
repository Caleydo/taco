/**
 * Created by Reem on 6/15/2015.
 */

define(["require", "exports", 'd3'],
  function (require, exports, d3) {

    function DifflogParser(diff_file) {
      this.filepath = diff_file;
    }

    DifflogParser.prototype.getDiff = function(){
      var that = this;

      var promise = new Promise(function(resolve, reject){
        d3.json(that.filepath, function (error, data) {
          if (error) reject(error);
          //console.log(" new data ", data);
          resolve(data);
          //
        });
      });

      return promise;
    };

    exports.create = function(diff_file){
      return new DifflogParser(diff_file);
    };

  });
