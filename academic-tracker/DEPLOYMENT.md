# EdgeOne Pages 部署指南

## 前置要求

1. 拥有腾讯云账号并开通 EdgeOne Pages 服务
2. 已安装 Node.js 和 npm

## 部署步骤

### 方法一：通过 EdgeOne Pages 控制台部署（推荐）

1. **准备项目**
   - 确保项目已经构建成功：`npm run build`
   - 构建产物位于 `dist` 目录

2. **登录 EdgeOne Pages 控制台**
   - 访问：https://console.cloud.tencent.com/edgeone/pages
   - 创建新项目

3. **配置项目**
   - 选择 "手动上传" 或连接 Git 仓库
   - 如果使用 Git：
     - 连接你的 GitHub/GitLab 仓库
     - 设置构建命令：`npm run build`
     - 设置输出目录：`dist`
     - 设置安装命令：`npm install`

4. **配置环境变量**
   在 EdgeOne Pages 控制台中添加以下环境变量：
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```
   ⚠️ **重要**：请务必更改为强随机字符串！

5. **配置 KV 数据库**
   - 在 EdgeOne Pages 中创建 KV 命名空间
   - 绑定到函数，名称为 `ACADEMIC_KV`

6. **部署**
   - 点击部署按钮
   - 等待部署完成
   - 获取访问 URL

### 方法二：使用 EdgeOne CLI（如果可用）

```bash
# 安装 EdgeOne CLI
npm install -g @edgeone/cli

# 登录
edgeone login

# 部署
edgeone pages deploy --project-name academic-tracker
```

### 方法三：通过 API 部署

可以使用 EdgeOne Pages API 进行自动化部署。

## 生产环境配置清单

- [ ] 更改 JWT_SECRET 为强随机密钥
- [ ] 配置 KV 数据库绑定（ACADEMIC_KV）
- [ ] 启用 HTTPS
- [ ] 配置自定义域名（可选）
- [ ] 设置 CORS 策略
- [ ] 配置错误页面
- [ ] 启用日志和监控

## 验证部署

1. 访问部署后的 URL
2. 测试注册功能
3. 测试登录功能
4. 验证路由保护是否正常工作
5. 检查浏览器控制台是否有错误

## 常见问题

### Q: 注册/登录失败？
A: 检查：
- KV 数据库是否正确绑定
- 环境变量 JWT_SECRET 是否已设置
- 浏览器控制台是否有错误信息

### Q: 页面刷新后需要重新登录？
A: 这是正常的，因为使用 localStorage 存储 token。如果需要持久化，可以考虑使用 httpOnly cookies。

### Q: 如何更新部署？
A: 
- Git 方式：推送代码到仓库，自动触发部署
- 手动方式：重新构建并上传 dist 目录

## 安全建议

1. **永远不要**将 `.env` 文件提交到版本控制
2. 使用强随机的 JWT_SECRET（至少 32 字符）
3. 定期轮换 JWT_SECRET
4. 启用速率限制防止暴力破解
5. 考虑添加邮箱验证功能
6. 实施密码强度要求
