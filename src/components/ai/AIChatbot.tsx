import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type ParsedIntent = {
  intent?: string;
  sport_type?: string;
  date?: string | null;
  time?: string | null;
  duration?: number | null;
  location?: string | null;
  price_range?: string | null;
  additional_info?: string | null;
  confidence?: 'high' | 'medium' | 'low' | string;
  clarification_needed?: string | null;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIChatbot: React.FC = () => {
  const { user } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Bonjour ${user?.firstName || 'cher utilisateur'} ! 👋 Je suis votre assistant sportReserve. Comment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastParsedIntent, setLastParsedIntent] = useState<ParsedIntent | null>(null);
  const [lastUserText, setLastUserText] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenRequest = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenRequest);
    return () => window.removeEventListener('open-ai-chat', handleOpenRequest);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const text = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setLastParsedIntent(null);
    setLastUserText(text);

    try {
      // Parse intent (booking-like) in parallel
      const intentPromise = (async () => {
        try {
          const intentRes = await fetch(`${apiBaseUrl}/ai/intent/parse`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ message: text }),
          });
          if (!intentRes.ok) return null;
          const data = await intentRes.json();
          return (data?.parsed || null) as ParsedIntent | null;
        } catch {
          return null;
        }
      })();

      // Call your backend API
      const response = await fetch(`${apiBaseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: text,
          context: {
            userName: user?.firstName,
            userRole: user?.role,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        
        // Handle specific error codes
        if (errorData.code === 'insufficient_quota') {
          throw new Error('QUOTA_EXCEEDED');
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "Désolé, je n'ai pas pu traiter votre demande.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const parsed = await intentPromise;
      if (parsed) {
        setLastParsedIntent(parsed);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorContent = "Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.";
      
      // Show more specific errors
      if (error.message === 'QUOTA_EXCEEDED') {
        errorContent = "⚠️ Le quota OpenAI a été dépassé. L'administrateur doit ajouter des crédits. En attendant, vous pouvez contacter le support pour obtenir de l'aide.";
      } else if (error.message?.includes('Quota')) {
        errorContent = "⚠️ Le quota OpenAI a été dépassé. Veuillez contacter l'administrateur.";
      } else if (error.message?.includes('API key') || error.message?.includes('invalid_api_key')) {
        errorContent = "Problème de configuration de l'API. Veuillez contacter l'administrateur.";
      } else if (error.message?.includes('Authentication')) {
        errorContent = "Vous devez être connecté pour utiliser le chatbot. Veuillez vous reconnecter.";
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sportToResourceType = (sportType?: string | null) => {
    const s = (sportType || '').toLowerCase();
    if (['fitness', 'yoga', 'swimming', 'dance'].includes(s)) return 'salle';
    if (['equipment'].includes(s)) return 'equipment';
    // default most sports => terrain
    return 'terrain';
  };

  const parseTimeToHHMM = (time?: string | null) => {
    if (!time) return null;
    const t = time.toLowerCase().trim();
    const hhmm = t.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (hhmm) return `${hhmm[1].padStart(2, '0')}:${hhmm[2]}`;
    if (t.includes('evening') || t.includes('soir')) return '19:00';
    if (t.includes('afternoon') || t.includes('après') || t.includes('apres')) return '15:00';
    if (t.includes('morning') || t.includes('matin')) return '09:00';
    return null;
  };

  const parseDateToDate = (date?: string | null) => {
    if (!date) return null;
    const d = date.toLowerCase().trim();
    // ISO date
    const iso = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const dt = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    // tomorrow
    if (d === 'tomorrow' || d === 'demain') {
      const dt = new Date();
      dt.setDate(dt.getDate() + 1);
      dt.setHours(0, 0, 0, 0);
      return dt;
    }
    // next weekday (english/french)
    const weekdays: Array<{ keys: string[]; day: number }> = [
      { keys: ['sunday', 'dimanche'], day: 0 },
      { keys: ['monday', 'lundi'], day: 1 },
      { keys: ['tuesday', 'mardi'], day: 2 },
      { keys: ['wednesday', 'mercredi'], day: 3 },
      { keys: ['thursday', 'jeudi'], day: 4 },
      { keys: ['friday', 'vendredi'], day: 5 },
      { keys: ['saturday', 'samedi'], day: 6 },
    ];
    const match = weekdays.find(w => w.keys.some(k => d.includes(k)));
    if (match) {
      const now = new Date();
      const target = match.day;
      const current = now.getDay();
      let diff = (target - current + 7) % 7;
      if (diff === 0) diff = 7;
      const dt = new Date();
      dt.setDate(dt.getDate() + diff);
      dt.setHours(0, 0, 0, 0);
      return dt;
    }
    return null;
  };

  const buildPrefilledReservationUrl = (intent: ParsedIntent) => {
    const day = parseDateToDate(intent.date);
    const hhmm = parseTimeToHHMM(intent.time);
    if (!day || !hhmm) return null;

    const [hh, mm] = hhmm.split(':').map(Number);
    const start = new Date(day);
    start.setHours(hh, mm, 0, 0);
    const durationMinutes = typeof intent.duration === 'number' && intent.duration > 0 ? intent.duration : 60;
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    const params = new URLSearchParams();
    params.set('start', start.toISOString());
    params.set('end', end.toISOString());
    params.set('type', sportToResourceType(intent.sport_type));
    if (intent.location) params.set('city', intent.location);
    if (intent.sport_type) params.set('sport', intent.sport_type);
    return `/reservations/new?${params.toString()}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    "Trouver un terrain de football",
    "Mes réservations à venir",
    "Annuler une réservation",
    "Aide pour réserver",
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-110 z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-purple-200">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-white text-base">Assistant sportReserve</CardTitle>
                  <p className="text-xs text-purple-100">Toujours à votre service</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 border-2 border-purple-200">
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-purple-100' : 'text-slate-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 border-2 border-blue-200">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* Smart booking CTA (based on parsed intent from last user message) */}
              {lastParsedIntent?.intent === 'book_facility' && lastUserText && (
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-3">
                  <p className="text-sm font-semibold text-purple-900">Je peux préparer la réservation</p>
                  <p className="text-xs text-purple-800/80 mt-1">
                    Sport: {lastParsedIntent.sport_type || '—'} · Date: {lastParsedIntent.date || '—'} · Heure: {lastParsedIntent.time || '—'} · Ville: {lastParsedIntent.location || '—'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600"
                      onClick={() => {
                        const url = buildPrefilledReservationUrl(lastParsedIntent);
                        if (url) {
                          setIsOpen(false);
                          navigate(url);
                        } else {
                          // not enough info → ask user
                          setMessages((prev) => [
                            ...prev,
                            {
                              id: (Date.now() + 2).toString(),
                              role: 'assistant',
                              content:
                                "J'ai besoin d'une date + heure précise (ex: 2026-03-02 à 19:00) pour préparer la réservation.",
                              timestamp: new Date(),
                            },
                          ]);
                        }
                      }}
                    >
                      Créer la réservation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLastParsedIntent(null)}
                    >
                      Ignorer
                    </Button>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <Avatar className="h-8 w-8 border-2 border-purple-200">
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-slate-100 rounded-2xl px-4 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions (only show at start) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-slate-500 mb-2">Actions rapides:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(action)}
                    className="text-xs h-7 border-purple-200 hover:bg-purple-50"
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <CardContent className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Propulsé par l'IA • sportReserve
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};
