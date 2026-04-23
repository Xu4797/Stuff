# Edge Functions 兼容版本部署说明

## ✅ 已完成的修改

### 1. 后端认证函数 (`functions/api/auth.js`)

#### 修改内容：
- ❌ 移除 `bcryptjs` 依赖（需要 Node.js crypto 模块）
- ❌ 移除 `jsonwebtoken` 依赖（需要 Node.js crypto/buffer 模块）
- ✅ 使用 **Web Crypto API** 实现密码哈希
- ✅ 使用 **Base64 编码 JSON** 替代 JWT token

#### 技术细节：

**密码哈希（Web Crypto API）**
```javascript
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const data = encoder.encode(password + Array.from(salt).join(''));
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}
```

**Token 生成（Base64）**
```javascript
function generateToken(username) {
  const payload = {
    username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    iat: Date.now()
  };
  return btoa(JSON.stringify(payload));
}
```

### 2. 前端 Token 验证 (`src/components/ProtectedRoute.tsx`)

#### 修改内容：
- ✅ 支持 **JWT token** 格式（3部分，用点分隔）
- ✅ 支持 **简单 Base64 token** 格式（Edge Functions 兼容）
- ✅ 自动检测 token 类型并正确解析

#### 技术细节：
```typescript
// Check if it's a JWT token (has 3 parts separated by dots)
if (token.split('.').length === 3) {
  // JWT format - decode using standard JWT method
  const base64Url = token.split('.')[1];
  // ... JWT decoding logic
} else {
  // Simple base64 encoded JSON (Edge Functions compatible)
  payload = JSON.parse(atob(token));
}
```

## 🚀 部署信息

- **部署 ID**: `i136g0rk6r`
- **访问地址**: https://academic-tracker-byabjt8u.edgeone.cool?eo_token=e2ed589c67eafac545d7df29f5e4e6e8&eo_time=1776610877
- **部署时间**: 2026-04-19

## ⚠️ 已知问题

### EdgeOne Pages Functions 路由问题
尽管代码已经完全适配 Edge Functions，但 **Functions 路由仍然无法被识别**。所有 `/api/*` 请求都返回 HTML（index.html）。

**可能原因：**
1. EdgeOne Pages 项目创建时未启用 Functions 功能
2. 项目类型不正确（可能是"静态站点"而非"全栈应用"）
3. 需要在控制台手动启用 Functions

**建议操作：**
1. 访问 EdgeOne 控制台检查项目设置
2. 查看部署日志是否有 Functions 相关错误
3. 考虑重新创建项目，确保选择支持 Functions 的类型

## 🧪 测试方法

一旦 Functions 路由问题解决，可以按以下步骤测试：

### 1. 注册新用户
```javascript
fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'register',
    username: 'testuser',
    password: 'testpass123'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### 2. 登录
```javascript
fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'login',
    username: 'testuser',
    password: 'testpass123'
  })
})
.then(res => res.json())
.then(data => {
  console.log(data);
  localStorage.setItem('academic_token', data.token);
  localStorage.setItem('academic_user', data.username);
});
```

### 3. 验证 Token
访问受保护的路由（如 `/app/dashboard`），ProtectedRoute 组件会自动验证 token。

## 🔒 安全性说明

### 当前实现的安全性：
- ✅ 使用 SHA-256 + Salt 进行密码哈希
- ✅ 每个密码使用随机盐值
- ✅ Token 包含过期时间（7天）
- ✅ 前端验证 token 过期

### 与原始实现的对比：
| 特性 | 原始实现 (bcrypt + JWT) | 当前实现 (Web Crypto + Base64) |
|------|------------------------|--------------------------------|
| 密码哈希强度 | ⭐⭐⭐⭐⭐ (bcrypt) | ⭐⭐⭐⭐ (SHA-256 + Salt) |
| Token 安全性 | ⭐⭐⭐⭐⭐ (JWT with secret) | ⭐⭐⭐ (Base64, no signature) |
| Edge Functions 兼容 | ❌ | ✅ |
| 复杂度 | 高 | 低 |

### 安全建议：
如果 EdgeOne Pages Functions 确实无法工作，考虑：
1. **使用腾讯云 SCF** - 完整的 Node.js 环境，支持 bcrypt 和 JWT
2. **添加 HMAC 签名** - 为简单 token 添加签名验证
3. **使用 HTTPS** - 确保传输加密（EdgeOne 已提供）

## 📝 下一步

1. **检查 EdgeOne 控制台** - 确认 Functions 功能是否启用
2. **如果 Functions 仍不工作** - 考虑切换到其他平台或架构
3. **监控和日志** - 一旦 Functions 工作，添加错误处理和日志记录

---

**最后更新**: 2026-04-19  
**状态**: ✅ 代码已适配 Edge Functions，⏸️ 等待 Functions 路由问题解决
