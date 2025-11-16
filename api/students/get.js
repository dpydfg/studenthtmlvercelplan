// 获取单个学生信息API

import { query } from '../utils/db.js';
import { authenticateRequest } from '../utils/auth.js';

export default async function handler(req) {
  // 只允许GET请求
  if (req.method !== 'GET') {
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
    // 验证token
    const user = authenticateRequest(req);
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '未授权，请先登录',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 获取学生ID
    const url = new URL(req.url);
    const studentId = url.searchParams.get('id');

    if (!studentId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '缺少学生ID参数',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    // 查询学生信息
    const result = await query(
      `SELECT id, student_id, username, name, gender, age, class, major, created_at, updated_at
       FROM students
       WHERE id = $1`,
      [studentId]
    );

    if (result.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '学生不存在',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    const student = result[0];

    // 检查权限：学生只能查看自己的信息，管理员可以查看所有
    if (user.userType === 'student' && user.id !== student.id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '无权访问该学生信息',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: student,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('获取学生信息错误:', error);
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

