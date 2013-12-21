# jade-brackets

This is the official jade plugin for [Brackets](http://brackets.io/).  This repository also houses the code mirror mode (in lib/mode.js) and the code for highlight-jade.

Brackets is the recommended editor for jade.

[![Build Status](https://travis-ci.org/ForbesLindesay/jade-brackets.png?branch=master)](https://travis-ci.org/ForbesLindesay/jade-brackets)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/jade-brackets.png)](https://gemnasium.com/ForbesLindesay/jade-brackets)

## highlight-jade

A simple syntax highlighter for jade.

[![NPM version](https://badge.fury.io/js/jade-brackets.png)](http://badge.fury.io/js/jade-brackets)

### Installation

```
npm install highlight-jade
```

### Usage

```js
var jade = require('highlight-jade');

// Optionally register additional languages to highlight filters etc. (by default html, js, css and markdown are supported)
jade.loadMode('java');

// Get the html code produced from highlighting using jade
var html = jade('string of jade code here', {options});
```

## License

MIT