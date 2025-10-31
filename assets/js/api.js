(function(){
  const CFG = window.APP_CONFIG || {};
  const BASE = CFG.API_BASE || '';
  const REFRESH_KEY = CFG.REFRESH_TOKEN_KEY || 'ipPlanningRefreshToken';
  const originalFetch = window.fetch.bind(window);

  function authHeaders(extra){
    const tk = window.Auth && window.Auth.getToken ? window.Auth.getToken() : '';
    const headers = new Headers({ ...(extra || {}) });
    if (tk && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${tk}`);
    return headers;
  }

  async function refreshTokenIfNeeded(){
    try{
      // 依照修復規範：使用舊 access token 呼叫 refresh，不再送 refresh_token
      const oldToken = (window.Auth && window.Auth.getToken && window.Auth.getToken()) || '';
      const res = await originalFetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          ...(oldToken ? { 'Authorization': `Bearer ${oldToken}` } : {})
        }
      });
      if(!res.ok) return false;
      const data = await res.json();
      const newToken = data && data.access_token;
      if(!newToken) return false;
      if(window.Auth && window.Auth.setToken) window.Auth.setToken(newToken);
      if(data.refresh_token && window.Auth && window.Auth.setRefreshToken) window.Auth.setRefreshToken(data.refresh_token);
      return true;
    } catch(_){
      return false;
    }
  }

  // 全域 fetch 攔截：自動帶 token、401 → refresh → 重試一次
  window.fetch = async function(input, init){
    const initObj = init || {};
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const isBackendApi = (typeof url === 'string') && (url.startsWith(`${BASE}/api`) || url.startsWith('/api/'));
    const isRefreshCall = (typeof url === 'string') && url.includes('/api/auth/refresh');
    const isOAuthStart = (typeof url === 'string') && url.includes('/api/auth/google');

    // 對 OAuth 起始端點：完全不注入任何自訂標頭，避免預檢與 CORS 問題
    if (isOAuthStart) {
      return originalFetch(input, initObj);
    }

    const mergedHeaders = new Headers(initObj.headers || (typeof input !== 'string' && input && input.headers) || {});
    if(isBackendApi && !isRefreshCall){
      // 強制覆寫 Authorization，避免上游傳入空白/錯誤值導致未帶 token
      const tk = window.Auth && window.Auth.getToken ? window.Auth.getToken() : '';
      if (tk) {
        mergedHeaders.set('Authorization', `Bearer ${tk}`);
      } else {
        mergedHeaders.delete('Authorization');
      }
      // 僅當呼叫者真的提供 body 時才加 Content-Type，避免 GET 觸發預檢
      const hasBody = Object.prototype.hasOwnProperty.call(initObj, 'body');
      if(hasBody && !mergedHeaders.has('Content-Type')) mergedHeaders.set('Content-Type', 'application/json');
    }

    const first = await originalFetch(input, { ...initObj, headers: mergedHeaders });
    if(isBackendApi && first.status === 401 && !isRefreshCall){
      const ok = await refreshTokenIfNeeded();
      if(ok){
        const retryHeaders = new Headers(initObj.headers || (typeof input !== 'string' && input && input.headers) || {});
        const tk2 = window.Auth && window.Auth.getToken ? window.Auth.getToken() : '';
        if (tk2) {
          retryHeaders.set('Authorization', `Bearer ${tk2}`);
        } else {
          retryHeaders.delete('Authorization');
        }
        if(!retryHeaders.has('Content-Type') && (!initObj || !initObj.body || typeof initObj.body === 'object')){
          retryHeaders.set('Content-Type', 'application/json');
        }
        return originalFetch(input, { ...initObj, headers: retryHeaders });
      }
    }
    return first;
  };

  // ===== 對外最小增補：依照 401/403 修復指南提供 getMe 與 refreshToken，不影響既有呼叫點 =====
  try {
    const API = {};
    API.getMe = async function(){
      const res = await originalFetch(`${BASE}/api/auth/me`, {
        method: 'GET',
        headers: authHeaders()
      });
      if(!res.ok) throw new Error(`ME_${res.status}`);
      return res.json();
    };
    API.refreshToken = async function(){
      // 使用舊 access token 換新 access token
      const oldAccess = (window.Auth && window.Auth.getToken && window.Auth.getToken()) || '';
      if(!oldAccess) throw new Error('NO_OLD_ACCESS');
      const res = await originalFetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${oldAccess}` }
      });
      if(!res.ok) throw new Error(`REFRESH_${res.status}`);
      const data = await res.json();
      if(data.access_token && window.Auth && window.Auth.setToken) window.Auth.setToken(data.access_token);
      if(data.refresh_token && window.Auth && window.Auth.setRefreshToken) window.Auth.setRefreshToken(data.refresh_token);
      return data;
    };
    window.Api = Object.assign(window.Api || {}, API);
  } catch(_) {}
})();


