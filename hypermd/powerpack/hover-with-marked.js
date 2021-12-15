// HyperMD, copyright (c) by laobubu
// Distributed under an MIT license: http://laobubu.net/HyperMD/LICENSE
//
// POWERPACK for "addon/hover"
//
// Render tooltip Markdown to HTML, with marked
//
define(["require", "exports", "../addon/hover", "marked"], function (require, exports, hover_1, marked) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    if (typeof marked == "function") {
        // Use marked to render Hover tooltip content
        hover_1.defaultOption.convertor = function (footnote, text) {
            if (!text)
                return null;
            return marked(text);
        };
    }
    else {
        console.error("[HyperMD] PowerPack hover-with-marked loaded, but marked not found.");
    }
});
