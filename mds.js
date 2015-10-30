/**
 * Created by Reem on 10/23/2015.
 */
define(['exports', '../caleydo_core/vis', '../caleydo_core/table_impl'], function (exports, vis, tables) {

  function convertToTable(data) {
    return tables.wrapObjects({
      id: '_taco_list',
      name: 'Taco MDS Data',
      type: 'table',
      rowtype: '_taco_dataset',
      size: [data.length, 3],
      columns: [
        {
          name: 'source',
          value: {type: 'string'},
          getter: function (d) {
            return d.source;
          }
        },
        {
          name: 'target',
          value: {type: 'string'},
          getter: function (d) {
            return d.target;
          }
        },
        {
          name: 'no change value',
          value: {
            type: 'real',
            range: d3.extent(data, function (d) {
              return d.value;
            })
          },
          getter: function (d) {
            return d.value;
          }
        }
      ]
    }, data, 'name');
  }

  exports.create = function (data, parent) {
    var mds_table = convertToTable(data.links);
    var v = vis.list(mds_table);
    v = v.filter(function (v) {
      return v.id === 'mdsvis';
    })[0];
    return v.load().then(function (plugin) {
      return plugin.factory(mds_table, parent, {
        dim: [199,200], //this should be the options or so? //todo pass what you need
        nodes: data.nodes //how can I draw a FORCE directed graph without nodes?
      });
    });
  };
});
