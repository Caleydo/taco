/**
 * Created by Holger Stitz on 22.03.2017.
 */
import * as d3 from 'd3';
import { GlobalEventHandler, AppContext } from 'phovea_core';
import { AppConstants, ChangeTypes } from '../app/AppConstants';
import { BaseUtils } from 'phovea_core';
import { ProductIDType } from 'phovea_core';
export var EOrientation;
(function (EOrientation) {
    EOrientation[EOrientation["COLUMN"] = 0] = "COLUMN";
    EOrientation[EOrientation["ROW"] = 1] = "ROW";
})(EOrientation || (EOrientation = {}));
export class ReorderView {
    constructor(parent, options) {
        this.parent = parent;
        this.options = {
            orientation: EOrientation.ROW
        };
        this.slopeWidth = 30;
        this.scale = d3.scale.linear().range([0, 200]);
        this.selectionListener = (evt) => this.selectLine();
        this.options = BaseUtils.mixin(this.options, options);
        this.$node = d3.select(parent)
            .append('svg')
            .classed('reorderView', true)
            .classed('fadeout', !ChangeTypes.REORDER.isActive);
    }
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<ReorderView>}
     */
    init() {
        this.build();
        this.attachListener();
        // return the promise directly as long there is no dynamical data to update
        return Promise.resolve(this);
    }
    /**
     * Build the basic DOM elements like the svg graph.
     */
    build() {
        this.$srcSlopes = this.$node.append('g').classed('src slopes', true);
        this.$dstSlopes = this.$node.append('g').classed('dst slopes', true);
    }
    buildRenderToggle() {
        if (this.$reorderToggle) {
            return;
        }
        this.$reorderToggle = d3.select(this.parent)
            .append('div')
            .classed('reorderToggle', true)
            .classed('fadeout', !ChangeTypes.REORDER.isActive);
        const $button = this.$reorderToggle.append('button')
            .attr('class', 'btn btn-sm btn-default')
            .text('Focus on Reorder')
            .on('click', () => {
            const isActive = !$button.classed('active');
            $button.classed('active', isActive);
            GlobalEventHandler.getInstance().fire(AppConstants.EVENT_FOCUS_ON_REORDER, isActive);
        });
    }
    deactivateAndHideReorderToggle() {
        if (!this.$reorderToggle) {
            return;
        }
        this.$reorderToggle.classed('fadeout', true);
        this.$reorderToggle.select('button').classed('active', false);
        GlobalEventHandler.getInstance().fire(AppConstants.EVENT_FOCUS_ON_REORDER, false);
    }
    /**
     * Attach event handler for broadcasted events
     */
    attachListener() {
        AppContext.getInstance().onDOMNodeRemoved(this.$node.node(), () => {
            const old = this.getProductIDType();
            if (old) {
                old.off(ProductIDType.EVENT_SELECT_PRODUCT, this.selectionListener);
            }
        });
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
            this.clearContent();
        });
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_TIME_POINTS_SELECTED, () => {
            this.clearContent();
        });
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_DIFF_HEATMAP_LOADED, (evt, pair, diffData, scaleFactor) => {
            if (pair.length === 2) {
                this.data = diffData;
                this.selectedTables = pair;
                const idType = this.getProductIDType();
                if (idType) {
                    idType.on(ProductIDType.EVENT_SELECT_PRODUCT, this.selectionListener);
                }
                this.draw(pair[0], pair[1], diffData, scaleFactor);
                this.buildRenderToggle();
                // show reorder toogle (without activating it again)
                if (ChangeTypes.REORDER.isActive) {
                    this.$reorderToggle.classed('fadeout', false);
                }
            }
        });
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType) => {
            if (changeType === ChangeTypes.REORDER) {
                this.$node.classed('fadeout', !changeType.isActive);
                this.$reorderToggle.classed('fadeout', false); // show reorder toogle (without activating it again)
            }
        });
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType) => {
            if (changeType === ChangeTypes.REORDER) {
                this.$node.classed('fadeout', !changeType.isActive);
                this.deactivateAndHideReorderToggle();
            }
        });
        let xPosBak = '0';
        GlobalEventHandler.getInstance().on(AppConstants.EVENT_FOCUS_ON_REORDER, (evt, isActive) => {
            const $slopes = this.$srcSlopes.selectAll('.slope');
            const $axis = this.$srcSlopes.select('.axis');
            if (isActive) {
                xPosBak = $slopes.attr('x2');
                $slopes
                    .transition().duration(200)
                    .attr('x2', this.$node.property('clientWidth'));
                $axis
                    .transition().duration(200)
                    .attr('x1', this.$node.property('clientWidth'))
                    .attr('x2', this.$node.property('clientWidth'));
            }
            else {
                $slopes
                    .transition().duration(200)
                    .attr('x2', xPosBak);
                $axis
                    .transition().duration(200)
                    .attr('x1', xPosBak)
                    .attr('x2', xPosBak);
            }
        });
    }
    /**
     * Draw the reorder view based on the given orientation in the view options
     * @param src
     * @param dst
     * @param diffData
     * @param scaleFactor
     */
    draw(src, dst, diffData, scaleFactor) {
        switch (this.options.orientation) {
            case EOrientation.COLUMN:
                this.scale.domain([0, Math.max(src.desc.size[1], dst.desc.size[1])]);
                this.scale.range([0, Math.max(src.desc.size[1], dst.desc.size[1]) * AppConstants.HEATMAP_CELL_SIZE * scaleFactor.x]);
                this.drawColumns(this.$srcSlopes, diffData.reorder.cols, scaleFactor.x);
                this.drawColumns(this.$dstSlopes, diffData.reorder.cols, scaleFactor.x);
                break;
            case EOrientation.ROW:
                this.scale.domain([0, Math.max(src.desc.size[0], dst.desc.size[0])]);
                this.scale.range([0, Math.max(src.desc.size[0], dst.desc.size[0]) * AppConstants.HEATMAP_CELL_SIZE * scaleFactor.y]);
                this.drawRows(this.$srcSlopes, diffData.reorder.rows, scaleFactor.y);
                // draw axis line for destination table
                this.$srcSlopes
                    .append('line')
                    .classed('axis', true)
                    .attr('x1', this.slopeWidth)
                    .attr('x2', this.slopeWidth)
                    .attr('y1', 0)
                    .attr('y2', dst.desc.size[0] * AppConstants.HEATMAP_CELL_SIZE * scaleFactor.y);
                this.drawRows(this.$dstSlopes, diffData.reorder.rows, scaleFactor.y);
                // draw axis line for source table
                this.$dstSlopes
                    .attr('transform', `translate(${this.$node.property('clientWidth') - this.slopeWidth}, 0)`)
                    .append('line')
                    .classed('axis', true)
                    .attr('x1', 0)
                    .attr('x2', 0)
                    .attr('y1', 0)
                    .attr('y2', src.desc.size[0] * AppConstants.HEATMAP_CELL_SIZE * scaleFactor.y);
                break;
        }
    }
    /**
     * Draw reorder view in column direction
     * @param reorders
     * @param scaleFactor
     */
    drawColumns($parent, reorders, scaleFactor) {
        throw new Error('Drawing reorder view in column direction is not implemented yet!');
    }
    /**
     * Draw reorder view in row direction
     * @param reorders
     * @param scaleFactor
     */
    drawRows($parent, reorders, scaleFactor) {
        this.$node.attr('height', this.scale.range()[1]);
        const $slopes = $parent.selectAll('line.slope').data(reorders, (d) => d.id);
        $slopes.enter().append('line').classed('slope', true);
        const centerShift = (AppConstants.HEATMAP_CELL_SIZE * scaleFactor * 0.5);
        $slopes
            .on('mouseenter', (d) => {
            this.markLine(d.id, true);
        })
            .on('mouseleave', (d) => {
            this.markLine(d.id, false);
        })
            .attr('title', (d) => `${d.id}: ${d.diff} (src: ${d.from}, dest: ${d.to})`)
            .transition()
            .attr('x1', 0)
            .attr('x2', this.slopeWidth)
            .attr('y1', (d) => this.scale(d.from) + centerShift)
            .attr('y2', (d) => this.scale(d.to) + centerShift);
        $slopes.exit().remove();
    }
    /**
     * Mark a line with a given id and CSS class
     * @param id
     * @param isActive
     * @param cssClass
     */
    markLine(id, isActive, cssClass = 'hovered') {
        this.$srcSlopes.selectAll('line.slope')
            .each(function (d) {
            if (d.id === id) {
                d3.select(this).classed(cssClass, isActive);
            }
        });
        this.$dstSlopes.selectAll('line.slope')
            .each(function (d) {
            if (d.id === id) {
                d3.select(this).classed(cssClass, isActive);
            }
        });
    }
    /**
     * Get selections from phovea product IDType
     * @returns {any}
     */
    getProductIDType() {
        if (this.selectedTables) {
            return this.selectedTables[0].producttype;
        }
        return null;
    }
    /**
     * Select one reorder line
     */
    selectLine() {
        const cssClass = 'selected';
        const selections = this.selectedTables[0].producttype.productSelections();
        this.$srcSlopes.selectAll('line.slope').classed(cssClass, false);
        this.$dstSlopes.selectAll('line.slope').classed(cssClass, false);
        const rowLookup = new Map();
        this.data.union.r_ids.map((d, i) => rowLookup.set(d, i));
        const colLookup = new Map();
        this.data.union.c_ids.map((d, i) => colLookup.set(d, i));
        selections.forEach((cell) => {
            if (cell.isUnbound) {
                const rowIds = cell.dim(0);
                const colIds = cell.dim(1);
                // highlight cells
                if (rowIds.isUnbound && colIds.isUnbound) {
                    // just support all for now
                    // highlight cols
                }
                else if (rowIds.isUnbound) {
                    //colIds.forEach((colId) => {
                    //  const col = colLookup.get(colId);
                    //});
                    // highlight rows
                }
                else if (colIds.isUnbound) {
                    rowIds.forEach((rowId) => {
                        const row = rowLookup.get(rowId);
                        this.markLine(this.data.union.ur_ids[row], true, cssClass);
                    });
                }
            }
        });
    }
    /**
     * Clear the content and reset this view
     */
    clearContent() {
        this.$srcSlopes.selectAll('*').remove();
        this.$dstSlopes.selectAll('*').remove();
        this.deactivateAndHideReorderToggle();
    }
    /**
     * Factory method to create a new ReorderView instance
     * @param parent
     * @param options
     * @returns {ReorderView}
     */
    static create(parent, options) {
        return new ReorderView(parent, options);
    }
}
//# sourceMappingURL=ReorderView.js.map