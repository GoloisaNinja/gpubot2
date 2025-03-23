import nodemailer from 'nodemailer';
import fs from 'fs';

const transporter = nodemailer.createTransport({
	service: 'Gmail',
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		user: process.env.AUTHUSER,
		pass: process.env.AUTHPASS,
	},
});
const mailOptions = {
	from: process.env.MAILFROM,
	to: process.env.MAILTO,
	subject: 'GPUBOT bought card',
	text: 'Found a card for you meatbag. See attached.',
	attachments: [
		{
			filename: 'purchased.txt',
			path: './purchased.txt',
		},
	],
};
const sendMail = () => {
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.error('error sending email');
		} else {
			console.log('mail sent!');
			fs.appendFile(
				'./log.txt',
				`Email Sent: ${new Date().toISOString()}\n`,
				(err) => {
					if (err) {
						console.error('error appending to log file');
					}
				}
			);
		}
	});
};

export default sendMail;
