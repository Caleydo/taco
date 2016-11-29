/**
 * Created by Holger Stitz on 29.11.2016.
 */

import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import * as ajax from 'phovea_core/src/ajax';
import * as d3 from 'd3';
import * as $ from 'jquery';

/**
 * Shows a timeline with all available data points for a selected data set
 */
class Histogram2D implements IAppView {

  private $node;

  private $ratio;

  private borderWidth = 2;

  private height = 160 + this.borderWidth;
  private width = 160 + this.borderWidth;

  private x = d3.scale.linear().domain([0, 1]).range([0, this.width]);
  private y = d3.scale.linear().domain([0, 1]).range([0, this.height]);

  private static getURL(pair) {
    const bin_cols = -1; // -1 = aggregate the whole table
    const bin_rows = -1; // -1 = aggregate the whole table
    const direction = 2; // 2 = rows + columns
    const changes = 'structure,content';
    return `/taco/diff_log/${pair[0]}/${pair[1]}/${bin_cols}/${bin_rows}/${direction}/${changes}`;
  }

  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('histogram_2d', true)
      .classed('hidden', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<Timeline>}
   */
  init() {
    this.build();
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  /**
   * Build the basic DOM elements and binds the change function
   */
  private build() {
    //get width of client browser window
    const windowWidth = $(window).innerWidth();

    this.$node
      .style('width', windowWidth + 'px')
      .style('height', this.height + 'px');

    this.$ratio = this.$node
      .append('div')
      .style('width', this.width + 'px')
      .style('height', this.height + 'px')
      .classed('ratio', true)
      .on('click', function() {
        events.fire(AppConstants.EVENT_CLOSE_2D_HISTOGRAM);
      });
  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_CLOSE_2D_HISTOGRAM, () => {
      this.$node.classed('hidden', true);
    });

    events.on(AppConstants.EVENT_OPEN_2D_HISTOGRAM, (evt, posX, pair) => {
      this.$node.classed('hidden', false);
      this.updateItems(posX, pair);
    });
  }

  private updateItems(posX, pair) {
    this.$ratio
      .classed('loading', true)
      .style('left', posX + 'px');

    this.requestData(pair)
      .then((data) => this.showData(data));
  }

  private requestData(pair) {
    return ajax.getAPIJSON(Histogram2D.getURL(pair))
      .then((json) => {
        const data = [];

        const cols = json.cols;
        const rows = json.rows;

        data.push({
          type: 'struct-del',
          rows: rows.d_ratio + rows.a_ratio + rows.c_ratio + rows.no_ratio, //todo change to 1
          cols: cols.d_ratio + cols.a_ratio + cols.c_ratio + cols.no_ratio, //todo change to 1
          rows_text : Math.round((rows.d_ratio * 100)*1000)/1000,
          cols_text : Math.round((cols.d_ratio * 100)*1000)/1000
        });
        data.push({
          type: 'struct-add',
          rows: rows.a_ratio + rows.c_ratio + rows.no_ratio, // or 1 - d
          cols: cols.a_ratio + cols.c_ratio + cols.no_ratio,
          rows_text : Math.round((rows.a_ratio * 100)*1000)/1000,
          cols_text : Math.round((cols.a_ratio * 100)*1000)/1000
        });
        data.push({
          type: 'content-change',
          rows: rows.c_ratio + rows.no_ratio,
          cols: cols.c_ratio + cols.no_ratio,
          rows_text : Math.round((rows.c_ratio * 100)*1000)/1000,
          cols_text : Math.round((cols.c_ratio * 100)*1000)/1000
        });
        data.push({
          type: 'no-change',
          rows: rows.no_ratio,
          cols: cols.no_ratio,
          rows_text : Math.round((rows.no_ratio * 100)*1000)/1000,
          cols_text : Math.round((cols.no_ratio * 100)*1000)/1000
        });

        //console.log('data list' , dataList);
        return data;
      });
  }

  private showData(data) {
    const ratio2d = this.$ratio.selectAll('div').data(data);

    ratio2d.enter()
      .append('div');

    ratio2d
      .attr('class', (d) => d.type + '-color')
      .style('width', (d) => this.x(d.cols) + 'px')
      .style('height', (d) => this.y(d.rows) + 'px')
      .attr('title', (d) => d.type.replace('-', ' ') + '\x0Arows: ' + d.rows_text + '%\x0Acolumns: ' + d.cols_text + '%');

    ratio2d.exit().remove();

    this.$ratio.classed('loading', false);
  }

}

/**
 * Factory method to create a new Histogram2D instance
 * @param parent
 * @param options
 * @returns {Histogram2D}
 */
export function create(parent: Element, options: any) {
  return new Histogram2D(parent, options);
}
