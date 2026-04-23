import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setErrorMsg('请输入用户名和密码');
      setLoading(false);
      return;
    }

    if (!isLogin && !fullName.trim()) {
      setErrorMsg('请输入姓名');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          username: username.trim(),
          password: password.trim(),
          fullName: !isLogin ? fullName.trim() : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isLogin) {
        localStorage.setItem('academic_token', data.token);
        localStorage.setItem('academic_user', data.username);
        localStorage.setItem('academic_fullName', data.fullName || data.username); // Save full name
        navigate('/app/dashboard');
      } else {
        // Registration successful
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setFullName('');
        setErrorMsg('注册成功，请登录该系统。');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '认证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
    }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -50, left: -50, width: 100, height: 100, background: 'var(--neon-cyan)', filter: 'blur(50px)', opacity: 0.3, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -50, right: -50, width: 100, height: 100, background: 'var(--neon-magenta)', filter: 'blur(50px)', opacity: 0.3, borderRadius: '50%' }} />

        <div style={{ textAlign: 'center', zIndex: 1 }}>
          <h1 className={isLogin ? 'neon-text-cyan' : 'neon-text-magenta'} style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>
            {isLogin ? '系统登录' : '注册新用户'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {isLogin ? '请输入凭证以访问学习档案中心' : '绑定您的身份档案以开启学习预测'}
          </p>
        </div>

        {errorMsg && (
          <div style={{ color: 'var(--neon-magenta)', textAlign: 'center', fontSize: '0.875rem', zIndex: 1, background: 'rgba(255,0,234,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 1 }}>
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <input 
                  type="text" 
                  placeholder="姓名"
                  className="input-sci-fi" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required={!isLogin} 
                />
              </motion.div>
            )}
          </AnimatePresence>
          <input 
            type="text" 
            placeholder="用户名" 
            className="input-sci-fi" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="密码" 
            className="input-sci-fi" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required 
          />

          <button type="submit" disabled={loading} className={isLogin ? 'btn-sci-fi btn-sci-fi-primary' : 'btn-sci-fi'} style={{ marginTop: '1rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
        </form>

        <div style={{ textAlign: 'center', zIndex: 1, marginTop: '1rem' }}>
          <button type="button" className="btn-sci-fi" style={{ width: '100%', borderColor: 'transparent', borderBottom: '1px solid var(--glass-border)' }}>
            人脸生物识别登录
          </button>
        </div>

        <div style={{ textAlign: 'center', zIndex: 1, marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'var(--font-display)'
            }}
          >
            {isLogin ? '尚未建立档案？立即注册' : '已持有通行证？返回登录'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
