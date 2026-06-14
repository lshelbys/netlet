import { escapeHtml } from './inventory.js';
import { Toast } from './utils.js';

class ReviewsSystem {
    constructor(productId, containerSelector) {
        this.productId = productId;
        this.container = document.querySelector(containerSelector);
        this.reviews = this.loadReviews();
    }

    loadReviews() {
        const allReviews = JSON.parse(localStorage.getItem('netletReviews')) || {};
        return allReviews[this.productId] || [];
    }

    saveReviews() {
        const allReviews = JSON.parse(localStorage.getItem('netletReviews')) || {};
        allReviews[this.productId] = this.reviews;
        localStorage.setItem('netletReviews', JSON.stringify(allReviews));
    }

    addReview(name, rating, comment) {
        if (!name || !rating || !comment) {
            new Toast('Please fill in all fields', 'warning', 4000);
            return false;
        }

        const review = {
            id: Date.now(),
            name: escapeHtml(name),
            rating: parseInt(rating),
            comment: escapeHtml(comment),
            date: new Date().toLocaleDateString(),
            helpful: 0
        };

        this.reviews.unshift(review);
        this.saveReviews();
        new Toast('Review added successfully!', 'success', 4000);
        return true;
    }

    getAverageRating() {
        if (this.reviews.length === 0) return 0;
        const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / this.reviews.length).toFixed(1);
    }

    getRatingDistribution() {
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        this.reviews.forEach(review => {
            distribution[review.rating]++;
        });
        return distribution;
    }

    render() {
        if (!this.container) return;

        const avgRating = this.getAverageRating();
        const distribution = this.getRatingDistribution();
        const total = this.reviews.length;

        const html = `
            <div class="reviews-container">
                <h2 style="font-size: 24px; font-weight: 700; color: #1F2229; margin-bottom: 24px;">
                    <i class="fas fa-star" style="color: #FFC107; margin-right: 8px;"></i>Customer Reviews
                </h2>

                <!-- Review Summary -->
                <div class="review-summary" style="
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(20px) saturate(180%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 32px;
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 24px;
                ">
                    <div style="text-align: center;">
                        <div style="font-size: 48px; font-weight: 800; color: #1E3A8A; margin-bottom: 8px;">
                            ${avgRating}
                        </div>
                        <div style="color: #FFC107; margin-bottom: 8px;">
                            ${this.renderStars(Math.round(avgRating))}
                        </div>
                        <div style="font-size: 14px; color: #7E859B;">
                            Based on ${total} ${total === 1 ? 'review' : 'reviews'}
                        </div>
                    </div>

                    <div>
                        ${[5, 4, 3, 2, 1].map(stars => {
                            const count = distribution[stars];
                            const percentage = total > 0 ? (count / total * 100).toFixed(0) : 0;
                            return `
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                    <span style="font-size: 13px; color: #7E859B; min-width: 30px;">${stars} ${stars === 1 ? 'star' : 'stars'}</span>
                                    <div style="flex: 1; height: 6px; background: rgba(200, 200, 200, 0.3); border-radius: 3px; overflow: hidden;">
                                        <div style="height: 100%; background: linear-gradient(135deg, #1E3A8A 0%, #0F2550 100%); width: ${percentage}%;"></div>
                                    </div>
                                    <span style="font-size: 13px; color: #7E859B; min-width: 30px; text-align: right;">${count}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Review Form -->
                <div class="review-form" style="
                    background: rgba(255, 255, 255, 0.4);
                    backdrop-filter: blur(20px) saturate(180%);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 32px;
                ">
                    <h3 style="font-size: 18px; font-weight: 700; color: #1F2229; margin-bottom: 16px;">
                        Share Your Experience
                    </h3>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; font-weight: 600; color: #1F2229; margin-bottom: 8px;">
                            Your Name
                        </label>
                        <input
                            type="text"
                            id="reviewName"
                            placeholder="Enter your name"
                            style="
                                width: 100%;
                                padding: 10px 12px;
                                border: 1px solid rgba(126, 133, 155, 0.3);
                                border-radius: 8px;
                                font-size: 14px;
                                background: rgba(255, 255, 255, 0.8);
                            "
                        >
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; font-weight: 600; color: #1F2229; margin-bottom: 8px;">
                            Rating
                        </label>
                        <div id="ratingInput" style="display: flex; gap: 8px;">
                            ${[1, 2, 3, 4, 5].map(star => `
                                <button
                                    class="rating-star"
                                    data-rating="${star}"
                                    style="
                                        font-size: 24px;
                                        background: none;
                                        border: none;
                                        cursor: pointer;
                                        color: #ddd;
                                        transition: color 0.2s;
                                    "
                                >
                                    ★
                                </button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="selectedRating" value="0">
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; font-weight: 600; color: #1F2229; margin-bottom: 8px;">
                            Your Review
                        </label>
                        <textarea
                            id="reviewComment"
                            placeholder="Share your thoughts about this product..."
                            style="
                                width: 100%;
                                padding: 12px;
                                border: 1px solid rgba(126, 133, 155, 0.3);
                                border-radius: 8px;
                                font-size: 14px;
                                background: rgba(255, 255, 255, 0.8);
                                min-height: 100px;
                                resize: vertical;
                                font-family: inherit;
                            "
                        ></textarea>
                    </div>

                    <button
                        id="submitReview"
                        style="
                            width: 100%;
                            padding: 12px;
                            background: linear-gradient(135deg, #1E3A8A 0%, #0F2550 100%);
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s;
                            font-size: 14px;
                        "
                    >
                        <i class="fas fa-paper-plane"></i> Submit Review
                    </button>
                </div>

                <!-- Reviews List -->
                <div class="reviews-list">
                    ${this.reviews.length === 0
                        ? '<p style="text-align: center; color: #7E859B; padding: 40px 20px;">No reviews yet. Be the first to review!</p>'
                        : this.reviews.map((review, index) => `
                            <div style="
                                background: rgba(255, 255, 255, 0.4);
                                backdrop-filter: blur(20px);
                                border-radius: 12px;
                                padding: 20px;
                                margin-bottom: 16px;
                                border: 1px solid rgba(255, 255, 255, 0.3);
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                                    <div>
                                        <div style="font-weight: 700; color: #1F2229; margin-bottom: 4px;">
                                            ${review.name}
                                        </div>
                                        <div style="font-size: 13px; color: #7E859B;">
                                            ${review.date}
                                        </div>
                                    </div>
                                    <div style="color: #FFC107; font-size: 14px;">
                                        ${this.renderStars(review.rating)}
                                    </div>
                                </div>
                                <p style="color: #404553; font-size: 14px; line-height: 1.6; margin: 0;">
                                    ${review.comment}
                                </p>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? '★' : '☆';
        }
        return stars;
    }

    attachEventListeners() {
        // Rating star selection
        document.querySelectorAll('.rating-star').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = e.target.dataset.rating;
                document.getElementById('selectedRating').value = rating;

                document.querySelectorAll('.rating-star').forEach((b, index) => {
                    b.style.color = index + 1 <= rating ? '#FFC107' : '#ddd';
                });
            });

            btn.addEventListener('mouseover', (e) => {
                const rating = e.target.dataset.rating;
                document.querySelectorAll('.rating-star').forEach((b, index) => {
                    b.style.color = index + 1 <= rating ? '#FFC107' : '#ddd';
                });
            });
        });

        document.getElementById('ratingInput').addEventListener('mouseout', () => {
            const selected = document.getElementById('selectedRating').value;
            document.querySelectorAll('.rating-star').forEach((b, index) => {
                b.style.color = index + 1 <= selected ? '#FFC107' : '#ddd';
            });
        });

        // Submit review
        document.getElementById('submitReview').addEventListener('click', () => {
            const name = document.getElementById('reviewName').value;
            const rating = document.getElementById('selectedRating').value;
            const comment = document.getElementById('reviewComment').value;

            if (this.addReview(name, rating, comment)) {
                // Clear form
                document.getElementById('reviewName').value = '';
                document.getElementById('selectedRating').value = 0;
                document.getElementById('reviewComment').value = '';
                document.querySelectorAll('.rating-star').forEach(b => {
                    b.style.color = '#ddd';
                });

                // Re-render
                this.render();

                // Scroll to reviews
                setTimeout(() => {
                    this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        });
    }
}

export { ReviewsSystem };
