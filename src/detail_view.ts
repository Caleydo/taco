/**
 * Created by cniederer on 20.01.17.
 */

import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {hash} from 'phovea_core/src';
import {ITacoTimePoint} from './data_set_selector';
import {Language} from './language';

class DetailView implements IAppView {

  private $node:d3.Selection<any>;

  constructor(public parent:Element, private options:any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('invisibleClass', true)
      .classed('detailview', true);
  }

  /**
   * Initialize this view
   * @returns {Promise<DetailView>}
   */
  init() {
    this.build();
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  /**
   * Build DOM node
   */
  private build() {
    this.$node.html(`<button type="button" class="btn btn-default" disabled>${Language.LOAD_DETAILS}</button>`);
  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
      this.$node.select('button').attr('disabled', 'disabled').classed('loading', false);
    });

    events.on(AppConstants.EVENT_TIME_POINTS_SELECTED, (evt, items:ITacoTimePoint[]) => {
      this.openEvents(items);
    });

    events.on(AppConstants.EVENT_OPEN_DETAIL_VIEW, (evt, items:ITacoTimePoint[]) => {
      this.loadDetailView(items);
    });

    let heatmapsLoaded = 0;
    events.on(AppConstants.EVENT_HEATMAP_LOADED, () => {
      heatmapsLoaded++;
      if(heatmapsLoaded === 3) {
        this.$node.select('button').classed('loading', false);
        heatmapsLoaded = 0;
      }
    });
    events.on(AppConstants.EVENT_DIFF_HEATMAP_LOADED, () => {
      heatmapsLoaded++;
      if(heatmapsLoaded === 3) {
        this.$node.select('button').classed('loading', false);
        heatmapsLoaded = 0;
      }
    });
  }

  private openEvents (items:ITacoTimePoint[]) {
    this.$node.select('button')
      .attr('disabled', (items.length === 2) ? null : 'disabled')
      .on('click', (e) => {
        this.loadDetailView(items);
      });
  }

  /**
   * Fire events to load detail view based on the selected time points
   * @param selection
   */
  private loadDetailView(selection:ITacoTimePoint[]) {
    if(selection.length !== 2) {
      return;
    }

    hash.setInt(AppConstants.HASH_PROPS.DETAIL_VIEW, 1);

    events.fire(AppConstants.EVENT_OPEN_DIFF_HEATMAP, selection.map((d) => d.item));
    events.fire(AppConstants.EVENT_DATASET_SELECTED_LEFT, selection[0].item);
    events.fire(AppConstants.EVENT_DATASET_SELECTED_RIGHT, selection[1].item);
    this.$node.select('button').attr('disabled', 'disabled').classed('loading', true);
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
