import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { 
  Home, CreditCard, Sparkles, Settings, ChevronRight, ChevronLeft, 
  CheckCircle2, Coffee, ShoppingCart, Bus, Utensils, Stethoscope, TrendingUp, 
  RefreshCw, Loader2, Plus, Droplet, ShoppingBag, MoreHorizontal, 
  Smartphone, Globe, Briefcase, Wifi, Monitor, Plane, Gift, History, 
  BookOpen, MapPin, Baby, Receipt, MousePointer2, Scissors, Table, Film, Ticket, Building, Cloud, HelpCircle, Send, BrainCircuit, AlertTriangle, LogIn, LogOut, CalendarDays, Trash2
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyCIvbe4vyGyEMz17A6iHw1m5VloP1jZ0No",
  authDomain: "smart-card-manager-47d8d.firebaseapp.com",
  projectId: "smart-card-manager-47d8d",
  storageBucket: "smart-card-manager-47d8d.firebasestorage.app",
  messagingSenderId: "251971688587",
  appId: "1:251971688587:web:2c55e9665af80785cadc8e"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const appId = typeof __app_id !== 'undefined' ? __app_id : 'smart-card-manager-v1';

// --- Gemini API Setup ---
const apiKey = ""; // API Key는 환경에서 제공됩니다.

const fetchGemini = async (prompt, systemInstruction) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  let delay = 1000;
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
      if (i === 4) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// --- 카드 데이터 세트 (11종 전체 데이터) ---
const INITIAL_CARDS = [
  {
    id: 1,
    name: '레이디 클래식 (Lady Classic)',
    company: '신한카드',
    type: '캐시백·할인형',
    color: 'bg-gradient-to-br from-rose-400 to-rose-600',
    textColor: 'text-white',
    target: 300000,
    lastMonthSpend: 0,
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{ tier: '30만원 이상', limit: '캐시백 5만 + 브런치 2만 + 주유 40만' }],
    detailedBenefits: [
      { id: 'lc_1', icon: <Coffee />, title: '브런치 5% 할인', desc: '11:00~14:00 요식업종', minSpend: 300000, rate: 0.05 },
      { id: 'lc_2', icon: <Stethoscope />, title: '육아/의료 5% 캐시백', desc: '학원, 서점, 병원, 약국', minSpend: 300000, rate: 0.05 },
      { id: 'lc_3', icon: <ShoppingBag />, title: '쇼핑 3% 캐시백', desc: '백화점, 마트, 온라인몰', minSpend: 300000, rate: 0.03 },
      { id: 'lc_4', icon: <Utensils />, title: '웰빙 7% 캐시백', desc: '초록마을, 한살림생협', minSpend: 300000, rate: 0.07 },
      { id: 'lc_7', icon: <Droplet />, title: 'GS칼텍스 리터당 40원 할인', desc: '주유 시 결제일 할인', minSpend: 300000, rate: 0.02 }
    ]
  },
  {
    id: 2,
    name: '탄탄대로 Biz 티타늄 (박상훈)',
    company: 'KB국민카드',
    type: '할인·적립',
    color: 'bg-[#98878F]',
    textColor: 'text-white',
    target: 400000,
    lastMonthSpend: 0,
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{ tier: '40만원↑', limit: '마트 1.5만 / 쇼핑 1.5만 / Basic 5천' }],
    detailedBenefits: [
      { id: 'tb_1_p', icon: <Droplet />, title: '주유 리터당 110점', desc: 'SK/GS칼텍스 주유소', minSpend: 400000, rate: 0.07 },
      { id: 'tb_2_p', icon: <ShoppingCart />, title: '마트 15%~20% 적립', desc: '이마트, 롯데마트, 홈플러스', minSpend: 400000, rate: 0.15 },
      { id: 'tb_3_p', icon: <ShoppingBag />, title: '온라인쇼핑몰 15%~20% 적립', desc: 'G마켓, 옥션, 11번가 등', minSpend: 400000, rate: 0.15 },
      { id: 'tb_4_p', icon: <Monitor />, title: '플러스 O2O 10% 적립', desc: '배달의민족, 마켓컬리 등', minSpend: 400000, rate: 0.1 }
    ]
  },
  {
    id: 11,
    name: '탄탄대로 Biz 티타늄 (김민정)',
    company: 'KB국민카드',
    type: '할인·적립',
    color: 'bg-[#98878F]',
    textColor: 'text-white',
    target: 400000,
    lastMonthSpend: 0,
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{ tier: '40만원↑', limit: '마트 1.5만 / 쇼핑 1.5만' }],
    detailedBenefits: [
      { id: 'tb_1_k', icon: <Droplet />, title: '주유 리터당 110점', desc: 'SK/GS칼텍스 주유소', minSpend: 400000, rate: 0.07 },
      { id: 'tb_2_k', icon: <ShoppingCart />, title: '마트 15%~20% 적립', desc: '이마트, 롯데마트, 홈플러스', minSpend: 400000, rate: 0.15 }
    ]
  },
  {
    id: 10,
    name: 'MG+ W 하나카드',
    company: '하나카드',
    type: '할인형',
    color: 'bg-gradient-to-br from-[#62A674] to-[#458C5B]',
    textColor: 'text-white',
    target: 300000,
    lastMonthSpend: 0,
    benefitSpending: {}, 
    savedAmount: 0,
    limitTable: [{ tier: '30만원 이상', limit: '통합 할인 한도 10,000원' }],
    detailedBenefits: [
      { id: 'mg_1', icon: <ShoppingBag />, title: '쇼핑 5% 청구할인', desc: '마트, 다이소, 올리브영', minSpend: 300000, rate: 0.05 },
      { id: 'mg_2', icon: <BookOpen />, title: '학원 5% 청구할인', desc: '전국 일반 학원 업종', minSpend: 300000, rate: 0.05 }
    ]
  },
  {
    id: 4,
    name: '다둥이 행복카드',
    company: '우리카드',
    type: '할인형',
    color: 'bg-gradient-to-br from-sky-400 to-blue-500',
    textColor: 'text-white',
    target: 300000, 
    lastMonthSpend: 0, 
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{ tier: '10만원 이상', limit: '교통 3천 / 마트 5천' }],
    detailedBenefits: [
      { id: 'dh_1', icon: <MapPin />, title: '공공시설 할인 (무실적)', desc: '서울시 공영주차장 등', minSpend: 0, rate: 0.3 },
      { id: 'dh_2', icon: <Bus />, title: '대중교통 10% 할인', desc: '버스, 지하철 요금 청구 할인', minSpend: 100000, rate: 0.1 }
    ]
  },
  {
    id: 6,
    name: '카드의 정석 WOWRI',
    company: '우리카드',
    type: '포인트형',
    color: 'bg-gradient-to-br from-teal-500 to-emerald-700',
    textColor: 'text-white',
    target: 300000, 
    lastMonthSpend: 0, 
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{ tier: '30만원 이상', limit: '특별 한도 1만점' }],
    detailedBenefits: [
      { id: 'wow_1', icon: <Wifi />, title: '통신/대중교통 5% 적립', desc: '자동이체 및 버스/지하철', minSpend: 300000, rate: 0.05 },
      { id: 'wow_2', icon: <Smartphone />, title: '간편결제 3% 추가 적립', desc: '네이버/카카오/PAYCO 등', minSpend: 300000, rate: 0.03 }
    ]
  },
  {
    id: 9,
    name: '카드의 정석 SHOPPING',
    company: '우리카드',
    type: '할인형',
    color: 'bg-gradient-to-br from-red-500 to-red-700',
    textColor: 'text-white',
    target: 300000, 
    lastMonthSpend: 0, 
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{ tier: '30만원 이상', limit: '온라인 4천 / 오프라인 6천' }],
    detailedBenefits: [
      { id: 'sh_1', icon: <ShoppingBag />, title: '온라인 쇼핑 10% 할인', desc: '주요 온라인 쇼핑몰', minSpend: 300000, rate: 0.1 }
    ]
  },
  {
    id: 7,
    name: 'G마켓 삼성카드',
    company: '삼성카드',
    type: '포인트형',
    color: 'bg-gradient-to-br from-green-500 to-green-700',
    textColor: 'text-white',
    target: 200000, 
    lastMonthSpend: 0, 
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{ tier: '20만원 이상', limit: '적립 1만점' }],
    detailedBenefits: [
      { id: 'gs_1', icon: <ShoppingBag />, title: 'SmilePay 10% 적립', desc: 'G마켓, 옥션 결제', minSpend: 200000, rate: 0.1 }
    ]
  },
  {
    id: 8,
    name: '원더카드 2.0 free',
    company: '하나카드',
    type: '할인형',
    color: 'bg-teal-400',
    textColor: 'text-gray-900',
    target: 0, 
    lastMonthSpend: 0, 
    benefitSpending: {}, 
    savedAmount: 0,
    limitTable: [{ tier: '무실적', limit: '할인 한도 무제한' }],
    detailedBenefits: [
      { id: 'wd_1', icon: <Globe />, title: '전가맹점 0.7% 할인', desc: '조건 없이 무제한', minSpend: 0, rate: 0.007 },
      { id: 'wd_2', icon: <Smartphone />, title: '온라인 간편결제 1.2% 할인', desc: '하나/네이버/카카오/삼성페이', minSpend: 0, rate: 0.012 }
    ]
  },
  {
    id: 3,
    name: '카카오뱅크 신한카드',
    company: '신한카드',
    type: '캐시백형',
    color: 'bg-yellow-400',
    textColor: 'text-gray-900',
    target: 0,
    lastMonthSpend: 0,
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{ tier: '무실적', limit: '최대 5만원 캐시백' }],
    detailedBenefits: [
      { id: 'kb_k1', icon: <Globe />, title: '결제횟수 캐시백', desc: '5천원 이상 결제 카운트', minSpend: 0, rate: 0.01 }
    ]
  },
  {
    id: 5,
    name: '국민 톡톡 my point',
    company: 'KB국민카드',
    type: '포인트형',
    color: 'bg-orange-500',
    textColor: 'text-white',
    target: 0,
    lastMonthSpend: 0,
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{ tier: '무실적', limit: 'KB Pay 추가 1만점' }],
    detailedBenefits: [
      { id: 'kb_tok1', icon: <Globe />, title: '기본 0.5% 적립', desc: '전 가맹점 무실적 무제한', minSpend: 0, rate: 0.005 },
      { id: 'kb_tok2', icon: <Smartphone />, title: 'KB Pay 5% 추가 적립', desc: 'KB Pay 결제 시', minSpend: 0, rate: 0.05 }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('cards');
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [selectedDetailCardId, setSelectedDetailCardId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [user, setUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [authError, setAuthError] = useState(false); // 인증 에러 처리용 상태

  // AI 관련 상태
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPickQuery, setAiPickQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [analysisReport, setAiAnalysisReport] = useState(null);

  // 월별 관리 상태
  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentMonthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const displayMonthStr = `${String(selectedDate.getFullYear()).slice(2)}년 ${selectedDate.getMonth() + 1}월`;

  // 1. Firebase 인증 및 실시간 동기화
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Init Error", err);
        setAuthError(true); // 에러 상태를 true로 변경
        
        if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
          setToastMsg('Firebase 인증 설정이 아직 완료되지 않아 로컬 모드로 작동합니다.');
        } else {
          setToastMsg('인증 초기화 실패로 로컬 모드로 작동합니다.');
        }
        setIsSyncing(false); // 동기화 로딩 화면 해제
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsSyncing(false);
    });
    return () => unsubscribe();
  }, []);

  // 구글 로그인 처리
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setToastMsg('🎉 구글 로그인 성공! 가족과 연동되었습니다.');
      setAuthError(false); // 로그인 성공 시 에러 상태 해제
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/configuration-not-found' || error.code === 'auth/operation-not-allowed') {
        setToastMsg('⚠️ Firebase 콘솔에서 Google 로그인 제공업체를 먼저 활성화해주세요.');
      } else {
        setToastMsg('구글 로그인에 실패했습니다.');
      }
    }
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setToastMsg('로그아웃 되었습니다.');
    } catch (error) {
      console.error(error);
    }
    setTimeout(() => setToastMsg(''), 2000);
  };

  // 2. 월별 데이터 구독 (Firestore)
  useEffect(() => {
    if (!user || authError) {
      setIsSyncing(false); // 인증 에러가 있거나 유저가 없으면 대기하지 않음
      return; 
    }
    
    setIsSyncing(true);
    
    // 월별 데이터를 저장하는 컬렉션 경로
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'monthly_data', currentMonthStr);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCards(prevCards => INITIAL_CARDS.map(card => {
          const cId = String(card.id);
          const savedLM = data.lastMonthSpends?.[cId] || 0;
          const savedBS = data.spendHistories?.[cId] || {};
          let newSavedAmount = 0;
          
          if (savedBS) {
            Object.entries(savedBS).forEach(([b_id, histories]) => {
              const targetBenefit = card.detailedBenefits.find(b => b.id === b_id);
              const rate = targetBenefit?.rate || 0;
              const sum = histories.reduce((s, h) => s + h.amount, 0);
              newSavedAmount += sum * rate;
            });
          }
          return {
            ...card,
            lastMonthSpend: savedLM,
            benefitSpending: savedBS,
            savedAmount: newSavedAmount
          };
        }));
      } else {
        // 해당 월에 데이터가 없으면 초기화
        setCards(INITIAL_CARDS.map(c => ({
          ...c,
          lastMonthSpend: 0,
          benefitSpending: {},
          savedAmount: 0
        })));
      }
      setIsSyncing(false);
    }, (error) => {
      console.error("Firestore Snapshot Error", error);
      setIsSyncing(false);
    });
    return () => unsubscribe();
  }, [user, currentMonthStr, authError]);

  // 클라우드 저장 로직
  const saveToCloud = async (newCards) => {
    if (authError || !user) {
      setToastMsg('⚠️ 인증 설정이 완료되지 않아 데이터가 기기에만 임시 저장됩니다.');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'monthly_data', currentMonthStr);
    const lastMonthSpends = {};
    const spendHistories = {};
    newCards.forEach(c => {
      lastMonthSpends[String(c.id)] = c.lastMonthSpend;
      spendHistories[String(c.id)] = c.benefitSpending;
    });
    try {
      await setDoc(docRef, { lastMonthSpends, spendHistories }, { merge: true });
    } catch (e) {
      console.error("Save Error", e);
    }
  };

  // 3. 월 이동 핸들러
  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  // 4. 지출 관리 및 업데이트
  const addSpending = (cardId, benefitId, amount) => {
    if (!amount || amount <= 0) return;
    const newCards = cards.map(card => {
      if (card.id === cardId) {
        const hist = card.benefitSpending[benefitId] || [];
        const newHist = [...hist, { id: Date.now(), amount: parseInt(amount), date: new Date().toLocaleDateString() }];
        const rate = card.detailedBenefits.find(b => b.id === benefitId)?.rate || 0;
        return {
          ...card,
          benefitSpending: { ...card.benefitSpending, [benefitId]: newHist },
          savedAmount: card.savedAmount + (parseInt(amount) * rate)
        };
      }
      return card;
    });
    setCards(newCards);
    saveToCloud(newCards);
    if (!authError) {
      setToastMsg('☁️ 클라우드 저장 완료');
      setTimeout(() => setToastMsg(''), 1500);
    }
  };

  // 삭제 기능 추가
  const deleteSpending = (cardId, benefitId, historyId) => {
    if(!window.confirm("이 내역을 삭제하시겠습니까?")) return;
    
    const newCards = cards.map(card => {
      if (card.id === cardId) {
        const hist = card.benefitSpending[benefitId] || [];
        const newHist = hist.filter(h => h.id !== historyId);
        const removedItem = hist.find(h => h.id === historyId);
        const rate = card.detailedBenefits.find(b => b.id === benefitId)?.rate || 0;
        
        return {
          ...card,
          benefitSpending: { ...card.benefitSpending, [benefitId]: newHist },
          savedAmount: card.savedAmount - ((removedItem?.amount || 0) * rate)
        };
      }
      return card;
    });
    setCards(newCards);
    saveToCloud(newCards);
    if (!authError) {
      setToastMsg('🗑️ 내역이 삭제되었습니다.');
      setTimeout(() => setToastMsg(''), 1500);
    }
  };

  const updateLM = (cardId, val) => {
    const newVal = parseInt(val) || 0;
    const newCards = cards.map(c => c.id === cardId ? { ...c, lastMonthSpend: newVal } : c);
    setCards(newCards);
    saveToCloud(newCards);
  };

  const formatWon = (n) => new Intl.NumberFormat('ko-KR').format(n) + '원';
  const calculateCurrentSpend = (card) => Object.values(card.benefitSpending).flat().reduce((s, i) => s + i.amount, 0);
  const totalSpendAll = cards.reduce((sum, card) => sum + calculateCurrentSpend(card), 0);
  const totalSaved = cards.reduce((sum, card) => sum + card.savedAmount, 0);

  // 5. Gemini AI 로직
  const handleSmartPick = async () => {
    if (!aiPickQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);

    const context = cards.map(c => ({
      name: c.name,
      benefits: c.detailedBenefits.map(b => ({ title: b.title, rate: b.rate })),
      spend: Object.values(c.benefitSpending).flat().reduce((s, i) => s + i.amount, 0),
      target: c.target
    }));

    try {
      const result = await fetchGemini(
        `상황: ${aiPickQuery}\n보유 카드 상황: ${JSON.stringify(context)}`,
        "대한민국 카드 전문가로서 사용자의 질문에 맞춰 가장 적합한 카드 1개를 추천하고 이유를 짧게 설명하세요. 실적 현황을 반드시 고려하세요."
      );
      setAiResponse(result);
    } catch (e) {
      setToastMsg("AI 연결 오류");
    } finally { setAiLoading(false); }
  };

  const handleAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysisReport(null);
    const summary = cards.map(c => ({ 
      name: c.name, 
      spend: Object.values(c.benefitSpending).flat().reduce((s, i) => s + i.amount, 0), 
      saved: c.savedAmount 
    }));

    try {
      const result = await fetchGemini(
        `소비 요약: ${JSON.stringify(summary)}`,
        "금융 분석가로서 이번 달 카드 지출과 받은 혜택을 분석하고, 더 효율적인 소비를 위한 팁 3가지를 한국어로 제안하세요."
      );
      setAiAnalysisReport(result);
    } catch (e) {
      setToastMsg("분석 리포트 오류");
    } finally { setAiLoading(false); }
  };

  // --- 상세 화면 컴포넌트 ---
  const CardDetail = ({ id, onClose }) => {
    const card = cards.find(c => c.id === id);
    const [lmVal, setLmVal] = useState(card?.lastMonthSpend || 0);
    
    useEffect(() => {
      setLmVal(card?.lastMonthSpend || 0);
    }, [card?.lastMonthSpend]);

    if (!card) return null;

    return (
      <div className="absolute inset-0 bg-white z-50 overflow-y-auto pb-safe animate-in slide-in-from-right duration-300">
        <header className="sticky top-0 bg-white/90 backdrop-blur px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onClose} className="p-2 -ml-2 text-gray-800"><ChevronLeft size={28}/></button>
            <h3 className="ml-2 font-black uppercase text-gray-500 text-xs tracking-widest">상세 관리</h3>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{displayMonthStr}</span>
        </header>
        
        <div className="p-6">
          <div className={`${card.color} rounded-[32px] p-6 mb-6 text-white shadow-xl`}>
            <p className="text-[10px] font-black opacity-80 mb-1">{card.company}</p>
            <h2 className="text-xl font-black mb-6 leading-tight">{card.name}</h2>
            <div className="flex justify-between items-end">
              <div><p className="text-[10px] font-black opacity-70">이번 달 사용</p><p className="text-2xl font-black">{formatWon(calculateCurrentSpend(card))}</p></div>
              <div className="text-right"><p className="text-[10px] font-black opacity-70">누적 혜택</p><p className="text-lg font-black">{formatWon(card.savedAmount)}</p></div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-5 mb-8 border border-indigo-100 shadow-inner">
            <p className="text-[11px] font-black text-indigo-400 mb-2 font-bold uppercase">직전달 실적 기입 (혜택 기준)</p>
            <div className="flex items-center space-x-3">
              <input type="number" value={lmVal} onChange={e => setLmVal(e.target.value)} onBlur={() => updateLM(id, lmVal)} className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 font-black text-indigo-700 outline-none shadow-sm"/>
              <span className="font-bold text-indigo-600">원</span>
            </div>
          </div>

          <div className="space-y-10">
            <h4 className="font-black text-lg flex items-center border-b pb-2"><Receipt size={20} className="mr-2 text-indigo-600"/> 혜택별 지출 입력</h4>
            {card.detailedBenefits.map(db => {
              const isActive = card.lastMonthSpend >= db.minSpend;
              const [amt, setAmt] = useState('');
              const hist = card.benefitSpending[db.id] || [];
              const sum = hist.reduce((s, h) => s + h.amount, 0);

              return (
                <div key={db.id} className={isActive ? "opacity-100" : "opacity-30 grayscale pointer-events-none"}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-4"><h5 className="font-black text-[15px] leading-snug">{db.title}</h5><p className="text-xs text-gray-500 mt-0.5">{db.desc}</p></div>
                    {isActive ? <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold shrink-0">적용중</span> : <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold shrink-0">{formatWon(db.minSpend)}↑ 필요</span>}
                  </div>
                  {isActive && (
                    <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-inner">
                      <div className="flex justify-between mb-3 items-center">
                        <span className="text-[10px] font-black text-gray-400">항목 합계: {formatWon(sum)}</span>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">예상 혜택: {formatWon(sum * db.rate)}</span>
                      </div>
                      
                      {/* 지출 내역 목록 및 삭제 버튼 */}
                      {hist.length > 0 && (
                        <div className="mb-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                          {hist.map(h => (
                            <div key={h.id} className="flex justify-between items-center text-xs bg-white border border-gray-200 p-2 rounded-xl">
                              <span className="text-gray-400 text-[10px]">{h.date}</span>
                              <div className="flex items-center space-x-3">
                                <span className="font-black text-gray-700">{formatWon(h.amount)}</span>
                                <button onClick={() => deleteSpending(id, db.id, h.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={16}/>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 입력창 */}
                      <div className="flex space-x-2">
                        <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="새로운 금액 입력" className="flex-1 px-4 py-2 rounded-xl text-sm border-none bg-white font-bold outline-none"/>
                        <button onClick={() => { addSpending(id, db.id, amt); setAmt(''); }} className="bg-indigo-600 text-white p-2 rounded-xl active:scale-90 transition-transform"><Plus/></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (isSyncing && !cards.length) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/><p className="font-black text-gray-400 tracking-tighter">데이터 동기화 중...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col relative shadow-2xl overflow-hidden border-x">
        {/* 인증 오류 배너 */}
        {authError && (
          <div className="bg-red-50 text-red-600 text-[11px] font-bold px-4 py-2 text-center flex justify-center items-center relative z-30">
            <AlertTriangle size={14} className="mr-1"/> Firebase 설정 전이라 데이터가 클라우드에 저장되지 않습니다.
          </div>
        )}

        <header className="px-6 pt-12 pb-4 bg-white sticky top-0 z-20 flex justify-between items-center border-b">
          <h1 className="text-xl font-black tracking-tight">Smart<span className="text-indigo-600">Card</span></h1>
          <div className="flex items-center space-x-3">
            {user?.isAnonymous || !user ? (
              <button onClick={handleGoogleLogin} className="flex items-center text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-bold hover:bg-indigo-100 transition">
                <LogIn size={12} className="mr-1"/> 가족 연동
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-gray-600">{user?.displayName?.split(' ')[0] || '사용자'}님</span>
                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500"><LogOut size={16}/></button>
              </div>
            )}
          </div>
        </header>

        {/* 월별 네비게이션 컨트롤러 */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center z-10 sticky top-[73px]">
          <button onClick={handlePrevMonth} className="p-1.5 bg-white rounded-lg shadow-sm text-gray-500 hover:text-indigo-600 active:scale-95 transition">
            <ChevronLeft size={18}/>
          </button>
          <div className="flex items-center space-x-2 text-indigo-700 font-black">
            <CalendarDays size={18}/>
            <span>{displayMonthStr}</span>
          </div>
          <button onClick={handleNextMonth} className="p-1.5 bg-white rounded-lg shadow-sm text-gray-500 hover:text-indigo-600 active:scale-95 transition">
            <ChevronRight size={18}/>
          </button>
        </div>

        <main className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar">
          {isSyncing && <div className="absolute top-32 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center z-50"><RefreshCw size={14} className="animate-spin mr-2"/>월 데이터 로딩중</div>}
          
          {activeTab === 'cards' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500 pt-4">
              <div className="flex justify-between items-end"><h2 className="text-2xl font-black">내 카드 지갑</h2><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-bold">Manage</span></div>
              <div className="space-y-4">
                {cards.map(c => {
                  const s = calculateCurrentSpend(c);
                  const met = c.target === 0 || s >= c.target;
                  return (
                    <div key={c.id} onClick={() => setSelectedDetailCardId(c.id)} className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer hover:shadow-md">
                      <div className="flex items-center space-x-4">
                        <div className={`${c.color} w-16 h-10 rounded-xl shadow-inner relative overflow-hidden`}><div className="absolute top-0 right-0 w-6 h-6 bg-white/20 rounded-full -mr-3 -mt-3 blur-md"></div></div>
                        <div className="flex-1"><p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">{c.company}</p><h3 className="font-black text-[15px] leading-tight mt-1">{c.name}</h3></div>
                        <ChevronRight className="text-gray-300"/>
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center border-gray-50">
                        <span className="text-[11px] font-black text-gray-400">이번 달 사용: {formatWon(s)}</span>
                        <span className={`text-[11px] font-black ${met ? 'text-green-500' : 'text-indigo-500'}`}>{met ? '실적 달성' : `부족 ${formatWon(c.target - s)}`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'smartPick' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500 pt-4">
              <div className="flex flex-col space-y-2 mb-4">
                <h2 className="text-2xl font-black tracking-tight">✨ AI 스마트 픽</h2>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">질문을 입력하면 AI가 실적과 혜택을 분석하여 최적의 카드를 골라줍니다.</p>
              </div>

              <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100 shadow-inner">
                <div className="flex items-center space-x-2 bg-white rounded-2xl p-2 pr-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-400 transition-all">
                  <input 
                    type="text" 
                    value={aiPickQuery} 
                    onChange={e => setAiPickQuery(e.target.value)} 
                    placeholder="예: 오늘 점심 먹으러 갈 건데 뭐 쓸까?" 
                    className="flex-1 px-4 py-2 text-sm border-none bg-transparent outline-none font-medium"
                    onKeyPress={e => e.key === 'Enter' && handleSmartPick()}
                  />
                  <button onClick={handleSmartPick} disabled={aiLoading} className="bg-indigo-600 text-white p-2 rounded-xl disabled:opacity-50 transition-all active:scale-90">
                    {aiLoading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                  </button>
                </div>
              </div>

              {aiResponse && (
                <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-lg animate-in zoom-in duration-300">
                  <div className="flex items-center space-x-2 mb-4"><BrainCircuit className="text-indigo-600" size={24}/><h3 className="font-black text-gray-800">AI 추천 결과</h3></div>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium markdown-body">{aiResponse}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pt-4">
              <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <p className="text-[10px] font-black uppercase opacity-70 mb-2 tracking-widest">{displayMonthStr} Report</p>
                <p className="text-[10px] font-bold opacity-60">통합 총 지출액</p>
                <h3 className="text-4xl font-black mb-6 tracking-tight mt-1">{formatWon(totalSpendAll)}</h3>
                <div className="flex items-center bg-white/20 w-fit px-4 py-2 rounded-2xl backdrop-blur-md border border-white/20">
                  <TrendingUp size={18} className="mr-2"/><span className="text-sm font-black">누적 혜택: {formatWon(totalSaved)}</span>
                </div>
              </div>

              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black flex items-center text-gray-800 tracking-tight">✨ AI 소비 습관 분석</h3>
                  <button onClick={handleAnalysis} disabled={aiLoading} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center hover:bg-indigo-100 transition-colors">
                    {aiLoading ? <Loader2 className="animate-spin mr-1" size={14}/> : <RefreshCw className="mr-1" size={14}/>}리포트 생성
                  </button>
                </div>
                {analysisReport && (
                  <div className="text-sm text-gray-700 leading-relaxed font-medium bg-gray-50 p-5 rounded-2xl whitespace-pre-wrap animate-in fade-in duration-700 markdown-body">{analysisReport}</div>
                )}
              </div>
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 max-w-md w-full bg-white/95 backdrop-blur-lg border-t px-10 py-4 flex justify-between items-center pb-safe z-30 shadow-2xl">
          <button onClick={() => setActiveTab('cards')} className={`flex flex-col items-center transition-all ${activeTab === 'cards' ? 'text-indigo-600 scale-110' : 'text-gray-300'}`}><CreditCard/><span className="text-[10px] font-black mt-1 uppercase tracking-tighter">WALLET</span></button>
          <button onClick={() => setActiveTab('smartPick')} className="flex flex-col items-center -mt-10 group"><div className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 group-active:scale-90 ${activeTab === 'smartPick' ? 'bg-indigo-700' : 'bg-indigo-600'}`}><Sparkles size={28}/></div><span className={`text-[10px] font-black mt-1 uppercase tracking-tighter ${activeTab === 'smartPick' ? 'text-indigo-700' : 'text-indigo-600'}`}>SMART</span></button>
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center transition-all ${activeTab === 'home' ? 'text-indigo-600 scale-110' : 'text-gray-300'}`}><Home/><span className="text-[10px] font-black mt-1 uppercase tracking-tighter">REPORT</span></button>
        </nav>

        {selectedDetailCardId && <CardDetail id={selectedDetailCardId} onClose={() => setSelectedDetailCardId(null)}/>}
        {toastMsg && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl text-xs font-bold shadow-2xl z-50 animate-in slide-in-from-bottom-4 text-center leading-relaxed">{toastMsg}</div>}
      </div>
      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        body { -webkit-tap-highlight-color: transparent; }
        input:focus { outline: none; }
        .markdown-body ul { list-style-type: disc; padding-left: 20px; margin-top: 10px; }
        .markdown-body b { font-weight: 800; }
        .markdown-body p { margin-bottom: 10px; }
      `}</style>
    </div>
  );
}
