/* ============================================================
   Outlook — the new Outlook for Mac, not the 2016 one.

   Registered as a plugin, so it replaces the built-in `outlookApp`
   in hiw.js without that file having to know. The case study argues
   that brokers live in Outlook, so this is the one window on the
   desktop a reader will recognise instantly if it is right and
   distrust the whole conceit for if it is wrong.

   Three things drive the layout, all taken from the real client:
   a command bar of icon-and-label buttons under a tab row; the
   Focused / Other pivot sitting above the message list; and a
   three-line message row with the date right-aligned against the
   sender. The middle column is deliberately airy — a mail list that
   crams three lines into 40px reads as a spreadsheet, not as mail.
   ============================================================ */
(() => {
  'use strict';
  if (!self.HowIWork) return;

  const { el, svg, ICONS } = self.HowIWork.ui;

  /* Line icons at the Fluent weight. No width/height on the root so
     the stylesheet sizes them per context — a folder row and a command
     button want different sizes from the same path. */
  const g = (body, vb) =>
    svg(vb || '0 0 20 20', body,
      'stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"');

  const IC = {
    newmail: g('<path d="M17.4 9.6V5.7a1.7 1.7 0 0 0-1.7-1.7H4.3a1.7 1.7 0 0 0-1.7 1.7v8.6a1.7 1.7 0 0 0 1.7 1.7h5"/><path d="m2.9 5.6 6.2 4.3a1.6 1.6 0 0 0 1.8 0l6.2-4.3"/><path d="m13 17 4.1-4.1 1.4 1.4-4.1 4.1-2 .6z"/>'),
    trash: g('<path d="M4.4 6.1h11.2M8 6.1V4.8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.3"/><path d="M5.9 6.1h8.2l-.7 9.4a1.4 1.4 0 0 1-1.4 1.3H8a1.4 1.4 0 0 1-1.4-1.3z"/>'),
    archive: g('<rect x="2.9" y="3.6" width="14.2" height="3.5" rx="1.1"/><path d="M4.3 7.1h11.4v7.7a1.6 1.6 0 0 1-1.6 1.6H5.9a1.6 1.6 0 0 1-1.6-1.6z"/><path d="M8.2 10.4h3.6"/>'),
    move: g('<path d="M2.8 5.5A1.4 1.4 0 0 1 4.2 4.1h2.9l1.5 1.8h6.2a1.4 1.4 0 0 1 1.4 1.4v6.3a1.4 1.4 0 0 1-1.4 1.4H4.2a1.4 1.4 0 0 1-1.4-1.4z"/><path d="M8.3 10.5h4.4m-1.7-1.7 1.7 1.7-1.7 1.7"/>'),
    reply: g('<path d="M7.9 4.9 3.3 9.2l4.6 4.3"/><path d="M3.7 9.2h6.6a5.4 5.4 0 0 1 5.4 5.4v.5"/>'),
    replyall: g('<path d="M6.6 4.9 2 9.2l4.6 4.3"/><path d="M10.9 4.9 6.3 9.2l4.6 4.3"/><path d="M6.7 9.2h5.5a5.2 5.2 0 0 1 5.2 5.2v.5"/>'),
    forward: g('<path d="M12.1 4.9l4.6 4.3-4.6 4.3"/><path d="M16.3 9.2H9.7a5.4 5.4 0 0 0-5.4 5.4v.5"/>'),
    flag: g('<path d="M5.2 3.4v13.2"/><path d="M5.2 4.4h8.5l-1.9 3.2 1.9 3.2H5.2z"/>'),
    unread: g('<rect x="2.6" y="4.5" width="14.8" height="11" rx="1.8"/><path d="m3 5.5 6.1 4.3a1.6 1.6 0 0 0 1.8 0L17 5.5"/>'),
    funnel: g('<path d="M3.5 4.5h13l-5 5.9v5.1l-3-1.7v-3.4z"/>'),
    caret: g('<path d="m7 8.6 3 3 3-3"/>'),
    inbox: g('<path d="M2.9 10.7 5.1 4.6h9.8l2.2 6.1v3.7a1.5 1.5 0 0 1-1.5 1.5H4.4a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M2.9 10.7h3.8l.9 1.8h4.8l.9-1.8h3.8"/>'),
    send: g('<path d="m17.2 3.4-14.4 5.3 5.6 2.3 2.3 5.6z"/><path d="M8.4 11 17.2 3.4"/>'),
    star: g('<path d="m10 3.4 2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7L3.2 8.4l4.7-.7z"/>'),
    folder: g('<path d="M2.8 5.5A1.4 1.4 0 0 1 4.2 4.1h2.9l1.5 1.8h6.2a1.4 1.4 0 0 1 1.4 1.4v6.3a1.4 1.4 0 0 1-1.4 1.4H4.2a1.4 1.4 0 0 1-1.4-1.4z"/>'),
    sync: g('<path d="M16.4 9.2a6.4 6.4 0 1 1-1.9-4.6"/><path d="M16.7 2.2v3.9h-3.9"/>'),
    down: g('<path d="M10 3.4v9.2"/><path d="m6.3 9 3.7 3.6L13.7 9"/><path d="M3.6 16.3h12.8"/>'),
    offline: g('<path d="M5.6 15.4h8.1a3.4 3.4 0 0 0 .5-6.8 4.8 4.8 0 0 0-8-2.6"/><path d="M3 3l14 14"/>'),
    folderplus: g('<path d="M2.8 5.5A1.4 1.4 0 0 1 4.2 4.1h2.9l1.5 1.8h6.2a1.4 1.4 0 0 1 1.4 1.4v6.3a1.4 1.4 0 0 1-1.4 1.4H4.2a1.4 1.4 0 0 1-1.4-1.4z"/><path d="M10 8.6v4.2M7.9 10.7h4.2"/>'),
    pencil: g('<path d="m12.6 4.2 3.2 3.2-8 8-4 .8.8-4z"/><path d="m11 5.8 3.2 3.2"/>'),
    check: g('<path d="m3.6 10.4 3.6 3.6 8.6-8.6"/>'),
    layout: g('<rect x="2.8" y="3.9" width="14.4" height="12.2" rx="1.7"/><path d="M8.6 3.9v12.2"/>'),
    chat: g('<path d="M3 5.6A1.7 1.7 0 0 1 4.7 3.9h10.6A1.7 1.7 0 0 1 17 5.6v5.9a1.7 1.7 0 0 1-1.7 1.7H8l-3.6 2.9v-2.9A1.4 1.4 0 0 1 3 11.8z"/>'),
    question: g('<circle cx="10" cy="10" r="7.1"/><path d="M8 8a2 2 0 1 1 2.6 1.9c-.4.2-.6.6-.6 1v.5M10 14v.1"/>'),
  };

  const CSS = `
.hiw .hiw-ox{
  flex:1;display:flex;flex-direction:column;min-width:0;
  /* Outlook blue. It stays #0f6cbd wherever it is a fill behind white
     text; --ox-ink is the same colour lifted for use as ink on a dark
     surface, where 0f6cbd on 1c1c1e is unreadable. */
  --ox:#0f6cbd;--ox-ink:#0f6cbd;--ox-hi:#0a5ba3;
}
@media (prefers-color-scheme:dark){.hiw:not([data-theme="light"]) .hiw-ox{--ox-ink:#5aa9e8;--ox-hi:#1a7dd0}}

/* ---------- ribbon: tab row, then the command bar ---------- */
.hiw .hiw-ox-tabs{
  flex:none;display:flex;align-items:stretch;gap:1px;padding:0 10px;height:31px;
  background:var(--chrome);backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  box-shadow:0 .5px 0 var(--hair);
}
.hiw .hiw-ox-tab{
  padding:0 11px;font-size:12.5px;color:var(--ink-2);
  border-bottom:2px solid transparent;border-radius:6px 6px 0 0;white-space:nowrap;
}
.hiw .hiw-ox-tab:hover{color:var(--ink);background:var(--fill)}
.hiw .hiw-ox-tab.on{color:var(--ox-ink);border-bottom-color:var(--ox-ink);font-weight:600}

.hiw .hiw-ox-cmd{
  flex:none;display:flex;align-items:center;gap:1px;padding:7px 10px;min-height:46px;
  background:var(--content);box-shadow:0 .5px 0 var(--hair);white-space:nowrap;
}
.hiw .hiw-ox-b{
  display:flex;align-items:center;gap:6px;height:32px;padding:0 9px;border-radius:6px;
  font-size:12.5px;color:var(--ink);white-space:nowrap;flex:none;
}
.hiw .hiw-ox-b svg{width:18px;height:18px;flex:none;color:var(--ox-ink)}
.hiw .hiw-ox-b .cr{width:14px;height:14px;margin-left:-3px;color:var(--ink-3)}
.hiw button.hiw-ox-b:hover{background:var(--fill)}
.hiw button.hiw-ox-b:active{background:var(--fill-2)}
.hiw button.hiw-ox-b[disabled]{opacity:.38;cursor:default;background:none}
.hiw .hiw-ox-b.pri{background:var(--ox);color:#fff;padding:0 12px;font-weight:600}
.hiw .hiw-ox-b.pri svg{color:#fff}
.hiw button.hiw-ox-b.pri:hover{background:var(--ox-hi)}
.hiw span.hiw-ox-b{color:var(--ink-2);cursor:default}
.hiw span.hiw-ox-b svg{color:var(--ink-3)}
.hiw .hiw-ox-vr{width:1px;height:22px;background:var(--line);margin:0 7px;flex:none}

/* the Move popover hangs out of the command bar, so nothing on that
   row may clip — the window body crops it instead */
.hiw .hiw-ox-anchor{position:relative;flex:none}
.hiw .hiw-ox-pop{
  position:absolute;top:calc(100% + 5px);left:0;z-index:6;min-width:198px;padding:5px;
  border-radius:10px;background:var(--raised);
  box-shadow:0 14px 34px rgba(0,0,0,.26),inset 0 0 0 .5px var(--line);
}
.hiw .hiw-ox-pop .hd{
  padding:6px 9px 5px;font-size:10.5px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;color:var(--ink-3);
}
.hiw .hiw-ox-pop button{
  display:flex;width:100%;align-items:center;gap:9px;height:29px;padding:0 9px;
  border-radius:6px;font-size:12.5px;text-align:left;
}
.hiw .hiw-ox-pop button svg{width:16px;height:16px;flex:none;color:var(--ink-2)}
.hiw .hiw-ox-pop button:hover{background:var(--fill)}

.hiw .hiw-ox-panes{flex:1;min-height:0;display:flex}

/* ---------- folder pane ---------- */
.hiw .hiw-ox-side{
  width:226px;flex:none;overflow:auto;padding:11px 0 16px;
  background:var(--sidebar);backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  box-shadow:.5px 0 0 var(--hair);
}
.hiw .hiw-ox-acct{display:flex;align-items:center;gap:9px;padding:2px 15px 10px}
.hiw .hiw-ox-acct-av{
  width:27px;height:27px;border-radius:50%;flex:none;background:var(--ox);
  display:grid;place-items:center;color:#fff;font-size:11px;font-weight:600;
}
.hiw .hiw-ox-acct-t{min-width:0}
.hiw .hiw-ox-acct-t b{display:block;font-size:12.5px;font-weight:600;line-height:1.3}
.hiw .hiw-ox-acct-t span{
  display:block;font-size:11px;color:var(--ink-3);line-height:1.4;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.hiw .hiw-ox-grp{
  font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink-3);padding:15px 16px 5px;
}
.hiw .hiw-ox-f{
  display:flex;align-items:center;gap:9px;width:calc(100% - 16px);
  height:31px;padding:0 9px;margin:1px 8px;border-radius:7px;
  color:var(--ink);font-size:13px;text-align:left;
}
.hiw .hiw-ox-f svg{width:17px;height:17px;flex:none;color:var(--ink-2)}
.hiw .hiw-ox-f:hover{background:var(--fill)}
.hiw .hiw-ox-f.on{background:var(--sel);font-weight:600}
.hiw .hiw-ox-f.on svg{color:var(--ox-ink)}
.hiw .hiw-ox-fname{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hiw .hiw-ox-count{
  flex:none;font-size:11.5px;font-weight:600;color:var(--ox-ink);
  font-variant-numeric:tabular-nums;
}

/* ---------- message list ---------- */
.hiw .hiw-ox-mid{
  width:334px;flex:none;min-width:0;display:flex;flex-direction:column;
  background:var(--raised);box-shadow:.5px 0 0 var(--hair);
}
.hiw .hiw-ox-mhead{flex:none;display:flex;align-items:center;gap:10px;padding:15px 16px 9px}
.hiw .hiw-ox-mhead h4{
  margin:0;flex:1;min-width:0;font-size:15px;font-weight:600;letter-spacing:-.012em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.hiw .hiw-ox-filter{
  display:flex;align-items:center;gap:5px;flex:none;height:26px;padding:0 8px;
  border-radius:6px;font-size:12px;color:var(--ink-2);
}
.hiw .hiw-ox-filter svg{width:15px;height:15px}
.hiw .hiw-ox-filter:hover{background:var(--fill);color:var(--ink)}
.hiw .hiw-ox-filter.on{color:var(--ox-ink);font-weight:600}
.hiw .hiw-ox-pivot{flex:none;display:flex;gap:20px;padding:0 18px;box-shadow:0 .5px 0 var(--hair)}
.hiw .hiw-ox-piv{
  padding:5px 1px 9px;font-size:13px;color:var(--ink-2);
  border-bottom:2px solid transparent;
}
.hiw .hiw-ox-piv:hover{color:var(--ink)}
.hiw .hiw-ox-piv.on{color:var(--ox-ink);border-bottom-color:var(--ox-ink);font-weight:600}
.hiw .hiw-ox-list{flex:1;min-height:0;padding:7px 0 14px}

/* The row the owner has asked twice for more air in. Three lines with
   real gaps between them, a hairline inset past the unread gutter so
   it reads as a list rather than as boxes, and a rounded selection
   that swallows the hairline either side of it. */
.hiw .hiw-ox-row{
  position:relative;display:flex;gap:11px;align-items:flex-start;
  width:calc(100% - 16px);margin:0 8px;padding:13px 12px 14px;
  border-radius:10px;text-align:left;color:var(--ink);
}
.hiw .hiw-ox-row::after{
  content:"";position:absolute;left:43px;right:12px;bottom:0;height:1px;background:var(--hair);
}
.hiw .hiw-ox-row:last-child::after,
.hiw .hiw-ox-row.on::after,
.hiw .hiw-ox-row:has(+ .hiw-ox-row.on)::after{display:none}
.hiw .hiw-ox-row:hover{background:var(--fill)}
.hiw .hiw-ox-row.on{background:var(--sel)}
.hiw .hiw-ox-dot{
  width:8px;height:8px;border-radius:50%;flex:none;margin-top:5px;
  background:var(--ox-ink);opacity:0;
}
.hiw .hiw-ox-row.unread .hiw-ox-dot{opacity:1}
.hiw .hiw-ox-rin{flex:1;min-width:0}
.hiw .hiw-ox-r1{display:flex;align-items:baseline;gap:10px}
.hiw .hiw-ox-r1 b{
  flex:1;min-width:0;font-size:13.5px;font-weight:600;letter-spacing:-.005em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.hiw .hiw-ox-when{
  flex:none;font-size:11.5px;color:var(--ink-3);font-variant-numeric:tabular-nums;
}
.hiw .hiw-ox-r2{
  margin-top:5px;font-size:13px;line-height:1.35;color:var(--ink);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.hiw .hiw-ox-row.unread .hiw-ox-r2{font-weight:600}
.hiw .hiw-ox-r3{display:flex;align-items:flex-start;gap:9px;margin-top:6px}
.hiw .hiw-ox-r3 span{
  flex:1;min-width:0;font-size:12.5px;line-height:1.35;color:var(--ink-3);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.hiw .hiw-ox-rflag{flex:none;color:#d13438;margin-top:1px}
.hiw .hiw-ox-rflag svg{width:11px;height:13px;display:block}

.hiw .hiw-ox-empty{padding:52px 28px;text-align:center;color:var(--ink-3);font-size:12.5px;line-height:1.6}
.hiw .hiw-ox-empty svg{width:32px;height:32px;opacity:.45;margin-bottom:12px}
.hiw .hiw-ox-empty b{display:block;font-size:13.5px;font-weight:600;color:var(--ink-2);margin-bottom:5px}
.hiw .hiw-ox-empty p{margin:0 auto;max-width:34ch}

/* ---------- reading pane ---------- */
.hiw .hiw-ox-read{flex:1;min-width:0;background:var(--content);padding:26px 34px 52px}
.hiw .hiw-ox-subject{
  margin:0;font-size:21px;font-weight:600;letter-spacing:-.015em;line-height:1.28;
  display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;
}
.hiw .hiw-ox-chip{
  flex:none;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:#d13438;background:rgba(209,52,56,.12);padding:3px 7px;border-radius:5px;
}
.hiw .hiw-ox-head{
  display:flex;gap:13px;align-items:flex-start;flex-wrap:wrap;
  padding:17px 0 19px;border-bottom:.5px solid var(--line);
}
.hiw .hiw-ox-av{
  width:40px;height:40px;border-radius:50%;flex:none;display:grid;place-items:center;
  color:#fff;font-size:13.5px;font-weight:600;letter-spacing:.02em;
}
.hiw .hiw-ox-who{flex:1;min-width:180px;padding-top:1px}
.hiw .hiw-ox-who b{font-size:14px;font-weight:600}
.hiw .hiw-ox-org{font-weight:400;color:var(--ink-3);font-size:12.5px;margin-left:8px}
.hiw .hiw-ox-to{font-size:12.5px;color:var(--ink-2);margin-top:5px;line-height:1.5}
.hiw .hiw-ox-to em{font-style:normal;color:var(--ink-3)}
.hiw .hiw-ox-hr{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.hiw .hiw-ox-hdate{font-size:12px;color:var(--ink-3);white-space:nowrap}
.hiw .hiw-ox-acts{display:flex;gap:5px}
.hiw .hiw-ox-act{
  display:flex;align-items:center;gap:5px;height:29px;padding:0 11px;border-radius:6px;
  font-size:12.5px;color:var(--ox-ink);box-shadow:inset 0 0 0 1px var(--line);white-space:nowrap;
}
.hiw .hiw-ox-act svg{width:16px;height:16px}
.hiw .hiw-ox-act:hover{background:var(--fill)}

.hiw .hiw-ox-body{font-size:14.5px;line-height:1.72;max-width:66ch;padding-top:21px;color:var(--ink)}
.hiw .hiw-ox-body p{margin:0 0 15px}
.hiw .hiw-ox-body p:last-child{margin-bottom:0}

.hiw .hiw-ox-thread{margin-top:32px;max-width:66ch}
.hiw .hiw-ox-tbar{display:flex;align-items:center;gap:11px;padding-bottom:15px}
.hiw .hiw-ox-tbar .hiw-ox-av{width:30px;height:30px;font-size:11.5px;background:#1f7a5c}
.hiw .hiw-ox-tbar b{font-size:13.5px;font-weight:600}
.hiw .hiw-ox-tbar em{font-style:normal;color:var(--ink-3);font-size:12.5px;margin-left:7px}
.hiw .hiw-ox-sent{
  margin-left:auto;flex:none;font-size:10px;font-weight:700;letter-spacing:.07em;
  text-transform:uppercase;color:#1f7a5c;background:rgba(31,122,92,.13);
  padding:3px 7px;border-radius:5px;
}
.hiw .hiw-ox-quote{border-left:2px solid var(--line);padding-left:18px}
.hiw .hiw-ox-qhead{
  font-size:12px;line-height:1.65;color:var(--ink-3);
  padding-bottom:14px;border-bottom:.5px solid var(--hair);
}
.hiw .hiw-ox-qhead b{color:var(--ink-2);font-weight:600}
.hiw .hiw-ox-quote .hiw-ox-body{padding-top:14px}

/* ---------- compose ---------- */
.hiw .hiw-ox-comp{max-width:70ch}
.hiw .hiw-ox-comp h3{margin:0 0 14px;font-size:16px;font-weight:600;letter-spacing:-.012em}
.hiw .hiw-ox-field{
  display:flex;align-items:center;gap:12px;padding:10px 2px;
  border-bottom:.5px solid var(--hair);
}
.hiw .hiw-ox-field label{flex:none;width:58px;font-size:12px;color:var(--ink-3)}
.hiw .hiw-ox-field input{
  flex:1;min-width:0;appearance:none;background:none;border:0;padding:2px 0;
  font:inherit;font-size:13.5px;color:var(--ink);
}
.hiw .hiw-ox-comp textarea{
  display:block;width:100%;min-height:230px;margin-top:18px;resize:vertical;
  appearance:none;background:none;border:0;
  font:inherit;font-size:14.5px;line-height:1.7;color:var(--ink);
}
.hiw .hiw-ox-comp textarea:focus,.hiw .hiw-ox-field input:focus{outline:none}
.hiw .hiw-ox-comp-acts{display:flex;gap:8px;margin-top:20px}

/* ---------- status bar ---------- */
.hiw .hiw-ox-status{
  flex:none;display:flex;align-items:center;gap:14px;height:27px;padding:0 15px;
  font-size:11.5px;color:var(--ink-3);
  background:var(--chrome);backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  box-shadow:0 -.5px 0 var(--hair);
}
.hiw .hiw-ox-toast{
  flex:1;min-width:0;text-align:center;color:var(--ink-2);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}

/* A narrow window drops panes rather than crushing them: folder pane
   first, then the list, so the last thing standing is the mail itself. */
@container (max-width:1040px){.hiw .hiw-ox-mid{width:306px}}
@container (max-width:900px){.hiw .hiw-ox-side{display:none}}
@container (max-width:860px){.hiw .hiw-ox-b .lbl{display:none}.hiw .hiw-ox-b{padding:0 8px}.hiw .hiw-ox-b.pri{padding:0 9px}}
@container (max-width:700px){.hiw .hiw-ox-acts .lbl{display:none}}
@container (max-width:640px){.hiw .hiw-ox-mid{display:none}}
@container (max-width:620px){
  .hiw .hiw-ox-read{padding:20px 18px 36px}
  .hiw .hiw-ox-subject{font-size:18px}
  .hiw .hiw-ox-status .rt{display:none}
}`;

  /* Which commands sit on which ribbon tab. A command with `act` is a
     button; one without is a span, because a control that looks live
     and does nothing is worse than one that never claimed to be. */
  const TABS = {
    'Home': null, /* built per-render, it needs the selection */
    'Send / Receive': [
      ['Send & Receive All', IC.sync], ['Update Folder', IC.down], ['Work Offline', IC.offline],
    ],
    'Folder': [
      ['New Folder', IC.folderplus], ['Rename Folder', IC.pencil], ['Delete Folder', IC.trash],
    ],
    'View': [
      ['Reading Pane', IC.layout], ['Conversations', IC.chat], ['Message Preview', IC.unread],
    ],
    'Help': [
      ['Help', IC.question], ["What's New", IC.star], ['Feedback', IC.chat],
    ],
  };

  const FOLDER_ICON = {
    Inbox: IC.inbox, Flagged: IC.flag, Sent: IC.send, VIP: IC.star, Drafts: IC.pencil,
    Archive: IC.archive, Deleted: IC.trash,
  };

  const titleCase = (s) => s.replace(/(^|[\s'-])([a-z])/g, (m, a, b) => a + b.toUpperCase());

  self.HowIWork.register('outlook', {
    name: 'Outlook',
    short: 'Outlook',
    menus: ['File', 'Edit', 'View', 'Message', 'Format', 'Tools', 'Window', 'Help'],
    /* Microsoft Outlook mark from Simple Icons (CC0) on a Fluent-blue
       tile — a real logo reads as the real app in a way a redrawing
       never quite does. */
    bg: 'linear-gradient(160deg,#1a86e0,#0f6cbd)',
    glyph: svg('0 0 24 24', '<path fill="#fff" d="M7.88 12.04q0 .45-.11.87-.1.41-.33.74-.22.33-.58.52-.37.2-.87.2t-.85-.2q-.35-.21-.57-.55-.22-.33-.33-.75-.1-.42-.1-.86t.1-.87q.1-.43.34-.76.22-.34.59-.54.36-.2.87-.2t.86.2q.35.21.57.55.22.34.31.77.1.43.1.88zM24 12v9.38q0 .46-.33.8-.33.32-.8.32H7.13q-.46 0-.8-.33-.32-.33-.32-.8V18H1q-.41 0-.7-.3-.3-.29-.3-.7V7q0-.41.3-.7Q.58 6 1 6h6.5V2.55q0-.44.3-.75.3-.3.75-.3h12.9q.44 0 .75.3.3.3.3.75V10.85l1.24.72h.01q.1.07.18.18.07.12.07.25zm-6-8.25v3h3v-3zm0 4.5v3h3v-3zm0 4.5v1.83l3.05-1.83zm-5.25-9v3h3.75v-3zm0 4.5v3h3.75v-3zm0 4.5v2.03l2.41 1.5 1.34-.8v-2.73zM9 3.75V6h2l.13.01.12.04v-2.3zM5.98 15.98q.9 0 1.6-.3.7-.32 1.19-.86.48-.55.73-1.28.25-.74.25-1.61 0-.83-.25-1.55-.24-.71-.71-1.24t-1.15-.83q-.68-.3-1.55-.3-.92 0-1.64.3-.71.3-1.2.85-.5.54-.75 1.3-.25.74-.25 1.63 0 .85.26 1.56.26.72.74 1.23.48.52 1.17.81.69.3 1.56.3zM7.5 21h12.39L12 16.08V17q0 .41-.3.7-.29.3-.7.3H7.5zm15-.13v-7.24l-5.9 3.54Z"/>', 'width="27" height="27" style="margin:5px"'),

    render(data, win, ui) {
      ui.style('hiw-ox', CSS);

      const d = data || {};
      const msgs = Array.isArray(d.messages) ? d.messages.filter((m) => m && m.id) : [];
      const boxes = Array.isArray(d.mailboxes) ? d.mailboxes : [];
      const tabs = (Array.isArray(d.ribbon) && d.ribbon.length ? d.ribbon : ['Home']);
      const account = d.account || '';

      /* The account name is not in the data, only the address, and
         inventing a second copy of it would be one more thing to keep
         in step with build/how-i-work.mjs. */
      const person = account
        ? titleCase(account.split('@')[0].replace(/[._-]+/g, ' ').trim())
        : 'Mail';
      const myInitials = person.split(' ').filter(Boolean).slice(0, 2)
        .map((w) => w[0].toUpperCase()).join('') || 'ME';

      /* Focused / Other has no field in the data, so it is derived —
         once, up front. Anything still unread or flagged is live
         correspondence and belongs in Focused. Derived once rather than
         per paint because opening a message marks it read, and a row
         that hopped pivots the instant you clicked it would read as a
         bug rather than as triage. */
      const focused = new Set(msgs.filter((m) => m.unread || m.flagged).map((m) => m.id));

      /* Mutable state lives outside the message objects: the config is
         shared with the built-in renderer and a plugin has no business
         writing to it. */
      const gone = new Set();
      const flagged = new Map(msgs.map((m) => [m.id, !!m.flagged]));
      const unread = new Map(msgs.map((m) => [m.id, !!m.unread]));

      const firstFolder = boxes.flatMap((b) => (b.items || [])).find((f) => f && f.active);
      const state = {
        tab: tabs.includes('Home') ? 'Home' : tabs[0],
        folder: (firstFolder && firstFolder.name) || 'Inbox',
        pivot: 'focused',
        pivotOn: true,
        filter: 'all',
        sel: null,
        compose: null,
      };

      /* ---------- what the list shows ---------------------------------
         Inbox is everything; Flagged and Sent are real views over the
         same four messages. Any other folder is honestly empty rather
         than quietly showing the inbox again. */
      const inFolder = (m) => {
        if (state.folder === 'Flagged') return flagged.get(m.id);
        if (state.folder === 'Sent') return !!m.reply;
        return state.folder === 'Inbox';
      };
      const passesFilter = (m) =>
        state.filter === 'all' ||
        (state.filter === 'unread' ? unread.get(m.id) : flagged.get(m.id));
      const pivoted = (m) =>
        state.folder !== 'Inbox' || !state.pivotOn ||
        focused.has(m.id) === (state.pivot === 'focused');

      const visible = () =>
        msgs.filter((m) => !gone.has(m.id) && inFolder(m) && pivoted(m) && passesFilter(m));

      const selMsg = () => msgs.find((m) => m.id === state.sel && !gone.has(m.id)) || null;

      /* Sent shows the reply's metadata, not the incoming message's —
         a Sent row that says who wrote to you is the wrong way round. */
      const rowText = (m) => (state.folder === 'Sent' && m.reply
        ? { who: 'To: ' + (m.from || 'Unknown'), when: m.reply.when || '',
            subject: 'RE: ' + m.subject,
            preview: ((m.reply.blocks || [])[0] || {}).text || '' }
        : { who: m.from || '', when: m.date || '', subject: m.subject || '',
            preview: m.preview || '' });

      /* ---------- nodes -------------------------------------------- */
      const side = el('div.hiw-ox-side.hiw-scroll');
      const tabRow = el('div.hiw-ox-tabs');
      const cmdRow = el('div.hiw-ox-cmd');
      const midHead = el('div.hiw-ox-mhead');
      const pivotRow = el('div.hiw-ox-pivot');
      const list = el('div.hiw-ox-list.hiw-scroll');
      const read = el('div.hiw-ox-read.hiw-scroll');
      const statLeft = el('span');
      const toast = el('span.hiw-ox-toast');

      /* Native replaceChildren takes neither arrays nor nulls, and the
         painters below produce both. Route them through the kit's
         builder, which already flattens and skips, and hand over what
         falls out. */
      const fill = (node, ...kids) => node.replaceChildren(...[...el('div', null, kids).childNodes]);

      let pop = null;
      const closePop = () => { if (pop) { pop.remove(); pop = null; } };

      let toastId = 0;
      const say = (t) => {
        toast.textContent = t;
        clearTimeout(toastId);
        toastId = setTimeout(() => { toast.textContent = ''; }, 2800);
        win.timers.push(toastId);
      };

      /* ---------- actions ------------------------------------------ */
      const paintAll = () => { paintSide(); paintMid(); paintRead(); paintCmd(); paintStatus(); };

      const select = (m) => {
        state.compose = null;
        state.sel = m.id;
        unread.set(m.id, false);
        paintAll();
      };

      /* After a message leaves the list, land on whatever is now under
         the cursor rather than on nothing. */
      const reselect = () => {
        const v = visible();
        state.sel = v.length ? v[0].id : null;
        if (state.sel) unread.set(state.sel, false);
      };

      const remove = (verb) => {
        const m = selMsg();
        if (!m) return;
        gone.add(m.id);
        say(`${verb} “${m.subject}”`);
        reselect();
        paintAll();
      };

      const setFolder = (name) => {
        state.folder = name;
        state.compose = null;
        closePop();
        reselect();
        win.setTitle(`${name} — ${person}`);
        paintAll();
      };

      const compose = (mode) => {
        const m = selMsg();
        if (mode !== 'new' && !m) return;
        /* New Mail is a blank sheet even with a message selected —
           inheriting the selection's subject would be a reply wearing
           the wrong name. */
        state.compose = { mode, m: mode === 'new' ? null : m };
        closePop();
        paintRead();
        paintCmd();
      };

      const movePop = (btn) => {
        if (pop) return closePop();
        const targets = boxes.flatMap((b) => (b.items || []))
          .filter((f) => f && f.name && f.name !== state.folder);
        pop = el('div.hiw-ox-pop', null,
          el('div.hd', { text: 'Move to' }),
          targets.length
            ? targets.map((f) => el('button', {
                type: 'button',
                onclick: () => { closePop(); remove('Moved to ' + f.name + ':'); },
              }, el('span', { html: FOLDER_ICON[f.name] || IC.folder }), f.name))
            : el('div.hd', { text: 'No other folders' }));
        btn.parentNode.append(pop);
      };

      /* ---------- ribbon -------------------------------------------- */
      const cmdBtn = (label, icon, act, opts = {}) => {
        const kids = [
          el('span', { html: icon }),
          el('span.lbl', { text: label }),
          opts.caret ? el('span.cr', { html: IC.caret }) : null,
        ];
        if (!act) return el('span.hiw-ox-b', { 'aria-hidden': 'true' }, kids);
        return el('button.hiw-ox-b' + (opts.pri ? '.pri' : '') + (opts.cls || ''), {
          type: 'button', 'aria-label': label, disabled: opts.off || null,
          onclick: (e) => act(e.currentTarget),
        }, kids);
      };

      const homeCmds = () => {
        const off = !selMsg();
        const m = selMsg();
        return [
          cmdBtn('New Mail', IC.newmail, () => compose('new'), { pri: true }),
          el('span.hiw-ox-vr'),
          cmdBtn('Delete', IC.trash, () => remove('Deleted'), { off }),
          cmdBtn('Archive', IC.archive, () => remove('Archived'), { off }),
          el('span.hiw-ox-anchor', null,
            cmdBtn('Move', IC.move, (btn) => movePop(btn), { off, caret: true })),
          el('span.hiw-ox-vr'),
          cmdBtn('Reply', IC.reply, () => compose('reply'), { off }),
          cmdBtn('Reply All', IC.replyall, () => compose('replyall'), { off }),
          cmdBtn('Forward', IC.forward, () => compose('forward'), { off }),
          el('span.hiw-ox-vr'),
          cmdBtn(m && flagged.get(m.id) ? 'Clear Flag' : 'Flag', IC.flag, () => {
            const t = selMsg();
            if (!t) return;
            const on = !flagged.get(t.id);
            flagged.set(t.id, on);
            say(on ? 'Flagged for follow up' : 'Flag cleared');
            paintAll();
          }, { off }),
          cmdBtn(m && unread.get(m.id) ? 'Mark Read' : 'Unread', IC.unread, () => {
            const t = selMsg();
            if (!t) return;
            unread.set(t.id, !unread.get(t.id));
            paintAll();
          }, { off }),
        ];
      };

      /* The two commands outside Home worth wiring up: one changes the
         list, one changes the pivot, and between them they prove the tab
         row is not a picture of a tab row. */
      const liveElsewhere = {
        'Mark All as Read': () => {
          for (const m of visible()) unread.set(m.id, false);
          say('All messages marked as read');
          paintAll();
        },
        'Focused Inbox': () => {
          state.pivotOn = !state.pivotOn;
          say(state.pivotOn ? 'Focused Inbox on' : 'Focused Inbox off');
          paintAll();
        },
      };

      function paintCmd() {
        closePop();
        if (state.tab === 'Home') return fill(cmdRow, ...homeCmds());
        const set = (TABS[state.tab] || []).slice();
        if (state.tab === 'Folder') set.splice(2, 0, ['Mark All as Read', IC.check]);
        if (state.tab === 'View') set.splice(1, 0, ['Focused Inbox', IC.funnel]);
        fill(cmdRow, ...set.map(([label, icon]) =>
          cmdBtn(label, icon, liveElsewhere[label] || null)));
      }

      fill(tabRow, ...tabs.map((t) => el('button.hiw-ox-tab', {
        type: 'button', text: t,
        onclick: () => { state.tab = t; paintTabs(); paintCmd(); },
      })));
      const paintTabs = () => {
        for (const b of tabRow.children) b.classList.toggle('on', b.textContent === state.tab);
      };

      /* ---------- folder pane --------------------------------------- */
      /* Counts are recomputed rather than read straight off the data, so
         deleting a message visibly moves the number next to Inbox. */
      const countFor = (f) => {
        if (f.name === 'Inbox') return msgs.filter((m) => !gone.has(m.id) && unread.get(m.id)).length;
        if (f.name === 'Flagged') return msgs.filter((m) => !gone.has(m.id) && flagged.get(m.id)).length;
        if (f.name === 'Sent') return 0;
        return f.count || 0;
      };

      function paintSide() {
        fill(side, 
          el('div.hiw-ox-acct', null,
            el('span.hiw-ox-acct-av', { text: myInitials }),
            el('div.hiw-ox-acct-t', null,
              el('b', { text: person }),
              el('span', { text: account }))),
          boxes.map((grp) => el('div', null,
            el('div.hiw-ox-grp', { text: grp.title || '' }),
            (grp.items || []).map((f) => {
              const n = countFor(f);
              return el('button.hiw-ox-f' + (f.name === state.folder ? '.on' : ''), {
                type: 'button', onclick: () => setFolder(f.name),
              },
                el('span', { html: FOLDER_ICON[f.name] || IC.folder }),
                el('span.hiw-ox-fname', { text: f.name }),
                n ? el('span.hiw-ox-count', { text: String(n) }) : null);
            }))));
      }

      /* ---------- message list -------------------------------------- */
      const FILTERS = [['all', 'Filter'], ['unread', 'Unread'], ['flagged', 'Flagged']];

      function paintMid() {
        const cur = FILTERS.findIndex(([k]) => k === state.filter);
        fill(midHead, 
          el('h4', { text: state.folder }),
          el('button.hiw-ox-filter' + (state.filter === 'all' ? '' : '.on'), {
            type: 'button', 'aria-label': 'Change filter',
            onclick: () => { state.filter = FILTERS[(cur + 1) % FILTERS.length][0]; reselect(); paintAll(); },
          }, el('span', { html: IC.funnel }), el('span', { text: FILTERS[cur][1] })));

        const showPivot = state.folder === 'Inbox' && state.pivotOn;
        pivotRow.hidden = !showPivot;
        if (showPivot) {
          fill(pivotRow, ...[['focused', 'Focused'], ['other', 'Other']].map(([k, t]) =>
            el('button.hiw-ox-piv' + (state.pivot === k ? '.on' : ''), {
              type: 'button', text: t,
              onclick: () => { state.pivot = k; reselect(); paintAll(); },
            })));
        }

        const items = visible();
        if (!items.length) return fill(list, emptyList());

        fill(list, ...items.map((m) => {
          const t = rowText(m);
          return el('button.hiw-ox-row' +
            (m.id === state.sel ? '.on' : '') +
            (unread.get(m.id) ? '.unread' : ''), {
            type: 'button', onclick: () => select(m),
          },
            el('span.hiw-ox-dot'),
            el('div.hiw-ox-rin', null,
              el('div.hiw-ox-r1', null,
                el('b', { text: t.who }),
                el('span.hiw-ox-when', { text: t.when })),
              el('div.hiw-ox-r2', { text: t.subject }),
              el('div.hiw-ox-r3', null,
                el('span', { text: t.preview }),
                flagged.get(m.id) ? el('span.hiw-ox-rflag', { html: ICONS.flag }) : null)));
        }));
      }

      /* Empty is a state worth writing copy for: a folder that shows
         nothing and says nothing looks broken. */
      function emptyList() {
        const known = ['Inbox', 'Flagged', 'Sent'].includes(state.folder);
        return el('div.hiw-ox-empty', null,
          el('span', { html: IC.inbox }),
          el('b', { text: known ? 'Nothing to show' : state.folder + ' is empty' }),
          el('p', {
            text: known
              ? (state.filter === 'all'
                ? 'No messages in this view.'
                : `No ${state.filter} messages here — clear the filter to see the rest.`)
              : 'This desktop is a mock. The mail in it lives in Inbox, Flagged and Sent.',
          }));
      }

      /* ---------- reading pane -------------------------------------- */
      const para = (b) => el('p', { text: (b && b.text) || '' });

      const actBtn = (label, icon, mode) => el('button.hiw-ox-act', {
        type: 'button', onclick: () => compose(mode),
      }, el('span', { html: icon }), el('span.lbl', { text: label }));

      /* A repaint caused by flagging or marking unread must not throw the
         reader back to the top of a long message, so scroll is held
         across a repaint of the same message and reset for a new one. */
      let shown = null;

      function paintRead() {
        const keep = read.scrollTop;
        if (state.compose) {
          shown = null;
          fill(read, composeForm());
          read.scrollTop = 0;
          return;
        }

        const m = selMsg();
        if (!m) {
          shown = null;
          fill(read, el('div.hiw-ox-empty', null,
            el('span', { html: IC.unread }),
            el('b', { text: 'Select an item to read' }),
            el('p', { text: 'Nothing is selected in ' + state.folder + '.' })));
          return;
        }

        const to = [
          m.to ? el('span', null, el('em', { text: 'To: ' }), m.to) : null,
          m.cc ? el('span', null, el('em', { text: '   Cc: ' }), m.cc) : null,
        ].filter(Boolean);

        fill(read, 
          el('h2.hiw-ox-subject', null,
            m.subject || '(no subject)',
            flagged.get(m.id) ? el('span.hiw-ox-chip', { text: 'Follow up' }) : null),
          el('div.hiw-ox-head', null,
            el('span.hiw-ox-av', { style: { background: m.color || '#5b8cf0' },
              text: m.initials || '?' }),
            el('div.hiw-ox-who', null,
              el('div', null,
                el('b', { text: m.from || 'Unknown sender' }),
                m.org ? el('span.hiw-ox-org', { text: m.org }) : null),
              to.length ? el('div.hiw-ox-to', null, to) : null),
            el('div.hiw-ox-hr', null,
              el('span.hiw-ox-hdate', { text: m.date || '' }),
              el('div.hiw-ox-acts', null,
                actBtn('Reply', IC.reply, 'reply'),
                actBtn('Reply All', IC.replyall, 'replyall'),
                actBtn('Forward', IC.forward, 'forward')))),
          el('div.hiw-ox-body', null, (m.body || []).map(para)),
          m.reply ? thread(m) : null);

        read.scrollTop = shown === m.id ? keep : 0;
        shown = m.id;
      }

      /* The reply is the point of the whole app — an inbox with no
         answers in it shows you were written to, not that you handled
         it. Outlook's own quoted-thread header is the honest place to
         put it: below the message, attributed, marked Sent. */
      const thread = (m) => el('div.hiw-ox-thread', null,
        el('div.hiw-ox-tbar', null,
          el('span.hiw-ox-av', { text: myInitials }),
          el('div', null,
            el('b', { text: person }),
            el('em', { text: 'replied ' + (m.reply.when || '') })),
          el('span.hiw-ox-sent', { text: 'Sent' })),
        el('div.hiw-ox-quote', null,
          el('div.hiw-ox-qhead', null,
            el('div', null, el('b', { text: 'From: ' }), person + ' <' + account + '>'),
            el('div', null, el('b', { text: 'Sent: ' }), m.reply.when || ''),
            el('div', null, el('b', { text: 'To: ' }), m.from || ''),
            el('div', null, el('b', { text: 'Subject: ' }), 'RE: ' + (m.subject || ''))),
          el('div.hiw-ox-body', null, (m.reply.blocks || []).map(para))));

      /* ---------- compose ------------------------------------------- */
      const MODE = {
        new: { title: 'New message', pre: '', sub: '' },
        reply: { title: 'Reply', pre: 'RE: ' },
        replyall: { title: 'Reply all', pre: 'RE: ' },
        forward: { title: 'Forward', pre: 'FW: ' },
      };

      function composeForm() {
        const { mode, m } = state.compose;
        const cfg = MODE[mode] || MODE.new;
        const quoted = m
          ? `\n\n\n——— Original message ———\nFrom: ${m.from || ''}\n` +
            `Sent: ${m.date || ''}\nSubject: ${m.subject || ''}\n\n` +
            (m.body || []).map((b) => b.text || '').join('\n\n')
          : '';

        const field = (label, value) => el('div.hiw-ox-field', null,
          el('label', { text: label, for: 'ox-' + label.toLowerCase() }),
          el('input', { id: 'ox-' + label.toLowerCase(), type: 'text', value, spellcheck: 'false' }));

        const done = (word) => {
          state.compose = null;
          say(word);
          paintRead();
          paintCmd();
        };

        return el('div.hiw-ox-comp', null,
          el('h3', { text: cfg.title }),
          field('To', mode === 'forward' || mode === 'new' ? '' : (m ? m.from : '')),
          field('Cc', mode === 'replyall' && m && m.cc ? m.cc : ''),
          field('Subject', m ? cfg.pre + (m.subject || '') : ''),
          el('textarea', { spellcheck: 'false', 'aria-label': 'Message body' }, quoted),
          el('div.hiw-ox-comp-acts', null,
            el('button.hiw-ox-b.pri', { type: 'button', onclick: () => done('Message sent') },
              el('span', { html: IC.send }), el('span.lbl', { text: 'Send' })),
            el('button.hiw-ox-b', { type: 'button', onclick: () => done('Draft discarded') },
              el('span', { html: IC.trash }), el('span.lbl', { text: 'Discard' }))));
      }

      /* ---------- status bar ---------------------------------------- */
      function paintStatus() {
        const n = visible().length;
        const un = msgs.filter((m) => !gone.has(m.id) && unread.get(m.id)).length;
        statLeft.textContent =
          `${n} item${n === 1 ? '' : 's'}` + (un ? `, ${un} unread` : '');
      }

      /* ---------- assemble ------------------------------------------ */
      const root = el('div.hiw-body.hiw-ox', null,
        tabRow, cmdRow,
        el('div.hiw-ox-panes', null,
          side,
          el('div.hiw-ox-mid', null, midHead, pivotRow, list),
          read),
        el('div.hiw-ox-status', null,
          statLeft, toast,
          el('span.rt', { text: 'Connected to: Microsoft Exchange' })));

      /* The popover is dismissed from inside the app rather than from
         the document, so it dies with this DOM tree instead of leaving
         a listener behind when the desktop closes. */
      root.addEventListener('pointerdown', (e) => {
        if (!pop) return;
        const t = e.target;
        if (pop.contains(t) || (t.closest && t.closest('.hiw-ox-anchor'))) return;
        closePop();
      }, true);

      const first = visible()[0] || msgs.find((m) => !gone.has(m.id));
      if (first) { state.sel = first.id; unread.set(first.id, false); }
      paintTabs();
      paintAll();

      return root;
    },
  });
})();
