import { SectionHub } from "@/components/SectionHub";
import { metaFor } from "@/lib/registry";

export const metadata = metaFor("/guides");

export default function GuidesHub() {
  return (
    <SectionHub
      section="guides"
      lede="Twilio accounts, numbers, texting rules and costs, explained step by step in plain English."
      empty="The first guides are on their way. The how-it-works page covers setting up Dialbubble with your Twilio account."
    />
  );
}
