"use strict";

// Load dependent modules
var CodeHintManager = brackets.getModule("editor/CodeHintManager");

var htmlStructure = require('./html-structure.js');
var tags = htmlStructure.tags;

/**
 * @constructor
 */
function TagHints() {
  this.exclusion = null;
}

/**
 * Check whether the exclusion is still the same as text after the cursor.
 * If not, reset it to null.
 */
TagHints.prototype.updateExclusion = function () {
  var textAfterCursor;
  if (this.exclusion && this.tagInfo) {
    textAfterCursor = this.tagInfo.tagName.substr(this.tagInfo.position.offset);
    if (!CodeHintManager.hasValidExclusion(this.exclusion, textAfterCursor)) {
      this.exclusion = null;
    }
  }
};

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

  this.tagInfo = JadeUtils.getTagInfo(editor, pos);
  this.editor = editor;
  if (implicitChar === null) {
    if (this.tagInfo.position.tokenType === JadeUtils.TAG_NAME) {
      if (this.tagInfo.position.offset >= 0) {
        if (this.tagInfo.position.offset === 0) {
          this.exclusion = this.tagInfo.tagName;
        } else {
          this.updateExclusion();
        }
        return true;
      }
    }
    return false;
  } else {
    this.exclusion = this.tagInfo.tagName;
    return true;
  }
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
  var query,
    result;

  this.tagInfo = JadeUtils.getTagInfo(this.editor, this.editor.getCursorPos());
  if (this.tagInfo.position.tokenType === JadeUtils.TAG_NAME) {
    if (this.tagInfo.position.offset >= 0) {
      this.updateExclusion();
      query = this.tagInfo.tagName.slice(0, this.tagInfo.position.offset);
      result = $.map(tags, function (value, key) {
        if (key.indexOf(query) === 0) {
          return key;
        }
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

  if (this.tagInfo.position.tokenType === JadeUtils.TAG_NAME) {
  var textAfterCursor = this.tagInfo.tagName.substr(this.tagInfo.position.offset);
    if (CodeHintManager.hasValidExclusion(this.exclusion, textAfterCursor)) {
      charCount = this.tagInfo.position.offset;
    } else {
      charCount = this.tagInfo.tagName.length;
    }
  }

  end.line = start.line = cursor.line;
  start.ch = cursor.ch - this.tagInfo.position.offset;
  end.ch = start.ch + charCount;

  if (this.exclusion || completion !== this.tagInfo.tagName) {
    if (start.ch !== end.ch) {
      this.editor.document.replaceRange(completion, start, end);
    } else {
      this.editor.document.replaceRange(completion, start);
    }
    this.exclusion = null;
  }

  return false;
};


var tagHints = new TagHints();
CodeHintManager.registerHintProvider(tagHints, ["jade"], 0);

var JadeUtils = (function () {
    "use strict";

    var exports = {};

    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        TokenUtils = brackets.getModule("utils/TokenUtils");

    // Constants
    var TAG_NAME = "tag",
        CLOSING_TAG = "closingTag",
        ATTR_NAME = "attr.name",
        ATTR_VALUE = "attr.value";

    // Regular expression for token types with "tag" prefixed
    var tagPrefixedRegExp = /^tag/;

   /**
     * @private
     * Sometimes as attr values are getting typed, if the quotes aren't balanced yet
     * some extra 'non attribute value' text gets included in the token. This attempts
     * to assure the attribute value we grab is always good
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return { val:{string}, offset:{number}}
     */
    function _extractAttrVal(ctx) {
        var attrValue = ctx.token.string,
            startChar = attrValue.charAt(0),
            endChar = attrValue.charAt(attrValue.length - 1),
            offset = TokenUtils.offsetInToken(ctx),
            foundEqualSign = false;

        //If this is a fully quoted value, return the whole
        //thing regardless of position
        if (attrValue.length > 1 &&
                (startChar === "'" || startChar === '"') &&
                endChar === startChar) {

            // Find an equal sign before the end quote. If found,
            // then the user may be entering an attribute value right before
            // another attribute and we're getting a false balanced string.
            // An example of this case is <link rel" href="foo"> where the
            // cursor is right after the first double quote.
            foundEqualSign = (attrValue.match(/\=\s*['"]$/) !== null);

            if (!foundEqualSign) {
                //strip the quotes and return;
                attrValue = attrValue.substring(1, attrValue.length - 1);
                offset = offset - 1 > attrValue.length ? attrValue.length : offset - 1;
                return {val: attrValue, offset: offset, quoteChar: startChar, hasEndQuote: true};
            }
        }

        if (foundEqualSign) {
            var spaceIndex = attrValue.indexOf(" "),
                bracketIndex = attrValue.indexOf(">"),
                upToIndex = (spaceIndex !== -1 && spaceIndex < bracketIndex) ? spaceIndex : bracketIndex;
            attrValue = attrValue.substring(0, (upToIndex > offset) ? upToIndex : offset);
        } else if (offset > 0 && (startChar === "'" || startChar === '"')) {
            //The att value is getting edit in progress. There is possible extra
            //stuff in this token state since the quote isn't closed, so we assume
            //the stuff from the quote to the current pos is definitely in the attribute
            //value.
            attrValue = attrValue.substring(0, offset);
        }

        //If the attrValue start with a quote, trim that now
        startChar = attrValue.charAt(0);
        if (startChar === "'" || startChar === '"') {
            attrValue = attrValue.substring(1);
            offset--;
        } else {
            startChar = "";
            // Make attr value empty and set offset to zero if it has the ">"
            // which is the closing of the tag.
            if (endChar === ">") {
                attrValue = "";
                offset = 0;
            }
        }

        return {val: attrValue, offset: offset, quoteChar: startChar, hasEndQuote: false};
    }

    /**
     * @private
     * Gets the tagname from where ever you are in the currect state
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {string}
     */
    function _extractTagName(ctx) {
        var mode = ctx.editor.getMode(),
            innerModeData = CodeMirror.innerMode(mode, ctx.token.state);

        if (ctx.token.type === "tag bracket") {
            return innerModeData.state.tagName;
        }

        // If the ctx is inside the tag name of an end tag, innerModeData.state.tagName is
        // undefined. So return token string as the tag name.
        return innerModeData.state.tagName || ctx.token.string;
    }

    /**
     * Compiles a list of used attributes for a given tag
     * @param {CodeMirror} editor An instance of a CodeMirror editor
     * @param {ch:{string}, line:{number}} pos A CodeMirror position
     * @return {Array.<string>} A list of the used attributes inside the current tag
     */
    function getTagAttributes(editor, pos) {
        var attrs       = [],
            backwardCtx = TokenUtils.getInitialContext(editor._codeMirror, pos),
            forwardCtx  = $.extend({}, backwardCtx);

        if (editor.getModeForSelection() === "jade") {
            if (backwardCtx.token && !tagPrefixedRegExp.test(backwardCtx.token.type)) {
                while (TokenUtils.movePrevToken(backwardCtx) && !tagPrefixedRegExp.test(backwardCtx.token.type)) {
                    if (backwardCtx.token.type === "error" && backwardCtx.token.string.indexOf("<") === 0) {
                        break;
                    }
                    if (backwardCtx.token.type === "attribute") {
                        attrs.push(backwardCtx.token.string);
                    }
                }

                while (TokenUtils.moveNextToken(forwardCtx) && !tagPrefixedRegExp.test(forwardCtx.token.type)) {
                    if (forwardCtx.token.type === "attribute") {
                        // If the current tag is not closed, codemirror may return the next opening
                        // tag as an attribute. Stop the search loop in that case.
                        if (forwardCtx.token.string.indexOf("<") === 0) {
                            break;
                        }
                        attrs.push(forwardCtx.token.string);
                    } else if (forwardCtx.token.type === "error") {
                        if (forwardCtx.token.string.indexOf("<") === 0 || forwardCtx.token.string.indexOf(">") === 0) {
                            break;
                        }
                        // If we type the first letter of the next attribute, it comes as an error
                        // token. We need to double check for possible invalidated attributes.
                        if (/\S/.test(forwardCtx.token.string) &&
                                forwardCtx.token.string.indexOf("\"") === -1 &&
                                forwardCtx.token.string.indexOf("'") === -1 &&
                                forwardCtx.token.string.indexOf("=") === -1) {
                            attrs.push(forwardCtx.token.string);
                        }
                    }
                }
            }
        }

        return attrs;
    }

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
        return { tagName: tagName || "",
                 attr:
                    { name: attrName || "",
                      value: attrValue || "",
                      valueAssigned: valueAssigned || false,
                      quoteChar: quoteChar || "",
                      hasEndQuote: hasEndQuote || false },
                 position:
                    { tokenType: tokenType || "",
                      offset: offset || 0 } };
    }

    /**
     * @private
     * Gets the taginfo starting from the attribute value and moving backwards
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @return {string}
     */
    function _getTagInfoStartingFromAttrValue(ctx) {
        // Assume we in the attr value
        // and validate that by going backwards
        var attrInfo = _extractAttrVal(ctx),
            attrVal = attrInfo.val,
            offset = attrInfo.offset,
            quoteChar = attrInfo.quoteChar,
            hasEndQuote = attrInfo.hasEndQuote,
            strLength = ctx.token.string.length;

        if ((ctx.token.type === "string" || ctx.token.type === "error") &&
                ctx.pos.ch === ctx.token.end && strLength > 1) {
            var firstChar = ctx.token.string[0],
                lastChar = ctx.token.string[strLength - 1];

            // We get here only when the cursor is immediately on the right of the end quote
            // of an attribute value. So we want to return an empty tag info so that the caller
            // can dismiss the code hint popup if it is still open.
            if (firstChar === lastChar && (firstChar === "'" || firstChar === "\"")) {
                return createTagInfo();
            }
        }

        //Move to the prev token, and check if it's "="
        if (!TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx) || ctx.token.string !== "=") {
            return createTagInfo();
        }

        //Move to the prev token, and check if it's an attribute
        if (!TokenUtils.moveSkippingWhitespace(TokenUtils.movePrevToken, ctx) || ctx.token.type !== "attribute") {
            return createTagInfo();
        }

        var attrName = ctx.token.string;
        var tagName = _extractTagName(ctx);

        //We're good.
        return createTagInfo(ATTR_VALUE, offset, tagName, attrName, attrVal, true, quoteChar, hasEndQuote);
    }

    /**
     * @private
     * Gets the taginfo starting from the attribute name and moving forwards
     * @param {editor:{CodeMirror}, pos:{ch:{string}, line:{number}}, token:{object}} context
     * @param {boolean} isPriorAttr indicates whether we're getting info for a prior attribute
     * @return {string}
     */
    function _getTagInfoStartingFromAttrName(ctx, isPriorAttr) {
        //Verify We're in the attribute name, move forward and try to extract the rest of
        //the info. If the user it typing the attr the rest might not be here
        if (isPriorAttr === false && ctx.token.type !== "attribute") {
            return createTagInfo();
        }

        var tagName = _extractTagName(ctx);
        var attrName = ctx.token.string;
        var offset = TokenUtils.offsetInToken(ctx);

        if (!TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx) || ctx.token.string !== "=") {
            // If we're checking for a prior attribute and the next token we get is a tag or an html comment or
            // an undefined token class, then we've already scanned past our original cursor location.
            // So just return an empty tag info.
            if (isPriorAttr &&
                    (!ctx.token.type ||
                    (ctx.token.type && ctx.token.type !== "attribute" &&
                        ctx.token.type.indexOf("error") === -1 &&
                        ctx.token.string.indexOf("<") !== -1))) {
                return createTagInfo();
            }
            return createTagInfo(ATTR_NAME, offset, tagName, attrName);
        }

        if (!TokenUtils.moveSkippingWhitespace(TokenUtils.moveNextToken, ctx)) {
            return createTagInfo(ATTR_NAME, offset, tagName, attrName);
        }
        //this should be the attrvalue
        var attrInfo = _extractAttrVal(ctx),
            attrVal = attrInfo.val,
            quoteChar = attrInfo.quoteChar,
            hasEndQuote = attrInfo.hasEndQuote;

        return createTagInfo(ATTR_NAME, offset, tagName, attrName, attrVal, true, quoteChar, hasEndQuote);
    }

    /**
     * Figure out if we're in a tag, and if we are return info about it
     * An example token stream for this tag is <span id="open-files-disclosure-arrow"></span> :
     *      className:tag       string:"<span"
     *      className:          string:" "
     *      className:attribute string:"id"
     *      className:          string:"="
     *      className:string    string:""open-files-disclosure-arrow""
     *      className:tag       string:"></span>"
     * @param {Editor} editor An instance of a Brackets editor
     * @param {{ch: number, line: number}} constPos  A CM pos (likely from editor.getCursorPos())
     * @return {{tagName:string,
     *           attr:{name:string, value:string, valueAssigned:boolean, quoteChar:string, hasEndQuote:boolean},
     *           position:{tokenType:string, offset:number}
     *         }}
     *         A tagInfo object with some context about the current tag hint.
     */
    function getTagInfo(editor, constPos) {
        // We're going to be changing pos a lot, but we don't want to mess up
        // the pos the caller passed in so we use extend to make a safe copy of it.
        var pos = $.extend({}, constPos),
            ctx = TokenUtils.getInitialContext(editor._codeMirror, pos),
            tempCtx = null,
            offset = TokenUtils.offsetInToken(ctx),
            tagInfo;

        // Check if this is inside a style block.
        if (editor.getModeForSelection() !== "jade") {
            return createTagInfo();
        }

        if (ctx.token.type === 'tag') {
          return createTagInfo(ctx.token.type, offset, ctx.token.string)
        }

        return createTagInfo();
    }



    /**
     * Returns an Array of info about all blocks whose token mode name matches that passed in,
     * in the given Editor's HTML document (assumes the Editor contains HTML text).
     * @param {!Editor} editor - the editor containing the HTML text
     * @param {string} modeName - the mode name of the tokens to look for
     * @return {Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, text:string}>}
     */
    function findBlocks(editor, modeName) {
        // Start scanning from beginning of file
        var ctx = TokenUtils.getInitialContext(editor._codeMirror, {line: 0, ch: 0}),
            blocks = [],
            currentBlock = null,
            inBlock = false,
            outerMode = editor._codeMirror.getMode(),
            tokenModeName,
            previousMode;

        while (TokenUtils.moveNextToken(ctx, false)) {
            tokenModeName = CodeMirror.innerMode(outerMode, ctx.token.state).mode.name;
            if (inBlock) {
                if (!currentBlock.end) {
                    // Handle empty blocks
                    currentBlock.end = currentBlock.start;
                }
                // Check for end of this block
                if (tokenModeName === previousMode) {
                    // currentBlock.end is already set to pos of the last token by now
                    currentBlock.text = editor.document.getRange(currentBlock.start, currentBlock.end);
                    inBlock = false;
                } else {
                    currentBlock.end = { line: ctx.pos.line, ch: ctx.pos.ch };
                }
            } else {
                // Check for start of a block
                if (tokenModeName === modeName) {
                    currentBlock = {
                        start: { line: ctx.pos.line, ch: ctx.pos.ch }
                    };
                    blocks.push(currentBlock);
                    inBlock = true;
                } else {
                    previousMode = tokenModeName;
                }
                // else, random token: ignore
            }
        }

        return blocks;
    }

    /**
     * Returns an Array of info about all <style> blocks in the given Editor's HTML document (assumes
     * the Editor contains HTML text).
     * @param {!Editor} editor
     * @return {Array.<{start:{line:number, ch:number}, end:{line:number, ch:number}, text:string}>}
     */
    function findStyleBlocks(editor) {
        return findBlocks(editor, "css");
    }


    // Define public API
    exports.TAG_NAME         = TAG_NAME;
    exports.CLOSING_TAG      = CLOSING_TAG;
    exports.ATTR_NAME        = ATTR_NAME;
    exports.ATTR_VALUE       = ATTR_VALUE;

    exports.getTagInfo       = getTagInfo;
    exports.getTagAttributes = getTagAttributes;
    //The createTagInfo is really only for the unit tests so they can make the same structure to
    //compare results with
    exports.createTagInfo   = createTagInfo;
    exports.findStyleBlocks = findStyleBlocks;
    exports.findBlocks      = findBlocks;
  return exports;
}());
