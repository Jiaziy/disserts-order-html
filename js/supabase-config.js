// Supabase 配置文件
// 请在此设置您的 Supabase 项目凭据
const SUPABASE_CONFIG = {
    // Supabase 项目的 URL
    url: 'https://spxugyajxliackysdjkb.supabase.co',
    
    // Supabase 项目的匿名访问密钥 (anon key)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNweHVneWFqeGxpYWNreXNkamtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MDcxNjIsImV4cCI6MjA3NzE4MzE2Mn0.h0xkb3PRuTtxYdetXCu2_V7nhGgATGLIOkxOWi0xjXA',
    
    // 是否启用调试模式
    debug: true,
    
    // 表名配置
    tables: {
        users: 'users',
        designs: 'designs',
        orders: 'orders'
    },
    
    // 降级选项 - 当 Supabase 不可用时使用
    fallbackToLocalStorage: true,
    
    // 重试配置
    retry: {
        maxAttempts: 3,
        delay: 1000
    }
};

// 将配置暴露到全局作用域，以便其他脚本可以访问
window.SUPABASE_CONFIG = SUPABASE_CONFIG;