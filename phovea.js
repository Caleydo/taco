/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function(registry) {
  //registry.push('extension-type', 'extension-id', function() { return import('./src/extension_impl'); }, {});
  // generator-phovea:begin
  registry.push('app', 'taco', function() { return import('./src/app/init'); }, {
    'name': 'TACO'
  });

  registry.push('tacoView', 'DataSetSelector', function() { return import('./src/common/DataSetSelector'); }, {
    'name': 'Data Set Selector'
  });

  registry.push('tacoView', 'Timeline', function() { return import('./src/common/Timeline'); }, {
    'name': 'Timeline'
  });

  registry.push('tacoView', 'DetailView', function() { return import('./src/common/DetailView'); }, {
    'name': 'DetailView'
  });

  registry.push('tacoView', 'HeatMap', function() { return import('./src/heatmap/HeatMap'); }, {
    'name': 'Heat Map'
  });

  registry.push('tacoView', 'DiffHeatMap', function() { return import('./src/heatmap/DiffHeatMap'); }, {
    'name': 'Diff Heat Map'
  });

  registry.push('tacoView', 'Histogram2D', function() { return import('./src/histogram/Histogram2D'); }, {
    'name': 'Histogram2D'
  });

  registry.push('tacoView', 'FilterBar', function () { return import('./src/common/FilterBar'); }, {
    'name': 'FilterBar'
  });

  registry.push('tacoView', 'BarChart', function () { return import('./src/barchart/BarChart'); }, {
    'name': 'BarChart'
  });

  registry.push('tacoView', 'MetaInfoBox', function () { return import('./src/common/MetaInfoBox'); }, {
    'name': 'MetaInfoBox'
  });

  registry.push('tacoView', 'ReorderView', function() { return import('./src/common/ReorderView'); }, {
    'name': 'Re-Order View'
  });
  // generator-phovea:end
};

