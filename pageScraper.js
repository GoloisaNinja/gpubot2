import fs from 'fs';
import sendMail from './mailer.js';
const pageScraper = async (browser) => {
	const bbTestUrl = 'https://www.bestbuy.com/site/valve-steam-wallet-20-gift-card/6576811.p?skuId=6576811';
	const bbBaseUrl = 'https://www.bestbuy.com';
	const bbxfxUrl = 'https://www.bestbuy.com/site/xfx-swift-amd-radeon-rx-9070xt-16gb-gddr6-pci-express-5-0-gaming-graphics-card-black/6620455.p?skuId=6620455';
	const bbgigabyteUrl = 'https://www.bestbuy.com/site/gigabyte-radeon-rx-9070-xt-gaming-16g-gddr6-pci-express-5-0-graphics-card-black/6622482.p?skuId=6622482';
	const baseUrl = 'https://www.newegg.com';
	// SPECIFIC/DESIRED CARD URL
	const testCardUrl = 'https://www.newegg.com/peladn-rx-580/p/27N-008H-00024';
	const cardUrl = 'https://www.newegg.com/gigabyte-gv-r9070xtgaming-16gd-amd-radeon-rx-9070-xt-16gb-gddr6/p/N82E16814932783?Item=N82E16814932783'
	const asRockCardUrl = 'https://www.newegg.com/asrock-steel-legend-rx9070xt-sl-16g-amd-radeon-rx-9070-xt-16gb-gddr6/p/N82E16814930136?Item=N82E16814930136';
	const backupCardUrl = 'https://www.newegg.com/xfx-swift-rx-97tswf3w9-amd-radeon-rx-9070-xt-16gb-gddr6/p/N82E16814150907?Item=N82E16814150907'
	// BOOLEAN GLOBAL PURCHASE SUCCESS VAR
	let success = false;
	// BOOLEAN ELEMENT RETURN FUNC
	const elementExists = async (selector) => {
		const element = await page.$(selector);
		if (element) {
			return true;
		}
		return false;
	};
	
	function delay(time) {
		return new Promise(function(resolve) { 
			setTimeout(resolve, time)
		});
	 }

	// HANDLE PURCHASE SUCCESS
	const handlePurchaseSuccess = (data) => {
		success = true;
		fs.writeFile('purchased.txt', data, 'utf8', function (err) {
			if (err) {
				return console.log(err);
			}
			console.log('wrote to purchased...card acquired!');
			sendMail();
		});
	 }
  // HANDLE PURCHASE FAILURE
	 const handlePurchaseFailure = (isHeader=false) => {
		const timestamp = new Date().toISOString();
		let data = `\nAttempted Purchase. OOS, pick up only, or above constraint. Time: ${timestamp}`;
		isHeader && (data=`\n####CARD JOB LOG START - ${timestamp}####`);
		fs.appendFile('log.txt', data, 'utf8', function (err) {
			if (err) {
				return console.log(err);
			}
		});
	 }

	// MIMIC HUMAN BROWSER SESSION
	const mimicHumanUserSession = async(referer=false) => {
		referer ? (referer='https://www.bestbuy.com') : (referer='https://www.newegg.com');
		await page.setExtraHTTPHeaders({
			'Accept-Language': 'en-US,en;q=0.9',
			'Referer': `${referer}`,
			});
	}

	// BEST BUY LOGIN
	 const bestBuyLogin = async() => {
		await page.goto(bbBaseUrl, { waitUntil: 'domcontentloaded' });
		// BEHOLD - THE LOGIN PROCESS...
		//await page.waitForSelector('[data-track="ft_sign_in_create_account"]');
		await page.mouse.move(100, 200);
		const [response] = await Promise.all([
			page.waitForNavigation(),
			page.mouse.move(100, 200),
			page.click('[data-track="ft_sign_in_create_account"]'),
		]);
		await page.waitForSelector('.tb-input');
		await delay(3000)
		await page.type('.tb-input', process.env.EMAIL, {delay: 125})
		await page.click('[data-track="Sign In - Continue"]');
		await page.waitForSelector('#password-radio');
		await page.mouse.move(100, 200);
		await delay(4000)
		await page.click('#password-radio');
		await page.waitForSelector('.tb-input');
		await page.type('.tb-input', process.env.BBPASS, {delay: 200});
		const [presponse] = await Promise.all([
			page.waitForNavigation(),
			page.mouse.move(100, 200),
			page.mouse.move(200, 300),
			await delay(4000),
			page.click('.cia-form__controls__submit'),
		]).catch(async() => {
			await delay(2000)
			await page.waitForSelector('.c-alert')
			await page.click('#email-code-radio')
			const [failResponse] = await Promise.all([
				page.waitForNavigation(),
				page.click('.cia-form__controls__submit')
			])
		});
			
	 }

	 // BEST BUY PURCHASING LOGIC FOR CARD URLS...
	const attemptBBPurchase = async (url) => {
		let hasShipping = true;
		let hasBuyNow = true;
		// AWAIT NAV TO CARD URL
		await page.goto(url, { waitUntil: 'domcontentloaded' });
		// BESTBUY HAS A CUSTOM toString THAT SEEMS TO CAUSE A RECURSIVE MAX STACK ERROR
		// HOT FIX DELETES THAT...PROLLY NOT IDEAL LOL...
		await page.evaluateOnNewDocument(() => {
			delete Function.prototype.toString
		})
		//await waitForElements(page);
		// DOES THE PAGE HAVE A SHIPPING OPTION - WE NEED SHIPPING
		await delay(4000);
		hasShipping = await elementExists('.fulfillment-fulfillment-summary > div > div > div > fieldset > button:last-child')
		if (hasShipping) {
			await page.click('.fulfillment-fulfillment-summary > div > div > div > fieldset > button:last-child');
			hasBuyNow = await elementExists('.fulfillment-add-to-cart-button > div > div > button:last-child');
			if (hasBuyNow) {
				const [response] = await Promise.all([
					page.waitForNavigation(),
					page.click('.fulfillment-add-to-cart-button > div > div > button:last-child')
				]).catch((e) => {
					console.log('found buy now, but click->navigate failed...')
					console.log(e)
				})
				await page.waitForSelector('#cvv');
				await page.type('#cvv', process.env.CVV, {delay: 125});
				const cardPrice = await page.$eval('[data-testid="LineItemPrice"]', (el) => el.textContent);
				const cardName = await page.$eval('[data-testid="LineItemShortLabel"]', (el) => el.textContent);
				const cleanPrice = cardPrice.substring(1,);
				if (parseFloat(upperContraint) > parseFloat(cleanPrice)) {
					// ****COMMENT THIS OUT DURING TESTING!! THIS WILL PLACE THE ORDER!!****
					const [bbPurchResponse] = await Promise.all([
						page.waitForNavigation(),
						page.click('[data-track="Place your Order - Docked"]'), // COMMENT OUT TO DISABLE PURCHASE
					])
					const data = 'PURCHASE SUCCESS\nCard: ' + cardName + '\nPrice: ' + cardPrice;
					handlePurchaseSuccess(data)
				} else {
					handlePurchaseFailure();
				}

			} else {
				handlePurchaseFailure();
			}
			
		} else {
			handlePurchaseFailure();
		}
	}

	// PURCHASING LOGIC SECTION - CAUTION!! WILL PURCHASE CARDS AUTOMATICALLY
	const newEggLogin = async() => {
		await page.goto(baseUrl, { waitUntil: 'load' });
		// BEHOLD - THE LOGIN PROCESS...
		await delay(2000);
		await page.mouse.move(100,200);
		await page.mouse.move(250,40);
		await delay(1500);
		await page.waitForSelector('.header2021-account');
		const [response] = await Promise.all([
			page.waitForNavigation(),
			page.click('.header2021-account > a'),
		]);
		await page.waitForSelector('#labeled-input-signEmail');
		await delay(2000);
		await page.type('#labeled-input-signEmail', process.env.EMAIL);
		await delay(2400);
		await page.click('#signInSubmit');
		await page.waitForSelector('#labeled-input-password');
		await delay(2700);
		await page.type('#labeled-input-password', process.env.NEWEGGPASS)
		const [presponse] = await Promise.all([
			page.waitForNavigation(),
			page.click('#signInSubmit'),
		]);
	}
	
	// PURCHASING LOGIC FOR CARD URLS...
	const attemptPurchase = async (url) => {
		// AWAIT NAV TO CARD URL
		await page.goto(url, { waitUntil: 'load' });
		await delay(2000);
		//await waitForElements(page);
		// DOES THE PAGE HAVE A BUY BUTTON
		const hasProductBuyDiv = await elementExists('#ProductBuy');
		if (hasProductBuyDiv) {
			const addToCartExists = await elementExists(
				'#ProductBuy > div > div:nth-child(2) > button.btn'
			);
			// DOES THE PAGE HAVE A ADD TO CART BUTTON
			if (addToCartExists) {
				let cardTitle = await page.$eval('.product-title', (title) => title.textContent);
				await page.mouse.move(100,200);
				await page.click('#ProductBuy > div > div:nth-child(2) > button.btn');
				// MANAGE NEWEGG GARBAGE POPUPS FOR ADD ONS AND PROCEED TO CART
				await page.waitForSelector('.modal-footer');
				await page.click('.modal-footer > button:nth-child(1)');
				await page.waitForSelector('.item-actions');
				const [response] = await Promise.all([
					page.waitForNavigation(),
					page.click('.item-actions > button:nth-child(3)'),
				]);
				// SHOULD BE ON CHECKOUT PAGE
				await page.waitForSelector('.checkout-step-action-edit');
				// CHOOSE DEFAULT CARD METHOD OVER PAYPAL
				await page.click('.checkout-step-action-edit');
				// ENTER CVV
				await page.waitForSelector('.mask-cvv-4');
				await page.type('.mask-cvv-4', process.env.CVV);
				await page.click('.checkout-step-action-done')
				// DETERMINE IF NEWEGG HAS FULL CARD ENTRY SECURITY CHECK - IF SO, DEAL WITH IT
				const securityCheck = await elementExists('.mask-cardnumber');
				if (securityCheck) {
					await page.type('.mask-cardnumber', process.env.CARDNUMBER)
					await page.click('.modal-footer > .button-m')
				}

				let cartTotal = await page.$eval('.summary-content-total > span > strong', (el) => el.textContent);
				console.log(cartTotal)
				let placeOrderBtnText = await page.$eval('#btnCreditCard', (btn) => btn.textContent)
				console.log(placeOrderBtnText)
				// MAKE SURE TOTAL IS SENSICAL AND THAT PLAVE ORDER BUTTON EXISTS
				if (placeOrderBtnText === 'Place Order' && parseFloat(upperContraint) > parseFloat(cartTotal)) {
					console.log('order is below contraint and the place order button exists...PURCHASING!!')
					//****COMMENT THIS OUT DURING TESTING!! THIS WILL PLACE THE ORDER!!****
					const [purchResponse] = await Promise.all([
						page.waitForNavigation(),
						page.click('#btnCreditCard') // COMMENT THIS OUT TO AVOID PURCHASE!!!
					])
					const data = 'PURCHASE SUCCESS\nCard: ' + cardTitle + '\nPrice: ' + cartTotal;
					handlePurchaseSuccess(data);
				} else {
					handlePurchaseFailure();
				}
			} else {
				handlePurchaseFailure();
			}
		} else {
			handlePurchaseFailure();
		}
	}
	const maxAttempts = 18
	// MAX I'M WILLING TO SPEND
	const upperContraint = "760.00"
	const makeNewEggPurchaseAttempts = async() => {
		await mimicHumanUserSession();
		await newEggLogin();
		let attempts = 0;
		while(attempts<maxAttempts && !success) {
			//await attemptPurchase(testCardUrl);
			await attemptPurchase(asRockCardUrl);
			!success && await attemptPurchase(cardUrl);
			!success && await attemptPurchase(backupCardUrl);
			attempts++;
		}
	}

	const makeBBPurchaseAttempts = async() => {
		await mimicHumanUserSession(true);
		await bestBuyLogin();
		let attempts = 0;
		while(attempts<maxAttempts && !success) {
			await attemptBBPurchase(bbgigabyteUrl);
			//!success && await attemptBBPurchase(bbTestUrl);
			!success && await attemptBBPurchase(bbxfxUrl);
			attempts++;
		}
	}

	let page = await browser.newPage();
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36');
	handlePurchaseFailure(true) // BEGIN FAILURE LOG HEADER
	await makeNewEggPurchaseAttempts();
	if (!success) {
		await makeBBPurchaseAttempts();
	}
};
export default pageScraper;
