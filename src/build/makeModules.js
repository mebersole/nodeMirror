define([
  "dojo/node!modulize-generic-js"
  , "dojo/node!fs"
  , "dojo/_base/config"
  , "dojo/_base/array"
  , "dojo/Deferred"
  , "sol/string"
  , "sol/promise"
], function(
  modulizer
  , fs
  , dojoConfig
  , array
  , Deferred
  , solString
  , solPromise
){
  
  var genericDir = dojoConfig.baseUrl + "../generic-js/";
  var srcDir = dojoConfig.baseUrl;
  
  // codemirror
  
  
  srcPath = genericDir + "CodeMirror/";
  destPath = srcDir + "codemirror/";

var errFun = function(err){
  if (err){
    console.log(err);
  };
};
  
  
  modulizer.convertFile(srcPath + "lib/codemirror.js", {
    "return": "CodeMirror"
  }, destPath + "CodeMirror.js", errFun);

  modulizer.convertFile(srcPath + "mode/meta.js", {
    require: [{
      module: "codemirror/CodeMirror"
      , as: "CodeMirror"
    }]
    , "return": "CodeMirror.modeInfo"
  }, destPath + "modeMeta.js", errFun);
  
  modulizer.convertFile(srcPath + "mode/meta.js", {
    require: [{
      module: "main/codemirror/fake"
      , as: "CodeMirror"
    }]
    , "return": "CodeMirror.modeInfo"
  }, srcDir + "main/codemirror/meta.js", errFun);
  
  
  fs.readFile(srcPath + "lib/codemirror.css", function(err, data){
    if (err){
      console.log(err);
      return;
    };
    fs.writeFile(destPath + "codemirror.css", data, function(err){
      console.log(destPath + "codemirror.css");
      if (err){
        console.log(err);
      };
    });
  });

var standardConfig = {
  require: [{
    module: "codemirror/CodeMirror"
    , as: "CodeMirror"
  }]
  , "return": "CodeMirror"
};

  var modeDir = srcPath + "mode";
  var modeDestDir = destPath + "mode";
  
  var del = new Deferred();
  
  // delete all in mode dir
  fs.readdir(modeDestDir, function(err, data){
    if (err){
      console.log(err);
      return;
    };
    var defs = [];
    array.forEach(data, function(parFileName){
      if (solString.endsWith(parFileName, ".js")){
        var def = new Deferred();
        defs.push(def);
        fs.unlink(modeDestDir + "/" + parFileName, function(){
          def.resolve();
        });
      };
    });
    if (defs.length){
      solPromise.allDone(defs).then(function(){
        del.resolve();
      });
    }else{
      del.resolve();
    };
  });
  
  var allModesStr = "define([\"codemirror/CodeMirror\"";
  
  del.then(function(){
    
    fs.readdir(modeDir, function(err, data){
      if (err){
        console.log(err);
        return;
      };
      var defs = [];
      array.forEach(data, function(parDirName){
        var def = new Deferred();
        defs.push(def);
        fs.stat(modeDir + "/" + parDirName, function(err, parStat){
          if (err){
            console.log(err);
            def.resolve();
            return;
          };
          if (parStat.isDirectory()){
            var srcFile = modeDir + "/" + parDirName + "/" + parDirName + ".js";
            fs.exists(srcFile, function (exists) {
              if (!exists){
                def.resolve();
                return;
              };
              allModesStr += ", \"codemirror/mode/" + parDirName + "\"";
              modulizer.convertFile(srcFile, standardConfig, modeDestDir + "/" + parDirName + ".js", errFun);
              def.resolve();
            });
          }else{
            def.resolve();
          };
        });
      });
      solPromise.allDone(defs).then(function(){
        allModesStr += "], function(CodeMirror){ return CodeMirror; });";
        fs.writeFile(modeDestDir + "/allModes.js", allModesStr);
      });
    });
  });
  
  var srcAddOnDir = srcPath + "addon/";
  var destAddOnDir = destPath + "addon/";
  
  var cssAddOns = "";
  var walkDefs = [];
  
  var walk;
  
  // recursively walk through the addon dir
  walk = function(parDir){
    var completeSrc = srcAddOnDir + parDir;
    var completeDest = destAddOnDir + parDir;
    var mainDef = new Deferred();
    
    fs.readdir(completeSrc, function(err, data){
      if (err){
        console.log(err);
        return;
      };
      var waitDefs = [];
      array.forEach(data, function(parFile){
        var def = new Deferred();
        waitDefs.push(def);
        fs.stat(completeSrc + parFile, function(err, stat){
          if(err){
            console.log(err);
            return;
          };
          if (stat.isDirectory()){
            fs.mkdir(completeDest + parFile, null, function(err){
              if (err){
                if (err.errno != 47){
                  console.log(err);
                  return;
                };
              };
              walk(parDir + parFile + "/").then(function(){
                def.resolve();
              });
            });
          }else{
            if (solString.endsWith(parFile, ".js")){
              modulizer.convertFile(completeSrc + parFile, standardConfig, completeDest + parFile, errFun);
              def.resolve();
            }else if (solString.endsWith(parFile, ".css")){
              cssAddOns += "@import url(\"" + parDir + parFile + "\");\n";
              fs.readFile(completeSrc + parFile, function(err, data){
                def.resolve();
                if (err){
                  console.log(err);
                  return;
                };
                fs.writeFile(completeDest + parFile, data);
              });
            }else{
              def.resolve();
            };
          };
        });
      });
      solPromise.allDone(waitDefs).then(function(){
        mainDef.resolve();
      });
    });
    return mainDef;
  };
  walk("").then(function(){
    fs.writeFile(destAddOnDir + "all.css", cssAddOns);
  });
  
  var allThemesStr = "";
  var allThemesJsStr = "define([], function(){ return [";
  var allThemesJsStarted = false;
  
  var srcThemeDir = srcPath + "theme/";
  var destThemeDir = destPath + "theme/";
  fs.mkdir(destThemeDir, null, function(err){
    if (err){
      if (err.errno != 47){
        console.log(err);
        return;
      };
    };
    fs.readdir(srcThemeDir, function(err, data){
      if (err){
        console.log(err);
        return;
      };
      array.forEach(data, function(parFile){
        if (solString.endsWith(parFile, ".css")){
          allThemesStr += "@import url(\"" + parFile + "\");\n";
          if (allThemesJsStarted){
            allThemesJsStr += ", ";
          };
          allThemesJsStr += "\"" + solString.cutEnd(parFile, 4) + "\"";
          allThemesJsStarted = true;
          fs.readFile(srcThemeDir + parFile, function(err, data){
            if (err){
              console.log(err);
              return;
            };
            fs.writeFile(destThemeDir + parFile, data);
          });
        };
      });
      fs.writeFile(destThemeDir + "all.css", allThemesStr);
      allThemesJsStr += "]; });";
      fs.writeFile(destThemeDir + "all.js", allThemesJsStr);
    });
  });
    

//  jshint

jshintSrcPath = genericDir + "jshint/";
jshintDestPath = srcDir + "jshint/";

modulizer.convertFile(jshintSrcPath + "jshint-2.1.4.js", {
  "return": "JSHINT"
}, jshintDestPath + "jshint.js", errFun);

// PEG.js
pegSrcPath = genericDir + "peg/";
pegDestPath = srcDir + "peg/";

modulizer.convertFile(pegSrcPath + "PEG.js", {
  "return": "PEG"
}, pegDestPath + "Peg.js", errFun);
  
});