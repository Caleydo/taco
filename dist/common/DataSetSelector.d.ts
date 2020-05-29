/**
 * Created by Holger Stitz on 26.08.2016.
 */
import * as moment from 'moment';
import { INumericalMatrix } from 'phovea_core';
import * as d3 from 'd3';
import { Moment } from 'moment';
import Format = d3.time.Format;
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
    rowStratId: string;
    colStratId: string;
}
export interface ITacoTimeFormat {
    d3: ((d: any) => string) | Format | string;
    moment: string;
    momentIsSame: moment.unitOfTime.StartOf;
}
