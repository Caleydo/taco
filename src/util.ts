/**
 * Created by Holger Stitz on 19.12.2016.
 */

import * as moment from 'moment';
import * as d3 from 'd3';


export function getPosXScale(items, totalWidth, padding = 20) {
  const firstTimePoint = moment(items[0].time);
  const lastTimePoint = moment(items[items.length - 1].time);
  const timeRange = lastTimePoint.diff(firstTimePoint, 'days');

  return d3.scale.linear()
    .domain([0, timeRange])
    .range([20, totalWidth - padding]);
}
