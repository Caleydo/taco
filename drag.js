/**
 * Created by Reem on 9/22/2015.
 */
//noinspection Annotator
define(['exports', 'd3'], function (exports, d3) {

  function dragHandler() {
    //must have position absolute to work like this
    //otherwise use transform css property
    d3.select(this)
      .style("left", (this.offsetLeft + d3.event.dx) + "px")
      .style("top", (this.offsetTop + d3.event.dy) + "px");
  }

  exports.Drag = function () {
    return d3.behavior.drag()
      //.on('dragstart', function() { console.log("start") })
      .on('drag', dragHandler);
      //.on('dragend', function() { console.log("end") });
  }
});
