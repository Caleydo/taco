/**
 * Created by Christina Niederer on 12.01.2017.
 */

import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import * as ajax from 'phovea_core/src/ajax';
import {AppConstants, IChangeType, ChangeTypes} from './app_constants';
import {get} from 'phovea_core/src/plugin';


/**
 * Shows a simple heat map for a given data set.
 */
class DiffHeatMap implements IAppView {

  //main div
  private $node;

  // cached data
  private data;

  private colorLow = '#d8b365';
  private colorMed = 'white';
  private colorHigh = '#8da0cb';

  private borderWidth = 2;
  private margin = 2 * 50;

  private scaleFactor = 1;

  private static getJSON(pair) {
    const operations = ChangeTypes.forURL();
    return ajax.getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${operations}/diff_heat_map`);
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
    this.build();
    this.attachListener();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private build() {
    // wrap view ids from package.json as plugin and load the necessary files
    get(AppConstants.VIEW, 'ReorderView')
      .load()
      .then((plugin) => {
        const view = plugin.factory(
          this.$node.node(), // parent node
          {} // options
        );
        return view.init();
      });
  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
      this.clearContent();
    });

    events.on(AppConstants.EVENT_TIME_POINTS_SELECTED, () => {
      this.clearContent();
    });

    //attach event listener
    events.on(AppConstants.EVENT_OPEN_DIFF_HEATMAP, (evt, items) => {
      if(items.length !== 2) {
        return;
      }

      this.$node.selectAll('div').remove();

      const idsSelectedTable = items.map((d:any) => d.desc.id);
      DiffHeatMap.getJSON(idsSelectedTable)
        .then((data) => {
          this.data = data;
          this.drawDiffHeatmap(this.data);
          events.fire(AppConstants.EVENT_DIFF_HEATMAP_LOADED, items, data, this.scaleFactor);
        });
    });

    events.on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
    events.on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));

    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', () => this.drawDiffHeatmap(this.data));
  }

  private toggleChangeType(changeType:IChangeType) {
    switch(changeType.type) {
      case ChangeTypes.REMOVED.type:
        this.$node.selectAll('.removed-color').classed('noColorClass', !changeType.isActive);
        break;

      case ChangeTypes.ADDED.type:
        this.$node.selectAll('.added-color').classed('noColorClass', !changeType.isActive);
        break;

      case ChangeTypes.CONTENT.type:
        this.$node.selectAll('.added-color').classed('noColorClass', !changeType.isActive);
        break;
    }

    this.$node.selectAll(`div.ratio > .${changeType.type}`).classed('noColorClass', !changeType.isActive);
  }

  private drawDiffHeatmap(data) {
    const colorScale = d3.scale.linear<string>()
      .domain([-1, 0, 1])
      .range([this.colorLow, this.colorMed, this.colorHigh])
      .clamp(true);

    const dataWidth = AppConstants.HEATMAP_CELL_SIZE * data.union.uc_ids.length;
    const dataHeight = AppConstants.HEATMAP_CELL_SIZE * data.union.ur_ids.length;

    this.scaleFactor = (this.$node.property('clientWidth') - this.margin) / dataWidth;

    const cellSize = AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor;
    const width = dataWidth * this.scaleFactor;
    const height = dataHeight * this.scaleFactor;

    let $root = this.$node.select('div.taco-table > div');

    if($root.size() === 0) {
      $root = this.$node.append('div')
        .attr('class', 'taco-table')
        .append('div')
        .classed('transform', true);
    }

    this.$node.select('div.taco-table')
      .style('width', (width + this.borderWidth) + 'px')
      .style('height', (height + this.borderWidth) + 'px');

    if (data.structure) {
      this.drawRows($root, data.structure.added_rows, cellSize, width, 'taco-added-row', 'added-color');
      this.drawCols($root, data.structure.added_cols, cellSize, height, 'taco-added-col', 'added-color');

      this.drawRows($root, data.structure.deleted_rows, cellSize, width, 'taco-del-row', 'removed-color');
      this.drawCols($root, data.structure.deleted_cols, cellSize, height, 'taco-del-col', 'removed-color');
    }

    if (data.content) {
      const chCells = $root.selectAll('.content-color').data(data.content);

      chCells.enter().append('div')
        .classed('content-color', true)
        .attr('title', (d) => {
          return '(' + d.row + ',' + d.col + ': ' + d.diff_data + ')';
        })
        .style('z-index', 1000)
        .style('background-color', (d) => colorScale(d.diff_data));

      chCells
        .style('top', (d) => (d.rpos !== -1 ? d.rpos * cellSize : null) + 'px')
        .style('left', (d) => (d.cpos !== -1 ? d.cpos * cellSize : null) + 'px')
        .style('width', cellSize + 'px')
        .style('height', cellSize + 'px');
    }
  }

  private drawCols($root, data, cellSize:number, height:number, cssClass:string, colorClass:string) {
    if(data === undefined) {
      return;
    }

    const $cols = $root.selectAll('.' + cssClass)
      .data(data, (d) => d.id);

    $cols.enter().append('div')
      .attr('title', (d) => d.id)
      .classed(cssClass, true)
      .classed(colorClass, true)
      .style('top', 0);

    $cols
      .style('left', (d) => (d.pos !== -1 ? d.pos * cellSize : null) + 'px')
      .style('width', cellSize + 'px')
      .style('height', height + 'px');
  }

  private drawRows($root, data, cellSize:number, width:number, cssClass:string, colorClass:string) {
    if(data === undefined) {
      return;
    }

    const $rows = $root.selectAll('.' + cssClass)
          .data(data, (d) => d.id);

    $rows.enter().append('div')
      .classed(cssClass, true)
      .classed(colorClass, true)
      .attr('title', (d) => d.id)
      .style('left', 0);

    $rows
      .style('top', (d) => (d.pos !== -1 ? d.pos * cellSize : null) + 'px')
      .style('width', width + 'px')
      .style('height', cellSize + 'px');
  }

  private clearContent() {
    this.$node.select('.taco-table').remove();
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
