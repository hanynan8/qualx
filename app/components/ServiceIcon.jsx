// components/ServiceIcon.js
import { Eye, Users, ClipboardCheck, HeartHandshake, Sparkles } from "lucide-react";

const ICONS = {
  eye: Eye,
  users: Users,
  "clipboard-check": ClipboardCheck,
  "heart-handshake": HeartHandshake,
};

export default function ServiceIcon({ name, size = 22, className = "" }) {
  const Icon = ICONS[name] || Sparkles;
  return <Icon size={size} className={className} />;
}