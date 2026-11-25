import type { TagId } from '@/domain/types';
import type { TranslationKey } from '@/i18n/translations';

export const TAG_CONFIG: {
  id: TagId;
  labelKey: TranslationKey;
  emoji: string;
  bg: string;
  activeBg: string;
  text: string;
}[] = [
  { id: 'quick', labelKey: 'tag.quick', emoji: '🥗', bg: 'bg-[#EDE3D2]', activeBg: 'bg-[#3E6B48]', text: 'text-[#3B3326]' },
  { id: 'vegetarian', labelKey: 'tag.vegetarian', emoji: '🌿', bg: 'bg-[#D6E2D5]', activeBg: 'bg-[#3E6B48]', text: 'text-[#233B28]' },
  { id: 'desserts', labelKey: 'tag.desserts', emoji: '🍰', bg: 'bg-[#E6DFEE]', activeBg: 'bg-[#3E6B48]', text: 'text-[#392B47]' },
  { id: 'soups', labelKey: 'tag.soups', emoji: '🍲', bg: 'bg-[#F2DFCE]', activeBg: 'bg-[#3E6B48]', text: 'text-[#4A301D]' },
  { id: 'dinner', labelKey: 'tag.dinner', emoji: '🍽️', bg: 'bg-[#DCE6EC]', activeBg: 'bg-[#3E6B48]', text: 'text-[#1F3642]' },
];

export const CURATED_IMAGES = [
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
];

export const FOLDER_NAME = 'Gusto Family Recipes';
export const DEFAULT_STORAGE_KEY = 'gusto_demo_recipes_v1';
export const DEFAULT_COLLAB_KEY = 'gusto_demo_collabs_v1';
export const CLIENT_ID_STORAGE_KEY = 'gusto_google_client_id';
/** Set `BUN_PUBLIC_GOOGLE_CLIENT_ID` in `.env` to skip the manual Client ID input */
export const ENV_GOOGLE_CLIENT_ID = (process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID ?? '').trim();

export const DEFAULT_FRIDGE_ITEMS = ['lašiša', 'citrina'];
export const FRIDGE_QUICK_ADD_ITEMS = ['lašiša', 'moliūgas', 'avokadas', 'kiaušiniai', 'varškė', 'česnakas', 'citrina'];

export const DEMO_USER = { name: 'Tomas', email: 'tomas.seima@gmail.com' };
export const DEMO_DOC_URL = 'https://docs.google.com/document/u/0/';
