/**
 * Created by Holger Stitz on 29.11.2016.
 */

import * as events from 'phovea_core/src/event';
import {IAppView} from './app';
import * as ajax from 'phovea_core/src/ajax';
import {AppConstants, IChangeType, ChangeTypes} from './app_constants';
import * as d3 from 'd3';
import * as $ from 'jquery';
//import {AppConstants} from './app_constants';

/**
 * Shows a timeline with all available data points for a selected data set
 */
class Histogram2D implements IAppView {

  private $node;
  private $ratio;
  private $histogramRows;
  private $histogramCols;

  private selectedTables;
  private borderWidth = 2;

  private height = 160 + this.borderWidth;
  private width = 160 + this.borderWidth;

  private x = d3.scale.linear().domain([0, 1]).range([0, this.width - this.borderWidth]);
  private y = d3.scale.linear().domain([0, 1]).range([0, this.height - this.borderWidth]);

  private widthRowHistogram = 60;
  private heightRowHistogram = 160;

  private histogramScale = d3.scale.linear()
    //.domain([0, d3.max(histodata)])
      .domain([0, 1])
      .range([0, 50]);

  // Width of the bars in the bar chart
  private heightBar:number = Math.floor(this.heightRowHistogram / 20) - 1; // -1 = border

  private ratioData;


  private static getJSONRatio2D(pair) {
    const operations = ChangeTypes.forURL();
    return ajax.getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${operations}/ratio_2d`);
  }

  private static getJSONHistogram(pair) {
    const binRows = 20;
    const binCols = 20;
    const operations = ChangeTypes.forURL();
    return ajax.getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${binRows}/${binCols}/${operations}/histogram`);
  }

  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('invisibleClass', true)
      .classed('histogram_2d', true);
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
    //get width of client browser window
    const windowWidth = $(window).innerWidth();

    this.$node
      //.style('width', windowWidth + 'px')
      .style('height', this.height + 'px');

    this.$ratio = this.$node
      .append('div')
      .style('width', this.width + 'px')
      .style('height', this.height + 'px')
      .classed('ratio', true);

    this.$histogramRows = this.$node
      .append('div')
      .style('width', this.widthRowHistogram + 'px')
      .style('height', this.height + 'px')
      .classed('histogram', true)
      .append('div')
      .classed('wrapper', true);

    this.$histogramCols = this.$node
      .append('div')
      .style('width', this.widthRowHistogram + 'px')
      .style('height', this.height + 'px')
      .classed('histogram', true)
      .classed('rotated', true)
      .append('div')
      .classed('wrapper', true);

  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
      this.clearContent();
    });

    events.on(AppConstants.EVENT_TIME_POINTS_SELECTED, (evt, items) => {
      if(items.length === 2) {
        this.selectedTables = [items[0].item.desc.id, items[1].item.desc.id];
        this.updateItems(this.selectedTables);

      } else {
        this.clearContent();
      }
    });

    events.on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType: IChangeType) => {
      if(this.ratioData) {
        this.show2DRatio(this.ratioData);
        this.scaleHistogramWidth(); // just rescale the height of the bars
      }
    });

    events.on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType: IChangeType) => {
      if(this.ratioData) {
        this.show2DRatio(this.ratioData);
        this.scaleHistogramWidth(); // just rescale the height of the bars
      }
    });
  }

  private updateItems(pair) {
    this.$ratio.classed('loading', true);

    this.requestData(pair)
      .then((data) => {
        this.ratioData = data;
        this.show2DRatio(data);
      });

    this.requestDataHistogram(pair)
      .then((histodata) => {
        this.showHistogram(this.$histogramRows, histodata[0]);
        this.showHistogram(this.$histogramCols, histodata[1]);
      });
  }


  //for the 2D Ratio Chart
  private requestData(pair) {
    return Histogram2D.getJSONRatio2D(pair);
  }

  //for the histogram Rows
  private requestDataHistogram(pair) {
    return Histogram2D.getJSONHistogram(pair)
      .then((json) => {
        const rows = json.rows;
        const cols = json.cols;
        //console.log(rows, cols);
        return [rows, cols];
      });
  }

  private prepareRatioData(data) {
    const cols = data.cols.ratios;
    const rows = data.rows.ratios;

    // consider and show only active change types
    const activeTypes = ChangeTypes.TYPE_ARRAY
      .filter((d) => d !== ChangeTypes.REORDER)
      .filter((d) => d.isActive === true);

    // calculate the row and col domain
    const rowDomain = activeTypes
      .map((ct) => rows[ct.ratioName])
      .reduce((a, b) => a + b, 0);

    const colDomain = activeTypes
      .map((ct) => cols[ct.ratioName])
      .reduce((a, b) => a + b, 0);

    const scaleRows = d3.scale.linear().domain([0, rowDomain]).range([0, 1]);
    const scaleCols = d3.scale.linear().domain([0, colDomain]).range([0, 1]);

    // reverse the order because of DOM stacking
    const reverseTypes = activeTypes.reverse();

    const rowRatios = reverseTypes.map((ct) => {
      return {ratio: rows[ct.ratioName], ct};
    });

    const colRatios = reverseTypes.map((ct) => {
      return {ratio: cols[ct.ratioName], ct};
    });

    const r = [];

    // calculate the ratio for each content type
    while(colRatios.length > 0) {
      const rowRatio = rowRatios.map((d) => scaleRows(d.ratio)).reduce((a, b) => a + b, 0);
      const colRatio = colRatios.map((d) => scaleCols(d.ratio)).reduce((a, b) => a + b, 0);

      // remove the first element
      const rowElem = rowRatios.shift();
      const colElem = colRatios.shift();

      r.push({
        type: colElem.ct.type,
        rows: rowRatio,
        cols: colRatio,
        rows_text: Math.round((scaleRows(rowElem.ratio) * 100) * 100) / 100,
        cols_text: Math.round((scaleCols(colElem.ratio) * 100) * 100) / 100
      });
    }

    // add inactive values as 0 values
    ChangeTypes.TYPE_ARRAY
      .filter((d) => d !== ChangeTypes.REORDER)
      .filter((d) => d.isActive === false)
      .forEach((d) => {
        r.push({
          type: d.type,
          rows: 0,
          cols: 0,
          rows_text: 0,
          cols_text: 0
        });
      });

    return r;
  }

  private show2DRatio(data) {
    data = this.prepareRatioData(data);

    const ratio2d = this.$ratio.selectAll('div').data(data, (d) => d.type);

    ratio2d.enter().append('div');

    ratio2d
      .attr('class', (d) => d.type + '-color')
      .style('width', (d) => this.x(d.cols) + 'px')
      .style('height', (d) => this.y(d.rows) + 'px')
      .attr('title', (d) => ChangeTypes.labelForType(d.type) + '\x0ARows: ' + d.rows_text + '%\x0AColumns: ' + d.cols_text + '%');

    ratio2d.exit().remove();

    this.$ratio.classed('loading', false);
  }

  private showHistogram($parent, data) {
    const that = this;

    const $containers = $parent.selectAll('div.bin-container')
      .data(data, (d) => d.id);

    $containers.enter().append('div')
      .classed('bin-container', true)
      .each(function(d) {
        that.drawBar(d3.select(this), d);
      });

    $containers.exit().remove();
  }

  /**
   * This method draws the bars on the timeline or above the timeline.
   * TODO: Documentation
   * @param $parent
   * @param data
   * @param pair
   */
  private drawBar($parent, data) {
    const barData = this.getBarData(data, 'ratioName');
    //const barData = this.getBarData(data.counts, 'countName');

    //individual bars in the bar group div
    const $bars = $parent.selectAll('div.bar').data(barData);
    $bars.enter().append('div');

    $bars
      .attr('class', (d) => `bar ${d.type}-color`)
      //.style('height', this.heightBar + 'px')
      .style('height', '100%')
      .attr('title', (d) => `${ChangeTypes.labelForType(d.type)}: ${Math.round((d.value * 100) * 100) / 100}% (${d.id})`);

    $bars.exit().remove();

    // move the reorder bar into the content change  element
    $parent.selectAll(`.bar.${ChangeTypes.REORDER.type}-color`)[0]
      .forEach((d:HTMLElement) => {
        d.parentElement.querySelector(`.bar.${ChangeTypes.CONTENT.type}-color`).appendChild(d);
      });

    this.scaleHistogramWidth();
  }

  private scaleHistogramWidth() {
    this.$node.selectAll('.bar')
      .style('width', (d) => {
        if(ChangeTypes.TYPE_ARRAY.filter((ct) => ct.type === d.type)[0].isActive) {
          return this.histogramScale(d.value) + 'px';
        }
        return 0; // shrink bar to 0 if change is not active
      });
  }

  /**
   *
   * @param data
   * @param propertyName
   * @returns {{type: string, value: number, id: string, pos: number}[]}
   */
  private getBarData(data, propertyName) {
    return ChangeTypes.TYPE_ARRAY
      //.filter((d) => d.isActive === true)
      .filter((d) => d !== ChangeTypes.NO_CHANGE)
      .map((ct) => {
        return {
          type: ct.type,
          id: data.id,
          pos: data.pos,
          value: data.ratios[ct[propertyName]] || 0
        };
      });
  }


  private clearContent() {
    this.ratioData = null;
    this.$ratio.html('');
    this.$histogramCols.html('');
    this.$histogramRows.html('');
  }

}

/**
 * Factory method to create a new Histogram2D instance
 * @param parent
 * @param options
 * @returns {Histogram2D}
 */
export function create(parent: Element, options: any) {
  return new Histogram2D(parent, options);
}
