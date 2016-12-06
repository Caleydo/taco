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
      <div id="timeline"></div>
      <div id="nav-bar">
            <button type="button" class="btn-nochanges" data-toggle="buttons-checkbox">No Changes</button>    
            <button type="button" class="btn-removed" data-toggle="buttons-checkbox">Removed</button>
            <button type="button" class="btn-added" data-toggle="buttons-checkbox">Added</button>
            <button type="button" class="btn-content" data-toggle="buttons-checkbox">Content</button> 
                    
            <button type="button" class="btn btn-primary" data-toggle="buttons-checkbox">Show/Hide Timeline</button>
            
           <a href="">Group changes</a> /  <a href="">Show as stacked bars</a>
              
      </div>
      </div>
    `);

  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items) => this.updateItems(items));
  }

  /**
   * Handle the update for a selected dataset
   * @param items
   */
  private updateItems(items) {

    // TODO retrieve selected data set and update the timeline with it

    const h = 200;

    const ids: any [] = items.map((d) => d.item.desc.id);

    const idPairs = d3.pairs(ids);


       //Scaling factor for the size of the circles on the timeline
    const circleScale = d3.scale.linear()
      .domain([0, d3.max(items, (d: any) => d.item.dim[0])])
      .range([10, 5]);   //h/100

    //get width of client browser window
    const widthWindow = $(window).innerWidth();


    const timeline = d3.select('#timeline');


    if (timeline.select('svg').size() > 0) {
      timeline.select('svg').remove();
    }

    const svgtimeline = timeline.append('svg')
      .attr('width', widthWindow)
      .attr('height', h);

    //width of the timeline div
    let widthTimelineDiv = $('#timeline').width();

      function scaleCircles(widthTimelineDiv) {
      //Padding for the circles
      const padding = 20;
      //showing only 7 circles on the timeline when no time-object is availiable for the specific dataset
      // in the next step -> implement the feature of a scroll bar showing more data points on the timeline
      const numberofCircles = 7;
      return (widthTimelineDiv - padding) / numberofCircles;
    }

     //helper variable for clicking event
    let isClicked = 0;
    //overall time span in days
    const firstTimePoint = moment(items[0].time);
    const lastTimePoint = moment(items[items.length - 1].time);
    const timeRange = lastTimePoint.diff(firstTimePoint, 'days');

    // Abbildungsbereich = Width
    // Skalierungfaktor = Width / Time Range


    const xScaleTime = d3.scale.linear()
      .domain([0, timeRange])
      .range([20, widthTimelineDiv - 20]); // 20 = Spacing

    drawTimeline();

    function drawTimeline() {

    svgtimeline.append('line')
      .style('stroke', 'black')
      .attr('x1', 0)
      .attr('y1', 60)
      .attr('x2', widthTimelineDiv - 10)
      .attr('y2', 60);

    svgtimeline.selectAll('circle')
      .data(items)
      .enter()
      .append('circle')
      .attr('title', (d: any) => (d.time) ? d.time.format(AppConstants.DATE_FORMAT) : d.key)
      .attr('cy', 60)
      .attr('cx', (d: any, i) => {
        if (d.time) {
          return xScaleTime(moment(d.time).diff(moment(items[0].time), 'days'));
        } else {
          return i * scaleCircles(widthTimelineDiv);

        }
      })
      .attr('id', (d: any) => 'circle_' + d.item.desc.id)
      .attr('r', (d: any) => circleScale(d.item.dim[0]))
      .on('click', function (d: any) {
        (<MouseEvent>d3.event).preventDefault();

        if (isClicked === 0) {
          console.log('first Click');
          svgtimeline.selectAll('circle').classed('active', false);
          // toggle the active CSS classes
          d3.select(this).classed('active', true);
          // toggle the active CSS classes
          svgtimeline.selectAll('circle').classed('active', false);

          d3.select(this).classed('active', true).attr('fill');

          // dispatch selected dataset to other views
          events.fire(AppConstants.EVENT_DATASET_SELECTED_LEFT, d.item);
          isClicked = 1;

        } else {

          d3.select(this).classed('active', true);
          // dispatch selected dataset to other views
          events.fire(AppConstants.EVENT_DATASET_SELECTED_RIGHT, d.item);

          isClicked = 0;
          console.log('second Click');
        }


      });

    }

    // Hide and Show timeline (line + circles)
    $('.btn-primary').on('click', function (e) {
      var line = svgtimeline.select('line');
      var circle = svgtimeline.selectAll('circle');
      //console.log('btn-remove');

      if (line.size() > 0 && circle.size() > 0) {
      line.remove();
      circle.remove();
      } else {
        drawTimeline();
      }
    })


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

    // Resizing all element in the svg
    function resize() {

      widthTimelineDiv = $('#timeline').width();

      // Update line
      svgtimeline.attr('width', widthTimelineDiv);
      d3.select('line').attr('x2', widthTimelineDiv);

      // Updating scale for circle position
      xScaleTime.range([20, widthTimelineDiv - 20]);

      svgtimeline.selectAll('circle')
        .attr('cx', (d: any, i) => {
          if (d.time) {
            return xScaleTime(moment(d.time).diff(moment(items[0].time), 'days'));
          } else {
            return i * scaleCircles(widthTimelineDiv);
          }
        });

      // Update bars
      svgtimeline.selectAll('g').remove();

      if (widthTimelineDiv <= 800) {
        if (rectWidth >= 5) {
          svgtimeline.selectAll('g').remove();
        } else {
          rectWidth = rectWidth - 1;
          generateBars(rectWidth);
        }
      } else {
        rectWidth = 15;
        generateBars(rectWidth);
      }
    }



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

            const pairPosX = pair.map((d) => parseFloat(d3.select(`#circle_${d}`).attr('cx')));

            console.log('finished loading pair - BARS', pair, pairPosX, json);

            const w = 80;
            const h = 30;
            const barPadding = 0.5;

            const data = [json.no_ratio, json.a_ratio, json.c_ratio, json.d_ratio];

            const color = d3.scale.ordinal()
              .domain(<any>[0, data.length - 1])
              .range(['#D8D8D8', '#67C4A7', '#8DA1CD', '#F08E65']);


            const svgRatioBar = svgtimeline.append('g')
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
