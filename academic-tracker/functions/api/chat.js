export async function onRequestPost(context) {
  const { request } = context;
  
  try {
    const { username, message } = await request.json();
    
    // 1. Get user context from KV
    const scoresStr = await ACADEMIC_KV.get(`user:${username}:scores`);
    const scores = scoresStr ? JSON.parse(scoresStr) : [];
    
    // MOCK RESPONSE FOR DEMO
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockReply = `(Mock Bailian Response) Understood. Looking at your ${scores.length} past exams, I suggest focusing on core mathematics to boost your high school prep. Your query was: "${message}"`;
    
    return new Response(JSON.stringify({ 
      success: true, 
      reply: mockReply
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
