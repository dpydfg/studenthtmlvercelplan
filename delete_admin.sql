-- 删除现有管理员用户
-- 执行此语句后，需要重新插入管理员账号

DELETE FROM admins WHERE username = 'admin';

-- 验证删除结果
SELECT * FROM admins WHERE username = 'admin';
-- 如果返回空结果，说明删除成功











