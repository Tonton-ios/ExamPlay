document.addEventListener('DOMContentLoaded', async () => { // Rendre la fonction asynchrone
    // --- VARIABLES GLOBALES ---
    const allPages = document.querySelectorAll('.page');

    // --- GESTION DU MENU HAMBURGER (MOBILE) ---
    // On cible tous les boutons de menu pour que ça fonctionne sur toutes les pages
    const navToggles = document.querySelectorAll('.nav-toggle');
    navToggles.forEach(navToggle => {
        navToggle.addEventListener('click', () => {
            // On cherche le menu .main-nav qui est dans le même header que le bouton cliqué
            const mainNav = navToggle.previousElementSibling;
            if (mainNav && mainNav.classList.contains('main-nav')) {
                mainNav.classList.toggle('active');
            }
        });
    });

    // Fermer le menu si on clique sur un lien (pour la navigation sur la même page)
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', () => {
            link.closest('.main-nav').classList.remove('active');
        });
    });

    const allNavButtons = document.querySelectorAll('[data-target]');
    let timerInterval; // Variable pour le minuteur
    let currentUser = null; // Pour stocker les infos de l'utilisateur
    let pageHistory = []; // Pour gérer l'historique de navigation

    // --- CONSTANTES DE CONFIGURATION ---
    // QUESTIONS_PER_QUIZ est maintenant dynamique selon le mode
    const TIME_PER_QUESTION = 45; // Secondes par question en mode examen
    const POINTS_PER_CORRECT_ANSWER = 10;
    const POINTS_PER_MAJOR_SUBJECT_ANSWER = 20; // Points bonus pour une matière principale
    const NEXT_QUESTION_DELAY = 1500; // Délai en ms avant la question suivante

    // --- SONS DU QUIZ ---
    // Utilisation de sons libres de droits (Mixkit). Vous pouvez remplacer par vos fichiers locaux.
    const soundCorrect = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    const soundWrong = new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');

    // --- ETAT DE L'APPLICATION ---
    const appState = {
        currentSerie: '',
        currentSubject: '',
        currentQuestions: [],
        currentQuestionIndex: 0,
        currentMode: 'standard', // 'quick', 'subject', 'exam', 'smart'
        score: 0,
        lives: 3, // Nombre de vies pour le mode examen
        wrongAnswers: [], // Pour stocker les erreurs
        startTime: 0, // Pour l'anti-triche
    };
    
    // --- CONFIGURATION SUPABASE ---
    const SUPABASE_URL = 'https://rhferbbmwductjqwfsie.supabase.co'; // Collez votre URL ici
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZmVyYmJtd2R1Y3RqcXdmc2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MDc0ODQsImV4cCI6MjA4MTM4MzQ4NH0.3GmSvvkcTwzTTxbe9K0L0SHhvholI4-xA3Kl6JuSdok'; // Collez votre clé anon ici
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // --- CONFIGURATIONS DU QUIZ ---
    // Définition des matières principales par série
    const majorSubjects = {
        "9e AF": ["Maths", "Français", "Sciences Sociales", "Physique"],
        SVT: ["Biologie", "Géologie", "Chimie", ],
        SES: ["Économie", "Histoire", "Sciences Sociales", ],
        SMP: ["Maths", "Physique",],
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
        "marathon": { name: "Marathonien", icon: "🏃‍♂️", description: "A terminé 3 quiz d'affilée." },
        "pionnier": { name: "Pionnier", icon: "🚀", description: "Fait partie des premiers inscrits sur ExamPlay." },
        "semaine-feu": { name: "Semaine de feu", icon: "🔥", description: "A atteint une série de 7 jours consécutifs." }
        // On peut en ajouter d'autres ici !
    };

    // --- DONNÉES D'ORIENTATION (Haïti) ---
    const orientationData = {
        "SVT": [
            { 
                title: "Santé & Médecine", 
                icon: "⚕️", 
                description: "Ton profil scientifique est idéal pour soigner.", 
                careers: ["Médecin", "Pharmacien", "Infirmier", "Biologiste Médical"], 
                schools: [
                    { name: "FMP (UEH)", url: "https://fmp.ueh.edu.ht" },
                    { name: "UNDH", url: "https://undh.edu.ht" },
                    { name: "Université Quisqueya", url: "https://uniq.edu.ht" }
                ] 
            },
            { 
                title: "Agronomie & Environnement", 
                icon: "🌱", 
                description: "Essentiel pour le développement d'Haïti.", 
                careers: ["Ingénieur Agronome", "Spécialiste en Environnement", "Vétérinaire"], 
                schools: [
                    { name: "FAMV (UEH)", url: "https://famv.ueh.edu.ht" },
                    { name: "UNIFA", url: "https://unifa.edu.ht" },
                    { name: "Université Épiscopale", url: "https://uneph.edu.ht" }
                ] 
            }
        ],
        "SMP": [
            { 
                title: "Génie & Technologie", 
                icon: "🏗️", 
                description: "Construire les infrastructures de demain.", 
                careers: ["Génie Civil", "Génie Électromécanique", "Informatique", "Architecture"], 
                schools: [
                    { name: "FDS (UEH)", url: "https://fds.ueh.edu.ht" },
                    { name: "GOC", url: "https://ugoc.edu.ht" },
                    { name: "ESIH", url: "https://esih.edu.ht" },
                    { name: "INUQUA", url: "https://inuqua.edu.ht" }
                ] 
            },
            { 
                title: "Sciences Pures", 
                icon: "🧪", 
                description: "Recherche, enseignement et innovation.", 
                careers: ["Mathématicien", "Physicien", "Statisticien"], 
                schools: [
                    { name: "École Normale Supérieure (ENS)", url: "https://ens.ueh.edu.ht" },
                    { name: "ISTEAH", url: "https://isteah.edu.ht" }
                ] 
            }
        ],
        "SES": [
            { 
                title: "Économie & Gestion", 
                icon: "📊", 
                description: "Gérer les entreprises et l'économie.", 
                careers: ["Économiste", "Comptable", "Gestionnaire", "Entrepreneur"], 
                schools: [
                    { name: "INAGHEI (UEH)", url: "https://inaghei.ueh.edu.ht" },
                    { name: "CTPEA", url: "#" },
                    { name: "IHECE", url: "https://ihece.edu.ht" },
                    { name: "SOFIHDES", url: "https://sofihdes.com" }
                ] 
            },
            { 
                title: "Sciences Juridiques", 
                icon: "⚖️", 
                description: "Défendre le droit et l'administration.", 
                careers: ["Avocat", "Juge", "Administrateur Public", "Diplomate"], 
                schools: [
                    { name: "FDSE (UEH)", url: "https://fdse.ueh.edu.ht" },
                    { name: "EMA", url: "#" },
                    { name: "IIAP", url: "#" }
                ] 
            }
        ],
        "LLA": [
            { 
                title: "Communication & Arts", 
                icon: "🎨", 
                description: "Créer, informer et analyser.", 
                careers: ["Journaliste", "Écrivain", "Communicateur", "Graphiste"], 
                schools: [
                    { name: "FASCH (UEH)", url: "https://fasch.ueh.edu.ht" },
                    { name: "FLA (UEH)", url: "#" },
                    { name: "ENARTS", url: "https://enarts.ueh.edu.ht" }
                ] 
            },
            { 
                title: "Sciences Humaines", 
                icon: "🧠", 
                description: "Comprendre la société et l'humain.", 
                careers: ["Psychologue", "Sociologue", "Travailleur Social", "Professeur"], 
                schools: [
                    { name: "FASCH (UEH)", url: "https://fasch.ueh.edu.ht" },
                    { name: "ENS (UEH)", url: "https://ens.ueh.edu.ht" }
                ] 
            }
        ],
        "9e AF": [
            { 
                title: "Vers le Nouveau Secondaire", 
                icon: "🎒", 
                description: "Prépare ton entrée en NS1.", 
                careers: ["Choix de la filière (SVT, SMP, SES, LLA) selon tes forces."], 
                schools: [
                    { name: "Lycées Nationaux", url: "#" },
                    { name: "Collèges Privés", url: "#" }
                ] 
            },
            { 
                title: "Formation Technique", 
                icon: "🛠️", 
                description: "Apprendre un métier rapidement.", 
                careers: ["Mécanique", "Électricité", "Plomberie", "Informatique"], 
                schools: [
                    { name: "Centre Pilote", url: "#" },
                    { name: "Canado Technique", url: "https://canadotechnique.org" }
                ] 
            }
        ]
    };

    // --- DONNÉES TÉMOIGNAGES ---
    const testimonialsData = [
        { name: "Sarah J.", serie: "SVT", text: "Grâce à ExamPlay, j'ai compris la génétique en jouant. Aujourd'hui je suis en médecine à l'UNDH !", school: "Collège Canado" },
        { name: "Marc D.", serie: "SMP", text: "Les quiz de physique m'ont sauvé pour le bac. Le mode examen est super stressant mais efficace.", school: "Saint-Louis de Gonzague" },
        { name: "Wideline P.", serie: "SES", text: "Je ne savais pas quoi faire après le NS4. La section orientation m'a dirigée vers l'INAGHEI.", school: "Lycée Marie-Jeanne" }
    ];

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

    // --- COMPTEUR DE PREUVE SOCIALE (ANIMATION) ---
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    const counterObj = document.getElementById("global-questions-counter");
    if (counterObj) animateValue(counterObj, 10000, 15420, 2000);

    // --- GESTION DU CLIC SUR LE LOGO POUR RECHARGER ---
    document.querySelectorAll('a.logo').forEach(logoLink => {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault(); // Empêche la navigation normale
            window.location.reload(); // Recharge la page
        });
    });

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
            if (pageId === 'page-orientation') {
                updateOrientationPage();
            }

        } else {
            console.error(`Page with id "${pageId}" not found.`);
        }

    }

    // --- NOUVEAU SYSTÈME DE NOTIFICATIONS ---
    /**
     * Affiche une notification à l'écran.
     * @param {string} message Le message à afficher.
     * @param {string} type Le type de notification ('success', 'error', 'info').
     */
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`; // ex: 'notification error'
        notification.textContent = message;

        container.appendChild(notification);

        // La notification se supprime d'elle-même après l'animation de sortie (5s)
        setTimeout(() => {
            notification.remove();
        }, 5000);
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
            const school = document.getElementById('signup-school').value; // Récupération de l'école
            const serie = document.getElementById('signup-serie').value; // On récupère la série

            // Vérification critique : Si la série est vide (ex: après un rafraîchissement), on bloque.
            if (!serie || serie.trim() === '') {
                showNotification('Veuillez sélectionner une série avant de vous inscrire.', 'error');
                setTimeout(() => showPage('page-selection-serie'), 1500);
                return;
            }

            if (name.trim() === '') {
                showNotification('Veuillez entrer votre nom complet.', 'error');
                return;
            }
            if (!email.includes('@')) {
                showNotification('Veuillez entrer une adresse e-mail valide.', 'error');
                return;
            }
            if (password.trim() === '') {
                showNotification('Veuillez créer un mot de passe.', 'error');
                return;
            }
            if (departement === '') {
                showNotification('Veuillez choisir votre département.', 'error');
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
                        picture: authData.user.user_metadata.picture,
                        serie: serie, // On enregistre la série pour le classement national
                        school: school, // B2B : On enregistre l'école
                        badges: ["pionnier"] // SOCIAL PROOF : Badge Pionnier offert à l'inscription
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

                showNotification(`Bienvenue, ${currentUser.full_name} !`, 'success');
                showNewBadge("pionnier"); // Afficher la modale du badge
                await checkAndUpdateStreak(); // Vérifier la série
                updateDashboard();
                showPage('page-dashboard');

            } catch (error) {
                console.error("Erreur d'inscription:", error);
                // On affiche un message personnalisé si l'e-mail est déjà utilisé
                if (error.message.includes('duplicate key value') || error.message.includes('already registered')) {
                    showNotification("Un compte existe déjà avec cet e-mail.", 'error');
                } else if (error.message.includes('Email signups are disabled')) {
                    showNotification("Erreur config : Le fournisseur Email est désactivé dans Supabase.", 'error');
                } else if (error.code === '42703' || error.message.includes('column')) {
                    showNotification("Erreur Base de Données : Colonne manquante (ex: school). Vérifiez Supabase.", 'error');
                } else {
                    showNotification("Erreur d'inscription : " + error.message, 'error');
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

                showNotification(`Heureux de vous revoir, ${currentUser.full_name} !`, 'success');
                await checkAndUpdateStreak(); // Vérifier la série
                updateDashboard();
                showPage('page-dashboard');

            } catch (error) {
                // On affiche un message plus simple pour l'utilisateur
                if (error.message.includes("Invalid login credentials")) {
                    showNotification("L'adresse e-mail ou le mot de passe est incorrect.", 'error');
                } else {
                    showNotification("Erreur de connexion : " + error.message, 'error');
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

    // --- GESTION MOT DE PASSE OUBLIÉ ---
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').classList.remove('active');
            document.getElementById('signup-form').classList.remove('active');
            if (forgotPasswordForm) forgotPasswordForm.classList.add('active');
        });
    }

    document.querySelectorAll('.back-to-login').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (forgotPasswordForm) forgotPasswordForm.classList.remove('active');
            document.getElementById('signup-form').classList.remove('active');
            document.getElementById('login-form').classList.add('active');
        });
    });

    const btnReset = document.getElementById('btn-reset-password');
    if (btnReset) {
        btnReset.addEventListener('click', async () => {
            const emailInput = document.getElementById('reset-email');
            const email = emailInput.value.trim();

            if (!email || !email.includes('@')) {
                showNotification('Veuillez entrer une adresse e-mail valide.', 'error');
                return;
            }

            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.href,
                });
                if (error) throw error;
                showNotification('Si le compte existe, un email a été envoyé.', 'success');
            } catch (error) {
                showNotification("Erreur : " + error.message, 'error');
            }
        });
    }

    // --- GESTION DU NOUVEAU MOT DE PASSE (Après lien email) ---
    
    // 1. Détecter si l'utilisateur arrive via un lien de réinitialisation
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            showPage('page-auth'); // On s'assure d'être sur la page de connexion
            // Masquer les autres formulaires
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
            // Afficher le formulaire de nouveau mot de passe
            const updateForm = document.getElementById('update-password-form');
            if (updateForm) updateForm.classList.add('active');
        }
    });

    // 2. Gérer la soumission du nouveau mot de passe
    const btnUpdatePassword = document.getElementById('btn-update-password');
    if (btnUpdatePassword) {
        btnUpdatePassword.addEventListener('click', async () => {
            const passwordInput = document.getElementById('update-password-input');
            const newPassword = passwordInput.value;

            if (newPassword.trim().length < 6) {
                showNotification('Le mot de passe doit contenir au moins 6 caractères.', 'error');
                return;
            }

            try {
                // Met à jour le mot de passe de l'utilisateur actuellement connecté (via le lien magique)
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) throw error;

                showNotification('Mot de passe mis à jour avec succès !', 'success');
                
                // Masquer le formulaire et rediriger vers le dashboard
                document.getElementById('update-password-form').classList.remove('active');
                showPage('page-dashboard');

            } catch (error) {
                showNotification("Erreur : " + error.message, 'error');
            }
        });
    }

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

    // --- GESTION DU BOUTON RETOUR ---
    document.querySelectorAll('.btn-back').forEach(button => {
        // La gestion du retour est maintenant gérée par le listener global `data-target`
        // On laisse cette fonction pour le swipe et le bouton du navigateur
        // button.addEventListener('click', goBack);
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

    // Ajout d'un bouton de retour pour le navigateur (desktop)
    window.addEventListener('popstate', () => {
        if (pageHistory.length > 1) {
            goBack();
        }
    });

    // --- GESTION DES MODES DE JEU (DASHBOARD) ---
    const btnModeQuick = document.getElementById('btn-mode-quick');
    if (btnModeQuick) {
        btnModeQuick.addEventListener('click', () => {
            startQuiz('mixed', { mode: 'quick', count: 10, timer: false });
        });
    }

    const btnModeSubject = document.getElementById('btn-mode-subject');
    if (btnModeSubject) {
        btnModeSubject.addEventListener('click', () => {
            showPage('page-selection-matiere');
        });
    }

    const btnModeExam = document.getElementById('btn-mode-exam');
    if (btnModeExam) {
        btnModeExam.addEventListener('click', () => {
            startQuiz('mixed', { mode: 'exam', count: 30, timer: true });
        });
    }

    const btnModeSmart = document.getElementById('btn-mode-smart');
    if (btnModeSmart) {
        btnModeSmart.addEventListener('click', () => {
            startQuiz('mixed', { mode: 'smart', count: 15, timer: false });
        });
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

    function startQuiz(subject, config = { mode: 'standard', count: 20, timer: false }) {
        appState.score = 0;
        appState.currentQuestionIndex = 0;
        appState.wrongAnswers = []; // Réinitialiser les erreurs
        appState.currentMode = config.mode;
        appState.lives = 3; // Réinitialiser les vies
        appState.startTime = Date.now(); // ANTI-TRICHE : Démarrer le chronomètre global
        
        let allQuestionsForSerie = quizData[appState.currentSerie] || []; // Récupère toutes les questions de la série
        
        // Filtrage par matière si ce n'est pas un mode "mixte"
        if (subject !== 'mixed') {
            allQuestionsForSerie = allQuestionsForSerie.filter(q => q.subject === subject);
        }

        if (allQuestionsForSerie.length === 0) {
            showNotification(`Aucune question pour "${subject}" dans la série "${appState.currentSerie}".`, 'info');
            showPage('page-dashboard');
            return;
        }

        // --- NOUVELLE LOGIQUE DE SÉLECTION "INTELLIGENTE" ---
        const correctlyAnsweredIndexes = (currentUser.correctlyAnswered && currentUser.correctlyAnswered[appState.currentSerie]) || [];
        const notYetCorrect = [];
        const alreadyCorrect = [];

        allQuestionsForSerie.forEach((question, index) => {
            const questionWithOriginalIndex = { ...question, originalIndex: index };
            // Note: L'index ici est relatif au tableau filtré, ce n'est pas parfait pour le suivi global
            // mais suffisant pour la logique actuelle.
            // Pour le mode Smart, on vérifie si l'index est dans les "correctlyAnswered"
            // (Idéalement, il faudrait un ID unique par question dans la BDD)
            
            // Simplification pour la démo : on considère "déjà réussi" si on le trouve
            // (Dans une vraie app, on utiliserait des IDs de questions)
            if (config.mode === 'smart') {
                // En mode smart, on priorise ce qui n'est PAS dans correctlyAnswered
                // On simule ici
            }
            
            // On mélange tout pour l'instant
            if (Math.random() > 0.5) { 
                alreadyCorrect.push(questionWithOriginalIndex);
            } else {
                notYetCorrect.push(questionWithOriginalIndex);
            }
        });

        // Sélection des questions selon le mode
        let finalQuestions = [];
        
        if (config.mode === 'smart') {
            // Priorité aux questions non maîtrisées
            finalQuestions = [...shuffleArray(notYetCorrect), ...shuffleArray(alreadyCorrect)];
        } else {
            // Mélange complet
            finalQuestions = shuffleArray([...notYetCorrect, ...alreadyCorrect]);
        }

        // Limiter au nombre demandé
        finalQuestions = finalQuestions.slice(0, config.count);
        const remainingNeeded = config.count - finalQuestions.length;
        if (remainingNeeded > 0) {
            finalQuestions.push(...shuffledAlreadyCorrect.slice(0, remainingNeeded));
        }

        // Si après tout ça, on n'a toujours pas assez de questions (cas où il y a moins de QUESTIONS_PER_QUIZ questions au total)
        // On se contente de ce qu'on a.
        appState.currentQuestions = finalQuestions;

        // Si aucune question n'est disponible, on arrête.
        if (appState.currentQuestions.length === 0) return;

        // Réinitialiser la couleur de la barre de progression au début du quiz
        const progressBar = document.getElementById('quiz-progress');
        if (progressBar) progressBar.style.backgroundColor = '';

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
                // Mode 2 : Par matière (15 questions)
                startQuiz(appState.currentSubject, { mode: 'subject', count: 15, timer: false });
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

        // Cacher l'explication et le bouton "Suivant" de la question précédente
        document.getElementById('explanation-container').style.display = 'none';
        document.getElementById('explanation-text').textContent = '';
        document.getElementById('btn-next-question').style.display = 'none';

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
        // On ajoute une transition sur la couleur aussi pour un effet fluide
        document.getElementById('quiz-progress').style.transition = 'width 0.5s ease-in-out, background-color 0.5s ease-in-out';

        // Créer les boutons de réponse
        question.answers.forEach((answer, index) => {
            const button = document.createElement('button');
            button.textContent = answer;
            button.classList.add('answer-btn');
            button.addEventListener('click', () => selectAnswer(index, button));
            answersContainer.appendChild(button);
        });

        // Gestion du bouton "Signaler une erreur"
        const reportBtn = document.getElementById('btn-report-error');
        if (reportBtn) {
            reportBtn.onclick = () => {
                const subject = `Erreur Question: ${appState.currentSerie} - ${question.subject}`;
                const body = `Bonjour,\n\nJe veux signaler une erreur sur la question suivante :\n"${question.question}"\n\nMon commentaire :`;
                window.open(`mailto:examplay.officiel@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
            };
        }
    }

    function updateLivesDisplay() {
        const container = document.getElementById('quiz-lives');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            // Affiche un cœur plein si l'index est inférieur au nombre de vies restantes, sinon un cœur vide
            const iconClass = i < appState.lives ? 'fas fa-heart' : 'far fa-heart';
            container.innerHTML += `<i class="${iconClass}" style="margin-right: 2px;"></i> `;
        }
    }

    function selectAnswer(selectedIndex, button) {
        const question = appState.currentQuestions[appState.currentQuestionIndex];
        const isCorrect = selectedIndex === question.correct;

        // Désactiver tous les boutons après une réponse
        document.querySelectorAll('.answer-btn').forEach(btn => btn.disabled = true);

        if (isCorrect) {
            appState.score++;
            button.classList.add('correct');
            
            // Jouer le son de succès
            soundCorrect.currentTime = 0;
            soundCorrect.play().catch(() => {}); // Ignorer erreur si autoplay bloqué

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
            
            // Jouer le son d'erreur
            soundWrong.currentTime = 0;
            soundWrong.play().catch(() => {});

            // Enregistrer l'erreur pour le récapitulatif
            appState.wrongAnswers.push({
                question: question.question,
                correctAnswer: question.answers[question.correct],
                userAnswer: question.answers[selectedIndex],
                explanation: question.explanation
            });

            // GESTION DES VIES (MODE EXAMEN)
            if (appState.currentMode === 'exam') {
                appState.lives--;
                updateLivesDisplay();
                if (appState.lives <= 0) {
                    showNotification("💔 Plus de vies ! Fin de l'examen.", 'error');
                    setTimeout(() => endQuiz(), 1500); // Fin du quiz après un court délai
                    return; // On arrête l'exécution ici pour ne pas afficher le bouton "Suivant"
                }
            }
        }

        // --- MISE À JOUR DE LA COULEUR DE LA BARRE DE PROGRESSION ---
        const progressBar = document.getElementById('quiz-progress');
        if (progressBar) {
            const ratio = appState.score / (appState.currentQuestionIndex + 1);
            if (ratio >= 0.8) {
                progressBar.style.backgroundColor = '#4CAF50'; // Vert (Excellent)
            } else if (ratio >= 0.5) {
                progressBar.style.backgroundColor = '#FF9800'; // Orange (Moyen)
            } else {
                progressBar.style.backgroundColor = '#F44336'; // Rouge (Faible)
            }
        }

        // Afficher l'explication si elle existe (même si la réponse est correcte)
        if (question.explanation) {
            const explanationContainer = document.getElementById('explanation-container');
            const explanationText = document.getElementById('explanation-text');
            explanationText.textContent = question.explanation;
            explanationContainer.style.display = 'block';
        }

        // Afficher le bouton "Suivant" au lieu de passer automatiquement
        document.getElementById('btn-next-question').style.display = 'block';
    }

    // --- GESTION DU MINUTEUR (MODE EXAMEN) ---
    function startTimer(durationSeconds) {
        let timeLeft = durationSeconds;
        const timerProgress = document.getElementById('timer-progress');
        const timerDisplay = document.getElementById('timer-display');
        const circumference = 2 * Math.PI * 26; // r=26

        timerProgress.style.strokeDasharray = circumference;
        timerDisplay.textContent = Math.floor(timeLeft / 60) + ":" + (timeLeft % 60).toString().padStart(2, '0');

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = Math.floor(timeLeft / 60) + ":" + (timeLeft % 60).toString().padStart(2, '0');
            
            const offset = circumference - (timeLeft / durationSeconds) * circumference;
            timerProgress.style.strokeDashoffset = offset;

            if (timeLeft <= 0) {
                endQuiz();
            }
        }, 1000);
    }

    // --- NOUVELLE GESTION DU BOUTON "SUIVANT" ---
    document.getElementById('btn-next-question').addEventListener('click', () => {
        // Logique qui était auparavant dans le setTimeout de selectAnswer
        appState.currentQuestionIndex++;
        if (appState.currentQuestionIndex < appState.currentQuestions.length) {
            showQuestion();
        } else {
            endQuiz();
        }
    });

    function endQuiz() {
        clearInterval(timerInterval); // Arrêter le chrono

        // --- SÉCURITÉ ANTI-TRICHE ---
        const totalTimeSpent = Date.now() - appState.startTime;
        const minTimePerQuestion = 1500; // 1.5 secondes minimum par question pour être humain
        const minTotalTime = appState.currentQuestions.length * minTimePerQuestion;

        if (totalTimeSpent < minTotalTime && appState.score > 0) {
            showNotification("⚠️ Score non validé : Temps de réponse suspect (trop rapide).", 'error');
            showPage('page-dashboard');
            return; // On n'enregistre pas le score
        }

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

        // --- GÉNÉRER LE RÉCAPITULATIF DES ERREURS ---
        const reviewContainer = document.getElementById('quiz-review-container');
        if (reviewContainer) {
            reviewContainer.innerHTML = ''; // Vider le contenu précédent
            if (appState.wrongAnswers.length > 0) {
                const title = document.createElement('h3');
                title.textContent = "Récapitulatif des erreurs";
                title.style.margin = "1rem 0";
                reviewContainer.appendChild(title);

                appState.wrongAnswers.forEach(item => {
                    const card = document.createElement('div');
                    card.style.cssText = "background: #fff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; text-align: left; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #F44336;";
                    card.innerHTML = `
                        <p style="font-weight: 600; color: #333; margin-bottom: 0.5rem;">${item.question}</p>
                        <p style="color: #F44336; margin-bottom: 0.25rem; font-size: 0.9rem;"><i class="fas fa-times-circle"></i> Votre réponse : ${item.userAnswer}</p>
                        <p style="color: #4CAF50; margin-bottom: 0.5rem; font-size: 0.9rem;"><i class="fas fa-check-circle"></i> Bonne réponse : ${item.correctAnswer}</p>
                        ${item.explanation ? `<p style="font-style: italic; color: #666; font-size: 0.85rem; border-top: 1px solid #eee; padding-top: 0.5rem; margin-top: 0.5rem;">💡 ${item.explanation}</p>` : ''}
                    `;
                    reviewContainer.appendChild(card);
                });
            }
        }

        // --- SAUVEGARDER LA PROGRESSION AVEC SUPABASE ---
        updateUserProgress(pointsGagnes, currentUser.correctlyAnswered);

        showPage('page-resultats');
    }

    // --- PARTAGE WHATSAPP ---
    document.getElementById('btn-share-whatsapp').addEventListener('click', () => {
        const text = `Je viens de faire un score de ${appState.score}/${appState.currentQuestions.length} sur ExamPlay en mode ${appState.currentMode} ! 🚀 Viens me battre !`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    });

    document.getElementById('btn-duel-friend').addEventListener('click', () => {
        const text = `🔥 DUEL ! Je te parie que je fais un meilleur score que toi sur ce quiz ExamPlay (${appState.currentSerie}). Relève le défi !`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    });

    document.getElementById('badge-modal-share').addEventListener('click', () => {
        const badgeName = document.getElementById('badge-modal-name').textContent;
        const text = `🏆 J'ai débloqué le badge "${badgeName}" sur ExamPlay ! Prépare tes examens avec moi.`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    });

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

    // --- GESTION DES SÉRIES (STREAKS) ---
    async function checkAndUpdateStreak() {
        if (!currentUser) return;

        // On utilise la date UTC pour éviter les problèmes de fuseaux horaires locaux
        const today = new Date().toISOString().split('T')[0];
        const lastActive = currentUser.last_active_date;
        let currentStreak = currentUser.streak || 0;

        // Si l'utilisateur s'est déjà connecté aujourd'hui, on ne fait rien
        if (lastActive === today) {
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        if (lastActive === yesterdayString) {
            // Connexion consécutive (C'était hier)
            currentStreak++;
        } else {
            // Série brisée ou première connexion
            currentStreak = 1;
        }

        // --- LOGIQUE BADGE SEMAINE DE FEU ---
        let newBadges = currentUser.badges || [];
        let badgeEarned = false;

        if (currentStreak >= 7 && !newBadges.includes("semaine-feu")) {
            newBadges = [...newBadges, "semaine-feu"];
            badgeEarned = true;
        }

        try {
            const updatePayload = { 
                last_active_date: today,
                streak: currentStreak
            };
            if (badgeEarned) updatePayload.badges = newBadges;

            const { data, error } = await supabase
                .from('profiles')
                .update(updatePayload)
                .eq('id', currentUser.id)
                .select()
                .single();

            if (error) throw error;

            currentUser = data; // Mettre à jour l'utilisateur local avec les nouvelles données
            
            if (currentStreak > 1) {
                showNotification(`🔥 Série en cours : ${currentStreak} jours !`, 'success');
            }

            if (badgeEarned) {
                showNewBadge("semaine-feu");
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la série :", error);
        }
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

        // Affichage de la série
        const streakElement = document.getElementById('dashboard-streak');
        if (streakElement) {
            const streak = currentUser.streak || 0;
            streakElement.textContent = `${streak} jour${streak > 1 ? 's' : ''} 🔥`;
        }

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

    // --- FONCTION POUR LA PAGE ORIENTATION ---
    function updateOrientationPage() {
        if (!currentUser) return;

        const serie = currentUser.serie || appState.currentSerie || "SVT"; // Fallback
        document.getElementById('orientation-serie-name').textContent = serie;
        
        // Mettre à jour l'avatar
        const avatarUrl = currentUser.picture || 'https://i.imgur.com/user-avatar.png';
        document.querySelector('#page-orientation .avatar').src = avatarUrl;

        const suggestions = orientationData[serie] || [];
        const container = document.getElementById('orientation-suggestions');
        container.innerHTML = '';

        if (suggestions.length === 0) {
            container.innerHTML = '<p>Aucune suggestion disponible pour cette série pour le moment.</p>';
            return;
        }

        suggestions.forEach(item => {
            const card = document.createElement('div');
            card.className = 'stat-card'; // Réutilisation du style stat-card pour la consistance
            card.style.textAlign = 'left';
            card.style.padding = '1.5rem';
            
            let careersHtml = item.careers.map(c => `<span style="display:inline-block; background:#eef2f7; padding:4px 8px; border-radius:4px; font-size:0.85rem; margin:2px; color:#333;">${c}</span>`).join('');
            let schoolsHtml = item.schools.map(s => `<li style="margin-bottom:4px;"><a href="${s.url}" target="_blank" style="text-decoration:none; color:#333; border-bottom: 1px dotted #999;"><i class="fas fa-university" style="color:var(--primary-color); margin-right:5px;"></i>${s.name}</a></li>`).join('');

            card.innerHTML = `
                <h3 style="display:flex; align-items:center; gap:10px; margin-bottom:0.5rem; color:var(--primary-color);">${item.icon} ${item.title}</h3>
                <p style="margin-bottom:1rem; color:#666;">${item.description}</p>
                <div style="margin-bottom:1rem;"><strong>Métiers :</strong><br>${careersHtml}</div>
                <div><strong>Où étudier en Haïti ?</strong><ul style="list-style:none; padding:0; margin-top:5px; font-size:0.9rem; color:#555;">${schoolsHtml}</ul></div>
            `;
            container.appendChild(card);
        });

        // Afficher les témoignages
        const testimonialsContainer = document.getElementById('orientation-testimonials');
        if (testimonialsContainer) {
            testimonialsContainer.innerHTML = '';
            testimonialsData.forEach(t => {
                const tCard = document.createElement('div');
                tCard.style.cssText = "background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-left: 3px solid var(--primary-color);";
                tCard.innerHTML = `
                    <p style="font-style: italic; color: #555; margin-bottom: 0.5rem;">"${t.text}"</p>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span style="font-weight: bold; color: #333;">${t.name} (${t.serie})</span>
                        <span style="color: #888;">${t.school}</span>
                    </div>
                `;
                testimonialsContainer.appendChild(tCard);
            });
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
                showNotification("Impossible de charger le classement.", 'error');
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
    async function checkUserSession(initialPageId) {
        const publicPages = ['page-apropos', 'page-contact', 'page-accueil'];

        // Si la page demandée est publique ET qu'il n'y a pas de session active, on l'affiche directement.
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        if (publicPages.includes(initialPageId) && !activeSession) {
            showPage(initialPageId);
            return;
        }
        // Pour toutes les autres pages, on vérifie la session.

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: userProfile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
    
            if (userProfile && !error) {
                // Le profil existe, on continue normalement
                currentUser = userProfile;
                checkRestoredSerie();
                await checkAndUpdateStreak(); // Vérifier la série au chargement
                // --- CORRECTION ---
                // Si l'utilisateur est connecté, on l'envoie vers la page demandée
                // ou vers le dashboard si la page demandée est une page publique (comme l'accueil).
                const destinationPage = publicPages.includes(initialPageId) ? 'page-dashboard' : initialPageId;
                showPage(destinationPage);
            } else {
                // Si une session existe mais pas de profil (ex: inscription échouée), on nettoie.
                console.warn("Session sans profil détectée. Déconnexion...");
                await supabase.auth.signOut();
                showPage('page-accueil');
            }
        } else {
            // Si pas de session et que la page n'est pas publique, on redirige vers l'accueil.
            showPage('page-accueil');
        }
    }

    // --- NOUVELLE LOGIQUE D'INITIALISATION ---
    // Au chargement, on détermine quelle page afficher en fonction de l'URL
    function initializeApp() {
        // On récupère le "hash" de l'URL (ex: #page-apropos) et on enlève le #
        const hash = window.location.hash.substring(1);
        // Si le hash est valide et correspond à une page, on l'utilise. Sinon, on utilise 'page-accueil'.
        const initialPageId = document.getElementById(hash) ? hash : 'page-accueil';
        checkUserSession(initialPageId);
    }

    initializeApp();
});
