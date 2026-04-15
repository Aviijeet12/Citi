const assert = require("node:assert/strict");
const test = require("node:test");

const { _internal } = require("../index");

const { canReadJob, fetchSummaryReport } = _internal;

test("ADMIN can read any async job", () => {
  const actor = { id: "admin-1", role: "ADMIN" };
  const job = { id: "job-1", requested_by: "user-1" };

  assert.equal(canReadJob(actor, job), true);
});

test("Request owner can read their async job", () => {
  const actor = { id: "user-1", role: "USER" };
  const job = { id: "job-1", requested_by: "user-1" };

  assert.equal(canReadJob(actor, job), true);
});

test("Non-admin cannot read someone else's async job", () => {
  const actor = { id: "user-2", role: "MANAGER" };
  const job = { id: "job-1", requested_by: "user-1" };

  assert.equal(canReadJob(actor, job), false);
});

test("Summary report query returns first row payload", async () => {
  const queries = [];
  const client = {
    async query(sql) {
      queries.push(sql);
      return {
        rowCount: 1,
        rows: [{ active_users: 5, teams: 2 }],
      };
    },
  };

  const summary = await fetchSummaryReport(client);

  assert.deepEqual(summary, { active_users: 5, teams: 2 });
  assert.equal(queries.length, 1);
  assert.match(String(queries[0]), /SELECT/i);
});
