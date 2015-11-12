/**
 * Created by Samuel Gratzl on 25.08.2015.
 */

//noinspection Annotator
define(['exports', '../caleydo_core/main', '../caleydo_core/datatype', './difflog_parser'], function (exports, C, datatypes, difflog_parser) {

  function dimensionStats(content, selector) {
    var hist = [];
    content.forEach(function (e) {
      var sel = selector(e);
      var result = $.grep(hist, function(e){ return e.id == sel.row; });
      if (result.length === 0) {
        hist.push({
          id : sel.row,
          count: 1,
          pos: sel.rpos
        });
      } else {
        result[0].count += 1;
      }
    });
    return hist;
  }

  function rowSelector(entry) {
    return  {
      row : entry.row,
      rpos : entry.rpos
    };
  }

  function colSelector(entry) {
    return  {
      row : entry.col,
      rpos : entry.cpos
    };
  }

  function get_ids(datalist){
    var ids = [];
    datalist.forEach(function(e, index, arr){
      ids.push(e.desc.id);
    });
    return ids;
  }

  function aggregate(content, bins) {
    var hist = [],
      len = content.length,
      mod = len % bins,
      items = len / bins,
      index = 0,
      temp; //when we count the items to the bin
    for (i = 0; i < bins; i++) {
      if (i < mod) {
        temp = content.slice(index, index + items + 1);
        index += items + 1;
        hist.push({
          id: temp[0].id + '-' + temp[items].id, //first and last id
          count: d3.sum(temp, function (d) {
            return d.count;
          }), //sum those
          //content.map(function(o) { return o.id; }).reduce(a, b) { return a + b; }))
          pos: i //starting from 0 is ok or?
        });
      } else {
        //the filling in case of a perfect division
        temp = content.slice(index, index + items);
        index += items;
        hist.push({
          id: temp[0].id + '-' + temp[items - 1].id, //first and last id
          count: d3.sum(temp, function (d) {
            return d.count;
          }), //sum those
          //content.map(function(o) { return o.id; }).reduce(a, b) { return a + b; }))
          pos: i //starting from 0 is ok or?
        });
      }
    }
    return hist;
  }

  exports.DiffMatrix = datatypes.defineDataType('diffmatrix', {
    init: function (desc) {
      //init function
      if (desc.tocall === 'mds'){
        this.ids = get_ids(desc.datalist);
        this.diff_source = C.server_url + '/taco/mds/' + this.ids
      }else if (desc.tocall === 'diff'){
        //todo make sure that the settings are not empty
        //detail: 0 is overview, 4 is detail
        //direction_id: 0 rows, 1 cols, 2 rows + cols
        //if nothing is selected then send 2 //todo handle this in the interface
      var direction_id = (desc.direction.length == 1? (desc.direction[0] == 'rows'? 0 : 1) : 2);
      this.diff_source = C.server_url + '/taco/diff_log/' + desc.id1 +'/' + desc.id2 + '/' + desc.detail
        + "/" + direction_id + "/" + desc.change;
      }
      this._cache = null;
    },
    data: function() {
      if (this._cache != null) {
        return this._cache;
      }
      //call the server for diff
      //todo get the name of the selected tables
      var diff_parser = difflog_parser.create(this.diff_source);

      //var toDiffMatrix = dHeatmap.createUnionTable(rows1, rows2, cols1, cols2);
      var h_data = diff_parser.getDiff();
      //store result in cache
      this._cache = h_data;
      return h_data;
    },
    // {id: id,
    // count: represents the height of the bar or count of appearance,
    // pos: the position of this r/c in a table}
    rowStats: function() {
      return this.data().then(function(data) {
        return dimensionStats(data.content,rowSelector);
      });
    },
    colStats: function() {
      return this.data().then(function(data) {
        return dimensionStats(data.content,colSelector);
      });
    },
    // @param bins the number of bins?
    rowAggStats: function(bins) {
      return this.rowStats().then(function(data){
        return aggregate(data, bins);
      });
    },
    colAggStats: function(bins) {
      return this.colStats().then(function(data){
        return aggregate(data, bins);
      });
    },
    //todo change this so that it consider the case of both rows and cols at the same time
    dimStats : function(dim, bins) {
      if(bins > 0){
        return dim[0] === 'c' ? this.colAggStats(bins) : this.colAggStats(bins);
      } else {
        //if it's 0 then do no aggregation
        return dim[0] === 'c' ? this.colStats() : this.rowStats();
      }
    },
    structDelStats: function(dim){
       return this.data().then(function(d){
         if (dim[0][0] === 'c'){
           return d.structure.deleted_cols; //todo add the added cols
         }
         if (dim[0][0] === 'r'){
           return d.structure.deleted_rows; //todo add the added rows
         }
         //todo to handle the case when it's both rows and columns selected, for now just return rows
         return d.structure.deleted_rows;
         //return d.structure; //todo probably call a function that returns a list!
       });
    },
    structAddStats: function(dim){
       return this.data().then(function(d){
         if (dim[0][0] === 'c'){
           return d.structure.added_cols; //todo add the added cols
         }
         if (dim[0][0] === 'r'){
           return d.structure.added_rows; //todo add the added rows
         }
         //todo to handle the case when it's both rows and columns selected, for now just return rows
         return d.structure.added_rows;
         //return d.structure; //todo probably call a function that returns a list!
       });
    },
    contentRatio: function(){
      return this.data().then(function(d){
        return {ratio: d.content.length / (d.union.uc_ids.length * d.union.ur_ids.length), type: "content-change"};
      });
    },
    rowAddRatio: function () {
      return this.data().then(function (d) {
        return {ratio: d.structure.added_rows.length /  d.union.ur_ids.length, type: "row-add"};
      });
    },
    rowDelRatio: function () {
      return this.data().then(function (d) {
        return {ratio: d.structure.deleted_rows.length /  d.union.ur_ids.length, type: "row-del"};
      });
    },
    colAddRatio: function () {
      return this.data().then(function (d) {
        return {ratio: d.structure.added_cols.length /  d.union.uc_ids.length, type: "col-add"};
      });
    },
    colDelRatio: function () {
      return this.data().then(function (d) {
        return {ratio: d.structure.deleted_cols.length /  d.union.uc_ids.length, type: "col-del"};
      });
    },
    //structure changes per cell for both add and remove operations for both rows and columns at the same time
    structAddRatio: function() {
      return this.data().then(function(d){
        var width = d.union.uc_ids.length, height = d.union.ur_ids.length, cells = width * height,
          addc = 0;
        height -= d.structure.deleted_rows.length;
        width -= d.structure.deleted_cols.length;
        addc += d.structure.added_rows.length * width;
        height -= d.structure.added_rows.length;
        addc += d.structure.added_cols.length * height;
        width -= d.structure.added_cols.length; //we might need this later!
        //the type here should be just add but i'm using row-add for css
        return {ratio: addc / cells, type: "row-add"};
      });
    },
    structDelRatio: function() {
      return this.data().then(function(d){
        var width = d.union.uc_ids.length, height = d.union.ur_ids.length, cells = width * height,
          delc = 0;
        delc += d.structure.deleted_rows.length * width;
        height -= d.structure.deleted_rows.length;
        delc += d.structure.deleted_cols.length * height;
        //the type here should be just add and del but i'm using row-add and row-del for css
        return {ratio: delc / cells, type: "row-del"};
      });
    },
    nochangeRatio: function() {
      return this.data().then(function(d){
        var width = d.union.uc_ids.length, height = d.union.ur_ids.length, cells = width * height,
          noc = 0;
        //the height without the removed or added rows
        if (d.structure.deleted_rows !== undefined){
          height -= d.structure.deleted_rows.length;
        }
        if (d.structure.added_rows !== undefined){
          height -= d.structure.added_rows.length;
        }
        //the width without the deleted or removed cols
        if (d.structure.deleted_cols !== undefined){
          width -= d.structure.deleted_cols.length;
        }
        if (d.structure.added_cols !== undefined){
          width -= d.structure.added_cols.length;
        }
        //the rest cells without the changed ones
        noc = (height * width) - d.content.length;
        return {ratio: noc / cells, type: "no-change"}
      });
    }
  });

  exports.create = function (desc) {
    return new exports.DiffMatrix(desc);
  };
});
