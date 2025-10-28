# Supabase 后端配置指南

本文档将指导您如何配置和使用 Supabase 作为甜点订单系统的后端服务。

## 1. 创建 Supabase 项目

1. 访问 [Supabase 官网](https://supabase.com) 并注册/登录
2. 创建一个新的 Supabase 项目
3. 记住您的项目 URL 和 API 密钥（将在配置文件中使用）

## 2. 创建所需的数据表

在 Supabase Dashboard 中，创建以下数据表：

### users 表
- `id` (主键，自动生成)
- `email` (唯一，文本类型)
- `name` (文本类型)
- `avatar_url` (文本类型，可选)
- `created_at` (时间戳，自动生成)
- `last_login_at` (时间戳，可选)

### designs 表
- `id` (主键，自动生成)
- `user_id` (外键，关联 users.id)
- `name` (文本类型)
- `description` (文本类型，可选)
- `canvas_data` (文本类型，存储 Base64 图像)
- `dessert_type` (文本类型)
- `elements` (文本类型，JSON 格式)
- `image_data` (文本类型，可选)
- `image_position` (文本类型，JSON 格式，可选)
- `image_scale` (数字类型，可选)
- `metadata` (JSONB 类型，可选)
- `created_at` (时间戳，自动生成)
- `updated_at` (时间戳，自动更新)

### orders 表
- `id` (主键，自动生成)
- `user_id` (外键，关联 users.id)
- `product_type` (文本类型)
- `selected_style` (文本类型)
- `flavor_index` (数字类型)
- `custom_text` (文本类型，可选)
- `quantity` (数字类型)
- `selected_packaging` (文本类型)
- `design_image` (文本类型，Base64 图像)
- `total_price` (数字类型)
- `customer_info` (JSONB 类型)
- `status` (文本类型，默认 'pending')
- `created_at` (时间戳，自动生成)
- `updated_at` (时间戳，自动更新)

## 3. 配置项目文件

### 修改 supabase-config.js

打开 `js/supabase-config.js` 文件并填写您的 Supabase 凭据：

```javascript
// Supabase 配置文件
const SUPABASE_CONFIG = {
    // 替换为您的 Supabase 项目 URL
    url: 'https://spxugyajxliackysdjkb.supabase.co',
    
    // 替换为您的 Supabase 匿名访问密钥
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNweHVneWFqeGxpYWNreXNkamtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MDcxNjIsImV4cCI6MjA3NzE4MzE2Mn0.h0xkb3PRuTtxYdetXCu2_V7nhGgATGLIOkxOWi0xjXA',
    
    // 其他配置保持不变
    debug: true,
    // ...
};
```

### 配置 CORS

在 Supabase Dashboard 的 `Settings > API > CORS Configuration` 中，添加您的网站域名（开发环境通常为 `http://localhost:8000`）。

## 4. 功能说明

### 用户认证
- 支持注册、登录、登出功能
- 自动将用户信息保存到 localStorage 以保持会话
- 用户登录时自动同步用户数据到 users 表

### 设计管理
- 设计自动保存到 Supabase 的 designs 表
- 同时支持本地存储作为降级方案
- 提交设计时自动跳转到定制页面

### 订单管理
- 订单自动保存到 Supabase 的 orders 表
- 包含完整的订单信息和客户数据
- 支持订单状态跟踪

## 5. 降级机制

系统内置了降级机制，当 Supabase 服务不可用时：
- 自动切换到 localStorage 存储模式
- 显示适当的用户通知
- 保持核心功能可用

## 6. 调试模式

您可以通过设置 `debug: true` 启用调试日志，查看：
- API 请求和响应
- 错误信息
- 降级模式切换
- 重试尝试

## 7. 常见问题

### 配置后无法连接到 Supabase
- 检查 URL 和 API 密钥是否正确
- 确保 CORS 配置包含您的域名
- 确认网络连接正常

### 数据没有正确保存
- 检查数据表结构是否符合要求
- 验证字段名称是否匹配（注意下划线命名规范）
- 查看浏览器控制台的错误日志

### 降级到本地存储
- 当看到 "使用 localStorage 模式" 的日志时，表示 Supabase 连接失败
- 检查网络连接或 Supabase 项目状态

## 8. 性能优化

- 系统实现了自动重试机制，提高连接稳定性
- 关键数据同时保存到本地，减少请求延迟
- 异步操作使用 async/await 确保代码可读性和稳定性

祝您使用愉快！