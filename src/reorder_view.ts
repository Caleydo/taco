/**
 * Created by Holger Stitz on 22.03.2017.
 */

import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
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
  private $srcAxis;
  private $destAxis;
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

    this.$srcAxis = this.$node.append('line').classed('src', true);
    this.$destAxis = this.$node.append('line').classed('dest', true);
    this.$slopes = this.$node.append('g').classed('slopes', true);
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DIFF_HEATMAP_LOADED, (evt, pair, diffData) => {
      if(pair.length === 2) {
        this.draw(pair[0], pair[1], diffData);
      }
    });
  }

  private draw(src, dst, diffData) {
    console.log(src, dst);
    switch (this.options.orientation) {
      case EOrientation.COLUMN:
        this.scale.domain([0, Math.max(src.desc.size[1], dst.desc.size[1])]);
        this.drawRows(src.desc.size[1], dst.desc.size[1], diffData.reorder.cols);
        break;

      case EOrientation.ROW:
        this.scale.domain([0, Math.max(src.desc.size[0], dst.desc.size[0])]);
        this.drawRows(src.desc.size[0], dst.desc.size[0], diffData.reorder.rows);
        break;
    }
  }

  private drawColumns(srcSize, dstSize, reorders:IReorderChange[]) {
    //
  }

  private drawRows(srcSize, dstSize, reorders:IReorderChange[]) {
    const width = this.$node.property('clientWidth')-1;

    /*this.$srcAxis
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', this.scale(0))
      .attr('y2', this.scale(srcSize));

    this.$destAxis
      .attr('x1', width)
      .attr('x2', width)
      .attr('y1', this.scale(0))
      .attr('y2', this.scale(dstSize));*/

    const $slopes = this.$slopes.selectAll('line').data(reorders, (d) => d.id);

    $slopes.enter().append('line');

    $slopes
      .transition()
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => this.scale(d.from))
      .attr('y2', (d) => this.scale(d.to));

    $slopes.exit().remove();
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
