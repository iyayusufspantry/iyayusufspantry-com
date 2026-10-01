import { OperationsStore, tokenHash } from "./store";
import { OperationError, storyInput } from "./validation";

export type PublicStory = {
  id: string;
  name: string;
  title: string;
  story: string;
};
export type ReviewStory = PublicStory & {
  email: string;
  status: "pending" | "published" | "declined";
  version: number;
  created_at: string;
};

export class StoryStore extends OperationsStore {
  async submit(input: ReturnType<typeof storyInput>) {
    const fingerprint = tokenHash(JSON.stringify(input));
    return this.transaction(async (db) => {
      const result = await db.query(
        `INSERT INTO ${this.schema}.stories(id,fingerprint,name,email,title,story,consent_version)
         VALUES ($1,$2,$3,$4,$5,$6,'story-v1') ON CONFLICT DO NOTHING RETURNING id`,
        [
          input.id,
          fingerprint,
          input.name,
          input.email,
          input.title,
          input.story,
        ],
      );
      if (!result.rowCount) {
        const existing = await db.query(
          `SELECT fingerprint FROM ${this.schema}.stories WHERE id=$1`,
          [input.id],
        );
        if (existing.rows[0]?.fingerprint !== fingerprint)
          throw new OperationError(409, "Your story changed. Submit it again.");
      }
    });
  }
  async published() {
    // Keep private email, moderation details, and unpublished text out of public responses.
    return (
      await this.pool.query<PublicStory>(
        `SELECT id,name,title,story FROM ${this.schema}.stories WHERE status='published' ORDER BY published_at DESC,id LIMIT 50`,
      )
    ).rows;
  }
  async reviewQueue(status: ReviewStory["status"], page: number) {
    return (
      await this.pool.query<ReviewStory>(
        `SELECT id,name,email,title,story,status,version,created_at FROM ${this.schema}.stories WHERE status=$1 ORDER BY created_at DESC,id LIMIT 25 OFFSET $2`,
        [status, page * 25],
      )
    ).rows;
  }
  async moderate(
    id: string,
    status: ReviewStory["status"],
    version: number,
    actor: string,
  ) {
    if (
      !["pending", "published", "declined"].includes(status) ||
      !Number.isSafeInteger(version) ||
      version < 1
    )
      throw new OperationError(400, "Invalid story review.");
    const result = await this.pool.query(
      `UPDATE ${this.schema}.stories SET status=$2,version=version+1,reviewed_by=$4,reviewed_at=now(),published_at=CASE WHEN $2='published' THEN now() ELSE NULL END WHERE id=$1 AND version=$3 RETURNING id`,
      [id, status, version, actor],
    );
    if (!result.rowCount)
      throw new OperationError(
        409,
        "This story changed. Refresh before reviewing it again.",
      );
  }
}
