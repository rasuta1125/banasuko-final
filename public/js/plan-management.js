/**
 * Plan Management JavaScript
 * バナスコAI Plan Management functionality
 */

class PlanManagement {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadUserPlan();
    }

    initializeElements() {
        // Plan cards
        this.planCards = document.querySelectorAll('.plan-card');
        
        // Modals
        this.confirmModal = document.getElementById('confirmModal');
        this.successModal = document.getElementById('successModal');
        
        // Modal elements
        this.confirmPlanName = document.getElementById('confirmPlanName');
        this.confirmPlanPrice = document.getElementById('confirmPlanPrice');
        this.confirmButton = document.getElementById('confirmButton');
        this.cancelButton = document.getElementById('cancelButton');
        this.closeModalButtons = document.querySelectorAll('.close-modal');
        
        // Loading states
        this.loadingStates = new Map();
        
        // Current selection
        this.selectedPlan = null;
    }

    bindEvents() {
        // Plan selection buttons
        document.querySelectorAll('.select-plan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const planType = btn.dataset.plan;
                this.selectPlan(planType);
            });
        });

        // Modal events
        if (this.confirmButton) {
            this.confirmButton.addEventListener('click', () => this.confirmPlanChange());
        }
        
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', () => this.closeModal());
        }

        // Close modal events
        this.closeModalButtons.forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });

        // Close modal on backdrop click
        [this.confirmModal, this.successModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal();
                    }
                });
            }
        });

        // FAQ toggle
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isOpen = answer.style.display === 'block';
                
                // Close all FAQ answers
                document.querySelectorAll('.faq-answer').forEach(ans => {
                    ans.style.display = 'none';
                });
                
                // Toggle current answer
                answer.style.display = isOpen ? 'none' : 'block';
            });
        });
    }

    async loadUserPlan() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                console.warn('No authentication token found');
                return;
            }

            const response = await fetch('/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                this.updateCurrentPlanDisplay(userData.plan);
            }
        } catch (error) {
            console.error('Error loading user plan:', error);
        }
    }

    updateCurrentPlanDisplay(currentPlan) {
        // Update plan cards to show current plan
        this.planCards.forEach(card => {
            const planType = card.dataset.plan;
            const selectBtn = card.querySelector('.select-plan-btn');
            
            if (planType === currentPlan) {
                card.classList.add('current-plan');
                if (selectBtn) {
                    selectBtn.textContent = '現在のプラン';
                    selectBtn.disabled = true;
                    selectBtn.classList.add('current');
                }
            } else {
                card.classList.remove('current-plan');
                if (selectBtn) {
                    selectBtn.textContent = 'このプランを選択';
                    selectBtn.disabled = false;
                    selectBtn.classList.remove('current');
                }
            }
        });
    }

    selectPlan(planType) {
        // Get plan details
        const planDetails = this.getPlanDetails(planType);
        
        if (!planDetails) {
            console.error('Invalid plan type:', planType);
            return;
        }

        this.selectedPlan = {
            type: planType,
            ...planDetails
        };

        // Update confirmation modal
        if (this.confirmPlanName) {
            this.confirmPlanName.textContent = planDetails.name;
        }
        if (this.confirmPlanPrice) {
            this.confirmPlanPrice.textContent = planDetails.price;
        }

        // Show confirmation modal
        this.showModal(this.confirmModal);
    }

    getPlanDetails(planType) {
        const plans = {
            'free': {
                name: 'フリープラン',
                price: '無料',
                features: ['月10回まで画像解析', '基本的なAIコピー生成', 'コミュニティサポート']
            },
            'basic': {
                name: 'ベーシックプラン',
                price: '¥2,980/月',
                features: ['月100回まで画像解析', '高品質AIコピー生成', 'A/B比較分析', 'メールサポート']
            },
            'premium': {
                name: 'プレミアムプラン',
                price: '¥9,800/月',
                features: ['無制限画像解析', 'プレミアムAI機能', '詳細分析レポート', '優先サポート', 'API アクセス']
            }
        };

        return plans[planType] || null;
    }

    async confirmPlanChange() {
        if (!this.selectedPlan) {
            console.error('No plan selected');
            return;
        }

        // Start loading
        this.setLoading(this.confirmButton, true);

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                throw new Error('認証が必要です');
            }

            const response = await fetch('/api/user/plan', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plan: this.selectedPlan.type
                })
            });

            const result = await response.json();

            if (response.ok) {
                // Update display
                this.updateCurrentPlanDisplay(this.selectedPlan.type);
                
                // Close confirmation modal and show success
                this.closeModal();
                this.showSuccessModal();
                
                // Update user info in header if available
                if (window.authManager) {
                    window.authManager.updateUserInfo();
                }
            } else {
                throw new Error(result.error || 'プラン変更に失敗しました');
            }
        } catch (error) {
            console.error('Error changing plan:', error);
            alert(`エラー: ${error.message}`);
        } finally {
            this.setLoading(this.confirmButton, false);
        }
    }

    showModal(modal) {
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        [this.confirmModal, this.successModal].forEach(modal => {
            if (modal) {
                modal.style.display = 'none';
            }
        });
        document.body.style.overflow = 'auto';
        this.selectedPlan = null;
    }

    showSuccessModal() {
        this.showModal(this.successModal);
        
        // Auto close after 3 seconds
        setTimeout(() => {
            this.closeModal();
        }, 3000);
    }

    setLoading(element, isLoading) {
        if (!element) return;

        if (isLoading) {
            this.loadingStates.set(element, element.textContent);
            element.textContent = '処理中...';
            element.disabled = true;
        } else {
            const originalText = this.loadingStates.get(element);
            if (originalText) {
                element.textContent = originalText;
                this.loadingStates.delete(element);
            }
            element.disabled = false;
        }
    }

    // Utility method to format price
    formatPrice(price) {
        if (price === 0) return '無料';
        return `¥${price.toLocaleString()}/月`;
    }

    // Method to check if plan upgrade is available
    canUpgrade(currentPlan, targetPlan) {
        const planHierarchy = ['free', 'basic', 'premium'];
        const currentIndex = planHierarchy.indexOf(currentPlan);
        const targetIndex = planHierarchy.indexOf(targetPlan);
        
        return targetIndex > currentIndex;
    }

    // Method to get plan comparison
    getPlanComparison(plan1, plan2) {
        const details1 = this.getPlanDetails(plan1);
        const details2 = this.getPlanDetails(plan2);
        
        return {
            from: details1,
            to: details2,
            isUpgrade: this.canUpgrade(plan1, plan2)
        };
    }
}

// Initialize plan management when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the plan management page
    if (document.querySelector('.plan-comparison')) {
        window.planManagement = new PlanManagement();
    }
});

// Expose class globally for other scripts to use
window.PlanManagement = PlanManagement;