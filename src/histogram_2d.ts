/**
 * Created by Holger Stitz on 29.11.2016.
 */

import * as events from 'phovea_core/src/event';
import {IAppView} from './app';
import * as ajax from 'phovea_core/src/ajax';
import {AppConstants, IChangeType} from './app_constants';
import * as d3 from 'd3';
import * as $ from 'jquery';
//import {AppConstants} from './app_constants';

/**
 * Shows a timeline with all available data points for a selected data set
 */
class Histogram2D implements IAppView {

  private $node;

  private $ratio;

  private $histogram;

  private $histogramCols;

  private borderWidth = 2;

  private height = 160 + this.borderWidth;
  private width = 160 + this.borderWidth;

  private x = d3.scale.linear().domain([0, 1]).range([0, this.width - this.borderWidth]);
  private y = d3.scale.linear().domain([0, 1]).range([0, this.height - this.borderWidth]);

  private widthRowHistogram = 60;
  private heightRowHistogram = 160;


  private static getURL(pair) {
    const binCols = -1; // -1 = aggregate the whole table
    const binRows = -1; // -1 = aggregate the whole table
    const direction = 2; // 2 = rows + columns
    const changes = 'structure,content';
    return `/taco/diff_log/${pair[0]}/${pair[1]}/${binCols}/${binRows}/${direction}/${changes}`;
  }

  private static getURLHistogram(pair) {
    const binCols = 20; // -1 = aggregate the whole table
    const binRows = 10; // -1 = aggregate the whole table
    const direction = 2; // 2 = rows + columns
    const changes = 'structure,content';
    return `/taco/diff_log/${pair[0]}/${pair[1]}/${binCols}/${binRows}/${direction}/${changes}`;
  }

  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('histogram_2d', true)
      .classed('hidden', true);
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
      .style('width', windowWidth + 'px')
      .style('height', this.height + 'px');

    this.$ratio = this.$node
      .append('div')
      .style('width', this.width + 'px')
      .style('height', this.height + 'px')
      .classed('ratio', true)
      .on('click', function () {
        events.fire(AppConstants.EVENT_CLOSE_2D_HISTOGRAM);
      });

    this.$histogram = this.$node
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
    // hide when changing the dataset
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
      this.$node.classed('hidden', true);
    });

    events.on(AppConstants.EVENT_CLOSE_2D_HISTOGRAM, () => {
      this.$node.classed('hidden', true);
    });

    events.on(AppConstants.EVENT_OPEN_2D_HISTOGRAM, (evt, posX, pair) => {
      this.$node.classed('hidden', false);
      this.updateItems(posX, pair);
    });

    events.on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
    events.on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType: IChangeType) => this.toggleChangeType(changeType));
  }

  private toggleChangeType(changeType) {
    // console.log('changeType', changeType);
    if (changeType.type === 'removed') {
      this.$ratio.selectAll('.struct-del-color').classed('hidden', !changeType.isActive);
      this.$histogram.selectAll('.struct-del-color').classed('hidden', !changeType.isActive);
      this.$histogramCols.selectAll('.struct-del-color').classed('hidden', !changeType.isActive);
    }

    if (changeType.type === 'added') {
      this.$ratio.selectAll('.struct-add-color').classed('hidden', !changeType.isActive);
      this.$histogram.selectAll('.struct-add-color').classed('hidden', !changeType.isActive);
      this.$histogramCols.selectAll('.struct-add-color').classed('hidden', !changeType.isActive);
    }

    if (changeType.type === 'nochange') {
      this.$ratio.selectAll('.no-change-color').classed('hidden', !changeType.isActive);
      this.$histogram.selectAll('.no-change-color').classed('hidden', !changeType.isActive);
      this.$histogramCols.selectAll('.no-change-color').classed('hidden', !changeType.isActive);
    }
    if (changeType.type === 'content') {
      this.$ratio.selectAll('.content-change-color').classed('hidden', !changeType.isActive);
      this.$histogram.selectAll('.content-change-color').classed('hidden', !changeType.isActive);
      this.$histogramCols.selectAll('.content-change-color').classed('hidden', !changeType.isActive);
    }

    this.$node.selectAll(`div.ratio > .${changeType.type}`).classed('hidden', !changeType.isActive);
  }

  private updateItems(posX, pair) {
    this.$ratio
      .classed('loading', true)
      .style('left', posX + 'px');

    this.requestData(pair)
      .then((data) => this.showData(data));

    this.$histogram
      .style('left', posX + 'px');

    this.$histogramCols
      .style('left', posX + 'px');

    this.requestDataHistogram(pair)
      .then((histodata) => this.showHistogram(histodata));

  }


  //for the 2D Ratio Chart
  private requestData(pair) {
    return ajax.getAPIJSON(Histogram2D.getURL(pair))
      .then((json) => {
        const data = [];

        const cols = json.cols.ratios;
        const rows = json.rows.ratios;

        data.push({
          type: 'struct-del',
          rows: rows.d_ratio + rows.a_ratio + rows.c_ratio + rows.no_ratio, //todo change to 1
          cols: cols.d_ratio + cols.a_ratio + cols.c_ratio + cols.no_ratio, //todo change to 1
          rows_text: Math.round((rows.d_ratio * 100) * 1000) / 1000,
          cols_text: Math.round((cols.d_ratio * 100) * 1000) / 1000
        });
        data.push({
          type: 'struct-add',
          rows: rows.a_ratio + rows.c_ratio + rows.no_ratio, // or 1 - d
          cols: cols.a_ratio + cols.c_ratio + cols.no_ratio,
          rows_text: Math.round((rows.a_ratio * 100) * 1000) / 1000,
          cols_text: Math.round((cols.a_ratio * 100) * 1000) / 1000
        });
        data.push({
          type: 'content-change',
          rows: rows.c_ratio + rows.no_ratio,
          cols: cols.c_ratio + cols.no_ratio,
          rows_text: Math.round((rows.c_ratio * 100) * 1000) / 1000,
          cols_text: Math.round((cols.c_ratio * 100) * 1000) / 1000
        });
        data.push({
          type: 'no-change',
          rows: rows.no_ratio,
          cols: cols.no_ratio,
          rows_text: Math.round((rows.no_ratio * 100) * 1000) / 1000,
          cols_text: Math.round((cols.no_ratio * 100) * 1000) / 1000
        });

        //console.log('data_list ratio', data);

        return data;
      });
  }

  //for the histogram Rows
  private requestDataHistogram(pair) {
    return ajax.getAPIJSON(Histogram2D.getURLHistogram(pair))
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
      .style('width', (d) => this.x(d.cols) + 'px')
      .style('height', (d) => this.y(d.rows) + 'px')
      .attr('title', (d) => d.type.replace('-', ' ') + '\x0Arows: ' + d.rows_text + '%\x0Acolumns: ' + d.cols_text + '%');

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

    const bincontainer = this.$histogram.selectAll('div.bin-container')
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
      .classed('content-change-color', true)
      .style('width', function (d) {
        //console.log(xScale(d.ratios.c_ratio));
        return xScale(d.ratios.c_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return 'content: ' + Math.round((d.ratios.c_ratio * 100) * 1000) / 1000 + '%';
      })
      .style('transform', function (d) {
        return 'translate(' + 0 + 'px,' + yScale(d.pos) + 'px)';
      })
      .style('display', function (d) {
        return (d.ratios.c_ratio === 0) ? 'none' : null;
      });

    bincontainer
      .append('div')
      .classed('struct-del-color', true)
      .style('width', function (d) {
        return xScale(d.ratios.d_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return 'content: ' + Math.round((d.ratios.d_ratio * 100) * 1000) / 1000 + '%';
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
      .classed('struct-add-color', true)
      .style('width', function (d) {
        return xScale(d.ratios.a_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return 'content: ' + Math.round((d.ratios.a_ratio * 100) * 1000) / 1000 + '%';
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
      .classed('content-change-color', true)
      .style('width', function (d) {
        //console.log(xScale(d.ratios.c_ratio));
        return xScale(d.ratios.c_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return 'content: ' + Math.round((d.ratios.c_ratio * 100) * 1000) / 1000 + '%';
      })
      .style('transform', function (d) {
        return 'translate(' + 0 + 'px,' + yScale(d.pos) + 'px)';
      })
      .style('display', function (d) {
        return (d.ratios.c_ratio === 0) ? 'none' : null;
      });

    bincontainterCols
      .append('div')
      .classed('struct-del-color', true)
      .style('width', function (d) {
        return xScale(d.ratios.d_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return 'content: ' + Math.round((d.ratios.d_ratio * 100) * 1000) / 1000 + '%';
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
      .classed('struct-add-color', true)
      .style('width', function (d) {
        return xScale(d.ratios.a_ratio) + 'px';
      })
      .style('height', gridSize - 1 + 'px')
      .attr('title', function (d) {
        return 'content: ' + Math.round((d.ratios.a_ratio * 100) * 1000) / 1000 + '%';
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
