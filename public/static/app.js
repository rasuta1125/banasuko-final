/**
 * バナスコAI - インタラクティブ JavaScript
 * プロフェッショナル広告分析ツール
 */

// グローバル状態管理
const AppState = {
  currentUser: null,
  analysisMode: 'single',
  uploadedImages: {},
  currentResults: null
};

// ユーティリティ関数
const Utils = {
  // トーストメッセージ表示
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  },

  // ファイルサイズフォーマット
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 画像プレビュー作成
  createImagePreview(file, previewId, nameId) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const previewContainer = document.getElementById(previewId.replace('preview', 'Preview'));
      const previewImage = document.getElementById(previewId);
      const imageName = document.getElementById(nameId);
      
      if (previewContainer && previewImage) {
        previewImage.src = e.target.result;
        previewContainer.classList.remove('hidden');
        
        if (imageName) {
          imageName.textContent = `${file.name} (${Utils.formatFileSize(file.size)})`;
        }
      }
    };
    reader.readAsDataURL(file);
  },

  // API呼び出し
  async apiCall(endpoint, data = null, method = 'POST') {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(endpoint, options);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

// 認証機能は public/static/js/auth.js の AuthManager で統一管理
// このファイルは分析・UI機能専用

// 画像アップロード機能
const ImageUpload = {
  // 単一画像アップロード
  initSingleUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('imageUpload');
    
    if (!dropZone || !fileInput) return;
    
    // クリックでファイル選択
    dropZone.addEventListener('click', () => fileInput.click());
    
    // ファイル選択
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.handleSingleFile(file);
    });
    
    // ドラッグ&ドロップ
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      
      const file = e.dataTransfer.files[0];
      if (file) this.handleSingleFile(file);
    });
  },

  // A/B画像アップロード
  initABUpload() {
    ['A', 'B'].forEach(pattern => {
      const dropZone = document.getElementById(`dropZone${pattern}`);
      const fileInput = document.getElementById(`imageUpload${pattern}`);
      
      if (!dropZone || !fileInput) return;
      
      // クリックでファイル選択
      dropZone.addEventListener('click', () => fileInput.click());
      
      // ファイル選択
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.handleABFile(file, pattern);
      });
      
      // ドラッグ&ドロップ
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
      });
      
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file) this.handleABFile(file, pattern);
      });
    });
  },

  // コピー生成用画像アップロード
  initCopyUpload() {
    const dropZone = document.getElementById('copyDropZone');
    const fileInput = document.getElementById('copyImageUpload');
    
    if (!dropZone || !fileInput) return;
    
    // クリックでファイル選択
    dropZone.addEventListener('click', () => fileInput.click());
    
    // ファイル選択
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.handleCopyFile(file);
    });
    
    // ドラッグ&ドロップ
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      
      const file = e.dataTransfer.files[0];
      if (file) this.handleCopyFile(file);
    });
  },

  // 単一ファイル処理
  handleSingleFile(file) {
    if (!this.validateFile(file)) return;
    
    AppState.uploadedImages.single = file;
    Utils.createImagePreview(file, 'previewImage', 'imageName');
    this.updateAnalyzeButton();
  },

  // A/Bファイル処理
  handleABFile(file, pattern) {
    if (!this.validateFile(file)) return;
    
    AppState.uploadedImages[pattern] = file;
    Utils.createImagePreview(file, `previewImage${pattern}`, null);
    this.updateAnalyzeButton();
  },

  // コピー生成ファイル処理
  handleCopyFile(file) {
    if (!this.validateFile(file)) return;
    
    AppState.uploadedImages.copy = file;
    Utils.createImagePreview(file, 'copyPreviewImage', 'copyImageName');
    this.updateGenerateButton();
  },

  // ファイル検証
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    
    if (!allowedTypes.includes(file.type)) {
      Utils.showToast('PNG、JPG、JPEG形式のファイルのみ対応しています', 'error');
      return false;
    }
    
    if (file.size > maxSize) {
      Utils.showToast('ファイルサイズは10MB以下にしてください', 'error');
      return false;
    }
    
    return true;
  },

  // 分析ボタン状態更新
  updateAnalyzeButton() {
    const button = document.getElementById('analyzeButton');
    if (!button) return;
    
    const isReady = AppState.analysisMode === 'single' 
      ? AppState.uploadedImages.single
      : AppState.uploadedImages.A && AppState.uploadedImages.B;
    
    button.disabled = !isReady;
  },

  // 生成ボタン状態更新
  updateGenerateButton() {
    const button = document.getElementById('generateButton');
    if (!button) return;
    
    button.disabled = !AppState.uploadedImages.copy;
  }
};

// 分析機能
const Analysis = {
  // 分析開始
  async startAnalysis() {
    const isABMode = AppState.analysisMode === 'ab';
    const endpoint = isABMode ? '/api/analysis/compare' : '/api/analysis/single';
    
    // 画像データの確認
    if (isABMode) {
      if (!AppState.uploadedImages.A || !AppState.uploadedImages.B) {
        Utils.showToast('A/B比較には2つの画像が必要です', 'error');
        return;
      }
    } else {
      if (!AppState.uploadedImages.single) {
        Utils.showToast('分析する画像をアップロードしてください', 'error');
        return;
      }
    }
    
    // UI状態更新
    this.setAnalyzing(true);
    
    try {
      // FormDataを使用して画像データを送信
      const formData = new FormData();
      formData.append('mode', AppState.analysisMode);
      
      if (isABMode) {
        formData.append('imageA', AppState.uploadedImages.A);
        formData.append('imageB', AppState.uploadedImages.B);
      } else {
        formData.append('image', AppState.uploadedImages.single);
      }
      
      // POSTリクエストで画像データを送信
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        AppState.currentResults = result.data;
        this.showResults(result.data, isABMode);
        Utils.showToast('分析が完了しました', 'success');
      } else {
        console.error('Analysis API error:', result);
        const errorMessage = result.error || result.debug?.error || '分析に失敗しました';
        Utils.showToast(`分析エラー: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Utils.showToast(`分析中にエラーが発生しました: ${error.message}`, 'error');
    } finally {
      this.setAnalyzing(false);
    }
  },

  // 分析中状態管理
  setAnalyzing(analyzing) {
    const button = document.getElementById('analyzeButton');
    const buttonText = document.getElementById('analyzeButtonText');
    const spinner = document.getElementById('analyzeSpinner');
    
    if (button && buttonText && spinner) {
      button.disabled = analyzing;
      
      if (analyzing) {
        buttonText.classList.add('hidden');
        spinner.classList.remove('hidden');
      } else {
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
      }
    }
  },

  // 結果表示
  showResults(results, isABMode) {
    const resultsSection = document.getElementById('resultsSection');
    const singleResults = document.getElementById('singleResults');
    const abResults = document.getElementById('abResults');
    
    if (!resultsSection) return;
    
    resultsSection.classList.remove('hidden');
    
    if (isABMode) {
      singleResults.classList.add('hidden');
      abResults.classList.remove('hidden');
      this.displayABResults(results);
    } else {
      abResults.classList.add('hidden');
      singleResults.classList.remove('hidden');
      this.displaySingleResults(results);
    }
    
    // 結果セクションまでスクロール
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  },

  // 単一分析結果表示
  displaySingleResults(results) {
    // 総合スコア
    const totalScore = document.getElementById('totalScore');
    const scoreLevel = document.getElementById('scoreLevel');
    
    if (totalScore) totalScore.textContent = results.totalScore;
    if (scoreLevel) scoreLevel.textContent = results.level;
    
    // 個別スコア
    this.renderIndividualScores(results.scores);
    
    // ターゲット適合度
    const targetMatch = document.getElementById('targetMatch');
    if (targetMatch) targetMatch.textContent = `${results.analysis.targetMatch}%`;
    
    // 強み
    this.renderList('strengthsList', results.analysis.strengths);
    
    // 改善提案
    this.renderList('improvementsList', results.analysis.improvements);
    
    // パフォーマンス指標
    this.renderPerformanceMetrics(results.analysis.performance);
  },

  // A/B比較結果表示
  displayABResults(results) {
    // 勝者発表
    const winnerAnnouncement = document.getElementById('winnerAnnouncement');
    if (winnerAnnouncement) {
      winnerAnnouncement.innerHTML = `
        <div class="text-4xl mb-4">🏆</div>
        <div class="text-3xl font-orbitron font-bold text-cyber-pink mb-2">
          勝者: パターン${results.winner}
        </div>
        <div class="text-lg text-white mb-2">
          予想CVR改善: <span class="text-cyber-green font-bold">+${results.cvrImprovement}%</span>
        </div>
        <div class="text-gray-300">
          統計的有意性: ${results.confidence}% | サンプル推定: ${results.sampleSize}クリック時
        </div>
      `;
    }
    
    // パターンスコア表示
    this.renderPatternScores('patternAScores', results.patternA.scores);
    this.renderPatternScores('patternBScores', results.patternB.scores);
    
    // 比較レポート
    this.renderComparisonReport(results.analysis);
    
    // アクション推奨
    this.renderActionRecommendations(results.analysis);
  },

  // 個別スコア描画
  renderIndividualScores(scores) {
    const container = document.getElementById('individualScores');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(scores).forEach(([key, data]) => {
      const scoreElement = document.createElement('div');
      scoreElement.className = 'bg-navy-700/30 border-l-4 p-3 rounded-r-lg';
      scoreElement.style.borderLeftColor = data.color;
      
      scoreElement.innerHTML = `
        <div class="flex justify-between items-center mb-1">
          <span class="text-white text-sm font-medium">${data.label}</span>
          <span class="font-bold" style="color: ${data.color}">${data.score}点</span>
        </div>
        <div class="progress-bar h-2">
          <div class="progress-fill" style="width: ${data.score}%; background: linear-gradient(90deg, ${data.color}, ${data.color})"></div>
        </div>
      `;
      
      container.appendChild(scoreElement);
    });
  },

  // リスト描画
  renderList(containerId, items) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = items.map(item => 
      `<li class="flex items-start"><i class="fas fa-check mr-2 text-cyber-green mt-1"></i><span>${item}</span></li>`
    ).join('');
  },

  // パフォーマンス指標描画
  renderPerformanceMetrics(performance) {
    const container = document.getElementById('performanceMetrics');
    if (!container) return;
    
    container.innerHTML = `
      <div class="text-center p-3 bg-navy-600/30 rounded-lg">
        <div class="text-lg font-bold text-cyber-blue">${performance.clickRate.current}% → ${performance.clickRate.improved}%</div>
        <div class="text-xs text-gray-400">クリック率 (+${performance.clickRate.change}%)</div>
      </div>
      <div class="text-center p-3 bg-navy-600/30 rounded-lg">
        <div class="text-lg font-bold text-cyber-green">${performance.conversionRate.current}% → ${performance.conversionRate.improved}%</div>
        <div class="text-xs text-gray-400">コンバージョン率 (+${performance.conversionRate.change}%)</div>
      </div>
      <div class="text-center p-3 bg-navy-600/30 rounded-lg">
        <div class="text-lg font-bold text-cyber-pink">+${performance.brandAwareness.change}%</div>
        <div class="text-xs text-gray-400">ブランド認知向上</div>
      </div>
    `;
  },

  // パターンスコア描画
  renderPatternScores(containerId, scores) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(scores).forEach(([key, data]) => {
      const scoreElement = document.createElement('div');
      scoreElement.className = 'flex justify-between items-center p-2 bg-navy-600/30 rounded text-sm';
      
      scoreElement.innerHTML = `
        <span class="text-gray-300">${data.label}</span>
        <span class="font-bold" style="color: ${data.color}">${data.score}点</span>
      `;
      
      container.appendChild(scoreElement);
    });
  },

  // 比較レポート描画
  renderComparisonReport(analysis) {
    const container = document.getElementById('comparisonReport');
    if (!container) return;
    
    container.innerHTML = `
      <div class="mb-4">
        <h5 class="text-cyber-green font-semibold mb-2">✅ パターンAの優位性:</h5>
        <ul class="space-y-1 ml-4">
          ${analysis.advantages.map(item => `<li>• ${item}</li>`).join('')}
        </ul>
      </div>
      <div class="mb-4">
        <h5 class="text-cyber-orange font-semibold mb-2">⚠️ パターンBの改善点:</h5>
        <ul class="space-y-1 ml-4">
          ${analysis.improvements.map(item => `<li>• ${item}</li>`).join('')}
        </ul>
      </div>
      <div>
        <h5 class="text-cyber-blue font-semibold mb-2">📈 期待効果 (${analysis.expectedResults.additionalConversions}コンバージョン増):</h5>
        <p class="ml-4">CVR: ${analysis.expectedResults.currentCvr}% → ${analysis.expectedResults.improvedCvr}%</p>
        <p class="ml-4">ROI改善: +${analysis.expectedResults.roiImprovement}% | CPA削減: -${analysis.expectedResults.cpaReduction}%</p>
      </div>
    `;
  },

  // アクション推奨描画
  renderActionRecommendations(analysis) {
    const container = document.getElementById('actionRecommendations');
    if (!container) return;
    
    container.innerHTML = `
      <div class="space-y-2">
        <div>1. <strong>パターンAを本番環境に適用</strong></div>
        <div>2. <strong>既存バナーとの効果比較測定を開始</strong></div>
        <div>3. <strong>1週間後に成果レビューを実施</strong></div>
      </div>
    `;
  }
};

// コピー生成機能
const CopyGeneration = {
  // 生成開始
  async startGeneration() {
    this.setGenerating(true);
    
    try {
      const settings = this.getGenerationSettings();
      const result = await Utils.apiCall('/api/copy-generation', settings);
      
      if (result.success) {
        this.showCopyResults(result.result);
        Utils.showToast('コピー生成が完了しました', 'success');
      } else {
        Utils.showToast(result.message, 'error');
      }
    } catch (error) {
      Utils.showToast('生成中にエラーが発生しました', 'error');
    } finally {
      this.setGenerating(false);
    }
  },

  // 生成設定取得
  getGenerationSettings() {
    return {
      industry: document.getElementById('copyIndustry')?.value || '美容',
      platform: document.getElementById('copyPlatform')?.value || 'Instagram',
      ageGroup: document.getElementById('copyAgeGroup')?.value || '20代',
      tone: document.getElementById('copyTone')?.value || 'フレンドリー',
      count: parseInt(document.getElementById('copyCount')?.value || '5'),
      includeEmoji: document.getElementById('includeEmoji')?.checked || false,
      urgencyElement: document.getElementById('urgencyElement')?.checked || false
    };
  },

  // 生成中状態管理
  setGenerating(generating) {
    const button = document.getElementById('generateButton');
    const buttonText = document.getElementById('generateButtonText');
    const spinner = document.getElementById('generateSpinner');
    
    if (button && buttonText && spinner) {
      button.disabled = generating;
      
      if (generating) {
        buttonText.classList.add('hidden');
        spinner.classList.remove('hidden');
      } else {
        buttonText.classList.remove('hidden');
        spinner.classList.add('hidden');
      }
    }
  },

  // 結果表示
  showCopyResults(results) {
    const resultsSection = document.getElementById('copyResultsSection');
    if (!resultsSection) return;
    
    resultsSection.classList.remove('hidden');
    
    // 全体分析更新
    this.updateOverallAnalysis(results.analysis);
    
    // コピー結果描画
    this.renderGeneratedCopies(results.copies);
    
    // 推奨事項描画
    this.renderCopyRecommendations(results.analysis.recommendations);
    
    // 結果セクションまでスクロール
    resultsSection.scrollIntoView({ behavior: 'smooth' });
  },

  // 全体分析更新
  updateOverallAnalysis(analysis) {
    const overallScore = document.getElementById('overallScore');
    const industryMatch = document.getElementById('industryMatch');
    const targetAudience = document.getElementById('targetAudience');
    
    if (overallScore) overallScore.textContent = analysis.overallScore;
    if (industryMatch) industryMatch.textContent = `${analysis.industryMatch}%`;
    if (targetAudience) targetAudience.textContent = analysis.targetAudience;
  },

  // 生成されたコピー描画
  renderGeneratedCopies(copies) {
    const container = document.getElementById('generatedCopies');
    if (!container) return;
    
    container.innerHTML = copies.map(copy => `
      <div class="copy-item bg-navy-700/30 border border-gray-600 rounded-xl p-6 hover:border-cyber-${this.getTypeColor(copy.type)}/50 transition-all duration-300">
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm font-semibold text-cyber-${this.getTypeColor(copy.type)} bg-cyber-${this.getTypeColor(copy.type)}/20 px-3 py-1 rounded-full">
            ${copy.type}
          </span>
          <div class="flex items-center">
            <span class="text-sm text-gray-400 mr-2">効果予測</span>
            <span class="font-bold text-cyber-green">${copy.effectiveness}%</span>
          </div>
        </div>
        
        <div class="mb-4">
          <p class="text-white text-lg font-medium leading-relaxed">"${copy.text}"</p>
        </div>
        
        <div class="effectiveness-bar mb-3">
          <div class="effectiveness-fill" style="width: ${copy.effectiveness}%"></div>
        </div>
        
        <p class="text-gray-400 text-sm">${copy.reasoning}</p>
        
        <div class="mt-4 flex justify-between items-center">
          <button onclick="CopyGeneration.copySingleText('${copy.text.replace(/'/g, "\\'")}')" 
                  class="text-xs text-cyber-blue hover:text-cyber-purple transition-colors">
            <i class="fas fa-copy mr-1"></i>コピー
          </button>
          <button onclick="CopyGeneration.selectCopy(${copy.id})" 
                  class="text-xs text-cyber-green hover:text-cyber-pink transition-colors">
            <i class="fas fa-star mr-1"></i>お気に入り
          </button>
        </div>
      </div>
    `).join('');
  },

  // コピータイプの色取得
  getTypeColor(type) {
    const colors = {
      'メインコピー': 'blue',
      'キャッチコピー': 'green',
      'CTAコピー': 'pink',
      'サブコピー': 'orange'
    };
    return colors[type] || 'blue';
  },

  // 推奨事項描画
  renderCopyRecommendations(recommendations) {
    const container = document.getElementById('copyRecommendations');
    if (!container) return;
    
    container.innerHTML = recommendations.map((rec, index) => 
      `<div>${index + 1}. <strong>${rec}</strong></div>`
    ).join('');
  },

  // 単一コピーをクリップボードにコピー
  copySingleText(text) {
    navigator.clipboard.writeText(text).then(() => {
      Utils.showToast('コピーしました', 'success');
    }).catch(() => {
      Utils.showToast('コピーに失敗しました', 'error');
    });
  },

  // 全コピーをクリップボードにコピー
  copyAllCopies() {
    const copyItems = document.querySelectorAll('.copy-item');
    let allText = '';
    
    copyItems.forEach((item, index) => {
      const type = item.querySelector('.text-cyber-blue, .text-cyber-green, .text-cyber-pink, .text-cyber-orange').textContent;
      const text = item.querySelector('.text-white').textContent.replace(/"/g, '');
      allText += `${index + 1}. ${type}: ${text}\n`;
    });
    
    navigator.clipboard.writeText(allText).then(() => {
      Utils.showToast('全てのコピーをクリップボードにコピーしました', 'success');
    }).catch(() => {
      Utils.showToast('コピーに失敗しました', 'error');
    });
  },

  // コピー選択
  selectCopy(copyId) {
    // お気に入り機能の実装（ここでは簡単な視覚フィードバック）
    Utils.showToast('お気に入りに追加しました', 'success');
  }
};

// ページ初期化
document.addEventListener('DOMContentLoaded', function() {
  // モバイルメニュートグル
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
  
  // ログインフォーム - Firebase認証を使用
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(loginForm);
      
      // Firebase認証モジュールをインポート
      try {
        const { login } = await import('/static/js/auth.js');
        await login(formData.get('email'), formData.get('password'));
      } catch (error) {
        console.error('Login failed:', error);
        Utils.showToast('ログインに失敗しました: ' + error.message, 'error');
      }
    });
  }
  
  // デモログインボタン - 修正版
  const demoLoginButton = document.getElementById('demoLoginButton');
  if (demoLoginButton) {
    demoLoginButton.addEventListener('click', () => {
      const emailField = document.getElementById('email');
      const passwordField = document.getElementById('password');
      if (emailField && passwordField) {
        emailField.value = 'demo@banasuko.com';
        passwordField.value = 'demo123';
      }
    });
  }
  
  // 登録フォーム表示切り替え
  const showRegisterForm = document.getElementById('showRegisterForm');
  const showLoginForm = document.getElementById('showLoginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (showRegisterForm && registerForm) {
    showRegisterForm.addEventListener('click', () => {
      registerForm.classList.remove('hidden');
    });
  }
  
  if (showLoginForm && registerForm) {
    showLoginForm.addEventListener('click', () => {
      registerForm.classList.add('hidden');
    });
  }
  
  // 登録フォーム送信 - Firebase認証を使用
  const registerFormElement = document.getElementById('registerFormElement');
  if (registerFormElement) {
    registerFormElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(registerFormElement);
      
      try {
        const { register } = await import('/static/js/auth.js');
        await register(
          formData.get('email'),
          formData.get('password')
        );
      } catch (error) {
        console.error('Registration failed:', error);
        Utils.showToast('登録に失敗しました: ' + error.message, 'error');
      }
    });
  }
  
  // A/Bモード切り替え
  const abMode = document.getElementById('abMode');
  if (abMode) {
    abMode.addEventListener('change', (e) => {
      AppState.analysisMode = e.target.checked ? 'ab' : 'single';
      
      const singleUpload = document.getElementById('singleUpload');
      const abUpload = document.getElementById('abUpload');
      
      if (singleUpload && abUpload) {
        if (e.target.checked) {
          singleUpload.classList.add('hidden');
          abUpload.classList.remove('hidden');
        } else {
          singleUpload.classList.remove('hidden');
          abUpload.classList.add('hidden');
        }
      }
      
      ImageUpload.updateAnalyzeButton();
    });
  }
  
  // 画像アップロード初期化 - HTML要素の準備が完全に整うのを少し待つ
  setTimeout(() => {
    ImageUpload.initSingleUpload();
    ImageUpload.initABUpload();
    ImageUpload.initCopyUpload();
  }, 100); // 100ミリ秒の遅延を追加
  
  // 分析ボタン
  const analyzeButton = document.getElementById('analyzeButton');
  if (analyzeButton) {
    analyzeButton.addEventListener('click', Analysis.startAnalysis.bind(Analysis));
  }
  
  // コピー生成ボタン
  const generateButton = document.getElementById('generateButton');
  if (generateButton) {
    generateButton.addEventListener('click', CopyGeneration.startGeneration.bind(CopyGeneration));
  }
  
  // 全コピーボタン
  const copyAllButton = document.getElementById('copyAllButton');
  if (copyAllButton) {
    copyAllButton.addEventListener('click', CopyGeneration.copyAllCopies.bind(CopyGeneration));
  }
  
  // パーティクル効果（軽量版）
  if (window.innerWidth > 768) {
    createParticles();
  }
});

// パーティクル効果
function createParticles() {
  const particlesContainer = document.createElement('div');
  particlesContainer.className = 'particles';
  document.body.appendChild(particlesContainer);
  
  function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 10 + 's';
    particle.style.animationDuration = (10 + Math.random() * 20) + 's';
    
    particlesContainer.appendChild(particle);
    
    setTimeout(() => {
      if (particlesContainer.contains(particle)) {
        particlesContainer.removeChild(particle);
      }
    }, 30000);
  }
  
  // パーティクルを定期的に生成
  setInterval(createParticle, 3000);
}