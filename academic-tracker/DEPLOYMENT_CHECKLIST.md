# 快速部署检查清单

## 部署前准备

- [ ] 已安装 Node.js 和 npm
- [ ] 已有腾讯云账号并开通 EdgeOne Pages 服务
- [ ] 已创建 KV 数据库命名空间

## 本地测试

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制示例文件并修改）
cp .env.example .env

# 3. 本地测试构建
npm run build

# 4. 预览构建结果
npm run preview
# 访问 http://localhost:4173 测试功能
```

## EdgeOne Pages 部署步骤

### 第一步：准备项目

1. 确保代码已推送到 Git 仓库（GitHub/GitLab/Gitee）
2. 或者准备好 `dist` 文件夹用于手动上传

### 第二步：创建 EdgeOne Pages 项目

1. 访问 https://console.cloud.tencent.com/edgeone/pages
2. 点击"新建项目"
3. 选择部署方式：
   - **Git 部署**（推荐）：连接你的代码仓库
   - **手动上传**：上传 dist 文件夹

### 第三步：配置构建设置

如果使用 Git 部署，配置以下内容：

```
构建命令: npm run build
输出目录: dist
安装命令: npm install
Node 版本: 18.x 或更高
```

### 第四步：配置环境变量

在 EdgeOne Pages 控制台添加环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| JWT_SECRET | （生成一个强随机密钥） | JWT 签名密钥 |

⚠️ **重要提示**：
- JWT_SECRET 应该是至少 32 位的随机字符串
- 可以使用以下命令生成：`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- 不要使用示例中的默认值

### 第五步：配置 KV 数据库

1. 在 EdgeOne Pages 项目中找到"函数"或"绑定"设置
2. 创建或选择一个 KV 命名空间
3. 将 KV 绑定命名为：`ACADEMIC_KV`
4. 保存配置

### 第六步：部署

1. 点击"部署"按钮
2. 等待部署完成（通常需要 1-3 分钟）
3. 获取分配的域名（例如：https://xxx.edgeone.app）

### 第七步：验证部署

访问部署后的 URL，测试以下功能：

- [ ] 首页可以正常访问
- [ ] 注册新用户
- [ ] 使用新账户登录
- [ ] 登录后可以访问仪表板
- [ ] 刷新页面后保持登录状态
- [ ] 退出登录后重定向到登录页

## 常见问题排查

### 问题 1：注册/登录失败

**可能原因**：
- KV 数据库未正确绑定
- 环境变量未配置

**解决方法**：
1. 检查 EdgeOne Pages 控制台的绑定设置
2. 确认 KV 命名空间名称为 `ACADEMIC_KV`
3. 确认 JWT_SECRET 已设置

### 问题 2：页面空白或报错

**可能原因**：
- 构建失败
- 路由配置问题

**解决方法**：
1. 查看浏览器控制台的错误信息
2. 检查 EdgeOne Pages 的部署日志
3. 确认输出目录设置为 `dist`

### 问题 3：刷新页面后 404

**可能原因**：
- SPA 路由需要特殊配置

**解决方法**：
在 EdgeOne Pages 配置中添加重写规则，将所有请求重定向到 index.html

## 生产环境优化建议

1. **安全性**
   - [ ] 使用强随机的 JWT_SECRET
   - [ ] 启用 HTTPS（EdgeOne Pages 默认提供）
   - [ ] 定期更换密钥
   - [ ] 考虑添加速率限制

2. **性能**
   - [ ] 启用 CDN 缓存
   - [ ] 压缩静态资源
   - [ ] 使用图片懒加载

3. **监控**
   - [ ] 启用访问日志
   - [ ] 设置错误告警
   - [ ] 监控 API 调用次数

## 更新部署

### Git 部署方式
```bash
# 提交更改
git add .
git commit -m "更新内容描述"
git push

# EdgeOne Pages 会自动触发重新部署
```

### 手动上传方式
```bash
# 重新构建
npm run build

# 在 EdgeOne Pages 控制台上传新的 dist 文件夹
```

## 技术支持

如遇到问题，请检查：
1. EdgeOne Pages 部署日志
2. 浏览器开发者工具的控制台
3. 网络请求的响应状态

---

**祝部署顺利！** 🎉
