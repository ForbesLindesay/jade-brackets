
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

  this.tagInfo = HTMLUtils.getTagInfo(editor, pos);
  this.editor = editor;
  if (implicitChar === null) {
    if (this.tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
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
    if (implicitChar === "<") {
      this.exclusion = this.tagInfo.tagName;
      return true;
    }
    return false;
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

  this.tagInfo = HTMLUtils.getTagInfo(this.editor, this.editor.getCursorPos());
  if (this.tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
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
  var start = {line: -1, ch: -1},
    end = {line: -1, ch: -1},
    cursor = this.editor.getCursorPos(),
    charCount = 0;

  if (this.tagInfo.position.tokenType === HTMLUtils.TAG_NAME) {
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
