import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tạo thư mục nếu chưa tồn tại
function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
    return true;
  }
  return false;
}

// Tạo barrel file (index.ts)
function createBarrelFile(dir, components) {
  const indexPath = path.join(dir, 'index.ts');
  const content = components
    .map(comp => {
      const name = path.basename(comp.name, path.extname(comp.name));
      return `export { default as ${name} } from './${name}';`;
    })
    .join('\n');

  fs.writeFileSync(indexPath, content);
  console.log(`Created barrel file: ${indexPath}`);
}

// Trợ giúp
if (process.argv.length < 3) {
  console.log(`
Usage: node restructure-components.js [command]

Commands:
  create-dirs             Create all directories
  create-barrel [dir]     Create barrel file for a directory
  move-file [from] [to]   Move a file
  `);
  process.exit(1);
}

// Cấu trúc thư mục mới
const newDirs = [
  // Admin
  'src/components/admin/dashboard',
  'src/components/admin/auth',
  'src/components/admin/articles',
  'src/components/admin/users',
  // Auth
  'src/components/auth/login',
  'src/components/auth/register',
  // Common
  'src/components/common/popups',
  'src/components/common/selectors',
  'src/components/common/contact',
  'src/components/common/faq',
  'src/components/common/effects',
  // Layout
  'src/components/layout/headers',
  // Leaderboard
  'src/components/leaderboard/global',
  'src/components/leaderboard/local',
  // Profile
  'src/components/profile',
  // SEO
  'src/components/seo',
  // Tests
  'src/components/tests/core',
  'src/components/tests/types/iq',
  'src/components/tests/types/eq',
  'src/components/tests/results',
  // UI
  'src/components/ui/icons'
];

// Xử lý lệnh
const command = process.argv[2];

if (command === 'create-dirs') {
  // Tạo tất cả thư mục
  newDirs.forEach(dir => createDirectory(dir));
  console.log('All directories created successfully!');
} 
else if (command === 'create-barrel') {
  // Tạo barrel file cho một thư mục
  if (process.argv.length < 4) {
    console.error('Missing directory parameter');
    process.exit(1);
  }
  
  const dir = process.argv[3];
  if (!fs.existsSync(dir)) {
    console.error(`Directory does not exist: ${dir}`);
    process.exit(1);
  }
  
  // Lấy danh sách các file trong thư mục
  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
    .filter(file => file !== 'index.ts')
    .map(file => ({ name: file }));
  
  if (files.length === 0) {
    console.error(`No .ts/.tsx files found in ${dir}`);
    process.exit(1);
  }
  
  createBarrelFile(dir, files);
}
else if (command === 'move-file') {
  // Di chuyển file
  if (process.argv.length < 5) {
    console.error('Missing from/to parameters');
    process.exit(1);
  }
  
  const fromPath = process.argv[3];
  const toPath = process.argv[4];
  
  if (!fs.existsSync(fromPath)) {
    console.error(`Source file does not exist: ${fromPath}`);
    process.exit(1);
  }
  
  // Đảm bảo thư mục đích tồn tại
  const toDir = path.dirname(toPath);
  createDirectory(toDir);
  
  // Sao chép file
  fs.copyFileSync(fromPath, toPath);
  console.log(`Copied: ${fromPath} -> ${toPath}`);
} 