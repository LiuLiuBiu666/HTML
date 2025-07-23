// Google Sheets Service for Backend
// Tự động sync data từ database lên Google Sheets

const { google } = require('googleapis');

class GoogleSheetsService {
    constructor() {
        this.sheets = null;
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || null;
        this.sheetName = process.env.GOOGLE_SHEET_NAME || 'Registrations';
        this.initialized = false;
        
        // Initialize on creation
        this.initialize();
    }

    async initialize() {
        try {
            // Check if credentials are available
            if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
                console.log('⚠️ Google Sheets: No service account key found');
                return;
            }

            if (!this.spreadsheetId) {
                console.log('⚠️ Google Sheets: No spreadsheet ID found');
                return;
            }

            // Parse service account key
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            
            // Create JWT auth
            const auth = new google.auth.JWT(
                credentials.client_email,
                null,
                credentials.private_key,
                ['https://www.googleapis.com/auth/spreadsheets']
            );

            await auth.authorize();
            
            // Initialize sheets API
            this.sheets = google.sheets({ version: 'v4', auth });
            this.initialized = true;
            
            console.log('✅ Google Sheets service initialized');
            
            // Auto-detect sheet name
            await this.detectSheetName();
            
            // Create headers if sheet is empty
            await this.ensureHeaders();
            
        } catch (error) {
            console.error('❌ Google Sheets initialization error:', error.message);
            this.initialized = false;
        }
    }

    async detectSheetName() {
        if (!this.initialized) return;

        try {
            // Get spreadsheet metadata to find sheet names
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            const sheets = response.data.sheets;
            if (sheets && sheets.length > 0) {
                // Try to find sheet names in priority order
                const preferredNames = ['Registrations', 'Data_Luxshare', 'Sheet1', 'Trang tính1'];
                
                for (const preferredName of preferredNames) {
                    const foundSheet = sheets.find(sheet => 
                        sheet.properties.title.toLowerCase() === preferredName.toLowerCase()
                    );
                    if (foundSheet) {
                        this.sheetName = foundSheet.properties.title;
                        console.log(`✅ Using sheet: "${this.sheetName}"`);
                        return;
                    }
                }

                // If no preferred name found, use the first sheet
                this.sheetName = sheets[0].properties.title;
                console.log(`✅ Using first sheet: "${this.sheetName}"`);
            }
        } catch (error) {
            console.error('❌ Error detecting sheet name:', error.message);
            console.log(`📋 Using default sheet name: "${this.sheetName}"`);
        }
    }

    async ensureHeaders() {
        if (!this.initialized) return;

        try {
            // Check if headers exist
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A1:K1`,
            });

            // If no data or first row is empty, add headers
            if (!response.data.values || response.data.values.length === 0 || !response.data.values[0][0]) {
                await this.createHeaders();
            }
        } catch (error) {
            console.error('❌ Error checking headers:', error.message);
        }
    }

    async createHeaders() {
        if (!this.initialized) return;

        const headers = [
            'ID',
            'Thời gian đăng ký',
            'Họ và Tên',
            'Số điện thoại',
            'Số CCCD',
            'Giới tính',
            'Ngày sinh',
            'Địa chỉ thường trú',
            'Nhà máy ứng tuyển',
            'Ngày cấp CCCD',
            'Ngày hết hạn CCCD'
        ];

        try {
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A1:K1`,
                valueInputOption: 'RAW',
                resource: {
                    values: [headers]
                }
            });

            console.log('✅ Google Sheets headers created');
        } catch (error) {
            console.error('❌ Error creating headers:', error.message);
        }
    }

    async addRegistration(registrationData) {
        if (!this.initialized) {
            console.log('⚠️ Google Sheets not initialized, skipping sync');
            return { success: false, message: 'Not initialized' };
        }

        try {
            // Format data for Google Sheets
            const rowData = [
                registrationData.id || '',
                registrationData.created_at || new Date().toLocaleString('vi-VN'),
                registrationData.full_name || '',
                registrationData.phone || '',
                registrationData.cccd || '',
                registrationData.gender || '',
                registrationData.birth_date || '',
                registrationData.address || '',
                registrationData.factory || '',
                registrationData.cccd_issue_date || '',
                registrationData.cccd_expiry_date || ''
            ];

            // Append to sheet
            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A:K`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [rowData]
                }
            });

            console.log(`✅ Registration synced to Google Sheets: ${registrationData.full_name}`);
            return { 
                success: true, 
                data: response.data,
                message: 'Synced successfully'
            };

        } catch (error) {
            console.error('❌ Error syncing to Google Sheets:', error.message);
            return { 
                success: false, 
                error: error.message,
                message: 'Sync failed'
            };
        }
    }

    async getRegistrations() {
        if (!this.initialized) {
            return { success: false, message: 'Not initialized' };
        }

        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A:K`,
            });

            if (!response.data.values || response.data.values.length === 0) {
                return { success: true, data: [] };
            }

            // Skip header row and format data
            const [headers, ...rows] = response.data.values;
            const registrations = rows.map(row => ({
                id: row[0] || '',
                created_at: row[1] || '',
                full_name: row[2] || '',
                phone: row[3] || '',
                cccd: row[4] || '',
                gender: row[5] || '',
                birth_date: row[6] || '',
                address: row[7] || '',
                factory: row[8] || '',
                cccd_issue_date: row[9] || '',
                cccd_expiry_date: row[10] || ''
            }));

            return { 
                success: true, 
                data: registrations,
                count: registrations.length
            };

        } catch (error) {
            console.error('❌ Error reading from Google Sheets:', error.message);
            return { 
                success: false, 
                error: error.message
            };
        }
    }

    // Bulk sync - sync multiple registrations at once
    async bulkSync(registrations) {
        if (!this.initialized || !registrations || registrations.length === 0) {
            return { success: false, message: 'Not initialized or no data' };
        }

        try {
            const rowsData = registrations.map(reg => [
                reg.id || '',
                reg.created_at || new Date().toLocaleString('vi-VN'),
                reg.full_name || '',
                reg.phone || '',
                reg.cccd || '',
                reg.gender || '',
                reg.birth_date || '',
                reg.address || '',
                reg.factory || '',
                reg.cccd_issue_date || '',
                reg.cccd_expiry_date || ''
            ]);

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A:K`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: rowsData
                }
            });

            console.log(`✅ Bulk sync completed: ${registrations.length} registrations`);
            return { 
                success: true, 
                data: response.data,
                count: registrations.length
            };

        } catch (error) {
            console.error('❌ Bulk sync error:', error.message);
            return { 
                success: false, 
                error: error.message
            };
        }
    }

    // Sync existing database data to Google Sheets
    async syncFromDatabase(getConnection) {
        if (!this.initialized) {
            console.log('⚠️ Google Sheets not initialized for database sync');
            return;
        }

        let connection;
        try {
            connection = await getConnection();
            
            // Get all registrations from database
            const [rows] = await connection.execute(
                'SELECT * FROM registrations ORDER BY created_at ASC'
            );

            if (rows.length === 0) {
                console.log('📭 No registrations to sync');
                return { success: true, message: 'No data to sync' };
            }

            // Clear existing sheet data (except headers)
            await this.clearSheetData();
            
            // Bulk sync all data
            const result = await this.bulkSync(rows);
            
            if (result.success) {
                console.log(`✅ Database sync completed: ${result.count} registrations synced`);
            }
            
            return result;

        } catch (error) {
            console.error('❌ Database sync error:', error.message);
            return { success: false, error: error.message };
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async clearSheetData() {
        if (!this.initialized) return;

        try {
            // Clear all data except headers (row 1)
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: `${this.sheetName}!A2:K`,
            });

            console.log('🗑️ Cleared existing sheet data');
        } catch (error) {
            console.error('❌ Error clearing sheet:', error.message);
        }
    }

    // Health check
    isReady() {
        return this.initialized;
    }

    getConfig() {
        return {
            initialized: this.initialized,
            spreadsheetId: this.spreadsheetId,
            sheetName: this.sheetName,
            hasCredentials: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY
        };
    }
}

// Create singleton instance
const googleSheetsService = new GoogleSheetsService();

module.exports = googleSheetsService;
