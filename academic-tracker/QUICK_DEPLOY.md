# 🚀 立即部署到 EdgeOne Pages

## 快速开始（5 分钟完成部署）

### 第一步：准备环境

确保你已经：
- ✅ Node.js 已安装
- ✅ 项目依赖已安装（运行过 `npm install`）
- ✅ 已有腾讯云账号

### 第二步：生成安全的 JWT 密钥

在命令行运行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制输出的密钥，稍后需要用到。

### 第三步：访问 EdgeOne Pages 控制台

1. 打开浏览器，访问：https://console.cloud.tencent.com/edgeone/pages
2. 登录腾讯云账号
3. 点击"新建项目"

### 第四步：选择部署方式

#### 选项 A：Git 部署（推荐 ⭐）

**优点**：自动部署、版本管理、易于更新

1. 选择"从 Git 仓库导入"
2. 授权并选择你的代码仓库（GitHub/GitLab/Gitee）
3. 配置构建设置：
   ```
   构建命令: npm run build
   输出目录: dist
   安装命令: npm install
   Node 版本: 18.x 或更高
   ```

4. 配置环境变量：
   - 变量名：`JWT_SECRET`
   - 变量值：粘贴第二步生成的密钥

5. 配置 KV 数据库：
   - 如果没有 KV 命名空间，先创建一个
   - 绑定名称：`ACADEMIC_KV`
   - 选择你创建的 KV 命名空间

6. 点击"创建并部署"

#### 选项 B：手动上传

**优点**：简单直接，无需 Git

1. 在本地构建项目：
   ```bash
   npm run build
   ```

2. 在 EdgeOne Pages 控制台选择"手动上传"

3. 压缩 `dist` 文件夹为 ZIP 文件

4. 上传 ZIP 文件

5. 配置环境变量和 KV 绑定（同选项 A 的步骤 4-5）

6. 点击"部署"

### 第五步：等待部署完成

- 通常需要 1-3 分钟
- 可以在控制台查看部署进度
- 部署成功后会显示访问 URL

### 第六步：测试应用

访问分配的 URL（例如：https://xxx.edgeone.app），测试：

1. ✅ 注册一个新账户
2. ✅ 使用新账户登录
3. ✅ 访问仪表板
4. ✅ 刷新页面（应该保持登录状态）
5. ✅ 退出登录

## 🎯 验证清单

部署完成后，请确认：

- [ ] 网站可以正常访问
- [ ] 注册功能正常工作
- [ ] 登录功能正常工作
- [ ] 登录后可以看到仪表板
- [ ] 刷新页面不会退出登录
- [ ] 退出登录功能正常
- [ ] 未登录时访问 /app/dashboard 会跳转到登录页

## ❓ 遇到问题？

### 问题 1：注册/登录失败

**检查项**：
1. KV 数据库是否正确绑定为 `ACADEMIC_KV`
2. JWT_SECRET 环境变量是否已设置
3. 浏览器控制台是否有错误信息

**解决方法**：
- 在 EdgeOne Pages 控制台检查绑定配置
- 确认环境变量已保存
- 查看部署日志

### 问题 2：页面空白

**检查项**：
1. 构建是否成功
2. 输出目录是否正确设置为 `dist`

**解决方法**：
- 查看 EdgeOne Pages 部署日志
- 确认构建命令为 `npm run build`
- 确认输出目录为 `dist`

### 问题 3：刷新页面 404

**原因**：SPA 路由需要特殊配置

**解决方法**：
在 EdgeOne Pages 配置中添加重写规则：
```
将所有路径重写到 /index.html
```

## 🔐 安全提醒

⚠️ **重要**：
1. JWT_SECRET 必须是强随机密钥（至少 32 位）
2. 不要将 .env 文件提交到 Git
3. 定期更换 JWT_SECRET
4. 生产环境不要使用示例中的默认密钥

## 📚 更多文档

- [README.md](./README.md) - 项目介绍
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 详细部署指南
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 部署检查清单
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 项目完善总结

## 🎉 完成！

恭喜！你的 Academic Tracker 应用已成功部署到 EdgeOne Pages！

现在你可以：
- 分享 URL 给用户
- 开始追踪学习成绩
- 使用 AI 学习指导功能

---

**需要帮助？** 查看浏览器控制台的错误信息，或参考详细文档。
