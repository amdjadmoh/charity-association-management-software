// Test script to verify notes field functionality
const axios = require('axios');

const API_URL = 'http://localhost:3000';

const testSupplyRequest = {
  type: 'mixed',
  source: 'Test Source',
  notes: 'Test Notes',
  requestDate: new Date().toISOString().split('T')[0],
  products: [
    {
      productId: 1, // Make sure this ID exists in your database
      quantity: 5,
      notes: 'Product Test Notes'
    }
  ],
  materials: [
    {
      materialId: 1, // Make sure this ID exists in your database
      quantity: 3,
      notes: 'Material Test Notes'
    }
  ]
};

async function testCreateRequest() {
  try {
    console.log('Creating a new supply request with notes...');
    const response = await axios.post(`${API_URL}/api/supply-requests`, testSupplyRequest);
    console.log('Created request:', JSON.stringify(response.data, null, 2));
    
    // Verify the created request has notes
    const requestId = response.data.data.supplyRequest.id;
    console.log(`Fetching request with ID ${requestId}...`);
    const getResponse = await axios.get(`${API_URL}/api/supply-requests/${requestId}`);
    console.log('Fetched request:', JSON.stringify(getResponse.data, null, 2));
    
    return requestId;
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

// Run the test
testCreateRequest();