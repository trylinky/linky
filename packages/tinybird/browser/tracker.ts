import { timezones } from './timezones';

// Extend Window interface to include custom properties
declare global {
  interface Window {
    Tinybird: {
      trackEvent: (name: string, payload: Record<string, any>) => Promise<void>;
    };
    __nightmare?: boolean;
    Cypress?: any;
  }
}

(function () {
  const STORAGE_KEY = 'session-id';
  let DATASOURCE = 'analytics_events';
  const storageMethods = {
    cookie: 'cookie',
    localStorage: 'localStorage',
    sessionStorage: 'sessionStorage',
  } as const;
  type StorageMethod = 'cookie' | 'localStorage' | 'sessionStorage';
  let STORAGE_METHOD: StorageMethod = 'cookie';
  let globalAttributes: Record<string, string> = {};

  let proxy: string | null = null,
    token: string | null = null,
    host: string | null = null,
    domain: string | null = null,
    pageId: string | null = null;
  if (document.currentScript) {
    host = document.currentScript.getAttribute('data-host');
    proxy = document.currentScript.getAttribute('data-proxy');
    token = document.currentScript.getAttribute('data-token');
    domain = document.currentScript.getAttribute('data-domain');
    pageId = document.currentScript.getAttribute('data-page-id');
    DATASOURCE =
      document.currentScript.getAttribute('data-datasource') || DATASOURCE;
    STORAGE_METHOD =
      (document.currentScript.getAttribute('data-storage') as StorageMethod) ||
      STORAGE_METHOD;
    for (const attr of document.currentScript.attributes) {
      if (attr.name.startsWith('tb_')) {
        globalAttributes[attr.name.slice(3)] = attr.value;
      }
    }
  }

  /**
   * Generate uuid to identify the session using native crypto API
   */
  function _uuidv4(): string {
    return crypto.randomUUID();
  }

  async function _getLocation(): Promise<string | null> {
    try {
      const response = await fetch('/api/user/location');
      const data = await response.json();

      if (!data.location) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return timezones[timezone as keyof typeof timezones];
      }

      return data.location;
    } catch (error) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return timezones[timezone as keyof typeof timezones];
    }
  }

  function _getSessionIdFromCookie(): string | undefined {
    const cookie: Record<string, string> = {};
    document.cookie.split(';').forEach(function (el) {
      let [key, value] = el.split('=');
      cookie[key.trim()] = value;
    });
    return cookie[STORAGE_KEY];
  }

  function _getSessionId(): string | null {
    if (
      STORAGE_METHOD === storageMethods.localStorage ||
      STORAGE_METHOD === storageMethods.sessionStorage
    ) {
      const storage =
        STORAGE_METHOD === storageMethods.localStorage
          ? localStorage
          : sessionStorage;
      const serializedItem = storage.getItem(STORAGE_KEY);

      if (!serializedItem) {
        return null;
      }

      let item = null;

      try {
        item = JSON.parse(serializedItem);
      } catch (error) {
        return null;
      }

      if (typeof item !== 'object' || item === null) {
        return null;
      }

      const now = new Date();

      if (now.getTime() > item.expiry) {
        storage.removeItem(STORAGE_KEY);
        return null;
      }

      return item.value;
    }

    return _getSessionIdFromCookie() || null;
  }

  function _setSessionIdFromCookie(sessionId: string): void {
    let cookieValue = `${STORAGE_KEY}=${sessionId}; Max-Age=1800; path=/; secure`;

    if (domain) {
      cookieValue += `; domain=${domain}`;
    }

    document.cookie = cookieValue;
  }

  function _setSessionId(): void {
    const sessionId = _getSessionId() || _uuidv4();
    if (
      STORAGE_METHOD === storageMethods.localStorage ||
      STORAGE_METHOD === storageMethods.sessionStorage
    ) {
      const now = new Date();
      const item = {
        value: sessionId,
        expiry: now.getTime() + 1800 * 1000,
      };
      const value = JSON.stringify(item);
      const storage =
        STORAGE_METHOD === storageMethods.localStorage
          ? localStorage
          : sessionStorage;
      storage.setItem(STORAGE_KEY, value);
      return;
    }

    _setSessionIdFromCookie(sessionId);
  }

  /**
   * Try to mask PPI and potential sensible attributes
   *
   * @param  { object } payload Event payload
   * @return { object } Sanitized payload
   */
  const _maskSuspiciousAttributes = (
    payload: Record<string, any>
  ): Record<string, any> => {
    const attributesToMask = [
      'username',
      'user',
      'user_id',
      'userid',
      'password',
      'pass',
      'pin',
      'passcode',
      'token',
      'api_token',
      'email',
      'address',
      'phone',
      'sex',
      'gender',
      'order',
      'order_id',
      'orderid',
      'payment',
      'credit_card',
    ];

    // Deep copy
    let _payload = JSON.stringify(payload);
    attributesToMask.forEach((attr) => {
      _payload = _payload.replaceAll(
        new RegExp(`("${attr}"):(".+?"|\\d+)`, 'mgi'),
        '$1:"********"'
      );
    });

    return JSON.parse(_payload);
  };

  /**
   * Send event to endpoint
   *
   * @param  { string } name Event name
   * @param  { object } payload Event payload
   * @return { object } request response
   */
  async function _sendEvent(
    name: string,
    payload: Record<string, any>
  ): Promise<void> {
    _setSessionId();
    let url;

    // Use public Tinybird url if no custom endpoint is provided
    if (proxy) {
      url = `${proxy}/api/tracking`;
    } else if (host) {
      host = host.replaceAll(/\/+$/gm, '');
      url = `${host}/v0/events?name=${DATASOURCE}&token=${token}`;
    } else {
      url = `https://api.tinybird.co/v0/events?name=${DATASOURCE}&token=${token}`;
    }

    const maskedPayload = _maskSuspiciousAttributes(payload);
    const finalPayload = {
      ...maskedPayload,
      ...globalAttributes,
    };

    const session_id = _getSessionId() || _uuidv4();

    const request = new XMLHttpRequest();
    request.open('POST', url, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action: name,
        version: '1',
        session_id,
        page_id: pageId,
        payload: JSON.stringify(finalPayload),
      })
    );
  }

  /**
   * Track page hit
   */
  async function _trackPageHit() {
    // If local development environment
    // if (/^localhost$|^127(\.[0-9]+){0,2}\.[0-9]+$|^\[::1?\]$/.test(location.hostname) || location.protocol === 'file:') return;
    // If test environment
    if (window.__nightmare || window.navigator.webdriver || window.Cypress)
      return;

    let location: string | null, locale: string;
    try {
      location = await _getLocation();
      locale =
        navigator.languages && navigator.languages.length
          ? navigator.languages[0]
          : navigator.language || 'en';
    } catch (error) {
      // ignore error
    }

    // Wait a bit for SPA routers
    setTimeout(() => {
      _sendEvent('page_hit', {
        'user-agent': window.navigator.userAgent,
        locale,
        location,
        referrer: document.referrer,
        pathname: window.location.pathname,
        href: window.location.href,
      });
    }, 300);
  }

  // Client
  window.Tinybird = { trackEvent: _sendEvent };

  // Event listener
  window.addEventListener('hashchange', _trackPageHit);
  const his = window.history;
  if (his.pushState) {
    const originalPushState = his['pushState'];
    his.pushState = function (
      data: any,
      unused: string,
      url?: string | URL | null
    ) {
      originalPushState.call(this, data, unused, url);
      _trackPageHit();
    };
    window.addEventListener('popstate', _trackPageHit);
  }

  let lastPage: boolean | undefined;
  function handleVisibilityChange(): void {
    if (!lastPage && document.visibilityState === 'visible') {
      _trackPageHit();
    }
  }

  if (document.visibilityState === ('prerender' as DocumentVisibilityState)) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  } else {
    _trackPageHit();
  }
})();
