<?php
/**
 * @var array<string, mixed> $dashboard
 * @var \Matheopolis\Domain\User|null $user
 * @var string $csrfField
 * @var string $createTeacherCodeLink
 * @var string $createClassroomLink
 * @var string $resetStudentPasswordLink
 * @var string $createPuzzleLink
 * @var string $solvePuzzleLink
 */

$role = $dashboard['role'] ?? 'standard';
?>

<h2>Dashboard</h2>
<?php if ($user instanceof \Matheopolis\Domain\User): ?>
    <p>Connected as <strong><?php echo htmlspecialchars($user->getPseudo(), ENT_QUOTES, 'UTF-8'); ?></strong> (<?php echo htmlspecialchars($user->getRole(), ENT_QUOTES, 'UTF-8'); ?>)</p>
<?php endif; ?>

<?php if ('admin' === $role): ?>
    <section>
        <h3>Admin statistics</h3>
        <ul>
            <li>Teachers: <?php echo (int) ($dashboard['teachersCount'] ?? 0); ?></li>
            <li>Students: <?php echo (int) ($dashboard['studentsCount'] ?? 0); ?></li>
            <li>Puzzles: <?php echo (int) ($dashboard['puzzlesCount'] ?? 0); ?></li>
        </ul>
    </section>

    <section>
        <h3>Teacher activation codes</h3>
        <form action="<?php echo $createTeacherCodeLink; ?>" method="POST">
            <?php echo $csrfField; ?>
            <button type="submit">Generate new code</button>
        </form>
        <ul>
            <?php foreach (($dashboard['teacherCodes'] ?? []) as $code): ?>
                <li>
                    <?php echo htmlspecialchars($code->getCode(), ENT_QUOTES, 'UTF-8'); ?>
                    - <?php echo $code->isUsed() ? 'used' : 'unused'; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </section>
<?php endif; ?>

<?php if ('teacher' === $role): ?>
    <section>
        <h3>Class management</h3>
        <form action="<?php echo $createClassroomLink; ?>" method="POST">
            <?php echo $csrfField; ?>
            <label>
                Class name
                <input type="text" name="name" required>
            </label>
            <button type="submit">Create class</button>
        </form>

        <h4>Your classes</h4>
        <ul>
            <?php foreach (($dashboard['classes'] ?? []) as $class): ?>
                <li>
                    <?php echo htmlspecialchars($class->getName(), ENT_QUOTES, 'UTF-8'); ?>
                    (code: <?php echo htmlspecialchars($class->getCode(), ENT_QUOTES, 'UTF-8'); ?>)
                </li>
            <?php endforeach; ?>
        </ul>
    </section>

    <section>
        <h3>Students</h3>
        <p>Total progress events tracked: <?php echo (int) \count($dashboard['progressEntries'] ?? []); ?></p>
        <?php foreach (($dashboard['students'] ?? []) as $student): ?>
            <article style="margin-bottom: 10px;">
                <strong><?php echo htmlspecialchars($student->getPseudo(), ENT_QUOTES, 'UTF-8'); ?></strong>
                <form action="<?php echo $resetStudentPasswordLink; ?>" method="POST" style="display:inline-block;">
                    <?php echo $csrfField; ?>
                    <input type="hidden" name="student_id" value="<?php echo (int) $student->getId(); ?>">
                    <input type="password" name="password" placeholder="New password" required>
                    <input type="password" name="confirm_password" placeholder="Confirm password" required>
                    <button type="submit">Reset password</button>
                </form>
            </article>
        <?php endforeach; ?>
    </section>
<?php endif; ?>

<?php if (\in_array($role, ['teacher', 'admin'], true)): ?>
    <section>
        <h3>Puzzle management</h3>
        <form action="<?php echo $createPuzzleLink; ?>" method="POST">
            <?php echo $csrfField; ?>
            <label>Title <input type="text" name="title" required></label>
            <label>Statement <input type="text" name="statement" required></label>
            <label>Position <input type="number" name="position" min="1" required></label>
            <button type="submit">Save puzzle</button>
        </form>
    </section>
<?php endif; ?>

<?php if ('student' === $role): ?>
    <section>
        <h3>Puzzles and progression</h3>
        <p>You can solve puzzles in order. Current unlocked rank: <?php echo (int) (($dashboard['maxSolvedPosition'] ?? 0) + 1); ?></p>
        <ul>
            <?php foreach (($dashboard['puzzles'] ?? []) as $puzzle): ?>
                <?php $isLocked = $puzzle->getPosition() > (($dashboard['maxSolvedPosition'] ?? 0) + 1); ?>
                <li>
                    #<?php echo (int) $puzzle->getPosition(); ?> -
                    <?php echo htmlspecialchars($puzzle->getTitle(), ENT_QUOTES, 'UTF-8'); ?>
                    <?php if ($isLocked): ?>
                        <em>(locked)</em>
                    <?php else: ?>
                        <form action="<?php echo $solvePuzzleLink; ?>" method="POST" style="display:inline-block;">
                            <?php echo $csrfField; ?>
                            <input type="hidden" name="puzzle_id" value="<?php echo (int) $puzzle->getId(); ?>">
                            <button type="submit">Mark solved</button>
                        </form>
                    <?php endif; ?>
                </li>
            <?php endforeach; ?>
        </ul>
    </section>
<?php endif; ?>
