/**
 * Created by Reem on 11/12/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util', './drag'], function (exports, d3, d3utils, drag) {
    function drawBins(p_data, gridSize, parent, x, y, changes) {
      var has_content = (changes.indexOf("content") !== -1),
        has_struct = (changes.indexOf("structure") !== -1);
      var bp = parent.selectAll("div.bin-container")
        .data(p_data, function (d, i) {
          return d.id;
        });

      bp.enter().append("div")
        .classed("bin-container", true)
        .attr("title", function(d){ return d.id; });
        //content
      if(has_content){
        bp.append("div")
          .classed("content-change-color", true)
          .style("width", function (d) {
            return x(d.ratio.c_ratio) + "px";
          })
          .style("height", gridSize - 1 + "px")
          .attr("title", function (d) {
            return d.ratio.c_ratio;
          })
          .style("transform", function (d) {
            return "translate(" + 0 + "px," + y(d.pos) + "px)";
          });
      }
      // deleted structure
      if(has_struct) {
        bp.append("div")
          .classed("struct-del-color", true)
          .style("width", function (d) {
            return x(d.ratio.d_ratio) + "px";
          })
          .style("height", gridSize - 1 + "px")
          .attr("title", function (d) {
            return d.ratio.d_ratio;
          })
          .style("transform", function (d) {
            var acc = (has_content ? d.ratio.c_ratio: 0);
            return "translate(" + x(acc) + "px," + y(d.pos) + "px)";
          });
        // added
        bp.append("div")
          .classed("struct-add-color", true)
          .style("width", function (d) {
            return x(d.ratio.a_ratio) + "px";
          })
          .style("height", gridSize - 1 + "px")
          .attr("title", function (d) {
            return d.ratio.a_ratio;
          })
          .style("transform", function (d) {
            var acc = (has_content ? d.ratio.c_ratio: 0) + d.ratio.d_ratio;
            return "translate(" + x(acc) + "px," + y(d.pos) + "px)";
          });
      }
      return parent;
    }

    function drawHistogram(parent, data, bins, changes, dim, size, name) {
      var is_cols = false,
      //todo the max change should be the length
        clen = data.desc.size[1], //numbers of cells per row
        rlen = data.desc.size[0]; //the union size (numbers of cells per column)
      //todo conside the direction in a better way
      if (dim !== "rows") {
        is_cols = true;
        //the union size (all rows in this col are changed)
        clen = data.desc.size[0];
        rlen = data.desc.size[1];
      }
      // the +1 is only necessary if the rlen/bin is float
      // it's the max number of rows per bin by the number of cells per row
      //var max_change = (Math.floor(rlen / bins) + (rlen % bins === 0 ? 0 : 1)) * clen,
      var max_change = 1, //since we get the values from the server
        width = size[0],
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
      var position = parseInt(parseInt(parent.style("width")) / 2) + (is_cols ? height : width);

      var $node = parent.append("div")
        .classed("taco-hist-container", true)
        .classed("rotated", is_cols)
        //.attr("title", data.desc.id)
        .attr("title", name + " " + dim)
        .style("width", width + 2 + 'px')
        .style("height", height + 2 + 'px')
        //todo find an alternative for margin.top here!! or in the other heatmap (special margin)
        //todo move all the transform functions to the css
        //note that the transform has to be one sentence otherwise it won't happen
        .style("transform", "translate(" + position + "px," + 20 + "px)" + (is_cols ? "rotate(90deg) scaleY(-1)" : ""))
        .call(myDrag);

        data.data().then(function (stats) {
          //http://bost.ocks.org/mike/bar/
          // the data per dimension
          var d_dim = (dim === "rows"? stats.rows: stats.cols);
          $node = drawBins(d_dim, gridSize, $node, x, y, changes);
        });
      return $node;
    }


    exports.DiffHistogram = d3utils.defineVis('DiffHistogram', {
        dim: ['column']
      }, [60, 160],
      function ($parent, data, size) {
        var o = this.options;
        var $node = $parent.append("div");
        var bins = o.bins,
          bins_col = o.bins_col,
          changes = o.change;
        //if (o.dim.indexOf("rows") !== -1 && o.dim.indexOf("columns") !== -1){
        //  console.log(data);
        //} else
        if (o.dim.indexOf("rows") > -1) {
          drawHistogram($node, data, bins, changes, "rows", size, o.name);
        }
        if (o.dim.indexOf("columns") > -1) {
          //call the function for the cols!
          drawHistogram($node, data, bins_col, changes, "columns", size, o.name);
        }
        return $node;
      });

    exports.create = function (data, parent, options) {
      return new exports.DiffHistogram(data, parent, options);
    };
  }
);
