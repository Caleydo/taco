/**
 * Created by Reem on 6/15/2015.
 */
define(["require", "exports", 'd3', 'underscore', 'toastr', '../caleydo_d3/d3util', './drag'],
  function (require, exports, d3, _, toastr, d3utils, drag) {

    var colorLow = '#d8b365', colorMed = 'white', colorHigh = '#8da0cb',
      colorMerged = '#B2DF8A',//light green
      colorSplit = '#FB9A99'; //light red

    function DiffHeatmap(data, parent) {
      this.h_data = data;
      //todo check if this is correct or should be removed!
      this.container = parent
        .append("div");
        //.classed("taco-table-container", true);
      this.parent = parent;
    }

    DiffHeatmap.prototype.get_data = function () {
      return this.h_data;
    };

    DiffHeatmap.prototype.remove = function () {
      this.container.remove();
    };

    DiffHeatmap.prototype.drawDiffHeatmap = function (operations, directions, gridSize, colorDomain, taco_dispatcher) {
      var that = this;
      var colorScale = d3.scale.linear()
        //.domain([-1, 0, 1])
        .domain([colorDomain[0], 0, colorDomain[1]]) // these are from main
        .clamp(true)
        .range([colorLow, colorMed, colorHigh]);

      that.h_data.then(function (data) {
        var height = gridSize[1];
        var width = gridSize[0];
        //height of each row in the heatmap
        var h = height / data.union.ur_ids.length,
        //width of each column in the heatmap
        w = width / data.union.uc_ids.length;

        var root = that.container.append("div")// g.margin
          .attr("class", "taco-table")
          .style("width", width + 2 + 'px')
          .style("height", height + 2 + 'px')
          //.style("transform", "translate(" + margin.left + "px," + margin.top + "px)")
          //todo move this to the css
          .style("background-color", "white")
          .style("transform-origin", "0 0");
          //.style("transform", "scaleX(" + (that.container.node().getBoundingClientRect().width / width) + ")");

        //taco_dispatcher.on('resized_flex_column.diff', function(col_id, w, $column) {
        //  root.style("transform", "scaleX(" + (that.container.node().getBoundingClientRect().width / width) + ")");
        //  //root.style("transform", "scaleX(" + ((root.node().getBoundingClientRect().width -2) / width) + ")");
        //});

        //create canvas -> getContext('2d')
        // data.structure.added_rows.foreach
        //    canvas.paintRect(w,h,t,l, color)

        //visualizing the diff
        if (operations.indexOf('structure') > -1) {
          if (directions.indexOf('rows') > -1) {
            var addedRows = root.selectAll(".taco-added-row")
              .data(data.structure.added_rows)
              .enter()
              .append("div")
              .attr("class", "taco-added-row")
              .attr("class", "struct-add-color")
              .attr("title", function(d){return d.id;})
              .style("left", 0 + "px")
              .style("top", function (d) {
                var y = d.pos;
                return (y !== -1 ? y * h : null) + "px";
              })
              .style("width", width + "px")
              .style("height", h + "px");
          }

          if (directions.indexOf('columns') > -1) {
            var addedCols = root.selectAll(".taco-added-col")
              .data(data.structure.added_cols)
              .enter()
              .append("div")
              .attr("title", function(d){return d.id;})
              .attr("class", "taco-added-col")
              .attr("class", "struct-add-color")
              .style("top", 0 + "px")
              .style("left", function (d) {
                var x = d.pos;
                return (x !== -1 ? x * w : null) + "px";
              })
              .style("width", w + "px")
              .style("height", height + "px");
          }
          if (directions.indexOf('rows') > -1) {
            var deletedRows = root.selectAll(".taco-del-row")
              .data(data.structure.deleted_rows)
              .enter()
              .append("div")
              .attr("class", "taco-del-row")
              .attr("class", "struct-del-color")
              .attr("title", function(d){return d.id})
              .style("left", 0 + "px")
              .style("top", function (d) {
                var y = d.pos;
                return (y !== -1 ? y * h : null) + "px";
              })
              .style("width", width + "px")
              .style("height", h + "px");
          }
          if (directions.indexOf('columns') > -1) {
            var deletedCols = root.selectAll(".taco-del-col")
              .data(data.structure.deleted_cols)
              .enter()
              .append("div")
              .attr("class", "taco-del-col")
              .attr("class", "struct-del-color")
              .attr("title", function(d){return d.id;})
              .style("top", 0 + "px")
              .style("left", function (d) {
                var x = d.pos;
                return (x !== -1 ? x * w : null) + "px";
              })
              .style("width", w + "px")
              .style("height", height + "px");

          }
        }
        if (operations.indexOf('content') > -1) {
          var chCells = root.selectAll(".taco-ch-cell").data(data.content);
          chCells.enter()
            .append("div")
            .attr("class", "taco-ch-cell")
            .attr("title", function(d){
              return "(" + d.row + "," + d.col + ": " + d.diff_data + ")" ;
            })
            .style("top", function (d) {
              //var y = that.row_ids.indexOf(d.row);
              var y = d.rpos;
              return (y !== -1 ? y * h : null) + "px";
            })
            .style("left", function (d) {
              //var x = that.col_ids.indexOf(d.col);
              var x = d.cpos;
              return (x !== -1 ? x * w : null) + "px";
            })
            .style("width", w + "px")
            .style("height", h + "px")
            .style("background-color", function (d) {
              return colorScale(d.diff_data);
            });

          taco_dispatcher.on('update_color', function(min_color, max_color) {
            colorScale.domain([min_color, 0, max_color]); // these are from main
            chCells.each(function() {
              d3.select(this)
                .style("background-color", function (d) {
                  return colorScale(d.diff_data);
                });
            });
          });
        }

        if (operations.indexOf("merge") > -1) {
          if (directions.indexOf('columns') > -1) {
            var mergedCols = root.selectAll(".taco-mer-col")
              .data(data.merge.merged_cols)
              .enter()
              .append("div")
              .attr("class", "taco-mer-col")
              .attr("title", function(d){
                return "(" + d.id + "," + d.merge_id + ")" ;
              })
              //todo use the merge_id
              .style("top", 0 + "px")
              .style("left", function (d) {
                var x = d.pos;
                return (x !== -1 ? x * w : null) + "px";
              })
              .style("width", w + "px")
              .style("height", height + "px")
              .style("background-color", function (d) {
                return d.is_added ? colorMerged : colorSplit
              })
              .style("z-index", function (d) {
                return d.is_added ? "0" : "1"
              });
          }
          if (directions.indexOf('rows') > -1) {
            var mergedRows = root.selectAll(".taco-mer-row")
              .data(data.merge.merged_rows)
              .enter()
              .append("div")
              .attr("class", "taco-mer-row")
              .attr("title", function(d){
                return "(" + d.id + "," + d.merge_id + ")" ;
              })
              .style("zIndex", function (d) {
                return d.is_merge ? "0" : "1"
              })
              //todo use the merge_id
              .style("left", 0 + "px")
              .style("top", function (d) {
                //var y = that.row_ids.indexOf(d);
                var y = d.pos;
                return (y !== -1 ? y * h : null) + "px";
              })
              .style("width", width + "px")
              .style("height", h + "px")
              .style("background-color", function (d) {
                return d.is_added ? colorMerged : colorSplit
              })
              .style("z-index", function (d) {
                return d.is_added ? "0" : "1"
              });
          }
          if (directions.indexOf('columns') > -1) {
            var splitCols = root.selectAll(".taco-spl-col")
              .data(data.merge.split_cols)
              .enter()
              .append("div")
              .attr("class", "taco-spl-col")
              .attr("title", function(d){
                return "(" + d.id + "," + d.merge_id + ")" ;
              })
              .style("z-index", function (d) {
                return d.is_added ? "0" : "1"
              })
              //todo use the merge_id
              .style("top", 0 + "px")
              .style("left", function (d) {
                //var x = that.col_ids.indexOf(d);
                var x = d.pos;
                return (x !== -1 ? x * w : null) + "px";
              })
              .style("width", w + "px")
              .style("height", height + "px")
              .style("background-color", function (d) {
                return (d.is_added ? colorMerged : colorSplit)
              });
          }
          if (directions.indexOf('rows') > -1) {
            var splitRows = root.selectAll(".taco-spl-row")
              .data(data.merge.split_rows)
              .enter()
              .append("div")
              .attr("class", "taco-spl-row")
              .attr("title", function(d){
                return "(" + d.id + "," + d.merge_id + ")" ;
              })
              .style("z-index", function (d) {
                return d.is_added ? "0" : "1"
              })
              //todo use the merge_id
              .style("left", 0 + "px")
              .style("top", function (d) {
                //var y = that.row_ids.indexOf(d);
                var y = d.pos;
                return (y !== -1 ? y * h : null) + "px";
              })
              .style("width", width + "px")
              .style("height", h + "px")
              .style("background-color", function (d) {
                return (d.is_added ? colorMerged : colorSplit)
              });
          }
        }
      }, function (reason) {
        //why this was rejected
        console.log(reason);
        toastr.warning(reason);
      })
    };

    exports.DiffHeatmap = DiffHeatmap;

    exports.create = function (data) {
      return new DiffHeatmap(data);
    };

    //data, parent, options
    // defineVis(name, defaultOptions, initialSize, build, functions)
    exports.DiffHeatmapVis = d3utils.defineVis('DiffHeatmapVis', {}, function (data) {
      return [data.desc.size[0], data.desc.size[1]]; //this is not really critical
    }, function ($parent, data, size) { //build the vis
      //data.data().then(function(d){console.log("size from data", d.union.uc_ids.length, d.union.ur_ids.length)});
      var o = this.options;
      //var diff = new DiffHeatmap(data.data(), data.desc.size); //use the union size from the server instead of the client
      var diff = new DiffHeatmap(data.data(), $parent);
      diff.drawDiffHeatmap(data.desc.change, data.desc.direction, o.gridSize, o.colorDomain, o.taco_dispatcher);

      //o.dispatcher.on('modify_direction', function(new_direction) {
      //  diff.drawDiffHeatmap(data.desc.change, new_direction, o.gridSize);
      //});
      return diff.container;
    });

    exports.createDiff = function (data, parent, options) {
      return new exports.DiffHeatmapVis(data, parent, options);
    };

  });
