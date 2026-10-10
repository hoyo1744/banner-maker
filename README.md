# Banner Maker

velog 썸네일용 배너(700×350 PNG)를 브라우저에서 만드는 정적 웹앱입니다.
[godori님의 velog 배너 생성기](https://velog.io/@godori/banner-maker)를 바탕으로 다시 만들었습니다.

- 텍스트(여러 줄), 배경색·글자색(팔레트, hex 입력), 한글 웹폰트 9종, 글자 크기, 배경 이미지
- 서버가 없습니다. 업로드한 이미지는 브라우저 밖으로 나가지 않습니다.
- 폰트는 모두 SIL OFL 1.1입니다([FONTS.md](./FONTS.md)).

## 개발

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # 단위 테스트
npm run build   # dist/ 생성
```

## Netlify 배포

### 방법 1. GitHub 연동 (push하면 자동 배포)

1. https://app.netlify.com 에 GitHub 계정으로 로그인합니다.
2. **Add new site → Import an existing project → GitHub**를 선택합니다.
3. `banner-maker` 저장소를 고릅니다. 빌드 설정은 `netlify.toml`에서 자동으로 읽습니다.
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Deploy**를 누르면 `https://<랜덤이름>.netlify.app` 주소가 생깁니다.
   - 주소를 바꾸려면 **Site configuration → Change site name**에서 바꿉니다.
5. 이후 `main`에 push할 때마다 자동으로 다시 배포됩니다.

### 방법 2. CLI로 직접 배포

```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist   # 처음 실행하면 새 사이트를 만들지 물어봅니다
```

## Vercel 배포

https://vercel.com/new 에서 저장소를 Import합니다. Vite를 자동으로 인식하므로 추가 설정이 필요 없습니다.
