#!/usr/bin/env node
/**
 * Script to expand allowed-2.json with official Scrabble 2-letter words.
 *
 * Usage: node scripts/expand-allowed-2.js
 *
 * This adds all official Scrabble 2-letter words to allowed-2.json,
 * ensuring players can guess standard game words while keeping
 * the answers list curated for quality.
 */

const fs = require('fs');
const path = require('path');

// Official Scrabble 2-letter words (TWL and SOWPODS combined)
// Source: https://scrabble.merriam-webster.com/
const SCRABBLE_2_LETTER_WORDS = [
  'aa', // rough lava
  'ab', // abdominal muscle
  'ad', // advertisement
  'ae', // one (Scottish)
  'ag', // agriculture
  'ah', // exclamation
  'ai', // three-toed sloth
  'al', // East Indian tree
  'am', // form of "be"
  'an', // article
  'ar', // letter R
  'as', // to the same degree
  'at', // preposition
  'aw', // exclamation
  'ax', // chopping tool
  'ay', // yes (variant)
  'ba', // soul (Egyptian)
  'be', // to exist
  'bi', // bisexual
  'bo', // pal
  'by', // preposition
  'da', // dad (informal)
  'de', // of (used in names)
  'do', // musical note
  'ed', // education
  'ef', // letter F
  'eh', // exclamation
  'el', // elevated train
  'em', // typographic unit
  'en', // typographic unit
  'er', // hesitation sound
  'es', // letter S
  'et', // past tense of eat (dialectal)
  'ex', // former spouse
  'fa', // musical note
  'fe', // Hebrew letter
  'gi', // martial arts uniform
  'go', // to move
  'ha', // exclamation
  'he', // pronoun
  'hi', // greeting
  'hm', // thinking sound
  'ho', // exclamation
  'id', // part of psyche
  'if', // conjunction
  'in', // preposition
  'is', // form of "be"
  'it', // pronoun
  'jo', // sweetheart (Scottish)
  'ka', // spirit (Egyptian)
  'ki', // vital force (chi)
  'la', // musical note
  'li', // Chinese unit
  'lo', // look
  'ma', // mother
  'me', // pronoun
  'mi', // musical note
  'mm', // yummy sound
  'mo', // moment
  'mu', // Greek letter
  'my', // possessive
  'na', // not (Scottish)
  'ne', // born as
  'no', // negative
  'nu', // Greek letter
  'od', // hypothetical force
  'oe', // wind off Faroe Islands
  'of', // preposition
  'oh', // exclamation
  'oi', // exclamation
  'ok', // okay
  'om', // mantra sound
  'on', // preposition
  'op', // style of art
  'or', // conjunction
  'os', // bone / mouth
  'ow', // exclamation
  'ox', // bovine
  'oy', // exclamation
  'pa', // father
  'pe', // Hebrew letter
  'pi', // Greek letter
  'po', // chamber pot
  'qi', // vital energy
  're', // musical note
  'sh', // be quiet
  'si', // musical note (variant)
  'so', // musical note / thus
  'ta', // thank you
  'te', // musical note (variant)
  'ti', // musical note
  'to', // preposition
  'uh', // hesitation
  'um', // hesitation
  'un', // one
  'up', // direction
  'us', // pronoun
  'ut', // musical note (archaic)
  'we', // pronoun
  'wo', // woe
  'xi', // Greek letter
  'xu', // Vietnamese currency
  'ya', // you
  'ye', // you (archaic)
  'yo', // exclamation
  'za', // pizza
];

const allowedJsonPath = path.join(
  __dirname,
  '..',
  'src',
  'logic',
  'words',
  'allowed-2.json',
);
const allowedTsPath = path.join(
  __dirname,
  '..',
  'src',
  'logic',
  'words',
  'allowed-2.ts',
);

// Read current allowed list
let currentAllowed;
try {
  currentAllowed = JSON.parse(fs.readFileSync(allowedJsonPath, 'utf8'));
  console.log(`Current allowed-2.json has ${currentAllowed.length} words`);
} catch (err) {
  console.error('Error reading allowed-2.json:', err.message);
  process.exit(1);
}

// Merge with Scrabble words
const allowedSet = new Set(currentAllowed.map(w => w.toLowerCase()));
let addedCount = 0;

SCRABBLE_2_LETTER_WORDS.forEach(word => {
  if (!allowedSet.has(word)) {
    allowedSet.add(word);
    addedCount++;
    console.log(`  + Added: ${word}`);
  }
});

// Sort and write back
const newAllowed = Array.from(allowedSet).sort();

fs.writeFileSync(allowedJsonPath, JSON.stringify(newAllowed, null, 2) + '\n');
console.log(`\nExpanded allowed-2.json:`);
console.log(`  Previous: ${currentAllowed.length} words`);
console.log(`  Added: ${addedCount} new Scrabble words`);
console.log(`  Total: ${newAllowed.length} words`);

// Also update the TypeScript export
const tsContent = `export default ${JSON.stringify(newAllowed)} as string[];\n`;
fs.writeFileSync(allowedTsPath, tsContent);
console.log(`\nUpdated allowed-2.ts`);

console.log('\nDone! New Scrabble words added to allowed-2 list.');
