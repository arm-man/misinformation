# Misinformation Examination Product Specification

## Overview

Misinformation Examination is a mobile-friendly, web-based questionnaire website about commonly held misconceptions with an emphasis on political or media misinformation.
Primary user goal: answer questions to discover potential biases and misinformation that the user may hold. It is easy to see others being deceived by misinformation, but what about you?

## Color Palette
Misinformation Examination’s palette is a warm neutral base with blue and brown accents:
Page background #F7F3ED
Surface         #FCFAF7
Primary blue    #315A78
Primary hover   #274A64
Selection       #EAF2F7
Accent brown    #7A5A40
Soft accent     #EFE6DC
Main text       #2F3133
Muted text      #6D6A66
Border          #D8D0C7
Error           #963F36
These values should be defined in globals.css.

## Terminology

- **Student**: the person using Misinformation Examination.
- **Guest**: a Student without an email address.
- **Key**: a 16-character key using randomBytes(8).toString("hex") that is assumed to be unique.
- **Question**: a prompt presented to the Student.
- **Answer**: the correct answer to the Question.
- **Choices**: the multiple options available for the Student to select as their Guess, inlcuding "I don't know / Skip".
- **Guess**: the Student's selected Choice.
- **Skip**: A Student may Skip a Question, which counts toward examination progress.
- **Subject**: a topic containing Questions, e.g. `Climate Change`.
- **Session**: Questions from one Subject for one Student. All Questions related to the Subject will be asked for the Student's Session.

## Email Address Entry

- At the top of the email section, explain to the Student that to save results and to receive future notifications of new examinations, they should enter an email address.
- This section will have a text field for an email address and a Submit button.
- If a valid email address is provided, the Submit button shall be enabled, otherwise disabled.
- When the Submit button is clicked or the Enter button is pressed:
  - If there is no browser cookie, create a new Student in the student table with a Key and save the Key in the cookie and in the student table.
  - Add the email address to the Student in the database.
  - Show a message that the email has been saved and that they will be notified when new Subjects are available.
  - Record the event in the log table.

## Cookie
- Store the Key in a browser cookie to link the browser's session to a Student.
- On insertion of the Key to the server/database, if a Key collision occurs, the application will generate a replacement key and retry the insertion.
- The cookie shall have an expiration of 365 days.

## Wordmark

- The Misinformation Examination wordmark shall display in the upper left of every page.
- Clicking the wordmark will redirect the student to the Landing Page, or reload the page if they are already on the Landing Page.

## Landing Page

- A brief explanation of the website's purpose and the examination.
- A highlighted section to start a Session:
  - Show the different Subjects - a visual identifier will differentiate between completed Subjects, Subjects already in progress, and Subject that have not been started.
    - A Subject with no Questions associated with it will be omitted.
  - When a Subject is clicked:
    - If there is no browser cookie, create a new Student in the student table with a Key and save the Key in the cookie.
    - Either start a new Session, resume the Session, or redirect the Student to the Session Complete page.
- A section to enter an email address if there is no browser cookie or the Key is associated with a Guest.
  - When a valid email address is submitted, associate the email address with the Guest or create a new Student with the associated email address.
- Below the email section, show a share prompt and a button that copies the public Landing Page URL. Briefly show "Link copied!" beside the button after copying.
- A longer explanation about why the page exists, the goals of Misinformation Examination, and the difficulty about truth.

## Session Examination

- The requesting Student must own the Session.
- A Question is associated with one Subject.
- A Session is associated with one Student and one Subject.
- When starting a Session, add a new entry to the session database table and add all of the Session's questions in random order to the session_questions table.
- A Session contains the questions assigned when it starts. Later additions to a Subject do not change an existing Session.
- The Session page will have the following content:
  - A section showing info about the Session:
    - The Subject.
    - The Session progress, `15 of 20 answered · 5 skipped`.
      - The first number is the number of Questions answered with a non-Skip Choice. Skips are shown only in the last number.
      - The second number is the total number of Questions in the Session.
      - The last number is the number of Questions that were Skipped.
    - A section for the Q&A:
      - The Question.
      - An area to display the Choices, where only one Choice may be selected as the Guess.
      - One of the choices should be **I don't know / Skip**, unless instructions explicitly say to omit the choice.
	    - the **I don't know / Skip** choice should be slightly offset from the other Choices to note that it is special.
    - A **Previous** button, left justified, will display the previous Question along with the Student's Guess highlighted.
    - A **Finish Examination** button, center justified, is shown when every Question in the Session has a recorded Guess.
    - A **Next** button, right justified, is shown only if the Question has a Guess. The button is never displayed on the last Question.

- Upon starting a Session, a new Question is selected.
- Question order was predetermined at the start of the Session.
- When the Student selects a Choice for the first time, record the result in the database, then proceed to the next Question (auto-advance) unless it is the last Question.
- When the Student updates a saved Choice, record the result in the database and stay on the current Question.
- When the Student clicks **Finish Examination**, verify that every session_questions has a non-NULL Choice, add the timestamp to the completed_at field of the session table, and redirect the Student to the Session Complete page.
- On a page refresh/reload, set the Question to the first Question without a Guess or show the last Question.
- For errors returned by the server, show a short error message, preserve the selection, and do not auto-advance.
- Choice 0 is allowed only when the Question is skippable.
- Guesses can be changed only while the Session is active.
- A Student can only have one Session for a Subject, whether that Session is active or complete. A Student cannot retake the Questions for a Subject.

## Session Complete

The Session end screen will display:
- Confirmation that the Session has ended.
- Show the Session's Subject and completion date.
- Show the Session results: Number of questions correct, number of questions incorrect, and the number of questions Skipped.
- Show a table with the following columns: Question, Answer, Guess. The table is sorted by the Question order stored in session_questions.
  - The Question column will be a shortened version of the Question to prevent horizontal scrolling on narrow displays such as mobile devices, e.g. "Top 1% share of income tax" on the question about taxes.
  - If the Question was Skipped, the Guess cell will be populated with 'Skipped'.
  - The row will be highlighted in light red if the Guess was incorrect.
  - All Questions are clickable/tappable and direct the Student to the Question Page for the question clicked/tapped.
- A feedback description, something to the effect of "We would love to hear from you", along with a button that will redirect the Student to the Feedback page.
- A section to enter an email address if the Key is associated with a Guest.

- Record the Session Complete event in the log table.
- If the Session Complete page is loaded but the Session is not complete, redirect the Student to the Session Examination page.
- The page should be retrieved via a Server Component, not an API

## Question Page

Preserve the session context when opening a Question page so it displays the correct Guess.
The Question page will have the following content:
- Question, Answer, and Guess.
- A pane titled "Ask AI about this question" with buttons for ChatGPT, Gemini, Claude, Grok, and Perplexity.
  - Clicking one of the buttons redirects to the associated website and pre-populates the question.
  - If a provider has no confirmed prompt-prefill link, copy the Question, open that provider, and display a "Question copied" message.
  - Have a button to copy the Question for AI websites that do not allow pre-populating the question.
- A pane providing an explanation of the Answer.
- A pane titled "Why this misconception spreads" with a paragraph about why people may have been misled.
- A pane showing the sources used for the Question.
- A question feedback area containing an on/off slider to report an issue with this question.
  - When set to 'on' a text area appears along with a Submit button.
    - Above the text area, display a note that the feedback should be descriptive and helpful.
    - The Submit button will be disabled until 5 characters have been added to the text area.
    - Let Enter insert a newline in feedback text area rather than act as clicking the Submit button.
    - Record the feedback in the question_feedback table of the database.
    - Display a note saying thank you for the feedback.
 
## Feedback Page

If feedback is submitted without a Student cookie, create a Guest and set the Student cookie.

The Feedback page will have the following content:
- A section to enter an email address if the Key is associated with a Guest.
  - Display a note: "Add an email address to receive a response about your feedback."
- A text area to enter the feedback along with a submission button.
  - If the Student is a Guest, the submission button's title shall be "Submit Anonymously", otherwise the submission button's title shall be "Submit"
  - Let Enter insert a newline in feedback text area rather than act as clicking the Submit button.
  - When the Submit button is clicked:
- Record the feedback in the general_feedback table of the database.
- Display a note saying thank you for the feedback.

## Log and Feedback Notification

- Whenever an entry is added to the log, question_feedback, or general_feedback tables, an email is sent to LOG_EMAIL_TO with details of the event.
- All logging is best effort: a problem with adding a log message must not prevent the code from continuing as expected.

## Administration Area

- Provide a password-protected Administration area within the existing website for adding and editing Questions. Use the website's color palette defined above.
- Show a Subject selector containing all Subjects, including Subjects without Questions. On opening Administration, leave the Subject unselected and show no Question form until the Administrator selects one. Selecting a Subject with saved Questions shows its last Question in ascending `questions.id` order. Show every `questions` field; `id` and `subject_id` are read-only, and every other field is editable. The selected Subject determines `subject_id` for a new Question. Provide a control for `is_active`.
- Navigate Questions in a stable order by ascending `questions.id`, including inactive Questions. **Previous** is disabled on the first saved Question or if no saved Questions exist. **Next** on the last saved Question opens a blank new-Question form. If a Subject has no Questions, show the blank new-Question form immediately.
- Unsaved edits exist when any editable field differs from its loaded value. While edits are unsaved, disable **Next**, **Previous**, and the Subject selector, and enable **Save** and **Cancel**. The Administrator must Save or Cancel before navigating to another Question or Subject. After a successful Save or Cancel, re-enable navigation according to the current position. If validation or saving fails, keep the draft visible, show a useful error, and leave navigation disabled.
- On a blank new-Question form, default `is_active` to checked (`true`). **Next** is always disabled. With no unsaved edits, **Previous** returns to the last saved Question; it is disabled if none exists.
- **Save**, whether editing an existing Question or adding a new Question, requires that a Question have nonblank `short_title`, `question_text`, `choice1`, `choice2`, `explanation`, `why_it_spreads`, and `sources`, a valid `answer` referring to a populated Choice, and a value for `is_active`. `choice3` and `choice4` are optional, but `choice4` requires `choice3`. Blank optional choices are stored as `NULL`.
- A successful **Save** on a blank form creates a Question in the database. The saved Question becomes the last Question and remains displayed as an existing Question.
- **Cancel** on a blank form discards the draft, clears the entered fields, restores `is_active` to checked, and stays on the blank form. It does not create a Question.
- A successful **Save** on an existing Question updates it.
- **Cancel** for an existing Question discards unsaved edits, restores the last saved values, and stays on that Question.

## Administrator Promise

Once a Session containing a Question has been completed, the administrator promises not to substantively alter that Question, its Choice order, or its Answer. To make a substantive correction, the administrator will deactivate the original Question and create a replacement Question. Existing Sessions continue referencing the original Question. This is an operational promise, not a restriction enforced by the Administration area.

## Mobile Requirements

- The application must work well on common mobile, tablet, and desktop screen sizes.
- On narrow screens, table rows shall not be stacked, rather, horizontal scrolling will be enabled. All information available in the desktop table must remain accessible.
  - Use an appropriate text size as a tradeoff between having to horizontally scroll a lot versus readability of the text.
  - Public mobile tables use content-driven widths instead of a desktop minimum width, reduced horizontal cell padding, and smaller column labels.
- Controls must be touch-friendly.
- Interactions must not depend on hover.
- Responsive changes must not reduce the readability or usability of the wider-screen layout.
