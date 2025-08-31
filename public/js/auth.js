// Firebase Authentication JavaScript統合
// バナスコAI - ログイン・登録機能

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyAflp1vqSA21sSYihZDTpje-MB1mCALxBs",
  authDomain: "banasuko-auth.firebaseapp.com",
  projectId: "banasuko-auth",
  storageBucket: "banasuko-auth.firebasestorage.app",
  messagingSenderId: "753581941845",
  appId: "1:753581941845:web:18418afb254c309933e0dc",
  measurementId: "G-09515RW8KC"
};

// グローバル変数
let currentUser = null;

// 認証状態管理
class AuthManager {
  constructor() {
    this.initializeAuth();
    this.setupEventListeners();
  }

  // Firebase初期化
  async initializeAuth() {
    try {
      console.log('Firebase Auth 初期化中...');
      await this.checkAuthState();
      console.log('Firebase Auth 初期化完了');
    } catch (error) {
      console.error('Firebase Auth 初期化エラー:', error);
      this.showError('認証システムの初期化に失敗しました');
    }
  }

  // 認証状態チェック
  async checkAuthState() {
    try {
      console.log('🔍 Checking authentication state...');
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include'
      });
      
      console.log('📡 Auth check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📡 Auth check response data:', data);
        
        if (data.success) {
          this.onAuthStateChanged(data.user);
          return;
        }
      }
      this.onAuthStateChanged(null);
    } catch (error) {
      console.error('💥 認証状態チェックエラー:', error);
      this.onAuthStateChanged(null);
    }
  }

  // 認証状態変更時の処理
  onAuthStateChanged(user) {
    currentUser = user;
    if (user) {
      console.log('ユーザーがログインしています:', user.username);
      if (window.location.pathname === '/login' || window.location.pathname === '/') {
        window.location.href = '/analysis'; // ログインページにいたらダッシュボード的なページへ
      }
      this.updateUserInfo(user);
    } else {
      console.log('ユーザーはログインしていません');
      const protectedPages = ['/analysis', '/copy-generation', '/admin', '/dashboard'];
      if (protectedPages.includes(window.location.pathname)) {
        window.location.href = '/login'; // 保護されたページにいたらログインページへ
      }
    }
  }

  // イベントリスナー設定
  setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }

    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
      registerForm.addEventListener('submit', this.handleRegister.bind(this));
    }

    const demoLoginBtn = document.getElementById('demoLoginButton');
    if (demoLoginBtn) {
      demoLoginBtn.addEventListener('click', this.handleDemoLogin.bind(this));
    }

    // フォーム切り替えロジックはHTML/CSSで制御推奨ですが、現状維持
    const showRegisterBtn = document.getElementById('showRegisterForm');
    const showLoginBtn = document.getElementById('showLoginForm');
    const loginFormDiv = document.querySelector('.bg-navy-800\\/50:first-child');
    const registerFormDiv = document.getElementById('registerForm');

    if (showRegisterBtn && registerFormDiv) {
      showRegisterBtn.addEventListener('click', () => {
        loginFormDiv.style.display = 'none';
        registerFormDiv.classList.remove('hidden');
      });
    }

    if (showLoginBtn && loginFormDiv) {
      showLoginBtn.addEventListener('click', () => {
        registerFormDiv.classList.add('hidden');
        loginFormDiv.style.display = 'block';
      });
    }
    
    // ログアウトボタン
    document.addEventListener('click', (e) => {
      if (e.target.matches('.logout-btn, .logout-btn *, #logoutBtn, #logoutBtn *')) {
        e.preventDefault();
        console.log('🚪 Logout button clicked');
        this.handleLogout();
      }
    });
  }

  // ログイン処理
  async handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const isDemo = email === 'demo@banasuko.com' && password === 'demo123';
    const loginData = {
      email: email,
      password: password,
      username: isDemo ? 'demo' : email.split('@')[0]
    };

    this.setLoading(true, 'login');
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
        credentials: 'include'
      });
      
      console.log('📡 Login response status:', response.status);
      const data = await response.json();
      console.log('📡 Login response data:', data);

      if (data.success) {
        this.showSuccess('ログインしました！');
        this.onAuthStateChanged(data.user);
      } else {
        this.showError(data.error || 'ログインに失敗しました');
      }
    } catch (error) {
      console.error('💥 ログインエラー:', error);
      this.showError('ネットワークエラーが発生しました');
    } finally {
      this.setLoading(false, 'login');
    }
  }

  // ユーザー登録処理
  async handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const registerData = {
      email: formData.get('email'),
      password: formData.get('password'),
      username: formData.get('username'),
      displayName: formData.get('username')
    };

    if (!registerData.email || !registerData.password || !registerData.username) {
      this.showError('すべての項目を入力してください', 'register');
      return;
    }
    if (registerData.password.length < 6) {
      this.showError('パスワードは6文字以上で入力してください', 'register');
      return;
    }

    this.setLoading(true, 'register');
    try {
      console.log('📝 Attempting registration for:', registerData.email);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
        credentials: 'include'
      });
      
      console.log('📡 Registration response status:', response.status);
      const data = await response.json();
      console.log('📡 Registration response data:', data);

      if (data.success) {
        this.showSuccess('アカウントが作成されました！', 'register');
        
        // ★★★ 修正点：Firestoreにプロフィールを作成する ★★★
        try {
          console.log('📝 Creating user profile...');
          const profileResponse = await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              uid: data.user.uid, // 登録APIから返されたUIDを使用
              email: registerData.email,
              displayName: registerData.displayName,
              plan: 'free' // デフォルトでフリープランを付与
            })
          });
          
          const profileData = await profileResponse.json();
          console.log('📡 Profile creation response:', profileData);
          
          if (profileData.success) {
            console.log('✅ Firestoreにユーザープロフィールを作成しました。');
          } else {
            console.warn('⚠️ プロフィール作成に失敗:', profileData.error);
          }
        } catch (profileError) {
          console.error('💥 Firestoreプロファイル作成エラー:', profileError);
          // プロフィール作成に失敗しても登録は成功とする
        }

        // 登録成功後、そのままログイン状態にする
        this.onAuthStateChanged(data.user);

      } else {
        this.showError(data.error || 'アカウント作成に失敗しました', 'register');
      }
    } catch (error) {
      console.error('💥 登録エラー:', error);
      this.showError('ネットワークエラーが発生しました', 'register');
    } finally {
      this.setLoading(false, 'register');
    }
  }

  // デモログイン処理
  async handleDemoLogin(event) {
    event.preventDefault();
    console.log('🎭 Demo login initiated');
    
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    
    if (emailField && passwordField) {
      emailField.value = 'demo@banasuko.com';
      passwordField.value = 'demo123';
      
      // フォームデータを作成してログイン処理を実行
      const formData = new FormData();
      formData.append('email', 'demo@banasuko.com');
      formData.append('password', 'demo123');
      formData.append('username', 'demo');
      
      const loginData = {
        email: 'demo@banasuko.com',
        password: 'demo123',
        username: 'demo'
      };
      
      this.setLoading(true, 'login');
      try {
        console.log('🔐 Demo login request sent');
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(loginData),
          credentials: 'include'
        });
        
        console.log('📡 Demo login response status:', response.status);
        const data = await response.json();
        console.log('📡 Demo login response data:', data);
        
        if (data.success) {
          this.showSuccess('デモログインしました！');
          this.onAuthStateChanged(data.user);
        } else {
          this.showError(data.error || 'デモログインに失敗しました');
        }
      } catch (error) {
        console.error('💥 デモログインエラー:', error);
        this.showError('ネットワークエラーが発生しました');
      } finally {
        this.setLoading(false, 'login');
      }
    } else {
      console.error('💥 Demo login form fields not found');
      this.showError('ログインフォームが見つかりません');
    }
  }

  // ログアウト処理
  async handleLogout() {
    try {
      console.log('🚪 Logout request sent');
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      console.log('📡 Logout response status:', response.status);
      const data = await response.json();
      console.log('📡 Logout response data:', data);
      
      if (data.success) {
        this.showSuccess('ログアウトしました');
        this.onAuthStateChanged(null);
      } else {
        this.showError(data.error || 'ログアウトに失敗しました');
      }
    } catch (error) {
      console.error('💥 ログアウトエラー:', error);
      this.showError('ネットワークエラーが発生しました');
    }
  }

  // ユーザー情報更新
  updateUserInfo(user) {
    document.querySelectorAll('.user-name').forEach(el => {
      el.textContent = user.displayName || user.username;
    });
    document.querySelectorAll('.user-email').forEach(el => {
      el.textContent = user.email;
    });
    document.querySelectorAll('.user-plan').forEach(el => {
      el.textContent = this.getPlanDisplayName(user.plan);
    });
  }

  // プラン表示名取得
  getPlanDisplayName(plan) {
    const planNames = {
      free: 'フリープラン',
      basic: 'ベーシックプラン',
      premium: 'プレミアムプラン'
    };
    return planNames[plan] || plan;
  }
  
  // 以下、UI操作関連のメソッド（変更なし）
  setLoading(isLoading, type = 'login') {
    const submitBtn = document.querySelector(`#${type}Form button[type="submit"]`);
    const loadingSpinner = document.querySelector(`#${type}Form .loading-spinner`);
    
    if (submitBtn) {
      submitBtn.disabled = isLoading;
      submitBtn.innerHTML = isLoading ? 
        '<span class="loading-spinner"></span> 処理中...' : 
        type === 'login' ? 'ログイン' : '登録';
    }
  }

  showError(message, type = 'login') {
    const errorDiv = document.querySelector(`#${type}Form .error-message`);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    }
  }

  showSuccess(message, type = 'login') {
    const successDiv = document.querySelector(`#${type}Form .success-message`);
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = 'block';
      setTimeout(() => {
        successDiv.style.display = 'none';
      }, 3000);
    }
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  getCurrentUser() {
    return currentUser;
  }

  isAuthenticated() {
    return !!currentUser;
  }
}

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('バナスコAI 認証システム初期化開始');
  window.authManager = new AuthManager();
});

// グローバル関数として公開
window.getCurrentUser = () => window.authManager?.getCurrentUser();
window.isAuthenticated = () => window.authManager?.isAuthenticated();