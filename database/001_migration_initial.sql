BEGIN;

CREATE TABLE students (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key text NOT NULL UNIQUE,
    email text,
    created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE subjects (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    CONSTRAINT subjects_title_nonempty CHECK (btrim(title) <> '')
);

CREATE TABLE questions (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_id integer NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    short_title text NOT NULL,
    question_text text NOT NULL,
    choice1 text NOT NULL,
    choice2 text NOT NULL,
    choice3 text,
    choice4 text,
    answer integer NOT NULL,
    explanation text NOT NULL,
    why_it_spreads text NOT NULL,
    sources text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    CONSTRAINT questions_short_title_nonempty CHECK (btrim(short_title) <> ''),
    CONSTRAINT questions_question_text_nonempty CHECK (btrim(question_text) <> ''),
    CONSTRAINT questions_choice1_nonempty CHECK (btrim(choice1) <> ''),
    CONSTRAINT questions_choice2_nonempty CHECK (btrim(choice2) <> ''),
    CONSTRAINT questions_choice3_nonempty CHECK (choice3 IS NULL OR btrim(choice3) <> ''),
    CONSTRAINT questions_choice4_nonempty CHECK (choice4 IS NULL OR btrim(choice4) <> ''),
    CONSTRAINT questions_answer_range CHECK (answer BETWEEN 1 AND 4),
    CONSTRAINT questions_answer_has_choice CHECK (
        (answer <> 3 OR choice3 IS NOT NULL)
        AND (answer <> 4 OR choice4 IS NOT NULL)
    ),
    CONSTRAINT questions_choice4_requires_choice3 CHECK (choice4 IS NULL OR choice3 IS NOT NULL),
    CONSTRAINT questions_explanation_nonempty CHECK (btrim(explanation) <> ''),
    CONSTRAINT questions_why_it_spreads_nonempty CHECK (btrim(why_it_spreads) <> ''),
    CONSTRAINT questions_sources_nonempty CHECK (btrim(sources) <> '')
);

CREATE TABLE sessions (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id integer NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    subject_id integer NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    completed_at timestamptz,
    CONSTRAINT sessions_student_subject_unique UNIQUE (student_id, subject_id)
);

CREATE TABLE session_questions (
    session_id integer NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
    question_id integer NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    position integer NOT NULL,
    choice integer,
    CONSTRAINT session_questions_pkey PRIMARY KEY (session_id, question_id),
    CONSTRAINT session_questions_session_position_unique UNIQUE (session_id, position),
    CONSTRAINT session_questions_position_positive CHECK (position >= 1),
    CONSTRAINT session_questions_choice_range CHECK (choice BETWEEN 0 AND 4)
);

CREATE TABLE general_feedback (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id integer NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    feedback text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT general_feedback_nonempty CHECK (btrim(feedback) <> '')
);

CREATE TABLE question_feedback (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id integer NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    question_id integer NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    feedback text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT question_feedback_nonempty CHECK (btrim(feedback) <> '')
);

CREATE TABLE logs (
    severity text NOT NULL DEFAULT 'error',
    message text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT logs_severity_valid CHECK (severity IN ('error', 'warning', 'info'))
);

COMMIT;
