// Test Google Sheets Integration
require('dotenv').config();
const googleSheetsService = require('./src/services/googleSheetsService');

async function testGoogleSheets() {
    console.log('🧪 Testing Google Sheets Integration...\n');
    
    // Wait for service to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📊 Service Status:');
    console.log(googleSheetsService.getConfig());
    console.log('Ready:', googleSheetsService.isReady());
    
    if (!googleSheetsService.isReady()) {
        console.log('❌ Service not ready, check configuration');
        return;
    }
    
    // Test creating headers
    console.log('\n📝 Creating headers...');
    await googleSheetsService.ensureHeaders();
    
    // Test adding a registration
    console.log('\n➕ Adding test registration...');
    const testData = {
        id: 999,
        created_at: new Date().toLocaleString('vi-VN'),
        full_name: 'Nguyễn Văn Test',
        phone: '0123456789',
        cccd: '123456789012',
        gender: 'Nam',
        birth_date: '01/01/1990',
        address: 'Địa chỉ test',
        factory: 'Vân Trung',
        cccd_issue_date: '01/01/2020',
        cccd_expiry_date: '01/01/2030'
    };
    
    const result = await googleSheetsService.addRegistration(testData);
    console.log('Result:', result);
    
    // Test reading data
    console.log('\n📖 Reading data from Google Sheets...');
    const readResult = await googleSheetsService.getRegistrations();
    console.log('Read result:', readResult);
    
    console.log('\n✅ Test completed!');
}

testGoogleSheets().catch(console.error);
