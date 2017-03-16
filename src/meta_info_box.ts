/**
 * Created by Holger Stitz on 14.03.2017.
 */
import * as d3 from 'd3';
import * as $ from 'jquery';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import {getTimeScale} from './util';
import {get} from 'phovea_core/src/plugin';

/**
 * Shows a timeline with all available data points for a selected data set
 */
class MetaInfoBox implements IAppView {

  private $node;
  private $leftMetaBox;
  private $rightMetaBox;

  private totalWidth: number;
  private boxHeight = 162;
  private boxWidth = 162;


  /**
   * @param parent element on which the infobox element is created
   * @param options optional options for the infobox element
   */
  constructor(parent: Element, private options: any) {
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
  private attachListener() {
    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', () => this.resize());

    events.on(AppConstants.EVENT_TIME_POINTS_SELECTED, (evt, items) => {
      if(items.length === 2) {
        this.updateItems(items);
      } else {
        this.clearContent();
      }
    });

    events.on(AppConstants.EVENT_DATASET_SELECTED, (evt, items) => {
      this.clearContent();
    });
  }

  /**
   * Build the basic DOM elements like the svg graph and appends the tooltip div.
   */
  private build() {
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
    get(AppConstants.VIEW, 'Histogram2D')
      .load()
      .then((plugin) => {
        const view = plugin.factory(
          this.$node.node(), // parent node
          {} // options
        );
        return view.init();
      });
  }

  /**
   * This method updates the graph and the timeline based on the window size and resizes the whole page.
   */
  private resize() {
    this.totalWidth = $(this.$node.node()).width();
  }

  private updateItems(items) {
    this.$leftMetaBox.html(this.generateHTML(items[0]));
    this.$rightMetaBox.html(this.generateHTML(items[1]));
  }

  private generateHTML(item) {
    return `
      <h3>${item.time.format(item.timeFormat.moment)}</h3>
      <dl>
        <dt>Rows</dt>
        <dd>${item.item.dim[0]} ${(item.item.dim[0] === 1) ? item.item.rowtype.name : item.item.rowtype.names}</dd>
        <dt>Columns</dt>
        <dd>${item.item.dim[1]} ${(item.item.dim[1] === 1) ? item.item.coltype.name : item.item.coltype.names}</dd>
      </dl>
    `;
  }

  private clearContent() {
    this.$leftMetaBox.html('');
    this.$rightMetaBox.html('');
  }
}

/**
 * Factory method to create a new MetaInfoBox instance.
 * @param parent Element on which the MetaInfoBox is drawn
 * @param options Parameters for the instance (optional)
 * @returns {MetaInfoBox}
 */
export function create(parent: Element, options: any) {
  return new MetaInfoBox(parent, options);
}
