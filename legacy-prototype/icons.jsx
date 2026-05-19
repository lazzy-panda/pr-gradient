/* Inline SVG icons. All accept { size, color, className, style } */
const ic = (path, vb = '0 0 24 24') => ({ size = 16, color = 'currentColor', className = '', style = {}, strokeWidth = 1.7 }) => (
  <svg width={size} height={size} viewBox={vb} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">
    {path}
  </svg>
);

const IconCalendar  = ic(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 3v4"/><path d="M16 3v4"/></>);
const IconLayers    = ic(<><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4"/><path d="M3 17l9 4 9-4"/></>);
const IconPlus      = ic(<><path d="M12 5v14"/><path d="M5 12h14"/></>);
const IconChevL     = ic(<path d="M15 6l-6 6 6 6"/>);
const IconChevR     = ic(<path d="M9 6l6 6-6 6"/>);
const IconChevDown  = ic(<path d="M6 9l6 6 6-6"/>);
const IconSearch    = ic(<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>);
const IconX         = ic(<><path d="M18 6L6 18"/><path d="M6 6l12 12"/></>);
const IconAlert     = ic(<><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.5"/></>);
const IconCheck     = ic(<path d="M5 12l5 5 9-12"/>);
const IconLink      = ic(<><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>);
const IconTrash     = ic(<><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></>);
const IconFilter    = ic(<><path d="M3 5h18"/><path d="M6 12h12"/><path d="M10 19h4"/></>);
const IconUser      = ic(<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>);
const IconExternal  = ic(<><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></>);
const IconClock     = ic(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>);
const IconGrip      = ic(<><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></>);

// Platform glyphs (simplified)
const IconTikTok   = ic(<><path d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c0 2 2 4 5 4"/></>);
const IconInsta    = ic(<><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor"/></>);
const IconYouTube  = ic(<><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M11 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none"/></>);
const IconVK       = ic(<><rect x="3" y="4.5" width="18" height="15" rx="3.5"/><path d="M7 10h2c0 2 1 4 2.5 4V10H13v3.5c1 0 2-1.5 3-3.5h2c-1 2.5-2 3.5-2 4s1.5 1.5 2.5 3.5h-2c-1-1.5-2-2.5-3-2.5V18h-1.5C9.5 18 7 14.5 7 10z" fill="currentColor" stroke="none"/></>);
const IconTelegram = ic(<><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 1 1 3 2-2.5 3 2.5 1.5-7-9 3z" fill="currentColor" stroke="none"/></>);

const PLATFORM_ICON = {
  TikTok: IconTikTok, Instagram: IconInsta, YouTube: IconYouTube, VK: IconVK, Telegram: IconTelegram
};

Object.assign(window, {
  IconCalendar, IconLayers, IconPlus, IconChevL, IconChevR, IconChevDown,
  IconSearch, IconX, IconAlert, IconCheck, IconLink, IconTrash, IconFilter,
  IconUser, IconExternal, IconClock, IconGrip,
  IconTikTok, IconInsta, IconYouTube, IconVK, IconTelegram, PLATFORM_ICON,
});
