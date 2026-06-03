# Product Requirements (Consolidated)

## 1. Purpose

Matheopolis is an educational, interactive web platform inspired by Mathéopolis books.
It combines narrative, mini-games, and progression tracking for school audiences.

## 2. Requirement source priority

When documents conflict, use this priority:

1. Latest validated team/client meeting decisions.
2. This consolidated product requirements document.
3. Original project requirement artifact.

## 3. Current functional vision

### Public experience

- Home page with navbar/footer and project presentation.
- Two primary actions:
  - `Sign up`
  - `Log in`
- Guest mode can launch the game hub without account creation, but it is a local trial session only.

### Sign-up flows

Dynamic registration page with two selectable forms:

- `Join a class`: creates a student account from first name, last name, class code, and password.
- `Sign up`: creates a generic account from first name, last name, email, and password.

The generic flow assigns the `teacher` role when the email uses an approved academic domain. Otherwise,
it creates a `free_user` account.

### Authenticated experience

- Landing page: `GameHome` with chapter list.
- Access to `MatheoPanel` from navigation.

Registered users may access the MatheoPanel according to their role. Guest mode must not show panel access
and must redirect away from the panel route if reached directly.

### MatheoPanel behavior

- Left navigation menu with logout at bottom.
- Main content area renders selected section.

Role-dependent sections:

- Registered users: My profile, My progression
- Student: My class
- Teacher: My classes
- Admin: Teacher management (future: broader admin panel)

## 4. Clarified business rules

- Teacher account validation uses academic email domain checks.
- Teacher-code workflows are deprecated and must not be reintroduced.
- Student usernames are generated server-side as `first.last1`, `first.last2`, and so on.
- A student can belong to only one class.
- A teacher can own multiple classes.
- Class has an assignable level chosen at creation and editable later.
- Chapters are visible by default, but progression exists inside each chapter.
- Chapter units include explanations, dialogues, and mini-games.
- A dedicated chapter contains a 100-question MCQ related to the book.
- Teachers can review progression on this MCQ chapter.
- Difficulty adaptation by school level is out of current scope.
- Guest mode hides XP, stars, chapter progression bars, and progression summary blocks.

## 5. Teacher-specific capabilities

- Class creation, update, and management.
- Student progression visibility by class.
- Excel export of class progression data:
  - first name,
  - last name,
  - progression,
  - attempt counts,
  - and relevant summary indicators.

## 6. Quizzes

Quizzes are a new chapter type, authored by teachers/admins and stored in the database (unlike narrative
chapters, whose content lives in the frontend). They are listed alongside narrative chapters in `GameHome`
as chapters of type `quiz`.

### Quiz content

- A quiz has a title, an optional description, a creator, a visibility status, and ordered questions.
- Questions are choice-based only: `radio` (one correct), `select` (one correct, dropdown), `checkbox`
  (one or more correct). There is no free-text question type.
- Each question has options; each option is flagged correct or not.

### Visibility and access

- A quiz is `public` or `private`.
- Defaults: `public` is accessible to everyone; `private` is accessible to no one.
- A teacher can override defaults for their own classes:
  - restrict a `public` quiz for an owned class (owning the class is enough),
  - grant a `private` quiz to an owned class (must own both the quiz and the class).
- Access by role:
  - `admin`: all quizzes,
  - `teacher`: all public quizzes + own private quizzes,
  - `student`: public quizzes except those restricted for the student's class, plus private quizzes granted
    to the student's class,
  - `free_user`: all public quizzes,
  - guest: none.

### Playing and correction

- An accessible quiz can be fetched (questions/options without correct flags).
- Submitting an answer to a question auto-starts an attempt.
- Multiple attempts are allowed; answer history is kept per attempt.
- After completing an attempt, the user can fetch the correction (questions + correct options + own answers +
  score). Scoring is all-or-nothing per question.

### Management

- Teacher: create private quizzes, edit their questions, manage class access, request publication.
- Admin: create public/private quizzes, edit any quiz's questions, and publish quizzes (only admins can make a
  quiz public).

## 7. Delivery and prioritization guidance

Given the timeline and university context:

- Prioritize a coherent playable vertical slice.
- Prefer stability and demonstrability over feature breadth.
- Implement must-have pedagogical and progression flows first.
