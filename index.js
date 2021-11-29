const puppeteer = require('puppeteer');
require('dotenv').config();

const daysFormatting = [
  { en: 'Mon', fr: 'lun' },
  { en: 'Tue', fr: 'mar' },
  { en: 'Wed', fr: 'mer' },
  { en: 'Thu', fr: 'jeu' },
  { en: 'Fri', fr: 'ven' },
  { en: 'Sat', fr: 'sam' },
  { en: 'Sun', fr: 'dim' },
];

const workedDays = process.env.WORKED_DAYS.split(',');

function getActualMonthDays()
{
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  return new Date(year, month, 0).getDate();
}

async function main()
{
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://epitech.bamboohr.com/login.php');

  // Login
  console.log('Logging in...');
  await page.type('#lemail', process.env.LOGIN);
  await page.type('#password', process.env.PASSWORD);
  await Promise.all([
    page.waitForNavigation(),
    page.click('#passwordFields > div.login-actions > button.fab-Button.fab-Button--large'),
  ]);

  // Go to the timesheet page
  console.log('Going to the timesheet page...');
  await Promise.all([
    page.waitForNavigation(),
    page.click('#TIME_TRACKING > div > section > a'),
  ]);

  // Get the number of days in the month
  const daysInMonth = getActualMonthDays();

  // Iterate over the days
  for (let i = 0; i < daysInMonth; i++) {
    console.log(`Checking day ${i + 1}...`);
    // Get the day
    const element = await page.waitForSelector(`#js-timesheet > div > div.TimesheetContent.js-timesheet-content > div.TimesheetEntries > form > div:nth-child(${i + 1}) > div.TimesheetSlat__day > div.TimesheetSlat__dayOfWeek`); // select the element
    const dayInnerText = await element.evaluate(el => el.innerText);

    const dayFormatting = daysFormatting.find(day => day.en === dayInnerText);
    const formattedDay = dayFormatting ? dayFormatting.fr : day;

    if (!workedDays.includes(formattedDay))
      continue;
    
    console.log(`Opening entries modal for ${formattedDay} ${i + 1}`);
  
    // Click on the timesheet's day
    await page.click(`#js-timesheet > div > div.TimesheetContent.js-timesheet-content > div.TimesheetEntries > form > div:nth-child(${i + 1}) > div.TimesheetSlat__dataWrapper > div > div.TimesheetSlat__multipleContent > a`);

    console.log(`Creating entries for ${formattedDay} ${i + 1}`);
    // Type the time
    await page.type('#fabricModalContent > div > form > div > div > div:nth-child(1) > div > input', '9:00');
    await page.type('#fabricModalContent > div > form > div > div > div:nth-child(3) > div > input', '12:00');
    
    // Click on the "Add Entry" button
    await page.click('#fabricModalContent > div > div > div.AddEditEntry__addEntryLink > a');

    // Change time to PM
    await page.click('#fabricModalContent > div > form > div:nth-child(2) > div > div:nth-child(1) > div > div > div > div > div');
    await page.click('.fab-MenuList__scrollContainer > div:nth-child(2)');
  
    // Type the time
    await page.type('#fabricModalContent > div > form > div:nth-child(2) > div > div:nth-child(1) > div > input', '2:00');
    await page.type('#fabricModalContent > div > form > div:nth-child(2) > div > div:nth-child(3) > div > input', '6:00');

    // Save the entries
    await page.click('.actions--2ohA0 > button');
    
    // Wait 500 ms
    await page.waitForTimeout(2000);
  }

  await browser.close();
}

main();