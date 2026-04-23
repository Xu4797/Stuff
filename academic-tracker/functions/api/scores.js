// 科目配置
const SUBJECTS = {
  chinese: { name: '语文', maxScore: 120, startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 21 },
  math: { name: '数学', maxScore: 120, startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 22 },
  english: { name: '英语', maxScore: 120, startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 23 },
  politics: { name: '政治', maxScore: 60, startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 22 },
  history: { name: '历史', maxScore: 60, startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 22 },
  biology: { name: '生物', maxScore: 60, startYearOffset: 0, endYearOffset: 2, endMonth: 6, endDay: 24 },
  geography: { name: '地理', maxScore: 60, startYearOffset: 0, endYearOffset: 2, endMonth: 6, endDay: 24 },
  physics: { name: '物理', maxScore: 90, startYearOffset: 1, endYearOffset: 3, endMonth: 6, endDay: 21 },
  chemistry: { name: '化学', maxScore: 60, startYearOffset: 2, endYearOffset: 3, endMonth: 6, endDay: 21 },
  pe: { name: '体育', maxScore: 50, startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 21 }
};

// 检测大型考试：相邻7天内有7次以上的记录
function detectLargeExams(scores) {
  if (scores.length < 7) return [];
  
  const sorted = [...scores].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const largeExams = [];
  const processed = new Set();
  
  for (let i = 0; i < sorted.length; i++) {
    if (processed.has(sorted[i].id)) continue;
    
    const startDate = new Date(sorted[i].date);
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const nearbyScores = sorted.filter(s => {
      const d = new Date(s.date);
      return d >= startDate && d <= endDate && !processed.has(s.id);
    });
    
    if (nearbyScores.length >= 7) {
      const totalScore = nearbyScores.reduce((sum, s) => sum + s.score, 0);
      const subjects = {};
      
      nearbyScores.forEach(s => {
        subjects[s.subject] = s.score;
        processed.add(s.id);
      });
      
      largeExams.push({
        id: `large_${startDate.getTime()}`,
        date: sorted[i].date,
        totalScore,
        subjects,
        examCount: nearbyScores.length,
        isLargeExam: true
      });
    }
  }
  
  return largeExams;
}

export async function onRequestGet(context) {
  const { request } = context;
  
  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  const action = url.searchParams.get('action');
  
  if (!username) return new Response('Username required', { status: 400 });

  try {
    if (action === 'info') {
      const info = await ACADEMIC_KV.get(`user:${username}:info`);
      return new Response(info || '{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else if (action === 'largeExams') {
      const data = await ACADEMIC_KV.get(`user:${username}:largeExams`);
      return new Response(data || '[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      const data = await ACADEMIC_KV.get(`user:${username}:scores`);
      return new Response(data || '[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestPost(context) {
  const { request } = context;

  try {
    const body = await request.json();
    const { username, action } = body;
    
    if (!username) return new Response('Username required', { status: 400 });
    
    if (action === 'updateInfo') {
      const { entryYear, targetScore, targetHighSchool } = body;
      const info = { entryYear: Number(entryYear), targetScore: targetScore ? Number(targetScore) : null, targetHighSchool: targetHighSchool || null };
      await ACADEMIC_KV.put(`user:${username}:info`, JSON.stringify(info));
      return new Response(JSON.stringify({ success: true, info }), { status: 200 });
    } else if (action === 'addScore') {
      const { scores } = body; // [{ subject, score, date, examName }]
      
      const existingStr = await ACADEMIC_KV.get(`user:${username}:scores`);
      const allScores = existingStr ? JSON.parse(existingStr) : [];
      
      scores.forEach((s) => {
        allScores.push({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          subject: s.subject,
          score: Number(s.score),
          date: s.date,
          examName: s.examName || '',
          createdAt: new Date().toISOString()
        });
      });
      
      const largeExams = detectLargeExams(allScores);
      
      await ACADEMIC_KV.put(`user:${username}:scores`, JSON.stringify(allScores));
      await ACADEMIC_KV.put(`user:${username}:largeExams`, JSON.stringify(largeExams));
      
      return new Response(JSON.stringify({ success: true, scores: allScores, largeExams }), { status: 200 });
    }
    
    return new Response('Invalid action', { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
