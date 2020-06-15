/**
 * Created by Holger Stitz on 19.12.2016.
 */
import { IAppView } from '../app/App';
/**
 * Shows a bar with buttons to filter other views
 */
export declare class FilterBar implements IAppView {
    private options;
    private $node;
    constructor(parent: Element, options: any);
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<FilterBar>}
     */
    init(): Promise<this>;
    /**
     * Build the basic DOM elements and binds the change function
     */
    private build;
    /**
     * Attach listener to change type buttons
     */
    private attachListener;
    /**
     * Factory method to create a new Histogram2D instance
     * @param parent
     * @param options
     * @returns {FilterBar}
     */
    static create(parent: Element, options: any): FilterBar;
}
