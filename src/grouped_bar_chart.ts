/**
 * Created by Holger Stitz on 19.12.2016.
 */

import * as events from 'phovea_core/src/event';
import {AppConstants, ChangeTypes} from './app_constants';
import {IAppView} from './app';
import * as d3 from 'd3';
import * as ajax from 'phovea_core/src/ajax';

/**
 * Shows a bar with buttons to filter other views
 */
class GroupedBarChart implements IAppView {

  private $node;

  private $groupedBars;

  private items;

  private isOpen = false;

  // creating 2D Ratio bars
  private noratio = [];
  private aratio = [];
  private cratio = [];
  private dratio = [];

  /**
   * Method retrieves data by given parameters TODO: Documentation
   * @param pair
   * @returns {Promise<any>}
   */
  private static getJSON(pair) {
    const operations = ChangeTypes.forURL();
    return ajax.getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${operations}/bar_chart`);
  }

  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('grouped_bar_chart', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<GroupedBarChart>}
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
    this.$groupedBars = d3.selectAll('#groupedBars').append('svg');
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items) => this.items = items);

    events.on(AppConstants.EVENT_TOGGLE_GROUP, (evt) => this.toggleBarChart());
  }

  private toggleBarChart() {
    if (this.isOpen) {
      this.closeBarChart();
    } else {
      this.openBarChart();
    }
  }

  private closeBarChart() {
    this.$groupedBars.remove();
  }

  private openBarChart() {
    Promise.all(this.requestDataGroupedBars()).then(() => {
      const finalArray = this.noratio.concat(this.aratio, this.cratio, this.dratio);
      this.drawgroupedBars(finalArray);
    });
  }


  private requestDataGroupedBars() {
    const ids = this.items.map((d) => d.item.desc.id);

    //console.log(ids);

    return d3.pairs(ids).map((pair) => {
      return Promise.all([GroupedBarChart.getJSON(pair), pair])
        .then((args) => {
          const json = args[0];
          this.noratio.push(json.no_ratio);
          this.aratio.push(json.a_ratio);
          this.cratio.push(json.c_ratio);
          this.dratio.push(json.d_ratio);

        });
    });
  }

  private drawgroupedBars(finalArray) {
    const w = 300;
    const h = 80;

    this.$groupedBars.selectAll('rect')
      .data(finalArray)
      .enter()
      .append('rect')
      //.attr('x', (d, i) => i * (w / noratio.length - barPadding) + 20)
      .attr('x', (d, i) => i * (w / 20))
      .attr('y', (d: any, i) => h - (d * 100))
      .attr('width', 10 + 'px')
      .attr('height', (d: any) => d * 100);
  }


}

/**
 * Factory method to create a new Histogram2D instance
 * @param parent
 * @param options
 * @returns {FilterBar}
 */
export function create(parent: Element, options: any) {
  return new GroupedBarChart(parent, options);
}
