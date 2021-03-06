// requires lib/codemirror.js loaded
define([
  "dojo/_base/declare"
  , "dojo/_base/lang"
  , "dijit/_WidgetBase"
  , "dojo/dom-geometry"
  , "sol/convenient/Delayed"
  , "codemirror/CodeMirror"
  //, "jshint/jshint"
  , "codemirror/addon/hint/all"
  , "dojo/_base/array"
  , "codemirror/addon/display/fullscreen"
  , "codemirror/addon/comment/comment"
], function(
  declare
  , lang
  , WidgetBase
  , domGeometry
  , Delayed
  , CodeMirror
  //, JSHINT
  , allHints
  , array
  , commentAddOn
){

  var cmOptions = {
    lineNumbers: false
    , mode: undefined
    , theme: "default"
    , matchBrackets: true
    , readOnly: false
    , autoCloseBrackets: true
    , matchTags: true
    , showTrailingSpace: false
    , autoCloseTags: true
    , foldGutter: true
    , gutters: true
    , extraKeys: {}
    , placeholder: ""
    , lineWrapping: false
    , keyMap: "default"
  };
  
  var hintMap = {};
  array.forEach(allHints, function(parHint){
    hintMap[parHint] = true;
  });
  
  CodeMirror.commands.autocomplete = function(cm) {
    var mode = cm.getMode();
    if (mode){
      if (CodeMirror.hint[mode.name]){
        CodeMirror.showHint(cm, CodeMirror.hint[mode.name]);
        return;
      };
    };
    CodeMirror.showHint(cm, CodeMirror.hint.anyword);
  };  
  
  return declare([
    WidgetBase
  ], {
    
    extraKeys: {
        "F11": function(cm) {
          cm.setOption("fullScreen", !cm.getOption("fullScreen"));
        },
        "Esc": function(cm) {
          if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
        }
      }
    
    , lint: true
    
    , constructor: function(){
      var mix = {
      };
      var o;
      function f(oriName, setName){
          mix["_set" + setName + "Attr"] = function(newValue){
            this._set(oriName, newValue);
            this.mirror.setOption(oriName, newValue);
          };
          mix["_get" + setName + "Attr"] = function(){
            return this.mirror.getOption(oriName);
          };
      };
      for(o in cmOptions){
        f(o, o[0].toUpperCase() + o.substr(1));
      };
      declare.safeMixin(this, mix);
      /*this.checkDelayed = this.ownObj(new Delayed({
        delay: 3000
      }, lang.hitch(this, "updateHints")));*/
    }
    
    , buildRendering: function(){
      this.inherited(arguments);
      this.mirror = new CodeMirror(this.domNode);
      if (this.value){
        this.mirror.setValue(this.value);
      };
      this.mirror.setOption("extraKeys", this.extraKeys);
      //this.widgets = [];
    }
    
    , _setAutoCompleteAttr: function(parValue){
      this._set("autoComplete", parValue);
      var keyMap = this.mirror.getOption("extraKeys") || {};
      if (parValue){
        keyMap["Ctrl-Space"] = "autocomplete";
      }else{
        delete keyMap["Ctrl-Space"];
      };
      this.mirror.setOption("extraKeys", keyMap);
    }
    
    , focus: function(){
      this.inherited(arguments);
      this.mirror.focus();
    }
    
    , on: function(parWhat, parFun){
      return this.mirror.on(parWhat, parFun);
    }
    
    , _setLintAttr: function(parValue){
      this._set("lint", parValue);
      
      var helper = this.mirror.getHelper(CodeMirror.Pos(0, 0), "lint");
      if (helper){
        if (parValue){
          this.mirror.setOption("lint", {
            laxcomma: true
          , laxbreak: true
          , multistr: true
          , maxerr: 1000
          , newcap: false
          , "-W032": true
          });
        }else{
          this.mirror.setOption("lint", parValue);
        }
      }else{
        this.mirror.setOption("lint", false);
      };
    }
    
    /*, updateHints: function() {
      if (!JSHINT || !this.jshint){
        return;
      };
      
      this.mirror.operation(lang.hitch(this, function(){
        var i;
        this._removeLineWgts();
        
        JSHINT(this.mirror.getValue(), {
          laxcomma: true
          , laxbreak: true
          , multistr: true
          , maxerr: 1000
          , newcap: false
        });
        this.jshintErrors = 0;
        for (i = 0; i < JSHINT.errors.length; ++i) {
          var err = JSHINT.errors[i];
          if (!err) continue;
          if (err.reason == "Unnecessary semicolon."
              || err.reason == "Expected a 'break' statement before 'case'."
          ){
            continue;
          };
          var msg = document.createElement("div");
          var icon = msg.appendChild(document.createElement("span"));
          icon.innerHTML = "!!";
          icon.className = "lint-error-icon";
          msg.appendChild(document.createTextNode(err.reason));
          msg.className = "lint-error";
          this.widgets.push(this.mirror.addLineWidget(err.line - 1, msg, {coverGutter: false, noHScroll: true}));
          this.jshintErrors++;
        };
      }));
    }*/
    
    /*, _removeLineWgts: function(){
      var i;
      for (i = 0; i < this.widgets.length; ++i){
        this.mirror.removeLineWidget(this.widgets[i]);
      };
      this.widgets = [];
    }*/
    
    , postMixInProperties: function(){
      this.inherited(arguments);
    }
    
    , startup: function(){
      if (this._started) { return; };
      this.inherited(arguments);
      
      if (this.jshint === undefined){
        var mode = this.mirror.getMode();
        if (mode && mode.name == "javascript"){
          this.jshint = true;
        };
      };
      
      this.mirror.refresh();
      
      /*if (this.jshint){
        this._startJshint();
      };*/
    }
    /*,_setJshintAttr: function(parValue){
      this._set("jshint", parValue);
      if (parValue){
        this._startJshint();
      }else{
        this._removeLineWgts();
      };
    }*/
    
    /*, _startJshint: function(){
      if (!this._jshintOn){
        this._jshintOn = true;
        this.mirror.on("change", lang.hitch(this, function(){
          if (this.jshintErrors > 0){
            this.checkDelayed.exec(300);
          }else{
            this.checkDelayed.exec();
          };
        }));
      };
      this.checkDelayed.exec(500);
    }*/
    
    , blockComment: function(from, to, options){
      if (!from){
        from = this.mirror.getDoc().getCursor("start");
      };
      if (!to){
        to = this.mirror.getDoc().getCursor("end");
      };
      this.mirror.blockComment(from, to);
    }
    
    , lineComment: function(from, to, options){
      if (!from){
        from = this.mirror.getDoc().getCursor("start");
      };
      if (!to){
        to = this.mirror.getDoc().getCursor("end");
      };
      this.mirror.lineComment(from, to);
    }
    
    , uncomment: function(from, to, options){
      if (!from){
        from = this.mirror.getDoc().getCursor("start");
      };
      if (!to){
        to = this.mirror.getDoc().getCursor("end");
      };
      this.mirror.uncomment(from, to);
    }
    
    , _setValueAttr: function(parValue){
      this._set("value", parValue);
      this.mirror.getDoc().setValue(parValue);
    }
    
    , _getValueAttr: function(){
      return this.mirror.getDoc().getValue();
    }
    
    , resize: function(changeSize){
      if (changeSize){
        domGeometry.setMarginBox(this.domNode, changeSize);
      };
      var box = domGeometry.getMarginBox(this.domNode);
      this.mirror.setSize(box.w, box.h);
      
    }
    
    , destroy: function(){
      this.inherited(arguments);
    }
    
  });
});
