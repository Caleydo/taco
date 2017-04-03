/**
 * Created by Holger Stitz on 26.08.2016.
 */

import * as moment from 'moment';
import * as data from 'phovea_core/src/data';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import {Language} from './language';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import * as d3 from 'd3';
import {hash} from 'phovea_core/src';
import {selectTimePointFromHash} from './util';
import {ProductIDType} from 'phovea_core/src/idtype';
import {parse} from 'phovea_core/src/range';
import {Moment} from 'moment';

export interface ITacoDataset {
  key: string;
  values: ITacoTimePoint[];
}

export interface ITacoTimePoint {
  item: INumericalMatrix;
  key: string;
  time: Moment;
  timeFormat: ITacoTimeFormat;
  values: INumericalMatrix[];
}

export interface ITacoTimeFormat {
  d3: string;
  moment: string;
  momentIsSame: string;
}

/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
class DataSetSelector implements IAppView {

  private $node;
  private $select;

  private trackedSelections: ProductIDType = null;
  private onSelectionChanged = () => this.updateSelectionHash();

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

    // create select and update hash on property change
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
        hash.removeProp(AppConstants.HASH_PROPS.SELECTION);

        if(selectedData.length > 0) {
          events.fire(AppConstants.EVENT_DATA_COLLECTION_SELECTED, selectedData[0].values);
          this.trackSelections(selectedData[0].values[0].item);
        }
      });
  }

  /**
   * Toggle tracking of selection of rows/columns/cells for the given dataset
   * @param matrix selected dataset
   */
  private trackSelections(matrix: INumericalMatrix) {
    if (this.trackedSelections) {
      this.trackedSelections.off(ProductIDType.EVENT_SELECT_PRODUCT, this.onSelectionChanged);
    }
    this.trackedSelections = matrix.producttype;
    this.trackedSelections.on(ProductIDType.EVENT_SELECT_PRODUCT, this.onSelectionChanged);
  }

  /**
   * Update the URL hash based on the selections
   */
  private updateSelectionHash() {
    if (!this.trackedSelections) {
      return;
    }
    const ranges = this.trackedSelections.productSelections();
    const value = ranges.map((r) => r.toString()).join(';');
    hash.setProp(AppConstants.HASH_PROPS.SELECTION, value);
  }

  /**
   * Restore the selections based on the URL hash
   */
  private restoreSelections() {
    if (!this.trackedSelections) {
      return;
    }
    const value = hash.getProp(AppConstants.HASH_PROPS.SELECTION, '');
    if (value === '') {
      return;
    }
    const ranges = value.split(';').map((s) => parse(s));
    this.trackedSelections.select(ranges);
  }

  /**
   * Update the list of datasets and returns a promise
   * @returns {Promise<DataSetSelector>}
   */
  private update() {
    const dataprovider = new DataProvider();
    return dataprovider.load()
      .then((data:ITacoDataset[]) => {
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

            this.trackSelections(selectedData[0].values[0].item);
            this.restoreSelections();
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
   * @returns {Promise<ITacoDataset[]>}
   */
  load() {
    return data
      //.list((d) => {
      //  return d.desc.type === 'matrix' && (<IMatrixDataDescription<IValueTypeDesc>>d.desc).value.type === VALUE_TYPE_REAL; // return numerical matrices only
      //})
      .list({'type': 'matrix'}) // use server-side filtering
      .then((list: INumericalMatrix[]) => {
        const olympicsData:ITacoDataset[] = this.prepareOlympicsData(list);
        const tcgaData:ITacoDataset[] = this.prepareTCGAData(list);
        return [].concat(olympicsData, tcgaData);
      });
  }

  prepareTCGAData(matrices:INumericalMatrix[]):ITacoDataset[] {
    const dateRegex = new RegExp(/.*(\d{4})[_-](\d{2})[_-](\d{2}).*/); // matches YYYY_MM_DD or YYYY-MM-DD

    return d3.nest()
      .key((d: INumericalMatrix) => d.desc.fqname.split('/')[1]).sortKeys(d3.ascending) // e.g. Copynumber, mRNA
      .key((d: INumericalMatrix) => d.desc.fqname.split('/')[0]).sortKeys(d3.ascending) // e.g., TCGA_GBM_2013_02_22
      .entries(matrices.filter((d) => dateRegex.test(d.desc.fqname) === true))
      .map((d:ITacoDataset) => {
        d.values = d.values.map((e:ITacoTimePoint) => {
          e.timeFormat = {d3: '%Y-%m-%d', moment: 'YYYY-MM-DD', momentIsSame: 'day'};
          e.item = e.values[0]; // shortcut reference

          const matches = e.key.match(dateRegex);
          e.time = (matches === null) ? null : moment(e.key, AppConstants.PARSE_DATE_FORMATS);

          return e;
        });
        return d;
      });
  }

  prepareOlympicsData(matrices:INumericalMatrix[]):ITacoDataset[] {
    const olympicsCats = ['total', 'bronze', 'silver', 'gold'];
    return olympicsCats
      .map((cat) => {
        return d3.nest()
          .key((d: INumericalMatrix) => d.desc.fqname.match(/([A-Z])\w+/g).join(' ')).sortKeys(d3.ascending) // e.g. "Olympic Games Total Medals"
          .key((d: INumericalMatrix) => d.desc.fqname.match(/(\d)\w+/g).join(' ')).sortKeys(d3.ascending) // e.g. 1920
          .entries(matrices.filter((d) => d.desc.fqname.toLowerCase().search('olympic') > -1 && d.desc.fqname.toLowerCase().search(cat) > -1));
      })
      .reduce((prev, curr) => prev.concat(curr), [])
      .map((d:ITacoDataset) => {
        d.values = d.values.map((e:ITacoTimePoint) => {
          e.timeFormat = {d3: '%Y', moment: 'YYYY', momentIsSame: 'year'};
          e.item = e.values[0]; // shortcut reference

          const matches = e.key.match(/(\d)\w+/g);
          e.time = (matches === null) ? null : moment(e.key, AppConstants.PARSE_DATE_FORMATS);

          return e;
        });
        return d;
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
