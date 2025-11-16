// 数据库连接工具
// 使用Neon Serverless驱动连接PostgreSQL数据库

import { neon } from '@neondatabase/serverless';

// 从环境变量获取数据库连接字符串
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL环境变量未设置');
}

// 创建数据库连接实例
const sql = neon(connectionString);

/**
 * 执行SQL查询
 * @param {string} query - SQL查询语句
 * @param {Array} params - 查询参数
 * @returns {Promise} 查询结果
 */
export async function query(query, params = []) {
  try {
    // Neon serverless驱动支持参数化查询
    const result = await sql(query, params);
    return result;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

export default sql;

