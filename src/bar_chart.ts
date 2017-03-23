/**
 * Created by Holger Stitz on 19.12.2016.
 */

import * as d3 from 'd3';
import * as ajax from 'phovea_core/src/ajax';
import * as $ from 'jquery';
import * as events from 'phovea_core/src/event';
import {AppConstants, ChangeTypes, IChangeType} from './app_constants';
import {IAppView} from './app';
import {scaleCircles, getTimeScale, selectTimePoint} from './util';

/**
 * This class adds a bar chart, that shows bars with click functionality,
 * in order to show further context.
 */
class BarChart implements IAppView {

  private $node;
  private items;

  private totalWidth: number = 0;
  private index = [];
  private leftValue = [];

  // Width of the bars in the bar chart
  private widthBar: number = 15;

  // Width and Height for the bar chart between time points
  private widthBarChart: number = 15;
  private heightBarChart: number = 100;

  private barScaling = d3.scale.log()
    .domain([0.1, 100000])
    .range([0, this.heightBarChart / ChangeTypes.TYPE_ARRAY.length])
    .clamp(true);

  /**
   * Method retrieves data by given parameters TODO: Documentation
   * @param pair
   * @returns {Promise<any>}
   */
  private static getJSON(pair) {
    const operations = ChangeTypes.forURL();
    return ajax.getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${operations}/bar_chart`);
  }

  /**
   * Constructor method for the BarChart class which creates the bar chart on the given parent element.
   * Including eventual options if supplied.
   * @param parent element on which the bar chart element is created
   * @param options optional options for the bar chart element
   */
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

    // Return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }


  /**
   * Build the basic DOM elements and binds the change function
   */
  private build() {
    //
  }


  /**
   * This method is called when the window or chart gets resized.
   * It calculates the new width and sets it for the bar chart.
   */
  private resize() {
    this.totalWidth = $(this.$node.node()).width();

    this.$node.style('width', this.totalWidth);
  }

  /**
   * This method is used to attach all listeners and listen for events.
   * The events are triggered throughout the program and are catched here.
   */
  private attachListener() {
    // Call the resize function whenever a resize event occurs
    //d3.select(window).on('resize', () =>  this.windowResize());

    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items) => {
      this.$node.selectAll('*').remove(); // remove, because we have completely new items
      this.updateItems(items);
    });

    events.on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType:IChangeType) => {
      this.scaleBarsHeight(); // just rescale the height of the bars
    });

    events.on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType:IChangeType) => {
      this.scaleBarsHeight(); // just rescale the height of the bars
    });
  }

  /**
   * Create Array with index numbers for the positioning of the bars without the time element
   * @param items are the elements that are displayed
   * @param width is the new width of the chart
   */
  private generateIndexArray(items, width) {
    this.items = items;

    this.index = d3.range(1, items.length);
    const circleScaling = scaleCircles(width, this.items.length);

    for (const i in this.index) {
      if (this.index.hasOwnProperty(i)) {
        this.leftValue.push((this.index[i] * circleScaling));
      }
    }
  }

  /**
   * This method updates the chart upon changing the data or if new data arrives.
   * @param items which are used for the chart
   */
  private updateItems(items) {
    this.items = items;
    const width = $(window).innerWidth();
    // Generate the array with positioning numbers
    this.generateIndexArray(this.items, width);

    // Initialize the width
    this.resize();
    $(window).on('resize', () => this.windowResize(this.items));

    let barPromises;
    const elements = this.$node.selectAll('*');

    // draw the first bar manually showing only additions
    const firstSize = this.items[0].item.desc.size;
    this.drawBars({counts: {a_counts: firstSize[0] * firstSize[1]}, ratios: {a_ratio: 1.0}}, [this.items[0], this.items[0]], 10, this.totalWidth);

    if (elements.empty() === false) {
      barPromises = this.requestData(this.totalWidth, this.leftValue);

    } else {
      barPromises = this.requestData(this.totalWidth, this.leftValue);
      this.leftValue = [];
    }

    // Check if all bars have been loaded
    Promise.all(barPromises).then((bars) => {
      console.log('finished loading of all bars');
    });
  }


  /**
   * This event happens upon resizing the window and it calculates the new array
   * and the index as well as the positioning.
   * @param items which are displayed in the chart
   */
  private windowResize(items) {
    this.items = items;
    const width = $(this.$node.node()).width();

    this.generateIndexArray(this.items, width);

    const elements = d3.selectAll('.bars');
    if (elements.empty() === false) {
      this.requestData(width, this.leftValue);
      elements.remove();
    }
    this.leftValue = [];
  }

  /**
   * TODO: Documentation
   * @param totalWidth
   * @param leftValue
   * @returns {Promise<TResult>[]}
   */
  private requestData(totalWidth, leftValue) {
    return d3.pairs(this.items)
      .map((pair) => {
        const ids = pair.map((d: any) => d.item.desc.id);
        return Promise.all([BarChart.getJSON(ids), pair, ids])
          .then((args) => {
            const json = args[0];
            const pair = args[1];
            this.drawBars(json, pair, leftValue.shift(), totalWidth);
          });
      });
  }

  /**
   * This method draws the bars on the timeline or above the timeline.
   * TODO: Documentation
   * @param data
   * @param pair
   * @param circleScale
   * @param totalWidth
   */
  private drawBars(data, pair, circleScale:number, totalWidth:number) {
    const posXScale = getTimeScale(this.items, totalWidth);

    //const barData = this.getBarData(data.ratios, 'ratioName');
    const barData = this.getBarData(data.counts, 'countName');

    const currId = pair.map((d) => d.item.desc.id).join('_');
    let $barsGroup = this.$node.select(`[data-id="${currId}"]`);

    // create bar group for id if not exists
    if($barsGroup.node() === null) {
      $barsGroup = this.$node.append('div')
        .classed('bars', true)
        .attr('data-id', currId)
        .style('width', this.widthBarChart + 'px')
        .style('height', this.heightBarChart + 'px')
        .style('left', ((pair[1].time) ? posXScale(pair[1].time.toDate()) : circleScale) + 'px')
        .on('click', () => {
          selectTimePoint(pair[1]);
        });
    }

    //individual bars in the bar group div
    const $bars = $barsGroup.selectAll('div.bar').data(barData);
    $bars.enter().append('div');

    $bars
      .attr('class', (d) => 'bar ' + d.type)
      .style('width', this.widthBar + 'px')
      .attr('title', (d) => `${ChangeTypes.labelForType(d.type)}: ${d.value.toFixed(2)} cells`);

    $bars.exit().remove();

    this.scaleBarsHeight();
  }

  private scaleBarsHeight() {
    this.$node.selectAll('.bar')
      .style('height', (d) => {
        if(ChangeTypes.TYPE_ARRAY.filter((ct) => ct.type === d.type)[0].isActive) {
          return this.barScaling(d.value) + 'px';
        }
        return 0; // shrink bar to 0 if change is not active
      });
  }


  /**
   *
   * @param data
   * @param propertyName
   * @returns {{type: string, value: any}[]}
   */
  private getBarData(data, propertyName) {
    return ChangeTypes.TYPE_ARRAY
    //.filter((d) => d.isActive === true)
      .map((d) => {
        return {
          type: d.type,
          value: data[d[propertyName]] || 0
        };
      });
  }
}

/**
 * Factory method to create a new BarChart instance.
 * @param parent Element on which the bar chart is drawn
 * @param options Parameters for the instance (optional)
 * @returns {BarChart}
 */
export function create(parent: Element, options: any) {
  return new BarChart(parent, options);
}
