/**
 * Created by Holger Stitz on 25.08.2016.
 */

import d3 = require('d3');

/**
 * The main class for the TaCo app
 */
export class TaCo {

  private $node;

  constructor(parent:Element) {
    this.$node = d3.select(parent);

    this.$node.html(`<h1 style="margin: 20px;">Welcome to TaCo</h1>`);
  }

}

/**
 * Factory method to create a new TaCo instance
 * @param parent
 * @returns {TaCo}
 */
export function create(parent:Element) {
  return new TaCo(parent);
}
