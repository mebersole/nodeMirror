var helperDefine = function(parRequire, parFactory){
  if (typeof define == "function"){
    // amd part
    define(parRequire, parFactory);
  }else{
    // commonjs part
    var parAr = [];
    var i = 0;
    for (i = 0; i < parRequire.length; ++i){
      parAr.push(require(parRequire[i]));
    };
    module.exports = parFactory.apply(undefined, parAr);
  };
};
helperDefine(["codemirror/CodeMirror"], function(CodeMirror){
CodeMirror.runMode = function(string, modespec, callback, options) {
  var mode = CodeMirror.getMode(CodeMirror.defaults, modespec);
  var ie = /MSIE \d/.test(navigator.userAgent);
  var ie_lt9 = ie && (document.documentMode == null || document.documentMode < 9);

  if (callback.nodeType == 1) {
    var tabSize = (options && options.tabSize) || CodeMirror.defaults.tabSize;
    var node = callback, col = 0;
    node.innerHTML = "";
    callback = function(text, style) {
      if (text == "\n") {
        // Emitting LF or CRLF on IE8 or earlier results in an incorrect display.
        // Emitting a carriage return makes everything ok.
        node.appendChild(document.createTextNode(ie_lt9 ? '\r' : text));
        col = 0;
        return;
      }
      var content = "";
      // replace tabs
      for (var pos = 0;;) {
        var idx = text.indexOf("\t", pos);
        if (idx == -1) {
          content += text.slice(pos);
          col += text.length - pos;
          break;
        } else {
          col += idx - pos;
          content += text.slice(pos, idx);
          var size = tabSize - col % tabSize;
          col += size;
          for (var i = 0; i < size; ++i) content += " ";
          pos = idx + 1;
        }
      }

      if (style) {
        var sp = node.appendChild(document.createElement("span"));
        sp.className = "cm-" + style.replace(/ +/g, " cm-");
        sp.appendChild(document.createTextNode(content));
      } else {
        node.appendChild(document.createTextNode(content));
      }
    };
  }

  var lines = CodeMirror.splitLines(string), state = CodeMirror.startState(mode);
  for (var i = 0, e = lines.length; i < e; ++i) {
    if (i) callback("\n");
    var stream = new CodeMirror.StringStream(lines[i]);
    while (!stream.eol()) {
      var style = mode.token(stream, state);
      callback(stream.current(), style, i, stream.start, state);
      stream.start = stream.pos;
    }
  }
};

  return CodeMirror;
});
