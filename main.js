/**
 * Created by Reem on 5/13/2015.
 * based on what is
 * Created by Samuel Gratzl on 15.12.2014.
 */

require(['../caleydo_core/data', 'd3', 'jquery', '../caleydo_core/vis', '../caleydo_core/main', '../caleydo_core/behavior',
  '../caleydo_core/idtype', '../caleydo_core/multiform', './diffmatrix', 'underscore', 'toastr', 'bootstrap-slider',
  '../caleydo_d3/d3util', './lineup', './mds', 'bootstrap', 'font-awesome'],
  function (data, d3, $, vis, C, behavior,
            idtypes, multiform, diffm, _, toastr, Slider,
            d3utils, lineup, mds) {
    'use strict';

    var taco_dispatcher = d3.dispatch('show_detail', 'resized_flex_column', 'change_type_removed', 'change_type_added', 'modify_direction', 'update_color', 'drew_diffheatmap');

    // @see http://stackoverflow.com/a/9090128/940219
    function transitionEndEventName () {
      var i,
        undefined,
        el = document.createElement('div'),
        transitions = {
          'transition':'transitionend',
          'OTransition':'otransitionend',  // oTransitionEnd in very old Opera
          'MozTransition':'transitionend',
          'WebkitTransition':'webkitTransitionEnd'
        };

      for (i in transitions) {
        if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
          return transitions[i];
        }
      }
      //TODO: throw 'TransitionEnd event is not supported in this browser';
    }

    var transitionEnd = transitionEndEventName();
    d3.selectAll('.flex-column').on(transitionEnd, function() {
      d3.event.stopPropagation();
      if(d3.event.target !== d3.event.currentTarget) {
        return false;
      }
      // caution: this listener is only triggered for .flex-columns where an .expand class was added/removed
      // other columns might change the width at the same time, but do not trigger this listener
      var $column = d3.select(this);
      taco_dispatcher.resized_flex_column($column.attr('id'), parseInt($column.style('width')), $column);
    });

    taco_dispatcher.on('resized_flex_column.2', function(col_id, width, $column) {
      console.log('resizing heatmaps?', col_id, width, $column);
      // TODO apply this only on opening or changing but not on closing
      // middle reference table
      if (mid_hm)
        resize_heatmap(mid_hm, heatmapplugin);

      var cell_height = 1, cell_width = 1;

      if (dh){
        var scaleX = (dh.$node.node().getBoundingClientRect().width) / dh.options.gridSize[0];
        var new_width = dh.$node.node().getBoundingClientRect().width;
        var new_height = dh.$node.node().getBoundingClientRect().height;
        cell_height = (union_rows ? new_height/union_rows : 1);
        cell_width = (union_cols ? new_width/union_cols : 1);
        console.log("diff heatmap:", scaleX);
        if (scaleX > 2){
          //todo remove this part if u want good performance but not good quality
          // this is only good for taking screenshots without a thick border or stretched items :|
          /*
          dh.destroy();
          dh.node.remove();
          var plugin = storage.diff_heatmap.plugin;
          dh = plugin.factory(storage.diff_heatmap.diffmatrix, storage.diff_heatmap.diffparent,
            // optimal would be to find the smallest scaling factor
            {gridSize: [new_width, new_height],
            colorDomain: [min_color, max_color],
            taco_dispatcher: taco_dispatcher}
          );
          */
          d3.select(".taco-table").style("transform-origin", "0 0").style("transform", "scaleX(" + scaleX + ")");
        }else if (scaleX > 0){
          d3.select(".taco-table").style("transform-origin", "0 0").style("transform", "scaleX(" + scaleX + ")");
        } else{
          console.log(" no scaling is needed");
        }
        //storage.diff_heatmap.diffmatrix.data().then(function(data){
        //    var w = new_width / data.union.uc_ids.length;
        //    dh.$node.select('.taco-table').selectAll('div').each(function(d) {
        //      var $cell = d3.select(this);
        //      $cell.style('width', w + 'px');
        //    });
        //  });

        //dh.$node.style("transform-origin", "0 0").style("transform", "scaleX(" + scaleX + ")"); //too wide!
      }

      // src heatmap
      if (heatmap1)
        resize_heatmap_by_cell_height(heatmap1, heatmapplugin, cell_height, cell_width);
      // dest heatmap
      if (heatmap2)
        resize_heatmap_by_cell_height(heatmap2, heatmapplugin, cell_height, cell_width);
    });

    taco_dispatcher.on('drew_diffheatmap', function(r_size, height, c_size, width){
      var cell_height =  height / r_size,
        cell_width = width / c_size;
      // src heatmap
      if (heatmap1)
        resize_heatmap_by_cell_height(heatmap1, heatmapplugin, cell_height, cell_width);
      // dest heatmap
      if (heatmap2)
        resize_heatmap_by_cell_height(heatmap2, heatmapplugin, cell_height, cell_width);
    });

    taco_dispatcher.on('modify_direction.2', function(d_s_list) {
      console.log('direction settings list', d_s_list);
    });

    taco_dispatcher.on('change_type_removed.2', function(unselected) {
      console.log('change_type_removed', unselected);
    });

    taco_dispatcher.on('change_type_added.2', function(selected) {
      console.log('change_type_added', selected);
    });

    /******************************* GLOBAL VARIABLES *****************************************/
    //var windows = $('<div>').css('position', 'absolute').appendTo('#main')[0];
    var data_provider = data;
    var rows1 = null, rows2 = null, cols1 = null, cols2 = null, id1 = null, id2 = null,
      ds1 = null, ds2 = null, dh = null;
    var heatmap1 = null, heatmap2 = null;

    var gridSize = 6,
      setting_bins = 20,
      setting_bins_col = 20; //just a default value
    var test_items,
      settings_change = [],
      settings_direction = [],
      settings_detail = 4;

    //session storage
    var storage = {};

    var heatmapplugin;
    var union_rows = 0,
      union_cols = 0; // because we want to scale the heatmaps and we need to know how many rows we have at maximum

    // initializing the settings from the buttons in the nav bar
    $("[name='change[]']:checked").each(function () {
      settings_change.push(this.value);
    });

    $("[name='direction[]']:checked").each(function () {
      settings_direction.push(this.value);
    });

    settings_detail = $('#detail-slider').val();

    // vis instances
    var lineup_instance = null,
      mds_instance = null,
      mid_hm = null; // the heatmap in the middle view

    //todo change it to be the ref table
    var first_selected = 0;


    function toType(desc) {
      if (desc.type === 'vector') {
        return desc.value.type === 'categorical' ? 'partition' : 'numerical';
      }
      return desc.type;
    }

    //from caleydo demo app
    //@param: dest 1 a destination table, 0 a source table
    function addIt(selectedDataset, dest) {
      //selectedDataset.rows for ids
      if (selectedDataset.desc.type === 'matrix') {
        heatmapplugin = vis.list(selectedDataset).filter(function (d) {
          return d.id.match(/.*heatmap.*/);
        })[0];
        //heatmapplugin = vis.list(selectedDataset).filter(function(d) { return d.id.match(/.*histogram.*/); })[0];

      } else if (selectedDataset.desc.type === 'table') {
        heatmapplugin = vis.list(selectedDataset).filter(function (d) {
          return d.id.match(/.*table.*/);
        })[0];
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
              heatmap2 = plugin.factory(selectedDataset, document.getElementById('dest-heatmap'), {
                initialScale: gridSize,
                color: ['white', 'black']
              });
              resize_heatmap(heatmap2, heatmapplugin);
              //(new behavior.ZoomLogic(heatmap2, heatmapplugin)).zoomSet(0.5,2);
              d3.select('#dest-title-name').text(selectedDataset.desc.name +" ("+ getVersion(selectedDataset) + ")");

              rows2 = rows;
              cols2 = cols;
              id2 = selectedDataset.desc.id;
              ds2 = selectedDataset;
            } else {
              if (heatmap1 !== null) {
                heatmap1.destroy();
              }
              heatmap1 = plugin.factory(selectedDataset, document.getElementById('src-heatmap'), {
                initialScale: gridSize,
                color: ['white', 'black']
              });
              //(new behavior.ZoomLogic(heatmap1, heatmapplugin)).zoomSet(2,2);
              resize_heatmap(heatmap1, heatmapplugin);
              //heatmap1.parent.parentElement.getBoundingClientRect()
              d3.select('#src-title-name').text(selectedDataset.desc.name +" ("+ getVersion(selectedDataset) + ")");
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
                //TODO check values/columns for table

                create_diff_heatmap(ds1,ds2);
              }
            } else {
              toastr.info("Please select a second table");
            }
          })
      } else {
        toastr.error("heat map plugin is undefined for this dataset!!");
      }
    }

    /******************************************************************************************/
    /********************************* Dataset selection **************************************/
    /******************************************************************************************/
    function filter_list(d) {
      return d.desc.type === 'matrix';//&& d.desc.fqname.match(/.*taco.*/);
      //return d.desc.type  === 'matrix' || d.desc.type === 'table';
    }

    // create dataset directory list
    data_provider.list(filter_list).then(function (items) {
      var dataset_categories = [
        {title: 'Taco (Multiple + Tiny + Large)', dimension: '401 x 192', regexp:/.*multiple.*|.*tiny.*|.*Large.*/},
        {title: 'Taco (All)', dimension: '401 x 192', regexp:/.*Taco (?!merge).*/},
        {title: 'microRNA', dimension: '150 x 491', regexp:/.*GBM*.*microRNA(?!-seq).*/},
        {title: 'Methylation', dimension: '8266 x 112', regexp:/.*GBM*.*Methylation.*/},
        {title: 'Mutations', dimension: '9414 x 284', regexp:/.*GBM*.*Mutations.*/},
        {title: 'mRNA-seq', dimension: '18214 x 165', regexp:/.*GBM*.*seq.*/},
        {title: 'mRNA', dimension: '12042 x 527', regexp:/.*GBM*.*mRNA(?!-seq).*/},
        {title: 'Copy Number', dimension: '24174 x 563', regexp:/.*GBM*.*Copy Number.*/}
      ];

      // select by dataset directory name
      /*var datasets = items.map(function(d) {
            return d.desc.fqname.split('/')[0]; // get directory name
          })
          .filter(function (v, i, a) { return a.indexOf (v) == i }); // make array unique
      */

      var $select  = d3.select("#dataset-selector").on("change", change),
          $options = $select.selectAll('option').data(dataset_categories); // Data join

      $options.enter().append("option").text(function(d) { return d.title + " (" + d.dimension + ")"; });

      function change() {
        var si   = $select.property('selectedIndex'),
            s    = $options.filter(function (d, i) { return i === si }),
            dataset = s.datum();

        //store the selected index of the dataset group (from the select)
        if (!storage.selected_group){
          storage.selected_group =  dataset;
        }

        //preparing a fixed test table for lineup and mds
        test_items = items.filter(function (d) {
          return d.desc.fqname.match(dataset.regexp);
        });

        if(test_items.length === 0) {
          toastr.warning("No items for this dataset category found! Select a different one.");
          return;
        }
        /*********************************** MDS part ****************************************/
        //creating the data
        calcGraphData(test_items)
          .then(function (mdata) {
            // remove already available DOM nodes
            d3.select('#mds-graph *').remove();
            console.log("mds result", storage.mds);
            showMDS(mdata);
          }, function (error) {
            console.error('error loading mds items', error);
            toastr.error("Couldn't load the selected dataset directory!<br>Error: " + error.responseText);
          });

        //clearing lineup so that I don't get the ranking from old datasets
        if (lineup_instance !== null) {
          lineup_instance.destroy();
        }
      }

      // initialize the first directory selection
      change();
    });

    data_provider.list(filter_list).then(function (items) {
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

      //MDS part
      //creating the data
      /*calcGraphData(test_items)
        .then(function (mdata) {
          showMDS(mdata);
        });*/

      // addThem
      taco_dispatcher.on('show_detail', function(ref_table, dest_table) {
        //console.log("moving to detail view");
        //1 is the split between middle and overview
        //todo check if it's already 1 then don't do anything for the slider
        detail_slider.slider('setValue', 3, true, true);

        //console.log('show_detail for:', 'ref_table =', ref_table, 'and dest_table =', dest_table);

        // visualize ref_table and dest_table
        var table_heatmap_promises = [ref_table, dest_table].map(function(dataset) {
          if (dataset.desc.type === 'matrix') {
            heatmapplugin = vis.list(dataset).filter(function (d) {
              return d.id.match(/.*heatmap.*/);
            })[0];
            //heatmapplugin = vis.list(selectedDataset).filter(function(d) { return d.id.match(/.*histogram.*/); })[0];

          } else if (dataset.desc.type === 'table') {
            heatmapplugin = vis.list(dataset).filter(function (d) {
              return d.id.match(/.*table.*/);
            })[0];
            toastr.warning("Visualization for tables might not perform as expected!!");
            //todo find the difference between the visualziatoin for tables and martrices and handle this here.
          }

          if (heatmapplugin !== undefined) {
            // selectedDataset.data() to get the data
            return Promise.all([dataset.rows(), dataset.cols(), heatmapplugin.load()])
              .then(function (values) {
                var rows = values[0];
                var cols = values[1];
                var plugin = values[2];

                if (dataset === dest_table) {
                  if (heatmap2 !== null) {
                    heatmap2.destroy();
                  }
                  //can use selectedDataset.dim instead of calculating the length in the class
                  //todo decide where to draw the table
                  heatmap2 = plugin.factory(dataset, document.getElementById('dest-heatmap'), {
                    initialScale: gridSize,
                    color: ['white', 'black']
                  });
                  resize_heatmap(heatmap2, heatmapplugin);
                  //(new behavior.ZoomLogic(heatmap2, heatmapplugin)).zoomSet(0.5,2);
                  d3.select('#dest-title-name').text(dataset.desc.name +" ("+ getVersion(dataset) + ")");

                  rows2 = rows;
                  cols2 = cols;
                  id2 = dataset.desc.id;
                  ds2 = dataset;
                } else if(dataset === ref_table) {
                  if (heatmap1 !== null) {
                    heatmap1.destroy();
                  }
                  heatmap1 = plugin.factory(dataset, document.getElementById('src-heatmap'), {
                    initialScale: gridSize,
                    color: ['white', 'black']
                  });
                  //(new behavior.ZoomLogic(heatmap1, heatmapplugin)).zoomSet(2,2);
                  resize_heatmap(heatmap1, heatmapplugin);
                  //heatmap1.parent.parentElement.getBoundingClientRect()
                  d3.select('#src-title-name').text(dataset.desc.name +" ("+ getVersion(dataset) +")");
                  rows1 = rows;
                  cols1 = cols;
                  id1 = dataset.desc.id;
                  ds1 = dataset;
                }
              });
          }
          return undefined;
        });

        Promise.all(table_heatmap_promises).then(function() {
          // visualize diff heatmap
          // checking the basic type matches
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
            //TODO check values/columns for table

          create_diff_heatmap(ds1, ds2);
          }
        });
      });

      idtypes.resolve('_taco_dataset').on('select', function (e, type, range) {
        if (type === 'node-selected') {
          var r = range.dim(0).asList();
          // get only the first selected item
          first_selected = r[0];
          if (lineup_instance !== null) {
            lineup_instance.destroy();
          }
          calcLineupData(test_items[first_selected], test_items)
            .then(showLineup);
        } else if (type === 'selected') {
          //type could be selected or hovered
          var selected = range.dim(0).asList();
          if (selected.length >= 2) {
            console.log("moving to the next view with ", selected);
            //1 is the split between middle and overview
            //todo check if it's already 1 then don't do anything for the slider
            detail_slider.slider('setValue', 1, true, true);
            // show the stuff in the middle view
            //todo do this as a function somewhere
            var ref_table = test_items[first_selected];
            // drawing the reference as heatmap
            heatmapplugin = vis.list(ref_table).filter(function (d) {
              return d.id.match(/.*heatmap.*/);
            })[0];
            var parent_ref = document.getElementById('ref-table');
            heatmapplugin.load().then(function(plugin){
              if (mid_hm !== null) {
                mid_hm.destroy();
              }
              mid_hm = plugin.factory(ref_table, parent_ref, {
                initialScale: gridSize,
                color: ['white', 'black']
              });
              (new behavior.ZoomLogic(mid_hm, heatmapplugin)).zoomTo(parent_ref.getBoundingClientRect().width, parent_ref.getBoundingClientRect().height);
            });
            //adding the name of the reference table
            d3.select('#ref-table-name').text(ref_table.desc.name +" ("+ getVersion(ref_table) +")");
            // drawing the histograms / middle view diffs
            var selected_items = selected.map(function(index) {
              return test_items[index];
            });

            var $mid_comparison = d3.select('#mid-comparison');
            $mid_comparison.classed('only-columns', (settings_direction.length === 1 && settings_direction[0] === 'columns'));

            var $wrapper = $mid_comparison.selectAll(".mid-vis-wrapper").data(selected_items);

            $wrapper.enter().append('div')
              .classed('mid-vis-wrapper', true)
              .classed('taco-tooltip', true);

            $wrapper.each(function(selected_item) {
              var $wrapper_node = d3.select(this);

              //first remove all the old content
              $wrapper_node.selectAll('*').remove();

              // add table name
              var $title = $wrapper_node.append('a')
                .classed('title', true)
                .classed('taco-tooltip', true)
                .attr('href', '#')
                .text(selected_item.desc.name + " (" + getVersion(selected_item) +")")
                .on('click', function() {
                  taco_dispatcher.show_detail(ref_table, selected_item);
                  d3.event.stopPropagation();
                  return false;
                });

              $title.append('span')
                .attr('class', 'tooltiptext tooltip-top')
                .text('Select to compare in detail');

              // add body for histogram
              var $wrapper_body = $wrapper_node.append('div').classed('body', true);

              calc2DHistogram($wrapper_body, ref_table, selected_item, settings_direction);
              // todo get the direction
              // todo get the bins
              calcHistogram($wrapper_body, ref_table, selected_item, setting_bins, setting_bins_col, settings_direction);
                //.then(function(viss){
                ////these are just 2 since every histogram is both rows and columns
                //  console.log("hist vises", viss);
                //});
                //.then(showHistogram);
            });

            $wrapper.exit().remove();
          }
        }
      });

    });

    /* On change functions */

    $("[name='change[]']").change(function () {
      var old_sc = settings_change;
      settings_change = [];
      $("[name='change[]']:checked").each(function () {
        settings_change.push(this.value);
      });
      if ($("[name='change[]']:checked").length === 0) {
        // some sort of validation to make sure that there's at least one change type selected
        toastr.warning("You have to select at least one change type!", "I will select " + $(this).val() + " for you");
        settings_change.push(this.value);
        console.log("i will select this for you", $(this).val(), settings_change);
        $('#' + this.id).prop('checked', true);
        $('#' + this.id).parents('label').toggleClass('active');
      }
      var unselected_diff = _.difference(old_sc, settings_direction),
        selected_diff = _.difference(settings_direction, old_sc);
      console.log("changed this ", $(this).val(), settings_change , "unselected diff", unselected_diff, "selected diff", selected_diff);
      if (unselected_diff.length > 0){
        taco_dispatcher.change_type_removed(unselected_diff);
      }
      if (selected_diff > 0){
        taco_dispatcher.change_type_added(selected_diff);
      }
    });


    $("[name='direction[]']").change(function () {
      var old_sd = settings_direction;
      settings_direction = [];
      $("[name='direction[]']:checked").each(function () {
        settings_direction.push(this.value);
      });
      if ($("[name='direction[]']:checked").length === 0) {
        // some sort of validation to make sure that there's at least one direction selected
        toastr.warning("You have to select at least one direction!", "I will select " + $(this).val() + " for you");
        settings_direction.push(this.value);
        console.log("i will select this for you", $(this).val(), settings_direction);
        $('#' + this.id).prop('checked', true);
        $('#' + this.id).parents('label').toggleClass('active');
      }

      var unselected_diff = _.difference(old_sd, settings_direction),
        selected_diff = _.difference(settings_direction, old_sd);
      console.log("changed this ", $(this).val(), settings_direction, "unselected diff", unselected_diff, "selected diff", selected_diff);
      taco_dispatcher.modify_direction(settings_direction);
    });

    $("#bin-number").change(function () {
      var bins_input = parseInt(document.getElementById('bin-number').value);
      // make sure no negative numbers
      setting_bins = (bins_input > 1? bins_input: 2);
    });

    $("#bin-col-number").change(function () {
      var bins_c_input = parseInt(document.getElementById('bin-col-number').value);
      // make sure no negative numbers
      setting_bins_col = (bins_c_input > 1? bins_c_input: 2);
    });

    // slider for bootstrap
    // With JQuery
    var detail_slider = $('#detail-slider').slider({
      ticks: [0, 2, 4],
      ticks_labels: ['Overview', 'Middle', 'Detail']
    });

    // color slider
    var color_slider = $("#taco-color-slider-input").slider({
      id: "taco-color-slider",
      min: -1,
      max: 1,
      range: true,
      value: [-1, 1],
      tooltip_position: 'bottom',
      tooltip_split: 'true'
    });
    var min_color = -1, max_color = 1;

    // flexbox part
    // select all DOM nodes (e.g. links) with class="expand-column"
    d3.selectAll('.expand-column').on('click', function () {
      var $this = d3.select(this);
      expandView($this);
      detail_slider.slider('setValue', parseInt($this.attr('data-slider-value')));
    });

    var expandView = function (t) {
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
    detail_slider.on('change', function (ev) {
      d3.selectAll('.flex-column.expand').classed('expand', false);
      d3.select('#taco-color-slider-group').classed('hidden', (ev.value.newValue < 3));
      switch (ev.value.newValue) {
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
      if (mds_instance !== null){
        //mds_instance.resize();
      }
      if (lineup_instance !== null) {
        var ranking = lineup_instance.lineup.data.getLastRanking().getOrder();
        console.log("the ranking from sliding?", ranking);
      }
    });

    color_slider.on('change', function (ev) {
      if (ds1 !== null && ds2 !== null && detail_slider.val() >= 3){
        min_color = ev.value.newValue[0];
        max_color = ev.value.newValue[1];
        taco_dispatcher.update_color(min_color, max_color);
      }
    });

    //Line Up part

    function showLineup(lineup_data) {
      lineup.create(lineup_data, document.querySelector('#lineup'))
        .then(function (instance) {
          lineup_instance = instance;
          instance.data.on('select-selected', function (event, range) {
            console.log(range.dim(0).asList());
            //get the ranking of lineup
            //todo call it from a better place but should be when the line up is finished
            var ranking = instance.lineup.data.getLastRanking().getOrder();
            console.log("the ranking", ranking);
          });
        });
    }

    // assuming tha the reference table is the full object (not just the ID!)
    function calcLineupData(ref_table, lineup_items) {
      return Promise.all(lineup_items.map(function (e, index, arr) {
        if (e.desc.id !== ref_table.desc.id) {
          return data_provider.create({
            type: 'diffstructure',
            name: ref_table.desc.name + '-' + e.desc.name,
            id1: ref_table.desc.id,
            id2: e.desc.id,
            //change: settings_change,
            change: "structure,content",
            direction: settings_direction,
            bins:  1, //  because we don't want only the ratios
            tocall: 'diff',
            size: e.desc.size //we can use dummy values instead
          }).then(function (diffmatrix) {
            return diffmatrix.data().then(function (dm_data) {
              var noch = dm_data.no_ratio * 100;
              var cont = dm_data.c_ratio * 100;
              var stadd = dm_data.a_ratio * 100;
              var stdel = dm_data.d_ratio * 100;
              return {
                name: e.desc.name,
                date: getVersion(e),
                size: e.desc.size[0] + " x " + e.desc.size[1],
                noch: noch,
                cont: cont,
                stadd: stadd,
                stdel: stdel
              };
            });
          });
        } else {
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

    // Middle part
    // ref_table and selected_list are dataset objects
    function calcHistogram($parent_node, ref_table, selected_item, bins, bins_col, direction){
      //calculate the new ones
      // if (selected_item.desc.id !== ref_table.desc.id) { //do we want this here?
      return data_provider.create({
        type: 'diffstructure',
        name: ref_table.desc.name + '-' + selected_item.desc.name,
        id1: ref_table.desc.id,
        id2: selected_item.desc.id,
        //todo remove this and let the server always calculate everything?
        change: ["structure", "content"], //todo use this as parameter
        direction: direction,
        //detail: 2, //because it's middle now
        bins: bins, // this should be a variable but for now we use this static number -> we want histogram
        bins_col: bins_col, //bins per columns (the default one is per row)
        tocall: 'diff',
        size: selected_item.desc.size //we can use dummy values instead
      }).then(function (diffmatrix) {
        var v = vis.list(diffmatrix);
        var v2 = v.filter(function (v) {
          return v.id === 'diffhistvis';
        })[0];
        return v2.load().then(function (plugin) {
          var r = plugin.factory(diffmatrix, $parent_node.node(), {
            dim: settings_direction,
            change: settings_change, //because i want to handle this only on the client for now
            bins: bins,
            bins_col: bins_col,
            name: selected_item.desc.name
          });
          return r;
        });
        //return diffmatrix.data().then(function (b_data) {
        //  return {
        //    name: e.desc.name,
        //    data_list: b_data,
        //    bins: bins
        //  };
        //});
      });
    }

    function calc2DHistogram($parent_node, ref_table, selected_item, direction){
      //calculate the new ones
      // if (selected_item.desc.id !== ref_table.desc.id) { //do we want this here?
      return data_provider.create({
        type: 'diffstructure',
        name: ref_table.desc.name + '-' + selected_item.desc.name,
        id1: ref_table.desc.id,
        id2: selected_item.desc.id,
        //todo remove this and let the server always calculate everything?
        change: ["structure", "content"], //todo use this as parameter
        direction: direction,
        //detail: 2, //because it's middle now
        bins: -1, // we want the result as summary but divided into rows and columns
        tocall: 'diff',
        size: selected_item.desc.size //we can use dummy values instead
      }).then(function (diffmatrix) {
        var v = vis.list(diffmatrix);
        if (direction.length > 1) {
          // draw the 2d heatmap now here
          var v1 = v.filter(function (v) {
            return v.id === 'diff2dhistvis';
          })[0];
          v1.load().then(function (plugin) {
            var r = plugin.factory(diffmatrix, $parent_node.node(), {
              dim: settings_direction,
              change: settings_change, //because i want to handle this only on the client for now
              bins: setting_bins,
              name: selected_item.desc.name,
              ref_table: ref_table,
              dest_table: selected_item,
              taco_dispatcher: taco_dispatcher
            });
          });
        }// else {
        //  toastr.warning("2D heatmap cannot be shown when only 1D is selected", direction);
        //}
      });
    }

    function showHistogram(bdata){
      console.log("diffmatrix as bins data", bdata);
      var v = vis.list(bdata);
        v = v.filter(function (v) {
          return v.id === 'diffhistvis';
        })[0];
        v.load().then(function (plugin) {
          console.log("I'm here");
          var r = plugin.factory(bdata, d3.select('#mid-comparison').node(), {
            dim: ["rows", "columns"],
            bins: setting_bins
          });
        });
    }

    function calcGraphData(datalist) {
      return data_provider.create({
        type: 'diffstructure',
        name: datalist[0].desc.name + '-orso',
        datalist: datalist,
        change: "structure,content",
        direction: settings_direction,
        bins: 1, // because we only want ratios
        //detail: 0,
        tocall: 'mds', //the key point
        size: datalist.length //we can use dummy values instead
      }).then(function (diffmatrix) {
        return diffmatrix.data().then(function (dm_data) {
          var mds_result = {
            pos: dm_data,
            nodes: datalist
          };
          storage.mds = mds_result;
          return mds_result;
        });
      });
    }

    //drawing MDS
    function showMDS(mdata) {
      mds.create(mdata, document.querySelector('#mds-graph'), {dispatcher: taco_dispatcher})
        .then(function (instance) {
          mds_instance = instance;
          d3.select('.loader').style('display', 'none');
        });
    }

    //todo think of applying the same scaling for both heatmaps
    function resize_heatmap(hm, heatmapplugin) {
      var pw = hm.parent.getBoundingClientRect().width,
        ph = hm.parent.getBoundingClientRect().height;
      (new behavior.ZoomLogic(hm, heatmapplugin)).zoomTo(pw, ph);
    }

    function resize_heatmap_by_cell_height(hm, heatmapplugin, cell_height, cell_width){
      if (cell_height === 1 || cell_width === 1) {
        resize_heatmap(hm, heatmapplugin);
      } else {
        var new_height = (hm.rawSize[1] * cell_height),
          new_width = (hm.rawSize[0] * cell_width);
        //console.log("this heatmap has ", hm.rawSize, " rows");
        (new behavior.ZoomLogic(hm, heatmapplugin)).zoomTo(new_width, new_height);
      }
    }

    function getVersion(dataset){
      return dataset.desc.fqname.substring(0,10);
    }

    function create_diff_heatmap(src, dest) {
      data_provider.create({
        type: 'diffstructure',
        name: src.desc.name + '-' + dest.desc.name,
        id1: src.desc.id,
        id2: dest.desc.id,
        change: settings_change,
        direction: settings_direction,
        //detail: settings_detail,
        bins: 0, // this represents detail in this case, no bins
        tocall: 'diff',
        size: [10, 10] //we can use dummy values instead
      }).then(function (diffmatrix) {
        diffmatrix.data().then(function(data){
          union_rows = data.union.ur_ids.length;
          union_cols = data.union.uc_ids.length;
        });
        //diffmatrix
        if (dh !== null) {
          dh.destroy();
          dh.node.remove();
          //remove the old multiform selector
        }
        var diffheatmap = vis.list(diffmatrix).filter(function (d) {
          return d.id.match(/.*diffmatrixvis.*/);
        })[0];
        var diff_parent = d3.select('#diff-heatmap');
        diff_parent.selectAll('div').remove();
        diff_parent = diff_parent.node();
        diffheatmap.load().then(function (plugin) {
          //here we call my diff_heatmap
          // heatmap1 and 2 have the same size as we scaled them to be the 1/3 of the view
          var grid_height = diff_parent.getBoundingClientRect().height -3, // -2 for border
            grid_width = diff_parent.getBoundingClientRect().width;
          storage.diff_heatmap = {diffmatrix: diffmatrix, diffparent: diff_parent, plugin: plugin};
          dh = plugin.factory(diffmatrix, diff_parent,
            // optimal would be to find the smallest scaling factor
            {gridSize: [grid_width, grid_height],
            colorDomain: [min_color, max_color],
            taco_dispatcher: taco_dispatcher}
          );
        });
      });
    }

  });
