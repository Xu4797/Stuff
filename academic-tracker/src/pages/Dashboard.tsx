import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';
import { Plus, Calendar, Target, School, Upload, Edit, Check, TrendingUp } from 'lucide-react';

// 科目配置
const SUBJECTS: Record<string, { name: string; maxScore: number; color: string }> = {
  total: { name: '总分', maxScore: 800, color: '#00f3ff' },
  chinese: { name: '语文', maxScore: 120, color: '#ff00ea' },
  math: { name: '数学', maxScore: 120, color: '#ffe600' },
  english: { name: '英语', maxScore: 120, color: '#ff6b35' },
  politics: { name: '政治', maxScore: 60, color: '#00ff88' },
  history: { name: '历史', maxScore: 60, color: '#8b5cf6' },
  biology: { name: '生物', maxScore: 60, color: '#ec4899' },
  geography: { name: '地理', maxScore: 60, color: '#06b6d4' },
  physics: { name: '物理', maxScore: 90, color: '#f59e0b' },
  chemistry: { name: '化学', maxScore: 60, color: '#10b981' },
  pe: { name: '体育', maxScore: 50, color: '#ef4444' }
};

// 科目考试日期范围配置
const SUBJECT_DATE_RANGES: Record<string, { startYearOffset: number; endYearOffset: number; endMonth: number; endDay: number }> = {
  chinese: { startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 21 },
  math: { startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 22 },
  english: { startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 23 },
  politics: { startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 22 },
  history: { startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 22 },
  biology: { startYearOffset: 0, endYearOffset: 2, endMonth: 6, endDay: 24 },
  geography: { startYearOffset: 0, endYearOffset: 2, endMonth: 6, endDay: 24 },
  physics: { startYearOffset: 1, endYearOffset: 3, endMonth: 6, endDay: 21 },
  chemistry: { startYearOffset: 2, endYearOffset: 3, endMonth: 6, endDay: 21 },
  pe: { startYearOffset: 0, endYearOffset: 3, endMonth: 6, endDay: 21 }
};

interface UserInfo {
  entryYear: number;
  targetScore: number | null;
  targetHighSchool: string | null;
}

interface ScoreRecord {
  id: string;
  subject: string;
  score: number;
  date: string;
  examName: string;
  createdAt: string;
}

interface LargeExam {
  id: string;
  date: string;
  totalScore: number;
  subjects: Record<string, number>;
  examCount: number;
  isLargeExam: boolean;
}

const Dashboard: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [largeExams, setLargeExams] = useState<LargeExam[]>([]);
  const [showAddScore, setShowAddScore] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'batch'>('single');
  const [loading, setLoading] = useState(true);
  const [editingInfo, setEditingInfo] = useState(false);
  const [showSubjectCharts, setShowSubjectCharts] = useState(false); // 是否显示单科图表
  const [selectedSubject, setSelectedSubject] = useState<string>('all'); // 选中的科目，'all'表示所有科目
  
  // Info form state
  const [infoForm, setInfoForm] = useState({
    entryYear: '',
    targetScore: '',
    targetHighSchool: ''
  });
  
  // Single score form state
  const [singleScoreForm, setSingleScoreForm] = useState({
    subject: 'chinese',
    score: '',
    date: '',
    examName: ''
  });
  
  // Batch score form state
  const [batchScoreForm, setBatchScoreForm] = useState({
    date: '',
    examName: '',
    subjects: {} as Record<string, string>
  });

  const username = localStorage.getItem('academic_user');
  const fullName = localStorage.getItem('academic_fullName') || username || '用户';

  // 带超时的 fetch 函数
  const fetchWithTimeout = async (url: string, timeout = 5000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // 加载用户信息和成绩
  const loadData = useCallback(async () => {
    const username = localStorage.getItem('academic_user');
    if (!username) {
      setLoading(false);
      setShowInfoForm(true);
      return;
    }
    
    try {
      // 加载用户信息（带超时）
      const infoRes = await fetchWithTimeout(`/api/scores?username=${encodeURIComponent(username)}&action=info`);
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        if (infoData && infoData.entryYear) {
          setUserInfo(infoData);
          setInfoForm({
            entryYear: String(infoData.entryYear),
            targetScore: infoData.targetScore ? String(infoData.targetScore) : '',
            targetHighSchool: infoData.targetHighSchool || ''
          });
        } else {
          setShowInfoForm(true);
        }
      } else {
        // 如果获取失败，也显示表单
        setShowInfoForm(true);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
      setShowInfoForm(true);
    }
    
    try {
      // 加载成绩（带超时）
      const scoresRes = await fetchWithTimeout(`/api/scores?username=${encodeURIComponent(username)}`);
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        setScores(Array.isArray(scoresData) ? scoresData : []);
      }
    } catch (error) {
      console.error('Failed to load scores:', error);
    }
    
    try {
      // 加载大型考试（带超时）
      const largeExamsRes = await fetchWithTimeout(`/api/scores?username=${encodeURIComponent(username)}&action=largeExams`);
      if (largeExamsRes.ok) {
        const largeExamsData = await largeExamsRes.json();
        setLargeExams(Array.isArray(largeExamsData) ? largeExamsData : []);
      }
    } catch (error) {
      console.error('Failed to load large exams:', error);
    }
    
    // 确保 loading 状态被重置
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 保存用户信息
  const handleSaveInfo = async () => {
    if (!infoForm.entryYear) {
      alert('请填写入学年份');
      return;
    }
    
    if (!username) {
      alert('未检测到用户信息，请重新登录');
      window.location.href = '/auth';
      return;
    }
    
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          action: 'updateInfo',
          entryYear: Number(infoForm.entryYear),
          targetScore: infoForm.targetScore ? Number(infoForm.targetScore) : null,
          targetHighSchool: infoForm.targetHighSchool || null
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setUserInfo(data.info);
        setShowInfoForm(false);
        setEditingInfo(false);
      } else {
        alert('保存失败，请稍后重试');
      }
    } catch (error) {
      console.error('Failed to save info:', error);
      alert('网络错误，请检查网络连接');
    }
  };

  // 添加单科成绩
  const handleAddSingleScore = async () => {
    if (!username || !singleScoreForm.score || !singleScoreForm.date) return;
    
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          action: 'addScore',
          scores: [{
            subject: singleScoreForm.subject,
            score: Number(singleScoreForm.score),
            date: singleScoreForm.date,
            examName: singleScoreForm.examName
          }]
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setScores(data.scores);
        setLargeExams(data.largeExams);
        setShowAddScore(false);
        setSingleScoreForm({ subject: 'chinese', score: '', date: '', examName: '' });
      }
    } catch (error) {
      console.error('Failed to add score:', error);
    }
  };

  // 添加批量成绩
  const handleAddBatchScores = async () => {
    if (!username || !batchScoreForm.date) return;
    
    const scoresToAdd = Object.entries(batchScoreForm.subjects)
      .filter(([_, score]) => score && Number(score) > 0)
      .map(([subject, score]) => ({
        subject,
        score: Number(score),
        date: batchScoreForm.date,
        examName: batchScoreForm.examName
      }));
    
    if (scoresToAdd.length === 0) return;
    
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          action: 'addScore',
          scores: scoresToAdd
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setScores(data.scores);
        setLargeExams(data.largeExams);
        setShowAddScore(false);
        setBatchScoreForm({ date: '', examName: '', subjects: {} });
      }
    } catch (error) {
      console.error('Failed to add batch scores:', error);
    }
  };

  // 生成趋势图数据（支持固定时间范围）
  const generateChartData = (subject: string = 'total') => {
    if (!userInfo || !userInfo.entryYear) return [];
    
    const entryYear = userInfo.entryYear;
    const data: any[] = [];
    
    // 获取科目的时间范围
    let startDateStr: string;
    let endDateStr: string;
    
    if (subject === 'total') {
      // 总分：入学年份9月1日 至 入学年份+3年6月23日
      startDateStr = `${entryYear}-09-01`;
      endDateStr = `${entryYear + 3}-06-23`;
    } else {
      const config = SUBJECT_DATE_RANGES[subject];
      if (!config) return [];
      startDateStr = `${entryYear + config.startYearOffset}-09-01`;
      endDateStr = `${entryYear + config.endYearOffset}-${String(config.endMonth).padStart(2, '0')}-${String(config.endDay).padStart(2, '0')}`;
    }
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // 生成所有月份的数据点
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const monthLabel = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      const dataPoint: any = {
        name: monthLabel,
        date: dateStr
      };
      
      // 如果是总分，计算该月所有大型考试的平均总分
      if (subject === 'total') {
        const monthExams = largeExams.filter(exam => {
          const examDate = new Date(exam.date);
          return examDate.getFullYear() === currentDate.getFullYear() && 
                 examDate.getMonth() === currentDate.getMonth();
        });
        
        if (monthExams.length > 0) {
          dataPoint.total = Math.round(monthExams.reduce((sum, exam) => sum + exam.totalScore, 0) / monthExams.length);
        }
      } else {
        // 单科：计算该月该科目的平均分
        const monthScores = scores.filter(s => {
          const scoreDate = new Date(s.date);
          return s.subject === subject && 
                 scoreDate.getFullYear() === currentDate.getFullYear() && 
                 scoreDate.getMonth() === currentDate.getMonth();
        });
        
        if (monthScores.length > 0) {
          dataPoint[subject] = Math.round(monthScores.reduce((sum, s) => sum + s.score, 0) / monthScores.length);
        }
      }
      
      // 只添加有数据的月份
      const hasData = Object.keys(dataPoint).some(key => key !== 'name' && key !== 'date' && dataPoint[key] !== undefined);
      if (hasData) {
        data.push(dataPoint);
      }
      
      // 移动到下一个月份
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return data;
  };
  
  // 生成叠加图数据（包含总分和所有科目）
  const generateCombinedChartData = () => {
    if (!userInfo || !userInfo.entryYear) return [];
    
    const totalData = generateChartData('total');
    if (totalData.length === 0) return [];
    
    // 以总分数据为基础，合并所有科目数据
    const combinedData = totalData.map(totalPoint => {
      const mergedPoint: any = { ...totalPoint };
      
      // 为每个科目查找对应日期的数据
      Object.keys(SUBJECTS).forEach(subject => {
        if (subject === 'total') return;
        
        const subjectData = generateChartData(subject);
        const subjectPoint = subjectData.find(p => p.date === totalPoint.date);
        if (subjectPoint && subjectPoint[subject] !== undefined) {
          mergedPoint[subject] = subjectPoint[subject];
        }
      });
      
      return mergedPoint;
    });
    
    return combinedData;
  };

  // 获取可用科目（根据入学年份）
  const getAvailableSubjects = () => {
    if (!userInfo || !userInfo.entryYear) return Object.keys(SUBJECTS).filter(s => s !== 'total');
    
    const entryYear = userInfo.entryYear;
    const now = new Date();
    
    return Object.keys(SUBJECTS).filter(subject => {
      if (subject === 'total') return false;
      
      const config = SUBJECT_DATE_RANGES[subject];
      const startDate = new Date(`${entryYear + config.startYearOffset}-09-01`);
      const endDate = new Date(`${entryYear + config.endYearOffset}-${String(config.endMonth).padStart(2, '0')}-${String(config.endDay).padStart(2, '0')}`);
      
      return now >= startDate && now <= endDate;
    });
  };

  // 渲染信息录入表单（模态框）
  const renderInfoForm = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem'
      }}
      onClick={() => {
        if (!editingInfo) setShowInfoForm(false);
        else setEditingInfo(false);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        className="glass-panel"
        style={{ 
          padding: '2rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            if (!editingInfo) setShowInfoForm(false);
            else setEditingInfo(false);
          }}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '1.5rem',
            zIndex: 10
          }}
        >
          ×
        </button>
        
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)' }}>
          <Target size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          录入基本信息
        </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <Calendar size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            入学年份 *
          </label>
          <input
            type="number"
            value={infoForm.entryYear}
            onChange={(e) => setInfoForm({ ...infoForm, entryYear: e.target.value })}
            placeholder="例如：2023"
            min="2000"
            max="2030"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: infoForm.entryYear ? '1px solid var(--neon-cyan)' : '1px solid #ff6b6b',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '1rem'
            }}
          />
          {!infoForm.entryYear && (
            <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              请填写入学年份（必填）
            </div>
          )}
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <Target size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            目标分数（可选）
          </label>
          <input
            type="number"
            value={infoForm.targetScore}
            onChange={(e) => setInfoForm({ ...infoForm, targetScore: e.target.value })}
            placeholder="例如：700"
            min="0"
            max="800"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--neon-magenta)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <School size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            目标高中（可选）
          </label>
          <input
            type="text"
            value={infoForm.targetHighSchool}
            onChange={(e) => setInfoForm({ ...infoForm, targetHighSchool: e.target.value })}
            placeholder="例如：西宁四中"
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--neon-magenta)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '1rem'
            }}
          />
        </div>
        
        <button
          onClick={handleSaveInfo}
          disabled={!infoForm.entryYear}
          className="btn-sci-fi btn-sci-fi-primary"
          style={{ width: '100%', marginTop: '1rem' }}
        >
          <Check size={18} style={{ marginRight: '0.5rem' }} />
          保存信息
        </button>
      </div>
      </motion.div>
    </motion.div>
  );

  // 渲染统计卡片
  const renderStatsCards = () => {
    if (!userInfo) return null;
    
    // 计算最近5次大型考试的平均分
    const recentExams = largeExams.slice(-5);
    const avgScore = recentExams.length > 0
      ? Math.round(recentExams.reduce((sum, exam) => sum + exam.totalScore, 0) / recentExams.length)
      : 0;
      
    const latestScore = largeExams.length > 0
      ? largeExams[largeExams.length - 1].totalScore
      : 0;
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <motion.div whileHover={{ scale: 1.05 }} className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <TrendingUp size={16} />
            <span>最近考试总分</span>
          </div>
          <div className="neon-text-cyan" style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {latestScore}/800
          </div>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.05 }} className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
            <Target size={16} />
            <span>最近5次平均分</span>
          </div>
          <div className="neon-text-magenta" style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            {avgScore}
          </div>
        </motion.div>
        
        {userInfo.targetScore && (
          <motion.div whileHover={{ scale: 1.05 }} className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <Target size={16} />
              <span>目标分数</span>
            </div>
            <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--neon-yellow)' }}>
              {userInfo.targetScore}
            </div>
          </motion.div>
        )}
        
        {userInfo.targetHighSchool && (
          <motion.div whileHover={{ scale: 1.05 }} className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <School size={16} />
              <span>目标高中</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--neon-green)' }}>
              {userInfo.targetHighSchool}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // 渲染趋势图
  const renderTrendChart = () => {
    if (!userInfo) return null;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* 总分趋势图 */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
            总分趋势分析
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={generateChartData('total')}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-muted)"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="var(--text-muted)" 
                domain={[0, 800]}
                label={{ value: '分数', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-panel)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid var(--neon-cyan)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              
              <Line
                type="monotone"
                dataKey="total"
                stroke={SUBJECTS.total.color}
                strokeWidth={3}
                name="总分"
                dot={{ r: 6, fill: 'var(--bg-dark)', stroke: SUBJECTS.total.color, strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* 单科成绩图控制 */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-main)', fontFamily: 'var(--font-display)', margin: 0 }}>
              单科成绩趋势
            </h3>
            <button
              onClick={() => setShowSubjectCharts(!showSubjectCharts)}
              className="btn-sci-fi"
              style={{ 
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                borderColor: showSubjectCharts ? 'var(--neon-magenta)' : 'var(--neon-cyan)',
                color: showSubjectCharts ? 'var(--neon-magenta)' : 'var(--neon-cyan)'
              }}
            >
              {showSubjectCharts ? '切换为单独显示' : '切换为叠加显示'}
            </button>
          </div>
          
          {/* 科目选择器（仅在单独显示模式时显示） */}
          {showSubjectCharts && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem', 
              marginBottom: '1rem',
              padding: '0.5rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px'
            }}>
              <button
                onClick={() => setSelectedSubject('all')}
                style={{
                  padding: '0.4rem 0.8rem',
                  background: selectedSubject === 'all' ? 'rgba(0, 243, 255, 0.2)' : 'transparent',
                  border: selectedSubject === 'all' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  color: selectedSubject === 'all' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                全部显示
              </button>
              {Object.keys(SUBJECTS).filter(s => s !== 'total').map(subject => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: selectedSubject === subject ? `${SUBJECTS[subject].color}33` : 'transparent',
                    border: selectedSubject === subject ? `1px solid ${SUBJECTS[subject].color}` : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: selectedSubject === subject ? SUBJECTS[subject].color : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {SUBJECTS[subject].name}
                </button>
              ))}
            </div>
          )}
          
          {/* 单科图表 */}
          {!showSubjectCharts ? (
            // 叠加显示模式：所有科目在一个图中
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={generateCombinedChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="var(--text-muted)"
                  domain={[0, 800]}
                  label={{ value: '分数', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-panel)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--neon-cyan)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                
                {/* 总分线 */}
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={SUBJECTS.total.color}
                  strokeWidth={3}
                  name="总分"
                  dot={{ r: 6, fill: 'var(--bg-dark)', stroke: SUBJECTS.total.color, strokeWidth: 2 }}
                />
                
                {/* 所有科目线 */}
                {Object.keys(SUBJECTS).filter(s => s !== 'total').map(subject => {
                  const subjectData = generateChartData(subject);
                  if (subjectData.length === 0) return null;
                  
                  return (
                    <Line
                      key={subject}
                      type="monotone"
                      dataKey={subject}
                      stroke={SUBJECTS[subject].color}
                      strokeWidth={2}
                      name={SUBJECTS[subject].name}
                      dot={{ r: 4, fill: 'var(--bg-dark)', stroke: SUBJECTS[subject].color, strokeWidth: 2 }}
                    />
                  );
                })}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            // 单独显示模式：每个科目独立图表
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {(selectedSubject === 'all' ? Object.keys(SUBJECTS).filter(s => s !== 'total') : [selectedSubject]).map(subject => {
                const chartData = generateChartData(subject);
                if (chartData.length === 0) return null;
                
                return (
                  <div key={subject} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                    <h4 style={{ 
                      color: SUBJECTS[subject].color, 
                      marginBottom: '0.5rem',
                      fontSize: '1rem'
                    }}>
                      {SUBJECTS[subject].name}（满分{SUBJECTS[subject].maxScore}）
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="name" 
                          stroke="var(--text-muted)"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          stroke="var(--text-muted)"
                          domain={[0, SUBJECTS[subject].maxScore]}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'var(--bg-panel)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${SUBJECTS[subject].color}`,
                            borderRadius: '8px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey={subject}
                          stroke={SUBJECTS[subject].color}
                          strokeWidth={2}
                          name={SUBJECTS[subject].name}
                          dot={{ r: 4, fill: 'var(--bg-dark)', stroke: SUBJECTS[subject].color, strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染添加成绩表单（模态框）
  const renderAddScoreForm = () => {
    const availableSubjects = getAvailableSubjects();
    
    return (
      <AnimatePresence>
        {showAddScore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem'
            }}
            onClick={() => setShowAddScore(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="glass-panel"
              style={{ 
                padding: '2rem',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)', margin: 0 }}>
                <Upload size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                添加考试成绩
              </h2>
              <button
                onClick={() => setShowAddScore(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.5rem'
                }}
              >
                ×
              </button>
            </div>
            
            {/* 切换添加模式 */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setAddMode('single')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: addMode === 'single' ? 'rgba(0, 243, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                  border: addMode === 'single' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: addMode === 'single' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                单科添加
              </button>
              <button
                onClick={() => setAddMode('batch')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: addMode === 'batch' ? 'rgba(0, 243, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                  border: addMode === 'batch' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: addMode === 'batch' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                批量添加
              </button>
            </div>
            
            {addMode === 'single' ? (
              // 单科添加
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>考试科目</label>
                  <select
                    value={singleScoreForm.subject}
                    onChange={(e) => setSingleScoreForm({ ...singleScoreForm, subject: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--neon-cyan)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '1rem'
                    }}
                  >
                    {availableSubjects.map(subject => (
                      <option key={subject} value={subject}>{SUBJECTS[subject].name} (满分{SUBJECTS[subject].maxScore})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>成绩</label>
                  <input
                    type="number"
                    value={singleScoreForm.score}
                    onChange={(e) => setSingleScoreForm({ ...singleScoreForm, score: e.target.value })}
                    placeholder="输入分数"
                    min="0"
                    max={SUBJECTS[singleScoreForm.subject]?.maxScore || 800}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--neon-cyan)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>考试日期</label>
                  <input
                    type="date"
                    value={singleScoreForm.date}
                    onChange={(e) => setSingleScoreForm({ ...singleScoreForm, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--neon-cyan)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>考试名称（可选）</label>
                  <input
                    type="text"
                    value={singleScoreForm.examName}
                    onChange={(e) => setSingleScoreForm({ ...singleScoreForm, examName: e.target.value })}
                    placeholder="例如：第一次月考"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--neon-magenta)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <button
                  onClick={handleAddSingleScore}
                  disabled={!singleScoreForm.score || !singleScoreForm.date}
                  className="btn-sci-fi btn-sci-fi-primary"
                  style={{ width: '100%' }}
                >
                  <Plus size={18} style={{ marginRight: '0.5rem' }} />
                  添加成绩
                </button>
              </div>
            ) : (
              // 批量添加
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>考试日期</label>
                  <input
                    type="date"
                    value={batchScoreForm.date}
                    onChange={(e) => setBatchScoreForm({ ...batchScoreForm, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--neon-cyan)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>考试名称（可选）</label>
                  <input
                    type="text"
                    value={batchScoreForm.examName}
                    onChange={(e) => setBatchScoreForm({ ...batchScoreForm, examName: e.target.value })}
                    placeholder="例如：期中考试"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--neon-magenta)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>各科成绩</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                    {availableSubjects.map(subject => (
                      <div key={subject}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          {SUBJECTS[subject].name}
                        </label>
                        <input
                          type="number"
                          value={batchScoreForm.subjects[subject] || ''}
                          onChange={(e) => setBatchScoreForm({
                            ...batchScoreForm,
                            subjects: { ...batchScoreForm.subjects, [subject]: e.target.value }
                          })}
                          placeholder={`满分${SUBJECTS[subject].maxScore}`}
                          min="0"
                          max={SUBJECTS[subject].maxScore}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid var(--neon-magenta)',
                            borderRadius: '6px',
                            color: 'var(--text-main)',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleAddBatchScores}
                  disabled={!batchScoreForm.date || Object.values(batchScoreForm.subjects).every(v => !v)}
                  className="btn-sci-fi btn-sci-fi-primary"
                  style={{ width: '100%' }}
                >
                  <Plus size={18} style={{ marginRight: '0.5rem' }} />
                  批量添加成绩
                </button>
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div className="neon-text-cyan" style={{ fontSize: '1.5rem' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 欢迎语 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.1), rgba(255, 0, 234, 0.1))',
          border: '1px solid var(--neon-cyan)',
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(0, 243, 255, 0.2)',
        }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
          <span className="neon-text-cyan">欢迎，</span>
          <span 
            style={{
              background: 'linear-gradient(90deg, #00f3ff, #ffe600, #ff00ea, #00f3ff)',
              backgroundSize: '300% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradientShift 3s ease infinite',
              fontWeight: 700,
              textShadow: 'none'
            }}
          >
            {fullName}
          </span>
        </h2>
      </motion.div>

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="neon-text-cyan" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>成绩分析面板</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
            分析历史考试数据，预测中考成绩轨迹。
          </p>
        </div>
        
        {userInfo && (
          <button
            onClick={() => setEditingInfo(!editingInfo)}
            className="btn-sci-fi"
            style={{ borderColor: 'var(--neon-magenta)', color: 'var(--neon-magenta)' }}
          >
            <Edit size={18} style={{ marginRight: '0.5rem' }} />
            {editingInfo ? '取消' : '编辑信息'}
          </button>
        )}
      </header>

      {/* 信息录入表单（模态框） */}
      <AnimatePresence>
        {showInfoForm && renderInfoForm()}
        {editingInfo && userInfo && renderInfoForm()}
      </AnimatePresence>

      {/* 统计卡片 */}
      {userInfo && renderStatsCards()}

      {/* 趋势图 */}
      {userInfo && renderTrendChart()}

      {/* 添加成绩按钮 */}
      {userInfo && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button
            onClick={() => setShowAddScore(true)}
            className="btn-sci-fi btn-sci-fi-primary"
            style={{ width: '100%' }}
          >
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            上传新考试成绩
          </button>
        </div>
      )}

      {/* 添加成绩表单 */}
      {renderAddScoreForm()}
    </div>
  );
};

export default Dashboard;
