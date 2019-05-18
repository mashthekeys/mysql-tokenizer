'use strict';

module.exports = exports.default = {
    BinaryOrHex: /^[xXbB]/,
    Quote: /^['"`]/,
    Comment: /^(?:#|--(?=\s)|--$|\/\*)/,
    InitialCommentChar: /^[-#/]/,
    Identifier: /^[0-9A-Za-z_$\u{80}-\u{10ffff}]/u,
    Whitespace: /^[ \t\r\n]/
};