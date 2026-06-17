// Central site configuration. Front-end only: the quote form submits via the
// mailto address below, swap `email` for a real backend/form endpoint later.
export const site = {
  name: "Dakrenovatie Midden-Nederland",
  tagline: "Vernieuwing · Reparatie · Renovatie",
  slogan: "Uw Dak, Onze Zorg",
  // PLACEHOLDERS, replace phone and email with the real details before launch.
  phone: "0600000000",
  phoneDisplay: "06 00 00 00 00 (voorbeeld)",
  email: "voorbeeld@example.com",
  domain: "dakrenovatiemiddennederland.nl",
  logo: "/logo.jpg",
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "Diensten", href: "/diensten", hasSubmenu: true },
  { label: "Beoordelingen", href: "/beoordelingen" },
  { label: "Contact", href: "/contact" },
];

export type Service = {
  slug: string;
  title: string;
  eyebrow: string;
  headline: string;
  intro: string;
  bullets: string[];
  full: boolean;
};

// Dak Renovatie is the fully-built template; the rest reuse the same template
// with lighter copy for now (first-pass scope).
export const services: Service[] = [
  {
    slug: "dak-renovatie",
    title: "Dak Renovatie",
    eyebrow: "Dak Renovatie",
    headline: "Een compleet vernieuwd dak dat decennia meegaat",
    intro:
      "Of uw dak nu toe is aan een grondige opknapbeurt of een volledige vernieuwing, ons ervaren team renoveert uw dak vakkundig, met oog voor isolatie, afwerking en duurzaamheid.",
    bullets: [
      "Volledige inspectie en helder renovatieplan vooraf",
      "Hoogwaardige, duurzame materialen van gerenommeerde fabrikanten",
      "Verbeterde isolatie voor lagere energiekosten",
      "Strakke afwerking en een dak dat jaren meegaat",
    ],
    full: true,
  },
  {
    slug: "vervanging",
    title: "Vervanging",
    eyebrow: "Vervanging",
    headline: "Toe aan een volledig nieuw dak?",
    intro:
      "Wij vervangen uw dak van constructie tot dakbedekking, snel en zonder zorgen.",
    bullets: [
      "Complete vervanging van oud naar nieuw",
      "Kwaliteitsmaterialen met garantie",
      "Vakkundige montage",
    ],
    full: false,
  },
  {
    slug: "dak-reparatie",
    title: "Dak Reparatie",
    eyebrow: "Dak Reparatie",
    headline: "Snelle en betrouwbare dakreparaties",
    intro:
      "Lekkage of schade? Wij sporen het probleem op en herstellen het vakkundig.",
    bullets: [
      "Snelle opsporing van de oorzaak",
      "Duurzaam herstel",
      "Voorkomt vervolgschade",
    ],
    full: false,
  },
  {
    slug: "dakpannen-reparatie",
    title: "Dakpannen Reparatie",
    eyebrow: "Dakpannen Reparatie",
    headline: "Heeft u last van beschadigde of ontbrekende dakpannen?",
    intro:
      "Voorkom lekkages en verdere schade met onze snelle en professionele dakpannenreparaties.",
    bullets: [
      "Gratis inspectie",
      "Binnen 24 uur hulp bij spoed",
      "Duurzame oplossingen met kwaliteitsmaterialen",
    ],
    full: false,
  },
  {
    slug: "dakgoot",
    title: "Dakgoot",
    eyebrow: "Dakgoot",
    headline: "Schone en werkende dakgoten",
    intro:
      "Wij reinigen, repareren en vervangen dakgoten zodat regenwater altijd goed wordt afgevoerd.",
    bullets: ["Reiniging en onderhoud", "Reparatie en vervanging", "Voorkomt waterschade"],
    full: false,
  },
  {
    slug: "lekdetectie",
    title: "Lekdetectie",
    eyebrow: "Lekdetectie",
    headline: "De oorzaak van uw lekkage, nauwkeurig opgespoord",
    intro:
      "Met moderne technieken vinden we precies waar het lek zit, zonder onnodig sloopwerk.",
    bullets: ["Nauwkeurige opsporing", "Geen onnodige schade", "Helder advies"],
    full: false,
  },
  {
    slug: "stormschade-dakpannen",
    title: "Stormschade Dakpannen",
    eyebrow: "Stormschade Dakpannen",
    headline: "Stormschade aan uw dak? Wij staan voor u klaar",
    intro:
      "Na storm helpen we u snel met herstel en ondersteunen we bij de afhandeling met uw verzekering.",
    bullets: ["Spoedherstel", "Hulp bij verzekering", "Voorkomt vervolgschade"],
    full: false,
  },
  {
    slug: "schoorsteen-reparatie",
    title: "Schoorsteen Reparatie",
    eyebrow: "Schoorsteen Reparatie",
    headline: "Vakkundig schoorsteenherstel",
    intro:
      "Voegwerk, loodslabben of een scheve schoorsteen, wij herstellen het veilig en netjes.",
    bullets: ["Herstel van voegwerk en lood", "Veilig werken op hoogte", "Nette afwerking"],
    full: false,
  },
];
