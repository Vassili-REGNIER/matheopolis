<?php
/**
 * PHP header indicating the variables available here.
 *
 * @var string $user The username to display
 */
?>

<?php if (!$user) { ?>
<p>Welcome to Mathéopolis. Login or create an account to access your role dashboard.</p>
<p><a href="/auth/login">Go to authentication</a></p>
<?php } else { ?>
<p>Welcome, <?php echo $user; ?>!</p>
<?php } ?>