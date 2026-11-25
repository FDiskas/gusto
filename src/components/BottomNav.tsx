import { Compass, Heart, Refrigerator } from 'lucide-react';
import { useTranslate } from '@/i18n';
import type { TranslationKey } from '@/i18n/translations';

export type AppTab = 'discover' | 'fridge' | 'saved';

const NAV_ITEMS: { tab: AppTab; Icon: typeof Compass; labelKey: TranslationKey }[] = [
  { tab: 'discover', Icon: Compass, labelKey: 'nav.discover' },
  { tab: 'fridge', Icon: Refrigerator, labelKey: 'nav.fridge' },
  { tab: 'saved', Icon: Heart, labelKey: 'nav.saved' },
];

export function BottomNav({ activeTab, onChange }: { activeTab: AppTab; onChange: (tab: AppTab) => void }) {
  const { t } = useTranslate();

  return (
    <nav className="fixed sm:absolute bottom-0 inset-x-0 bg-surface/95 backdrop-blur-md border-t border-line px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around md:justify-center md:gap-16 z-20">
      {NAV_ITEMS.map(({ tab, Icon, labelKey }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              isActive ? 'text-brand-ink' : 'text-subtle'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px] font-bold">{t(labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}
