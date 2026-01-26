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
import { supabase } from "./lib/supabase";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Logo URLs
const LOGO_URL = "https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/piv4nx35_PP.jpg";
const FAVICON_URL = "https://customer-assets.emergentagent.com/job_tapcard-9/artifacts/peu7e95f_Favicon-01.png";

// User avatar photos for landing page
const USER_AVATARS = [
  "https://images.unsplash.com/photo-1765648684630-ac9c15ac98d5?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1738750908048-14200459c3c9?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1604783020105-a1c1a856a55d?w=100&h=100&fit=crop",
  "https://images.pexels.com/photos/3727513/pexels-photo-3727513.jpeg?w=100&h=100&fit=crop",
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

// WhatsApp number for orders
const WHATSAPP_ORDER_NUMBER = "2250100640854";

// ==================== ORDER MODAL ====================
const OrderModal = ({ isOpen, onClose, plan, price }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: ""
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    
    // Build WhatsApp message
    const message = `🛒 *Nouvelle commande FlexCard*

📦 *Plan:* ${plan}
💰 *Prix:* ${price}

👤 *Informations client:*
• Nom complet: ${formData.fullName}
• Téléphone: ${formData.phone}
• Email: ${formData.email}
• Adresse: ${formData.address}
• Ville: ${formData.city}
${formData.notes ? `• Notes: ${formData.notes}` : ""}

📅 Date: ${new Date().toLocaleString("fr-FR")}`;

    // Encode message for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_ORDER_NUMBER}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, "_blank");
    
    setSending(false);
    onClose();
    
    // Reset form
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      notes: ""
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold font-heading">Commander {plan}</h2>
              <p className="text-muted-foreground">{price}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Jean Dupont"
                required
                data-testid="order-fullname"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+225 07 00 00 00 00"
                required
                data-testid="order-phone"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="vous@exemple.com"
                required
                data-testid="order-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse de livraison *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Rue Example"
                required
                data-testid="order-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Abidjan"
                required
                data-testid="order-city"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Instructions spéciales, préférences..."
                className="min-h-[80px]"
                data-testid="order-notes"
              />
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                type="submit" 
                variant="gradient" 
                className="w-full" 
                disabled={sending}
                data-testid="submit-order-btn"
              >
                {sending ? "Envoi en cours..." : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Confirmer via WhatsApp
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Vous serez redirigé vers WhatsApp pour finaliser votre commande
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ==================== LANDING PAGE ====================
const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orderModal, setOrderModal] = useState({ open: false, plan: "", price: "" });
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
    { name: "Aminata Koné", role: "Consultante Marketing, Abidjan", avatar: "https://images.pexels.com/photos/3727513/pexels-photo-3727513.jpeg?w=200&h=200&fit=crop", content: "FlexCard a révolutionné ma façon de networker. Plus de cartes papier perdues ! Mes clients sont impressionnés." },
    { name: "Kouadio Yao", role: "Développeur Freelance, Abidjan", avatar: "https://images.unsplash.com/photo-1604783020105-a1c1a856a55d?w=200&h=200&fit=crop", content: "Interface intuitive et analytics super utiles. Je recommande à 100% pour tous les professionnels." },
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
                  {USER_AVATARS.map((avatar, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden">
                      <img src={avatar} alt="" className="w-full h-full object-cover" />
                    </div>
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
              <div className="relative mx-auto w-[280px] h-[580px]">
                {/* iPhone 15 Pro Mockup */}
                <div className="absolute inset-0 rounded-[55px] shadow-2xl"
                  style={{
                    background: "linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)",
                    boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5), 0 30px 60px -30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
                  }}
                >
                  {/* Titanium frame effect */}
                  <div className="absolute inset-[3px] rounded-[52px]"
                    style={{
                      background: "linear-gradient(180deg, #3d3d3d 0%, #1f1f1f 100%)",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)"
                    }}
                  >
                    {/* Screen bezel */}
                    <div className="absolute inset-[3px] rounded-[49px] bg-black">
                      {/* Actual screen */}
                      <div className="absolute inset-[2px] rounded-[47px] bg-white overflow-hidden">
                        {/* Dynamic Island */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                          <div className="w-[120px] h-[35px] bg-black rounded-full flex items-center justify-center"
                            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.1)" }}
                          >
                            <div className="w-3 h-3 rounded-full bg-slate-800 mr-8" />
                          </div>
                        </div>
                        
                        {/* Card preview content - Demo style with cover */}
                        <div className="h-full flex flex-col pt-14">
                          {/* Cover image - office desk */}
                          <div 
                            className="h-28 bg-cover bg-center"
                            style={{ 
                              backgroundImage: "url('https://images.pexels.com/photos/35428064/pexels-photo-35428064.jpeg?w=400&h=200&fit=crop')"
                            }}
                          />
                          <div className="flex-1 px-4 -mt-10">
                            <div className="w-20 h-20 rounded-full bg-white shadow-lg mx-auto border-4 border-white overflow-hidden">
                              <img src="https://images.pexels.com/photos/3727513/pexels-photo-3727513.jpeg?w=200&h=200&fit=crop" alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-center mt-2">
                              <h3 className="font-heading font-bold text-base text-slate-900">Kouamé Adjoua</h3>
                              <p className="text-xs text-slate-500">Directrice Marketing Digital</p>
                              <p className="text-[10px] text-slate-400">AfriTech Solutions • Abidjan</p>
                            </div>
                            <div className="mt-3 space-y-1.5">
                              {[
                                { name: "LinkedIn", color: "#0A66C2" },
                                { name: "WhatsApp", color: "#25D366" },
                                { name: "Instagram", color: "#E4405F" }
                              ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: item.color }}
                                  >
                                    <Globe className="w-3.5 h-3.5 text-white" />
                                  </div>
                                  <span className="text-xs font-medium text-slate-700">{item.name}</span>
                                </div>
                              ))}
                            </div>
                            {/* Save contact button */}
                            <div className="mt-3">
                              <div className="gradient-bg text-white text-xs font-medium py-2 px-4 rounded-xl text-center">
                                Enregistrer le contact
                              </div>
                            </div>
                          </div>
                          {/* Home indicator */}
                          <div className="pb-2 pt-1 flex justify-center">
                            <div className="w-32 h-1 bg-slate-200 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Side buttons */}
                  <div className="absolute left-[-2px] top-28 w-[3px] h-8 bg-slate-700 rounded-l" />
                  <div className="absolute left-[-2px] top-44 w-[3px] h-16 bg-slate-700 rounded-l" />
                  <div className="absolute left-[-2px] top-64 w-[3px] h-16 bg-slate-700 rounded-l" />
                  <div className="absolute right-[-2px] top-40 w-[3px] h-20 bg-slate-700 rounded-r" />
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
                      {t.avatar ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                          {t.name[0]}
                        </div>
                      )}
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
              Choisissez votre formule
            </h2>
            <p className="text-lg text-muted-foreground">
              Des offres adaptées à vos besoins
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-2 border-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 gradient-bg text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Populaire
                </div>
                <CardHeader>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>Pour les professionnels</CardDescription>
                  <div className="text-4xl font-bold font-heading mt-4">15 000<span className="text-lg font-normal text-muted-foreground"> FCFA</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["1 carte physique NFC + QR", "Profil digital personnalisé", "Liens illimités", "Analytics complets", "Support prioritaire", "Mises à jour gratuites"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="gradient" className="w-full mt-6" onClick={() => setOrderModal({ open: true, plan: "Pro", price: "15 000 FCFA" })} data-testid="order-pro-btn">
                    Commander maintenant
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
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Elite</CardTitle>
                  <CardDescription>Pour les exigeants</CardDescription>
                  <div className="text-4xl font-bold font-heading mt-4">20 000<span className="text-lg font-normal text-muted-foreground"> FCFA</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["Tout du plan Pro", "Design premium personnalisé", "Personnalisation de la carte complète", "Support VIP 24/7", "Fonctionnalités exclusives", "Accès anticipé nouveautés"].map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full mt-6" onClick={() => setOrderModal({ open: true, plan: "Elite", price: "20 000 FCFA" })} data-testid="order-elite-btn">
                    Commander Elite
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Order Modal */}
      <OrderModal 
        isOpen={orderModal.open} 
        onClose={() => setOrderModal({ open: false, plan: "", price: "" })}
        plan={orderModal.plan}
        price={orderModal.price}
      />

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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
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
      setError(err.response?.data?.detail || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Use Emergent OAuth
    const redirectUrl = window.location.origin + returnUrl;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: resetEmail });
      setResetSent(true);
    } catch (err) {
      setResetError("Erreur lors de l'envoi de l'email");
    } finally {
      setResetLoading(false);
    }
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
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </button>
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

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetError(""); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Mot de passe oublié</h2>
                  <button onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetError(""); }} className="p-2 hover:bg-muted rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Email envoyé !</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Si un compte existe avec l'email <strong>{resetEmail}</strong>, vous recevrez un lien de réinitialisation.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vérifiez votre boîte de réception et vos spams.
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => { setShowForgotPassword(false); setResetSent(false); }}>
                      Fermer
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                    </p>
                    {resetError && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{resetError}</div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="vous@exemple.com"
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForgotPassword(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" variant="gradient" className="flex-1" disabled={resetLoading}>
                        {resetLoading ? "Envoi..." : "Envoyer le lien"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
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
  const [success, setSuccess] = useState(false);
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
      // Use Supabase Auth for registration
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("Cette adresse email est déjà utilisée");
        } else if (authError.message.includes("invalid") || authError.message.includes("Email address")) {
          setError("Adresse email invalide. Veuillez utiliser une adresse email valide.");
        } else if (authError.message.includes("Password")) {
          setError("Le mot de passe doit contenir au moins 6 caractères");
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities?.length === 0) {
          setError("Cette adresse email est déjà utilisée");
          return;
        }
        
        if (data.session) {
          // Email confirmation disabled - user is logged in immediately
          try {
            const response = await axios.post(`${API}/auth/supabase-sync`, {
              supabase_user_id: data.user.id,
              email: data.user.email,
              name: name
            }, { 
              withCredentials: true,
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`
              }
            });
            login(response.data);
          } catch (err) {
            login({
              user_id: data.user.id,
              email: data.user.email,
              name: name
            });
          }
          navigate(returnUrl);
        } else {
          // Email confirmation required
          setSuccess(true);
        }
      }
    } catch (err) {
      setError("Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err) {
      setError("Erreur lors de la connexion Google");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 gradient-bg-subtle">
        <Card className="border-0 shadow-xl w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Vérifiez votre email</h2>
            <p className="text-muted-foreground mb-4">
              Un email de confirmation a été envoyé à <strong>{email}</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Cliquez sur le lien dans l'email pour activer votre compte.
            </p>
            <Button variant="outline" onClick={() => navigate("/login")}>
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      
      // Check for Supabase auth callback (email confirmation, password reset, OAuth)
      if (hash.includes("access_token=") || hash.includes("type=")) {
        try {
          // Let Supabase handle the hash
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Supabase auth error:", error);
            navigate("/login");
            return;
          }
          
          if (data.session) {
            // Check if this is a password recovery
            const params = new URLSearchParams(hash.replace("#", "?"));
            if (params.get("type") === "recovery") {
              navigate("/auth/reset-password");
              return;
            }
            
            // Sync with our backend
            try {
              const response = await axios.post(`${API}/auth/supabase-sync`, {
                supabase_user_id: data.session.user.id,
                email: data.session.user.email,
                name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0]
              }, { 
                withCredentials: true,
                headers: {
                  'Authorization': `Bearer ${data.session.access_token}`
                }
              });
              login(response.data);
            } catch (err) {
              login({
                user_id: data.session.user.id,
                email: data.session.user.email,
                name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0]
              });
            }
            
            // Clear the hash and redirect
            window.history.replaceState(null, "", window.location.pathname);
            navigate("/dashboard");
          }
        } catch (err) {
          console.error("Auth callback error:", err);
          navigate("/login");
        }
        return;
      }
      
      // Legacy Emergent Auth callback
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

// Confirm Email Page
const ConfirmEmailPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [error, setError] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus("error");
          setError("Lien de confirmation invalide ou expiré");
          return;
        }
        
        if (data.session) {
          setStatus("success");
          setTimeout(() => navigate("/dashboard"), 2000);
        } else {
          setStatus("error");
          setError("Email non confirmé. Veuillez réessayer.");
        }
      } catch (err) {
        setStatus("error");
        setError("Une erreur s'est produite");
      }
    };

    confirmEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-bg-subtle">
      <Card className="border-0 shadow-xl w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-12 h-12 gradient-bg rounded-full mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Confirmation en cours...</p>
            </>
          )}
          {status === "success" && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Email confirmé !</h2>
              <p className="text-muted-foreground">Redirection vers votre tableau de bord...</p>
            </>
          )}
          {status === "error" && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Erreur</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate("/login")}>Retour à la connexion</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Reset Password Page
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Erreur lors de la mise à jour du mot de passe");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 gradient-bg-subtle">
        <Card className="border-0 shadow-xl w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Mot de passe mis à jour !</h2>
            <p className="text-muted-foreground">Redirection vers la connexion...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 gradient-bg-subtle">
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
            <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
            <CardDescription>Créez votre nouveau mot de passe</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
                {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export { LandingPage, LoginPage, RegisterPage, AuthCallback, ConfirmEmailPage, ResetPasswordPage, AuthContext, useAuth, API, BACKEND_URL, socialPlatforms, LOGO_URL, FAVICON_URL, COUNTRY_CODES, USER_AVATARS };
