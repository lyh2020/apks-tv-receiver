// DLNA Service for TV Receiver

class DLNAService {
    constructor(tvReceiver) {
        this.tvReceiver = tvReceiver;
        this.server = null;
        this.ssdpServer = null;
        this.httpServer = null;
        this.networkDiscovery = null;
        this.isRunning = false;
        
        this.deviceInfo = {
            friendlyName: 'DLNA Cast TV Receiver',
            manufacturer: 'DLNA Cast',
            modelName: 'TV Receiver',
            modelNumber: '1.0',
            serialNumber: 'DLNA-TV-001',
            UDN: 'uuid:' + this.generateUUID(),
            deviceType: 'urn:schemas-upnp-org:device:MediaRenderer:1',
            presentationURL: '/'
        };
        
        this.services = {
            AVTransport: {
                serviceType: 'urn:schemas-upnp-org:service:AVTransport:1',
                serviceId: 'urn:upnp-org:serviceId:AVTransport',
                controlURL: '/AVTransport/control',
                eventSubURL: '/AVTransport/event',
                SCPDURL: '/AVTransport/scpd.xml'
            },
            RenderingControl: {
                serviceType: 'urn:schemas-upnp-org:service:RenderingControl:1',
                serviceId: 'urn:upnp-org:serviceId:RenderingControl',
                controlURL: '/RenderingControl/control',
                eventSubURL: '/RenderingControl/event',
                SCPDURL: '/RenderingControl/scpd.xml'
            }
        };
    }

    async start() {
        try {
            this.tvReceiver.log('启动DLNA服务...');
            
            // Start network discovery service with timeout
            const discoveryPromise = this.startNetworkDiscovery();
            const discoveryTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('网络发现服务启动超时')), 5000);
            });
            
            await Promise.race([discoveryPromise, discoveryTimeoutPromise]);
            
            // Start HTTP server for device description and control with timeout
            const serverPromise = this.startHTTPServer();
            const serverTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('HTTP服务器启动超时')), 3000);
            });
            
            await Promise.race([serverPromise, serverTimeoutPromise]);
            
            // Start SSDP server for device discovery
            await this.startSSDPServer();
            
            this.isRunning = true;
            this.tvReceiver.log('DLNA服务启动成功');
            
        } catch (error) {
            this.tvReceiver.log('DLNA服务启动失败: ' + error.message);
            // Don't throw error, just log it and continue
            this.tvReceiver.log('DLNA服务启动失败，继续使用有限功能');
            this.isRunning = false;
        }
    }

    async stop() {
        if (this.httpServer) {
            this.httpServer.close();
        }
        if (this.ssdpServer) {
            this.ssdpServer.stop();
        }
        if (this.networkDiscovery) {
            this.networkDiscovery.stop();
        }
        this.isRunning = false;
        this.tvReceiver.log('DLNA服务已停止');
    }

    async startHTTPServer() {
        // In a real implementation, this would start an actual HTTP server
        // For web-based implementation, we'll simulate the server functionality
        
        this.tvReceiver.log('HTTP服务器启动 (模拟模式)');
        
        // Setup message handlers for communication with mobile app
        this.setupMessageHandlers();
    }

    setupMessageHandlers() {
        // Listen for messages from the mobile app
        // In a real implementation, this would be WebSocket or HTTP endpoints
        
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'dlna-cast') {
                this.handleCastMessage(event.data);
            }
        });
        
        // Setup WebSocket connection if available
        if (typeof WebSocket !== 'undefined') {
            this.setupWebSocket();
        }
    }

    setupWebSocket() {
        try {
            // Try to connect to mobile app's WebSocket server
            const wsUrl = `ws://${this.getLocalIP()}:8081`;
            this.websocket = new WebSocket(wsUrl);
            
            this.websocket.onopen = () => {
                this.tvReceiver.log('WebSocket连接已建立');
                this.sendDeviceInfo();
            };
            
            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleCastMessage(data);
                } catch (error) {
                    this.tvReceiver.log('WebSocket消息解析错误: ' + error.message);
                }
            };
            
            this.websocket.onclose = () => {
                this.tvReceiver.log('WebSocket连接已断开');
                // Try to reconnect after 5 seconds
                setTimeout(() => {
                    if (this.isRunning) {
                        this.setupWebSocket();
                    }
                }, 5000);
            };
            
            this.websocket.onerror = (error) => {
                this.tvReceiver.log('WebSocket错误: ' + error.message);
            };
            
        } catch (error) {
            this.tvReceiver.log('WebSocket连接失败: ' + error.message);
        }
    }

    sendDeviceInfo() {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            const deviceInfo = {
                type: 'device-info',
                device: this.deviceInfo,
                services: this.services,
                ip: this.getLocalIP(),
                port: 8080
            };
            
            this.websocket.send(JSON.stringify(deviceInfo));
        }
    }

    handleCastMessage(data) {
        this.tvReceiver.log(`收到投屏请求: ${data.action}`);
        
        switch (data.action) {
            case 'SetAVTransportURI':
                this.handleSetAVTransportURI(data);
                break;
            case 'Play':
                this.handlePlay(data);
                break;
            case 'Pause':
                this.handlePause(data);
                break;
            case 'Stop':
                this.handleStop(data);
                break;
            case 'SetVolume':
                this.handleSetVolume(data);
                break;
            case 'GetPositionInfo':
                this.handleGetPositionInfo(data);
                break;
            default:
                this.tvReceiver.log(`未知的DLNA动作: ${data.action}`);
        }
    }

    handleSetAVTransportURI(data) {
        try {
            const { CurrentURI, CurrentURIMetaData } = data.args;
            
            // Enhanced metadata parsing with more fields
            let mediaInfo = {
                title: '未知媒体',
                type: 'video',
                artist: '',
                album: '',
                genre: '',
                duration: '00:00:00',
                resolution: '',
                bitrate: '',
                codec: '',
                subtitles: [],
                size: 0
            };
            
            if (CurrentURIMetaData) {
                try {
                    // Parse DIDL-Lite metadata with enhanced support
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(CurrentURIMetaData, 'text/xml');
                    const item = xmlDoc.querySelector('item');
                    
                    if (item) {
                        const title = item.querySelector('title, dc\\:title');
                        const artist = item.querySelector('artist, upnp\\:artist, dc\\:creator');
                        const album = item.querySelector('album, upnp\\:album');
                        const genre = item.querySelector('genre, upnp\\:genre');
                        const res = item.querySelector('res');
                        
                        if (title) mediaInfo.title = title.textContent;
                        if (artist) mediaInfo.artist = artist.textContent;
                        if (album) mediaInfo.album = album.textContent;
                        if (genre) mediaInfo.genre = genre.textContent;
                        
                        if (res) {
                            const protocolInfo = res.getAttribute('protocolInfo');
                            const duration = res.getAttribute('duration');
                            const resolution = res.getAttribute('resolution');
                            const bitrate = res.getAttribute('bitrate');
                            const size = res.getAttribute('size');
                            
                            if (duration) mediaInfo.duration = duration;
                            if (resolution) mediaInfo.resolution = resolution;
                            if (bitrate) mediaInfo.bitrate = bitrate;
                            if (size) mediaInfo.size = parseInt(size) || 0;
                            
                            if (protocolInfo) {
                                // Enhanced media type detection
                                if (protocolInfo.includes('video')) {
                                    mediaInfo.type = 'video';
                                    mediaInfo.codec = this.extractVideoCodec(protocolInfo);
                                } else if (protocolInfo.includes('audio')) {
                                    mediaInfo.type = 'audio';
                                    mediaInfo.codec = this.extractAudioCodec(protocolInfo);
                                } else if (protocolInfo.includes('image')) {
                                    mediaInfo.type = 'image';
                                }
                            }
                        }
                    }
                } catch (error) {
                    this.tvReceiver.log('元数据解析错误: ' + error.message);
                }
            }
            
            // Enhanced media type detection from URI
            if (!mediaInfo.codec) {
                const fileExtension = CurrentURI.split('.').pop().toLowerCase();
                const videoFormats = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ts', 'mts', 'mpg', 'mpeg', 'vob', 'asf', 'rm', 'rmvb'];
                const audioFormats = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus', 'ac3', 'dts', 'ape', 'amr'];
                const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'ico'];
                
                if (videoFormats.includes(fileExtension)) {
                    mediaInfo.type = 'video';
                    mediaInfo.codec = this.getVideoCodec(fileExtension);
                } else if (audioFormats.includes(fileExtension)) {
                    mediaInfo.type = 'audio';
                    mediaInfo.codec = this.getAudioCodec(fileExtension);
                } else if (imageFormats.includes(fileExtension)) {
                    mediaInfo.type = 'image';
                }
            }
            
            // Validate URI accessibility with retry mechanism
            this.validateMediaURI(CurrentURI).then(isValid => {
                if (isValid) {
                    // Set the media URI
                    this.currentURI = CurrentURI;
                    this.currentMetadata = mediaInfo;
                    
                    this.tvReceiver.log(`设置媒体URI: ${mediaInfo.title} (${mediaInfo.type}/${mediaInfo.codec})`);
                    
                    // Send response with enhanced info
                    this.sendResponse(data.id, 'SetAVTransportURI', {
                        success: true,
                        mediaInfo: mediaInfo
                    });
                } else {
                    throw new Error('媒体文件无法访问或格式不支持');
                }
            }).catch(error => {
                this.tvReceiver.log('媒体URI验证失败: ' + error.message);
                this.sendError(data.id, 'SetAVTransportURI', error.message);
            });
            
        } catch (error) {
            this.tvReceiver.log('设置媒体URI失败: ' + error.message);
            this.sendError(data.id, 'SetAVTransportURI', error.message);
        }
    }
    
    extractVideoCodec(protocolInfo) {
        const codecMap = {
            'h264': 'H.264/AVC',
            'h265': 'H.265/HEVC',
            'hevc': 'H.265/HEVC',
            'xvid': 'XVID',
            'divx': 'DivX',
            'vp8': 'VP8',
            'vp9': 'VP9',
            'av1': 'AV1',
            'mpeg2': 'MPEG-2',
            'mpeg4': 'MPEG-4',
            'wmv': 'WMV'
        };
        
        for (const [key, value] of Object.entries(codecMap)) {
            if (protocolInfo.toLowerCase().includes(key)) {
                return value;
            }
        }
        return 'Unknown Video';
    }
    
    extractAudioCodec(protocolInfo) {
        const codecMap = {
            'mp3': 'MP3',
            'aac': 'AAC',
            'flac': 'FLAC',
            'pcm': 'PCM',
            'vorbis': 'Vorbis',
            'opus': 'Opus',
            'wma': 'WMA',
            'ac3': 'AC-3',
            'dts': 'DTS',
            'ape': 'APE'
        };
        
        for (const [key, value] of Object.entries(codecMap)) {
            if (protocolInfo.toLowerCase().includes(key)) {
                return value;
            }
        }
        return 'Unknown Audio';
    }
    
    getVideoCodec(extension) {
        const codecMap = {
            'mp4': 'H.264/AVC',
            'mkv': 'H.264/H.265',
            'avi': 'XVID/DivX',
            'mov': 'H.264/HEVC',
            'wmv': 'WMV/VC-1',
            'webm': 'VP8/VP9',
            'flv': 'H.264/VP6',
            'm4v': 'H.264/AVC',
            '3gp': 'H.263/H.264',
            'ts': 'H.264/MPEG-2',
            'mts': 'H.264/AVCHD',
            'mpg': 'MPEG-2',
            'mpeg': 'MPEG-2',
            'vob': 'MPEG-2',
            'asf': 'WMV',
            'rm': 'RealVideo',
            'rmvb': 'RealVideo'
        };
        return codecMap[extension] || 'Unknown Video';
    }
    
    getAudioCodec(extension) {
        const codecMap = {
            'mp3': 'MP3',
            'aac': 'AAC',
            'flac': 'FLAC',
            'wav': 'PCM',
            'ogg': 'Vorbis',
            'm4a': 'AAC',
            'wma': 'WMA',
            'opus': 'Opus',
            'ac3': 'AC-3',
            'dts': 'DTS',
            'ape': 'APE',
            'amr': 'AMR'
        };
        return codecMap[extension] || 'Unknown Audio';
    }
    
    async validateMediaURI(uri) {
        try {
            // For HTTP/HTTPS URLs, try a HEAD request with retry
            if (uri.startsWith('http')) {
                let retries = 3;
                while (retries > 0) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);
                        
                        const response = await fetch(uri, { 
                            method: 'HEAD',
                            signal: controller.signal
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (response.ok) {
                            return true;
                        }
                        
                        retries--;
                        if (retries > 0) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                        }
                    } catch (error) {
                        retries--;
                        if (retries === 0) {
                            throw error;
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                return false;
            }
            // For local files or other protocols, assume valid
            return true;
        } catch (error) {
            this.tvReceiver.log('URI验证失败: ' + error.message);
            return false;
        }
    }

    handlePlay(data) {
        if (this.currentURI) {
            this.tvReceiver.handleCastRequest({
                type: this.currentMetadata.type,
                url: this.currentURI,
                title: this.currentMetadata.title
            });
            
            this.sendResponse(data.id, 'Play', {});
        } else {
            this.sendError(data.id, 'Play', 'No media URI set');
        }
    }

    handlePause(data) {
        if (this.tvReceiver.currentScreen === 'player') {
            this.tvReceiver.togglePlayPause();
        }
        this.sendResponse(data.id, 'Pause', {});
    }

    handleStop(data) {
        this.tvReceiver.stopMedia();
        this.sendResponse(data.id, 'Stop', {});
    }

    handleSetVolume(data) {
        const { DesiredVolume } = data.args;
        const volume = parseInt(DesiredVolume) / 100;
        this.tvReceiver.setVolume(volume);
        this.sendResponse(data.id, 'SetVolume', {});
    }

    handleGetPositionInfo(data) {
        let positionInfo = {
            Track: '1',
            TrackDuration: '00:00:00',
            TrackMetaData: '',
            TrackURI: this.currentURI || '',
            RelTime: '00:00:00',
            AbsTime: '00:00:00',
            RelCount: '0',
            AbsCount: '0'
        };
        
        if (this.tvReceiver.videoPlayer && !this.tvReceiver.videoPlayer.paused) {
            const currentTime = this.tvReceiver.videoPlayer.currentTime;
            const duration = this.tvReceiver.videoPlayer.duration;
            
            positionInfo.RelTime = this.formatTime(currentTime);
            positionInfo.TrackDuration = this.formatTime(duration);
        }
        
        this.sendResponse(data.id, 'GetPositionInfo', positionInfo);
    }

    sendResponse(id, action, args) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            const response = {
                type: 'dlna-response',
                id: id,
                action: action,
                success: true,
                args: args
            };
            
            this.websocket.send(JSON.stringify(response));
        }
    }

    sendError(id, action, error) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            const response = {
                type: 'dlna-response',
                id: id,
                action: action,
                success: false,
                error: error
            };
            
            this.websocket.send(JSON.stringify(response));
        }
    }

    async startNetworkDiscovery() {
        try {
            if (typeof NetworkDiscoveryService !== 'undefined') {
                this.networkDiscovery = new NetworkDiscoveryService(this.tvReceiver);
                await this.networkDiscovery.start();
                this.tvReceiver.log('网络发现服务启动成功');
            } else {
                this.tvReceiver.log('网络发现服务未找到，跳过');
            }
        } catch (error) {
            this.tvReceiver.log('网络发现服务启动失败: ' + error.message);
        }
    }

    async startSSDPServer() {
        // SSDP functionality is now handled by NetworkDiscoveryService
        this.tvReceiver.log('SSDP服务由网络发现服务管理');
    }

    // SSDP announcements are now handled by NetworkDiscoveryService
    sendSSDPAnnouncement() {
        if (this.networkDiscovery) {
            // Delegate to network discovery service
            this.networkDiscovery.sendSSDPAnnouncement('ssdp:alive');
        }
    }

    generateDeviceDescription() {
        return `<?xml version="1.0" encoding="utf-8"?>
<root xmlns="urn:schemas-upnp-org:device-1-0">
    <specVersion>
        <major>1</major>
        <minor>0</minor>
    </specVersion>
    <device>
        <deviceType>${this.deviceInfo.deviceType}</deviceType>
        <friendlyName>${this.deviceInfo.friendlyName}</friendlyName>
        <manufacturer>${this.deviceInfo.manufacturer}</manufacturer>
        <modelName>${this.deviceInfo.modelName}</modelName>
        <modelNumber>${this.deviceInfo.modelNumber}</modelNumber>
        <serialNumber>${this.deviceInfo.serialNumber}</serialNumber>
        <UDN>${this.deviceInfo.UDN}</UDN>
        <presentationURL>${this.deviceInfo.presentationURL}</presentationURL>
        <serviceList>
            <service>
                <serviceType>${this.services.AVTransport.serviceType}</serviceType>
                <serviceId>${this.services.AVTransport.serviceId}</serviceId>
                <controlURL>${this.services.AVTransport.controlURL}</controlURL>
                <eventSubURL>${this.services.AVTransport.eventSubURL}</eventSubURL>
                <SCPDURL>${this.services.AVTransport.SCPDURL}</SCPDURL>
            </service>
            <service>
                <serviceType>${this.services.RenderingControl.serviceType}</serviceType>
                <serviceId>${this.services.RenderingControl.serviceId}</serviceId>
                <controlURL>${this.services.RenderingControl.controlURL}</controlURL>
                <eventSubURL>${this.services.RenderingControl.eventSubURL}</eventSubURL>
                <SCPDURL>${this.services.RenderingControl.SCPDURL}</SCPDURL>
            </service>
        </serviceList>
    </device>
</root>`;
    }

    // Utility methods
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getLocalIP() {
        // In a real implementation, this would get the actual local IP
        // For simulation, return a placeholder
        return this.tvReceiver.deviceInfo.ip || '192.168.1.100';
    }

    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) {
            return '00:00:00';
        }
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
}

// Make DLNAService available globally
window.DLNAService = DLNAService;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DLNAService;
}