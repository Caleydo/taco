/**
 * Created by Holger Stitz on 29.08.2016.
 */

import i18n = require('../caleydo_i18n/i18n');
import events = require('../caleydo_core/event');
import {TacoConstants} from './TacoConstants';
import {ITacoView} from './Taco';

/**
 * Shows a timeline with all available data points for
 */
class Timeline implements ITacoView {

  private $node;

  constructor(parent:Element, private options:any) {
    this.$node = d3.select(parent).append('div').classed('timeline', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<Timeline>}
   */
  init() {
    this.build();
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  /**
   * Build the basic DOM elements and binds the change function
   */
  private build() {
    // TODO build timeline using D3 of parts that doesn't change on update()
    this.$node.html(`
      <h3>${i18n.t('timeline')}</h3>
      <ul class="output"></ul>
    `);
  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(TacoConstants.EVENT_DATASET_CHANGED, (evt, items) => this.updateItems(items));
  }

  /**
   * Handle the update for a selected dataset
   * @param items
   */
  private updateItems(items) {
    // TODO retrieve selected dataset and update the timeline with it
    //console.log(items);
    const $li = this.$node.select('ul.output').selectAll('li').data(items);
    $li.enter().append('li');
    $li.text((d) => `${d.desc.name} (${d.dim[0]} x ${d.dim[1]})`);
    $li.exit().remove();
  }

}

/**
 * Factory method to create a new Timeline instance
 * @param parent
 * @param options
 * @returns {Timeline}
 */
export function create(parent:Element, options:any) {
  return new Timeline(parent, options);
}
