// Server-side email sending over the company mailbox's SMTP, via Nodemailer.
// This is the single place that talks to the mail server; the API routes under
// src/pages/api call sendMail(). Credentials come from .env (see .env.example).
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_TO,
  MAIL_FROM,
} from "astro:env/server";
import { site } from "../data/site";

// Returns a human-readable (Dutch) error if SMTP isn't configured yet, else null.
// Lets the API return a clear 500 instead of an opaque crash before .env is set.
export function mailConfigError(): string | null {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return "E-mailverzending is nog niet geconfigureerd (SMTP_HOST, SMTP_USER en SMTP_PASS ontbreken in .env).";
  }
  return null;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE, // true for 465, false for 587 (STARTTLS)
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

type MailInput = {
  subject: string;
  text: string;
  // Visitor's address, so the owner can reply straight to them.
  replyTo?: string;
};

export async function sendMail({ subject, text, replyTo }: MailInput): Promise<void> {
  const to = MAIL_TO || site.email;
  const from = MAIL_FROM || `"${site.name}" <${SMTP_USER}>`;
  await getTransporter().sendMail({ from, to, subject, text, replyTo });
}
