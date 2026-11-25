import { Users, LogOut, RefreshCw } from 'lucide-react';
import { useTranslate } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/** App title bar with language switch, family access, Drive sync and logout */
export function AppHeader({
  collaboratorCount,
  syncing,
  onOpenFamily,
  onSync,
  onLogout,
}: {
  collaboratorCount: number;
  syncing: boolean;
  onOpenFamily: () => void;
  /** Only provided when signed in with Google (Demo mode has nothing to sync) */
  onSync?: () => void;
  onLogout: () => void;
}) {
  const { t } = useTranslate();

  return (
    <header className="px-5 md:px-8 pt-5 pb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-ink">{t('app.name')}</span>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        {/* Family Share Button */}
        <button
          onClick={onOpenFamily}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-brand-soft text-brand-ink text-xs font-bold hover:bg-brand-soft-hover transition-colors cursor-pointer"
          title={t('family.title')}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{collaboratorCount}</span>
        </button>

        {onSync && (
          <button
            onClick={onSync}
            className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center text-ink-soft hover:bg-surface-muted cursor-pointer"
            title={t('header.sync')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}

        <button
          onClick={onLogout}
          className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center text-ink-soft hover:text-red-600 cursor-pointer"
          title={t('header.logout')}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
