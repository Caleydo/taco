/**
 * Created by Reem on 02/20/2016.
 */
define(['exports', '../caleydo_core/vis', '../caleydo_core/table_impl'], function (exports, vis, tables) {

  function convertToTable(data) {
    return tables.wrapObjects({
      id: '_taco_list',
      name: 'Taco Middle Data',
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
          name: 'matrix',
          value: {type: 'matrix'},
          getter: function (d) {
            return d;
          }
        }
      ]
    }, data, 'name');
  }

  exports.create = function (data, parent) {
    var middle_table = convertToTable(data.items);
    var v = vis.list(middle_table);
    v = v.filter(function (v) {
      return v.id === 'diff2dhistvis';
    })[0];
    return v.load().then(function (plugin) {
      return plugin.factory(middle_table, parent, {
        dataset: data.dataset,
        dim: data.settings_direction,
        change: data.settings_change, //because i want to handle this only on the client for now
        bins: data.setting_bins,
        name: data.name
      });
    });
  };
});
