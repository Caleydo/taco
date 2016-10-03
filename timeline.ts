/**
 * Created by Holger Stitz on 29.08.2016.
 */

import events = require('../caleydo_core/event');
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import {Language} from './language';

/**
 * Shows a timeline with all available data points for a selected data set
 */
class Timeline implements IAppView {

  private $node;

  constructor(parent:Element, private options:any) {
    this.$node = d3.select(parent).append('div').classed('timeline', true);
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
  private build() {
    // TODO build timeline using D3 of parts that doesn't change on update()
    this.$node.html(`
      <!--<h3>${Language.TIMELINE}</h3>-->
      <ul class="output"></ul>
      <div id="timeline"></div>
    `);


  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items) => this.updateItems(items));
  }

  /**
   * Handle the update for a selected dataset
   * @param items
   */
  private updateItems(items) {
    // TODO retrieve selected data set and update the timeline with it

    // set selection by default to first item
    var selected = (items.length > 0) ? items[0] : undefined;

    const $li = this.$node.select('ul.output').selectAll('li').data(items);

    $li.enter()
      .append('li')
      .append('a')
      .attr('href', '#');

    $li.select('a')
      .classed('active', (d) => d === selected)
      .text((d) => `${d.desc.name} (${d.dim[0]} x ${d.dim[1]})`)
      .on('click', function(d) {
        // prevents triggering the href
        (<MouseEvent>d3.event).preventDefault();

        // toggle the active CSS classes
        $li.select('a').classed('active', false);
        d3.select(this).classed('active', true);

        // dispatch selected dataset to other views
        events.fire(AppConstants.EVENT_DATASET_SELECTED, d);
      });

    $li.exit().remove();

    // initialize other views with the first item
    if(selected !== undefined) {
      events.fire(AppConstants.EVENT_DATASET_SELECTED, selected);
    }

    const w = 600;
    const h = 200;

    const xScale = d3.scale.linear()
      .domain([0, items.length])
      .range([0, w]);

    console.log(xScale(2));

    const timeline = d3.select('#timeline');

    if(timeline.select('svg').size() > 0) {
      timeline.select('svg').remove();
    }

    const svgtimeline = timeline.append('svg')
      .attr('width', w)
      .attr('height', h);

    const circleScale = d3.scale.linear()
      .domain([0, d3.max(items, (d:any) => d.dim[0]) ])
      .range([10, h/10]);

    console.log(d3.max(items, (d:any,i) => d.dim[i]));

    svgtimeline.selectAll('circle')
      .data(items)
      .enter()
      .append('circle')
      .attr('cy', 60)
      .attr('cx', (d:any,i) => xScale(i) + circleScale(d.dim[0]))
      .attr('r', (d:any,i) => circleScale(d.dim[0]))
      .on('click', function(d) {
        // prevents triggering the href
        (<MouseEvent>d3.event).preventDefault();

        // toggle the active CSS classes
        $li.select('a').classed('active', false);
        d3.select(this).classed('active', true).attr('fill', 'red');

        // dispatch selected dataset to other views
        events.fire(AppConstants.EVENT_DATASET_SELECTED, d);
      });

    svgtimeline.append('line')
      .style('stroke', 'black')
      .attr('x1', 0)
      .attr('y1', 60)
      .attr('x2', w)
      .attr('y2', 60);

  }

}

/**
 * Factory method to create a new Timeline instance
 * @param parent
 * @param options
 * @returns {Timeline}
 */
export function create(parent:Element, options:any) {
  return new Timeline(parent, options);
}
