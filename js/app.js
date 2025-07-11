// PWA App Main JavaScript File
class PWAApp {
  constructor() {
    this.deferredPrompt = null;
    this.isOnline = navigator.onLine;
    this.version = '1.0.0';
    this.lastUpdate = new Date().toLocaleString('th-TH');
    
    this.init();
  }

  // Initialize the app
  init() {
    this.setupEventListeners();
    this.registerServiceWorker();
    this.updateUI();
    this.hideLoadingScreen();
    this.checkForUpdates();
    this.handleDeepLinks();
  }

  // Setup event listeners
  setupEventListeners() {
    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    // App installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed successfully');
      this.hideInstallPrompt();
      this.showNotification('แอปติดตั้งสำเร็จ! 🎉', 'success');
    });

    // Online/Offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOnlineStatus();
      this.showNotification('เชื่อมต่ออินเทอร์เน็ตแล้ว 🌐', 'success');
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOnlineStatus();
      this.showNotification('ใช้งานออฟไลน์ 📱', 'warning');
    });

    // Service Worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Page visibility
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });
  }

  // Register Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable();
            }
          });
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Handle Service Worker messages
  handleServiceWorkerMessage(event) {
    const { data } = event;
    
    switch (data.type) {
      case 'SYNC_COMPLETE':
        this.showNotification(`ซิงค์ข้อมูล ${data.data.count} รายการสำเร็จ`, 'success');
        break;
      case 'UPDATE_AVAILABLE':
        this.showUpdateAvailable();
        break;
      default:
        console.log('Unknown message from Service Worker:', data);
    }
  }

  // Show install prompt
  showInstallPrompt() {
    const installPrompt = document.getElementById('installPrompt');
    if (installPrompt) {
      installPrompt.classList.add('show');
    }
  }

  // Hide install prompt
  hideInstallPrompt() {
    const installPrompt = document.getElementById('installPrompt');
    if (installPrompt) {
      installPrompt.classList.remove('show');
    }
  }

  // Install app
  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      this.hideInstallPrompt();
    }
  }

  // Dismiss install prompt
  dismissInstall() {
    this.hideInstallPrompt();
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  }

  // Update UI
  updateUI() {
    this.updateLastUpdateTime();
    this.updateOnlineStatus();
    this.updateStats();
  }

  // Update last update time
  updateLastUpdateTime() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
      lastUpdateElement.textContent = this.lastUpdate;
    }
  }

  // Update online status
  updateOnlineStatus() {
    const onlineStatusElement = document.getElementById('onlineStatus');
    if (onlineStatusElement) {
      onlineStatusElement.textContent = this.isOnline ? '🌐' : '📱';
      onlineStatusElement.title = this.isOnline ? 'ออนไลน์' : 'ออฟไลน์';
    }
  }

  // Update stats
  updateStats() {
    const dataCount = AppStorage.getDataCount();
    const calcCount = AppStorage.getCalculationCount();
    
    const dataCountElement = document.getElementById('dataCount');
    const calcCountElement = document.getElementById('calcCount');
    
    if (dataCountElement) dataCountElement.textContent = dataCount;
    if (calcCountElement) calcCountElement.textContent = calcCount;
  }

  // Show notification
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.textContent = message;
      notification.className = `notification ${type} show`;
      
      setTimeout(() => {
        notification.classList.remove('show');
      }, duration);
    }
  }

  // Hide loading screen
  hideLoadingScreen() {
    setTimeout(() => {
      const loadingScreen = document.getElementById('loadingScreen');
      if (loadingScreen) {
        loadingScreen.classList.add('hide');
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 300);
      }
    }, 1000);
  }

  // Check for updates
  async checkForUpdates() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data.hasUpdate) {
            this.showUpdateAvailable();
          }
        };
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'CHECK_UPDATE' },
          [messageChannel.port2]
        );
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    }
  }

  // Show update available
  showUpdateAvailable() {
    const updateMessage = 'มีอัปเดตใหม่! คลิกเพื่อรีเฟรช';
    this.showNotification(updateMessage, 'info', 10000);
    
    // Add click listener to notification for update
    const notification = document.getElementById('notification');
    if (notification) {
      notification.style.cursor = 'pointer';
      notification.onclick = () => {
        this.applyUpdate();
      };
    }
  }

  // Apply update
  applyUpdate() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Handle deep links
  handleDeepLinks() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    
    if (page) {
      switch (page) {
        case 'data':
          showDataForm();
          break;
        case 'calculator':
          showCalculator();
          break;
        case 'settings':
          showSettings();
          break;
        case 'about':
          showAbout();
          break;
      }
    }
  }

  // Handle keyboard shortcuts
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + key combinations
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          showDataForm();
          break;
        case '2':
          e.preventDefault();
          showCalculator();
          break;
        case '3':
          e.preventDefault();
          showSettings();
          break;
        case '4':
          e.preventDefault();
          showAbout();
          break;
        case 'k':
          e.preventDefault();
          this.showKeyboardShortcuts();
          break;
      }
    }
    
    // ESC key
    if (e.key === 'Escape') {
      this.hideInstallPrompt();
    }
  }

  // Show keyboard shortcuts
  showKeyboardShortcuts() {
    const shortcuts = [
      'Ctrl/Cmd + 1: จัดการข้อมูล',
      'Ctrl/Cmd + 2: เครื่องคิดเลข',
      'Ctrl/Cmd + 3: ตั้งค่า',
      'Ctrl/Cmd + 4: เกี่ยวกับ',
      'Ctrl/Cmd + K: แสดงคีย์บอร์ดช็อตคัต',
      'ESC: ปิดป๊อปอัป'
    ];
    
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = `
        <h3>⌨️ คีย์บอร์ดช็อตคัต</h3>
        <div class="data-display">
          ${shortcuts.map(shortcut => `
            <div class="data-item">${shortcut}</div>
          `).join('')}
        </div>
        <button class="btn" onclick="location.reload()">กลับหน้าหลัก</button>
      `;
    }
  }

  // Sync pending data
  async syncPendingData() {
    if (!this.isOnline) return;
    
    try {
      const pendingData = AppStorage.getPendingSync();
      if (pendingData && pendingData.length > 0) {
        // Register background sync
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register('background-sync');
        }
      }
    } catch (error) {
      console.error('Error syncing pending data:', error);
    }
  }

  // Get app info
  getAppInfo() {
    return {
      version: this.version,
      isOnline: this.isOnline,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      lastUpdate: this.lastUpdate,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform
    };
  }

  // Export app data
  exportAppData() {
    const data = {
      appInfo: this.getAppInfo(),
      userData: AppStorage.exportData(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pwa-app-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showNotification('ส่งออกข้อมูลสำเร็จ', 'success');
  }

  // Import app data
  async importAppData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.userData) {
        AppStorage.importData(data.userData);
        this.updateStats();
        this.showNotification('นำเข้าข้อมูลสำเร็จ', 'success');
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      this.showNotification('เกิดข้อผิดพลาดในการนำเข้าข้อมูล', 'error');
    }
  }

  // Clear all app data
  clearAllData() {
    if (confirm('ต้องการล้างข้อมูลทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้')) {
      AppStorage.clearAll();
      this.updateStats();
      this.showNotification('ล้างข้อมูลทั้งหมดแล้ว', 'success');
      
      // Reload page to reset UI
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
}

// Global functions for button clicks
window.installApp = () => app.installApp();
window.dismissInstall = () => app.dismissInstall();

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new PWAApp();
});

// Google Apps Script integration
class GoogleScriptAPI {
  constructor(scriptUrl = '') {
    this.scriptUrl = scriptUrl;
    this.isConfigured = !!scriptUrl;
  }

  // Send data to Google Apps Script
  async sendData(data) {
    if (!this.isConfigured) {
      console.warn('Google Apps Script URL not configured');
      return { success: false, error: 'Not configured' };
    }

    try {
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveData',
          data: data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending to Google Script:', error);
      
      // Store for later sync if offline
      if (!navigator.onLine) {
        AppStorage.addToPendingSync(data);
      }
      
      throw error;
    }
  }

  // Get data from Google Apps Script
  async getData(params = {}) {
    if (!this.isConfigured) {
      console.warn('Google Apps Script URL not configured');
      return { success: false, error: 'Not configured' };
    }

    try {
      const url = new URL(this.scriptUrl);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error getting from Google Script:', error);
      throw error;
    }
  }

  // Configure Google Apps Script URL
  configure(scriptUrl) {
    this.scriptUrl = scriptUrl;
    this.isConfigured = !!scriptUrl;
    AppStorage.save('googleScriptUrl', scriptUrl);
  }

  // Load configuration from storage
  loadConfiguration() {
    const savedUrl = AppStorage.load('googleScriptUrl');
    if (savedUrl) {
      this.configure(savedUrl);
    }
  }
}

// Initialize Google Script API
const googleAPI = new GoogleScriptAPI();
googleAPI.loadConfiguration();

// Make it globally available
window.googleAPI = googleAPI;
