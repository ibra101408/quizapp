package com.team35.quizapp.dto.websocket;

import java.util.Set;

public record PlayerListMessage(Set<String> players) {}