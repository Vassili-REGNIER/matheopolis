<?php
/**
 * PHP header indicating the variables available here.
 *
 * @var string $pageTitle
 * @var string $favicon
 * @var string $mainCss
 * @var string $mainJs
 * @var string $javascriptModule
 * @var string $homeLink
 * @var string $loginLink
 * @var string $tasksLink
 * @var string $logoutLink
 * @var bool   $isUserAuth
 * @var string $currentYear
 * @var string $content
 */
?>

<!DOCTYPE html>
<html lang="en">

<head>
	<title><?php echo $pageTitle; ?></title>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="description" content="Lorem ipsum dolor sit amet, consectetur adipiscing elit.">
	<!-- CSS -->
	<link rel="stylesheet" href="<?php echo $mainCss; ?>">
	<!-- Favicon -->
	<link rel="icon" href="<?php echo $favicon; ?>">
</head>

<body>

	<header>
		<?php if (isset($title)) { ?>
		<h1><?php echo $title; ?></h1>
		<?php }?>
	</header>

	<nav>
		<ul>
			<li><a href="<?php echo $homeLink; ?>">Home</a></li>
			<li><a href="<?php echo $tasksLink; ?>">Tasks</a></li>
			<?php if (!$isUserAuth) { ?>
			<li><a href="<?php echo $loginLink; ?>">Log in</a></li>
			<?php } else { ?>
			<li><a onclick="return confirm('Are you sure?');" href="<?php echo $logoutLink; ?>">Log out</a></li>
			<?php } ?>
		</ul>
	</nav>

    <main class="container">
        <?php echo $content; ?>
    </main>

	<footer>
		<p>
			<em>&copy; <?php echo $currentYear; ?> Matheopolis SAE TEAM - Une aventure éducative basée sur la série de livres</em>
		</p>
	</footer>
	<!-- JavaScript -->
	<script src="<?php echo $mainJs; ?>"></script>
	<?php if (isset($javascriptModule)) { ?>
	<script src="<?php echo $javascriptModule; ?>"></script>
	<?php } ?>
</body>

</html>
