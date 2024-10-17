import puppeteer from 'puppeteer';
import { setTimeout } from 'node:timers/promises';

// Function to click the button and extract the image
const clickButtonAndExtractImage = async (page, buttonIndex) => {
  let elements;
  try {
    // Re-select elements after each potential navigation
    elements = await page.$$(".XiKgde");
  } catch (err) {
    console.error(`Error selecting elements:`, err);
    return null;
  }

  // Check if the buttonIndex is valid
  if (buttonIndex >= elements.length) {
    console.log("No more buttons to click.");
    return null; // Return null if there are no more buttons
  }

  try {
    // Get the button from the specified index
    const button = await elements[buttonIndex].$(".fHEb6e");
    if (button) {
      // Click the button and wait for navigation if any
      await Promise.all([
        page.evaluate((element) => element.click(), button),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {
          console.log("No navigation detected.");
        })
      ]);
      console.log(`Button clicked at index ${buttonIndex}`);

      // Wait for the image to load
      await page.waitForSelector(".lvtCsd img", { visible: true, timeout: 5000 });
      await setTimeout(3000);

      // Extract the image source
      const imgSrc = await page.$eval(".lvtCsd img", (img) => img.getAttribute("src"));

      const averageRating = await page.$eval(".ceNzKf", el => el.getAttribute("aria-label"));

      // Extract number of reviews
      const reviews = await page.$eval(".dmRWX span[aria-label]", el => el.getAttribute("aria-label"));

      // Extract category
      const category = await page.$$eval(".DkEaL", buttons => {
        // Find the button that contains '.category' in the jsaction attribute
        const categoryButton = buttons.find(button => button.getAttribute('jsaction')?.includes('.category'));
        return categoryButton ? categoryButton.innerText : null;
    });


      // Extract latitude, longitude, and placeId from the URL
      const currentUrl = page.url();
      const latLongRegex = /!3d([-\d.]+)!4d([-\d.]+)/;
      const match = currentUrl.match(latLongRegex);  // Match the regex with the URL

      let lat = match ? match[1] : null;  // Extract latitude if match is found
      let long = match ? match[2] : null;  

      let address = null
      let website =  null
      let contactDetails = await extractContactDetails(page);
      const name = await page.evaluate(() => {
        const nameElement = document.querySelector('h1.DUwDvf.lfPIob');
        return nameElement ? nameElement.textContent.trim() : null;
      });
      console.log(contactDetails); // { address: "some address", phone: "+1234567890", website: "example.com" }
     

      return {
        name,
        imgSrc,
        lat,
        long,
        averageRating,
        reviews,
        category,
        ...contactDetails
    };

    } else {
      console.log(`Button not found for element index ${buttonIndex}`);
      return null; // Return null if the button is not found
    }
  } catch (err) {
    console.error(`Error handling element at index ${buttonIndex}:`, err);
    return null; // Return null in case of an error
  }
};

async function extractContactDetails(page) {
  try {
    // Get all elements with the class 'CsEnBe'
    const elements = await page.$$('.CsEnBe');
    
      let address
      let phone
      let website

    // Loop through all the elements and check the 'data-tooltip' attribute
    for (const element of elements) {
      try {
        // Get the 'data-tooltip' attribute
        const dataTooltip = await page.evaluate(el => el.getAttribute('data-tooltip'), element);

        // Check if data-tooltip exists and extract content based on its value
        if (dataTooltip && dataTooltip.includes('Copy address')) {
          // Extract address text content
           address = await page.evaluate(el => el.querySelector('.Io6YTe')?.textContent || '', element);
           console.log("ADDRes" , address)

        } else if (dataTooltip && dataTooltip.includes('Copy phone number')) {
          // Extract phone number text content
           phone = await page.evaluate(el => el.querySelector('.Io6YTe')?.textContent || '', element);
           console.log("phone" , phone)

        } else if (dataTooltip && dataTooltip.includes('Open website')) {
          // Extract website URL
           website = await page.evaluate(el => el.querySelector('.Io6YTe')?.textContent || '', element);
           console.log("website" , website)

        }
      } catch (innerError) {
        console.error(`Error handling element: ${innerError}`);
      }
    }

    return {address , phone , website};

  } catch (error) {
    console.error('Error extracting contact details:', error);
    return { address: null, phone: null, website: null };
  }
}

const scrollPage = async (page , extracted  ) => {
  const sectionSelector = '.ussYcc';
  
  let previousScrollHeight = 0;
  let currentScrollHeight;

  do {
    // Scroll down the section
    await page.evaluate((selector, extractedValue) => {
      const section = document.querySelector(selector);
      if (section) {
        section.scrollTop = (extractedValue * 90) + 200; // Scroll by extracted places value
      }
    }, sectionSelector, extracted);

    // Wait for a moment for new items to load
    await setTimeout(3000);

    // Get the new scroll height
    currentScrollHeight = await page.evaluate(selector => {
      const section = document.querySelector(selector);
      return section ? section.scrollHeight : 0;
    }, sectionSelector);
    
    // If the scroll height hasn't changed, break the loop
    if (currentScrollHeight === previousScrollHeight) {
      break;
    }
    previousScrollHeight = currentScrollHeight; // Update the previous scroll height

  } while (true); // Continue scrolling until the end is reached
};

const extractNumberFromClass = async (page) => {
  try {
    // Select the element with class 'wuvLZe'
    const element = await page.$(".wuvLZe");

    if (element) {
      // Get the text content inside the element
      const textContent = await page.evaluate(el => el.textContent, element);
      console.log(`Extracted text: ${textContent}`);

      // Use regex to extract the number from the text
      const numberMatch = textContent.match(/\d+/);
      const number = numberMatch ? numberMatch[0] : null;

      if (number) {
        console.log(`Extracted number: ${number}`);
        return number;
      } else {
        console.log("No number found.");
        return null;
      }
    } else {
      console.log("Element with class 'wuvLZe' not found.");
      return null;
    }
  } catch (error) {
    console.error("Error extracting number:", error);
    return null;
  }
};

// Function to extract items dynamically and scroll the page
const extractItemsInLoop = async (page) => {
  let images = [];
  let buttonIndex = 0;
  let reachedEnd = false;

  let extractedNumber = await extractNumberFromClass(page);
  if (extractedNumber) {
    console.log(`The number of places: ${extractedNumber}`);
  }else{
    extractedNumber = 1
  }

  await scrollPage(page , extractedNumber);
    
  // Re-select elements after scrolling to ensure buttons are visible


  // Loop through the page and extract data until the end
  while (!reachedEnd) {
    const elements = await page.$$(".XiKgde");

    const imgSrc = await clickButtonAndExtractImage(page, buttonIndex);

    if (imgSrc) {
      images.push(imgSrc); // Store the extracted image source
    } 
    // Scroll down the page after processing the current button

    if (buttonIndex >= elements.length || images.length === extractedNumber) {
      reachedEnd = true; // If no more buttons are visible, end the loop
    } else {
      buttonIndex++; // Move to the next button index
    }
  }

  return images;
};

export const getMapsData = async (url) => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--disabled-setuid-sandbox", "--no-sandbox"],
  });

  const [page] = await browser.pages();

  // Set viewport to a large size (e.g., Full HD screen size)
  await page.setViewport({
    width: 1920,  // Full HD width
    height: 1080, // Full HD height
  });

  await page.setExtraHTTPHeaders({
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4882.194 Safari/537.36",
  });

  // const url = "https://maps.app.goo.gl/xShEdDRfdfrMnfGWA";
  // const url2 = "https://maps.app.goo.gl/MwDtPqhVUmvbnwaD6"
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await setTimeout(10000); // Initial delay to ensure page is fully loaded

  const images = await extractItemsInLoop(page);
  console.log("Extracted image sources:", images);

  await browser.close();
};


