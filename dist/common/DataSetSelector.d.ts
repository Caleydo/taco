/**
 * Created by Holger Stitz on 26.08.2016.
 */
import { IAppView } from '../app/App';
/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
export declare class DataSetSelector implements IAppView {
    private options;
    private $node;
    private $select;
    private trackedSelections;
    private onSelectionChanged;
    constructor(parent: Element, options: any);
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<DataSetSelector>}
     */
    init(): Promise<this>;
    /**
     * Build the basic DOM elements and binds the change function
     */
    private build;
    /**
     * Toggle tracking of selection of rows/columns/cells for the given dataset
     * @param matrix selected dataset
     */
    private trackSelections;
    /**
     * Update the URL hash based on the selections
     */
    private updateSelectionHash;
    /**
     * Restore the selections based on the URL hash
     */
    private restoreSelections;
    /**
     * Update the list of datasets and returns a promise
     * @returns {Promise<DataSetSelector>}
     */
    private update;
    /**
     * Factory method to create a new DataSetSelector instance
     * @param parent
     * @param options
     * @returns {DataSetSelector}
     */
    static create(parent: Element, options: any): DataSetSelector;
}
