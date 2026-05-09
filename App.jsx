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

// --- 카드 데이터 세트 (12종 - 다둥이 카드 10개 혜택 완벽 복구본) ---
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
      { id: 'tb_3_k', icon: <ShoppingBag />, title: '온라인쇼핑몰 15%~20% 적립', desc: 'G마켓, 옥션, 11번가, 인터파크 등', minSpend: 400000, rate: 0.15, extendedDesc: '40만 이상 15% / 80만 이상 20% 한도 동일' },
      { id: 'tb_4_k', icon: <Monitor />, title: '온라인몰 (플러스 O2O) 10%', desc: '배달의민족, 마켓컬리, 그린카 등', minSpend: 400000, rate: 0.1, extendedDesc: 'KB Pay 앱 내 [플러스 O2O] 메뉴 경유 필수, 월 1만점' },
      { id: 'tb_5_k', icon: <Wifi />, title: '통신/사회보험 10% 적립', desc: '4대보험 및 휴대폰 요금', minSpend: 400000, rate: 0.1, extendedDesc: '건강/국민/고용/산재 자동납부 건 (월 1만점)' },
      { id: 'tb_6_k', icon: <Briefcase />, title: '가맹점 운영지원 10% 할인', desc: '정수기렌탈, 보안, 문구 등', minSpend: 400000, rate: 0.1, extendedDesc: '코웨이, 청호나이스, SK매직, 에스원 등' },
      { id: 'tb_7_k', icon: <Receipt />, title: '마이비즈 (My Biz) 서비스', desc: '전자세금계산서 무료 발행 등', minSpend: 0, rate: 0, extendedDesc: '부가세 환급예상액 조회 및 세무지원' },
      { id: 'tb_8_k', icon: <Plane />, title: '티타늄 서비스 (라운지/발레)', desc: '공항 라운지 및 발레파킹', minSpend: 300000, rate: 0, extendedDesc: '마티나/스카이허브 연 2회, 발레파킹 월 3회' }
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
    limitTable: [{"tier": "30만원 이상", "limit": "통합 할인 한도 10,000원"}, {"tier": "60만원 이상", "limit": "통합 할인 한도 20,000원"}, {"tier": "100만원 이상", "limit": "통합 할인 한도 40,000원"}],
    detailedBenefits: [
      { id: 'mg_1', icon: <ShoppingBag />, title: '쇼핑 5% 청구할인', desc: '마트, 홈쇼핑, 다이소, 올리브영', minSpend: 300000, rate: 0.05, extendedDesc: '이마트/롯데/홈플 (오프라인), GS/롯데/현대 등 홈쇼핑' },
      { id: 'mg_2', icon: <BookOpen />, title: '학원 5% 청구할인', desc: '전국 일반 학원 업종', minSpend: 300000, rate: 0.05, extendedDesc: '입시/보습, 예체능, 외국어학원 등 오프라인 결제' },
      { id: 'mg_3', icon: <Stethoscope />, title: '병원/약국 5% 청구할인', desc: '전국 모든 병원 및 약국', minSpend: 300000, rate: 0.05, extendedDesc: '종합/일반/한방/치과 등 모든 병원 포함' },
      { id: 'mg_4', icon: <Ticket />, title: '여가생활 5% 청구할인', desc: '골프, 헬스, 헤어샵 등', minSpend: 300000, rate: 0.05, extendedDesc: '당구장, 스포츠용품 포함 (공립 기관 제외)' },
      { id: 'mg_5', icon: <Building />, title: '새마을금고 수수료 면제', desc: 'ATM 출금 및 타행 이체', minSpend: 300000, rate: 0, extendedDesc: 'ATM 출금 무제한, 타행 이체 월 10회' }
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
    limitTable: [
      {"tier": "10만원 이상", "limit": "교통 3~5천 / GS주유 / 영화 / 놀이공원 / 마트·병원 5% / 학원 10%"},
      {"tier": "20만원 이상", "limit": "패밀리레스토랑 20% 추가"},
      {"tier": "30만원 이상", "limit": "스타벅스 20% 추가"}
    ],
    detailedBenefits: [
      { id: 'dh_1', icon: <MapPin />, title: '공공시설 30~50% 할인', desc: '공영주차장, 박물관, 남산터널 등', minSpend: 0, rate: 0.3, extendedDesc: '실적 조건 없음 (서울시 협력 가맹점)' },
      { id: 'dh_2', icon: <Bus />, title: '대중교통 10% 할인', desc: '버스, 지하철 요금', minSpend: 100000, rate: 0.1, extendedDesc: '전월 10만 이상 시 자녀수별 3~5천원 한도' },
      { id: 'dh_3', icon: <Utensils />, title: '패밀리레스토랑 20% 할인', desc: '아웃백, 생어거스틴, 감성타코', minSpend: 200000, rate: 0.2, extendedDesc: '전월 20만 이상 시 적용 (건당 최대 2만원 할인)' },
      { id: 'dh_4', icon: <Coffee />, title: '스타벅스 20% 할인', desc: '스타벅스 전 매장', minSpend: 300000, rate: 0.2, extendedDesc: '전월 30만 이상 시 적용 (월 2회, 최대 5천원 한도)' },
      { id: 'dh_5', icon: <Droplet />, title: 'GS칼텍스 리터당 50~70원 할인', desc: '주유 시 자녀 수 차등 할인', minSpend: 100000, rate: 0.03, extendedDesc: '최근 3개월 30만(월 10만) 이상 시 / 전월 100만 이상 시 80원' },
      { id: 'dh_6', icon: <Ticket />, title: '놀이공원 50% 할인', desc: '에버랜드, 롯데월드, 서울랜드', minSpend: 100000, rate: 0.5, extendedDesc: '최근 3개월 30만(월 10만) 이상 시 (통합 월 1회, 연 10회)' },
      { id: 'dh_7', icon: <Film />, title: '영화관 2~4천원 할인', desc: 'CGV, 롯데시네마, 메가박스', minSpend: 100000, rate: 0.1, extendedDesc: '최근 3개월 30만 이상 시 (월 2회, 자녀수 차등)' },
      { id: 'dh_8', icon: <ShoppingCart />, title: '대형마트/병원/서점 5% 할인', desc: '이마트, 홈플러스, 롯데마트, 병의원 등', minSpend: 100000, rate: 0.05, extendedDesc: '최근 3개월 30만 이상 시 (특별할인 월 1회 통합 한도 내)' },
      { id: 'dh_9', icon: <BookOpen />, title: '학원/미용실 10% 할인', desc: '전국 학원 및 미용실 업종', minSpend: 100000, rate: 0.1, extendedDesc: '최근 3개월 30만 이상 시 (특별할인 월 1회 통합 한도 내)' },
      { id: 'dh_10', icon: <Smartphone />, title: '통신요금 최대 1천원 할인', desc: '자동납부 건당 500원 할인', minSpend: 0, rate: 0.01, extendedDesc: '자동납부 2건 이상 시 최대 1,000원 할인' }
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
    limitTable: [{"tier": "30만원 이상", "limit": "특별/추가 한도 1만점 (기본 무제한)"}, {"tier": "60만원 이상", "limit": "특별/추가 한도 2만점 (기본 무제한)"}, {"tier": "120만원 이상", "limit": "특별/추가 한도 5만점 (기본 무제한)"}],
    detailedBenefits: [
      { id: 'wow_1', icon: <Globe />, title: '국내 전 가맹점 0.8% 적립', desc: '특별적립 가맹점 외 모든 국내 결제', minSpend: 300000, rate: 0.008, extendedDesc: '기본 적립은 한도 제한 없이 무제한 적립' },
      { id: 'wow_2', icon: <Bus />, title: '통신/교통/전기차 5% 적립', desc: '이동통신, 대중교통, 전기차 충전', minSpend: 300000, rate: 0.05, extendedDesc: 'SKT, KT, LGU+, 알뜰폰 자동이체 / 버스, 지하철 / 전기차 급속충전' },
      { id: 'wow_3', icon: <Smartphone />, title: '주요 간편결제 3% 추가 적립', desc: '네이버/카카오/PAYCO/SSGPAY', minSpend: 300000, rate: 0.03, extendedDesc: '온/오프라인 모두 적용, 기본/특별 적립과 중복 적용' },
      { id: 'wow_4', icon: <Film />, title: '커피/영화 3% 적립', desc: '스타벅스, 엔제리너스, 이디야 / CGV, 롯데시네마', minSpend: 300000, rate: 0.03, extendedDesc: '커피는 백화점/마트 입점 매장 제외, 영화는 예매 대행사이트 제외' },
      { id: 'wow_5', icon: <ShoppingCart />, title: '쇼핑/주유/면세/해외 1% 적립', desc: '백화점, 대형할인점, 온라인쇼핑, 주유 등', minSpend: 300000, rate: 0.01, extendedDesc: '신세계/현대/롯데백화점, 이마트/홈플/롯데마트, 11번가/G마켓/쿠팡 등, SK/GS/현대/S-OIL 주유소' }
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
    limitTable: [{"tier": "30만원 이상", "limit": "온라인 4천 / 오프라인 6천"}, {"tier": "70만원 이상", "limit": "온라인 8천 / 오프라인 1.2만"}, {"tier": "120만원 이상", "limit": "온라인 1.6만 / 오프라인 2.4만"}],
    detailedBenefits: [
      { id: 'sh_1', icon: <Monitor />, title: '온라인 쇼핑 10% + 5% 할인', desc: '쿠팡, G마켓 등 + 간편결제 시 추가', minSpend: 300000, rate: 0.15, extendedDesc: '온라인 쇼핑 10% + 4대 PAY 온라인 결제 시 총 15% 할인' },
      { id: 'sh_2', icon: <ShoppingBag />, title: '오프라인 쇼핑 10% 할인', desc: '백화점, 마트, 아울렛, 편의점', minSpend: 300000, rate: 0.1, extendedDesc: '트레이더스, 이케아, 올리브영, 다이소 포함' },
      { id: 'sh_3', icon: <Droplet />, title: '주말 주유 리터당 60원 할인', desc: '4대 주유소 (LPG 제외)', minSpend: 300000, rate: 0.04, extendedDesc: '토/일요일 결제 건에 한해 적용' },
      { id: 'sh_4', icon: <Coffee />, title: '스타벅스/폴바셋 10% 할인', desc: '커피 전문점 청구 할인', minSpend: 300000, rate: 0.1, extendedDesc: '월 5,000원 할인 한도' }
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
    limitTable: [{"tier": "20만원 이상", "limit": "적립한도 1만점 / 커피/교통 각 5천"}, {"tier": "50만원 이상", "limit": "적립한도 2만점 / 커피/교통 각 5천"}, {"tier": "100만원 이상", "limit": "적립한도 3만점 / 커피/교통 각 5천"}],
    detailedBenefits: [
      { id: 'gs_1', icon: <ShoppingCart />, title: 'SmilePay 기본적립 (무실적)', desc: 'G마켓, 옥션 결제 시 1% 적립', minSpend: 0, rate: 0.01, extendedDesc: '무제한 적립 (일반 결제 시 0.5%)' },
      { id: 'gs_2', icon: <Sparkles />, title: 'SmilePay 10% 특별적립', desc: 'G마켓, 옥션 스마일페이 결제 시', minSpend: 200000, rate: 0.1, extendedDesc: '한도: 1만(20만 이상), 2만(50만 이상), 3만(100만 이상)' },
      { id: 'gs_3', icon: <Coffee />, title: '커피전문점 20% 할인', desc: '스타벅스, 이디야, 투썸플레이스', minSpend: 200000, rate: 0.2, extendedDesc: '통합 월 할인 한도 5,000원' },
      { id: 'gs_4', icon: <Bus />, title: '대중교통 8% 할인', desc: '버스, 지하철 청구 할인', minSpend: 200000, rate: 0.08, extendedDesc: '통합 월 할인 한도 5,000원' }
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
    limitTable: [{"tier": "무실적", "limit": "생활영역 통합 5만원 (기본/간편결제 무제한)"}],
    detailedBenefits: [
      { id: 'wd_1', icon: <Globe />, title: '전가맹점 0.7% 청구할인', desc: '국내·외 모든 결제 시', minSpend: 0, rate: 0.007, extendedDesc: '전월 실적 없음 / 혜택 한도 없음' },
      { id: 'wd_2', icon: <Smartphone />, title: '간편결제 1.2% 청구할인', desc: '하나Pay, 삼성/네이버/카카오페이 등', minSpend: 0, rate: 0.012, extendedDesc: 'SSG/페이코/쿠페이/SK pay 온라인 결제 (무실적/무제한)' },
      { id: 'wd_3', icon: <Coffee />, title: '베이커리 2.0% 청구할인', desc: '파리바게뜨, 뚜레쥬르, 던킨 등', minSpend: 0, rate: 0.02, extendedDesc: '아티제, 파리크라상, 카페노티드 포함 (통합 혜택 한도 5만원 내)' },
      { id: 'wd_4', icon: <Bus />, title: '대중교통 3.0% 청구할인', desc: '버스, 지하철', minSpend: 0, rate: 0.03, extendedDesc: '통합 혜택 한도 5만원 내' },
      { id: 'wd_5', icon: <ShoppingBag />, title: '쿠팡 2.0% 청구할인', desc: '쿠팡 결제 시', minSpend: 0, rate: 0.02, extendedDesc: '통합 혜택 한도 5만원 내' },
      { id: 'wd_6', icon: <ShoppingCart />, title: '마트 2.0% 청구할인', desc: '이마트, 트레이더스, 홈플러스, 롯데마트', minSpend: 0, rate: 0.02, extendedDesc: '통합 혜택 한도 5만원 내' }
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
    limitTable: [{"tier": "무실적", "limit": "월 최대 5만원 캐시백"}],
    detailedBenefits: [
      { id: 'kb_k1', icon: <Globe />, title: '결제횟수 캐시백 (짭모아)', desc: '5천원 이상 10번마다 캐시백 증액', minSpend: 0, rate: 0.01, extendedDesc: '동일 가맹점 1일 1회 카운트' },
      { id: 'kb_k2', icon: <Utensils />, title: '배달앱/카카오T 3천원 캐시백', desc: '배민, 요기요, 카카오T 이용 시', minSpend: 0, rate: 0.1, extendedDesc: '5천원 이상 결제 시 3천원 (월 2회)' }
    ]
  },
  {
    id: 5,
    name: '국민 톡톡 my point (박상훈)',
    company: 'KB국민카드',
    type: '포인트형',
    color: 'bg-orange-500',
    textColor: 'text-white',
    target: 0,
    lastMonthSpend: 0,
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{"tier": "무실적", "limit": "KB Pay 추가 1만점 / 기본 무제한"}],
    detailedBenefits: [
      { id: 'kb_tok1_p', icon: <Globe />, title: '기본 0.5% 적립', desc: '전 가맹점 무실적/무제한 적립', minSpend: 0, rate: 0.005, extendedDesc: '국내외 전가맹점' },
      { id: 'kb_tok2_p', icon: <Smartphone />, title: 'KB Pay 5% 특별 적립', desc: 'KB Pay 결제 시 추가 적립', minSpend: 0, rate: 0.05, extendedDesc: '기본 적립 포함 총 5.5% (월 1만점)' }
    ]
  },
  {
    id: 12,
    name: '국민 톡톡 my point (김민정)',
    company: 'KB국민카드',
    type: '포인트형',
    color: 'bg-orange-500',
    textColor: 'text-white',
    target: 0,
    lastMonthSpend: 0,
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{"tier": "무실적", "limit": "KB Pay 추가 1만점 / 기본 무제한"}],
    detailedBenefits: [
      { id: 'kb_tok1_k', icon: <Globe />, title: '기본 0.5% 적립', desc: '전 가맹점 무실적/무제한 적립', minSpend: 0, rate: 0.005, extendedDesc: '국내외 전가맹점' },
      { id: 'kb_tok2_k', icon: <Smartphone />, title: 'KB Pay 5% 특별 적립', desc: 'KB Pay 결제 시 추가 적립', minSpend: 0, rate: 0.05, extendedDesc: '기본 적립 포함 총 5.5% (월 1만점)' }
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
  const [authError, setAuthError] = useState(false); 

  const [aiLoading, setAiLoading] = useState(false);
  const [aiPickQuery, setAiPickQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [analysisReport, setAiAnalysisReport] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const currentMonthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const displayMonthStr = `${String(selectedDate.getFullYear()).slice(2)}년 ${selectedDate.getMonth() + 1}월`;

  // --- 화면 확대(Pinch Zoom) 방지 및 자동 아이콘 생성 로직 ---
  useEffect(() => {
    let metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      metaViewport = document.createElement('meta');
      metaViewport.name = "viewport";
      document.head.appendChild(metaViewport);
    }
    metaViewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no";

    const preventPinchZoom = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchstart', preventPinchZoom, { passive: false });

    // ✨ 예쁜 카드 모양 앱 아이콘 자동 주입
    const cardIconBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj4KICA8cmVjdCB3aWR0aD0iNDEyIiBoZWlnaHQ9IjI4MCIgeD0iNTAiIHk9IjExNiIgZmlsbD0iIzRmNDZlNSIgcng9IjQwIiByeT0iNDAiLz4KICA8cGF0aCBmaWxsPSIjODE4Y2Y4IiBkPSJNNTAgMjAwaDQxMnY0MEg1MHoiLz4KICA8cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iNTAiIHg9IjEwMCIgeT0iMjcwIiBmaWxsPSIjZmFjYzE1IiByeD0iMTAiIHJ5PSIxMCIvPgogIDxjaXJjbGUgY3g9IjM4MCIgY3k9IjMwMCIgcj0iMzAiIGZpbGw9IiNmODcxNzEiLz4KICA8Y2lyY2xlIGN4PSIzNDAiIGN5PSIzMDAiIHI9IjMwIiBmaWxsPSIjZmNhNWE1IiBvcGFjaXR5PSIwLjgiLz4KICA8dGV4dCB4PSIyMTAiIHk9IjMwNSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmZmZmYiIGZvbnQtd2VpZ2h0PSJib2xkIj5TTUFSVCBDQVJEPC90ZXh0Pgo8L3N2Zz4=";
    
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = cardIconBase64;

    let favIcon = document.querySelector("link[rel='icon']");
    if (!favIcon) {
      favIcon = document.createElement("link");
      favIcon.rel = "icon";
      document.head.appendChild(favIcon);
    }
    favIcon.href = cardIconBase64;

    return () => {
      document.removeEventListener('touchstart', preventPinchZoom);
    };
  }, []);

  // 1. Firebase 인증
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        setAuthError(true); 
        setIsSyncing(false);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsSyncing(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. 실시간 데이터 동기화
  useEffect(() => {
    if (!user || authError) { setIsSyncing(false); return; }
    setIsSyncing(true);
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_monthly_data', currentMonthStr);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        let parsedHistories = {};
        if (data.spendHistoriesStr) {
          try { parsedHistories = JSON.parse(data.spendHistoriesStr); } catch (e) {}
        } else if (data.spendHistories) {
          parsedHistories = data.spendHistories;
        }

        setCards(prevCards => INITIAL_CARDS.map(card => {
          const cId = String(card.id);
          const savedLM = data.lastMonthSpends?.[cId] || 0;
          const savedBS = parsedHistories[cId] || {};
          const savedCM = data.currentMonthSpends?.[cId] || 0;
          const savedCMDate = data.currentMonthDates?.[cId] || null;

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
            savedAmount: newSavedAmount,
            currentMonthSpend: savedCM,
            currentMonthSpendDate: savedCMDate
          };
        }));
      } else {
        setCards(INITIAL_CARDS.map(c => ({ 
          ...c, 
          lastMonthSpend: 0, 
          benefitSpending: {}, 
          savedAmount: 0,
          currentMonthSpend: 0,
          currentMonthSpendDate: null
        })));
      }
      setIsSyncing(false);
    }, (error) => { setIsSyncing(false); });
    return () => unsubscribe();
  }, [user, currentMonthStr, authError]);

  const saveToCloud = async (newCards) => {
    if (authError || !user) return false;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_monthly_data', currentMonthStr);
    const lastMonthSpends = {};
    const spendHistories = {};
    const currentMonthSpends = {};
    const currentMonthDates = {};

    newCards.forEach(c => {
      lastMonthSpends[String(c.id)] = c.lastMonthSpend;
      spendHistories[String(c.id)] = c.benefitSpending;
      currentMonthSpends[String(c.id)] = c.currentMonthSpend || 0;
      currentMonthDates[String(c.id)] = c.currentMonthSpendDate || null;
    });
    try { 
      await setDoc(docRef, { 
        lastMonthSpends, 
        spendHistoriesStr: JSON.stringify(spendHistories),
        currentMonthSpends,
        currentMonthDates
      }, { merge: true }); 
      return true;
    } catch (e) {
      console.error("Save Error", e);
      return false;
    }
  };

  const handlePrevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  const handleNextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));

  // 일반 카드 지출 내역 누적 함수 (자동 합산 및 톡톡카드 연동 추가)
  const addSpending = async (cardId, benefitId, amount, customDate = null) => {
    if (!amount || amount <= 0) return;
    const parsedAmount = parseInt(amount);
    
    const newCards = cards.map(card => {
      if (card.id === cardId) {
        const hist = card.benefitSpending[benefitId] || [];
        const dateStr = customDate ? customDate : new Date().toLocaleDateString();
        const newHist = [...hist, { id: Date.now(), amount: parsedAmount, date: dateStr }];
        const rate = card.detailedBenefits.find(b => b.id === benefitId)?.rate || 0;
        
        let updatedCard = {
          ...card,
          benefitSpending: { ...card.benefitSpending, [benefitId]: newHist },
          savedAmount: card.savedAmount + (parsedAmount * rate)
        };

        // 🔥 카카오뱅크(ID: 3) 결제 횟수 카드를 제외하고, 지출 추가 시 '이번 달 실적' 자동 합산!
        if (card.id !== 3) {
          updatedCard.currentMonthSpend = (updatedCard.currentMonthSpend || 0) + parsedAmount;
        }

        // 🔥 국민 톡톡 my point (ID: 5, 12) - KB Pay 5% 기입 시 기본 0.5% 에도 1+1 자동 기입
        if ((cardId === 5 && benefitId === 'kb_tok2_p') || (cardId === 12 && benefitId === 'kb_tok2_k')) {
          const basicId = cardId === 5 ? 'kb_tok1_p' : 'kb_tok1_k';
          const basicHist = updatedCard.benefitSpending[basicId] || [];
          const basicNewHist = [...basicHist, { id: Date.now() + 1, amount: parsedAmount, date: dateStr }];
          const basicRate = updatedCard.detailedBenefits.find(b => b.id === basicId)?.rate || 0;
          
          updatedCard.benefitSpending[basicId] = basicNewHist;
          updatedCard.savedAmount += (parsedAmount * basicRate);
        }

        const now = new Date();
        updatedCard.currentMonthSpendDate = `${now.getMonth() + 1}월 ${now.getDate()}일 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        return updatedCard;
      }
      return card;
    });
    
    setCards(newCards);
    const success = await saveToCloud(newCards);
    if (success) { setToastMsg('☁️ 내역 저장 완료'); } 
    else { setToastMsg('⚠️ 저장 실패 (Firebase 콘솔 확인 필요)'); }
    setTimeout(() => setToastMsg(''), 2500);
  };

  // 🔥 카카오뱅크 신한카드 전용: 내역을 누적하지 않고 단일 횟수로 덮어쓰기 하는 함수
  const overwriteSpending = async (cardId, benefitId, amount) => {
    if (!amount || parseInt(amount) < 0) return;
    const newCards = cards.map(card => {
      if (card.id === cardId) {
        const dateStr = new Date().toLocaleDateString();
        // 덮어쓰기이므로 배열에 아이템 1개만 넣음
        const newHist = [{ id: Date.now(), amount: parseInt(amount), date: dateStr }];
        const newBenefitSpending = { ...card.benefitSpending, [benefitId]: newHist };
        
        let newSavedAmount = 0;
        if (newBenefitSpending) {
          Object.entries(newBenefitSpending).forEach(([b_id, histories]) => {
            const targetBenefit = card.detailedBenefits.find(b => b.id === b_id);
            const rate = targetBenefit?.rate || 0;
            const sum = histories.reduce((s, h) => s + h.amount, 0);
            newSavedAmount += sum * rate;
          });
        }

        let updatedCard = {
          ...card,
          benefitSpending: newBenefitSpending,
          savedAmount: newSavedAmount
        };

        // 🔥 카카오뱅크 신한카드(ID: 3)의 메인 혜택(kb_k1)을 덮어쓰기할 때, 
        // 상단 '이번 달 수동 실적'과 메인 화면의 '결제 횟수'도 자동 동기화!
        if (card.id === 3 && benefitId === 'kb_k1') {
          const now = new Date();
          updatedCard.currentMonthSpend = parseInt(amount);
          updatedCard.currentMonthSpendDate = `${now.getMonth() + 1}월 ${now.getDate()}일 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }

        return updatedCard;
      }
      return card;
    });
    setCards(newCards);
    const success = await saveToCloud(newCards);
    if (success) { setToastMsg('☁️ 최종 횟수 덮어쓰기 완료'); } 
    else { setToastMsg('⚠️ 저장 실패'); }
    setTimeout(() => setToastMsg(''), 2500);
  };

  const deleteSpending = async (cardId, benefitId, historyId) => {
    if(!window.confirm("이 내역을 삭제하시겠습니까?")) return;
    const newCards = cards.map(card => {
      if (card.id === cardId) {
        const hist = card.benefitSpending[benefitId] || [];
        const newHist = hist.filter(h => h.id !== historyId);
        const removedItem = hist.find(h => h.id === historyId);
        const rate = card.detailedBenefits.find(b => b.id === benefitId)?.rate || 0;
        const removedAmount = removedItem?.amount || 0;

        let updatedCard = {
          ...card,
          benefitSpending: { ...card.benefitSpending, [benefitId]: newHist },
          savedAmount: card.savedAmount - (removedAmount * rate)
        };

        // 🔥 내역 삭제 시 '이번 달 실적'에서도 자동 차감 (카카오뱅크 제외)
        if (card.id !== 3) {
          updatedCard.currentMonthSpend = Math.max(0, (updatedCard.currentMonthSpend || 0) - removedAmount);
        }

        const now = new Date();
        updatedCard.currentMonthSpendDate = `${now.getMonth() + 1}월 ${now.getDate()}일 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        return updatedCard;
      }
      return card;
    });
    setCards(newCards);
    const success = await saveToCloud(newCards);
    if (success) setToastMsg('🗑️ 내역 삭제 완료');
    setTimeout(() => setToastMsg(''), 1500);
  };

  const updateLM = async (cardId, val) => {
    const newVal = parseInt(val) || 0;
    const newCards = cards.map(c => c.id === cardId ? { ...c, lastMonthSpend: newVal } : c);
    setCards(newCards);
    const success = await saveToCloud(newCards);
    if (success) { setToastMsg('✅ 직전달 실적 반영 완료'); } 
    else { setToastMsg('⚠️ 저장 실패'); }
    setTimeout(() => setToastMsg(''), 2500);
  };

  // 🔥 이번 달 실적 독립 기입 함수 (자동 이월 기능 유지)
  const updateCM = async (cardId, val) => {
    const newVal = parseInt(val) || 0;
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}월 ${now.getDate()}일 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newCards = cards.map(c => {
      if (c.id === cardId) {
        let updatedCard = { ...c, currentMonthSpend: newVal, currentMonthSpendDate: dateStr };
        
        // 🔥 카카오뱅크 신한카드(ID: 3)인 경우, 상단에서 횟수를 입력해도 하단 혜택(kb_k1)에 자동 동기화
        if (c.id === 3) {
          const newHist = [{ id: Date.now(), amount: newVal, date: new Date().toLocaleDateString() }];
          updatedCard.benefitSpending = { ...updatedCard.benefitSpending, 'kb_k1': newHist };
          
          let newSavedAmount = 0;
          Object.entries(updatedCard.benefitSpending).forEach(([b_id, histories]) => {
            const targetBenefit = updatedCard.detailedBenefits.find(b => b.id === b_id);
            const rate = targetBenefit?.rate || 0;
            const sum = histories.reduce((s, h) => s + h.amount, 0);
            newSavedAmount += sum * rate;
          });
          updatedCard.savedAmount = newSavedAmount;
        }
        return updatedCard;
      }
      return c;
    });
    setCards(newCards);
    const success = await saveToCloud(newCards);

    // 다음 달 문서의 '직전달 실적'에 자동으로 덮어쓰기 (이월)
    if (success && !authError && user) {
      const nextMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
      const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
      const nextDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_monthly_data', nextMonthStr);
      try {
        await setDoc(nextDocRef, { lastMonthSpends: { [String(cardId)]: newVal } }, { merge: true });
      } catch (e) {
        console.error("자동 이월 오류:", e);
      }
    }

    if (success) { setToastMsg('✅ 이번 달 실적 반영 완료\n(다음 달 직전달 실적으로 자동 이월됩니다)'); } 
    else { setToastMsg('⚠️ 저장 실패'); }
    setTimeout(() => setToastMsg(''), 3000);
  };

  const formatWon = (n) => new Intl.NumberFormat('ko-KR').format(n) + '원';
  const calculateCurrentSpend = (card) => Object.values(card.benefitSpending).flat().reduce((s, i) => s + i.amount, 0);
  const getCardCountSum = (card) => Object.values(card.benefitSpending).flat().reduce((s, i) => s + i.amount, 0);
  
  const totalSpendAll = cards.reduce((sum, card) => sum + (card.id === 3 ? 0 : calculateCurrentSpend(card)), 0);
  const totalSaved = cards.reduce((sum, card) => sum + card.savedAmount, 0);

  const handleSmartPick = () => {
    if (!aiPickQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);

    setTimeout(() => {
      const query = aiPickQuery.toLowerCase();
      const searchTerms = query.split(' ').filter(q => q.trim() !== '');
      let results = [];

      cards.forEach(card => {
        let matchedBenefits = [];
        card.detailedBenefits.forEach(b => {
          const textToSearch = `${b.title} ${b.desc} ${b.extendedDesc || ''}`.toLowerCase();
          const isMatch = searchTerms.some(term => 
            textToSearch.includes(term) ||
            (term === '커피' && textToSearch.includes('카페')) ||
            (term === '카페' && textToSearch.includes('커피')) ||
            ((term === '점심' || term === '저녁' || term === '밥' || term === '식사') && (textToSearch.includes('요식') || textToSearch.includes('음식') || textToSearch.includes('외식'))) ||
            ((term === '택시' || term === '지하철' || term === '버스') && textToSearch.includes('교통')) ||
            (term === '기름' && textToSearch.includes('주유'))
          );
          if (isMatch) matchedBenefits.push(b);
        });
        if (matchedBenefits.length > 0) results.push({ card, matchedBenefits });
      });

      if (results.length > 0) {
        let responseText = `🔍 [${aiPickQuery}] 관련 혜택을 찾았습니다!\n\n`;
        results.forEach(r => {
          responseText += `💳 [${r.card.name}]\n`;
          r.matchedBenefits.forEach(b => {
            responseText += `  • ${b.title}\n    └ ${b.desc}\n`;
          });
          responseText += `\n`;
        });
        setAiResponse(responseText.trim());
      } else {
        setAiResponse(`😥 [${aiPickQuery}]에 해당하는 혜택을 찾지 못했어요.\n(예: 커피, 주유, 마트, 통신 등 다른 단어로 검색해보세요)`);
      }
      setAiLoading(false);
    }, 400); 
  };

  const handleAnalysis = () => {
    setAiLoading(true);
    setAiAnalysisReport(null);
    
    setTimeout(() => {
      const totalSpend = totalSpendAll;
      if (totalSpend === 0) {
        setAiAnalysisReport("이번 달 지출 내역이 없습니다. 혜택을 기록해 주세요!");
        setAiLoading(false);
        return;
      }

      let tips = [];
      const cardsNeedingSpend = cards.filter(c => c.target > 0 && (c.currentMonthSpend || 0) < c.target);
      if (cardsNeedingSpend.length > 0) {
        tips.push(`📌 [실적 달성 필요]\n${cardsNeedingSpend.map(c => c.name.split('(')[0].trim()).join(', ')} 카드의 실적이 아직 부족합니다. 다음 달 혜택을 위해 우선 사용을 고려하세요.`);
      } else {
        tips.push(`✅ [실적 달성 완료]\n주요 카드의 실적을 모두 채우셨네요! 이제 피킹률(혜택률)이 높은 카드를 자유롭게 사용하세요.`);
      }

      const sortedBySpend = [...cards].sort((a,b) => (b.currentMonthSpend || 0) - (a.currentMonthSpend || 0));
      const topCard = sortedBySpend[0];
      if ((topCard.currentMonthSpend || 0) > 0) {
        const spendStr = topCard.id === 3 ? `${topCard.currentMonthSpend || 0}회` : formatWon(topCard.currentMonthSpend || 0);
        tips.push(`📊 [주요 지출]\n이번 달은 ${topCard.name.split('(')[0].trim()} 카드로 가장 많은 실적(${spendStr})을 쌓았습니다.`);
      }

      tips.push(`💡 [스마트 소비 팁]\n자투리 지출은 '국민 톡톡 my point'처럼 실적 조건이 없는 카드를 활용하면 포인트 혜택을 알뜰하게 챙길 수 있습니다.`);

      let report = `✨ 이번 달 소비 리포트\n\n`;
      tips.forEach((tip) => {
        report += `${tip}\n\n`;
      });
      
      setAiAnalysisReport(report.trim());
      setAiLoading(false);
    }, 600);
  };

  const CardDetail = ({ id, onClose }) => {
    const card = cards.find(c => c.id === id);
    const [lmVal, setLmVal] = useState(card?.lastMonthSpend || 0);
    const [cmVal, setCmVal] = useState(card?.currentMonthSpend || 0);
    const scrollContainerRef = useRef(null); 
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    useEffect(() => {
      window.scrollTo(0, 0);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      setLmVal(card?.lastMonthSpend || 0);
      setCmVal(card?.currentMonthSpend || 0);
    }, [id, card?.lastMonthSpend, card?.currentMonthSpend]);

    const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
    const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      if (touchStart - touchEnd < -60) onClose(); 
    };

    const getAppliedLimit = () => {
      if (!card.limitTable || card.limitTable.length === 0) return "없음";
      let applied = card.limitTable[0].limit;
      let isMetAny = false;
      for (let row of card.limitTable) {
        const numMatch = row.tier.match(/[0-9]+/);
        if (!numMatch) { applied = row.limit; isMetAny = true; break; }
        if (lmVal >= parseInt(numMatch[0]) * 10000) { applied = row.limit; isMetAny = true; }
      }
      return isMetAny ? applied : "실적 미달 (기본 혜택 적용)";
    };

    if (!card) return null;

    return (
      <div 
        ref={scrollContainerRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-right duration-300"
      >
        <header className="flex-none bg-white/90 backdrop-blur px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center"><button onClick={onClose} className="p-2 -ml-2 text-gray-800"><ChevronLeft size={28}/></button><h3 className="ml-2 font-black uppercase text-gray-500 text-xs tracking-widest">상세 관리</h3></div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{displayMonthStr}</span>
        </header>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className={`${card.color} rounded-[32px] p-6 mb-6 text-white shadow-xl`}>
            <p className="text-[10px] font-black opacity-80 mb-1">{card.company}</p>
            <h2 className="text-xl font-black mb-6 leading-tight">{card.name}</h2>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black opacity-70">이번 달 수동 실적</p>
                {/* 🔥 카카오뱅크 신한카드일 경우 '원' 대신 '회'로 표시 */}
                <p className="text-2xl font-black">{card.id === 3 ? `${card.currentMonthSpend || 0}회` : formatWon(card.currentMonthSpend || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black opacity-70">누적 혜택 계산</p>
                <p className="text-lg font-black">{formatWon(card.savedAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-5 mb-6 border border-indigo-100 shadow-inner">
            <p className="text-[11px] font-black text-indigo-400 mb-2 uppercase tracking-tighter">직전달 실적 기입 (혜택 적용용)</p>
            <div className="flex items-center mb-4">
              <div className="relative flex-1">
                <input 
                  type="number" 
                  value={lmVal} 
                  onChange={e => setLmVal(e.target.value)} 
                  className="w-full bg-white border-2 border-indigo-100 rounded-xl pl-4 pr-16 py-2.5 font-black text-indigo-700 outline-none shadow-sm"
                  placeholder={card.id === 3 ? "직전달 결제 횟수" : "직전달 총액"}
                />
                <button 
                  onClick={() => updateLM(id, lmVal)} 
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold active:scale-95 transition-transform shadow-sm"
                >
                  적용
                </button>
              </div>
              {/* 🔥 단위 변경 */}
              <span className="font-bold text-indigo-600 ml-3 whitespace-nowrap">{card.id === 3 ? '회' : '원'}</span>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 block mb-1">현재 적용된 통합 한도</span>
              <span className="text-[13px] font-black text-indigo-700 leading-tight">{getAppliedLimit()}</span>
            </div>
          </div>

          {card.limitTable && card.limitTable.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 shadow-sm">
              <h4 className="font-black text-[12px] text-gray-600 mb-3 flex items-center"><Table size={15} className="mr-1.5 text-indigo-500"/> 통합 할인/적립 한도표</h4>
              <div className="space-y-2">
                {card.limitTable.map((row, idx) => {
                  const numMatch = row.tier.match(/[0-9]+/);
                  const req = numMatch ? parseInt(numMatch[0]) * 10000 : 0;
                  const isActive = lmVal >= req;
                  return (
                    <div key={idx} className={`flex justify-between items-center p-2 rounded-lg text-xs font-bold ${isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-gray-400 bg-white border border-gray-50'}`}>
                      <span>{row.tier}</span><span className="text-right flex-1 ml-4 text-[11px]">{row.limit}</span>
                      {isActive && <span className="ml-2 text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded shrink-0">적용중</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-indigo-50 rounded-2xl p-5 mb-6 border border-indigo-100 shadow-inner">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[11px] font-black text-indigo-400 uppercase tracking-tighter">이번 달 실적 기입 (목표 달성용)</p>
              {card.currentMonthSpendDate && (
                <span className="text-[9px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  마지막 갱신: {card.currentMonthSpendDate}
                </span>
              )}
            </div>
            <div className="flex items-center mb-4">
              <div className="relative flex-1">
                <input 
                  type="number" 
                  value={cmVal} 
                  onChange={e => setCmVal(e.target.value)} 
                  className="w-full bg-white border-2 border-indigo-100 rounded-xl pl-4 pr-16 py-2.5 font-black text-indigo-700 outline-none shadow-sm"
                  placeholder={card.id === 3 ? "현재 결제 횟수 기입" : "현재 실적 기입"}
                />
                <button 
                  onClick={() => updateCM(id, cmVal)} 
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold active:scale-95 transition-transform shadow-sm"
                >
                  적용
                </button>
              </div>
              {/* 🔥 단위 변경 */}
              <span className="font-bold text-indigo-600 ml-3 whitespace-nowrap">{card.id === 3 ? '회' : '원'}</span>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 block mb-1">
                다음달 혜택 목표: {card.target > 0 ? (card.id === 3 ? `${card.target}회` : formatWon(card.target)) : '무실적'}
              </span>
              {card.target === 0 || (card.currentMonthSpend || 0) >= card.target ? (
                <span className="text-[12px] font-black text-green-500 bg-green-50 border border-green-100 px-2 py-1 rounded">✅ 달성 완료</span>
              ) : (
                <span className="text-[12px] font-black text-red-500 bg-red-50 border border-red-100 px-2 py-1 rounded">❌ 미달성 ({card.id === 3 ? `${card.target - (card.currentMonthSpend || 0)}회` : formatWon(card.target - (card.currentMonthSpend || 0))} 부족)</span>
              )}
            </div>
          </div>

          <div className="space-y-4 pb-12">
            <h4 className="font-black text-lg flex items-center border-b pb-2"><Receipt size={20} className="mr-2 text-indigo-600"/> 혜택별 지출 입력 (계산용)</h4>
            {card.detailedBenefits.map(db => {
              const isActive = card.lastMonthSpend >= db.minSpend;
              const [amt, setAmt] = useState('');
              const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
              const hist = card.benefitSpending[db.id] || [];
              const sum = hist.reduce((s, h) => s + h.amount, 0);

              return (
                <div key={db.id} className={isActive ? "opacity-100" : "opacity-30 grayscale pointer-events-none"}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 pr-4">
                      <h5 className="font-black text-[15px] leading-snug">{db.title}</h5>
                      <p className="text-[11px] text-gray-500">{db.desc}</p>
                      {db.extendedDesc && <p className="text-[10px] text-gray-400 mt-1 leading-relaxed border-l-2 border-indigo-100 pl-2">ℹ {db.extendedDesc}</p>}
                    </div>
                    {isActive ? <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold mt-1 shrink-0">적용중</span> : <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold mt-1 shrink-0">{formatWon(db.minSpend)}↑ 필요</span>}
                  </div>
                  {isActive && (
                    <div className="mt-3 bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-inner">
                      {/* 🔥 카카오뱅크 신한카드(ID: 3)일 경우에는 합계/예상혜택 줄을 완전히 숨김 처리하여 헷갈리지 않게 개선 */}
                      {card.id !== 3 && (
                        <div className="flex justify-between mb-3 items-center">
                          <span className="text-[10px] font-black text-gray-400">
                            합계: {formatWon(sum)}
                          </span>
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">예상 혜택: {formatWon(sum * db.rate)}</span>
                        </div>
                      )}
                      
                      {/* 🔥 카카오뱅크 신한카드(ID: 3)일 경우, 과거 리스트 숨김 처리 (오직 최종 횟수만 덮어쓰기) */}
                      {hist.length > 0 && card.id !== 3 && (
                        <div className="mb-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                          {hist.map(h => (
                            <div key={h.id} className="flex justify-between items-center text-xs bg-white border border-gray-200 p-2 rounded-xl">
                              <span className="text-gray-400 text-[10px]">{h.date}</span>
                              <div className="flex items-center space-x-3"><span className="font-black text-gray-700">{formatWon(h.amount)}</span><button onClick={() => deleteSpending(id, db.id, h.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button></div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        {/* 🔥 카카오뱅크 신한카드(ID:3) 전용 '덮어쓰기' UI */}
                        {card.id === 3 ? (
                          <>
                            <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="최종 결제 횟수 덮어쓰기" className="flex-1 px-4 py-2 rounded-xl text-xs border-none bg-white font-bold outline-none"/>
                            <button onClick={() => { overwriteSpending(id, db.id, amt); setAmt(''); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl active:scale-90 font-bold text-xs shrink-0">덮어쓰기</button>
                          </>
                        ) : (
                          <>
                            <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="지출 금액 추가" className="flex-1 px-4 py-2 rounded-xl text-xs border-none bg-white font-bold outline-none"/>
                            <button onClick={() => { addSpending(id, db.id, amt); setAmt(''); }} className="bg-indigo-600 text-white p-2 rounded-xl active:scale-90"><Plus/></button>
                          </>
                        )}
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

  if (isSyncing && !cards.length) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/><p className="font-black text-gray-400 tracking-tighter">데이터 동기화 중...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans select-none overflow-hidden">
      <div className="w-full max-w-md bg-white h-screen flex flex-col relative shadow-2xl border-x">
        {authError && <div className="bg-red-50 text-red-600 text-[11px] font-bold px-4 py-2 text-center flex justify-center items-center relative z-30"><AlertTriangle size={14} className="mr-1"/> Firebase 설정 전이라 데이터가 클라우드에 저장되지 않습니다.</div>}
        <header className="px-6 pt-12 pb-4 bg-white border-b flex justify-between items-center z-20">
          <h1 className="text-xl font-black tracking-tight">Smart<span className="text-indigo-600">Card</span></h1>
        </header>

        <div className="bg-gray-50 px-6 py-3 border-b flex justify-between items-center z-10 sticky top-[73px]">
          <button onClick={handlePrevMonth} className="p-1.5 bg-white rounded-lg shadow-sm active:scale-95 transition"><ChevronLeft size={18}/></button>
          <div className="flex items-center space-x-2 text-indigo-700 font-black"><CalendarDays size={18}/><span>{displayMonthStr}</span></div>
          <button onClick={handleNextMonth} className="p-1.5 bg-white rounded-lg shadow-sm active:scale-95 transition"><ChevronRight size={18}/></button>
        </div>

        <main className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar">
          {activeTab === 'cards' && (
            <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-left duration-300">
              <div className="flex justify-between items-end"><h2 className="text-2xl font-black">내 카드 지갑</h2><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-bold">Manage</span></div>
              <div className="space-y-4">
                {cards.map(c => {
                  const manualSpend = c.currentMonthSpend || 0;
                  const met = c.target === 0 || manualSpend >= c.target;
                  return (
                    <div key={c.id} onClick={() => setSelectedDetailCardId(c.id)} className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className={`${c.color} w-16 h-10 rounded-xl shadow-inner relative overflow-hidden`}><div className="absolute top-0 right-0 w-6 h-6 bg-white/20 rounded-full -mr-3 -mt-3 blur-md"></div></div>
                        <div className="flex-1"><p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">{c.company}</p><h3 className="font-black text-[15px] leading-tight mt-1">{c.name}</h3></div>
                        <ChevronRight className="text-gray-300"/>
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center border-gray-50">
                        <span className="text-[11px] font-black text-gray-400">
                          {/* 🔥 메인 지갑 카드 리스트의 단위 표기 변경 */}
                          {c.id === 3 ? `이번 달 결제: ${manualSpend}회` : `이번 달 실적: ${formatWon(manualSpend)}`}
                        </span>
                        <span className={`text-[11px] font-black ${met ? 'text-green-500' : 'text-red-500'}`}>
                          {c.id === 3 && met ? '달성 완료' : (met ? '달성 완료' : `미달성 (${formatWon(c.target - manualSpend)} 부족)`)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {activeTab === 'smartPick' && (
            <div className="space-y-6 pt-4 animate-in fade-in duration-300">
              <h2 className="text-2xl font-black tracking-tight">✨ 자체 스마트 픽</h2>
              <p className="text-xs text-gray-400 font-medium">인터넷 연결 지연 없이 앱 내부 데이터에서 즉시 혜택을 찾아줍니다.</p>
              <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100 shadow-inner flex items-center space-x-2">
                <input type="text" value={aiPickQuery} onChange={e => setAiPickQuery(e.target.value)} placeholder="예: 커피, 주유, 마트, 점심" className="flex-1 px-4 py-2 text-sm border-none bg-white rounded-xl outline-none" onKeyPress={e => e.key === 'Enter' && handleSmartPick()}/>
                <button onClick={handleSmartPick} disabled={aiLoading} className="bg-indigo-600 text-white p-2 rounded-xl active:scale-90">{aiLoading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}</button>
              </div>
              {aiResponse && <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-lg animate-in zoom-in duration-300 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">{aiResponse}</div>}
            </div>
          )}
          {activeTab === 'home' && (
            <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-right duration-300">
              <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-xl">
                <p className="text-[10px] font-black uppercase opacity-70 mb-2 tracking-widest">{displayMonthStr} Report</p>
                <h3 className="text-4xl font-black mb-6 tracking-tight mt-1">{formatWon(totalSpendAll)}</h3>
                <div className="flex items-center bg-white/20 w-fit px-4 py-2 rounded-2xl border border-white/20"><TrendingUp size={18} className="mr-2"/><span className="text-sm font-black">누적 혜택: {formatWon(totalSaved)}</span></div>
              </div>
              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6"><h3 className="font-black flex items-center text-gray-800">✨ 소비 습관 분석</h3><button onClick={handleAnalysis} disabled={aiLoading} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center">{aiLoading ? <Loader2 className="animate-spin mr-1" size={14}/> : <RefreshCw className="mr-1" size={14}/>}리포트 생성</button></div>
                {analysisReport && <div className="text-sm text-gray-700 leading-relaxed font-medium bg-gray-50 p-5 rounded-2xl whitespace-pre-wrap">{analysisReport}</div>}
              </div>
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 max-w-md w-full bg-white/95 backdrop-blur-lg border-t px-10 py-4 flex justify-between items-center pb-safe z-30 shadow-2xl">
          <button onClick={() => setActiveTab('cards')} className={`flex flex-col items-center transition-all ${activeTab === 'cards' ? 'text-indigo-600 scale-110' : 'text-gray-300'}`}><CreditCard/><span className="text-[10px] font-black mt-1 uppercase tracking-tighter">WALLET</span></button>
          <button onClick={() => setActiveTab('smartPick')} className="flex flex-col items-center -mt-10 group"><div className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 group-active:scale-90 ${activeTab === 'smartPick' ? 'bg-indigo-700' : 'bg-indigo-600'}`}><Sparkles size={28}/></div><span className={`text-[10px] font-black mt-1 uppercase tracking-tighter ${activeTab === 'smartPick' ? 'text-indigo-700' : 'text-indigo-600'}`}>SMART</span></button>
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center transition-all ${activeTab === 'home' ? 'text-indigo-600 scale-110' : 'text-gray-300'}`}><Home/><span className="text-[10px] font-black mt-1 uppercase tracking-tighter">REPORT</span></button>
        </nav>

        {selectedDetailCardId && <CardDetail key={selectedDetailCardId} id={selectedDetailCardId} onClose={() => setSelectedDetailCardId(null)}/>}
        {toastMsg && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl text-xs font-bold shadow-2xl z-[200] animate-in slide-in-from-bottom-4 text-center leading-relaxed whitespace-pre-wrap">{toastMsg}</div>}
      </div>
      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        body { 
          -webkit-tap-highlight-color: transparent; 
          touch-action: pan-x pan-y; /* 핀치 줌 방지용 CSS */
          overscroll-behavior: none;
        }
        input:focus { outline: none; }
        .markdown-body ul { list-style-type: disc; padding-left: 20px; margin-top: 10px; }
        .markdown-body b { font-weight: 800; }
        .markdown-body p { margin-bottom: 10px; }
      `}</style>
    </div>
  );
}
