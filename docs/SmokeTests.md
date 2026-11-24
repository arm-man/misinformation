# Misinformation Examination Smoke Tests

**Start as a Guest.** In a fresh browser profile, open the landing page and select a Subject. Verify that the examination opens at zero progress, a returning-visitor cookie is set, and you can start without entering an email or signing in.

**Answer, skip, update, and resume.** Choose an answer and skip another Question. Verify that each first submission advances to the next Question and that progress reflects the skip. Use **Previous** to see a saved Guess highlighted, change it, and verify the save leaves that Question displayed. Use **Next** to continue, then refresh to verify that the first unanswered Question opens with progress intact. Return to the landing page via the wordmark, verify the Subject is marked in progress, and select it to resume the same Session.

**Finish and check results.** Use at least one correct Guess, one incorrect Guess, and one skip. Verify that correct Answers stay hidden during the examination and **Finish Examination** appears once every Question has a recorded response. Finish and check the Subject, completion date, and correct, incorrect, and skipped totals. Verify the results follow the examination order and that selecting the now-completed Subject on the landing page reopens those results.

**Open a Question from results.** Verify the Question page shows the Answer, your Guess, the explanation, why the misconception spreads, and sources. Turn on issue reporting, verify **Submit** enables after five characters, and submit test feedback. Confirm the thank-you message appears.

**Submit general feedback as a Guest.** Follow the feedback link from results. With no email saved, verify Enter inserts a newline and **Submit Anonymously** shows a thank-you message.

**Open feedback directly.** In a fresh browser profile, open `/feedback` and submit valid feedback. Verify a Guest cookie is set, the thank-you message appears, and fewer than five non-whitespace characters cannot be submitted.

**Save an email from results.** As a Guest, verify invalid input leaves **Submit** disabled. Save a valid test email, check the confirmation, and reload in the same browser. Verify the results are still available and the Guest email form no longer appears.

**Check event notifications.** In an environment with `LOG_EMAIL_TO` configured, verify the test inbox receives event details for examination completion, email save, question feedback, and general feedback.

**Open AI providers.** From a completed Question page, verify ChatGPT opens with the Question in its prompt. Verify Gemini, Claude, Grok, and Perplexity open and the Question is copied with a confirmation message.

**Check the mobile layout.** At phone width, verify that you can select a Subject, answer a Question, and tap a Question in results. If the results table overflows, verify it scrolls horizontally and all columns remain accessible.

**Protect Administration.** Verify an unauthenticated browser cannot load Administration data or create/update Questions. Sign in with the configured password, confirm a wrong password fails, then sign out and verify access is removed.

**Edit a Question.** Select a Subject with saved Questions and verify its last Question by ascending `id` appears with all fields, including read-only `id` and `subject_id`. Edit a field and verify Save and Cancel are enabled while Next, Previous, and Subject selection are disabled. Cancel and verify the saved value is restored and the same Question remains displayed. Save a different edit and verify navigation is available again; use Previous or Next and reload to confirm the saved change persisted. Check that inactive Questions appear and `is_active` can be edited.

**Create a Question.** Open Administration and verify no Subject or Question is initially selected. Select a Subject without Questions and verify a blank form with `is_active` checked. Also navigate Next from the last Question of a populated Subject. Enter draft content and verify Previous and Subject selection are disabled and Next remains disabled. Cancel and verify the draft clears, `is_active` returns to checked, no row is created, and Previous is enabled only if a saved Question exists. Enter an incomplete Question and verify Save fails without creating a row or enabling navigation. Complete all required fields and save; verify the new Question remains displayed as the last saved Question and can be reopened through navigation.
