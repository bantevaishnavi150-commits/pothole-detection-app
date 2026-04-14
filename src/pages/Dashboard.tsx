import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Camera, Upload, MapPin, Navigation, History, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { detectPotholes, suggestAlternativeRoute } from '../lib/gemini';
import { db, auth, collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { DetectionResult, RouteHistory } from '../types';
import { toast } from 'sonner';

export default function Dashboard() {
  const [image, setImage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [startLoc, setStartLoc] = useState('');
  const [endLoc, setEndLoc] = useState('');
  const [isRouting, setIsRouting] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteHistory | null>(null);
  const [history, setHistory] = useState<DetectionResult[]>([]);
  const [routeHistory, setRouteHistory] = useState<RouteHistory[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'detections'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DetectionResult));
      setHistory(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'detections');
    });

    const rq = query(
      collection(db, 'routes'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const runsubscribe = onSnapshot(rq, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RouteHistory));
      setRouteHistory(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'routes');
    });

    return () => {
      unsubscribe();
      runsubscribe();
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetect = async () => {
    if (!image) return;
    setIsDetecting(true);
    try {
      const base64Data = image.split(',')[1];
      const result = await detectPotholes(base64Data);
      
      const detectionData: DetectionResult = {
        userId: auth.currentUser!.uid,
        imageUrl: image,
        timestamp: Timestamp.now(),
        potholes: result.potholes,
        summary: result.summary,
        overallSeverity: result.overallSeverity
      };

      const docRef = await addDoc(collection(db, 'detections'), detectionData);
      setDetectionResult({ ...detectionData, id: docRef.id });
      toast.success("Potholes detected successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to detect potholes");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleGetRoute = async () => {
    if (!startLoc || !endLoc) {
      toast.error("Please enter both start and end locations");
      return;
    }
    setIsRouting(true);
    try {
      const result = await suggestAlternativeRoute(startLoc, endLoc, detectionResult?.potholes || []);
      
      const routeData: RouteHistory = {
        userId: auth.currentUser!.uid,
        startLocation: startLoc,
        endLocation: endLoc,
        timestamp: Timestamp.now(),
        steps: result.steps,
        safetyReason: result.safetyReason
      };

      const docRef = await addDoc(collection(db, 'routes'), routeData);
      setRouteResult({ ...routeData, id: docRef.id });
      toast.success("Route generated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate route");
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-blue">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Hero Section - Detection */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card border-none overflow-hidden glow-border">
              <CardHeader className="bg-white/5 border-b border-white/10">
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="text-brand-yellow" />
                  <span>Upload Road Image</span>
                </CardTitle>
                <CardDescription className="text-white/60">
                  Upload a photo of the road to detect damages and potholes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center cursor-pointer hover:border-brand-yellow transition-colors group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  {image ? (
                    <img src={image} alt="Preview" className="max-h-64 mx-auto rounded-lg shadow-xl" />
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-brand-yellow/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                        <Upload className="w-8 h-8 text-brand-yellow" />
                      </div>
                      <p className="text-lg font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-white/40">PNG, JPG or JPEG (MAX. 5MB)</p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleDetect} 
                  disabled={!image || isDetecting}
                  className="w-full btn-primary h-12 text-lg"
                >
                  {isDetecting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Road...
                    </>
                  ) : (
                    'Detect Damage'
                  )}
                </Button>
              </CardContent>
            </Card>

            <AnimatePresence>
              {detectionResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="glass-card border-none glow-border">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Detection Result</span>
                        <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold ${
                          detectionResult.overallSeverity === 'critical' ? 'bg-red-500' :
                          detectionResult.overallSeverity === 'high' ? 'bg-orange-500' :
                          'bg-green-500'
                        }`}>
                          {detectionResult.overallSeverity} Severity
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-white/80 italic">"{detectionResult.summary}"</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {detectionResult.potholes.map((p, i) => (
                          <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-start space-x-3">
                            <AlertCircle className={`w-5 h-5 mt-1 ${
                              p.severity === 'critical' ? 'text-red-500' : 'text-brand-yellow'
                            }`} />
                            <div>
                              <p className="font-bold capitalize">{p.severity} Pothole</p>
                              <p className="text-sm text-white/60">Confidence: {(p.confidence * 100).toFixed(1)}%</p>
                              {p.description && <p className="text-xs text-white/40 mt-1">{p.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar - Navigation */}
          <div className="space-y-6">
            <Card className="glass-card border-none glow-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Navigation className="text-brand-accent" />
                  <span>Safe Navigation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Start Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                    <Input 
                      placeholder="Current location" 
                      className="input-field pl-10"
                      value={startLoc}
                      onChange={(e) => setStartLoc(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-white/40" />
                    <Input 
                      placeholder="Where to?" 
                      className="input-field pl-10"
                      value={endLoc}
                      onChange={(e) => setEndLoc(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleGetRoute}
                  disabled={isRouting}
                  className="w-full bg-brand-accent hover:bg-brand-accent/80 text-brand-blue font-bold"
                >
                  {isRouting ? <Loader2 className="animate-spin" /> : 'Find Safer Route'}
                </Button>
              </CardContent>
            </Card>

            <AnimatePresence>
              {routeResult && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className="glass-card border-none border-l-4 border-brand-accent">
                    <CardHeader>
                      <CardTitle className="text-sm">Alternative Route Found</CardTitle>
                      <CardDescription className="text-brand-accent text-xs">
                        {routeResult.safetyReason}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-4">
                          {routeResult.steps.map((step, i) => (
                            <div key={i} className="flex items-start space-x-3">
                              <div className="bg-brand-accent/20 text-brand-accent rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
                                {i + 1}
                              </div>
                              <p className="text-sm text-white/80">{step}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* History Section */}
        <section>
          <Tabs defaultValue="detections" className="w-full">
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <TabsTrigger value="detections" className="data-[state=active]:bg-brand-yellow data-[state=active]:text-brand-blue">
                Detection History
              </TabsTrigger>
              <TabsTrigger value="routes" className="data-[state=active]:bg-brand-accent data-[state=active]:text-brand-blue">
                Route History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="detections" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                  <Card key={item.id} className="glass-card border-none overflow-hidden group">
                    <div className="relative h-40">
                      <img src={item.imageUrl} alt="Detection" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="outline" size="sm" className="text-white border-white">View Details</Button>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-white/40">
                          {item.timestamp?.toDate().toLocaleString()}
                        </p>
                        <span className="text-xs font-bold uppercase text-brand-yellow">
                          {item.potholes.length} Potholes
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 text-white/70">{item.summary}</p>
                    </CardContent>
                  </Card>
                ))}
                {history.length === 0 && (
                  <div className="col-span-full text-center py-12 text-white/40">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No detection history yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="routes" className="mt-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {routeHistory.map((item) => (
                  <Card key={item.id} className="glass-card border-none p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-brand-accent/10 p-3 rounded-full">
                        <Navigation className="text-brand-accent w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold">{item.startLocation} → {item.endLocation}</p>
                        <p className="text-xs text-white/40">{item.timestamp?.toDate().toLocaleString()}</p>
                      </div>
                    </div>
                    <CheckCircle2 className="text-green-500 w-6 h-6" />
                  </Card>
                ))}
                {routeHistory.length === 0 && (
                  <div className="col-span-full text-center py-12 text-white/40">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No route history yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
