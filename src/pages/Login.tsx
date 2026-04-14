import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LogIn, Github } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Successfully logged in!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to login with Google");
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Email login is for demo purposes. Please use Google Login.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-blue-light p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card border-none shadow-2xl overflow-hidden">
          <div className="h-2 bg-brand-yellow w-full" />
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-3xl font-bold text-white">Login</CardTitle>
            <CardDescription className="text-white/60">
              Access PotholeGuard AI Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full btn-primary">
                Login
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-brand-blue px-2 text-white/40">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button
                variant="outline"
                className="border-white/10 hover:bg-white/5 text-white"
                onClick={handleGoogleLogin}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>

            <p className="text-center text-sm text-white/40">
              Don't have an account? <a href="#" className="text-brand-yellow hover:underline">Signup</a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
