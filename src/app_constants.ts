/**
 * Created by Holger Stitz on 26.08.2016.
 */

export class AppConstants {

  /**
   * Static constant as identification for TaCo views
   * Note: the string value is referenced for multiple view definitions in the package.json,
   *       i.e. be careful when refactor the value
   */
  static VIEW = 'tacoView';


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
  static EVENT_OPEN_DIFF_HEATMAP = 'eventDrawDiffDeatmap';

  static EVENT_OPEN_2D_HISTOGRAM = 'open2DHistogram';
  static EVENT_CLOSE_2D_HISTOGRAM = 'close2DHistogram';

  static EVENT_TOGGLE_GROUP = 'toggleGroup';

  static EVENT_SHOW_CHANGE = 'showChange';
  static EVENT_HIDE_CHANGE = 'hideChange';


  /**
   * Format the date output (see http://momentjs.com/docs/#/displaying/)
   * @type {string}
   */
  static DATE_FORMAT = 'YYYY-MM-DD';

  /**
   * Parse the following date formats from strings using moment.js (see http://momentjs.com/docs/#/parsing/)
   * @type {string[]}
   */
  static PARSE_DATE_FORMATS = ['YYYY_MM_DD', 'YYYY-MM-DD', 'YYYY'];
}

export interface IChangeType {
  type: string;
  ratioName: string;
  countName: string;
  label: string;

  isActive: boolean;
}

export class ChangeTypes {

  static NO_CHANGE: IChangeType = {
    type: 'nochange',
    ratioName: 'no_ratio',
    countName: 'no_counts',
    label: 'No changes',
    isActive: true
  };

  static CONTENT: IChangeType = {
    type: 'content',
    ratioName: 'c_ratio',
    countName: 'c_counts',
    label: 'Content',
    isActive: true
  };

  static ADDED: IChangeType = {
    type: 'added',
    ratioName: 'a_ratio',
    countName: 'a_counts',
    label: 'Added',
    isActive: true
  };

  static REMOVED: IChangeType = {
    type: 'removed',
    ratioName: 'd_ratio',
    countName: 'd_counts',
    label: 'Removed',
    isActive: true
  };

  static REORDER: IChangeType = {
    type: 'reorder',
    ratioName: 'r_ratio',
    countName: 'r_counts',
    isActive: true
  };

  static TYPE_ARRAY: IChangeType[] = [ChangeTypes.NO_CHANGE, ChangeTypes.CONTENT, ChangeTypes.ADDED, ChangeTypes.REMOVED, ChangeTypes.REORDER];

  static labelForType(type:string) {
    console.log(type);
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

}
