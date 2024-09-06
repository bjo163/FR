import axios from 'axios';
import crypto from 'crypto';

const baseURL = 'http://localhost:3000';

async function testRegister() {
  const username = `user_${crypto.randomUUID()}`;
  console.log('Testing Registration with username:', username);

  try {
    const response = await axios.post(`${baseURL}/register`, {
      username: username,
      password: 'testpassword',
      role: 'user'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Register Response:', response.data);

    if (response.data && response.data.data && response.data.data.id) {
      return {
        username: username,
        userId: response.data.data.id
      };
    } else {
      console.log('Registration failed or userId not received.');
      return {
        username: null,
        userId: null
      };
    }
  } catch (error) {
    console.error('Registration Error:', error.response ? error.response.data : error.message);
    return {
      username: null,
      userId: null
    };
  }
}

async function testLogin(username, password = 'testpassword') {
    console.log('Testing Login with username:', username);
  
    try {
      const response = await axios.post(`${baseURL}/login`, {
        username: username,
        password: password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
  
      console.log('Login Response:', response.data);
  
      // Ensure that the response structure is correctly handled
      if (response.data && response.data.data && response.data.data.token) {
        return response.data.data.token;
      } else {
        console.log('Login failed or token not received.');
        return null;
      }
    } catch (error) {
      console.error('Login Error:', error.response ? error.response.data : error.message);
      return null;
    }
  }
  

  async function testGetUser(userId, token) {
    console.log('Testing Get User with ID:', userId);
  
    try {
      const response = await axios.get(`${baseURL}/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      console.log('Get User Response:', response.data);
    } catch (error) {
      console.error('Get User Error:', error.response ? error.response.data : error.message);
    }
  }
  

async function testGetUserWithFakeToken(userId) {
  const fakeToken = 'fakeToken';
  console.log('Testing Get User with Fake Token');

  try {
    const response = await axios.get(`${baseURL}/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${fakeToken}` }
    });

    console.log('Get User Response with Fake Token:', response.data);
  } catch (error) {
    console.error('Get User Error with Fake Token:', error.response ? error.response.data : error.message);
  }
}

async function testUpdateUser(userId, token) {
  console.log('Testing Update User with ID:', userId);

  try {
    const response = await axios.put(`${baseURL}/users/${userId}`, {
      username: 'updatedusername',
      password: 'newpassword',
      role: 'admin'
    }, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    console.log('Update User Response:', response.data);
  } catch (error) {
    console.error('Update User Error:', error.response ? error.response.data : error.message);
  }
}

async function testUpdateUserWithInvalidPassword(userId, token) {
  console.log('Testing Update User with Invalid Password');

  try {
    const response = await axios.put(`${baseURL}/users/${userId}`, {
      username: 'invalidupdateusername',
      password: 'wrongpassword',
      role: 'admin'
    }, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    console.log('Update User Response with Invalid Password:', response.data);
  } catch (error) {
    console.error('Update User Error with Invalid Password:', error.response ? error.response.data : error.message);
  }
}

async function testDeleteUser(userId, token) {
  console.log('Testing Delete User with ID:', userId);

  try {
    const response = await axios.delete(`${baseURL}/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Delete User Response:', response.status);
  } catch (error) {
    console.error('Delete User Error:', error.response ? error.response.data : error.message);
  }
}

(async () => {
  // Test Registration
  const { username, userId } = await testRegister();
  
  if (userId) {
    // Test Login
    const token = await testLogin(username);
    
    if (token) {
      // Test Get User
      await testGetUser(userId, token);
      
      // Test Get User with Fake Token
      await testGetUserWithFakeToken(userId);
      
      // Test Update User
      await testUpdateUser(userId, token);
      
      // Test Update User with Invalid Password
      await testUpdateUserWithInvalidPassword(userId, token);
      
      // Test Delete User
      await testDeleteUser(userId, token);
    }
  }
})();
