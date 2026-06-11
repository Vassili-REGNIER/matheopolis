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
   - `GameHome` with three content sections (see below).
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

- My class (`StudentClassComponent`): currently displays a "feature coming soon" placeholder until the
  student-facing class dashboard is implemented.

### Teacher

- My classes
- My questionnaires (`QuizManagementComponent`): create and edit private quizzes, manage questions, request
  or cancel publication, delete owned quizzes.
- Content management (`StudentContentManagementComponent`): grant or restrict student access per class for
  public and private quizzes, and restrict public chapters per class via chapter target-class API routes.

### Admin

- Administration panel (`AdminPanelComponent`): review teacher publication requests, publish or dismiss
  them, edit quiz content, unpublish public quizzes from detail view.
- GameHome admin menu (card ⋮): edit quiz in panel, publish/unpublish, delete quiz.

## GameHome content layout

Authenticated users see content in this **fixed order**:

1. **Chapters** — narrative mini-game levels (`GET /api/chapters`). Chapters are public by default, with
   per-class restrictions resolved from `chapter_target_classes`.
2. **Private questionnaires** — `GET /api/quizzes` filtered to `status: private` (class-granted for students).
3. **Public questionnaires** — official quizzes (`status: public`).

Guests see chapters only (no quiz list). The hub also provides:

- **Title search** — dynamic filter across visible cards.
- **Type filters** — toggle chips for chapters, private quizzes, and public quizzes (at least one active).

Quiz play routes: `/quiz/:id` (attempt) and `/quiz/:id/results` (correction). Re-opening a completed quiz
opens a styled modal to restart or view previous results.

## Functional clarifications from meeting

- Teacher account eligibility is validated by academic email domain.
- No teacher-code workflow is exposed by API.
- Student usernames are generated server-side as `first.last1`, `first.last2`, etc. until a free login is found.
- A student belongs to exactly one class.
- A teacher can manage multiple classes.
- Teachers can import students into an existing class from CSV (`nom`, `prenom` columns, UTF-8, comma-separated).
  The API returns `nom`, `prenom`, `identifiant`, `mots de passes` (12-char random password, one-time). Plaintext
  passwords are never stored; only bcrypt hashes are persisted.
- Teachers can reset a student's password (same 12-char generator, returned once in JSON `data.password`).
- Owner teachers and admins can delete a student account from its class; related progression data is removed
  with the account.
- Teachers can export class progression to CSV (semicolon delimiter for Excel):
  - `mode=overview` (default): `Nom`, `Prénom`, `Pseudo`, repeated per-chapter `Nom du chapitre`, `Progression`, `Meilleur score`, `Score maximal faisable`, then `Progression totale`.
  - `mode=chapter&chapterId=…`: challenge riddles only, with repeated `Nom de l'énigme`, `Progression`, `Meilleur score`, `Score maximal faisable`, `Nombre de tentatives` columns.
  - `mode=quiz`: repeated `Nom du quiz`, `Visibilité`, `Progression`, `Meilleure tentative`, `Nombre de questions`, `Nombre de tentatives` columns.
  - `mode=quiz_public_detail&quizId=…` / `mode=quiz_private_detail&quizId=…`: one quiz detail export with student identity and summary columns only (`Progression`, `Meilleure tentative`, `Nombre de questions`, `Nombre de tentatives`).
  - Progression values are French user-facing labels (`Non commencé`, `En cours`, `Terminé`); missing best scores are exported as `0`.
- Accounts with an email must verify via link (`email_verification` token, **48 h**) before login
  (`403 EMAIL_NOT_VERIFIED`). Password reset uses a **2 h** `password_reset` token. Tokens are 64 hex chars,
  single-use, stored hashed (SHA-256). Mail is logged in dev (`LogMailer`).
- Teacher chooses class level at class creation and can update it later.
- Narrative chapters are public by default; teachers can restrict a chapter per class via
  `chapter_target_classes` (`is_active`, same semantics as quizzes).
- Chapter content includes explanations, dialogues, and mini-games (riddles).
- The book MCQ is a **public quiz** in the database (same type as other quizzes), typically listed in the
  public questionnaires section of `GameHome`; it is not a special frontend-only chapter.
- Teachers can monitor student progression on accessible chapters and quizzes. The class global progression in
  the teacher panel averages the real chapter scenario percentages and quiz question percentages for all content
  accessible to each student, and the selected-student view shows chapter details plus separate private and public
  quiz detail lists. The student's own "My progression" panel uses the same detailed layout for their account.
- No dynamic difficulty adaptation by student class level (for now).

## Narrative chapters and riddles

- **Chapters** (`GET /api/chapters`): metadata plus a relational scenario (`chapter_steps` ordered by
  `order_index`). Step types `info`, `dialogue`, and `riddle` each have dedicated tables (`step_infos`,
  `step_dialogues` + `dialogue_lines`, `riddles`). `step_infos.content` is JSON; dialogue images use
  `./assets/characters/{speakerId}-{emotion}.png` (frontend static assets under `frontend/public/`). No JSON scenario column on `chapters`.
- **Riddles**: one row per riddle step, linked to its `chapter_steps` row via `step_id`. `game_id` maps to a
  frontend `BaseGame`; questions and answers live in `riddle_questions`. Mini-game **code** stays in the frontend.
- **Dual progression** (authenticated accounts only, including `free_user`):
  - **Chapter progression** (`chapter_progressions`): status, `current_step_index`, `score` (one row per user
    and chapter). `POST /api/chapters/{id}/steps` persists the resume index; `POST .../start` resumes
    `in_progress` attempts or restarts after `completed`.
    Chapter UI progress is based on this real scenario resume position (`current_step_index / stepCount`),
    where `stepCount` counts every visible scenario step (`info`, `dialogue`, practice riddles, and challenge
    riddles), not only challenge completion.
    `POST .../complete` accepts the final chapter score (`0` to `100`) and may update the score after backend
    auto-completion triggered by the final challenge riddle response.
  - **Riddle progression** (`riddle_progressions`): per challenge riddle with `score` and multi-attempt rows;
    practice riddles are validated by the API but do not persist durable progression.
- Challenge mini-game and riddle progression scores are normalized to `0-100`. They measure path quality:
  `100` means no incorrect validation attempts, and lower scores are computed from completed scorable units and
  mistake count. Riddle API responses persist and return this normalized score; chapter score submission is the
  rounded average of completed challenge riddle scores.
- Answers are submitted **one question at a time** (`POST /api/riddles/{id}/responses`).
- `GET /api/riddles/{id}` is public (guests included) when the parent chapter is accessible.
- Local-only progression in the frontend is temporary and will be removed; the API is the source of truth for
  registered users.

## Quizzes feature

Quizzes are stored in the database. Teachers and admins author them via the quizzes API. In `GameHome`, quizzes
are **not merged into the chapter timeline**; they appear in dedicated sections (private, then public) below
chapters, loaded from `GET /api/quizzes` and ordered by `position`.

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
  - manage class access via `StudentContentManagementComponent` (restrict public quizzes for owned classes,
    grant owned private quizzes to owned classes; backed by `quiz_target_classes` API),
  - request publication of an owned private quiz (`askAdmin: true`) or cancel the request (`askAdmin: false`).
- `admin`:
  - create `public` or `private` quizzes,
  - add/update/delete questions of any quiz,
  - publish a quiz (`status: public`, clears `askAdmin`), unpublish (`status: private`),
  - dismiss a publication request (`askAdmin: false` without publishing),
  - manage quizzes from `AdminPanelComponent` or GameHome admin card menus.
- Only admins can create public quizzes or turn an existing quiz public.

## Scope guidance for prototype phases

### Must-have baseline

- authentication and session flow,
- role-aware navigation and page access,
- chapter navigation and progression model,
- class management basics,
- progression persistence.

### Next increments

- complete admin panel capabilities,
- richer pedagogical analytics,
- optional adaptive-difficulty strategies.
