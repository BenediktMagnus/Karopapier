const esbuild = require('esbuild');

config = {
    entryPoints: [
        'src/frontend/scripts/pages/mainPage.ts',
        'src/frontend/scripts/pages/adminPage.ts',
        'src/frontend/scripts/pages/lobbyPage.ts',
        'src/frontend/scripts/pages/loginPage.ts'
    ],
    bundle: true,
    minify: true,
    target: 'es2021',
    platform: 'browser',
    tsconfig: 'src/frontend/tsconfig.release.json',
    outdir: 'build/frontend/',
};

esbuild.build(config).catch(() => process.exit(1));
