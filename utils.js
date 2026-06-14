// Toast notification system
class Toast {
    constructor(message, type = 'info', duration = 3000) {
        this.message = message;
        this.type = type; // 'success', 'error', 'info', 'warning'
        this.duration = duration;
        this.show();
    }

    show() {
        const container = document.getElementById('toast-container') || this.createContainer();

        // Remove any existing toast with the same message
        const existingToasts = container.querySelectorAll('.toast');
        for (const existingToast of existingToasts) {
            if (existingToast.textContent === this.message) {
                existingToast.style.animation = 'slideOut 0.3s ease-out forwards';
                setTimeout(() => existingToast.remove(), 300);
            }
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${this.type}`;
        toast.textContent = this.message;
        toast.style.cssText = `
            animation: slideIn 0.3s ease-out;
        `;
        container.appendChild(toast);

        if (this.duration > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-out forwards';
                setTimeout(() => toast.remove(), 300);
            }, this.duration);
        }

        return toast;
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }
}

// Loading spinner overlay
class LoadingOverlay {
    static show(message = 'Loading...') {
        let overlay = document.getElementById('loading-overlay');
        if (overlay) return; // Already showing

        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9998;
        `;
        overlay.innerHTML = `
            <div style="
                background: rgba(255, 255, 255, 0.7);
                backdrop-filter: blur(25px) saturate(210%);
                -webkit-backdrop-filter: blur(25px) saturate(210%);
                border: 1px solid rgba(255, 255, 255, 0.5);
                padding: 40px 48px;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.8);
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(30, 58, 138, 0.2);
                    border-top-color: #1E3A8A;
                    border-radius: 50%;
                    margin: 0 auto 20px;
                    animation: spin 0.8s linear infinite;
                "></div>
                <p style="margin: 0; color: #1F2229; font-weight: 600; font-size: 15px;">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    static hide() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => overlay.remove(), 300);
        }
    }
}

// Rate limiter utility
class RateLimiter {
    constructor(maxCalls = 5, windowMs = 1000) {
        this.maxCalls = maxCalls;
        this.windowMs = windowMs;
        this.calls = [];
    }

    isAllowed() {
        const now = Date.now();
        this.calls = this.calls.filter(time => now - time < this.windowMs);

        if (this.calls.length < this.maxCalls) {
            this.calls.push(now);
            return true;
        }
        return false;
    }

    reset() {
        this.calls = [];
    }
}

// Error boundary helper
function handleError(error, context = '') {
    console.error(`[${context}]`, error);
    const message = error.message || 'An unexpected error occurred.';
    new Toast(`Error${context ? ` (${context})` : ''}: ${message}`, 'error', 6000);
}

// Global toast styles (inject once)
function injectToastStyles() {
    if (document.getElementById('toast-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
        .toast {
            backdrop-filter: blur(25px) saturate(210%);
            -webkit-backdrop-filter: blur(25px) saturate(210%);
            padding: 14px 20px;
            border-radius: 12px;
            box-shadow:
                0 4px 30px rgba(0, 0, 0, 0.05),
                inset 0 1px 1px rgba(255, 255, 255, 0.5);
            font-weight: 600;
            font-size: 14px;
            max-width: 100%;
            word-break: break-word;
            border-left: 4px solid;
        }

        .toast-success {
            background: rgba(40, 167, 69, 0.2);
            color: #1F2229;
            border-left-color: #28a745;
            border-color: rgba(40, 167, 69, 0.3);
            border: 1px solid rgba(40, 167, 69, 0.3);
            border-left: 4px solid #28a745;
        }

        .toast-error {
            background: rgba(230, 28, 56, 0.2);
            color: #1F2229;
            border-left-color: #E61C38;
            border-color: rgba(230, 28, 56, 0.3);
            border: 1px solid rgba(230, 28, 56, 0.3);
            border-left: 4px solid #E61C38;
        }

        .toast-info {
            background: rgba(30, 58, 138, 0.2);
            color: #1F2229;
            border-left-color: #1E3A8A;
            border-color: rgba(30, 58, 138, 0.3);
            border: 1px solid rgba(30, 58, 138, 0.3);
            border-left: 4px solid #1E3A8A;
        }

        .toast-warning {
            background: rgba(255, 193, 7, 0.2);
            color: #1F2229;
            border-left-color: #FFC107;
            border-color: rgba(255, 193, 7, 0.3);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-left: 4px solid #FFC107;
        }

        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }

        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            #toast-container {
                left: 12px !important;
                right: 12px !important;
                max-width: calc(100% - 24px) !important;
            }
        }
    `;
    document.head.appendChild(styles);
}

// Skeleton loader for product cards
class SkeletonLoader {
    static createProductCardSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'skeleton-card';
        skeleton.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-brand"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-price"></div>
            <div class="skeleton-button"></div>
        `;
        return skeleton;
    }

    static injectStyles() {
        if (document.getElementById('skeleton-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'skeleton-styles';
        styles.textContent = `
            .skeleton-card {
                background: rgba(255, 255, 255, 0.4);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border-radius: 16px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                animation: pulse 2s ease-in-out infinite;
            }

            .skeleton-image {
                width: 100%;
                height: 150px;
                background: rgba(200, 200, 200, 0.3);
                border-radius: 12px;
            }

            .skeleton-brand {
                width: 60%;
                height: 12px;
                background: rgba(200, 200, 200, 0.3);
                border-radius: 6px;
            }

            .skeleton-title {
                width: 100%;
                height: 16px;
                background: rgba(200, 200, 200, 0.3);
                border-radius: 6px;
                margin-bottom: 4px;
            }

            .skeleton-title::after {
                content: '';
                display: block;
                width: 80%;
                height: 16px;
                background: rgba(200, 200, 200, 0.3);
                border-radius: 6px;
                margin-top: 8px;
            }

            .skeleton-price {
                width: 50%;
                height: 18px;
                background: rgba(200, 200, 200, 0.3);
                border-radius: 6px;
            }

            .skeleton-button {
                width: 100%;
                height: 36px;
                background: rgba(200, 200, 200, 0.3);
                border-radius: 8px;
            }

            @keyframes pulse {
                0%, 100% {
                    opacity: 0.6;
                }
                50% {
                    opacity: 0.9;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Initialize skeleton styles on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        injectToastStyles();
        SkeletonLoader.injectStyles();
    });
} else {
    injectToastStyles();
    SkeletonLoader.injectStyles();
}

export { Toast, LoadingOverlay, RateLimiter, SkeletonLoader, handleError, injectToastStyles };
