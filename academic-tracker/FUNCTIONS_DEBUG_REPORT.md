# EdgeOne Pages Functions 调试报告

## 📋 问题描述
部署到 EdgeOne Pages 后，所有 API 请求（`/api/*`）都返回 HTML（index.html），而不是执行 Functions。浏览器控制台显示：
- `405 (Method Not Allowed)`
- `Unexpected token '<', "<?xml vers"... is not valid JSON`

## 🔍 已尝试的解决方案

### 1. 目录结构验证 ✅
- ✅ `dist/functions/api/*.js` - 正确的文件结构
- ✅ 只包含 `.js` 文件，排除了 `.ts` 文件
- ✅ `_routes.json` 位于 `dist/functions/_routes.json`

### 2. _routes.json 配置 ✅
```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

### 3. 函数签名 ✅
```javascript
export async function onRequestPost({ request }) {
  // 使用全局变量访问 KV
  const kv = ACADEMIC_KV;
  // ...
}
```

### 4. 测试的函数类型
- ✅ 简单的测试函数（无外部依赖）
- ✅ 使用 bcryptjs 和 jsonwebtoken 的完整认证函数
- ❌ 本地开发时发现 bcryptjs 和 jsonwebtoken 需要 Node.js 内置模块（crypto, stream, buffer, util）

### 5. 部署方式
- ✅ 部署 `dist` 目录
- ✅ 部署项目根目录
- ❌ 两种方式都无法识别 Functions

### 6. 配置文件
- ✅ `edgeone.json` 配置了 functions directory
- ✅ Vite 配置自动复制 functions 目录
- ✅ 排除了 `.ts` 文件

## 🚨 根本原因

**EdgeOne Pages 项目在创建时可能没有启用 Functions 功能，或者项目类型不正确。**

经过多次尝试，包括：
- 正确的目录结构
- 正确的路由配置
- 正确的函数签名
- 简单的测试函数（无外部依赖）
- 不同的部署方式

**Functions 始终无法被识别，所有请求都回退到静态文件（index.html）。**

## 💡 关键发现

### 1. Edge Functions 不支持 Node.js 内置模块
本地测试时发现，`bcryptjs` 和 `jsonwebtoken` 等库依赖 Node.js 内置模块（crypto, stream, buffer, util），但 Edge Functions 运行在边缘环境中，不支持这些模块。

**解决方案：**
- 使用 Web Crypto API 替代 crypto 模块
- 实现简单的 token 生成（不使用 JWT）
- 或者使用 KV 数据库存储会话信息

### 2. EdgeOne Pages Functions 可能需要手动启用
根据腾讯云文档，某些功能可能需要在控制台手动启用或配置。

## 🎯 建议的解决方案

### 方案 1：检查 EdgeOne 控制台（强烈推荐）
1. 访问 https://console.cloud.tencent.com/edgeone/pages/project/pages-snsmmkaembc7
2. 检查以下设置：
   - 是否有 "Functions" 或 "边缘函数" 选项需要启用
   - 项目类型是否正确（应该是 "全栈应用" 而不是 "静态站点"）
   - 查看部署日志，确认是否有任何关于 Functions 的错误信息
3. 如果发现问题，修正后重新部署

### 方案 2：重新创建项目
1. 删除当前项目 `academic-tracker`
2. 重新创建一个新的 EdgeOne Pages 项目
3. **确保在创建时选择支持 Functions 的项目类型**
4. 重新部署代码

### 方案 3：修改认证逻辑以适应 Edge Functions
由于 Edge Functions 不支持 Node.js 内置模块，需要修改认证逻辑：

#### 3.1 密码哈希
使用 Web Crypto API 替代 bcryptjs：
```javascript
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

#### 3.2 Token 生成
使用简单的 base64 编码替代 JWT：
```javascript
function generateToken(username) {
  const payload = {
    username,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  return btoa(JSON.stringify(payload));
}
```

#### 3.3 使用 KV 数据库
将用户数据和会话信息存储在 KV 数据库中，而不是内存中。

### 方案 4：使用其他部署平台
如果 EdgeOne Pages Functions 确实无法工作，考虑使用：
- **Vercel** - 完善的 Serverless Functions 支持
- **Cloudflare Pages** - 与 EdgeOne 类似，但更成熟
- **Netlify** - 简单的 Functions 部署
- **腾讯云 SCF + API 网关** - 独立的云函数服务

## 📝 下一步行动

1. **立即执行**：检查 EdgeOne 控制台，确认 Functions 功能是否启用
2. **如果 Functions 未启用**：联系腾讯云技术支持或重新创建项目
3. **如果 Functions 已启用但仍不工作**：提供控制台截图和部署日志，进一步诊断
4. **准备备用方案**：修改认证逻辑以适配 Edge Functions 的限制

## 🔗 相关资源

- EdgeOne Pages 官方文档：https://edgeone.ai/zh/document/162227908259442688
- EdgeOne 控制台：https://console.cloud.tencent.com/edgeone/pages
- Web Crypto API 文档：https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

---

**最后更新**: 2026-04-19
**部署 ID**: 81g5kr3l6b
**状态**: ⏸️ 等待 EdgeOne 控制台检查
