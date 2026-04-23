import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Check if user is logged in
  const checkAuthAndNavigate = () => {
    const token = localStorage.getItem('academic_token');
    const username = localStorage.getItem('academic_user');
    
    if (token && username) {
      // User is logged in, navigate to dashboard
      navigate('/app/dashboard');
    } else {
      // User is not logged in, navigate to auth page
      navigate('/auth');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 装饰性背景 */}
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: 300, height: 300, background: 'var(--neon-cyan)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: 300, height: 300, background: 'var(--neon-magenta)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', zIndex: 1, maxWidth: '800px' }}
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ marginBottom: '2rem' }}
        >
          <h1 className="neon-text-cyan" style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 4rem)', 
            fontFamily: 'var(--font-display)', 
            margin: 0, 
            lineHeight: 1.1,
            textAlign: 'center'
          }}>
            <span className="logo-desktop">TRACKER<span style={{ color: 'var(--neon-magenta)' }}>.AI</span></span>
            
            <div className="logo-mobile">
              <span>TRACKER</span>
              <svg className="logo-cross-svg" viewBox="0 0 24 24" width="24" height="24">
                <line x1="6" y1="6" x2="18" y2="18" stroke="var(--neon-magenta)" strokeWidth="1.5" />
                <line x1="18" y1="6" x2="6" y2="18" stroke="var(--neon-magenta)" strokeWidth="1.5" />
              </svg>
              <span style={{ color: 'var(--neon-magenta)' }}>AI</span>
            </div>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginTop: '1rem', letterSpacing: '2px' }}>
            新一代智能中考成绩预测与学习规划系统
          </p>
        </motion.div>

        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem', textAlign: 'left', lineHeight: 1.8 }}>
          <p style={{ color: 'var(--text-muted)' }}>
            通过强大的边缘计算节点（EdgeOne）与通义千问大模型（Qwen）无缝连接。只需上传您过往的考试成绩，我们将依靠历史数据大致推测您的中考成绩，并由AI学姐为您提供学习辅导和择校建议。
          </p>
        </div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ display: 'inline-block' }}
        >
          <button 
            onClick={checkAuthAndNavigate}
            className="btn-sci-fi btn-sci-fi-primary" 
            style={{ fontSize: '1.25rem', padding: '1rem 3rem', borderRadius: '50px' }}
          >
            进入仪表盘
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HomePage;
