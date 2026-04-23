// Simple auth function without external dependencies
// This is for testing EdgeOne Pages Functions routing

const users = new Map(); // In-memory storage (for testing only)

export async function onRequestPost({ request }) {
  try {
    const data = await request.json();
    const { action, username, password } = data;

    if (action === 'register') {
      // Validate input
      if (!username || !password) {
        return new Response(JSON.stringify({ 
          error: 'Username and password are required' 
        }), { 
          status: 400,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }

      // Check if user exists
      if (users.has(username)) {
        return new Response(JSON.stringify({ 
          error: 'User already exists' 
        }), { 
          status: 400,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }
      
      // Save user (in production, use KV database)
      users.set(username, {
        password, // Note: In production, hash the password!
        createdAt: new Date().toISOString()
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Registered successfully',
        username 
      }), { 
        status: 200,
        headers: { 'content-type': 'application/json; charset=UTF-8' }
      });
    }

    if (action === 'login') {
      // Validate input
      if (!username || !password) {
        return new Response(JSON.stringify({ 
          error: 'Username and password are required' 
        }), { 
          status: 400,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }

      const user = users.get(username);
      if (!user) {
        return new Response(JSON.stringify({ 
          error: 'User not found' 
        }), { 
          status: 404,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }

      // Verify password (simple comparison for testing)
      if (user.password !== password) {
        return new Response(JSON.stringify({ 
          error: 'Invalid credentials' 
        }), { 
          status: 401,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }

      // Generate a simple token (in production, use JWT)
      const token = btoa(`${username}:${Date.now()}`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        token,
        username,
        message: 'Login successful'
      }), { 
        status: 200,
        headers: { 'content-type': 'application/json; charset=UTF-8' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Unknown action. Use "register" or "login"' 
    }), { 
      status: 400,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });

  } catch (err) {
    console.error('Auth error:', err);
    return new Response(JSON.stringify({ 
      error: 'Internal server error: ' + err.message 
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });
  }
}
