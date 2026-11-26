BEGIN;

-- Nullable so existing Subjects and inserts without a description remain valid.
ALTER TABLE subjects
    ADD COLUMN description text,
    ADD CONSTRAINT subjects_description_nonempty
        CHECK (description IS NULL OR btrim(description) <> '');

COMMIT;
