# Gusto

Family recipe book that stores every recipe as a Google Doc in a shared Google Drive folder.
Built with Bun, React 19 and Tailwind CSS 4. The UI is available in Lithuanian and English.

## Features

- Browse, search and filter recipes by tag.
- "Fridge" tab: list what you have and see the best matching recipes.
- Each recipe is a Google Doc; the optional cover photo is inserted at the top of the Doc at full width.
- Share the family folder with relatives from inside the app.
- Demo mode that keeps data in the browser, no Google account needed.

## Getting started

```bash
bun install
cp .env.example .env   # optional: add your Google Client ID
bun dev
```

| Command         | What it does                       |
| --------------- | ---------------------------------- |
| `bun dev`       | Dev server with hot reload         |
| `bun start`     | Production server                  |
| `bun run build` | Production build into `dist/`      |
| `bun test`      | Unit and render tests              |
| `bun check`     | Type check                         |

## Google sign-in

Set your OAuth Web Client ID in `.env`:

```bash
BUN_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

1. In Google Cloud, enable the Google Drive API and the Google Docs API.
2. Add the app URL (for example `http://localhost:3000`) as an authorized JavaScript origin.

`BUN_PUBLIC_*` values are included in the browser bundle, so never put secrets there.
Without the variable, the landing page shows a Client ID input next to the Demo mode button.

## Recipe photos

The photo is resized in the browser, saved in the family Drive folder, and inserted at the top of the
Google Doc at full text width. The Docs API can only insert images from a public URL, so the photo is
shared by link for the moment of the insert and the link is removed right after.

## Project structure

```
src/
  App.tsx            Session state and layout
  components/        UI: landing page, tabs, recipe detail/editor, family sharing modal
  hooks/             useRecipeLibrary (Drive or demo storage), useToast, useGoogleClientId
  services/          Google Drive/Docs client, Google sign-in, Google Doc text format
  domain/            Types, constants, demo data, recipe search and fridge ranking
  i18n/              Translations (lt, en) and the translate function
  lib/               Browser image helpers
```
