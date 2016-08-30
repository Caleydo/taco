/**
 * Created by Holger Stitz on 26.08.2016.
 */

import i18n = require('../caleydo_i18n/i18n');
import data = require('../caleydo_core/data');
import events = require('../caleydo_core/event');
import {TacoConstants} from './TacoConstants';
import {ITacoView} from './Taco';

/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
class DataSetSelector implements ITacoView {

  private $node;
  private $select;

  constructor(parent:Element, private options:any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('dataSelector', true)
      .append('form')
      .classed('form-inline', true)
      .append('div')
      .classed('form-group', true)
      .classed('hidden', true); // show after loading has finished
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<DataSetSelector>}
   */
  init() {
    this.build();
    return this.update(); // return the promise
  }

  /**
   * Build the basic DOM elements and binds the change function
   */
  private build() {
    this.$node.append('label')
      .attr('for', 'ds')
      .text(i18n.t('dataset'));

    this.$select = this.$node.append('select')
      .attr('id', 'ds')
      .classed('form-control', true)
      .on('change', () => {
        const selectedData = this.$select.selectAll('option')
          .filter((d, i) => i === this.$select.property('selectedIndex'))
          .data();

        if(selectedData.length > 0) {
          events.fire(TacoConstants.EVENT_DATA_COLLECTION_SELECTED, selectedData[0].items);
        }
      });
  }

  /**
   * Update the list of datasets and returns a promise
   * @returns {Promise<DataSetSelector>}
   */
  private update() {
     return data.tree((d) => d.desc.type === 'matrix')
      .then((tree) => {
        // convert tree structure (uses only level 1 + 2)
        const data = tree.children.map((d) => {
          return {
            name: d.name,
            items: d.children.map((c) => c.data)
          };
        });

        const $options = this.$select.selectAll('option').data(data);

        $options.enter().append('option');

        $options
          .attr('value', (d) => d.name)
          .text((d) => `${d.name}`);

        $options.exit().remove();

        // invoke change function once to broadcast event
        this.$select.on('change')();

        // show form element
        this.$node.classed('hidden', false);

        return this;
      });
  }

}

/**
 * Factory method to create a new DataSetSelector instance
 * @param parent
 * @param options
 * @returns {DataSetSelector}
 */
export function create(parent:Element, options:any) {
  return new DataSetSelector(parent, options);
}
