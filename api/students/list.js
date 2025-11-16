// 获取学生列表API
// 管理员可以查看所有学生，学生只能查看自己的信息

import { query } from '../utils/db.js';
import { authenticateRequest } from '../utils/auth.js';

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
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

    // 获取查询参数
    const url = new URL(req.url, `http://${req.headers.host}`);
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
      res.status(403).json({
        success: false,
        message: '无效的用户类型',
      });
      return;
    }

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
  } catch (error) {
    console.error('获取学生列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message,
    });
  }
}
