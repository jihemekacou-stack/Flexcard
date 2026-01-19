import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { 
  QrCode, Smartphone, Share2, BarChart3, UserCircle, Settings, LogOut, 
  CheckCircle2, Menu, X, ChevronRight, ArrowRight, 
  Linkedin, Instagram, Twitter, Github, Globe, Mail, Phone, MapPin,
  Plus, Trash2, GripVertical, Eye, Users, MousePointerClick, Download,
  ExternalLink, Copy, Check, Save, Camera, Palette, Link as LinkIcon
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import { useAuth, API, BACKEND_URL } from "./App";

// ==================== DASHBOARD ====================
const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, analyticsRes] = await Promise.all([
          axios.get(`${API}/profile`, { withCredentials: true }),
          axios.get(`${API}/analytics`, { withCredentials: true })
        ]);
        setProfile(profileRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error(err);
    }
    logout();
    navigate("/");
  };

  const navItems = [
    { id: "overview", icon: <BarChart3 className="w-5 h-5" />, label: "Vue d'ensemble" },
    { id: "card", icon: <UserCircle className="w-5 h-5" />, label: "Ma carte" },
    { id: "qrcode", icon: <QrCode className="w-5 h-5" />, label: "QR Code" },
    { id: "analytics", icon: <Eye className="w-5 h-5" />, label: "Analytics" },
    { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Paramètres" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 gradient-bg rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30" data-testid="dashboard">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 h-16 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2" data-testid="mobile-menu-toggle">
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold">TapCard</span>
        </Link>
        <Avatar className="w-8 h-8">
          <AvatarImage src={user?.picture} />
          <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
        </Avatar>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl">TapCard</span>
            </Link>
            <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`nav-${item.id}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4 px-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.picture} />
                <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user?.name}</div>
                <div className="text-sm text-muted-foreground truncate">{user?.email}</div>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-5 h-5 mr-2" /> Déconnexion
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {activeTab === "overview" && <OverviewTab profile={profile} analytics={analytics} />}
          {activeTab === "card" && <CardEditorTab profile={profile} setProfile={setProfile} />}
          {activeTab === "qrcode" && <QRCodeTab profile={profile} />}
          {activeTab === "analytics" && <AnalyticsTab analytics={analytics} />}
          {activeTab === "settings" && <SettingsTab profile={profile} setProfile={setProfile} user={user} />}
        </div>
      </main>
    </div>
  );
};

// ==================== TABS ====================
const OverviewTab = ({ profile, analytics }) => {
  const stats = [
    { label: "Vues totales", value: analytics?.total_views || 0, icon: <Eye className="w-5 h-5" />, color: "text-blue-500" },
    { label: "Clics totaux", value: analytics?.total_clicks || 0, icon: <MousePointerClick className="w-5 h-5" />, color: "text-green-500" },
    { label: "Contacts collectés", value: analytics?.total_contacts || 0, icon: <Users className="w-5 h-5" />, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-8" data-testid="overview-tab">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Bienvenue 👋</h1>
        <p className="text-muted-foreground">Voici un aperçu de votre carte digitale</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold font-heading mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link to={`/u/${profile?.username}`} target="_blank">
              <ExternalLink className="w-5 h-5" />
              <span>Voir ma carte</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/u/${profile?.username}`);
          }}>
            <Copy className="w-5 h-5" />
            <span>Copier le lien</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Share2 className="w-5 h-5" />
            <span>Partager</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Download className="w-5 h-5" />
            <span>QR Code</span>
          </Button>
        </CardContent>
      </Card>

      {/* Profile preview */}
      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu de votre carte</CardTitle>
            <CardDescription>tapcard.co/{profile.username}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm mx-auto">
              <ProfilePreview profile={profile} links={analytics?.links || []} mini />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const CardEditorTab = ({ profile, setProfile }) => {
  const [formData, setFormData] = useState({
    title: profile?.title || "",
    company: profile?.company || "",
    bio: profile?.bio || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
    website: profile?.website || "",
    location: profile?.location || "",
  });
  const [links, setLinks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newLink, setNewLink] = useState({ type: "social", platform: "linkedin", url: "", title: "" });
  const [showAddLink, setShowAddLink] = useState(false);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await axios.get(`${API}/links`, { withCredentials: true });
        setLinks(response.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLinks();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`${API}/profile`, formData, { withCredentials: true });
      setProfile(response.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = async () => {
    try {
      const response = await axios.post(`${API}/links`, newLink, { withCredentials: true });
      setLinks([...links, response.data]);
      setShowAddLink(false);
      setNewLink({ type: "social", platform: "linkedin", url: "", title: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await axios.delete(`${API}/links/${linkId}`, { withCredentials: true });
      setLinks(links.filter(l => l.link_id !== linkId));
    } catch (err) {
      console.error(err);
    }
  };

  const socialPlatforms = [
    { id: "linkedin", name: "LinkedIn", icon: <Linkedin className="w-5 h-5" /> },
    { id: "instagram", name: "Instagram", icon: <Instagram className="w-5 h-5" /> },
    { id: "twitter", name: "Twitter/X", icon: <Twitter className="w-5 h-5" /> },
    { id: "github", name: "GitHub", icon: <Github className="w-5 h-5" /> },
    { id: "website", name: "Site Web", icon: <Globe className="w-5 h-5" /> },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-8" data-testid="card-editor-tab">
      {/* Editor */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Éditer ma carte</h1>
          <p className="text-muted-foreground">Personnalisez votre profil public</p>
        </div>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCircle className="w-5 h-5" /> Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre / Poste</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Product Designer"
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label>Entreprise</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Acme Inc."
                  data-testid="input-company"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Décrivez-vous en quelques mots..."
                className="min-h-[100px]"
                data-testid="input-bio"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" /> Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="vous@exemple.com"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                  data-testid="input-phone"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Site web</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://monsite.com"
                  data-testid="input-website"
                />
              </div>
              <div className="space-y-2">
                <Label>Localisation</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Paris, France"
                  data-testid="input-location"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="w-5 h-5" /> Liens & Réseaux sociaux
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddLink(true)} data-testid="add-link-btn">
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun lien ajouté. Cliquez sur "Ajouter" pour commencer.</p>
            ) : (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.link_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl group">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center text-white">
                      {socialPlatforms.find(p => p.id === link.platform)?.icon || <Globe className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{link.title}</div>
                      <div className="text-sm text-muted-foreground truncate">{link.url}</div>
                    </div>
                    <Badge variant="secondary">{link.clicks} clics</Badge>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => handleDeleteLink(link.link_id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add link modal */}
            {showAddLink && (
              <div className="mt-4 p-4 border border-border rounded-xl space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plateforme</Label>
                    <select
                      value={newLink.platform}
                      onChange={(e) => setNewLink({ ...newLink, platform: e.target.value, title: socialPlatforms.find(p => p.id === e.target.value)?.name || "" })}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background"
                    >
                      {socialPlatforms.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                      placeholder="Mon LinkedIn"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    type="url"
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowAddLink(false)}>Annuler</Button>
                  <Button onClick={handleAddLink} disabled={!newLink.url}>Ajouter le lien</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="gradient" size="lg" className="w-full" onClick={handleSave} disabled={saving} data-testid="save-profile-btn">
          {saving ? "Enregistrement..." : saved ? <><Check className="w-4 h-4 mr-2" /> Enregistré !</> : <><Save className="w-4 h-4 mr-2" /> Enregistrer</>}
        </Button>
      </div>

      {/* Preview */}
      <div className="lg:sticky lg:top-8 h-fit">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aperçu en direct</CardTitle>
            <CardDescription>
              <a href={`/u/${profile?.username}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                tapcard.co/{profile?.username} <ExternalLink className="w-3 h-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfilePreview profile={{ ...profile, ...formData }} links={links} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const QRCodeTab = ({ profile }) => {
  const [qrColor, setQrColor] = useState("#6366F1");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  const profileUrl = `${window.location.origin}/u/${profile?.username}`;

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      
      const link = document.createElement("a");
      link.download = `tapcard-${profile?.username}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto" data-testid="qrcode-tab">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-heading mb-2">Mon QR Code</h1>
        <p className="text-muted-foreground">Partagez votre carte en un scan</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <div ref={qrRef} className="p-6 rounded-2xl" style={{ backgroundColor: bgColor }}>
              <QRCodeSVG
                value={profileUrl}
                size={256}
                fgColor={qrColor}
                bgColor={bgColor}
                level="H"
                includeMargin
              />
            </div>

            <div className="mt-6 w-full max-w-xs space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Couleur QR</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer"
                    />
                    <Input value={qrColor} onChange={(e) => setQrColor(e.target.value)} />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Fond</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer"
                    />
                    <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
                  </div>
                </div>
              </div>

              <Button variant="gradient" className="w-full" onClick={handleDownload} data-testid="download-qr-btn">
                <Download className="w-4 h-4 mr-2" /> Télécharger PNG
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lien de partage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={profileUrl} readOnly />
            <Button variant="outline" onClick={handleCopy} data-testid="copy-link-btn">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AnalyticsTab = ({ analytics }) => {
  const dailyData = Object.entries(analytics?.daily_views || {}).slice(-7);

  return (
    <div className="space-y-8" data-testid="analytics-tab">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Analytics</h1>
        <p className="text-muted-foreground">Suivez les performances de votre carte</p>
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Vues totales", value: analytics?.total_views || 0, icon: <Eye className="w-5 h-5" /> },
          { label: "Clics totaux", value: analytics?.total_clicks || 0, icon: <MousePointerClick className="w-5 h-5" /> },
          { label: "Contacts", value: analytics?.total_contacts || 0, icon: <Users className="w-5 h-5" /> },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold font-heading mt-1">{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted text-primary">
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Links performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance des liens</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.links?.length > 0 ? (
            <div className="space-y-3">
              {analytics.links.map((link, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center text-white">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{link.title}</div>
                    <div className="text-sm text-muted-foreground">{link.url}</div>
                  </div>
                  <Badge variant="secondary">{link.clicks} clics</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucun lien ajouté</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsTab = ({ profile, setProfile, user }) => {
  const [username, setUsername] = useState(profile?.username || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSaveUsername = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await axios.put(`${API}/profile/username`, { username }, { withCredentials: true });
      setProfile(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl" data-testid="settings-tab">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-2">Paramètres</h1>
        <p className="text-muted-foreground">Gérez votre compte</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.picture || profile?.avatar} />
              <AvatarFallback className="text-xl">{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{user?.name}</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>URL de votre carte</CardTitle>
          <CardDescription>Choisissez votre identifiant unique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">tapcard.co/</span>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
              placeholder="monnom"
              data-testid="input-username"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSaveUsername} disabled={saving || username === profile?.username}>
            {saving ? "Enregistrement..." : "Mettre à jour"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <div>
              <Badge variant="secondary">Plan Gratuit</Badge>
              <p className="text-sm text-muted-foreground mt-2">Fonctionnalités de base incluses</p>
            </div>
            <Button variant="gradient" disabled>
              Passer Pro (Bientôt)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== PROFILE PREVIEW ====================
const ProfilePreview = ({ profile, links, mini = false }) => {
  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-lg ${mini ? "scale-90 origin-top" : ""}`}>
      {/* Header with gradient */}
      <div className="h-24 gradient-bg relative">
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
              {profile?.title?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 pb-6 px-6 text-center">
        <h2 className="font-heading font-bold text-xl">{profile?.title || "Votre titre"}</h2>
        {profile?.company && <p className="text-muted-foreground">{profile.company}</p>}
        {profile?.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>}

        {/* Contact buttons */}
        <div className="flex justify-center gap-2 mt-4">
          {profile?.phone && (
            <Button size="sm" variant="outline" className="rounded-full">
              <Phone className="w-4 h-4" />
            </Button>
          )}
          {profile?.email && (
            <Button size="sm" variant="outline" className="rounded-full">
              <Mail className="w-4 h-4" />
            </Button>
          )}
          {profile?.location && (
            <Button size="sm" variant="outline" className="rounded-full">
              <MapPin className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Links */}
        {links && links.length > 0 && (
          <div className="mt-4 space-y-2">
            {links.slice(0, mini ? 3 : undefined).map((link) => (
              <div key={link.link_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{link.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { Dashboard, ProfilePreview };
