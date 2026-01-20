import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate, Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  QrCode, Smartphone, Share2, BarChart3, UserCircle, Settings, LogOut, 
  CheckCircle2, Zap, Menu, X, ChevronRight, Star, ArrowRight, 
  Globe, Mail, Phone, MapPin, Plus, Trash2, Eye, Users, MousePointerClick, Download,
  ExternalLink, Copy, Check, Camera
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Logo URLs
const LOGO_URL = "https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/piv4nx35_PP.jpg";
const FAVICON_URL = "https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/peu7e95f_Favicon-01.png";

// User avatar photos for landing page
const USER_AVATARS = [
  "https://images.unsplash.com/photo-1655249481446-25d575f1c054?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1758518727888-ffa196002e59?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1765248148309-69d900a5bc17?w=100&h=100&fit=crop",
];

// Country codes with flags
const COUNTRY_CODES = [
  { code: "+225", country: "CI", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
  { code: "+1", country: "US", flag: "🇺🇸", name: "États-Unis" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "Royaume-Uni" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Allemagne" },
  { code: "+32", country: "BE", flag: "🇧🇪", name: "Belgique" },
  { code: "+41", country: "CH", flag: "🇨🇭", name: "Suisse" },
  { code: "+212", country: "MA", flag: "🇲🇦", name: "Maroc" },
  { code: "+221", country: "SN", flag: "🇸🇳", name: "Sénégal" },
  { code: "+237", country: "CM", flag: "🇨🇲", name: "Cameroun" },
  { code: "+229", country: "BJ", flag: "🇧🇯", name: "Bénin" },
  { code: "+228", country: "TG", flag: "🇹🇬", name: "Togo" },
  { code: "+223", country: "ML", flag: "🇲🇱", name: "Mali" },
  { code: "+226", country: "BF", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "+227", country: "NE", flag: "🇳🇪", name: "Niger" },
  { code: "+234", country: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "+233", country: "GH", flag: "🇬🇭", name: "Ghana" },
  { code: "+243", country: "CD", flag: "🇨🇩", name: "RD Congo" },
  { code: "+242", country: "CG", flag: "🇨🇬", name: "Congo" },
  { code: "+241", country: "GA", flag: "🇬🇦", name: "Gabon" },
];

// ==================== CONTEXT ====================
const AuthContext = createContext(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// ==================== SOCIAL PLATFORMS ====================
const socialPlatforms = [
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg" },
  { id: "instagram", name: "Instagram", color: "#E4405F", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" },
  { id: "facebook", name: "Facebook", color: "#1877F2", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg" },
  { id: "twitter", name: "Twitter/X", color: "#000000", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/x.svg" },
  { id: "tiktok", name: "TikTok", color: "#000000", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg" },
  { id: "youtube", name: "YouTube", color: "#FF0000", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg" },
  { id: "github", name: "GitHub", color: "#181717", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/github.svg" },
  { id: "snapchat", name: "Snapchat", color: "#FFFC00", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/snapchat.svg" },
  { id: "whatsapp", name: "WhatsApp", color: "#25D366", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg" },
  { id: "telegram", name: "Telegram", color: "#26A5E4", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/telegram.svg" },
  { id: "pinterest", name: "Pinterest", color: "#BD081C", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pinterest.svg" },
  { id: "twitch", name: "Twitch", color: "#9146FF", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitch.svg" },
  { id: "discord", name: "Discord", color: "#5865F2", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg" },
  { id: "spotify", name: "Spotify", color: "#1DB954", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/spotify.svg" },
  { id: "behance", name: "Behance", color: "#1769FF", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/behance.svg" },
  { id: "dribbble", name: "Dribbble", color: "#EA4C89", icon: "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/dribbble.svg" },
  { id: "website", name: "Site Web", color: "#8645D6", icon: null },
];

// ==================== LANDING PAGE ====================
const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const features = [
    { icon: <QrCode className="w-8 h-8" />, title: "QR Code Instantané", description: "Partagez votre profil en un scan. Personnalisez les couleurs et ajoutez votre logo." },
    { icon: <Smartphone className="w-8 h-8" />, title: "Compatible NFC", description: "Touchez pour partager. Fonctionne avec tous les smartphones modernes." },
    { icon: <Zap className="w-8 h-8" />, title: "Mise à jour en temps réel", description: "Modifiez vos infos, elles sont instantanément mises à jour partout." },
    { icon: <BarChart3 className="w-8 h-8" />, title: "Analytics Détaillés", description: "Suivez les vues, clics et contacts générés par votre carte." },
    { icon: <Users className="w-8 h-8" />, title: "Collecte de Leads", description: "Capturez les coordonnées de vos visiteurs automatiquement." },
    { icon: <Globe className="w-8 h-8" />, title: "50+ Intégrations", description: "Connectez tous vos réseaux sociaux et outils professionnels." },
  ];

  const steps = [
    { number: "01", title: "Créez votre carte", description: "Inscrivez-vous gratuitement et personnalisez votre profil en quelques minutes." },
    { number: "02", title: "Ajoutez vos liens", description: "Réseaux sociaux, site web, portfolio, paiement... tout au même endroit." },
    { number: "03", title: "Partagez partout", description: "QR code, lien, NFC ou intégrez dans votre signature email." },
  ];

  const testimonials = [
    { name: "Marie Dupont", role: "Consultante Marketing", avatar: "https://images.pexels.com/photos/8761636/pexels-photo-8761636.jpeg", content: "FlexCard a révolutionné ma façon de networker. Plus de cartes papier perdues !" },
    { name: "Thomas Martin", role: "Développeur Freelance", avatar: "https://images.pexels.com/photos/8355222/pexels-photo-8355222.jpeg", content: "Interface intuitive et analytics super utiles. Je recommande à 100%." },
  ];

  const faqs = [
    { q: "Est-ce vraiment gratuit ?", a: "Oui ! Notre plan gratuit vous permet de créer une carte complète avec QR code et liens illimités." },
    { q: "Comment fonctionne le partage NFC ?", a: "Il suffit de toucher votre téléphone contre celui de votre contact. La page s'ouvre automatiquement." },
    { q: "Puis-je personnaliser le design ?", a: "Absolument ! Choisissez parmi nos thèmes ou créez votre propre design avec vos couleurs." },
    { q: "Mes contacts sont-ils sécurisés ?", a: "Oui, toutes vos données sont chiffrées et vous gardez le contrôle total sur votre vie privée." },
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="logo">
              <img src={LOGO_URL} alt="FlexCard" className="w-10 h-10 object-contain" />
              <span className="font-heading font-bold text-xl">FlexCard</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Tarifs</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/login")} data-testid="login-btn">Connexion</Button>
              <Button variant="gradient" onClick={() => navigate("/register")} data-testid="signup-btn">
                Créer ma carte <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="mobile-menu-btn">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-background"
            >
              <div className="px-4 py-4 space-y-4">
                <a href="#features" className="block text-muted-foreground hover:text-foreground">Fonctionnalités</a>
                <a href="#how-it-works" className="block text-muted-foreground hover:text-foreground">Comment ça marche</a>
                <a href="#pricing" className="block text-muted-foreground hover:text-foreground">Tarifs</a>
                <div className="pt-4 border-t border-border space-y-2">
                  <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>Connexion</Button>
                  <Button variant="gradient" className="w-full" onClick={() => navigate("/register")}>Créer ma carte</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-6">
                <Zap className="w-3 h-3 mr-1" /> Nouveau: Intégration NFC
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] font-heading mb-6">
                Votre carte de visite{" "}
                <span className="gradient-text">digitale</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Partagez vos coordonnées en un instant. QR code, NFC ou lien personnalisé. 
                Moderne, écologique et toujours à jour.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="gradient" size="xl" onClick={() => navigate("/register")} data-testid="hero-cta">
                  Créer ma carte gratuite <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="xl" onClick={() => navigate("/u/demo")}>
                  Voir une démo
                </Button>
              </div>
              <div className="flex items-center gap-4 mt-8">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full gradient-bg border-2 border-background" />
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">2,000+</span> professionnels utilisent FlexCard
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative mx-auto w-[280px] h-[560px]">
                {/* Phone mockup */}
                <div className="absolute inset-0 bg-slate-900 rounded-[3rem] shadow-2xl border-4 border-slate-800">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-full" />
                  <div className="absolute top-12 left-4 right-4 bottom-4 bg-white rounded-[2rem] overflow-hidden">
                    {/* Card preview */}
                    <div className="h-full flex flex-col">
                      <div className="h-32 gradient-bg" />
                      <div className="flex-1 px-4 -mt-12">
                        <div className="w-24 h-24 rounded-full bg-white shadow-lg mx-auto border-4 border-white overflow-hidden">
                          <img src="https://images.pexels.com/photos/6207703/pexels-photo-6207703.jpeg" alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center mt-3">
                          <h3 className="font-heading font-bold text-lg text-slate-900">Sophie Martin</h3>
                          <p className="text-sm text-slate-500">Product Designer</p>
                        </div>
                        <div className="mt-4 space-y-2">
                          {["LinkedIn", "Portfolio", "Email"].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                                <Globe className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm font-medium text-slate-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -right-8 top-20 p-4 glass rounded-2xl shadow-lg"
                >
                  <QrCode className="w-12 h-12 text-primary" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                  className="absolute -left-8 bottom-32 p-3 glass rounded-2xl shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">Contact enregistré</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 gradient-bg-subtle">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">Fonctionnalités</Badge>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight font-heading mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des outils puissants pour créer une présence professionnelle digitale impactante.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full card-hover border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl gradient-bg-subtle flex items-center justify-center mb-4 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="font-heading font-semibold text-xl mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">Comment ça marche</Badge>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight font-heading mb-4">
              Simple comme 1, 2, 3
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="text-center"
              >
                <div className="text-6xl font-heading font-bold gradient-text mb-4">{step.number}</div>
                <h3 className="font-heading font-semibold text-xl mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-bg-subtle">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">Témoignages</Badge>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight font-heading">
              Ils nous font confiance
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <p className="text-lg mb-4">"{t.content}"</p>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={t.avatar} alt={t.name} />
                        <AvatarFallback>{t.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-sm text-muted-foreground">{t.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">Tarifs</Badge>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight font-heading mb-4">
              Commencez gratuitement
            </h2>
            <p className="text-lg text-muted-foreground">
              Passez à Pro quand vous êtes prêt
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Gratuit</CardTitle>
                  <CardDescription>Pour commencer</CardDescription>
                  <div className="text-4xl font-bold font-heading mt-4">0€</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["1 carte digitale", "QR code personnalisé", "Liens illimités", "Analytics basiques", "Support email"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full mt-6" onClick={() => navigate("/register")}>
                    Commencer gratuitement
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border-2 border-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 gradient-bg text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Populaire
                </div>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>Pour les professionnels</CardDescription>
                  <div className="text-4xl font-bold font-heading mt-4">9.99€<span className="text-lg font-normal text-muted-foreground">/mois</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["Tout du plan Gratuit", "Cartes illimitées", "Thèmes premium", "Sans branding FlexCard", "Analytics avancés", "Formulaire de contact", "Support prioritaire"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="gradient" className="w-full mt-6">
                    Bientôt disponible
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 gradient-bg-subtle">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight font-heading">
              Questions fréquentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0">
                  <CardContent className="p-6">
                    <h3 className="font-heading font-semibold text-lg mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight font-heading mb-6">
              Prêt à passer au <span className="gradient-text">digital</span> ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez des milliers de professionnels qui ont déjà adopté la carte de visite du futur.
            </p>
            <Button variant="gradient" size="xl" onClick={() => navigate("/register")}>
              Créer ma carte gratuite <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="FlexCard" className="w-8 h-8 object-contain" />
              <span className="font-heading font-bold text-xl">FlexCard</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Conditions</a>
              <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 FlexCard. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ==================== AUTH PAGES ====================
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Get return URL from query params
  const searchParams = new URLSearchParams(window.location.search);
  const returnUrl = searchParams.get("return") || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
      login(response.data);
      navigate(returnUrl);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + returnUrl;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-bg-subtle" data-testid="login-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <Link to="/" className="flex items-center justify-center gap-2 mb-4">
              <img src={LOGO_URL} alt="FlexCard" className="w-12 h-12 object-contain" />
            </Link>
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>Accédez à votre tableau de bord</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  data-testid="login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  data-testid="login-password"
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full" disabled={loading} data-testid="login-submit">
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} data-testid="google-login-btn">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Pas encore de compte ?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Créer un compte
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // Get return URL from query params
  const searchParams = new URLSearchParams(window.location.search);
  const returnUrl = searchParams.get("return") || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API}/auth/register`, { name, email, password }, { withCredentials: true });
      login(response.data);
      navigate(returnUrl);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + returnUrl;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-bg-subtle" data-testid="register-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <Link to="/" className="flex items-center justify-center gap-2 mb-4">
              <img src={LOGO_URL} alt="FlexCard" className="w-12 h-12 object-contain" />
            </Link>
            <CardTitle className="text-2xl">Créer un compte</CardTitle>
            <CardDescription>Commencez gratuitement en 2 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  required
                  data-testid="register-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                  data-testid="register-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  data-testid="register-password"
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full" disabled={loading} data-testid="register-submit">
                {loading ? "Création..." : "Créer mon compte"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} data-testid="google-register-btn">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Déjà un compte ?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionId = new URLSearchParams(hash.replace("#", "?")).get("session_id");

      if (!sessionId) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true });
        login(response.data);
        // Clear the hash and redirect
        window.history.replaceState(null, "", window.location.pathname);
        navigate("/dashboard", { state: { user: response.data } });
      } catch (err) {
        console.error("Auth error:", err);
        navigate("/login");
      }
    };

    processAuth();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-subtle">
      <div className="text-center">
        <div className="w-12 h-12 gradient-bg rounded-full mx-auto mb-4 animate-pulse" />
        <p className="text-muted-foreground">Connexion en cours...</p>
      </div>
    </div>
  );
};

export { LandingPage, LoginPage, RegisterPage, AuthCallback, AuthContext, useAuth, API, BACKEND_URL, socialPlatforms, LOGO_URL, FAVICON_URL };
