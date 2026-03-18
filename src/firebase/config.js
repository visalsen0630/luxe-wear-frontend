import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyD37RiCE0QSvxVswilimCtwvq66WEua_kw",
  authDomain: "luxe-waer.firebaseapp.com",
  projectId: "luxe-waer",
  storageBucket: "luxe-waer.firebasestorage.app",
  messagingSenderId: "417104561389",
  appId: "1:417104561389:web:e96c95661eda4e957df8e4",
  measurementId: "G-KVGQMELC48"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
