// HyperMD, copyright (c) by laobubu
// Distributed under an MIT license: http://laobubu.net/HyperMD/LICENSE
//
// DESCRIPTION: Fold and Render TeX formula expressions. Works with *fold* addon.
//
// Provides *DumbRenderer* as the Default MathRenderer.
// You may use others like MathJax, KaTeX via PowerPacks
//
define(["require", "exports", "codemirror", "../core", "./fold"], function (require, exports, CodeMirror, core_1, fold_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var DEBUG = false;
    /********************************************************************************** */
    //#region Exports
    /**
     * Detect if a token is a beginning of Math, and fold it!
     *
     * @see FolderFunc in ./fold.ts
     */
    exports.MathFolder = function (stream, token) {
        var mathBeginRE = /formatting-math-begin\b/;
        if (!mathBeginRE.test(token.type))
            return null;
        var cm = stream.cm;
        var line = stream.lineNo;
        var maySpanLines = /math-2\b/.test(token.type); // $$ may span lines!
        var tokenLength = maySpanLines ? 2 : 1; // "$$" or "$"
        // CodeMirror GFM mode split "$$" into two tokens, so do a extra check.
        if (tokenLength == 2 && token.string.length == 1) {
            if (DEBUG)
                console.log("[FoldMath] $$ is splitted into 2 tokens");
            var nextToken = stream.lineTokens[stream.i_token + 1];
            if (!nextToken || !mathBeginRE.test(nextToken.type))
                return null;
        }
        // Find the position of the "$" tail and compose a range
        var end_info = stream.findNext(/formatting-math-end\b/, maySpanLines);
        var from = { line: line, ch: token.start };
        var to;
        var noEndingToken = false;
        if (end_info) {
            to = { line: end_info.lineNo, ch: end_info.token.start + tokenLength };
        }
        else if (maySpanLines) {
            // end not found, but this is a multi-line math block.
            // fold to the end of doc
            var lastLineNo = cm.lastLine();
            to = { line: lastLineNo, ch: cm.getLine(lastLineNo).length };
            noEndingToken = true;
        }
        else {
            // Hmm... corrupted math ?
            return null;
        }
        // Range is ready. request the range
        var expr_from = { line: from.line, ch: from.ch + tokenLength };
        var expr_to = { line: to.line, ch: to.ch - (noEndingToken ? 0 : tokenLength) };
        var expr = cm.getRange(expr_from, expr_to).trim();
        var foldMathAddon = exports.getAddon(cm);
        var reqAns = stream.requestRange(from, to);
        if (reqAns !== fold_1.RequestRangeResult.OK) {
            if (reqAns === fold_1.RequestRangeResult.CURSOR_INSIDE)
                foldMathAddon.editingExpr = expr; // try to trig preview event
            return null;
        }
        // Now let's make a math widget!
        var isDisplayMode = tokenLength > 1 && from.ch == 0 && (noEndingToken || to.ch >= cm.getLine(to.line).length);
        var marker = insertMathMark(cm, from, to, expr, tokenLength, isDisplayMode);
        foldMathAddon.editingExpr = null; // try to hide preview
        return marker;
    };
    /**
     * Insert a TextMarker, and try to render it with configured MathRenderer.
     */
    function insertMathMark(cm, p1, p2, expression, tokenLength, isDisplayMode) {
        var span = document.createElement("span");
        span.setAttribute("class", "hmd-fold-math math-" + (isDisplayMode ? 2 : 1));
        span.setAttribute("title", expression);
        var mathPlaceholder = document.createElement("span");
        mathPlaceholder.setAttribute("class", "hmd-fold-math-placeholder");
        mathPlaceholder.textContent = expression;
        span.appendChild(mathPlaceholder);
        if (DEBUG) {
            console.log("insert", p1, p2, expression);
        }
        var marker = cm.markText(p1, p2, {
            replacedWith: span,
        });
        span.addEventListener("click", function () { return fold_1.breakMark(cm, marker, tokenLength); }, false);
        var foldMathAddon = exports.getAddon(cm);
        var mathRenderer = foldMathAddon.createRenderer(span, isDisplayMode ? "display" : "");
        mathRenderer.onChanged = function () {
            if (mathPlaceholder) {
                span.removeChild(mathPlaceholder);
                mathPlaceholder = null;
            }
            marker.changed();
        };
        marker.on("clear", function () { mathRenderer.clear(); });
        marker["mathRenderer"] = mathRenderer;
        core_1.tryToRun(function () {
            if (DEBUG)
                console.log("[MATH] Trying to render ", expression);
            if (!mathRenderer.isReady())
                return false;
            mathRenderer.startRender(expression);
            return true;
        }, 5, function () {
            marker.clear();
            if (DEBUG) {
                console.log("[MATH] engine always not ready. faild to render ", expression, p1);
            }
        });
        return marker;
    }
    exports.insertMathMark = insertMathMark;
    //#endregion
    fold_1.registerFolder("math", exports.MathFolder, true);
    /********************************************************************************** */
    //#region Default Renderer
    var DumbRenderer = /** @class */ (function () {
        function DumbRenderer(container, mode) {
            var _this = this;
            this.container = container;
            var img = document.createElement("img");
            img.setAttribute("class", "hmd-math-dumb");
            img.addEventListener("load", function () { if (_this.onChanged)
                _this.onChanged(_this.last_expr); }, false);
            this.img = img;
            container.appendChild(img);
        }
        DumbRenderer.prototype.startRender = function (expr) {
            this.last_expr = expr;
            this.img.src = "https://latex.codecogs.com/gif.latex?" + encodeURIComponent(expr);
        };
        DumbRenderer.prototype.clear = function () {
            this.container.removeChild(this.img);
        };
        /** indicate that if the Renderer is ready to execute */
        DumbRenderer.prototype.isReady = function () {
            return true; // I'm always ready!
        };
        return DumbRenderer;
    }());
    exports.DumbRenderer = DumbRenderer;
    exports.defaultOption = {
        renderer: DumbRenderer,
        onPreview: null,
        onPreviewEnd: null,
    };
    exports.suggestedOption = {};
    core_1.suggestedEditorConfig.hmdFoldMath = exports.suggestedOption;
    CodeMirror.defineOption("hmdFoldMath", exports.defaultOption, function (cm, newVal) {
        ///// convert newVal's type to `Partial<Options>`, if it is not.
        if (!newVal) {
            newVal = {};
        }
        else if (typeof newVal === "function") {
            newVal = { renderer: newVal };
        }
        ///// apply config and write new values into cm
        var inst = exports.getAddon(cm);
        for (var k in exports.defaultOption) {
            inst[k] = (k in newVal) ? newVal[k] : exports.defaultOption[k];
        }
    });
    //#endregion
    /********************************************************************************** */
    //#region Addon Class
    var FoldMath = /** @class */ (function () {
        function FoldMath(cm) {
            var _this = this;
            this.cm = cm;
            new core_1.FlipFlop(
            /** CHANGED */ function (expr) { _this.onPreview && _this.onPreview(expr); }, 
            /** HIDE    */ function () { _this.onPreviewEnd && _this.onPreviewEnd(); }, null).bind(this, "editingExpr");
        }
        FoldMath.prototype.createRenderer = function (container, mode) {
            var RendererClass = this.renderer || DumbRenderer;
            return new RendererClass(container, mode);
        };
        return FoldMath;
    }());
    exports.FoldMath = FoldMath;
    //#endregion
    /** ADDON GETTER (Singleton Pattern): a editor can have only one FoldMath instance */
    exports.getAddon = core_1.Addon.Getter("FoldMath", FoldMath, exports.defaultOption /** if has options */);
});
