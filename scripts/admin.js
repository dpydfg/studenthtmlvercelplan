// 管理员页面逻辑

import { checkAuth, displayUserInfo, logout, authenticatedFetch } from './auth.js';

// 当前页码
let currentPage = 1;
let currentSearch = '';

// 页面加载时初始化
window.checkAuth = checkAuth;
window.logout = logout;

/**
 * 加载学生列表
 */
async function loadStudents(page = 1, search = '') {
  currentPage = page;
  currentSearch = search;
  
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="loading">加载中...</td></tr>';
  
  try {
    let url = `/api/students/list?page=${page}&pageSize=10`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    const response = await authenticatedFetch(url);
    const data = await response.json();
    
    if (data.success) {
      displayStudents(data.data);
      displayPagination(data.pagination);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="error-message">${data.message || '加载失败'}</td></tr>`;
    }
  } catch (error) {
    console.error('加载学生列表错误:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="error-message">网络错误，请稍后重试</td></tr>';
  }
}

/**
 * 显示学生列表
 */
function displayStudents(students) {
  const tbody = document.getElementById('studentsTableBody');
  
  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">暂无学生数据</td></tr>';
    return;
  }
  
  tbody.innerHTML = students.map(student => `
    <tr>
      <td>${escapeHtml(student.student_id || '')}</td>
      <td>${escapeHtml(student.name || '')}</td>
      <td>${escapeHtml(student.gender || '')}</td>
      <td>${student.age || ''}</td>
      <td>${escapeHtml(student.class || '')}</td>
      <td>${escapeHtml(student.major || '')}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm" onclick="editStudent(${student.id})">编辑</button>
          <button class="btn btn-danger btn-sm" onclick="deleteStudent(${student.id}, '${escapeHtml(student.name || '')}')">删除</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * 显示分页
 */
function displayPagination(pagination) {
  const paginationEl = document.getElementById('pagination');
  
  if (pagination.totalPages <= 1) {
    paginationEl.innerHTML = '';
    return;
  }
  
  let html = '';
  
  // 上一页按钮
  html += `<button ${pagination.page === 1 ? 'disabled' : ''} onclick="loadStudents(${pagination.page - 1}, '${currentSearch}')">上一页</button>`;
  
  // 页码信息
  html += `<span class="page-info">第 ${pagination.page} 页 / 共 ${pagination.totalPages} 页 (共 ${pagination.total} 条)</span>`;
  
  // 下一页按钮
  html += `<button ${pagination.page === pagination.totalPages ? 'disabled' : ''} onclick="loadStudents(${pagination.page + 1}, '${currentSearch}')">下一页</button>`;
  
  paginationEl.innerHTML = html;
}

/**
 * 搜索学生
 */
window.searchStudents = function() {
  const searchInput = document.getElementById('searchInput');
  loadStudents(1, searchInput.value.trim());
};

/**
 * 处理搜索输入框回车
 */
window.handleSearch = function(event) {
  if (event.key === 'Enter') {
    searchStudents();
  }
};

/**
 * 显示添加学生模态框
 */
window.showAddModal = function() {
  const modal = document.getElementById('studentModal');
  const form = document.getElementById('studentForm');
  const title = document.getElementById('modalTitle');
  
  title.textContent = '添加学生';
  form.reset();
  document.getElementById('studentId').value = '';
  document.getElementById('modalPassword').required = true;
  
  modal.style.display = 'flex';
};

/**
 * 编辑学生
 */
window.editStudent = async function(studentId) {
  try {
    const response = await authenticatedFetch(`/api/students/get?id=${studentId}`);
    const data = await response.json();
    
    if (data.success) {
      const student = data.data;
      const modal = document.getElementById('studentModal');
      const form = document.getElementById('studentForm');
      const title = document.getElementById('modalTitle');
      
      title.textContent = '编辑学生';
      document.getElementById('studentId').value = student.id;
      document.getElementById('modalUsername').value = student.username || '';
      document.getElementById('modalPassword').value = '';
      document.getElementById('modalPassword').required = false;
      document.getElementById('modalStudentId').value = student.student_id || '';
      document.getElementById('modalName').value = student.name || '';
      document.getElementById('modalGender').value = student.gender || '';
      document.getElementById('modalAge').value = student.age || '';
      document.getElementById('modalClass').value = student.class || '';
      document.getElementById('modalMajor').value = student.major || '';
      
      modal.style.display = 'flex';
    } else {
      alert(data.message || '获取学生信息失败');
    }
  } catch (error) {
    console.error('获取学生信息错误:', error);
    alert('网络错误，请稍后重试');
  }
};

/**
 * 删除学生
 */
window.deleteStudent = async function(studentId, studentName) {
  if (!confirm(`确定要删除学生 "${studentName}" 吗？此操作不可恢复！`)) {
    return;
  }
  
  try {
    const response = await authenticatedFetch(`/api/students/delete?id=${studentId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('删除成功');
      loadStudents(currentPage, currentSearch);
    } else {
      alert(data.message || '删除失败');
    }
  } catch (error) {
    console.error('删除学生错误:', error);
    alert('网络错误，请稍后重试');
  }
};

/**
 * 关闭模态框
 */
window.closeModal = function() {
  const modal = document.getElementById('studentModal');
  modal.style.display = 'none';
  const errorMessage = document.getElementById('modalErrorMessage');
  errorMessage.style.display = 'none';
};

/**
 * 转义HTML，防止XSS攻击
 */
function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 学生表单提交处理
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('studentForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorMessage = document.getElementById('modalErrorMessage');
      errorMessage.style.display = 'none';
      
      const formData = {
        id: document.getElementById('studentId').value,
        username: document.getElementById('modalUsername').value,
        password: document.getElementById('modalPassword').value,
        studentId: document.getElementById('modalStudentId').value,
        name: document.getElementById('modalName').value,
        gender: document.getElementById('modalGender').value,
        age: document.getElementById('modalAge').value ? parseInt(document.getElementById('modalAge').value) : null,
        class: document.getElementById('modalClass').value,
        major: document.getElementById('modalMajor').value,
      };
      
      // 如果是编辑且密码为空，则不发送密码字段
      if (formData.id && !formData.password) {
        delete formData.password;
      }
      
      try {
        const isEdit = !!formData.id;
        const url = isEdit ? '/api/students/update' : '/api/students/create';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await authenticatedFetch(url, {
          method,
          body: JSON.stringify(formData),
        });
        
        const data = await response.json();
        
        if (data.success) {
          closeModal();
          loadStudents(currentPage, currentSearch);
          alert(isEdit ? '更新成功' : '添加成功');
        } else {
          errorMessage.textContent = data.message || '操作失败';
          errorMessage.style.display = 'block';
        }
      } catch (error) {
        console.error('保存学生错误:', error);
        errorMessage.textContent = '网络错误，请稍后重试';
        errorMessage.style.display = 'block';
      }
    });
  }
  
  // 显示用户信息
  displayUserInfo('userInfo');
  
  // 点击模态框外部关闭
  const modal = document.getElementById('studentModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
});

// 导出函数供全局使用
window.loadStudents = loadStudents;

