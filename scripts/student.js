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

// 保存当前学生信息，用于编辑
let currentStudentData = null;

/**
 * 显示学生信息
 */
function displayStudentInfo(student) {
  const infoContainer = document.getElementById('studentInfo');
  
  // 保存学生数据供编辑使用
  currentStudentData = student;
  
  // 显示编辑按钮
  const editBtn = document.getElementById('editBtn');
  if (editBtn) {
    editBtn.style.display = 'inline-block';
  }
  
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

/**
 * 显示编辑模态框
 */
window.showEditModal = function() {
  if (!currentStudentData) {
    alert('学生信息未加载，请稍后再试');
    return;
  }
  
  const modal = document.getElementById('editModal');
  const form = document.getElementById('editForm');
  
  // 填充表单数据
  document.getElementById('editName').value = currentStudentData.name || '';
  document.getElementById('editGender').value = currentStudentData.gender || '';
  document.getElementById('editAge').value = currentStudentData.age || '';
  document.getElementById('editClass').value = currentStudentData.class || '';
  document.getElementById('editMajor').value = currentStudentData.major || '';
  document.getElementById('editPassword').value = '';
  
  // 隐藏错误信息
  document.getElementById('editErrorMessage').style.display = 'none';
  
  modal.style.display = 'flex';
};

/**
 * 关闭编辑模态框
 */
window.closeEditModal = function() {
  const modal = document.getElementById('editModal');
  modal.style.display = 'none';
  const errorMessage = document.getElementById('editErrorMessage');
  errorMessage.style.display = 'none';
};

// 编辑表单提交处理
document.addEventListener('DOMContentLoaded', () => {
  displayUserInfo('userInfo');
  
  const editForm = document.getElementById('editForm');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorMessage = document.getElementById('editErrorMessage');
      errorMessage.style.display = 'none';
      
      // 获取当前用户ID
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        errorMessage.textContent = '用户信息不存在，请重新登录';
        errorMessage.style.display = 'block';
        return;
      }
      
      const user = JSON.parse(userStr);
      
      // 收集表单数据
      const formData = {
        id: user.id,
        name: document.getElementById('editName').value,
        gender: document.getElementById('editGender').value,
        age: document.getElementById('editAge').value ? parseInt(document.getElementById('editAge').value) : null,
        class: document.getElementById('editClass').value,
        major: document.getElementById('editMajor').value,
      };
      
      // 如果密码不为空，则添加密码字段
      const password = document.getElementById('editPassword').value;
      if (password) {
        formData.password = password;
      }
      
      try {
        const response = await authenticatedFetch('/api/students/update', {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (data.success) {
          closeEditModal();
          // 重新加载学生信息
          loadStudentInfo();
          alert('信息更新成功');
        } else {
          errorMessage.textContent = data.message || '更新失败';
          errorMessage.style.display = 'block';
        }
      } catch (error) {
        console.error('更新学生信息错误:', error);
        errorMessage.textContent = '网络错误，请稍后重试';
        errorMessage.style.display = 'block';
      }
    });
  }
  
  // 点击模态框外部关闭
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeEditModal();
      }
    });
  }
});

// 导出函数供全局使用
window.loadStudentInfo = loadStudentInfo;

