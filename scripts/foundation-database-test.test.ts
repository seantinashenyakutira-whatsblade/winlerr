import { beforeAll, describe, expect, it } from "vitest";
import { createServerClient, type DatabaseClient } from "../packages/database/src/client.ts";

const testSupabaseUrl = process.env.TEST_SUPABASE_URL;
const testSupabaseKey = process.env.TEST_SUPABASE_ANON_KEY;

if (!testSupabaseUrl || !testSupabaseKey) {
  console.warn("TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY not set. Skipping foundation database tests.");
  // We still define the tests but they will be skipped if the client cannot be created.
}

let client: DatabaseClient;

beforeAll(async () => {
  if (!testSupabaseUrl || !testSupabaseKey) {
    return;
  }
  client = createServerClient({
    supabaseUrl: testSupabaseUrl,
    supabaseKey: testSupabaseKey,
  });
});

describe("Foundation database setup", () => {
  if (!testSupabaseUrl || !testSupabaseKey) {
    it.skip("Skipping foundation database tests because TEST_SUPABASE_URL and TEST_SUPABASE_ANON_KEY are not set", () => {
      // This test is skipped
    });
    return;
  }

  it("should have organizations table with correct columns", async () => {
    const { data, error } = await client
      .from("organizations")
      .select("id, slug, name, contact_email, contact_phone, business_type, industry, country, timezone, billing_status, metadata, created_at, updated_at")
      .limit(1);

    expect(error).toBeNull();
    // We don't expect any data necessarily, but the query should succeed
    // If the table doesn't exist, we'll get an error
  });

  it("should have memberships table with correct columns", async () => {
    const { data, error } = await client
      .from("memberships")
      .select("id, user_id, organization_id, role, created_at, updated_at")
      .limit(1);

    expect(error).toBeNull();
  });

  it("should have product_catalogue table with correct columns", async () => {
    const { data, error } = await client
      .from("product_catalogue")
      .select("id, organization_id, sku, name, description, price, currency, metadata, active, created_at, updated_at")
      .limit(1);

    expect(error).toBeNull();
  });

  it("should have product_requests table with correct columns", async () => {
    const { data, error } = await client
      .from("product_requests")
      .select("id, organization_id, product_id, requester_name, requester_email, requester_company, requirements, status, created_at, updated_at")
      .limit(1);

    expect(error).toBeNull();
  });

  it("should have leads table with correct columns", async () => {
    const { data, error } = await client
      .from("leads")
      .select("id, organization_id, name, email, company, title, source, tags, status, priority, qualification_score, created_at, updated_at")
      .limit(1);

    expect(error).toBeNull();
  });

  it("should have lead_events table with correct columns", async () => {
    const { data, error } = await client
      .from("lead_events")
      .select("id, lead_id, organization_id, event_type, description, metadata, created_at")
      .limit(1);

    expect(error).toBeNull();
  });

  it("should have lead_responses table with correct columns", async () => {
    const { data, error } = await client
      .from("lead_responses")
      .select("id, lead_id, organization_id, content, status, approved_by, approved_at, created_at, updated_at")
      .limit(1);

    expect(error).toBeNull();
  });

  it("should have RLS enabled on organizations table", async () => {
    // Check if row level security is enabled via the pg_class table
    const { data, error } = await client
      .from("pg_class")
      .select("relrowsecurity")
      .eq("relname", "organizations")
      .single();

    expect(error).toBeNull();
    expect(data?.relrowsecurity).toBe(true);
  });

  it("should have RLS enabled on memberships table", async () => {
    const { data, error } = await client
      .from("pg_class")
      .select("relrowsecurity")
      .eq("relname", "memberships")
      .single();

    expect(error).toBeNull();
    expect(data?.relrowsecurity).toBe(true);
  });

  it("should have RLS enabled on product_catalogue table", async () => {
    const { data, error } = await client
      .from("pg_class")
      .select("relrowsecurity")
      .eq("relname", "product_catalogue")
      .single();

    expect(error).toBeNull();
    expect(data?.relrowsecurity).toBe(true);
  });

  it("should have RLS enabled on product_requests table", async () => {
    const { data, error } = await client
      .from("pg_class")
      .select("relrowsecurity")
      .eq("relname", "product_requests")
      .single();

    expect(error).toBeNull();
    expect(data?.relrowsecurity).toBe(true);
  });

  it("should have RLS enabled on leads table", async () => {
    const { data, error } = await client
      .from("pg_class")
      .select("relrowsecurity")
      .eq("relname", "leads")
      .single();

    expect(error).toBeNull();
    expect(data?.relrowsecurity).toBe(true);
  });

  it("should have RLS enabled on lead_events table", async () => {
    const { data, error } = await client
      .from("pg_class")
      .select("relrowsecurity")
      .eq("relname", "lead_events")
      .single();

    expect(error).toBeNull();
    expect(data?.relrowsecurity).toBe(true);
  });

  it("should have RLS enabled on lead_responses table", async () => {
    const { data, error } = await client
      .from("pg_class")
      .select("relrowsecurity")
      .eq("relname", "lead_responses")
      .single();

    expect(error).toBeNull();
    expect(data?.relrowsecurity).toBe(true);
  });

  // Test that we can insert a test organization and then only see it when using the same organization context
  // This requires setting up a test user and membership, which is more complex.
  // We'll skip the full RLS policy test for now and just check that the policies exist in the next test.

  it("should have RLS policies on organizations table", async () => {
    const { data, error } = await client
      .from("pg_policies")
      .select("tablename, policyname, permissive, roles, cmd, qual")
      .eq("tablename", "organizations");

    expect(error).toBeNull();
    // We expect at least one policy
    expect(data.length).toBeGreaterThan(0);
  });

  it("should have RLS policies on memberships table", async () => {
    const { data, error } = await client
      .from("pg_policies")
      .select("tablename, policyname, permissive, roles, cmd, qual")
      .eq("tablename", "memberships");

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it("should have RLS policies on product_catalogue table", async () => {
    const { data, error } = await client
      .from("pg_policies")
      .select("tablename, policyname, permissive, roles, cmd, qual")
      .eq("tablename", "product_catalogue");

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it("should have RLS policies on product_requests table", async () => {
    const { data, error } = await client
      .from("pg_policies")
      .select("tablename, policyname, permissive, roles, cmd, qual")
      .eq("tablename", "product_requests");

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it("should have RLS policies on leads table", async () => {
    const { data, error } = await client
      .from("pg_policies")
      .select("tablename, policyname, permissive, roles, cmd, qual")
      .eq("tablename", "leads");

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it("should have RLS policies on lead_events table", async () => {
    const { data, error } = await client
      .from("pg_policies")
      .select("tablename, policyname, permissive, roles, cmd, qual")
      .eq("tablename", "lead_events");

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it("should have RLS policies on lead_responses table", async () => {
    const { data, error } = await client
      .from("pg_policies")
      .select("tablename, policyname, permissive, roles, cmd, qual")
      .eq("tablename", "lead_responses");

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });
});