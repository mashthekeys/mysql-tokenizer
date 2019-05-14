'use strict';


module.exports = exports.default = {
    BinaryOrHex: /^[xXbB]/,
    Quote: /^['"`]/,
    Comment: /^(?:#|--(?=\s)|--$|\/\*)/,
    InitialCommentChar: /^[-#/]/
};