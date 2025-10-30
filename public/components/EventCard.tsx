import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import Image from "next/image"
import PearButton from "./PearButton"

export default function EventCard() {
    return (
        <Card className="flex bg-[#C3DD90] hover:bg-[#B5D07E] m-4">
            <CardTitle className="pl-4">My Event | ASA</CardTitle>
            <CardDescription className="pl-4">This is a sample description of my event.</CardDescription>
            <CardContent className="flex items-center">
                <Image className="rounded-sm" src="/event_image.png" alt="Event Card" width={300} height={200} />
            </CardContent>
            <CardFooter className="gap-4">
                <p>Time to event: 12:00 </p>
                <PearButton text="Information"></PearButton>

            </CardFooter>
        </Card>
    )
}