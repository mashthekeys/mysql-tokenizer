'use strict';

const process = require('process');
const child_process = require('child_process');
const chalk = require('chalk');

const defaultWidth = 60;

/**
 * @type {{haltOnFail: boolean, quiet: boolean, verbose: boolean, width: 'auto'|number}}
 */
const optionDefaults = {haltOnFail: false, quiet: false, verbose: true, width: 'auto'};

function matchError(error, actualError) {
    if (typeof error === 'function') {
        return actualError !== undefined && actualError.constructor === error;
    }

    return JSON.stringify(error) === JSON.stringify(actualError);
}

function errorAt(string, pos) {
    string = String(string);
    // if (pos + 1 >= string.length) return string;
    // if (pos == 0) return "!";
    return string.substr(0, pos) +'\n'+ chalk.redBright(string.substr(pos));
}


module.exports = exports.default = runTests;
module.exports.runTestsAndExit = runTestsAndExit;

function runTestsAndExit(tests, options) {
    const allPass = runTests(tests, options);

    process.exit(allPass ? 0 : 1);
}
function runTests(tests, options) {
    options = Object.assign({}, optionDefaults, options || {});
    // console.log('runTests', options);

    let allPass = true;
    let nTests = 0;
    let nPasses = 0;

    if (options.width === 'auto') {
        options.width = defaultWidth;
        try {
            // Read number of terminal columns
            const stdout = child_process.execSync('tput cols', {});
            if (0 < parseInt(stdout)) options.width = parseInt(stdout);
        } catch (e) {
            // Ignore error
        }

    }

    /** @return string */
    function JSON_stringifyAndTruncate(value, maxLength) {
        const json = JSON.stringify(value);
        if (json.length <= maxLength) {
            return value;
        }
        return `Truncated JSON({length: ${json.length}, initial: '${chalk.underline(json.substr(0,maxLength).replace(/'/g, "\\'"))}'})`;
    }

    function showError(error) {
        return typeof error === 'function' ? error.name : JSON.stringify(error);
    }

    tests.forEach(test => {
        if (!allPass && options.haltOnFail) return;

        const {name, output, error} = test;

        if (!options.quiet) {
            console.log(chalk.gray(''.padEnd(options.width, '-')));
            if (options.verbose) {
                console.log(chalk.bold(`Test ${name}`));
                console.log(chalk.gray(`Arguments ${JSON_stringifyAndTruncate(test.arguments, 512)}`));
            }
        }

        let actualOutput = undefined, actualError = undefined, pass = undefined;

        try {
            actualOutput = test.function.apply(test.this, test.arguments || []);
        } catch (e) {
            actualError = e;
        }

        let outputSerialized = JSON.stringify(output);
        let actualOutputSerialized = JSON.stringify(actualOutput);

        // if (outputSerialized === undefined || outputSerialized === null) {
        //     outputSerialized = String(outputSerialized);
        // }
        // if (actualOutputSerialized === undefined || actualOutputSerialized === null) {
        //     actualOutputSerialized = String(actualOutputSerialized);
        // }

        if (error !== undefined) {
            // Error expected
            pass = matchError(error, actualError);

        } else if (actualOutput === undefined) {
            // Output expected
            pass = false;

        } else {
            // pass = output.every((value, index) => {
            //     const actualValue = actualOutput[index];
            //
            //     return value === actualValue;
            // });

            pass = outputSerialized === actualOutputSerialized;
        }

        if (!options.quiet) {
            console.log(chalk[pass ? 'green' : 'redBright'](`Test ${name}    ${chalk.bold(pass ? 'Success' : 'FAILED')}`));

            let diffPos = outputSerialized != null ? outputSerialized.length : 0;
            if (actualOutputSerialized !== undefined) {
                diffPos = (outputSerialized === undefined ? '' : outputSerialized).split('').reduce((diffPos, value, index) => {
                    if (diffPos === undefined) {
                        if (value === actualOutputSerialized[index]) {
                            return undefined;
                        } else {
                            // console.log(chalk.redBright(`${value} !== ${actualOutputSerialized[index]}`));
                            return index;
                        }
                    }
                    return diffPos;
                }, undefined);
            }

            if (!pass || options.verbose) {
                if (error !== undefined) {
                    // Expected error
                    console.log(`Expected Error:  ${showError(error)}`);
                    console.log(`Actual Output:\n${chalk[pass ? 'gray' : 'redBright'](actualOutputSerialized, 0)}`);
                    console.log(`Actual Error:    ${chalk[pass ? 'gray' : 'redBright'](showError(actualError))}`);
                    if (!pass && actualError) {
                        console.error(actualError);
                    }
                } else {
                    // Expected output

                    if (pass) {
                        console.log(`Expected Output:\n${outputSerialized}`);
                        console.log(`Actual Output:\n${actualOutputSerialized}`);
                    } else {
                        console.log(`Expected Output:\n${errorAt(outputSerialized, diffPos)}`);
                        console.log(`Actual Output:\n${errorAt(actualOutputSerialized, diffPos)}`);

                        if (actualOutput !== undefined && diffPos < options.width) {
                            console.log(chalk.redBright('^'.padStart(diffPos + 1)));
                        }
                        if (actualError) {
                            console.log(`Actual Error:    ${chalk.redBright(String(actualError))}`);
                            console.error(actualError);
                        }
                    }
                }
            }
            console.log('');
        }

        ++nTests;

        if (pass) {
            ++nPasses;
        } else {
            allPass = false;
        }
    });

    if (!options.quiet) {
        const bg = allPass ? 'bgGreen' : 'bgRedBright';
        const format = _ => chalk.bold.white[bg](String(_).padEnd(options.width));

        console.log(format(''.padEnd(options.width, '=')));
        console.log(format(allPass ? 'All Tests Passed' : 'Tests Failed'));
        console.log(format(`${nPasses} of ${nTests} passed.`));
        console.log(format(''.padEnd(options.width, '=')));
    }
    return allPass;
}
