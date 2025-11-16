// 登录API
// 处理管理员和学生的登录请求

import { query } from '../utils/db.js';
import { comparePassword, generateToken } from '../utils/auth.js';

export default async function handler(req) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: '方法不允许' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  }

  try {
    // 解析请求体
    const body = await req.json();
    const { username, password, userType } = body;

    // 验证输入
    if (!username || !password || !userType) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '用户名、密码和用户类型都是必填项',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
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
      return new Response(
        JSON.stringify({
          success: false,
          message: '无效的用户类型',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 检查用户是否存在
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '用户名或密码错误',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '用户名或密码错误',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 生成JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      userType: userType,
      studentId: user.student_id || null,
    });

    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        message: '登录成功',
        token: token,
        user: {
          id: user.id,
          username: user.username,
          userType: userType,
          studentId: user.student_id || null,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('登录错误:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: '服务器内部错误',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  }
}

