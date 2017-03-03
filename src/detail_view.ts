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
  private tableData;

  constructor(public parent:Element, private options:any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('detailview', true)
      .classed('invisibleClass', true);
  }

  init() {
    this.build();
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private build() {
    this.$node.html(`<button type="button" 
                               id="detailViewBtn" 
                               class="btn btn-primary" 
                               disabled>Load Detail View</button>`);

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

  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATASET_SELECTED, (evt, clickedElement) => {
      this.openEvents(clickedElement);
    });
  }

  private openEvents (clickedElements) {
    this.$node.select('#detailViewBtn')
      .on('click', function (e) {
        if(clickedElements !== void 0) {
          events.fire(AppConstants.EVENT_DATASET_SELECTED_LEFT, clickedElements[0]);
          events.fire(AppConstants.EVENT_DATASET_SELECTED_RIGHT, clickedElements[1]);
          events.fire(AppConstants.EVENT_OPEN_DIFF_HEATMAP, clickedElements);
          d3.select('.difftitle').classed('hidden', false);
          d3.select('.comparison').classed('hidden', false);
          d3.select('#detailViewBtn').attr('disabled', true);
          d3.select('.diffPlaceholder').classed('invisibleClass', true);
        }
      });
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
