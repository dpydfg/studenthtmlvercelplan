# 学生信息管理系统

一个基于Web的学生信息管理系统，支持学生注册登录、管理员管理学生信息等功能。

## 功能特性

- **用户认证**
  - 学生注册和登录
  - 管理员登录
  - JWT Token认证
  - 密码加密存储（bcrypt）

- **学生信息管理**
  - 学生查看个人信息
  - 学生编辑个人信息（姓名、性别、年龄、班级、专业、密码）
  - 管理员查看所有学生列表
  - 管理员添加、编辑、删除学生信息
  - 搜索功能（按姓名、学号、班级、专业）
  - 分页显示

- **界面设计**
  - 移动优先响应式设计
  - 支持移动端和桌面端访问
  - 友好的用户交互体验
  - 完整的中文支持（UTF-8编码）

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **后端**: Vercel Serverless Functions (Node.js)
- **数据库**: Neon PostgreSQL
- **认证**: JWT Token
- **密码加密**: bcryptjs
- **部署**: Vercel

## 项目结构

```
/
├── index.html              # 登录页面
├── register.html           # 学生注册页面
├── admin.html              # 管理员管理界面
├── student.html            # 学生个人信息页面
├── api/                    # API路由
│   ├── auth/              # 认证相关API
│   │   ├── login.js       # 登录API
│   │   └── register.js    # 注册API
│   ├── students/          # 学生信息管理API
│   │   ├── list.js        # 获取学生列表
│   │   ├── get.js         # 获取单个学生信息
│   │   ├── create.js      # 创建学生
│   │   ├── update.js      # 更新学生信息
│   │   └── delete.js      # 删除学生
│   └── utils/             # 工具函数
│       ├── db.js          # 数据库连接
│       └── auth.js         # 认证工具
├── styles/
│   └── main.css           # 主样式文件
├── scripts/
│   ├── auth.js            # 认证相关JS
│   ├── admin.js           # 管理员页面逻辑
│   └── student.js         # 学生页面逻辑
├── package.json           # 项目依赖
├── vercel.json            # Vercel配置
└── database.sql           # 数据库初始化脚本
```

## 环境变量配置

在Vercel项目设置中配置以下环境变量：

### 必需的环境变量

1. **DATABASE_URL**
   - 描述: Neon数据库连接字符串
   - 格式: `postgresql://username:password@host:port/database?sslmode=require`
   - 获取方式: 在Neon控制台创建项目后，复制连接字符串

2. **JWT_SECRET**（可选，但建议设置）
   - 描述: JWT Token加密密钥
   - 格式: 任意字符串（建议使用强随机字符串）
   - 默认值: `your-secret-key-change-in-production`
   - 注意: 生产环境必须使用强密钥

### 环境变量配置步骤

1. 登录Vercel控制台
2. 进入项目设置（Settings）
3. 选择"Environment Variables"
4. 添加上述环境变量
5. 保存并重新部署项目

## 数据库初始化

1. 在Neon控制台创建PostgreSQL数据库
2. 执行 `database.sql` 文件中的SQL语句创建表结构
3. 数据库会自动创建预置管理员账号：
   - 用户名: `admin`
   - 密码: `admin`

## 部署步骤

### 1. 准备数据库

1. 访问 [https://neon.tech](https://neon.tech) 注册并创建项目
2. 在SQL编辑器中执行 `database.sql` 文件中的所有SQL语句
3. 复制数据库连接字符串

### 2. 部署到Vercel

**方法一：通过Git集成（推荐）**

1. 将代码推送到GitHub/GitLab/Bitbucket仓库
2. 登录Vercel控制台
3. 点击"New Project"
4. 导入您的Git仓库
5. 配置项目设置：
   - Framework Preset: Other
   - Root Directory: ./
6. 添加环境变量：
   - `DATABASE_URL`: 您的Neon数据库连接字符串
   - `JWT_SECRET`: 随机生成的密钥（可选）
7. 点击"Deploy"

**方法二：通过Vercel CLI**

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 添加环境变量
vercel env add DATABASE_URL
vercel env add JWT_SECRET

# 重新部署以应用环境变量
vercel --prod
```

## 使用说明

### 管理员登录

1. 访问登录页面
2. 选择"管理员"用户类型
3. 输入管理员用户名和密码：
   - 用户名: `admin`
   - 密码: `admin`
4. 登录后可以管理所有学生信息

### 学生注册

1. 访问注册页面
2. 填写必填信息（用户名、密码、学号、姓名）
3. 可选填写其他信息（性别、年龄、班级、专业）
4. 提交注册后自动登录

### 学生登录

1. 访问登录页面
2. 选择"学生"用户类型
3. 输入用户名和密码
4. 登录后可以查看和编辑个人信息

### 学生功能

- 查看个人信息
- 编辑个人信息（姓名、性别、年龄、班级、专业、密码）
- 注意：学生不能修改用户名和学号，如需修改请联系管理员

### 管理员功能

- 查看所有学生列表
- 搜索学生（按姓名、学号、班级、专业）
- 添加新学生
- 编辑学生信息
- 删除学生
- 分页浏览学生列表

## 安全特性

- 密码使用bcrypt加密存储（salt rounds=10）
- JWT Token认证（7天有效期）
- 输入验证和错误处理
- XSS防护（HTML转义）
- SQL注入防护（参数化查询）
- 权限控制（学生只能查看和编辑自己信息，管理员可以管理所有学生）
- 字段权限限制（学生不能修改用户名和学号等敏感字段）

## 注意事项

1. **生产环境配置**
   - 必须设置强JWT_SECRET
   - 确保DATABASE_URL使用SSL连接
   - 定期更新依赖包

2. **数据库备份**
   - 定期备份Neon数据库
   - 重要数据建议设置自动备份

3. **性能优化**
   - 学生列表使用分页，避免一次性加载大量数据
   - 数据库已创建索引以提高查询性能

4. **中文支持**
   - 所有页面和API响应都使用UTF-8编码
   - 数据库使用UTF-8字符集
   - 确保正确显示中文字符

## 许可证

MIT License
