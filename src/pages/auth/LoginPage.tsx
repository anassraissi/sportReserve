import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Eye, EyeOff, Loader2, Lock, Mail, Shield, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => document.body.classList.remove('auth-page');
  }, []);

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const google = (window as any).google;
      if (!google || !import.meta.env.VITE_GOOGLE_CLIENT_ID) return;
      
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            setIsSubmitting(true);
            const ok = await loginWithGoogle?.(response.credential);
            if (ok) {
              toast({ 
                title: 'Connexion réussie', 
                description: 'Bienvenue sur sportResrve !',
                className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
              });
              setTimeout(() => navigate(from, { replace: true }), 150);
            }
          } catch (err: any) {
            toast({ 
              title: 'Erreur de connexion', 
              description: err.message || 'Connexion Google échouée', 
              variant: 'destructive' 
            });
          } finally {
            setIsSubmitting(false);
          }
        },
      });
      
      const btn = document.getElementById('google-login-btn');
      if (btn) {
        google.accounts.id.renderButton(btn, { 
          theme: 'outline', 
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'continue_with',
          width: '100%'
        });
      }
    };

    // Delay initialization slightly to ensure DOM is ready
    const timer = setTimeout(initializeGoogleSignIn, 100);
    return () => clearTimeout(timer);
  }, [loginWithGoogle, toast, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: 'Connexion réussie',
          description: 'Redirection vers votre tableau de bord...',
          className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
        });
        setTimeout(() => navigate(from, { replace: true }), 150);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur de connexion',
        description: error.message || 'Email ou mot de passe incorrect.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main container */}
      <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col items-start justify-center p-8 lg:p-12">
          <div className="max-w-xl space-y-8">
            {/* Logo and title */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <Calendar className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                    sportResrve
                  </h1>
                  <p className="text-lg text-slate-600 font-medium mt-2">
                    Votre solution de réservation intelligente
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-6 mt-12">
              <h2 className="text-2xl font-bold text-slate-800">
                Pourquoi choisir sportResrve ?
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-x-1">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Réservation instantanée</h3>
                    <p className="text-slate-600 mt-1">Réservez en quelques clics, 24h/24</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-x-1">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Gestion simplifiée</h3>
                    <p className="text-slate-600 mt-1">Suivez toutes vos réservations en un lieu</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-x-1">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Sécurité maximale</h3>
                    <p className="text-slate-600 mt-1">Vos données sont chiffrées et protégées</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                  sportResrve
                </h1>
              </div>
              <p className="text-slate-600 text-base">Connectez-vous pour gérer vos réservations</p>
            </div>

            <Card className="border-0 shadow-2xl overflow-hidden bg-white backdrop-blur-sm">
              <CardHeader className="pb-6 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <Lock className="h-6 w-6" />
                      Connexion
                    </CardTitle>
                    <CardDescription className="text-blue-100/90 mt-1">
                      Accédez à votre espace personnel
                    </CardDescription>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-8">
                  {/* Email field */}
                  <div className="space-y-3">
                    <Label htmlFor="email" className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Adresse Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="vous@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className="pl-10 h-11 text-base border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-3">
                    <Label htmlFor="password" className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="pl-10 pr-10 h-11 text-base border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50"
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Forgot password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label htmlFor="remember" className="text-sm text-slate-600">
                        Se souvenir de moi
                      </Label>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  {/* Google Sign-In */}
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500">Ou continuer avec</span>
                      </div>
                    </div>
                    <div id="google-login-btn" className="w-full"></div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pt-6 bg-gradient-to-b from-white to-slate-50/50 border-t border-slate-100">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-base group"
                    disabled={isLoading || isSubmitting}
                  >
                    {(isLoading || isSubmitting) ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <span>Se connecter</span>
                        <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-slate-600">
                    Pas encore de compte ?{' '}
                    <Link 
                      to="/register" 
                      className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      Créer un compte
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>

            {/* Security notice */}

          </div>
        </div>
      </div>
    </div>
  );
}