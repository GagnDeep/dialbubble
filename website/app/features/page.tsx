import Link from "next/link";
import { Container } from "@/components/Container";
import { CtaBand } from "@/components/CtaBand";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PageHero } from "@/components/PageHero";
import { PhoneFrame } from "@/components/PhoneFrame";
import { RelatedLinks } from "@/components/RelatedLinks";
import { featureGroups, honestLimits } from "@/content/features";
import { metaFor } from "@/lib/registry";

export const metadata = metaFor("/features");

export default function FeaturesPage() {
  return (
    <>
      <Breadcrumbs path="/features" />
      <PageHero
        title="What Dialbubble does"
        lede="Calls, texts, recordings, usage and more, all running on your own Twilio account. Everything here is free in the app, and you can try all of it in Demo Mode."
      />

      {featureGroups.map((group, index) => (
        <Container as="section" key={group.id} className="mt-14 grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
          <div id={group.id} className={`scroll-mt-24 ${index % 2 ? "md:order-2" : ""}`}>
            <h2 className="display-2">{group.title}</h2>
            <p className="lede mt-3 text-ink-soft">{group.summary}</p>
            <dl className="mt-6 border-t border-line">
              {group.items.map((item) => (
                <div key={item.name} className="border-b border-line py-4 sm:grid sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
                  <dt className="font-display font-semibold">{item.name}</dt>
                  <dd className="mt-1 text-ink-soft sm:mt-0">{item.text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className={`flex justify-center md:sticky md:top-24 ${index % 2 ? "md:order-1" : ""}`}>
            <PhoneFrame screen={group.screen} sizes="280px" className="w-[220px] sm:w-[260px] lg:w-[280px]" />
          </div>
        </Container>
      ))}

      <Container as="section" className="mt-24">
        <h2 className="display-2 max-w-[20ch]">What Dialbubble doesn&apos;t do</h2>
        <p className="lede mt-3 text-ink-soft">Having no server keeps Dialbubble free and private. It also means a few things you should know before you install it.</p>
        <dl className="mt-8 grid gap-x-12 gap-y-6 md:grid-cols-2">
          {honestLimits.map((limit) => (
            <div key={limit.name} className="border-t border-line pt-4">
              <dt className="display-3">{limit.name}</dt>
              <dd className="mt-1.5 text-ink-soft">{limit.text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8">
          <Link href="/how-it-works" className="link">
            See how it all fits together
          </Link>
        </p>
      </Container>

      <RelatedLinks path="/features" />
      <CtaBand />
    </>
  );
}
