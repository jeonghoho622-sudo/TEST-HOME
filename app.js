import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
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

const authPage = document.getElementById("authPage");
const mainPage = document.getElementById("mainPage");
const schedulePage = document.getElementById("schedulePage");
const newsPage = document.getElementById("newsPage");
const photoPage = document.getElementById("photoPage");

const nameInput = document.getElementById("name");
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

function hideAllPages() {
  authPage.classList.add("hidden");
  mainPage.classList.add("hidden");
  schedulePage.classList.add("hidden");
  newsPage.classList.add("hidden");
  photoPage.classList.add("hidden");
}

function showMainPage(user) {
  hideAllPages();
  mainPage.classList.remove("hidden");

  const name = user.displayName || "방문자";
  welcomeText.textContent = `${name}님, 복어 홈페이지에 오신 것을 환영합니다!`;
}

// 회원가입: 이름 필요
signupBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) {
    message.textContent = "이름, 이메일, 비밀번호를 모두 입력해 주세요.";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(userCredential.user, {
      displayName: name
    });

    message.textContent = "회원가입이 완료되었습니다.";
  } catch (error) {
    message.textContent = `회원가입 실패: ${error.message}`;
    console.error("회원가입 오류:", error);
  }
});

// 로그인: 이름 필요 없음
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

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    alert(`로그아웃 실패: ${error.message}`);
    console.error("로그아웃 오류:", error);
  }
});

scheduleBtn.addEventListener("click", () => {
  hideAllPages();
  schedulePage.classList.remove("hidden");
});

newsBtn.addEventListener("click", () => {
  hideAllPages();
  newsPage.classList.remove("hidden");
});

photoBtn.addEventListener("click", () => {
  hideAllPages();
  photoPage.classList.remove("hidden");
});

backBtns.forEach((button) => {
  button.addEventListener("click", () => {
    const user = auth.currentUser;
    if (user) showMainPage(user);
  });
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    showMainPage(user);
  } else {
    hideAllPages();
    authPage.classList.remove("hidden");
    nameInput.value = "";
    emailInput.value = "";
    passwordInput.value = "";
    message.textContent = "이메일과 비밀번호를 입력해 주세요.";
  }
});