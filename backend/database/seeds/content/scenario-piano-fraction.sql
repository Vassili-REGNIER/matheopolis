

-- ------------------------------------------------------------------------------
-- 3. CHAPTER 2: PIANO FRACTIONS
-- ------------------------------------------------------------------------------

SET NAMES 'utf8mb4';
SET FOREIGN_KEY_CHECKS = 0;


-- Step 0: Dialogue
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (200, 2, 0, 'dialogue');
INSERT INTO `step_dialogues` (`step_id`, `theme`) VALUES (200, 'default');
INSERT INTO `dialogue_lines` (`step_id`, `order_index`, `text`, `speaker_id`, `position`) VALUES
(200, 0, 'Regarde Laurence ! Pres de l''autel... C''est le grand Pythagore en personne !', 'Pape', 'left'),
(200, 1, 'Pythagore ? Peut-etre saura-t-il quelque chose sur mon pere.', 'Laurence', 'left'),
(200, 2, 'J''ai peut-etre des informations sur ton pere, Laurence. Mais je ne transmets pas mon savoir sans epreuve.', 'Pythagore', 'right'),
(200, 3, 'Avant de t''enseigner ce que je sais, je dois verifier que tu es au niveau. Resous ma melodie.', 'Pythagore', 'right'),
(200, 4, 'Reduis chaque fraction, multiplie-la par 3/2, puis divise par 2 si le resultat depasse 2. La suite obtenue correspond aux touches du piano.', 'Pythagore', 'right');

-- Step 1: Info (Règles du jeu - Fractions)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (210, 2, 1, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES (
    210,
    '{
        "id": "fraction-piano-rules",
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
                            { "type": "element", "tag": "h2", "text": "Mission de la gamme de Pythagore" },
                            { "type": "element", "tag": "p", "text": "Dans le temple de Mathéopolis, chaque fraction cache une note. Pour prouver que Laurence peut entendre les nombres derrière la musique, transforme les fractions puis joue la mélodie dans le bon ordre." }
                        ]
                    },
                    {
                        "type": "element",
                        "tag": "ol",
                        "className": "rules-sequence",
                        "children": [
                            { "type": "element", "tag": "li", "text": "Réduis chaque fraction pour révéler sa forme la plus simple." },
                            { "type": "element", "tag": "li", "text": "Multiplie-la par 3/2, puis divise par 2 si elle dépasse l''octave." },
                            { "type": "element", "tag": "li", "text": "Joue les notes obtenues dans l''ordre et valide la mélodie." }
                        ]
                    }
                ]
            }
        ],
        "buttonText": "Lire le cours"
    }',
    'default'
);

-- Step 2: Info (Cours Fractions)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (201, 2, 2, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES (
    201,
    '{
        "id": 3,
        "titre": "Transformer une fraction",
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
                            { "type": "element", "tag": "h2", "text": "Comment réduire une fraction ?" },
                            {
                                "type": "element",
                                "tag": "p",
                                "children": [
                                    "Simplifier une fraction, ou la ",
                                    { "type": "element", "tag": "strong", "text": "réduire" },
                                    ", c''est écrire la même fraction mais avec des ",
                                    { "type": "element", "tag": "strong", "text": "nombres plus petits" },
                                    " pour la rendre plus facile à lire."
                                ]
                            },
                            {
                                "type": "element",
                                "tag": "div",
                                "className": "regle-or",
                                "children": [
                                    { "type": "element", "tag": "strong", "text": "La règle d''or : " },
                                    "on ne change pas la valeur d''une fraction si on ",
                                    { "type": "element", "tag": "strong", "text": "divise" },
                                    " le haut et le bas par un ",
                                    { "type": "element", "tag": "même nombre" },
                                    "."
                                ]
                            },
                            { "type": "element", "tag": "h3", "text": "Les étapes clés :" },
                            {
                                "type": "element",
                                "tag": "ul",
                                "children": [
                                    { "type": "element", "tag": "li", "children": [{ "type": "element", "tag": "strong", "text": "Étape 1 : " }, "repérer un diviseur commun avec les nombres pairs ou les tables de multiplication."] },
                                    { "type": "element", "tag": "li", "children": [{ "type": "element", "tag": "strong", "text": "Étape 2 : " }, "diviser le numérateur et le dénominateur, ou décomposer les nombres pour barrer les facteurs identiques."] },
                                    { "type": "element", "tag": "li", "children": [{ "type": "element", "tag": "strong", "text": "Étape 3 : " }, "s''arrêter quand la fraction devient ", { "type": "element", "tag": "strong", "text": "irréductible" }, "."] }
                                ]
                            },
                            { "type": "element", "tag": "p", "className": "consigne-carrousel", "text": "Utilise le carrousel à droite pour visualiser les deux méthodes." }
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
                                    { "type": "element", "tag": "input", "attributes": { "type": "radio", "name": "slide", "id": "methode1", "checked": true } },
                                    { "type": "element", "tag": "input", "attributes": { "type": "radio", "name": "slide", "id": "methode2" } },
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
                                                    { "type": "element", "tag": "div", "className": "badge", "text": "Méthode 1" },
                                                    { "type": "element", "tag": "h4", "text": "Le pas à pas" },
                                                    { "type": "element", "tag": "p", "text": "On divise petit à petit en cherchant les nombres pairs ou les tables." },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "fraction-display",
                                                        "children": [
                                                            { "type": "element", "tag": "span", "className": "frac", "children": [{ "type": "element", "tag": "span", "text": "42" }, { "type": "element", "tag": "span", "className": "bar", "text": "/" }, { "type": "element", "tag": "span", "text": "60" }] },
                                                            { "type": "element", "tag": "span", "className": "fleche", "text": "÷2 →" },
                                                            { "type": "element", "tag": "span", "className": "frac", "children": [{ "type": "element", "tag": "span", "text": "21" }, { "type": "element", "tag": "span", "className": "bar", "text": "/" }, { "type": "element", "tag": "span", "text": "30" }] },
                                                            { "type": "element", "tag": "span", "className": "fleche", "text": "÷3 →" },
                                                            { "type": "element", "tag": "span", "className": "frac-concept", "children": [{ "type": "element", "tag": "span", "text": "7" }, { "type": "element", "tag": "span", "className": "bar", "text": "/" }, { "type": "element", "tag": "span", "text": "10" }] }
                                                        ]
                                                    },
                                                    { "type": "element", "tag": "p", "className": "statut", "text": "Fraction irréductible !" }
                                                ]
                                            },
                                            {
                                                "type": "element",
                                                "tag": "div",
                                                "className": "slide slide-2",
                                                "children": [
                                                    { "type": "element", "tag": "div", "className": "badge spec", "text": "Méthode 2" },
                                                    { "type": "element", "tag": "h4", "text": "La décomposition" },
                                                    { "type": "element", "tag": "p", "text": "On casse les nombres pour barrer les facteurs identiques." },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "fraction-display",
                                                        "children": [
                                                            { "type": "element", "tag": "span", "className": "frac", "children": [{ "type": "element", "tag": "span", "text": "12" }, { "type": "element", "tag": "span", "className": "bar", "text": "/" }, { "type": "element", "tag": "span", "text": "18" }] },
                                                            { "type": "element", "tag": "span", "className": "fleche", "text": "→" },
                                                            { "type": "element", "tag": "span", "className": "frac", "children": [{ "type": "element", "tag": "span", "text": "6 × 2" }, { "type": "element", "tag": "span", "className": "bar", "text": "/" }, { "type": "element", "tag": "span", "text": "6 × 3" }] },
                                                            { "type": "element", "tag": "span", "className": "fleche", "text": "→" },
                                                            { "type": "element", "tag": "span", "className": "frac-concept", "children": [{ "type": "element", "tag": "span", "text": "2" }, { "type": "element", "tag": "span", "className": "bar", "text": "/" }, { "type": "element", "tag": "span", "text": "3" }] }
                                                        ]
                                                    },
                                                    { "type": "element", "tag": "p", "className": "statut", "text": "Le 6 s''en va en haut et en bas." }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "element",
                                        "tag": "div",
                                        "className": "carrousel-nav",
                                        "children": [
                                            { "type": "element", "tag": "label", "className": "nav-btn btn-1", "attributes": { "for": "methode1" }, "text": "Étape par étape" },
                                            { "type": "element", "tag": "label", "className": "nav-btn btn-2", "attributes": { "for": "methode2" }, "text": "Décomposition" }
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
            "targetContentId": "fraction-piano-rules"
        },
        "buttonText": "S''entraîner"
    }',
    'default'
);

-- Step 3: Riddle (Practice Fractions)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (202, 2, 3, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(2000, 202, 'piano-practice', 'PianoFractions', 'practice', 'Suite d''essai', 'Jouez les 3 notes obtenues dans le bon ordre, puis validez la melodie.', 'Transformez les 3 fractions de la suite : reduisez, multipliez par 3/2, puis divisez par 2 si le resultat depasse 2.', 'Bravo ! Vous avez assemble la suite d''essai. Passez a l''epreuve pour completer la melodie.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`, `metadata`) VALUES
(2000, 0, '2/2', 'SOL', 'Si vous divisez un nombre par lui-même, que reste-t-il ? C''est votre point de départ avant d''appliquer la règle de Pythagore.', 1, '{"reduced": "1", "targetFraction": "3/2"}'),
(2000, 1, '6/4', 'RE', 'Cette fraction peut être simplifiée. Divisez le haut et le bas par leur plus grand diviseur commun, puis appliquez la multiplication demandée par Pythagore.', 1, '{"reduced": "3/2", "targetFraction": "9/8"}'),
(2000, 2, '18/16', 'LA', 'Avant de faire quoi que ce soit, réduisez cette fraction. Les deux nombres sont pairs, c''est un bon point de départ.', 1, '{"reduced": "9/8", "targetFraction": "27/16"}');

-- Step 4: Riddle (Challenge Fractions)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (203, 2, 4, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(2001, 203, 'piano-challenge', 'PianoFractions', 'challenge', 'La gamme de Pythagore', 'Resoudre toute the suite, jouer la melodie complete, puis valider.', 'Cette fois, la suite contient 6 fractions. Chaque calcul donne une touche du piano.', 'Melodie terminee ! Laurence a prouve qu''elle pouvait recevoir le savoir de Pythagore.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`, `metadata`) VALUES
(2001, 0, '2/2', 'SOL', 'Si vous divisez un nombre par lui-même, que reste-t-il ? C''est votre point de départ avant d''appliquer la règle de Pythagore.', 1, '{"reduced": "1", "targetFraction": "3/2"}'),
(2001, 1, '6/4', 'RE', 'Cette fraction peut être simplifiée. Divisez le haut et le bas par leur plus grand diviseur commun, puis appliquez la multiplication demandée par Pythagore.', 1, '{"reduced": "3/2", "targetFraction": "9/8"}'),
(2001, 2, '18/16', 'LA', 'Avant de faire quoi que ce soit, réduisez cette fraction. Les deux nombres sont pairs, c''est un bon point de départ.', 1, '{"reduced": "9/8", "targetFraction": "27/16"}'),
(2001, 3, '54/32', 'MI', 'Même avec de grands nombres, la méthode reste la même : réduisez au maximum. Si le résultat de votre calcul final dépasse 2, rappelez-vous la consigne de Pythagore pour ramener la note dans la bonne octave.', 1, '{"reduced": "27/16", "targetFraction": "81/64"}'),
(2001, 4, '162/128', 'SI', 'Prenez le temps de bien simplifier la fraction d''origine. C''est la clé pour que la multiplication ne donne pas des nombres insurmontables.', 1, '{"reduced": "81/64", "targetFraction": "243/128"}'),
(2001, 5, '16/12', 'DO+', 'Si vous simplifiez correctement, l''opération de Pythagore vous donnera un nombre entier rond, très symbolique en musique.', 1, '{"reduced": "4/3", "targetFraction": "2"}');

-- Step 5: Dialogue
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (204, 2, 5, 'dialogue');
INSERT INTO `step_dialogues` (`step_id`, `theme`) VALUES (204, 'default');
INSERT INTO `dialogue_lines` (`step_id`, `order_index`, `text`, `speaker_id`, `position`) VALUES
(204, 0, 'Je suis impressionne, Laurence. Tu as su entendre les nombres derriere la melodie.', 'Pythagore', 'right'),
(204, 1, 'Merci, Pythagore. Je n''avais jamais pense que la musique et les maths pouvaient etre liees.', 'Laurence', 'left'),
(204, 2, 'Alors, Pythagore ? Laurence a-t-elle le niveau pour apprendre ce que vous savez sur son pere ?', 'Pape', 'left'),
(204, 3, 'Oui. Suivez-moi.', 'Pythagore', 'right');

-- Step 6: Info (Règles du jeu - Fractales)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (211, 2, 6, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES (
    211,
    '{
        "id": "fractal-luthier-rules",
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
                            { "type": "element", "tag": "h2", "text": "Mission du luthier fractal" },
                            { "type": "element", "tag": "p", "text": "Dans l''atelier secret de Mathéopolis, chaque arbre dessiné fait naître une mélodie. Pour aider Laurence, règle la forme de l''arbre jusqu''à retrouver le son demandé par Pythagore." }
                        ]
                    },
                    {
                        "type": "element",
                        "tag": "ol",
                        "className": "rules-sequence",
                        "children": [
                            { "type": "element", "tag": "li", "text": "Écoute la mélodie cible et observe son rythme." },
                            { "type": "element", "tag": "li", "text": "Règle la complexité et l''angle pour façonner l''arbre correspondant." },
                            { "type": "element", "tag": "li", "text": "Teste, ajuste, puis valide quand la forme et le son s''accordent." }
                        ]
                    }
                ]
            }
        ],
        "buttonText": "Lire le cours"
    }',
    'default'
);

-- Step 7: Info (Cours Fractales)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (205, 2, 7, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES (
    205,
    '{
        "id": "fractal-world-course",
        "titre": "Monde des Fractales",
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
                            { "type": "element", "tag": "h2", "text": "Qu''est-ce qu''une fractale ?" },
                            {
                                "type": "element",
                                "tag": "p",
                                "children": [
                                    "Une ",
                                    { "type": "element", "tag": "strong", "text": "fractale" },
                                    " est une forme géométrique où une petite partie ressemble au tout. C''est le principe d''",
                                    { "type": "element", "tag": "strong", "text": "auto-similitude" },
                                    " : quand on zoome, on retrouve le même motif."
                                ]
                            },
                            {
                                "type": "element",
                                "tag": "div",
                                "className": "regle-or",
                                "children": [
                                    { "type": "element", "tag": "strong", "text": "La règle d''or : " },
                                    "plus on répète le motif, plus la forme devient détaillée. Dans le jeu, cette répétition is la ",
                                    { "type": "element", "tag": "strong", "text": "complexité" },
                                    "."
                                ]
                            },
                            { "type": "element", "tag": "h3", "text": "Les idées à retenir :" },
                            {
                                "type": "element",
                                "tag": "ul",
                                "children": [
                                    { "type": "element", "tag": "li", "children": [{ "type": "element", "tag": "strong", "text": "Complexité basse : " }, "le motif reste simple, comme un tronc avec quelques branches."] },
                                    { "type": "element", "tag": "li", "children": [{ "type": "element", "tag": "strong", "text": "Complexité haute : " }, "les répétitions se multiplient et créent beaucoup de petits détails."] },
                                    { "type": "element", "tag": "li", "children": [{ "type": "element", "tag": "strong", "text": "Musique fractale : " }, "une grande mélodie peut être répétée en petites notes rapides, comme un zoom sonore."] }
                                ]
                            },
                            { "type": "element", "tag": "p", "className": "consigne-carrousel", "text": "Utilise le carrousel à droite pour visualiser le zoom fractal et l''effet de la complexité." }
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
                                    { "type": "element", "tag": "input", "attributes": { "type": "radio", "name": "slide-fractale-layout", "id": "tab-auto-ly", "checked": true } },
                                    { "type": "element", "tag": "input", "attributes": { "type": "radio", "name": "slide-fractale-layout", "id": "tab-comp-ly" } },
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
                                                    { "type": "element", "tag": "div", "className": "badge", "text": "Formes et zoom" },
                                                    { "type": "element", "tag": "h4", "text": "L''effet poupée russe" },
                                                    { "type": "element", "tag": "p", "text": "Le motif se répète en petit à l''intérieur de lui-même." },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "visualisation-fractale",
                                                        "children": [
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "motif-fractal-visuel",
                                                                "children": [
                                                                    {
                                                                        "type": "element",
                                                                        "tag": "div",
                                                                        "className": "boite-ext",
                                                                        "children": [
                                                                            {
                                                                                "type": "element",
                                                                                "tag": "div",
                                                                                "className": "boite-med",
                                                                                "children": [{ "type": "element", "tag": "div", "className": "boite-int" }]
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
                                                        "className": "autres-exemples",
                                                        "children": [
                                                            { "type": "element", "tag": "strong", "text": "Dans la nature : " },
                                                            {
                                                                "type": "element",
                                                                "tag": "ul",
                                                                "children": [
                                                                    { "type": "element", "tag": "li", "text": "Le chou romanesco répète des petites pyramides dans des pyramides plus grandes." },
                                                                    { "type": "element", "tag": "li", "text": "Les poumons se divisent en branches de plus en plus fines." }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    { "type": "element", "tag": "p", "className": "statut-fractale", "text": "Du grand angle jusqu''au micro-détail." }
                                                ]
                                            },
                                            {
                                                "type": "element",
                                                "tag": "div",
                                                "className": "slide",
                                                "children": [
                                                    { "type": "element", "tag": "div", "className": "badge spec", "text": "Complexité et son" },
                                                    { "type": "element", "tag": "h4", "text": "Complexité et rythme" },
                                                    { "type": "element", "tag": "p", "text": "Plus la complexité augmente, plus le rythme s''enrichit." },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "visualisation-fractale grid-comp",
                                                        "children": [
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "comp-box",
                                                                "children": [
                                                                    { "type": "element", "tag": "span", "className": "label-comp", "text": "Complexité 1" },
                                                                    { "type": "element", "tag": "div", "className": "onde-simple", "children": [{ "type": "element", "tag": "div", "className": "b-simple" }, { "type": "element", "tag": "div", "className": "b-simple sub" }, { "type": "element", "tag": "div", "className": "b-simple" }] },
                                                                    { "type": "element", "tag": "small", "text": "Notes longues et lentes" }
                                                                ]
                                                            },
                                                            {
                                                                "type": "element",
                                                                "tag": "div",
                                                                "className": "comp-box",
                                                                "children": [
                                                                    { "type": "element", "tag": "span", "className": "label-comp spec-txt", "text": "Complexité 12" },
                                                                    { "type": "element", "tag": "div", "className": "onde-complexe", "children": [{ "type": "element", "tag": "div", "className": "b-comp" }, { "type": "element", "tag": "div", "className": "b-comp h1" }, { "type": "element", "tag": "div", "className": "b-comp h2" }, { "type": "element", "tag": "div", "className": "b-comp h1" }, { "type": "element", "tag": "div", "className": "b-comp" }, { "type": "element", "tag": "div", "className": "b-comp h2" }, { "type": "element", "tag": "div", "className": "b-comp h3" }] },
                                                                    { "type": "element", "tag": "small", "text": "Nuage de notes imbriquées" }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    {
                                                        "type": "element",
                                                        "tag": "div",
                                                        "className": "autres-exemples",
                                                        "children": [
                                                            { "type": "element", "tag": "strong", "text": "Dans les sons : " },
                                                            {
                                                                "type": "element",
                                                                "tag": "ul",
                                                                "children": [
                                                                    { "type": "element", "tag": "li", "text": "La pluie et les vagues gardent des rythmes similaires à plusieurs échelles." },
                                                                    { "type": "element", "tag": "li", "text": "Certaines musiques répètent une même idée en notes longues puis en notes très rapides." }
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    { "type": "element", "tag": "p", "className": "statut-fractale", "text": "La complexité crée la richesse du morceau." }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        "type": "element",
                                        "tag": "div",
                                        "className": "carrousel-nav",
                                        "children": [
                                            { "type": "element", "tag": "label", "className": "nav-btn b-1", "attributes": { "for": "tab-auto-ly" }, "text": "Exemple de forme" },
                                            { "type": "element", "tag": "label", "className": "nav-btn b-2", "attributes": { "for": "tab-comp-ly" }, "text": "Exemple musical" }
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
            "targetContentId": "fractal-luthier-rules"
        },
        "buttonText": "S''entraîner"
    }',
    'default'
);

-- Step 8: Riddle (Practice Fractales)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (206, 2, 8, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(2002, 206, 'fractal-practice', 'FractalLuthier', 'practice', 'Entrainement du luthier', 'Ecoutez la cible, puis reglez la complexite sur un arbre de 3 branches avant de tester votre creation.', 'Avant l''epreuve fractale, Laurence observe un arbre simple pour comprendre le lien entre forme et melodie.', 'Bien joue ! Laurence comprend comment regler un arbre musical simple.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`, `metadata`) VALUES
(2002, 0, 'Pour vous entrainer, retrouvez un petit arbre musical de 3 branches, stable et bien ouvert.', '3:45', 'Lisez bien les instructions : l''énoncé vous donne directement le nombre de ramifications attendu, et vous demande un angle qui représente le parfait milieu.', 1, '{"targetDepth": 3, "targetAngle": 45}');

-- Step 9: Riddle (Challenge Fractales)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (207, 2, 9, 'riddle');
INSERT INTO `riddles` (`id`, `step_id`, `slug`, `game_id`, `mode`, `title`, `instruction`, `intro_text`, `completion_message`) VALUES
(2003, 207, 'fractal-challenge', 'FractalLuthier', 'challenge', 'Le luthier fractal', 'Ecoutez la melodie cible, reglez la complexite et l''angle de l''arbre, puis testez votre creation.', 'Pythagore presente a Laurence un instrument etrange : chaque arbre dessine une melodie.', 'Le luthier fractal est accorde ! Laurence a relie la forme, le nombre et le son.');
INSERT INTO `riddle_questions` (`riddle_id`, `order_index`, `prompt`, `answer`, `hint`, `difficulty`, `metadata`) VALUES
(2003, 0, 'Une melodie lente et grave dessine un arbre simple et tres ouvert.', '2:75', 'Comment représenter la ''lenteur'' sur le curseur de complexité ? Pour la gravité, cherchez un angle géométrique qui s''écarte fortement de la verticale.', 1, '{"targetDepth": 2, "targetAngle": 75}'),
(2003, 1, 'Une pluie de notes rapides et aigues forme une structure fine et tres ramifiee.', '6:15', 'Pour illustrer la rapidité, poussez les ramifications à leur limite. Les notes aiguës, elles, suggèrent une structure très resserrée et pointue.', 1, '{"targetDepth": 6, "targetAngle": 15}'),
(2003, 2, 'La derniere melodie cherche un equilibre : ni trop large, ni trop serree.', '5:45', 'L''équilibre parfait se trouve dans la nuance. Cherchez une valeur médiane pour l''angle, et une complexité présente mais sans être au maximum.', 1, '{"targetDepth": 5, "targetAngle": 45}');

-- Step 10: Info (Fin de chapitre)
INSERT INTO `chapter_steps` (`id`, `chapter_id`, `order_index`, `type`) VALUES (208, 2, 10, 'info');
INSERT INTO `step_infos` (`step_id`, `content`, `theme`) VALUES
(208, '{"title": "Arbre reconstituee", "text": "Les fractions et fractales ont chanté juste.", "buttonText": "Retour a la carte"}', 'endChapter');

SET FOREIGN_KEY_CHECKS = 1;
