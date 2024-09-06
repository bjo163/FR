import React, { useState, useEffect } from 'react';
import axios from 'axios';

const baseURL = 'http://localhost:3000';

function User() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('No token found');
        return;
      }

      try {
        const userId = 1; // Replace with actual user ID as needed
        const response = await axios.get(`${baseURL}/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setUser(response.data);
      } catch (error) {
        setMessage(`Get User Error: ${error.response ? error.response.data : error.message}`);
      }
    };

    fetchUser();
  }, []);

  return (
    <div>
      <h2>User Details</h2>
      {message && <p>{message}</p>}
      {user && (
        <div>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Role:</strong> {user.role}</p>
          {/* Add other user details here */}
        </div>
      )}
    </div>
  );
}

export default User;
