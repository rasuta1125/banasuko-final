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

// Firebase初期化
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// グローバル変数
let currentUser = null;
let isAuthReady = false;

// ログインフォームの処理
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const demoLoginBtn = document.getElementById('demoLoginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');

    // フォーム送信処理
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // ローディング状態
            setLoading(true);
            hideMessages();
            
            try {
                // Firebase認証でログイン
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                showSuccess('ログインに成功しました！ダッシュボードにリダイレクトします...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
                
            } catch (error) {
                console.error('Login error:', error);
                let errorMessage = 'ログインに失敗しました';
                
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'ユーザーが見つかりません';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'パスワードが間違っています';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'メールアドレスの形式が正しくありません';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください';
                        break;
                }
                
                showError(errorMessage);
            } finally {
                setLoading(false);
            }
        });
    }

    // デモログイン処理
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            setLoading(true);
            hideMessages();
            
            try {
                // デモアカウントでログイン
                const userCredential = await auth.signInWithEmailAndPassword('demo@banasuko.com', 'demo123');
                const user = userCredential.user;
                
                showSuccess('デモアカウントでログインしました！ダッシュボードにリダイレクトします...');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
                
            } catch (error) {
                console.error('Demo login error:', error);
                showError('デモログインに失敗しました: ' + error.message);
            } finally {
                setLoading(false);
            }
        });
    }

    // 新規登録リンク
    const signupLink = document.getElementById('signupLink');
    if (signupLink) {
        signupLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSuccess('新規登録: 任意のメールアドレスとパスワード（6文字以上）でアカウントを作成できます。');
        });
    }

    // ヘルパー関数
    function setLoading(loading) {
        if (loading) {
            if (loginButton) {
                loginButton.disabled = true;
                if (loginButtonText) loginButtonText.classList.add('hidden');
                if (loginSpinner) loginSpinner.classList.remove('hidden');
            }
        } else {
            if (loginButton) {
                loginButton.disabled = false;
                if (loginButtonText) loginButtonText.classList.remove('hidden');
                if (loginSpinner) loginSpinner.classList.add('hidden');
            }
        }
    }

    function showError(message) {
        if (errorMessage) {
            errorMessage.classList.remove('hidden');
            const errorText = document.getElementById('errorText');
            if (errorText) errorText.textContent = message;
        }
    }

    function showSuccess(message) {
        if (successMessage) {
            successMessage.classList.remove('hidden');
            const successText = document.getElementById('successText');
            if (successText) successText.textContent = message;
        }
    }

    function hideMessages() {
        if (errorMessage) errorMessage.classList.add('hidden');
        if (successMessage) successMessage.classList.add('hidden');
    }

    // フォーカス設定
    const emailInput = document.getElementById('email');
    if (emailInput) emailInput.focus();
});

// 認証状態の監視
auth.onAuthStateChanged(function(user) {
    if (user) {
        console.log('User is signed in:', user.email);
        currentUser = user;
    } else {
        console.log('User is signed out');
        currentUser = null;
    }
    isAuthReady = true;
});