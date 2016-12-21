/**
 * Created by Holger Stitz on 19.12.2016.
 */

import * as d3 from 'd3';
import * as ajax from 'phovea_core/src/ajax';
import * as moment from 'moment';
import * as $ from 'jquery';
import * as events from 'phovea_core/src/event';
import {AppConstants, ChangeTypes, IChangeType} from './app_constants';
import {IAppView} from './app';
import {getPosXScale, scaleCircles} from './util';

/**
 * Shows a bar with buttons to filter other views
 */
class BarChart implements IAppView {

  private $node;

  private items;

  private totalWidth = 0;

  private openHistogram2D;

  private static getURL(pair) {
    const bin_cols = 1; // 1 bin
    const bin_rows = 1; // 1 bin
    const direction = 2; // 2 = rows + columns
    const changes = 'structure,content';
    return `/taco/diff_log/${pair[0]}/${pair[1]}/${bin_cols}/${bin_rows}/${direction}/${changes}`;
  }


  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('bar_chart', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<BarChart>}
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
    //
  }

  private resize() {
    this.totalWidth = $(this.$node.node()).width();

    // Update line
    this.$node.attr('width', this.totalWidth);

    // Updating scale for circle position
    //let xScaleTimeline = getPosXScale(this.items, this.totalWidth);

    /*this.$node.selectAll('div')
     .attr('x', (d: any, i) => {
     if (d.time) {
     return xScaleTimeline(moment(d.time).diff(moment(this.items[0].time), 'days'));
     } else {
     return i * this.scaleCircles();
     }
     });*/


    // start width for bars of ratio bar charts
    /*let rectWidth = 13;

     if (this.widthTimelineDiv <= 800) {
     if (rectWidth >= 5) {
     this.$svgTimeline.selectAll('g').remove();
     } else {
     rectWidth = rectWidth - 1;
     //this.generateBars(rectWidth);
     }
     } else {
     rectWidth = 15;
     //this.generateBars(rectWidth);
     }*/
  }

  private attachListener() {
    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', () => this.resize());

    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items) => this.updateItems(items));

    events.on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
    events.on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
  }

  private updateItems(items) {
    this.items = items;

    // initialize the width
    this.resize();

    let barPromises = this.requestData();
    // Check if all bars have been loaded
    Promise.all(barPromises).then((bars) => {
      console.log('finished loading of all bars');
    });
  }

  private toggleChangeType(changeType) {
    this.$node.selectAll(`div.bars > .${changeType.type}`).classed('hidden', !changeType.isActive);
  }

  private requestData() {
    return d3.pairs(this.items)
      .map((pair) => {
        let ids = pair.map((d: any) => d.item.desc.id);
        return Promise.all([ajax.getAPIJSON(BarChart.getURL(ids)), pair, ids])
          .then((args) => {
            const json = args[0];
            const pair = args[1];
            const ids = args[2];
            this.drawBars(json, pair, ids);
          });
      });
  }

  private drawBars(data, pair, ids) {
    const that = this;

    const posXScale = getPosXScale(this.items, this.totalWidth);

    const posX = posXScale(moment(pair[0].time).diff(moment(this.items[0].time), 'days'));

      //.style('transform', 'translate(' + (pairPosX[0] + 0.5 * (pairPosX[1] - pairPosX[0] - width)) + 'px)');

    const circleScale = scaleCircles(this.totalWidth);

    console.log('CircleScale', circleScale);

    const w = 80;
    const h = 50;
    //const barPadding = 0.5;

    //console.log('items', this.items);

    const barData = this.getBarData(data);

    const barScaling = d3.scale.log()
      .domain([0.0000001, 1])
      //.domain([0, barData])
      .range([0, h]);

    //console.log('BarScaling', barScaling(1));


    const $barsGroup = this.$node.append('div')
      .classed('bars', true)
    /*.style('left', (items) => {
       if (this.items[0].time) {
            //console.log('in if', posX);
            return posX + 'px';
          } else {
            return circleScale * ;
          }
        })*/
      .style('left', posX + 45 + 'px')
      .style ('width', w + 'px')
      .style('height', h + 'px')
      .style('position', 'absolute')
      .style('margin-bottom', 20 + 'px')
      .style('transform', 'scaleY(-1)');



    //.text('test');

    const $bars = $barsGroup.selectAll('div.bar').data(barData);

    $bars.enter().append('div');
    //console.log(barData[0].value);

    $bars
      .attr('class', (d) => 'bar ' + d.type)
      .style('float', 'left')
      .style('height', (d) => barScaling(d.value)  + 'px')
      .style('width',  20 + 'px')
      .style('position', 'relative')
      .style('margin-bottom', (d) => barScaling(d.value) - h  + 'px');

    $bars.exit().remove();

    //console.log(pair, data, posX);

    $barsGroup.on('click', function (e) {
      const currentPosX = parseFloat(d3.select(this).style('left'));

      if (that.openHistogram2D === this.parentNode) {
        events.fire(AppConstants.EVENT_CLOSE_2D_HISTOGRAM);
        that.openHistogram2D = null;

      } else {
        events.fire(AppConstants.EVENT_OPEN_2D_HISTOGRAM, currentPosX, ids);
        that.openHistogram2D = this.parentNode;
      }
    });
  }

  private getBarData(data) {
    return ChangeTypes.TYPE_ARRAY
    //.filter((d) => d.isActive === true)
      .map((d) => {
        return {
          type: d.type,
          value: data[d.ratioName]
        };
      });
  }

}

/**
 * Factory method to create a new Histogram2D instance
 * @param parent
 * @param options
 * @returns {FilterBar}
 */
export function create(parent: Element, options: any) {
  return new BarChart(parent, options);
}
