'use strict';

// Copied verbatim from NPM Package sql-tokenizer
// https://raw.githubusercontent.com/fibo/SQL-tokenizer/master/src/splitOnOperators.js
// Licence MIT

function splitOnOperators(operators) {
  const maxOperatorLenght = operators.reduce((maxLenght, operator) => Math.max(operator.length, maxLenght), 0);

  return sql => {
    let skipNumChars = 0;

    return sql.split('').reduce((blocks, character, index, array) => {
      const numBlocks = blocks.length;

      if (skipNumChars > 0) {
        skipNumChars--;
        return blocks;
      }

      // Check if it is an operator, look for longest operators first.
      for (let len = maxOperatorLenght; len > 0; len--) {
        const operator = array.slice(index, index + len).join('');

        if (operators.indexOf(operator) > -1) {
          skipNumChars = len - 1;
          return blocks.concat(operator);
        }
      }

      // No operator was found:
      // if last block is not an operator, append character to it.
      if (numBlocks > 0) {
        const lastBlock = blocks[numBlocks - 1];
        const previousBlocks = blocks.slice(0, numBlocks - 1);

        if (operators.indexOf(lastBlock) > -1) {
          return blocks.concat(character);
        } else {
          return previousBlocks.concat(lastBlock + character);
        }
      } else {
        // No block exists yet, create it with first character.
        return [character];
      }
    }, []);
  };
}

module.exports = splitOnOperators;