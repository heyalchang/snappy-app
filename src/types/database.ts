export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_emoji: string | null;
          avatar_color: string | null;
          snap_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          display_name?: string | null;
          avatar_emoji?: string | null;
          avatar_color?: string | null;
          snap_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_emoji?: string | null;
          avatar_color?: string | null;
          snap_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          room_id: string;
          sender_id: string;
          content: string | null;
          type: 'text' | 'photo' | 'video';
          media_url: string | null;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          sender_id: string;
          content?: string | null;
          type?: 'text' | 'photo' | 'video';
          media_url?: string | null;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          sender_id?: string;
          content?: string | null;
          type?: 'text' | 'photo' | 'video';
          media_url?: string | null;
          created_at?: string;
          read_at?: string | null;
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