import {
  Users,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useTranslate } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/** App title bar with language switch, family access, Drive sync and logout */
export function AppHeader({ collaboratorCount, syncing, onOpenFamily, onSync, onLogout }: {
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
        <span className="text-2xl font-extrabold tracking-tight text-[#2B332D]">
          {t('app.name')}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        {/* Family Share Button */}
        <button
          onClick={onOpenFamily}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#EBF1EA] text-[#2D5436] text-xs font-bold hover:bg-[#DCE7DA] transition-colors cursor-pointer"
          title={t('family.title')}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{collaboratorCount}</span>
        </button>

        {onSync && (
          <button
            onClick={onSync}
            className="w-8 h-8 rounded-full bg-white border border-[#E4E1D6] flex items-center justify-center text-[#3D453F] hover:bg-[#F1EFE7] cursor-pointer"
            title="Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        )}

        <button
          onClick={onLogout}
          className="w-8 h-8 rounded-full bg-white border border-[#E4E1D6] flex items-center justify-center text-[#3D453F] hover:text-red-600 cursor-pointer"
          title="Logout"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
