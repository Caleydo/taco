/**
 * Created by Holger Stitz on 29.08.2016.
 */
import { IAppView } from '../app/App';
/**
 * Shows a timeline with all available data points for a selected data set
 */
export declare class Timeline implements IAppView {
    private options;
    private $node;
    private $svgTimeline;
    private items;
    private totalWidth;
    private timelineWidth;
    private timelineHeight;
    private toggledElements;
    private isClicked;
    /**
     * Constructor method for the Timeline class which creates the timeline on the given parent element.
     * Including eventual options if supplied.
     * @param parent element on which the timeline element is created
     * @param options optional options for the timeline element
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
     * This method handles the update for a new dataset or changed dataset.
     * @param items The new items which should be displayed.
     */
    private updateItems;
    /**
     * This method draws the timeline and also adds the circles.
     * It also handles the click and mouseover events for showing further context.
     */
    private drawTimeline;
    /**
     * Update the x-axis representation based on the items and width
     * @param $node
     */
    private updateTimelineAxis;
    /**
     * Factory method to create a new Timeline instance.
     * @param parent Element on which the timeline is drawn
     * @param options Parameters for the instance (optional)
     * @returns {Timeline}
     */
    static create(parent: Element, options: any): Timeline;
}
