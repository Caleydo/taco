/**
 * Created by Holger Stitz on 30.08.2016.
 */
import { IAppView } from '../app/App';
/**
 * Shows a simple heat map for a given data set.
 */
export declare class TacoHeatMap implements IAppView {
    private options;
    private $node;
    private matrix;
    private scaleFactor;
    private heatMapOptions;
    constructor(parent: Element, options: any);
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<HeatMap>}
     */
    init(): Promise<this>;
    /**
     * Attach event handler for broadcasted events
     */
    private attachListener;
    /**
     * Run update only if scaleFactor and matrix data is set
     */
    private checkAndUpdate;
    /**
     * Loads a Caleydo heat map visualization plugin and hands the given data set over for visualizing it
     * @param dataset
     * @param scaleFactor
     * @returns {Promise<HeatMap>}
     */
    private update;
    /**
     * Clear the content and reset this view
     */
    private clearContent;
    /**
     * Decided based on the number of rows and columns if and if yes, which labels should be shown for the heatmap
     * @param nrow
     * @param ncol
     * @returns {string}
     */
    static chooseLabel(nrow: number, ncol: number): string;
    /**
     * Factory method to create a new HeatMap instance
     * @param parent
     * @param options
     * @returns {TacoHeatMap}
     */
    static create(parent: Element, options: any): TacoHeatMap;
}
