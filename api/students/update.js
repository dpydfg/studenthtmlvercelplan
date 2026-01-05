// 更新学生信息API
// 管理员可以更新任何学生信息，学生只能更新自己的信息

import { query } from '../utils/db.js';
import { authenticateRequest } from '../utils/auth.js';
import { hashPassword } from '../utils/auth.js';

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许PUT请求
  if (req.method !== 'PUT') {
    res.status(405).json({ success: false, message: '方法不允许' });
    return;
  }

  try {
    // 验证token
    const user = authenticateRequest(req);
    if (!user) {
      res.status(401).json({
        success: false,
        message: '未授权，请先登录',
      });
      return;
    }

    // 解析请求体
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const data = JSON.parse(body);
    const {
      id,
      username,
      password,
      studentId,
      name,
      gender,
      age,
      class: className,
      major,
    } = data;

    // 验证必填字段
    if (!id) {
      res.status(400).json({
        success: false,
        message: '学生ID是必填项',
      });
      return;
    }

    // 检查学生是否存在
    const existingStudent = await query(
      'SELECT id FROM students WHERE id = $1',
      [id]
    );
    if (existingStudent.length === 0) {
      res.status(404).json({
        success: false,
        message: '学生不存在',
      });
      return;
    }

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

    // 如果更新用户名，检查是否与其他用户冲突
    if (username) {
      const existingUser = await query(
        'SELECT id FROM students WHERE username = $1 AND id != $2',
        [username, id]
      );
      if (existingUser.length > 0) {
        res.status(409).json({
          success: false,
          message: '用户名已被其他学生使用',
        });
        return;
      }
    }

    // 如果更新学号，检查是否与其他学生冲突
    if (studentId) {
      const existingStudentId = await query(
        'SELECT id FROM students WHERE student_id = $1 AND id != $2',
        [studentId, id]
      );
      if (existingStudentId.length > 0) {
        res.status(409).json({
          success: false,
          message: '学号已被其他学生使用',
        });
        return;
      }
    }

    // 构建更新SQL语句
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (username) {
      updates.push(`username = $${paramIndex++}`);
      params.push(username);
    }
    if (password) {
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: '密码长度至少为6位',
        });
        return;
      }
      const passwordHash = await hashPassword(password);
      updates.push(`password_hash = $${paramIndex++}`);
      params.push(passwordHash);
    }
    if (studentId) {
      updates.push(`student_id = $${paramIndex++}`);
      params.push(studentId);
    }
    if (name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramIndex++}`);
      params.push(gender || null);
    }
    if (age !== undefined) {
      updates.push(`age = $${paramIndex++}`);
      params.push(age || null);
    }
    if (className !== undefined) {
      updates.push(`class = $${paramIndex++}`);
      params.push(className || null);
    }
    if (major !== undefined) {
      updates.push(`major = $${paramIndex++}`);
      params.push(major || null);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: '没有要更新的字段',
      });
      return;
    }

    // 添加更新时间
    updates.push(`updated_at = NOW()`);
    params.push(id);

    // 执行更新
    const result = await query(
      `UPDATE students
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, student_id, username, name, gender, age, class, major, created_at, updated_at`,
      params
    );

    const updatedStudent = result[0];

    res.status(200).json({
      success: true,
      message: '学生信息更新成功',
      data: updatedStudent,
    });
  } catch (error) {
    console.error('更新学生信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message,
    });
  }
}
