/**
 * Created by Holger Stitz on 14.03.2017.
 */
import * as d3 from 'd3';
import * as $ from 'jquery';
import { GlobalEventHandler, PluginRegistry } from 'phovea_core';
import { AppConstants } from '../app/AppConstants';
import { Language } from '../app/Language';
/**
 * Shows a timeline with all available data points for a selected data set
 */
export class MetaInfoBox {
    /**
     * @param parent element on which the infobox element is created
     * @param options optional options for the infobox element
     */
    constructor(parent, options) {
        this.options = options;
        this.boxHeight = 162;
        this.boxWidth = 162;
        this.$node = d3.select(parent).append('div').classed('meta_info_box', true);
    }
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<Timeline>}
     */
    init() {
        this.build();
        this.attachListener();
        // Return the promise directly as long there is no dynamical data to update
        return Promise.resolve(this);
    }
    /**
     * Attach event handler for broadcasted events
     */
    attachListener() {
        // Call the resize function whenever a resize event occurs
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_RESIZE, () => this.resize());
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
            this.clearContent();
        });
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_TIME_POINTS_SELECTED, (evt, items) => {
            if (items.length === 2) {
                this.updateItems(items);
            }
            else {
                this.clearContent();
            }
        });
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_DATASET_SELECTED, (evt, items) => {
            this.clearContent();
        });
    }
    /**
     * Build the basic DOM elements like the svg graph and appends the tooltip div.
     */
    build() {
        this.$leftMetaBox = this.$node
            .append('div')
            .classed('invisibleClass', true)
            .classed('leftMetaBox', true)
            .append('div')
            .style('width', this.boxWidth + 'px')
            .style('height', this.boxHeight + 'px');
        this.$rightMetaBox = this.$node
            .append('div')
            .classed('invisibleClass', true)
            .classed('rightMetaBox', true)
            .append('div')
            .style('width', this.boxWidth + 'px')
            .style('height', this.boxHeight + 'px');
        // wrap view ids from package.json as plugin and load the necessary files
        PluginRegistry.getInstance().getPlugin(AppConstants.VIEW, 'Histogram2D')
            .load()
            .then((plugin) => {
            const view = plugin.factory(this.$node.node(), // parent node
            {} // options
            );
            return view.init();
        });
    }
    /**
     * This method updates the graph and the timeline based on the window size and resizes the whole page.
     */
    resize() {
        this.totalWidth = $(this.$node.node()).width();
    }
    /**
     * Show content for the given items in the left and right meta box
     * @param items
     */
    updateItems(items) {
        this.$leftMetaBox.html(this.generateHTML(items[0]));
        this.$rightMetaBox.html(this.generateHTML(items[1]));
    }
    /**
     * Generate the HTML template for one metabox
     * @param item
     * @returns {string}
     */
    generateHTML(item) {
        return `
      <h3>${item.time.format(item.timeFormat.moment)}</h3>
      <dl>
        <dt>${Language.ROWS}</dt>
        <dd>${item.item.dim[0]} ${(item.item.dim[0] === 1) ? item.item.rowtype.name : item.item.rowtype.names}</dd>
        <dt>${Language.COLUMNS}</dt>
        <dd>${item.item.dim[1]} ${(item.item.dim[1] === 1) ? item.item.coltype.name : item.item.coltype.names}</dd>
      </dl>
    `;
    }
    /**
     * Clear the content and reset this view
     */
    clearContent() {
        this.$leftMetaBox.html('');
        this.$rightMetaBox.html('');
    }
    /**
     * Factory method to create a new MetaInfoBox instance.
     * @param parent Element on which the MetaInfoBox is drawn
     * @param options Parameters for the instance (optional)
     * @returns {MetaInfoBox}
     */
    static create(parent, options) {
        return new MetaInfoBox(parent, options);
    }
}
//# sourceMappingURL=MetaInfoBox.js.map