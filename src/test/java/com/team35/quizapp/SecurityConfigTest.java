package com.team35.quizapp;

import liquibase.integration.spring.SpringLiquibase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "DB_ADMIN_USERNAME=sa",
    "DB_ADMIN_PASSWORD=",
    "spring.security.oauth2.client.registration.google.client-id=test",
    "spring.security.oauth2.client.registration.google.client-secret=test"
})
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    SpringLiquibase springLiquibase;

    @Test
    void unauthenticated_publicEndpoint_isNotRedirected() throws Exception {
        // POST /api/users is permitAll - security lets it through (400 = bad request body, not a security block)
        mockMvc.perform(post("/api/users")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unauthenticated_protectedEndpoint_isRedirectedToOAuth2() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    @WithMockUser
    void authenticated_publicEndpoint_isAccessible() throws Exception {
        // With any authenticated user, public endpoint still works (400 = bad body, not security block)
        mockMvc.perform(post("/api/users")
                .contentType("application/json")
                .content("{}"))
                .andExpect(status().isBadRequest());
    }
}