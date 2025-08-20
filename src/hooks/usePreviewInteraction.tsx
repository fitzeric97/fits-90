import { useState, useCallback } from 'react';

export function usePreviewInteraction(onSignUpTrigger: () => void) {
  const [clickCount, setClickCount] = useState(0);

  const handleInteraction = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5) {
      onSignUpTrigger();
      setClickCount(0); // Reset counter after showing modal
    }
  }, [clickCount, onSignUpTrigger]);

  return {
    handleInteraction,
    clickCount,
    remainingClicks: Math.max(0, 5 - clickCount)
  };
}