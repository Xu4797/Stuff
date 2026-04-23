// 声明全局 KV 变量
declare const ACADEMIC_KV: {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

export async function onRequestPost(context: any) {
  const { request } = context;
  
  // Here you would use env.BAILIAN_API_KEY and env.BAILIAN_APP_ID
  
  try {
    const { username, message } = await request.json();
    
    // 1. Get user context from KV
    const scoresStr = await ACADEMIC_KV.get(`user:${username}:scores`);
    const scores = scoresStr ? JSON.parse(scoresStr) : [];
    
    // 2. Build system prompt including the historic scores
    const contextPrompt = `You are a helpful AI tutor on the Tracker.AI system. 
The user's historical exam scores are: ${JSON.stringify(scores)}.
Please answer their question and recommend study plans based on their performance.`;
    
    // 3. Call Alibaba Cloud Bailian API
    /*
    const bailianRes = await fetch('https://dashscope.aliyuncs.com/api/v1/apps/' + env.BAILIAN_APP_ID + '/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.BAILIAN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { prompt: message },
        parameters: { has_thoughts: false },
        debug: {}
      })
    });
    const bailianData = await bailianRes.json();
    */

    // MOCK RESPONSE FOR DEMO
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockReply = `(Mock Bailian Response) Understood. Looking at your ${scores.length} past exams, I suggest focusing on core mathematics to boost your high school prep. Your query was: "${message}"`;
    
    return new Response(JSON.stringify({ 
      success: true, 
      reply: mockReply
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
