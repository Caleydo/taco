/**
 * Created by Christina Niederer on 12.01.2017.
 */

import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import * as ajax from 'phovea_core/src/ajax';
import {toSelectOperation, ProductIDType} from 'phovea_core/src/idtype';
import {cell} from 'phovea_core/src/range';
import {onDOMNodeRemoved} from 'phovea_core/src';
import {IAnyMatrix} from 'phovea_core/src/matrix';
import {
  AppConstants, IChangeType, ChangeTypes, COLOR_ADDED, COLOR_DELETED,
  COLOR_CONTENT_NEGATIVE, COLOR_CONTENT_POSITIVE, COLOR_NO_CHANGE
} from './app_constants';
import {get} from 'phovea_core/src/plugin';

interface IDiffRow {
  id: string;
  pos: number;
}

interface IDiffData {
  union: {
    // uids of the columns, ala colids()
    c_ids: number[];
    r_ids: number[];
    //names of the columsn, ala cols()
    uc_ids: string[];
    ur_ids: string[];
  };

  structure: {
    added_rows: IDiffRow[];
    added_cols: IDiffRow[];
    deleted_rows: IDiffRow[];
    deleted_cols: IDiffRow[];
  };

  content: {
    cpos: number;
    rpos: number;
    row: string;
    col: string;
    diff_data: number;
  }[];
}

/**
 * Shows a simple heat map for a given data set.
 */
class DiffHeatMap implements IAppView {

  //main div
  private $node: d3.Selection<any>;

  // cached data
  private data: IDiffData;
  private selectedTables: IAnyMatrix[];

  private readonly contentScale = d3.scale.linear<string>()
      .domain([-1, 0, 1])
      .range([COLOR_CONTENT_NEGATIVE, COLOR_NO_CHANGE, COLOR_CONTENT_POSITIVE])
      .clamp(true);

  private borderWidth = 2;
  private margin = 2 * 50;

  private scaleFactor = { x: 1, y: 1};

  private selectionListener = (evt: any) => this.update();

  private activeChangeTypes = new Set<string>([ChangeTypes.ADDED.type, ChangeTypes.CONTENT.type, ChangeTypes.REMOVED.type]);

  private static getJSON(pair: string[]) {
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

    onDOMNodeRemoved(<HTMLElement>this.$node.node(), () => {
      const old = this.getProductIDType();
      if (old) {
        old.off(ProductIDType.EVENT_SELECT_PRODUCT, this.selectionListener);
      }
    });

    //attach event listener
    events.on(AppConstants.EVENT_OPEN_DIFF_HEATMAP, (evt, items: IAnyMatrix[]) => {
      if(items.length !== 2) {
        return;
      }

      // cleanup
      const old = this.getProductIDType();
      if (old) {
        old.off(ProductIDType.EVENT_SELECT_PRODUCT, this.selectionListener);
      }

      this.$node.selectAll('canvas').remove();

      const idsSelectedTable = items.map((d) => d.desc.id);
      DiffHeatMap.getJSON(idsSelectedTable)
        .then((data) => {
          d3.select(this.$node.node().parentElement).classed('heatmap-has-column-labels', false);
          this.data = data;
          this.selectedTables = items;
          const idType = this.getProductIDType();
          if (idType) {
            idType.on(ProductIDType.EVENT_SELECT_PRODUCT, this.selectionListener);
          }
          this.drawDiffHeatmap(this.data);
          events.fire(AppConstants.EVENT_DIFF_HEATMAP_LOADED, this.selectedTables, this.data, this.scaleFactor);
        });
    });

    events.on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
    events.on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));

    events.on(AppConstants.EVENT_RESIZE, () => {
      if(this.data) {
        this.drawDiffHeatmap(this.data);
        events.fire(AppConstants.EVENT_DIFF_HEATMAP_LOADED, this.selectedTables, this.data, this.scaleFactor);
      }
    });
  }

  private toggleChangeType(changeType:IChangeType) {
    if(!this.data) {
      return;
    }

    if(changeType === ChangeTypes.CONTENT) {
      this.$node.select('div.legend').classed('hidden', !changeType.isActive);
    }

    if (changeType.isActive) {
      this.activeChangeTypes.add(changeType.type);
    } else {
      this.activeChangeTypes.delete(changeType.type);
    }
    this.update();

    //this.$node.selectAll(`div.ratio > .${changeType.type}`).classed('noColorClass', !changeType.isActive);
  }

  private getProductIDType(): ProductIDType {
    if (this.selectedTables) {
      return this.selectedTables[0].producttype;
    }
    return null;
  }

  private drawDiffHeatmap(data: IDiffData) {
    this.drawLegend(data);

    const dataWidth = AppConstants.HEATMAP_CELL_SIZE * data.union.uc_ids.length;
    const dataHeight = AppConstants.HEATMAP_CELL_SIZE * data.union.ur_ids.length;

    this.scaleFactor.x = (this.$node.property('clientWidth') - this.margin) / dataWidth;
    this.scaleFactor.y = (this.$node.property('clientHeight')) / dataHeight;


    const width = dataWidth * this.scaleFactor.x;
    const height = dataHeight * this.scaleFactor.y;

    let $root = this.$node.select('canvas.taco-table');

    if($root.empty()) {
      $root = this.$node.append('canvas')
        .attr('class', 'taco-table');
    }

    $root
      .attr('width', width)
      .attr('height', height);

    this.handleTooltip($root, data, AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor.x, AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor.y);
    this.render(<HTMLCanvasElement>$root.node(), data);
  }

  private handleTooltip($root: d3.Selection<any>, data: IDiffData, scaleFactorX: number, scaleFactorY: number) {
    const toIndices = (x: number, y: number) => {
      const col = Math.round(x / scaleFactorX + 0.5) - 1;
      const row = Math.round(y / scaleFactorY + 0.5) - 1;
      return {col, row};
    };

    const findValue = (col: number, row: number) => {
      if (data.structure) {
        // inverse order of rendering
        if (data.structure.deleted_cols.some((a) => a.pos === col)) {
          return `column deleted`;
        }
        if (data.structure.deleted_rows.some((a) => a.pos === row)) {
          return `row deleted`;
        }
        if (data.structure.added_cols.some((a) => a.pos === col)) {
          return `column added`;
        }
        if (data.structure.added_rows.some((a) => a.pos === row)) {
          return `row added`;
        }
      }
      if (data.content) {
        const item = data.content.find((d) => d.cpos === col && d.rpos === row);
        if (item) {
          return 'content change: ' + item.diff_data;
        }
      }
      return 'no change';
    };
    const updateTooltip = (x: number, y: number) => {
      const {col, row} = toIndices(x, y);
      const rowName = data.union.ur_ids[row];
      const colName = data.union.uc_ids[col];
      $root.attr('title', `${rowName} / ${colName}: ${findValue(col, row)}`);
    };

    let timer = -1;
    $root.on('mousemove', () => {
      const evt = <MouseEvent>d3.event;
      clearTimeout(timer);
      timer = setTimeout(updateTooltip.bind(this, evt.offsetX, evt.offsetY), 100);
    }).on('mouseleave', () => {
      clearTimeout(timer);
      timer = -1;
    }).on('click', () => {
      const evt = <MouseEvent>d3.event;
      const {col, row} = toIndices(evt.offsetX, evt.offsetY);
      const colId = data.union.c_ids[col];
      const rowId = data.union.r_ids[row];
      const idType = this.getProductIDType();
      if (idType) {
        idType.select([cell(rowId, colId)], toSelectOperation(evt));
      }
    });

  }

  private update() {
    this.render(<HTMLCanvasElement>this.$node.select('canvas').node(), this.data);
  }

  private render(canvas: HTMLCanvasElement, data: IDiffData) {
    const ctx = canvas.getContext('2d');

    ctx.msImageSmoothingEnabled = false;
    //if (context.hasOwnProperty('imageSmoothingEnabled')) {
    (<any>ctx).imageSmoothingEnabled = false;

    const totalWidth = AppConstants.HEATMAP_CELL_SIZE * data.union.uc_ids.length * this.scaleFactor.x;
    const totalHeight = AppConstants.HEATMAP_CELL_SIZE * data.union.ur_ids.length * this.scaleFactor.y;

    ctx.clearRect(0, 0, totalWidth, totalHeight);

    ctx.save();
    const scaleFactorX = AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor.x;
    const scaleFactorY = AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor.y;

    let width = data.union.uc_ids.length;
    let height = data.union.ur_ids.length;

    // substract rows and cols for invisible change types
    if(this.activeChangeTypes.has(ChangeTypes.ADDED.type) === false) {
      width -= data.structure.added_cols.length;
    }

    if(this.activeChangeTypes.has(ChangeTypes.REMOVED.type) === false) {
      width -= data.structure.deleted_cols.length;
    }

    if(this.activeChangeTypes.has(ChangeTypes.ADDED.type) === false) {
      height -= data.structure.added_rows.length;
    }

    if(this.activeChangeTypes.has(ChangeTypes.REMOVED.type) === false) {
      height -= data.structure.deleted_rows.length;
    }

    // set new width and height as attr and style (for transition)
    d3.select(canvas)
      .attr('width', width * scaleFactorX)
      .attr('height', height * scaleFactorY)
      .style('width', width * scaleFactorX + 'px')
      .style('height', height * scaleFactorY + 'px');

    ctx.scale(scaleFactorX, scaleFactorY);

    const calcColPos = (pos:number) => {
      if(this.activeChangeTypes.has(ChangeTypes.ADDED.type) === false) {
        pos -= data.structure.added_cols.filter((d) => d.pos <= pos).length;
      }
      if(this.activeChangeTypes.has(ChangeTypes.REMOVED.type) === false) {
        pos -= data.structure.deleted_cols.filter((d) => d.pos <= pos).length;
      }
      return pos;
    };

    const calcRowPos = (pos:number) => {
      if(this.activeChangeTypes.has(ChangeTypes.ADDED.type) === false) {
        pos -= data.structure.added_rows.filter((d) => d.pos <= pos).length;
      }
      if(this.activeChangeTypes.has(ChangeTypes.REMOVED.type) === false) {
        pos -= data.structure.deleted_rows.filter((d) => d.pos <= pos).length;
      }
      return pos;
    };

    const drawRows = (rows: IDiffRow[], style: string) => {
      ctx.beginPath();
      rows.forEach((row) => {
        if (row.pos >= 0) {
          ctx.rect(0, calcRowPos(row.pos), width, 1);
        }
      });
      ctx.fillStyle = style;
      ctx.fill();
    };

    const drawCols = (cols: IDiffRow[], style: string) => {
      ctx.beginPath();
      cols.forEach((col) => {
        if (col.pos >= 0) {
          ctx.rect(calcColPos(col.pos), 0, 1, height);
        }
      });
      ctx.fillStyle = style;
      ctx.fill();
    };

    if (data.structure) {
      if (this.activeChangeTypes.has(ChangeTypes.ADDED.type)) {
        drawRows(data.structure.added_rows, COLOR_ADDED);
        drawCols(data.structure.added_cols, COLOR_ADDED);
      }
      if (this.activeChangeTypes.has(ChangeTypes.REMOVED.type)) {
        drawRows(data.structure.deleted_rows, COLOR_DELETED);
        drawCols(data.structure.deleted_cols, COLOR_DELETED);
      }
    }

    if (data.content && this.activeChangeTypes.has(ChangeTypes.CONTENT.type)) {
      data.content.forEach((cell) => {
        ctx.fillStyle = this.contentScale(cell.diff_data);
        ctx.fillRect(calcColPos(cell.cpos), calcRowPos(cell.rpos), 1, 1);
      });
    }

    this.renderSelections(ctx, data);

    ctx.restore();
  }

  private renderSelections(ctx: CanvasRenderingContext2D, data: IDiffData) {
    const selections = this.selectedTables[0].producttype.productSelections();
    ctx.save();

    ctx.fillStyle = 'orange';
    if (selections.some((a) => a.isAll)) {
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
      return;
    }

    const rowLookup = new Map<number, number>();
    data.union.r_ids.map((d,i) => rowLookup.set(d,i));
    const colLookup = new Map<number, number>();
    data.union.c_ids.map((d,i) => colLookup.set(d,i));

    selections.forEach((cell) => {
      if (cell.isUnbound) {
        const rowIds = cell.dim(0);
        const colIds = cell.dim(1);
        if (rowIds.isUnbound && colIds.isUnbound) {
          // just support all for now
          ctx.fillRect(0, 0, data.union.c_ids.length, data.union.r_ids.length);
        } else if (rowIds.isUnbound) {
          colIds.forEach((colId) => {
            const col = colLookup.get(colId);
            ctx.fillRect(col, 0, 1, data.union.r_ids.length);
          });
        } else if (colIds.isUnbound) {
          rowIds.forEach((rowId) => {
            const row = rowLookup.get(rowId);
            ctx.fillRect(0, row, data.union.c_ids.length, 1);
          });
        }
      }
      cell.product((ids) => {
        const [i, j] = ids;
        const row = rowLookup.get(i);
        const col = colLookup.get(j);
        ctx.fillRect(col, row, 1, 1);
      }, [0,0]);
    });

    ctx.restore();
  }

  private drawLegend(data:IDiffData) {
    const $legend = this.$node.append('div').classed('legend', true);
    $legend.append('div').classed('content-change', true);
  }

  private clearContent() {
    this.data = null;
    this.$node.select('.taco-table').remove();
    this.$node.select('.legend').remove();
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
