import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
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
    limitTable: [{"tier": "10만원 이상", "limit": "교통 3천원"}, {"tier": "20만원 이상", "limit": "교통 3천원 + 마트 5천원"}, {"tier": "30만원 이상", "limit": "교통/마트 + 학원/외식 등 추가"}],
    detailedBenefits: [
      { id: 'dh_1', icon: <MapPin />, title: '공공시설 이용료 할인 (무실적)', desc: '서울시 공영주차장 및 문화시설', minSpend: 0, rate: 0.3, extendedDesc: '공영주차장 30~50%, 남산터널 면제, 박물관 입장료 할인' },
      { id: 'dh_2', icon: <Bus />, title: '대중교통 10% 할인', desc: '버스, 지하철 요금 청구 할인', minSpend: 100000, rate: 0.1, extendedDesc: '전월 10만 이상 시 월 3,000원 한도' },
      { id: 'dh_3', icon: <ShoppingCart />, title: '대형마트 5% 할인', desc: '이마트, 홈플러스, 롯데마트', minSpend: 200000, rate: 0.05, extendedDesc: '전월 20만 이상 시 월 5,000원 한도 (창고형 제외)' },
      { id: 'dh_4', icon: <BookOpen />, title: '전국 학원 5% 할인', desc: '입시, 보습, 외국어 학원 등', minSpend: 300000, rate: 0.05, extendedDesc: '전월 30만 이상 시 월 1만원 한도, 오프라인 결제건' },
      { id: 'dh_5', icon: <Coffee />, title: '스타벅스/외식 20% 할인', desc: '스타벅스 및 주요 패밀리레스토랑', minSpend: 300000, rate: 0.2, extendedDesc: '스타벅스 월 2회(회당 5천원), 패밀리레스토랑 20% 할인' },
      { id: 'dh_6', icon: <Ticket />, title: '놀이공원 50% 할인', desc: '에버랜드, 롯데월드, 서울랜드', minSpend: 300000, rate: 0.5, extendedDesc: '본인 자유이용권 50% 현장할인 (통합 월 1회, 연 10회)' }
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
      { id: 'wow_1', icon: <Bus />, title: '이동통신/대중교통 5% 적립', desc: '통신사 자동이체 및 버스/지하철', minSpend: 300000, rate: 0.05, extendedDesc: '전기차 충전 포함, 결합상품 제외' },
      { id: 'wow_2', icon: <Smartphone />, title: '주요 간편결제 3% 추가 적립', desc: '네이버/카카오/PAYCO/SSGPAY', minSpend: 300000, rate: 0.03, extendedDesc: '온/오프라인 모두 적용, 기본/특별 적립과 중복 적용' },
      { id: 'wow_3', icon: <Film />, title: '커피/영화 3% 적립', desc: '스타벅스, 투썸, CGV, 롯데시네마', minSpend: 300000, rate: 0.03, extendedDesc: '백화점/대형마트 입점 매장 제외' },
      { id: 'wow_4', icon: <ShoppingCart />, title: '백화점/마트/온라인 1% 적립', desc: '이마트, 쿠팡, G마켓, 백화점 등', minSpend: 300000, rate: 0.01, extendedDesc: '면세점, 해외 가맹점 포함' }
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
    limitTable: [{"tier": "무실적", "limit": "할인 한도 무제한"}],
    detailedBenefits: [
      { id: 'wd_1', icon: <Globe />, title: '전가맹점 0.7% 기본 할인', desc: '실적 조건 없이 무제한', minSpend: 0, rate: 0.007, extendedDesc: '세금, 공과금, 상품권 등 제외' },
      { id: 'wd_2', icon: <Smartphone />, title: '온라인 간편결제 1.2% 할인', desc: '하나/네이버/카카오/삼성페이 등', minSpend: 0, rate: 0.012, extendedDesc: '오프라인 삼성페이 포함 무제한' },
      { id: 'wd_3', icon: <ShoppingCart />, title: '대형마트/온라인쇼핑 1.2% 할인', desc: '마트, 트레이더스, 코스트코 등', minSpend: 0, rate: 0.012, extendedDesc: '🔥 창고형 마트(트레이더스 등) 포함 무제한' }
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

  // 1. Firebase 인증 (PWA 환경 대응: 익명 로그인 무조건 수행)
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

  // 2. 실시간 데이터 동기화 (가족 공유 Public DB 경로 고정)
  useEffect(() => {
    if (!user || authError) { setIsSyncing(false); return; }
    setIsSyncing(true);
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_monthly_data', currentMonthStr);
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // 데이터 구조 안정성을 위해 JSON으로 직렬화된 데이터 파싱
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
        setCards(INITIAL_CARDS.map(c => ({ ...c, lastMonthSpend: 0, benefitSpending: {}, savedAmount: 0 })));
      }
      setIsSyncing(false);
    }, (error) => { setIsSyncing(false); });
    return () => unsubscribe();
  }, [user, currentMonthStr, authError]);

  // 클라우드 저장 (직렬화 적용하여 데이터 유실 100% 방지)
  const saveToCloud = async (newCards) => {
    if (authError || !user) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'shared_monthly_data', currentMonthStr);
    const lastMonthSpends = {};
    const spendHistories = {};
    newCards.forEach(c => {
      lastMonthSpends[String(c.id)] = c.lastMonthSpend;
      spendHistories[String(c.id)] = c.benefitSpending;
    });
    try { 
      await setDoc(docRef, { 
        lastMonthSpends, 
        spendHistoriesStr: JSON.stringify(spendHistories) // 복잡한 구조로 인한 Firebase 오류 원천 차단
      }, { merge: true }); 
    } catch (e) {
      console.error("Save Error", e);
    }
  };

  const handlePrevMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  const handleNextMonth = () => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));

  const addSpending = (cardId, benefitId, amount, customDate = null) => {
    if (!amount || amount <= 0) return;
    const newCards = cards.map(card => {
      if (card.id === cardId) {
        const hist = card.benefitSpending[benefitId] || [];
        const dateStr = customDate ? customDate : new Date().toLocaleDateString();
        const newHist = [...hist, { id: Date.now(), amount: parseInt(amount), date: dateStr }];
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
    if (!authError) { setToastMsg('☁️ 클라우드 저장 완료'); setTimeout(() => setToastMsg(''), 1500); }
  };

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
    setToastMsg('🗑️ 내역 삭제 완료');
    setTimeout(() => setToastMsg(''), 1500);
  };

  // '적용' 버튼을 통해 명확하게 호출되도록 변경된 함수
  const updateLM = (cardId, val) => {
    const newVal = parseInt(val) || 0;
    const newCards = cards.map(c => c.id === cardId ? { ...c, lastMonthSpend: newVal } : c);
    setCards(newCards);
    saveToCloud(newCards);
    setToastMsg('☁️ 실적 반영 완료');
    setTimeout(() => setToastMsg(''), 1500);
  };

  const formatWon = (n) => new Intl.NumberFormat('ko-KR').format(n) + '원';
  const calculateCurrentSpend = (card) => Object.values(card.benefitSpending).flat().reduce((s, i) => s + i.amount, 0);
  const getCardCountSum = (card) => Object.values(card.benefitSpending).flat().reduce((s, i) => s + i.amount, 0);
  const totalSpendAll = cards.reduce((sum, card) => sum + (card.id === 3 ? 0 : calculateCurrentSpend(card)), 0);
  const totalSaved = cards.reduce((sum, card) => sum + card.savedAmount, 0);

  // --- AI 스마트 픽 ---
  const handleSmartPick = async () => {
    if (!aiPickQuery.trim()) return;
    setAiLoading(true); setAiResponse(null);
    const context = cards.map(c => ({
      name: c.name,
      benefits: c.detailedBenefits.map(b => ({ title: b.title, desc: b.desc, extended: b.extendedDesc })),
      lm: c.lastMonthSpend,
      target: c.target
    }));
    const systemInstruction = `당신은 스마트 카드 비서입니다. 인터넷 검색 금지. 오직 제공된 [보유 카드 상황] 데이터 내의 혜택 정보만 100% 기준으로 답변하세요. 상황에 가장 유리한 카드 1개를 골라 이유와 함께 3줄 이내로 답변하세요.`;
    try {
      const result = await fetchGemini(`상황: ${aiPickQuery}\n[보유 카드 상황]: ${JSON.stringify(context)}`, systemInstruction);
      setAiResponse(result);
    } catch (e) { setToastMsg("AI 응답 지연 중..."); } finally { setAiLoading(false); }
  };

  const handleAnalysis = async () => {
    setAiLoading(true); setAiAnalysisReport(null);
    const summary = cards.map(c => ({ name: c.name, spend: calculateCurrentSpend(c), saved: c.savedAmount }));
    try {
      const result = await fetchGemini(`데이터: ${JSON.stringify(summary)}`, "금융 분석가로서 카드 소비 팁 3가지를 한국어로 제안하세요.");
      setAiAnalysisReport(result);
    } catch (e) {} finally { setAiLoading(false); }
  };

  // --- 상세 화면 컴포넌트 ---
  const CardDetail = ({ id, onClose }) => {
    const card = cards.find(c => c.id === id);
    const [lmVal, setLmVal] = useState(card?.lastMonthSpend || 0);
    const scrollContainerRef = useRef(null); 
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    useEffect(() => {
      window.scrollTo(0, 0);
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      setLmVal(card?.lastMonthSpend || 0);
    }, [id, card?.lastMonthSpend]);

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
              <div><p className="text-[10px] font-black opacity-70">이번 달 사용</p><p className="text-2xl font-black">{card.id === 3 ? `${getCardCountSum(card)}회` : formatWon(calculateCurrentSpend(card))}</p></div>
              <div className="text-right"><p className="text-[10px] font-black opacity-70">누적 혜택</p><p className="text-lg font-black">{formatWon(card.savedAmount)}</p></div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-5 mb-6 border border-indigo-100 shadow-inner">
            <p className="text-[11px] font-black text-indigo-400 mb-2 uppercase tracking-tighter">직전달 실적 기입 (혜택 기준)</p>
            <div className="flex items-center space-x-3 mb-4">
              <input type="number" value={lmVal} onChange={e => setLmVal(e.target.value)} className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 font-black text-indigo-700 outline-none shadow-sm" placeholder="금액 입력"/>
              <span className="font-bold text-indigo-600 whitespace-nowrap">원</span>
              {/* 🔥 명시적인 적용 버튼 추가 (입력 후 바로 창을 닫아도 저장되도록 함) */}
              <button onClick={() => updateLM(id, lmVal)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform shrink-0">
                적용
              </button>
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

          <div className="space-y-4 pb-12">
            <h4 className="font-black text-lg flex items-center border-b pb-2"><Receipt size={20} className="mr-2 text-indigo-600"/> 혜택별 지출 입력</h4>
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
                      <div className="flex justify-between mb-3 items-center">
                        <span className="text-[10px] font-black text-gray-400">{card.id === 3 ? `합계: ${sum}회` : `합계: ${formatWon(sum)}`}</span>
                        {card.id !== 3 && <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">예상 혜택: {formatWon(sum * db.rate)}</span>}
                      </div>
                      {hist.length > 0 && (
                        <div className="mb-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                          {hist.map(h => (
                            <div key={h.id} className="flex justify-between items-center text-xs bg-white border border-gray-200 p-2 rounded-xl">
                              <span className="text-gray-400 text-[10px]">{h.date}</span>
                              <div className="flex items-center space-x-3"><span className="font-black text-gray-700">{card.id === 3 ? `${h.amount}회` : formatWon(h.amount)}</span><button onClick={() => deleteSpending(id, db.id, h.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16}/></button></div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex space-x-2">
                        {card.id === 3 ? (
                          <><input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-1/2 px-3 py-2 rounded-xl text-xs border-none bg-white font-bold outline-none"/><input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="횟수" className="w-1/2 px-3 py-2 rounded-xl text-xs border-none bg-white font-bold outline-none"/></>
                        ) : (<input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="지출 금액 입력" className="flex-1 px-4 py-2 rounded-xl text-xs border-none bg-white font-bold outline-none"/>)}
                        <button onClick={() => { addSpending(id, db.id, amt, card.id === 3 ? customDate : null); setAmt(''); }} className="bg-indigo-600 text-white p-2 rounded-xl active:scale-90"><Plus/></button>
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
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
               <Cloud className="text-green-500" size={14} />
               <span className="text-[10px] font-bold text-green-700">가족 공유 중</span>
            </div>
          </div>
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
                  const s = calculateCurrentSpend(c);
                  const met = c.target === 0 || s >= c.target;
                  return (
                    <div key={c.id} onClick={() => setSelectedDetailCardId(c.id)} className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className={`${c.color} w-16 h-10 rounded-xl shadow-inner relative overflow-hidden`}><div className="absolute top-0 right-0 w-6 h-6 bg-white/20 rounded-full -mr-3 -mt-3 blur-md"></div></div>
                        <div className="flex-1"><p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">{c.company}</p><h3 className="font-black text-[15px] leading-tight mt-1">{c.name}</h3></div>
                        <ChevronRight className="text-gray-300"/>
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center border-gray-50">
                        <span className="text-[11px] font-black text-gray-400">{c.id === 3 ? `이번 달 기록: ${getCardCountSum(c)}회` : `이번 달 사용: ${formatWon(s)}`}</span>
                        <span className={`text-[11px] font-black ${met ? 'text-green-500' : 'text-indigo-500'}`}>{met ? '실적 달성' : `부족 ${formatWon(c.target - s)}`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {activeTab === 'smartPick' && (
            <div className="space-y-6 pt-4 animate-in fade-in duration-300">
              <h2 className="text-2xl font-black tracking-tight">✨ AI 스마트 픽</h2>
              <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100 shadow-inner flex items-center space-x-2">
                <input type="text" value={aiPickQuery} onChange={e => setAiPickQuery(e.target.value)} placeholder="예: 오늘 점심에 뭐 쓸까?" className="flex-1 px-4 py-2 text-sm border-none bg-white rounded-xl outline-none" onKeyPress={e => e.key === 'Enter' && handleSmartPick()}/>
                <button onClick={handleSmartPick} disabled={aiLoading} className="bg-indigo-600 text-white p-2 rounded-xl active:scale-90">{aiLoading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}</button>
              </div>
              {aiResponse && <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-lg animate-in zoom-in duration-300 text-sm text-gray-700 leading-relaxed markdown-body whitespace-pre-wrap font-medium">{aiResponse}</div>}
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
                <div className="flex justify-between items-center mb-6"><h3 className="font-black flex items-center text-gray-800">✨ AI 소비 습관 분석</h3><button onClick={handleAnalysis} disabled={aiLoading} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center">{aiLoading ? <Loader2 className="animate-spin mr-1" size={14}/> : <RefreshCw className="mr-1" size={14}/>}리포트 생성</button></div>
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
        body { -webkit-tap-highlight-color: transparent; }
        input:focus { outline: none; }
        .markdown-body ul { list-style-type: disc; padding-left: 20px; margin-top: 10px; }
        .markdown-body b { font-weight: 800; }
        .markdown-body p { margin-bottom: 10px; }
      `}</style>
    </div>
  );
}
