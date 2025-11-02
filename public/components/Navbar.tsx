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
import { CircleUserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavbarProps {
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  userType?: "student" | "organization" | "guest";
}

export default function Navbar({
  onLoginClick,
  userType: propUserType,
}: NavbarProps) {
  const { isAuthenticated, logout, user } = useAuth();

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

  return (
    <div className="w-full bg-[#C3DD90]">
      <div className="flex items-center justify-between w-screen h-16 px-6">
        <div className="flex items-center gap-2">
          <img
            src="/logo.svg"
            alt="Logo"
            className="h-10 w-10 border-2 border-[#393D3F] rounded-lg p-1 bg-[#393D3F] transition-transform hover:rotate-12"
          />
          <span className="text-black">peerpear</span>
        </div>

        <NavigationMenu>
          {userType !== "guest" ? (
            <NavigationMenuList className="flex gap-6">
              {userType === "student" ? (
                <NavigationMenuItem className="bg-[#C3DD90]">
                  <NavigationMenuLink
                    asChild
                    className={"!bg-[#C3DD90] " + navigationMenuTriggerStyle()}
                  >
                    <Link href="/student/myevents">My Events</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : (
                <></>
              )}
              <NavigationMenuItem className="bg-[#C3DD90]">
                <NavigationMenuLink
                  asChild
                  className={"!bg-[#C3DD90] " + navigationMenuTriggerStyle()}
                >
                  <Link href={`/${userType}`}>Dashboard</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={
                    "!bg-[#C3DD90] hover:!bg-[#6f7e51]" +
                    navigationMenuTriggerStyle()
                  }
                >
                  <Link href={`/${userType}/profile`}>Profile</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          ) : (
            <></>
          )}
        </NavigationMenu>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <p className="text-black font-medium">
              {user?.user_info.attributes?.displayname
                ? user.user_info.attributes.displayname.toString().toLowerCase()
                : ""}
            </p>
          )}
          {userType === "guest" ? (
            <button
              onClick={onLoginClick}
              className="px-4 py-2 rounded hover:bg-opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
            >
              log in
              <CircleUserRound size={20} />
            </button>
          ) : (
            <button
              onClick={logout}
              className="px-4 py-2 rounded hover:bg-opacity-90 transition-colors flex items-center gap-2 cursor-pointer"
            >
              log out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
