//Adding an overlay to the js CodeMirror mode

(function (CodeMirror, getMode) {
  var jade = CodeMirror.getMode({}, 'jade');
  CodeMirror.getMode = function (options, spec) {
    var mode = getMode.apply(this, arguments);
    console.log('getMode:');
    console.dir(mode && mode.name);
    if (mode && mode.name === 'javascript' && !mode.hasJadeSupport) {
      //{ startState: startState, copyState: copyState, token: nextToken }
      mode = CodeMirror.overlayMode(mode, {
        startState: function () {
          return {overlay: false, jade: null};
        },
        token: function(stream, state) {
          if (!state.overlay && stream.match('jade`')) {
            state.overlay = true;
            // state.jade = jade.startState();
            return null;
          }
          if (state.overlay && stream.match('`')) {
            state.overlay = false;
            state.jade = null;
            return null;
          }
          if (state.overlay) {
            stream.skipTo('`') || stream.skipToEnd();
            if (!stream.current()) stream.next();
            return 'error';
          } else {
            stream.skipTo('j') || stream.skipToEnd();
            if (!stream.current()) stream.next();
            return null;
          }
        }
      });
      mode.name = 'javascript';
      mode.hasJadeSupport = true;
    }
    return mode;
  };
}(CodeMirror, CodeMirror.getMode));

