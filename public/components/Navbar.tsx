import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { CircleUserRound } from 'lucide-react';

interface HeaderProps {
    onLoginClick: () => void;
}

export default function Navbar({ onLoginClick }: HeaderProps) {
    return (
        <div className="w-full bg-[#C3DD90]">
            <div className="flex items-center justify-between w-screen h-16 px-6">
                <div className="flex items-center gap-2">
                    <img src="/logo.svg" alt="Logo" className="h-10 w-10 border-2 border-[#393D3F] rounded-lg p-1 bg-[#393D3F] transition-transform hover:rotate-12" />
                    <span className="text-black">peerpear</span>
                </div>
                <NavigationMenu>
                    <NavigationMenuList className="flex gap-6">
                        {/* <NavigationMenuItem className="bg-[#C3DD90]">
                            <NavigationMenuTrigger className="bg-[#C3DD90]">Dashboard</NavigationMenuTrigger>
                            <NavigationMenuContent className="bg-[#C3DD90]">
                                <div className="p-4 w-[200px]">
                                    <NavigationMenuLink className="block p-2 rounded">
                                        Idk 1
                                    </NavigationMenuLink>
                                    <NavigationMenuLink className="block p-2 rounded">
                                        Idk 2
                                    </NavigationMenuLink>
                                </div>
                            </NavigationMenuContent>
                        </NavigationMenuItem>

                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="bg-[#C3DD90] hover:bg-[#95d28f] data-[state=open]:bg-[#C3DD90] data-[active]:bg-[#C3DD90]">Profile</NavigationMenuTrigger>
                            <NavigationMenuContent className="bg-[#C3DD90]">
                                <div className="p-4 w-[200px]">
                                    <NavigationMenuLink className="block p-2 rounded">
                                        Idk 1
                                    </NavigationMenuLink>
                                    <NavigationMenuLink className="block p-2 rounded">
                                        Idk 2
                                    </NavigationMenuLink>
                                </div>
                            </NavigationMenuContent>
                        </NavigationMenuItem> */}
                    </NavigationMenuList>
                </NavigationMenu>
                <button onClick={onLoginClick} className="px-4 py-2 rounded hover:bg-opacity-90 transition-colors flex items-center gap-2">

                    login
                    <CircleUserRound size={20} />
                </button>
            </div>
        </div>
    )
}