/**
 * Created by Holger Stitz on 22.03.2017.
 */
import { IAppView } from '../app/App';
export declare enum EOrientation {
    COLUMN = 0,
    ROW = 1
}
export declare class ReorderView implements IAppView {
    parent: Element;
    private $node;
    private $srcSlopes;
    private $dstSlopes;
    private $reorderToggle;
    private data;
    private selectedTables;
    private options;
    private slopeWidth;
    private scale;
    private selectionListener;
    constructor(parent: Element, options: any);
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<ReorderView>}
     */
    init(): Promise<this>;
    /**
     * Build the basic DOM elements like the svg graph.
     */
    private build;
    private buildRenderToggle;
    private deactivateAndHideReorderToggle;
    /**
     * Attach event handler for broadcasted events
     */
    private attachListener;
    /**
     * Draw the reorder view based on the given orientation in the view options
     * @param src
     * @param dst
     * @param diffData
     * @param scaleFactor
     */
    private draw;
    /**
     * Draw reorder view in column direction
     * @param reorders
     * @param scaleFactor
     */
    private drawColumns;
    /**
     * Draw reorder view in row direction
     * @param reorders
     * @param scaleFactor
     */
    private drawRows;
    /**
     * Mark a line with a given id and CSS class
     * @param id
     * @param isActive
     * @param cssClass
     */
    private markLine;
    /**
     * Get selections from phovea product IDType
     * @returns {any}
     */
    private getProductIDType;
    /**
     * Select one reorder line
     */
    private selectLine;
    /**
     * Clear the content and reset this view
     */
    private clearContent;
    /**
     * Factory method to create a new ReorderView instance
     * @param parent
     * @param options
     * @returns {ReorderView}
     */
    static create(parent: Element, options: any): ReorderView;
}
