/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function(registry) {
  //registry.push('extension-type', 'extension-id', function() { return import('./src/extension_impl'); }, {});
  // generator-phovea:begin
  registry.push('app', 'taco', function() { return import('./src/'); }, {
    'name': 'TACO'
  });

  registry.push('tacoView', 'DataSetSelector', function() { return import('./src/data_set_selector'); }, {
    'name': 'Data Set Selector'
  });

  registry.push('tacoView', 'Timeline', function() { return import('./src/timeline'); }, {
    'name': 'Timeline'
  });

  registry.push('tacoView', 'DetailView', function() { return import('./src/detail_view'); }, {
    'name': 'DetailView'
  });

  registry.push('tacoView', 'HeatMap', function() { return import('./src/heat_map'); }, {
    'name': 'Heat Map'
  });

  registry.push('tacoView', 'DiffHeatMap', function() { return import('./src/diff_heat_map'); }, {
    'name': 'Diff Heat Map'
  });

  registry.push('tacoView', 'Histogram2D', function() { return import('./src/histogram_2d'); }, {
    'name': 'Histogram2D'
  });

  registry.push('tacoView', 'FilterBar', function () { return import('./src/filter_bar'); }, {
    'name': 'FilterBar'
  });

  registry.push('tacoView', 'BarChart', function () { return import('./src/bar_chart'); }, {
    'name': 'BarChart'
  });

  registry.push('tacoView', 'MetaInfoBox', function () { return import('./src/meta_info_box'); }, {
    'name': 'MetaInfoBox'
  });

  registry.push('tacoView', 'ReorderView', function() { return import('./src/reorder_view'); }, {
    'name': 'Re-Order View'
  });
  // generator-phovea:end
};

