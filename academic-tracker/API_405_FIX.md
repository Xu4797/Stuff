# 🔧 API 405 错误修复记录

## 问题描述

部署后访问 API 时出现以下错误：

```
Unexpected token '<', "<?xml vers"... is not valid JSON
POST https://academic-tracker-byabjt8u.edgeone.cool/api/auth 405 (Method Not Allowed)
```

## 问题原因

EdgeOne Pages 的 Functions 需要满足以下条件才能正常工作：

1. ✅ Functions 文件必须位于 `dist/functions` 目录中
2. ✅ 需要使用正确的文件命名和导出格式
3. ✅ 需要在 edgeone.json 中配置 functions 路由

**根本原因**：之前的构建没有将 `functions` 目录复制到 `dist` 目录，导致 EdgeOne Pages 找不到 API 函数。

## 解决方案

### 1. 更新 Vite 配置

在 `vite.config.ts` 中添加自定义插件，在构建完成后自动复制 functions 目录：

```typescript
import fs from 'fs'
import path from 'path'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      {
        name: 'copy-functions',
        closeBundle() {
          const srcDir = path.resolve(__dirname, 'functions');
          const destDir = path.resolve(__dirname, 'dist/functions');
          
          if (fs.existsSync(srcDir)) {
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            copyFolderRecursiveSync(srcDir, destDir);
            console.log('✅ Functions copied to dist/functions');
          }
        }
      }
    ],
    // ... 其他配置
  };
});
```

### 2. 创建 edgeone.json 配置文件

在项目根目录创建 `edgeone.json`：

```json
{
  "pages": {
    "functions": {
      "include": ["functions/**/*"]
    }
  }
}
```

### 3. 重新构建和部署

```bash
# 重新构建（会自动复制 functions）
npm run build

# 重新部署
edgeone pages deploy dist -n academic-tracker -e production -a global
```

## 验证结果

### 构建输出

```
✅ Functions copied to dist/functions
```

### 部署信息

- **新部署 ID**: `4z030ptapd`
- **项目 ID**: `pages-snsmmkaembc7`
- **状态**: ✅ Deploy Success

### 访问 URL

```
https://academic-tracker-byabjt8u.edgeone.cool
```

## 测试 API

部署完成后，测试注册和登录功能：

### 测试注册

```javascript
fetch('https://academic-tracker-byabjt8u.edgeone.cool/api/auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'register',
    username: 'testuser',
    password: 'testpass123'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### 测试登录

```javascript
fetch('https://academic-tracker-byabjt8u.edgeone.cool/api/auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'login',
    username: 'testuser',
    password: 'testpass123'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## 重要提醒

### ⚠️ 仍然需要配置

1. **KV 数据库绑定**
   - 名称必须是：`ACADEMIC_KV`
   - 在 EdgeOne Pages 控制台配置

2. **JWT_SECRET 环境变量**
   - 生成密钥：
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - 在控制台添加环境变量

3. **重新部署**
   - 配置完 KV 和环境变量后，需要重新部署

### 📝 后续更新部署

每次修改代码后：

```bash
# 1. 修改代码

# 2. 重新构建（会自动复制 functions）
npm run build

# 3. 重新部署
edgeone pages deploy dist -n academic-tracker -e production -a global
```

## 技术细节

### EdgeOne Pages Functions 工作原理

1. **文件位置**: Functions 必须位于 `dist/functions` 目录
2. **文件命名**: 使用 `[method].ts` 或 `index.ts` 格式
3. **导出格式**: 导出 `onRequest[Method]` 函数
4. **路由映射**: `/api/auth` → `dist/functions/api/auth.ts`

### 我们的函数结构

```
functions/
└── api/
    ├── auth.ts      → /api/auth (POST)
    ├── chat.ts      → /api/chat
    └── scores.ts    → /api/scores
```

构建后：

```
dist/
├── functions/       ← 这个目录必须存在
│   └── api/
│       ├── auth.ts
│       ├── chat.ts
│       └── scores.ts
├── index.html
└── assets/
```

## 常见问题

### Q1: 为什么之前会返回 405？

A: 因为 `dist/functions` 目录不存在，EdgeOne Pages 找不到对应的函数处理请求，返回默认的 405 错误。

### Q2: 如何确认 functions 已正确复制？

A: 检查 `dist/functions/api/auth.ts` 文件是否存在：
```bash
Test-Path dist/functions/api/auth.ts
```

### Q3: 如果还是 405 怎么办？

A: 检查以下几点：
1. 确认 `dist/functions` 目录存在且包含所有 .ts 文件
2. 确认函数导出格式正确（`export async function onRequestPost`）
3. 查看 EdgeOne Pages 控制台的部署日志
4. 清除浏览器缓存后重试

### Q4: 本地开发时如何测试 API？

A: 使用 Vite 开发服务器，它会自动代理 API 请求：
```bash
npm run dev
# 访问 http://localhost:3000
# API 请求会自动转发到 /api/auth
```

## 总结

✅ **问题已修复**: Functions 目录现在会正确复制到 dist  
✅ **重新部署**: 新版本已部署到 EdgeOne Pages  
✅ **下一步**: 配置 KV 数据库和 JWT_SECRET 环境变量  

---

**修复时间**: 2026-04-19  
**新部署 ID**: 4z030ptapd  
**修复方法**: 添加 Vite 插件自动复制 functions 目录
