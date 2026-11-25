const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
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
  profile: GoogleProfile;
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

/** Opens the Google consent popup and resolves with an access token and the user's profile */
export async function requestGoogleAccess(clientId: string): Promise<GoogleAccess> {
  await loadGoogleGisScript();

  const accessToken = await new Promise<string>((resolve, reject) => {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES,
      callback: (response: { access_token?: string; error?: string }) =>
        response.access_token && !response.error ? resolve(response.access_token) : reject(new Error(response.error)),
      error_callback: (error: { type?: string }) => reject(new Error(error.type ?? 'popup_failed')),
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });

  const profileResponse = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  return { accessToken, profile: await profileResponse.json() };
}
