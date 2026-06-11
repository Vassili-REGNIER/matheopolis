# Mode d'emploi professeur — Matheopolis

Ce document présente les principales fonctionnalités accessibles aux professeurs dans Matheopolis. Il est rédigé pour une utilisation quotidienne, sans détail technique.

## 1. Créer une classe

La première étape consiste à créer une classe dans l'espace professeur.

Depuis le panneau professeur, ouvrez **Mes classes**, puis cliquez sur **Nouvelle classe**. Vous devez renseigner :

- le nom de la classe, par exemple `6e A` ;
- le niveau de la classe ;
- une description facultative, utile pour ajouter une remarque ou un contexte.

Une fois la classe créée, Matheopolis génère automatiquement un **code d'inscription**. Ce code permet aux élèves de rejoindre la bonne classe lors de leur première connexion.

Le code est affiché dans la fiche de la classe. Vous pouvez le copier depuis l'interface pour le transmettre aux élèves.

## 2. Ajouter les élèves avec un fichier CSV

Pour créer rapidement les comptes élèves d'une classe, utilisez l'import CSV.

Dans **Mes classes**, ouvrez la classe concernée, puis cliquez sur **Importer des élèves**. Vous devez fournir un fichier CSV contenant uniquement les élèves à créer.

Le fichier doit respecter ce format :

```csv
nom,prenom
Dupont,Jean
Martin,Lea
```

Règles à respecter :

- la première ligne doit contenir exactement les colonnes `nom` et `prenom` ;
- chaque ligne suivante correspond à un élève ;
- le nom et le prénom doivent être renseignés ;
- le fichier doit être au format CSV, encodé en UTF-8 ;
- les colonnes sont séparées par des virgules.

Après l'import, Matheopolis télécharge automatiquement un fichier compatible avec Excel. Ce fichier contient, pour chaque élève créé :

- son nom ;
- son prénom ;
- son identifiant de connexion ;
- son mot de passe temporaire.

Ces mots de passe sont générés automatiquement et ne sont affichés qu'une seule fois. Il est donc important de conserver ce fichier le temps de distribuer les identifiants aux élèves.

## 3. Distribuer les accès aux élèves

Après l'import, chaque élève dispose d'un identifiant et d'un mot de passe temporaire.

L'élève peut se connecter avec ces informations, puis accéder aux contenus qui lui sont autorisés. Si l'inscription se fait directement avec le code de classe, l'élève doit utiliser le code fourni par le professeur pour rejoindre la bonne classe.

Le code de classe sert à rattacher l'élève au bon groupe. L'identifiant et le mot de passe servent ensuite à se connecter à son compte personnel.

Si un élève perd son mot de passe, le professeur peut le régénérer depuis la liste des élèves de la classe. Le nouveau mot de passe est affiché une seule fois et doit être transmis à l'élève concerné.

## 4. Suivre l'avancée d'une classe

Dans **Mes classes**, ouvrez une classe pour consulter sa progression.

La vue de classe affiche :

- la liste des élèves ;
- leur identifiant ;
- leur progression globale ;
- leur dernière activité connue ;
- le nombre d'élèves suivis dans la classe.

Cette vue permet d'identifier rapidement les élèves qui ont commencé, ceux qui avancent régulièrement et ceux qui n'ont pas encore travaillé sur les contenus.

Le professeur peut aussi exporter les résultats au format CSV pour les ouvrir dans Excel. Plusieurs exports sont disponibles :

- une synthèse des chapitres ;
- le détail d'un chapitre ;
- une synthèse des quiz ;
- le détail d'un quiz précis.

Ces exports sont utiles pour préparer un bilan, conserver une trace, comparer l'avancée des élèves ou repérer les contenus qui posent difficulté.

## 5. Suivre un élève en particulier

Depuis la liste des élèves d'une classe, cliquez sur un élève pour ouvrir sa progression détaillée.

La fiche élève présente :

- sa progression globale ;
- sa dernière activité ;
- sa date d'inscription ;
- les chapitres accessibles et leur état d'avancement ;
- les questionnaires privés accessibles ;
- les questionnaires publics accessibles.

Les contenus peuvent être indiqués comme non commencés, en cours ou terminés. Cette vue permet de comprendre le parcours réel d'un élève, sans se limiter à une moyenne générale.

## 6. Comprendre le système de score

Dans Matheopolis, les activités sont conçues pour accompagner l'élève jusqu'à la réussite. L'objectif n'est donc pas seulement de savoir s'il finit par réussir : la réussite est attendue et guidée.

Le score mesure plutôt la **qualité du parcours**.

Un score élevé signifie que l'élève a avancé avec peu d'erreurs. Un score plus faible indique qu'il a eu besoin de davantage d'essais ou qu'il a rencontré plus de difficultés avant d'arriver au bout.

Autrement dit :

- moins d'erreurs donnent un meilleur score ;
- plusieurs tentatives peuvent faire baisser le score ;
- un score faible n'est pas forcément un échec, mais un signal pédagogique ;
- le score aide à repérer les notions à retravailler.

Cette logique est particulièrement utile pour distinguer deux élèves qui terminent une activité : l'un peut avoir progressé facilement, l'autre peut avoir réussi après plusieurs hésitations.

## 7. Gérer l'accès aux chapitres et aux quiz

Dans **Gestion du contenu**, le professeur contrôle ce que chaque classe peut voir ou non.

Les contenus sont organisés en trois grandes catégories :

- les chapitres ;
- les QCM privés ;
- les QCM officiels ou publics.

Pour chaque contenu, le professeur peut gérer l'accès classe par classe. Cela permet d'adapter le parcours aux besoins réels des élèves.

### Chapitres

Les chapitres sont visibles par défaut. Le professeur peut toutefois restreindre l'accès à certains chapitres pour une classe.

Cette fonctionnalité est utile pour :

- éviter qu'une classe avance trop loin avant une séance ;
- préparer une progression par étapes ;
- réserver un chapitre à un moment précis de l'année ;
- différencier le travail entre plusieurs classes.

### QCM privés

Les QCM privés ne sont pas visibles automatiquement par les élèves. Le professeur choisit les classes qui peuvent y accéder.

Cela permet de préparer un questionnaire pour une classe précise, un groupe de besoin, une remédiation ou une évaluation courte sans le rendre visible à tout le monde.

### QCM publics

Les QCM publics sont normalement accessibles à tous les élèves connectés. Le professeur peut cependant retirer l'accès à un QCM public pour une classe donnée.

C'est utile lorsqu'un questionnaire public ne correspond pas encore à la progression de la classe, ou lorsqu'il faut éviter qu'un contenu soit consulté avant une activité prévue.

## 8. Créer et gérer des questionnaires

Dans **Mes questionnaires**, le professeur peut créer ses propres QCM.

Un questionnaire contient :

- un titre ;
- une description facultative ;
- une ou plusieurs questions ;
- des réponses proposées pour chaque question.

Pour créer un questionnaire, cliquez sur **Création d'un questionnaire**, renseignez le nom et éventuellement la description, puis ajoutez les questions.

Les questions sont uniquement des questions à choix. Il existe plusieurs formes :

- une seule bonne réponse à choisir ;
- une réponse à choisir dans une liste ;
- plusieurs bonnes réponses à cocher.

Pour chaque question, le professeur indique les propositions de réponse et marque la ou les bonnes réponses.

Le calcul du score d'un quiz se fait question par question. Pour une question à plusieurs réponses, l'élève doit sélectionner exactement toutes les bonnes réponses, sans mauvaise réponse, pour que la question soit comptée comme juste.

## 9. Comprendre les QCM privés et publics

Un questionnaire peut être **privé** ou **public**.

### QCM privé

Un QCM créé par un professeur est privé par défaut.

Cela signifie qu'il n'est visible par aucune classe tant que le professeur ne l'a pas explicitement autorisé dans **Gestion du contenu**.

Le QCM privé est idéal pour :

- préparer un travail réservé à une classe ;
- tester une activité avant diffusion ;
- créer un exercice de remédiation ;
- proposer un entraînement ciblé.

Le professeur peut modifier son QCM privé, ajouter ou supprimer des questions, puis choisir les classes qui y ont accès.

### QCM public

Un QCM public est visible plus largement dans la plateforme.

Un professeur ne publie pas directement un QCM : il peut le **soumettre** à validation. Une fois soumis, un administrateur peut le publier. Tant qu'il n'est pas publié, le questionnaire reste privé.

Cette logique permet de garder des contenus publics fiables, relus et cohérents pour l'ensemble des utilisateurs.

Un professeur peut aussi annuler l'envoi d'un questionnaire soumis tant qu'il n'a pas été publié.

## 10. Utiliser les quiz avec les élèves

Lorsqu'un élève ouvre un quiz accessible, il répond aux questions une par une.

La première réponse démarre automatiquement une tentative. Une fois toutes les questions terminées, l'élève peut consulter la correction.

Les élèves peuvent refaire un quiz plusieurs fois. Matheopolis conserve les tentatives afin de suivre l'évolution et de repérer les progrès.

Pour le professeur, les quiz peuvent servir à :

- vérifier une notion après un chapitre ;
- proposer un entraînement court ;
- préparer une séance ;
- repérer les élèves qui ont besoin d'aide ;
- comparer la progression entre plusieurs classes.

## 11. Autres actions utiles pour le professeur

Le professeur peut aussi :

- modifier le nom, le niveau ou la description d'une classe ;
- supprimer une classe si elle n'est plus utile ;
- retirer un élève d'une classe ;
- régénérer le mot de passe d'un élève ;
- supprimer un questionnaire qu'il a créé ;
- modifier un questionnaire existant ;
- demander la publication d'un questionnaire privé ;
- annuler une demande de publication ;
- exporter les résultats de classe pour les exploiter dans Excel.

Ces actions doivent être utilisées avec attention, en particulier la suppression d'un élève ou d'une classe, car elles peuvent supprimer les données associées.

## 12. Conseils d'utilisation pédagogique

Pour une prise en main simple, il est conseillé de suivre cet ordre :

1. Créer la classe.
2. Importer les élèves avec le fichier CSV.
3. Distribuer les identifiants et mots de passe.
4. Vérifier que les élèves peuvent se connecter.
5. Choisir les chapitres et quiz accessibles.
6. Laisser les élèves travailler.
7. Consulter la progression globale.
8. Ouvrir les fiches individuelles des élèves qui nécessitent un suivi.
9. Exporter les résultats si un bilan est nécessaire.

Matheopolis est pensé comme un outil de suivi et d'accompagnement. Les scores, les tentatives et les progressions ne remplacent pas l'observation du professeur, mais ils donnent des repères concrets pour mieux cibler les besoins des élèves.
