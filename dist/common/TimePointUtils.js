/**
 * Created by Holger Stitz on 19.12.2016.
 */
import * as moment from 'moment';
import * as d3 from 'd3';
import { EventHandler } from 'phovea_core';
import { AppConstants } from '../app/AppConstants';
import { AppContext } from 'phovea_core';
export class TimePointUtils {
    static getTotalWidth(items, itemWidth, totalWidth) {
        totalWidth = (items && items.length * itemWidth > totalWidth) ? (items.length * (itemWidth * 2.5)) : totalWidth;
        return totalWidth;
    }
    static getTimeScale(items, totalWidth, padding = 20) {
        const firstTimePoint = moment(items[0].time).toDate();
        const lastTimePoint = moment(items[items.length - 1].time).toDate();
        return d3.time.scale()
            .domain([firstTimePoint, lastTimePoint])
            .range([padding, totalWidth - padding]);
    }
    /**
     * Stores a selected time point and sends an event with all stored time points
     * If two time points are stored, the array is cleared
     * @param timepoints
     */
    static selectTimePoint(...timepoints) {
        // remove timepoints that are already selected
        timepoints = timepoints.filter((d) => TimePointUtils.selectedTimePoints.indexOf(d) === -1);
        if (timepoints.length > 2) {
            timepoints = timepoints.slice(0, 2);
        }
        TimePointUtils.selectedTimePoints.push(...timepoints);
        // sort elements by time -> [0] = earlier = source; [1] = later = destination
        TimePointUtils.selectedTimePoints = TimePointUtils.selectedTimePoints.sort((a, b) => d3.ascending(a.time.toISOString(), b.time.toISOString()));
        AppContext.getInstance().hash.setProp(AppConstants.HASH_PROPS.TIME_POINTS, TimePointUtils.selectedTimePoints.map((d) => d.key).join(','));
        AppContext.getInstance().hash.removeProp(AppConstants.HASH_PROPS.DETAIL_VIEW);
        EventHandler.getInstance().fire(AppConstants.EVENT_TIME_POINTS_SELECTED, TimePointUtils.selectedTimePoints);
        // clear after 2 selected time points
        if (TimePointUtils.selectedTimePoints.length === 2) {
            TimePointUtils.selectedTimePoints = [];
        }
    }
    /**
     * Filters list of time points from given keys in the URL hash and fires the event
     * @param timepoints
     */
    static selectTimePointFromHash(timepoints) {
        if (AppContext.getInstance().hash.has(AppConstants.HASH_PROPS.TIME_POINTS) === false) {
            return;
        }
        const selectedTPKeys = AppContext.getInstance().hash.getProp(AppConstants.HASH_PROPS.TIME_POINTS).split(',');
        const selectedTimePoints = timepoints.filter((d) => selectedTPKeys.indexOf(d.key) > -1);
        const showDetailView = AppContext.getInstance().hash.getInt(AppConstants.HASH_PROPS.DETAIL_VIEW);
        TimePointUtils.selectTimePoint(...selectedTimePoints);
        if (selectedTimePoints.length === 2 && showDetailView === 1) {
            AppContext.getInstance().hash.setInt(AppConstants.HASH_PROPS.DETAIL_VIEW, showDetailView);
            EventHandler.getInstance().fire(AppConstants.EVENT_OPEN_DETAIL_VIEW, selectedTimePoints);
        }
        else {
            AppContext.getInstance().hash.removeProp(AppConstants.HASH_PROPS.DETAIL_VIEW);
        }
    }
}
TimePointUtils.selectedTimePoints = [];
//# sourceMappingURL=TimePointUtils.js.map