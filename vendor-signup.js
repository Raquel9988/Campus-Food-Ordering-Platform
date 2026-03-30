import { app } from "./firebase.js";
import { getAuth, createUserWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";


const auth = getAuth(app);


const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const message = document.getElementById("message");


signupBtn.addEventListener("click", () => {

  const email = emailInput.value;
  const password = passwordInput.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      message.textContent = "Signup successful!";
      console.log(userCredential.user);
    })
    .catch((error) => {
      message.textContent = error.message;
      console.log(error);
    });

});