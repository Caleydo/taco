/**
 * Created by Reem and Sam on 9/17/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util', './drag'], function (exports, d3, d3utils, drag) {
    //draws the barplot based on the projected data
    function drawDiffBarplot(p_data, usize, parent, dim, realsize, data_promise) {
      var usize0 = usize[0],
        usize1 = usize[1],
        is_cols = false;
      if (dim[0] !== "rows"){
        usize0 = usize[1];
        usize1 = usize[0];
        is_cols = true;
      }
      var  gridSize = 6,
        //todo we could use the width of the max value
        width = (realsize ?(usize1 * gridSize) : 20),
        height = (usize0 * gridSize);
      var myDrag = drag.Drag();

      console.log("direction", dim, data_promise);

      //find a better way for calculating the position
      var position = parseInt(parseInt(d3.select("#board").style("width")) / 2) - parseInt(width / 2);

      var container = parent.classed("rotated", is_cols)
        .style("width", width + 2 + 'px')
        .style("height", height + 2 + 'px')
        //todo find an alternative for margin.top here!! or in the other heatmap (special margin)
        //todo move all the transform functions to the css
        //note that the transform has to be one sentence otherwise it won't happen
        .style("transform", "translate(" + position + "px," + 20 + "px)" + (is_cols ? "rotate(90deg) scaleY(-1)" : ""))
        .call(myDrag);

      var max_change = Math.max.apply(Math, p_data.map(function(o){return o.count;}));

      //http://bost.ocks.org/mike/bar/
      var x;
      if (realsize){
        x = d3.scale.linear()
        .domain([0, usize1])
        .range([0, width]);
      }else{
        x = d3.scale.linear()
        .domain([0, max_change])
        .range([0, width]);
      }

      var y = d3.scale.linear()
        .domain([0, usize0])
        .range([0, height]);


      var bp = container.selectAll("div.rows")
        .data(p_data, function (d, i) {
          return d.id;
        });

      bp.enter().append("div")
        .classed("rows", true)
        .classed("content-change-color", true)
        .style("width", function (d) {
          return x(d.count) + "px";
        })
        .style("height", gridSize -1 + "px")
        .attr("title", function (d) {return d.count;})
        //.text(function (d) {return d.id;})
        .style("transform", function(d){ return "translate(" + 0 + "px," + y(d.pos) + "px)";});
      return container; //?
    }

    function drawDiffStructPlot (p_data, usize, parent, dim, realsize, isadd) {
      var usize0 = usize[0],
        usize1 = usize[1],
        is_cols = false;
      if (dim[0] !== "rows"){
        usize0 = usize[1];
        usize1 = usize[0];
        is_cols = true;
      }
      var  gridSize = 6,
        //todo we could use the width of the max value
        width = (realsize ?(usize1 * gridSize) : 20),
        height = (usize0 * gridSize);

      var y = d3.scale.linear()
        .domain([0, usize0])
        .range([0, height]);

      //todo this is only needed if the content is not applied!!!!
      var myDrag = drag.Drag();
      //find a better way for calculating the position
      var position = parseInt(parseInt(d3.select("#board").style("width")) / 2) - parseInt(width / 2);
      var container = parent.classed("rotated", is_cols)
        .style("width", width + 2 + 'px')
        .style("height", height + 2 + 'px')
        //todo find an alternative for margin.top here!! or in the other heatmap (special margin)
        //todo move all the transform functions to the css
        //note that the transform has to be one sentence otherwise it won't happen
        .style("transform", "translate(" + position + "px," + 20 + "px)" + (is_cols ? "rotate(90deg) scaleY(-1)" : ""))
        .call(myDrag);

      container = parent.selectAll("div.struct")
        .data(p_data, function (d, i) {
          console.log("the data is" , d);
          return d.id;
        });

        container.enter().append("div")
        .classed("struct", true)
        .classed("struct-add-color", isadd)
        .classed("struct-del-color", !isadd)
        .style("width", gridSize -1 + "px")
        .style("height", gridSize -1 + "px")
        //.attr("title", function (d) {return d.id;})
        .style("transform", function(d){ return "translate(" + -parseInt(gridSize/2) + "px," + y(d.pos) + "px)";});
      return parent;
    }

    exports.DiffBarPlotVis = d3utils.defineVis('DiffBarPlotVis', {
        dim: 'column'
      }, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        //var $node = $parent.append('pre');
        var $node = $parent.append("div")
        .classed("taco-bp-container", true);

        var realsize = false;

        //todo change this so that it consider the case of both rows and cols at the same time
        if (data.desc.change.indexOf('content') > -1) {
          data.dimStats(data.desc.direction[0]).then(function (stats) {
            //$node.text(JSON.stringify(stats, null, ' '));
            $node = drawDiffBarplot(stats, data.desc.size, $node, data.desc.direction, realsize, data.data());
          });
        }
        //todo combine it with the one above
        if (data.desc.change.indexOf('structure') > -1) {
          Promise.all([data.structAddStats(data.desc.direction), data.structDelStats(data.desc.direction)])
            .then(function (values) {
              console.log("values", values);
              var a_stats = values[0],
                d_stats = values[1];
              $node = drawDiffStructPlot(a_stats, data.desc.size, $node, data.desc.direction, realsize, true);
              //todo fix the bug with the container
              $node = drawDiffStructPlot(d_stats, data.desc.size, $node, data.desc.direction, realsize, false);
            });
        }
        return $node;
      });

    exports.create = function (data, parent, options) {
      return new exports.DiffBarPlotVis(data, parent, options);
    };
  }
)
;
