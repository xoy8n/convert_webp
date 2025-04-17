FROM node:18-alpine

# 작업 디렉토리 생성
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 호스트 시스템의 홈 디렉토리를 컨테이너 내부에 마운트
VOLUME ["/Users:/Users"]

# 서버 실행
CMD ["node", "dist/index.js"] 