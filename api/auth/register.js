// 注册API
// 处理学生注册请求

import { query } from '../utils/db.js';
import { hashPassword, generateToken } from '../utils/auth.js';

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
    const {
      username,
      password,
      studentId,
      name,
      gender,
      age,
      class: className,
      major,
    } = body;

    // 验证必填字段
    if (!username || !password || !studentId || !name) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '用户名、密码、学号和姓名都是必填项',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '密码长度至少为6位',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 检查用户名是否已存在
    const existingUser = await query(
      'SELECT id FROM students WHERE username = $1',
      [username]
    );
    if (existingUser.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '用户名已存在',
        }),
        {
          status: 409,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 检查学号是否已存在
    const existingStudent = await query(
      'SELECT id FROM students WHERE student_id = $1',
      [studentId]
    );
    if (existingStudent.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '学号已存在',
        }),
        {
          status: 409,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 加密密码
    const passwordHash = await hashPassword(password);

    // 插入新学生记录
    const result = await query(
      `INSERT INTO students (
        username, password_hash, student_id, name, gender, age, class, major, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, username, student_id, name, gender, age, class, major`,
      [username, passwordHash, studentId, name, gender || null, age || null, className || null, major || null]
    );

    const newStudent = result[0];

    // 生成JWT token
    const token = generateToken({
      id: newStudent.id,
      username: newStudent.username,
      userType: 'student',
      studentId: newStudent.student_id,
    });

    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        message: '注册成功',
        token: token,
        user: {
          id: newStudent.id,
          username: newStudent.username,
          studentId: newStudent.student_id,
          name: newStudent.name,
          userType: 'student',
        },
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('注册错误:', error);
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

