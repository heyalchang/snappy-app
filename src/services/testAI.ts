import { supabase } from './supabase';

// Test function to diagnose AI edge function issues
export async function testAIFunction() {
  console.log('=== Testing AI Edge Function ===');
  
  try {
    // 1. Test basic edge function invocation
    console.log('1. Testing basic edge function call...');
    const testPayload = {
      senderName: 'testuser1',
      senderPersona: 'A test user who likes testing.',
      senderAge: 20,
      recipientName: 'testuser2',
      recipientPersona: 'Another test user who responds well.',
      recipientAge: 21,
      recipientGoals: 'Be helpful and friendly.',
      messageThread: [
        {
          sender: 'testuser1',
          content: 'Hey, how are you?',
          timestamp: new Date().toISOString()
        }
      ]
    };

    console.log('Test payload:', JSON.stringify(testPayload, null, 2));
    
    const { data, error } = await supabase.functions.invoke('generate-chat-response', {
      body: testPayload
    });

    console.log('Response:', {
      data,
      error,
      hasData: !!data,
      dataType: typeof data,
      hasResponse: !!data?.response,
      responseValue: data?.response
    });

    if (error) {
      console.error('Edge function error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        details: error.details
      });
    }

    // 2. Test with minimal payload
    console.log('\n2. Testing with minimal payload...');
    const minimalPayload = {
      senderName: 'user1',
      senderPersona: 'Test',
      senderAge: 18,
      recipientName: 'user2',
      recipientPersona: 'Test',
      recipientAge: 18,
      recipientGoals: 'Test',
      messageThread: []
    };

    const { data: data2, error: error2 } = await supabase.functions.invoke('generate-chat-response', {
      body: minimalPayload
    });

    console.log('Minimal test response:', {
      data: data2,
      error: error2
    });

    // 3. Check edge function URL
    console.log('\n3. Edge function configuration:');
    console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('Functions URL:', supabase.functions.url);
    
    return { success: !error, data, error };
  } catch (err) {
    console.error('Test failed with exception:', err);
    return { success: false, error: err };
  }
}