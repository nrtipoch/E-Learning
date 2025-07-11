// App Features JavaScript

// Data Management Features
function showDataForm() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <h3>📊 จัดการข้อมูล</h3>
    <form id="dataForm" onsubmit="saveData(event)">
      <div class="input-group">
        <label for="nameInput">ชื่อ:</label>
        <input type="text" id="nameInput" placeholder="กรอกชื่อ" required>
      </div>
      <div class="input-group">
        <label for="emailInput">อีเมล:</label>
        <input type="email" id="emailInput" placeholder="กรอกอีเมล" required>
      </div>
      <div class="input-group">
        <label for="phoneInput">เบอร์โทร:</label>
        <input type="tel" id="phoneInput" placeholder="กรอกเบอร์โทร">
      </div>
      <div class="input-group">
        <label for="categoryInput">หมวดหมู่:</label>
        <select id="categoryInput">
          <option value="personal">ส่วนตัว</option>
          <option value="work">งาน</option>
          <option value="business">ธุรกิจ</option>
          <option value="other">อื่นๆ</option>
        </select>
      </div>
      <div class="input-group">
        <label for="noteInput">หมายเหตุ:</label>
        <textarea id="noteInput" placeholder="กรอกหมายเหตุ" rows="3"></textarea>
      </div>
      <div class="grid-2">
        <button type="submit" class="btn">บันทึกข้อมูล</button>
        <button type="button" class="btn btn-secondary" onclick="loadAllData()">แสดงข้อมูลทั้งหมด</button>
      </div>
    </form>
    <div id="dataDisplay"></div>
  `;
  
  // Auto-fill form if editing
  const editId = new URLSearchParams(window.location.search).get('edit');
  if (editId) {
    loadDataForEdit(editId);
  }
}

function saveData(event) {
  event.preventDefault();
  
  const name = document.getElementById('nameInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const phone = document.getElementById('phoneInput').value.trim();
  const category = document.getElementById('categoryInput').value;
  const note = document.getElementById('noteInput').value.trim();
  
  if (!name || !email) {
    app.showNotification('กรุณากรอกชื่อและอีเมล', 'error');
    return;
  }
  
  const data = {
    id: Date.now().toString(),
    name,
    email,
    phone,
    category,
    note,
    timestamp: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
  
  try {
    AppStorage.saveData(data);
    app.updateStats();
    
    // Try to sync with Google Script
    if (googleAPI.isConfigured && navigator.onLine) {
      googleAPI.sendData(data)
        .then(() => {
          app.showNotification('บันทึกและซิงค์ข้อมูลสำเร็จ!', 'success');
        })
        .catch(() => {
          app.showNotification('บันทึกข้อมูลสำเร็จ (ซิงค์ภายหลัง)', 'warning');
        });
    } else {
      app.showNotification('บันทึกข้อมูลสำเร็จ!', 'success');
    }
    
    // Clear form
    document.getElementById('dataForm').reset();
    
    // Show success animation
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.classList.add('pulse');
    setTimeout(() => {
      submitButton.classList.remove('pulse');
    }, 2000);
    
  } catch (error) {
    console.error('Error saving data:', error);
    app.showNotification('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
  }
}

function loadAllData() {
  const displayDiv = document.getElementById('dataDisplay');
  if (!displayDiv) return;
  
  const allData = AppStorage.getAllData();
  
  if (allData && allData.length > 0) {
    displayDiv.innerHTML = `
      <div class="data-display">
        <h4>ข้อมูลที่บันทึก (${allData.length} รายการ)</h4>
        <div class="grid-2" style="margin-bottom: 15px;">
          <button class="btn btn-small" onclick="exportDataToFile()">ส่งออกข้อมูล</button>
          <button class="btn btn-small btn-outline" onclick="showDataStats()">สถิติข้อมูล</button>
        </div>
        ${allData.map(item => `
          <div class="data-item">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
              <strong style="color: var(--primary-color);">${item.name}</strong>
              <div>
                <button class="btn btn-small" onclick="editData('${item.id}')" style="margin: 0 5px; padding: 5px 10px;">แก้ไข</button>
                <button class="btn btn-small" onclick="deleteData('${item.id}')" style="background: #f44336; padding: 5px 10px;">ลบ</button>
              </div>
            </div>
            <div><strong>อีเมล:</strong> ${item.email}</div>
            ${item.phone ? `<div><strong>เบอร์โทร:</strong> ${item.phone}</div>` : ''}
            <div><strong>หมวดหมู่:</strong> ${getCategoryLabel(item.category)}</div>
            ${item.note ? `<div><strong>หมายเหตุ:</strong> ${item.note}</div>` : ''}
            <div style="font-size: 0.875rem; color: var(--text-light); margin-top: 8px;">
              <strong>บันทึกเมื่อ:</strong> ${new Date(item.timestamp).toLocaleString('th-TH')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    displayDiv.innerHTML = `
      <div class="status error">ไม่พบข้อมูลที่บันทึก</div>
    `;
  }
}

function getCategoryLabel(category) {
  const labels = {
    personal: 'ส่วนตัว',
    work: 'งาน',
    business: 'ธุรกิจ',
    other: 'อื่นๆ'
  };
  return labels[category] || category;
}

function editData(id) {
  window.location.href = `?page=data&edit=${id}`;
}

function loadDataForEdit(id) {
  const data = AppStorage.loadData(id);
  if (data) {
    document.getElementById('nameInput').value = data.name || '';
    document.getElementById('emailInput').value = data.email || '';
    document.getElementById('phoneInput').value = data.phone || '';
    document.getElementById('categoryInput').value = data.category || 'personal';
    document.getElementById('noteInput').value = data.note || '';
    
    // Update form title
    const title = document.querySelector('#content h3');
    if (title) {
      title.textContent = '📊 แก้ไขข้อมูล';
    }
    
    // Update submit button
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = 'อัปเดตข้อมูล';
    }
  }
}

function deleteData(id) {
  if (confirm('ต้องการลบข้อมูลนี้หรือไม่?')) {
    AppStorage.deleteData(id);
    app.updateStats();
    app.showNotification('ลบข้อมูลสำเร็จ', 'success');
    loadAllData(); // Refresh the display
  }
}

function exportDataToFile() {
  const allData = AppStorage.getAllData();
  const csv = convertToCSV(allData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `data-export-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  
  app.showNotification('ส่งออกข้อมูลเป็น CSV สำเร็จ', 'success');
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = ['ชื่อ', 'อีเมล', 'เบอร์โทร', 'หมวดหมู่', 'หมายเหตุ', 'วันที่บันทึก'];
  const rows = data.map(item => [
    item.name || '',
    item.email || '',
    item.phone || '',
    getCategoryLabel(item.category) || '',
    item.note || '',
    new Date(item.timestamp).toLocaleString('th-TH')
  ]);
  
  return [headers, ...rows].map(row => 
    row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

function showDataStats() {
  const allData = AppStorage.getAllData();
  const stats = calculateDataStats(allData);
  
  const displayDiv = document.getElementById('dataDisplay');
  if (displayDiv) {
    displayDiv.innerHTML = `
      <div class="data-display">
        <h4>📈 สถิติข้อมูล</h4>
        <div class="grid-2">
          <div class="stat-item">
            <div class="stat-number">${stats.total}</div>
            <div class="stat-label">รายการทั้งหมด</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.categories.personal || 0}</div>
            <div class="stat-label">ส่วนตัว</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.categories.work || 0}</div>
            <div class="stat-label">งาน</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">${stats.categories.business || 0}</div>
            <div class="stat-label">ธุรกิจ</div>
          </div>
        </div>
        <div class="data-item">
          <strong>รายการล่าสุด:</strong> ${stats.latest ? stats.latest.name : 'ไม่มี'}<br>
          <strong>วันที่เพิ่มล่าสุด:</strong> ${stats.latestDate || 'ไม่มี'}
        </div>
        <button class="btn" onclick="loadAllData()">กลับดูข้อมูลทั้งหมด</button>
      </div>
    `;
  }
}

function calculateDataStats(data) {
  if (!data || data.length === 0) {
    return { total: 0, categories: {}, latest: null, latestDate: null };
  }
  
  const categories = {};
  let latest = null;
  
  data.forEach(item => {
    // Count categories
    categories[item.category] = (categories[item.category] || 0) + 1;
    
    // Find latest
    if (!latest || new Date(item.timestamp) > new Date(latest.timestamp)) {
      latest = item;
    }
  });
  
  return {
    total: data.length,
    categories,
    latest,
    latestDate: latest ? new Date(latest.timestamp).toLocaleDateString('th-TH') : null
  };
}

// Calculator Features
function showCalculator() {
  const content = document.getElementById('content');
  if (!content) return;
  
  content.innerHTML = `
    <h3>🧮 เครื่องคิดเลข</h3>
    <div class="calc-display" id="calcDisplay">0</div>
    <div class="input-group">
      <label>ตัวเลขที่ 1:</label>
      <input type="number" id="num1" placeholder="กรอกตัวเลข" step="any">
    </div>
    <div class="input-group">
      <label>ตัวเลขที่ 2:</label>
      <input type="number" id="num2" placeholder="กรอกตัวเลข" step="any">
    </div>
    <div class="calc-buttons">
      <button class="btn" onclick="calculate('+')">บวก (+)</button>
      <button class="btn" onclick="calculate('-')">ลบ (-)</button>
      <button class="btn" onclick="calculate('*')">คูณ (×)</button>
      <button class="btn" onclick="calculate('/')">หาร (÷)</button>
      <button class="btn btn-secondary" onclick="calculate('^')">ยกกำลัง (^)</button>
      <button class="btn btn-secondary" onclick="calculate('%')">หารเอาเศษ (%)</button>
    </div>
    <div class="grid-3">
      <button class="btn btn-outline" onclick="calculateSquareRoot()">√ รากที่สอง</button>
      <button class="btn btn-outline" onclick="calculateFactorial()">n! แฟกทอเรียล</button>
      <button class="btn btn-outline" onclick="clearCalculator()">เคลียร์</button>
    </div>
    <div id="calcResult"></div>
    <div id="calcHistory"></div>
  `;
  
  // Load calculation history
  loadCalculationHistory();
}

function calculate(operation) {
  const num1 = parseFloat(document.getElementById('num1').value);
  const num2 = parseFloat(document.getElementById('num2').value);
  
  if (isNaN(num1) || isNaN(num2)) {
    document.getElementById('calcResult').innerHTML = `
      <div class="status error">กรุณากรอกตัวเลขที่ถูกต้อง</div>
    `;
    return;
  }
  
  let result;
  let symbol;
  let expression;
  
  try {
    switch(operation) {
      case '+':
        result = num1 + num2;
        symbol = '+';
        break;
      case '-':
        result = num1 - num2;
        symbol = '-';
        break;
      case '*':
        result = num1 * num2;
        symbol = '×';
        break;
      case '/':
        if (num2 === 0) {
          throw new Error('ไม่สามารถหารด้วย 0 ได้');
        }
        result = num1 / num2;
        symbol = '÷';
        break;
      case '^':
        result = Math.pow(num1, num2);
        symbol = '^';
        break;
      case '%':
        if (num2 === 0) {
          throw new Error('ไม่สามารถหารด้วย 0 ได้');
        }
        result = num1 % num2;
        symbol = '%';
        break;
      default:
        throw new Error('ตัวดำเนินการไม่ถูกต้อง');
    }
    
    expression = `${num1} ${symbol} ${num2}`;
    
    // Update display
    document.getElementById('calcDisplay').textContent = result;
    
    document.getElementById('calcResult').innerHTML = `
      <div class="data-display">
        <h4>ผลลัพธ์:</h4>
        <div class="data-item" style="font-size: 1.2em; text-align: center;">
          ${expression} = <strong style="color: var(--primary-color);">${formatNumber(result)}</strong>
        </div>
      </div>
    `;
    
    // Save to history
    saveCalculation(expression, result);
    loadCalculationHistory();
    
    // Update calculation count
    AppStorage.incrementCalculationCount();
    app.updateStats();
    
  } catch (error) {
    document.getElementById('calcResult').innerHTML = `
      <div class="status error">${error.message}</div>
    `;
  }
}

function calculateSquareRoot() {
  const num1 = parseFloat(document.getElementById('num1').value);
  
  if (isNaN(num1)) {
    document.getElementById('calcResult').innerHTML = `
      <div class="status error">กรุณากรอกตัวเลขที่ถูกต้อง</div>
    `;
    return;
  }
  
  if (num1 < 0) {
    document.getElementById('calcResult').innerHTML = `
      <div class="status error">ไม่สามารถหารากที่สองของจำนวนลบได้</div>
    `;
    return;
  }
  
  const result = Math.sqrt(num1);
  const expression = `√${num1}`;
  
  document.getElementById('calcDisplay').textContent = result;
  document.getElementById('calcResult').innerHTML = `
    <div class="data-display">
      <h4>ผลลัพธ์:</h4>
      <div class="data-item" style="font-size: 1.2em; text-align: center;">
        ${expression} = <strong style="color: var(--primary-color);">${formatNumber(result)}</strong>
      </div>
    </div>
  `;
  
  saveCalculation(expression, result);
  loadCalculationHistory();
  AppStorage.incrementCalculationCount();
  app.updateStats();
}

function calculateFactorial() {
  const num1 = parseInt(document.getElementById('num1').value);
  
  if (isNaN(num1) || num1 < 0 || num1 > 20) {
    document.getElementById('calcResult').innerHTML = `
      <div class="status error">กรุณากรอกจำนวนเต็มบวก 0-20</div>
    `;
    return;
  }
  
  const result = factorial(num1);
  const expression = `${num1}!`;
  
  document.getElementById('calcDisplay').textContent = result;
  document.getElementById('calcResult').innerHTML = `
    <div class="data-display">
      <h4>ผลลัพธ์:</h4>
      <div class="data-item" style="font-size: 1.2em; text-align: center;">
        ${expression} = <strong style="color: var(--primary-color);">${formatNumber(result)}</strong>
      </div>
    </div>
  `;
  
  saveCalculation(expression, result);
  loadCalculationHistory();
  AppStorage.incrementCalculationCount();
  app.updateStats();
}

function factorial(n) {
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

function clearCalculator() {
  document.getElementById('num1').value = '';
  document.getElementById('num2').value = '';
  document.getElementById('calcDisplay').textContent = '0';
  document.getElementById('calcResult').innerHTML = '';
}

function formatNumber(num) {
  if (Number.isInteger(num)) {
    return num.toLocaleString('th-TH');
  } else {
    return num.toLocaleString('th-TH', { maximumFractionDigits: 6 });
  }
}

function saveCalculation(expression, result) {
  const calculation = {
    id: Date.now().toString(),
    expression,
    result,
    timestamp: new Date().toISOString()
  };
  
  AppStorage.saveCalculation(calculation);
}

function loadCalculationHistory() {
  const history = AppStorage.getCalculationHistory();
  const historyDiv = document.getElementById('calcHistory');
  
  if (historyDiv && history && history.length > 0) {
    const recentHistory = history.slice(-5).reverse(); // Show last 5
    
    historyDiv.innerHTML = `
      <div class="data-display">
        <h4>ประวัติการคำนวณ</h4>
        ${recentHistory.map(calc => `
          <div class="data-item" style="font-size: 0.9em;">
            ${calc.expression} = ${formatNumber(calc.result)}
            <div style="font-size: 0.8em; color: var(--text-light);">
              ${new Date(calc.timestamp).toLocaleTimeString('th-TH')}
            </div>
          </div>
        `).join('')}
        ${history.length > 5 ? `
          <button class="btn btn-small" onclick="showFullCalculationHistory()">
            ดูประวัติทั้งหมด (${history.length} รายการ)
          </button>
        ` : ''}
        <button class="btn btn-small btn-outline" onclick="clearCalculationHistory()">
          ล้างประวัติ
        </button>
      </div>
    `;
  }
}

function showFullCalculationHistory() {
  const history = AppStorage.getCalculationHistory();
  const content = document.getElementById('content');
  
  if (content && history) {
    content.innerHTML = `
      <h3>📊 ประวัติการคำนวณทั้งหมด</h3>
      <div class="data-display">
        <div style="margin-bottom: 15px;">
          <button class="btn btn-secondary" onclick="showCalculator()">กลับเครื่องคิดเลข</button>
          <button class="btn btn-outline" onclick="exportCalculationHistory()">ส่งออกประวัติ</button>
        </div>
        ${history.reverse().map(calc => `
          <div class="data-item">
            <div style="font-size: 1.1em; margin-bottom: 5px;">
              ${calc.expression} = <strong>${formatNumber(calc.result)}</strong>
            </div>
            <div style="font-size: 0.875rem; color: var(--text-light);">
              ${new Date(calc.timestamp).toLocaleString('th-TH')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function exportCalculationHistory() {
  const history = AppStorage.getCalculationHistory();
  const csv = history.map(calc => 
    `"${calc.expression}","${calc.result}","${new Date(calc.timestamp).toLocaleString('th-TH')}"`
  ).join('\n');
  
  const csvContent = `"นิพจน์","ผลลัพธ์","วันที่เวลา"\n${csv}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `calculation-history-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  
  app.showNotification('ส่งออกประวัติการคำนวณสำเร็จ', 'success');
}

function clearCalculationHistory() {
  if (confirm('ต้องการล้างประวัติการคำนวณทั้งหมดหรือไม่?')) {
    AppStorage.clearCalculationHistory();
    app.showNotification('ล้างประวัติการคำนวณแล้ว', 'success');
    loadCalculationHistory();
  }
}
