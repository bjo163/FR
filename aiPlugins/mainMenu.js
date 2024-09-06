// plugins/mainMenu.js

// Function to generate the main menu message
export const showMainMenu = () => {
    return `
      1. Option 1: Description of option 1
      2. Option 2: Description of option 2
      3. Option 3: Description of option 3
      4. Exit: Exit the application
    `;
  };
  
  // Function declaration for AI
  export const showMainMenuFunctionDeclaration = {
    name: "menu",
    description: "Show main menu",
    parameters: {
      type: "STRING",
      description: "Displays the main menu",
      properties: {}
    }
  };
  