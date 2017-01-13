/**
 * Created by Christina Niederer on 12.01.2017.
 */

//import * as events from 'phovea_core/src/event';
import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import * as ajax from 'phovea_core/src/ajax';


/**
 * Shows a simple heat map for a given data set.
 */
class DiffHeatMap implements IAppView {

  //main div
  private $node;

  private items;


  private colorLow = '#d8b365';
  private colorMed = 'white';
  private colorHigh = '#8da0cb';
  private colorMerged = '#B2DF8A';//light green
  private colorSplit = '#FB9A99'; //light red


  private static getURL(pair) {
    const bin_cols = 0; // -1 = aggregate the whole table
    const bin_rows = 0; // -1 = aggregate the whole table
    const direction = 2; // 2 = rows + columns
    const changes = 'structure,content';
    return `/taco/diff_log/${pair[0]}/${pair[1]}/${bin_cols}/${bin_rows}/${direction}/${changes}`;
  }


  constructor(public parent:Element, private options:any) {

    this.$node = d3.select(parent)
      .append('div')
      .classed('diffheatmap', true);


  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<HeatMap>}
   */
  init() {
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    //attach event listener
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items) => this.updateItems(items));

   events.on(AppConstants.EVENT_OPEN_DIFF_HEATMAP, (evt, pair) => {

      this.requestData();
    });


  }

  private updateItems(items) {
    this.items = items;

   //this.requestData().then((data) => this.drawDiffHeatmap(data));
    //this.requestData();

  }


  private requestData() {
     console.log('event');
   return d3.pairs(this.items)
      .map((pair) => {
        //console.log(pair);
        let ids = pair.map((d:any) => d.item.desc.id);
        //console.log(ids, pair);
        // return Promise.all([ajax.getAPIJSON(DiffHeatMap.getURL(ids)), pair, ids])
        return ajax.getAPIJSON(DiffHeatMap.getURL(ids))
          .then((args) => {
            this.drawDiffHeatmap(args);
          });
      });

  }


  private drawDiffHeatmap(data) {

    let that = this;
    // console.log('data get from draw function', data);
    //console.log('option', this.options);
   //console.log('colorDomain', this.options.colorDomain);

     /*const colorScale = d3.scale.linear()
     //.domain([-1, 0, 1])
     .domain([colorDomain[0], 0, colorDomain[1]]) // these are from main
     .clamp(true)
     .range([this.colorLow, this.colorMed, this.colorHigh]);*/

    //that.h_data.then(function (operations, directions, data) {
    // var height = gridSize[1];
    // var width = gridSize[0];

    let height = 50;
    let width = 50;

    //console.log('Data', data);
    //height of each row in the heatmap
    var h = height / data.union.ur_ids.length,
    //width of each column in the heatmap
      w = width / data.union.uc_ids.length;


    var root = this.$node.append("div")// g.margin
      .attr("class", "taco-table")
      .style("width", width + 'px')
      .style("height", height + 'px')

      .style("background-color", "white")
      .style("transform-origin", "0 0");


    console.log('data', data);

   /*root.selectAll(".taco-added-row")
      .data(data.structure.added_rows)
      .enter()
      .append("div")
      .attr("class", "taco-added-row")
      .attr("class", "struct-add-color")
      .attr("title", function (d) {
        return d.id;
      })
      .style("left", 0 + "px")
      .style("top", function (d) {
        var y = d.pos;
        return (y !== -1 ? y * h : null) + "px";
      })
      .style("width", width + "px")
      .style("height", h + "px");


    //visualizing the diff

     var addedRows = root.selectAll(".taco-added-row")
     .data(data.structure.added_rows)
     .enter()
     .append("div")
     .attr("class", "taco-added-row")
     .attr("class", "struct-add-color")
     .attr("title", function(d){return d.id;})
     .style("left", 0 + "px")
     .style("top", function (d) {
     var y = d.pos;
     return (y !== -1 ? y * h : null) + "px";
     })
     .style("width", width + "px")
     .style("height", h + "px");


     var addedCols = root.selectAll(".taco-added-col")
     .data(data.structure.added_cols)
     .enter()
     .append("div")
     .attr("title", function(d){return d.id;})
     .attr("class", "taco-added-col")
     .attr("class", "struct-add-color")
     .style("top", 0 + "px")
     .style("left", function (d) {
     var x = d.pos;
     return (x !== -1 ? x * w : null) + "px";
     })
     .style("width", w + "px")
     .style("height", height + "px");

     var deletedRows = root.selectAll(".taco-del-row")
     .data(data.structure.deleted_rows)
     .enter()
     .append("div")
     .attr("class", "taco-del-row")
     .attr("class", "struct-del-color")
     .attr("title", function(d){return d.id})
     .style("left", 0 + "px")
     .style("top", function (d) {
     var y = d.pos;
     return (y !== -1 ? y * h : null) + "px";
     })
     .style("width", width + "px")
     .style("height", h + "px");


     var deletedCols = root.selectAll(".taco-del-col")
     .data(data.structure.deleted_cols)
     .enter()
     .append("div")
     .attr("class", "taco-del-col")
     .attr("class", "struct-del-color")
     .attr("title", function(d){return d.id;})
     .style("top", 0 + "px")
     .style("left", function (d) {
     var x = d.pos;
     return (x !== -1 ? x * w : null) + "px";
     })
     .style("width", w + "px")
     .style("height", height + "px");


     var chCells = root.selectAll(".taco-ch-cell").data(data.content);
     chCells.enter()
     .append("div")
     .attr("class", "taco-ch-cell")
     .attr("title", function(d){
     return "(" + d.row + "," + d.col + ": " + d.diff_data + ")" ;
     })
     .style("top", function (d) {
     //var y = that.row_ids.indexOf(d.row);
     var y = d.rpos;
     return (y !== -1 ? y * h : null) + "px";
     })
     .style("left", function (d) {
     //var x = that.col_ids.indexOf(d.col);
     var x = d.cpos;
     return (x !== -1 ? x * w : null) + "px";
     })
     .style("width", w + "px")
     .style("height", h + "px")
     .style("background-color", function (d) {
     return colorScale(d.diff_data);
     });

     var mergedCols = root.selectAll(".taco-mer-col")
     .data(data.merge.merged_cols)
     .enter()
     .append("div")
     .attr("class", "taco-mer-col")
     .attr("title", function(d){
     return "(" + d.id + "," + d.merge_id + ")" ;
     })

     .style("top", 0 + "px")
     .style("left", function (d) {
     var x = d.pos;
     return (x !== -1 ? x * w : null) + "px";
     })
     .style("width", w + "px")
     .style("height", height + "px")
     .style("background-color", function (d) {
     return d.is_added ? this.colorMerged : this.colorSplit
     })
     .style("z-index", function (d) {
     return d.is_added ? "0" : "1"
     });

     var mergedRows = root.selectAll(".taco-mer-row")
     .data(data.merge.merged_rows)
     .enter()
     .append("div")
     .attr("class", "taco-mer-row")
     .attr("title", function(d){
     return "(" + d.id + "," + d.merge_id + ")" ;
     })
     .style("zIndex", function (d) {
     return d.is_merge ? "0" : "1"
     })

     .style("left", 0 + "px")
     .style("top", function (d) {
     //var y = that.row_ids.indexOf(d);
     var y = d.pos;
     return (y !== -1 ? y * h : null) + "px";
     })
     .style("width", width + "px")
     .style("height", h + "px")
     .style("background-color", function (d) {
     return d.is_added ? this.colorMerged : this.colorSplit
     })
     .style("z-index", function (d) {
     return d.is_added ? "0" : "1"
     });

     var splitCols = root.selectAll(".taco-spl-col")
     .data(data.merge.split_cols)
     .enter()
     .append("div")
     .attr("class", "taco-spl-col")
     .attr("title", function(d){
     return "(" + d.id + "," + d.merge_id + ")" ;
     })
     .style("z-index", function (d) {
     return d.is_added ? "0" : "1"
     })

     .style("top", 0 + "px")
     .style("left", function (d) {
     //var x = that.col_ids.indexOf(d);
     var x = d.pos;
     return (x !== -1 ? x * w : null) + "px";
     })
     .style("width", w + "px")
     .style("height", height + "px")
     .style("background-color", function (d) {
     return (d.is_added ? this.colorMerged : this.colorSplit)
     });


     var splitRows = root.selectAll(".taco-spl-row")
     .data(data.merge.split_rows)
     .enter()
     .append("div")
     .attr("class", "taco-spl-row")
     .attr("title", function(d){
     return "(" + d.id + "," + d.merge_id + ")" ;
     })
     .style("z-index", function (d) {
     return d.is_added ? "0" : "1"
     })

     .style("left", 0 + "px")
     .style("top", function (d) {
     //var y = that.row_ids.indexOf(d);
     var y = d.pos;
     return (y !== -1 ? y * h : null) + "px";
     })
     .style("width", width + "px")
     .style("height", h + "px")
     .style("background-color", function (d) {
     return (d.is_added ? this.colorMerged : this.colorSplit)
     });*/
    //}
    // }

    //});

  }


}


/**
 * Factory method to create a new DiffHeatMap instance
 * @param parent
 * @param options
 * @returns {DiffHeatMap}
 */
export function create(parent:Element, options:any) {
  return new DiffHeatMap(parent, options);
}
