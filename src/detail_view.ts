/**
 * Created by cniederer on 01.03.17.
 */
/**
 * Created by cniederer on 20.01.17.
 */

//import * as events from 'phovea_core/src/event';
import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import * as ajax from 'phovea_core/src/ajax';

class DetailView implements IAppView {
  private $node;
  private diffplaceholder;

  constructor(public parent:Element, private options:any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('detailview', true);
  }

  init() {

      this.$node.html(`<button type="button" 
                               id="detailViewBtn" 
                               class="btn btn-primary" 
                               disabled>Load Detail View</button>`);
    //d3.select('#detailViewBtn').attr('disabled', null);


    this.diffplaceholder = this.$node
      .append('div')
      .classed('diffPlaceholder', true);


    this.diffplaceholder
      .append('div')
      .classed('sourceTablePlaceholder', true)
      .append('p')
      .text('Source Table');

    this.diffplaceholder
      .append('div')
      .classed('diffTablePlaceholder', true)
      .append('p')
      .text('Diff Table');

    this.diffplaceholder
      .append('div')
      .classed('destinationTablePlaceholder', true)
      .append('p')
      .text('Destination Table');





    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }
}

/**
 * Factory method to create a new DiffHeatMap instance
 * @param parent
 * @param options
 * @returns {DiffHeatMap}
 */
export function create(parent:Element, options:any) {
  return new DetailView(parent, options);
}
