/**
 * Created by Reem on 11/12/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util', './drag'], function (exports, d3, d3utils, drag) {
    function drawContentHist(p_data, gridSize, parent, x, y) {
      var bp = parent.selectAll("div.rows")
        .data(p_data, function (d, i) {
          return d.id;
        });

      bp.enter().append("div")
        .classed("rows", true)
        .classed("content-change-color", true)
        .style("width", function (d) {
          return x(d.count) + "px";
        })
        .style("height", gridSize - 1 + "px")
        .attr("title", function (d) {
          return d.count;
        })
        //.text(function (d) {return d.id;})
        .style("transform", function (d) {
          return "translate(" + 0 + "px," + y(d.pos) + "px)";
        });
      return parent;
    }

    /*
    function drawStructHist(p_data, gridSize, parent, y, isadd) {
      var container = parent.selectAll("div.struct")
        .data(p_data, function (d, i) {
          return d.id;
        });

      container.enter().append("div")
        .classed("struct", true)
        .classed("struct-add-color", isadd)
        .classed("struct-del-color", !isadd)
        .style("width", gridSize - 1 + "px")
        .style("height", gridSize - 1 + "px")
        //.attr("title", function (d) {return d.id;})
        .style("transform", function (d) {
          return "translate(" + -parseInt(gridSize / 2) + "px," + y(d.pos) + "px)";
        });
      return parent;
    }
   */
    function drawHistogram(parent, data, bins, dim, size) {
      var is_cols = false,
        //todo the max change should be the length
        max_change = data.desc.size[1]; //the union size (all columns in this row are changed)
      //todo conside the direction in a better way
      if (dim !== "rows") {
        is_cols = true;
        //the union size (all rows in this col are changed)
        max_change = data.desc.size[0];
      }
      //todo we could use the width of the max value
      var width = size[0],
        height = size[1],
        gridSize = Math.floor(height / bins);
      var myDrag = drag.Drag();

      // linear x and y scales
      var x = d3.scale.linear()
        .domain([0, max_change]) // we agreed that this is that all cells are changed
        .range([0, width]);
      var y = d3.scale.linear()
        .domain([0, bins])
        .range([0, height]);

      //todo find a better way for calculating the position
      var position = parseInt(parseInt(parent.style("width")) / 2) + ( is_cols ? height : width);

      var $node = parent.append("div")
        .classed("taco-hist-container", true)
        .classed("rotated", is_cols)
        .style("width", width + 2 + 'px')
        .style("height", height + 2 + 'px')
        //todo find an alternative for margin.top here!! or in the other heatmap (special margin)
        //todo move all the transform functions to the css
        //note that the transform has to be one sentence otherwise it won't happen
        .style("transform", "translate(" + position + "px," + 20 + "px)" + (is_cols ? "rotate(90deg) scaleY(-1)" : ""))
        .call(myDrag);

      if (data.desc.change.indexOf('content') > -1) {
        //todo change this so that it consider the case of both rows and cols at the same time
        // m means that it's aggregated in the level of medium
        data.dimStats(dim, bins).then(function (stats) {
          //http://bost.ocks.org/mike/bar/
          $node = drawContentHist(stats, gridSize, $node, x, y);
        });
      }
      //todo combine it with the one above
      //if (data.desc.change.indexOf('structure') > -1) {
      //  Promise.all([data.structAddStats(dim), data.structDelStats(dim)])
      //    .then(function (values) {
      //      console.log("values", values);
      //      var a_stats = values[0],
      //        d_stats = values[1];
      //      console.log(values);
      //      $node = drawStructHist(a_stats, gridSize, $node, y, true);
      //      $node = drawStructHist(d_stats, gridSize, $node, y, false);
      //    });
      //}
      return $node;
    }


    exports.DiffHistogram = d3utils.defineVis('DiffHistogram', {
        dim: ['column']
      }, [50, 200],
      function ($parent, data, size) {
        var o = this.options;
        var $node = $parent.append("div");
        var bins = o.bins;
        if (o.dim.indexOf("rows") > -1) {
          drawHistogram($node, data, bins, "rows", size);
        }
        if (o.dim.indexOf("columns") > -1) {
          //call the function for the cols!
          drawHistogram($node, data, bins, "columns", size);
        }
        return $node;
      });

    exports.create = function (data, parent, options) {
      return new exports.DiffHistogram(data, parent, options);
    };
  }
);
