# Academic Tracker - 学业追踪系统

一个基于 React + TypeScript + Vite 构建的现代化学生成绩追踪和预测系统，具有安全的用户认证功能和 AI 辅助学习指导。

## ✨ 功能特性

- 🔐 **安全认证系统**：使用 bcryptjs 密码哈希和 JWT token 认证
- 📊 **成绩追踪**：可视化展示学生考试成绩趋势
- 🤖 **AI 指导**：智能学习建议和预测
- 👤 **用户管理**：完整的注册和登录流程
- 🛡️ **路由保护**：未授权用户无法访问受保护页面
- 🎨 **科幻 UI 设计**：现代化的玻璃态界面设计

## 🚀 快速开始

### 前置要求

- Node.js 16+ 
- npm 或 yarn
- EdgeOne Pages 账号（用于部署）

### 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 JWT_SECRET

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📦 项目结构

```
academic-tracker/
├── functions/api/          # EdgeOne Pages 函数（后端 API）
│   └── auth.ts            # 认证 API（注册/登录）
├── src/
│   ├── components/        # React 组件
│   │   ├── layout/       # 布局组件
│   │   └── ProtectedRoute.tsx  # 路由保护组件
│   ├── pages/            # 页面组件
│   │   ├── AuthPage.tsx  # 登录/注册页面
│   │   ├── Dashboard.tsx # 仪表板
│   │   └── ChatPage.tsx  # AI 聊天页面
│   └── App.tsx           # 主应用组件
├── dist/                 # 构建输出目录
└── edgeone-pages.json    # EdgeOne Pages 配置
```

## 🔒 安全特性

1. **密码哈希**：使用 bcryptjs 进行密码加密存储
2. **JWT Token**：7天有效期的 JSON Web Token
3. **路由保护**：前端路由级别的访问控制
4. **输入验证**：前后端双重验证
5. **环境变量**：敏感信息通过环境变量管理

## 🌐 部署到 EdgeOne Pages

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署步骤

1. **构建项目**
   ```bash
   npm run build
   ```

2. **配置 EdgeOne Pages**
   - 访问 https://console.cloud.tencent.com/edgeone/pages
   - 创建新项目
   - 连接 Git 仓库或手动上传 `dist` 目录

3. **配置环境变量**
   ```
   JWT_SECRET=your-super-secret-key-here
   ```

4. **配置 KV 数据库**
   - 创建 KV 命名空间
   - 绑定为 `ACADEMIC_KV`

5. **部署**
   - 点击部署按钮
   - 获取访问 URL

## ⚙️ 技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite 8
- **路由**：React Router v7
- **UI 动画**：Framer Motion
- **图表**：Recharts
- **图标**：Lucide React
- **样式**：Tailwind CSS + 自定义 CSS
- **认证**：bcryptjs + jsonwebtoken
- **部署平台**：EdgeOne Pages
- **数据存储**：KV Database

## 📝 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| JWT_SECRET | JWT 签名密钥 | `your-secret-key-change-in-production` |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
