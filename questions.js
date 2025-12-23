const quizData = {
    "9e AF": [
        { subject: "Français", question: "Qui a écrit 'Gouverneurs de la Rosée' ?", answers: ["Jacques Roumain", "Frankétienne", "Dany Laferrière"], correct: 0 },
        { subject: "Maths", question: "Quelle est la racine carrée de 81 ?", answers: ["8", "9", "10"], correct: 1 },
        { subject: "Sciences Sociales", question: "En quelle année Haïti a-t-elle proclamé son indépendance ?", answers: ["1791", "1801", "1804"], correct: 2, explanation: "L'indépendance d'Haïti a été proclamée le 1er janvier 1804 par Jean-Jacques Dessalines, faisant d'Haïti la première république noire libre du monde." },
        { subject: "Physique", question: "Quelle unité mesure la force ?", answers: ["Le Watt", "Le Newton", "Le Joule"], correct: 1 },
        { subject: "Anglais", question: "How do you say 'bonjour' in English?", answers: ["Good evening", "Hello", "Goodbye"], correct: 1 },
        { subject: "Créole", question: "Kisa 'lakay' vle di an franse ?", answers: ["Maison", "Marché", "École"], correct: 0 },
        { subject: "Espagnol", question: "¿Cómo se dice 'rojo' en francés?", answers: ["Bleu", "Vert", "Rouge"], correct: 2 },
        { subject: "EPS", question: "Combien de joueurs composent une équipe de football sur le terrain ?", answers: ["9", "11", "13"], correct: 1 },
        { subject: "ETAP", question: "Quel outil est utilisé pour planter un clou ?", answers: ["Une scie", "Un marteau", "Un tournevis"], correct: 1 },
        { subject: "EC", question: "Quel est le symbole de la justice ?", answers: ["Une colombe", "Une balance", "Un lion"], correct: 1 },
        { subject: "EEA", question: "Quelle couleur obtient-on en mélangeant du bleu et du jaune ?", answers: ["Le rouge", "Le violet", "Le vert"], correct: 2 }
    ],
    SES: [
        { subject: "Économie", question: "Qu'est-ce que le PIB ?", answers: ["Produit Intérieur Brut", "Parti Intérieur Basque", "Produit Industriel de Base"], correct: 0 },
        { subject: "Sciences Sociales", question: "Qui est considéré comme le père de la sociologie moderne ?", answers: ["Karl Marx", "Émile Durkheim", "Max Weber"], correct: 1 },
        { subject: "Philosophie", question: "Que signifie 'Cogito, ergo sum' ?", answers: ["Je pense, donc je suis", "Je vois, donc je crois", "J'agis, donc j'existe"], correct: 0 },
        { subject: "Histoire", question: "En quelle année a eu lieu la Révolution française ?", answers: ["1789", "1848", "1917"], correct: 0 },
        { subject: "Maths", question: "Si un article coûte 100 gourdes et est soldé à 20%, quel est son nouveau prix ?", answers: ["80 gourdes", "120 gourdes", "20 gourdes"], correct: 0 }
    ],
    SVT: [
        { subject: "Biologie", question: "Quelle est la plus grande cellule du corps humain ?", answers: ["Ovule", "Neurone", "Cellule musculaire"], correct: 0 },
        { subject: "Géologie", question: "Quel est le nom de la couche la plus externe de la Terre ?", answers: ["Le manteau", "Le noyau", "La croûte terrestre"], correct: 2 },
        { subject: "Chimie", question: "Quel est le symbole chimique de l'or ?", answers: ["Ag", "Au", "Fe"], correct: 1, explanation: "Le symbole 'Au' pour l'or vient de son nom latin 'Aurum'. 'Ag' est le symbole de l'argent (Argentum) et 'Fe' est celui du fer (Ferrum)." },
        { subject: "Philosophie", question: "Qui a écrit 'Le Contrat Social' ?", answers: ["Voltaire", "Rousseau", "Montesquieu"], correct: 1 },
        { subject: "Physique", question: "Quelle est l'unité de mesure de la tension électrique ?", answers: ["Ampère", "Watt", "Volt"], correct: 2 },
        { subject: "Maths", question: "Calculez l'aire d'un cercle de rayon 5cm (π ≈ 3.14).", answers: ["78.5 cm²", "31.4 cm²", "15.7 cm²"], correct: 0 }
    ],
    LLA: [
        { subject: "Art", question: "Qui a écrit 'L'Étranger' ?", answers: ["Victor Hugo", "Albert Camus", "Marcel Proust"], correct: 1 },
        { subject: "Philosophie", question: "Quel mouvement littéraire est associé à Charles Baudelaire ?", answers: ["Le Romantisme", "Le Surréalisme", "Le Symbolisme"], correct: 2 },
        { subject: "Anglais", question: "Which of these is a synonym for 'happy'?", answers: ["Sad", "Joyful", "Angry"], correct: 1 },
        { subject: "Espagnol", question: "Traduce 'libro' al francés.", answers: ["Livre", "Table", "Chaise"], correct: 0 },
        { subject: "Créole", question: "Ki powèt ayisyen ki ekri 'Pèlen Tèt' ?", answers: ["Félix Morisseau-Leroy", "Frankétienne", "Georges Castera"], correct: 1 },
        { subject: "Musique", question: "Combien de cordes une guitare classique a-t-elle généralement ?", answers: ["4", "6", "8"], correct: 1 },
        { subject: "Sciences Sociales", question: "Quel est le plus grand océan du monde ?", answers: ["Atlantique", "Indien", "Pacifique"], correct: 2 }
    ],
    SMP: [
        { subject: "Maths", question: "Combien de côtés a un hexagone ?", answers: ["5", "6", "7"], correct: 1 },
        { subject: "Physique", question: "Quelle loi de Newton stipule que 'toute action entraîne une réaction égale et opposée' ?", answers: ["Première loi", "Deuxième loi", "Troisième loi"], correct: 2 },
        { subject: "Chimie", question: "Quelle est la formule chimique de l'eau ?", answers: ["CO2", "H2O", "O2"], correct: 1 },
        { subject: "Anglais", question: "What is the capital of the UK?", answers: ["Paris", "London", "Berlin"], correct: 1 },
        { subject: "Biologie", question: "Quel organite est la 'centrale énergétique' de la cellule ?", answers: ["Noyau", "Mitochondrie", "Ribosome"], correct: 1 },
        { subject: "Philosophie", question: "Quel philosophe grec était le maître d'Alexandre le Grand ?", answers: ["Platon", "Socrate", "Aristote"], correct: 2 }
    ]
};