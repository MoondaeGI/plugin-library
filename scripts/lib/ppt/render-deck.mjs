// scripts/lib/ppt/render-deck.mjs
// spec.json + theme.json → deck.pptx (PptxGenJS). 결정적 렌더 — 같은 입력, 같은 출력.
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';
import { validateSpec } from './validate-spec.mjs';
import { loadTheme } from './load-theme.mjs';

export class DeckDirError extends Error {
  constructor(deckDir) {
    super(`${deckDir}에 spec.json이 없습니다. ppt-plan → ppt-create 순서로 진행했는지 확인하세요.`);
    this.name = 'DeckDirError';
  }
}

// image 레이아웃의 파일이 실제로 없을 때. 모듈 컨벤션(커스텀 에러)에 맞춤 — 호출/테스트가 타입으로 잡을 수 있게 (코드 리뷰 Important).
export class ImageNotFoundError extends Error {
  constructor(imgPath) {
    super(`image 슬라이드의 파일이 없습니다: ${imgPath}`);
    this.name = 'ImageNotFoundError';
  }
}

const FONT = (theme, kind) => theme.fonts[kind] ?? theme.fonts.body;

function addPlaceholderText(slide, theme, ph, text, extra = {}) {
  slide.addText(text, {
    x: ph.x, y: ph.y, w: ph.w, h: ph.h,
    fontSize: ph.fontSize, bold: ph.bold ?? false,
    color: ph.color ?? theme.colors.text,
    fontFace: ph.bold ? FONT(theme, 'heading') : FONT(theme, 'body'),
    fit: 'shrink', valign: 'top', ...extra,
  });
}

function bulletsText(items) {
  return items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } }));
}

// 레이아웃별 채움 함수 — placeholders는 텍스트, contentBox는 차트/표/이미지
const RENDERERS = {
  title(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    if (f.subtitle) addPlaceholderText(slide, theme, L.placeholders.subtitle, f.subtitle);
    if (f.date) addPlaceholderText(slide, theme, L.placeholders.date, f.date);
  },
  section(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    if (f.subtitle) addPlaceholderText(slide, theme, L.placeholders.subtitle, f.subtitle);
  },
  bullets(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    addPlaceholderText(slide, theme, L.placeholders.body, bulletsText(f.bullets));
  },
  'two-col'(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    addPlaceholderText(slide, theme, L.placeholders.leftTitle, f.leftTitle);
    addPlaceholderText(slide, theme, L.placeholders.leftBullets, bulletsText(f.leftBullets));
    addPlaceholderText(slide, theme, L.placeholders.rightTitle, f.rightTitle);
    addPlaceholderText(slide, theme, L.placeholders.rightBullets, bulletsText(f.rightBullets));
  },
  chart(slide, f, L, theme, pptx) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    const kind = { bar: pptx.charts.BAR, line: pptx.charts.LINE, pie: pptx.charts.PIE }[f.chartType];
    slide.addChart(kind, f.data, {
      ...L.contentBox,
      chartColors: [theme.colors.primary, theme.colors.accent, theme.colors.muted],
      showLegend: f.data.length > 1, legendPos: 'b', showValue: true,
    });
  },
  table(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    const header = f.columns.map((c) => ({
      text: c, options: { bold: true, color: 'FFFFFF', fill: { color: theme.colors.primary } },
    }));
    slide.addTable([header, ...f.rows], {
      ...L.contentBox, fontFace: FONT(theme, 'body'), fontSize: 14,
      border: { pt: 0.5, color: theme.colors.muted }, valign: 'middle',
    });
  },
  image(slide, f, L, theme, _pptx, deckDir) {
    if (f.title) addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    const imgPath = path.isAbsolute(f.path) ? f.path : path.resolve(deckDir, f.path);
    if (!existsSync(imgPath)) throw new ImageNotFoundError(imgPath);
    slide.addImage({ path: imgPath, ...L.contentBox, sizing: { type: 'contain', w: L.contentBox.w, h: L.contentBox.h } });
    if (f.caption) addPlaceholderText(slide, theme, L.placeholders.caption, f.caption, { align: 'center' });
  },
  closing(slide, f, L, theme) {
    addPlaceholderText(slide, theme, L.placeholders.title, f.title);
    if (f.subtitle) addPlaceholderText(slide, theme, L.placeholders.subtitle, f.subtitle);
  },
};

export async function renderDeck(deckDir, { envPath, env } = {}) {
  const specPath = path.join(deckDir, 'spec.json');
  if (!existsSync(specPath)) throw new DeckDirError(deckDir);
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  validateSpec(spec);
  const { theme, themeDir } = loadTheme(spec.theme, { envPath, env });

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'WIDE', width: 13.333, height: 7.5 });
  pptx.layout = 'WIDE';

  for (const slideSpec of spec.slides) {
    const L = theme.layouts[slideSpec.layout];
    const slide = pptx.addSlide();
    if (L.background) slide.background = { path: path.resolve(themeDir, L.background) };
    else slide.background = { color: L.backgroundColor ?? theme.colors.background };
    RENDERERS[slideSpec.layout](slide, slideSpec.fields, L, theme, pptx, deckDir);
    if (slideSpec.notes) slide.addNotes(slideSpec.notes);
  }

  const outPath = path.join(deckDir, 'deck.pptx');
  await pptx.writeFile({ fileName: outPath });
  return outPath;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const deckDir = process.argv[2];
  if (!deckDir) {
    process.stderr.write('사용법: node scripts/lib/ppt/render-deck.mjs <덱 디렉터리>\n');
    process.exit(1);
  }
  renderDeck(path.resolve(deckDir))
    .then((out) => process.stdout.write(out + '\n'))
    .catch((err) => { process.stderr.write(err.message + '\n'); process.exit(1); });
}
