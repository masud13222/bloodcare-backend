const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = null;

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@bloodcare.com',
  phone: '01712345678',
  password: 'TestPass123',
  confirmPassword: 'TestPass123',
  dateOfBirth: '1995-01-15',
  gender: 'male',
  bloodGroup: 'A+',
  location: {
    district: 'Dhaka',
    address: 'Test Address, Dhaka'
  },
  isDonor: true,
  weight: 70
};

const testBloodRequest = {
  title: 'Urgent A+ Blood Needed for Surgery',
  patientName: 'Patient Test',
  patientAge: 45,
  patientGender: 'male',
  bloodGroup: 'A+',
  unitsNeeded: 2,
  urgencyLevel: 'high',
  hospitalName: 'Test Hospital',
  location: {
    district: 'Dhaka',
    address: 'Test Hospital Address, Dhaka'
  },
  contactPerson: {
    name: 'Contact Person',
    phone: '01787654321',
    relationship: 'family'
  },
  neededBy: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
};

// Helper function to make authenticated requests
const authRequest = (method, url, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${url}`,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
  };
  
  if (data) {
    config.data = data;
    config.headers['Content-Type'] = 'application/json';
  }
  
  return axios(config);
};

// Test functions
const testHealthCheck = async () => {
  console.log('\n🩺 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
};

const testUserRegistration = async () => {
  console.log('\n👤 Testing User Registration...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ User registration successful');
    console.log('   User ID:', response.data.data.user._id);
    authToken = response.data.data.accessToken;
    console.log('   Token received and stored');
    return true;
  } catch (error) {
    console.log('❌ User registration failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testUserLogin = async () => {
  console.log('\n🔐 Testing User Login...');
  try {
    const response = await authRequest('post', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ User login successful');
    authToken = response.data.data.accessToken;
    console.log('   New token received and stored');
    return true;
  } catch (error) {
    console.log('❌ User login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testUserProfile = async () => {
  console.log('\n👤 Testing Get User Profile...');
  try {
    const response = await authRequest('get', '/user/profile');
    console.log('✅ Profile retrieved successfully');
    console.log('   Name:', response.data.data.name);
    console.log('   Email:', response.data.data.email);
    console.log('   Blood Group:', response.data.data.bloodGroup);
    return true;
  } catch (error) {
    console.log('❌ Profile retrieval failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testBloodRequestCreation = async () => {
  console.log('\n🩸 Testing Blood Request Creation...');
  try {
    const response = await authRequest('post', '/requests/create', testBloodRequest);
    console.log('✅ Blood request creation successful');
    console.log('   Request ID would be:', 'pending implementation');
    return true;
  } catch (error) {
    console.log('❌ Blood request creation failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testGetBloodRequests = async () => {
  console.log('\n📋 Testing Get Blood Requests...');
  try {
    const response = await authRequest('get', '/requests?page=1&limit=10');
    console.log('✅ Blood requests retrieved successfully');
    console.log('   Response:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Get blood requests failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testDonorSearch = async () => {
  console.log('\n🔍 Testing Donor Search...');
  try {
    const response = await authRequest('get', '/donors/search?bloodGroup=A%2B&district=Dhaka');
    console.log('✅ Donor search successful');
    console.log('   Response:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Donor search failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testConfigEndpoints = async () => {
  console.log('\n⚙️ Testing Configuration Endpoints...');
  try {
    // Test blood types
    const bloodTypesResponse = await axios.get(`${BASE_URL}/config/blood-types`);
    console.log('✅ Blood types retrieved:', bloodTypesResponse.data.data.length, 'types');
    
    // Test districts
    const districtsResponse = await axios.get(`${BASE_URL}/locations/districts`);
    console.log('✅ Districts retrieved:', districtsResponse.data.data.length, 'districts');
    
    // Test urgency levels
    const urgencyResponse = await axios.get(`${BASE_URL}/config/urgency-levels`);
    console.log('✅ Urgency levels retrieved:', urgencyResponse.data.data.length, 'levels');
    
    return true;
  } catch (error) {
    console.log('❌ Configuration endpoints failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testNotifications = async () => {
  console.log('\n🔔 Testing Notifications...');
  try {
    const response = await authRequest('get', '/notifications');
    console.log('✅ Notifications retrieved successfully');
    console.log('   Response:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Notifications test failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testLogout = async () => {
  console.log('\n🚪 Testing User Logout...');
  try {
    const response = await authRequest('post', '/auth/logout', {});
    console.log('✅ User logout successful');
    authToken = null;
    return true;
  } catch (error) {
    console.log('❌ User logout failed:', error.response?.data?.message || error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🧪 BloodCare API Test Suite');
  console.log('============================');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'User Profile', fn: testUserProfile },
    { name: 'Blood Request Creation', fn: testBloodRequestCreation },
    { name: 'Get Blood Requests', fn: testGetBloodRequests },
    { name: 'Donor Search', fn: testDonorSearch },
    { name: 'Configuration Endpoints', fn: testConfigEndpoints },
    { name: 'Notifications', fn: testNotifications },
    { name: 'User Logout', fn: testLogout }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! BloodCare API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the API implementation.');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test suite failed to run:', error.message);
    process.exit(1);
  });
}

module.exports = { runTests };