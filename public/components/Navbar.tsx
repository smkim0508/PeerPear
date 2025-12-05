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
import { CircleUserRound, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface NavbarProps {
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  userType?: "student" | "organization" | "guest";
}

interface OrganizationInfo {
  id: number;
  name: string;
  image?: string;
}

export default function Navbar({
  onLoginClick,
  userType: propUserType,
}: NavbarProps) {
  const { isAuthenticated, logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationInfo | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<OrganizationInfo[]>([]);
  const [loadingOrgInfo, setLoadingOrgInfo] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

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
    const match = pathname.match(/^\/organization\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const organizationId = getOrganizationId();
  const isOnOrganizationPage = organizationId !== null;

  useEffect(() => {
    const fetchOrganizationInfo = async (orgId: number) => {
      try {
        setLoadingOrgInfo(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const response = await fetch(`${apiUrl}/organization/myorganizations`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.organizations) {
            const formattedOrgs = data.organizations.map((o: any) => ({
              id: o.id,
              name: o.org_name,
              image: "/logo.svg"
            }));
            setUserOrganizations(formattedOrgs);

            const org = formattedOrgs.find((o: OrganizationInfo) => o.id === orgId);
            if (org) {
              setCurrentOrganization(org);
            } else {
              setCurrentOrganization(null);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching organization info:", error);
        setCurrentOrganization(null);
      } finally {
        setLoadingOrgInfo(false);
      }
    };

    if (organizationId && isAuthenticated && userType === "organization") {
      fetchOrganizationInfo(organizationId);
    } else {
      setCurrentOrganization(null);
    }
  }, [organizationId, isAuthenticated, userType]);

  useEffect(() => {
    const checkOwnerAccess = async () => {
      if (!organizationId || userType !== "organization") {
        setIsOwner(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
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
    if (userType === "organization" && organizationId) {
      return `/organization/${organizationId}`;
    }
    return `/${userType}`;
  };

  const getProfileUrl = (): string => {
    if (userType === "organization" && organizationId) {
      return `/organization/${organizationId}/profile`;
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

  return (
    <div className="w-full bg-[#C3DD90]">
      <div className="flex items-center w-full h-16 px-6">
        {/* Logo - Fixed width */}
        <div className="flex items-center gap-2 w-48">
          <Link href="/">
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-10 w-10 border-2 border-[#393D3F] rounded-lg p-1 bg-[#393D3F] transition-transform hover:rotate-12"
            />
          </Link>
          <span className="text-black"><Link href="/">PeerPear</Link></span>
        </div>

        {/* Navigation - Centered */}
        <div className="flex-1 flex justify-center">
          <NavigationMenu>
            {userType !== "guest" ? (
              <NavigationMenuList className="flex gap-6">
                {userType === "student" ? (
                  <NavigationMenuItem className="bg-[#C3DD90] relative">
                    <NavigationMenuLink
                      asChild
                      className={"bg-[#C3DD90]! " + navigationMenuTriggerStyle()}
                    >
                      <Link href="/student/events" className="relative">
                        My Programs
                        {isActiveTab("/student/events") && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#393D3F]"></div>
                        )}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ) : (
                  <></>
                )}
                <NavigationMenuItem className="bg-[#C3DD90] relative">
                  <NavigationMenuLink
                    asChild
                    className={"bg-[#C3DD90]! " + navigationMenuTriggerStyle()}
                  >
                    <Link href={getDashboardUrl()} className="relative">
                      Dashboard
                      {isActiveTab("dashboard") && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#393D3F]"></div>
                      )}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem className="bg-[#C3DD90] relative">
                  <NavigationMenuLink
                    asChild
                    className={"bg-[#C3DD90]! " + navigationMenuTriggerStyle()}
                  >
                    <Link href={getProfileUrl()} className="relative">
                      Profile
                      {isActiveTab(getProfileUrl()) && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#393D3F]"></div>
                      )}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

                {isOwner && (
                  <NavigationMenuItem className="bg-[#C3DD90] relative">
                    <NavigationMenuLink
                      asChild
                      className={"bg-[#C3DD90]! " + navigationMenuTriggerStyle()}
                    >
                      <Link href={`/organization/${organizationId}/admin`} className="relative">
                        Admin
                        {isActiveTab(`/organization/${organizationId}/admin`) && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#393D3F]"></div>
                        )}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            ) : (
              <></>
            )}
          </NavigationMenu>
        </div>

        {/* User info and logout - Flexible width, no wrapping */}
        <div className="flex items-center gap-3 justify-end whitespace-nowrap">
          {isAuthenticated && (
            <>
              {isOnOrganizationPage && currentOrganization && userType === "organization" ? (
                /* Organization Dropdown */
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent">
                        <div className="flex items-center gap-2 text-black font-medium whitespace-nowrap">
                          <img
                            src={currentOrganization.image}
                            alt={`${currentOrganization.name} logo`}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=40&h=40&fit=crop&crop=center";
                            }}
                          />
                          <span>{currentOrganization.name}</span>
                        </div>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[200px] gap-2 p-2 bg-white rounded-md shadow-md">
                          {userOrganizations.map((org) => (
                            <li key={org.id}>
                              <NavigationMenuLink asChild>
                                <Link
                                  href={`/organization/${org.id}`}
                                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                  <img
                                    src={org.image || "/logo.svg"}
                                    alt={`${org.name} logo`}
                                    className="w-6 h-6 rounded-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=40&h=40&fit=crop&crop=center";
                                    }}
                                  />
                                  <span className="text-sm font-medium text-black truncate">
                                    {org.name}
                                  </span>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              ) : loadingOrgInfo && isOnOrganizationPage ? (
                /* Loading state when fetching organization info */
                <div className="flex items-center gap-2 text-black font-medium whitespace-nowrap">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                  <span className="text-gray-500">Loading...</span>
                </div>
              ) : (
                /* Default user info */
                <p className="text-black font-medium whitespace-nowrap">
                  {user?.user_info.attributes?.displayname
                    ? `${user.user_info.attributes.displayname.toString()}`
                    : ""}
                </p>
              )}
            </>
          )}
          {userType === "guest" ? (
            <div className="flex items-center gap-4">
              <Link href="/about" className="text-black font-medium hover:underline">
                About Us
              </Link>
              <button
                onClick={onLoginClick}
                className="px-5 py-2.5 rounded-lg bg-[#393D3F] text-white font-medium hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap transform hover:-translate-y-0.5"
              >
                Log In
                <CircleUserRound size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="px-4 py-2 rounded hover:bg-opacity-90 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              Log Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
