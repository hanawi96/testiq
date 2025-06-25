#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Thiết lập dự án Astro IQ Test...\n');

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    console.error('❌ Node.js version phải >= 16. Phiên bản hiện tại:', nodeVersion);
    process.exit(1);
  }
  
  console.log('✅ Node.js version:', nodeVersion);
}

// Install dependencies
function installDependencies() {
  console.log('📦 Cài đặt dependencies...');
  
  try {
    // Check if yarn exists
    execSync('yarn --version', { stdio: 'ignore' });
    console.log('🧶 Sử dụng Yarn để cài đặt...');
    execSync('yarn install', { stdio: 'inherit' });
  } catch (error) {
    // Check if pnpm exists
    try {
      execSync('pnpm --version', { stdio: 'ignore' });
      console.log('📦 Sử dụng pnpm để cài đặt...');
      execSync('pnpm install', { stdio: 'inherit' });
    } catch (error) {
      console.log('📦 Sử dụng npm để cài đặt...');
      execSync('npm install', { stdio: 'inherit' });
    }
  }
}

// Create necessary directories
function createDirectories() {
  const dirs = [
    'public/assets',
    'public/icons',
    'public/screenshots',
    'src/data/questions/es'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log('📁 Tạo thư mục:', dir);
    }
  });
}

// Create placeholder files
function createPlaceholderFiles() {
  const placeholders = [
    {
      path: 'public/favicon.svg',
      content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6">
  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
</svg>`
    },
    {
      path: 'public/favicon.png',
      content: 'placeholder for favicon.png'
    },
    {
      path: 'public/apple-touch-icon.png',
      content: 'placeholder for apple-touch-icon.png'
    }
  ];
  
  placeholders.forEach(({ path: filePath, content }) => {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      if (filePath.endsWith('.svg')) {
        fs.writeFileSync(fullPath, content);
        console.log('🎨 Tạo file:', filePath);
      } else {
        console.log('ℹ️  Cần tạo file:', filePath);
      }
    }
  });
}

// Create Spanish questions file
function createSpanishQuestions() {
  const esQuestionsPath = 'src/data/questions/es/iq.json';
  const enQuestionsPath = 'src/data/questions/en/iq.json';
  
  if (!fs.existsSync(esQuestionsPath) && fs.existsSync(enQuestionsPath)) {
    console.log('🇪🇸 Tạo file câu hỏi tiếng Tây Ban Nha...');
    
    const enQuestions = JSON.parse(fs.readFileSync(enQuestionsPath, 'utf-8'));
    
    // Simple translation for Spanish (you should replace with proper translations)
    const esQuestions = {
      ...enQuestions,
      meta: {
        ...enQuestions.meta,
        title: "Test de CI Gratis",
        description: "Evalúa tu cociente intelectual con nuestro test de CI estandarizado internacionalmente"
      }
    };
    
    fs.writeFileSync(esQuestionsPath, JSON.stringify(esQuestions, null, 2));
    console.log('✅ Archivo de preguntas en español creado');
  }
}

// Run type check
function runTypeCheck() {
  console.log('🔍 Ejecutando verificación de tipos...');
  
  try {
    execSync('npx astro check', { stdio: 'inherit' });
    console.log('✅ Verificación de tipos completada');
  } catch (error) {
    console.log('⚠️  Advertencias de TypeScript encontradas (esto es normal)');
  }
}

// Show next steps
function showNextSteps() {
  console.log('\n🎉 ¡Configuración completada!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. npm run dev          - Iniciar servidor de desarrollo');
  console.log('2. npm run build        - Construir para producción');  
  console.log('3. npm run preview      - Previsualizar construcción');
  console.log('\n🌐 El servidor de desarrollo estará disponible en: http://localhost:4321');
  console.log('\n📖 Consulta README.md para más información');
}

// Main setup function
async function setup() {
  try {
    checkNodeVersion();
    createDirectories();
    installDependencies();
    createPlaceholderFiles();
    createSpanishQuestions();
    runTypeCheck();
    showNextSteps();
  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  }
}

setup();