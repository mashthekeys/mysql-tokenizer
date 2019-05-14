'use strict';

module.exports = exports.default = function isWhiteSpace(c) {
    // SQL whitespace tokens can be identified by the first character alone
    c = c[0];
    return c === ' ' || c === '\t' || c === '\r' || c === '\n';
};
