import * as vis from 'phovea_core/src/vis';
import * as events from 'phovea_core/src/event';
import {IAppView} from './app';
import * as d3 from 'd3';

/**
 * Shows a simple heat map for a given data set.
 */
class DiffHeatMap implements IAppView {

  private $node;

  private heatMapOptions = {
      initialScale: 5,
      color: ['black', 'white']
    };

  constructor(parent: Element, private options: any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('diffheatmap', true);
    console.log(this.$node);
  }

}


/**
 * Factory method to create a new DiffHeatMap instance
 * @param parent
 * @param options
 * @returns {DiffHeatMap}
 */
export function create(parent:Element, options:any) {
  return new DiffHeatMap(parent, options);
}
