// 获取单个学生信息API

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

    // 获取学生ID
    const url = new URL(req.url, `http://${req.headers.host}`);
    const studentId = url.searchParams.get('id');

    if (!studentId) {
      res.status(400).json({
        success: false,
        message: '缺少学生ID参数',
      });
      return;
    }

    // 查询学生信息
    const result = await query(
      `SELECT id, student_id, username, name, gender, age, class, major, created_at, updated_at
       FROM students
       WHERE id = $1`,
      [studentId]
    );

    if (result.length === 0) {
      res.status(404).json({
        success: false,
        message: '学生不存在',
      });
      return;
    }

    const student = result[0];

    // 检查权限：学生只能查看自己的信息，管理员可以查看所有
    if (user.userType === 'student' && user.id !== student.id) {
      res.status(403).json({
        success: false,
        message: '无权访问该学生信息',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error('获取学生信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message,
    });
  }
}
