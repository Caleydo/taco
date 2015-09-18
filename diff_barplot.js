/**
 * Created by Reem and Sam on 9/17/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util'], function (exports, d3, d3utils) {
  exports.DiffBarPlotVis = d3utils.defineVis('DiffBarPlotVis', {
        dim: 'column'
      }, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        var $node = $parent.append('pre');

        data.dimStats(o.dim).then(function (stats) {
          $node.text(JSON.stringify(stats, null, ' '));
        });
        return $node;
      });

  exports.create = function (data, parent, options) {
    return new exports.DiffBarPlotVis(data, parent, options);
  };
});
