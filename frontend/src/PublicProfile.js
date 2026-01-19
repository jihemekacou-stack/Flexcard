import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  QrCode, Globe, Mail, Phone, MapPin, MessageCircle, Copy, Check, User, Download, Share2, ExternalLink
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
import { API, BACKEND_URL, socialPlatforms, LOGO_URL } from "./App";

const PublicProfile = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API}/public/${username}`);
        setData(response.data);
      } catch (err) {
        setError(err.response?.status === 404 ? "Profil non trouvé" : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleLinkClick = async (link) => {
    try {
      await axios.post(`${API}/public/${username}/click/${link.link_id}`);
    } catch (err) {
      console.error(err);
    }
    window.open(link.url, "_blank");
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/public/${username}/contact`, contactForm);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveContact = () => {
    if (!data?.profile) return;
    const { profile } = data;
    
    const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.title || username;
    const primaryEmail = profile.emails?.[0]?.value || profile.email;
    const primaryPhone = profile.phones?.[0]?.value || profile.phone;

    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${displayName}
${profile.title ? `TITLE:${profile.title}` : ""}
${profile.company ? `ORG:${profile.company}` : ""}
${primaryEmail ? `EMAIL:${primaryEmail}` : ""}
${primaryPhone ? `TEL:${primaryPhone}` : ""}
${profile.website ? `URL:${profile.website}` : ""}
${profile.location ? `ADR:;;${profile.location};;;;` : ""}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${username}.vcf`;
    link.click();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: data?.profile?.title || "FlexCard", url });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getAvatarUrl = (profile) => {
    if (!profile?.avatar) return null;
    if (profile.avatar.startsWith("http")) return profile.avatar;
    return `${BACKEND_URL}${profile.avatar}`;
  };

  const getCoverUrl = (profile) => {
    if (!profile?.cover_image) return null;
    if (profile.cover_image.startsWith("http")) return profile.cover_image;
    return `${BACKEND_URL}${profile.cover_image}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-subtle">
        <div className="w-12 h-12 gradient-bg rounded-full animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg-subtle" data-testid="profile-error">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-heading mb-2">{error}</h1>
          <p className="text-muted-foreground mb-6">Ce profil n'existe pas ou a été supprimé.</p>
          <Button asChild>
            <Link to="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { profile, links } = data;
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.title || username;
  const primaryEmail = profile.emails?.[0]?.value || profile.email;
  const primaryPhone = profile.phones?.[0]?.value || profile.phone;

  return (
    <div className="min-h-screen gradient-bg-subtle" data-testid="public-profile">
      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Header with cover - 15cm height */}
          <div 
            className="relative"
            style={{ 
              height: '150px',  // ~15cm approximation
              backgroundColor: profile.cover_type === "color" ? (profile.cover_color || "#6366F1") : undefined,
              backgroundImage: profile.cover_type === "image" && getCoverUrl(profile) ? `url(${getCoverUrl(profile)})` : 
                profile.cover_type === "color" ? undefined : "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            {/* Avatar - 12cm diameter, centered */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute left-1/2 -translate-x-1/2"
              style={{ bottom: '-60px' }}
            >
              <Avatar 
                className="border-4 border-white shadow-xl"
                style={{ width: '120px', height: '120px' }}  // ~12cm approximation
              >
                <AvatarImage src={getAvatarUrl(profile)} />
                <AvatarFallback 
                  className="text-4xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white"
                >
                  {displayName[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>

          {/* Content */}
          <div className="pt-20 pb-8 px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-6"
            >
              <h1 className="text-2xl font-bold font-heading">{displayName}</h1>
              {profile.title && <p className="text-muted-foreground">{profile.title}</p>}
              {profile.company && <p className="text-sm text-muted-foreground">{profile.company}</p>}
              {profile.location && (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" /> {profile.location}
                </p>
              )}
              {profile.bio && (
                <p className="text-muted-foreground mt-3 text-sm">{profile.bio}</p>
              )}
            </motion.div>

            {/* Quick action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center gap-3 mb-6"
            >
              <Button
                variant="gradient"
                className="flex-1"
                onClick={handleSaveContact}
                data-testid="save-contact-btn"
              >
                <Download className="w-4 h-4 mr-2" /> Enregistrer
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleShare}
                data-testid="share-btn"
              >
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                {copied ? "Copié !" : "Partager"}
              </Button>
            </motion.div>

            {/* Contact buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex justify-center gap-2 mb-6"
            >
              {primaryPhone && (
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                  onClick={() => window.open(`tel:${primaryPhone}`)}
                  data-testid="call-btn"
                >
                  <Phone className="w-5 h-5" />
                </Button>
              )}
              {primaryEmail && (
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                  onClick={() => window.open(`mailto:${primaryEmail}`)}
                  data-testid="email-btn"
                >
                  <Mail className="w-5 h-5" />
                </Button>
              )}
              {primaryPhone && (
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                  onClick={() => window.open(`https://wa.me/${primaryPhone.replace(/\D/g, "")}`)}
                  data-testid="whatsapp-btn"
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
              )}
              {profile.website && (
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full w-12 h-12"
                  onClick={() => window.open(profile.website, "_blank")}
                  data-testid="website-btn"
                >
                  <Globe className="w-5 h-5" />
                </Button>
              )}
            </motion.div>

            {/* Links */}
            {links && links.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                {links.map((link, i) => {
                  const platform = socialPlatforms.find(p => p.id === link.platform);
                  return (
                    <motion.button
                      key={link.link_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      onClick={() => handleLinkClick(link)}
                      className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                      data-testid={`link-${link.link_id}`}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                        style={{ backgroundColor: platform?.color || "#6366F1" }}
                      >
                        {platform?.icon ? (
                          <img src={platform.icon} alt={platform.name} className="w-6 h-6 invert" />
                        ) : (
                          <Globe className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{link.title}</div>
                        <div className="text-sm text-muted-foreground truncate">{link.url}</div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  );
                })}
              </motion.div>
            )}

            {/* Contact form */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6"
            >
              {!showContactForm ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowContactForm(true)}
                  data-testid="show-contact-form-btn"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> Envoyer un message
                </Button>
              ) : submitted ? (
                <div className="text-center p-6 bg-green-50 rounded-2xl">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold">Message envoyé !</p>
                  <p className="text-sm text-muted-foreground">Merci pour votre message.</p>
                </div>
              ) : (
                <Card className="border-0 shadow-none bg-slate-50">
                  <CardContent className="p-4">
                    <form onSubmit={handleContactSubmit} className="space-y-3">
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="Votre nom"
                          required
                          data-testid="contact-name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            placeholder="vous@exemple.com"
                            data-testid="contact-email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Téléphone</Label>
                          <Input
                            type="tel"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                            placeholder="+33..."
                            data-testid="contact-phone"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="Votre message..."
                          className="min-h-[80px]"
                          data-testid="contact-message"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowContactForm(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" variant="gradient" className="flex-1" disabled={submitting} data-testid="submit-contact-btn">
                          {submitting ? "Envoi..." : "Envoyer"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <img src={LOGO_URL} alt="FlexCard" className="w-6 h-6 object-contain" />
            <span className="text-sm">Créé avec FlexCard</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicProfile;
