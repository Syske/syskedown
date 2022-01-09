define(["require", "exports", "./core/utils", "./core/quick", "./core/cm_utils", "./core/line-spans", "./core/addon"], function (require, exports, utils_1, quick_1, cm_utils_1, line_spans_1, Addon) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    __export(utils_1);
    __export(quick_1);
    __export(cm_utils_1);
    __export(line_spans_1);
    exports.Addon = Addon;
});
