import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const GLB_FILES = [
  'wind_turbine.glb',
  'substation_bimfra.glb',
  'high_voltage_pylon.glb',
  'power_pole_3d_game_asset.glb',
  'modern_home.glb'
];

function copyRootGlbPlugin() {
  return {
    name: 'copy-root-glb-files',
    closeBundle() {
      const outDir = path.resolve('dist');
      if (!fs.existsSync(outDir)) return;
      for (const file of GLB_FILES) {
        const src = path.resolve(file);
        const dest = path.join(outDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [copyRootGlbPlugin()],
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 2000
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true
  }
});
