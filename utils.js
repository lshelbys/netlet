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
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9998;
        `;
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 32px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 3px solid #1E3A8A;
                    border-top-color: transparent;
                    border-radius: 50%;
                    margin: 0 auto 16px;
                    animation: spin 0.8s linear infinite;
                "></div>
                <p style="margin: 0; color: #404553; font-weight: 500;">${message}</p>
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
    new Toast(`Error${context ? ` (${context})` : ''}: ${message}`, 'error', 5000);
}

// Global toast styles (inject once)
function injectToastStyles() {
    if (document.getElementById('toast-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'toast-styles';
    styles.textContent = `
        .toast {
            background: white;
            color: #404553;
            padding: 14px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-weight: 500;
            font-size: 14px;
            border-left: 4px solid #999;
            max-width: 100%;
            word-break: break-word;
        }

        .toast-success {
            border-left-color: #28a745;
            background: #d4edda;
            color: #155724;
        }

        .toast-error {
            border-left-color: #E61C38;
            background: #f8d7da;
            color: #721c24;
        }

        .toast-info {
            border-left-color: #1E3A8A;
            background: #d1ecf1;
            color: #0c5460;
        }

        .toast-warning {
            border-left-color: #ffc107;
            background: #fff3cd;
            color: #856404;
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

// Initialize on DOM load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectToastStyles);
} else {
    injectToastStyles();
}

export { Toast, LoadingOverlay, RateLimiter, handleError, injectToastStyles };
