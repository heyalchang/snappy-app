-- RPC function to create a friend request
CREATE OR REPLACE FUNCTION request_friend(requester_id UUID, recipient_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_request friendships%ROWTYPE;
  result JSON;
BEGIN
  -- Prevent self-friending
  IF requester_id = recipient_id THEN
    RETURN json_build_object('error', 'Cannot send friend request to yourself');
  END IF;

  -- Check if already friends
  SELECT * INTO existing_request 
  FROM friendships 
  WHERE user_id = requester_id 
    AND friend_id = recipient_id 
    AND status = 'accepted';
  
  IF FOUND THEN
    RETURN json_build_object('error', 'Already friends');
  END IF;

  -- Check for existing outbound request
  SELECT * INTO existing_request 
  FROM friendships 
  WHERE user_id = requester_id 
    AND friend_id = recipient_id 
    AND status = 'pending';
  
  IF FOUND THEN
    RETURN json_build_object('error', 'Friend request already sent');
  END IF;

  -- Check for reverse pending request (auto-accept scenario)
  SELECT * INTO existing_request 
  FROM friendships 
  WHERE user_id = recipient_id 
    AND friend_id = requester_id 
    AND status = 'pending';
  
  IF FOUND THEN
    -- Auto-accept by updating both directions to accepted
    UPDATE friendships 
    SET status = 'accepted' 
    WHERE user_id = recipient_id AND friend_id = requester_id;
    
    INSERT INTO friendships (user_id, friend_id, status)
    VALUES (requester_id, recipient_id, 'accepted')
    ON CONFLICT (user_id, friend_id) 
    DO UPDATE SET status = 'accepted';
    
    RETURN json_build_object('status', 'auto_accepted');
  END IF;
  
  -- Create new pending request
  INSERT INTO friendships (user_id, friend_id, status)
  VALUES (requester_id, recipient_id, 'pending');
  
  RETURN json_build_object('status', 'requested');
END;
$$;

-- RPC function to accept a friend request
CREATE OR REPLACE FUNCTION accept_friend(from_user_id UUID, to_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_request friendships%ROWTYPE;
BEGIN
  -- Verify pending request exists
  SELECT * INTO pending_request 
  FROM friendships 
  WHERE user_id = from_user_id 
    AND friend_id = to_user_id 
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'No pending friend request found');
  END IF;
  
  -- Update the request to accepted
  UPDATE friendships 
  SET status = 'accepted' 
  WHERE user_id = from_user_id 
    AND friend_id = to_user_id 
    AND status = 'pending';
  
  -- Insert reciprocal friendship
  INSERT INTO friendships (user_id, friend_id, status)
  VALUES (to_user_id, from_user_id, 'accepted')
  ON CONFLICT (user_id, friend_id) 
  DO UPDATE SET status = 'accepted';
  
  RETURN json_build_object('status', 'accepted');
END;
$$;

-- RPC function to reject a friend request
CREATE OR REPLACE FUNCTION reject_friend(from_user_id UUID, to_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the pending request
  DELETE FROM friendships
  WHERE user_id = from_user_id 
    AND friend_id = to_user_id 
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'No pending friend request found');
  END IF;
  
  RETURN json_build_object('status', 'rejected');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION request_friend TO anon, authenticated;
GRANT EXECUTE ON FUNCTION accept_friend TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reject_friend TO anon, authenticated;