/**
 * Created by Holger Stitz on 30.08.2016.
 */
import { VisUtils } from 'phovea_core';
import { GlobalEventHandler } from 'phovea_core';
import * as d3 from 'd3';
import { AppConstants } from '../app/AppConstants';
import { BaseUtils } from 'phovea_core';
/**
 * Shows a simple heat map for a given data set.
 */
export class TacoHeatMap {
    constructor(parent, options) {
        this.options = options;
        this.heatMapOptions = {
            initialScale: AppConstants.HEATMAP_CELL_SIZE,
            color: ['black', 'white', 'black'],
            domain: [-1, 0, 1]
        };
        this.$node = d3.select(parent)
            .append('div')
            .classed('heatmap', true)
            .classed(options.cssClass, true);
    }
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<HeatMap>}
     */
    init() {
        this.attachListener();
        // return the promise directly as long there is no dynamical data to update
        return Promise.resolve(this);
    }
    /**
     * Attach event handler for broadcasted events
     */
    attachListener() {
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
            this.clearContent();
        });
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_TIME_POINTS_SELECTED, () => {
            this.clearContent();
        });
        GlobalEventHandler.getInstance().on(this.options.eventName, (evt, dataset) => {
            this.matrix = dataset;
            this.checkAndUpdate();
        });
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_DIFF_HEATMAP_LOADED, (evt, pair, diffData, scaleFactor) => {
            this.scaleFactor = scaleFactor;
            this.checkAndUpdate();
        });
    }
    /**
     * Run update only if scaleFactor and matrix data is set
     */
    checkAndUpdate() {
        if (this.matrix && this.scaleFactor) {
            this.update(this.matrix, this.scaleFactor);
        }
    }
    /**
     * Loads a Caleydo heat map visualization plugin and hands the given data set over for visualizing it
     * @param dataset
     * @param scaleFactor
     * @returns {Promise<HeatMap>}
     */
    update(dataset, scaleFactor) {
        if (dataset.desc.type !== 'matrix') {
            console.warn(`Data set is not of type matrix and cannot be visualized from heat map plugin`);
            return;
        }
        //console.log('DATASET', dataset);
        const plugins = VisUtils.listVisPlugins(dataset).filter((d) => /.*heatmap.*/.test(d.id));
        if (plugins.length === 0) {
            console.warn(`Heat map visualization plugin not found`);
            return;
        }
        const showLabels = TacoHeatMap.chooseLabel(dataset.nrow, dataset.ncol);
        const scale = [this.heatMapOptions.initialScale * scaleFactor.x, this.heatMapOptions.initialScale * scaleFactor.y];
        switch (showLabels) {
            case 'CELL':
                d3.select(this.$node.node().parentElement).classed('heatmap-has-column-labels', true);
                this.$node.classed('heatmap-row-labels', true).classed('heatmap-column-labels', true);
                scale[0] -= 0.65; // decrease width of heat map to show row labels TODO make it flexible based on the longest label
                break;
            case 'ROW':
                this.$node.classed('heatmap-row-labels', true);
                scale[0] -= 0.65; // decrease width of heat map to show row labels TODO make it flexible based on the longest label
                break;
            case 'COLUMN':
                d3.select(this.$node.node().parentElement).classed('column-labels', true);
                this.$node.classed('heatmap-column-labels', true);
                break;
        }
        const maxRangeValue = Math.max(...dataset.valuetype.range.map((d) => Math.abs(d)));
        const options = BaseUtils.mixin({}, this.heatMapOptions, {
            scale,
            labels: showLabels,
            domain: [-maxRangeValue, 0, maxRangeValue]
        });
        this.$node.classed('loading', true);
        return Promise.all([plugins[0].load()])
            .then((args) => {
            this.clearContent();
            // console.log('args from plugins', args);
            const plugin = args[0];
            // console.log('const plugin- args', plugin);
            plugin.factory(dataset, this.$node.node(), options);
            return this;
        })
            .then((instance) => {
            this.$node.classed('loading', false);
            GlobalEventHandler.getInstance().fire(AppConstants.EVENT_HEATMAP_LOADED);
            return instance;
        });
    }
    /**
     * Clear the content and reset this view
     */
    clearContent() {
        this.$node.html('');
    }
    /**
     * Decided based on the number of rows and columns if and if yes, which labels should be shown for the heatmap
     * @param nrow
     * @param ncol
     * @returns {string}
     */
    static chooseLabel(nrow, ncol) {
        if (nrow < AppConstants.MAXIMAL_HEATMAP_LABEL_SIZE && ncol < AppConstants.MAXIMAL_HEATMAP_LABEL_SIZE) {
            return 'CELL';
        }
        if (nrow < AppConstants.MAXIMAL_HEATMAP_LABEL_SIZE) {
            return 'ROW';
        }
        if (ncol < AppConstants.MAXIMAL_HEATMAP_LABEL_SIZE) {
            return 'COLUMN';
        }
        return 'NONE';
    }
    /**
     * Factory method to create a new HeatMap instance
     * @param parent
     * @param options
     * @returns {TacoHeatMap}
     */
    static create(parent, options) {
        return new TacoHeatMap(parent, options);
    }
}
//# sourceMappingURL=TacoHeatMap.js.map