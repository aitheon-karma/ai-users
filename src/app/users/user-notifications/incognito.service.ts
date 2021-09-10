export function isPrivateMode(): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const yes = () => resolve(true); // is in private mode
    const not = () => resolve(false); // not in private mode

    function detectChromeOpera(): boolean {
      const isChromeOpera = /(?=.*(opera|chrome)).*/i.test(navigator.userAgent) && navigator.storage?.estimate;
      if (isChromeOpera) {
        var fs = (window as any).webkitRequestFileSystem || (window as any).RequestFileSystem;
        if (fs) {
          fs((window as any).TEMPORARY, 100, (fs) => {
            not();
          }, (err) => {
            yes();
          });
        }
      }
      return !!isChromeOpera;
    }

    function detectFirefox(): boolean {
      const isMozillaFirefox = 'MozAppearance' in document.documentElement.style;
      if (isMozillaFirefox) {
        if (indexedDB == null) yes();
        else {
          const db = indexedDB.open('inPrivate');
          db.onsuccess = not;
          db.onerror = yes;
        }
      }
      return isMozillaFirefox;
    }

    function detectSafari(): boolean {
      const isSafari = navigator.userAgent.match(/Version\/([0-9\._]+).*Safari/);
      if (isSafari) {
        const testLocalStorage = () => {
          try {
            if (localStorage.length) not();
            else {
              localStorage.setItem('inPrivate', '0');
              localStorage.removeItem('inPrivate');
              not();
            }
          } catch (_) {
            // Safari only enables cookie in private mode
            // if cookie is disabled, then all client side storage is disabled
            // if all client side storage is disabled, then there is no point
            // in using private mode
            navigator.cookieEnabled ? yes() : not();
          }
          return true;
        };

        const version = parseInt(isSafari[1], 10);
        if (version < 11) return testLocalStorage();
        try {
          (window as any).openDatabase(null, null, null, null);
          not();
        } catch (_) {
          yes();
        }
      }
      return !!isSafari;
    }

    function detectEdgeIE10(): boolean {
      const isEdgeIE10 = !window.indexedDB && ((window as any).PointerEvent || (window as any).MSPointerEvent);
      if (isEdgeIE10) yes();
      return !!isEdgeIE10;
    }

    // when a browser is detected, it runs tests for that browser
    // and skips pointless testing for other browsers.
    if (detectChromeOpera()) return;
    if (detectFirefox()) return;
    if (detectSafari()) return;
    if (detectEdgeIE10()) return;

    // default navigation mode
    return not();
  });
}
