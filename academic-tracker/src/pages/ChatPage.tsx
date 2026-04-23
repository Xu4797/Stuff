import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Upload, Brain, Image as ImageIcon, FileText, X, Plus, History, Edit2, Trash2, Check, ZoomIn, ZoomOut } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// 阿里云百炼配置
const DASHSCOPE_API_KEY = 'sk-26da187285de4fc78f8a7d67fef7e57c';
const APP_ID = 'bfc4d88d22cb42aea0639fa1a69c1105';
const API_URL = `https://dashscope.aliyuncs.com/api/v1/apps/${APP_ID}/completion`;

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
  images?: string[];
  files?: Array<{ name: string; url: string }>;
  thoughts?: string;
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  sessionId: string;
  createdAt: number;
}

interface UploadedFile {
  file: File;
  url: string;
  type: 'image' | 'document';
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      role: 'ai', 
      text: '您好！我是您的AI学姐。我可以回答您的问题、分析学习成绩，也进行深度思考。您可以上传文件或图片，我会为您详细解读。' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enableThinking, setEnableThinking] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [imageModal, setImageModal] = useState<{ src: string; zoom: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部 - 优化：只在用户在底部时才滚动
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // 检查是否在底部（允许 100px 的误差）
    const checkIsAtBottom = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 100);
    };

    // 监听滚动事件
    container.addEventListener('scroll', checkIsAtBottom);

    // 只有当用户在底部时才自动滚动
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    return () => {
      container.removeEventListener('scroll', checkIsAtBottom);
    };
  }, [messages, isAtBottom]);

  // 加载历史会话
  useEffect(() => {
    loadSessionsFromKV();
  }, []);

  // 从 KV 加载会话（仅用于初始化）
  const loadSessionsFromKV = async () => {
    const username = localStorage.getItem('academic_user');
    if (!username) return;

    try {
      const response = await fetch(`/api/sessions?username=${encodeURIComponent(username)}`);
      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];
        setChatSessions(sessions);
        
        if (sessions.length > 0) {
          // 直接使用从 API 获取的会话数据
          const firstSession = sessions[0];
          setCurrentSessionId(firstSession.id);
          setMessages(firstSession.messages);
          setSessionId(firstSession.sessionId);
          setUploadedFiles([]);
          setInput('');
          
          // 滚动到底部
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          createNewSession();
        }
      }
    } catch (error) {
      console.error('Failed to load sessions from KV:', error);
      createNewSession();
    }
  };

  // 保存会话到 KV
  const saveSessionToKV = async (session: ChatSession) => {
    const username = localStorage.getItem('academic_user');
    if (!username) return;

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          username,
          sessionId: session.id,
          session
        })
      });
    } catch (error) {
      console.error('Failed to save session to KV:', error);
    }
  };

  // 删除会话
  const deleteSession = async (sessionId: string) => {
    const username = localStorage.getItem('academic_user');
    if (!username) return;

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          username,
          sessionId
        })
      });
      
      // 更新本地状态
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // 如果删除的是当前会话，创建新会话
      if (currentSessionId === sessionId) {
        createNewSession();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // 重命名会话
  const renameSession = async (sessionId: string, newName: string) => {
    const username = localStorage.getItem('academic_user');
    if (!username) return;

    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          username,
          sessionId,
          newName
        })
      });
      
      // 更新本地状态
      setChatSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, name: newName } : s
      ));
      
      setEditingSessionId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to rename session:', error);
    }
  };

  // 创建新会话并保存到 KV
  const createNewSession = async () => {
    const newSessionId = `session_${Date.now()}`;
    const initialMessage: Message = { 
      id: Date.now(), 
      role: 'ai', 
      text: '您好！我是您的AI学姐。我可以回答您的问题、分析学习成绩，也进行深度思考。您可以上传文件或图片，我会为您详细解读。' 
    };
    const newSession: ChatSession = {
      id: newSessionId,
      name: `新对话 ${chatSessions.length + 1}`,
      messages: [initialMessage],
      sessionId: '',
      createdAt: Date.now()
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setMessages([initialMessage]);
    setSessionId('');
    setUploadedFiles([]);
    setInput('');
    setEnableThinking(false);
    
    // 保存到 KV
    await saveSessionToKV(newSession);
  };

  // 加载会话 - 总是从 KV 获取最新数据
  const loadSession = async (sessionId: string) => {
    const username = localStorage.getItem('academic_user');
    if (!username) return;

    try {
      // 从 KV 获取最新的会话列表
      const response = await fetch(`/api/sessions?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        console.error('Failed to fetch sessions from KV');
        return;
      }

      const data = await response.json();
      const sessions = data.sessions || [];
      
      // 更新本地缓存
      setChatSessions(sessions);
      
      // 查找目标会话
      const session = sessions.find((s: ChatSession) => s.id === sessionId);
      if (session) {
        // 加载会话
        setCurrentSessionId(sessionId);
        setMessages(session.messages);
        setSessionId(session.sessionId);
        setUploadedFiles([]);
        setInput('');
        
        // 滚动到底部
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 50);
      } else {
        console.warn(`Session ${sessionId} not found in KV`);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || isLoading) return;

    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : 'document';
      
      setUploadedFiles(prev => [...prev, {
        file,
        url,
        type
      }]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 移除已上传文件
  const removeFile = (index: number) => {
    if (isLoading) return;
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 将文件上传到临时存储
  const uploadFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const currentFiles = [...uploadedFiles];
    
    // 构建用户消息
    const newUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      text: userMessage,
      images: currentFiles.filter(f => f.type === 'image').map(f => f.url),
      files: currentFiles.filter(f => f.type === 'document').map(f => ({
        name: f.file.name,
        url: f.url
      }))
    };

    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);

    // 添加空的 AI 消息
    const aiMessageId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: aiMessageId,
      role: 'ai',
      text: '',
      thoughts: ''
    }]);

    try {
      const requestData: any = {
        input: {
          prompt: userMessage || '请分析我上传的文件'
        },
        parameters: {
          incremental_output: true,
          enable_thinking: enableThinking,
          has_thoughts: enableThinking
        },
        debug: {}
      };

      if (sessionId) {
        requestData.input.session_id = sessionId;
      }

      const imageFiles = currentFiles.filter(f => f.type === 'image');
      if (imageFiles.length > 0) {
        const imageList = await Promise.all(
          imageFiles.map(f => uploadFileToBase64(f.file))
        );
        requestData.input.image_list = imageList;
      }

      const documentFiles = currentFiles.filter(f => f.type === 'document');
      if (documentFiles.length > 0) {
        const fileList = await Promise.all(
          documentFiles.map(f => uploadFileToBase64(f.file))
        );
        requestData.input.file_list = fileList;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let accumulatedThoughts = '';
      let newSessionId = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.slice(5).trim());
                
                if (data.output?.text) {
                  accumulatedText += data.output.text;
                  
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, text: accumulatedText, thoughts: accumulatedThoughts }
                      : msg
                  ));
                }

                if (enableThinking && data.output?.thoughts && Array.isArray(data.output.thoughts)) {
                  const newThoughts = data.output.thoughts
                    .map((t: any) => t.thought || '')
                    .filter(Boolean)
                    .join('\n');
                  if (newThoughts) {
                    // 直接累积流式输出片段，不添加或删除任何符号
                    accumulatedThoughts += newThoughts;
                    
                    setMessages(prev => prev.map(msg => 
                      msg.id === aiMessageId 
                        ? { ...msg, thoughts: accumulatedThoughts }
                        : msg
                    ));
                  }
                }

                if (data.output?.session_id) {
                  newSessionId = data.output.session_id;
                }
              } catch (e) {
                console.error('解析 SSE 数据失败:', e);
              }
            }
          }
        }
      }

      if (newSessionId) {
        setSessionId(newSessionId);
      }

      // 更新会话 - 使用最新的 messages 状态
      setMessages(prev => {
        const finalMessages = prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: accumulatedText, thoughts: accumulatedThoughts }
            : msg
        );
        
        // 异步保存到 KV
        setTimeout(async () => {
          const currentSession = chatSessions.find(s => s.id === currentSessionId);
          if (currentSession) {
            await saveSessionToKV({
              ...currentSession,
              messages: finalMessages,
              sessionId: newSessionId || currentSession.sessionId
            });
          }
        }, 0);
        
        return finalMessages;
      });

    } catch (error) {
      console.error('Error calling Bailian API:', error);
      setMessages(prev => {
        const updatedMessages = prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, text: '抱歉，连接AI服务时出现错误。请稍后重试。' }
            : msg
        );
        
        // 保存错误消息到 KV
        setTimeout(async () => {
          const currentSession = chatSessions.find(s => s.id === currentSessionId);
          if (currentSession) {
            await saveSessionToKV({
              ...currentSession,
              messages: updatedMessages
            });
          }
        }, 0);
        
        return updatedMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', gap: '1rem' }}>
      {/* 历史记录侧边栏 */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* 移动端遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 998,
                display: 'none'
              }}
              className="mobile-overlay"
            />
            
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{
                position: 'relative',
                width: 280,
                background: 'rgba(10, 10, 20, 0.98)',
                border: '1px solid var(--neon-magenta)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 999,
                flexShrink: 0
              }}
              className="history-sidebar"
            >
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255, 0, 234, 0.2)' }}>
              <h3 style={{ margin: 0, color: 'var(--neon-magenta)', fontSize: '1rem' }}>历史对话</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
              {chatSessions.map(session => (
                <div
                  key={session.id}
                  style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: currentSessionId === session.id ? 'rgba(255, 0, 234, 0.1)' : 'transparent',
                    border: `1px solid ${currentSessionId === session.id ? 'var(--neon-magenta)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {editingSessionId === session.id ? (
                    // 编辑模式
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameSession(session.id, editingName);
                          } else if (e.key === 'Escape') {
                            setEditingSessionId(null);
                            setEditingName('');
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--neon-cyan)',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          color: 'var(--text-main)',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => renameSession(session.id, editingName)}
                        style={{
                          background: 'rgba(0, 243, 255, 0.2)',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '0.25rem',
                          cursor: 'pointer',
                          color: 'var(--neon-cyan)'
                        }}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    // 显示模式
                    <>
                      <div 
                        onClick={() => loadSession(session.id)}
                        style={{ 
                          fontSize: '0.875rem', 
                          color: 'var(--text-main)', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {session.name}
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSessionId(session.id);
                              setEditingName(session.name);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('确定要删除这个对话吗？')) {
                                deleteSession(session.id);
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--neon-magenta)',
                              padding: '0.25rem',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {new Date(session.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={createNewSession}
              className="btn-sci-fi"
              style={{
                margin: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                border: 'none'
              }}
            >
              <Plus size={16} />
              <span>新对话</span>
            </button>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 主聊天区域 */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', flex: 1 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="neon-text-magenta" style={{ fontFamily: 'var(--font-display)', margin: 0 }}>AI 智能学姐</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>直连通义千问大模型，支持文件上传、深度思考。</p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-sci-fi"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              border: 'none'
            }}
          >
            <History size={16} />
            <span>{showHistory ? '隐藏历史' : '查看历史'}</span>
          </button>
        </header>

        {/* Chat Area */}
        <div 
          ref={messagesContainerRef}
          className="glass-panel" 
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--neon-magenta) rgba(255, 255, 255, 0.1)'
          }}
        >
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              {/* 深度思考内容 */}
              {msg.thoughts && msg.thoughts.trim() && (
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 0, 0.05)',
                  border: '1px solid rgba(255, 255, 0, 0.3)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 0, 0.9)'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Brain size={14} />
                    <span>思考过程</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{msg.thoughts}</div>
                </div>
              )}

              {/* 主消息内容 */}
              <div style={{
                background: msg.role === 'user' ? 'rgba(0, 243, 255, 0.1)' : 'rgba(255, 0, 234, 0.1)',
                border: `1px solid ${msg.role === 'user' ? 'var(--neon-cyan)' : 'var(--neon-magenta)'}`,
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                borderBottomRightRadius: msg.role === 'user' ? '0' : '12px',
                borderBottomLeftRadius: msg.role === 'ai' ? '0' : '12px',
                color: 'var(--text-main)',
                lineHeight: 1.6,
                fontSize: '0.95rem',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                maxWidth: '100%'
              }}>
                {msg.role === 'ai' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      p: ({ children }) => (
                        <p style={{ margin: '0.5rem 0', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {children}
                        </p>
                      ),
                      a: ({ href, children }) => (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            color: 'var(--neon-cyan)',
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word',
                            display: 'inline',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {children}
                        </a>
                      ),
                      ul: ({ children }) => (
                        <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li style={{ marginBottom: '0.25rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                          {children}
                        </li>
                      ),
                      img: ({ src, alt }) => (
                        <div style={{ margin: '0.5rem 0', textAlign: 'center' }}>
                          <img 
                            src={src} 
                            alt={alt || 'AI生成的图片'}
                            onClick={() => src && setImageModal({ src, zoom: 1 })}
                            style={{ 
                              maxWidth: '300px',
                              maxHeight: '300px',
                              width: 'auto',
                              height: 'auto',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease',
                              objectFit: 'contain'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          />
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            点击图片查看大图
                          </div>
                        </div>
                      ),
                      code: ({ inline, children }: any) => {
                        if (inline) {
                          return <code style={{ 
                            background: 'rgba(0, 0, 0, 0.3)', 
                            padding: '0.2em 0.4em', 
                            borderRadius: '4px', 
                            fontSize: '0.9em',
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word'
                          }}>{children}</code>;
                        }
                        return (
                          <pre style={{ 
                            background: 'rgba(0, 0, 0, 0.5)', 
                            padding: '1rem', 
                            borderRadius: '8px',
                            overflowX: 'auto',
                            margin: '0.5rem 0',
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}>
                            <code style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{children}</code>
                          </pre>
                        );
                      }
                    }}
                  >
                    {msg.text || (isLoading && msg.id === messages[messages.length - 1]?.id ? '▌' : '')}
                  </ReactMarkdown>
                ) : (
                  <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{msg.text}</div>
                )}

                {/* 用户上传图片预览 */}
                {msg.images && msg.images.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                    {msg.images.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img} 
                        alt={`上传的图片 ${idx + 1}`}
                        style={{ 
                          maxWidth: '200px', 
                          maxHeight: '200px',
                          borderRadius: '8px',
                          border: '1px solid var(--neon-cyan)'
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* 用户上传文件列表 */}
                {msg.files && msg.files.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                    {msg.files.map((file, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-muted)'
                      }}>
                        <FileText size={14} />
                        <span>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 已上传文件预览 */}
        <AnimatePresence>
          {uploadedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                padding: '0 0.5rem'
              }}
            >
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    padding: '0.5rem',
                    background: 'rgba(0, 243, 255, 0.1)',
                    border: '1px solid var(--neon-cyan)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    maxWidth: '200px'
                  }}
                >
                  {file.type === 'image' ? <ImageIcon size={16} /> : <FileText size={16} />}
                  <span style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.file.name}
                  </span>
                  {!isLoading && (
                    <button
                      onClick={() => removeFile(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--neon-magenta)',
                        cursor: 'pointer',
                        padding: '0'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <form onSubmit={handleSend} style={{ position: 'relative' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "AI思考中..." : "输入您的问题..."} 
            className="input-sci-fi" 
            style={{ 
              width: '100%',
              paddingRight: '3.5rem',
              paddingBottom: '3rem'
            }}
            disabled={isLoading}
          />
          
          {/* 左下角按钮组 */}
          <div style={{
            position: 'absolute',
            bottom: '0.5rem',
            left: '0.5rem',
            display: 'flex',
            gap: '0.5rem'
          }}>
            {/* 深度思考按钮 */}
            <button
              type="button"
              onClick={() => !isLoading && setEnableThinking(!enableThinking)}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                background: enableThinking ? 'rgba(255, 255, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${enableThinking ? 'rgba(255, 255, 0, 0.6)' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '20px',
                color: enableThinking ? 'rgba(255, 255, 0, 0.9)' : 'var(--text-muted)',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.3s ease',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              <Brain size={14} />
              <span>深度思考</span>
            </button>

            {/* 上传文件按钮 */}
            <button
              type="button"
              onClick={() => !isLoading && fileInputRef.current?.click()}
              disabled={isLoading}
              className="btn-sci-fi"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                border: 'none',
                opacity: isLoading ? 0.5 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              <Upload size={14} />
              <span>上传</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.md"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={isLoading}
            />
          </div>

          {/* 发送按钮 */}
          <button 
            type="submit" 
            className="btn-sci-fi" 
            style={{ 
              position: 'absolute', 
              right: '0.5rem', 
              bottom: '0.5rem',
              border: 'none', 
              background: 'transparent',
              padding: '0.5rem',
              opacity: isLoading || (!input.trim() && uploadedFiles.length === 0) ? 0.5 : 1,
              cursor: isLoading || (!input.trim() && uploadedFiles.length === 0) ? 'not-allowed' : 'pointer'
            }}
            disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
          >
            <Send size={20} />
          </button>
        </form>
      </div>

      {/* 图片查看器模态框 */}
      <AnimatePresence>
        {imageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImageModal(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }}
          >
            {/* 控制按钮 */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem',
                zIndex: 10000
              }}
            >
              <button
                onClick={() => setImageModal(prev => prev ? { ...prev, zoom: Math.min(prev.zoom + 0.2, 3) } : null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--neon-cyan)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--neon-cyan)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={() => setImageModal(prev => prev ? { ...prev, zoom: Math.max(prev.zoom - 0.2, 0.5) } : null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--neon-cyan)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--neon-cyan)',
                  transition: 'all 0.2s ease'
                }}
              >
                <ZoomOut size={20} />
              </button>
              <button
                onClick={() => setImageModal(prev => prev ? { ...prev, zoom: 1 } : null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid var(--neon-magenta)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--neon-magenta)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                重置
              </button>
              <button
                onClick={() => setImageModal(null)}
                style={{
                  background: 'rgba(255, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 0, 0, 0.6)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ff4444',
                  transition: 'all 0.2s ease'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* 图片显示 */}
            <motion.img
              src={imageModal.src}
              alt="大图查看"
              onClick={(e) => e.stopPropagation()}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.1}
              whileDrag={{ cursor: 'grabbing', scale: imageModal.zoom * 1.05 }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: imageModal.zoom,
                opacity: 1 
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 0 40px rgba(0, 243, 255, 0.3)',
                cursor: 'grab'
              }}
            />

            {/* 缩放比例提示 */}
            <div
              style={{
                position: 'absolute',
                bottom: '2rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                color: 'var(--neon-cyan)',
                fontSize: '0.875rem',
                border: '1px solid var(--neon-cyan)'
              }}
            >
              {Math.round(imageModal.zoom * 100)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
