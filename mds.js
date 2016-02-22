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
          name: 'name',
          value: {type: 'string'},
          getter: function (d) {
            return d.desc.name;
          }
        },
        {
          name: 'id',
          value: {type: 'string'},
          getter: function (d) {
            return d.desc.id;
          }
        },
        {
          name: 'node',
          value: {type: 'matrix'},
          getter: function (d) {
            return d;
          }
        }
      ]
    }, data, 'name');
  }

  exports.create = function (data, parent, options) {
    var mds_nodes_table = convertToTable(data.nodes);
    var v = vis.list(mds_nodes_table);
    v = v.filter(function (v) {
      return v.id === 'mdsvis';
    })[0];
    return v.load().then(function (plugin) {
      return plugin.factory(mds_nodes_table, parent, {
        dim: [199,200], //this should be the options or so? //todo pass what you need
        links: data.pos, //the array of x,y coordinates we get from python
        dispatcher: options.dispatcher
      });
    });
  };
});
