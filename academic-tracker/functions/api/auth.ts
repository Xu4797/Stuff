// Cloudflare Pages / EdgeOne Pages Function signature
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 声明全局 KV 变量
declare const ACADEMIC_KV: {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

export async function onRequestPost(context: any) {
  // Extract KV database (assumes binding name is ACADEMIC_KV)
  const { request } = context;

  try {
    const data = await request.json();
    const { action, username, password, faceDescriptor } = data;

    if (action === 'register') {
      // Validate input
      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username and password are required' }), { status: 400 });
      }

      // Check if user exists
      const existing = await ACADEMIC_KV.get(`user:${username}:auth`);
      if (existing) {
        return new Response(JSON.stringify({ error: 'User already exists' }), { status: 400 });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Save to KV
      const userPayload = {
        passwordHash,
        faceDescriptor: faceDescriptor || [],
        createdAt: new Date().toISOString()
      };
      
      await ACADEMIC_KV.put(`user:${username}:auth`, JSON.stringify(userPayload));
      
      // Initialize empty scores list
      await ACADEMIC_KV.put(`user:${username}:scores`, JSON.stringify([]));

      return new Response(JSON.stringify({ success: true, message: 'Registered successfully' }), { status: 200 });
    }

    if (action === 'login') {
      // Validate input
      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Username and password are required' }), { status: 400 });
      }

      const existing = await ACADEMIC_KV.get(`user:${username}:auth`);
      if (!existing) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }

      const userData = JSON.parse(existing);
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userData.passwordHash);
      if (!isPasswordValid) {
         return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
      }

      // Generate JWT token
      const token = jwt.sign(
        { username, userId: `user:${username}` },
        JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
      );
      
      return new Response(JSON.stringify({ 
        success: true, 
        token, 
        username,
        expiresIn: '7d'
      }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });

  } catch (err: any) {
    console.error('Auth error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
