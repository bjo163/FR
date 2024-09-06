import Odoo from 'odoo-await';

// Odoo Configuration
const odooConfig = {
    baseUrl: "http://zenix.id",
    port: 4753,
    db: 'QSS_DEV',
    username: 'virtuoso', // Replace with your Odoo username
    password: 'virtuoso'  // Replace with your Odoo password
};

// Initialize Odoo client
const odoo = new Odoo(odooConfig);

// Function to perform CRUD operations on Odoo records
export const odoo_crud_operations = async (params) => {
    const { operation, model, record_id, data, fields, domain, opts} = params;
    console.log('Parameters:', params);
    try {
        // Connect to Odoo and get the UID
        await odoo.connect();

        switch (operation) {
            case 'create':
                return await odoo.create(model, data);

            case 'read':
                if (!record_id) {
                    throw new Error('Record ID is required for read operation');
                }
                return await odoo.read(model, record_id, fields);

            case 'search_read':
                // Ensure domain is defined and is an object
                const searchDomain = domain || {}; // Ensure domain is an object
                const searchOpts = {
                    ...opts,
                    context: opts?.context || {} // Ensure context is an object
                };
                return await odoo.searchRead(model, searchDomain, fields, searchOpts);

            case 'update':
                if (!record_id) {
                    throw new Error('Record ID is required for update operation');
                }
                return await odoo.update(model, record_id, data);

            case 'delete':
                if (!record_id) {
                    throw new Error('Record ID is required for delete operation');
                }   
                return await odoo.delete(model, record_id);

            case 'get_fields':
                // if (!attributes) {
                //     throw new Error('Attributes are required for get_fields operation');
                // }
                return await odoo.getFields(model);

            default:
                throw new Error('Invalid operation');
        }
    } catch (error) {
        console.error('Error in CRUD operation:', error);
        return { error: error.message };
    }
};

// Function declaration for AI
export const odooCrudFunctionDeclaration = {
    name: "odoo_crud_operations",
    description: "Perform CRUD operations on Odoo records. Examples include:\n\n" +
                 "1. **Create**: Add a new record to the model.\n" +
                 "   ```javascript\n" +
                 "   const newRecord = await odoo_crud_operations({\n" +
                 "       operation: 'create',\n" +
                 "       model: 'res.partner',\n" +
                 "       data: {\n" +
                 "           name: 'John Doe',\n" +
                 "           email: 'john.doe@example.com',\n" +
                 "           phone: '123456789'\n" +
                 "       }\n" +
                 "   });\n" +
                 "   console.log('Create Result:', newRecord);\n" +
                 "   ```\n\n" +
                 "2. **Read**: Fetch data for specified record IDs and fields.\n" +
                 "   ```javascript\n" +
                 "   const readRecord = await odoo_crud_operations({\n" +
                 "       operation: 'read',\n" +
                 "       model: 'res.partner',\n" +
                 "       record_id: [1, 2],\n" +
                 "       fields: ['name', 'email']\n" +
                 "   });\n" +
                 "   console.log('Read Result:', readRecord);\n" +
                 "   ```\n\n" +
                 "3. **Search-Read**: Search for records based on domain and read specific fields.\n" +
                 "   ```javascript\n" +
                 "   const searchReadRecords = await odoo_crud_operations({\n" +
                 "       operation: 'search_read',\n" +
                 "       model: 'res.partner',\n" +
                 "       domain: { country_id: 'United States' },\n" +
                 "       fields: ['name', 'city'],\n" +
                 "       opts: {\n" +
                 "           limit: 5,\n" +
                 "           offset: 10,\n" +
                 "           order: 'name desc',\n" +
                 "           context: { lang: 'en_US' }\n" +
                 "       }\n" +
                 "   });\n" +
                 "   console.log('Search Read Result:', searchReadRecords);\n" +
                 "   ```\n\n" +
                 "4. **Update**: Update an existing record.\n" +
                 "   ```javascript\n" +
                 "   const updatedRecord = await odoo_crud_operations({\n" +
                 "       operation: 'update',\n" +
                 "       model: 'res.partner',\n" +
                 "       record_id: 1,\n" +
                 "       data: {\n" +
                 "           phone: '987654321'\n" +
                 "       }\n" +
                 "   });\n" +
                 "   console.log('Update Result:', updatedRecord);\n" +
                 "   ```\n\n" +
                 "5. **Delete**: Delete a record based on its ID.\n" +
                 "   ```javascript\n" +
                 "   const deletedRecord = await odoo_crud_operations({\n" +
                 "       operation: 'delete',\n" +
                 "       model: 'res.partner',\n" +
                 "       record_id: 1\n" +
                 "   });\n" +
                 "   console.log('Delete Result:', deletedRecord);\n" +
                 "   ```\n\n" +
                 "6. **Get Fields**: Retrieve detailed information about the fields of a model, including attributes like required status.\n" +
                 "   ```javascript\n" +
                 "   const fields = await odoo_crud_operations({\n" +
                 "       operation: 'get_fields',\n" +
                 "       model: 'res.partner',\n" +
                 "       attributes: ['required']\n" +
                 "   });\n" +
                 "   console.log('Get Fields Result:', fields);\n" +
                 "   ```",
    parameters: {
        type: "OBJECT",
        description: "Perform Create, Read, Update, Delete, Search-Read, or Get Fields operations on Odoo records.",
        properties: {
            operation: {
                type: "STRING",
                description: "The type of CRUD operation to perform. Can be 'create', 'read', 'search_read', 'update', 'delete', or 'get_fields'."
            },
            model: {
                type: "STRING",
                description: "The Odoo model to operate on (e.g., 'res.partner')."
            },
            record_id: {
                type: "ARRAY",
                description: "The ID(s) of the record to operate on. Required for 'read', 'update', and 'delete' operations.",
                items: {
                    type: "INTEGER",
                    description: "Record ID"
                }
            },
            data: {
                type: "OBJECT",
                description: "The data to use for 'create' or 'update' operations. Must be a key-value object where keys are field names and values are the field values.",
                properties: {
                    name: { type: "STRING", description: "Name field" },
                    email: { type: "STRING", description: "Email field" },
                    phone: { type: "STRING", description: "Phone number field" },
                    // Add other fields as required
                }
            },
            fields: {
                type: "ARRAY",
                description: "The fields to return for 'read' or 'search_read' operations.",
                items: {
                    type: "STRING",
                    description: "Field names to include in the response."
                }
            },
            domain: {
                type: "OBJECT",
                description: "The search domain for 'search_read' operations. Used to filter records based on specified criteria.",
                properties: {
                    country_id: { type: "STRING", description: "Filter records by country ID" },
                    // Add other domain filters as required
                }
            },
            // opts: {
            //     type: "OBJECT",
            //       description: "Options for 'search_read' operations, such as limit, offset, order, and context.",
            //     properties: {
            //         limit: { type: "INTEGER", description: "Number of records to return." },
            //         offset: { type: "INTEGER", description: "Number of records to skip before starting to return." },
            //         order: { type: "STRING", description: "Order of the records, e.g., 'name desc'." },
            //         context: { 
            //             type: "OBJECT", 
            //             description: "Context to use for the search. Must be an object.", 
            //             properties: {
            //                 lang: { type: "STRING", description: "Language code, e.g., 'en_US'." }
            //             }
            //         }
            //     },
            //     required: []
            // },
            attributes: {
                type: "ARRAY",
                description: "The attributes of fields to retrieve for 'get_fields' operation.",
                items: {
                    type: "STRING",
                    description: "Field attributes to include in the response."
                }
            }
        },
        required: ["operation", "model"]
    }
};
