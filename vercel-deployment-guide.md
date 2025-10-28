# Vercel 部署指南

本指南将帮助您将甜品订单网站部署到 Vercel 平台。

## 准备工作

1. 确保您已创建了 `vercel.json` 配置文件（已为您生成）
2. 确保您已完成 Supabase 的配置（参考 `supabase-setup-guide.md`）
3. 确保您的项目代码已准备就绪

## 部署步骤

### 方法一：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```
   按照提示完成登录过程。

3. **部署项目**
   在项目根目录运行：
   ```bash
   vercel
   ```
   按照提示选择项目名称、团队等信息。

4. **配置环境变量（如需要）**
   如果有额外的环境变量需要配置，可以在 Vercel 控制台中设置，或者在部署时通过命令行提供。

### 方法二：通过 Vercel 官网部署

1. **访问 Vercel 官网**
   打开 [Vercel 官网](https://vercel.com) 并登录您的账户。

2. **导入项目**
   - 点击 "New Project"
   - 选择 "Import Git Repository"
   - 连接您的 Git 仓库（GitHub、GitLab 或 Bitbucket）
   - 选择包含项目代码的仓库

3. **配置项目**
   - 项目名称：可以保持默认或自定义
   - Framework Preset：选择 "HTML"
   - Root Directory：保持默认
   - Build and Output Settings：保持默认（我们已在 vercel.json 中配置）

4. **部署项目**
   点击 "Deploy" 按钮开始部署过程。

## 配置说明

已创建的 `vercel.json` 配置文件包含以下关键设置：

- **构建配置**：将所有 HTML 文件作为静态构建处理
- **路由规则**：直接映射 URL 路径到对应的文件
- **CORS 头信息**：配置了适当的跨域资源共享设置，确保与 Supabase 的 API 通信正常

## 部署后设置

1. **更新 Supabase CORS 配置**
   部署成功后，您需要在 Supabase Dashboard 的 `Settings > API > CORS Configuration` 中添加您的 Vercel 部署域名（例如 `https://your-project.vercel.app`）。

2. **更新配置文件（如需要）**
   如果您需要在生产环境使用不同的 Supabase 配置，可以考虑使用 Vercel 的环境变量功能。

## 自定义域名（可选）

1. 在 Vercel 控制台中，导航到您的项目设置
2. 选择 "Domains"
3. 添加您的自定义域名
4. 按照提示在您的域名注册商处配置 DNS 记录

## 常见问题

### 部署失败
- 检查项目结构是否正确
- 确认所有必要的文件都已包含在仓库中
- 查看部署日志以获取详细错误信息

### CORS 错误
- 确保您已在 Supabase 中配置了正确的 CORS 设置
- 检查 vercel.json 中的 CORS 头信息配置

### Supabase 连接问题
- 验证 `supabase-config.js` 中的 URL 和密钥是否正确
- 确保网络请求可以正常到达 Supabase API

## 额外资源

- [Vercel 文档](https://vercel.com/docs)
- [Supabase 文档](https://supabase.com/docs)

祝您部署顺利！