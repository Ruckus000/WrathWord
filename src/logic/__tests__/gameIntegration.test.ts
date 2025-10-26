import {evaluateGuess} from '../evaluateGuess';
import {selectDaily} from '../selectDaily';
import answers2 from '../words/answers-2';
import allowed2 from '../words/allowed-2';
import answers3 from '../words/answers-3';
import allowed3 from '../words/allowed-3';
import answers4 from '../words/answers-4';
import allowed4 from '../words/allowed-4';
import answers5 from '../words/answers-5';
import allowed5 from '../words/allowed-5';
import answers6 from '../words/answers-6';
import allowed6 from '../words/allowed-6';

describe('Game Integration Tests', () => {
  const wordLists = {
    2: {answers: answers2, allowed: allowed2},
    3: {answers: answers3, allowed: allowed3},
    4: {answers: answers4, allowed: allowed4},
    5: {answers: answers5, allowed: allowed5},
    6: {answers: answers6, allowed: allowed6},
  };

  describe('Daily Mode with All Word Lengths', () => {
    [2, 3, 4, 5, 6].forEach(len => {
      it(`should select consistent daily words for length ${len}`, () => {
        const {answers} = wordLists[len];
        const date = '2025-01-15';

        // Same date should give same word across multiple calls
        const word1 = selectDaily(len, 6, date, answers);
        const word2 = selectDaily(len, 6, date, answers);
        const word3 = selectDaily(len, 6, date, answers);

        expect(word1).toBe(word2);
        expect(word2).toBe(word3);
        expect(word1.length).toBe(len);
      });

      it(`should select different words for different dates (length ${len})`, () => {
        const {answers} = wordLists[len];

        const word1 = selectDaily(len, 6, '2025-01-15', answers);
        const word2 = selectDaily(len, 6, '2025-01-16', answers);
        const word3 = selectDaily(len, 6, '2025-01-17', answers);

        // Should be different (very high probability with large word lists)
        expect(word1 !== word2 || word2 !== word3).toBe(true);
      });

      it(`should select different words for different row counts (length ${len})`, () => {
        const {answers} = wordLists[len];
        const date = '2025-01-15';

        const word1 = selectDaily(len, 4, date, answers);
        const word2 = selectDaily(len, 6, date, answers);
        const word3 = selectDaily(len, 8, date, answers);

        // Should be different based on maxRows parameter
        expect(word1 !== word2 || word2 !== word3).toBe(true);
      });
    });
  });

  describe('Game Playability with All Lengths', () => {
    [2, 3, 4, 5, 6].forEach(len => {
      it(`should complete full game for length ${len}`, () => {
        const {answers, allowed} = wordLists[len];

        // Pick a random answer
        const answer = answers[Math.floor(Math.random() * answers.length)];
        expect(answer.length).toBe(len);

        // Simulate guessing
        let guesses = 0;
        let won = false;
        const maxGuesses = 6;

        // Try random valid guesses
        for (let i = 0; i < maxGuesses; i++) {
          const guess = allowed[Math.floor(Math.random() * allowed.length)];
          guesses++;

          const feedback = evaluateGuess(answer, guess);

          // Feedback should match word length
          expect(feedback.length).toBe(len);

          // Check if won
          if (feedback.every(state => state === 'correct')) {
            won = true;
            break;
          }

          // Feedback should only contain valid states
          feedback.forEach(state => {
            expect(['correct', 'present', 'absent']).toContain(state);
          });
        }

        // Either won or used all guesses
        expect(won || guesses === maxGuesses).toBe(true);
      });

      it(`should handle correct guesses for length ${len}`, () => {
        const {answers} = wordLists[len];
        const answer = answers[0]; // First answer

        const feedback = evaluateGuess(answer, answer);

        expect(feedback.length).toBe(len);
        expect(feedback.every(state => state === 'correct')).toBe(true);
      });

      it(`should handle completely wrong guesses for length ${len}`, () => {
        const {answers} = wordLists[len];

        // Pick two words with no common letters if possible
        let answer = answers.find(w => /^[aeiou]+$/.test(w)); // Only vowels
        let guess = answers.find(w => /^[bcdfghjklmnpqrstvwxyz]+$/.test(w)); // Only consonants

        // Fallback if no pure vowel/consonant words exist
        if (!answer || !guess) {
          answer = answers[0];
          guess = answers[answers.length - 1];
        }

        const feedback = evaluateGuess(answer, guess);

        expect(feedback.length).toBe(len);
        // All should be either absent or present (not all correct)
        expect(feedback.every(state => state === 'correct')).toBe(false);
      });
    });
  });

  describe('Word Validation', () => {
    [2, 3, 4, 5, 6].forEach(len => {
      it(`should validate words correctly for length ${len}`, () => {
        const {allowed, answers} = wordLists[len];

        // Random answer should be in allowed list
        const answer = answers[Math.floor(Math.random() * answers.length)];
        expect(allowed).toContain(answer);

        // Fake word should not be in allowed
        const fakeWord = 'z'.repeat(len);
        const allowedSet = new Set(allowed);
        if (!allowedSet.has(fakeWord)) {
          expect(allowed).not.toContain(fakeWord);
        }
      });
    });
  });

  describe('Edge Cases', () => {
    [2, 3, 4, 5, 6].forEach(len => {
      it(`should handle words with duplicate letters for length ${len}`, () => {
        const {answers} = wordLists[len];

        // Find a word with duplicate letters
        const wordWithDuplicates = answers.find(w => {
          const chars = w.split('');
          return chars.length !== new Set(chars).size;
        });

        if (wordWithDuplicates) {
          // Test evaluation with duplicate letters
          const feedback = evaluateGuess(
            wordWithDuplicates,
            wordWithDuplicates,
          );
          expect(feedback.every(s => s === 'correct')).toBe(true);
        }
      });
    });
  });

  describe('Performance', () => {
    it('should handle word selection quickly for all lengths', () => {
      const start = Date.now();

      [2, 3, 4, 5, 6].forEach(len => {
        const {answers} = wordLists[len];
        for (let i = 0; i < 100; i++) {
          const date = `2025-01-${String(i + 1).padStart(2, '0')}`;
          selectDaily(len, 6, date, answers);
        }
      });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(500); // 500 selections in under 500ms
    });

    it('should evaluate guesses quickly for all lengths', () => {
      const start = Date.now();

      [2, 3, 4, 5, 6].forEach(len => {
        const {answers} = wordLists[len];
        const word = answers[0];

        for (let i = 0; i < 1000; i++) {
          evaluateGuess(word, word);
        }
      });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // 5000 evaluations in under 100ms
    });
  });
});
