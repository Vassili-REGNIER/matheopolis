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

## 6. Delivery and prioritization guidance

Given the timeline and university context:

- Prioritize a coherent playable vertical slice.
- Prefer stability and demonstrability over feature breadth.
- Implement must-have pedagogical and progression flows first.
