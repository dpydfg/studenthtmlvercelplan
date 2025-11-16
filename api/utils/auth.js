// 认证工具模块
// 提供JWT token生成/验证和密码加密功能

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT密钥，从环境变量获取，如果没有则使用默认值（生产环境必须设置）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Token过期时间（7天）
const TOKEN_EXPIRES_IN = '7d';

/**
 * 生成JWT token
 * @param {Object} payload - token载荷（包含用户ID、用户名、角色等）
 * @returns {string} JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

/**
 * 验证JWT token
 * @param {string} token - 要验证的token
 * @returns {Object|null} 解码后的token数据，如果无效则返回null
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token验证失败:', error);
    return null;
  }
}

/**
 * 加密密码
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 加密后的密码哈希
 */
export async function hashPassword(password) {
  const saltRounds = 10; // 加密强度
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 密码哈希
 * @returns {Promise<boolean>} 密码是否匹配
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * 从请求头中提取token
 * @param {Object} headers - 请求头对象
 * @returns {string|null} token字符串，如果不存在则返回null
 */
export function extractTokenFromHeaders(headers) {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader) {
    return null;
  }
  
  // 支持 "Bearer <token>" 格式
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }
  
  return authHeader;
}

/**
 * 中间件：验证请求中的token
 * @param {Object} req - 请求对象
 * @returns {Object|null} 解码后的token数据，如果无效则返回null
 */
export function authenticateRequest(req) {
  const token = extractTokenFromHeaders(req.headers);
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

