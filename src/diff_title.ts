/**
 * Created by cniederer on 20.01.17.
 */

//import * as events from 'phovea_core/src/event';
import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import * as ajax from 'phovea_core/src/ajax';

class DiffTitle implements IAppView {

  private $node;
  private items;
  private countTables = 0;

  constructor(public parent:Element, private options:any) {

    this.$node = d3.select(parent)
      .append('div')
      .classed('difftitle', true);
  }

  init() {
    this.attachListener();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private attachListener() {

    events.on(AppConstants.EVENT_DATASET_SELECTED_LEFT, (evt, items) => {
      //console.log('firstClick', items);
      this.createHeatmapTitle(items, 'LEFT');
    });

    events.on(AppConstants.EVENT_DATASET_SELECTED_RIGHT, (evt, items) => {
      this.createHeatmapTitle(items, 'RIGHT');
    });

  }


  private createHeatmapTitle(items, position) {

    if(this.countTables >= 2) {
      this.countTables = 0;
      d3.select(".difftitle").selectAll("*").remove();
    }

    switch (position) {
      case 'LEFT':
        this.countTables++;

        let divLeft = d3.select('.difftitle')
          .append('div')
          .attr('class', 'leftHeatmapTitle')
          .attr('id', 'leftHeatmapTitle');
        divLeft.append('p').html('Source: ' + items.desc.name);
        break;

      case 'RIGHT':
        this.countTables++;

        d3.select('.difftitle')
          .append('div')
          .append('p')
          .attr('class', 'diffHeatmapTitle')
          .attr('id', 'diffHeatmapTitle')
          .html('DiffTable');

        let divRight = d3.select('.difftitle')
          .append('div')
          .attr('class', 'rightHeatmapTitle')
          .attr('id', 'rightHeatmapTitle');
        divRight.append('p').html('Destination: ' + items.desc.name);
        break;

      default:
        break;
    }
  }




}

/**
 * Factory method to create a new DiffHeatMap instance
 * @param parent
 * @param options
 * @returns {DiffHeatMap}
 */
export function create(parent:Element, options:any) {
  return new DiffTitle(parent, options);
}
