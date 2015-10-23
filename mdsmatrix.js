/**
 * Created by Reem on 10/23/2015.
 */
//noinspection Annotator
define(['exports', '../caleydo_core/main', '../caleydo_core/datatype'], function (exports, C, datatypes) {

  exports.MDSMatrix = datatypes.defineDataType('mdsmatrix', {
    init: function (desc) {
      //init function
      this.url = C.server_url + '/taco/mds';
      //this.url = './mdsdata.json';

      this._cache = null;
    },
    data: function () {
      if (this._cache != null) {
        return this._cache;
      }
      var that = this;
      var promise = new Promise(function (resolve, reject) {
        d3.json(that.url, function (error, mdata) {
          if (error) reject(error);
          //todo call the server for mds matrix?
          //store result in cache
          that._cache = mdata;
          resolve(mdata);
        });
      });
      return promise;
    }
  });

  exports.create = function (desc) {
    return new exports.MDSMatrix(desc);
  };
});
