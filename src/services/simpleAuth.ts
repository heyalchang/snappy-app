import { collection, doc, getDoc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { getDb } from './firebase';

interface UserData {
  username: string;
  password: string;
  displayName?: string;
  profilePhotoUrl?: string;
  friends: string[];
  createdAt: Date;
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const db = getDb();
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function signUp(username: string, password: string): Promise<UserData> {
  const db = getDb();
  
  // Check if username already exists
  const exists = await checkUsernameExists(username);
  
  // Create or update user document
  const userDoc = doc(db, 'users', username);
  const userData: UserData = {
    username,
    password, // In production, this would be hashed
    friends: [],
    createdAt: new Date(),
  };
  
  await setDoc(userDoc, userData, { merge: true });
  
  // If user existed, this acts as password reset
  if (exists) {
    console.log('Password updated for existing user:', username);
  }
  
  return userData;
}

export async function signIn(username: string, password: string): Promise<UserData | null> {
  const db = getDb();
  const userDoc = doc(db, 'users', username);
  const snapshot = await getDoc(userDoc);
  
  if (!snapshot.exists()) {
    throw new Error('User not found');
  }
  
  const userData = snapshot.data() as UserData;
  
  if (userData.password !== password) {
    throw new Error('Invalid password');
  }
  
  return userData;
}

export async function updateProfile(
  username: string, 
  updates: Partial<Pick<UserData, 'displayName' | 'profilePhotoUrl'>>
): Promise<void> {
  const db = getDb();
  const userDoc = doc(db, 'users', username);
  await setDoc(userDoc, updates, { merge: true });
}

export async function addFriend(username: string, friendUsername: string): Promise<void> {
  const db = getDb();
  
  // Check if friend exists
  const friendExists = await checkUsernameExists(friendUsername);
  if (!friendExists) {
    throw new Error('User not found');
  }
  
  // Get current user data
  const userDoc = doc(db, 'users', username);
  const snapshot = await getDoc(userDoc);
  
  if (!snapshot.exists()) {
    throw new Error('Current user not found');
  }
  
  const userData = snapshot.data() as UserData;
  const friends = userData.friends || [];
  
  // Add friend if not already in list
  if (!friends.includes(friendUsername)) {
    friends.push(friendUsername);
    await setDoc(userDoc, { friends }, { merge: true });
  }
}