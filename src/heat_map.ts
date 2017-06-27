/**
 * Created by Holger Stitz on 30.08.2016.
 */

import * as vis from 'phovea_core/src/vis';
import * as events from 'phovea_core/src/event';
import {IAppView} from './app';
import * as d3 from 'd3';
import {AppConstants} from './app_constants';
import {IAnyMatrix} from 'phovea_core/src/matrix';
import {INumberValueTypeDesc} from 'phovea_core/src/datatype';
import {mixin} from 'phovea_core/src';

/**
 * Shows a simple heat map for a given data set.
 */
class HeatMap implements IAppView {

  private $node:d3.Selection<any>;

  private matrix:IAnyMatrix;
  private scaleFactor: {x: number, y: number};

  private heatMapOptions = {
      initialScale: AppConstants.HEATMAP_CELL_SIZE,
      color: ['black', 'white', 'black'],
      domain: [-1, 0, 1]
    };

  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('heatmap', true)
      .classed(options.cssClass, true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<HeatMap>}
   */
  init() {
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
      this.clearContent();
    });

    events.on(AppConstants.EVENT_TIME_POINTS_SELECTED, () => {
      this.clearContent();
    });

    events.on(this.options.eventName, (evt, dataset:IAnyMatrix) => {
      this.matrix = dataset;
      this.checkAndUpdate();
    });

    events.on(AppConstants.EVENT_DIFF_HEATMAP_LOADED, (evt, pair, diffData, scaleFactor) => {
      this.scaleFactor = scaleFactor;
      this.checkAndUpdate();
    });
  }

  /**
   * Run update only if scaleFactor and matrix data is set
   */
  private checkAndUpdate() {
    if(this.matrix && this.scaleFactor) {
      this.update(this.matrix, this.scaleFactor);
    }
  }

  /**
   * Loads a Caleydo heat map visualization plugin and hands the given data set over for visualizing it
   * @param dataset
   * @param scaleFactor
   * @returns {Promise<HeatMap>}
   */
  private update(dataset: IAnyMatrix, scaleFactor: {x: number, y: number}) {

    if(dataset.desc.type !== 'matrix') {
      console.warn(`Data set is not of type matrix and cannot be visualized from heat map plugin`);
      return;

    }
    //console.log('DATASET', dataset);
    const plugins = vis.list(dataset).filter((d) => /.*heatmap.*/.test(d.id));


    if (plugins.length === 0) {
      console.warn(`Heat map visualization plugin not found`);
      return;
    }

    const showLabels = chooseLabel(dataset.nrow, dataset.ncol);
    const scale = [this.heatMapOptions.initialScale * scaleFactor.x, this.heatMapOptions.initialScale * scaleFactor.y];

    switch(showLabels) {
      case 'CELL':
        d3.select(this.$node.node().parentElement).classed('heatmap-has-column-labels', true);
        this.$node.classed('heatmap-row-labels', true).classed('heatmap-column-labels', true);
        scale[0] -= 0.65; // decrease width of heat map to show row labels TODO make it flexible based on the longest label
        break;
      case 'ROW':
        this.$node.classed('heatmap-row-labels', true);
        scale[0] -= 0.65; // decrease width of heat map to show row labels TODO make it flexible based on the longest label
        break;
      case 'COLUMN':
        d3.select(this.$node.node().parentElement).classed('column-labels', true);
        this.$node.classed('heatmap-column-labels', true);
        break;
    }

    const maxRangeValue = Math.max(...(<INumberValueTypeDesc>dataset.valuetype).range.map((d) => Math.abs(d)));

    const options = mixin({}, this.heatMapOptions, {
      scale,
      labels: showLabels,
      domain: [-maxRangeValue, 0, maxRangeValue]
    });

    this.$node.classed('loading', true);

    return Promise.all([plugins[0].load()])
      .then((args) => {
        this.clearContent();

       // console.log('args from plugins', args);
        const plugin = args[0];
       // console.log('const plugin- args', plugin);
        plugin.factory(
          dataset,
          this.$node.node(),
          options
        );
        return this;
      })
      .then((instance) => {
        this.$node.classed('loading', false);
        events.fire(AppConstants.EVENT_HEATMAP_LOADED);
        return instance;
      });
  }

  /**
   * Clear the content and reset this view
   */
  private clearContent() {
    this.$node.html('');
  }

}

/**
 * Decided based on the number of rows and columns if and if yes, which labels should be shown for the heatmap
 * @param nrow
 * @param ncol
 * @returns {string}
 */
function chooseLabel(nrow: number, ncol: number):string {
  if (nrow < AppConstants.MAXIMAL_HEATMAP_LABEL_SIZE && ncol < AppConstants.MAXIMAL_HEATMAP_LABEL_SIZE) {
    return 'CELL';
  }
  if (nrow < AppConstants.MAXIMAL_HEATMAP_LABEL_SIZE) {
    return 'ROW';
  }
  if (ncol < AppConstants.MAXIMAL_HEATMAP_LABEL_SIZE) {
    return 'COLUMN';
  }
  return 'NONE';
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {HeatMap}
 */
export function create(parent:Element, options:any) {
  return new HeatMap(parent, options);
}
