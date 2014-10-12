//Adding an overlay to the js CodeMirror mode

(function (CodeMirror, getMode) {
  if (!CodeMirror.overlayMode) return;
  var jade = CodeMirror.getMode({}, 'jade');
  CodeMirror.getMode = function (options, spec) {
    var mode = getMode.apply(this, arguments);
    if (mode && mode.name === 'javascript' && !mode.hasJadeSupport) {
      //{ startState: startState, copyState: copyState, token: nextToken }
      mode = CodeMirror.overlayMode(mode, {
        startState: function () {
          return {overlay: false, jade: null};
        },
        copyState: function (s) {
          return {overlay: s.overlay, jade: s.jade ? jade.copyState(s.jade) : s.jade};
        },
        token: function(stream, state) {
          if (!state.overlay && stream.match('jade`')) {
            state.overlay = true;
            state.jade = jade.startState();
            return null;
          }
          if (state.overlay && stream.match('`')) {
            state.overlay = false;
            state.jade = null;
            return null;
          }
          if (state.overlay) {
            var token = jade.token(stream, state.jade);
            if (stream.current().indexOf('`') !== -1) {
              state.overlay = false;
              state.jade = null;
            }
            return token ? token : 'jade-default';
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
