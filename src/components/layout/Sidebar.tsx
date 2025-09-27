import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  Brain, 
  Shield, 
  Users,
  PlusCircle,
  Hospital,
  Calendar,
  CreditCard,
  FlaskConical,
  User,
  Settings
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  roles: ('patient' | 'doctor')[];
  badge?: string;
}

const patientNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard', roles: ['patient'] },
  { label: 'Health Records', icon: FileText, href: '/records', roles: ['patient'] },
  { label: 'AI Insights', icon: Brain, href: '/ai-insights', roles: ['patient'] },
  { label: 'Consent Management', icon: Shield, href: '/consents', roles: ['patient'] },
  { label: 'Share Data', icon: Hospital, href: '/share-data', roles: ['patient'] },
  { label: 'Profile', icon: User, href: '/profile', roles: ['patient'] },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['patient'] },
];

const doctorNavItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, href: '/doctor/dashboard', roles: ['doctor'] },
  { label: 'My Patients', icon: Users, href: '/doctor/patients', roles: ['doctor'] },
  { label: 'Add Patient', icon: PlusCircle, href: '/doctor/add-patient', roles: ['doctor'] },
  { label: 'Consent Requests', icon: Shield, href: '/doctor/consents', roles: ['doctor'] },
];

const comingSoonItems: NavItem[] = [
  { label: 'Medical Tourism', icon: Calendar, href: '#', roles: ['patient', 'doctor'], badge: 'Soon' },
  { label: 'Clinical Research', icon: FlaskConical, href: '#', roles: ['patient', 'doctor'], badge: 'Soon' },
  { label: 'Finance Partners', icon: CreditCard, href: '#', roles: ['patient', 'doctor'], badge: 'Soon' },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = user?.role === 'doctor' ? doctorNavItems : patientNavItems;

  const handleNavigation = (href: string) => {
    if (href !== '#') {
      navigate(href);
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-[calc(100vh-4rem)] overflow-y-auto" role="navigation" aria-label="Sidebar Navigation">
      <div className="p-4 space-y-6">
        {/* Main Navigation */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Main Menu
          </h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => handleNavigation(item.href)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto text-xs bg-warning text-warning-foreground px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Coming Soon Section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Coming Soon
          </h2>
          <nav className="space-y-1">
            {comingSoonItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-10 opacity-60 cursor-not-allowed"
                  disabled
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto text-xs bg-warning text-warning-foreground px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* ABDM Compliance */}
        <div className="bg-accent-light p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-accent mb-2">ABDM Compliant</h3>
          <p className="text-xs text-muted-foreground">
            This platform follows Ayushman Bharat Digital Mission guidelines for secure health data management.
          </p>
        </div>
      </div>
    </aside>
  );
};