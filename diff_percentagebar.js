/**
 * Created by Reem on 9/22/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util'], function (exports, d3, d3utils) {
    //draws the percentage bar based on content data
    function drawDiffPercentageBar(p_data, usize, parent, dim, data_promise) {
      return parent;
    }

    exports.DiffPercentageBarVis = d3utils.defineVis('DiffPercentageBarVis', {
        dim: 'column'
      }, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        var $node = $parent.append('pre');

        //todo change this so that it consider the case of both rows and cols at the same time
        data.contentRatio().then(function (ratio) {
          $node.text(JSON.stringify(ratio, null, ' '));
          console.log(ratio);
          //$node = drawDiffPercentageBar(stats, data.desc.size, $node, data.desc.direction, data.data());
        });
        return $node;
      });

    exports.create = function (data, parent, options) {
      return new exports.DiffPercentageBarVis(data, parent, options);
    };
  }
)
;
