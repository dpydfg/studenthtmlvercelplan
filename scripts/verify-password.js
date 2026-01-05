// 验证密码哈希值的脚本
// 使用方法: node scripts/verify-password.js

import bcrypt from 'bcryptjs';

const password = 'admin';
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

console.log('验证密码哈希值...');
console.log('密码:', password);
console.log('哈希值:', hash);

bcrypt.compare(password, hash)
  .then(isMatch => {
    if (isMatch) {
      console.log('✅ 密码哈希值验证成功！这个哈希值对应密码"admin"');
    } else {
      console.log('❌ 密码哈希值验证失败！这个哈希值不对应密码"admin"');
      console.log('\n生成新的密码哈希值:');
      return bcrypt.hash(password, 10);
    }
  })
  .then(newHash => {
    if (newHash) {
      console.log('新的哈希值:', newHash);
      console.log('\n请使用以下SQL更新数据库:');
      console.log(`UPDATE admins SET password_hash = '${newHash}' WHERE username = 'admin';`);
    }
  })
  .catch(error => {
    console.error('错误:', error);
  });

