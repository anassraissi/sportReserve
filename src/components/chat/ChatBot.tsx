import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User,
  Loader2,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Sparkles,
  Check,
  ArrowRight,
  TrendingUp,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { resourcesAPI, bookingsAPI } from '@/lib/api';
import { 
  analyzeBookingPatterns, 
  getRecommendations, 
  generatePersonalizedMessage,
  getTrendingResources,
  BookingPattern
} from '@/lib/recommendations';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  resourceLink?: { type: string; name: string };
  resources?: any[];
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [bookingPattern, setBookingPattern] = useState<BookingPattern | null>(null);
  const [allResources, setAllResources] = useState<any[]>([]);
  const [searchContext, setSearchContext] = useState<{type?: string; date?: string; time?: string}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getPageContext = () => {
    const pathname = location.pathname;
    if (pathname.includes('/login')) return 'login';
    if (pathname.includes('/register')) return 'register';
    if (pathname.includes('/reservations')) return 'reservations';
    if (pathname.includes('/resources')) return 'resources';
    if (pathname.includes('/dashboard')) return 'dashboard';
    if (pathname.includes('/admin')) return 'admin';
    if (pathname.includes('/profile')) return 'profile';
    return 'general';
  };

  const currentPageContext = getPageContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load user bookings when chat opens
  useEffect(() => {
    if (isOpen && user) {
      loadUserBookings();
      if (messages.length === 0) {
        sendWelcomeMessage();
      }
    }
  }, [isOpen, user]);

  const loadUserBookings = async () => {
    try {
      const res = await bookingsAPI.getAll({ page: 1, limit: 50 });
      const bookings = res.reservations || [];
      setUserBookings(bookings);
      
      // Analyze patterns
      const pattern = analyzeBookingPatterns(bookings);
      setBookingPattern(pattern);
      
      // Load all resources for recommendations
      const resourcesRes = await resourcesAPI.getAll({ status: 'active', page: 1, limit: 100 });
      setAllResources(resourcesRes.resources || []);
    } catch (error) {
      console.warn('Failed to load user bookings:', error);
    }
  };

  const sendWelcomeMessage = () => {
    let welcomeText = '';
    let suggestions: string[] = [];

    // Page-specific welcome messages
    if (currentPageContext === 'login') {
      welcomeText = `Bonjour! 👋\n\nBienvenue sur SportReserve. Je suis votre assistant.\nAvez-vous besoin d'aide pour vous connecter?`;
      suggestions = [
        "🔑 J'ai oublié mon mot de passe",
        "❓ Aide de connexion",
        "🆕 Créer un compte",
        "❓ Questions fréquentes"
      ];
    } else if (currentPageContext === 'register') {
      welcomeText = `Bienvenue sur SportReserve! 🎉\n\nJe suis votre assistant. Puis-je vous aider pour l'inscription?`;
      suggestions = [
        "📝 Guide d'inscription",
        "❓ Questions sur l'inscription",
        "🔒 Sécurité des données",
        "💬 Déjà un compte? Se connecter"
      ];
    } else if (currentPageContext === 'reservations') {
      welcomeText = `Bienvenue dans vos réservations! 📅\n\nComment puis-je vous aider avec vos réservations?`;
      suggestions = [
        "📋 Mes réservations",
        "➕ Nouvelle réservation",
        "❌ Annuler une réservation",
        "📅 Historique"
      ];
    } else if (currentPageContext === 'resources') {
      welcomeText = `Explorez nos ressources! 🏟️\n\nQu'est-ce que vous cherchez?`;
      suggestions = [
        "🏟️ Terrains de sport",
        "🏛️ Salles de sport",
        "💪 Équipements",
        "💰 Voir les tarifs"
      ];
    } else if (currentPageContext === 'dashboard') {
      welcomeText = `Bonjour ${user?.firstName}! 👋\n\nBienvenue sur votre tableau de bord. Comment puis-je vous aider?`;
      suggestions = [
        "📅 Réserver une ressource",
        "📋 Mes réservations",
        "💡 Recommandations",
        "📊 Statistiques"
      ];
    } else if (currentPageContext === 'profile') {
      welcomeText = `Gérez votre profil! 👤\n\nComment puis-je vous aider?`;
      suggestions = [
        "👤 Modifier le profil",
        "🔐 Changer le mot de passe",
        "📧 Vérifier email",
        "⚙️ Paramètres"
      ];
    } else if (currentPageContext === 'admin') {
      welcomeText = `Tableau d'administration! 👨‍💼\n\nBienvenue administrateur. Comment puis-je vous aider?`;
      suggestions = [
        "👥 Gérer utilisateurs",
        "📅 Gérer réservations",
        "🏟️ Gérer ressources",
        "📊 Rapport"
      ];
    } else {
      welcomeText = `Bonjour! 👋\n\nJe suis votre assistant SportReserve. Comment puis-je vous aider?`;
      suggestions = [
        "🏟️ Chercher un terrain",
        "🏛️ Chercher une salle",
        "💪 Équipements",
        "📅 Comment réserver?"
      ];
    }

    addBotMessage(welcomeText, suggestions);
  };

  const addBotMessage = (text: string, suggestions?: string[], resourceLink?: { type: string; name: string }, resources?: any[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      suggestions,
      resourceLink,
      resources
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Search resources by type
  const searchResources = async (type: string): Promise<any[]> => {
    try {
      const res = await resourcesAPI.getAll({ 
        status: 'active', 
        type: type === 'terrains' ? 'terrain' : type === 'salles' ? 'salle' : 'equipment',
        page: 1, 
        limit: 10 
      });
      return res.resources || [];
    } catch (error) {
      console.warn('Failed to search resources:', error);
      return [];
    }
  };

  // Get user's most booked resource type
  const getRecommendedResourceType = () => {
    if (userBookings.length === 0) return null;
    
    const typeCount: {[key: string]: number} = {};
    userBookings.forEach((booking) => {
      const type = booking.resourceId?.type || 'terrain';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    return Object.entries(typeCount).sort(([,a], [,b]) => b - a)[0][0];
  };

  const getBotResponse = async (userInput: string): Promise<{ text: string; suggestions?: string[]; resources?: any[] }> => {
    const input = userInput.toLowerCase();

    const isWeatherQuestion = /meteo|m[eé]t[eé]o|weather|temps|pluie|vent|temperature|conditions/.test(input);
    if (isWeatherQuestion) {
      if (!userBookings || userBookings.length === 0) {
        return {
          text: "🌦️ Je peux vous conseiller sur la meteo, mais je ne vois pas encore de reservation a venir. Souhaitez-vous en creer une?",
          suggestions: [
            "➕ Nouvelle reservation",
            "📋 Mes reservations",
            "🏟️ Trouver une ressource",
          ],
        };
      }

      const upcoming = userBookings
        .filter((b) => new Date(b.startTime) > new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      if (upcoming.length === 0) {
        return {
          text: "🌦️ Vous n'avez pas de reservation a venir. Je peux vous conseiller si vous planifiez un nouveau creneau.",
          suggestions: [
            "➕ Nouvelle reservation",
            "🏟️ Chercher un terrain",
            "📅 Voir mon calendrier",
          ],
        };
      }

      const next = upcoming[0];
      try {
        const recRes = await bookingsAPI.getRecommendation(next._id || next.id);
        const recommendation = recRes.recommendation || {};
        const resourceName = next.resourceId?.name || 'Ressource';
        const reasons = recommendation.reasons?.length ? `\n\nRaisons: ${recommendation.reasons.join(' ')}` : '';
        const summary = recommendation.summary || 'Meteo indisponible pour ce creneau.';
        const statusLabel = recommendation.status === 'good'
          ? 'Bon'
          : recommendation.status === 'caution'
            ? 'Prudence'
            : recommendation.status === 'avoid'
              ? 'A eviter'
              : 'Indisponible';

        return {
          text: `🌦️ Meteo pour votre prochaine reservation (${resourceName})\n\nStatut: ${statusLabel}\n${summary}${reasons}`,
          suggestions: [
            "📅 Voir mes reservations",
            "🔄 Reprogrammer",
            "💬 Autre question",
          ],
        };
      } catch (error) {
        return {
          text: "🌦️ Je n'ai pas pu recuperer la meteo pour l'instant. Souhaitez-vous reessayer plus tard?",
          suggestions: [
            "🔄 Reessayer",
            "📋 Mes reservations",
          ],
        };
      }
    }

    // ===== LOGIN PAGE HELP =====
    if (currentPageContext === 'login') {
      if (input.includes('oublié') || input.includes('mot de passe') || input.includes('password')) {
        return {
          text: "🔑 Pour réinitialiser votre mot de passe:\n\n1. Cliquez sur \"Mot de passe oublié?\"\n2. Entrez votre adresse email\n3. Vérifiez votre email\n4. Cliquez sur le lien reçu\n5. Créez un nouveau mot de passe\n\nAvez-vous reçu l'email?",
          suggestions: [
            "✅ Oui, j'ai reçu l'email",
            "❌ Je n'ai pas reçu l'email",
            "📧 Autres problèmes"
          ]
        };
      }

      if (input.includes('compte') || input.includes('inscription') || input.includes('créer')) {
        return {
          text: "🆕 Vous n'avez pas encore de compte? Pas de problème!\n\nCliquez sur \"Créer un compte\" pour vous inscrire. C'est facile et rapide!",
          suggestions: [
            "➡️ Aller à l'inscription",
            "📝 Qu'est-ce qui est nécessaire?",
            "🔒 Vos données seront-elles sûres?"
          ]
        };
      }

      if (input.includes('google') || input.includes('github')) {
        return {
          text: "🔐 Vous pouvez vous connecter rapidement avec:\n\n🔵 Google - Authentification simple et sécurisée\n📱 Avec votre compte Google existant\n\nCliquez simplement sur le bouton \"Connexion avec Google\"",
          suggestions: [
            "✓ Je comprends",
            "❓ Comment fonctionne Google Login?",
            "📧 Connexion par email"
          ]
        };
      }

      if (input.includes('aide') || input.includes('problème') || input.includes('probleme')) {
        return {
          text: "❓ Problèmes courants de connexion:\n\n❌ Email ou mot de passe incorrect?\n   → Vérifiez la majuscule/minuscule\n\n❌ Compte non approuvé?\n   → Attendez l'approbation admin\n\n❌ Erreur technique?\n   → Videz le cache de votre navigateur\n\nPouvez-vous me donner plus de détails?",
          suggestions: [
            "🔑 Aide mot de passe",
            "✅ Approbation du compte",
            "🔄 Effacer le cache",
            "📞 Contacter support"
          ]
        };
      }

      return {
        text: "📝 Pour vous connecter:\n\n1. Entrez votre email\n2. Entrez votre mot de passe\n3. Cliquez sur \"Se connecter\"\n\nOu utilisez Google pour une connexion rapide!",
        suggestions: [
          "🔑 Mot de passe oublié?",
          "🆕 Pas de compte?",
          "❓ Aide"
        ]
      };
    }

    // ===== REGISTER PAGE HELP =====
    if (currentPageContext === 'register') {
      if (input.includes('nom') || input.includes('prénom') || input.includes('email') || input.includes('informations')) {
        return {
          text: "📝 Informations requises:\n\n✓ Prénom\n✓ Nom\n✓ Email valide\n✓ Mot de passe sécurisé\n✓ Confirmation du mot de passe\n\nTous les champs sont obligatoires.",
          suggestions: [
            "🔐 Conseil mot de passe",
            "✅ Conditions générales",
            "📧 Vérification email"
          ]
        };
      }

      if (input.includes('mot de passe') || input.includes('password') || input.includes('sécurisé')) {
        return {
          text: "🔐 Conseils pour un mot de passe sécurisé:\n\n✓ Au moins 8 caractères\n✓ Lettres majuscules et minuscules\n✓ Chiffres et symboles\n✓ Ne pas utiliser d'infos personnelles\n\nExemple: SportRe2024@Secure",
          suggestions: [
            "✓ J'ai créé un mot de passe",
            "📝 Autres questions",
            "➡️ Continuer l'inscription"
          ]
        };
      }

      if (input.includes('accord') || input.includes('conditions') || input.includes('confidentialité')) {
        return {
          text: "✅ Conditions d'utilisation:\n\n📋 En vous inscrivant, vous acceptez:\n\n• Notre politique de confidentialité\n• Les conditions générales d'utilisation\n• Stockage sécurisé de vos données\n\nVos données sont protégées et chiffrées.",
          suggestions: [
            "✓ Je suis d'accord",
            "📄 Lire les conditions",
            "🔒 Politique de confidentialité"
          ]
        };
      }

      if (input.includes('vérif') || input.includes('email') || input.includes('confirme')) {
        return {
          text: "📧 Vérification d'email:\n\n1. Vous recevrez un email après l'inscription\n2. Cliquez sur le lien de vérification\n3. Votre compte sera activé\n4. Vous pourrez vous connecter\n\nL'email arrive généralement en quelques minutes.",
          suggestions: [
            "✓ Compris",
            "❌ Je n'ai pas reçu l'email",
            "⏱️ Renvoyer l'email"
          ]
        };
      }

      if (input.includes('google') || input.includes('rapide')) {
        return {
          text: "⚡ Inscription rapide avec Google:\n\n1. Utilisez votre compte Google\n2. Vos informations sont remplies automatiquement\n3. Plus rapide et sécurisé\n\nCliquez sur \"S'inscrire avec Google\"",
          suggestions: [
            "✓ Je comprends",
            "📝 Inscription manuelle",
            "🔒 Sécurité"
          ]
        };
      }

      return {
        text: "🎉 Bienvenue sur SportReserve!\n\n📝 Remplissez le formulaire:\n\n1. Vos informations (prénom, nom, email)\n2. Créez un mot de passe sécurisé\n3. Acceptez les conditions\n4. Cliquez \"S'inscrire\"\n\nC'est tout! 🚀",
        suggestions: [
          "📝 Qu'est-ce qui est obligatoire?",
          "🔐 Sécurité du mot de passe",
          "✅ Conditions générales"
        ]
      };
    }

    // ===== RESERVATIONS PAGE HELP =====
    if (currentPageContext === 'reservations') {
      if (input.includes('réservation') || input.includes('mes') || input.includes('voir')) {
        if (userBookings.length > 0) {
          const upcomingBooking = userBookings.find(b => new Date(b.startTime) > new Date());
          return {
            text: `📋 Vous avez ${userBookings.length} réservation(s)\n\n${upcomingBooking ? `Prochaine:\n🏟️ ${upcomingBooking.resourceId?.name || 'Ressource'}\n📅 ${new Date(upcomingBooking.startTime).toLocaleDateString('fr-FR')} à ${new Date(upcomingBooking.startTime).toLocaleTimeString('fr-FR')}` : 'Aucune réservation prochaine.'}`,
            suggestions: [
              "➕ Nouvelle réservation",
              "❌ Annuler une réservation",
              "📝 Ajouter une note",
              "📞 Contacter support"
            ]
          };
        }
      }

      if (input.includes('nouveau') || input.includes('nouvelle') || input.includes('réserver')) {
        return {
          text: "➕ Pour faire une nouvelle réservation:\n\n1. Choisissez une ressource (terrain, salle, équipement)\n2. Sélectionnez la date et l'heure\n3. Vérifiez les détails\n4. Confirmez et payez\n\nRapide et facile! ⚡",
          suggestions: [
            "🏟️ Chercher un terrain",
            "🏛️ Chercher une salle",
            "💪 Chercher équipement",
            "📅 Voir mon calendrier"
          ]
        };
      }

      if (input.includes('annul') || input.includes('cancel')) {
        return {
          text: "❌ Annulation de réservation:\n\n1. Allez à \"Mes réservations\"\n2. Cliquez sur la réservation\n3. Cliquez \"Annuler\"\n4. Confirmez l'annulation\n\n💰 Remboursement selon les conditions",
          suggestions: [
            "📋 Voir mes réservations",
            "📋 Politique d'annulation",
            "💰 Conditions de remboursement",
            "📞 Support"
          ]
        };
      }

      return {
        text: "📅 Gérez vos réservations:\n\n✓ Voir l'historique\n✓ Faire une nouvelle réservation\n✓ Modifier ou annuler\n✓ Ajouter des notes\n\nComment puis-je vous aider?",
        suggestions: [
          "📋 Mes réservations",
          "➕ Nouvelle réservation",
          "❌ Annuler",
          "❓ Aide"
        ]
      };
    }

    // ===== RESOURCES PAGE HELP =====
    if (currentPageContext === 'resources') {
      if (input.includes('terrain') || input.includes('foot') || input.includes('basket')) {
        return {
          text: "🏟️ Terrains de sport disponibles!",
          suggestions: [
            "📅 Vérifier disponibilité",
            "💰 Voir les prix",
            "🔍 Plus de détails",
            "🏛️ Voir salles"
          ]
        };
      }

      if (input.includes('salle') || input.includes('fitness') || input.includes('gym')) {
        return {
          text: "🏛️ Salles de sport modernes!",
          suggestions: [
            "📅 Horaires",
            "💪 Équipements",
            "💰 Tarification",
            "🏟️ Voir terrains"
          ]
        };
      }

      if (input.includes('équipement') || input.includes('materiel')) {
        return {
          text: "💪 Équipements disponibles à la location!",
          suggestions: [
            "🔍 Voir tous",
            "💰 Tarifs",
            "📦 Types d'équipements",
            "🏟️ Réservations"
          ]
        };
      }

      if (input.includes('prix') || input.includes('tarif') || input.includes('cout')) {
        return {
          text: "💰 Nos tarifs:\n\n🏟️ Terrains: À partir de 100 DH/heure\n🏛️ Salles: À partir de 200 DH/heure\n💪 Équipements: À partir de 20 DH/jour\n\nDécouvrez nos offres spéciales!",
          suggestions: [
            "🎁 Offres spéciales",
            "📆 Abonnements",
            "💳 Moyens de paiement",
            "📞 Devis personnalisé"
          ]
        };
      }

      return {
        text: "🏟️ Bienvenue! Qu'est-ce que vous cherchez?",
        suggestions: [
          "🏟️ Terrains",
          "🏛️ Salles",
          "💪 Équipements",
          "💰 Tarifs & Offres"
        ]
      };
    }

    // ===== DASHBOARD PAGE HELP =====
    if (currentPageContext === 'dashboard') {
      if (input.includes('recommandation') || input.includes('suggestion')) {
        if (bookingPattern && allResources.length > 0) {
          const recommendations = getRecommendations(bookingPattern, allResources, userBookings);
          const trending = getTrendingResources(allResources, bookingPattern);
          
          const resourcesToShow = trending.length > 0 ? trending : recommendations;
          
          if (resourcesToShow.length > 0) {
            return {
              text: `🌟 Recommandations personnalisées basées sur votre historique!`,
              suggestions: [
                "📍 Voir plus",
                "🔄 Autres suggestions",
                "💬 Réserver"
              ],
              resources: resourcesToShow.slice(0, 3)
            };
          }
        }
      }

      return {
        text: `Bienvenue ${user?.firstName}! 👋\n\nVotre tableau de bord SportReserve\n\nQue souhaitez-vous faire?`,
        suggestions: [
          "📅 Nouvelle réservation",
          "📋 Mes réservations",
          "💡 Recommandations",
          "🏟️ Explorer ressources"
        ]
      };
    }

    // Recommendations based on history
    if (input.includes('recommandation') || input.includes('suggestion') || input.includes('💡')) {
      if (bookingPattern && allResources.length > 0) {
        const recommendations = getRecommendations(bookingPattern, allResources, userBookings);
        const trending = getTrendingResources(allResources, bookingPattern);
        
        const resourcesToShow = trending.length > 0 ? trending : recommendations;
        
        if (resourcesToShow.length > 0) {
          const text = `🌟 Voici nos recommandations personnalisées pour vous:\n\n` +
            `Basé sur votre historique, nous pensons que vous allez aimer ces ressources!\n\n` +
            `Vos préférences:\n` +
            (bookingPattern.preferredTimes.length > 0 ? `⏰ Horaires: ${bookingPattern.preferredTimes.join(', ')}\n` : '') +
            (bookingPattern.preferredDays.length > 0 ? `📅 Jours: ${bookingPattern.preferredDays.join(', ')}\n` : '') +
            (bookingPattern.averageBookingDuration > 0 ? `⏱️ Durée: ${bookingPattern.averageBookingDuration}h\n` : '');

          return {
            text: text.trim(),
            suggestions: [
              "📍 Voir plus",
              "🔄 Autres suggestions",
              "💬 Réserver maintenant",
              "Retour au menu"
            ],
            resources: resourcesToShow.slice(0, 3)
          };
        }
      }
      
      return {
        text: "💡 Je n'ai pas encore assez d'informations sur vos préférences. Faites quelques réservations pour obtenir des recommandations personnalisées!",
        suggestions: [
          "🏟️ Chercher un terrain",
          "🏛️ Chercher une salle",
          "💪 Équipements",
          "Retour"
        ]
      };
    }

    // Terrain de sport
    if (input.includes('terrain') || input.includes('foot') || input.includes('basket') || input.includes('tennis')) {
      setSearchContext({ type: 'terrains' });
      const resources = await searchResources('terrains');
      
      if (resources.length > 0) {
        const resourceText = resources.slice(0, 3).map((r, i) => 
          `${i+1}. ${r.name} - ${r.pricePerUnit || 100} DH/${r.pricingModel === 'hourly' ? 'heure' : r.pricingModel || 'heure'}`
        ).join('\n');

        return {
          text: `🏟️ Nous avons ${resources.length} terrains disponibles:\n\n${resourceText}\n\nVoulez-vous plus de détails?`,
          suggestions: [
            "🔍 Voir tous les terrains",
            "📅 Vérifier disponibilité",
            "💰 Voir les prix",
            "🔄 Autres ressources"
          ],
          resources: resources.slice(0, 3)
        };
      }
      
      return {
        text: "🏟️ Nous cherchons les terrains disponibles... Malheureusement, aucun terrain disponible pour le moment.",
        suggestions: ["Essayer plus tard", "Voir les salles", "Voir les équipements"]
      };
    }

    // Salle de sport
    if (input.includes('salle') || input.includes('fitness') || input.includes('gym') || input.includes('yoga')) {
      setSearchContext({ type: 'salles' });
      const resources = await searchResources('salles');
      
      if (resources.length > 0) {
        const resourceText = resources.slice(0, 3).map((r, i) => 
          `${i+1}. ${r.name} - ${r.pricePerUnit || 200} DH/${r.pricingModel === 'hourly' ? 'heure' : r.pricingModel || 'heure'} • Capacité: ${r.capacity || 20}`
        ).join('\n');

        return {
          text: `🏛️ Nous avons ${resources.length} salles disponibles:\n\n${resourceText}\n\nIntéressé?`,
          suggestions: [
            "🔍 Voir toutes les salles",
            "📅 Chercher une date",
            "💰 Tarifs",
            "🔄 Autres ressources"
          ],
          resources: resources.slice(0, 3)
        };
      }
      
      return {
        text: "🏛️ Aucune salle disponible pour le moment. Voulez-vous essayer les terrains?",
        suggestions: ["Voir les terrains", "Voir les équipements", "Plus tard"]
      };
    }

    // Équipements
    if (input.includes('équipement') || input.includes('materiel') || input.includes('location')) {
      setSearchContext({ type: 'equipment' });
      const resources = await searchResources('equipment');
      
      if (resources.length > 0) {
        const resourceText = resources.slice(0, 3).map((r, i) => 
          `${i+1}. ${r.name} - ${r.pricePerUnit || 20} DH/${r.pricingModel === 'hourly' ? 'heure' : r.pricingModel || 'jour'}`
        ).join('\n');

        return {
          text: `💪 Équipements disponibles:\n\n${resourceText}`,
          suggestions: [
            "🔍 Voir tous les équipements",
            "📅 Réserver",
            "💰 Voir tous les prix",
            "🔄 Voir terrains/salles"
          ],
          resources: resources.slice(0, 3)
        };
      }
      
      return {
        text: "💪 Les équipements ne sont pas disponibles. Voulez-vous réserver un terrain ou une salle?",
        suggestions: ["Terrains", "Salles", "Réserver plus tard"]
      };
    }

    // Réservation du même type
    if (input.includes('même') || input.includes('dernier') || input.includes('habituel')) {
      const recommendedType = getRecommendedResourceType();
      if (recommendedType) {
        setSearchContext({ type: recommendedType === 'terrain' ? 'terrains' : recommendedType === 'salle' ? 'salles' : 'equipment' });
        const resources = await searchResources(recommendedType);
        
        if (resources.length > 0) {
          return {
            text: `✨ D'après votre historique, vous aimez les ${recommendedType}s! Nous en avons ${resources.length} disponibles:\n\n${resources.slice(0, 2).map((r, i) => `${i+1}. ${r.name}`).join('\n')}`,
            suggestions: ["Réserver maintenant", "Voir plus", "Chercher autre chose"],
            resources: resources.slice(0, 3)
          };
        }
      }
      
      return {
        text: "Je n'ai pas assez d'informations sur vos préférences. Que souhaitez-vous réserver?",
        suggestions: ["Terrains", "Salles", "Équipements"]
      };
    }

    // Réservation
    if (input.includes('réserv') || input.includes('book') || input.includes('comment')) {
      return {
        text: "📅 La réservation est simple et rapide!\n\n" +
             "1️⃣ Choisissez votre ressource (terrain, salle, équipement)\n" +
             "2️⃣ Sélectionnez la date et l'heure\n" +
             "3️⃣ Vérifiez les détails\n" +
             "4️⃣ Confirmez et payez\n\n" +
             "Prêt à commencer?",
        suggestions: [
          "🏟️ Chercher un terrain",
          "🏛️ Chercher une salle",
          "💪 Chercher équipement",
          "📋 Voir mes réservations"
        ]
      };
    }

    // Voir les réservations
    if (input.includes('réservation') && (input.includes('voir') || input.includes('mes'))) {
      if (userBookings.length > 0) {
        const nextBooking = userBookings[0];
        return {
          text: `📋 Vous avez ${userBookings.length} réservation(s)\n\nProchaine: ${nextBooking.resourceId?.name || 'Ressource'}\n${new Date(nextBooking.startTime).toLocaleDateString('fr-FR')}`,
          suggestions: [
            "Voir toutes mes réservations",
            "Annuler une réservation",
            "Reporter une réservation",
            "Autres options"
          ]
        };
      }
      
      return {
        text: "Vous n'avez pas encore de réservations. Souhaitez-vous en faire une?",
        suggestions: ["Chercher une ressource", "Aide", "Tarifs"]
      };
    }

    // Prix
    if (input.includes('prix') || input.includes('tarif') || input.includes('coût')) {
      return {
        text: "💰 Voici nos tarifs indicatifs:\n\n" +
             "🏟️ Terrains: À partir de 100 DH/heure\n" +
             "🏛️ Salles: À partir de 200 DH/heure\n" +
             "💪 Équipements: À partir de 20 DH/jour\n\n" +
             "Les prix varient selon la ressource. Voulez-vous voir les détails?",
        suggestions: [
          "Voir les terrains",
          "Voir les salles",
          "Voir les équipements",
          "Réserver"
        ]
      };
    }

    // Horaires
    if (input.includes('horaire') || input.includes('heure') || input.includes('ouvert') || input.includes('disponib')) {
      return {
        text: "🕐 Nos installations sont disponibles:\n\n" +
             "📅 Lun-Ven: 08:00 - 22:00\n" +
             "📅 Sam-Dim: 09:00 - 20:00\n\n" +
             "Certaines ressources 24h/24. Vérifier la disponibilité d'une ressource?",
        suggestions: [
          "Chercher un terrain",
          "Chercher une salle",
          "Chercher équipement",
          "Autre question"
        ]
      };
    }

    // Contact/Aide
    if (input.includes('contact') || input.includes('aide') || input.includes('help') || input.includes('problème')) {
      return {
        text: "📞 Besoin d'aide? Je suis là!\n\n" +
             "✉️ support@sportreserve.com\n" +
             "📱 +212 6XX XXX XXX\n" +
             "💬 Chat en direct\n\n" +
             "Ou posez votre question!",
        suggestions: [
          "Problème de paiement",
          "Problème de réservation",
          "Question générale",
          "Revenir au menu"
        ]
      };
    }

    // Default response
    return {
      text: "Je suis là pour vous aider! Que souhaitez-vous faire?",
      suggestions: [
        "🏟️ Chercher un terrain",
        "🏛️ Chercher une salle",
        "💪 Chercher équipement",
        "📋 Mes réservations",
        "💬 Besoin d'aide?"
      ]
    };
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    addUserMessage(userMessage);
    setInputValue('');
    setIsTyping(true);

    // Handle async response
    setTimeout(async () => {
      const response = await getBotResponse(userMessage);
      setIsTyping(false);
      addBotMessage(response.text, response.suggestions, undefined, response.resources);
    }, 800);
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Handle direct navigation
    if (suggestion.includes('🔍 Voir tous les terrains') || suggestion.includes('Voir toutes les')) {
      navigate('/resources/terrain');
      setIsOpen(false);
      return;
    }
    if (suggestion.includes('Voir toutes les salles')) {
      navigate('/resources/salle');
      setIsOpen(false);
      return;
    }
    if (suggestion.includes('équipements')) {
      navigate('/resources/equipment');
      setIsOpen(false);
      return;
    }
    if (suggestion.includes('Réserver maintenant') || suggestion.includes('Réserver')) {
      navigate('/reservations/new');
      setIsOpen(false);
      return;
    }
    if (suggestion.includes('📋 Mes réservations') || suggestion.includes('Voir toutes mes réservations') || suggestion.includes('réservations')) {
      navigate('/reservations');
      setIsOpen(false);
      return;
    }
    if (suggestion.includes('Annuler une réservation')) {
      navigate('/reservations');
      setIsOpen(false);
      return;
    }

    // Otherwise send as user message for conversation
    addUserMessage(suggestion);
    setIsTyping(true);

    setTimeout(async () => {
      const response = await getBotResponse(suggestion);
      setIsTyping(false);
      addBotMessage(response.text, response.suggestions, undefined, response.resources);
    }, 800);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-50 group"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-500"></span>
          </span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="h-8 w-8" />
                  <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
                <div>
                  <CardTitle className="text-lg">Assistant SportReserve</CardTitle>
                  <p className="text-xs text-blue-100">En ligne • Répond instantanément</p>
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

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.sender === 'bot' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[75%] space-y-2",
                  message.sender === 'user' && 'flex flex-col items-end'
                )}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 shadow-sm",
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    )}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                  </div>
                  
                  {message.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}

                  {message.resources && message.resources.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.resources.map((resource, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg border border-blue-200 text-sm">
                          <p className="font-semibold text-blue-900">{resource.name}</p>
                          <p className="text-xs text-blue-700">
                            💰 {resource.pricePerUnit || 0} DH
                            {resource.pricingModel ? (resource.pricingModel === 'hourly' ? '/heure' : resource.pricingModel === 'daily' ? '/jour' : `/${resource.pricingModel}`) : '/heure'}
                            {resource.capacity && ` • Capacité: ${resource.capacity}`}
                          </p>
                          <Button
                            size="sm"
                            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                            onClick={() => {
                              navigate(`/resources/${resource._id}`);
                              setIsOpen(false);
                            }}
                          >
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Voir détails
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {message.sender === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t bg-white rounded-b-lg">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Posez votre question..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              <Sparkles className="h-3 w-3 inline mr-1" />
              Assistance instantanée 24/7
            </p>
          </div>
        </Card>
      )}
    </>
  );
};
