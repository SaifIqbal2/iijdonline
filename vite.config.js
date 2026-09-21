var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { cpSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
function copyLegacyAssets() {
    return {
        name: 'copy-legacy-assets',
        closeBundle: function () {
            var projectRoot = resolve(__dirname);
            var outputDir = resolve(projectRoot, 'dist');
            var assetDirectories = readdirSync(projectRoot, { withFileTypes: true })
                .filter(function (entry) { return entry.isDirectory() && entry.name.endsWith('_files'); })
                .map(function (entry) { return entry.name; });
            for (var _i = 0, _a = __spreadArray(__spreadArray([], assetDirectories, true), ['pb-assets'], false); _i < _a.length; _i++) {
                var directory = _a[_i];
                var source = resolve(projectRoot, directory);
                if (existsSync(source))
                    cpSync(source, resolve(outputDir, directory), { recursive: true });
            }
            var issueDirectory = resolve(projectRoot, 'issue');
            if (existsSync(issueDirectory))
                cpSync(issueDirectory, resolve(outputDir, 'issue'), { recursive: true });
            var articleDirectory = resolve(projectRoot, 'article');
            if (existsSync(articleDirectory))
                cpSync(articleDirectory, resolve(outputDir, 'article'), { recursive: true });
            for (var _b = 0, _c = ['local-single-ad-guard.js']; _b < _c.length; _b++) {
                var file = _c[_b];
                var source = resolve(projectRoot, file);
                if (existsSync(source))
                    cpSync(source, resolve(outputDir, file));
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
