import { Hono } from 'hono';

const app = new Hono();

// セッション管理用のユーザーストア（本番ではRedis等を使用）
const userSessions = new Map<string, any>();

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    // デモユーザーの認証
    if (email === 'demo@banasuko.com' && password === 'demo123') {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userData = {
        uid: 'demo_user_123',
        email: 'demo@banasuko.com',
        displayName: 'Demo User',
        plan: 'free'
      };

      userSessions.set(sessionId, userData);

      // HTTP-only cookieを設定
      c.header('Set-Cookie', `bn_session=${sessionId}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);

      return c.json({
        success: true,
        user: userData,
        message: 'ログインに成功しました'
      });
    }

    // 実際のユーザー認証（簡易版）
    if (email && password && password.length >= 6) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userData = {
        uid: `user_${Date.now()}`,
        email: email,
        displayName: email.split('@')[0],
        plan: 'free'
      };

      userSessions.set(sessionId, userData);

      // HTTP-only cookieを設定
      c.header('Set-Cookie', `bn_session=${sessionId}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);

      return c.json({
        success: true,
        user: userData,
        message: 'ログインに成功しました'
      });
    }

    return c.json({
      success: false,
      error: 'メールアドレスまたはパスワードが正しくありません'
    }, 401);

  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      success: false,
      error: 'ログイン処理中にエラーが発生しました'
    }, 500);
  }
});

app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, displayName } = await c.req.json();

    // バリデーション
    if (!email || !password || !displayName) {
      return c.json({
        success: false,
        error: 'すべての項目を入力してください'
      }, 400);
    }

    if (password.length < 6) {
      return c.json({
        success: false,
        error: 'パスワードは6文字以上で入力してください'
      }, 400);
    }

    // ユーザー作成（簡易版）
    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const userData = {
      uid: uid,
      email: email,
      displayName: displayName,
      plan: 'free'
    };

    userSessions.set(sessionId, userData);

    // HTTP-only cookieを設定
    c.header('Set-Cookie', `bn_session=${sessionId}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);

    return c.json({
      success: true,
      user: userData,
      message: '登録に成功しました'
    });

  } catch (error) {
    console.error('Register error:', error);
    return c.json({
      success: false,
      error: '登録処理中にエラーが発生しました'
    }, 500);
  }
});

app.post('/api/auth/logout', async (c) => {
  try {
    // セッションクッキーを削除
    c.header('Set-Cookie', 'bn_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');

    return c.json({
      success: true,
      message: 'ログアウトしました'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return c.json({
      success: false,
      error: 'ログアウト処理中にエラーが発生しました'
    }, 500);
  }
});

export default app;
