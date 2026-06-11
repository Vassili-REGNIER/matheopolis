export const dialogueBlockStyles = `:host {
  min-height: 100%;
  display: block;
}

:host .dialogue-stage {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 36px 24px;
  background:
    radial-gradient(circle at 15% 10%, rgba(145, 215, 255, .25), transparent 28%),
    radial-gradient(circle at 80% 15%, rgba(255, 209, 102, .18), transparent 26%),
    linear-gradient(135deg, #07091c, #21134a);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

:host .stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(circle, rgba(255, 255, 255, .8) 1px, transparent 1px), radial-gradient(circle, rgba(255, 255, 255, .3) 1px, transparent 1px);
  background-size: 80px 80px, 150px 150px;
  opacity: .22;
}

:host .history {
  width: min(860px, 100%);
  max-height: 48vh;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

:host .history::-webkit-scrollbar {
  width: 0;
  height: 0;
}

:host .history-item {
  width: fit-content;
  max-width: 85%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(20, 20, 20, 0.58);
  color: #bdc3c7;
  min-width: 0;
}

:host .history-item.right {
  flex-direction: row-reverse;
  align-self: flex-end;
  text-align: right;
}

:host .history-item.narrator {
  width: 100%;
  max-width: 100%;
  justify-content: center;
  text-align: center;
  background: transparent;
  border: none;
  padding: 8px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
}

:host .history-item img {
  width: 64px; 
  height: 64px;
  border-radius: 50%;
  object-fit: contain;
}

:host .history-item strong {
  display: block;
  color: #91d7ff;
  margin-bottom: 4px;
}

:host .history-item p {
  margin: 0;
  line-height: 1.4;
}

:host .dialogue-container {
  width: 100%;
  max-width: 860px;
  display: flex;
  flex-direction: column;
  align-items: flex-end; 
  gap: 16px;
  position: relative;
  z-index: 1;
}

@keyframes slideFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:host .dialogue-wrapper {
  width: 100%;
  display: flex;
  align-items: flex-end;
  gap: 20px;
  animation: slideFadeIn 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}

:host .dialogue-wrapper.right {
  flex-direction: row-reverse;
}

:host .dialogue-wrapper.narrator {
  justify-content: center;
  align-items: center;
}

:host .avatar {
  width: 200px; 
  height: 200px;
  flex: none;
  object-fit: contain;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
}

:host .dialogue-bubble {
  flex: 1;
  min-width: 0;
  padding: 24px;
  min-height: 120px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(20, 20, 20, 0.5);
  backdrop-filter: blur(8px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.42);
  border-radius: 24px 24px 24px 4px; 
  display: flex;
  flex-direction: column;
}

:host .dialogue-wrapper.right .dialogue-bubble {
  border-radius: 24px 24px 4px 24px;
}

:host .dialogue-wrapper.narrator .dialogue-bubble {
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  max-width: 80%;
  flex: none;
  margin: 0 auto;
}

:host .dialogue-wrapper.narrator .typewriter-text {
  font-style: italic;
  color: rgba(255, 255, 255, 0.85);
}

:host .dialogue-wrapper.right h1 {
  text-align: right;
}

:host h1 {
  margin: 0 0 12px;
  color: #91d7ff;
  font-size: 1.35rem;
}

:host .typewriter-text {
  margin: 0;
  color: #fff;
  line-height: 1.6;
  font-size: 1.1rem;
  flex-grow: 1;
  overflow-wrap: anywhere;
}

:host .typewriter-text.typing::after {
  content: '|';
  animation: blink 1s step-start infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

:host .button-group {
  display: flex;
  gap: 12px;
}

:host button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
  border-radius: 8px;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.15s ease, background 0.15s ease;
}

:host button:hover {
  transform: translateY(-2px);
}

:host .next-button {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
}

:host .next-button:hover {
  background: rgba(255, 255, 255, 0.25);
}

:host .prev-button {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.4); 
}

:host .icon {
  width: 17px;
  height: 17px;
}

@media (max-width: 720px) {
  :host .dialogue-stage {
    padding: 24px; 
  }

  :host .dialogue-wrapper,
  :host .dialogue-wrapper.right {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }

  :host .dialogue-wrapper.narrator .dialogue-bubble {
    max-width: 100%;
  }

  :host .dialogue-wrapper.right h1 {
    text-align: center;
  }

  :host .avatar {
    width: 160px;
    height: 160px;
  }

  :host .dialogue-bubble,
  :host .dialogue-wrapper.right .dialogue-bubble {
    border-radius: 20px;
    width: 100%;
  }

  :host .button-group {
    align-self: flex-end;
  }
}

@media (max-width: 480px) {
  :host .dialogue-stage {
    padding: 18px 14px;
  }

  :host .history {
    max-height: 40vh;
  }

  :host .history-item {
    max-width: 100%;
  }

  :host .history-item img {
    width: 46px;
    height: 46px;
  }

  :host .avatar {
    width: 118px;
    height: 118px;
  }

  :host .dialogue-bubble {
    min-height: 0;
    padding: 18px;
  }

  :host .typewriter-text {
    font-size: 1rem;
  }

  :host .button-group,
  :host .button-group button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  :host .dialogue-wrapper,
  :host .typewriter-text.typing::after {
    animation: none;
  }
}`;
