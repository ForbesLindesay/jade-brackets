"use strict";

// Load dependent modules
var CodeHintManager = brackets.getModule("editor/CodeHintManager");
var TokenUtils = brackets.getModule("utils/TokenUtils");

var htmlStructure = require('./html-structure.js');
var tags = htmlStructure.tags;

var TAG_NAME = 'tag';

/**
 * Creates a tagInfo object and assures all the values are entered or are empty strings
 * @param {string=} tokenType what is getting edited and should be hinted
 * @param {number=} offset where the cursor is for the part getting hinted
 * @param {string=} tagName The name of the tag
 * @param {string=} attrName The name of the attribute
 * @param {string=} attrValue The value of the attribute
 * @return {{tagName:string,
 *           attr:{name:string, value:string, valueAssigned:boolean, quoteChar:string, hasEndQuote:boolean},
 *           position:{tokenType:string, offset:number}
 *         }}
 *         A tagInfo object with some context about the current tag hint.
 */
function createTagInfo(tokenType, offset, tagName, attrName, attrValue, valueAssigned, quoteChar, hasEndQuote) {
  return {
    tagName: tagName || "",
    attr: {
      name: attrName || "",
      value: attrValue || "",
      valueAssigned: valueAssigned || false,
      quoteChar: quoteChar || "",
      hasEndQuote: hasEndQuote || false
    },
    position: {
      tokenType: tokenType || "",
      offset: offset || 0
    }
  };
}

function getTagInfo(editor, pos) {
  var ctx = TokenUtils.getInitialContext(editor._codeMirror, pos);
  var offset = TokenUtils.offsetInToken(ctx);

  // Check if this is inside a style block.
  if (editor.getModeForSelection() !== "jade") {
      return createTagInfo();
  }

  if (ctx.token.type === 'tag') {
    return createTagInfo(ctx.token.type, offset, ctx.token.string)
  }

  return createTagInfo();
}

function TagHints() {
}

/**
 * Determines whether HTML tag hints are available in the current editor
 * context.
 *
 * @param {Editor} editor
 * A non-null editor object for the active window.
 *
 * @param {string} implicitChar
 * Either null, if the hinting request was explicit, or a single character
 * that represents the last insertion and that indicates an implicit
 * hinting request.
 *
 * @return {boolean}
 * Determines whether the current provider is able to provide hints for
 * the given editor context and, in case implicitChar is non- null,
 * whether it is appropriate to do so.
 */
TagHints.prototype.hasHints = function (editor, implicitChar) {
  var pos = editor.getCursorPos();

  this.tagInfo = getTagInfo(editor, pos);
  this.editor = editor;
  if (this.tagInfo.position.tokenType === TAG_NAME) {
    if (this.tagInfo.position.offset >= 0) {
      return true;
    }
  }
  return false;
};

/**
 * Returns a list of availble HTML tag hints if possible for the current
 * editor context.
 *
 * @return {jQuery.Deferred|{
 *        hints: Array.<string|jQueryObject>,
 *        match: string,
 *        selectInitial: boolean,
 *        handleWideResults: boolean}}
 * Null if the provider wishes to end the hinting session. Otherwise, a
 * response object that provides:
 * 1. a sorted array hints that consists of strings
 * 2. a string match that is used by the manager to emphasize matching
 *  substrings when rendering the hint list
 * 3. a boolean that indicates whether the first result, if one exists,
 *  should be selected by default in the hint list window.
 * 4. handleWideResults, a boolean (or undefined) that indicates whether
 *  to allow result string to stretch width of display.
 */
TagHints.prototype.getHints = function (implicitChar) {
  this.tagInfo = getTagInfo(this.editor, this.editor.getCursorPos());
  if (this.tagInfo.position.tokenType === TAG_NAME) {
    if (this.tagInfo.position.offset >= 0) {
      var query = this.tagInfo.tagName.slice(0, this.tagInfo.position.offset);
      var result = Object.keys(tags).filter(function (key) {
        return key.indexOf(query) === 0;
      }).sort();

      return {
        hints: result,
        match: query,
        selectInitial: true,
        handleWideResults: false
      };
    }
  }

  return null;
};

/**
 * Inserts a given HTML tag hint into the current editor context.
 *
 * @param {string} hint
 * The hint to be inserted into the editor context.
 *
 * @return {boolean}
 * Indicates whether the manager should follow hint insertion with an
 * additional explicit hint request.
 */
TagHints.prototype.insertHint = function (completion) {
  var start = {line: -1, ch: -1};
  var end = {line: -1, ch: -1};
  var cursor = this.editor.getCursorPos();
  var charCount = 0;

  if (this.tagInfo.position.tokenType === TAG_NAME) {
    var textAfterCursor = this.tagInfo.tagName.substr(this.tagInfo.position.offset);
    charCount = this.tagInfo.tagName.length;
  }

  end.line = start.line = cursor.line;
  start.ch = cursor.ch - this.tagInfo.position.offset;
  end.ch = start.ch + charCount;

  if (completion !== this.tagInfo.tagName) {
    if (start.ch !== end.ch) {
      this.editor.document.replaceRange(completion, start, end);
    } else {
      this.editor.document.replaceRange(completion, start);
    }
  }

  return false;
};


var tagHints = new TagHints();
CodeHintManager.registerHintProvider(tagHints, ["jade"], 0);
