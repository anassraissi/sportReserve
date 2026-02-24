import dotenv from 'dotenv';
dotenv.config();

console.log('\n=== Email Configuration Test ===\n');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '****' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('\n===============================\n');

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  console.log('✅ Email credentials are loaded!');
} else {
  console.log('❌ Email credentials missing!');
}
