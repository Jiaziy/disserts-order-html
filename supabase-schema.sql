-- Supabase 数据表创建 SQL 语句

-- 1. 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- 为 users 表创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 2. 创建 designs 表
CREATE TABLE IF NOT EXISTS designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  canvas_data TEXT NOT NULL,
  dessert_type TEXT NOT NULL,
  elements TEXT,
  image_data TEXT,
  image_position TEXT,
  image_scale DECIMAL DEFAULT 1.0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 designs 表创建索引
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at);
CREATE INDEX IF NOT EXISTS idx_designs_updated_at ON designs(updated_at);

-- 3. 创建 orders 表
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL,
  selected_style TEXT NOT NULL,
  flavor_index INTEGER NOT NULL,
  custom_text TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_packaging TEXT NOT NULL,
  design_image TEXT NOT NULL,
  total_price DECIMAL NOT NULL,
  customer_info JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 为 orders 表创建索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 4. 创建函数来自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 为 designs 和 orders 表创建更新触发器
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'designs_updated_at_trigger') THEN
        CREATE TRIGGER designs_updated_at_trigger
        BEFORE UPDATE ON designs
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'orders_updated_at_trigger') THEN
        CREATE TRIGGER orders_updated_at_trigger
        BEFORE UPDATE ON orders
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;

-- 6. 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 7. 创建权限设置（针对匿名用户）
-- 注意：在实际环境中，请根据安全需求调整这些权限

-- 允许匿名用户读取 designs 表（可选，根据业务需求决定）
-- GRANT SELECT ON designs TO anon;

-- 允许匿名用户创建订单（通常需要）
-- GRANT INSERT ON orders TO anon;

-- 允许匿名用户读取公开信息（如果有需要）
-- GRANT SELECT ON public_info TO anon;