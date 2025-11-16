// 登录API
// 处理管理员和学生的登录请求

import { query } from '../utils/db.js';
import { comparePassword, generateToken } from '../utils/auth.js';

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理OPTIONS预检请求（CORS）
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: '方法不允许' });
    return;
  }

  try {
    // 解析请求体
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    const data = JSON.parse(body);
    const { username, password, userType } = data;

    // 验证输入
    if (!username || !password || !userType) {
      res.status(400).json({
        success: false,
        message: '用户名、密码和用户类型都是必填项',
      });
      return;
    }

    // 根据用户类型查询不同的表
    let user;
    if (userType === 'admin') {
      // 查询管理员表
      const result = await query(
        'SELECT id, username, password_hash FROM admins WHERE username = $1',
        [username]
      );
      user = result[0];
    } else if (userType === 'student') {
      // 查询学生表
      const result = await query(
        'SELECT id, username, password_hash, student_id FROM students WHERE username = $1',
        [username]
      );
      user = result[0];
    } else {
      res.status(400).json({
        success: false,
        message: '无效的用户类型',
      });
      return;
    }

    // 检查用户是否存在
    if (!user) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      });
      return;
    }

    // 生成JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      userType: userType,
      studentId: user.student_id || null,
    });

    // 返回成功响应
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
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message,
    });
  }
}

