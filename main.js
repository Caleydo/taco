/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo_core/data', 'd3', 'jquery', './difflog_parser', './diff_heatmap', './heatmap', '../caleydo_core/vis', '../caleydo_core/main','bootstrap', 'font-awesome'],
  function (data, d3, $, difflog_parser, dHeatmap, Heatmap, vis, C) {
    'use strict';

    var windows = $('<div>').css('position', 'absolute').appendTo('#main')[0];
    var rows1 = null, rows2= null, cols1= null, cols2= null, id1= null, id2= null,
      hm1= null, hm2 = null, dh = null;
    var heatmap1 = null, heatmap2 = null;

    var gridSize = 6,
      h = gridSize,
      w = gridSize;

    function toType(desc) {
      if (desc.type === 'vector') {
        return desc.value.type === 'categorical' ? 'partition' : 'numerical';
      }
      return desc.type;
    }

    //todo move this to a shared file between all those heatmap things!
    var drag = d3.behavior.drag()
      //.on('dragstart', function () {console.log("start")})
      .on('drag', dragHandler);
    //.on('dragend', function () {console.log("end")});

    function dragHandler(d) {
      //must have position absolute to work like this
      //otherwise use transfrom css property
      d3.select(this)
        .style("left", (this.offsetLeft + d3.event.dx) + "px")
        .style("top", (this.offsetTop + d3.event.dy) + "px");
    }

    //from caleydo demo app
    //@dest 1 a destination table, 0 a source table
    function addIt(selectedDataset, dest) {
      //selectedDataset.rows for ids

      var heatmapplugin = vis.list(selectedDataset).filter(function(d) { return d.id.match(/.*heatmap.*/); })[0];
      //var heatmapplugin = vis.list(selectedDataset).filter(function(d) { return d.id.match(/.*histogram.*/); })[0];

      Promise.all([selectedDataset.rows(), selectedDataset.cols(), selectedDataset.data(), heatmapplugin.load()]).then(function (values) {
        var rows = values[0];
        var cols = values[1];
        var data = values[2];
        var plugin = values[3];
        var range = selectedDataset.desc.value.range;
        var x_margin = 10, y_margin = 10;

        if (dest){
          if (hm2 !== null){
            hm2.remove();
            heatmap2.node.remove();
            hm2 = null;
          }
          //can use selectedDataset.dim instead of calculating the length in the class
          //todo decide where to draw the table
          hm2 = Heatmap.create(data, rows, cols, range, {x: -x_margin, y: y_margin});
          hm2.drawHeatmap();
          heatmap2 = plugin.factory(selectedDataset, document.getElementById('test'), {
            initialScale: gridSize
          });
          d3.select("#test").call(drag);

          rows2 = rows;
          cols2 = cols;
          id2 = selectedDataset.desc.id;
        }else{
          if (hm1 !== null){
            hm1.remove();
            heatmap1.node.remove();
            hm1 = null;
          }
          hm1 = Heatmap.create(data, rows, cols, range, {x: x_margin, y:y_margin});
          hm1.drawHeatmap();
          heatmap1 = plugin.factory(selectedDataset, document.getElementById('test2'), {
            initialScale: gridSize
          });
          d3.select("#test2").call(drag);
          rows1 = rows;
          cols1 = cols;
          id1 = selectedDataset.desc.id;
        }

        if ( rows1 !== null && cols1 !== null && rows2 !== null && cols2 !== null && id1 !== null && id2!==null){
          var diff_source = C.server_url + '/taco/diff_log/' + id1 +'/' + id2 ;
          //var diff_source = 'data/tiny_table1_diff.log';

          //call the server for diff
          //todo get the name of the selected tables
          var diff_parser = difflog_parser.create(diff_source);

          //var toDiffMatrix = dHeatmap.createUnionTable(rows1, rows2, cols1, cols2);
          var h_data = diff_parser.getDiff();
          console.log(h_data, "hdata");

          if (dh !== null){
            dh.remove();
          }
          dh = dHeatmap.create(h_data, rows1, rows2, cols1, cols2);

          dh.drawDiffHeatmap();
        }else{
          console.log("no diff!", rows1, cols1, rows2, cols2);
        }
      })
    }

    data.list().then(function (items) {
      items = items.filter(function (d) {
        return d.desc.type === 'matrix';
      });
      var $base = d3.select('#blockbrowser table tbody');
      var $rows = $base.selectAll('tr').data(items);
      var $tr = $rows.enter().append('tr').html(function (d) {
        return '<th>' + d.desc.name + '</th><td>' + toType(d.desc) + '</td><td>' +
          d.idtypes.map(function (d) {
            return d.name;
          }).join(', ') + '</td><td>' + d.dim.join(' x ') + '</td>';
      });
      $tr.append('td').append('input').attr('type', 'radio')
        .attr('name', 'src')
        .on('click', function (d) {
        addIt(d, 0);
        var ev = d3.event;
      });
      $tr.append('td').append('input').attr('type', 'radio')
        .attr('name', 'dest')
        .on('click', function (d) {
        addIt(d, 1);
        var ev = d3.event;
      });
    });


  });
