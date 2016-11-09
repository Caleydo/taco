/**
 * Created by Holger Stitz on 29.08.2016.
 */

import events = require('../caleydo_core/event');
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import {Language} from './language';
//import moment = require("../../libs/bower_components/moment/moment");
import moment = require('moment');
import ajax = require('../caleydo_core/ajax');

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
      <div id="timeline" class="svg-container"></div>
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
    var selected = (items.length > 0) ? items[0].item : undefined;

    const $li = this.$node.select('ul.output').selectAll('li').data(items);

    $li.enter()
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

    $li.exit().remove();

    // initialize other views with the first item
    if(selected !== undefined) {
      events.fire(AppConstants.EVENT_DATASET_SELECTED, selected);
    }

    const w = 600;
    const h = 200;

    //resize
    var width = $('#timeline').width();
    //var height = $('#timeline').height();
    //console.log(width);
    var aspect = w/h;
    //console.log(aspect);

    /*const xScale = d3.scale.linear()
     .domain([0, items.length])
     .range([0, w]);*/

    //console.log(items);

    console.log(items.length);
    //id-name of element
    //var id1 = items[1].item.desc.id;
    //var id2 = items[2].item.desc.id;
    /* console.log('DataItems');
     console.log(items[0]);
     console.log(items[1]);*/

    var ids:any [] = [];

    for (var _i = 0; _i < items.length-1; _i++) {
      ids.push(items[_i].item.desc.id);
    }
    console.log('ID - Array');
    console.log(ids);

    var idPairs = d3.pairs(ids);

    console.log('ID-Paris');
    console.log(idPairs);
    console.log(idPairs[0][0]);

    /*
     * Get the different type of changes as a sum (rows + cols) -> .../1/1/2/...
     */

    const barPromises = idPairs.map((pair) => {
      console.log('start loading pair', pair);
      //ajax.getAPIJSON(`/taco/diff_log/20130222GbmMicrorna/20130326GbmMicrorna/10/10/2/structure,content`)
      return Promise.all([ajax.getAPIJSON(`/taco/diff_log/${pair[0]}/${pair[1]}/1/1/2/structure,content`), pair])
        .then((args) => {
          const json = args[0];
          const pair = args[1];

          console.log('finished loading pair', pair, json);

          const w = 80;
          const h = 30;
          const barPadding = 0.5;

          const data = [json.no_ratio, json.a_ratio, json.c_ratio, json.d_ratio];
          //console.log(data);

          const color = d3.scale.ordinal()
            .domain(<any>[ 0, data.length -1])
            .range(['#D8D8D8', '#67C4A7' , '#8DA1CD', '#F08E65']);
          /*console.log(color(0));
           console.log(color(1));
           console.log(color(2));
           console.log(color(3));*/

          const ratioBarChart = d3.select('#ratioBar');
          /*  if(ratioBarChart.select('svg').size() > 0) {
           ratioBarChart.select('svg').remove();
           }*/

          const svgRatioBar = ratioBarChart.append('svg')
            .attr('width', w)
            .attr('height', h);

          svgRatioBar.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', (d,i) => i * (w  / data.length - barPadding))
            .attr('y', (d, i) => h  - d * 100)
            .attr('width', 15)
            .attr('height', (d) => d * 100)
            .attr('fill', (d, i) => <string>color(i.toString()));
        });
    });

    // check if all bars have been loaded
    Promise.all(barPromises).then((bars) => {
      console.log('finished loading of all bars');
    });

    const circleScale = d3.scale.linear()
      .domain([0, d3.max(items, (d:any) => d.item.dim[0]) ])
      .range([10, h/100]);

    //console.log(d3.max(items, (d:any,i) => d.dim[i]));

    const timeline = d3.select('#timeline');

    if(timeline.select('svg').size() > 0) {
      timeline.select('svg').remove();
    }

    const svgtimeline = timeline.append('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', '0 0 600 200')
      //.classed('svg-content', true)
      .attr('width', width)
      .attr('height', width * aspect);
    //.attr('width', w)
    //.attr('height', h);

    $(window).resize(function(){
      var width = $('#timeline').width();
      //var height = $('#timeline').height();
      svgtimeline.attr('width', width);
      svgtimeline.attr('height', width * aspect);
    });


    //helper variable for clicking event
    var isClicked = 0;

    svgtimeline.append('line')
      .style('stroke', 'black')
      .attr('x1', 0)
      .attr('y1', 60)
      .attr('x2', w)
      .attr('y2', 60);

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

    //gesamter Zeitbereich in Tagen
    var firstTimePoint = moment(items[0].time);
    var lastTimePoint =  moment(items[items.length-1].time);
    var timeRange = lastTimePoint.diff(firstTimePoint, 'days');

    // Abbildungsbereich = Width

    // Skalierungfaktor = Width / Time Range


    const xScaleTime = d3.scale.linear()
      .domain([0, timeRange])
      .range([20, w-20]); // 20 = Spacing

    svgtimeline.selectAll('circle')
      .data(items)
      .enter()
      .append('circle')
      .attr('title', (d:any) => (d.time) ? d.time.format(AppConstants.DATE_FORMAT) : d.key)
      .attr('cy', 60)
      //.attr('cx', (d:any,i) => xScale(i) + circleScale(d.item.dim[0]))

      //moment(d.time) = current timestamp
      //moment(items[0].time) = first timestamp
      .attr('cx', (d:any) => {
        if(d.time) {
          return xScaleTime(moment(d.time).diff(moment(items[0].time),'days'));
        } else {
          return 60;
        }
      })
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

    svgtimeline.append('line')
      .style('stroke', 'black')
      .attr('x1', 0)
      .attr('y1', 60)
      .attr('x2', w)
      .attr('y2', 60);

    /*svgtimeline.selectAll('text')
     .data(items)
     .enter()
     .append('text')
     .text(function (d:any) { console.log(d.desc.name); return d.desc.name; })
     .attr('x', function (d:any, i) {
     return xScale(i) + circleScale(d.dim[0]);
     })
     .attr('y', 100)
     .attr('font-size', '12px')
     .attr('fill', 'black');*/


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
