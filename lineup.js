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
      size: [data.length, 5],
      columns: [
        {
          name: 'Name',
          value: {type: 'string'},
          getter: function (d) {
            return d.name;
          }
        }, {
          name: 'Version',
          value: {type: 'string'},
          getter: function (d) {
            return d.date;
          }
        }, {
          name: 'Structure Add',
          cssClass: 'struct-add-color',
          value: {
            type: 'real',
            //todo is it possible to get the max of all the columns?
            //range: d3.extent(data, function (d) {
            //  return d.stadd;
            //})
            range: [0,100]
          },
          getter: function (d) {
            return d.stadd;
          }
        }, {
          name: 'Structure Del',
          cssClass: 'struct-del-color',
          value: {
            type: 'real',
            //range: d3.extent(data, function (d) {
            //  return d.stdel;
            //})
            range: [0,100]
          },
          getter: function (d) {
            return d.stdel;
          }
        }, {
          name: 'Content',
          cssClass: 'content-change-color',
          value: {
            type: 'real',
            //range: d3.extent(data, function (d) {
            //  return d.cont;
            //})
            range: [0,100]
          },
          getter: function (d) {
            return d.cont;
          }
        }, {
          name: 'No Change',
          color: '#999999',
          value: {
            type: 'real',
            //range: d3.extent(data, function (d) {
            //  return d.noch;
            //})
            range: [0,100]
          },
          getter: function (d) {
            return d.noch;
          }
        }
      ]
    }, data, 'name');
  }

  function col(name, width) {
    return {column: name, width: width};
  }

  exports.create = function (data, parent) {
    var table = convertToTable(data);
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
            primary: [
              {
                type: 'selection',
                label: 'S'
              },
              {
                type: 'rank',
                width: 40
              },
              col('Name', 220),
              col('Version', 220),
              {
                type: 'stacked',
                width: 400,
                children: [col('Structure Add', 100), col('Structure Del', 100), col('Content', 100)]
              },
              col('No Change', 100)
            ]
          }
        }
      });
    });
  };
});
