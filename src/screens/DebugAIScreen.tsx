import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { testAIFunction } from '../services/testAI';
import { supabase } from '../services/supabase';

export default function DebugAIScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const runTest = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog('Starting AI function test...');

    try {
      // Override console.log to capture logs
      const originalLog = console.log;
      const originalError = console.error;
      
      console.log = (...args) => {
        originalLog(...args);
        addLog(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' '));
      };
      
      console.error = (...args) => {
        originalError(...args);
        addLog(`ERROR: ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ')}`);
      };

      const result = await testAIFunction();
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;

      addLog(`Test completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.data) {
        addLog(`Response: ${JSON.stringify(result.data, null, 2)}`);
      }
      if (result.error) {
        addLog(`Error: ${JSON.stringify(result.error, null, 2)}`);
      }
    } catch (error) {
      addLog(`Exception: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConfig = () => {
    setLogs([]);
    addLog('=== Configuration Check ===');
    addLog(`Supabase URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL || 'NOT SET'}`);
    addLog(`Anon Key: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`);
    addLog(`Functions URL: ${supabase.functions.url}`);
    addLog('=== End Configuration ===');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Function Debug</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={runTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Running Test...' : 'Run AI Test'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={checkConfig}
        >
          <Text style={styles.buttonText}>Check Config</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => setLogs([])}
        >
          <Text style={styles.buttonText}>Clear Logs</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>Logs:</Text>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFFC00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 10,
  },
  logTitle: {
    color: '#FFFC00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
});