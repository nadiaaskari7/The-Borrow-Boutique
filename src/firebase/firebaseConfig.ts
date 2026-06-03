import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyCEb2B1BcjHTYoRdj9t_10t3Q2-6_iGZEo",
  authDomain: "theborrowboutique-b7006.firebaseapp.com",
  projectId: "theborrowboutique-b7006",
  storageBucket: "theborrowboutique-b7006.firebasestorage.app",
  messagingSenderId: "484019945612",
  appId: "1:484019945612:web:394fb6311cd60f34277ba9"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
