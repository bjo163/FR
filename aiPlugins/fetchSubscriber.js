// plugins/fetchSubscriber.js
import axios from 'axios';

// Function to fetch subscriber information using a customer ID
export const subscriber_information = async (params) => {
    console.log('Fetching subscriber information using CID:', params.customer_id);
    try {
        const response = await axios.get('https://hq.bast.my.id:3002/api/subscriber/get', {
            params: {
                cid: params.customer_id, // Use the provided customer_id
                code: 'bast'
            }
        });
        console.log('Subscriber API Response:', response);
        return response.data; // Return the data from the API
    } catch (error) {
        console.error('Error fetching subscriber information:', error);
        return { error: 'Failed to fetch subscriber information' };
    }
};

// Function declaration for AI
export const subscriber_informationFunctionDeclaration = {
    name: "fetch_subscriber_info",
    description: "Fetch subscriber information from the API using a customer ID",
    parameters: {
        type: "OBJECT",
        description: "Fetches subscriber information using CID and code.",
        properties: {
            customer_id: {
                type: "STRING",
                description: "The customer ID to fetch subscriber information."
            }
        }
    }
};
