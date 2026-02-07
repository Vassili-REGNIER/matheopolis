<?php
/**
 * PHP header indicating the variables available here
 * @var string $pageTitle
 *
 * @var string $favicon
 * @var string $mainCss
 * @var string $mainJs
 * @var string $javascriptModule
 *
 * @var string $homeLink
 * @var string $loginLink
 * @var string $tasksLink
 * @var string $logoutLink
 *
 * @var bool $isUserAuth
 * @var string $currentYear
 *
 * @var string $content
 */

use Core\Services\AuthSessionService;
use Core\Services\HttpService;
use Core\Services\SecurityService;

?>

<!DOCTYPE html>
<html lang="en">

<head>
	<title><?= $pageTitle ?></title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Lorem ipsum dolor sit amet, consectetur adipiscing elit.">
	<!-- CSS -->
	<link rel="stylesheet" href="<?= $mainCss ?>">
	<!-- Favicon -->
	<link rel="icon" href="<?= $favicon ?>">
</head>

<body>

	<header>
		<?php if (isset($title)): ?>
		<h1><?= $title ?></h1>
		<?php endif;?>
	</header>

	<nav>
		<ul>
			<li><a href="<?= $homeLink ?>">Home</a></li>
			<li><a href="<?= $tasksLink ?>">Tasks</a></li>
			<?php if (!$isUserAuth): ?>
			<li><a href="<?= $loginLink ?>">Log in</a></li>
			<?php else:?>
			<li><a onclick="return confirm('Are you sure?');" href="<?= $logoutLink ?>">Log out</a></li>
			<?php endif; ?>
		</ul>
	</nav>

    <main class="container">
        <?= $content ?>
    </main>

	<footer>
		<p>
			<em>&copy; <?= $currentYear ?> Matheopolis SAE TEAM - Une aventure éducative basée sur la série de livres</em>
		</p>
	</footer>
	<!-- JavaScript -->
	<script src="<?= $mainJs ?>"></script>
	<?php if (isset($javascriptModule)): ?>
	<script src="<?= $javascriptModule ?>"></script>
	<?php endif; ?>
</body>

</html>
