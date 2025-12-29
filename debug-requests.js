require('dotenv').config();
const db = require('./config/db');

console.log('🔍 Checking money requests in database...');

// Check all requests
db.query("SELECT * FROM chat_requests ORDER BY created_at DESC LIMIT 10", (err, results) => {
  if (err) {
    console.error('❌ Error:', err);
    process.exit();
  }
  
  console.log('\n📋 Recent chat requests:');
  console.table(results);
  
  // Check pending count
  db.query("SELECT COUNT(*) as pendingCount FROM chat_requests WHERE status = 'pending'", (err, countResult) => {
    if (err) {
      console.error('❌ Count Error:', err);
    } else {
      console.log(`\n📊 Pending requests count: ${countResult[0].pendingCount}`);
    }
    
    process.exit();
  });
});