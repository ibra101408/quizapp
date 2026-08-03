# ---- Stage 1: Build the app ----
# We use a Maven image to compile and package the Java app
FROM maven:3.9.6-eclipse-temurin-21 AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Maven config first (for faster rebuilds)
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Download dependencies (cached unless pom.xml changes)
RUN mvn dependency:go-offline -B

# Copy the source code
COPY src ./src

# Build the app, skipping tests (tests run in CI separately)
RUN mvn package -DskipTests

# ---- Stage 2: Run the app ----
# Use a lightweight Java image just to run the built app
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy the built JAR file from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose port 8081 (Spring Boot default)
EXPOSE 8081

# Start the app
ENTRYPOINT ["java", "-jar", "app.jar"]