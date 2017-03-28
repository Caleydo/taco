/**
 * Created by Christina Niederer on 12.01.2017.
 */

import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import * as ajax from 'phovea_core/src/ajax';
import {IAnyMatrix} from 'phovea_core/src/matrix';
import {AppConstants, IChangeType, ChangeTypes, COLOR_ADDED, COLOR_DELETED} from './app_constants';
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
      .range(['#d8b365', '#d8d8d8', '#8da0cb'])
      .clamp(true);

  private borderWidth = 2;
  private margin = 2 * 50;

  private scaleFactor = 1;

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

    //attach event listener
    events.on(AppConstants.EVENT_OPEN_DIFF_HEATMAP, (evt, items: IAnyMatrix[]) => {
      if(items.length !== 2) {
        return;
      }

      this.$node.selectAll('*').remove();

      const idsSelectedTable = items.map((d) => d.desc.id);
      DiffHeatMap.getJSON(idsSelectedTable)
        .then((data) => {
          this.data = data;
          this.selectedTables = items;
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
    switch(changeType.type) {
      case ChangeTypes.REMOVED.type:
        this.$node.selectAll('.removed-color').classed('noColorClass', !changeType.isActive);
        break;

      case ChangeTypes.ADDED.type:
        this.$node.selectAll('.added-color').classed('noColorClass', !changeType.isActive);
        break;

      case ChangeTypes.CONTENT.type:
        this.$node.selectAll('.content-color').classed('noColorClass', !changeType.isActive);
        break;
    }

    this.$node.selectAll(`div.ratio > .${changeType.type}`).classed('noColorClass', !changeType.isActive);
  }

  private drawDiffHeatmap(data: IDiffData) {

    const dataWidth = AppConstants.HEATMAP_CELL_SIZE * data.union.uc_ids.length;
    const dataHeight = AppConstants.HEATMAP_CELL_SIZE * data.union.ur_ids.length;

    this.scaleFactor = (this.$node.property('clientWidth') - this.margin) / dataWidth;

    const width = dataWidth * this.scaleFactor;
    const height = dataHeight * this.scaleFactor;

    let $root = this.$node.select('canvas.taco-table');

    if($root.empty()) {
      $root = this.$node.append('canvas')
        .attr('class', 'taco-table');
    }

    $root
      .attr('width', width)
      .attr('height', height);

    this.handleTooltip($root, data, AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor);
    this.render(<HTMLCanvasElement>$root.node(), data);
  }

  private handleTooltip($root: d3.Selection<any>, data: IDiffData, scaleFactor: number) {
    let timer = -1;
    const toIndices = (x: number, y: number) => {
      const col = Math.round(x / scaleFactor + 0.5) - 1;
      const row = Math.round(y / scaleFactor + 0.5) - 1;
      return {col, row};
    };
    const updateTooltip = (x: number, y: number) => {
      const {col, row} = toIndices(x, y);
      const rowName = data.union.ur_ids[row];
      const colName = data.union.uc_ids[col];
      $root.attr('title', `${rowName} / ${colName}: ${col} ${x} ${row} ${y}`);
    };
    $root.on('mousemove', () => {
      const evt = <MouseEvent>d3.event;
      clearTimeout(timer);
      timer = setTimeout(updateTooltip.bind(this, evt.offsetX, evt.offsetY), 100);
    }).on('mouseleave', () => {
      clearTimeout(timer);
      timer = -1;
    });

  }

  private render(canvas: HTMLCanvasElement, data: IDiffData) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);

    ctx.save();
    const scaleFactor = AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor;
    const width = data.union.uc_ids.length;
    const height = data.union.ur_ids.length;
    ctx.scale(scaleFactor, scaleFactor);

    const drawRows = (rows: IDiffRow[], style: string) => {
      ctx.beginPath();
      rows.forEach((row) => {
        if (row.pos >= 0) {
          ctx.rect(0, row.pos, width, 1);
        }
      });
      ctx.fillStyle = style;
      ctx.fill();
    };
    const drawCols = (cols: IDiffRow[], style: string) => {
      ctx.beginPath();
      cols.forEach((row) => {
        if (row.pos >= 0) {
          ctx.rect(row.pos, 0, 1, height);
        }
      });
      ctx.fillStyle = style;
      ctx.fill();
    };

    if (data.structure) {
      drawRows(data.structure.added_rows, COLOR_ADDED);
      drawCols(data.structure.added_cols, COLOR_ADDED);
      drawRows(data.structure.deleted_rows, COLOR_DELETED);
      drawCols(data.structure.deleted_cols, COLOR_DELETED);
    }

    if (data.content) {
      data.content.forEach((cell) => {
        ctx.fillStyle = this.contentScale(cell.diff_data);
        ctx.fillRect(cell.cpos, cell.rpos, 1, 1);
      });
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
