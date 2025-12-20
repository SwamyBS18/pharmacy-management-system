// Test API endpoint
import fetch from "node-fetch";

async function testAPI() {
  try {
    console.log("🔍 Testing API endpoint: http://localhost:5173/api/medicines");
    
    const response = await fetch("http://localhost:5173/api/medicines");
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API is working!`);
      console.log(`📊 Found ${data.data?.length || 0} medicines`);
      console.log(`📄 Total: ${data.pagination?.total || 0}`);
      
      if (data.data && data.data.length > 0) {
        console.log("\n📋 Sample medicine:");
        console.log(`   Name: ${data.data[0].medicine_name}`);
        console.log(`   Manufacturer: ${data.data[0].manufacturer || "N/A"}`);
      }
    } else {
      const error = await response.text();
      console.error(`❌ API Error: ${error}`);
    }
  } catch (error) {
    console.error("❌ Failed to connect to API:", error.message);
    console.error("\nMake sure:");
    console.error("1. Server is running: npm run dev");
    console.error("2. Server is accessible on port 5173");
  }
}

testAPI();


