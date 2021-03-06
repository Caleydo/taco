/**
 * Created by Holger Stitz on 26.08.2016.
 */

import * as moment from 'moment';
import {DataCache} from 'phovea_core';
import {GlobalEventHandler} from 'phovea_core';
import {AppConstants} from '../app/AppConstants';
import {IAppView} from '../app/App';
import {Language} from '../app/Language';
import {INumericalMatrix} from 'phovea_core';
import * as d3 from 'd3';
import {AppContext} from 'phovea_core';
import {TimePointUtils} from './TimePointUtils';
import {ProductIDType} from 'phovea_core';
import {ParseRangeUtils} from 'phovea_core';
import {ITacoDataset, ITacoTimePoint} from './interfaces';


class DataProvider {

  constructor() {
    //
  }

  /**
   * Loads the data and retruns a promise
   * @returns {Promise<ITacoDataset[]>}
   */
  load() {
    return DataCache.getInstance()
    //.list((d) => {
    //  return d.desc.type === 'matrix' && (<IMatrixDataDescription<IValueTypeDesc>>d.desc).value.type === VALUE_TYPE_REAL; // return numerical matrices only
    //})
      .list({'type': 'matrix'}) // use server-side filtering
      .then((list: INumericalMatrix[]) => {
        const olympicsData: ITacoDataset[] = this.prepareOlympicsData(list);
        const tcgaData: ITacoDataset[] = this.prepareTCGAData(list);
        const lastfmData: ITacoDataset[] = this.prepareLastFmData(list);
        return [].concat(olympicsData, tcgaData, lastfmData);
      });
  }

  prepareTCGAData(matrices: INumericalMatrix[]): ITacoDataset[] {
    const dateRegex = new RegExp(/.*(\d{4})[_-](\d{2})[_-](\d{2}).*/); // matches YYYY_MM_DD or YYYY-MM-DD

    return d3.nest()
      .key((d: INumericalMatrix) => d.desc.fqname.split('/')[1]).sortKeys(d3.ascending) // e.g. Copynumber, mRNA
      .key((d: INumericalMatrix) => d.desc.fqname.split('/')[0]).sortKeys(d3.ascending) // e.g., TCGA_GBM_2013_02_22
      .entries(matrices.filter((d) => dateRegex.test(d.desc.fqname) === true))
      .map((d: ITacoDataset) => {
        d.values = d.values.map((e: ITacoTimePoint) => {
          e.timeFormat = {d3: d3.time.format('%Y-%m-%d'), moment: 'YYYY-MM-DD', momentIsSame: 'day'};
          e.item = e.values[0]; // shortcut reference

          const matches = e.key.match(dateRegex);
          e.time = (matches === null) ? null : moment(e.key, AppConstants.PARSE_DATE_FORMATS);

          // NOTE: ids must match with the hard-coded ones in taco_server/src/diff_cache.py -> stratifyMatrix()
          e.rowStratId = '4CnmfClustering';
          e.colStratId = 'TreeClusterer1';

          return e;
        });
        return d;
      });
  }

  prepareOlympicsData(matrices: INumericalMatrix[]): ITacoDataset[] {
    const olympicsCats = ['total', 'bronze', 'silver', 'gold'];
    return olympicsCats
      .map((cat) => {
        return d3.nest()
          .key((d: INumericalMatrix) => d.desc.fqname.match(/([A-Z])\w+/g).join(' ')).sortKeys(d3.ascending) // e.g. "Olympic Games Total Medals"
          .key((d: INumericalMatrix) => d.desc.fqname.match(/(\d)\w+/g).join(' ')).sortKeys(d3.ascending) // e.g. 1920
          .entries(matrices.filter((d) => d.desc.fqname.toLowerCase().search('olympic') > -1 && d.desc.fqname.toLowerCase().search(cat) > -1));
      })
      .reduce((prev, curr) => prev.concat(curr), [])
      .map((d: ITacoDataset) => {
        d.values = d.values.map((e: ITacoTimePoint) => {
          e.timeFormat = {d3: d3.time.format('%Y'), moment: 'YYYY', momentIsSame: 'year'};
          e.item = e.values[0]; // shortcut reference

          const matches = e.key.match(/(\d)\w+/g);
          e.time = (matches === null) ? null : moment(e.key, AppConstants.PARSE_DATE_FORMATS);

          e.rowStratId = '';
          e.colStratId = '';

          return e;
        });
        return d;
      });
  }

  prepareLastFmData(matrices: INumericalMatrix[]): ITacoDataset[] {
    const dateRegex = new RegExp(/.*(\d{4}[_-]\d{2}).*/); // matches YYYY_MM or YYYY-MM

    let lastYear = 0;
    const d3TimeFormat = (d: Date) => {
      if (d.getFullYear() !== lastYear) {
        lastYear = d.getFullYear();
        return d3.time.format('%Y-%m')(d);
      }
      return d3.time.format('%m')(d);
    };

    return d3.nest()
      .key((d: INumericalMatrix) => 'last.fm').sortKeys(d3.ascending)
      .key((d: INumericalMatrix) => d.desc.name.match(dateRegex)[1] + '-01').sortKeys(d3.ascending) // e.g. 2010-03
      .entries(matrices.filter((d) => d.desc.name.toLowerCase().search('last.fm') > -1))
      .map((d: ITacoDataset) => {
        d.values = d.values.map((e: ITacoTimePoint) => {
          e.timeFormat = {d3: d3TimeFormat, moment: 'YYYY-MM', momentIsSame: 'month'};
          e.item = e.values[0]; // shortcut reference

          const matches = e.key.match(/(\d)\w+/g);
          e.time = (matches === null) ? null : moment(e.key, AppConstants.PARSE_DATE_FORMATS);

          e.rowStratId = '';
          e.colStratId = '';

          return e;
        });
        return d;
      });
  }

}

/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
export class DataSetSelector implements IAppView {

  private $node;
  private $select;

  private trackedSelections: ProductIDType = null;
  private onSelectionChanged = () => this.updateSelectionHash();

  constructor(parent: Element, private options: any) {
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

        AppContext.getInstance().hash.setProp(AppConstants.HASH_PROPS.DATASET, selectedData[0].key);
        AppContext.getInstance().hash.removeProp(AppConstants.HASH_PROPS.TIME_POINTS);
        AppContext.getInstance().hash.removeProp(AppConstants.HASH_PROPS.DETAIL_VIEW);
        AppContext.getInstance().hash.removeProp(AppConstants.HASH_PROPS.SELECTION);

        if (selectedData.length > 0) {
          GlobalEventHandler.getInstance().fire(AppConstants.EVENT_DATA_COLLECTION_SELECTED, selectedData[0].values);
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
    AppContext.getInstance().hash.setProp(AppConstants.HASH_PROPS.SELECTION, value);
  }

  /**
   * Restore the selections based on the URL hash
   */
  private restoreSelections() {
    if (!this.trackedSelections) {
      return;
    }
    const value = AppContext.getInstance().hash.getProp(AppConstants.HASH_PROPS.SELECTION, '');
    if (value === '') {
      return;
    }
    const ranges = value.split(';').map((s) => ParseRangeUtils.parseRangeLike(s));
    this.trackedSelections.select(ranges);
  }

  /**
   * Update the list of datasets and returns a promise
   * @returns {Promise<DataSetSelector>}
   */
  private update() {
    const dataprovider = new DataProvider();
    return dataprovider.load()
      .then((data: ITacoDataset[]) => {
        const $options = this.$select.selectAll('option').data(data);

        $options.enter().append('option');

        $options
          .attr('value', (d) => d.key)
          .text((d) => `${d.key}`);

        $options.exit().remove();

        if (AppContext.getInstance().hash.has(AppConstants.HASH_PROPS.DATASET)) {
          const selectedData = data.filter((d, i) => d.key === AppContext.getInstance().hash.getProp(AppConstants.HASH_PROPS.DATASET));

          if (selectedData.length > 0) {
            this.$select.property('selectedIndex', data.indexOf(selectedData[0]));
            GlobalEventHandler.getInstance().fire(AppConstants.EVENT_DATA_COLLECTION_SELECTED, selectedData[0].values);

            this.trackSelections(selectedData[0].values[0].item);
            this.restoreSelections();
            TimePointUtils.selectTimePointFromHash(selectedData[0].values);
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
  /**
   * Factory method to create a new DataSetSelector instance
   * @param parent
   * @param options
   * @returns {DataSetSelector}
   */
  static create(parent: Element, options: any) {
    return new DataSetSelector(parent, options);
  }
}

