/**
 * Created by Reem on 10/23/2015.
 */
define(['exports', '../caleydo_core/vis', './mdsmatrix'], function (exports, vis, mdsmtx) {

  function convertToMatrix(data) {
    //console.log("the data for mds is ", data);
    //todo remove this
    return data;
  }

  exports.create = function (data, parent) {
    var mds_matrix = convertToMatrix(data);
    var v = vis.list(mds_matrix);
    v = v.filter(function (v) {
      return v.id === 'mdsvis';
    })[0];
    return v.load().then(function (plugin) {
      return plugin.factory(mds_matrix, parent, {
        dim: [199,200] //this should be the options or so? //todo pass what you need
      });
    });
  };
});
