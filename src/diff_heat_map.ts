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

    events.on(AppConstants.EVENT_OPEN_DIFF_HEATMAP, (evt, items) => {
      this.diffHeatmap();
    });


  }

  private updateItems(items) {
    this.items = items;
    //this.requestData();
  }

  private diffHeatmap() {
    let dataPromise = this.requestData();

    Promise.all(dataPromise).then((data) => {
      this.drawDiffHeatmap(data);
    });
  }


  private requestData() {
    return d3.pairs(this.items)
      .map((pair) => {
        //console.log(pair);
        let ids = pair.map((d:any) => d.item.desc.id);
        //console.log(ids, pair);
        // return Promise.all([ajax.getAPIJSON(DiffHeatMap.getURL(ids)), pair, ids])
        return ajax.getAPIJSON(DiffHeatMap.getURL(ids))
          .then((args) => {
            // console.log('args', args);
            //this.drawDiffHeatmap(args);
            return args;
          });
      });

  }


  private drawDiffHeatmap(data) {

    let that = this;

    /*const colorScale = d3.scale.linear()
     //.domain([-1, 0, 1])
     .domain([colorDomain[0], 0, colorDomain[1]]) // these are from main
     .clamp(true)
     .range([this.colorLow, this.colorMed, this.colorHigh]);*/

    let diff_parent = that.$node.node();

    let grid_height = diff_parent.getBoundingClientRect().height - 3;
    let grid_width = diff_parent.getBoundingClientRect().width;

    //console.log('grid-height, grid-width', grid_height, grid_width);

    let height = grid_height;
    let width = grid_width + 100;

    let h = 0;
    let w = 0;

    var root = this.$node.append("div")// g.margin
      .attr("class", "taco-table")
      .style("width", width + 'px')
      .style("height", height + 'px')

      .style("background-color", "white")
      .style("transform-origin", "0 0");

    //visualizing the diff
    data.forEach(function (d) {
      h = height / d.union.ur_ids.length;

      //width of each column in the heatmap
      w = width / d.union.uc_ids.length;

      var addedRows = root.selectAll(".taco-added-row")
        .data(d.structure.added_rows)
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

      var addedCols = root.selectAll(".taco-added-col")
        .data(d.structure.added_cols)
        .enter()
        .append("div")
        .attr("title", function (d) {
          return d.id;
        })
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
        .data(d.structure.deleted_rows)
        .enter()
        .append("div")
        .attr("class", "taco-del-row")
        .attr("class", "struct-del-color")
        .attr("title", function (d) {
          return d.id
        })
        .style("left", 0 + "px")
        .style("top", function (d) {
          var y = d.pos;
          return (y !== -1 ? y * h : null) + "px";
        })
        .style("width", width + "px")
        .style("height", h + "px");


      var deletedCols = root.selectAll(".taco-del-col")
        .data(d.structure.deleted_cols)
        .enter()
        .append("div")
        .attr("class", "taco-del-col")
        .attr("class", "struct-del-color")
        .attr("title", function (d) {
          return d.id;
        })
        .style("top", 0 + "px")
        .style("left", function (d) {
          var x = d.pos;
          return (x !== -1 ? x * w : null) + "px";
        })
        .style("width", w + "px")
        .style("height", height + "px");

      var chCells = root.selectAll(".taco-ch-cell").data(d.content);
      chCells.enter()
        .append("div")
        .attr("class", "taco-ch-cell")
        .attr("title", function (d) {
          return "(" + d.row + "," + d.col + ": " + d.diff_data + ")";
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
        .style("width", w * 10 + "px")
        .style("height", h * 10 + "px")
        .style('background-color', 'red');
      /* .style("background-color", function (d) {
       return colorScale(d.diff_data);
       });*/
    });
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
