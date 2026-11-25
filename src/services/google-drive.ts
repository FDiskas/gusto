import { CURATED_IMAGES, FOLDER_NAME } from '@/domain/constants';
import {
  buildPhotoInsertRequest,
  buildRecipeDocRequests,
  buildRecipeDocRequestsWithPhotoSlot,
  parseGoogleDocBody,
  type DocRequest,
  type GoogleDocJson,
} from '@/services/doc-format';
import { nameFromEmail } from '@/lib/email';
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

const DEFAULT_PREP_TIME_MINUTES = 25;
const DEFAULT_TAG: TagId = 'dinner';

interface DriveFile {
  id: string;
  name?: string;
  modifiedTime?: string;
  webViewLink?: string;
  appProperties?: Record<string, string>;
  owners?: { displayName?: string }[];
}

interface DrivePermission {
  id: string;
  type?: string;
  role?: string;
  emailAddress?: string;
  displayName?: string;
}

interface DocLayoutJson {
  documentStyle?: {
    pageSize?: { width?: { magnitude?: number } };
    marginLeft?: { magnitude?: number };
    marginRight?: { magnitude?: number };
  };
}

interface DocBodyEndJson {
  body?: { content?: { endIndex?: number }[] };
}

const fallbackDocUrl = (docId: string) => `https://docs.google.com/document/d/${docId}/edit`;

function toCollaboratorRole(role: string | undefined): Collaborator['role'] {
  if (role === 'owner' || role === 'writer') return role;
  return 'reader';
}

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

  /** Calls the Google API and parses the JSON answer. Empty answers (HTTP 204) must be requested as `void`. */
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`Google API (${res.status}): ${readApiErrorMessage(await res.text())}`);
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  /** Finds an existing `Gusto Family Recipes` folder (owned or shared with user) or creates it */
  async ensureFamilyFolder(): Promise<string> {
    if (this.folderId) return this.folderId;

    const query = encodeURIComponent(
      `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`
    );
    const data = await this.request<{ files?: DriveFile[] }>(
      `${DRIVE_API}/files?q=${query}&fields=files(id,name,shared)`
    );

    const [existingFolder] = data.files ?? [];
    if (existingFolder) {
      this.folderId = existingFolder.id;
      return existingFolder.id;
    }

    const created = await this.request<DriveFile>(`${DRIVE_API}/files`, {
      method: 'POST',
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    this.folderId = created.id;
    return created.id;
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
    const file = await this.request<DriveFile>(`${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id`, {
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
    const doc = await this.request<DocLayoutJson>(`${DOCS_API}/documents/${docId}?fields=documentStyle`);
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
    const permission = await this.request<DrivePermission>(`${DRIVE_API}/files/${fileId}/permissions?fields=id`, {
      method: 'POST',
      body: JSON.stringify({ type: 'anyone', role: 'reader' }),
    });
    try {
      return await action(`https://drive.google.com/uc?export=view&id=${fileId}`);
    } finally {
      await this.request<void>(`${DRIVE_API}/files/${fileId}/permissions/${permission.id}`, {
        method: 'DELETE',
      }).catch(() => undefined);
    }
  }

  private batchUpdate(docId: string, requests: DocRequest[]) {
    return this.request<unknown>(`${DOCS_API}/documents/${docId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  /** Request that empties the document, so a rewritten recipe does not pile up on the old text */
  private async buildClearRequests(docId: string): Promise<DocRequest[]> {
    const currentDoc = await this.request<DocBodyEndJson>(`${DOCS_API}/documents/${docId}`);
    const content = currentDoc?.body?.content ?? [];
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
    const bodyRequests = photoFileId ? buildRecipeDocRequestsWithPhotoSlot(recipe) : buildRecipeDocRequests(recipe);
    await this.batchUpdate(docId, [...clearRequests, ...bodyRequests]);
    if (photoFileId) await this.insertPhotoIntoDoc(docId, photoFileId);
  }

  /** Lists all Google Docs inside the family folder and hydrates their content */
  async listRecipes(): Promise<Recipe[]> {
    const folderId = await this.ensureFamilyFolder();
    const query = encodeURIComponent(
      `'${folderId}' in parents and mimeType='application/vnd.google-apps.document' and trashed=false`
    );
    const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink,appProperties,owners(displayName))');
    const data = await this.request<{ files?: DriveFile[] }>(
      `${DRIVE_API}/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc`
    );

    return Promise.all((data.files ?? []).map((file) => this.hydrateRecipe(file)));
  }

  private async hydrateRecipe(file: DriveFile): Promise<Recipe> {
    const props = file.appProperties ?? {};
    const imageFileId = props.imageFileId || undefined;
    const [{ ingredients, steps }, imageUrl] = await Promise.all([
      this.readDocContent(file.id),
      this.resolveImageUrl(imageFileId, props.imageUrl),
    ]);

    return {
      id: file.id,
      title: file.name ?? '',
      prepTime: Number(props.prepTime) || DEFAULT_PREP_TIME_MINUTES,
      tags: props.tags ? (props.tags.split(',').filter(Boolean) as TagId[]) : [DEFAULT_TAG],
      imageUrl,
      imageFileId,
      ingredients,
      steps,
      saved: props.saved === 'true',
      docUrl: file.webViewLink || fallbackDocUrl(file.id),
      updatedAt: file.modifiedTime || new Date().toISOString(),
      authorName: file.owners?.[0]?.displayName,
    };
  }

  /** An empty or restricted document is shown as a recipe without ingredients and steps */
  private async readDocContent(docId: string): Promise<{ ingredients: string[]; steps: string[] }> {
    try {
      return parseGoogleDocBody(await this.request<GoogleDocJson>(`${DOCS_API}/documents/${docId}`));
    } catch {
      return { ingredients: [], steps: [] };
    }
  }

  /** A deleted or unshared photo keeps the stored image URL (or the first curated image) */
  private async resolveImageUrl(imageFileId: string | undefined, storedUrl: string | undefined): Promise<string> {
    const fallbackUrl = storedUrl || CURATED_IMAGES[0]!;
    if (!imageFileId) return fallbackUrl;
    try {
      return await this.loadPhotoUrl(imageFileId);
    } catch {
      return fallbackUrl;
    }
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
      const file = await this.request<DriveFile>(`${DRIVE_API}/files?fields=id,name,webViewLink,modifiedTime`, {
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
        docUrl: file.webViewLink || fallbackDocUrl(file.id),
        updatedAt: file.modifiedTime || new Date().toISOString(),
      };
    } catch (error) {
      // Leave nothing half-made behind, otherwise every retry adds another broken doc
      await Promise.all(
        [docId, imageFileId]
          .filter((id): id is string => Boolean(id))
          .map((id) => this.trashFile(id).catch(() => undefined))
      );
      throw error;
    }
  }

  /** Updates Drive metadata and rewrites the Google Doc, re-inserting the top photo */
  async updateRecipe(recipe: Recipe, photo?: Blob): Promise<Recipe> {
    const imageFileId = photo ? await this.uploadPhoto(photo, recipe.title) : recipe.imageFileId;

    await this.patchFile(recipe.id, {
      name: recipe.title,
      appProperties: this.buildAppProperties(recipe, imageFileId, false),
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
    await this.patchFile(recipe.id, { appProperties: { saved: String(nextSaved) } });
    return { ...recipe, saved: nextSaved };
  }

  private async patchFile(fileId: string, changes: Record<string, unknown>): Promise<void> {
    await this.request<unknown>(`${DRIVE_API}/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    });
  }

  private trashFile(fileId: string): Promise<void> {
    return this.patchFile(fileId, { trashed: true });
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
    const data = await this.request<{ permissions?: DrivePermission[] }>(
      `${DRIVE_API}/files/${folderId}/permissions?fields=${fields}`
    );
    return (data.permissions ?? [])
      .filter((permission) => permission.type === 'user')
      .map((permission) => ({
        id: permission.id,
        email: permission.emailAddress || '',
        displayName: permission.displayName || permission.emailAddress || 'User',
        role: toCollaboratorRole(permission.role),
      }));
  }

  /** Shares the entire family folder with a collaborator via Google Drive Permissions API */
  async addCollaborator(email: string, role: 'writer' | 'reader'): Promise<Collaborator> {
    const folderId = await this.ensureFamilyFolder();
    const created = await this.request<DrivePermission>(
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
      displayName: created.displayName || nameFromEmail(email),
      role,
    };
  }

  /** Removes a collaborator from the shared family folder */
  async removeCollaborator(permissionId: string): Promise<void> {
    const folderId = await this.ensureFamilyFolder();
    await this.request<void>(`${DRIVE_API}/files/${folderId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }
}
