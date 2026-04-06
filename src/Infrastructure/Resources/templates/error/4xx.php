<?php
/**
 * PHP header indicating the variables available here.
 *
 * @var string $message  The error message passed from the controller
 * @var int    $status   The HTTP status code (e.g., 404)
 */
?>

<div class="container text-center mt-5">
    <h1 class="display-1"><?php echo $status; ?></h1>
    <h2><?php echo $message; ?></h2>
    <a href="javascript:history.back()" class="btn btn-outline-dark">Retour</a>
    <a href="/" class="btn btn-primary">Accueil</a>
</div>