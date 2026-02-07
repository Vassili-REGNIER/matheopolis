<?php
/**
 * PHP header indicating the variables available here
 * @var string $user The username to display
 */
?>

<?php if (!$user): ?>
<p>Not logged in.</p>
<?php else: ?>
<p>Welcome, <?= $user; ?>!</p>
<?php endif; ?>

<iframe 
    src="/games/enigma001.html" 
    width="640" 
    height="360"
    style="border: none; max-width: 100%;">
</iframe>