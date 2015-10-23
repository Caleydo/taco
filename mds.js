/**
 * Created by Reem on 10/23/2015.
 */
define(['exports', '../caleydo_core/vis', '../caleydo_core/table_impl'], function (exports, vis, tables) {

  function convertToMatrix(data) {
    console.log("the data for mds is ", data);
    return data;
  }

  exports.create = function (data, parent) {
    var table = convertToMatrix(data);
    var v = vis.list(table);
    v = v.filter(function (v) {
      return v.id === 'caleydo-vis-lineup';
    })[0];
    return v.load().then(function (plugin) {
      return plugin.factory(table, parent, {
        lineup: {
          renderingOptions: {
            stacked: true
          }
        },
        dump: {
          layout: {
            primary: [{type: 'rank', width: 40}, col('Name', 220), {
              type: 'stacked',
              width: 400,
              children: [col('Structure Add', 100), col('Structure Del', 100), col('Content', 100)]
            }, col('No Change', 100)]
          }
        }
      });
    });
  };
});
