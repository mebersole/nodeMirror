/*
  mix this in with you widget
*/
define([
  "dojo/_base/declare"
  , "dojo/dom-construct"
  , "dojo/_base/lang"
  , "dojo/Deferred"
  , "main/clientOnly!dijit/Toolbar"
  , "main/clientOnly!dijit/form/Button"
  , "main/clientOnly!dojo/io/iframe"
  , "main/clientOnly!sol/dlg/YesNoCancel"
  , "sol/fileName"
  , "main/clientOnly!sol/wgt/TextBox"
  , "main/clientOnly!client/globals"
], function(
  declare
  , domConstruct
  , lang
  , Deferred
  , Toolbar
  , Button
  , iframe
  , YesNoCancel
  , fileName
  , TextBox
  , globals
){
  return declare([
  ], {
    
    def: function(){ return new Deferred(); } // makes things a little easier to type
    
    , showMenu: true
    , idLine: true
    , closable: true
    
    , constructor: function(){
      this.dirty = false;
    }
    
    , buildRendering: function(){
      var ret = this.inherited(arguments);
      if (this.idLine){
        this.idWgt = this.ownObj(new TextBox({
          region: "top"
        }));
        this.addChild(this.idWgt);
      };
      if (this.showMenu){
        this.menu = this.createMenu();
        this.addChild(this.menu);
      };
      return ret;
    }
    
    , _setParAttr: function(par){
      this._set("par", par);
      this.set("originalTitle", fileName.single(par.id));
      if (this.idWgt){
        this.idWgt.set("value", par.id);
      };
    }
    
    , _setOriginalTitleAttr: function(par){
      this._set("originalTitle", par);
      this._doTitle();
    }
    
    , _doTitle: function(){
      this.set("title", this.get("dirtyTitle"));
    }
    
    , _setTitleAttr: function(parTitle){
      this._set("title", parTitle); // to skip the dom node mapping
    }
    
    , _getDirtyTitleAttr: function(){
      var t = "" + this.get("originalTitle");
      if (!t.length){
        t = "/";
      };
      return t + (this.get("dirty") ? " *" : "");
    }
    
    , _setDirtyAttr: function(parDirty){
      this._set("dirty", parDirty);
      this._doTitle();
    }
    
    
    , createMenu: function(){
      var menu = this.ownObj(new Toolbar({
        region: "top"
      }));
      
      menu._buttons = {};
      
      if (this.saveButton){
        menu._buttons.saveButton = this.ownObj(new Button({
          iconClass: "dijitAdditionalEditorIconSave"
          , onClick: lang.hitch(this, "savePs")
          , label: "save"
        }));
        menu.addChild(menu._buttons.saveButton);
      };
      
      if (this.reloadButton){
        menu._buttons.reloadButton = this.ownObj(new Button({
          onClick: lang.hitch(this, "reloadPs")
          , label: "reload"
        }));
        menu.addChild(menu._buttons.reloadButton);
      };
      
      if (this.downloadButton){
        menu._buttons.downLoadButton = this.ownObj(new Button({
          onClick: lang.hitch(this, "download")
          , label: "download"
        }));
        menu.addChild(menu._buttons.downLoadButton);
      };
      
      if (this.textModeButton){
        menu._buttons.textmodebutton = this.ownObj(new Button({
          onClick: lang.hitch(this, "textmode")
          , label: "Text-Editor"
        }));
        menu.addChild(menu._buttons.textmodebutton);
      };
      if (this.binaryModeButton){
        menu._buttons.binaryModeButton = this.ownObj(new Button({
          onClick: lang.hitch(this, "binarymode")
          , label: "Hex-Editor"
        }));
        menu.addChild(menu._buttons.binaryModeButton);
      };
      
      this.inherited(arguments);
      
      return menu;
    }
    
    , startup: function(){
      if (this._started) { return; };
      this.inherited(arguments);
      this.on("close", lang.hitch(this, "_onClose"));
    }
    
    , removeMe: function(){
    }
    
    , _onClose: function(){
      if (!this.saveButton
        || !this.get("dirty")
        || this._closeAnyway){
        this.removeMe();
        return true;
      };
      var dlg = new YesNoCancel({
        title: "Save Changes?"
        , content: "Save Changes to " + this.get("originalTitle") + "?"
      });
      dlg.show();
      dlg.then(lang.hitch(this, function(parRes){
        if (parRes == 1){
          var savePs = this.savePs();
          if (savePs && savePs.then){
            savePs.then(lang.hitch(this, function(){
              this._closeAnyway = true;
              this.close();
            }));
          }else{
            this._closeAnyway = true;
            this.close();
          };
        }else if(parRes === 0){
          this._closeAnyway = true;
          this.close();
        };
      }));
      return false;
    }
    
    , textmode: function(){
      this.forceMode("modules/Text");
    }
    , binarymode: function(){
      this.forceMode("modules/Binary");
    }
    
    , forceMode: function(parModuleId){
      if (this.getModuleId() == parModuleId){
        return;
      };
      globals.openContent({
        par: lang.mixin({}, this.par, {
          force: parModuleId
        })
        , instead: this
      });
    }
    
    , loadPs: function(){
      var ps = this.getContentPs(this.par);
      ps.then(lang.hitch(this, function(parContent){
        this.set("content", parContent);
        this.set("dirty", false);
      }));
      return ps;
    }
    
    , reloadPs: function(){
      this.loadPs();
    }
    
    , savePs: function(){
      var ps = this.saveContentPs(this.get("par"), this.get("content"));
      ps.then(lang.hitch(this, "set", "dirty", false));
      return ps;
    }
    
    , getContentPs: function(){
      var res = this.inherited(arguments);
      if (!res){
        console.log("missing getContentPs implementation");
      };
      return res;
    }
    
    , saveContentPs: function(){
      var res = this.inherited(arguments);
      if (!res){
        console.log("missing saveContentPs implementation");
      };
      return res;
    }
    
    , download: function(){
      iframe.send({
        url: "/download",
        handleAs: "html",
        content: {
          id: this.par.id
        }
      });
    }
    
  });
});