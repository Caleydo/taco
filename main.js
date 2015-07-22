/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo_web/data', 'd3', 'jquery', './difflog_parser', './diff_heatmap', 'bootstrap', 'font-awesome'],
  function (data, d3, $, difflog_parser, dHeatmap) {
    'use strict';
    var server_url = "http://192.168.50.52:9000/api/taco/";

    var windows = $('<div>').css('position', 'absolute').appendTo('#main')[0];

    var rows1 = ["row1", "row2", "row3", "row4", "row5", "row6", "row7", "row8", "row9", "row10", "row11", "row12", "row13", "row14", "row15", "row16", "row17", "row18", "row19", "row20", "row21", "row22", "row23", "row24", "row25", "row26"],
      rows2 = ["row1", "row2", "row3", "row28", "row4", "row29", "row5", "row6", "row27", "row8", "row9", "row10", "row31", "row11", "row12", "row13", "row14", "row30", "row15", "row16", "row17", "row18", "row20", "row21", "row22", "row23", "row24", "row25"],
      cols1 = ["col1", "col2", "col3", "col4", "col5", "col6", "col7", "col8", "col9", "col10", "col11", "col12", "col13", "col14", "col15", "col16", "col17", "col18"],
      cols2 = ["col1", "col22", "col25", "col19", "col2", "col3", "col24", "col4", "col23", "col5", "col7", "col8", "col10", "col21", "col20", "col11", "col12", "col13", "col14", "col15", "col18"];

    var toDiffMatrix = dHeatmap.createDiffMatrix(rows1, rows2, cols1, cols2);
    var diff_source = server_url + 'diff_log';
    //var diff_source = 'data/tiny_table1_diff.log';

    var diff_parser = difflog_parser.create(diff_source);

    var h_data = diff_parser.getDiff().then(toDiffMatrix);
    console.log(h_data, "hdata");

    var h = dHeatmap.create(h_data);

    h.drawDiffHeatmap();

    function toType(desc) {
      if (desc.type === 'vector') {
        return desc.value.type === 'categorical' ? 'partition' : 'numerical';
      }
      return desc.type;
    }

    //from caleydo demo app
    function addIt(selectedDataset) {
      console.log("selected dataset size", selectedDataset.dim);

      //selectedDataset.rows for ids
      Promise.all([selectedDataset.rows(), selectedDataset.cols(), selectedDataset.data()]).then(function (values) {
        var rows = values[0];
        var cols = values[1];
        var data = values[2];
        console.log("selected", rows, cols, data);
      })
    }

    data.list().then(function (items) {
      items = items.filter(function (d) {
        return d.desc.type === 'matrix';
      });
      var $base = d3.select('#blockbrowser table tbody');
      var $rows = $base.selectAll('tr').data(items);
      $rows.enter().append('tr').html(function (d) {
        return '<th>' + d.desc.name + '</th><td>' + toType(d.desc) + '</td><td>' +
          d.idtypes.map(function (d) {
            return d.name;
          }).join(', ') + '</td><td>' + d.dim.join(' x ') + '</td>';
      }).on('click', function (d) {
        addIt(d);
        var ev = d3.event;
      });
    });


  });
