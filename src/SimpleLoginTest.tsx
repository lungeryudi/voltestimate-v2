import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './services/supabase';

export function SimpleLoginTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  const testSignup = async () => {
    console.log('Test signup clicked');
    setStatus('Signing up...');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        console.error('Signup error:', error);
        setStatus('Error: ' + error.message);
      } else {
        console.log('Signup success:', data);
        setStatus('Success! Check console.');
        
        // Create profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, full_name: email.split('@')[0] });
          
          if (profileError) {
            console.error('Profile error:', profileError);
          } else {
            console.log('Profile created');
            navigate('/projects');
          }
        }
      }
    } catch (err) {
      console.error('Catch error:', err);
      setStatus('Catch: ' + (err as Error).message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Simple Test Login</h1>
      <p>Status: {status}</p>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <button
        onClick={testSignup}
        style={{
          width: '100%',
          padding: '10px',
          background: 'blue',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        TEST SIGNUP
      </button>
      
      <p style={{ marginTop: '20px', color: 'gray' }}>
        Open console (F12) to see logs
      </p>
    </div>
  );
}
