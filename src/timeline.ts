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

  constructor(parent: Element, private options: any) {
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
   * Build the basic DOM elements and binds the change function
   */
  private build() {
    // TODO build timeline using D3 of parts that doesn't change on update()
    this.$node.html(`      
      <div id="nav-bar">  
      <div class="btn-group" role="group" aria-label="...">
         <button type="button" class="btn btn-default" id="btn-nochange">No changes</button>
         <button type="button" class="btn btn-default" id="btn-removed">Removed</button>
         <button type="button" class="btn btn-default" id="btn-added">Added</button>
         <button type="button" class="btn btn-default" id="btn-content">Content</button>        
      </div>  
         
      <div class="btn-group" role="group" aria-label=""...">
        <button type="button" class="btn btn-default" id="btn-timeline" >Show/Hide Timeline</button> 
        <button type="button" class="btn btn-default" id="btn-group">Group Changes</button> 
        <button type="button" class="btn btn-default" id="btn-stacked">Show as stacked bars</button> 
     </div>
           
      <div id="timeline"></div>
    `);

  }
//data-toggle="buttons-checkbox"
  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items) => this.updateItems(items));
  }

  private h = 200;

  private colorScale = d3.scale.ordinal().range(['#D8zD8D8', '#67C4A7', '#8DA1CD', '#F08E65']);


  private timeline = d3.select('#timeline');
  private widthWindow = $(window).innerWidth();

  private svgtimeline = this.timeline.append('svg')
    .attr('width', this.widthWindow)
    .attr('height', this.h);

  //width of the timeline div
  private widthTimelineDiv:any = $('#timeline').width();

  /**
   * Handle the update for a selected dataset
   * @param items
   */
  private updateItems(items) {

    // TODO retrieve selected data set and update the timeline with it

    //const h = 200;

    const ids: any [] = items.map((d) => d.item.desc.id);

    const idPairs = d3.pairs(ids);

    //Scaling factor for the size of the circles on the timeline
    const circleScale = d3.scale.linear()
      .domain([0, d3.max(items, (d: any) => d.item.dim[0])])
      .range([10, 5]);   //h/100

    if (this.timeline.select('svg').size() > 0) {
      this.timeline.select('svg').remove();
    }

    function scaleCircles(widthTimelineDiv) {
      //Padding for the circles
      const padding = 20;
      //showing only 7 circles on the timeline when no time-object is availiable for the specific dataset
      // in the next step -> implement the feature of a scroll bar showing more data points on the timeline
      const numberofCircles = 7;
      return (widthTimelineDiv - padding) / numberofCircles;
    }

    // Hide and Show timeline (line + circles)
    $('#btn-timeline').on('click', function (e) {
      let line = this.svgtimeline.select('line');
      let circle = this.svgtimeline.selectAll('circle');

      if (line.size() > 0 && circle.size() > 0) {
        line.remove();
        circle.remove();
      } else {
        this.drawTimeline();
      }
    });

    this.drawTimeline(items);

    // Create Bars
    const barPromises = generateBars(20);

    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', resize);

    // Check if all bars have been loaded
    Promise.all(barPromises).then((bars) => {
      console.log('finished loading of all bars');
    });

    // start width for bars of ratio bar charts
    let rectWidth = 13;

    // helper variable for on click event
    let open2dHistogram = null;

    // creating 2D Ratio bars
    function generateBars(width) {
      return idPairs.map((pair) => {
        console.log('start loading pair', pair);
        return Promise.all([ajax.getAPIJSON(`/taco/diff_log/${pair[0]}/${pair[1]}/1/1/2/structure,content`), pair])
          .then((args) => {
            const json = args[0];
            const pair = args[1];

            console.log(json, pair);

            console.log(d3.select('circle'));

            const pairPosX = pair.map((d) => parseFloat(d3.select(`#circle_${d}`).attr('cx')));

            console.log('finished loading pair - BARS', pair, pairPosX, json);

            const w = 80;
            const h = 30;
            const barPadding = 0.5;

            const data = [json.no_ratio, json.a_ratio, json.c_ratio, json.d_ratio];

            const color = d3.scale.ordinal()
              .domain(<any>[0, data.length - 1])
              .range(['#D8D8D8', '#67C4A7', '#8DA1CD', '#F08E65']);


            const svgRatioBar = this.svgtimeline.append('g')
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

                if (open2dHistogram === this.parentNode) {
                  events.fire(AppConstants.EVENT_CLOSE_2D_HISTOGRAM);
                  open2dHistogram = null;

                } else {
                  events.fire(AppConstants.EVENT_OPEN_2D_HISTOGRAM, currentPosX, pair);
                  open2dHistogram = this.parentNode;
                }
              });

          });
      });
    }

      function resize() {
      this.widthTimelineDiv = $('#timeline').width();
      // Update line
      this.svgtimeline.attr('width', this.widthTimelineDiv);
      d3.select('line').attr('x2', this.widthTimelineDiv);

      // Updating scale for circle position
      this.getScaleTimeline().range([20, this.widthTimelineDiv - 20]);

      this.svgtimeline.selectAll('circle')
        .attr('cx', (d: any, i) => {
          if (d.time) {
            return this.getScaleTimeline((moment(d.time).diff(moment(items[0].time), 'days')));
          } else {
            return i * scaleCircles(this.widthTimelineDiv);
          }
        });

      // Update bars
      this.svgtimeline.selectAll('g').remove();

      if (this.widthTimelineDiv <= 800) {
        if (rectWidth >= 5) {
          this.svgtimeline.selectAll('g').remove();
        } else {
          rectWidth = rectWidth - 1;
          generateBars(rectWidth);
        }
      } else {
        rectWidth = 15;
        generateBars(rectWidth);
      }
    }

  }


  //scaling for circles on timeline
 /* private getScaleTimeline (items) {

    const firstTimePoint = moment(items[0].time);
    const lastTimePoint = moment(items[items.length - 1].time);
    const timeRange = lastTimePoint.diff(firstTimePoint, 'days');
    let xScaleTimeline = d3.scale.linear()
      .domain([0, timeRange])
      .range([20, this.widthTimelineDiv - 20]); // 20 = Spacing

    return xScaleTimeline;
  }*/

  //helper variable for clicking event
  private  isClicked = 0;

  private drawTimeline(items) {
    const firstTimePoint = moment(items[0].time);
    const lastTimePoint = moment(items[items.length - 1].time);
    const timeRange = lastTimePoint.diff(firstTimePoint, 'days');
    let xScaleTimeline = d3.scale.linear()
      .domain([0, timeRange])
      .range([20, this.widthTimelineDiv - 20]); // 20 = Spacing

    const circleScale = d3.scale.linear()
      .domain([0, d3.max(items, (d: any) => d.item.dim[0])])
      .range([10, 5]);   //h/100

    this.svgtimeline.append('line')
      .style('stroke', 'black')
      .attr('x1', 0)
      .attr('y1', 60)
      .attr('x2', this.widthTimelineDiv - 10)
      .attr('y2', 60);

    this.svgtimeline.selectAll('circle')
      .data(items)
      .enter()
      .append('circle')
      .attr('title', (d: any) => (d.time) ? d.time.format(AppConstants.DATE_FORMAT) : d.key)
      .attr('cy', 60)
      .attr('cx', (d:any, i) => {
        if (d.time) {
          return xScaleTimeline(moment(d.time).diff(moment(items[0].time), 'days'));
        } else {
          return i * xScaleTimeline(this.widthTimelineDiv);
        }
      })
      .attr('id', (d: any) => 'circle_' + d.item.desc.id)
      .attr('r', (d: any) => circleScale(d.item.dim[0]))
      .on('click', function (d: any) {
        (<MouseEvent>d3.event).preventDefault();

        if (this.isClicked === 0) {
          console.log('first Click');
          this.svgtimeline.selectAll('circle').classed('active', false);
          // toggle the active CSS classes
          d3.select(this).classed('active', true);
          // toggle the active CSS classes
          this.svgtimeline.selectAll('circle').classed('active', false);

          d3.select(this).classed('active', true).attr('fill');

          // dispatch selected dataset to other views
          events.fire(AppConstants.EVENT_DATASET_SELECTED_LEFT, d.item);
          this.isClicked = 1;

        } else {

          d3.select(this).classed('active', true);
          // dispatch selected dataset to other views
          events.fire(AppConstants.EVENT_DATASET_SELECTED_RIGHT, d.item);

          this.isClicked = 0;
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
