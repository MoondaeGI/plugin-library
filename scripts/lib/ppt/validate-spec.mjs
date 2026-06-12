// scripts/lib/ppt/validate-spec.mjs
// 덱 스펙(spec.json)의 시스템 경계 검증. 레이아웃별 필드 계약의 단일 권위.

export class SpecValidationError extends Error {
  constructor(errors) {
    super(`덱 스펙 검증 실패:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
    this.name = 'SpecValidationError';
    this.errors = errors;
  }
}

// field 타입: text(상한 글자수) | bullets(최대 개수, 항목 상한) | chartData | tableData | path
export const LAYOUTS = {
  title:   { required: { title: { type: 'text', max: 40 } },
             optional: { subtitle: { type: 'text', max: 60 }, date: { type: 'text', max: 20 } } },
  section: { required: { title: { type: 'text', max: 30 } },
             optional: { subtitle: { type: 'text', max: 60 } } },
  bullets: { required: { title: { type: 'text', max: 40 },
                         bullets: { type: 'bullets', maxItems: 7, maxLen: 90 } },
             optional: {} },
  'two-col': { required: { title: { type: 'text', max: 40 },
                           leftTitle: { type: 'text', max: 30 },
                           leftBullets: { type: 'bullets', maxItems: 5, maxLen: 70 },
                           rightTitle: { type: 'text', max: 30 },
                           rightBullets: { type: 'bullets', maxItems: 5, maxLen: 70 } },
               optional: {} },
  chart:   { required: { title: { type: 'text', max: 40 },
                         chartType: { type: 'enum', values: ['bar', 'line', 'pie'] },
                         data: { type: 'chartData' } },
             optional: {} },
  table:   { required: { title: { type: 'text', max: 40 },
                         columns: { type: 'bullets', maxItems: 6, maxLen: 20 },
                         rows: { type: 'tableData', maxRows: 10, maxCellLen: 40 } },
             optional: {} },
  image:   { required: { path: { type: 'path' } },
             optional: { title: { type: 'text', max: 40 }, caption: { type: 'text', max: 80 } } },
  closing: { required: { title: { type: 'text', max: 40 } },
             optional: { subtitle: { type: 'text', max: 60 } } },
};

const NOTES_MAX = 2000;

function checkField(errors, where, key, rule, value) {
  switch (rule.type) {
    case 'text':
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${where}: ${key}는 비어 있지 않은 문자열이어야 합니다`);
      } else if (value.length > rule.max) {
        errors.push(`${where}: ${key}가 ${value.length}자 — 상한 ${rule.max}자 초과`);
      }
      return;
    case 'enum':
      if (!rule.values.includes(value)) {
        errors.push(`${where}: ${key}는 ${rule.values.join('|')} 중 하나여야 합니다 (현재 "${value}")`);
      }
      return;
    case 'bullets':
      if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${where}: ${key}는 비어 있지 않은 배열이어야 합니다`);
        return;
      }
      if (value.length > rule.maxItems) {
        errors.push(`${where}: ${key}가 ${value.length}개 — 상한 ${rule.maxItems}개 초과`);
      }
      value.forEach((item, i) => {
        if (typeof item !== 'string' || item.length > rule.maxLen) {
          errors.push(`${where}: ${key}[${i}]가 문자열 ${rule.maxLen}자 이내가 아닙니다`);
        }
      });
      return;
    case 'chartData':
      if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${where}: data는 비어 있지 않은 배열이어야 합니다`);
        return;
      }
      value.forEach((series, i) => {
        if (!Array.isArray(series?.labels) || !Array.isArray(series?.values)) {
          errors.push(`${where}: data[${i}]에 labels/values 배열이 필요합니다`);
        } else if (series.labels.length !== series.values.length) {
          errors.push(`${where}: data[${i}]의 labels(${series.labels.length})와 values(${series.values.length}) 길이가 다릅니다`);
        }
      });
      return;
    case 'tableData': {
      if (!Array.isArray(value) || value.length === 0) {
        errors.push(`${where}: rows는 비어 있지 않은 배열이어야 합니다`);
        return;
      }
      if (value.length > rule.maxRows) {
        errors.push(`${where}: rows가 ${value.length}행 — 상한 ${rule.maxRows}행 초과`);
      }
      return; // 행 길이 검증은 columns와 함께 validateSpec 본문에서
    }
    case 'path':
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${where}: ${key}는 이미지 파일 경로 문자열이어야 합니다`);
      }
      return;
    default:
      errors.push(`${where}: 알 수 없는 규칙 타입 ${rule.type}`);
  }
}

export function validateSpec(spec) {
  const errors = [];
  if (!spec || typeof spec !== 'object') throw new SpecValidationError(['spec이 객체가 아닙니다']);
  if (typeof spec.theme !== 'string' || spec.theme.trim() === '') errors.push('theme 이름이 필요합니다');
  if (!Array.isArray(spec.slides) || spec.slides.length === 0) {
    errors.push('slides는 비어 있지 않은 배열이어야 합니다');
    throw new SpecValidationError(errors);
  }

  spec.slides.forEach((slide, idx) => {
    const where = `슬라이드 ${idx + 1}`;
    const def = LAYOUTS[slide.layout];
    if (!def) {
      errors.push(`${where}: 알 수 없는 레이아웃 "${slide.layout}" (가능: ${Object.keys(LAYOUTS).join(', ')})`);
      return;
    }
    const fields = slide.fields ?? {};
    for (const [key, rule] of Object.entries(def.required)) {
      if (!(key in fields)) errors.push(`${where}: 필수 필드 ${key} 누락 (${slide.layout} 레이아웃)`);
      else checkField(errors, where, key, rule, fields[key]);
    }
    for (const [key, rule] of Object.entries(def.optional)) {
      if (key in fields) checkField(errors, where, key, rule, fields[key]);
    }
    const allowed = new Set([...Object.keys(def.required), ...Object.keys(def.optional)]);
    for (const key of Object.keys(fields)) {
      if (!allowed.has(key)) errors.push(`${where}: ${slide.layout} 레이아웃에 없는 필드 ${key}`);
    }
    if (slide.layout === 'table' && Array.isArray(fields.rows) && Array.isArray(fields.columns)) {
      fields.rows.forEach((row, r) => {
        if (!Array.isArray(row) || row.length !== fields.columns.length) {
          errors.push(`${where}: rows[${r}] 길이(${row?.length})가 columns 길이(${fields.columns.length})와 다릅니다`);
        } else {
          row.forEach((cell, c) => {
            if (typeof cell !== 'string' || cell.length > LAYOUTS.table.required.rows.maxCellLen) {
              errors.push(`${where}: rows[${r}][${c}]가 문자열 ${LAYOUTS.table.required.rows.maxCellLen}자 이내가 아닙니다`);
            }
          });
        }
      });
    }
    if ('notes' in slide && (typeof slide.notes !== 'string' || slide.notes.length > NOTES_MAX)) {
      errors.push(`${where}: notes는 문자열 ${NOTES_MAX}자 이내여야 합니다`);
    }
  });

  if (errors.length > 0) throw new SpecValidationError(errors);
}
