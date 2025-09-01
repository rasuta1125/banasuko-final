// 初代バナスコの認証ロジックを移植
// バナスコAI - ログイン・登録機能

// ログインフォームの処理
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const demoLoginBtn = document.getElementById('demoLoginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');

    // フォーム送信処理（初代バナスコのAPIエンドポイントを使用）
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // ローディング状態
            setLoading(true);
            hideMessages();
            
            try {
                // 初代バナスコのAPIエンドポイントを使用
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showSuccess('ログインに成功しました！ダッシュボードにリダイレクトします...');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    showError(data.error || 'ログインに失敗しました');
                }
            } catch (error) {
                showError('ネットワークエラーが発生しました');
                console.error('Login error:', error);
            } finally {
                setLoading(false);
            }
        });
    }

    // デモログイン処理（初代バナスコのデモアカウント）
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            setLoading(true);
            hideMessages();
            
            try {
                // 初代バナスコのデモアカウント情報
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ 
                        email: 'demo@banasuko.com', 
                        password: 'demo123' 
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showSuccess('デモアカウントでログインしました！ダッシュボードにリダイレクトします...');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    showError(data.error || 'デモログインに失敗しました');
                }
            } catch (error) {
                showError('ネットワークエラーが発生しました');
                console.error('Demo login error:', error);
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