// Storage Management System

class AppStorage {
  constructor() {
    this.storageKey = 'pwa-app-data';
    this.init();
  }

  init() {
    // Initialize storage structure if not exists
    if (!this.getData()) {
      this.setData({
        users: [],
        calculations: [],
        settings: this.getDefaultSettings(),
        metadata: {
          version: '1.0.0',
          created: new Date().toISOString(),
          lastAccess: new Date().toISOString()
        },
        pendingSync: []
      });
    }
    
    // Update last access time
    this.updateLastAccess();
  }

  // Core storage methods
  getData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  setData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  }

  updateLastAccess() {
    const data = this.getData();
    if (data && data.metadata) {
      data.metadata.lastAccess = new Date().toISOString();
      this.setData(data);
    }
  }

  getDefaultSettings() {
    return {
      theme: 'default',
      fontSize: 'medium',
      language: 'th',
      notifications: true,
      autoSync: true,
      offlineMode: true
    };
  }

  // User data methods
  saveData(userData) {
    const data = this.getData();
    if (!data) return false;

    // Check if updating existing user
    const existingIndex = data.users.findIndex(user => user.id === userData.id);
    
    if (existingIndex !== -1) {
      // Update existing user
      data.users[existingIndex] = { ...data.users[existingIndex], ...userData };
    } else {
      // Add new user
      data.users.push(userData);
    }

    return this.setData(data);
  }

  loadData(id) {
    const data = this.getData();
    if (!data || !data.users) return null;

    return data.users.find(user => user.id === id) || null;
  }

  getAllData() {
    const data = this.getData();
    return data && data.users ? data.users : [];
  }

  deleteData(id) {
    const data = this.getData();
    if (!data || !data.users) return false;

    data.users = data.users.filter(user => user.id !== id);
    return this.setData(data);
  }

  getDataCount() {
    const data = this.getData();
    return data && data.users ? data.users.length : 0;
  }

  // Search and filter methods
  searchData(query) {
    const allData = this.getAllData();
    if (!query) return allData;

    const searchTerm = query.toLowerCase();
    return allData.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.email.toLowerCase().includes(searchTerm) ||
      (item.phone && item.phone.includes(searchTerm)) ||
      (item.note && item.note.toLowerCase().includes(searchTerm))
    );
  }

  filterByCategory(category) {
    const allData = this.getAllData();
    if (!category || category === 'all') return allData;

    return allData.filter(item => item.category === category);
  }

  // Calculation methods
  saveCalculation(calculation) {
    const data = this.getData();
    if (!data) return false;

    if (!data.calculations) {
      data.calculations = [];
    }

    data.calculations.push(calculation);

    // Keep only last 100 calculations to prevent storage overflow
    if (data.calculations.length > 100) {
      data.calculations = data.calculations.slice(-100);
    }

    return this.setData(data);
  }

  getCalculationHistory() {
    const data = this.getData();
    return data && data.calculations ? data.calculations : [];
  }

  getCalculationCount() {
    const data = this.getData();
    return data && data.calculations ? data.calculations.length : 0;
  }

  clearCalculationHistory() {
    const data = this.getData();
    if (!data) return false;

    data.calculations = [];
    return this.setData(data);
  }

  incrementCalculationCount() {
    // This is handled by saveCalculation method
    return true;
  }

  // Settings methods
  saveSetting(key, value) {
    const data = this.getData();
    if (!data) return false;

    if (!data.settings) {
      data.settings = this.getDefaultSettings();
    }

    data.settings[key] = value;
    return this.setData(data);
  }

  loadSetting(key) {
    const data = this.getData();
    if (!data || !data.settings) return null;

    return data.settings[key];
  }

  getAllSettings() {
    const data = this.getData();
    return data && data.settings ? data.settings : this.getDefaultSettings();
  }

  resetSettings() {
    const data = this.getData();
    if (!data) return false;

    data.settings = this.getDefaultSettings();
    return this.setData(data);
  }

  // Sync methods
  addToPendingSync(syncData) {
    const data = this.getData();
    if (!data) return false;

    if (!data.pendingSync) {
      data.pendingSync = [];
    }

    data.pendingSync.push({
      id: Date.now().toString(),
      data: syncData,
      timestamp: new Date().toISOString(),
      type: 'user_data'
    });

    return this.setData(data);
  }

  getPendingSync() {
    const data = this.getData();
    return data && data.pendingSync ? data.pendingSync : [];
  }

  clearPendingSync() {
    const data = this.getData();
    if (!data) return false;

    data.pendingSync = [];
    return this.setData(data);
  }

  removePendingSyncItem(id) {
    const data = this.getData();
    if (!data || !data.pendingSync) return false;

    data.pendingSync = data.pendingSync.filter(item => item.id !== id);
    return this.setData(data);
  }

  // Backup and restore methods
  exportData() {
    const data = this.getData();
    if (!data) return null;

    return {
      ...data,
      exportInfo: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        source: 'PWA App'
      }
    };
  }

  importData(importedData) {
    try {
      // Validate imported data structure
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Invalid data format');
      }

      // Merge with existing data or replace
      const currentData = this.getData() || {};
      
      const mergedData = {
        users: importedData.users || currentData.users || [],
        calculations: importedData.calculations || currentData.calculations || [],
        settings: { ...this.getDefaultSettings(), ...currentData.settings, ...importedData.settings },
        metadata: {
          ...currentData.metadata,
          lastImport: new Date().toISOString()
        },
        pendingSync: currentData.pendingSync || []
      };

      return this.setData(mergedData);
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Utility methods
  getStorageInfo() {
    const data = this.getData();
    if (!data) return null;

    const dataString = JSON.stringify(data);
    const sizeInBytes = new Blob([dataString]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);

    return {
      totalItems: this.getDataCount(),
      totalCalculations: this.getCalculationCount(),
      pendingSyncItems: this.getPendingSync().length,
      storageSize: `${sizeInKB} KB`,
      lastAccess: data.metadata ? data.metadata.lastAccess : null,
      version: data.metadata ? data.metadata.version : null
    };
  }

  clearAll() {
    try {
      localStorage.removeItem(this.storageKey);
      this.init(); // Reinitialize with default structure
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Data validation methods
  validateUserData(userData) {
    const required = ['name', 'email'];
    const optional = ['phone', 'category', 'note', 'id', 'timestamp'];
    
    // Check required fields
    for (const field of required) {
      if (!userData[field] || userData[field].trim() === '') {
        return { valid: false, error: `Field '${field}' is required` };
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return { valid: false, error: 'Invalid email format' };
    }

    // Validate phone if provided
    if (userData.phone && userData.phone.trim() !== '') {
      const phoneRegex = /^[0-9\-\+\(\)\s]+$/;
      if (!phoneRegex.test(userData.phone)) {
        return { valid: false, error: 'Invalid phone format' };
      }
    }

    return { valid: true };
  }

  // Statistics methods
  getStatistics() {
    const data = this.getData();
    if (!data) return null;

    const users = data.users || [];
    const calculations = data.calculations || [];

    // User statistics
    const usersByCategory = users.reduce((acc, user) => {
      acc[user.category] = (acc[user.category] || 0) + 1;
      return acc;
    }, {});

    const recentUsers = users
      .filter(user => {
        const userDate = new Date(user.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return userDate > weekAgo;
      })
      .length;

    // Calculation statistics
    const recentCalculations = calculations
      .filter(calc => {
        const calcDate = new Date(calc.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return calcDate > weekAgo;
      })
      .length;

    return {
      users: {
        total: users.length,
        byCategory: usersByCategory,
        recentWeek: recentUsers,
        latest: users[users.length - 1] || null
      },
      calculations: {
        total: calculations.length,
        recentWeek: recentCalculations,
        latest: calculations[calculations.length - 1] || null
      },
      storage: this.getStorageInfo()
    };
  }

  // Search with advanced options
  advancedSearch(options = {}) {
    const { query, category, dateFrom, dateTo, sortBy, sortOrder } = options;
    let results = this.getAllData();

    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.email.toLowerCase().includes(searchTerm) ||
        (item.phone && item.phone.includes(searchTerm)) ||
        (item.note && item.note.toLowerCase().includes(searchTerm))
      );
    }

    // Category filter
    if (category && category !== 'all') {
      results = results.filter(item => item.category === category);
    }

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      results = results.filter(item => new Date(item.timestamp) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      results = results.filter(item => new Date(item.timestamp) <= toDate);
    }

    // Sorting
    if (sortBy) {
      results.sort((a, b) => {
        let valueA = a[sortBy];
        let valueB = b[sortBy];

        if (sortBy === 'timestamp') {
          valueA = new Date(valueA);
          valueB = new Date(valueB);
        }

        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        if (sortOrder === 'desc') {
          return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        } else {
          return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        }
      });
    }

    return results;
  }

  // Cleanup old data
  cleanup(options = {}) {
    const { olderThanDays = 90, maxCalculations = 100 } = options;
    const data = this.getData();
    if (!data) return false;

    let hasChanges = false;

    // Clean old calculations
    if (data.calculations && data.calculations.length > maxCalculations) {
      data.calculations = data.calculations.slice(-maxCalculations);
      hasChanges = true;
    }

    // Clean old pending sync items
    if (data.pendingSync) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const initialLength = data.pendingSync.length;
      data.pendingSync = data.pendingSync.filter(item => 
        new Date(item.timestamp) > cutoffDate
      );
      
      if (data.pendingSync.length !== initialLength) {
        hasChanges = true;
      }
    }

    return hasChanges ? this.setData(data) : true;
  }
}

// Create singleton instance
const AppStorage = new AppStorage();

// Make it globally available
window.AppStorage = AppStorage;

// Additional helper functions
function showSettings() {
  const content = document.getElementById('content');
  if (!content) return;

  const settings = AppStorage.getAllSettings();
  const storageInfo = AppStorage.getStorageInfo();

  content.innerHTML = `
    <h3>⚙️ ตั้งค่า</h3>
    
    <div class="card" style="background: var(--card-background); padding: 20px; margin-bottom: 20px;">
      <h4>🎨 การแสดงผล</h4>
      <div class="input-group">
        <label for="themeSelect">ธีม:</label>
        <select id="themeSelect" onchange="changeTheme()">
          <option value="default" ${settings.theme === 'default' ? 'selected' : ''}>ธีมเริ่มต้น</option>
          <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>ธีมมืด</option>
          <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>ธีมสว่าง</option>
        </select>
      </div>
      <div class="input-group">
        <label for="fontSizeSelect">ขนาดตัวอักษร:</label>
        <select id="fontSizeSelect" onchange="changeFontSize()">
          <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>เล็ก</option>
          <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>ปกติ</option>
          <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>ใหญ่</option>
        </select>
      </div>
    </div>

    <div class="card" style="background: var(--card-background); padding: 20px; margin-bottom: 20px;">
      <h4>🔄 การซิงค์</h4>
      <div class="input-group">
        <label for="googleScriptUrl">Google Apps Script URL:</label>
        <input type="url" id="googleScriptUrl" placeholder="https://script.google.com/..." 
               value="${AppStorage.loadSetting('googleScriptUrl') || ''}"
               onchange="updateGoogleScriptUrl()">
      </div>
      <div class="input-group">
        <label>
          <input type="checkbox" id="autoSyncCheck" ${settings.autoSync ? 'checked' : ''} onchange="toggleAutoSync()">
          เปิดใช้งานการซิงค์อัตโนมัติ
        </label>
      </div>
      <button class="btn btn-secondary" onclick="testGoogleScriptConnection()">ทดสอบการเชื่อมต่อ</button>
    </div>

    <div class="card" style="background: var(--card-background); padding: 20px; margin-bottom: 20px;">
      <h4>📊 ข้อมูลแอป</h4>
      <div class="data-display">
        <div class="data-item"><strong>ข้อมูลผู้ใช้:</strong> ${storageInfo.totalItems} รายการ</div>
        <div class="data-item"><strong>ประวัติการคำนวณ:</strong> ${storageInfo.totalCalculations} รายการ</div>
        <div class="data-item"><strong>ข้อมูลรอซิงค์:</strong> ${storageInfo.pendingSyncItems} รายการ</div>
        <div class="data-item"><strong>ขนาดข้อมูล:</strong> ${storageInfo.storageSize}</div>
        <div class="data-item"><strong>เข้าใช้ครั้งล่าสุด:</strong> ${storageInfo.lastAccess ? new Date(storageInfo.lastAccess).toLocaleString('th-TH') : 'ไม่ทราบ'}</div>
      </div>
    </div>

    <div class="card" style="background: var(--card-background); padding: 20px;">
      <h4>🛠️ การจัดการข้อมูล</h4>
      <div class="grid-2">
        <button class="btn" onclick="exportAllData()">ส่งออกข้อมูลทั้งหมด</button>
        <button class="btn btn-secondary" onclick="showImportData()">นำเข้าข้อมูล</button>
        <button class="btn btn-outline" onclick="cleanupOldData()">ล้างข้อมูลเก่า</button>
        <button class="btn" onclick="clearAllAppData()" style="background: #f44336;">ล้างข้อมูลทั้งหมด</button>
      </div>
    </div>
  `;
}

function changeTheme() {
  const theme = document.getElementById('themeSelect').value;
  AppStorage.saveSetting('theme', theme);
  applyTheme(theme);
  app.showNotification('เปลี่ยนธีมสำเร็จ', 'success');
}

function changeFontSize() {
  const fontSize = document.getElementById('fontSizeSelect').value;
  AppStorage.saveSetting('fontSize', fontSize);
  applyFontSize(fontSize);
  app.showNotification('เปลี่ยนขนาดตัวอักษรสำเร็จ', 'success');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function applyFontSize(size) {
  const root = document.documentElement;
  switch(size) {
    case 'small':
      root.style.fontSize = '14px';
      break;
    case 'large':
      root.style.fontSize = '18px';
      break;
    default:
      root.style.fontSize = '16px';
  }
}

function updateGoogleScriptUrl() {
  const url = document.getElementById('googleScriptUrl').value.trim();
  AppStorage.saveSetting('googleScriptUrl', url);
  googleAPI.configure(url);
  app.showNotification('อัปเดต URL สำเร็จ', 'success');
}

function toggleAutoSync() {
  const autoSync = document.getElementById('autoSyncCheck').checked;
  AppStorage.saveSetting('autoSync', autoSync);
  app.showNotification(`${autoSync ? 'เปิด' : 'ปิด'}การซิงค์อัตโนมัติ`, 'success');
}

function testGoogleScriptConnection() {
  const url = AppStorage.loadSetting('googleScriptUrl');
  
  if (!url) {
    app.showNotification('กรุณาใส่ URL ของ Google Apps Script ก่อน', 'error');
    return;
  }

  app.showNotification('กำลังทดสอบการเชื่อมต่อ...', 'info');
  
  googleAPI.getData({ test: true })
    .then(result => {
      app.showNotification('เชื่อมต่อสำเร็จ! 🎉', 'success');
    })
    .catch(error => {
      app.showNotification('เชื่อมต่อไม่สำเร็จ: ' + error.message, 'error');
    });
}

function exportAllData() {
  const data = AppStorage.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pwa-app-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  app.showNotification('ส่งออกข้อมูลทั้งหมดสำเร็จ', 'success');
}

function showImportData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (AppStorage.importData(data)) {
            app.showNotification('นำเข้าข้อมูลสำเร็จ', 'success');
            app.updateStats();
            setTimeout(() => window.location.reload(), 1000);
          } else {
            app.showNotification('เกิดข้อผิดพลาดในการนำเข้าข้อมูล', 'error');
          }
        } catch (error) {
          app.showNotification('ไฟล์ข้อมูลไม่ถูกต้อง', 'error');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

function cleanupOldData() {
  if (confirm('ต้องการล้างข้อมูลเก่าหรือไม่? (ข้อมูลเก่ากว่า 90 วัน)')) {
    AppStorage.cleanup();
    app.showNotification('ล้างข้อมูลเก่าเรียบร้อย', 'success');
    app.updateStats();
  }
}

function clearAllAppData() {
  if (confirm('⚠️ ต้องการล้างข้อมูลทั้งหมดหรือไม่?\n\nการดำเนินการนี้ไม่สามารถยกเลิกได้')) {
    if (confirm('แน่ใจหรือไม่? ข้อมูลทั้งหมดจะหายไป!')) {
      AppStorage.clearAll();
      app.showNotification('ล้างข้อมูลทั้งหมดแล้ว', 'success');
      setTimeout(() => window.location.reload(), 1000);
    }
  }
}

function showAbout() {
  const content = document.getElementById('content');
  if (!content) return;

  const appInfo = app.getAppInfo();
  const stats = AppStorage.getStatistics();

  content.innerHTML = `
    <h3>ℹ️ เกี่ยวกับแอป</h3>
    
    <div class="card" style="background: var(--card-background); padding: 20px; margin-bottom: 20px;">
      <h4>📱 Progressive Web App</h4>
      <p>แอปนี้เป็น Progressive Web App (PWA) ที่ออกแบบมาเพื่อให้ทำงานเหมือน Native App บนมือถือ</p>
      
      <div class="data-display">
        <div class="data-item"><strong>เวอร์ชัน:</strong> ${appInfo.version}</div>
        <div class="data-item"><strong>สถานะ:</strong> ${appInfo.isOnline ? '🌐 ออนไลน์' : '📱 ออฟไลน์'}</div>
        <div class="data-item"><strong>การติดตั้ง:</strong> ${appInfo.isInstalled ? '✅ ติดตั้งแล้ว' : '⏳ ยังไม่ติดตั้ง'}</div>
        <div class="data-item"><strong>แพลตฟอร์ม:</strong> ${appInfo.platform}</div>
        <div class="data-item"><strong>ภาษา:</strong> ${appInfo.language}</div>
      </div>
    </div>

    <div class="card" style="background: var(--card-background); padding: 20px; margin-bottom: 20px;">
      <h4>🚀 ฟีเจอร์หลัก</h4>
      <ul style="margin-left: 20px; line-height: 1.8;">
        <li>ทำงานออฟไลน์ได้ 100%</li>
        <li>ติดตั้งบนหน้าหลักมือถือได้</li>
        <li>เร็วและใช้งานง่าย</li>
        <li>ปลอดภัยด้วย HTTPS</li>
        <li>ซิงค์ข้อมูลกับ Google Apps Script</li>
        <li>บันทึกข้อมูลแบบ Local Storage</li>
        <li>เครื่องคิดเลขขั้นสูง</li>
        <li>การจัดการข้อมูลที่ครอบคลุม</li>
      </ul>
    </div>

    <div class="card" style="background: var(--card-background); padding: 20px; margin-bottom: 20px;">
      <h4>📊 สถิติการใช้งาน</h4>
      <div class="grid-2">
        <div class="stat-item">
          <div class="stat-number">${stats.users.total}</div>
          <div class="stat-label">ข้อมูลทั้งหมด</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${stats.calculations.total}</div>
          <div class="stat-label">การคำนวณ</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${stats.users.recentWeek}</div>
          <div class="stat-label">ข้อมูลสัปดาห์นี้</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${stats.calculations.recentWeek}</div>
          <div class="stat-label">คำนวณสัปดาห์นี้</div>
        </div>
      </div>
    </div>

    <div class="card" style="background: var(--card-background); padding: 20px;">
      <h4>📝 วิธีการใช้งาน</h4>
      <div class="data-display">
        <div class="data-item">
          <strong>1. การติดตั้ง:</strong><br>
          • เปิดเมนูเบราว์เซอร์ (⋮)<br>
          • เลือก "เพิ่มไปยังหน้าหลัก" หรือ "ติดตั้งแอป"<br>
          • ยืนยันการติดตั้ง
        </div>
        <div class="data-item">
          <strong>2. การใช้งานออฟไลน์:</strong><br>
          • แอปจะทำงานได้แม้ไม่มีอินเทอร์เน็ต<br>
          • ข้อมูลจะซิงค์เมื่อเชื่อมต่ออินเทอร์เน็ตใหม่
        </div>
        <div class="data-item">
          <strong>3. คีย์บอร์ดช็อตคัต:</strong><br>
          • Ctrl/Cmd + 1-4: เปลี่ยนหน้า<br>
          • Ctrl/Cmd + K: แสดงคำสั่งทั้งหมด<br>
          • ESC: ปิดป๊อปอัป
        </div>
      </div>
      
      <div class="status success" style="margin-top: 20px;">
        <p>🎉 แอปพร้อมใช้งานแล้ว!</p>
      </div>
    </div>
  `;
}

// Initialize settings on app load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = AppStorage.loadSetting('theme');
  const savedFontSize = AppStorage.loadSetting('fontSize');
  
  if (savedTheme) {
    applyTheme(savedTheme);
  }
  
  if (savedFontSize) {
    applyFontSize(savedFontSize);
  }
});
