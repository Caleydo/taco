/**
 * Created by cniederer on 20.01.17.
 */
import { IAppView } from '../app/App';
export declare class DetailView implements IAppView {
    parent: Element;
    private options;
    private $node;
    constructor(parent: Element, options: any);
    /**
     * Initialize this view
     * @returns {Promise<DetailView>}
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
    private openEvents;
    /**
     * Fire events to load detail view based on the selected time points
     * @param selection
     */
    private loadDetailView;
    /**
     * Factory method to create a new DiffHeatMap instance
     * @param parent
     * @param options
     * @returns {DiffHeatMap}
     */
    static create(parent: Element, options: any): DetailView;
}
