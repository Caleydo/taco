/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo/data', 'd3', 'jquery', '../caleydo/event', '../caleydo-selectioninfo/main', '../caleydo/idtype', 'bootstrap', 'font-awesome'], function (data, d3, $, events, idtypes, links) {
  'use strict';
  //var info = selectionInfo.create(document.getElementById('selectioninfo'));
  //var board = boards.create(document.getElementById('board'));

  function toType(desc) {
    if (desc.type === 'vector') {
      return desc.value.type === 'categorical' ? 'partition' : 'numerical';
    }
    return desc.type;
  }

  data.list().then(function (items) {
    items = items.filter(function (d) {
      return d.desc.type === 'matrix';
    });
    var $base = d3.select('#blockbrowser table tbody');
    var $rows = $base.selectAll('tr').data(items);
    $rows.enter().append('tr').html(function (d) {
      return '<th>' + d.desc.name + '</th><td>' + toType(d.desc) + '</td><td>' +
        d.idtypes.map(function (d) { return d.name; }).join(', ') + '</td><td>' + d.dim.join(' x ') + '</td>';
    }).attr('draggable', true)
      .on('dragstart', function (d) {
        var e = d3.event;
        e.dataTransfer.effectAllowed = 'copy'; //none, copy, copyLink, copyMove, link, linkMove, move, all
        e.dataTransfer.setData('text/plain', d.desc.name);
        e.dataTransfer.setData('application/json', JSON.stringify(d.desc));
        var p = JSON.stringify(d.persist());
        e.dataTransfer.setData('application/caleydo-data-item', p);
        //encode the id in the mime type
        e.dataTransfer.setData('application/caleydo-data-item-' + p, p);
        //board.currentlyDragged = d;
      });
  });
});
