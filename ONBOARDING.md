📘 Matheopolis - Guide du Développeur
Bienvenue dans l'équipe technique de Matheopolis. Ce document détaille nos standards pour garantir un code propre, lisible et robuste.

🛠 1. Installation de l'environnement
Nous utilisons une configuration stricte pour éviter les conflits de formatage ("Space vs Tabs").

Récupérer le projet :

Bash

git clone <url-du-repo>
cd matheopolis
Installer les dépendances :

Bash

composer install
Configurer VS Code :

Ouvrez le dossier du projet avec VS Code.

Une fenêtre "Recommended Extensions" va apparaître en bas à droite : Cliquez sur Install All.

C'est tout ! Le formatage automatique est déjà configuré à la sauvegarde.

🚀 2. Workflow de développement
Nous utilisons une CI (Intégration Continue) sur GitHub. Chaque fois que vous envoyez du code, un robot vérifie trois choses :

Le Style : Le code respecte-t-il la norme PSR-12 ?

La Logique : Y a-t-il des erreurs de typage ou des bugs potentiels (via PHPStan) ?

Les Tests : Est-ce que les fonctionnalités existantes fonctionnent toujours ?

Avant de push (commit)
Pour éviter de casser la pipeline GitHub et de recevoir des alertes par mail, lancez ces commandes en local :

Vérifier le style : vendor/bin/php-cs-fixer fix (Ceci corrigera automatiquement vos fichiers).

Vérifier les bugs : vendor/bin/phpstan analyse core utils

📝 3. Conventions Importantes
Langue : Tout le code (noms de variables, fonctions, classes) et les commentaires sont en ANGLAIS.

Orthographe : L'extension Code Spell Checker soulignera les fautes en bleu. Corrigez-les avant de commit.

Variables d'environnement : Ne jamais commiter le fichier .env. Utilisez .env.example pour partager les clés nécessaires.