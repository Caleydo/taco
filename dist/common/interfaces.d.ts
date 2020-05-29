/// <reference types="d3" />
import { INumericalMatrix } from 'phovea_core';
import { Moment } from 'moment';
import * as moment from 'moment';
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
