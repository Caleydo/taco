/**
 * Created by Holger Stitz on 25.08.2016.
 */

//import i18n = require('../caleydo_i18n/i18n');
import plugins = require('../caleydo_core/plugin');
import d3 = require('d3');
import {TacoConstants} from './TacoConstants';

/**
 * Interface for all TaCo Views
 */
export interface ITacoView {

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<ITacoView>}
   */
  init():Promise<ITacoView>;

}

/**
 * The main class for the TaCo app
 */
export class Taco implements ITacoView {

  private $node;

  private views = ['DatasetSelector', 'Timeline'];

  constructor(parent:Element) {
    this.$node = d3.select(parent);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<Taco>}
   */
  init() {
    return this.build();
  }

  /**
   * Load and initialize all necessary views
   * @returns {Promise<Taco>}
   */
  private build() {
    this.setBusy(true); // show loading indicator before loading

    // wrap view ids from package.json as plugin and load the necessary files
    const pluginPromises = this.views.map((d) => plugins.get(TacoConstants.VIEW, d).load());

    // when everything is loaded, then create and init the views
    const buildPromise = Promise.all(pluginPromises)
      .then((plugins) => {
        this.$node.select('h3').remove(); // remove loading text from index.html template

        const initPromises = plugins.map((p) => {
          const view = p.factory(this.$node.node(), {});
          return view.init();
        });

        // wait until all views are initialized, before going to next then
        return Promise.all(initPromises);
      })
      .then((viewInstances) => {
        // loading and initialization has finished -> hide loading indicator
        this.setBusy(false);
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
 * @returns {Taco}
 */
export function create(parent:Element) {
  return new Taco(parent);
}
