/**
 * Created by Reem on 10/23/2015.
 */
//noinspection Annotator
define(['exports', '../caleydo_core/main', '../caleydo_core/datatype'], function (exports, C, datatypes) {

  exports.MDSMatrix = datatypes.defineDataType('mdsmatrix', {
    init: function (desc) {
      //init function
      //var direction_id = (desc.direction.length == 1? (desc.direction[0] == 'rows'? 0 : 1) : 2);
      //this.diff_source = C.server_url + '/taco/diff_log/' + desc.id1 +'/' + desc.id2 + '/' + desc.detail + "/" + direction_id + "/" + desc.change;

      this._cache = null;
    },
    data: function() {
      if (this._cache != null) {
        return this._cache;
      }
      //todo call the server for mds matrix?
      var mds_data = require('./data.json'); //todo change this
      console.log(mds_data);

      //store result in cache
      this._cache = mds_data;
      return mds_data;
    }
  });

  exports.create = function (desc) {
    return new exports.MDSMatrix(desc);
  };
});
