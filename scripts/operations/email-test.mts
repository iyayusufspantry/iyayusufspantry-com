import nextEnv from "@next/env";
import { Resend } from "resend";

nextEnv.loadEnvConfig(process.cwd(), true);

const apiKey = process.env.RESEND_API_KEY?.trim();
const configured = !!apiKey?.startsWith("re_") && apiKey !== "re_xxxxxxxxx";
const message = {
  from: "onboarding@resend.dev",
  to: "iyayusufspantry@gmail.com",
  subject: "Hello World",
  html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
};

if (process.argv.includes("--dry-run")) {
  console.log(
    JSON.stringify(
      {
        dryRun: true,
        apiKeyConfigured: configured,
        ...message,
      },
      null,
      2,
    ),
  );
  console.log(
    "No email sent. Run without --dry-run to send this test message.",
  );
} else if (!configured) {
  console.error(
    "Replace re_xxxxxxxxx with your real API key in .env: RESEND_API_KEY=re_... . Keep this key private.",
  );
  process.exitCode = 1;
} else {
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(message);
    if (error || !data?.id) {
      console.error(
        "Resend did not accept the email. Check the API key and sender/recipient permissions in your Resend dashboard. The onboarding sender can only send to your Resend account email.",
      );
      process.exitCode = 1;
    } else {
      console.log(
        `Resend accepted the test email for ${message.to}. Message ID: ${data.id}`,
      );
      console.log(
        "Check the inbox and spam folder; provider acceptance does not confirm inbox delivery.",
      );
    }
  } catch {
    console.error(
      "The Resend request failed. Check connectivity and the Resend delivery log before retrying.",
    );
    process.exitCode = 1;
  }
}
