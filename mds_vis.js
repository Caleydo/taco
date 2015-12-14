/**
 * Created by Reem on 10/23/2015.
 */
define(['exports', 'd3', 'jquery', '../caleydo_d3/d3util', '../caleydo_core/idtype', '../caleydo_core/vis', '../caleydo_core/behavior'],
  function (exports, d3, $, d3utils, idtypes, vis, behavior) {
    //MDS graph
    function drawMDSGraph($parent, data, nodes, pos, size){
      var width = size[0],
        height = size[1];
      var top = $parent.node().getBoundingClientRect().top;
      var left = $parent.node().getBoundingClientRect().left;
      var svg = $parent;
        //.attr("width", width)
        //.attr("height", height);
        //responsive SVG needs these 2 attributes and no width and height attr
       //.attr("preserveAspectRatio", "xMaxYMax meet")
       //.attr("viewBox",  left + " "+ top + " " + width + " " + height)
       //.attr("viewBox",  "0 0 " + width + " " + height)
       //class to make it responsive
       //.classed("svg-content-responsive", true);
      var margin = 60,
        min_margin = 10;

      var xScale = d3.scale.linear()
        .domain([pos.xmin, pos.xmax])
        .range([min_margin, width - margin]);

      var yScale = d3.scale.linear()
        .domain([pos.ymin, pos.ymax])
        .range([min_margin, height - margin]);


      d3utils.selectionUtil(data, svg, '.node');
      var onClick = function(d,i) {
        data.select(0, 'node-selected', [i], idtypes.toSelectOperation(d3.event));
      };

      // combine both the nodes with the position
      var mixed_data = [];
      pos.pos.forEach(function(d,i) {
        d.name = nodes[i][0];
        mixed_data[i] = d;
      });

      var node = svg.selectAll(".node")
        .data(mixed_data)
        .enter()
        .append("div")
        .attr("class", "node")
        .style("transform", function(d) {
          return "translate(" + xScale(d.x) + "px," + yScale(d.y) + "px)";
        });
        //.call(force.drag);
      node.append("text")
       // .attr("dx", 10)
       // .attr("dy", ".35em")
        .text(function (d, i) {
          return d.name;
        });

      /*trying to show heatmap instead of a circle */
      var circles = node.append("div")
        .style("width", '20px')
        .style("height", '20px')
        .classed("fd-circle", true)
        .attr("id", function(d, i){
          return "table" + i;
        })
        .on('click', onClick);

      var heatmapplugin;
      var nodes_data;
      data.data().then(function(nd){
        nd.map(function(node_row, i){
          nodes_data = node_row[2];
          if (nodes_data.desc.type === 'matrix') {
            heatmapplugin = vis.list(nodes_data).filter(function (d) {
              return d.id.match(/.*heatmap.*/);
            })[0];
          }
          if (heatmapplugin !== undefined){
            heatmapplugin.load()
              .then(function (plugin) {
                var heatmap1 = plugin.factory(nodes_data, document.getElementById('table'+i), { // find an element
                  initialScale: 6 //grid size from before (i can remove it)
                });
                (new behavior.ZoomLogic(heatmap1, heatmapplugin)).zoomTo(60,70);
                //id1 = selectedDataset.desc.id;
              });
          }
        });
      });

    var radius = 7;
      //.attr("x", function(d) {
      //  return xScale(d.x) + radius;
      //})
      //.attr("y", function (d) {
      //  return yScale(d.y) - (radius*10);
      //});

      return svg;
    }
    //end of MDS graph


    var $svg = null;

    exports.MDSVis = d3utils.defineVis('MDSVis', {
        dim: ['column']
      }, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        var current_size = [$parent.node().getBoundingClientRect().width, $parent.node().getBoundingClientRect().height];
        var $node = $parent.append("div")
          //.classed("svg-container", true) //container class to make it responsive
          .classed("mds-container", true)
          .style("width", current_size[0] + "px")
          .style("height", current_size[1] + "px");
        data.data().then(function(nodes){
          $svg = drawMDSGraph($node, data, nodes, o.links, current_size);
        });
        return $node;
      },
      {
        resize: function() {
          if($svg === null) {
            return;
          }
          var done = false;
          var resizeSvg = function() {
            done = true;
            var width = $svg.node().parentNode.getBoundingClientRect().width,
                height = $svg.node().parentNode.getBoundingClientRect().height;
              console.log("resize mds vis", $svg);
            //$svg.attr("width", width)
            //  .attr("height", height);
            $svg.attr("viewBox",  "0 0 " + width + " " + height);
          };

          // use jquery instead of d3
          // http://stackoverflow.com/questions/2087510/callback-on-css-transition
          $($svg.node()).parents('.flex-column').one('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', resizeSvg);

          //ensure tidy up if event doesn't fire..
          setTimeout(function(){
            if(!done){
              console.log("timeout needed to call transition ended..");
              resizeSvg();
            }
          }, 800); //note: time required for the CSS animation of .flex-column to complete plus a grace period (e.g. 10ms)
        }
      });

    exports.create = function (data, parent, options) {
      return new exports.MDSVis(data, parent, options);
    };
  }
);
