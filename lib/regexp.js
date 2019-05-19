'use strict';


module.exports = exports.default = {
    // Initial RegExps must start with a '^' and match at most one character.
    Initial: {
        BinaryOrHex: /^[xXbB]/,

        Identifier: /^[0-9A-Za-z_$\u{80}-\u{10ffff}]/u,

        PossibleComment: /^[-#/]/,

        Punctuation: /^[-:!#$%&()*+,.\/;<=>?[\]^{|}~]/,

        Quote: /^['"`]/,

        Whitespace: /^[ \t\r\n]/
    },

    // Token RegExps must have the 'g' and 'y' flags set.
    Token: {
        HexNumber: /0x[0-9A-Fa-f]+/gy,

        Identifier: /[0-9A-Za-z_$\u{80}-\u{10ffff}]+/guy,

        // Allows the characters of IdentifierChar and also '.'
        IdentifierAfterAt: /[.0-9A-Za-z_$\u{80}-\u{10ffff}]+/guy,

        Number: /(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE]-?[0-9]*)?/gy,

        StartComment: /(?:#|--(?=\s)|--$|\/\*)/gy,

        Whitespace: /[ \t\r\n]+/gy
    }
};
