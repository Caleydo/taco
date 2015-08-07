/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo_core/data', 'd3', 'jquery', './difflog_parser', './diff_heatmap', './heatmap','bootstrap', 'font-awesome'],
  function (data, d3, $, difflog_parser, dHeatmap, Heatmap) {
    'use strict';
    var server_url = "http://192.168.50.52:9000/api/taco/";

    var windows = $('<div>').css('position', 'absolute').appendTo('#main')[0];
    var rows1 = null, rows2= null, cols1= null, cols2= null, id1= null, id2= null,
      hm1= null, hm2 = null, dh = null;

    function toType(desc) {
      if (desc.type === 'vector') {
        return desc.value.type === 'categorical' ? 'partition' : 'numerical';
      }
      return desc.type;
    }

    //from caleydo demo app
    //@dest 1 a destination table, 0 a source table
    function addIt(selectedDataset, dest) {
      //selectedDataset.rows for ids
      Promise.all([selectedDataset.rows(), selectedDataset.cols(), selectedDataset.data()]).then(function (values) {
        var rows = values[0];
        var cols = values[1];
        var data = values[2];
        var range = selectedDataset.desc.value.range;
        var x_margin = 10, y_margin = 10;

        if (dest){
          if (hm2 !== null){
            hm2.remove();
            hm2 = null;
          }
          //can use selectedDataset.dim instead of calculating the length in the class
          //todo decide where to draw the table
          hm2 = Heatmap.create(data, rows, cols, range, {x: -x_margin, y: y_margin});
          hm2.drawHeatmap();

          rows2 = rows;
          cols2 = cols;
          id2 = selectedDataset.desc.id;
        }else{
          if (hm1 !== null){
            hm1.remove();
            hm1 = null;
          }
          hm1 = Heatmap.create(data, rows, cols, range, {x: x_margin, y:y_margin});
          hm1.drawHeatmap();
          rows1 = rows;
          cols1 = cols;
          id1 = selectedDataset.desc.id;
        }

        if ( rows1 !== null && cols1 !== null && rows2 !== null && cols2 !== null && id1 !== null && id2!==null){
          var diff_source = server_url + 'diff_log/' + id1 +'/' + id2 ;
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
