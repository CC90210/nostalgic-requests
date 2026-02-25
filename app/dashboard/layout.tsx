"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, effect, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConnectionStatus from "@/components/ui/ConnectionStatus";
import {
  LayoutDashboard,
  PlusCircle,
  Radio,
  CalendarDays,
  Users,
  LogOut,
  Music,
  Settings,
  Disc,
  Home,
  ExternalLink
} from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  const displayName = user?.user_metadata?.dj_name || user?.user_metadata?.full_name || profile?.dj_name || user?.email?.split("@")[0] || "DJ";
  const displayEmail = user?.email || "";
  const profileImage = user?.user_metadata?.profile_image_url || profile?.profile_image_url || null;

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/new", icon: PlusCircle, label: "Create Event" },
    { href: "/dashboard/live", icon: Radio, label: "Live Requests" },
    { href: "/dashboard/events", icon: CalendarDays, label: "My Events" },
    { href: "/dashboard/leads", icon: Users, label: "Leads" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex">
      <aside className="w-64 bg-[#0F0F10] border-r border-[#2D2D2D] hidden md-flex flex-col">
        <div classNam”ô"p-6 border-b border-[#2D2D2D]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg shadow-purple-500/20">
              <Image src="/logo.png" alt="Nostalgic Requests" width='{40}' height={40}' className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 classNam”ô‰Ñ•áÐµá°™½¹Ðµ‰½±‰œµÉ…‘¥•¹ÐµÑ¼µÈ™É½´µÁÕÉÁ±”´ÐÀÀÑ¼µÁ¥¹¬´ÔÀÀ‰œµ±¥ÀµÑ•áÐÑ•áÐµÑÉ…¹ÍÁ…É•¹Ðˆø(€€€€€€€€€€€€€€€9½ÍÑ…±¥Œ(€€€€€€€€€€€€€€ð½ Äø(€€€€€€€€€€€€€€ñÀ±…ÍÍ9…¶SÒ'FW‡BÖw&’ÓSFW‡B×‡2#äD¢&WVW7G3Â÷à¢ÂöF—cà¢ÂôÆ–æ³à¢ÂöF—cà ¢ÆF—b6Æ74æÖSÒ'ÓB&÷&FW"Ö"²&÷&FW"Õ²3$C$C$EÒ#à¢ÄÆ–æ²
™YH‹Ù\Ú›Ø\™ÜÙ][™ÜÈˆÛ\ÜÓ˜[e="block bg-[#1A1A12] hover:bg-[#252526] rounded-xl p-3 transition-colors">
            <div className="flex items-center gap-3">
              <div classNam”ô‰Ü´ÄÀ ´ÄÀ‰œµÉ…‘¥•¹ÐµÑ¼µ‰È™É½´µÁÕÉÁ±”´ØÀÀÑ¼µÁ¥¹¬´ØÀÀÉ½Õ¹‘•µ±œ™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È½Ù•É™±½Üµ¡¥‘‘•¸™±•àµÍ¡É¥¹¬´Àˆø(€€€€€€€€€€€€€€€íÁÉ½™¥±•%µ…”€ü€ (€€€€€€€€€€€€€€€€€€ñ¥µœÍÉŒõíÁÉ½™¥±•%µ…•ô…±Ðô‰AÉ½™¥±”ˆ±…ÍÍ9…µ”ô‰Üµ™Õ±° µ™Õ±°½‰©•Ðµ½Ù•Èˆ€¼ø(€€€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€€€ñ¥ÍŒ±…ÍÍ9…µ”ô‰Ü´Ô ´ÔÑ•áÐµÝ¡¥Ñ”ˆ€¼ø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¸µÜ´Àˆø(€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…¶SÒ'FW‡B×v†—FRföçBÖÖVF—VÒG'Væ6FR#ç¶F—7Æ”æÖWÓÂ÷à¢Ç6Æ74æÖSÒ'FW‡BÖw&’ÓSFW‡B×‡2G'Væ6FR#ç¶F—7Æ”VÖ–ÇÓÂ÷à¢ÂöF—cà¢ÂöF—cà¢ÂôÆ–æ³à¢ÂöF—cà ¢Ææb6Æ74æÖSÒ&fÆW‚ÓÓB76R×’Ó#à¢¶æd—FV×2æÖ‚†—FVÒ’Óâ°¢6öç7B—47F—fRÒF†æÖRÓÓÒ—FVÒæ‡&Vc°¢6öç7B–6öâÒ—FVÒæ–6öã° ¢&WGW&â€¢ÄÆ–æ°¢¶W“×¶—FVÒæ‡&VgÐ¢‡&Vc×¶—FVÒæ‡&VgÐ¢6Æ74æÖS×¶fÆW‚—FV×2Ö6VçFW"vÓ2‚ÓB’Ó2&÷VæFVB×†ÂG&ç6—F–öâÖÆÂw²—47F—fP¢ò&&r×W'ÆRÓcó#FW‡B×W'ÆRÓC&÷&FW"&÷&FW"×W'ÆRÓSó3 ¢¢'FW‡BÖw&’ÓC†÷fW#§FW‡B×v†—FR†÷fW#¦&rÕ²3%Ò ¢ÖÐ¢à¢Ä–6öâ6Æ74æÙOHËMHMHˆÏ‚ˆÜ[ˆÛ\ÜÓ˜[YOH™›Û[YY][HžÚ][K›X™[OÜÜ[‚ˆÓ[šÏ‚ˆ
NÂˆJ_BˆÛ˜]‚‚ˆ]ˆÛ\ÜÓ˜[e=œM›Ü™\‹]›Ü™\‹VÈÌ‘‘‘H‚ˆ[šÂˆ™YH‹È‚ˆÛ\ÜÓ˜[YOHËY[›^][\ËXÙ[\ˆØ\LÈMKLÈ›Ý[™Y^^YÜ˜^KMÝ™\Ž^\\œKMÝ™\Ž˜™Ë\\œKMLÌL˜[œÚ][Û‹X[‚ˆ‚ˆ^\›˜[[šÈÛ\ÜÓ˜[YOHËMHMHˆÏ‚ˆÜ[ˆÛ\ÜÓ˜[e="font-medium">Back to Website</span>
          </LLink>
        </div>

        <div className="p-4 border-t border-[#2D2D2D]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span classNam”ô‰™½¹Ðµµ•‘¥Õ´ˆùM¥¸=ÕÐð½ÍÁ…¸ø(€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€ð½‘¥Øø(€€€€€€ð½…Í¥‘”ø((€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µé¡¥‘‘•¸™¥á•Ñ½À´À±•™Ð´ÀÉ¥¡Ð´À‰œµlŒÁÁÄÁt‰½É‘•Èµˆ‰½É‘•ÈµlŒÉÉÉtÀ´Ðè´ÔÀˆø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•ÑÝ••¸ˆø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È…À´Èˆø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô¢w"Ó‚‚Ó‚&÷VæFVBÖÆr÷fW&fÆ÷rÖ†–FFVâ&rÖ&Æ6²&÷&FW"&÷&FW"×v†—FRó#à¢Ä–ÖvR7&3Ò"öÆövòçær"ÇCÒ$Æövò"v–GFƒÒw³3'Òr†V–v‡C×³3'Òr6Æ74æÖSÒ'rÖgVÆÂ‚ÖgVÆÂö&¦V7BÖ6÷fW""óà¢ÂöF—cà¢Ç7â6Æ74æÙOH™›ÛX›Û^]Ú]H[˜Ø]HX^]ËVÌLŒHžÙ\Ü^S˜[Y_OÜÜ[‚ˆÙ]‚ˆ]ˆÛ\ÜÓ˜[e="flex gap-1">
            <Link
              href="/"
              classNam”ô‰À´ÈÉ½Õ¹‘•µ±œÑ•áÐµÉ…ä´ÐÀÀ¡½Ù•Èé‰œµÁÕÉÁ±”´ÔÀÀ¼ÈÀ¡½Ù•ÈéÑ•áÐµÁÕÉÁ±”´ÐÀÀÑÉ…¹Í¥Ñ¥½¸µ…±°ˆ(€€€€€€€€€€€€€Ñ¥Ñ±”ô‰	…¬Ñ¼]•‰Í¥Ñ”ˆ(€€€€€€€€€€€€ø(€€€€€€€€€€€€€€ñ!½µ”±…ÍÍ9…µ”ô‰Ü´Ô ´Ôˆ€¼ø(€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€í¹…Ù%Ñ•µÌ¹Í±¥” À°€Ð¤¹µ…À ¡¥Ñ•´¤€ôøì(€€€€€€€€€€€€€½¹ÍÐ%½¸€ô¥Ñ•´¹¥½¸ì(€€€€€€€€€€€€€½¹ÍÐ¥ÍÑ¥Ù”€ôÁ…Ñ¡¹…µ”€ôôô¥Ñ•´¹¡É•˜ì(€€€€€€€€€€€€€É•ÑÕÉ¸€ (€€€€€€€€€€€€€€€€ñ1¥¹¬(€€€€€€€€€€€€€€€€€­•äõí¥Ñ•´¹¡É•™ô(€€€€€€€€€€€€€€€€€¡É•˜õí¥Ñ•´¹¡É•™ô(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÀ´ÈÉ½Õ¹‘•µ±œÑÉ…¹Í¥Ñ¥½¸µ…±°€ì¥ÍÑ¥Ù”€ü€‰‰œµÁÕÉÁ±”´ØÀÀ¼ÈÀÑ•áÐµÁÕÉÁ±”´ÐÀÀˆ€è€‰Ñ•áÐµÉ…ä´ÐÀÀ¡½Ù•Èé‰œµlŒÅÅÄÉtˆ(€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€ñ%½¸±…ÍÍ9…µ”ô‰Ü´Ô ´Ôˆ€¼ø(€€€€€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€€€€€¤ì(€€€€€€€€€€€ô¥ô(€€€€€€€€€€€€ñ11¥¹¬(€€€€€€€€€€€€€¡É•˜ôˆ½‘…Í¡‰½…É½Í•ÑÑ¥¹Ìˆ(€€€€€€€€€€€€€±…ÍÍ9…µ”õíÀ´ÈÉ½Õ¹‘•µ±œÑÉ…¹Í¥Ñ¥½¸µ…±°€‘íÁ…Ñ¡¹…µ”€ôôô€ˆ½‘…Í¡‰½…É½Í•ÑÑ¥¹Ìˆ€ü€‰‰œµÁÕÉÁ±”´ØÀÀ¼ÈÀÑ•áÐµÁÕÉÁ±”´ÐÀÀˆ€è€‰Ñ•áÐµÉ…ä´ÐÀÀ¡½Ù•Èé‰œµlŒÅÄÄÄÉtˆ(€€€€€€€€€€€€€õô(€€€€€€€€€€€€ø(€€€€€€€€€€€€€€ñM•ÑÑ¥¹Ì±…ÍÍ9…µ”ô‰Ü´Ô ´Ôˆ€¼ø(€€€€€€€€€€€€ð½1¥¹¬ø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½‘¥Øø(€€€€€€ð½‘¥Øø((€€€€€€ñµ…¥¸±…ÍÍ9…¶SÒ&fÆW‚Ó×BÓbÖC¦×BÓ÷fW&fÆ÷rÖWFò#à¢ÄW'&÷$&÷VæF'“à¢Ä6öææV7F–öå7FGW2óà¢¶6†–ÆG&VçÐ¢ÂôW'&÷$&÷VæF'“à¢ÂöÖ–ãà¢ÂöF—cà¢“°§Ð