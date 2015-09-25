/**
 * Created by Reem on 9/22/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util', './drag'], function (exports, d3, d3utils, drag) {
    //draws the percentage bar based on content data
    function drawDiffPercentageBar(p_data, usize, parent, dim, data_promise) {
      var myDrag = drag.Drag();
      var usize0 = usize[0],
        usize1 = usize[1],
        is_cols = false;
      if (dim[0] !== "rows") {
        usize0 = usize[1];
        usize1 = usize[0];
        is_cols = true;
      }
      var width = 20,
        height = 120;

      //find a better way for calculating the position
      var position = parseInt(parseInt(d3.select("#board").style("width")) / 2) - parseInt(width / 2);

      var container = parent.classed("rotated", is_cols)
        .style("width", width + 2 + 'px')
        .style("height", height + 2 + 'px')
        //todo find an alternative for margin.top here!! or in the other heatmap (special margin)
        //todo move all the transform functions to the css
        //note that the transform has to be one sentence otherwise it won't happen
        .style("transform", "translate(" + position + "px," + 20 + "px)" + (is_cols ? "rotate(-90deg)" : "scaleY(-1)"))
        .call(myDrag);

      var y = d3.scale.linear()
          .domain([0, 1])
          .range([0, height]);

      var bp = container.selectAll("div.bars")
        .data(p_data)
        .enter()
        .append("div")
        .classed("bars", true)
        .classed("content-change-color", true)
        .style("height", function(d){
          return y(d.height) + "px";
        })
        .style("width", width + "px");
       // .text( p_data * 100 + "%");
      return container;
    }

    exports.DiffPercentageBarVis = d3utils.defineVis('DiffPercentageBarVis', {
        dim: 'column'
      }, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        var $node = $parent.append('div')
          .classed("taco-bar-container", true);

        //todo change this so that it consider the case of both rows and cols at the same time
        data.contentRatio().then(function (ratio) {

          //draws the percentage bar based on content data
          content = {height: ratio};
          ratios = [];
          ratios.push(content);
          $node = drawDiffPercentageBar(ratios, data.desc.size, $node, data.desc.direction, data.data());
        });
        return $node;
      });

    exports.create = function (data, parent, options) {
      return new exports.DiffPercentageBarVis(data, parent, options);
    };
  }
)
;
