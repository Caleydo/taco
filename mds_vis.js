/**
 * Created by Reem on 10/23/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util'], function (exports, d3, d3utils) {
    //force directed graph
    function drawFDGraph(parent, nodes, links, size){
      //todo use size instead
      var width = 500,
        height = 500;
      var svg = parent.append("svg")
        .attr("width", width)
        .attr("height", height);
      svg = drawGraphNodes(svg, nodes, links, width, height);
      return svg;
    }

    function drawGraphNodes(svg, nodes, links, width, height){
      //todo consider the value in the links!!
      //todo the value should represent the similarity ?
      var force = d3.layout.force()
        .charge(-150)
        .size([width, height])
        .nodes(nodes)
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

      var node = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node");
        //.call(force.drag);

      var circles = node.append("circle")
        .attr("r", 7)
        .attr("class", "fd-circle");

      node.append("text")
        .attr("dx", 10)
        .attr("dy", ".35em")
        .text(function (d, i) {
          return d.name;
        });

      //var onClick = d3utils.selectionUtil(nodes, node, 'fd-circle');

      circles.on('click', function(n){
        d3.selectAll(".fd-circle-selected").classed("fd-circle-selected", false);
        d3.select(this).classed("fd-circle-selected", true);
        console.log("selected node", n.name);
      });

      force.on("tick", function () {
        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      });
      return node;
    }

    //end of fd graph
    exports.MDSVis = d3utils.defineVis('MDSVis', {
        dim: ['column']
      }, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        var $node = $parent.append("div")
          .classed("d3-scatter-output", true);
        data.data().then(function(links){
          //drawMDSGraph($parent, links, size);
          var l = links.map(function(e){
            return {
              source: e[0],
              target: e[1],
              value: e[2]
            }
          });
          drawFDGraph($parent, o.nodes, l, size);
          //var onClick = d3utils.selectionUtil(nodes, n, 'fd-circle');
        });
        return $node;
      });

    exports.create = function (data, parent, options) {
      return new exports.MDSVis(data, parent, options);
    };
  }
);
