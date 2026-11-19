import { SectionHub } from "@/components/SectionHub";
import { metaFor } from "@/lib/registry";

export const metadata = metaFor("/tools");

export default function ToolsHub() {
  return (
    <SectionHub
      section="tools"
      lede="Calculators and helpers for working with Twilio. They run in your browser, with no sign-up and no Twilio account needed."
      empty="The first tools are on their way. In the meantime, the Dialbubble app includes number lookup and a live view of your Twilio usage."
    />
  );
}
