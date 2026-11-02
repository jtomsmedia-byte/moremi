import nodemailer from "nodemailer";
export async function send(to: string, subject: string, text: string) {
  if (!process.env.SMTP_URL || !process.env.MAIL_FROM)
    throw Error("Mail configuration missing");
  await nodemailer
    .createTransport(process.env.SMTP_URL)
    .sendMail({ from: process.env.MAIL_FROM, to, subject, text });
}
