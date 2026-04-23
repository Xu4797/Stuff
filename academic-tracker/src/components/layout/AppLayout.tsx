import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageSquare, LogOut, User } from 'lucide-react';

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [userInfo, setUserInfo] = useState({ username: '', registerTime: '' });
  
  // Determine if current page is chat page
  const isChatPage = location.pathname.includes('/app/chat');
  
  // Dynamic theme color based on current page
  const themeColor = isChatPage ? 'var(--neon-magenta)' : 'var(--neon-cyan)';
  const themeTextClass = isChatPage ? 'neon-text-magenta' : 'neon-text-cyan';

  useEffect(() => {
    // Get user info from localStorage
    const username = localStorage.getItem('academic_user') || '未知用户';
    const fullName = localStorage.getItem('academic_fullName') || username; // Get full name
    
    // Try to decode token to get registration time
    const token = localStorage.getItem('academic_token');
    let registerTime = '未知时间';
    
    if (token) {
      try {
        // Try to decode JWT or simple base64 token
        let payload;
        if (token.split('.').length === 3) {
          // JWT format
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          payload = JSON.parse(jsonPayload);
        } else {
          // Simple base64 encoded JSON
          payload = JSON.parse(atob(token));
        }
        
        if (payload.iat) {
          registerTime = new Date(payload.iat).toLocaleString('zh-CN');
        }
      } catch (err) {
        console.error('Failed to decode token:', err);
      }
    }
    
    setUserInfo({ username: fullName, registerTime }); // Use fullName for display
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('academic_token');
    localStorage.removeItem('academic_user');
    localStorage.removeItem('academic_fullName'); // Clear full name
    navigate('/auth');
  };

  const navItems = [
    { path: '/app/dashboard', icon: <Home size={20} />, label: '数据中心' },
    { path: '/app/chat', icon: <MessageSquare size={20} />, label: 'AI 指导' },
  ];

  return (
    <div className="layout-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      
      {/* Top Header */}
      <header style={{
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(12px)',
        zIndex: 10,
        position: 'relative',
      }}>
        {/* Left side - Logo */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <span 
            className={themeTextClass} 
            style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              fontSize: isChatPage ? '1rem' : '1.6rem', // TRACKER: much smaller in chat, much larger in dashboard
              transition: 'color 0.3s ease, text-shadow 0.3s ease, font-size 0.3s ease', // Smooth transitions
              lineHeight: '1' // Ensure consistent baseline
            }}
          >
            TRACKER
          </span>
          <span 
            style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              fontSize: '1.25rem', // Fixed size for dot
              color: themeColor, // Use theme color
              transition: 'color 0.3s ease, text-shadow 0.3s ease', // Only color transitions
              margin: '0 2px', // Small gap around the dot
              lineHeight: '1' // Ensure consistent baseline
            }}
          >
            .
          </span>
          <span 
            className={themeTextClass} 
            style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 700, 
              fontSize: isChatPage ? '1.6rem' : '1rem', // AI: much larger in chat, much smaller in dashboard
              transition: 'color 0.3s ease, text-shadow 0.3s ease, font-size 0.3s ease', // Smooth transitions
              lineHeight: '1' // Ensure consistent baseline
            }}
          >
            AI
          </span>
        </div>

        {/* Right side - User Avatar with Hover Info */}
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={() => setShowUserInfo(true)}
          onMouseLeave={() => setShowUserInfo(false)}
        >
          {/* User Avatar */}
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: themeColor,
            boxShadow: `0 0 10px ${themeColor}`,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: 'var(--bg-dark)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}>
            <User size={20} />
          </div>

          {/* User Info Dropdown */}
          <AnimatePresence>
            {showUserInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '50px',
                  right: '0',
                  minWidth: '220px',
                  background: 'rgba(10, 10, 20, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${themeColor}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  boxShadow: `0 10px 40px ${isChatPage ? 'rgba(255, 0, 234, 0.2)' : 'rgba(0, 243, 255, 0.2)'}`,
                  zIndex: 100,
                }}
              >
                {/* User Info */}
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-magenta))',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                    }}>
                      {userInfo.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>
                        {userInfo.username}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        注册时间: {userInfo.registerTime}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logout Button - Color changes based on current page */}
                <button 
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    // Dashboard: magenta, Chat: cyan
                    background: isChatPage ? 'rgba(0, 243, 255, 0.1)' : 'rgba(255, 0, 234, 0.1)',
                    border: `1px solid ${isChatPage ? 'var(--neon-cyan)' : 'var(--neon-magenta)'}`,
                    borderRadius: '8px',
                    color: isChatPage ? 'var(--neon-cyan)' : 'var(--neon-magenta)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (isChatPage) {
                      e.currentTarget.style.background = 'rgba(0, 243, 255, 0.2)';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 243, 255, 0.3)';
                    } else {
                      e.currentTarget.style.background = 'rgba(255, 0, 234, 0.2)';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 234, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isChatPage) {
                      e.currentTarget.style.background = 'rgba(0, 243, 255, 0.1)';
                    } else {
                      e.currentTarget.style.background = 'rgba(255, 0, 234, 0.1)';
                    }
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <LogOut size={16} />
                  <span>退出登录</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1rem', position: 'relative' }}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{ height: '100%' }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Bottom Navigation (Mobile First) */}
      <nav style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--glass-border)',
        background: 'var(--bg-panel)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0.5rem',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        zIndex: 10,
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          // Use theme color for active state
          const activeColor = isChatPage ? 'var(--neon-magenta)' : 'var(--neon-cyan)';
          const activeBg = isChatPage ? 'rgba(255, 0, 234, 0.1)' : 'rgba(0, 243, 255, 0.1)';
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                background: isActive ? activeBg : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: isActive ? activeColor : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-display)' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AppLayout;
