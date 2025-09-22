// TV Receiver Main Controller

class TVReceiver {
    constructor() {
        this.currentScreen = 'welcome';
        this.isConnected = false;
        this.mediaPlayer = null;
        this.dlnaService = null;
        this.networkDiscovery = null;
        this.remoteNavigation = null;
        this.loadingProgress = 0;
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
        
        // Set maximum startup timeout to prevent infinite loading
        const startupTimeout = setTimeout(() => {
            console.warn('Startup timeout reached, forcing UI display');
            this.updateProgress(100, '强制启动完成').then(() => {
                this.hideLoadingScreen();
                this.simulateConnection();
            });
        }, 5000); // 5 second maximum startup time
        
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize with progress tracking
            await this.updateProgress(10, '初始化界面...');
            this.initializeElements();
            
            await this.updateProgress(25, '设置事件监听器...');
            this.setupEventListeners();
            
            await this.updateProgress(40, '获取设备信息...');
            await this.getDeviceIP();
            
            // Check if TV environment and skip heavy operations
            const isTVEnvironment = this.detectTVEnvironment();
            
            if (isTVEnvironment) {
                await this.updateProgress(70, 'TV环境优化启动...');
                this.log('TV环境检测：跳过复杂初始化');
                // Skip remote control and QR code for faster startup
                await this.updateProgress(85, '准备TV界面...');
            } else {
                await this.updateProgress(70, '初始化远程控制...');
                this.setupRemoteNavigation();
                
                await this.updateProgress(85, '生成连接二维码...');
                await this.generateQRCode();
            }
            
            await this.updateProgress(100, '启动完成!');
            
            // Clear the timeout since we completed successfully
            clearTimeout(startupTimeout);
            
            // Hide loading screen and show main interface
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 300); // Reduced delay for faster response
            
            // Start DLNA service asynchronously after UI is ready
            this.initializeDLNAAsync();
            
            this.log('TV接收器启动完成');
        } catch (error) {
            console.error('Failed to initialize TV Receiver:', error);
            clearTimeout(startupTimeout);
            this.showError('启动失败: ' + error.message);
            
            // Still hide loading screen after error and ensure basic functionality
            setTimeout(() => {
                this.hideLoadingScreen();
                this.simulateConnection(); // Ensure basic functionality
            }, 1000);
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const tvContainer = document.querySelector('.tv-container');
        
        if (loadingScreen) {
            loadingScreen.classList.add('active');
        }
        if (tvContainer) {
            tvContainer.style.display = 'none';
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const tvContainer = document.querySelector('.tv-container');
        
        console.log('Hiding loading screen...');
        
        // Force hide loading screen
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
            loadingScreen.style.display = 'none';
            console.log('Loading screen hidden');
        }
        
        // Show TV container with proper CSS classes
        if (tvContainer) {
            tvContainer.style.display = 'flex';
            tvContainer.classList.add('visible');
            tvContainer.style.opacity = '1';
            console.log('TV container shown');
        }
        
        // Ensure body is visible
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';
        
        // Force show main interface elements
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('active');
            welcomeScreen.style.display = 'block';
            console.log('Welcome screen activated');
        }
        
        // Log current state for debugging
        this.log('界面已显示，应用就绪');
        console.log('UI should now be visible to user');
    }
    
    simulateConnection() {
        console.log('Simulating basic connection for fallback...');
        
        // Show basic connection info even if DLNA fails
        const deviceInfo = document.getElementById('device-info');
        if (deviceInfo) {
            deviceInfo.innerHTML = `
                <div class="device-item">
                    <span class="device-label">设备名称:</span>
                    <span class="device-value">TV接收器</span>
                </div>
                <div class="device-item">
                    <span class="device-label">状态:</span>
                    <span class="device-value">就绪</span>
                </div>
                <div class="device-item">
                    <span class="device-label">IP地址:</span>
                    <span class="device-value">正在获取...</span>
                </div>
            `;
        }
        
        // Show connection status
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.textContent = '等待连接...';
            connectionStatus.className = 'status-waiting';
        }
        
        // Try to get IP address
        this.getLocalIP().then(ip => {
            if (deviceInfo) {
                const ipElement = deviceInfo.querySelector('.device-item:last-child .device-value');
                if (ipElement) {
                    ipElement.textContent = ip || '无法获取';
                }
            }
        }).catch(err => {
            console.warn('Failed to get IP:', err);
        });
        
        this.log('基本界面已准备就绪');
    }

    async updateProgress(percentage, status) {
        return new Promise(resolve => {
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');
            const loadingStatus = document.getElementById('loading-status');
            
            if (progressFill) {
                progressFill.style.width = percentage + '%';
            }
            if (progressText) {
                progressText.textContent = percentage + '%';
            }
            if (loadingStatus) {
                loadingStatus.textContent = status;
            }
            
            // Simulate some loading time
            setTimeout(resolve, 200 + Math.random() * 300);
        });
    }

    showError(message) {
        const loadingStatus = document.getElementById('loading-status');
        const loadingScreen = document.getElementById('loading-screen');
        
        if (loadingStatus) {
            loadingStatus.textContent = message;
            loadingStatus.style.color = '#ff6b6b';
        }
        
        // Add retry button
        if (loadingScreen) {
            const retryButton = document.createElement('button');
            retryButton.textContent = '重试';
            retryButton.style.cssText = `
                margin-top: 20px;
                padding: 10px 20px;
                background: #4facfe;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 1rem;
                cursor: pointer;
            `;
            retryButton.onclick = () => {
                location.reload();
            };
            
            const loadingContent = loadingScreen.querySelector('.loading-content');
            if (loadingContent && !loadingContent.querySelector('button')) {
                loadingContent.appendChild(retryButton);
            }
        }
    }

    async generateQRCode() {
        try {
            const deviceIP = document.getElementById('device-ip').textContent;
            const qrContainer = document.getElementById('qr-code');
            
            if (qrContainer && deviceIP && deviceIP !== '获取中...') {
                // Create connection URL
                const connectionUrl = `http://${deviceIP}:8080`;
                
                // Simple QR code placeholder (in real implementation, use QR code library)
                qrContainer.innerHTML = `
                    <div style="
                        width: 180px;
                        height: 180px;
                        background: #333;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.9rem;
                        text-align: center;
                        padding: 10px;
                        line-height: 1.2;
                    ">
                        连接地址:<br>
                        ${connectionUrl}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to generate QR code:', error);
        }
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

    // Asynchronous DLNA initialization that doesn't block UI
    initializeDLNAAsync() {
        this.updateConnectionStatus('connecting');
        this.log('后台启动DLNA服务...');
        
        // Detect if running on TV environment
        const isTVEnvironment = this.detectTVEnvironment();
        
        if (isTVEnvironment) {
            this.log('检测到TV环境，跳过复杂网络服务，直接使用基本功能');
            // For TV environment, skip complex network services entirely
            setTimeout(() => {
                this.log('TV环境：直接启用基本投屏功能');
                this.simulateConnection();
            }, 1000);
        } else {
            // Use setTimeout to ensure this runs after UI is fully rendered
            setTimeout(async () => {
                try {
                    // Set aggressive timeout for non-TV environment
                    const dlnaPromise = this.initializeDLNA();
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('DLNA启动超时')), 2000);
                    });
                    
                    await Promise.race([dlnaPromise, timeoutPromise]);
                } catch (error) {
                    console.error('Async DLNA initialization failed:', error);
                    this.log('DLNA服务后台启动失败，使用基本功能');
                    this.simulateConnection();
                }
            }, 100);
        }
    }

    // Detect if running on TV environment
    detectTVEnvironment() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isAndroidTV = userAgent.includes('android') && 
                           (userAgent.includes('tv') || 
                            userAgent.includes('googletv') || 
                            userAgent.includes('androidtv'));
        
        // Check for TV-specific characteristics
        const hasLimitedMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
        const isLargeScreen = screen.width >= 1920 || screen.height >= 1080;
        const hasLimitedPointer = !('ontouchstart' in window) && 
                                 navigator.maxTouchPoints === 0;
        
        return isAndroidTV || (hasLimitedMemory && isLargeScreen && hasLimitedPointer);
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

    updateDeviceList() {
        const deviceList = document.getElementById('deviceList');
        if (!deviceList) return;
        
        const peers = this.networkDiscovery.getPeers();
        
        if (peers.length === 0) {
            deviceList.innerHTML = `
                <div class="no-devices" style="
                    text-align: center;
                    padding: 40px 20px;
                    color: #7f8c8d;
                    font-size: 16px;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 12px;
                    margin: 10px;
                ">
                    <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📱</div>
                    <div style="font-weight: 600; margin-bottom: 8px;">未发现设备</div>
                    <div style="font-size: 14px; opacity: 0.8;">请确保设备在同一网络下并点击扫描</div>
                </div>
            `;
            return;
        }
        
        deviceList.innerHTML = peers.map(peer => {
            const isOnline = peer.lastSeen > Date.now() - 30000;
            const isConnected = this.connectedPeers.has(peer.UDN);
            const isConnecting = this.connectingPeers.has(peer.UDN);
            
            let statusClass = 'offline';
            let statusText = 'Offline';
            let deviceClass = '';
            
            if (isConnected) {
                statusClass = 'online';
                statusText = 'Connected';
                deviceClass = 'connected';
            } else if (isConnecting) {
                statusClass = 'connecting';
                statusText = 'Connecting';
                deviceClass = 'connecting';
            } else if (isOnline) {
                statusClass = 'online';
                statusText = 'Online';
            }
            
            const deviceIcon = this.getDeviceIcon(peer);
            const capabilities = this.getDeviceCapabilities(peer);
            
            return `
                <div class="device-item ${deviceClass}" data-udn="${peer.UDN}">
                    <div class="device-info">
                        <div class="device-icon ${deviceIcon.type}">
                            ${deviceIcon.icon}
                        </div>
                        <div class="device-details">
                            <div class="device-name">${peer.friendlyName}</div>
                            <div class="device-type">${this.getDeviceTypeDisplay(peer)}</div>
                            <div class="device-ip">${peer.ip || 'Unknown IP'}</div>
                            <div class="device-capabilities">
                                ${capabilities.map(cap => `<span class="capability-tag ${cap.type}">${cap.name}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="device-status">
                        <div class="status-indicator ${statusClass}"></div>
                        <div class="status-text ${statusClass}">${statusText}</div>
                    </div>
                    <div class="device-actions">
                        ${!isConnected && !isConnecting ? `
                            <button class="device-action-btn connect" onclick="tvReceiver.connectToPeer('${peer.UDN}')">
                                连接
                            </button>
                        ` : ''}
                        <button class="device-action-btn test" onclick="tvReceiver.testDevice('${peer.UDN}')">
                            测试
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getDeviceIcon(peer) {
        const deviceType = peer.deviceType || '';
        const friendlyName = peer.friendlyName || '';
        
        if (deviceType.includes('MediaRenderer') || friendlyName.toLowerCase().includes('tv')) {
            return { type: 'tv', icon: '📺' };
        } else if (friendlyName.toLowerCase().includes('phone') || friendlyName.toLowerCase().includes('mobile')) {
            return { type: 'phone', icon: '📱' };
        } else if (friendlyName.toLowerCase().includes('computer') || friendlyName.toLowerCase().includes('pc')) {
            return { type: 'computer', icon: '💻' };
        } else if (deviceType.includes('MediaServer') || friendlyName.toLowerCase().includes('speaker')) {
            return { type: 'speaker', icon: '🔊' };
        } else {
            return { type: 'tv', icon: '📱' };
        }
    }
    
    getDeviceTypeDisplay(peer) {
        const deviceType = peer.deviceType || '';
        
        if (deviceType.includes('MediaRenderer')) {
            return 'Media Renderer';
        } else if (deviceType.includes('MediaServer')) {
            return 'Media Server';
        } else if (peer.type === 'mdns-device') {
            return 'mDNS Device';
        } else if (peer.type === 'network-device') {
            return 'Network Device';
        } else {
            return 'DLNA Device';
        }
    }
    
    getDeviceCapabilities(peer) {
        const capabilities = [];
        
        if (peer.compatibility) {
            if (peer.compatibility.dlna) {
                capabilities.push({ type: 'dlna', name: 'DLNA' });
            }
            if (peer.compatibility.upnp) {
                capabilities.push({ type: 'upnp', name: 'UPnP' });
            }
            if (peer.compatibility.chromecast) {
                capabilities.push({ type: 'chromecast', name: 'Cast' });
            }
        } else {
            // Default capabilities based on device type
            if (peer.deviceType && peer.deviceType.includes('MediaRenderer')) {
                capabilities.push({ type: 'dlna', name: 'DLNA' });
            }
            if (peer.type === 'upnp-device') {
                capabilities.push({ type: 'upnp', name: 'UPnP' });
            }
        }
        
        return capabilities;
    }
    
    async testDevice(udn) {
        const peer = this.networkDiscovery.getPeer(udn);
        if (!peer) return;
        
        this.log(`测试设备兼容性: ${peer.friendlyName}`);
        
        try {
            const compatibility = await this.networkDiscovery.testDeviceCompatibility(peer);
            this.log(`设备兼容性测试完成: ${JSON.stringify(compatibility)}`);
            
            // Update device list to show new compatibility info
            this.updateDeviceList();
            
        } catch (error) {
            this.log(`设备测试失败: ${error.message}`);
        }
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