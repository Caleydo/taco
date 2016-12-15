/**
 * Created by Holger Stitz on 29.08.2016.
 */

import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import * as moment from 'moment';
import * as ajax from 'phovea_core/src/ajax';
import * as d3 from 'd3';
import * as $ from 'jquery';

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
  private widthTimelineDiv: number;

  // helper variable for on click event
  private open2dHistogram = null;

  private $navbar;


  constructor(parent: Element, private options: any) {
    this.$navbar = d3.select(parent).append('div').classed('nav-bar', true);
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

    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', () => this.resize());
  }

  /**
   * Build the basic DOM elements and binds the change function
   */
  private build() {

      this.$navbar.html(` <div id="nav-bar">  
      <div class="btn-group" role="group" aria-label="...">
         <button type="button" class="btn btn-default" id="btn-nochange">No changes</button>
         <button type="button" class="btn btn-default" id="btn-removed">Removed</button>
         <button type="button" class="btn btn-default" id="btn-added">Added</button>
         <button type="button" class="btn btn-default" id="btn-content">Content</button>        
      </div>  
         
      <div class="btn-group" role="group" aria-label="...">
        <button type="button" class="btn btn-default toggleTimeline" id="btn-timeline">Show/Hide Timeline</button> 
        <button type="button" class="btn btn-default" id="btn-group">Group Changes</button> 
        <button type="button" class="btn btn-default" id="btn-stacked">Show as stacked bars</button> 
     </div>
     </div>`);


    // TODO build timeline using D3 of parts that doesn't change on update()
    this.$node.html(`           
      <div id="timeline"></div>
    `);


    this.$svgTimeline = this.$node.select('#timeline')
      .append('svg')
      .attr('width', this.timelineWidth)
      .attr('height', this.timelineHeight);

    console.log(d3.select('.selector').selectAll('div'));

  }

  private resize() {
    this.widthTimelineDiv = $('#timeline').width();

    // Update line
    this.$svgTimeline.attr('width', this.widthTimelineDiv);
    d3.select('line').attr('x2', this.widthTimelineDiv);

    // Updating scale for circle position
    this.getScaleTimeline(this.items).range([20, this.widthTimelineDiv - 20]);

    const firstTimePoint = moment(this.items[0].time);
    const lastTimePoint = moment(this.items[this.items.length - 1].time);
    const timeRange = lastTimePoint.diff(firstTimePoint, 'days');

    let xScaleTimeline = d3.scale.linear()
      .domain([0, timeRange])
      .range([20, this.widthTimelineDiv - 20]); // 20 = Spacing

    this.$svgTimeline.selectAll('circle')
      .attr('cx', (d: any, i) => {
        // TODO for Christina: uncomment and make getScaleTimeline work again
        if (d.time) {
          let time = moment(d.time).diff(moment(this.items[0].time), 'days');
          console.log(time);
          return xScaleTimeline((moment(d.time).diff(moment(this.items[0].time), 'days')));
        } else {
          return i * this.scaleCircles();
        }
      });

    // Update bars
    this.$svgTimeline.selectAll('g').remove();

    // start width for bars of ratio bar charts
    let rectWidth = 13;

    if (this.widthTimelineDiv <= 800) {
      if (rectWidth >= 5) {
        this.$svgTimeline.selectAll('g').remove();
      } else {
        rectWidth = rectWidth - 1;
        this.generateBars(rectWidth);
      }
    } else {
      rectWidth = 15;
      this.generateBars(rectWidth);
    }
  }

  //Circle Scale if dataset has no time element
  private scaleCircles() {
    //Padding for the circles
    const padding = 20;
    //showing only 7 circles on the timeline when no time-object is availiable for the specific dataset
    // in the next step -> implement the feature of a scroll bar showing more data points on the timeline
    const numberofCircles = 7;
    return (this.widthTimelineDiv - padding) / numberofCircles;
  }

  //scaling for circles on timeline
  private getScaleTimeline(items) {
    this.items = items;
    const firstTimePoint = moment(this.items[0].time);
    const lastTimePoint = moment(this.items[this.items.length - 1].time);
    const timeRange = lastTimePoint.diff(firstTimePoint, 'days');

    return d3.scale.linear()
      .domain([0, timeRange])
      .range([20, this.widthTimelineDiv - 20]); // 20 = Spacing
  }

  /**
   * Handle the update for a selected dataset
   * @param items
   */

  private updateItems(items) {
    const that = this; // use `that` inside of function() (e.g., event listener)

    // make items available for other class members
    this.items = items;


    // delete all existing DOM elements
    this.$svgTimeline.selectAll('*').remove();

    // initialize the width
    this.resize();

    this.drawTimeline();

    // get toogle Button
    let showHideButton = this.$navbar.select('.toggleTimeline');

    // Hide and Show timeline (line + circles)
    showHideButton.on('click', function (e) {
      let line = that.$svgTimeline.select('line');
      let circle = that.$svgTimeline.selectAll('circle');
      //console.log(line, circle);

      if (line.size() > 0 && circle.size() > 0) {
        line.remove();
        circle.remove();
       // console.log(line.size(), circle.size());
      } else {
        //console.log(line.size(), circle.size());
        that.drawTimeline();
      }
    });

    // Create Bars
    const barPromises = this.generateBars(20);

    // Check if all bars have been loaded
    Promise.all(barPromises).then((bars) => {
      console.log('finished loading of all bars');
    });
  }

  // creating 2D Ratio bars
  private generateBars(width) {

    const that = this;

    const ids = this.items.map((d) => d.item.desc.id);

    return d3.pairs(ids).map((pair) => {
      console.log('start loading pair', pair);
      return Promise.all([ajax.getAPIJSON(`/taco/diff_log/${pair[0]}/${pair[1]}/1/1/2/structure,content`), pair])
        .then((args) => {
          const json = args[0];
          const pair = args[1];

          //console.log(json, pair);

         // console.log(d3.select('circle'));

          const pairPosX = pair.map((d) => parseFloat(d3.select(`#circle_${d}`).attr('cx')));

          console.log('finished loading pair - BARS', pair, pairPosX, json);

          const w = 80;
          const h = 30;
          const barPadding = 0.5;

          const data = [json.no_ratio, json.a_ratio, json.c_ratio, json.d_ratio];

          const color = d3.scale.ordinal()
            .domain(<any>[0, data.length - 1])
            .range(['#D8D8D8', '#67C4A7', '#8DA1CD', '#F08E65']);


          const svgRatioBar = this.$svgTimeline.append('g')
            .style('transform', 'translate(' + (pairPosX[0] + 0.5 * (pairPosX[1] - pairPosX[0] - width)) + 'px)');

          svgRatioBar.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', (d, i) => i * (w / data.length - barPadding))
            .attr('y', (d, i) => h - d * 100)
            .attr('width', width)
            .attr('height', (d) => d * 100)
            .attr('fill', (d, i) => <string>color(i.toString()))
            .on('click', function () {
              const currentPosX = d3.transform(d3.select(this.parentNode).style('transform')).translate[0];

              if (that.open2dHistogram === this.parentNode) {
                events.fire(AppConstants.EVENT_CLOSE_2D_HISTOGRAM);
                that.open2dHistogram = null;

              } else {
                events.fire(AppConstants.EVENT_OPEN_2D_HISTOGRAM, currentPosX, pair);
                that.open2dHistogram = this.parentNode;
              }
            });

        });
    });
  }

  //helper variable for clicking event
  private isClicked = 0;

  private drawTimeline() {
    const that = this;
    const items = this.items;

    const firstTimePoint = moment(items[0].time);
    const lastTimePoint = moment(items[items.length - 1].time);

    const timeRange = lastTimePoint.diff(firstTimePoint, 'days');

    let xScaleTimeline = d3.scale.linear()
      .domain([0, timeRange])
      .range([20, that.widthTimelineDiv - 20]); // 20 = Spacing

    const circleScale = d3.scale.linear()
      .domain([0, d3.max(items, (d: any) => d.item.dim[0])])
      .range([10, 5]);   //h/100

    this.$svgTimeline.append('line')
      .style('stroke', 'black')
      .attr('x1', 0)
      .attr('y1', 60)
      .attr('x2', that.widthTimelineDiv - 10)
      .attr('y2', 60);

    this.$svgTimeline.selectAll('circle')
      .data(items)
      .enter()
      .append('circle')
      .attr('title', (d: any) => (d.time) ? d.time.format(AppConstants.DATE_FORMAT) : d.key)
      .attr('cy', 60)
      .attr('cx', (d: any, i) => {

        if (d.time) {
          return xScaleTimeline(moment(d.time).diff(moment(items[0].time), 'days'));
        } else {
          return i * this.scaleCircles();
        }
      })
      .attr('id', (d: any) => 'circle_' + d.item.desc.id)
      .attr('r', (d: any) => circleScale(d.item.dim[0]))
      .on('click', function (d: any) {
        (<MouseEvent>d3.event).preventDefault();

        if (that.isClicked === 0) {
          console.log('first Click');
          this.$svgTimeline.selectAll('circle').classed('active', false);
          // toggle the active CSS classes
          d3.select(this).classed('active', true);
          // toggle the active CSS classes
          this.$svgTimeline.selectAll('circle').classed('active', false);

          d3.select(this).classed('active', true).attr('fill');

          // dispatch selected dataset to other views
          events.fire(AppConstants.EVENT_DATASET_SELECTED_LEFT, d.item);
          that.isClicked = 1;

        } else {

          d3.select(this).classed('active', true);
          // dispatch selected dataset to other views
          events.fire(AppConstants.EVENT_DATASET_SELECTED_RIGHT, d.item);

          that.isClicked = 0;
          console.log('second Click');
        }

      });
  }

}


/**
 * Factory method to create a new Timeline instance
 * @param parent
 * @param options
 * @returns {Timeline}
 */
export function create(parent: Element, options: any) {
  return new Timeline(parent, options);
}
