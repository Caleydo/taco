/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo_web/data', 'd3', 'jquery', './difflog_parser', './diff_heatmap', 'bootstrap', 'font-awesome'],
  function (data, d3, $, difflog_parser, heatmap) {
  'use strict';
  var windows = $('<div>').css('position', 'absolute').appendTo('#main')[0];

    var diff_arrays = difflog_parser.Diff;
    //console.log(heatmap);

    //heatmap.DiffHeatmap(h_data);
    //heatmap.drawDiffHeatmap();

    var rows1= [1, 2, 3, 4, 5, 6, 7, 8, 9],
      rows2= [12, 1, 2, 3, 4, 5, 10, 6, 7, 8, 11],
      cols1 = [0, 1, 2, 3, 4],
      cols2 = [0, 3, 4],
      dim1 = [9,4], dim2 = [11,3];
    var h_data = heatmap.createDiffMatrix(rows1, rows2, cols1, cols2, diff_arrays);

    heatmap.DiffHeatmap(h_data);
    heatmap.drawDiffHeatmap();

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
    selectedDataset.rows().then(function(data){ console.log("what we got from rows", data)});
    selectedDataset.cols().then(function(data){ console.log("what we got from cols", data)});
    //data.get with the id to access a specific dataset

    selectedDataset.data().then(function(data) {
      console.log(data);
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
    }).on('click',function(d){
      addIt(d);
      var ev = d3.event;
    });
  });

});
