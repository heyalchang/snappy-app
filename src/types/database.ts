export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          snap_score: number | null;
          avatar_emoji: string | null;
          avatar_color: string | null;
          display_name: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          snap_score?: number | null;
          avatar_emoji?: string | null;
          avatar_color?: string | null;
          display_name?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          snap_score?: number | null;
          avatar_emoji?: string | null;
          avatar_color?: string | null;
          display_name?: string | null;
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
          author_id: string | null;
          media_url: string | null;
          media_type: string | null;
          caption: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          author_id?: string | null;
          media_url?: string | null;
          media_type?: string | null;
          caption?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          author_id?: string | null;
          media_url?: string | null;
          media_type?: string | null;
          caption?: string | null;
          created_at?: string | null;
        };
      };
      post_recipients: {
        Row: {
          post_id: string;
          recipient_id: string;
        };
        Insert: {
          post_id: string;
          recipient_id: string;
        };
        Update: {
          post_id?: string;
          recipient_id?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          name?: string;
          created_at?: string | null;
        };
      };
      group_members: {
        Row: {
          group_id: string;
          member_id: string;
        };
        Insert: {
          group_id: string;
          member_id: string;
        };
        Update: {
          group_id?: string;
          member_id?: string;
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