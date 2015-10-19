/**
 * Created by sam on 24.02.2015.
 */
define(['exports', '../caleydo_core/vis', '../caleydo_core/table_impl'], function (exports, vis, tables) {

  function convertToTable(data) {
    return tables.wrapObjects({
      id: '_taco_list',
      name: 'Taco LineUp Data',
      type: 'table',
      rowtype: '_taco_dataset',
      size: [data.length, 3],
      columns: [
        {
          name: 'Name',
          value: {type: 'string'},
          getter: function (d) { return d.name; }
        }, {
          name: 'Structure',
          value: {
            type: 'real',
            range: d3.extent(data, function (d) { return d.a; })
          },
          getter: function (d) { return d.a; }
        }, {
          name: 'Content',
          value: {
            type: 'real',
            range: d3.extent(data, function (d) { return d.b; })
          },
          getter: function (d) { return d.b; }
        }
      ]
    }, data, 'name');
  }

  function col(name, width) {
    return { column: name,  width: width };
  }

  exports.create = function(data, parent) {
    var table = convertToTable(data);
    var v = vis.list(table);
    v = v.filter(function (v) { return v.id === 'caleydo-vis-lineup';})[0];
    return v.load().then(function (plugin) {
      return plugin.factory(table, parent, {
        dump: {
          layout: {
            primary: [{ type: 'rank', width: 40 }, col('Name', 220), col('Structure', 100), col('Content', 100)]
          }
        }
      });
    });
  };
});
