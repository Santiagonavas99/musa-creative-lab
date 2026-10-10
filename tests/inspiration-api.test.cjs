"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const handler = require("../api/inspiration.js");

async function request(query, method = "GET") {
  const headers = {};
  const response = {
    statusCode: 200,
    body: null,
    setHeader(name, value) { headers[name.toLowerCase()] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await handler({ method, query }, response);
  return { status: response.statusCode, body: response.body, headers };
}

function mockFetch(t, callback) {
  const original = global.fetch;
  global.fetch = callback;
  t.after(() => { global.fetch = original; });
}

function mockEnv(t, key) {
  const previous = process.env.UNSPLASH_ACCESS_KEY;
  if (key === null) delete process.env.UNSPLASH_ACCESS_KEY;
  else process.env.UNSPLASH_ACCESS_KEY = key;
  t.after(() => {
    if (previous === undefined) delete process.env.UNSPLASH_ACCESS_KEY;
    else process.env.UNSPLASH_ACCESS_KEY = previous;
  });
}

test("only GET requests are accepted and response carries safety headers", async () => {
  const result = await request({ q: "collage" }, "POST");
  assert.equal(result.status, 405);
  assert.equal(result.headers["x-content-type-options"], "nosniff");
  assert.match(result.body.error, /Método no permitido/);
});

test("query and provider are validated before any upstream request", async (t) => {
  mockFetch(t, () => { throw new Error("Network must not be called"); });
  const tooShort = await request({ q: "a", source: "unsplash" });
  const wrongSource = await request({ q: "collage", source: "invalid-provider" });
  assert.equal(tooShort.status, 400);
  assert.equal(wrongSource.status, 400);
  assert.match(wrongSource.body.error, /Fuente no disponible/);
});

test("Unsplash cannot be requested without a configured server key", async (t) => {
  mockEnv(t, null);
  mockFetch(t, () => { throw new Error("Network must not be called"); });
  const response = await request({ q: "collage", source: "unsplash" });
  assert.equal(response.status, 503);
  assert.match(response.body.error, /Unsplash no está habilitado/);
});

test("Unsplash response normalizes URLs, attribution and never exposes API key", async (t) => {
  mockEnv(t, "test-only-key-not-real");
  const calls = [];
  mockFetch(t, async (url, options) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      json: async () => ({
        results: [
          {
            id: "photo-1",
            alt_description: "<b>Color study</b>",
            urls: { small: "https://images.unsplash.com/photo-1" },
            links: {
              html: "https://unsplash.com/photos/photo-1",
              download_location: "https://api.unsplash.com/photos/photo-1/download",
            },
            user: { name: "Creator", links: { html: "https://unsplash.com/@creator" } },
          },
          {
            id: "photo-unsafe",
            urls: { small: "javascript:alert(1)" },
            links: { html: "http://example.test/unsafe" },
          },
        ],
      }),
    };
  });
  const response = await request({ q: "color study", source: "unsplash" });
  assert.equal(response.status, 200);
  assert.equal(response.body.partial, false);
  assert.equal(response.body.results.length, 1);
  assert.equal(response.body.results[0].title, "Color study");
  assert.equal(response.body.results[0].creator, "Creator");
  assert.match(response.body.results[0].link, /^https:\/\/unsplash\.com\/photos\/photo-1\?/);
  assert.match(response.body.results[0].link, /utm_source=musa_creative_lab/);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /query=color%20study/);
  assert.equal(calls[0].options.headers.Authorization, "Client-ID test-only-key-not-real");
  assert.doesNotMatch(JSON.stringify(response.body), /test-only-key-not-real/);
});

test("all-sources mode returns partial status when a provider is unavailable", async (t) => {
  mockEnv(t, null);
  mockFetch(t, async (url) => {
    const value = String(url);
    if (value.includes("collectionapi.metmuseum.org")) return { ok: true, json: async () => ({ objectIDs: [] }) };
    if (value.includes("api.artic.edu")) return { ok: true, json: async () => ({ data: [] }) };
    if (value.includes("commons.wikimedia.org")) return { ok: true, json: async () => ({ query: { pages: [] } }) };
    throw new Error("Unexpected upstream provider: " + value);
  });
  const response = await request({ q: "abstract art", source: "all" });
  assert.equal(response.status, 200);
  assert.equal(response.body.partial, true);
  assert.deepEqual(response.body.results, []);
});
