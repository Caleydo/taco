/**
 * Created by Holger Stitz on 19.12.2016.
 */

import * as moment from 'moment';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {hash} from 'phovea_core/src';
import {ITacoTimePoint} from './data_set_selector';

export function getTotalWidth(items:ITacoTimePoint[], itemWidth:number, totalWidth:number):number {
  totalWidth = (items && items.length * itemWidth > totalWidth) ? (items.length * (itemWidth * 2)) : totalWidth;
  return totalWidth;
}

export function getTimeScale(items:ITacoTimePoint[], totalWidth:number, padding:number = 20) {
  const firstTimePoint = moment(items[0].time).toDate();
  const lastTimePoint = moment(items[items.length - 1].time).toDate();

  return d3.time.scale()
    .domain([firstTimePoint, lastTimePoint])
    .range([padding, totalWidth - padding]);
}

let selectedTimePoints:ITacoTimePoint[] = [];

/**
 * Stores a selected time point and sends an event with all stored time points
 * If two time points are stored, the array is cleared
 * @param timepoints
 */
export function selectTimePoint(...timepoints:ITacoTimePoint[]) {
  // remove timepoints that are already selected
  timepoints = timepoints.filter((d) => selectedTimePoints.indexOf(d) === -1);

  if(timepoints.length > 2) {
    timepoints = timepoints.slice(0, 2);
  }

  selectedTimePoints.push(...timepoints);

  // sort elements by time -> [0] = earlier = source; [1] = later = destination
  selectedTimePoints = selectedTimePoints.sort((a, b) => d3.ascending(a.time.toISOString(), b.time.toISOString()));

  hash.setProp(AppConstants.HASH_PROPS.TIME_POINTS, selectedTimePoints.map((d) => d.key).join(','));
  hash.removeProp(AppConstants.HASH_PROPS.DETAIL_VIEW);

  events.fire(AppConstants.EVENT_TIME_POINTS_SELECTED, selectedTimePoints);

  // clear after 2 selected time points
  if(selectedTimePoints.length === 2) {
    selectedTimePoints = [];
  }
}

/**
 * Filters list of time points from given keys in the URL hash and fires the event
 * @param timepoints
 */
export function selectTimePointFromHash(timepoints:ITacoTimePoint[]) {
  if(hash.has(AppConstants.HASH_PROPS.TIME_POINTS) === false) {
    return;
  }

  const selectedTPKeys:string[] = hash.getProp(AppConstants.HASH_PROPS.TIME_POINTS).split(',');
  const selectedTimePoints = timepoints.filter((d) => selectedTPKeys.indexOf(d.key) > -1);
  const showDetailView = hash.getInt(AppConstants.HASH_PROPS.DETAIL_VIEW);

  selectTimePoint(...selectedTimePoints);

  if(selectedTimePoints.length === 2 && showDetailView === 1) {
    hash.setInt(AppConstants.HASH_PROPS.DETAIL_VIEW, showDetailView);
    events.fire(AppConstants.EVENT_OPEN_DETAIL_VIEW, selectedTimePoints);

  } else {
    hash.removeProp(AppConstants.HASH_PROPS.DETAIL_VIEW);
  }
}
