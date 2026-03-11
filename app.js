import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// 여기에 본인 Firebase 프로젝트 설정값 넣기
const firebaseConfig = {
  apiKey: "AIzaSyDaCMnOJmRZ7-6U8PCWeIR0zRaGWVKl16U",
  authDomain: "puffy-home.firebaseapp.com",
  databaseURL: "https://puffy-home-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "puffy-home",
  storageBucket: "puffy-home.firebasestorage.app",
  messagingSenderId: "169901178076",
  appId: "1:169901178076:web:4a5d6b117a77e48d2f4819",
  measurementId: "G-VC6LCTKCCM"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// HTML 요소
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const message = document.getElementById("message");
const userInfo = document.getElementById("userInfo");

// 회원가입
signupBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    message.textContent = "이메일과 비밀번호를 입력해 주세요.";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    message.textContent = `회원가입 성공: ${userCredential.user.email}`;
  } catch (error) {
    message.textContent = `회원가입 실패: ${error.message}`;
  }
});

// 로그인
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    message.textContent = "이메일과 비밀번호를 입력해 주세요.";
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    message.textContent = `로그인 성공: ${userCredential.user.email}`;
  } catch (error) {
    message.textContent = `로그인 실패: ${error.message}`;
  }
});

// 로그아웃
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    message.textContent = "로그아웃 되었습니다.";
  } catch (error) {
    message.textContent = `로그아웃 실패: ${error.message}`;
  }
});

// 로그인 상태 감지
onAuthStateChanged(auth, (user) => {
  if (user) {
    userInfo.textContent = `현재 로그인한 사용자: ${user.email}`;
  } else {
    userInfo.textContent = "현재 로그인한 사용자: 없음";
  }
});