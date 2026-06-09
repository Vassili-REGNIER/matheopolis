

-- ==============================================================================
-- Matheopolis - CHAPTER 1: BASE CONVERSION
-- ------------------------------------------------------------------------------
SET NAMES 'utf8mb4';
SET FOREIGN_KEY_CHECKS = 0;


-- Step 0: Dialogue
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (100, 1, 0, 'dialogue');
INSERT INTO `step_dialogues` (`step_id`, `theme`) VALUES (100, 'default');
INSERT INTO `dialogue_lines` (`step_id`, `order_index`, `text`, `speaker_id`, `position`) VALUES
(100, 0, 'Pst... Laurence, par ici. Ton père m''avait prévenu que tu finirais par arriver.', 'Pythagore', 'right'),
(100, 1, 'Pythagore ? Où est mon père ? Dites-moi ce que vous savez !', 'Laurence', 'left'),
(100, 2, 'Il a dû fuir pour s''échapper. Il veut te voir en secret. Cependant, pour que personne d''autre ne puisse lire son message, il a chiffré la date du rendez-vous en binaire.', 'Pythagore', 'right');

-- Step 1: Info (Règles du jeu - Binaire)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (110, 1, 1, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES (
    110,
    '{
        "id": "binary-rules",
        "titre": "Règles du jeu",
        "nodes": [
            {
                "type": "element",
                "tag": "div",
                "className": "rules-container",
                "children": [
                    {
                        "type": "element",
                        "tag": "div",
                        "className": "rules-intro",
                        "children": [
                            { "type": "element", "tag": "h2", "text": "Mission de chiffrement binaire" },
                            { "type": "element", "tag": "p", "text": "Dans les archives de Mathéopolis, le message du père de Laurence est verrouillé par des suites de 0 et de 1. Ton rôle est de convertir chaque fragment en nombre décimal pour révéler la date du rendez-vous." }
                        ]
                    },
                    {
                        "type": "element",
                        "tag": "ol",
                        "className": "rules-sequence",
                        "children": [
                            { "type": "element", "tag": "li", "text": "Repère les colonnes qui contiennent un 1 dans la suite binaire." },
                            { "type": "element", "tag": "li", "text": "Additionne uniquement leurs valeurs pour obtenir le nombre en base 10." },
                            { "type": "element", "tag": "li", "text": "Valide chaque conversion pour révéler peu à peu la date secrète." }
                        ]
                    }
                ]
            }
        ],
        "buttonText": "Lire le cours"
    }',
    'default'
);

-- Step 2: Info (Cours Binaire)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (101, 1, 2, 'info');
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
                                    { "type": "element", "tag": "li", "children": ["Position 0 (tout à droite) : 2⁰ = ", { "type": "element", "tag": "strong", "text": "valeur 1" }] },
                                    { "type": "element", "tag": "li", "children": ["Position 1 : 2¹ = ", { "type": "element", "tag": "strong", "text": "valeur 2" }] },
                                    { "type": "element", "tag": "li", "children": ["Position 2 : 2² = ", { "type": "element", "tag": "strong", "text": "valeur 4" }] },
                                    { "type": "element", "tag": "li", "children": ["Position 3 : 2³ = ", { "type": "element", "tag": "strong", "text": "valeur 8" }] }
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
        ],
        "secondaryAction": {
            "text": "Retour aux règles",
            "targetContentId": "binary-rules"
        },
        "buttonText": "S''entraîner"
    }',
    'default'
);

-- Step 3: Riddle (Practice Binaire)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (102, 1, 3, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(1000, 102, 'base-conv-practice-bin', 'BaseConversion', 'practice', 'Entraînement : Binaire vers Décimal', 'Déchiffrez ce fragment de test : combien vaut 00101 en base 10 ?', 'Rappel : En base 2, chaque position en partant de la droite vaut une puissance de 2.', 'Excellent : 4 + 1 = 5. Passez aux véritables données temporelles.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`) VALUES
(1000, 0, '00101', '5', 'Rappelez-vous les puissances de 2 en lisant de droite à gauche (1, 2, 4...). Les ''1'' indiquent quelles valeurs vous devez additionner.', 1);

-- Step 4: Riddle (Challenge Binaire)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (103, 1, 4, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `completion_message`) VALUES
(1001, 103, 'base-conv-challenge-date', 'BaseConversion', 'challenge', 'La date du rendez-vous', 'Convertissez chaque fragment binaire laissé par votre père en base 10 pour trouver la date exacte.', 'Parfait ! La date est décodée : 13/09/1956 à 11h30.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`) VALUES
(1001, 0, '1101', '13', 'Sur les quatre premières positions (8, 4, 2, 1), regardez attentivement quelle est la seule puissance de 2 que vous ne devez PAS compter.', 1),
(1001, 1, '1001', '9', 'Ici, seuls le plus grand et le plus petit bit de la séquence sont actifs. Quelles sont leurs valeurs respectives ?', 1),
(1001, 2, '11110100100', '1956', 'Procédez avec méthode. Le bit tout à gauche vaut 1024. Continuez à diviser cette valeur par 2 en vous déplaçant vers la droite pour trouver le poids de chaque ''1''.', 1),
(1001, 3, '1011', '11', 'Identifiez la position du ''0'' en partant de la droite pour savoir quelle puissance de 2 est exclue de l''addition.', 1),
(1001, 4, '11110', '30', 'Un indice : le dernier chiffre tout à droite est un 0, ce qui signifie que le résultat final sera forcément un nombre pair.', 1);

-- Step 5: Dialogue
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (104, 1, 5, 'dialogue');
INSERT INTO `step_dialogues` (`step_id`, `theme`) VALUES (104, 'default');
INSERT INTO `dialogue_lines` (`step_id`, `order_index`, `text`, `speaker_id`, `position`) VALUES
(104, 0, 'J''ai la date ! Mais où est-ce que je suis censée le retrouver ?', 'Laurence', 'left'),
(104, 1, 'C''est là que ça se corse. Il m''a transmis ce bout de parchemin. Ce sont des coordonnées cartésiennes pour te repérer dans la ville, mais elles sont notées en Hexadécimal.', 'Pythagore', 'right'),
(104, 2, 'De l''Hexadécimal ? La base 16, celle qui utilise les lettres de A à F en plus des chiffres ?', 'Laurence', 'left'),
(104, 3, 'Exactement. Pour pouvoir lire ces coordonnées sur une carte standard, tu vas devoir faire la conversion inverse et les ramener dans notre système classique, la Base 10.', 'Pythagore', 'right');

-- Step 6: Info (Règles du jeu - Hexadécimal)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (111, 1, 6, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES (
    111,
    '{
        "id": "hexadecimal-rules",
        "titre": "Règles du jeu",
        "nodes": [
            {
                "type": "element",
                "tag": "div",
                "className": "rules-container",
                "children": [
                    {
                        "type": "element",
                        "tag": "div",
                        "className": "rules-intro",
                        "children": [
                            { "type": "element", "tag": "h2", "text": "Mission de cartographie hexadécimale" },
                            { "type": "element", "tag": "p", "text": "Les coordonnées de la Tour de l''Horloge sont écrites dans la base des cartographes secrets : l''hexadécimal. Pour guider Laurence dans Mathéopolis, tu dois transformer chaque coordonnée en base 10." }
                        ]
                    },
                    {
                        "type": "element",
                        "tag": "ol",
                        "className": "rules-sequence",
                        "children": [
                            { "type": "element", "tag": "li", "text": "Remplace les lettres A à F par leurs valeurs de 10 à 15." },
                            { "type": "element", "tag": "li", "text": "Multiplie le symbole de gauche par 16, puis ajoute celui de droite." },
                            { "type": "element", "tag": "li", "text": "Valide les axes X, Y et Z pour faire apparaître le lieu du rendez-vous." }
                        ]
                    }
                ]
            }
        ],
        "buttonText": "Lire le cours"
    }',
    'default'
);

-- Step 7: Info (Cours Hexadécimal)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (105, 1, 7, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES (
    105,
    '{
        "id": 2,
        "titre": "Déchiffrer l''Hexadécimal",
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
                            { "type": "element", "tag": "h2", "text": "Convertir l''Hexadécimal en Décimal" },
                            { "type": "element", "tag": "p", "text": "L''hexadécimal utilise 16 symboles : les chiffres de 0 à 9, puis les lettres A à F pour remplacer les nombres de 10 à 15." },
                            {
                                "type": "element",
                                "tag": "div",
                                "className": "table-correspondance",
                                "children": [
                                    { "type": "element", "tag": "span", "children": [{ "type": "element", "tag": "strong", "text": "A" }, " = 10"] },
                                    { "type": "element", "tag": "span", "children": [{ "type": "element", "tag": "strong", "text": "B" }, " = 11"] },
                                    { "type": "element", "tag": "span", "children": [{ "type": "element", "tag": "strong", "text": "C" }, " = 12"] },
                                    { "type": "element", "tag": "span", "children": [{ "type": "element", "tag": "strong", "text": "D" }, " = 13"] },
                                    { "type": "element", "tag": "span", "children": [{ "type": "element", "tag": "strong", "text": "E" }, " = 14"] },
                                    { "type": "element", "tag": "span", "children": [{ "type": "element", "tag": "strong", "text": "F" }, " = 15"] }
                                ]
                            },
                            {
                                "type": "element",
                                "tag": "div",
                                "className": "regle-or",
                                "children": [
                                    { "type": "element", "tag": "strong", "text": "Le secret des positions : " },
                                    "de droite à gauche, chaque position vaut 16 fois plus que la précédente. On appelle ça les ",
                                    { "type": "element", "tag": "strong", "text": "puissances de 16" },
                                    "."
                                ]
                            },
                            { "type": "element", "tag": "h3", "text": "La valeur de chaque colonne :" },
                            {
                                "type": "element",
                                "tag": "ul",
                                "children": [
                                    { "type": "element", "tag": "li", "children": ["Position 0 (à droite) : 16⁰ = ", { "type": "element", "tag": "strong", "text": "valeur 1" }] },
                                    { "type": "element", "tag": "li", "children": ["Position 1 (au milieu) : 16¹ = ", { "type": "element", "tag": "strong", "text": "valeur 16" }] },
                                    { "type": "element", "tag": "li", "children": ["Position 2 (à gauche) : 16² = 16 × 16 = ", { "type": "element", "tag": "strong", "text": "valeur 256" }] }
                                ]
                            },
                            { "type": "element", "tag": "p", "text": "On multiplie le chiffre par la valeur de sa position, puis on fait la somme." }
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
                                    { "type": "element", "tag": "input", "attributes": { "type": "radio", "name": "slide-hexa-new", "id": "h1", "checked": true } },
                                    { "type": "element", "tag": "input", "attributes": { "type": "radio", "name": "slide-hexa-new", "id": "h2" } },
                                    {
                                        "type": "element",
                                        "tag": "div",
                                        "className": "slides",
                                        "children": [
                                            {
                                                "type": "element",
                                                "tag": "div",
                                                "className": "slide",
                                                "children": [
                                                    { "type": "element", "tag": "div", "className": "badge", "text": "Exemple 1" },
                                                    { "type": "element", "tag": "h4", "text": "Le nombre 24" },
                                                    { "type": "element", "tag": "p", "text": "On applique la valeur de chaque colonne :" },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "tableau-hexa",
                                                        "children": [
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "col-hexa",
                                                                "children": [
                                                                    { "type": "element", "tag": "span", "className": "chiffre", "text": "2" },
                                                                    { "type": "element", "tag": "span", "className": "puissance", "children": ["Position 1", { "type": "element", "tag": "small", "text": "(× 16)" }] }
                                                                ]
                                                            },
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "col-hexa",
                                                                "children": [
                                                                    { "type": "element", "tag": "span", "className": "chiffre", "text": "4" },
                                                                    { "type": "element", "tag": "span", "className": "puissance", "children": ["Position 0", { "type": "element", "tag": "small", "text": "(× 1)" }] }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "calcul-hexa",
                                                        "children": [
                                                            { "type": "element", "tag": "div", "className": "calcul-detail", "text": "(2 × 16) + (4 × 1)" },
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "equation",
                                                                "children": ["32 + 4 = ", { "type": "element", "tag": "strong", "className": "resultat-final", "text": "36" }]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                "type": "element",
                                                "tag": "div",
                                                "className": "slide",
                                                "children": [
                                                    { "type": "element", "tag": "div", "className": "badge spec", "text": "Exemple 2" },
                                                    { "type": "element", "tag": "h4", "text": "Le nombre 3B" },
                                                    { "type": "element", "tag": "p", "text": "Le B est en position 0, il est converti en 11." },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "tableau-hexa",
                                                        "children": [
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "col-hexa",
                                                                "children": [
                                                                    { "type": "element", "tag": "span", "className": "chiffre", "text": "3" },
                                                                    { "type": "element", "tag": "span", "className": "puissance", "children": ["Position 1", { "type": "element", "tag": "small", "text": "(× 16)" }] }
                                                                ]
                                                            },
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "col-hexa-lettre",
                                                                "children": [
                                                                    {
                                                                        "type": "element",
                                                                        "tag": "span",
                                                                        "className": "chiffre",
                                                                        "children": ["B", { "type": "element", "tag": "small", "className": "traduc", "text": "(11)" }]
                                                                    },
                                                                    { "type": "element", "tag": "span", "className": "puissance highlight", "children": ["Position 0", { "type": "element", "tag": "small", "text": "(× 1)" }] }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "calcul-hexa",
                                                        "children": [
                                                            { "type": "element", "tag": "div", "className": "calcul-detail", "text": "(3 × 16) + (11 × 1)" },
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "equation",
                                                                "children": ["48 + 11 = ", { "type": "element", "tag": "strong", "className": "resultat-final", "text": "59" }]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "element",
                                        "tag": "div",
                                        "className": "carrousel-nav",
                                        "children": [
                                            { "type": "element", "tag": "label", "className": "nav-btn b-1", "attributes": { "for": "h1" }, "text": "Exemple 24" },
                                            { "type": "element", "tag": "label", "className": "nav-btn b-2", "attributes": { "for": "h2" }, "text": "Exemple 3B" }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        "secondaryAction": {
            "text": "Retour aux règles",
            "targetContentId": "hexadecimal-rules"
        },
        "buttonText": "S''entraîner"
    }',
    'default'
);

-- Step 8: Riddle (Practice Hexadécimal)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (106, 1, 8, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(1002, 106, 'base-conv-practice-hex', 'HexConversion', 'practice', 'Entraînement : Hexadécimal vers Décimal', 'Convertissez la coordonnée test ''1A'' en Base 10.', 'Rappel : A=10, B=11, C=12, D=13, E=14, F=15.', 'Parfait ! 1 x 16 + 10 = 26. Vous êtes prête à lire la carte.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`) VALUES
(1002, 0, '1A', '26', 'En hexadécimal, la première colonne à gauche compte les ''paquets de 16''. De son côté, que vaut la lettre A en base 10 ?', 1);

-- Step 9: Riddle (Challenge Hexadécimal)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (107, 1, 9, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `completion_message`) VALUES
(1003, 107, 'base-conv-challenge-coords', 'HexConversion', 'challenge', 'Les Coordonnées Géographiques', 'Traduisez les coordonnées X, Y et Z hexadécimales en Base 10 pour trouver le lieu exact.', 'Coordonnées trouvées ! Le lieu du rendez-vous est la Tour de l''Horloge.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`) VALUES
(1003, 0, 'Axe X : 2B', '43', 'Souvenez-vous que A vaut 10. Déduisez-en la valeur de B, puis occupez-vous du chiffre de gauche qui représente le nombre de ''paquets de 16''.', 1),
(1003, 1, 'Axe Y : 64', '100', 'Oubliez la base 10 ! Ce n''est pas le nombre soixante-quatre. Lisez-le comme 6 paquets de 16, auxquels on ajoute 4 unités.', 1),
(1003, 2, 'Axe Z : A5', '165', 'Remplacez d''abord la lettre par son équivalent numérique. Ce nombre vous indiquera combien de fois vous devez multiplier 16.', 1);

-- Step 10: Info (Fin de chapitre)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (108, 1, 10, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES
(108, '{"title": "En route !", "text": "Munie de la date et des coordonnées exactes du lieu, Laurence se met en route vers la Tour de l''Horloge. Les réponses ne sont plus très loin.", "buttonText": "Terminer le chapitre"}', 'endChapter');

SET FOREIGN_KEY_CHECKS = 1;