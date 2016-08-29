/**
 * Created by Holger Stitz on 26.08.2016.
 */

import i18n = require('../caleydo_i18n/i18n');
import data = require('../caleydo_core/data');
import datatypes = require('../caleydo_core/datatype');
import events = require('../caleydo_core/event');
import {TacoConstants} from './TacoConstants';
import {ITacoView} from './Taco';

/**
 * Defines the properties for a dataset that is used to generate the option element
 */
interface IDatasets {
  title: string;
  dimension: string;
  regexp: RegExp;
  items: datatypes.IDataType[];
}

/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
class DatasetSelector implements ITacoView {

  private $node;
  private $select;

  /**
   * List of possible datasets and how to filter the items
   * TODO Generate this list dynamically from server
   * @type {IDatasetCategories}
   */
  private datasets:IDatasets[] = [
    {title: 'Taco (Multiple + Tiny + Large)', dimension: '401 x 192', regexp:/.*multiple.*|.*tiny.*|.*Large.*/, items: []},
    {title: 'Taco (All)', dimension: '401 x 192', regexp:/.*Taco (?!merge).*/, items: []},
    {title: 'microRNA', dimension: '150 x 491', regexp:/.*GBM*.*microRNA(?!-seq).*/, items: []},
    {title: 'Methylation', dimension: '8266 x 112', regexp:/.*GBM*.*Methylation.*/, items: []},
    {title: 'Mutations', dimension: '9414 x 284', regexp:/.*GBM*.*Mutations.*/, items: []},
    {title: 'mRNA-seq', dimension: '18214 x 165', regexp:/.*GBM*.*seq.*/, items: []},
    {title: 'mRNA', dimension: '12042 x 527', regexp:/.*GBM*.*mRNA(?!-seq).*/, items: []},
    {title: 'Copy Number', dimension: '24174 x 563', regexp:/.*GBM*.*Copy Number.*/, items: []}
  ];

  constructor(parent:Element, private options:any) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('dataSelector', true)
      .append('div')
      .classed('form-group', true)
      .classed('hidden', true); // show after loading has finished
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<DatasetSelector>}
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
          events.fire(TacoConstants.EVENT_DATASET_CHANGED, selectedData[0].items);
        }
      });
  }

  /**
   * Update the list of datasets and returns a promise
   * @returns {Promise<DatasetSelector>}
   */
  private update() {
     return data.list((d) => d.desc.type === 'matrix')
      .then((items) => {

        var data = this.datasets
          // sort items to datasets
          .map((dc) => {
            dc.items = items.filter((d) => dc.regexp.test(d.desc.fqname));
            return dc;
          })
          // show only options that have one or more items
          .filter((d) => d.items.length > 0);

        const $options = this.$select.selectAll('option').data(data);

        $options.enter().append('option');

        $options
          .attr('value', (d) => d.id)
          .text((d) => `${d.title} (${d.dimension})`);

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
 * Factory method to create a new DatasetSelector instance
 * @param parent
 * @param options
 * @returns {DatasetSelector}
 */
export function create(parent:Element, options:any) {
  return new DatasetSelector(parent, options);
}
