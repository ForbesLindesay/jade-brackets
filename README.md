# Jade Tools

This repository houses the source code that generates three different tools to help you program in jade:

 - jade-brackets: the official jade plugin for the brackets editor
 - jade-highlight: a syntax highlighter for highlighting jade in node.js
 - jade-code-mirror: a browserifyable npm library that adds jade support to code-mirror

There's also the raw CodeMirror mode in /lib/mode.js

[![Build Status](https://travis-ci.org/ForbesLindesay/jade-brackets.png?branch=master)](https://travis-ci.org/ForbesLindesay/jade-brackets)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/jade-brackets.png)](https://gemnasium.com/ForbesLindesay/jade-brackets)

## jade-brackets

This is the official jade plugin for [Brackets](http://brackets.io/).  Brackets is the recommended editor for jade.


## jade-highlight

A simple syntax highlighter for jade.

[![NPM version](https://badge.fury.io/js/jade-highlight.png)](http://badge.fury.io/js/jade-highlight)

### Installation

```
npm install jade-highlight
```

### Usage

```js
var jade = require('jade-highlight');

// Optionally register additional languages to highlight filters etc. (by default html, js, css and markdown are supported)
jade.loadMode('java');

// Get the html code produced from highlighting using jade
var html = jade('string of jade code here', {options});
```

## jade-code-mirror

A code mirror mode for jade neatly packaged as a proper little npm module with a peer dependency.

### Installation

```
npm install jade-code-mirror
```

### Usage

```js
var CodeMirror = require('jade-code-mirror');

var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  mode: 'jade',
  lineNumbers: true
});
```

## License

MIT
