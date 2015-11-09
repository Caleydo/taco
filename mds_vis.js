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
      /*
      //http://bl.ocks.org/d3noob/5141278
      var nodes = {};

      // Compute the distinct nodes from the links.
      links.forEach(function(link) {
          link.source = nodes[link.source] ||
              (nodes[link.source] = {name: link.source});
          link.target = nodes[link.target] ||
              (nodes[link.target] = {name: link.target});
          link.value = +link.value;
      });
      */

      var force = d3.layout.force()
        .charge(-150)
        .size([width, height])
        //.nodes(d3.values(nodes))
        .nodes(nodes_table)
        .links(links);
        //.start();

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
        //.call(force.drag);

      var circles = node.append("circle")
        .attr("r", 7)
        .attr("class", "fd-circle")
        .on('click', onClick);

      node.append("text")
        .attr("dx", 10)
        .attr("dy", ".35em")
        .text(function (d, i) {
          return d[0];
        });

      //var onClick = d3utils.selectionUtil(nodes_table, node, 'circle');
      //circles.on('click', function(n){
      //  d3.selectAll(".fd-circle-selected").classed("fd-circle-selected", false);
      //  d3.select(this).classed("fd-circle-selected", true);
      //  //console.log("selected node", n.name);
      //  console.log("selected node", n[0], n[1]);
      //});

      force.on("tick", function () {
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      });
      return node;
    }
    //end of fd graph

    //MDS graph
    function drawMDSGraph($parent, data, nodes, pos, size){
      //todo use size instead
      var width = $parent.node().getBoundingClientRect().width,
        height = $parent.node().getBoundingClientRect().height;
      var svg = $parent.append("svg")
        .attr("width", width)
        .attr("height", height);
      var margin = 20;

      var xScale = d3.scale.linear()
        .domain([pos.xmin, pos.xmax])
        .range([0 + margin, width - margin]);

      var yScale = d3.scale.linear()
        .domain([pos.ymin, pos.ymax])
        .range([0 + margin, height - margin]);


      d3utils.selectionUtil(data, svg, '.node');
      var onClick = function(d,i) {
        data.select(0, 'node-selected', [i], idtypes.toSelectOperation(d3.event));
      };

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

      var circles = node.append("circle")
        .attr("r", 7)
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
          return xScale(d.x) + 5;
        })
        .attr("y", function (d) {
          return yScale(d.y);
        });

      //var text = svg.append("g")
      //  .attr("class", "labels")
      //  .selectAll("text")
      //  .data(nodes)
      //  .enter().append("text")
      //  .attr("dx", 12)
      //  .attr("dy", ".35em")
      //  .text(function (d) {
      //    return d[0];
      //  });

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
          //$svg = drawFDGraph($parent, data, nodes, o.links, size);
          $svg = drawMDSGraph($parent, data, nodes, o.links, size);
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
