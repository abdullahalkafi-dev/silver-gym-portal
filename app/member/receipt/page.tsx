"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowLeftIcon, DownloadIcon, PrimaryButton, SecondaryButton, Spinner } from "@/components/ui";
import { session } from "@/lib/api";
import { buildReceiptHtml, loadReceipt, receiptTitle } from "@/lib/receipt";
import type { MemberMe, Payment } from "@/lib/types";

export default function ReceiptPage() {
  const router = useRouter();
  const frame = useRef<HTMLIFrameElement>(null);
  const [data, setData] = useState<{ payment: Payment; me: MemberMe } | null>(null);
  const [height, setHeight] = useState(900);

  useEffect(() => {
    const stored = session.get();
    const receipt = loadReceipt();
    if (!stored || stored.kind !== "member" || !receipt) {
      router.replace("/member");
      return;
    }
    setData(receipt);
    document.title = receiptTitle(receipt.payment);
  }, [router]);

  const html = useMemo(() => (data ? buildReceiptHtml(data.payment, data.me) : ""), [data]);

  // Make the frame as tall as the receipt so the page scrolls once, like a normal page.
  // (Measure the body, not the document: the document is never shorter than the frame itself.)
  const fit = () => {
    const doc = frame.current?.contentDocument;
    if (doc) setHeight(Math.ceil(doc.body.getBoundingClientRect().height) + 4);
  };

  const print = () => frame.current?.contentWindow?.print();

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-primary">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <main className="min-h-dvh pb-10">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
          <SecondaryButton size="sm" onClick={() => router.push("/member")}>
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={print}>
            <DownloadIcon className="h-4 w-4" />
            Download / Print
          </PrimaryButton>
        </div>
      </header>

      <div className="mx-auto mt-4 max-w-3xl px-3">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <iframe
            ref={frame}
            title={receiptTitle(data.payment)}
            srcDoc={html}
            onLoad={fit}
            style={{ height }}
            className="block w-full border-0"
          />
        </div>
        <p className="mt-3 px-1 text-center text-xs text-muted">
          Tap &ldquo;Download / Print&rdquo; and choose &ldquo;Save as PDF&rdquo; to keep a copy.
        </p>
      </div>
    </main>
  );
}
