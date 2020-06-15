/**
 * Created by Holger Stitz on 29.11.2016.
 */
import { IAppView } from '../app/App';
/**
 * Shows a 2D ratio chart and histograms for row and column direction
 */
export declare class Histogram2D implements IAppView {
    private options;
    private $node;
    private $ratio;
    private $histogramRows;
    private $histogramCols;
    private borderWidth;
    private height;
    private width;
    private x;
    private y;
    private widthRowHistogram;
    private histogramScale;
    private ratioData;
    /**
     * Create AJAX call to load the 2D ratio data
     * @param pair
     * @returns {Promise<any>}
     */
    private static getJSONRatio2D;
    /**
     * Create AJAX call to load the histogram data
     * @param pair
     * @param binRows
     * @param binCols
     * @returns {Promise<any>}
     */
    private static getJSONHistogram;
    constructor(parent: Element, options: any);
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<Timeline>}
     */
    init(): Promise<this>;
    /**
     * Build the basic DOM elements and binds the change function
     */
    private build;
    /**
     * Attach event handler for broadcasted events
     */
    private attachListener;
    /**
     * Initialize loading of the 2D ratio and histograms for the given time points
     * @param items
     */
    private updateItems;
    /**
     * Request data for histogram
     * @param pair
     * @returns {Promise<IHistogramData>}
     */
    private requestDataHistogram;
    /**
     * Prepare the given 2D ratio data to visualize it with D3.
     * The algorithm considers only active change types and scales the given ratios to the width/height.
     * @param data
     * @returns {IPreparedRatio2DData[]}
     */
    private prepareRatioData;
    /**
     * Draw 2D ratio chart from given data
     * @param data
     */
    private show2DRatio;
    /**
     * Draw histogram from given data
     * @param $parent
     * @param data
     */
    private showHistogram;
    /**
     * This method draws the bars for histogram.
     * @param $parent
     * @param data
     */
    private drawBar;
    /**
     * Scale the width of histogram bars if they are active. Otherwise set to 0.
     */
    private scaleHistogramWidth;
    /**
     * Prepare histogram bar data
     * @param data
     * @param propertyName
     * @returns {IHistogramBarData[]}
     */
    private getBarData;
    /**
     * Clear the content and reset this view
     */
    private clearContent;
    /**
     * Factory method to create a new Histogram2D instance
     * @param parent
     * @param options
     * @returns {Histogram2D}
     */
    static create(parent: Element, options: any): Histogram2D;
}
