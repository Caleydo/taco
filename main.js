/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo/data', 'd3', 'jquery', '../caleydo/event', '../caleydo/idtype', '../caleydo-window/main', '../caleydo/main', '../caleydo/multiform', 'bootstrap', 'font-awesome'], function (data, d3, $, events, idtypes, window, C, multiform) {
  'use strict';
  var windows = $('<div>').css('position', 'absolute').appendTo('#main')[0];

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

  var filepath = 'data/tiny_table.log';

  var added_rows, deleted_rows, added_cols, deleted_cols = [];

  var rows = d3.tsv(filepath, function (dataset) {
    dataset.forEach(function(d) {
      return {
       operation: d.operation,
       type: d.type,
       id: d.id, // TODO: consider that the change operation returns 2 values here
       position: d.position // convert to number use: +d.position
       };
    });
  });

 console.log(rows);
  /*
  if (d.operation == "add") {
    if (d.type == 'column') {
      added_cols.push(d.id);
      console.log("1");
    } else if (d.type == 'row') {
      added_rows.push(d.id);
      console.log("2");
    }
  } else if (d.operation == "delete") {
    if (d.type == 'column') {
      deleted_cols.push(d.id);
      console.log("3");
    } else if (d.type == 'row') {
      deleted_rows.push(d.id);
      console.log("4");
    }
  }*/
  //console.log(added_cols, added_rows, deleted_cols, deleted_rows);
});
