// Advanced Dashboard Features

class DashboardManager {
    constructor() {
        this.notifications = [];
        this.realTimeData = {};
        this.charts = {};
        this.init();
    }

    init() {
        this.setupRealTimeUpdates();
        this.setupNotifications();
        this.setupAnimations();
        this.setupCharts();
    }

    // Real-time data updates
    setupRealTimeUpdates() {
        setInterval(() => {
            this.updateLiveStats();
            this.updateClock();
        }, 1000);
    }

    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const dateString = now.toLocaleDateString();
        
        const clockElement = document.getElementById('liveClock');
        if (clockElement) {
            clockElement.innerHTML = `
                <div class="time">${timeString}</div>
                <div class="date">${dateString}</div>
            `;
        }
    }

    updateLiveStats() {
        // Simulate real-time data updates
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const currentValue = parseInt(stat.textContent);
            if (Math.random() > 0.95) { // 5% chance to update
                const newValue = currentValue + Math.floor(Math.random() * 3);
                this.animateNumber(stat, currentValue, newValue);
            }
        });
    }

    animateNumber(element, from, to) {
        const duration = 1000;
        const start = Date.now();
        
        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - start) / duration, 1);
            const current = Math.floor(from + (to - from) * progress);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    // Advanced notifications
    setupNotifications() {
        this.createNotificationSystem();
    }

    createNotificationSystem() {
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${this.getNotificationIcon(type)}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        const container = document.getElementById('notificationContainer');
        container.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => container.removeChild(notification), 300);
        }, duration);

        // Manual close
        notification.querySelector('.notification-close').onclick = () => {
            notification.classList.add('hide');
            setTimeout(() => container.removeChild(notification), 300);
        };
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    // Setup animations
    setupAnimations() {
        this.observeElements();
        this.setupHoverEffects();
    }

    observeElements() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    setupHoverEffects() {
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.05)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    // Charts setup
    setupCharts() {
        this.createAttendanceChart();
        this.createPerformanceChart();
    }

    createAttendanceChart() {
        const canvas = document.getElementById('attendanceChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
        gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');

        // Simple chart implementation
        this.drawChart(ctx, gradient);
    }

    drawChart(ctx, gradient) {
        const data = [65, 78, 82, 88, 92, 85, 90];
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;

        // Draw chart (simplified)
        ctx.beginPath();
        data.forEach((value, index) => {
            const x = (index * 50) + 50;
            const y = 200 - (value * 1.5);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }

    // Advanced search and filter
    setupAdvancedSearch() {
        const searchInput = document.getElementById('advancedSearch');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            this.filterData(e.target.value);
        });
    }

    filterData(query) {
        const rows = document.querySelectorAll('.table tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(query.toLowerCase());
            row.style.display = matches ? '' : 'none';
            
            if (matches) {
                row.classList.add('highlight-match');
                setTimeout(() => row.classList.remove('highlight-match'), 2000);
            }
        });
    }

    // Export functionality
    exportData(format = 'csv') {
        const data = this.collectTableData();
        
        switch (format) {
            case 'csv':
                this.exportCSV(data);
                break;
            case 'json':
                this.exportJSON(data);
                break;
            case 'pdf':
                this.exportPDF(data);
                break;
        }
    }

    collectTableData() {
        const table = document.querySelector('.table');
        const data = [];
        
        if (table) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const rowData = Array.from(cells).map(cell => cell.textContent);
                data.push(rowData);
            });
        }
        
        return data;
    }

    exportCSV(data) {
        const csv = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully!', 'success');
    }

    // Dark mode toggle
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }

    // Initialize dashboard
    static init() {
        return new DashboardManager();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = DashboardManager.init();
});

// Add CSS for notifications
const notificationCSS = `
.notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    pointer-events: none;
}

.notification {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    margin-bottom: 10px;
    transform: translateX(400px);
    transition: all 0.3s ease;
    pointer-events: all;
    min-width: 300px;
}

.notification.show {
    transform: translateX(0);
}

.notification.hide {
    transform: translateX(400px);
    opacity: 0;
}

.notification-content {
    display: flex;
    align-items: center;
    padding: 15px;
    color: white;
}

.notification-icon {
    margin-right: 10px;
    font-size: 18px;
}

.notification-message {
    flex: 1;
}

.notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    margin-left: 10px;
}

.notification-success {
    border-left: 4px solid #4CAF50;
}

.notification-error {
    border-left: 4px solid #f44336;
}

.notification-warning {
    border-left: 4px solid #ff9800;
}

.notification-info {
    border-left: 4px solid #2196F3;
}

.animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s ease;
}

.animate-on-scroll.animate-in {
    opacity: 1;
    transform: translateY(0);
}

.highlight-match {
    background: rgba(255, 255, 0, 0.2) !important;
    animation: highlightPulse 2s ease-out;
}

@keyframes highlightPulse {
    0% { background: rgba(255, 255, 0, 0.4); }
    100% { background: rgba(255, 255, 0, 0.1); }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = notificationCSS;
document.head.appendChild(style);