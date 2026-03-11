import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

/* --------------------
로그인 관련
-------------------- */

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authStateText = document.getElementById("authStateText");
const authUserText = document.getElementById("authUserText");
const authStatus = document.getElementById("authStatus");

function setStatus(el, msg, type="") {
  el.textContent = msg;
  el.className = "status";
  if(type) el.classList.add(type);
}

signupBtn.addEventListener("click", async () => {

  const email = authEmail.value.trim();
  const password = authPassword.value.trim();

  if(!email || !password){
    setStatus(authStatus,"이메일과 비밀번호 입력하세요","error");
    return;
  }

  try{
    await createUserWithEmailAndPassword(auth,email,password);
    setStatus(authStatus,"회원가입 성공","ok");
  }
  catch(e){
    setStatus(authStatus,e.message,"error");
  }

});


loginBtn.addEventListener("click", async () => {

  const email = authEmail.value.trim();
  const password = authPassword.value.trim();

  if(!email || !password){
    setStatus(authStatus,"이메일과 비밀번호 입력하세요","error");
    return;
  }

  try{
    await signInWithEmailAndPassword(auth,email,password);
    setStatus(authStatus,"로그인 성공","ok");
  }
  catch(e){
    setStatus(authStatus,e.message,"error");
  }

});


logoutBtn.addEventListener("click", async () => {

  await signOut(auth);

});


onAuthStateChanged(auth,(user)=>{

  currentUser = user;

  if(user){
    authStateText.textContent="현재 상태: 로그인됨";
    authUserText.textContent=user.email;
  }
  else{
    authStateText.textContent="현재 상태: 로그아웃";
    authUserText.textContent="로그인 필요";
  }

});


/* --------------------
인사말 저장
-------------------- */

const greetingInput = document.getElementById("greetingInput");
const saveGreetingBtn = document.getElementById("saveGreetingBtn");
const latestGreetings = document.getElementById("latestGreetings");
const allGreetings = document.getElementById("allGreetings");
const greetingStatus = document.getElementById("greetingStatus");

function requireLogin(){
  if(!currentUser){
    alert("로그인 먼저 해주세요");
    return false;
  }
  return true;
}

saveGreetingBtn.addEventListener("click", async ()=>{

  if(!requireLogin()) return;

  const text = greetingInput.value.trim();

  if(!text){
    setStatus(greetingStatus,"내용 입력하세요","error");
    return;
  }

  await addDoc(collection(db,"greetings"),{

    text:text,
    userEmail:currentUser.email,
    createdAt:Date.now()

  });

  greetingInput.value="";
  setStatus(greetingStatus,"저장 완료","ok");

});


const greetingQuery = query(
  collection(db,"greetings"),
  orderBy("createdAt","desc")
);

onSnapshot(greetingQuery,(snapshot)=>{

  latestGreetings.innerHTML="";
  allGreetings.innerHTML="";

  let count=0;

  snapshot.forEach(doc=>{

    const data = doc.data();

    const html=`
      <div class="item">
        <div class="item-top">
          <div class="item-title">${data.userEmail}</div>
          <div class="item-meta">${new Date(data.createdAt).toLocaleString()}</div>
        </div>
        <div class="item-body">${data.text}</div>
      </div>
    `;

    if(count<3){
      latestGreetings.innerHTML+=html;
    }

    allGreetings.innerHTML+=html;

    count++;

  });

});


/* --------------------
소식 저장
-------------------- */

const newsTitle = document.getElementById("newsTitle");
const newsBody = document.getElementById("newsBody");
const saveNewsBtn = document.getElementById("saveNewsBtn");
const newsList = document.getElementById("newsList");

saveNewsBtn.addEventListener("click", async ()=>{

  if(!requireLogin()) return;

  const title=newsTitle.value.trim();
  const body=newsBody.value.trim();

  if(!title || !body){
    alert("제목 내용 입력");
    return;
  }

  await addDoc(collection(db,"news"),{

    title,
    body,
    userEmail:currentUser.email,
    createdAt:Date.now()

  });

  newsTitle.value="";
  newsBody.value="";

});


const newsQuery=query(
  collection(db,"news"),
  orderBy("createdAt","desc")
);

onSnapshot(newsQuery,(snapshot)=>{

  newsList.innerHTML="";

  snapshot.forEach(doc=>{

    const data=doc.data();

    const html=`
    <div class="item">
      <div class="item-title">${data.title}</div>
      <div class="item-meta">${data.userEmail}</div>
      <div class="item-body">${data.body}</div>
    </div>
    `;

    newsList.innerHTML+=html;

  });

});