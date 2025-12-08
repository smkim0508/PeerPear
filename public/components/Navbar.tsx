import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUserRound, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavbarProps {
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  userType?: "student" | "organization" | "guest";
  organizationId?: number;
}

interface OrganizationInfo {
  id: number;
  name: string;
  image?: string;
}

export default function Navbar({
  onLoginClick,
  userType: propUserType,
  organizationId: propOrganizationId,
}: NavbarProps) {
  const { isAuthenticated, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [currentOrganization, setCurrentOrganization] =
    useState<OrganizationInfo | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<
    OrganizationInfo[]
  >([]);
  const [loadingOrgInfo, setLoadingOrgInfo] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine user type from auth context or localStorage or prop
  const getUserType = (): "student" | "organization" | "guest" => {
    if (propUserType) return propUserType;
    if (!isAuthenticated) return "guest";

    // Check localStorage for user type preference
    const storedUserType = localStorage.getItem("userType") as
      | "student"
      | "organization"
      | null;
    return storedUserType || "student"; // Default to student if not specified
  };

  const userType = getUserType();

  // Check if we're on an organization slug page
  const getOrganizationId = (): number | null => {
    if (propOrganizationId) return propOrganizationId;
    const match = pathname.match(/^\/organization\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const organizationId = getOrganizationId();
  const isOnOrganizationPage = organizationId !== null;

  useEffect(() => {
    const fetchUserOrganizations = async () => {
      try {
        setLoadingOrgInfo(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const response = await fetch(`${apiUrl}/organization/myorganizations`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.organizations) {
            const formattedOrgs = data.organizations.map((o: any) => ({
              id: o.id,
              name: o.org_name,
              image: "/logo.svg",
            }));
            setUserOrganizations(formattedOrgs);
          }
        }
      } catch (error) {
        console.error("Error fetching organization info:", error);
      } finally {
        setLoadingOrgInfo(false);
      }
    };

    if (isAuthenticated && userType === "organization") {
      fetchUserOrganizations();
    }
  }, [isAuthenticated, userType]);

  useEffect(() => {
    if (organizationId && userOrganizations.length > 0) {
      const org = userOrganizations.find((o) => o.id === organizationId);
      setCurrentOrganization(org || null);
    } else {
      setCurrentOrganization(null);
    }
  }, [organizationId, userOrganizations]);

  useEffect(() => {
    const checkOwnerAccess = async () => {
      if (!organizationId || userType !== "organization") {
        setIsOwner(false);
        return;
      }

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const response = await fetch(
          `${apiUrl}/organization/validate-owner/${organizationId}`,
          { credentials: "include" }
        );
        setIsOwner(response.ok);
      } catch (error) {
        console.error("Error checking owner access:", error);
        setIsOwner(false);
      }
    };

    checkOwnerAccess();
  }, [organizationId, userType]);

  // Get the correct dashboard URL based on context
  const getDashboardUrl = (): string => {
    if (userType === "organization") {
      if (organizationId) return `/organization/${organizationId}`;
      if (userOrganizations.length > 0)
        return `/organization/${userOrganizations[0].id}`;
      return "/organization";
    }
    return `/${userType}`;
  };

  const getProfileUrl = (): string => {
    if (userType === "organization") {
      if (organizationId) return `/organization/${organizationId}/profile`;
      if (userOrganizations.length > 0)
        return `/organization/${userOrganizations[0].id}/profile`;
      return "/organization";
    }
    return `/${userType}/profile`;
  };

  const isActiveTab = (path: string): boolean => {
    if (path === "dashboard") {
      if (userType === "organization" && organizationId) {
        return pathname === `/organization/${organizationId}`;
      }
      return pathname === `/${userType}`;
    }
    return pathname === path;
  };

  const navItems = () => {
    const items: { label: string; href: string; active: boolean }[] = [];

    if (userType === "student") {
      items.push({
        label: "My Programs",
        href: "/student/events",
        active: isActiveTab("/student/events"),
      });
    }

    items.push({
      label: "Dashboard",
      href: getDashboardUrl(),
      active: isActiveTab("dashboard"),
    });

    items.push({
      label: "Profile",
      href: getProfileUrl(),
      active: isActiveTab(getProfileUrl()),
    });

    if (isOwner) {
      const adminHref = `/organization/${organizationId}/admin`;
      items.push({
        label: "Admin",
        href: adminHref,
        active: isActiveTab(adminHref),
      });
    }

    return items;
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const getHomeLink = (): string => {
    if (!isAuthenticated) return "/";
    return getDashboardUrl();
  };

  return (
    <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="relative flex items-center justify-between w-full h-16 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 z-10">
          <Link href={getHomeLink()} className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-10 w-10 rounded-lg p-1 bg-nav-dark text-white transition-transform hover:rotate-12"
            />
            <span className="text-nav-dark font-semibold">PeerPear</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 justify-center">
          {userType !== "guest" && (
            <NavigationMenu>
              <NavigationMenuList className="flex gap-6">
                {navItems().map((item) => (
                  <NavigationMenuItem key={item.href} className="relative">
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link href={item.href} className="relative">
                        {item.label}
                        {item.active && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 justify-end whitespace-nowrap z-10">
          {isAuthenticated && (
            <>
              {isOnOrganizationPage &&
                currentOrganization &&
                userType === "organization" ? (
                /* Organization Dropdown */
                <div className="hidden sm:block">
                  <NavigationMenu>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent max-w-[220px]">
                          <div className="flex items-center gap-2 text-black font-medium whitespace-nowrap overflow-hidden">
                            <img
                              src={currentOrganization.image}
                              alt={`${currentOrganization.name} logo`}
                              className="w-7 h-7 shrink-0 rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=40&h=40&fit=crop&crop=center";
                              }}
                            />
                            <span className="truncate">
                              {currentOrganization.name}
                            </span>
                          </div>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[230px] gap-2 p-2 bg-white rounded-md shadow-md">
                            {userOrganizations.map((org) => (
                              <li key={org.id}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={`/organization/${org.id}`}
                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors w-full min-w-0"
                                  >
                                    <img
                                      src={org.image || "/logo.svg"}
                                      alt={`${org.name} logo`}
                                      className="w-5 h-5 rounded-full shrink-0"
                                      onError={(e) => {
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.src =
                                          "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=40&h=40&fit=crop&crop=center";
                                      }}
                                    />
                                    <span className="text-sm font-medium text-black truncate min-w-0">
                                      {org.name}
                                    </span>
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                          <ul className="grid w-[230px] gap-2 mt-3 bg-primary rounded-md shadow-md hover:scale-103 hover:shadow-lg transition duration:300">
                            <NavigationMenuLink asChild>
                              <Link
                                href={`/organization/`}
                                className="flex items-center gap-2 p-2 rounded-md transition-all hover:bg-primary/90"
                              >
                                <span className="text-sm font-medium text-white truncate">
                                  Manage All Organizations
                                </span>
                              </Link>
                            </NavigationMenuLink>
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                </div>
              ) : loadingOrgInfo && isOnOrganizationPage ? (
                /* Loading state when fetching organization info */
                <div className="hidden sm:flex items-center gap-2 text-nav-dark font-medium whitespace-nowrap">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                  <span className="text-gray-500">Loading...</span>
                </div>
              ) : (
                /* Default user info */
                <p className="hidden sm:block text-nav-dark font-medium max-w-[180px] truncate">
                  {user?.user_info.attributes?.displayname
                    ? `${user.user_info.attributes.displayname.toString()}`
                    : ""}
                </p>
              )}
            </>
          )}

          {userType === "guest" ? (
            <div className="hidden sm:flex items-center gap-4">
              <Link
                href="/about"
                className="text-nav-dark font-medium hover:underline"
              >
                About Us
              </Link>
              <button
                onClick={onLoginClick}
                className="px-4 py-2.5 rounded-lg bg-nav-dark text-white font-medium hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                Log in
                <CircleUserRound size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="hidden sm:flex ml-2 px-4 py-2.5 rounded-lg bg-nav-dark text-white font-medium hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg items-center gap-2 cursor-pointer whitespace-nowrap text-sm"
            >
              Log out
              <LogOut size={16} />
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="sm:hidden inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-nav-dark hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 border-t border-gray-100 ${
          isMobileMenuOpen ? "max-h-[600px]" : "max-h-0"
        }`}
      >
        <div className="px-4 py-4 space-y-4 bg-white shadow-sm">
          {isAuthenticated ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-nav-dark font-semibold">
                  {(user?.user_info.attributes?.displayname || "U").toString().charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-nav-dark truncate">
                    {user?.user_info.attributes?.displayname || ""}
                  </p>
                  {isOnOrganizationPage && currentOrganization && (
                    <p className="text-xs text-gray-600 truncate">
                      {currentOrganization.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md bg-nav-dark text-white text-sm font-medium hover:bg-opacity-90"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Link
                href="/about"
                className="text-nav-dark font-medium hover:underline"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <button
                onClick={onLoginClick}
                className="px-4 py-2 rounded-md bg-nav-dark text-white text-sm font-semibold hover:bg-opacity-90"
              >
                Log in
              </button>
            </div>
          )}

          {userType !== "guest" && (
            <div className="space-y-2">
              {navItems().map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    item.active
                      ? "bg-green text-white"
                      : "text-nav-dark hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {userType === "organization" && userOrganizations.length > 0 && (
                <div className="pt-2 space-y-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                    Organizations
                  </p>
                  {userOrganizations.map((org) => (
                    <Link
                      key={org.id}
                      href={`/organization/${org.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-sm font-medium text-nav-dark"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <img
                        src={org.image || "/logo.svg"}
                        alt={`${org.name} logo`}
                        className="w-6 h-6 rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=40&h=40&fit=crop&crop=center";
                        }}
                      />
                      <span className="truncate">{org.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
