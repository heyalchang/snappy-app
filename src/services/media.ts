import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

export const uploadMedia = async (
  uri: string,
  mediaType: 'photo' | 'video',
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Fetch the media file
    const response = await fetch(uri);
    const blob = await response.blob();

    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];

          // Create filename
          const timestamp = Date.now();
          const extension = mediaType === 'photo' ? 'jpg' : 'mp4';
          const filename = `${userId}_${timestamp}.${extension}`;
          const filePath = `snaps/${filename}`;

          // Upload to Supabase Storage
          onProgress?.(50); // Simulate progress
          
          const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, decode(base64Data), {
              contentType: mediaType === 'photo' ? 'image/jpeg' : 'video/mp4',
              upsert: false
            });

          if (error) throw error;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

          onProgress?.(100);
          resolve(publicUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
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
  recipients: string[] | 'story',
  userId: string
): Promise<string> => {
  try {
    // Create post in database
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        author_id: userId,
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption || null
      })
      .select()
      .single();

    if (postError) throw postError;

    // If sending to specific recipients (not story)
    if (recipients !== 'story' && Array.isArray(recipients)) {
      // Get recipient IDs from usernames
      const { data: recipientProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .in('username', recipients);

      if (profileError) throw profileError;

      // Create recipient entries
      const recipientEntries = recipientProfiles.map(profile => ({
        post_id: post.id,
        recipient_id: profile.id
      }));

      if (recipientEntries.length > 0) {
        const { error: recipientError } = await supabase
          .from('post_recipients')
          .insert(recipientEntries);

        if (recipientError) throw recipientError;
      }
    }

    return post.id;
  } catch (error) {
    console.error('Create snap error:', error);
    throw error;
  }
};

export const sendSnapToSelf = async (
  mediaUri: string,
  mediaType: 'photo' | 'video',
  caption: string,
  username: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // Upload media to Supabase Storage
    const mediaUrl = await uploadMedia(mediaUri, mediaType, user.id, onProgress);

    // Create snap document (send to self for testing)
    await createSnap(mediaUrl, mediaType, caption, [username], user.id);
  } catch (error) {
    console.error('Send snap error:', error);
    throw error;
  }
};