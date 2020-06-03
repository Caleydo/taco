/**
 * Created by Holger Stitz on 19.12.2016.
 */

import * as d3 from 'd3';
import {AppContext} from 'phovea_core';
import * as $ from 'jquery';
import {GlobalEventHandler} from 'phovea_core';
import {AppConstants, ChangeTypes, IChangeType} from '../app/AppConstants';
import {IAppView} from '../app/App';
import {TimePointUtils} from '../common/TimePointUtils';
import {ITacoTimePoint} from '../common/interfaces';

/**
 * This class adds a bar chart, that shows bars with click functionality,
 * in order to show further context.
 */
class BarChart implements IAppView {

  private $node: d3.Selection<any>;
  private items: ITacoTimePoint[];

  private totalWidth: number = 0;

  // Width of the bars in the bar chart
  private widthBar: number = AppConstants.TIMELINE_BAR_WIDTH;

  // Width and Height for the bar chart between time points
  private widthBarChart: number = AppConstants.TIMELINE_BAR_WIDTH;
  private heightBarChart: number = 100;

  private barScaling = d3.scale.linear()
    .domain([0, 1])
    .range([0, this.heightBarChart]);

  /**
   * Method retrieves data by given parameters TODO: Documentation
   * @param pair
   * @returns {Promise<any>}
   */
  private static getJSON(pair): Promise<any> {
    const operations = ChangeTypes.forURL();
    return AppContext.getInstance().getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${operations}/bar_chart`);
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
    this.attachListener();

    // Return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  /**
   * This method is called when the window or chart gets resized.
   * It calculates the new width and sets it for the bar chart.
   */
  private resize() {
    this.totalWidth = TimePointUtils.getTotalWidth(this.items, AppConstants.TIMELINE_BAR_WIDTH, $(this.$node.node()).width());
    this.$node.style('width', this.totalWidth);
  }

  /**
   * This method is used to attach all listeners and listen for events.
   * The events are triggered throughout the program and are catched here.
   */
  private attachListener() {
    // Call the resize function whenever a resize event occurs
    GlobalEventHandler.getInstance().on(AppConstants.EVENT_RESIZE, () => {
      if (this.items) {
        this.resize();
        this.updateItems(this.items);
      }
    });

    GlobalEventHandler.getInstance().on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items: ITacoTimePoint[]) => {
      this.items = items;
      this.barScaling.domain([0, 1]);
      this.updateItems(items);
    });

    GlobalEventHandler.getInstance().on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType: IChangeType) => {
      this.scaleBarsHeight(); // just rescale the height of the bars
    });

    GlobalEventHandler.getInstance().on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType: IChangeType) => {
      this.scaleBarsHeight(); // just rescale the height of the bars
    });
  }

  /**
   * This method updates the chart upon changing the data or if new data arrives.
   * @param items which are used for the chart
   */
  private updateItems(items: ITacoTimePoint[]) {
    const that = this;

    // duplicate the first entry to show a bar for the first timestep
    items.unshift(items[0]);

    // calculate total width and resize now
    this.resize();

    const pairs = d3.pairs(items);
    const posXScale = TimePointUtils.getTimeScale(items, this.totalWidth);

    const $bars = this.$node.selectAll('div.bars')
      .data(pairs, (d) => d[1].item.desc.id);

    $bars.enter().append('div')
      .classed('bars', true)
      .classed('loading', true)
      .style('width', this.widthBarChart + 'px')
      .style('height', this.heightBarChart + 'px')
      .on('mouseenter', (d) => {
        GlobalEventHandler.getInstance().fire(AppConstants.EVENT_TIME_POINT_HOVERED, d[1].time.toDate(), true);
      })
      .on('mouseleave', (d) => {
        GlobalEventHandler.getInstance().fire(AppConstants.EVENT_TIME_POINT_HOVERED, d[1].time.toDate(), false);
      })
      .on('click', (d) => {
        TimePointUtils.selectTimePoint(d[1]);
      })
      .each(function (pair, i) {
        const ids = pair.map((d: any) => d.item.desc.id);
        return BarChart.getJSON(ids)
          .then((json) => {
            // shift no-change to additions for first bar
            if (i === 0) {
              json.counts.a_counts = json.counts.no_counts;
              json.counts.no_counts = 0;
              json.ratios.a_ratio = json.ratios.no_a_ratio;
              json.ratios.no_a_ratio = 0;
            }

            const $bars = d3.select(this).classed('loading', false);
            that.drawBar($bars, json, pair);
          });
      });

    $bars.style('left', (d) => posXScale(d[1].time.toDate()) + 'px');

    $bars.exit().remove();
  }

  /**
   * This method draws the bars on the timeline or above the timeline.
   * TODO: Documentation
   * @param $parent
   * @param data
   * @param pair
   */
  private drawBar($parent, data, pair) {
    //const barData = this.getBarData(data.ratios, 'ratioName');
    const barData = this.getBarData(data.counts, 'countName');

    // update the maximum bar height
    const maxDomain = Math.max(this.barScaling.domain()[1], barData.map((d) => d.value).reduce((a, b) => a + b, 0));
    this.barScaling.domain([this.barScaling.domain()[0], maxDomain]);

    //individual bars in the bar group div
    const $bars = $parent.selectAll('div.bar').data(barData);
    $bars.enter().append('div');

    $bars
      .attr('class', (d) => `bar ${d.type}-color`)
      .style('width', this.widthBar + 'px')
      .attr('title', (d) => `${ChangeTypes.labelForType(d.type)}: ${d.value} cells`);

    $bars.exit().remove();

    // move the reorder bar into the content change element
    $parent.selectAll(`.bar.${ChangeTypes.REORDER.type}-color`)[0]
      .forEach((d: HTMLElement) => {
        d.parentElement.querySelector(`.bar.${ChangeTypes.CONTENT.type}-color`).appendChild(d);
      });

    this.scaleBarsHeight();
  }

  private scaleBarsHeight() {
    const that = this;
    this.$node.selectAll('.bar')
      .style('height', function (d) {
        if (ChangeTypes.TYPE_ARRAY.filter((ct) => ct.type === d.type)[0].isActive) {
          d3.select(this).style('border-width', null);
          return that.barScaling(d.value) + 'px';
        }
        d3.select(this).style('border-width', 0);
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

  /**
   * Factory method to create a new BarChart instance.
   * @param parent Element on which the bar chart is drawn
   * @param options Parameters for the instance (optional)
   * @returns {BarChart}
   */
  static create(parent: Element, options: any) {
    return new BarChart(parent, options);
  }
}

