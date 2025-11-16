// 删除学生API
// 仅管理员可以删除学生

import { query } from '../utils/db.js';
import { authenticateRequest } from '../utils/auth.js';

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许DELETE请求
  if (req.method !== 'DELETE') {
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

    // 检查是否为管理员
    if (user.userType !== 'admin') {
      res.status(403).json({
        success: false,
        message: '只有管理员可以删除学生',
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

    // 检查学生是否存在
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

    // 删除学生
    await query('DELETE FROM students WHERE id = $1', [studentId]);

    res.status(200).json({
      success: true,
      message: '学生删除成功',
    });
  } catch (error) {
    console.error('删除学生错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误: ' + error.message,
    });
  }
}
