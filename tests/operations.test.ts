import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { Pool } from "pg";
import { OperationsStore } from "../lib/operations/store";
import { drainMail, sendWithResend } from "../lib/operations/mail";
import { contactInput, OperationError } from "../lib/operations/validation";
import { OwnerStore } from "../lib/payments/owner-store";
import { isOwner } from "../lib/owner-access";

loadEnvConfig(process.cwd());
const schema = `operations_test_${randomUUID().replaceAll("-", "")}`;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 4,
  connectionTimeoutMillis: 10000,
});
const store = new OperationsStore(pool, schema);
const owner = new OwnerStore(pool, schema);
const mail = {
  from: "test@example.com",
  to: ["recipient@example.com"],
  subject: "Test only",
  text: "Never transmitted",
};
before(async () => {
  assert.ok(process.env.DATABASE_URL);
  for (const [file, original] of [
    ["lib/operations/schema.sql", "simbiat_operations"],
    ["lib/payments/schema.sql", "simbiat_checkout_test"],
  ])
    await pool.query(
      (await readFile(file, "utf8")).replaceAll(original, schema),
    );
});
after(async () => {
  assert.match(schema, /^operations_test_[a-f0-9]{32}$/);
  await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await pool.end();
});
test("owner access fails closed and email grants require verified addresses", () => {
  const user = {
    id: "user_owner",
    emailAddresses: [
      {
        emailAddress: "Owner@example.com",
        verification: { status: "unverified" },
      },
    ],
  };
  assert.equal(isOwner(null, "user_owner"), false);
  assert.equal(isOwner(user), false);
  assert.equal(isOwner(user, "", "owner@example.com"), false);
  user.emailAddresses[0].verification.status = "verified";
  assert.equal(isOwner(user, "", "owner@example.com"), true);
  assert.equal(isOwner(user, "other_user", "other@example.com"), false);
  assert.equal(isOwner(user, "user_owner"), true);
});
test("contact validates fields, saves once on concurrent retries and detects changed payloads", async () => {
  const input = {
    requestId: randomUUID(),
    name: "Test Person",
    email: "TEST@example.com",
    subject: "general",
    message: "A test message saved in the isolated test schema.",
  };
  assert.throws(
    () => contactInput({ ...input, email: "bad\nemail" }),
    OperationError,
  );
  assert.throws(
    () => contactInput({ ...input, message: "short" }),
    OperationError,
  );
  const parsed = contactInput(input);
  await Promise.all([
    store.contact(parsed, { from: mail.from, to: mail.to[0] }),
    store.contact(parsed, { from: mail.from, to: mail.to[0] }),
  ]);
  assert.equal(
    (
      await pool.query(`SELECT * FROM ${schema}.contact_messages WHERE id=$1`, [
        input.requestId,
      ])
    ).rowCount,
    1,
  );
  assert.equal(
    (
      await pool.query(`SELECT * FROM ${schema}.mail WHERE id=$1`, [
        `contact-${input.requestId}`,
      ])
    ).rowCount,
    1,
  );
  await assert.rejects(
    store.contact({ ...parsed, message: "A different message." }),
    (e: unknown) => e instanceof OperationError && e.status === 409,
  );
  await store.handleMessage(parsed.id);
  assert.ok((await store.overview()).messages[0].handled_at);
});
test("newsletter requires confirmation; retries do not spam and unsubscribed links cannot reactivate", async () => {
  const email = `${randomUUID()}@example.com`;
  await Promise.all([
    store.subscribe(email, "https://pantry.example", mail.from),
    store.subscribe(email, "https://pantry.example", mail.from),
  ]);
  const queued = (
    await pool.query(
      `SELECT payload FROM ${schema}.mail WHERE payload->'to'->>0=$1`,
      [email],
    )
  ).rows;
  assert.equal(queued.length, 1);
  const body = queued[0].payload.text as string;
  const confirmation = body.match(/confirm#token=([a-f0-9]{64})/)![1];
  const unsubscribe = body.match(/unsubscribe#token=([a-f0-9]{64})/)![1];
  let row = (
    await pool.query(`SELECT * FROM ${schema}.subscribers WHERE email=$1`, [
      email,
    ])
  ).rows[0];
  assert.equal(row.status, "pending");
  assert.notEqual(row.confirmation_hash, confirmation);
  await assert.rejects(store.subscriptionAction("a".repeat(64), "confirm"));
  await store.subscriptionAction(confirmation, "confirm");
  await store.subscriptionAction(confirmation, "confirm");
  row = (
    await pool.query(`SELECT * FROM ${schema}.subscribers WHERE email=$1`, [
      email,
    ])
  ).rows[0];
  assert.equal(row.status, "subscribed");
  assert.ok(row.confirmed_at);
  await store.subscriptionAction(unsubscribe, "unsubscribe");
  await assert.rejects(store.subscriptionAction(confirmation, "confirm"));
  await store.subscriptionAction(unsubscribe, "unsubscribe");
});
test("expired newsletter confirmation cannot subscribe an address", async () => {
  const email = `${randomUUID()}@example.com`;
  await store.subscribe(email, "https://pantry.example", mail.from);
  const payload = (
    await pool.query(
      `SELECT payload FROM ${schema}.mail WHERE payload->'to'->>0=$1`,
      [email],
    )
  ).rows[0].payload;
  await pool.query(
    `UPDATE ${schema}.subscribers SET expires_at=now()-interval '1 second' WHERE email=$1`,
    [email],
  );
  await assert.rejects(
    store.subscriptionAction(
      payload.text.match(/confirm#token=([a-f0-9]{64})/)[1],
      "confirm",
    ),
  );
});
test("persistent limits bound concurrent attempts and reset after expiry", async () => {
  const key = randomUUID();
  const results = await Promise.allSettled(
    Array.from({ length: 7 }, () => store.limit(key, 3)),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 3);
  await pool.query(
    `UPDATE ${schema}.rate_limits SET expires_at=now()-interval '1 second' WHERE key=$1`,
    [key],
  );
  await store.limit(key, 3);
});
test("email workers claim each message once and retry the immutable payload with the same key", async () => {
  await pool.query(`DELETE FROM ${schema}.mail`);
  const id = `mail-${randomUUID()}`;
  await store.enqueue(id, mail);
  let calls = 0;
  const send = async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 40));
    return "provider-test-id";
  };
  await Promise.all([drainMail(store, send), drainMail(store, send)]);
  assert.equal(calls, 1);
  await store.enqueue(id, { ...mail, text: "changed" });
  assert.equal((await drainMail(store, send)).sent, 0);
  const retry = `mail-${randomUUID()}`;
  await store.enqueue(retry, mail);
  assert.equal(
    (
      await drainMail(store, async () => {
        throw new Error("Timeout");
      })
    ).failed,
    1,
  );
  await pool.query(
    `UPDATE ${schema}.mail SET next_attempt_at=now() WHERE id=$1`,
    [retry],
  );
  await drainMail(store, async (payload, key) => {
    assert.equal(key, retry);
    assert.deepEqual(payload, mail);
    return "retried";
  });
  const old = `mail-${randomUUID()}`;
  await store.enqueue(old, mail);
  await pool.query(
    `UPDATE ${schema}.mail SET first_attempt_at=now()-interval '25 hours' WHERE id=$1`,
    [old],
  );
  await drainMail(store, async () => {
    assert.fail("Old uncertain messages must not be resent");
  });
  assert.equal(
    (await pool.query(`SELECT status FROM ${schema}.mail WHERE id=$1`, [old]))
      .rows[0].status,
    "review",
  );
  const expiredEmail = `${randomUUID()}@example.com`;
  await store.subscribe(expiredEmail, "https://pantry.example", mail.from);
  await pool.query(
    `UPDATE ${schema}.subscribers SET expires_at=now()-interval '1 second' WHERE email=$1`,
    [expiredEmail],
  );
  await drainMail(store, async () => {
    assert.fail("Expired subscription links must not be sent");
  });
  assert.equal(
    (
      await pool.query(
        `SELECT status FROM ${schema}.mail WHERE payload->'to'->>0=$1`,
        [expiredEmail],
      )
    ).rows[0].status,
    "review",
  );
});
test("reply address is saved with the original email and survives configuration changes", async () => {
  const id = `reply-${randomUUID()}`;
  const configured = new OperationsStore(pool, schema, "owner@example.com");
  await configured.enqueue(id, mail);
  const changed = new OperationsStore(pool, schema, "changed@example.com");
  await changed.enqueue(id, mail);
  const saved = await pool.query(
    `SELECT payload FROM ${schema}.mail WHERE id=$1`,
    [id],
  );
  assert.equal(saved.rows[0].payload.reply_to, "owner@example.com");
  const contactId = `reply-${randomUUID()}`;
  await configured.enqueue(contactId, {
    ...mail,
    reply_to: "customer@example.com",
  });
  const contact = await pool.query(
    `SELECT payload FROM ${schema}.mail WHERE id=$1`,
    [contactId],
  );
  assert.equal(contact.rows[0].payload.reply_to, "customer@example.com");
});
test("email transport fails closed without delivery opt-in", async () => {
  const old = process.env.EMAIL_DELIVERY_ENABLED;
  process.env.EMAIL_DELIVERY_ENABLED = "false";
  try {
    await assert.rejects(sendWithResend(mail, "test"), /disabled/);
  } finally {
    if (old === undefined) delete process.env.EMAIL_DELIVERY_ENABLED;
    else process.env.EMAIL_DELIVERY_ENABLED = old;
  }
});
test("stock updates reject stale edits and quantities below reservations", async () => {
  const variant = randomUUID();
  await owner.stock(variant, 10, null, "test-owner");
  await pool.query(
    `UPDATE ${schema}.stock SET reserved=4 WHERE variant_id=$1`,
    [variant],
  );
  await assert.rejects(
    owner.stock(variant, 12, { onHand: 10, reserved: 0 }, "test-owner"),
  );
  await assert.rejects(
    owner.stock(variant, 3, { onHand: 10, reserved: 4 }, "test-owner"),
  );
  await owner.stock(variant, 6, { onHand: 10, reserved: 4 }, "test-owner");
  const row = (
    await pool.query(`SELECT * FROM ${schema}.stock WHERE variant_id=$1`, [
      variant,
    ])
  ).rows[0];
  assert.equal(row.on_hand, 6);
  assert.equal(row.reserved, 4);
});
test("fulfillment requires a paid order and concurrent retries create one audit entry", async () => {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO ${schema}.orders(id,cart_hash,quote,stripe_params) VALUES($1,'test','{}','{}')`,
    [id],
  );
  await assert.rejects(owner.fulfill(id, "test-owner"));
  await pool.query(`UPDATE ${schema}.orders SET status='paid' WHERE id=$1`, [
    id,
  ]);
  await Promise.all([
    owner.fulfill(id, "test-owner"),
    owner.fulfill(id, "test-owner"),
  ]);
  assert.ok(
    (
      await pool.query(
        `SELECT fulfilled_at FROM ${schema}.orders WHERE id=$1`,
        [id],
      )
    ).rows[0].fulfilled_at,
  );
  assert.equal(
    (
      await pool.query(
        `SELECT * FROM ${schema}.owner_audit WHERE action='fulfill' AND reference=$1`,
        [id],
      )
    ).rowCount,
    1,
  );
});
