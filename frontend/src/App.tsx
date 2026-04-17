import { useState, type KeyboardEvent, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, ArrowRight, ArrowLeft, RefreshCw, X, Plus, UserRound, Check, ChevronRight, Clock, Trash2, Lock, Eye, EyeOff, ChevronDown, ArrowUpLeft } from 'lucide-react';

// ========== TYPES ==========
type Mode = 'pacar' | 'teman' | 'hts' | 'ttm' | 'pdkt' | 'gebetan' | 'fwb' | 'mantan' | 'situationship' | 'rebound' | null;
type FormStep = 'person-1' | 'person-2';

interface PersonData {
  name: string;
  gender: 'cowok' | 'cewek' | '';
  personality: string;
  customPersonality: string;
  traits: string[];
  hobbies: string[];
  habits: string[];
  description: string;
}

interface AnalysisResult {
  score: number;
  badge: string;
  summary: string;
  analysis: {
    kepribadian: string;
    sifat: string;
    hobi: string;
    kebiasaan: string;
    dinamika: string;
  };
  greenFlags: string[];
  redFlags: string[];
  spicinessLevel: string;
  advice: string;
}

const EMPTY_PERSON: PersonData = {
  name: '', gender: '', personality: '', customPersonality: '',
  traits: [], hobbies: [], habits: [], description: ''
};

const API_BASE = import.meta.env.VITE_API_BASE || 'https://couple-api.hexanusa.com';
const API_URL = `${API_BASE}/api/analyze`;

// ========== MODE OPTIONS ==========
const MODE_OPTIONS: { value: Mode; icon: string; label: string; desc: string }[] = [
  { value: 'pacar', icon: '💕', label: 'Pacar', desc: 'Cocok jadi pasangan resmi?' },
  { value: 'teman', icon: '🤝', label: 'Teman', desc: 'Bestie sejati atau fake friend?' },
  { value: 'hts', icon: '🫣', label: 'HTS', desc: 'Hubungan Tanpa Status, worth it?' },
  { value: 'ttm', icon: '😏', label: 'TTM', desc: 'Teman Tapi Mesra, baper gak?' },
  { value: 'pdkt', icon: '🥰', label: 'PDKT', desc: 'Lagi pendekatan, ada harapan?' },
  { value: 'gebetan', icon: '😍', label: 'Gebetan', desc: 'Naksir dia, cocok gak sih?' },
  { value: 'fwb', icon: '🔥', label: 'FWB', desc: 'Friends With Benefits, aman?' },
  { value: 'situationship', icon: '🌀', label: 'Situationship', desc: 'Di antara ada dan tiada...' },
  { value: 'mantan', icon: '💔', label: 'Mantan', desc: 'Balikan atau move on aja?' },
  { value: 'rebound', icon: '🩹', label: 'Rebound', desc: 'Pelarian atau beneran?' },
];

// ========== PERSONALITY OPTIONS ==========
const PERSONALITY_OPTIONS = [
  'Introvert & Analitis',
  'Ekstrovert & Spontan',
  'Ambivert & Santai',
  'Introvert & Emosional',
  'Ekstrovert & Terorganisir',
  'Introvert & Kreatif',
  'Ekstrovert & Dominan',
  'Ambivert & Pemikir',
  'Penyendiri tapi Setia',
  'Party Animal',
  'Lainnya',
];

// ========== SUGGESTION DATA ==========
const TRAIT_SUGGESTIONS = {
  positive: ['Penyabar', 'Setia', 'Humoris', 'Mandiri', 'Perhatian', 'Jujur', 'Ambisius', 'Empati Tinggi', 'Percaya Diri', 'Adaptif', 'Penyayang', 'Loyal'],
  negative: ['Posesif', 'Cuek', 'Pencemburu', 'Moody', 'Keras Kepala', 'Overthinker', 'Impulsif', 'Perfeksionis', 'Egois', 'Pemalas', 'Temperamental', 'Clingy'],
};

const HOBBY_SUGGESTIONS = [
  'Main Game', 'Nonton Film/Series', 'Membaca', 'Olahraga', 'Masak',
  'Musik', 'Fotografi', 'Traveling', 'Menulis', 'Drawing/Seni',
  'Coding', 'Skincare', 'Belanja', 'Nongkrong', 'Tidur',
];

const HABIT_SUGGESTIONS = [
  'Begadang', 'Bangun Pagi', 'Rapi & Bersih', 'Berantakan', 'Tepat Waktu',
  'Sering Telat', 'Rajin Olahraga', 'Mager', 'Hemat', 'Boros',
  'Suka Ngopi', 'Makan Teratur', 'Fast Reply Chat', 'Slow Reply',
];

// ========== TAG INPUT WITH SUGGESTIONS ==========
function SmartTagInput({ tags, setTags, placeholder, accentColor, suggestions, suggestionType }: {
  tags: string[];
  setTags: (tags: string[]) => void;
  placeholder: string;
  accentColor: string;
  suggestions?: string[] | { positive: string[]; negative: string[] };
  suggestionType?: 'trait' | 'normal';
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInput('');
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  // Flatten suggestions for rendering
  const isTraitType = suggestionType === 'trait' && suggestions && typeof suggestions === 'object' && !Array.isArray(suggestions);
  const flatSuggestions = isTraitType
    ? [...(suggestions as { positive: string[]; negative: string[] }).positive, ...(suggestions as { positive: string[]; negative: string[] }).negative]
    : (Array.isArray(suggestions) ? suggestions : []);

  const getChipClass = (s: string) => {
    if (!isTraitType) return '';
    const positiveList = (suggestions as { positive: string[]; negative: string[] }).positive;
    return positiveList.includes(s) ? 'positive' : 'negative';
  };

  return (
    <div className="space-y-2">
      <div className={`w-full bg-surface/50 border border-white/10 rounded-xl px-3 py-2 focus-within:border-${accentColor} transition-colors flex flex-wrap gap-2 items-center min-h-[48px]`}>
        {tags.map((tag, i) => (
          <span key={i} className={`inline-flex items-center gap-1 bg-${accentColor}/20 text-${accentColor} text-sm px-3 py-1 rounded-lg`}>
            {tag}
            <button type="button" onClick={() => removeTag(i)} className="hover:opacity-70 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1 flex-1 min-w-[120px]">
          <input
            type="text"
            className="bg-transparent border-none outline-none flex-1 text-sm py-1"
            placeholder={tags.length === 0 ? placeholder : 'Tambah lagi...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
          />
          {input && (
            <button type="button" onClick={addTag} className={`text-${accentColor} hover:opacity-70`}>
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion Chips */}
      {flatSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {flatSuggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggleTag(s)}
              className={`suggestion-chip ${getChipClass(s)} ${tags.includes(s) ? 'selected' : ''}`}
            >
              {tags.includes(s) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== PERSON FORM COMPONENT ==========
function PersonForm({ person, setPerson, label, accent }: {
  person: PersonData;
  setPerson: (p: PersonData) => void;
  label: string;
  accent: 'primary' | 'secondary';
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold border-b border-white/10 pb-2 flex items-center gap-2">
        <UserRound className={`w-5 h-5 text-${accent}`} /> {label}
      </h3>

      {/* Nama */}
      <div>
        <div className="section-label">👤 Nama</div>
        <input
          type="text"
          placeholder="Ketik nama..."
          className={`w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-${accent} transition-colors`}
          value={person.name}
          onChange={e => setPerson({ ...person, name: e.target.value })}
        />
      </div>

      {/* Gender */}
      <div>
        <div className="section-label">⚧ Gender</div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setPerson({ ...person, gender: 'cowok' })}
            className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${person.gender === 'cowok'
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-surface/50 border-white/10 text-text-muted hover:border-white/30'
              }`}
          >
            🧑 Cowok
          </button>
          <button
            type="button"
            onClick={() => setPerson({ ...person, gender: 'cewek' })}
            className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${person.gender === 'cewek'
              ? 'bg-pink-500/20 border-pink-500 text-pink-400'
              : 'bg-surface/50 border-white/10 text-text-muted hover:border-white/30'
              }`}
          >
            👩 Cewek
          </button>
        </div>
      </div>

      {/* Kepribadian */}
      <div>
        <div className="section-label">🧠 Kepribadian</div>
        <select
          className={`w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-${accent} transition-colors text-text`}
          value={person.personality}
          onChange={e => setPerson({ ...person, personality: e.target.value })}
        >
          <option value="" disabled>Pilih Kepribadian</option>
          {PERSONALITY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {person.personality === 'Lainnya' && (
          <input
            type="text"
            placeholder="Jelaskan kepribadian..."
            className={`w-full mt-2 bg-surface/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-${accent} transition-colors`}
            value={person.customPersonality}
            onChange={e => setPerson({ ...person, customPersonality: e.target.value })}
          />
        )}
      </div>

      {/* Sifat - NEW */}
      <div>
        <div className="section-label">💎 Sifat</div>
        <p className="text-xs text-text-muted mb-2">Klik untuk memilih atau ketik sendiri</p>
        <SmartTagInput
          tags={person.traits}
          setTags={(traits) => setPerson({ ...person, traits })}
          placeholder="Contoh: Penyabar, Jujur..."
          accentColor={accent}
          suggestions={TRAIT_SUGGESTIONS}
          suggestionType="trait"
        />
      </div>

      {/* Hobi */}
      <div>
        <div className="section-label">🎯 Hobi</div>
        <p className="text-xs text-text-muted mb-2">Klik untuk memilih atau ketik sendiri</p>
        <SmartTagInput
          tags={person.hobbies}
          setTags={(hobbies) => setPerson({ ...person, hobbies })}
          placeholder="Contoh: Main Game, Membaca..."
          accentColor={accent}
          suggestions={HOBBY_SUGGESTIONS}
        />
      </div>

      {/* Kebiasaan */}
      <div>
        <div className="section-label">⚡ Kebiasaan</div>
        <p className="text-xs text-text-muted mb-2">Klik untuk memilih atau ketik sendiri</p>
        <SmartTagInput
          tags={person.habits}
          setTags={(habits) => setPerson({ ...person, habits })}
          placeholder="Contoh: Begadang, Rapi..."
          accentColor={accent}
          suggestions={HABIT_SUGGESTIONS}
        />
      </div>

      {/* Deskripsi Opsional */}
      <div>
        <div className="section-label">📝 Deskripsi Tambahan <span className="text-text-muted/60 font-normal normal-case">(opsional)</span></div>
        <textarea
          placeholder="Ceritakan lebih tentang orang ini... misalnya zodiak, love language, dll."
          className={`w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-${accent} transition-colors resize-none h-24 text-sm`}
          value={person.description}
          onChange={e => setPerson({ ...person, description: e.target.value })}
        />
      </div>
    </div>
  );
}

// ========== PERSON MINI SUMMARY ==========
function PersonMiniSummary({ person, label }: { person: PersonData; label: string }) {
  const filled = [
    person.name && `Nama: ${person.name}`,
    person.gender && `Gender: ${person.gender === 'cowok' ? '🧑 Cowok' : '👩 Cewek'}`,
    person.personality && `Kepribadian: ${person.personality === 'Lainnya' ? person.customPersonality : person.personality}`,
    person.traits.length > 0 && `Sifat: ${person.traits.join(', ')}`,
    person.hobbies.length > 0 && `Hobi: ${person.hobbies.join(', ')}`,
    person.habits.length > 0 && `Kebiasaan: ${person.habits.join(', ')}`,
  ].filter(Boolean);

  return (
    <div className="mini-summary">
      <div className="flex items-center gap-2 mb-2">
        <UserRound className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-success ml-auto flex items-center gap-1">
          <Check className="w-3 h-3" /> Terisi
        </span>
      </div>
      <div className="space-y-0.5">
        {filled.map((item, i) => (
          <p key={i} className="text-xs text-text-muted">{item}</p>
        ))}
      </div>
    </div>
  );
}

// ========== PROGRESS BAR ==========
function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100;
  const steps = ['Pilih Mode', 'Orang 1', 'Orang 2', 'Hasil'];

  return (
    <div className="mb-6 space-y-2">
      <div className="flex justify-between items-center">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              i < current ? 'bg-primary text-white' :
              i === current ? 'bg-primary/30 text-primary border border-primary' :
              'bg-surface text-text-muted border border-white/10'
            }`}>
              {i < current ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:inline transition-colors ${
              i <= current ? 'text-text' : 'text-text-muted'
            }`}>{step}</span>
            {i < steps.length - 1 && (
              <ChevronRight className="w-3 h-3 text-text-muted/30 mx-1 hidden sm:inline" />
            )}
          </div>
        ))}
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// ========== SCORE RING COMPONENT ==========
function ScoreRing({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#8b5cf6' : score >= 40 ? '#f59e0b' : '#ef4444';

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * score);
      setDisplayScore(start);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="inline-block relative">
      <svg className="w-40 h-40 transform -rotate-90">
        <circle cx="80" cy="80" r="66" stroke="currentColor" strokeWidth="10" fill="none" className="text-surface" />
        <circle cx="80" cy="80" r="66" stroke={color} strokeWidth="10" fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: 415,
            strokeDashoffset: 415 - (415 * score) / 100,
            transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 16px ${color}80)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-4xl font-bold" style={{ color }}>{displayScore}%</span>
      </div>
    </div>
  );
}

// ========== LOADING MESSAGES ==========
const LOADING_MESSAGES = [
  'Membaca karakter kalian...',
  'Menganalisis chemistry...',
  'Menghitung kompatibilitas sifat...',
  'Mencocokkan hobi & kebiasaan...',
  'Meramal masa depan kalian...',
  'Hampir selesai...',
];

function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center flex flex-col items-center justify-center space-y-6 min-h-[400px]"
    >
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin"></div>
        <div className="absolute inset-3 rounded-full border-b-4 border-secondary animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        <div className="absolute inset-6 rounded-full border-t-4 border-amber animate-spin" style={{ animationDuration: '2s' }}></div>
        <Sparkles className="absolute inset-0 m-auto text-white w-8 h-8 animate-pulse-slow" />
      </div>
      <h2 className="text-2xl font-bold shimmer-text">
        Menganalisis Kecocokan...
      </h2>
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-text-muted"
        >
          {LOADING_MESSAGES[msgIndex]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

// ========== HISTORY TYPES ==========
interface HistoryItem {
  id: number;
  mode: string;
  personA: {
    name: string;
    gender: string;
    personality: string;
    traits: string[];
    hobbies: string[];
    habits: string[];
    description: string;
  };
  personB: {
    name: string;
    gender: string;
    personality: string;
    traits: string[];
    hobbies: string[];
    habits: string[];
    description: string;
  };
  score: number;
  badge: string;
  summary: string;
  result: AnalysisResult;
  createdAt: string;
}

// ========== HISTORY PAGE ==========
function HistoryPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [storedPassword, setStoredPassword] = useState('');

  const handleAuth = async () => {
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/history/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(true);
        setStoredPassword(password);
        fetchHistory(password);
      } else {
        setAuthError(data.error || 'Kata sandi salah.');
      }
    } catch {
      setAuthError('Gagal menghubungi server.');
    }
  };

  const fetchHistory = async (pwd: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/history?password=${encodeURIComponent(pwd)}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin hapus history ini?')) return;
    setDeletingId(id);
    try {
      await fetch(`${API_BASE}/api/history/${id}?password=${encodeURIComponent(storedPassword)}`, {
        method: 'DELETE',
      });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/15 border-success/30';
    if (score >= 60) return 'text-primary bg-primary/15 border-primary/30';
    if (score >= 40) return 'text-amber bg-amber/15 border-amber/30';
    return 'text-danger bg-danger/15 border-danger/30';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getModeEmoji = (mode: string) => {
    const found = MODE_OPTIONS.find(m => m.value === mode);
    return found ? `${found.icon} ${found.label}` : mode;
  };

  const goHome = () => {
    window.location.hash = '';
  };

  // Password Gate
  if (!authenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 glass p-8 rounded-3xl w-full max-w-md text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Akses History</h1>
          <p className="text-text-muted text-sm">Masukkan kata sandi untuk melihat riwayat analisis kecocokan.</p>

          {authError && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
              {authError}
            </div>
          )}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Kata sandi..."
              className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary transition-colors"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAuth()}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={handleAuth}
            disabled={!password}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            Masuk
          </button>

          <button onClick={goHome} className="text-sm text-text-muted hover:text-text transition-colors flex items-center justify-center gap-1 mx-auto">
            <ArrowUpLeft className="w-4 h-4" /> Kembali ke Beranda
          </button>
        </motion.div>
      </div>
    );
  }

  // History List
  return (
    <div className="min-h-screen relative overflow-hidden p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[100px] pointer-events-none" />

      <div className="z-10 relative max-w-3xl mx-auto py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
              <Clock className="w-7 h-7 text-primary" /> Riwayat Analisis
            </h1>
            <p className="text-text-muted text-sm mt-1">{history.length} hasil analisis tersimpan</p>
          </div>
          <button
            onClick={goHome}
            className="text-sm text-text-muted hover:text-text transition-colors flex items-center gap-1 bg-surface/50 px-4 py-2 rounded-xl border border-white/10 hover:border-white/20"
          >
            <ArrowUpLeft className="w-4 h-4" /> Beranda
          </button>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-t-4 border-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-muted">Memuat riwayat...</p>
          </div>
        ) : history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 glass rounded-3xl"
          >
            <Clock className="w-16 h-16 text-text-muted/30 mx-auto mb-4" />
            <p className="text-text-muted text-lg">Belum ada riwayat analisis</p>
            <p className="text-text-muted/60 text-sm mt-1">Hasil cek kecocokan akan muncul di sini</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {history.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-2xl overflow-hidden"
              >
                {/* Card Header — always visible */}
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  {/* Score Badge */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg border shrink-0 ${getScoreColor(item.score)}`}>
                    {item.score}%
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{item.personA.name}</span>
                      <Heart className="w-3 h-3 text-secondary/50" />
                      <span className="font-semibold text-white">{item.personB.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-surface/80 px-2 py-0.5 rounded-full text-text-muted">
                        {getModeEmoji(item.mode)}
                      </span>
                      <span className="text-xs text-text-muted/60">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1 truncate">"{item.badge}"</p>
                  </div>

                  {/* Expand Arrow */}
                  <ChevronDown className={`w-5 h-5 text-text-muted transition-transform duration-300 shrink-0 ${
                    expandedId === item.id ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                        {/* Summary */}
                        <div className="bg-surface/30 rounded-xl p-4">
                          <p className="text-sm text-text/80 italic">"{item.summary}"</p>
                        </div>

                        {/* Person Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3">
                            <h4 className="text-xs font-semibold text-primary mb-2">👤 {item.personA.name}</h4>
                            <div className="space-y-1 text-xs text-text-muted">
                              {item.personA.gender && <p>Gender: {item.personA.gender === 'cowok' ? '🧑 Cowok' : '👩 Cewek'}</p>}
                              {item.personA.personality && <p>Kepribadian: {item.personA.personality}</p>}
                              {item.personA.traits?.length > 0 && <p>Sifat: {item.personA.traits.join(', ')}</p>}
                              {item.personA.hobbies?.length > 0 && <p>Hobi: {item.personA.hobbies.join(', ')}</p>}
                              {item.personA.habits?.length > 0 && <p>Kebiasaan: {item.personA.habits.join(', ')}</p>}
                            </div>
                          </div>
                          <div className="bg-secondary/5 border border-secondary/10 rounded-xl p-3">
                            <h4 className="text-xs font-semibold text-secondary mb-2">👤 {item.personB.name}</h4>
                            <div className="space-y-1 text-xs text-text-muted">
                              {item.personB.gender && <p>Gender: {item.personB.gender === 'cowok' ? '🧑 Cowok' : '👩 Cewek'}</p>}
                              {item.personB.personality && <p>Kepribadian: {item.personB.personality}</p>}
                              {item.personB.traits?.length > 0 && <p>Sifat: {item.personB.traits.join(', ')}</p>}
                              {item.personB.hobbies?.length > 0 && <p>Hobi: {item.personB.hobbies.join(', ')}</p>}
                              {item.personB.habits?.length > 0 && <p>Kebiasaan: {item.personB.habits.join(', ')}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Analysis */}
                        {item.result?.analysis && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(item.result.analysis).map(([key, value]) => {
                              const labels: Record<string, { emoji: string; title: string }> = {
                                kepribadian: { emoji: '🧠', title: 'Kepribadian' },
                                sifat: { emoji: '💎', title: 'Sifat' },
                                hobi: { emoji: '🎯', title: 'Hobi' },
                                kebiasaan: { emoji: '⚡', title: 'Kebiasaan' },
                                dinamika: { emoji: '💫', title: 'Dinamika' },
                              };
                              const info = labels[key] || { emoji: '📌', title: key };
                              return (
                                <div key={key} className="bg-surface/20 rounded-lg p-3">
                                  <h5 className="text-xs font-semibold mb-1">{info.emoji} {info.title}</h5>
                                  <p className="text-xs text-text-muted leading-relaxed">{value}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Flags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {item.result?.greenFlags?.length > 0 && (
                            <div className="bg-success/5 border border-success/10 rounded-xl p-3">
                              <h4 className="text-xs font-semibold text-success mb-2">✓ Green Flags</h4>
                              <ul className="space-y-1">
                                {item.result.greenFlags.map((f, i) => (
                                  <li key={i} className="text-xs text-text-muted flex gap-1">
                                    <span className="text-success">•</span> {f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {item.result?.redFlags?.length > 0 && (
                            <div className="bg-danger/5 border border-danger/10 rounded-xl p-3">
                              <h4 className="text-xs font-semibold text-danger mb-2">⚠ Red Flags</h4>
                              <ul className="space-y-1">
                                {item.result.redFlags.map((f, i) => (
                                  <li key={i} className="text-xs text-text-muted flex gap-1">
                                    <span className="text-danger">•</span> {f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Advice */}
                        {item.result?.advice && (
                          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 rounded-xl p-3">
                            <h4 className="text-xs font-semibold mb-1">💡 Saran AI</h4>
                            <p className="text-xs text-text-muted leading-relaxed">{item.result.advice}</p>
                          </div>
                        )}

                        {/* Delete */}
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            disabled={deletingId === item.id}
                            className="text-xs text-danger/60 hover:text-danger flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== MAIN APP ==========
export default function App() {
  const [page, setPage] = useState<'main' | 'history'>(() => {
    return window.location.hash === '#/history' ? 'history' : 'main';
  });
  const [step, setStep] = useState<'welcome' | 'form' | 'loading' | 'result'>('welcome');
  const [formStep, setFormStep] = useState<FormStep>('person-1');
  const [mode, setMode] = useState<Mode>(null);
  const [personA, setPersonA] = useState<PersonData>({ ...EMPTY_PERSON });
  const [personB, setPersonB] = useState<PersonData>({ ...EMPTY_PERSON });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hash-based routing
  const handleHashChange = useCallback(() => {
    setPage(window.location.hash === '#/history' ? 'history' : 'main');
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);

  // If on history page, render HistoryPage
  if (page === 'history') {
    return <HistoryPage />;
  }

  const getProgressStep = () => {
    if (step === 'welcome') return 0;
    if (step === 'form' && formStep === 'person-1') return 1;
    if (step === 'form' && formStep === 'person-2') return 2;
    return 3;
  };

  const handleAnalyze = async () => {
    if (!personA.name || !personB.name || !mode) return;

    setStep('loading');
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, personA, personB })
      });

      if (!response.ok) {
        let errorMsg = 'Analisis gagal. Coba lagi dalam beberapa saat.';
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setResult(data);
      setStep('result');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Terjadi kesalahan sistem.');
      }
      setStep('form');
      setFormStep('person-2');
    }
  };

  const handleReset = () => {
    setResult(null);
    setPersonA({ ...EMPTY_PERSON });
    setPersonB({ ...EMPTY_PERSON });
    setMode(null);
    setStep('welcome');
    setFormStep('person-1');
  };

  const modeLabel = MODE_OPTIONS.find(m => m.value === mode)?.label || '';
  const modeIcon = MODE_OPTIONS.find(m => m.value === mode)?.icon || '';

  const canProceedToOrang2 = personA.name.trim() !== '';
  const canAnalyze = personB.name.trim() !== '';

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[100px] pointer-events-none" />
      <div className="absolute top-[50%] left-[50%] w-[20%] h-[20%] rounded-full bg-purple-500/10 blur-[80px] pointer-events-none" />

      <main className="z-10 w-full max-w-3xl">
        <AnimatePresence mode="wait">

          {/* ===== WELCOME ===== */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 mb-2 animate-pulse-slow">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                Cek Kecocokan
              </h1>
              <p className="text-text-muted text-lg max-w-lg mx-auto">
                Temukan dinamika rahasia antara kamu dan dia. AI canggih yang menganalisis kepribadian, sifat, hobi, dan kebiasaan secara mendalam.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-8">
                {MODE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setMode(opt.value); setStep('form'); setFormStep('person-1'); }}
                    className="glass hover:bg-surface-hover transition-all duration-300 p-4 rounded-2xl flex flex-col items-center gap-2 group border border-primary/10 hover:border-primary/30 hover:scale-[1.03]"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-[11px] text-text-muted leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== FORM ===== */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-6 md:p-8 rounded-3xl w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  {modeIcon} Analisis {modeLabel}
                </h2>
                <button onClick={handleReset} className="text-sm text-text-muted hover:text-text transition-colors">
                  Batal
                </button>
              </div>

              {/* Progress */}
              <ProgressBar current={getProgressStep()} total={3} />

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
                  {error}
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* PERSON 1 */}
                {formStep === 'person-1' && (
                  <motion.div
                    key="person-1"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                  >
                    <PersonForm person={personA} setPerson={setPersonA} label="Orang 1" accent="primary" />

                    <button
                      onClick={() => setFormStep('person-2')}
                      disabled={!canProceedToOrang2}
                      className="w-full mt-6 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                    >
                      Lanjut ke Orang 2 <ArrowRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}

                {/* PERSON 2 */}
                {formStep === 'person-2' && (
                  <motion.div
                    key="person-2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.25 }}
                  >
                    {/* Summary Orang 1 */}
                    <div className="mb-5">
                      <PersonMiniSummary person={personA} label="Orang 1" />
                    </div>

                    <PersonForm person={personB} setPerson={setPersonB} label="Orang 2" accent="secondary" />

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setFormStep('person-1')}
                        className="flex-1 bg-surface hover:bg-surface-hover text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/10"
                      >
                        <ArrowLeft className="w-5 h-5" /> Kembali
                      </button>
                      <button
                        onClick={handleAnalyze}
                        disabled={!canAnalyze}
                        className="flex-[2] bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                      >
                        <Sparkles className="w-5 h-5" /> Cek Kecocokan
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ===== LOADING ===== */}
          {step === 'loading' && <LoadingScreen />}

          {/* ===== RESULT ===== */}
          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 md:p-8 rounded-3xl w-full space-y-8"
            >
              {/* Score & Badge */}
              <div className="text-center stagger-item" style={{ animationDelay: '0s' }}>
                <ScoreRing score={result.score} />
                <h2 className="text-3xl font-bold mt-4 mb-2 gradient-text">
                  "{result.badge}"
                </h2>
                <div className="flex items-center justify-center gap-2 text-text-muted flex-wrap">
                  <span className="font-semibold text-white">{personA.name}</span>
                  <Heart className="w-4 h-4 text-secondary/50" />
                  <span className="font-semibold text-white">{personB.name}</span>
                  <span className="text-xs bg-surface px-2 py-0.5 rounded-full ml-2">{modeLabel}</span>
                </div>
                {result.spicinessLevel && (
                  <p className="text-sm mt-2 text-text-muted">Tingkat Kepedasan: <span className="text-secondary font-semibold">{result.spicinessLevel}</span></p>
                )}
              </div>

              {/* Ringkasan */}
              <div className="bg-surface/50 rounded-2xl p-6 border border-white/5 stagger-item" style={{ animationDelay: '0.15s' }}>
                <p className="text-lg leading-relaxed text-text italic">
                  "{result.summary}"
                </p>
              </div>

              {/* Analisis Detail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-item" style={{ animationDelay: '0.3s' }}>
                {Object.entries(result.analysis).map(([key, value]) => {
                  const labels: Record<string, { emoji: string; title: string }> = {
                    kepribadian: { emoji: '🧠', title: 'Kepribadian' },
                    sifat: { emoji: '💎', title: 'Sifat & Karakter' },
                    hobi: { emoji: '🎯', title: 'Hobi & Minat' },
                    kebiasaan: { emoji: '⚡', title: 'Kebiasaan' },
                    dinamika: { emoji: '💫', title: 'Dinamika Hubungan' },
                  };
                  const info = labels[key] || { emoji: '📌', title: key };
                  return (
                    <div key={key} className="bg-surface/30 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                      <h4 className="font-semibold mb-2 text-sm">{info.emoji} {info.title}</h4>
                      <p className="text-sm text-text-muted leading-relaxed">{value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Green & Red Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-item" style={{ animationDelay: '0.45s' }}>
                <div className="bg-success/10 border border-success/20 rounded-2xl p-6">
                  <h3 className="text-success font-semibold mb-4 flex items-center gap-2">✓ Hal Positif (Green Flags)</h3>
                  <ul className="space-y-2">
                    {result.greenFlags.map((flag, i) => (
                      <li key={i} className="text-sm text-text/80 flex items-start gap-2">
                        <span className="text-success mt-0.5">•</span> {flag}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-danger/10 border border-danger/20 rounded-2xl p-6">
                  <h3 className="text-danger font-semibold mb-4 flex items-center gap-2">⚠ Potensi Masalah (Red Flags)</h3>
                  <ul className="space-y-2">
                    {result.redFlags.map((flag, i) => (
                      <li key={i} className="text-sm text-text/80 flex items-start gap-2">
                        <span className="text-danger mt-0.5">•</span> {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Saran */}
              {result.advice && (
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-6 stagger-item" style={{ animationDelay: '0.6s' }}>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">💡 Saran dari AI</h3>
                  <p className="text-sm text-text/80 leading-relaxed">{result.advice}</p>
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full bg-surface hover:bg-surface-hover text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/10 stagger-item"
                style={{ animationDelay: '0.75s' }}
              >
                <RefreshCw className="w-5 h-5" /> Cek Pasangan Lain
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
