import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { bookingsAPI, resourcesAPI, reviewsAPI } from '@/lib/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ReservationTicket } from '@/components/reservations/ReservationTicket';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import { ReviewCard } from '@/components/reviews/ReviewCard';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const RESOURCE_TYPE_COLORS: Record<string, string> = {
  Terrains: '#10b981',
  Salles: '#f59e0b',
  Équipements: '#8b5cf6',
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [pendingReviewReservation, setPendingReviewReservation] = useState<any>(null);
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

        // Load reviews
        try {
          const reviewsRes = await reviewsAPI.getAll({ page: 1, limit: 100 });
          setReviews(reviewsRes.reviews || []);
        } catch (error) {
          console.warn('Failed to load reviews:', error);
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
  }, [user, toast]);

  const upcomingReservations = reservations
    .filter((r: any) => {
      const startTime = new Date(r.startTime);
      return startTime > new Date() && !['cancelled', 'completed'].includes(r.status);
    })
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);

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

  // Get reservations pending user reviews (completed but not reviewed)
  const pendingReviewReservations = reservations
    .filter((r: any) => {
      const isCompleted = ['completed', 'paid'].includes(r.status);
      const hasReview = reviews.some((rev: any) => rev.reservation?._id === r._id || rev.reservation?.id === r.id);
      return isCompleted && !hasReview;
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
      {/* Pending Reviews Notification - Only for regular users, not admins */}
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

          {/* Pending Review Cards */}
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

        {/* Welcome header */}
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

        {/* Latest Reviews for Admin - Right after welcome */}
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

        {/* Reviews Section - For both users and admins */}
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

        {/* Quick Access for Users / Stats cards for Admin */}
        {user?.role === 'admin' ? (
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
        ) : (
          <Card className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <Zap className="h-6 w-6 text-blue-600" />
                Accès Rapide
              </CardTitle>
              <CardDescription>Explorez nos ressources disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link to="/resources/terrains">
                  <Card className="border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="pt-6 pb-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                          <MapPinned className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-green-700">Terrains</h3>
                          <p className="text-sm text-muted-foreground mt-1">{stats.terrains} disponibles</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/resources/salles">
                  <Card className="border-2 border-orange-200 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="pt-6 pb-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                          <Building2 className="h-8 w-8 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-orange-700">Salles</h3>
                          <p className="text-sm text-muted-foreground mt-1">{stats.salles} disponibles</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to="/resources/equipements">
                  <Card className="border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="pt-6 pb-6 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                          <Dumbbell className="h-8 w-8 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-purple-700">Équipements</h3>
                          <p className="text-sm text-muted-foreground mt-1">{stats.equipment} disponibles</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming reservations */}
    


        </div>

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

      {/* Review Modal */}
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
