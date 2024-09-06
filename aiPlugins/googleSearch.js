    import axios from 'axios';
    import * as cheerio from 'cheerio';

    // Google Custom Search API details
    // const API_KEY = 'AIzaSyD13SAHMv2dn6FrJffPpShBbERpBgoBX_w';
    // const CX = 'a16ac30de53264a0d';

    // Unified function to perform either a Google search or scrape a URL based on the operation type
    export const search_or_scrape = async (params) => {
        const { operation_type, query, url, selector } = params;
        console.log('Operation Type:', operation_type);

        try {
            if (operation_type === 'search') {
                // Perform Google search
                console.log('Performing Google search with query:', query);
                const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${server.config.GOOGLE_API_KEY}&cx=${server.config.GOOGLE_CX}&q=${encodeURIComponent(query)}`;

                const response = await axios.get(searchUrl);
                const results = response.data.items || [];

                // Extract relevant information from the results
                const formattedResults = results.map(item => ({
                    title: item.title,
                    link: item.link,
                    snippet: item.snippet,
                }));

                console.log('Google Search API Response:', formattedResults);
                return formattedResults; // Return the search results
            } else if (operation_type === 'scrape') {
                // Perform URL scraping
                console.log('Scraping URL:', url);
                const response = await axios.get(url);
                const $ = cheerio.load(response.data); // Load HTML into cheerio
                const results = [];

                // If a selector is provided, use it; otherwise, attempt to scrape common elements
                const elements = $(selector || 'article, div, section, li, ul, ol, main, header, footer, aside');

                elements.each((i, element) => {
                    // Common elements to scrape
                    const title = $(element).find('h1, h2, h3, h4, h5, h6').first().text().trim();
                    const description = $(element).find('p, span, blockquote').text().trim();
                    const link = $(element).find('a').attr('href');
                    const image = $(element).find('img').attr('src');
                    const video = $(element).find('video').attr('src');
                    const listItem = $(element).find('li').text().trim();

                    // Additional logic to combine data from various sources
                    const combinedText = `${title}\n${description}\n${listItem}`.trim();

                    if (combinedText || link || image || video) {
                        results.push({
                            title: title || 'No title available',
                            description: combinedText || 'No description available',
                            link: link || 'No link available',
                            image: image || 'No image available',
                            video: video || 'No video available'
                        });
                    }
                });

                console.log('Scraped Data:', results);
                return results.length > 0 ? results : 'No content found for the given selector';
            } else {
                throw new Error('Invalid operation type. Must be "search" or "scrape".');
            }
        } catch (error) {
            console.error(`Error during ${operation_type}:`, error);
            return { error: `Failed to perform ${operation_type}` };
        }
    };

    // Unified function declaration for AI
    export const search_or_scrapeFunctionDeclaration = {
        name: "search_or_scrape",
        description: "Perform a web search or scrape content from a URL based on the specified operation type. This function can handle both search queries and content scraping dynamically. Use 'search' to perform a web search and 'scrape' to extract content from a specified URL.",
        parameters: {
            type: "OBJECT",
            description: "Parameters for performing a search or scrape operation.",
            properties: {
                operation_type: {
                    type: "STRING",
                    description: "The type of operation to perform. Must be either 'search' to perform a web search or 'scrape' to extract content from a URL."
                },
                query: {
                    type: "STRING",
                    description: "The search query for the 'search' operation. This parameter is required if the operation_type is 'search'. It defines what to search for on the web."
                },
                url: {
                    type: "STRING",
                    description: "The URL to scrape content from for the 'scrape' operation. This parameter is required if the operation_type is 'scrape'. It specifies the webpage from which to extract content."
                },
                selector: {
                    type: "STRING",
                    description: "The CSS selector to target specific elements for scraping. This parameter is optional. If not provided, the function will use a default set of common selectors to extract data from various elements such as 'article', 'div', 'section', etc."
                }
            },
            required: ["operation_type"],
            anyOf: [
                {
                    required: ["query"],
                    properties: {
                        operation_type: {
                            enum: ["search"]
                        }
                    }
                },
                {
                    required: ["url"],
                    properties: {
                        operation_type: {
                            enum: ["scrape"]
                        }
                    }
                }
            ]
        }
    };
