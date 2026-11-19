/** The whole architecture in one picture: iPhone to Twilio, with nothing of ours between them. */
export function DirectDiagram() {
  return (
    <figure>
      <div className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-0 sm:grid-cols-[minmax(0,1fr)_minmax(5rem,0.8fr)_minmax(0,1fr)]">
        <div className="rounded-md bg-surface p-5 shadow-[inset_0_0_0_1px_var(--line)]">
          <p className="display-3">Your iPhone</p>
          <p className="mt-1 text-[0.9375rem] leading-snug text-ink-soft">Dialbubble, with your credentials in the Keychain</p>
        </div>
        <div aria-hidden="true" className="flex items-center justify-center sm:flex-col">
          <div className="h-8 w-1 rounded-full bg-mint-fill sm:h-1 sm:w-full" />
        </div>
        <div className="rounded-md bg-surface p-5 shadow-[inset_0_0_0_1px_var(--line)]">
          <p className="display-3">Twilio</p>
          <p className="mt-1 text-[0.9375rem] leading-snug text-ink-soft">Your account, your numbers, your bill</p>
        </div>
      </div>
      <figcaption className="mt-4 text-[0.9375rem] text-ink-soft">
        Requests travel straight from your iPhone to Twilio over TLS. There is no Dialbubble server to pass through, because there is no Dialbubble server.
      </figcaption>
    </figure>
  );
}
