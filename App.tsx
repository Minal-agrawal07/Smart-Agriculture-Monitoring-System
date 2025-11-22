import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Upload, 
  History as HistoryIcon, 
  LogOut, 
  Sprout, 
  Mountain, 
  Save, 
  Trash2, 
  ChevronLeft, 
  Loader2,
  Languages,
  Thermometer,
  Cloud
} from 'lucide-react';
import { AnalysisType, Language, User, AnalysisResult, WeatherData, HistoryItem } from './types';
import { TRANSLATIONS } from './constants';
import { analyzeImage } from './services/geminiService';
import { getCurrentWeather } from './services/weatherService';
import { authService, historyService } from './services/storageService';

// --- Components ---

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }> = ({ 
  className = '', 
  variant = 'primary', 
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
  const variants = {
    primary: "bg-agri-600 text-white hover:bg-agri-700 shadow-md shadow-agri-200",
    secondary: "bg-white text-agri-700 border border-agri-200 hover:bg-agri-50",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    outline: "border-2 border-agri-600 text-agri-600 hover:bg-agri-50"
  };

  return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props} />;
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

// --- Pages ---

const AuthPage: React.FC<{ onLogin: (u: User) => void; language: Language; setLanguage: (l: Language) => void }> = ({ onLogin, language, setLanguage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const t = TRANSLATIONS[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
      const user = authService.login(phone, password);
      if (user) onLogin(user);
      else setError("Invalid credentials");
    } else {
      const success = authService.signup(phone, password);
      if (success) {
        const user = authService.login(phone, password);
        if (user) onLogin(user);
      } else {
        setError("User already exists");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-agri-50 to-agri-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-agri-900">AgriScan</h1>
          <button 
            onClick={() => setLanguage(language === Language.ENGLISH ? Language.HINDI : Language.ENGLISH)}
            className="text-agri-600 hover:bg-agri-50 p-2 rounded-full"
          >
            <Languages size={20} />
          </button>
        </div>
        
        <h2 className="text-xl font-semibold mb-6">{isLogin ? t.loginTitle : t.signupTitle}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.phoneLabel}</label>
            <input 
              type="tel" 
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-agri-500 outline-none"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.passwordLabel}</label>
            <input 
              type="password" 
              required
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-agri-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <Button type="submit" className="w-full">
            {isLogin ? t.loginBtn : t.signupBtn}
          </Button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="w-full mt-4 text-sm text-agri-600 hover:underline"
        >
          {isLogin ? t.switchSignup : t.switchLogin}
        </button>
      </Card>
    </div>
  );
};

const Dashboard: React.FC<{ language: Language }> = ({ language }) => {
  const t = TRANSLATIONS[language];
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-agri-900">{t.dashboard}</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/analyze/crop" className="block group">
          <Card className="h-full transition-transform hover:-translate-y-1 hover:shadow-xl">
            <div className="h-40 bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Sprout size={64} className="text-agri-600" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t.cropAnalysis}</h3>
              <p className="text-gray-600">{t.cropDesc}</p>
            </div>
          </Card>
        </Link>

        <Link to="/analyze/soil" className="block group">
          <Card className="h-full transition-transform hover:-translate-y-1 hover:shadow-xl">
            <div className="h-40 bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <Mountain size={64} className="text-soil-700" />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t.soilAnalysis}</h3>
              <p className="text-gray-600">{t.soilDesc}</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};

const Analyzer: React.FC<{ type: AnalysisType; language: Language; user: User }> = ({ type, language, user }) => {
  const t = TRANSLATIONS[language];
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentWeather().then(setWeather);
  }, []);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert(t.cameraError);
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const data = canvas.toDataURL('image/jpeg', 0.8);
      
      // Stop stream
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      
      setImage(data);
      setShowCamera(false);
      setResult(null); // Reset prev result
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    try {
      const base64Data = image.split(',')[1];
      const weatherStr = weather ? `${weather.temperature}°C, ${weather.description}` : undefined;
      const res = await analyzeImage(base64Data, type, language, weatherStr);
      setResult({ ...res, weatherContext: weatherStr });
    } catch (err) {
      alert("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const saveToHistory = () => {
    if (!result || !image) return;
    
    // Create thumbnail
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_SIZE = 150;
      let w = img.width;
      let h = img.height;
      if (w > h) { h *= MAX_SIZE / w; w = MAX_SIZE; }
      else { w *= MAX_SIZE / h; h = MAX_SIZE; }
      
      canvas.width = w;
      canvas.height = h;
      ctx?.drawImage(img, 0, 0, w, h);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);

      const item: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        type,
        imageThumbnail: thumbnail,
        result
      };
      
      historyService.saveItem(user.phone, item);
      alert(t.savedSuccess);
    };
    img.src = image;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {type === AnalysisType.CROP ? t.cropAnalysis : t.soilAnalysis}
        </h1>
      </div>

      {/* Weather Widget */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-center gap-3">
          <Cloud className="text-blue-500" />
          <div>
            <p className="text-sm text-gray-500 font-medium">{t.weather}</p>
            {weather ? (
              <p className="font-semibold text-lg flex items-center gap-2">
                <Thermometer size={16} />
                {weather.temperature}°C — {weather.description}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">{t.weatherError}</p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="p-4 min-h-[300px] flex flex-col items-center justify-center relative bg-gray-50 border-dashed border-2 border-gray-300">
            {showCamera ? (
              <div className="absolute inset-0 bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button 
                  onClick={capturePhoto} 
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-agri-500 shadow-lg"
                />
              </div>
            ) : image ? (
              <img src={image} alt="Analysis Target" className="max-h-[400px] w-full object-contain rounded-lg" />
            ) : (
              <div className="text-center p-6">
                <Sprout size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">{t.selectImage}</p>
              </div>
            )}
          </Card>

          {!showCamera && (
            <div className="flex gap-4 justify-center">
              <Button onClick={startCamera} variant="outline">
                <Camera size={20} /> {t.takePhoto}
              </Button>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <div className="px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-white text-agri-700 border border-agri-200 hover:bg-agri-50 shadow-sm active:scale-95">
                  <Upload size={20} /> {t.uploadPhoto}
                </div>
              </label>
            </div>
          )}

          {image && !analyzing && !result && (
            <Button onClick={handleAnalyze} className="w-full py-3 text-lg">
              {t.analyzeBtn}
            </Button>
          )}
          
          {analyzing && (
            <Button disabled className="w-full py-3 opacity-75">
              <Loader2 className="animate-spin" /> {t.analyzing}
            </Button>
          )}
        </div>

        {/* Results Area */}
        <div className="space-y-4">
          {result && (
            <Card className="p-6 h-full animate-fade-in bg-white/80 backdrop-blur">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-agri-800 mb-2 border-b pb-2">{t.condition}</h3>
                <p className="text-gray-700 leading-relaxed">{result.condition}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-agri-800 mb-2 border-b pb-2">{t.recommendations}</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-agri-800 mb-2 border-b pb-2">{t.actions}</h3>
                <ul className="list-decimal pl-5 space-y-2 text-gray-700">
                  {result.nextActions.map((act, i) => <li key={i}>{act}</li>)}
                </ul>
              </div>

              <Button onClick={saveToHistory} className="w-full">
                <Save size={20} /> {t.save}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const History: React.FC<{ user: User; language: Language }> = ({ user, language }) => {
  const t = TRANSLATIONS[language];
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(historyService.getItems(user.phone));
  }, [user.phone]);

  const handleDelete = (id: string) => {
    if (window.confirm(t.confirmDelete)) {
      historyService.deleteItem(user.phone, id);
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">{t.history}</h1>
      
      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed">
          <p>{t.noHistory}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <Card key={item.id} className="p-4 flex flex-col md:flex-row gap-4 items-start">
              <img src={item.imageThumbnail} alt="Thumbnail" className="w-24 h-24 object-cover rounded-lg bg-gray-100 flex-shrink-0" />
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.type === AnalysisType.CROP ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <h4 className="font-semibold mt-1 text-gray-800">{item.result.condition.substring(0, 50)}...</h4>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Rec:</strong> {item.result.recommendations[0]}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Layout ---

const Layout: React.FC<{ 
  children: React.ReactNode; 
  user: User; 
  language: Language;
  onLogout: () => void;
  setLanguage: (l: Language) => void;
}> = ({ children, user, language, onLogout, setLanguage }) => {
  const t = TRANSLATIONS[language];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-agri-600 flex items-center gap-2">
            <Sprout /> AgriScan
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-agri-600 font-medium">{t.dashboard}</Link>
            <Link to="/history" className="text-gray-600 hover:text-agri-600 font-medium">{t.history}</Link>
            <div className="h-6 w-px bg-gray-200"></div>
            <button 
              onClick={() => setLanguage(language === Language.ENGLISH ? Language.HINDI : Language.ENGLISH)}
              className="text-gray-600 hover:bg-gray-100 p-2 rounded-full"
            >
              <Languages size={20} />
            </button>
            <Button onClick={onLogout} variant="secondary" className="text-sm">
              <LogOut size={16} /> {t.logout}
            </Button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around md:hidden z-40 pb-safe">
        <Link to="/" className="flex flex-col items-center p-2 text-agri-600">
          <Sprout size={24} />
          <span className="text-xs mt-1">{t.dashboard}</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center p-2 text-gray-500 hover:text-agri-600">
          <HistoryIcon size={24} />
          <span className="text-xs mt-1">{t.history}</span>
        </Link>
        <button onClick={() => setLanguage(language === Language.ENGLISH ? Language.HINDI : Language.ENGLISH)} className="flex flex-col items-center p-2 text-gray-500 hover:text-agri-600">
          <Languages size={24} />
          <span className="text-xs mt-1">Lang</span>
        </button>
        <button onClick={onLogout} className="flex flex-col items-center p-2 text-gray-500 hover:text-red-500">
          <LogOut size={24} />
          <span className="text-xs mt-1">{t.logout}</span>
        </button>
      </div>
    </div>
  );
};

// --- Main App Logic ---

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth
    const currentUser = authService.getCurrentUser();
    if (currentUser) setUser(currentUser);
    setLoading(false);
  }, []);

  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-agri-600" size={40} /></div>;

  if (!user) {
    return <AuthPage onLogin={handleLogin} language={language} setLanguage={setLanguage} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout} language={language} setLanguage={setLanguage}>
        <Routes>
          <Route path="/" element={<Dashboard language={language} />} />
          <Route path="/analyze/crop" element={<Analyzer type={AnalysisType.CROP} language={language} user={user} />} />
          <Route path="/analyze/soil" element={<Analyzer type={AnalysisType.SOIL} language={language} user={user} />} />
          <Route path="/history" element={<History user={user} language={language} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default AppContent;