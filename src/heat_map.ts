/**
 * Created by Holger Stitz on 30.08.2016.
 */

import * as vis from 'phovea_core/src/vis';
import * as events from 'phovea_core/src/event';
import {IAppView} from './app';
import * as d3 from 'd3';
import {AppConstants} from './app_constants';
import {mixin} from 'phovea_core/src';

/**
 * Shows a simple heat map for a given data set.
 */
class HeatMap implements IAppView {

  private $node;

  private dataset;

  private heatMapOptions = {
      initialScale: AppConstants.HEATMAP_CELL_SIZE,
      color: ['white', 'black']
    };

  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('heatmap', true);
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

    events.on(this.options.eventName, (evt, dataset) => this.dataset = dataset);

    events.on(AppConstants.EVENT_DIFF_HEATMAP_LOADED, (evt, pair, diffData, scaleFactor) => {
      this.update(this.dataset, scaleFactor);
    });
  }

  /**
   * Loads a Caleydo heat map visualization plugin and hands the given data set over for visualizing it
   * @param dataset
   * @param scaleFactor
   * @returns {Promise<HeatMap>}
   */
  private update(dataset, scaleFactor) {

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

    const options = {
      initialScale: this.heatMapOptions.initialScale * scaleFactor,
      color: this.heatMapOptions.color
    };

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
      });
  }

  /**
   * Remove the previous heatmap
   */
  private clearContent() {
    this.$node.html('');
  }

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
