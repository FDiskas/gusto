import { describe, expect, test } from 'bun:test';
import { renderToString } from 'react-dom/server';
import App from '@/App';
import { DiscoverTab } from '@/components/DiscoverTab';
import { FridgeTab } from '@/components/FridgeTab';
import { SavedTab } from '@/components/SavedTab';
import { INITIAL_DEMO_RECIPES } from '@/domain/demo-data';
import type { RecipeListHandlers } from '@/domain/types';
import { I18nProvider } from '@/i18n';

const handlers: RecipeListHandlers = { onOpen: () => {}, onToggleSave: () => {} };
const render = (node: React.ReactNode) => renderToString(<I18nProvider>{node}</I18nProvider>);

describe('rendering', () => {
  test('signed-out app shows the landing page with both login options', () => {
    const html = renderToString(<App />);
    expect(html).toContain('Prisijungti su Google');
    expect(html).toContain('Išbandyti Demo režimu');
  });

  test('discover tab lists every demo recipe', () => {
    const html = render(
      <DiscoverTab recipes={INITIAL_DEMO_RECIPES} handlers={handlers} onAddRecipe={() => {}} onOpenFridge={() => {}} />
    );
    for (const recipe of INITIAL_DEMO_RECIPES) expect(html).toContain(recipe.title);
  });

  test('fridge tab ranks recipes for the default fridge items', () => {
    const html = render(<FridgeTab recipes={INITIAL_DEMO_RECIPES} handlers={handlers} />);
    expect(html).toContain('Kepta lašiša su smidrais');
  });

  test('saved tab shows only saved recipes', () => {
    const html = render(<SavedTab recipes={INITIAL_DEMO_RECIPES} handlers={handlers} />);
    expect(html).toContain('Kepta lašiša su smidrais');
    expect(html).not.toContain('Trinta moliūgų sriuba');
  });
});
