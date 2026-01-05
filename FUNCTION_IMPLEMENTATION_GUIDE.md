# 学生信息管理系统 - 功能实现详解

本文档详细说明项目中每个功能的具体实现代码和程序结构。

---

## 📋 目录

1. [项目架构概览](#项目架构概览)
2. [数据库层实现](#数据库层实现)
3. [认证层实现](#认证层实现)
4. [API层实现](#api层实现)
5. [前端层实现](#前端层实现)
6. [核心功能详解](#核心功能详解)
7. [程序结构总结](#程序结构总结)

---

## 项目架构概览

这是一个基于 **Node.js + Vercel Serverless Functions** 的学生信息管理系统，采用前后端分离架构。

**技术栈：**
- 前端：HTML5 + CSS3 + JavaScript (ES6+)
- 后端：Vercel Serverless Functions (Node.js)
- 数据库：Neon PostgreSQL
- 认证：JWT Token + bcrypt
- 部署：Vercel

---

## 数据库层实现

### 数据库结构

使用 **Neon PostgreSQL** 数据库，包含两个主要表：

**学生表（students）：**
```sql
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
```

**管理员表（admins）：**
```sql
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**实现要点：**
- 使用 `SERIAL` 自增主键
- 为常用查询字段创建索引（学号、用户名、姓名、班级、专业）
- 使用触发器自动更新 `updated_at` 字段
- 密码使用 bcrypt 加密存储

### 数据库连接工具

**文件位置：** `api/utils/db.js`

**核心代码：**
```javascript
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
const sql = neon(connectionString);

export async function query(queryText, params = []) {
  try {
    const result = await sql(queryText, params);
    return result;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}
```

**实现要点：**
- 使用 `@neondatabase/serverless` 适配 Serverless 环境
- 参数化查询防止 SQL 注入
- 统一错误处理

---

## 认证层实现

### 认证工具模块

**文件位置：** `api/utils/auth.js`

**核心功能：**

1. **JWT Token 生成和验证**
```javascript
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token有效期7天
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
```

2. **密码加密和验证**
```javascript
export async function hashPassword(password) {
  const saltRounds = 10; // 加密强度
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

3. **Token 提取和验证**
```javascript
export function authenticateRequest(req) {
  const token = extractTokenFromHeaders(req.headers);
  if (!token) {
    return null;
  }
  return verifyToken(token);
}
```

**实现要点：**
- JWT Token 有效期 7 天
- bcrypt 加密（salt rounds=10）
- 支持 Bearer Token 格式
- 统一的 token 验证逻辑

---

## API层实现

### API 路由结构

```
api/
├── auth/
│   ├── login.js      # 登录API
│   └── register.js   # 注册API
├── students/
│   ├── list.js       # 获取学生列表
│   ├── get.js        # 获取单个学生信息
│   ├── create.js     # 创建学生
│   ├── update.js     # 更新学生信息
│   └── delete.js     # 删除学生
└── utils/
    ├── db.js         # 数据库连接
    └── auth.js       # 认证工具
```

### API 统一模式

所有 API 都遵循以下模式：

1. **设置 CORS 头**
2. **处理 OPTIONS 预检请求**
3. **验证 HTTP 方法**
4. **验证 Token（需要认证的接口）**
5. **验证权限（管理员/学生）**
6. **处理业务逻辑**
7. **返回统一格式响应**

**统一响应格式：**
```javascript
{
  success: true/false,
  message: "操作结果消息",
  data: {}, // 数据（可选）
  token: "", // Token（登录/注册时）
  user: {}, // 用户信息（登录/注册时）
  pagination: {} // 分页信息（列表接口）
}
```

---

## 前端层实现

### 前端文件结构

```
前端页面（HTML）
  ├── index.html（登录页）
  ├── register.html（注册页）
  ├── admin.html（管理员页）
  └── student.html（学生页）

前端脚本（JavaScript）
  ├── scripts/auth.js（认证工具）
  ├── scripts/admin.js（管理员功能）
  └── scripts/student.js（学生功能）
```

### 前端认证工具

**文件位置：** `scripts/auth.js`

**核心功能：**

1. **获取当前用户**
```javascript
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}
```

2. **检查认证状态**
```javascript
export function checkAuth(requiredUserType = null) {
  const token = getToken();
  const user = getCurrentUser();
  
  if (!token || !user) {
    localStorage.clear();
    window.location.href = '/index.html';
    return false;
  }
  
  if (requiredUserType && user.userType !== requiredUserType) {
    // 跳转到对应页面
    return false;
  }
  
  return true;
}
```

3. **带认证头的 Fetch 请求**
```javascript
export async function authenticatedFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, { ...options, headers });
}
```

---

## 核心功能详解

### 功能1：用户登录

#### 前端实现流程

**文件位置：** `index.html`

**实现步骤：**

1. **表单提交处理**
```javascript
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // 1. 收集表单数据
  const userType = document.getElementById('userType').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  // 2. 显示加载状态
  submitBtn.disabled = true;
  loginBtnSpinner.style.display = 'inline-block';
  
  // 3. 发送登录请求
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ username, password, userType }),
  });
  
  const data = await response.json();
  
  // 4. 处理响应
  if (data.success) {
    // 保存token和用户信息
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // 根据用户类型跳转
    if (data.user.userType === 'admin') {
      window.location.href = '/admin.html';
    } else {
      window.location.href = '/student.html';
    }
  } else {
    // 显示错误信息
    errorMessage.textContent = data.message;
    errorMessage.style.display = 'block';
  }
});
```

**关键点：**
- 阻止默认表单提交
- 显示加载状态提升用户体验
- Token 存储在 localStorage
- 根据用户类型自动跳转

#### 后端实现流程

**文件位置：** `api/auth/login.js`

**实现步骤：**

1. **解析请求和验证输入**
```javascript
const { username, password, userType } = JSON.parse(body);

if (!username || !password || !userType) {
  res.status(400).json({
    success: false,
    message: '用户名、密码和用户类型都是必填项',
  });
  return;
}
```

2. **根据用户类型查询数据库**
```javascript
let user;
if (userType === 'admin') {
  const result = await query(
    'SELECT id, username, password_hash FROM admins WHERE username = $1',
    [username]
  );
  user = result[0];
} else if (userType === 'student') {
  const result = await query(
    'SELECT id, username, password_hash, student_id FROM students WHERE username = $1',
    [username]
  );
  user = result[0];
}
```

3. **验证密码**
```javascript
const isPasswordValid = await comparePassword(password, user.password_hash);
if (!isPasswordValid) {
  res.status(401).json({
    success: false,
    message: '用户名或密码错误',
  });
  return;
}
```

4. **生成 JWT Token**
```javascript
const token = generateToken({
  id: user.id,
  username: user.username,
  userType: userType,
  studentId: user.student_id || null,
});
```

5. **返回成功响应**
```javascript
res.status(200).json({
  success: true,
  message: '登录成功',
  token: token,
  user: {
    id: user.id,
    username: user.username,
    userType: userType,
    studentId: user.student_id || null,
  },
});
```

---

### 功能2：学生注册

#### 前端实现流程

**文件位置：** `register.html`

**实现步骤：**

1. **收集表单数据**
```javascript
const formData = {
  username: document.getElementById('username').value,
  password: document.getElementById('password').value,
  studentId: document.getElementById('studentId').value,
  name: document.getElementById('name').value,
  gender: document.getElementById('gender').value,
  age: document.getElementById('age').value ? parseInt(document.getElementById('age').value) : null,
  class: document.getElementById('class').value,
  major: document.getElementById('major').value,
};
```

2. **发送注册请求**
```javascript
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(formData),
});
```

3. **处理响应并自动登录**
```javascript
if (data.success) {
  // 保存token和用户信息
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  // 延迟跳转到学生页面
  setTimeout(() => {
    window.location.href = '/student.html';
  }, 1500);
}
```

#### 后端实现流程

**文件位置：** `api/auth/register.js`

**实现步骤：**

1. **验证必填字段**
```javascript
if (!username || !password || !studentId || !name) {
  res.status(400).json({
    success: false,
    message: '用户名、密码、学号和姓名都是必填项',
  });
  return;
}
```

2. **验证密码长度**
```javascript
if (password.length < 6) {
  res.status(400).json({
    success: false,
    message: '密码长度至少为6位',
  });
  return;
}
```

3. **检查用户名唯一性**
```javascript
const existingUser = await query(
  'SELECT id FROM students WHERE username = $1',
  [username]
);
if (existingUser.length > 0) {
  res.status(409).json({
    success: false,
    message: '用户名已存在',
  });
  return;
}
```

4. **检查学号唯一性**
```javascript
const existingStudent = await query(
  'SELECT id FROM students WHERE student_id = $1',
  [studentId]
);
if (existingStudent.length > 0) {
  res.status(409).json({
    success: false,
    message: '学号已存在',
  });
  return;
}
```

5. **加密密码并插入数据库**
```javascript
const passwordHash = await hashPassword(password);

const result = await query(
  `INSERT INTO students (
    username, password_hash, student_id, name, gender, age, class, major, created_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
  RETURNING id, username, student_id, name, gender, age, class, major`,
  [username, passwordHash, studentId, name, gender || null, age || null, className || null, major || null]
);
```

6. **生成 Token 并返回**
```javascript
const token = generateToken({
  id: newStudent.id,
  username: newStudent.username,
  userType: 'student',
  studentId: newStudent.student_id,
});

res.status(201).json({
  success: true,
  message: '注册成功',
  token: token,
  user: { ...newStudent, userType: 'student' },
});
```

---

### 功能3：管理员查看学生列表（含搜索和分页）

#### 前端实现流程

**文件位置：** `scripts/admin.js`

**1. 加载学生列表**
```javascript
async function loadStudents(page = 1, search = '') {
  currentPage = page;
  currentSearch = search;
  
  // 显示加载状态
  tbody.innerHTML = '<tr><td colspan="7" class="loading">加载中...</td></tr>';
  
  // 构建请求URL
  let url = `/api/students/list?page=${page}&pageSize=10`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  
  // 发送请求（自动添加Authorization头）
  const response = await authenticatedFetch(url);
  const data = await response.json();
  
  if (data.success) {
    displayStudents(data.data);
    displayPagination(data.pagination);
  }
}
```

**2. 显示学生列表**
```javascript
function displayStudents(students) {
  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">暂无学生数据</td></tr>';
    return;
  }
  
  tbody.innerHTML = students.map(student => `
    <tr>
      <td>${escapeHtml(student.student_id || '')}</td>
      <td>${escapeHtml(student.name || '')}</td>
      <td>${escapeHtml(student.gender || '')}</td>
      <td>${student.age || ''}</td>
      <td>${escapeHtml(student.class || '')}</td>
      <td>${escapeHtml(student.major || '')}</td>
      <td>
        <button onclick="editStudent(${student.id})">编辑</button>
        <button onclick="deleteStudent(${student.id}, '${escapeHtml(student.name)}')">删除</button>
      </td>
    </tr>
  `).join('');
}
```

**3. 显示分页**
```javascript
function displayPagination(pagination) {
  let html = '';
  
  // 上一页按钮
  html += `<button ${pagination.page === 1 ? 'disabled' : ''} 
           onclick="loadStudents(${pagination.page - 1}, '${currentSearch}')">上一页</button>`;
  
  // 页码信息
  html += `<span>第 ${pagination.page} 页 / 共 ${pagination.totalPages} 页 (共 ${pagination.total} 条)</span>`;
  
  // 下一页按钮
  html += `<button ${pagination.page === pagination.totalPages ? 'disabled' : ''} 
           onclick="loadStudents(${pagination.page + 1}, '${currentSearch}')">下一页</button>`;
  
  paginationEl.innerHTML = html;
}
```

**4. 搜索功能**
```javascript
window.searchStudents = function() {
  const searchInput = document.getElementById('searchInput');
  loadStudents(1, searchInput.value.trim());
};
```

#### 后端实现流程

**文件位置：** `api/students/list.js`

**实现步骤：**

1. **验证 Token 和权限**
```javascript
const user = authenticateRequest(req);
if (!user) {
  res.status(401).json({
    success: false,
    message: '未授权，请先登录',
  });
  return;
}
```

2. **获取查询参数**
```javascript
const url = new URL(req.url, `http://${req.headers.host}`);
const search = url.searchParams.get('search') || '';
const page = parseInt(url.searchParams.get('page') || '1');
const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
```

3. **根据用户类型和搜索条件查询**
```javascript
if (user.userType === 'admin') {
  if (search) {
    // 带搜索条件
    const searchPattern = `%${search}%`;
    students = await query(
      `SELECT id, student_id, username, name, gender, age, class, major, created_at, updated_at
       FROM students
       WHERE name ILIKE $1 OR student_id ILIKE $1 OR class ILIKE $1 OR major ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [searchPattern, pageSize, (page - 1) * pageSize]
    );
    // 查询总数
    const countResult = await query(
      `SELECT COUNT(*) as count FROM students
       WHERE name ILIKE $1 OR student_id ILIKE $1 OR class ILIKE $1 OR major ILIKE $1`,
      [searchPattern]
    );
    totalCount = parseInt(countResult[0].count);
  } else {
    // 不带搜索条件
    students = await query(
      `SELECT id, student_id, username, name, gender, age, class, major, created_at, updated_at
       FROM students
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, (page - 1) * pageSize]
    );
    const countResult = await query('SELECT COUNT(*) as count FROM students');
    totalCount = parseInt(countResult[0].count);
  }
} else if (user.userType === 'student') {
  // 学生只能查看自己的信息
  students = await query(
    `SELECT id, student_id, username, name, gender, age, class, major, created_at, updated_at
     FROM students WHERE id = $1`,
    [user.id]
  );
  totalCount = 1;
}
```

4. **返回分页结果**
```javascript
res.status(200).json({
  success: true,
  data: students,
  pagination: {
    page,
    pageSize,
    total: totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  },
});
```

**关键点：**
- 权限控制：管理员查看全部，学生仅查看自己
- 使用 `ILIKE` 进行大小写不敏感搜索
- 分页使用 `LIMIT` 和 `OFFSET`
- 分别查询总数和列表数据

---

### 功能4：管理员添加/编辑学生

#### 前端实现流程

**文件位置：** `scripts/admin.js`

**1. 显示添加模态框**
```javascript
window.showAddModal = function() {
  const modal = document.getElementById('studentModal');
  const form = document.getElementById('studentForm');
  const title = document.getElementById('modalTitle');
  
  title.textContent = '添加学生';
  form.reset();
  document.getElementById('studentId').value = '';
  document.getElementById('modalPassword').required = true;
  
  modal.style.display = 'flex';
};
```

**2. 编辑学生（先获取信息）**
```javascript
window.editStudent = async function(studentId) {
  const response = await authenticatedFetch(`/api/students/get?id=${studentId}`);
  const data = await response.json();
  
  if (data.success) {
    const student = data.data;
    
    // 填充表单
    document.getElementById('studentId').value = student.id;
    document.getElementById('modalUsername').value = student.username || '';
    document.getElementById('modalPassword').value = '';
    document.getElementById('modalPassword').required = false; // 编辑时密码可选
    document.getElementById('modalStudentId').value = student.student_id || '';
    document.getElementById('modalName').value = student.name || '';
    // ... 其他字段
    
    modal.style.display = 'flex';
  }
};
```

**3. 表单提交处理**
```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    id: document.getElementById('studentId').value,
    username: document.getElementById('modalUsername').value,
    password: document.getElementById('modalPassword').value,
    studentId: document.getElementById('modalStudentId').value,
    name: document.getElementById('modalName').value,
    // ... 其他字段
  };
  
  // 如果是编辑且密码为空，则不发送密码字段
  if (formData.id && !formData.password) {
    delete formData.password;
  }
  
  // 根据是否有id判断是添加还是编辑
  const isEdit = !!formData.id;
  const url = isEdit ? '/api/students/update' : '/api/students/create';
  const method = isEdit ? 'PUT' : 'POST';
  
  const response = await authenticatedFetch(url, {
    method,
    body: JSON.stringify(formData),
  });
  
  const data = await response.json();
  
  if (data.success) {
    closeModal();
    loadStudents(currentPage, currentSearch); // 刷新列表
    alert(isEdit ? '更新成功' : '添加成功');
  }
});
```

#### 后端实现流程

**创建学生：** `api/students/create.js`

**实现步骤：**

1. **验证管理员权限**
```javascript
if (user.userType !== 'admin') {
  res.status(403).json({
    success: false,
    message: '只有管理员可以创建学生',
  });
  return;
}
```

2. **验证输入和唯一性**
```javascript
// 检查用户名和学号是否已存在
const existingUser = await query(
  'SELECT id FROM students WHERE username = $1',
  [username]
);
if (existingUser.length > 0) {
  res.status(409).json({
    success: false,
    message: '用户名已存在',
  });
  return;
}
```

3. **加密密码并插入**
```javascript
const passwordHash = await hashPassword(password);

const result = await query(
  `INSERT INTO students (
    username, password_hash, student_id, name, gender, age, class, major, created_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
  RETURNING id, student_id, username, name, gender, age, class, major, created_at, updated_at`,
  [username, passwordHash, studentId, name, gender || null, age || null, className || null, major || null]
);
```

**更新学生：** `api/students/update.js`

**实现步骤：**

1. **动态构建更新SQL**
```javascript
const updates = [];
const params = [];
let paramIndex = 1;

if (username) {
  updates.push(`username = $${paramIndex++}`);
  params.push(username);
}
if (password) {
  const passwordHash = await hashPassword(password);
  updates.push(`password_hash = $${paramIndex++}`);
  params.push(passwordHash);
}
if (name) {
  updates.push(`name = $${paramIndex++}`);
  params.push(name);
}
// ... 其他字段

// 添加更新时间
updates.push(`updated_at = NOW()`);
params.push(id);
```

2. **执行更新**
```javascript
const result = await query(
  `UPDATE students
   SET ${updates.join(', ')}
   WHERE id = $${paramIndex}
   RETURNING id, student_id, username, name, gender, age, class, major, created_at, updated_at`,
  params
);
```

**关键点：**
- 动态构建 UPDATE 语句，只更新提供的字段
- 密码为空时不更新密码
- 自动更新 `updated_at` 字段

---

### 功能5：管理员删除学生

#### 前端实现流程

**文件位置：** `scripts/admin.js`

```javascript
window.deleteStudent = async function(studentId, studentName) {
  // 确认删除
  if (!confirm(`确定要删除学生 "${studentName}" 吗？此操作不可恢复！`)) {
    return;
  }
  
  try {
    const response = await authenticatedFetch(`/api/students/delete?id=${studentId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('删除成功');
      loadStudents(currentPage, currentSearch); // 刷新列表
    } else {
      alert(data.message || '删除失败');
    }
  } catch (error) {
    console.error('删除学生错误:', error);
    alert('网络错误，请稍后重试');
  }
};
```

#### 后端实现流程

**文件位置：** `api/students/delete.js`

```javascript
// 1. 验证管理员权限
if (user.userType !== 'admin') {
  res.status(403).json({
    success: false,
    message: '只有管理员可以删除学生',
  });
  return;
}

// 2. 获取学生ID
const url = new URL(req.url, `http://${req.headers.host}`);
const studentId = url.searchParams.get('id');

// 3. 检查学生是否存在
const existingStudent = await query(
  'SELECT id, name FROM students WHERE id = $1',
  [studentId]
);
if (existingStudent.length === 0) {
  res.status(404).json({
    success: false,
    message: '学生不存在',
  });
  return;
}

// 4. 执行删除
await query('DELETE FROM students WHERE id = $1', [studentId]);

// 5. 返回成功响应
res.status(200).json({
  success: true,
  message: '学生删除成功',
});
```

---

### 功能6：学生查看个人信息

#### 前端实现流程

**文件位置：** `scripts/student.js`

```javascript
async function loadStudentInfo() {
  const infoContainer = document.getElementById('studentInfo');
  infoContainer.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    // 获取当前用户信息
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);
    
    // 获取学生详细信息
    const response = await authenticatedFetch(`/api/students/get?id=${user.id}`);
    const data = await response.json();
    
    if (data.success) {
      displayStudentInfo(data.data);
    }
  } catch (error) {
    console.error('加载学生信息错误:', error);
    infoContainer.innerHTML = '<div class="error-message">网络错误，请稍后重试</div>';
  }
}

function displayStudentInfo(student) {
  const infoItems = [
    { label: '学号', value: student.student_id || '' },
    { label: '用户名', value: student.username || '' },
    { label: '姓名', value: student.name || '' },
    { label: '性别', value: student.gender || '' },
    { label: '年龄', value: student.age || '' },
    { label: '班级', value: student.class || '' },
    { label: '专业', value: student.major || '' },
    { label: '注册时间', value: student.created_at ? new Date(student.created_at).toLocaleString('zh-CN') : '' },
    { label: '更新时间', value: student.updated_at ? new Date(student.updated_at).toLocaleString('zh-CN') : '' },
  ];
  
  infoContainer.innerHTML = infoItems.map(item => `
    <div class="info-item">
      <span class="info-label">${escapeHtml(item.label)}：</span>
      <span class="info-value">${escapeHtml(item.value || '未填写')}</span>
    </div>
  `).join('');
}
```

#### 后端实现流程

**文件位置：** `api/students/get.js`

```javascript
// 1. 验证Token
const user = authenticateRequest(req);
if (!user) {
  res.status(401).json({
    success: false,
    message: '未授权，请先登录',
  });
  return;
}

// 2. 查询学生信息
const result = await query(
  `SELECT id, student_id, username, name, gender, age, class, major, created_at, updated_at
   FROM students WHERE id = $1`,
  [studentId]
);

// 3. 检查权限：学生只能查看自己的信息，管理员可以查看所有
if (user.userType === 'student' && user.id !== student.id) {
  res.status(403).json({
    success: false,
    message: '无权访问该学生信息',
  });
  return;
}

// 4. 返回学生信息
res.status(200).json({
  success: true,
  data: student,
});
```

**关键点：**
- 学生只能查看自己的信息
- 管理员可以查看任意学生信息
- 时间格式化显示

---

### 功能7：学生修改自己的信息

#### 功能说明

允许学生修改自己的个人信息，但有以下限制：
- ✅ 可以修改：姓名、性别、年龄、班级、专业、密码
- ❌ 不能修改：用户名、学号（这些敏感信息只能由管理员修改）
- 🔒 权限控制：学生只能修改自己的信息，不能修改其他学生的信息

#### 前端实现流程

**文件位置：** `student.html` 和 `scripts/student.js`

**1. HTML结构（添加编辑按钮和模态框）**

在 `student.html` 中添加：

```html
<div class="info-card">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <h2>我的信息</h2>
    <button class="btn btn-primary" onclick="showEditModal()" id="editBtn">编辑信息</button>
  </div>
  <!-- 学生信息显示区域 -->
</div>

<!-- 编辑信息模态框 -->
<div id="editModal" class="modal" style="display: none;">
  <div class="modal-content">
    <div class="modal-header">
      <h2>编辑我的信息</h2>
      <button class="modal-close" onclick="closeEditModal()">&times;</button>
    </div>
    <form id="editForm" class="form">
      <div class="form-group">
        <label for="editName">姓名 <span class="required">*</span></label>
        <input type="text" id="editName" name="name" class="form-control" required>
      </div>
      <!-- 其他字段：性别、年龄、班级、专业、密码 -->
    </form>
  </div>
</div>
```

**2. 显示编辑模态框**

```javascript
window.showEditModal = function() {
  if (!currentStudentData) {
    alert('学生信息未加载，请稍后再试');
    return;
  }
  
  const modal = document.getElementById('editModal');
  
  // 填充表单数据
  document.getElementById('editName').value = currentStudentData.name || '';
  document.getElementById('editGender').value = currentStudentData.gender || '';
  document.getElementById('editAge').value = currentStudentData.age || '';
  document.getElementById('editClass').value = currentStudentData.class || '';
  document.getElementById('editMajor').value = currentStudentData.major || '';
  document.getElementById('editPassword').value = '';
  
  modal.style.display = 'flex';
};
```

**3. 表单提交处理**

```javascript
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // 获取当前用户ID
  const user = JSON.parse(localStorage.getItem('user'));
  
  // 收集表单数据
  const formData = {
    id: user.id, // 使用当前登录用户的ID
    name: document.getElementById('editName').value,
    gender: document.getElementById('editGender').value,
    age: document.getElementById('editAge').value ? parseInt(document.getElementById('editAge').value) : null,
    class: document.getElementById('editClass').value,
    major: document.getElementById('editMajor').value,
  };
  
  // 如果密码不为空，则添加密码字段
  const password = document.getElementById('editPassword').value;
  if (password) {
    formData.password = password;
  }
  
  // 发送更新请求
  const response = await authenticatedFetch('/api/students/update', {
    method: 'PUT',
    body: JSON.stringify(formData),
  });
  
  const data = await response.json();
  
  if (data.success) {
    closeEditModal();
    loadStudentInfo(); // 重新加载学生信息
    alert('信息更新成功');
  } else {
    errorMessage.textContent = data.message || '更新失败';
    errorMessage.style.display = 'block';
  }
});
```

**关键点：**
- 使用当前登录用户的ID，确保只能修改自己的信息
- 密码字段可选，留空则不修改密码
- 更新成功后自动刷新显示

#### 后端实现流程

**文件位置：** `api/students/update.js`

**权限控制逻辑：**

```javascript
// 权限控制：学生只能更新自己的信息，管理员可以更新任何学生信息
if (user.userType === 'student' && user.id !== parseInt(id)) {
  res.status(403).json({
    success: false,
    message: '您只能修改自己的信息',
  });
  return;
}

// 学生不能修改学号和用户名（这些是敏感信息，只能由管理员修改）
if (user.userType === 'student') {
  if (username !== undefined || studentId !== undefined) {
    res.status(403).json({
      success: false,
      message: '学生不能修改用户名和学号，请联系管理员',
    });
    return;
  }
}
```

**实现步骤：**

1. **验证Token和权限**
   - 检查用户是否已登录
   - 学生用户只能更新自己的信息（`user.id === id`）
   - 管理员可以更新任何学生信息

2. **限制学生可修改的字段**
   - 学生不能修改：用户名（username）、学号（student_id）
   - 学生可以修改：姓名、性别、年龄、班级、专业、密码

3. **动态构建更新SQL**
   - 只更新提供的字段
   - 密码为空时不更新密码
   - 自动更新 `updated_at` 字段

4. **执行更新并返回结果**
   - 使用参数化查询防止SQL注入
   - 返回更新后的学生信息

**关键点：**
- 严格的权限控制：学生只能修改自己的信息
- 字段限制：保护敏感信息（用户名、学号）
- 密码可选更新：留空则不修改密码
- 统一的错误处理和响应格式

---

## 程序结构总结

### 1. 前端结构

```
前端页面（HTML）
  ├── index.html（登录页）
  ├── register.html（注册页）
  ├── admin.html（管理员页）
  └── student.html（学生页）

前端脚本（JavaScript）
  ├── scripts/auth.js（认证工具）
  │   ├── getCurrentUser() - 获取当前用户
  │   ├── getToken() - 获取Token
  │   ├── checkAuth() - 检查认证状态
  │   ├── logout() - 退出登录
  │   └── authenticatedFetch() - 带认证头的请求
  ├── scripts/admin.js（管理员功能）
  │   ├── loadStudents() - 加载学生列表
  │   ├── displayStudents() - 显示学生列表
  │   ├── displayPagination() - 显示分页
  │   ├── searchStudents() - 搜索学生
  │   ├── showAddModal() - 显示添加模态框
  │   ├── editStudent() - 编辑学生
  │   └── deleteStudent() - 删除学生
  └── scripts/student.js（学生功能）
      ├── loadStudentInfo() - 加载学生信息
      └── displayStudentInfo() - 显示学生信息
```

### 2. 后端结构

```
API路由（Serverless Functions）
  ├── api/auth/
  │   ├── login.js（登录）
  │   │   ├── 验证用户类型
  │   │   ├── 查询用户
  │   │   ├── 验证密码
  │   │   └── 生成Token
  │   └── register.js（注册）
  │       ├── 验证输入
  │       ├── 检查唯一性
  │       ├── 加密密码
  │       └── 插入数据库
  ├── api/students/
  │   ├── list.js（列表）
  │   │   ├── 权限控制
  │   │   ├── 搜索功能
  │   │   └── 分页功能
  │   ├── get.js（单个）
  │   │   ├── 权限控制
  │   │   └── 返回学生信息
  │   ├── create.js（创建）
  │   │   ├── 验证管理员权限
  │   │   ├── 检查唯一性
  │   │   └── 插入数据库
  │   ├── update.js（更新）
  │   │   ├── 验证管理员权限
  │   │   ├── 动态构建更新SQL
  │   │   └── 执行更新
  │   └── delete.js（删除）
  │       ├── 验证管理员权限
  │       └── 执行删除
  └── api/utils/
      ├── db.js（数据库工具）
      │   └── query() - 执行SQL查询
      └── auth.js（认证工具）
          ├── generateToken() - 生成Token
          ├── verifyToken() - 验证Token
          ├── hashPassword() - 加密密码
          ├── comparePassword() - 验证密码
          └── authenticateRequest() - 验证请求
```

### 3. 数据流

```
用户操作 
  ↓
前端JS收集数据
  ↓
发送API请求（带Token）
  ↓
后端验证Token和权限
  ↓
执行数据库操作
  ↓
返回JSON响应
  ↓
前端更新UI
```

### 4. 安全机制

1. **Token 验证**
   - 每个 API 请求都验证 JWT Token
   - Token 有效期 7 天
   - Token 存储在 localStorage

2. **权限控制**
   - 根据用户类型（admin/student）限制访问
   - 学生只能查看自己的信息
   - 管理员可以管理所有学生

3. **密码加密**
   - 使用 bcrypt 加密存储
   - salt rounds = 10
   - 密码不返回给前端

4. **XSS 防护**
   - 使用 `escapeHtml()` 转义输出
   - 防止恶意脚本注入

5. **SQL 注入防护**
   - 使用参数化查询
   - 所有用户输入都通过参数传递

6. **CORS 配置**
   - 设置适当的 CORS 头
   - 处理 OPTIONS 预检请求

### 5. 错误处理

**前端错误处理：**
- 网络错误捕获
- 显示友好的错误提示
- 加载状态显示

**后端错误处理：**
- 统一的错误响应格式
- 详细的错误日志记录
- 适当的 HTTP 状态码

### 6. 用户体验优化

1. **加载状态**
   - 按钮禁用和加载动画
   - 列表加载提示

2. **表单验证**
   - 前端 HTML5 验证
   - 后端数据验证
   - 实时错误提示

3. **自动跳转**
   - 登录后自动跳转
   - 注册后自动登录并跳转
   - 未登录自动跳转到登录页

4. **数据刷新**
   - 操作成功后自动刷新列表
   - 保持当前页码和搜索条件

---

## 总结

本项目采用前后端分离架构，使用 Vercel Serverless Functions 作为后端，实现了完整的学生信息管理系统。主要特点：

1. **清晰的代码结构**：前后端分离，职责明确
2. **完善的认证机制**：JWT Token + bcrypt 密码加密
3. **严格的权限控制**：基于用户类型的访问控制
4. **良好的用户体验**：加载状态、错误提示、自动跳转
5. **安全防护措施**：XSS 防护、SQL 注入防护、CORS 配置

每个功能都有完整的实现代码，遵循统一的开发模式，便于维护和扩展。

