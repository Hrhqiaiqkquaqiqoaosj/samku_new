const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Test charger IDs
const testChargers = [
  'CH-001',
  'CH-002', 
  'CH-003',
  'CH-004',
  'CH-005'
];

async function generateTestQRCodes() {
  console.log('🎯 Generating test QR codes for chargers...');
  
  // Create output directory
  const outputDir = path.join(__dirname, 'test-qr-codes');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  for (const chargerId of testChargers) {
    try {
      // Generate QR code as SVG
      const qrSvg = await QRCode.toString(chargerId, { 
        type: 'svg',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Save SVG file
      const svgPath = path.join(outputDir, `${chargerId}.svg`);
      fs.writeFileSync(svgPath, qrSvg);
      
      // Generate QR code as PNG
      const pngPath = path.join(outputDir, `${chargerId}.png`);
      await QRCode.toFile(pngPath, chargerId, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log(`✅ Generated QR codes for ${chargerId}`);
      
    } catch (error) {
      console.error(`❌ Error generating QR code for ${chargerId}:`, error);
    }
  }
  
  // Generate HTML file with all QR codes for easy viewing
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Charger QR Codes</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: #333;
        }
        .qr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .qr-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .qr-code {
            width: 200px;
            height: 200px;
            margin: 0 auto 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
        }
        .charger-id {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .instructions {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .instructions h3 {
            margin-top: 0;
            color: #1976d2;
        }
        .instructions ol {
            text-align: left;
            margin: 10px 0;
        }
        .instructions li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔌 Test Charger QR Codes</h1>
        <p>Use these QR codes to test the charging functionality</p>
    </div>
    
    <div class="instructions">
        <h3>📱 How to Test:</h3>
        <ol>
            <li>Open the user dashboard in your CMS application</li>
            <li>Click the "Start Charging" button</li>
            <li>Use the QR scanner to scan one of the codes below</li>
            <li>Or use "Manual Input" and enter one of the charger IDs</li>
            <li>The system will create a ₹1 test transaction</li>
            <li>The transaction will complete automatically after 30 seconds</li>
        </ol>
        <p><strong>Note:</strong> These are test charger IDs. Make sure you have corresponding chargers in your database.</p>
    </div>
    
    <div class="qr-grid">
        ${testChargers.map(chargerId => `
        <div class="qr-card">
            <div class="charger-id">${chargerId}</div>
            <img src="${chargerId}.png" alt="QR Code for ${chargerId}" class="qr-code">
            <p>Scan this QR code to start charging session</p>
        </div>
        `).join('')}
    </div>
    
    <div style="text-align: center; margin-top: 40px; color: #666;">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>For testing purposes only</p>
    </div>
</body>
</html>
  `;
  
  const htmlPath = path.join(outputDir, 'test-qr-codes.html');
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log('\n🎉 QR code generation completed!');
  console.log(`📁 Files saved to: ${outputDir}`);
  console.log(`🌐 Open ${htmlPath} in your browser to view all QR codes`);
  console.log('\n📋 Test Charger IDs:');
  testChargers.forEach(id => console.log(`   - ${id}`));
  
  console.log('\n💡 Instructions:');
  console.log('1. Make sure these charger IDs exist in your database');
  console.log('2. Use the QR scanner in the user dashboard to test');
  console.log('3. Each scan will create a ₹1 test transaction');
  console.log('4. Transactions complete automatically after 30 seconds');
}

// Run the generator
if (require.main === module) {
  generateTestQRCodes().catch(console.error);
}

module.exports = { generateTestQRCodes, testChargers }; 