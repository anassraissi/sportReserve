import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Eye, EyeOff, Loader2, User, Mail, Phone, Lock, Shield, Sparkles, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isLoading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => document.body.classList.remove('auth-page');
  }, []);

  useEffect(() => {
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
              title: 'Inscription réussie', 
              description: 'Bienvenue sur sportResrve !',
              className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
            });
            navigate('/dashboard');
          }
        } catch (err: any) {
          toast({ 
            title: 'Erreur d\'inscription', 
            description: err.message || 'Inscription Google échouée', 
            variant: 'destructive' 
          });
        } finally {
          setIsSubmitting(false);
        }
      },
    });
    
    const btn = document.getElementById('google-register-btn');
    if (btn) {
      google.accounts.id.renderButton(btn, { 
        theme: 'outline', 
        size: 'large',
        type: 'standard',
        shape: 'pill',
        text: 'signup_with',
        width: '100%',
        logo_alignment: 'center'
      });
    }
  }, [loginWithGoogle, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!acceptTerms) {
      toast({
        title: 'Conditions requises',
        description: 'Veuillez accepter les conditions d\'utilisation',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Erreur de mot de passe',
        description: 'Les mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 8 caractères.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const success = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: 'user',
      });
      
      if (success) {
        toast({
          title: '🎉 Bienvenue sur sportResrve !',
          description: 'Votre compte a été créé avec succès.',
          className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
        });
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur d\'inscription',
        description: error.message || 'Une erreur est survenue lors de l\'inscription.',
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main container - horizontal layout with stacked branding */}
      <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-start relative z-10 pt-12 lg:pt-0">
        
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col items-start justify-start p-8 lg:p-12 order-1 pt-16">
          <div className="max-w-xl space-y-8">
            {/* Logo and title */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <Calendar className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl lg:text-6xl font-black bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                    sportResrve
                  </h1>
                  <p className="text-lg text-slate-700 font-medium mt-2">
                    Créez votre compte gratuitement
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-6 mt-12">
              <h2 className="text-2xl font-bold text-slate-800">
                Rejoignez-nous dès aujourd'hui !
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-x-1">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Inscription rapide</h3>
                    <p className="text-slate-600 mt-1">Créez votre compte en quelques secondes</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-x-1">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Accès illimité</h3>
                    <p className="text-slate-600 mt-1">Profitez de toutes les fonctionnalités</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-x-1">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">100% Sécurisé</h3>
                    <p className="text-slate-600 mt-1">Vos données sont protégées et chiffrées</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Register Form with Branding on Top */}
        <div className="flex flex-col items-center justify-start order-2 lg:order-2 space-y-6">
          {/* Branding for mobile and top section */}

          {/* Form Card */}
          <div className="w-full max-w-md">

            <Card className="border-0 shadow-2xl overflow-hidden backdrop-blur-sm bg-white">
              <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <span className="text-2xl">✍️</span>
                  Créer un compte
                </CardTitle>
                <CardDescription className="text-green-100 mt-1">
                  Inscrivez-vous pour commencer à réserver ou louer
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-5 pt-8">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                        <span className="text-lg">👤</span>
                        Prénom
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="Jean"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="h-10 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                        <span className="text-lg">👥</span>
                        Nom
                      </Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Dupont"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="h-10 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <span className="text-lg">📧</span>
                      Adresse Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      className="h-10 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    />
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <span className="text-lg">📞</span>
                      Téléphone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+212 6 XX XX XX XX"
                      value={formData.phone}
                      onChange={handleChange}
                      className="h-10 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <span className="text-lg">🔑</span>
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="h-10 pr-10 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <span className="text-lg">🔐</span>
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="h-10 pr-10 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                        className="mt-0.5 data-[state=checked]:bg-green-600"
                      />
                      <div>
                        <Label htmlFor="terms" className="text-xs text-slate-700 font-normal leading-tight">
                          J'accepte les{' '}
                          <Link to="/terms" className="text-green-600 hover:text-green-700 font-semibold hover:underline">
                            conditions d'utilisation
                          </Link>{' '}
                          et la{' '}
                          <Link to="/privacy" className="text-green-600 hover:text-green-700 font-semibold hover:underline">
                            politique de confidentialité
                          </Link>
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Google Sign-In */}
                  <div className="space-y-3 pt-2">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-white text-slate-500">Ou inscrivez-vous avec</span>
                      </div>
                    </div>
                    <div id="google-register-btn" className="w-full"></div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 pt-6 bg-gradient-to-b from-slate-50 to-white border-t">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-base group"
                    disabled={isLoading || isSubmitting}
                  >
                    {isLoading || isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Création du compte...
                      </>
                    ) : (
                      <>
                        <span>🚀 S'inscrire</span>
                        <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-slate-600 text-center">
                    Déjà un compte ?{' '}
                    <Link to="/login" className="text-green-600 font-bold hover:text-green-700 hover:underline">
                      Se connecter ici
                    </Link>
                  </p>
                </CardFooter>
              </form>
            </Card>

            {/* Security Notice */}
            <p className="text-center text-slate-600 text-xs mt-4">
              <span className="text-lg">🔒</span> Inscription gratuite et sécurisée
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};