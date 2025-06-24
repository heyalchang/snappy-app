import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getAuth, getDb, getStorage } from './firebase';
import { Snap } from '../types';

interface UploadProgress {
  progress: number;
  snapshot?: any;
}

export const uploadMedia = async (
  uri: string,
  mediaType: 'photo' | 'video',
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Fetch the media file
    const response = await fetch(uri);
    const blob = await response.blob();

    // Create storage reference
    const timestamp = Date.now();
    const auth = getAuth();
    const storage = getStorage();
    const userId = auth.currentUser?.uid || 'anonymous';
    const extension = mediaType === 'photo' ? 'jpg' : 'mp4';
    const filename = `${userId}_${timestamp}.${extension}`;
    const storageRef = ref(storage, `snaps/${filename}`);

    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, blob);

    // Return promise that resolves with download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Media upload error:', error);
    throw error;
  }
};

export const createSnap = async (
  mediaUrl: string,
  mediaType: 'photo' | 'video',
  caption: string,
  recipients: string[] | 'story'
): Promise<string> => {
  try {
    const auth = getAuth();
    const db = getDb();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    // Create snap document
    const snapRef = doc(collection(db, 'snaps'));
    const snapData = {
      snapId: snapRef.id,
      creatorId: userId,
      mediaUrl,
      mediaType,
      caption: caption || '',
      recipients,
      createdAt: serverTimestamp(),
      expiresAt: recipients === 'story' 
        ? Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 24 hours
        : Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days for direct snaps
      viewedBy: []
    };

    await setDoc(snapRef, snapData);
    return snapRef.id;
  } catch (error) {
    console.error('Create snap error:', error);
    throw error;
  }
};

export const sendSnapToSelf = async (
  mediaUri: string,
  mediaType: 'photo' | 'video',
  caption: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    const auth = getAuth();
    console.log('Auth object:', auth);
    console.log('Current user:', auth.currentUser);
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    // Upload media to Firebase Storage
    const mediaUrl = await uploadMedia(mediaUri, mediaType, onProgress);

    // Create snap document (send to self for testing)
    await createSnap(mediaUrl, mediaType, caption, [userId]);
  } catch (error) {
    console.error('Send snap error:', error);
    throw error;
  }
};