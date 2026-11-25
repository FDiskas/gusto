import { useCallback, useState } from 'react';
import { DEFAULT_COLLAB_KEY, DEFAULT_STORAGE_KEY, DEMO_DOC_URL, DEMO_USER } from '@/domain/constants';
import { INITIAL_DEMO_COLLABS, INITIAL_DEMO_RECIPES } from '@/domain/demo-data';
import type { Collaborator, Recipe, RecipeDraft } from '@/domain/types';
import { useTranslate } from '@/i18n';
import { describeError } from '@/lib/error';
import { blobToDataUrl } from '@/lib/image';
import { GoogleDriveDocsService } from '@/services/google-drive';

interface DemoState {
  recipes: Recipe[];
  collaborators: Collaborator[];
}

function loadDemoState(): DemoState {
  try {
    const savedRecipes = localStorage.getItem(DEFAULT_STORAGE_KEY);
    const savedCollaborators = localStorage.getItem(DEFAULT_COLLAB_KEY);
    return {
      recipes: savedRecipes ? JSON.parse(savedRecipes) : INITIAL_DEMO_RECIPES,
      collaborators: savedCollaborators ? JSON.parse(savedCollaborators) : INITIAL_DEMO_COLLABS,
    };
  } catch {
    return { recipes: INITIAL_DEMO_RECIPES, collaborators: INITIAL_DEMO_COLLABS };
  }
}

function saveDemoState({ recipes, collaborators }: DemoState): void {
  try {
    localStorage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(recipes));
    localStorage.setItem(DEFAULT_COLLAB_KEY, JSON.stringify(collaborators));
  } catch {
    // Storage quota exceeded or unavailable: demo data is simply not persisted
  }
}

/**
 * Recipes and family collaborators, backed by Google Drive when signed in with Google
 * and by localStorage in Demo mode.
 */
export function useRecipeLibrary({
  userName,
  notify,
  onSyncError,
}: {
  userName?: string;
  notify: (message: string) => void;
  onSyncError: (message: string) => void;
}) {
  const { t } = useTranslate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [driveService, setDriveService] = useState<GoogleDriveDocsService | null>(null);

  const syncFromDrive = useCallback(
    async (service: GoogleDriveDocsService) => {
      setSyncing(true);
      try {
        const [loadedRecipes, loadedCollaborators] = await Promise.all([
          service.listRecipes(),
          service.listCollaborators(),
        ]);
        setRecipes(loadedRecipes);
        setCollaborators(loadedCollaborators);
        notify(t('toast.synced'));
      } catch (error) {
        onSyncError(describeError(error) || t('error.syncFailed'));
      } finally {
        setSyncing(false);
      }
    },
    [notify, onSyncError, t]
  );

  const connectGoogle = useCallback(
    async (service: GoogleDriveDocsService) => {
      service.onPhotoInsertFailed = (reason) => notify(t('toast.photoNotInDoc', { reason }));
      setDriveService(service);
      await syncFromDrive(service);
    },
    [notify, syncFromDrive, t]
  );

  const startDemo = useCallback(() => {
    const demoState = loadDemoState();
    setDriveService(null);
    setRecipes(demoState.recipes);
    setCollaborators(demoState.collaborators);
  }, []);

  const disconnect = useCallback(() => setDriveService(null), []);

  /** Applies a recipes change locally and, in Demo mode, persists it */
  const commitRecipes = (nextRecipes: Recipe[]) => {
    setRecipes(nextRecipes);
    if (!driveService) saveDemoState({ recipes: nextRecipes, collaborators });
  };

  const commitCollaborators = (nextCollaborators: Collaborator[]) => {
    setCollaborators(nextCollaborators);
    if (!driveService) saveDemoState({ recipes, collaborators: nextCollaborators });
  };

  /** Creates or updates a recipe and returns the stored version */
  const saveRecipe = async (draft: RecipeDraft, existingId?: string): Promise<Recipe> => {
    const { photo, ...data } = draft;
    const existing = existingId ? recipes.find((recipe) => recipe.id === existingId) : undefined;
    let saved: Recipe;

    if (driveService) {
      saved = existing
        ? await driveService.updateRecipe({ ...existing, ...data }, photo)
        : await driveService.createRecipe({ ...draft, authorName: userName });
    } else {
      const imageUrl = photo ? await blobToDataUrl(photo) : data.imageUrl;
      const updatedAt = new Date().toISOString();
      saved = existing
        ? { ...existing, ...data, imageUrl, updatedAt }
        : {
            ...data,
            imageUrl,
            id: `doc-${Date.now()}`,
            docUrl: DEMO_DOC_URL,
            updatedAt,
            authorName: userName || DEMO_USER.name,
          };
    }

    commitRecipes(existing ? recipes.map((recipe) => (recipe.id === saved.id ? saved : recipe)) : [saved, ...recipes]);
    notify(t('toast.saved'));
    return saved;
  };

  /** Toggles the heart immediately and reverts it if Drive rejects the change */
  const toggleSaved = async (recipe: Recipe) => {
    const toggled = { ...recipe, saved: !recipe.saved };
    const replaceWith = (replacement: Recipe) =>
      setRecipes((current) => current.map((item) => (item.id === recipe.id ? replacement : item)));
    replaceWith(toggled);

    if (!driveService) {
      saveDemoState({ recipes: recipes.map((item) => (item.id === recipe.id ? toggled : item)), collaborators });
      return;
    }
    try {
      await driveService.toggleSaved(recipe);
    } catch {
      replaceWith(recipe);
    }
  };

  const deleteRecipe = async (id: string) => {
    const recipe = recipes.find((item) => item.id === id);
    if (driveService && recipe) await driveService.deleteRecipe(recipe);
    commitRecipes(recipes.filter((item) => item.id !== id));
    notify(t('toast.deleted'));
  };

  const inviteCollaborator = async (email: string, role: 'writer' | 'reader') => {
    const added: Collaborator = driveService
      ? await driveService.addCollaborator(email, role)
      : { id: `c-${Date.now()}`, email, displayName: email.split('@')[0] ?? email, role };
    commitCollaborators([...collaborators, added]);
    notify(t('toast.invited', { email }));
  };

  const removeCollaborator = async (permissionId: string) => {
    if (driveService) await driveService.removeCollaborator(permissionId);
    commitCollaborators(collaborators.filter((collaborator) => collaborator.id !== permissionId));
    notify(t('toast.removed'));
  };

  return {
    recipes,
    collaborators,
    syncing,
    isGoogleConnected: driveService !== null,
    folderId: driveService?.folderId ?? null,
    connectGoogle,
    startDemo,
    disconnect,
    sync: driveService ? () => syncFromDrive(driveService) : undefined,
    saveRecipe,
    toggleSaved,
    deleteRecipe,
    inviteCollaborator,
    removeCollaborator,
  };
}
