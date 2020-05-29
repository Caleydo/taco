/**
 * Created by Holger Stitz on 25.08.2016.
 */
/**
 * Interface for all TACO Views
 */
export interface IAppView {
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<IAppView>}
     */
    init(): Promise<IAppView>;
}
/**
 * The main class for the TACO app
 */
export declare class App implements IAppView {
    private $node;
    private views;
    constructor(parent: Element);
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<App>}
     */
    init(): Promise<this>;
    private attachListener;
    /**
     * Load and initialize all necessary views
     * @returns {Promise<App>}
     */
    private build;
    /**
     * Show or hide the application loading indicator
     * @param isBusy
     */
    setBusy(isBusy: any): void;
    /**
     * Factory method to create a new TACO instance
     * @param parent
     * @returns {App}
     */
    static create(parent: Element): App;
}
