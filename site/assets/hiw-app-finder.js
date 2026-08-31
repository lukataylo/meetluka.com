/* ============================================================
   Finder and Trash — two plugin apps for the mock desktop.

   Both are the same window: a toolbar, a column-headed list and a
   status bar. That chrome is written once here, in listView(), and
   handed a different set of rows and a different set of toolbar
   buttons; Finder adds the sidebar and the navigation history, Trash
   adds Empty and Put Back.

   Everything the chrome offers does something. Sorting sorts, the
   back button goes back, Put Back removes the row and Empty empties,
   because a control that only looks like a control is the one thing
   a mock desktop cannot afford — it is the moment someone stops
   believing the rest of it.
   ============================================================ */
(() => {
  'use strict';
  if (!self.HowIWork) return;

  const { el, svg, style } = self.HowIWork.ui;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- icons -------------------------------------------------
     A file icon is one sheet drawn in the text colour plus a coloured
     mark, so the paper follows the theme and only the accent — which
     is a hue, not a grey — is fixed. */
  const sheet = (mark) => svg('0 0 16 19',
    '<path d="M2.4 2.6a1.2 1.2 0 0 1 1.2-1.2h5.2l4.8 4.7v10.3a1.2 1.2 0 0 1-1.2 1.2H3.6a1.2 1.2 0 0 1-1.2-1.2z" fill="currentColor" fill-opacity=".07" stroke="currentColor" stroke-opacity=".38"/>'
    + '<path d="M8.6 1.6v4.6h4.7" stroke="currentColor" stroke-opacity=".38"/>'
    + mark, 'width="15" height="18"');

  const FILE_ICONS = {
    folder: svg('0 0 18 16',
      '<path d="M1 3.6A1.8 1.8 0 0 1 2.8 1.8h4.1l1.7 1.9h6.6A1.8 1.8 0 0 1 17 5.5v7.2a1.8 1.8 0 0 1-1.8 1.8H2.8A1.8 1.8 0 0 1 1 12.7z" fill="#3f97e3"/>'
      + '<path d="M1 6.2h16v6.5a1.8 1.8 0 0 1-1.8 1.8H2.8A1.8 1.8 0 0 1 1 12.7z" fill="#5ab4f5"/>', 'width="17" height="16"'),
    fig: sheet('<circle cx="6.3" cy="11" r="1.5" fill="#f24e1e"/><circle cx="6.3" cy="14.1" r="1.5" fill="#a259ff"/><circle cx="9.4" cy="12.6" r="1.5" fill="#1abcfe"/>'),
    pdf: sheet('<rect x="4.1" y="9.9" width="7.8" height="5" rx="1.2" fill="#d3564a"/>'),
    img: sheet('<circle cx="6" cy="9.9" r="1" fill="#3d9f6e"/><path d="M4.2 14.8 6.9 11l2 2.4 1.3-1.5 1.7 2.9z" fill="#3d9f6e"/>'),
    sheetx: sheet('<path d="M4.3 9.8h7.4v5.2H4.3z" stroke="#1f8a4c"/><path d="M4.3 12.4h7.4M8 9.8V15" stroke="#1f8a4c"/>'),
    doc: sheet('<path d="M4.6 10.2h6.8M4.6 12.4h6.8M4.6 14.6h4.4" stroke="#2b7cd3" stroke-width="1.2" stroke-linecap="round"/>'),
    slides: sheet('<rect x="4.2" y="10" width="7.6" height="5" rx="1" fill="#e07b39"/>'),
    text: sheet('<path d="M4.6 10.2h6.8M4.6 12.4h6.8M4.6 14.6h3.8" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>'),
    code: sheet('<path d="M6.6 10.5 4.6 12.6l2 2.1M9.4 10.5l2 2.1-2 2.1" stroke="#3178c6" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    sketch: sheet('<path d="M8 9.7 11.5 12 8 15.2 4.5 12z" fill="#f2a33c"/>'),
    token: sheet('<circle cx="8" cy="12.4" r="2.6" fill="#b4573f"/>'),
    audio: sheet('<circle cx="6.2" cy="14.1" r="1.6" fill="#8a63d2"/><path d="M7.8 14.1V9.9l3.4-.8v4.2" stroke="#8a63d2" stroke-width="1.2" stroke-linejoin="round"/>'),
    zip: sheet('<path d="M8 9.4v1.3M8 11.7v1.3M8 14v1.3" stroke="currentColor" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>'),
    app: svg('0 0 16 19',
      '<rect x="1.7" y="3" width="12.6" height="12.6" rx="3.2" fill="#5b8cf0"/>'
      + '<path d="M5.4 12 8 6.2 10.6 12" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', 'width="15" height="18"'),
    disk: svg('0 0 16 19',
      '<circle cx="8" cy="9.3" r="6.1" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-opacity=".4"/>'
      + '<circle cx="8" cy="9.3" r="1.7" stroke="currentColor" stroke-opacity=".4"/>', 'width="15" height="18"'),
    pkg: svg('0 0 16 19',
      '<path d="M8 2.8 13.7 6v6.8L8 16l-5.7-3.2V6z" fill="currentColor" fill-opacity=".1" stroke="currentColor" stroke-opacity=".4" stroke-linejoin="round"/>'
      + '<path d="M2.3 6 8 9.2 13.7 6M8 9.2V16" stroke="currentColor" stroke-opacity=".4"/>', 'width="15" height="18"'),
  };

  /* extension → icon. Anything unrecognised gets a plain sheet. */
  const BY_EXT = {
    fig: 'fig', pdf: 'pdf', png: 'img', jpg: 'img', jpeg: 'img', heic: 'img',
    xlsx: 'sheetx', numbers: 'sheetx', docx: 'doc', pages: 'doc',
    key: 'slides', pptx: 'slides', md: 'text', txt: 'text', ts: 'code',
    sketch: 'sketch', token: 'token', m4a: 'audio', mp4: 'audio',
    zip: 'zip', app: 'app', dmg: 'disk', pkg: 'pkg',
  };
  const iconFor = (r) => {
    if (r.go !== undefined) return FILE_ICONS.folder;
    const ext = r.n.slice(r.n.lastIndexOf('.') + 1).toLowerCase();
    return FILE_ICONS[BY_EXT[ext]] || FILE_ICONS.text;
  };

  const SIDE_ICONS = {
    clock: svg('0 0 16 16', '<circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.6V8l2.4 1.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', 'width="15" height="15"'),
    desktop: svg('0 0 16 16', '<rect x="1.6" y="2.6" width="12.8" height="8.6" rx="1.4" stroke="currentColor" stroke-width="1.4"/><path d="M5.6 13.6h4.8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>', 'width="15" height="15"'),
    docs: svg('0 0 16 16', '<path d="M3.4 1.8h5l4.2 4.2v8.2H3.4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M8.2 2v4.2h4.3" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>', 'width="15" height="15"'),
    down: svg('0 0 16 16', '<circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.8v6M5.4 8.4 8 11l2.6-2.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>', 'width="15" height="15"'),
    apps: svg('0 0 16 16', '<rect x="2" y="2" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="2" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="9" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="9" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4"/>', 'width="15" height="15"'),
    cloud: svg('0 0 16 16', '<path d="M4.6 12.2a3.1 3.1 0 0 1-.3-6.2 4 4 0 0 1 7.6.9 2.65 2.65 0 0 1-.5 5.3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>', 'width="15" height="15"'),
    net: svg('0 0 16 16', '<circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.4"/><path d="M1.8 8h12.4" stroke="currentColor" stroke-width="1.4"/><path d="M8 1.8c3.4 3.6 3.4 8.8 0 12.4-3.4-3.6-3.4-8.8 0-12.4z" stroke="currentColor" stroke-width="1.4"/>', 'width="15" height="15"'),
  };

  const CARET = svg('0 0 10 6', '<path d="M1.6 4.2 5 1.4l3.4 2.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>', 'width="9" height="6"');
  const VIEW_LIST = svg('0 0 16 14', '<path d="M2 3h12M2 7h12M2 11h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'width="15" height="13"');
  const VIEW_ICON = svg('0 0 16 14', '<rect x="2" y="2" width="4.4" height="4" rx="1" fill="currentColor"/><rect x="9.6" y="2" width="4.4" height="4" rx="1" fill="currentColor"/><rect x="2" y="8" width="4.4" height="4" rx="1" fill="currentColor"/><rect x="9.6" y="8" width="4.4" height="4" rx="1" fill="currentColor"/>', 'width="15" height="13"');
  const SORT_GLYPH = svg('0 0 16 14', '<path d="M2.4 3.2h11.2M4.4 7h7.2M6.4 10.8h3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>', 'width="15" height="13"');
  const TICK = svg('0 0 12 12', '<path d="M2.4 6.2 4.9 8.8 9.6 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>', 'width="11" height="11"');
  const BIN_BIG = svg('0 0 48 48',
    '<path d="M12 15h24l-2.1 24.4a3 3 0 0 1-3 2.6H17.1a3 3 0 0 1-3-2.6z" stroke="currentColor" stroke-width="2"/>'
    + '<path d="M8.6 14h30.8M19 13.6V10a2.4 2.4 0 0 1 2.4-2.4h5.2A2.4 2.4 0 0 1 29 10v3.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>', 'width="48" height="48"');
  const FOLDER_BIG = svg('0 0 48 42',
    '<path d="M3 9a5 5 0 0 1 5-5h11l4.6 5h21.4a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>', 'width="48" height="42"');

  /* ---------- the world ---------------------------------------------
     Two years of a designer's Mac. Dates are display strings, `t` is
     the sortable version of the same instant, and `b` is bytes so the
     Size column and the size sort read off one number. A row with a
     `go` is a folder and `go` is the folder it opens. */
  const FOLDERS = {
    recents: { name: 'Recents', sort: ['t', -1], items: [
      { n: 'Screenshot 2026-08-31 at 18.47.12.png', d: 'Today at 18:47', t: 202608311847, b: 1_820_000, k: 'PNG image' },
      { n: 'Screenshot 2026-08-31 at 18.44.02.png', d: 'Today at 18:44', t: 202608311844, b: 2_140_000, k: 'PNG image' },
      { n: 'Placement flow v4 FINAL actually.fig', d: 'Today at 16:20', t: 202608311620, b: 38_400_000, k: 'Figma document' },
      { n: '48244 — written, order, signed.png', d: 'Today at 10:14', t: 202608311014, b: 412_000, k: 'PNG image' },
      { n: 'Market panel v4.2.fig', d: 'Today at 08:12', t: 202608310812, b: 41_200_000, k: 'Figma document' },
      { n: 'signing-rules-DRAFT-rachel-comments-v7.xlsx', d: 'Yesterday at 17:41', t: 202608301741, b: 2_410_000, k: 'Excel workbook' },
      { n: 'clay-600.token', d: 'Yesterday at 16:52', t: 202608301652, b: 940, k: 'Design token' },
      { n: 'governed-context-layer-draft-3.md', d: '18 August 2026 at 07:55', t: 202608180755, b: 22_400, k: 'Markdown' },
      { n: 'Broker session 12 Aug — transcript.txt', d: '12 August 2026 at 15:58', t: 202608121558, b: 48_200, k: 'Plain text' },
      { n: 'MRC_v3_implementation_guide.pdf', d: '3 November 2023 at 11:02', t: 202311031102, b: 6_240_000, k: 'PDF document' },
    ] },

    desktop: { name: 'Desktop', items: [
      { n: '48244 — written, order, signed.png', d: 'Today at 10:14', t: 202608311014, b: 412_000, k: 'PNG image' },
      { n: 'dont delete.sketch', d: '4 March 2019 at 23:41', t: 201903042341, b: 84_600_000, k: 'Sketch document' },
      { n: 'Renewables — six days or three weeks.pdf', d: 'Friday at 16:05', t: 202608281605, b: 148_000, k: 'PDF document' },
      { n: 'Screenshot 2026-08-31 at 18.47.12.png', d: 'Today at 18:47', t: 202608311847, b: 1_820_000, k: 'PNG image' },
      { n: 'Screenshot 2026-08-31 at 18.44.02.png', d: 'Today at 18:44', t: 202608311844, b: 2_140_000, k: 'PNG image' },
      { n: 'Screenshot 2026-08-30 at 22.14.09.png', d: 'Yesterday at 22:14', t: 202608302214, b: 1_910_000, k: 'PNG image' },
      { n: 'Screenshot 2026-08-30 at 22.13.51.png', d: 'Yesterday at 22:13', t: 202608302213, b: 1_880_000, k: 'PNG image' },
      { n: 'Screenshot 2026-08-28 at 09.02.44.png', d: '28 August 2026 at 09:02', t: 202608280902, b: 2_360_000, k: 'PNG image' },
      { n: 'Screenshot 2026-08-27 at 16.30.18.png', d: '27 August 2026 at 16:30', t: 202608271630, b: 1_440_000, k: 'PNG image' },
      { n: 'Sprint 42 capacity (33, not 41).numbers', d: 'Yesterday at 16:44', t: 202608301644, b: 96_000, k: 'Numbers spreadsheet' },
      { n: 'to file', d: '2 January 2026 at 12:04', t: 202601021204, k: 'Folder', go: 'tofile' },
      { n: 'Untitled folder', d: '27 May 2026 at 11:09', t: 202605271109, k: 'Folder', go: 'untitled1' },
      { n: 'Untitled folder 2', d: '14 July 2026 at 09:41', t: 202607140941, k: 'Folder', go: 'untitled2' },
      { n: 'WhatsApp Image 2026-08-19 at 21.03.44.jpeg', d: '19 August 2026 at 21:03', t: 202608192103, b: 184_000, k: 'JPEG image' },
    ] },

    untitled1: { name: 'Untitled folder', items: [] },

    untitled2: { name: 'Untitled folder 2', items: [
      { n: 'Placement flow v2.fig', d: '14 January 2026 at 10:26', t: 202601141026, b: 28_600_000, k: 'Figma document' },
      { n: 'Screenshot 2026-04-02 at 09.13.55.png', d: '2 April 2026 at 09:13', t: 202604020913, b: 1_260_000, k: 'PNG image' },
    ] },

    tofile: { name: 'to file', items: [
      { n: 'Howden — starter pack.pdf', d: '2 September 2022 at 09:00', t: 202209020900, b: 4_180_000, k: 'PDF document' },
      { n: 'Invoice — Belgrade, June.pdf', d: '3 July 2026 at 08:12', t: 202607030812, b: 82_000, k: 'PDF document' },
      { n: 'Invoice — Belgrade, July.pdf', d: '4 August 2026 at 08:09', t: 202608040809, b: 82_400, k: 'PDF document' },
      { n: 'Untitled.pages', d: '19 March 2024 at 17:20', t: 202403191720, b: 62_000, k: 'Pages document' },
    ] },

    documents: { name: 'Documents', items: [
      { n: 'Admin', d: '12 June 2026 at 13:31', t: 202606121331, k: 'Folder', go: 'tofile' },
      { n: 'Context layer — steering group.key', d: '27 August 2026 at 21:33', t: 202608272133, b: 88_200_000, k: 'Keynote document' },
      { n: 'Contract — Stefan (renewal, unsigned).pdf', d: 'Yesterday at 17:02', t: 202608301702, b: 212_000, k: 'PDF document' },
      { n: 'CV.pdf', d: '2 February 2021 at 08:14', t: 202102020814, b: 96_400, k: 'PDF document' },
      { n: 'Expenses (do later)', d: '4 April 2025 at 19:50', t: 202504041950, k: 'Folder', go: 'untitled1' },
      { n: 'MRC_v3_implementation_guide.pdf', d: '3 November 2023 at 11:02', t: 202311031102, b: 6_240_000, k: 'PDF document' },
      { n: 'Renewables onboarding — the 41 fields.numbers', d: '26 August 2026 at 10:15', t: 202608261015, b: 214_000, k: 'Numbers spreadsheet' },
      { n: "signing-rules-DRAFT-rachel-comments-v7 (Rachel's copy).xlsx", d: 'Yesterday at 18:20', t: 202608301820, b: 2_410_000, k: 'Excel workbook' },
      { n: 'signing-rules-DRAFT-rachel-comments-v7.xlsx', d: 'Yesterday at 17:41', t: 202608301741, b: 2_410_000, k: 'Excel workbook' },
      { n: 'xTrade', d: 'Today at 16:20', t: 202608311620, k: 'Folder', go: 'xtrade' },
    ] },

    xtrade: { name: 'xTrade', items: [
      { n: 'Broker session 12 Aug — transcript.txt', d: '12 August 2026 at 15:58', t: 202608121558, b: 48_200, k: 'Plain text' },
      { n: 'Broker session 12 Aug.m4a', d: '12 August 2026 at 14:20', t: 202608121420, b: 84_200_000, k: 'Apple MPEG-4 audio' },
      { n: 'Decision log.md', d: '21 August 2026 at 16:04', t: 202608211604, b: 14_100, k: 'Markdown' },
      { n: 'Market panel v4.2.fig', d: 'Today at 08:12', t: 202608310812, b: 41_200_000, k: 'Figma document' },
      { n: 'Placement flow v3', d: '2 June 2026 at 18:40', t: 202606021840, k: 'Folder', go: 'untitled1' },
      { n: 'Placement flow v4 FINAL (2).fig', d: '11 August 2026 at 12:44', t: 202608111244, b: 37_100_000, k: 'Figma document' },
      { n: 'Placement flow v4 FINAL actually.fig', d: 'Today at 16:20', t: 202608311620, b: 38_400_000, k: 'Figma document' },
      { n: 'Placement flow v4 FINAL.fig', d: '6 August 2026 at 17:12', t: 202608061712, b: 36_800_000, k: 'Figma document' },
      { n: 'Research wall.fig', d: '12 August 2026 at 15:02', t: 202608121502, b: 22_600_000, k: 'Figma document' },
      { n: 'tool-surface-v1.ts', d: '19 August 2026 at 09:30', t: 202608190930, b: 8_200, k: 'TypeScript source' },
    ] },

    /* nothing in here but installers, and one of them has been sitting
       in the folder since 2021 */
    downloads: { name: 'Downloads', sort: ['t', -1], items: [
      { n: 'AWSCLIV2.pkg', d: '6 August 2026 at 15:10', t: 202608061510, b: 32_400_000, k: 'Installer package' },
      { n: 'Docker.dmg', d: '14 April 2026 at 11:50', t: 202604141150, b: 612_800_000, k: 'Disk image' },
      { n: 'Figma (1).dmg', d: '2 March 2026 at 09:12', t: 202603020912, b: 212_400_000, k: 'Disk image' },
      { n: 'Figma.dmg', d: '8 September 2021 at 22:31', t: 202109082231, b: 148_200_000, k: 'Disk image' },
      { n: 'GoogleChrome.dmg', d: '2 August 2026 at 07:55', t: 202608020755, b: 218_900_000, k: 'Disk image' },
      { n: 'install (1).pkg', d: '27 August 2026 at 09:47', t: 202608270947, b: 4_240_000, k: 'Installer package' },
      { n: 'install.pkg', d: '27 August 2026 at 09:44', t: 202608270944, b: 4_240_000, k: 'Installer package' },
      { n: 'MicrosoftTeams (1).pkg', d: '21 July 2026 at 08:40', t: 202607210840, b: 431_600_000, k: 'Installer package' },
      { n: 'MicrosoftTeams.pkg', d: '3 June 2026 at 08:02', t: 202606030802, b: 428_100_000, k: 'Installer package' },
      { n: 'zoomusInstallerFull.pkg', d: '19 May 2026 at 13:22', t: 202605191322, b: 24_800_000, k: 'Installer package' },
    ] },

    applications: { name: 'Applications', items: [
      { n: 'Figma.app', d: '2 March 2026 at 09:14', t: 202603020914, b: 1_240_000_000, k: 'Application' },
      { n: 'Google Chrome.app', d: '2 August 2026 at 07:58', t: 202608020758, b: 682_000_000, k: 'Application' },
      { n: 'Microsoft Outlook.app', d: '3 June 2026 at 08:06', t: 202606030806, b: 2_140_000_000, k: 'Application' },
      { n: 'Microsoft Teams.app', d: '21 July 2026 at 08:44', t: 202607210844, b: 1_410_000_000, k: 'Application' },
      { n: 'Notes.app', d: '14 June 2026 at 02:00', t: 202606140200, b: 12_400_000, k: 'Application' },
      { n: 'Numbers.app', d: '14 June 2026 at 02:00', t: 202606140200, b: 428_000_000, k: 'Application' },
      { n: 'Preview.app', d: '14 June 2026 at 02:00', t: 202606140200, b: 24_100_000, k: 'Application' },
      { n: 'Sketch.app', d: '4 March 2019 at 23:38', t: 201903042338, b: 218_000_000, k: 'Application' },
      { n: 'Terminal.app', d: '14 June 2026 at 02:00', t: 202606140200, b: 8_420_000, k: 'Application' },
      { n: 'Xcode.app', d: '11 January 2024 at 20:12', t: 202401112012, b: 24_600_000_000, k: 'Application' },
    ] },

    icloud: { name: 'iCloud Drive', items: [
      { n: 'Desktop', d: 'Today at 18:47', t: 202608311847, k: 'Folder', go: 'desktop' },
      { n: 'Documents', d: 'Today at 16:20', t: 202608311620, k: 'Folder', go: 'documents' },
      { n: 'meetluka.com backup.zip', d: '2 August 2026 at 23:11', t: 202608022311, b: 1_210_000_000, k: 'ZIP archive' },
      { n: 'Photos to sort (2019 – )', d: '11 May 2026 at 20:02', t: 202605112002, k: 'Folder', go: 'untitled1' },
      { n: 'Portfolio', d: 'Today at 07:02', t: 202608310702, k: 'Folder', go: 'portfolio' },
      { n: 'Taxes', d: '31 January 2026 at 23:41', t: 202601312341, k: 'Folder', go: 'untitled1' },
    ] },

    portfolio: { name: 'Portfolio', items: [
      { n: 'case-study-xtrade-v4.md', d: 'Today at 07:02', t: 202608310702, b: 41_800, k: 'Markdown' },
      { n: 'hero.jpg', d: '29 August 2026 at 14:12', t: 202608291412, b: 1_640_000, k: 'JPEG image' },
      { n: 'old site (2019)', d: '9 September 2019 at 22:15', t: 201909092215, k: 'Folder', go: 'untitled1' },
      { n: 'wallpaper.jpg', d: '29 August 2026 at 14:12', t: 202608291412, b: 2_880_000, k: 'JPEG image' },
    ] },

    sharepoint: { name: 'Howden SharePoint', items: [
      { n: 'Brand guidelines 2019.pdf', d: '8 October 2019 at 10:30', t: 201910081030, b: 18_400_000, k: 'PDF document' },
      { n: 'Brand guidelines 2024 (draft).pdf', d: '19 February 2024 at 16:02', t: 202402191602, b: 22_100_000, k: 'PDF document' },
      { n: 'Copy of Copy of Signing Rules FINAL.xlsx', d: '2 July 2026 at 14:20', t: 202607021420, b: 3_120_000, k: 'Excel workbook' },
      { n: 'Please read before editing.docx', d: '6 January 2023 at 09:15', t: 202301060915, b: 42_000, k: 'Word document' },
      { n: 'Renewables onboarding tracker.xlsx', d: 'Today at 07:30', t: 202608310730, b: 1_840_000, k: 'Excel workbook' },
      { n: 'Signing Rules FINAL v2.xlsx', d: '3 June 2026 at 16:44', t: 202606031644, b: 3_040_000, k: 'Excel workbook' },
      { n: 'Signing Rules FINAL.xlsx', d: '14 May 2026 at 09:02', t: 202605140902, b: 2_980_000, k: 'Excel workbook' },
      { n: 'Sprint 41 — capacity.xlsx', d: '12 August 2026 at 11:20', t: 202608121120, b: 128_000, k: 'Excel workbook' },
      { n: 'Who owns what.docx', d: '4 February 2025 at 11:11', t: 202502041111, b: 68_000, k: 'Word document' },
      { n: 'xTrade — Steering group', d: '27 August 2026 at 21:40', t: 202608272140, k: 'Folder', go: 'steering' },
    ] },

    steering: { name: 'xTrade — Steering group', items: [
      { n: 'Actions — 14 Aug.docx', d: '14 August 2026 at 17:05', t: 202608141705, b: 38_000, k: 'Word document' },
      { n: "Context layer — steering group (James's comments).pptx", d: '28 August 2026 at 08:02', t: 202608280802, b: 46_400_000, k: 'PowerPoint presentation' },
      { n: 'Context layer — steering group.pptx', d: '27 August 2026 at 21:40', t: 202608272140, b: 44_800_000, k: 'PowerPoint presentation' },
    ] },
  };

  const SIDEBAR = [
    { title: 'Favourites', items: [
      { id: 'recents', name: 'Recents', icon: 'clock' },
      { id: 'desktop', name: 'Desktop', icon: 'desktop' },
      { id: 'documents', name: 'Documents', icon: 'docs' },
      { id: 'downloads', name: 'Downloads', icon: 'down' },
      { id: 'applications', name: 'Applications', icon: 'apps' },
    ] },
    { title: 'Locations', items: [
      { id: 'icloud', name: 'iCloud Drive', icon: 'cloud' },
      { id: 'sharepoint', name: 'Howden SharePoint', icon: 'net' },
    ] },
  ];

  /* Every one of these is a decision from the case study that went the
     other way. The Trash is the honest half of a portfolio. */
  const TRASHED = [
    { n: 'app-per-insurer-architecture.docx', d: '3 April 2025 at 10:22', t: 202504031022, b: 148_000, k: 'Word document' },
    { n: 'clay-500.token', d: 'Yesterday at 16:52', t: 202608301652, b: 940, k: 'Design token' },
    { n: 'Dashboard redesign proposal.fig', d: '18 June 2026 at 15:40', t: 202606181540, b: 12_400_000, k: 'Figma document' },
    { n: 'Placement flow v4 FINAL (3).fig', d: '11 August 2026 at 12:51', t: 202608111251, b: 37_100_000, k: 'Figma document' },
    { n: 'Roadmap Q4 — everything on it.pptx', d: '22 July 2026 at 18:05', t: 202607221805, b: 44_200_000, k: 'PowerPoint presentation' },
    { n: 'Screenshot 2026-08-29 at 11.02.31.png', d: '29 August 2026 at 11:02', t: 202608291102, b: 1_440_000, k: 'PNG image' },
    { n: 'standup-notes-daily.md', d: 'Today at 08:22', t: 202608310822, b: 12_600, k: 'Markdown' },
    { n: 'Untitled folder 3', d: '14 July 2026 at 09:42', t: 202607140942, k: 'Folder', go: 'untitled1' },
    { n: 'xtrade-mcp — third tool.ts', d: '19 August 2026 at 09:41', t: 202608190941, b: 6_100, k: 'TypeScript source' },
  ];

  /* ---------- the shared list --------------------------------------- */

  const UNITS = ['bytes', 'KB', 'MB', 'GB'];
  function fmtSize(b) {
    if (b == null) return '--';
    if (b < 1000) return b + ' bytes';
    let v = b, u = 0;
    while (v >= 1000 && u < UNITS.length - 1) { v /= 1000; u += 1; }
    return (v >= 100 ? Math.round(v) : v.toFixed(1)) + ' ' + UNITS[u];
  }

  const byName = (a, b) => a.n.localeCompare(b.n, 'en', { numeric: true, sensitivity: 'base' });
  const SORTS = {
    n: byName,
    t: (a, b) => a.t - b.t || byName(a, b),
    b: (a, b) => (a.b || 0) - (b.b || 0) || byName(a, b),
    k: (a, b) => a.k.localeCompare(b.k) || byName(a, b),
  };
  /* macOS picks the direction that is useful first: newest and largest
     at the top, names from A. */
  const FIRST_DIR = { n: 1, t: -1, b: -1, k: 1 };

  /* rows need ids for aria-activedescendant, and the two windows are
     on the same page, so the counter is shared */
  let uid = 0;

  /* Builds the toolbar/columns/rows/status stack both apps use.
     `cfg` supplies the date column's label, the toolbar contents and
     what a double-click means; everything else is owned in here. */
  function listView(cfg, win) {
    let rows = [];
    let shown = [];
    let key = 'n';
    let dir = 1;
    let sel = null;
    let query = '';
    let mode = 'list';
    const nodes = new Map();

    const cols = [
      { key: 'n', label: 'Name', cls: 'name' },
      { key: 't', label: cfg.dateLabel, cls: 'date' },
      { key: 'b', label: 'Size', cls: 'size' },
      { key: 'k', label: 'Kind', cls: 'kind' },
    ];

    /* --- columns --- */
    const head = el('div.hiw-fd-head');
    const headCells = new Map();
    for (const c of cols) {
      const cell = el('button.hiw-fd-h.' + c.cls, {
        type: 'button', 'aria-label': 'Sort by ' + c.label,
        onclick: () => sortBy(c.key),
      }, el('span', { text: c.label }), el('span.hiw-fd-caret', { html: CARET }));
      headCells.set(c.key, cell);
      head.append(cell);
    }

    const list = el('div.hiw-fd-list.hiw-scroll', {
      role: 'listbox', tabindex: '0', 'aria-label': cfg.label,
    });
    const empty = el('div.hiw-fd-empty', { hidden: true });
    const status = el('div.hiw-fd-status');
    const tools = el('div.hiw-fd-bar');

    function sortBy(next) {
      if (next === key) dir = -dir;
      else { key = next; dir = FIRST_DIR[key]; }
      paint();
    }

    function select(row) {
      sel = row;
      for (const [r, node] of nodes) {
        const on = r === row;
        node.classList.toggle('sel', on);
        node.setAttribute('aria-selected', String(on));
      }
      /* the listbox keeps the focus and points at the selected row,
         so arrow keys read out without every row being a tab stop */
      const node = nodes.get(row);
      if (node) list.setAttribute('aria-activedescendant', node.id);
      else list.removeAttribute('aria-activedescendant');
      if (cfg.onSelect) cfg.onSelect(row);
      paintStatus();
    }

    function paintStatus() {
      const n = shown.length;
      const items = n === 1 ? '1 item' : `${n} items`;
      const of = sel && shown.includes(sel) ? `, 1 of ${n} selected` : '';
      status.textContent = items + of + (cfg.available ? `, ${cfg.available} available` : '');
    }

    function move(step) {
      if (!shown.length) return;
      const i = shown.indexOf(sel);
      const next = shown[Math.max(0, Math.min(shown.length - 1, (i < 0 ? 0 : i + step)))];
      select(next);
      const node = nodes.get(next);
      if (node) node.scrollIntoView({ block: 'nearest' });
    }

    list.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if ((e.key === 'Enter' || e.key === ' ') && sel) { e.preventDefault(); if (cfg.onOpen) cfg.onOpen(sel); }
    });

    function paint() {
      const q = query.trim().toLowerCase();
      shown = (q ? rows.filter((r) => r.n.toLowerCase().includes(q)) : rows.slice())
        .sort((a, b) => SORTS[key](a, b) * dir);

      for (const [k, cell] of headCells) {
        const on = k === key;
        cell.classList.toggle('on', on);
        cell.classList.toggle('desc', on && dir < 0);
      }

      nodes.clear();
      const frag = document.createDocumentFragment();
      for (const r of shown) {
        const node = el('div.hiw-fd-row', {
          role: 'option', id: 'hiw-fd-r' + (uid += 1), 'aria-selected': String(r === sel),
          onclick: () => select(r),
          ondblclick: () => { select(r); if (cfg.onOpen) cfg.onOpen(r); },
        },
          el('div.hiw-fd-n.name', null,
            el('span.hiw-fd-ic', { html: iconFor(r) }),
            el('span', { text: r.n })),
          el('div.hiw-fd-c.date', { text: r.d }),
          el('div.hiw-fd-c.size', { text: r.go === undefined ? fmtSize(r.b) : '--' }),
          el('div.hiw-fd-c.kind', { text: r.k }));
        if (r === sel) node.classList.add('sel');
        nodes.set(r, node);
        frag.append(node);
      }
      list.replaceChildren(frag);
      list.classList.toggle('icons', mode === 'icon');
      head.hidden = mode === 'icon';

      const selNode = nodes.get(sel);
      if (selNode) list.setAttribute('aria-activedescendant', selNode.id);
      else list.removeAttribute('aria-activedescendant');

      const blank = !shown.length;
      empty.hidden = !blank;
      if (blank) {
        empty.replaceChildren(
          el('span', { html: q ? FOLDER_BIG : cfg.emptyIcon || FOLDER_BIG }),
          el('b', { text: q ? 'No results' : cfg.emptyTitle }),
          el('p', { text: q ? `Nothing here matches “${query.trim()}”.` : cfg.emptyNote }));
      }
      paintStatus();
    }

    /* --- view mode and sort, both live in the toolbar --- */
    const segs = new Map();
    const seg = el('div.hiw-fd-seg', { role: 'group', 'aria-label': 'View' },
      [['icon', 'as Icons', VIEW_ICON], ['list', 'as List', VIEW_LIST]].map(([m, label, glyph]) => {
        const b = el('button.hiw-fd-segb', {
          type: 'button', 'aria-label': 'View ' + label, 'aria-pressed': String(m === 'list'),
          html: glyph,
          onclick: () => {
            mode = m;
            for (const [id, node] of segs) {
              node.classList.toggle('on', id === m);
              node.setAttribute('aria-pressed', String(id === m));
            }
            paint();
          },
        });
        if (m === 'list') b.classList.add('on');
        segs.set(m, b);
        return b;
      }));

    const menu = el('div.hiw-fd-pop', { hidden: true, role: 'menu' },
      cols.map((c) => el('button', {
        type: 'button', role: 'menuitem',
        onclick: () => { sortBy(c.key); menu.hidden = true; },
      }, el('span.hiw-fd-mtick', { html: TICK }), el('span', { text: c.label }))));
    const sortBtn = el('button.hiw-fd-tool', {
      type: 'button', 'aria-label': 'Sort', 'aria-haspopup': 'true', 'aria-expanded': 'false',
      html: SORT_GLYPH,
      onclick: () => {
        menu.hidden = !menu.hidden;
        sortBtn.setAttribute('aria-expanded', String(!menu.hidden));
        for (const [i, c] of cols.entries()) menu.children[i].classList.toggle('on', c.key === key);
      },
    });
    const sortWrap = el('div.hiw-fd-sort', null, sortBtn, menu);

    const find = el('input.hiw-fd-q', {
      type: 'search', placeholder: 'Search', 'aria-label': 'Search ' + cfg.label,
      oninput: (e) => { query = e.target.value; paint(); },
      /* Escape clears the field, as it does in Finder. Without the
         stop it would reach the desktop and minimise the window. */
      onkeydown: (e) => {
        if (e.key !== 'Escape' || !find.value) return;
        e.stopPropagation();
        find.value = '';
        query = '';
        paint();
      },
    });

    tools.append(...(cfg.lead || []), seg, sortWrap,
      el('span.hiw-fd-spacer'), ...(cfg.trail || []), find);

    const main = el('div.hiw-fd-main', null, tools, head,
      el('div.hiw-fd-stage', null, list, empty), status);

    /* the menu has no backdrop of its own — dismiss it on the next
       press anywhere in the window that is not the menu itself */
    main.addEventListener('pointerdown', (e) => {
      if (menu.hidden || sortWrap.contains(e.target)) return;
      menu.hidden = true;
      sortBtn.setAttribute('aria-expanded', 'false');
    }, true);
    main.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) {
        e.stopPropagation();
        menu.hidden = true;
        sortBtn.setAttribute('aria-expanded', 'false');
      }
    });

    return {
      node: main,
      get selected() { return sel; },
      /* the one way rows change: navigating, putting back, emptying */
      setRows(next, preferred) {
        rows = next;
        sel = null;
        if (preferred) { key = preferred[0]; dir = preferred[1]; }
        if (cfg.onSelect) cfg.onSelect(null);
        list.scrollTop = 0;
        paint();
      },
      nodeFor(row) { return nodes.get(row); },
    };
  }

  /* ---------- Finder ------------------------------------------------
     A folder is a key into FOLDERS and history is a stack of those
     keys, so back is an index and nothing has to be re-derived. */
  function finderApp(data, win) {
    const available = (data && data.available) || '402.1 GB';
    const history = ['recents'];
    let at = 0;

    const back = el('button.hiw-fd-nav', {
      type: 'button', 'aria-label': 'Back', disabled: true,
      html: svg('0 0 16 16', '<path d="M10 3.4 5.4 8l4.6 4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>', 'width="15" height="15"'),
      onclick: () => { if (at > 0) { at -= 1; show(); } },
    });
    const fwd = el('button.hiw-fd-nav', {
      type: 'button', 'aria-label': 'Forward', disabled: true,
      html: svg('0 0 16 16', '<path d="M6 3.4 10.6 8 6 12.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>', 'width="15" height="15"'),
      onclick: () => { if (at < history.length - 1) { at += 1; show(); } },
    });

    const view = listView({
      label: 'Files',
      dateLabel: 'Date Modified',
      available,
      emptyIcon: FOLDER_BIG,
      emptyTitle: 'Folder is Empty',
      emptyNote: 'Made in a hurry, named later, never used.',
      lead: [el('div.hiw-fd-navs', null, back, fwd)],
      onOpen: (row) => { if (row.go) go(row.go); },
    }, win);

    const sideButtons = new Map();
    const side = el('div.hiw-fd-side', null, SIDEBAR.map((group) =>
      el('div', null,
        el('div.grp', { text: group.title }),
        group.items.map((it) => {
          const b = el('button.hiw-fd-sf', { type: 'button', onclick: () => go(it.id) },
            el('span', { html: SIDE_ICONS[it.icon] }),
            el('span.hiw-fd-sfn', { text: it.name }));
          sideButtons.set(it.id, b);
          return b;
        }))));

    function show() {
      const id = history[at];
      const folder = FOLDERS[id] || FOLDERS.recents;
      view.setRows(folder.items, folder.sort || ['n', 1]);
      back.disabled = at === 0;
      fwd.disabled = at === history.length - 1;
      for (const [key, b] of sideButtons) b.classList.toggle('on', key === id);
      if (win && win.setTitle) win.setTitle(folder.name);
    }

    function go(id) {
      if (!FOLDERS[id] || history[at] === id) return;
      history.length = at + 1;
      history.push(id);
      at = history.length - 1;
      show();
    }

    show();
    return el('div.hiw-body.hiw-fd', null, side, view.node);
  }

  /* ---------- Trash -------------------------------------------------
     The same list with two more buttons. Put Back and Empty both write
     to one array and re-paint; there is no second copy of the truth. */
  function trashApp(data, win) {
    let items = TRASHED.slice();

    const putBack = el('button.hiw-fd-btn', {
      type: 'button', hidden: true,
      onclick: () => {
        const row = view.selected;
        if (!row) return;
        items = items.filter((r) => r !== row);
        view.setRows(items);
      },
    }, 'Put Back');

    const emptyBtn = el('button.hiw-fd-btn.hiw-fd-btn-strong', {
      type: 'button',
      onclick: () => {
        if (!items.length) return;
        emptyBtn.disabled = true;
        const rows = items.slice();
        items = [];
        if (reduced()) { view.setRows(items); emptyBtn.disabled = false; return; }
        /* stagger the exit so it reads as a pile going out rather than
           a frame dropping, then re-paint into the empty state */
        rows.forEach((r, i) => {
          const node = view.nodeFor(r);
          if (node) win.timers.push(setTimeout(() => node.classList.add('going'), i * 34));
        });
        win.timers.push(setTimeout(() => {
          view.setRows(items);
          emptyBtn.disabled = false;
        }, rows.length * 34 + 240));
      },
    }, 'Empty');

    const view = listView({
      label: 'Trash',
      dateLabel: 'Date Deleted',
      available: (data && data.available) || '402.1 GB',
      emptyIcon: BIN_BIG,
      emptyTitle: 'Trash is Empty',
      emptyNote: 'Every one of these was a real proposal. Deleting them was the work.',
      trail: [putBack, emptyBtn],
      onSelect: (row) => { putBack.hidden = !row; },
    }, win);

    view.setRows(items, ['t', -1]);
    return el('div.hiw-body.hiw-fd', null, view.node);
  }

  /* ---------- styles ------------------------------------------------ */
  style('hiw-finder', `
.hiw .hiw-fd{flex:1;display:flex;min-width:0}
.hiw .hiw-fd-side{
  width:198px;flex:none;padding:10px 0;overflow:auto;
  background:var(--sidebar);
  backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  box-shadow:.5px 0 0 var(--hair);
}
.hiw .hiw-fd-side .grp{
  font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink-3);padding:14px 18px 6px;
}
.hiw .hiw-fd-sf{
  display:flex;align-items:center;gap:9px;
  width:calc(100% - 16px);height:28px;padding:0 10px;margin:1px 8px;
  border-radius:7px;font-size:13px;text-align:left;color:var(--ink);
}
.hiw .hiw-fd-sf svg{flex:none;color:var(--blue);opacity:.92}
.hiw .hiw-fd-sfn{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hiw .hiw-fd-sf:hover{background:var(--fill)}
.hiw .hiw-fd-sf.on{background:var(--fill-2);font-weight:600}

.hiw .hiw-fd-main{flex:1;min-width:0;display:flex;flex-direction:column;background:var(--content)}

/* toolbar */
.hiw .hiw-fd-bar{
  flex:none;height:42px;display:flex;align-items:center;gap:8px;padding:0 12px;
  background:var(--chrome);
  backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  box-shadow:0 .5px 0 var(--hair);
}
.hiw .hiw-fd-spacer{flex:1}
.hiw .hiw-fd-navs{display:flex;gap:2px}
.hiw .hiw-fd-nav,.hiw .hiw-fd-tool{
  width:28px;height:24px;display:grid;place-items:center;
  border-radius:6px;color:var(--ink-2);
}
.hiw .hiw-fd-nav:hover,.hiw .hiw-fd-tool:hover{background:var(--fill);color:var(--ink)}
.hiw .hiw-fd-nav:disabled{opacity:.3;cursor:default;background:none}
.hiw .hiw-fd-seg{display:flex;padding:2px;border-radius:7px;background:var(--fill)}
.hiw .hiw-fd-segb{
  width:30px;height:20px;display:grid;place-items:center;
  border-radius:5px;color:var(--ink-2);
}
.hiw .hiw-fd-segb.on{background:var(--content);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.18)}
.hiw .hiw-fd-btn{
  height:24px;padding:0 11px;border-radius:6px;font-size:12.5px;font-weight:500;
  background:var(--fill);color:var(--ink);white-space:nowrap;
}
.hiw .hiw-fd-btn:hover{background:var(--fill-2)}
.hiw .hiw-fd-btn-strong{background:var(--blue);color:#fff}
.hiw .hiw-fd-btn-strong:hover{background:var(--blue-ink)}
.hiw .hiw-fd-btn:disabled{opacity:.45;cursor:default}
.hiw .hiw-fd-q{
  width:150px;height:24px;flex:none;
  border:0;border-radius:6px;padding:0 9px;
  background:var(--fill);color:var(--ink);
  font:inherit;font-size:12.5px;
}
.hiw .hiw-fd-q::placeholder{color:var(--ink-3)}

/* sort menu */
.hiw .hiw-fd-sort{position:relative}
.hiw .hiw-fd-pop{
  position:absolute;top:30px;left:-6px;z-index:8;min-width:180px;padding:5px;
  border-radius:9px;background:var(--raised);
  box-shadow:var(--shadow-off);
}
.hiw .hiw-fd-pop button{
  display:flex;align-items:center;gap:7px;width:100%;height:25px;
  padding:0 8px;border-radius:5px;font-size:13px;text-align:left;
}
.hiw .hiw-fd-pop button:hover{background:var(--blue);color:#fff}
.hiw .hiw-fd-mtick{width:11px;flex:none;opacity:0;display:flex}
.hiw .hiw-fd-pop button.on .hiw-fd-mtick{opacity:1}

/* column headers */
.hiw .hiw-fd-head{
  flex:none;display:flex;height:25px;
  font-size:11.5px;color:var(--ink-2);
  box-shadow:0 .5px 0 var(--line);
}
.hiw .hiw-fd-h{
  display:flex;align-items:center;gap:4px;height:100%;padding:0 8px;
  box-shadow:inset .5px 0 0 var(--hair);
}
.hiw .hiw-fd-h:first-child{box-shadow:none}
.hiw .hiw-fd-h:hover{background:var(--fill)}
.hiw .hiw-fd-h.on{color:var(--ink);font-weight:600}
.hiw .hiw-fd-caret{display:flex;opacity:0;transition:transform .12s ease}
.hiw .hiw-fd-h.on .hiw-fd-caret{opacity:.75}
.hiw .hiw-fd-h.desc .hiw-fd-caret{transform:rotate(180deg)}

/* rows */
.hiw .hiw-fd-stage{position:relative;flex:1;min-height:0;display:flex}
.hiw .hiw-fd-list{flex:1;min-width:0;padding-bottom:8px}
.hiw .hiw-fd-list:focus-visible{outline-offset:-2px}
.hiw .hiw-fd-row{
  display:flex;align-items:center;height:24px;font-size:13px;
  cursor:default;user-select:none;
  transition:opacity .2s ease,transform .2s ease;
}
.hiw .hiw-fd-row:nth-child(even){background:var(--hair)}
.hiw .hiw-fd-row.sel{background:var(--blue);color:#fff}
.hiw .hiw-fd-row.going{opacity:0;transform:translateX(16px) scale(.98)}
.hiw .hiw-fd-n{
  flex:1;min-width:0;display:flex;align-items:center;gap:7px;padding:0 8px;
}
.hiw .hiw-fd-n span:last-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.hiw .hiw-fd-ic{display:flex;flex:none;color:var(--ink-2)}
.hiw .hiw-fd-row.sel .hiw-fd-ic{color:rgba(255,255,255,.9)}
.hiw .hiw-fd-c{
  flex:none;padding:0 8px;font-size:12px;color:var(--ink-2);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.hiw .hiw-fd-row.sel .hiw-fd-c{color:rgba(255,255,255,.82)}
.hiw .hiw-fd-c.date,.hiw .hiw-fd-h.date{width:174px}
.hiw .hiw-fd-c.size,.hiw .hiw-fd-h.size{width:88px;justify-content:flex-end;text-align:right;font-variant-numeric:tabular-nums}
.hiw .hiw-fd-c.kind,.hiw .hiw-fd-h.kind{width:150px}
.hiw .hiw-fd-h.name{flex:1;min-width:0}

/* icon view — same rows, laid out as a grid */
.hiw .hiw-fd-list.icons{
  display:flex;flex-wrap:wrap;align-content:flex-start;gap:4px;padding:14px 10px;
}
.hiw .hiw-fd-list.icons .hiw-fd-row{
  width:104px;height:auto;background:none;padding:8px 4px;border-radius:8px;
}
.hiw .hiw-fd-list.icons .hiw-fd-row.sel{background:var(--sel)}
.hiw .hiw-fd-list.icons .hiw-fd-c{display:none}
.hiw .hiw-fd-list.icons .hiw-fd-n{flex-direction:column;gap:7px;padding:0}
.hiw .hiw-fd-list.icons .hiw-fd-ic{color:var(--ink-3)}
.hiw .hiw-fd-list.icons .hiw-fd-ic svg{width:46px;height:46px}
.hiw .hiw-fd-list.icons .hiw-fd-n span:last-child{
  max-width:100%;font-size:11.5px;line-height:1.35;text-align:center;
  white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
}
.hiw .hiw-fd-list.icons .hiw-fd-row.sel .hiw-fd-n span:last-child{color:var(--ink)}

/* empty state */
.hiw .hiw-fd-empty{
  position:absolute;inset:0;display:grid;place-content:center;justify-items:center;
  gap:8px;padding:24px;text-align:center;color:var(--ink-3);
}
.hiw .hiw-fd-empty svg{opacity:.32}
.hiw .hiw-fd-empty b{font-size:15px;font-weight:600;color:var(--ink-2);margin-top:6px}
.hiw .hiw-fd-empty p{margin:0;font-size:12.5px;max-width:34ch;line-height:1.5}

/* status bar */
.hiw .hiw-fd-status{
  flex:none;height:24px;display:flex;align-items:center;justify-content:center;
  font-size:11.5px;color:var(--ink-2);
  background:var(--chrome);
  backdrop-filter:var(--glass);-webkit-backdrop-filter:var(--glass);
  box-shadow:0 -.5px 0 var(--hair);
}

/* a narrow window drops columns before it squeezes the name, which is
   the only column anybody scans */
@container (max-width:760px){.hiw .hiw-fd-c.kind,.hiw .hiw-fd-h.kind{display:none}}
@container (max-width:640px){.hiw .hiw-fd-side{display:none}}
@container (max-width:520px){
  .hiw .hiw-fd-c.size,.hiw .hiw-fd-h.size{display:none}
  .hiw .hiw-fd-q{width:104px}
}
@media (prefers-reduced-motion:reduce){
  .hiw .hiw-fd-row,.hiw .hiw-fd-caret{transition:none}
}
`);

  self.HowIWork.register('finder', {
    name: 'Finder',
    short: 'Finder',
    menus: ['File', 'Edit', 'View', 'Go', 'Window', 'Help'],
    bg: 'linear-gradient(180deg,#4ab5f7,#1b7ce6)',
    glyph: svg('0 0 54 54',
      '<path d="M0 0h27v54H0z" fill="#0c62c6" fill-opacity=".5"/>'
      + '<path d="M27 0v54" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/>'
      + '<path d="M11 19c2.2 0 4 2.2 4 5s-1.8 5-4 5M43 19c-2.2 0-4 2.2-4 5s1.8 5 4 5" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>'
      + '<path d="M15 38.4c3.3 3 7.6 4.6 12 4.6s8.7-1.6 12-4.6" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>',
      'width="54" height="54"'),
    render: (data, win) => finderApp(data, win),
  });

  self.HowIWork.register('trash', {
    name: 'Finder',
    short: 'Trash',
    menus: ['File', 'Edit', 'View', 'Go', 'Window', 'Help'],
    bg: 'linear-gradient(180deg,rgba(240,242,246,.92),rgba(196,202,212,.92))',
    glyph: svg('0 0 32 32',
      '<path d="M8.5 10h15l-1.4 15.5a2 2 0 0 1-2 1.8h-8.2a2 2 0 0 1-2-1.8z" stroke="#6b7180" stroke-width="1.7"/>'
      + '<path d="M6.5 9.2h19M13 9v-2a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 19 7v2" stroke="#6b7180" stroke-width="1.7" stroke-linecap="round"/>',
      'width="32" height="32"'),
    render: (data, win) => trashApp(data, win),
  });
})();
