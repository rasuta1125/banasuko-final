// バナスコAI 分析ページ JavaScript
// 画像アップロード・分析機能・媒体分岐

class AnalysisManager {
  constructor() {
    this.currentUser = null;
    this.selectedPlatform = '';
    this.scoringType = 'score'; // 'score' (100点満点) or 'grade' (A/B/C評価)
    
    this.init();
  }

  async init() {
    try {
      // 認証状態チェック
      await this.checkAuthState();
      
      if (!this.currentUser) {
        window.location.href = '/login';
        return;
      }

      // イベントリスナー設定
      this.setupEventListeners();
      
      console.log('分析ページ初期化完了');
    } catch (error) {
      console.error('分析ページ初期化エラー:', error);
    }
  }

  // 認証状態チェック
  async checkAuthState() {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.currentUser = data.user;
          return;
        }
      }
      
      this.currentUser = null;
    } catch (error) {
      console.error('認証状態チェックエラー:', error);
      this.currentUser = null;
    }
  }

  // イベントリスナー設定
  setupEventListeners() {
    // 媒体変更時の処理
    const platformSelect = document.getElementById('platform');
    if (platformSelect) {
      platformSelect.addEventListener('change', (e) => {
        this.handlePlatformChange(e.target.value);
      });
    }

    // 分析タイプ切り替え
    const analyzeButtons = document.querySelectorAll('[data-analysis-type]');
    analyzeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchAnalysisType(e.target.dataset.analysisType);
      });
    });

    // ファイルアップロード処理
    this.setupFileUpload();
  }

  // 媒体変更時の処理
  handlePlatformChange(platform) {
    this.selectedPlatform = platform;
    const instagramAdType = document.getElementById('instagramAdType');
    
    // Instagram広告の場合、詳細選択を表示
    if (platform === 'instagram-ad') {
      if (instagramAdType) {
        instagramAdType.classList.remove('hidden');
      }
      this.scoringType = 'grade'; // A/B/C評価
    } else {
      if (instagramAdType) {
        instagramAdType.classList.add('hidden');
      }
      
      // スコアタイプ設定
      if (platform === 'instagram-post') {
        this.scoringType = 'score'; // 100点満点
      } else if (platform === 'gdn' || platform === 'yahoo') {
        this.scoringType = 'grade'; // A/B/C評価
      }
    }
    
    // UI更新
    this.updateScoringTypeDisplay();
    
    console.log(`媒体変更: ${platform}, スコアタイプ: ${this.scoringType}`);
  }

  // スコアタイプ表示更新
  updateScoringTypeDisplay() {
    const scoringInfo = document.getElementById('scoringTypeInfo');
    if (!scoringInfo) return;

    let infoText = '';
    let colorClass = '';

    switch (this.selectedPlatform) {
      case 'instagram-post':
        infoText = '📊 Instagram投稿：100点満点で採点';
        colorClass = 'text-cyber-blue';
        break;
      case 'instagram-ad':
        infoText = '🎯 Instagram広告：A/B/C評価で判定';
        colorClass = 'text-cyber-pink';
        break;
      case 'gdn':
        infoText = '🎯 Googleディスプレイ広告：A/B/C評価で判定';
        colorClass = 'text-cyber-green';
        break;
      case 'yahoo':
        infoText = '🎯 Yahooディスプレイ広告：A/B/C評価で判定';
        colorClass = 'text-cyber-orange';
        break;
      default:
        infoText = '📋 媒体を選択してください';
        colorClass = 'text-gray-400';
    }

    scoringInfo.innerHTML = `<p class="${colorClass} text-sm font-medium">${infoText}</p>`;
  }

  // ファイルアップロード設定
  setupFileUpload() {
    // 単体分析用
    this.setupSingleUpload();
    
    // A/B分析用
    this.setupABUpload();
  }

  // 単体分析アップロード
  setupSingleUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('imageUpload');
    const cameraInput = document.getElementById('cameraUpload');

    if (dropZone && fileInput) {
      // ドラッグ&ドロップ
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-cyber-purple');
      });

      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-cyber-purple');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-cyber-purple');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleImageUpload(files[0], 'single');
        }
      });

      // クリックでファイル選択
      dropZone.addEventListener('click', () => {
        fileInput.click();
      });

      // ファイル選択時
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleImageUpload(e.target.files[0], 'single');
        }
      });

      // カメラ撮影時
      if (cameraInput) {
        cameraInput.addEventListener('change', (e) => {
          if (e.target.files.length > 0) {
            this.handleImageUpload(e.target.files[0], 'single');
          }
        });
      }
    }
  }

  // A/B分析アップロード
  setupABUpload() {
    // パターンA
    this.setupABSingleUpload('A');
    // パターンB
    this.setupABSingleUpload('B');
  }

  // A/B個別アップロード設定
  setupABSingleUpload(pattern) {
    const dropZone = document.getElementById(`dropZone${pattern}`);
    const fileInput = document.getElementById(`imageUpload${pattern}`);
    const cameraInput = document.getElementById(`cameraUpload${pattern}`);

    if (dropZone && fileInput) {
      // ドラッグ&ドロップ
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        const colorClass = pattern === 'A' ? 'border-cyber-blue' : 'border-cyber-pink';
        dropZone.classList.add(colorClass);
      });

      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        const colorClass = pattern === 'A' ? 'border-cyber-blue' : 'border-cyber-pink';
        dropZone.classList.remove(colorClass);
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const colorClass = pattern === 'A' ? 'border-cyber-blue' : 'border-cyber-pink';
        dropZone.classList.remove(colorClass);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          this.handleImageUpload(files[0], `ab${pattern}`);
        }
      });

      // ファイル選択時
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleImageUpload(e.target.files[0], `ab${pattern}`);
        }
      });

      // カメラ撮影時
      if (cameraInput) {
        cameraInput.addEventListener('change', (e) => {
          if (e.target.files.length > 0) {
            this.handleImageUpload(e.target.files[0], `ab${pattern}`);
          }
        });
      }
    }
  }

  // 画像アップロード処理
  async handleImageUpload(file, type) {
    // ファイルサイズチェック（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      this.showError('ファイルサイズは10MB以下にしてください');
      return;
    }

    // ファイル形式チェック
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.showError('PNG, JPG, JPEG, WEBP形式のファイルをアップロードしてください');
      return;
    }

    try {
      // プレビュー表示
      await this.showImagePreview(file, type);
      
      console.log(`画像アップロード成功: ${type}`, file.name);
    } catch (error) {
      console.error('画像アップロードエラー:', error);
      this.showError('画像のアップロードに失敗しました');
    }
  }

  // 画像プレビュー表示
  async showImagePreview(file, type) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        let previewContainer, previewImage, imageName;
        
        switch (type) {
          case 'single':
            previewContainer = document.getElementById('imagePreview');
            previewImage = document.getElementById('previewImage');
            imageName = document.getElementById('imageName');
            break;
          case 'abA':
            previewContainer = document.getElementById('imagePreviewA');
            previewImage = document.getElementById('previewImageA');
            break;
          case 'abB':
            previewContainer = document.getElementById('imagePreviewB');
            previewImage = document.getElementById('previewImageB');
            break;
          default:
            reject(new Error('不正なアップロードタイプ'));
            return;
        }

        if (previewContainer && previewImage) {
          previewImage.src = e.target.result;
          previewContainer.classList.remove('hidden');
          
          if (imageName) {
            imageName.textContent = file.name;
          }
        }
        
        resolve();
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 分析タイプ切り替え
  switchAnalysisType(type) {
    const singleUpload = document.getElementById('singleUpload');
    const abUpload = document.getElementById('abUpload');
    const singleBtn = document.querySelector('[data-analysis-type="single"]');
    const abBtn = document.querySelector('[data-analysis-type="ab"]');

    if (type === 'single') {
      singleUpload?.classList.remove('hidden');
      abUpload?.classList.add('hidden');
      singleBtn?.classList.add('bg-cyber-purple', 'text-white');
      singleBtn?.classList.remove('bg-gray-700', 'text-gray-300');
      abBtn?.classList.add('bg-gray-700', 'text-gray-300');
      abBtn?.classList.remove('bg-cyber-green', 'text-white');
    } else if (type === 'ab') {
      singleUpload?.classList.add('hidden');
      abUpload?.classList.remove('hidden');
      abBtn?.classList.add('bg-cyber-green', 'text-white');
      abBtn?.classList.remove('bg-gray-700', 'text-gray-300');
      singleBtn?.classList.add('bg-gray-700', 'text-gray-300');
      singleBtn?.classList.remove('bg-cyber-purple', 'text-white');
    }
  }

  // エラーメッセージ表示
  showError(message) {
    // 既存のエラーメッセージを削除
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    // 新しいエラーメッセージを作成
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message fixed top-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-up';
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(errorDiv);

    // 5秒後に自動削除
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  // 単一画像分析実行
  async startSingleAnalysis() {
    const imagePreview = document.getElementById('previewImage');
    const analyzeBtn = document.getElementById('analyzeSingleBtn');
    
    if (!imagePreview || !imagePreview.src || imagePreview.src === '') {
      this.showError('分析する画像をアップロードしてください');
      return;
    }

    if (!this.selectedPlatform) {
      this.showError('媒体を選択してください');
      return;
    }

    try {
      // ボタン無効化
      if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = '分析中...';
      }

      console.log('🔍 単一画像分析開始');

      const adType = this.selectedPlatform === 'instagram-ad' ? 
        document.getElementById('instagramAdTypeSelect')?.value : null;

      const response = await fetch('/api/analysis/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          image: imagePreview.src,
          platform: this.selectedPlatform,
          adType: adType
        })
      });

      const result = await response.json();

      if (result.success) {
        this.displaySingleResult(result.result);
        this.showSuccess('分析が完了しました！');
      } else {
        throw new Error(result.message || '分析に失敗しました');
      }

    } catch (error) {
      console.error('分析エラー:', error);
      this.showError(error.message || '分析中にエラーが発生しました。もう一度試してください。');
    } finally {
      // ボタン復元
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'AI分析開始';
      }
    }
  }

  // A/B比較分析実行
  async startABAnalysis() {
    const imageA = document.getElementById('previewImageA');
    const imageB = document.getElementById('previewImageB');
    const analyzeBtn = document.getElementById('analyzeABBtn');

    if (!imageA?.src || !imageB?.src) {
      this.showError('パターンAとパターンBの両方の画像をアップロードしてください');
      return;
    }

    if (!this.selectedPlatform) {
      this.showError('媒体を選択してください');
      return;
    }

    try {
      if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'A/B分析中...';
      }

      console.log('🔍 A/B比較分析開始');

      const adType = this.selectedPlatform === 'instagram-ad' ? 
        document.getElementById('instagramAdTypeSelect')?.value : null;

      const response = await fetch('/api/analysis/ab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          imageA: imageA.src,
          imageB: imageB.src,
          platform: this.selectedPlatform,
          adType: adType
        })
      });

      const result = await response.json();

      if (result.success) {
        this.displayABResult(result.result);
        this.showSuccess('A/B比較分析が完了しました！');
      } else {
        throw new Error(result.message || 'A/B分析に失敗しました');
      }

    } catch (error) {
      console.error('A/B分析エラー:', error);
      this.showError(error.message || '分析中にエラーが発生しました。もう一度試してください。');
    } finally {
      if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'A/B比較分析';
      }
    }
  }

  // 単一分析結果表示
  displaySingleResult(result) {
    const resultSection = document.getElementById('analysisResult');
    if (!resultSection) return;

    const resultHTML = `
      <div class="bg-navy-800/50 backdrop-blur-lg rounded-2xl border border-cyber-blue/20 p-6 mt-8 animate-fade-in">
        <h3 class="text-xl font-semibold text-white mb-4">
          <i class="fas fa-chart-line mr-2 text-cyber-blue"></i>分析結果
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-navy-700/30 rounded-xl p-4">
            <h4 class="text-lg font-medium text-cyber-blue mb-2">評価</h4>
            <div class="text-3xl font-bold text-white">
              ${result.score ? `${result.score}点` : `${result.grade}評価`}
            </div>
          </div>
          
          <div class="bg-navy-700/30 rounded-xl p-4">
            <h4 class="text-lg font-medium text-cyber-green mb-2">媒体</h4>
            <div class="text-lg text-white">${this.getPlatformName(result.platform)}</div>
          </div>
        </div>

        <div class="mt-6">
          <h4 class="text-lg font-medium text-cyber-pink mb-3">詳細分析</h4>
          <div class="bg-navy-700/30 rounded-xl p-4 text-gray-300 leading-relaxed">
            ${result.analysis.replace(/\n/g, '<br>')}
          </div>
        </div>

        ${result.improvements && result.improvements.length > 0 ? `
          <div class="mt-6">
            <h4 class="text-lg font-medium text-cyber-orange mb-3">改善提案</h4>
            <ul class="space-y-2">
              ${result.improvements.map(improvement => `
                <li class="flex items-start bg-navy-700/30 rounded-lg p-3">
                  <i class="fas fa-lightbulb text-cyber-orange mt-1 mr-3"></i>
                  <span class="text-gray-300">${improvement}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    resultSection.innerHTML = resultHTML;
    resultSection.scrollIntoView({ behavior: 'smooth' });
  }

  // A/B分析結果表示
  displayABResult(result) {
    const resultSection = document.getElementById('analysisResult');
    if (!resultSection) return;

    const resultHTML = `
      <div class="bg-navy-800/50 backdrop-blur-lg rounded-2xl border border-cyber-blue/20 p-6 mt-8 animate-fade-in">
        <h3 class="text-xl font-semibold text-white mb-4">
          <i class="fas fa-balance-scale mr-2 text-cyber-green"></i>A/B比較結果
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="bg-navy-700/30 rounded-xl p-4 border-l-4 border-cyber-blue">
            <h4 class="text-lg font-medium text-cyber-blue mb-2">パターンA</h4>
            <div class="text-2xl font-bold text-white mb-2">
              ${result.patternA.score ? `${result.patternA.score}点` : `${result.patternA.grade}評価`}
            </div>
            <p class="text-gray-300 text-sm">${result.patternA.analysis.substring(0, 100)}...</p>
          </div>
          
          <div class="bg-navy-700/30 rounded-xl p-4 border-l-4 border-cyber-pink">
            <h4 class="text-lg font-medium text-cyber-pink mb-2">パターンB</h4>
            <div class="text-2xl font-bold text-white mb-2">
              ${result.patternB.score ? `${result.patternB.score}点` : `${result.patternB.grade}評価`}
            </div>
            <p class="text-gray-300 text-sm">${result.patternB.analysis.substring(0, 100)}...</p>
          </div>
        </div>

        <div class="bg-gradient-to-r from-cyber-purple/20 to-cyber-pink/20 rounded-xl p-4 mb-6">
          <h4 class="text-lg font-medium text-white mb-2">
            <i class="fas fa-trophy mr-2 text-yellow-400"></i>比較結果
          </h4>
          <p class="text-lg text-white font-medium">${result.comparison.summary}</p>
        </div>
      </div>
    `;

    resultSection.innerHTML = resultHTML;
    resultSection.scrollIntoView({ behavior: 'smooth' });
  }

  // 成功メッセージ表示
  showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message fixed top-4 right-4 bg-green-500/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-up';
    successDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle mr-2"></i>
        <span>${message}</span>
      </div>
    `;

    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
  }

  // プラットフォーム名取得
  getPlatformName(platform) {
    const names = {
      'instagram-post': 'Instagram投稿',
      'instagram-ad': 'Instagram広告', 
      'gdn': 'GDN広告',
      'yahoo': 'Yahoo広告'
    };
    return names[platform] || platform;
  }
}

// グローバル関数として分析実行を公開
window.startSingleAnalysis = function() {
  if (window.analysisManager) {
    window.analysisManager.startSingleAnalysis();
  }
};

window.startABAnalysis = function() {
  if (window.analysisManager) {
    window.analysisManager.startABAnalysis();
  }
};

// グローバル関数として媒体変更処理を公開
window.handlePlatformChange = function(platform) {
  if (window.analysisManager) {
    window.analysisManager.handlePlatformChange(platform);
  }
};

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('分析ページ JavaScript 初期化開始');
  window.analysisManager = new AnalysisManager();
});