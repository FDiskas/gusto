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
    <nav className="absolute bottom-0 inset-x-0 bg-[#F8F7F2]/95 backdrop-blur-md border-t border-[#E6E3D8] px-6 py-3 flex items-center justify-around md:justify-center md:gap-16 z-20">
      {NAV_ITEMS.map(({ tab, Icon, labelKey }) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              isActive ? 'text-[#2D5436]' : 'text-[#868E88]'
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
