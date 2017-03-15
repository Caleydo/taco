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

  constructor(public parent:Element, private options:any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('detailview', true);
  }

  init() {
    this.build();
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private build() {
    this.$node.html(`<button type="button" class="btn btn-default" disabled>Load Detail View</button>`);
  }

  private attachListener() {
    events.on(AppConstants.EVENT_TIME_POINTS_SELECTED, (evt, clickedElement) => {
      this.openEvents(clickedElement);
    });
  }

  private openEvents (clickedElements) {
    this.$node.select('button')
      .attr('disabled', (clickedElements.length === 2) ? null : 'disabled')
      .on('click', (e) => {
        if(clickedElements.length !== 2) {
          return;
        }
        events.fire(AppConstants.EVENT_DATASET_SELECTED_LEFT, clickedElements[0].item);
        events.fire(AppConstants.EVENT_DATASET_SELECTED_RIGHT, clickedElements[1].item);
        events.fire(AppConstants.EVENT_OPEN_DIFF_HEATMAP, clickedElements.map((d) => d.item));
        this.$node.select('button').attr('disabled', 'disabled');
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
