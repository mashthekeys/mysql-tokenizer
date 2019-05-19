'use strict';

const regexp = require('../lib/regexp');
const handcoded = require('../lib/regexp-handcoded');
const functional = handcoded.functional;
const object = handcoded.object;
const runTests = require('./runTests');
const runTestsAndExit = runTests.runTestsAndExit;

const results = {};

function timeRegexp(label, regexp, fn, strings) {
    const startTime = Date.now();
    for (let i = 0; i < 10000; ++i) strings.forEach(string => {
        for (let j = 0; j < 1000; ++j) regexp[fn](string);
    });

    const endTime = Date.now();

    console.log(`${label} ${fn} `.padEnd(60, '='));
    const elapsed = endTime - startTime;
    console.log(elapsed);
    console.log(''.padEnd(60, '='));

    results[`${label} ${fn}`] = elapsed;

    return true;
}

const testBank = [
    // General strings which don't match any expression
    "", "...", "...long string".padEnd(4096),
    // Strings which should match BinaryOrHex
    "b", "b'101'", "X'1234'", 'xylophone', 'BINARY',
    // Strings which should match Quote
    '"', "'", '`', '`1234`', "'...'",
    // Strings which should match PossibleComment and Comment
    '/*...*/', '#1234', '--    ', '--\n', '--', '/*',
    // Strings which should match PossibleComment but /not/ Comment
    '/', '/1', '/-', '-', '-0', '--blah',
    // Strings which should match Whitespace
    ' ', '\t', '\r', '\n', '\r\n', ' 1234 5678 qwertyuiop'
];

const regexpList = Object.keys(functional);
// const regexpList = ['BinaryOrHex'];

const test = [];

// Custom test for case insensitive version of the RegExp
test.push({
    name: `CUSTOM REGEXP /^[XB]/i test`,
    function: timeRegexp,
    arguments: [`regexp /^[XB]/i`, /^[XB]/i, "test", testBank],
    output: true
});
test.push({
    name: `CUSTOM REGEXP /^[XB]/i exec`,
    function: timeRegexp,
    arguments: [`regexp /^[XB]/i`, /^[XB]/i, "exec", testBank],
    output: true
});


regexpList.forEach(member => {
    test.push({
        name: `REGEXP ${member} test`,
        function: timeRegexp,
        arguments: [`regexp ${member}`, regexp[member], "test", testBank],
        output: true
    });

    test.push({
        name: `FUNCTIONAL ${member} test`,
        function: timeRegexp,
        arguments: [`functional ${member}`, functional[member], "test", testBank],
        output: true
    });
    test.push({
        name: `OBJECT ${member} test`,
        function: timeRegexp,
        arguments: [`object ${member}`, object[member], "test", testBank],
        output: true
    });

    test.push({
        name: `REGEXP ${member} exec`,
        function: timeRegexp,
        arguments: [`regexp ${member}`, regexp[member], "exec", testBank],
        output: true
    });
    test.push({
        name: `FUNCTIONAL ${member} exec`,
        function: timeRegexp,
        arguments: [`functional ${member}`, functional[member], "exec", testBank],
        output: true
    });
    test.push({
        name: `OBJECT ${member} exec`,
        function: timeRegexp,
        arguments: [`object ${member}`, object[member], "exec", testBank],
        output: true
    });
});

runTests(test);

console.log(results);
