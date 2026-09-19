FAMILY v003 변경파일

이번 버전은 v002 기능을 그대로 유지하면서
Cloudflare D1 바인딩이 배포 때 사라지지 않도록 wrangler.toml을 추가했습니다.

포함 파일:
- public/app.js
- worker.js
- wrangler.toml
- README.txt

wrangler.toml 설정:
- Worker name: family
- D1 binding: DB
- D1 database: family-db
- D1 database_id: a07cc38f-4c8e-4662-b4c3-82c30bb8756b
- Assets: ./public

GitHub colra2026-start/family 저장소에만 올리세요.
기존 colra 저장소에는 올리지 마세요.

이후 배포 명령:
npx wrangler deploy
