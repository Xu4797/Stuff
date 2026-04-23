export async function onRequestGet(context) {
  return new Response(JSON.stringify({ 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function onRequestPost(context) {
  const data = await context.request.json();
  
  return new Response(JSON.stringify({ 
    message: 'POST received',
    data: data
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
