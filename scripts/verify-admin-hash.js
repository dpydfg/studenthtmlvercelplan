// 验证admin密码哈希值的脚本
// 使用方法: node scripts/verify-admin-hash.js

import bcrypt from 'bcryptjs';

const password = 'admin';
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

console.log('正在验证密码哈希值...');
console.log('密码:', password);
console.log('哈希值:', hash);
console.log('');

bcrypt.compare(password, hash)
  .then(isMatch => {
    if (isMatch) {
      console.log('✅ 验证成功！这个哈希值正确对应密码 "admin"');
      console.log('可以使用此哈希值登录。');
    } else {
      console.log('❌ 验证失败！这个哈希值不对应密码 "admin"');
      console.log('');
      console.log('正在生成新的正确哈希值...');
      return bcrypt.hash(password, 10);
    }
  })
  .then(newHash => {
    if (newHash) {
      console.log('');
      console.log('新的正确哈希值:', newHash);
      console.log('');
      console.log('请在Neon数据库中执行以下SQL:');
      console.log('UPDATE admins SET password_hash = \'' + newHash + '\' WHERE username = \'admin\';');
      console.log('');
      console.log('或者删除后重新插入:');
      console.log('DELETE FROM admins WHERE username = \'admin\';');
      console.log('INSERT INTO admins (username, password_hash, created_at)');
      console.log('VALUES (\'admin\', \'' + newHash + '\', NOW());');
    }
  })
  .catch(error => {
    console.error('验证过程中出错:', error);
  });











