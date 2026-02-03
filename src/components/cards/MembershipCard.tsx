import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Award } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type MembershipCardProps = {
  name: string;
  tier: "Gold" | "Platinum" | "Diamond";
  memberId: string;
};

export function MembershipCard({
  name,
  tier,
  memberId,
}: MembershipCardProps) {
  const tierColors = {
    Gold: "from-amber-400 to-yellow-500",
    Platinum: "from-slate-400 to-gray-500",
    Diamond: "from-sky-300 to-blue-500",
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `averzo-member:${memberId}`
  )}`;

  return (
    <Card
      className={cn(
        "relative w-full aspect-[1.586] max-w-lg mx-auto overflow-hidden text-white shadow-2xl bg-gradient-to-br",
        tierColors[tier]
      )}
    >
      <CardContent className="relative z-10 p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <Logo
            showText={true}
            iconClassName="text-white"
            textClassName="text-white"
          />
          <div className="text-right">
            <p className="font-semibold text-lg flex items-center gap-2">
              <Award className="w-5 h-5" />
              {tier} Member
            </p>
            <p className="text-xs opacity-80">Since 2024</p>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="font-mono">
            <p className="text-xs uppercase tracking-widest opacity-80">
              Card Holder
            </p>
            <p className="font-semibold text-lg tracking-wider">{name}</p>
            <p className="text-xs uppercase tracking-widest opacity-80 mt-2">
              Member ID
            </p>
            <p className="font-medium tracking-widest">{memberId}</p>
          </div>
          <div className="bg-white p-1.5 rounded-lg shadow-md">
            <Image
              src={qrCodeUrl}
              alt={`QR Code for member ${memberId}`}
              width={80}
              height={80}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
