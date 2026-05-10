/**
 * Dev-only: phục vụ GET /api/dashboard-snapshot
 * — Nếu file trong data/raw/rust/ mới hơn features_dataset.csv → chạy integrate --rust-collect --merge
 * — Nếu dataset / snapshot lỗi thời → chạy export_dashboard_snapshot.py
 * Repo root = thư mục cha của kds-guard-dashboard (DOANCOSO).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import type { Plugin } from 'vite';

function maxMtimeRustCsv(rustDir: string): number {
  if (!fs.existsSync(rustDir)) return 0;
  let max = 0;
  for (const name of fs.readdirSync(rustDir)) {
    if (!name.toLowerCase().endsWith('.csv')) continue;
    const st = fs.statSync(path.join(rustDir, name));
    max = Math.max(max, st.mtimeMs);
  }
  return max;
}

function pythonCmd(): string {
  return process.platform === 'win32' ? 'python' : 'python3';
}

function syncDatasetAndSnapshot(repoRoot: string): void {
  const rustDir = path.join(repoRoot, 'data', 'raw', 'rust');
  const featuresCsv = path.join(repoRoot, 'data', 'features_dataset.csv');
  const snapJson = path.join(repoRoot, 'kds-guard-dashboard', 'src', 'data', 'dashboard_snapshot.json');

  const rustMax = maxMtimeRustCsv(rustDir);
  const featMs = fs.existsSync(featuresCsv) ? fs.statSync(featuresCsv).mtimeMs : 0;
  const snapMs = fs.existsSync(snapJson) ? fs.statSync(snapJson).mtimeMs : 0;

  const py = pythonCmd();
  const env = {
    ...process.env,
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
  };

  let merged = false;
  if (rustMax > 0 && rustMax > featMs) {
    execFileSync(py, ['scripts/integrate_datasets.py', '--rust-collect', '--merge'], {
      cwd: repoRoot,
      stdio: 'pipe',
      timeout: 600_000,
      env,
    });
    merged = true;
  }

  const featMsNow = fs.existsSync(featuresCsv) ? fs.statSync(featuresCsv).mtimeMs : 0;
  const snapMsNow = fs.existsSync(snapJson) ? fs.statSync(snapJson).mtimeMs : 0;

  if (merged || !fs.existsSync(snapJson) || featMsNow > snapMsNow) {
    execFileSync(py, ['scripts/export_dashboard_snapshot.py'], {
      cwd: repoRoot,
      stdio: 'pipe',
      timeout: 120_000,
      env,
    });
  }
}

export function dashboardSnapshotDevPlugin(): Plugin {
  const dashboardDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(dashboardDir, '..');

  return {
    name: 'dashboard-snapshot-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/dashboard-snapshot', (_req, res, next) => {
        try {
          syncDatasetAndSnapshot(repoRoot);
          const snapPath = path.join(
            repoRoot,
            'kds-guard-dashboard',
            'src',
            'data',
            'dashboard_snapshot.json',
          );
          if (!fs.existsSync(snapPath)) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'dashboard_snapshot.json not found after export' }));
            return;
          }
          const body = fs.readFileSync(snapPath, 'utf8');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(body);
        } catch (e) {
          next(e);
        }
      });
    },
  };
}
