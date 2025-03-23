import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const stealth = StealthPlugin();

//stealth.enabledEvasions.delete('iframe.contentWindow');

//const proxyServer = 'http://34.30.238.247:3128'
const startBrowser = async () => {
	let browser;
	try {
		puppeteer.use(stealth);
		console.log('opening the browser');
		browser = await puppeteer.launch({
			headless: false,
			args: [
				'--disable-setuid-sandbox',
				//`--proxy-server=${proxyServer}`
			],
			ignoreHTTPSErrors: true,
		});
	} catch (error) {
		console.log('could not initiate browser', error);
	}
	return browser;
};

export default startBrowser;
