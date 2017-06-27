/**
 * Created by Holger Stitz on 26.08.2016.
 */
import {hash} from 'phovea_core/src';
import {App} from 'taco/src/app';

export class AppConstants {

  /**
   * Static constant as identification for TACO views
   * Note: the string value is referenced for multiple view definitions in the package.json,
   *       i.e. be careful when refactor the value
   */
  static VIEW = 'tacoView';

  static EVENT_RESIZE = 'eventResize';

  /**
   * Event that is fired when a data set collection has been selected
   * @type {string}
   */
  static EVENT_DATA_COLLECTION_SELECTED = 'eventDataCollectionSelected';

  /**
   * Event that is fired when a data set has been selected
   * @type {string}
   */
  static EVENT_DATASET_SELECTED = 'eventDataSetSelected';
  static EVENT_DATASET_SELECTED_LEFT = 'eventDataSetSelectedLeft';
  static EVENT_DATASET_SELECTED_RIGHT = 'eventDataSetSelectedRight';
  static EVENT_OPEN_DIFF_HEATMAP = 'eventDrawDiffHeatmap';

  static EVENT_OPEN_DETAIL_VIEW = 'eventOpenDetailView';

  static EVENT_DIFF_HEATMAP_LOADED = 'eventDiffHeatmapLoaded';
  static EVENT_HEATMAP_LOADED = 'eventHeatmapLoaded';

  static EVENT_TIME_POINTS_SELECTED = 'eventTimePointsSelected';
  static EVENT_TIME_POINT_HOVERED = 'eventTimePointHovered';

  static EVENT_SHOW_CHANGE = 'eventShowChange';
  static EVENT_HIDE_CHANGE = 'eventHideChange';

  static EVENT_FOCUS_ON_REORDER = 'eventFocusOnReorder';

  /**
   * Parse the following date formats from strings using moment.js (see http://momentjs.com/docs/#/parsing/)
   * @type {string[]}
   */
  static PARSE_DATE_FORMATS = ['YYYY_MM_DD', 'YYYY-MM-DD', 'YYYY'];

  static MAXIMAL_HEATMAP_LABEL_SIZE = 70;

  /**
   * Initial size of a heatmap cell
   * @type {number}
   */
  static HEATMAP_CELL_SIZE = 5;

  /**
   * Property for the URL hash
   * @type {{DATASET: string; TIME_POINTS: string; DETAIL_VIEW: string}}
   */
  static HASH_PROPS = {
    DATASET: 'ds',
    TIME_POINTS: 'tp',
    DETAIL_VIEW: 'detail',
    FILTER: 'f',
    SELECTION: 's'
  };
}

export const COLOR_ADDED = '#a1d76a';
export const COLOR_DELETED = '#e9a3c9';
export const COLOR_NO_CHANGE = '#fff';
export const COLOR_CONTENT_NEGATIVE = '#d8b365';
export const COLOR_CONTENT_POSITIVE = '#8da0cb';

export interface IChangeType {
  type: string;
  ratioName: string;
  countName: string;
  label: string;

  isActive: boolean;

  abbr: string;
}

const defaultFilter = hash.getProp(AppConstants.HASH_PROPS.FILTER, 'NCAR');

export class ChangeTypes {

  static NO_CHANGE: IChangeType = {
    type: 'nochange',
    ratioName: 'no_ratio',
    countName: 'no_counts',
    label: 'No changes',
    abbr: 'N',
    isActive: defaultFilter.includes('N')
  };

  static CONTENT: IChangeType = {
    type: 'content',
    ratioName: 'c_ratio',
    countName: 'c_counts',
    label: 'Content',
    abbr: 'C',
    isActive: defaultFilter.includes('C')
  };

  static ADDED: IChangeType = {
    type: 'added',
    ratioName: 'a_ratio',
    countName: 'a_counts',
    label: 'Added',
    abbr: 'A',
    isActive: defaultFilter.includes('A')
  };

  static REMOVED: IChangeType = {
    type: 'removed',
    ratioName: 'd_ratio',
    countName: 'd_counts',
    label: 'Removed',
    abbr: 'R',
    isActive: defaultFilter.includes('R')
  };

  static REORDER: IChangeType = {
    type: 'reorder',
    ratioName: 'r_ratio',
    countName: 'r_counts',
    label: 'Reorder',
    abbr: 'O',
    isActive: defaultFilter.includes('O')
  };

  static TYPE_ARRAY: IChangeType[] = [ChangeTypes.ADDED, ChangeTypes.REMOVED, ChangeTypes.CONTENT, ChangeTypes.REORDER, ChangeTypes.NO_CHANGE];

  static labelForType(type:string) {
    return this.TYPE_ARRAY.filter((d) => d.type === type)[0].label;
  }

  /**
   * Filters only active changes and joins them for the URL
   * @returns {string}
   */
  static forURL():string {
    return this.TYPE_ARRAY
      .filter((d) => d.isActive)
      .map((d) => (d === this.REMOVED || d === this.ADDED) ? 'structure' : d.type)
      .join(',');
  }

  static updateFilterHash() {
    hash.setProp(AppConstants.HASH_PROPS.FILTER, ChangeTypes.TYPE_ARRAY.filter((d) => d.isActive).map((d) => d.abbr).join(''));
  }
}


