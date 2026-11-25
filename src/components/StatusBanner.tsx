import {
  RefreshCw,
} from 'lucide-react';
import { useTranslate } from '@/i18n';

/** Thin bar shown in Demo mode or while syncing with Google Drive */
export function StatusBanner({ isDemo, syncing }: { isDemo: boolean; syncing: boolean }) {
  const { t } = useTranslate();
  if (!isDemo && !syncing) return null;

  return (
    <div className="px-4 py-1.5 bg-[#EBF1EA] text-[#2D5436] text-[11px] font-semibold flex items-center justify-center gap-1.5">
      {syncing ? (
        <>
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>{t('home.syncing')}</span>
        </>
      ) : (
        <span>{t('home.demoBanner')}</span>
      )}
    </div>
  );
}
