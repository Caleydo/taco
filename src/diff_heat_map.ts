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
          this.drawDiffHeatmap(data);
          events.fire(AppConstants.EVENT_DIFF_HEATMAP_LOADED, items, data, this.scaleFactor);
        });
    });

    events.on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
    events.on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
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

    const root = this.$node.append('div')
      .attr('class', 'taco-table')
      .style('width', (width + this.borderWidth) + 'px')
      .style('height', (height + this.borderWidth) + 'px')
      .append('div')
      //.style('transform-origin', '0 0')
      //.style('transform', `scale(${scaleFactor})`)
      .classed('transform', true);

    if (data.structure) {

      if(data.structure.added_rows) {
        const addedRows = root.selectAll('.taco-added-row')
          .data(data.structure.added_rows)
          .enter()
          .append('div')
          .attr('class', 'taco-added-row')
          .attr('class', 'added-color')
          .attr('title', (d) => d.id)
          .style('left', 0 + 'px')
          .style('top', function (d) {
            const y = d.pos;
            return (y !== -1 ? y * cellSize : null) + 'px';
          })
          .style('width', width + 'px')
          .style('height', cellSize + 'px');
      }

      if(data.structure.added_cols) {
        const addedCols = root.selectAll('.taco-added-col')
          .data(data.structure.added_cols)
          .enter()
          .append('div')
          .attr('title', (d) => d.id)
          .attr('class', 'taco-added-col')
          .attr('class', 'added-color')
          .style('top', 0 + 'px')
          .style('left', (d) => {
            const x = d.pos;
            return (x !== -1 ? x * cellSize : null) + 'px';
          })
          .style('width', cellSize + 'px')
          .style('height', height + 'px');
      }

      if(data.structure.deleted_rows) {
        const deletedRows = root.selectAll('.taco-del-row')
          .data(data.structure.deleted_rows)
          .enter()
          .append('div')
          .attr('class', 'taco-del-row')
          .attr('class', 'removed-color')
          .attr('title', (d) => d.id)
          .style('left', 0 + 'px')
          .style('top', (d) => {
            const y = d.pos;
            return (y !== -1 ? y * cellSize : null) + 'px';
          })
          .style('width', width + 'px')
          .style('height', cellSize + 'px');
      }

      if(data.structure.deleted_cols) {
        const deletedCols = root.selectAll('.taco-del-col')
          .data(data.structure.deleted_cols)
          .enter()
          .append('div')
          .attr('class', 'taco-del-col')
          .attr('class', 'removed-color')
          .attr('title', (d) => d.id)
          .style('top', 0 + 'px')
          .style('left', (d) => {
            const x = d.pos;
            return (x !== -1 ? x * cellSize : null) + 'px';
          })
          .style('width', cellSize + 'px')
          .style('height', height + 'px');
      }
    }

    if (data.content) {
      const chCells = root.selectAll('.content-color').data(data.content);
      chCells.enter()
        .append('div')
        .attr('class', 'content-color')
        .attr('title', (d) => {
          return '(' + d.row + ',' + d.col + ': ' + d.diff_data + ')';
        })
        .style('top', (d) => {
          //var y = that.row_ids.indexOf(d.row);
          const y = d.rpos;
          return (y !== -1 ? y * cellSize : null) + 'px';
        })
        .style('left', (d) => {
          //var x = that.col_ids.indexOf(d.col);
          const x = d.cpos;
          return (x !== -1 ? x * cellSize : null) + 'px';
        })
        .style('width', cellSize + 'px')
        .style('height', cellSize + 'px')
        .style('background-color', 'red')
        .style('z-index', 1000)
        .style('background-color', (d) => colorScale(d.diff_data));
    }
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
