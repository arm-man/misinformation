-- Run after 003_migration_add_subject_description.sql.
-- Update existing Subjects by exact title; do not create new Subjects.
BEGIN;

UPDATE subjects AS subject
SET description = descriptions.description
FROM (VALUES
    ('Donald Trump', 'Donald Trump''s statements, policies, and political record.'),
    ('Crime', 'Crime rates, policing, and gun violence.'),
    ('Kilmar Abrego Garcia', 'Kilmar Abrego Garcia''s deportation, legal case, and public debate.'),
    ('Energy', 'Energy sources, costs, and environmental impacts.'),
    ('Health & Medicine', 'Medical treatments, public health, and scientific evidence.'),
    ('Society & Culture', 'Social trends, cultural debates, and everyday beliefs.'),
    ('Women', 'Women''s rights, health, and experiences in society.'),
    ('COVID-19', 'COVID-19, vaccines, and public health responses.'),
    ('Taxes & Government Spending', 'Taxes, public budgets, and how government funds are spent.')
) AS descriptions(title, description)
WHERE subject.title = descriptions.title;

COMMIT;
