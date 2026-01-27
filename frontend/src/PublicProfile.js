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
import { API, BACKEND_URL, socialPlatforms, LOGO_URL } from "./App";

// Skeleton loader component for images
const ImageSkeleton = ({ className, style }) => (
  <div 
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className}`}
    style={{
      ...style,
      animation: 'shimmer 1.5s infinite',
    }}
  />
);

// Image with skeleton loader
const ImageWithSkeleton = ({ src, alt, className, style, rounded = false }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (!src || error) {
    return null;
  }

  return (
    <div className="relative" style={style}>
      {!loaded && (
        <ImageSkeleton 
          className={`absolute inset-0 ${rounded ? 'rounded-full' : ''}`}
          style={style}
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        style={style}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};

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

  const handleLinkClick = (link) => {
    // Record click asynchronously (don't wait for it)
    axios.post(`${API}/public/${username}/click/${link.link_id}`).catch(console.error);
    
    // Open link immediately for better mobile responsiveness
    let url = link.url;
    if (url) {
      // Ensure URL has protocol
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }
      // Use window.open for external links
      window.open(url, "_blank", "noopener,noreferrer");
    }
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

  const handleSaveContact = async () => {
    if (!data?.profile) return;
    const { profile, links } = data;
    
    const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.title || username;
    const firstName = profile.first_name || "";
    const lastName = profile.last_name || "";
    
    // Build vCard with all information
    let vcardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${displayName}`,
      `N:${lastName};${firstName};;;`,
    ];
    
    // Add title and organization
    if (profile.title) vcardLines.push(`TITLE:${profile.title}`);
    if (profile.company) vcardLines.push(`ORG:${profile.company}`);
    
    // Add all emails with labels
    if (profile.emails && profile.emails.length > 0) {
      profile.emails.forEach((email, index) => {
        const type = email.label?.toUpperCase() || (index === 0 ? "WORK" : "HOME");
        vcardLines.push(`EMAIL;TYPE=${type}:${email.value}`);
      });
    } else if (profile.email) {
      vcardLines.push(`EMAIL:${profile.email}`);
    }
    
    // Add all phone numbers with labels
    if (profile.phones && profile.phones.length > 0) {
      profile.phones.forEach((phone, index) => {
        const type = phone.label?.toUpperCase() || (index === 0 ? "CELL" : "WORK");
        vcardLines.push(`TEL;TYPE=${type}:${phone.value}`);
      });
    } else if (profile.phone) {
      vcardLines.push(`TEL:${profile.phone}`);
    }
    
    // Add website
    if (profile.website) vcardLines.push(`URL:${profile.website}`);
    
    // Add location
    if (profile.location) vcardLines.push(`ADR:;;${profile.location};;;;`);
    
    // Add bio as note
    if (profile.bio) vcardLines.push(`NOTE:${profile.bio.replace(/\n/g, "\\n")}`);
    
    // Add social media links as URLs
    if (links && links.length > 0) {
      links.forEach(link => {
        if (link.url) {
          vcardLines.push(`X-SOCIALPROFILE;TYPE=${link.platform || "other"}:${link.url}`);
        }
      });
    }
    
    // Add profile URL
    vcardLines.push(`URL;TYPE=FlexCard:${window.location.href}`);
    
    // Helper function to download vCard
    const downloadVCard = (vcardContent) => {
      const blob = new Blob([vcardContent], { type: "text/vcard;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${displayName.replace(/\s+/g, "_")}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    
    // Try to add profile photo
    const avatarUrl = getAvatarUrl(profile);
    if (avatarUrl) {
      try {
        // Build full URL for avatar
        let fullAvatarUrl = avatarUrl;
        if (avatarUrl.startsWith("/")) {
          fullAvatarUrl = `${window.location.origin}${avatarUrl}`;
        }
        
        // Fetch the image and convert to base64
        const response = await fetch(fullAvatarUrl);
        if (response.ok) {
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onloadend = () => {
            const base64data = reader.result.split(',')[1];
            if (base64data) {
              const mimeType = blob.type || "image/jpeg";
              const photoType = mimeType.includes("png") ? "PNG" : "JPEG";
              vcardLines.push(`PHOTO;ENCODING=b;TYPE=${photoType}:${base64data}`);
            }
            vcardLines.push("END:VCARD");
            downloadVCard(vcardLines.join("\r\n"));
          };
          
          reader.onerror = () => {
            vcardLines.push("END:VCARD");
            downloadVCard(vcardLines.join("\r\n"));
          };
          
          reader.readAsDataURL(blob);
        } else {
          // If fetch fails, download without photo
          vcardLines.push("END:VCARD");
          downloadVCard(vcardLines.join("\r\n"));
        }
      } catch (err) {
        console.error("Error loading photo for vCard:", err);
        vcardLines.push("END:VCARD");
        downloadVCard(vcardLines.join("\r\n"));
      }
    } else {
      // No photo, download directly
      vcardLines.push("END:VCARD");
      downloadVCard(vcardLines.join("\r\n"));
    }
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
    // Handle both old (/uploads/) and new (/api/uploads/) paths
    if (profile.avatar.startsWith("/api/")) return `${BACKEND_URL}${profile.avatar}`;
    return `${BACKEND_URL}/api${profile.avatar}`;
  };

  const getCoverUrl = (profile) => {
    if (!profile?.cover_image) return null;
    if (profile.cover_image.startsWith("http")) return profile.cover_image;
    // Handle both old (/uploads/) and new (/api/uploads/) paths
    if (profile.cover_image.startsWith("/api/")) return `${BACKEND_URL}${profile.cover_image}`;
    return `${BACKEND_URL}/api${profile.cover_image}`;
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

  // Avatar with skeleton loader component
  const AvatarWithLoader = ({ src, name, size = 120 }) => {
    const [loaded, setLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    if (!src || imgError) {
      return (
        <div 
          className="rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"
          style={{ 
            width: `${size}px`, 
            height: `${size}px`,
            backgroundColor: '#8645D6',
            fontSize: `${size / 3}px`
          }}
        >
          {name?.[0]?.toUpperCase() || "?"}
        </div>
      );
    }

    return (
      <div 
        className="rounded-full border-4 border-white shadow-xl overflow-hidden relative"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {!loaded && (
          <div 
            className="absolute inset-0 rounded-full animate-shimmer"
            style={{
              background: 'linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%)',
              backgroundSize: '200% 100%'
            }}
          />
        )}
        <img 
          src={src} 
          alt={name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setImgError(true)}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen gradient-bg-subtle" data-testid="public-profile">
      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Header with cover */}
          <div 
            className="relative"
            style={{ 
              height: '150px',
              ...(profile.cover_type === "image" && getCoverUrl(profile) 
                ? {
                    backgroundImage: `url(${getCoverUrl(profile)})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }
                : {
                    backgroundColor: profile.cover_color || "#8645D6"
                  }
              )
            }}
          />

          {/* Avatar and Info - Perfectly centered */}
          <div className="flex flex-col items-center" style={{ marginTop: '-60px' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <AvatarWithLoader 
                src={getAvatarUrl(profile)} 
                name={displayName} 
                size={120} 
              />
            </motion.div>

            {/* Name and Info - centered below avatar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mt-4 mb-6 px-6 w-full"
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
          </div>

          {/* Content */}
          <div className="pb-8 px-6">

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
                    <motion.div
                      key={link.link_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <a
                        href={link.url && !link.url.startsWith("http://") && !link.url.startsWith("https://") ? `https://${link.url}` : link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick(link);
                        }}
                        className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 active:bg-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
                        data-testid={`link-${link.link_id}`}
                      >
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                          style={{ backgroundColor: platform?.color || "#8645D6" }}
                        >
                          {platform?.icon ? (
                            <img src={platform.icon} alt={platform.name} className="w-6 h-6 invert" />
                          ) : (
                            <Globe className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-semibold truncate">{link.title}</div>
                          <div className="text-sm text-muted-foreground">{platform?.name || "Lien"}</div>
                        </div>
                        <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </a>
                    </motion.div>
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

// Profile by User ID component (for QR code scanning)
const ProfileByUserId = () => {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API}/profile/user/${userId}`);
        setData(response.data);
      } catch (err) {
        setError(err.response?.status === 404 ? "Profil non trouvé" : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleLinkClick = (link) => {
    // Record click asynchronously
    if (data?.profile?.username) {
      axios.post(`${API}/public/${data.profile.username}/click/${link.link_id}`).catch(console.error);
    }
    
    let url = link.url;
    if (url) {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleSaveContact = async () => {
    if (!data?.profile) return;
    const { profile, links } = data;
    
    const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.title || "Contact";
    const firstName = profile.first_name || "";
    const lastName = profile.last_name || "";
    
    let vcardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${displayName}`,
      `N:${lastName};${firstName};;;`,
    ];
    
    if (profile.title) vcardLines.push(`TITLE:${profile.title}`);
    if (profile.company) vcardLines.push(`ORG:${profile.company}`);
    
    if (profile.emails && profile.emails.length > 0) {
      profile.emails.forEach((email, index) => {
        const type = email.label?.toUpperCase() || (index === 0 ? "WORK" : "HOME");
        vcardLines.push(`EMAIL;TYPE=${type}:${email.value}`);
      });
    }
    
    if (profile.phones && profile.phones.length > 0) {
      profile.phones.forEach((phone, index) => {
        const type = phone.label?.toUpperCase() || (index === 0 ? "CELL" : "WORK");
        vcardLines.push(`TEL;TYPE=${type}:${phone.value}`);
      });
    }
    
    if (profile.website) vcardLines.push(`URL:${profile.website}`);
    if (profile.location) vcardLines.push(`ADR:;;${profile.location};;;;`);
    if (profile.bio) vcardLines.push(`NOTE:${profile.bio.replace(/\n/g, "\\n")}`);
    
    if (links && links.length > 0) {
      links.forEach(link => {
        if (link.url) {
          vcardLines.push(`X-SOCIALPROFILE;TYPE=${link.platform || "other"}:${link.url}`);
        }
      });
    }
    
    vcardLines.push(`URL;TYPE=FlexCard:${window.location.href}`);
    vcardLines.push("END:VCARD");
    
    const blob = new Blob([vcardLines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${displayName.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    if (profile?.cover_type === "color") return null;
    if (!profile?.cover_image) return null;
    if (profile.cover_image.startsWith("http")) return profile.cover_image;
    return `${BACKEND_URL}${profile.cover_image}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 gradient-bg rounded-full animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Profil non trouvé</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link to="/">
              <Button variant="gradient">Retour à l'accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, links } = data;
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.title || "Utilisateur";
  const avatarUrl = getAvatarUrl(profile);
  const coverUrl = getCoverUrl(profile);
  const primaryEmail = profile.emails?.[0]?.value;
  const primaryPhone = profile.phones?.[0]?.value;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" data-testid="profile-by-userid">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-b-3xl overflow-hidden shadow-xl"
        >
          {/* Cover */}
          <div 
            className="h-32 relative"
            style={{ 
              backgroundColor: profile.cover_color || "#8645D6",
              backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          />

          {/* Profile Info */}
          <div className="px-6 pb-6 -mt-12 relative">
            <div className="w-24 h-24 rounded-full border-4 border-card overflow-hidden mx-auto bg-muted">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-muted-foreground">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="text-center mt-4">
              <h1 className="text-2xl font-bold font-heading">{displayName}</h1>
              {profile.title && <p className="text-muted-foreground">{profile.title}</p>}
              {profile.company && <p className="text-sm text-muted-foreground">{profile.company}</p>}
              {profile.location && (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {profile.location}
                </p>
              )}
            </div>

            {profile.bio && (
              <p className="text-center text-sm text-muted-foreground mt-4 max-w-xs mx-auto">
                {profile.bio}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="gradient" className="flex-1" onClick={handleSaveContact} data-testid="save-contact-btn">
                <Download className="w-4 h-4 mr-2" /> Enregistrer
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleShare} data-testid="share-btn">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                {copied ? "Copié !" : "Partager"}
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-center gap-4 mt-6">
              {primaryPhone && (
                <Button size="icon" variant="outline" className="rounded-full w-12 h-12"
                  onClick={() => window.open(`tel:${primaryPhone}`)}>
                  <Phone className="w-5 h-5" />
                </Button>
              )}
              {primaryEmail && (
                <Button size="icon" variant="outline" className="rounded-full w-12 h-12"
                  onClick={() => window.open(`mailto:${primaryEmail}`)}>
                  <Mail className="w-5 h-5" />
                </Button>
              )}
              {primaryPhone && (
                <Button size="icon" variant="outline" className="rounded-full w-12 h-12"
                  onClick={() => window.open(`https://wa.me/${primaryPhone.replace(/\D/g, "")}`)}>
                  <MessageCircle className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Social Links */}
        {links && links.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 px-4 space-y-3"
          >
            {links.map((link) => {
              const platform = socialPlatforms.find(p => p.id === link.platform);
              return (
                <Card 
                  key={link.link_id}
                  className="cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleLinkClick(link)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: platform?.color || "#8645D6" }}
                    >
                      {platform?.icon ? (
                        <img src={platform.icon} alt="" className="w-6 h-6 invert" />
                      ) : (
                        <Globe className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{link.title || platform?.name}</h3>
                      <p className="text-sm text-muted-foreground">{platform?.name || "Lien"}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 pb-8"
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
export { ProfileByUserId };
