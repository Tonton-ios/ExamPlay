document.addEventListener('DOMContentLoaded', async () => { // Rendre la fonction asynchrone
    // --- VARIABLES GLOBALES ---
    const allPages = document.querySelectorAll('.page');
     // --- GESTION DU MENU HAMBURGER (MOBILE) ---
     const navToggle = document.querySelector('.nav-toggle');
     const mainNav = document.querySelector('.main-nav');
 
     if (navToggle && mainNav) {
         navToggle.addEventListener('click', () => {
             mainNav.classList.toggle('active');
         });
 
         // Fermer le menu si on clique sur un lien (pour la navigation sur la même page)
         mainNav.querySelectorAll('a').forEach(link => {
             link.addEventListener('click', () => {
                 mainNav.classList.remove('active');
             });
         });
     }

    const allNavButtons = document.querySelectorAll('[data-target]');
    let timerInterval;
    let currentUser = null; // Pour stocker les infos de l'utilisateur
    let tempGoogleUser = null; // Pour stocker temporairement les infos d'un nouvel utilisateur Google
    let pageHistory = []; // Pour gérer l'historique de navigation

    // --- CONSTANTES DE CONFIGURATION ---
    const QUESTIONS_PER_QUIZ = 25; // Nombre de questions par quiz
    const TIME_PER_QUIZ = QUESTIONS_PER_QUIZ * 30; // 30 secondes par question
    const POINTS_PER_CORRECT_ANSWER = 10;
    const POINTS_PER_MAJOR_SUBJECT_ANSWER = 20; // Points bonus pour une matière principale
    const NEXT_QUESTION_DELAY = 1500; // Délai en ms avant la question suivante

    // --- ETAT DE L'APPLICATION ---
    const appState = {
        currentSerie: '',
        currentSubject: '',
        currentQuestions: [],
        currentQuestionIndex: 0,
        score: 0,
    };
    
    // --- CONFIGURATION SUPABASE ---
    const SUPABASE_URL = 'https://rhferbbmwductjqwfsie.supabase.co'; //  URL du projet Supabase
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZmVyYmJtd2R1Y3RqcXdmc2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDc0ODQsImV4cCI6MjA4MTM4MzQ4NH0.3GmSvvkcTwzTTxbe9K0L0SHhvholI4-xA3Kl6JuSdok'; //  clé anon public du projet
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- BASE DE DONNÉES DES QUESTIONS (AVEC MATIÈRES) ---
    const quizData = {
        "9e AF": [
            { subject: "Français", question: "Qui a écrit 'Gouverneurs de la Rosée' ?", answers: ["Jacques Roumain", "Frankétienne", "Dany Laferrière"], correct: 0 },
            { subject: "Maths", question: "Quelle est la racine carrée de 81 ?", answers: ["8", "9", "10"], correct: 1 },
            { subject: "Sciences Sociales", question: "En quelle année Haïti a-t-elle proclamé son indépendance ?", answers: ["1791", "1801", "1804"], correct: 2 },
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
            { subject: "Sciences Sociales", question: "Qui est considéré comme le père de la sociologie moderne ?", answers: ["Karl Marx", "Émile Durkheim", "Max Weber"], correct: 1 }, // Déjà présent
            { subject: "Philosophie", question: "Que signifie 'Cogito, ergo sum' ?", answers: ["Je pense, donc je suis", "Je vois, donc je crois", "J'agis, donc j'existe"], correct: 0 },
            { subject: "Histoire", question: "En quelle année a eu lieu la Révolution française ?", answers: ["1789", "1848", "1917"], correct: 0 },
            { subject: "Maths", question: "Si un article coûte 100 gourdes et est soldé à 20%, quel est son nouveau prix ?", answers: ["80 gourdes", "120 gourdes", "20 gourdes"], correct: 0 } // Ajout
        ],
        SVT: [
            { subject: "Biologie", question: "Quelle est la plus grande cellule du corps humain ?", answers: ["Ovule", "Neurone", "Cellule musculaire"], correct: 0 },
            { subject: "Géologie", question: "Quel est le nom de la couche la plus externe de la Terre ?", answers: ["Le manteau", "Le noyau", "La croûte terrestre"], correct: 2 },
            { subject: "Chimie", question: "Quel est le symbole chimique de l'or ?", answers: ["Ag", "Au", "Fe"], correct: 1 },
            { subject: "Philosophie", question: "Qui a écrit 'Le Contrat Social' ?", answers: ["Voltaire", "Rousseau", "Montesquieu"], correct: 1 },
            { subject: "Physique", question: "Quelle est l'unité de mesure de la tension électrique ?", answers: ["Ampère", "Watt", "Volt"], correct: 2 }, // Ajout
            { subject: "Maths", question: "Calculez l'aire d'un cercle de rayon 5cm (π ≈ 3.14).", answers: ["78.5 cm²", "31.4 cm²", "15.7 cm²"], correct: 0 } // Ajout
        ],
        LLA: [
            { subject: "Art", question: "Qui a écrit 'L'Étranger' ?", answers: ["Victor Hugo", "Albert Camus", "Marcel Proust"], correct: 1 },
            { subject: "Philosophie", question: "Quel mouvement littéraire est associé à Charles Baudelaire ?", answers: ["Le Romantisme", "Le Surréalisme", "Le Symbolisme"], correct: 2 },
            { subject: "Anglais", question: "Which of these is a synonym for 'happy'?", answers: ["Sad", "Joyful", "Angry"], correct: 1 },
            { subject: "Espagnol", question: "Traduce 'libro' al francés.", answers: ["Livre", "Table", "Chaise"], correct: 0 },
            { subject: "Créole", question: "Ki powèt ayisyen ki ekri 'Pèlen Tèt' ?", answers: ["Félix Morisseau-Leroy", "Frankétienne", "Georges Castera"], correct: 1 },
            { subject: "Musique", question: "Combien de cordes une guitare classique a-t-elle généralement ?", answers: ["4", "6", "8"], correct: 1 },
            { subject: "Sciences Sociales", question: "Quel est le plus grand océan du monde ?", answers: ["Atlantique", "Indien", "Pacifique"], correct: 2 } // Ajout
        ],
        SMP: [
            { subject: "Maths", question: "Combien de côtés a un hexagone ?", answers: ["5", "6", "7"], correct: 1 },
            { subject: "Physique", question: "Quelle loi de Newton stipule que 'toute action entraîne une réaction égale et opposée' ?", answers: ["Première loi", "Deuxième loi", "Troisième loi"], correct: 2 },
            { subject: "Chimie", question: "Quelle est la formule chimique de l'eau ?", answers: ["CO2", "H2O", "O2"], correct: 1 },
            { subject: "Anglais", question: "What is the capital of the UK?", answers: ["Paris", "London", "Berlin"], correct: 1 },
            { subject: "Biologie", question: "Quel organite est la 'centrale énergétique' de la cellule ?", answers: ["Noyau", "Mitochondrie", "Ribosome"], correct: 1 }, // Ajout
            { subject: "Philosophie", question: "Quel philosophe grec était le maître d'Alexandre le Grand ?", answers: ["Platon", "Socrate", "Aristote"], correct: 2 } // Ajout
        ]
    };

    // Définition des matières principales par série
    const majorSubjects = {
        "9e AF": ["Maths", "Français", "Sciences Sociales", "Physique"],
        SVT: ["Biologie", "Géologie", "Chimie", "Philosophie"],
        SES: ["Économie", "Histoire", "Sciences Sociales", "Philosophie"],
        SMP: ["Maths", "Physique", "Chimie", "Anglais"],
        LLA: ["Art", "Philosophie", "Anglais", "Espagnol", "Créole"]
    };

    // --- BASE DE DONNÉES DES BADGES ---
    const allBadges = {
        "premier-quiz": { name: "Novice", icon: "🔰", description: "A terminé son premier quiz." },
        "score-parfait": { name: "Score Parfait", icon: "🎯", description: "A obtenu 100% à un quiz." },
        "serie-svt": { name: "Biologiste", icon: "🧬", description: "A terminé 5 quiz en SVT." },
        "serie-ses": { name: "Économiste", icon: "📈", description: "A terminé 5 quiz en SES." },
        "serie-smp": { name: "Physicien", icon: "⚛️", description: "A terminé 5 quiz en SMP." },
        "serie-lla": { name: "Linguiste", icon: "✍️", description: "A terminé 5 quiz en LLA." },
        "maitre-progress": { name: "Maître du Savoir", icon: "🎓", description: "A atteint 100% de progression dans une série." },
        "cerveau": { name: "Cerveau en ébullition", icon: "🧠", description: "A gagné plus de 1000 points en une seule journée." },
        "marathon": { name: "Marathonien", icon: "🏃‍♂️", description: "A terminé 3 quiz d'affilée." }
        // On peut en ajouter d'autres ici !
    };

    // --- ANIMATION DU SLOGAN SUR LA PAGE D'ACCUEIL ---
    const mainSloganElement = document.querySelector('.main-slogan');
    if (mainSloganElement) {
        const slogans = [
            "Révise. Joue. Progresse.",
            "Maîtrise tes matières.",
            "Atteins tes objectifs.",
            "Réussis tes examens."
        ];
        let currentSloganIndex = 0;

        function changeSlogan() {
            mainSloganElement.style.opacity = 0; // Lancer le fondu sortant

            setTimeout(() => {
                currentSloganIndex = (currentSloganIndex + 1) % slogans.length;
                mainSloganElement.textContent = slogans[currentSloganIndex];
                mainSloganElement.style.opacity = 1; // Lancer le fondu entrant
            }, 400); // Doit correspondre à la durée de la transition CSS
        }

        // Lancer le changement de slogan après les animations initiales (1.3s)
        setTimeout(() => setInterval(changeSlogan, 4000), 1300);
    }

    // --- NAVIGATION ENTRE LES PAGES ---
    function showPage(pageId, isBack = false) {
        allPages.forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            window.scrollTo(0, 0);

            if (!isBack) {
                // Si ce n'est pas une navigation "retour", on ajoute la page à l'historique
                pageHistory.push(pageId);
            }

            // Si la page cible est le dashboard, on s'assure qu'il est à jour
            if (pageId === 'page-dashboard') {
                updateDashboard();
            }
            // Si la page cible est le profil, on le met à jour
            if (pageId === 'page-profil') {
                updateProfilePage();
            }

        } else {
            console.error(`Page with id "${pageId}" not found.`);
        }

    }

    // --- GESTIONNAIRE D'ÉVÉNEMENTS GLOBAL POUR LA NAVIGATION ---
    // Au lieu d'ajouter un listener sur chaque bouton, on en met un sur le body
    // et on vérifie si l'élément cliqué (ou un de ses parents) a un attribut `data-target`.
    // Cela fonctionne même pour les éléments ajoutés dynamiquement.
    document.body.addEventListener('click', (event) => {
        const targetElement = event.target.closest('[data-target]');

        if (targetElement) {
            const targetPageId = targetElement.getAttribute('data-target');

            // Si on clique sur une carte de série, on sauvegarde la série
            if (targetElement.classList.contains('serie-card')) {
                appState.currentSerie = targetElement.getAttribute('data-serie');
                // --- CORRECTION: Sauvegarder la série dans le localStorage ---
                localStorage.setItem('selectedSerie', appState.currentSerie);

                // La série sera envoyée au backend lors des actions (ex: fin de quiz)
                // On met à jour le nom de la série partout où c'est nécessaire
                const is9e = appState.currentSerie === '9e AF';
                const label = is9e ? 'Classe' : 'Série';

                // Mettre à jour le libellé partout
                document.querySelectorAll('.selection-label').forEach(el => el.textContent = label);
                // Mettre à jour le nom de la sélection partout
                document.querySelectorAll('.user-serie-name').forEach(el => {
                    // Si l'élément est un champ de formulaire (input), on change sa 'value'
                    // Sinon (span, p, etc.), on change son 'textContent'
                    if (el.tagName === 'INPUT') {
                        el.value = appState.currentSerie;
                    } else {
                        el.textContent = appState.currentSerie;
                    }
                });

                // Afficher la série sur la page d'authentification
                document.getElementById('auth-selection-display').style.display = 'block'; // Rend le paragraphe visible
            }

            // Si on clique sur un lien de la nav principale
            if (targetElement.closest('.main-nav')) {
                showPage(targetPageId);
            }

            // Si on clique sur "Créer un compte" ou "Se connecter"
            if (targetPageId === 'page-dashboard' && targetElement.closest('.auth-form')) {
                event.preventDefault(); // Empêche la navigation immédiate
                handleAuth(targetElement); // La fonction est maintenant asynchrone
            }
            // La logique de navigation est maintenant DANS le if/else if
            else {
                // Pour tous les autres clics, on navigue immédiatement
                showPage(targetPageId);
                // Si on va à la page du classement, on le génère
                if (targetPageId === 'page-leaderboard') {
                    renderFullLeaderboard();
                }
                if (targetPageId === 'page-selection-matiere') {
                    showSubjectSelection();
                }
            }
        } 
    });

    async function handleAuth(button) {
        const form = button.closest('.auth-form');
        if (form.id === 'signup-form') {
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const departement = document.getElementById('signup-departement').value;
            const ville = document.getElementById('signup-ville').value;

            if (name.trim() === '') {
                alert('Veuillez entrer votre nom complet.');
                return;
            }
            if (!email.includes('@')) {
                alert('Veuillez entrer une adresse e-mail valide.');
                return;
            }
            if (password.trim() === '') {
                alert('Veuillez créer un mot de passe.');
                return;
            }
            if (departement === '') {
                alert('Veuillez choisir votre département.');
                return;
            }

            // --- INSCRIPTION AVEC SUPABASE ---
            try {
                // 1. Crée l'utilisateur dans le système d'authentification de Supabase
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        // On passe les données ici. Supabase les ajoutera à l'objet utilisateur.
                        data: {
                            full_name: name,
                            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8A2BE2&color=fff&size=128`
                        }
                    }
                });

                if (authError) throw authError;

                // 2. Insérer les informations supplémentaires dans notre table 'profiles'
                // C'est la méthode manuelle, plus simple à suivre pour l'instant.
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id, // L'ID de l'utilisateur authentifié
                        full_name: authData.user.user_metadata.full_name,
                        email: email,
                        departement: departement,
                        ville: ville,
                        picture: authData.user.user_metadata.picture
                    });

                if (profileError) throw profileError;

                // Si tout a réussi, l'utilisateur est connecté.
                // On doit récupérer son profil complet pour avoir les points, etc.
                const { data: userProfile, error: fetchError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();

                if (fetchError) throw fetchError;

                currentUser = userProfile;

                updateDashboard();
                showPage('page-dashboard');

            } catch (error) {
                // On affiche un message personnalisé si l'e-mail est déjà utilisé
                if (error.message.includes('duplicate key value violates unique constraint "profiles_email_key"')) {
                    alert("Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.");
                } else {
                    alert("Une erreur est survenue : " + error.message);
                }
            }

        } else if (form.id === 'login-form') {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // --- CONNEXION AVEC SUPABASE ---
            try {
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (authError) throw authError;

                // Récupérer le profil complet de l'utilisateur depuis la table 'profiles'
                const { data: userProfile, error: fetchError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single(); // .single() car on attend un seul résultat

                if (fetchError) {
                    // Si le profil n'existe pas, c'est un problème
                    throw new Error("Profil utilisateur introuvable après connexion.");
                }

                currentUser = userProfile;

                updateDashboard();
                showPage('page-dashboard');

            } catch (error) {
                // On affiche un message plus simple pour l'utilisateur
                if (error.message.includes("Invalid login credentials")) {
                    alert("L'adresse e-mail ou le mot de passe est incorrect.");
                } else {
                    alert("Une erreur est survenue : " + error.message);
                }
            }
        }
    }

    // --- GESTION DU BASCULEMENT CONNEXION / INSCRIPTION ---
    document.querySelectorAll('.toggle-auth').forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Empêche le lien de recharger la page

            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');

            // Basculer la classe 'active' entre les deux formulaires
            loginForm.classList.toggle('active');
            signupForm.classList.toggle('active');
        });
    });

    // --- GESTION DU MENU UTILISATEUR ---
    function handleLogout() {
        // Réinitialiser l'état de l'application
        currentUser = null;
        appState.currentSerie = '';
        pageHistory = []; // Vider l'historique

        // Déconnexion avec Supabase
        supabase.auth.signOut();

        // Cacher tous les menus utilisateur
        document.querySelectorAll('.user-menu').forEach(menu => menu.classList.remove('show'));

        // Rediriger vers la page d'accueil
        showPage('page-accueil');
        console.log("Utilisateur déconnecté.");
    }

    document.querySelectorAll('.user-info').forEach(userInfo => {
        userInfo.addEventListener('click', (event) => {
            // Empêche la fermeture immédiate si on clique sur le menu lui-même
            event.stopPropagation(); 
            const menu = userInfo.querySelector('.user-menu');
            if (menu) {
                menu.classList.toggle('show');
            }
        });
    });

    document.querySelectorAll('.dropdown-item[id^="logout-btn"]').forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });

    // --- GESTION DE LA CONNEXION GOOGLE (AVEC SUPABASE) ---
    document.querySelector('.btn-google').addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
            // Après la connexion Google, Supabase redirige.
            // Nous devons gérer la session au rechargement de la page.
            // (Voir la logique d'initialisation à la fin du fichier)
        } catch (e) {
            console.error("Erreur de connexion Google", e);
            alert(e.message);
        }
    });

    // --- GESTION DU BOUTON RETOUR ---
    document.querySelectorAll('.btn-back').forEach(button => {
        button.addEventListener('click', goBack);
    });

    // --- GESTION DU SWIPE POUR RETOUR ---
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50; // Le doigt doit glisser d'au moins 50px

    document.body.addEventListener('touchstart', (event) => {
        // On ne prend que le premier doigt posé
        touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    document.body.addEventListener('touchend', (event) => {
        touchEndX = event.changedTouches[0].screenX;
        handleSwipe();
    });

    function handleSwipe() {
        // Swipe de gauche à droite
        if (touchEndX > touchStartX + swipeThreshold) {
            goBack();
        }
    }

    function goBack() {
        // On ne peut pas revenir en arrière si on est sur la première page
        if (pageHistory.length > 1) {
            // 1. Retire la page actuelle de l'historique
            pageHistory.pop();
            // 2. Récupère la page précédente (qui est maintenant la dernière de l'historique)
            const previousPageId = pageHistory[pageHistory.length - 1];
            // 3. Affiche la page précédente
            showPage(previousPageId, true); // `true` pour indiquer que c'est une navigation "retour"
        }
    }

    // --- GESTION DE LA FINALISATION DU PROFIL (POUR GOOGLE) ---
    document.getElementById('complete-profile-btn').addEventListener('click', async () => {
        await handleCompleteProfile();
    });

    // Ajout d'un bouton de retour pour le navigateur (desktop)
    window.addEventListener('popstate', () => {
        if (pageHistory.length > 1) {
            goBack();
        }
    });

    async function handleCompleteProfile() {
        if (!tempGoogleUser) {
            alert("Une erreur est survenue. Veuillez réessayer de vous connecter.");
            showPage('page-accueil');
            return;
        }

        const departement = document.getElementById('complete-profile-departement').value;
        const ville = document.getElementById('complete-profile-ville').value;

        if (!departement || ville.trim() === '') {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        try {
            const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: tempGoogleUser.id,
                    full_name: tempGoogleUser.user_metadata.full_name,
                    email: tempGoogleUser.email,
                    picture: tempGoogleUser.user_metadata.picture,
                    departement: departement,
                    ville: ville
                })
                .select().single();

            if (insertError) throw insertError;

            currentUser = newProfile;
            tempGoogleUser = null; // Nettoyer l'utilisateur temporaire
            checkRestoredSerie(); // Vérifier si une série a été sauvegardée
            updateDashboard();
            showPage('page-dashboard');
        } catch (error) {
            alert("Erreur lors de la création du profil : " + error.message);
        }
    }

    // --- LOGIQUE DU QUIZ ---

    /**
     * Mélange un tableau en utilisant l'algorithme de Fisher-Yates.
     * @param {Array} array Le tableau à mélanger.
     * @returns {Array} Un nouveau tableau mélangé.
     */
    function shuffleArray(array) {
        const newArray = [...array]; // Crée une copie pour ne pas modifier l'original
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Échange les éléments
        }
        return newArray;
    }

    function startQuiz(subject) {
        appState.score = 0;
        appState.currentQuestionIndex = 0;
        let allQuestionsForSerie = quizData[appState.currentSerie] || []; // Récupère toutes les questions de la série
        allQuestionsForSerie = allQuestionsForSerie.filter(q => q.subject === subject);
        
        if (allQuestionsForSerie.length === 0) {
            alert(`Aucune question trouvée pour la matière "${subject}" dans la série "${appState.currentSerie}".`);
            showPage('page-dashboard');
            return;
        }

        // --- NOUVELLE LOGIQUE DE SÉLECTION "INTELLIGENTE" ---

        // 1. Identifier les questions déjà répondues correctement par l'utilisateur pour cette série
        const correctlyAnsweredIndexes = (currentUser.correctlyAnswered && currentUser.correctlyAnswered[appState.currentSerie]) || [];

        // 2. Séparer les questions en deux groupes : celles non réussies et celles déjà réussies
        const notYetCorrect = [];
        const alreadyCorrect = [];

        allQuestionsForSerie.forEach((question, index) => {
            // On utilise un index unique pour chaque question de la matière
            const questionWithOriginalIndex = { ...question, originalIndex: index };
            if (correctlyAnsweredIndexes.includes(index)) {
                alreadyCorrect.push(questionWithOriginalIndex);
            } else {
                notYetCorrect.push(questionWithOriginalIndex);
            }
        });

        // 3. Construire le quiz de 10 questions
        let finalQuestions = [];
        // On mélange les deux listes pour avoir de la variété
        const shuffledNotYetCorrect = shuffleArray(notYetCorrect);
        const shuffledAlreadyCorrect = shuffleArray(alreadyCorrect);

        // On prend autant de questions "non réussies" que possible, jusqu'à la limite du quiz
        finalQuestions = shuffledNotYetCorrect.slice(0, QUESTIONS_PER_QUIZ);

        // 4. Si on n'a pas assez de questions, on complète avec des questions déjà réussies
        const remainingNeeded = QUESTIONS_PER_QUIZ - finalQuestions.length;
        if (remainingNeeded > 0) {
            finalQuestions.push(...shuffledAlreadyCorrect.slice(0, remainingNeeded));
        }

        appState.currentQuestions = finalQuestions;

        startTimer();
        showQuestion();
    }

    function showSubjectSelection() {
        const allQuestionsForSerie = quizData[appState.currentSerie] || [];
        const subjects = [...new Set(allQuestionsForSerie.map(q => q.subject))]; // Liste unique des matières

        const grid = document.getElementById('matiere-grid');
        grid.innerHTML = ''; // Vider la grille

        if (subjects.length === 0) {
            grid.innerHTML = "<p>Aucune matière n'est disponible pour cette série pour le moment.</p>";
            return;
        }

        subjects.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'serie-card'; // On réutilise le style des cartes de série
            card.innerHTML = `<span>${subject}</span>`;

            card.addEventListener('click', () => {
                appState.currentSubject = subject;
                startQuiz(appState.currentSubject);
                showPage('page-quiz');
            });

            grid.appendChild(card);
        });

        // Mettre à jour l'affichage de la série sur cette page
        const serieNameElement = document.querySelector('#page-selection-matiere .user-serie-name');
        if (serieNameElement) {
            serieNameElement.textContent = appState.currentSerie;
        }
    }

    function showQuestion() {
        // Nettoyer les anciennes réponses
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';

        // Récupérer la question actuelle
        const question = appState.currentQuestions[appState.currentQuestionIndex];

        // Mettre à jour la série affichée sur la page du quiz
        document.getElementById('quiz-serie').textContent = appState.currentSerie;

        // Mettre à jour l'affichage
        document.getElementById('question-counter').textContent = `Question ${appState.currentQuestionIndex + 1}/${appState.currentQuestions.length}`;
        document.getElementById('question-text').textContent = question.question;

        // Mettre à jour la barre de progression
        const progress = ((appState.currentQuestionIndex + 1) / appState.currentQuestions.length) * 100;
        document.getElementById('quiz-progress').style.width = `${progress}%`;
        document.getElementById('quiz-progress').style.transition = 'width 0.5s ease-in-out';

        // Créer les boutons de réponse
        question.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.textContent = answer;
            button.classList.add('answer-btn');
            button.addEventListener('click', () => selectAnswer(index, button));
            answersContainer.appendChild(button);
        });
    }

    function selectAnswer(selectedIndex, button) {
        const question = appState.currentQuestions[appState.currentQuestionIndex];
        const isCorrect = selectedIndex === question.correct;

        // Désactiver tous les boutons après une réponse
        document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);

        if (isCorrect) {
            appState.score++;
            button.classList.add('correct');

            // --- NOUVELLE LOGIQUE DE PROGRESSION ---
            // S'assurer que l'objet principal existe
            if (!currentUser.correctlyAnswered || typeof currentUser.correctlyAnswered !== 'object') {
                currentUser.correctlyAnswered = {};
            }
            // Initialiser le tableau pour la série si ce n'est pas déjà fait
            if (!currentUser.correctlyAnswered[appState.currentSerie]) {
                currentUser.correctlyAnswered[appState.currentSerie] = [];
            }
            // Ajouter l'index de la question si elle n'est pas déjà dans la liste
            if (!currentUser.correctlyAnswered[appState.currentSerie].includes(question.originalIndex)) {
                currentUser.correctlyAnswered[appState.currentSerie].push(question.originalIndex);
            }
        } else {
            button.classList.add('wrong');
            // Montrer la bonne réponse
            document.querySelectorAll('.answer-btn')[question.correct]?.classList.add('correct');
        }

        // Passer à la question suivante après un court délai
        setTimeout(() => {
            appState.currentQuestionIndex++;
            if (appState.currentQuestionIndex < appState.currentQuestions.length) {
                showQuestion();
            } else {
                endQuiz();
            }
        }, 1500); // 1.5 secondes avant la prochaine question
    }

    function startTimer() {
        let timeLeft = TIME_PER_QUIZ;
        const timerProgress = document.getElementById('timer-progress');
        const timerDisplay = document.getElementById('timer-display');
        const radius = timerProgress.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;

        timerProgress.style.strokeDasharray = circumference;
        timerProgress.style.strokeDashoffset = 0;
        timerDisplay.textContent = timeLeft;

        clearInterval(timerInterval); // S'assurer qu'il n'y a pas d'autre timer en cours
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            const offset = circumference - (timeLeft / TIME_PER_QUIZ) * circumference;
            timerProgress.style.strokeDashoffset = offset;

            if (timeLeft <= 0) {
                endQuiz();
            }
        }, 1000);
    }

    function endQuiz() {
        clearInterval(timerInterval);

        // --- Calcul des points pondérés ---
        const majors = majorSubjects[appState.currentSerie] || [];
        const pointsGagnes = appState.currentQuestions.reduce((total, question, index) => {
            // On ne peut vérifier que les questions répondues jusqu'à l'index actuel
            if (index < appState.currentQuestionIndex) {
                // On suppose que si la réponse est correcte, elle a été enregistrée.
                // Pour un calcul précis, il faudrait stocker les réponses de l'utilisateur.
                // Ici, on se base sur le score final, ce qui est une approximation.
                // Pour une implémentation plus juste, il faudrait stocker chaque réponse.
                // Pour la simplicité, on se base sur le score global.
            }
            return total;
        }, 0) + (appState.score * POINTS_PER_CORRECT_ANSWER) + (majors.includes(appState.currentSubject) ? appState.score * (POINTS_PER_MAJOR_SUBJECT_ANSWER - POINTS_PER_CORRECT_ANSWER) : 0);

        // Mettre à jour les stats globales
        currentUser.total_points = (currentUser.total_points || 0) + pointsGagnes;
        currentUser.quizzes_completed = (currentUser.quizzes_completed || 0) + 1;

        // S'assurer que le tableau des badges existe avant de l'utiliser
        if (!Array.isArray(currentUser.badges)) {
            currentUser.badges = [];
        }

        // Logique d'attribution des badges
        if (currentUser.quizzes_completed === 1 && !currentUser.badges.includes("premier-quiz")) {
            currentUser.badges.push("premier-quiz");
            showNewBadge("premier-quiz");
        }
        if (appState.score === appState.currentQuestions.length && !currentUser.badges.includes("score-parfait")) {
            currentUser.badges.push("score-parfait");
            showNewBadge("score-parfait");
        }

        // Mettre à jour l'affichage de la page de résultats
        document.getElementById('final-score').textContent = `${appState.score}/${appState.currentQuestions.length}`;
        document.getElementById('points-gagnes').textContent = `+ ${pointsGagnes} points`;

        // --- SAUVEGARDER LA PROGRESSION AVEC SUPABASE ---
        updateUserProgress(pointsGagnes, currentUser.correctlyAnswered);

        showPage('page-resultats');
    }

    function showNewBadge(badgeId) {
        const modal = document.getElementById('badge-modal');
        const badge = allBadges[badgeId];
        if (!badge || !modal) return;

        // Remplir les informations de la modale
        document.getElementById('badge-modal-icon').textContent = badge.icon;
        document.getElementById('badge-modal-name').textContent = badge.name;
        document.getElementById('badge-modal-description').textContent = badge.description;

        // Afficher la modale
        modal.classList.add('show');

        // Gérer la fermeture
        const closeButton = document.getElementById('badge-modal-close');
        closeButton.onclick = () => {
            modal.classList.remove('show');
        };
    }

    async function updateUserProgress(pointsGagnes, newCorrectlyAnswered) {
        if (!currentUser) return;

        try {
            // On utilise .select() pour que Supabase retourne l'enregistrement mis à jour
            const { data, error } = await supabase
                .from('profiles')
                .update({ 
                    total_points: currentUser.total_points, // totalPoints a déjà été incrémenté
                    quizzes_completed: currentUser.quizzes_completed,
                    badges: currentUser.badges,
                    correctlyAnswered: newCorrectlyAnswered // Assurez-vous que ce champ existe dans votre table
                })
                .eq('id', currentUser.id)
                .select() // Demande à Supabase de retourner la ligne mise à jour
                .single(); // On s'attend à un seul résultat
            
            if (error) throw error;

            // Mettre à jour l'objet currentUser local avec les nouvelles données de la BDD
            currentUser = data;
        } catch (error) {
            console.error("Erreur de mise à jour de la progression:", error);
        }
    }

    // --- LOGIQUE DU DASHBOARD ---
    function updateDashboard() {
        if (!currentUser) return;

        document.getElementById('dashboard-username').textContent = currentUser.full_name;
        document.getElementById('dashboard-points').textContent = `${currentUser.total_points} pts`;

        // Mettre à jour l'avatar partout (au cas où l'URL changerait)
        const avatarUrl = currentUser.picture || 'https://i.imgur.com/user-avatar.png';
        document.querySelectorAll('.avatar').forEach(img => {
            img.src = avatarUrl;
        });
        
        // --- NOUVELLE LOGIQUE DE CALCUL DE LA PROGRESSION ---
        const totalQuestionsInSerie = (quizData[appState.currentSerie] || []).length;
        const correctlyAnsweredCount = (currentUser.correctlyAnswered && currentUser.correctlyAnswered[appState.currentSerie] || []).length;

        const progressPercentage = totalQuestionsInSerie > 0 
            ? (correctlyAnsweredCount / totalQuestionsInSerie) * 100 
            : 0;
        document.getElementById('dashboard-progress-bar').style.width = `${progressPercentage}%`;

        // Mettre à jour le texte de statut de la progression
        const statusTextElement = document.getElementById('progress-status-text');
        let statusMessage = '';
        if (progressPercentage === 0) {
            statusMessage = "Commence un quiz pour progresser !";
        } else if (progressPercentage < 20) {
            statusMessage = "Pas encore prêt pour l'examen.";
        } else if (progressPercentage < 50) {
            statusMessage = "Continue de réviser, tu es sur la bonne voie !";
        } else if (progressPercentage < 80) {
            statusMessage = "Belle progression, ne lâche rien !";
        } else if (progressPercentage < 100) {
            statusMessage = "Tu y es presque, encore un effort !";
        } else {
            statusMessage = "Prêt pour l'examen !";
        }
        statusTextElement.textContent = statusMessage;

        // Mettre à jour l'affichage des badges
        const badgeContainer = document.getElementById('dashboard-badges');
        badgeContainer.innerHTML = ''; // Vider les anciens badges
        // S'assurer que currentUser.badges est bien un tableau avant de l'utiliser
        const userBadges = Array.isArray(currentUser.badges) ? currentUser.badges : [];
        if (userBadges.length > 0) {
            currentUser.badges.forEach(badge => {
                const badgeInfo = allBadges[badge];
                if (!badgeInfo) return;
                const badgeElement = document.createElement('span');
                badgeElement.textContent = badgeInfo.icon;
                badgeElement.title = `${badgeInfo.name}: ${badgeInfo.description}`; // Nom et description au survol
                badgeContainer.appendChild(badgeElement);
            });
        } else {
            badgeContainer.textContent = 'Aucun badge';
        }

    }

    // --- NOUVELLE FONCTION POUR LA PAGE PROFIL ---
    function updateProfilePage() {
        if (!currentUser) return;

        const avatarUrl = currentUser.picture || 'https://i.imgur.com/user-avatar.png';
        document.querySelectorAll('.profile-avatar').forEach(img => img.src = avatarUrl);
        document.getElementById('profile-name').textContent = currentUser.full_name;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('profile-location').textContent = `${currentUser.ville}, ${currentUser.departement}`;

        document.getElementById('profile-points').textContent = `${currentUser.total_points || 0} pts`;
        document.getElementById('profile-quizzes').textContent = `${currentUser.quizzes_completed || 0}`;

        // Mettre à jour les badges
        const badgeContainer = document.getElementById('profile-badges');
        badgeContainer.innerHTML = ''; // Vider les anciens badges
        const userBadges = Array.isArray(currentUser.badges) ? currentUser.badges : [];
        if (userBadges.length > 0) {
            currentUser.badges.forEach(badgeId => {
                const badgeInfo = allBadges[badgeId];
                if (!badgeInfo) return;
                const badgeElement = document.createElement('span');
                badgeElement.textContent = badgeInfo.icon;
                badgeElement.title = `${badgeInfo.name}: ${badgeInfo.description}`;
                badgeContainer.appendChild(badgeElement);
            });
        } else {
            badgeContainer.textContent = 'Aucun badge';
        }
    }


    function renderFullLeaderboard() {
        if (!currentUser) {
            showPage('page-dashboard');
            return;
        }

        // --- APPEL À SUPABASE POUR LE CLASSEMENT ---
        async function fetchLeaderboard() {
            try {
                // Vérification de sécurité : si l'utilisateur n'a pas de département, on ne peut pas charger le classement.
                if (!currentUser.departement) {
                    document.getElementById('league-gold-list').innerHTML = `<li>Veuillez compléter votre profil (département) pour voir le classement.</li>`;
                    document.getElementById('league-diamond-list').innerHTML = '';
                    document.getElementById('league-silver-list').innerHTML = '';
                    return; // Arrêter l'exécution de la fonction
                }

                const { data: departmentUsers, error } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, total_points')
                    .eq('departement', currentUser.departement)
                    .order('total_points', { ascending: false });

                if (error) throw error;

        // Séparer les joueurs en ligues
        const goldLeague = departmentUsers.slice(0, 5);

        const diamondLeague = departmentUsers.slice(5, 15);
        const silverLeague = departmentUsers.slice(15, 35); // Les 20 suivants

        // Vider les listes précédentes
        const goldList = document.getElementById('league-gold-list');
        const diamondList = document.getElementById('league-diamond-list');
        const silverList = document.getElementById('league-silver-list');
        const relegationList = document.getElementById('relegation-list');
        goldList.innerHTML = '';
        diamondList.innerHTML = '';
        silverList.innerHTML = '';
        relegationList.innerHTML = '';

        // Remplir les listes des ligues
        populateLeagueList(goldList, goldLeague, 0);
        populateLeagueList(diamondList, diamondLeague, 5);
        populateLeagueList(silverList, silverLeague, 15);

        // Gérer la zone de relégation
        const currentUserRank = departmentUsers.findIndex(user => user.id === currentUser.id);
        const relegationZone = document.getElementById('relegation-zone');
        // Si l'utilisateur est classé au-delà de la 35ème place (5 Or + 10 Diamant + 20 Argent)
        if (currentUserRank >= 35) {
            // On affiche l'utilisateur et les quelques joueurs juste avant lui pour le motiver.
            // On s'assure de ne pas remonter dans la ligue Argent (qui se termine à l'index 34).
            const startIndex = Math.max(35, currentUserRank - 4);
            const relegationUsers = departmentUsers.slice(startIndex, currentUserRank + 1);

            relegationZone.style.display = 'block';
            populateLeagueList(relegationList, relegationUsers, startIndex);
        } else {
            relegationZone.style.display = 'none';
        }   
            } catch (err) {
                console.error("Erreur de chargement du classement:", err.message);
                alert("Impossible de charger le classement.");
            }
        }
        fetchLeaderboard();
    }

    function populateLeagueList(listElement, users, rankOffset) {
        if (users.length === 0) {
            listElement.innerHTML = '<li>Personne dans cette ligue pour le moment.</li>';
            return;
        }
        users.forEach((user, index) => {
            const rank = rankOffset + index + 1;
            const initials = user.full_name.split(' ').map(n => n[0]).join('. ') + '.';
            const listItem = document.createElement('li');
            if (user.id === currentUser.id) {
                listItem.classList.add('current-user');
            }
            listItem.innerHTML = `<span class="rank">${rank}</span><span class="name">${initials}</span><span class="score">${user.total_points} pts</span>`;
            listElement.appendChild(listItem);
        });
    }

    function checkRestoredSerie() {
        // --- CORRECTION: Restaurer la série depuis le localStorage ---
        const savedSerie = localStorage.getItem('selectedSerie');
        if (savedSerie) {
            appState.currentSerie = savedSerie;
        }
    }

    // --- INITIALISATION ---
    // Vérifier si une session utilisateur existe au chargement de la page
    async function checkUserSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            // Si une session existe, récupérer le profil complet
            const { data: userProfile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (userProfile && !error) {
                // Le profil existe, on continue normalement
                currentUser = userProfile;
                checkRestoredSerie();
                updateDashboard();
                showPage('page-dashboard');
            } else if (error && error.code === 'PGRST116') {
                // ERREUR 'PGRST116' = Le profil n'existe pas. C'est un nouvel utilisateur Google.
                // On le redirige vers la page pour compléter son profil.
                tempGoogleUser = session.user; // On stocke ses infos temporairement
                showPage('page-complete-profile');
            } else {
                showPage('page-accueil');
            }
        } else {
            showPage('page-accueil');
        }
    }
    checkUserSession();
});
