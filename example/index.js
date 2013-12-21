'use strict';

var CodeMirror = require('../bin/jade-code-mirror');

var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  mode: 'jade',
  lineNumbers: true
});