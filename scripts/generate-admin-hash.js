// 生成admin密码哈希值的脚本
// 使用方法: node scripts/generate-admin-hash.js

import bcrypt from 'bcryptjs';

const password = 'admin';
const saltRounds = 10;

console.log('正在生成admin密码的bcrypt哈希值...');
console.log('密码:', password);
console.log('Salt Rounds:', saltRounds);
console.log('');

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log('✅ 生成的哈希值:');
    console.log(hash);
    console.log('');
    console.log('📋 请在Neon数据库中执行以下SQL:');
    console.log('');
    console.log('-- 方法1: 更新现有记录');
    console.log(`UPDATE admins SET password_hash = '${hash}' WHERE username = 'admin';`);
    console.log('');
    console.log('-- 方法2: 删除后重新插入');
    console.log('DELETE FROM admins WHERE username = \'admin\';');
    console.log(`INSERT INTO admins (username, password_hash, created_at)`);
    console.log(`VALUES ('admin', '${hash}', NOW());`);
    console.log('');
    console.log('验证: 使用用户名 admin 和密码 admin 登录');
  })
  .catch(error => {
    console.error('生成哈希值时出错:', error);
  });











