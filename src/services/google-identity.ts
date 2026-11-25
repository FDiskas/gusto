const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const DEFAULT_TOKEN_LIFETIME_SECONDS = 3600;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export interface GoogleProfile {
  name?: string;
  email?: string;
  picture?: string;
}

export interface GoogleAccess {
  accessToken: string;
  /** Epoch milliseconds after which the access token no longer works */
  expiresAt: number;
  profile: GoogleProfile;
}

export interface GoogleAccessOptions {
  /** `consent` opens the Google popup, `none` renews the token without any UI or fails */
  prompt: 'consent' | 'none';
  /** Email of the account to renew for, used with the `none` prompt */
  loginHint?: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
}

interface GoogleToken {
  accessToken: string;
  expiresAt: number;
}

function loadGoogleGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const fail = () => reject(new Error('Failed to load Google Identity Services'));
    const existing = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', fail);
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = fail;
    document.head.appendChild(script);
  });
}

/** Requests an access token, then resolves it together with the user's profile */
export async function requestGoogleAccess(
  clientId: string,
  { prompt, loginHint }: GoogleAccessOptions = { prompt: 'consent' }
): Promise<GoogleAccess> {
  await loadGoogleGisScript();

  const { accessToken, expiresAt } = await new Promise<GoogleToken>((resolve, reject) => {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
      callback: (response: GoogleTokenResponse) => {
        if (!response.access_token || response.error) {
          reject(new Error(response.error));
          return;
        }
        const lifetimeSeconds = Number(response.expires_in) || DEFAULT_TOKEN_LIFETIME_SECONDS;
        resolve({ accessToken: response.access_token, expiresAt: Date.now() + lifetimeSeconds * 1000 });
      },
      error_callback: (error: { type?: string }) => reject(new Error(error.type ?? 'popup_failed')),
    });
    tokenClient.requestAccessToken({ prompt, hint: loginHint });
  });

  const profileResponse = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  return { accessToken, expiresAt, profile: await profileResponse.json() };
}
