/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */
//register all extensions in the registry following the given pattern
module.exports = function (registry) {
    //registry.push('extension-type', 'extension-id', function() { return import('./src/extension_impl'); }, {});
    // generator-phovea:begin
    registry.push('app', 'taco', function () { return import('./initialize'); }, {
        'name': 'TACO'
    });
    registry.push('tacoView', 'DataSetSelector', function () { return import('./common/DataSetSelector').then((d) => d.DataSetSelector); }, {
        'name': 'Data Set Selector'
    });
    registry.push('tacoView', 'Timeline', function () { return import('./common/Timeline').then((t) => t.Timeline); }, {
        'name': 'Timeline'
    });
    registry.push('tacoView', 'DetailView', function () { return import('./common/DetailView').then((d) => d.DetailView); }, {
        'name': 'DetailView'
    });
    registry.push('tacoView', 'HeatMap', function () { return import('./heatmap/TacoHeatMap'); }, {
        'name': 'Heat Map'
    });
    registry.push('tacoView', 'DiffHeatMap', function () { return import('./heatmap/DiffHeatMap').then((d) => d.DiffHeatMap); }, {
        'name': 'Diff Heat Map'
    });
    registry.push('tacoView', 'Histogram2D', function () { return import('./histogram/Histogram2D').then((h) => h.Histogram2D); }, {
        'name': 'Histogram2D'
    });
    registry.push('tacoView', 'FilterBar', function () { return import('./common/FilterBar').then((f) => f.FilterBar); }, {
        'name': 'FilterBar'
    });
    registry.push('tacoView', 'BarChart', function () { return import('./barchart/BarChart').then((b) => b.BarChart); }, {
        'name': 'BarChart'
    });
    registry.push('tacoView', 'MetaInfoBox', function () { return import('./common/MetaInfoBox').then((m) => m.MetaInfoBox); }, {
        'name': 'MetaInfoBox'
    });
    registry.push('tacoView', 'ReorderView', function () { return import('./common/ReorderView').then((r) => r.ReorderView); }, {
        'name': 'Re-Order View'
    });
    // generator-phovea:end
};
//# sourceMappingURL=phovea.js.map
