export async function sendMagicLinkEmail(email: string, token: string) {
  const webhookUrl = process.env.MAGIC_LINK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("MAGIC_LINK_WEBHOOK_URL not set, skipping email");
    return;
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const link = `${appUrl}/api/auth/verify?token=${token}`;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: email,
      subject: "Your EvalMaster Login Link",
      body: `Click this link to sign in:\n\n${link}\n\nThis link expires in 15 minutes.`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Webhook failed: ${res.status}`);
  }
}
