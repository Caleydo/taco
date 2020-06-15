/**
 * Created by Holger Stitz on 19.12.2016.
 */
import { IAppView } from '../app/App';
/**
 * This class adds a bar chart, that shows bars with click functionality,
 * in order to show further context.
 */
export declare class BarChart implements IAppView {
    private options;
    private $node;
    private items;
    private totalWidth;
    private widthBar;
    private widthBarChart;
    private heightBarChart;
    private barScaling;
    /**
     * Method retrieves data by given parameters TODO: Documentation
     * @param pair
     * @returns {Promise<any>}
     */
    private static getJSON;
    /**
     * Constructor method for the BarChart class which creates the bar chart on the given parent element.
     * Including eventual options if supplied.
     * @param parent element on which the bar chart element is created
     * @param options optional options for the bar chart element
     */
    constructor(parent: Element, options: any);
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<BarChart>}
     */
    init(): Promise<this>;
    /**
     * This method is called when the window or chart gets resized.
     * It calculates the new width and sets it for the bar chart.
     */
    private resize;
    /**
     * This method is used to attach all listeners and listen for events.
     * The events are triggered throughout the program and are catched here.
     */
    private attachListener;
    /**
     * This method updates the chart upon changing the data or if new data arrives.
     * @param items which are used for the chart
     */
    private updateItems;
    /**
     * This method draws the bars on the timeline or above the timeline.
     * TODO: Documentation
     * @param $parent
     * @param data
     * @param pair
     */
    private drawBar;
    private scaleBarsHeight;
    /**
     *
     * @param data
     * @param propertyName
     * @returns {{type: string, value: any}[]}
     */
    private getBarData;
    /**
     * Factory method to create a new BarChart instance.
     * @param parent Element on which the bar chart is drawn
     * @param options Parameters for the instance (optional)
     * @returns {BarChart}
     */
    static create(parent: Element, options: any): BarChart;
}
