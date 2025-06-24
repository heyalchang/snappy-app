export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string | null;
        };
      };
      friendships: {
        Row: {
          user_id: string;
          friend_id: string;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          friend_id: string;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          friend_id?: string;
          status?: string | null;
          created_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: number;
          sender_id: string | null;
          room_id: string | null;
          content: string | null;
          created_at: string | null;
          type: string | null;
          media_url: string | null;
        };
        Insert: {
          id?: number;
          sender_id?: string | null;
          room_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          type?: string | null;
          media_url?: string | null;
        };
        Update: {
          id?: number;
          sender_id?: string | null;
          room_id?: string | null;
          content?: string | null;
          created_at?: string | null;
          type?: string | null;
          media_url?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          media_url: string;
          media_type: 'photo' | 'video';
          caption: string | null;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_url: string;
          media_type: 'photo' | 'video';
          caption?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_url?: string;
          media_type?: 'photo' | 'video';
          caption?: string | null;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      post_viewers: {
        Row: {
          id: string;
          post_id: string;
          viewer_id: string;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          viewer_id: string;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          viewer_id?: string;
          viewed_at?: string;
        };
      };
      fake_profiles: {
        Row: {
          id: number;
          username: string;
          avatar_emoji: string;
          avatar_color: string;
          snap_score: number | null;
          has_story: boolean | null;
          story_caption: string | null;
          used: boolean | null;
        };
        Insert: {
          id?: number;
          username: string;
          avatar_emoji: string;
          avatar_color: string;
          snap_score?: number | null;
          has_story?: boolean | null;
          story_caption?: string | null;
          used?: boolean | null;
        };
        Update: {
          id?: number;
          username?: string;
          avatar_emoji?: string;
          avatar_color?: string;
          snap_score?: number | null;
          has_story?: boolean | null;
          story_caption?: string | null;
          used?: boolean | null;
        };
      };
      system_settings: {
        Row: {
          key: string;
          value: string;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string | null;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}