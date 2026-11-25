import type { Recipe } from '@/domain/types';

export type Lang = 'lt' | 'en';

export const translations = {
  lt: {
    // Brand & Navigation
    'app.name': 'Gusto',
    'app.tagline': 'Šeimos receptų knyga tavo Google Drive',
    'nav.discover': 'Atrask',
    'nav.fridge': 'Šaldytuvas',
    'nav.saved': 'Išsaugoti',

    // Landing Page
    'landing.badge': 'Šeimos receptai • Google Docs & Drive',
    'landing.title': 'Visi šeimos receptai vienoje vietoje – jūsų pačių Google Drive',
    'landing.subtitle':
      'Kiekvienas receptas išsaugomas kaip atskiras Google Docs dokumentas bendrame šeimos aplanke. Paprasta naršyti, ieškoti pagal šaldytuvo turinį ir dalintis su artimaisiais.',
    'landing.cta.google': 'Prisijungti su Google',
    'landing.cta.demo': 'Išbandyti Demo režimu',
    'landing.clientId.label': 'Google OAuth Client ID (neprivaloma Demo režimui)',
    'landing.clientId.placeholder': 'xxxx-xxxx.apps.googleusercontent.com',
    'landing.clientId.help': 'Norint jungtis prie tikro Google Drive, įveskite savo Google Cloud Web Client ID.',
    'landing.feature1.title': 'Atskiri Google Docs failai',
    'landing.feature1.desc': 'Visi duomenys priklauso jums. Redaguokite receptus programėlėje arba tiesiogiai Google Docs.',
    'landing.feature2.title': 'Bendras šeimos aplankas',
    'landing.feature2.desc': 'Pakvieskite šeimos narius el. paštu – visi matys ir galės pildyti tą pačią receptų kolekciją.',
    'landing.feature3.title': 'Iš to, ką turi šaldytuve',
    'landing.feature3.desc': 'Sužymėkite turimus produktus ir akimirksniu raskite, ką galite pagaminti dabar.',

    // Home / Discover
    'home.greeting': 'Ką gaminsi šiandien?',
    'home.search.placeholder': 'Ieškoti recepto ar ingrediento...',
    'home.popular': 'Šeimos receptai',
    'home.empty': 'Receptų pagal šį filtrą nerasta.',
    'home.empty.cta': 'Pridėti naują receptą',
    'home.cookBtn': 'Gaminti',
    'home.fridgeCard.title': 'Iš to, ką turi šaldytuve',
    'home.fridgeCard.desc': 'Įvesk turimus produktus ir gauk receptų pasiūlymus',
    'home.demoBanner': 'Demo režimas (duomenys saugomi naršyklėje)',
    'home.syncing': 'Sinchronizuojama su Google Drive...',

    // Tags
    'tag.all': 'Visi',
    'tag.quick': 'Greiti (15 min)',
    'tag.vegetarian': 'Vegetariški',
    'tag.desserts': 'Desertai',
    'tag.soups': 'Sriubos',
    'tag.dinner': 'Vakarienė',

    // Fridge
    'fridge.title': 'Kas tavo šaldytuve?',
    'fridge.subtitle': 'Pridėk turimus produktus, o mes surūšiuosime šeimos receptus pagal atitikimą.',
    'fridge.input.placeholder': 'Pvz.: lašiša, kiaušiniai, moliūgas...',
    'fridge.add': 'Pridėti',
    'fridge.quickAdd': 'Dažni produktai:',
    'fridge.matches': 'Atitinkantys receptai ({{count}})',
    'fridge.matchBadge': '{{matched}}/{{total}} prod.',
    'fridge.clear': 'Išvalyti',

    // Saved
    'saved.title': 'Išsaugoti receptai',
    'saved.empty': 'Dar neturi išsaugotų receptų. Paspausk širdelę ant patikusio recepto!',

    // Recipe Detail
    'recipe.back': 'Atgal',
    'recipe.time': '{{min}} min',
    'recipe.ingredients': 'Ingredientai',
    'recipe.steps': 'Gaminimo eiga',
    'recipe.openDoc': 'Atidaryti Google Docs',
    'recipe.edit': 'Redaguoti',
    'recipe.delete': 'Ištrinti',
    'recipe.deleteConfirm': 'Tikrai ištrinti šį receptą?',
    'recipe.cancel': 'Atšaukti',
    'recipe.confirm': 'Taip, ištrinti',
    'recipe.checkedCount': 'Pažymėta {{done}} iš {{total}}',

    // Recipe Editor
    'editor.newTitle': 'Naujas receptas (Google Doc)',
    'editor.editTitle': 'Redaguoti receptą',
    'editor.field.title': 'Patiekalo pavadinimas',
    'editor.field.titlePlaceholder': 'Pvz.: Kepta lašiša su smidrais',
    'editor.field.time': 'Trukmė (min)',
    'editor.field.tags': 'Žymos (Tagai)',
    'editor.field.image': 'Nuotraukos nuoroda (URL)',
    'editor.photo.upload': 'Įkelti nuotrauką',
    'editor.photo.replace': 'Pakeisti nuotrauką',
    'editor.photo.hint': 'Nuotrauka bus įterpta Google dokumento viršuje per visą plotį.',
    'editor.field.ingredients': 'Ingredientai (po vieną eilutėje)',
    'editor.field.steps': 'Gaminimo žingsniai (po vieną eilutėje)',
    'editor.save': 'Išsaugoti į Google Drive',
    'editor.saving': 'Saugoma...',

    // Family Sharing Modal
    'family.title': 'Šeimos prieiga',
    'family.subtitle': 'Dalinkitės visu „{{folder}}“ aplanku su šeimos nariais per Google Drive.',
    'family.openFolder': 'Atidaryti aplanką Drive',
    'family.inviteLabel': 'Pakviesti šeimos narį (Google el. paštas)',
    'family.invitePlaceholder': 'mama@gmail.com',
    'family.role.writer': 'Gali redaguoti',
    'family.role.reader': 'Tik skaityti',
    'family.inviteBtn': 'Pakviesti',
    'family.membersTitle': 'Prieigą turintys nariai ({{count}})',
    'family.owner': 'Savininkas',
    'family.remove': 'Pašalinti',

    // Toast / Errors
    'toast.saved': 'Receptas išsaugotas kaip Google Doc!',
    'toast.deleted': 'Receptas perkeltas į šiukšliadėžę.',
    'toast.invited': 'Pakvietimas išsiųstas el. paštu {{email}}!',
    'toast.removed': 'Prieiga pašalinta.',
    'toast.synced': 'Receptai atnaujinti iš Google Drive.',
    'toast.photoNotInDoc': 'Receptas išsaugotas, bet nuotraukos į Google dokumentą įterpti nepavyko: {{reason}}',
    'error.missingClientId': 'Įveskite Google OAuth Client ID arba naudokite Demo režimą.',
    'error.authFailed': 'Nepavyko prisijungti prie Google. Patikrinkite Client ID ir naršyklės nustatymus.',
    'error.photoFailed': 'Nepavyko apdoroti nuotraukos. Pabandykite JPG arba PNG failą.',
    'error.saveFailed': 'Nepavyko išsaugoti recepto. Bandykite dar kartą.',
  },
  en: {
    // Brand & Navigation
    'app.name': 'Gusto',
    'app.tagline': 'Family recipe book on your Google Drive',
    'nav.discover': 'Discover',
    'nav.fridge': 'Fridge',
    'nav.saved': 'Saved',

    // Landing Page
    'landing.badge': 'Family Recipes • Google Docs & Drive',
    'landing.title': 'All your family recipes in one place — stored on Google Drive',
    'landing.subtitle':
      'Every recipe is saved as an individual Google Doc inside a shared family folder. Browse with tags, cook from your fridge, and collaborate effortlessly.',
    'landing.cta.google': 'Sign in with Google',
    'landing.cta.demo': 'Try Demo Mode',
    'landing.clientId.label': 'Google OAuth Client ID (optional for Demo Mode)',
    'landing.clientId.placeholder': 'xxxx-xxxx.apps.googleusercontent.com',
    'landing.clientId.help': 'Provide your Google Cloud Web Client ID to connect to your real Google Drive.',
    'landing.feature1.title': 'Separate Google Docs',
    'landing.feature1.desc': 'You own your data. Edit recipes inside Gusto or open them directly in Google Docs.',
    'landing.feature2.title': 'Shared Family Folder',
    'landing.feature2.desc': 'Invite family members by email so everyone can view and contribute to the same collection.',
    'landing.feature3.title': 'Cook From Your Fridge',
    'landing.feature3.desc': 'Add ingredients you already have and instantly see which family recipes match best.',

    // Home / Discover
    'home.greeting': 'What will you cook today?',
    'home.search.placeholder': 'Search recipe or ingredient...',
    'home.popular': 'Family recipes',
    'home.empty': 'No recipes match this filter.',
    'home.empty.cta': 'Add a new recipe',
    'home.cookBtn': 'Cook',
    'home.fridgeCard.title': 'From what is in your fridge',
    'home.fridgeCard.desc': 'Enter ingredients you have and find matching recipes',
    'home.demoBanner': 'Demo Mode (stored locally in browser)',
    'home.syncing': 'Syncing with Google Drive...',

    // Tags
    'tag.all': 'All',
    'tag.quick': 'Quick (15 min)',
    'tag.vegetarian': 'Vegetarian',
    'tag.desserts': 'Desserts',
    'tag.soups': 'Soups',
    'tag.dinner': 'Dinner',

    // Fridge
    'fridge.title': 'What is in your fridge?',
    'fridge.subtitle': 'Add ingredients you have on hand and we will rank your family recipes by match.',
    'fridge.input.placeholder': 'e.g., salmon, eggs, pumpkin...',
    'fridge.add': 'Add',
    'fridge.quickAdd': 'Common ingredients:',
    'fridge.matches': 'Matching recipes ({{count}})',
    'fridge.matchBadge': '{{matched}}/{{total}} ingr.',
    'fridge.clear': 'Clear',

    // Saved
    'saved.title': 'Saved recipes',
    'saved.empty': 'No saved recipes yet. Tap the heart icon on any recipe to bookmark it!',

    // Recipe Detail
    'recipe.back': 'Back',
    'recipe.time': '{{min}} min',
    'recipe.ingredients': 'Ingredients',
    'recipe.steps': 'Instructions',
    'recipe.openDoc': 'Open in Google Docs',
    'recipe.edit': 'Edit',
    'recipe.delete': 'Delete',
    'recipe.deleteConfirm': 'Delete this recipe?',
    'recipe.cancel': 'Cancel',
    'recipe.confirm': 'Yes, delete',
    'recipe.checkedCount': 'Checked {{done}} of {{total}}',

    // Recipe Editor
    'editor.newTitle': 'New Recipe (Google Doc)',
    'editor.editTitle': 'Edit Recipe',
    'editor.field.title': 'Recipe Title',
    'editor.field.titlePlaceholder': 'e.g., Roasted Salmon with Asparagus',
    'editor.field.time': 'Prep Time (min)',
    'editor.field.tags': 'Tags',
    'editor.field.image': 'Cover Image URL',
    'editor.photo.upload': 'Upload photo',
    'editor.photo.replace': 'Replace photo',
    'editor.photo.hint': 'The photo is placed at the top of the Google Doc, full width.',
    'editor.field.ingredients': 'Ingredients (one per line)',
    'editor.field.steps': 'Cooking Steps (one per line)',
    'editor.save': 'Save to Google Drive',
    'editor.saving': 'Saving...',

    // Family Sharing Modal
    'family.title': 'Family Access',
    'family.subtitle': 'Share the entire "{{folder}}" folder with family members via Google Drive.',
    'family.openFolder': 'Open Folder in Drive',
    'family.inviteLabel': 'Invite family member (Google email)',
    'family.invitePlaceholder': 'mom@gmail.com',
    'family.role.writer': 'Can edit',
    'family.role.reader': 'Can view',
    'family.inviteBtn': 'Invite',
    'family.membersTitle': 'People with access ({{count}})',
    'family.owner': 'Owner',
    'family.remove': 'Remove',

    // Toast / Errors
    'toast.saved': 'Recipe saved as a Google Doc!',
    'toast.deleted': 'Recipe moved to trash.',
    'toast.invited': 'Invitation sent to {{email}}!',
    'toast.removed': 'Access removed.',
    'toast.synced': 'Recipes synced from Google Drive.',
    'toast.photoNotInDoc': 'Recipe saved, but the photo could not be added to the Google Doc: {{reason}}',
    'error.missingClientId': 'Please enter a Google OAuth Client ID or use Demo Mode.',
    'error.authFailed': 'Google Sign-In failed. Please check your Client ID and popup settings.',
    'error.photoFailed': 'Could not process the photo. Try a JPG or PNG file.',
    'error.saveFailed': 'Could not save the recipe. Please try again.',
  },
} as const;

export type TranslationKey = keyof typeof translations.lt;
