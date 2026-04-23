// Simple test function without external dependencies
export async function onRequestGet({ request }) {
  return new Response(JSON.stringify({
    message: 'Functions are working!',
    timestamp: new Date().toISOString(),
    url: request.url
  }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=UTF-8' }
  });
}

export async function onRequestPost({ request }) {
  const data = await request.json();
  
  return new Response(JSON.stringify({
    message: 'POST received',
    data: data,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=UTF-8' }
  });
}
