const esbuild = require('esbuild');

config = {
    entryPoints: [
        'src/frontend/pages/mainPage.ts',
        'src/frontend/pages/adminPage.ts',
        'src/frontend/pages/lobbyPage.ts',
        'src/frontend/pages/loginPage.ts'
    ],
    bundle: true,
    minify: true,
    target: 'es2021',
    platform: 'browser',
    tsconfig: 'src/frontend/tsconfig.release.json',
    outdir: 'build/frontend/',
};

esbuild.build(config).catch(() => process.exit(1));
