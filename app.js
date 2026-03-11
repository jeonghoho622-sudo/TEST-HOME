import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

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

// 페이지 요소
const authPage = document.getElementById("authPage");
const mainPage = document.getElementById("mainPage");
const schedulePage = document.getElementById("schedulePage");
const newsPage = document.getElementById("newsPage");
const photoPage = document.getElementById("photoPage");

// 입력/버튼 요소
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const message = document.getElementById("message");
const welcomeText = document.getElementById("welcomeText");

const scheduleBtn = document.getElementById("scheduleBtn");
const newsBtn = document.getElementById("newsBtn");
const photoBtn = document.getElementById("photoBtn");
const backBtns = document.querySelectorAll(".backBtn");

// 모든 페이지 숨기기
function hideAllPages() {
  if (authPage) authPage.classList.add("hidden");
  if (mainPage) mainPage.classList.add("hidden");
  if (schedulePage) schedulePage.classList.add("hidden");
  if (newsPage) newsPage.classList.add("hidden");
  if (photoPage) photoPage.classList.add("hidden");
}

// 메인 화면 보기
function showMainPage(user) {
  hideAllPages();
  if (mainPage) mainPage.classList.remove("hidden");
  if (welcomeText && user) {
    welcomeText.textContent = `${user.email}님, 복어 홈페이지에 오신 것을 환영합니다!`;
  }
}

// 회원가입
if (signupBtn) {
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
      console.error("회원가입 오류:", error);
    }
  });
}

// 로그인
if (loginBtn) {
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
      console.error("로그인 오류:", error);
    }
  });
}

// 로그아웃
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (error) {
      alert(`로그아웃 실패: ${error.message}`);
      console.error("로그아웃 오류:", error);
    }
  });
}

// 메뉴 이동
if (scheduleBtn) {
  scheduleBtn.addEventListener("click", () => {
    hideAllPages();
    if (schedulePage) schedulePage.classList.remove("hidden");
  });
}

if (newsBtn) {
  newsBtn.addEventListener("click", () => {
    hideAllPages();
    if (newsPage) newsPage.classList.remove("hidden");
  });
}

if (photoBtn) {
  photoBtn.addEventListener("click", () => {
    hideAllPages();
    if (photoPage) photoPage.classList.remove("hidden");
  });
}

// 돌아가기 버튼
backBtns.forEach((button) => {
  button.addEventListener("click", () => {
    const user = auth.currentUser;
    showMainPage(user);
  });
});

// 로그인 상태 확인
onAuthStateChanged(auth, (user) => {
  if (user) {
    showMainPage(user);
  } else {
    hideAllPages();
    if (authPage) authPage.classList.remove("hidden");
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (message) message.textContent = "이메일과 비밀번호를 입력해 주세요.";
  }
});