# Banner Maker 설계

- 작성일: 2026-10-10
- 참고: [velog 배너 생성기 (godori)](https://velog.io/@godori/banner-maker)

## 1. 목적

velog 썸네일용 배너를 브라우저에서 만들어 PNG로 내려받는 정적 웹앱이다. 원본 서비스가 내려가서 직접 만들어 배포한다. 서버 없이 모든 처리를 브라우저에서 하고, 외부 CDN에도 의존하지 않는다.

## 2. 기능 범위

| 기능 | 내용 |
|---|---|
| 텍스트 | 여러 줄 입력(`\n`으로 줄바꿈), 캔버스 정중앙 정렬. 기본값 `Sample Text` |
| 배경색 | 팔레트와 hex 직접 입력, 미리보기 칩. 처음 열 때 랜덤 색 |
| 글자색 | 배경색과 같은 컨트롤(ColorField)을 재사용. 기본값 `#FFFFFF` |
| 글꼴 | 아래 목록에서 선택. 기본값 Pretendard |
| 글자 크기 | 슬라이더(현재 값 표시), 16~120px, 기본 40px |
| 배경 이미지 | 로컬 파일 업로드, cover 방식으로 채움, 제거 가능. 배경색 위에 그린다 |
| 다운로드 | 700×350 PNG를 `banner.png`로 저장 |

캔버스 크기는 700×350으로 고정한다.

**범위 밖:** 캔버스 크기 변경, 그림자·외곽선, 텍스트 위치 드래그, 로고 이미지, 서버 저장, 분석 스크립트.

## 3. 기술 스택

- Vite, React 19, TypeScript
- `react-colorful`: 색상 팔레트
- 폰트: `pretendard` npm 패키지, `@fontsource/*` 패키지. 빌드 결과물에 포함한다
- Vitest: 단위 테스트
- 배포: Netlify 또는 Vercel. 정적 `dist/` 디렉터리

## 4. 폰트 (SIL Open Font License 1.1)

| 표시 이름 | 패키지 | CSS family |
|---|---|---|
| Pretendard | `pretendard` | `Pretendard` |
| Noto Sans KR | `@fontsource/noto-sans-kr` | `Noto Sans KR` |
| Noto Serif KR | `@fontsource/noto-serif-kr` | `Noto Serif KR` |
| 나눔고딕 | `@fontsource/nanum-gothic` | `Nanum Gothic` |
| 나눔명조 | `@fontsource/nanum-myeongjo` | `Nanum Myeongjo` |
| 나눔펜 | `@fontsource/nanum-pen-script` | `Nanum Pen Script` |
| Black Han Sans | `@fontsource/black-han-sans` | `Black Han Sans` |
| Do Hyeon | `@fontsource/do-hyeon` | `Do Hyeon` |
| Jua | `@fontsource/jua` | `Jua` |

- 굵기는 폰트마다 하나만 쓴다. 기본 400이고, Pretendard는 700이다.
- 라이선스 고지는 `FONTS.md`에 둔다.

## 5. 구조

```
src/
├── main.tsx
├── App.tsx                 # BannerState 보유, 레이아웃
├── types.ts                # BannerState
├── lib/
│   ├── fonts.ts            # FONTS 목록, loadFont(font, size, text): Promise<boolean>
│   ├── renderBanner.ts     # renderBanner(ctx, state), 순수 헬퍼(splitLines, coverRect, lineOffsets)
│   ├── image.ts            # validateImageFile, loadImage
│   ├── download.ts         # downloadCanvas(canvas, filename)
│   └── color.ts            # randomColor(), isValidHex(), normalizeHex()
├── components/
│   ├── BannerPreview.tsx   # canvas, state가 바뀌면 폰트 로딩 후 그리기
│   ├── ColorField.tsx      # label, value, onChange: 팔레트, hex 입력, 칩
│   ├── TextField.tsx
│   ├── FontControls.tsx
│   ├── ImageUpload.tsx
│   └── DownloadButton.tsx
└── styles.css
```

```ts
type BannerState = {
  text: string;
  bgColor: string;      // #RRGGBB
  textColor: string;    // #RRGGBB
  fontFamily: string;   // FONTS[].family
  fontSize: number;     // 16~120
  bgImage: HTMLImageElement | null;
};
```

`App`이 `canvasRef`를 만들어 `BannerPreview`와 `DownloadButton`에 prop으로 넘긴다.

## 6. 데이터 흐름

1. 입력이 바뀌면 `App`의 `setState`가 호출된다.
2. `BannerPreview`의 `useEffect`가 `loadFont(fontFamily, fontSize)`를 실행한다.
3. 로딩이 끝나면 `renderBanner(ctx, state)`를 호출한다.
   1. 배경색을 채운다.
   2. `bgImage`가 있으면 `coverRect`로 계산한 영역에 그린다.
   3. 텍스트를 줄 단위로 그린다. `textAlign=center`, `textBaseline=middle`, 줄 높이는 `fontSize × 1.3`이고, 전체 블록을 세로 중앙에 놓는다.
4. 다운로드 버튼을 누르면 `canvas.toBlob`으로 만든 objectURL을 `<a download="banner.png">` 링크로 클릭해 저장하고, URL을 해제한다.

dataURL을 state에 두지 않는다. 그래서 원본에서 생기던 무한 업데이트 문제가 구조적으로 생기지 않는다.

## 7. 에러 처리

- **폰트 로딩**
  - `document.fonts.load()`와 3초 타임아웃을 경쟁시킨다.
  - 실패하거나 시간이 넘으면 `sans-serif`로 먼저 그린다. 나중에 폰트가 도착하면 다시 그린다. 늦게 도착한 폰트는 document.fonts의 loadingdone 이벤트로 감지해 다시 그린다.
  - 로딩 중에는 "폰트 로딩 중…"을 표시한다.
  - effect가 정리될 때 플래그를 세워, 지난 요청의 결과로 다시 그리지 않게 한다.
- **hex 입력**
  - `#RGB`와 `#RRGGBB`만 허용한다. 대소문자는 구분하지 않는다.
  - 유효하면 `#RRGGBB` 대문자로 정규화해 반영한다.
  - 유효하지 않으면 입력창에 빨간 테두리를 표시하고, state는 마지막 유효값을 유지한다.
- **이미지 업로드**
  - `image/*`이고 10MB 이하인 파일만 받는다.
  - 형식이 틀리거나 디코딩에 실패하면 입력창 아래에 안내 문구를 띄운다.
  - 이미지를 교체·제거하거나 컴포넌트가 사라질 때 이전 objectURL을 `URL.revokeObjectURL`로 해제한다.
- **다운로드**: `toBlob`이 null을 돌려주면 `alert`로 실패를 알린다.
- **CORS**: 업로드한 로컬 파일만 쓰므로 캔버스가 오염(tainted)되지 않는다.

## 8. 테스트

Vitest와 jsdom으로 다음을 테스트한다.

- `color.ts`
  - `isValidHex`의 유효·무효 케이스
  - `normalizeHex`의 `#abc` → `#AABBCC` 변환
  - `randomColor`가 형식에 맞는 값을 돌려주는지
- `renderBanner.ts`
  - `splitLines`: 빈 문자열, 연속 개행, 끝 개행
  - `coverRect`: 가로로 긴 이미지와 세로로 긴 이미지의 crop 영역
  - `lineOffsets`: 줄 수에 따른 y 좌표가 세로 중앙에 놓이는지
  - mock ctx로 `renderBanner`를 호출해 `fillRect` → `drawImage` → `fillText` 순서와 호출 횟수를 확인한다

컴포넌트는 `npm run dev`로 띄워 브라우저에서 직접 확인한다. 한글 폰트 각각과 이미지 업로드, 다운로드를 점검한다.

## 9. 배포

- `npm run build`가 `dist/`를 만든다.
- `netlify.toml`
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"
  ```
- Vercel은 Import하면 Vite를 자동으로 인식하므로 설정 파일이 필요 없다.
- README에 두 서비스에 연결하는 방법을 적는다. 계정 연결은 사용자가 직접 한다.

## 10. 기타

- 페이지 하단에 원본 포스팅 출처 링크와 폰트 라이선스(OFL) 문구를 표시한다.
- 레이아웃: 위쪽에 미리보기, 아래쪽에 컨트롤을 둔다. 폭 760px 이하의 단일 컬럼이다. 모바일에서는 캔버스를 CSS로 줄여 보여주고, 내부 해상도는 700×350을 유지한다.
