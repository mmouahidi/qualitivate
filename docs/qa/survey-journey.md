# Survey Journey QA Checklist (Staging)

## Environment
- Staging instance
- Ensure rate limiting is not blocking test requests

## Seeded Accounts
- Company admin: `companyadmin@qualitivate.io` / `password123`
- Regular user: `user@qualitivate.io` / `password123`

## A) Company Admin Journey (Create → Build → Activate → Distribute)
1. Log in as company admin.
2. Create a new survey (custom type).
3. In the unified builder:
   - Edit title/description.
   - Add at least 3 questions:
     - Multiple choice with choices
     - Rating scale
     - Text long
   - Add a skip logic rule on question 1 (e.g., if choice A → skip to question 3).
   - Open Settings → set welcome + thank-you text; save.
4. Activate survey from builder header.
5. Go to Distribute:
   - Toggle public ON.
   - Copy share link.
   - Generate a link distribution (if available).

**Expected**
- Survey settings persist and appear in public survey flow.
- Skip logic respects the rule and navigates as expected.
- Survey status changes correctly.

## B) Authenticated User Journey
1. Log in as regular user.
2. Open the share link while logged in.
3. Start survey, answer questions (ensure required validation works).
4. Submit → verify thank-you message.

**Expected**
- Survey is accessible to authenticated user (private or public).
- Answers submit successfully.
- Analytics shows +1 response.

## C) Anonymous User Journey
1. Open share link in incognito (logged out).
2. If survey is **public**, ensure start is allowed.
3. Complete survey and submit.
4. If survey is **private**, verify access is denied.

**Expected**
- Anonymous access only works when survey is public.
- Submission works and increments response count.
- Anonymous notice appears when `isAnonymous` is true.

## D) Post-Submission Validation
1. Company admin checks analytics dashboard for response count increments.
2. Confirm logic-skipped questions do not require answers.

## Additional Scenarios
- Create survey with required questions only.
- Add/remove skip logic and verify navigation path updates.
- Distribution history shows link/QR entries when created.
