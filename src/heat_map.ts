/**
 * Created by Holger Stitz on 30.08.2016.
 */

import * as vis from 'phovea_core/src/vis';
import * as events from 'phovea_core/src/event';
import {IAppView} from './app';
import * as d3 from 'd3';

/**
 * Shows a simple heat map for a given data set.
 */
class HeatMap implements IAppView {

  private $node;

  private heatMapOptions = {
      initialScale: 5,
      color: ['black', 'white']
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
    events.on(this.options.eventName, (evt, dataset) => this.update(dataset));

  }

  /**
   * Loads a Caleydo heat map visualization plugin and hands the given data set over for visualizing it
   * @param dataset
   * @returns {Promise<HeatMap>}
   */
  private update(dataset) {

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

    return Promise.all([plugins[0].load()])
      .then((args) => {
        // remove the previous heat map
        this.$node.selectAll('*').remove();

       // console.log('args from plugins', args);
        const plugin = args[0];
       // console.log('const plugin- args', plugin);
        plugin.factory(
          dataset,
          this.$node.node(),
          this.heatMapOptions
        );
        return this;
      });
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
