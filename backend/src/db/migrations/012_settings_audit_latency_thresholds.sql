ALTER TABLE IF EXISTS settings
    ADD COLUMN IF NOT EXISTS audit_latency_good_max_ms INTEGER NOT NULL DEFAULT 300,
    ADD COLUMN IF NOT EXISTS audit_latency_warn_max_ms INTEGER NOT NULL DEFAULT 800;

ALTER TABLE IF EXISTS settings
    DROP CONSTRAINT IF EXISTS settings_audit_latency_thresholds_check;

ALTER TABLE IF EXISTS settings
    ADD CONSTRAINT settings_audit_latency_thresholds_check
    CHECK (
        audit_latency_good_max_ms >= 50
        AND audit_latency_warn_max_ms >= 100
        AND audit_latency_warn_max_ms > audit_latency_good_max_ms
    );