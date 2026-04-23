// EdgeOne Pages Function - Auth API (Edge Functions Compatible)
// Note: This version uses Web Crypto API instead of Node.js modules

const SALT_ROUNDS = 10;

// Web Crypto API based password hashing
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const data = encoder.encode(password + Array.from(salt).join(''));
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

// Verify password against stored hash
async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password + Array.from(salt).join(''));
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHash === hashHex;
}

// Simple token generation (base64 encoded JSON)
function generateToken(username) {
  const payload = {
    username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    iat: Date.now()
  };
  return btoa(JSON.stringify(payload));
}

// Verify token
function verifyToken(token) {
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return payload;
  } catch (err) {
    return null; // Invalid token
  }
}

export async function onRequestPost({ request }) {
  // Use global KV variable as per EdgeOne Pages documentation
  const kv = ACADEMIC_KV;

  try {
    const data = await request.json();
    const { action, username, password, fullName, faceDescriptor } = data;

    if (action === 'register') {
      // Validate input
      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username and password are required' }), { 
          status: 400,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }

      // Check if user exists
      const existing = await kv.get(`user:${username}:auth`);
      if (existing) {
        return new Response(JSON.stringify({ error: 'User already exists' }), { 
          status: 400,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }
      
      // Hash password using Web Crypto API
      const passwordHash = await hashPassword(password);
      
      // Save to KV
      const userPayload = {
        passwordHash,
        fullName: fullName || username, // Save full name, fallback to username
        faceDescriptor: faceDescriptor || [],
        createdAt: new Date().toISOString()
      };
      
      await kv.put(`user:${username}:auth`, JSON.stringify(userPayload));
      await kv.put(`user:${username}:scores`, JSON.stringify([]));

      return new Response(JSON.stringify({ success: true, message: 'Registered successfully' }), { 
        status: 200,
        headers: { 'content-type': 'application/json; charset=UTF-8' }
      });
    }

    if (action === 'login') {
      // Validate input
      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username and password are required' }), { 
          status: 400,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }

      const existing = await kv.get(`user:${username}:auth`);
      if (!existing) {
        return new Response(JSON.stringify({ error: 'User not found' }), { 
          status: 404,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }

      const userData = JSON.parse(existing);
      
      // Verify password using Web Crypto API
      const isPasswordValid = await verifyPassword(password, userData.passwordHash);
      if (!isPasswordValid) {
         return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
           status: 401,
           headers: { 'content-type': 'application/json; charset=UTF-8' }
         });
      }

      // Generate token
      const token = generateToken(username);
      
      return new Response(JSON.stringify({ 
        success: true, 
        token, 
        username,
        fullName: userData.fullName || username, // Return full name
        expiresIn: '7d'
      }), { 
        status: 200,
        headers: { 'content-type': 'application/json; charset=UTF-8' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { 
      status: 400,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });

  } catch (err) {
    console.error('Auth error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + err.message }), { 
      status: 500,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });
  }
}
