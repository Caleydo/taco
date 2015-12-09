/**
 * Created by Reem on 10/23/2015.
 */
define(['exports', 'd3', 'jquery', '../caleydo_d3/d3util', '../caleydo_core/idtype'], function (exports, d3, $, d3utils, idtypes) {
    //force directed graph
    function drawFDGraph($parent, data, nodes, links, size){
      //todo use size instead
      var width = $parent.node().getBoundingClientRect().width,
        height = $parent.node().getBoundingClientRect().height;
      var svg = $parent.append("svg")
        .attr("width", width)
        .attr("height", height);
      drawGraphNodes(svg, data, nodes, links, width, height);
      return svg;
    }

    function drawGraphNodes(svg, data, nodes_table, links, width, height){
      //todo the value should represent the similarity ?

      var force = d3.layout.force()
        .charge(-150)
        .size([width, height])
        //.nodes(d3.values(nodes))
        .nodes(nodes_table)
        .links(links);

      // http://jsdatav.is/visuals.html?id=83515b77c2764837aac2
      // here the value represent the distance -> diff
      force.linkDistance(function(link) {
        return link.value * 3;
      });
      //force.linkDistance(width/2);

      // http://jsdatav.is/visuals.html?id=774d02a21dc1c714def8
      // here the value represent the attraction force? but the distance should be static
      //force.linkStrength(function(link){
         //should return [0,1], 1 is the default which is repulsive
        //todo we assume that the value we get is [0,100]
        //todo better to divide it on the largest value -> do some sort of normalization here
       // return link.value/100;
      //});

      //it's important to start at the end
      force.start();

      d3utils.selectionUtil(data, svg, '.node');
      var onClick = function(d,i) {
        data.select(0, 'node-selected', [i], idtypes.toSelectOperation(d3.event));
      };

      var node = svg.selectAll(".node")
        .data(force.nodes())
        .enter()
        .append("g")
        .attr("class", "node");

      var circles = node.append("circle")
        .attr("r", 7)
        .attr("class", "fd-circle")
        .on('click', onClick)
        .call(tooltip.bind("Here is a tooltip!"));

      node.append("text")
        .attr("dx", 10)
        .attr("dy", ".35em")
        .text(function (d, i) {
          return d[0];
        });

      force.on("tick", function () {
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      });
      return node;
    }
    //end of fd graph

    //MDS graph
    function drawMDSGraph($parent, data, nodes, pos, size){
      var width = size[0],
        height = size[1];
      var svg = $parent.append("svg")
        .attr("width", width)
        .attr("height", height);
      var margin = 40;

      var xScale = d3.scale.linear()
        .domain([pos.xmin, pos.xmax])
        .range([margin, width - margin]);

      var yScale = d3.scale.linear()
        .domain([pos.ymin, pos.ymax])
        .range([margin, height - margin]);


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
        .append("g")
        .attr("class", "node");
        //.call(force.drag);

      var radius = 7;
      var circles = node.append("circle")
        .attr("r", radius)
        .attr("class", "fd-circle")
        .attr("cx", function(d) {
          return xScale(d.x);
        })
        .attr("cy", function (d) {
          return yScale(d.y);
        })
        .on('click', onClick);

      node.append("text")
       // .attr("dx", 10)
       // .attr("dy", ".35em")
        .text(function (d, i) {
          return d.name;
        })
        .attr("x", function(d) {
          return xScale(d.x) + radius;
        })
        .attr("y", function (d) {
          return yScale(d.y) + (radius/2);
        });

      return svg;
    }
    //end of MDS graph


    var $svg = null;

    exports.MDSVis = d3utils.defineVis('MDSVis', {
        dim: ['column']
      }, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        data.data().then(function(nodes){
          var current_size = [$parent.node().getBoundingClientRect().width, $parent.node().getBoundingClientRect().height];
          //$svg = drawFDGraph($parent, data, nodes, o.links, size);
          $svg = drawMDSGraph($parent, data, nodes, o.links, current_size);
        });
        return $parent;
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
            $svg.attr("width", width)
              .attr("height", height);
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
