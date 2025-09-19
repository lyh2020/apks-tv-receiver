// Network Discovery Service for DLNA TV Receiver

class NetworkDiscoveryService {
    constructor(tvReceiver) {
        this.tvReceiver = tvReceiver;
        this.isRunning = false;
        this.discoveryInterval = null;
        this.announceInterval = null;
        this.peers = new Map();
        
        // Network configuration
        this.config = {
            multicastAddress: '239.255.255.250',
            multicastPort: 1900,
            httpPort: 8080,
            announceInterval: 30000, // 30 seconds
            discoveryInterval: 60000, // 60 seconds
            maxAge: 1800 // 30 minutes
        };
        
        // Device information for SSDP
        this.deviceInfo = {
            deviceType: 'urn:schemas-upnp-org:device:MediaRenderer:1',
            friendlyName: 'DLNA Cast TV Receiver',
            manufacturer: 'DLNA Cast',
            manufacturerURL: 'http://dlnacast.com',
            modelDescription: 'DLNA Cast TV Receiver for Android TV',
            modelName: 'TV Receiver',
            modelNumber: '1.0',
            modelURL: 'http://dlnacast.com/tv-receiver',
            serialNumber: this.generateSerialNumber(),
            UDN: 'uuid:' + this.generateUUID(),
            presentationURL: '/'
        };
    }

    async start() {
        try {
            this.tvReceiver.log('启动网络发现服务...');
            
            // Start device announcement
            this.startAnnouncement();
            
            // Start peer discovery
            this.startDiscovery();
            
            // Setup message listeners
            this.setupMessageListeners();
            
            this.isRunning = true;
            this.tvReceiver.log('网络发现服务启动成功');
            
        } catch (error) {
            this.tvReceiver.log('网络发现服务启动失败: ' + error.message);
            throw error;
        }
    }

    stop() {
        if (this.announceInterval) {
            clearInterval(this.announceInterval);
            this.announceInterval = null;
        }
        
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = null;
        }
        
        this.isRunning = false;
        this.tvReceiver.log('网络发现服务已停止');
    }

    startAnnouncement() {
        // Send initial announcement
        this.sendSSDPAnnouncement('ssdp:alive');
        
        // Setup periodic announcements
        this.announceInterval = setInterval(() => {
            this.sendSSDPAnnouncement('ssdp:alive');
        }, this.config.announceInterval);
        
        this.tvReceiver.log('开始SSDP设备通告');
    }

    startDiscovery() {
        // Start periodic discovery
        this.discoveryInterval = setInterval(() => {
            this.discoverPeers();
            this.cleanupExpiredPeers();
        }, this.config.discoveryInterval);
        
        // Initial discovery
        this.discoverPeers();
        
        this.tvReceiver.log('开始网络设备发现');
    }

    setupMessageListeners() {
        // Listen for SSDP messages via WebSocket or other communication channels
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'ssdp-message') {
                this.handleSSDPMessage(event.data);
            }
        });
        
        // Setup WebRTC for peer-to-peer discovery if available
        if (typeof RTCPeerConnection !== 'undefined') {
            this.setupWebRTCDiscovery();
        }
        
        // Setup WebSocket for network communication
        this.setupNetworkWebSocket();
    }

    setupNetworkWebSocket() {
        try {
            // Create WebSocket server for network communication
            // In a real implementation, this would be handled by the native Android layer
            
            // For web-based simulation, we'll use a different approach
            this.setupBroadcastChannel();
            
        } catch (error) {
            this.tvReceiver.log('网络WebSocket设置失败: ' + error.message);
        }
    }

    setupBroadcastChannel() {
        if (typeof BroadcastChannel !== 'undefined') {
            this.broadcastChannel = new BroadcastChannel('dlna-discovery');
            
            this.broadcastChannel.onmessage = (event) => {
                this.handleBroadcastMessage(event.data);
            };
            
            // Send initial presence announcement
            this.broadcastPresence();
            
            this.tvReceiver.log('BroadcastChannel设置完成');
        }
    }

    setupWebRTCDiscovery() {
        // WebRTC can be used for local network discovery
        // This is a simplified implementation
        
        try {
            this.peerConnection = new RTCPeerConnection({
                iceServers: []
            });
            
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.handleICECandidate(event.candidate);
                }
            };
            
            this.tvReceiver.log('WebRTC发现设置完成');
            
        } catch (error) {
            this.tvReceiver.log('WebRTC设置失败: ' + error.message);
        }
    }

    sendSSDPAnnouncement(nts) {
        const announcement = {
            type: 'ssdp-announce',
            method: 'NOTIFY',
            headers: {
                'HOST': `${this.config.multicastAddress}:${this.config.multicastPort}`,
                'CACHE-CONTROL': `max-age=${this.config.maxAge}`,
                'LOCATION': `http://${this.getLocalIP()}:${this.config.httpPort}/device.xml`,
                'NT': this.deviceInfo.deviceType,
                'NTS': nts,
                'USN': `${this.deviceInfo.UDN}::${this.deviceInfo.deviceType}`,
                'SERVER': 'DLNA Cast TV/1.0 UPnP/1.0',
                'BOOTID.UPNP.ORG': '1',
                'CONFIGID.UPNP.ORG': '1'
            },
            deviceInfo: this.deviceInfo,
            timestamp: Date.now()
        };
        
        // In a real implementation, this would be sent via UDP multicast
        // For simulation, we'll use BroadcastChannel or other available methods
        this.broadcastMessage(announcement);
        
        this.tvReceiver.log(`发送SSDP通告: ${nts}`);
    }

    discoverPeers() {
        const searchRequest = {
            type: 'ssdp-search',
            method: 'M-SEARCH',
            headers: {
                'HOST': `${this.config.multicastAddress}:${this.config.multicastPort}`,
                'MAN': '"ssdp:discover"',
                'ST': 'upnp:rootdevice',
                'MX': '3'
            },
            timestamp: Date.now()
        };
        
        this.broadcastMessage(searchRequest);
        this.tvReceiver.log('发送设备发现请求');
    }

    broadcastMessage(message) {
        // Broadcast via BroadcastChannel if available
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage(message);
        }
        
        // Also store in localStorage for cross-tab communication
        try {
            const key = `dlna-message-${Date.now()}-${Math.random()}`;
            localStorage.setItem(key, JSON.stringify(message));
            
            // Clean up old messages
            setTimeout(() => {
                localStorage.removeItem(key);
            }, 5000);
            
        } catch (error) {
            // localStorage might be full or unavailable
        }
        
        // Dispatch custom event for same-page communication
        window.dispatchEvent(new CustomEvent('dlna-network-message', {
            detail: message
        }));
    }

    broadcastPresence() {
        const presence = {
            type: 'device-presence',
            deviceInfo: this.deviceInfo,
            ip: this.getLocalIP(),
            port: this.config.httpPort,
            timestamp: Date.now()
        };
        
        this.broadcastMessage(presence);
    }

    handleBroadcastMessage(data) {
        switch (data.type) {
            case 'ssdp-announce':
                this.handleSSDPAnnouncement(data);
                break;
            case 'ssdp-search':
                this.handleSSDPSearch(data);
                break;
            case 'device-presence':
                this.handleDevicePresence(data);
                break;
            case 'ssdp-response':
                this.handleSSDPResponse(data);
                break;
        }
    }

    handleSSDPMessage(data) {
        this.handleBroadcastMessage(data);
    }

    handleSSDPAnnouncement(data) {
        if (data.deviceInfo && data.deviceInfo.UDN !== this.deviceInfo.UDN) {
            const peer = {
                ...data.deviceInfo,
                ip: this.extractIPFromLocation(data.headers?.LOCATION),
                port: this.extractPortFromLocation(data.headers?.LOCATION),
                lastSeen: Date.now(),
                type: 'upnp-device'
            };
            
            this.peers.set(data.deviceInfo.UDN, peer);
            this.tvReceiver.log(`发现UPnP设备: ${peer.friendlyName}`);
        }
    }

    handleSSDPSearch(data) {
        // Respond to search requests
        if (data.headers?.ST === 'upnp:rootdevice' || 
            data.headers?.ST === this.deviceInfo.deviceType) {
            
            setTimeout(() => {
                this.sendSSDPResponse(data);
            }, Math.random() * 3000); // Random delay as per UPnP spec
        }
    }

    handleDevicePresence(data) {
        if (data.deviceInfo && data.deviceInfo.UDN !== this.deviceInfo.UDN) {
            const peer = {
                ...data.deviceInfo,
                ip: data.ip,
                port: data.port,
                lastSeen: Date.now(),
                type: 'dlna-cast-device'
            };
            
            this.peers.set(data.deviceInfo.UDN, peer);
            this.tvReceiver.log(`发现DLNA Cast设备: ${peer.friendlyName}`);
        }
    }

    handleSSDPResponse(data) {
        this.handleSSDPAnnouncement(data);
    }

    sendSSDPResponse(searchRequest) {
        const response = {
            type: 'ssdp-response',
            method: 'HTTP/1.1 200 OK',
            headers: {
                'CACHE-CONTROL': `max-age=${this.config.maxAge}`,
                'DATE': new Date().toUTCString(),
                'EXT': '',
                'LOCATION': `http://${this.getLocalIP()}:${this.config.httpPort}/device.xml`,
                'SERVER': 'DLNA Cast TV/1.0 UPnP/1.0',
                'ST': this.deviceInfo.deviceType,
                'USN': `${this.deviceInfo.UDN}::${this.deviceInfo.deviceType}`,
                'BOOTID.UPNP.ORG': '1',
                'CONFIGID.UPNP.ORG': '1'
            },
            deviceInfo: this.deviceInfo,
            timestamp: Date.now()
        };
        
        this.broadcastMessage(response);
        this.tvReceiver.log('发送SSDP响应');
    }

    handleICECandidate(candidate) {
        // Extract local IP addresses from ICE candidates
        if (candidate.candidate) {
            const match = candidate.candidate.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
            if (match && match[1]) {
                const ip = match[1];
                if (this.isLocalIP(ip)) {
                    this.tvReceiver.deviceInfo.ip = ip;
                    this.tvReceiver.log(`检测到本地IP: ${ip}`);
                }
            }
        }
    }

    cleanupExpiredPeers() {
        const now = Date.now();
        const expireTime = this.config.maxAge * 1000;
        
        for (const [udn, peer] of this.peers.entries()) {
            if (now - peer.lastSeen > expireTime) {
                this.peers.delete(udn);
                this.tvReceiver.log(`移除过期设备: ${peer.friendlyName}`);
            }
        }
    }

    getPeers() {
        return Array.from(this.peers.values());
    }

    getPeerByUDN(udn) {
        return this.peers.get(udn);
    }

    // Utility methods
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    generateSerialNumber() {
        return 'DLNA-TV-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }

    getLocalIP() {
        // In a real implementation, this would get the actual local IP
        // For simulation, return the stored IP or a default
        return this.tvReceiver.deviceInfo.ip || '192.168.1.100';
    }

    isLocalIP(ip) {
        // Check if IP is in private ranges
        const parts = ip.split('.').map(Number);
        
        // 192.168.x.x
        if (parts[0] === 192 && parts[1] === 168) return true;
        
        // 10.x.x.x
        if (parts[0] === 10) return true;
        
        // 172.16.x.x - 172.31.x.x
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
        
        return false;
    }

    extractIPFromLocation(location) {
        if (!location) return null;
        
        const match = location.match(/http:\/\/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
        return match ? match[1] : null;
    }

    extractPortFromLocation(location) {
        if (!location) return null;
        
        const match = location.match(/:([0-9]+)\//); 
        return match ? parseInt(match[1]) : 80;
    }

    getDeviceDescription() {
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
        <manufacturerURL>${this.deviceInfo.manufacturerURL}</manufacturerURL>
        <modelDescription>${this.deviceInfo.modelDescription}</modelDescription>
        <modelName>${this.deviceInfo.modelName}</modelName>
        <modelNumber>${this.deviceInfo.modelNumber}</modelNumber>
        <modelURL>${this.deviceInfo.modelURL}</modelURL>
        <serialNumber>${this.deviceInfo.serialNumber}</serialNumber>
        <UDN>${this.deviceInfo.UDN}</UDN>
        <presentationURL>${this.deviceInfo.presentationURL}</presentationURL>
    </device>
</root>`;
    }
}

// Make NetworkDiscoveryService available globally
window.NetworkDiscoveryService = NetworkDiscoveryService;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkDiscoveryService;
}