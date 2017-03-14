/**
 * Created by Holger Stitz on 29.08.2016.
 */

import * as moment from 'moment';
import * as d3 from 'd3';
import * as $ from 'jquery';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import {getPosXScale, scaleCircles, getTimeScale} from './util';

/**
 * Shows a timeline with all available data points for a selected data set
 */
class Timeline implements IAppView {

  private $node;
  private $svgTimeline;
  private $placeholder;
  private $leftMetaBox;
  private $rightMetaBox;

  private items;

  // Width of the timeline div element
  private totalWidth: number;
  private timelineWidth = $(window).innerWidth();
  private timelineHeight = 30;
  private toggledElements: boolean;
  private openHistogram2D;

  // Helper variable for the clicking event
  private isClicked: number = 0;


  //TODO: CHECK unused variables here!
  // helper variable for on click event
  //private open2dHistogram = null;
  //private colorScale = d3.scale.ordinal().range(['#D8zD8D8', '#67C4A7', '#8DA1CD', '#F08E65']);


  /**
   * Constructor method for the Timeline class which creates the timeline on the given parent element.
   * Including eventual options if supplied.
   * @param parent element on which the timeline element is created
   * @param options optional options for the timeline element
   */
  constructor(parent:Element, private options:any) {
    this.$node = d3.select(parent).append('div').classed('timeline', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<Timeline>}
   */
  init() {
    this.toggledElements = false;
    this.build();
    this.attachListener();

    // Return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  /**
   * Attach event handler for broadcasted events
   */
  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items) => {
     this.$leftMetaBox.html('Select the "Source Table" from the timeline in order to see more meta information.');
     this.$rightMetaBox.html('Select the "Destination Table" from the timeline in order to see more meta information.');
     this.$placeholder.classed('invisibleClass', false);
     this.updateItems(items);
    });
    // Call the resize function whenever a resize event occurs
    d3.select(window).on('resize', () => this.resize());
  }
  /**
   * Build the basic DOM elements like the svg graph and appends the tooltip div.
   */
  private build() {
    this.$svgTimeline = this.$node
      .append('svg')
      .attr('width', this.timelineWidth)
      .attr('height', this.timelineHeight);

    this.$placeholder = this.$node
      .append('div')
      .classed('placeholderContainer', true)
      .classed('invisibleClass2', true);

    this.$leftMetaBox = this.$placeholder
      .append('div')
      .style('width', 162 + 'px')
      .style('height', 162 + 'px')
      .classed('leftMetaBox', true)
      .append('p')
      .html('Select the "Source Table" from the timeline in order to see more meta information.' );

    this.$placeholder
      .append('div')
      .style('width', 162 + 'px')
      .style('height', 162 + 'px')
      .classed('placeholder', true)
      .append('p')
      .text('Select two time points on the timeline to get more information.' );

    this.$rightMetaBox = this.$placeholder
      .append('div')
      .style('width', 162 + 'px')
      .style('height', 162 + 'px')
      .classed('rightMetaBox', true)
      .append('p')
      .html('Select the "Destination Table" from the timeline in order to see more meta information.' );


  }

  /**
   * This method updates the graph and the timeline based on the window size and resizes the whole page.
   */
  private resize() {
    this.totalWidth = $(this.$node.node()).width();
    this.$svgTimeline.attr('width', this.totalWidth);
    this.updateTimelineAxis(this.$svgTimeline.select('g.axis.x'));
  }

  /**
   * This method handles the update for a new dataset or changed dataset.
   * @param items The new items which should be displayed.
   */

  private updateItems(items) {
    // Store new items in class variable
    this.items = items;

    // Delete all existing DOM elements
    this.$svgTimeline.selectAll('*').remove();
    this.resize();
    this.drawTimeline();
  }

  /**
   * This method draws a link from the circle to the heatmap of the source and destination table.
   * @param x Position of the circle
   * @param y Position of the circle
   * @param mode Distinguish between source and destination tables and cricles
   */
  private drawLine(x, y, mode) {
    const that = this;
    let direction: number = 0;
    let lineCol: string = 'grey';

    switch (mode) {
      case 'sourceTable':
        direction = 100;
        lineCol = '#E0CBC3';
        break;
      case 'destinationTable':
        direction = this.totalWidth - 100;
        lineCol = '#BFAEA8';
        break;
      default:
        break;
    }

    that.$svgTimeline.append('line')
      .attr('id', 'connectionLine')
      .style('stroke', lineCol)
      .style('stroke-width', 3 + 'px')
      .attr('x1', x)
      .attr('y1', y)
      .attr('x2', x )
      .attr('y2', y + 100);

    that.$svgTimeline.append('line')
      .attr('id', 'connectionLine')
      .style('stroke', lineCol)
      .style('stroke-width', 3 + 'px')
      .attr('x1', x)
      .attr('y1', y + 100 )
      .attr('x2', direction)
      .attr('y2', y + 100);

    that.$svgTimeline.append('line')
      .attr('id', 'connectionLine')
      .style('stroke', lineCol)
      .style('stroke-width', 3 + 'px')
      .attr('x1', direction )
      .attr('y1', y + 100)
      .attr('x2', direction)
      .attr('y2', y + 360);
  }


  /**
   * This method draws the timeline and also adds the circles.
   * It also handles the click and mouseover events for showing further context.
   */
  private drawTimeline() {
    const that = this;
    let clickedElement = [];

    const $xAxis = this.$svgTimeline.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0, 0)');

    this.updateTimelineAxis($xAxis);

    // Append the circles and add the mouseover and click listeners
    $xAxis.selectAll('.tick text')
      .on('click', function (date:Date) {
        const found = that.items.filter((item) => item.time.isSame(date, 'year'));
        const d = found[0];
        (<MouseEvent>d3.event).preventDefault();

        if (that.isClicked === 0) {
          // Toggle the active CSS classes
          that.$svgTimeline.selectAll('circle').classed('active', false);
          //Enable the active class only on clicked circle
          d3.select(this).classed('active', true).attr('fill');

          //Fill the meta-information box left
          if(d.time) {
            that.$leftMetaBox.html('<strong>Name: </strong>' + d.item.desc.name + '<br>' +
              '<strong>Date: </strong>' + d.time._d + '<br>' +
              '<strong>Dimension: </strong>' + d.item.dim[0] + ' X ' + d.item.dim[1] + '<br>' +
              '<strong>IDTypes: </strong>' +  d.item.desc.coltype + ' X ' + d.item.desc.rowtype + '<br>');
          } else {
            that.$leftMetaBox.html('<strong>Name: </strong>' + d.item.desc.name + '<br>' +
              '<strong>Dimension: </strong>' + d.item.dim[0] + ' X ' + d.item.dim[1] + '<br>' +
              '<strong>IDTypes: </strong>' +  d.item.desc.coltype + ' X ' + d.item.desc.rowtype + '<br>');
          }

          // IMPORTANT: Dispatch selected dataset to other views
          //events.fire(AppConstants.EVENT_DATASET_SELECTED_LEFT, d.item);

          // Close Histogram only if its rendered and remove also some other elements
          if (that.openHistogram2D === this.parentNode) {
            events.fire(AppConstants.EVENT_CLOSE_2D_HISTOGRAM);
            that.openHistogram2D = null;
            d3.select('.difftitle').classed('hidden', true);
            d3.select('.comparison').classed('hidden', true);
            d3.select('.diffPlaceholder').classed('invisibleClass', false);
            d3.select('.placeholder').classed('invisibleClass', false);
            d3.select('#detailViewBtn').attr('disabled', true);
          }

          clickedElement.push(d.item);
          that.isClicked = 1;
          // that.circleX = parseInt(d3.select(this).attr('cx'), 10);
          // that.circleY = parseInt(d3.select(this).attr('cy'), 10);
          //
          // //Remove previous connection line before drawing new one
          // d3.selectAll('#connectionLine').remove();
          // that.drawLine(that.circleX, that.circleY, 'sourceTable');
        } else {
          d3.select(this).classed('active', true).attr('fill');
          clickedElement.push(d.item);

          //Fill the meta-information box left
          if(d.time) {
            that.$rightMetaBox.html('<strong>Name: </strong>' + d.item.desc.name + '<br>' +
              '<strong>Date: </strong>' + d.time._d + '<br>' +
              '<strong>Dimension: </strong>' + d.item.dim[0] + ' X ' + d.item.dim[1] + '<br>' +
              '<strong>IDTypes: </strong>' +  d.item.desc.coltype + ' X ' + d.item.desc.rowtype + '<br>');
          } else {
            that.$rightMetaBox.html('<strong>Name: </strong>' + d.item.desc.name + '<br>' +
              '<strong>Dimension: </strong>' + d.item.dim[0] + ' X ' + d.item.dim[1] + '<br>' +
              '<strong>IDTypes: </strong>' +  d.item.desc.coltype + ' X ' + d.item.desc.rowtype + '<br>');
          }

          // IMPORTANT: Dispatch selected dataset to other views
          //events.fire(AppConstants.EVENT_DATASET_SELECTED_RIGHT, d.item);

          //Only perform events and open Histogram if it is not open already
          if(that.openHistogram2D !== this.parentNode) {
            events.fire(AppConstants.EVENT_OPEN_2D_HISTOGRAM, clickedElement);
            events.fire(AppConstants.EVENT_DATASET_SELECTED, clickedElement);

            that.openHistogram2D = this.parentNode;
            d3.select('#detailViewBtn').attr('disabled', null);
          }

          // events.fire(AppConstants.EVENT_OPEN_DIFF_HEATMAP, clickedElement);

          that.isClicked = 0;
          clickedElement = [];
          // that.circleX = parseInt(d3.select(this).attr('cx'), 10);
          // that.circleY = parseInt(d3.select(this).attr('cy'), 10);
          //
          // that.drawLine(that.circleX, that.circleY, 'destinationTable');
        }
      });
  }

  private updateTimelineAxis($node) {
    const timeScale = getTimeScale(this.items, this.totalWidth);
    const xAxis = d3.svg.axis()
      .scale(timeScale)
      .ticks(d3.time.years, 1)
      .tickFormat(d3.time.format('%Y'))
      .tickPadding(8);

    const $xAxis = $node.call(xAxis);

    $xAxis.selectAll('.tick')
      .filter((d) => {
        const found = this.items.filter((item) => item.time.isSame(d, 'year'));
        return (found.length === 0);
      })
      .remove();

    return $xAxis;
  }
}

/**
 * Factory method to create a new Timeline instance.
 * @param parent Element on which the timeline is drawn
 * @param options Parameters for the instance (optional)
 * @returns {Timeline}
 */
export function create(parent: Element, options: any) {
  return new Timeline(parent, options);
}
