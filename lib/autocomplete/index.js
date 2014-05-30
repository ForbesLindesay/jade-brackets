"use strict";

// Load dependent modules
var CodeHintManager = brackets.getModule("editor/CodeHintManager");
var HTMLUtils = brackets.getModule("language/HTMLUtils");
var htmlStructure = require('./html-structure.js');
var tags = htmlStructure.tags;
var attributes = htmlStructure.attrs;

// Register code hint providers
var tagHints = new TagHints();
var attrHints = new AttrHints();
CodeHintManager.registerHintProvider(tagHints, ["html"], 0);
CodeHintManager.registerHintProvider(attrHints, ["html"], 0);
