import { 
    LucideIcon, Tablet, Shield, PersonStanding, Smile, Pill, Laptop, Pen, Milk, Microwave, Sofa, Dumbbell, Sparkles, Footprints, Briefcase, Gem, Baby, ToyBrick, BookOpen, Dog, Car, Sprout, CookingPot, SprayCan, Smartphone, Computer, Music, Luggage, Utensils, Castle, Gift, HeartPulse, HelpCircle
} from "lucide-react";

// A fallback icon
const defaultIcon = HelpCircle;

const iconMap: { [key: string]: LucideIcon } = {
    'Tablet': Tablet,
    'Shield': Shield,
    'PersonStanding': PersonStanding,
    'Smile': Smile,
    'Pill': Pill,
    'Laptop': Laptop,
    'Pen': Pen,
    'Milk': Milk,
    'Microwave': Microwave,
    'Sofa': Sofa,
    'Dumbbell': Dumbbell,
    'Sparkles': Sparkles,
    'Footprints': Footprints,
    'Briefcase': Briefcase,
    'Gem': Gem,
    'Baby': Baby,
    'ToyBrick': ToyBrick,
    'BookOpen': BookOpen,
    'Dog': Dog,
    'Car': Car,
    'Sprout': Sprout,
    'CookingPot': CookingPot,
    'SprayCan': SprayCan,
    'Smartphone': Smartphone,
    'Computer': Computer,
    'Music': Music,
    'Luggage': Luggage,
    'Utensils': Utensils,
    'Castle': Castle,
    'Gift': Gift,
    'HeartPulse': HeartPulse,
};

export function getIcon(name: string): LucideIcon {
    return iconMap[name] || defaultIcon;
}
