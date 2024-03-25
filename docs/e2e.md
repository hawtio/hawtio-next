# Running E2E tests locally

This document briefly describes how to run the [E2E test suite](https://github.com/hawtio/hawtio/tree/4.x/tests/hawtio-test-suite) from the Hawtio main project on the hawtio-next during development.

## Run `@hawtio/react` app

In terminal 1:

```console
yarn install
yarn start
```

## Run E2E test suite from `hawtio/hawtio`

Go to [hawtio/hawtio](https://github.com/hawtio/hawtio) project.

### Quarkus

#### Run target Quarkus application

In terminal 2:

```console
mvn clean install -DskipTests -Pe2e
mvn package -Pe2e -pl tests/quarkus
java -jar tests/quarkus/target/quarkus-app/quarkus-run.jar
```

#### Run the test suite for Quarkus

In terminal 3:

```console
mvn install -Pe2e,e2e-quarkus -pl tests/hawtio-test-suite \
  -Dhawtio-next-ci \
  -Dlocal-app=true \
  -Dio.hawt.test.url=http://localhost:3000/hawtio \
  -Dio.hawt.test.app.connect.url=http://localhost:8080/hawtio/jolokia
```

### Spring Boot

#### Run target Spring Boot application

In terminal 2:

```console
mvn clean install -DskipTests -Pe2e
mvn spring-boot:run -Pe2e -pl tests/springboot
```

#### Run the test suite for Spring Boot

In terminal 3:

```console
mvn install -Pe2e,e2e-springboot -pl tests/hawtio-test-suite \
  -Dhawtio-next-ci \
  -Dlocal-app=true \
  -Dio.hawt.test.url=http://localhost:3000/hawtio \
  -Dio.hawt.test.app.connect.url=http://localhost:10001/actuator/hawtio/jolokia
```
