// 认证相关工具函数

/**
 * 检查用户是否已登录
 * @returns {Object|null} 用户信息对象，如果未登录则返回null
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return null;
  }
  
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

/**
 * 获取认证token
 * @returns {string|null} token字符串，如果不存在则返回null
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * 检查认证状态，如果未登录则跳转到登录页
 * @param {string} requiredUserType - 需要的用户类型（'admin' 或 'student'），如果为null则不检查类型
 * @returns {boolean} 是否已认证
 */
export function checkAuth(requiredUserType = null) {
  const token = getToken();
  const user = getCurrentUser();
  
  if (!token || !user) {
    localStorage.clear();
    window.location.href = '/index.html';
    return false;
  }
  
  if (requiredUserType && user.userType !== requiredUserType) {
    // 用户类型不匹配，跳转到对应的页面
    if (user.userType === 'admin') {
      window.location.href = '/admin.html';
    } else {
      window.location.href = '/student.html';
    }
    return false;
  }
  
  return true;
}

/**
 * 退出登录
 */
export function logout() {
  if (confirm('确定要退出登录吗？')) {
    localStorage.clear();
    window.location.href = '/index.html';
  }
}

/**
 * 显示用户信息
 * @param {string} elementId - 显示用户信息的元素ID
 */
export function displayUserInfo(elementId) {
  const user = getCurrentUser();
  const element = document.getElementById(elementId);
  
  if (element && user) {
    const userTypeText = user.userType === 'admin' ? '管理员' : '学生';
    element.textContent = `${userTypeText}: ${user.username}`;
  }
}

/**
 * 创建带认证头的fetch请求
 * @param {string} url - 请求URL
 * @param {Object} options - fetch选项
 * @returns {Promise<Response>} fetch响应
 */
export async function authenticatedFetch(url, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

