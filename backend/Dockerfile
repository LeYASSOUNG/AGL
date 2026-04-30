# Build + run Spring Boot (Render, Railway, etc.).
# Contexte Docker attendu : dossier backend/ (Root Directory = backend sur Railway).
# Build local depuis backend/ :
#   docker build -f Dockerfile .
# Railway : lier MySQL et définir JWT_SECRET, CORS_ALLOWED_ORIGINS.

FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /app/target/*.jar /app/app.jar
USER spring:spring
EXPOSE 8080
ENV JAVA_OPTS=""
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
