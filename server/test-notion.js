require('dotenv').config();
const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PAGE_ID = "25efc170-a5ca-80fc-a0ff-dee70f05b474"; // First ID
const PAGE_ID_2 = "38efc170-a5ca-808f-ba0a-c557814cd904"; // Second ID from logs

async function testNotion(id) {
  console.log(`\nTesting access to block/page ID: ${id}...`);
  try {
    const response = await notion.blocks.retrieve({ block_id: id });
    console.log("SUCCESS! The integration CAN access this block.");
    console.log("Block type:", response.type);
    if (response.type === 'child_page') {
      console.log("Page title:", response.child_page.title);
    }
  } catch (error) {
    console.error("ERROR! Cannot access this block.");
    console.error("Status:", error.status);
    console.error("Code:", error.code);
    console.error("Message:", error.message);
  }
}

async function main() {
  console.log("Using API Key starting with:", process.env.NOTION_API_KEY ? process.env.NOTION_API_KEY.substring(0, 8) + "..." : "NONE");
  await testNotion(PAGE_ID);
  await testNotion(PAGE_ID_2);
  
  // Test search to see if we can access *anything*
  console.log("\nTesting search to see what the integration CAN access...");
  try {
    const response = await notion.search({
      filter: { value: 'page', property: 'object' },
      page_size: 5
    });
    if (response.results.length === 0) {
      console.log("Search returned 0 results. The integration currently has NO ACCESS to ANY pages in the workspace.");
    } else {
      console.log(`Search returned ${response.results.length} pages. The integration has access to:`);
      response.results.forEach(p => {
        let title = "Unknown Title";
        if (p.properties && p.properties.title && p.properties.title.title && p.properties.title.title[0]) {
            title = p.properties.title.title[0].plain_text;
        } else if (p.properties && p.properties.Name && p.properties.Name.title && p.properties.Name.title[0]) {
            title = p.properties.Name.title[0].plain_text;
        }
        console.log(`- ${title} (ID: ${p.id})`);
      });
    }
  } catch (error) {
    console.error("Search failed:", error.message);
  }
}

main();
