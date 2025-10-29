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

interface NavbarProps {
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  userType: "student" | "organization" | "guest";
}

export default function Navbar({
  onLoginClick,
  onLogoutClick,
  userType,
}: NavbarProps) {
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
                    <Link href="/">My Events</Link>
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
                  <Link href="/profile">Profile</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          ) : (
            <></>
          )}
        </NavigationMenu>
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
            onClick={onLogoutClick}
            className="px-4 py-2 rounded hover:bg-opacity-90 transition-colors flex items-center gap-2"
          >
            logout
          </button>
        )}
      </div>
    </div>
  );
}
