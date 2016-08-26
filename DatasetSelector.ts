/**
 * Created by Holger Stitz on 26.08.2016.
 */

import i18n = require('../caleydo_i18n/i18n');
import data = require('../caleydo_core/data');

class DatasetSelector {

  private $node;

  constructor(parent:Element, private options:any) {
    this.$node = d3.select(parent).append('div').classed('datasetSelector', true);
  }

  init() {
    this.build();
    this.update();
  }

  private build() {
    this.$node.append('label')
      .attr('for', 'ds')
      .text(i18n.t('dataset'));

    this.$node.append('select')
      .attr('id', 'ds');
  }

  update() {
     data.list((d) => d.desc.type === 'matrix')
      .then((items) => {
        console.log(items);
      });
  }

}

export function create(parent:Element, options:any) {
  return new DatasetSelector(parent, options);
}
