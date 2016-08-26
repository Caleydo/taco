/**
 * Created by Holger Stitz on 25.08.2016.
 */

import i18n = require('../caleydo_i18n/i18n');
import plugins = require('../caleydo_core/plugin');
import d3 = require('d3');
import {TacoConstants} from './TacoConstants';

/**
 * The main class for the TaCo app
 */
export class Taco {

  private $node;

  constructor(parent:Element) {
    this.$node = d3.select(parent);

    this.$node.html(`<h1 style="margin: 20px;">${i18n.t('welcome_msg')}</h1>`);

    plugins.get(TacoConstants.VIEW, 'DatasetSelector').load()
      .then((p) => {
        const view = p.factory(parent, {});
        view.init();
      });
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
