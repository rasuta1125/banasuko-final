// Firebase Authentication Client-side Logic
// CDN版Firebase SDK使用

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyAflp1vqSA21sSYihZDTpje-MB1mCALxBs",
  authDomain: "banasuko-auth.firebaseapp.com",
  projectId: "banasuko-auth",
  storageBucket: "banasuko-auth.firebasestorage.app",
  messagingSenderId: "753581941845",
  appId: "1:753581941845:web:18418afb254c309933e0dc",
  measurementId: "G-09515RW8KC"
}

// Firebase初期化
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

// グローバル状態
let currentUser = null
let isAuthReady = false
let pendingRedirect = null

// Firebase認証状態管理
class FirebaseAuthManager {
  constructor() {
    this.initializeAuth()
    this.setupRouteProtection()
  }

  // Firebase初期化
  async initializeAuth() {
    try {
      console.log('Firebase Auth 初期化中...')
      
      // 認証状態変更監視
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          console.log('ユーザーログイン済み:', user.email)
          currentUser = user
          
          try {
            const idToken = await user.getIdToken()
            await this.sendTokenToServer(idToken)
            
            // 認証完了後のルーティング処理
            this.handleAuthenticatedRouting()
          } catch (error) {
            console.error('IDトークン処理エラー:', error)
          }
        } else {
          console.log('ユーザーログアウト状態')
          currentUser = null
          
          // 未認証時のルーティング処理
          this.handleUnauthenticatedRouting()
        }
        
        isAuthReady = true
        this.hideLoadingState()
      })
      
      console.log('Firebase Auth 初期化完了')
    } catch (error) {
      console.error('Firebase Auth 初期化エラー:', error)
      this.showError('認証システムの初期化に失敗しました: ' + error.message)
      isAuthReady = true
      this.hideLoadingState()
    }
  }

  // ルート保護設定
  setupRouteProtection() {
    const currentPath = window.location.pathname
    const protectedRoutes = ['/dashboard', '/analysis', '/copy-generation', '/admin', '/plan']
    const publicRoutes = ['/', '/login']
    
    // 保護されたルートにアクセス中で認証状態が未確定の場合、ローディング表示
    if (protectedRoutes.includes(currentPath) && !isAuthReady) {
      this.showLoadingState()
    }
  }

  // 認証済みユーザーのルーティング処理
  handleAuthenticatedRouting() {
    const currentPath = window.location.pathname
    
    // 保護されたルートの場合、そのまま表示（リダイレクトしない）
    const protectedRoutes = ['/dashboard', '/analysis', '/copy-generation', '/admin', '/plan']
    if (protectedRoutes.includes(currentPath)) {
      console.log('認証済み - 保護されたルートへのアクセス許可:', currentPath)
      
      // ダッシュボードページの場合、専用のJavaScriptを動的に読み込み
      if (currentPath === '/dashboard') {
        this.loadDashboardScript()
      }
      return
    }
    
    // ログインページにいる場合のみダッシュボードにリダイレクト（一度だけ）
    if (currentPath === '/login' && !sessionStorage.getItem('redirecting')) {
      console.log('認証済みユーザーをダッシュボードにリダイレクト')
      sessionStorage.setItem('redirecting', 'true')
      setTimeout(() => {
        sessionStorage.removeItem('redirecting')
        window.location.href = '/dashboard'
      }, 100)
      return
    }
    
    // ホームページにいる場合はそのまま
    if (currentPath === '/') {
      console.log('認証済み - ホームページ表示')
      return
    }
  }

  // ダッシュボードスクリプトの動的読み込み
  loadDashboardScript() {
    const existingScript = document.getElementById('dashboard-script')
    if (existingScript) {
      return // 既に読み込み済み
    }

    console.log('ダッシュボードスクリプトを動的に読み込み中...')
    const script = document.createElement('script')
    script.id = 'dashboard-script'
    script.src = '/static/js/dashboard.js'
    script.onload = () => {
      console.log('ダッシュボードスクリプト読み込み完了')
    }
    script.onerror = (error) => {
      console.error('ダッシュボードスクリプト読み込みエラー:', error)
    }
    document.head.appendChild(script)
  }

  // ユーザープロファイル作成/更新
  async createUserProfile(user) {
    try {
      console.log('ユーザープロファイルを作成中...', user.email)
      
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'ユーザー',
          plan: 'free',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('プロファイル作成エラー: ' + response.status)
      }

      const result = await response.json()
      console.log('プロファイル作成成功:', result)
      return result
    } catch (error) {
      console.error('プロファイル作成エラー:', error)
      // プロファイル作成が失敗してもログインは継続
    }
  }

  // 未認証ユーザーのルーティング処理
  handleUnauthenticatedRouting() {
    const currentPath = window.location.pathname
    const protectedRoutes = ['/dashboard', '/analysis', '/copy-generation', '/admin', '/plan']
    
    // 保護されたルートにアクセスしようとしている場合、ログインページにリダイレクト
    if (protectedRoutes.includes(currentPath)) {
      console.log('未認証ユーザーをログインページにリダイレクト')
      pendingRedirect = currentPath // アクセスしようとしていたページを記憶
      window.location.href = '/login'
      return
    }
    
    // 公開ルートの場合はそのまま表示
    console.log('未認証 - 公開ルートへのアクセス許可:', currentPath)
  }

  // ローディング状態表示
  showLoadingState() {
    const loadingHtml = `
      <div id="auth-loading" style="
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%; 
        background: rgba(10, 10, 31, 0.95); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        z-index: 9999;
        color: white;
        font-family: 'Noto Sans JP', sans-serif;
      ">
        <div style="text-align: center;">
          <div style="
            width: 40px; 
            height: 40px; 
            border: 3px solid #00f5ff; 
            border-top: 3px solid transparent; 
            border-radius: 50%; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 20px;
          "></div>
          <p style="margin: 0; font-size: 16px; color: #00f5ff;">認証状態を確認中...</p>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `
    
    // 既存のローディング要素を削除
    const existingLoading = document.getElementById('auth-loading')
    if (existingLoading) {
      existingLoading.remove()
    }
    
    // 新しいローディング要素を追加
    document.body.insertAdjacentHTML('beforeend', loadingHtml)
  }

  // ローディング状態非表示
  hideLoadingState() {
    const loadingElement = document.getElementById('auth-loading')
    if (loadingElement) {
      loadingElement.remove()
    }
  }

  // IDトークンをサーバーに送信
  async sendTokenToServer(idToken) {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      })

      if (!response.ok) {
        throw new Error('サーバーエラー: ' + response.status)
      }

      const result = await response.json()
      console.log('サーバーセッション作成成功:', result)
      return result
    } catch (error) {
      console.error('サーバーセッション作成エラー:', error)
      throw error
    }
  }

  // ログイン処理
  async login(email, password) {
    try {
      this.showSpinner('loginButton', true)
      this.hideMessages()

      console.log('Firebase login attempt:', { email, passwordLength: password.length })

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const user = userCredential.user
      
      console.log('Firebase認証成功:', user.email)
      
      const idToken = await user.getIdToken()
      await this.sendTokenToServer(idToken)
      
      // ユーザープロファイルをFirestoreに作成/更新
      await this.createUserProfile(user)
      
      this.showSuccess('ログインに成功しました！')
      
      // 少し待ってからリダイレクト
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)

    } catch (error) {
      console.error('ログインエラー:', error)
      
      let errorMessage = 'ログインに失敗しました'
      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'メールアドレスまたはパスワードが正しくありません'
          break
        case 'auth/user-not-found':
          errorMessage = 'このメールアドレスのユーザーは見つかりませんでした'
          break
        case 'auth/wrong-password':
          errorMessage = 'パスワードが正しくありません'
          break
        case 'auth/too-many-requests':
          errorMessage = 'ログイン試行回数が多すぎます。しばらく時間をおいてから再試行してください'
          break
        default:
          errorMessage = 'ログインエラー: ' + error.code + ' - ' + error.message
      }
      
      this.showError(errorMessage)
    } finally {
      this.showSpinner('loginButton', false)
    }
  }

  // ユーザー登録処理
  async register(email, password) {
    try {
      this.showSpinner('registerButton', true)
      this.hideRegisterMessages()

      console.log('Firebase register attempt:', { email, passwordLength: password.length })

      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const user = userCredential.user
      
      console.log('Firebase登録成功:', user.email)
      
      const idToken = await user.getIdToken()
      
      // サーバーセッション作成
      await this.sendTokenToServer(idToken)
      
      // ユーザープロファイルをFirestoreに作成
      await this.createUserProfile(user)
      
      this.showRegisterSuccess('アカウントが作成されました！')
      
      // 少し待ってからリダイレクト
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)

    } catch (error) {
      console.error('登録エラー:', error)
      
      let errorMessage = 'アカウント作成に失敗しました'
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'このメールアドレスは既に使用されています'
          break
        case 'auth/weak-password':
          errorMessage = 'パスワードが弱すぎます。6文字以上で設定してください'
          break
        case 'auth/invalid-email':
          errorMessage = '無効なメールアドレスです'
          break
        default:
          errorMessage = '登録エラー: ' + error.code + ' - ' + error.message
      }
      
      this.showRegisterError(errorMessage)
    } finally {
      this.showSpinner('registerButton', false)
    }
  }

  // デモログイン処理
  async demoLogin() {
    const emailInput = document.getElementById('email')
    const passwordInput = document.getElementById('password')
    
    if (emailInput && passwordInput) {
      emailInput.value = 'demo@banasuko.com'
      passwordInput.value = 'demo123456'
      
      await this.login('demo@banasuko.com', 'demo123456')
    }
  }

  // デモアカウント作成処理
  async createDemoAccount() {
    try {
      await this.register('demo@banasuko.com', 'demo123456')
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        this.showError('デモアカウントは既に存在します！\\nメール: demo@banasuko.com\\nパスワード: demo123456\\n\\n上記でログインしてください。')
        
        // フォームにデモ情報を設定
        const emailInput = document.getElementById('email')
        const passwordInput = document.getElementById('password')
        if (emailInput && passwordInput) {
          emailInput.value = 'demo@banasuko.com'
          passwordInput.value = 'demo123456'
        }
      } else {
        throw error // 他のエラーは再スロー
      }
    }
  }

  // UI Helper Methods
  showError(message) {
    const errorDiv = document.getElementById('errorMessage')
    const errorText = document.getElementById('errorText')
    if (errorDiv && errorText) {
      errorText.textContent = message
      errorDiv.classList.remove('hidden')
    }
  }

  showSuccess(message) {
    const successDiv = document.getElementById('successMessage')
    const successText = document.getElementById('successText')
    if (successDiv && successText) {
      successText.textContent = message
      successDiv.classList.remove('hidden')
    }
  }

  showRegisterError(message) {
    const errorDiv = document.getElementById('regErrorMessage')
    const errorText = document.getElementById('regErrorText')
    if (errorDiv && errorText) {
      errorText.textContent = message
      errorDiv.classList.remove('hidden')
    }
  }

  showRegisterSuccess(message) {
    const successDiv = document.getElementById('regSuccessMessage')
    const successText = document.getElementById('regSuccessText')
    if (successDiv && successText) {
      successText.textContent = message
      successDiv.classList.remove('hidden')
    }
  }

  hideMessages() {
    const errorDiv = document.getElementById('errorMessage')
    const successDiv = document.getElementById('successMessage')
    if (errorDiv) errorDiv.classList.add('hidden')
    if (successDiv) successDiv.classList.add('hidden')
  }

  hideRegisterMessages() {
    const errorDiv = document.getElementById('regErrorMessage')
    const successDiv = document.getElementById('regSuccessMessage')
    if (errorDiv) errorDiv.classList.add('hidden')
    if (successDiv) successDiv.classList.add('hidden')
  }

  showSpinner(buttonId, show) {
    const button = document.getElementById(buttonId)
    const buttonText = document.getElementById(buttonId + 'Text')
    const spinner = document.getElementById(buttonId === 'loginButton' ? 'loginSpinner' : 'registerSpinner')
    
    if (button && buttonText && spinner) {
      if (show) {
        button.setAttribute('disabled', 'true')
        buttonText.classList.add('hidden')
        spinner.classList.remove('hidden')
      } else {
        button.removeAttribute('disabled')
        buttonText.classList.remove('hidden')
        spinner.classList.add('hidden')
      }
    }
  }

  // フォーム表示切り替え
  showRegisterForm() {
    const registerForm = document.getElementById('registerForm')
    if (registerForm) {
      registerForm.classList.remove('hidden')
    }
  }

  showLoginForm() {
    const registerForm = document.getElementById('registerForm')
    if (registerForm) {
      registerForm.classList.add('hidden')
    }
  }
}

// グローバルインスタンス作成
const authManager = new FirebaseAuthManager()

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('Firebase Auth client-side initialization')
  
  // ログインフォーム
  const loginForm = document.getElementById('loginForm')
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('email')?.value?.trim()
      const password = document.getElementById('password')?.value
      
      if (!email || !password) {
        authManager.showError('メールアドレスとパスワードを入力してください')
        return
      }
      
      await authManager.login(email, password)
    })
  }

  // 登録フォーム
  const registerForm = document.getElementById('registerFormElement')
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('registerEmail')?.value?.trim()
      const password = document.getElementById('registerPassword')?.value
      const confirmPassword = document.getElementById('confirmPassword')?.value
      
      if (!email || !password || !confirmPassword) {
        authManager.showRegisterError('すべての項目を入力してください')
        return
      }
      
      if (password !== confirmPassword) {
        authManager.showRegisterError('パスワードが一致しません')
        return
      }
      
      if (password.length < 6) {
        authManager.showRegisterError('パスワードは6文字以上で入力してください')
        return
      }
      
      await authManager.register(email, password)
    })
  }

  // デモログインボタン
  const demoLoginBtn = document.getElementById('demoLoginBtn')
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener('click', async () => {
      await authManager.demoLogin()
    })
  }

  // デモアカウント作成ボタン
  const createDemoBtn = document.getElementById('createDemoBtn')
  if (createDemoBtn) {
    createDemoBtn.addEventListener('click', async () => {
      await authManager.createDemoAccount()
    })
  }

  // フォーム切り替えボタン
  const showRegisterBtn = document.getElementById('showRegisterForm')
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault()
      authManager.showRegisterForm()
    })
  }

  const showLoginBtn = document.getElementById('showLoginForm')
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
      e.preventDefault()
      authManager.showLoginForm()
    })
  }
})