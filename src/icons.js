const svg=(label,body)=>`<span class="instruction-icon" role="img" aria-label="${label}"><svg viewBox="0 0 160 52" aria-hidden="true" focusable="false">${body}</svg></span>`;
export const instructionIcons={
 start:()=>svg('Empieza por',`<circle cx="22" cy="26" r="12" fill="currentColor"/><circle cx="70" cy="26" r="12" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="118" cy="26" r="12" fill="none" stroke="currentColor" stroke-width="4"/>`),
 contains:()=>svg('Contiene',`<circle cx="28" cy="26" r="12" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="72" cy="26" r="12" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="116" cy="26" r="12" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="25" cy="22" r="18" fill="none" stroke="currentColor" stroke-width="5"/><path d="M38 36 51 48" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>`),
 shared:()=>svg('Comparten',`<circle cx="62" cy="26" r="18" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="98" cy="26" r="18" fill="none" stroke="currentColor" stroke-width="5"/><path d="M80 12a18 18 0 0 0 0 28 18 18 0 0 0 0-28Z" fill="currentColor" opacity=".35"/>`)
};

