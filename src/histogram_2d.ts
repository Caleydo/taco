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
  private posX;
  private borderWidth = 2;

  private height = 160 + this.borderWidth;
  private width = 160 + this.borderWidth;

  private x = d3.scale.linear().domain([0, 1]).range([0, this.width - this.borderWidth]);
  private y = d3.scale.linear().domain([0, 1]).range([0, this.height - this.borderWidth]);

  private widthRowHistogram = 60;
  private heightRowHistogram = 160;


  private static getJSONRatio2D(pair) {
    const operations = ChangeTypes.forURL();
    return ajax.getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${operations}/ratio_2d`);
  }

  private static getJSONHistogram(pair) {
    const binRows = 10;
    const binCols = 20;
    const operations = ChangeTypes.forURL();
    return ajax.getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${binRows}/${binCols}/${operations}/histogram`);
  }

  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent)
      .append('div')
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
      .classed('histogram', true);

    this.$histogramCols = this.$node
      .append('div')
      .style('width', this.widthRowHistogram + 'px')
      .style('height', this.height + 'px')
      .classed('histogram', true)
      .classed('rotated', true);

  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_TIME_POINTS_SELECTED, (evt, items) => {
      if(items.length === 2) {
        this.selectedTables = [items[0].item.desc.id, items[1].item.desc.id];
        this.updateItems(this.selectedTables);

      } else {
        this.clearContent();
      }
    });

    events.on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
    events.on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
  }

  private toggleChangeType(changeType) {
    // console.log('changeType', changeType);
    this.clearContent();
    this.updateItems(this.selectedTables);
    // const cssClass = `.${changeType.type}-color`;
    //
    // this.$ratio.selectAll(cssClass).classed('noColorClass', !changeType.isActive);
    // this.$histogramRows.selectAll(cssClass).classed('noColorClass', !changeType.isActive);
    // this.$histogramCols.selectAll(cssClass).classed('noColorClass', !changeType.isActive);
    //
    // this.$node.selectAll(`div.ratio > .${changeType.type}`).classed('noColorClass', !changeType.isActive);
  }

  private updateItems(pair) {
    this.$ratio.classed('loading', true);

    this.requestData(pair)
      .then((data) => this.showData(data));

    this.requestDataHistogram(pair)
      .then((histodata) => this.showHistogram(histodata));
  }


  //for the 2D Ratio Chart
  private requestData(pair) {
    return Histogram2D.getJSONRatio2D(pair)
      .then((json) => {
        const data = [];

        const cols = json.cols.counts;
        const rows = json.rows.counts;
        const totalR = rows.d_counts + rows.a_counts + rows.c_counts + rows.no_counts;
        const totalC = cols.d_counts + cols.a_counts + cols.c_counts + cols.no_counts;

        data.push({
          type: ChangeTypes.REMOVED.type,
          rows: (this.width - this.borderWidth) * (rows.d_counts + rows.a_counts + rows.c_counts + rows.no_counts) / totalR, //todo change to 1
          cols: (this.height - this.borderWidth) * (cols.d_counts + cols.a_counts + cols.c_counts + cols.no_counts) / totalC, //todo change to 1
          rows_text: Math.round((rows.d_ratio * 100) * 1000) / 1000,
          cols_text: Math.round((cols.d_ratio * 100) * 1000) / 1000
        });
        data.push({
          type: ChangeTypes.ADDED.type,
          rows: (this.width - this.borderWidth) * (rows.a_counts + rows.c_counts + rows.no_counts) / totalR, // or 1 - d
          cols: (this.height - this.borderWidth) * (cols.a_counts + cols.c_counts + cols.no_counts) / totalC,
          rows_text: Math.round((rows.a_ratio * 100) * 1000) / 1000,
          cols_text: Math.round((cols.a_ratio * 100) * 1000) / 1000
        });
        data.push({
          type: ChangeTypes.CONTENT.type,
          rows: (this.width - this.borderWidth) * (rows.c_counts + rows.no_counts) / totalR,
          cols: (this.height - this.borderWidth) * (cols.c_counts + cols.no_counts) / totalC,
          rows_text: Math.round((rows.c_ratio * 100) * 1000) / 1000,
          cols_text: Math.round((cols.c_ratio * 100) * 1000) / 1000
        });
        data.push({
          type: ChangeTypes.NO_CHANGE.type,
          rows: (this.width - this.borderWidth) * rows.no_counts / totalR,
          cols: (this.width - this.borderWidth) * cols.no_counts / totalC,
          rows_text: Math.round((rows.no_ratio * 100) * 1000) / 1000,
          cols_text: Math.round((cols.no_ratio * 100) * 1000) / 1000
        });

        //console.log('data_list ratio', data);

        return data;
      });
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

  //Show 2d Ratio chart
  private showData(data) {
    const ratio2d = this.$ratio.selectAll('div').data(data);

    ratio2d.enter()
      .append('div');

    ratio2d
      .attr('class', (d) => d.type + '-color')
      .style('width', (d) => d.cols + 'px')
      .style('height', (d) => d.rows + 'px')
      .attr('title', (d) => ChangeTypes.labelForType(d.type) + '\x0ARows: ' + d.rows_text + '%\x0AColumns: ' + d.cols_text + '%');

    ratio2d.exit().remove();

    this.$ratio.classed('loading', false);
  }

//Show Histogramm Rows
  private showHistogram(histodata) {

    // console.log('rows' , histodata[0], 'cols' , histodata[1]);

    const rows = histodata[0];
    const cols = histodata[1];


    const xScale = d3.scale.linear()
    //.domain([0, d3.max(histodata)])
      .domain([0, 1])
      .range([0, 50]);

    const yScale = d3.scale.linear()
      .domain([0, 20])
      .range([0, this.heightRowHistogram]);

    const gridSize = Math.floor(this.heightRowHistogram / 20);

    const bincontainer = this.$histogramRows.selectAll('div.bin-container')
      .data(rows, function (d) {
        return d.id;
      });

    const bincontainterCols = this.$histogramCols.selectAll('div.bin-container')
      .data(cols, function (d) {
        return d.id;
      });


    bincontainer.enter()
      .append('div')
      .classed('bin-container', true)
      .attr('title', function (d) {
        return d.id;
      });

    bincontainer
      .append('div')
      .classed(`${ChangeTypes.CONTENT.type}-color`, true)
      .style('width', function (d) {
        //console.log(xScale(d.ratios.c_ratio));
        return xScale(d.ratios.c_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return ChangeTypes.CONTENT.label + ': ' + Math.round((d.ratios.c_ratio * 100) * 1000) / 1000 + '%';
      })
      .style('transform', function (d) {
        return 'translate(' + 0 + 'px,' + yScale(d.pos) + 'px)';
      })
      .style('display', function (d) {
        return (d.ratios.c_ratio === 0) ? 'none' : null;
      });

    bincontainer
      .append('div')
      .classed(`${ChangeTypes.REMOVED.type}-color`, true)
      .style('width', function (d) {
        return xScale(d.ratios.d_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return ChangeTypes.REMOVED.label + ': ' + Math.round((d.ratios.d_ratio * 100) * 1000) / 1000 + '%';
      })
      .style('transform', function (d) {
        const content = xScale(d.ratios.d_ratio);
        // console.log(content);
        let acc = 0;
        if (content === 0) {
          acc = 0;
          //console.log('content is 0');
        } else {
          acc = xScale(d.ratios.c_ratio);
        }
        return 'translate(' + acc + 'px,' + yScale(d.pos) + 'px)';
      })
      .style('display', function (d) {
        return (d.ratios.d_ratio === 0) ? 'none' : null;
      });

    bincontainer
      .append('div')
      .classed(`${ChangeTypes.ADDED.type}-color`, true)
      .style('width', function (d) {
        return xScale(d.ratios.a_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return ChangeTypes.ADDED.label + ': ' + Math.round((d.ratios.a_ratio * 100) * 1000) / 1000 + '%';
      })
      .style('transform', function (d) {
        const structure = xScale(d.ratios.a_ratio);
        //console.log(structure);
        let acc = 0;
        if (structure === 0) {
          acc = 0;
          //console.log('content is 0');
        } else {
          acc = xScale(d.ratios.c_ratio) + xScale(d.ratios.d_ratio);
        }
        return 'translate(' + acc + 'px,' + yScale(d.pos) + 'px)';
      })
      .style('display', function (d) {
        return (d.ratios.a_ratio === 0) ? 'none' : null;
      });

    bincontainer.exit().remove();

    /*
     * Draw Cols Histogram  */


    bincontainterCols.enter()
      .append('div')
      .classed('bin-container', true)
      .attr('title', function (d) {
        return d.id;
      });

    bincontainterCols
      .append('div')
      .classed(`${ChangeTypes.CONTENT.type}-color`, true)
      .style('width', function (d) {
        //console.log(xScale(d.ratios.c_ratio));
        return xScale(d.ratios.c_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return ChangeTypes.CONTENT.label + ': ' + Math.round((d.ratios.c_ratio * 100) * 1000) / 1000 + '%';
      })
      .style('transform', function (d) {
        return 'translate(' + 0 + 'px,' + yScale(d.pos) + 'px)';
      })
      .style('display', function (d) {
        return (d.ratios.c_ratio === 0) ? 'none' : null;
      });

    bincontainterCols
      .append('div')
      .classed(`${ChangeTypes.REMOVED.type}-color`, true)
      .style('width', function (d) {
        return xScale(d.ratios.d_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return ChangeTypes.REMOVED.label + ': ' + Math.round((d.ratios.d_ratio * 100) * 1000) / 1000 + '%';
      })
      .style('transform', function (d) {
        const content = xScale(d.ratios.d_ratio);
        //console.log(content);
        let acc = 0;
        if (content === 0) {
          acc = 0;
          // console.log('content is 0');
        } else {
          acc = xScale(d.ratios.c_ratio);
        }
        return 'translate(' + acc + 'px,' + yScale(d.pos) + 'px)';
      })
      .style('display', function (d) {
        return (d.ratios.d_ratio === 0) ? 'none' : null;
      });

    bincontainterCols
      .append('div')
      .classed(`${ChangeTypes.ADDED.type}-color`, true)
      .style('width', function (d) {
        return xScale(d.ratios.a_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return ChangeTypes.ADDED.label + ': ' + Math.round((d.ratios.a_ratio * 100) * 1000) / 1000 + '%';
      })
      .style('transform', function (d) {
        const structure = xScale(d.ratios.a_ratio);
        let acc = 0;

        if (structure === 0) {
          acc = 0;
          //console.log('content is 0');
        } else {
          acc = xScale(d.ratios.c_ratio) + xScale(d.ratios.d_ratio);

        }
        return 'translate(' + acc + 'px,' + yScale(d.pos) + 'px)';
      })
      .style('display', function (d) {
        return (d.ratios.a_ratio === 0) ? 'none' : null;
      });

    bincontainterCols.exit().remove();
  }

  private clearContent() {
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
