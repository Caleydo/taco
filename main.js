/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo/data', 'd3', 'jquery', './difflog_parser', 'bootstrap', 'font-awesome'],
  function (data, d3, $, difflog_parser) {
  'use strict';
  var windows = $('<div>').css('position', 'absolute').appendTo('#main')[0];

    var diff_arrays = difflog_parser.Diff;

  function toType(desc) {
    if (desc.type === 'vector') {
      return desc.value.type === 'categorical' ? 'partition' : 'numerical';
    }
    return desc.type;
  }

  //from caleydo demo app
  function addIt(selectedDataset) {
    console.log(selectedDataset);

    //selectedDataset.rows for ids
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
