import { useState } from 'react';
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
import { requestGoogleAccess } from '@/services/google-identity';

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
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const library = useRecipeLibrary({ userName: user?.name, notify, onSyncError: setAuthError });

  const [activeTab, setActiveTab] = useState<AppTab>('discover');
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  /** `undefined` = editor closed, `null` = creating a new recipe */
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null | undefined>(undefined);
  const [showFamilyModal, setShowFamilyModal] = useState(false);

  const activeRecipe = library.recipes.find((recipe) => recipe.id === activeRecipeId) ?? null;

  const handleGoogleLogin = async () => {
    setAuthError(null);
    if (!clientId.trim()) {
      setAuthError(t('error.missingClientId'));
      return;
    }

    setAuthLoading(true);
    try {
      const { accessToken, profile } = await requestGoogleAccess(clientId.trim());
      setUser({
        name: profile.name || 'Google User',
        email: profile.email || '',
        avatar: profile.picture,
        isDemo: false,
      });
      await library.connectGoogle(new GoogleDriveDocsService(accessToken));
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
      <div className="min-h-dvh bg-[#EFECE3] sm:py-6 flex justify-center">
        <div className="w-full max-w-md md:max-w-3xl h-dvh sm:h-[calc(100dvh-3rem)] sm:max-h-[900px] bg-[#F8F7F2] sm:rounded-[38px] sm:shadow-2xl sm:border sm:border-[#E2DFD3] flex flex-col relative overflow-hidden">
          <StatusBanner isDemo={user.isDemo} syncing={library.syncing} />

          <AppHeader
            collaboratorCount={library.collaborators.length}
            syncing={library.syncing}
            onOpenFamily={() => setShowFamilyModal(true)}
            onSync={library.sync}
            onLogout={handleLogout}
          />

          {/* Tabs stay mounted so search text and fridge items survive tab switches */}
          <main className="flex-1 overflow-y-auto px-5 md:px-8 pb-28">
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
            className="absolute right-5 md:right-8 bottom-24 z-20 w-13 h-13 rounded-full bg-[#3E6B48] hover:bg-[#32583B] active:scale-95 text-white shadow-lg flex items-center justify-center transition-all cursor-pointer"
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
