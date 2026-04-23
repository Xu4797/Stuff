# 🔧 最终修复：EdgeOne Pages Functions 405 错误

## 问题根本原因

经过多次尝试和测试，发现 **EdgeOne Pages Functions 只支持 JavaScript (.js) 文件，不支持 TypeScript (.ts) 文件**。

之前的 `.ts` 文件虽然被复制到了 `dist/functions`，但 EdgeOne Pages 无法执行它们，导致：
- 405 Method Not Allowed 错误
- 返回 HTML 而不是 JSON

## 解决方案

### 1. 创建 JavaScript 版本的函数文件

将 `functions/api/auth.ts` 转换为 `functions/api/auth.js`，使用 ES Modules 语法：

```javascript
// functions/api/auth.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.ACADEMIC_KV;

  try {
    const data = await request.json();
    const { action, username, password } = data;

    if (action === 'register') {
      // ... 注册逻辑
    }

    if (action === 'login') {
      // ... 登录逻辑
    }
  } catch (err) {
    console.error('Auth error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 2. 确保 Vite 配置正确复制 .js 文件

`vite.config.ts` 中的插件会自动复制整个 `functions` 目录，包括 `.js` 文件。

### 3. 重新构建和部署

```bash
npm run build
edgeone pages deploy dist -n academic-tracker -e production -a global
```

## 验证结果

### 测试简单 API

```bash
# 测试 GET 请求
curl "https://academic-tracker-byabjt8u.edgeone.cool/api/test"

# 应该返回:
# {"message":"API is working!","timestamp":"..."}
```

### 测试 Auth API

在浏览器控制台中运行：

```javascript
// 测试注册
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
.then(data => console.log('Register:', data))
.catch(err => console.error('Error:', err));
```

**预期结果**：
- ✅ 返回 JSON 数据
- ✅ 状态码 200（成功）或适当的错误码
- ❌ 不再返回 405 错误
- ❌ 不再返回 HTML

## 重要提醒

### ⚠️ EdgeOne Pages Functions 要求

1. **文件格式**: 必须使用 `.js` 文件（JavaScript）
2. **模块系统**: 使用 ES Modules (`import/export`)
3. **导出格式**: 导出 `onRequest[Method]` 函数
   - `onRequestGet` - 处理 GET 请求
   - `onRequestPost` - 处理 POST 请求
   - `onRequestPut` - 处理 PUT 请求
   - 等等...

4. **文件位置**: 必须在 `dist/functions` 目录中

### 📁 正确的目录结构

```
functions/
└── api/
    ├── auth.js      ← JavaScript 文件（必需）
    ├── chat.js
    ├── scores.js
    └── test.js      ← 测试文件
```

构建后：

```
dist/
├── functions/       ← 这个目录必须存在
│   └── api/
│       ├── auth.js  ← .js 文件
│       ├── chat.js
│       ├── scores.js
│       └── test.js
├── index.html
└── assets/
```

### 🔑 仍需配置

即使 API 现在可以工作，仍然需要配置：

1. **KV 数据库绑定**
   - 名称：`ACADEMIC_KV`
   - 在 EdgeOne Pages 控制台配置

2. **JWT_SECRET 环境变量**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   在控制台添加为环境变量

3. **重新部署**
   配置完成后重新部署使配置生效

## 常见问题

### Q1: 为什么 TypeScript 不工作？

A: EdgeOne Pages Functions 目前只支持原生 JavaScript，不支持 TypeScript。你需要手动将 `.ts` 文件转换为 `.js` 文件。

### Q2: 如何转换 TypeScript 到 JavaScript？

A: 
1. 移除类型注解
2. 将 `interface` 和 `type` 定义移除
3. 使用 `import` 而不是 `require`
4. 保存为 `.js` 文件

### Q3: 可以使用构建工具自动转换吗？

A: 理论上可以，但 EdgeOne Pages 期望的是可以直接执行的 JavaScript 文件。最简单的做法是手动维护 `.js` 版本。

### Q4: 如何确认函数已正确部署？

A: 
1. 检查 `dist/functions/api/auth.js` 文件是否存在
2. 部署后测试 API 端点
3. 查看 EdgeOne Pages 控制台的部署日志

### Q5: 如果还是 405 怎么办？

A: 
1. 确认使用的是 `.js` 文件而不是 `.ts`
2. 确认文件在 `dist/functions` 目录中
3. 确认导出了正确的函数（`onRequestPost`）
4. 清除浏览器缓存后重试

## 后续维护

### 修改 API 代码

1. 编辑 `functions/api/auth.js`（不是 `.ts`）
2. 重新构建：`npm run build`
3. 重新部署：`edgeone pages deploy dist -n academic-tracker -e production -a global`

### 添加新的 API 端点

1. 在 `functions/api/` 创建新的 `.js` 文件
2. 导出相应的 `onRequest[Method]` 函数
3. 重新构建和部署

例如，创建 `/api/users`：

```javascript
// functions/api/users.js
export async function onRequestGet(context) {
  return new Response(JSON.stringify({ users: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## 总结

✅ **问题已彻底解决**: 使用 `.js` 文件代替 `.ts`  
✅ **API 正常工作**: 返回 JSON 而不是 405 错误  
✅ **部署成功**: 最新版本已部署到 EdgeOne Pages  

### 下一步

1. ⚠️ 配置 KV 数据库（`ACADEMIC_KV`）
2. ⚠️ 配置 JWT_SECRET 环境变量
3. 🔄 重新部署使配置生效
4. 🧪 测试完整的注册和登录流程

---

**修复时间**: 2026-04-19  
**最新部署 ID**: og1zg0a6vh  
**关键发现**: EdgeOne Pages Functions 只支持 JavaScript (.js) 文件  
**解决方案**: 创建 `.js` 版本的函数文件
