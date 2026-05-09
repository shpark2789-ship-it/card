import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Home, CreditCard, Sparkles, Settings, ChevronRight, ChevronLeft, 
  CheckCircle2, Coffee, ShoppingCart, Bus, Utensils, Stethoscope, TrendingUp, 
  RefreshCw, Loader2, Plus, Droplet, ShoppingBag, MoreHorizontal, 
  Smartphone, Globe, Briefcase, Wifi, Monitor, Plane, Gift, History, 
  BookOpen, MapPin, Baby, Receipt, MousePointer2, Scissors, Table, Film, Ticket, Building, Cloud, HelpCircle, Send, BrainCircuit, AlertTriangle, CalendarDays, Trash2
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
googleProvider.setCustomParameters({ prompt: 'select_account' });

const appId = typeof __app_id !== 'undefined' ? __app_id : 'smart-card-manager-v1';

// --- Gemini API Setup ---
const apiKey = ""; 

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

// --- 카드 데이터 세트 (12종 - 데이터 유실 0% 완벽 복구 버전) ---
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
    limitTable: [{"tier": "30만원 이상", "limit": "캐시백 5만 + 브런치 2만 + 주유 40만(대상액)"}],
    detailedBenefits: [
      { id: 'lc_1', icon: <Coffee />, title: '브런치 5% 결제일 할인', desc: '오전 11시 ~ 오후 2시 요식업종', minSpend: 300000, rate: 0.05, extendedDesc: '제과점, 한/중/양/일식, 커피 포함 (월 2만원 한도)' },
      { id: 'lc_2', icon: <Stethoscope />, title: '육아/의료 5% 캐시백', desc: '학원, 서점, 병원, 약국', minSpend: 300000, rate: 0.05, extendedDesc: '치과/한의원 포함, 월 5만원 한도 (학원은 오프라인만)' },
      { id: 'lc_3', icon: <ShoppingBag />, title: '쇼핑 3% 캐시백', desc: '백화점, 대형마트, 온라인몰', minSpend: 300000, rate: 0.03, extendedDesc: '이마트/홈플/롯데마트(창고형 제외), 옥션/G마켓/SSG 등' },
      { id: 'lc_4', icon: <Utensils />, title: '웰빙 7% 캐시백', desc: '초록마을, 한살림생협 매장', minSpend: 300000, rate: 0.07, extendedDesc: '오프라인 매장 결제 시 적용' },
      { id: 'lc_5', icon: <Gift />, title: '던킨도너츠 3,500원 할인', desc: '6,000원 이상 결제 시 적용', minSpend: 300000, rate: 0.5, extendedDesc: '월 1회 제공' },
      { id: 'lc_6', icon: <Film />, title: '롯데시네마 스위트콤보 무료', desc: '현장 카드 제시 시 제공', minSpend: 300000, rate: 0, extendedDesc: '팝콘(대)1 + 음료(중)2, 월 1회' },
      { id: 'lc_7', icon: <Droplet />, title: 'GS칼텍스 리터당 40원 할인', desc: '주유 시 결제일 할인', minSpend: 300000, rate: 0.02, extendedDesc: '월 이용금액 40만원 한도 내' },
      { id: 'lc_8', icon: <Plane />, title: '제주 JDC 면세점 8% 할인', desc: '면세점 결제일 할인', minSpend: 300000, rate: 0.08, extendedDesc: '30만 이상 8천원 / 60만 이상 3.2만원 한도' }
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
    limitTable: [{"tier": "40만원 이상", "limit": "마트 1.5만 / 쇼핑 1.5만 / Basic 5천"}, {"tier": "80만원 이상", "limit": "마트 2만 / 쇼핑 2만 / Basic 5천"}],
    detailedBenefits: [
      { id: 'tb_1_p', icon: <Droplet />, title: '주유 리터당 110점 적립', desc: 'SK/GS칼텍스 주유소 및 충전소', minSpend: 400000, rate: 0.07, extendedDesc: '월 이용액 20만(40만 이상)/30만(80만 이상) 한도' },
      { id: 'tb_2_p', icon: <ShoppingCart />, title: '마트 15%~20% 적립', desc: '이마트, 롯데마트, 홈플러스 등', minSpend: 400000, rate: 0.15, extendedDesc: '40만 이상 15%(1.5만) / 80만 이상 20%(2만)' },
      { id: 'tb_3_p', icon: <ShoppingBag />, title: '온라인쇼핑몰 15%~20% 적립', desc: 'G마켓, 옥션, 11번가, 인터파크 등', minSpend: 400000, rate: 0.15, extendedDesc: '40만 이상 15% / 80만 이상 20% 한도 동일' },
      { id: 'tb_4_p', icon: <Monitor />, title: '온라인몰 (플러스 O2O) 10%', desc: '배달의민족, 마켓컬리, 그린카 등', minSpend: 400000, rate: 0.1, extendedDesc: 'KB Pay 앱 내 [플러스 O2O] 메뉴 경유 필수, 월 1만점' },
      { id: 'tb_5_p', icon: <Wifi />, title: '통신/사회보험 10% 적립', desc: '4대보험 및 휴대폰 요금', minSpend: 400000, rate: 0.1, extendedDesc: '건강/국민/고용/산재 자동납부 건 (월 1만점)' },
      { id: 'tb_6_p', icon: <Briefcase />, title: '가맹점 운영지원 10% 할인', desc: '정수기렌탈, 보안, 문구 등', minSpend: 400000, rate: 0.1, extendedDesc: '코웨이, 청호나이스, SK매직, 에스원 등' },
      { id: 'tb_7_p', icon: <Receipt />, title: '마이비즈 (My Biz) 서비스', desc: '전자세금계산서 무료 발행 등', minSpend: 0, rate: 0, extendedDesc: '부가세 환급예상액 조회 및 세무지원' },
      { id: 'tb_8_p', icon: <Plane />, title: '티타늄 서비스 (라운지/발레)', desc: '공항 라운지 및 발레파킹', minSpend: 300000, rate: 0, extendedDesc: '마티나/스카이허브 연 2회, 발레파킹 월 3회' }
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
    limitTable: [{"tier": "40만원 이상", "limit": "마트 1.5만 / 쇼핑 1.5만 / Basic 5천"}, {"tier": "80만원 이상", "limit": "마트 2만 / 쇼핑 2만 / Basic 5천"}],
    detailedBenefits: [
      { id: 'tb_1_k', icon: <Droplet />, title: '주유 리터당 110점 적립', desc: 'SK/GS칼텍스 주유소 및 충전소', minSpend: 400000, rate: 0.07, extendedDesc: '월 이용액 20만(40만 이상)/30만(80만 이상) 한도' },
      { id: 'tb_2_k', icon: <ShoppingCart />, title: '마트 15%~20% 적립', desc: '이마트, 롯데마트, 홈플러스 등', minSpend: 400000, rate: 0.15, extendedDesc: '40만 이상 15%(1.5만) / 80만 이상 20%(2만)' },
      { id: 'tb_3_k', icon: <ShoppingBag
