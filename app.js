import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// 네 Firebase 설정값으로 유지
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 요소 가져오기
const authBox = document.getElementById("authBox");
const welcomeBox = document.getElementById("welcomeBox");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const message = document.getElementById("message");
const welcomeText = document.getElementById("welcomeText");

// 회원가입
signupBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    message.textContent = "이메일과 비밀번호를 입력해 주세요.";
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    message.textContent = "회원가입이 완료되었습니다.";
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
    await signInWithEmailAndPassword(auth, email, password);
    message.textContent = "로그인 성공!";
  } catch (error) {
    message.textContent = `로그인 실패: ${error.message}`;
  }
});

// 로그아웃
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    alert(`로그아웃 실패: ${error.message}`);
  }
});

// 로그인 상태 확인
onAuthStateChanged(auth, (user) => {
  if (user) {
    authBox.classList.add("hidden");
    welcomeBox.classList.remove("hidden");
    welcomeText.textContent = `${user.email}님, 복어 홈페이지에 오신 것을 환영합니다!`;
  } else {
    authBox.classList.remove("hidden");
    welcomeBox.classList.add("hidden");
    welcomeText.textContent = "환영 메시지가 여기에 표시됩니다.";
    emailInput.value = "";
    passwordInput.value = "";
    message.textContent = "이메일과 비밀번호를 입력해 주세요.";
  }
});