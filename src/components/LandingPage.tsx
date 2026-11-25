import { useState } from 'react';
import {
  Clock,
  Refrigerator,
  Users,
  FileText,
  Sparkles,
  RefreshCw,
  ChefHat,
  Settings,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useTranslate } from '@/i18n';
import { FOLDER_NAME } from '@/domain/constants';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

/** Landing Page shown before sign-in */
export function LandingPage({
  clientId,
  setClientId,
  clientIdFromEnv,
  onGoogleLogin,
  onDemoLogin,
  authLoading,
  authError,
}: {
  clientId: string;
  setClientId: (id: string) => void;
  clientIdFromEnv: boolean;
  onGoogleLogin: () => void;
  onDemoLogin: () => void;
  authLoading: boolean;
  authError: string | null;
}) {
  const { t } = useTranslate();
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-ink flex flex-col">
      {/* Top Bar */}
      <header className="w-full max-w-2xl md:max-w-3xl mx-auto px-5 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-brand flex items-center justify-center text-white shadow-sm">
            <ChefHat className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-ink">{t('app.name')}</span>
        </div>
        <LanguageSwitcher />
      </header>

      {/* Main Hero */}
      <main className="flex-1 w-full max-w-2xl md:max-w-3xl mx-auto px-5 pt-4 pb-12 flex flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-soft text-brand-ink text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('landing.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15] text-ink mb-4">
            {t('landing.title')}
          </h1>
          <p className="text-base text-muted leading-relaxed mb-7">{t('landing.subtitle')}</p>

          {/* Hero Visual Card */}
          <div className="relative rounded-3xl overflow-hidden shadow-md mb-7 h-52 sm:h-64 md:h-72 group">
            <img
              src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1000&q=80"
              alt={t('landing.preview.alt')}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-semibold text-ink">
              <FileText className="w-3.5 h-3.5 text-brand" />
              <span>{t('landing.preview.file')}</span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
              <div>
                <p className="text-xs text-white/80 font-medium mb-0.5">{FOLDER_NAME}</p>
                <p className="text-xl font-bold leading-tight">{t('landing.preview.title')}</p>
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand text-xs font-semibold shadow-sm">
                <Clock className="w-3.5 h-3.5" /> {t('recipe.time', { min: 20 })}
              </span>
            </div>
          </div>

          {/* Auth Actions */}
          <div className="bg-white rounded-3xl p-5 border border-line shadow-sm mb-8">
            {authError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onGoogleLogin}
                disabled={authLoading}
                className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-brand hover:bg-brand-hover active:scale-[0.99] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {authLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M21.35 11.1H12v2.92h5.35c-.23 1.48-1.69 4.35-5.35 4.35-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.84 0 3.07.78 3.77 1.46l2.57-2.48C16.7 3.92 14.56 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.64-3.65 8.64-8.79 0-.59-.06-1.04-.14-1.11z"
                    />
                  </svg>
                )}
                <span>{t('landing.cta.google')}</span>
              </button>

              <button
                onClick={onDemoLogin}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-soft hover:bg-brand-soft-hover active:scale-[0.99] text-brand-ink font-semibold text-sm transition-all cursor-pointer"
              >
                <span>{t('landing.cta.demo')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Client ID collapsible setup */}
            {!clientIdFromEnv && (
              <div className="mt-4 pt-3 border-t border-surface-muted">
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t('landing.clientId.label')}</span>
                </button>
                {showConfig && (
                  <div className="mt-2.5 space-y-1.5">
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder={t('landing.clientId.placeholder')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-line-strong text-xs font-mono text-ink focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <p className="text-[11px] text-muted">{t('landing.clientId.help')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3 Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white rounded-2xl p-4 border border-line">
              <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink mb-1">{t('landing.feature1.title')}</h3>
              <p className="text-xs text-muted leading-relaxed">{t('landing.feature1.desc')}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-line">
              <div className="w-9 h-9 rounded-xl bg-tag-quick text-tag-quick-ink flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink mb-1">{t('landing.feature2.title')}</h3>
              <p className="text-xs text-muted leading-relaxed">{t('landing.feature2.desc')}</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-line">
              <div className="w-9 h-9 rounded-xl bg-tag-dessert text-tag-dessert-ink flex items-center justify-center mb-3">
                <Refrigerator className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink mb-1">{t('landing.feature3.title')}</h3>
              <p className="text-xs text-muted leading-relaxed">{t('landing.feature3.desc')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
