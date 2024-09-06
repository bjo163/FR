// plugins/createPSB.js
import axios from 'axios';

// Function to create a new PSB entry using the subscription_psb API
export const createPSB = async (params) => {
    console.log('Creating new PSB with data:', params);

    // Hardcoding the company_registry value
    const companyRegistry = "bast";
    
    // Preparing the data to be sent in the API call, including the hardcoded company_registry
    const requestData = {
        name: params.name,                    // Name of the customer
        address: params.address,              // Address of the customer
        phone: params.phone,           // Phone number of the customer
        email: params.email,                  // Email address of the customer
        customer_id: params.customer_id,      // Customer ID
        package: params.package,              // Package type (e.g., 15 Mbps)
        company_registry: companyRegistry     // Hardcoded company registry
    };

    try {
        // Replace 'your-api-url' with the actual URL for the subscription_psb API
        const apiUrl = 'https://hq.bast.my.id:3002/api/subscriber/psb';
        
        // Making the API call
        const response = await axios.post(apiUrl, requestData);

        // Log the actual API response
        console.log('PSB Creation API Response:', response.data);

        // Return the response from the API
        return response.data;
    } catch (error) {
        // Handle and log any errors
        console.error('Error creating PSB:', error.response ? error.response.data : error.message);
        
        // You might want to throw an error or return a custom error response
        throw new Error('Error creating PSB');
    }
};

// Function declaration for AI
export const createPSBFunctionDeclaration = {
    name: "create_psb",
    description: "Create a new PSB (Pemasangan Baru) entry with the provided details",
    parameters: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "Name of the customer"
            },
            address: {
                type: "string",
                description: "Address of the customer"
            },
            phone: {
                type: "string",
                description: "Phone number of the customer"
            },
            email: {
                type: "string",
                description: "Email address of the customer"
            },
            customer_id: {
                type: "string",
                description: "Customer ID"
            },
            package: {
                type: "string",
                description: "Package type (e.g., 15 Mbps)"
            },
            company_registry: {
                type: "string",
                description: "Company registry code (hardcoded as 'bast')"
            }
        },
        required: ["name", "address", "phone", "email", "customer_id", "package"]
    }
};
