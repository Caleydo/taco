/**
 * Created by Reem on 6/15/2015.
 */

define(["require", "exports", 'd3', 'jquery'],
  function (require, exports, d3, $) {

    function DifflogParser(diff_file) {
      this.filepath = diff_file;
    }

    DifflogParser.prototype.getDiff = function(){
      var that = this;

      var promise = new Promise(function(resolve, reject){
        d3.json(that.filepath, function (error, data) {
          if (error) reject(error);
          //console.log(" new data ", data);
          if ($.isEmptyObject(data)){
            console.log(data, "is an empty object");
            reject("The two tables are not comparable! No common column.");
          }
          resolve(data);
        });
      });

      return promise;
    };

    exports.create = function(diff_file){
      return new DifflogParser(diff_file);
    };

  });
