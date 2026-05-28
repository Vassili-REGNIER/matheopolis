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

### Sign-up flows

Dynamic registration page with three selectable forms:

- Teacher
- Student
- Free user

### Authenticated experience

- Landing page: `GameHome` with chapter list.
- Access to `MatheoPanel` from navigation.

### MatheoPanel behavior

- Left navigation menu with logout at bottom.
- Main content area renders selected section.

Role-dependent sections:

- All users: My profile, My progression
- Student: My class
- Teacher: My classes
- Admin: Teacher management (future: broader admin panel)

## 4. Clarified business rules

- Teacher account validation uses academic email domain checks.
- Teacher-code workflows are deprecated and must not be reintroduced.
- A student can belong to only one class.
- A teacher can own multiple classes.
- Class has an assignable level chosen at creation and editable later.
- Chapters are visible by default, but progression exists inside each chapter.
- Chapter units include explanations, dialogues, and mini-games.
- A dedicated chapter contains a 100-question MCQ related to the book.
- Teachers can review progression on this MCQ chapter.
- Difficulty adaptation by school level is out of current scope.

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
