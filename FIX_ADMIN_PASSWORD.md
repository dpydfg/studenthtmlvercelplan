# 修复管理员密码问题

如果使用 `admin/admin` 登录时提示"用户名或密码错误"，可能是数据库中的密码哈希值不正确。

## 解决方法

### 方法1：使用在线工具生成新的哈希值（推荐）

1. 访问 [https://bcrypt-generator.com/](https://bcrypt-generator.com/)
2. 在 "Password" 输入框中输入：`admin`
3. 在 "Rounds" 输入框中输入：`10`
4. 点击 "Generate Hash"
5. 复制生成的哈希值（以 `$2a$10$` 开头）
6. 在 Neon 数据库的 SQL 编辑器中执行：

```sql
UPDATE admins 
SET password_hash = '你复制的哈希值' 
WHERE username = 'admin';
```

### 方法2：删除并重新插入

如果方法1不行，可以删除现有记录后重新插入：

```sql
-- 删除现有管理员记录
DELETE FROM admins WHERE username = 'admin';

-- 使用在线工具生成新的哈希值后，执行：
INSERT INTO admins (username, password_hash, created_at)
VALUES ('admin', '新生成的哈希值', NOW());
```

### 方法3：使用 Node.js 生成（如果本地有 Node.js 环境）

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin', 10).then(hash => console.log('UPDATE admins SET password_hash = \\'' + hash + '\\' WHERE username = \\'admin\\';'));"
```

然后执行输出的 SQL 语句。

## 验证

执行更新后，尝试使用以下凭据登录：
- 用户名：`admin`
- 密码：`admin`

如果仍然失败，请检查：
1. 数据库连接是否正确（DATABASE_URL 环境变量）
2. 管理员记录是否存在于数据库中：`SELECT * FROM admins WHERE username = 'admin';`
3. Vercel 函数日志中的具体错误信息

