import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { describeError } from '@/lib/error';
import { GoogleDriveDocsService } from '@/services/google-drive';
import type { RecipeDraft } from '@/domain/types';

const draft: RecipeDraft = {
  title: 'Kepti kiausiniai',
  prepTime: 25,
  tags: ['dinner'],
  imageUrl: 'https://example.com/a.jpg',
  ingredients: ['kiausiniai'],
  steps: ['kepti'],
  saved: false,
};

interface Call {
  method: string;
  url: string;
}

const realFetch = globalThis.fetch;
let calls: Call[];

/** Answers Drive/Docs calls from a table of `METHOD url-part` -> response, anything else succeeds */
function mockGoogle(failures: Record<string, { status: number; body: unknown }>) {
  calls = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    calls.push({ method, url });
    const failure = Object.entries(failures).find(
      ([key]) => key === `${method} ${url.split('?')[0]!.split('/').slice(-1)[0]}`
    );
    if (failure) return new Response(JSON.stringify(failure[1].body), { status: failure[1].status });
    if (url.includes('/files?q=')) return Response.json({ files: [{ id: 'folder-1' }] });
    if (url.includes('/documents/') && method === 'GET') return Response.json({ body: { content: [] } });
    return Response.json({ id: 'doc-1', name: draft.title });
  }) as typeof fetch;
}

beforeEach(() => mockGoogle({}));
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('createRecipe', () => {
  test('throws the readable Google error message, not raw JSON', async () => {
    mockGoogle({ 'POST doc-1:batchUpdate': { status: 400, body: { error: { message: 'Invalid range' } } } });
    const service = new GoogleDriveDocsService('token');
    const error = await service.createRecipe(draft).catch((e) => e);
    expect(describeError(error)).toBe('Google API (400): Invalid range');
  });

  test('trashes the half-made document when writing its body fails', async () => {
    mockGoogle({ 'POST doc-1:batchUpdate': { status: 400, body: { error: { message: 'Invalid range' } } } });
    const service = new GoogleDriveDocsService('token');
    await service.createRecipe(draft).catch(() => undefined);
    expect(calls.some((c) => c.method === 'PATCH' && c.url.includes('/files/doc-1'))).toBe(true);
  });

  test('does not trash anything when saving works', async () => {
    const service = new GoogleDriveDocsService('token');
    await service.createRecipe(draft);
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  test('keeps the recipe and reports the reason when the photo cannot be inserted', async () => {
    mockGoogle({ 'POST permissions': { status: 403, body: { error: { message: 'Sharing is blocked' } } } });
    const service = new GoogleDriveDocsService('token');
    const reasons: string[] = [];
    service.onPhotoInsertFailed = (reason) => reasons.push(reason);

    const saved = await service.createRecipe({ ...draft, photo: new Blob(['x'], { type: 'image/jpeg' }) });

    expect([saved.id, reasons]).toEqual(['doc-1', ['Google API (403): Sharing is blocked']]);
  });
});

describe('listRecipes', () => {
  test('fills defaults for a document without metadata', async () => {
    const [recipe] = await new GoogleDriveDocsService('token').listRecipes();
    expect(recipe).toMatchObject({
      id: 'folder-1',
      prepTime: 25,
      tags: ['dinner'],
      saved: false,
      docUrl: 'https://docs.google.com/document/d/folder-1/edit',
    });
  });

  test('still lists a recipe whose document cannot be read, without ingredients and steps', async () => {
    mockGoogle({ 'GET folder-1': { status: 403, body: { error: { message: 'Restricted' } } } });
    const [recipe] = await new GoogleDriveDocsService('token').listRecipes();
    expect([recipe?.ingredients, recipe?.steps]).toEqual([[], []]);
  });
});

describe('describeError', () => {
  test('reads the message of an Error', () => {
    expect(describeError(new Error('boom'))).toBe('boom');
  });

  test('returns an empty text for unknown values', () => {
    expect(describeError(undefined)).toBe('');
  });
});
