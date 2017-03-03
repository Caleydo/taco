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
 * This class adds a bar chart, that shows bars with click functionality,
 * in order to show further context.
 */
class BarChart implements IAppView {

  private $node;
  private items;

  private totalWidth: number = 0;
  private openHistogram2D;
  private index = [];
  private leftValue = [];

  // Width of the bars in the bar chart
  private widthBar: number = 15;

  // Width and Height for the bar chart between time points
  private widthBarChart: number = 80;
  private heightBarChart: number = 50;

  private tooltipDivBar;

  private barScaling = d3.scale.log()
    .domain([0.1, 1000000])
    .range([0, 50]);

  /**
   * Method retrieves data by given parameters TODO: Documentation
   * @param pair
   * @returns {string}
   */
  private static getURL(pair) {
    const binCols = 1; // 1 bin
    const binRows = 1; // 1 bin
    const direction = 2; // 2 = rows + columns
    const changes = 'structure,content';
    return `/taco/diff_log/${pair[0]}/${pair[1]}/${binCols}/${binRows}/${direction}/${changes}`;
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
    this.tooltipDivBar = d3.select('.selector').append('div')
      .classed('tooltip', true)
      .attr('id', 'tooltip2')
      .style('opacity', 0);

  }


  /**
   * This method is called when the window or chart gets resized.
   * It calculates the new width and sets it for the bar chart.
   */
  private resize() {
    this.totalWidth = $(this.$node.node()).width();

    // Update line
    this.$node.attr('width', this.totalWidth);

  }

  /**
   * This method is used to attach all listeners and listen for events.
   * The events are triggered throughout the program and are catched here.
   */
  private attachListener() {
    // Call the resize function whenever a resize event occurs
    //d3.select(window).on('resize', () =>  this.windowResize());

    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items) => this.updateItems(items));

    events.on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
    events.on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
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

    if (elements.empty() === false) {
      barPromises = this.requestData(this.totalWidth, this.leftValue);
      elements.remove();

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
   * TODO: Documentation
   * @param changeType
   */
  private toggleChangeType(changeType) {
    // this.$node.selectAll(`div.bars > .${changeType.type}`).classed('hidden', !changeType.isActive);

    //Local Copy of current Items which gets changed
    let itemsAdaption = this.items;

    if(changeType.type === 'nochange' && changeType.isActive) {
      console.log(itemsAdaption);
    }

    //Redraw with new values
    this.updateItems(itemsAdaption);
  }


  /**
   * This event happens upon resizing the window and it calculates the new array
   * and the index as well as the positioning.
   * @param items which are displayed in the chart
   */
  private windowResize(items) {
    this.items = items;
    const width = $(window).innerWidth();

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
        return Promise.all([ajax.getAPIJSON(BarChart.getURL(ids)), pair, ids])
          .then((args) => {

            //console.log('data', args[0].counts);
            const counts = args[0].counts;
            const json = args[0];
            const pair = args[1];
            const ids = args[2];

            ChangeTypes.TYPE_ARRAY
              .filter((d) => d.isActive === false)
              .forEach((changeType:IChangeType) => {
                json.ratios[changeType.ratioName] = 0;
                json.counts[changeType.countName] = 0;
              });

            //console.log('json, pair, ids', json, pair, ids);

            this.drawBars(json, pair, ids, leftValue.shift(), totalWidth, counts);
          });
      });
  }

  /**
   * This method draws the bars on the timeline or above the timeline.
   * TODO: Documentation
   * @param data
   * @param pair
   * @param ids
   * @param circleScale
   * @param totalWidth
   */
  private drawBars(data, pair, ids, circleScale, totalWidth, counts) {
    const that = this;
    const posXScale = getPosXScale(this.items, totalWidth);

    /*const posX = posXScale(moment(pair[0].time).diff(moment(this.items[0].time), 'days'))
     + 0.06 * (posXScale(moment(pair[1].time).diff(moment(this.items[0].time), 'days'))
     - posXScale(moment(pair[0].time).diff(moment(this.items[0].time), 'days')));*/

    const posX = posXScale(moment(pair[0].time).diff(moment(this.items[0].time), 'days')) + 7;
    //console.log('Ratio', data.ratios);


    const barData = this.getBarData(data.ratios);
    const barCounts = this.getBarDataCounts(data.counts);

    //console.log('Counts restructured', barCounts);
    //console.log('Ratio restructured', barData);



    let $barsGroup = this.$node;

    if (pair[0].time) {
      $barsGroup = this.$node.append('div')
        .classed('bars', true)
        .style('left', posX + 'px')
        .style('width', this.widthBarChart + 'px')
        .style('height', 100 + 'px')
        // .style('height', this.heightBarChart + 'px')
        .style('position', 'absolute')
        .style('margin-bottom', 5 + 'px')
        .style('transform', 'scaleY(-1)');
    } else {

      $barsGroup = this.$node.append('div');

      $barsGroup
        .classed('bars', true)
        .style('left', circleScale + 'px')
        .style('width', this.widthBarChart + 'px')
        .style('height', 100 + 'px')
        //.style('height', this.heightBarChart + 'px')
        .style('position', 'absolute')
        .style('margin-bottom', 5 + 'px')
        .style('transform', 'scaleY(-1)');
    }


    //individual bars in the bar group div
    let $bars = $barsGroup.selectAll('div.bar').data(barCounts);
    $bars.enter().append('div');

    $bars
      .attr('class', (d) => 'bar ' + d.type)
      .style('height', (d) => this.barScaling(d.value) + 'px')
      .style('width', this.widthBar + 'px')
      .style('position', 'absolute')
      .on('mouseover', function (d, i) {
        const position = d3.mouse(document.body);

        that.tooltipDivBar
          .transition()
          .duration(200)
          .style('opacity', .9);

        that.tooltipDivBar.html(d.value.toFixed(2))
          .style('left', function (d) {
            if (($(window).innerWidth() - 100) < position[0]) {
              return (position[0] - 30) + 'px';
            } else {
              return (position[0] + 10) + 'px';
            }
          })
          .style('top', (position[1] + 10) + 'px');
      })
      .on('mouseout', function (d, i) {
        that.tooltipDivBar.transition()
          .duration(500)
          .style('opacity', 0);
      });

    //Here the bars are transformed and positioned for the first time
    $bars = this.transformElement($bars, barCounts);

    $bars.exit().remove();
  }

  /**
   * TODO: Documentation
   * @param data
   * @returns {{type: string, value: any}[]}
   */
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

  private getBarDataCounts(data) {
    return ChangeTypes.TYPE_ARRAY
    //.filter((d) => d.isActive === true)
      .map((d) => {
        return {
          type: d.type,
          value: data[d.countName]
        };
      });
  }

  private transformElement(element, dataTypes) {
    console.log(dataTypes);

    let nochange = 0;
    let content = 0;
    let added = 0;
    let removed = 0;

    if(dataTypes[0].type === 'nochange') {      //no change
      nochange = this.barScaling(dataTypes[0].value);
      if(isNaN(nochange)) {
        nochange = 0;
      }
    }
    if(dataTypes[3].type === 'content') {   //content change
      content = this.barScaling(dataTypes[3].value);
      if(isNaN(content)) {
        content = 0;
      }

    }
    if(dataTypes[1].type == 'added') {    //added
      added = this.barScaling(dataTypes[1].value);
      if(isNaN(added)) {
        added = 0;
      }
    }
    if(dataTypes[2].type == 'removed') {    //removed
      removed = this.barScaling(dataTypes[2].value);
      if(isNaN(removed)) {
        removed = 0;
      }
    }

    //Transform the element here depending on data
    element.style('transform', function(d) {
      if(d.type === 'nochange') {
        return 'translate(' + 0 + 'px)';
      }

      if(d.type === 'content') {
        return 'translate(' + 0 + 'px,' + nochange + 'px)';
      }

      if(d.type === 'added') {
        return 'translate(' + 0 + 'px,' + (nochange + content) + 'px)';
      }

      if(d.type === 'removed') {
        return 'translate(' + 0 + 'px,' + (nochange + content + added) + 'px)';
      }
    });
    // element.style('transform', function (d) {
    //   if(d.type === "nochange" ) {
    //     nochange = barScaling(d.value);
    //
    //     if(isNaN(nochange)) {
    //       return 'translate(' + 0 + 'px)';
    //     } else {
    //       return 'translate(' + 0 + 'px)';
    //     }
    //   }
    //   if(d.type === "added") {
    //     added = barScaling(d.value);
    //     if(isNaN(added)) {
    //       return 'translate(' + 0 + 'px)';
    //     } else {
    //       return 'translate(' + 0 + 'px,' + (nochange) + 'px)';
    //     }
    //   }
    //   if(d.type === "removed") {
    //     removed = barScaling(d.value);
    //
    //     if(isNaN(removed)) {
    //       return 'translate(' + 0 + 'px,' + (nochange) + 'px)';
    //     } else {
    //       return 'translate(' + 0 + 'px,' + (nochange + added) + 'px)';
    //     }
    //   }
    //   if(d.type === "content") {
    //     content = barScaling(d.value);
    //
    //     if(isNaN(content)) {
    //       return 'translate(' + 0 + 'px,' + (nochange + added) + 'px)';
    //     } else {
    //       return 'translate(' + 0 + 'px,' + (nochange + added + removed) + 'px)';
    //     }
    //   }
    // });

    return element;
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
