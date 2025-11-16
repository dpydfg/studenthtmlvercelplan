// 学生页面逻辑

import { checkAuth, displayUserInfo, logout, authenticatedFetch } from './auth.js';

// 页面加载时初始化
window.checkAuth = checkAuth;
window.logout = logout;

/**
 * 加载学生个人信息
 */
async function loadStudentInfo() {
  const infoContainer = document.getElementById('studentInfo');
  infoContainer.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    // 获取当前用户信息
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('用户信息不存在');
    }
    
    const user = JSON.parse(userStr);
    
    // 获取学生详细信息
    const response = await authenticatedFetch(`/api/students/get?id=${user.id}`);
    const data = await response.json();
    
    if (data.success) {
      displayStudentInfo(data.data);
    } else {
      infoContainer.innerHTML = `<div class="error-message">${data.message || '加载失败'}</div>`;
    }
  } catch (error) {
    console.error('加载学生信息错误:', error);
    infoContainer.innerHTML = '<div class="error-message">网络错误，请稍后重试</div>';
  }
}

/**
 * 显示学生信息
 */
function displayStudentInfo(student) {
  const infoContainer = document.getElementById('studentInfo');
  
  const infoItems = [
    { label: '学号', value: student.student_id || '' },
    { label: '用户名', value: student.username || '' },
    { label: '姓名', value: student.name || '' },
    { label: '性别', value: student.gender || '' },
    { label: '年龄', value: student.age || '' },
    { label: '班级', value: student.class || '' },
    { label: '专业', value: student.major || '' },
    { label: '注册时间', value: student.created_at ? new Date(student.created_at).toLocaleString('zh-CN') : '' },
    { label: '更新时间', value: student.updated_at ? new Date(student.updated_at).toLocaleString('zh-CN') : '' },
  ];
  
  infoContainer.innerHTML = infoItems.map(item => `
    <div class="info-item">
      <span class="info-label">${escapeHtml(item.label)}：</span>
      <span class="info-value">${escapeHtml(item.value || '未填写')}</span>
    </div>
  `).join('');
}

/**
 * 转义HTML，防止XSS攻击
 */
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 页面加载时显示用户信息
document.addEventListener('DOMContentLoaded', () => {
  displayUserInfo('userInfo');
});

// 导出函数供全局使用
window.loadStudentInfo = loadStudentInfo;

