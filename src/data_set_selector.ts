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
import {hash} from 'phovea_core/src';
import {selectTimePointFromHash} from './util';

/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
class DataSetSelector implements IAppView {

  private $node;
  private $select;

  constructor(parent:Element, private options:any) {
    this.$node = d3.select('.navbar-header')
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

        hash.setProp(AppConstants.HASH_PROPS.DATASET, selectedData[0].key);
        hash.removeProp(AppConstants.HASH_PROPS.TIME_POINTS);
        hash.removeProp(AppConstants.HASH_PROPS.DETAIL_VIEW);

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

        if(hash.has(AppConstants.HASH_PROPS.DATASET)) {
          const selectedData = data.filter((d, i) => d.key === hash.getProp(AppConstants.HASH_PROPS.DATASET));

          if(selectedData.length > 0) {
            this.$select.property('selectedIndex', data.indexOf(selectedData[0]));
            events.fire(AppConstants.EVENT_DATA_COLLECTION_SELECTED, selectedData[0].values);

            selectTimePointFromHash(selectedData[0].values);
          }

        } else {
          // invoke change function once to broadcast event
          this.$select.on('change')();
        }

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
    return data
      //.list((d) => {
      //  return d.desc.type === 'matrix' && (<IMatrixDataDescription<IValueTypeDesc>>d.desc).value.type === VALUE_TYPE_REAL; // return numerical matrices only
      //})
      .list({'type': 'matrix'}) // use server-side filtering
      .then((list: INumericalMatrix[]) => {
        const olympicsData = this.prepareOlympicsData(list);
        const tcgaData = this.prepareTCGAData(list);
        return [].concat(olympicsData, tcgaData);
      });
  }

  prepareTCGAData(matrices:INumericalMatrix[]):any[] {
    const dateRegex = new RegExp(/.*(\d{4})[_-](\d{2})[_-](\d{2}).*/); // matches YYYY_MM_DD or YYYY-MM-DD

    return d3.nest()
      .key((d: INumericalMatrix) => d.desc.fqname.split('/')[1]).sortKeys(d3.ascending) // e.g. Copynumber, mRNA
      .key((d: INumericalMatrix) => d.desc.fqname.split('/')[0]).sortKeys(d3.ascending) // e.g., TCGA_GBM_2013_02_22
      .entries(matrices.filter((d) => dateRegex.test(d.desc.fqname) === true))
      .map((d) => {
        d.values = d.values.map((e) => {
          e.timeFormat = {d3: '%Y-%m-%d', moment: 'YYYY-MM-DD', momentIsSame: 'day'};
          e.item = e.values[0]; // shortcut reference

          const matches = e.key.match(dateRegex);
          e.time = (matches === null) ? null : moment(e.key, AppConstants.PARSE_DATE_FORMATS);

          return e;
        });
        return d;
      });
  }

  prepareOlympicsData(matrices:INumericalMatrix[]):any[] {
    const olympicsCats = ['total', 'bronze', 'silver', 'gold'];
    return olympicsCats
      .map((cat) => {
        return d3.nest()
          .key((d: INumericalMatrix) => d.desc.fqname.match(/([A-Z])\w+/g).join(' ')).sortKeys(d3.ascending) // e.g. "Olympic Games Total Medals"
          .key((d: INumericalMatrix) => d.desc.fqname.match(/(\d)\w+/g).join(' ')).sortKeys(d3.ascending) // e.g. 1920
          .entries(matrices.filter((d) => d.desc.fqname.toLowerCase().search('olympic') > -1 && d.desc.fqname.toLowerCase().search(cat) > -1));
      })
      .reduce((prev, curr) => prev.concat(curr), [])
      .map((d) => {
        d.values = d.values.map((e) => {
          e.timeFormat = {d3: '%Y', moment: 'YYYY', momentIsSame: 'year'};
          e.item = e.values[0]; // shortcut reference

          const matches = e.key.match(/(\d)\w+/g);
          e.time = (matches === null) ? null : moment(e.key, AppConstants.PARSE_DATE_FORMATS);

          return e;
        });
        return d;
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
