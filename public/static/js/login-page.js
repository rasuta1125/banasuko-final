// Firebase Authentication for React LoginPage
// auth.js モジュールとの統合版

console.log('Login page script loaded');

// auth.js からの関数をインポートして使用
async function initLoginPageAuth() {
  // auth.jsが読み込まれるのを待つ
  let retries = 0;
  const maxRetries = 50;
  
  while (retries < maxRetries) {
    try {
      // auth.js の関数を動的インポート
      const authModule = await import('/static/js/auth.js');
      const { login, register } = authModule;
      
      console.log('Auth module loaded successfully');
      
      // デモログインボタン
      const demoLoginBtn = document.getElementById('demoLoginBtn');
      if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', async () => {
          try {
            console.log('Demo login clicked');
            await login('demo@banasuko.com', 'demo123456');
            alert('デモアカウントでログインしました！');
            window.location.href = '/dashboard';
          } catch (error) {
            console.error('Demo login error:', error);
            alert('デモログインに失敗しました: ' + error.message);
          }
        });
        console.log('Demo login button listener added');
      }
      
      // デモアカウント作成ボタン  
      const createDemoBtn = document.getElementById('createDemoBtn');
      if (createDemoBtn) {
        createDemoBtn.addEventListener('click', async () => {
          try {
            console.log('Demo creation clicked');
            await register('demo@banasuko.com', 'demo123456');
            alert('デモアカウントが作成されました！\nメール: demo@banasuko.com\nパスワード: demo123456');
            
            // フォームに値を設定
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            if (emailInput && passwordInput) {
              emailInput.value = 'demo@banasuko.com';
              passwordInput.value = 'demo123456';
            }
          } catch (error) {
            console.error('Demo creation error:', error);
            if (error.message && error.message.includes('auth/email-already-in-use')) {
              alert('デモアカウントは既に存在します！\nメール: demo@banasuko.com\nパスワード: demo123456\n\n上記でログインしてください。');
              
              // フォームに値を設定
              const emailInput = document.getElementById('email');
              const passwordInput = document.getElementById('password');
              if (emailInput && passwordInput) {
                emailInput.value = 'demo@banasuko.com';
                passwordInput.value = 'demo123456';
              }
            } else {
              alert('デモアカウント作成に失敗しました: ' + error.message);
            }
          }
        });
        console.log('Demo creation button listener added');
      }
      
      // ログインフォーム
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email')?.value?.trim();
          const password = document.getElementById('password')?.value;
          
          if (!email || !password) {
            alert('メールアドレスとパスワードを入力してください');
            return;
          }
          
          try {
            console.log('Login form submitted');
            await login(email, password);
            alert('ログインに成功しました！');
            window.location.href = '/dashboard';
          } catch (error) {
            console.error('Login error:', error);
            alert('ログインに失敗しました: ' + error.message);
          }
        });
        console.log('Login form listener added');
      }
      
      break; // 成功したらループを抜ける
      
    } catch (error) {
      retries++;
      console.log('Waiting for auth.js to load... attempt', retries);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  if (retries >= maxRetries) {
    console.error('Failed to load auth module after', maxRetries, 'attempts');
  }
}

// ページ読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('Login page DOMContentLoaded');
  
  // 少し遅延させてauth.jsの読み込みを待つ
  setTimeout(() => {
    initLoginPageAuth();
  }, 500);
});