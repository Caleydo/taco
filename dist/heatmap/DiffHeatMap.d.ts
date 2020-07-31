/**
 * Created by Christina Niederer on 12.01.2017.
 */
import { IAppView } from '../app/App';
import 'jquery-ui/ui/widgets/slider';
import 'jquery-ui/themes/base/all.css';
export interface IDiffRow {
    id: string;
    pos: number;
}
export interface IDiffData {
    /**
     * Information about the union table
     */
    union: {
        c_ids: number[];
        r_ids: number[];
        uc_ids: string[];
        ur_ids: string[];
    };
    /**
     * Structural changes
     */
    structure: {
        added_rows: IDiffRow[];
        added_cols: IDiffRow[];
        deleted_rows: IDiffRow[];
        deleted_cols: IDiffRow[];
    };
    /**
     * Content Changes
     */
    content: {
        cpos: number;
        rpos: number;
        row: string;
        col: string;
        diff_data: number;
    }[];
    /**
     * Reorder changes
     */
    reorder: {
        rows: IDiffReorderChange[];
        cols: IDiffReorderChange[];
    };
    /**
     * Merge changes
     * Not further used or specified
     */
    merge: {
        merged_cols: any[];
        merged_rows: any[];
        split_cols: any[];
        split_rows: any[];
    };
}
export interface IDiffReorderChange {
    to: number;
    from: number;
    id: string;
    diff: number;
}
/**
 * Shows a simple heat map for a given data set.
 */
export declare class DiffHeatMap implements IAppView {
    parent: Element;
    private options;
    private $node;
    private data;
    private selectedTables;
    private readonly contentScale;
    private margin;
    /**
     * The height that should be used, if the height of the container is 0
     * @type {number}
     */
    private minimumHeight;
    private scaleFactor;
    private selectionListener;
    private activeChangeTypes;
    private static getJSON;
    constructor(parent: Element, options: any);
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<HeatMap>}
     */
    init(): Promise<this>;
    /**
     * Build DOM node
     */
    private build;
    /**
     * Attach event handler for broadcasted events
     */
    private attachListener;
    /**
     * Toggle a given change type and update the view
     * @param changeType
     */
    private toggleChangeType;
    private getProductIDType;
    /**
     * Draw the diff heatmap on the given diff data
     * @param data
     */
    private drawDiffHeatmap;
    /**
     * Update the title attribute to show an updated tooltip
     * @param $root
     * @param data
     * @param scaleFactorX
     * @param scaleFactorY
     */
    private handleTooltip;
    /**
     * Update the view with the updated data
     */
    private update;
    /**
     * Render the canvas
     * @param canvas
     * @param data
     */
    private render;
    /**
     * Render the selections to the canvas
     * @param ctx
     * @param data
     */
    private renderSelections;
    /**
     * Draw a legend for the content changes
     * @param data
     */
    private drawLegend;
    /**
     * Clear the content and reset this view
     */
    private clearContent;
    /**
     * Factory method to create a new DiffHeatMap instance
     * @param parent
     * @param options
     * @returns {DiffHeatMap}
     */
    static create(parent: Element, options: any): DiffHeatMap;
}
