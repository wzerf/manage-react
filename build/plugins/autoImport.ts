import type {PluginOption} from 'vite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import AutoImport from 'unplugin-auto-import/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '../..');

export const autoImportPlugin = (): PluginOption => {
    const toPosix = (p: string) => p.replace(/\\/g, '/');
    const srcDir = toPosix(path.join(appRoot, 'src'));
    return AutoImport({
        dirs: [
            `${srcDir}/hooks/**`,
            `${srcDir}/components/**`,
            `${srcDir}/stores/**`,
            `!${srcDir}/components/common/Editor/index.ts`,
            `!${srcDir}/components/common/Editor/src/TiptapEditor/index.ts`,
            '!**/*.md',
        ],
        imports: [
            'react',
            'react-router-dom',
            'react-i18next',
            {from: 'react', imports: ['FC'], type: true},
        ],
        dts: path.join(appRoot, 'src/auto-imports.d.ts'),
        include: [/\.[tj]sx?$/],
        resolvers: [
            (name) => {
                if (name.startsWith('@/')) {
                    return {from: name.replace('@/', `${srcDir}/`)};
                }
            },
        ],
    });
};
