/**
 * Created by Holger Stitz on 22.03.2017.
 */

import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants, IChangeType, ChangeTypes} from './app_constants';
import {mixin, onDOMNodeRemoved} from 'phovea_core/src';
import {IAnyMatrix} from 'phovea_core/src/matrix';
import {ProductIDType} from 'phovea_core/src/idtype';
import {IDiffData} from './diff_heat_map';

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
  private $srcSlopes;
  private $dstSlopes;

  // cached data
  private data: IDiffData;
  private selectedTables: IAnyMatrix[];

  private options = {
    orientation: EOrientation.ROW
  };

  private slopeWidth = 30;

  private scale = d3.scale.linear().range([0, 200]);

  private selectionListener = (evt: any) => this.selectLine();

  constructor(public parent:Element, options:any) {
    this.options = mixin(this.options, options);

    this.$node = d3.select(parent)
      .append('svg')
      .classed('reorderView', true)
      .classed('fadeout', !ChangeTypes.REORDER.isActive);
  }

  init() {
    this.build();
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private build() {
    this.$srcSlopes = this.$node.append('g').classed('src slopes', true);
    this.$dstSlopes = this.$node.append('g').classed('dst slopes', true);
  }

  private attachListener() {
    onDOMNodeRemoved(<HTMLElement>this.$node.node(), () => {
      const old = this.getProductIDType();
      if (old) {
        old.off(ProductIDType.EVENT_SELECT_PRODUCT, this.selectionListener);
      }
    });
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
      this.clearContent();
    });

    events.on(AppConstants.EVENT_TIME_POINTS_SELECTED, () => {
      this.clearContent();
    });

    events.on(AppConstants.EVENT_DIFF_HEATMAP_LOADED, (evt, pair, diffData, scaleFactor:{x: number, y: number}) => {
      if(pair.length === 2) {
        this.data = diffData;
        this.selectedTables = pair;
        const idType = this.getProductIDType();
        if (idType) {
          idType.on(ProductIDType.EVENT_SELECT_PRODUCT, this.selectionListener);
        }
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

  private draw(src: IAnyMatrix, dst: IAnyMatrix, diffData, scaleFactor: {x: number, y: number}) {
    switch (this.options.orientation) {
      case EOrientation.COLUMN:
        this.scale.domain([0, Math.max(src.desc.size[1], dst.desc.size[1])]);
        this.scale.range([0, Math.max(src.desc.size[1], dst.desc.size[1]) * AppConstants.HEATMAP_CELL_SIZE * scaleFactor.x]);
        this.drawColumns(diffData.reorder.cols, scaleFactor.x);
        break;

      case EOrientation.ROW:
        this.scale.domain([0, Math.max(src.desc.size[0], dst.desc.size[0])]);
        this.scale.range([0, Math.max(src.desc.size[0], dst.desc.size[0]) * AppConstants.HEATMAP_CELL_SIZE * scaleFactor.y]);

        this.drawRows(this.$srcSlopes, diffData.reorder.rows, scaleFactor.y);

        // draw axis line for destination table
        this.$srcSlopes
          .append('line')
          .classed('axis', true)
          .attr('x1', this.slopeWidth)
          .attr('x2', this.slopeWidth)
          .attr('y1', 0)
          .attr('y2', dst.desc.size[0] * AppConstants.HEATMAP_CELL_SIZE * scaleFactor.y);

        this.drawRows(this.$dstSlopes, diffData.reorder.rows, scaleFactor.y);

        // draw axis line for source table
        this.$dstSlopes
          .attr('transform', `translate(${this.$node.property('clientWidth') - this.slopeWidth}, 0)`)
          .append('line')
          .classed('axis', true)
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', 0)
          .attr('y2', src.desc.size[0] * AppConstants.HEATMAP_CELL_SIZE * scaleFactor.y);

        break;
    }
  }

  private drawColumns(reorders:IReorderChange[], scaleFactor:number) {
    //
  }

  private drawRows($parent, reorders:IReorderChange[], scaleFactor:number) {

    this.$node.attr('height', this.scale.range()[1]);

    const $slopes = $parent.selectAll('line.slope').data(reorders, (d) => d.id);

    $slopes.enter().append('line').classed('slope', true);

    const centerShift = (AppConstants.HEATMAP_CELL_SIZE * scaleFactor * 0.5);

    $slopes
      .on('mouseenter', (d) => {
        this.markLine(d.id, true);
      })
      .on('mouseleave', (d) => {
        this.markLine(d.id, false);
      })
      .attr('title', (d) => `${d.id}: ${d.diff} (src: ${d.from}, dest: ${d.to})`)
      .transition()
      .attr('x1', 0)
      .attr('x2', this.slopeWidth)
      .attr('y1', (d) => this.scale(d.from) + centerShift)
      .attr('y2', (d) => this.scale(d.to) + centerShift);

    $slopes.exit().remove();
  }

  private markLine(id:string, isActive:boolean, cssClass:string = 'hovered') {
    this.$srcSlopes.selectAll('line.slope')
      .each(function(d){
        if(d.id === id) {
          d3.select(this).classed(cssClass, isActive);
        }
      });

    this.$dstSlopes.selectAll('line.slope')
      .each(function(d){
        if(d.id === id) {
          d3.select(this).classed(cssClass, isActive);
        }
      });
  }

  private getProductIDType(): ProductIDType {
    if (this.selectedTables) {
      return this.selectedTables[0].producttype;
    }
    return null;
  }

  private selectLine() {
    const cssClass = 'selected';
    const selections = this.selectedTables[0].producttype.productSelections();

    this.$srcSlopes.selectAll('line.slope').classed(cssClass, false);
    this.$dstSlopes.selectAll('line.slope').classed(cssClass, false);

    const rowLookup = new Map<number, number>();
    this.data.union.r_ids.map((d,i) => rowLookup.set(d,i));
    const colLookup = new Map<number, number>();
    this.data.union.c_ids.map((d,i) => colLookup.set(d,i));

    selections.forEach((cell) => {
      if (cell.isUnbound) {
        const rowIds = cell.dim(0);
        const colIds = cell.dim(1);

        // highlight cells
        if (rowIds.isUnbound && colIds.isUnbound) {
          // just support all for now


        // highlight cols
        } else if (rowIds.isUnbound) {
          //colIds.forEach((colId) => {
          //  const col = colLookup.get(colId);
          //});

        // highlight rows
        } else if (colIds.isUnbound) {
          rowIds.forEach((rowId) => {
            const row = rowLookup.get(rowId);
            this.markLine(this.data.union.ur_ids[row], true, cssClass);
          });
        }
      }
    });
  }

  private clearContent() {
    this.$srcSlopes.selectAll('*').remove();
    this.$dstSlopes.selectAll('*').remove();
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
