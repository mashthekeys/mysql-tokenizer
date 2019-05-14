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
    return error !== undefined && actualError !== undefined;
}

function errorAt(string, pos) {
    string = String(string);
    return string.substr(0, pos) + chalk.redBright(string.substr(pos));
}


module.exports = exports.default = runTests;
module.exports.runTestsAndExit = runTestsAndExit;

function runTestsAndExit(tests, options) {
    const allPass = runTests(tests, options);

    process.exit(allPass ? 0 : 1);
}
function runTests(tests, options) {
    options = Object.assign({}, options || {}, optionDefaults);
    console.log('runTests', options.width);

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


    tests.forEach(test => {
        if (!allPass && options.haltOnFail) return;

        const {name, output, error} = test;

        if (!options.quiet) {
            console.log(chalk.gray(''.padEnd(options.width, '-')));
            if (options.verbose) {
                console.log(chalk.bold(`Test ${name}`));
                console.log(chalk.gray(`Arguments ${JSON.stringify(test.arguments)}`));
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
            pass = matchError(error, actualError) !== undefined;

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

            let diffPos = outputSerialized.length;

            if (!pass) {
                if (error !== undefined) {
                    console.log(`Expected Error:  ${JSON.stringify(error)}`);
                } else {
                    if (actualOutputSerialized !== undefined) {
                        diffPos = outputSerialized.split('').reduce((diffPos, value, index) => {
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

                    console.log(`Expected Output:\n${errorAt(outputSerialized, diffPos)}`);
                }
            }
            if (!pass || options.verbose) {
                console.log(`Actual Error:    ${chalk[actualError ? 'redBright' : 'gray'](String(actualError))}`);
                actualError && console.error(actualError);
                console.log(`Actual Output:\n${errorAt(actualOutputSerialized, diffPos)}`);
                if (!pass && diffPos < options.width) {
                    console.log(chalk.redBright('^'.padStart(diffPos + 1)));
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
