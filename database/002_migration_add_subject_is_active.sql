BEGIN;

ALTER TABLE subjects
    ADD COLUMN is_active boolean NOT NULL DEFAULT false;

COMMIT;
