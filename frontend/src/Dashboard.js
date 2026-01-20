import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { 
  QrCode, Share2, BarChart3, UserCircle, Settings, LogOut, 
  Menu, X, Globe, Mail, Phone, MapPin,
  Plus, Trash2, GripVertical, Eye, Users, MousePointerClick, Download,
  ExternalLink, Copy, Check, Save, Camera, Palette, Link as LinkIcon, Image as ImageIcon,
  Pencil, AlertTriangle
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
import { Badge } from "./components/ui/badge";
import { useAuth, API, BACKEND_URL, socialPlatforms, LOGO_URL, COUNTRY_CODES } from "./App";

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
          <img src={LOGO_URL} alt="FlexCard" className="w-8 h-8 object-contain" />
          <span className="font-heading font-bold">FlexCard</span>
        </Link>
        {user?.picture ? (
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src={user.picture} alt={user?.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">
            {user?.name?.[0]}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={LOGO_URL} alt="FlexCard" className="w-10 h-10 object-contain" />
              <span className="font-heading font-bold text-xl">FlexCard</span>
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
            <CardDescription>flexcard.co/{profile.username}</CardDescription>
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
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    title: profile?.title || "",
    company: profile?.company || "",
    bio: profile?.bio || "",
    website: profile?.website || "",
    location: profile?.location || "",
    cover_color: profile?.cover_color || "#8645D6",
    cover_type: profile?.cover_type || "color",
  });
  const [emails, setEmails] = useState(profile?.emails || []);
  const [phones, setPhones] = useState(profile?.phones || []);
  const [links, setLinks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newLink, setNewLink] = useState({ type: "social", platform: "linkedin", url: "", title: "", whatsappNumber: "" });
  const [showAddLink, setShowAddLink] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

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
      const response = await axios.put(`${API}/profile`, {
        ...formData,
        emails,
        phones
      }, { withCredentials: true });
      setProfile(response.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const response = await axios.post(`${API}/upload/avatar`, {
          image: event.target.result
        }, { withCredentials: true });
        setProfile(prev => ({ ...prev, avatar: response.data.avatar }));
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = async () => {
    try {
      await axios.delete(`${API}/upload/avatar`, { withCredentials: true });
      setProfile(prev => ({ ...prev, avatar: null }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const response = await axios.post(`${API}/upload/cover`, {
          image: event.target.result
        }, { withCredentials: true });
        setProfile(prev => ({ ...prev, cover_image: response.data.cover_image, cover_type: "image" }));
        setFormData(prev => ({ ...prev, cover_type: "image" }));
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCover = async () => {
    try {
      await axios.delete(`${API}/upload/cover`, { withCredentials: true });
      setProfile(prev => ({ ...prev, cover_image: null, cover_type: "color" }));
      setFormData(prev => ({ ...prev, cover_type: "color" }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLink = async () => {
    try {
      const platform = socialPlatforms.find(p => p.id === newLink.platform);
      let url = newLink.url;
      
      // For WhatsApp, convert phone number to WhatsApp link
      if (newLink.platform === "whatsapp" && newLink.whatsappNumber) {
        const cleanNumber = newLink.whatsappNumber.replace(/\D/g, "");
        url = `https://wa.me/${cleanNumber}`;
      }
      
      const response = await axios.post(`${API}/links`, {
        type: newLink.type,
        platform: newLink.platform,
        url: url,
        title: newLink.title || platform?.name || "Lien"
      }, { withCredentials: true });
      setLinks([...links, response.data]);
      setShowAddLink(false);
      setNewLink({ type: "social", platform: "linkedin", url: "", title: "", whatsappNumber: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLink = async (linkId) => {
    if (!editingLink) return;
    try {
      const platform = socialPlatforms.find(p => p.id === editingLink.platform);
      let url = editingLink.url;
      
      // For WhatsApp, convert phone number to WhatsApp link
      if (editingLink.platform === "whatsapp" && editingLink.whatsappNumber) {
        const cleanNumber = editingLink.whatsappNumber.replace(/\D/g, "");
        url = `https://wa.me/${cleanNumber}`;
      }
      
      const response = await axios.put(`${API}/links/${linkId}`, {
        url: url,
        title: editingLink.title || platform?.name || "Lien"
      }, { withCredentials: true });
      setLinks(links.map(l => l.link_id === linkId ? response.data : l));
      setEditingLink(null);
    } catch (err) {
      console.error(err);
    }
  };

  const startEditLink = (link) => {
    // For WhatsApp links, extract phone number
    let whatsappNumber = "";
    if (link.platform === "whatsapp" && link.url.includes("wa.me/")) {
      whatsappNumber = link.url.replace("https://wa.me/", "").replace("http://wa.me/", "");
    }
    setEditingLink({ ...link, whatsappNumber });
  };

  const handleDeleteLink = async (linkId) => {
    try {
      await axios.delete(`${API}/links/${linkId}`, { withCredentials: true });
      setLinks(links.filter(l => l.link_id !== linkId));
    } catch (err) {
      console.error(err);
    }
  };

  const addEmail = () => {
    setEmails([...emails, { type: "email", value: "", label: "" }]);
  };

  const removeEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index, field, value) => {
    const updated = [...emails];
    updated[index] = { ...updated[index], [field]: value };
    setEmails(updated);
  };

  const addPhone = () => {
    setPhones([...phones, { type: "phone", value: "", label: "", country_code: "+225" }]);
  };

  const removePhone = (index) => {
    setPhones(phones.filter((_, i) => i !== index));
  };

  const updatePhone = (index, field, value) => {
    const updated = [...phones];
    updated[index] = { ...updated[index], [field]: value };
    setPhones(updated);
  };

  const getAvatarUrl = () => {
    if (!profile?.avatar) return null;
    if (profile.avatar.startsWith("http")) return profile.avatar;
    // Handle both old (/uploads/) and new (/api/uploads/) paths
    if (profile.avatar.startsWith("/api/")) return `${BACKEND_URL}${profile.avatar}`;
    return `${BACKEND_URL}/api${profile.avatar}`;
  };

  const getCoverUrl = () => {
    if (!profile?.cover_image) return null;
    if (profile.cover_image.startsWith("http")) return profile.cover_image;
    // Handle both old (/uploads/) and new (/api/uploads/) paths
    if (profile.cover_image.startsWith("/api/")) return `${BACKEND_URL}${profile.cover_image}`;
    return `${BACKEND_URL}/api${profile.cover_image}`;
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8" data-testid="card-editor-tab">
      {/* Editor */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Éditer ma carte</h1>
          <p className="text-muted-foreground">Personnalisez votre profil public</p>
        </div>

        {/* Avatar & Cover */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5" /> Photo de profil & Couverture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div 
                  className="w-28 h-28 rounded-full border-4 border-primary/20 overflow-hidden bg-muted flex items-center justify-center cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ width: '120px', height: '120px' }}
                >
                  {getAvatarUrl() ? (
                    <img src={getAvatarUrl()} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">Photo de profil</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => avatarInputRef.current?.click()}>
                    <Camera className="w-4 h-4 mr-1" /> Changer
                  </Button>
                  {profile?.avatar && (
                    <Button size="sm" variant="outline" onClick={handleDeleteAvatar}>
                      <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Cover */}
            <div className="space-y-3">
              <Label>Couverture</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cover_type"
                    value="color"
                    checked={formData.cover_type === "color"}
                    onChange={() => setFormData({ ...formData, cover_type: "color" })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Couleur</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cover_type"
                    value="image"
                    checked={formData.cover_type === "image"}
                    onChange={() => setFormData({ ...formData, cover_type: "image" })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Image</span>
                </label>
              </div>

              {formData.cover_type === "color" ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.cover_color}
                    onChange={(e) => setFormData({ ...formData, cover_color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer border-0"
                  />
                  <Input
                    value={formData.cover_color}
                    onChange={(e) => setFormData({ ...formData, cover_color: e.target.value })}
                    className="w-32"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div 
                    className="h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {getCoverUrl() ? (
                      <img src={getCoverUrl()} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                        <span className="text-sm text-muted-foreground">Cliquez pour ajouter une image</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                  {profile?.cover_image && (
                    <Button size="sm" variant="outline" onClick={handleDeleteCover}>
                      <Trash2 className="w-4 h-4 mr-1" /> Supprimer l'image
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                <Label>Prénom</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Jean"
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Dupont"
                  data-testid="input-last-name"
                />
              </div>
            </div>
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
            {/* Emails */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Emails</Label>
                <Button size="sm" variant="ghost" onClick={addEmail}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    type="email"
                    value={email.value}
                    onChange={(e) => updateEmail(index, "value", e.target.value)}
                    placeholder="email@exemple.com"
                    className="flex-1"
                  />
                  <Input
                    value={email.label || ""}
                    onChange={(e) => updateEmail(index, "label", e.target.value)}
                    placeholder="Label (ex: Travail)"
                    className="w-32"
                  />
                  <Button size="icon" variant="ghost" onClick={() => removeEmail(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {emails.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun email ajouté</p>
              )}
            </div>

            {/* Phones */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Téléphones</Label>
                <Button size="sm" variant="ghost" onClick={addPhone}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter
                </Button>
              </div>
              {phones.map((phone, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={phone.country_code || "+225"}
                    onChange={(e) => updatePhone(index, "country_code", e.target.value)}
                    className="h-10 px-2 rounded-lg border border-input bg-background text-sm w-28"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="tel"
                    value={phone.value}
                    onChange={(e) => updatePhone(index, "value", e.target.value)}
                    placeholder="07 00 00 00 00"
                    className="flex-1"
                  />
                  <Input
                    value={phone.label || ""}
                    onChange={(e) => updatePhone(index, "label", e.target.value)}
                    placeholder="Label"
                    className="w-24"
                  />
                  <Button size="icon" variant="ghost" onClick={() => removePhone(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {phones.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun téléphone ajouté</p>
              )}
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
                {links.map((link) => {
                  const platform = socialPlatforms.find(p => p.id === link.platform);
                  const isEditing = editingLink?.link_id === link.link_id;
                  
                  if (isEditing) {
                    return (
                      <div key={link.link_id} className="p-4 border border-primary rounded-xl space-y-4 bg-primary/5">
                        <div className="space-y-2">
                          <Label>Titre</Label>
                          <Input
                            value={editingLink.title}
                            onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                            placeholder="Mon lien"
                          />
                        </div>
                        {editingLink.platform === "whatsapp" ? (
                          <div className="space-y-2">
                            <Label>Numéro WhatsApp</Label>
                            <Input
                              type="tel"
                              value={editingLink.whatsappNumber || ""}
                              onChange={(e) => setEditingLink({ ...editingLink, whatsappNumber: e.target.value })}
                              placeholder="+225 07 00 00 00 00"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                              type="url"
                              value={editingLink.url}
                              onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                              placeholder="https://..."
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setEditingLink(null)}>Annuler</Button>
                          <Button onClick={() => handleUpdateLink(link.link_id)}>Enregistrer</Button>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={link.link_id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl group">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: platform?.color || "#8645D6" }}
                      >
                        {platform?.icon ? (
                          <img 
                            src={platform.icon} 
                            alt={platform.name} 
                            className="w-5 h-5 invert"
                          />
                        ) : (
                          <Globe className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{link.title}</div>
                        <div className="text-sm text-muted-foreground">{platform?.name || "Lien"}</div>
                      </div>
                      <Badge variant="secondary">{link.clicks} clics</Badge>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => startEditLink(link)} data-testid={`edit-link-${link.link_id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => handleDeleteLink(link.link_id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
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
                      onChange={(e) => {
                        const platform = socialPlatforms.find(p => p.id === e.target.value);
                        setNewLink({ ...newLink, platform: e.target.value, title: platform?.name || "", url: "", whatsappNumber: "" });
                      }}
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
                {newLink.platform === "whatsapp" ? (
                  <div className="space-y-2">
                    <Label>Numéro WhatsApp</Label>
                    <Input
                      type="tel"
                      value={newLink.whatsappNumber}
                      onChange={(e) => setNewLink({ ...newLink, whatsappNumber: e.target.value })}
                      placeholder="+225 07 00 00 00 00"
                    />
                    <p className="text-xs text-muted-foreground">Entrez le numéro avec l'indicatif pays</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      type="url"
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowAddLink(false)}>Annuler</Button>
                  <Button onClick={handleAddLink} disabled={newLink.platform === "whatsapp" ? !newLink.whatsappNumber : !newLink.url}>Ajouter le lien</Button>
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
                flexcard.co/{profile?.username} <ExternalLink className="w-3 h-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfilePreview 
              profile={{ 
                ...profile, 
                ...formData,
                emails,
                phones,
                avatar: profile?.avatar,
                cover_image: profile?.cover_image
              }} 
              links={links} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const QRCodeTab = ({ profile }) => {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);
  
  // QR Code is always black per user request
  const qrColor = "#000000";
  const bgColor = "#FFFFFF";

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
      link.download = `flexcard-${profile?.username}.png`;
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
            <div ref={qrRef} className="p-6 rounded-2xl bg-white shadow-lg">
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
              {analytics.links.map((link, i) => {
                const platform = socialPlatforms.find(p => p.id === link.platform);
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: platform?.color || "#8645D6" }}
                    >
                      {platform?.icon ? (
                        <img src={platform.icon} alt={platform.name} className="w-5 h-5 invert" />
                      ) : (
                        <Globe className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{link.title}</div>
                      <div className="text-sm text-muted-foreground">{link.url}</div>
                    </div>
                    <Badge variant="secondary">{link.clicks} clics</Badge>
                  </div>
                );
              })}
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
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API}/profile`, { withCredentials: true });
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      logout();
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
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
            <span className="text-muted-foreground">flexcard.co/</span>
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

      {/* Delete Card Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Zone de danger
          </CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-xl">
              <div>
                <p className="font-medium">Supprimer ma carte</p>
                <p className="text-sm text-muted-foreground">Cette action supprimera définitivement votre profil et toutes vos données</p>
              </div>
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                data-testid="delete-card-btn"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-destructive/10 rounded-xl space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-destructive">Êtes-vous sûr ?</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cette action est irréversible. Votre profil public, vos liens, vos contacts collectés et toutes vos données seront supprimés définitivement.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  data-testid="confirm-delete-btn"
                >
                  {deleting ? "Suppression..." : "Oui, supprimer définitivement"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== PROFILE PREVIEW ====================
const ProfilePreview = ({ profile, links, mini = false }) => {
  const getAvatarUrl = () => {
    if (!profile?.avatar) return null;
    if (profile.avatar.startsWith("http")) return profile.avatar;
    // Handle both old (/uploads/) and new (/api/uploads/) paths
    if (profile.avatar.startsWith("/api/")) return `${BACKEND_URL}${profile.avatar}`;
    return `${BACKEND_URL}/api${profile.avatar}`;
  };

  const getCoverUrl = () => {
    if (!profile?.cover_image) return null;
    if (profile.cover_image.startsWith("http")) return profile.cover_image;
    // Handle both old (/uploads/) and new (/api/uploads/) paths
    if (profile.cover_image.startsWith("/api/")) return `${BACKEND_URL}${profile.cover_image}`;
    return `${BACKEND_URL}/api${profile.cover_image}`;
  };

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.title || "Votre nom";
  
  // Determine cover style
  const coverStyle = {
    height: mini ? '80px' : '150px',
  };
  
  if (profile?.cover_type === "image" && getCoverUrl()) {
    coverStyle.backgroundImage = `url(${getCoverUrl()})`;
    coverStyle.backgroundSize = "cover";
    coverStyle.backgroundPosition = "center";
  } else {
    coverStyle.backgroundColor = profile?.cover_color || "#8645D6";
  }

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-lg ${mini ? "scale-90 origin-top" : ""}`}>
      {/* Header with cover */}
      <div className="relative" style={coverStyle}>
        {/* Avatar centered */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: mini ? '-40px' : '-60px' }}>
          {getAvatarUrl() ? (
            <div 
              className="rounded-full border-4 border-white shadow-xl overflow-hidden"
              style={{ width: mini ? '80px' : '120px', height: mini ? '80px' : '120px' }}
            >
              <img 
                src={getAvatarUrl()} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div 
              className="rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"
              style={{ 
                width: mini ? '80px' : '120px', 
                height: mini ? '80px' : '120px',
                backgroundColor: '#8645D6',
                fontSize: mini ? '24px' : '36px'
              }}
            >
              {displayName[0] || "?"}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingTop: mini ? '50px' : '70px' }} className="pb-6 px-6 text-center">
        <h2 className="font-heading font-bold text-xl">{displayName}</h2>
        {profile?.title && <p className="text-muted-foreground">{profile.title}</p>}
        {profile?.company && <p className="text-sm text-muted-foreground">{profile.company}</p>}
        {profile?.bio && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{profile.bio}</p>}

        {/* Contact buttons */}
        <div className="flex justify-center gap-2 mt-4">
          {profile?.phones?.length > 0 && (
            <Button size="sm" variant="outline" className="rounded-full">
              <Phone className="w-4 h-4" />
            </Button>
          )}
          {profile?.emails?.length > 0 && (
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
            {links.slice(0, mini ? 3 : undefined).map((link) => {
              const platform = socialPlatforms.find(p => p.id === link.platform);
              return (
                <div 
                  key={link.link_id} 
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: platform?.color || "#8645D6" }}
                  >
                    {platform?.icon ? (
                      <img src={platform.icon} alt={platform.name} className="w-4 h-4 invert" />
                    ) : (
                      <Globe className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{link.title}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export { Dashboard, ProfilePreview };
