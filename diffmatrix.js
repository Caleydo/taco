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

  function aggregate(content, bins, u_ids) {
    var hist = [],
      len = u_ids.length,
      mod = len % bins,
      items = Math.floor(len / bins),
      index = 0,
      addi = 0, // the number of items that should be added
      temp, data_temp; //when we count the items to the bin
    for (i = 0; i < bins; i++) {
      if (i < mod) {
        addi = items + 1;
        temp = u_ids.slice(index, index + addi);
        index += addi;
      } else {
        //the filling in case of a perfect division
        temp = u_ids.slice(index, index + items);
        index += items;
      }
      data_temp = $.grep(content, function(e){
        return temp.indexOf(e.id) !== -1 ; // todo return only the objects that are in the temp array
      });
      hist.push({
        id: temp[0] + '-' + temp[addi - 1], //first and last id
        count: d3.sum(data_temp, function (d) {
          return d.count;
        }), //sum those
        pos: i //starting from 0 is ok or?
      });
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
        // bins: 0 is the most detail (diff_heatmap)
        //       1 is then we get ratios for lineup?
        //       between 2 and the size of the row/col (so the max value -1) is the case for middle which represents the actual bins count
        //       the max then this means every col/row has a bin
      var direction_id = (desc.direction.length == 1? (desc.direction[0] == 'rows'? 0 : 1) : 2);
      this.diff_source = C.server_url + '/taco/diff_log/' + desc.id1 +'/' + desc.id2 + '/' + desc.bins
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
    rowAggStats: function(bins, u_ids) {
      return this.rowStats().then(function(data){
        return aggregate(data, bins, u_ids);
      });
    },
    colAggStats: function(bins, u_ids) {
      return this.colStats().then(function(data){
        return aggregate(data, bins, u_ids);
      });
    },
    //todo change this so that it consider the case of both rows and cols at the same time
    dimStats : function(dim, bins) {
      if(bins > 0){
        var that = this;
        return this.data().then(function(data){
          // we need the union size
          return dim[0] === 'c' ? that.colAggStats(bins, data.union.uc_ids) : that.rowAggStats(bins, data.union.ur_ids);
        });
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
