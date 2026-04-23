# 📝 EdgeOne CLI 快速参考

## 一键部署命令

```bash
# 构建并部署（会自动复制 functions 目录）
npm run build && edgeone pages deploy dist -n academic-tracker -e production -a global
```

⚠️ **重要**: `npm run build` 会自动将 `functions` 目录复制到 `dist/functions`，这是 API 正常工作所必需的！

## 常用命令速查

### 登录认证
```bash
edgeone login          # 登录
edgeone switch         # 切换用户
```

### 本地开发
```bash
edgeone pages init     # 初始化项目
edgeone pages link     # 链接到远程项目
edgeone pages dev      # 本地开发模式
```

### 部署
```bash
# 基本部署
edgeone pages deploy dist

# 完整参数
edgeone pages deploy dist -n academic-tracker -e production -a global

# 预览环境
edgeone pages deploy dist -n academic-tracker -e preview

# 使用 API Token（CI/CD）
edgeone pages deploy dist -t YOUR_API_TOKEN
```

### 其他
```bash
edgeone --version      # 查看版本
edgeone pages env      # 查看环境变量
edgeone pages --help   # 查看帮助
```

## 参数说明

| 参数 | 简写 | 说明 | 可选值 |
|------|------|------|--------|
| --name | -n | 项目名称 | 任意字符串 |
| --env | -e | 部署环境 | production, preview |
| --area | -a | 加速区域 | global, overseas |
| --token | -t | API Token | 字符串 |

## 典型工作流

### 首次部署
```bash
# 1. 安装 CLI
npm install -g edgeone

# 2. 登录
edgeone login

# 3. 构建
npm run build

# 4. 部署
edgeone pages deploy dist -n academic-tracker -e production -a global
```

### 更新部署
```bash
# 1. 修改代码

# 2. 重新构建
npm run build

# 3. 重新部署（同一命令）
edgeone pages deploy dist -n academic-tracker -e production -a global
```

### CI/CD 自动化
```bash
# 在 GitHub Actions 或其他 CI 工具中使用
edgeone pages deploy dist \
  -n academic-tracker \
  -e production \
  -a global \
  -t $EDGEONE_API_TOKEN
```

## 重要提醒

⚠️ **部署后必须配置**:
1. KV 数据库绑定（名称：`ACADEMIC_KV`）
2. JWT_SECRET 环境变量

🔗 **控制台地址**:
```
https://console.cloud.tencent.com/edgeone/pages/project/pages-snsmmkaembc7
```

🌐 **访问 URL**:
```
https://academic-tracker-byabjt8u.edgeone.cool
```

## 故障排除

| 问题 | 解决方法 |
|------|----------|
| 401 Unauthorized | 运行 `edgeone login` 重新登录 |
| 部署失败 | 检查网络连接和 API Token |
| 页面空白 | 检查 KV 和环境变量配置 |
| 注册/登录失败 | 确认 KV 绑定名为 `ACADEMIC_KV` |

## 更多信息

- 📖 [完整部署记录](./EDGEONE_CLI_DEPLOYMENT_RECORD.md)
- 📋 [部署成功指南](./DEPLOYMENT_SUCCESS.md)
- 🚀 [快速部署指南](./QUICK_DEPLOY.md)

---

**最后更新**: 2026-04-19  
**CLI 版本**: 1.4.5
