import type React from 'react';

export type TagId = 'quick' | 'vegetarian' | 'desserts' | 'soups' | 'dinner';

export interface Recipe {
  id: string; // Google Drive File ID (Google Doc ID)
  title: string;
  prepTime: number; // minutes
  tags: TagId[];
  imageUrl: string;
  imageFileId?: string; // Drive file ID of the uploaded photo shown on top of the Google Doc
  ingredients: string[];
  steps: string[];
  saved: boolean;
  docUrl: string;
  updatedAt: string;
  authorName?: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'docUrl' | 'updatedAt'>;

/** Recipe form data plus an optional freshly uploaded photo (already resized) */
export interface RecipeDraft extends RecipeInput {
  photo?: Blob;
}

export interface Collaborator {
  id: string;
  email: string;
  displayName: string;
  role: 'owner' | 'writer' | 'reader';
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  isDemo: boolean;
}

/** Callbacks shared by every tab that renders a list of recipe cards */
export interface RecipeListHandlers {
  onOpen: (recipe: Recipe) => void;
  onToggleSave: (recipe: Recipe, e: React.MouseEvent) => void;
}
