/**
 * Created by Holger Stitz on 25.08.2016.
 */

import * as plugins from 'phovea_core/src/plugin';
import * as d3 from 'd3';
import {AppConstants} from './app_constants';

/**
 * Interface for all TaCo Views
 */
export interface IAppView {

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<IAppView>}
   */
  init():Promise<IAppView>;

}

/**
 * Description for views that are loaded and initialized
 */
interface IAppViewDesc {
  /**
   * View id as defined in the package.json
   */
  view: string;

  /**
   * Parent node where to append this view
   * (either `selector` or `comparison`)
   */
  parent: string;

  /**
   * Options for this view
   */
  options: any;
}

/**
 * The main class for the TaCo app
 */
export class App implements IAppView {

  private $node;

  private views:IAppViewDesc[] = [
    {
      view: 'DataSetSelector',
      parent: 'selector',
      options: {}
    },
    {
      view: 'FilterBar',
      parent: 'selector',
      options: {}
    },
    {
      view: 'BarChart',
      parent: 'selector',
      options: {}
    },
    {
      view: 'Timeline',
      parent: 'selector',
      options: {}
    },
    {
      view: 'Histogram2D',
      parent: 'selector',
      options: {}
    },
    {
      view: 'DetailView',
      parent: 'selector',
      options: {}
    },
    {
      view: 'DiffTitle',
      parent: 'selector',
      options: {}
    },
    {
      view: 'HeatMap',
      parent: 'comparison',
      options: {
        eventName: AppConstants.EVENT_DATASET_SELECTED_LEFT
      }
    },
    {
      view: 'DiffHeatMap',
      parent: 'comparison',
      options: {}
    },
    {
      view: 'HeatMap',
      parent: 'comparison',
      options: {
        eventName: AppConstants.EVENT_DATASET_SELECTED_RIGHT
      }
    }
  ];

  constructor(parent:Element) {
    this.$node = d3.select(parent);

    this.$node.append('div').classed('selector', true);
    this.$node.append('div').classed('comparison', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<App>}
   */
  init() {
    return this.build();
  }

  /**
   * Load and initialize all necessary views
   * @returns {Promise<App>}
   */
  private build() {
    this.setBusy(true); // show loading indicator before loading

    // wrap view ids from package.json as plugin and load the necessary files
    const pluginPromises = this.views
      .map((d) => plugins.get(AppConstants.VIEW, d.view))
      .filter((d) => d !== undefined) // filter views that does not exists
      .map((d) => d.load());

    // when everything is loaded, then create and init the views
    const buildPromise = Promise.all(pluginPromises)
      .then((plugins) => {
        this.$node.select('h3').remove(); // remove loading text from index.html template

        const initPromises = plugins.map((p, index) => {
          const view = p.factory(
            this.$node.select(`.${this.views[index].parent}`).node(), // parent node
            this.views[index].options || {} // options
          );
          return view.init();
        });

        // wait until all views are initialized, before going to next then
        return Promise.all(initPromises);
      })
      .then((viewInstances) => {
        // loading and initialization has finished -> hide loading indicator
        this.setBusy(false);
        d3.select('.placeholder').classed('invisibleClass', false);
        d3.select('.detailview').classed('invisibleClass', false);
        return this;
      });

    return buildPromise;
  }

  /**
   * Show or hide the application loading indicator
   * @param isBusy
   */
  setBusy(isBusy) {
    this.$node.select('.busy').classed('hidden', !isBusy);
  }

}

/**
 * Factory method to create a new TaCo instance
 * @param parent
 * @returns {App}
 */
export function create(parent:Element) {
  return new App(parent);
}
