/**
 * Created by Holger Stitz on 26.08.2016.
 */

export class TacoConstants {

  /**
   * Static constant as identification for TaCo views
   * Note: the string value is referenced for multiple view definitions in the package.json,
   *       i.e. be careful when refactor the value
   */
  static VIEW = 'tacoView';


  /**
   * Event that is fired when the selected dataset has changed
   * @type {string}
   */
  static EVENT_DATASET_CHANGED = 'eventDataSetChanged';
}
