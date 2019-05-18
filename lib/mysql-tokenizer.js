'use strict';


const mysql8Operators = require('./mysql-operators');
const Parser = require('./token-parser');

function mysqlTokenizer(operatorList) {
    const ParserClass = Parser.create(operatorList || mysql8Operators);

    return function tokenize(sql) {
        return new ParserClass(sql).run();
    }
}

module.exports = exports.default = mysqlTokenizer;