# 🚀 EdgeOne CLI 部署完整记录

## 部署概述

本次使用 **EdgeOne CLI** 成功将 Academic Tracker 项目部署到 EdgeOne Pages 平台。

## 部署步骤详解

### 第一步：安装 EdgeOne CLI

```bash
npm install -g edgeone
```

✅ **结果**: 成功安装 EdgeOne CLI v1.4.5

### 第二步：验证登录状态

```bash
edgeone login
```

✅ **结果**: 用户已登录，无需重新认证

### 第三步：构建项目

```bash
npm run build
```

✅ **结果**: 构建成功，产物位于 `dist` 目录

### 第四步：执行部署命令

```bash
edgeone pages deploy dist -n academic-tracker -e production -a global
```

**参数说明**:
- `dist`: 部署目录（构建产物）
- `-n academic-tracker`: 项目名称
- `-e production`: 部署到生产环境
- `-a global`: 全球加速区域

### 第五步：等待部署完成

部署过程自动执行以下步骤：
1. ✅ 验证 API 端点
2. ✅ 创建新项目（首次部署）
3. ✅ 上传文件到 EdgeOne COS
4. ✅ 创建生产环境部署
5. ✅ 等待部署完成
6. ✅ 返回部署 URL

## 部署结果

### 成功信息

```
[cli][✔] Deploy Success
[cli][✔] Deployment to EdgeOne Pages completed successfully!
```

### 项目信息

| 项目 | 值 |
|------|-----|
| 项目名称 | academic-tracker |
| 项目 ID | pages-snsmmkaembc7 |
| 部署 ID | hhl3o3lb53 |
| 环境 | Production |
| 区域 | Global |

### 访问 URL

**临时预览 URL**:
```
https://academic-tracker-byabjt8u.edgeone.cool?eo_token=803ad2c84dd83445e797509871502b95&eo_time=1776535169
```

**控制台管理 URL**:
```
https://console.cloud.tencent.com/edgeone/pages/project/pages-snsmmkaembc7/deployment/hhl3o3lb53
```

### 验证结果

```bash
Invoke-WebRequest -Uri "https://academic-tracker-byabjt8u.edgeone.cool?..." -Method Head
```

✅ **HTTP 状态码**: 200 OK  
✅ **网站可访问**: 是

## 后续必要配置

### ⚠️ 重要：必须完成的配置

#### 1. 配置 KV 数据库

项目使用 KV 数据库存储用户数据，需要在控制台配置：

1. 访问项目控制台
2. 找到"函数"或"绑定"设置
3. 创建 KV 命名空间
4. 绑定名称设置为：`ACADEMIC_KV`
5. 保存配置

#### 2. 配置环境变量

添加 JWT_SECRET 环境变量：

1. 生成密钥：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. 在控制台添加环境变量：
   ```
   JWT_SECRET=<复制上面生成的密钥>
   ```

#### 3. 重新部署

配置完成后重新部署：

```bash
edgeone pages deploy dist -n academic-tracker -e production -a global
```

## EdgeOne CLI 常用命令

### 查看帮助

```bash
# 主帮助
edgeone --help

# Pages 相关命令
edgeone pages --help

# 部署命令帮助
edgeone pages deploy --help
```

### 本地开发

```bash
# 初始化项目
edgeone pages init

# 链接项目
edgeone pages link

# 本地开发模式
edgeone pages dev
```

### 部署相关

```bash
# 基本部署
edgeone pages deploy <directory>

# 指定项目名称
edgeone pages deploy dist -n my-project

# 指定环境（production/preview）
edgeone pages deploy dist -e preview

# 指定区域（global/overseas）
edgeone pages deploy dist -a overseas

# 使用 API Token（CI/CD 场景）
edgeone pages deploy dist -t YOUR_API_TOKEN
```

### 环境管理

```bash
# 查看环境变量脚本
edgeone pages env

# 切换用户
edgeone switch

# 查看版本
edgeone --version
```

## 部署优势

使用 EdgeOne CLI 部署的优势：

1. ✅ **快速部署**: 一条命令完成部署
2. ✅ **自动化**: 自动创建项目、上传文件、触发部署
3. ✅ **版本控制**: 可以轻松回滚到历史版本
4. ✅ **CI/CD 友好**: 支持 API Token，适合自动化流程
5. ✅ **实时反馈**: 部署进度实时显示
6. ✅ **多环境支持**: 支持 production 和 preview 环境

## 故障排除

### 问题 1: 部署失败 - 权限错误

**症状**: 401 Unauthorized

**解决**:
```bash
# 重新登录
edgeone login

# 或使用 API Token
edgeone pages deploy dist -t YOUR_TOKEN
```

### 问题 2: 项目已存在

**症状**: Project already exists

**解决**:
- CLI 会自动更新现有项目
- 如需创建新项目，使用不同的项目名称

### 问题 3: 部署后无法访问

**可能原因**:
1. KV 数据库未配置
2. 环境变量未设置
3. 部署尚未完成

**解决**:
1. 检查控制台部署状态
2. 配置必要的 KV 和环境变量
3. 等待部署完全完成

### 问题 4: 刷新页面 404

**原因**: SPA 路由需要重写规则

**解决**:
在 EdgeOne Pages 控制台配置 URL 重写规则，将所有路径重定向到 index.html

## 性能指标

### 部署时间

- **总耗时**: ~30-60 秒
- **上传时间**: ~5-10 秒
- **部署时间**: ~20-40 秒

### 文件大小

- **dist 目录**: ~716 KB (压缩后 ~221 KB)
- **主要文件**:
  - index.html: 0.46 KB
  - CSS: 1.89 KB
  - JavaScript: 716.25 KB

### 访问速度

- **全球边缘节点**: 3200+ 节点
- **预期延迟**: <50ms
- **HTTPS**: 默认启用

## 最佳实践

### 1. 部署前检查清单

- [ ] 代码已提交到 Git
- [ ] 本地构建成功
- [ ] 测试所有功能正常
- [ ] 准备好 KV 数据库
- [ ] 生成 JWT_SECRET

### 2. 部署命令模板

```bash
# 生产环境部署
edgeone pages deploy dist -n <project-name> -e production -a global

# 预览环境部署（测试用）
edgeone pages deploy dist -n <project-name> -e preview -a global
```

### 3. 自动化部署脚本

创建 `deploy.sh` (Linux/Mac) 或 `deploy.ps1` (Windows):

```bash
#!/bin/bash
# deploy.sh

echo "Building project..."
npm run build

echo "Deploying to EdgeOne Pages..."
edgeone pages deploy dist -n academic-tracker -e production -a global

echo "Deployment complete!"
```

### 4. 版本管理

每次部署都会在控制台创建新的部署记录，可以：
- 查看历史部署
- 回滚到任意版本
- 比较不同版本的差异

## 安全建议

1. **保护 API Token**
   - 不要在代码中硬编码 Token
   - 使用环境变量或密钥管理服务
   - 定期轮换 Token

2. **JWT_SECRET 管理**
   - 使用强随机密钥（至少 32 位）
   - 不要提交到版本控制
   - 定期更换

3. **访问控制**
   - 限制控制台访问权限
   - 启用双因素认证
   - 审计日志定期检查

## 监控和维护

### 监控指标

在 EdgeOne Pages 控制台可以监控：
- 访问量统计
- 带宽使用
- 错误率
- 响应时间

### 日志查看

1. 访问项目控制台
2. 选择部署记录
3. 查看部署日志
4. 查看函数执行日志（如果有）

### 定期维护

- [ ] 检查部署状态
- [ ] 查看错误日志
- [ ] 更新依赖包
- [ ] 轮换密钥
- [ ] 备份 KV 数据

## 总结

✅ **部署成功**: 项目已成功部署到 EdgeOne Pages  
✅ **可访问**: 网站可以通过 URL 访问  
✅ **CLI 工具**: EdgeOne CLI v1.4.5 工作正常  
✅ **自动化**: 部署过程完全自动化  

### 下一步

1. ⚠️ **立即配置 KV 数据库**
2. ⚠️ **立即配置 JWT_SECRET 环境变量**
3. 🔄 **重新部署使配置生效**
4. 🧪 **测试注册和登录功能**
5. 🌐 **配置自定义域名（可选）**

---

**部署完成时间**: 2026-04-19  
**部署工具**: EdgeOne CLI v1.4.5  
**部署方式**: 命令行直接部署  
**文档作者**: AI Assistant  

🎉 **恭喜！你的项目已成功部署！**
