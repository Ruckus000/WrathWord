# Word Bank Expansion Plan for WrathWord

## Current Situation Analysis

### What You Have Now
Based on reviewing your code:
- **Length 5 only**: Currently only supporting 5-letter words
- **~450 words**: answers-5.json has approximately 450 words
- **Static imports**: Using `import answers5 from '../logic/words/answers-5'`
- **Same allowed/answers**: Your allowed and answers lists appear to be identical (both ~4.4KB)

### The Problem
- **Limited variety**: 450 words means players will see repeats frequently
- **Daily mode issues**: With only 450 words, you'll cycle through all words in ~15 months
- **Missing lengths**: No support for 2-6 letter words as originally planned
- **Boring fast**: Small word pool = repetitive gameplay

---

## 🎯 Solution Options (Ranked by Effort vs Impact)

### **Option 1: Use Comprehensive Open-Source Word Lists** ⭐ RECOMMENDED
**Effort**: Low | **Impact**: High | **Time**: 2-3 hours

Use existing curated word lists from the Wordle community.

#### Best Sources:
1. **Official Wordle Lists**
   - https://github.com/tabatkins/wordle-list
   - ~2,300 answers + ~10,000 allowed words (5-letter)
   
2. **Comprehensive Multi-Length Lists**
   - https://github.com/dwyl/english-words (470k+ words)
   - https://github.com/first20hours/google-10000-english

#### Expected Results After Implementation:
| Length | Answers | Allowed | Daily Cycle |
|--------|---------|---------|-------------|
| 2 | 120 | 180 | 4 months |
| 3 | 1,200 | 1,400 | 3.3 years |
| 4 | 4,000 | 5,500 | 11 years |
| 5 | 2,300 | 12,000 | 6.3 years |
| 6 | 3,500 | 7,800 | 9.6 years |

**Total Bundle Size**: ~250KB (still very small!)

---

## 🏆 Recommended Hybrid Approach

1. Use Official Wordle Lists for 5-letter words (2,300 answers)
2. Use Filtered English Word Lists for 2-4-6 letters
3. Implement lazy loading to keep bundle size reasonable

Want me to implement this solution for you?
