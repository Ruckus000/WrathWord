// src/components/TutorialModal/tutorialSteps.ts

export interface TutorialStepData {
  id: number;
  icon: string;
  title: string;
  description: string;
  visualType: 'welcome' | 'colors' | 'example' | 'keyboard' | 'modes' | 'ready';
}

export const TUTORIAL_STEPS: TutorialStepData[] = [
  {
    id: 1,
    icon: '🎯',
    title: 'Welcome to WrathWord!',
    description:
      'Guess the hidden word in 6 tries. Each guess reveals clues about the answer.',
    visualType: 'welcome',
  },
  {
    id: 2,
    icon: '🟩',
    title: 'Color Clues',
    description:
      'After each guess, tiles change color to show how close you are.',
    visualType: 'colors',
  },
  {
    id: 3,
    icon: '💡',
    title: 'Example',
    description: 'If the word is WATCH and you guess WRATH:',
    visualType: 'example',
  },
  {
    id: 4,
    icon: '⌨️',
    title: 'Keyboard Tracking',
    description:
      "The keyboard tracks which letters you've used and their status.",
    visualType: 'keyboard',
  },
  {
    id: 5,
    icon: '🎮',
    title: 'Game Modes',
    description: 'Choose how you want to play.',
    visualType: 'modes',
  },
  {
    id: 6,
    icon: '🚀',
    title: "You're Ready!",
    description:
      'Tap the ❓ button anytime to use a hint or review these instructions. Good luck!',
    visualType: 'ready',
  },
];
