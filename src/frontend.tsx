/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { PRERENDERED_ROOT_ATTRIBUTE } from './domain/constants';
import { loadGoogleSession } from './services/google-session';

const elem = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

/** The prerendered HTML is the signed-out page, so a returning user with a stored session renders from scratch instead */
const canHydratePrerender = elem.hasAttribute(PRERENDERED_ROOT_ATTRIBUTE) && loadGoogleSession() === null;

if (canHydratePrerender) {
  hydrateRoot(elem, app);
} else {
  // https://bun.com/docs/bundler/hot-reloading#import-meta-hot-data
  (import.meta.hot.data.root ??= createRoot(elem)).render(app);
}

if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js');
}
