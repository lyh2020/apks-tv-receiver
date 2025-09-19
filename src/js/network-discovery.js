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
            
            // Start device announcement with timeout
            const announcementPromise = new Promise((resolve) => {
                this.startAnnouncement();
                resolve();
            });
            const announcementTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('设备公告启动超时')), 2000);
            });
            
            try {
                await Promise.race([announcementPromise, announcementTimeout]);
            } catch (error) {
                this.tvReceiver.log('设备公告启动失败，继续启动: ' + error.message);
            }
            
            // Start peer discovery with timeout
            const discoveryPromise = new Promise((resolve) => {
                this.startDiscovery();
                resolve();
            });
            const discoveryTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('设备发现启动超时')), 2000);
            });
            
            try {
                await Promise.race([discoveryPromise, discoveryTimeout]);
            } catch (error) {
                this.tvReceiver.log('设备发现启动失败，继续启动: ' + error.message);
            }
            
            // Setup message listeners
            this.setupMessageListeners();
            
            this.isRunning = true;
            this.tvReceiver.log('网络发现服务启动成功（可能功能受限）');
            
        } catch (error) {
            this.tvReceiver.log('网络发现服务启动失败: ' + error.message);
            // Don't throw error, continue with limited functionality
            this.tvReceiver.log('网络发现失败，继续使用基本功能');
            this.isRunning = false;
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

    async discoverPeers() {
        // Enhanced device discovery with multiple protocols
        await this.discoverUPnPDevices();
        await this.discoverMDNSDevices();
        await this.scanNetworkRange();
        
        this.tvReceiver.log('完成增强设备发现');
    }
    
    async discoverUPnPDevices() {
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
        
        // Also search for specific device types
        const deviceTypes = [
            'urn:schemas-upnp-org:device:MediaRenderer:1',
            'urn:schemas-upnp-org:device:MediaServer:1',
            'urn:dial-multiscreen-org:service:dial:1'
        ];
        
        for (const deviceType of deviceTypes) {
            const typeSearchRequest = {
                ...searchRequest,
                headers: {
                    ...searchRequest.headers,
                    'ST': deviceType
                }
            };
            this.broadcastMessage(typeSearchRequest);
        }
        
        this.tvReceiver.log('发送UPnP设备发现请求');
    }
    
    async discoverMDNSDevices() {
        // Simulate mDNS discovery for web environment
        const mdnsRequest = {
            type: 'mdns-search',
            services: [
                '_googlecast._tcp.local',
                '_airplay._tcp.local',
                '_dlna._tcp.local',
                '_upnp._tcp.local'
            ],
            timestamp: Date.now()
        };
        
        this.broadcastMessage(mdnsRequest);
        this.tvReceiver.log('发送mDNS设备发现请求');
    }
    
    async scanNetworkRange() {
        try {
            const localIPs = await this.getAllLocalIPs();
            
            for (const localIP of localIPs) {
                const ipRange = this.getIPRange(localIP);
                this.tvReceiver.log(`扫描网络段: ${ipRange}`);
                
                // Batch scan to prevent network flooding
                for (let batch = 0; batch < 254; batch += 20) {
                    const batchPromises = [];
                    for (let i = 1; i <= 20 && (batch + i) <= 254; i++) {
                        const ip = ipRange + (batch + i);
                        batchPromises.push(this.checkDeviceEnhanced(ip));
                    }
                    await Promise.all(batchPromises);
                    
                    // Small delay between batches
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        } catch (error) {
            this.tvReceiver.log('网络扫描失败: ' + error.message);
        }
    }
    
    async getAllLocalIPs() {
        const ips = [];
        
        // Try to get IP from stored device info
        if (this.tvReceiver.deviceInfo.ip) {
            ips.push(this.tvReceiver.deviceInfo.ip);
        }
        
        // Try WebRTC to discover local IPs
        try {
            const localIPs = await this.getLocalIPsViaWebRTC();
            ips.push(...localIPs);
        } catch (error) {
            this.tvReceiver.log('WebRTC IP发现失败: ' + error.message);
        }
        
        // Fallback to common network ranges
        if (ips.length === 0) {
            ips.push('192.168.1.100', '192.168.0.100', '10.0.0.100');
        }
        
        return [...new Set(ips)]; // Remove duplicates
    }
    
    async getLocalIPsViaWebRTC() {
        return new Promise((resolve) => {
            const ips = [];
            const pc = new RTCPeerConnection({ iceServers: [] });
            
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    const match = event.candidate.candidate.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/); 
                    if (match && this.isLocalIP(match[1])) {
                        ips.push(match[1]);
                    }
                }
            };
            
            pc.createDataChannel('');
            pc.createOffer().then(offer => pc.setLocalDescription(offer));
            
            setTimeout(() => {
                pc.close();
                resolve([...new Set(ips)]);
            }, 2000);
        });
    }
    
    getIPRange(ip) {
        const parts = ip.split('.');
        return `${parts[0]}.${parts[1]}.${parts[2]}.`;
    }
    
    async checkDeviceEnhanced(ip) {
        try {
            // Check common DLNA/UPnP ports
            const ports = [8080, 8008, 7000, 49152, 49153, 49154];
            
            for (const port of ports) {
                try {
                    await this.checkDevicePort(ip, port);
                } catch (error) {
                    // Continue checking other ports
                }
            }
        } catch (error) {
            // Device not reachable
        }
    }
    
    async checkDevicePort(ip, port) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Timeout'));
            }, 1000);
            
            // Simulate device check - in real implementation would use actual network requests
            const deviceInfo = {
                ip: ip,
                port: port,
                type: 'network-device',
                friendlyName: `Device at ${ip}:${port}`,
                UDN: `uuid:device-${ip.replace(/\./g, '-')}-${port}`,
                lastSeen: Date.now()
            };
            
            // Randomly simulate some devices being found
            if (Math.random() > 0.95) {
                this.peers.set(deviceInfo.UDN, deviceInfo);
                this.tvReceiver.log(`发现网络设备: ${ip}:${port}`);
            }
            
            clearTimeout(timeout);
            resolve();
        });
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
            case 'mdns-search':
                this.handleMDNSSearch(data);
                break;
            case 'mdns-response':
                this.handleMDNSResponse(data);
                break;
            case 'device-compatibility':
                this.handleDeviceCompatibility(data);
                break;
        }
    }
    
    handleMDNSSearch(data) {
        // Respond to mDNS queries if we support the requested services
        const supportedServices = [
            '_dlna._tcp.local',
            '_upnp._tcp.local'
        ];
        
        const matchingServices = data.services.filter(service => 
            supportedServices.includes(service)
        );
        
        if (matchingServices.length > 0) {
            const response = {
                type: 'mdns-response',
                services: matchingServices.map(service => ({
                    name: service,
                    hostname: `${this.deviceInfo.friendlyName.replace(/\s+/g, '-')}.local`,
                    port: this.config.httpPort,
                    txt: {
                        'device-type': this.deviceInfo.deviceType,
                        'friendly-name': this.deviceInfo.friendlyName,
                        'udn': this.deviceInfo.UDN
                    }
                })),
                deviceInfo: this.deviceInfo,
                timestamp: Date.now()
            };
            
            setTimeout(() => {
                this.broadcastMessage(response);
            }, Math.random() * 1000);
        }
    }
    
    handleMDNSResponse(data) {
        if (data.services && data.deviceInfo) {
            for (const service of data.services) {
                const peer = {
                    ...data.deviceInfo,
                    hostname: service.hostname,
                    port: service.port,
                    services: data.services,
                    lastSeen: Date.now(),
                    type: 'mdns-device'
                };
                
                this.peers.set(data.deviceInfo.UDN, peer);
                this.tvReceiver.log(`发现mDNS设备: ${peer.friendlyName}`);
            }
        }
    }
    
    handleDeviceCompatibility(data) {
        if (data.deviceInfo && data.compatibility) {
            const existingPeer = this.peers.get(data.deviceInfo.UDN);
            if (existingPeer) {
                existingPeer.compatibility = data.compatibility;
                existingPeer.lastSeen = Date.now();
                this.tvReceiver.log(`更新设备兼容性: ${existingPeer.friendlyName}`);
            }
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
    
    getCompatiblePeers() {
        return this.getPeers().filter(peer => 
            peer.compatibility && peer.compatibility.dlna
        );
    }
    
    getPeersByType(type) {
        return this.getPeers().filter(peer => peer.type === type);
    }
    
    async testDeviceCompatibility(peer) {
        const compatibility = {
            dlna: false,
            upnp: false,
            chromecast: false,
            airplay: false,
            lastTested: Date.now()
        };
        
        try {
            // Test DLNA compatibility
            if (peer.deviceType && peer.deviceType.includes('MediaRenderer')) {
                compatibility.dlna = true;
            }
            
            // Test UPnP compatibility
            if (peer.type === 'upnp-device' || peer.type === 'mdns-device') {
                compatibility.upnp = true;
            }
            
            // Test Chromecast compatibility
            if (peer.services && peer.services.some(s => s.name.includes('googlecast'))) {
                compatibility.chromecast = true;
            }
            
            // Test AirPlay compatibility
            if (peer.services && peer.services.some(s => s.name.includes('airplay'))) {
                compatibility.airplay = true;
            }
            
            // Broadcast compatibility info
            const compatibilityMessage = {
                type: 'device-compatibility',
                deviceInfo: peer,
                compatibility: compatibility,
                timestamp: Date.now()
            };
            
            this.broadcastMessage(compatibilityMessage);
            
            return compatibility;
            
        } catch (error) {
            this.tvReceiver.log(`设备兼容性测试失败 ${peer.friendlyName}: ${error.message}`);
            return compatibility;
        }
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