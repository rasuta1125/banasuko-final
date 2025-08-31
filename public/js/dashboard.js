// バナスコAI ユーザーダッシュボード JavaScript
// 使用状況・プラン管理機能

class UserDashboard {
  constructor() {
    this.currentUser = null;
    this.usageStats = null;
    this.selectedPlan = null;
    this.init();
  }

  async init() {
    try {
      // ★★★ 修正点：auth.jsの初期化を待機し、直接ユーザー情報を取得 ★★★
      // authManagerが初期化されるのを少し待つ
      await new Promise(resolve => {
        const checkAuthManager = () => {
          if (window.authManager && window.getCurrentUser()) {
            resolve();
          } else {
            setTimeout(checkAuthManager, 100);
          }
        };
        checkAuthManager();
      });

      this.currentUser = window.getCurrentUser();
      
      if (!this.currentUser) {
        // auth.jsがリダイレクトするので、ここでの処理は不要な場合が多いが念のため
        window.location.href = '/login';
        return;
      }
      this.updateUserInfo(this.currentUser);

      // イベントリスナー設定
      this.setupEventListeners();
      // データ読み込み
      await this.loadDashboardData();
      
      console.log('ダッシュボード初期化完了');
    } catch (error) {
      console.error('ダッシュボード初期化エラー:', error);
      this.showError('ダッシュボードの読み込みに失敗しました');
    }
  }

  // ★★★ 修正点：重複する認証チェック関数を削除 ★★★
  // checkAuthState() は削除

  // イベントリスナー設定
  setupEventListeners() {
    // プランアップグレードボタン
    document.querySelectorAll('.upgrade-plan-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const plan = e.target.getAttribute('data-plan');
        this.showPlanChangeModal(plan);
      });
    });

    // プラン変更モーダル
    const planModal = document.getElementById('planChangeModal');
    const closePlanModal = document.getElementById('closePlanModal');
    const cancelPlanChange = document.getElementById('cancelPlanChange');
    const confirmPlanChange = document.getElementById('confirmPlanChange');

    if (closePlanModal) {
      closePlanModal.addEventListener('click', () => this.hidePlanChangeModal());
    }

    if (cancelPlanChange) {
      cancelPlanChange.addEventListener('click', () => this.hidePlanChangeModal());
    }

    if (confirmPlanChange) {
      confirmPlanChange.addEventListener('click', () => this.confirmPlanChange());
    }

    // モーダル外クリックで閉じる
    if (planModal) {
      planModal.addEventListener('click', (e) => {
        if (e.target === planModal) {
          this.hidePlanChangeModal();
        }
      });
    }

    // ログアウトボタン
    document.querySelectorAll('.logout-btn').forEach(btn => {
      btn.addEventListener('click', this.handleLogout.bind(this));
    });

    // ナビゲーションリンク
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          window.location.href = href;
        }
      });
    });
  }

  // ダッシュボードデータ読み込み
  async loadDashboardData() {
    try {
      await this.loadUsageStats();
      await this.loadRecentActivity();
    } catch (error) {
      console.error('ダッシュボードデータ読み込みエラー:', error);
    }
  }

  // 使用統計読み込み
  async loadUsageStats() {
    try {
      const response = await fetch('/api/usage/dashboard', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.usageStats = data.data;
          this.updateUsageDisplay(data.data);
        }
      }
    } catch (error) {
      console.error('使用統計読み込みエラー:', error);
    }
  }
  
  // 最近のアクティビティ読み込み
  async loadRecentActivity() {
    try {
      const response = await fetch('/api/activity/recent', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.displayRecentActivity(data.activities);
        }
      }
    } catch (error) {
      console.error('アクティビティ読み込みエラー:', error);
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
    this.updatePlanUI(user.plan);
  }

  // 使用状況表示更新
  updateUsageDisplay(stats) {
    const usageContainer = document.getElementById('usageStats');
    if (!usageContainer || !stats) return;

    const usageHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-full bg-blue-100 text-blue-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">今月の使用回数</p>
              <p class="text-2xl font-semibold text-gray-900">${stats.monthlyUsage || 0}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-full bg-green-100 text-green-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">残り使用回数</p>
              <p class="text-2xl font-semibold text-gray-900">${stats.remainingUsage || 0}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-2 rounded-full bg-purple-100 text-purple-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">現在のプラン</p>
              <p class="text-2xl font-semibold text-gray-900">${this.getPlanDisplayName(stats.currentPlan)}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    usageContainer.innerHTML = usageHTML;
  }
  
  // 最近のアクティビティ表示
  displayRecentActivity(activities) {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer || !activities) return;

    if (activities.length === 0) {
      activityContainer.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-500">まだアクティビティがありません</p>
        </div>
      `;
      return;
    }

    const activityHTML = activities.map(activity => `
      <div class="flex items-center space-x-4 p-4 border-b border-gray-200 last:border-b-0">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900">
            ${this.getActionDisplayName(activity.actionType)}
          </p>
          <p class="text-sm text-gray-500">
            ${this.getTimeAgo(activity.timestamp)}
          </p>
        </div>
      </div>
    `).join('');

    activityContainer.innerHTML = activityHTML;
  }

  // プラン変更モーダル表示
  showPlanChangeModal(plan) {
    this.selectedPlan = plan;
    const modal = document.getElementById('planChangeModal');
    const planName = document.getElementById('planName');
    const planPrice = document.getElementById('planPrice');
    
    if (modal && planName && planPrice) {
      planName.textContent = this.getPlanDisplayName(plan);
      planPrice.textContent = this.getPlanPrice(plan);
      modal.classList.remove('hidden');
    }
  }
  
  // プラン変更モーダル非表示
  hidePlanChangeModal() {
    const modal = document.getElementById('planChangeModal');
    if (modal) {
      modal.classList.add('hidden');
    }
    this.selectedPlan = null;
  }
  
  // プラン変更確定
  async confirmPlanChange() {
    if (!this.selectedPlan) return;

    try {
      const response = await fetch('/api/user/plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: this.selectedPlan })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.showSuccess('プランを変更しました');
          this.currentUser.plan = this.selectedPlan;
          this.updateUserInfo(this.currentUser);
          this.hidePlanChangeModal();
          
          // ページをリロードして最新の使用状況を取得
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          this.showError(data.error || 'プラン変更に失敗しました');
        }
      } else {
        this.showError('プラン変更に失敗しました');
      }
    } catch (error) {
      console.error('プラン変更エラー:', error);
      this.showError('ネットワークエラーが発生しました');
    }
  }

  // ログアウト処理
  handleLogout() {
    // ログアウトはauthManagerに任せる
    if (window.authManager) {
      window.authManager.handleLogout();
    }
  }

  // プランUIの更新
  updatePlanUI(userPlan) {
    // 現在のプランに応じてUIを更新
    document.querySelectorAll('.plan-badge').forEach(badge => {
      const planType = badge.getAttribute('data-plan');
      if (planType === userPlan) {
        badge.classList.add('bg-green-100', 'text-green-800');
        badge.classList.remove('bg-gray-100', 'text-gray-800');
      } else {
        badge.classList.remove('bg-green-100', 'text-green-800');
        badge.classList.add('bg-gray-100', 'text-gray-800');
      }
    });
  }

  // ユーティリティ関数
  getPlanDisplayName(plan) {
    const planNames = {
      free: 'フリープラン',
      basic: 'ベーシックプラン',
      premium: 'プレミアムプラン'
    };
    return planNames[plan] || plan;
  }

  getPlanPrice(plan) {
    const planPrices = {
      free: '無料',
      basic: '¥1,980/月',
      premium: '¥3,980/月'
    };
    return planPrices[plan] || '要問い合わせ';
  }

  getActionDisplayName(actionType) {
    const actionNames = {
      'copy_generation': 'コピー生成',
      'analysis': '分析実行',
      'login': 'ログイン',
      'plan_change': 'プラン変更'
    };
    return actionNames[actionType] || this.camelCase(actionType);
  }

  camelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) {
      return '今';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}時間前`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)}日前`;
    }
  }
  
  // メッセージ表示
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showToast(message, type = 'info') {
    // トースト通知の実装
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
  // dashboard.jsはダッシュボード関連ページでのみ初期化
  if (document.querySelector('.dashboard-container')) { // ダッシュボードページのコンテナ要素などを指定
      console.log('ユーザーダッシュボード初期化開始');
      window.userDashboard = new UserDashboard();
  }
});