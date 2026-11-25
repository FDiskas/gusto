import { renderToString } from 'react-dom/server';
import App from '@/App';

/** HTML of the signed-out app, so crawlers and first paint see the landing page without running JavaScript */
export function renderSignedOutAppHtml(): string {
  return renderToString(<App />);
}
