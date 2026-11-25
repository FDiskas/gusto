import { CURATED_IMAGES, FOLDER_NAME } from '@/domain/constants';
import {
  buildPhotoInsertRequest,
  buildRecipeDocRequests,
  buildRecipeDocRequestsWithPhotoSlot,
  parseGoogleDocBody,
  type DocRequest,
} from '@/services/doc-format';
import { describeError } from '@/lib/error';
import type { TagId, Recipe, RecipeInput, RecipeDraft, Collaborator } from '@/domain/types';

/**
 * Google Drive & Google Docs API client (runs entirely in the browser).
 *
 * Each recipe is stored as an individual Google Doc inside the shared
 * `Gusto Family Recipes` folder on Google Drive.
 *
 * - Metadata (prepTime, tags, imageUrl, saved) is stored in Drive `appProperties`
 *   for fast listing without opening every document.
 * - Full recipe content (Ingredients & Steps) is formatted as a clean, readable
 *   Google Doc so family members can also open & edit it directly in Google Docs!
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DOCS_API = 'https://docs.googleapis.com/v1';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
/** Default Google Docs text width (US Letter 612pt minus 2 x 72pt margins) */
const FALLBACK_DOC_TEXT_WIDTH_PT = 468;

/** Google wraps errors as `{ error: { message } }`; anything else is shown as it came */
function readApiErrorMessage(body: string): string {
  try {
    return JSON.parse(body)?.error?.message ?? body;
  } catch {
    return body;
  }
}

export class GoogleDriveDocsService {
  private token: string;
  public folderId: string | null = null;
  /** Called when the recipe was saved but its photo could not be put into the Google Doc */
  public onPhotoInsertFailed: (reason: string) => void = () => undefined;

  constructor(accessToken: string) {
    this.token = accessToken;
  }

  private async request(url: string, options: RequestInit = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`Google API (${res.status}): ${readApiErrorMessage(await res.text())}`);
    if (res.status === 204) return null;
    return res.json();
  }

  /** Finds an existing `Gusto Family Recipes` folder (owned or shared with user) or creates it */
  async ensureFamilyFolder(): Promise<string> {
    if (this.folderId) return this.folderId;

    const query = encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`
    );
    const data = await this.request(`${DRIVE_API}/files?q=${query}&fields=files(id,name,shared)`);

    if (data.files && data.files.length > 0) {
      this.folderId = data.files[0].id;
      return this.folderId!;
    }

    const created = await this.request(`${DRIVE_API}/files`, {
      method: 'POST',
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    this.folderId = created.id;
    return this.folderId!;
  }

  /** Uploads a photo into the family folder and returns its Drive file ID */
  private async uploadPhoto(photo: Blob, title: string): Promise<string> {
    const folderId = await this.ensureFamilyFolder();
    const boundary = `gusto-${Date.now()}`;
    const metadata = { name: `${title} (photo).jpg`, parents: [folderId], mimeType: 'image/jpeg' };
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\nContent-Type: image/jpeg\r\n\r\n`,
      photo,
      `\r\n--${boundary}--`,
    ]);
    const file = await this.request(`${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    return file.id;
  }

  /** Downloads an uploaded photo with the user's token and returns a local object URL */
  private async loadPhotoUrl(fileId: string): Promise<string> {
    const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error(`Google API (${res.status})`);
    return URL.createObjectURL(await res.blob());
  }

  /** Width of the printable area of the document, so the photo spans the full text width */
  private async getDocTextWidthPt(docId: string): Promise<number> {
    const doc = await this.request(`${DOCS_API}/documents/${docId}?fields=documentStyle`);
    const style = doc?.documentStyle;
    const pageWidth = style?.pageSize?.width?.magnitude;
    if (!pageWidth) return FALLBACK_DOC_TEXT_WIDTH_PT;
    const left = style?.marginLeft?.magnitude ?? 0;
    const right = style?.marginRight?.magnitude ?? 0;
    return pageWidth - left - right;
  }

  /**
   * Docs API can only insert images from a publicly reachable URL, so the photo
   * is shared via link just for the insert and the permission is removed afterwards.
   * Google copies the image into the document, so it keeps showing after revoking.
   */
  private async withTemporaryPublicLink<T>(fileId: string, action: (url: string) => Promise<T>): Promise<T> {
    const permission = await this.request(`${DRIVE_API}/files/${fileId}/permissions?fields=id`, {
      method: 'POST',
      body: JSON.stringify({ type: 'anyone', role: 'reader' }),
    });
    try {
      return await action(`https://drive.google.com/uc?export=view&id=${fileId}`);
    } finally {
      await this.request(`${DRIVE_API}/files/${fileId}/permissions/${permission.id}`, {
        method: 'DELETE',
      }).catch(() => undefined);
    }
  }

  private batchUpdate(docId: string, requests: DocRequest[]) {
    return this.request(`${DOCS_API}/documents/${docId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  /** Request that empties the document, so a rewritten recipe does not pile up on the old text */
  private async buildClearRequests(docId: string): Promise<DocRequest[]> {
    const currentDoc = await this.request(`${DOCS_API}/documents/${docId}`);
    const content = currentDoc?.body?.content || [];
    const endIndex = content[content.length - 1]?.endIndex || 1;
    if (endIndex <= 2) return [];
    return [{ deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } } }];
  }

  /** The photo is a nice extra: if Google refuses it, the recipe stays saved and the user is told why */
  private async insertPhotoIntoDoc(docId: string, photoFileId: string): Promise<void> {
    try {
      const widthPt = await this.getDocTextWidthPt(docId);
      await this.withTemporaryPublicLink(photoFileId, (uri) =>
        this.batchUpdate(docId, [buildPhotoInsertRequest({ uri, widthPt })])
      );
    } catch (error) {
      this.onPhotoInsertFailed(describeError(error));
    }
  }

  /** Writes the styled recipe text first, then the top photo (if any) into the document body */
  private async writeDocBody(
    docId: string,
    recipe: RecipeInput,
    photoFileId: string | undefined,
    clearFirst: boolean
  ): Promise<void> {
    const clearRequests = clearFirst ? await this.buildClearRequests(docId) : [];
    const bodyRequests = photoFileId
      ? buildRecipeDocRequestsWithPhotoSlot(recipe)
      : buildRecipeDocRequests(recipe);
    await this.batchUpdate(docId, [...clearRequests, ...bodyRequests]);
    if (photoFileId) await this.insertPhotoIntoDoc(docId, photoFileId);
  }

  /** Lists all Google Docs inside the family folder and hydrates their content */
  async listRecipes(): Promise<Recipe[]> {
    const folderId = await this.ensureFamilyFolder();
    const query = encodeURIComponent(
      `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`
    );
    const fields = encodeURIComponent(
      'files(id,name,modifiedTime,webViewLink,appProperties,owners(displayName))'
    );
    const data = await this.request(
      `${DRIVE_API}/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc`
    );

    const files = data.files || [];
    const recipes: Recipe[] = await Promise.all(
      files.map(async (f: any) => {
        let ingredients: string[] = [];
        let steps: string[] = [];
        try {
          const doc = await this.request(`${DOCS_API}/documents/${f.id}`);
          const parsed = parseGoogleDocBody(doc);
          ingredients = parsed.ingredients;
          steps = parsed.steps;
        } catch {
          // Fallback if doc is still empty or restricted
        }

        const props = f.appProperties || {};
        const parsedTags = (props.tags ? props.tags.split(',') : ['dinner']).filter(Boolean) as TagId[];
        const imageFileId: string | undefined = props.imageFileId || undefined;
        let imageUrl: string = props.imageUrl || CURATED_IMAGES[0]!;
        if (imageFileId) {
          try {
            imageUrl = await this.loadPhotoUrl(imageFileId);
          } catch {
            // Photo deleted or not shared: keep the fallback image
          }
        }

        return {
          id: f.id,
          title: f.name,
          prepTime: Number(props.prepTime) || 25,
          tags: parsedTags,
          imageUrl,
          imageFileId,
          ingredients,
          steps,
          saved: props.saved === 'true',
          docUrl: f.webViewLink || `https://docs.google.com/document/d/${f.id}/edit`,
          updatedAt: f.modifiedTime || new Date().toISOString(),
          authorName: f.owners?.[0]?.displayName,
        };
      })
    );

    return recipes;
  }

  /**
   * Drive `appProperties` allow ~124 bytes per entry, so only short URLs are stored.
   * `null` values remove a property on PATCH and are dropped on create.
   */
  private buildAppProperties(
    recipe: Omit<RecipeInput, 'ingredients' | 'steps'>,
    imageFileId: string | undefined,
    forCreate: boolean
  ) {
    const props: Record<string, string | null> = {
      prepTime: String(recipe.prepTime),
      tags: recipe.tags.join(','),
      imageUrl: imageFileId || recipe.imageUrl.length > 100 ? null : recipe.imageUrl,
      imageFileId: imageFileId ?? null,
      saved: String(recipe.saved),
    };
    return forCreate ? Object.fromEntries(Object.entries(props).filter(([, v]) => v !== null)) : props;
  }

  /** Creates a new Google Doc in the family folder and writes the recipe body */
  async createRecipe(input: RecipeDraft): Promise<Recipe> {
    const { photo, ...recipeInput } = input;
    const folderId = await this.ensureFamilyFolder();
    const imageFileId = photo ? await this.uploadPhoto(photo, input.title) : undefined;
    let docId: string | undefined;

    try {
      const file = await this.request(`${DRIVE_API}/files?fields=id,name,webViewLink,modifiedTime`, {
        method: 'POST',
        body: JSON.stringify({
          name: input.title,
          mimeType: 'application/vnd.google-apps.document',
          parents: [folderId],
          appProperties: this.buildAppProperties(recipeInput, imageFileId, true),
        }),
      });
      docId = file.id;
      await this.writeDocBody(file.id, recipeInput, imageFileId, false);

      return {
        ...recipeInput,
        imageUrl: photo ? URL.createObjectURL(photo) : recipeInput.imageUrl,
        imageFileId,
        id: file.id,
        docUrl: file.webViewLink || `https://docs.google.com/document/d/${file.id}/edit`,
        updatedAt: file.modifiedTime || new Date().toISOString(),
      };
    } catch (error) {
      // Leave nothing half-made behind, otherwise every retry adds another broken doc
      await Promise.all(
        [docId, imageFileId].filter((id): id is string => Boolean(id)).map((id) => this.trashFile(id).catch(() => undefined))
      );
      throw error;
    }
  }

  /** Updates Drive metadata and rewrites the Google Doc, re-inserting the top photo */
  async updateRecipe(recipe: Recipe, photo?: Blob): Promise<Recipe> {
    const imageFileId = photo ? await this.uploadPhoto(photo, recipe.title) : recipe.imageFileId;

    await this.request(`${DRIVE_API}/files/${recipe.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: recipe.title,
        appProperties: this.buildAppProperties(recipe, imageFileId, false),
      }),
    });

    await this.writeDocBody(recipe.id, recipe, imageFileId, true);

    return {
      ...recipe,
      imageUrl: photo ? URL.createObjectURL(photo) : recipe.imageUrl,
      imageFileId,
      updatedAt: new Date().toISOString(),
    };
  }

  /** Fast toggle for the saved heart state via Drive appProperties */
  async toggleSaved(recipe: Recipe): Promise<Recipe> {
    const nextSaved = !recipe.saved;
    await this.request(`${DRIVE_API}/files/${recipe.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        appProperties: { saved: String(nextSaved) },
      }),
    });
    return { ...recipe, saved: nextSaved };
  }

  private async trashFile(fileId: string): Promise<void> {
    await this.request(`${DRIVE_API}/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify({ trashed: true }),
    });
  }

  /** Moves the Google Doc and its uploaded photo to trash */
  async deleteRecipe(recipe: Recipe): Promise<void> {
    await this.trashFile(recipe.id);
    if (recipe.imageFileId) await this.trashFile(recipe.imageFileId).catch(() => undefined);
  }

  /** Lists all Google Drive collaborators on the shared family folder */
  async listCollaborators(): Promise<Collaborator[]> {
    const folderId = await this.ensureFamilyFolder();
    const fields = encodeURIComponent('permissions(id,emailAddress,displayName,role,type)');
    const data = await this.request(`${DRIVE_API}/files/${folderId}/permissions?fields=${fields}`);
    return (data.permissions || [])
      .filter((p: any) => p.type === 'user')
      .map((p: any) => ({
        id: p.id,
        email: p.emailAddress || '',
        displayName: p.displayName || p.emailAddress || 'User',
        role: p.role === 'owner' ? 'owner' : p.role === 'writer' ? 'writer' : 'reader',
      }));
  }

  /** Shares the entire family folder with a collaborator via Google Drive Permissions API */
  async addCollaborator(email: string, role: 'writer' | 'reader'): Promise<Collaborator> {
    const folderId = await this.ensureFamilyFolder();
    const created = await this.request(
      `${DRIVE_API}/files/${folderId}/permissions?sendNotificationEmail=true&fields=id,emailAddress,displayName,role`,
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'user',
          role,
          emailAddress: email,
        }),
      }
    );
    return {
      id: created.id,
      email: created.emailAddress || email,
      displayName: created.displayName || email.split('@')[0],
      role,
    };
  }

  /** Removes a collaborator from the shared family folder */
  async removeCollaborator(permissionId: string): Promise<void> {
    const folderId = await this.ensureFamilyFolder();
    await this.request(`${DRIVE_API}/files/${folderId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }
}
