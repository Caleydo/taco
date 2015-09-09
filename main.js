/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo_core/data', 'd3', 'jquery', './diff_heatmap', './heatmap', '../caleydo_core/vis', '../caleydo_core/main','bootstrap', 'font-awesome'],
  function (data, d3, $, dHeatmap, Heatmap, vis, C) {
    'use strict';

    var windows = $('<div>').css('position', 'absolute').appendTo('#main')[0];
    var data_provider = data;
    var rows1 = null, rows2= null, cols1= null, cols2= null, id1= null, id2= null,
        ds1 = null, ds2 = null,
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
            heatmap2.destroy();
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
          ds2 = selectedDataset;
        }else{
          if (hm1 !== null){
            hm1.remove();
            heatmap1.destroy();
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
          ds1 = selectedDataset;
        }

        if (id1 !== null && id2 !== null) {
          //checking the basic type matches
          if (ds1.desc.type !== ds2.desc.type) {
            //bad
          }
          //checking matrix idtype matches
          if (ds1.desc.type === 'matrix' && (ds1.desc.rowtype !== ds2.desc.rowtype || ds1.desc.coltype !== ds2.desc.coltype)) {
            //bad
          }
          if (ds1.desc.type === 'table' && (ds1.desc.idtype !== ds2.desc.idtype)) {
            //bad
          }
          //check value datatype of matrix
          if (ds1.desc.type === 'matrix' && (ds1.desc.value.type !== ds2.desc.value.type)) {
            //bad
          }
          //TODO check values/columns for table

          data_provider.create({
              type: 'diffstructure',
              name: ds1.desc.name+'-'+ds2.desc.name,
              id1: id1,
              id2: id2,
              size: [_.union(rows1, rows2).length, _.union(cols1, cols2).length] //we can use dummy values instead
          }).then(function(diffmatrix) {
            //diffmatrix
            if ( rows1 !== null && cols1 !== null && rows2 !== null && cols2 !== null){
              if (dh !== null){
                dh.destroy();
              }
              var diffheatmap = vis.list(diffmatrix)[0];
              diffheatmap.load().then(function(plugin) {
                //here we call my diff_heatmap
                dh = plugin.factory(diffmatrix, d3.select('#board').node());
              });
              //dh = dHeatmap.create(diffmatrix.data(), rows1, rows2, cols1, cols2);

              //dh.drawDiffHeatmap();
            } else{
              console.log("no diff!", rows1, cols1, rows2, cols2);
            }
          });
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
