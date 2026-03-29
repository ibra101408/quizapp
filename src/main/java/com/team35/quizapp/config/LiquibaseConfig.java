package com.team35.quizapp.config;

import liquibase.integration.spring.SpringLiquibase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

@Configuration
public class LiquibaseConfig {

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${DB_ADMIN_USERNAME:postgres}")
    private String adminUsername;

    @Value("${DB_ADMIN_PASSWORD:postgres}")
    private String adminPassword;

    @Bean
    public SpringLiquibase liquibase() {
        DriverManagerDataSource adminDataSource = new DriverManagerDataSource();
        adminDataSource.setUrl(url);
        adminDataSource.setUsername(adminUsername);
        adminDataSource.setPassword(adminPassword);

        SpringLiquibase liquibase = new SpringLiquibase();
        liquibase.setDataSource(adminDataSource);
        liquibase.setChangeLog("classpath:db/changelog/db.changelog-master.yaml");
        liquibase.setContexts("dev");
        return liquibase;
    }
}
