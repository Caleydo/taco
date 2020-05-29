/**
 * Created by Christina Niederer on 12.01.2017.
 */
import * as d3 from 'd3';
import { EventHandler } from 'phovea_core';
import { AppContext } from 'phovea_core';
import { SelectionUtils, ProductIDType } from 'phovea_core';
import { Range } from 'phovea_core';
import { AppConstants, ChangeTypes, DiffColors } from '../app/AppConstants';
import { PluginRegistry } from 'phovea_core';
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/slider'; // specify the widget here
import 'jquery-ui/themes/base/all.css'; // import base style for all widgets
/**
 * Shows a simple heat map for a given data set.
 */
class DiffHeatMap {
    constructor(parent, options) {
        this.parent = parent;
        this.options = options;
        this.contentScale = d3.scale.linear()
            .domain([-1, 0, 1])
            .range([DiffColors.COLOR_CONTENT_NEGATIVE, DiffColors.COLOR_NO_CHANGE, DiffColors.COLOR_CONTENT_POSITIVE])
            .clamp(true);
        this.margin = 2 * 50;
        /**
         * The height that should be used, if the height of the container is 0
         * @type {number}
         */
        this.minimumHeight = 300;
        this.scaleFactor = { x: 1, y: 1 };
        this.selectionListener = (evt) => this.update();
        this.activeChangeTypes = new Set(ChangeTypes.TYPE_ARRAY.filter((d) => d.isActive).map((d) => d.type));
        this.$node = d3.select(parent)
            .append('div')
            .classed('diffheatmap', true);
    }
    static getJSON(pair) {
        const operations = ChangeTypes.forURL();
        return AppContext.getInstance().getAPIJSON(`/taco/compare/${pair[0]}/${pair[1]}/${operations}/diff_heat_map`);
    }
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<HeatMap>}
     */
    init() {
        this.build();
        this.attachListener();
        // return the promise directly as long there is no dynamical data to update
        return Promise.resolve(this);
    }
    /**
     * Build DOM node
     */
    build() {
        // wrap view ids from package.json as plugin and load the necessary files
        PluginRegistry.getInstance().getPlugin(AppConstants.VIEW, 'ReorderView')
            .load()
            .then((plugin) => {
            const view = plugin.factory(this.$node.node(), // parent node
            {} // options
            );
            return view.init();
        });
    }
    /**
     * Attach event handler for broadcasted events
     */
    attachListener() {
        EventHandler.getInstance().on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, () => {
            this.clearContent();
        });
        EventHandler.getInstance().on(AppConstants.EVENT_TIME_POINTS_SELECTED, () => {
            this.clearContent();
        });
        AppContext.getInstance().onDOMNodeRemoved(this.$node.node(), () => {
            const old = this.getProductIDType();
            if (old) {
                old.off(ProductIDType.EVENT_SELECT_PRODUCT, this.selectionListener);
            }
        });
        //attach event listener
        EventHandler.getInstance().on(AppConstants.EVENT_OPEN_DIFF_HEATMAP, (evt, items) => {
            if (items.length !== 2) {
                return;
            }
            // cleanup
            const old = this.getProductIDType();
            if (old) {
                old.off(ProductIDType.EVENT_SELECT_PRODUCT, this.selectionListener);
            }
            this.$node.selectAll('canvas').remove();
            const idsSelectedTable = items.map((d) => d.desc.id);
            DiffHeatMap.getJSON(idsSelectedTable)
                .then((data) => {
                d3.select(this.$node.node().parentElement).classed('heatmap-has-column-labels', false);
                this.data = data;
                this.selectedTables = items;
                const idType = this.getProductIDType();
                if (idType) {
                    idType.on(ProductIDType.EVENT_SELECT_PRODUCT, this.selectionListener);
                }
                this.drawDiffHeatmap(this.data);
                EventHandler.getInstance().fire(AppConstants.EVENT_DIFF_HEATMAP_LOADED, this.selectedTables, this.data, this.scaleFactor);
            });
        });
        EventHandler.getInstance().on(AppConstants.EVENT_SHOW_CHANGE, (evt, changeType) => this.toggleChangeType(changeType));
        EventHandler.getInstance().on(AppConstants.EVENT_HIDE_CHANGE, (evt, changeType) => this.toggleChangeType(changeType));
        EventHandler.getInstance().on(AppConstants.EVENT_RESIZE, () => {
            if (this.data) {
                this.drawDiffHeatmap(this.data);
                EventHandler.getInstance().fire(AppConstants.EVENT_DIFF_HEATMAP_LOADED, this.selectedTables, this.data, this.scaleFactor);
            }
        });
        EventHandler.getInstance().on(AppConstants.EVENT_FOCUS_ON_REORDER, (evt, isActive) => {
            this.$node.classed('focusOnReorder', isActive);
        });
    }
    /**
     * Toggle a given change type and update the view
     * @param changeType
     */
    toggleChangeType(changeType) {
        if (!this.data) {
            return;
        }
        if (changeType === ChangeTypes.CONTENT) {
            this.$node.select('div.legend').classed('hidden', !changeType.isActive);
        }
        if (changeType.isActive) {
            this.activeChangeTypes.add(changeType.type);
        }
        else {
            this.activeChangeTypes.delete(changeType.type);
        }
        this.update();
    }
    getProductIDType() {
        if (this.selectedTables) {
            return this.selectedTables[0].producttype;
        }
        return null;
    }
    /**
     * Draw the diff heatmap on the given diff data
     * @param data
     */
    drawDiffHeatmap(data) {
        this.drawLegend(data);
        const dataWidth = AppConstants.HEATMAP_CELL_SIZE * data.union.uc_ids.length;
        const dataHeight = AppConstants.HEATMAP_CELL_SIZE * data.union.ur_ids.length;
        this.scaleFactor.x = (this.$node.property('clientWidth') - this.margin) / dataWidth;
        this.scaleFactor.y = (Math.max(this.$node.property('clientHeight'), this.minimumHeight)) / dataHeight;
        const width = dataWidth * this.scaleFactor.x;
        const height = dataHeight * this.scaleFactor.y;
        let $root = this.$node.select('canvas.taco-table');
        if ($root.empty()) {
            $root = this.$node.append('canvas')
                .attr('class', 'taco-table');
        }
        $root
            .attr('width', width)
            .attr('height', height);
        this.handleTooltip($root, data, AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor.x, AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor.y);
        this.render($root.node(), data);
    }
    /**
     * Update the title attribute to show an updated tooltip
     * @param $root
     * @param data
     * @param scaleFactorX
     * @param scaleFactorY
     */
    handleTooltip($root, data, scaleFactorX, scaleFactorY) {
        const toIndices = (x, y) => {
            const col = Math.round(x / scaleFactorX + 0.5) - 1;
            const row = Math.round(y / scaleFactorY + 0.5) - 1;
            return { col, row };
        };
        const findValue = (col, row) => {
            if (data.structure) {
                // inverse order of rendering
                if (data.structure.deleted_cols.some((a) => a.pos === col)) {
                    return `column deleted`;
                }
                if (data.structure.deleted_rows.some((a) => a.pos === row)) {
                    return `row deleted`;
                }
                if (data.structure.added_cols.some((a) => a.pos === col)) {
                    return `column added`;
                }
                if (data.structure.added_rows.some((a) => a.pos === row)) {
                    return `row added`;
                }
            }
            if (data.content) {
                const item = data.content.find((d) => d.cpos === col && d.rpos === row);
                if (item) {
                    return 'content change: ' + item.diff_data;
                }
            }
            return 'no change';
        };
        const updateTooltip = (x, y) => {
            const { col, row } = toIndices(x, y);
            const rowName = data.union.ur_ids[row];
            const colName = data.union.uc_ids[col];
            $root.attr('title', `${rowName} / ${colName}: ${findValue(col, row)}`);
        };
        let timer = -1;
        $root.on('mousemove', () => {
            const evt = d3.event;
            clearTimeout(timer);
            timer = self.setTimeout(updateTooltip.bind(this, evt.offsetX, evt.offsetY), 100);
        }).on('mouseleave', () => {
            clearTimeout(timer);
            timer = -1;
        }).on('click', () => {
            const evt = d3.event;
            const { col, row } = toIndices(evt.offsetX, evt.offsetY);
            const colId = data.union.c_ids[col];
            const rowId = data.union.r_ids[row];
            const idType = this.getProductIDType();
            if (idType) {
                idType.select([Range.cell(rowId, colId)], SelectionUtils.toSelectOperation(evt));
            }
        });
    }
    /**
     * Update the view with the updated data
     */
    update() {
        this.render(this.$node.select('canvas').node(), this.data);
    }
    /**
     * Render the canvas
     * @param canvas
     * @param data
     */
    render(canvas, data) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        const totalWidth = AppConstants.HEATMAP_CELL_SIZE * data.union.uc_ids.length * this.scaleFactor.x;
        const totalHeight = AppConstants.HEATMAP_CELL_SIZE * data.union.ur_ids.length * this.scaleFactor.y;
        ctx.clearRect(0, 0, totalWidth, totalHeight);
        ctx.save();
        const scaleFactorX = AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor.x;
        const scaleFactorY = AppConstants.HEATMAP_CELL_SIZE * this.scaleFactor.y;
        let width = data.union.uc_ids.length;
        let height = data.union.ur_ids.length;
        // substract rows and cols for invisible change types
        if (this.activeChangeTypes.has(ChangeTypes.ADDED.type) === false) {
            width -= data.structure.added_cols.length;
        }
        if (this.activeChangeTypes.has(ChangeTypes.REMOVED.type) === false) {
            width -= data.structure.deleted_cols.length;
        }
        if (this.activeChangeTypes.has(ChangeTypes.ADDED.type) === false) {
            height -= data.structure.added_rows.length;
        }
        if (this.activeChangeTypes.has(ChangeTypes.REMOVED.type) === false) {
            height -= data.structure.deleted_rows.length;
        }
        // set new width and height as attr and style (for transition)
        d3.select(canvas)
            .attr('width', width * scaleFactorX)
            .attr('height', height * scaleFactorY)
            .style('width', width * scaleFactorX + 'px')
            .style('height', height * scaleFactorY + 'px');
        ctx.scale(scaleFactorX, scaleFactorY);
        const calcColPos = (pos) => {
            if (this.activeChangeTypes.has(ChangeTypes.ADDED.type) === false) {
                pos -= data.structure.added_cols.filter((d) => d.pos <= pos).length;
            }
            if (this.activeChangeTypes.has(ChangeTypes.REMOVED.type) === false) {
                pos -= data.structure.deleted_cols.filter((d) => d.pos <= pos).length;
            }
            return pos;
        };
        const calcRowPos = (pos) => {
            if (this.activeChangeTypes.has(ChangeTypes.ADDED.type) === false) {
                pos -= data.structure.added_rows.filter((d) => d.pos <= pos).length;
            }
            if (this.activeChangeTypes.has(ChangeTypes.REMOVED.type) === false) {
                pos -= data.structure.deleted_rows.filter((d) => d.pos <= pos).length;
            }
            return pos;
        };
        const drawRows = (rows, style) => {
            ctx.beginPath();
            rows.forEach((row) => {
                if (row.pos >= 0) {
                    ctx.rect(0, calcRowPos(row.pos), width, 1);
                }
            });
            ctx.fillStyle = style;
            ctx.fill();
        };
        const drawCols = (cols, style) => {
            ctx.beginPath();
            cols.forEach((col) => {
                if (col.pos >= 0) {
                    ctx.rect(calcColPos(col.pos), 0, 1, height);
                }
            });
            ctx.fillStyle = style;
            ctx.fill();
        };
        if (data.structure) {
            if (this.activeChangeTypes.has(ChangeTypes.ADDED.type)) {
                drawRows(data.structure.added_rows, DiffColors.COLOR_ADDED);
                drawCols(data.structure.added_cols, DiffColors.COLOR_ADDED);
            }
            if (this.activeChangeTypes.has(ChangeTypes.REMOVED.type)) {
                drawRows(data.structure.deleted_rows, DiffColors.COLOR_DELETED);
                drawCols(data.structure.deleted_cols, DiffColors.COLOR_DELETED);
            }
        }
        if (data.content && this.activeChangeTypes.has(ChangeTypes.CONTENT.type)) {
            data.content.forEach((cell) => {
                ctx.fillStyle = this.contentScale(cell.diff_data);
                ctx.fillRect(calcColPos(cell.cpos), calcRowPos(cell.rpos), 1, 1);
            });
        }
        this.renderSelections(ctx, data);
        ctx.restore();
    }
    /**
     * Render the selections to the canvas
     * @param ctx
     * @param data
     */
    renderSelections(ctx, data) {
        const selections = this.selectedTables[0].producttype.productSelections();
        ctx.save();
        ctx.fillStyle = 'orange';
        if (selections.some((a) => a.isAll)) {
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
            return;
        }
        const rowLookup = new Map();
        data.union.r_ids.map((d, i) => rowLookup.set(d, i));
        const colLookup = new Map();
        data.union.c_ids.map((d, i) => colLookup.set(d, i));
        selections.forEach((cell) => {
            if (cell.isUnbound) {
                const rowIds = cell.dim(0);
                const colIds = cell.dim(1);
                if (rowIds.isUnbound && colIds.isUnbound) {
                    // just support all for now
                    ctx.fillRect(0, 0, data.union.c_ids.length, data.union.r_ids.length);
                }
                else if (rowIds.isUnbound) {
                    colIds.forEach((colId) => {
                        const col = colLookup.get(colId);
                        ctx.fillRect(col, 0, 1, data.union.r_ids.length);
                    });
                }
                else if (colIds.isUnbound) {
                    rowIds.forEach((rowId) => {
                        const row = rowLookup.get(rowId);
                        ctx.fillRect(0, row, data.union.c_ids.length, 1);
                    });
                }
            }
            cell.product((ids) => {
                const [i, j] = ids;
                const row = rowLookup.get(i);
                const col = colLookup.get(j);
                ctx.fillRect(col, row, 1, 1);
            }, [0, 0]);
        });
        ctx.restore();
    }
    /**
     * Draw a legend for the content changes
     * @param data
     */
    drawLegend(data) {
        let $legend = this.$node.select('div.legend');
        if ($legend.empty()) {
            $legend = this.$node.append('div')
                .classed('legend', true)
                .classed('hidden', !ChangeTypes.CONTENT.isActive);
            const values = d3.extent(this.contentScale.domain()); // only min-max value
            const $slider = $legend.append('div').classed('content-change', true);
            const $minVal = $slider.append('span').classed('handle-value min', true).text(values[0]);
            const $maxVal = $slider.append('span').classed('handle-value max', true).text(values[1]);
            $($slider.node()).slider({
                range: true,
                min: -1,
                max: 1,
                step: 0.01,
                values,
                slide: (event, ui) => {
                    this.contentScale.domain([ui.values[0], 0, ui.values[1]]); // note the `0` in the center for white
                    $minVal.text(ui.values[0]);
                    $maxVal.text(ui.values[1]);
                    this.update();
                }
            });
        }
    }
    /**
     * Clear the content and reset this view
     */
    clearContent() {
        this.data = null;
        this.$node.select('.taco-table').remove();
        this.$node.select('.legend').remove();
    }
    /**
     * Factory method to create a new DiffHeatMap instance
     * @param parent
     * @param options
     * @returns {DiffHeatMap}
     */
    static create(parent, options) {
        return new DiffHeatMap(parent, options);
    }
}
//# sourceMappingURL=DiffHeatMap.js.map