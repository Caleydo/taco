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
  'name': 'Data Set Selector',
  'factory': 'create'
 });

  registry.push('tacoView', 'Timeline', function() { return System.import('./src/timeline'); }, {
  'name': 'Timeline',
  'factory': 'create'
 });

  registry.push('tacoView', 'HeatMap', function() { return System.import('./src/heat_map'); }, {
  'name': 'Heat Map',
  'factory': 'create'
 });

  registry.push('tacoView', 'Histogram2D', function() { return System.import('./src/histogram_2d'); }, {
  'name': 'Histogram2D',
  'factory': 'create'
 });
  // generator-phovea:end
};

