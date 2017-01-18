/**
 * Created by Holger Stitz on 29.08.2016.
 */

import * as moment from 'moment';
import * as d3 from 'd3';
import * as $ from 'jquery';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import {getPosXScale, scaleCircles} from './util';

/**
 * Shows a timeline with all available data points for a selected data set
 */
class Timeline implements IAppView {

  private $node;

  private timelineWidth = $(window).innerWidth();
  private timelineHeight = 200;

  private items;

  //private colorScale = d3.scale.ordinal().range(['#D8zD8D8', '#67C4A7', '#8DA1CD', '#F08E65']);

  private $svgTimeline;

  //width of the timeline div
  private totalWidth:number;

  // helper variable for on click event
  //private open2dHistogram = null;


  constructor(parent:Element, private options:any) {
    this.$node = d3.select(parent).append('div').classed('timeline', true);
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
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items) => this.updateItems(items));

    events.on(AppConstants.EVENT_TOGGLE_TIMELINE, (evt) => this.toggleTimeline());

    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', () => this.resize());
  }

  /**
   * Build the basic DOM elements and binds the change function
   */
  private build() {
    this.$svgTimeline = this.$node
      .append('svg')
      .attr('width', this.timelineWidth)
      .attr('height', this.timelineHeight);
  }

  private resize() {
    this.totalWidth = $(this.$node.node()).width();

    // Update line
    this.$svgTimeline.attr('width', this.totalWidth);
    d3.select('line').attr('x2', this.totalWidth);

    // Updating scale for circle position
    const xScaleTimeline = getPosXScale(this.items, this.totalWidth);

    this.$svgTimeline.selectAll('circle')
      .attr('cx', (d:any, i) => {
        if (d.time) {
          return xScaleTimeline(moment(d.time).diff(moment(this.items[0].time), 'days'));
        } else {
          return i * scaleCircles(this.totalWidth);
        }
      });
  }

  /**
   * Handle the update for a selected dataset
   * @param items
   */

  private updateItems(items) {
    // make items available for other class members
    this.items = items;

    // delete all existing DOM elements
    this.$svgTimeline.selectAll('*').remove();

    // initialize the width
    this.resize();

    this.drawTimeline();
  }


  //helper variable for clicking event
  private isClicked = 0;

  private drawTimeline() {
    const that = this;

    const xScaleTimeline = getPosXScale(this.items, this.totalWidth);

    const circleScale = d3.scale.linear()
      .domain([0, d3.max(this.items, (d:any) => d.item.dim[0])])
      .range([10, 5]);   //h/100

    this.$svgTimeline.append('line')
      .style('stroke', 'black')
      .attr('x1', 0)
      .attr('y1', 60)
      .attr('x2', that.totalWidth - 10)
      .attr('y2', 60);

    this.$svgTimeline.selectAll('circle')
      .data(this.items)
      .enter()
      .append('circle')
      .attr('title', (d:any) => (d.time) ? d.time.format(AppConstants.DATE_FORMAT) : d.key)
      .attr('cy', 60)
      .attr('cx', (d:any, i) => {
        if (d.time) {
          return xScaleTimeline(moment(d.time).diff(moment(this.items[0].time), 'days'));
        } else {
          return i * scaleCircles(this.totalWidth);
        }
      })
      .attr('id', (d:any) => 'circle_' + d.item.desc.id)
      .attr('r', (d:any) => circleScale(d.item.dim[0]))
      .on('click', function (d:any) {
        (<MouseEvent>d3.event).preventDefault();

        if (that.isClicked === 0) {
          //console.log('first Click');
          that.$svgTimeline.selectAll('circle').classed('active', false);
          // toggle the active CSS classes
          //d3.select(this).classed('active', true);
          // toggle the active CSS classes
          //that.$svgTimeline.selectAll('circle').classed('active', false);


          d3.select(this).classed('active', true).attr('fill');
          //console.log(d.item);

          // dispatch selected dataset to other views
          events.fire(AppConstants.EVENT_DATASET_SELECTED_LEFT, d.item);
          that.isClicked = 1;

        } else {

          d3.select(this).classed('active', true).attr('fill');
          // dispatch selected dataset to other views
          events.fire(AppConstants.EVENT_DATASET_SELECTED_RIGHT, d.item);
          events.fire(AppConstants.EVENT_OPEN_DIFF_HEATMAP, d.item);

          that.isClicked = 0;
          //console.log('second Click');
        }

      });
  }

  private toggleTimeline() {
    // let button = d3.select(this);
    //console.log(button);
    const line = this.$svgTimeline.select('line');
    const circle = this.$svgTimeline.selectAll('circle');
    //console.log(line, circle);

    if (line.size() > 0 && circle.size() > 0) {
      line.remove();
      circle.remove();
      // console.log(line.size(), circle.size());
    } else {
      //console.log(line.size(), circle.size());
      this.drawTimeline();
    }
  }

}


/**
 * Factory method to create a new Timeline instance
 * @param parent
 * @param options
 * @returns {Timeline}
 */
export function create(parent:Element, options:any) {
  return new Timeline(parent, options);
}
