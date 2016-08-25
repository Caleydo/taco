/**
 * Created by Reem on 12/1/2015.
 */
define(['exports', 'd3', '../caleydo_d3/d3util', '../caleydo_core/table_impl', '../caleydo_core/idtype'],
  function (exports, d3, d3utils, tables, idtypes) {

    function draw2dHistogram(p_data, ref_table, dest_table, taco_dispatcher, index, usize, parent) {
      var usize0 = usize[0],
        usize1 = usize[1];
      var width = 160, //just to make it look a bit wider than the normal one in case both are selected
        height = 160;

      //var onClick = function(d,i) {
      //  taco_dispatcher.show_detail(ref_table, dest_table);
      //};

      //find a better way for calculating the position
      var position = parseInt(parseInt(parent.style("width")) / 2) - parseInt(width / 2);

      var container = parent
        .style("width", width + 2 + 'px')
        .style("height", height + 2 + 'px');
        //todo find an alternative for margin.top here!! or in the other heatmap (special margin)
        //todo move all the transform functions to the css
        //note that the transform has to be one sentence otherwise it won't happen
        //.style("transform", "translate(" + position + "px," + 20 + "px)")
        //.on('click', onClick);

      var x = d3.scale.linear()
        .domain([0,1])
        .range([0, width]);

      var y = d3.scale.linear()
          .domain([0, 1])
          .range([0, height]);

      console.log("pdata", p_data);
      var data_list = [];
      data_list.push({
        rows: p_data.rows.d_ratio + p_data.rows.a_ratio + p_data.rows.c_ratio + p_data.rows.no_ratio, //todo change to 1
        cols: p_data.cols.d_ratio + p_data.cols.a_ratio + p_data.cols.c_ratio + p_data.cols.no_ratio, //todo change to 1
        rows_text : Math.round((p_data.rows.d_ratio * 100)*1000)/1000,
        cols_text : Math.round((p_data.cols.d_ratio * 100)*1000)/1000,
        type: "struct-del"
      });
      data_list.push({
        rows: p_data.rows.a_ratio + p_data.rows.c_ratio + p_data.rows.no_ratio, // or 1 - d
        cols: p_data.cols.a_ratio + p_data.cols.c_ratio + p_data.cols.no_ratio,
        rows_text : Math.round((p_data.rows.a_ratio * 100)*1000)/1000,
        cols_text : Math.round((p_data.cols.a_ratio * 100)*1000)/1000,
        type: "struct-add"
      });
      data_list.push({
        rows: p_data.rows.c_ratio + p_data.rows.no_ratio,
        cols: p_data.cols.c_ratio + p_data.cols.no_ratio,
        rows_text : Math.round((p_data.rows.c_ratio * 100)*1000)/1000,
        cols_text : Math.round((p_data.cols.c_ratio * 100)*1000)/1000,
        type: "content-change"
      });
      data_list.push({
        rows: p_data.rows.no_ratio,
        cols: p_data.cols.no_ratio,
        rows_text : Math.round((p_data.rows.no_ratio * 100)*1000)/1000,
        cols_text : Math.round((p_data.cols.no_ratio * 100)*1000)/1000,
        type: "no-change"
      });
      var bp = container.selectAll("div.bars")
        .data(data_list)
        .enter()
        .append("div")
        .attr("class", function(d){return "bars " + d.type + "-color";}) //todo change this
        .style("height", function(d){
          return y(d.rows) + "px";
        })
        .style("width", function(d){
          return x(d.cols) + "px";
        })
        .attr("title", function(d){
          return  d.type.replace("-", " ") + "\x0Arows: " + d.rows_text + "%\x0Acolumns: " + d.cols_text +"%";
        });
       // .text( p_data * 100 + "%");
      return container;
    }

    exports.Diff2DHistogramVis = d3utils.defineVis('Diff2DHistogramVis', {}, [200, 200],
      function ($parent, data, size) {
        var o = this.options;
        var $node = $parent.insert('div', ':first-child')
          .classed("taco-2d-container", true);
        data.data().then(function(ratios){
          console.log(ratios, "from ratios?");
          $node = draw2dHistogram(ratios, o.ref_table, o.dest_table, o.taco_dispatcher, o.index, data.desc.size, $node);
        });
        return $node;
      });

    exports.create = function (data, parent, options) {
      return new exports.Diff2DHistogramVis(data, parent, options);
    };
  }
)
;
