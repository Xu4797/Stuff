
      let global = globalThis;
      globalThis.global = globalThis;

      if (typeof global.navigator === 'undefined') {
        global.navigator = {
          userAgent: 'edge-runtime',
          language: 'en-US',
          languages: ['en-US'],
        };
      } else {
        if (typeof global.navigator.language === 'undefined') {
          global.navigator.language = 'en-US';
        }
        if (!global.navigator.languages || global.navigator.languages.length === 0) {
          global.navigator.languages = [global.navigator.language];
        }
        if (typeof global.navigator.userAgent === 'undefined') {
          global.navigator.userAgent = 'edge-runtime';
        }
      }

      class MessageChannel {
        constructor() {
          this.port1 = new MessagePort();
          this.port2 = new MessagePort();
        }
      }
      class MessagePort {
        constructor() {
          this.onmessage = null;
        }
        postMessage(data) {
          if (this.onmessage) {
            setTimeout(() => this.onmessage({ data }), 0);
          }
        }
      }
      global.MessageChannel = MessageChannel;

      // if ((typeof globalThis.fetch === 'undefined' || typeof globalThis.Headers === 'undefined' || typeof globalThis.Request === 'undefined' || typeof globalThis.Response === 'undefined') && typeof require !== 'undefined') {
      //   try {
      //     const undici = require('undici');
      //     if (undici.fetch && !globalThis.fetch) {
      //       globalThis.fetch = undici.fetch;
      //     }
      //     if (undici.Headers && typeof globalThis.Headers === 'undefined') {
      //       globalThis.Headers = undici.Headers;
      //     }
      //     if (undici.Request && typeof globalThis.Request === 'undefined') {
      //       globalThis.Request = undici.Request;
      //     }
      //     if (undici.Response && typeof globalThis.Response === 'undefined') {
      //       globalThis.Response = undici.Response;
      //     }
      //   } catch (polyfillError) {
      //     console.warn('Edge middleware polyfill failed:', polyfillError && polyfillError.message ? polyfillError.message : polyfillError);
      //   }
      // }

      '__MIDDLEWARE_BUNDLE_CODE__'

      function recreateRequest(request, overrides = {}) {
        const cloned = typeof request.clone === 'function' ? request.clone() : request;
        const headers = new Headers(cloned.headers);

        if (overrides.headerPatches) {
          Object.keys(overrides.headerPatches).forEach((key) => {
            const value = overrides.headerPatches[key];
            if (value === null || typeof value === 'undefined') {
              headers.delete(key);
            } else {
              headers.set(key, value);
            }
          });
        }

        if (overrides.headers) {
          const extraHeaders = new Headers(overrides.headers);
          extraHeaders.forEach((value, key) => headers.set(key, value));
        }

        const url = overrides.url || cloned.url;
        const method = overrides.method || cloned.method || 'GET';
        const canHaveBody = method && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD';
        const body = overrides.body !== undefined ? overrides.body : canHaveBody ? cloned.body : undefined;

        // 如果rewrite传入的是完整URL（第三方地址），需要更新host
        if (overrides.url) {
          try {
            const newUrl = new URL(overrides.url, cloned.url);
            // 只有当新URL是绝对路径（包含协议和host）时才更新host
            if (overrides.url.startsWith('http://') || overrides.url.startsWith('https://')) {
              headers.set('host', newUrl.host);
            }
            // 相对路径时保持原有host不变
          } catch (e) {
            // URL解析失败时保持原有host
          }
        }

        const init = {
          method,
          headers,
          redirect: cloned.redirect,
          credentials: cloned.credentials,
          cache: cloned.cache,
          mode: cloned.mode,
          referrer: cloned.referrer,
          referrerPolicy: cloned.referrerPolicy,
          integrity: cloned.integrity,
          keepalive: cloned.keepalive,
          signal: cloned.signal,
        };

        if (canHaveBody && body !== undefined) {
          init.body = body;
        }

        if ('duplex' in cloned) {
          init.duplex = cloned.duplex;
        }

        return new Request(url, init);

      }

      

      async function handleRequest(context){
        let routeParams = {};
        let pagesFunctionResponse = null;
        let request = context.request;
        const waitUntil = context.waitUntil;
        let urlInfo = new URL(request.url);
        const eo = request.eo || {};

        const normalizePathname = () => {
          if (urlInfo.pathname !== '/' && urlInfo.pathname.endsWith('/')) {
            urlInfo.pathname = urlInfo.pathname.slice(0, -1);
          }
        };

        function getSuffix(pathname = '') {
          // Use a regular expression to extract the file extension from the URL
          const suffix = pathname.match(/.([^.]+)$/);
          // If an extension is found, return it, otherwise return an empty string
          return suffix ? '.' + suffix[1] : null;
        }

        normalizePathname();

        let matchedFunc = false;

        
        const runEdgeFunctions = () => {
          
            if(!matchedFunc && '/api/auth-simple' === urlInfo.pathname && request.method === 'POST') {
              matchedFunc = true;
                (() => {
  // functions/api/auth-simple.js
  var users = /* @__PURE__ */ new Map();
  async function onRequestPost({ request }) {
    try {
      const data = await request.json();
      const { action, username, password } = data;
      if (action === "register") {
        if (!username || !password) {
          return new Response(JSON.stringify({
            error: "Username and password are required"
          }), {
            status: 400,
            headers: { "content-type": "application/json; charset=UTF-8" }
          });
        }
        if (users.has(username)) {
          return new Response(JSON.stringify({
            error: "User already exists"
          }), {
            status: 400,
            headers: { "content-type": "application/json; charset=UTF-8" }
          });
        }
        users.set(username, {
          password,
          // Note: In production, hash the password!
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        return new Response(JSON.stringify({
          success: true,
          message: "Registered successfully",
          username
        }), {
          status: 200,
          headers: { "content-type": "application/json; charset=UTF-8" }
        });
      }
      if (action === "login") {
        if (!username || !password) {
          return new Response(JSON.stringify({
            error: "Username and password are required"
          }), {
            status: 400,
            headers: { "content-type": "application/json; charset=UTF-8" }
          });
        }
        const user = users.get(username);
        if (!user) {
          return new Response(JSON.stringify({
            error: "User not found"
          }), {
            status: 404,
            headers: { "content-type": "application/json; charset=UTF-8" }
          });
        }
        if (user.password !== password) {
          return new Response(JSON.stringify({
            error: "Invalid credentials"
          }), {
            status: 401,
            headers: { "content-type": "application/json; charset=UTF-8" }
          });
        }
        const token = btoa(`${username}:${Date.now()}`);
        return new Response(JSON.stringify({
          success: true,
          token,
          username,
          message: "Login successful"
        }), {
          status: 200,
          headers: { "content-type": "application/json; charset=UTF-8" }
        });
      }
      return new Response(JSON.stringify({
        error: 'Unknown action. Use "register" or "login"'
      }), {
        status: 400,
        headers: { "content-type": "application/json; charset=UTF-8" }
      });
    } catch (err) {
      console.error("Auth error:", err);
      return new Response(JSON.stringify({
        error: "Internal server error: " + err.message
      }), {
        status: 500,
        headers: { "content-type": "application/json; charset=UTF-8" }
      });
    }
  }

          pagesFunctionResponse = onRequestPost;
        })();
            }
          

            if(!matchedFunc && '/api/auth' === urlInfo.pathname && request.method === 'POST') {
              matchedFunc = true;
                (() => {
  // functions/api/auth.js
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const data = encoder.encode(password + Array.from(salt).join(""));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${saltHex}:${hashHex}`;
  }
  async function verifyPassword(password, storedHash) {
    const [saltHex, hashHex] = storedHash.split(":");
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const data = encoder.encode(password + Array.from(salt).join(""));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return computedHash === hashHex;
  }
  function generateToken(username) {
    const payload = {
      username,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1e3,
      // 7 days
      iat: Date.now()
    };
    return btoa(JSON.stringify(payload));
  }
  async function onRequestPost({ request }) {
    const kv = ACADEMIC_KV;
    try {
      const data = await request.json();
      const { action, username, password, fullName, faceDescriptor } = data;
      if (action === "register") {
        if (!username || !password) {
          return new Response(JSON.stringify({ error: "Username and password are required" }), {
            status: 400,
            headers: { "content-type": "application/json; charset=UTF-8" }
          });
        }
        const existing = await kv.get(`user:${username}:auth`);
        if (existing) {
          return new Response(JSON.stringify({ error: "User already exists" }), {
            status: 400,
            headers: { "content-type": "application/json; charset=UTF-8" }
          });
        }
        const passwordHash = await hashPassword(password);
        const userPayload = {
          passwordHash,
          fullName: fullName || username,
          // Save full name, fallback to username
          faceDescriptor: faceDescriptor || [],
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        await kv.put(`user:${username}:auth`, JSON.stringify(userPayload));
        await kv.put(`user:${username}:scores`, JSON.stringify([]));
        return new Response(JSON.stringify({ success: true, message: "Registered successfully" }), {
          status: 200,
          headers: { "content-type": "application/json; charset=UTF-8" }
        });
      }
      if (action === "login") {
        if (!username || !password) {
          return new Response(JSON.stringify({ error: "Username and password are required" }), {
            status: 400,
            headers: { "content-type": "application/json; charset=UTF-8" }
          });
        }
        const existing = await kv.get(`user:${username}:auth`);
        if (!existing) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { "content-type": "application/json; charset=UTF-8" }
          });
        }
        const userData = JSON.parse(existing);
        const isPasswordValid = await verifyPassword(password, userData.passwordHash);
        if (!isPasswordValid) {
          return new Response(JSON.stringify({ error: "Invalid credentials" }), {
            status: 401,
            headers: { "content-type": "application/json; charset=UTF-8" }
          });
        }
        const token = generateToken(username);
        return new Response(JSON.stringify({
          success: true,
          token,
          username,
          fullName: userData.fullName || username,
          // Return full name
          expiresIn: "7d"
        }), {
          status: 200,
          headers: { "content-type": "application/json; charset=UTF-8" }
        });
      }
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { "content-type": "application/json; charset=UTF-8" }
      });
    } catch (err) {
      console.error("Auth error:", err);
      return new Response(JSON.stringify({ error: "Internal server error: " + err.message }), {
        status: 500,
        headers: { "content-type": "application/json; charset=UTF-8" }
      });
    }
  }

          pagesFunctionResponse = onRequestPost;
        })();
            }
          
        };
      

        let middlewareResponseHeaders = null;
        
        // 走到这里说明：
        // 1. 没有中间件响应（middlewareResponse 为 null/undefined）
        // 2. 或者中间件返回了 next
        // 需要判断是否命中边缘函数

        runEdgeFunctions();

        //没有命中边缘函数，执行回源
        if (!matchedFunc) {
          // 允许压缩的文件后缀白名单
          const ALLOW_COMPRESS_SUFFIXES = [
            '.html', '.htm', '.xml', '.txt', '.text', '.conf', '.def', '.list', '.log', '.in',
            '.css', '.js', '.json', '.rss', '.svg', '.tif', '.tiff', '.rtx', '.htc',
            '.java', '.md', '.markdown', '.ico', '.pl', '.pm', '.cgi', '.pb', '.proto',
            '.xhtml', '.xht', '.ttf', '.otf', '.woff', '.eot', '.wasm', '.binast', '.webmanifest'
          ];
          
          // 检查请求路径是否有允许压缩的后缀
          const pathname = urlInfo.pathname;
          const suffix = getSuffix(pathname);
          const hasCompressibleSuffix = ALLOW_COMPRESS_SUFFIXES.includes(suffix);
          
          // 如果不是可压缩的文件类型，删除 Accept-Encoding 头以禁用 CDN 压缩
          if (!hasCompressibleSuffix) {
              request.headers.delete('accept-encoding');
          }
          
          const originResponse = await fetch(request);
          
          // 如果中间件设置了响应头，合并到回源响应中
          if (middlewareResponseHeaders) {
            const mergedHeaders = new Headers(originResponse.headers);
            // 删除可能导致问题的编码相关头
            mergedHeaders.delete('content-encoding');
            mergedHeaders.delete('content-length');
            middlewareResponseHeaders.forEach((value, key) => {
              if (key.toLowerCase() === 'set-cookie') {
                mergedHeaders.append(key, value);
              } else {
                mergedHeaders.set(key, value);
              }
            });
            return new Response(originResponse.body, {
              status: originResponse.status,
              statusText: originResponse.statusText,
              headers: mergedHeaders,
            });
          }
          
          return originResponse;
        }
        
        // 命中了边缘函数，继续执行边缘函数逻辑

        const params = {};
        if (routeParams.id) {
          if (routeParams.mode === 1) {
            const value = urlInfo.pathname.match(routeParams.left);        
            for (let i = 1; i < value.length; i++) {
              params[routeParams.id[i - 1]] = value[i];
            }
          } else {
            const value = urlInfo.pathname.replace(routeParams.left, '');
            const splitedValue = value.split('/');
            if (splitedValue.length === 1) {
              params[routeParams.id] = splitedValue[0];
            } else {
              params[routeParams.id] = splitedValue;
            }
          }
          
        }
        const edgeFunctionResponse = await pagesFunctionResponse({request, params, env: {"EO_KV_BINDINGS":"[{\"name\":\"ACADEMIC_KV\",\"type\":\"edgekv\",\"serviceName\":\"global-kv-tj.3aaowu4fdpoy.eo.dnse5.com\",\"servicePort\":\"80\",\"userId\":\"6KcCcw==\",\"userKey\":\"Pages-AppId-1323795952\",\"namespace\":\"6KcCc_SS,6KcCc_SSxqM=\"}]"}, waitUntil, eo });
        
        // 如果中间件设置了响应头，合并到边缘函数响应中
        if (middlewareResponseHeaders && edgeFunctionResponse) {
          const mergedHeaders = new Headers(edgeFunctionResponse.headers);
          // 删除可能导致问题的编码相关头
          mergedHeaders.delete('content-encoding');
          mergedHeaders.delete('content-length');
          middlewareResponseHeaders.forEach((value, key) => {
            if (key.toLowerCase() === 'set-cookie') {
              mergedHeaders.append(key, value);
            } else {
              mergedHeaders.set(key, value);
            }
          });
          return new Response(edgeFunctionResponse.body, {
            status: edgeFunctionResponse.status,
            statusText: edgeFunctionResponse.statusText,
            headers: mergedHeaders,
          });
        }
        
        return edgeFunctionResponse;
      }
      addEventListener('fetch', event=>{return event.respondWith(handleRequest({request:event.request,params: {}, env: {"EO_KV_BINDINGS":"[{\"name\":\"ACADEMIC_KV\",\"type\":\"edgekv\",\"serviceName\":\"global-kv-tj.3aaowu4fdpoy.eo.dnse5.com\",\"servicePort\":\"80\",\"userId\":\"6KcCcw==\",\"userKey\":\"Pages-AppId-1323795952\",\"namespace\":\"6KcCc_SS,6KcCc_SSxqM=\"}]"}, waitUntil: event.waitUntil.bind(event) }))});