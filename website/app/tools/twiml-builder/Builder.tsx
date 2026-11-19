"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { hashShareUrl, useHashValue } from "../_components/useQueryState";
import { CopyButton, Field, Notice, SmallButton, inputClass, textareaClass } from "../_components/ui";
import {
  INLINE_LIMIT,
  TEMPLATES,
  TOP_LEVEL_VERBS,
  VERBS,
  VOICE_SUGGESTIONS,
  echoTwimletUrl,
  makeNode,
  toInlineXml,
  toNodes,
  toPrettyXml,
  tokenizeXml,
  validateTwiml,
  type AttrSpec,
  type Issue,
  type TokenKind,
  type TwimlNode,
  type VerbName,
} from "../_lib/twiml";

const ECHO_PREFIX = "https://twimlets.com/echo?Twiml=";

function updateTree(nodes: TwimlNode[], id: number, fn: (node: TwimlNode) => TwimlNode): TwimlNode[] {
  return nodes.map((node) => (node.id === id ? fn(node) : { ...node, children: updateTree(node.children, id, fn) }));
}

function removeFromTree(nodes: TwimlNode[], id: number): TwimlNode[] {
  return nodes.filter((node) => node.id !== id).map((node) => ({ ...node, children: removeFromTree(node.children, id) }));
}

function moveInTree(nodes: TwimlNode[], id: number, direction: -1 | 1): TwimlNode[] {
  const index = nodes.findIndex((node) => node.id === id);
  if (index >= 0) {
    const target = index + direction;
    const moved = nodes[index];
    const other = nodes[target];
    if (!moved || !other) return nodes;
    const next = [...nodes];
    next[index] = other;
    next[target] = moved;
    return next;
  }
  return nodes.map((node) => ({ ...node, children: moveInTree(node.children, id, direction) }));
}

const initialTemplate = TEMPLATES[0];

export function Builder() {
  const sharedXml = useHashValue("t");
  const [edited, setEdited] = useState<TwimlNode[] | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [format, setFormat] = useState<"pretty" | "inline">("pretty");
  const [pasted, setPasted] = useState("");
  const [importNote, setImportNote] = useState<string | null>(null);

  const initial = useMemo(() => {
    const fromLink = sharedXml ? toNodes(sharedXml)?.nodes : null;
    return fromLink ?? initialTemplate?.build() ?? [];
  }, [sharedXml]);
  const nodes = edited ?? initial;
  const highlighted = activeTemplate ?? (edited || sharedXml ? null : initialTemplate?.id ?? null);

  const pretty = useMemo(() => toPrettyXml(nodes), [nodes]);
  const inline = useMemo(() => toInlineXml(nodes), [nodes]);
  const shown = format === "pretty" ? pretty : inline;
  const tokens = useMemo(() => tokenizeXml(shown), [shown]);
  const issues = useMemo(() => validateTwiml(pretty).filter((issue) => !/4,000 at most/.test(issue.message)), [pretty]);
  const over = inline.length > INLINE_LIMIT;
  const near = !over && inline.length > INLINE_LIMIT * 0.9;

  const deferredPaste = useDeferredValue(pasted);
  const pasteIssues = useMemo(() => (deferredPaste.trim() ? validateTwiml(deferredPaste) : null), [deferredPaste]);

  const change = (next: TwimlNode[]) => {
    setEdited(next);
    setActiveTemplate(null);
  };

  function loadPasted() {
    const result = toNodes(pasted);
    if (!result) {
      setImportNote("Couldn't load this, because it has no valid <Response> root. Fix the errors above first.");
      return;
    }
    change(result.nodes);
    setImportNote(
      result.skipped.length > 0
        ? `Loaded. The builder doesn't edit ${Array.from(new Set(result.skipped)).map((s) => `<${s}>`).join(", ")}, so ${result.skipped.length === 1 ? "that element was" : "those elements were"} left out.`
        : "Loaded into the builder.",
    );
  }

  return (
    <div className="space-y-8">
      <section aria-label="Templates">
        <h2 className="display-3">Start from a template</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATES.map((template) => (
            <SmallButton
              key={template.id}
              active={highlighted === template.id}
              ariaPressed={highlighted === template.id}
              onClick={() => {
                setEdited(template.build());
                setActiveTemplate(template.id);
              }}
            >
              {template.label}
            </SmallButton>
          ))}
        </div>
        <p className="mt-2 text-[0.9375rem] leading-snug text-ink-soft">{TEMPLATES.find((t) => t.id === highlighted)?.description ?? "Your own TwiML."}</p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-label="Builder" className="min-w-0">
          <h2 className="display-3">Your call flow</h2>
          <p className="mt-1 text-[0.9375rem] leading-snug text-ink-soft">Twilio runs these from top to bottom.</p>
          <datalist id="twiml-voices">
            {VOICE_SUGGESTIONS.map((voice) => (
              <option key={voice} value={voice} />
            ))}
          </datalist>
          <BlockList nodes={nodes} allNodes={nodes} onChange={change} />
          {nodes.length === 0 ? <Notice>Nothing yet. Add a verb below, and it appears in the output.</Notice> : null}
          <AddButtons verbs={TOP_LEVEL_VERBS} onAdd={(verb) => change([...nodes, makeNode(verb)])} label="Add a verb" />
        </section>

        <section aria-label="Output" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <figure className="overflow-hidden rounded-md bg-[#0e1416] text-[#eef3f3] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
            <figcaption className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 border-b border-white/10 pl-2 pr-1">
              <div role="group" aria-label="Output format" className="flex">
                {(["pretty", "inline"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormat(option)}
                    aria-pressed={format === option}
                    className={`min-h-11 cursor-pointer rounded-sm px-3 text-[0.9375rem] font-semibold ${format === option ? "text-white underline decoration-[#3edbc4] decoration-2 underline-offset-4" : "text-[#a5b3b7] hover:bg-white/10"}`}
                  >
                    {option === "pretty" ? "Readable" : "One line"}
                  </button>
                ))}
              </div>
              <CopyButton tone="dark" getText={() => shown} />
            </figcaption>
            <pre tabIndex={0} aria-label="Generated TwiML" className={`max-h-[34rem] overflow-auto p-4 font-mono text-[0.875rem] leading-relaxed ${format === "inline" ? "whitespace-pre-wrap break-all" : ""}`}>
              <code>
                {tokens.map((token, index) => (
                  <span key={index} style={{ color: TOKEN_COLOR[token.kind] }}>
                    {token.value}
                  </span>
                ))}
              </code>
            </pre>
          </figure>

          <p className={`mt-2 text-[0.9375rem] tabular-nums ${over ? "font-bold text-warn" : "text-ink-soft"}`} aria-live="polite">
            {inline.length.toLocaleString("en-US")} of {INLINE_LIMIT.toLocaleString("en-US")} characters as one line
          </p>
          {over ? <Notice tone="warn">This is too long for the Calls API&apos;s Twiml parameter, which takes 4,000 characters at most. Host it at a URL or in a TwiML Bin instead.</Notice> : null}
          {near ? <Notice tone="warn">Getting close to the 4,000-character limit for inline TwiML.</Notice> : null}

          <div className="mt-3 space-y-2">
            <IssueList issues={issues} ok="No problems found in this TwiML." />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton label="Copy link to this TwiML" copiedLabel="Link copied" getText={() => hashShareUrl("t", inline)} />
            <SmallButton onClick={() => change([])} disabled={nodes.length === 0}>
              Clear all
            </SmallButton>
          </div>
        </section>
      </div>

      <section aria-labelledby="twiml-validate-title" className="border-t border-line pt-6">
        <h2 id="twiml-validate-title" className="display-3">
          Check TwiML you already have
        </h2>
        <p className="mt-1 text-[0.9375rem] leading-snug text-ink-soft">Paste a document to find mistakes as you type. It&apos;s checked in this browser tab and goes nowhere.</p>
        <Field label="TwiML to check" className="mt-3">
          <textarea
            rows={7}
            value={pasted}
            onChange={(event) => {
              setPasted(event.target.value);
              setImportNote(null);
            }}
            spellCheck={false}
            placeholder={'<Response>\n  <Say>Hello</Say>\n</Response>'}
            className={`${textareaClass} font-mono text-[0.875rem]`}
          />
        </Field>
        {pasteIssues ? (
          <div className="mt-3 space-y-2">
            <IssueList issues={pasteIssues} ok="No problems found. It parses, and every verb and attribute this tool knows about is valid." />
            <div className="flex flex-wrap items-center gap-2">
              <SmallButton onClick={loadPasted}>Load into the builder</SmallButton>
              {importNote ? (
                <p role="status" className="text-[0.9375rem] leading-snug text-ink-soft">
                  {importNote}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

const TOKEN_COLOR: Record<TokenKind, string> = {
  punct: "#7f9196",
  tag: "#3edbc4",
  attr: "#9cc6ff",
  value: "#f2c97d",
  text: "#eef3f3",
  comment: "#7f9196",
};

const ISSUE_TONE = { error: "error", warning: "warn", info: "info" } as const;
const ISSUE_LABEL = { error: "Error", warning: "Warning", info: "Note" } as const;

function IssueList({ issues, ok }: { issues: Issue[]; ok: string }) {
  if (issues.length === 0) return <Notice tone="ok">{ok}</Notice>;
  return (
    <ul className="space-y-2">
      {issues.map((issue, index) => (
        <li key={index}>
          <Notice tone={ISSUE_TONE[issue.severity]}>
            <strong>
              {ISSUE_LABEL[issue.severity]}
              {issue.line ? `, line ${issue.line}` : ""}:
            </strong>{" "}
            {issue.message}
          </Notice>
        </li>
      ))}
    </ul>
  );
}

function AddButtons({ verbs, onAdd, label }: { verbs: readonly VerbName[]; onAdd: (verb: VerbName) => void; label: string }) {
  return (
    <div className="mt-3" role="group" aria-label={label}>
      <p className="mb-1.5 text-[0.9375rem] font-semibold">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {verbs.map((verb) => (
          <button key={verb} type="button" onClick={() => onAdd(verb)} className="min-h-11 cursor-pointer rounded-sm border border-line px-3 font-mono text-[0.9375rem] font-semibold hover:bg-sunken">
            {verb}
          </button>
        ))}
      </div>
    </div>
  );
}

function BlockList({ nodes, allNodes, onChange }: { nodes: TwimlNode[]; allNodes: TwimlNode[]; onChange: (next: TwimlNode[]) => void }) {
  return (
    <ol className="mt-3 space-y-3">
      {nodes.map((node, index) => (
        <li key={node.id}>
          <Block node={node} index={index} siblings={nodes.length} allNodes={allNodes} onChange={onChange} />
        </li>
      ))}
    </ol>
  );
}

function Block({ node, index, siblings, allNodes, onChange }: { node: TwimlNode; index: number; siblings: number; allNodes: TwimlNode[]; onChange: (next: TwimlNode[]) => void }) {
  const spec = VERBS[node.verb];
  const primary = spec.attrs.filter((a) => a.primary);
  const secondary = spec.attrs.filter((a) => !a.primary && !a.deprecated);
  const setSecondary = secondary.filter((a) => node.attrs[a.name] !== undefined).length;
  const showText = spec.text && !(node.verb === "Dial" && node.children.length > 0);

  const patch = (fn: (n: TwimlNode) => TwimlNode) => onChange(updateTree(allNodes, node.id, fn));
  const setAttr = (name: string, value: string) =>
    patch((n) => {
      const attrs = { ...n.attrs };
      if (value === "") delete attrs[name];
      else attrs[name] = value;
      return { ...n, attrs };
    });

  return (
    <div className="rounded-sm border border-line bg-canvas p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 pt-1.5">
          <span className="font-mono font-bold text-mint-text">{`<${node.verb}>`}</span>
          <span className="ml-2 text-[0.9375rem] leading-snug text-ink-soft">{spec.summary}</span>
        </div>
        <div className="flex flex-none">
          <IconButton label={`Move ${node.verb} up`} disabled={index === 0} onClick={() => onChange(moveInTree(allNodes, node.id, -1))} path="M12 19V5M6 11l6-6 6 6" />
          <IconButton label={`Move ${node.verb} down`} disabled={index === siblings - 1} onClick={() => onChange(moveInTree(allNodes, node.id, 1))} path="M12 5v14M6 13l6 6 6-6" />
          <IconButton label={`Remove ${node.verb}`} onClick={() => onChange(removeFromTree(allNodes, node.id))} path="M6 6l12 12M18 6L6 18" />
        </div>
      </div>

      {showText && spec.text ? (
        <Field label={spec.text.label} className="mt-2">
          {spec.text.multiline ? (
            <textarea rows={2} value={node.text} placeholder={spec.text.placeholder} onChange={(event) => patch((n) => ({ ...n, text: event.target.value }))} className={textareaClass} />
          ) : (
            <input type="text" value={node.text} placeholder={spec.text.placeholder} spellCheck={false} onChange={(event) => patch((n) => ({ ...n, text: event.target.value }))} className={inputClass} />
          )}
        </Field>
      ) : null}

      {primary.length > 0 ? (
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {primary.map((attr) => (
            <AttrField key={attr.name} attr={attr} value={node.attrs[attr.name] ?? ""} onChange={(value) => setAttr(attr.name, value)} />
          ))}
        </div>
      ) : null}

      {node.attrs.action?.startsWith(ECHO_PREFIX) ? <EchoEditor action={node.attrs.action} onChange={(value) => setAttr("action", value)} /> : null}

      {secondary.length > 0 ? (
        <details className="mt-2">
          <summary className="flex min-h-11 items-center gap-2 font-semibold text-mint-text">
            More options{setSecondary > 0 ? ` (${setSecondary} set)` : ""}
            <svg viewBox="0 0 24 24" className="chevron size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>
          <div className="mt-1 grid gap-3 sm:grid-cols-2">
            {secondary.map((attr) => (
              <AttrField key={attr.name} attr={attr} value={node.attrs[attr.name] ?? ""} onChange={(value) => setAttr(attr.name, value)} />
            ))}
          </div>
        </details>
      ) : null}

      {spec.children ? (
        <div className="mt-3 border-l-2 border-line pl-3">
          <BlockList nodes={node.children} allNodes={allNodes} onChange={onChange} />
          <AddButtons
            verbs={spec.children}
            label={`Add inside ${node.verb}`}
            onAdd={(verb) => patch((n) => ({ ...n, children: [...n.children, makeNode(verb)] }))}
          />
        </div>
      ) : null}
    </div>
  );
}

function AttrField({ attr, value, onChange }: { attr: AttrSpec; value: string; onChange: (value: string) => void }) {
  const isList = (attr.kind === "enum" || attr.kind === "bool") && attr.values;
  return (
    <Field label={<code className="font-mono text-[0.875rem] font-semibold">{attr.name}</code>} hint={attr.help}>
      {isList ? (
        <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Twilio default</option>
          {attr.values?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={value}
          placeholder={attr.placeholder}
          inputMode={attr.kind === "int" ? "numeric" : undefined}
          spellCheck={false}
          list={attr.name === "voice" ? "twiml-voices" : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
        />
      )}
    </Field>
  );
}

function EchoEditor({ action, onChange }: { action: string; onChange: (value: string) => void }) {
  let decoded = "";
  try {
    decoded = decodeURIComponent(action.slice(ECHO_PREFIX.length));
  } catch {
    decoded = "";
  }
  const issues = validateTwiml(decoded).filter((issue) => issue.severity === "error");
  return (
    <div className="mt-3 rounded-sm bg-sunken p-3">
      <Field label="TwiML this Echo Twimlet URL returns" hint="Edit the readable version here, and the encoded action updates. Put your own numbers in callerId and Number.">
        <textarea rows={5} value={decoded} spellCheck={false} onChange={(event) => onChange(echoTwimletUrl(event.target.value))} className={`${textareaClass} font-mono text-[0.875rem]`} />
      </Field>
      {issues.length > 0 ? <div className="mt-2 space-y-2"><IssueList issues={issues} ok="" /></div> : null}
    </div>
  );
}

function IconButton({ label, onClick, path, disabled = false }: { label: string; onClick: () => void; path: string; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="grid size-11 cursor-pointer place-items-center rounded-sm text-ink-soft hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-35">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </button>
  );
}
