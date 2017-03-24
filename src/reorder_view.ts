/**
 * Created by Holger Stitz on 22.03.2017.
 */

import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants, IChangeType, ChangeTypes} from './app_constants';
import {mixin} from 'phovea_core/src';

export enum EOrientation {
  COLUMN,
  ROW
}

interface IReorderChange {
  /**
   * Row or column ID
   */
  id: string;
  /**
   * Difference between from and to
   */
  diff: number;
  /**
   * Position index in source table
   */
  from: number;
  /**
   * Position index in destination table
   */
  to: number;
}

class ReorderView implements IAppView {

  private $node;
  private $slopes;

  private options = {
    orientation: EOrientation.ROW
  };

  private scale = d3.scale.linear().range([0, 200]);

  constructor(public parent:Element, options:any) {
    this.options = mixin(this.options, options);

    this.$node = d3.select(parent)
      .append('svg')
      .classed('reorderView', true);
  }

  init() {
    this.build();
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private build() {
    this.$slopes = this.$node.append('g').classed('slopes', true);
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
      this.clearContent();
    });

    events.on(AppConstants.EVENT_TIME_POINTS_SELECTED, () => {
      this.clearContent();
    });

    events.on(AppConstants.EVENT_DIFF_HEATMAP_LOADED, (evt, pair, diffData, scaleFactor:number) => {
      if(pair.length === 2) {
        this.draw(pair[0], pair[1], diffData, scaleFactor);
      }
    });

    events.on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType: IChangeType) => {
      if(changeType === ChangeTypes.REORDER) {
        this.$node.classed('fadeout', !changeType.isActive);
      }
    });

    events.on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType: IChangeType) => {
      if(changeType === ChangeTypes.REORDER) {
        this.$node.classed('fadeout', !changeType.isActive);
      }
    });
  }

  private draw(src, dst, diffData, scaleFactor:number) {
    switch (this.options.orientation) {
      case EOrientation.COLUMN:
        this.scale.domain([0, Math.max(src.desc.size[1], dst.desc.size[1])]);
        this.scale.range([0, Math.max(src.desc.size[1], dst.desc.size[1]) * AppConstants.HEATMAP_CELL_SIZE * scaleFactor]);
        this.drawColumns(diffData.reorder.cols, scaleFactor);
        break;

      case EOrientation.ROW:
        this.scale.domain([0, Math.max(src.desc.size[0], dst.desc.size[0])]);
        this.scale.range([0, Math.max(src.desc.size[0], dst.desc.size[0]) * AppConstants.HEATMAP_CELL_SIZE * scaleFactor]);
        this.drawRows(diffData.reorder.rows, scaleFactor);
        break;
    }
  }

  private drawColumns(reorders:IReorderChange[], scaleFactor:number) {
    //
  }

  private drawRows(reorders:IReorderChange[], scaleFactor:number) {

    this.$node.attr('height', this.scale.range()[1]);
    const width = this.$node.property('clientWidth')-1;

    const $slopes = this.$slopes.selectAll('line').data(reorders, (d) => d.id);

    $slopes.enter().append('line');

    $slopes
      .transition()
      .attr('x1', 0)
      .attr('x2', width)
      .attr('title', (d) => `${d.id}: ${d.diff} (src: ${d.from}, dest: ${d.to})`)
      .attr('y1', (d) => this.scale(d.from) - (AppConstants.HEATMAP_CELL_SIZE * scaleFactor * 0.5))
      .attr('y2', (d) => this.scale(d.to) - (AppConstants.HEATMAP_CELL_SIZE * scaleFactor * 0.5));

    $slopes.exit().remove();
  }

  private clearContent() {
    this.$slopes.selectAll('*').remove();
  }

}


/**
 * Factory method to create a new ReorderView instance
 * @param parent
 * @param options
 * @returns {ReorderView}
 */
export function create(parent:Element, options:any) {
  return new ReorderView(parent, options);
}
