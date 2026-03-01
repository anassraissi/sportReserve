import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Star, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Recommendation {
  _id: string;
  name: string;
  type: string;
  city: string;
  basePrice: number;
  aiScore?: number;
  rank?: number;
  reason?: string;
}

export const RecommendationsPanel: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [trending, setTrending] = useState<Recommendation[]>([]);
  const [popular, setPopular] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personalized');
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      // Fetch personalized recommendations
      const personalRes = await fetch(`${apiBaseUrl}/ai/recommendations/personalized?limit=6&historyLimit=3`, {
        method: 'GET',
        headers
      });
      let personalList: Recommendation[] = [];
      if (personalRes.ok) {
        const data = await personalRes.json();
        if (data.recommendations?.length > 0) {
          personalList = data.recommendations;
          setRecommendations(personalList);
        }
      }

      // Fetch trending
      const trendingRes = await fetch(`${apiBaseUrl}/ai/recommendations/trending?limit=6&days=7`, {
        method: 'GET',
        headers
      });
      let trendingList: Recommendation[] = [];
      if (trendingRes.ok) {
        const data = await trendingRes.json();
        if (data.trending?.length > 0) {
          trendingList = data.trending;
          setTrending(trendingList);
        }
      }

      // Fetch popular
      const popularRes = await fetch(`${apiBaseUrl}/ai/recommendations/popular?limit=6&days=30`, {
        method: 'GET',
        headers
      });
      let popularList: Recommendation[] = [];
      if (popularRes.ok) {
        const data = await popularRes.json();
        if (data.popular?.length > 0) {
          popularList = data.popular;
          setPopular(popularList);
        }
      }

      // If personalized is empty, fallback to trending
      if (personalList.length === 0 && trendingList.length > 0) {
        setRecommendations(trendingList.slice(0, 6));
      }

      // If trending is empty, fallback to popular
      if (trendingList.length === 0 && popularList.length > 0) {
        setTrending(popularList.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const RecommendationCard: React.FC<{ rec: Recommendation; showScore?: boolean }> = ({ rec, showScore }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-sm">{rec.name}</h3>
            {showScore && rec.aiScore && (
              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold">
                {rec.aiScore}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            {rec.city}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-600">{rec.basePrice} DH</span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded capitalize">
              {rec.type}
            </span>
          </div>

          {rec.reason && (
            <p className="text-xs text-gray-600 italic">{rec.reason}</p>
          )}

          <Button className="w-full text-xs h-8" variant="outline">
            Voir détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <div className="text-center">Chargement des recommandations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Recommandations IA
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchRecommendations}
            className="text-xs"
          >
            Actualiser
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="personalized" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personalized">Pour vous</TabsTrigger>
            <TabsTrigger value="trending">
              <TrendingUp className="w-4 h-4 mr-1" />
              Tendance
            </TabsTrigger>
            <TabsTrigger value="popular">
              <Star className="w-4 h-4 mr-1" />
              Populaires
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personalized" className="space-y-4">
            {recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec) => (
                  <RecommendationCard key={rec._id} rec={rec} showScore={true} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Aucune recommandation disponible. Réservez d'abord pour obtenir des suggestions personnalisées.
              </p>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            {trending.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trending.map((rec) => (
                  <RecommendationCard key={rec._id} rec={rec} showScore={true} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aucune tendance détectée.</p>
            )}
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            {popular.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popular.map((rec) => (
                  <RecommendationCard key={rec._id} rec={rec} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Aucune ressource populaire.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RecommendationsPanel;
