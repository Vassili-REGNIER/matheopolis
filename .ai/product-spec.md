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
- Teachers can export class progression to Excel (name, surname, progression, attempt count, etc.).
- Teacher chooses class level at class creation and can update it later.
- Chapters are all visible by default, but progression exists inside each chapter.
- Chapter content includes explanations, dialogues, and mini-games.
- A dedicated chapter includes a 100-question MCQ on the book.
- Teachers can monitor progression on this MCQ chapter.
- No dynamic difficulty adaptation by student class level (for now).

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
