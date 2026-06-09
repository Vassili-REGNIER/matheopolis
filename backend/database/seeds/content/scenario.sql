-- ==============================================================================
-- Matheopolis - Scenarios: Base Conversion & Piano Fractions
-- Generated from TypeScript scenario configs
-- ==============================================================================

SET NAMES 'utf8mb4';
SET FOREIGN_KEY_CHECKS = 0;

-- Clean up existing data to avoid duplicates if re-run
DELETE FROM `chapter_progressions`;
DELETE FROM `riddle_progressions`;
DELETE FROM `chapters` WHERE `slug` IN ('base-conversion', 'piano-fractions');

-- ------------------------------------------------------------------------------
-- 1. CHAPTERS
-- ------------------------------------------------------------------------------
INSERT INTO `chapters` (`id`, `slug`, `title`, `statement`, `position`, `created_at`) VALUES
(1, 'base-conversion', 'La date du rendez-vous', 'Déchiffrez les messages secrets de votre père.', 1, CURRENT_TIMESTAMP),
(2, 'piano-fractions', 'Le piano de Pythagore', 'L\'harmonie des nombres et de la musique.', 2, CURRENT_TIMESTAMP);

-- ------------------------------------------------------------------------------
-- 2. CHAPTER 1: BASE CONVERSION
-- ------------------------------------------------------------------------------

-- Step 0: Dialogue
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (100, 1, 0, 'dialogue');
INSERT INTO `step_dialogues` (`step_id`, `theme`) VALUES (100, 'default');
INSERT INTO `dialogue_lines` (`step_id`, `order_index`, `text`, `speaker_id`, `position`) VALUES
(100, 0, 'Pst... Laurence, par ici. Ton père m\'avait prévenu que tu finirais par arriver.', 'Pythagore', 'right'),
(100, 1, 'Pythagore ? Où est mon père ? Dites-moi ce que vous savez !', 'Laurence', 'left'),
(100, 2, 'Il a dû fuir pour échapper au Haut-Conseil. Il veut te voir en secret. Cependant, pour que personne d\'autre ne puisse lire son message, il a chiffré la date du rendez-vous en binaire.', 'Pythagore', 'right');

-- Step 1: Info
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (101, 1, 1, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES (
    101,
    '{
        "titre": "Déchiffrer le Binaire",
        "paragraph": {
            "type": "paragraph",
            "sous-titre": "Convertir du Binaire (Base 2) en Décimal (Base 10)",
            "text": "Le binaire ne contient que des 0 et des 1. Chaque position de droite à gauche représente une puissance de 2."
        },
        "nodes": [
            {
                "type": "element",
                "tag": "div",
                "className": "cours-container",
                "children": [
                    {
                        "type": "element",
                        "tag": "div",
                        "className": "cours-texte",
                        "children": [
                            {
                                "type": "element",
                                "tag": "p",
                                "children": [
                                    "C''est exactement comme notre système décimal, sauf qu''au lieu de compter en dizaines, centaines et milliers, on compte en doubles."
                                ]
                            },
                            {
                                "type": "element",
                                "tag": "div",
                                "className": "regle-or",
                                "children": [
                                    { "type": "element", "tag": "strong", "text": "La règle d''or : " },
                                    "pour convertir un nombre binaire, on prend chaque bit égal à ",
                                    { "type": "element", "tag": "strong", "text": "1" },
                                    " et on fait la ",
                                    { "type": "element", "tag": "strong", "text": "somme de sa valeur" },
                                    " selon sa position."
                                ]
                            },
                            { "type": "element", "tag": "h3", "text": "Les valeurs des positions (de droite à gauche) :" },
                            {
                                "type": "element",
                                "tag": "ul",
                                "children": [
                                    {
                                        "type": "element",
                                        "tag": "li",
                                        "children": ["Position 0 (tout à droite) : 2⁰ = ", { "type": "element", "tag": "strong", "text": "valeur 1" }]
                                    },
                                    {
                                        "type": "element",
                                        "tag": "li",
                                        "children": ["Position 1 : 2¹ = ", { "type": "element", "tag": "strong", "text": "valeur 2" }]
                                    },
                                    {
                                        "type": "element",
                                        "tag": "li",
                                        "children": ["Position 2 : 2² = ", { "type": "element", "tag": "strong", "text": "valeur 4" }]
                                    },
                                    {
                                        "type": "element",
                                        "tag": "li",
                                        "children": ["Position 3 : 2³ = ", { "type": "element", "tag": "strong", "text": "valeur 8" }]
                                    }
                                ]
                            },
                            { "type": "element", "tag": "p", "className": "precision-cours", "text": "(Et ainsi de suite en doublant à chaque fois : 16, 32, 64, 128...)" },
                            { "type": "element", "tag": "p", "className": "consigne-carrousel", "text": "Regarde le carrousel à droite pour voir les exemples appliqués !" }
                        ]
                    },
                    {
                        "type": "element",
                        "tag": "div",
                        "className": "cours-visuel",
                        "children": [
                            {
                                "type": "element",
                                "tag": "div",
                                "className": "carrousel-wrapper",
                                "children": [
                                    { "type": "element", "tag": "input", "attributes": { "type": "radio", "name": "slide-binaire", "id": "exemple1", "checked": true } },
                                    { "type": "element", "tag": "input", "attributes": { "type": "radio", "name": "slide-binaire", "id": "exemple2" } },
                                    {
                                        "type": "element",
                                        "tag": "div",
                                        "className": "slides",
                                        "children": [
                                            {
                                                "type": "element",
                                                "tag": "div",
                                                "className": "slide slide-1",
                                                "children": [
                                                    { "type": "element", "tag": "div", "className": "badge", "text": "Exemple 1" },
                                                    { "type": "element", "tag": "h4", "text": "Le nombre binaire 1011" },
                                                    { "type": "element", "tag": "p", "text": "On associe chaque bit à la valeur de sa position :" },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "tableau-binaire",
                                                        "children": [
                                                            { "type": "binaryColumn", "bit": "1", "label": "Valeur 8", "power": "(2³)", "active": true },
                                                            { "type": "binaryColumn", "bit": "0", "label": "Valeur 4", "power": "(2²)", "active": false },
                                                            { "type": "binaryColumn", "bit": "1", "label": "Valeur 2", "power": "(2¹)", "active": true },
                                                            { "type": "binaryColumn", "bit": "1", "label": "Valeur 1", "power": "(2⁰)", "active": true }
                                                        ]
                                                    },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "calcul-binaire",
                                                        "children": [
                                                            { "type": "element", "tag": "p", "text": "On additionne uniquement là où il y a un 1 :" },
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "equation",
                                                                "children": ["8 + 2 + 1 = ", { "type": "element", "tag": "strong", "className": "resultat-final", "text": "11" }]
                                                            }
                                                        ]
                                                    },
                                                    { "type": "element", "tag": "p", "className": "statut", "text": "En base 10, le nombre vaut 11." }
                                                ]
                                            },
                                            {
                                                "type": "element",
                                                "tag": "div",
                                                "className": "slide slide-2",
                                                "children": [
                                                    { "type": "element", "tag": "div", "className": "badge spec", "text": "Exemple 2" },
                                                    { "type": "element", "tag": "h4", "text": "Un octet : 10010100" },
                                                    { "type": "element", "tag": "p", "text": "On applique la même méthode de droite à gauche :" },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "tableau-binaire mini",
                                                        "children": [
                                                            { "type": "binaryColumn", "bit": "1", "label": "128", "power": "", "active": true },
                                                            { "type": "binaryColumn", "bit": "0", "label": "64", "power": "", "active": false },
                                                            { "type": "binaryColumn", "bit": "0", "label": "32", "power": "", "active": false },
                                                            { "type": "binaryColumn", "bit": "1", "label": "16", "power": "", "active": true },
                                                            { "type": "binaryColumn", "bit": "0", "label": "8", "power": "", "active": false },
                                                            { "type": "binaryColumn", "bit": "1", "label": "4", "power": "", "active": true },
                                                            { "type": "binaryColumn", "bit": "0", "label": "2", "power": "", "active": false },
                                                            { "type": "binaryColumn", "bit": "0", "label": "1", "power": "", "active": false }
                                                        ]
                                                    },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "calcul-binaire",
                                                        "children": [
                                                            { "type": "element", "tag": "p", "text": "On fait la somme des cases actives :" },
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "equation",
                                                                "children": ["128 + 16 + 4 = ", { "type": "element", "tag": "strong", "className": "resultat-final", "text": "148" }]
                                                            }
                                                        ]
                                                    },
                                                    { "type": "element", "tag": "p", "className": "statut", "text": "En base 10, le nombre vaut 148." }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "element",
                                        "tag": "div",
                                        "className": "carrousel-nav",
                                        "children": [
                                            { "type": "element", "tag": "label", "className": "nav-btn btn-1", "attributes": { "for": "exemple1" }, "text": "Sur 4 bits" },
                                            { "type": "element", "tag": "label", "className": "nav-btn btn-2", "attributes": { "for": "exemple2" }, "text": "Sur 8 bits" }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }',
    'default'
);

-- Step 2: Riddle (Practice)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (102, 1, 2, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(1000, 102, 'base-conv-practice-bin', 'BaseConversion', 'practice', 'Entraînement : Binaire vers Décimal', 'Déchiffrez ce fragment de test : combien vaut 00101 en base 10 ?', 'Rappel : En base 2, chaque position en partant de la droite vaut une puissance de 2.', 'Excellent : 4 + 1 = 5. Passez aux véritables données temporelles.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`) VALUES
(1000, 0, '00101', '5', 'Rappelez-vous les puissances de 2 en lisant de droite à gauche (1, 2, 4...). Les \'1\' indiquent quelles valeurs vous devez additionner.', 1);

-- Step 3: Riddle (Challenge)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (103, 1, 3, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `completion_message`) VALUES
(1001, 103, 'base-conv-challenge-date', 'BaseConversion', 'challenge', 'La date du rendez-vous', 'Convertissez chaque fragment binaire laissé par votre père en base 10 pour trouver la date exacte.', 'Parfait ! La date est décodée : 13/09/1956 à 11h30.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`) VALUES
(1001, 0, '1101', '13', 'Sur les quatre premières positions (8, 4, 2, 1), regardez attentivement quelle est la seule puissance de 2 que vous ne devez PAS compter.', 1),
(1001, 1, '1001', '9', 'Ici, seuls le plus grand et le plus petit bit de la séquence sont actifs. Quelles sont leurs valeurs respectives ?', 1),
(1001, 2, '11110100100', '1956', 'Procédez avec méthode. Le bit tout à gauche vaut 1024. Continuez à diviser cette valeur par 2 en vous déplaçant vers la droite pour trouver le poids de chaque \'1\'.', 1),
(1001, 3, '1011', '11', 'Identifiez la position du \'0\' en partant de la droite pour savoir quelle puissance de 2 est exclue de l\'addition.', 1),
(1001, 4, '11110', '30', 'Un indice : le dernier chiffre tout à droite est un 0, ce qui signifie que le résultat final sera forcément un nombre pair.', 1);

-- Step 4: Dialogue
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (104, 1, 4, 'dialogue');
INSERT INTO `step_dialogues` (`step_id`, `theme`) VALUES (104, 'default');
INSERT INTO `dialogue_lines` (`step_id`, `order_index`, `text`, `speaker_id`, `position`) VALUES
(104, 0, 'J\'ai la date ! Mais où est-ce que je suis censée le retrouver ?', 'Laurence', 'left'),
(104, 1, 'C\'est là que ça se corse. Il m\'a transmis ce bout de parchemin. Ce sont des coordonnées cartésiennes pour te repérer dans la ville, mais elles sont notées en Hexadécimal.', 'Pythagore', 'right'),
(104, 2, 'De l\'Hexadécimal ? La base 16, celle qui utilise les lettres de A à F en plus des chiffres ?', 'Laurence', 'left'),
(104, 3, 'Exactement. Pour pouvoir lire ces coordonnées sur une carte standard, tu vas devoir faire la conversion inverse et les ramener dans notre système classique, la Base 10.', 'Pythagore', 'right');

-- Step 5: Info
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (105, 1, 5, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES
(105, '{"title": "Déchiffrer l\'Hexadécimal", "text": "Pour repasser de la base 16 à la base 10 (pour un bloc de 2 caractères) : Prenez le caractère de gauche, multipliez sa valeur par 16, et ajoutez la valeur du caractère de droite. Ex: \'A4\' = (10 x 16) + 4 = 164.", "buttonText": "S\'entraîner"}', 'default');

-- Step 6: Riddle (Practice)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (106, 1, 6, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(1002, 106, 'base-conv-practice-hex', 'HexConversion', 'practice', 'Entraînement : Hexadécimal vers Décimal', 'Convertissez la coordonnée test \'1A\' en Base 10.', 'Rappel : A=10, B=11, C=12, D=13, E=14, F=15.', 'Parfait ! 1 x 16 + 10 = 26. Vous êtes prête à lire la carte.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`) VALUES
(1002, 0, '1A', '26', 'En hexadécimal, la première colonne à gauche compte les \'paquets de 16\'. De son côté, que vaut la lettre A en base 10 ?', 1);

-- Step 7: Riddle (Challenge)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (107, 1, 7, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `completion_message`) VALUES
(1003, 107, 'base-conv-challenge-coords', 'HexConversion', 'challenge', 'Les Coordonnées Géographiques', 'Traduisez les coordonnées X, Y et Z hexadécimales en Base 10 pour trouver le lieu exact.', 'Coordonnées trouvées ! Le lieu du rendez-vous est la Tour de l\'Horloge.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`) VALUES
(1003, 0, 'Axe X : 2B', '43', 'Souvenez-vous que A vaut 10. Déduisez-en la valeur de B, puis occupez-vous du chiffre de gauche qui représente le nombre de \'paquets de 16\'.', 1),
(1003, 1, 'Axe Y : 64', '100', 'Oubliez la base 10 ! Ce n\'est pas le nombre soixante-quatre. Lisez-le comme 6 paquets de 16, auxquels on ajoute 4 unités.', 1),
(1003, 2, 'Axe Z : A5', '165', 'Remplacez d\'abord la lettre par son équivalent numérique. Ce nombre vous indiquera combien de fois vous devez multiplier 16.', 1);

-- Step 8: Info
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (108, 1, 8, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES
(108, '{"title": "En route !", "text": "Munie de la date et des coordonnées exactes du lieu, Laurence se met en route vers la Tour de l\'Horloge. Les réponses ne sont plus très loin.", "buttonText": "Terminer le chapitre"}', 'endChapter');


-- ------------------------------------------------------------------------------
-- 3. CHAPTER 2: PIANO FRACTIONS
-- ------------------------------------------------------------------------------

-- Step 0: Dialogue
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (200, 2, 0, 'dialogue');
INSERT INTO `step_dialogues` (`step_id`, `theme`) VALUES (200, 'default');
INSERT INTO `dialogue_lines` (`step_id`, `order_index`, `text`, `speaker_id`, `position`) VALUES
(200, 0, 'Regarde Laurence ! Pres de l\'autel... C\'est le grand Pythagore en personne !', 'Pape', 'left'),
(200, 1, 'Pythagore ? Peut-etre saura-t-il quelque chose sur mon pere.', 'Laurence', 'left'),
(200, 2, 'J\'ai peut-etre des informations sur ton pere, Laurence. Mais je ne transmets pas mon savoir sans epreuve.', 'Pythagore', 'right'),
(200, 3, 'Avant de t\'enseigner ce que je sais, je dois verifier que tu es au niveau. Resous ma melodie.', 'Pythagore', 'right'),
(200, 4, 'Reduis chaque fraction, multiplie-la par 3/2, puis divise par 2 si le resultat depasse 2. La suite obtenue correspond aux touches du piano.', 'Pythagore', 'right');

-- Step 1: Info
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (201, 2, 1, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES
(201, '{"title": "Transformer une fraction", "text": "Pour reduire une fraction, divisez le numerateur et le denominateur par le meme nombre jusqu\'a obtenir la forme la plus simple. Pour multiplier par 3/2, multipliez les numerateurs entre eux et les denominateurs entre eux. Si le resultat depasse 2, divisez ensuite la fraction par 2 pour revenir dans l\'octave du piano.", "buttonText": "S\'entrainer"}', 'default');

-- Step 2: Riddle (Practice)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (202, 2, 2, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(2000, 202, 'piano-practice', 'PianoFractions', 'practice', 'Suite d\'essai', 'Jouez les 3 notes obtenues dans le bon ordre, puis validez la melodie.', 'Transformez les 3 fractions de la suite : reduisez, multipliez par 3/2, puis divisez par 2 si le resultat depasse 2.', 'Bravo ! Vous avez assemble la suite d\'essai. Passez a l\'epreuve pour completer la melodie.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`, `metadata`) VALUES
(2000, 0, '2/2', 'SOL', 'Si vous divisez un nombre par lui-même, que reste-t-il ? C\'est votre point de départ avant d\'appliquer la règle de Pythagore.', 1, '{"reduced": "1", "targetFraction": "3/2"}'),
(2000, 1, '6/4', 'RE', 'Cette fraction peut être simplifiée. Divisez le haut et le bas par leur plus grand diviseur commun, puis appliquez la multiplication demandée par Pythagore.', 1, '{"reduced": "3/2", "targetFraction": "9/8"}'),
(2000, 2, '18/16', 'LA', 'Avant de faire quoi que ce soit, réduisez cette fraction. Les deux nombres sont pairs, c\'est un bon point de départ.', 1, '{"reduced": "9/8", "targetFraction": "27/16"}');

-- Step 3: Riddle (Challenge)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (203, 2, 3, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(2001, 203, 'piano-challenge', 'PianoFractions', 'challenge', 'Le piano de Pythagore', 'Resoudre toute la suite, jouer la melodie complete, puis valider.', 'Cette fois, la suite contient 6 fractions. Chaque calcul donne une touche du piano.', 'Melodie terminee ! Laurence a prouve qu\'elle pouvait recevoir le savoir de Pythagore.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`, `metadata`) VALUES
(2001, 0, '2/2', 'SOL', 'Si vous divisez un nombre par lui-même, que reste-t-il ? C\'est votre point de départ avant d\'appliquer la règle de Pythagore.', 1, '{"reduced": "1", "targetFraction": "3/2"}'),
(2001, 1, '6/4', 'RE', 'Cette fraction peut être simplifiée. Divisez le haut et le bas par leur plus grand diviseur commun, puis appliquez la multiplication demandée par Pythagore.', 1, '{"reduced": "3/2", "targetFraction": "9/8"}'),
(2001, 2, '18/16', 'LA', 'Avant de faire quoi que ce soit, réduisez cette fraction. Les deux nombres sont pairs, c\'est un bon point de départ.', 1, '{"reduced": "9/8", "targetFraction": "27/16"}'),
(2001, 3, '54/32', 'MI', 'Même avec de grands nombres, la méthode reste la même : réduisez au maximum. Si le résultat de votre calcul final dépasse 2, rappelez-vous la consigne de Pythagore pour ramener la note dans la bonne octave.', 1, '{"reduced": "27/16", "targetFraction": "81/64"}'),
(2001, 4, '162/128', 'SI', 'Prenez le temps de bien simplifier la fraction d\'origine. C\'est la clé pour que la multiplication ne donne pas des nombres insurmontables.', 1, '{"reduced": "81/64", "targetFraction": "243/128"}'),
(2001, 5, '16/12', 'DO+', 'Si vous simplifiez correctement, l\'opération de Pythagore vous donnera un nombre entier rond, très symbolique en musique.', 1, '{"reduced": "4/3", "targetFraction": "2"}');

-- Step 4: Dialogue
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (204, 2, 4, 'dialogue');
INSERT INTO `step_dialogues` (`step_id`, `theme`) VALUES (204, 'default');
INSERT INTO `dialogue_lines` (`step_id`, `order_index`, `text`, `speaker_id`, `position`) VALUES
(204, 0, 'Je suis impressionne, Laurence. Tu as su entendre les nombres derriere la melodie.', 'Pythagore', 'right'),
(204, 1, 'Merci, Pythagore. Je n\'avais jamais pense que la musique et les maths pouvaient etre liees.', 'Laurence', 'left'),
(204, 2, 'Alors, Pythagore ? Laurence a-t-elle le niveau pour apprendre ce que vous savez sur son pere ?', 'Pape', 'left'),
(204, 3, 'Oui. Suivez-moi.', 'Pythagore', 'right');

-- Step 5: Info
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (205, 2, 5, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES
(205, '{"title": "Melodie reconstituee", "text": "Les fractions ont chanté juste. Pythagore accepte de guider Laurence vers les informations sur son pere, son arbre généalogique.", "buttonText": "S\'entrainer"}', 'default');

-- Step 6: Riddle (Practice)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (206, 2, 6, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(2002, 206, 'fractal-practice', 'FractalLuthier', 'practice', 'Entrainement du luthier', 'Ecoutez la cible, puis reglez la complexite sur un arbre de 3 branches avant de tester votre creation.', 'Avant l\'epreuve fractale, Laurence observe un arbre simple pour comprendre le lien entre forme et melodie.', 'Bien joue ! Laurence comprend comment regler un arbre musical simple.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`, `metadata`) VALUES
(2002, 0, 'Pour vous entrainer, retrouvez un petit arbre musical de 3 branches, stable et bien ouvert.', '3:45', 'Lisez bien les instructions : l\'énoncé vous donne directement le nombre de ramifications attendu, et vous demande un angle qui représente le parfait milieu.', 1, '{"targetDepth": 3, "targetAngle": 45}');

-- Step 7: Riddle (Challenge)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (207, 2, 7, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(2003, 207, 'fractal-challenge', 'FractalLuthier', 'challenge', 'Le luthier fractal', 'Ecoutez la melodie cible, reglez la complexite et l\'angle de l\'arbre, puis testez votre creation.', 'Pythagore presente a Laurence un instrument etrange : chaque arbre dessine une melodie.', 'Le luthier fractal est accorde ! Laurence a relie la forme, le nombre et le son.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`, `metadata`) VALUES
(2003, 0, 'Une melodie lente et grave dessine un arbre simple et tres ouvert.', '2:75', 'Comment représenter la \'lenteur\' sur le curseur de complexité ? Pour la gravité, cherchez un angle géométrique qui s\'écarte fortement de la verticale.', 1, '{"targetDepth": 2, "targetAngle": 75}'),
(2003, 1, 'Une pluie de notes rapides et aigues forme une structure fine et tres ramifiee.', '6:15', 'Pour illustrer la rapidité, poussez les ramifications à leur limite. Les notes aiguës, elles, suggèrent une structure très resserrée et pointue.', 1, '{"targetDepth": 6, "targetAngle": 15}'),
(2003, 2, 'La derniere melodie cherche un equilibre : ni trop large, ni trop serree.', '5:45', 'L\'équilibre parfait se trouve dans la nuance. Cherchez une valeur médiane pour l\'angle, et une complexité présente mais sans être au maximum.', 1, '{"targetDepth": 5, "targetAngle": 45}');

-- Step 8: Info
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (208, 2, 8, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES
(208, '{"title": "Arbre reconstituee", "text": "Les fractions et fractales ont chanté juste.", "buttonText": "Retour a la carte"}', 'endChapter');

SET FOREIGN_KEY_CHECKS = 1;
