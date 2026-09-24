import { requireOwner } from "@/lib/owner-auth";
import { operations } from "@/lib/operations/runtime";
import { privateHeaders } from "@/lib/payments/http";
import { operationFailure } from "@/lib/operations/http";

export async function GET() {
  try {
    await requireOwner();
    const result = await operations().pool.query(
      "SELECT email,confirmed_at FROM simbiat_operations.subscribers WHERE status='subscribed' ORDER BY email LIMIT 10000",
    );
    const csv = (value: string) => `"${value.replaceAll('"', '""')}"`;
    // Spreadsheet formula injection also applies to email addresses.
    const rows = result.rows.map((row) =>
      [
        csv(/^[=+@-]/.test(row.email) ? `'${row.email}` : row.email),
        csv(new Date(row.confirmed_at).toISOString()),
      ].join(","),
    );
    return new Response(["email,confirmed_at", ...rows].join("\r\n"), {
      headers: {
        ...privateHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="confirmed-subscribers.csv"',
      },
    });
  } catch (error) {
    return operationFailure(error);
  }
}
