/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo_web/data', 'd3', 'jquery', './difflog_parser', './diff_heatmap', './heatmap','bootstrap', 'font-awesome'],
  function (data, d3, $, difflog_parser, dHeatmap, Heatmap) {
    'use strict';
    var server_url = "http://192.168.50.52:9000/api/taco/";

    var windows = $('<div>').css('position', 'absolute').appendTo('#main')[0];
    var rows1 = null, rows2= null, cols1= null, cols2= null;

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
        //console.log("selected", selectedDataset.desc.value.range);
        //can use selectedDataset.dim instead of calculating the length in the class
        //todo decide where to draw the table
        var hm = Heatmap.create(data, rows, cols, range);
        hm.drawHeatmap();

        if (dest){
          //todo check if there's something before
          rows2 = rows;
          cols2 = cols;
        }else{
          rows1 = rows;
          cols1 = cols;
        }

        if ( rows1 !== null && cols1 !== null && rows2 !== null && cols2 !== null){
          var toDiffMatrix = dHeatmap.createDiffMatrix(rows1, rows2, cols1, cols2);
          var diff_source = server_url + 'diff_log';
          //var diff_source = 'data/tiny_table1_diff.log';

          var diff_parser = difflog_parser.create(diff_source);

          var h_data = diff_parser.getDiff().then(toDiffMatrix);
          console.log(h_data, "hdata");

          var h = dHeatmap.create(h_data);

          h.drawDiffHeatmap();
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
      //+'<td><input type="radio" name="src"/></td><td><input type="radio" name="dest"/></td>'
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
