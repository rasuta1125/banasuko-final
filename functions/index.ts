import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './api/auth/login';
import userRoutes from './api/user/profile';
import analysisRoutes from './api/analysis/single';

const app = new Hono();

// CORS設定
app.use('*', cors({
  origin: ['https://banasuko-clean.pages.dev', 'http://localhost:3000', 'http://localhost:8788'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ヘルスチェック
app.get('/', (c) => {
  return c.json({
    message: 'Banasuko API Server (Clean Version)',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// APIルートの統合
app.route('/api/auth', authRoutes);
app.route('/api/user', userRoutes);
app.route('/api/analysis', analysisRoutes);

// 404ハンドラー
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'APIエンドポイントが見つかりません'
  }, 404);
});

// エラーハンドラー
app.onError((err, c) => {
  console.error('Application error:', err);
  return c.json({
    success: false,
    error: 'サーバーエラーが発生しました'
  }, 500);
});

export default app;
