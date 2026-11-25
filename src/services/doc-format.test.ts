import { describe, expect, test } from 'bun:test';
import {
  buildPhotoInsertRequest,
  buildRecipeDocRequests,
  buildRecipeDocRequestsWithPhotoSlot,
  parseGoogleDocBody,
  type DocRequest,
} from '@/services/doc-format';
import type { Recipe } from '@/domain/types';

const recipe: Omit<Recipe, 'id' | 'docUrl' | 'updatedAt'> = {
  title: 'Kepti kiausiniai',
  prepTime: 25,
  tags: ['dinner', 'quick'],
  imageUrl: '',
  ingredients: ['3 kiausiniai', '1 druskos'],
  steps: ['Ikaitini keptuve', 'Imi kiausini', 'Pabarstai druskos'],
  saved: false,
};

const PHOTO = { uri: 'https://example.com/photo.jpg', widthPt: 468 };

function insertedText(requests: DocRequest[]): string {
  const insert = requests.find((r) => 'insertText' in r) as { insertText: { text: string } };
  return insert.insertText.text;
}

function requestsOfType(requests: DocRequest[], type: string): any[] {
  return requests.filter((r) => type in r).map((r) => r[type]);
}

function textInRange(text: string, range: { startIndex: number; endIndex: number }): string {
  return text.slice(range.startIndex - 1, range.endIndex - 1).replace(/\n$/, '');
}

function asDocJson(text: string) {
  return {
    body: {
      content: text.split('\n').map((line) => ({ paragraph: { elements: [{ textRun: { content: `${line}\n` } }] } })),
    },
  };
}

describe('buildRecipeDocRequests', () => {
  test('writes title and meta line without list markers', () => {
    const text = insertedText(buildRecipeDocRequests(recipe));
    expect(text.split('\n').slice(0, 2)).toEqual(['Kepti kiausiniai', '25 min  ·  dinner, quick']);
  });

  test('writes list items without typed bullet or number prefixes', () => {
    const text = insertedText(buildRecipeDocRequests(recipe));
    expect(text).not.toMatch(/[•]|^\d+\./m);
  });

  test('text stays readable by the parser', () => {
    const text = insertedText(buildRecipeDocRequests(recipe));
    expect(parseGoogleDocBody(asDocJson(text))).toEqual({
      ingredients: recipe.ingredients,
      steps: recipe.steps,
    });
  });

  test('styles the title paragraph as TITLE', () => {
    const requests = buildRecipeDocRequests(recipe);
    const text = insertedText(requests);
    const title = requestsOfType(requests, 'updateParagraphStyle').find(
      (r) => r.paragraphStyle.namedStyleType === 'TITLE'
    );
    expect(textInRange(text, title.range)).toBe('Kepti kiausiniai');
  });

  test('styles both section headings as HEADING_1', () => {
    const requests = buildRecipeDocRequests(recipe);
    const text = insertedText(requests);
    const headings = requestsOfType(requests, 'updateParagraphStyle')
      .filter((r) => r.paragraphStyle.namedStyleType === 'HEADING_1')
      .map((r) => textInRange(text, r.range));
    expect(headings).toEqual(['Ingredients', 'Steps']);
  });

  test('makes ingredients one bulleted list', () => {
    const requests = buildRecipeDocRequests(recipe);
    const text = insertedText(requests);
    const [bullets] = requestsOfType(requests, 'createParagraphBullets').filter(
      (r) => r.bulletPreset === 'BULLET_DISC_CIRCLE_SQUARE'
    );
    expect(textInRange(text, bullets.range)).toBe('3 kiausiniai\n1 druskos');
  });

  test('makes steps one numbered list', () => {
    const requests = buildRecipeDocRequests(recipe);
    const text = insertedText(requests);
    const [steps] = requestsOfType(requests, 'createParagraphBullets').filter(
      (r) => r.bulletPreset === 'NUMBERED_DECIMAL_ALPHA_ROMAN'
    );
    expect(textInRange(text, steps.range)).toBe('Ikaitini keptuve\nImi kiausini\nPabarstai druskos');
  });

  test('resets old list state before styling', () => {
    const requests = buildRecipeDocRequests(recipe);
    expect(Object.keys(requests[1]!)).toEqual(['deleteParagraphBullets']);
  });

  test('creates no list requests when ingredients and steps are empty', () => {
    const requests = buildRecipeDocRequests({ ...recipe, ingredients: [], steps: [] });
    expect(requestsOfType(requests, 'createParagraphBullets')).toEqual([]);
  });

  test('keeps headings when ingredients and steps are empty', () => {
    const text = insertedText(buildRecipeDocRequests({ ...recipe, ingredients: [], steps: [] }));
    expect(text.split('\n').slice(2)).toEqual(['Ingredients', 'Steps']);
  });

  test('omits the tags part of the meta line when there are no tags', () => {
    const text = insertedText(buildRecipeDocRequests({ ...recipe, tags: [] }));
    expect(text.split('\n')[1]).toBe('25 min');
  });

  test('adds no image request to the text requests', () => {
    expect(requestsOfType(buildRecipeDocRequestsWithPhotoSlot(recipe), 'insertInlineImage')).toEqual([]);
  });

  test('leaves an empty first paragraph for the photo', () => {
    const text = insertedText(buildRecipeDocRequestsWithPhotoSlot(recipe));
    expect(text.startsWith('\nKepti kiausiniai')).toBe(true);
  });

  test('has no empty first paragraph without a photo slot', () => {
    const text = insertedText(buildRecipeDocRequests(recipe));
    expect(text.startsWith('Kepti kiausiniai')).toBe(true);
  });

  test('keeps title range correct when a photo slot comes first', () => {
    const requests = buildRecipeDocRequestsWithPhotoSlot(recipe);
    const text = insertedText(requests);
    const title = requestsOfType(requests, 'updateParagraphStyle').find(
      (r) => r.paragraphStyle.namedStyleType === 'TITLE'
    );
    expect(textInRange(text, title.range)).toBe('Kepti kiausiniai');
  });

  test('inserts the photo at the start of the document', () => {
    const request = buildPhotoInsertRequest(PHOTO) as { insertInlineImage: { location: { index: number } } };
    expect(request.insertInlineImage.location.index).toBe(1);
  });

  test('sizes the photo to the given width', () => {
    const request = buildPhotoInsertRequest(PHOTO) as { insertInlineImage: { objectSize: { width: unknown } } };
    expect(request.insertInlineImage.objectSize.width).toEqual({ magnitude: 468, unit: 'PT' });
  });
});
