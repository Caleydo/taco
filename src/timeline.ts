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
      <div class="btn-group change" role="group" aria-label="...">
         <button type="button" class="btn btn-default" id="btn-nochange " data-change-type="nochanges">No changes</button>
         <button type="button" class="btn btn-default" id="btn-removed" data-change-type="removed">Removed</button>
         <button type="button" class="btn btn-default" id="btn-added" data-change-type="added">Added</button>
         <button type="button" class="btn btn-default" id="btn-content" data-change-type="content">Content</button>        
      </div>  
         
      <div class="btn-group filter" role="group" aria-label="...">
        <button type="button" class="btn btn-default toggleTimeline" id="btn-timeline" data-change-type="timefilter">Show/Hide Timeline</button> 
        <button type="button" class="btn btn-default toggleGroup" id="btn-group">Group Changes</button> 
        <button type="button" class="btn btn-default" id="btn-stacked">Show as stacked bars</button> 
     </div>
     </div>`);


    // TODO build timeline using D3 of parts that doesn't change on update()
    this.$node.html(`           
      <div id="timeline"></div>
      <div id="groupedBars"></div>  
    `);


    this.$svgTimeline = this.$node.select('#timeline')
      .append('svg')
      .attr('width', this.timelineWidth)
      .attr('height', this.timelineHeight);

    // console.log(d3.select('.selector').selectAll('div'));

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

    // console.log('toggleTimeline', this.$navbar.select('div .btn-group.filter').select('.toggleTimeline'));
    // get toogle Button
    let showHideButton = this.$navbar.select('div .btn-group.filter').select('.toggleTimeline');
    // console.log('show/hide button', showHideButton);

    // Hide and Show timeline (line + circles)
    showHideButton.on('click', function (e) {
      // let button = d3.select(this);
      //console.log(button);
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


    // creating 2D Ratio bars
    let noratio = [];
    let aratio = [];
    let cratio = [];
    let dratio = [];
    let finalArray:any = [];

    function requestDataGroupedBars() {
      const ids = items.map((d) => d.item.desc.id);

      //console.log(ids);

      return d3.pairs(ids).map((pair) => {
        return Promise.all([ajax.getAPIJSON(`/taco/diff_log/${pair[0]}/${pair[1]}/1/1/2/structure,content`), pair])
          .then((args) => {
            const json = args[0];
            noratio.push(json.no_ratio);
            aratio.push(json.a_ratio);
            cratio.push(json.c_ratio);
            dratio.push(json.d_ratio);

          });
      });
    }

    const groupedBars = d3.selectAll('#groupedBars').append('svg');

    function openGroupedBars() {
      Promise.all(requestDataGroupedBars()).then((bars) => {
        finalArray = noratio.concat(aratio, cratio, dratio);
        drawgroupedBars(finalArray);
      });
    }

    // openGroupedBars();
    let buttonGroup = this.$navbar.select('div .btn-group.filter').select('.toggleGroup');
    console.log('buttonGroup', buttonGroup);

    buttonGroup.on('click', function (e) {
      // let line =  this.$svgTimeline.select('line');
      //let circle =  this.$svgTimeline.selectAll('circle');
      let bars =  that.$svgTimeline.selectAll('rect');
      // let line = that.$svgTimeline.select('line');
      //let circle = that.$svgTimeline.selectAll('circle');



      bars.remove();

      //if (line.size() > 0 && circle.size() > 0 && bars.size() > 0) {
      if ( bars.size() > 0) {
        //  line.remove();
        //circle.remove();
        bars.remove();
        openGroupedBars();
      } else {
        groupedBars.remove();
        that.generateBars(20);

      }
    });//End button remove

    //openGroupedBars();


    function drawgroupedBars(finalArray) {
      const w = 300;
      const h = 80;

      groupedBars.selectAll('rect')
        .data(finalArray)
        .enter()
        .append('rect')
        //.attr('x', (d, i) => i * (w / noratio.length - barPadding) + 20)
        .attr('x', (d, i) => i * (w / 20))
        .attr('y', (d:any, i) => h - (d * 100))
        .attr('width', 10 + 'px')
        .attr('height', (d:any) => d * 100);
      /*.attr('fill', function (d, i) {

       if (i <= 5) {
       return '#D8D8D8';
       } else if (i > 5) {
       return '#67c4a7';
       } else if (i > 12) {
       return '#8DA1CD';
       }
       });*/
    }


      //helper variable for clicking remove button!
          let isbtnClicked = false;

          let changeButton = this.$navbar.select('div .btn-group.change');
          //this.$navbar.selectAll('div .btn-group.change').on('click', function () {
          changeButton.on('click', function () {

            //which button is clicked
            const button = d3.select(this);
            //console.log('button', button);
            // which change type
            const changeType =  button.attr('data-change-type');
            //console.log('changeType', changeType);
            //color and data for drawing bars which all change types
            let colors =  that.color;
            let datas = that.data_all;

            //remove all currents bars
            that.$svgTimeline.selectAll('g').remove();

            // show default all bars and colors
            if(isbtnClicked === false) {
              // console.log('Button is clickt');
             // drawBars(datas, colors);
              isbtnClicked  = false;

            }
            //console.log('Übergabeparameter', changeType);
            //override colors for change type
            switch (changeType) {
              case 'nochanges':
                colors =  that.color_nochanges;
                //datas = data_nochange;
                //console.log('No change');
                // console.log(colors, datas);
                break;
              case 'removed':
                colors =  that.color_removed;
                //datas = data_removed;
                break;
            }
            //console.log('current Data and color', datas, colors);
            //console.log(changeType, datas, colors);

            that.generateBars(20);
            // isbtnClicked = true;

          });


    /*console.log('request Data for changeBars', this.requestData());
     Promise.all(this.requestData()).then((bars) => {
        console.log('get Data');
      });*/

   //console.log(this.requestData());

  }

  private color = d3.scale.ordinal()
    .range(['#D8D8D8', '#67c4a7', '#8DA1CD', '#F08E65']);

  private color_removed = d3.scale.ordinal()
    .range(['#D8D8D8', '#67c4a7', '#8DA1CD']);

  private color_added = d3.scale.ordinal()
    .range(['#D8D8D8', '#8DA1CD', '#F08E65']);

  private color_content = d3.scale.ordinal()
    .range(['#D8D8D8', '#67c4a7', '#F08E65']);

  private color_nochanges = d3.scale.ordinal()
    .range(['#67c4a7', '#8DA1CD', '#F08E65']);

  private data_all =[];


  /*private requestData () {
    const ids = this.items.map((d) => d.item.desc.id);

    //console.log(ids);

    return d3.pairs(ids).map((pair) => {
      return Promise.all([ajax.getAPIJSON(`/taco/diff_log/${pair[0]}/${pair[1]}/1/1/2/structure,content`), pair])
        .then((args) => {
          const json = args[0];
          const pair = args[1];

          const pairPosX = pair.map((d) => parseFloat(d3.select(`#circle_${d}`).attr('cx')));

          //console.log(json, pair, pairPosX);

          return json;


        });
    });
  }*/

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

          const pairPosX = pair.map((d) => parseFloat(d3.select(`#circle_${d}`).attr('cx')));

          console.log('finished loading pair - BARS', pair, pairPosX, json);

          const w = 80;
          const h = 30;
          const barPadding = 0.5;

          //const data_all = [json.no_ratio, json.a_ratio, json.c_ratio, json.d_ratio];
          this.data_all = [json.no_ratio, json.a_ratio, json.c_ratio, json.d_ratio];

          const data_removed = [json.no_ratio, json.a_ratio, json.c_ratio];

          const data_content = [json.no_ratio, json.a_ratio, json.d_ratio];

          const data_added = [json.no_ratio, json.c_ratio, json.d_ratio];

          const data_nochange = [json.a_ratio, json.c_ratio, json.d_ratio];

         /* const svgRatioBar = this.$svgTimeline.append('g')
           .style('transform', 'translate(' + (pairPosX[0] + 0.5 * (pairPosX[1] - pairPosX[0] - width)) + 'px)');*/

          //all changes
          //drawBars(this.data_all, that.color);


         // function drawBars(data:any, color) {

            const svgRatioBar = that.$svgTimeline.append('g')
              .style('transform', 'translate(' + (pairPosX[0] + 0.5 * (pairPosX[1] - pairPosX[0] - width)) + 'px)');

            console.log('g Element', svgRatioBar, pairPosX);

            svgRatioBar.selectAll('rect')
              .data(this.data_all)
              .enter()
              .append('rect')
              .attr('x', (d, i) => i * (w / this.data_all.length - barPadding))
              .attr('y', (d, i) => h - d * 100)
              .attr('width', width)
              .attr('height', (d) => d * 100)
              .attr('fill', (d, i) => <string>this.color(i.toString()))
              //.attr('fill', (d, i) => testcolor)
              //.attr('fill', (d, i) => <string>color[i])
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
         // }



        /*  //helper variable for clicking remove button!
          let isbtnClicked = false;

          let changeButton = this.$navbar.select('div .btn-group.change');
          //this.$navbar.selectAll('div .btn-group.change').on('click', function () {
          changeButton.on('click', function () {

            //which button is clicked
            const button = d3.select(this);
            //console.log('button', button);
            // which change type
            const changeType =  button.attr('data-change-type');
            //console.log('changeType', changeType);
            //color and data for drawing bars which all change types
            let colors =  that.color;
            let datas = data_all;

            //remove all currents bars
            that.$svgTimeline.selectAll('g').remove();

            // show default all bars and colors
            if(isbtnClicked === false) {
              // console.log('Button is clickt');
              drawBars(datas, colors);
              isbtnClicked  = false;

            }
            //console.log('Übergabeparameter', changeType);
            //override colors for change type
            switch (changeType) {
              case 'nochanges':
                colors =  that.color_nochanges;
                datas = data_nochange;
                //console.log('No change');
                // console.log(colors, datas);
                break;
              case 'removed':
                colors =  that.color_removed;
                datas = data_removed;
                break;
            }
            //console.log('current Data and color', datas, colors);
            //console.log(changeType, datas, colors);

            drawBars(datas, colors);
            // isbtnClicked = true;

          });
*/





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
