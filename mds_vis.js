/**
 * Created by Reem on 10/23/2015.
 */
define(['exports', 'd3', 'jquery', '../caleydo_d3/d3util', '../caleydo_core/idtype'],
  function (exports, d3, $, d3utils, idtypes) {
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
      var margin = 40;
      var circle_width = 16;

      var xScale = d3.scale.linear()
        .domain([pos.xmin, pos.xmax])
        .range([margin, width - margin - 80]);

      var yScale = d3.scale.linear()
        .domain([pos.ymin, pos.ymax])
        .range([margin, height - margin]);

      //node selection from Caleydo
      d3utils.selectionUtil(data, svg, '.node');
      var onClick = function(d,i) {
        data.select(0, 'node-selected', [i], idtypes.toSelectOperation(d3.event));
      };

      // combine both the nodes with the position
      var mixed_data = [];
      pos.pos.forEach(function(d,i) {
        d.name = nodes[i][0];
        d.version = nodes[i][1].substring(0,8);
        mixed_data[i] = d;
      });

      var selection = svg.selectAll(".node").data(mixed_data);
      // d3 enter -> create dom elements once
      var node =  selection.enter()
        .append("div")
        .attr("class", "node");
      node.append("text")
       // .attr("dx", 10)
       // .attr("dy", ".35em")
        .text(function (d, i) {
          return d.name + " (" + d.version + ")";
        });

      var circles = node.append("div")
        .style("width", circle_width  + 'px')
        .style("height", circle_width  + 'px')
        .classed("fd-circle", true)
        .attr("id", function(d, i){
          return "table" + i;
        })
        .on('click', onClick);

      // d3 update
      svg.selectAll(".node")
        .style("transform", function(d) {
          return "translate(" + xScale(d.x) + "px," + yScale(d.y) + "px)";
        });

      // d3 remove
      selection.exit().remove();

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
          console.log(nodes);
          $svg = drawMDSGraph($node, data, nodes, o.links, current_size);

          //to resize MDS
          o.dispatcher.on('resized_flex_column', function(col_id, width, $column) {
            current_size = [$parent.node().getBoundingClientRect().width, $parent.node().getBoundingClientRect().height];
            if (current_size[0] > 100){
              drawMDSGraph($node, data, nodes, o.links, current_size);
              console.log(col_id, width, $column);
            }
          });
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
