// TV Receiver Main Controller

class TVReceiver {
    constructor() {
        this.currentScreen = 'welcome';
        this.isConnected = false;
        this.mediaPlayer = null;
        this.dlnaService = null;
        this.deviceInfo = {
            name: 'DLNA Cast TV Receiver',
            model: 'TV-001',
            ip: '获取中...',
            port: 8080
        };
        
        this.init();
    }

    async init() {
        console.log('TV Receiver initializing...');
        
        // Initialize UI elements
        this.initializeElements();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Get device IP
        await this.getDeviceIP();
        
        // Initialize DLNA service
        await this.initializeDLNA();
        
        // Setup remote control navigation
        this.setupRemoteNavigation();
        
        this.log('TV接收器启动完成');
    }

    initializeElements() {
        // Screen elements
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.playerScreen = document.getElementById('player-screen');
        this.imageScreen = document.getElementById('image-screen');
        
        // Status elements
        this.connectionStatus = document.getElementById('connection-status');
        this.statusText = document.getElementById('status-text');
        this.deviceNameEl = document.getElementById('device-name');
        this.deviceIPEl = document.getElementById('device-ip');
        
        // Media elements
        this.videoPlayer = document.getElementById('video-player');
        this.imageViewer = document.getElementById('image-viewer');
        
        // Control elements
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        
        // Info elements
        this.mediaTitle = document.getElementById('media-title');
        this.mediaDuration = document.getElementById('media-duration');
        this.logContainer = document.getElementById('log-container');
    }

    setupEventListeners() {
        // Video player events
        this.videoPlayer.addEventListener('loadstart', () => {
            this.log('开始加载视频');
        });
        
        this.videoPlayer.addEventListener('canplay', () => {
            this.log('视频可以播放');
            this.showScreen('player');
        });
        
        this.videoPlayer.addEventListener('error', (e) => {
            this.log('视频播放错误: ' + e.message);
            this.showNotification('视频播放失败', 'error');
        });
        
        this.videoPlayer.addEventListener('ended', () => {
            this.log('视频播放结束');
            this.showScreen('welcome');
        });
        
        // Control button events
        this.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });
        
        this.stopBtn.addEventListener('click', () => {
            this.stopMedia();
        });
        
        this.fullscreenBtn.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        this.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // Image controls
        document.getElementById('image-close-btn').addEventListener('click', () => {
            this.showScreen('welcome');
        });
        
        document.getElementById('image-fullscreen-btn').addEventListener('click', () => {
            this.toggleImageFullscreen();
        });
        
        // Keyboard events for remote control
        document.addEventListener('keydown', (e) => {
            this.handleRemoteKey(e);
        });
    }

    async getDeviceIP() {
        try {
            // Try to get local IP address
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            
            // For local network, we need to get the actual local IP
            // This is a simplified version - in real implementation,
            // you'd use Capacitor plugins to get the actual local IP
            this.deviceInfo.ip = '192.168.1.100'; // Placeholder
            this.deviceIPEl.textContent = this.deviceInfo.ip;
            
        } catch (error) {
            console.error('Failed to get IP:', error);
            this.deviceInfo.ip = '未知';
            this.deviceIPEl.textContent = this.deviceInfo.ip;
        }
    }

    async initializeDLNA() {
        try {
            // Initialize DLNA service
            if (typeof DLNAService !== 'undefined') {
                this.dlnaService = new DLNAService(this);
                await this.dlnaService.start();
                this.updateConnectionStatus('online');
                this.log('DLNA服务启动成功');
            } else {
                this.log('DLNA服务类未找到，使用模拟模式');
                this.simulateConnection();
            }
        } catch (error) {
            console.error('DLNA initialization failed:', error);
            this.log('DLNA服务启动失败: ' + error.message);
            this.updateConnectionStatus('offline');
        }
    }

    simulateConnection() {
        // Simulate connection for testing
        setTimeout(() => {
            this.updateConnectionStatus('connecting');
            this.log('模拟连接中...');
            
            setTimeout(() => {
                this.updateConnectionStatus('online');
                this.log('模拟连接成功');
            }, 2000);
        }, 1000);
    }

    updateConnectionStatus(status) {
        this.connectionStatus.className = `status-dot ${status}`;
        
        switch (status) {
            case 'online':
                this.statusText.textContent = '已连接';
                this.isConnected = true;
                break;
            case 'connecting':
                this.statusText.textContent = '连接中...';
                this.isConnected = false;
                break;
            case 'offline':
            default:
                this.statusText.textContent = '等待连接...';
                this.isConnected = false;
                break;
        }
    }

    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }
    }

    // Media control methods
    playVideo(url, title = '未知视频') {
        this.log(`开始播放视频: ${title}`);
        this.mediaTitle.textContent = title;
        this.videoPlayer.src = url;
        this.videoPlayer.load();
        this.showScreen('player');
    }

    showImage(url, title = '未知图片') {
        this.log(`显示图片: ${title}`);
        this.imageViewer.src = url;
        this.showScreen('image');
    }

    togglePlayPause() {
        if (this.videoPlayer.paused) {
            this.videoPlayer.play();
            this.playPauseBtn.textContent = '⏸️';
            this.log('视频播放');
        } else {
            this.videoPlayer.pause();
            this.playPauseBtn.textContent = '▶️';
            this.log('视频暂停');
        }
    }

    stopMedia() {
        this.videoPlayer.pause();
        this.videoPlayer.currentTime = 0;
        
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        this.showScreen('welcome');
        this.log('停止播放');
    }

    setVolume(volume) {
        this.videoPlayer.volume = volume;
        this.log(`音量设置为: ${Math.round(volume * 100)}%`);
        
        // Also update audio elements if present
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.volume = Math.max(0, Math.min(1, volume));
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (this.currentScreen === 'player') {
                this.videoPlayer.requestFullscreen();
            } else if (this.currentScreen === 'image') {
                this.imageViewer.requestFullscreen();
            }
        } else {
            document.exitFullscreen();
        }
    }

    toggleImageFullscreen() {
        this.toggleFullscreen();
    }

    // Remote control navigation
    setupRemoteNavigation() {
        // Add focusable class to interactive elements
        const focusableElements = [
            this.playPauseBtn,
            this.stopBtn,
            this.fullscreenBtn,
            this.volumeSlider,
            document.getElementById('image-close-btn'),
            document.getElementById('image-fullscreen-btn')
        ];
        
        focusableElements.forEach(el => {
            if (el) el.classList.add('focusable');
        });
    }

    handleRemoteKey(event) {
        const key = event.key;
        
        switch (key) {
            case 'Enter':
            case ' ':
                if (this.currentScreen === 'player') {
                    this.togglePlayPause();
                }
                break;
            case 'Escape':
            case 'Backspace':
                if (this.currentScreen !== 'welcome') {
                    this.showScreen('welcome');
                }
                break;
            case 'ArrowUp':
                this.adjustVolume(0.1);
                break;
            case 'ArrowDown':
                this.adjustVolume(-0.1);
                break;
            case 'ArrowLeft':
                if (this.currentScreen === 'player') {
                    this.videoPlayer.currentTime -= 10;
                }
                break;
            case 'ArrowRight':
                if (this.currentScreen === 'player') {
                    this.videoPlayer.currentTime += 10;
                }
                break;
        }
    }

    adjustVolume(delta) {
        const newVolume = Math.max(0, Math.min(1, this.videoPlayer.volume + delta));
        this.setVolume(newVolume);
        this.volumeSlider.value = newVolume * 100;
    }

    // Utility methods
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
        
        // Keep only last 50 log entries
        while (this.logContainer.children.length > 50) {
            this.logContainer.removeChild(this.logContainer.firstChild);
        }
        
        console.log(`[TV Receiver] ${message}`);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Public API for external control
    handleCastRequest(data) {
        const { type, url, title, metadata } = data;
        
        switch (type) {
            case 'video':
                this.playVideo(url, title);
                break;
            case 'image':
                this.showImage(url, title);
                break;
            case 'audio':
                // For audio, we can use the video player without showing video
                this.playVideo(url, title);
                break;
            default:
                this.log(`不支持的媒体类型: ${type}`);
                this.showNotification('不支持的媒体类型', 'error');
        }
    }
}

// Initialize TV Receiver when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tvReceiver = new TVReceiver();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TVReceiver;
}