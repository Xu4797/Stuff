// Test KV functionality
export async function onRequestGet({ request }) {
  try {
    // Test if ACADEMIC_KV is available as global variable
    if (typeof ACADEMIC_KV === 'undefined') {
      return new Response(JSON.stringify({ 
        error: 'ACADEMIC_KV is not defined',
        hint: 'Check KV binding in EdgeOne Pages console'
      }), {
        status: 500,
        headers: { 'content-type': 'application/json; charset=UTF-8' }
      });
    }

    // Test KV read/write
    const testKey = 'test:' + Date.now();
    const testValue = 'KV is working!';
    
    await ACADEMIC_KV.put(testKey, testValue);
    const retrieved = await ACADEMIC_KV.get(testKey);
    
    // Clean up
    await ACADEMIC_KV.delete(testKey);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'KV database is working correctly!',
      testKey,
      testValue,
      retrieved,
      match: retrieved === testValue,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: 'KV test failed',
      message: err.message,
      stack: err.stack
    }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=UTF-8' }
    });
  }
}
