/**
 * Created by Holger Stitz on 26.08.2016.
 */

import * as moment from 'moment';

import * as data from 'phovea_core/src/data';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import {Language} from './language';
import {IValueTypeDesc, VALUE_TYPE_REAL} from 'phovea_core/src/datatype';
import {INumericalMatrix, IMatrixDataDescription} from 'phovea_core/src/matrix';
import * as d3 from 'd3';

/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
class DataSetSelector implements IAppView {

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
      .text(Language.DATA_SET);

    this.$select = this.$node.append('select')
      .attr('id', 'ds')
      .classed('form-control', true)
      .on('change', () => {
        const selectedData = this.$select.selectAll('option')
          .filter((d, i) => i === this.$select.property('selectedIndex'))
          .data();

        if(selectedData.length > 0) {
          events.fire(AppConstants.EVENT_DATA_COLLECTION_SELECTED, selectedData[0].values);
        }
      });
  }

  /**
   * Update the list of datasets and returns a promise
   * @returns {Promise<DataSetSelector>}
   */
  private update() {
    const dataprovider = new DataProvider();
    return dataprovider.load()
      .then((data) => {
        const $options = this.$select.selectAll('option').data(data);

        $options.enter().append('option');

        $options
          .attr('value', (d) => d.key)
          .text((d) => `${d.key}`);

        $options.exit().remove();

        // invoke change function once to broadcast event
        this.$select.on('change')();

        // show form element
        this.$node.classed('hidden', false);

        return this;
      });
  }

}

class DataProvider {

  constructor() {
    //
  }

  /**
   * Loads the data and retruns a promise
   * @returns {Promise<U>}
   */
  load() {
    return data.list((d) => {
     return d.desc.type === 'matrix' && (<IMatrixDataDescription<IValueTypeDesc>>d.desc).value.type === VALUE_TYPE_REAL; // return numerical matrices only
    })
      .then((list: INumericalMatrix[]) => {
        // filter matrices that starts with a number --> assumption: must be a date
        const dateData = d3.nest()
          .key((d: INumericalMatrix) => d.desc.fqname.split('/')[1]).sortKeys(d3.ascending)
          .key((d: INumericalMatrix) => d.desc.fqname.split('/')[0]).sortKeys(d3.ascending)
          .entries(list.filter((d) => /^\d.*/.test(d.desc.fqname) === true));

        // filter matrices that starts NOT with a number
        const otherData = d3.nest()
          .key((d: INumericalMatrix) => d.desc.fqname.split('/')[0]).sortKeys(d3.ascending)
          .key((d: INumericalMatrix) => d.desc.fqname.split('/')[1]).sortKeys(d3.ascending)
          .entries(list.filter((d) => /^\d.*/.test(d.desc.fqname) === false));

        const r = [].concat(dateData, otherData);

        r.forEach((d) => {
          d.values = d.values.map((e) => {
            e.item = e.values[0]; // shortcut reference

            let matches = e.key.match(/^(\d{4})[_-](\d{2})[_-](\d{2}).*/); // matches YYYY_MM_DD or YYYY-MM-DD
            e.time = (matches === null) ? null : moment(e.key, AppConstants.PARSE_DATE_FORMATS);

            return e;
          });
        });

        return r;
      });
  }

  /*load() {
    return data.tree((d) => d.desc.type === 'matrix')
      .then((tree) => {
        // Convert tree structure (uses only level 1 + 2)
        return tree.children.map((d) {
          return {
            name: d.name,
            items: d.children.map((c) => c.data)
          };
        });
      });
  }*/

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
