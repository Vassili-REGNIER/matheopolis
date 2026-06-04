# Product Specification (Consolidated)

## Context

Matheopolis is an educational web platform inspired by the Mathéopolis books.
It targets middle and high school students and combines:

- narrative content,
- mini-games,
- quizzes,
- progression tracking.

## Source consolidation

This specification consolidates:

1. Original project requirements document.
2. Clarifications from team meetings after project kickoff.

Meeting clarifications are considered the latest validated direction.

## User roles

- `admin`
- `teacher`
- `student`
- `free_user`

Guest mode is a local trial session distinct from a registered `free_user` account. It can open the game
hub and playable chapters, but it must not expose the private MatheoPanel or progression dashboard UI.

## Main user journey

1. Public Home page:
   - navbar/footer,
   - project presentation,
   - `Sign up` and `Log in` actions.
2. Sign-up page:
   - `Join a class`: student registration with first name, last name, class code, and password.
   - `Sign up`: generic registration with first name, last name, email, and password.
   - Generic registration creates a `teacher` account when the email uses an approved academic domain,
     otherwise it creates a `free_user` account.
3. After login:
   - `GameHome` with chapter list.
4. `MatheoPanel`:
   - persistent left navigation,
   - role-based sections,
   - logout action in navigation footer.

Guest mode starts from the public Home page and lands on `GameHome` without account creation. The guest
view hides panel access, XP, stars, chapter progression bars, and progression summary blocks, and provides
a return-to-home action.

## MatheoPanel sections by role

### Registered authenticated users

- My profile
- My progression

### Student

- My class

### Teacher

- My classes

### Admin

- Teacher management (future: broader admin panel)

## Functional clarifications from meeting

- Teacher account eligibility is validated by academic email domain.
- No teacher-code workflow is exposed by API.
- Student usernames are generated server-side as `first.last1`, `first.last2`, etc. until a free login is found.
- A student belongs to exactly one class.
- A teacher can manage multiple classes.
- Teachers can export class progression to CSV via the API (name, surname, username, riddle counts, completion
  rate, last activity).
- Teacher chooses class level at class creation and can update it later.
- Narrative chapters are public by default; teachers can restrict a chapter per class via
  `chapter_target_classes` (`is_active`, same semantics as quizzes).
- Chapter content includes explanations, dialogues, and mini-games (riddles).
- The book MCQ is a **public quiz** in the database (same type as other quizzes), typically listed first in
  `GameHome`; it is not a special frontend-only chapter.
- Teachers can monitor student progression on quizzes and riddles.
- No dynamic difficulty adaptation by student class level (for now).

## Narrative chapters and riddles

- **Chapters** (`GET /api/chapters`): metadata plus a relational scenario (`chapter_steps` ordered by
  `order_index`). Step types `info`, `dialogue`, and `riddle` each have dedicated tables (`step_infos`,
  `step_dialogues` + `dialogue_lines`, `riddles`). No JSON scenario column on `chapters`.
- **Riddles**: one row per riddle step, linked to its `chapter_steps` row via `step_id`. `game_id` maps to a
  frontend `BaseGame`; questions and answers live in `riddle_questions`. Mini-game **code** stays in the frontend.
- **Dual progression** (authenticated accounts only, including `free_user`):
  - **Chapter progression** (`chapter_progressions`): overall chapter status.
  - **Riddle progression** (`riddle_progressions`): per challenge riddle; practice riddles do not persist.
- Answers are submitted **one question at a time** (`POST /api/riddles/{id}/responses`). There is no play-token
  or anti-cheat layer.
- Local-only progression in the frontend is temporary and will be removed; the API is the source of truth for
  registered users.

## Quizzes feature

Quizzes are a chapter type stored in the database. Teachers and admins author them via the quizzes API. A quiz
appears in `GameHome` merged with narrative chapters (`GET /api/chapters` + `GET /api/quizzes`), discriminated
by `type: "quiz"`.

### Quiz model

- A quiz has a title, an optional description, a creator, a visibility status, and an ordered list of questions.
- A question is **choice-based only**. Supported types:
  - `radio`: exactly one correct option,
  - `select`: exactly one correct option (rendered as a dropdown),
  - `checkbox`: one or more correct options.
- There is no free-text (`input`) question type.
- Each question owns a list of options; each option is flagged correct or not.

### Visibility model

- A quiz is either `public` or `private`.
- Default access (no class override):
  - `public` quiz: accessible to everyone,
  - `private` quiz: accessible to no one.
- A teacher can override the default behavior **for their own classes** through class-level access entries:
  - **Restrict** a `public` quiz for one of their classes (they only need to own the class, not the quiz),
  - **Grant** a `private` quiz to one of their classes (they must own **both** the quiz and the class).
- Each override marks a `(quiz, class)` pair as accessible or restricted.

### Access resolution by role

- `admin`: all quizzes.
- `teacher`: all `public` quizzes, plus the `private` quizzes they created.
- `student`:
  - `public` quizzes, except those explicitly restricted for the student's class,
  - `private` quizzes explicitly granted to the student's class.
- `free_user`: all `public` quizzes (no class, so class overrides never apply).
- Guest mode: no quiz access.

### Playing a quiz

When a user has access to a quiz, they can:

- fetch the quiz (general info + questions + options, **without** revealing which options are correct),
- submit an answer to a question; the first submission **automatically starts an attempt**,
- once an attempt is completed (all questions answered), fetch the **correction** (info + questions +
  the user's answers + score).

Attempts:

- Multiple attempts per quiz are allowed.
- The full answer history is kept per attempt.
- Scoring is **all-or-nothing per question**: a `checkbox` question is correct only when every correct option
  is selected and no incorrect option is selected. The score is the number of correct questions over the total.

### Quiz management

- `teacher`:
  - create a `private` quiz,
  - add/update/delete its questions and options,
  - manage class access (restrict public quizzes for owned classes, grant owned private quizzes to owned classes),
  - request publication of an owned private quiz (sets a "publication requested" flag for admins).
- `admin`:
  - create `public` or `private` quizzes,
  - add/update/delete questions of any quiz,
  - publish a quiz (set its status to `public`), including teacher quizzes that requested publication.
- Only admins can create public quizzes or turn an existing quiz public.

## Scope guidance for prototype phases

### Must-have baseline

- authentication and session flow,
- role-aware navigation and page access,
- chapter navigation and progression model,
- class management basics,
- progression persistence.

### Next increments

- teacher Excel export,
- complete admin panel capabilities,
- richer pedagogical analytics,
- optional adaptive-difficulty strategies.
