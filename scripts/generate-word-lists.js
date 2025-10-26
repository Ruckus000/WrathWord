const fs = require('fs');
const path = require('path');

// Common words frequency list for filtering
const COMMON_WORDS_THRESHOLD = {
  2: 120,   // Very limited 2-letter words
  3: 1200,  // Common 3-letter words
  4: 4000,  // Common 4-letter words
  5: 2314,  // Use official Wordle answers
  6: 3500,  // Common 6-letter words
};

const ALLOWED_MULTIPLIER = {
  2: 1.5,
  3: 1.17,
  4: 1.38,
  5: 5.2,  // Large allowed list for 5-letter
  6: 2.23,
};

// Read word lists
const wordleAnswers = fs.readFileSync('/tmp/wordle_answers_official.txt', 'utf8')
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length === 5);

const wordleAllowed = fs.readFileSync('/tmp/wordle_answers.txt', 'utf8')
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length === 5);

const allEnglishWords = fs.readFileSync('/tmp/english_words.txt', 'utf8')
  .split('\n')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length > 0 && /^[a-z]+$/.test(w)); // Only letters

console.log(`Loaded ${wordleAnswers.length} Wordle answers`);
console.log(`Loaded ${wordleAllowed.length} Wordle allowed words`);
console.log(`Loaded ${allEnglishWords.length} English words`);

// Organize by length
const wordsByLength = {};
for (let len = 2; len <= 6; len++) {
  wordsByLength[len] = allEnglishWords.filter(w => w.length === len);
}

console.log('\nWords by length:');
for (let len = 2; len <= 6; len++) {
  console.log(`  ${len}: ${wordsByLength[len].length} words`);
}

// Profanity filter
const PROFANITY_LIST = [
  'fuck', 'shit', 'cunt', 'cock', 'dick', 'piss', 'damn', 'hell',
  'bitch', 'bastard', 'whore', 'slut', 'tits', 'crap', 'prick'
];

function isProfane(word) {
  return PROFANITY_LIST.includes(word.toLowerCase());
}

// Function to score word commonality (simple heuristic)
function getWordScore(word) {
  // Prefer words with common letters
  const commonLetters = 'etaoinshrdlcumwfgypbvkjxqz';
  let score = 0;

  // Letter frequency score
  for (const char of word) {
    const idx = commonLetters.indexOf(char);
    score += idx >= 0 ? (26 - idx) : 0;
  }

  // Penalize words with repeated letters (less interesting for word game)
  const uniqueLetters = new Set(word).size;
  if (uniqueLetters < word.length) {
    score *= 0.8;
  }

  // Penalize words with rare letter combinations
  const rareBigrams = ['qq', 'qz', 'zx', 'jj', 'vv', 'ww'];
  for (const bigram of rareBigrams) {
    if (word.includes(bigram)) {
      score *= 0.3;
    }
  }

  return score;
}

// Generate curated lists for each length
const outputDir = path.join(__dirname, '..', 'src', 'logic', 'words');

for (let len = 2; len <= 6; len++) {
  let answers, allowed;

  if (len === 5) {
    // Use official Wordle lists for 5-letter words
    answers = wordleAnswers;
    allowed = [...new Set([...wordleAnswers, ...wordleAllowed])].sort();
  } else {
    // Filter and score words for other lengths
    const words = wordsByLength[len].filter(w => !isProfane(w));
    const scoredWords = words
      .map(w => ({ word: w, score: getWordScore(w) }))
      .sort((a, b) => b.score - a.score);

    // Select top words for answers
    const answerCount = COMMON_WORDS_THRESHOLD[len];
    answers = scoredWords
      .slice(0, answerCount)
      .map(w => w.word)
      .sort();

    // Select broader set for allowed (includes answers)
    const allowedCount = Math.floor(answerCount * ALLOWED_MULTIPLIER[len]);
    allowed = scoredWords
      .slice(0, allowedCount)
      .map(w => w.word)
      .sort();
  }

  // Write answers
  const answersFile = path.join(outputDir, `answers-${len}.json`);
  fs.writeFileSync(answersFile, JSON.stringify(answers, null, 2));
  console.log(`\n✓ Generated answers-${len}.json: ${answers.length} words`);

  // Write allowed
  const allowedFile = path.join(outputDir, `allowed-${len}.json`);
  fs.writeFileSync(allowedFile, JSON.stringify(allowed, null, 2));
  console.log(`✓ Generated allowed-${len}.json: ${allowed.length} words`);

  // Calculate file sizes
  const answersSize = (fs.statSync(answersFile).size / 1024).toFixed(2);
  const allowedSize = (fs.statSync(allowedFile).size / 1024).toFixed(2);
  console.log(`  Sizes: ${answersSize}KB (answers), ${allowedSize}KB (allowed)`);
}

// Generate TypeScript exports
console.log('\n\nGenerating TypeScript exports...');
for (let len = 2; len <= 6; len++) {
  const answersJson = require(path.join(outputDir, `answers-${len}.json`));
  const allowedJson = require(path.join(outputDir, `allowed-${len}.json`));

  const answersTs = `export default ${JSON.stringify(answersJson)} as string[];\n`;
  const allowedTs = `export default ${JSON.stringify(allowedJson)} as string[];\n`;

  fs.writeFileSync(path.join(outputDir, `answers-${len}.ts`), answersTs);
  fs.writeFileSync(path.join(outputDir, `allowed-${len}.ts`), allowedTs);
}
console.log('✓ Generated TypeScript exports');

console.log('\n✅ Word list generation complete!');

// Print summary
console.log('\n📊 Summary:');
console.log('┌────────┬─────────┬─────────┬──────────────┐');
console.log('│ Length │ Answers │ Allowed │ Daily Cycle  │');
console.log('├────────┼─────────┼─────────┼──────────────┤');
for (let len = 2; len <= 6; len++) {
  const answers = require(path.join(outputDir, `answers-${len}.json`));
  const allowed = require(path.join(outputDir, `allowed-${len}.json`));
  const cycleYears = (answers.length / 365).toFixed(1);
  console.log(`│   ${len}    │  ${answers.length.toString().padStart(5)}  │  ${allowed.length.toString().padStart(5)}  │  ${cycleYears} years  │`);
}
console.log('└────────┴─────────┴─────────┴──────────────┘');
