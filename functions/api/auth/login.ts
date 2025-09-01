import { Hono } from 'hono';

const app = new Hono();

// Firebase REST API設定（初代バナスコと同じ）
const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY;
const FIREBASE_AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1/accounts:";

// 初代バナスコのsign_in_with_email_and_password関数を移植
async function signInWithEmailAndPassword(email: string, password: string) {
  const url = `${FIREBASE_AUTH_BASE_URL}signInWithPassword?key=${FIREBASE_API_KEY}`;
  const data = { email, password, returnSecureToken: true };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// 初代バナスコのcreate_user_with_email_and_password関数を移植
async function createUserWithEmailAndPassword(email: string, password: string) {
  const url = `${FIREBASE_AUTH_BASE_URL}signUp?key=${FIREBASE_API_KEY}`;
  const data = { email, password, returnSecureToken: true };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// ログインAPI（初代バナスコのロジックを移植）
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ 
        success: false, 
        error: 'メールアドレスとパスワードを入力してください' 
      }, 400);
    }

    // 初代バナスコの認証ロジックを使用
    const userInfo = await signInWithEmailAndPassword(email, password);
    
    // セッションクッキーを設定（初代バナスコのセッション管理を模倣）
    c.header('Set-Cookie', `bn_session=${userInfo.idToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);
    
    return c.json({
      success: true,
      user: {
        uid: userInfo.localId,
        email: userInfo.email,
        idToken: userInfo.idToken
      },
      message: 'ログインに成功しました'
    });
    
  } catch (error: any) {
    console.error('Login error:', error);
    
    // 初代バナスコのエラーハンドリングを移植
    if (error.message.includes('EMAIL_NOT_FOUND')) {
      return c.json({ 
        success: false, 
        error: 'ユーザーが見つかりません' 
      }, 401);
    } else if (error.message.includes('INVALID_PASSWORD')) {
      return c.json({ 
        success: false, 
        error: 'パスワードが間違っています' 
      }, 401);
    } else if (error.message.includes('INVALID_EMAIL')) {
      return c.json({ 
        success: false, 
        error: 'メールアドレスの形式が正しくありません' 
      }, 400);
    } else {
      return c.json({ 
        success: false, 
        error: 'ログインに失敗しました' 
      }, 500);
    }
  }
});

// 新規登録API（初代バナスコのロジックを移植）
app.post('/register', async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ 
        success: false, 
        error: 'メールアドレスとパスワードを入力してください' 
      }, 400);
    }

    if (password.length < 6) {
      return c.json({ 
        success: false, 
        error: 'パスワードは6文字以上で入力してください' 
      }, 400);
    }

    // 初代バナスコのユーザー作成ロジックを使用
    const userInfo = await createUserWithEmailAndPassword(email, password);
    
    // セッションクッキーを設定
    c.header('Set-Cookie', `bn_session=${userInfo.idToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`);
    
    return c.json({
      success: true,
      user: {
        uid: userInfo.localId,
        email: userInfo.email,
        idToken: userInfo.idToken
      },
      message: 'アカウントを作成し、ログインしました'
    });
    
  } catch (error: any) {
    console.error('Register error:', error);
    
    // 初代バナスコのエラーハンドリングを移植
    if (error.message.includes('EMAIL_EXISTS')) {
      return c.json({ 
        success: false, 
        error: 'このメールアドレスは既に使用されています' 
      }, 409);
    } else if (error.message.includes('WEAK_PASSWORD')) {
      return c.json({ 
        success: false, 
        error: 'パスワードが弱すぎます（6文字以上必要）' 
      }, 400);
    } else {
      return c.json({ 
        success: false, 
        error: 'アカウント作成に失敗しました' 
      }, 500);
    }
  }
});

// ログアウトAPI
app.post('/logout', async (c) => {
  // セッションクッキーをクリア
  c.header('Set-Cookie', 'bn_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
  
  return c.json({
    success: true,
    message: 'ログアウトしました'
  });
});

export default app;
