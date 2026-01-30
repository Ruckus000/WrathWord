// src/services/tutorialTrigger.ts
// Simple event emitter for cross-component communication
// Used to trigger the tutorial modal from AuthContext when a first-time user signs in

type Listener = () => void;

class TutorialTrigger {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  trigger(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const tutorialTrigger = new TutorialTrigger();
