import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import path from "path";
import OpenAI from "openai";
import serverless from "serverless-http";

const app = express();

const corsOption = {
  origin: "https://content-solution.netlify.app",
  credential: true,
};

app.use(cors(corsOption));
// app.use(cors());

// dotenv세팅
const __dirname = path.resolve();
dotenv.config({ path: __dirname + "/.env" });

// json데이터를 자바스크립트 객체로 변환
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const initialContent = (contentInfo, buisnessInfo) => {
  const initPrompt = `
  자본이 없고 아이디어만 있는 학생, 지역주민, 예비창업자, 초기창업자를 대상으로
  콘텐츠를 활용한 창업기획을 해주고 싶어
  위 설문지 답변을 토대로 아래(a.) 질문 답변을 해줘
  (a.)
  
  1) 사업개요
  (1) 회사명
  답변 \`${contentInfo.bestSkill}\`, \`${contentInfo.reason}\`, \`${contentInfo.keywords}\`를 참고해서 6자 이하의 회사명을 작성
  
  (2) 업종
  답변 \`${contentInfo.bestSkill}\`, \`${contentInfo.reason}\`, \`${contentInfo.keywords}\`를 참고해서 가장 적합한 업종 작성
  -출판업, 광고대행업은 부업종으로 무조건 작성
  
  (3) 사업배경
  답변 \`${contentInfo.bestSkill}\`, \`${contentInfo.reason}\`, \`${contentInfo.keywords}\`, \`${buisnessInfo.targetCustomer}\`를 참고해서 콘텐츠가 필요한 이유를 사회적 배경과 국내현황을 근거로 설명해줘
  
  2) 주요상품
  (1) 콘텐츠 소개
  답변 \`${contentInfo.gender.text}\`, \`${contentInfo.bestSkill}\`, \`${contentInfo.reason}\`, \`${contentInfo.keywords}\`를 참고해서 나의 콘텐츠를 고급화, 사업화, 전문화해서 설명해줘
  
  (2) 콘텐츠 특장점
  답변 \`${contentInfo.gender.text}\`, \`${contentInfo.bestSkill}\`, \`${contentInfo.reason}\`, \`${contentInfo.keywords}\`와 위 콘텐츠 소개를 참고해서 차별화된 특장점을 가상으로 작성해줘
  
  (3) 보유인력 (3명) 및 장비
  콘텐츠를 사업화하는데 필요한 인력과 장비를 작성해줘(마케터,프로그래머,편집,디자인)
  
  3) 목표시장
  (1) 목표고객
  답변 \`${contentInfo.gender.text}\`, \`${buisnessInfo.startupStage.text}\`, \`${buisnessInfo.targetCustomer}\`를 참고해서 목표고객을 작성해줘(성별,연령,직업)
  
  (2) 시장규모
  답변 \`${contentInfo.gender.text}\`, \`${buisnessInfo.promotionMethod}\`, \`${buisnessInfo.targetCustomer}\`, \`${buisnessInfo.mainRevenue}\`을 참고해서 시장규모를 알려줘
  
  (3) 향후전망
  답변 \`${buisnessInfo.promotionMethod}\`, \`${buisnessInfo.targetCustomer}\`, \`${buisnessInfo.mainRevenue}\`을 참고해서 향후전망을 알려줘
  
  4) 홍보채널
  (1) 홍보 채널
  답변 \`${buisnessInfo.promotionMethod}\`, \`${buisnessInfo.targetCustomer}\`, \`${buisnessInfo.mainRevenue}\`을 참고해서 채널을 추천해줘(인스타,블로그,스레드,유튜브,틱톡)
  
  (2) 카피라이팅 예시[300자]
  위 홍보채널을 참고해서 채널에 사용할 카피라이팅을 알려줘
  
  5) 수익모델
  (1) B2C 수익모델
  답변 \`${buisnessInfo.promotionMethod}\`, \`${buisnessInfo.targetCustomer}\`, \`${buisnessInfo.mainRevenue}\`을 참고해서 수익모델을 추천해줘
  
  (2) 정부지원 신청
  답변 \`${buisnessInfo.startupStage.text}\`를 참고해서 아래 정부지원을 추천해줘
  -예비창업자:예비창업패키지, 공모, 경진
  -초기창업자:초기창업패키지, 입주지원사업
  -여성인 경우: 여성창업경진대회
  
  (3) AI를 활용한 솔루션 개발전략
  답변 \`${contentInfo.gender.text}\`, \`${contentInfo.bestSkill}\`, \`${contentInfo.reason}\`, \`${contentInfo.keywords}\`, \`${buisnessInfo.startupStage.text}\`, \`${buisnessInfo.promotionMethod}\`, \`${buisnessInfo.targetCustomer}\`, \`${buisnessInfo.mainRevenue}\`을 참고해서
  `;

  return initPrompt;
};

// This code is for v4 of the openai package: npmjs.com/package/openai

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// const exampleUserMessage = {
//   role: 'user',
//   content: '안녕?'
// }

app.post("/message", async (req, res) => {
  const { userMessage, messages } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [...messages, userMessage],
    temperature: 1,
    max_tokens: 256,
    top_p: 1,
  });

  const data = response.choices[0].message;
  res.json({ data });
});

const initialMessage = (contentInfo, buisnessInfo) => {
  return [
    {
      role: "system",
      content: initialContent(contentInfo, buisnessInfo),
    },
    {
      role: "user",
      content: initialContent(contentInfo, buisnessInfo),
    },
    {
      role: "assistant",
      content: initialContent(contentInfo, buisnessInfo),
    },
    {
      role: "assistant",
      content: initialContent(contentInfo, buisnessInfo),
    },
  ];
};

app.post("/info", async (req, res) => {
  const { contentInfo, buisnessInfo } = req.body;
  const messages = initialMessage(contentInfo, buisnessInfo);
  console.log("🚀messages:", messages);

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 1,
    max_tokens: 256,
    top_p: 1,
  });
  console.log("🚀 response:", response);

  const data = [...messages, response.choices[0].message];
  res.json({ data });
});

// app.listen("8080");
export const handler = serverless(app);
