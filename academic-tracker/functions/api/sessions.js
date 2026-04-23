// EdgeOne Pages Function - Chat Sessions API
// Manage chat sessions using KV database

export async function onRequestGet({ request }) {
  const kv = ACADEMIC_KV;
  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  
  if (!username) {
    return new Response(JSON.stringify({ error: 'Username is required' }), { 
      status: 400,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });
  }

  try {
    // Get all session IDs for this user
    const sessionIdsKey = `user:${username}:session_ids`;
    const sessionIdsStr = await kv.get(sessionIdsKey);
    const sessionIds = sessionIdsStr ? JSON.parse(sessionIdsStr) : [];
    
    // Get all sessions
    const sessions = [];
    for (const sessionId of sessionIds) {
      const sessionData = await kv.get(`session:${sessionId}`);
      if (sessionData) {
        sessions.push(JSON.parse(sessionData));
      }
    }
    
    // Sort by createdAt descending
    sessions.sort((a, b) => b.createdAt - a.createdAt);
    
    return new Response(JSON.stringify({ sessions }), { 
      status: 200,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch sessions' }), { 
      status: 500,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });
  }
}

export async function onRequestPost({ request }) {
  const kv = ACADEMIC_KV;
  
  try {
    const data = await request.json();
    const { action, username, sessionId, session } = data;
    
    if (action === 'save') {
      // Save or update a session
      if (!username || !session) {
        return new Response(JSON.stringify({ error: 'Username and session are required' }), { 
          status: 400,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }
      
      const sessionToSave = {
        ...session,
        updatedAt: Date.now()
      };
      
      // Save session data
      await kv.put(`session:${sessionId}`, JSON.stringify(sessionToSave));
      
      // Update session IDs list
      const sessionIdsKey = `user:${username}:session_ids`;
      const sessionIdsStr = await kv.get(sessionIdsKey);
      let sessionIds = sessionIdsStr ? JSON.parse(sessionIdsStr) : [];
      
      if (!sessionIds.includes(sessionId)) {
        sessionIds.push(sessionId);
        await kv.put(sessionIdsKey, JSON.stringify(sessionIds));
      }
      
      return new Response(JSON.stringify({ success: true, sessionId }), { 
        status: 200,
        headers: { 'content-type': 'application/json; charset=UTF-8' }
      });
    }
    
    if (action === 'delete') {
      // Delete a session
      if (!username || !sessionId) {
        return new Response(JSON.stringify({ error: 'Username and sessionId are required' }), { 
          status: 400,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }
      
      // Remove from session IDs list
      const sessionIdsKey = `user:${username}:session_ids`;
      const sessionIdsStr = await kv.get(sessionIdsKey);
      let sessionIds = sessionIdsStr ? JSON.parse(sessionIdsStr) : [];
      sessionIds = sessionIds.filter(id => id !== sessionId);
      await kv.put(sessionIdsKey, JSON.stringify(sessionIds));
      
      // Delete session data
      await kv.delete(`session:${sessionId}`);
      
      return new Response(JSON.stringify({ success: true }), { 
        status: 200,
        headers: { 'content-type': 'application/json; charset=UTF-8' }
      });
    }
    
    if (action === 'rename') {
      // Rename a session
      if (!username || !sessionId || !data.newName) {
        return new Response(JSON.stringify({ error: 'Username, sessionId and newName are required' }), { 
          status: 400,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }
      
      const sessionData = await kv.get(`session:${sessionId}`);
      if (!sessionData) {
        return new Response(JSON.stringify({ error: 'Session not found' }), { 
          status: 404,
          headers: { 'content-type': 'application/json; charset=UTF-8' }
        });
      }
      
      const session = JSON.parse(sessionData);
      session.name = data.newName;
      session.updatedAt = Date.now();
      
      await kv.put(`session:${sessionId}`, JSON.stringify(session));
      
      return new Response(JSON.stringify({ success: true }), { 
        status: 200,
        headers: { 'content-type': 'application/json; charset=UTF-8' }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Unknown action' }), { 
      status: 400,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });
  } catch (error) {
    console.error('Error managing sessions:', error);
    return new Response(JSON.stringify({ error: 'Failed to manage sessions' }), { 
      status: 500,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });
  }
}
