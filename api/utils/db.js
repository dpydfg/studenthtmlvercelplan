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
 * @param {string} queryText - SQL查询语句（使用$1, $2等占位符）
 * @param {Array} params - 查询参数数组
 * @returns {Promise} 查询结果
 */
export async function query(queryText, params = []) {
  try {
    // Neon serverless驱动使用参数化查询
    // 第一个参数是SQL语句，第二个参数是参数数组
    const result = await sql(queryText, params);
    return result;
  } catch (error) {
    console.error('数据库查询错误:', error);
    console.error('查询语句:', queryText);
    console.error('参数:', params);
    throw error;
  }
}

export default sql;

