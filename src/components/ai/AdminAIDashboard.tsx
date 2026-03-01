/**
 * 👨‍💼 Admin AI Dashboard Component
 * Affiche insights IA, analytics, prédictions, et détection d'abus
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Users,
  BarChart3,
  Lightbulb,
  Shield,
  Calendar,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DashboardInsights {
  overview: {
    totalReservations: number;
    totalRevenue: number;
    activeUsers: number;
    averageRevenuePerReservation: number;
  };
  topResources: any[];
  suspiciousUsers: any[];
  demandPredictions: any[];
  aiInsights: {
    insights: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      action: string;
    }>;
  };
  recommendations: any[];
}

export const AdminAIDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    loadAnalytics();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();
      if (data.success) {
        setInsights(data);
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger le dashboard',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/ai/admin/analytics?days=30`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erreur lors du chargement');

      const data = await response.json();
      if (data.success) {
        setAnalytics(data);
      }
    } catch (error: any) {
      console.error('Analytics error:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-500">Impossible de charger les données</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription>Revenu Total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <p className="text-2xl font-bold text-slate-900">
                {insights.overview.totalRevenue.toLocaleString()} DH
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription>Réservations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <p className="text-2xl font-bold text-slate-900">
                {insights.overview.totalReservations.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription>Utilisateurs Actifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <p className="text-2xl font-bold text-slate-900">
                {insights.overview.activeUsers.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-2">
            <CardDescription>Revenu Moyen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <p className="text-2xl font-bold text-slate-900">
                {Math.round(insights.overview.averageRevenuePerReservation)} DH
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">🧠 Insights IA</TabsTrigger>
          <TabsTrigger value="predictions">📊 Prédictions</TabsTrigger>
          <TabsTrigger value="suspicious">🛡️ Comportements Suspects</TabsTrigger>
          <TabsTrigger value="analytics">📈 Analytics</TabsTrigger>
        </TabsList>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-purple-600" />
                <CardTitle>Insights IA</CardTitle>
              </div>
              <CardDescription>
                Analyses intelligentes générées par l&apos;IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.aiInsights?.insights?.map((insight, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">{insight.title}</h4>
                        <Badge
                          variant={
                            insight.impact === 'high'
                              ? 'destructive'
                              : insight.impact === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {insight.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{insight.description}</p>
                      <p className="text-xs text-slate-500">
                        <strong>Action:</strong> {insight.action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommandations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {insights.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3"
                  >
                    <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{rec.title}</p>
                      <p className="text-sm text-slate-600">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <CardTitle>Prédictions de Demande</CardTitle>
              </div>
              <CardDescription>
                Prévisions IA pour les 7 prochains jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.demandPredictions && insights.demandPredictions.length > 0 ? (
                <div className="space-y-4">
                  {insights.demandPredictions.slice(0, 5).map((pred: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {pred.resourceName || 'Ressource'}
                          </p>
                          <p className="text-xs text-slate-500">{pred.resourceType}</p>
                        </div>
                        <Badge
                          variant={
                            pred.summary?.peakDays?.length > 0 ? 'default' : 'secondary'
                          }
                        >
                          {pred.summary?.averageDailyBookings || 0} réservations/jour
                        </Badge>
                      </div>
                      {pred.forecast && pred.forecast.length > 0 && (
                        <div className="mt-3">
                          <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={pred.forecast.slice(0, 7)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="date"
                                tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { weekday: 'short' })}
                              />
                              <YAxis />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="expectedBookings"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">
                  Aucune prédiction disponible
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suspicious Behavior Tab */}
        <TabsContent value="suspicious" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                <CardTitle>Comportements Suspects</CardTitle>
              </div>
              <CardDescription>
                Utilisateurs avec comportement suspect détecté
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.suspiciousUsers && insights.suspiciousUsers.length > 0 ? (
                <div className="space-y-3">
                  {insights.suspiciousUsers.map((user: any, idx: number) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-red-200 bg-red-50/50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-slate-900">
                              {user.userEmail || 'Utilisateur'}
                            </p>
                            <Badge
                              variant={user.riskScore > 7 ? 'destructive' : 'default'}
                            >
                              Risque: {user.riskScore}/10
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {user.alerts?.map((alert: any, alertIdx: number) => (
                              <div
                                key={alertIdx}
                                className="flex items-start gap-2 text-sm"
                              >
                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {alert.message}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {alert.recommendation}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-600 mt-2">
                            <strong>Recommandation:</strong> {user.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">
                  Aucun comportement suspect détecté ✅
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sports Populaires</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topSports && analytics.topSports.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.topSports}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sport" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="bookings" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-slate-500 py-8">Aucune donnée</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Heures de Pointe</CardTitle>
                  <CardDescription>
                    Top 5 heures les plus réservées (30 derniers jours)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.peakHours && analytics.peakHours.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.peakHours}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="hour" 
                            label={{ value: 'Heure', position: 'insideBottom', offset: -5 }}
                            tickFormatter={(value) => `${value}h`}
                          />
                          <YAxis 
                            label={{ value: 'Réservations', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${value} réservations`, 'Nombre']}
                            labelFormatter={(label: any) => `Heure: ${label}h`}
                          />
                          <Bar dataKey="bookings" fill="#10b981" radius={[8, 8, 0, 0]}>
                            <LabelList dataKey="bookings" position="top" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          <strong>💡 Insight:</strong> Les heures {analytics.peakHours.slice(0, 3).map((h: any) => `${h.hour}h`).join(', ')} sont les plus demandées. 
                          Considérez un pricing dynamique pour ces créneaux.
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-slate-500 py-8">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {analytics?.insights && analytics.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Insights Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.insights.map((insight: any, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="font-semibold text-slate-900">{insight.title}</p>
                    <p className="text-sm text-slate-600">{insight.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      <strong>Action:</strong> {insight.recommendation}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
