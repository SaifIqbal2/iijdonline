import { cpSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function copyLegacyAssets() {
  return {
    name: 'copy-legacy-assets',
    closeBundle() {
      const projectRoot = resolve(__dirname);
      const outputDir = resolve(projectRoot, 'dist');
      const assetDirectories = readdirSync(projectRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.endsWith('_files'))
        .map((entry) => entry.name);

      for (const directory of [...assetDirectories, 'pb-assets']) {
        const source = resolve(projectRoot, directory);
        if (existsSync(source)) cpSync(source, resolve(outputDir, directory), { recursive: true });
      }

      const issueDirectory = resolve(projectRoot, 'issue');
      if (existsSync(issueDirectory)) cpSync(issueDirectory, resolve(outputDir, 'issue'), { recursive: true });
      const articleDirectory = resolve(projectRoot, 'article');
      if (existsSync(articleDirectory)) cpSync(articleDirectory, resolve(outputDir, 'article'), { recursive: true });

      for (const file of ['local-single-ad-guard.js']) {
        const source = resolve(projectRoot, file);
        if (existsSync(source)) cpSync(source, resolve(outputDir, file));
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyLegacyAssets()],
  build: {
    rollupOptions: {
      input: {
        home: 'index.html',
        admin: 'admin.html',
        articles: 'articles.html',
        inpress: 'inpress.html',
        inprogress: 'inprogress.html',
        current: 'current.html',
        issues: 'issues.html',
        targetIssue: 'issue/S1201-9712(26)X2009-4.html',
        targetArticle: 'article/S1201-9712(26)00706-X/fulltext.html'
      }
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
});
