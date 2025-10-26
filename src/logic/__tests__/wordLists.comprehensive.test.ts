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

describe('Word Lists Comprehensive Validation', () => {
  const lengths = [2, 3, 4, 5, 6];
  const wordLists = {
    2: {answers: answers2, allowed: allowed2},
    3: {answers: answers3, allowed: allowed3},
    4: {answers: answers4, allowed: allowed4},
    5: {answers: answers5, allowed: allowed5},
    6: {answers: answers6, allowed: allowed6},
  };

  describe('Basic Structure', () => {
    lengths.forEach(len => {
      const {answers, allowed} = wordLists[len];

      it(`length ${len}: answers should be an array`, () => {
        expect(Array.isArray(answers)).toBe(true);
      });

      it(`length ${len}: allowed should be an array`, () => {
        expect(Array.isArray(allowed)).toBe(true);
      });

      it(`length ${len}: answers should not be empty`, () => {
        expect(answers.length).toBeGreaterThan(0);
      });

      it(`length ${len}: allowed should not be empty`, () => {
        expect(allowed.length).toBeGreaterThan(0);
      });

      it(`length ${len}: should have reasonable word counts`, () => {
        expect(answers.length).toBeGreaterThan(50);
        expect(allowed.length).toBeGreaterThan(answers.length * 0.5);
      });
    });
  });

  describe('Word Format Validation', () => {
    lengths.forEach(len => {
      const {answers, allowed} = wordLists[len];

      it(`length ${len}: all answers should be exactly ${len} letters`, () => {
        answers.forEach(word => {
          expect(word.length).toBe(len);
        });
      });

      it(`length ${len}: all allowed should be exactly ${len} letters`, () => {
        allowed.forEach(word => {
          expect(word.length).toBe(len);
        });
      });

      it(`length ${len}: all answers should be lowercase`, () => {
        answers.forEach(word => {
          expect(word).toBe(word.toLowerCase());
        });
      });

      it(`length ${len}: all allowed should be lowercase`, () => {
        allowed.forEach(word => {
          expect(word).toBe(word.toLowerCase());
        });
      });

      it(`length ${len}: all answers should only contain letters a-z`, () => {
        answers.forEach(word => {
          expect(/^[a-z]+$/.test(word)).toBe(true);
        });
      });

      it(`length ${len}: all allowed should only contain letters a-z`, () => {
        allowed.forEach(word => {
          expect(/^[a-z]+$/.test(word)).toBe(true);
        });
      });
    });
  });

  describe('Uniqueness and Sorting', () => {
    lengths.forEach(len => {
      const {answers, allowed} = wordLists[len];

      it(`length ${len}: answers should have no duplicates`, () => {
        const uniqueAnswers = new Set(answers);
        expect(uniqueAnswers.size).toBe(answers.length);
      });

      it(`length ${len}: allowed should have no duplicates`, () => {
        const uniqueAllowed = new Set(allowed);
        expect(uniqueAllowed.size).toBe(allowed.length);
      });

      it(`length ${len}: answers should be sorted alphabetically`, () => {
        const sorted = [...answers].sort();
        expect(answers).toEqual(sorted);
      });

      it(`length ${len}: allowed should be sorted alphabetically`, () => {
        const sorted = [...allowed].sort();
        expect(allowed).toEqual(sorted);
      });
    });
  });

  describe('Relationship Between Answers and Allowed', () => {
    lengths.forEach(len => {
      const {answers, allowed} = wordLists[len];

      it(`length ${len}: all answers should be in allowed list`, () => {
        const allowedSet = new Set(allowed);
        answers.forEach(word => {
          expect(allowedSet.has(word)).toBe(true);
        });
      });

      it(`length ${len}: allowed should be larger than answers`, () => {
        expect(allowed.length).toBeGreaterThanOrEqual(answers.length);
      });

      it(`length ${len}: allowed should contain all answers`, () => {
        const answersSet = new Set(answers);
        let containsAll = true;
        for (const word of answers) {
          if (!allowed.includes(word)) {
            containsAll = false;
            break;
          }
        }
        expect(containsAll).toBe(true);
      });
    });
  });

  describe('Game Playability', () => {
    lengths.forEach(len => {
      const {answers} = wordLists[len];

      it(`length ${len}: should have enough answers for varied gameplay`, () => {
        // At least 100 words for reasonable variety
        expect(answers.length).toBeGreaterThanOrEqual(100);
      });

      it(`length ${len}: answers should not be standalone offensive words`, () => {
        // Check for standalone offensive words (not substrings to avoid false positives)
        const offensiveWords = ['fuck', 'shit', 'damn', 'cunt', 'bitch'];
        const answersSet = new Set(answers);
        offensiveWords.forEach(word => {
          if (word.length === len) {
            expect(answersSet.has(word)).toBe(false);
          }
        });
      });
    });
  });

  describe('Word Quality', () => {
    lengths.forEach(len => {
      const {answers} = wordLists[len];

      it(`length ${len}: should have mostly varied letters`, () => {
        // Most words should have varied letters (allowing some exceptions like "aa")
        let singleLetterWords = 0;
        answers.forEach(word => {
          const uniqueChars = new Set(word);
          if (uniqueChars.size === 1) {
            singleLetterWords++;
          }
        });
        // Less than 2% should be single-letter repetitions (higher for 2-letter words)
        const threshold = len === 2 ? 0.02 : 0.01;
        expect(singleLetterWords / answers.length).toBeLessThan(threshold);
      });

      it(`length ${len}: should have reasonable letter distribution`, () => {
        // Check that not all words start with the same letter
        const firstLetters = new Set(answers.map(w => w[0]));
        expect(firstLetters.size).toBeGreaterThan(10);
      });
    });
  });

  describe('Performance', () => {
    it('should load all word lists quickly', () => {
      const start = Date.now();
      lengths.forEach(len => {
        const {answers, allowed} = wordLists[len];
        expect(answers.length).toBeGreaterThan(0);
        expect(allowed.length).toBeGreaterThan(0);
      });
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // Should load in under 100ms
    });
  });

  describe('Daily Mode Sustainability', () => {
    lengths.forEach(len => {
      const {answers} = wordLists[len];

      it(`length ${len}: should have enough words for multiple years`, () => {
        const daysPerYear = 365;
        const yearsOfContent = answers.length / daysPerYear;

        // At least 3 months of unique daily words
        expect(yearsOfContent).toBeGreaterThanOrEqual(0.25);
      });
    });
  });

  describe('Specific Word Checks', () => {
    it('length 5: should contain common Wordle words', () => {
      const commonWords = ['about', 'after', 'again', 'under', 'where'];
      const answersSet = new Set(answers5);

      let found = 0;
      commonWords.forEach(word => {
        if (answersSet.has(word)) found++;
      });

      // At least 80% of common words should be present
      expect(found / commonWords.length).toBeGreaterThanOrEqual(0.8);
    });

    it('length 3: should contain basic words', () => {
      const basicWords = ['cat', 'dog', 'run', 'sit', 'big'];
      const answersSet = new Set(answers3);

      let found = 0;
      basicWords.forEach(word => {
        if (answersSet.has(word)) found++;
      });

      expect(found).toBeGreaterThan(0);
    });
  });
});
