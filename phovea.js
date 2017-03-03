/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function(registry) {
  //registry.push('extension-type', 'extension-id', function() { return System.import('./src/extension_impl'); }, {});
  // generator-phovea:begin
  registry.push('app', 'taco', function() { return System.import('./src/'); }, {
    'name': 'TaCo'
  });

  registry.push('tacoView', 'DataSetSelector', function() { return System.import('./src/data_set_selector'); }, {
    'name': 'Data Set Selector'
  });

  registry.push('tacoView', 'Timeline', function() { return System.import('./src/timeline'); }, {
    'name': 'Timeline'
  });

  registry.push('tacoView', 'DiffTitle', function() { return System.import('./src/diff_title'); }, {
    'name': 'DiffTitle'
  });

  registry.push('tacoView', 'DetailView', function() { return System.import('./src/detail_view'); }, {
    'name': 'DetailView'
  });

  registry.push('tacoView', 'HeatMap', function() { return System.import('./src/heat_map'); }, {
    'name': 'Heat Map'
  });

  registry.push('tacoView', 'DiffHeatMap', function() { return System.import('./src/diff_heat_map'); }, {
    'name': 'Diff Heat Map'
  });

  registry.push('tacoView', 'Histogram2D', function() { return System.import('./src/histogram_2d'); }, {
    'name': 'Histogram2D'
  });

  registry.push('tacoView', 'FilterBar', function () { return System.import('./src/filter_bar'); }, {
    'name': 'FilterBar'
  });

  registry.push('tacoView', 'BarChart', function () { return System.import('./src/bar_chart'); }, {
    'name': 'BarChart'
  });
  // generator-phovea:end
};

