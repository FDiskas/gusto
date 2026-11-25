import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav, type AppTab } from '@/components/BottomNav';
import { DiscoverTab } from '@/components/DiscoverTab';
import { FamilyShareModal } from '@/components/FamilyShareModal';
import { FridgeTab } from '@/components/FridgeTab';
import { LandingPage } from '@/components/LandingPage';
import { RecipeDetailView } from '@/components/RecipeDetailView';
import { RecipeEditorModal } from '@/components/RecipeEditorModal';
import { SavedTab } from '@/components/SavedTab';
import { StatusBanner } from '@/components/StatusBanner';
import { Toast } from '@/components/Toast';
import { DEMO_USER } from '@/domain/constants';
import type { Recipe, RecipeListHandlers, UserProfile } from '@/domain/types';
import { useGoogleClientId } from '@/hooks/useGoogleClientId';
import { useRecipeLibrary } from '@/hooks/useRecipeLibrary';
import { useToast } from '@/hooks/useToast';
import { I18nProvider, useTranslate } from '@/i18n';
import { GoogleDriveDocsService } from '@/services/google-drive';
import { requestGoogleAccess, type GoogleAccess } from '@/services/google-identity';
import { clearGoogleSession, isSessionActive, loadGoogleSession, saveGoogleSession } from '@/services/google-session';

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

function AppContent() {
  const { t } = useTranslate();
  const { toast, notify } = useToast();
  const { clientId, setClientId, isFromEnv } = useGoogleClientId();

  const [user, setUser] = useState<UserProfile | null>(null);
  /** Starts true when a stored Google session is about to be restored, so the landing page does not flash */
  const [authLoading, setAuthLoading] = useState(() => loadGoogleSession() !== null);
  const [authError, setAuthError] = useState<string | null>(null);

  const library = useRecipeLibrary({ userName: user?.name, notify, onSyncError: setAuthError });

  const [activeTab, setActiveTab] = useState<AppTab>('discover');
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  /** `undefined` = editor closed, `null` = creating a new recipe */
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null | undefined>(undefined);
  const [showFamilyModal, setShowFamilyModal] = useState(false);

  const activeRecipe = library.recipes.find((recipe) => recipe.id === activeRecipeId) ?? null;

  const startGoogleSession = async (access: GoogleAccess) => {
    saveGoogleSession(access);
    setUser({
      name: access.profile.name || 'Google User',
      email: access.profile.email || '',
      avatar: access.profile.picture,
      isDemo: false,
    });
    await library.connectGoogle(new GoogleDriveDocsService(access.accessToken));
  };

  useEffect(() => {
    const stored = loadGoogleSession();
    if (!stored) return;

    const restoreSession = async () => {
      try {
        const access = isSessionActive(stored)
          ? stored
          : await requestGoogleAccess(clientId, { prompt: 'none', loginHint: stored.profile.email });
        await startGoogleSession(access);
      } catch {
        clearGoogleSession();
      } finally {
        setAuthLoading(false);
      }
    };
    void restoreSession();
  }, []);

  /** The landing page can be scrolled down when the user logs in. The app shell must start at the top so the header is visible. */
  useEffect(() => {
    if (user) window.scrollTo(0, 0);
  }, [user]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    if (!clientId.trim()) {
      setAuthError(t('error.missingClientId'));
      return;
    }

    setAuthLoading(true);
    try {
      await startGoogleSession(await requestGoogleAccess(clientId.trim()));
    } catch {
      setAuthError(t('error.authFailed'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setAuthError(null);
    setUser({ ...DEMO_USER, isDemo: true });
    library.startDemo();
  };

  const handleLogout = () => {
    clearGoogleSession();
    setUser(null);
    library.disconnect();
    setActiveRecipeId(null);
    setEditingRecipe(undefined);
    setShowFamilyModal(false);
  };

  const handleDeleteRecipe = async (id: string) => {
    await library.deleteRecipe(id);
    setActiveRecipeId(null);
  };

  const listHandlers: RecipeListHandlers = {
    onOpen: (recipe) => setActiveRecipeId(recipe.id),
    onToggleSave: (recipe, event) => {
      event.stopPropagation();
      void library.toggleSaved(recipe);
    },
  };

  if (!user) {
    return (
      <LandingPage
        clientId={clientId}
        setClientId={setClientId}
        clientIdFromEnv={isFromEnv}
        onGoogleLogin={handleGoogleLogin}
        onDemoLogin={handleDemoLogin}
        authLoading={authLoading}
        authError={authError}
      />
    );
  }

  return (
    <>
      <div className="h-dvh overflow-hidden bg-canvas sm:py-6 flex justify-center">
        <div className="w-full max-w-md md:max-w-3xl pt-[env(safe-area-inset-top)] h-dvh sm:h-[calc(100dvh-3rem)] sm:max-h-[900px] bg-surface sm:rounded-[38px] sm:shadow-2xl sm:border sm:border-line flex flex-col relative overflow-hidden">
          <StatusBanner isDemo={user.isDemo} syncing={library.syncing} />

          <AppHeader
            collaboratorCount={library.collaborators.length}
            syncing={library.syncing}
            onOpenFamily={() => setShowFamilyModal(true)}
            onSync={library.sync}
            onLogout={handleLogout}
          />

          {/* Tabs stay mounted so search text and fridge items survive tab switches */}
          <main className="flex-1 overflow-y-auto overscroll-contain px-5 md:px-8 pb-[calc(7rem+env(safe-area-inset-bottom))]">
            <div hidden={activeTab !== 'discover'}>
              <DiscoverTab
                recipes={library.recipes}
                handlers={listHandlers}
                onAddRecipe={() => setEditingRecipe(null)}
                onOpenFridge={() => setActiveTab('fridge')}
              />
            </div>
            <div hidden={activeTab !== 'fridge'}>
              <FridgeTab recipes={library.recipes} handlers={listHandlers} />
            </div>
            <div hidden={activeTab !== 'saved'}>
              <SavedTab recipes={library.recipes} handlers={listHandlers} />
            </div>
          </main>

          <button
            onClick={() => setEditingRecipe(null)}
            className="fixed sm:absolute right-5 md:right-8 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-20 w-13 h-13 rounded-full bg-brand hover:bg-brand-hover active:scale-95 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer"
            aria-label={t('editor.newTitle')}
          >
            <Plus className="w-6 h-6" />
          </button>

          <BottomNav activeTab={activeTab} onChange={setActiveTab} />

          {toast && <Toast message={toast} />}
        </div>
      </div>

      {activeRecipe && (
        <RecipeDetailView
          recipe={activeRecipe}
          onClose={() => setActiveRecipeId(null)}
          onEdit={setEditingRecipe}
          onDelete={handleDeleteRecipe}
          onToggleSave={listHandlers.onToggleSave}
        />
      )}

      {editingRecipe !== undefined && (
        <RecipeEditorModal
          initial={editingRecipe}
          onClose={() => setEditingRecipe(undefined)}
          onSave={async (draft, existingId) => {
            await library.saveRecipe(draft, existingId);
          }}
        />
      )}

      {showFamilyModal && (
        <FamilyShareModal
          collaborators={library.collaborators}
          folderId={library.folderId}
          onInvite={library.inviteCollaborator}
          onRemove={library.removeCollaborator}
          onClose={() => setShowFamilyModal(false)}
        />
      )}
    </>
  );
}
