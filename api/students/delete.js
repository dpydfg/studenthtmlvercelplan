// 删除学生API
// 仅管理员可以删除学生

import { query } from '../utils/db.js';
import { authenticateRequest } from '../utils/auth.js';

export default async function handler(req) {
  // 只允许DELETE请求
  if (req.method !== 'DELETE') {
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

    // 检查是否为管理员
    if (user.userType !== 'admin') {
      return new Response(
        JSON.stringify({
          success: false,
          message: '只有管理员可以删除学生',
        }),
        {
          status: 403,
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

    // 检查学生是否存在
    const existingStudent = await query(
      'SELECT id, name FROM students WHERE id = $1',
      [studentId]
    );
    if (existingStudent.length === 0) {
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

    // 删除学生
    await query('DELETE FROM students WHERE id = $1', [studentId]);

    return new Response(
      JSON.stringify({
        success: true,
        message: '学生删除成功',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    );
  } catch (error) {
    console.error('删除学生错误:', error);
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

