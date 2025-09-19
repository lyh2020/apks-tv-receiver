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
            
            // Start network discovery service
            await this.startNetworkDiscovery();
            
            // Start HTTP server for device description and control
            await this.startHTTPServer();
            
            // Start SSDP server for device discovery
            await this.startSSDPServer();
            
            this.isRunning = true;
            this.tvReceiver.log('DLNA服务启动成功');
            
        } catch (error) {
            this.tvReceiver.log('DLNA服务启动失败: ' + error.message);
            throw error;
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
        const { CurrentURI, CurrentURIMetaData } = data.args;
        
        // Parse metadata to get media info
        let mediaInfo = {
            title: '未知媒体',
            type: 'video'
        };
        
        if (CurrentURIMetaData) {
            try {
                // Parse DIDL-Lite metadata
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(CurrentURIMetaData, 'text/xml');
                const item = xmlDoc.querySelector('item');
                
                if (item) {
                    const title = item.querySelector('title');
                    const res = item.querySelector('res');
                    
                    if (title) {
                        mediaInfo.title = title.textContent;
                    }
                    
                    if (res) {
                        const protocolInfo = res.getAttribute('protocolInfo');
                        if (protocolInfo) {
                            if (protocolInfo.includes('video')) {
                                mediaInfo.type = 'video';
                            } else if (protocolInfo.includes('audio')) {
                                mediaInfo.type = 'audio';
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
        
        // Set the media URI
        this.currentURI = CurrentURI;
        this.currentMetadata = mediaInfo;
        
        this.tvReceiver.log(`设置媒体URI: ${mediaInfo.title}`);
        
        // Send response
        this.sendResponse(data.id, 'SetAVTransportURI', {});
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