import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, AlertCircle, DollarSign, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DemandForecast {
  date: string;
  dayOfWeek: string;
  expectedBookings: number;
  demandLevel: string;
  recommendedPrice: number;
  peakHours: number[];
  confidence: string;
}

interface Props {
  resourceId: string;
  basePrice?: number;
}

export const PredictiveAnalyticsPanel: React.FC<Props> = ({ resourceId, basePrice = 100 }) => {
  const [forecast, setForecast] = useState<DemandForecast[]>([]);
  const [revenueOptimization, setRevenueOptimization] = useState<any>(null);
  const [occupancyTrends, setOccupancyTrends] = useState<any>(null);
  const [noShowPrediction, setNoShowPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('forecast');

  useEffect(() => {
    fetchAnalytics();
  }, [resourceId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch demand forecast
      const forecastRes = await fetch(`/api/ai/predict/demand/${resourceId}?days=30`);
      if (forecastRes.ok) {
        const data = await forecastRes.json();
        setForecast(data.forecast);
      }

      // Fetch revenue optimization
      const revenueRes = await fetch(`/api/ai/predict/revenue/${resourceId}?days=30`);
      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenueOptimization(data.optimization);
      }

      // Fetch occupancy trends
      const occupancyRes = await fetch(`/api/ai/predict/occupancy/${resourceId}?days=90`);
      if (occupancyRes.ok) {
        const data = await occupancyRes.json();
        setOccupancyTrends(data.trends);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'Very High':
        return 'bg-red-100 border-red-300 text-red-700';
      case 'High':
        return 'bg-orange-100 border-orange-300 text-orange-700';
      case 'Medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      case 'Low':
        return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'Very Low':
        return 'bg-gray-100 border-gray-300 text-gray-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getDemandIcon = (level: string) => {
    switch (level) {
      case 'Very High':
        return '🔥';
      case 'High':
        return '📈';
      case 'Medium':
        return '➡️';
      case 'Low':
        return '📉';
      case 'Very Low':
        return '❄️';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <div className="text-center">Analyse prédictive en cours...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Analyse Prédictive
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAnalytics}
            className="text-xs"
          >
            Actualiser
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="forecast" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forecast">Prévisions</TabsTrigger>
            <TabsTrigger value="revenue">
              <DollarSign className="w-4 h-4 mr-1" />
              Revenus
            </TabsTrigger>
            <TabsTrigger value="occupancy">
              <Users className="w-4 h-4 mr-1" />
              Occupancy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="space-y-4">
            {forecast.length > 0 && (
              <>
                <div className="grid grid-cols-7 gap-2">
                  {forecast.slice(0, 7).map((day, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-2 text-center ${getDemandColor(
                        day.demandLevel
                      )}`}
                    >
                      <div className="text-2xl mb-1">{getDemandIcon(day.demandLevel)}</div>
                      <p className="text-xs font-bold">{day.dayOfWeek.slice(0, 3)}</p>
                      <p className="text-xs">{new Date(day.date).getDate()}</p>
                      <p className="text-xs font-semibold">{day.expectedBookings}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Détails 7 jours</h4>
                  {forecast.slice(0, 7).map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div>
                        <p className="text-sm font-medium">{day.date}</p>
                        <p className="text-xs text-gray-600">{day.dayOfWeek}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Demande</p>
                          <p className="text-sm font-bold">{day.expectedBookings}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-600">Prix</p>
                          <p className="text-sm font-bold text-blue-600">{day.recommendedPrice}DH</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getDemandColor(
                          day.demandLevel
                        )}`}>
                          {day.demandLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            {revenueOptimization && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600">Revenu actuel (30j)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {revenueOptimization.currentProjectedRevenue}DH
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-xs text-gray-600">Revenu optimisé (30j)</p>
                    <p className="text-2xl font-bold text-green-600">
                      {revenueOptimization.optimizedProjectedRevenue}DH
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border-l-4 border-amber-500">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    <p className="font-semibold text-amber-900">Augmentation Potentielle</p>
                  </div>
                  <p className="text-3xl font-bold text-amber-700">
                    +{revenueOptimization.potentialIncrease}DH
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    +{revenueOptimization.increasePercentage}% sur 30 jours
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Recommandations</h4>
                  {revenueOptimization.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded">
                      <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                      <p className="text-sm font-semibold text-green-600 mt-2">{rec.impact}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="occupancy" className="space-y-4">
            {occupancyTrends && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Réservations totales</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {occupancyTrends.totalReservations}
                    </p>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Moyenne quotidienne</p>
                    <p className="text-2xl font-bold text-green-600">
                      {occupancyTrends.averageDailyBookings}
                    </p>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Revenu total (90j)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {occupancyTrends.totalRevenue}DH
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">7 derniers jours</h4>
                  {occupancyTrends.dailyBreakdown.map((day: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-xs text-gray-600">{day.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold">{day.bookings} réservations</span>
                        <span className="text-xs text-green-600 font-bold">{day.revenue}DH</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PredictiveAnalyticsPanel;
