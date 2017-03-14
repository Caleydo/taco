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
  private timelineHeight = 200;
  private tooltipDiv;
  private toggledElements: boolean;
  private openHistogram2D;

  // Helper variable for the clicking event
  private isClicked: number = 0;

  // Helper variables for saving the circle position
  private circleX: number;
  private circleY: number;


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
      .attr('height', this.timelineHeight)
      .attr('id', 'timelineSVG');

    this.tooltipDiv = d3.select('.timeline').append('div')
      .classed('tooltip', true)
      .style('opacity', 0);

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
    // console.log('timelineWidth', this.totalWidth);
    // Update line
    this.$svgTimeline.attr('width', this.totalWidth);
    d3.select('line').attr('x2', this.totalWidth);

    // Updating scale for circle position
    const xScaleTimeline = getPosXScale(this.items, this.totalWidth);

    this.$svgTimeline.selectAll('circle')
      .attr('cx', (d: any, i) => {
        if (d.time) {
          return xScaleTimeline(moment(d.time).diff(moment(this.items[0].time), 'days'));
        } else {
          return i * scaleCircles(this.totalWidth, this.items.length);
        }
      });
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
    const xScaleTimeline = getPosXScale(this.items, this.totalWidth);
    let clickedElement = [];

    // Basic scale of the circles and the range
    const circleScale = d3.scale.linear()
      .domain([0, d3.max(this.items, (d: any) => d.item.dim[0])])
      .range([5, 2]);   //h/100

    // Append the base line where the circles are drawn onto
    this.$svgTimeline.append('line')
      .style('stroke', '#888')
      .attr('x1', 0)
      .attr('y1', 60)
      .attr('x2', that.totalWidth - 10)
      .attr('y2', 60);

    const timeScale = getTimeScale(this.items, this.totalWidth);

    const xAxis = d3.svg.axis()
      .scale(timeScale)
      .ticks(d3.time.years, 1)
      .tickFormat((d) => {
          const found = this.items.filter((item) => item.time.isSame(d, 'year'));
          console.log(found);
          return (found.length === 0) ? '' : found[0].time.format('YYYY');
      })
      .tickPadding(8);

    this.$svgTimeline.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0, 0) ')
      .call(xAxis);

    // Append the circles and add the mouseover and click listeners
    this.$svgTimeline.selectAll('circle')
      .data(this.items)
      .enter()
      .append('circle')
      .attr('title', (d: any) => (d.time) ? d.time.format(AppConstants.DATE_FORMAT) : d.key)
      .attr('cy', 60)
      .attr('cx', (d: any, i) => {
        if (d.time) {
          return xScaleTimeline(moment(d.time).diff(moment(this.items[0].time), 'days'));
        } else {
          return (i+1) * (scaleCircles(this.totalWidth, this.items.length));
        }
      })
      .attr('id', (d:any) => 'circle_' + d.item.desc.id)
      .attr('r', (d:any) => circleScale(d.item.dim[0]))
      .on('click', function (d:any) {
        (<MouseEvent>d3.event).preventDefault();

        if (that.isClicked === 0) {
          // Toggle the active CSS classes
          that.$svgTimeline.selectAll('circle').classed('active active2', false);
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
          d3.select(this).classed('active2', true).attr('fill');
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
      })
      .on('mouseover', function(d, i) {
        const position = d3.mouse(document.body);

        that.tooltipDiv
          .transition()
          .duration(200)
          .style('opacity', .9);
        that.tooltipDiv.html(d.key)
          .style('left', function(d) {
            if( ($(window).innerWidth() - 100) < position[0] ) {
              return (position[0] - 50) + 'px';
            } else {
              return (position[0] + 15) + 'px';
            }
          })
          .style('top', (position[1] + 20) + 'px');
      })
      .on('mouseout', function(d, i) {
        that.tooltipDiv.transition()
          .duration(500)
          .style('opacity', 0);
      });
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
