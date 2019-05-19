'use strict';

const mysqlOperations = require('../lib/mysql-operators');
const mysqlTokenize = require('../lib/mysql-tokenizer')(mysqlOperations);
const runTestsAndExit = require('./runTests').runTestsAndExit;

const testSet = require('./data/tokenizer-set');

const testOptions = {haltOnFail: true, quiet: false, verbose: true, width: 'auto'};

console.log(testOptions);

runTestsAndExit(testSet(mysqlTokenize), testOptions);
