#!/usr/bin/env node

const strict = process.argv.includes("--strict");
const value = String(process.env.DATABASE_URL_VALUE || "").trim();

const fail = () => {
  console.log('{"databaseUrlParse":"failed"}');
  if (strict) {
    process.exit(1);
  }
};

if (!value) {
  fail();
  process.exit(0);
}

try {
  const url = new URL(value);
  const database = (url.pathname || "").replace(/^\//, "") || null;
  const sslmode = url.searchParams.get("sslmode");

  console.log(
    JSON.stringify(
      {
        protocol: url.protocol.replace(":", "") || null,
        host: url.hostname || null,
        port: url.port || null,
        database,
        sslmode: sslmode || null
      },
      null,
      2
    )
  );
} catch {
  fail();
}
