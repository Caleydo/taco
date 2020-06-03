/**
 * Created by Holger Stitz on 29.11.2016.
 */
import { GlobalEventHandler } from 'phovea_core';
import { AppContext } from 'phovea_core';
import { AppConstants, ChangeTypes } from '../app/AppConstants';
import * as d3 from 'd3';
/**
 * Shows a 2D ratio chart and histograms for row and column direction
 */
class Histogram2D {
    constructor(parent, options) {
        this.options = options;
        this.borderWidth = 2;
        this.height = 160 + this.borderWidth;
        this.width = 160 + this.borderWidth;
        this.x = d3.scale.linear().domain([0, 1]).range([0, this.width - this.borderWidth]);
        this.y = d3.scale.linear().domain([0, 1]).range([0, this.height - this.borderWidth]);
        this.widthRowHistogram = 60;
        this.histogramScale = d3.scale.linear()
            //.domain([0, d3.max(histodata)])
            .domain([0, 1])
            .range([0, this.widthRowHistogram]);
        this.$node = d3.select(parent)
            .append('div')
            .classed('invisibleClass', true)
            .classed('histogram_2d', true);
    }
    /**
     * Create AJAX call to load the 2D ratio data
     * @param pair
     * @returns {Promise<any>}
     */
    static getJSONRatio2D(pair) {
        const operations = ChangeTypes.forURL();
        return AppContext.getInstance().getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${operations}/ratio_2d`);
    }
    /**
     * Create AJAX call to load the histogram data
     * @param pair
     * @param binRows
     * @param binCols
     * @returns {Promise<any>}
     */
    static getJSONHistogram(pair, binRows, binCols) {
        const operations = ChangeTypes.forURL();
        return AppContext.getInstance().getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${binRows}/${binCols}/${operations}/histogram`);
    }
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<Timeline>}
     */
    init() {
        this.build();
        this.attachListener();
        // return the promise directly as long there is no dynamical data to update
        return Promise.resolve(this);
    }
    /**
     * Build the basic DOM elements and binds the change function
     */
    build() {
        this.$node
            .style('height', this.height + 'px');
        this.$ratio = this.$node
            .append('div')
            .style('width', this.width + 'px')
            .style('height', this.height + 'px')
            .classed('ratio2d', true);
        this.$histogramRows = this.$node
            .append('div')
            .style('width', this.widthRowHistogram + 'px')
            .style('height', this.height + 'px')
            .classed('histogram', true)
            .append('div')
            .classed('wrapper', true);
        this.$histogramCols = this.$node
            .append('div')
            .style('width', this.widthRowHistogram + 'px')
            .style('height', this.height + 'px')
            .classed('histogram', true)
            .classed('rotated', true)
            .append('div')
            .classed('wrapper', true);
    }
    /**
     * Attach event handler for broadcasted events
     */
    attachListener() {
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
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType) => {
            if (this.ratioData) {
                this.show2DRatio(this.ratioData);
                this.scaleHistogramWidth(); // just rescale the height of the bars
            }
        });
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType) => {
            if (this.ratioData) {
                this.show2DRatio(this.ratioData);
                this.scaleHistogramWidth(); // just rescale the height of the bars
            }
        });
    }
    /**
     * Initialize loading of the 2D ratio and histograms for the given time points
     * @param items
     */
    updateItems(items) {
        this.$ratio.classed('loading', true);
        this.$histogramRows.classed('loading', true);
        this.$histogramCols.classed('loading', true);
        const pair = [items[0].item.desc.id, items[1].item.desc.id];
        Histogram2D.getJSONRatio2D(pair)
            .then((data) => {
            this.ratioData = data;
            this.show2DRatio(data);
        });
        this.requestDataHistogram(pair)
            .then((histodata) => {
            this.showHistogram(this.$histogramRows, histodata.rows);
            this.showHistogram(this.$histogramCols, histodata.cols);
        });
    }
    /**
     * Request data for histogram
     * @param pair
     * @returns {Promise<IHistogramData>}
     */
    requestDataHistogram(pair) {
        // use width as number of bins => 1 bin = 1px
        return Histogram2D.getJSONHistogram(pair, this.widthRowHistogram, this.widthRowHistogram)
            .then((json) => json);
    }
    /**
     * Prepare the given 2D ratio data to visualize it with D3.
     * The algorithm considers only active change types and scales the given ratios to the width/height.
     * @param data
     * @returns {IPreparedRatio2DData[]}
     */
    prepareRatioData(data) {
        const cols = data.cols.ratios;
        const rows = data.rows.ratios;
        // custom order because of special width/height calucation of 2d ratio
        const orderOfChangeTypes = [ChangeTypes.NO_CHANGE, ChangeTypes.CONTENT, ChangeTypes.ADDED, ChangeTypes.REMOVED, ChangeTypes.REORDER];
        // consider and show only active change types
        const activeTypes = orderOfChangeTypes
            .filter((d) => d !== ChangeTypes.REORDER)
            .filter((d) => d.isActive === true);
        // calculate the row and col domain
        const rowDomain = activeTypes
            .map((ct) => rows[ct.ratioName])
            .reduce((a, b) => a + b, 0);
        const colDomain = activeTypes
            .map((ct) => cols[ct.ratioName])
            .reduce((a, b) => a + b, 0);
        const scaleRows = d3.scale.linear().domain([0, rowDomain]).range([0, 1]);
        const scaleCols = d3.scale.linear().domain([0, colDomain]).range([0, 1]);
        // reverse the order because of DOM stacking
        const reverseTypes = activeTypes.reverse();
        const rowRatios = reverseTypes.map((ct) => {
            return { ratio: rows[ct.ratioName], ct };
        });
        const colRatios = reverseTypes.map((ct) => {
            return { ratio: cols[ct.ratioName], ct };
        });
        const r = [];
        // calculate the ratio for each content type
        while (colRatios.length > 0) {
            const rowRatio = rowRatios.map((d) => scaleRows(d.ratio)).reduce((a, b) => a + b, 0);
            const colRatio = colRatios.map((d) => scaleCols(d.ratio)).reduce((a, b) => a + b, 0);
            // remove the first element
            const rowElem = rowRatios.shift();
            const colElem = colRatios.shift();
            r.push({
                ct: colElem.ct,
                rows: rowRatio,
                cols: colRatio,
                rows_text: Math.round((scaleRows(rowElem.ratio) * 100) * 100) / 100,
                cols_text: Math.round((scaleCols(colElem.ratio) * 100) * 100) / 100
            });
        }
        // add inactive values as 0 values
        orderOfChangeTypes
            .filter((d) => d !== ChangeTypes.REORDER)
            .filter((d) => d.isActive === false)
            .forEach((ct) => {
            r.push({
                ct,
                rows: 0,
                cols: 0,
                rows_text: 0,
                cols_text: 0
            });
        });
        return r;
    }
    /**
     * Draw 2D ratio chart from given data
     * @param data
     */
    show2DRatio(data) {
        const preparedData = this.prepareRatioData(data);
        const ratio2d = this.$ratio.selectAll('div').data(preparedData, (d) => d.ct.type);
        ratio2d.enter().append('div');
        ratio2d
            .attr('class', (d) => d.ct.type + '-color')
            .style('width', (d) => this.x(d.cols) + 'px')
            .style('height', (d) => this.y(d.rows) + 'px')
            .attr('title', (d) => ChangeTypes.labelForType(d.ct.type) + '\x0ARows: ' + d.rows_text + '%\x0AColumns: ' + d.cols_text + '%');
        ratio2d.exit().remove();
        this.$ratio.classed('loading', false);
    }
    /**
     * Draw histogram from given data
     * @param $parent
     * @param data
     */
    showHistogram($parent, data) {
        const that = this;
        const $containers = $parent.selectAll('div.bin-container')
            .data(data, (d) => d.id);
        $containers.enter().append('div')
            .classed('bin-container', true)
            .each(function (d) {
            that.drawBar(d3.select(this), d);
        });
        $containers.exit().remove();
        $parent.classed('loading', false);
    }
    /**
     * This method draws the bars for histogram.
     * @param $parent
     * @param data
     */
    drawBar($parent, data) {
        const barData = this.getBarData(data, 'ratioName');
        //const barData = this.getBarData(data.counts, 'countName');
        //individual bars in the bar group div
        const $bars = $parent.selectAll('div.bar').data(barData);
        $bars.enter().append('div');
        $bars
            .attr('class', (d) => `bar ${d.ct.type}-color`)
            //.style('height', this.heightBar + 'px')
            .style('height', '100%')
            .attr('title', (d) => `${ChangeTypes.labelForType(d.ct.type)}: ${Math.round((d.value * 100) * 100) / 100}% (${d.id})`);
        $bars.exit().remove();
        // move the reorder bar into the content change  element
        $parent.selectAll(`.bar.${ChangeTypes.REORDER.type}-color`)[0]
            .forEach((d) => {
            d.parentElement.querySelector(`.bar.${ChangeTypes.CONTENT.type}-color`).appendChild(d);
        });
        this.scaleHistogramWidth();
    }
    /**
     * Scale the width of histogram bars if they are active. Otherwise set to 0.
     */
    scaleHistogramWidth() {
        this.$node.selectAll('.bar')
            .style('width', (d) => {
            if (ChangeTypes.TYPE_ARRAY.filter((ct) => ct.type === d.ct.type)[0].isActive) {
                return this.histogramScale(d.value) + 'px';
            }
            return 0; // shrink bar to 0 if change is not active
        });
    }
    /**
     * Prepare histogram bar data
     * @param data
     * @param propertyName
     * @returns {IHistogramBarData[]}
     */
    getBarData(data, propertyName) {
        return ChangeTypes.TYPE_ARRAY
            //.filter((d) => d.isActive === true)
            .filter((d) => d !== ChangeTypes.NO_CHANGE)
            .map((ct) => {
            return {
                ct,
                id: data.id,
                pos: data.pos,
                value: data.ratios[ct[propertyName]] || 0
            };
        });
    }
    /**
     * Clear the content and reset this view
     */
    clearContent() {
        this.ratioData = null;
        this.$ratio.html('');
        this.$histogramCols.html('');
        this.$histogramRows.html('');
    }
    /**
     * Factory method to create a new Histogram2D instance
     * @param parent
     * @param options
     * @returns {Histogram2D}
     */
    static create(parent, options) {
        return new Histogram2D(parent, options);
    }
}
//# sourceMappingURL=Histogram2D.js.map