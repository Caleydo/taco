/**
 * Created by Holger Stitz on 29.08.2016.
 */

import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import {Language} from './language';
//import moment = require("../../libs/bower_components/moment/moment");
import * as moment from 'moment';
import * as ajax from 'phovea_core/src/ajax';
import * as d3 from 'd3';
import * as $ from 'jquery';

/**
 * Shows a timeline with all available data points for a selected data set
 */
class Timeline implements IAppView {

  private $node;

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
   * Build the basic DOM elements and binds the change function
   */
  private build() {
    // TODO build timeline using D3 of parts that doesn't change on update()
    this.$node.html(`
      <!--<h3>${Language.TIMELINE}</h3>-->
      <ul class="output"></ul>
      <div id="ratioBar" class ="ratioBarChart"></div>
      <div id="timeline"></div>
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

    // set selection by default to first item
   // var selected = (items.length > 0) ? items[0].item : undefined;

    //const $li = this.$node.select('ul.output').selectAll('li').data(items);

    /*$li.enter()
      .append('li')
      .append('a')
      .attr('href', '#');

    $li.select('a')
      .classed('active', (d) => d === selected)
      .text((d) => {
        if(d.time) {
          return `${d.time.format(AppConstants.DATE_FORMAT)} (${d.item.dim[0]} x ${d.item.dim[1]})`;
        } else {
          return `${d.key} (${d.item.dim[0]} x ${d.item.dim[1]})`;
        }
      })
      .on('click', function(d) {
        // prevents triggering the href
        (<MouseEvent>d3.event).preventDefault();

        // toggle the active CSS classes
        $li.select('a').classed('active', false);
        d3.select(this).classed('active', true);

        // dispatch selected dataset to other views
        events.fire(AppConstants.EVENT_DATASET_SELECTED, d.item);
      });

    $li.exit().remove();*/

    // initialize other views with the first item
    /*if(selected !== undefined) {
      events.fire(AppConstants.EVENT_DATASET_SELECTED, selected);
    }*/

    const w = 600;
    const h = 200;

    var ids:any [] = items.map((d) => d.item.desc.id);
    //console.log('ID - Array');
    //console.log(ids);

    var idPairs = d3.pairs(ids);

    //console.log('ID-Paris');
    //console.log(idPairs);
    //console.log(idPairs[0][0]);

    //resize
    //var width = $('#timeline').width();
    //var height = $('#timeline').height();
    //console.log(width);
    //var aspect = w/h;
    //console.log(aspect);

     /*const xScale = d3.scale.linear()
     .domain([0, items.length])
     .range([0, w]);*/

    //Scaling factor for the size of the circles on the timeline
    const circleScale = d3.scale.linear()
      .domain([0, d3.max(items, (d:any) => d.item.dim[0]) ])
      .range([10, 5]);   //h/100

    //console.log(d3.max(items, (d:any,i) => d.dim[i]));


    //get width of client browser window
   // console.log('Width of Window', $(window).innerWidth());
    var widthWindow = $(window).innerWidth();
   // console.log(widthWindow);

    const timeline = d3.select('#timeline');

    if(timeline.select('svg').size() > 0) {
      timeline.select('svg').remove();
    }

    const svgtimeline = timeline.append('svg')
      .attr('width', widthWindow)
      .attr('height', h);


    //console.log('Timeline-Width', $('#timeline').width());
    var widthTimelineDiv = $('#timeline').width();

    /*
     //calculate time duration between two timestamps
     // time from title attribute - are String elements
     var time:number [] = [];

     for (var _i = 0; _i < items.length; _i++) {
     var store =  items[_i].time;

     time.push(store);

     }

     var diffs:any [] = [];

     var pairs = d3.pairs(time);
     console.log('Pairs');
     console.log(pairs);


     for (var _i = 0; _i < pairs.length-1; _i++) {
     var a = moment(pairs[_i][0]);
     var b = moment(pairs[_i][1]);
     console.log(a);
     console.log(b);
     var diff = b.diff(a, 'days');
     diffs.push(diff);
     console.log(diffs);
     }
     */

    svgtimeline.append('line')
      .style('stroke', 'black')
      .attr('x1', 0)
      .attr('y1', 60)
      .attr('x2', widthTimelineDiv-10)
      .attr('y2', 60);

    //helper variable for clicking event
    var isClicked = 0;
    //gesamter Zeitbereich in Tagen
    var firstTimePoint = moment(items[0].time);
    var lastTimePoint =  moment(items[items.length-1].time);
    var timeRange = lastTimePoint.diff(firstTimePoint, 'days');

    // Abbildungsbereich = Width
    // Skalierungfaktor = Width / Time Range


    const xScaleTime = d3.scale.linear()
      .domain([0, timeRange])
      .range([20, widthTimelineDiv-20]); // 20 = Spacing


    svgtimeline.selectAll('circle')
      .data(items)
      .enter()
      .append('circle')
      .attr('title', (d:any) => (d.time) ? d.time.format(AppConstants.DATE_FORMAT) : d.key)
      .attr('cy', 60)
      .attr('cx', (d:any) => {
        if(d.time) {
          return xScaleTime(moment(d.time).diff(moment(items[0].time),'days'));
        } else {
          return 60;
        }
      })
      .attr('id', (d:any) => 'circle_' + d.item.desc.id)
      .attr('r', (d:any) => circleScale(d.item.dim[0]))
      .on('click', function(d:any) {
        (<MouseEvent>d3.event).preventDefault();
        //svgtimeline.selectAll('circle').classed('active', false);

        if (isClicked === 0) {
          console.log ('first Click');
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
          console.log ('second Click');
        }


      });

    //Create Bars
    const barPromises = generateBars();

    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', resize);

    // Check if all bars have been loaded
    Promise.all(barPromises).then((bars) => {
      console.log('finished loading of all bars');
    });

    //Resizing all element in the svg
    function resize() {

      widthTimelineDiv = $('#timeline').width();

      // Update line
      svgtimeline.attr('width', widthTimelineDiv);
      d3.select('line').attr('x2', widthTimelineDiv);

      //Updating scale for circle position
      xScaleTime.range([20, widthTimelineDiv-20]);

     svgtimeline.selectAll('circle')
       .attr('cx', (d:any) => {
        if(d.time) {
         return xScaleTime(moment(d.time).diff(moment(items[0].time),'days'));
        } else {
          return 60;
        }
      });

      //Update bars
      svgtimeline.selectAll('g').remove();
      const barPromises = generateBars();

      // check if all bars have been loaded while resizing window
      Promise.all(barPromises).then((bars) => {
      console.log('finished loading of all bars');
    });
    };


    //creating 2D Ratio bars
    function generateBars() {
     return idPairs.map((pair) => {
      console.log('start loading pair', pair);
      //Get the different type of changes as a sum (rows + cols) -> .../1/1/2/...
      //ajax.getAPIJSON(`/taco/diff_log/20130222GbmMicrorna/20130326GbmMicrorna/10/10/2/structure,content`)
      return Promise.all([ajax.getAPIJSON(`/taco/diff_log/${pair[0]}/${pair[1]}/1/1/2/structure,content`), pair])
        .then((args) => {
          const json = args[0];
          const pair = args[1];

          console.log(args);

          //console.log('pair argument', pair);
          const pairPosX = pair.map((d) => parseFloat(d3.select(`#circle_${d}`).attr('cx')));

          console.log('finished loading pair', pair, pairPosX, json);

          const w = 80;
          const h = 30;
          const barPadding = 0.5;

          const data = [json.no_ratio, json.a_ratio, json.c_ratio, json.d_ratio];
          //console.log(data);

          const color = d3.scale.ordinal()
            .domain(<any>[ 0, data.length -1])
            .range(['#D8D8D8', '#67C4A7' , '#8DA1CD', '#F08E65']);

          const width = 15;

          const svgRatioBar = svgtimeline.append('g')
            .style('transform', 'translate(' + (pairPosX[0] + 0.5*(pairPosX[1] - pairPosX[0] - width)) + 'px)');

          svgRatioBar.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', (d,i) => i * (w  / data.length - barPadding))
            .attr('y', (d, i) => h  - d * 100)
            .attr('width', width)
            .attr('height', (d) => d * 100)
            .attr('fill', (d, i) => <string>color(i.toString()));


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
export function create(parent:Element, options:any) {
  return new Timeline(parent, options);
}
