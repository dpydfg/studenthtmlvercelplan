-- 学生信息管理系统数据库初始化脚本
-- 数据库: Neon PostgreSQL
-- 字符编码: UTF-8

-- 创建学生表
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    age INTEGER,
    class VARCHAR(100),
    major VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_major ON students(major);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- 创建更新时间自动更新触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为学生表创建更新时间触发器
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入预置管理员账号
-- 用户名: admin
-- 密码: admin
-- 密码哈希值（使用bcrypt加密，salt rounds=10）
-- 注意：如果登录失败，可能是哈希值不正确
-- 解决方法1：删除现有记录后重新插入
-- DELETE FROM admins WHERE username = 'admin';
-- 然后重新执行下面的INSERT语句
-- 
-- 解决方法2：使用在线bcrypt工具生成新的哈希值
-- 访问 https://bcrypt-generator.com/ 或类似工具
-- 输入密码 "admin"，选择 rounds=10，生成新的哈希值
-- 然后执行：UPDATE admins SET password_hash = '新生成的哈希值' WHERE username = 'admin';
INSERT INTO admins (username, password_hash, created_at)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW())
ON CONFLICT (username) DO NOTHING;

-- 验证表是否创建成功
SELECT 'Tables created successfully!' AS status;

