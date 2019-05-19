'use strict';


const MysqlRegExp = require('./regexp');

// Token RegExps must have the 'g' and 'y' flags set.
const StartCommentSQL92 = /(?:#|--|\/\*)/gy;

module.exports = exports.default = {
    Initial: MysqlRegExp.Initial,

    Token: Object.assign({}, MysqlRegExp.Token, { StartComment: StartCommentSQL92 })
};
