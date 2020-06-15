import { IAppView } from '../app/App';
/**
 * Shows a timeline with all available data points for a selected data set
 */
export declare class MetaInfoBox implements IAppView {
    private options;
    private $node;
    private $leftMetaBox;
    private $rightMetaBox;
    private totalWidth;
    private boxHeight;
    private boxWidth;
    /**
     * @param parent element on which the infobox element is created
     * @param options optional options for the infobox element
     */
    constructor(parent: Element, options: any);
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<Timeline>}
     */
    init(): Promise<this>;
    /**
     * Attach event handler for broadcasted events
     */
    private attachListener;
    /**
     * Build the basic DOM elements like the svg graph and appends the tooltip div.
     */
    private build;
    /**
     * This method updates the graph and the timeline based on the window size and resizes the whole page.
     */
    private resize;
    /**
     * Show content for the given items in the left and right meta box
     * @param items
     */
    private updateItems;
    /**
     * Generate the HTML template for one metabox
     * @param item
     * @returns {string}
     */
    private generateHTML;
    /**
     * Clear the content and reset this view
     */
    private clearContent;
    /**
     * Factory method to create a new MetaInfoBox instance.
     * @param parent Element on which the MetaInfoBox is drawn
     * @param options Parameters for the instance (optional)
     * @returns {MetaInfoBox}
     */
    static create(parent: Element, options: any): MetaInfoBox;
}
