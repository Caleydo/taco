/**
 * Created by Samuel Gratzl on 25.08.2015.
 */

//noinspection Annotator
define(['exports', '../caleydo_core/main', '../caleydo_core/datatype', './difflog_parser'], function (exports, C, datatypes, difflog_parser) {
  exports.DiffMatrix = datatypes.defineDataType('diffmatrix', {
    init: function (desc) {
      console.log(desc);
      //init function
      this.diff_source = C.server_url + '/taco/diff_log/' + desc.id1 +'/' + desc.id2;
    },
    data: function() {

      //call the server for diff
      //todo get the name of the selected tables
      var diff_parser = difflog_parser.create(this.diff_source);

      //var toDiffMatrix = dHeatmap.createUnionTable(rows1, rows2, cols1, cols2);
      var h_data = diff_parser.getDiff();
      return h_data;
    }
  });

  exports.create = function (desc) {
    return new exports.DiffMatrix(desc);
  };
});
