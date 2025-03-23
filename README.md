# GPUBOT 2.0

## DEPENDENCIES
- Puppeteer-Extra
- Puppeteer-Extra-Plugin-Stealth
- NodeMailer (for notification of buy)
- ENV file with login/card details for checkout

## INTENT
This bot will search Newegg and Bestbuy for various card URLs (mainly looking for AMD 9070XT). Bot is fully capapble of buying card based on factors like shipping and preset upper price contraints. 

## NOTES
Even with stealth and a few mouse moves and delays - I keep the purchase attempt loops under 20 and run via an in house server every hour or so. Occasionally Newegg or Bestbuy will challenge the bot and I have not built any logic around this. If it fails one hour out of 24, I don't care. Just be aware. I am using a VPN with rotating IP's to help avoid detection - you can either do the same or look into using proxies with puppeteer. Lastly, please note the use of fs to both write to and read from files. I use these to drive logic as to whether the bot should even run. For example - if my purchased.txt file contains text, then a card was already bought and I don't want to buy more. I'm not looking to scalp here - I just want to upgrade my current card. Use whatever already bought logic makes sense to you and that you can implement easily. 