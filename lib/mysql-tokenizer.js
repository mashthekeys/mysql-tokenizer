'use strict';

const mysql8Operators = require('./mysql-operators');
const Parser = require('./token-parser');

function mysqlTokenizer(options) {
    if (Array.isArray(options)) {
        options = { operators : options };
    } else if (!options) {
        options = {};
    }

    const ParserClass = Parser.create(options.operators || mysql8Operators, options.regExp, options.commentHandlers);

    return function tokenize(sql) {
        return new ParserClass(sql).run();
    }
}

module.exports = exports.default = mysqlTokenizer;