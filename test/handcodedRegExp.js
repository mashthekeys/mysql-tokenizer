'use strict';

const regexp = require('../lib/regexp');
const handcoded = require('../lib/regexp-handcoded');
const functional = handcoded.functional;
const runTestsAndExit = require('./runTests').runTestsAndExit;

function compareRegexp(regexp, mockRegexp, string) {
    // return function() {
        const result1 = regexp.exec(string);
        const result2 = mockRegexp.exec(string);

        let isPass, failReason = undefined;

        if (result1 == null || result2 == null) {
            isPass = result2 === result1;
            if (!isPass) failReason = `Type does not match: ${result1 == null ? String(result1) : typeof result1} !== ${result2 == null ? String(result2) : typeof result2}`;
        } else if (result1.length !== result2.length) {
            isPass = false;
            failReason = `Lengths do not match: ${result1.length} !== ${result2.length}`;
        } else {
            failReason = `Values do not match: ${JSON.stringify(result1)} !== ${JSON.stringify(result2)}`;
            isPass = Array.from(result1).every((value1, index) => {
                if (value1 !== result2[index]) {
                    failReason += `\nValue at ${index} is ${value1} !== ${result2[index]}`;
                }
                return value1 === result2[index];
            });
            if (isPass) failReason = undefined;
        }
        return { isPass, failReason };
    // };
}

const testBank = [
    // General strings which don't match any expression
    "", "...",
    // Strings which should match BinaryOrHex
    "b", "b'101'", "X'1234'", 'xylophone', 'BINARY',
    // Strings which should match Quote
    '"', "'", '`', '`1234`', "'...'",
    // Strings which should match InitialCommentChar and Comment
    '/*...*/', '#1234', '--    ', '--\n', '--', '/*',
    // Strings which should match InitialCommentChar but /not/ Comment
    '/', '/1', '/-', '-', '-0', '--blah',
    // Strings which should match Whitespace
    ' ', '\t', '\r', '\n', '\r\n', ' 1234 5678 qwertyuiop'
];

const regexpList = Object.keys(functional);

const test = [];

regexpList.forEach(member => {
    testBank.forEach((testStr, index) => test.push({
        name: `compareRegexp ${member} test ${index + 1}`,
        function: compareRegexp,
        arguments: [regexp[member], functional[member], testStr],
        output: { isPass: true, failReason: undefined }
    }));
});

runTestsAndExit(test);
/*

runTestsAndExit([
    {
        name: "compareRegexp BinaryOrHex 1",
        function: compareRegexp,
        arguments: [regexp.BinaryOrHex, functional.BinaryOrHex, "b"],
        output: { isPass: true, failReason: undefined }
    },
    {
        name: "compareRegexp BinaryOrHex 2",
        function: compareRegexp,
        arguments: [regexp.BinaryOrHex, functional.BinaryOrHex, "b'101'"],
        output: { isPass: true, failReason: undefined }
    },
    {
        name: "compareRegexp BinaryOrHex 3",
        function: compareRegexp,
        arguments: [regexp.BinaryOrHex, functional.BinaryOrHex, "X'1234'"],
        output: { isPass: true, failReason: undefined }
    },
    {
        name: "compareRegexp BinaryOrHex 4",
        function: compareRegexp,
        arguments: [regexp.BinaryOrHex, functional.BinaryOrHex, "..."],
        output: { isPass: true, failReason: undefined }
    },
    {
        name: "compareRegexp BinaryOrHex 5",
        function: compareRegexp,
        arguments: [regexp.BinaryOrHex, functional.BinaryOrHex, ""],
        output: { isPass: true, failReason: undefined }
    },
    {
        name: "compareRegexp Quote 1",
        function: compareRegexp,
        arguments: [regexp.Quote, functional.Quote, "`"],
        output: { isPass: true, failReason: undefined }
    },
    {
        name: "compareRegexp Quote 2",
        function: compareRegexp,
        arguments: [regexp.Quote, functional.Quote, "'101'"],
        output: { isPass: true, failReason: undefined }
    },
    {
        name: "compareRegexp Quote 3",
        function: compareRegexp,
        arguments: [regexp.Quote, functional.Quote, '"...'],
        output: { isPass: true, failReason: undefined }
    },
    {
        name: "compareRegexp Quote 4",
        function: compareRegexp,
        arguments: [regexp.Quote, functional.Quote, "..."],
        output: { isPass: true, failReason: undefined }
    },
    {
        name: "compareRegexp Quote 5",
        function: compareRegexp,
        arguments: [regexp.Quote, functional.Quote, ""],
        output: { isPass: true, failReason: undefined }
    },
]);
*/
