'use strict';


const splitOnOperators = require('./splitOnOperators');

const mysql8Operators = require('./mysql-operators');
const extractCommentsAndQuotes = require('./extractCommentsAndQuotes');
const splitOnSpaces = require('./splitOnSpaces');
const isComment = require('./isComment');
const isQuoted = require('./isQuoted');
const isWhiteSpace = require('./isWhiteSpace');







function mysqlTokenizer(sqlOperators) {
    const specialChars = [',', ';', '(', ')', '='];

    const operators = Array.from(sqlOperators || mysql8Operators).concat(specialChars);

    const _splitOnOperators = splitOnOperators(operators);

    return (sql) => {
        return extractCommentsAndQuotes(sql
        ).reduce(
            (tokens, block) => (
                tokens.concat(
                    (isComment(block) || isQuoted(block)) ? block : splitOnSpaces(block))
            ), []
        ).reduce(
            (tokens, block) => (
                tokens.concat(
                    (isComment(block) || isQuoted(block) || isWhiteSpace(block)) ? block : _splitOnOperators(block))
            ), []
        );
    };
}

module.exports = exports.default = mysqlTokenizer;