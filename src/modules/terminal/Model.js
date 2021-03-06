define([
  "dojo/_base/declare"
  , "dojo/_base/array"
], function(
  declare
  , array
){
  return declare([
  ], {
    constructor: function(par){
      this.rootItem = {
        id: "root"
        , label: ""
      };
      this.terminals = par.terminals;
    }
    , getRoot: function(thenFun, errFun){
      thenFun(this.rootItem);
	}
	, getLabel: function(parItem){
      return parItem.label;
	}
	, mayHaveChildren: function(parItem){
      return parItem.id == "root";
	}
	, getIdentity: function(parItem){
      return parItem.id;
	}
    
    , getRootKids: function(){
      var ar = [{
        id: "new"
        , label: "new ..."
      }];
      array.forEach(this.terminals, function(t){
        ar.push(t);
      });
      return ar;
    }
    
	, getChildren: function(parItem, thenFun, errFun){
      if (parItem.id != "root"){
        thenFun([]);
        return;
      };
      thenFun(this.getRootKids());
	}
    
    , refreshTree: function(){
      this.onChildrenChange(this.rootItem, this.getRootKids());
    }
    , onChildrenChange: function(){}
    
  });
});
