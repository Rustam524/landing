import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-brand-ink px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/brand/logo.png"
            alt="ALGORITM"
            width={72}
            height={72}
            className="rounded-full"
            priority
          />
        </div>
        <div className="rounded-2xl bg-brand-surface p-6 shadow-xl">{children}</div>
      </div>
    </div>
  );
}
