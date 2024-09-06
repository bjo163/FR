// plugins/subscriberVerification.js 

import axios from "axios";

const API_ENDPOINT =
  "https://hq.bast.my.id:3002/api/subscriber/get?cid={customerId}&code=bast";

export async function verifyCustomerId(customerId) {
  try {
    const response = await axios.get(API_ENDPOINT.replace('{customerId}', customerId));
    
    if (response.data.status === 'success') {
      return response.data.data; 
    } else {
      throw new Error('Customer ID not found'); // Atau custom error message 
    }
  } catch (error) {
    console.error("Error verifying Customer ID:", error);
    throw error; // Propagate error to calling function
  }
} 