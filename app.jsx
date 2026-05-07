import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  Home, CreditCard, Sparkles, Settings, ChevronRight, ChevronLeft, 
  CheckCircle2, Coffee, ShoppingCart, Bus, Utensils, Stethoscope, TrendingUp, 
  RefreshCw, Loader2, Plus, Droplet, ShoppingBag, MoreHorizontal, 
  Smartphone, Globe, Briefcase, Wifi, Monitor, Plane, Gift, History, 
  BookOpen, MapPin, Baby, Receipt, MousePointer2, Scissors, Table, Film, Ticket, Building, Cloud
} from 'lucide-react';

// --- Firebase Configuration ---
// Note: In a production environment, these values would be provided via environment variables.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'smart-card-manager';

// --- Full Data Set for 11 Cards ---
const INITIAL_CARDS = [
  {
    id: 1,
    name: '레이디 클래식 (Lady Classic)',
    company: '신한카드',
    type: '캐시백·할인형',
    tags: ['신한카드', 'VISA', '프리미엄'],
    color: 'bg-gradient-to-br from-rose-400 to-rose-600',
    textColor: 'text-white',
    target: 300000,
    lastMonthSpend: 320000, 
    annualFee: 'VISA 3만원 / UPI 2.7만원',
    benefitSpending: {}, 
    savedAmount: 0,
    limitTable: [
      { tier: '30만원 이상', limit: '캐시백 5만 + 브런치 2만 + 주유 40만(대상액)' }
    ],
    detailedBenefits: [
      { id: 'lc_1', icon: <Coffee />, title: '브런치 5% 결제일 할인', desc: '오전 11시 ~ 오후 2시 요식업종', minSpend: 300000, rate: 0.05, extendedDesc: ['할인액 기준 월 2만원 한도', '제과점, 한식, 중식, 양식, 일식, 패스트푸드, 커피 포함'] },
      { id: 'lc_2', icon: <Stethoscope />, title: '육아/의료 5% 캐시백', desc: '학원, 서점, 병원, 약국', minSpend: 300000, rate: 0.05, extendedDesc: ['치과, 한의원 포함 (동물병원 제외)', '월 통합 캐시백 한도 5만원', '학원은 방문 결제 시 제공 (PG/온라인 제외)'] },
      { id: 'lc_3', icon: <ShoppingBag />, title: '쇼핑 3% 캐시백', desc: '백화점, 대형마트, 온라인몰', minSpend: 300000, rate: 0.03, extendedDesc: ['이마트/홈플/롯데마트 (창고형/SSM 제외)', '현대/롯데/신세계/AK/갤러리아', '옥션/G마켓/11번가/SSG닷컴'] },
      { id: 'lc_4', icon: <Utensils />, title: '웰빙 7% 캐시백', desc: '초록마을, 한살림생협 매장', minSpend: 300000, rate: 0.07, extendedDesc: ['오프라인 매장 결제 시 적용'] },
      { id: 'lc_5', icon: <Gift />, title: '던킨도너츠 3,500원 할인', desc: '6,000원 이상 결제 시 적용', minSpend: 300000, rate: 0.58, extendedDesc: ['월 1회 제공'] },
      { id: 'lc_6', icon: <Film />, title: '롯데시네마 스위트콤보 무료', desc: '현장 카드 제시 시 무료 제공', minSpend: 300000, rate: 0, extendedDesc: ['팝콘(대) 1 + 음료(중) 2 제공', '월 1회 제공'] },
      { id: 'lc_7', icon: <Droplet />, title: 'GS칼텍스 리터당 40원 할인', desc: '주유 시 결제일 할인 (LPG제외)', minSpend: 300000, rate: 0.02, extendedDesc: ['월 이용금액 40만원 한도 내 제공', '1일 2회, 1회 15만원 한도'] },
      { id: 'lc_8', icon: <Plane />, title: '제주 JDC 면세점 8% 할인', desc: '결제일 할인', minSpend: 300000, rate: 0.08, extendedDesc: ['30만 이상 8천원 한도 / 60만 이상 3.2만원 한도'] }
    ]
  },
  {
    id: 2,
    name: '탄탄대로 Biz 티타늄카드 (박상훈)',
    company: 'KB국민카드',
    type: '할인·적립',
    tags: ['KB국민카드', 'K-WORLD', '티타늄', '사업지원'],
    color: 'bg-[#98878F]',
    textColor: 'text-white',
    target: 400000,
    lastMonthSpend: 450000, 
    annualFee: 'K-World 4만원 / Master 4만원',
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [
      { tier: '40만원 이상', limit: '마트 1.5만 / 쇼핑 1.5만 / Basic 5천' },
      { tier: '80만원 이상', limit: '마트 2만 / 쇼핑 2만 / Basic 5천' }
    ],
    detailedBenefits: [
      { id: 'tb_1_psh', icon: <Droplet />, title: '주유 리터당 110점 적립', desc: 'SK/GS칼텍스 주유소 및 충전소(LPG 포함)', minSpend: 400000, rate: 0.07, extendedDesc: ['월 이용금액 20만원 한도 내 적립 (초과분 불가)', '정유사 본사 고시 휘발유가 기준 변환 적립'] },
      { id: 'tb_2_psh', icon: <ShoppingCart />, title: '마트 15%~20% 적립', desc: '이마트, 롯데마트, 홈플러스 및 하나로식자재', minSpend: 400000, rate: 0.15, extendedDesc: ['40만 이상 15%(한도 1.5만) / 80만 이상 20%(한도 2만)', '※ 트레이더스, 에브리데이, 롯데슈퍼 등 창고형/SSM 제외', '상품권 및 온라인몰 결제 제외'] },
      { id: 'tb_3_psh', icon: <ShoppingBag />, title: '온라인쇼핑몰 15%~20% 적립', desc: 'G마켓, 옥션, 11번가, 인터파크, 롯데닷컴, 신세계몰', minSpend: 400000, rate: 0.15, extendedDesc: ['40만 이상 15%(한도 1.5만) / 80만 이상 20%(한도 2만)'] },
      { id: 'tb_4_psh', icon: <Monitor />, title: '온라인몰 (플러스 O2O) 10%', desc: '배달의민족, 마켓컬리, 그린카 등 10% 적립', minSpend: 400000, rate: 0.1, extendedDesc: ['※ 반드시 KB Pay 앱 내 [플러스 O2O] 메뉴 경유 필수', '제휴사: 배민, 요기요, 컬리, 그린카, 교보문고, 집닥 등', '통합 월 한도 1만점'] },
      { id: 'tb_5_psh', icon: <Wifi />, title: '통신/사회보험 10% 적립', desc: '4대보험 및 휴대폰 요금', minSpend: 400000, rate: 0.1, extendedDesc: ['건강/국민/고용/산재 자동납부', 'SKT/KT/LGU+ 통신요금', '월 적립한도 1만점'] },
      { id: 'tb_6_psh', icon: <MoreHorizontal />, title: '가맹점 운영지원 10% 할인', desc: '정수기렌탈, 청소용역, 보안업종 등', minSpend: 400000, rate: 0.1, extendedDesc: ['코웨이, 청호나이스, SK매직 렌탈', '에스원 세콤, ADT 캡스 등'] },
      { id: 'tb_7_psh', icon: <Briefcase />, title: '마이비즈 (My Biz) 서비스', desc: '전자세금계산서 무제한 무료 발행 등', minSpend: 0, rate: 0, extendedDesc: ['카드 이용내역 부가세 환급예상액 조회 지원', '발급 시 즉시 무실적 제공'] },
      { id: 'tb_8_psh', icon: <Plane />, title: '티타늄 서비스 (라운지/발레)', desc: '공항 라운지 무료 및 발레파킹', minSpend: 300000, rate: 0, extendedDesc: ['인천공항 마티나/스카이허브 라운지 연 2회', '공항/호텔 발레파킹 월 3회 (연 12회)'] }
    ]
  },
  {
    id: 11,
    name: '탄탄대로 Biz 티타늄카드 (김민정)',
    company: 'KB국민카드',
    type: '할인·적립',
    tags: ['KB국민카드', 'K-WORLD', '티타늄', '사업지원'],
    color: 'bg-[#98878F]',
    textColor: 'text-white',
    target: 400000,
    lastMonthSpend: 450000, 
    annualFee: 'K-World 4만원 / Master 4만원',
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [
      { tier: '40만원 이상', limit: '마트 1.5만 / 쇼핑 1.5만 / Basic 5천' },
      { tier: '80만원 이상', limit: '마트 2만 / 쇼핑 2만 / Basic 5천' }
    ],
    detailedBenefits: [
      { id: 'tb_1_kmj', icon: <Droplet />, title: '주유 리터당 110점 적립', desc: 'SK/GS칼텍스 주유소 및 충전소(LPG 포함)', minSpend: 400000, rate: 0.07, extendedDesc: ['월 이용금액 20만원 한도 내 적립 (초과분 불가)', '정유사 본사 고시 휘발유가 기준 변환 적립'] },
      { id: 'tb_2_kmj', icon: <ShoppingCart />, title: '마트 15%~20% 적립', desc: '이마트, 롯데마트, 홈플러스 및 하나로식자재', minSpend: 400000, rate: 0.15, extendedDesc: ['40만 이상 15%(한도 1.5만) / 80만 이상 20%(한도 2만)', '※ 트레이더스, 에브리데이, 롯데슈퍼 등 창고형/SSM 제외', '상품권 및 온라인몰 결제 제외'] },
      { id: 'tb_3_kmj', icon: <ShoppingBag />, title: '온라인쇼핑몰 15%~20% 적립', desc: 'G마켓, 옥션, 11번가, 인터파크, 롯데닷컴, 신세계몰', minSpend: 400000, rate: 0.15, extendedDesc: ['40만 이상 15%(한도 1.5만) / 80만 이상 20%(한도 2만)'] },
      { id: 'tb_4_kmj', icon: <Monitor />, title: '온라인몰 (플러스 O2O) 10%', desc: '배달의민족, 마켓컬리, 그린카 등 10% 적립', minSpend: 400000, rate: 0.1, extendedDesc: ['※ 반드시 KB Pay 앱 내 [플러스 O2O] 메뉴 경유 필수', '제휴사: 배민, 요기요, 컬리, 그린카, 교보문고, 집닥 등', '통합 월 한도 1만점'] },
      { id: 'tb_5_kmj', icon: <Wifi />, title: '통신/사회보험 10% 적립', desc: '4대보험 및 휴대폰 요금', minSpend: 400000, rate: 0.1, extendedDesc: ['건강/국민/고용/산재 자동납부', 'SKT/KT/LGU+ 통신요금', '월 적립한도 1만점'] },
      { id: 'tb_6_kmj', icon: <MoreHorizontal />, title: '가맹점 운영지원 10% 할인', desc: '정수기렌탈, 청소용역, 보안업종 등', minSpend: 400000, rate: 0.1, extendedDesc: ['코웨이, 청호나이스, SK매직 렌탈', '에스원 세콤, ADT 캡스 등'] },
      { id: 'tb_7_kmj', icon: <Briefcase />, title: '마이비즈 (My Biz) 서비스', desc: '전자세금계산서 무제한 무료 발행 등', minSpend: 0, rate: 0, extendedDesc: ['카드 이용내역 부가세 환급예상액 조회 지원', '발급 시 즉시 무실적 제공'] },
      { id: 'tb_8_kmj', icon: <Plane />, title: '티타늄 서비스 (라운지/발레)', desc: '공항 라운지 무료 및 발레파킹', minSpend: 300000, rate: 0, extendedDesc: ['인천공항 마티나/스카이허브 라운지 연 2회', '공항/호텔 발레파킹 월 3회 (연 12회)'] }
    ]
  },
  {
    id: 4,
    name: '다둥이 행복카드',
    company: '우리카드',
    type: '할인형',
    tags: ['우리카드', '서울시', '다자녀 지원'],
    color: 'bg-gradient-to-br from-sky-400 to-blue-500',
    textColor: 'text-white',
    target: 300000, 
    lastMonthSpend: 150000, 
    annualFee: '연회비 없음',
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [
      { tier: '10만원 이상', limit: '교통 3천원' },
      { tier: '20만원 이상', limit: '교통 3천원 + 마트 5천원' },
      { tier: '30만원 이상', limit: '교통 3천원 + 마트 5천원 + 학원/외식 등' }
    ],
    detailedBenefits: [
      { id: 'dh_1', icon: <MapPin />, title: '공공시설 이용료 할인 (무실적)', desc: '서울시 공영주차장 및 문화시설 할인', minSpend: 0, rate: 0.3, extendedDesc: ['공영주차장 30~50% 할인', '남산터널 혼잡통행료 면제', '문화시설 입장료 할인'] },
      { id: 'dh_2', icon: <Bus />, title: '대중교통 10% 할인 (10만 이상)', desc: '버스, 지하철 요금 청구 할인', minSpend: 100000, rate: 0.1, extendedDesc: ['월 할인 한도 3,000원'] },
      { id: 'dh_3', icon: <ShoppingCart />, title: '대형마트 5% 할인 (20만 이상)', desc: '이마트, 홈플러스, 롯데마트 5% 할인', minSpend: 200000, rate: 0.05, extendedDesc: ['월 할인 한도 5,000원', '※ 창고형/SSM 제외'] },
      { id: 'dh_4', icon: <BookOpen />, title: '전국 학원 5% 할인 (30만 이상)', desc: '입시, 보습, 외국어 학원 등', minSpend: 300000, rate: 0.05, extendedDesc: ['월 할인 한도 10,000원', '온라인 결제 제외'] },
      { id: 'dh_5', icon: <Coffee />, title: '스타벅스/외식 20% 할인 (30만 이상)', desc: '스타벅스 및 주요 패밀리레스토랑', minSpend: 300000, rate: 0.2, extendedDesc: ['스타벅스 월 2회 (회당 5천원 한도)', '아웃백, TGIF, VIPS 20% 할인'] },
      { id: 'dh_6', icon: <Ticket />, title: '놀이공원 50% 할인 (30만 이상)', desc: '에버랜드, 롯데월드, 서울랜드 등', minSpend: 300000, rate: 0.5, extendedDesc: ['본인 자유이용권 50% 현장할인', '통합 월 1회, 연 10회'] }
    ]
  },
  {
    id: 6,
    name: '카드의 정석 WOWRI',
    company: '우리카드',
    type: '포인트형',
    tags: ['우리카드', '모아포인트', '간편결제 추가적립'],
    color: 'bg-gradient-to-br from-teal-500 to-emerald-700',
    textColor: 'text-white',
    target: 300000, 
    lastMonthSpend: 310000, 
    annualFee: '국내 1만원 / 해외 1.2만원',
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [
      { tier: '30만원 이상', limit: '특별/추가 한도 1만점 (기본 무제한)' },
      { tier: '60만원 이상', limit: '특별/추가 한도 2만점 (기본 무제한)' },
      { tier: '120만원 이상', limit: '특별/추가 한도 5만점 (기본 무제한)' }
    ],
    detailedBenefits: [
      { id: 'wow_1', icon: <Wifi />, title: '이동통신/대중교통 5% 적립', desc: 'SKT, KT, LGU+ 자동이체 및 버스/지하철', minSpend: 300000, rate: 0.05, extendedDesc: ['전기차 충전소 포함', '결합상품 제외(순수 통신요금만)', '통합 월 한도 실적별 차등 적용'] },
      { id: 'wow_2', icon: <Coffee />, title: '커피/영화 3% 적립', desc: '스타벅스, 투썸, CGV, 롯데시네마', minSpend: 300000, rate: 0.03, extendedDesc: ['백화점/대형마트 입점 매장 제외'] },
      { id: 'wow_3', icon: <ShoppingCart />, title: '백화점/마트/온라인 1% 적립', desc: '3대 백화점, 이마트, 쿠팡, G마켓 등', minSpend: 300000, rate: 0.01, extendedDesc: ['주유, 면세점, 해외 가맹점 포함'] },
      { id: 'wow_4', icon: <Smartphone />, title: '주요 간편결제 3% 추가 적립', desc: '네이버/카카오/PAYCO/SSGPAY 결제 시', minSpend: 300000, rate: 0.03, extendedDesc: ['온라인/오프라인 모두 적용', '기본/특별 적립과 중복 적용 시 최고 8%'] }
    ]
  },
  {
    id: 9,
    name: '카드의 정석 SHOPPING',
    company: '우리카드',
    type: '할인형',
    tags: ['우리카드', '쇼핑특화', '15%할인'],
    color: 'bg-gradient-to-br from-red-500 to-red-700',
    textColor: 'text-white',
    target: 300000, 
    lastMonthSpend: 350000, 
    annualFee: '국내 1만원 / 해외 1.2만원',
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [
      { tier: '30만원 이상', limit: '온라인 4천 / 오프라인 6천' },
      { tier: '70만원 이상', limit: '온라인 8천 / 오프라인 1.2만' },
      { tier: '120만원 이상', limit: '온라인 1.6만 / 오프라인 2.4만' }
    ],
    detailedBenefits: [
      { id: 'shop_1', icon: <ShoppingBag />, title: '온라인 쇼핑 10% 할인', desc: 'G마켓, 옥션, 11번가, 쿠팡, 티몬 등', minSpend: 300000, rate: 0.1, extendedDesc: ['매출 건당 5만원까지 할인 적용', '온라인 통합 한도 내 적용'] },
      { id: 'shop_2', icon: <Smartphone />, title: '4대 PAY 결제 5% 추가할인', desc: '삼성/네이버/카카오/페이코 온라인 결제 시', minSpend: 300000, rate: 0.05, extendedDesc: ['온라인 쇼핑 10%와 중복 시 총 15% 할인'] },
      { id: 'shop_3', icon: <ShoppingCart />, title: '오프라인 쇼핑 10% 할인', desc: '백화점, 대형마트, 아울렛, 올리브영 등', minSpend: 300000, rate: 0.1, extendedDesc: ['트레이더스, 롯데VIC마켓, 이케아 포함', '다이소, CU, GS25 편의점 포함'] },
      { id: 'shop_4', icon: <Droplet />, title: '주말 주유 / 스타벅스 할인', desc: '주말 리터당 60원 / 커피 10%', minSpend: 300000, rate: 0.04, extendedDesc: ['주유: 4대 주유소 (LPG제외) 토/일 한정', '스타벅스/폴바셋 10% (한도 5천원)'] }
    ]
  },
  {
    id: 7,
    name: 'G마켓 삼성카드',
    company: '삼성카드',
    type: '포인트형',
    tags: ['삼성카드', 'G마켓/옥션', 'SmilePay'],
    color: 'bg-gradient-to-br from-green-500 to-green-700',
    textColor: 'text-white',
    target: 200000, 
    lastMonthSpend: 250000, 
    annualFee: '국내/해외 1만원',
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [
      { tier: '20만원 이상', limit: '적립 1만점 / 커피 5천 / 교통 5천' },
      { tier: '50만원 이상', limit: '적립 2만점 / 커피 5천 / 교통 5천' },
      { tier: '100만원 이상', limit: '적립 3만점 / 커피 5천 / 교통 5천' }
    ],
    detailedBenefits: [
      { id: 'gs_1', icon: <ShoppingBag />, title: 'SmilePay 기본적립 (무실적)', desc: 'G마켓, 옥션 스마일페이 결제 시 1% 적립', minSpend: 0, rate: 0.01, extendedDesc: ['무제한 적립 (일반 결제 시 0.5%)'] },
      { id: 'gs_2', icon: <ShoppingBag />, title: 'SmilePay 10% 특별적립 (20만 이상)', desc: 'G마켓, 옥션 스마일페이 결제 시 10% 적립', minSpend: 200000, rate: 0.1, extendedDesc: ['한도: 1만(20만 이상), 2만(50만 이상), 3만(100만 이상)'] },
      { id: 'gs_3', icon: <Coffee />, title: '커피전문점 20% 할인 (20만 이상)', desc: '스타벅스, 이디야, 투썸플레이스', minSpend: 200000, rate: 0.2, extendedDesc: ['통합 월 할인 한도 5,000원'] },
      { id: 'gs_4', icon: <Bus />, title: '대중교통 8% 할인 (20만 이상)', desc: '버스, 지하철 청구 할인', minSpend: 200000, rate: 0.08, extendedDesc: ['통합 월 할인 한도 5,000원 (시외/고속버스 제외)'] }
    ]
  },
  {
    id: 10,
    name: 'MG+ W 하나카드',
    company: '하나카드',
    type: '할인형',
    tags: ['하나카드', 'MG새마을금고', '생활밀착'],
    color: 'bg-gradient-to-br from-[#62A674] to-[#458C5B]',
    textColor: 'text-white',
    target: 300000,
    lastMonthSpend: 350000, 
    annualFee: '국내외 1.2만원',
    benefitSpending: {}, 
    savedAmount: 0,
    limitTable: [
      { tier: '30만원 이상', limit: '통합 할인 한도 10,000원' },
      { tier: '60만원 이상', limit: '통합 할인 한도 20,000원' },
      { tier: '100만원 이상', limit: '통합 할인 한도 40,000원' }
    ],
    detailedBenefits: [
      { id: 'mg_1', icon: <ShoppingBag />, title: '쇼핑 5% 청구할인', desc: '마트, 홈쇼핑, 다이소, 올리브영 등', minSpend: 300000, rate: 0.05, extendedDesc: ['이마트/롯데/홈플러스 (오프라인)', 'GS/롯데/현대 등 홈쇼핑', '※ 백화점/할인점 내 임대매장 및 창고형 매장 제외'] },
      { id: 'mg_2', icon: <BookOpen />, title: '학원 5% 청구할인', desc: '전국 일반 학원 업종', minSpend: 300000, rate: 0.05, extendedDesc: ['입시/보습, 예체능, 외국어학원 등', '오프라인 결제 건'] },
      { id: 'mg_3', icon: <Stethoscope />, title: '병원/약국 5% 청구할인', desc: '전국 모든 병원 및 약국', minSpend: 300000, rate: 0.05, extendedDesc: ['종합/일반/한방/치과 등 오프라인 결제'] },
      { id: 'mg_4', icon: <Scissors />, title: '여가생활 5% 청구할인', desc: '골프, 헬스, 헤어샵, 스포츠용품', minSpend: 300000, rate: 0.05, extendedDesc: ['당구장 포함, 공립 기관 제외'] },
      { id: 'mg_5', icon: <Building />, title: '새마을금고 수수료 면제', desc: 'ATM 출금 및 타행 이체 면제', minSpend: 300000, rate: 0, extendedDesc: ['타행 이체 월 10회 면제'] }
    ]
  },
  {
    id: 8,
    name: '원더카드 2.0 free',
    company: '하나카드',
    type: '할인형',
    tags: ['하나카드', '무실적', '1.2%할인'],
    color: 'bg-teal-400',
    textColor: 'text-gray-900',
    target: 0, 
    lastMonthSpend: 0, 
    annualFee: '1.2만원',
    benefitSpending: {}, 
    savedAmount: 0,
    limitTable: [{ tier: '무실적', limit: '할인 한도 무제한' }],
    detailedBenefits: [
      { id: 'wd_1', icon: <Globe />, title: '전가맹점 0.7% 기본 할인', desc: '실적 조건 없이 무제한', minSpend: 0, rate: 0.007, extendedDesc: ['세금, 상품권, 관리비 등 제외'] },
      { id: 'wd_2', icon: <Smartphone />, title: '온라인 간편결제 1.2% 할인', desc: '하나/네이버/카카오/삼성페이 등', minSpend: 0, rate: 0.012, extendedDesc: ['무실적/무제한 할인', '오프라인 삼성페이 포함'] },
      { id: 'wd_3', icon: <ShoppingCart />, title: '대형마트/온라인쇼핑 1.2% 할인', desc: '마트, 트레이더스, 코스트코 등', minSpend: 0, rate: 0.012, extendedDesc: ['🔥 창고형 마트(트레이더스/코스트코) 포함 무제한 할인', '쿠팡, 11번가, SSG 등 포함'] }
    ]
  },
  {
    id: 3,
    name: '카카오뱅크 신한카드',
    company: '신한카드',
    type: '캐시백형',
    tags: ['신한카드', '카카오뱅크', '캐시백'],
    color: 'bg-yellow-400',
    textColor: 'text-gray-900',
    target: 0,
    lastMonthSpend: 0,
    annualFee: '1.5만원',
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{tier: '무실적', limit: '월 최대 5만원 캐시백'}],
    detailedBenefits: [
      { id: 'kb_k1', icon: <Globe />, title: '결제횟수 캐시백 (짭모아)', desc: '5천원 이상 10번마다 캐시백 증액', minSpend: 0, rate: 0.01, extendedDesc: ['동일 가맹점 1일 1회 카운트'] },
      { id: 'kb_k2', icon: <Utensils />, title: '배달앱/카카오T 3천원 캐시백', desc: '배민, 요기요, 카카오T 이용 시', minSpend: 0, rate: 0.1, extendedDesc: ['5천원 이상 결제 시 3천원 (월 2회)'] }
    ]
  },
  {
    id: 5,
    name: '국민 톡톡 my point',
    company: 'KB국민카드',
    type: '포인트형',
    tags: ['KB국민카드', '무실적', 'KB Pay'],
    color: 'bg-orange-500',
    textColor: 'text-white',
    target: 0,
    lastMonthSpend: 0,
    annualFee: '1.2만원',
    benefitSpending: {},
    savedAmount: 0,
    limitTable: [{tier: '무실적', limit: 'KB Pay 추가 1만점 / 기본 무제한'}],
    detailedBenefits: [
      { id: 'kb_tok1', icon: <Globe />, title: '기본 0.5% 적립', desc: '전 가맹점 무실적/무제한 적립', minSpend: 0, rate: 0.005, extendedDesc: ['국내외 전가맹점'] },
      { id: 'kb_tok2', icon: <Smartphone />, title: 'KB Pay 5% 특별 적립', desc: 'KB Pay 온/오프라인 결제 시', minSpend: 0, rate: 0.05, extendedDesc: ['기본 적립 포함 총 5.5% (월 1만점)'] }
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

  // --- Auth and Real-time Fetching ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        setIsSyncing(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        setCards(prev => prev.map(card => {
          const cId = String(card.id);
          const savedLM = cloudData.lastMonthSpends?.[cId];
          const savedBS = cloudData.benefitSpending?.[cId];
          
          let calcSaved = 0;
          if (savedBS) {
            Object.entries(savedBS).forEach(([b_id, hist]) => {
              const b = card.detailedBenefits.find(x => x.id === b_id);
              calcSaved += hist.reduce((s, h) => s + h.amount, 0) * (b?.rate || 0);
            });
          }
          return {
            ...card,
            lastMonthSpend: savedLM !== undefined ? savedLM : card.lastMonthSpend,
            benefitSpending: savedBS || card.benefitSpending,
            savedAmount: calcSaved
          };
        }));
      }
      setIsSyncing(false);
    }, () => setIsSyncing(false));
    return () => unsubscribe();
  }, [user]);

  // --- Helpers ---
  const saveToCloud = async (newCards) => {
    if (!user) return;
    const data = { lastMonthSpends: {}, benefitSpending: {} };
    newCards.forEach(c => {
      data.lastMonthSpends[String(c.id)] = c.lastMonthSpend;
      data.benefitSpending[String(c.id)] = c.benefitSpending;
    });
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'data'), data);
  };

  const addSpending = (cardId, benefitId, amt) => {
    if (!amt || amt <= 0) return;
    const newCards = cards.map(c => {
      if (c.id === cardId) {
        const hist = c.benefitSpending[benefitId] || [];
        const newHist = [...hist, { id: Date.now(), amount: parseInt(amt), date: new Date().toLocaleDateString() }];
        const rate = c.detailedBenefits.find(b => b.id === benefitId)?.rate || 0;
        return {
          ...c,
          benefitSpending: { ...c.benefitSpending, [benefitId]: newHist },
          savedAmount: c.savedAmount + (parseInt(amt) * rate)
        };
      }
      return c;
    });
    setCards(newCards);
    saveToCloud(newCards);
    setToastMsg('☁️ 클라우드에 저장되었습니다.');
    setTimeout(() => setToastMsg(''), 2000);
  };

  const updateLM = (cardId, val) => {
    const newCards = cards.map(c => c.id === cardId ? { ...c, lastMonthSpend: parseInt(val) || 0 } : c);
    setCards(newCards);
    saveToCloud(newCards);
  };

  const calculateSpend = (card) => Object.values(card.benefitSpending).flat().reduce((s, i) => s + i.amount, 0);
  const totalSpend = cards.reduce((s, c) => s + calculateSpend(c), 0);
  const totalSaved = cards.reduce((s, c) => s + c.savedAmount, 0);
  const formatWon = (n) => new Intl.NumberFormat('ko-KR').format(n) + '원';

  // --- Sub-components ---
  const CardDetail = ({ id, onClose }) => {
    const card = cards.find(c => c.id === id);
    const [lmVal, setLMVal] = useState(card.lastMonthSpend);
    if (!card) return null;

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto pb-safe animate-in slide-in-from-right duration-300">
        <header className="sticky top-0 bg-white/90 backdrop-blur px-5 py-4 border-b flex items-center">
          <button onClick={onClose} className="p-2 -ml-2 text-gray-800"><ChevronLeft size={28}/></button>
          <h3 className="ml-2 font-black uppercase text-gray-500 text-xs">Benefit Detail</h3>
        </header>
        <div className="p-6">
          <div className={`${card.color} rounded-[32px] p-6 mb-6 shadow-lg text-white`}>
            <p className="text-[10px] font-black opacity-80 mb-1">{card.company}</p>
            <h2 className="text-xl font-black mb-6">{card.name}</h2>
            <div className="flex justify-between items-end">
              <div><p className="text-[10px] font-black opacity-70">실적 합계</p><p className="text-2xl font-black">{formatWon(calculateSpend(card))}</p></div>
              <div className="text-right"><p className="text-[10px] font-black opacity-70">누적 혜택</p><p className="text-lg font-black">{formatWon(card.savedAmount)}</p></div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-5 mb-8">
            <p className="text-[11px] font-black text-indigo-400 mb-2">직전달 실적 기입</p>
            <div className="flex items-center space-x-3">
              <input type="number" value={lmVal} onChange={e => setLMVal(e.target.value)} onBlur={() => updateLM(id, lmVal)} className="flex-1 bg-white border-2 border-indigo-100 rounded-xl px-4 py-2 font-black text-indigo-700"/>
              <span className="font-bold text-indigo-600">원</span>
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="font-black text-lg flex items-center"><Receipt size={20} className="mr-2 text-indigo-600"/> 지출 내역 입력</h4>
            {card.detailedBenefits.map(db => {
              const isActive = card.lastMonthSpend >= db.minSpend;
              const [amt, setAmt] = useState('');
              const hist = card.benefitSpending[db.id] || [];
              const sum = hist.reduce((s, h) => s + h.amount, 0);

              return (
                <div key={db.id} className={isActive ? "opacity-100" : "opacity-30 grayscale pointer-events-none"}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-black text-[15px]">{db.title}</h5>
                      <p className="text-xs text-gray-500">{db.desc}</p>
                    </div>
                    {isActive ? <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">적용중</span> : <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-bold">{formatWon(db.minSpend)} 필요</span>}
                  </div>
                  {isActive && (
                    <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex justify-between mb-3 items-center"><span className="text-[10px] font-black text-gray-400">항목 합계: {formatWon(sum)}</span><span className="text-[10px] font-black text-indigo-600">혜택: {formatWon(sum * db.rate)}</span></div>
                      <div className="flex space-x-2">
                        <input type="number" value={amt} onChange={e => setAmt(e.target.value)} placeholder="금액 입력" className="flex-1 px-4 py-2 rounded-xl text-sm border-none bg-white font-bold"/>
                        <button onClick={() => { addSpending(id, db.id, amt); setAmt(''); }} className="bg-indigo-600 text-white p-2 rounded-xl"><Plus/></button>
                      </div>
                      {hist.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-dashed max-h-24 overflow-y-auto space-y-1">
                          {hist.map(h => <div key={h.id} className="flex justify-between text-[11px] text-gray-500"><span>{h.date}</span><span className="font-bold">{formatWon(h.amount)}</span></div>)}
                        </div>
                      )}
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

  if (isSyncing) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/><p className="font-black text-gray-400">동기화 중...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col relative shadow-2xl overflow-hidden">
        <header className="px-6 pt-12 pb-4 bg-white sticky top-0 z-20 flex justify-between items-center">
          <h1 className="text-xl font-black">Smart<span className="text-indigo-600">Card</span></h1>
          <Cloud className={user ? "text-green-500" : "text-gray-300"} size={20}/>
        </header>

        <main className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
          {activeTab === 'cards' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
              <div className="flex justify-between items-end"><h2 className="text-2xl font-black">내 카드 지갑</h2><span className="text-[10px] text-gray-400 font-bold">터치하여 관리</span></div>
              <div className="space-y-4">
                {cards.map(c => {
                  const s = calculateSpend(c);
                  const met = c.target === 0 || s >= c.target;
                  return (
                    <div key={c.id} onClick={() => setSelectedDetailCardId(c.id)} className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className={`${c.color} w-16 h-10 rounded-lg shadow-inner`}></div>
                        <div className="flex-1"><p className="text-[9px] text-gray-400 font-black uppercase">{c.company}</p><h3 className="font-black text-[15px]">{c.name}</h3></div>
                        <ChevronRight className="text-gray-300"/>
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="text-[11px] font-black text-gray-400">지출: {formatWon(s)}</span>
                        <span className={`text-[11px] font-black ${met ? 'text-green-500' : 'text-indigo-500'}`}>{met ? '실적 충족' : `부족 ${formatWon(c.target - s)}`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pt-4">
              <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-xl">
                <p className="text-[10px] font-black uppercase opacity-70 mb-2">통합 지출 리포트</p>
                <h3 className="text-4xl font-black mb-4">{formatWon(totalSpend)}</h3>
                <div className="flex items-center bg-white/20 w-fit px-3 py-1 rounded-lg">
                  <TrendingUp size={16} className="mr-1.5"/><span className="text-sm font-bold">누적 혜택: {formatWon(totalSaved)}</span>
                </div>
              </div>
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 max-w-md w-full bg-white/90 backdrop-blur-lg border-t px-10 py-4 flex justify-between items-center pb-safe">
          <button onClick={() => setActiveTab('cards')} className={`flex flex-col items-center ${activeTab === 'cards' ? 'text-indigo-600' : 'text-gray-300'}`}><CreditCard/><span className="text-[10px] font-black mt-1">CARDS</span></button>
          <button onClick={() => setActiveTab('smartPick')} className="flex flex-col items-center -mt-10"><div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl"><Sparkles/></div><span className="text-[10px] font-black mt-1 text-indigo-600">SMART</span></button>
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center ${activeTab === 'home' ? 'text-indigo-600' : 'text-gray-300'}`}><Home/><span className="text-[10px] font-black mt-1">REPORT</span></button>
        </nav>

        {selectedDetailCardId && <CardDetail id={selectedDetailCardId} onClose={() => setSelectedDetailCardId(null)}/>}
        {toastMsg && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-2xl z-50 animate-in slide-in-from-bottom-4">{toastMsg}</div>}
      </div>
      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .custom-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        body { -webkit-tap-highlight-color: transparent; }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
}