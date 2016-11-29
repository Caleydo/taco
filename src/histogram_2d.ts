/**
 * Created by Holger Stitz on 29.11.2016.
 */

import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import * as d3 from 'd3';
import * as $ from 'jquery';

/**
 * Shows a timeline with all available data points for a selected data set
 */
class Histogram2D implements IAppView {

  private $node;

  private $svg;

  private height = 160;
  private width = 160;

  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent).append('div').classed('histogram_2d', true);
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
    const widthWindow = $(window).innerWidth();

    //height of svg for 2dratiohistogram
    const height = 160;

    this.$svg = this.$node.append('svg')
      .attr('width', widthWindow)
      .attr('height', height);
  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_OPEN_2D_HISTOGRAM, (evt, currentPosX, data_list) => this.updateItems(currentPosX, data_list));
  }

  private updateItems(actualposition, data_list) {
    const g = this.$svg.append('g')
      .style('transform', 'translate(' + actualposition + 'px' + ')');

    const x = d3.scale.linear()
      .domain([0, 1])
      .range([0, this.width]);

    const y = d3.scale.linear()
      .domain([0, 1])
      .range([0, this.height]);

    g.selectAll('rect')
      .data(data_list)
      .enter()
      .append('rect')
      .attr('class', function (d) {
        return d.type + '-color';
      })
      .style('width', function (d) {
        return x(d.cols) + 'px';
      })
      .attr('height', function (d) {
        return y(d.rows) + 'px';
      })
      .attr('title', function (d) {
        return d.type.replace('-', ' ') + '\x0Arows: ' + d.rows_text + '%\x0Acolumns: ' + d.cols_text + '%';
      });

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
