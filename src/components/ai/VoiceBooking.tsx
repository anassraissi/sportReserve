import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Loader2, X, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface VoiceBookingProps {
  onBooking?: (booking: any) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceBooking: React.FC<VoiceBookingProps> = ({ onBooking }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [examples, setExamples] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setCommand(transcript);
        handleParseCommand(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Fetch examples
    fetchExamples();
  }, []);

  const fetchExamples = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/ai/voice/examples?language=fr`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setExamples(data.examples);
      }
    } catch (error) {
      console.error('Error fetching examples:', error);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setCommand('');
      setResponse(null);
      recognitionRef.current.start();
    } else {
      alert('Speech recognition not supported in your browser');
    }
  };

  const handleParseCommand = async (text: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/ai/voice/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ command: text })
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data);
      }
    } catch (error) {
      console.error('Error parsing command:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      await handleParseCommand(command);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        title="Voice Booking"
      >
        <Mic className="w-6 h-6" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-blue-500" />
          Réservation Vocale
        </CardTitle>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Command Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Votre commande:</label>
          <form onSubmit={handleManualInput} className="flex gap-2">
            <Input
              placeholder="Dites ou tapez votre commande..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={isListening || loading}
            />
            <Button
              type="button"
              onClick={startListening}
              disabled={isListening || loading}
              variant={isListening ? 'destructive' : 'outline'}
              size="icon"
            >
              {isListening ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>

        {/* Response */}
        {response && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Intention détectée:</p>
              <div className="flex items-center justify-between">
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {response.parsed?.intent || 'unknown'}
                </span>
                <span className="text-xs font-bold text-gray-600">
                  Confiance: {response.parsed?.confidence}
                </span>
              </div>
            </div>

            {response.parsed?.sport_type && (
              <div>
                <p className="text-sm font-medium mb-1">Type de sport:</p>
                <p className="text-sm text-gray-700">{response.parsed.sport_type}</p>
              </div>
            )}

            {response.parsed?.date && (
              <div>
                <p className="text-sm font-medium mb-1">Date:</p>
                <p className="text-sm text-gray-700">{response.parsed.date}</p>
              </div>
            )}

            {response.parsed?.time && (
              <div>
                <p className="text-sm font-medium mb-1">Heure:</p>
                <p className="text-sm text-gray-700">{response.parsed.time}</p>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-sm italic text-gray-600">{response.response}</p>
            </div>

            {response.parsed?.intent === 'book_facility' && response.parsed?.confidence === 'high' && (
              <Button className="w-full text-sm" onClick={() => onBooking?.(response.parsed)}>
                <BookOpen className="w-4 h-4 mr-2" />
                Confirmer la réservation
              </Button>
            )}
          </div>
        )}

        {/* Examples */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs font-medium mb-2">Exemples de commandes:</p>
          <div className="space-y-1">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCommand(example);
                  handleParseCommand(example);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 text-left block mb-1"
              >
                • {example}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Traitement en cours...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceBooking;
