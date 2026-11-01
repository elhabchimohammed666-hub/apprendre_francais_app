import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, CircleHelp,
  Clock3, Coffee, Flame, Headphones, Heart, Languages, LockKeyhole, LogIn,
  Menu, MessageCircle, Search, Sparkles, Sprout, Trophy, UserRound, X,
} from "lucide-react";
import { apiRequest } from "./api.js";
import { categories, lessons as starterLessons } from "./data.js";

const iconMap = { message: MessageCircle, user: UserRound, book: BookOpen, sparkles: Sparkles, coffee: Coffee };
const initialProgress = () => {
  try {
    return JSON.parse(localStorage.getItem("linguafranca-progress") || "{}");
  } catch {
    return {};
  }
};

function App() {
  const [lessons, setLessons] = useState(starterLessons);
  const [progress, setProgress] = useState(initialProgress);
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [activeLevel, setActiveLevel] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [quizState, setQuizState] = useState(null);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    apiRequest("/lessons")
      .then((remote) => {
        if (remote.length) {
          setLessons(remote.map((lesson) => ({
            ...lesson,
            id: lesson.id ?? lesson._id,
            description: lesson.description || lesson.summary,
            duration: "7 min",
            icon: lesson.category === "Vocabulaire" ? "message" : "book",
            color: "lavender",
          })));
        }
      })
      .catch(() => {});
    apiRequest("/auth/me")
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          apiRequest("/progress/me").then((entries) => {
            const serverProgress = Object.fromEntries(entries
              .filter((entry) => entry.lesson)
              .map((entry) => [entry.lesson.id ?? entry.lesson._id, {
                completed: Boolean(entry.completedAt),
                bestScore: entry.bestScore,
              }]));
            setProgress((current) => ({ ...current, ...serverProgress }));
          }).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("linguafranca-progress", JSON.stringify(progress));
  }, [progress]);

  const filteredLessons = useMemo(() => lessons.filter((lesson) => {
    const matchesCategory = activeCategory === "Tout" || lesson.category === activeCategory;
    const matchesLevel = activeLevel === "Tous" || lesson.level === activeLevel;
    const matchesSearch = `${lesson.title} ${lesson.description} ${lesson.category}`.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesLevel && matchesSearch;
  }), [activeCategory, activeLevel, lessons, search]);

  const completedCount = Object.values(progress).filter((entry) => entry.completed).length;
  const totalCount = lessons.length;
  const overallProgress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const streak = Number(localStorage.getItem("linguafranca-streak") || 0);

  async function finishQuiz(answers, localScore) {
    const lesson = selectedLesson;
    let score = localScore;
    let explanations = null;
    if (lesson.quizId) {
      try {
        const result = await apiRequest(`/quizzes/${lesson.quizId}/submit`, {
          method: "POST",
          body: JSON.stringify({ answers }),
        });
        score = Math.round((result.score / 100) * lesson.quiz.length);
        explanations = result.explanations;
      } catch {
        setNotice("Le résultat du quiz n’a pas pu être vérifié par le serveur.");
      }
    }
    const today = new Date().toISOString().slice(0, 10);
    const lastStudyDate = localStorage.getItem("linguafranca-last-study-date");
    if (lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const nextStreak = lastStudyDate === yesterday ? Number(localStorage.getItem("linguafranca-streak") || 0) + 1 : 1;
      localStorage.setItem("linguafranca-streak", String(nextStreak));
      localStorage.setItem("linguafranca-last-study-date", today);
    }
    setProgress((current) => ({
      ...current,
      [lesson.id]: {
        completed: score >= Math.ceil(lesson.quiz.length * 0.7),
        bestScore: Math.max(current[lesson.id]?.bestScore || 0, score),
      },
    }));
    return { score, total: lesson.quiz.length, explanations };
  }

  async function submitAuth(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const result = await apiRequest(`/auth/${authMode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setUser(result.user || result);
      setAuthOpen(false);
      setNotice(`Bienvenue${result.user?.name || result.name ? `, ${result.user?.name || result.name}` : ""} !`);
    } catch (error) {
      setNotice(error.message.includes("fetch") ? "L’API est indisponible. Vous pouvez continuer en mode invité." : error.message);
    }
  }

  async function logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      setUser(null);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function openLesson(lesson) {
    setSelectedLesson(lesson);
    setQuizState(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (lesson.quiz || !lesson.id.match(/^[a-f\d]{24}$/i)) return;
    try {
      const detail = await apiRequest(`/lessons/${lesson.id}`);
      setSelectedLesson((current) => current?.id === lesson.id ? {
        ...current,
        ...detail,
        id: detail.id ?? detail._id,
        duration: lesson.duration,
        icon: lesson.icon,
        color: lesson.color,
      } : current);
    } catch (error) {
      setNotice(`Cette leçon n’a pas pu être chargée : ${error.message}`);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setSelectedLesson(null); }}>
          <span className="brand-mark"><Languages size={21} strokeWidth={2.2} /></span>
          <span>lingua<span className="brand-accent">franca</span></span>
        </a>
        <nav className={mobileMenu ? "nav-links nav-open" : "nav-links"}>
          <a className={!selectedLesson ? "nav-link selected" : "nav-link"} href="#cours" onClick={() => { setSelectedLesson(null); setMobileMenu(false); }}>Mes cours</a>
          <a className="nav-link" href="#progression" onClick={() => setMobileMenu(false)}>Ma progression</a>
          <a className="nav-link" href="#methode" onClick={() => setMobileMenu(false)}>La méthode</a>
        </nav>
        <div className="top-actions">
          <button className="icon-button mobile-toggle" aria-label="Ouvrir le menu" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={21} /></button>
          {user ? (
            <button className="user-pill" onClick={logout}><span className="avatar">{(user.name || user.email || "M").slice(0, 1).toUpperCase()}</span><span>{user.name || "Mon compte"}</span><ChevronDown size={15} /></button>
          ) : (
            <button className="login-button" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}><LogIn size={16} /> Se connecter</button>
          )}
        </div>
      </header>

      {selectedLesson ? (
        <LessonView
          lesson={selectedLesson}
          completed={Boolean(progress[selectedLesson.id]?.completed)}
          quizState={quizState}
          onBack={() => setSelectedLesson(null)}
          onFinish={finishQuiz}
        />
      ) : (
        <main className="main-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" /> TON ESPACE D’APPRENTISSAGE</p>
              <h1>Bonjour{user?.name ? `, ${user.name.split(" ")[0]}` : ""} <span className="wave">✳</span></h1>
              <p className="welcome-subtitle">Un petit pas chaque jour, et bientôt le français sera vôtre.</p>
            </div>
            <div className="streak-card">
              <div className="streak-icon"><Flame size={20} fill="currentColor" /></div>
              <div><strong>{streak} jour{streak > 1 ? "s" : ""}</strong><span>ta série actuelle</span></div>
              <span className="streak-spark">✦</span>
            </div>
          </section>

          <section className="hero-card">
            <div className="hero-copy">
              <div className="hero-tag"><Sprout size={14} /> TON PARCOURS A1</div>
              <h2>Le français,<br />tout simplement.</h2>
              <p>Des leçons courtes, des mots qui restent. À ton rythme, pour de vrai.</p>
              <button className="hero-button" onClick={() => openLesson(lessons.find((item) => !progress[item.id]?.completed) || lessons[0])}>
                Continuer mon parcours <ArrowRight size={17} />
              </button>
              <div className="hero-footnote"><span className="tiny-avatar">L</span><span>Déjà <strong>2 400+</strong> apprenants nous ont rejoints</span></div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-sun" />
              <div className="art-circle art-circle-one" />
              <div className="art-circle art-circle-two" />
              <div className="art-book"><BookOpen size={84} strokeWidth={1.15} /></div>
              <div className="art-speech speech-one">bonjour !</div>
              <div className="art-speech speech-two">ça va ?</div>
              <div className="art-star">✳</div>
              <div className="art-leaf">✦</div>
            </div>
          </section>

          <section className="stats-grid" id="progression">
            <div className="stat-card progress-stat">
              <div className="stat-heading"><span className="stat-icon mint-icon"><Trophy size={18} /></span><span>Progression globale</span><span className="stat-menu">···</span></div>
              <div className="progress-number">{overallProgress}<span>%</span></div>
              <div className="progress-track"><span style={{ width: `${overallProgress}%` }} /></div>
              <div className="stat-caption">{completedCount} leçon{completedCount !== 1 ? "s" : ""} terminée{completedCount !== 1 ? "s" : ""} sur {totalCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-heading"><span className="stat-icon peach-icon"><CheckCircle2 size={18} /></span><span>Leçons terminées</span></div>
              <div className="stat-number">{String(completedCount).padStart(2, "0")}<span className="stat-total"> / {String(totalCount).padStart(2, "0")}</span></div>
              <div className="stat-caption">Chaque leçon compte. Bravo ! <span className="caption-emoji">✷</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-heading"><span className="stat-icon lavender-icon"><Clock3 size={18} /></span><span>Temps d’apprentissage</span></div>
              <div className="stat-number">{completedCount * 8}<span className="stat-unit"> min</span></div>
              <div className="stat-caption">Un peu de français, beaucoup de progrès.</div>
            </div>
          </section>

          <section className="lessons-section" id="cours">
            <div className="section-heading">
              <div><p className="eyebrow">FAISONS UN PEU DE FRANÇAIS</p><h2>Ton prochain chapitre<span className="heading-period">.</span></h2></div>
              <button className="text-button" onClick={() => { setActiveCategory("Tout"); setActiveLevel("Tous"); document.getElementById("cours")?.scrollIntoView({ behavior: "smooth" }); }}>Voir tout <ArrowRight size={16} /></button>
            </div>
            <div className="lesson-toolbar">
              <div className="category-tabs" role="tablist" aria-label="Catégorie de leçon">
                {categories.map((category) => <button key={category} className={activeCategory === category ? "category-tab active" : "category-tab"} onClick={() => setActiveCategory(category)}>{category}</button>)}
              </div>
              <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Chercher une leçon..." /></label>
            </div>
            <div className="level-row">
              <span>MON NIVEAU</span>
              {["Tous", "A1", "A2"].map((level) => <button key={level} className={activeLevel === level ? "level-chip active" : "level-chip"} onClick={() => setActiveLevel(level)}>{level}</button>)}
            </div>
            <div className="lesson-grid">
              {filteredLessons.map((lesson, index) => (
                <LessonCard key={lesson.id} lesson={lesson} index={index} completed={Boolean(progress[lesson.id]?.completed)} onClick={() => openLesson(lesson)} />
              ))}
              {filteredLessons.length === 0 && <div className="empty-state">Aucune leçon ne correspond. Essaie une autre recherche.</div>}
            </div>
          </section>

          <section className="quote-card" id="methode">
            <div className="quote-mark">“</div>
            <div><p>Une langue, ça ne s’apprend pas. Ça se vit, un mot à la fois.</p><span>LA PHILOSOPHIE LINGUAFRANCA</span></div>
            <div className="quote-decoration">bonjour<br /><span>✳</span></div>
          </section>
          <footer className="footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><Languages size={18} /></span><span>lingua<span className="brand-accent">franca</span></span></a><span>Fait avec soin, et un peu de café. <Coffee size={14} /></span><span>© 2025 LinguaFranca</span></footer>
        </main>
      )}

      {authOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
        <form className="auth-modal" onSubmit={submitAuth}>
          <button type="button" className="modal-close" aria-label="Fermer" onClick={() => setAuthOpen(false)}><X size={19} /></button>
          <span className="auth-icon"><Languages size={22} /></span>
          <p className="eyebrow">RAVI DE TE REVOIR</p>
          <h2>{authMode === "login" ? "On reprend ?" : "Bienvenue chez nous."}</h2>
          <p className="auth-description">Retrouve ta progression et continue à apprendre à ton rythme.</p>
          {authMode === "register" && <label>Ton prénom<input name="name" required placeholder="Camille" autoComplete="name" /></label>}
          <label>Adresse e-mail<input name="email" type="email" required placeholder="toi@exemple.fr" autoComplete="email" /></label>
          <label>Mot de passe<input name="password" type="password" minLength="12" required placeholder="12 caractères minimum" autoComplete={authMode === "login" ? "current-password" : "new-password"} /></label>
          <button className="hero-button auth-submit" type="submit">{authMode === "login" ? "Se connecter" : "Créer mon compte"} <ArrowRight size={16} /></button>
          <p className="auth-switch">{authMode === "login" ? "Pas encore de compte ?" : "Déjà parmi nous ?"} <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Créer un compte" : "Se connecter"}</button></p>
          <p className="auth-safe"><LockKeyhole size={13} /> Tes données restent privées.</p>
        </form>
      </div>}
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Fermer"><X size={15} /></button></div>}
    </div>
  );
}

function LessonCard({ lesson, index, completed, onClick }) {
  const Icon = iconMap[lesson.icon] || BookOpen;
  return (
    <button className="lesson-card" onClick={onClick} style={{ animationDelay: `${index * 70}ms` }}>
      <div className={`lesson-illustration ${lesson.color || "lavender"}`}>
        <span className="lesson-level">{lesson.level}</span>
        {completed && <span className="completed-badge"><Check size={12} /></span>}
        <Icon size={34} strokeWidth={1.4} />
        <span className="illustration-spark">✳</span>
      </div>
      <div className="lesson-card-content">
        <div className="lesson-meta"><span>{lesson.category}</span><span className="meta-dot">·</span><span><Clock3 size={12} /> {lesson.duration}</span></div>
        <h3>{lesson.title}</h3>
        <p>{lesson.description}</p>
        <span className="lesson-link">{completed ? "Revoir la leçon" : "Découvrir la leçon"} <ArrowRight size={15} /></span>
      </div>
    </button>
  );
}

function LessonView({ lesson, completed, quizState, onBack, onFinish }) {
  const [answers, setAnswers] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState(quizState);
  const Icon = iconMap[lesson.icon] || BookOpen;
  const quiz = lesson.quiz || [];

  async function submitQuiz(event) {
    event.preventDefault();
    if (quiz.length > 0 && quiz.every((_question, index) => Number.isInteger(answers[index]))) {
      const localScore = quiz.reduce((score, question, index) =>
        score + (Number.isInteger(question.answer) && answers[index] === question.answer ? 1 : 0), 0);
      setResult(await onFinish(answers, localScore));
      setRevealed(true);
    }
  }

  return (
    <main className="lesson-page">
      <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Retour aux leçons</button>
      <div className="lesson-layout">
        <article className="lesson-article">
          <div className={`lesson-hero-illustration ${lesson.color || "lavender"}`}><Icon size={54} strokeWidth={1.2} /><span className="lesson-level">{lesson.level}</span></div>
          <div className="lesson-meta"><span>{lesson.category}</span><span className="meta-dot">·</span><span><Clock3 size={13} /> {lesson.duration}</span></div>
          <h1>{lesson.title}<span className="heading-period">.</span></h1>
          <p className="lesson-intro">{lesson.description}</p>
          <div className="lesson-body">
            {(lesson.content || []).map((block, index) => <section key={block.heading || index} className="content-block"><span className="content-number">0{index + 1}</span><div><h2>{block.heading}</h2><p>{block.text || block.body}</p></div></section>)}
          </div>
          {!!lesson.vocabulary?.length && <section className="vocabulary-box"><div className="vocabulary-heading"><Headphones size={18} /><h2>Les mots à garder</h2><span>À TOI DE JOUER</span></div><div className="vocabulary-list">{lesson.vocabulary.map(([word, translation]) => <div className="vocabulary-item" key={word}><strong>{word}</strong><span>{translation}</span></div>)}</div></section>}
          {!showQuiz && <button className="hero-button start-quiz" onClick={() => setShowQuiz(true)}>Je suis prêt·e pour le quiz <ArrowRight size={17} /></button>}
          {showQuiz && <section className="quiz-panel">
            <div className="quiz-title"><span className="stat-icon lavender-icon"><CircleHelp size={18} /></span><div><p className="eyebrow">PETIT QUIZ</p><h2>À toi de jouer !</h2></div><span className="quiz-count">{quiz.length} questions</span></div>
            <form onSubmit={submitQuiz}>
              {quiz.map((item, index) => <fieldset className="quiz-question" key={item.question}><legend><span>{String(index + 1).padStart(2, "0")}</span>{item.question}</legend><div className="quiz-options">{item.options.map((option, optionIndex) => {
                const isSelected = answers[index] === optionIndex;
                const isCorrect = revealed && (Number.isInteger(item.answer)
                  ? optionIndex === item.answer
                  : result?.explanations?.[index]?.correct && isSelected);
                const isWrong = revealed && isSelected && !isCorrect;
                return <label key={option} className={`quiz-option ${isSelected ? "chosen" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}><input type="radio" name={`q-${index}`} checked={isSelected} disabled={revealed} onChange={() => setAnswers((current) => { const updated = [...current]; updated[index] = optionIndex; return updated; })} /><span>{option}</span>{isCorrect && <Check size={15} />}</label>;
              })}</div>{revealed && <p className="quiz-explanation"><Sparkles size={14} /> {result?.explanations?.[index]?.explanation || item.explanation}</p>}</fieldset>)}
              {!revealed ? <button className="hero-button quiz-submit" type="submit" disabled={!quiz.length || !quiz.every((_question, index) => Number.isInteger(answers[index]))}>Vérifier mes réponses <ArrowRight size={16} /></button> : <div className="quiz-result"><div className="result-icon">{result?.score >= Math.ceil((result?.total || 1) * 0.7) ? <Trophy size={20} /> : <Heart size={20} />}</div><div><strong>{result?.score}/{result?.total} — {result?.score >= Math.ceil((result?.total || 1) * 0.7) ? "Très bien !" : "Continue, tu progresses !"}</strong><span>{completed ? "Ta progression a été mise à jour." : "Tu peux refaire le quiz quand tu veux."}</span></div><button type="button" className="text-button" onClick={() => { setAnswers([]); setRevealed(false); setResult(null); }}>Recommencer</button></div>}
            </form>
          </section>}
          {completed && !showQuiz && <p className="already-completed"><CheckCircle2 size={16} /> Leçon terminée — bravo, tu peux la refaire quand tu veux.</p>}
        </article>
        <aside className="lesson-sidebar"><div className="sidebar-card"><p className="eyebrow">DANS CETTE LEÇON</p><h3>Un petit moment pour toi.</h3><div className="sidebar-detail"><Clock3 size={15} /><span>{lesson.duration} de lecture</span></div><div className="sidebar-detail"><CircleHelp size={15} /><span>{quiz.length} questions pour pratiquer</span></div><div className="sidebar-detail"><Heart size={15} /><span>À ton rythme, sans pression</span></div><div className="sidebar-divider" /><div className="sidebar-tip"><Sparkles size={16} /><span>Lis les exemples à voix haute. C’est comme ça que les mots s’installent.</span></div><button className="sidebar-start" onClick={() => { setShowQuiz(true); document.querySelector(".quiz-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>Commencer le quiz <ArrowRight size={15} /></button></div></aside>
      </div>
    </main>
  );
}

export default App;
