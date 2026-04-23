import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      {
        name: 'copy-functions',
        closeBundle() {
          // Copy functions directory to dist after build
          const srcDir = path.resolve(__dirname, 'functions');
          const destDir = path.resolve(__dirname, 'dist/functions');
          
          if (fs.existsSync(srcDir)) {
            // Create destination directory
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            
            // Copy functions directory
            copyFolderRecursiveSync(srcDir, destDir);
            console.log('✅ Functions copied to dist/functions');
          }
        }
      }
    ],
    server: {
      port: 3000,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    define: {
      'process.env.JWT_SECRET': JSON.stringify(env.JWT_SECRET || 'your-secret-key-change-in-production'),
    },
  };
});

// Helper function to copy directories recursively (only .js files)
function copyFolderRecursiveSync(src: string, dest: string) {
  const exists = fs.existsSync(src);
  if (!exists) return;
  
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    fs.readdirSync(src).forEach((childItemName) => {
      // Skip .ts files - EdgeOne Pages only supports .js
      if (childItemName.endsWith('.ts')) {
        console.log(`⏭️  Skipping TypeScript file: ${childItemName}`);
        return;
      }
      
      const srcPath = path.join(src, childItemName);
      const destPath = path.join(dest, childItemName);
      
      copyFolderRecursiveSync(srcPath, destPath);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
