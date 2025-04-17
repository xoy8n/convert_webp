# WebP 변환 MCP 서버

이 프로젝트는 이미지 파일을 WebP 형식으로 변환하는 Model Context Protocol(MCP) 서버입니다.

## 기능

- PNG, JPG, JPEG 파일을 WebP로 변환
- 개별 파일 또는 여러 파일 일괄 변환
- Base64 인코딩된 이미지 변환
- 무손실/손실 압축 지원
- 품질 조정 지원

## Smithery 배포 방법

1. Smithery에서 서버 추가 또는 기존 서버 선택
2. 배포 탭 접근 (인증된 소유자만 가능)
3. 배포 구성 및 배포 진행

## 로컬 개발 방법

### 필수 조건

- Node.js 16+ 설치
- npm 또는 yarn 설치

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 빌드
npm run build

# 프로덕션 모드 실행
npm start
```

## MCP 도구 목록

### 1. convert_to_webp

개별 이미지 파일을 WebP로 변환합니다.

**파라미터:**

- `image_path`: 변환할 이미지 파일 경로 (필수)
- `quality`: WebP 품질 (0-100, 기본값: 80)
- `lossless`: 무손실 압축 사용 여부 (기본값: false)
- `output_dir`: 출력 디렉토리 (기본값: 원본 위치)
- `keep_original`: 원본 파일 유지 여부 (기본값: false)

### 2. batch_convert_to_webp

여러 이미지 파일을 WebP로 일괄 변환합니다.

**파라미터:**

- `image_paths`: 변환할 이미지 파일 경로 리스트 (필수)
- `quality`: WebP 품질 (0-100, 기본값: 80)
- `lossless`: 무손실 압축 사용 여부 (기본값: false)
- `output_dir`: 출력 디렉토리 (기본값: 원본 위치)
- `keep_original`: 원본 파일 유지 여부 (기본값: false)

### 3. convert_base64_to_webp

Base64로 인코딩된 이미지를 WebP로 변환합니다.

**파라미터:**

- `base64_image`: Base64로 인코딩된 이미지 데이터 (필수)
- `output_path`: 저장할 파일 경로 (필수)
- `quality`: WebP 품질 (0-100, 기본값: 80)
- `lossless`: 무손실 압축 사용 여부 (기본값: false)

## 라이센스

MIT
