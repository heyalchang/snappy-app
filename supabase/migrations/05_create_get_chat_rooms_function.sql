
-- Drop the existing function if it exists to ensure a clean setup
drop function if exists get_chat_rooms(p_user_id uuid);

-- Create the new function to get chat rooms for a user
create or replace function get_chat_rooms(p_user_id uuid)
returns table (
    "roomId" text,
    "otherUserId" uuid,
    "lastMessage" json,
    "unreadCount" bigint,
    "otherUser" json
)
language plpgsql
as $$
begin
    return query
    with ranked_messages as (
        -- Rank messages in rooms the user is part of
        select
            m.room_id,
            m.id,
            m.content,
            m.type,
            m.media_url,
            m.created_at,
            m.read_at,
            m.sender_id,
            case
                when m.sender_id = p_user_id then m.recipient_id
                else m.sender_id
            end as other_user_id,
            row_number() over (partition by m.room_id order by m.created_at desc) as rn
        from messages m
        where m.sender_id = p_user_id or m.recipient_id = p_user_id
    ),
    last_messages as (
        -- Get only the latest message for each room
        select *
        from ranked_messages
        where rn = 1
    ),
    unread_counts as (
        -- Count unread messages for each room
        select
            room_id,
            count(*) as unread_count
        from messages
        where recipient_id = p_user_id and read_at is null
        group by room_id
    )
    -- Final selection and joins
    select
        lm.room_id as "roomId",
        lm.other_user_id as "otherUserId",
        json_build_object(
            'id', lm.id,
            'room_id', lm.room_id,
            'sender_id', lm.sender_id,
            'content', lm.content,
            'type', lm.type,
            'media_url', lm.media_url,
            'created_at', lm.created_at,
            'read_at', lm.read_at
        ) as "lastMessage",
        coalesce(uc.unread_count, 0) as "unreadCount",
        json_build_object(
            'id', p.id,
            'username', p.username,
            'avatar_emoji', p.avatar_emoji,
            'avatar_color', p.avatar_color
        ) as "otherUser"
    from last_messages lm
    left join unread_counts uc on lm.room_id = uc.room_id
    join profiles p on lm.other_user_id = p.id;
end;
$$;
