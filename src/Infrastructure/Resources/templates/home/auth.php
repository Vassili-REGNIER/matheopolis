<?php
/**
 * PHP header indicating the variables available here.
 *
 * @var bool   $initialMode
 * @var array  $flash_errors Array containing errors
 * @var array  $flash_success Array containing success
 * @var array  $flash_messages Array containing messages
 * @var string $csrfField
 */
?>

<?php if (!empty($flash_errors)) { ?>
    <div class="alert alert-error">
        <?php foreach ($flash_errors as $error) { ?>
            <p><?php echo $error; ?></p>
        <?php } ?>
    </div>
<?php } ?>

<?php if (!empty($flash_success)) { ?>
    <div class="alert alert-success">
        <?php foreach ($flash_success as $msg) { ?>
            <p><?php echo $msg; ?></p>
        <?php } ?>
    </div>
<?php } ?>

<?php if (!empty($flash_messages)) { ?>
    <div class="alert alert-info">
        <?php foreach ($flash_messages as $msg) { ?>
            <p><?php echo $msg; ?></p>
        <?php } ?>
    </div>
<?php } ?>


<div class="tabs">
    <button id="btn-login" class="active" onclick="switchForm('login')">Se connecter</button>
    <button id="btn-join" onclick="switchForm('join')">Rejoindre une classe</button>
    <button id="btn-register" onclick="switchForm('register')">Créer un compte</button>
</div>

<div id="login-container" class="auth-container">
    <form action="/action/login" method="POST">
        <?php echo $csrfField; ?>

        <h2>Bon retour parmi nous !</h2>

        <div class="form-group">
            <label for="login-input">Email ou Pseudo</label>
            <input type="text" id="login-input" name="login" placeholder="Entrez votre email ou pseudo" required>
        </div>

        <div class="form-group">
            <label for="password-input">Mot de passe</label>
            <input type="password" id="password-input" name="password" placeholder="Votre mot de passe" required>
        </div>

        <div class="form-group-checkbox">
            <input type="checkbox" id="remember_me" name="remember_me">
            <label for="remember_me">Se souvenir de moi</label>
        </div>

        <button type="submit">Connexion</button>
    </form>
</div>

<div id="join-container" class="auth-container" style="display: none;">
    <form action="/action/join" method="POST">
        <?php echo $csrfField; ?>

        <h2>Rejoindre une classe</h2>
        <p class="hint">Pour les élèves munis d'un code classe.</p>

        <div class="form-group">
            <label>Code de la classe
                <input type="text" name="class_code" placeholder="Ex: MATH-8X4" required>
            </label>
        </div>

        <div class="row">
            <label>Prénom
                <input type="text" name="firstname" placeholder="Prénom" required>
            </label>
            <label>Nom
                <input type="text" name="lastname" placeholder="Nom" required>
            </label>
        </div>

        <div class="form-group">
            <label>Pseudo
                <input type="text" name="pseudo" placeholder="Choisis un pseudo unique" required>
            </label>
        </div>

        <div class="form-group">
            <label>Mot de passe
                <input type="password" name="password" placeholder="Crée ton mot de passe" required>
            </label>
        </div>

        <div class="form-group">
            <label>Confirmation
                <input type="password" name="confirm_password" placeholder="Répète ton mot de passe" required>
            </label>
        </div>

        <button type="submit">Rejoindre</button>
    </form>
</div>

<div id="register-container" class="auth-container" style="display: none;">
    <form action="/action/register" method="POST">
        <?php echo $csrfField; ?>

        <h2>Créer un compte</h2>
        <p class="hint">Pour les enseignants ou utilisateurs indépendants.</p>

        <div class="row">
            <label>Prénom
                <input type="text" name="firstname" placeholder="Prénom" required>
            </label>Nom
            <label>
                <input type="text" name="lastname" placeholder="Nom" required>
            </label>
        </div>

        <div class="form-group">
            <label>Pseudo
                <input type="text" name="pseudo" placeholder="Votre pseudo" required>
            </label>
        </div>

        <div class="form-group">
            <label>Email
                <input type="email" name="email" placeholder="votre@email.com" required>
            </label>
        </div>

        <div class="form-group">
            <label>Mot de passe
                <input type="password" name="password" placeholder="8 caractères minimum" required>
            </label>
        </div>

        <div class="form-group">
            <label>Confirmation
                <input type="password" name="confirm_password" placeholder="Confirmez le mot de passe" required>
            </label>
        </div>

        <div class="teacher-section">
            <div class="form-group-checkbox">
                <input type="checkbox" id="is_teacher" name="is_teacher" onchange="toggleTeacherField()">
                <label for="is_teacher">Je suis un enseignant</label>
            </div>

            <div id="teacher-code-container" style="display: none; margin-top: 10px;">
                <label>Code d'activation Professeur
                    <input type="text" name="teacher_code" placeholder="Entrez le code secret fourni">
                </label>
            </div>
        </div>

        <button type="submit">S'inscrire</button>
    </form>
</div>

<script>

<?php // TODO: déplacer le javascript vers un fichier adapté
?>
/**
 * Switches between the 3 forms (Login, Register, Join).
 */
function switchForm(formName) {
    // Hide all containers
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('join-container').style.display = 'none';

    // Remove active class from all buttons
    document.getElementById('btn-login').classList.remove('active');
    document.getElementById('btn-register').classList.remove('active');
    document.getElementById('btn-join').classList.remove('active');

    // Show selected container and activate button
    if (formName === 'login') {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('btn-login').classList.add('active');
    } else if (formName === 'register') {
        document.getElementById('register-container').style.display = 'block';
        document.getElementById('btn-register').classList.add('active');
    } else if (formName === 'join') {
        document.getElementById('join-container').style.display = 'block';
        document.getElementById('btn-join').classList.add('active');
    }
}

/**
 * Toggles the visibility of the Teacher Activation Code input.
 */
function toggleTeacherField() {
    const checkbox = document.getElementById('is_teacher');
    const codeContainer = document.getElementById('teacher-code-container');

    codeContainer.style.display = checkbox.checked ? 'block' : 'none';
}

// Initialize the view based on the controller input
const initialMode = "<?php echo $initialMode ?? 'login'; ?>";

document.addEventListener("DOMContentLoaded", () => {
    switchForm(initialMode);
});
</script>

<style>
    /* Basic styling for structure - To be moved to CSS file later */
    .row { display: flex; gap: 10px; }
    .row input { flex: 1; }
    .teacher-section { background: #f9f9f9; padding: 10px; border-radius: 5px; margin-bottom: 15px; }

    .alert { padding: 10px; margin-bottom: 15px; border-radius: 4px; border: 1px solid transparent; }
    .alert p { margin: 5px 0; }

    .alert-error { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
    .alert-success { background-color: #d4edda; color: #155724; border-color: #c3e6cb; }
    .alert-info { background-color: #d1ecf1; color: #0c5460; border-color: #bee5eb; }

    .tabs button.active { font-weight: bold; border-bottom: 2px solid blue; }
</style>