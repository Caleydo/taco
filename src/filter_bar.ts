/**
 * Created by Holger Stitz on 19.12.2016.
 */

import * as events from 'phovea_core/src/event';
import {AppConstants, ChangeTypes} from './app_constants';
import {IAppView} from './app';
import * as d3 from 'd3';

/**
 * Shows a bar with buttons to filter other views
 */
class FilterBar implements IAppView {

  private $node;

  constructor(parent: Element, private options: any) {
    this.$node = d3.select('.navbar-header')
      .append('div')
      .classed('filter_bar', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<FilterBar>}
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
  private build() {

    this.$node.html(`<div id="nav-bar">
      <div class="btn-group change" role="group" aria-label="Toggle visibility of changes by type">
      </div>
    </div>`);

    const $buttons = this.$node.select('.btn-group.change')
      .selectAll('button').data(ChangeTypes.TYPE_ARRAY);

    $buttons.enter().append('button')
      .attr('type', 'button')
      .attr('class', (d) => (d.isActive) ? 'btn btn-default active' : 'btn btn-default inactive')
      .attr('id', (d) => `btn-${d.type}`)
      .text((d) => d.label);

  }

  /**
   * Attach listener to change type buttons
   */
  private attachListener() {
    this.$node.selectAll('.btn-group.change button')
      .on('click', function (selectedType) {
        const button = d3.select(this);

        if (button.classed('active')) {
          selectedType.isActive = false;
          events.fire(AppConstants.EVENT_HIDE_CHANGE, selectedType);
          ChangeTypes.updateFilterHash();
          button
            .classed('active', false)
            .classed('inactive', true);

        } else {
          selectedType.isActive = true;
          events.fire(AppConstants.EVENT_SHOW_CHANGE, selectedType);
          ChangeTypes.updateFilterHash();
          button
            .classed('active', true)
            .classed('inactive', false);
        }
      });
  }

}

/**
 * Factory method to create a new Histogram2D instance
 * @param parent
 * @param options
 * @returns {FilterBar}
 */
export function create(parent: Element, options: any) {
  return new FilterBar(parent, options);
}
