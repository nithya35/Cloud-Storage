const sgMail = require('@sendgrid/mail');
const htmltotext = require('html-to-text');

module.exports = class Email{
    constructor(user,url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Sree Nithya <${process.env.EMAIL_FROM}>`;
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }

    async send(subject, htmlContent) {
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html: htmlContent,
        text: htmltotext.htmlToText(htmlContent)
      };
      await sgMail.send(mailOptions);
    }

    //welcome email - after if required

    async sendPasswordReset() {
      const subject = 'Your password reset token (valid for 10 minutes)';
      const html = `
        <p>Hi ${this.firstName},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${this.url}">${this.url}</a>
        <p>If you didn't request this, please ignore this email.</p>
      `;
      await this.send(subject, html);
    }
};