// lib/db.ts
// طبقة قاعدة بيانات بسيطة جداً — بدون ORM.
// - في التطوير المحلي (بدون DATABASE_URL): تستخدم SQLite ملف محلي (dev.db).
// - في الإنتاج على Vercel (مع DATABASE_URL): تستخدم Vercel Postgres.
//
// جدول واحد فقط: subscribers
// نخزن حالة الاشتراك بالإيميل، مربوطة بـ subscription_id من Lemon Squeezy.

export type Subscriber = {
  email: string;
  subscription_id: string;
  status: "active" | "cancelled" | "expired" | "past_due";
  renews_at: string | null;
  created_at: string;
  updated_at: string;
};

const isProd = !!process.env.DATABASE_URL;

// ---------- Postgres (إنتاج) ----------
async function pgQuery(sql: string, params: any[] = []) {
  const { sql: vercelSql } = await import("@vercel/postgres");
  return vercelSql.query(sql, params);
}

async function ensureTablePg() {
  await pgQuery(`
    CREATE TABLE IF NOT EXISTS subscribers (
      email TEXT PRIMARY KEY,
      subscription_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      renews_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

// ---------- SQLite (تطوير محلي) ----------
let sqliteDb: any = null;
function getSqlite() {
  if (sqliteDb) return sqliteDb;
  // استيراد ديناميكي حتى لا يفشل البناء على بيئات بدون better-sqlite3
  const Database = require("better-sqlite3");
  sqliteDb = new Database("dev.db");
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      email TEXT PRIMARY KEY,
      subscription_id TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      renews_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return sqliteDb;
}

// ---------- واجهة موحدة ----------

export async function upsertSubscriber(data: {
  email: string;
  subscription_id: string;
  status: Subscriber["status"];
  renews_at: string | null;
}) {
  if (isProd) {
    await ensureTablePg();
    await pgQuery(
      `INSERT INTO subscribers (email, subscription_id, status, renews_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (email) DO UPDATE SET
         subscription_id = EXCLUDED.subscription_id,
         status = EXCLUDED.status,
         renews_at = EXCLUDED.renews_at,
         updated_at = NOW();`,
      [data.email, data.subscription_id, data.status, data.renews_at]
    );
  } else {
    const db = getSqlite();
    db.prepare(
      `INSERT INTO subscribers (email, subscription_id, status, renews_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(email) DO UPDATE SET
         subscription_id = excluded.subscription_id,
         status = excluded.status,
         renews_at = excluded.renews_at,
         updated_at = CURRENT_TIMESTAMP;`
    ).run(data.email, data.subscription_id, data.status, data.renews_at);
  }
}

export async function getSubscriberByEmail(
  email: string
): Promise<Subscriber | null> {
  if (isProd) {
    await ensureTablePg();
    const result = await pgQuery(
      `SELECT * FROM subscribers WHERE email = $1 LIMIT 1;`,
      [email]
    );
    return (result.rows[0] as Subscriber) || null;
  } else {
    const db = getSqlite();
    const row = db
      .prepare(`SELECT * FROM subscribers WHERE email = ? LIMIT 1;`)
      .get(email);
    return (row as Subscriber) || null;
  }
}

// اشتراك فعّال = status active وما زال renews_at (أو بدون تاريخ انتهاء معروف) في المستقبل أو غير محدد
export function isActiveSubscriber(sub: Subscriber | null): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  if (sub.renews_at) {
    return new Date(sub.renews_at).getTime() > Date.now();
  }
  return true;
}

// ============================================================
// جدول deals — يخزّن العروض الحقيقية اللي يجيبها الـ cron تلقائياً
// كل صف له source:
//   - "seed_free"   → عينات مجانية ثابتة، لا تُحذف أبداً
//   - "seed_locked" → عروض وهمية مؤقتة تظهر فقط قبل أول تشغيل ناجح للـ cron
//   - "aliexpress" / "amazon" / ...  → عروض حقيقية جاية من مصدر تلقائي
//   - "manual"      → عروض أضفتها أنت يدوياً (لن يحذفها الـ cron)
// ============================================================

export type DealRow = {
  id: string;
  title: string;
  store: string;
  original_price: number;
  discounted_price: number;
  currency: string;
  image_url: string;
  direct_url: string;
  is_free: boolean;
  source: string;
  updated_at: string;
};

async function ensureDealsTablePg() {
  await pgQuery(`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      store TEXT NOT NULL,
      original_price NUMERIC NOT NULL,
      discounted_price NUMERIC NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      image_url TEXT,
      direct_url TEXT NOT NULL,
      is_free BOOLEAN NOT NULL DEFAULT false,
      source TEXT NOT NULL DEFAULT 'manual',
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

function ensureDealsTableSqlite() {
  const db = getSqlite();
  db.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      store TEXT NOT NULL,
      original_price REAL NOT NULL,
      discounted_price REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      image_url TEXT,
      direct_url TEXT NOT NULL,
      is_free INTEGER NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'manual',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function upsertDeal(d: Omit<DealRow, "updated_at">) {
  if (isProd) {
    await ensureDealsTablePg();
    await pgQuery(
      `INSERT INTO deals (id, title, store, original_price, discounted_price, currency, image_url, direct_url, is_free, source, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, store = EXCLUDED.store,
         original_price = EXCLUDED.original_price, discounted_price = EXCLUDED.discounted_price,
         currency = EXCLUDED.currency, image_url = EXCLUDED.image_url,
         direct_url = EXCLUDED.direct_url, is_free = EXCLUDED.is_free,
         source = EXCLUDED.source, updated_at = NOW();`,
      [d.id, d.title, d.store, d.original_price, d.discounted_price, d.currency, d.image_url, d.direct_url, d.is_free, d.source]
    );
  } else {
    ensureDealsTableSqlite();
    getSqlite()
      .prepare(
        `INSERT INTO deals (id, title, store, original_price, discounted_price, currency, image_url, direct_url, is_free, source, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title, store=excluded.store,
           original_price=excluded.original_price, discounted_price=excluded.discounted_price,
           currency=excluded.currency, image_url=excluded.image_url,
           direct_url=excluded.direct_url, is_free=excluded.is_free,
           source=excluded.source, updated_at=CURRENT_TIMESTAMP;`
      )
      .run(d.id, d.title, d.store, d.original_price, d.discounted_price, d.currency, d.image_url, d.direct_url, d.is_free ? 1 : 0, d.source);
  }
}

export async function deleteDealsBySource(source: string) {
  if (isProd) {
    await ensureDealsTablePg();
    await pgQuery(`DELETE FROM deals WHERE source = $1;`, [source]);
  } else {
    ensureDealsTableSqlite();
    getSqlite().prepare(`DELETE FROM deals WHERE source = ?;`).run(source);
  }
}

export async function countDeals(): Promise<number> {
  if (isProd) {
    await ensureDealsTablePg();
    const r = await pgQuery(`SELECT COUNT(*)::int AS c FROM deals;`);
    return r.rows[0]?.c ?? 0;
  } else {
    ensureDealsTableSqlite();
    const row = getSqlite().prepare(`SELECT COUNT(*) AS c FROM deals;`).get();
    return row?.c ?? 0;
  }
}

export async function getAllDealsFromDb(): Promise<DealRow[]> {
  if (isProd) {
    await ensureDealsTablePg();
    const r = await pgQuery(`SELECT * FROM deals ORDER BY updated_at DESC;`);
    return r.rows as DealRow[];
  } else {
    ensureDealsTableSqlite();
    const rows = getSqlite().prepare(`SELECT * FROM deals ORDER BY updated_at DESC;`).all();
    return (rows as any[]).map((r) => ({ ...r, is_free: !!r.is_free }));
  }
}
