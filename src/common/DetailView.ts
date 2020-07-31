/**
 * Created by cniederer on 20.01.17.
 */

import * as d3 from 'd3';
import {GlobalEventHandler, DataCache, AppContext, INumericalMatrix, Range} from 'phovea_core';
import {IAppView} from '../app/App';
import {AppConstants} from '../app/AppConstants';
import {Language} from '../app/Language';
import {ITacoTimePoint} from './interfaces';

export class DetailView implements IAppView {

  private $node: d3.Selection<any>;

  constructor(public parent: Element, private options: any) {
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
    GlobalEventHandler.getInstance().on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
      this.$node.select('button').attr('disabled', 'disabled').classed('loading', false);
    });

    GlobalEventHandler.getInstance().on(AppConstants.EVENT_TIME_POINTS_SELECTED, (evt, items: ITacoTimePoint[]) => {
      this.openEvents(items);
    });

    GlobalEventHandler.getInstance().on(AppConstants.EVENT_OPEN_DETAIL_VIEW, (evt, items: ITacoTimePoint[]) => {
      this.loadDetailView(items);
    });

    let heatmapsLoaded = 0;
    GlobalEventHandler.getInstance().on(AppConstants.EVENT_HEATMAP_LOADED, () => {
      heatmapsLoaded++;
      if (heatmapsLoaded === 3) {
        this.$node.select('button').classed('loading', false);
        heatmapsLoaded = 0;
      }
    });
    GlobalEventHandler.getInstance().on(AppConstants.EVENT_DIFF_HEATMAP_LOADED, () => {
      heatmapsLoaded++;
      if (heatmapsLoaded === 3) {
        this.$node.select('button').classed('loading', false);
        heatmapsLoaded = 0;
      }
    });
  }

  private openEvents(items: ITacoTimePoint[]) {
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
  private loadDetailView(selection: ITacoTimePoint[]) {
    if (selection.length !== 2) {
      return;
    }

    AppContext.getInstance().hash.setInt(AppConstants.HASH_PROPS.DETAIL_VIEW, 1);

    GlobalEventHandler.getInstance().fire(AppConstants.EVENT_OPEN_DIFF_HEATMAP, selection.map((d) => d.item));

    const loadStratIds = (stratName: string) => {
      return DataCache.getInstance().get(stratName)
        .then((s) => s.ids())
        .catch(() => Range.all());
    };

    const clusterMatrix = (matrix: INumericalMatrix, rowStratId: string, colStratId: string) => {
      if (colStratId !== '' && rowStratId !== '') {
        return Promise.all([
          loadStratIds(matrix.desc.id + rowStratId),
          loadStratIds(matrix.desc.id + colStratId)
        ])
          .then((ranges) => matrix.idView(Range.join(ranges))) // Range must be [1] row ids, [2] col ids
          .then((matrixView) => <INumericalMatrix>matrixView)
          .catch((error) => {
            return matrix;
          });
      }
      return Promise.resolve(matrix);
    };

    clusterMatrix(selection[0].item, selection[0].rowStratId, selection[0].colStratId)
      .then((matrix) => {
        GlobalEventHandler.getInstance().fire(AppConstants.EVENT_DATASET_SELECTED_LEFT, matrix);
      });

    clusterMatrix(selection[1].item, selection[1].rowStratId, selection[1].colStratId)
      .then((matrix) => {
        GlobalEventHandler.getInstance().fire(AppConstants.EVENT_DATASET_SELECTED_RIGHT, matrix);
      });

    this.$node.select('button').attr('disabled', 'disabled').classed('loading', true);
  }

  /**
   * Factory method to create a new DiffHeatMap instance
   * @param parent
   * @param options
   * @returns {DiffHeatMap}
   */
  static create(parent: Element, options: any) {
    return new DetailView(parent, options);
  }
}
