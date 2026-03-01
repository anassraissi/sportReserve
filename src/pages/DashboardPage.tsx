/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDataSync } from '@/contexts/DataSyncContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Building2,
  MapPinned,
  Dumbbell,
  Clock,
  TrendingUp,
  CalendarPlus,
  ArrowRight,
  Loader2,
  DollarSign,
  Users,
  BarChart3,
  Star,
  MessageCircle,
  Zap,
  Lightbulb,
  Sparkles,
  Sun,
  CloudRain,
  CloudSun,
  Cloud,
  Wind,
  Compass,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import { bookingsAPI, resourcesAPI, reviewsAPI, mediaAPI, weatherAPI } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { analyzeBookingPatterns, getTrendingResources } from '@/lib/recommendations';
import { getImageUrl } from '@/lib/utils';
import { ReservationTicket } from '@/components/reservations/ReservationTicket';
import { WeatherRecommendationBadge } from '@/components/reservations/WeatherRecommendationBadge';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReservationCalendar } from '@/components/dashboard/ReservationCalendar';
import { AdminBroadcastNotification } from '@/components/notifications/AdminBroadcast';

// AI services (client)
import { AIChatbot, RecommendationsPanel } from '@/components/ai';
import { WeatherRecommendations } from '@/components/ai/WeatherRecommendations';
import { NaturalLanguageBooking } from '@/components/ai/NaturalLanguageBooking';
import { AdminAIDashboard } from '@/components/ai/AdminAIDashboard';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const RESOURCE_TYPE_COLORS: Record<string, string> = {
  Terrains: '#10b981',
  Salles: '#f59e0b',
  Équipements: '#8b5cf6',
};

const getResourcePathFromType = (type: string | undefined) => {
  if (type === 'terrain') return 'terrains';
  if (type === 'salle') return 'salles';
  return 'equipements';
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { reservationsVersion, resourcesVersion } = useDataSync();
  const { toast } = useToast();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [isLoading, setIsLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [pendingReviewReservation, setPendingReviewReservation] = useState<any>(null);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [recommendedResourceReviews, setRecommendedResourceReviews] = useState<Record<string, any[]>>({});
  const [resourceImages, setResourceImages] = useState<{ [key: string]: string }>({});
  const [weatherRecommendations, setWeatherRecommendations] = useState<Record<string, any>>({});
  const [regionalWeather, setRegionalWeather] = useState<any[]>([]);
  const [regionalWeatherUpdatedAt, setRegionalWeatherUpdatedAt] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalReservations: 0,
    activeReservations: 0,
    terrains: 0,
    salles: 0,
    equipment: 0,
  });

  const [adminStats, setAdminStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    revenueByMonth: [] as any[],
    bookingsByStatus: [] as any[],
    resourcesByType: [] as any[],
  });

  const loadImagesForResources = async (resources: any[]) => {
    const images: { [key: string]: string } = {};
    const imageLoadPromises: Promise<void>[] = [];

    try {
      for (const resource of resources) {
        imageLoadPromises.push(
          (async () => {
            try {
              let imageUrl: string | null = null;

              // Try 1: direct image field
              if (resource.image || resource.imageUrl) {
                imageUrl = getImageUrl(resource.image || resource.imageUrl);
              }

              // Try 2: media API
              if (!imageUrl) {
                try {
                  const resourceId = resource._id || resource.id;
                  const mediaRes = await mediaAPI.getByResource(resourceId, { mediaType: 'image' });
                  if (mediaRes?.mediaAssets && mediaRes.mediaAssets.length > 0) {
                    const imageMedia = mediaRes.mediaAssets.find((m: any) => {
                      const mType = m.mediaType || m.type || m.mimeType || '';
                      return String(mType).includes('image') && m.originalUrl;
                    });

                    if (imageMedia?.originalUrl) {
                      imageUrl = getImageUrl(imageMedia.originalUrl);
                    } else if (mediaRes.mediaAssets[0]?.originalUrl) {
                      imageUrl = getImageUrl(mediaRes.mediaAssets[0].originalUrl);
                    }
                  }
                } catch (apiError) {
                  console.debug(`Media API lookup for ${resource._id || resource.id}:`, apiError);
                }
              }

              if (imageUrl && !imageUrl.includes('placeholder')) {
                images[resource._id || resource.id] = imageUrl;
              }
            } catch (error) {
              console.debug(`Failed to load image for resource ${resource._id || resource.id}:`, error);
            }
          })()
        );
      }

      await Promise.all(imageLoadPromises);
      setResourceImages(images);
    } catch (error) {
      console.warn('Failed to load images for resources:', error);
    }
  };

  useEffect(() => {
    // Wait for user to be available; fallback to localStorage
    if (!user) {
      const storedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');
      if (!storedUser || !token) {
        return;
      }
    }

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Bookings + resources (safe fallbacks)
        let bookingsRes: any = { reservations: [] };
        let resourcesRes: any = { resources: [] };

        try {
          bookingsRes = await bookingsAPI.getAll({ page: 1, limit: 10000, admin: user?.role === 'admin' ? true : undefined });
        } catch (error) {
          console.warn('Failed to load bookings:', error);
        }

        try {
          resourcesRes = await resourcesAPI.getAll({ status: 'active', page: 1, limit: 1000 });
        } catch (error) {
          console.warn('Failed to load resources:', error);
        }

        const userReservations = bookingsRes.reservations || [];
        const resources = resourcesRes.resources || [];

        setReservations(userReservations);

        setStats({
          totalReservations: userReservations.length,
          activeReservations: userReservations.filter((r: any) => ['confirmed', 'paid', 'active'].includes(r.status)).length,
          terrains: resources.filter((r: any) => r.type === 'terrain').length,
          salles: resources.filter((r: any) => r.type === 'salle').length,
          equipment: resources.filter((r: any) => r.type === 'equipment').length,
        });

        // Admin stats - Utiliser la même logique que AdminAIDashboard (confirmed, paid, completed)
        if (user?.role === 'admin') {
          // Inclure confirmed, paid, completed (comme AdminAIDashboard)
          const validBookings = userReservations.filter((b: any) => 
            ['confirmed', 'paid', 'completed'].includes(b.status)
          );
          const totalRevenue = validBookings.reduce((sum: number, b: any) => sum + (b.totalAmount ?? b.totalPrice ?? 0), 0);
          const completedBookings = userReservations.filter((b: any) => b.status === 'completed').length;
          const pendingBookings = userReservations.filter((b: any) => b.status === 'pending').length;

          const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
          const monthlyData: { [key: string]: number } = {};
          months.forEach((month) => (monthlyData[month] = 0));

          // Utiliser validBookings au lieu de paidBookings pour le graphique
          validBookings.forEach((booking: any) => {
            if (booking.createdAt) {
              const date = new Date(booking.createdAt);
              const month = months[date.getMonth()];
              const amount = booking.totalAmount ?? booking.totalPrice ?? 0;
              monthlyData[month] += amount;
            }
          });

          const revenueByMonth = months.map((month) => ({ month, revenue: monthlyData[month] }));

          const bookingsByStatus = [
            { name: 'Confirmées', value: userReservations.filter((b: any) => b.status === 'confirmed').length },
            { name: 'Payées', value: userReservations.filter((b: any) => b.status === 'paid').length },
            { name: 'En attente', value: pendingBookings },
            { name: 'Complétées', value: completedBookings },
            { name: 'Annulées', value: userReservations.filter((b: any) => b.status === 'cancelled').length },
          ];

          const resourcesByType = [
            { name: 'Terrains', count: resources.filter((r: any) => r.type === 'terrain').length },
            { name: 'Salles', count: resources.filter((r: any) => r.type === 'salle').length },
            { name: 'Équipements', count: resources.filter((r: any) => r.type === 'equipment').length },
          ];

          setAdminStats({
            totalRevenue,
            totalBookings: userReservations.length,
            completedBookings,
            pendingBookings,
            revenueByMonth,
            bookingsByStatus,
            resourcesByType,
          });
        }

        // Weather recommendations (per booking)
        try {
          const weatherRes = await bookingsAPI.getRecommendations({ scope: 'upcoming', days: 7, limit: 40 });
          const recMap: Record<string, any> = {};
          (weatherRes.recommendations || []).forEach((item: any) => {
            if (item?.reservationId) {
              recMap[item.reservationId] = item.recommendation;
            }
          });
          setWeatherRecommendations(recMap);
        } catch (weatherError) {
          console.warn('Failed to load weather recommendations:', weatherError);
        }

        // Regional weather
        try {
          const regionalRes = await weatherAPI.getRegions();
          setRegionalWeather(regionalRes.regions || []);
          setRegionalWeatherUpdatedAt(regionalRes.updatedAt || null);
        } catch (regionalError) {
          console.warn('Failed to load regional weather:', regionalError);
        }

        // Reviews
        try {
          const reviewsRes = await reviewsAPI.getAll({ page: 1, limit: 100 });
          setReviews(reviewsRes.reviews || []);
        } catch (error) {
          console.warn('Failed to load reviews:', error);
        }

        // Local recommendations (non-AI)
        try {
          const allResourcesRes = await resourcesAPI.getAll({ status: 'active', page: 1, limit: 100 });
          const resources = allResourcesRes.resources || [];
          const pattern = analyzeBookingPatterns(userReservations);
          const recs = getTrendingResources(resources, pattern);
          setRecommendations(recs);
          loadImagesForResources(recs);
        } catch (error) {
          console.warn('Failed to load recommendations:', error);
        }

        // AI recommendations based on last 3 bookings
        try {
          // Load AI recommendations with weather (for all users, not just those with 3+ reservations)
          if (user?.role !== 'admin') {
            const token = localStorage.getItem('token');
            // Try new endpoint with weather first
            try {
              const res = await fetch(
                `${apiBaseUrl}/ai/recommendations/personalized-weather?limit=6`,
                {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                }
              );

              if (res.ok) {
                const data = await res.json();
                const aiRecs = data?.recommendations || [];
                setAiRecommendations(aiRecs);
                if (aiRecs.length > 0) {
                  loadImagesForResources(aiRecs);
                }

                // Fetch avis (reviews) for top AI recs
                const top = aiRecs.slice(0, 3);
                const pairs = await Promise.all(
                  top.map(async (r: any) => {
                    const id = r._id || r.id;
                    try {
                      const rr = await reviewsAPI.getAll({ resourceId: id, page: 1, limit: 2 });
                      return [id, rr.reviews || []] as const;
                    } catch {
                      return [id, []] as const;
                    }
                  })
                );

                const map: Record<string, any[]> = {};
                pairs.forEach(([id, revs]) => {
                  map[id] = revs;
                });
                setRecommendedResourceReviews(map);
              } else {
                // Fallback to old endpoint if new one fails
                console.warn('New AI recommendations endpoint failed, trying fallback...');
                const fallbackRes = await fetch(
                  `${apiBaseUrl}/ai/recommendations/personalized?limit=6&historyLimit=3`,
                  {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                  }
                );
                if (fallbackRes.ok) {
                  const fallbackData = await fallbackRes.json();
                  const fallbackRecs = fallbackData?.recommendations || [];
                  setAiRecommendations(fallbackRecs);
                  if (fallbackRecs.length > 0) {
                    loadImagesForResources(fallbackRecs);
                  }
                } else {
                  setAiRecommendations([]);
                  setRecommendedResourceReviews({});
                }
              }
            } catch (aiError) {
              console.warn('AI recommendations error:', aiError);
              setAiRecommendations([]);
              setRecommendedResourceReviews({});
            }
          } else {
            setAiRecommendations([]);
            setRecommendedResourceReviews({});
          }
        } catch (error) {
          console.warn('Failed to load AI recommendations:', error);
          setAiRecommendations([]);
          setRecommendedResourceReviews({});
        }
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
        if (!error.message?.includes('401') && !error.message?.includes('Authentication')) {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger certaines données.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      loadData();
    }, 250);

    return () => clearTimeout(timer);
  }, [user, toast, reservationsVersion, resourcesVersion, apiBaseUrl]);

  const upcomingReservations = reservations
    .filter((r: any) => {
      const startTime = new Date(r.startTime);
      return startTime > new Date() && !['cancelled', 'completed'].includes(r.status);
    })
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);

  const nextReservation = upcomingReservations[0];

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      pending: { label: 'En attente', variant: 'secondary' },
      confirmed: { label: 'Confirmé', variant: 'default' },
      cancelled: { label: 'Annulé', variant: 'destructive' },
      completed: { label: 'Terminé', variant: 'outline' },
    };
    const { label, variant } = variants[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'salle':
        return <Building2 className="h-4 w-4" />;
      case 'terrain':
        return <MapPinned className="h-4 w-4" />;
      case 'equipment':
        return <Dumbbell className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getRegionalStatusMeta = (status: string) => {
    const variants: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      good: {
        label: 'Bon',
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <Sun className="h-4 w-4" />,
      },
      caution: {
        label: 'Prudence',
        className: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <CloudSun className="h-4 w-4" />,
      },
      avoid: {
        label: 'A eviter',
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <CloudRain className="h-4 w-4" />,
      },
      unknown: {
        label: 'Indisponible',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <Cloud className="h-4 w-4" />,
      },
    };

    return variants[status] || variants.unknown;
  };

  const getRegionalMotivation = (regions: any[]) => {
    const counts = regions.reduce((acc, region) => {
      const status = region?.today?.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (counts.avoid) {
      return {
        title: 'Attention aux conditions du jour',
        message:
          "Certaines zones sont difficiles. Mieux vaut reprogrammer ou choisir un horaire protege.",
        accent: 'bg-red-100 text-red-800',
        icon: <Wind className="h-5 w-5" />,
      };
    }

    if (counts.caution) {
      return {
        title: 'Conditions mixtes',
        message:
          "Quelques precautions suffisent. Choisissez un horaire adapte et equipez-vous bien.",
        accent: 'bg-amber-100 text-amber-800',
        icon: <CloudSun className="h-5 w-5" />,
      };
    }

    return {
      title: 'Belle journee pour bouger',
      message: "Les conditions sont favorables. C'est le bon moment pour reserver.",
      accent: 'bg-emerald-100 text-emerald-800',
      icon: <Sun className="h-5 w-5" />,
    };
  };

  const formatMetric = (value: unknown, unit: string, precision = 0) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 'n/a';
    }
    return `${value.toFixed(precision)}${unit}`;
  };

  const pendingReviewReservations = reservations
    .filter((r: any) => {
      const isCompleted = ['completed', 'paid'].includes(r.status);
      const hasReview = reviews.some(
        (rev: any) =>
          rev.reservation?._id === (r._id || r.id) ||
          rev.reservation?.id === (r._id || r.id) ||
          rev.reservationId === (r._id || r.id)
      );
      const hasEnded = new Date(r.endTime) <= new Date();
      return isCompleted && !hasReview && hasEnded;
    })
    .slice(0, 3);

  const handleReviewSubmit = async (reviewData: { rating: number; comment: string }) => {
    if (!pendingReviewReservation) return;
    try {
      await reviewsAPI.create({
        reservationId: pendingReviewReservation._id || pendingReviewReservation.id,
        resourceId:
          pendingReviewReservation.resourceId?._id ||
          pendingReviewReservation.resourceId?.id ||
          pendingReviewReservation.resourceId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      toast({
        title: 'Merci!',
        description: 'Votre avis a été publié avec succès.',
      });
      setIsReviewModalOpen(false);
      setPendingReviewReservation(null);

      const reviewsRes = await reviewsAPI.getAll({ page: 1, limit: 100 });
      setReviews(reviewsRes.reviews || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de publier votre avis.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
  return (
    <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      </AppLayout>
    );
  }

  const displayedRecs = aiRecommendations.length > 0 ? aiRecommendations : recommendations;
  const isAi = aiRecommendations.length > 0;
  
  // Show recommendations panel even if empty (to show the UI)
  const showRecommendationsSection = user?.role !== 'admin';

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Client top section */}
        {user?.role !== 'admin' && (
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-5 lg:p-6">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-200/50 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute right-20 bottom-10 h-32 w-32 rounded-full bg-sky-200/40 blur-2xl" />

            <div className="relative grid gap-6 lg:grid-cols-[2.5fr_1fr]">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-slate-900 shadow-lg">
                    <AvatarImage
                      src={
                        user?.avatarUrl
                          ? user.avatarUrl.startsWith('http')
                            ? user.avatarUrl
                            : `http://localhost:5000${user.avatarUrl}`
                          : undefined
                      }
                    />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-yellow-300 text-slate-900 text-lg font-bold">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="font-display text-2xl font-medium text-slate-900">
                      Salut, {user?.firstName}
                    </h1>
                    <p className="text-sm text-slate-600">
                      Tes terrains t&apos;attendent. Fais ton prochain move.
                    </p>
          </div>
            </div>

                <div className="flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Actives</p>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-500" />
                      <p className="text-2xl font-semibold text-slate-900">
                        {stats.activeReservations}
                      </p>
          </div>
        </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Total</p>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-sky-500" />
                      <p className="text-2xl font-semibold text-slate-900">
                        {stats.totalReservations}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-500">Disponibles</p>
                    <div className="flex items-center gap-2">
                      <MapPinned className="h-4 w-4 text-amber-500" />
                      <p className="text-2xl font-semibold text-slate-900">
                        {stats.terrains + stats.salles + stats.equipment}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg shadow-slate-900/30"
                  >
                    <Link to="/reservations/new">
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Réserver maintenant
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-slate-300 bg-white/90">
                    <Link to="/resources/terrains">
                      <Compass className="h-4 w-4 mr-2" />
                      Explorer les ressources
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>

              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prochaine session</p>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      Focus
                    </Badge>
                  </div>
                  {nextReservation ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {typeof nextReservation.resourceId === 'object'
                              ? nextReservation.resourceId.name
                              : 'Ressource'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {format(new Date(nextReservation.startTime), 'PPp', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        {getStatusBadge(nextReservation.status)}
                        <WeatherRecommendationBadge
                          compact
                          recommendation={weatherRecommendations[nextReservation._id || nextReservation.id]}
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReservation(nextReservation);
                            setIsTicketOpen(true);
                          }}
                        >
                          Ticket
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-slate-500">
                      Aucune réservation à venir. Réservez maintenant !
                    </div>
                  )}
                </div>

                {/* <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Ton rythme</p>
                      <p className="text-xs text-slate-400 mt-1">Un resume rapide de ton activite.</p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
                      <span className="text-xs text-slate-300">En cours</span>
                      <span className="text-lg font-semibold">{stats.activeReservations}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
                      <span className="text-xs text-slate-300">Avis a donner</span>
                      <span className="text-lg font-semibold">{pendingReviewReservations.length}</span>
                    </div>
                    <div className="rounded-xl bg-white/10 px-3 py-2">
                      <p className="text-xs text-slate-300">Objectif du mois</p>
                      <p className="text-lg font-semibold">+{Math.max(2, stats.activeReservations)} sessions</p>
                      <p className="text-xs text-slate-400">Continue sur ta lancee.</p>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </section>
        )}

        {/* Natural Language Booking - Client */}
        {user?.role !== 'admin' && (
          <div className="mt-6">
            <NaturalLanguageBooking />
          </div>
        )}

        {/* Weather Recommendations - Client */}
        {user?.role !== 'admin' && (
          <div className="mt-6">
            <WeatherRecommendations />
          </div>
        )}

        {/* Smart local recommendations section - Always show for clients */}
        {showRecommendationsSection && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl blur-2xl" />

            <div className="relative rounded-2xl border border-purple-200/50 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-xl p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-purple-500/5 to-transparent rounded-full blur-3xl -z-0" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-t from-blue-500/5 to-transparent rounded-full blur-3xl -z-0" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-75 animate-pulse" />
                      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full">
                        <Lightbulb className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Recommandations sportReserve
                      </h2>
                      <p className="text-sm text-purple-600/70">
                        {isAi ? 'IA basée sur vos 3 dernières réservations' : 'Sélectionnées spécialement pour vous'}
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100/50 text-purple-700 text-xs font-semibold">
                    <Sparkles className="h-4 w-4" />
                    {isAi ? 'IA' : 'Personnalisées'}
                  </div>
                </div>

                {displayedRecs.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayedRecs.slice(0, 3).map((resource: any, idx: number) => {
                    const resourceId = resource._id || resource.id;
                    const resourceType = resource.type;
                    const resourcePath = getResourcePathFromType(resourceType);
                    const price = resource.basePrice ?? resource.pricePerUnit ?? 0;
                    const reason = resource.reason;
                    const aiScore = resource.aiScore;

                    return (
                      <div key={resourceId} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <Card className="relative overflow-hidden border-purple-200/50 bg-white/85 backdrop-blur hover:shadow-xl hover:border-purple-400/50 transition-all duration-300 group-hover:scale-102 h-full flex flex-col">
                          <div className="relative w-full h-32 overflow-hidden bg-gradient-to-br from-purple-200 to-blue-200 flex-shrink-0 ring-1 ring-inset ring-purple-100">
                            {resourceImages[resourceId] ? (
                              <>
                                <img
                                  src={resourceImages[resourceId]}
                                  alt={resource.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                  style={{ imageRendering: 'crisp-edges', backfaceVisibility: 'hidden' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                                <div className="text-center">
                                  <Building2 className="h-10 w-10 text-purple-300 mx-auto mb-1" />
                                  <p className="text-xs text-purple-400 font-medium">Pas d&apos;image</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="absolute top-3 left-3 z-20">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              {idx + 1}
                            </div>
                          </div>

                          {typeof aiScore === 'number' && (
                            <div className="absolute top-3 right-3 z-20">
                              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg text-xs px-2 py-0.5">
                                {Math.round(aiScore)}%
                              </Badge>
                            </div>
                          )}

                          <CardHeader className="pb-1 pt-3 px-4">
                            <div className="space-y-1">
                              <CardTitle className="text-base group-hover:text-purple-600 transition-colors">
                                {resource.name}
                              </CardTitle>
                              <CardDescription className="text-xs font-medium">
                                {resource.type === 'terrain'
                                  ? '🏟️ Terrain de sport'
                                  : resource.type === 'salle'
                                    ? '🏛️ Salle de sport'
                                    : '💪 Équipement'}
                              </CardDescription>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-3 px-4 pb-3">
                            <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-2 border border-green-200/50">
                              <p className="text-xs text-green-600/70 font-medium mb-0.5">Prix</p>
                              <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                {price} DH
                              </p>
                            </div>

                            {reason && (
                              <div className="rounded-lg border border-purple-200 bg-purple-50/60 p-2">
                                <p className="text-xs text-purple-800 italic">💡 {reason}</p>
                              </div>
                            )}

                            {resource.capacity && (
                              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 border border-blue-200/50">
                                <span className="text-xs text-blue-600/70 font-medium">Capacité</span>
                                <span className="text-lg font-semibold text-blue-600 flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {resource.capacity}
                                </span>
                              </div>
                            )}

                            <Link to={`/resources/${resourcePath}/${resourceId}`} className="block">
                              <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg group-hover:shadow-xl transition-all">
                                <Lightbulb className="h-4 w-4 mr-2" />
                                Consulter
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                      <Lightbulb className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Aucune recommandation disponible
                    </h3>
                    <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
                      {reservations.length === 0
                        ? 'Réservez d\'abord pour obtenir des suggestions personnalisées basées sur vos préférences.'
                        : 'L\'IA analyse vos réservations pour vous proposer des terrains adaptés. Vos recommandations apparaîtront bientôt !'}
                    </p>
                    <Link to="/reservations/new">
                      <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        <CalendarPlus className="h-4 w-4 mr-2" />
                        Faire une réservation
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-purple-200/30">
                  <p className="text-sm text-gray-600">
                    💡 Basées sur{' '}
                    <span className="font-semibold text-purple-600">
                      {isAi ? 'vos 3 dernières réservations' : `${reservations.length} réservations`}
                    </span>
                  </p>
                  <Link to="/resources/terrains">
                    <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50">
                      Voir plus <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Avis clients for AI recommended resources */}
        {user?.role !== 'admin' && aiRecommendations.length > 0 && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Avis clients sur vos recommandations
              </CardTitle>
              <CardDescription>
                Retours réels des utilisateurs sur les ressources recommandées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {aiRecommendations.slice(0, 3).flatMap((rec: any) => {
                  const id = rec._id || rec.id;
                  const recReviews = recommendedResourceReviews[id] || [];
                  return recReviews.map((review: any) => (
                    <ReviewCard
                      key={review._id || review.id}
                      review={review}
                      currentUserId={user?.id}
                    />
                  ));
                })}
              </div>
              {Object.values(recommendedResourceReviews).every((arr) => (arr?.length || 0) === 0) && (
                <div className="text-sm text-muted-foreground">
                  Pas encore d&apos;avis pour ces ressources.
                </div>
              )}
            </CardContent>
          </Card>
        )}

  

        {/* Reviews prompt */}
        {user?.role !== 'admin' && pendingReviewReservations.length > 0 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-orange-400 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0 fill-orange-400" />
                  <div>
                    <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                      ⭐ Partagez votre expérience
                    </h3>
                    <p className="text-sm text-orange-800 mt-1">
                      Vous avez {pendingReviewReservations.length} réservation
                      {pendingReviewReservations.length > 1 ? 's' : ''} complétée
                      {pendingReviewReservations.length > 1 ? 's' : ''} à évaluer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pendingReviewReservations.map((reservation: any) => (
                <Card
                  key={reservation._id || reservation.id}
                  className="border-orange-200 bg-white hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {typeof reservation.resourceId === 'object'
                            ? reservation.resourceId.name
                            : 'Ressource'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(reservation.startTime), 'PPp', { locale: fr })}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setPendingReviewReservation(reservation);
                          setIsReviewModalOpen(true);
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                        size="sm"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Donner mon avis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Calendars */}
        {user?.role !== 'admin' && (
          <div className="mt-8">
            <ReservationCalendar reservations={reservations} isAdminView={false} />
          </div>
        )}

        {user?.role === 'admin' && (
          <>
            {/* Admin AI Dashboard - Overview avec insights IA */}
            <div className="mt-6">
              <AdminAIDashboard />
            </div>

            {/* Admin Broadcast Notification */}
            <div className="mt-6">
              <AdminBroadcastNotification />
            </div>

            {/* Calendar */}
            <div className="mt-8">
              <ReservationCalendar reservations={reservations} isAdminView />
            </div>
          </>
        )}

        {user?.role === 'admin' && reviews.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-amber-500" />
                Derniers avis utilisateurs
              </CardTitle>
              <CardDescription>Les {Math.min(5, reviews.length)} avis les plus récents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {reviews.slice(0, 5).map((review: any) => (
                  <div key={review._id || review.id} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={(review.userId || review.user)?.avatarUrl} />
                        <AvatarFallback className="text-xs bg-amber-100">
                          {(review.userId || review.user)?.firstName?.[0]}
                          {(review.userId || review.user)?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {(review.userId || review.user)?.firstName} {(review.userId || review.user)?.lastName}
                          </p>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {typeof review.resourceId === 'object' ? review.resourceId.name : 'Ressource'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          &quot;{review.comment}&quot;
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(review.createdAt), 'PPp', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Analytics - Graphiques uniquement (pas de doublons avec AdminAIDashboard) */}
        {user?.role === 'admin' && (
          <div className="mt-8 pt-8 border-t-2 border-slate-200">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Analytics Détaillées</h2>
              <p className="text-sm text-slate-600">Graphiques et tendances des réservations</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Graphique: Tendance des revenus */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Tendance des revenus
                  </CardTitle>
                  <CardDescription>Chiffre d&apos;affaires sur les 12 derniers mois</CardDescription>
                </CardHeader>
                <CardContent>
                  {adminStats.revenueByMonth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={adminStats.revenueByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => `${Number(value).toLocaleString('fr-FR')} DH`}
                          labelFormatter={(label: any) => `Mois: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={{ fill: '#10b981', r: 4 }}
                          name="Chiffre d'affaires"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Graphique: Réservations par statut */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Réservations par statut
                  </CardTitle>
                  <CardDescription>Distribution des réservations</CardDescription>
                </CardHeader>
                <CardContent>
                  {adminStats.bookingsByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={adminStats.bookingsByStatus}
                          cx="40%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ value }: any) => value}
                        >
                          {adminStats.bookingsByStatus.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `${value} réservations`} />
                        <Legend verticalAlign="middle" align="right" layout="vertical" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Graphique: Distribution des ressources */}
         
          </div>
        )}
      </div>

      {/* Client AI floating widgets */}
      {user?.role !== 'admin' && (
        <>
          <AIChatbot />
        </>
      )}

      {pendingReviewReservation && (
        <ReviewModal
          reservation={pendingReviewReservation}
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setPendingReviewReservation(null);
          }}
          onSubmit={handleReviewSubmit}
        />
      )}

      {selectedReservation && (
        <ReservationTicket
          reservation={selectedReservation}
          isOpen={isTicketOpen}
          onClose={() => {
            setIsTicketOpen(false);
            setSelectedReservation(null);
          }}
        />
      )}
    </AppLayout>
  );
};

