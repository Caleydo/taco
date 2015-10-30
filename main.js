/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo_core/data', 'd3', 'jquery', '../caleydo_core/vis', '../caleydo_core/main', '../caleydo_core/multiform', 'underscore', 'toastr', 'bootstrap-slider', './drag', './lineup', './mds', 'bootstrap', 'font-awesome'],
  function (data, d3, $, vis, C, multiform, _, toastr, Slider, drag, lineup, mds) {
    'use strict';

    var windows = $('<div>').css('position', 'absolute').appendTo('#main')[0];
    var data_provider = data;
    var rows1 = null, rows2= null, cols1= null, cols2= null, id1= null, id2= null,
        ds1 = null, ds2 = null, dh = null;
    var heatmap1 = null, heatmap2 = null;
    var myDrag = drag.Drag();

    var gridSize = 6;
    var test_items,
      settings_change = [],
      settings_direction = [],
      settings_detail = 4;


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
      var heatmapplugin;
      if (selectedDataset.desc.type  === 'matrix'){
        heatmapplugin = vis.list(selectedDataset).filter(function(d) { return d.id.match(/.*heatmap.*/); })[0];
        //heatmapplugin = vis.list(selectedDataset).filter(function(d) { return d.id.match(/.*histogram.*/); })[0];

      } else if (selectedDataset.desc.type === 'table'){
        heatmapplugin = vis.list(selectedDataset).filter(function(d) { return d.id.match(/.*table.*/); })[0];
        toastr.warning("Visualization for tables might not perform as expected!!");
        //todo find the difference between the visualziatoin for tables and martrices and handle this here.
      }

      if (heatmapplugin !== undefined) {

        // selectedDataset.data() to get the data
        Promise.all([selectedDataset.rows(), selectedDataset.cols(), heatmapplugin.load()])
          .then(function (values) {
            var rows = values[0];
            var cols = values[1];
            var plugin = values[2];

            if (dest) {
              if (heatmap2 !== null) {
                heatmap2.destroy();
              }
              //can use selectedDataset.dim instead of calculating the length in the class
              //todo decide where to draw the table
              heatmap2 = plugin.factory(selectedDataset, document.getElementById('test'), {
                initialScale: gridSize
              });
              d3.select("#test").call(myDrag);

              rows2 = rows;
              cols2 = cols;
              id2 = selectedDataset.desc.id;
              ds2 = selectedDataset;
            } else {
              if (heatmap1 !== null) {
                heatmap1.destroy();
              }
              heatmap1 = plugin.factory(selectedDataset, document.getElementById('test2'), {
                initialScale: gridSize
              });
              d3.select("#test2").call(myDrag);
              rows1 = rows;
              cols1 = cols;
              id1 = selectedDataset.desc.id;
              ds1 = selectedDataset;
            }

            if (id1 !== null && id2 !== null) {
              //checking the basic type matches
              if (ds1.desc.type !== ds2.desc.type) {
                //bad
                toastr.error("The types are not matching " + ds1.desc.type + " " + ds2.desc.type, 'Datatype mismatch!');
              } else
              //checking matrix idtype matches
              if (ds1.desc.type === 'matrix' && (ds1.desc.rowtype !== ds2.desc.rowtype || ds1.desc.coltype !== ds2.desc.coltype)) {
                //bad
                toastr.error("The matrices have different row or col type " + ds1.desc.rowtype + " " + ds2.desc.rowtype + " " + ds1.desc.coltype + " " + ds2.desc.coltype,
                  'Row or Column Mismatch!', {closeButton: true});
              } else if (ds1.desc.type === 'table' && (ds1.desc.idtype !== ds2.desc.idtype)) {
                //bad
                toastr.error("Tables have different idtypes");
              } else
              //check value datatype of matrix
              if (ds1.desc.type === 'matrix' && (ds1.desc.value.type !== ds2.desc.value.type)) {
                //bad
              } else {
                //everything is comparable
                //todo move this to else if
                //TODO check values/columns for table
                settings_change = [];
                $("[name='change[]']:checked").each(function() {
                    settings_change.push(this.value);
                });

                settings_direction = [];
                $("[name='direction[]']:checked").each(function() {
                    settings_direction.push(this.value);
                });

                console.log("detailll", settings_detail);
                settings_detail = $('#detail-slider').val()

                data_provider.create({
                  type: 'diffstructure',
                  name: ds1.desc.name + '-' + ds2.desc.name,
                  id1: id1,
                  id2: id2,
                  change: settings_change,
                  direction: settings_direction,
                  detail: settings_detail,
                  size: [_.union(rows1, rows2).length, _.union(cols1, cols2).length] //we can use dummy values instead
                }).then(function (diffmatrix) {
                  //diffmatrix
                  if (rows1 !== null && cols1 !== null && rows2 !== null && cols2 !== null) {
                    if (dh !== null) {
                      dh.destroy();
                      dh.node.remove();
                      //remove the old multiform selector
                      d3.select('#taco-mf-selector').html('');
                    }
                    dh = multiform.create(diffmatrix, d3.select('#board').node(), {'diffplotvis':{dim: settings_direction}});
                    multiform.addSelectVisChooser(d3.select('#taco-mf-selector').node(), dh);
                    d3.select('#taco-mf-selector select').classed('form-control', true);
                    /*var visses = vis.list(diffmatrix);
                    var diffheatmap = visses[0];
                    diffheatmap.load().then(function (plugin) {
                      //here we call my diff_heatmap
                      dh = plugin.factory(diffmatrix, d3.select('#board').node());
                    });
                    visses[1].load().then(function (plugin) {
                      //here we call my diff_barplot
                      plugin.factory(diffmatrix, d3.select('#board').node());
                    });
                    */
                  } else {
                    console.log("no diff!", rows1, cols1, rows2, cols2);
                  }
                });
              }
            } else {
              toastr.info("Please select a second table");
            }
          })
      }else{
        toastr.error("heat map plugin is undefined for this dataset!!");
      }
    }

    data_provider.list().then(function (items) {
      items = items.filter(function (d) {
        return d.desc.type === 'matrix';//&& d.desc.fqname.match(/.*taco.*/);
        //return d.desc.type  === 'matrix' || d.desc.type === 'table';
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

      //preparing a fixed test table for lineup and mds
      test_items = items.filter(function (d) {
        return d.desc.fqname.match(/.*multiple.*/);
      });

      //MDS part
      //creating the data
      calcGraphData(test_items)
        .then(showMDS);

      // static test data
      //calcLineupData(test_items[0], test_items)
      //  .then(showLineup);
    });

    //$("[name='detail']").change(function () {
    //    console.log("changed this ", $(this).val());
    //});

    $("[name='change[]']").change(function () {
      var matches = [];
      $("[name='change[]']:checked").each(function() {
          matches.push(this.value);
      });
      if ($("[name='change[]']:checked").length === 0) {
        // some sort of validation to make sure that there's at least one change type selected
        toastr.warning("You have to select at least one change type!", "I will select " + $(this).val() + " for you");
        matches.push(this.value);
        console.log("i will select this for you", $(this).val(), matches);
        $('#' + this.id).prop('checked', true);
        $('#' + this.id).parents('label').toggleClass('active');
      }
      console.log("changed this ", $(this).val(), matches);
    });


    $("[name='direction[]']").change(function () {
      var matches = [];
      $("[name='direction[]']:checked").each(function() {
        matches.push(this.value);
      });
      if ($("[name='direction[]']:checked").length === 0) {
        // some sort of validation to make sure that there's at least one direction selected
        toastr.warning("You have to select at least one direction!", "I will select " + $(this).val() + " for you");
        matches.push(this.value);
        console.log("i will select this for you", $(this).val(), matches);
        $('#' + this.id).prop('checked', true);
        $('#' + this.id).parents('label').toggleClass('active');
      }

      console.log("changed this ", $(this).val(), matches);
    });

    // slider for bootstrap
    // With JQuery
    var detail_slider = $('#detail-slider').slider({
      ticks: [0, 2, 4],
      ticks_labels: ['Overview', 'Middle', 'Detail']
    });

    // flexbox part
    // select all DOM nodes (e.g. links) with class="expand-column"
    d3.selectAll('.expand-column').on('click', function() {
      var $this = d3.select(this);
      expandView($this);
      detail_slider.slider('setValue', parseInt($this.attr('data-slider-value')));
    });

    var expandView = function(t){
      // use data attribute or if does not exists href from link
        var expand = t.attr('data-expand-column') || t.attr('href'),
        collapse = t.attr('data-collapse-column'),
        only = t.attr('data-expand-only');

      if (expand !== undefined) {
        // remove expand class from all other nodes if this should be the only one
        if (only === 'true') {
          d3.selectAll('.flex-column.expand').classed('expand', false);
        }
        d3.select(expand).classed('expand', true);
      }
      if (collapse !== undefined) {
        d3.select(collapse).classed('expand', false);
      }
    };

/*     $('#dsSlider').on('slide', function (ev) {
       console.log("slider", $('#detail-slider').val(), this);
     });*/
    $('#detail-slider').on('change', function (ev) {
      d3.selectAll('.flex-column.expand').classed('expand', false);
      switch(ev.value.newValue){
        case 0:
          d3.select('#overview').classed('expand', true);
          break;
        case 1:
          d3.select('#overview').classed('expand', true);
          d3.select('#middle').classed('expand', true);
          break;
        case 2:
          d3.select('#middle').classed('expand', true);
          break;
        case 3:
          d3.select('#middle').classed('expand', true);
          d3.select('#detail').classed('expand', true);
          break;
        case 4:
          d3.select('#detail').classed('expand', true);
          break;
        default:
          d3.select('#overview').classed('expand', true);
      }
    });

    //Line Up part

    function showLineup(lineup_data) {
      var lineup_instance = lineup.create(lineup_data, document.querySelector('#lineup'));
      lineup_instance.then(function(instance){
        //console.log("line up instance", instance);
        instance.data.on('select-selected', function(event, range) {
          console.log(range.dim(0).asList());
        })
      })
    }

    // assuming tha the reference table is the full object (not just the ID!)
    function calcLineupData(ref_table, lineup_items){
      return Promise.all(lineup_items.map(function(e, index, arr){
        if (e.desc.id !== ref_table.desc.id){
          return data_provider.create({
              type: 'diffstructure',
              name: ref_table.desc.name + '-' + e.desc.name,
              id1: ref_table.desc.id,
              id2: e.desc.id,
              //change: settings_change,
              change: "structure,content",
              direction: settings_direction,
              //detail: settings_detail,
              //detail: $('#detail-slider').val(), //todo use this
              detail: 4, //because we are aggregating in the client for now but we should just get the result from the server
              size: e.desc.size //we can use dummy values instead
            }).then(function (diffmatrix) {
              return Promise.all([diffmatrix.nochangeRatio(), diffmatrix.contentRatio(), diffmatrix.structAddRatio(), diffmatrix.structDelRatio()]).then(function(dm_data){
                var noch = dm_data[0].ratio * 100;
                var cont = dm_data[1].ratio * 100;
                var stadd = dm_data[2].ratio * 100;
                var stdel = dm_data[3].ratio * 100;
                return {
                  name: e.desc.name,
                  noch: noch,
                  cont: cont,
                  stadd: stadd,
                  stdel: stdel
                };
              });
            });
        }else{
          //it's the reference table
          return {
            name: e.desc.name,
            noch: 0,
            cont: 0,
            stadd: 0,
            stdel: 0
          };
        }
      }));
    }

    function calcGraphData(datalist){
      return data_provider.create({
        type: 'diffstructure',
        name: datalist[0].desc.name + '-orso',
        datalist: datalist,
        change: "structure,content",
        direction: settings_direction,
        //detail: $('#detail-slider').val(), //todo use this
        detail: 0, //the key point
        size: datalist.length //we can use dummy values instead
      }).then(function (diffmatrix) {
        return diffmatrix.data().then(function(dm_data){
          var graph_nodes = [];
          datalist.forEach(function(e, i, arr){
            graph_nodes.push({name: e.desc.name});
          });
          return{
            links: dm_data,
            nodes: graph_nodes
          };
          //return dm_data;
        });
      });
    }

    //drawing MDS
    function showMDS(mdata){
      var mds_instance = mds.create(mdata, document.querySelector('#mds-graph'));
      mds_instance.then(function(instance){
        console.log("instance", instance);
      });
    }

  });
