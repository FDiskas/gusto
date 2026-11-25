import type { Recipe } from '@/domain/types';

type DocRecipe = Omit<Recipe, 'id' | 'docUrl' | 'updatedAt'>;
export type DocRequest = Record<string, unknown>;
type DocRange = { startIndex: number; endIndex: number };

export interface DocPhoto {
  uri: string;
  widthPt: number;
}

type ParagraphKind = 'photo' | 'title' | 'meta' | 'heading' | 'bullet' | 'step';

interface DocParagraph {
  kind: ParagraphKind;
  text: string;
}

interface PlacedParagraph extends DocRange {
  paragraph: DocParagraph;
}

const COLOR_TEXT = '#3B3326';
const COLOR_ACCENT = '#3E6B48';
const COLOR_DIVIDER = '#EDE3D2';

const FONT_HEADING = 'Georgia';
const FONT_BODY = 'Arial';

const FONT_SIZE_BODY_PT = 11;
const FONT_SIZE_META_PT = 11;
const FONT_SIZE_HEADING_PT = 15;
const FONT_SIZE_TITLE_PT = 26;

const LINE_SPACING_PERCENT = 115;
const SPACE_AFTER_PHOTO_PT = 14;
const SPACE_AFTER_TITLE_PT = 4;
const SPACE_AFTER_META_PT = 8;
const SPACE_BEFORE_HEADING_PT = 20;
const SPACE_AFTER_HEADING_PT = 6;
const SPACE_AFTER_LIST_ITEM_PT = 5;
const DIVIDER_WIDTH_PT = 1.5;
const DIVIDER_PADDING_PT = 8;

const META_SEPARATOR = '  ·  ';
const DOC_CONTENT_START_INDEX = 1;

const pt = (magnitude: number) => ({ magnitude, unit: 'PT' });

function toRgbColor(hex: string) {
  const channel = (offset: number) => parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return { color: { rgbColor: { red: channel(1), green: channel(3), blue: channel(5) } } };
}

function paragraphStyle(range: DocRange, style: DocRequest, fields: string): DocRequest {
  return { updateParagraphStyle: { range, paragraphStyle: style, fields } };
}

function textStyle(range: DocRange, style: DocRequest, fields: string): DocRequest {
  return { updateTextStyle: { range, textStyle: style, fields } };
}

function headingFontStyle(range: DocRange, sizePt: number, color: string): DocRequest {
  return textStyle(
    range,
    {
      weightedFontFamily: { fontFamily: FONT_HEADING },
      fontSize: pt(sizePt),
      bold: true,
      foregroundColor: toRgbColor(color),
    },
    'weightedFontFamily,fontSize,bold,foregroundColor'
  );
}

const listItemStyle = (range: DocRange) => [
  paragraphStyle(range, { spaceBelow: pt(SPACE_AFTER_LIST_ITEM_PT) }, 'spaceBelow'),
];

const STYLE_BUILDERS: Record<ParagraphKind, (range: DocRange) => DocRequest[]> = {
  photo: (range) => [paragraphStyle(range, { spaceBelow: pt(SPACE_AFTER_PHOTO_PT) }, 'spaceBelow')],
  title: (range) => [
    paragraphStyle(
      range,
      { namedStyleType: 'TITLE', spaceBelow: pt(SPACE_AFTER_TITLE_PT) },
      'namedStyleType,spaceBelow'
    ),
    headingFontStyle(range, FONT_SIZE_TITLE_PT, COLOR_TEXT),
  ],
  meta: (range) => [
    paragraphStyle(
      range,
      {
        spaceBelow: pt(SPACE_AFTER_META_PT),
        borderBottom: {
          color: toRgbColor(COLOR_DIVIDER),
          width: pt(DIVIDER_WIDTH_PT),
          padding: pt(DIVIDER_PADDING_PT),
          dashStyle: 'SOLID',
        },
      },
      'spaceBelow,borderBottom'
    ),
    textStyle(
      range,
      { fontSize: pt(FONT_SIZE_META_PT), foregroundColor: toRgbColor(COLOR_ACCENT), bold: true },
      'fontSize,foregroundColor,bold'
    ),
  ],
  heading: (range) => [
    paragraphStyle(
      range,
      {
        namedStyleType: 'HEADING_1',
        spaceAbove: pt(SPACE_BEFORE_HEADING_PT),
        spaceBelow: pt(SPACE_AFTER_HEADING_PT),
      },
      'namedStyleType,spaceAbove,spaceBelow'
    ),
    headingFontStyle(range, FONT_SIZE_HEADING_PT, COLOR_ACCENT),
  ],
  bullet: listItemStyle,
  step: listItemStyle,
};

function toParagraphs(recipe: DocRecipe, hasPhoto: boolean): DocParagraph[] {
  const meta = [`${recipe.prepTime} min`, recipe.tags.join(', ')].filter(Boolean).join(META_SEPARATOR);
  return [
    ...(hasPhoto ? [{ kind: 'photo' as const, text: '' }] : []),
    { kind: 'title', text: recipe.title },
    { kind: 'meta', text: meta },
    { kind: 'heading', text: 'Ingredients' },
    ...recipe.ingredients.map((text) => ({ kind: 'bullet' as const, text })),
    { kind: 'heading', text: 'Steps' },
    ...recipe.steps.map((text) => ({ kind: 'step' as const, text })),
  ];
}

/** Gives each paragraph its document range; every paragraph owns its trailing newline */
function placeParagraphs(paragraphs: DocParagraph[]): PlacedParagraph[] {
  let cursor = DOC_CONTENT_START_INDEX;
  return paragraphs.map((paragraph) => {
    const startIndex = cursor;
    cursor += paragraph.text.length + 1;
    return { paragraph, startIndex, endIndex: cursor };
  });
}

/** Merges adjacent paragraphs of one kind into single ranges */
function findRuns(placed: PlacedParagraph[], kind: ParagraphKind): DocRange[] {
  const runs: DocRange[] = [];
  let previousKind: ParagraphKind | null = null;
  for (const { paragraph, startIndex, endIndex } of placed) {
    if (paragraph.kind === kind) {
      const lastRun = runs[runs.length - 1];
      if (previousKind === kind && lastRun) lastRun.endIndex = endIndex;
      else runs.push({ startIndex, endIndex });
    }
    previousKind = paragraph.kind;
  }
  return runs;
}

/**
 * An old document keeps the list state of its last paragraph after being cleared,
 * so the freshly inserted text is reset to plain body text before it is styled.
 */
function resetToBodyText(range: DocRange): DocRequest[] {
  return [
    { deleteParagraphBullets: { range } },
    paragraphStyle(
      range,
      { namedStyleType: 'NORMAL_TEXT', spaceAbove: pt(0), lineSpacing: LINE_SPACING_PERCENT },
      'namedStyleType,spaceAbove,lineSpacing'
    ),
    textStyle(
      range,
      {
        weightedFontFamily: { fontFamily: FONT_BODY },
        fontSize: pt(FONT_SIZE_BODY_PT),
        foregroundColor: toRgbColor(COLOR_TEXT),
        bold: false,
        italic: false,
      },
      'weightedFontFamily,fontSize,foregroundColor,bold,italic'
    ),
  ];
}

function listRequests(placed: PlacedParagraph[]): DocRequest[] {
  const bullets = findRuns(placed, 'bullet').map((range) => ({
    createParagraphBullets: { range, bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE' },
  }));
  const steps = findRuns(placed, 'step').map((range) => ({
    createParagraphBullets: { range, bulletPreset: 'NUMBERED_DECIMAL_ALPHA_ROMAN' },
  }));
  return [...bullets, ...steps];
}

function buildRequests(recipe: DocRecipe, hasPhotoSlot: boolean): DocRequest[] {
  const placed = placeParagraphs(toParagraphs(recipe, hasPhotoSlot));
  const text = placed.map(({ paragraph }) => paragraph.text).join('\n');
  const whole: DocRange = {
    startIndex: DOC_CONTENT_START_INDEX,
    endIndex: DOC_CONTENT_START_INDEX + text.length + 1,
  };

  return [
    { insertText: { location: { index: DOC_CONTENT_START_INDEX }, text } },
    ...resetToBodyText(whole),
    ...placed.flatMap(({ paragraph, startIndex, endIndex }) =>
      STYLE_BUILDERS[paragraph.kind]({ startIndex, endIndex })
    ),
    ...listRequests(placed),
  ];
}

/**
 * Builds the Docs API `batchUpdate` requests that write a recipe as a styled document:
 * title, meta line, and real bulleted / numbered lists.
 * The text stays readable by `parseGoogleDocBody`.
 */
export function buildRecipeDocRequests(recipe: DocRecipe): DocRequest[] {
  return buildRequests(recipe, false);
}

/** Same as `buildRecipeDocRequests`, with an empty first paragraph that `buildPhotoInsertRequest` fills */
export function buildRecipeDocRequestsWithPhotoSlot(recipe: DocRecipe): DocRequest[] {
  return buildRequests(recipe, true);
}

/** Puts the photo into the empty first paragraph. Sent separately, so a photo problem never loses the recipe text */
export function buildPhotoInsertRequest(photo: DocPhoto): DocRequest {
  return {
    insertInlineImage: {
      location: { index: DOC_CONTENT_START_INDEX },
      uri: photo.uri,
      objectSize: { width: pt(photo.widthPt) },
    },
  };
}

interface GoogleDocJson {
  body?: {
    content?: { paragraph?: { elements?: { textRun?: { content?: string } }[] } }[];
  };
}

/** Parses a Google Doc JSON structure back into ingredients & steps */
export function parseGoogleDocBody(docJson: GoogleDocJson): { ingredients: string[]; steps: string[] } {
  const content = docJson?.body?.content ?? [];
  const lines: string[] = [];

  for (const element of content) {
    if (element.paragraph?.elements) {
      const line = element.paragraph.elements
        .map((el) => el.textRun?.content || '')
        .join('')
        .trim();
      if (line) lines.push(line);
    }
  }

  const ingredients: string[] = [];
  const steps: string[] = [];
  let section: 'none' | 'ingredients' | 'steps' = 'none';

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper === 'INGREDIENTS' || upper === 'INGREDIENTAI') {
      section = 'ingredients';
      continue;
    }
    if (upper === 'STEPS' || upper === 'INSTRUCTIONS' || upper === 'GAMINIMO EIGA') {
      section = 'steps';
      continue;
    }

    if (section === 'ingredients') {
      ingredients.push(line.replace(/^[•\-*]\s*/, '').trim());
    } else if (section === 'steps') {
      steps.push(line.replace(/^\d+[.)]\s*/, '').trim());
    }
  }

  return { ingredients, steps };
}
