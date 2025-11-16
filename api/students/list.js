// 获取学生列表API
// 管理员可以查看所有学生，学生只能查看自己的信息

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

    // 获取查询参数
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    let students;
    let totalCount;

    if (user.userType === 'admin') {
      // 管理员可以查看所有学生
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
        const countResult = await query(
          `SELECT COUNT(*) as count
           FROM students
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
         FROM students
         WHERE id = $1`,
        [user.id]
      );
      totalCount = 1;
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: '无效的用户类型',
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
        data: students,
        pagination: {
          page,
          pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
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
    console.error('获取学生列表错误:', error);
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

