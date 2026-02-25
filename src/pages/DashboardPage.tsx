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
  Printer,
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
  ResponsiveContainer 
} from 'recharts';
import { bookingsAPI, resourcesAPI, reviewsAPI, mediaAPI, weatherAPI } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { analyzeBookingPatterns, getRecommendations, getTrendingResources } from '@/lib/recommendations';
import { getImageUrl } from '@/lib/utils';
import { ReservationTicket } from '@/components/reservations/ReservationTicket';
import { WeatherRecommendationBadge } from '@/components/reservations/WeatherRecommendationBadge';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReservationCalendar } from '@/components/dashboard/ReservationCalendar';
import { AdminBroadcastNotification } from '@/components/notifications/AdminBroadcast';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const RESOURCE_TYPE_COLORS: Record<string, string> = {
  Terrains: '#10b981',
  Salles: '#f59e0b',
  Équipements: '#8b5cf6',
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { reservationsVersion, resourcesVersion } = useDataSync();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [pendingReviewReservation, setPendingReviewReservation] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [allResources, setAllResources] = useState<any[]>([]);
  const [resourceImages, setResourceImages] = useState<{[key: string]: string}>({});
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

  // Function to load images for recommended resources
  const loadImagesForResources = async (resources: any[]) => {
    const images: {[key: string]: string} = {};
    const imageLoadPromises: Promise<void>[] = [];
    
    try {
      for (const resource of resources) {
        imageLoadPromises.push(
          (async () => {
            try {
              let imageUrl: string | null = null;
              
              // Try 1: Use resource.image field directly
              if (resource.image) {
                imageUrl = getImageUrl(resource.image);
              }
              
              // Try 2: Load from media API with proper error handling
              if (!imageUrl) {
                try {
                  const mediaRes = await mediaAPI.getByResource(resource._id);
                  if (mediaRes?.mediaAssets && mediaRes.mediaAssets.length > 0) {
                    // Look for image type media - try multiple field names (mediaType, type, mimeType)
                    const imageMedia = mediaRes.mediaAssets.find((m: any) => {
                      const mType = m.mediaType || m.type || m.mimeType || '';
                      return mType.includes('image') && m.originalUrl;
                    });
                    
                    if (imageMedia && imageMedia.originalUrl) {
                      imageUrl = getImageUrl(imageMedia.originalUrl);
                    } else if (mediaRes.mediaAssets[0]?.originalUrl) {
                      // Fallback: use first media asset if it exists
                      imageUrl = getImageUrl(mediaRes.mediaAssets[0].originalUrl);
                    }
                  }
                } catch (apiError) {
                  // Silently fail - no image available
                  console.debug(`Media API lookup for ${resource._id}:`, apiError);
                }
              }
              
              if (imageUrl && !imageUrl.includes('placeholder')) {
                images[resource._id] = imageUrl;
              }
            } catch (error) {
              // Silently fail for individual resources
              console.debug(`Failed to load image for resource ${resource._id}:`, error);
            }
          })()
        );
      }
      
      // Wait for all image loading in parallel
      await Promise.all(imageLoadPromises);
      setResourceImages(images);
    } catch (error) {
      console.warn('Failed to load images for resources:', error);
    }
  };

  useEffect(() => {
    // Wait for user to be available
    if (!user) {
      // Check localStorage as fallback
      const storedUser = localStorage.getItem('currentUser');
      const token = localStorage.getItem('token');
      if (!storedUser || !token) {
        return;
      }
    }
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Try to load data, but don't fail if API calls fail
        let bookingsRes, resourcesRes;
        try {
          bookingsRes = await bookingsAPI.getAll({ page: 1, limit: 10000 });
        } catch (error) {
          console.warn('Failed to load bookings:', error);
          bookingsRes = { reservations: [] };
        }
        
        try {
          resourcesRes = await resourcesAPI.getAll({ status: 'active', page: 1, limit: 1000 });
        } catch (error) {
          console.warn('Failed to load resources:', error);
          resourcesRes = { resources: [] };
        }

        setReservations(bookingsRes.reservations || []);
        
        const userReservations = bookingsRes.reservations || [];
        const resources = resourcesRes.resources || [];
        
        setStats({
          totalReservations: userReservations.length,
          activeReservations: userReservations.filter((r: any) => 
            ['confirmed', 'paid', 'active'].includes(r.status)
          ).length,
          terrains: resources.filter((r: any) => r.type === 'terrain').length,
          salles: resources.filter((r: any) => r.type === 'salle').length,
          equipment: resources.filter((r: any) => r.type === 'equipment').length,
        });

        // Load admin stats if user is admin
        if (user?.role === 'admin') {
          const paidBookings = userReservations.filter((b: any) => b.status === 'paid');
          const totalRevenue = paidBookings.reduce((sum: number, b: any) => {
            const amount = b.totalAmount ?? b.totalPrice ?? 0;
            return sum + amount;
          }, 0);

          const completedBookings = userReservations.filter((b: any) => b.status === 'completed').length;
          const pendingBookings = userReservations.filter((b: any) => b.status === 'pending').length;

          // Generate monthly revenue
          const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
          const monthlyData: { [key: string]: number } = {};
          months.forEach(month => {
            monthlyData[month] = 0;
          });
          
          paidBookings.forEach((booking: any) => {
            if (booking.createdAt) {
              const date = new Date(booking.createdAt);
              const month = months[date.getMonth()];
              const amount = booking.totalAmount ?? booking.totalPrice ?? 0;
              monthlyData[month] += amount;
            }
          });

          const revenueByMonth = months.map(month => ({
            month,
            revenue: monthlyData[month],
          }));

          // Bookings by status
          const bookingsByStatus = [
            { name: 'Confirmées', value: userReservations.filter((b: any) => b.status === 'confirmed').length },
            { name: 'Payées', value: userReservations.filter((b: any) => b.status === 'paid').length },
            { name: 'En attente', value: pendingBookings },
            { name: 'Complétées', value: completedBookings },
            { name: 'Annulées', value: userReservations.filter((b: any) => b.status === 'cancelled').length },
          ];  

          // Resources by type
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

        try {
          const weatherRes = await bookingsAPI.getRecommendations({ scope: 'upcoming', days: 7, limit: 20 });
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

        try {
          const regionalRes = await weatherAPI.getRegions();
          setRegionalWeather(regionalRes.regions || []);
          setRegionalWeatherUpdatedAt(regionalRes.updatedAt || null);
        } catch (regionalError) {
          console.warn('Failed to load regional weather:', regionalError);
        }

        // Load reviews
        try {
          const reviewsRes = await reviewsAPI.getAll({ page: 1, limit: 100 });
          setReviews(reviewsRes.reviews || []);
        } catch (error) {
          console.warn('Failed to load reviews:', error);
        }

        // Load and analyze recommendations
        try {
          const allResourcesRes = await resourcesAPI.getAll({ status: 'active', page: 1, limit: 100 });
          const resources = allResourcesRes.resources || [];
          setAllResources(resources);
          
          // Analyze patterns and get recommendations
          const pattern = analyzeBookingPatterns(userReservations);
          const recs = getTrendingResources(resources, pattern);
          setRecommendations(recs);
          
          // Load images for recommendations
          loadImagesForResources(recs);
        } catch (error) {
          console.warn('Failed to load recommendations:', error);
        }
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
        // Don't show error toast for auth errors - they're handled elsewhere
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

    // Small delay to ensure user state is stable after login
    const timer = setTimeout(() => {
      loadData();
    }, 300);

    return () => clearTimeout(timer);
  }, [user, toast]); // Only reload on mount, not on version changes

  const upcomingReservations = reservations
    .filter((r: any) => {
      const startTime = new Date(r.startTime);
      return startTime > new Date() && !['cancelled', 'completed'].includes(r.status);
    })
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);
  const nextReservation = upcomingReservations[0];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
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
      case 'salle': return <Building2 className="h-4 w-4" />;
      case 'terrain': return <MapPinned className="h-4 w-4" />;
      case 'equipment': return <Dumbbell className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
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
    const counts = regions.reduce(
      (acc, region) => {
        const status = region?.today?.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    if (counts.avoid) {
      return {
        title: 'Attention aux conditions du jour',
        message: "Certaines zones sont difficiles. Mieux vaut reprogrammer ou choisir un horaire protege.",
        accent: 'bg-red-100 text-red-800',
        icon: <Wind className="h-5 w-5" />,
      };
    }

    if (counts.caution) {
      return {
        title: 'Conditions mixtes',
        message: "Quelques precautions suffisent. Choisissez un horaire adapte et equipez-vous bien.",
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

  // Get reservations pending user reviews (completed but not reviewed)
  const pendingReviewReservations = reservations
    .filter((r: any) => {
      const isCompleted = ['completed', 'paid'].includes(r.status);
      const hasReview = reviews.some((rev: any) => rev.reservation?._id === r._id || rev.reservation?.id === r.id);
      const hasEnded = new Date(r.endTime) <= new Date(); // Only show review after reservation end time
      return isCompleted && !hasReview && hasEnded;
    })
    .slice(0, 3);

  // Handle review submission
  const handleReviewSubmit = async (reviewData: { rating: number; comment: string }) => {
    if (!pendingReviewReservation) return;
    try {
      await reviewsAPI.create({
        reservationId: pendingReviewReservation._id || pendingReviewReservation.id,
        resourceId: pendingReviewReservation.resourceId?._id || pendingReviewReservation.resourceId?.id || pendingReviewReservation.resourceId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      toast({
        title: 'Merci!',
        description: 'Votre avis a été publié avec succès.',
      });
      setIsReviewModalOpen(false);
      setPendingReviewReservation(null);
      // Refresh reviews
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

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* User Greeting + Weather Section - TOP */}
        {user?.role !== 'admin' && (
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-5 lg:p-6">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-orange-200/50 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute right-20 bottom-10 h-32 w-32 rounded-full bg-sky-200/40 blur-2xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-slate-900 shadow-lg">
                    <AvatarImage
                      src={user?.avatarUrl
                        ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`)
                        : undefined
                      }
                    />
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-yellow-300 text-slate-900 text-lg font-bold">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="font-display text-2xl font-medium text-slate-900">Salut, {user?.firstName}</h1>
                    <p className="text-sm text-slate-600">Tes terrains t'attendent. Fais ton prochain move.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">Actives</p>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-500" />
                      <p className="text-2xl font-semibold text-slate-900">{stats.activeReservations}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Total</p>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-sky-500" />
                      <p className="text-2xl font-semibold text-slate-900">{stats.totalReservations}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-500">Disponibles</p>
                    <div className="flex items-center gap-2">
                      <MapPinned className="h-4 w-4 text-amber-500" />
                      <p className="text-2xl font-semibold text-slate-900">{stats.terrains + stats.salles + stats.equipment}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg shadow-slate-900/30">
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

                {regionalWeather.length > 0 && (
                  <div className="space-y-4">
                    <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-sm ${getRegionalMotivation(regionalWeather).accent}`}>
                      {getRegionalMotivation(regionalWeather).icon}
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{getRegionalMotivation(regionalWeather).title}</p>
                        <p className="text-xs opacity-80">{getRegionalMotivation(regionalWeather).message}</p>
                        <p className="text-xs italic opacity-75">"Bouge aujourd'hui, remercie-toi demain."</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Meteo locale</p>
                        <div className="flex items-center gap-2 text-slate-500 text-xs">
                          <Sun className="h-4 w-4" />
                          Aujourd'hui & demain
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
                        <Sparkles className="h-4 w-4" />
                        Choisis ton meilleur moment pour t'entrainer.
                      </div>
                      <div className="mt-4 grid gap-3">
                        {regionalWeather.map((region: any) => {
                          const todayMeta = getRegionalStatusMeta(region?.today?.status || 'unknown');
                          const tomorrowMeta = getRegionalStatusMeta(region?.tomorrow?.status || 'unknown');
                          const todayMetrics = region?.today?.metrics || {};
                          return (
                            <div key={region.key} className="rounded-xl border border-slate-200 bg-white/90 p-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-900">{region.name}</p>
                                <Badge variant="outline" className={`border ${todayMeta.className} flex items-center gap-1`}>
                                  {todayMeta.icon}
                                  {todayMeta.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{region?.today?.summary || 'Donnees indisponibles.'}</p>
                              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1">
                                  <span className="flex items-center gap-1">
                                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                                    Temp
                                  </span>
                                  <span className="font-medium text-slate-800">
                                    {typeof todayMetrics.tempMin === 'number' && typeof todayMetrics.tempMax === 'number'
                                      ? `${Math.round(todayMetrics.tempMin)}-${Math.round(todayMetrics.tempMax)}°C`
                                      : 'n/a'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1">
                                  <span className="flex items-center gap-1">
                                    <Wind className="h-3.5 w-3.5 text-sky-500" />
                                    Vent
                                  </span>
                                  <span className="font-medium text-slate-800">
                                    {formatMetric(todayMetrics.windMax, ' km/h')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1">
                                  <span className="flex items-center gap-1">
                                    <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                                    Pluie
                                  </span>
                                  <span className="font-medium text-slate-800">
                                    {formatMetric(todayMetrics.precipitationMax, ' mm', 1)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1">
                                  <span className="flex items-center gap-1">
                                    <Cloud className="h-3.5 w-3.5 text-slate-500" />
                                    Humidite
                                  </span>
                                  <span className="font-medium text-slate-800">
                                    {formatMetric(todayMetrics.humidityMax, ' %')}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  {tomorrowMeta.icon}
                                  Demain
                                </span>
                                <span className="font-medium">{tomorrowMeta.label}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {regionalWeatherUpdatedAt && (
                        <div className="mt-3 text-xs text-slate-400">
                          Mise a jour: {format(new Date(regionalWeatherUpdatedAt), 'PPp', { locale: fr })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prochaine session</p>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">Focus</Badge>
                  </div>
                  {nextReservation ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {typeof nextReservation.resourceId === 'object' ? nextReservation.resourceId.name : 'Ressource'}
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
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Focus du jour</p>
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">Inspire</Badge>
                        </div>
                        <div className="mt-4 grid gap-4">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <Calendar className="h-4 w-4 text-emerald-600" />
                              Prochaines reservations
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Ton agenda sportif en un coup d'oeil.</p>
                            <div className="mt-3 space-y-3">
                              {upcomingReservations.length > 0 ? (
                                upcomingReservations.map((reservation: any) => (
                                  <div
                                    key={reservation._id || reservation.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                        {getResourceIcon(reservation.resourceId?.type || reservation.type)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                          {typeof reservation.resourceId === 'object'
                                            ? reservation.resourceId.name
                                            : 'Ressource'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {format(new Date(reservation.startTime), 'PPp', { locale: fr })}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {getStatusBadge(reservation.status)}
                                      <WeatherRecommendationBadge
                                        compact
                                        recommendation={weatherRecommendations[reservation._id || reservation.id]}
                                      />
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                                  Aucun rendez-vous pour le moment. Planifie ta prochaine session.
                                </div>
                              )}
                            </div>
                            <div className="pt-3">
                              <Button asChild variant="outline" className="border-slate-300">
                                <Link to="/reservations">
                                  Voir tout mon calendrier
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Link>
                              </Button>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
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
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </section>
        )}

        {/* Smart AI Recommendations Section */}
        {user?.role !== 'admin' && recommendations.length > 0 && (
          <div className="relative">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl blur-2xl" />
            
            <div className="relative rounded-2xl border border-purple-200/50 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 backdrop-blur-xl p-8 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-purple-500/5 to-transparent rounded-full blur-3xl -z-0" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-t from-blue-500/5 to-transparent rounded-full blur-3xl -z-0" />

              <div className="relative z-10 space-y-6">
                {/* Header with AI indicator */}
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
                      <p className="text-sm text-purple-600/70">Sélectionnées spécialement pour vous</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100/50 text-purple-700 text-xs font-semibold">
                    <Sparkles className="h-4 w-4" />
                    Personnalisées pour vous
                  </div>
                </div>

                {/* Recommendations Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recommendations.slice(0, 3).map((resource: any, idx: number) => (
                    <div 
                      key={resource._id || resource.id}
                      className="group relative"
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <Card className="relative overflow-hidden border-purple-200/50 bg-white/85 backdrop-blur hover:shadow-xl hover:border-purple-400/50 transition-all duration-300 group-hover:scale-102 h-full flex flex-col">
                        {/* Resource Image - Sharp, Fitted & Compact */}
                        <div className="relative w-full h-32 overflow-hidden bg-gradient-to-br from-purple-200 to-blue-200 flex-shrink-0 ring-1 ring-inset ring-purple-100">
                          {resourceImages[resource._id || resource.id] ? (
                            <>
                              <img
                                src={resourceImages[resource._id || resource.id]}
                                alt={resource.name}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                                style={{ 
                                  imageRendering: 'crisp-edges',
                                  backfaceVisibility: 'hidden'
                                }}
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                  const parent = img.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                                        <div class="text-center">
                                          <svg class="h-10 w-10 text-purple-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
                                          </svg>
                                          <p class="text-xs text-purple-400 font-medium">Image</p>
                                        </div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                              {/* Gradient overlay for better contrast */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                              <div className="text-center">
                                <Building2 className="h-10 w-10 text-purple-300 mx-auto mb-1" />
                                <p className="text-xs text-purple-400 font-medium">Pas d'image</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Rating Badge */}
                        <div className="absolute top-3 right-3 z-20">
                          {resource.averageRating ? (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg text-xs px-2 py-0.5">
                              <Star className="h-3 w-3 fill-white mr-1" />
                              {resource.averageRating.toFixed(1)}
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg text-xs px-2 py-0.5">Nouveau</Badge>
                          )}
                        </div>

                        {/* Recommendation Index */}
                        <div className="absolute top-3 left-3 z-20">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {idx + 1}
                          </div>
                        </div>

                        <CardHeader className="pb-1 pt-3 px-4">
                          <div className="space-y-1">
                            <CardTitle className="text-base group-hover:text-purple-600 transition-colors">
                              {resource.name}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium">
                              {resource.type === 'terrain' ? '🏟️ Terrain de sport' : resource.type === 'salle' ? '🏛️ Salle de sport' : '💪 Équipement'}
                            </CardDescription>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3 px-4 pb-3">
                          {/* Price - Highlighted */}
                          <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-2 border border-green-200/50">
                            <p className="text-xs text-green-600/70 font-medium mb-0.5">Prix</p>
                            <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              {resource.pricePerUnit || 0} DH
                            </p>
                            <p className="text-xs text-green-600/60 mt-0.5">
                              {resource.pricingModel === 'hourly' && '/heure'}
                              {resource.pricingModel === 'daily' && '/jour'}
                              {resource.pricingModel === 'weekly' && '/semaine'}
                              {resource.pricingModel === 'monthly' && '/mois'}
                              {resource.pricingModel === 'package' && 'forfait'}
                              {!resource.pricingModel && '/heure'}
                            </p>
                          </div>

                          {/* Capacity */}
                          {resource.capacity && (
                            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 border border-blue-200/50">
                              <span className="text-xs text-blue-600/70 font-medium">Capacité</span>
                              <span className="text-lg font-semibold text-blue-600 flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {resource.capacity}
                              </span>
                            </div>
                          )}

                          {/* Action Button */}
                          <Link to={`/resources/${resource._id || resource.id}`} className="block">
                            <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-lg group-hover:shadow-xl transition-all">
                              <Lightbulb className="h-4 w-4 mr-2" />
                              Consulter
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between pt-4 border-t border-purple-200/30">
                  <p className="text-sm text-gray-600">
                    💡 Basées sur <span className="font-semibold text-purple-600">{reservations.length} de vos réservations</span> précédentes
                  </p>
                  <Link to="/resources/terrain">
                    <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50">
                      Voir plus <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      Vous avez {pendingReviewReservations.length} réservation{pendingReviewReservations.length > 1 ? 's' : ''} complétée{pendingReviewReservations.length > 1 ? 's' : ''} à évaluer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pendingReviewReservations.map((reservation: any) => (
                <Card key={reservation._id || reservation.id} className="border-orange-200 bg-white hover:shadow-md transition-shadow">
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

        {user?.role !== 'admin' && (
          <>
          {/* Reservation Calendar */}
          <div className="mt-8">
            <ReservationCalendar 
              reservations={reservations}
              isAdminView={false}
              onDateClick={(date) => {
                console.log('Date clicked:', date);
              }}
            />
          </div>
          </>
        )}

        {user?.role === 'admin' && (
          <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 backdrop-blur-sm p-6 rounded-lg border border-blue-100">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-blue-600 shadow-md">
                <AvatarImage 
                  src={user?.avatarUrl 
                    ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:5000${user.avatarUrl}`)
                    : undefined
                  } 
                />
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Bonjour, {user?.firstName} 👋
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gérez vos réservations et découvrez les ressources disponibles
                </p>
              </div>
            </div>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
              <Link to="/reservations/new">
                <CalendarPlus className="h-4 w-4 mr-2" />
                Nouvelle réservation
              </Link>
            </Button>
          </div>

          {/* Admin Broadcast Notification */}
          <div className="mt-6">
            <AdminBroadcastNotification />
          </div>

          {/* Admin Reservation Calendar */}
          <div className="mt-8">
            <ReservationCalendar 
              reservations={reservations}
              isAdminView={true}
              onDateClick={(date) => {
                console.log('Date clicked:', date);
              }}
            />
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
                          {(review.userId || review.user)?.firstName?.[0]}{(review.userId || review.user)?.lastName?.[0]}
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
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {typeof review.resourceId === 'object' ? review.resourceId.name : 'Ressource'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          "{review.comment}"
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

        {reviews.length > 0 && (
          <div className={`mt-6 pt-6 ${user?.role === 'admin' ? 'border-t-2 border-blue-200' : ''}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                Avis et commentaires
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 3).map((review) => {
                const resourceId = typeof review.resourceId === 'object' ? review.resourceId._id : review.resourceId;
                const resourceType = typeof review.resourceId === 'object' ? review.resourceId.type : null;
                const resourcePath = resourceType === 'terrain' ? 'terrains' : resourceType === 'salle' ? 'salles' : 'equipements';
                const resourceImage = typeof review.resourceId === 'object' ? review.resourceId.imageUrl : null;
                const resourceName = typeof review.resourceId === 'object' ? review.resourceId.name : 'Ressource';
                
                return (
                  <Link 
                    key={review._id || review.id} 
                    to={`/resources/${resourcePath}/${resourceId}`}
                    className="block"
                  >
                    <Card className="hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer overflow-hidden">
                      {/* Resource Image */}
                      {resourceImage && (
                        <div className="relative h-40 w-full bg-gradient-to-br from-gray-100 to-gray-200">
                          <img 
                            src={resourceImage.startsWith('http') ? resourceImage : `http://localhost:5000${resourceImage}`}
                            alt={resourceName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                              {resourceName}
                            </Badge>
                          </div>
                        </div>
                      )}
                      
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={(review.userId || review.user)?.avatarUrl} />
                              <AvatarFallback className="text-xs">
                                {(review.userId || review.user)?.firstName?.[0]}{(review.userId || review.user)?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-bold">{(review.userId || review.user)?.firstName} {(review.userId || review.user)?.lastName}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(review.createdAt), 'PP', { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Rating stars */}
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Comment */}
                        <p className="text-sm text-gray-700 line-clamp-2 italic border-l-4 border-yellow-300 pl-3">
                          "{review.comment}"
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Admin only: See all comments link */}
            {user?.role === 'admin' && reviews.length > 0 && (
              <div className="text-center mt-6">
                <Link to="/reviews" className="inline-block">
                  <Button variant="outline" className="gap-2">
                    Voir tous les commentaires ({reviews.length})
                    <span>→</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Stats cards for Admin */}
        {user?.role === 'admin' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-3 bg-green-50">
                <CardTitle className="text-sm font-medium">🏟️ Terrains</CardTitle>
                <MapPinned className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-green-600">{stats.terrains}</div>
                <p className="text-xs text-muted-foreground mt-1">disponibles</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-3 bg-orange-50">
                <CardTitle className="text-sm font-medium">🏛️ Salles</CardTitle>
                <Building2 className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-orange-600">{stats.salles}</div>
                <p className="text-xs text-muted-foreground mt-1">disponibles</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-3 bg-purple-50">
                <CardTitle className="text-sm font-medium">🏋️ Équipements</CardTitle>
                <Dumbbell className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-purple-600">{stats.equipment}</div>
                <p className="text-xs text-muted-foreground mt-1">disponibles</p>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Admin Analytics Section */}
        {user?.role === 'admin' && (
          <>
            <div className="mt-12 pt-8 border-t-2 border-blue-200">

              {/* Admin KPI Cards */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Chiffre d'affaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {adminStats.totalRevenue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} DH
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total des revenus</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Réservations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{adminStats.totalBookings}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total des réservations</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      En attente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{adminStats.pendingBookings}</div>
                    <p className="text-xs text-muted-foreground mt-1">À confirmer</p>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Tendance des revenus
                    </CardTitle>
                    <CardDescription>Chiffre d'affaires sur les 12 derniers mois</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {adminStats.revenueByMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={adminStats.revenueByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => `${value.toLocaleString('fr-FR')} DH`}
                            labelFormatter={(label) => `Mois: ${label}`}
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

                {/* Bookings by Status */}
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
                            label={({ value }) => value}
                          >
                            {adminStats.bookingsByStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} réservations`} />
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

              {/* Resources by Type */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-purple-600" />
                    Distribution des ressources
                  </CardTitle>
                  <CardDescription>Répartition par type de ressource</CardDescription>
                </CardHeader>
                <CardContent>
                  {adminStats.resourcesByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={adminStats.resourcesByType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `${value} ressources`} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {adminStats.resourcesByType.map((entry, index) => (
                            <Cell
                              key={`bar-${entry.name}-${index}`}
                              fill={RESOURCE_TYPE_COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                          <LabelList dataKey="count" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

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

      {/* Ticket Dialog */}
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
